import { useState, useMemo } from 'react'
import { LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import { monthHourBands, monthHourWeekdayWeekend, MONTHS_SHORT, monthHourMatrix } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_TOOLTIP_BG, METRIC_HEX, COLOR_WEEKDAY, COLOR_WEEKEND } from '../../../tokens/chart-colors.js'

/**
 * DailyProfileView - two-up Pablo redesign (8 Jun).
 *
 * Both modes render two charts side-by-side:
 *
 *   ALL MONTHS:
 *     Left:  12-month overlay (existing Westbrook behaviour - 12 colour-ramped
 *            lines showing mean kW per hour per month).
 *     Right: Weekday vs Weekend across the whole year - two lines, teal
 *            weekday + pink weekend.
 *
 *   SINGLE MONTH:
 *     Left:  Range bands chart (Pablo). Three layers from back to front:
 *              - Min/Max band (grey 30% opacity) via stacked transparent
 *                baseline + visible delta Area trick.
 *              - P25/P75 band (gold 25% opacity), same trick.
 *              - Max line (faint grey) at the top edge of the range band.
 *              - Mean line (rich gold, the headline series).
 *            Three layer-toggle chips above the chart let the user
 *            hide the Min/Max, P25/P75, or Mean independently.
 *     Right: Weekday vs Weekend for that month.
 *
 * Why two charts side-by-side: at full viewport the single-chart layout
 * stretched the daily profile across ~1280 px of horizontal space, which
 * makes the curve read flat and wastes the information density. Two
 * compact charts at ~600 px each give the eye the same range to scan
 * while pairing the "shape" (left) with the "weekday/weekend split"
 * (right) in one view.
 *
 * Stacked-Area trick reference: docs from Pablo's
 * DAILY_PROFILE_RANGE_HANDOFF.md. Recharts <Area> can't render a
 * band between two arbitrary values directly - Areas always render
 * upward from a baseline of 0 (or the chart's stacked baseline). To
 * render a band from min to max we stack a transparent <Area> at
 * `min` with a visible <Area> of `max - min` (`rangeDelta`) on top.
 * The transparent area positions the stack baseline at `min`; the
 * visible delta renders the band height. Same trick for the IQR
 * band with `iqrDelta`. The transforms in
 * `loadInspectorTransforms.js` compute the deltas.
 *
 * Brief 11 §2.3 origin; Chris 8 Jun rebuild adapted from Pablo handoff.
 */

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fill: 'rgba(31, 51, 40,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(31, 51, 40,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

// Chris ask 8 Jun (v2) - seasonal colour ramp for the all-months
// overlay. Replaces the previous brand-token shotgun (slate / teal /
// lime / pink / purple / dark teal - "all over the shop" per Chris)
// with a clean four-season palette: winter blue → spring green →
// summer red → autumn orange. Three monthly shades per season give
// each month its own distinct line while the season-wide hue keeps
// the legend readable. Lines render Jan→Dec; the legend ALSO renders
// Jan→Dec (custom Legend content function - Recharts' default would
// otherwise sort alphabetically by name).
const MONTH_RAMP = [
  '#2B6DAA', // Jan - winter deep
  '#5C99C5', // Feb - winter lighter (warming toward spring)
  '#93CC8D', // Mar - spring pale
  '#5FB95F', // Apr - spring mid
  '#3D9447', // May - spring deep (heading toward summer)
  '#E97C5D', // Jun - summer warm-coral (early)
  '#DD4444', // Jul - summer red (peak heat)
  '#B6342A', // Aug - summer deep red
  '#E07F35', // Sep - autumn orange
  '#C46125', // Oct - autumn rust
  '#8F4E25', // Nov - autumn brown (cooling)
  '#1F4F80', // Dec - winter deepest blue
]

// Season mapping for icon assignment in the legend. Index = month (0-11).
// Dec/Jan/Feb = winter, Mar/Apr/May = spring, Jun/Jul/Aug = summer,
// Sep/Oct/Nov = autumn.
const MONTH_SEASON = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
  'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
]

// Pablo palette - gold for electricity (matches Overview), grey for
// the wider Min/Max band so the range recedes and the mean reads first.
const COLOR_MEAN_GOLD  = METRIC_HEX.electricity  // #E6B91E rich gold
const COLOR_BAND_RANGE = '#D5D8DC'                // light grey for Min/Max band
const COLOR_LINE_MAX   = '#BDC3C7'                // slightly darker grey for the Max line

export default function DailyProfileView({ ctx }) {
  const { hhData, startDate } = ctx
  const [month, setMonth] = useState(null) // null = all months overlay
  /* Layer toggles for the single-month mode - Range / IQR / Mean are
     independently switchable. Default all on. The right-hand
     Weekday/Weekend chart is unaffected by these toggles (it's a
     separate visualisation, not a layer of the same one). */
  const [layers, setLayers] = useState({ range: true, iqr: true, mean: true })

  // All-months overlay data: one 24-hour series per month (existing logic).
  const overlayData = useMemo(() => {
    const { matrix } = monthHourMatrix(hhData, startDate)
    const out = []
    for (let h = 0; h < 24; h++) {
      const row = { hour: `${String(h).padStart(2, '0')}:00` }
      for (let m = 0; m < 12; m++) {
        row[MONTHS_SHORT[m]] = Math.round(matrix[m * 24 + h] * 100) / 100
      }
      out.push(row)
    }
    return out
  }, [hhData, startDate])

  // Single-month band data (Min/Max + P25/P75 + Mean + deltas).
  const bandsData = useMemo(() => {
    if (month === null) return null
    return monthHourBands(hhData, startDate, month + 1)
  }, [hhData, startDate, month])

  // Weekday-vs-Weekend data - for the right-hand chart in BOTH modes.
  // When `month` is null we pass null to aggregate across the year.
  const wdWeData = useMemo(() => {
    return monthHourWeekdayWeekend(hhData, startDate, month === null ? null : month + 1)
  }, [hhData, startDate, month])

  return (
    /* Chart slot - flex column. Month picker on top, two-up grid below. */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, minWidth: 0 }}>
      {/* Month selector + layer toggle chips. Layer chips only appear
          when a specific month is picked (range bands are single-month
          only). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <button
            type="button"
            onClick={() => setMonth(null)}
            style={pillStyle(month === null)}
          >
            All months
          </button>
          {MONTHS_SHORT.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonth(i)}
              style={pillStyle(month === i)}
            >
              {m}
            </button>
          ))}
        </div>
        {month !== null && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <LayerChip label="Min/Max" colour={COLOR_BAND_RANGE} active={layers.range}
              onClick={() => setLayers(s => ({ ...s, range: !s.range }))} />
            <LayerChip label="P25/P75" colour={COLOR_MEAN_GOLD} active={layers.iqr}
              onClick={() => setLayers(s => ({ ...s, iqr: !s.iqr }))} />
            <LayerChip label="Mean" colour={COLOR_MEAN_GOLD} active={layers.mean}
              onClick={() => setLayers(s => ({ ...s, mean: !s.mean }))} />
          </div>
        )}
      </div>

      {/* Two-column grid - both charts share the row height. */}
      <div style={{
        flex: 1, minHeight: 0, minWidth: 0,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
      }}>
        {/* LEFT pane - overlay (all-months) or range bands (single-month). */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <PaneTitle>
            {month === null ? 'Daily profile by month' : `Daily profile with range - ${MONTHS_SHORT[month]}`}
          </PaneTitle>
          <div style={{ flex: 1, minHeight: 200 }}>
            {month === null ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overlayData} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
                  <XAxis dataKey="hour" tick={AXIS_STYLE} interval={2} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  {/* Chris ask 8 Jun (v2) - calendar-order legend with
                      season icons. Recharts' default Legend would sort
                      items alphabetically by series name, which makes
                      no intuitive sense for months. The custom content
                      function renders Jan→Dec with a small SVG season
                      icon (snowflake / sprout / sun / leaf) prefixing
                      each month. Wraps onto two rows naturally at
                      narrow widths. */}
                  <Legend
                    wrapperStyle={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10 }}
                    content={() => <SeasonLegend />}
                  />
                  {MONTHS_SHORT.map((m, i) => (
                    <Line
                      key={m}
                      type="monotone"
                      dataKey={m}
                      stroke={MONTH_RAMP[i]}
                      strokeWidth={1.4}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {/* Key on month so the chart re-mounts and replays its
                    entrance every time the user picks a different month
                    - cleaner than the cross-cardinality tween glitch we
                    hit on Time Series. */}
                <ComposedChart key={month} data={bandsData} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
                  <XAxis dataKey="label" tick={AXIS_STYLE} interval={2} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
                  {/* Custom Tooltip - filter out the *Delta shim series
                      so the user sees min/max/p25/p75/mean numbers but
                      not the synthetic "rangeDelta" / "iqrDelta" values
                      the stack trick depends on (Pablo handoff §7.2). */}
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    content={({ active, payload, label }) => {
                      if (!active || !payload) return null
                      const visible = payload.filter(p => !String(p.dataKey).includes('Delta') && p.dataKey !== 'p25' && p.dataKey !== 'min')
                      return (
                        <div style={TOOLTIP_STYLE}>
                          <div style={{ color: 'rgba(31, 51, 40,0.55)', fontSize: 11, marginBottom: 4 }}>{label}</div>
                          {visible.map((p, i) => (
                            <div key={i} style={{ color: p.stroke || p.fill, fontSize: 12 }}>
                              {p.name}: {p.value != null ? `${p.value.toFixed(1)} kW` : '-'}
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />

                  {/* Min/Max band - transparent shim at min + visible
                      grey band of (max - min) stacked on top, both
                      sharing stackId="range". Hidden when toggle off. */}
                  {layers.range && (
                    <>
                      <Area type="monotone" dataKey="min" stackId="range"
                        fill="transparent" stroke="none" name="Min" legendType="none" />
                      <Area type="monotone" dataKey="rangeDelta" stackId="range"
                        fill={COLOR_BAND_RANGE} fillOpacity={0.35} stroke="none"
                        name="rangeDelta" legendType="none" />
                    </>
                  )}

                  {/* P25/P75 band - same stack trick, gold tinted. */}
                  {layers.iqr && (
                    <>
                      <Area type="monotone" dataKey="p25" stackId="iqr"
                        fill="transparent" stroke="none" name="P25" legendType="none" />
                      <Area type="monotone" dataKey="iqrDelta" stackId="iqr"
                        fill={COLOR_MEAN_GOLD} fillOpacity={0.25} stroke="none"
                        name="iqrDelta" legendType="none" />
                    </>
                  )}

                  {/* Max line - top edge of the grey band, faint */}
                  {layers.range && (
                    <Line type="monotone" dataKey="max"
                      stroke={COLOR_LINE_MAX} strokeWidth={1} dot={false} name="Max"
                      animationDuration={800} animationEasing="ease-out" />
                  )}

                  {/* Mean line - the headline gold series */}
                  {layers.mean && (
                    <Line type="monotone" dataKey="mean"
                      stroke={COLOR_MEAN_GOLD} strokeWidth={2} dot={false} name="Mean"
                      animationDuration={800} animationEasing="ease-out" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* RIGHT pane - Weekday vs Weekend for the same scope. */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <PaneTitle>
            {month === null ? 'Weekday vs weekend' : `Weekday vs weekend - ${MONTHS_SHORT[month]}`}
          </PaneTitle>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                key={month === null ? 'all' : month}
                data={wdWeData}
                margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
                <XAxis dataKey="label" tick={AXIS_STYLE} interval={2} tickLine={false} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => v != null ? `${v.toFixed(1)} kW` : '-'} />
                <Legend wrapperStyle={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11 }} />
                <Line type="monotone" dataKey="weekday" name="Weekday"
                  stroke={COLOR_WEEKDAY} strokeWidth={2} dot={false}
                  animationDuration={800} animationEasing="ease-out" />
                <Line type="monotone" dataKey="weekend" name="Weekend"
                  stroke={COLOR_WEEKEND} strokeWidth={2} dot={false}
                  animationDuration={800} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaneTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 10, fontWeight: 600,
      letterSpacing: 1.2, textTransform: 'uppercase',
      color: 'rgba(31, 51, 40,0.55)',
      marginBottom: 6,
    }}>{children}</div>
  )
}

function LayerChip({ label, colour, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px',
        borderRadius: 4,
        border: active ? '1px solid rgba(31, 51, 40,0.2)' : '1px solid rgba(31, 51, 40,0.08)',
        background: active ? 'rgba(255,255,255,0.6)' : 'rgba(31, 51, 40,0.04)',
        color: active ? 'rgba(31, 51, 40,0.85)' : 'rgba(31, 51, 40,0.45)',
        fontFamily: 'var(--font-heading)',
        fontSize: 11,
        fontWeight: 400,
        cursor: 'pointer',
        opacity: active ? 1 : 0.6,
      }}
    >
      <span style={{
        display: 'inline-block', width: 10, height: 2, borderRadius: 1,
        background: colour, flexShrink: 0,
      }} />
      {label}
    </button>
  )
}

/* SeasonLegend - calendar-order legend for the 12-month overlay.
   Renders Jan→Dec with a small SVG season icon (winter snowflake,
   spring sprout, summer sun, autumn leaf) prefixing each month so
   the reader gets two redundant cues: colour AND season iconography.
   Wraps across lines naturally for narrow viewports. Chris ask 8 Jun. */
function SeasonLegend() {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      alignItems: 'center', gap: '4px 10px',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 10, color: 'rgba(31, 51, 40,0.75)',
      padding: '4px 8px',
    }}>
      {MONTHS_SHORT.map((m, i) => (
        <span key={m} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: MONTH_RAMP[i], display: 'inline-flex' }}>
            <SeasonIcon season={MONTH_SEASON[i]} size={12} />
          </span>
          <span style={{
            display: 'inline-block', width: 12, height: 2, borderRadius: 1,
            background: MONTH_RAMP[i],
          }} />
          {m}
        </span>
      ))}
    </div>
  )
}

/* SeasonIcon - four inline SVG glyphs rendered at the supplied size
   (default 12 px). 16×16 viewBox gives enough pixel density to draw
   actually recognisable shapes - the previous 10×10 attempt read as
   "snowflake / nettle leaf / sun / pointed leaf" per Chris. v2
   redesigns:
     - Winter: proper 6-axis snowflake with tip-branches and a small
       centre dot, the classic "❄" silhouette.
     - Spring: tulip flower on a stem with a side leaf - reads
       as "fresh growth".
     - Summer: sun disc with 8 evenly-spaced rays of two lengths
       (alternating long/short for a polished look).
     - Autumn: clearly-leaf-shaped silhouette (broadleaf with a
       central vein and a stem tilted as if mid-fall).
   All use `currentColor` so the parent span tints them per-month. */
function SeasonIcon({ season, size = 12 }) {
  const c = 'currentColor'
  switch (season) {
    case 'winter':
      // Snowflake - 3 main axes + Y-branches at every tip + centre dot.
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"
          fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Three full axes through the centre */}
          <line x1="8" y1="1.5" x2="8" y2="14.5" />
          <line x1="2.5" y1="4.7" x2="13.5" y2="11.3" />
          <line x1="13.5" y1="4.7" x2="2.5" y2="11.3" />
          {/* Y-branches at the top + bottom tips */}
          <path d="M6.5 3 L8 4.3 L9.5 3" />
          <path d="M6.5 13 L8 11.7 L9.5 13" />
          {/* Y-branches on the right-side diagonal tips */}
          <path d="M11.9 4.1 L13.5 4.7 L12.9 6.3" />
          <path d="M11.9 11.9 L13.5 11.3 L12.9 9.7" />
          {/* Y-branches on the left-side diagonal tips */}
          <path d="M4.1 4.1 L2.5 4.7 L3.1 6.3" />
          <path d="M4.1 11.9 L2.5 11.3 L3.1 9.7" />
          {/* Tiny centre dot to anchor the radial composition */}
          <circle cx="8" cy="8" r="0.9" fill={c} stroke="none" />
        </svg>
      )
    case 'spring':
      // Tulip - cup-shaped flower head on a slender stem with one side leaf.
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          {/* Flower cup - three petal arcs sharing a bottom point */}
          <path d="M4.5 7 Q4.5 4 8 3 Q11.5 4 11.5 7 Q11.5 8 10.5 8 Q10.5 6 8 5 Q5.5 6 5.5 8 Q4.5 8 4.5 7 Z" fill={c} />
          <path d="M5.5 8 Q5.5 9.5 8 10 Q8 8 8 5 Q8 8 8 10 Q10.5 9.5 10.5 8 L10.5 7.5 Q9 7 8 7 Q7 7 5.5 7.5 Z" fill={c} />
          {/* Stem */}
          <line x1="8" y1="10" x2="8" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
          {/* Side leaf - a single curved blade reaching down-left */}
          <path d="M8 12 Q5 11.5 4 13.5 Q6 13.5 8 13 Z" fill={c} />
        </svg>
      )
    case 'summer':
      // Sun - disc with 8 alternating rays (4 long cardinal + 4 short diagonal).
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill={c} />
          <g stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none">
            {/* Four long cardinal rays */}
            <line x1="8" y1="1.2" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="14.8" />
            <line x1="1.2" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="14.8" y2="8" />
            {/* Four shorter diagonal rays */}
            <line x1="3.2" y1="3.2" x2="4.4" y2="4.4" />
            <line x1="11.6" y1="11.6" x2="12.8" y2="12.8" />
            <line x1="3.2" y1="12.8" x2="4.4" y2="11.6" />
            <line x1="11.6" y1="4.4" x2="12.8" y2="3.2" />
          </g>
        </svg>
      )
    case 'autumn':
    default:
      // Broadleaf - symmetric leaf body with a central vein and an
      // angled stem (suggests the leaf has just dropped).
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          {/* Leaf body - ovate with a pointed tip and pointed base */}
          <path d="M8 2 Q3 5 3 9 Q4 12 8 13 Q12 12 13 9 Q13 5 8 2 Z" fill={c} />
          {/* Central vein - soft white at low opacity reads as a vein,
              works on every month colour because it's just a fade */}
          <line x1="8" y1="3" x2="8" y2="12.5" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Side veins (two pairs) - same fade */}
          <path d="M8 6.5 L 5.5 8 M8 6.5 L 10.5 8 M8 9.5 L 5.8 10.8 M8 9.5 L 10.2 10.8"
            stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" strokeLinecap="round" fill="none" />
          {/* Stem tilted (falling - suggests the leaf is mid-drop) */}
          <line x1="8" y1="13" x2="10" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
  }
}

function pillStyle(isActive) {
  return {
    padding: '4px 10px',
    borderRadius: 4,
    border: isActive ? '1px solid var(--color-nza-coral)' : '1px solid rgba(31, 51, 40,0.12)',
    background: isActive ? 'rgba(232, 116, 60,0.10)' : 'transparent',
    color: isActive ? 'var(--color-nza-coral)' : 'rgba(31, 51, 40,0.7)',
    fontFamily: 'var(--font-heading)',
    fontSize: 11,
    fontWeight: isActive ? 500 : 400,
    cursor: 'pointer',
  }
}
