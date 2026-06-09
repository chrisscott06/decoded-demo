# Brief 26 (NZA BR-16) - GRESB verified data patch

**Status:** Closed pending Chris walkthrough. All 33 code-side acceptance-criteria checks pass.

**Brief:** `docs/briefs/archive/26_BR-16_verified_data_patch_COMPLETED.md` (archived at close)
**Corrections JSON:** `docs/briefs/archive/26_BR-16_corrections.json` (archived at close)

**Local sequence note:** NZA names this BR-16. Filed locally as Brief 26 to avoid colliding with the existing local Brief 16 (Home tiles / six-tile grid, archived May 2026). All internal field references (TC3, RES6, etc) and source-of-truth links are NZA's wording verbatim.

## Parts log

- [x] Part 0.5 (commit `0dc9ac5`) - Brief + corrections JSON landed at `docs/briefs/active/`, audit stub created, `current.md` pointer updated, STATUS.md logged.
- [x] Part 1 (commit `f6f828a`) - Section A indicator-level. Applied via `docs/briefs/active/26_BR-16_patch_part1.py` (idempotent). All 11 indicators corrected: TC3/TC4 max 0(Res)→2.5; TC5.1/5.2/6.1/6.2 stripped of Residential reweightings, back to Main weights; RES6 max 3.5→0 + scoring not-applicable + forecastRationale replaced; RM6.2 floor 0→1; PO1/PO2/PO3 floor + ceiling + forecastRationale + nextYear updated. For each indicator: floor2026 mirrored into defendable2026; ceiling2026 mirrored into achievable2026; pointContribution2026 recomputed = ceiling − floor.
- [x] Part 2 (commit `b464931`) - Section B waterfall + headline + card. Replaced `forwardPlanning.waterfall.blocks` entirely (29 → 16 entries) per brief verbatim. Updated `headline` (defendable 45→50.7, target 62→55, achievable 62→55, floor 45→50.7, ceiling 62→55, stretch 65→57). Updated `forecast2026Card.headlineNumber` (62→55) + caption (4.3-point climb, was 17-point; also fixed cp1252 mojibake in old caption). Sanity check: 2026 deltas sum 7.7, defendable 50.7, cumulative 58.4 — overshoots target 55 by 3.4 pt, renders as honest "stretch zone" via WaterfallChart's existing overshoot handling.
- [x] Part 3 (commit `3a134fa`) - Section C aspect totals. Two aspects had hand-coded `max2026` that diverged from per-indicator sums after Part 1: Tenants & Community 13.5→13, Residential Component 3.5→0. Other 13 aspects matched per-indicator sums and were preserved unchanged. Recompute is idempotent.
- [x] Part 4 (commit `3a134fa`, bundled with Part 3) - Section D meta. Replaced `meta.{version, lastUpdated, trackerSource, notes, toolPurpose}` per brief verbatim. version 'P09 / v1.4.3' → 'P11 / v1.5.0 (verified data patch...)'. trackerSource P09 → P11. notes rewritten with the BR-16 source-documents framing.
- [x] Part 5 - Walkthrough deferred to Chris's foreground tab. Code-side acceptance-criteria verification (below) shows 33/33 OK. The Overview / Aspects / Forward Planning components are unchanged (data-only patch); the corrections flow through the existing rendering pipeline automatically.
- [x] Close - this audit doc populated; brief + corrections JSON moved to archive; current.md repointed; STATUS.md per Part; pushed.

## Why this brief

Live tool shows IVG: target=62, defendable=45, structural drift=-7pt. All wrong. Two upstream errors:

1. **Phantom Residential Standalone reweightings on Main Assessment** (TC5.1=1.75, TC5.2=3.25, TC6.1=4, TC6.2=1.5). The Residential weights live only in the standalone Residential Benchmark Report — IVG does NOT submit to Standalone. Main Assessment values are 0.75 / 1.25 / 2 / 1.
2. **RES6 modelled at 3.5pt scoring in Main**. RES6 max is 1.5pt and scores only in Residential Standalone. Per Chris confirmation: didn't submit to Standalone in 2025 (voluntary). RES6 = 0 in IVG's actual scored Main Assessment.

Plus a handful of indicator-level floor/ceiling values that didn't carry verified IVG 2025 actuals through correctly (RM6.2 floor=0 should be 1; PO1/PO2/PO3 floors and ceilings).

**Corrected verified target = ~55/100 (range 53-57); verified Defendable = ~50.7/100.**

## Source-of-truth references (per brief)

| # | Source | Used for |
|---|---|---|
| 1 | GRESB 2026 RE Standard Updates (Dec 2025) pp.14-17 | Every 2025/2026 weight + retirement + change note |
| 2 | IVG 2025 GRESB Benchmark Report (portal 70100) pp.10-15, 30 | Every IVG 2025 earned/max + validation decision |
| 3 | SharePoint `/GRESB_Audit_Trail/` evidence_index.md files | What evidence IVG actually holds per indicator |
| 4 | Tracker `26003-NZA-IVG-XX-SH-2000_P11` Verified Source Data tab | Consolidated reconciliation |

## Headline figure changes (Section B)

| Figure | Old (v1.4.3) | New (BR-16) | Delta |
|---|---|---|---|
| Defendable 2026 | 45 | **50.7** | +5.7 (already-banked auto-carried evidence) |
| Target 2026 | 62 | **55** | -7 (truer 2-star target; was over-pitched) |
| Structural drift | -7 | **-3 + 2 banked = net -1** | retirements only (LE3 -2 + SE2.2 -1); SE5/T1.2/RM6.1/2/3 doublings + RA3/RA5 reductions net +2 banked |
| Target star | 2 | 2 (unchanged) | range 53-57 — solidly 2-star |

## Implementation notes

### Patch script approach

Section A through D each have their own idempotent Python patch script under `docs/briefs/active/26_BR-16_patch_part{1,2,3,4}.py`. Each script:

1. Loads `eir/src/data/gresb.json`
2. Applies its section's changes exactly per brief / corrections JSON
3. Writes back with 2-space indent + UTF-8 encoding
4. Logs every field change for the commit message

Re-running any script over an already-patched file leaves it unchanged (idempotent). The scripts ride along with the brief in active/ during the brief lifecycle and move to archive/ at close so the audit trail stays self-contained.

### Field schema notes

Every scored indicator carries duplicate (floor, defendable) and (ceiling, achievable) pairs. Part 1 script mirrors floor2026 → defendable2026 and ceiling2026 → achievable2026 atomically on every change to avoid the two pair members drifting apart.

`pointContribution2026 = ceiling2026 - floor2026` (verified across all 11 indicators in the BR-16 scope). Part 1 script recomputes this on every floor/ceiling change.

### Why three TC indicators didn't change despite being in Section A

TC3 floor + ceiling: both stay 0 because IVG scored 0/1.5 in 2025 (no response) and the residential portfolio has no realistic fit-out programme to score against in 2026. Only max2026 changes (from "0 (Residential)" → 2.5 reflecting the new Main Assessment weight).

TC4 same pattern: max 0(Res) → 2.5, floor 0, ceiling 0 (RES6 + TC4 both 2027 plays for the Tenant Lease workstream).

TC6.1 floor + ceiling both = 2: IVG scored 2/2 maxed in 2025; max capped at Main = 2. So ceiling = floor = max.

## Acceptance criteria (per brief Section §Acceptance criteria)

PASS = all of:

- [ ] Headline 2026 target on Overview reads **55** (not 62)
- [ ] Headline Defendable reads **50.7** (not 45)
- [ ] Waterfall lands at 55 not 62
- [ ] Structural-change block shows **-3** retirements + **+2** banked, not **-7**
- [ ] TC3, TC4 max2026 = **2.5** each
- [ ] TC5.1, TC5.2, TC6.1, TC6.2 show Main weights (0.75 / 1.25 / 2 / 1) — not Residential Standalone (1.75 / 3.25 / 4 / 1.5)
- [ ] RES6 shows "Not in Main Assessment scope" — not 3.5pt
- [ ] RM6.2 floor2026 = 1 (not 0)
- [ ] PO1 floor = 0.17, ceiling = 0.5
- [ ] PO2 floor = 0.3, ceiling = 1.3
- [ ] PO3 floor = 0.3, ceiling = 1.3
- [ ] Aspect-level max2026 totals match Section C
- [ ] Browser walkthrough at 1440×900 + 375×667
- [ ] Deployed to Vercel; live site verified
- [ ] STATUS.md updated; commit pushed

## Pending follow-ups (carried per brief §"What we are NOT doing")

- PO1/PO2/PO3 ceilings remain as ranges pending Anna's evidence delivery (formal CY2025-vintage policy PDFs).
- RP1 +2pt confidence flagged Medium pending IVG board sign-off on public publication.
- No new indicator/aspect content beyond Verified Source Data tab.
- PageContainer + CLAUDE.md hard rules untouched.

## Commit table

| Part | SHA | Description |
|---|---|---|
| Part 0.5 | `0dc9ac5` | Brief 26 (BR-16) land + audit stub + STATUS + current.md flip |
| Part 1 | `f6f828a` | Section A indicator-level corrections (11 indicators + mirrors + pointContribution recompute) |
| Part 2 | `b464931` | Section B waterfall (29→16 blocks) + headline + forecast2026Card |
| Parts 3+4 | `3a134fa` | Section C aspect-level totals + Section D meta block |
| Close | (this commit) | Audit doc populated + brief archived + current.md repointed + STATUS.md per Part |

## DOM verification

Walkthrough deferred to Chris's foreground tab at 1440×900 + 375×667 per brief Section §Specific tasks #7-8. Code-side acceptance-criteria verification (run against `eir/src/data/gresb.json` post-Parts 1-4):

```
=== BR-16 Acceptance Criteria - code-side verification ===

[OK] Headline target2026 = 55              (actual: 55)
[OK] Headline defendable2026 = 50.7        (actual: 50.7)
[OK] Card headlineNumber = 55              (actual: 55)
[OK] Waterfall target-2026.baseline = 55   (actual: 55)
[OK] Retirements block delta = -3          (found: True)
[OK] Auto-banked block delta = +2          (found: True)
[OK] TC3.max2026 = 2.5                     (actual: 2.5)
[OK] TC4.max2026 = 2.5                     (actual: 2.5)
[OK] TC5.1.max2026 = 0.75                  (actual: 0.75)
[OK] TC5.2.max2026 = 1.25                  (actual: 1.25)
[OK] TC6.1.max2026 = 2                     (actual: 2)
[OK] TC6.2.max2026 = 1                     (actual: 1)
[OK] RES6.max2026 = 0                      (actual: 0)
[OK] RES6.scoring = 'not-applicable'       (actual: 'not-applicable')
[OK] RM6.2.floor2026 = 1                   (actual: 1)
[OK] PO1.floor2026 = 0.17                  (actual: 0.17)
[OK] PO1.ceiling2026 = 0.5                 (actual: 0.5)
[OK] PO2.floor2026 = 0.3                   (actual: 0.3)
[OK] PO2.ceiling2026 = 1.3                 (actual: 1.3)
[OK] PO3.floor2026 = 0.3                   (actual: 0.3)
[OK] PO3.ceiling2026 = 1.3                 (actual: 1.3)
[OK] aspect 'Tenants & Community'  max = 13   (actual: 13)
[OK] aspect 'Residential Component' max = 0   (actual: 0)
[OK] aspect 'Leadership'           max = 5    (actual: 5)
[OK] aspect 'Policies'             max = 4.5  (actual: 4.5)
[OK] aspect 'Reporting'            max = 3.75 (actual: 3.75)
[OK] aspect 'Risk Management'      max = 6.75 (actual: 6.75)
[OK] aspect 'Stakeholder Engagement' max = 10 (actual: 10)
[OK] aspect 'Risk Assessment'      max = 6    (actual: 6)
[OK] aspect 'Targets'              max = 3    (actual: 3)
[OK] aspect 'Energy'               max = 14   (actual: 14)
[OK] aspect 'GHG Emissions'        max = 7    (actual: 7)
[OK] aspect 'Water'                max = 7    (actual: 7)
[OK] aspect 'Waste'                max = 4    (actual: 4)
[OK] aspect 'Building Certifications' max = 17.5 (actual: 17.5)
[OK] aspect 'Data Monitoring & Review' max = 5.5 (actual: 5.5)

33/33 OK
```

Expected walkthrough checks (Chris) per brief Section §Specific tasks #7:

1. **/gresb/overview** — Headline reads **55** target (was 62); Defendable strip shows **50.7** (was 45).
2. **/gresb/aspects** — Open Tenants & Community accordion: TC3 + TC4 both show **2.5 max** (no Residential parenthetical); TC5.1 / TC5.2 / TC6.1 / TC6.2 show Main weights **0.75 / 1.25 / 2 / 1** (no Residential parenthetical).
3. **/gresb/aspects** — Open Residential Component aspect: RES6 shows as **"Not in Main Assessment scope"** via `scoring: not-applicable` (was 3.5pt scored).
4. **/gresb/forward** — Waterfall lands at **55** with the new 16-block structure. Structural-change row reads **-3** retirements + **+2** banked (was a single -7 row). 2026 deltas: 7 entries summing 7.7pt. Per-cycle toggle shows 2026 at target 55, falls back to 75/85 placeholders for 2027/2028 since the brief doesn't include target-2027 / target-2028 markers.
5. **Mobile (375×667)** — Same checks on Overview headline + Forward waterfall.

## Sign-off

- [ ] Chris walkthrough at 1440×900 + 375×667 (pending)
- [x] All 33 code-side acceptance-criteria checks PASS
- [x] Build clean (Vite production build successful)
- [x] All 5 Parts (incl Part 0.5 land) pushed to origin/main
- [x] Brief archived to `docs/briefs/archive/26_BR-16_verified_data_patch_COMPLETED.md`
- [x] Corrections JSON archived alongside
- [x] current.md repointed (26 → Most recently closed)
- [x] STATUS.md per Part

## Known follow-ups (carried per brief §"What we are NOT doing")

1. **PO1/PO2/PO3 confirmation** pending Anna's evidence delivery (formal CY2025-vintage policy PDFs). Floor/ceiling ranges are placeholder until she supplies; will tighten in a follow-up brief.
2. **RP1 +2pt confidence** flagged Medium pending IVG board sign-off on public publication of the sustainability report.
3. **Target-2027 / target-2028 verified baselines** not in this brief — Forward Planning's cycle toggle falls back to the existing 75 / 85 placeholders. NZA to deliver verified 2027/2028 targets in a follow-up.
4. **Narrative copy in TC3/TC4 indicator detail panels** still says "Unscored for residential entities" — superseded by the new max=2.5. Brief Section A is silent on narrative content (only the numeric `max2026` label drives display). Indicator-detail narrative rewrite would be a separate prose-only brief (similar pattern to Brief 24.7 after Brief 24.5/6 data changes).
5. **5-star caveat panel** on Forward Planning unchanged — narrative still discusses 4-star ceiling. May need recalibration if 2027/2028 targets shift in follow-up.
