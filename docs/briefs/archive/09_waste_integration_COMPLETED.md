# Brief 9 — Waste pipeline integration (tonnage + diversion + Scope 3 Cat 5 emissions)

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Demo is behind us — this is built properly, not rushed.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no Chris checkpoints. Chris walks through on completion.

---

## Target outcome

The waste reader is rewritten to aggregate the raw contractor sheets directly from the IVG_Waste workbook (not the cached Site_Summary values), producing real per-site waste data: tonnage by stream, disposal-route split, diversion rate, and Scope 3 Category 5 emissions using the DEFRA 2025 factors already defined in the workbook. `waste.json` populates across all 13 sites (12 villages + office). The three UI surfaces that currently show "—" or empty light up: the landing waste card, the map's Waste theme, and Site Detail waste tiles.

After this brief: waste is a fully-populated metric. The portfolio shows **~244 t total, 99.9% diverted from landfill, 4.86 tCO₂e Scope 3 Cat 5** — and the smallness of that emissions figure is itself the story (near-total diversion makes waste a rounding error on the footprint).

---

## Why the reader is being rewritten (context from the data review)

Chris's 22 May review surfaced that the IVG_Waste workbook is rich and well-built — but the pipeline reader only reads the `Site_Summary` sheet's cached formula values. Those cells are live SUMPRODUCT/SUMIF formulas pulling from raw sheets; openpyxl's `data_only` mode returns `None` for any formula cell Excel hasn't cached, so the reader saw blanks and wrote `tonnage_total: null` for 12 of 13 sites. The data was never missing — the reader was reading a cached derivative instead of the source.

**The fix:** aggregate the raw sheets directly, mirroring what the workbook formulas do. This is robust to the workbook being edited/handed around without an Excel recalc — the same lesson as the Stark reader (read the source of truth, not a cached view).

---

## Reference

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **The workbook** — `pipeline/source-data/26003-NZA-XX-XX-CA-X-1003_P03_-_IVG_Waste.xlsx` (the P03 revision — Millbrook disposal row now populated; confirm P03 is the one in source-data, not P02)
3. This brief at `docs/briefs/active/09_waste_integration.md`

---

## BEFORE DOING ANYTHING

0. Reconciliation (Rule 8): `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md` (says Brief 9 next), `tail -20 STATUS.md`, `git log --oneline -8` (HEAD `e01d31c` map-noscroll or later), `git status --short` clean.

0.5 Land this brief at `docs/briefs/active/09_waste_integration.md`, update current.md, quote title + Target outcome back. Commit `Brief 9 land: waste pipeline integration at active/09_waste_integration.md`.

1. **Confirm the workbook.** `ls pipeline/source-data/*IVG_Waste*.xlsx`. If only P02 is present, Chris must drop in P03 (Millbrook disposal row populated) — log to STATUS.md and proceed with whatever's there, but note P02 will miss Millbrook's disposal-method split (stream data still works via SWP_Raw).

2. **Read the existing reader** `pipeline/readers/read_waste.py` and the current `pipeline/dist/eir/waste.json` to see the output shape the UI already expects (fields: `tonnage_total`, `tonnage_by_stream`, `diversion_rate`, `emissions_scope3_cat5_tco2e`, `contractor`, `data_status`, `data_period`, `notes`).

3. **Read the workbook structure** (use `data_only=False` to see formulas; the raw sheets hold the actual data):
   - `Site_Summary` — the site list + BIFFA account IDs (the canonical name↔account mapping is here)
   - `Convey_Raw` (2,794 rows) — BIFFA conveyance: `Account ID`, `Container Product Group Description` (stream), `Service Weight` (t), `Serviced Calendar Date - Date`. 10 BIFFA sites.
   - `SWP_Raw` (rows 7+) — Millbrook: `Month`, `Year`, `Waste Stream`, `Weight (t)`, `Classification`, `GHG Disposal Method`. 12 months 2025.
   - `Ash_Waste_Raw` — Gifford Lea (estimated weights; the Site_Summary already has the hard stream values for Gifford: General 11.869 / Recycling 5.016 / Glass 9.45 / Organic 5.64).
   - `Landfill_Raw` (42 rows) — disposal-route split per EWC code per BIFFA site: `Site ID`, `Landfill Weight`, `Incinerated Weight`, `AD Weight`, `Recycled Weight`, `Total Weight`. This is the disposal-fate basis for diversion + emissions.
   - `DEFRA_Inputs` — the emission factors (see Part 2).

4. Begin Part 1.

---

## Scope statement

In scope: rewrite `read_waste.py` to aggregate raw sheets → tonnage by stream + disposal split + diversion + Scope 3 Cat 5 emissions per site; rebuild `waste.json`; verify the landing card, map Waste theme, and Site Detail waste tiles surface real data.

Out of scope (log + continue): Stark reader / Load Inspector (separate brief); GRESB; Sites table redesign; any change to the workbook itself (the workbook is the source, read-only to the pipeline).

No emission-factor invention — use the workbook's DEFRA_Inputs values verbatim.

---

## Operational mode

Plough-through. Each Part one commit with STATUS.md + audit-doc. Escalate (log + stop) only for: workbook missing; raw-sheet structure differs from documented; a PASS spot-check off by >5% from the targets in this brief (suggests a parsing error); build fails. Otherwise keep going. Push at the end.

---

## Principles

1. **Read the source of truth, not the cached derivative.** Aggregate Convey_Raw / SWP_Raw / Landfill_Raw directly. Never depend on Site_Summary's cached formula values.
2. **Mirror the workbook's methodology exactly** — same DEFRA factors, same disposal-route mapping, same calendar-2025 date filter on Convey_Raw.
3. **Two tonnage bases, named explicitly.** Conveyance basis (Convey_Raw collection weights, ~164 t) vs disposal-fate basis (Landfill_Raw, ~244 t). Use the **disposal-fate basis as canonical** for `tonnage_total` (it's what drives emissions and diversion); record the conveyance figure in `notes` as a cross-check. This difference is expected (different measurement points), not an error.
4. **Honest gaps.** The office (Edwalton) has no waste contract — `data_status: "not_applicable"`, not "missing". Any site genuinely absent from all raw sheets → `missing`.
5. Falsifiability per Part with the numeric targets below.
6. Browser-verify the three UI surfaces at Part 4.

---

## Parts

### Part 1 — Rewrite read_waste.py: tonnage by stream + disposal split

**Goal:** Reader aggregates raw sheets into per-site tonnage (by stream) and disposal-route split (landfill/incinerated/recycled/AD).

**Files:** `pipeline/readers/read_waste.py`, `docs/audit/09_waste_integration.md` (new).

**Steps:**

1.1 **Site mapping.** Build the BIFFA-account → canonical-site-ID map from Site_Summary (column: site name + BIFFA Account ID). Hard-code the resolved map in the reader for robustness (account IDs are stable):
```
A41422→austin-heath, 34191(ASH)→gifford-lea, B55002→bramshott-place,
MVM001(SWP)→millbrook-village, D39233→durrants-village, M40157→great-alne-park,
L35571→ledian-gardens, E30544→elderswell, M49173→millfield-green,
A49475→ampfield-meadows, B54990→blendworth-hills, W36809→sonning-common
```
Edwalton office: no waste contract.

1.2 **BIFFA stream tonnage** (10 sites) — aggregate `Convey_Raw` by `Account ID` + `Container Product Group Description`, summing `Service Weight`, filtered to 2025 calendar year on `Serviced Calendar Date - Date`. Map BIFFA product groups to the stream fields (general/recycling/glass/organic/cardboard) — inspect the actual product-group values and map sensibly (e.g. "General"→general, "Glass"→glass, "Organic"→organic, "Mixed Recycling"/"Card"→recycling/cardboard).

1.3 **Millbrook stream tonnage** — aggregate `SWP_Raw` 2025 rows by `Waste Stream`: Mixed Municipal→general (residual), Glass→glass, Biodegradable Kitchen→organic, Mixed Packaging→recycling. Expected total **19.906 t**.

1.4 **Gifford Lea** — use the Site_Summary hard values (General 11.869 / Recycling 5.016 / Glass 9.45 / Organic 5.64 / Cardboard 0; total 31.975). These are static cells, not formulas, so they read fine. Mark `notes` "estimated by ASH from bin volume".

1.5 **Disposal-route split** — from `Landfill_Raw` per site (`Landfill/Incinerated/Recycled/AD Weight` columns), plus Millbrook from SWP classification (Incineration 5.313 / Recycling 9.393 / AD 5.200 / Landfill 0). This is the **canonical tonnage_total basis**.

1.6 **Per-site output:** `tonnage_total` (disposal-fate sum), `tonnage_by_stream` {general,recycling,glass,organic,cardboard}, `disposal_split` {landfill,incinerated,recycled,ad}, `contractor`, `data_status`, `data_period: "CY2025"`, `notes` (incl. the conveyance-basis cross-check figure).

**PASS (spot-checks — within 5%):**
- Millbrook total 19.9 t; Gifford Lea ~32 t; Ledian ~28.8 t (conveyance) / check disposal basis; Millfield ~18 t
- Portfolio disposal-fate total **~244 t** (Landfill 0.19 / Incin 129 / Recycled 77 / AD 38)
- Edwalton office `data_status: not_applicable`
- 12 villages with real tonnage

**Commit:** `Brief 9 Part 1: read_waste.py aggregates raw sheets — tonnage + disposal split`

---

### Part 2 — Diversion rate + Scope 3 Cat 5 emissions

**Goal:** Per-site diversion rate and Scope 3 Cat 5 emissions, using the workbook's DEFRA 2025 factors.

**Files:** `read_waste.py`, audit doc.

**Steps:**

2.1 **Factors (from DEFRA_Inputs — verbatim, kgCO₂e/tonne):**
- Landfill (mixed municipal): **446.242**
- Incineration with energy recovery: **21.294**
- Recycling (open/closed loop, glass, cardboard): **21.294**
- Anaerobic digestion / composting: **10.204**

Hard-code these as named constants with a comment citing DEFRA 2025 / workbook DEFRA_Inputs.

2.2 **Emissions per site:** `tCO₂e = Σ (route_tonnes × factor) / 1000` over the four routes. Store `emissions_scope3_cat5_tco2e` per site, plus an optional `emissions_by_route` breakdown.

2.3 **Diversion rate:** `(total − landfill) / total`. Store `diversion_rate` (0–1).

2.4 **Portfolio rollup** in `waste.json` `portfolio` block: total tonnage, total emissions, portfolio diversion, route totals, sites_with_data counts.

**PASS (within 5%):**
- Portfolio Scope 3 Cat 5 total **~4.86 tCO₂e** (Landfill 0.08 / Incin 2.75 / Recycled 1.65 / AD 0.38)
- Portfolio diversion **~99.9%**
- Gifford Lea diversion ~63%; Millbrook ~73%
- Emissions dominated by incineration (EfW), not landfill — confirms the diversion story

**Commit:** `Brief 9 Part 2: diversion rate + Scope 3 Cat 5 emissions (DEFRA 2025 factors)`

---

### Part 3 — Pipeline integration + rebuild

**Goal:** Wire into `build.py`, extend validation, clean rebuild.

**Steps:**
3.1 Confirm `read_waste` is called in `build.py` (it already is — this just confirms the new version runs).
3.2 Extend `validate.py`: waste.json has 12 villages with tonnage > 0; portfolio total between 200–280 t; portfolio emissions between 4–6 tCO₂e; diversion > 95%.
3.3 `python pipeline/build.py`. Confirm waste.json rebuilt, validation 0 issues.

**PASS:** clean rebuild; validation passes; waste.json has real per-site + portfolio data.

**Commit:** `Brief 9 Part 3: integrate waste reader, extend validation, rebuild`

---

### Part 4 — UI surfaces light up + walkthrough

**Goal:** Confirm the three surfaces show real waste data. Close brief.

**Steps:**
4.1 **Landing waste card** (`/`) — flips from "—" to **244 t** (or chosen headline), nugget updated to e.g. "99.9% diverted from landfill · 4.9 tCO₂e Scope 3". Update the Landing.jsx waste card to read the now-populated `portfolio.waste` fields instead of the hard-coded "—".
4.2 **Map Waste theme** (`/portfolio/map` → Waste) — leaderboard populates (sites ranked by tonnage), Total tonnes / Diversion % / Tonnes per unit sub-metrics all work, dots size by tonnage. Confirm the gridBar diversion metric uses `goodHigh` (high diversion = green).
4.3 **Site Detail waste** — the waste tile + any waste detail on the relevant sub-tab shows tonnage, stream breakdown, diversion, emissions. (Site Detail is cream register.)
4.4 **No-scroll check** (Hard Rule 9 / Rule 10) — every touched route fits 1440×900, no page scroll.
4.5 Self-walkthrough via MCP browser, screenshots to `docs/audit/09_screenshots/`.
4.6 Archive brief → `archive/09_waste_integration_COMPLETED.md`; repoint current.md (next: Brief 10 — Stark reader fix + Load Inspector); STATUS.md final; push.

**PASS:**
- Landing waste card shows real number + diversion/emissions nugget
- Map Waste theme fully populated, diversion gridBar green=high
- Site Detail waste populated
- No page scroll at 1440×900 on every touched route
- Build clean; pushed

**Commit:** `Brief 9 close: waste fully integrated — 244t, 99.9% diverted, 4.9 tCO2e Scope 3 Cat 5`

---

## What MUST NOT happen
- No editing the workbook (it's the read-only source)
- No inventing emission factors — DEFRA_Inputs verbatim
- No depending on Site_Summary cached values — aggregate raw sheets
- No fake data for the office (it's `not_applicable`, genuinely no contract)
- No Stark/Load Inspector work (Brief 10)
- No page that scrolls at 1440×900 (Hard Rule 9)
- No partial commits within a Part

## When to escalate (log + stop)
- Workbook missing or only P02 (proceed, note Millbrook disposal gap)
- Raw-sheet columns differ from documented structure
- A spot-check off by >5% from this brief's targets (parsing error — diagnose before continuing)
- Build fails
- 15 min stuck + 3 approaches

## Final report
1. HEAD SHA + parts landed
2. Portfolio: total tonnage, diversion %, Scope 3 Cat 5 tCO₂e — match targets (244t / 99.9% / 4.86)?
3. 12 villages with data + office not_applicable?
4. Three UI surfaces lit (landing card / map Waste theme / Site Detail)?
5. No-scroll holds at 1440×900 on touched routes?
6. Validation 0 issues? build clean?
7. Brief archived, current.md → Brief 10?
8. Known issues (Stark/Load Inspector still pending)?
9. Standing by for Chris.

## Notes for Claude Code
Pipeline-first brief: Parts 1–3 are Python (reader + emissions + rebuild), Part 4 is the UI surfacing + walkthrough. The numbers in this brief are pre-computed from the workbook and are falsifiable targets — if your output disagrees by >5%, you have a parsing bug, not a data difference; diagnose before proceeding. The waste story is the diversion: near-zero landfill makes Scope 3 Cat 5 tiny, and that's the headline, not a bug.

Confirm receipt (title + Target outcome), then begin Part 1.
