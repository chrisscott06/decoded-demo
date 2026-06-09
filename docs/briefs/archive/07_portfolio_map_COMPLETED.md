# Brief 7 — Portfolio Map module (EOC leaderboard map ported to IVG)

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Single-workstream brief — the deferred Part 4 of Brief 6, now standalone so it actually finishes.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no Chris checkpoints mid-flight. Chris runs the walkthrough on completion.

---

## Why this is its own brief

Brief 6 bundled the map with the Load Inspector and the design system, and predictably ran out of road — both big visual pieces got deferred. Per the NZA Development Bible's own guidance ("700+ lines signals scope that wants splitting"), the map and the Load Inspector are now separate briefs that each fit a single session. This is Brief 7: **the map only.** The Load Inspector is Brief 8.

The design system foundation Brief 6 *did* land (tokens, Stolzl, two-bar nav, cream/dark register, page narratives) is the platform this builds on. The map's leaderboard and dots use the real NZA tokens, not approximations.

---

## Target outcome

The placeholder at `/portfolio/map` becomes the live leaderboard-driven multi-theme map per `docs/briefs/MAP_MODULE_HANDOFF.md` and the design note. 13 live IVG sites (plus dev sites if present in data) positioned on the dotted UK SVG. Six themes (Overview, Energy, Water, Waste, Carbon, Data quality) each re-sort the leaderboard and re-colour/re-size the map dots. Total / Per Unit / Per m² toggle per theme. Hover cross-talk between leaderboard rows and map dots. Click a row or dot to drill into Site Detail. Compact portfolio totals strip below the map.

After this brief lands the IVG demo has its headline interactive feature: an estate map that tells the energy / water / waste / carbon / data-quality story at a glance and drills into any site.

---

## Reference documents — read at session start

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **IVG Map module + landing architecture (design note)** — https://www.notion.so/367d645e05cc8104b18fd8011d79200a — decisions D1-D9 are what this brief implements
3. **`docs/briefs/MAP_MODULE_HANDOFF.md`** — 855 lines, full EOC source pasted inline. Sections 3 (leaderboard), 4 (map component), 5 (view switching), 7 (animations), 9 (gotchas), 10 (port strategy), 11 (IVG theme adaptation) are essential
4. **`nzai-demo` repo** — read-only reference for token usage patterns. Never modify.
5. This brief at `docs/briefs/active/07_portfolio_map.md`

---

## BEFORE DOING ANYTHING

0. **Reconciliation pass** (Process Rule 8):
   - `ls docs/briefs/active/` — empty (Brief 6 archived); will hold Brief 7
   - `cat docs/briefs/current.md` — confirms Brief 6 was last
   - `tail -30 STATUS.md` — confirms Brief 6 close + the known issues it logged
   - `git log --oneline -10` — last commit should be `378a7c4` (Brief 6 close) or later
   - `git status --short` — clean working tree

0.5 **Land this brief** at `docs/briefs/active/07_portfolio_map.md`. Update `current.md` to point to Brief 7. Quote the title + Target outcome back to Chris (Bible Rule 1). Commit:
```
Brief 7 land: Portfolio Map module at active/07_portfolio_map.md

Standalone map brief — the deferred Part 4 of Brief 6. Single workstream.
```

1. **Read all reference docs.** The handoff is dense; internalise Sections 3, 4, 5 before Part 2.

2. **Confirm the SVG** at `eir/public/maps/uk-dotted-map.svg`. ViewBox is `0 0 1409.97 2548.17` (portrait). It renders as an `<img>` so no parsing needed.

3. **Confirm the data files** the themes read:
   - `pipeline/dist/eir/portfolio.json` (totals strip)
   - `pipeline/dist/eir/sites.json` (identity: units, GIA, heating, grid type)
   - `pipeline/dist/eir/energy.json` (electricity + gas kWh)
   - `pipeline/dist/eir/water.json` (consumption_m3, data_status)
   - `pipeline/dist/eir/waste.json` (tonnage_total, diversion_rate, data_status)
   - `pipeline/dist/eir/carbon.json` (scope breakdown, intensities)
   - `pipeline/site_coordinates.json` (lat/lon per site)
   Read one entry from each to confirm field names before wiring accessors in Part 2.

4. Begin Part 0 (housekeeping), then Parts 1-5.

---

## Scope statement

In scope:
- Part 0 — housekeeping: remove the leftover Google Fonts CDN refs from `eir/index.html` (Brief 6 left 2); opportunistically delete legacy CSS aliases that are now unused
- Part 1 — projection + theme config (`projection.js`, `mapThemes.js`)
- Part 2 — Leaderboard component
- Part 3 — MapMarkers component (dotted SVG + pulsing dots + hover/click)
- Part 4 — SiteHoverCard + TotalsStrip + PortfolioMap top-level wiring; replace the placeholder
- Part 5 — walkthrough + close

Out of scope (log to STATUS.md "Known issues", do not absorb):
- Load Inspector / half-hourly (Brief 8)
- The half-hourly reader data bug (Brief 8 — the JSONs are built from placeholder data; see "Known issues from Brief 6 review" below)
- Sites table redesign
- GRESB real build
- font-size→type-scale sweep (Brief 6 Part 2 deferred debt — separate cleanup)
- framer-motion is OPTIONAL: add to package.json, but ship the CSS-keyframe fallback as the default so the brief doesn't block on npm install

No pipeline changes. No data model changes. No new emission factors.

---

## Known issues inherited from the Brief 6 review (for context, NOT for fixing here)

Claude Chat's code review of Brief 6 surfaced these. They are logged so this brief doesn't trip over them — **do not fix them in Brief 7**:

1. **The half-hourly JSONs are built from placeholder data, not the real Stark exports.** The reader still reads `row[1]` (2-column assumption) and hard-codes `start_date = "2025-01-01"`. The real Stark CSVs are 3-column (`Date, Time, Value`), 32,505 rows, April 2024–Feb 2026. Brief 8 fixes the reader before building the Load Inspector. Brief 7 does not touch the reader or the HH data.

2. **76 legacy CSS aliases remain in `eir/src/index.css`.** Part 0 of this brief can opportunistically delete the ones that are now unused (verify with grep first), but it's not the focus.

3. **font-size→type-scale sweep deferred.** Not this brief.

---

## Operational mode — plough through

Authorisation up front. No mid-flight Chris checkpoints. Each Part is one commit with STATUS.md + audit-doc updates. Escalate (stop + log to STATUS.md) only for:
- A reference doc missing from disk
- The SVG failing to render as an `<img>` AND the fallback rectangle also failing
- A Part's PASS criteria unmet after 15 min + 3 approaches (Bible "When stuck")
- `npm run build` failing after Part 4

Otherwise keep going. Final report at Part 5.

---

## Principles

1. **Design note wins** on architecture (D1-D9). **Handoff wins** on implementation detail. **nzai-demo wins** on token usage.
2. **Tokens, not raw hex.** The map's colours come from `var(--color-*)` tokens or `eir/src/tokens/chart-colors.js` JS constants. Falsifiability: `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/portfolio --include="*.jsx"` returns 0.
3. **Reuse before rebuild.** The existing `UkMap.jsx` is replaced, not extended — but read it first; its `cos(lat)` projection note and the existing site-list panel markup may be reusable.
4. **Falsifiability per Part.** Explicit PASS criteria each.
5. **Browser verification at Part 5** via MCP browser tools — boot dev server, exercise every theme + toggle + hover + click, screenshot.
6. **No quiet scope expansion.** New issues → STATUS.md "Known issues" → continue.

---

## Parts

### Part 0 — Housekeeping (Google Fonts cleanup + dead alias sweep)

**Goal:** Remove the 2 leftover Google Fonts CDN references in `eir/index.html` that Brief 6 was meant to remove. Opportunistically delete legacy CSS aliases in `index.css` that are provably unused.

**Files touched:** `eir/index.html`, `eir/src/index.css`, `docs/audit/07_portfolio_map.md` (new)

**Steps:**

0.1 Open `eir/index.html`. Remove any `<link>` referencing `fonts.googleapis.com` or `fonts.gstatic.com`. Stolzl loads from `@font-face`; Inter falls back to the system stack. If after removal the body text looks wrong in the smoke test, restore ONLY a single Inter `<link>` (not Playfair).

0.2 For each legacy alias in `index.css` (`--coral`, `--bg-dark`, `--text-on-dark`, `--serif`, `--sans`, `--navy`, `--status-*`, etc.), grep its usage across `eir/src --include="*.jsx" --include="*.css"`. If zero usages outside the alias definition itself, delete the alias. If still used, leave it (a later cleanup brief finishes this). Document which were deleted.

0.3 Smoke test: `npm run dev`, open `/`, confirm no console errors and fonts render.

0.4 Create `docs/audit/07_portfolio_map.md` with Part 0 findings.

**PASS criteria:**
- `grep -c "fonts.googleapis" eir/index.html` returns 0
- Dev server boots clean
- Aliases deleted are recorded in audit doc

**Commit:**
```
Brief 7 Part 0: housekeeping — remove leftover Google Fonts CDN + dead aliases

- eir/index.html: removed the 2 Google Fonts CDN links Brief 6 missed.
  Stolzl from @font-face; Inter from system fallback.
- index.css: deleted legacy aliases with zero remaining usages (list in
  audit doc). Aliases still referenced left in place for a later sweep.

Audit doc at docs/audit/07_portfolio_map.md.
```

---

### Part 1 — Projection + theme config

**Goal:** Two lib files: `projection.js` (site → {x,y} percent on the SVG) and `mapThemes.js` (the six-theme config driving leaderboard + dots).

**Files touched:** `eir/src/lib/projection.js` (new), `eir/src/lib/mapThemes.js` (new), `eir/src/tokens/chart-colors.js` (extend if needed), audit doc

**Steps:**

1.1 **`projection.js`.** The SVG viewBox is `0 0 1409.97 2548.17` (portrait England). Starting positions below were computed from the real lat/lon in `site_coordinates.json` via equirectangular projection with an England bounding box (lat 50.4–53.4, lon -3.8–1.0). These are STARTING points — calibrate against the actual SVG during Part 3 and update.

```js
// Site marker positions as percent of the map box.
// Computed from site_coordinates.json (equirectangular, England bbox).
// CALIBRATE against eir/public/maps/uk-dotted-map.svg during Part 3 and
// update any dot that doesn't sit on its town.
export const SITE_POSITIONS = {
  'austin-heath':         { x: 46.7, y: 37.0 },
  'gifford-lea':          { x: 21.8, y: 8.1 },
  'bramshott-place':      { x: 62.6, y: 77.3 },
  'millbrook-village':    { x: 5.7,  y: 90.6 },
  'durrants-village':     { x: 72.0, y: 77.3 },
  'great-alne-park':      { x: 40.8, y: 39.3 },
  'ledian-gardens':       { x: 92.5, y: 72.7 },
  'elderswell':           { x: 66.8, y: 41.2 },
  'millfield-green':      { x: 69.3, y: 50.8 },
  'ampfield-meadows':     { x: 49.6, y: 79.3 },
  'blendworth-hills':     { x: 57.9, y: 83.0 },
  'sonning-common':       { x: 59.1, y: 62.7 },
  'edwalton-office':      { x: 55.6, y: 16.1 },
  // Dev sites — include only if present in sites.json:
  'edenbridge-dev':       { x: 80.5, y: 73.4 },
  'little-mount-lake-dev':{ x: 84.6, y: 75.6 },
};

export function getMarkerPosition(siteId) {
  return SITE_POSITIONS[siteId] || null;  // null → don't render a dot
}
```

Note Millbrook at x:5.7 y:90.6 (Devon, far south-west) — that's a real outlier; confirm the SVG covers Devon, else clamp or flag.

1.2 **`mapThemes.js`.** Six themes per design note D2 + D3. Use the exact config from Brief 6's Part 4 step 4.2 (it was fully specified there and is reproduced in the design note). Each theme: `id`, `label`, `color` (token), `toggles` array, `metrics` array (each with `key`, `label`, `desc`, `accessor`, `format`, `unit`, `render`, optional `filter`/`intensity`/`categorical`).

Theme accent tokens:
- Overview → `var(--color-categorical-estate)`
- Energy → `var(--color-nza-coral)`
- Water → `var(--color-scope-12)` (teal)
- Waste → `var(--color-categorical-commuting)` (amber)
- Carbon → `var(--color-scope-3)` (purple)
- Data quality → `var(--color-categorical-supply-chain)` (dark teal)

The accessor signature is `(site, energy, water, waste, carbon) => value`. Confirm field names against the real JSONs in BEFORE-DOING-ANYTHING step 3 and adjust accessors to match reality (e.g. if carbon.json uses `total_actual_tco2e` vs `total_tco2e`).

1.3 **chart-colors.js.** If Recharts or inline SVG needs hex values (not CSS vars), add a `MAP_THEME_HEX` export mapping each theme id to its resolved hex, sourced from the same values as the CSS tokens (single source of truth).

1.4 Audit doc: record the theme→accessor→field mappings actually used (after confirming against real JSONs).

**PASS criteria:**
- `projection.js` exports `SITE_POSITIONS` + `getMarkerPosition`
- `mapThemes.js` exports `MAP_CATEGORIES` with 6 themes, each with ≥1 metric
- Accessors reference real field names (verified against JSONs)
- No raw hex in these files except in `chart-colors.js`

**Commit:**
```
Brief 7 Part 1: projection + six-theme config

- projection.js: SITE_POSITIONS for all sites (computed from real lat/lon,
  to be calibrated against the SVG in Part 3). getMarkerPosition() returns
  null for unknown sites so they simply don't render a dot.
- mapThemes.js: MAP_CATEGORIES — Overview / Energy / Water / Waste / Carbon /
  Data quality, per design note D2+D3. Accessors verified against the real
  pipeline JSONs. Toggles (Total / Per Unit / Per m²) declared per theme.
- chart-colors.js: MAP_THEME_HEX for Recharts/SVG consumers needing raw hex.

Audit doc updated with theme→field mapping.
```

---

### Part 2 — Leaderboard component

**Goal:** `Leaderboard.jsx` — rows sorted by the active metric, each with name + bar + value, hover cross-talk, click-to-drill. Per handoff Section 3.

**Files touched:** `eir/src/components/portfolio/Leaderboard.jsx` (new), audit doc

**Steps:**

2.1 Build the component per handoff Section 3's pasted source, adapted to IVG:
- Props: `sites`, `dataByType` (the loaded JSONs), `activeCategory`, `activeMetric`, `toggleMode`, `hoveredSiteId`, `onHoverSite`, `onSelectSite`
- Rows sorted descending by `activeMetric.accessor(...)` value, normalised by `toggleMode` (divide by units for perUnit, by GIA for perM2; skip for `intensity: true` metrics)
- Each row: site name (left, Stolzl Medium `var(--text-sm)`), horizontal bar (middle), formatted value (right, IBM Plex Mono `var(--text-sm)`)
- Bar fill width = value / max(value across visible sites) × 100%
- `render` modes:
  - `'bar'` — single fill in the theme colour
  - `'gridBar'` — fill colour by value (traffic-light: low=risk-low green → high=risk-major red; reversed for "diversion"/"completeness" where high is good)
  - `'stacked'` — segments per breakdown item (Scope 1/2/3 in scope colours)
  - `'icons'` — categorical: a coloured chip per category (heating archetype, grid type)
- Row hover → `onHoverSite(siteId)`; row click → `onSelectSite(siteId)` (navigates to `/site/{id}/overview`)
- `filter` metrics (e.g. Energy>Gas hides all-electric) — apply before sorting
- Reorder animation: framer-motion `layout` prop if available, else CSS `nza-row-shift` keyframe (transition on `transform`)

2.2 Cream vs dark: the map lives on `/portfolio/map` which is DARK register. So the leaderboard renders on dark — text `var(--color-theme-body)`, bars on `rgba(255,255,255,0.06)` tracks.

2.3 Audit doc: record the render-mode handling + normalisation logic.

**PASS criteria:**
- Renders 13 rows (or however many have positions/data), sorted descending
- Switching `activeMetric` re-sorts
- `toggleMode` perUnit/perM2 re-normalises and re-sorts
- gridBar metrics colour by value; stacked metrics show segments
- Hovering a row fires `onHoverSite`; clicking fires `onSelectSite`
- No raw hex

**Commit:**
```
Brief 7 Part 2: Leaderboard component

- Leaderboard.jsx per handoff Section 3, adapted to IVG dark register.
- Rows sorted by active metric, normalised by Total/Per-Unit/Per-m².
- Four render modes: bar, gridBar (traffic-light), stacked (scopes), icons
  (categorical). Filter metrics applied pre-sort.
- Hover → onHoverSite (drives map cross-talk). Click → onSelectSite
  (navigates to Site Detail) per design note D7.
- Reorder via framer-motion layout if present, else CSS nza-row-shift.

Audit doc updated.
```

---

### Part 3 — MapMarkers component (+ calibration)

**Goal:** `MapMarkers.jsx` — the dotted SVG with pulsing, theme-coloured, hover-reactive, clickable dots, geographically calibrated. Per handoff Section 4 + 7.

**Files touched:** `eir/src/components/portfolio/MapMarkers.jsx` (new), `eir/src/lib/projection.js` (calibration update), `eir/src/index.css` (pulse keyframe), audit doc

**Steps:**

3.1 Build per handoff Section 4:
- `<img src="/maps/uk-dotted-map.svg">` at `width: 100%`, `object-fit: contain`, inside a `position: relative` container that preserves the SVG's portrait aspect ratio
- Markers absolutely positioned: `left: {x}%`, `top: {y}%`, `transform: translate(-50%, -50%)`, from `getMarkerPosition(siteId)`
- Inner dot: 12×12px circle, `background: {theme colour}`, `box-shadow` glow
- Pulse halo: separate element, custom CSS keyframe (Tailwind's `animate-ping` isn't available — IVG has no Tailwind):
  ```css
  @keyframes nza-pulse {
    0%   { transform: scale(1);   opacity: 0.5; }
    100% { transform: scale(2.4); opacity: 0;   }
  }
  .nza-pulse { animation: nza-pulse 2s var(--ease-gentle) infinite; }
  ```
- Dot size scales by the active metric value (sqrt scaling per handoff Section 4 — `r = rMin + (rMax-rMin) * sqrt(value/maxValue)`), rMin ~6px, rMax ~22px
- Hover (own hover OR `hoveredSiteId` match from leaderboard): scale inner dot 1.4×, brighten
- Click → `onSelectSite(siteId)`
- `hoveredSiteId` from props drives the cross-talk highlight

3.2 **Calibration.** Boot dev server, render the map, inspect each dot against the SVG outline. For any dot not sitting on its town, adjust its `SITE_POSITIONS` entry. Iterate until all sites land correctly. Record final positions in the audit doc. Per handoff Section 9, watch marker overlap in the south-east cluster (Bramshott / Durrants / Ledian / Edenbridge / Little Mount) — reduce `rMax` or nudge if halos collide.

3.3 Audit doc: final calibrated SITE_POSITIONS table + overlap mitigation notes.

**PASS criteria:**
- SVG renders as background
- All sites with positions show a pulsing dot
- Dots sit on correct geographic locations (calibrated)
- Dot size scales by active metric
- Hover scales the dot; leaderboard-hover highlights the matching dot
- Click navigates to Site Detail
- South-east cluster legible (no fully-overlapping halos)
- No raw hex

**Commit:**
```
Brief 7 Part 3: MapMarkers + geographic calibration

- MapMarkers.jsx per handoff Section 4: dotted SVG as <img>, absolutely
  positioned markers, sqrt dot-size scaling by active metric.
- nza-pulse CSS keyframe (replaces Tailwind animate-ping — no Tailwind in IVG).
- Hover + leaderboard cross-talk highlight; click → Site Detail.
- SITE_POSITIONS calibrated by eye against uk-dotted-map.svg; final table
  in audit doc. South-east cluster overlap mitigated via reduced max radius.

Audit doc updated with calibration record.
```

---

### Part 4 — SiteHoverCard + TotalsStrip + PortfolioMap wiring

**Goal:** The hover preview card, the compact totals strip, and the top-level `PortfolioMap.jsx` that wires leaderboard + map + state together and replaces the placeholder at `/portfolio/map`.

**Files touched:** `eir/src/components/portfolio/SiteHoverCard.jsx` (new), `eir/src/components/portfolio/TotalsStrip.jsx` (new), `eir/src/components/PortfolioMap.jsx` (new), `eir/src/App.jsx` (wire into route, add framer-motion to package.json), `eir/package.json`, audit doc

**Steps:**

4.1 **SiteHoverCard.jsx** — floating card on dot/row hover (design note Q3): site name (Stolzl Medium), units + GIA, total energy (kWh), the active metric's current value, 4 data-quality badges (Elec/Gas/Water/Waste). Positioned near the hovered dot; clamp to viewport edges (handoff Section 9 gotcha).

4.2 **TotalsStrip.jsx** — compact row below the map: `⚡ 4.5M kWh · 🔥 7.6M kWh · 💧 18k m³ · ♻️ 145 t · 3.45k tCO₂e`. Lucide icons (`Zap`, `Flame`, `Droplets`, `Recycle`, `Wind`/`Cloud`). Reads `portfolio.json`. Display-only.

4.3 **PortfolioMap.jsx** — top-level. State: `activeCategoryId` (default `'energy'`), `activeMetricKey` (default first metric of active category), `toggleMode` (default `'total'`), `hoveredSiteId` (null). Layout per design note D6 / Brief 6 Part 3 step 3.7:
- The Part 3 (Brief 6) narrative block stays ABOVE
- Theme pills + sub-metric pills + Total/PerUnit/PerM² toggle
- Grid: `<Leaderboard>` left (~36%), `<MapMarkers>` right (~64%)
- `<TotalsStrip>` below
- `<SiteHoverCard>` floating layer
- Load all six JSONs at mount (or receive from App's existing data context if there is one — check how Phase 1B loads data and match that pattern)

4.4 **Wire into App.jsx.** Replace the `/portfolio/map` placeholder with `<PortfolioMap>`. Confirm `/` and `/portfolio/overview` still redirect to `/portfolio/map` (Brief 6 Part 3 did this). Add `"framer-motion": "^12.38.0"` to `package.json` dependencies (do NOT run npm install — Chris does). The CSS fallback means it works without install.

4.5 `npm run build` — must succeed. If framer-motion import fails the build (because not installed), use a dynamic/optional import pattern or a try/catch around the framer-motion import with the CSS path as fallback, so build is green either way.

4.6 Audit doc: wiring notes, default theme/metric, data-loading pattern used.

**PASS criteria:**
- `/portfolio/map` shows the full live map (no placeholder)
- Default: Energy theme, Total energy metric
- Theme pills switch theme; sub-metric pills switch metric; toggle switches normalisation
- Leaderboard ↔ map hover cross-talk works both directions
- Click row or dot → Site Detail
- Hover card shows on dot hover
- Totals strip shows portfolio numbers
- `npm run build` clean
- No raw hex in `eir/src/components/portfolio`

**Commit:**
```
Brief 7 Part 4: SiteHoverCard + TotalsStrip + PortfolioMap wiring

- SiteHoverCard: hover preview (name, units, GIA, energy, active metric,
  4 DQ badges), viewport-edge clamped.
- TotalsStrip: compact 5-metric portfolio strip below the map (lucide icons,
  reads portfolio.json).
- PortfolioMap: top-level. Default Energy/Total. Theme pills + sub-metric
  pills + Total/Per-Unit/Per-m² toggle. Leaderboard (36%) | Map (64%) grid,
  totals strip below, hover-card layer. Replaces the /portfolio/map
  placeholder.
- framer-motion added to package.json (^12.38.0); optional import with CSS
  fallback so build is green with or without npm install.

Audit doc updated.
```

---

### Part 5 — Walkthrough + close

**Goal:** Claude Code self-verifies via MCP browser tools. STATUS.md final. Brief archived.

**Files touched:** audit doc, `docs/audit/07_screenshots/*.png`, brief archive move, `current.md`, STATUS.md

**Steps:**

5.1 Boot dev server. Navigate `/portfolio/map`.

5.2 Self-walkthrough (capture screenshots at 1440×900):
- Default render: Energy/Total, 13 rows, 13 dots
- Switch each of the 6 themes → leaderboard re-sorts, dots recolour/resize
- Switch Total → Per Unit → Per m² on Energy → re-sort
- Hover a top row (e.g. Millfield Green) → its dot scales up
- Hover a dot → its row highlights
- Click a row → lands on `/site/{id}/overview` (cream register)
- Click a dot → same
- Hover card content correct
- Totals strip numbers match portfolio.json
- Resize 1366×768 and 1920×1080 → no layout break, no page scroll

5.3 Falsifiability:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/portfolio --include="*.jsx"   # → 0
cd eir && npm run build                                                          # → clean
```

5.4 STATUS.md final entry + archive brief + repoint current.md.

5.5 Final commit:
```
Brief 7 close: Portfolio Map module live

EOC leaderboard map ported to /portfolio/map. 13 sites on the dotted UK
SVG, 6 themes (Overview/Energy/Water/Waste/Carbon/Data quality), Total/
Per-Unit/Per-m² toggle, hover cross-talk, click-to-drill, hover card,
totals strip. Calibrated positions. CSS-keyframe pulse + reorder with
optional framer-motion upgrade.

Brief archived. STATUS.md + audit doc complete with screenshots.
Awaiting Chris walkthrough. Next: Brief 8 (Load Inspector + Stark reader fix).
```

**PASS criteria:**
- All 6 themes + 3 toggles exercised without errors
- Cross-talk both directions
- Click-to-drill both row and dot
- Build clean, 0 raw hex in portfolio components
- Screenshots captured
- Brief archived, current.md repointed

---

## What MUST NOT happen

- No touching the half-hourly reader or HH JSONs (Brief 8)
- No Load Inspector work (Brief 8)
- No `npm install` from Claude Code's environment
- No modifying nzai-demo
- No Sites table redesign, no GRESB build
- No partial commits — one commit per Part with STATUS + audit updates
- No skipping Part 5 self-walkthrough
- No pushing Part 4 if build fails (halt + log)

---

## When to escalate (log to STATUS.md + stop)

- Reference doc missing
- SVG won't render as `<img>` AND fallback rectangle fails
- Build fails after Part 4
- PASS criteria unmet after 15 min + 3 approaches

Otherwise plough through. Final report at Part 5.

---

## Final report fields (Part 5)

1. New origin/main HEAD SHA
2. Commits in Brief 7 chain
3. Brief archived confirmed
4. current.md final state
5. Themes tested (all 6?) + toggles (all 3?)
6. Calibration: all sites land correctly? (Y/N + any clamped)
7. Cross-talk working both directions? (Y/N)
8. Click-to-drill working from row + dot? (Y/N)
9. framer-motion install state + whether CSS fallback active
10. grep raw-hex result (0?)
11. Build output (clean?)
12. Screenshots count + path
13. Known issues logged (esp. confirm the HH-reader bug is still logged for Brief 8)
14. CLAUDE.md unchanged (`git diff CLAUDE.md` empty)
15. Standing by for Chris walkthrough

---

## Notes for Claude Code

- Single workstream — this should fit one session comfortably. If it doesn't, the natural split point is after Part 3 (projection + leaderboard + markers done; wiring + card + strip in a follow-up). But aim to finish.
- The handoff has the full EOC source inline — adapt, don't reinvent.
- The design note's D-decisions are the contract; the handoff is the how.
- Confirm receipt by quoting the title + Target outcome, then proceed.

Standing by for authorisation to begin Part 0.
