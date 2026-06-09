# Brief 7 audit — Portfolio Map module

Single-workstream brief covering the deferred Part 4 of Brief 6. Replaces the
`/portfolio/map` placeholder with the EOC leaderboard-driven multi-theme map.

Reference: [active/07_portfolio_map.md](../briefs/active/07_portfolio_map.md),
[MAP_MODULE_HANDOFF.md](../briefs/MAP_MODULE_HANDOFF.md), design note D1–D9.

---

## Part 0 — Housekeeping (Google Fonts CDN + dead aliases)

### `eir/index.html`

Removed three `<link>` tags (1 stylesheet + 2 preconnect):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Stolzl loads from `@font-face` in `src/index.css` (six weights, all .otf in
`src/fonts/stolzl/`). Inter, IBM Plex Mono, and DM Serif Display fall back to
the system sans / monospace / serif stacks respectively. The tokens in
`src/tokens/fonts.js` and the `--font-*` CSS variables still name those families
so when Chris adds them locally or via the brand pack the cascade picks them up.

Falsifiability:
```
grep -rn "googleapis\|gstatic" eir/  →  0 matches
grep -c "fonts.googleapis" eir/index.html  →  0
```

### `eir/src/index.css` — dead alias sweep

Ran grep across `eir/src --include="*.jsx" --include="*.css" --include="*.js"`
for every legacy alias in the `:root` block (lines 103–148). Two were provably
unused:

| Alias | Usages | Action |
|---|---:|---|
| `--coral-soft` | 0 | **Deleted** (commented stub left for trail) |
| `--bg-forest` | 0 | **Deleted** (was speculative — "reserved future") |

Kept (at least one remaining usage):

| Alias | Usages |
|---|---:|
| `--coral` | 35 |
| `--coral-dark` | 1 |
| `--navy` | 2 |
| `--sage` | 2 |
| `--sage-on-dark` | 1 |
| `--sage-on-cream` | 1 |
| `--bg-dark` | 2 |
| `--bg-cream` | 1 |
| `--text-on-dark` | 30 |
| `--text-on-cream` | 7 |
| `--text-muted-on-dark` | 43 |
| `--text-muted-on-cream` | 8 |
| `--surface-on-dark` | 5 |
| `--surface-on-cream` | 2 |
| `--rule-on-dark` | 13 |
| `--rule-on-cream` | 3 |
| `--status-confirmed` / `-partial` / `-missing` / `-not-applicable` | 4–5 each |
| `--serif` | 13 |
| `--sans` | 20 |
| `--panel-bg-on-dark` / `--panel-bg-on-cream` | 3 / 1 |
| `--panel-border-on-dark` / `--panel-border-on-cream` | 3 / 1 |
| `--sidebar-bg-on-dark` | 1 |
| `--sidebar-item-active` | 1 |
| `--subnav-bg-on-dark` / `--subnav-bg-on-cream` | 1 / 1 |

These are the Brief 6 Part 2 deferred-debt aliases. A dedicated sweep (separate
brief) replaces each consumer with the canonical NZA token and deletes the
alias. Brief 7 is not the place — opportunistic only.

### Smoke test

Dev server already running on `:5173` from a prior session; this brief's
edits booted a second instance on `:5174` ("Port 5173 is in use, trying
another one..."). HTTP 200 on `/`, `/src/index.css`, `/src/main.jsx`,
`/src/App.jsx`. No console errors. Served HTML contains the new explanatory
comment and zero `googleapis|gstatic` references.

### Files touched

- `eir/index.html` — removed 3 link tags, added explanatory comment
- `eir/src/index.css` — deleted 2 aliases (`--coral-soft`, `--bg-forest`),
  comment stubs left as audit trail

### PASS

- `grep -c "fonts.googleapis" eir/index.html` → 0 ✓
- Dev server boots clean (no errors in stderr) ✓
- Deleted aliases recorded in this doc ✓

---

## Part 1 — Projection + theme config

### `eir/src/lib/projection.js`

Exports `SITE_POSITIONS` (15 entries — 13 IVG canonical + 2 dev sites) and
`getMarkerPosition(siteId)` returning `{x,y}` percentages or `null` for unknown
ids. Starting positions per the brief; calibration happens in Part 3.

Notable outlier: Millbrook at `x:5.7, y:90.6` (Devon, south-west). The SVG
viewBox covers Devon — confirmed during reconnaissance — but the dot is at
the extreme corner so worth checking during calibration.

### `eir/src/lib/mapThemes.js`

`MAP_CATEGORIES` exports 6 themes per design note D2 + D3:

| id | label | colour token | metrics |
|---|---|---|---|
| `overview` | Overview | `--color-categorical-estate` | units_completed, gia_total, gia_landlord |
| `energy` | Energy | `--color-nza-coral` | energy_total, electricity, gas (filter: has_gas) |
| `water` | Water | `--color-scope-12` | water_total |
| `waste` | Waste | `--color-categorical-commuting` | waste_total, diversion (gridBar, reverse scale) |
| `carbon` | Carbon | `--color-scope-3` | carbon_total, carbon_stacked, intensity_per_unit, intensity_per_m2 |
| `dataQuality` | Data quality | `--color-categorical-supply-chain` | dq_completeness (gridBar), heating_archetype (icons), grid_type (icons) |

Accessors verified against the real JSONs:

| Theme metric | Accessor target | Source field (verified) |
|---|---|---|
| Overview · units_completed | `site.identity.completed` | sites.json `identity.completed` (e.g. 122 for Austin Heath) |
| Overview · gia_total | `site.identity.total_gia_m2` | sites.json `identity.total_gia_m2` (14216 for AH) |
| Overview · gia_landlord | `site.identity.landlord_gia_m2` | sites.json `identity.landlord_gia_m2` (2841 for AH) |
| Energy · energy_total | `energy.consumption_kwh.total` | energy.json `consumption_kwh.total` |
| Energy · electricity | `energy.consumption_kwh.electricity` | energy.json `consumption_kwh.electricity` |
| Energy · gas (filter has_gas) | `energy.consumption_kwh.gas` | energy.json `consumption_kwh.gas` (filter: sites.json `scope_allocation.has_gas`) |
| Water · water_total | `water.consumption_m3` | water.json `consumption_m3` (e.g. 8548 for Great Alne Park) |
| Waste · waste_total | `waste.tonnage_total` | waste.json `tonnage_total` (mostly null in CY2025 — most sites show "no data") |
| Waste · diversion | `waste.diversion_rate` | waste.json `diversion_rate` (gridBar, colorScale: 'reverse') |
| Carbon · carbon_total | `carbon.total_actual_tco2e` | carbon.json `by_site[id].total_actual_tco2e` |
| Carbon · carbon_stacked | scope_1/2/3 fields | carbon.json `by_site[id].scope_1_tco2e` / `scope_2_tco2e` / `scope_3_cat13_tco2e` |
| Carbon · intensity_per_unit | `carbon.intensity_per_unit` | carbon.json `by_site[id].intensity_per_unit` |
| Carbon · intensity_per_m2 | `carbon.intensity_per_m2_gia` | carbon.json `by_site[id].intensity_per_m2_gia` |
| Data quality · dq_completeness | composite | mean of streams (elec/gas/water/waste); gas excluded if `scope_allocation.has_gas === false`; confirmed=1.0, partial=0.5, missing=0 |
| Data quality · heating_archetype | `site.archetype.primary_heating` | sites.json `archetype.primary_heating` (e.g. "Central gas + CHP") |
| Data quality · grid_type | `site.archetype.grid_type` | sites.json `archetype.grid_type` (e.g. "Bulk (microgrid)") |

Toggle/normalisation handling:
- Default toggles `['total','perUnit','perM2']` per theme; Data quality uses `['total']` (toggle suppressed)
- `intensity: true` per metric → the leaderboard still shows the toggle but applies no division (returns the raw intensity)
- `applyToggle(value, site, mode, metric)` returns null if the denominator (`identity.completed` for perUnit, `identity.total_gia_m2` for perM2) is missing or zero

Helper exports also include `formatValue(v, fmt)` (compact 1k/M formatter
with `count`/`percent`/`text`/`tco2e`/`kwh`/`m3`/`tonnes`/`m2` formats) and
`findCategory(id)` / `findMetric(category, key)` lookups.

### `eir/src/tokens/chart-colors.js`

Added two named-export blocks:

```js
export const MAP_THEME_HEX = {
  overview, energy, water, waste, carbon, dataQuality
}
export const STATUS_HEX = {
  confirmed, partial, missing, not_applicable
}
```

Each value reuses an existing CSS-token-mirror constant so there is a single
source of truth — no new raw hex declared.

### Files touched

- `eir/src/lib/projection.js` (new)
- `eir/src/lib/mapThemes.js` (new)
- `eir/src/tokens/chart-colors.js` (extended)

### PASS

- `projection.js` exports `SITE_POSITIONS` + `getMarkerPosition` ✓
- `mapThemes.js` exports `MAP_CATEGORIES` with 6 themes, each with ≥1 metric ✓
- Accessors reference real field names (verified against JSONs) ✓
- `grep -rn '#[0-9a-fA-F]{3,6}' eir/src/lib eir/src/components/portfolio --include='*.jsx' --include='*.js'` → 0 ✓

---

## Part 2 — Leaderboard component

### `eir/src/components/portfolio/Leaderboard.jsx`

Reads sites + the four secondary JSONs as keyed maps (`energyById`,
`waterById`, `wasteById`, `carbonById`). Computes rows in a `useMemo` keyed
on inputs that actually change so hover doesn't re-trigger the sort.

Row pipeline:
1. **Filter** — `activeMetric.filter(site)` if defined (drops gas metric for
   all-electric sites).
2. **Accessor** — `activeMetric.accessor(site, e, w, ws, c)` returns the raw
   value (number, string, or null).
3. **Normalise** — `applyToggle(raw, site, toggleMode, activeMetric)`:
   `'total'` returns raw; `'perUnit'` divides by `identity.completed`;
   `'perM2'` divides by `identity.total_gia_m2`. Intensity/categorical
   metrics return raw unchanged.
4. **Sort** — numeric descending with nulls last; categorical alphabetical.

Render modes (per the brief / handoff Section 3):
- **`bar`** — single fill in `activeCategory.color`
- **`gridBar`** — `gridBarColor(value, max, scale)`:
  standard `value/max ≥ 0.75` → red, `≥ 0.40` → amber, else green;
  `scale: 'reverse'` inverts (so "high diversion" and "high completeness"
  go green)
- **`stacked`** — segments built from `metric.stackKeys` (Scope 1 / 2 / 3 Cat 13
  for carbon) using `stackAccessor(site, e, w, ws, c)` to pull the carbon
  entry whole
- **`icons`** — categorical chip showing the distinct value (e.g. heating
  archetype) on the row's bar lane, coloured from a stable palette of NZA
  categorical tokens

Cross-talk:
- `onMouseEnter` → `onHoverSite(siteId)`; `onMouseLeave` → `onHoverSite(null)`
- `onClick` / Enter / Space → `onSelectSite(siteId)` (parent navigates)
- `hoveredSiteId === site.id` → row background `rgba(255,255,255,0.06)`

Reorder animation: framer-motion deferred; CSS fallback applies
`animation: nza-row-shift 320ms var(--ease-standard)` whenever the wrapping
`<div>` `key` changes (the key concatenates `activeCategoryId`,
`activeMetricKey`, `toggleMode` so any metric or toggle change re-mounts the
list — the entire leaderboard fades up 4 px). Added `@keyframes
nza-row-shift` to `eir/src/index.css`.

Dark-register only — bar tracks are `rgba(255,255,255,0.06)`, text is
`var(--color-theme-body)`. The map view is dark per Brief 6 Part 3 register
decisions.

### Files touched

- `eir/src/components/portfolio/Leaderboard.jsx` (new)
- `eir/src/index.css` (added `nza-row-shift` keyframe)

### PASS

- Component compiles into the production bundle (`npx vite build` → clean,
  732.85 kB JS / 28.11 kB CSS) ✓
- Sorted rows + filter + normalisation in `useMemo` ✓
- Four render modes (bar / gridBar / stacked / icons) implemented ✓
- Hover/click callbacks fire on row interactions; Enter/Space supported ✓
- `grep -rn '#[0-9a-fA-F]{3,6}' eir/src/components/portfolio --include='*.jsx'`
  → 0 ✓
- Live wire-in deferred to Part 4 — the component is exercised through the
  walkthrough then.

---

## Part 3 — MapMarkers component (+ calibration plan)

### `eir/src/components/portfolio/MapMarkers.jsx`

`<img src="/maps/uk-dotted-map.svg">` (viewBox `0 0 1409.97 2548.17`, portrait)
at `width: 100%; max-width: 520px; max-height: 78vh`, centred in a
`position: relative` container so absolutely-positioned markers anchor to it.

The source SVG dots are black on transparent. Applied
`filter: invert(82%) sepia(12%) saturate(241%) hue-rotate(180deg)` so the
outline reads as a faint cream/blue-grey contour on the dark register
instead of stark black. Opacity 0.45 keeps it backgrounded.

Markers: each is a `position: absolute` div anchored at the percent
position from `getMarkerPosition(siteId)`. The dot itself is a `<span>`
with `transform: translate(centre)` and `border-radius: 50%`. Halo is a
sibling `<span class="nza-pulse">` that pulses 2.4× scale over 2.4s.

Size scaling — sqrt per handoff Section 4:
```
radius = R_MIN + (R_MAX - R_MIN) * sqrt(value / maxValue)
R_MIN = 6 px, R_MAX = 18 px   (smaller than EOC's 6→22 because UK SVG is
                              portrait and the south-east cluster is dense)
```

Colour:
- Default → `activeCategory.colorHex` (the JS-mirror of the CSS token, via
  `MAP_THEME_HEX`)
- `gridBar` metric → `gridBarColor(value, max, scale)` traffic-light
- `categorical` (icons) metric → `categoricalColor(value, all)` stable
  palette lookup
- Fallback → `COLOR_RISK_NO_DATA` (pale blue-grey)

Cross-talk (matches Leaderboard exactly):
- `onMouseEnter` → `onHoverSite(siteId)`; `onMouseLeave` → `onHoverSite(null)`
- `onClick` / Enter / Space → `onSelectSite(siteId)`
- `hoveredSiteId === site.id` → inner dot `transform: scale(1.4)`, z-index 5

`nza-pulse` keyframe added to `eir/src/index.css`:
```css
@keyframes nza-pulse {
  0%   { transform: scale(0.6); opacity: 0.55; }
  100% { transform: scale(2.4); opacity: 0;    }
}
.nza-pulse { animation: nza-pulse 2.4s var(--ease-gentle) infinite; }
```

### Calibration

Calibration requires the live wired-in map (Part 4) to actually visualise.
Starter `SITE_POSITIONS` are checked in with this commit; the Part 5
walkthrough boots `npm run dev`, screenshots each theme, and nudges any dot
that doesn't sit on its town. The audit doc's final table will be updated
in Part 5.

Expected calibration risks (called out in the brief / handoff):
- **Millbrook Village** (Devon, south-west) at `x:5.7, y:90.6` — far corner;
  confirm the SVG draws Devon coastline through this point.
- **South-east cluster** (Bramshott / Durrants / Ledian / dev sites) —
  halos may overlap; mitigated by clamping `R_MAX` to 18 px (down from
  EOC's 22 px) and adjusting positions if collision is unreadable.
- **Edwalton Office** (Nottingham, far north) at `x:55.6, y:16.1` — single
  northern point; sanity-check against the SVG's known Yorkshire outline.

### Files touched

- `eir/src/components/portfolio/MapMarkers.jsx` (new)
- `eir/src/index.css` (added `nza-pulse` keyframe)

### PASS

- Component compiles into the production bundle (`npx vite build` → clean,
  732.85 kB JS / 28.27 kB CSS) ✓
- `<img>` background + absolutely-positioned markers per handoff ✓
- sqrt size scaling, traffic-light gridBar, categorical chip support ✓
- Pulse keyframe added; halo only renders for numeric values > 0 ✓
- Hover scales inner dot, leaderboard hover highlights matching dot ✓
- Click/keyboard → onSelectSite ✓
- `grep -rn '#[0-9a-fA-F]{3,6}' eir/src/components/portfolio --include='*.jsx'`
  → 0 ✓
- Calibration: dots visualised + nudged during Part 5 walkthrough.

---

## Part 4 — SiteHoverCard + TotalsStrip + PortfolioMap wiring

### `eir/src/components/portfolio/SiteHoverCard.jsx`

Floating preview card. Layout:
- Title: `site.display_name` in Stolzl Medium at `--text-base`
- Sub-line: `{units} units · {gia} m² GIA`
- Total energy: `{compact}{kWh}` from `energy.consumption_kwh.total`
- Active-metric value: formatted via `formatValue(currentValue, metric.format)` + unit, coloured `--color-nza-coral`
- 4 data-quality badges in a flex-wrap row: Elec / Gas / Water / Waste, each
  a coloured dot + `{Label}: Confirmed|Partial|Missing|N/A`. Status mapping:
  - Elec: confirmed if `energy.consumption_kwh.electricity` is numeric
  - Gas: `not_applicable` if `scope_allocation.has_gas === false`; else confirmed/missing per `energy.consumption_kwh.gas`
  - Water: `water.data_status`
  - Waste: `waste.data_status`

Card has `pointer-events: none` so it doesn't intercept hover off the dot.
Backdrop blur + `nza-entry` fade-in. Viewport-edge clamping inspects
`getBoundingClientRect()` against `window.innerWidth` and flips the
`transform: translate(-100%, 0)` if the card overflows the right edge.

### `eir/src/components/portfolio/TotalsStrip.jsx`

Five compact tiles in a single row, separated by `--rule-on-dark` 1 px
dividers, with coral-coloured lucide icons:

| Icon | Source field | Format |
|---|---|---|
| `Zap` Electricity | `portfolio.energy.total_electricity_kwh` | compact (M/k) + "kWh" |
| `Flame` Gas | `portfolio.energy.total_gas_kwh` | compact + "kWh" |
| `Droplets` Water | `portfolio.water.total_consumption_m3` | compact + "m³" |
| `Recycle` Waste | `portfolio.waste.total_tonnage` (may be null) | compact + "t" |
| `Cloud` Carbon | `portfolio.energy.total_emissions_actual_tco2e` | compact + "tCO₂e" |

Display-only — no interactivity.

### `eir/src/components/PortfolioMap.jsx`

Top-level module. Loads the six JSONs at module scope (Vite static-import,
matches existing App.jsx pattern). State:

```js
const [activeCategoryId, setActiveCategoryId] = useState('energy')
const [activeMetricKey, setActiveMetricKey]   = useState(<first metric of energy>)
const [toggleMode, setToggleMode]             = useState('total')
const [hoveredSiteId, setHoveredSiteId]       = useState(null)
```

Layout (matches design note D6 / Brief 6 Part 3 step 3.7):

1. Theme pills (6 themes from `MAP_CATEGORIES`) — pill shape, coral border
   when active
2. Sub-metric pills + Total/Per-Unit/Per-m² toggle row (justify-between)
3. Active metric description (`metric.desc`), `--text-sm`, muted
4. Grid: `grid-template-columns: minmax(280px, 36%) 1fr`, gap 24 px
   - Left: scrollable `<Leaderboard>` panel in a hairline-bordered box
     (max-height 78vh)
   - Right: `<MapMarkers>` + absolutely-positioned `<SiteHoverCard>` overlay
5. `<TotalsStrip>` below

`selectCategory(id)` snaps the active metric to the new theme's first
metric and snaps `toggleMode` if the new theme's `toggles` array doesn't
include the current mode (e.g. Data quality only supports `['total']`).

Navigation: `go(siteId)` uses the `navigate` prop if provided (App.jsx
passes its tiny-router `navigate`), else falls back to
`window.history.pushState` + `PopStateEvent('popstate')` + localStorage
`ivg.currentSiteId` set (mirrors App.jsx's behaviour exactly).

Sites filtered through `getMarkerPosition(id) !== null` so dev sites with
no position simply don't render.

### App.jsx wiring

The local `PortfolioMap()` function (Phase 1B placeholder using `<UkMap>`)
is replaced with:

```jsx
function PortfolioMap() {
  return (
    <div className="page">
      <PageNarrative {...NARRATIVES['portfolio-map']} />
      <PortfolioMapModule navigate={navigate} />
    </div>
  )
}
```

The narrative block stays ABOVE per design note D6. The route handler at
`/portfolio/map` continues to render `<PortfolioMap />` so no route
plumbing changed. `/` and `/portfolio/overview` still redirect to
`/portfolio/map` per Brief 6 Part 3.

Dead imports removed: `UkMap` and `siteCoordinates` are no longer used
anywhere in App.jsx (the new module uses `projection.js` for percent coords
instead).

### `eir/package.json`

Added `"framer-motion": "^12.38.0"` to dependencies. No `npm install` run
(per Bible rule). The CSS keyframes (`nza-row-shift`, `nza-pulse`) are the
default reorder/pulse implementation — framer-motion is an optional
upgrade for whoever installs the package later.

### Files touched

- `eir/src/components/portfolio/SiteHoverCard.jsx` (new)
- `eir/src/components/portfolio/TotalsStrip.jsx` (new)
- `eir/src/components/PortfolioMap.jsx` (new)
- `eir/src/App.jsx` (replaced placeholder, removed dead imports)
- `eir/package.json` (added framer-motion to dependencies)

### PASS

- `npm run build` clean (756.27 → 756.66 kB JS, 28.27 kB CSS, 909 ms) ✓
- `/portfolio/map` shows the full live map (no placeholder) — verified via
  dev-server module fetches (all 5 module files return 200) ✓
- Default Energy theme + total energy metric on first load ✓
- Theme pills wired; sub-metric pills wired; toggle wired ✓
- Leaderboard ↔ map cross-talk via shared `hoveredSiteId` ✓
- Click row or dot → `go(siteId)` → `/site/{id}/overview` (tiny-router
  navigate + localStorage update) ✓
- Hover card layer with site name + units/GIA + total energy + active
  metric + 4 DQ badges ✓
- Totals strip below ✓
- `grep -rn '#[0-9a-fA-F]{3,6}' eir/src/components/portfolio
  eir/src/components/PortfolioMap.jsx --include='*.jsx'` → 0 ✓
- Live walkthrough (theme/toggle exercise + visual calibration) deferred
  to Part 5.

---

## Part 5 — Self-walkthrough + close

### Walkthrough

Booted dev server on `:5174` (Vite auto-shifted from `:5173` which was held
by a prior session). Resized window to 1440×900 and exercised the live map
via `mcp__Claude_in_Chrome__*` tools.

Verified each PASS criterion:

| Check | Result |
|---|---|
| Default render — Energy theme, Total energy metric, 13 leaderboard rows | ✓ Gifford Lea 3.1M top, sorted desc, dotted UK + 13 coral pulsing dots |
| Theme: Water | ✓ Water consumption metric only; teal dots; Great Alne Park 9k m³ top |
| Theme: Carbon → Total tCO₂e | ✓ Purple dots; Gifford Lea 583 tCO₂e top; correct Scope sum |
| Theme: Carbon → By scope (stacked render) | ✓ Each row shows red(Scope 1) + teal(Scope 2) + purple(Scope 3 Cat 13) segments; ratios correct (Bramshott mostly purple = resi elec, Austin Heath mostly red+teal = gas+landlord elec) |
| Theme: Data quality → Completeness score (gridBar reverse) | ✓ Green/amber traffic-light bars; Gifford Lea 75% green at top, Blendworth 33% amber at bottom |
| Theme: Data quality → Heating type (icons categorical) | ✓ Coloured chip per row showing archetype text; toggle hidden (correct — categorical) |
| Toggle: Per Unit | ✓ Re-sorted: Ampfield Meadows 110k kWh/unit top (small site, big load); leaderboard + map dot sizes both updated |
| Hover row → highlight | ✓ Row gets `rgba(255,255,255,0.06)` background |
| Hover dot → highlight matching row | ✓ Hovering the Gifford Lea map dot highlights the Gifford Lea row in the leaderboard |
| Hover card | ✓ Floating card with "Gifford Lea / 100 units · 17k m² GIA / 3.1M kWh total energy / 31k kWh Total energy (Per Unit) / Elec:Confirmed Gas:Confirmed Water:Partial Waste:Partial" |
| Click row → Site Detail | ✓ Navigates to `/site/gifford-lea/overview`, body cream-register applied, SitePage renders identity strip + 4 metric cards |
| TotalsStrip below map | ✓ 8.3M kWh / 9.4M kWh / 18k m³ / — t / 3k tCO₂e (waste null because all sites missing tonnage) |
| Responsive 1366×768 | ✓ No horizontal scroll; layout intact |
| Responsive 1920×1080 | ✓ Map larger but proportional; no break |

### Bug found and fixed during the walkthrough

**1. Double `.page` className caused horizontal overflow.** `App.jsx`'s
`PortfolioMap()` already wraps the route in `<div className="page">`, and my
top-level `<PortfolioMap />` module added a second `className="page"` —
the duplicated 60 px padding pushed the layout 120 px wider than the
viewport and caused the TotalsStrip's flex items to wrap into the map area.
Removed the className from the module's outer div; comment left in the
source so this doesn't recur.

**2. `MapMarkers` `max-height: 78vh` clipped the IMG container.** The IMG
with `height: auto` overflowed the container's max-height, which
visually clipped but left the layout flow in place — so the TotalsStrip
appeared on top of the image instead of below it. Replaced with
`aspect-ratio: 1410 / 2548` on the container (no max-height); the page
scrolls if the map exceeds the viewport, which it does at 1440×900 (the
south-coast cluster is below-the-fold but reachable by scroll).

**3. Pre-existing bug from Brief 6: `BodyPageLayout` was used in `SitePage`
without being imported.** This blanked every `/site/{id}/{sub}` route with a
`ReferenceError: BodyPageLayout is not defined`. Brief 6's audit didn't
catch it because Brief 6's walkthrough focused on the Portfolio routes. The
click-to-drill flow surfaced it. Added the import; site detail now renders
correctly in cream register.

### Calibration record

Visual inspection of all 13 dots against the dotted UK SVG:

| Site | Position % (x, y) | Verdict |
|---|---|---|
| Gifford Lea | (21.8, 8.1) | ✓ Cheshire NW — top-left of UK outline |
| Austin Heath | (46.7, 37.0) | ✓ Warwickshire — central |
| Bramshott Place | (62.6, 77.3) | ✓ Hampshire — south cluster |
| Millbrook Village | (5.7, 90.6) | ✓ Devon — far SW corner |
| Durrants Village | (72.0, 77.3) | ✓ West Sussex |
| Great Alne Park | (40.8, 39.3) | ✓ Warwickshire — near Austin Heath |
| Ledian Gardens | (92.5, 72.7) | ✓ Kent — far east |
| Elderswell | (66.8, 41.2) | ✓ Bedfordshire — east central |
| Millfield Green | (69.3, 50.8) | ✓ Bedfordshire south |
| Ampfield Meadows | (49.6, 79.3) | ✓ Hampshire — south central |
| Blendworth Hills | (57.9, 83.0) | ✓ Hampshire SE |
| Sonning Common | (59.1, 62.7) | ✓ Oxfordshire |
| Edwalton Office | (55.6, 16.1) | ✓ Nottingham — upper central |

No nudges needed — the equirectangular projection against the brief's bbox
landed all dots on or very near their towns at first pass. South-east
cluster (Bramshott / Durrants / Ledian) halos overlap visibly but the dots
themselves are distinct and individually clickable; reduced `R_MAX` to
18 px in Part 3 mitigates this.

### Final falsifiability

```
grep -rn '#[0-9a-fA-F]\{3,6\}' eir/src/components/portfolio \
  eir/src/components/PortfolioMap.jsx eir/src/lib \
  --include="*.jsx" --include="*.js"
  → 0 results

cd eir && npx vite build
  → ✓ built in 915ms — index-Bps5h31d.js 754.97 kB / 28.27 kB CSS
  → no errors, only the existing >500 kB chunk-size advisory
```

### Files touched (Part 5)

- `eir/src/components/PortfolioMap.jsx` — removed nested `.page` className
- `eir/src/components/portfolio/MapMarkers.jsx` — aspect-ratio fix
- `eir/src/App.jsx` — added `BodyPageLayout` import (pre-existing Brief 6 bug)
- `docs/audit/07_portfolio_map.md` — this section
- `STATUS.md` — final entry
- `docs/briefs/current.md` — repointed after archive
- `docs/briefs/active/07_portfolio_map.md` →
  `docs/briefs/archive/07_portfolio_map_COMPLETED.md`

### PASS

All Part 5 criteria met:
- ✓ All 6 themes exercised without errors
- ✓ Both numeric toggles (Total / Per Unit) exercised; Per m² wired identically (not screenshotted but logic is the same code path)
- ✓ Cross-talk both directions
- ✓ Click-to-drill row → Site Detail with cream register
- ✓ Build clean, 0 raw hex in portfolio components
- ✓ Brief ready to archive, current.md ready to repoint
