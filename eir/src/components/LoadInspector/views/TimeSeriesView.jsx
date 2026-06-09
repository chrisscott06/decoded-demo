import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { timeSeriesSlice, PERIODS_PER_DAY, MONTHS_SHORT, dayDate } from '../../../lib/loadInspectorTransforms.js'
import { COLOR_NZA_CORAL, COLOR_TOOLTIP_BG } from '../../../tokens/chart-colors.js'

/**
 * TimeSeriesView - zoom pills + scrubber, single line chart.
 * Brief 11 §2.2.
 */

const ZOOM_OPTIONS = [
  { id: 1,   label: '1 day' },
  { id: 7,   label: '1 week' },
  { id: 14,  label: '2 weeks' },
  { id: 30,  label: '1 month' },
  { id: 91,  label: 'Quarter' },
  { id: 182, label: '6 months' },
  { id: 365, label: 'Year' },
]

const AXIS_STYLE = { fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fill: 'rgba(26,36,64,0.55)' }
const TOOLTIP_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 12,
  background: COLOR_TOOLTIP_BG,
  border: '1px solid rgba(26,36,64,0.15)',
  borderRadius: 6,
  padding: '8px 10px',
}

export default function TimeSeriesView({ ctx }) {
  const { hhData, startDate } = ctx
  const totalDays = Math.floor(hhData.length / PERIODS_PER_DAY)

  const [zoomDays, setZoomDays] = useState(7)
  // Default to most recent window (end-anchored).
  const initialStart = Math.max(0, totalDays - zoomDays)
  const [startDay, setStartDay] = useState(initialStart)

  const slice = useMemo(
    () => timeSeriesSlice(hhData, startDate, startDay, zoomDays),
    [hhData, startDate, startDay, zoomDays]
  )

  // Month-jump shortcuts (skip to start of each calendar month present)
  const monthJumps = useMemo(() => {
    const seen = new Set()
    const jumps = []
    for (let day = 0; day < totalDays; day++) {
      const d = dayDate(startDate, day)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (!seen.has(key) && d.getDate() === 1) {
        seen.add(key)
        jumps.push({
          label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
          day,
        })
      }
    }
    return jumps
  }, [startDate, totalDays])

  // Clamp start when zoom changes
  function changeZoom(z) {
    setZoomDays(z)
    setStartDay((s) => Math.max(0, Math.min(s, totalDays - z)))
  }

  const tickStep = Math.max(1, Math.floor(slice.length / 8))

  return (
    /* Chris ask post-Brief-15: chart fills available vertical. View is
       a flex column; chart wrapper below uses flex:1 so it grows to fill
       the LoadInspector active-view slot (which is itself flex:1 inside
       the SiteEnergy Panel with fullHeight). */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, minWidth: 0 }}>
      {/* Zoom pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(26,36,64,0.04)', borderRadius: 6 }}>
          {ZOOM_OPTIONS.map((z) => {
            const isActive = z.id === zoomDays
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => changeZoom(z.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: isActive ? 'var(--color-nza-cream)' : 'transparent',
                  color: isActive ? 'var(--color-nza-coral)' : 'rgba(26,36,64,0.65)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 11,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                }}
              >
                {z.label}
              </button>
            )
          })}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'rgba(26,36,64,0.55)',
        }}>
          Day {startDay + 1} of {totalDays}
        </div>
      </div>

      {/* Month jumps */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {monthJumps.map((m) => (
          <button
            key={m.day}
            type="button"
            onClick={() => setStartDay(m.day)}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid rgba(26,36,64,0.12)',
              background: 'transparent',
              color: 'rgba(26,36,64,0.7)',
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Scrubber */}
      <div>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalDays - zoomDays)}
          value={startDay}
          onChange={(e) => setStartDay(parseInt(e.target.value, 10))}
          style={{ width: '100%', accentColor: 'var(--color-nza-coral)' }}
          aria-label="Time series start day"
        />
      </div>

      {/* Chart - flex-fills the remaining height. minHeight floor prevents
          collapse on very short viewports (Brief 13 Rule 10).
          Chris ask 8 Jun (v2) - granularity glitch fix. Previously the
          chart was unkeyed so Recharts tried to tween between data
          arrays with different point counts (1 week → 2 weeks =
          336 → 672 points) and the partial overlap rendered as a
          back-and-forth "right-to-left then left-to-right" glitch.
          Pablo handoff confirms cardinality changes are NOT real
          morphs - "the chart re-renders and the new shape replays
          the entrance". Solution: key the LineChart on `zoomDays`
          so every pill click forces a fresh mount + clean
          left-to-right entrance.
          Line colour reverted to coral 8 Jun (Chris ask, supersedes
          the brief gold experiment). The gold worked for the Overview
          fuel-comparison palette but felt off-piste here against the
          coral nav chrome - keeping coral on Granular ties the
          chart back to the tool's primary accent. */}
      <div style={{ flex: 1, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={zoomDays} data={slice} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(26,36,64,0.06)" />
            <XAxis
              dataKey="label"
              tick={AXIS_STYLE}
              interval={tickStep - 1}
              tickLine={false}
            />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="demand" stroke={COLOR_NZA_CORAL} strokeWidth={1.4} dot={false} name="kW" animationDuration={800} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
