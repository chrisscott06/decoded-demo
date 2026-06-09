"""Heating strategy matrix data builder — Brief 18 Part 1.

Applies Chris-sourced corrections to sites.json:
  - Ledian Gardens: phases 4 -> 3 (units 72/50/40)
  - Sonning Common: phases 4 -> 2 (drop zero-unit placeholders)
  - Millfield Green: primary_heating -> "Individual GSHP"
  - Ampfield Meadows: primary_heating -> "ASHP throughout"

Then attaches a `heating_by_phase` block per site keyed by matrix slot
(`vc_p1`, `apt_p1`, `apt_p2`, `apt_p3`, `apt_p4`) with `system`,
`confidence`, and `note` fields. Allowed `system` values:

  CHP | Heat network (gas) | Heat network (ASHP) | Individual gas |
  Individual ASHP | Individual GSHP | Mixed | Hybrid | TBC | None

A `None` (null) system signals "phase does not exist" — the UI renders
a dashed empty cell, visually distinct from a TBC cell.

Mutates `sites` dict in place. Idempotent.
"""

from __future__ import annotations

from typing import Any


# --- Pipeline corrections (Part 1, Chris 3 Jun) -------------------------

PHASE_OVERRIDES: dict[str, dict[str, Any]] = {
    "ledian-gardens": {
        "phases": [
            {"phase": 1, "units": 72, "complete_year": 1},
            {"phase": 2, "units": 50, "complete_year": 5},
            {"phase": 3, "units": 40, "complete_year": 9},
        ],
        "total_units_planned": 162,
        "notes": "3-phase development (corrected from 4 per Chris 3 Jun). P1=72, P2=50, P3=40.",
    },
    "sonning-common": {
        # Keep existing P1 (73) and P2 (60); drop the zero-unit P3/P4 placeholders.
        "phases": "trim-to-2",
        "notes": "2-phase development per Chris 3 Jun (corrected from 4 with zero placeholders).",
    },
}

ARCHETYPE_OVERRIDES: dict[str, dict[str, str]] = {
    "millfield-green": {"primary_heating": "Individual GSHP"},
    "ampfield-meadows": {"primary_heating": "ASHP throughout"},
}


# --- Heating by phase — Brief 18 canonical table ------------------------

# Cell value: (system, confidence, note)
# system None  -> phase does not exist (dashed empty cell)

_MILLBROOK_NOTE = "Pool gas + VC ASHP + individual apt ASHP."

HEATING_BY_PHASE: dict[str, dict[str, tuple[Any, Any, Any]]] = {
    "austin-heath": {
        "vc_p1":  ("CHP", "confirmed", None),
        "apt_p1": ("CHP", "confirmed", None),
        "apt_p2": ("CHP", "confirmed", None),
        "apt_p3": ("CHP", "confirmed", None),
        "apt_p4": ("CHP", "confirmed", None),
    },
    "gifford-lea": {
        "vc_p1":  ("CHP", "confirmed", None),
        "apt_p1": ("CHP", "confirmed", None),
        "apt_p2": ("CHP", "confirmed", None),
        "apt_p3": ("CHP", "confirmed", None),
        "apt_p4": ("CHP", "confirmed", None),
    },
    "bramshott-place": {
        "vc_p1":  ("Individual gas", "confirmed", None),
        "apt_p1": ("Individual gas", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual ASHP", "confirmed", None),
        "apt_p4": ("Individual ASHP", "confirmed", None),
    },
    "ledian-gardens": {
        "vc_p1":  ("Heat network (gas)", "confirmed", None),
        "apt_p1": ("Heat network (gas)", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual GSHP", "confirmed", None),
        "apt_p4": (None, None, None),  # 3-phase development; no P4
    },
    "elderswell": {
        "vc_p1": (
            "Hybrid",
            "TBC",
            "Best read: GSHP + CHP at VC; gas boilers in apartments. Confirm with Westbrook operations.",
        ),
        "apt_p1": ("Individual gas", "confirmed", None),
        "apt_p2": ("Individual gas", "confirmed", None),
        "apt_p3": ("Individual gas", "confirmed", None),
        "apt_p4": ("Individual gas", "confirmed", None),
    },
    "durrants-village": {
        "vc_p1":  ("Individual ASHP", "confirmed", None),
        "apt_p1": ("Individual ASHP", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual ASHP", "confirmed", None),
        "apt_p4": ("Individual ASHP", "confirmed", None),
    },
    "millbrook-village": {
        "vc_p1":  ("Hybrid", "confirmed", _MILLBROOK_NOTE),
        "apt_p1": ("Hybrid", "confirmed", _MILLBROOK_NOTE),
        "apt_p2": ("Hybrid", "confirmed", _MILLBROOK_NOTE),
        "apt_p3": ("Hybrid", "confirmed", _MILLBROOK_NOTE),
        "apt_p4": ("Hybrid", "confirmed", _MILLBROOK_NOTE),
    },
    "great-alne-park": {
        "vc_p1":  ("Individual ASHP", "confirmed", None),
        "apt_p1": ("Individual ASHP", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual ASHP", "confirmed", None),
        "apt_p4": ("Individual ASHP", "confirmed", None),
    },
    "millfield-green": {
        "vc_p1":  ("Individual GSHP", "confirmed", None),
        "apt_p1": ("Individual GSHP", "confirmed", None),
        "apt_p2": ("Individual GSHP", "confirmed", None),
        "apt_p3": ("Individual GSHP", "confirmed", None),
        "apt_p4": ("Individual GSHP", "confirmed", None),
    },
    "ampfield-meadows": {
        "vc_p1":  ("Individual ASHP", "confirmed", None),
        "apt_p1": ("Individual ASHP", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual ASHP", "confirmed", None),
        "apt_p4": ("Individual ASHP", "confirmed", None),
    },
    "blendworth-hills": {
        "vc_p1":  ("Individual ASHP", "confirmed", None),
        "apt_p1": ("Individual ASHP", "confirmed", None),
        "apt_p2": ("Individual ASHP", "confirmed", None),
        "apt_p3": ("Individual ASHP", "confirmed", None),
        "apt_p4": ("Individual ASHP", "confirmed", None),
    },
    "sonning-common": {
        "vc_p1":  ("Individual GSHP", "confirmed", None),
        "apt_p1": ("Individual GSHP", "confirmed", None),
        "apt_p2": ("Individual GSHP", "confirmed", None),
        "apt_p3": (None, None, None),  # 2-phase; no P3
        "apt_p4": (None, None, None),
    },
    "edwalton-office": {
        "vc_p1":  (None, None, None),  # office, out of scope
        "apt_p1": (None, None, None),
        "apt_p2": (None, None, None),
        "apt_p3": (None, None, None),
        "apt_p4": (None, None, None),
    },
}


# --- Apply -------------------------------------------------------------

def _apply_phase_overrides(sites: dict, log: list[str]) -> None:
    for site_id, override in PHASE_OVERRIDES.items():
        if site_id not in sites:
            log.append(f"  WARNING: phase override for unknown site '{site_id}'")
            continue
        phasing = sites[site_id].get("phasing") or {}
        phases_override = override.get("phases")
        if phases_override == "trim-to-2":
            current = phasing.get("phases", [])
            phasing["phases"] = current[:2]
        elif isinstance(phases_override, list):
            phasing["phases"] = phases_override
        if "total_units_planned" in override:
            phasing["total_units_planned"] = override["total_units_planned"]
        if "notes" in override:
            phasing["notes"] = override["notes"]
        sites[site_id]["phasing"] = phasing
        log.append(
            f"  Phasing override: {site_id} -> {len(phasing['phases'])} phase(s)"
        )


def _apply_archetype_overrides(sites: dict, log: list[str]) -> None:
    for site_id, fields in ARCHETYPE_OVERRIDES.items():
        if site_id not in sites:
            log.append(f"  WARNING: archetype override for unknown site '{site_id}'")
            continue
        arche = sites[site_id].get("archetype") or {}
        for k, v in fields.items():
            arche[k] = v
        sites[site_id]["archetype"] = arche
        log.append(f"  Archetype override: {site_id} {fields}")


def _attach_heating_by_phase(sites: dict, log: list[str]) -> None:
    attached = 0
    for site_id, cells in HEATING_BY_PHASE.items():
        if site_id not in sites:
            log.append(f"  WARNING: heating_by_phase for unknown site '{site_id}'")
            continue
        block = {
            slot: {"system": sys_, "confidence": conf, "note": note}
            for slot, (sys_, conf, note) in cells.items()
        }
        sites[site_id]["heating_by_phase"] = block
        attached += 1
    log.append(f"  heating_by_phase attached to {attached} sites")


def apply(sites: dict, log: list[str]) -> None:
    """Brief 18 — apply corrections + heating_by_phase. Mutates `sites` in place."""
    log.append("Brief 18 — heating matrix data:")
    _apply_phase_overrides(sites, log)
    _apply_archetype_overrides(sites, log)
    _attach_heating_by_phase(sites, log)
