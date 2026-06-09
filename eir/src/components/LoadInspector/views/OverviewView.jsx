import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

import { dailyPeakMean, durationCurve, fmtCompact, fmtKW } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_NZA_CORAL, COLOR_SCOPE_12, COLOR_TOOLTIP_BG } from '../../../tokens/chart-colors.js'

/**
 * Overview view - 6 metric cards + daily peak/mean line chart + duration
 * curve. Per Brief 11 §2.1 + handoff Section 2.1.
 */

const CARD_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 16px',
  background: 'rgba(31, 51, 40,0.03)',
  border: '1px solid rgba(31, 51, 40,0.08)',
  borderRadius: 8,
}

function Card({ label, value, unit, helper }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: 'rgba(31, 51, 40,0.5)',
        fontWeight: 500,
      }}>{label}</div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-theme-base)',
        fontWeight: 500,
      }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: 'rgba(31, 51, 40,0.55)' }}>{unit}</span>}
      </div>
      {helper && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'rgba(31, 51, 40,0.55)',
        }}>{helper}</div>
      )}
    </div>
  )
}

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fill: 'rgba(31, 51, 40,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(31, 51, 40,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

export default function OverviewView({ ctx }) {
  const { hhData, startDate, stats } = ctx

  const dailySeries = useMemo(() => dailyPeakMean(hhData, startDate), [hhData, startDate])
  const dcurve = useMemo(() => durationCurve(hhData, 500), [hhData])

  // Sample the daily series for the axis ticks (every ~30 days). Note
  // the chart uses `datetime` (unique ISO date) as the X axis key - if we
  // used the human label "Apr 24" instead, Recharts would collapse all
  // 30 days that share that label into one point and the line would
  // visibly degrade.
  const tickStep = Math.max(1, Math.floor(dailySeries.length / 8))
  const tickFormatter = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
  }

  return (
    /* Chris ask post-Brief-15: fill vertical space. View has 6 metric
       cards + daily peak/mean chart + duration curve - distributing
       the freed height across the two charts (200 → 260, 180 → 240). */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, minWidth: 0 }}>
      {/* Metric cards - 6 across at 1440 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
      }}>
        <Card label="Peak"        value={fmtKW(stats.peak_kw)}            unit="kW" />
        <Card label="Mean"        value={fmtKW(stats.mean_kw)}            unit="kW" />
        <Card label="Annual kWh"  value={fmtCompact(stats.annual_kwh)}    unit="kWh" />
        <Card label="Load factor" value={`${Math.round((stats.load_factor || 0) * 1000) / 10}`} unit="%" />
        <Card label="Weekday mean" value={fmtKW(stats.weekday_mean)}      unit="kW" />
        <Card label="Weekend mean" value={fmtKW(stats.weekend_mean)}      unit="kW" />
      </div>

      {/* Daily peak + mean over time */}
      <div style={{ flex: 1, minHeight: 160 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11,
          color: 'rgba(31, 51, 40,0.55)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>Daily peak & mean (kW)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailySeries} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
            <XAxis
              dataKey="datetime"
              tick={AXIS_STYLE}
              tickFormatter={tickFormatter}
              interval={tickStep - 1}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => v}
            />
            <Line type="monotone" dataKey="peak" stroke={COLOR_NZA_CORAL} strokeWidth={1.4} dot={false} name="Peak kW" animationDuration={800} animationEasing="ease-out" />
            <Line type="monotone" dataKey="mean" stroke={COLOR_SCOPE_12} strokeWidth={1.4} dot={false} name="Mean kW" animationDuration={800} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Duration curve */}
      <div style={{ flex: 1, minHeight: 140 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11,
          color: 'rgba(31, 51, 40,0.55)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>Duration curve - load sorted high-to-low</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dcurve} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_NZA_CORAL} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLOR_NZA_CORAL} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
            <XAxis
              dataKey="pct"
              tick={AXIS_STYLE}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
            />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => `Top ${v}% of periods`}
              formatter={(v) => [`${v} kW`, 'Load']}
            />
            <Area type="monotone" dataKey="kw" stroke={COLOR_NZA_CORAL} fill="url(#dcGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
