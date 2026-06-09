"""Sycous reader — produces dist/eir/sycous.json.

Reads the Westbrook Sycous workbook (CA-X-1004) and composes per-site sub-metering
coverage. The workbook has four useful sheets:
- 1. Summary > Network → Westbrook Site mapping (rows 6-12)
- 1. Summary > Site-level overview (rows 17-23): properties + meters + services
- 1. Summary > Detail by site and service (rows 28-39): per-service stats
- 3. Reconciliation (rows 5-18): YES/NO + narrative note per site

Output keys all 13 canonical sites; 7 with in_sycous=true, 6 with in_sycous=false.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from site_resolver import CANONICAL_SITES, is_known_unmapped, resolve


# Display names used in this workbook that aren't in the canonical resolver's variants.
_EXTRA_NAMES = {
    "Beechgrove Primary School": "austin-heath",
}


def _resolve_sycous_site(name: str | None) -> str | None:
    if name is None:
        return None
    if name in _EXTRA_NAMES:
        return _EXTRA_NAMES[name]
    return resolve(name)


def _to_str(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def _to_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def _to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def find_workbook(source_data: Path) -> Path:
    candidates = list(source_data.glob("*1004*Sycous*.xlsx"))
    if not candidates:
        candidates = list(source_data.glob("*Sycous*.xlsx"))
    if not candidates:
        raise FileNotFoundError(f"No Sycous workbook (*1004*Sycous*) in {source_data}")
    return candidates[0]


def _read_network_mapping(ws, log: list[str]) -> dict[str, str]:
    """Rows 6-12: Sycous Network → Westbrook Site display name. Returns {site_id: network}."""
    out: dict[str, str] = {}
    for r in range(6, 13):
        network = _to_str(ws.cell(r, 1).value)
        ivg_name = _to_str(ws.cell(r, 2).value)
        if not network or not ivg_name:
            continue
        sid = _resolve_sycous_site(ivg_name)
        if sid:
            out[sid] = network
        else:
            log.append(f"  [Sycous] unmapped Westbrook name in network mapping: {ivg_name!r}")
    return out


def _read_site_overview(ws, log: list[str]) -> dict[str, dict]:
    """Rows 17-23: site-level overview (Properties, Services, Meters, Services covered)."""
    out: dict[str, dict] = {}
    for r in range(17, 24):
        name = _to_str(ws.cell(r, 1).value)
        if not name:
            continue
        sid = _resolve_sycous_site(name)
        if not sid:
            log.append(f"  [Sycous] unmapped site in overview: {name!r}")
            continue
        out[sid] = {
            "properties_count": _to_int(ws.cell(r, 2).value),
            "services_count": _to_int(ws.cell(r, 3).value),
            "meters_count": _to_int(ws.cell(r, 4).value),
            "services_covered": [s.strip() for s in (_to_str(ws.cell(r, 5).value) or "").split(",") if s.strip()],
        }
    return out


def _read_service_detail(ws, log: list[str]) -> dict[str, list[dict]]:
    """Rows 28-39: per-site per-service detail. Returns {site_id: [service rows...]}."""
    out: dict[str, list[dict]] = {}
    for r in range(28, 40):
        name = _to_str(ws.cell(r, 1).value)
        service = _to_str(ws.cell(r, 2).value)
        if not name or not service:
            continue
        sid = _resolve_sycous_site(name)
        if not sid:
            continue
        properties = _to_int(ws.cell(r, 3).value)
        meters = _to_int(ws.cell(r, 4).value)
        valid_reads = _to_int(ws.cell(r, 5).value)
        total_reads = _to_int(ws.cell(r, 6).value)
        data_quality = _to_float(ws.cell(r, 7).value)  # 0..1
        annual_total = _to_float(ws.cell(r, 8).value)
        unit = _to_str(ws.cell(r, 9).value)
        out.setdefault(sid, []).append({
            "service": service,
            "properties": properties,
            "meters": meters,
            "valid_reads": valid_reads,
            "total_reads": total_reads,
            "data_quality_pct": int(round((data_quality or 0) * 100)),
            "annual_total": round(annual_total, 1) if annual_total is not None else None,
            "unit": unit,
        })
    return out


def _read_reconciliation(ws, log: list[str]) -> dict[str, dict]:
    """Rows 5-18: per-site YES/NO + narrative note."""
    out: dict[str, dict] = {}
    for r in range(5, 19):
        name = _to_str(ws.cell(r, 1).value)
        if not name:
            continue
        in_sycous_raw = _to_str(ws.cell(r, 2).value) or ""
        note = _to_str(ws.cell(r, 6).value)
        in_sycous = in_sycous_raw.upper() == "YES"
        sid = _resolve_sycous_site(name)
        if not sid:
            if not is_known_unmapped(name):
                log.append(f"  [Sycous] unmapped site in reconciliation: {name!r}")
            continue
        out[sid] = {"in_sycous": in_sycous, "reconciliation_note": note}
    return out


def read_sycous(workbook_path: Path, log: list[str]) -> dict:
    log.append("")
    log.append(f"[Sycous] Reading: {workbook_path.name}")

    wb = load_workbook(workbook_path, data_only=True, read_only=True)
    summary = wb["1. Summary"]
    recon = wb["3. Reconciliation"]

    networks = _read_network_mapping(summary, log)
    overviews = _read_site_overview(summary, log)
    services_by_site = _read_service_detail(summary, log)
    reconciliation = _read_reconciliation(recon, log)

    by_site: dict[str, dict] = {}
    supply_types: set[str] = set()
    total_properties = 0
    total_meters = 0
    sites_with_sycous = 0

    # Iterate all canonical sites (Phase 0 list); attach Sycous data if present.
    for sid in CANONICAL_SITES:
        rec = reconciliation.get(sid)
        # Decide in_sycous: prefer the reconciliation tab, fall back to overview presence
        in_sycous = (rec or {}).get("in_sycous") if rec else (sid in overviews)

        if in_sycous:
            sites_with_sycous += 1
            overview = overviews.get(sid, {})
            by_site[sid] = {
                "in_sycous": True,
                "sycous_network": networks.get(sid),
                "properties_count": overview.get("properties_count"),
                "meters_count": overview.get("meters_count"),
                "services_covered": overview.get("services_covered", []),
                "by_service": services_by_site.get(sid, []),
                "reconciliation_note": (rec or {}).get("reconciliation_note"),
            }
            total_properties += overview.get("properties_count") or 0
            total_meters += overview.get("meters_count") or 0
            for s in services_by_site.get(sid, []):
                if s.get("service"):
                    supply_types.add(s["service"])
        else:
            by_site[sid] = {
                "in_sycous": False,
                "reconciliation_note": (rec or {}).get("reconciliation_note"),
            }

    portfolio = {
        "sites_with_sycous": sites_with_sycous,
        "sites_without_sycous": len(CANONICAL_SITES) - sites_with_sycous,
        "total_properties_metered": total_properties,
        "total_meters": total_meters,
        "supply_types": sorted(supply_types),
    }

    log.append(f"  → sycous.json: {sites_with_sycous} in Sycous, {portfolio['sites_without_sycous']} not. Total properties {total_properties}, meters {total_meters}.")
    return {"by_site": by_site, "portfolio": portfolio}
