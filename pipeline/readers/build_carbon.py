"""Carbon emissions data layer — produces dist/eir/carbon.json from existing JSON.

No source workbook read. Pure derivation from reconciliation.json + sites.json +
electricity_monthly.json. Applies UK 2024 emission factors per the Phase 1B brief.

Scope 1 = gas consumption × NATURAL GAS factor
Scope 2 = landlord electricity × GRID factor
Scope 3 Cat 13 = derived resident electricity × GRID factor + resident gas × NATURAL GAS factor

Brief disclaimer: these are simplified factors for Phase 1B. Full SBTi accuracy
arrives later. The split between Scope 2 (landlord elec) and Scope 3 (resident elec)
is the structurally important thing for Westbrook's GHG inventory.
"""

from __future__ import annotations

# UK 2024 standard emission factors (kgCO2e/kWh)
GAS_FACTOR = 0.18254
ELEC_GRID_FACTOR = 0.20705


def _to_t(kwh: float) -> float:
    """kWh × kgCO2e/kWh → tCO2e (divide kg by 1000)."""
    return kwh / 1000.0


def build_carbon(reconciliation: dict, sites: dict, electricity_monthly: dict, log: list[str]) -> dict:
    log.append("")
    log.append("[Carbon rollup] Deriving carbon.json from reconciliation + sites + electricity_monthly")

    by_site_in = reconciliation.get("by_site", {})
    by_site_out: dict[str, dict] = {}

    # Compute per-site carbon
    for sid, rec in by_site_in.items():
        eco_landlord_elec_kwh = rec.get("eco_landlord_elec_kwh") or 0.0
        eco_gas_kwh = rec.get("eco_gas_kwh") or 0.0
        derived_resident_elec_kwh = rec.get("derived_resident_elec_kwh") or 0.0
        derived_resident_gas_kwh = rec.get("derived_resident_gas_kwh") or 0.0

        scope_1 = _to_t(eco_gas_kwh * GAS_FACTOR)
        scope_2 = _to_t(eco_landlord_elec_kwh * ELEC_GRID_FACTOR)
        scope_3 = _to_t(
            derived_resident_elec_kwh * ELEC_GRID_FACTOR
            + derived_resident_gas_kwh * GAS_FACTOR
        )
        total = scope_1 + scope_2 + scope_3

        # National average (for benchmarking) — proxy: just elec × grid (already national)
        # National average from arbnco's natural electricity (no behavioural difference)
        national_avg = _to_t((rec.get("arb_elec_kwh") or 0) * ELEC_GRID_FACTOR + eco_gas_kwh * GAS_FACTOR)

        # Intensity
        site = sites.get(sid, {})
        identity = site.get("identity") or {}
        gia = identity.get("total_gia_m2")
        units = identity.get("completed")

        intensity_per_m2 = total / gia if gia and gia > 0 else None
        intensity_per_unit = total / units if units and units > 0 else None

        # Monthly carbon — derive from electricity_monthly + assume gas is monthly-flat
        # (no monthly gas data yet). 12-element tCO2e array.
        em = electricity_monthly.get(sid, {})
        monthly_arr = em.get("monthly") or []
        if monthly_arr:
            # Pick the Jan-Dec 2025 entries
            cy25_monthly = [m for m in monthly_arr if m.get("month", "").startswith("2025-")]
            monthly_tco2e = []
            gas_per_month = eco_gas_kwh / 12.0  # flat distribution
            for m in cy25_monthly[:12]:
                # Use landlord+void elec for Scope 2; this is per-month split applied to total
                elec_m = (m.get("hh") or 0) + (m.get("nhh") or 0)
                # The landlord_share was already baked into elec_landlord, but the monthly entries
                # don't have that field everywhere — recompute on the fly via portfolio ratio
                # Pragmatic: approximate as elec_m * landlord_share where share is eco_landlord_elec/(eco_landlord+eco_void)
                eco_void = rec.get("eco_void_elec_kwh") or 0.0
                share = eco_landlord_elec_kwh / (eco_landlord_elec_kwh + eco_void) if (eco_landlord_elec_kwh + eco_void) > 0 else 1.0
                ll_elec_m = elec_m * share
                gas_m = m.get("gas") or 0
                t = _to_t(ll_elec_m * ELEC_GRID_FACTOR + gas_m * GAS_FACTOR)
                monthly_tco2e.append(round(t, 2))
            # Pad to 12 if short
            while len(monthly_tco2e) < 12:
                monthly_tco2e.append(round(total / 12.0, 2))
        else:
            # Flat split when no monthly data
            monthly_tco2e = [round(total / 12.0, 2)] * 12

        by_site_out[sid] = {
            "scope_1_tco2e": round(scope_1, 2),
            "scope_2_tco2e": round(scope_2, 2),
            "scope_3_cat13_tco2e": round(scope_3, 2),
            "total_actual_tco2e": round(total, 2),
            "intensity_per_unit": round(intensity_per_unit, 3) if intensity_per_unit is not None else None,
            "intensity_per_m2_gia": round(intensity_per_m2, 4) if intensity_per_m2 is not None else None,
            "national_avg_tco2e": round(national_avg, 2),
            "monthly": monthly_tco2e,
        }

    # Portfolio totals
    sites_with_data = [s for s in by_site_out.values()]
    p_scope_1 = sum(s["scope_1_tco2e"] for s in sites_with_data)
    p_scope_2 = sum(s["scope_2_tco2e"] for s in sites_with_data)
    p_scope_3 = sum(s["scope_3_cat13_tco2e"] for s in sites_with_data)
    p_total = p_scope_1 + p_scope_2 + p_scope_3
    by_scope_pct = {
        "scope_1": round(p_scope_1 / p_total * 100, 1) if p_total else 0,
        "scope_2": round(p_scope_2 / p_total * 100, 1) if p_total else 0,
        "scope_3": round(p_scope_3 / p_total * 100, 1) if p_total else 0,
    }

    out = {
        "by_site": by_site_out,
        "portfolio": {
            "scope_1_tco2e": round(p_scope_1, 2),
            "scope_2_tco2e": round(p_scope_2, 2),
            "scope_3_cat13_tco2e": round(p_scope_3, 2),
            "total_actual_tco2e": round(p_total, 2),
            "by_scope_pct": by_scope_pct,
        },
        "factors_used": {
            "gas_kgco2e_per_kwh": GAS_FACTOR,
            "elec_grid_kgco2e_per_kwh": ELEC_GRID_FACTOR,
            "source": "UK 2024 standard (BEIS) — simplified Phase 1B",
        },
    }

    log.append(f"  → carbon.json: portfolio total {p_total:.0f} tCO2e (S1={p_scope_1:.0f}, S2={p_scope_2:.0f}, S3={p_scope_3:.0f})")
    return out
