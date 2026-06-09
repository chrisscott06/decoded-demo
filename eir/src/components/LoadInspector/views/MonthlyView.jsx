import { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import { MONTHS_SHORT } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_NZA_CORAL, COLOR_SCOPE_12, COLOR_THEME_ACCENT_PRIMARY, COLOR_TOOLTIP_BG } from '../../../tokens/chart-colors.js'

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fill: 'rgba(31, 51, 40,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(31, 51, 40,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

export default function MonthlyView({ ctx }) {
  const { monthly } = ctx
  const [showPeak, setShowPeak] = useState(true)
  const [showMean, setShowMean] = useState(true)

  const data = MONTHS_SHORT.map((m, i) => ({
    month: m,
    kwh: Math.round(monthly.kwh?.[i] || 0),
    peak: monthly.peak_kw?.[i] || 0,
    mean: monthly.mean_kw?.[i] || 0,
  }))

  return (
    /* Chris ask post-Brief-15: chart fills available vertical. */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Checkbox checked={showPeak} onChange={setShowPeak} label="Show peak kW" />
        <Checkbox checked={showMean} onChange={setShowMean} label="Show mean kW" />
      </div>

      <div style={{ flex: 1, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} />
            <YAxis
              yAxisId="kwh"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v}
              width={48}
            />
            <YAxis
              yAxisId="kw"
              orientation="right"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11 }} />
            <Bar yAxisId="kwh" dataKey="kwh" fill={COLOR_NZA_CORAL} name="kWh" radius={[3, 3, 0, 0]} animationDuration={700} animationEasing="ease-out" />
            {showPeak && (
              <Line yAxisId="kw" type="monotone" dataKey="peak" stroke={COLOR_THEME_ACCENT_PRIMARY} strokeWidth={2} dot={{ r: 3 }} name="Peak kW" animationDuration={800} animationEasing="ease-out" />
            )}
            {showMean && (
              <Line yAxisId="kw" type="monotone" dataKey="mean" stroke={COLOR_SCOPE_12} strokeWidth={2} dot={{ r: 3 }} name="Mean kW" animationDuration={800} animationEasing="ease-out" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      color: 'rgba(31, 51, 40,0.7)',
      cursor: 'pointer',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--color-nza-coral)' }}
      />
      {label}
    </label>
  )
}
