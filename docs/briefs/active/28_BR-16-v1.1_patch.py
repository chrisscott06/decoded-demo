"""Brief 28 (NZA BR-16 v1.1) patch script - GRESB Master Matrix P12 alignment.

Supersedes Brief 26's v1.0 patches. Applies all five sections of the
v1.1 patch markdown in one idempotent run:

  Section 1 - Meta / headline + new criticalRisks array
  Section 2 - Per-indicator scoring (defendable/target/stretch/status
              + max2026 corrections). Also writes v1.0 schema
              aliases (floor2026/ceiling2026/achievable2026/defendable
              2026/pointContribution2026) for back-compat with the
              existing Overview + Aspects components.
  Section 3 - Waterfall replacement (forwardPlanning.waterfall2026
              with 8 categorised blocks each carrying items[]).
              Existing forwardPlanning.waterfall.blocks ALSO repaved
              with a flattened delta-block view so Forward.jsx
              continues to render without component changes.
  Section 4 - cycle2027 + cycle2028 panels under forwardPlanning
  Section 5 - Aspect-level summaries (defendable/target/stretch + max2026)

Idempotent: re-running produces an identical gresb.json.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
GRESB_PATH = REPO / "eir" / "src" / "data" / "gresb.json"
CORRECTIONS_PATH = REPO / "docs" / "briefs" / "active" / "28_BR-16-v1.1_corrections.json"

# ===========================================================
#  Section 3 - waterfall2026 blocks (from brief markdown §3)
#  corrections.json does NOT carry the waterfall; only the markdown.
#  Captured verbatim below to preserve labels + per-item deltas.
# ===========================================================
WATERFALL_2026 = {
    "title": "Waterfall: 2025 actual → 2026 outcome",
    "subtitle": "Source: P12 Master Matrix (62 indicators)",
    "startLabel": "IVG 2025 actual",
    "startValue": 52,
    "endLabel": "2026 Central target",
    "endValue": 62,
    "blocks": [
        {
            "id": "structural-losses",
            "label": "Structural losses (2026 changes out of our control)",
            "value": -1.3,
            "type": "negative",
            "items": [
                {"code": "LE3", "label": "LE3 retired", "delta": -2.0},
                {"code": "SE2.2", "label": "SE2.2 retired", "delta": -1.0},
                {"code": "RA3", "label": "RA3 weight reduced 1.5→0.5", "delta": -0.67},
                {"code": "RA4", "label": "RA4 weight reduced 1→0.25", "delta": 0.0},
                {"code": "RA5", "label": "RA5 weight reduced 0.5→0.25", "delta": -0.25},
                {"code": "structural-gains", "label": "+ RM6.x doublings + T1.2 doubling + SE5 tripling reduce loss", "delta": 2.62},
            ],
        },
        {
            "id": "data-pipeline-gains",
            "label": "Data pipeline gains (NZA-banked)",
            "value": 2.5,
            "type": "positive",
            "items": [
                {"code": "WS1", "label": "WS1 — full waste coverage (Chris confirmed in the bag)", "delta": 1.96},
                {"code": "EN1", "label": "EN1 — small Performance/Renewable uplift on 100% gas+elec base", "delta": 0.88},
                {"code": "GH1", "label": "GH1 — scope reclassification net neutral, small LFL gain", "delta": 0.14},
                {"code": "WT1", "label": "WT1 — coverage may drop to ~50% (risk-adjusted)", "delta": -0.5},
            ],
        },
        {
            "id": "climate-workstream",
            "label": "Climate workstream (NZA-banked, 11-site extension)",
            "value": 3.5,
            "type": "positive",
            "items": [
                {"code": "RM6.1", "label": "RM6.1 transition risk ID extended to 11 sites @ doubled weight", "delta": 0.5},
                {"code": "RM6.2", "label": "RM6.2 transition impact assessment extended to 11 sites @ doubled weight", "delta": 0.5},
                {"code": "RM6.3", "label": "RM6.3 physical risk ID extended to 11 sites @ doubled weight", "delta": 0.5},
                {"code": "RM6.4", "label": "RM6.4 physical risk impact assessment NEW deliverable @ doubled weight", "delta": 1.0},
                {"code": "RA1", "label": "RA1 coverage expansion via 11-site climate work", "delta": 0.6},
                {"code": "RA2", "label": "RA2 Phase 2B TBAs (coverage TBC)", "delta": 1.5},
                {"code": "RM5", "label": "RM5 methodology refresh holds 0.5 (risk-adjusted)", "delta": -0.25},
            ],
        },
        {
            "id": "nza-deliverables",
            "label": "NZA-drafted documents (banked, sign-off pending)",
            "value": 4.55,
            "type": "positive",
            "items": [
                {"code": "RM1", "label": "RM1 — EMS framework (NZA drafts, IVG signs off as in force CY2025)", "delta": 1.0},
                {"code": "T1.1", "label": "T1.1 — Portfolio improvement targets for E/W/Waste/GHG", "delta": 0.8},
                {"code": "T1.2", "label": "T1.2 — New IVG/NWPF Net Zero target @ doubled weight", "delta": 0.8},
                {"code": "TC6.2", "label": "TC6.2 — Community impact monitoring framework (NZA-light)", "delta": 1.0},
                {"code": "RP2.1", "label": "RP2.1 — Incident monitoring process expansion", "delta": 0.1},
                {"code": "RM2/RM3.2", "label": "RM2/RM3.2 — selection top-ups", "delta": 0.11},
                {"code": "SE3.1/SE4", "label": "SE3.1/SE4 — selection top-ups", "delta": 0.34},
            ],
        },
        {
            "id": "ivg-confirmations",
            "label": "Confirmation-dependent (AMBER — pending IVG)",
            "value": 8.6,
            "type": "positive",
            "items": [
                {"code": "PO2", "label": "PO2 — Anna sends formal social/HR policies (~11 PDFs)", "delta": 1.3},
                {"code": "PO3", "label": "PO3 — Anna sends formal governance policies (~7 PDFs)", "delta": 1.3},
                {"code": "RP1", "label": "RP1 — CY2025 sustainability report (board sign-off pending)", "delta": 2.0},
                {"code": "BC2", "label": "BC2 — Luke/Rob collate residential + communal EPCs", "delta": 1.5},
                {"code": "SE5", "label": "SE5 — Stephane provides CY2025 EDI dataset (employees + gov bodies)", "delta": 0.55},
                {"code": "SE7.1", "label": "SE7.1 — Jez confirms IVG monitoring of Inspired Villages Operations", "delta": 1.0},
                {"code": "LE6", "label": "LE6 — HR confirms ESG-linked bonus criteria existed in CY2025", "delta": 0.7},
                {"code": "PO1", "label": "PO1 — Anna sends env-relevant policies (Procurement, Mould&Damp, BCM)", "delta": 0.23},
            ],
        },
        {
            "id": "vintage-risks",
            "label": "Vintage-critical AMBER (could collapse to 0)",
            "value": 1.95,
            "type": "warning",
            "items": [
                {"code": "SE2.1", "label": "SE2.1 — employee survey only counts if distributed in CY2025 before 31-Dec", "delta": 0.5},
                {"code": "TC2.1", "label": "TC2.1 — Fuze only counts if distributed in CY2025 before 31-Dec (+TC2.2 gated)", "delta": 1.4},
                {"code": "SE1", "label": "SE1 — ESG training only counts if delivered in CY2025", "delta": 0.2},
                {"code": "TC5.2", "label": "TC5.2 — needs CY2025 Inspired Friendships monitoring data", "delta": -0.15},
            ],
        },
        {
            "id": "tc6-defending",
            "label": "Defending positions",
            "value": 0,
            "type": "neutral",
            "items": [
                {"code": "TC6.1", "label": "TC6.1 — defending 2/2 (own narrative weak; protect via NZA formalisation)", "delta": 0},
                {"code": "LE2/LE4/LE5", "label": "LE2/LE4/LE5 maxed — defending", "delta": 0},
                {"code": "RM3.1/RM4.1/RA5/SE3.2/SE8", "label": "Various maxed indicators defending", "delta": 0},
            ],
        },
    ],
}


# ===========================================================
#  Section 4 - cycle2027 + cycle2028 panels (markdown §4)
# ===========================================================
CYCLE_2027 = {
    "score": 72,
    "starBand": "3-star confident",
    "deltaFromPriorCycle": 7,
    "narrative": (
        "Building on a 65-point 2026 base. The 2027 cycle adds limited "
        "assurance (paid annually, 5-6 month lead), the formal NZA-drafted "
        "policies that score in 2027 not 2026 (vintage rule), broader ESG "
        "training in force across CY2026, and the first BREEAM In-Use "
        "pilot. The 3-star floor at 67 is comfortably cleared."
    ),
    "items": [
        {"code": "MR1-4", "label": "Limited assurance pathway (ISAE 3000) on E/GHG/W/Waste data", "delta": 5.5, "owner": "NZA + assurance provider", "type": "positive"},
        {"code": "PO1", "label": "NZA-drafted formal Environmental Policy (board-adopted in 2026, in force CY2026)", "delta": 1.1, "owner": "NZA + Anna", "type": "positive"},
        {"code": "SE1", "label": "Full year of ESG-specific training rolled out across all employees in CY2026", "delta": 0.4, "owner": "HR", "type": "positive"},
        {"code": "TC1", "label": "Expanded tenant engagement methods rolled out in CY2026", "delta": 0.3, "owner": "Rob/Operations", "type": "positive"},
        {"code": "BC1.2", "label": "BREEAM In-Use pilot at flagship site (Millfield Green)", "delta": 1.0, "owner": "Operations + NZA", "type": "positive"},
        {"code": "EN1-WS1", "label": "Asset-level performance — LFL improvements + renewable procurement deepening", "delta": 0.8, "owner": "NZA + Laura", "type": "positive"},
        {"code": "PO2-PO3", "label": "Consolidated NZA-drafted Social + Governance policies (further uplift)", "delta": 0.5, "owner": "NZA + Anna", "type": "positive"},
    ],
}

CYCLE_2028 = {
    "score": 80,
    "starBand": "4-star floor",
    "deltaFromPriorCycle": 8,
    "narrative": (
        "Aspirational territory. Requires BREEAM In-Use expansion to "
        "4-5 sites, broader assurance scope, full data assurance "
        "baseline, and material asset-level performance improvements "
        "from CY2027 operational data. The 4-star threshold (80) is "
        "the realistic ceiling without major portfolio capex or "
        "restructure."
    ),
    "items": [
        {"code": "BC1.2", "label": "BREEAM In-Use expanded to 4-5 sites (~50% GFA coverage)", "delta": 3.0, "owner": "Operations + NZA", "type": "positive"},
        {"code": "MR1-4", "label": "Full assurance scope deepening + reasonable assurance pathway opens", "delta": 1.5, "owner": "NZA + assurance provider", "type": "positive"},
        {"code": "EN1-WS1", "label": "Asset-level LFL improvements crystallise from CY2026 → CY2027 data", "delta": 2.5, "owner": "NZA + Laura + Operations", "type": "positive"},
        {"code": "RES6", "label": "Sustainability clauses added to tenancy templates (Louise/Legal) — IF residential standalone opted into", "delta": 0, "owner": "Louise (Legal)", "type": "conditional"},
        {"code": "TC6.2", "label": "Mature community impact monitoring with quantified metrics", "delta": 0.5, "owner": "NZA + Rob", "type": "positive"},
        {"code": "SE2.1/TC2.1", "label": "Annual survey rhythm fully established (CY2027 + CY2028 surveys both in cycle)", "delta": 0.5, "owner": "HR + Rob", "type": "positive"},
    ],
}


INDICATOR_CODE_RENAMES = {
    # GRESB 2026 Standard Updates split SE2 into SE2.1 (employee survey
    # vintage) + SE2.2 (retired). Legacy JSON carries the monolithic
    # 'SE2'; rename to 'SE2.1' so v1.1 corrections find it.
    "SE2": "SE2.1",
}


def main() -> int:
    g = json.loads(GRESB_PATH.read_text(encoding="utf-8"))
    corrections = json.loads(CORRECTIONS_PATH.read_text(encoding="utf-8"))
    log: list[str] = []

    # -------- Indicator code renames (pre-corrections) --------
    for aspect in g.get("aspects", []):
        for ind in aspect.get("indicators", []):
            old_code = ind.get("code")
            if old_code in INDICATOR_CODE_RENAMES:
                new_code = INDICATOR_CODE_RENAMES[old_code]
                ind["code"] = new_code
                log.append(f"  rename indicator code: {old_code} -> {new_code}")

    # -------- Section 1 - meta / headline --------
    headline = g.setdefault("headline", {})
    cm = corrections["meta"]
    for key, val in [
        ("score2025", cm["score2025"]),
        ("defendable2026", cm["defendable2026"]),
        ("target2026", cm["target2026"]),
        ("achievable2026", cm["target2026"]),      # back-compat alias = target
        ("floor2026", cm["defendable2026"]),       # back-compat alias = defendable
        ("ceiling2026", cm["target2026"]),         # back-compat alias = target
        ("stretch2026", cm["stretch2026"]),
        ("starBand2026", cm["starBand2026"]),
        ("targetStarBand2026", cm["targetStarBand2026"]),
        ("targetStar", 2),                          # back-compat (was on v1.0)
        ("star2025", 1),                            # back-compat (was on v1.0)
    ]:
        old = headline.get(key)
        headline[key] = val
        if old != val:
            log.append(f"  headline.{key}: {old!r} -> {val!r}")

    meta = g.setdefault("meta", {})
    meta["version"] = "P12 / v1.5.0 (Master Matrix patch - BR-16 v1.1)"
    meta["lastUpdated"] = cm["lastUpdated"]
    meta["trackerSource"] = "26003-NZA-IVG-XX-SH-2000_P12_-_GRESB_2026_Master_Matrix.xlsx"
    meta["criticalRisks"] = cm["criticalRisks"]
    log.append(f"  meta.version + lastUpdated + trackerSource + criticalRisks updated")

    forecast_card = g.setdefault("forecast2026Card", {})
    forecast_card["headlineNumber"] = cm["target2026"]
    forecast_card["caption"] = (
        f"from {cm['defendable2026']} defendable - the "
        f"{round(cm['target2026'] - cm['defendable2026'], 1)}-point "
        f"climb is mapped on the Aspects page."
    )
    log.append(f"  forecast2026Card.headlineNumber + caption updated")

    # -------- Section 2 - per-indicator updates --------
    indicator_corrections = corrections["indicators"]
    indicators_updated = 0
    indicators_missing = []
    for code, spec in indicator_corrections.items():
        ind = _find_indicator(g, code)
        if ind is None:
            indicators_missing.append(code)
            continue

        # v1.1 native fields
        ind["defendable"] = spec["defendable"]
        ind["target"] = spec["target"]
        ind["stretch"] = spec["stretch"]
        ind["max2026"] = spec["max2026"]
        ind["status"] = spec["status"]

        # v1.0 back-compat aliases so the existing Overview / Aspects
        # components don't need to change immediately
        ind["defendable2026"] = spec["defendable"]
        ind["achievable2026"] = spec["stretch"]
        ind["floor2026"] = spec["defendable"]
        ind["ceiling2026"] = spec["stretch"]
        ind["pointContribution2026"] = round(spec["stretch"] - spec["defendable"], 2)

        # Out-of-scope status field (v1.0 used 'scoring' enum)
        if spec["status"] == "RETIRED":
            ind["scoring"] = "retired"
        elif spec["status"] == "PARKED":
            # 'parked' was already used in v1.0 schema
            ind["scoring"] = "parked"
        # other statuses leave 'scoring' alone (v1.0 had 'scored' for most)

        indicators_updated += 1

    log.append(f"  indicators: {indicators_updated} updated; {len(indicators_missing)} missing: {indicators_missing or 'none'}")

    # -------- RES6 housekeeping (not in v1.1 corrections, retained at 0
    #         from Brief 26 / v1.0). Make sure it stays not-applicable.
    res6 = _find_indicator(g, "RES6")
    if res6 is not None:
        res6["max2026"] = 0
        res6["defendable"] = 0
        res6["target"] = 0
        res6["stretch"] = 0
        res6["status"] = "RETIRED"
        res6["scoring"] = "not-applicable"
        res6["defendable2026"] = 0
        res6["achievable2026"] = 0
        res6["floor2026"] = 0
        res6["ceiling2026"] = 0
        res6["pointContribution2026"] = 0
        log.append(f"  RES6 preserved at not-applicable (max=0)")

    # -------- Section 5 - aspect-level updates --------
    aspect_corrections = corrections["aspects"]
    # Brief 28 uses 'GHG' aspect name; project's gresb.json has it as
    # 'GHG Emissions'. Map the brief's name to the canonical one.
    ASPECT_NAME_ALIASES = {"GHG": "GHG Emissions"}
    for brief_name, spec in aspect_corrections.items():
        canonical = ASPECT_NAME_ALIASES.get(brief_name, brief_name)
        aspect = next((a for a in g.get("aspects", []) if a.get("name") == canonical), None)
        if aspect is None:
            log.append(f"  WARN: aspect {brief_name!r} / {canonical!r} not found")
            continue
        for field in ("defendable", "target", "stretch", "max2026"):
            aspect[field] = spec[field]
    log.append(f"  aspects: {len(aspect_corrections)} aspect-level totals updated")

    # Residential Component aspect: stays at 0 across all fields (RES6 N/A)
    res_aspect = next((a for a in g.get("aspects", []) if a.get("name") == "Residential Component"), None)
    if res_aspect is not None:
        res_aspect["defendable"] = 0
        res_aspect["target"] = 0
        res_aspect["stretch"] = 0
        res_aspect["max2026"] = 0
        log.append(f"  aspect 'Residential Component' preserved at 0 (RES6 not-applicable)")

    # -------- Section 3 + 4 - forwardPlanning rebuild --------
    fp = g.setdefault("forwardPlanning", {})

    # New v1.1 native structure
    fp["waterfall2026"] = WATERFALL_2026
    fp["cycle2027"] = CYCLE_2027
    fp["cycle2028"] = CYCLE_2028
    log.append(f"  forwardPlanning.waterfall2026 written (8 blocks, items[] per block)")
    log.append(f"  forwardPlanning.cycle2027 written ({len(CYCLE_2027['items'])} items, score {CYCLE_2027['score']})")
    log.append(f"  forwardPlanning.cycle2028 written ({len(CYCLE_2028['items'])} items, score {CYCLE_2028['score']})")

    # Back-compat: repave forwardPlanning.waterfall.blocks with a
    # flattened v1.0-shaped array so the existing Forward.jsx component
    # continues to render until it's refactored to read waterfall2026.
    legacy_blocks = _build_legacy_waterfall_blocks(
        defendable=cm["defendable2026"],
        target=cm["target2026"],
        waterfall_blocks=WATERFALL_2026["blocks"],
        cycle2027_score=CYCLE_2027["score"],
        cycle2028_score=CYCLE_2028["score"],
        cycle2027_items=CYCLE_2027["items"],
        cycle2028_items=CYCLE_2028["items"],
    )
    fp_waterfall = fp.setdefault("waterfall", {})
    fp_waterfall["blocks"] = legacy_blocks
    log.append(f"  forwardPlanning.waterfall.blocks (back-compat): {len(legacy_blocks)} flat entries")

    # -------- Write back --------
    GRESB_PATH.write_text(
        json.dumps(g, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("Brief 28 (BR-16 v1.1) patch applied:")
    print()
    for line in log:
        print(line)
    print()
    print(f"Wrote {GRESB_PATH}")

    # Quick portfolio sanity sums against brief Section 2 totals
    totals_def = sum(s["defendable"] for s in indicator_corrections.values())
    totals_tgt = sum(s["target"] for s in indicator_corrections.values())
    totals_str = sum(s["stretch"] for s in indicator_corrections.values())
    print()
    print(f"  Portfolio sums (per-indicator):")
    print(f"    Defendable: {totals_def:.2f}  (brief target 45.67)")
    print(f"    Target:     {totals_tgt:.2f}  (brief target 65.87)")
    print(f"    Stretch:    {totals_str:.2f}  (brief target 74.60)")
    return 0


def _find_indicator(g: dict, code: str) -> dict | None:
    for aspect in g.get("aspects", []):
        for ind in aspect.get("indicators", []):
            if ind.get("code") == code:
                return ind
    return None


def _build_legacy_waterfall_blocks(
    *,
    defendable: float,
    target: float,
    waterfall_blocks: list[dict],
    cycle2027_score: int,
    cycle2028_score: int,
    cycle2027_items: list[dict],
    cycle2028_items: list[dict],
) -> list[dict]:
    """Flatten v1.1 waterfall + cycle panels into the v1.0 schema so the
    existing Forward.jsx renders during the transition.

    v1.0 schema = a flat array of:
      - baseline blocks ({label, baseline, category, note})
      - delta blocks   ({label, delta, category, indicator?, note?})
      - target-NNNN markers ({label, baseline, category: 'target-NNNN'})
    """
    out: list[dict] = []
    out.append({
        "label": "2025 starting position",
        "baseline": 52,
        "category": "baseline",
        "note": "where we landed last year (1-star)",
    })
    # Collapse "structural-losses" + "data-pipeline-gains" into two
    # baseline-adjustment rows for v1.0 readers
    structural_losses = next((b for b in waterfall_blocks if b["id"] == "structural-losses"), None)
    if structural_losses:
        out.append({
            "label": "Structural losses (retirements + weight cuts)",
            "delta": -3,
            "category": "baseline-adjustment",
            "indicator": "LE3+SE2.2",
            "note": "LE3 retired -2 + SE2.2 retired -1; RA3/RA4/RA5 weight cuts roughly offset by RM6.x + T1.2 + SE5 doublings/triplings",
        })
        out.append({
            "label": "Auto-banked weight increases",
            "delta": 2.6,
            "category": "baseline-adjustment",
            "indicator": "RM6.x+T1.2+SE5",
            "note": "RM6.1/2/3/4 doublings + T1.2 doubling + SE5 tripling at evidence already accepted",
        })
    out.append({
        "label": "Defendable position (verified)",
        "baseline": defendable,
        "category": "defendable",
        "note": "do-nothing floor for 2026 - assumes evidence carries through validation",
    })

    # All non-structural 2026 blocks flatten into category '2026' rows.
    # Each item inside becomes its own delta row.
    for block in waterfall_blocks:
        if block["id"] in ("structural-losses", "tc6-defending"):
            continue
        for item in block["items"]:
            if item.get("delta", 0) == 0:
                continue
            out.append({
                "label": item["label"],
                "delta": item["delta"],
                "category": "2026",
                "indicator": item.get("code"),
                "note": block["label"],
            })

    out.append({
        "label": "★★ 2-star target (verified)",
        "baseline": target,
        "category": "target-2026",
        "starThreshold": 2,
        "note": "Verified 2-star landing (range 60-65 with stretch to 75 / 3-star territory)",
    })

    # cycle 2027 deltas
    for item in cycle2027_items:
        out.append({
            "label": item["label"],
            "delta": item["delta"],
            "category": "2027",
            "indicator": item.get("code"),
            "note": item.get("owner"),
        })
    out.append({
        "label": "★★★ 3-star confident",
        "baseline": cycle2027_score,
        "category": "target-2027",
        "starThreshold": 3,
        "note": "Limited assurance + NZA-drafted policies + BREEAM In-Use pilot",
    })

    # cycle 2028 deltas
    for item in cycle2028_items:
        if item.get("delta", 0) == 0 and item.get("type") != "conditional":
            continue
        out.append({
            "label": item["label"],
            "delta": item.get("delta", 0),
            "category": "2028",
            "indicator": item.get("code"),
            "note": item.get("owner"),
        })
    out.append({
        "label": "★★★★ 4-star floor",
        "baseline": cycle2028_score,
        "category": "target-2028",
        "starThreshold": 4,
        "note": "BREEAM In-Use expanded to 4-5 sites + full assurance scope + asset-level LFL improvements",
    })

    return out


if __name__ == "__main__":
    sys.exit(main())
