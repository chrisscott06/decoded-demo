# Brief 10 audit — Map polish

Focused polish on the Portfolio Map. Four scope items + two Chris inline asks
folded into the same brief.

Reference: [active/10_map_polish.md](../briefs/active/10_map_polish.md),
[LEADERBOARD_REORDER_EXTRACT.md](../briefs/LEADERBOARD_REORDER_EXTRACT.md).

---

## Parts 2-5 shipped together (one commit)

The four edits live in the same surfaces (Leaderboard.jsx, PortfolioMap.jsx,
index.css, mapThemes.js, chart-colors.js), so they ship in a single commit
to keep the diff coherent.

### Part 1 — Reorder animation: PENDING `npm install`

framer-motion is in `eir/package.json` (Brief 7) but NOT in
`eir/node_modules/`. Per brief escalation rule and Bible "no npm install
from Claude Code", **Part 1 ships as a follow-up after Chris runs
`cd eir && npm install`.** The existing CSS `nza-row-shift` keyframe
fallback continues to drive the reorder (one-shot fade-up on key change).
Once installed, the swap is a small follow-up commit:

```diff
- <div className="leaderboard" key={...} style={{...animation: 'nza-row-shift...'}}>
-   {rows.map(({site, ...}) => <div key={site.id} ...>)}
+ {rows.map(({site, ...}) => <motion.div key={site.id} layout
+   transition={{ type: 'spring', damping: 26, stiffness: 300 }} ...>)}
```

Plus removing the wrapper container `key` (which forces unmount) and the
`nza-row-shift` keyframe in `index.css`. The extract documents the exact
transition values + gotchas.

### Part 2 — EOC spacing recipe scaled taller

`Leaderboard.jsx` row:
- Fixed `height: 44` (EOC 36 → IVG 44 for the portrait map's extra vertical room)
- `gridTemplateColumns: '110px 1fr 72px'` (EOC 96 → 110 for "Blendworth Hills"; value 72)
- `gap: 8`, `padding: 0 8px`, `borderRadius: 4`
- Bar lane height: `16` (was 12)

`PortfolioMap.jsx` grid:
- Main grid `gridTemplateColumns: '380px 1fr'` (fixed leaderboard, map flex-1)
- Pill row gap reduced; sub-metric pills inline with description strap

The empty band above/below the 16 px bar inside the 44 px row is what gives
the airy feel.

### Part 3 — Fonts (IVG system, strip EOC)

Mapping applied per the brief table:

| Element | Token | File ref |
|---|---|---|
| Theme pills (variant 'theme') | `var(--font-heading)` 14 px / 500 | PortfolioMap.jsx PillBar |
| Sub-metric pills (variant 'sub') | `var(--font-heading)` 12 px / 500 + 1.5 px underline | PortfolioMap.jsx PillBar |
| Total/Per-Unit/Per-m² toggle | `var(--font-heading)` 10 px / 500 | PortfolioMap.jsx ToggleBar |
| Site name in row | `var(--font-body)` 14 px / 500 | Leaderboard.jsx (was --font-heading) |
| Numeric value | `var(--font-mono)` + `font-variant-numeric: tabular-nums` | Leaderboard.jsx (confirmed) |
| Description strap | `var(--font-body)` 12 px | PortfolioMap.jsx inline |

EOC font strings removed/retired:
- `--font-display: 'DM Serif Display'` in `index.css` → retired (was unused)
- `FONT_DISPLAY = "'DM Serif Display'..."` in `tokens/fonts.js` → re-aliased to Stolzl (preserves the export for any straggler imports; the actual EOC font name is gone)

Comments mentioning JetBrains/DM remain as **explanatory** ("explicitly NOT used"). No actual font-stack values reference them.

### Part 4 — Darker dark-register background

Single `:root` token change in `index.css`:

```
- --color-theme-base: #1A2440;
+ --color-theme-base: #0F1629;
```

Cascades through the dark register everywhere (map, Insights, GRESB, top nav).
Cream pages untouched. Coral, methodology palette, and bar tracks all read
cleanly on the deeper navy — slight contrast boost for white text, no
element lost legibility.

### Part 5 (Chris inline) — theme palette + sidebar font

**Palette refresh.** Seven `--theme-*` CSS tokens added to `:root` and seven
`MAP_THEME_HEX` constants in `chart-colors.js` updated:

| Theme | Token | Hex | Was |
|---|---|---|---|
| Overview | `--theme-overview` | `#5B7B9A` | unchanged |
| **Energy** | `--theme-energy` | **`#5BA3D9` blue** | was coral |
| Water | `--theme-water` | `#5BBFB5` teal | unchanged |
| **Waste** | `--theme-waste` | **`#7CC470` green** | was amber |
| **Carbon** | `--theme-carbon` | **`#E5732A` orange** | was scope-3 purple |
| **Meters** | `--theme-meters` | **`#D49AB0` pink** | was accent-secondary purple-grey |
| Data quality | `--theme-dq` | `#347373` dark teal | unchanged |

**Sub-metric tint overrides.** `mapThemes.js` Energy sub-metrics now carry
their own `color` + `colorHex`:

| Sub-metric | Token | Hex |
|---|---|---|
| Electricity | `--metric-electricity` | `#E8C547` yellow |
| Gas | `--metric-gas` | `#D85F4D` warm red |

Plumbing: Leaderboard's `themeColor` and MapMarkers' marker colour both
prefer `activeMetric.colorHex` over `activeCategory.colorHex` when present.
The bar fill / pill tint / map dot all follow the active sub-metric's
colour if it has one; otherwise they fall back to the theme accent.

**Sidebar font.** In `index.css`:
- `.sidebar-header` font swapped from `var(--sans)` → `var(--font-heading)` (Stolzl Medium, kept 500)
- `.sidebar-item` font swapped from `var(--sans)` → `var(--font-heading)` + `font-weight: 400` (Stolzl Book per Chris's ask)

### Browser verification (MCP, 1440×900)

| Check | Result |
|---|---|
| Energy theme | ✓ pill + bars + dots all blue |
| Electricity sub-metric | ✓ leaderboard + dots all yellow |
| Gas sub-metric | ✓ leaderboard + dots all warm red, 6 gas sites only |
| Waste theme | ✓ pill + bars + dots all green |
| Carbon theme | ✓ pill + bars + dots all orange |
| Meters theme | ✓ pill pink-bordered (active state) |
| Background | ✓ noticeably deeper navy across map page, top nav, Insights/GRESB inherit automatically |
| Site Detail sidebar | ✓ Stolzl Book on the row labels (distinct character shapes vs prior Inter) |
| Cream pages | ✓ Landing + Site Detail still cream (no register regression) |
| No-scroll at 1440×900 | ✓ map page fits; leaderboard scrolls internally if 13 rows × 44 px overflow the column |
| Compact pills | ✓ no longer dwarfing labels; 14/12/10 px ladder visible |
| Sub-metric underline | ✓ active sub-pill underlined in theme/metric tint |
| Falsifiability | `grep "#[0-9a-fA-F]{3,6}" eir/src/components/portfolio` → 0; `grep "JetBrains|DM Sans|DM Serif" eir/src` → 0 in values (doc-comments only) |
| Build | ✓ `npm run build` clean (~1.0 s) |

### Decisions noted for Chris

- **Overview** kept slate-blue `#5B7B9A` (you didn't specify; sits as neutral umbrella between the other six themed colours).
- **Data quality** kept dark teal `#347373` (you didn't specify; visually distant from Waste's green).
- **Stolzl Book** = Stolzl family at `font-weight: 400` (Book is the 400 weight per `fonts.css`). Applied via `--font-heading` + explicit `font-weight: 400` on `.sidebar-item`.
- **Sub-metric tint scheme** means the bar fill for Electricity/Gas no longer matches the Energy theme accent — that's deliberate. If you'd rather all Energy sub-metrics stay blue, drop the `color`/`colorHex` on those two entries in `mapThemes.js` and the inheritance falls back to theme blue.

### Files touched (Parts 2-5)

- `eir/src/components/portfolio/Leaderboard.jsx` — row geometry (44 px), columns, fonts, themeColor sub-metric override
- `eir/src/components/PortfolioMap.jsx` — PillBar variant=theme/sub, ToggleBar resize, 380 px fixed leaderboard column
- `eir/src/components/portfolio/MapMarkers.jsx` — activeMetric.colorHex override
- `eir/src/index.css` — `--color-theme-base` darken, retire `--font-display`, add 7 theme + 2 metric tokens, sidebar fonts
- `eir/src/lib/mapThemes.js` — all 7 themes repointed at the new tokens; Electricity + Gas sub-metric tint overrides
- `eir/src/tokens/chart-colors.js` — `MAP_THEME_HEX` repalleted; new `METRIC_HEX` export
- `eir/src/tokens/fonts.js` — `FONT_DISPLAY` re-aliased to Stolzl

### Files touched (brief lifecycle)

- `docs/briefs/active/10_map_polish.md` (new — landed in this brief)
- `docs/briefs/LEADERBOARD_REORDER_EXTRACT.md` (moved from repo root)
- `docs/briefs/current.md` (repointed)

### PASS (excluding Part 1)

- ✓ Spacing airy, pills compact, 44 px rows
- ✓ Fonts correct (Stolzl pills / Inter names / IBM Plex Mono values)
- ✓ Background deeper across dark register, cream unchanged
- ✓ Theme palette refreshed; Electricity/Gas sub-metric tints work
- ✓ Site Detail sidebar in Stolzl Book
- ✓ No scroll at 1440×900
- ✓ Build clean; 0 raw hex in components

### Pending

- Part 1 (framer-motion reorder slide) — Chris runs `cd eir && npm install`,
  then a follow-up commit swaps `<div>` → `<motion.div layout transition={{
  type:'spring', damping:26, stiffness:300 }}>` per the extract.
