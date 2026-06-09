# Map Module — Handoff Document

> Source project: `nza-eoc-nzr` (EOC Net Zero Report)
> Receiving project: `ivg-esg-tool` (IVG retirement villages ESG dashboard)
> Author: Claude (working on EOC side) · audience: Claude Code working on IVG side
>
> This document is **self-contained**. The receiving developer will not have
> access to the EOC repo. Every relevant source file is pasted inline.

---

## Section 1 — What the Map module is

The Map module is the interactive geographic surface of the EOC Inventory chapter. It plots EOC's nine global offices on a stippled world map, and lets the reader switch between five thematic lenses (General, Estate, Travel & Transport, Supply Chain, Total Emissions). Each lens re-sizes the dots on the map, re-ranks a horizontal-bar leaderboard on the left, and changes the colour palette to the theme accent. Clicking any office (dot **or** leaderboard row) opens a deep-dive modal with three tabs (Overview / Emissions / Operations) covering totals, comparative tags, top suppliers, top travel corridors, grid-factor sparkline, and per-office data-quality split.

The story it tells: *EOC's footprint is not evenly distributed across its estate. London is bigger than Bordeaux not because Londoners are worse — it's because there are more of them.* By letting the reader toggle between **Total** (absolute tonnage) and **Per FTE** (intensity normalised by headcount), the module makes that point visually. Switching themes shows how a single office can dominate one lens (e.g. New York for business travel) while sitting mid-table on another (e.g. supply chain). It replaces the static "here's a list of our offices" diagram every other carbon report ships.

It fits into the wider Inventory section as the first stop after the Overview tab — Inventory → Map → Themes → Leadership. The Overview tells the reader the headline. The Map shows *where* it lives. The Themes section then takes the same data sliced by emissions category. Leadership steps outside the inventory to peers. So the Map's job is geographic intuition; it doesn't try to be the analytical chart.

The data it consumes is **per-site metrics across multiple themes**: each office carries fte, gross floor area, electricity kWh + grid factor, fugitive HVAC emissions, gas presence, full per-scope emissions breakdown (Scope 2.1 / 3.2 / 3.3 / 3.5 / 3.6 / 3.7 / 3.8), travel-by-mode breakdown, top suppliers, top travel corridors, commuting survey, and pre-computed totals. See Section 6 for the exact shape.

Screenshots: there are no committed screenshots in this repo — Chris's review screenshots live in `C:\Users\ChrisScott\Downloads\` and are not part of the git history. Run the EOC dev server (`npm run dev` → `localhost:5273/inventory/map`) to see the live module.

---

## Section 2 — Visual anatomy

Walking top to bottom on `/inventory/map`:

### Page chrome (provided by MainLayout, not by MapView)
- Top white Navigation bar (`Home / Explainers / Inventory / Strategy`)
- Dark sub-nav band (`Overview / Map / Themes / Leadership`) — Inventory section navigation

### Inside MapView (`src/components/map/MapView.jsx`)

1. **Five-category pill capsule** (top, centred)
   - Background: `bg-white/5 rounded-full p-1` containing a `flex` row of pill buttons
   - Active button: filled with the category accent colour; non-active: text colour `#9ca3af`
   - Categories: General · Estate · Travel & Transport · Supply Chain · Total Emissions
   - Switching the category resets the active metric to the first one in that category's `metrics` array
   - Class hooks: outer wrapper has class `inline-flex bg-white/5 rounded-full p-1 flex-wrap gap-0.5`; per-button `px-4 py-1.5 rounded-full text-sm font-heading font-medium`

2. **Sub-metric pills** (directly below, centred)
   - Smaller, less prominent — a row of text-only pills that show the metrics inside the active category
   - Each metric: `px-3 py-1 rounded text-xs font-heading font-medium`
   - Active metric: `bg-white/10 text-white underline underline-offset-2`
   - Idle: `text-white/40 hover:text-white/60`
   - Example metrics inside Estate: Total Estate · Electricity · Gas & Heating · Fugitive Emissions · Grid Intensity

3. **Description strap line** (single italic-ish caption, `text-[10px] text-white/30 text-center mb-1`)
   - The active metric's `.desc` string. Sits between the sub-pills and the main panel.

4. **Main panel** — `flex gap-8 min-h-0`, two columns:

   **Left column — Leaderboard** (`w-[380px] shrink-0 overflow-y-auto pr-1 flex flex-col justify-center`)
   - Vertically centred inside the column
   - **Total / Per FTE toggle** (top-right of leaderboard, only present if the active category has `toggles` and the active metric isn't an `intensity` metric):
     - `flex gap-0.5 bg-white/[0.04] rounded p-0.5`
     - Two buttons: `Total` and `Per FTE`
     - Active: `bg-white/10 text-white`; idle: `text-white/40`
   - **Rows** — one per visible office, sorted descending by current metric value
     - Row height: `36px` (constant — `ROW_HEIGHT`)
     - Bar height: `14px` (constant — `BAR_HEIGHT`)
     - Layout: `flex items-center gap-2`
     - Content from left: flag image (16px) · office name (`w-24 shrink-0 truncate`) · bar area (`flex-1 relative`) · value (`w-16 text-right font-display tabular-nums`) · optional chevron (only on the Total Emissions metric)
     - Row colours: `bg-white/10` when selected · `bg-white/[0.04]` when hovered · transparent otherwise
     - Animated reorder: each row wrapped in `<motion.div layout>` with a spring (damping 26, stiffness 300) — when the view changes the rows physically slide to their new positions
   - **Bar rendering** — four modes depending on the metric:
     - `icons`: a `flex` of `User` lucide-react icons, one per ~5 FTE (used for the Staff metric only)
     - `bar`: a single `absolute inset-y-0 left-0 rounded-sm` div filled with the category accent colour, width proportional to value / max
     - `gridBar`: same as `bar` but coloured by a traffic-light grid-intensity function (green clean → red dirty)
     - `stacked`: a `flex` of coloured segments inside the bar, one per breakdown key — used for "Travel by Mode", "By Scope", "By Theme" metrics
   - **Expanded row** — only the Total Emissions / `total_emissions` metric exposes a chevron; clicking it reveals an inline breakdown listing every category in that office (`pl-8 py-1 space-y-0.5` with `text-[9px]` rows). AnimatePresence with `height auto → 0`.

   **Right column — Map** (`flex-1 relative`)
   - Background: `<img src="/maps/world-dotted.svg">` — stippled world outline at 30% opacity, `object-contain`
   - Markers: one absolute-positioned dot per visible office, on top of the SVG
   - Dot anatomy (each marker is three layered elements inside an `absolute` div):
     - Outer **pulse halo**: a `rounded-full` span with `animate-ping` (Tailwind keyframe), translucent (`dotColor + '22'` = 13% alpha), sized by value
     - Inner **dot**: a `rounded-full` span at fixed 12×12 px, filled with the dot colour, with a soft `boxShadow: 0 0 6px <colour>60`
     - **Hover label tag**: a floating dark card (`bg-gray-900 border border-white/10 rounded-lg`) anchored above the dot showing flag + office name + formatted metric value
   - Hover scale on the inner dot: `transform: scale(1.4)` (CSS transition)
   - Selected state colours the dot white (`#fff`), pulse remains the theme colour
   - Per-office position nudge: `POSITION_NUDGE` constant — see Section 4

5. **Modal** (`OfficeModal.jsx`) — full-screen overlay opened on click. Black/60 backdrop, rounded card max-w-2xl, three tabs (Overview / Emissions / Operations). Each tab is a different visual: stat cards, stacked composition bar, grid sparkline, etc. Closed by X button or Escape key.

---

## Section 3 — The leaderboard component

The leaderboard is **not a separate component file** — it lives inline inside `MapView.jsx`. The whole map view is a single file. That's a deliberate trade-off: small surface, tight coupling between the leaderboard and the map (they share hovered/selected state and the same metric definitions). If the IVG version grows beyond this scope, extracting is straightforward.

### Sort behaviour

```js
const visibleOffices = activeMetric.filter
  ? officeList.filter(activeMetric.filter)
  : officeList
const sortedOffices = [...visibleOffices].sort((a, b) => getDisplayValue(b) - getDisplayValue(a))
const maxVal = visibleOffices.length > 0
  ? Math.max(...visibleOffices.map(o => getDisplayValue(o)))
  : 0
```

Two layers: `filter` first (a metric can hide offices that don't apply — e.g. "Gas & Heating" only shows the offices where `has_gas === true`), then `sort` descending by `getDisplayValue(o)`.

`getDisplayValue` is:

```js
const getDisplayValue = (office) => {
  let val = activeMetric.getValue(office)
  if (activeMetric.intensity) return val   // grid intensity is already a ratio - don't normalise
  if (toggleMode === 'perFte' && office.fte > 0) val = val / office.fte
  return val
}
```

When the user flips the Total / Per FTE toggle, every row re-sorts AND every dot re-sizes (because both consume `getDisplayValue`).

### Row component (inline)

```jsx
{sortedOffices.map((office) => {
  const val = getDisplayValue(office)
  const widthPct = maxVal > 0 ? (val / maxVal) * 100 : 0
  const isSelected = selectedOffice?.id === office.id
  const isHovered = hoveredOffice === office.id
  const isExpanded = expandedOffice === office.id && activeMetric.expandable
  const breakdown = activeMetric.render === 'stacked' && activeMetric.getBreakdown
    ? activeMetric.getBreakdown(office) : null
  const breakdownTotal = breakdown
    ? Object.values(breakdown).reduce((s, v) => s + v, 0) : 0
  const barColor = activeMetric.render === 'gridBar'
    ? gridColor(office.electricity?.grid_factor_kgco2e_per_kwh || 0)
    : activeCategory.color

  return (
    <motion.div key={office.id} layout
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className={`rounded px-2 transition-colors ${
        isSelected ? 'bg-white/10' : isHovered ? 'bg-white/[0.04]' : ''
      }`}>
      <div style={{ height: ROW_HEIGHT }}
        className="w-full flex items-center gap-2 cursor-pointer"
        onClick={() => setSelectedOffice(office)}
        onMouseEnter={() => setHoveredOffice(office.id)}
        onMouseLeave={() => setHoveredOffice(null)}>
        <Flag code={office.country_code} size={16} />
        <span className="text-sm text-white/80 w-24 shrink-0 truncate">{office.name}</span>

        {/* Bar area - bespoke per metric */}
        <div className="flex-1 relative" style={{ height: BAR_HEIGHT }}>
          {activeMetric.render === 'icons' ? (
            <StaffIcons fte={office.fte} color={activeCategory.color} />
          ) : activeMetric.render === 'stacked' && breakdown ? (
            <div className="absolute inset-y-0 left-0 flex rounded-sm overflow-hidden"
              style={{ width: `${widthPct}%` }}>
              {Object.entries(breakdown).map(([label, v], i) => (
                <div key={label}
                  style={{
                    width: `${breakdownTotal > 0 ? (v / breakdownTotal) * 100 : 0}%`,
                    backgroundColor: segColor(label, i),
                  }}
                  title={`${label}: ${(v / 1000).toFixed(1)}t`} />
              ))}
            </div>
          ) : (
            <div className="absolute inset-y-0 left-0 rounded-sm"
              style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
          )}
        </div>

        <span className="text-sm font-display tabular-nums text-white/85 w-16 text-right shrink-0">
          {activeMetric.format(val)}
        </span>

        {activeMetric.expandable && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpandedOffice(isExpanded ? null : office.id) }}
            className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
            title="Toggle breakdown">
            <ChevronDown size={12}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Click-to-expand inline breakdown for Total Emissions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="pl-8 py-1 space-y-0.5">
              {/* ...per-category breakdown rows... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})}
```

### Cross-talk with the map

- **Hover a row → highlight matching dot**: row sets `hoveredOffice = office.id`. The map dot reads `hoveredOffice === office.id` and applies `transform: scale(1.4)` to its inner dot.
- **Hover a dot → highlight matching row**: dot sets `hoveredOffice = office.id`. The row reads it and applies `bg-white/[0.04]`.
- **Click anywhere → open modal**: both the row's `onClick` and the dot's `onClick` set `selectedOffice = office`, which renders `<OfficeModal>`.

State variables (`useState`):

```js
const [hoveredOffice, setHoveredOffice] = useState(null)   // string office id or null
const [selectedOffice, setSelectedOffice] = useState(null) // office object or null
const [activeCategoryId, setActiveCategoryId] = useState('total')
const [activeMetricKey, setActiveMetricKey] = useState('total_emissions')
const [toggleMode, setToggleMode] = useState('total')      // 'total' | 'perFte'
const [expandedOffice, setExpandedOffice] = useState(null) // for the Total Emissions breakdown chevron
```

The Total / Per FTE toggle only affects `getDisplayValue` — same metric, just normalised. The colour scheme doesn't change.

---

## Section 4 — The map component

Also inline in `MapView.jsx`. The outline rendering is **an SVG image file** loaded with a regular `<img>` tag — *not* a topology library, *not* d3-geo, *not* react-simple-maps. The file is at `public/maps/world-dotted.svg`. It's a hand-built stippled outline (4,192 lines, ~730 KB) where each dot is a separate `<path>` of a 5.87-radius rounded rectangle. The receiving project will use its own UK SVG so the file contents themselves don't matter — but the **rendering approach** is "render the outline as a flat raster-like SVG `<img>` and overlay markers absolutely".

```jsx
<div className="flex-1 relative">
  <img
    src="/maps/world-dotted.svg"
    alt="World map"
    className="w-full h-full object-contain opacity-30"
    draggable={false}
  />
  {visibleOffices.map(office => {
    const { x, y } = getMarkerPosition(office)
    const val = getDisplayValue(office)
    const baseR = 6
    const pulseR = maxVal > 0 && val > 0
      ? 12 + Math.sqrt(val / maxVal) * 38
      : 0
    const isSelected = selectedOffice?.id === office.id
    const isHovered = hoveredOffice === office.id
    const dotColor = isSelected
      ? '#fff'
      : activeMetric.render === 'gridBar'
        ? gridColor(office.electricity?.grid_factor_kgco2e_per_kwh || 0)
        : activeCategory.color

    return (
      <div key={office.id} className="absolute cursor-pointer"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        onMouseEnter={() => setHoveredOffice(office.id)}
        onMouseLeave={() => setHoveredOffice(null)}
        onClick={() => setSelectedOffice(office)}>
        {pulseR > 0 && (
          <span className="absolute rounded-full animate-ping"
            style={{
              width: pulseR * 2, height: pulseR * 2,
              left: -(pulseR - baseR / 2), top: -(pulseR - baseR / 2),
              backgroundColor: dotColor + '22',
              animationDuration: isSelected ? '1.5s' : '3s',
            }} />
        )}
        <span className="block rounded-full relative z-10 transition-transform"
          style={{
            width: baseR * 2, height: baseR * 2,
            backgroundColor: dotColor,
            boxShadow: `0 0 6px ${dotColor}60`,
            transform: isHovered ? 'scale(1.4)' : 'scale(1)',
          }} />

        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-white/10 rounded-lg px-2.5 py-1.5 whitespace-nowrap z-20 pointer-events-none">
            <p className="text-xs text-white font-medium flex items-center gap-1.5">
              <Flag code={office.country_code} size={14} />
              {office.name}
            </p>
            <p className="text-[10px] text-gray-400">
              {activeMetric.format(val)}{activeMetric.suffix} &middot; {office.fte} FTE
            </p>
          </div>
        )}
      </div>
    )
  })}
</div>
```

### Projection

Standard Web-Mercator, viewBox-relative (the SVG viewBox is `0 0 2569.21 1266.16` but the projection produces 0–100% values that are applied as CSS `left: X%; top: Y%`):

```js
function latLngToPercent(lat, lng) {
  const x = ((lng + 180) / 360) * 100
  const latRad = (lat * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const maxMercLat = 85
  const maxMerc = Math.log(Math.tan(Math.PI / 4 + (maxMercLat * Math.PI / 180) / 2))
  const y = ((maxMerc - mercN) / (2 * maxMerc)) * 100
  return { x, y }
}
```

### Per-office nudge

The world-dotted.svg outline doesn't perfectly match a textbook Mercator (it's hand-drawn), so each office has an additional `dx / dy` percentage-point correction applied after projection:

```js
const POSITION_NUDGE = {
  london:    { dx: -3,    dy: 6.5 },
  paris:     { dx: -2.19, dy: 6.85 },
  bordeaux:  { dx: -2.87, dy: 6.71 },
  milan:     { dx: -2.59, dy: 6.95 },
  new_york:  { dx: -1.2,  dy: 5 },
  la:        { dx: -4.8,  dy: 5 },
  delhi:     { dx: -1.5,  dy: 5.7 },
  hong_kong: { dx: -1.8,  dy: 7.2 },
  sydney:    { dx: -2.2,  dy: 11.3 },
}

function getMarkerPosition(office) {
  const { x, y } = latLngToPercent(office.lat, office.lng)
  const n = POSITION_NUDGE[office.id] || { dx: 0, dy: 0 }
  return { x: x + n.dx, y: y + n.dy }
}
```

The nudges were calibrated visually by trial-and-error. For the IVG project, if the supplied UK SVG has known projection metadata, you can compute these as zero or skip them entirely. If it's hand-drawn, expect to need an equivalent nudge table.

### Marker sizing

The pulse halo radius is square-root scaled:

```js
const baseR = 6
const pulseR = maxVal > 0 && val > 0
  ? 12 + Math.sqrt(val / maxVal) * 38
  : 0
```

- Base dot is fixed at 12 px diameter (`baseR * 2`)
- Pulse halo radius ranges from 12 px (for the smallest visible value) to 50 px (for the max)
- Square-root scaling keeps large-vs-small offices distinguishable without the biggest dot crushing the smallest

### Hover label

Inline HTML floating above the dot — *not* SVG `<text>`. Anchored with `position: absolute; bottom: 100%; left: 50%; -translate-x-1/2 mb-2`. Has `pointer-events-none` so it doesn't intercept hover. No clamping at viewport edges (acceptable in practice because dots never sit right at the edge of a viewport-fitted SVG).

---

## Section 5 — View / theme switching

The whole "what is the user looking at" model lives in one big config constant: `MAP_CATEGORIES`. This is the most important data structure in the file.

```js
const MAP_CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    color: '#e8712b',
    metrics: [
      { key: 'staff', label: 'Staff',     desc: '…', getValue: o => o.fte,
        format: v => v.toFixed(0), suffix: ' FTE', render: 'icons' },
      { key: 'area',  label: 'Floor Area', desc: '…', getValue: o => o.gia_m2 || 0,
        format: v => v.toFixed(0), suffix: ' m²', render: 'bar' },
    ],
    toggles: [],
  },
  {
    id: 'estate',
    label: 'Estate',
    color: '#5B7B9A',
    metrics: [
      { key: 'estate_total', label: 'Total Estate',
        desc: 'Electricity + gas + fugitives + waste & water',
        getValue: (o) => /* sum of relevant Scope 2/3 categories */,
        format: v => v.toFixed(1), suffix: 't', render: 'bar' },
      { key: 'electricity', label: 'Electricity', ... },
      { key: 'gas_heating', label: 'Gas & Heating', ...
        filter: (o) => o.has_gas === true,   // ← per-metric office filter
      },
      { key: 'fugitive', label: 'Fugitive Emissions', ... },
      { key: 'grid_intensity', label: 'Grid Intensity', ...
        intensity: true,        // ← skip Per-FTE normalisation
        render: 'gridBar',      // ← bar colour = traffic-light grid intensity
      },
    ],
    toggles: ['total', 'perFte'],
  },
  /* travel, supply_chain, total — same shape */
]
```

### Per-metric properties

| field | type | meaning |
|---|---|---|
| `key` | string | unique within category; backs `activeMetricKey` |
| `label` | string | sub-pill text |
| `desc` | string | strap line between sub-pills and main panel |
| `getValue` | `(office) => number` | the raw metric value (typically tonnes — but Staff is a count, Grid Intensity is a ratio) |
| `format` | `(value) => string` | how the value renders in the leaderboard row + hover tooltip |
| `suffix` | string | appended in the hover tooltip only (not in the leaderboard row) |
| `render` | `'bar'`, `'gridBar'`, `'icons'`, `'stacked'` | which bar style to draw |
| `getBreakdown` | optional, `(office) => Record<string, number>` | for `'stacked'` render: returns the segment label → value map |
| `intensity` | bool | if true, `getDisplayValue` does not divide by FTE even in Per-FTE mode (Grid Intensity is already an intensity) |
| `filter` | optional, `(office) => boolean` | hide offices where this returns false (e.g. Gas & Heating skips no-gas offices) |
| `expandable` | bool | if true, the row shows a chevron to reveal an inline breakdown (currently only Total Emissions uses this) |

### Per-category properties

| field | type | meaning |
|---|---|---|
| `id` | string | route-able id, backs `activeCategoryId` |
| `label` | string | pill text |
| `color` | hex | the category accent — drives leaderboard bar fill, map dot fill, active pill background |
| `metrics` | array | the metrics to show as sub-pills |
| `toggles` | `['total', 'perFte']` or `[]` | which Total/Per-FTE toggles to expose. General has `[]` because Staff doesn't divide-by-FTE meaningfully. |

### Sub-toggle (Total / Per FTE)

It's a normalisation toggle, not a metric selector. Affects `getDisplayValue` only. When you switch from Total to Per FTE every bar shrinks/expands and re-sorts in the leaderboard, and every map dot resizes (because `pulseR` reads `getDisplayValue` too). The category accent doesn't change. The `intensity: true` metrics ignore the toggle.

### State management

All local React state inside `MapView.jsx`. No context, no URL params, no redux. Switching tabs resets `activeMetricKey` to the new category's first metric, `expandedOffice` to null, and `toggleMode` to `'total'` if the new category doesn't support `'perFte'`:

```js
const switchCategory = (id) => {
  const cat = MAP_CATEGORIES.find(c => c.id === id)
  if (!cat) return
  setActiveCategoryId(id)
  setActiveMetricKey(cat.metrics[0].key)
  if (!cat.toggles.includes(toggleMode)) setToggleMode('total')
  setExpandedOffice(null)
}
```

### Stacked-bar colour palettes

For the two metrics that render `'stacked'` (Travel by Mode, By Scope, By Theme) there's a tiny lookup → fallback colour scheme:

```js
const TRAVEL_MODE_COLORS = {
  flight: '#F2A93B', train: '#347373', taxi: '#D4891F', car: '#94A3B8',
  hotel: '#8b5cf6', bus: '#6b7280', tube: '#5B7B9A', tram: '#7A9AB5',
  fuel: '#6b7280', unknown: '#4b5563', road: '#6b7280',
}
const STACK_THEME_COLORS = {
  Estate: '#5B7B9A', Travel: '#F2A93B', 'Supply Chain': '#347373',
  'Scope 2': '#5B7B9A', 'Scope 3': '#6B4C9A',
}
function segColor(label, idx) {
  return STACK_THEME_COLORS[label]
    || TRAVEL_MODE_COLORS[label]
    || ['#F2A93B', '#347373', '#D4891F', '#5B7B9A', '#8b5cf6', '#6b7280'][idx % 6]
}
```

---

## Section 6 — Data shape

Per-office shape consumed by the Map module (extracted from `src/data/eoc_report_data.json`, populated by `pipeline/build_eoc_data.py`):

```ts
type Office = {
  id: string                    // 'london', 'paris', 'new_york', ...
  name: string                  // 'London'
  country: string               // 'United Kingdom'
  country_code: string          // 'GB' — feeds flagcdn.com
  lat: number
  lng: number
  site_ref: string              // internal reference
  gia_m2: number | null         // gross internal area
  fte: number
  has_gas: boolean              // drives the Gas & Heating filter
  gas_notes: string

  // Electricity
  electricity: {
    kwh: number
    grid_factor_kgco2e_per_kwh: number
    kgco2e: number
    data_quality: 'Activity-based' | 'Proxy' | …
    grid_factor_source: string
    grid_factor_year: number
  }

  // Fugitive HVAC refrigerant
  fugitive: {
    refrigerant_present: boolean
    proxy_factor_kgco2e_per_m2: number
    kgco2e: number
    data_quality: 'Proxy' | …
  }

  waste: { kgco2e: number, ... } | null

  // Per-scope categories — the core data the leaderboard reads
  emissions_by_category: {
    scope2_1_electricity: { name: string, kgco2e: number }
    scope3_2_procurement: { name: string, kgco2e: number }
    scope3_3_energy_related: { name: string, kgco2e: number }
    scope3_5_waste: { name: string, kgco2e: number }
    scope3_5_water: { name: string, kgco2e: number }
    scope3_6_travel: { name: string, kgco2e: number }
    scope3_7_commuting: { name: string, kgco2e: number }
    scope3_8_leased_assets: { name: string, kgco2e: number }
  }

  // Pre-aggregated totals
  total_kgco2e: number
  pct_of_total: number          // share of EOC's 488tCO2e
  kgco2e_per_fte: number

  // Optional: travel mode split (some offices have it, some don't)
  travel_by_mode?: {
    flight?: number, car?: number, train?: number, taxi?: number,
    hotel?: number, tube?: number, bus?: number, ...
  }

  // Modal-only (not consumed by the leaderboard/map)
  overview_sentence: string | null
  top_suppliers: Array<{ name, category, tco2e }> | null
  top_travel_corridors: Array<{ origin, destination, trip_count, tco2e }> | null
  commuting: { dominant_mode, dominant_mode_pct, avg_distance_km } | null
}
```

### Data lifecycle

- The whole `eoc_report_data.json` is imported statically at the top of `MapView.jsx`:
  ```js
  import reportData from '../../data/eoc_report_data.json'
  const { offices } = reportData
  const officeList = Object.values(offices)
  ```
- No prop drilling, no fetch on mount, no context. The data is bundled into the build.
- Office data is keyed by id (`offices.london`, `offices.paris`, ...) — `Object.values` to get the array.

### Missing data handling

- `getValue` always returns a number — null/undefined are defensively coerced (`o.electricity?.kgco2e || 0`).
- A metric-level `filter` hides offices entirely when the data isn't applicable (Gas & Heating).
- For the supplier / travel-corridor / commuting drill-downs in the modal, missing data renders an italic *"Insufficient data for this office — see Methodology"* placeholder rather than a zero.
- The map dot pulse halo is **suppressed** when value is 0 (`pulseR > 0` guard) — so zero-value offices show a base dot only, no pulse.
- "Approximation" markers in copy (e.g. `~`) are not used in the data — that's a design decision rather than a data-layer feature.

### Per-metric value formatting

The `format` function controls how each metric prints. Total Emissions uses `v.toFixed(0)` (no decimals, "488"), Estate sub-metrics use `v.toFixed(1)` ("44.0"), Grid Intensity uses `v.toFixed(3)` ("0.207"). The suffix (`'t'`, `' m²'`, `' kgCO₂e/kWh'`, etc.) is appended only in the hover tooltip, not in the leaderboard row (the row trusts the metric label + format alone).

---

## Section 7 — Animations and transitions

### Pulsating dots — `animate-ping` (Tailwind keyframe)

This is Tailwind's built-in ping animation. Equivalent to:

```css
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
.animate-ping { animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
```

We override the duration per-dot inline:

```jsx
<span className="absolute rounded-full animate-ping"
  style={{
    width: pulseR * 2, height: pulseR * 2,
    left: -(pulseR - baseR / 2), top: -(pulseR - baseR / 2),
    backgroundColor: dotColor + '22',   // ← 13% alpha for the halo
    animationDuration: isSelected ? '1.5s' : '3s',   // ← faster pulse when selected
  }} />
```

The translucent halo (`+ '22'` is hex alpha = `0x22 / 0xFF ≈ 13%`) lets the underlying map show through. The 3s default duration is slower than Tailwind's 1s default — at 1s every dot is visibly chaotic, at 3s it reads as ambient.

### Leaderboard reorder — framer-motion `layout`

```jsx
<motion.div key={office.id} layout
  transition={{ type: 'spring', damping: 26, stiffness: 300 }}>
```

framer-motion's `layout` prop captures the row's bounding box, recomputes it after a re-render, and animates the delta. When you swap categories or flip the Total/Per-FTE toggle, rows physically slide between their old and new sort positions over ~400ms. This is the signature "ohhh" moment of the module.

### Bar fill — no transition

Bars rerender at their new width immediately (`width: ${widthPct}%` is just a style change). No `transition: width` on the inner div. The visible motion happens via the parent row reordering, not the bar shrinking. If you want smoother width transitions, add `transition: width 0.4s ease` to the inner bar's style.

### Hover transitions

```jsx
className="... transition-colors"
className="... transition-transform"
```

Both use Tailwind's default ~150ms transition. The dot scales `1 → 1.4` on hover. The row background fades to `bg-white/[0.04]`. The chevron rotates 180° on click via `transition-transform`.

### Modal entrance

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}  /* backdrop */
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}  /* card */
```

Standard fade + 20px slide-up. ~300ms default.

### Inline breakdown expand

```jsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  className="overflow-hidden">
```

framer-motion auto-height for the chevron-expand row. Inside an `AnimatePresence` so exit animates.

---

## Section 8 — Dependencies

The `package.json` for the EOC project:

```json
{
  "dependencies": {
    "@tailwindcss/vite":  "^4.2.2",
    "d3":                 "^7.9.0",
    "framer-motion":      "^12.38.0",
    "html-to-image":      "^1.11.13",
    "lucide-react":       "^1.8.0",
    "react":              "^19.2.4",
    "react-dom":          "^19.2.4",
    "react-router-dom":   "^7.14.0",
    "recharts":           "^3.8.1",
    "tailwindcss":        "^4.2.2",
    "vite":               "^8.0.4"
  }
}
```

What the Map module actually uses (and why):

| Package | Used in map for | Swappable? |
|---|---|---|
| `react` 19 | base | n/a |
| `framer-motion` 12 | leaderboard `layout` reorder + AnimatePresence on modal + chevron expand + initial fade-in | **Yes** but only by losing the row-slide animation, which is the signature look. If IVG doesn't have framer-motion yet, it's worth adding for this specifically. ~22 KB gzipped. |
| `lucide-react` 1.8 | `User` icon (Staff metric), `X` (modal close), `ChevronDown` (expand chevron), `ChevronRight` (category row chevron in modal) | **Yes** — easily swapped for any icon set, or inline SVGs |
| `react-router-dom` 7 | not used inside the map itself — only the modal's deep-link `navigate('/inventory/themes?…')` | **Yes** — drop the navigate call if not needed |
| Tailwind 4 | every layout class | **Yes** but the file would need a full rewrite — every visual property is a Tailwind utility |

The Map module does **not** use:
- `d3` (despite being in dependencies — used elsewhere in the project, e.g. trajectory charts)
- `react-simple-maps` or any topology library
- Any geo-projection package — the Mercator function is six lines of vanilla JS
- `recharts` (the project uses it for other charts; the map is hand-rolled)
- `html-to-image` (used by export buttons elsewhere)
- CSS Modules, styled-components, plain CSS files

### Hard requirements for the receiving project

- React 18+ (uses hooks)
- Tailwind 3+ (utility classes — the Tailwind 4 specifics aren't used)
- framer-motion (if you want the layout-reorder animation)
- An outline SVG file at a known public path

---

## Section 9 — Known gotchas

1. **The position nudge table is hand-calibrated.** The world-dotted.svg outline isn't a textbook Mercator — Africa is slightly displaced, Europe sits a few degrees off. Every office's `dx/dy` came from eyeballing the dot and tweaking. If you regenerate or replace the outline, expect to recalibrate. For the IVG project with a hand-drawn UK SVG, plan an hour of calibration on the first cut.

2. **Marker overlap.** Paris and Bordeaux at world-scale are 5 px apart. The pulse halos collide and read as one dot. Acceptable on the EOC map because you can still hover and tooltip works, but in a UK-only view with 13 close sites this will be more visible. Consider: (a) shrinking the max pulse radius for UK scale, (b) a "spread out overlapping markers" routine on first render, (c) accepting it and relying on the leaderboard for ranking.

3. **The leaderboard is the source of truth, not the map.** Reading a value off the map is hard (halo size is sqrt-scaled). The leaderboard always carries the numerical truth. If you ever have to choose between making one prettier and the other clearer, prefer the leaderboard.

4. **`object-contain` letterboxes the SVG.** At narrow viewports the map gets a thick black band top + bottom. At wide viewports the map gets bands left + right. The marker positions are correct (they're percentages of the *image area*, which `object-contain` preserves) but visually feels like wasted space. The IVG version with a UK outline — narrower aspect ratio — will probably want `object-cover` instead, or a fixed aspect-ratio wrapper.

5. **`animate-ping` keeps running even when the dot isn't visible.** It's a CSS animation — no performance issue with 9 dots, but if the IVG version grows past ~50 markers per page consider pausing when the map is off-screen via Intersection Observer.

6. **The category accent colour drives the entire bar fill.** If two metrics inside the same category have wildly different value scales (e.g. Total Estate = 44t vs Grid Intensity = 0.207), the same colour is used. The metric `render: 'gridBar'` override solves it for Grid Intensity (each bar is coloured by its own value), but if you add a new metric where this matters, plan for an override.

7. **Tooltip clipping at top.** The hover tooltip uses `bottom-full` to sit above the dot. For dots near the top of the map (e.g. London at the top quadrant) the tooltip can extend above the map container. There's no edge-detection; in practice the page is taller than the tooltip so this never bites, but worth knowing.

8. **`offices` is `Object.values(offices)` — ordering is JS-engine-defined.** The leaderboard re-sorts every render so order from the source doesn't matter, but if you ever want to render the offices "in their natural order" (e.g. for a legend), don't trust the object-iteration order — use a published `displayOrder` field.

9. **No keyboard navigation on the leaderboard rows.** They're `<div>` with `onClick`, not `<button>`. Sub-pills are buttons. The modal close button is a button. If a11y matters, the rows need work.

---

## Section 10 — Recommended port strategy

### TL;DR

**Port with refactor.** Don't copy the file verbatim — the IVG context is different enough (UK-only, fewer themes, narrower data model) that a pasted MapView.jsx would carry significant dead code. But the structure and patterns port cleanly. Plan **~5–7 hours** including theme adaptation and the data wiring.

### Estimated effort

| Phase | Hours |
|---|---|
| Drop in the UK SVG + new latLng → percent function tuned to its viewBox | 1 |
| Stand up the new pageMap-style state machine inside `IVGMap.jsx` with IVG's themes | 1.5 |
| Wire the 13 sites' data into the leaderboard + map dot loop | 1 |
| Position-nudge calibration across the 13 sites | 1 |
| Theme accent palette + Per-FTE-equivalent toggle (Per Unit? Per m²?) | 1 |
| Modal — if IVG wants one. Strip-down version: 1 hour. Full three-tab version: 3 hours | 1–3 |
| **Total** | **5–7 hours** |

### File checklist for the IVG developer

Create:
- `src/components/portfolio/PortfolioMap.jsx` (or wherever in the Portfolio chapter the map lives) — copy of MapView.jsx, refactored
- `src/components/portfolio/SiteModal.jsx` — optional, copy of OfficeModal.jsx if IVG wants the deep-dive surface
- `src/components/shared/Flag.jsx` — only if IVG ever shows international sites; UK-only doesn't need flags. Replace flag-image column with a simple coloured dot keyed to site region (North / South / Midlands etc.) or remove entirely.
- `src/utils/projection.js` — extract `latLngToPercent` + `getMarkerPosition` so they're testable
- `public/uk-outline.svg` — the supplied UK outline
- Verify `framer-motion` is in `package.json`; install if not

Touch:
- `src/App.jsx` — add the `/portfolio/map` route
- Whatever provides IVG's design tokens — add the theme accent colours (electricity / gas / water / waste / carbon)

### Strategy choice

| Approach | When | Risk |
|---|---|---|
| **Port verbatim** | If IVG already has a near-identical themes structure and just needs sites pinned. Unlikely — the IVG data model is narrower. | Carries EOC-specific behaviour (the `has_gas` filter, the `intensity` flag) you'd have to manually neutralise. |
| **Port with refactor** ★ recommended | The themes are different but the leaderboard + map + view-toggle pattern is the right shape | Moderate. The bulk of the work is rebuilding `MAP_CATEGORIES` for IVG's themes and the data shape adapter. |
| **Strip down (leaderboard + dots only, no view switching)** | If the IVG MVP only needs one metric (e.g. carbon) and the multi-theme story can wait | Low effort but you're throwing away the module's signature interaction. Re-adding the view switcher later means re-doing the layout. |

### Traps to avoid

- **Don't use `react-simple-maps`** to render the UK outline. The supplied SVG is the better path — the maintenance load of `react-simple-maps` for one country and 13 dots is overkill.
- **Don't switch from CSS-percent positioning to SVG `<circle>` markers.** It's tempting to put everything inside one `<svg>` element, but the HTML tooltip becomes much harder (you'd need `<foreignObject>` or a separate overlay). Stick with `<img>` for the outline and absolute-positioned HTML divs for the markers — same as EOC.
- **Don't drop framer-motion for the row reorder.** You can replace AnimatePresence (the modal entrance) with CSS transitions, but the `layout` prop is what makes the leaderboard feel alive. If you must avoid framer-motion, look at the FLIP technique (`react-flip-toolkit` or hand-rolled) before falling back to no animation at all.

### Adapting the world-scale projection to a UK-supplied SVG

The receiving developer will need to **replace `latLngToPercent` with a UK-specific projection**. Two approaches:

**Option A — Reuse Mercator at UK scale:**
```js
// UK viewport: lng roughly -8 to +2, lat roughly 50 to 59
function latLngToPercentUK(lat, lng) {
  const LNG_MIN = -8, LNG_MAX = 2
  const LAT_MIN = 50, LAT_MAX = 59
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100
  // Mercator-y across the UK lat band
  const mercY = (lat) => Math.log(Math.tan(Math.PI/4 + (lat * Math.PI/180)/2))
  const y = ((mercY(LAT_MAX) - mercY(lat)) / (mercY(LAT_MAX) - mercY(LAT_MIN))) * 100
  return { x, y }
}
```
This works if the supplied UK SVG has roughly a Mercator-equivalent projection. Adjust `LNG_MIN/MAX/LAT_MIN/MAX` to match the SVG's viewBox extents.

**Option B — Hand-calibrated lookup:**
For 13 known sites, just hardcode the `{x, y}` percentages directly. No projection function needed. Less elegant but bulletproof if the SVG is hand-drawn:
```js
const SITE_POSITIONS = {
  'site_1': { x: 23.4, y: 67.2 },   // calibrated by eye
  'site_2': { x: 41.0, y: 58.1 },
  ...
}
```

Recommend **Option B for the first iteration** — it sidesteps the per-site nudge table entirely. Move to Option A only if the project grows past ~20 sites or needs to handle dynamic site additions.

---

## Section 11 — IVG-specific theme adaptation

Your proposed mapping is sensible. With small refinements:

| EOC theme | IVG equivalent | Notes |
|---|---|---|
| General | **Overview** — units, GIA, heating archetype, grid type | EOC's General has only Staff + Floor Area. IVG can do more: site age, units count, heating archetype, grid connection type. The `render: 'icons'` for unit count is nice. |
| Estate | **Energy** — electricity + gas combined kWh | Plus separate sub-metrics for: Electricity only, Gas only, Combined energy intensity (kWh/m²). The grid-intensity colour-coded `gridBar` render carries over perfectly. |
| Travel & Transport | — | Skip. No equivalent. |
| Supply Chain | — | Skip. No equivalent. |
| Total Emissions | **Carbon** — Scope 1+2+3 tCO₂e | Sub-metrics: Total, By Scope (1/2/3 stacked), By Source (gas / electricity / refrigerants / waste / water stacked) — mirrors EOC's "By Scope" / "By Theme" metrics. |

Plus the new IVG-specific themes you suggested:

| New IVG theme | Metric ideas |
|---|---|
| **Water** | Total m³, m³ per unit, % billed vs metered (data quality) |
| **Waste** | Total t, kg per unit per day, diversion-from-landfill % |
| **Data quality** | Completeness % per metric (electricity 100% / gas 70% / water 50% / waste 30%), reading frequency |

So your final IVG category bar would have **six categories** (vs EOC's five):

`Overview / Energy / Water / Waste / Carbon / Data quality`

### Per-FTE → Per Unit

EOC's "Per FTE" normalisation becomes IVG's **"Per Unit"** (per dwelling) or **"Per m²"**. The toggle keyword in the `toggles` array can be `'perUnit'` instead of `'perFte'`. The label in the toggle button likewise. The logic in `getDisplayValue` is identical: divide by a per-site denominator.

There's an argument for offering both ("Total / Per Unit / Per m²" as a three-way toggle) — useful for water (per unit is the right denominator) vs carbon (per m² is the convention in operational building carbon). The existing toggle array supports any number of options; just add a third option to `cat.toggles` for the categories where it makes sense.

### Data quality as a theme — bonus thought

Treating Data Quality as a top-level theme (not just a badge inside the modal) is a strong move for the IVG context where data completeness genuinely varies per site. The leaderboard sorted by *completeness %* surfaces the engagement priorities for the SRM equivalent. The grid-style coloured-by-value bar (`render: 'gridBar'`) translates cleanly — green = complete, amber = partial, red = missing.

---

## Appendix A — File paths reference (EOC repo)

```
src/components/map/MapView.jsx       — the whole module (541 lines)
src/components/map/OfficeModal.jsx   — deep-dive modal (456 lines)
src/components/map/OfficePopup.jsx   — unused stub (8 lines, can be deleted)
public/maps/world-dotted.svg         — stippled world outline (4192 lines, ~730KB)
src/data/eoc_report_data.json        — the data layer the map reads from
pipeline/build_eoc_data.py           — the script that builds the JSON from Fraser's spreadsheet
```

## Appendix B — A11y / responsive notes

- The leaderboard rows aren't keyboard-navigable (divs with onClick). For audit-grade a11y, convert to `<button>` elements and add focus styles.
- The map has no `aria-label` on the SVG or on the marker divs. Add `aria-label={`${office.name}, ${formatted-value}`}` to each marker div for screen-reader access.
- No responsive breakpoints — the leaderboard's `w-[380px]` and map's `flex-1` work fine down to ~1024px viewport. Below that the leaderboard wraps; consider stacking the leaderboard above the map at `< 768px`.
- The hover tooltip is the only thing that *can't* work on touch devices; tap-to-open-modal is the touch equivalent and it does work.

## Appendix C — A simple test card after porting

After the IVG developer has the module running, validate by checking:

1. All 13 sites appear in the leaderboard at the right ranks for the default metric
2. Switching categories re-sorts the leaderboard with visible row-slide animation
3. Switching Total ↔ Per Unit re-sorts AND resizes the map dots simultaneously
4. Hovering a row makes the corresponding dot scale up (`scale(1.4)`)
5. Hovering a dot makes the corresponding row highlight (`bg-white/[0.04]`)
6. Clicking a row or dot opens the site modal
7. Closing the modal returns to the previous selected/hovered state intact
8. Switching to a category whose first metric has a `filter` correctly hides the non-applicable sites (in EOC, switching to Estate → Gas & Heating hides 5 of 9 offices)

If any of these eight behaviours are broken, the port has missed something.

— End of handoff document.
