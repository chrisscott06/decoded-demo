"""Capacity + PV phasing reader — Brief 19 Part 1b.

Builds the per-site Energy Capacity & Procurement Report (ECPR) dataset:
  • Secured (agreed) supply capacity per site (from the design workbook)
  • Site peak load in kW (from Stark HH data — Brief 19 Part 1a-corrected
    `peak_kw` field on half_hourly_index.json)
  • Headroom = secured − peak, where both exist
  • Per-phase areas, units, PV (operational vs full)
  • pv_kwp_current (sum of operational phases) + pv_kwp_full
  • Reconciliation flags where phase rows don't sum to the workbook's
    own Total row

This dataset is tagged `purpose: "ECPR/strategy"` and lives in its own
sibling file (`capacity_pv.json`) rather than inside `sites.json` so it
can never silently flow into GRESB renewable-energy reporting (Brief 19
Rule 7 — critical separation).

Source workbook: `Inspired_Villages_-_Projects_Overview.xlsx`, sheet
`Site Info`. Layout is transposed — sites run across columns D–K,
fields down rows. Section labels live in column B, field labels in
column C. Six development sites carry data; three are out of scope
(Broadbridge Heath, Albourne, Farnham Royal — Chris ask 3 Jun).

Field mapping (Site Info sheet):
  Row 21 Utility / DNO
  Row 22 Site Peak Load          ← IGNORED (Chris 4 Jun: this row
                                   duplicates secured capacity, NOT
                                   measured peak. Measured peak only
                                   from Stark HH.)
  Row 23 Secured Capacity
  Row 25 DNO Supply Ref
  Row 26 MPAN
  Row 27 G99 Ref
  Rows 33-39 Areas (VC Communal, VC Resi, Ph1-4 Apts, Total)
  Rows 41-46 No. Units (VC Resi, Ph1-4 Apts, Total)
  Rows 48-53 PV (Ph1 VC+others, Ph1-4 Apts, Total)

Operational status (Brief 19 Rule 3):
  • Millfield Green: only Phase 1 (VC + Ph1 Apts) confirmed operational
    by Chris 4 Jun. Others stay operational=false pending confirmation.
  • All 13 canonical sites get a `capacity_pv` record. Sites not in the
    workbook get nulls + an explicit missing_fields list per Rule 4.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


# ----- Site Info sheet layout -------------------------------------------

# Workbook column index per canonical site id. Sites NOT in this map are
# either absent from the workbook (operational sites) or out of scope
# (Broadbridge Heath col E, Albourne col I, Farnham Royal col K — Chris
# ask 3 Jun). Col J ("Operational Portfolio") is an aggregate column,
# not a site.
_WORKBOOK_COLS = {
    "millfield-green":   4,  # D
    "ampfield-meadows":  6,  # F
    "blendworth-hills":  7,  # G
    "sonning-common":    8,  # H
}

_ROW_DNO            = 21
_ROW_SECURED        = 23
_ROW_DNO_SUPPLY_REF = 25
_ROW_MPAN           = 26
_ROW_G99_REF        = 27
_ROW_PLANNING_NOTES = 15

# Phase layout — each phase is one row index per group, plus a Total row.
_AREA_ROWS = {
    "vc_communal": 33,
    "vc_resi":     34,
    "apt_p1":      35,
    "apt_p2":      36,
    "apt_p3":      37,
    "apt_p4":      38,
}
_AREA_TOTAL_ROW = 39

_UNIT_ROWS = {
    "vc_resi":     41,
    "apt_p1":      42,
    "apt_p2":      43,
    "apt_p3":      44,
    "apt_p4":      45,
}
_UNIT_TOTAL_ROW = 46

_PV_ROWS = {
    "vc_p1":       48,  # Phase 1 VC + others
    "apt_p1":      49,  # Phase 1 Apartments
    "apt_p2":      50,
    "apt_p3":      51,
    "apt_p4":      52,
}
_PV_TOTAL_ROW = 53


# ----- Operational status (Brief 19 Rule 3) -----------------------------

# Default operational mapping per Rule 3. Confirmed by Chris 4 Jun:
# Millfield Green Phase 1 only (VC + Apt P1). Other dev sites stay
# not-yet-operational until Chris confirms (do not infer from PC dates).
_OPERATIONAL_PHASES: dict[str, set[str]] = {
    "millfield-green": {"vc_p1", "apt_p1"},
    "ampfield-meadows": set(),  # Awaiting Chris confirmation
    "blendworth-hills": set(),
    "sonning-common":   set(),  # Under construction
}


# ----- Helpers ----------------------------------------------------------

_MVA_RE = re.compile(r"(\d+(?:\.\d+)?)\s*MVA", re.IGNORECASE)


def _parse_mva(v: Any) -> float | None:
    """Parse a `'1.3 MVA'`-style string into a float. Returns None if
    the cell is blank or doesn't carry an MVA value."""
    if v is None:
        return None
    s = str(v)
    m = _MVA_RE.search(s)
    if not m:
        return None
    return float(m.group(1))


def _cell_num(ws, row: int, col: int) -> float | int | None:
    """Read a numeric cell. Returns None for blank cells. Coerces to
    int when the value is integer-valued (so units/PV stay clean)."""
    v = ws.cell(row, col).value
    if v is None or v == "":
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f.is_integer():
        return int(f)
    return round(f, 2)


def _cell_str(ws, row: int, col: int) -> str | None:
    v = ws.cell(row, col).value
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _detect_heating(notes: str | None) -> str | None:
    """Best-effort heating system extract from the Planning & Phasing
    free-text narrative. Returns None if no recognisable keyword. Falls
    back gracefully — the matrix has the authoritative per-phase data."""
    if not notes:
        return None
    s = notes.lower()
    if "gshp" in s:
        return "GSHP"
    if "ashp" in s or "air source" in s:
        return "ASHP"
    if "chp" in s:
        return "CHP"
    return None


def _reconcile(parts: list[int | float | None], total: int | float | None) -> dict:
    """Sum the non-null parts and compare to the workbook's own Total
    cell. Flag mismatch ≥1% per Rule 2."""
    nums = [p for p in parts if p is not None]
    if not nums or total is None:
        return {"match": None, "parts_sum": sum(nums) if nums else None, "total": total, "delta_pct": None}
    parts_sum = sum(nums)
    if total == 0:
        return {"match": parts_sum == 0, "parts_sum": parts_sum, "total": total, "delta_pct": 0.0}
    delta_pct = abs(parts_sum - total) / total * 100
    return {
        "match": delta_pct < 1.0,
        "parts_sum": round(parts_sum, 2),
        "total": total,
        "delta_pct": round(delta_pct, 3),
    }


# ----- Per-site builders -----------------------------------------------

def _build_dev_site(ws, site_id: str, col: int, log: list[str]) -> dict:
    """Build the capacity_pv record for a site that's present in the
    Westbrook Academies Trust workbook (4 dev sites). Phase data, secured
    capacity, DNO, reconciliation all sourced from the sheet."""

    dno = _cell_str(ws, _ROW_DNO, col)
    secured_raw = _cell_str(ws, _ROW_SECURED, col)
    secured_mva = _parse_mva(secured_raw)
    dno_supply_ref = _cell_str(ws, _ROW_DNO_SUPPLY_REF, col)
    mpan = _cell_str(ws, _ROW_MPAN, col)
    g99_ref = _cell_str(ws, _ROW_G99_REF, col)
    planning_notes = _cell_str(ws, _ROW_PLANNING_NOTES, col)
    heating_hint = _detect_heating(planning_notes)

    # Phase data extract
    areas = {k: _cell_num(ws, r, col) for k, r in _AREA_ROWS.items()}
    area_total = _cell_num(ws, _AREA_TOTAL_ROW, col)
    units = {k: _cell_num(ws, r, col) for k, r in _UNIT_ROWS.items()}
    unit_total = _cell_num(ws, _UNIT_TOTAL_ROW, col)
    pv = {k: _cell_num(ws, r, col) for k, r in _PV_ROWS.items()}
    pv_total_workbook = _cell_num(ws, _PV_TOTAL_ROW, col)

    # Reconciliation per group (Brief 19 Rule 2)
    area_rec = _reconcile(list(areas.values()), area_total)
    unit_rec = _reconcile(list(units.values()), unit_total)
    # PV row layout differs slightly — VC PV is bundled with Ph1 ("vc_p1")
    # then individual apartment phases. Sum the same 5 keys.
    pv_rec = _reconcile(list(pv.values()), pv_total_workbook)

    if area_rec.get("match") is False:
        log.append(f"  WARNING: {site_id} area reconciliation off by {area_rec['delta_pct']}%")
    if unit_rec.get("match") is False:
        log.append(f"  WARNING: {site_id} unit reconciliation off by {unit_rec['delta_pct']}%")
    if pv_rec.get("match") is False:
        log.append(f"  WARNING: {site_id} PV reconciliation off by {pv_rec['delta_pct']}%")

    # Build phases[] — one entry per logical phase. VC P1 is a distinct
    # phase from Apt P1 to keep the matrix alignment with the Brief 18
    # heating_by_phase block.
    operational_set = _OPERATIONAL_PHASES.get(site_id, set())

    phases = []
    # VC P1 — combines VC Communal + VC Resi for area; units come from
    # VC Resi row; PV from row 48 (Ph1 VC + others).
    vc_area = (areas.get("vc_communal") or 0) + (areas.get("vc_resi") or 0)
    phases.append({
        "phase": "vc_p1",
        "label": "Village centre · Phase 1",
        "pv_kwp": pv.get("vc_p1"),
        "area_m2": vc_area if vc_area > 0 else None,
        "units": units.get("vc_resi"),
        "operational": "vc_p1" in operational_set,
        "heating_type_hint": heating_hint,
    })
    for slot in ("apt_p1", "apt_p2", "apt_p3", "apt_p4"):
        phases.append({
            "phase": slot,
            "label": f"Apartments · Phase {slot[-1]}",
            "pv_kwp": pv.get(slot),
            "area_m2": areas.get(slot),
            "units": units.get(slot),
            "operational": slot in operational_set,
            "heating_type_hint": heating_hint,
        })

    # PV current vs full (Brief 19 Rule 5)
    pv_kwp_current = sum(
        p["pv_kwp"] for p in phases
        if p["operational"] and p["pv_kwp"] is not None
    )
    pv_kwp_full = sum(p["pv_kwp"] for p in phases if p["pv_kwp"] is not None)

    return {
        "data_source": "design_workbook",
        "dno": dno,
        "dno_supply_ref": dno_supply_ref,
        "g99_ref": g99_ref,
        "mpan": mpan,
        "secured_capacity_mva": secured_mva,
        "secured_capacity_source": "design_workbook",
        "secured_capacity_raw": secured_raw,
        # site_peak_load_kw + headroom filled in later via _merge_peak()
        "site_peak_load_kw": None,
        "site_peak_load_source": None,
        "site_peak_load_scope": None,
        "headroom_kva": None,
        "headroom_pct": None,
        "pv_kwp_current": pv_kwp_current,
        "pv_kwp_full": pv_kwp_full,
        "phases": phases,
        "reconciliation": {
            "area": area_rec,
            "units": unit_rec,
            "pv": pv_rec,
        },
        "missing_fields": [],
        "planning_notes": planning_notes,
    }


def _build_absent_site(site_id: str, in_scope: bool) -> dict:
    """Build the capacity_pv record for a site NOT in the workbook
    (8 operational sites + Edwalton + any unmapped). Per Rule 4 the
    schema is extended to every portfolio site with explicit nulls and
    a missing_fields list — never zero, never guess (Rule 1)."""
    return {
        "data_source": "absent_from_workbook",
        "dno": None,
        "dno_supply_ref": None,
        "g99_ref": None,
        "mpan": None,
        "secured_capacity_mva": None,
        "secured_capacity_source": None,
        "secured_capacity_raw": None,
        "site_peak_load_kw": None,
        "site_peak_load_source": None,
        "site_peak_load_scope": None,
        "headroom_kva": None,
        "headroom_pct": None,
        "pv_kwp_current": None,
        "pv_kwp_full": None,
        "phases": [],
        "reconciliation": None,
        "missing_fields": [
            "secured_capacity_mva",
            "dno",
            "phases",
            "pv_kwp_current",
            "pv_kwp_full",
        ],
        "planning_notes": None,
        "in_scope": in_scope,
    }


# ----- Stark peak merge -------------------------------------------------

# Bulk-arrangement sites where the landlord MPAN IS the full site supply.
# For DNO / BNO sites the landlord MPAN sees only the landlord side; the
# Stark peak doesn't represent the full site load. This list mirrors
# POWER_ARRANGEMENT in eir/src/components/portfolio/PortfolioEnergy.jsx.
# Chris ask 4 Jun: Ampfield Meadows is BNO (not bulk) — same as Ledian.
_BULK_FULL_SITE_SCOPE = {
    "austin-heath", "gifford-lea", "millfield-green",
    "blendworth-hills", "millbrook-village",
    "sonning-common", "edwalton-office",  # office is single-MPAN
}


def _merge_peak(records: dict[str, dict], hh_index: dict, log: list[str]) -> None:
    """Mutate `records` in place — fold the Brief 19 Part 1a-corrected
    `peak_kw` field from half_hourly_index.json onto each site.

    For sites with multiple landlord MPANs (e.g. Elderswell Electric
    Room + Plant Room), sum the peaks — best operational approximation
    of the combined landlord-side max demand.

    Sets site_peak_load_kw, site_peak_load_source, site_peak_load_scope,
    headroom_kva, headroom_pct."""

    # Aggregate ready MPAN peaks per site
    per_site_peaks: dict[str, list[float]] = {}
    for entry in hh_index.get("mpans", []):
        if entry.get("data_status") != "ready":
            continue
        sid = entry.get("site_id")
        pk = entry.get("peak_kw")
        if sid and pk is not None:
            per_site_peaks.setdefault(sid, []).append(pk)

    for site_id, rec in records.items():
        peaks = per_site_peaks.get(site_id, [])
        if peaks:
            # Sum across MPANs (landlord-side coincident worst-case)
            site_peak = round(sum(peaks), 1)
            rec["site_peak_load_kw"] = site_peak
            rec["site_peak_load_source"] = "stark_hh"
            rec["site_peak_load_scope"] = (
                "full_site" if site_id in _BULK_FULL_SITE_SCOPE
                else "landlord_only"
            )
            # If we have secured capacity too, compute headroom
            secured = rec.get("secured_capacity_mva")
            if secured is not None:
                headroom_kva = round(secured * 1000 - site_peak, 1)
                headroom_pct = round(headroom_kva / (secured * 1000) * 100, 1)
                rec["headroom_kva"] = headroom_kva
                rec["headroom_pct"] = headroom_pct
            # Trim site_peak_load_kw from missing_fields if listed
            if "site_peak_load_kw" in rec.get("missing_fields", []):
                rec["missing_fields"].remove("site_peak_load_kw")
        else:
            # No Stark coverage for this site
            if rec.get("data_source") == "absent_from_workbook":
                rec["missing_fields"].append("site_peak_load_kw")
            # Dev-workbook sites without Stark peak (Ampfield, Blendworth,
            # Sonning) — track too so the UI can flag it
            elif rec.get("data_source") == "design_workbook":
                rec["missing_fields"].append("site_peak_load_kw_stark")

    log.append(f"  Stark peak merged into {sum(1 for r in records.values() if r['site_peak_load_kw'] is not None)} of {len(records)} sites")


# ----- Top-level --------------------------------------------------------

def build(
    workbook_path: Path,
    hh_index: dict,
    canonical_site_ids: list[str],
    in_scope_set: set[str],
    log: list[str],
) -> dict:
    """Read the Westbrook Academies Trust workbook + merge Stark peaks. Returns
    the capacity_pv.json payload structure.

    `canonical_site_ids` is the full 13-site portfolio list (from
    site_resolver.CANONICAL_SITES). `in_scope_set` is the GRESB FY25
    in-scope subset (so out-of-scope sites carry the in_scope flag).
    """
    from openpyxl import load_workbook
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

    log.append("")
    log.append("[Capacity + PV phasing] Brief 19 Part 1b — reading Westbrook Academies Trust workbook")

    if not workbook_path.exists():
        log.append(f"  ERROR: workbook missing at {workbook_path}")
        # Emit empty payload — downstream consumers should treat as a no-op
        return {
            "purpose": "ECPR/strategy",
            "data_source": "missing_workbook",
            "sites": {},
            "portfolio_rollup": None,
        }

    wb = load_workbook(workbook_path, data_only=True, read_only=False)
    if "Site Info" not in wb.sheetnames:
        log.append(f"  ERROR: 'Site Info' sheet not found in workbook")
        return {
            "purpose": "ECPR/strategy",
            "data_source": "missing_sheet",
            "sites": {},
            "portfolio_rollup": None,
        }
    ws = wb["Site Info"]

    # Build per-site records — every canonical site gets one (Rule 4)
    records: dict[str, dict] = {}
    for sid in canonical_site_ids:
        if sid in _WORKBOOK_COLS:
            col = _WORKBOOK_COLS[sid]
            records[sid] = _build_dev_site(ws, sid, col, log)
            log.append(f"  → {sid}: secured={records[sid]['secured_capacity_mva']} MVA, "
                      f"phases={len(records[sid]['phases'])}, "
                      f"PV current={records[sid]['pv_kwp_current']} / full={records[sid]['pv_kwp_full']} kWp")
        else:
            records[sid] = _build_absent_site(sid, in_scope=sid in in_scope_set)

    # Merge Stark peak (Brief 19 Part 1a-corrected peak_kw)
    _merge_peak(records, hh_index, log)

    # Portfolio rollup
    total_pv_current = sum((r.get("pv_kwp_current") or 0) for r in records.values())
    total_pv_full = sum((r.get("pv_kwp_full") or 0) for r in records.values())
    total_secured = sum((r.get("secured_capacity_mva") or 0) for r in records.values())
    sites_with_secured = sum(1 for r in records.values() if r.get("secured_capacity_mva") is not None)
    sites_with_peak = sum(1 for r in records.values() if r.get("site_peak_load_kw") is not None)
    sites_missing_capacity = sum(
        1 for r in records.values()
        if r.get("secured_capacity_mva") is None
    )

    log.append(f"  Portfolio rollup: PV current={total_pv_current:.0f} / full={total_pv_full:.0f} kWp; "
              f"secured {sites_with_secured}/{len(records)} sites; "
              f"peak {sites_with_peak}/{len(records)} sites")

    return {
        "purpose": "ECPR/strategy",
        "data_source": "design_workbook+stark_hh",
        "workbook_path": str(workbook_path.name),
        "rules_applied": [
            "no_fabrication",        # Rule 1
            "raw_row_reconciliation",  # Rule 2
            "phase_operational_default",  # Rule 3 (Chris 4 Jun: Millfield Ph1 only)
            "extended_to_all_portfolio_sites",  # Rule 4
            "two_pv_figures",        # Rule 5 (current vs full)
            "headroom_computed",     # Rule 6
            "gresb_ecpr_separation",  # Rule 7 (sibling file, not in sites.json)
        ],
        "sites": records,
        "portfolio_rollup": {
            "total_pv_current_kwp": round(total_pv_current, 1),
            "total_pv_full_kwp": round(total_pv_full, 1),
            "total_secured_capacity_mva": round(total_secured, 2),
            "sites_with_secured_capacity": sites_with_secured,
            "sites_with_measured_peak": sites_with_peak,
            "sites_missing_capacity_data": sites_missing_capacity,
        },
    }
