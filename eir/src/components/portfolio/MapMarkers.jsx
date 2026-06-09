import { useMemo, useState } from 'react'
import { getMarkerPosition } from '../../lib/projection.js'
import { applyToggle } from '../../lib/mapThemes.js'
import {
  COLOR_RISK_LOW,
  COLOR_RISK_MODERATE,
  COLOR_RISK_MAJOR,
  COLOR_RISK_NO_DATA,
  COLOR_CAT_ESTATE,
  COLOR_CAT_TRAVEL,
  COLOR_CAT_SUPPLY_CHAIN,
  COLOR_CAT_COMMUTING,
  COLOR_SCOPE_12,
  COLOR_SCOPE_3,
} from '../../tokens/chart-colors.js'

/**
 * MapMarkers - the dotted UK SVG as the backdrop, with one absolutely-
 * positioned dot per site. Each dot pulses, its size scales by the active
 * metric (sqrt of value / max), its colour comes from the active theme
 * (or the gridBar traffic-light for `render: 'gridBar'`).
 *
 * Hover and click cross-talk with <Leaderboard> via the same `hoveredSiteId`
 * + `onHoverSite` + `onSelectSite` props.
 *
 * Per handoff Section 4 + 7. CSS pulse keyframe replaces Tailwind's
 * `animate-ping` (IVG has no Tailwind).
 */

const CATEGORICAL_PALETTE = [
  COLOR_CAT_ESTATE,
  COLOR_CAT_COMMUTING,
  COLOR_SCOPE_12,
  COLOR_SCOPE_3,
  COLOR_CAT_TRAVEL,
  COLOR_CAT_SUPPLY_CHAIN,
]

function categoricalColor(value, allValues) {
  if (value === null || value === undefined) return null
  const distinct = Array.from(new Set(allValues.filter((v) => v !== null && v !== undefined))).sort()
  const idx = distinct.indexOf(value)
  if (idx < 0) return null
  return CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length]
}

function gridBarColor(value, max, scale) {
  if (!max || value === null || value === undefined) return null
  const pct = value / max
  if (scale === 'reverse') {
    if (pct >= 0.75) return COLOR_RISK_LOW
    if (pct >= 0.40) return COLOR_RISK_MODERATE
    return COLOR_RISK_MAJOR
  }
  if (pct >= 0.75) return COLOR_RISK_MAJOR
  if (pct >= 0.40) return COLOR_RISK_MODERATE
  return COLOR_RISK_LOW
}

// Marker size - sqrt scaling per handoff Section 4. Smaller rMax than EOC
// because the UK SVG is portrait and the south-east cluster is tight.
const R_MIN = 6
const R_MAX = 18

export default function MapMarkers({
  sites,
  energyById = {},
  waterById = {},
  wasteById = {},
  carbonById = {},
  mpanRegisterById = {},
  activeCategory,
  activeMetric,
  toggleMode,
  hoveredSiteId,
  onHoverSite,
  selectedSiteId,
  onSelectSite,
}) {
  const [imgLoaded, setImgLoaded] = useState(false)

  // For each site, compute value + display colour + radius once per change.
  const markers = useMemo(() => {
    const filtered = activeMetric?.filter
      ? sites.filter((s) => activeMetric.filter(s))
      : sites

    const raws = filtered.map((s) => {
      const e = energyById[s.id]
      const w = waterById[s.id]
      const ws = wasteById[s.id]
      const c = carbonById[s.id]
      // Brief 8 - accessors may take a 6th arg (mpan register).
      const raw = activeMetric.accessor(s, e, w, ws, c, mpanRegisterById)
      // Array-shaped accessor (Brief 8 Composition): displayValue = segment total.
      let displayValue
      if (Array.isArray(raw)) {
        displayValue = raw.reduce((t, x) => t + (x.value || 0), 0)
      } else if (typeof raw === 'number') {
        displayValue = applyToggle(raw, s, toggleMode, activeMetric)
      } else {
        displayValue = raw
      }
      return { site: s, raw, displayValue }
    })

    const numericVals = raws.map((r) => r.displayValue).filter((v) => typeof v === 'number')
    const maxV = numericVals.length ? Math.max(...numericVals) : 1
    const allValues = raws.map((r) => r.displayValue)

    // Brief 8 Meters theme - special dot encoding (D10):
    //   size  = total meter count at site (sqrt-scaled)
    //   colour = HH coverage % traffic-light (green = high, alias 'goodHigh')
    // This overrides whatever the active sub-metric would otherwise produce so
    // every sub-metric in the Meters theme renders the same anatomy view.
    const isMetersTheme = activeCategory?.id === 'meters'
    let meterCountMax = 1
    if (isMetersTheme) {
      const counts = filtered.map((s) => ((mpanRegisterById && mpanRegisterById[s.id]) || []).length)
      meterCountMax = Math.max(1, ...counts)
    }

    return raws.map(({ site, displayValue }) => {
      const pos = getMarkerPosition(site.id)
      if (!pos) return null

      let radius = R_MIN
      // Brief 10 Part 5: sub-metric colorHex override (Electricity → yellow,
      // Gas → red) wins over the theme accent.
      let color = activeMetric?.colorHex || activeCategory?.colorHex || activeCategory?.color || COLOR_RISK_NO_DATA

      if (isMetersTheme) {
        // Size by meter count (sqrt), colour by HH coverage of landlord meters.
        const meters = (mpanRegisterById && mpanRegisterById[site.id]) || []
        const count = meters.length
        if (count > 0 && meterCountMax > 0) {
          radius = R_MIN + (R_MAX - R_MIN) * Math.sqrt(count / meterCountMax)
        } else {
          radius = R_MIN
        }
        const llMeters = meters.filter((m) => String(m.category || '').toLowerCase().includes('landlord'))
        const coveragePct = llMeters.length
          ? (llMeters.filter((m) => m.type === 'HH').length / llMeters.length) * 100
          : null
        if (coveragePct !== null) {
          // gridBar reverse (high = green) on a 0-100 % scale; pass 100 as max
          // so we colour against absolute coverage, not relative to top site.
          const gc = gridBarColor(coveragePct, 100, 'reverse')
          if (gc) color = gc
        } else {
          color = COLOR_RISK_NO_DATA
        }
      } else if (activeMetric.categorical) {
        const cc = categoricalColor(displayValue, allValues)
        if (cc) color = cc
        radius = R_MIN + 2 // categorical dots all same size, slightly larger
      } else if (activeMetric.render === 'gridBar') {
        const scale = activeMetric.colorScale || (activeMetric.goodHigh ? 'reverse' : 'standard')
        if (displayValue === null || displayValue === undefined) {
          // No-data sites in a gridBar metric (e.g. Edwalton office under
          // Waste→Diversion) get the muted "no data" colour, not the
          // theme accent - otherwise they look like a real low/high value.
          color = COLOR_RISK_NO_DATA
        } else {
          const gc = gridBarColor(displayValue, maxV, scale)
          if (gc) color = gc
        }
        radius = R_MIN + 2
      } else if (typeof displayValue === 'number' && displayValue > 0 && maxV > 0) {
        // sqrt scaling - handoff Section 4
        radius = R_MIN + (R_MAX - R_MIN) * Math.sqrt(displayValue / maxV)
      } else {
        radius = R_MIN
      }

      return {
        site,
        pos,
        displayValue,
        color,
        radius,
      }
    }).filter(Boolean)
  }, [sites, energyById, waterById, wasteById, carbonById, mpanRegisterById, activeMetric, toggleMode, activeCategory])

  return (
    <div
      className="uk-map-container"
      style={{
        position: 'relative',
        // Chris ask 2026-06-02 (revised): cropped to southern + central
        // England. Width extended LEFT to capture Land's End / Cornwall
        // tip (was clipping at the bottom-left); bottom already extends
        // to lat 49.85 (Lizard Point). viewBox now 1291 × 1100, slight
        // landscape - gives the map more horizontal real estate (Chris's
        // second suggestion). projection.js BBOX matches this crop.
        height: '100%',
        aspectRatio: '1291 / 1100',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <svg
        viewBox="119 1430 1291 1100"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        aria-label="Map of southern and central England - Inspired Villages estate"
        style={{
          display: 'block',
          /* Chris ask 2026-06-02 (option 1 - dialled-down ambient
             texture): dotted backdrop drops from 0.45 → 0.18 and the
             invert+hue-rotate filter is stripped, so the dots read as
             a flat muted grey instead of bright cream. Pins + pulses
             become the only thing carrying visual weight. */
          opacity: 0.18,
          filter: 'invert(60%)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        onLoad={() => setImgLoaded(true)}
      >
        <image
          href="/maps/uk-dotted-map.svg"
          x="0"
          y="0"
          width="1409.97"
          height="2548.17"
          onLoad={() => setImgLoaded(true)}
        />
      </svg>
      {imgLoaded && markers.map(({ site, pos, displayValue, color, radius }) => {
        const isHovered = hoveredSiteId === site.id
        const isSelected = selectedSiteId === site.id
        const isActive = isHovered || isSelected
        const isEdwalton = site.id === 'edwalton-office'
        /* Chris ask 2026-06-02 (revised again): pin with site icon is
           the default. Halo behind the pin pulses + scales by the
           active metric value (Brief 7 sqrt scaling restored). Hover
           / select pops the pin with a longer easeOut so the growth
           reads as deliberate, not snappy. Pin tip anchored at the
           marker (lat/lon) point. */
        const PIN_W = 36
        const PIN_H = 48
        // Halo carries the value encoding - center on the pin tip
        // (= the marker point). Sized by sqrt(value/max) via the
        // pre-computed radius from the useMemo above.
        const haloRadius = radius * 2.2
        return (
          <div
            key={site.id}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: 0,
              height: 0,
              zIndex: isActive ? 5 : 2,
            }}
          >
            {/* Value-scaled pulse halo - sits behind the pin (z-index
                via DOM order). Hidden for sites with no value so a
                missing-data pin doesn't read as a strong site. */}
            {typeof displayValue === 'number' && displayValue > 0 && (
              <span
                className="nza-pulse"
                style={{
                  position: 'absolute',
                  width: haloRadius * 2,
                  height: haloRadius * 2,
                  left: -haloRadius,
                  top: -haloRadius,
                  borderRadius: '50%',
                  background: color,
                  opacity: isActive ? 0.45 : 0.32,
                  transition: 'opacity 350ms var(--ease-standard)',
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Pin span = hit target. pointerEvents:auto so hovering or
                clicking the pin itself triggers the pop / selection
                (Chris ask 2026-06-02). Handlers moved here from the
                width-0 wrapper above so the actual rendered pin
                shape receives the events. */}
            <span
              className={`map-pin ${isActive ? 'is-active' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${site.display_name || site.id} - open site detail`}
              onMouseEnter={() => onHoverSite?.(site.id)}
              onMouseLeave={() => onHoverSite?.(null)}
              onClick={(e) => { e.stopPropagation(); onSelectSite?.(site.id) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectSite?.(site.id)
                }
              }}
              style={{
                position: 'absolute',
                left: -PIN_W / 2,
                bottom: 0,                     /* tip at marker point */
                width: PIN_W,
                height: PIN_H,
                transform: isActive ? 'scale(1.4) translateY(-3px)' : 'scale(1)',
                transformOrigin: '50% 100%',
                transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                color,
              }}
            >
              <svg
                viewBox="0 0 44 60"
                width={PIN_W}
                height={PIN_H}
                style={{
                  display: 'block',
                  filter: isActive
                    ? `drop-shadow(0 5px 14px ${color}A0) drop-shadow(0 0 2px ${color}80)`
                    : `drop-shadow(0 2px 5px rgba(0,0,0,0.45))`,
                  transition: 'filter 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <path
                  d="M22 1 C10.4 1 1 10.4 1 22 C1 35 22 59 22 59 C22 59 43 35 43 22 C43 10.4 33.6 1 22 1 Z"
                  fill="currentColor"
                  stroke={isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.30)'}
                  strokeWidth="1"
                />
                {/* Chris ask 2026-06-02 (revised - icon always visible):
                    site icon shows at rest as a paler version of the
                    pin colour (semi-transparent white blends with the
                    coloured pin body); on hover/select it goes to bright
                    white. No separate head circle - the icon IS the
                    contrast at hover. Lets a viewer identify a site
                    from the icon at rest, the way IVG's website map
                    does. */}
              </svg>
              {isEdwalton ? (
                <span
                  style={{
                    position: 'absolute',
                    top: PIN_H * (9 / 60),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: PIN_W * (14 / 44),
                    fontWeight: 600,
                    color: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)',
                    lineHeight: 1.1,
                    transition: 'color 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >iv</span>
              ) : (
                <span
                  className="map-pin-icon"
                  style={{
                    position: 'absolute',
                    /* Chris ask 2026-06-02 (icon bigger, 2nd bump): ratio
                       now 34/44 (≈ 77% of pin width) - start of kissing
                       the teardrop edges. Vertical offset stays
                       centered on the pin head (viewBox y=22). */
                    top: PIN_H * (5 / 60),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: PIN_W * (34 / 44),
                    height: PIN_W * (34 / 44),
                    backgroundColor: 'white',
                    WebkitMaskImage: `url(/sites/${site.id}/icon.svg)`,
                    maskImage: `url(/sites/${site.id}/icon.svg)`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    opacity: isActive ? 1 : 0.45,
                    transition: 'opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

