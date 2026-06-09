"""Portfolio rollup — aggregates across sites/energy/water/waste into one summary.

Brief 17 — GRESB FY25 scope. Sonning Common (FY26 launch) and Edwalton Office
(not residential) are out of scope for IVG's GRESB FY25 assessment. The
in-scope portfolio for the thematic Energy / Water / Waste / Carbon pages is
11 sites, not 13. We emit two parallel rollups:

  - `portfolio`         — all 13 sites (existing behaviour, untouched)
  - `portfolio_inscope` — same shape, summed only over the 11 in-scope sites

and stamp each site record in sites.json with `gresb_in_scope: bool`.
"""

from __future__ import annotations

from datetime import datetime, timezone


OFFICE_IDS = {"edwalton-office"}

# Brief 17: GRESB FY25 out-of-scope sites. Out-of-scope sites stay on
# the Map and per-site pages, but never enter the portfolio_inscope
# totals on the thematic pages.
GRESB_OUT_OF_SCOPE = {
    "sonning-common",   # operational FY26 — not in FY25 assessment
    "edwalton-office",  # office, not residential
}


def _safe_sum(values):
    """Sum that ignores None and returns None if no numeric values were present."""
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return sum(nums)


def _rollup(label: str, scope_ids: list[str], sites: dict[str, dict], energy: dict[str, dict], water: dict[str, dict], waste: dict[str, dict], log: list[str]) -> dict:
    """Compute a portfolio block for an arbitrary set of site ids.

    Used twice: once for the full 13-site portfolio (existing behaviour) and
    once for the 11-site GRESB-in-scope portfolio (Brief 17). The shape is
    identical so consumers can swap between them.
    """
    scope_set = set(scope_ids)
    site_count = len(scope_ids)
    office_count = sum(1 for sid in scope_ids if sid in OFFICE_IDS)
    village_count = site_count - office_count

    total_gia_m2 = _safe_sum(sites[sid]["identity"].get("total_gia_m2") for sid in scope_ids if sid in sites)
    total_landlord_gia_m2 = _safe_sum(sites[sid]["identity"].get("landlord_gia_m2") for sid in scope_ids if sid in sites)
    total_units_completed = _safe_sum(sites[sid]["identity"].get("completed") for sid in scope_ids if sid in sites)

    # ----- Energy: sum per-site for the in-scope subset; Arbnco's
    # portfolio row is whole-estate and can't be sliced by scope. -----
    per_site_elec = _safe_sum(
        energy.get(sid, {}).get("consumption_kwh", {}).get("electricity")
        for sid in scope_ids
    )
    per_site_gas = _safe_sum(
        energy.get(sid, {}).get("consumption_kwh", {}).get("gas")
        for sid in scope_ids
    )
    per_site_total = _safe_sum(
        energy.get(sid, {}).get("consumption_kwh", {}).get("total")
        for sid in scope_ids
    )
    per_site_em_actual = _safe_sum(
        energy.get(sid, {}).get("emissions_actual_tco2e", {}).get("total")
        for sid in scope_ids
    )
    per_site_em_natavg = _safe_sum(
        energy.get(sid, {}).get("emissions_national_avg_tco2e", {}).get("total")
        for sid in scope_ids
    )
    energy_block = {
        "total_electricity_kwh": per_site_elec,
        "total_gas_kwh": per_site_gas,
        "total_consumption_kwh": per_site_total,
        "total_emissions_actual_tco2e": per_site_em_actual,
        "total_emissions_national_avg_tco2e": per_site_em_natavg,
        "sites_with_data": sum(1 for sid in scope_ids if energy.get(sid)),
    }

    # ----- Water + Waste — sum the scoped sites, count status flags. -----
    water_total = _safe_sum(water.get(sid, {}).get("consumption_m3") for sid in scope_ids)
    water_status_counts = {"confirmed": 0, "partial": 0, "missing": 0}
    for sid in scope_ids:
        s = (water.get(sid) or {}).get("data_status") or "missing"
        water_status_counts[s] = water_status_counts.get(s, 0) + 1

    waste_tonnage = _safe_sum(waste.get(sid, {}).get("tonnage_total") for sid in scope_ids)
    waste_emissions = _safe_sum(waste.get(sid, {}).get("emissions_scope3_cat5_tco2e") for sid in scope_ids)
    # diversion_rate isn't trivially sliceable site-by-site; the in-scope rate
    # is recomputed from the scoped diversion vs the scoped total. Leave as
    # None on the rollup if any input is missing.
    waste_diversion = None  # surfaced via the full portfolio block only for now
    waste_status_counts = {"confirmed": 0, "partial": 0, "missing": 0, "not_applicable": 0}
    for sid in scope_ids:
        s = (waste.get(sid) or {}).get("data_status") or "missing"
        waste_status_counts[s] = waste_status_counts.get(s, 0) + 1

    log.append(f"  [{label}] {site_count} sites ({village_count} villages, {office_count} office). GIA {total_gia_m2}, units {total_units_completed}")

    return {
        "site_ids": scope_ids,
        "site_count": site_count,
        "village_count": village_count,
        "office_count": office_count,
        "total_gia_m2": total_gia_m2,
        "total_landlord_gia_m2": total_landlord_gia_m2,
        "total_units_completed": total_units_completed,
        "energy": energy_block,
        "water": {
            "total_consumption_m3": water_total,
            "sites_with_confirmed_data": water_status_counts.get("confirmed", 0),
            "sites_with_partial_data": water_status_counts.get("partial", 0),
            "sites_with_missing_data": water_status_counts.get("missing", 0),
        },
        "waste": {
            "total_tonnage": waste_tonnage,
            "total_emissions_scope3_cat5_tco2e": waste_emissions,
            "diversion_rate": waste_diversion,
            "sites_with_confirmed_data": waste_status_counts.get("confirmed", 0),
            "sites_with_partial_data": waste_status_counts.get("partial", 0),
            "sites_with_missing_data": waste_status_counts.get("missing", 0),
            "sites_not_applicable": waste_status_counts.get("not_applicable", 0),
        },
    }


def build_portfolio(sites: dict[str, dict], energy: dict[str, dict], water: dict[str, dict], waste: dict[str, dict], log: list[str]) -> dict:
    log.append("")
    log.append("[Portfolio rollup] Aggregating across sites/energy/water/waste")

    site_ids = list(sites.keys())
    site_count = len(site_ids)
    office_count = sum(1 for sid in site_ids if sid in OFFICE_IDS)
    village_count = site_count - office_count

    total_gia_m2 = _safe_sum(s["identity"].get("total_gia_m2") for s in sites.values())
    total_landlord_gia_m2 = _safe_sum(s["identity"].get("landlord_gia_m2") for s in sites.values())
    total_units_completed = _safe_sum(s["identity"].get("completed") for s in sites.values())

    # ----- Energy: prefer Arbnco's portfolio row (canonical) -----
    energy_portfolio = energy.get("portfolio") or {}
    energy_block = {
        "total_electricity_kwh": energy_portfolio.get("total_electricity_kwh"),
        "total_gas_kwh": energy_portfolio.get("total_gas_kwh"),
        "total_consumption_kwh": energy_portfolio.get("total_consumption_kwh"),
        "total_emissions_actual_tco2e": energy_portfolio.get("total_emissions_actual_tco2e"),
        "total_emissions_national_avg_tco2e": energy_portfolio.get("total_emissions_national_avg_tco2e"),
        "sites_with_data": energy_portfolio.get("sites_with_data"),
    }

    # Cross-check: sum per-site values vs Arbnco portfolio row
    per_site_elec = _safe_sum(
        e.get("consumption_kwh", {}).get("electricity")
        for sid, e in energy.items()
        if sid != "portfolio"
    )
    per_site_gas = _safe_sum(
        e.get("consumption_kwh", {}).get("gas")
        for sid, e in energy.items()
        if sid != "portfolio"
    )
    if energy_block["total_electricity_kwh"] is not None and per_site_elec is not None:
        diff = abs(energy_block["total_electricity_kwh"] - per_site_elec)
        if diff > 1.0:  # 1 kWh tolerance
            log.append(f"  WARNING: Arbnco portfolio elec ({energy_block['total_electricity_kwh']}) vs per-site sum ({per_site_elec}) differ by {diff:.2f} kWh")
        else:
            log.append(f"  Cross-check: Arbnco portfolio elec matches per-site sum (diff {diff:.2f} kWh)")
    if energy_block["total_gas_kwh"] is not None and per_site_gas is not None:
        diff = abs(energy_block["total_gas_kwh"] - per_site_gas)
        if diff > 1.0:
            log.append(f"  WARNING: Arbnco portfolio gas ({energy_block['total_gas_kwh']}) vs per-site sum ({per_site_gas}) differ by {diff:.2f} kWh")
        else:
            log.append(f"  Cross-check: Arbnco portfolio gas matches per-site sum (diff {diff:.2f} kWh)")

    # ----- Water -----
    water_total = _safe_sum(w.get("consumption_m3") for w in water.values())
    water_status_counts = {"confirmed": 0, "partial": 0, "missing": 0}
    for w in water.values():
        s = w.get("data_status") or "missing"
        water_status_counts[s] = water_status_counts.get(s, 0) + 1

    # ----- Waste -----
    # Brief 9 — waste.json now contains a `portfolio` aggregate row alongside
    # the per-site rows. Iterate per-site rows only (skip the aggregate) so
    # we don't double-count. The waste reader's own portfolio totals are the
    # source of truth.
    waste_per_site = {sid: w for sid, w in waste.items() if sid != "portfolio"}
    waste_portfolio_block = waste.get("portfolio") or {}
    waste_tonnage = (
        waste_portfolio_block.get("tonnage_total")
        if waste_portfolio_block.get("tonnage_total") is not None
        else _safe_sum(w.get("tonnage_total") for w in waste_per_site.values())
    )
    waste_emissions = (
        waste_portfolio_block.get("emissions_scope3_cat5_tco2e")
        if waste_portfolio_block.get("emissions_scope3_cat5_tco2e") is not None
        else _safe_sum(w.get("emissions_scope3_cat5_tco2e") for w in waste_per_site.values())
    )
    waste_diversion = waste_portfolio_block.get("diversion_rate")
    waste_status_counts = {"confirmed": 0, "partial": 0, "missing": 0, "not_applicable": 0}
    for w in waste_per_site.values():
        s = w.get("data_status") or "missing"
        waste_status_counts[s] = waste_status_counts.get(s, 0) + 1

    portfolio = {
        "site_count": site_count,
        "village_count": village_count,
        "office_count": office_count,
        "total_gia_m2": total_gia_m2,
        "total_landlord_gia_m2": total_landlord_gia_m2,
        "total_units_completed": total_units_completed,
        "energy": energy_block,
        "water": {
            "total_consumption_m3": water_total,
            "sites_with_confirmed_data": water_status_counts.get("confirmed", 0),
            "sites_with_partial_data": water_status_counts.get("partial", 0),
            "sites_with_missing_data": water_status_counts.get("missing", 0),
        },
        "waste": {
            "total_tonnage": waste_tonnage,
            "total_emissions_scope3_cat5_tco2e": waste_emissions,
            "diversion_rate": waste_diversion,
            "sites_with_confirmed_data": waste_status_counts.get("confirmed", 0),
            "sites_with_partial_data": waste_status_counts.get("partial", 0),
            "sites_with_missing_data": waste_status_counts.get("missing", 0),
            "sites_not_applicable": waste_status_counts.get("not_applicable", 0),
        },
        "data_period": "CY2025",
        "build_timestamp": datetime.now(timezone.utc).isoformat(),
    }

    log.append(f"  Portfolio: {site_count} sites ({village_count} villages, {office_count} office)")
    log.append(f"  Portfolio: total GIA {total_gia_m2} m², total units completed {total_units_completed}")

    # Brief 17 — annotate each site with `gresb_in_scope` so consumers can
    # filter by scope without needing to know the OUT_OF_SCOPE list. Mutates
    # the sites dict in place (build.py re-writes sites.json afterwards).
    for sid, s in sites.items():
        s["gresb_in_scope"] = sid not in GRESB_OUT_OF_SCOPE

    # Brief 17 — portfolio_inscope = the 11-site GRESB FY25 rollup. Lives
    # alongside the existing top-level keys so legacy readers continue to
    # see the 13-site numbers at portfolio.<key>; the Energy / Water /
    # Waste / Carbon thematic pages read portfolio.portfolio_inscope.<key>.
    in_scope_ids = [sid for sid in site_ids if sid not in GRESB_OUT_OF_SCOPE]
    portfolio["portfolio_inscope"] = _rollup(
        "Portfolio (GRESB in-scope)", in_scope_ids, sites, energy, water, waste, log
    )
    portfolio["gresb_out_of_scope_site_ids"] = sorted(sid for sid in site_ids if sid in GRESB_OUT_OF_SCOPE)

    return portfolio
