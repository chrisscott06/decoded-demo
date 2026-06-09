"""Brief 24.8 Part 1 - consumption methodology pass.

Layers Total / Landlord / Resident figures on top of the existing
reconciliation structure, fixing the bulk-site double-counting bug
that inflated portfolio totals 2-4x at bulk-metered sites.

Background. At bulk-metered sites (Austin, Gifford, Penrith Community,
Aldergate SEN, Pennington Prep) the Portfolio Consumption chart was stacking
Ecotricity's bulk meter reading + Sycous sub-meter readings as if
they were independent flows. They're not - Sycous sub-meters sit
physically downstream of the Ecotricity bulk meter, so adding them
counts the same kWh twice. Diagnosis (Claude Chat, 4 Jun) confirmed
via the pre-fix `reconciliation.json`. The strip-rule pass already
fixed how arbnco gets attributed (per Brief 17.5 Part 2) but didn't
fix the *additive* model the chart was reading from.

The fix here:

* At bulk-metered sites with Sycous: Total = Ecotricity bulk reading.
  Resident = Sycous total (this is what residents actually used).
  Landlord = bulk - Sycous (DERIVED). If Sycous > bulk -> data anomaly,
  flag both as TBC.
* At bulk-metered sites without Sycous: Total = bulk reading;
  Landlord + Resident = TBC honestly (can't split without sub-meters).
* At DNO sites: Total = Ecotricity landlord+void + arbnco-derived;
  Landlord = Eco landlord+void (directly measured);
  Resident = arbnco-derived (estimate-by-subtraction).
* At DNO+sycous-heat sites (Riverdale Free School): elec follows DNO path; gas
  follows the boiler path; submetered heat stays as-is in the existing
  resident_kwh_by_source block (out-of-scope for this brief's bar
  chart, surfaced in tooltips).

Output - per site under `reconciliation["by_site"][sid]`:

  total_site_kwh:   {electricity, gas, total}
  landlord_kwh:     {electricity, gas, total, source, tbc_reason}
  resident_kwh:     {electricity, gas, total, source, tbc_reason}
  data_quality_flag: str | None

Plus extension to the top-level `portfolio` block:

  methodology_v2: {
    total_kwh, landlord_kwh, resident_kwh,
    sites_with_full_data, sites_with_tbc, in_scope_count
  }

The new fields LAYER ON TOP of existing reconciliation fields; they
do not replace anything. Downstream code that reads
`eco_landlord_elec_kwh` keeps working. Once every downstream surface
moves over to the new model, a separate cleanup brief can drop the
old keys.
"""

from __future__ import annotations

from typing import Optional


# ----- Site classification -----
# Pulled in from build_strip_rule's site-arrangement matrix. Single
# source of truth for which site is on which path.
from .build_strip_rule import (
    DNO_SITES,
    BULK_SITES_WITH_SYCOUS,
    BULK_SITES_WITHOUT_SYCOUS,
    OUT_OF_SCOPE,
)


# Sites where Sycous is *deployed* but currently reads 0 kWh - per
# Brief 24.8 Part 1 reader-note, "*Pennington Prep has Sycous deployed but
# currently shows 0 kWh - treat as bulk-no-Sycous case for now."
# Detected dynamically (submetered_elec == 0 or None) rather than
# hard-coded so the Pennington Prep case auto-recovers when Sycous starts
# reporting non-zero numbers without code changes.

# Per the brief: portfolio total electricity should land 6-10 GWh
# (down from inflated 10.0 GWh under the old additive model). If
# outside this band, surface in the log so we can stop before Part 5.
SANITY_ELEC_GWH_MIN = 6.0
SANITY_ELEC_GWH_MAX = 10.0


def _num(value) -> float:
    """Coerce to float, treating None as 0."""
    return float(value or 0)


def _round_or_none(value: Optional[float]) -> Optional[float]:
    """Round to 2dp for kWh display; preserve None for TBC values."""
    if value is None:
        return None
    return round(value, 2)


def _compute_for_site(sid: str, rec_site: dict) -> dict:
    """Apply the methodology to one site's reconciliation entry.

    Returns a dict with the four new top-level keys. Caller is
    responsible for merging into rec_site.
    """
    rks = rec_site.get("resident_kwh_by_source") or {}
    arrangement = rks.get("arrangement", "unclassified")

    eco_landlord_elec = _num(rec_site.get("eco_landlord_elec_kwh"))
    eco_void_elec = _num(rec_site.get("eco_void_elec_kwh"))
    eco_gas = _num(rec_site.get("eco_gas_kwh"))
    arbnco_derived_elec = _num(rks.get("arbnco_derived_elec"))
    submetered_elec = _num(rks.get("submetered_elec"))

    # Defaults - get overwritten per arrangement branch below.
    total_elec: Optional[float] = 0.0
    landlord_elec: Optional[float] = 0.0
    landlord_source = "measured"
    landlord_tbc_reason: Optional[str] = None
    resident_elec: Optional[float] = 0.0
    resident_source = "measured"
    resident_tbc_reason: Optional[str] = None
    data_quality_flag: Optional[str] = None

    if arrangement == "out-of-scope-fy25":
        # Sonning Common, Edwalton - not in the in-scope universe.
        # Carry the fields so the consumer doesn't crash but everything
        # is null. The chart filters these out by in_scope_count
        # anyway.
        total_elec = None
        landlord_elec = None
        resident_elec = None
        landlord_source = "not_applicable"
        resident_source = "not_applicable"

    elif arrangement == "bulk+sycous":
        # Bulk meter is the trusted site total. Resident = Sycous.
        # Landlord = bulk - Sycous (derived). If Sycous deployed but
        # reads 0 (Pennington Prep), fall through to the no-sycous branch
        # so we surface honest TBC rather than calling 0-resident
        # "measured".
        total_elec = eco_landlord_elec
        if submetered_elec > 0:
            derived_landlord = eco_landlord_elec - submetered_elec
            if derived_landlord < 0:
                # Sycous > bulk - physically impossible if both measure
                # electricity. Flag and TBC the split. Keep total.
                landlord_elec = None
                resident_elec = None
                landlord_source = "TBC"
                resident_source = "TBC"
                landlord_tbc_reason = (
                    "Sycous sub-meter readings exceed the bulk meter "
                    "total, which is physically impossible if both "
                    "measure electricity. NZA is investigating with "
                    "Westbrook and Sycous to determine whether the Sycous "
                    "data is mis-categorised or has a units/pipeline "
                    "error. Until resolved, only the bulk meter total "
                    "is reliable."
                )
                resident_tbc_reason = landlord_tbc_reason
                data_quality_flag = f"{sid}_sycous_anomaly"
            else:
                landlord_elec = derived_landlord
                landlord_source = "derived"
                resident_elec = submetered_elec
                resident_source = "measured"
        else:
            # Sycous deployed but reading 0 - treat as bulk-no-sycous.
            # Per the brief: Pennington Prep currently. Auto-recovers when
            # Sycous starts reporting.
            landlord_elec = None
            resident_elec = None
            landlord_source = "TBC"
            resident_source = "TBC"
            landlord_tbc_reason = (
                "Sycous sub-metering deployed but currently reading "
                "zero. NZA is working with Westbrook and Sycous to bring "
                "the sub-meters online; until then the landlord/"
                "resident split cannot be derived."
            )
            resident_tbc_reason = landlord_tbc_reason
            data_quality_flag = f"{sid}_sycous_zero_reads"

    elif arrangement == "bulk-no-sycous":
        # Marston Hill. Total = bulk; split is unknowable until Sycous
        # gets deployed.
        total_elec = eco_landlord_elec + eco_void_elec
        landlord_elec = None
        resident_elec = None
        landlord_source = "TBC"
        resident_source = "TBC"
        landlord_tbc_reason = (
            "Bulk-metered site with no Sycous sub-metering deployed. "
            "The landlord/resident split cannot be derived without "
            "sub-meter data. NZA is working with Westbrook to deploy Sycous."
        )
        resident_tbc_reason = landlord_tbc_reason
        data_quality_flag = f"{sid}_no_sycous"

    elif arrangement in ("dno", "dno+sycous-heat"):
        # Eco landlord + void = directly-measured Westbrook supply.
        # arbnco-derived = estimate of resident consumption (own
        # MPANs).
        landlord_elec = eco_landlord_elec + eco_void_elec
        landlord_source = "measured"
        resident_elec = arbnco_derived_elec
        resident_source = "derived"
        total_elec = landlord_elec + resident_elec

    else:
        # Unclassified - defensive fallback. Don't make up numbers.
        total_elec = None
        landlord_elec = None
        resident_elec = None
        landlord_source = "unclassified"
        resident_source = "unclassified"
        data_quality_flag = f"{sid}_unclassified_arrangement"

    # Gas. Brief: Landlord gas = Ecotricity gas at all sites. Resident
    # gas = 0 (Sycous-measured heat stays as a separate concept in
    # resident_kwh_by_source.submetered_heat; including it here would
    # double-count the heat-network input with its own output).
    if arrangement == "out-of-scope-fy25":
        total_gas: Optional[float] = None
        landlord_gas: Optional[float] = None
        resident_gas: Optional[float] = None
    else:
        landlord_gas = eco_gas
        resident_gas = 0.0
        total_gas = eco_gas  # = landlord_gas at every site

    def total_of(elec: Optional[float], gas: Optional[float]) -> Optional[float]:
        # If either commodity is TBC, the combined total is undefined.
        # But at sites where elec is TBC and gas is measured, we still
        # want the gas figure surfaced - so we return the gas value
        # alone IF elec is None AND gas is not None (with a small
        # caveat: this is the lower-bound site total).
        if elec is None and gas is None:
            return None
        return _num(elec) + _num(gas)

    return {
        "total_site_kwh": {
            "electricity": _round_or_none(total_elec),
            "gas": _round_or_none(total_gas),
            "total": _round_or_none(total_of(total_elec, total_gas)),
        },
        "landlord_kwh": {
            "electricity": _round_or_none(landlord_elec),
            "gas": _round_or_none(landlord_gas),
            "total": _round_or_none(total_of(landlord_elec, landlord_gas)),
            "source": landlord_source,
            "tbc_reason": landlord_tbc_reason,
        },
        "resident_kwh": {
            "electricity": _round_or_none(resident_elec),
            "gas": _round_or_none(resident_gas),
            "total": _round_or_none(total_of(resident_elec, resident_gas)),
            "source": resident_source,
            "tbc_reason": resident_tbc_reason,
        },
        "data_quality_flag": data_quality_flag,
    }


def _aggregate_portfolio(
    reconciliation: dict,
    in_scope_ids: list[str],
) -> dict:
    """Roll the per-site methodology fields into a portfolio summary.

    TBC values are excluded from landlord/resident totals (they
    couldn't be measured). Totals at TBC sites still contribute to the
    site-total figure (the bulk meter reading is trusted), so the
    portfolio total > landlord_total + resident_total at any site with
    a TBC split.
    """
    by_site = reconciliation.get("by_site") or {}

    total_e = 0.0
    total_g = 0.0
    landlord_e = 0.0
    landlord_g = 0.0
    resident_e = 0.0
    resident_g = 0.0
    sycous_measured_elec = 0.0
    arbnco_derived_elec = 0.0
    full = []
    tbc = []

    for sid in in_scope_ids:
        s = by_site.get(sid) or {}
        total = s.get("total_site_kwh") or {}
        land = s.get("landlord_kwh") or {}
        res = s.get("resident_kwh") or {}

        if total.get("electricity") is not None:
            total_e += total["electricity"]
        if total.get("gas") is not None:
            total_g += total["gas"]

        if land.get("source") not in ("TBC", "not_applicable", "unclassified"):
            if land.get("electricity") is not None:
                landlord_e += land["electricity"]
            if land.get("gas") is not None:
                landlord_g += land["gas"]

        if res.get("source") not in ("TBC", "not_applicable", "unclassified"):
            if res.get("electricity") is not None:
                resident_e += res["electricity"]
            if res.get("gas") is not None:
                resident_g += res["gas"]

            # Source attribution for the by_source.* portfolio fields.
            src = res.get("source")
            re_elec = res.get("electricity") or 0
            if src == "measured":
                sycous_measured_elec += re_elec
            elif src == "derived":
                arbnco_derived_elec += re_elec
            elif src == "mixed":
                # Split per the actual underlying sources. Currently
                # no site lands here (Eastlea + Aldergate SEN read as
                # single-source under the current pipeline) but the
                # branch is here for the BNO case mentioned in the
                # brief - half attributed to each. When a site
                # actually gets mixed sources, we'll revisit using the
                # underlying raw fields.
                sycous_measured_elec += re_elec / 2
                arbnco_derived_elec += re_elec / 2

        if s.get("data_quality_flag"):
            tbc.append(sid)
        else:
            full.append(sid)

    return {
        "total_kwh": {
            "electricity": round(total_e, 2),
            "gas": round(total_g, 2),
            "total": round(total_e + total_g, 2),
        },
        "landlord_kwh": {
            "electricity": round(landlord_e, 2),
            "gas": round(landlord_g, 2),
            "total": round(landlord_e + landlord_g, 2),
        },
        "resident_kwh": {
            "electricity": round(resident_e, 2),
            "gas": round(resident_g, 2),
            "total": round(resident_e + resident_g, 2),
            "by_source": {
                "sycous_measured_elec": round(sycous_measured_elec, 2),
                "arbnco_derived_elec": round(arbnco_derived_elec, 2),
            },
        },
        "sites_with_full_data": len(full),
        "sites_with_tbc": tbc,
        "in_scope_count": len(in_scope_ids),
    }


def apply(
    reconciliation: dict,
    portfolio: dict,
    log: list[str],
) -> dict:
    """Mutate reconciliation in place: add Brief 24.8 methodology fields.

    Must run AFTER the Brief 17.5 strip-rule pass (which writes
    resident_kwh_by_source per site) and AFTER the Brief 21 metering
    pass (cosmetically - this pass doesn't depend on Brief 21 but
    keeps the field order tidy). Reads `portfolio.portfolio_inscope.
    site_ids` for the in-scope universe.

    Returns reconciliation for chaining. Caller writes the JSON.
    """
    log.append("")
    log.append("[Brief 24.8] applying Total/Landlord/Resident methodology")

    by_site = reconciliation.get("by_site") or {}
    for sid, rec_site in by_site.items():
        methodology = _compute_for_site(sid, rec_site)
        rec_site["total_site_kwh"] = methodology["total_site_kwh"]
        rec_site["landlord_kwh"] = methodology["landlord_kwh"]
        rec_site["resident_kwh"] = methodology["resident_kwh"]
        rec_site["data_quality_flag"] = methodology["data_quality_flag"]

    in_scope_ids = (
        (portfolio.get("portfolio_inscope") or {}).get("site_ids") or []
    )
    summary = _aggregate_portfolio(reconciliation, in_scope_ids)

    # Extend the existing top-level portfolio block (don't replace -
    # downstream code may still be reading the old aggregate fields).
    port_block = reconciliation.setdefault("portfolio", {})
    port_block["methodology_v2"] = summary

    elec_gwh = summary["total_kwh"]["electricity"] / 1e6
    gas_gwh = summary["total_kwh"]["gas"] / 1e6
    landlord_gwh = summary["landlord_kwh"]["total"] / 1e6
    resident_gwh = summary["resident_kwh"]["total"] / 1e6
    sycous_gwh = summary["resident_kwh"]["by_source"]["sycous_measured_elec"] / 1e6
    arbnco_gwh = summary["resident_kwh"]["by_source"]["arbnco_derived_elec"] / 1e6

    log.append(
        f"  Portfolio total: {(elec_gwh + gas_gwh):.2f} GWh "
        f"(elec {elec_gwh:.2f} GWh + gas {gas_gwh:.2f} GWh) "
        f"across {summary['in_scope_count']} in-scope sites"
    )
    log.append(
        f"  Landlord (excl TBC): {landlord_gwh:.2f} GWh total"
    )
    log.append(
        f"  Resident (excl TBC): {resident_gwh:.2f} GWh total "
        f"({sycous_gwh:.2f} measured + {arbnco_gwh:.2f} derived)"
    )
    log.append(
        f"  Sites with full data: {summary['sites_with_full_data']} "
        f"({summary['in_scope_count']} - {len(summary['sites_with_tbc'])} TBC)"
    )
    if summary["sites_with_tbc"]:
        log.append(f"  TBC sites: {summary['sites_with_tbc']}")

    # Sanity-band check per brief escalation rule.
    if not (SANITY_ELEC_GWH_MIN <= elec_gwh <= SANITY_ELEC_GWH_MAX):
        log.append(
            f"  !! SANITY-BAND WARNING: portfolio electricity {elec_gwh:.2f} GWh "
            f"outside expected {SANITY_ELEC_GWH_MIN}-{SANITY_ELEC_GWH_MAX} GWh band. "
            f"Per brief escalation rule, STOP before Part 5 prose update."
        )
    else:
        log.append(
            f"  OK: portfolio electricity {elec_gwh:.2f} GWh inside expected "
            f"{SANITY_ELEC_GWH_MIN}-{SANITY_ELEC_GWH_MAX} GWh band."
        )

    return reconciliation
