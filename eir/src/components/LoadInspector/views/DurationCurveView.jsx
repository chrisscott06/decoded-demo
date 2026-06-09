import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

import { durationCurve, percentile } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_NZA_CORAL, COLOR_THEME_ACCENT_PRIMARY, COLOR_SCOPE_12, COLOR_TOOLTIP_BG } from '../../../tokens/chart-colors.js'

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fill: 'rgba(26,36,64,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(26,36,64,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

/**
 * DurationCurveView - standalone larger duration curve with P10/P50/P90
 * markers (Brief 11 §2.5).
 */
export default function DurationCurveView({ ctx }) {
  const { hhData } = ctx
  const curve = useMemo(() => durationCurve(hhData, 1000), [hhData])
  const p10 = useMemo(() => Math.round(percentile(hhData, 90) * 10) / 10, [hhData]) // top 10 % of load
  const p50 = useMemo(() => Math.round(percentile(hhData, 50) * 10) / 10, [hhData])
  const p90 = useMemo(() => Math.round(percentile(hhData, 10) * 10) / 10, [hhData]) // bottom 10 %

  return (
    /* Chris ask post-Brief-15: chart fills available vertical. */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontFamily: 'var(--font-body)', fontSize: 12 }}>
        <Stat label="Top 10 % ≥" value={`${p10} kW`} color={COLOR_THEME_ACCENT_PRIMARY} />
        <Stat label="Median (P50)" value={`${p50} kW`} color={COLOR_NZA_CORAL} />
        <Stat label="Bottom 10 % ≤" value={`${p90} kW`} color={COLOR_SCOPE_12} />
      </div>

      <div style={{ flex: 1, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curve} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="dcGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_NZA_CORAL} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLOR_NZA_CORAL} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(26,36,64,0.06)" />
            <XAxis
              dataKey="pct"
              tick={AXIS_STYLE}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              label={{
                value: '% of periods (sorted high to low)',
                position: 'insideBottom',
                offset: -2,
                style: { fontSize: 11, fill: 'rgba(26,36,64,0.55)' },
              }}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
              label={{
                value: 'kW',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: 'rgba(26,36,64,0.55)' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => `Top ${v}% of periods`}
              formatter={(v) => [`${v} kW`, 'Load']}
            />
            <Area type="monotone" dataKey="kw" stroke={COLOR_NZA_CORAL} fill="url(#dcGrad2)" strokeWidth={1.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
      <span style={{ color: 'rgba(26,36,64,0.55)' }}>{label}</span>
      <strong style={{ color: 'var(--color-theme-base)', fontWeight: 500 }}>{value}</strong>
    </span>
  )
}
