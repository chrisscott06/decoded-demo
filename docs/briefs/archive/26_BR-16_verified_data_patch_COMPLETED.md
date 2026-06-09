# BR-16 v1.0 — Verified Data Patch (URGENT)

**Status:** URGENT — IVG has access to the live Vercel deployment.  
**Project:** `ivg-esg-tool` (Vite/React; data layer = `gresb.json` or equivalent)  
**Date:** 2026-06-08  
**Author:** NZA Chat (architect role)  
**Executor:** Claude Code  
**Supersedes:** BR-13 v1.4.3 (and the gresb.json that drives the live site)

---

## Why this exists

The live tool currently shows IVG a **62/100 target**, a **45 defendable**, a **-7pt structural drift**, and several indicator-level numbers that are wrong. The errors trace back to two mis-modelled assumptions:

1. **Residential Standalone reweightings (TC5.1=1.75, TC5.2=3.25, TC6.1=4, TC6.2=1.5) applied to the Main Assessment.** They don't. Those weights live only in the standalone Residential Benchmark Report, which IVG does not submit to.
2. **RES6 modelled at 3.5pt scoring in Main.** Wrong. RES6 max is 1.5pt and scores **only** in the Residential Standalone Report.

Plus a handful of indicator-level floor/ceiling values that didn't carry the verified IVG 2025 actuals through correctly.

The corrected verified target is **~55/100** (range 53–57), and the verified Defendable is **~50.7/100**. The full source-cited reconstruction lives in the **Verified Source Data** tab of tracker `P11`.

---

## Source-of-truth references (use only these — no memory, no guess)

| # | Source | Used for |
|---|---|---|
| 1 | **GRESB 2026 Real Estate Standard Updates** (`Real_Estate_Standard_2026_Updates.pdf`, Dec 2025), Summary table pp. 14–17 | Every 2025/2026 weight, every retirement, every change note |
| 2 | **IVG 2025 GRESB Benchmark Report** (`portal_gresb_com_product_report_70100.pdf`) — Score Summary pp. 10–15; Validation Decisions p. 30 | Every IVG 2025 earned/max/benchmark-avg; every validation decision |
| 3 | **SharePoint `/GRESB_Audit_Trail/`** _evidence_index.md files | What evidence we actually hold per indicator |
| 4 | **Tracker `26003-NZA-IVG-XX-SH-2000_P11`**, **Verified Source Data** tab | Consolidated reconciliation of (1)+(2)+(3) — read this first |

---

## What changes (machine-readable: see `corrections.json`)

### Section A — Indicator-level field changes

#### A.1 — Tenants & Community: strip phantom "Residential" labels and use Main Assessment weights

| Code | Field | OLD | NEW | Why |
|---|---|---|---|---|
| **TC3** | `max2026` | `` `0 (Residential)` `` | `2.5` | Main Assessment max **increased** from 1.5 to 2.5 for 2026 per Standard Updates (+1p for sustainability topics). Was wrongly labelled 0. |
| TC3 | `floor2026` | `0` | `0` | IVG scored 0/1.5 in 2025 — no defendable contribution |
| TC3 | `ceiling2026` | `0` | `0` | Not realistically achievable in 2026 — residential portfolio has no real fit-out programme |
| **TC4** | `max2026` | `` `0 (Residential)` `` | `2.5` | Main max **increased** from 1.5 to 2.5 (+1p for data sharing & metering clause). Was wrongly labelled 0. |
| TC4 | `floor2026` | `0` | `0` | IVG scored 0/1.5 in 2025 |
| TC4 | `ceiling2026` | `0` | `0` | RES6 + TC4 both 2027 plays for the Tenant Lease workstream |
| **TC5.1** | `max2026` | `` `1.75 (Residential)` `` | `0.75` | Main max **unchanged** at 0.75. 1.75 is Residential Standalone only. |
| TC5.1 | `floor2026` | `1.31` | `0.56` | Defendable = 2025 score (0.56/0.75) |
| TC5.1 | `ceiling2026` | `1.75` | `0.75` | Capped at Main max |
| **TC5.2** | `max2026` | `` `3.25 (Residential)` `` | `1.25` | Main max **unchanged** at 1.25 |
| TC5.2 | `floor2026` | `2.99` | `1.15` | Defendable = 2025 score |
| TC5.2 | `ceiling2026` | `3.25` | `1.25` | Capped at Main max |
| **TC6.1** | `max2026` | `` `4.0 (Residential)` `` | `2` | Main max **unchanged** at 2 |
| TC6.1 | `floor2026` | `4` | `2` | IVG scored 2/2 maxed in 2025 |
| TC6.1 | `ceiling2026` | `4` | `2` | Capped at Main max |
| **TC6.2** | `max2026` | `` `1.5 (Residential)` `` | `1` | Main max **unchanged** at 1 |
| TC6.2 | `floor2026` | `0` | `0` | IVG scored 0/1 in 2025 |
| TC6.2 | `ceiling2026` | `1.5` | `1` | Capped at Main max; achievable with light community monitoring framework |

#### A.2 — RES6: not scored in Main Assessment

| Code | Field | OLD | NEW | Why |
|---|---|---|---|---|
| **RES6** | `max2026` | `3.5` | `0` | RES6 is 1.5pt and Residential Standalone only. IVG submits to Main Assessment only. Chris confirmed: didn't submit to Standalone in 2025 (it was voluntary). |
| RES6 | `floor2026` | `0` | `0` | n/a |
| RES6 | `ceiling2026` | `2.5` | `0` | n/a |
| RES6 | `scoring` | `scored` | `not-applicable` | New status — display as "Not in Main Assessment scope" |
| RES6 | `forecastRationale` | (current text) | `RES6 is Residential Standalone Assessment only — 1.5pt max. IVG does not submit to Standalone (voluntary). Adding occupancy clauses now is a 2027 play if IVG ever opts in.` | Replace |

#### A.3 — RM6.2: defendable floor was wrong

| Code | Field | OLD | NEW | Why |
|---|---|---|---|---|
| **RM6.2** | `floor2026` | `0` | `1` | IVG scored 0.5/0.5 ACCEPTED in 2025 (Hydrock). At 2026 doubled weight of 1.0, defendable = 1.0 (evidence carries vintage). The 0/0 was clearly wrong. |
| RM6.2 | `ceiling2026` | `0` | `1` | Already maxed — ceiling = max |

#### A.4 — PO1/PO2/PO3: recalibrate per evidence reality

| Code | Field | OLD | NEW | Why |
|---|---|---|---|---|
| **PO1** | `floor2026` | `0` | `0.17` | Same as 2025 — Net Zero partial credit defends |
| PO1 | `ceiling2026` | `0.5` | `0.5` | Limited 2026 ceiling — no dedicated Environmental Policy (statement ≠ policy). Small uplift only from Procurement + Mould & Damp PDFs. **Note:** Anna delivery awaited; if she sends nothing, ceiling falls back to floor (0.17). |
| **PO2** | `floor2026` | `0` | `0.3` | Worst-case if validator strict on HR-vs-ESG policy distinction |
| PO2 | `ceiling2026` | `0.5` | `1.3` | Best-case: 6+ sub-options covered by formal CY2025-vintage PDFs IVG already has (Bullying & Harassment, H&S, Modern Slavery, Equality & Diversity, Customer Conduct Risk, Sickness, Sexual Harassment, etc.). **Pending Anna's evidence delivery.** Update once she's responded. |
| **PO3** | `floor2026` | `0` | `0.3` | Worst-case validator strictness |
| PO3 | `ceiling2026` | `0.5` | `1.3` | Best-case: 6+ sub-options covered by formal CY2025-vintage PDFs (Bribery & Corruption, Conflicts of Interest, Data Protection, Cyber Security, Whistleblowing, Fraud, Internal Control). **Pending Anna's evidence delivery.** |

---

### Section B — Forecast / Waterfall / Headline target

Reconstruct the `forecast.waterfall.blocks` array entirely. The current structure has `baseline:62` for the target and `-7` structural drift — both wrong.

**Replace the entire waterfall blocks array with:**

```js
waterfall: {
  blocks: [
    { label: '2025 starting position', baseline: 52, category: 'baseline', note: 'where we landed last year (1-star, 22nd/22 in peer group)' },
    { label: 'Indicator retirements', delta: -3, category: 'baseline-adjustment', indicator: 'LE3+SE2.2', note: 'LE3 retired (-2pt; we had it maxed) + SE2.2 retired (-1pt; we had it maxed)' },
    { label: 'Already-banked weight increases (auto-carried evidence)', delta: 2, category: 'baseline-adjustment', indicator: 'RM6.1/2/3 + T1.2 + SE5', note: 'RM6.1/2/3 doublings (Hydrock evidence accepted) +1.5pt; T1.2 doubling (L&G/SBTi carried) +1.0pt; partly offset by RA3/RA5 weight decreases -0.92pt' },
    { label: 'Defendable position (verified)', baseline: 50.7, category: 'defendable', note: 'do-nothing floor for 2026 — assumes evidence carries through validation' },

    // 2026 plays — only items where evidence is real/in-flight and CY2025 vintage holds
    { label: 'Submit existing policies (PO2+PO3)', delta: 2, category: '2026', indicator: 'PO2+PO3', note: 'Anna supplies ~13 PO3 + ~15 PO2 formal policy PDFs that existed during CY2025 but were never submitted. Range: +0.6 worst → +2.6 best. Centred +2. PENDING Anna delivery.', confidence: 'M' },
    { label: 'RP1 sustainability report (CY2025-covering)', delta: 2, category: '2026', indicator: 'RP1', note: 'NZA authors E sections; IVG team pulls together social content. Pending IVG board sign-off on public publication.', confidence: 'M' },
    { label: 'EPC inventory (BC2)', delta: 1.2, category: '2026', indicator: 'BC2', note: 'Luke + Rob collate existing residential + communal EPCs. CY2025 vintage if EPCs were valid during 2025.', confidence: 'M' },
    { label: 'LE6 evidence fix', delta: 0.7, category: '2026', indicator: 'LE6', note: 'HR provides 2025 evidence covering all named personnel groups with financial consequences — lifts from PARTIAL to FULL accept.', confidence: 'M' },
    { label: 'SE5 EDI metrics fix', delta: 0.5, category: '2026', indicator: 'SE5', note: 'Stephane provides full 2026-format EDI dataset including governance bodies metrics. Defendable already includes the pro-rated lift from weight tripling.', confidence: 'M' },
    { label: 'Waste data coverage (WS1)', delta: 0.8, category: '2026', indicator: 'WS1', note: 'Biffa data improved from 51% → ~80% coverage on existing sites where data exists for 2025.', confidence: 'L' },
    { label: 'Asset-level small improvements (EN1/GH1/WT1)', delta: 0.5, category: '2026', indicator: 'EN1+GH1+WT1', note: 'Renewable energy procurement type fixes + any LFL improvements that materialise from CY2025 data.', confidence: 'L' },

    // Target
    { label: '★★ 2-star target (verified)', baseline: 55, category: 'target-2026', starThreshold: 2, note: 'where we aim to land this cycle (range 53–57)' },

    // 2027+
    { label: 'PO1/PO2/PO3 new formal policies', delta: 2.5, category: '2027', indicator: 'PO1+PO2+PO3', note: 'NZA drafts dedicated Environmental + Social + Governance policies for IVG board adoption in 2026 → counts 2027' },
    { label: 'RM1 formal EMS', delta: 1.25, category: '2027', indicator: 'RM1', note: 'NZA drafts EMS framework in 2026; adopted by IVG → counts 2027' },
    { label: 'RM6.4 + physical risk impact', delta: 1, category: '2027', indicator: 'RM6.4', note: 'Phase 2B site audits 2026 → CY2026 vintage → counts 2027' },
    { label: 'Limited assurance pathway', delta: 5.5, category: '2027', indicator: 'MR1+MR2+MR3+MR4', note: 'ISAE 3000 limited assurance on E/GHG/W/Waste data, established 2026 → counts 2027' },
  ]
}
```

**Star bands — verify these are correct (current bundle has these values, which look right):**

```js
starBands: [
  { name: '1-star', thresholdIndicative2025: 30, note: 'Bottom 20% globally' },
  { name: '2-star', thresholdIndicative2025: 55, note: 'IVG target zone' },
  { name: '3-star', thresholdIndicative2025: 67, note: 'Near global average (79)' },
  { name: '4-star', thresholdIndicative2025: 80, note: 'Strong performers' },
  { name: '5-star', thresholdIndicative2025: 90, note: 'Top 20% globally' },
]
```

These bands are indicative — GRESB recalibrates annually based on quintile distribution. Don't change them.

---

### Section C — Aspects-level `max2026` totals

The aspect-level `max2026` values are aggregates. Recompute:

| Aspect | Component | Indicators | max2026 (sum) |
|---|---|---|---|
| Leadership | Management | LE1, LE2, LE3, LE4, LE5, LE6 | 5 (was 5 — LE3 was already 0 max for 2026, retain) — actually 0+1+0+1+1+2 = **5** ✓ |
| Policies | Management | PO1, PO2, PO3 | 1.5+1.5+1.5 = **4.5** |
| Reporting | Management | RP1, RP2.1, RP2.2 | 3.5+0.25+0 = **3.75** |
| Risk Management | Management | RM1, RM2, RM3.1, RM3.2, RM4.1, RM4.2, RM5, RM6.1, RM6.2, RM6.3, RM6.4, RM7 | 1.25+0.25+0.25+0.25+0.25+0+0.5+1+1+1+1+0 = **6.75** |
| Stakeholder Engagement | Management | SE1, SE2.1, SE2.2 (retired = 0), SE3.1, SE3.2, SE4, SE5, SE6, SE7.1, SE7.2, SE8 | 1+1+0+0.75+1.25+0.5+1.5+1.5+1+1+0.5 = **10** |
| **Management total** | | | **30** ✓ |
| Risk Assessment | Performance | RA1, RA2, RA3, RA4, RA5 | 3+2+0.5+0.25+0.25 = **6** |
| Targets | Performance | T1.1, T1.2 | 1+2 = **3** |
| Tenants & Community | Performance | TC1, TC2.1, TC2.2, TC3, TC4, TC5.1, TC5.2, TC6.1, TC6.2 | 1+1+1+2.5+2.5+0.75+1.25+2+1 = **13** |
| Energy | Performance | EN1 | **14** |
| GHG | Performance | GH1 | **7** |
| Water | Performance | WT1 | **7** |
| Waste | Performance | WS1 | **4** |
| Data Monitoring & Review | Performance | MR1, MR2, MR3, MR4 | 1.75+1.25+1.25+1.25 = **5.5** |
| Building Certifications | Performance | BC1.1, BC1.2, BC2 | 7+8.5+2 = **17.5** |
| **Performance total** | | | **77** (but capped at 70 — BC1.1+BC1.2 combined cap at 8.5) → effectively **70** |
| Residential | (not in Main) | All RES* | **0** (not in scope) |

**Note on the 77 vs 70 Performance total:** GRESB scoring document says BC1.1+BC1.2 combined cap at 8.5. Display max2026 as the sum of individual maxes (=77) but note the cap in the aspect text. The headline 100-point score is preserved because the cap kicks in at the BC level.

---

### Section D — Meta / metadata updates

```js
meta: {
  version: 'P11 / v1.5.0 (verified data patch from GRESB source documents)',
  lastUpdated: '2026-06-08',
  submissionDeadline: '2026-07-01',
  entityName: 'Inspired Villages Group',
  trackerSource: '26003-NZA-IVG-XX-SH-2000_P11',
  notes: 'All weights, scores, and validation decisions sourced directly from (a) GRESB 2026 RE Standard Updates, (b) IVG 2025 GRESB Benchmark Report (portal report 70100), (c) SharePoint /GRESB_Audit_Trail/. Previous v1.4.3 contained errors from phantom residential reweightings and incorrect RES6 modelling — fully replaced in this version.',
  toolPurpose: 'This page is the central source of truth for IVG's GRESB submission. As policies are confirmed, evidence collected and data lands, this view updates dynamically.',
}
```

---

## Specific tasks for Claude Code

1. **Read these first** (read order enforced per CLAUDE.md):
   - `CLAUDE.md` and `STATUS.md` at project root
   - The Verified Source Data tab of `/02 - Shared & Published/G_GRESB/26003-NZA-IVG-XX-SH-2000_P11_-_GRESB_Submission_Tracker.xlsx` (the authoritative source)

2. **Locate the data file.** Most likely `src/data/gresb.json` or `src/data/gresb.ts`. Confirm format before editing.

3. **Apply Section A changes** indicator-by-indicator. Diff each one against the OLD value to make sure no stale data is left.

4. **Apply Section B** — replace the entire `forecast.waterfall.blocks` array. Do not retain old blocks.

5. **Apply Section C** — recompute aspect-level `max2026` values from the verified per-indicator maxes.

6. **Apply Section D** — update meta fields.

7. **Build + verify locally** (`npm run dev` or equivalent). Visit:
   - `/gresb/overview` — confirm headline target reads **55** not 62; Defendable reads **50.7** not 45
   - `/gresb/aspects` — open Tenants & Community accordion, confirm TC3/TC4 show 2.5 max, TC5.1/TC5.2/TC6.1/TC6.2 show Main weights without "Residential" labels
   - `/gresb/aspects` — open Residential aspect, confirm RES6 shows as "Not in Main Assessment scope" (not scored)
   - `/gresb/forward` — confirm waterfall renders the new blocks and lands at 55

8. **Browser walkthrough at 1440×900 + 375×667** per Process Rule 10 before any PASS claim.

9. **Deploy to Vercel** once verified locally.

10. **Update STATUS.md** with patch summary and commit reference.

---

## What stays the same

- Indicator schema (don't restructure)
- Aspects accordion + 4-panel layout (don't redesign)
- Forward Planning waterfall component (data changes, component doesn't)
- Star bands (already correct)
- All other indicators not listed in Section A — unchanged

---

## What we are NOT doing in this patch

- Not yet updating PO1/PO2/PO3 with confirmed Anna delivery (she hasn't responded yet — leave as Floor/Ceiling range; update when her PDFs arrive)
- Not yet adjusting RP1 +2pt confidence to High (depends on IVG board sign-off on publication)
- Not yet adding new indicator/aspect detail beyond what's in the Verified Source Data tab
- Not changing PageContainer / CLAUDE.md hard rules

---

## Acceptance criteria

PASS = all of:
- [ ] Headline 2026 target on Overview reads **55** (not 62)
- [ ] Headline Defendable reads **50.7** (not 45)
- [ ] Waterfall lands at 55 not 62
- [ ] Structural-change block shows **-3** (retirements only) + **+2** banked, not **-7**
- [ ] TC3, TC4 max2026 show **2.5** each on Aspects page
- [ ] TC5.1, TC5.2, TC6.1, TC6.2 max values show Main Assessment weights (0.75, 1.25, 2, 1) — not Residential Standalone (1.75, 3.25, 4, 1.5)
- [ ] RES6 shows as "Not in Main Assessment scope" — not 3.5pt
- [ ] RM6.2 floor2026 = 1 (not 0)
- [ ] PO1 floor = 0.17, ceiling = 0.5
- [ ] PO2, PO3 floor = 0.3, ceiling = 1.3 each
- [ ] Aspect-level max2026 totals match Section C
- [ ] Browser walkthrough completed at 1440×900 + 375×667
- [ ] Deployed to Vercel and live site verified
- [ ] STATUS.md updated; commit pushed

---

## End of Brief 16
