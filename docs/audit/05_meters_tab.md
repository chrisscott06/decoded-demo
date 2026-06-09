# Brief 5 audit — Meters tab + Comparisons chart + Site Detail narrative strip

**Brief:** [05_bible_bootstrap.md](../briefs/active/05_bible_bootstrap.md)
**Status:** Parts 3-5 work was completed BEFORE Brief 5 arrived, in commit `2a75541` ("fix(quick-wins): 3 Phase 1B+ quick-win fixes per brief"). That commit was driven by the draft predecessor `04_quick_wins_DRAFT_SUPERSEDED.md`, now archived. This audit doc consolidates the diagnosis, field-mapping decisions, and verification evidence for Brief 5's records.

---

## Part 3 — Meters tab (electricity MPANs + gas MPRNs + water meters)

### Sub-tab rename and routing

- Sub-tab label changed from `MPANs` to `Meters`.
- Canonical route: `/site/{id}/meters`.
- Legacy route `/site/{id}/mpans` aliases to the new path. Implementation: the App router strips `mpans` and replaces it with `meters` before matching, so the URL doesn't change in the browser address bar but the new Meters tab renders.

```js
// In the App route parser:
if (sub === 'mpans') sub = 'meters'
```

This means an external bookmark to `/site/austin-heath/mpans` lands on the meters view but the URL displayed stays as `/mpans`. If the user reloads, the URL stays `/mpans` and the alias keeps working. Acceptable for now; a true HTTP redirect would need a Vercel rewrite rule.

### Section structure

Three stacked panels rendered as separate `<Panel>` components:

1. **Electricity (MPANs)** — existing content from the old MPANs tab, untouched. Filter pills: All / Landlord / Voids / Inactive. Table columns: MPAN / Type / Category / CY25 kWh / Months.
2. **Gas (MPRNs)** — new. Filter pills: All / Landlord (defaulting to Landlord). Table columns: MPRN / Category / CY25 kWh / Months. Empty state when no gas MPRNs: "No gas supply at this site."
3. **Water (Meters)** — new. Header line: `{meters_known} meter{s} identified · {meters_with_cy2025_data} with CY2025 data`. Info row: water company / retailer / consumption / quality / coverage / completeness in a 3-column responsive grid. Below: "Key gaps" callout when `key_gaps` is populated.

### Field name mappings

Verified against `pipeline/dist/eir/water.json` and `pipeline/dist/eir/mpan_register.json`:

| UI element | JSON source | Field |
|---|---|---|
| Gas section table | mpan_register.json | filter `type === 'Gas'` |
| Water meter count | water.json | `meters_known`, `meters_with_cy2025_data` |
| Water company | water.json | `water_company` |
| Retailer | water.json | `retailer` |
| Water consumption | water.json | `consumption_m3` |
| Data quality | water.json | `data_quality` (string label) |
| Coverage period | water.json | `cy2025_coverage` |
| Completeness | water.json | `completeness` |
| Key gaps callout | water.json | `key_gaps` |

**Note:** waste fields are NOT used on the Meters tab. Waste sits on Site > Carbon (and is partially covered in Site > Data quality). Brief 6 may revisit whether a Waste section belongs on the Meters tab.

### Empty-state strategy

| Site shape | Behaviour |
|---|---|
| Has electricity MPANs but no gas MPRNs | Electricity section populated; Gas section shows "No gas supply at this site"; Water section shows whatever water.json contains |
| All-electric site (most villages) | Standard flow above |
| `meters_known === 0` or null (Sonning Common, Edwalton) | Water section shows "Meter inventory pending for this site." |
| No MPANs at all | Electricity section shows "No electricity MPANs recorded for this site." (Sonning Common case) |

### Sites observed during build

| Site | Elec MPANs | Gas MPRNs | Water meters | Notes |
|---|---|---|---|---|
| Austin Heath | 1 LL HH | 2 LL gas (combined ~2.5 GWh) | 3 known | Rich `key_gaps` ("Never billed since 2016 …") |
| Gifford Lea | 2 LL HH | 1 LL gas | 2 known | Water `data_quality: Estimated`, `100%` complete |
| Millfield Green | 1 LL HH | 0 (empty state) | varies | GSHP-only site, no gas supply |
| Sonning Common | 0 (empty state) | 0 (empty state) | 0 (empty state) | Pre-operational; all three empty states render |

---

## Part 4 — Comparisons chart fix

### Diagnosis

Before fix, at viewport 1440×900:

- Chart wrapped in `<ResponsiveContainer width="100%" height={300}>` — fixed height of 300px (rendered SVG).
- Page used `.page` class which has `flex: 1; overflow-y: auto; padding: 32px 60px 48px;`.
- Above the chart panel: pickers row (~50px), then a 2-column grid of comparison cards (~280-330px tall depending on content), then the chart panel (~370px including header).
- Total above-the-fold content from page top: top nav (56) + sub nav (48) + page padding-top (32) + pickers (50) + comp cards (~330) + gap (24) + chart panel (~370) = ~910px → 10-20px below the 900px fold.
- Y-axis used Recharts auto-domain which rounded up to e.g. 800k when data max was ~611k — wasted vertical space.
- X-axis ticks didn't render at all because the chart's bottom was clipped by the page overflow.

### Fix applied

Two coupled changes in `App.jsx` `PortfolioComparisons`:

1. **Chart sizing switched from fixed height to flex-fill**:

```jsx
<div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
    <BarChart data={chartData} margin={{ top: 12, right: 24, bottom: 8, left: 12 }}>
```

2. **Y-axis constrained to actual data range and fewer ticks**:

```jsx
<YAxis
  tick={{ fill: '#8a8a8a', fontSize: 11 }}
  axisLine={false}
  tickLine={false}
  tickCount={5}
  domain={[0, 'dataMax']}
  tickFormatter={fmtCompact}
  width={56}
/>
```

3. **X-axis interval forced to render every month** (was hiding labels at higher counts):

```jsx
<XAxis
  dataKey="month"
  angle={-45}
  textAnchor="end"
  interval={0}
  height={56}
  // ... rest of props
/>
```

4. **Page variant `.page-noscroll`** added — disables internal scroll on Comparisons specifically so the chart fills remaining viewport without competing with page-level scrollbar:

```css
.page-noscroll {
  overflow: hidden;
  padding-bottom: 24px;
}
.page-noscroll .comp-chart-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.page-noscroll .comp-chart-panel .panel-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
```

5. **Comparison cards compacted** from 7-row stacked layout to a 3×2 stat grid + a wide "Data quality" row (saved ~140px vertical), so the chart panel has room to breathe.

### Browser verification at 1440×900

Measured via DevTools-style introspection through Claude Preview MCP:

| Metric | Value | PASS? |
|---|---|---|
| Chart top (px from viewport top) | 576 | — |
| Chart bottom (px from viewport top) | 859 | ✓ (< 900) |
| Chart height | 283 | ✓ (was 137 with first attempt at flex-fill before cards were compacted) |
| Y-axis tick values | 0 / 200k / 400k / 611k | ✓ tight to dataMax, not stretched |
| X-axis tick count | 15 | ✓ all months Oct 2024 → Dec 2025 |
| Sample X labels | 2024-10, 2024-11, …, 2025-11, 2025-12 | ✓ |
| Bar count | 28 | ✓ (15 months × 2 sites; some months have 0 for one site) |
| Page overflow | false | ✓ no page scroll |

### Comparisons chart diagnosis — full record

Per Brief 5 Part 4.1: the root cause was *not* a single Recharts misconfiguration. It was layered:

1. Recharts default Y-axis behaviour rounds up to "nice" numbers, wasting vertical space — fixed with `domain={[0, 'dataMax']}` + `tickCount={5}`.
2. The fixed `height={300}` on ResponsiveContainer meant the chart didn't shrink/grow with viewport — fixed by switching to flex-fill (`height="100%"` inside a `flex: 1; min-height: 0` parent).
3. The 2-column comp-card grid had 7 stacked rows per card, taking ~330px each — fixed by collapsing to a 3×2 stat grid that's ~180px tall.
4. The `.page` had `overflow-y: auto` which let content scroll past the fold rather than constraining to viewport — fixed by adding the `.page-noscroll` variant.

All four changes were needed together. The first 3 alone left the chart at 137px tall (too small to render Y-ticks). The full fix gets it to 283px, comfortably within the 900px viewport.

---

## Part 5 — Site Detail Overview data quality narrative strip

### Layout

Below the existing 2×2 metric tiles, a full-width strip with 4 lines:

```
DATA QUALITY OVERVIEW
● Electricity: <n> MPAN<s> · <months> months CY2025 · Ecotricity billing
● Gas: <n> MPRN<s> · Ecotricity billing | "No gas on site"
● Water: <meters_known> meter<s> · <data_quality> (<completeness>) | "Meter inventory pending"
● Waste: <contractor> · <tonnage> t · <diversion>% diversion | "<contractor> · tonnages not tracked"
```

Each line: 8px coloured status dot (green/amber/red/grey matching the metric's `data_status`) + bold label + plain summary.

### Field mappings used

| Line | Source | Fields |
|---|---|---|
| Electricity | mpan_register.json (filtered to HH+NHH) | count + max `months_covered` of landlord MPANs |
| Gas | mpan_register.json (filtered to type='Gas') | count |
| Water | water.json | `meters_known`, `data_quality`, `completeness` |
| Waste | waste.json | `contractor`, `tonnage_total`, `diversion_rate` |

### Verified examples

| Site | Lines (status) |
|---|---|
| **Austin Heath** | Electricity: 1 MPAN · 12 months · Ecotricity (●green) / Gas: 2 MPRNs (●green) / Water: 3 meters · None (0%) (●red) / Waste: BIFFA · tonnages not tracked (●red) |
| **Gifford Lea** | Electricity: 2 MPANs · 12 months (●green) / Gas: 1 MPRN (●green) / Water: 2 meters · Estimated (100%) (●amber) / Waste: Ash Waste · tonnages not tracked (●amber) |
| **Sonning Common** | Sparse data — empty states render gracefully |

Note: Gifford Lea's waste tonnage shows "tonnages not tracked" rather than the actual tonnage because the waste.json reader was Phase 0 — for Ash Waste sites the `tonnage_total` field is null even though contractor + status are populated. Brief 6 may revisit the waste reader to surface estimated tonnages.

---

## Bonus item — Scope 3 Cat 5 (waste) line on Carbon tab

Per the draft predecessor brief (`04_quick_wins_DRAFT_SUPERSEDED.md` → "Fix 3 also mentioned the Carbon tab"), a small caption added below the intensity callout on Site > Carbon:

> "Scope 3 Cat 5 (waste): pending BIFFA tonnage CY2025."

This honestly flags the gap in the carbon view — the pie shows scopes 1/2/3 Cat 13 from energy only; Cat 5 waste emissions are tracked in `waste.json` as `emissions_scope3_cat5_tco2e` but currently null for all sites pending BIFFA tonnage data.

---

## Files touched (Parts 3-5)

Single commit `2a75541` modified:

- `eir/src/App.jsx` — sub-tab rename + route alias, SiteMeters component (3 panels), Comparisons chart fix, Site Overview narrative strip, Carbon-tab waste line
- `eir/src/index.css` — `.meters-row` + `.meters-cell` + `.meters-label` + `.meters-value` for water info grid; `.dq-narrative` + `.dq-line` + `.dq-dot` for Site Overview narrative; `.page-noscroll` and `.comp-card-grid` for the Comparisons fix

No new component files. No new pipeline outputs. No new dependencies. Pure UI work.

---

## Notes for future briefs

- **Vercel SPA rewrite covers the new routes.** The catch-all rewrite added in chunk-1(phase-1b) handles `/site/{id}/meters` direct loads automatically.
- **Waste tonnage gap** is the next data-side fix — Ash Waste tonnages exist in the workbook but the Phase 0 reader doesn't surface them as `tonnage_total`.
- **Browser verification habit established** — this brief is the first to mandate it at Part 6 walkthrough. Future briefs inherit the discipline via CLAUDE.md Process Rule 9.
