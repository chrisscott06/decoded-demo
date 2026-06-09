"""Pipeline orchestrator — calls each reader in sequence, writes JSON output.

Phase 0 readers depend on workbooks that may no longer be present in source-data
(notably Site Overview / CA-X-2001 was removed during Phase 1A prep). To avoid
breaking the committed-and-deployed Phase 0 JSON, each Phase 0 reader is wrapped
in a `_run_phase0_reader` helper that falls back to the existing dist/eir JSON if
the source workbook is missing.

Phase 1A readers (Ecotricity, RFI) are mandatory — they fail loudly if their
source workbooks are missing.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Windows default console is cp1252 and chokes on en-dashes / arrows in our log
# output. JSON files are always written explicitly as UTF-8; this only fixes stdout.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, OSError):
    pass

ROOT = Path(__file__).resolve().parent
SOURCE_DATA = ROOT / "source-data"
DIST_EIR = ROOT / "dist" / "eir"

# Make the package directory importable so readers can do `from site_resolver import ...`
sys.path.insert(0, str(ROOT))

from openpyxl import load_workbook  # noqa: E402

from readers import build_capacity_pv as ro_cap  # noqa: E402
from readers import build_carbon as ro_carbon  # noqa: E402
from readers import build_consumption_methodology as ro_meth  # noqa: E402
from readers import build_gresb_stub as ro_gresb  # noqa: E402
from readers import build_heating_matrix as ro_heat  # noqa: E402
from readers import build_portfolio as ro_port  # noqa: E402
from readers import build_metering_sankey as ro_metering  # noqa: E402
from readers import build_strip_rule as ro_strip  # noqa: E402
from readers import read_arbnco as ro_arb  # noqa: E402
from readers import read_ecotricity as ro_eco  # noqa: E402
from readers import read_half_hourly as ro_hh  # noqa: E402
from readers import read_rfi_register as ro_rfi  # noqa: E402
from readers import read_site_overview as ro_so  # noqa: E402
from readers import read_sycous as ro_syc  # noqa: E402
from readers import read_waste as ro_was  # noqa: E402
from readers import read_water as ro_wat  # noqa: E402
from validate import validate  # noqa: E402


def _write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_existing_json(name: str, log: list[str]) -> dict:
    """Load the existing committed JSON from dist/eir as a fallback when the source
    workbook is missing. Logs a warning so the situation is visible."""
    path = DIST_EIR / name
    if not path.exists():
        log.append(f"  WARNING: source workbook missing AND no cached {name} on disk — returning empty")
        return {}
    log.append(f"  WARNING: source workbook missing — using cached {name} from previous build")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    DIST_EIR.mkdir(parents=True, exist_ok=True)
    log: list[str] = []
    log.append(f"Pipeline build started at {datetime.now(timezone.utc).isoformat()}")
    log.append(f"Source data: {SOURCE_DATA}")
    log.append(f"Output: {DIST_EIR}")

    # ----- Site Overview (Phase 0 — fallback to cached) -----
    try:
        so_path = ro_so.find_workbook(SOURCE_DATA)
        sites = ro_so.read_site_overview(so_path, log)
        if sites:
            _write_json(DIST_EIR / "sites.json", sites)
            log.append(f"  → wrote sites.json ({len(sites)} sites)")
        else:
            log.append("  WARNING: read_site_overview returned empty — keeping existing sites.json on disk")
            sites = _load_existing_json("sites.json", log)
    except FileNotFoundError as e:
        log.append("")
        log.append(f"[Site Overview] {e}")
        sites = _load_existing_json("sites.json", log)

    # ----- Arbnco (Phase 0 — fallback to cached) -----
    try:
        arb_path = ro_arb.find_workbook(SOURCE_DATA)
        # Arbnco glob is *CA-X_1001* — could match Ecotricity (1001b). Skip if so.
        if "1001b" in arb_path.name.lower() or "ecotricity" in arb_path.name.lower():
            raise FileNotFoundError(f"Arbnco glob matched Ecotricity workbook ({arb_path.name}) — Phase 0 reader will not run")
        energy = ro_arb.read_arbnco(arb_path, sites, log)
        _write_json(DIST_EIR / "energy.json", energy)
        site_count = len([k for k in energy if k != "portfolio"])
        log.append(f"  → wrote energy.json ({site_count} sites + portfolio)")
    except FileNotFoundError as e:
        log.append("")
        log.append(f"[Arbnco] {e}")
        energy = _load_existing_json("energy.json", log)

    # ----- Water (Phase 0 — fallback to cached) -----
    try:
        wat_path = ro_wat.find_workbook(SOURCE_DATA)
        water = ro_wat.read_water(wat_path, log)
        _write_json(DIST_EIR / "water.json", water)
        log.append(f"  → wrote water.json ({len(water)} sites)")
    except FileNotFoundError as e:
        log.append("")
        log.append(f"[Water] {e}")
        water = _load_existing_json("water.json", log)

    # ----- Waste (Phase 0 — fallback to cached) -----
    try:
        was_path = ro_was.find_workbook(SOURCE_DATA)
        waste = ro_was.read_waste(was_path, log)
        _write_json(DIST_EIR / "waste.json", waste)
        log.append(f"  → wrote waste.json ({len(waste)} sites)")
    except FileNotFoundError as e:
        log.append("")
        log.append(f"[Waste] {e}")
        waste = _load_existing_json("waste.json", log)

    # ----- Portfolio rollup (Phase 0) -----
    if sites and energy and water and waste:
        portfolio = ro_port.build_portfolio(sites, energy, water, waste, log)
        _write_json(DIST_EIR / "portfolio.json", portfolio)
        log.append("  → wrote portfolio.json")
        # Brief 17 — build_portfolio annotates each site with
        # `gresb_in_scope`; re-write sites.json so the annotation lands on
        # disk for the shell to read.
        _write_json(DIST_EIR / "sites.json", sites)
        log.append("  → re-wrote sites.json (gresb_in_scope flag)")
    else:
        log.append("")
        log.append("[Portfolio rollup] skipped — one or more Phase 0 inputs unavailable")
        portfolio = _load_existing_json("portfolio.json", log)

    # ----- Phase 1A: Ecotricity (electricity_monthly, mpan_register, reconciliation) -----
    eco_path = ro_eco.find_workbook(SOURCE_DATA)
    eco_wb = load_workbook(eco_path, data_only=True, read_only=True)

    electricity_monthly = ro_eco.read_electricity_monthly(eco_wb, log)
    _write_json(DIST_EIR / "electricity_monthly.json", electricity_monthly)
    log.append(f"  → wrote electricity_monthly.json ({len(electricity_monthly)} sites)")

    mpan_register = ro_eco.read_mpan_register(eco_wb, log)
    _write_json(DIST_EIR / "mpan_register.json", mpan_register)
    total_mpans = sum(len(v) for v in mpan_register.values())
    log.append(f"  → wrote mpan_register.json ({total_mpans} MPANs across {len(mpan_register)} sites)")

    reconciliation = ro_eco.read_reconciliation(eco_wb, mpan_register, log)
    _write_json(DIST_EIR / "reconciliation.json", reconciliation)
    log.append(f"  → wrote reconciliation.json")

    # ----- Phase 1A: RFI Register -----
    rfi_path = ro_rfi.find_workbook(SOURCE_DATA)
    rfi_status = ro_rfi.read_rfi(rfi_path, log)
    _write_json(DIST_EIR / "rfi_status.json", rfi_status)
    log.append(f"  → wrote rfi_status.json ({rfi_status['summary']['total']} items)")

    # ----- Phase 1B: Sycous -----
    syc_path = ro_syc.find_workbook(SOURCE_DATA)
    sycous = ro_syc.read_sycous(syc_path, log)
    _write_json(DIST_EIR / "sycous.json", sycous)
    log.append(f"  → wrote sycous.json ({sycous['portfolio']['sites_with_sycous']} sites in Sycous)")

    # ----- Brief 17.5 Part 2: arbnco strip-rule + Elderswell + portfolio recompute -----
    # Mutates reconciliation in place (adds resident_kwh_by_source per site)
    # and recomputes portfolio_inscope.energy.derived_resident_gwh from the
    # new subfields. Also applies the Elderswell grid_type override.
    ro_strip.apply_site_overrides(sites, log)
    # Brief 18 Part 1 — pipeline corrections (Ledian / Sonning phase counts,
    # Millfield / Ampfield primary_heating) + heating_by_phase block per site.
    ro_heat.apply(sites, log)
    _write_json(DIST_EIR / "sites.json", sites)
    log.append("  → re-wrote sites.json (Elderswell override + Brief 18 heating matrix)")
    ro_strip.apply_strip_rule(reconciliation, sycous, log)
    ro_strip.recompute_portfolio_derived_resident_gwh(portfolio, reconciliation, log)
    _write_json(DIST_EIR / "reconciliation.json", reconciliation)
    log.append("  → re-wrote reconciliation.json (resident_kwh_by_source per site)")

    # ----- Brief 21: Metering Sankey precompute -----
    # Mutates portfolio in place — adds the metering_sankey block consumed by
    # MeteringSankey.jsx (commodity totals, per-site MPAN/Sycous breakdowns,
    # DNO/BNO invisible-resident estimate). Runs AFTER the strip-rule pass so
    # the portfolio.portfolio_inscope.site_ids list is final.
    ro_metering.apply(portfolio, mpan_register, sycous, sites, reconciliation, log)
    _write_json(DIST_EIR / "portfolio.json", portfolio)
    log.append("  → re-wrote portfolio.json (portfolio_inscope.energy.derived_resident_gwh recomputed + Brief 21 metering_sankey block)")

    # ----- Brief 24.8 Part 1: consumption methodology pass -----
    # Layers Total / Landlord / Resident figures on top of the existing
    # reconciliation structure, fixing the bulk-site double-counting bug.
    # Adds new fields per site (total_site_kwh, landlord_kwh, resident_kwh,
    # data_quality_flag) and extends the top-level portfolio block with a
    # methodology_v2 summary. Old fields are preserved for backward compat.
    ro_meth.apply(reconciliation, portfolio, log)
    _write_json(DIST_EIR / "reconciliation.json", reconciliation)
    log.append("  → re-wrote reconciliation.json (Brief 24.8 methodology fields per site + portfolio.methodology_v2)")

    # ----- Phase 1B: Half-hourly Stark CSVs -----
    hh_index = ro_hh.read_half_hourly(SOURCE_DATA, DIST_EIR, log)
    _write_json(DIST_EIR / "half_hourly_index.json", hh_index)
    log.append(f"  → wrote half_hourly_index.json ({len(hh_index['mpans'])} MPANs)")

    # ----- Brief 19 Part 1b: Capacity + PV phasing (ECPR dataset) -----
    # Sibling file, tagged purpose: "ECPR/strategy", NEVER read by GRESB
    # carbon/renewable code paths (Brief 19 Rule 7 critical separation).
    capacity_pv_workbook = SOURCE_DATA / "Inspired_Villages_-_Projects_Overview.xlsx"
    from site_resolver import CANONICAL_SITES
    in_scope_set = set(portfolio.get("portfolio_inscope", {}).get("site_ids", []))
    capacity_pv = ro_cap.build(
        capacity_pv_workbook,
        hh_index,
        list(CANONICAL_SITES),
        in_scope_set,
        log,
    )
    _write_json(DIST_EIR / "capacity_pv.json", capacity_pv)
    log.append(f"  → wrote capacity_pv.json (purpose={capacity_pv['purpose']}, {len(capacity_pv['sites'])} sites)")

    # ----- Phase 1B: Carbon emissions (derived) -----
    carbon = ro_carbon.build_carbon(reconciliation, sites, electricity_monthly, log)
    _write_json(DIST_EIR / "carbon.json", carbon)
    log.append(f"  → wrote carbon.json (portfolio {carbon['portfolio']['total_actual_tco2e']:.0f} tCO2e)")

    # ----- Phase 1B: GRESB stub -----
    gresb = ro_gresb.build_gresb_stub(log)
    _write_json(DIST_EIR / "gresb_stub.json", gresb)
    log.append("  → wrote gresb_stub.json")

    # ----- Validation pass (Phase 0 + Phase 1A + Phase 1B checks) -----
    site_coordinates_path = ROOT / "site_coordinates.json"
    site_coordinates = json.loads(site_coordinates_path.read_text(encoding="utf-8")) if site_coordinates_path.exists() else {}
    validate(
        sites, energy, water, waste, log,
        mpan_register=mpan_register,
        electricity_monthly=electricity_monthly,
        reconciliation=reconciliation,
        site_coordinates=site_coordinates,
        sycous=sycous,
        half_hourly_index=hh_index,
        carbon=carbon,
    )

    log.append("")
    log.append(f"Pipeline build finished at {datetime.now(timezone.utc).isoformat()}")

    (DIST_EIR / "build_log.txt").write_text("\n".join(log), encoding="utf-8")
    print("\n".join(log))


if __name__ == "__main__":
    main()
