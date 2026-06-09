import { useEffect, useMemo, useRef, useState } from 'react'

// Pipeline data
import sitesById from '@pipeline-data/sites.json'
import energyById from '@pipeline-data/energy.json'
import waterById from '@pipeline-data/water.json'
import wasteById from '@pipeline-data/waste.json'
import carbonData from '@pipeline-data/carbon.json'
import portfolio from '@pipeline-data/portfolio.json'
import mpanRegisterById from '@pipeline-data/mpan_register.json'

// Module
import { MAP_CATEGORIES, findCategory, findMetric, applyToggle } from '../lib/mapThemes.js'
import { getMarkerPosition } from '../lib/projection.js'
import Leaderboard from './portfolio/Leaderboard.jsx'
import MapMarkers from './portfolio/MapMarkers.jsx'
import SiteHoverCard from './portfolio/SiteHoverCard.jsx'
/* TotalsStrip retired 2026-06-03 - Chris removed the bottom strip
   from the Map page. Component still exists on disk for any future
   re-introduction. */

/**
 * PortfolioMap - top-level for /portfolio/map.
 *
 * Layout (design note D6 / Brief 6 Part 3 step 3.7):
 *
 *   <PageNarrative> (sits above; provided by App.jsx around this component)
 *
 *   ┌── pill bar - themes ───────────────────────────────────────────┐
 *   ├── pill bar - sub-metric + Total/Per-Unit/Per-m² toggle ────────┤
 *   │                                                                │
 *   │  ┌── Leaderboard (~36%) ──┐  ┌── Map (~64%) ───────────────┐   │
 *   │  │ row × n                │  │ dotted SVG + pulsing dots   │   │
 *   │  └────────────────────────┘  └─────────────────────────────┘   │
 *   │                                                                │
 *   │  <TotalsStrip>                                                 │
 *   └────────────────────────────────────────────────────────────────┘
 *   <SiteHoverCard> (floats over)
 *
 * State:
 *   activeCategoryId   default 'energy'
 *   activeMetricKey    default first metric of active category
 *   toggleMode         default 'total'
 *   hoveredSiteId      null
 */

const TOGGLE_LABELS = {
  total:   'Total',
  perUnit: 'Per Unit',
  perM2:   'Per m²',
}

/**
 * PillBar - variant 'theme' (primary chapter pills, 16/6 padding, 14px) or
 * 'sub' (sub-metric pills, 12/4 padding, 12px, underline active). Brief 10
 * Part 2 EOC spacing recipe. activeColor lets the active theme pill tint
 * to its own colour (Brief 10 Part 5 palette refresh) instead of the
 * portfolio-wide coral.
 */
function PillBar({ items, activeKey, onSelect, ariaLabel, variant = 'theme', activeColor }) {
  const isSub = variant === 'sub'
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item) => {
        const isActive = item.key === activeKey
        const tint = item.color || activeColor || 'var(--color-nza-coral)'
        if (isSub) {
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isActive ? tint : 'var(--text-muted-on-dark)',
                borderBottom: isActive ? `1.5px solid ${tint}` : '1.5px solid transparent',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 500 : 400,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background 150ms, color 150ms, border-color 150ms',
                letterSpacing: 0.2,
              }}
              title={item.desc}
            >
              {item.label}
            </button>
          )
        }
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item.key)}
            style={{
              // Tighter pill (was 6/16 px) so all 7 themes fit one row.
              padding: '4px 11px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: isActive ? tint : 'var(--rule-on-dark)',
              background: isActive ? `${tint}24` : 'transparent', // ~14% alpha
              color: isActive ? tint : 'var(--color-theme-body)',
              fontFamily: 'var(--font-heading)',
              fontWeight: isActive ? 500 : 400,
              fontSize: 13,
              lineHeight: 1.2,
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms, border-color 150ms',
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
            }}
            title={item.desc}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleBar({ toggles, active, onSelect }) {
  return (
    <div role="tablist" aria-label="Normalisation" style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
      {toggles.map((t) => {
        const isActive = t === active
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(t)}
            style={{
              padding: '2px 10px',
              borderRadius: 3,
              border: 'none',
              background: isActive ? 'var(--color-theme-body)' : 'transparent',
              color: isActive ? 'var(--color-theme-base)' : 'var(--text-muted-on-dark)',
              fontFamily: 'var(--font-heading)',
              fontWeight: isActive ? 500 : 400,
              fontSize: 10,
              letterSpacing: 0.3,
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}
          >
            {TOGGLE_LABELS[t] || t}
          </button>
        )
      })}
    </div>
  )
}

export default function PortfolioMap({ navigate }) {
  const [activeCategoryId, setActiveCategoryId] = useState('energy')
  const [activeMetricKey, setActiveMetricKey] = useState(() => {
    const cat = findCategory('energy')
    return cat.metrics[0].key
  })
  const [toggleMode, setToggleMode] = useState('total')
  const [hoveredSiteId, setHoveredSiteId] = useState(null)
  // Brief 14 Part 4 - click contract: a bare click on marker or row
  // selects (= shows the card) but does NOT navigate. Navigation only
  // happens via the explicit "View site →" button inside the card.
  const [selectedSiteId, setSelectedSiteId] = useState(null)

  /* Chris ask 2026-06-02: clicking outside the active card OR pin
     dismisses the selection. Listens at the document level; ignores
     clicks inside the card (handled by its own × button) and inside
     the map markers (handled by pin onClick which re-selects). */
  const mapRightColRef = useRef(null)
  const cardRef = useRef(null)
  useEffect(() => {
    if (!selectedSiteId) return
    function onDocClick(e) {
      if (cardRef.current?.contains(e.target)) return
      // Clicks on a pin are handled by the pin onClick (which stops
      // propagation) - they won't bubble here. Anything else inside
      // the map column (the dotted SVG background, gaps) dismisses.
      setSelectedSiteId(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [selectedSiteId])

  const activeCategory = useMemo(() => findCategory(activeCategoryId), [activeCategoryId])
  const activeMetric = useMemo(() => findMetric(activeCategory, activeMetricKey), [activeCategory, activeMetricKey])

  // When switching theme, snap the metric back to the first available one.
  function selectCategory(id) {
    const cat = findCategory(id)
    setActiveCategoryId(id)
    setActiveMetricKey(cat.metrics[0].key)
    // If the theme doesn't include the current toggle, snap to its first.
    if (!cat.toggles.includes(toggleMode)) setToggleMode(cat.toggles[0])
  }

  // Sites as array of sites.json entries, filtered to those with a position on the map.
  const sitesArr = useMemo(() => {
    return Object.values(sitesById).filter((s) => getMarkerPosition(s.id) !== null)
  }, [])

  // Carbon data is keyed under .by_site
  const carbonById = carbonData?.by_site || {}

  // Brief 14 Part 4 - card is now driven by selectedSiteId (click), not
  // hoveredSiteId (hover). Hover only highlights; click pins the card.
  const cardData = useMemo(() => {
    if (!selectedSiteId) return null
    const site = sitesById[selectedSiteId]
    if (!site) return null
    const e = energyById[selectedSiteId]
    const w = waterById[selectedSiteId]
    const ws = wasteById[selectedSiteId]
    const c = carbonById[selectedSiteId]
    const pos = getMarkerPosition(selectedSiteId)
    return { site, energy: e, water: w, waste: ws, carbon: c, pos }
  }, [selectedSiteId])

  // Hover card value (compute the active metric for the hovered site, with toggle applied)
  // - retained for legacy spots that may still read hoverData. The hover
  //   card UI itself is now removed; this memo is kept (cheap) until any
  //   leftover hoverData reads are cleaned up.
  const hoverData = useMemo(() => {
    if (!hoveredSiteId) return null
    const site = sitesById[hoveredSiteId]
    if (!site) return null
    const e = energyById[hoveredSiteId]
    const w = waterById[hoveredSiteId]
    const ws = wasteById[hoveredSiteId]
    const c = carbonById[hoveredSiteId]
    // Brief 8 - pass mpan register as 6th arg for the Meters theme accessors.
    const raw = activeMetric.accessor(site, e, w, ws, c, mpanRegisterById)
    let value
    if (Array.isArray(raw)) {
      value = raw.reduce((t, x) => t + (x.value || 0), 0)
    } else if (typeof raw === 'number') {
      value = applyToggle(raw, site, toggleMode, activeMetric)
    } else {
      value = raw
    }
    const pos = getMarkerPosition(hoveredSiteId)
    return { site, energy: e, water: w, waste: ws, carbon: c, value, pos }
  }, [hoveredSiteId, activeMetric, toggleMode, carbonById])

  // Navigation helper. If a `navigate` prop is supplied use it; else fall back
  // to window.history (mirrors App.jsx's tiny router).
  function go(siteId) {
    const url = `/site/${siteId}/overview`
    if (typeof navigate === 'function') {
      navigate(url)
    } else if (typeof window !== 'undefined') {
      try { localStorage.setItem('ivg.currentSiteId', siteId) } catch {}
      window.history.pushState({}, '', url)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  // Legend metadata - pulled from the active metric. Static; rendered below
  // the leaderboard when present (stacked metrics + gridBar traffic-light).
  const legend = activeMetric?.legend || null

  return (
    // Post-Brief-10 user feedback layout:
    //   - Narrative + theme pills + sub-metric pills + description live in
    //     the LEFT column above the leaderboard, so the MAP column gets the
    //     full available vertical height (no eaten space above it).
    //   - Leaderboard sized to fit all 13 rows without internal scroll
    //     (34 px row × 13 = 442 px + gaps + padding ≈ 480 px).
    //   - Legend (when present) sits below the leaderboard.
    //   - Map column flex-1, full height. Container aspect-ratio drives
    //     width from available height.
    //   Chris ask 2026-06-03 - Map content wrapped in the same 1280
    //   centred container the rest of the tool uses (matches the Energy
    //   page body left edge at x=320 at 1920×1080). TotalsStrip removed
    //   per Chris ("just adding more information that we don't need to
    //   see"). Left column now `justifyContent: center` so the leader-
    //   board sits mid-page vertically instead of pinned to the top.
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      width: 'calc(100% - 64px)',
      maxWidth: 1280,
      margin: '0 auto',
      boxSizing: 'border-box',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
    }}>

    <div style={{
      /* Chris ask 2026-06-03 (refined): leaderboard column tightened
         from min 660 → min 600 - narrowest the 7 theme pills still fit
         on one row (~470 px of actual pill width + 130 px chrome).
         Gap dropped to 0; right column gets negative margin-left so the
         map extends behind the bounding box. Combined effect: the map
         gains ~60 px of horizontal space relative to the previous
         layout, leaderboard sheds the excess width. */
      display: 'grid',
      gridTemplateColumns: 'minmax(600px, 40%) 1fr',
      gap: 0,
      width: '100%',
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      alignItems: 'stretch',
    }} className="portfoliomap-grid">

      {/* LEFT COLUMN - pills + leaderboard + legend, stacked.
          Chris ask 2026-06-03: vertically centred + sits on TOP of the
          map (zIndex 2) so the bounding box visually overlays any
          pins or dots the negative-margin'd map column pulled under. */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Theme pills - single row (compact padding) */}
        <PillBar
          items={MAP_CATEGORIES.map((c) => ({ key: c.id, label: c.label, desc: c.desc, color: c.colorHex || c.color }))}
          activeKey={activeCategoryId}
          onSelect={selectCategory}
          ariaLabel="Map theme"
          variant="theme"
        />

        {/* Sub-metric pills + toggle on the same row to save height */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <PillBar
            items={activeCategory.metrics.map((m) => ({ key: m.key, label: m.label, desc: m.desc, color: m.colorHex }))}
            activeKey={activeMetricKey}
            onSelect={setActiveMetricKey}
            ariaLabel="Sub-metric"
            variant="sub"
            activeColor={activeCategory.colorHex || activeCategory.color}
          />
          {!activeMetric.intensity && !activeMetric.categorical && activeCategory.toggles.length > 1 && (
            <ToggleBar toggles={activeCategory.toggles} active={toggleMode} onSelect={setToggleMode} />
          )}
        </div>

        {/* Active-metric description - tiny one-liner */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-muted-on-dark)',
          lineHeight: 1.4,
          marginTop: -4,
        }}>
          {activeMetric.desc}
        </div>

        {/* Chris ask 2026-06-03 (revised): bounding box restored, BUT
            wrapped in an outer slot that reserves the FULL 13-row
            height (442 px ≈ 13 × 34 px row + 4 px panel padding) so
            the parent's justifyContent: center keeps the pills above
            anchored at the same Y regardless of how many rows are
            visible. The inner box hugs the actual rendered rows - no
            empty space inside the bounding box - and any reserved
            slack appears below the box (invisible, no border). */}
        <div style={{ minHeight: 460, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '4px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--rule-on-dark)',
              borderRadius: 8,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
          <Leaderboard
            sites={sitesArr}
            energyById={energyById}
            waterById={waterById}
            wasteById={wasteById}
            carbonById={carbonById}
            mpanRegisterById={mpanRegisterById}
            activeCategory={activeCategory}
            activeMetric={activeMetric}
            toggleMode={toggleMode}
            hoveredSiteId={hoveredSiteId}
            onHoverSite={setHoveredSiteId}
            /* Brief 14 Part 4: click selects (= shows card); navigation
               only via the View-site button inside the card. */
            onSelectSite={setSelectedSiteId}
          />
        </div>
        </div>

        {/* Legend - only when the active metric declares one */}
        {legend && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--rule-on-dark)',
            borderRadius: 6,
          }}>
            {legend.map((seg) => (
              <span key={seg.label} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--text-muted-on-dark)',
                lineHeight: 1.2,
              }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: seg.color,
                  display: 'inline-block',
                }} />
                {seg.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - map fills full available height.
          Chris ask 2026-06-03: marginLeft -120 pulls the map column
          westward so the dotted UK + pins extend BEHIND the
          leaderboard's bounding box. Dots tucking under the box is
          fine - the box's faint background sits over them and the
          composition reads as one continuous layer rather than two
          disjoint columns. */}
      <div style={{ position: 'relative', marginLeft: -120, minHeight: 0, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
        {/* Chris ask 2026-06-03: legend top-right. Explains the
            pulsating halo = metric magnitude, plus the "click for
            details" affordance. Tint of the sample halo follows the
            active theme so the legend stays in colour with the map. */}
        <div
          aria-label="Map legend"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '10px 12px',
            background: 'rgba(20, 28, 50, 0.78)',
            border: '1px solid var(--rule-on-dark)',
            borderRadius: 8,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            lineHeight: 1.4,
            color: 'var(--color-theme-body)',
            maxWidth: 240,
          }}
        >
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--color-nza-coral)',
            fontWeight: 500,
          }}>How to read the map</div>

          {/* Pulse-size sample: 3 dots showing small / medium / large */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
            {[8, 14, 22].map((d, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: d,
                  height: d,
                  borderRadius: '50%',
                  background: activeCategory?.colorHex || 'var(--color-nza-coral)',
                  opacity: 0.4,
                }}
              />
            ))}
            <span style={{ color: 'var(--text-muted-on-dark)', fontSize: 10.5 }}>
              halo size = magnitude
            </span>
          </div>

          <div style={{ color: 'var(--text-muted-on-dark)', fontSize: 10.5 }}>
            Hover a pin to highlight · click for full site detail.
          </div>
        </div>

        <MapMarkers
            sites={sitesArr}
            energyById={energyById}
            waterById={waterById}
            wasteById={wasteById}
            carbonById={carbonById}
            mpanRegisterById={mpanRegisterById}
            activeCategory={activeCategory}
            activeMetric={activeMetric}
            toggleMode={toggleMode}
            hoveredSiteId={hoveredSiteId}
            onHoverSite={setHoveredSiteId}
            /* Chris ask 2026-06-02: selected site also pops the pin
               (persistent until another site is clicked or × dismisses). */
            selectedSiteId={selectedSiteId}
            /* Brief 14 Part 4: click selects (= shows card); never navigates. */
            onSelectSite={setSelectedSiteId}
          />

          {/* Brief 14 Part 4 - selection card. Anchored to the SELECTED
              site's marker (was: hovered). Shown on click, dismissed on
              card-× or by clicking another site. The View-site CTA inside
              the card is the ONLY navigation path out. */}
          {cardData && cardData.pos && (() => {
            /* Chris ask 4 Jun: quadrant-aware placement so the card
               never overflows the page. Default placement was a fixed
               translate(16px, -110%) which left the card overflowing
               the viewport for markers low on the map (e.g. Millfield
               Green).
               Logic:
                 - Marker in LEFT half  → card flips to RIGHT of marker
                 - Marker in RIGHT half → card flips to LEFT  of marker
                 - Marker in TOP half   → card flips BELOW marker
                 - Marker in BOTTOM half → card flips ABOVE marker
               Thresholds skewed slightly so the card prefers the area
               with more room when the marker sits near centre. */
            const xRight = cardData.pos.x < 50
            const yDown  = cardData.pos.y < 45
            const tx = xRight ? '16px' : 'calc(-100% - 16px)'
            const ty = yDown  ? '16px' : 'calc(-100% - 16px)'
            return (
              <div
                ref={cardRef}
                style={{
                  position: 'absolute',
                  left: `${cardData.pos.x}%`,
                  top: `${cardData.pos.y}%`,
                  transform: `translate(${tx}, ${ty})`,
                  /* pointerEvents enabled on the inner card itself so the
                     View-site button + close work. */
                  zIndex: 30,
                }}
              >
                <SiteHoverCard
                  site={cardData.site}
                  energy={cardData.energy}
                  water={cardData.water}
                  waste={cardData.waste}
                  carbon={cardData.carbon}
                  onViewSite={() => go(cardData.site.id)}
                  onDismiss={() => setSelectedSiteId(null)}
                />
              </div>
            )
          })()}
        </div>
      </div>

      {/* Chris ask 2026-06-03: TotalsStrip removed - "just adding more
          information that we don't need to see." The leaderboard +
          map carry the analytical story; the totals were redundant. */}
    </div>
  )
}
