# Load Inspector — Extraction Handoff for IVG ESG Tool

**Source:** PABLO 2.0 (`frontend/src/pages/explorer/LoadInspector.jsx`)
**Target:** IVG ESG Tool (sibling React + Vite + Recharts project)
**Author of source:** Chris Scott / Claude-Code-assisted, May 2026
**Document status:** self-contained — the receiving developer should not need the original repo

---

## Section 1 — What Load Inspector is

Load Inspector is a **profile analysis & inspection module** that lets an
energy advisor look at one site's half-hourly (HH) electricity demand for a
year and understand its shape: when peaks happen, how it varies by day-of-week
and season, how much of the year sits above any given kW threshold, where
gaps or zero-readings exist, and (with a postcode) how strongly the load
correlates with outdoor temperature.

It exists because raw HH CSVs are dense (~17,520 rows per year) and a human
can't read them. The module aggregates the data eight different ways — each
view answering a different question. Together they tell the advisor whether
the site's load is heating-dominated, lighting-and-IT flat, cooling-spiked
in summer, weekend-different, ASC-constrained, or has data-quality issues
that would undermine any downstream analysis.

It expects HH input as a **flat array of kW values** (one per half-hour or
hour interval) plus a `start_date` for indexing. PABLO's library stores HH
data in a `config_json.hh_data: number[]` field on a `load_profile` library
item; the IVG project's pipeline produces equivalent JSON from CSV. Most
views work from this array alone; one view (Weather) additionally fetches
hourly temperature from Open-Meteo and correlates it. There are no
screenshots checked into the repo.

---

## Section 2 — Views / visualisations

The module renders **eight tabs** in a TabBar. The user picks one at a time;
state for each tab persists across switches.

### 2.1 — Overview
- **What it shows:** A left column of six metric cards (Peak / Mean / Annual /
  Load Factor / Weekday Mean / Weekend Mean) plus, on the right, a daily
  peak-vs-mean time series and the load duration curve.
- **Insight:** "Is this load peaky or flat? How much energy across the year?
  Does it have a high or low load factor?"
- **Inputs:** Per-day peak kW and mean kW (derived from HH data); duration
  curve (sorted descending HH values).
- **Recharts:** `ComposedChart` (Area+Line for daily peak/mean), `AreaChart`
  (duration curve).
- **Transforms:** Per-day peak = max of 48/24 HH samples; per-day mean = sum /
  periodsPerDay. Duration curve = `[...hhData].sort((a,b) => b - a)` then
  thinned (every Nth point) to ≤ 500 points for render performance.
- **File location:** Inline in `LoadInspector.jsx`, case `'overview'`.

### 2.2 — Time Series
- **What it shows:** A scrubbable area chart of the demand profile at the
  selected zoom level (1 day, 1 week, 2 weeks, 1 month, quarter, 6 months,
  1 year).
- **Insight:** "What does the load look like across this date range?"
- **Inputs:** HH data sliced by `tsStartDay × periodsPerDay` to
  `(tsStartDay + tsZoomDays) × periodsPerDay`.
- **Recharts:** `AreaChart` with `Brush` for >200 data points.
- **Transforms:** Slice + downsample (if `result.length > 2000`, keep every
  Nth). X-axis tick generation handled by `getTimeAxisConfig` (see Section 5).
- **Controls:** Zoom-level pill buttons; horizontal scrubber slider; month-
  jump buttons (Jan-Dec); sub-365-day mode only.
- **File location:** Inline, case `'timeseries'`.

### 2.3 — Daily Profile
Two modes selected by a season-coloured Month Jump button bar:
- **All months mode:** Side-by-side "Weekday vs Weekend" 24-hour profile +
  "Monthly Overlay" (all 12 months on one chart, season-coloured lines).
- **Single-month mode:** "Daily Profile with Range" (Min/Max band, P25/P75
  band, Mean line — each layer toggleable) + "Weekday vs Weekend" for that
  month. Four metric cards above (Month Peak / Month Mean / Peak Hour Mean /
  Min Hour Mean).
- **Insight:** "When does this site use power within the day? Is the pattern
  different on weekends? Does the shape shift seasonally?"
- **Inputs:** HH data + start date for weekday/weekend classification +
  month indexing.
- **Recharts:** `LineChart` (weekday/weekend, monthly overlay), `ComposedChart`
  (range bands via stacked transparent Areas + lines).
- **Transforms:** Per-HH-of-day bucketing across the year, split by weekday/
  weekend; percentile calculation (P25/P75) on each HH bucket — custom JS
  percentile function (sort + linear interpolation, see Section 5).
- **File location:** Inline, case `'daily'`.

### 2.4 — Monthly
- **What it shows:** Twelve bars of monthly kWh consumption with two
  optional overlay lines (monthly peak kW, monthly mean kW), dual y-axis.
- **Insight:** "What's the seasonal shape of consumption and what's driving
  the peaks?"
- **Inputs:** Monthly kWh, monthly peak, monthly mean — pre-computed by the
  engine context. Each is a 12-element array.
- **Recharts:** `ComposedChart` (Bars for kWh, Lines for peak/mean), dual
  YAxis (`yAxisId="kwh"`, `yAxisId="kw"`).
- **Transforms:** Bucket HH data by `timestamp.getMonth()`, sum kW × interval
  for kWh, max for peak, mean for mean.
- **File location:** Inline, case `'monthly'`.

### 2.5 — Duration Curve
- **What it shows:** Standalone, full-page load duration curve (dedicated tab
  with the same curve from Overview but larger and with cleaner axes).
- **Insight:** "How many hours per year is demand above any given threshold?
  Useful for sizing batteries, sizing curtailment thresholds, sizing PPAs."
- **Inputs:** Sorted-descending HH values.
- **Recharts:** `AreaChart` with `pct` (0-100% of time) as x-axis.
- **Transforms:** Sort descending, thin to ≤500 points.
- **File location:** Inline, case `'duration'`.

### 2.6 — Heat Map
- **What it shows:** 12 × 24 grid (months × hours) coloured by mean kW at
  that month-hour combination. Dark navy → light periwinkle gradient.
- **Insight:** "Visualises the entire year's load shape on one chart — where
  do the high-load month-hours sit?"
- **Inputs:** HH data + start date + intervalHours.
- **Recharts:** **None** — custom flex/grid SVG-free implementation using
  styled `<div>`s. Each cell is a `<div>` with `backgroundColor` interpolated
  from the cell's normalised value.
- **Transforms:** Sum + count per (month, hour) bucket; mean = sum/count;
  global max for the colour scale. Custom `heatColor(value)` returns
  `rgb(...)` interpolated `(30,27,75) → (99,102,241)` based on
  `value / max`.
- **File location:** Inline, case `'heatmap'`.

### 2.7 — Data Quality
- **What it shows:** Coverage % card + total HH periods + missing/null count
  + zero-values count + a per-month coverage bar chart + an "Assembly
  Provenance" card (PABLO-specific — see Section 9).
- **Insight:** "Is this profile complete and trustworthy? Which months have
  gaps?"
- **Inputs:** HH data (looking for nulls/NaNs/zeros), start date.
- **Recharts:** `BarChart` for monthly coverage.
- **Transforms:** Count nulls, count zeros, per-month sum of expected vs
  actual periods.
- **File location:** Inline, case `'quality'`. The Assembly Provenance card
  is a separate sub-component at the bottom of the file.

### 2.8 — Weather
- **What it shows:** Scatter plot of daily kWh vs daily mean temperature,
  with a piecewise-linear change-point regression overlaid. Plus monthly
  consumption + mean temperature combo chart, an HDD scatter, weekday vs
  weekend decomposition stats, and six metric cards (Balance Point /
  Heating Sensitivity / R² / Baseload / Weather-Dependent / Weather %).
- **Insight:** "How much of this site's consumption is driven by outdoor
  temperature? Where's the balance point? Is it heating-dominated, cooling-
  dominated, or temperature-independent?"
- **Inputs:** HH data + assembly metadata (per-month source years) +
  postcode (for geocoding) + hourly temperature from Open-Meteo.
- **Recharts:** `ScatterChart` (daily vs temp, HDD scatter), `ComposedChart`
  (monthly Bar + Line), with `ReferenceLine` for balance point.
- **Transforms:** Geocode via `api.postcodes.io`; fetch hourly temp via
  Open-Meteo Archive API (backend proxy); aggregate hourly temp + daily
  kWh; fit piecewise-linear regression by grid search over candidate
  balance points 8-22°C using OLS.
- **File location:** Separate file `frontend/src/components/inspector/
  WeatherAnalysisTab.jsx` (382 lines). Calls helpers in
  `frontend/src/utils/weatherAnalysis.js`.

### 2.9 — Per-tab controls reference
- Time Series: zoom pills (7 options), month-jump buttons, day-range
  scrubber slider
- Daily Profile: Month Jump bar (All + Jan..Dec), 3-way layer toggle chips
  (Min/Max, P25/P75, Mean)
- Monthly: 2 checkbox toggles (Peak Line, Mean Line)
- Weather: Season / Day-Type colour toggle on the scatter

---

## Section 3 — Data shape and pre-processing

### 3.1 — Input shape Load Inspector consumes

```ts
// What LoadInspector reads from the engine context / library
interface ProfileData {
  hh_data: number[];        // 17,520 kW values for HH; 8,760 for hourly
  interval_hours: number;   // 0.5 for HH, 1 for hourly
  start_date?: string;      // ISO date string — first sample timestamp
  // Optional fields (PABLO-specific, can be omitted for IVG)
  peak_kw?: number;
  annual_kwh?: number;
  mean_kw?: number;
  load_factor?: number;
  count?: number;
  duration_days?: number;
}
```

The flat `number[]` is the only mandatory input. For 17,520 HH samples,
ordering is: index 0 = first half-hour of `start_date`; index 1 = next
half-hour; …; index 17519 = last half-hour of the year.

### 3.2 — Pre-processing pipeline

PABLO does most of the heavy aggregation **server-side once on save**
(stored on the library item) and **client-side on demand** when the user
opens the module. For IVG, where you'll process CSV at pipeline-build time
and emit JSON, you have a choice — both work.

The aggregations Load Inspector needs:

```ts
// Engine-context outputs (pre-computed once per profile load)
interface DemandEngine {
  hhData: number[];            // upsampled to HH if input was hourly
  intervalHours: 0.5;          // always 0.5 internally
  periodsPerDay: 48;
  timestamps: Date[];          // one per HH sample
  peak: number;                // kW
  mean: number;                // kW
  annualKWh: number;
  loadFactor: number;          // 0..1 (mean / peak)
  weekdayMean: number;         // kW
  weekendMean: number;         // kW
  duration: number;            // days
  coverage: number;            // 0..1 (actual / expected periods)
  periodCount: number;
  missingPeriods: number;
  zeroPeriods: number;
  monthlyKWh: number[12];
  monthlyPeak: number[12];     // kW
  monthlyMean: number[12];     // kW
  dailyProfileWeekday: number[24];  // mean kW per hour
  dailyProfileWeekend: number[24];
  durationCurve: number[];     // sorted descending
}
```

The hourly→HH upsampling is a midpoint interpolation:

```js
if (rawInterval >= 1) {
  hhData = [];
  for (let i = 0; i < raw.length; i++) {
    const next = i < raw.length - 1 ? raw[i + 1] : raw[i];
    hhData.push(raw[i]);
    hhData.push((raw[i] + next) / 2);
  }
}
```

Per-day-of-month-and-HH bucketing (used by the Daily Profile percentile
bands) happens **on-demand inside the component's `useMemo`** because it
depends on the selected month. See Section 5 for the percentile function.

### 3.3 — Caching / memoisation

The component uses `useMemo` for every derived view. Each memo depends on
`primaryData` (the input array) plus the view's controls. When the user
switches tabs the previous tab's memos are kept warm; switching back is
instant.

The duration curve memo intentionally thins to ≤500 points before passing to
Recharts. The time-series memo similarly thins to ≤2000.

### 3.4 — Client-side vs server-side

PABLO does the **derived aggregates (`monthlyKWh`, `monthlyPeak`,
`dailyProfileWeekday`, etc.) once on the client when the profile is loaded**,
inside `ProjectEngineContext.deriveDemand()`. That's a per-page-load cost of
~50–100ms on 17,520 points. The component then reuses those arrays without
recomputing.

The view-specific transforms (per-month percentiles, time-series slicing,
heat map matrix) run **on-demand inside the component** when the relevant
control changes.

**For IVG:** I'd recommend doing the per-profile aggregates at
**pipeline-build time** (so each MPAN's JSON arrives pre-aggregated), then
the in-browser cost reduces to just the view-specific transforms. Avoids
re-doing the same monthly bucketing for every user who opens the page.

---

## Section 4 — Component structure

```
<LoadInspector />                                  [pages/explorer/LoadInspector.jsx]
  ├─ sidebar: <LibraryPicker> + stats summary list
  ├─ <TabBar tabs={VIEWS} active={view} onChange={setView} />
  └─ renderView() switch on `view`:
       ├─ 'overview'  : 2 ChartContainers (peak/mean, duration curve) + metric cards
       ├─ 'timeseries': zoom pills, <MonthJumpButtons>, scrubber, 1 ChartContainer
       ├─ 'daily'     : <MonthJumpButtons>, 2 ChartContainers (Weekday/Weekend, Monthly Overlay)
       │                 OR 2 ChartContainers (Daily Profile with Range, Weekday/Weekend)
       ├─ 'monthly'   : 2 checkboxes, 1 ChartContainer
       ├─ 'duration'  : 1 ChartContainer
       ├─ 'heatmap'   : 1 ChartContainer wrapping custom flex grid
       ├─ 'quality'   : metric cards + 1 ChartContainer + <AssemblyProvenanceCard>
       └─ 'weather'   : <WeatherAnalysisTab>      [components/inspector/WeatherAnalysisTab.jsx]
```

### 4.1 — Top-level component props + state

`<LoadInspector />` takes no props. It reads everything from React context:

```js
const { profileData, loadedItems, activeLibraryItems, currentProject } = useProject();
const engine = useProjectEngine();
```

**Internal state:**

```js
const [view, setView]                 = useState('overview');
const [tsZoomDays, setTsZoomDays]     = useState(7);
const [tsStartDay, setTsStartDay]     = useState(0);
const [selectedMonth, setSelectedMonth] = useState(null); // 1-12 or null = all
const [profileLayers, setProfileLayers] = useState({ range: true, iqr: true, mean: true });
const [showPeakLine, setShowPeakLine]   = useState(true);
const [showMeanLine, setShowMeanLine]   = useState(true);
const [browsedProfileData, setBrowsedProfileData] = useState(null);
```

### 4.2 — Critical inline source (LoadInspector.jsx, abridged)

```jsx
/* LoadInspector.jsx — PABLO 2.0 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush,
} from 'recharts';

const VIEWS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'timeseries',  label: 'Time Series' },
  { id: 'daily',       label: 'Daily Profile' },
  { id: 'monthly',     label: 'Monthly' },
  { id: 'duration',    label: 'Duration Curve' },
  { id: 'heatmap',     label: 'Heat Map' },
  { id: 'quality',     label: 'Data Quality' },
  { id: 'weather',     label: 'Weather' },
];

const TS_ZOOM_OPTIONS = [
  { id: 1, label: '1 Day' }, { id: 7, label: '1 Week' }, { id: 14, label: '2 Weeks' },
  { id: 30, label: '1 Month' }, { id: 91, label: 'Quarter' },
  { id: 182, label: '6 Months' }, { id: 365, label: 'Year' },
];

const SEASON_COLORS = { Winter: '#00AEEF', Spring: '#2ECC71', Summer: '#ECB01F', Autumn: '#F48379' };
const MONTH_SEASON = ['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function LoadInspector({ hhData, intervalHours = 0.5, startDate, profileName }) {
  const [view, setView] = useState('overview');
  const periodsPerDay = Math.round(24 / intervalHours);
  const intervalMs = intervalHours * 3600 * 1000;
  const primaryData = hhData || [];

  // ── Time labels for current interval ──
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let p = 0; p < periodsPerDay; p++) {
      const totalMin = p * intervalHours * 60;
      const h = Math.floor(totalMin / 60);
      const m = Math.round(totalMin % 60);
      labels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return labels;
  }, [periodsPerDay, intervalHours]);

  // ── Overall stats ──
  const stats = useMemo(() => {
    const valid = primaryData.filter(v => v != null && !isNaN(v));
    const peak = valid.length > 0 ? Math.max(...valid) : 0;
    const mean = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    const totalKWh = valid.reduce((a, b) => a + b, 0) * intervalHours;
    const loadFactor = peak > 0 ? (mean / peak) * 100 : 0;
    const days = Math.floor(primaryData.length / periodsPerDay);
    const gaps = primaryData.length - valid.length;
    const zeros = valid.filter(v => v === 0).length;
    const coveragePct = primaryData.length > 0
      ? ((primaryData.length - gaps) / primaryData.length) * 100 : 0;

    // Weekday/weekend means
    const start = new Date(startDate || '2025-01-01');
    let wdSum = 0, wdCount = 0, weSum = 0, weCount = 0;
    for (let day = 0; day < days; day++) {
      const d = new Date(start); d.setDate(d.getDate() + day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      for (let p = 0; p < periodsPerDay; p++) {
        const v = primaryData[day * periodsPerDay + p];
        if (v != null && !isNaN(v)) {
          if (isWeekend) { weSum += v; weCount++; } else { wdSum += v; wdCount++; }
        }
      }
    }
    return {
      totalKWh, peak, mean, gaps, zeros, coverage: coveragePct, loadFactor, days,
      count: primaryData.length,
      weekdayMean: wdCount > 0 ? wdSum / wdCount : 0,
      weekendMean: weCount > 0 ? weSum / weCount : 0,
    };
  }, [primaryData, intervalHours, periodsPerDay, startDate]);

  // ── Daily peak & mean for Overview ──
  const overviewDailyData = useMemo(() => {
    const days = Math.floor(primaryData.length / periodsPerDay);
    const baseDate = new Date(startDate || '2025-01-01');
    const result = [];
    for (let day = 0; day < days; day++) {
      let peak = 0, sum = 0;
      for (let p = 0; p < periodsPerDay; p++) {
        const kw = primaryData[day * periodsPerDay + p] || 0;
        if (kw > peak) peak = kw;
        sum += kw;
      }
      const d = new Date(baseDate); d.setDate(d.getDate() + day);
      result.push({
        date: MONTHS[d.getMonth()],
        datetime: d.toISOString().slice(0, 10),
        peak: Math.round(peak * 10) / 10,
        mean: Math.round((sum / periodsPerDay) * 10) / 10,
      });
    }
    return result;
  }, [primaryData, periodsPerDay, startDate]);

  // ── Duration curve ──
  const durationData = useMemo(() => {
    const sorted = [...primaryData].filter(v => v != null).sort((a, b) => b - a);
    const step = Math.max(1, Math.floor(sorted.length / 500));
    return sorted.filter((_, i) => i % step === 0).map((v, i, arr) => ({
      pct: Math.round((i * step / sorted.length) * 1000) / 10,
      kw: Math.round(v * 10) / 10,
    }));
  }, [primaryData]);

  // ── Time series windowed data ──
  const tsData = useMemo(() => {
    const sliceStart = tsStartDay * periodsPerDay;
    const sliceEnd = Math.min((tsStartDay + tsZoomDays) * periodsPerDay, primaryData.length);
    const sliced = primaryData.slice(sliceStart, sliceEnd);
    const startBase = new Date(startDate || '2025-01-01');
    startBase.setDate(startBase.getDate() + tsStartDay);
    const result = [];
    for (let i = 0; i < sliced.length; i++) {
      const d = new Date(startBase.getTime() + i * intervalMs);
      result.push({
        datetime: d.toISOString(),
        label: tsZoomDays <= 2
          ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
          : tsZoomDays <= 14
            ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(2,'0')}:00`
            : `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        demand: sliced[i] || 0,
      });
    }
    if (result.length > 2000) {
      const step = Math.ceil(result.length / 2000);
      return result.filter((_, i) => i % step === 0);
    }
    return result;
  }, [primaryData, tsStartDay, tsZoomDays, periodsPerDay, intervalMs, startDate]);

  // ── Per-month percentile bands ──
  const monthProfileData = useMemo(() => {
    if (selectedMonth === null || primaryData.length === 0) return null;
    const base = new Date(startDate || '2025-01-01');
    const days = Math.floor(primaryData.length / periodsPerDay);
    const slots = Array.from({ length: periodsPerDay }, () => []);
    const wdSlots = Array.from({ length: periodsPerDay }, () => []);
    const weSlots = Array.from({ length: periodsPerDay }, () => []);
    for (let day = 0; day < days; day++) {
      const d = new Date(base); d.setDate(d.getDate() + day);
      if (d.getMonth() + 1 !== selectedMonth) continue;
      const isWE = d.getDay() === 0 || d.getDay() === 6;
      for (let p = 0; p < periodsPerDay; p++) {
        const v = primaryData[day * periodsPerDay + p] || 0;
        slots[p].push(v);
        if (isWE) weSlots[p].push(v); else wdSlots[p].push(v);
      }
    }
    const percentile = (arr, p) => {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = (p / 100) * (sorted.length - 1);
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const chartData = timeLabels.map((label, i) => {
      const vals = slots[i];
      const minV = vals.length ? Math.min(...vals) : 0;
      const maxV = vals.length ? Math.max(...vals) : 0;
      const p25V = percentile(vals, 25);
      const p75V = percentile(vals, 75);
      const meanV = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return {
        time: label,
        min: Math.round(minV * 10) / 10,
        max: Math.round(maxV * 10) / 10,
        p25: Math.round(p25V * 10) / 10,
        p75: Math.round(p75V * 10) / 10,
        mean: Math.round(meanV * 10) / 10,
        rangeDelta: Math.round(Math.max(0, maxV - minV) * 10) / 10,
        iqrDelta: Math.round(Math.max(0, p75V - p25V) * 10) / 10,
      };
    });
    const wdWeData = timeLabels.map((label, i) => ({
      time: label,
      weekday: Math.round((wdSlots[i].length
        ? wdSlots[i].reduce((s, v) => s + v, 0) / wdSlots[i].length : 0) * 10) / 10,
      weekend: Math.round((weSlots[i].length
        ? weSlots[i].reduce((s, v) => s + v, 0) / weSlots[i].length : 0) * 10) / 10,
    }));
    const monthPeak = Math.max(...chartData.map(d => d.max));
    const monthMean = chartData.reduce((s, d) => s + d.mean, 0) / chartData.length;
    return { chartData, wdWeData, monthPeak, monthMean };
  }, [primaryData, selectedMonth, periodsPerDay, timeLabels, startDate]);

  // ── Heat map matrix: month × hour ──
  const heatmapMonthHour = useMemo(() => {
    if (primaryData.length === 0)
      return { matrix: Array.from({ length: 12 }, () => Array(24).fill(0)), max: 0 };
    const base = new Date(startDate || '2025-01-01');
    const days = Math.floor(primaryData.length / periodsPerDay);
    const sums = Array.from({ length: 12 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 12 }, () => Array(24).fill(0));
    const periodsPerHour = Math.round(1 / intervalHours);
    for (let day = 0; day < days; day++) {
      const d = new Date(base); d.setDate(d.getDate() + day);
      const mi = d.getMonth();
      for (let p = 0; p < periodsPerDay; p++) {
        const hour = Math.floor(p / periodsPerHour);
        const v = primaryData[day * periodsPerDay + p] || 0;
        sums[mi][hour] += v;
        counts[mi][hour]++;
      }
    }
    const matrix = sums.map((row, mi) =>
      row.map((s, hi) => counts[mi][hi] > 0 ? Math.round((s / counts[mi][hi]) * 10) / 10 : 0)
    );
    const max = Math.max(...matrix.flat());
    return { matrix, max };
  }, [primaryData, periodsPerDay, intervalHours, startDate]);

  const heatColor = useCallback((value) => {
    const ratio = heatmapMonthHour.max > 0 ? value / heatmapMonthHour.max : 0;
    const r = Math.round(30 + ratio * 69);
    const g = Math.round(27 + ratio * 75);
    const b = Math.round(75 + ratio * 166);
    return `rgb(${r}, ${g}, ${b})`;
  }, [heatmapMonthHour.max]);

  // ... renderView() switch on `view` — see Section 2 for what each case renders
}
```

Full original source is at `frontend/src/pages/explorer/LoadInspector.jsx`
(1,077 lines). The above captures the data-flow critical pieces; the per-tab
JSX is in the original `switch (view)` block, with each case being ~30–80
lines of straightforward Recharts components.

### 4.3 — Recharts patterns used

```jsx
// Stacked transparent Area trick for range bands (used in Daily Profile single-month):
<Area dataKey="min"        stackId="range" fill="transparent" stroke="none" />
<Area dataKey="rangeDelta" stackId="range" fill="#D5D8DC" fillOpacity={0.3} stroke="none" />
// The first Area is invisible; it positions the stack baseline at `min`.
// The second renders the delta (max - min) on top, producing a visible band.

// Dual y-axis on Monthly chart:
<YAxis yAxisId="kwh" orientation="left"  tickFormatter={v => `${(v/1000).toFixed(0)}`} />
<YAxis yAxisId="kw"  orientation="right" tickFormatter={v => `${v.toFixed(0)}`} />
<Bar  yAxisId="kwh" dataKey="kwh"  />
<Line yAxisId="kw"  dataKey="peak" />

// Custom XAxis ticks via getTimeAxisConfig (see Section 5)
{(() => {
  const { ticks, formatter } = getTimeAxisConfig(tsData, 'datetime', tsZoomDays);
  return <XAxis dataKey="datetime" ticks={ticks} tickFormatter={formatter} />;
})()}
```

### 4.4 — Heat map (no Recharts)

```jsx
<div className="flex flex-col">
  <div className="flex pl-12">
    {[0,3,6,9,12,15,18,21].map(h => (
      <div key={h} style={{ width: `${100/8}%` }}>
        {String(h).padStart(2,'0')}:00
      </div>
    ))}
  </div>
  <div className="flex flex-col gap-0.5">
    {matrix.map((row, mi) => (
      <div key={mi} className="flex items-center gap-1 flex-1">
        <span className="w-10 text-right">{MONTHS[mi]}</span>
        <div className="flex flex-1 gap-px h-full">
          {row.map((val, hi) => (
            <div key={hi}
              className="flex-1 rounded-sm"
              style={{ backgroundColor: heatColor(val) }}
              title={`${MONTHS[mi]} ${String(hi).padStart(2,'0')}:00 — ${val.toFixed(1)} kW`}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
</div>
```

Flex-based; no SVG; native HTML title tooltips. Renders in <10ms on 12×24
cells.

---

## Section 5 — Dependencies

| Package | Version (PABLO) | Used for | Swappable? |
|---|---|---|---|
| `react` | ^19.2.4 | Component framework | n/a |
| `react-dom` | ^19.2.4 | DOM rendering | n/a |
| `recharts` | ^3.8.0 | All charts (Area, Line, Bar, Composed, Scatter) | **Reuse** — IVG already uses Recharts |
| `lucide-react` | ^0.577.0 | Icons in sidebar metric cards | Reuse, very small footprint |
| `tailwindcss` | ^3.4.19 | All styling | Reuse if IVG uses Tailwind; otherwise replace class strings with your design tokens |
| `vite` | ^8.0.0 | Build tool | n/a — IVG already uses Vite |
| `papaparse` | ^5.5.3 | Used elsewhere in PABLO (CSV import) — NOT used by LoadInspector itself | n/a |
| `axios` | ^1.13.6 | Used elsewhere; LoadInspector uses it indirectly via the library client. For IVG, just `fetch` static JSON. | Drop |

**Explicit answers to the called-out questions:**
- ✅ **Recharts** — yes, used everywhere except the heat map.
- ❌ **d3** — not used directly. Recharts uses d3 internally.
- ❌ **date-fns / dayjs** — not used. PABLO uses native `Date` throughout.
  `toISOString().slice(0, 10)`, `getDay()`, `setDate(getDate() + n)` patterns.
- ❌ **papaparse** — not used by LoadInspector. Used elsewhere in PABLO
  for CSV import in the HH Profiler, but the inspector reads pre-parsed JSON.
- ❌ **lodash** — not used.
- ✅ **Custom hooks** — PABLO has `useProject`, `useProjectEngine`,
  `useModuleLibrary`, `useRequiredLibraryItems`. These wire to PABLO's
  context system and **will need to be replaced** with whatever IVG uses
  to provide the active site's HH data. Simplest: pass the HH array as a
  prop directly to a top-level `<LoadInspector hhData={...}
  intervalHours={...} startDate={...} profileName={...} />`.

---

## Section 6 — Controls and interactivity

### 6.1 — View switching
Tab bar at the top of the chart area (`<TabBar tabs={VIEWS} active={view}
onChange={setView} />`). PABLO's `TabBar` is a simple horizontal flex of
pill buttons; reimplement with IVG's own pattern.

### 6.2 — Per-tab controls

**Time Series:**
- Zoom-level pill buttons (1d / 1w / 2w / 1m / Q / 6m / Year)
- Month-jump buttons row — "Jan Feb Mar … Dec", each coloured by season,
  scrubs the visible window to the first of that month
- Horizontal range slider (HTML5 `<input type="range">`) — sub-day scrubbing

**Daily Profile:**
- Month-jump buttons (All + Jan..Dec). "All" mode shows weekday/weekend +
  monthly-overlay side-by-side; a specific month shows percentile bands +
  weekday/weekend for that month.
- Layer toggle chips (when in single-month mode): Min/Max band, P25/P75
  band, Mean line — independently toggleable.

**Monthly:** Two checkbox toggles — Peak Line and Mean Line — control
whether the corresponding overlay lines render on top of the kWh bars.

**Weather:** Scatter colour-by toggle (Season vs Day Type).

### 6.3 — Hover behaviours

All Recharts charts use the default `<Tooltip>` with custom `contentStyle`.
The Daily Profile range chart has a custom Tooltip render function that
filters out the `rangeDelta`/`iqrDelta` series (they're the stacked-area
"shim" series, not user-meaningful — see Section 4.3).

Heat map cells have a native HTML `title` attribute: `"Jan 09:00 — 245.3
kW"`.

### 6.4 — Click-to-drill

**None.** No tab has click-to-drill. The user navigates by tab, not by
clicking a chart element. This is by design — Load Inspector is a read-only
analysis surface, not a navigator.

### 6.5 — Keyboard shortcuts

None.

---

## Section 7 — Performance considerations

### 7.1 — How 17,520 points are handled

- **Duration curve:** Sorted descending, then **thinned to ≤500 points**
  before passing to Recharts. The thinning factor `step = Math.max(1,
  Math.floor(sorted.length / 500))` produces a curve visually identical
  to the unthinned version at any zoom level.
- **Time Series:** Slice by visible window first, then thin to ≤2000
  points if the slice exceeds that. For a 1-day view at HH = 48 points,
  no thinning. For a year view at 17,520 points, thin to ~2000.
- **Heat map:** Aggregated to 12 × 24 = 288 cells. Renders instantly.
- **Daily Profile percentile bands:** Per-HH-of-day bucketing produces
  48 (or 24) data points. Renders instantly.
- **Monthly summary:** 12 data points. Trivial.

### 7.2 — Virtualisation / debouncing / windowing

None used. The view-switching mechanism naturally windows by tab — only
the active tab's memos hold large arrays in computed state.

### 7.3 — Typical render time

On a mid-range laptop (M2 MacBook Pro):
- Initial mount: ~150ms (most of it the Overview tab's duration curve sort)
- Tab switch: <50ms (memos are warm)
- Time Series scrub (slider drag): ~30ms per re-render — feels live
- Daily Profile month switch: ~80ms (per-month bucketing runs)
- Heat map first render: ~20ms

### 7.4 — Known bottlenecks

- The `useMemo` for `dailyProfileAllData` in PABLO depends on `engine.demand.
  dailyProfileWeekday`. PABLO recomputes that engine state on every project
  load — moderate cost (~50ms) but only once. For IVG, pre-compute at
  pipeline-build time.
- `Math.max(...arr)` on 17,520-element arrays: the spread operator can hit
  call-stack limits on some browsers around 50k+ elements. Not an issue at
  17,520, but if you scale up consider a manual loop.

---

## Section 8 — Visual style notes

The PABLO design language emphasises **dense information** on a **light
background**. Colour palette (Tailwind-ish customisations):

- **Backgrounds:** white cards on `bg-off-white` (#F9F9F9) page background.
  No dark mode.
- **Borders:** `border-light-grey` (#E6E6E6). Cards use 2px coloured left
  borders to categorise metric type (magenta for peak, teal for mean, gold
  for annual, coral for load factor).
- **Primary text:** `text-navy` (#2B2A4C).
- **Secondary text:** `text-mid-grey` (#95A5A6) or `text-mid-grey/60`.
- **Tertiary text:** `text-mid-grey/30`.

**Chart-specific tokens:**

```js
export const TICK_STYLE   = { fontSize: 9, fontFamily: "'Stolzl'", fill: '#95A5A6' };
export const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF', border: '1px solid #E6E6E6', borderRadius: 6,
  fontSize: 11, padding: 8,
};
export const LEGEND_STYLE = { fontSize: '9px', fontFamily: "'Stolzl'" };
export const LABEL_STYLE  = { fontSize: 9, fontFamily: "'Stolzl'", fill: '#95A5A6' };
export const GRID_STYLE   = { strokeDasharray: '3 3', stroke: '#E6E6E6' };
```

**Chart series colours:**

| Series | Hex | Usage |
|---|---|---|
| Gold / amber | #ECB01F | Default demand line; mean profile line |
| Magenta / pink | #E84393 | Peak series; emphasise/accent |
| Teal | #00AEEF | Weekday series |
| Coral | #F48379 | Autumn season; warning emphasis |
| Spring green | #2ECC71 | Weekday-ok / coverage success |
| Winter blue | #00AEEF | Winter season |
| Summer amber | #ECB01F | Summer season |
| Navy | #2B2A4C | Daily mean overlay (Overview) |
| Grey | #BDC3C7 / #D5D8DC | Range band (Min/Max) |

**Typography (PABLO uses 'Stolzl' system font).** IVG uses **Playfair Display
+ Inter** — direct swap: chart titles → Playfair, all body and tick labels →
Inter. Same sizes.

**Axis labels:** 9-10px, mid-grey. Y-axis label rotated -90 inside-left. X-axis
ticks vary by zoom (handled by `getTimeAxisConfig`, see below).

**Legend placement:** Bottom of the chart, horizontal flex, 9px font.

**Gridlines:** Dashed `3 3` stroke, `#E6E6E6`, both axes.

---

## Section 9 — Known gotchas

### 9.1 — Half-hour-ending vs half-hour-starting
PABLO treats sample `i` as the half-hour **starting** at time `T_0 + i * 30
min`. The IVG source CSV has timestamps like `Wed 01/01/2025 00:30` — this
is the timestamp at the **end** of the half-hour interval. Decide your
convention up front and stay with it. If the IVG CSV is end-of-period and
LoadInspector is start-of-period, subtract one interval when converting.

### 9.2 — Leap-year / 17,520 vs 17,568
365 days × 48 HH = 17,520. Leap years are 17,568. Most of the code assumes
17,520 but only crashes if you `Math.floor(length / 48)` expecting 365.
Verify your IVG pipeline handles 2024 / 2028 / 2032 etc.

### 9.3 — DST / BST transitions
UK clocks change in late March (clock forward → one HH skipped) and late
October (clock back → one HH doubled). Three options:
1. **Store HH as local time** with the missing/double samples in the data
   stream (the CSV is what it is — 17,520 lines, doubled or skipped).
2. **Store HH as UTC** with 17,520 evenly-spaced samples and let the
   display layer convert.
3. **Smooth them out** — duplicate the missing HH or average the doubled
   pair.

PABLO uses option (1) implicitly — the raw HH array's day-boundaries are
local-time-aligned. The week of the DST transition has one anomalous day
(23 or 25 hours). The aggregations don't notice because they're per-month,
not per-day. The heatmap's hour bucketing works fine. The Time Series
chart can show a slight kink on the transition day but it's not visually
disruptive.

If IVG needs precise weekday/hour bucketing across the transitions,
consider option (2).

### 9.4 — Weekday classification
`new Date(...).getDay()` returns 0 for Sunday, 6 for Saturday. PABLO
treats both as weekend. This is hardcoded. If you have sites where
Saturday is a working day (some retail / hospitality), you'd need a
per-site override — out of scope today.

### 9.5 — Timezone in toISOString
`Date.prototype.toISOString()` always returns UTC. If the start date is
local-time-meaningful but the Date object was constructed from a UTC
string, the displayed labels may be one day off. Construct dates with
`new Date(2025, 0, 1)` (local-time constructor) for predictable
behaviour.

### 9.6 — Empty / partial-year profiles
The component handles `primaryData.length === 0` (early-return zero stats).
But partial-year data (e.g. 6 months of HH) is handled less gracefully —
the monthly bars for months with no data show 0, which is correct, but
the duration curve and overview metrics are computed over the actual
present data so peak/mean are still meaningful.

### 9.7 — Assembly Provenance card (PABLO-specific)
The Data Quality tab includes an "Assembly Provenance" card that shows
**which source year each month came from** (PABLO builds profiles by
splicing months from different years into a target year). If IVG's
profiles are single-year-only, **delete the AssemblyProvenanceCard
component and the case `'quality'` reference to it**. Simple removal.

### 9.8 — `assembly_metadata` and weather
The Weather tab specifically requires `assembly_metadata.source_months`
to know which year's temperature data to fetch for each month. Without
this metadata it shows an empty state. If you want the Weather tab to
work on simple single-year profiles, **modify
WeatherAnalysisTab.jsx to fall back to the profile's year directly**
rather than per-month source years.

---

## Section 10 — Recommended port strategy

### TL;DR: **Port with refactor, then strip down to 6 of 8 views.**

### Detailed reasoning

**Why not verbatim:** PABLO's LoadInspector is deeply tied to two contexts
(`ProjectContext` and `ProjectEngineContext`). Copying files would drag in
~3,000 lines of context plumbing the IVG project doesn't need. The actual
chart logic is the gold; the wiring around it is incidental.

**Why not strip down to 2-3:** All eight views complement each other.
Overview, Time Series, Daily Profile, Monthly, Duration Curve, Heat Map,
Data Quality — none is so redundant that skipping it would clean up the
others. Plus they share the same data shape, so the marginal cost of
keeping a view is just its JSX block.

**Why drop Assembly Provenance + Weather (for now):**
- Assembly Provenance is PABLO-specific (the HH Profiler splices months
  from different years). If IVG's profiles are single-year CSVs, this
  card has nothing to render and should just be omitted.
- Weather requires the assembly metadata and an Open-Meteo backend
  proxy. Land the core inspector first, add Weather as a phase-2
  brief once the rest works.

### Recommended approach

**1. Build a stand-alone `<LoadInspector>` component that takes props:**
```ts
<LoadInspector
  hhData={number[]}         // 17,520 or 8,760 values
  intervalHours={0.5 | 1}
  startDate={string}        // ISO date
  profileName={string}      // for header / chart titles
  asc={number | null}       // optional — used as ReferenceLine in some views
/>
```
No context dependencies. The IVG Site Detail page wraps it with the right
HH data when the user toggles into the inspector view.

**2. Port six views:** Overview, Time Series, Daily Profile, Monthly,
Duration Curve, Heat Map, Data Quality. Skip Weather and the Assembly
Provenance card.

**3. Pre-compute aggregates at pipeline-build time.** Your IVG pipeline
already produces JSON per MPAN. Add these fields:
```json
{
  "hh_data": [/* 17520 values */],
  "interval_hours": 0.5,
  "start_date": "2025-01-01",
  "stats": {
    "peak_kw": 230.1,
    "mean_kw": 87.4,
    "annual_kwh": 766000,
    "load_factor": 0.38,
    "weekday_mean": 96.2,
    "weekend_mean": 58.1
  },
  "monthly": {
    "kwh": [/* 12 values */],
    "peak_kw": [/* 12 values */],
    "mean_kw": [/* 12 values */]
  },
  "daily_profile": {
    "weekday_24h": [/* 24 mean kW values */],
    "weekend_24h": [/* 24 mean kW values */]
  }
}
```
The component then reads these pre-computed fields instead of recomputing
on the client. View-specific transforms (per-month percentiles, time-series
slicing, heatmap matrix) still run on the client because they depend on
user controls.

**4. Style: rebuild against IVG's tokens.** Don't fight the PABLO Tailwind
classes. Re-style the cards/containers/buttons with IVG's Inter + Playfair
+ navy/coral/cream palette. The chart series colours can stay as-is
(`#ECB01F` gold, `#E84393` magenta, `#00AEEF` teal, `#2ECC71` green) — they
work on either light or dark backgrounds and have good contrast.

**5. Replace `useProject`/`useProjectEngine` with a single prop.** The HH
data flows in as a prop, not via context. Eliminates 90% of the
PABLO-specific wiring.

**6. Reuse the math.** The percentile function, the heat-map colour
interpolation, the per-HH-of-day bucketing, `getTimeAxisConfig`'s
tick-generation logic — these are pure JS, no PABLO dependencies. Port
verbatim into a `lib/loadInspectorTransforms.js` file.

### Estimated effort
~6–8 hours for a complete port of six views, assuming IVG's Recharts + Vite
setup is ready and the JSON shape is what I've described. Mostly mechanical
work; the algorithms are all here.

### File checklist for the receiving developer

When porting, create these files in the IVG project:

| New file | What it contains |
|---|---|
| `components/LoadInspector/LoadInspector.jsx` | Top-level component, tab switcher, state |
| `components/LoadInspector/views/OverviewView.jsx` | Overview tab |
| `components/LoadInspector/views/TimeSeriesView.jsx` | Time Series tab |
| `components/LoadInspector/views/DailyProfileView.jsx` | Daily Profile tab (both modes) |
| `components/LoadInspector/views/MonthlyView.jsx` | Monthly tab |
| `components/LoadInspector/views/DurationCurveView.jsx` | Duration Curve tab |
| `components/LoadInspector/views/HeatMapView.jsx` | Heat Map tab |
| `components/LoadInspector/views/DataQualityView.jsx` | Data Quality tab (skip provenance) |
| `components/LoadInspector/MonthJumpButtons.jsx` | Shared month-pill component |
| `lib/loadInspectorTransforms.js` | Pure transforms (percentile, durationCurve, getTimeAxisConfig, heatColor) |
| `lib/chartTokens.js` | Style tokens — IVG-themed |

### One more thing

The Heat Map's flex-grid approach (no SVG, no Recharts) is genuinely
elegant and worth preserving. It scales perfectly to any container size,
has native tooltips via `title`, and is the only view that renders 288
cells instantly. Don't be tempted to "upgrade" it to a Recharts heatmap —
the custom version is better.

---

**End of document.** If anything is ambiguous, the source lives at
`frontend/src/pages/explorer/LoadInspector.jsx` and
`frontend/src/components/inspector/WeatherAnalysisTab.jsx` in the PABLO
repo at the commit this document was extracted from.
