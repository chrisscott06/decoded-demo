import { useMemo } from 'react'

import {
  heatColor, HEAT_GRADIENT_CSS, MONTHS_SHORT,
  PERIODS_PER_DAY, dayDate,
} from '../../../lib/loadInspectorTransforms.js'

/**
 * HeatMapView - Brief 24 Part 4e r2 (Chris ask 4 Jun, after the first
 * pass was still "monthly granularity, shades of the same pastel"):
 *
 *   "We want some way better. Every hour of the year in one view…
 *    really granular data."
 *
 * Reference: a heating/cooling demand chart (pasted in chat) showing
 * every HH slot of every day of the year in one rectangle, with a full
 * spectrum colour ramp instead of monotone warm. That's the bar.
 *
 * Layout:
 *   - Grid is days-of-year (X axis, ~365 cols) × HH-of-day (Y axis,
 *     48 rows). One cell per half-hour for the whole CY25 dataset.
 *   - At a 1280px graphic width that's ~3.5 px per day - narrow but
 *     visible. Patterns leap out at this density.
 *   - Month labels along the X axis at month boundaries.
 *   - Hour labels (00, 06, 12, 18) on the Y axis.
 *   - Full-spectrum gradient legend (blue → green → red) below the
 *     grid, sourced from `HEAT_GRADIENT_CSS`.
 *   - Title strip uses calendar boundaries computed from the data's
 *     own start date so the grid actually lines up with month labels.
 *
 * Sparse / pending HH cells render as a near-transparent navy so the
 * grid frame stays visible without claiming colour weight.
 */
export default function HeatMapView({ ctx }) {
  const { hhData, startDate } = ctx

  /* Build the (day-of-year × hh-slot) matrix in one pass over hhData. */
  const { cells, days, max, monthBoundaries } = useMemo(
    () => buildDayHourMatrix(hhData, startDate),
    [hhData, startDate]
  )

  if (days === 0) {
    return (
      <div style={{
        padding: 24, textAlign: 'center',
        fontFamily: 'var(--font-body)', fontSize: 14,
        color: 'rgba(26,36,64,0.55)',
      }}>
        No half-hourly data for this meter.
      </div>
    )
  }

  /* SVG dimensions - width fluid via viewBox + width="100%".
     Heights tuned so the chart claims real estate without forcing
     individual cells absurdly tall. */
  const CELL_H = 7
  const GRID_H = PERIODS_PER_DAY * CELL_H   /* 336px at H=7 */
  const PAD_LEFT = 38                        /* hour-of-day labels */
  const PAD_RIGHT = 8
  const PAD_TOP = 26                          /* month labels */
  const PAD_BOTTOM = 6
  const VB_W = 1200
  const GRID_W = VB_W - PAD_LEFT - PAD_RIGHT
  const cellW = GRID_W / days
  const VB_H = PAD_TOP + GRID_H + PAD_BOTTOM

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      flex: 1, minHeight: 0, minWidth: 0,
    }}>
      {/* Chris ask 5 Jun: heat maps look 'the same on every page' even
          though the underlying data IS distinct per site (peak kW
          varies meaningfully across sites - Austin Heath ~70, MFG
          ~259). The pattern shape is similar because every site is
          residential and gets normalised against ITS OWN max. Make
          the site-specific peak value loud at the top so the reader
          can verify they're looking at the real meter, and pair it
          with the date range under the chart so CY25 clamp is
          visible. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12.5,
          lineHeight: 1.5,
          color: 'rgba(26,36,64,0.62)',
          maxWidth: 720,
        }}>
          Every half-hour of every day for CY2025.
          {' '}Cool blue = low demand, deep red = peak. Morning ramps,
          evening peaks, weekend dips and holiday closures all read at
          a glance.
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 8,
          fontFamily: 'var(--font-heading)',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(26,36,64,0.55)',
          }}>Peak</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 400,
            color: 'var(--color-nza-coral)',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{(Math.round(max * 10) / 10).toLocaleString('en-GB')}</span>
          <span style={{
            fontSize: 11, color: 'rgba(26,36,64,0.6)',
            fontFamily: 'var(--font-body)',
          }}>kW</span>
        </div>
      </div>

      {/* Brief 24 r3 Chris ask: "It's got a weird black background"
          - the navy panel chrome was lifted directly from the dark
          register without re-checking against the cream Site Detail
          page. Drop the panel entirely; the heat map flows on cream
          with navy labels. Cells stay the full-spectrum ramp which
          works on either register. */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ display: 'block' }}
        role="img"
      >
        {/* Month labels at month boundaries. */}
        {monthBoundaries.map((mb, i) => (
          <text
            key={i}
            x={PAD_LEFT + mb.dayIdx * cellW}
            y={PAD_TOP - 10}
            fontFamily="var(--font-heading)"
            fontSize={11}
            fontWeight={500}
            fill="rgba(26,36,64,0.7)"
            letterSpacing={0.6}
          >{mb.label}</text>
        ))}

        {/* Hour-of-day labels (00, 06, 12, 18) on Y axis. */}
        {[0, 12, 24, 36].map((hh) => (
          <text
            key={hh}
            x={PAD_LEFT - 6}
            y={PAD_TOP + hh * CELL_H + 4}
            textAnchor="end"
            fontFamily="var(--font-body)"
            fontSize={10}
            fill="rgba(26,36,64,0.5)"
            fontVariantNumeric="tabular-nums"
          >{String(Math.floor(hh / 2)).padStart(2, '0')}</text>
        ))}

        {/* Cells - one rect per (day, hh-slot), grouped by row so
            the entrance animation can stagger row-by-row.
            Brief 24.6 Part 3d - per the brief, framer-motion <motion.rect>
            per cell would be too heavy at 365 × 48 = 17 520 cells, so
            we collapse the stagger to the row level: each <g.hm-row>
            fades in as a unit on first mount, staggered 12 ms per row
            (~580 ms total for 48 rows). CSS keyframe rather than
            framer-motion so the 48 row elements stay free of JS
            animation bookkeeping; `prefers-reduced-motion` short-
            circuits the keyframe to a no-op. */}
        {cells.map((row, hhIdx) => (
          <g key={hhIdx} className="hm-row" style={{ animationDelay: `${hhIdx * 12}ms` }}>
            {row.map((v, dayIdx) => {
              const x = PAD_LEFT + dayIdx * cellW
              const y = PAD_TOP + hhIdx * CELL_H
              /* Cells with v=null (pre/post dataset) render as a faint
                 cream-tone so the gap is visible but the colour weight
                 stays on the populated cells. */
              const fill = v == null ? 'rgba(26,36,64,0.04)' : heatColor(max > 0 ? v / max : 0)
              return (
                <rect
                  key={`${hhIdx}-${dayIdx}`}
                  x={x} y={y}
                  width={cellW + 0.5}
                  height={CELL_H}
                  fill={fill}
                />
              )
            })}
          </g>
        ))}
      </svg>

      {/* Legend gradient - full-spectrum, 9-stop ramp matching heatColor. */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'rgba(26,36,64,0.6)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10, fontWeight: 600,
          letterSpacing: 1, textTransform: 'uppercase',
          color: 'rgba(26,36,64,0.55)',
        }}>kW</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>0</span>
        <span style={{
          flex: '0 0 auto',
          width: 360, height: 12,
          borderRadius: 4,
          background: `linear-gradient(to right, ${HEAT_GRADIENT_CSS})`,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(max * 10) / 10}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Day-of-year × HH-slot matrix                                        */
/* ------------------------------------------------------------------ */

function buildDayHourMatrix(hhData, startDate) {
  if (!hhData || !hhData.length || !startDate) {
    return { cells: [], days: 0, max: 0, monthBoundaries: [] }
  }
  const days = Math.floor(hhData.length / PERIODS_PER_DAY)
  /* cells[hhSlot][dayIdx] = kW value (or null if missing). */
  const cells = Array.from({ length: PERIODS_PER_DAY }, () => new Array(days).fill(null))
  let max = 0
  for (let day = 0; day < days; day += 1) {
    for (let p = 0; p < PERIODS_PER_DAY; p += 1) {
      const v = hhData[day * PERIODS_PER_DAY + p]
      cells[p][day] = (v == null ? null : v)
      if (typeof v === 'number' && v > max) max = v
    }
  }
  /* Month boundaries - first day index of each calendar month. */
  const monthBoundaries = []
  let lastMonth = -1
  for (let day = 0; day < days; day += 1) {
    const d = dayDate(startDate, day)
    const m = d.getMonth()
    if (m !== lastMonth) {
      monthBoundaries.push({ dayIdx: day, label: MONTHS_SHORT[m] })
      lastMonth = m
    }
  }
  return { cells, days, max, monthBoundaries }
}
