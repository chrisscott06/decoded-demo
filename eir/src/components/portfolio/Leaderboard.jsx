import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { applyToggle, formatValue } from '../../lib/mapThemes.js'
import {
  COLOR_RISK_LOW,
  COLOR_RISK_MODERATE,
  COLOR_RISK_MAJOR,
  COLOR_CAT_ESTATE,
  COLOR_CAT_TRAVEL,
  COLOR_CAT_SUPPLY_CHAIN,
  COLOR_CAT_COMMUTING,
  COLOR_SCOPE_12,
  COLOR_SCOPE_3,
} from '../../tokens/chart-colors.js'

/**
 * Leaderboard - rows sorted descending by the active metric, with the active
 * theme's colour driving bar fills. Hover/click cross-talk with <MapMarkers>.
 *
 * Props:
 *   sites           - Array of sites.json entries (id + identity + archetype + ...)
 *   energyById      - energy.json keyed by site id
 *   waterById       - water.json keyed by site id
 *   wasteById       - waste.json keyed by site id
 *   carbonById      - carbon.json.by_site keyed by site id
 *   activeCategory  - entry from MAP_CATEGORIES
 *   activeMetric    - entry from activeCategory.metrics
 *   toggleMode      - 'total' | 'perUnit' | 'perM2'
 *   hoveredSiteId   - string|null (from parent)
 *   onHoverSite     - (siteId|null) => void
 *   onSelectSite    - (siteId) => void
 *
 * Render modes (from activeMetric.render):
 *   bar       - single fill in the theme colour
 *   gridBar   - fill colour by value (traffic-light, reverse if colorScale='reverse')
 *   stacked   - segments per stackKeys (Scope 1 / 2 / 3 for carbon)
 *   icons     - categorical chip per distinct value (heating, grid type)
 */

// Stable palette for categorical chips. Order is deliberate so similar
// archetypes (gas-fired / electric / hybrid) get visually distinct hues.
const CATEGORICAL_PALETTE = [
  COLOR_CAT_ESTATE,        // slate blue
  COLOR_CAT_COMMUTING,     // amber
  COLOR_SCOPE_12,          // teal
  COLOR_SCOPE_3,           // purple
  COLOR_CAT_TRAVEL,        // orange-gold
  COLOR_CAT_SUPPLY_CHAIN,  // dark teal
]

function categoricalColor(value, allValues) {
  if (value === null || value === undefined) return 'var(--text-muted-on-dark)'
  const distinct = Array.from(new Set(allValues.filter((v) => v !== null && v !== undefined))).sort()
  const idx = distinct.indexOf(value)
  if (idx < 0) return 'var(--text-muted-on-dark)'
  return CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length]
}

// Traffic-light colour for gridBar metrics, normalised against the visible max.
// colorScale: 'standard' (default) - high = bad (red); 'reverse' - high = good (green).
function gridBarColor(value, max, scale) {
  if (!max || value === null || value === undefined) return 'var(--text-muted-on-dark)'
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

export default function Leaderboard({
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
  onSelectSite,
}) {
  // Compute rows: filter, accessor, normalise. Memoise on the inputs that
  // actually change so hover doesn't re-trigger the sort.
  const rows = useMemo(() => {
    const filtered = activeMetric?.filter
      ? sites.filter((s) => activeMetric.filter(s))
      : sites

    const rowsRaw = filtered.map((s) => {
      const e = energyById[s.id]
      const w = waterById[s.id]
      const ws = wasteById[s.id]
      const c = carbonById[s.id]
      // Brief 8 - accessors may take a 6th arg (mpan register).
      const raw = activeMetric.accessor(s, e, w, ws, c, mpanRegisterById)
      // For numeric metrics: apply toggle normalisation.
      // For array-shaped metrics (Brief 8 Composition): the displayValue used
      // for sort + bar-width is the segment total.
      let displayValue
      if (Array.isArray(raw)) {
        displayValue = raw.reduce((t, x) => t + (x.value || 0), 0)
      } else if (typeof raw === 'number') {
        displayValue = applyToggle(raw, s, toggleMode, activeMetric)
      } else {
        displayValue = raw
      }
      // For stacked-with-stackKeys (Brief 7 Carbon by-scope), pull the
      // breakdown payload (the carbon entry as a whole).
      let stack = null
      if (activeMetric.render === 'stacked' && activeMetric.stackAccessor) {
        stack = activeMetric.stackAccessor(s, e, w, ws, c, mpanRegisterById)
      }
      return { site: s, raw, displayValue, stack }
    })

    // Sort: numeric desc, nulls last; categorical alphabetical asc
    if (activeMetric.categorical) {
      return rowsRaw.sort((a, b) => {
        const va = a.displayValue ?? '~'
        const vb = b.displayValue ?? '~'
        return String(va).localeCompare(String(vb))
      })
    }
    return rowsRaw.sort((a, b) => {
      const va = typeof a.displayValue === 'number' ? a.displayValue : -Infinity
      const vb = typeof b.displayValue === 'number' ? b.displayValue : -Infinity
      return vb - va
    })
  }, [sites, energyById, waterById, wasteById, carbonById, activeMetric, toggleMode])

  // Max for bar width (numeric metrics only)
  const maxVisible = useMemo(() => {
    if (activeMetric?.categorical) return 1
    const nums = rows.map((r) => r.displayValue).filter((v) => typeof v === 'number')
    return nums.length ? Math.max(...nums) : 1
  }, [rows, activeMetric])

  // Brief 10 Part 5: sub-metric tint override (Electricity, Gas) takes
  // priority over the theme's own colour.
  const themeColor = activeMetric?.color || activeCategory?.color || 'var(--color-nza-coral)'

  // Pre-compute all values for categorical metrics so each row knows the palette index
  const categoricalAll = activeMetric?.categorical
    ? rows.map((r) => r.displayValue)
    : null

  return (
    <div
      className="leaderboard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        // Brief 14 Part 2: removed the metric/toggle-keyed remount + the
        // nza-row-shift CSS one-shot. The list now persists across metric
        // changes; framer-motion `layout` on each row physically slides it
        // to its new sorted position.
      }}
    >
      {rows.map(({ site, raw, displayValue, stack }, idx) => {
        const isHovered = hoveredSiteId === site.id
        const widthPct = typeof displayValue === 'number' && maxVisible > 0
          ? Math.max(2, Math.min(100, (displayValue / maxVisible) * 100))
          : 0

        let barFill = themeColor
        if (activeMetric.render === 'gridBar') {
          // Brief 8 - `goodHigh: true` is an alias for `colorScale: 'reverse'`
          // (high values = green).
          const scale = activeMetric.colorScale || (activeMetric.goodHigh ? 'reverse' : 'standard')
          barFill = gridBarColor(displayValue, maxVisible, scale)
        }

        // Stacked breakdown - two patterns:
        //   (a) Brief 7 Carbon: metric.stackKeys + stackAccessor returning an object;
        //       segments built from stack[stackKey.field]
        //   (b) Brief 8 Meters Composition: metric.accessor returns an ARRAY of
        //       {label, value, color} segments directly
        let stackedSegments = null
        if (activeMetric.render === 'stacked' && Array.isArray(raw)) {
          const total = raw.reduce((acc, seg) => acc + (seg.value || 0), 0) || 1
          stackedSegments = raw.map((seg, i) => ({
            key: seg.label || `seg-${i}`,
            color: seg.color,
            widthPct: ((seg.value || 0) / total) * 100,
            label: seg.label,
            value: seg.value || 0,
          }))
        } else if (activeMetric.render === 'stacked' && stack && activeMetric.stackKeys) {
          const total = activeMetric.stackKeys.reduce((acc, k) => acc + (stack[k.field] || 0), 0) || 1
          stackedSegments = activeMetric.stackKeys.map((sk) => ({
            key: sk.key,
            color: sk.color,
            widthPct: ((stack[sk.field] || 0) / total) * 100,
            label: sk.label,
            value: stack[sk.field] || 0,
          }))
        }

        // Categorical chip
        let chipColor = null
        if (activeMetric.categorical) {
          chipColor = categoricalColor(displayValue, categoricalAll)
        }

        // Value text - function format takes priority over string format
        let valueText = ''
        if (activeMetric.categorical) {
          valueText = ''
        } else if (typeof activeMetric.format === 'function') {
          valueText = activeMetric.format(raw)
          if (activeMetric.unit && valueText && valueText !== '-') {
            valueText = `${valueText} ${activeMetric.unit}`
          }
        } else {
          valueText = formatValue(displayValue, activeMetric.format)
        }

        return (
          <motion.div
            key={site.id}
            layout
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            role="button"
            tabIndex={0}
            onMouseEnter={() => onHoverSite?.(site.id)}
            onMouseLeave={() => onHoverSite?.(null)}
            onClick={() => onSelectSite?.(site.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectSite?.(site.id)
              }
            }}
            style={{
              // Post-Brief-10 user feedback: 13 rows must fit at 1440×900
              // without scroll. Dropping row height 44→34 + tightening gap.
              // Name column widened (140) for "Bramshott Place"/"Blendworth
              // Hills" + "Millbrook Village"; value column 80 for "1.3M kWh".
              // Brief 14 Part 3: name column widened 140 → 170 to accommodate
              // the 20px site icon + 8px gap + long names like
              // "Blendworth Hills" / "Bramshott Place".
              display: 'grid',
              gridTemplateColumns: '170px 1fr 80px',
              alignItems: 'center',
              gap: 10,
              height: 34,
              padding: '0 10px',
              borderRadius: 4,
              cursor: 'pointer',
              background: isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'background 150ms var(--ease-standard)',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onBlur={(e) => { e.currentTarget.style.background = isHovered ? 'rgba(255,255,255,0.06)' : 'transparent' }}
          >
            {/* Brief 14 Part 3: site icon + name. Icon is rendered via
                CSS mask-image so currentColor drives the fill - black SVG
                paths render cream on the dark register. Edwalton has no
                site icon (its mark is the Westbrook logo lockup, not a square
                icon) - render the Westbrook-monogram fallback character. Sites
                missing an icon.svg get the same fallback (honest, no
                broken-image glyph). */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-heading)',
                fontWeight: 500,
                fontSize: 14,
                lineHeight: 1.2,
                color: 'var(--color-theme-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              title={site.display_name || site.id}
            >
              {site.id === 'edwalton-office' ? (
                <span className="site-icon site-icon-fallback" aria-hidden>iv</span>
              ) : (
                <span
                  className="site-icon"
                  aria-hidden
                  style={{ '--site-icon-url': `url(/sites/${site.id}/icon.svg)` }}
                />
              )}
              {/* Brief 14 Part 5 - site/village name in --font-site
                  (Source Serif 4). Scoped strictly to display_name. */}
              <span style={{
                fontFamily: 'var(--font-site)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {site.display_name || site.id}
              </span>
            </span>

            {/* Bar area - 12 px (down from 16 to match tighter 34 px row). */}
            <div
              style={{
                position: 'relative',
                height: 12,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {activeMetric.render === 'icons' && displayValue ? (
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 6,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 8px',
                      background: chipColor,
                      color: 'var(--color-theme-base)',
                      borderRadius: 999,
                      fontFamily: 'var(--font-body)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {String(displayValue)}
                  </span>
                </div>
              ) : activeMetric.render === 'stacked' && stackedSegments ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${widthPct}%`,
                    display: 'flex',
                    overflow: 'hidden',
                    borderRadius: 3,
                    transition: 'width 350ms var(--ease-standard)',
                  }}
                >
                  {stackedSegments.map((seg) => (
                    <div
                      key={seg.key}
                      style={{
                        width: `${seg.widthPct}%`,
                        background: seg.color,
                        height: '100%',
                      }}
                      title={`${seg.label}: ${seg.value}${activeMetric.unit ? ' ' + activeMetric.unit : ''}`}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${widthPct}%`,
                    background: barFill,
                    borderRadius: 3,
                    transition: 'width 350ms var(--ease-standard), background 200ms var(--ease-standard)',
                  }}
                />
              )}
            </div>

            {/* Value - Chris post-Brief-10: body font (Inter) on the
                quantifier (e.g. "69 meters", "164 t"). Keep tabular-nums
                so right-aligned figures line up under reorder. */}
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-theme-body)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {valueText}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
