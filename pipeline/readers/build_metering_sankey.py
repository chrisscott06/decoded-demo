"""Brief 21 — Metering & data quality Sankey precompute.

Augments `portfolio.json` with a `metering_sankey` block that pre-computes
every count the React Sankey component needs:

  - 11 commodity totals (5 landlord MPAN buckets + 5 Sycous services +
    DNO/BNO invisible-resident estimate)
  - Per-site MPAN breakdown (HH / NHH / Void / Other / Gas)
  - Per-site Sycous breakdown (elec / heat / hhw / hw / cw)
  - DNO/BNO resident estimate per site (= phasing.total_units_planned
    at the 5 DNO/BNO sites: Bramshott, Durrants, Great Alne, Elderswell,
    Ledian — BNO but conceptually similar)
  - Totals: visible-to-IVG (sum of all measured meters) and the
    invisible-to-IVG estimate.

Principle 1 of the brief: real data, computed live. No hardcoded counts
in the React component — every number in the Sankey lives in this block.
Falsifiability: `grep -E "1049|496|338|842|128"
eir/src/components/portfolio/PortfolioEnergy.jsx` must return zero hits.

Reads from in-scope sites only (Sonning + Edwalton excluded per Brief 17).
"""

from __future__ import annotations


# Bucketing rules per Brief 21 reference table (matches the prototype).
GAS_CATEGORY = "Landlord (Gas)"
HH_CATEGORY = "Landlord (HH)"
NHH_CATEGORIES = ("Landlord (NHH)", "Landlord (NHH) - heuristic")
OTHER_CATEGORIES = ("Inactive (no consumption)", "Resident or Void")


# Brief 21 follow-up — DNO/BNO detection is now DATA-DRIVEN. A site is
# "visible via arbnco" iff arbnco reports more meters than Ecotricity
# does at that site (arb_meters - eco_meters > 0 for elec or gas).
# Previously hard-coded as a 5-site list; Chris confirmed 4 Jun that
# Millbrook is also DNO (arbnco sees 174 electric MPANs vs Eco's 12,
# 162-residue), and that Bramshott has 140 resident GAS MPANs via
# arbnco that the planned-units estimator missed entirely.
# The detection happens inside `apply()` from reconciliation.json.


# Sycous service → bucket key (prototype keys).
SYCOUS_SERVICE_KEY = {
    "Electricity": "elec",
    "Heat": "heat",
    "Heat & Hot Water": "hhw",
    "Hot Water": "hw",
    "Cold Water": "cw",
}


# Top-to-bottom site order for the Sankey's right column (prototype order:
# clusters of low-meter sites first, then high-meter DNO sites at the bottom).
SITE_ORDER = [
    "austin-heath", "gifford-lea", "millfield-green",
    "ampfield-meadows", "blendworth-hills",
    "millbrook-village", "ledian-gardens", "elderswell",
    "bramshott-place", "durrants-village", "great-alne-park",
]


def _classify_mpan(m: dict) -> str | None:
    """Return one of {gas, elec-hh, elec-nhh, elec-void, elec-other} or None."""
    category = (m.get("category") or "").strip()
    if category == GAS_CATEGORY:
        return "gas"
    if category == HH_CATEGORY:
        return "elec-hh"
    if category in NHH_CATEGORIES:
        return "elec-nhh"
    if category.lower().startswith("void"):
        return "elec-void"
    if category in OTHER_CATEGORIES:
        return "elec-other"
    return None


def apply(portfolio: dict, mpan_register: dict, sycous: dict, sites: dict, reconciliation: dict, log: list[str]) -> None:
    """Mutate `portfolio` in place — add a `metering_sankey` block."""
    log.append("")
    log.append("[Brief 21] Precomputing metering_sankey block")

    in_scope_ids = list(portfolio.get("portfolio_inscope", {}).get("site_ids") or [])
    if not in_scope_ids:
        log.append("  WARNING: no in-scope site list found; metering_sankey block skipped")
        return

    # ---- MPAN buckets ----
    commodity_totals = {
        "gas": 0, "elec-hh": 0, "elec-nhh": 0, "elec-void": 0, "elec-other": 0,
        "sycous-elec": 0, "sycous-heat": 0, "sycous-hhw": 0, "sycous-hw": 0, "sycous-cw": 0,
        "invisible-resident": 0,
    }
    per_site_mpans: dict[str, dict[str, int]] = {}
    unclassified: list[tuple[str, str, str]] = []

    for sid in in_scope_ids:
        per_site_mpans[sid] = {"hh": 0, "nhh": 0, "void_betw": 0, "other": 0, "gas": 0}
        for m in mpan_register.get(sid, []):
            bucket = _classify_mpan(m)
            if bucket is None:
                unclassified.append((sid, m.get("type") or "", m.get("category") or ""))
                continue
            commodity_totals[bucket] += 1
            # Per-site map uses the prototype's compact keys.
            if bucket == "gas":           per_site_mpans[sid]["gas"] += 1
            elif bucket == "elec-hh":     per_site_mpans[sid]["hh"] += 1
            elif bucket == "elec-nhh":    per_site_mpans[sid]["nhh"] += 1
            elif bucket == "elec-void":   per_site_mpans[sid]["void_betw"] += 1
            elif bucket == "elec-other":  per_site_mpans[sid]["other"] += 1

    if unclassified:
        for sid, t, c in unclassified[:5]:
            log.append(f"  UNCLASSIFIED MPAN: site={sid} type={t!r} category={c!r}")
        if len(unclassified) > 5:
            log.append(f"  ... and {len(unclassified) - 5} more unclassified")

    # ---- Sycous per service, per site ----
    sycous_by_site = sycous.get("by_site", {}) if sycous else {}
    per_site_sycous: dict[str, dict[str, int]] = {}
    sycous_unknown: list[tuple[str, str]] = []

    for sid in in_scope_ids:
        per_site_sycous[sid] = {"elec": 0, "heat": 0, "hhw": 0, "hw": 0, "cw": 0}
        entry = sycous_by_site.get(sid) or {}
        if not entry.get("in_sycous"):
            continue
        for svc in entry.get("by_service") or []:
            name = svc.get("service") or ""
            meters = svc.get("meters") or 0
            key = SYCOUS_SERVICE_KEY.get(name)
            if key is None:
                sycous_unknown.append((sid, name))
                continue
            per_site_sycous[sid][key] += meters
            commodity_totals[f"sycous-{key}"] += meters

    if sycous_unknown:
        for sid, name in sycous_unknown[:5]:
            log.append(f"  UNKNOWN Sycous service: site={sid} service={name!r}")

    # ---- Resident MPANs visible via Arbnco (data-driven) ----
    # For each in-scope site, count = (arb_meters_elec + arb_meters_gas) -
    # (eco_meters_elec + eco_meters_gas). Sites where this diff is zero
    # have no residents on individual MPANs — they're bulk microgrid
    # arrangements (Austin Heath, Gifford Lea, Millfield Green, Ampfield,
    # Blendworth) where residents are sub-metered via Sycous, not via
    # individual DNO/BNO supplies. Sites with diff > 0 ARE the DNO/BNO
    # arrangement automatically.
    rec_by_site = (reconciliation or {}).get("by_site") or {}
    dno_bno_estimate: dict[str, int] = {}
    detected_dno_bno: list[str] = []
    for sid in in_scope_ids:
        r = rec_by_site.get(sid) or {}
        eco_total = (r.get("eco_meters_elec") or 0) + (r.get("eco_meters_gas") or 0)
        arb_total = (r.get("arb_meters_elec") or 0) + (r.get("arb_meters_gas") or 0)
        diff = max(0, arb_total - eco_total)
        if diff > 0:
            dno_bno_estimate[sid] = diff
            commodity_totals["invisible-resident"] += diff
            detected_dno_bno.append(sid)
    log.append(
        f"  [Brief 21] DNO/BNO detection (arb > eco meters): "
        f"{len(detected_dno_bno)} sites, {commodity_totals['invisible-resident']} resident MPANs total — "
        f"{', '.join(detected_dno_bno)}"
    )

    # ---- Visible vs invisible totals ----
    visible_to_ivg = sum(v for k, v in commodity_totals.items() if k != "invisible-resident")
    invisible_estimate = commodity_totals["invisible-resident"]

    portfolio["metering_sankey"] = {
        "commodities": commodity_totals,
        "per_site_mpans": per_site_mpans,
        "per_site_sycous": per_site_sycous,
        "dno_bno_site_ids": list(detected_dno_bno),
        "dno_bno_resident_estimate": dno_bno_estimate,
        "site_order": list(SITE_ORDER),
        "totals": {
            "visible_to_ivg": visible_to_ivg,
            "invisible_to_ivg_estimate": invisible_estimate,
        },
        "notes": {
            "estimation": "resident MPAN counts are READ FROM RECONCILIATION (arb_meters - eco_meters per site, electric + gas). NOT estimated from planned units — these are the actual arbnco meter counts. Includes both resident-electric and resident-gas where present (Bramshott has 140 resident gas MPANs in addition to 153 resident electric).",
            "scope": "All counts are for in-scope sites only (11 of 13). Sonning Common (FY26 launch) and Edwalton Office are excluded. DNO/BNO detection is data-driven: a site is in-channel iff arbnco reports more meters than Ecotricity.",
        },
    }

    log.append(
        f"  [Brief 21] metering_sankey written: "
        f"visible={visible_to_ivg} (gas={commodity_totals['gas']}, HH={commodity_totals['elec-hh']}, "
        f"NHH={commodity_totals['elec-nhh']}, Void={commodity_totals['elec-void']}, "
        f"Other={commodity_totals['elec-other']}, Sycous={sum(commodity_totals[k] for k in ('sycous-elec','sycous-heat','sycous-hhw','sycous-hw','sycous-cw'))}); "
        f"invisible_estimate={invisible_estimate}"
    )
