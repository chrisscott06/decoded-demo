# Brief 8 audit — Exec-summary landing + Meters map theme

Two-part pre-demo brief. Additive to Brief 7's working map. Push after each
Part.

Reference: [active/08_landing_and_meters.md](../briefs/active/08_landing_and_meters.md),
design note D10 (Meters theme) + D11 (landing).

---

## Part 1 — Exec-summary landing (D11)

### `eir/src/components/Landing.jsx` (new)

Cream-register front door wrapped in `BodyPageLayout`
(`activePrimary="portfolio"`, `activeSecondary={null}`). Two-column grid
`gridTemplateColumns: 'minmax(360px, 520px) 1fr'`, gap 64 px, max-width
1280 px, vertically centred — mirrors `nzai-demo/src/pages/Home.jsx`
structure but with plain CSS (no Tailwind).

**Left column — narrative (verbatim per brief):**
- Eyebrow: `PORTFOLIO OVERVIEW · CY2025` in `var(--color-nza-coral)`,
  `var(--font-heading)`, `var(--text-subheading)`, uppercase,
  letter-spacing 2.4, mb 16
- Heading: "A single view of energy, water and waste across the IVG
  portfolio." in `var(--font-heading)`, `var(--text-chapter)`,
  `var(--color-theme-base)`, mb 24
- Body paragraph 1: cream-on-navy 70 % opacity, `var(--text-body)`, mb 12
- Body paragraph 2: same, mb 32
- CTA button: coral background, cream text, `var(--font-heading)`,
  `12px 18px` padding, 10 px radius. Hover swaps to
  `--color-theme-accent-primary`. ArrowRight lucide icon. Click navigates
  to `/portfolio/map` via the `navigate` prop (falls back to
  `window.history.pushState` if missing).

**Right column — 4 utility cards (2 × 2):**
Card shape: `rgba(26,36,64,0.03)` background, `rgba(26,36,64,0.10)` border,
12 px radius, 24 px padding. Each card is a flex column gap 12 px:
- Lucide icon at top (32 px stroke 1.5, coral)
- Big value (`--text-h1`, Stolzl Medium, navy) + unit inline (muted base
  size)
- Label (uppercase, letter-spacing 0.6, muted)
- Nugget (`--text-sm`, lineHeight 1.55, muted-darker)

**Verified figures (from `pipeline/dist/eir/reconciliation.json` and
`portfolio.json` — `step 1.4` per brief):**

| Card | Value | Source field | Verified |
|---|---|---|---|
| Electricity | **4.5M kWh** | `reconciliation.portfolio.eco_landlord_elec_kwh` = 4,509,907.29 | ✓ |
| (nugget) | "Total estate use ~8.3M kWh — the ~3.9M gap is resident energy not billed to IVG." | `arb_elec_kwh` = 8,309,120.9; `derived_resident_elec_kwh` = 3,889,275.52 | ✓ |
| Gas | **7.6M kWh** | `reconciliation.portfolio.eco_gas_kwh` = 7,635,742.97 | ✓ |
| (nugget) | "Total estate ~9.4M kWh; communal heating across the gas-served sites." | `arb_gas_kwh` = 9,353,853.0 | ✓ |
| Water | **17.9k m³** | `portfolio.water.total_consumption_m3` = 17,859 | ✓ |
| (nugget) | "Confirmed at 3 sites, partial at 4, outstanding at 6." | brief-verbatim from inventory | ✓ |
| Waste | **—** (em-dash) | `portfolio.waste.total_tonnage` is `null` — **no tonnage invented** | ✓ |
| (nugget) | "BIFFA and Ash tonnages being consolidated; figures to follow." | brief-verbatim | ✓ |

**Strap (below cards, centred, muted):**
"`{portfolio.site_count}` sites · `{portfolio.total_gia_m2}` m² GIA ·
`{portfolio.total_units_completed}` units · CY2025" →
"13 sites · 217,314 m² GIA · 961 units · CY2025" ✓

### `eir/src/App.jsx` route change

Brief 6's `/`→`/portfolio/map` redirect narrowed to `/portfolio` and
`/portfolio/overview` only. The root path now renders `<Landing>` directly:

```jsx
if (path === '/' || path === '') {
  return <Landing navigate={navigate} currentSiteId={currentSiteId} />
}
```

Added the `Landing` import at the top of the imports block alongside the
other component imports.

### Browser verification (MCP, 1440×900)

- ✓ `/` renders the cream landing with all four cards and the strap below
- ✓ Cream-register two-bar nav: Portfolio (active) | Site | Insights | GRESB +
  Map | Sites | Comparisons
- ✓ No horizontal scroll, no vertical scroll at 1440×900 (fits in one screen)
- ✓ CTA "Explore the portfolio map →" navigates to `/portfolio/map` and
  the dark-register map renders (cream→dark register transition works
  via `BodyPageLayout`'s `useEffect` cleanup removing `theme-cream` from
  the body)
- ✓ No app console errors (only the recurring Chrome-extension
  "asynchronous response" noise unchanged from Brief 7)

### Falsifiability

```
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/Landing.jsx eir/src/lib/mapThemes.js
  → 0

cd eir && npx vite build
  → ✓ built in 951 ms — 758.5 kB JS / 28.4 kB CSS (gzip 210 / 5.6 kB)
  → no errors, only the existing chunk-size advisory
```

### Files touched

- `eir/src/components/Landing.jsx` (new)
- `eir/src/App.jsx` (import added; `/`→`/portfolio/map` redirect narrowed
  to `/portfolio` and `/portfolio/overview`; root path now renders
  `<Landing>`)
- `docs/audit/08_landing_and_meters.md` (this file)

### PASS

- ✓ `/` shows the cream exec-summary, narrative left, 4 cards right
- ✓ Figures match real data; waste = "—"; elec + gas nuggets tell the
  billed-vs-total story
- ✓ CTA navigates to `/portfolio/map`
- ✓ No raw hex; no console errors; renders at 1440×900 without scroll
- ✓ Browser-verified via MCP

→ Push after this Part per the brief.

---

## Part 2 — Meters map theme (D10)

### Accessor signature extended

Brief 7's accessor signature `(site, energy, water, waste, carbon)` extended
to `(site, energy, water, waste, carbon, mpanRegister)`. Other themes ignore
the 6th arg. The change propagates through three callsites:

- `Leaderboard.jsx` — main row accessor + the optional `stackAccessor`
- `MapMarkers.jsx` — marker accessor
- `PortfolioMap.jsx` — hover-card `useMemo`

### `eir/src/lib/mapThemes.js`

Added the **Meters** theme as the 7th entry (after Carbon, before Data
quality):

| Metric key | Label | Render | Notes |
|---|---|---|---|
| `composition` | Composition | `stacked` (array) | Each meter into ONE bucket by precedence: Void/Inactive → Gas → HH → NHH. Returns `[{label,value,color}]` directly — Leaderboard renders these as proportional segments. Coral/pink/amber/grey-translucent. |
| `total_utility` | Total utility | `bar` | All meters per site (length of `reg[site.id]`). |
| `landlord_meters` | Landlord meters | `bar` | Filtered to `category` containing `landlord`. |
| `hh_coverage` | HH coverage | `gridBar` `goodHigh:true` | `% of landlord meters with type === 'HH'`. Reverse colour scale (high=green). |

Accent: `var(--color-theme-accent-secondary)` (`#A896C4` purple-grey) so
the theme is visually distinct from Carbon's `--color-scope-3` purple.
Toggles array is empty `[]` — the toggle bar is suppressed in PortfolioMap
because `activeCategory.toggles.length > 1` is false.

`MAP_THEME_HEX.meters` added to `chart-colors.js` using the existing
`COLOR_THEME_ACCENT_SECONDARY` constant — no new raw hex.

### `eir/src/components/portfolio/Leaderboard.jsx`

Three additive changes (no existing logic removed):

1. **Array-shaped accessor support** — when `raw` is an Array, `displayValue`
   becomes the segment-total (so sort + bar-width still work). The stacked
   render branch detects `Array.isArray(raw)` and renders the segments
   directly from the array (Brief 8 Composition path); otherwise it falls
   through to the existing `stackKeys + stackAccessor` path (Brief 7 Carbon
   by-scope path). Both Carbon and Meters Composition coexist.
2. **`goodHigh` flag honoured** for gridBar — aliased to
   `colorScale: 'reverse'` in both the renderer's gridBarColor call AND in
   the MapMarkers dot-colour path.
3. **Function `format` support** — when `metric.format` is a function it's
   called with `raw` (so it can receive an array of segments for
   Composition, or a number for the bar metrics). Suffixed with
   `metric.unit` if present.

Stacked tooltip simplified — no longer calls `formatValue(seg.value,
metric.format)` because `metric.format` may now be a function expecting an
array, not a single value.

### `eir/src/components/portfolio/MapMarkers.jsx`

Three additive changes:

1. **6th accessor arg `mpanRegisterById`** propagated through.
2. **Array-raw → segment-total** for displayValue parity with Leaderboard.
3. **Meters-theme dot encoding (D10)** — special branch when
   `activeCategory.id === 'meters'` regardless of sub-metric:
   - Size = sqrt of (meter count / max meter count across visible sites)
   - Colour = traffic-light by HH coverage % of landlord meters, on the
     0–100 % absolute scale (reverse scale: high = green). Sites with zero
     landlord meters fall back to `COLOR_RISK_NO_DATA`.
4. `goodHigh` also honoured here for gridBar themes generally (not just
   Meters) — useful symmetry.

### `eir/src/components/PortfolioMap.jsx`

- Imported `@pipeline-data/mpan_register.json` as `mpanRegisterById`
- Passed to both `<Leaderboard>` and `<MapMarkers>` as the new
  `mpanRegisterById` prop
- Hover-card `useMemo` now passes the register to `activeMetric.accessor`
  and computes a segment-total for array-shaped returns

### Browser verification (MCP, 1440×900)

| Check | Result |
|---|---|
| 7 theme pills incl. Meters | ✓ Overview / Energy / Water / Waste / Carbon / **Meters** / Data quality |
| Meters → Composition | ✓ Stacked bars. Ledian Gardens (69 meters) dominated by void grey, with a tiny coral HH + amber Gas slice. Eldersewell (52) same shape. Millfield Green (1) pure coral. Austin Heath (3) coral+amber (1 HH + 2 Gas). |
| Meters → Total utility | ✓ Purple-grey bars sized by total count; Ledian 69 at top, Millfield 1 at bottom |
| Meters → Landlord meters | (tested, same shape with landlord-only counts) |
| Meters → HH coverage | ✓ gridBar reverse colours: green for 100 % (Millfield, Blendworth), amber for 67 % / 40 % (Ampfield, Eldersewell), red for 8–33 % (Austin/Gifford/Ledian/Bramshott/Durrants/Great Alne/Millbrook) |
| Map dots in Meters theme | ✓ Sized by count, coloured by HH coverage. Large red dot at Ledian (low coverage), small green dot at Millfield (high coverage), amber at Ampfield. Same encoding across all 4 sub-metrics — the dot is the anatomy view. |
| Carbon by-scope stacked | ✓ Unchanged (red/teal/purple segments) — no regression from the Leaderboard refactor |
| Other 6 themes | ✓ Unchanged |

### Falsifiability

```
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/portfolio \
  eir/src/components/PortfolioMap.jsx eir/src/lib eir/src/components/Landing.jsx \
  --include="*.jsx" --include="*.js"
  → 0

cd eir && npx vite build
  → ✓ built in 1.01 s — JS / CSS within Brief 7 envelope plus mpan_register
    JSON bundled in
```

### Files touched

- `eir/src/lib/mapThemes.js` — Meters theme added; accessor signature note
- `eir/src/tokens/chart-colors.js` — `MAP_THEME_HEX.meters` added
- `eir/src/components/portfolio/Leaderboard.jsx` — 6th arg, array-stacked,
  goodHigh, function-format
- `eir/src/components/portfolio/MapMarkers.jsx` — 6th arg, array-stacked,
  Meters dot-encoding branch, goodHigh
- `eir/src/components/PortfolioMap.jsx` — load + pass `mpan_register.json`;
  hover-card uses 6th arg + array-total
- `docs/audit/08_landing_and_meters.md` (this section)

### PASS

- ✓ Map shows 7 theme pills incl. Meters
- ✓ Meters → Composition: stacked bars matching the brief's expected story
- ✓ Meters → HH coverage: gridBar green (high) → red (low)
- ✓ Map dots in Meters theme: sized by count, coloured by coverage
- ✓ Other 6 themes unchanged
- ✓ No raw hex; build clean; browser-verified via MCP

→ Push after this Part per the brief.
