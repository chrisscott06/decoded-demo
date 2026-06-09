# Brief 21 — Site chapter visual upgrade + Metering & Data Quality

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after site-page walkthrough + design discussion)
**Status:** Active. Large brief — 6 Parts. Plough-through with NO checkpoints (Chris explicit: "give Claude Code a nice big job whilst I'm out").
**Date opened:** 2026-06-04
**Mode:** Push at close. Walkthrough at **1920×1080 + 1440×900**. **Visual quality gate is a hard PASS criterion, not a nice-to-have.**

---

## Why this brief

Chris reviewed the Site chapter on 4 Jun and identified that the entire site experience needs a coordinated visual + structural upgrade. The current state is functional but design-naive: sidebar contrast is wrong, data tile captions are confusing, the Energy tab assumes half-hourly data the page often doesn't have, the Heat map is unreadable due to single-tone fill, and the Metering / Data Quality information is split across two thin tabs when it should be one rich page.

This brief redesigns the Site chapter end-to-end in a single coordinated pass. The Metering & Data Quality combined page is the headline new feature — table + graphic split with Sankey / Treemap / Bars view-toggle, linked selection between table and graphic, GRESB readiness scoring strip across the top. This is the page that genuinely impresses IVG.

**Critical framing for Claude Code: this brief is mostly a design exercise, not a feature delivery. Pretend you are a graphic designer trying to genuinely impress the client. Match the visual discipline of the portfolio Sankey (see Reference 6). Do NOT settle for "the chart renders" — push until it looks like a designer made it.**

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 is the contract** for layout, type scale, nav alignment, palette, motion. This brief lives inside Rule 11 and must NOT modify it.
2. **STATUS.md** — full read at session start.
3. **Brief 17 Amendment 2** (archived) — established the Energy sub-tabs pattern; this brief restructures them.
4. **Brief 19.5** (archived) — established the underline-on-active tertiary nav pattern. Inherit, don't reinvent.
5. **Brief 20** (active or recently closed) — portfolio Metering Sankey. **If Brief 20 has shipped, REUSE the SankeyChart component, parameterised for site scope. If Brief 20 has not yet shipped, this brief introduces the Sankey pattern at site scope first.** Check `docs/briefs/active/` and `git log` at session start.
6. **Portfolio Sankey screenshot** (the user-shared image at audit doc start) — **THE visual reference**. The dark navy background, the IVG palette saturation, the logo placement, the typographic discipline, the density. This brief must produce work that looks like the same designer made both pages.
7. **Phasing & Area Schedule spreadsheet** (`IVG_Phasing_Area_Schedule.xlsx` from this session, see audit doc) — landlord meter counts per site; pulled into Part 1 if not already in pipeline.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (esp. Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/21_site_chapter_upgrade.md` → open the portfolio Sankey screenshot side-by-side in browser while you work.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.2 **Brief 20 check:** If Brief 20 (portfolio Metering Sankey) is in active/ but not closed, **complete Brief 20 first** (you'll need the SankeyChart component for Part 5 anyway). If 20 is closed, reuse the component. If 20 doesn't exist, you build the Sankey from scratch in Part 5 and the portfolio version comes later.

0.5 **Land brief.** Place at `docs/briefs/active/21_site_chapter_upgrade.md`. Create `docs/audit/21_site_chapter_upgrade.md` with the portfolio Sankey screenshot embedded as the visual reference. Update `current.md`. **Update STATUS.md.** Commit `Brief 21 land: site chapter upgrade`.

1. **Confirm inputs.**
   - `pipeline/dist/eir/sites.json` — per-site metadata
   - `pipeline/dist/eir/mpan_register.json` — per-site MPAN/MPRN breakdown
   - `pipeline/dist/eir/sycous.json` — per-site Sycous coverage
   - `pipeline/dist/eir/stark_hh/` — half-hourly data where available
   - `eir/public/sites/<site>/icon.svg` — site icons (Brief 14 assets)
   - `eir/public/logos/` — platform logos (stark.svg, ecotricity.svg, sycous.svg, arbnco.svg)

---

## THE VISUAL QUALITY BAR — read this twice

This brief is being executed because the current site chapter looks naff. The work isn't "make it functional" — it's "make it look genuinely good." Three frames to hold:

**Pretend you are a graphic designer trying to impress the client.** Every decision goes through that filter. Generic Recharts defaults? Refuse. Lucide icons where IVG icons exist? No. Bordered cell tables that look like spreadsheet exports? No. The portfolio Sankey screenshot is the bar. Match it.

**Anti-patterns this brief explicitly refuses:**
- Default Recharts colour palette (the muted blues, oranges, greens). Use IVG NZA palette tokens.
- Bordered-cell tables. Use spacing, typographic hierarchy, and zebra-striping only where it earns its keep.
- Three-pill rows where the active pill is only slightly more saturated than the inactive (Brief 17.5 fixed this for tertiary nav; same discipline everywhere).
- Grey-on-grey badges. If a badge means something, give it semantic colour.
- Italic helper text below every data field. Clutters.
- Generic lucide icons where the IVG icon set or a meaningful composite exists.
- Vertical rules between columns (the "spreadsheet" feel).
- Heat maps with insufficient saturation range (the current Heat map is pink-on-pink; fix this).
- Decorative gradients. Use solid fills from the palette.
- Tooltips that just repeat the visible label.

**Iterate before shipping.** If your first attempt at the Heat map lacks contrast, look at it, screenshot it, and ITERATE. Don't ship Part 4 just because the chart renders. Ship Part 4 because you would be proud to show it to a graphic designer. Same for every chart, every table, every panel.

---

## Scope statement

**IN SCOPE:**
- Site sidebar: darker background, site icons replace dots, GRESB readiness sub-indicators (4 pills per site), key explaining at bottom, investigate why no greens
- Site Overview tile captions: rewrite to count landlord meters not total MPANs; drop generic narrative
- Energy tab restructure: 6 sub-tabs → 5 (Data quality moves out), default to CY25, kill bottom strip
- Energy Overview: monthly bars (gas + electricity) + donut chart layout
- Energy Time series (renamed from "Half-hourly load"): squash-and-stretch motion between granularity changes
- Energy Daily profile: all-months overlay + selected-month detail split
- Energy Duration curve: keep as is (no change beyond palette)
- Energy Heat map: complete redesign — sequential cream-to-deep-red ramp, HH granularity (48×365 grid) where data exists, monthly fallback where not
- Metering & Data Quality combined page: NEW
  - Headline strip: total meters, platform coverage logos, data quality summary, GRESB readiness (4 sub-indicators)
  - Table left (40%): grouped meter rows, expandable to individuals, sortable, searchable
  - Graphic right (60%): toggle between Sankey / Treemap / Bars
  - Two-way linked selection: clicking in either highlights the other
  - Filter pills above the table

**OUT OF SCOPE (Chris explicit "ignore for now"):**
- Carbon tab — untouched
- Water tab — untouched
- Waste tab — untouched
- Sycous resident-billing surfacing (Brief 12's pending work)
- Per-meter detail drill-down view (the click-into-individual-meter detail page)
- Spatial / site-plan map view for meters (no building footprint data yet)
- Plot-mapping join to Luke Kibble's BI data (data not yet available)

---

## Operational mode

**Plough-through, NO checkpoints.** Chris is out. Execute all 6 Parts in sequence. Push at close.

**Escalate (log + stop) for:**
- Rule 11 alignment breaking (any of the four nav left-edges drifting from x ≈ 320 at 1920 viewport)
- Pipeline data missing that the page genuinely needs (e.g. landlord_meter_count per site doesn't exist anywhere). Surface and stop.
- Brief 20 conflicts (you start Part 5 and find the SankeyChart component exists but breaks at site scope — surface, propose path, stop).
- A visualisation that you cannot get to acceptable quality after 3 iterations. Surface, screenshot, propose alternative.
- 20 min stuck + 3 approaches.

**The visual quality bar applies throughout.** If your first attempt at the Heat map looks bad, iterate. Don't escalate just because it's hard — iterate until it's good. Only escalate if you've tried genuinely different approaches and none work.

---

## Principles

1. **Designer-mode throughout.** Every component re-render is "would this impress a graphic designer?" If not, iterate.
2. **Rule 11 inheritance.** Container 1280px centred, nav-content-max-width alignment, type scale via clamp tokens, motion via framer-motion. Don't redesign Rule 11; live inside it.
3. **No data fabrication.** Empty cells stay empty. Missing meter counts get marked, not guessed.
4. **Real numbers from the pipeline.** No hardcoded counts in components. `grep -E "1049|496|338|128" eir/src/components/site/` must return zero hits.
5. **Reuse Brief 20 components if they exist.** Site-scope Sankey reuses portfolio SankeyChart. Don't reimplement.
6. **Browser-verify is the gate** (Process Rule 10). 1920×1080 primary walkthrough, 1440×900 graceful scale-down. AFTER screenshots mandatory for every Part.
7. **Anti-patterns are bright lines.** Re-read the "What this brief refuses" list before each Part.

---

## Parts

**Each Part: STATUS.md updated at start + end. Commit + push after PASS. Hard Rules 2, 3, 4 apply.**

### Part 1 — Pipeline data prep

Add to `portfolio.json` (or appropriate per-site JSON) the data this brief needs that isn't already there:

- **`landlord_meters_only`** per site: count of meters that produced the headline landlord-kWh figure (NOT total MPANs). For Ledian: 1 HH + 0 NHH = **1**. For Austin Heath P2 (the VC site): the appropriate landlord count. Add the equivalent for gas (landlord MPRNs only), water (landlord water meters only), waste (collection points).
- **`gresb_readiness`** per site: object with 4 sub-indicators:
  ```
  {
    landlord_electricity: 'green' | 'amber' | 'red',
    landlord_gas:         'green' | 'amber' | 'red' | 'n/a',
    water:                'green' | 'amber' | 'red',
    waste:                'green' | 'amber' | 'red',
    overall:              'green' | 'amber' | 'red'   // composite
  }
  ```
  Methodology in `docs/audit/21_site_chapter_upgrade.md`: green = full landlord coverage + recent data within 30 days; amber = coverage but stale or partial; red = no landlord data. Investigate why no site currently shows green and either fix the logic or surface why (e.g. methodology too strict).
- **`platform_coverage`** per site: array of platforms serving this site (`['stark', 'ecotricity', 'sycous']` for bulk sites; `['ecotricity']` for DNO sites).
- **`data_quality_summary`** per site: `{ meters_total, meters_current, meters_stale, meters_missing, last_updated_per_platform: { stark: '2026-06-03', ecotricity: '2026-05-15', sycous: '2026-06-02' } }`.
- **`meter_register_site`** per site: structured for table consumption. Array of meter objects: `{ id, type, commodity, platform, category, status, last_reading, latest_kwh, anomaly_flag }`. Where `category` matches the Sankey left-column (Landlord HH / NHH / Void / Other / Gas / Sycous-elec / Sycous-heat / etc).

Commit `Brief 21 Part 1: pipeline data prep for site chapter`.

### Part 2 — Site sidebar overhaul

`eir/src/components/site/SiteSidebar.jsx` (or wherever the sidebar renders):

- **Background:** darken from current pale tone to navy-elev (use existing `--bg-elev` token or introduce sidebar-specific darker variant). White text must read at AAA against new background — verify with accessibility check.
- **Per-site row:** replace the small coloured dot with the site's `icon.svg` (Brief 14 asset), sized 24px, coloured to match the GRESB readiness state (green/amber/red). Site name in `--font-site` Source Serif as currently.
- **GRESB readiness:** the site icon colour is the *overall* indicator. **Below the icon, a row of 4 tiny pills (elec / gas / water / waste), each coloured by its sub-indicator.** Pills are 8px tall, no text, just colour. Hover reveals tooltip naming the sub-indicator and its state. This is the diagnostic detail — composite icon for at-a-glance, pills for "why."
- **Sidebar footer:** small key explaining: "● GRESB readiness — landlord coverage across electricity, gas, water, waste." Below that, the 4 sub-indicator labels with their corresponding pill colours.
- **Investigate the no-green-sites bug.** Either fix the GRESB methodology to surface deserved greens, or document why no current site qualifies (and put that in the audit doc).

PASS for Part 2: AFTER screenshot at 1920×1080 showing the sidebar with at least one site showing green (if methodology supports it) or documented reason in audit doc if not.

Commit `Brief 21 Part 2: site sidebar overhaul`.

### Part 3 — Site Overview tile refinements

`eir/src/components/site/SiteOverview.jsx`:

- **Electricity tile caption:** currently "65 MPANs · 12 mo CY25". Change to "**N Landlord meter(s) · 12 mo CY25**" where N comes from Part 1's `landlord_meters_only.electricity`. For Ledian: "1 Landlord meter · 12 mo CY25". The 65-MPAN figure (which includes residents) does NOT belong on a landlord-kWh tile.
- **Gas tile caption:** same treatment. "N Landlord MPRN(s) · 12 mo CY25". For Ledian: "4 Landlord MPRNs · 12 mo CY25".
- **Water tile caption:** "N landlord water meter(s) · CY25"
- **Waste tile caption:** "N collection points · CY25"
- **Drop any generic narrative blurb** between the tiles. Headline number + clear caption + partial/confirmed badge is enough. The page does not need explanatory prose at this level.
- **Hero photo + Photo/Aerial/Site plan toggle:** unchanged.

PASS for Part 3: AFTER screenshot showing all four tiles with corrected captions; before/after diff.

Commit `Brief 21 Part 3: site overview tile cleanup`.

### Part 4 — Energy tab restructure

`eir/src/components/site/SiteEnergy.jsx` (or wherever the site-level Energy renders).

**Sub-tab change:** from `Overview / Time Series / Daily Profile / Monthly / Duration Curve / Heat Map / Data Quality` (7 tabs) to `Overview / Time series / Daily profile / Duration curve / Heat map` (5 tabs). Drop "Data quality" (it moves to Part 5's combined Metering page). Drop "Monthly" (it folds into Overview).

**Kill the bottom strip.** The "Resident energy (Sycous) · Ledian Farm · 63 properties · 126 meters" strip at the bottom of every Energy sub-tab is repetitive clutter. Remove it from every Energy sub-tab. The Metering page (Part 5) will surface this richly.

**Default time window:** Time series defaults to **CY2025 (1 Jan 2025 – 31 Dec 2025)**, not the full dataset (which currently shows Mar 24 – Feb 26). Same default for Daily profile, Heat map, Duration curve. Year selector controls if user wants to change.

---

**4a — Overview sub-tab.** Two-column layout, 60/40 split:
- **Left (60%): Monthly bars.** Stacked or side-by-side bar chart showing gas (NZA Pink palette) and electricity (Mello Yello palette) kWh by month for CY25. 12 bars × 2 series. Use IVG palette tokens, NOT default Recharts colours. Y-axis labelled kWh. X-axis Jan – Dec.
- **Right (40%): Donut chart.** Annual split of gas vs electricity for CY25. Two segments. Same palette. Label in the centre: "Total: X MWh". Legend below.
- **Headline strip above both:** large kWh figures (annual gas, annual electricity, annual total) with confidence badges.

**4b — Time series sub-tab.** The previous "Half-hourly load" page restructured.
- **Default view:** CY25 at 1-week granularity, showing a continuous line chart of electricity load (kW). For sites without HH data, fall back to monthly bars and show a marker explaining "monthly granularity — HH not available for this site."
- **Granularity pills above the chart:** 1 day / 1 week / 2 weeks / 1 month / Quarter / 6 months / Year. Active pill highlighted per Brief 19.5 pattern (underline on active).
- **CRITICAL — squash-and-stretch motion:** When the user clicks a different granularity pill, the chart does NOT snap to the new view. Instead, framer-motion animates the bar widths / line densities with a spring transition (300-400ms, ease-out). The chart visually "stretches" or "compresses" as data points consolidate or expand. This is the Pablo motion spec. Use `motion.div` with `layoutId` or animate the SVG path `d` attribute with `framer-motion`.

**4c — Daily profile sub-tab.** Two-column layout, 60/40 split:
- **Left (60%): All-months overlay.** 12 faint lines, one per month, each showing the average half-hourly load shape across that month. Use a colour ramp (cooler winter months → warmer summer months) from the IVG palette extended set. Hover reveals which month a line is.
- **Right (40%): Selected-month detail.** Single thicker line showing the selected month's profile. Month selector above (pill row or dropdown). Defaults to current month.
- For sites without HH data: show a clear message and fall back to monthly average bars.

**4d — Duration curve sub-tab.** Unchanged structurally. Update palette to IVG tokens. Drop the strip at the bottom.

**4e — Heat map sub-tab — complete redesign.** This is the one that's currently unreadable.
- **Resolution:** 48 columns (half-hour slots) × 365 rows (days of year), where HH data exists. Render as an SVG grid.
- **Colour scale:** **Sequential cream-to-deep-red, full saturation range.** Lightest cells = lowest kW (light cream / off-white). Mid cells = coral. Deepest cells = deep red. Use the IVG palette extended — the Deep Red token at the dark end. Minimum 8 saturation steps (not the current 2-step pink-on-pink). The temperature heat map Chris referenced (blue/red diverging around dead band) is the *visual richness target*, but consumption is a single-direction quantity so we use sequential not diverging.
- **Axis labels:** X-axis shows hours (00, 03, 06, 09, 12, 15, 18, 21). Y-axis shows months (Jan, Feb, … Dec — group 365 rows into month bands).
- **Hover tooltip:** exact kW figure for the hovered cell.
- **Legend:** horizontal gradient bar below the heat map with min/max kW labels.
- **Title:** "Mean kW by half-hour across CY25. Darker = higher demand."
- For sites without HH data: collapse to a monthly × hour-of-day aggregate (12 × 24) and mark "monthly aggregate — HH not available."

**Iterate Part 4e until it looks rich.** The current heat map fails because the colour range is too narrow. Get the saturation range right. Then look at it next to the temperature heat map and ask: does mine have similar visual richness? If not, iterate.

PASS for Part 4: AFTER screenshots for all 5 sub-tabs at 1920×1080 + 1440×900. Specifically for 4e, screenshot must show a heat map with VISIBLE pattern (e.g. morning/evening peaks, weekend dips). If the pattern isn't visible, the colour scale is wrong — iterate.

Commit `Brief 21 Part 4: Energy tab restructure (5 sub-tabs)`.

### Part 5 — Metering & Data Quality combined page (THE HEADLINE FEATURE)

`eir/src/components/site/SiteMetering.jsx` — new page. This replaces both the old "Meters" tab and the old "Data quality" tab in the site nav. After this brief, the site nav reads: **Overview / Energy / Carbon / Water / Waste / Metering & data quality**.

**The page structure:**

```
┌────────────────────────────────────────────────────────────┐
│  HEADLINE STRIP (full width)                                │
│  Total meters · Platform logos · Quality summary · GRESB    │
├──────────────────────────┬─────────────────────────────────┤
│  TABLE (40%)             │  GRAPHIC (60%)                  │
│  ───────────────         │  ─────────────                  │
│  [Filter pills above]    │  [Sankey / Treemap / Bars]      │
│                          │                                  │
│  Grouped rows by         │  Selected view renders here     │
│  default; click to       │                                  │
│  expand to individuals.  │  Linked to table selection.     │
│                          │                                  │
│  Sortable, searchable.   │                                  │
└──────────────────────────┴─────────────────────────────────┘
```

---

**5a — Headline strip across the top.**

Four panels horizontally:
- **Total meters at this site:** "N visible to IVG" with breakdown sub-line "X Landlord · Y Sub-meter · Z Void/Inactive". Plus a separate badge for "~M invisible to IVG (DNO residents)" if applicable.
- **Platform coverage:** the 4 platform logos (Stark, Ecotricity, Sycous, arbnco) in horizontal row. Each logo is full colour if the platform serves this site; muted/dashed-outline if not. So Ledian shows Ecotricity full + Sycous full + arbnco full, Stark dashed (no HH at Ledian). Hover reveals the meter count per platform.
- **Data quality summary:** "Last updated: [most recent platform timestamp]". Sub-line: "X meters current · Y stale · Z missing".
- **GRESB readiness:** 4 sub-indicator pills (electricity / gas / water / waste) each coloured green/amber/red. Overall composite indicator pill to the right. Same data as the sidebar (Part 2). Click any pill to scroll to / filter the table on that sub-indicator's meters.

Strip height: ~120px. Generous padding. Each panel separated by subtle vertical rule (1px `--rule` token).

---

**5b — Filter pills above the table.**

Row of toggle pills:
- "All meters" (default)
- "Landlord"
- "Sub-metered" (Sycous)
- "Void / between residents"
- "Inactive / unclear"
- "By commodity:" Gas / Electricity / Heat / Water — these stack on a second row if needed

Active pill per Brief 19.5 pattern. Multi-select where it makes sense (e.g. Landlord + Electricity = landlord electricity only).

---

**5c — Table on the left (40% width).**

Default state: **grouped rows**. One row per meter category for this site. For Ledian:

```
▶ Landlord — 1 meter
▶ Gas (MPRN) — 4 meters
▶ Void / between-residents — 54 meters
▶ Inactive — 10 meters
▶ Sycous heat — 63 meters
▶ Sycous hot water — 63 meters
```

Each grouped row shows: category name, meter count, latest kWh/m³/t figure where applicable, status indicator (current / stale / missing).

Click the ▶ arrow → expand to individual rows. Individual row columns: meter ID, type code, platform, status, last reading date, latest reading value, anomaly flag.

**No bordered cells.** Use generous row spacing (~36px), zebra stripe only where data density justifies it, type hierarchy (heavier weight on meter ID, lighter on metadata). Table reads as a clean inventory, not a spreadsheet export.

Sortable column headers. Search box above the table (Cmd+K or visible). Search filters across meter ID, type, and platform.

---

**5d — Graphic on the right (60% width).**

View-toggle pills above the graphic: **Sankey · Treemap · Bars** (and a placeholder fourth slot "Site map" with a "Coming soon" tooltip — for when building footprint data arrives).

**Sankey view (default):** Site-scope adaptation of the portfolio Sankey from Brief 20. Left column = commodity (Gas, Elec Landlord HH, Elec Landlord NHH, Void, Other, Sycous-elec, Sycous-heat, Sycous-HW, Sycous-HHW, Sycous-CW depending on site). Middle = platforms serving this site (Stark, Ecotricity, Sycous, arbnco, Invisible). Right = **meter category groupings**, NOT individual meters (a single site has too many individual meters for a clean Sankey — group by category, same as the table's grouped rows). For Ledian: ~6 right-column nodes. Click any node → highlights both (a) connected ribbons in the Sankey AND (b) the corresponding rows in the table.

**Treemap view:** Square-packed cells, sized by meter count, coloured by commodity (gas red, elec yellow, sub-meter teal/blue gradient by service type). Each cell labelled with the meter category and count. The visual answers "which platform / category dominates this site's metering estate?" instantly. Use d3-treemap or recharts Treemap. Click cell → highlights table row.

**Bars view:** Simple horizontal bar chart, one bar per meter category, sorted by count descending. Coloured by commodity per the Sankey palette. The fallback view that always reads correctly. Click bar → highlights table row.

**Site map view (placeholder):** Renders a "Coming soon" panel with text: "Spatial view of meters across the site. Pending building footprint data from IVG." Faded/dashed border.

---

**5e — Linked-selection behaviour between table and graphic.**

Two-way linking via shared selection state (use React context or zustand if not present):

- **Click a grouped row in the table** → corresponding Sankey node / treemap cell / bar highlights in the graphic. Other elements dim to 25% opacity.
- **Click a node in the Sankey / cell in Treemap / bar in Bars** → corresponding table row highlights (background tint). Table does NOT collapse / filter — the row stays in place but gets highlighted. Other rows dim slightly.
- **Filter pills above the table** drive both views — selecting "Landlord" hides non-landlord table rows AND dims non-landlord ribbons/cells in the graphic.
- **Search box** filters table rows AND dims non-matching graphic elements.

Click an empty area or press Escape → release selection.

Use framer-motion for the dim/highlight transitions (180ms ease-out).

---

PASS for Part 5: AFTER screenshots at 1920×1080 showing:
- Default state (all visible)
- Sankey view with one node clicked (showing linked highlight in table)
- Treemap view
- Bars view
- Filter "Landlord" pill active (showing both table and graphic filtered)
- Hover tooltip on a meter row
- 1440×900 graceful scale-down

Commit `Brief 21 Part 5: Metering & Data Quality combined page`.

### Part 6 — Visual quality gate + walkthrough + close

This is the design review. Don't skip it.

**6a — Side-by-side comparison.** Open the portfolio Sankey (Brief 20) in one browser window and the new site Metering page in another. Screenshot both. Compare:
- Does the colour palette match?
- Does the typographic discipline match?
- Does the density / breathing room match?
- Does the logo treatment match?
- Would a reasonable observer believe the same designer made both?

If any answer is "no," iterate that element and re-screenshot. Document the comparison in `docs/audit/21_site_chapter_upgrade.md`.

**6b — Anti-pattern audit.** Walk through every new component and confirm:
- No default Recharts colours (`grep -rn "recharts" eir/src --include='*.jsx' | xargs grep -l "stroke=\"" | head` — manually inspect)
- No bordered-cell tables (`grep -rn "border-collapse\|<th\|<td" eir/src --include='*.jsx'`)
- No three-pill rows with weak active state — visual check
- No grey-on-grey badges — visual check
- No italic helper text clutter — visual check

**6c — Rule 11 inheritance check.** Browser devtools, paste left-edge coordinates at 1920 viewport for:
- Primary nav leftmost button
- Secondary nav leftmost button
- Tertiary nav leftmost tab (site sub-tabs)
- Body content left edge

All within 2px (per Brief 19.5 alignment gate).

**6d — Full walkthrough.** Click through every site tab in order: Overview → Energy (all 5 sub-tabs) → Metering & data quality. At 1920×1080 then at 1440×900. Land all screenshots in the audit doc.

**6e — No-regression check.** Portfolio chapter (Map, Energy, Water, Waste) unaffected. Screenshot one portfolio page to confirm.

**6f — STATUS.md final update. Brief archived. current.md repointed.**

Commit `Brief 21 close: site chapter visual upgrade complete`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 6 Parts landed with commits per Part.
2. **Part 1 pipeline data:** `landlord_meters_only`, `gresb_readiness`, `platform_coverage`, `data_quality_summary`, `meter_register_site` all present in JSON outputs. JSON inspection pasted.
3. **Part 2 sidebar:** darker background, site icons replacing dots, 4-pill GRESB sub-indicator row per site, footer key. AFTER screenshot. At least one site shows green OR audit doc documents why none do.
4. **Part 3 tile captions:** all four tiles show landlord-meter counts not total MPAN counts. Generic narrative removed. AFTER screenshot.
5. **Part 4 Energy restructure:** 5 sub-tabs (not 7). CY25 default. Resident strip removed from every sub-tab. AFTER screenshots for all 5.
6. **Part 4e Heat map redesign:** sequential cream-to-deep-red with at least 8 saturation steps. Visible pattern in the screenshot (peaks, weekly cycles). NOT pink-on-pink.
7. **Part 4 squash-and-stretch motion:** Time series granularity changes animate smoothly. Verify by recording 5 sec of interaction OR by demonstrating in close report that framer-motion is wired up to the data transitions.
8. **Part 5 Metering page:** headline strip + table + graphic-with-toggle visible. AFTER screenshots of all 3 graphic modes (Sankey / Treemap / Bars).
9. **Part 5 linked selection:** screenshot showing table-row-clicked-and-Sankey-highlighted; screenshot showing Sankey-clicked-and-table-row-highlighted.
10. **Part 5 filter pills:** screenshot showing "Landlord" filter active with both views responding.
11. **Visual quality gate:** side-by-side screenshot of portfolio Sankey + site Metering page. Audit doc text confirms "same designer" test passes (or iterations documented if not first-pass).
12. **Anti-pattern audit:** no default Recharts colours, no bordered-cell tables, no weak active states, no grey-on-grey badges. Audit doc enumerates check results.
13. **Rule 11 alignment:** left-edge coordinates pasted for primary/secondary/tertiary/body at 1920. All within 2px.
14. **1440×900 graceful scale-down** verified across all changed pages.
15. **No regression on portfolio chapter.** Screenshot.
16. **STATUS.md** start/end entries per Part. Audit doc complete with all screenshots embedded.
17. **Brief archived** to `archive/21_site_chapter_upgrade_COMPLETED.md`. `current.md` repointed.
18. **Known issues logged.** Specifically: Carbon / Water / Waste tabs untouched (out of scope). Site map view is placeholder. Plot-mapping for Luke's data deferred. Per-meter detail drill-down deferred.

---

## One last thing

Re-read **THE VISUAL QUALITY BAR** section before starting Part 5, and again before Part 6. The brief is being executed because the current state is not good enough. Bring genuine craft to it. If something looks bad after the first attempt, that's normal — iterate. Push until it looks like the same designer made the portfolio Sankey AND every component on this page.

Chris's exact words: *"pretend you're a graphic designer and you're making this look as amazing as possible, but you want to really impress your client."*

That's the bar. Hit it.
