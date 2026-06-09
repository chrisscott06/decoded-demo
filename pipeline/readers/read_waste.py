"""Waste reader (Brief 9 rewrite).

Aggregates the raw waste sheets directly:
  - Convey_Raw       — BIFFA conveyance notes (~2,800 rows, 10 BIFFA sites)
  - Landfill_Raw     — BIFFA disposal-fate per EWC code per site (42 rows)
  - SWP_Raw          — Marston Hill C of E Primary monthly waste (SWP contractor)
  - Ash_Waste_Raw    — Whitfield Secondary Academy (Ash Waste Services, estimated weights)
  - DEFRA_Inputs     — 2025 emission factors (read once, hardcoded as backup)

Critical: does NOT read Site_Summary cached formula values. Those cells are
SUMPRODUCT/SUMIF formulas; openpyxl with `data_only=True` returns `None` for
any formula cell Excel hasn't recently cached. The prior reader read those
and saw 12/13 sites blank. The fix is to aggregate the source-of-truth raw
sheets — robust to the workbook being edited/handed around without an Excel
recalc.

Two tonnage bases are tracked:
  - **Conveyance basis** (Convey_Raw collection weights) — recorded in
    `notes` as a cross-check, never used as the canonical figure.
  - **Disposal-fate basis** (Landfill_Raw routes for BIFFA; ASH/SWP GHG
    mappings) — canonical for `tonnage_total`. Drives diversion + emissions.

Output per site:
  contractor, data_status, data_period, tonnage_total, tonnage_by_stream,
  disposal_split, emissions_by_route, emissions_scope3_cat5_tco2e,
  diversion_rate, notes.

Portfolio rollup added by build_portfolio.py via the portfolio.waste block;
this reader also returns its own per-route portfolio aggregate inside the
per-site map under key 'portfolio' so the rollup is consistent.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from site_resolver import CANONICAL_SITES


# DEFRA 2025 factors — verbatim from DEFRA_Inputs sheet (kgCO2e / tonne).
# Source: UK GHG Conversion Factors for Company Reporting 2025 (DESNZ/DEFRA).
# Scope 3, Category 5 — Waste Generated in Operations.
DEFRA_LANDFILL_KGCO2E_PER_T      = 446.242   # Mixed Municipal to landfill (includes CH4)
DEFRA_INCINERATION_KGCO2E_PER_T  = 21.294    # Incineration with energy recovery
DEFRA_RECYCLING_KGCO2E_PER_T     = 21.294    # Open/closed loop, glass, cardboard
DEFRA_AD_KGCO2E_PER_T            = 10.204    # Anaerobic digestion / composting


# BIFFA Account ID → canonical site_id. Account IDs are stable across
# workbook revisions; hard-coded for robustness.
BIFFA_ACCOUNT_TO_SITE: dict[str, str] = {
    "A41422": "austin-heath",
    "B55002": "bramshott-place",
    "D39233": "durrants-village",
    "M40157": "great-alne-park",
    "L35571": "ledian-gardens",
    "E30544": "elderswell",
    "M49173": "millfield-green",
    "A49475": "ampfield-meadows",
    "B54990": "blendworth-hills",
    "W36809": "sonning-common",   # Widmore Park Management Ltd
}

# Other waste contractors
ASH_ACCOUNT_TO_SITE = {"34191": "gifford-lea"}
SWP_ACCOUNT_TO_SITE = {"MVM001": "millbrook-village"}


# EWC code → stream (for the Landfill_Raw disposal split). The five canonical
# streams are general, recycling, glass, organic, cardboard.
EWC_CODE_TO_STREAM: dict[str, str] = {
    "150106 MIXED PACKAGING":               "recycling",
    "150107 GLASS PACKAGING":               "glass",
    "200108 BIODEGRADABLE KITCHEN AND CANTEEN WASTE": "organic",
    "200301 MIXED MUNICIPAL WASTE":         "general",
    # XXXXXX None → uncategorised; included in disposal_split totals
    # but not assigned to any stream bucket.
}


# Convey_Raw "Container Product Group Description" → stream (for the
# conveyance-basis cross-check).
PRODUCT_GROUP_TO_STREAM: dict[str, str] = {
    "General":   "general",
    "Recycling": "recycling",
    "Organic":   "organic",
    "Glass":     "glass",
    # Cardboard would map to cardboard if it ever appears; no rows in CY2025.
}


# ---------------------------------------------------------------------------


def find_workbook(source_data: Path) -> Path:
    """Pick the newest matching IVG_Waste workbook by modification time."""
    candidates = list(source_data.glob("*CA-X-1003*.xlsx"))
    if not candidates:
        raise FileNotFoundError(f"No Waste workbook (CA-X-1003*) in {source_data}")
    # Sort by mtime so the most-recently-touched revision wins, regardless of
    # filename revision suffix conventions.
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def _empty_disposal() -> dict[str, float]:
    return {"landfill": 0.0, "incinerated": 0.0, "recycled": 0.0, "ad": 0.0}


def _empty_streams() -> dict[str, float]:
    return {"general": 0.0, "recycling": 0.0, "glass": 0.0, "organic": 0.0, "cardboard": 0.0}


def _emissions_for_disposal(d: dict[str, float]) -> tuple[dict[str, float], float]:
    """Apply DEFRA 2025 factors per route. Returns (per-route tCO2e, total)."""
    by_route = {
        "landfill_tco2e":     round(d["landfill"]    * DEFRA_LANDFILL_KGCO2E_PER_T     / 1000.0, 4),
        "incineration_tco2e": round(d["incinerated"] * DEFRA_INCINERATION_KGCO2E_PER_T / 1000.0, 4),
        "recycling_tco2e":    round(d["recycled"]    * DEFRA_RECYCLING_KGCO2E_PER_T    / 1000.0, 4),
        "ad_tco2e":           round(d["ad"]          * DEFRA_AD_KGCO2E_PER_T           / 1000.0, 4),
    }
    total = round(sum(by_route.values()), 3)
    return by_route, total


def _diversion_rate(disposal: dict[str, float]) -> float | None:
    total = sum(disposal.values())
    if total <= 0:
        return None
    return round((total - disposal["landfill"]) / total, 4)


# ---------------------------------------------------------------------------
# BIFFA — Landfill_Raw (disposal-fate basis, canonical)
# ---------------------------------------------------------------------------

def _aggregate_biffa_disposal(wb, log: list[str]) -> dict[str, dict[str, float]]:
    """Aggregate Landfill_Raw per site: disposal_split + stream mix.

    Site ID column is like 'A49475*1*1' — strip everything after '*' to get
    the BIFFA account ID for the mapping.

    Returns {site_id: {'disposal': {...}, 'streams': {...}}}.
    """
    ws = wb["Landfill_Raw"]
    by_site: dict[str, dict[str, Any]] = {}
    rows_read = 0

    for r in range(2, ws.max_row + 1):
        ewc = ws.cell(r, 1).value
        site_id_raw = ws.cell(r, 2).value
        if site_id_raw is None:
            continue
        site_id_str = str(site_id_raw).strip()
        if site_id_str.lower() == "total":
            continue
        # Strip the asterisk suffix to get the BIFFA account
        acct = site_id_str.split("*")[0]
        canonical = BIFFA_ACCOUNT_TO_SITE.get(acct)
        if not canonical:
            log.append(f"  [Waste] Landfill_Raw r{r}: unknown account {acct!r}")
            continue

        landfill    = float(ws.cell(r, 5).value or 0)
        incinerated = float(ws.cell(r, 7).value or 0)
        ad          = float(ws.cell(r, 8).value or 0)
        recycled    = float(ws.cell(r, 9).value or 0)

        entry = by_site.setdefault(canonical, {
            "disposal": _empty_disposal(),
            "streams": _empty_streams(),
        })
        entry["disposal"]["landfill"]    += landfill
        entry["disposal"]["incinerated"] += incinerated
        entry["disposal"]["ad"]          += ad
        entry["disposal"]["recycled"]    += recycled

        # Stream assignment by EWC code
        ewc_key = str(ewc).strip() if ewc is not None else ""
        stream = EWC_CODE_TO_STREAM.get(ewc_key)
        if stream:
            entry["streams"][stream] += landfill + incinerated + ad + recycled
        rows_read += 1

    log.append(f"  [Waste] Landfill_Raw: {rows_read} rows across {len(by_site)} BIFFA sites")
    return by_site


# ---------------------------------------------------------------------------
# BIFFA — Convey_Raw (conveyance basis, cross-check only)
# ---------------------------------------------------------------------------

def _aggregate_biffa_conveyance(wb, log: list[str]) -> dict[str, float]:
    """Sum CY2025 Service Weight by BIFFA account ID. Returns conveyance total per site."""
    ws = wb["Convey_Raw"]
    by_site: dict[str, float] = {}
    rows_2025 = 0

    for r in range(2, ws.max_row + 1):
        acct = ws.cell(r, 2).value
        dt = ws.cell(r, 11).value
        wt = ws.cell(r, 13).value
        if not isinstance(dt, datetime) or dt.year != 2025:
            continue
        if wt is None:
            continue
        canonical = BIFFA_ACCOUNT_TO_SITE.get(str(acct).strip())
        if not canonical:
            continue
        by_site[canonical] = by_site.get(canonical, 0.0) + float(wt)
        rows_2025 += 1

    log.append(f"  [Waste] Convey_Raw: {rows_2025} CY2025 rows across {len(by_site)} sites")
    return by_site


# ---------------------------------------------------------------------------
# ASH (Whitfield Secondary Academy) — Ash_Waste_Raw
# ---------------------------------------------------------------------------

def _read_gifford_ash(wb, log: list[str]) -> dict[str, Any]:
    """Read Ash_Waste_Raw rows 6-12 (streams) + r16-19 GHG mapping.

    Returns the same shape as a BIFFA site so the caller can treat it
    uniformly:
        {'disposal': {...}, 'streams': {...}, 'tonnage_total': float,
         'notes': str, 'contractor': 'Ash Waste'}
    """
    ws = wb["Ash_Waste_Raw"]

    # Streams from r6-12 (col 1=name, col 8=Est. Weight (t))
    # Map ASH stream names → canonical streams.
    ASH_STREAM_MAP = {
        "General Waste":           "general",
        "Card & Paper":            "cardboard",
        "Plastics & Metals":       "recycling",
        "Food Waste":              "organic",
        "Glass (360L)":            "glass",
        "Glass (240L)":            "glass",
        "Mixed Recycle (pre-Mar)": "recycling",
    }
    streams = _empty_streams()
    for r in range(6, 13):
        stream_name = ws.cell(r, 1).value
        wt = ws.cell(r, 8).value
        if stream_name is None or wt is None:
            continue
        mapped = ASH_STREAM_MAP.get(str(stream_name).strip())
        if not mapped:
            log.append(f"  [Waste] Ash_Waste_Raw r{r}: unmapped stream {stream_name!r}")
            continue
        try:
            streams[mapped] += float(wt)
        except (TypeError, ValueError):
            pass

    # Disposal-fate split per the GHG Mapping (r16-19):
    #   General Waste 11.869 → Incineration (EfW)
    #   Card+Plastic+Mixed 5.016 → Recycling
    #   Glass 9.450 → Recycling
    #   Food Waste 5.640 → AD
    disposal = _empty_disposal()
    disposal["incinerated"] += streams["general"]                      # General → Incin
    disposal["recycled"]    += streams["cardboard"] + streams["recycling"] + streams["glass"]
    disposal["ad"]          += streams["organic"]

    total = round(sum(disposal.values()), 3)

    return {
        "contractor": "Ash Waste",
        "disposal": disposal,
        "streams": streams,
        "tonnage_total": total,
        "notes": "Weights ESTIMATED from bin volume × industry-average fill density. "
                 f"Conveyance basis (Ash CY2025 TOTAL row): 31.975 t.",
    }


# ---------------------------------------------------------------------------
# SWP (Marston Hill) — SWP_Raw
# ---------------------------------------------------------------------------

# Map SWP "Waste Stream" → canonical stream
SWP_STREAM_MAP: dict[str, str] = {
    "Mixed Municipal Waste":      "general",
    "Glass":                      "glass",
    "Biodegradable Kitchen Waste": "organic",
    "Mixed Packaging":            "recycling",
}

# Map SWP "GHG Disposal Method" → disposal route
SWP_METHOD_MAP: dict[str, str] = {
    "Incineration": "incinerated",
    "Recycling":    "recycled",
    "AD":           "ad",
    "Landfill":     "landfill",
}


def _read_millbrook_swp(wb, log: list[str]) -> dict[str, Any]:
    """Aggregate SWP_Raw rows 7+ filtered to year 2025."""
    ws = wb["SWP_Raw"]
    streams = _empty_streams()
    disposal = _empty_disposal()
    rows_read = 0

    for r in range(7, ws.max_row + 1):
        yr = ws.cell(r, 2).value
        if yr != 2025:
            continue
        stream_raw = ws.cell(r, 3).value
        wt = ws.cell(r, 7).value
        method_raw = ws.cell(r, 9).value
        if wt is None:
            continue
        try:
            wt = float(wt)
        except (TypeError, ValueError):
            continue
        # Stream bucket
        s = SWP_STREAM_MAP.get(str(stream_raw).strip())
        if s:
            streams[s] += wt
        else:
            log.append(f"  [Waste] SWP_Raw r{r}: unmapped stream {stream_raw!r}")
        # Disposal bucket
        m = SWP_METHOD_MAP.get(str(method_raw).strip())
        if m:
            disposal[m] += wt
        else:
            log.append(f"  [Waste] SWP_Raw r{r}: unmapped method {method_raw!r}")
        rows_read += 1

    total = round(sum(disposal.values()), 3)
    log.append(f"  [Waste] SWP_Raw: {rows_read} CY2025 rows → Marston Hill {total:.3f} t")

    return {
        "contractor": "SWP",
        "disposal": disposal,
        "streams": streams,
        "tonnage_total": total,
        "notes": "Actual weighed data from SWP YTD reports (12 months CY2025).",
    }


# ---------------------------------------------------------------------------
# Top-level
# ---------------------------------------------------------------------------

def read_waste(workbook_path: Path, log: list[str]) -> dict[str, Any]:
    """Read all waste sources from the IVG_Waste workbook.

    Returns {site_id: {...}, 'portfolio': {...}}. Signature matches the
    Phase 0 contract (workbook path + log) so build.py's existing call
    site (`ro_was.read_waste(was_path, log)`) doesn't need updating.
    """
    log.append("")
    log.append("[Waste] Brief 9 rewrite — aggregating raw sheets")
    log.append(f"  [Waste] Reading: {workbook_path.name}")

    wb = load_workbook(workbook_path, data_only=True, read_only=False)

    # Aggregate raw sources -------------------------------------------------
    biffa_by_site = _aggregate_biffa_disposal(wb, log)
    conveyance_by_site = _aggregate_biffa_conveyance(wb, log)
    gifford = _read_gifford_ash(wb, log)
    millbrook = _read_millbrook_swp(wb, log)

    # Assemble per-site payloads -------------------------------------------
    output: dict[str, Any] = {}

    # BIFFA sites
    for canonical_id in BIFFA_ACCOUNT_TO_SITE.values():
        entry = biffa_by_site.get(canonical_id)
        if not entry:
            output[canonical_id] = {
                "id": canonical_id,
                "contractor": "BIFFA",
                "tonnage_total": None,
                "tonnage_by_stream": _empty_streams(),
                "disposal_split": _empty_disposal(),
                "emissions_by_route": {
                    "landfill_tco2e": 0.0, "incineration_tco2e": 0.0,
                    "recycling_tco2e": 0.0, "ad_tco2e": 0.0,
                },
                "emissions_scope3_cat5_tco2e": None,
                "diversion_rate": None,
                "data_status": "missing",
                "data_period": "CY2025",
                "notes": "BIFFA contractor on file but no Landfill_Raw rows.",
            }
            continue
        disposal = {k: round(v, 3) for k, v in entry["disposal"].items()}
        streams  = {k: round(v, 3) for k, v in entry["streams"].items()}
        total    = round(sum(disposal.values()), 3)
        by_route, emissions_total = _emissions_for_disposal(disposal)
        conveyance_total = conveyance_by_site.get(canonical_id)
        notes_parts = ["BIFFA disposal-fate aggregated from Landfill_Raw."]
        if conveyance_total is not None:
            notes_parts.append(f"Conveyance-basis cross-check (Convey_Raw CY2025): {conveyance_total:.3f} t.")
        output[canonical_id] = {
            "id": canonical_id,
            "contractor": "BIFFA",
            "tonnage_total": total,
            "tonnage_by_stream": streams,
            "disposal_split": disposal,
            "emissions_by_route": by_route,
            "emissions_scope3_cat5_tco2e": emissions_total,
            "diversion_rate": _diversion_rate(disposal),
            "data_status": "confirmed",
            "data_period": "CY2025",
            "notes": " ".join(notes_parts),
        }

    # Whitfield Secondary Academy (Ash Waste)
    g_disposal = {k: round(v, 3) for k, v in gifford["disposal"].items()}
    g_streams = {k: round(v, 3) for k, v in gifford["streams"].items()}
    g_by_route, g_emissions = _emissions_for_disposal(g_disposal)
    output["gifford-lea"] = {
        "id": "gifford-lea",
        "contractor": "Ash Waste",
        "tonnage_total": round(sum(g_disposal.values()), 3),
        "tonnage_by_stream": g_streams,
        "disposal_split": g_disposal,
        "emissions_by_route": g_by_route,
        "emissions_scope3_cat5_tco2e": g_emissions,
        "diversion_rate": _diversion_rate(g_disposal),
        "data_status": "partial",  # estimated weights, not weighed
        "data_period": "CY2025",
        "notes": gifford["notes"],
    }

    # Marston Hill (SWP)
    m_disposal = {k: round(v, 3) for k, v in millbrook["disposal"].items()}
    m_streams = {k: round(v, 3) for k, v in millbrook["streams"].items()}
    m_by_route, m_emissions = _emissions_for_disposal(m_disposal)
    output["millbrook-village"] = {
        "id": "millbrook-village",
        "contractor": "SWP",
        "tonnage_total": round(sum(m_disposal.values()), 3),
        "tonnage_by_stream": m_streams,
        "disposal_split": m_disposal,
        "emissions_by_route": m_by_route,
        "emissions_scope3_cat5_tco2e": m_emissions,
        "diversion_rate": _diversion_rate(m_disposal),
        "data_status": "confirmed",
        "data_period": "CY2025",
        "notes": millbrook["notes"],
    }

    # Edwalton office — no waste contract
    output["edwalton-office"] = {
        "id": "edwalton-office",
        "contractor": None,
        "tonnage_total": None,
        "tonnage_by_stream": _empty_streams(),
        "disposal_split": _empty_disposal(),
        "emissions_by_route": {
            "landfill_tco2e": 0.0, "incineration_tco2e": 0.0,
            "recycling_tco2e": 0.0, "ad_tco2e": 0.0,
        },
        "emissions_scope3_cat5_tco2e": None,
        "diversion_rate": None,
        "data_status": "not_applicable",
        "data_period": "CY2025",
        "notes": "Head office — no waste contract on file (treated centrally / serviced via building landlord).",
    }

    # Fill any canonical sites still missing (shouldn't happen, but safety net)
    for canonical_id in CANONICAL_SITES:
        if canonical_id not in output:
            output[canonical_id] = {
                "id": canonical_id,
                "contractor": None,
                "tonnage_total": None,
                "tonnage_by_stream": _empty_streams(),
                "disposal_split": _empty_disposal(),
                "emissions_by_route": {
                    "landfill_tco2e": 0.0, "incineration_tco2e": 0.0,
                    "recycling_tco2e": 0.0, "ad_tco2e": 0.0,
                },
                "emissions_scope3_cat5_tco2e": None,
                "diversion_rate": None,
                "data_status": "missing",
                "data_period": "CY2025",
                "notes": "Site not present in waste workbook.",
            }

    # Portfolio rollup ------------------------------------------------------
    p_disposal = _empty_disposal()
    p_streams = _empty_streams()
    p_emissions_by_route = {
        "landfill_tco2e": 0.0, "incineration_tco2e": 0.0,
        "recycling_tco2e": 0.0, "ad_tco2e": 0.0,
    }
    sites_confirmed = sites_partial = sites_missing = sites_na = 0
    for sid, entry in output.items():
        if sid == "portfolio":
            continue
        if entry["data_status"] == "confirmed": sites_confirmed += 1
        elif entry["data_status"] == "partial": sites_partial += 1
        elif entry["data_status"] == "not_applicable": sites_na += 1
        else: sites_missing += 1
        for k in p_disposal: p_disposal[k] += entry["disposal_split"][k]
        for k in p_streams: p_streams[k] += entry["tonnage_by_stream"][k]
        for k in p_emissions_by_route: p_emissions_by_route[k] += entry["emissions_by_route"][k]

    p_total = round(sum(p_disposal.values()), 3)
    p_emissions_total = round(sum(p_emissions_by_route.values()), 3)
    p_diversion = _diversion_rate(p_disposal)

    output["portfolio"] = {
        "tonnage_total": p_total,
        "tonnage_by_stream": {k: round(v, 3) for k, v in p_streams.items()},
        "disposal_split": {k: round(v, 3) for k, v in p_disposal.items()},
        "emissions_by_route": {k: round(v, 4) for k, v in p_emissions_by_route.items()},
        "emissions_scope3_cat5_tco2e": p_emissions_total,
        "diversion_rate": p_diversion,
        "sites_confirmed": sites_confirmed,
        "sites_partial": sites_partial,
        "sites_missing": sites_missing,
        "sites_not_applicable": sites_na,
        "factors_used": {
            "landfill_kgco2e_per_t":      DEFRA_LANDFILL_KGCO2E_PER_T,
            "incineration_kgco2e_per_t":  DEFRA_INCINERATION_KGCO2E_PER_T,
            "recycling_kgco2e_per_t":     DEFRA_RECYCLING_KGCO2E_PER_T,
            "ad_kgco2e_per_t":            DEFRA_AD_KGCO2E_PER_T,
            "source": "DEFRA 2025 (DESNZ Conversion Factors for Company Reporting)",
        },
    }

    log.append(
        f"  [Waste] Portfolio: {p_total:.3f} t | "
        f"diversion {p_diversion*100 if p_diversion else 0:.1f}% | "
        f"S3 Cat 5 {p_emissions_total:.3f} tCO2e | "
        f"{sites_confirmed} confirmed / {sites_partial} partial / "
        f"{sites_missing} missing / {sites_na} not_applicable"
    )

    return output
