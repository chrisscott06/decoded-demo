import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  COLOR_NZA_CORAL, COLOR_THEME_BASE, COLOR_THEME_BODY,
  COLOR_TEXT_MUTED_ON_DARK, COLOR_TEXT_MUTED_ON_CREAM, FONT_BODY,
} from '../tokens/chart-colors.js'

/**
 * EnergyChart - stacked bar of monthly electricity (HH/NHH/Gas) per Appendix C.8.
 *
 * Props:
 *   data: array of { month: "2025-01", hh, nhh, gas }
 *   theme: 'dark' (default) - grid lines + axis colours adjust for dark navy bg
 *   height: chart height (default 320)
 */

const MONTH_SHORT = {
  '2024-10': 'Oct 24', '2024-11': 'Nov 24', '2024-12': 'Dec 24',
  '2025-01': 'Jan 25', '2025-02': 'Feb 25', '2025-03': 'Mar 25',
  '2025-04': 'Apr 25', '2025-05': 'May 25', '2025-06': 'Jun 25',
  '2025-07': 'Jul 25', '2025-08': 'Aug 25', '2025-09': 'Sep 25',
  '2025-10': 'Oct 25', '2025-11': 'Nov 25', '2025-12': 'Dec 25',
}

function fmt(n) {
  if (typeof n !== 'number') return '-'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000).toLocaleString('en-GB') + 'k'
  return Math.round(n).toLocaleString('en-GB')
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: COLOR_THEME_BASE,
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontFamily: FONT_BODY,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR_THEME_BODY, marginBottom: 6 }}>
        {MONTH_SHORT[label] || label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontSize: 12, color: p.color, display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <span style={{ width: 36, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.dataKey}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: COLOR_THEME_BODY, fontWeight: 500 }}>
            {fmt(p.value)} kWh
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EnergyChart({ data, theme = 'dark', height = 320 }) {
  const onDark = theme === 'dark'
  const axisColour = onDark ? COLOR_TEXT_MUTED_ON_DARK : COLOR_TEXT_MUTED_ON_CREAM
  const gridColour = onDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  // Format X axis labels via month abbreviation
  const formattedData = data.map((d) => ({ ...d, monthLabel: MONTH_SHORT[d.month] || d.month }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formattedData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke={gridColour} vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fill: axisColour, fontSize: 11, fontFamily: FONT_BODY }}
          axisLine={{ stroke: gridColour }}
          tickLine={false}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={{ fill: axisColour, fontSize: 11, fontFamily: FONT_BODY }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend
          wrapperStyle={{ paddingTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: axisColour }}
          iconType="circle"
        />
        {/* Chris ask 8 Jun - Recharts native animation re-enabled.
            The Brief 13 Part 4 collateral (stacked Bars stuck at 0×0
            on initial paint / HMR) was the StrictMode dev-only
            double-mount strand bug per the Pablo handoff - root-fixed
            by dropping StrictMode in main.jsx, so the Recharts default
            animation works as intended now. */}
        <Bar dataKey="hh" stackId="energy" fill={COLOR_NZA_CORAL} name="HH" animationDuration={700} animationEasing="ease-out" />
        <Bar dataKey="nhh" stackId="energy" fill={COLOR_TEXT_MUTED_ON_DARK} name="NHH" animationDuration={700} animationEasing="ease-out" />
        <Bar dataKey="gas" stackId="energy" fill={COLOR_THEME_BASE} name="Gas" animationDuration={700} animationEasing="ease-out" />
      </BarChart>
    </ResponsiveContainer>
  )
}
