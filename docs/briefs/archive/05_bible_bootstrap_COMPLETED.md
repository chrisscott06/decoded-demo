# Brief 5 — Bible bootstrap + Meters tab + Comparisons fix + Site Detail narrative strip

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. First brief on IVG ESG Tool to follow the NZA Development Bible.
**Date opened:** 2026-05-22
**Target outcome:** The IVG ESG Tool repo adopts NZA's brief discipline (active/archive/current.md lifecycle, CLAUDE.md updated with Process Rules 7+8, briefs no longer gitignored). Phase 1B's 18 local commits land on `main` via Vercel. The Site Detail's MPANs sub-tab becomes a richer "Meters" sub-tab covering electricity + gas + water. The Comparisons monthly chart renders fully (X-axis labels visible). Site Detail Overview gains a four-line data quality narrative strip below the metric tiles.

After this brief lands: every subsequent IVG brief follows the same structure as PABLO/NZA-Sim briefs, with reconciliation at session start, brief-on-disk as Part 1's first commit, and walkthrough verification before close. Phase 1B is on the live Vercel URL for Chris to walk through with Rob/Jez/Laura. The Meters tab tells the full meter story (electricity MPANs + gas MPRNs + water meters with rich `key_gaps` narrative). The Comparisons chart is no longer embarrassing.

---

## BEFORE DOING ANYTHING

0. **Session-start reconciliation pass.** This is the first IVG brief to require this — `docs/briefs/` is still in `.gitignore` at the time this brief is delivered, and `docs/briefs/active/` does not yet exist. So the reconciliation pass for Brief 5 is:
   - `git status --short` — confirm clean working tree
   - `git log --oneline -20` — confirm Phase 1A + Phase 1B commits as expected
   - `git branch -a` — confirm on `main`
   - `ls docs/briefs/` — confirm the brief files exist locally (gitignored)
   - Confirm `MAP_MODULE_HANDOFF.md` and `LOAD_INSPECTOR_HANDOFF.md` are present at `docs/briefs/`
1. Read this entire brief end-to-end.
2. Read `CLAUDE.md` end-to-end. The current CLAUDE.md predates the bible discipline — it gets updated in Part 1. Read what's there before changing it.
3. Read `STATUS.md` to understand Phase 1B's end state.
4. Read the NZA Development Bible: https://www.notion.so/32dd645e05cc813b881edd454053e238 — particularly the **How a feature gets built** section, **Brief sync — Claude Code owns it** (Rules 1-6), **Verification disciplines**, and **Claude Code rules**.
5. Read the live state by booting the dev server:
   - `cd eir && npm run dev`
   - Visit `http://localhost:5173/` and the three sections at root level
   - Visit `http://localhost:5173/site/austin-heath/mpans` (the sub-tab being renamed in Part 3)
   - Visit `http://localhost:5173/portfolio/comparisons` (the broken chart in Part 4)
   - Take a baseline screenshot of the Comparisons chart so Part 4's "fixed" state can be compared.
6. Read the existing source for the work being modified:
   - `eir/src/App.jsx` — the bulk of the page logic (was 652 lines after Phase 1A; will be larger now)
   - `eir/src/components/MetricTile.jsx`, `DataStatusBadge.jsx`
   - `pipeline/dist/eir/water.json` — read one or two site entries to confirm field names (`consumption_m3`, `meters_known`, `data_quality`, `key_gaps`, etc.)
   - `pipeline/dist/eir/waste.json` — confirm field names (`tonnage_total`, `tonnage_by_stream`, `contractor`, `data_status`, `notes`)
   - `pipeline/dist/eir/mpan_register.json` — to confirm gas MPRNs are queryable with `type: 'Gas'`
7. Confirm `origin/main` is in sync after Part 2 push (Part 2 is the push itself). Before Part 3 starts, re-confirm `git status --short` is clean.
8. **Part 1's first commit must include this brief file landed at ****`docs/briefs/active/05_bible_bootstrap.md`** per Process Rule 7. The `.gitignore` update happens in the same commit.
9. Do not begin Part 2 until checks 0-8 pass.

---

## Scope statement

This brief is **infrastructure + small fixes**, not new feature work. It establishes the bible discipline on the IVG ESG Tool repo (Parts 1-2) and then does three small, well-defined fixes (Parts 3-5).

In scope:
- `.gitignore` removal of `docs/briefs/` line so brief files become committed history
- New directory structure: `docs/briefs/active/`, `docs/briefs/archive/`, `docs/briefs/current.md`
- Migration of existing briefs (Phase 0, 1A, 1B, quick-wins draft, handoff docs) into the new structure
- `CLAUDE.md` update to add Process Rules 7+8 and reference the Development Bible
- Push Phase 1B's 18 local commits to `main` (Vercel auto-deploys)
- Rename Site Detail "MPANs" sub-tab → "Meters", restructure content to cover electricity MPANs + gas MPRNs + water meters
- Fix Comparisons monthly chart Y-axis spacing and X-axis label clipping
- Add data quality narrative strip below the 4 metric tiles on Site Detail > Overview

Out of scope:
- Map module port (Brief 6, awaiting Notion design note approval)
- Landing infographic redesign (Brief 6)
- Site Detail Energy sub-tab Monthly/Half-hourly toggle (Brief 6)
- Sites table redesign (later brief)
- GRESB Readiness real build (Sunday)
- Sycous resident energy chart integration (deferred, data limitations)
- PABLO Load Inspector port (separate brief once Brief 6 lands)

No data model changes. No pipeline changes. No new dependencies.

---

## Operational mode — plough through

Authorisation up-front. No per-Part sign-off. Walkthrough sign-off after Part 6 before close. Stop and escalate only for the conditions in "When to escalate" below. Final report at end of Part 7.

---

## Principles

1. **No code changes before the infrastructure is in place.** Parts 1 (bible bootstrap) and 2 (push Phase 1B) must succeed before Parts 3-5 (the actual fixes). If Part 1 or 2 fails, stop.
2. **Brief-on-disk discipline starts now.** This brief's Part 1 includes landing the brief file at `docs/briefs/active/05_bible_bootstrap.md`. Every future IVG brief follows the same pattern.
3. **Reuse existing components.** The Meters tab restructure uses the existing `DataStatusBadge` and the existing MPAN table conventions. No new components.
4. **Falsifiability for fixes.** Each fix has an explicit, observable acceptance criterion (X-axis labels visible at viewport 1440×900; Austin Heath water tile shows specific text).
5. **Browser verification mandatory at Part 6 walkthrough.** Code-side reasoning has missed UX-layer bugs throughout this project (the Phase 1B comparisons bug being the canonical case). Boot the dev server, click the things, document the results.
6. **Documentation hygiene per Process Rule 7.** Each Part's commit includes STATUS.md update and (where appropriate) audit-doc update. Brief file lives in `active/` as Part 1's first commit; moves to `archive/` in Part 7's close.
7. **No quiet scope expansion.** If a Part surfaces a new issue, log it in `STATUS.md` under "Known issues" and continue. Do not absorb new work into this brief.

---

## Parts

### Part 1 — Bible bootstrap (docs/briefs/ structure + .gitignore + CLAUDE.md update)

**Goal:** The IVG ESG Tool repo adopts NZA's brief discipline. Brief files are committed (not gitignored). `docs/briefs/active/`, `docs/briefs/archive/`, and `docs/briefs/current.md` exist. `CLAUDE.md` is updated to reference the Bible and adds Process Rules 7+8 (brief sync + session-start reconciliation).

**Files touched:**
- `.gitignore` — remove the `docs/briefs/` line
- `docs/briefs/active/` (new directory) — Brief 5 lands here
- `docs/briefs/archive/` (new directory) — previous briefs land here
- `docs/briefs/current.md` (new file) — pointer to the active brief
- `docs/briefs/active/05_bible_bootstrap.md` — this brief
- `docs/briefs/archive/00_phase_0.md`, `01_phase_1a.md`, `02_phase_1b.md`, `03_phase_1a_update.md`, `04_quick_wins_DRAFT_SUPERSEDED.md` — the previous briefs (migrated from `docs/briefs/` local-only files, renamed with brief numbers)
- `docs/briefs/MAP_MODULE_HANDOFF.md` and `docs/briefs/LOAD_INSPECTOR_HANDOFF.md` — handoff documents stay at top of `docs/briefs/` (not in active/ or archive/, since they're reference material, not briefs themselves)
- `CLAUDE.md` — appended with Process Rule 7 (Documentation hygiene + brief-on-disk) and Process Rule 8 (Session-start reconciliation pass), plus a top-of-file reference to the Bible URL

**Steps:**

1.1 **`.gitignore` cleanup.** Open `.gitignore`. Find the line that gitignores `docs/briefs/` (or `docs/briefs/*` or similar). Delete that line. Stage the change.

1.2 **Create the directory structure.**
```bash
mkdir -p docs/briefs/active docs/briefs/archive
```

1.3 **Migrate existing briefs into archive.** The local-only briefs sitting in `docs/briefs/` get renamed and moved:
- `phase-0-overnight-brief.md` → `docs/briefs/archive/00_phase_0.md`
- `phase-1a-overnight-brief.md` → `docs/briefs/archive/01_phase_1a.md`
- `phase-1a-brief-update.md` → `docs/briefs/archive/03_phase_1a_update.md`
- `phase-1b-overnight-brief.md` → `docs/briefs/archive/02_phase_1b.md`
- `phase-1b-quick-wins.md` → `docs/briefs/archive/04_quick_wins_DRAFT_SUPERSEDED.md` (this was draft work that's now folded into Brief 5)
- `chunk-10-polish-brief.md` → `docs/briefs/archive/00b_chunk_10_polish.md`
- Any other briefs sitting at the top of `docs/briefs/` (besides MAP_MODULE_HANDOFF.md and LOAD_INSPECTOR_HANDOFF.md) → `archive/` with sensible numbers
- `docs/briefs/visual-references/` (the 5 NZA screenshot PNGs) stays where it is — reference material

If any brief file doesn't exist locally (because it never landed on disk in earlier sessions), skip it and note in STATUS.md.

1.4 **Land this brief.** This Brief 5 markdown file gets saved at `docs/briefs/active/05_bible_bootstrap.md`. If Chris delivered the brief via Downloads, Claude Code copies the file content into the canonical path here.

1.5 **Create `docs/briefs/current.md`.** A one-line pointer:
```markdown
# Current active brief

[Brief 5 — Bible bootstrap + Meters tab + Comparisons fix + Site Detail narrative strip](active/05_bible_bootstrap.md)

Last updated: 2026-05-22 (Brief 5 active)
```

1.6 **Update CLAUDE.md.**

At the top of `CLAUDE.md`, add a reference block:
```markdown
> **Development discipline:** This project follows the NZA Development Bible at https://www.notion.so/32dd645e05cc813b881edd454053e238.
> Every session: read this CLAUDE.md, then STATUS.md, then the active brief at `docs/briefs/active/`, then run the reconciliation pass below.
```

At the bottom of `CLAUDE.md`, under a new heading "## Process rules", add:

```markdown
## Process rules

### Rule 7 — Documentation hygiene (brief-on-disk)
Every brief delivered to Claude Code is landed at `docs/briefs/active/<NN>_<name>.md` as Part 1's first commit. Downloads is delivery only; `docs/briefs/active/` is canonical. When a brief closes, `git mv` it to `docs/briefs/archive/<NN>_<name>_COMPLETED.md` and update `docs/briefs/current.md` to point to the next active brief (or empty state). Audit docs follow the same pattern at `docs/audit/<NN>_<topic>.md`.

If Claude Code finds itself reasoning from a brief that cannot be pointed to as a file in `docs/briefs/active/`, it must stop and ask Chris which brief is canonical. Never proceed from a remembered brief.

### Rule 8 — Session-start reconciliation pass
At the start of every session, before any code change, run:
- `ls docs/briefs/active/`
- `cat docs/briefs/current.md`
- `tail STATUS.md`
- `git log --oneline -20`

Cross-check that `active/` matches `current.md` matches the most recent close commit. If anything is stale, the first commit of the session is the cleanup commit. If `active/` contains a different brief than expected, or `current.md` claims a different active brief, stop and surface to Chris before any work begins.

### Rule 9 — Browser verification at walkthrough
Every brief mandates browser verification at the walkthrough Part. Boot the dev server, load the target views, capture findings with specific numerical evidence or screenshots. Code-side reasoning has missed UX-layer bugs throughout the project — the Phase 1B Comparisons chart Y-axis bug is the canonical case where chunk 19 QA passed code-side but the chart was clipped in the browser.
```

If `CLAUDE.md` already has Module Scopes or other sections, leave them untouched. Just add the top reference block and the Process rules section.

1.7 **STATUS.md update.** Append a Brief 5 entry:
```markdown
## Brief 5 — Bible bootstrap (in progress)

Part 1 complete: docs/briefs/ structure established, .gitignore updated, CLAUDE.md amended with Process Rules 7, 8, 9. Brief 5 landed at docs/briefs/active/05_bible_bootstrap.md.

Previous briefs migrated to docs/briefs/archive/ with brief numbers prefixed.
```

**Commit:**
```
Brief 5 Part 1: Bible bootstrap — briefs lifecycle + CLAUDE.md update

- docs/briefs/active/ + docs/briefs/archive/ + current.md established
- .gitignore: docs/briefs/ removed; briefs are now committed history
- Existing briefs migrated to archive/ with NN_ prefixes
- CLAUDE.md gains Process Rules 7 (brief-on-disk), 8 (session
  reconciliation), 9 (browser verification at walkthrough), plus a
  top-of-file reference to the NZA Development Bible
- Brief 5 landed at docs/briefs/active/05_bible_bootstrap.md

This is the first IVG ESG Tool brief to follow the bible discipline.
```

---

### Part 2 — Push Phase 1B to main

**Goal:** Phase 1B's 18 local commits land on `origin/main`. Vercel auto-deploys. Live URL reflects Phase 1B state. Chris can walk through it with IVG in the demo tomorrow.

**Files touched:**
- None directly. This Part is a `git push` plus verification.

**Steps:**

2.1 **Pre-push check.** Confirm:
- `git status --short` is clean (Part 1 was committed)
- `git log --oneline origin/main..HEAD` lists the Phase 1B chunks + Part 1's commit
- Vercel deployment for the current `main` is in healthy state at https://ivg-esg-tool.vercel.app/ (it shows Phase 1A)

2.2 **Push.**
```bash
git push origin main
```

2.3 **Verify Vercel deployment.** Wait for the auto-deploy to complete (~60-90 seconds). Then:
- Visit https://ivg-esg-tool.vercel.app/ — confirm it shows the Phase 1B 4-quadrant infographic (not the Phase 1A site-list landing)
- Visit https://ivg-esg-tool.vercel.app/portfolio/sites — confirm the 4-section top nav (Portfolio | Site | Insights | GRESB) and the Phase 1B sub-tabs
- Visit https://ivg-esg-tool.vercel.app/insights/data-quality — confirm the 13×4 heatmap with the RFI panel
- Visit https://ivg-esg-tool.vercel.app/gresb — confirm the GRESB stub page

If any of these fail to load or show Phase 1A content instead of Phase 1B, **stop and escalate** — this is a deploy issue not a code issue.

2.4 **STATUS.md update.** Append:
```markdown
Part 2 complete: Phase 1B pushed and verified live on Vercel.
Live URL: https://ivg-esg-tool.vercel.app/
```

**Commit:**
```
Brief 5 Part 2: STATUS.md — Phase 1B verified live on Vercel

No code change. Part 2 was the git push and deploy verification.
```

(Note: Part 2's "work" is the push itself. The commit is just the STATUS.md update marking it done.)

---

### Part 3 — Site Detail "MPANs" tab → "Meters" tab

**Goal:** The Site Detail sub-tab labelled "MPANs" becomes "Meters" and shows all three types of meters: electricity MPANs (existing content), gas MPRNs (new section), and water meters with rich `key_gaps` narrative (new section).

**Files touched:**
- `eir/src/App.jsx` — the sub-tab label, route alias, and tab content rendering for what's currently the MPANs tab
- (No new component files — keep within existing App.jsx pattern)

**Steps:**

3.1 **Sub-tab rename.** Find the sub-nav config for Site Detail (likely in `App.jsx` somewhere defining `siteSubTabs` or similar). Change the label from "MPANs" to "Meters" and the route from `/site/{id}/mpans` to `/site/{id}/meters`. Keep the old route as an alias that redirects to the new path so existing bookmarks and links still work.

3.2 **Restructure the tab content into three sections.** The new layout:

```
+--------------------------------------------------+
|  ELECTRICITY (MPANs)                            |
|  [Filter pills: All | Landlord | Voids | Inactive]
|  +--------------------------------------+      |
|  | MPAN | Type | Category | CY25 kWh | Months| |
|  | (existing table — no changes)              |
|  +--------------------------------------+      |
+--------------------------------------------------+
|  GAS (MPRNs)                                    |
|  [Filter pills: All | Landlord]                 |
|  +--------------------------------------+      |
|  | MPRN | Category | CY25 kWh | Months  |     |
|  | (new — filtered from mpan_register where  |
|  |  type === 'Gas')                          |
|  +--------------------------------------+      |
|  (Empty state: "No gas supply at this site")  |
+--------------------------------------------------+
|  WATER (Meters)                                 |
|  Header: "{meters_known} meters identified,    |
|           {meters_with_cy2025_data} with CY25" |
|  +--------------------------------------+      |
|  | Field                | Value          |     |
|  | Water company        | Severn Trent   |     |
|  | Retailer             | WaterPlus      |     |
|  | CY25 consumption     | 8,548 m³       |     |
|  | Data quality         | Estimated      |     |
|  | Coverage period      | Feb 25 – Jan 26|     |
|  | Completeness         | 100%           |     |
|  +--------------------------------------+      |
|  KEY GAPS callout (coral left border):         |
|  "All readings estimated by WaterPlus. Cricket |
|  Club meter static (0 m³). No actual reads.    |
|  Cross-charges water to residents (Laura..."   |
+--------------------------------------------------+
```

Three sections stacked vertically, each in its own panel block. Use the existing `Panel` component (or whatever equivalent the existing code has) with the existing dark navy theme.

3.3 **Gas MPRN filtering.** The existing `mpan_register.json` already has a `type` field (`'HH'`, `'NHH'`, `'Gas'`). For each site, filter to entries where `type === 'Gas'` for the new gas section.

3.4 **Water section — empty state handling.** If the site's water.json entry has `meters_known === 0` or null values across the board (e.g. Sonning Common), render: "Water meter inventory pending. Site not yet on water billing or not yet operational."

3.5 **Audit doc.** Create `docs/audit/05_meters_tab.md` documenting:
- The field name mappings used (water: `consumption_m3`, `data_quality`, `key_gaps`; waste fields unused here since waste is on the Carbon tab — note that for Brief 6's planning)
- The empty-state strategy
- The route alias approach for the old `/mpans` path
- Sites with rich vs sparse water data (Great Alne, Gifford Lea, Austin Heath examples)

**PASS criteria:**
- Sub-nav shows "Meters" (not "MPANs") on Site Detail
- Old route `/site/austin-heath/mpans` still loads (alias works)
- Austin Heath: shows 1 HH electricity MPAN + 2 gas MPRNs (~2.5 GWh) + 3 water meters with "Never billed since 2016" narrative in the gaps callout
- Millfield Green: shows 1 electricity MPAN + 0 gas MPRNs (empty state "No gas supply at this site") + water info
- Sonning Common: handles sparse data with empty states across all three sections
- No browser console errors

**Commit:**
```
Brief 5 Part 3: Site Detail Meters tab — electricity + gas + water

- Sub-tab renamed MPANs → Meters; route /site/{id}/mpans aliased to
  /site/{id}/meters so existing links continue to work.
- Tab content restructured into three stacked panels:
  ELECTRICITY (existing MPAN table) → GAS (new MPRN table) →
  WATER (new info card + key_gaps narrative callout).
- Water section uses existing water.json fields: consumption_m3,
  data_quality, key_gaps, meters_known, cy2025_coverage, completeness.
- Gas section filters mpan_register.json to type === 'Gas'.
- Empty states honest: "No gas supply at this site" / "Water meter
  inventory pending" where appropriate.
- Audit doc at docs/audit/05_meters_tab.md.

No data model changes. No new components.
```

---

### Part 4 — Comparisons chart fix

**Goal:** The monthly consumption comparison chart at the bottom of Portfolio > Comparisons renders fully — Y-axis labels at sensible values, X-axis month labels visible (currently clipped off-screen).

**Files touched:**
- `eir/src/App.jsx` — the Comparisons section's chart configuration
- Possibly `eir/src/index.css` — if the surrounding panel CSS needs adjusting

**Steps:**

4.1 **Diagnose first.** Per Bible's "Diagnose before you fix" rule:
- Open `localhost:5173/portfolio/comparisons` in browser
- Open DevTools, inspect the chart container
- Note: actual Y-axis domain (e.g. 0 to 800k), actual chart height in px, actual viewport height
- Identify why X-axis is off-screen — is the chart taller than its container, is the parent panel `overflow: hidden`, is Recharts using auto-domain that wastes vertical space?

Document findings briefly in `docs/audit/05_meters_tab.md` (append a "Comparisons chart diagnosis" section).

4.2 **Apply the fix.** Likely fix based on Claude Chat's read of Phase 1B code (verify with diagnosis):
- Wrap the ResponsiveContainer in a flex container with `flex: 1, minHeight: 0` so it doesn't push beyond viewport
- Set Recharts `<YAxis>` `domain={[0, 'dataMax']}` to remove excess range
- Add `tickCount={5}` to limit Y-axis ticks
- Add `<XAxis>` `angle={-45} textAnchor="end" height={60}` to make month labels render at angle without being clipped
- Set chart `margin={{top: 20, right: 30, left: 20, bottom: 40}}` to give X-axis labels room

Specific Recharts pattern (to reference, not copy verbatim):
```jsx
<div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={monthlyData} margin={{top: 20, right: 30, left: 20, bottom: 40}}>
      <XAxis dataKey="month" tick={{fill: 'var(--text-muted-on-dark)', fontSize: 12}}
             angle={-45} textAnchor="end" height={60} />
      <YAxis tick={{fill: 'var(--text-muted-on-dark)', fontSize: 12}}
             tickCount={5} domain={[0, 'dataMax']}
             tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
      <Tooltip />
      {selectedSites.map(siteId => (
        <Bar key={siteId} dataKey={siteId} fill={getSiteColor(siteId)} />
      ))}
    </BarChart>
  </ResponsiveContainer>
</div>
```

4.3 **Browser-verify the fix.** Per Bible's "Browser verification mandatory" rule:
- Boot dev server
- Resize browser to 1440×900 (the demo target resolution)
- Visit `/portfolio/comparisons`
- Take a screenshot
- Confirm: Y-axis labels at 5 reasonable values (e.g. 0, 200k, 400k, 600k, 800k), X-axis labels "Oct 24" through "Dec 25" all visible at the bottom of the chart, no clipping
- Also test at 1366×768 (smaller laptop) and confirm it still works

4.4 **STATUS.md update.** Append:
```markdown
Part 4 complete: Comparisons chart now renders fully at 1366, 1440,
1920 viewports. Browser-verified with screenshot.
```

**PASS criteria:**
- Chart fully visible at 1440×900 — both Y-axis and X-axis labels on screen
- Y-axis shows 4-6 ticks at sensible round numbers
- X-axis month labels readable at angle, no clipping
- Verified by opening localhost in browser — not just code inference (the Bible's lesson from Phase 1B)

**Commit:**
```
Brief 5 Part 4: Comparisons chart — fix Y-axis spacing + X-axis clipping

- Chart container now uses flex: 1, minHeight: 0 so it fits viewport
- YAxis: domain=[0, 'dataMax'], tickCount=5 — removes excess range
- XAxis: angle=-45, textAnchor='end', height=60 — labels render
  without being clipped at the chart bottom
- BarChart margin increased to give X-axis labels room
- Browser-verified at 1366×768, 1440×900, 1920×1080

Audit doc updated with diagnosis findings.
```

---

### Part 5 — Site Detail Overview narrative strip

**Goal:** Below the 4 metric tiles on Site Detail > Overview, a four-line "data quality narrative" strip surfaces the rich underlying detail (water completeness, waste contractor, gas presence, electricity months covered) without expanding the tiles themselves.

**Files touched:**
- `eir/src/App.jsx` — the Site Detail Overview sub-tab rendering

**Steps:**

5.1 **Strip layout.** Below the 2x2 metric tiles, full-width:

```
+--------------------------------------------------+
|  DATA QUALITY OVERVIEW                          |
|  • Electricity: {n} MPAN(s), {months} months,    |
|    Ecotricity billing                            |
|  • Gas: {n} MPRN(s), {months} months  OR        |
|    "No gas supply at this site"                  |
|  • Water: {meters_known} meters, {data_quality}, |
|    {completeness} complete                       |
|  • Waste: {contractor}, {tonnage} t  OR          |
|    "Tonnages not yet tracked"                    |
+--------------------------------------------------+
```

Each line has a small status dot (green/amber/red/grey) matching the status of that metric.

5.2 **Field mappings (reference Brief 5's earlier findings):**

For Austin Heath:
- Electricity: "1 MPAN, 12 months, Ecotricity billing" + green dot
- Gas: "2 MPRNs, 12 months" + green dot
- Water: "3 meters, None, 0% complete" + red dot
- Waste: "BIFFA, tonnages not tracked" + amber dot

For Gifford Lea:
- Electricity: "2 MPANs, 12 months, Ecotricity billing" + green dot
- Gas: "1 MPRN, 12 months" + green dot
- Water: "2 meters, Estimated, 100% complete" + amber dot
- Waste: "Ash Waste, ~32 t (partial)" + amber dot

For Sonning Common:
- Electricity: "Meter inventory pending" + red dot
- Gas: "No gas supply at this site" + grey dot
- Water: "Meter inventory pending" + red dot
- Waste: "BIFFA, 0.1 t" + green dot

5.3 **Implementation.** Read from `electricity_monthly.json` for MPAN count + months; from `mpan_register.json` filtered to Gas for MPRN count; from `water.json` for meters_known + data_quality + completeness; from `waste.json` for contractor + tonnage_total.

5.4 **Styling.** Inter 13px, muted text colour on the labels, slightly brighter on the values. Coloured dot (8px diameter, rounded) at the start of each line.

**PASS criteria:**
- Austin Heath Site Detail Overview shows the 4-line narrative strip below the 2x2 tiles
- Each line has the correct coloured dot per the status
- Values match the underlying JSON data (no hardcoded fallbacks)
- Three sites tested (Austin Heath / Gifford Lea / Sonning Common) and all render sensibly

**Commit:**
```
Brief 5 Part 5: Site Detail Overview — data quality narrative strip

- Below the 2x2 metric tiles, a four-line narrative strip surfaces
  data quality detail per metric (Electricity, Gas, Water, Waste).
- Reads from existing JSON files (no new pipeline work):
  electricity_monthly.json, mpan_register.json (filtered to Gas),
  water.json (meters_known, data_quality, completeness),
  waste.json (contractor, tonnage_total).
- Each line prefixed with a small coloured dot matching the metric
  status (green/amber/red/grey).
- Empty states honest: "No gas supply at this site",
  "Meter inventory pending", "Tonnages not yet tracked".

No new components. No data model changes.
```

---

### Part 6 — Walkthrough + close

**Goal:** Chris's walkthrough confirms Brief 5 lands. Brief 5 moves to archive/. STATUS.md final.

**Files touched:**
- `docs/audit/05_meters_tab.md` — append "Part 6 walkthrough"
- `docs/briefs/active/05_bible_bootstrap.md` → `docs/briefs/archive/05_bible_bootstrap_COMPLETED.md`
- `docs/briefs/current.md` — repointed (empty or to next brief)
- `STATUS.md` — close-out entry

**Walkthrough checklist Chris runs (10 items):**

1. `ls docs/briefs/active/` — only Brief 5 is there (about to be archived). `ls docs/briefs/archive/` — Phase 0, 1A, 1B, etc. all present with NN_ prefixes.
2. `cat docs/briefs/current.md` — points to Brief 5 (or empty if archived already).
3. `cat CLAUDE.md | tail -30` — Process Rules 7, 8, 9 are present.
4. Open https://ivg-esg-tool.vercel.app/ on a clean browser — confirm Phase 1B is live (4-quadrant infographic, 4-section nav).
5. Open `/portfolio/comparisons` on the live URL. Select two sites. Confirm the monthly comparison chart renders fully with Y-axis and X-axis labels both visible.
6. Open `/site/austin-heath/meters` — confirm three sections: Electricity (1 MPAN), Gas (2 MPRNs), Water (3 meters + "Never billed since 2016" narrative in the gaps callout).
7. Open `/site/austin-heath/mpans` (the old URL) — confirm it redirects or aliases to `/meters`.
8. Open `/site/millfield-green/meters` — confirm gas section shows "No gas supply at this site" empty state.
9. Open `/site/austin-heath/overview` — confirm the 4-line data quality narrative strip below the 2x2 metric tiles, with coloured dots per metric.
10. Open `/site/sonning-common/overview` — confirm the narrative strip handles sparse data gracefully (electricity and water as "pending", waste shows BIFFA).

Pass → Part 6 close. Fail → log to STATUS.md, diagnose, fix in follow-up commit, re-verify.

**Final report fields:**

1. New `origin/main` HEAD SHA
2. Brief 5 archived to `docs/briefs/archive/05_bible_bootstrap_COMPLETED.md`
3. `docs/briefs/current.md` state (empty or pointed at Brief 6 placeholder)
4. CLAUDE.md Process Rules 7, 8, 9 confirmed present (line numbers)
5. Vercel deployment SHA for Phase 1B-on-main (from Vercel dashboard)
6. Comparisons chart screenshot at 1440×900 (capture and store at `docs/audit/05_meters_tab_comparison_after.png`)
7. Meters tab screenshot for Austin Heath at 1440×900 (`docs/audit/05_meters_tab_austin_heath.png`)
8. Three sample sites' narrative strips verified (Austin Heath / Gifford Lea / Sonning Common)
9. Any new issues logged in STATUS.md under "Known issues"
10. `docs/briefs/active/` confirmed empty (or only containing the next brief if Brief 6 is delivered before close)

**Commit:**
```
Brief 5 close: Bible bootstrap + Meters tab + Comparisons fix + narrative strip live

Bible discipline now active on IVG ESG Tool. Phase 1B live on Vercel.
Site Detail Meters tab covers electricity, gas, water. Comparisons
chart renders fully. Site Detail Overview gains a data quality
narrative strip surfacing the rich underlying detail without
expanding the tiles.

Brief 5 archived. STATUS.md updated. CLAUDE.md gains Process Rules
7, 8, 9. Next active brief: TBC (Brief 6 likely — map module port).

No data model changes. No new dependencies. No pipeline changes.
```

---

## What MUST NOT happen in Brief 5

- No code changes before Part 1 (bible bootstrap) is committed
- No push to main before Part 2's pre-push check passes
- No map module changes (Brief 6 scope)
- No landing infographic changes (Brief 6 scope)
- No new dependencies (`framer-motion` is Brief 6's scope, not this one)
- No data model changes
- No pipeline changes
- No new component files (Parts 3-5 work within existing `App.jsx` patterns)
- No skipping browser verification at Part 6
- No expanding scope to absorb new issues — log to STATUS.md and continue
- No partial commits — each Part is one commit including STATUS.md + audit doc updates

---

## When to escalate

Pause and surface to Chris if:
- The `.gitignore` removal of `docs/briefs/` triggers any unexpected side effects (e.g. existing brief files don't match what's expected)
- Phase 1B push fails or Vercel deploy doesn't pick it up
- Vercel-deployed Phase 1B looks different from local Phase 1B (cache, routing, or environment-variable issue)
- The Comparisons chart diagnosis surfaces a deeper layout issue affecting other pages (not just Comparisons)
- Field name mismatches in water.json or waste.json contradict the brief's spec (the brief was written based on field names verified in advance; if reality differs, surface immediately)
- Any walkthrough item fails in a way that suggests an architectural issue not just a small fix
- 15 continuous minutes blocked on a single issue per the stuck rule

---

## Notes for Claude Code

Pattern matches PABLO Brief 45's structure and the NZA Development Bible's discipline:

- Read everything before starting (BEFORE-DOING-ANYTHING checklist mandatory)
- Each Part one commit, with STATUS.md + audit doc in same commit
- Browser verification mandatory at Part 6
- This is the FIRST IVG ESG Tool brief to follow this pattern — get the lifecycle right, future briefs will inherit
- If polish work surfaces a real bug elsewhere, log it in STATUS.md under "Known issues" and continue without fixing here
- The handoff documents (MAP_MODULE_HANDOFF.md, LOAD_INSPECTOR_HANDOFF.md) are reference material — don't touch them, they get used in Brief 6 and beyond

Standing by for authorisation to begin Part 1.
