"""Ecotricity reader — produces three JSON outputs from the Ecotricity master workbook.

- electricity_monthly.json: per-site monthly HH/NHH/Gas + landlord/void split + CY25 totals
- mpan_register.json:      per-site list of MPANs with classification + CY25 kWh
- reconciliation.json:     per-site Eco vs arbnco + portfolio totals + void summary

All three outputs share the same source workbook, so they're built in one pass for
performance. Each output function is independent and re-runnable.

Phase 1A — landlord/void split for monthly electricity uses the pragmatic apportionment
approach: take the CY25 landlord/void kWh ratio from MPAN Register and apply it to each
month's HH+NHH total. Documented in docs/phase-1a-ecotricity-structure.md.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from openpyxl import load_workbook


# ----- Site name → canonical ID -------------------------------------------

# The Site x Month Summary tab uses display names. Map them to canonical kebab-case
# IDs (matching MPAN Register's Site_ID column). Includes 2 dev sites not in the
# canonical Phase 0 site list.
_DISPLAY_TO_ID = {
    "Austin Heath": "austin-heath",
    "Gifford Lea": "gifford-lea",
    "Bramshott Place": "bramshott-place",
    "Millbrook Village": "millbrook-village",
    "Durrants Village": "durrants-village",
    "Great Alne Park": "great-alne-park",
    "Ledian Gardens": "ledian-gardens",
    "Elderswell": "elderswell",
    "Millfield Green": "millfield-green",
    "Ampfield Meadows": "ampfield-meadows",
    "Blendworth Hills": "blendworth-hills",
    "Sonning Common": "sonning-common",
    "Edwalton Office": "edwalton-office",
    "Edenbridge (dev)": "edenbridge-dev",
    "Little Mount Lake (dev)": "little-mount-lake-dev",
    # Variants observed in the workbook
    "Edenbridge": "edenbridge-dev",
    "Little Mount Lake": "little-mount-lake-dev",
}


def _resolve_eco_site(name: str | None) -> str | None:
    if name is None:
        return None
    return _DISPLAY_TO_ID.get(str(name).strip())


# ----- coercion -----------------------------------------------------------

def _to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _to_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def _to_str(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


# ----- workbook lookup ----------------------------------------------------

def find_workbook(source_data: Path) -> Path:
    candidates = list(source_data.glob("*CA-X_1001b*.xlsx"))
    if not candidates:
        raise FileNotFoundError(f"No Ecotricity workbook (CA-X_1001b*) in {source_data}")
    return candidates[0]


# ----- shared helpers across the three readers ----------------------------

# Column 3 (Oct 24) through column 17 (Dec 25) = 15 months
_MONTH_COLS = list(range(3, 18))
_MONTH_LABELS = [
    "2024-10", "2024-11", "2024-12",
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
]
assert len(_MONTH_COLS) == 15 and len(_MONTH_LABELS) == 15


def _landlord_void_ratios(wb, log: list[str]) -> dict[str, dict[str, float]]:
    """Sum landlord vs void CY25 kWh per site from MPAN Register. Used for monthly
    apportionment in electricity_monthly.json.

    Returns: {site_id: {"landlord_elec": float, "void_elec": float, "landlord_gas": float}}
    """
    ws = wb["MPAN Register"]
    out: dict[str, dict[str, float]] = {}
    for r in range(5, ws.max_row + 1):
        site_id = _to_str(ws.cell(r, 2).value)
        if not site_id:
            continue
        mpan_type = _to_str(ws.cell(r, 4).value) or ""
        category = _to_str(ws.cell(r, 10).value) or ""
        cy25 = _to_float(ws.cell(r, 6).value) or 0.0

        bucket = out.setdefault(site_id, {"landlord_elec": 0.0, "void_elec": 0.0, "landlord_gas": 0.0})
        if mpan_type == "Gas":
            # Gas: treat all as landlord (Phase 1A assumption — none of the gas MPANs are voids)
            bucket["landlord_gas"] += cy25
        else:
            # Electricity (HH or NHH)
            cat_lower = category.lower()
            if cat_lower.startswith("landlord") or cat_lower.startswith("construction"):
                bucket["landlord_elec"] += cy25
            elif cat_lower.startswith("void") or cat_lower.startswith("inactive") or "resident" in cat_lower:
                # "Resident or Void" → bucket as void (conservative: still being billed to Westbrook)
                bucket["void_elec"] += cy25
            else:
                # Unknown category — bucket into landlord as a fallback; log
                log.append(f"  [Ecotricity] Unknown MPAN category {category!r} for site {site_id} — bucketed as landlord_elec")
                bucket["landlord_elec"] += cy25
    return out


# ===== Output 1: electricity_monthly.json =================================

def read_electricity_monthly(wb, log: list[str]) -> dict[str, dict]:
    log.append("")
    log.append("[Ecotricity > Site x Month Summary] Reading monthly electricity")

    if "Site x Month Summary" not in wb.sheetnames:
        log.append("  ERROR: Site x Month Summary sheet missing")
        return {}

    ratios = _landlord_void_ratios(wb, log)

    ws = wb["Site x Month Summary"]
    # Layout: header r4; per site = 4 data rows (HH, NHH, Gas, TOTAL) + 1 blank
    out: dict[str, dict] = {}

    # Scan looking for site rows. A site row starts at row N where col 1 has a site name
    # and col 2 = "HH". The next two rows are NHH and Gas; row N+3 is TOTAL (skip);
    # row N+4 is blank.
    r = 5
    sites_resolved = 0
    while r <= ws.max_row:
        site_name = _to_str(ws.cell(r, 1).value)
        if site_name is None:
            r += 1
            continue
        site_id = _resolve_eco_site(site_name)
        if site_id is None:
            log.append(f"  [Ecotricity] Unmapped site name in Site x Month Summary: {site_name!r} (r{r})")
            r += 1
            continue

        # Confirm structure: this row is HH, next is NHH, next is Gas
        hh_type = _to_str(ws.cell(r, 2).value)
        nhh_type = _to_str(ws.cell(r + 1, 2).value)
        gas_type = _to_str(ws.cell(r + 2, 2).value)
        if hh_type != "HH" or nhh_type != "NHH" or gas_type != "Gas":
            log.append(f"  [Ecotricity] Unexpected row structure for {site_name!r} at r{r}: HH={hh_type!r}, NHH={nhh_type!r}, Gas={gas_type!r}")
            r += 1
            continue

        # Read per-month values
        monthly = []
        cy25_hh = 0.0
        cy25_nhh = 0.0
        cy25_gas = 0.0
        for i, col in enumerate(_MONTH_COLS):
            hh = _to_float(ws.cell(r, col).value) or 0.0
            nhh = _to_float(ws.cell(r + 1, col).value) or 0.0
            gas = _to_float(ws.cell(r + 2, col).value) or 0.0

            # Apply landlord/void apportionment for electricity (HH + NHH)
            elec = hh + nhh
            site_ratio = ratios.get(site_id, {"landlord_elec": 0.0, "void_elec": 0.0, "landlord_gas": 0.0})
            denom = site_ratio["landlord_elec"] + site_ratio["void_elec"]
            if denom > 0:
                landlord_share = site_ratio["landlord_elec"] / denom
            else:
                landlord_share = 1.0  # all landlord if no electricity at all
            elec_landlord = round(elec * landlord_share, 2)
            elec_void = round(elec * (1 - landlord_share), 2)

            monthly.append({
                "month": _MONTH_LABELS[i],
                "hh": round(hh, 2),
                "nhh": round(nhh, 2),
                "gas": round(gas, 2),
                "elec_landlord": elec_landlord,
                "elec_void": elec_void,
            })

            # Only Jan-Dec 2025 contribute to CY25 totals (months 3-14 in our array = 2025-01 through 2025-12)
            if _MONTH_LABELS[i].startswith("2025-"):
                cy25_hh += hh
                cy25_nhh += nhh
                cy25_gas += gas

        # CY25 totals from the workbook's own CY25 Total column (col 19), per row
        wb_cy25_hh = _to_float(ws.cell(r, 19).value) or 0.0
        wb_cy25_nhh = _to_float(ws.cell(r + 1, 19).value) or 0.0
        wb_cy25_gas = _to_float(ws.cell(r + 2, 19).value) or 0.0

        # Sanity: our summed values should match workbook's CY25 Total within 1 kWh
        if abs(cy25_hh - wb_cy25_hh) > 1 or abs(cy25_nhh - wb_cy25_nhh) > 1 or abs(cy25_gas - wb_cy25_gas) > 1:
            log.append(
                f"  [Ecotricity] CY25 sum mismatch for {site_id}: summed (hh={cy25_hh:.0f}, nhh={cy25_nhh:.0f}, gas={cy25_gas:.0f}) vs workbook (hh={wb_cy25_hh:.0f}, nhh={wb_cy25_nhh:.0f}, gas={wb_cy25_gas:.0f})"
            )

        # Use workbook's totals as canonical for the CY25 block
        total_kwh = wb_cy25_hh + wb_cy25_nhh + wb_cy25_gas
        elec_total = wb_cy25_hh + wb_cy25_nhh
        site_ratio = ratios.get(site_id, {"landlord_elec": 0.0, "void_elec": 0.0, "landlord_gas": 0.0})
        denom = site_ratio["landlord_elec"] + site_ratio["void_elec"]
        landlord_share = site_ratio["landlord_elec"] / denom if denom > 0 else 1.0
        cy25_landlord = round(elec_total * landlord_share + wb_cy25_gas, 2)
        cy25_void = round(elec_total * (1 - landlord_share), 2)

        out[site_id] = {
            "monthly": monthly,
            "cy25": {
                "hh_kwh": round(wb_cy25_hh, 2),
                "nhh_kwh": round(wb_cy25_nhh, 2),
                "gas_kwh": round(wb_cy25_gas, 2),
                "total_kwh": round(total_kwh, 2),
                "landlord_kwh": cy25_landlord,
                "void_kwh": cy25_void,
            },
        }
        sites_resolved += 1
        r += 5  # advance past HH, NHH, Gas, TOTAL, blank

    log.append(f"  → {sites_resolved} sites in electricity_monthly.json (expected 15)")
    return out


# ===== Output 2: mpan_register.json =======================================

# Sort order within each site: landlord first, then construction, then voids by severity,
# then inactive. Within each group, by CY25 kWh desc.
_CATEGORY_ORDER = {
    "Landlord (HH)": 0,
    "Landlord (NHH)": 1,
    "Landlord (NHH) - heuristic": 2,
    "Landlord (Gas)": 3,
    "Landlord (Office)": 4,
    "Construction": 5,
    "Void - HIGH CONSUMPTION": 6,
    "Void - Normal (low)": 7,
    "Resident or Void": 8,
    "Inactive (no consumption)": 9,
}


def _category_sort_key(record: dict) -> tuple:
    """Sort: (category order, -cy25_kwh)."""
    cat = record.get("category") or ""
    order = _CATEGORY_ORDER.get(cat, 99)
    kwh = record.get("cy25_kwh") or 0
    return (order, -kwh)


def read_mpan_register(wb, log: list[str]) -> dict[str, list[dict]]:
    log.append("")
    log.append("[Ecotricity > MPAN Register] Reading MPAN classifications")

    if "MPAN Register" not in wb.sheetnames:
        log.append("  ERROR: MPAN Register sheet missing")
        return {}

    ws = wb["MPAN Register"]
    out: dict[str, list[dict]] = {}
    rows_scanned = 0
    category_counts: dict[str, int] = {}

    for r in range(5, ws.max_row + 1):
        mpan = _to_str(ws.cell(r, 1).value)
        site_id = _to_str(ws.cell(r, 2).value)
        if mpan is None or site_id is None:
            continue
        rows_scanned += 1

        mpan_type = _to_str(ws.cell(r, 4).value)
        category = _to_str(ws.cell(r, 10).value)
        category_source = _to_str(ws.cell(r, 11).value)
        cy25_kwh = _to_float(ws.cell(r, 6).value)
        months_covered = _to_int(ws.cell(r, 7).value)

        category_counts[category or "(blank)"] = category_counts.get(category or "(blank)", 0) + 1

        out.setdefault(site_id, []).append({
            "mpan": mpan,
            "type": mpan_type,
            "category": category,
            "category_source": category_source,
            "cy25_kwh": round(cy25_kwh, 2) if cy25_kwh is not None else None,
            "months_covered": months_covered,
            "account": None,  # Not in MPAN Register; would require cross-reference with Raw-Units
        })

    # Sort each site's MPANs
    for sid in out:
        out[sid].sort(key=_category_sort_key)

    log.append(f"  → {rows_scanned} MPANs across {len(out)} sites")
    log.append(f"  → category counts: {dict(sorted(category_counts.items(), key=lambda kv: -kv[1]))}")
    return out


# ===== Output 3: reconciliation.json ======================================

# Display name → canonical ID (Landlord vs Resident + Arbnco vs Eco + Derived Resident
# all use display names, not site IDs). Reuse _DISPLAY_TO_ID from top of file.


def _read_landlord_vs_resident(wb, log: list[str]) -> dict[str, dict]:
    """Read per-site Eco landlord/void totals."""
    ws = wb["Landlord vs Resident"]
    out: dict[str, dict] = {}
    for r in range(5, ws.max_row + 1):
        name = _to_str(ws.cell(r, 1).value)
        if name is None or name.lower() == "total":
            continue
        sid = _resolve_eco_site(name)
        if sid is None:
            continue
        # Cols: 2=LL HH, 3=LL NHH, 4=LL NHH heuristic, 5=LL Gas, 6=LL Office, 7=Construction,
        #       8=Void Normal, 9=Void HIGH, 10=Inactive, 11=Tot Landlord, 12=Tot Void, 13=Total
        ll_hh = _to_float(ws.cell(r, 2).value) or 0.0
        ll_nhh = _to_float(ws.cell(r, 3).value) or 0.0
        ll_nhh_heur = _to_float(ws.cell(r, 4).value) or 0.0
        ll_gas = _to_float(ws.cell(r, 5).value) or 0.0
        ll_office = _to_float(ws.cell(r, 6).value) or 0.0
        construction = _to_float(ws.cell(r, 7).value) or 0.0
        void_normal = _to_float(ws.cell(r, 8).value) or 0.0
        void_high = _to_float(ws.cell(r, 9).value) or 0.0
        inactive = _to_float(ws.cell(r, 10).value) or 0.0
        tot_landlord = _to_float(ws.cell(r, 11).value) or 0.0
        tot_void = _to_float(ws.cell(r, 12).value) or 0.0
        out[sid] = {
            "eco_landlord_elec_kwh": ll_hh + ll_nhh + ll_nhh_heur + ll_office + construction,
            "eco_void_elec_kwh": void_normal + void_high + inactive,
            "eco_gas_kwh": ll_gas,
            "_tot_landlord": tot_landlord,  # includes gas
            "_tot_void": tot_void,
        }
    return out


def _read_arbnco_reference(wb, log: list[str]) -> dict[str, dict]:
    """Read per-site arbnco totals from the Eco workbook's snapshot."""
    ws = wb["Arbnco Reference"]
    out: dict[str, dict] = {}
    for r in range(5, ws.max_row + 1):
        sid = _to_str(ws.cell(r, 1).value)
        if sid is None or sid.lower() in {"total", "portfolio"}:
            continue
        out[sid] = {
            "arb_elec_kwh": _to_float(ws.cell(r, 5).value) or 0.0,
            "arb_gas_kwh": _to_float(ws.cell(r, 6).value) or 0.0,
            "arb_meters_elec": _to_int(ws.cell(r, 3).value) or 0,
            "arb_meters_gas": _to_int(ws.cell(r, 4).value) or 0,
        }
    return out


def _read_derived_resident(wb, log: list[str]) -> dict[str, dict]:
    """Read per-site derived resident kWh (Arbnco total minus Eco landlord)."""
    ws = wb["Derived Resident Energy"]
    out: dict[str, dict] = {}
    for r in range(5, ws.max_row + 1):
        name = _to_str(ws.cell(r, 1).value)
        if name is None or name.lower() == "total":
            continue
        sid = _resolve_eco_site(name)
        if sid is None:
            continue
        # Cols: 2=Eco LL Elec, 3=Arb Total Elec, 4=Derived Resident Elec,
        #       5=Eco LL Gas, 6=Arb Total Gas, 7=Derived Resident Gas
        out[sid] = {
            "derived_resident_elec_kwh": _to_float(ws.cell(r, 4).value) or 0.0,
            "derived_resident_gas_kwh": _to_float(ws.cell(r, 7).value) or 0.0,
        }
    return out


def _read_void_summary(wb, log: list[str]) -> dict:
    """Read Void Investigation by-site summary + portfolio total."""
    ws = wb["Void Investigation"]
    by_site: dict[str, dict] = {}
    portfolio_total = None
    portfolio_cost = None

    # By-site rows 8-13, TOTAL at r14
    for r in range(8, 16):
        name = _to_str(ws.cell(r, 1).value)
        if name is None:
            continue
        if name.lower() == "total":
            portfolio_total = _to_int(ws.cell(r, 3).value)
            portfolio_cost = _to_float(ws.cell(r, 4).value)
            continue
        sid = _resolve_eco_site(name)
        if sid is None:
            continue
        by_site[sid] = {
            "high_count": _to_int(ws.cell(r, 2).value) or 0,
            "high_kwh": _to_int(ws.cell(r, 3).value) or 0,
            "estimated_annual_cost_gbp": round(_to_float(ws.cell(r, 4).value) or 0.0, 2),
        }
    return {"by_site": by_site, "portfolio_total_kwh": portfolio_total, "portfolio_cost_gbp": portfolio_cost}


def read_reconciliation(wb, mpan_register: dict[str, list[dict]], log: list[str]) -> dict:
    """Build reconciliation.json from Landlord vs Resident + Arbnco Reference +
    Derived Resident + Void Investigation tabs. Uses MPAN Register (already loaded)
    for void counts per site by category."""

    log.append("")
    log.append("[Ecotricity > reconciliation] Composing per-site + portfolio + voids")

    eco = _read_landlord_vs_resident(wb, log)
    arb = _read_arbnco_reference(wb, log)
    derived = _read_derived_resident(wb, log)
    void_summary = _read_void_summary(wb, log)

    # Compute per-site void counts from MPAN Register
    site_void_counts: dict[str, dict] = {}
    for sid, mpans in mpan_register.items():
        high = sum(1 for m in mpans if m["category"] == "Void - HIGH CONSUMPTION")
        normal = sum(1 for m in mpans if m["category"] == "Void - Normal (low)")
        inactive = sum(1 for m in mpans if m["category"] == "Inactive (no consumption)")
        high_kwh = sum((m["cy25_kwh"] or 0) for m in mpans if m["category"] == "Void - HIGH CONSUMPTION")
        site_void_counts[sid] = {
            "high_count": high,
            "normal_count": normal,
            "inactive_count": inactive,
            "high_kwh": round(high_kwh, 2),
        }

    # Compose by_site
    all_sites = set(eco.keys()) | set(arb.keys()) | set(derived.keys())
    by_site: dict[str, dict] = {}
    for sid in sorted(all_sites):
        e = eco.get(sid, {})
        a = arb.get(sid, {})
        d = derived.get(sid, {})
        # Eco meter counts: count MPANs per site
        mpans = mpan_register.get(sid, [])
        eco_meters_elec = sum(1 for m in mpans if m["type"] in {"HH", "NHH"})
        eco_meters_gas = sum(1 for m in mpans if m["type"] == "Gas")

        by_site[sid] = {
            "eco_landlord_elec_kwh": round(e.get("eco_landlord_elec_kwh", 0.0), 2),
            "eco_void_elec_kwh": round(e.get("eco_void_elec_kwh", 0.0), 2),
            "eco_gas_kwh": round(e.get("eco_gas_kwh", 0.0), 2),
            "eco_meters_elec": eco_meters_elec,
            "eco_meters_gas": eco_meters_gas,
            "arb_elec_kwh": round(a.get("arb_elec_kwh", 0.0), 2),
            "arb_gas_kwh": round(a.get("arb_gas_kwh", 0.0), 2),
            "arb_meters_elec": a.get("arb_meters_elec", 0),
            "arb_meters_gas": a.get("arb_meters_gas", 0),
            "derived_resident_elec_kwh": round(d.get("derived_resident_elec_kwh", 0.0), 2),
            "derived_resident_gas_kwh": round(d.get("derived_resident_gas_kwh", 0.0), 2),
        }

    # Portfolio totals
    portfolio = {
        "eco_landlord_elec_kwh": round(sum(s["eco_landlord_elec_kwh"] for s in by_site.values()), 2),
        "eco_void_elec_kwh": round(sum(s["eco_void_elec_kwh"] for s in by_site.values()), 2),
        "eco_gas_kwh": round(sum(s["eco_gas_kwh"] for s in by_site.values()), 2),
        "arb_elec_kwh": round(sum(s["arb_elec_kwh"] for s in by_site.values()), 2),
        "arb_gas_kwh": round(sum(s["arb_gas_kwh"] for s in by_site.values()), 2),
        "derived_resident_elec_kwh": round(sum(s["derived_resident_elec_kwh"] for s in by_site.values()), 2),
        "derived_resident_gas_kwh": round(sum(s["derived_resident_gas_kwh"] for s in by_site.values()), 2),
        "eco_meters_total": sum(len(v) for v in mpan_register.values()),
        "arb_meters_total": sum(s["arb_meters_elec"] + s["arb_meters_gas"] for s in by_site.values()),
    }

    # Voids: combine MPAN-Register counts + Void Investigation kWh + costs
    voids_by_site: dict[str, dict] = {}
    total_voids = 0
    high_voids = 0
    normal_voids = 0
    inactive_voids = 0
    total_high_kwh = 0.0
    for sid, counts in sorted(site_void_counts.items()):
        if counts["high_count"] + counts["normal_count"] + counts["inactive_count"] == 0:
            continue  # only include sites with at least one void/inactive
        voids_by_site[sid] = counts
        high_voids += counts["high_count"]
        normal_voids += counts["normal_count"]
        inactive_voids += counts["inactive_count"]
        total_high_kwh += counts["high_kwh"]
    total_voids = high_voids + normal_voids + inactive_voids

    voids_portfolio = {
        "total_voids": total_voids,
        "high_voids": high_voids,
        "normal_voids": normal_voids,
        "inactive_voids": inactive_voids,
        "total_high_kwh": round(total_high_kwh, 2),
        "estimated_annual_cost_gbp": round(void_summary.get("portfolio_cost_gbp") or 0.0, 2),
    }

    out = {
        "by_site": by_site,
        "portfolio": portfolio,
        "voids": {"by_site": voids_by_site, "portfolio": voids_portfolio},
    }

    log.append(f"  → reconciliation.json: {len(by_site)} sites, portfolio_elec_landlord={portfolio['eco_landlord_elec_kwh']:.0f} kWh, voids={total_voids} (high={high_voids})")
    return out
