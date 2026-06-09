"""Brief 26 (BR-16) Part 2 patch script - Section B forecast / waterfall / headline.

Replaces gresb.json forwardPlanning.waterfall.blocks entirely with the
verified array from brief Section B, and updates:
- headline.{defendable2026, target2026, achievable2026, floor2026, ceiling2026, stretch2026}
- forecast2026Card.{headlineNumber, caption} to match the new target / climb

The brief says "Do not retain old blocks" - this is a strict replacement.

Idempotent: re-running over an already-patched file leaves it unchanged.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
GRESB_PATH = REPO / "eir" / "src" / "data" / "gresb.json"

# Brief Section B - verified waterfall blocks, copied verbatim from
# the brief markdown (preserving labels + notes + confidence + indicators).
NEW_BLOCKS = [
    {
        "label": "2025 starting position",
        "baseline": 52,
        "category": "baseline",
        "note": "where we landed last year (1-star, 22nd/22 in peer group)",
    },
    {
        "label": "Indicator retirements",
        "delta": -3,
        "category": "baseline-adjustment",
        "indicator": "LE3+SE2.2",
        "note": "LE3 retired (-2pt; we had it maxed) + SE2.2 retired (-1pt; we had it maxed)",
    },
    {
        "label": "Already-banked weight increases (auto-carried evidence)",
        "delta": 2,
        "category": "baseline-adjustment",
        "indicator": "RM6.1/2/3 + T1.2 + SE5",
        "note": "RM6.1/2/3 doublings (Hydrock evidence accepted) +1.5pt; T1.2 doubling (L&G/SBTi carried) +1.0pt; partly offset by RA3/RA5 weight decreases -0.92pt",
    },
    {
        "label": "Defendable position (verified)",
        "baseline": 50.7,
        "category": "defendable",
        "note": "do-nothing floor for 2026 - assumes evidence carries through validation",
    },
    # 2026 plays - only items where evidence is real/in-flight and CY2025 vintage holds
    {
        "label": "Submit existing policies (PO2+PO3)",
        "delta": 2,
        "category": "2026",
        "indicator": "PO2+PO3",
        "note": "Anna supplies ~13 PO3 + ~15 PO2 formal policy PDFs that existed during CY2025 but were never submitted. Range: +0.6 worst to +2.6 best. Centred +2. PENDING Anna delivery.",
        "confidence": "M",
    },
    {
        "label": "RP1 sustainability report (CY2025-covering)",
        "delta": 2,
        "category": "2026",
        "indicator": "RP1",
        "note": "NZA authors E sections; IVG team pulls together social content. Pending IVG board sign-off on public publication.",
        "confidence": "M",
    },
    {
        "label": "EPC inventory (BC2)",
        "delta": 1.2,
        "category": "2026",
        "indicator": "BC2",
        "note": "Luke + Rob collate existing residential + communal EPCs. CY2025 vintage if EPCs were valid during 2025.",
        "confidence": "M",
    },
    {
        "label": "LE6 evidence fix",
        "delta": 0.7,
        "category": "2026",
        "indicator": "LE6",
        "note": "HR provides 2025 evidence covering all named personnel groups with financial consequences - lifts from PARTIAL to FULL accept.",
        "confidence": "M",
    },
    {
        "label": "SE5 EDI metrics fix",
        "delta": 0.5,
        "category": "2026",
        "indicator": "SE5",
        "note": "Stephane provides full 2026-format EDI dataset including governance bodies metrics. Defendable already includes the pro-rated lift from weight tripling.",
        "confidence": "M",
    },
    {
        "label": "Waste data coverage (WS1)",
        "delta": 0.8,
        "category": "2026",
        "indicator": "WS1",
        "note": "Biffa data improved from 51% to ~80% coverage on existing sites where data exists for 2025.",
        "confidence": "L",
    },
    {
        "label": "Asset-level small improvements (EN1/GH1/WT1)",
        "delta": 0.5,
        "category": "2026",
        "indicator": "EN1+GH1+WT1",
        "note": "Renewable energy procurement type fixes + any LFL improvements that materialise from CY2025 data.",
        "confidence": "L",
    },
    # Target
    {
        "label": "★★ 2-star target (verified)",
        "baseline": 55,
        "category": "target-2026",
        "starThreshold": 2,
        "note": "where we aim to land this cycle (range 53-57)",
    },
    # 2027+ - no target-2027 / target-2028 markers in this brief; the
    # tool falls back to 75 / 85 placeholder targets on the cycle toggle
    # until those numbers are verified in a follow-up brief.
    {
        "label": "PO1/PO2/PO3 new formal policies",
        "delta": 2.5,
        "category": "2027",
        "indicator": "PO1+PO2+PO3",
        "note": "NZA drafts dedicated Environmental + Social + Governance policies for IVG board adoption in 2026 -> counts 2027",
    },
    {
        "label": "RM1 formal EMS",
        "delta": 1.25,
        "category": "2027",
        "indicator": "RM1",
        "note": "NZA drafts EMS framework in 2026; adopted by IVG -> counts 2027",
    },
    {
        "label": "RM6.4 + physical risk impact",
        "delta": 1,
        "category": "2027",
        "indicator": "RM6.4",
        "note": "Phase 2B site audits 2026 -> CY2026 vintage -> counts 2027",
    },
    {
        "label": "Limited assurance pathway",
        "delta": 5.5,
        "category": "2027",
        "indicator": "MR1+MR2+MR3+MR4",
        "note": "ISAE 3000 limited assurance on E/GHG/W/Waste data, established 2026 -> counts 2027",
    },
]

# Brief Section B - new headline values. The brief locks target = 55
# with a range of 53-57. Defendable = 50.7. Achievable = ceiling case
# of the realistic range (= target since brief doesn't separate them);
# stretch = top of the verified range.
NEW_HEADLINE = {
    "defendable2026": 50.7,
    "target2026": 55,
    "achievable2026": 55,
    "floor2026": 50.7,
    "ceiling2026": 55,
    "stretch2026": 57,
}

# Brief Section B - forecast2026Card surfaces the headline number on
# the Overview. Update headline + caption to match.
NEW_FORECAST_CARD = {
    "headlineNumber": 55,
    "caption": "from 50.7 carry-forward - the 4.3-point climb is mapped on the Aspects page.",
}


def main() -> int:
    g = json.loads(GRESB_PATH.read_text(encoding="utf-8"))
    log: list[str] = []

    # ---- Replace forwardPlanning.waterfall.blocks ----
    fp = g.setdefault("forwardPlanning", {})
    waterfall = fp.setdefault("waterfall", {})
    old_count = len(waterfall.get("blocks", []))
    waterfall["blocks"] = NEW_BLOCKS
    log.append(f"forwardPlanning.waterfall.blocks: {old_count} entries -> {len(NEW_BLOCKS)} entries")

    # ---- Update headline ----
    headline = g.setdefault("headline", {})
    for k, new_val in NEW_HEADLINE.items():
        old_val = headline.get(k)
        headline[k] = new_val
        log.append(f"headline.{k}: {old_val} -> {new_val}")

    # ---- Update forecast2026Card ----
    card = g.setdefault("forecast2026Card", {})
    for k, new_val in NEW_FORECAST_CARD.items():
        old_val = card.get(k)
        card[k] = new_val
        log.append(f"forecast2026Card.{k}: {fmt(old_val)} -> {fmt(new_val)}")

    GRESB_PATH.write_text(
        json.dumps(g, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("Brief 26 (BR-16) Part 2 - Section B applied:")
    print()
    for line in log:
        print("  " + line)
    print()
    # Sanity check: sum of 2026 deltas should land between defendable
    # and the top of the verified target range (50.7 + 7.7 = 58.4 vs
    # target 55 with stretch 57 - intentional overshoot per brief).
    deltas_2026 = sum(b.get("delta", 0) for b in NEW_BLOCKS if b.get("category") == "2026")
    cumulative = NEW_HEADLINE["defendable2026"] + deltas_2026
    print(f"  Sanity: defendable {NEW_HEADLINE['defendable2026']} + 2026 deltas {deltas_2026} = {cumulative} cumulative")
    print(f"          target = {NEW_HEADLINE['target2026']} (verified range 53-57)")
    print(f"          overshoot = {cumulative - NEW_HEADLINE['target2026']:.1f} pt (renders as stretch zone)")
    print()
    print(f"Wrote {GRESB_PATH}")
    return 0


def fmt(v) -> str:
    if isinstance(v, str):
        return repr(v) if len(v) < 60 else repr(v[:57] + "...")
    return repr(v)


if __name__ == "__main__":
    sys.exit(main())
