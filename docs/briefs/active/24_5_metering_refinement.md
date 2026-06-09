# Brief 24.5 — Metering refinement + Energy sub-tab redesigns + Brief 24 close

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after site Metering page review)
**Status:** Active. Refinement brief on top of Brief 24 — same site chapter, finishing the work. 5 Parts. Plough-through with NO checkpoints.
**Date opened:** 2026-06-04
**Mode:** Push at close. Walkthrough at **1920×1080 + 1440×900**. **Visual quality bar from Brief 24 applies — designer-mode throughout, iterate before shipping.**

---

## Why this brief

Brief 24 shipped the structural skeleton of the new site chapter — Metering & Data Quality combined page, sidebar overhaul, tile caption fix, Heat map redesign, sub-tab consolidation. Genuine wins. But:

**The Metering page review surfaced four real problems.** Walking through Millfield Green specifically, the page shows "1 meter" when the site actually has 134 (1 Stark + 133 Sycous). The page filters to electricity-only by default. The dark navy background register breaks the cream Site-chapter consistency. The data shown is jargon to a layperson.

**Brief 24's Part 4 sub-tab redesigns were honestly deferred.** Energy Overview (monthly bars + donut), Time series (CY25 default + squash-and-stretch), Daily profile (all-months + selected-month split), Duration curve (palette swap) — all parked when Claude Code made the right call to ship the Metering page + Heat map at quality rather than half-ship every sub-tab.

**Brief 24's close is still pending.** Quality gate review, anti-pattern audit, Rule 11 alignment check, audit doc population.

This brief lands all three in one coordinated pass. The Metering refinement is the headline (Parts 1 + 2). The Energy sub-tab redesigns finish the deferred work (Part 3). Brief 24's close work happens here too (Parts 4 + 5), so both briefs archive cleanly together.

**Critical framing — same as Brief 24:** designer-mode throughout. The Metering page already exists; this brief is making it actually impressive rather than landing the feature. The bar is the portfolio Sankey screenshot. Match it.

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 is the contract.** This brief lives inside Rule 11.
2. **STATUS.md** — full read at session start.
3. **Brief 24** (`docs/briefs/active/24_site_chapter_upgrade.md`) — the parent brief, still in active/. This brief closes it.
4. **Brief 24 close report** Claude Code wrote (Parts 1-3, 5 + Part 4 partial via the Heat map). Read the deferred-items list — it's the input to Part 3 of this brief.
5. **Portfolio Sankey screenshot** (in `docs/audit/20_metering_sankey/`) — **THE visual reference** for what the site Metering page should match.
6. **Brief 24's audit doc** if any populated.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (esp. Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/24_site_chapter_upgrade.md` → `cat docs/briefs/active/24_5_metering_refinement.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.5 **Land brief.** Place at `docs/briefs/active/24_5_metering_refinement.md`. Create `docs/audit/24_5_metering_refinement.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 24.5 land: metering refinement + Brief 24 close work`.

1. **Confirm inputs.**
   - `pipeline/dist/eir/sites.json`, `mpan_register.json`, `sycous.json` — already confirmed in Brief 24
   - Per-meter time-series data — needed for sparklines. Check whether `pipeline/dist/eir/per_meter/` or similar carries monthly readings per meter ID. **If not, document the gap and ship sparklines only where data exists — dash "—" elsewhere.**
   - Water meters per site — check `water.json` or equivalent. Does it carry per-meter rows, or just site totals?
   - Waste collection points per site — check `waste.json` or equivalent. Same question.

---

## THE VISUAL QUALITY BAR (carried forward from Brief 24)

The Brief 24 bar applies in full. Re-read it before starting Part 2.

**Specific anti-patterns this brief explicitly refuses:**
- Dark navy register inside Site chapter (the bug being fixed in Part 2)
- "Electricity" filter pill defaulted active (hides 90%+ of bulk-site meter estate)
- Naked MPAN/MPRN numbers without explanation (`2700007801700 · HH` reads as gibberish)
- Sparklines used as decoration when no data exists (use dash "—" instead)
- Status dots without a visible key explaining what green/amber/red mean
- "Data is current" status without nuance (current vs stale vs missing all need distinct treatment)
- Table that looks sparse and unconfident when a site has few landlord meters (the structural narrative card fixes this — it carries page weight when the table doesn't)
- Generic-tone summary text ("This is a residential site with electricity meters")
- All anti-patterns from Brief 24 (default Recharts colours, bordered tables, weak active states, grey-on-grey badges, italic helper text, vertical rules between columns)

---

## Scope statement

**IN SCOPE:**
- **Part 1 — Data prep:** Verify water/waste meter data exists per site at meter-level (not just totals); verify per-meter time-series data exists for sparkline support; surface any gaps in audit doc.
- **Part 2 — Metering page refinement (headline):**
  - Register switch: dark navy → cream, matching the rest of Site chapter
  - Default filter pill: "All meters" not "Electricity"
  - Surface Sycous sub-meters as table rows (they're currently being excluded for Millfield Green and others)
  - Surface water + waste meters as table rows (where data exists)
  - Structural narrative summary card at top (hand-written per-site, plain English, 2-3 sentences)
  - Demystify column data: expanded labels, tooltips on jargon (MPAN, MPRN, HH, NHH)
  - Per-meter sparklines (12-month consumption trend) where data exists, dash "—" where not
  - Status indicator key explaining current / stale / missing
- **Part 3 — Energy sub-tab redesigns (Brief 24 deferred work):**
  - CY25 default time window across Time series / Daily profile / Heat map / Duration curve
  - Squash-and-stretch motion on Time series granularity changes (Pablo spec)
  - Energy Overview: monthly bars + donut chart layout (60/40 split)
  - Daily profile: all-months overlay (left) + selected-month detail (right)
  - Duration curve: palette swap to IVG NZA tokens
- **Part 4 — Brief 24 close work:** Quality gate review, anti-pattern audit, Rule 11 alignment check, walkthroughs at both viewports, audit doc population.
- **Part 5 — Close both briefs:** Brief 24 archives as `archive/24_site_chapter_upgrade_COMPLETED.md`; Brief 24.5 archives as `archive/24_5_metering_refinement_COMPLETED.md`. `current.md` repointed.

**OUT OF SCOPE:**
- Carbon / Water / Waste tabs (still parked from Brief 24)
- Per-meter detail drill-down view (the click-into-individual-meter page)
- Site map view (still pending IVG building footprints)
- Plot-mapping to Luke Kibble's BI data (still pending)
- Sycous resident-billing surface (Brief 12's pending work)

---

## Operational mode

Plough-through, NO checkpoints. Same as Brief 24.

**Escalate (log + stop) for:**
- Pipeline genuinely lacks per-meter water/waste data. Surface, propose path, decide whether to ship without (acceptable) or block until data lands (probably not).
- Pipeline genuinely lacks per-meter time-series data. Surface; sparklines degrade to dash where data missing. Don't block.
- Rule 11 alignment breaks during the register switch.
- A visualisation (sparkline rendering, narrative card layout, monthly bars + donut) you cannot get to acceptable quality after 3 iterations. Surface and propose alternative.
- 20 min stuck + 3 approaches.

---

## Principles

1. **Designer-mode throughout** — same bar as Brief 24.
2. **Rule 11 inheritance** — no changes to the layout grammar.
3. **No data fabrication** — empty meter rows where commodity has no data, dash sparklines where time-series absent. Honest gaps.
4. **Narrative card is the page anchor for simple sites** — when a site has 1 landlord meter and the table looks sparse, the narrative card carries the page weight. It's not optional.
5. **Plain-English jargon-demystification** — tooltips on every code abbreviation. MPAN / MPRN / HH / NHH / Sycous / arbnco / Stark all get one-line plain explanations on hover.
6. **Browser-verify is the gate.**

---

## Parts

### Part 1 — Data prep + audit

Check the pipeline for what's actually there:

**Water meters per site.** Open `pipeline/dist/eir/water.json` (or equivalent). Does it carry per-meter rows with IDs, or just site-level totals? Output finding in audit doc. If per-meter rows exist, expose them in the JS derivation layer the same way `groupedMeterRegister` exposes MPANs. If they don't, mark "water meters at this site: N (site total)" and skip table rows for them.

**Waste collection points per site.** Open `pipeline/dist/eir/waste.json` or equivalent. Same question. Same treatment.

**Per-meter time-series data for sparklines.** Check:
- Stark HH meters → daily/monthly aggregable from HH data ✓ confirmed available
- Ecotricity NHH MPANs → monthly billing data, check if exposed per-meter
- Ecotricity gas MPRNs → same
- Sycous sub-meters → per-meter consumption, check exposure
- Void/Inactive MPANs → likely sparse, render dash

Build a small JS helper `meterTrend12Months(meterId)` that returns 12 monthly values where available, `null` where not. The Sparkline component checks for null and renders the dash treatment.

Build a small JSON config `eir/src/data/site_summaries.json` with hand-written 2-3 sentence summaries per site. Seed values below (Claude Code to validate against pipeline reality and refine wording where needed):

```json
{
  "millfield-green": "Bulk-meter site. Stark provides half-hourly data for the single landlord MPAN at the head of the supply. Sycous sub-meters all 133 apartments behind it for resident billing. No gas — fully electric, individual GSHP per unit. No invisible-to-IVG layer.",
  "austin-heath": "Bulk-meter site with CHP-driven heat networks. Stark provides half-hourly data for the landlord supply. Sycous sub-meters apartments for electricity and heat. Ecotricity provides gas billing for 2 MPRNs. Heat networks are zoned: P1+P2 share one, P3 has its own.",
  "gifford-lea": "Bulk-meter site with single CHP heat network. Stark for landlord HH. Sycous sub-meters resident electricity and heat across all phases. Single Ecotricity gas MPRN.",
  "bramshott-place": "DNO site. No private wire — residents have their own MPANs and supplier contracts (invisible to IVG). Ecotricity bills the small landlord estate and 3 gas MPRNs. No Sycous coverage. The 191 resident MPANs are estimated, not measured.",
  "millbrook-village": "Bulk-meter site with mixed heating. Stark for landlord HH. Sycous sub-meters not currently deployed — under review. Single Ecotricity gas MPRN serves pool + back-of-house only.",
  "durrants-village": "DNO site. Individual ASHP per unit, no heat network. Small landlord estate billed via Ecotricity. The 173 resident electricity meters are on individual supplier contracts; IVG has no visibility.",
  "great-alne-park": "DNO site. Individual ASHP per unit. Small landlord supply via Ecotricity. The 171 planned resident meters sit outside IVG's contract.",
  "ledian-gardens": "BNO site — IVG owns the cable network but residents have individual MPANs on it. Ecotricity bills 4 gas MPRNs and a small landlord estate. Sycous sub-meters 63 properties for heat and 63 for hot water. Approximately 162 resident MPANs sit on IVG-owned cable but are invisible to IVG.",
  "elderswell": "DNO site with hybrid heating. Limited landlord electricity through Ecotricity. 1 gas MPRN. No Sycous coverage. 145 planned resident meters outside IVG's visibility.",
  "ampfield-meadows": "BNO site. Sycous sub-meters resident electricity (57) and cold water (57). No gas. Limited landlord electricity through Ecotricity.",
  "blendworth-hills": "Bulk-meter site with ASHP throughout. Stark for landlord HH. Sycous sub-meters 32 properties for heat. Small landlord estate. No gas.",
  "sonning-common": "Bulk-meter site under construction. GSHP throughout, no gas. Limited current metering — out of GRESB FY25 scope.",
  "edwalton-office": "Office building — not a residential village. No accommodation meter estate. Out of GRESB FY25 scope."
}
```

The narrative-summary JSON file becomes a hand-edited canonical source — Chris can refine wording over time. The component reads from it.

Commit `Brief 24.5 Part 1: data prep + site summaries`.

### Part 2 — Metering page refinement (THE HEADLINE)

`eir/src/components/site/SiteMetering.jsx`:

**2a — Register switch.** Change background from dark navy `#080D1A` (Brief 24's choice) to cream / off-white — matching the rest of Site chapter. Text colours flip back to dark-on-light. All cards, panels, table backgrounds adapt. The sidebar can stay darker (it was darkened intentionally in Brief 24 Part 2 for white-text contrast); this is a register switch for the *main content area* only.

**2b — Default filter pill.** Change `defaultFilter = 'electricity'` → `'all-meters'`. The page lands showing every meter category. The Sycous sub-meters that are currently hidden for Millfield Green become visible by default.

**2c — Surface Sycous sub-meters as table rows.** The current implementation excludes Sycous from `groupedMeterRegister` somehow (verify how — likely a filter on the `Landlord` category). Sycous categories appear as their own grouped rows: "Sycous electricity — N sub-meters," "Sycous heat — N," "Sycous hot water — N," "Sycous heat & hot water — N," "Sycous cold water — N." For Millfield Green this means an additional row showing "Sycous electricity — 133 sub-meters."

**2d — Surface water + waste meters as table rows.** Where Part 1 confirmed per-meter water/waste data exists. Categories: "Water — N landlord meters," "Waste — N collection points." Expand-to-individual rows where IDs exist.

**2e — Structural narrative summary card.** New component, sits **above the headline strip** (at the top of the page, full width). Card design:

- Cream/light background, subtle border (`--rule` token), 24px padding
- Site name as a small caps eyebrow above the summary
- Summary text in `--text-body` weight 400, max-width ~720px
- Small icon set inline showing site-type at-a-glance (use existing IVG site icons or lucide composites — bulk-meter / DNO / BNO icon)
- Optional: 3-4 small "fact pills" below the summary text — "Bulk-meter • All-electric • 134 meters • 0 gas MPRNs" — but only if it doesn't clutter

The component reads from `site_summaries.json` (Part 1). For sites without a hand-written summary, falls back to "Summary pending — IVG ESG team to refine wording." (Should never happen since Part 1 seeds all 13 sites.)

**2f — Demystify column data + tooltips.** Every code abbreviation gets a hover tooltip explaining it in plain English:

| Code | Tooltip |
|---|---|
| MPAN | "Meter Point Administration Number — UK's unique identifier for an electricity meter" |
| MPRN | "Meter Point Reference Number — equivalent identifier for a gas meter" |
| HH | "Half-hourly — meter reports every 30 minutes" |
| NHH | "Non-half-hourly — meter is read monthly for billing" |
| Sycous | "Resident sub-metering platform — IVG-deployed for bulk-meter sites" |
| Stark | "Half-hourly data provider — reads the headline landlord supply" |
| Ecotricity | "Energy supplier — bills the landlord estate" |
| arbnco | "Data aggregator — used at DNO sites to derive resident consumption" |

Tooltips use existing tooltip component (Brief 17 era). 200ms delay before show.

Also: expand the column labels. "HH" subscript in the type column → "Half-hourly" full. "MPAN 2700007801700" stays as the ID but the column header reads "Meter ID (MPAN/MPRN)" not just "ID."

**2g — Per-meter sparklines.** New column in the expanded individual-meter rows: "12-month trend." Width ~80px. Use the existing `meterTrend12Months(meterId)` helper from Part 1.

Sparkline component:
- 80×16px SVG inline in the table cell
- 1.5px stroke, single colour from IVG palette matching the commodity (coral for elec, deep red for gas, blue for water, teal for heat)
- No fill, no axes, no grid
- 12 points connected via `path` with `d="M..."`
- Hover tooltip shows the underlying monthly values + min/max + mean
- Where `meterTrend12Months()` returns null (data unavailable): render `—` in the cell with `--text-muted` colour, no SVG

Don't ship sparklines that look thick or chart-y. Inline with the text like a piece of typography. Tufte-style.

**2h — Status indicator key.** The green/amber/red dots in the Status column need a key. Two options:

- Inline key below the table: small legend "● Current (<30 days) ● Stale (30-90 days) ● Missing (>90 days)"
- Sticky in column header: hovering "Status" column header reveals the legend tooltip

My lean: inline below the table — visible without hover.

PASS for Part 2: AFTER screenshots at 1920×1080 + 1440×900 showing:
- Millfield Green Metering page with Sycous sub-meters now visible as a row
- Narrative card above headline strip
- "All meters" filter pill active by default
- Cream register (not navy)
- Sparkline visible in at least one expanded meter row
- Tooltip showing on hover over "MPAN" jargon
- Status key visible below the table

Commit `Brief 24.5 Part 2: Metering page refinement`.

### Part 3 — Energy sub-tab redesigns (Brief 24 deferred work)

`eir/src/components/site/SiteEnergy.jsx`:

**3a — CY25 default time window.** Add to the Energy tab state: `defaultDateRange = { start: '2025-01-01', end: '2025-12-31' }`. Every sub-tab (Time series, Daily profile, Heat map, Duration curve) lands on CY25 by default. Year selector controls if user wants to change. Don't lock to CY25 — make it the default, switchable.

**3b — Squash-and-stretch motion on Time series.** The Pablo spec — when the user clicks a different granularity pill (1 day / 1 week / 2 weeks / 1 month / Quarter / 6 months / Year), the chart animates from old data shape to new with a spring transition (300-400ms, ease-out).

Implementation approach (one of):
- Animate the chart's data points: framer-motion's `useTransform` on the data array, interpolating between old and new states
- Animate the SVG path `d` attribute: use `attr` interpolation in d3 or framer-motion path morphing
- Animate the line chart's transform: scale-x for stretching, scale-y for vertical, with timing functions per axis

Whichever Claude Code finds cleanest. The visual outcome: the line/bars visibly stretch or compress between granularities — they don't snap. **Test the motion on 1 day → Year transition specifically; that's the most dramatic case and where the squash-and-stretch is most visible.**

If framer-motion struggles with the line chart, fall back to a cross-fade between the two states (300ms) as a softer-but-acceptable alternative. Document the call in close report.

**3c — Energy Overview redesign.** Replace whatever's currently on Overview with the brief-spec layout: 60/40 split.

- **Left (60%): Monthly bars.** Recharts BarChart, 12 months × 2 series (gas + electricity). Stacked or side-by-side — Claude Code's call based on visual density. Use IVG NZA palette: NZA Pink for gas, Mello Yello (or a brighter elec yellow) for electricity. NOT default Recharts colours. Y-axis labelled kWh with proper thousand-separators. X-axis Jan – Dec.
- **Right (40%): Donut chart.** Recharts PieChart with `innerRadius` to make it a donut. Two segments — annual gas + annual electricity. Same palette. Centre label: "Total: X MWh" in `--text-section-title`. Small legend below the donut.
- **Headline strip above both:** large kWh figures (annual gas, annual electricity, annual total) with confidence badges.

**3d — Daily profile redesign.** 60/40 split (or 50/50 if cleaner):

- **Left: All-months overlay.** 12 lines, one per month, each showing the average half-hourly load shape (48 data points, hour-of-day on X, kW on Y). Use a colour ramp from cool (Jan/Dec) to warm (Jun/Jul) — cool blue to warm coral, through the IVG palette extended. Lines at 1.5px stroke. Hover reveals month label.
- **Right: Selected-month detail.** Single thicker line (2.5px) for the selected month. Month selector above (pill row Jan–Dec). Defaults to current month or most recent month with data.

For sites without HH data: collapse to a single "Monthly mean kWh by hour-of-day not available — half-hourly data needed" message panel.

**3e — Duration curve palette swap.** Recharts AreaChart already in place from Brief 17. Swap the fill colour from whatever it currently is to IVG `--coral` token with 30% opacity. Stroke to `--coral` at full opacity. No other structural changes.

PASS for Part 3: AFTER screenshots for all 4 modified sub-tabs at both viewports. The squash-and-stretch motion verified by recording 5-10 seconds of clicking through granularity pills (or by clear description in close report of how the motion was implemented).

Commit `Brief 24.5 Part 3: Energy sub-tab redesigns`.

### Part 4 — Brief 24 close work (quality gate + audit)

**4a — Side-by-side visual comparison.** Open portfolio Sankey screenshot (Brief 20 audit doc) + new site Metering page in two browser windows. Screenshot both. Compare:
- Does the colour palette match?
- Does typographic discipline match?
- Does density / breathing room match?
- Does logo treatment match?
- Would a reasonable observer believe the same designer made both?

If any answer is "no," iterate the offending element and re-screenshot before close. Document the comparison in `docs/audit/24_5_metering_refinement.md`.

**4b — Anti-pattern audit.** Walk through every component changed by Brief 24 + 24.5 and confirm:
- No default Recharts colours: `grep -rn "fill=\"#" eir/src/components/site --include='*.jsx'` — manually inspect, all colours should be CSS var tokens not hex
- No bordered-cell tables: `grep -rn "border-collapse\|<th\|<td" eir/src/components/site --include='*.jsx'`
- No three-pill rows with weak active state — visual check on filter pills + view toggles
- No grey-on-grey badges — visual check on Status indicators
- No italic helper text clutter — visual check
- No vertical rules between table columns — visual check
- No dark navy register inside Site chapter content area — visual check (fixed in Part 2a)

Document each anti-pattern check result in audit doc.

**4c — Rule 11 alignment check.** Browser devtools, paste left-edge x-coordinates at 1920 viewport for:
- Primary nav leftmost button (e.g. "Home")
- Secondary nav leftmost button (e.g. site sub-tab "Overview")
- Tertiary nav leftmost tab (if applicable)
- Body content first element (page title / first card)

All within 2px of each other. Per Brief 19.5 alignment gate.

**4d — Full walkthrough.** Click through every site tab in order: Overview → Energy (all 5 sub-tabs) → Metering & data quality. At 1920×1080 then at 1440×900. Test the sidebar at both viewports. Test the narrative card on at least 3 different sites (one bulk-meter, one DNO, one BNO) to confirm the wording reads correctly. Land all screenshots in audit doc.

**4e — Linked selection interaction test.** On Metering page, click a table category row → confirm graphic dims appropriately. Click a Sankey node → confirm table row highlights. Activate "Landlord" filter pill → confirm both panes filter. Document interaction working in close report.

**4f — No-regression check.** Portfolio chapter (Map, Energy, Water, Waste sub-tabs) unaffected. Site chapter Carbon / Water / Waste tabs unchanged. Screenshot one portfolio page + one of the untouched site tabs to confirm.

Commit `Brief 24.5 Part 4: quality gate + Brief 24 close work`.

### Part 5 — Close both briefs

- **Brief 24 close:** Audit doc populated with Brief 24 deliverables retrospectively (Parts 1-3, 5, 4 partial). Brief 24 archived to `archive/24_site_chapter_upgrade_COMPLETED.md`. STATUS.md entry for Brief 24 close.
- **Brief 24.5 close:** Audit doc populated with Parts 1-4. Brief 24.5 archived to `archive/24_5_metering_refinement_COMPLETED.md`. STATUS.md entry.
- `current.md` repointed to whatever comes next (or "no active brief" if nothing queued).

Known issues logged. Specifically:
- Carbon / Water / Waste tabs still untouched (out of scope of both 24 and 24.5).
- Per-meter detail drill-down still deferred (the click-into-individual-meter detail page).
- Site map view still placeholder (pending IVG building footprints).
- Plot-mapping for Luke Kibble's BI data still deferred (data not available).
- Sycous resident-billing surfacing (Brief 12's pending work) still queued.
- Pipeline data: any per-meter water/waste data gaps surfaced in Part 1 noted as IVG asks.

Commit `Brief 24 + 24.5 close: site chapter visual upgrade complete`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 5 Parts of 24.5 landed with commits per Part. Brief 24 archived in same commit run.
2. **Part 1 data audit:** water/waste meter availability + per-meter time-series availability documented in audit doc. Site summaries JSON populated with 13 entries.
3. **Part 2a register switch:** Metering page background is cream (not navy). AFTER screenshot.
4. **Part 2b default filter:** "All meters" pill active by default. AFTER screenshot.
5. **Part 2c Sycous rows surfaced:** Millfield Green Metering page shows Sycous electricity row with 133 sub-meters. AFTER screenshot specifically for Millfield Green.
6. **Part 2d water/waste rows:** where pipeline data exists, water/waste rows visible. AFTER screenshot OR audit doc note if pipeline data is site-totals-only.
7. **Part 2e narrative card:** visible at top of Metering page for at least 3 sites (one bulk, one DNO, one BNO). AFTER screenshots.
8. **Part 2f tooltips:** hover on "MPAN" reveals plain-English tooltip. Visible in screenshot or video.
9. **Part 2g sparklines:** at least one expanded meter row shows a sparkline. Dash "—" rendered where data missing.
10. **Part 2h status key:** legend visible below table explaining current / stale / missing.
11. **Part 3a CY25 default:** Time series / Daily profile / Heat map / Duration curve all land on CY25 by default. Year selector still works.
12. **Part 3b squash-and-stretch:** Time series granularity change animates with spring transition (or cross-fade fallback). Recorded in screenshot sequence or described in close.
13. **Part 3c Overview redesign:** monthly bars + donut chart layout visible. AFTER screenshot.
14. **Part 3d Daily profile split:** all-months overlay (left) + selected-month detail (right). AFTER screenshot.
15. **Part 3e Duration curve palette:** IVG coral tokens, not default. Visual check.
16. **Part 4 visual quality gate:** side-by-side comparison documented. Confirmed "same designer" test passes.
17. **Part 4 anti-pattern audit:** all checks documented; no failures unaddressed.
18. **Part 4 Rule 11 alignment:** left-edge coordinates pasted, all within 2px.
19. **Part 4 walkthrough:** full screenshot set at both viewports across all site tabs.
20. **Part 4 linked selection:** confirmed working with screenshots / description.
21. **Part 4 no-regression:** portfolio + untouched-site-tabs screenshot.
22. **Part 5 both briefs archived:** Brief 24 and Brief 24.5 in `archive/`. `current.md` updated. STATUS.md entries.
23. **Known issues logged** comprehensively in close report.

---

## One last thing

Same as Brief 24: **designer-mode throughout.** Pretend you're trying to impress a graphic designer with this work. The narrative card is a delicate component — write the wording carefully (use the seed JSON in Part 1 as the starting point but refine if the wording reads stilted). The sparklines are Tufte-style typography, not chart decoration. The Heat map already redesigned — make sure the rest of the Energy tab catches up to that bar.

Match the portfolio Sankey screenshot. If something looks bad on first pass, iterate before shipping.

Push at close. Hope you're both proud of what comes back.
