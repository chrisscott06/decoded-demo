# Brief 13 audit — Chart rendering fixes + Carbon contrast

Three visual defects flagged by the 24 May whole-tool review. Brief 12's
audit explicitly logged #2 and #3 as known-for-next-brief. Brief 13 closes
all three and adds a CLAUDE.md convention note so the same pattern can't
silently regress.

Reference: [active/13_chart_rendering_fixes.md](../briefs/active/13_chart_rendering_fixes.md).

---

## Part 0 — Defect reproduction (BEFORE state, 2026-05-24)

Dev server on port 5183; viewport 1440×900. All three defects reproduced
exactly as the brief described:

| Page | BEFORE state |
|---|---|
| `/portfolio/comparisons` | Monthly bar chart visible as "Y-axis tick `611k` + legend strip" only, no bars rendered. Chart wrapper height collapsed to ~140 px. |
| `/site/austin-heath/carbon` (right Panel: "Where it sits") | Pie collapsed to ~5 px stripe. Legend rendered, 565.9 overlay rendered, pie circle invisible. (The brief labels this Defect #2 as "Reconciliation pie" but L787 is in fact Carbon — Reconciliation has no PieChart, only a BarChart at L1078. Diagnosis confirmed correct, page label was the brief's miss-label.) |
| `/site/austin-heath/carbon` (left Panel: "Scope breakdown") | Three coloured `.scope-dot` circles rendered (theme-agnostic hex fills); ALL `.carbon-label` / `.carbon-value` / `.carbon-unit` text invisible (cream-on-cream `-on-dark` tokens). Plus `.callout-card` faded-coral background with invisible body text. |

All three confirmed before any code change; proceeded to Parts 1-3.

---

## Part 1 — Comparisons chart height chain (2026-05-24)

### Root cause

The flex chain from `.dashboard (100vh)` → `.dashboard-body (flex:1)` →
`.dashboard-main (flex:1)` → `.page.page-noscroll (flex:1, display:flex
column, overflow:hidden)` → `.comp-chart-panel (flex:1, min-height:0)`
→ `.panel-body (flex:1, min-height:0)` → inner `<div style={{flex:1,
minHeight:0}}>` → `<ResponsiveContainer height="100%">` was technically
complete on paper.

In practice, the PageNarrative (~190 px) + two stat Cards (~200 px) above
the chart consumed enough of the 744 px effective viewport that the
remaining height resolved to ~140 px — just enough for the X-axis tick
labels (`height={56}`, `angle={-45}`) + Legend, with **zero** room for the
bars. Recharts dutifully rendered the chart at that height; the bars were
mathematically present but visually zero.

### Fix

Two minimal-correct changes (per brief Principle 3):

1. **Explicit `min-height: 280px` floor** on `.page-noscroll .comp-chart-
   panel .panel-body` — guarantees usable rendering even when siblings are
   tall; `flex: 1` still lets the chart grow above 280 px on roomier
   viewports.
2. **Removed PageNarrative from `/portfolio/comparisons`** — the sub-tab
   label + Site A/B pickers + paired Cards already make the page's purpose
   obvious; the chart is the headline. Frees ~190 px so the 280 px floor
   fits cleanly within 1440×900 no-scroll.

### AFTER (verified in browser)

Austin Heath (coral) peak Jan 2025 = 611 k kWh, Millfield Green (teal)
steady ~100 k/month line. Full X-axis (Oct 2024 → Dec 2025), Y-axis ticks
(0/200k/400k/611k), legend at bottom. Page fits 1440×900 with no scroll.

### Files touched (Part 1)

- `eir/src/index.css` (+8 lines: `min-height: 280px` + tokenised comment)
- `eir/src/App.jsx` (-1 line: PageNarrative removed from Comparisons)

**Commit:** `d225ed8 Brief 13 Part 1: fix Comparisons chart height chain`

---

## Part 2 — Carbon "Where it sits" pie (was labelled "Reconciliation pie")

### Brief miss-label

The brief says "#2 Reconciliation pie (Insights → Reconciliation), App.jsx
~L787". L787 is the right Panel in `SiteCarbon` (the only PieChart in the
file). InsightsReconciliation has no PieChart, only a BarChart at L1078.
File:line was right, page label was wrong. Fixed the actual L787 chart.

### Root cause (two issues stacked)

**(1) ResponsiveContainer reported width(-1)/height(-1)**

Confirmed via the dev-server console:
```
[vite] [console.warn] The width(-1) and height(-1) of chart should be
greater than 0, please check the style of container, or the props
width(100%) and height(100%), or add a minWidth(0) or minHeight(undefined)
or use aspect(undefined) to control the height and width.
```

Recharts 3.x's ResponsiveContainer measures its parent via ResizeObserver.
When the parent (Panel body inside a `.page-2col` grid cell, with a sibling
overlay `<div style={{ marginTop: -160 }}>` competing for layout) auto-
sizes to its content, the measurement returns `-1` and ResponsiveContainer
gives up — the chart renders at zero size. This is the "opposite failure
mode" to Defect #1 that the brief warns about: there the percentage chain
didn't resolve; here the chart container had no track reserved.

**(2) Recharts 3.x animation bug**

Even after sizing the chart correctly, the pie still wouldn't render.
Inspecting the DOM: the `.recharts-pie-sector` `<g>` elements existed but
their inner `<path>` had no `d` attribute — Recharts had started the
animation, computed no shape, and never committed the final paint. Setting
**`isAnimationActive={false}`** on the `<Pie>` makes it paint at its final
shape immediately. This is a known Recharts 3.x animation pipeline issue.

### Fix

- Skipped ResponsiveContainer entirely; used `<PieChart width={420}
  height={320}>` directly. The pie is a fixed-size visualisation — it
  doesn't need to be fluid.
- Passed `isAnimationActive={false}` on the `<Pie>`.
- Used the data array's `fill` property directly (Recharts auto-picks it
  up); dropped the `<Cell>` children that were only there for styling
  (they weren't relevant to the rendering bug).
- Passed `theme="cream"` to the Panel so its border + title text adopt
  cream-register tokens.

### AFTER (verified in browser)

Donut chart renders: coral Scope 1 (80% / 451.84 tCO₂e), teal Scope 2
(17% / 94.51), navy Scope 3 (3% / 19.52). "565.9" coral overlay centered
in donut hole. Legend below with all three labels.

### Files touched (Part 2)

- `eir/src/App.jsx` (Pie rewrite + `theme="cream"` on both Carbon Panels)

**Commit:** `660621e Brief 13 Part 2: fix Carbon "Where it sits" pie`

---

## Part 3 — Carbon tab cream-on-cream contrast

### Root cause

`SiteCarbon`'s `.carbon-*` classes were authored when the whole site was
dark register. The Brief 6 cream-register migration kept the `-on-dark`
tokens on these classes, so on the now-cream Site Detail page every
`.carbon-label`, `.carbon-value`, `.carbon-unit`, `.carbon-il`, `.carbon-iv`
and the `.callout-card` body rendered cream-on-cream (invisible). The
coloured `.scope-dot` circles rendered (theme-agnostic hex fills), the
totals stayed coral (also theme-agnostic) — but everything else vanished.

Two inline `color: 'var(--text-muted-on-dark)'` references in
`SiteCarbon` had the same issue (the overlay caption + the "Scope 3 Cat 5
pending" caption).

### Fix

Scoped `body.theme-cream` overrides in `index.css` mapping every
`.carbon-*` class that referenced `-on-dark` to its `-on-cream`
counterpart, plus a cream variant for `.callout-card`. Two inline styles
in App.jsx flipped to `-on-cream`. **No new tokens introduced** — every
override uses an existing token (brief Principle 1).

### AFTER (verified in browser)

All scope labels + values legible (Scope 1 451.8 tCO₂e, Scope 2 94.5,
Scope 3 19.5, Total 565.9). Intensity table readable (39.8 kg/m² + 4.64
t/unit). Callout visible: *"Portfolio median intensity is 12.8 kg/m².
This site is 211% above median."* Scope 3 Cat 5 pending caption readable.

### Files touched (Part 3)

- `eir/src/index.css` (+22 lines: 8 cream overrides + .callout-card)
- `eir/src/App.jsx` (2 inline-style flips: -on-dark → -on-cream)

**Commit:** `781aa03 Brief 13 Part 3: Carbon tab on-cream contrast`

---

## Part 4 — Guard + walkthrough + close

### Collateral fix — Recharts 3.x animation bug, same pattern in 5 Bars

During the walkthrough the Comparisons chart's bars vanished again after
HMR. DOM inspection showed 28 `.recharts-bar-rectangle` elements all at
0×0. Same root cause as Part 2's pie: **Recharts 3.x's animated Bars
get stuck mid-animation with zero-size rectangles**. Repro'd on:

| Route | Bars in DOM | All 0×0? |
|---|---:|---|
| `/portfolio/comparisons` | 28 | ✓ |
| `/insights/reconciliation` | 24 | ✓ |
| `/site/austin-heath/energy` | 28 | ✓ |

Universal fix: `isAnimationActive={false}` on every `<Bar>` in the
codebase. Applied to:
- `App.jsx` L467-468 (Comparisons)
- `App.jsx` L1113-1114 (Reconciliation per-site)
- `EnergyChart.jsx` L102-104 (Site Energy monthly stacked)
- `LoadInspector/DataQualityView.jsx` L105 (coverage)
- `LoadInspector/MonthlyView.jsx` L59 (monthly kWh)

8 `<Bar>` elements total.

### Falsifiability guard — CLAUDE.md Rule 10

Added a new Process Rule 10 to CLAUDE.md documenting the
ResponsiveContainer height convention plus the Recharts 3.x quirks:

> A Recharts `<ResponsiveContainer width="100%" height="100%">` is only
> safe when its immediate parent has an explicit resolved pixel height —
> typically `<div style={{ height: NNN }}>` directly above it…
>
> Two patterns are acceptable: **Fluid chart** (parent div with explicit
> height + ResponsiveContainer 100%/100%) or **Fixed chart** (no
> ResponsiveContainer; use the chart's own width/height props). Required
> for Recharts 3.x `<PieChart>`. Also requires `isAnimationActive={false}`
> on Pie and Bar in 3.x.
>
> Falsifiability: `grep -rn 'height="100%"' eir/src` — every hit must
> have a resolved-height parent confirmed by visual walkthrough.

### Falsifiability enumeration

`grep -rn 'height="100%"' eir/src --include="*.jsx"` → 9 hits, all
verified safe:

| File:line | Parent | Safe? |
|---|---|---|
| App.jsx:439 (Comparisons BarChart) | `.page-noscroll .comp-chart-panel .panel-body { min-height: 280px }` (Part 1) | ✓ |
| LoadInspector/DailyProfileView.jsx:76 | `<div style={{ height: 240 }}>` | ✓ |
| LoadInspector/DailyProfileView.jsx:96 | `<div style={{ height: 240 }}>` | ✓ |
| LoadInspector/DataQualityView.jsx:99 | `<div style={{ height: 240 }}>` | ✓ |
| LoadInspector/DurationCurveView.jsx:37 | `<div style={{ height: 320 }}>` | ✓ |
| LoadInspector/MonthlyView.jsx:37 | `<div style={{ height: 320 }}>` | ✓ |
| LoadInspector/OverviewView.jsx:109 | `<div style={{ height: 200 }}>` | ✓ |
| LoadInspector/OverviewView.jsx:146 | `<div style={{ height: 200 }}>` | ✓ |
| LoadInspector/TimeSeriesView.jsx:148 | `<div style={{ height: 380 }}>` (in Inspector view container) | ✓ |

### Full-tool walkthrough (1440×900)

| Route | Status |
|---|---|
| `/` Landing | ✓ Hero + 4-quadrant infographic; data-vintage badge |
| `/portfolio/map` | ✓ Energy theme leaderboard + UK dot-map + totals strip |
| `/portfolio/sites` | ✓ Sortable 13-site table with status badges |
| `/portfolio/comparisons` | ✓ **FIXED** Defect #1 — full bar chart |
| `/insights/reconciliation` | ✓ **FIXED** collateral — per-site bars |
| `/insights/voids` | ✓ £49,134/year + 82 high-cons voids + site table |
| `/insights/data-quality` | ✓ 13×4 heatmap + RFI list |
| `/site/austin-heath/overview` | ✓ |
| `/site/austin-heath/energy` | ✓ **FIXED** collateral — stacked monthly bars |
| `/site/austin-heath/carbon` | ✓ **FIXED** Defects #2+#3 — pie + cream contrast |
| `/site/austin-heath/water` | ✓ (Brief 12) |
| `/site/austin-heath/waste` | ✓ (Brief 12) |
| `/site/austin-heath/meters` | ✓ |
| `/site/austin-heath/data-quality` | ✓ SycousPanel |

No collateral regression on any page touched or untouched.

### Build

`cd eir && npx vite build` → **✓ built in 2.10 s**, no errors.

### Files touched (Part 4)

- `CLAUDE.md` (+12 lines: new Process Rule 10)
- `eir/src/App.jsx` (4 Bars + isAnimationActive)
- `eir/src/components/EnergyChart.jsx` (3 Bars + isAnimationActive)
- `eir/src/components/LoadInspector/views/DataQualityView.jsx` (1 Bar + isAnimationActive)
- `eir/src/components/LoadInspector/views/MonthlyView.jsx` (1 Bar + isAnimationActive)
- `docs/briefs/active/13_chart_rendering_fixes.md` → `archive/13_chart_rendering_fixes_COMPLETED.md`
- `docs/briefs/current.md` (empty state)
- `docs/audit/13_chart_rendering_fixes.md` (this file)

### PASS — Brief 13 final

1. ✓ HEAD SHA at brief close (see commit list below); all 4 parts landed
2. ✓ Comparisons bar chart full-height, 15 months of bars; no scroll 1440×900
3. ✓ Carbon "Where it sits" pie renders fully — 3 sectors at correct proportions
4. ✓ Carbon labels/values/intensity/callout all legible on cream
5. ✓ **Both root causes named in close report and confirmed addressed separately** — Defect #1 was a flex-chain height-collapse (fix: min-height floor + narrative removal); Defect #2 was Recharts 3.x ResponsiveContainer measuring -1 plus animation pipeline stalling (fix: skip ResponsiveContainer + isAnimationActive=false). Different fixes, different code locations.
6. ✓ Full-tool walkthrough completed (14 routes); no collateral regression
7. ✓ All 9 `height="100%"` ResponsiveContainer hits enumerated and confirmed safe
8. ✓ Build clean; CLAUDE.md Process Rule 10 added
9. ✓ Brief archived; current.md repointed to empty state
10. ✓ Known issues / deferred logged below

### Known issues / for next brief

- Animation strip — by setting `isAnimationActive={false}` we've removed
  Recharts' bar/pie entry animation. This is the right trade for now
  (silent zero-size charts are unacceptable), but a Recharts 3.x upgrade
  with the animation bug fixed should re-enable it. Worth re-testing on
  every Recharts upgrade.
- Brief 12 Part 4 boundaries from the earlier brief still active.
- Pending follow-ups inherited from Brief 12: framer-motion reorder, 3
  pending HH MPANs, P03 waste workbook.

Brief 13 archived. Pushing.
