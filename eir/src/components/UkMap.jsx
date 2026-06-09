import { useState } from 'react'
import { COLOR_THEME_BASE, COLOR_UK_SILHOUETTE } from '../tokens/chart-colors.js'

/**
 * UkMap - solid GB silhouette with coral site markers + halos + hover tooltip + left legend.
 *
 * Props:
 *   sites:       array of { id, name, lat, lon }
 *   metrics:     optional object { [siteId]: { value: number, status: 'confirmed'|'partial'|'missing' } }
 *                value is the magnitude used for legend bar width + tooltip
 *   metricLabel: e.g. "CY25 elec landlord (kWh)"
 *   onSiteClick: (siteId) => void
 *
 * Sizing: SVG scales with container width; legend is sticky to left at desktop.
 * Per Appendix C.6: page navy bg, lighter silhouette (COLOR_UK_SILHOUETTE), coral dots + 0.25 halos.
 */

// Roughly-hand-traced GB outline. Coarse on purpose - the demo audience sees the
// shape of Britain, not coastline detail. ~50 lat/lon waypoints, clockwise from
// Land's End. Outer Hebrides and Orkney are omitted (would clutter at this scale).
const GB_PATH_LATLON = [
  // Cornwall / South coast
  [50.07, -5.72], [50.20, -5.45], [50.36, -4.90], [50.34, -4.21], [50.55, -4.05],
  [50.36, -3.55], [50.43, -3.10], [50.61, -2.96], [50.72, -1.95], [50.70, -1.50],
  [50.78, -1.05], [50.83, -0.78], [50.78, -0.50], [50.84, -0.06], [50.92, 0.46],
  [51.00, 1.12], [51.13, 1.30], [51.36, 1.45],
  // East coast / The Wash / Humber
  [51.45, 1.32], [51.60, 1.20], [51.80, 1.27], [51.98, 1.27], [52.32, 1.74],
  [52.66, 1.72], [52.92, 1.65], [52.95, 1.30], [52.88, 0.78], [52.99, 0.46],
  [53.18, 0.34], [53.41, 0.30], [53.55, 0.10], [53.65, 0.08], [53.65, -0.20],
  [54.10, -0.10], [54.42, -0.40], [54.55, -0.83], [54.94, -1.36], [55.13, -1.50],
  [55.50, -1.62], [55.81, -2.08], [56.02, -2.51], [56.06, -2.78], [56.04, -3.07],
  [56.05, -3.40], [56.40, -2.78], [56.55, -2.62], [56.75, -2.27], [57.10, -2.05],
  [57.50, -1.78], [57.66, -1.95], [57.70, -2.30], [57.66, -2.85], [57.84, -3.95],
  [58.45, -3.05], [58.65, -3.20], [58.62, -4.00], [58.50, -4.50],
  // North coast / North-West Scotland
  [58.55, -5.10], [58.30, -5.10], [58.15, -5.40], [57.85, -5.65], [57.55, -5.85],
  [57.30, -5.65], [57.05, -5.78], [56.80, -5.90], [56.45, -5.90], [56.10, -5.55],
  [55.90, -5.10], [55.65, -4.90], [55.45, -4.70], [55.10, -4.95], [54.83, -4.92],
  [54.62, -4.40], [54.85, -3.80], [54.65, -3.50], [54.10, -3.36], [53.85, -3.10],
  [53.65, -3.05], [53.40, -3.08],
  // North Wales bulge (Anglesey simplified)
  [53.30, -3.40], [53.40, -4.10], [53.25, -4.65], [53.10, -4.50], [52.95, -4.55],
  [52.78, -4.10], [52.55, -4.10], [52.30, -4.20], [52.10, -4.45], [51.85, -4.95],
  [51.75, -5.20], [51.65, -5.10], [51.62, -4.65], [51.40, -4.10], [51.20, -4.20],
  [51.13, -4.07], [51.18, -3.36], [51.22, -3.05],
  // Bristol channel approx
  [51.32, -2.95], [51.42, -2.65], [51.55, -2.69], [51.62, -2.95], [51.52, -3.40],
  [51.42, -3.85], [51.20, -4.20],
  // West Country south coast back to Land's End
  [50.95, -4.55], [50.78, -4.55], [50.55, -4.65], [50.30, -5.05], [50.07, -5.72],
]

// Project lat/lon → SVG x/y. UK bounds: lat 49.5–60.0 (Y, inverted), lon -8.0–2.0.
const VIEW = { minLat: 49.5, maxLat: 60.5, minLon: -8.0, maxLon: 2.5 }
const W = 800
// Width per degree lon vs lat: at ~55°N, 1° lon ≈ cos(55°) ≈ 0.574° lat in distance terms.
// We want pixel ratio: deg_lon × cos(55) : deg_lat ≈ 1 : 1.
// (maxLon - minLon) = 10.5, (maxLat - minLat) = 11.0
// So if W = (10.5 × cos(55°) × 100) ≈ 600, H = 11 × 100 = 1100. Aspect 600:1100.
const H = Math.round(W * ((VIEW.maxLat - VIEW.minLat) / ((VIEW.maxLon - VIEW.minLon) * Math.cos((55 * Math.PI) / 180))))

function project(lat, lon) {
  const x = ((lon - VIEW.minLon) / (VIEW.maxLon - VIEW.minLon)) * W
  const y = ((VIEW.maxLat - lat) / (VIEW.maxLat - VIEW.minLat)) * H
  return [x, y]
}

const GB_PATH_D = (() => {
  const pts = GB_PATH_LATLON.map(([lat, lon]) => project(lat, lon))
  return pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ') + ' Z'
})()

function fmtCompact(n) {
  if (typeof n !== 'number') return '-'
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000).toLocaleString('en-GB') + 'k'
  return n.toLocaleString('en-GB', { maximumFractionDigits: 1 })
}

export default function UkMap({ sites, metrics = {}, metricLabel = 'Value', onSiteClick }) {
  const [hover, setHover] = useState(null)

  // Sort sites for legend by metric value desc; sites without metric go last
  const sortedSites = [...sites].sort((a, b) => {
    const va = metrics[a.id]?.value ?? -1
    const vb = metrics[b.id]?.value ?? -1
    return vb - va
  })
  const maxValue = Math.max(...sortedSites.map((s) => metrics[s.id]?.value || 0)) || 1

  const statusColour = {
    confirmed: 'var(--coral)',
    partial: 'var(--status-partial)',
    missing: 'var(--status-missing)',
  }

  return (
    <div className="ukmap" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Left legend */}
      <div className="ukmap-legend" style={{ flex: '0 0 280px', minWidth: 0 }}>
        {sortedSites.map((s) => {
          const m = metrics[s.id]
          const widthPct = m?.value ? Math.max(2, (m.value / maxValue) * 100) : 0
          const dotColour = statusColour[m?.status] || 'var(--text-muted-on-dark)'
          return (
            <div
              key={s.id}
              role="link"
              onClick={() => onSiteClick?.(s.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: '1px solid var(--rule-on-dark)',
                fontSize: 13,
                color: hover === s.id ? 'var(--coral)' : 'var(--text-on-dark)',
              }}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
            >
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{s.name}</div>
                <div style={{ background: 'rgba(255,255,255,0.08)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ background: dotColour, height: '100%', width: `${widthPct}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, color: 'var(--text-muted-on-dark)' }}>
                {m?.value ? fmtCompact(m.value) : '-'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxHeight: 600 }}
          role="img"
          aria-label="Map of Westbrook Academies Trust sites across Great Britain"
        >
          {/* GB silhouette */}
          <path d={GB_PATH_D} fill={COLOR_UK_SILHOUETTE} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Site markers */}
          {sites.map((s) => {
            const [x, y] = project(s.lat, s.lon)
            const m = metrics[s.id]
            const fill = statusColour[m?.status] || 'var(--text-muted-on-dark)'
            const isHover = hover === s.id
            return (
              <g
                key={s.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSiteClick?.(s.id)}
              >
                {/* Halo */}
                <circle cx={x} cy={y} r={isHover ? 24 : 18} fill={fill} opacity="0.25" style={{ transition: 'r 0.15s ease' }} />
                {/* Marker */}
                <circle cx={x} cy={y} r={isHover ? 9 : 6} fill={fill} stroke={COLOR_THEME_BASE} strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
              </g>
            )
          })}

          {/* Hover tooltip */}
          {hover && (() => {
            const s = sites.find((x) => x.id === hover)
            if (!s) return null
            const [x, y] = project(s.lat, s.lon)
            const m = metrics[s.id]
            const tooltipY = y - 40
            const flipBelow = y < 60
            return (
              <g pointerEvents="none">
                <rect
                  x={x - 90}
                  y={flipBelow ? y + 16 : tooltipY}
                  width="180"
                  height="36"
                  rx="4"
                  fill={COLOR_THEME_BASE}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
                />
                <text
                  x={x}
                  y={flipBelow ? y + 30 : tooltipY + 14}
                  textAnchor="middle"
                  fill="var(--text-on-dark)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {s.name}
                </text>
                <text
                  x={x}
                  y={flipBelow ? y + 46 : tooltipY + 28}
                  textAnchor="middle"
                  fill="var(--text-muted-on-dark)"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {m?.value ? `${fmtCompact(m.value)} · ${metricLabel}` : 'no data'}
                </text>
              </g>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
