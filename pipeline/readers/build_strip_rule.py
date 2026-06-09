"""Brief 17.5 Part 2 — arbnco strip-rule resolver.

Resident energy was previously summarised in the pipeline as
`derived_resident_elec_kwh` + `derived_resident_gas_kwh` per site, both
sourced from the workbook's "Derived Resident Energy" sheet (arbnco
total minus Eco landlord). That formula is correct at DNO sites — where
residents have their own MPANs and arbnco's aggregated feed minus the
landlord meter is a defensible estimate — but WRONG at bulk-meter
microgrid sites, where the arbnco-minus-Eco delta is a meter-count or
timing artefact, not a real resident-consumption figure.

The strip-rule below corrects this per the site-arrangement matrix
agreed with Chris (Brief 17.5 §"The strip-rule, definitive"). Resident
consumption is sourced PER SITE by arrangement, never portfolio-wide.

Output: each `reconciliation["by_site"][sid]` gets a new
`resident_kwh_by_source` block with three subfields:

  - submetered_elec        Sycous "Electricity" annual_total (where covered)
  - submetered_heat        Sycous "Heat & Hot Water" annual_total (where covered)
  - arbnco_derived_elec    derived_resident_elec_kwh from Ecotricity workbook,
                           BUT only at DNO sites — stripped (None) at bulk-meter sites

Sites with neither sub-metering nor a defensible DNO derivation
(Millbrook Village; Sonning Common bulk; Edwalton Office) get null
subfields and are honestly labelled in the chart legend / tooltip.

Resident gas is intentionally NOT carried as a separate subfield:
  - At DNO sites, residents have their own gas suppliers — invisible to Westbrook.
  - At bulk-microgrid sites, resident heat is the right resident category;
    the gas IS the heat-network INPUT which already lives in
    landlord_gas (Scope 1). Surfacing both would double-count.

Also computes the portfolio-wide `derived_resident_gwh` figure for the
portfolio_inscope block, which is the sum of the three subfields across
in-scope sites, in GWh.
"""

from __future__ import annotations


# ----- Site-arrangement matrix (Brief 17.5 §"The strip-rule, definitive") -----

# DNO sites: residents on individual MPANs with their own suppliers.
# arbnco-minus-Eco is the defensible resident-elec estimate; some also
# have Sycous heat coverage for the resident heat segment.
DNO_SITES = {
    "bramshott-place",
    "durrants-village",
    "great-alne-park",
    "elderswell",      # DNO + Sycous heat
    "ledian-gardens",  # DNO-Westbrook-cable + Sycous heat
}

# Bulk-meter sites with Sycous coverage: resident energy passes through
# the Westbrook landlord supply and is sub-billed via Sycous. arbnco's
# resident delta is an artefact and is STRIPPED. Sub-metered figures
# come from Sycous `annual_total` per service.
BULK_SITES_WITH_SYCOUS = {
    "austin-heath",
    "gifford-lea",
    "millfield-green",
    "ampfield-meadows",
    "blendworth-hills",  # Sycous covers but reads are mostly zero
}

# Bulk-meter sites WITHOUT Sycous: arbnco STRIPPED, no resident segment
# can be reconstructed honestly. Chart labels these as "resident segment
# not extractable" rather than inventing a number.
BULK_SITES_WITHOUT_SYCOUS = {
    "millbrook-village",
}

# GRESB FY25 out-of-scope sites — all subfields null.
OUT_OF_SCOPE = {
    "sonning-common",   # FY26 launch
    "edwalton-office",  # office, not residential
}


def _sycous_services(syc_site: dict) -> dict:
    """Return Sycous services keyed by service name, only if site is in Sycous."""
    if not syc_site or not syc_site.get("in_sycous"):
        return {}
    return {svc.get("service"): svc for svc in (syc_site.get("by_service") or [])}


def _strip_for_site(sid: str, rec_site: dict, syc_site: dict) -> dict:
    """Compute `resident_kwh_by_source` for one site."""
    services = _sycous_services(syc_site)
    elec_svc = services.get("Electricity")
    heat_svc = services.get("Heat & Hot Water")

    submetered_elec = elec_svc.get("annual_total") if elec_svc else None
    submetered_heat = heat_svc.get("annual_total") if heat_svc else None
    arbnco_derived_elec = None
    arbnco_was_stripped = False

    derived_elec_raw = (rec_site or {}).get("derived_resident_elec_kwh")
    derived_gas_raw = (rec_site or {}).get("derived_resident_gas_kwh")
    # "Stripped" = a non-zero arbnco-minus-Eco delta existed for either
    # commodity at this site and we deliberately chose not to surface it
    # as resident consumption. Provenance flag for the chart tooltip.
    had_arbnco_delta = bool((derived_elec_raw or 0) or (derived_gas_raw or 0))

    if sid in OUT_OF_SCOPE:
        # All null — chart shows nothing for these sites.
        return {
            "submetered_elec": None,
            "submetered_heat": None,
            "arbnco_derived_elec": None,
            "arbnco_was_stripped": False,
            "arrangement": "out-of-scope-fy25",
        }

    if sid in DNO_SITES:
        # arbnco-minus-Eco is the defensible resident-elec figure.
        arbnco_derived_elec = derived_elec_raw or 0.0
        # Bramshott/Durrants/Great Alne have no Sycous; Elderswell+Ledian have Sycous heat.
        # Sub-metered elec is meaningless on DNO sites (residents not on the bulk meter).
        submetered_elec = None
        return {
            "submetered_elec": submetered_elec,
            "submetered_heat": submetered_heat,
            "arbnco_derived_elec": round(arbnco_derived_elec, 2),
            "arbnco_was_stripped": False,
            "arrangement": "dno+sycous-heat" if heat_svc else "dno",
        }

    if sid in BULK_SITES_WITH_SYCOUS:
        # STRIP arbnco — the arbnco-minus-Eco delta is a meter artefact, not real.
        # Sycous is the source of truth.
        arbnco_was_stripped = had_arbnco_delta
        return {
            "submetered_elec": round(submetered_elec, 2) if submetered_elec else None,
            "submetered_heat": round(submetered_heat, 2) if submetered_heat else None,
            "arbnco_derived_elec": None,
            "arbnco_was_stripped": arbnco_was_stripped,
            "arrangement": "bulk+sycous",
        }

    if sid in BULK_SITES_WITHOUT_SYCOUS:
        # STRIP arbnco; no defensible substitute. Label honestly.
        arbnco_was_stripped = had_arbnco_delta
        return {
            "submetered_elec": None,
            "submetered_heat": None,
            "arbnco_derived_elec": None,
            "arbnco_was_stripped": arbnco_was_stripped,
            "arrangement": "bulk-no-sycous",
        }

    # Fallback for any site not classified (shouldn't happen with the
    # current 13-site portfolio, but defends against future additions
    # landing in this function without an arrangement assignment).
    return {
        "submetered_elec": None,
        "submetered_heat": None,
        "arbnco_derived_elec": None,
        "arbnco_was_stripped": False,
        "arrangement": "unclassified",
    }


def apply_strip_rule(reconciliation: dict, sycous: dict, log: list[str]) -> dict:
    """Mutate reconciliation in place: add resident_kwh_by_source per site.

    Returns the reconciliation dict for chaining. The caller is responsible
    for re-writing reconciliation.json to disk.
    """
    log.append("")
    log.append("[Strip rule] applying arbnco/Sycous resident split (Brief 17.5 Part 2)")

    by_site_rec = reconciliation.get("by_site") or {}
    by_site_syc = (sycous or {}).get("by_site") or {}

    # All known site ids (union of recognised arrangement sets) for verifying
    # coverage. New sites not in any set get the unclassified fallback above.
    classified = DNO_SITES | BULK_SITES_WITH_SYCOUS | BULK_SITES_WITHOUT_SYCOUS | OUT_OF_SCOPE

    stripped_count = 0
    dno_total_kwh = 0.0
    submetered_elec_total = 0.0
    submetered_heat_total = 0.0

    for sid, rec_site in by_site_rec.items():
        syc_site = by_site_syc.get(sid, {})
        strip = _strip_for_site(sid, rec_site, syc_site)
        rec_site["resident_kwh_by_source"] = strip

        if strip["arbnco_was_stripped"]:
            stripped_count += 1
        if strip["arbnco_derived_elec"]:
            dno_total_kwh += strip["arbnco_derived_elec"]
        if strip["submetered_elec"]:
            submetered_elec_total += strip["submetered_elec"]
        if strip["submetered_heat"]:
            submetered_heat_total += strip["submetered_heat"]

    unclassified = [sid for sid in by_site_rec if sid not in classified]
    if unclassified:
        log.append(f"  WARNING: {len(unclassified)} site(s) unclassified by strip-rule: {unclassified}")

    log.append(f"  Stripped arbnco_derived at {stripped_count} bulk-meter sites")
    log.append(f"  DNO arbnco-derived-elec total: {dno_total_kwh / 1e6:.3f} GWh")
    log.append(f"  Sycous submetered-elec total: {submetered_elec_total / 1e6:.3f} GWh")
    log.append(f"  Sycous submetered-heat total: {submetered_heat_total / 1e6:.3f} GWh")
    log.append(f"  Resident-kwh-by-source total (in-scope universe): {(dno_total_kwh + submetered_elec_total + submetered_heat_total) / 1e6:.3f} GWh")

    return reconciliation


def recompute_portfolio_derived_resident_gwh(portfolio: dict, reconciliation: dict, log: list[str]) -> None:
    """Re-write portfolio['portfolio_inscope']['energy']['derived_resident_gwh']
    using the new strip-rule subfields, summed across in-scope sites.

    Replaces the previous (incorrect) value that was summed straight from
    `derived_resident_elec_kwh + derived_resident_gas_kwh` per site — that
    figure over-counted bulk-meter sites' arbnco artefacts. The new figure
    is honest: sub-metered elec + sub-metered heat (Sycous) + arbnco-
    derived elec (DNO only).
    """
    in_scope_ids = portfolio.get("portfolio_inscope", {}).get("site_ids") or []
    by_site_rec = reconciliation.get("by_site") or {}

    total_kwh = 0.0
    breakdown = {"submetered_elec": 0.0, "submetered_heat": 0.0, "arbnco_derived_elec": 0.0}

    for sid in in_scope_ids:
        s = (by_site_rec.get(sid) or {}).get("resident_kwh_by_source") or {}
        for k in breakdown:
            v = s.get(k) or 0
            breakdown[k] += v
            total_kwh += v

    derived_gwh = round(total_kwh / 1e6, 3)

    inscope = portfolio.setdefault("portfolio_inscope", {})
    inscope_energy = inscope.setdefault("energy", {})
    inscope_energy["derived_resident_gwh"] = derived_gwh
    inscope_energy["derived_resident_breakdown_kwh"] = {
        k: round(v, 2) for k, v in breakdown.items()
    }

    log.append(f"  portfolio_inscope.derived_resident_gwh = {derived_gwh:.3f} GWh")
    log.append(f"  breakdown: submetered_elec {breakdown['submetered_elec']/1e6:.3f} + "
               f"submetered_heat {breakdown['submetered_heat']/1e6:.3f} + "
               f"arbnco_derived_elec {breakdown['arbnco_derived_elec']/1e6:.3f} GWh")


# ----- Elderswell grid_type override -----
# Per Brief 17.5 §Why this brief #4. Source workbook Site Overview lists
# Elderswell `grid_type` as null; Chris confirmed the actual arrangement is
# DNO for electricity + Sycous-covered for heat & hot water. Apply as a
# post-read override so the JSON output carries the canonical value
# without modifying the source xlsx (which we never write to).

ELDERSWELL_GRID_TYPE = "DNO (individual MPANs) + Sycous heat"

# Brief 21 (Chris confirmed 4 Jun) — Millbrook source workbook labels
# `grid_type` as "Bulk (microgrid)" but the arbnco data shows 174 individual
# electric MPANs at Millbrook (vs 12 known to Ecotricity), making it a DNO
# arrangement. Sycous hasn't onboarded Millbrook yet but the underlying
# arrangement is individual MPANs per resident. Override to match reality
# per the metering reconciliation.
MILLBROOK_GRID_TYPE = "DNO (individual MPANs)"
MILLBROOK_METERING_ARRANGEMENT = "Individual MPANs"


def apply_site_overrides(sites: dict, log: list[str]) -> None:
    """Apply post-read corrections to sites.json structure that the source
    workbook does not carry. Currently: Elderswell grid_type (Brief 17.5),
    Millbrook grid_type + metering (Brief 21).
    """
    elderswell = sites.get("elderswell")
    if elderswell is not None:
        archetype = elderswell.setdefault("archetype", {})
        previous = archetype.get("grid_type")
        archetype["grid_type"] = ELDERSWELL_GRID_TYPE
        log.append(f"  Elderswell grid_type override: {previous!r} → {ELDERSWELL_GRID_TYPE!r}")

    millbrook = sites.get("millbrook-village")
    if millbrook is not None:
        archetype = millbrook.setdefault("archetype", {})
        prev_grid = archetype.get("grid_type")
        prev_meter = archetype.get("metering_arrangement")
        archetype["grid_type"] = MILLBROOK_GRID_TYPE
        archetype["metering_arrangement"] = MILLBROOK_METERING_ARRANGEMENT
        log.append(f"  Millbrook grid_type override: {prev_grid!r} → {MILLBROOK_GRID_TYPE!r}")
        log.append(f"  Millbrook metering_arrangement override: {prev_meter!r} → {MILLBROOK_METERING_ARRANGEMENT!r}")
