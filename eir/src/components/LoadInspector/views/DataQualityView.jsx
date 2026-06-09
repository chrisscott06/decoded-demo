import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

import { monthlyCoverage } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_RISK_LOW, COLOR_RISK_MODERATE, COLOR_RISK_MAJOR, COLOR_TOOLTIP_BG } from '../../../tokens/chart-colors.js'

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fill: 'rgba(31, 51, 40,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(31, 51, 40,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

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

function coverageColor(pct) {
  if (pct >= 95) return COLOR_RISK_LOW
  if (pct >= 80) return COLOR_RISK_MODERATE
  return COLOR_RISK_MAJOR
}

/**
 * DataQualityView - coverage % + monthly coverage bars + missing/zero
 * period counts. Assembly-Provenance card explicitly skipped (PABLO-only).
 * Brief 11 §2.7.
 */
export default function DataQualityView({ ctx }) {
  const { hhData, startDate, stats } = ctx
  const monthlyCov = useMemo(() => monthlyCoverage(hhData, startDate), [hhData, startDate])

  const coveragePct = Math.round(((stats.coverage ?? 0) * 1000)) / 10

  return (
    /* Chris ask post-Brief-15: chart fills available vertical (cards
       above stay at intrinsic height). */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, minWidth: 0 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
      }}>
        <Card label="Coverage"        value={`${coveragePct}`}                 unit="%" helper={`${stats.period_count?.toLocaleString('en-GB')} periods`} />
        <Card label="Missing periods" value={stats.missing_periods?.toLocaleString('en-GB') || '0'}              helper="No reading" />
        <Card label="Zero periods"    value={stats.zero_periods?.toLocaleString('en-GB') || '0'}                 helper="Reported as 0 kW" />
        <Card label="Duration"        value={stats.duration_days?.toLocaleString('en-GB') || '0'}                unit="days" />
      </div>

      <div style={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11,
          color: 'rgba(31, 51, 40,0.55)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>Monthly coverage - % of expected periods present</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyCov} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(31, 51, 40,0.06)" />
            <XAxis dataKey="month" tick={AXIS_STYLE} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Coverage']} />
            <Bar dataKey="coverage" radius={[3, 3, 0, 0]} animationDuration={700} animationEasing="ease-out">
              {monthlyCov.map((m, i) => (
                <Cell key={i} fill={coverageColor(m.coverage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
