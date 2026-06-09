"""Pipeline validation pass.

Runs after all readers have produced their JSON output. Checks consistency
across the four domains and the portfolio rollup. Validation failures are
WARNINGS, not errors — they are appended to the build log for human review.
Hard failures (missing source file, malformed workbook) are caught upstream.
"""

from __future__ import annotations

import json
from pathlib import Path

from site_resolver import all_canonical_ids


_VALID_STATUSES = {"confirmed", "partial", "missing", "not_applicable"}
_ENERGY_TOLERANCE_KWH = 10000  # 0.12% of portfolio total ≈ acceptable rounding drift

# Phase 1A reconciliation tolerances
_SINGLE_METER_TOLERANCE_PCT = 0.20  # ±20% for single-meter sites (elec)
_BULK_GAS_TOLERANCE_PCT = 0.05      # ±5% for bulk-gas sites

# Sites flagged in brief for single-meter elec reconciliation
_SINGLE_METER_ELEC_SITES = {
    "austin-heath", "gifford-lea", "millfield-green", "edwalton-office", "ampfield-meadows"
}
# Sites flagged for bulk-gas reconciliation
_BULK_GAS_SITES = {
    "austin-heath", "gifford-lea", "bramshott-place", "millbrook-village", "elderswell", "ledian-gardens"
}


def _check_site_counts(sites: dict, log: list[str]) -> int:
    canonical_ids = set(all_canonical_ids())
    actual_ids = set(sites.keys())
    issues = 0

    missing = canonical_ids - actual_ids
    extra = actual_ids - canonical_ids

    if missing:
        log.append(f"  [validate] sites.json MISSING canonical IDs: {sorted(missing)}")
        issues += 1
    if extra:
        log.append(f"  [validate] sites.json has UNEXPECTED IDs: {sorted(extra)}")
        issues += 1

    if len(sites) != 13:
        log.append(f"  [validate] sites.json count={len(sites)}, expected 13")
        issues += 1

    if issues == 0:
        log.append("  [validate] sites.json: 13 canonical IDs, no extras [OK]")
    return issues


def _check_energy_consistency(energy: dict, log: list[str]) -> int:
    portfolio = energy.get("portfolio")
    if not portfolio:
        log.append("  [validate] energy.json MISSING portfolio key")
        return 1

    issues = 0
    for stream in ("electricity", "gas"):
        per_site_sum = 0.0
        for sid, e in energy.items():
            if sid == "portfolio":
                continue
            v = (e.get("consumption_kwh") or {}).get(stream)
            if isinstance(v, (int, float)):
                per_site_sum += v
        portfolio_total = portfolio.get(f"total_{stream}_kwh")
        if portfolio_total is None:
            log.append(f"  [validate] energy.portfolio missing total_{stream}_kwh")
            issues += 1
            continue
        diff = abs(portfolio_total - per_site_sum)
        if diff > _ENERGY_TOLERANCE_KWH:
            log.append(
                f"  [validate] energy {stream}: portfolio {portfolio_total} vs per-site sum {per_site_sum:.2f} "
                f"differ by {diff:.2f} kWh (>{_ENERGY_TOLERANCE_KWH} tolerance)"
            )
            issues += 1
        else:
            log.append(
                f"  [validate] energy {stream}: portfolio {portfolio_total} ≈ per-site sum {per_site_sum:.2f} "
                f"(diff {diff:.2f} kWh, within tolerance) [OK]"
            )
    return issues


def _check_cross_domain_coverage(sites: dict, energy: dict, water: dict, waste: dict, log: list[str]) -> int:
    """Each canonical site should appear in water and waste (filled with missing if no data).
    Energy is allowed to be absent (e.g. Sonning Common has no Arbnco entry yet)."""
    issues = 0
    for sid in sites:
        absent_from = []
        if sid not in water:
            absent_from.append("water")
        if sid not in waste:
            absent_from.append("waste")
        if absent_from:
            log.append(f"  [validate] {sid} absent from: {absent_from}")
            issues += 1

    energy_sites = [k for k in energy if k != "portfolio"]
    sites_missing_energy = [sid for sid in sites if sid not in energy_sites]
    if sites_missing_energy:
        log.append(
            f"  [validate] sites without energy data (allowed if no Arbnco entry yet): {sites_missing_energy}"
        )
    return issues


def _check_status_flags(water: dict, waste: dict, log: list[str]) -> int:
    issues = 0
    for domain, data in (("water", water), ("waste", waste)):
        for sid, record in data.items():
            # Skip the portfolio aggregate row — it's a roll-up, not a site,
            # and has no data_status by design (added in Brief 9).
            if sid == "portfolio":
                continue
            status = record.get("data_status")
            if status not in _VALID_STATUSES:
                log.append(f"  [validate] {domain}.{sid}.data_status={status!r} not in {_VALID_STATUSES}")
                issues += 1
    if issues == 0:
        log.append(f"  [validate] all data_status values in {_VALID_STATUSES} [OK]")
    return issues


def _check_waste_brief9(waste: dict, log: list[str]) -> int:
    """Brief 9 waste-pipeline integration checks.

    Verifies the rewritten reader produced sensible portfolio + per-site
    output. Bounds are loose enough to accommodate both the brief's target
    (244 t / 4.86 tCO2e — based on a P03 revision that wasn't delivered)
    and the actual P02 data (~164 t / ~3.2 tCO2e).
    """
    issues = 0
    portfolio = waste.get("portfolio")
    if not portfolio:
        log.append("  [validate] waste.portfolio block missing")
        return 1

    # Portfolio tonnage
    p_total = portfolio.get("tonnage_total") or 0
    if not (100 <= p_total <= 300):
        log.append(f"  [validate] waste portfolio tonnage {p_total:.1f} t outside expected 100-300 t band")
        issues += 1
    else:
        log.append(f"  [validate] waste portfolio: {p_total:.1f} t [OK]")

    # Portfolio Scope 3 Cat 5 emissions
    p_em = portfolio.get("emissions_scope3_cat5_tco2e") or 0
    if not (2.0 <= p_em <= 8.0):
        log.append(f"  [validate] waste portfolio emissions {p_em:.2f} tCO2e outside expected 2-8 band")
        issues += 1
    else:
        log.append(f"  [validate] waste portfolio Scope 3 Cat 5: {p_em:.2f} tCO2e [OK]")

    # Diversion rate
    p_div = portfolio.get("diversion_rate") or 0
    if p_div < 0.95:
        log.append(f"  [validate] waste portfolio diversion {p_div*100:.1f}% below 95% threshold")
        issues += 1
    else:
        log.append(f"  [validate] waste portfolio diversion: {p_div*100:.1f}% [OK]")

    # At least 11 sites with real tonnage data
    sites_with_data = sum(
        1 for sid, e in waste.items()
        if sid != "portfolio" and (e.get("tonnage_total") or 0) > 0
    )
    if sites_with_data < 11:
        log.append(f"  [validate] only {sites_with_data} waste sites with tonnage > 0 (expected ≥11)")
        issues += 1
    else:
        log.append(f"  [validate] waste: {sites_with_data} sites with real tonnage [OK]")

    return issues


# ----- Phase 1A checks -----

def _check_mpan_count(mpan_register: dict, log: list[str]) -> int:
    total = sum(len(v) for v in mpan_register.values())
    if total == 222:
        log.append(f"  [validate] mpan_register: 222 MPANs total [OK]")
        return 0
    log.append(f"  [validate] mpan_register total = {total}, expected 222")
    return 1


def _check_monthly_completeness(electricity_monthly: dict, log: list[str]) -> int:
    """Every site should have 15 months of data (Oct 2024 – Dec 2025)."""
    issues = 0
    for sid, record in electricity_monthly.items():
        monthly = record.get("monthly") or []
        if len(monthly) != 15:
            log.append(f"  [validate] electricity_monthly.{sid} has {len(monthly)} months, expected 15")
            issues += 1
    if issues == 0:
        log.append(f"  [validate] electricity_monthly: every site has 15 months [OK]")
    return issues


def _check_single_meter_reconciliation(reconciliation: dict, log: list[str]) -> int:
    """For single-meter elec sites, Eco landlord should be within ±20% of arbnco."""
    by_site = reconciliation.get("by_site", {})
    issues = 0
    for sid in _SINGLE_METER_ELEC_SITES:
        rec = by_site.get(sid)
        if not rec:
            log.append(f"  [validate] single-meter check: {sid} not in reconciliation")
            issues += 1
            continue
        eco = rec.get("eco_landlord_elec_kwh") or 0
        arb = rec.get("arb_elec_kwh") or 0
        if arb == 0:
            log.append(f"  [validate] single-meter check: {sid} has zero arb_elec_kwh — skipping")
            continue
        diff_pct = abs(eco - arb) / arb
        if diff_pct > _SINGLE_METER_TOLERANCE_PCT:
            log.append(f"  [validate] single-meter check: {sid} eco={eco:.0f} vs arb={arb:.0f} diff={diff_pct:.1%} (>{_SINGLE_METER_TOLERANCE_PCT:.0%})")
            issues += 1
    if issues == 0:
        log.append(f"  [validate] single-meter reconciliation: all {len(_SINGLE_METER_ELEC_SITES)} sites within ±20% [OK]")
    return issues


def _check_bulk_gas_reconciliation(reconciliation: dict, log: list[str]) -> int:
    """For bulk-gas sites, Eco gas should be within ±5% of arbnco gas."""
    by_site = reconciliation.get("by_site", {})
    issues = 0
    for sid in _BULK_GAS_SITES:
        rec = by_site.get(sid)
        if not rec:
            log.append(f"  [validate] bulk-gas check: {sid} not in reconciliation")
            issues += 1
            continue
        eco = rec.get("eco_gas_kwh") or 0
        arb = rec.get("arb_gas_kwh") or 0
        if arb == 0:
            log.append(f"  [validate] bulk-gas check: {sid} has zero arb_gas_kwh — skipping")
            continue
        diff_pct = abs(eco - arb) / arb
        if diff_pct > _BULK_GAS_TOLERANCE_PCT:
            log.append(f"  [validate] bulk-gas check: {sid} eco={eco:.0f} vs arb={arb:.0f} diff={diff_pct:.1%} (>{_BULK_GAS_TOLERANCE_PCT:.0%})")
            issues += 1
    if issues == 0:
        log.append(f"  [validate] bulk-gas reconciliation: all {len(_BULK_GAS_SITES)} sites within ±5% [OK]")
    return issues


def _check_site_coordinates(coordinates: dict, log: list[str]) -> int:
    """Every canonical site must have a coordinate."""
    canonical = set(all_canonical_ids())
    have = set(coordinates.keys())
    missing = canonical - have
    if missing:
        log.append(f"  [validate] site_coordinates missing canonical IDs: {sorted(missing)}")
        return len(missing)
    log.append(f"  [validate] site_coordinates: every canonical site has lat/lon [OK]")
    return 0


# ----- Phase 1B checks -----

def _check_sycous(sycous: dict, log: list[str]) -> int:
    """sycous.json has 13+ entries, exactly 7 in_sycous=true."""
    by_site = sycous.get("by_site", {})
    issues = 0
    if len(by_site) < 13:
        log.append(f"  [validate] sycous.by_site has {len(by_site)} entries, expected 13+")
        issues += 1
    in_sycous_count = sum(1 for s in by_site.values() if s.get("in_sycous"))
    if in_sycous_count != 7:
        log.append(f"  [validate] sycous in_sycous count = {in_sycous_count}, expected 7")
        issues += 1
    if issues == 0:
        log.append(f"  [validate] sycous: {len(by_site)} sites, 7 in_sycous [OK]")
    return issues


def _check_half_hourly(hh_index: dict, log: list[str]) -> int:
    """Brief 11 — half-hourly integrity gate.

    Expects 12 MPAN entries total (ready or pending). For each `ready`
    entry there must be a per-MPAN JSON whose `period_count > 30000`
    and whose `start_date < 2025-01-01` — together that's the signature
    that we're reading the real 22-month Stark data, not the old 1-year
    placeholder (17,520 periods, hard-coded 2025-01-01).
    """
    import json
    from pathlib import Path

    mpans = hh_index.get("mpans", [])
    if not mpans:
        log.append(f"  [validate] half_hourly_index empty — no Stark CSVs in source-data (HH features disabled)")
        return 0
    issues = 0
    if len(mpans) != 12:
        log.append(f"  [validate] half_hourly_index has {len(mpans)} MPANs, expected 12")
        issues += 1

    ready = [m for m in mpans if m.get("data_status") == "ready"]
    pending = [m for m in mpans if m.get("data_status") == "pending"]
    log.append(
        f"  [validate] half_hourly_index: {len(ready)} ready, {len(pending)} pending "
        f"(expected 12 total)"
    )

    # Per-ready-MPAN signature check
    hh_dir = Path(__file__).parent / "dist" / "eir" / "half_hourly"
    for m in ready:
        path = hh_dir / f"{m['mpan']}.json"
        if not path.exists():
            log.append(f"  [validate] HH {m['mpan']}: 'ready' but per-MPAN JSON missing at {path}")
            issues += 1
            continue
        d = json.loads(path.read_text(encoding="utf-8"))
        pc = (d.get("stats") or {}).get("period_count") or 0
        sd = d.get("start_date") or ""
        if pc < 30000:
            log.append(f"  [validate] HH {m['mpan']}: period_count={pc} (<30000 — placeholder signature?)")
            issues += 1
        if not sd or sd >= "2025-01-01":
            log.append(f"  [validate] HH {m['mpan']}: start_date={sd!r} (>=2025-01-01 — placeholder signature?)")
            issues += 1

    if issues == 0:
        log.append(f"  [validate] half_hourly_index + per-MPAN JSONs: real Stark signature [OK]")
    return issues


def _check_carbon(carbon: dict, log: list[str]) -> int:
    """Carbon portfolio total should be > 100 tCO2e (sanity check)."""
    total = (carbon.get("portfolio") or {}).get("total_actual_tco2e", 0)
    if total <= 100:
        log.append(f"  [validate] carbon portfolio total = {total}, expected > 100 tCO2e")
        return 1
    log.append(f"  [validate] carbon portfolio total = {total:.0f} tCO2e [OK]")
    return 0


def validate(sites: dict, energy: dict, water: dict, waste: dict, log: list[str],
             *, mpan_register: dict | None = None, electricity_monthly: dict | None = None,
             reconciliation: dict | None = None, site_coordinates: dict | None = None,
             sycous: dict | None = None, half_hourly_index: dict | None = None,
             carbon: dict | None = None) -> int:
    """Run all validation checks. Returns the number of issues found (0 = all clean)."""
    log.append("")
    log.append("[Validation]")
    issues = 0
    issues += _check_site_counts(sites, log)
    issues += _check_energy_consistency(energy, log)
    issues += _check_cross_domain_coverage(sites, energy, water, waste, log)
    issues += _check_status_flags(water, waste, log)
    issues += _check_waste_brief9(waste, log)

    # Phase 1A checks (optional — skip if data not provided)
    if mpan_register is not None:
        issues += _check_mpan_count(mpan_register, log)
    if electricity_monthly is not None:
        issues += _check_monthly_completeness(electricity_monthly, log)
    if reconciliation is not None:
        issues += _check_single_meter_reconciliation(reconciliation, log)
        issues += _check_bulk_gas_reconciliation(reconciliation, log)
    if site_coordinates is not None:
        issues += _check_site_coordinates(site_coordinates, log)

    # Phase 1B checks
    if sycous is not None:
        issues += _check_sycous(sycous, log)
    if half_hourly_index is not None:
        issues += _check_half_hourly(half_hourly_index, log)
    if carbon is not None:
        issues += _check_carbon(carbon, log)

    log.append(f"  [validate] TOTAL ISSUES: {issues}")
    return issues
