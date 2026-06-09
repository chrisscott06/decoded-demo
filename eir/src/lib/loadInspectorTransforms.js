/**
 * Load Inspector transforms (Brief 11 Part 3).
 *
 * Pure helpers ported from the PABLO handoff §3 + §4.2, adapted for Westbrook's
 * pre-aggregated per-MPAN JSON shape (`hh_data[]` + `stats` + `monthly`
 * + `daily_profile` from `pipeline/readers/read_half_hourly.py`).
 *
 * Conventions:
 *   - Sample `i` STARTS at `start + i × intervalHours` (HH-ending already
 *     resolved in the reader).
 *   - `intervalHours` is always 0.5 for Westbrook.
 *   - `periodsPerDay` = 48.
 *
 * No DOM here; all functions are JSON-in JSON-out so view memos can call
 * them and Vitest can test them later if needed.
 */

export const PERIODS_PER_DAY = 48
export const INTERVAL_HOURS = 0.5
export const INTERVAL_MS = INTERVAL_HOURS * 3600 * 1000
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ---------------------------------------------------------------------------
// Pure math
// ---------------------------------------------------------------------------

/** Linear-interpolated percentile of a numeric array. */
export function percentile(arr, p) {
  if (!arr || !arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const rank = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(rank)
  const hi = Math.ceil(rank)
  if (lo === hi) return sorted[lo]
  const frac = rank - lo
  return sorted[lo] * (1 - frac) + sorted[hi] * frac
}

/** Sort descending + thin to ≤ maxPoints. Returns `[{pct, kw}]` for Recharts. */
export function durationCurve(values, maxPoints = 500) {
  const sorted = values.filter((v) => v != null && !isNaN(v)).sort((a, b) => b - a)
  const total = sorted.length
  if (!total) return []
  const step = Math.max(1, Math.floor(total / maxPoints))
  const out = []
  for (let i = 0; i < total; i += step) {
    out.push({
      pct: Math.round((i / total) * 1000) / 10,
      kw: Math.round(sorted[i] * 100) / 100,
    })
  }
  return out
}

/**
 * Heat colour interpolation - Brief 24 Part 4e r2 (Chris ask 4 Jun
 * after the cream-to-deep-red pass was still reading "shades of the
 * same pastel"):
 *
 *   "Blue flowing through to green flowing through to red, a full
 *    spectrum, so we can see really granular data and not shades of
 *    the same pastel."
 *
 * Reference: a heating/cooling demand chart Chris pasted in the chat
 * - same hour-of-year density but using the full spectrum so the
 * patterns LEAP off the canvas instead of fading into a single hue.
 *
 * 9-stop spectral ramp walking the full colour wheel:
 *   t=0.00  #2C5697  deep blue       (lowest demand)
 *   t=0.12  #3D8FB2  blue
 *   t=0.25  #6FB0A8  teal-cyan
 *   t=0.38  #A0CC8E  yellow-green
 *   t=0.50  #D6D680  yellow          (mid-band)
 *   t=0.62  #E0A85F  amber
 *   t=0.75  #D87544  orange
 *   t=0.88  #D94B3D  red
 *   t=1.00  #6E1F16  dark red        (peak demand)
 *
 * Linear interpolation between adjacent stops, perceptually continuous.
 * The full hue range means a 5% change in t reads as a clearly
 * different colour, not just a darker shade - which is what makes
 * granular patterns visible without zooming in.
 */
const HEAT_STOPS = [
  { t: 0.00, r: 0x2C, g: 0x56, b: 0x97 },
  { t: 0.12, r: 0x3D, g: 0x8F, b: 0xB2 },
  { t: 0.25, r: 0x6F, g: 0xB0, b: 0xA8 },
  { t: 0.38, r: 0xA0, g: 0xCC, b: 0x8E },
  { t: 0.50, r: 0xD6, g: 0xD6, b: 0x80 },
  { t: 0.62, r: 0xE0, g: 0xA8, b: 0x5F },
  { t: 0.75, r: 0xD8, g: 0x75, b: 0x44 },
  { t: 0.88, r: 0xB8, g: 0x44, b: 0x3A },
  { t: 1.00, r: 0x6E, g: 0x1F, b: 0x16 },
]
export function heatColor(t) {
  const clamp = Math.max(0, Math.min(1, t || 0))
  /* Find the bracketing stops and interpolate linearly between them. */
  let lo = HEAT_STOPS[0]
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1]
  for (let i = 1; i < HEAT_STOPS.length; i += 1) {
    if (HEAT_STOPS[i].t >= clamp) {
      hi = HEAT_STOPS[i]
      lo = HEAT_STOPS[i - 1]
      break
    }
  }
  const span = hi.t - lo.t
  const local = span > 0 ? (clamp - lo.t) / span : 0
  const r = Math.round(lo.r + (hi.r - lo.r) * local)
  const g = Math.round(lo.g + (hi.g - lo.g) * local)
  const b = Math.round(lo.b + (hi.b - lo.b) * local)
  return `rgb(${r}, ${g}, ${b})`
}

/* Token export for legend gradients - drop the 9 stops as a
   comma-joined CSS `linear-gradient` source so HeatMapView's
   gradient strip stays in lockstep with `heatColor`. */
export const HEAT_GRADIENT_CSS = HEAT_STOPS
  .map((s) => `rgb(${s.r}, ${s.g}, ${s.b}) ${(s.t * 100).toFixed(1)}%`)
  .join(', ')

// ---------------------------------------------------------------------------
// Indexing
// ---------------------------------------------------------------------------

/** Day index → JS Date (start of day at the given startDate's first period). */
export function dayDate(startDateISO, dayOffset) {
  const d = new Date(startDateISO + 'T00:00:00')
  d.setDate(d.getDate() + dayOffset)
  return d
}

/** Sample index → JS Date (the period STARTS at this timestamp). */
export function sampleDate(startDateISO, sampleIdx) {
  const base = new Date(startDateISO + 'T00:00:00').getTime()
  return new Date(base + sampleIdx * INTERVAL_MS)
}

export function isWeekend(date) {
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

// ---------------------------------------------------------------------------
// Derived series (computed on demand inside view memos)
// ---------------------------------------------------------------------------

/** Daily peak + mean array for Overview chart. */
export function dailyPeakMean(hhData, startDateISO) {
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  const out = []
  for (let day = 0; day < days; day++) {
    let peak = 0, sum = 0
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      const v = hhData[day * PERIODS_PER_DAY + p] || 0
      if (v > peak) peak = v
      sum += v
    }
    const d = dayDate(startDateISO, day)
    out.push({
      datetime: d.toISOString().slice(0, 10),
      label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      peak: Math.round(peak * 10) / 10,
      mean: Math.round((sum / PERIODS_PER_DAY) * 10) / 10,
    })
  }
  return out
}

/** Sliced time-series for the Time Series view (with safety thinning). */
export function timeSeriesSlice(hhData, startDateISO, startDay, zoomDays, maxPoints = 2000) {
  const sliceStart = startDay * PERIODS_PER_DAY
  const sliceEnd = Math.min((startDay + zoomDays) * PERIODS_PER_DAY, hhData.length)
  const result = []
  const base = dayDate(startDateISO, startDay).getTime()
  for (let i = sliceStart; i < sliceEnd; i++) {
    const d = new Date(base + (i - sliceStart) * INTERVAL_MS)
    result.push({
      datetime: d.toISOString(),
      label: zoomDays <= 2
        ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        : zoomDays <= 14
          ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:00`
          : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
      demand: hhData[i] || 0,
    })
  }
  if (result.length > maxPoints) {
    const step = Math.ceil(result.length / maxPoints)
    return result.filter((_, i) => i % step === 0)
  }
  return result
}

/**
 * Per-month-per-hour mean kW matrix - used by the Heat Map.
 * Returns `Float32Array(12 * 24)` (row-major: month × hour) + max.
 */
export function monthHourMatrix(hhData, startDateISO) {
  const sums = new Float32Array(12 * 24)
  const counts = new Float32Array(12 * 24)
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  for (let day = 0; day < days; day++) {
    const d = dayDate(startDateISO, day)
    const m = d.getMonth() // 0-11
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      const v = hhData[day * PERIODS_PER_DAY + p]
      if (v == null || isNaN(v)) continue
      const hour = Math.floor(p / 2)
      const idx = m * 24 + hour
      sums[idx] += v
      counts[idx] += 1
    }
  }
  let max = 0
  const result = new Float32Array(12 * 24)
  for (let i = 0; i < 12 * 24; i++) {
    result[i] = counts[i] ? sums[i] / counts[i] : 0
    if (result[i] > max) max = result[i]
  }
  return { matrix: result, max }
}

/**
 * Per-month percentile bands for the single-month Daily Profile view.
 * Returns 24-hour arrays {min, p25, p75, max, mean}.
 */
export function monthHourBands(hhData, startDateISO, month1to12) {
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  const buckets = Array.from({ length: 24 }, () => [])
  for (let day = 0; day < days; day++) {
    const d = dayDate(startDateISO, day)
    if (d.getMonth() + 1 !== month1to12) continue
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      const v = hhData[day * PERIODS_PER_DAY + p]
      if (v == null || isNaN(v)) continue
      const hour = Math.floor(p / 2)
      buckets[hour].push(v)
    }
  }
  return buckets.map((arr, hour) => {
    if (!arr.length) return {
      hour, label: `${String(hour).padStart(2, '0')}:00`,
      min: null, p25: null, p75: null, max: null, mean: null,
      rangeDelta: null, iqrDelta: null,
    }
    const sorted = [...arr].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p25 = percentile(arr, 25)
    const p75 = percentile(arr, 75)
    const mean = sum / arr.length
    /* Chris ask 8 Jun - Pablo's "stacked transparent baseline +
       visible delta" trick (see DAILY_PROFILE_RANGE_HANDOFF.md).
       Recharts <Area> stacks always render upward from 0, so to
       render a band between min and max we layer a transparent
       Area at `min` with a visible Area of `max−min` (rangeDelta)
       on top, same stackId. Visual result: a filled band from
       min to max. Same trick for the IQR band via iqrDelta. The
       `Math.max(0, …)` clamp guards against any data-quality
       inversion that would flip the band inside-out. */
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      min, max, p25, p75, mean,
      rangeDelta: Math.max(0, max - min),
      iqrDelta: Math.max(0, p75 - p25),
    }
  })
}

/**
 * Per-month weekday-vs-weekend daily profiles. Returns array of 24
 * {hour, label, weekday, weekend} where each value is the mean kW
 * for that hour across all weekday (or weekend) days in the chosen
 * month. Passing `month1to12 = null` aggregates across the whole
 * year - used by the all-months mode side-by-side chart.
 * Brief: docs/briefs/.../DAILY_PROFILE_RANGE_HANDOFF.md (Pablo).
 */
export function monthHourWeekdayWeekend(hhData, startDateISO, month1to12) {
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  const wdBuckets = Array.from({ length: 24 }, () => [])
  const weBuckets = Array.from({ length: 24 }, () => [])
  for (let day = 0; day < days; day++) {
    const d = dayDate(startDateISO, day)
    if (month1to12 != null && d.getMonth() + 1 !== month1to12) continue
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      const v = hhData[day * PERIODS_PER_DAY + p]
      if (v == null || isNaN(v)) continue
      const hour = Math.floor(p / 2)
      ;(isWeekend ? weBuckets : wdBuckets)[hour].push(v)
    }
  }
  const meanOf = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    weekday: meanOf(wdBuckets[hour]),
    weekend: meanOf(weBuckets[hour]),
  }))
}

/** Monthly coverage % for the Data Quality view. */
export function monthlyCoverage(hhData, startDateISO) {
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  const counts = new Array(12).fill(null).map(() => ({ valid: 0, total: 0 }))
  for (let day = 0; day < days; day++) {
    const m = dayDate(startDateISO, day).getMonth()
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      const v = hhData[day * PERIODS_PER_DAY + p]
      counts[m].total += 1
      if (v != null && !isNaN(v)) counts[m].valid += 1
    }
  }
  return counts.map((c, m) => ({
    month: MONTHS_SHORT[m],
    coverage: c.total ? Math.round((c.valid / c.total) * 1000) / 10 : 0,
  }))
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

export const fmtCompact = (n) => {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + 'M'
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000).toLocaleString('en-GB') + 'k'
  return n.toLocaleString('en-GB', { maximumFractionDigits: 1 })
}

export const fmtKW = (v) => (typeof v === 'number' ? `${Math.round(v * 10) / 10}` : '-')
export const fmtPct = (v) => (typeof v === 'number' ? `${Math.round(v * 10) / 10}%` : '-')
