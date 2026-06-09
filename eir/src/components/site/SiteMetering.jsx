/**
 * Brief 24 Part 5 - Metering & data quality combined page.
 *
 * THE headline feature of Brief 24. Replaces the previous /site/<id>/meters
 * + /site/<id>/data-quality split into a single rich page:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  HEADLINE STRIP - totals · platform logos · DQ · GRESB    │
 *   ├──────────────────────┬───────────────────────────────────┤
 *   │  TABLE (40%)         │  GRAPHIC (60%)                    │
 *   │  filter pills        │  Sankey · Treemap · Bars toggle    │
 *   │  grouped rows        │                                    │
 *   │  expand individuals  │  linked selection w/ table         │
 *   └──────────────────────┴───────────────────────────────────┘
 *
 * Designer brief: match the portfolio Metering Sankey's visual discipline
 * - Westbrook NZA palette tokens, no default Recharts colours, no bordered-
 * cell tables, generous breathing room, typographic hierarchy carrying
 * the categorical encoding rather than colour-on-colour clutter.
 *
 * State model: shared `selection` ({ category, source }) drives both
 * panes. Click in table sets it; click in graphic sets it. Filter pills
 * narrow the table AND dim non-matching graphic elements.
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X as IconX, ChevronRight, Layers } from 'lucide-react'
import {
  ResponsiveContainer, Treemap, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

import sites from '@pipeline-data/sites.json'
import {
  landlordMeterCounts, gresbReadiness, platformCoverage, dataQualitySummary, groupedMeterRegister,
  siteSummary,
} from '../../lib/siteDerivations.js'

const READINESS_COLOUR = {
  green: '#7CC470',
  amber: '#E8A13C',
  red:   '#D85F4D',
  'n/a': 'rgba(255,255,255,0.18)',
}

const COMMODITY_COLOUR = {
  electricity:   'var(--metric-electricity)',   /* #D4A017 amber-gold */
  gas:           'var(--metric-gas)',            /* #B8443A NZA deep red */
  heat:          '#C4625C',                      /* metering-sycous-heat */
  'hot-water':   '#D86C5A',                      /* metering-sycous-hw */
  water:         '#4A7BA0',                      /* metering-sycous-cw */
  'sub-metered': '#E8C870',                      /* metering-sycous-elec */
  waste:         '#8B6FB8',                      /* --theme-waste purple (Chris ask 8 Jun) */
}

/* Brief 24.5 r2 - commodity icons for table rows. Mask-painted in the
   commodity colour so each row visually identifies its commodity at a
   glance before you even read the category label. */
const COMMODITY_ICON = {
  electricity:   '/icons/ivg-nza-icons_elec-solid.svg',
  gas:           '/icons/ivg-nza-icons_gas-solid.svg',
  heat:          '/icons/ivg-nza-icons_elec-solid.svg',  /* heat is electric-driven on most Westbrook sites */
  'hot-water':   '/icons/ivg-nza-icons_water.svg',
  water:         '/icons/ivg-nza-icons_water.svg',
  'sub-metered': '/icons/ivg-nza-icons_meter.svg',
  waste:         '/icons/ivg-nza-icons_recycling.svg',
}

const PLATFORM_LOGO = {
  ecotricity: '/logos/ivg-nza-logos_ecotricity.svg',
  arbnco:     '/logos/ivg-nza-logos_arbnco.svg',
  sycous:     '/logos/ivg-nza-logos_sycous.svg',
  stark:      null,  /* not in the logo set; render text fallback */
}
const PLATFORM_LABEL = {
  ecotricity: 'Ecotricity',
  arbnco:     'arbnco',
  sycous:     'Sycous',
  stark:      'Stark',
}

/* Brief 24.5 Part 2a - register switch. The page now renders on the
   CREAM register matching the rest of Site Detail (Brief 24 r1 used
   the dark register because the portfolio Sankey is dark, but the
   resulting black panel was jarring inside cream Site Detail -
   Chris ask 4 Jun: "I don't like this dark navy background, it breaks
   the cream consistency"). Tokens below are the cream-register
   equivalents - dark navy text on cream bg, muted navy rule lines. */
const TEXT_BODY  = 'var(--color-theme-base)'        /* navy body text */
const TEXT_MUTED = 'rgba(26,36,64,0.55)'             /* muted navy */
const RULE       = 'rgba(26,36,64,0.12)'             /* hairline navy rule */

/* ============================================================ */

export default function SiteMetering({ siteId }) {
  const site = sites[siteId]
  const counts    = useMemo(() => landlordMeterCounts(siteId), [siteId])
  const readiness = useMemo(() => gresbReadiness(siteId),      [siteId])
  const platforms = useMemo(() => platformCoverage(siteId),    [siteId])
  const dq        = useMemo(() => dataQualitySummary(siteId),  [siteId])
  const groups    = useMemo(() => groupedMeterRegister(siteId),[siteId])

  const [selection, setSelection]   = useState(null)
  const [graphicMode, setGraphicMode] = useState('sankey')
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [expanded, setExpanded]     = useState({})

  /* Filter pipeline: filter pill + search box narrow the visible rows. */
  const visibleGroups = useMemo(() => {
    return groups.filter((g) => {
      if (filter !== 'all' && !matchesFilter(g, filter)) return false
      if (search) {
        const q = search.toLowerCase()
        const inCat = g.category.toLowerCase().includes(q)
        const inMeter = g.meters.some((m) => (m.id || '').toLowerCase().includes(q))
        if (!inCat && !inMeter) return false
      }
      return true
    })
  }, [groups, filter, search])

  if (!site) {
    return <div className="page"><div className="empty-state">Site not found: {siteId}</div></div>
  }

  const summary = siteSummary(siteId)
  return (
    /* Brief 24.5 Part 2a - cream register. Drop the navy wrapper that
       Brief 24 r1 used. The Sankey palette, headline strip, table
       headers all read against cream now (which matches the rest of
       Site Detail and is consistent with what Chris asked for). */
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="page"
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        paddingBottom: 32,
      }}
    >
      {/* Brief 24.5 r3 Chris ask: condense the page chrome - title strip,
          narrative card, and headline strip merged into ONE compact
          banner. Saves ~140px of vertical so the graphic + table land
          above the fold. Type pill + name + condensed stats on the
          top row; narrative + fact pills on the bottom. */}
      <SiteBanner
        siteId={siteId}
        siteName={site.display_name}
        summary={summary}
        counts={counts}
        platforms={platforms}
        dq={dq}
        readiness={readiness}
        onReadinessClick={(commodity) => setFilter(commodity === 'electricity' ? 'electricity' : commodity)}
      />

      {/* ===== Filter pills ===== */}
      <FilterPills filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />

      {/* ===== Table (left 40%) + Graphic (right 60%) ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 40%) 1fr',
        gap: 28,
        alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MeterTable
            groups={visibleGroups}
            expanded={expanded}
            setExpanded={setExpanded}
            selection={selection}
            onSelect={(category) => setSelection(selection?.category === category ? null : { category, source: 'table' })}
          />
          <StatusLegend />
        </div>
        <GraphicPane
          mode={graphicMode}
          setMode={setGraphicMode}
          /* Chris ask 5 Jun: filter dims rather than restructures.
             Pass ALL groups so the Sankey/Treemap/Bars layout stays
             stable across filter changes; pass a Set of currently-
             visible category names so the renderers can fade the
             ones that don't match. */
          groups={groups}
          activeCategories={new Set(visibleGroups.map((g) => g.category))}
          allGroups={groups}
          platforms={platforms}
          selection={selection}
          onSelect={(category) => setSelection(selection?.category === category ? null : { category, source: 'graphic' })}
        />
      </div>
    </motion.div>
  )
}

/* ============================================================ */
/*  Filter helper                                                 */
/* ============================================================ */

function matchesFilter(g, filter) {
  const c = (g.category || '').toLowerCase()
  switch (filter) {
    case 'landlord':    return c.startsWith('landlord') || c.startsWith('construction')
    case 'submetered':  return c.startsWith('sycous')
    case 'void':        return c.startsWith('void')
    case 'inactive':    return c.startsWith('inactive')
    case 'gas':         return g.commodity === 'gas'
    case 'electricity': return g.commodity === 'electricity'
    case 'heat':        return g.commodity === 'heat' || g.commodity === 'hot-water'
    case 'water':       return g.commodity === 'water'
    default:            return true
  }
}

/* ============================================================ */
/*  HEADLINE STRIP                                                */
/* ============================================================ */

function HeadlineStrip({ counts, platforms, dq, readiness, onReadinessClick }) {
  const totalLandlord = (counts.electricity || 0) + (counts.gas || 0)
  const totalSubMetered = platforms.find((p) => p.platform === 'sycous')?.meterCount || 0
  const totalVisible = dq.metersTotal + totalSubMetered

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      background: 'rgba(26,36,64,0.03)',
      border: `1px solid ${RULE}`,
      borderRadius: 10,
      padding: '14px 20px',
      gap: 0,
    }}>
      <HeadlinePanel label="Meters at this site" first>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30, lineHeight: 1, fontWeight: 400,
          color: TEXT_BODY,
        }}>{totalVisible}</div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 }}>
          {totalLandlord} Landlord · {totalSubMetered} Sub-meter ·{' '}
          {Math.max(dq.metersTotal - totalLandlord, 0)} other
        </div>
      </HeadlinePanel>

      <HeadlinePanel label="Platform coverage">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          {platforms.map((p) => <PlatformBadge key={p.platform} {...p} />)}
        </div>
      </HeadlinePanel>

      <HeadlinePanel label="Data quality">
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6,
          fontFamily: 'var(--font-display)',
          fontSize: 24, fontWeight: 400, color: TEXT_BODY, lineHeight: 1,
        }}>
          {dq.metersCurrent}
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>current</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 }}>
          {dq.metersStale} stale · {dq.metersMissing} missing
        </div>
      </HeadlinePanel>

      <HeadlinePanel label="GRESB readiness" last>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['electricity', 'gas', 'water', 'waste'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onReadinessClick?.(k)}
              title={`${k} · ${readiness[k]}`}
              style={{
                width: 28, height: 8, borderRadius: 4,
                background: READINESS_COLOUR[readiness[k]] || READINESS_COLOUR['n/a'],
                border: 'none', padding: 0, cursor: 'pointer',
              }}
            />
          ))}
          <span aria-hidden style={{
            marginLeft: 8,
            width: 12, height: 12, borderRadius: 999,
            background: READINESS_COLOUR[readiness.overall],
            display: 'inline-block',
            boxShadow: `0 0 0 2px color-mix(in srgb, ${READINESS_COLOUR[readiness.overall]} 25%, transparent)`,
          }} />
        </div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>
          Composite: <strong style={{ color: READINESS_COLOUR[readiness.overall] }}>{readiness.overall.toUpperCase()}</strong>
        </div>
      </HeadlinePanel>
    </div>
  )
}

function HeadlinePanel({ label, children, first, last }) {
  return (
    <div style={{
      padding: '4px 22px',
      borderLeft:  first ? 'none' : `1px solid ${RULE}`,
      borderRight: 'none',
      display: 'flex', flexDirection: 'column', gap: 2,
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 9, fontWeight: 600,
        letterSpacing: 1.4, textTransform: 'uppercase',
        color: TEXT_MUTED,
        marginBottom: 10,
      }}>{label}</div>
      {children}
    </div>
  )
}

function PlatformBadge({ platform, present, meterCount }) {
  const url = PLATFORM_LOGO[platform]
  const label = PLATFORM_LABEL[platform]
  const tooltip = `${label}${present ? ` · ${meterCount} meter${meterCount === 1 ? '' : 's'}` : ' · not present'}`
  /* Logos are dark-on-white SVGs; tint to cream via mask. */
  return (
    <span title={tooltip} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      opacity: present ? 1 : 0.3,
      filter: present ? 'none' : 'grayscale(1)',
    }}>
      {url ? (
        <span aria-hidden style={{
          display: 'inline-block',
          width: 64, height: 18,
          backgroundColor: present ? 'var(--color-theme-base)' : TEXT_MUTED,
          WebkitMaskImage: `url(${url})`,
          maskImage: `url(${url})`,
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center', maskPosition: 'center',
          WebkitMaskSize: 'contain', maskSize: 'contain',
        }} />
      ) : (
        <span style={{
          padding: '2px 6px',
          border: `1px dashed ${present ? TEXT_BODY : TEXT_MUTED}`,
          borderRadius: 4,
          fontFamily: 'var(--font-heading)',
          fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
          color: present ? TEXT_BODY : TEXT_MUTED,
          textTransform: 'uppercase',
        }}>{label}</span>
      )}
    </span>
  )
}

/* ============================================================ */
/*  FILTER PILLS                                                  */
/* ============================================================ */

/* Chris ask 8 Jun - commodity filter pills carry their brand icon
   next to the label. Generic filters (All / Landlord / Sub-metered
   / Void / Inactive) get a meter icon to keep visual rhythm. */
const FILTERS = [
  { key: 'all',          label: 'All meters',                iconUrl: '/icons/ivg-nza-icons_meter.svg' },
  { key: 'landlord',     label: 'Landlord',                  iconUrl: '/icons/ivg-nza-icons_meter.svg' },
  { key: 'submetered',   label: 'Sub-metered',               iconUrl: '/icons/ivg-nza-icons_meter.svg' },
  { key: 'void',         label: 'Void / between residents',  iconUrl: '/icons/ivg-nza-icons_meter.svg' },
  { key: 'inactive',     label: 'Inactive / unclear',        iconUrl: '/icons/ivg-nza-icons_meter.svg' },
  /* Brief 24 Part 5b - commodity row stacks on second row via flex-wrap. */
  { key: 'gas',          label: 'Gas',         group: 'commodity', iconUrl: '/icons/ivg-nza-icons_gas-solid.svg' },
  { key: 'electricity',  label: 'Electricity', group: 'commodity', iconUrl: '/icons/ivg-nza-icons_elec-solid.svg' },
  { key: 'heat',         label: 'Heat',        group: 'commodity', iconUrl: '/icons/ivg-nza-icons_elec-solid.svg' },
  { key: 'water',        label: 'Water',       group: 'commodity', iconUrl: '/icons/ivg-nza-icons_water.svg' },
]

function FilterPills({ filter, setFilter, search, setSearch }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
      paddingBottom: 4,
    }}>
      {FILTERS.map((f) => {
        const isActive = filter === f.key
        return (
          <button
            key={f.key}
            type="button"
            /* Chris ask 8 Jun - clicking the active filter again
               returns to "All" so the user can clear a selection
               without hunting for the All pill. Clicking the All
               pill when it's already active is a no-op. */
            onClick={() => setFilter(isActive && f.key !== 'all' ? 'all' : f.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              border: `1px solid ${isActive ? 'var(--color-nza-coral)' : 'rgba(26,36,64,0.10)'}`,
              background: isActive ? 'var(--color-nza-coral)' : 'transparent',
              color: isActive ? '#0F1629' : TEXT_MUTED,
              fontFamily: 'var(--font-heading)',
              fontSize: 11, fontWeight: 500, letterSpacing: 0.3,
              cursor: 'pointer',
              transition: 'all 160ms var(--ease-standard)',
              ...(f.group === 'commodity' ? { fontStyle: 'normal', opacity: 0.9 } : {}),
            }}
          >
            {f.iconUrl && (
              <span aria-hidden style={{
                display: 'inline-block',
                width: 12, height: 12,
                backgroundColor: isActive ? '#0F1629' : TEXT_MUTED,
                WebkitMaskImage: `url("${f.iconUrl}")`, maskImage: `url("${f.iconUrl}")`,
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                WebkitMaskSize: 'contain', maskSize: 'contain',
              }} />
            )}
            {f.label}
          </button>
        )
      })}

      <span style={{
        marginLeft: 'auto',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px',
        background: 'rgba(26,36,64,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
      }}>
        <Search size={12} color={TEXT_MUTED} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meter ID, category…"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: TEXT_BODY,
            width: 180,
          }}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: TEXT_MUTED, padding: 0, display: 'inline-flex',
          }} title="Clear search">
            <IconX size={12} />
          </button>
        )}
      </span>
    </div>
  )
}

/* ============================================================ */
/*  TABLE                                                         */
/* ============================================================ */

function MeterTable({ groups, expanded, setExpanded, selection, onSelect }) {
  if (groups.length === 0) {
    return (
      <div style={{
        padding: 28, border: `1px dashed ${RULE}`, borderRadius: 8,
        color: TEXT_MUTED, fontSize: 13, textAlign: 'center',
      }}>
        No meter groups match the current filter.
      </div>
    )
  }
  return (
    <div role="table" aria-label="Meter inventory" style={{
      display: 'flex', flexDirection: 'column',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div role="rowheader" style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto auto',
        gap: 16, padding: '10px 14px',
        fontFamily: 'var(--font-heading)',
        fontSize: 10, fontWeight: 600,
        letterSpacing: 0.6, textTransform: 'uppercase',
        color: TEXT_MUTED,
        borderBottom: `1px solid ${RULE}`,
      }}>
        <span>Category</span>
        <span style={{ minWidth: 56, textAlign: 'right' }}>Meters</span>
        <span style={{ minWidth: 80, textAlign: 'right' }}>CY25 total</span>
        <span style={{ minWidth: 24 }}>Status</span>
      </div>

      {groups.map((g, i) => {
        const isExpanded = !!expanded[g.category]
        const isSelected = selection?.category === g.category
        return (
          <div key={g.category}>
            <button
              role="row"
              type="button"
              onClick={() => onSelect(g.category)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                gap: 16, alignItems: 'center',
                width: '100%', padding: '14px 14px',
                background: isSelected ? 'rgba(232,114,92,0.10)' : (i % 2 === 0 ? 'transparent' : 'rgba(26,36,64,0.018)'),
                border: 'none',
                borderLeft: `2px solid ${isSelected ? 'var(--color-nza-coral)' : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 140ms ease, border-color 140ms ease',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', gap: 10,
                minWidth: 0,
              }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setExpanded((p) => ({ ...p, [g.category]: !p[g.category] })) }}
                  aria-label={isExpanded ? 'Collapse meters' : 'Expand meters'}
                  style={{
                    background: 'transparent', border: 'none', padding: 0,
                    color: TEXT_MUTED, cursor: 'pointer',
                    display: 'inline-flex', flex: '0 0 14px',
                  }}
                >
                  <ChevronRight size={12} style={{
                    transition: 'transform 160ms ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                  }} />
                </button>
                {/* Brief 24.5 r2 - mask-painted commodity icon instead
                    of a plain colour dot. Iconographically explicit. */}
                <span aria-hidden style={{
                  display: 'inline-block',
                  width: 18, height: 18,
                  flex: '0 0 18px',
                  backgroundColor: COMMODITY_COLOUR[g.commodity] || TEXT_MUTED,
                  WebkitMaskImage: `url(${COMMODITY_ICON[g.commodity] || '/icons/ivg-nza-icons_meter.svg'})`,
                  maskImage:       `url(${COMMODITY_ICON[g.commodity] || '/icons/ivg-nza-icons_meter.svg'})`,
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center', maskPosition: 'center',
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                }} />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13, fontWeight: 500,
                  color: TEXT_BODY,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{g.category}</span>
              </span>
              <span style={{
                minWidth: 56, textAlign: 'right',
                fontFamily: 'var(--font-heading)',
                fontSize: 13, fontWeight: 500,
                color: TEXT_BODY,
                fontVariantNumeric: 'tabular-nums',
              }}>{g.meterCount}</span>
              <span style={{
                minWidth: 80, textAlign: 'right',
                fontFamily: 'var(--font-body)',
                fontSize: 11, color: TEXT_MUTED,
                fontVariantNumeric: 'tabular-nums',
              }}>{g.totalKwh ? fmtCompact(g.totalKwh) : '-'}</span>
              <span aria-hidden style={{
                width: 8, height: 8, borderRadius: 999,
                background: groupHealthColour(g),
                minWidth: 8,
              }} />
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && g.meters.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  {g.meters.slice(0, 30).map((m) => (
                    <div key={m.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                      gap: 16, alignItems: 'center',
                      padding: '8px 14px 8px 40px',
                      fontFamily: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
                      fontSize: 11, color: TEXT_MUTED,
                    }}>
                      <span>{m.id}</span>
                      <span style={{ minWidth: 56, textAlign: 'right' }}>{m.type}</span>
                      <span style={{ minWidth: 80, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {m.lastReadingValue != null ? fmtCompact(m.lastReadingValue) : '-'}
                      </span>
                      <span aria-hidden style={{
                        width: 8, height: 8, borderRadius: 999,
                        background: m.status === 'current' ? READINESS_COLOUR.green
                                  : m.status === 'stale'   ? READINESS_COLOUR.amber
                                  :                          READINESS_COLOUR.red,
                      }} />
                    </div>
                  ))}
                  {g.meters.length > 30 && (
                    <div style={{
                      padding: '8px 14px 8px 40px',
                      fontSize: 11, color: TEXT_MUTED, fontStyle: 'italic',
                    }}>… {g.meters.length - 30} more (search to filter)</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function groupHealthColour(g) {
  const total = g.meters.length || g.meterCount || 0
  if (!total) return READINESS_COLOUR['n/a']
  if (!g.meters.length) return READINESS_COLOUR.amber  /* aggregate, no per-meter detail */
  const current = g.meters.filter((m) => m.status === 'current').length
  const ratio = current / total
  if (ratio > 0.9) return READINESS_COLOUR.green
  if (ratio > 0.5) return READINESS_COLOUR.amber
  return READINESS_COLOUR.red
}

/* ============================================================ */
/*  GRAPHIC PANE - toggle between Sankey / Treemap / Bars         */
/* ============================================================ */

function GraphicPane({ mode, setMode, groups, allGroups, activeCategories, platforms, selection, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Mode toggle */}
      <div role="tablist" aria-label="Graphic view"
        style={{ display: 'flex', gap: 4, alignItems: 'center' }}
      >
        {[
          { key: 'sankey',  label: 'Sankey' },
          { key: 'treemap', label: 'Treemap' },
          { key: 'bars',    label: 'Bars' },
          { key: 'sitemap', label: 'Site map' },
        ].map((m) => {
          const isActive = mode === m.key
          const isDisabled = m.key === 'sitemap'
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled || undefined}
              onClick={() => !isDisabled && setMode(m.key)}
              title={isDisabled ? 'Spatial view of meters across the site. Pending building footprint data from Westbrook.' : undefined}
              style={{
                padding: '5px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--color-nza-coral)'
                  : '2px solid transparent',
                fontFamily: 'var(--font-heading)',
                fontSize: 12, fontWeight: 500,
                color: isActive ? 'var(--color-nza-coral)'
                       : isDisabled ? 'rgba(26,36,64,0.20)'
                       : TEXT_MUTED,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
                transition: 'color 160ms ease, border-color 160ms ease',
              }}
            >{m.label}{isDisabled ? ' · soon' : ''}</button>
          )
        })}
      </div>

      <div style={{
        background: 'rgba(26,36,64,0.02)',
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        padding: 18,
        minHeight: 460,
        position: 'relative',
      }}>
        {mode === 'sankey'  && <SankeyView groups={groups} activeCategories={activeCategories} selection={selection} onSelect={onSelect} />}
        {mode === 'treemap' && <TreemapView groups={groups} activeCategories={activeCategories} selection={selection} onSelect={onSelect} />}
        {mode === 'bars'    && <BarsView groups={groups} activeCategories={activeCategories} selection={selection} onSelect={onSelect} />}
        {mode === 'sitemap' && <SiteMapPlaceholder />}
      </div>
    </div>
  )
}

/* ----- SANKEY (d3-sankey rebuild, Chris ask 5 Jun) -----
   Matches the portfolio MeteringSankey's visual discipline: proper
   d3-sankey layout with crossing minimisation, three columns
   commodity → platform → category-group, ribbons sized by meter
   count, colours follow the source commodity. Platform-logo masks
   in the middle column when the platform has a brand SVG. */

const SANKEY_W = 880
const SANKEY_H = 460
const SANKEY_NODE_W = 14
const SANKEY_NODE_PAD = 18
const SANKEY_LEFT_LABEL = 150
const SANKEY_RIGHT_LABEL = 200

const PLATFORM_NODE_LABEL = {
  ecotricity: 'Ecotricity',
  arbnco:     'arbnco',
  sycous:     'Sycous',
  stark:      'Stark',
  'water-company':    'Water co.',
  'waste-contractor': 'Waste',
}

function SankeyView({ groups, activeCategories, selection, onSelect }) {
  /* Build the d3-sankey graph + run the layout once per groups list. */
  const layout = useMemo(() => {
    const nodes = []
    const links = []
    const commoditiesSeen = new Set()
    const platformsSeen = new Set()
    for (const g of groups) {
      const commodity = g.commodity || 'electricity'
      const platform  = g.platform  || 'ecotricity'
      const commodityId = `c:${commodity}`
      const platformId  = `p:${platform}`
      const groupId     = `g:${g.category}`

      if (!commoditiesSeen.has(commodityId)) {
        commoditiesSeen.add(commodityId)
        nodes.push({ id: commodityId, kind: 'left', label: titleCase(commodity), commodity })
      }
      if (!platformsSeen.has(platformId)) {
        platformsSeen.add(platformId)
        nodes.push({
          id: platformId, kind: 'mid',
          label: PLATFORM_NODE_LABEL[platform] || platform,
          logo: PLATFORM_LOGO[platform] || null,
          platform,
        })
      }
      nodes.push({
        id: groupId, kind: 'right',
        label: g.category,
        commodity, meterCount: g.meterCount, category: g.category,
      })

      links.push({ source: commodityId, target: platformId, value: g.meterCount, commodity, category: g.category })
      links.push({ source: platformId,  target: groupId,    value: g.meterCount, commodity, category: g.category })
    }
    if (nodes.length === 0) return { nodes: [], links: [] }
    const sk = sankey()
      .nodeId((d) => d.id)
      .nodeWidth(SANKEY_NODE_W)
      .nodePadding(SANKEY_NODE_PAD)
      .extent([[SANKEY_LEFT_LABEL, 30], [SANKEY_W - SANKEY_RIGHT_LABEL, SANKEY_H - 24]])
      .nodeSort(null)
      .linkSort(null)
    return sk({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    })
  }, [groups])

  if (!layout.nodes || layout.nodes.length === 0) {
    return (
      <div style={{ padding: 36, textAlign: 'center', color: TEXT_MUTED, fontSize: 12, fontStyle: 'italic' }}>
        No meters to chart for the current filter.
      </div>
    )
  }

  const linkPath = sankeyLinkHorizontal()

  return (
    <svg viewBox={`0 0 ${SANKEY_W} ${SANKEY_H}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
      {/* Brief 24.6 Part 3e - entrance.
          Nodes fade in over 400 ms first; ribbons draw left-to-right
          via stroke-dashoffset animation starting at 300 ms. The
          shape appears, then the connections grow between the
          rectangles. Subsequent re-renders (filter pill clicks etc.)
          don't replay because the CSS animations fire once per mount;
          the SVG itself doesn't unmount during state changes. */}
      {/* Ribbons.
          Chris ask 8 Jun - two-phase entrance. Previously all ribbons
          drew in one big simultaneous wave (left→mid AND mid→right
          overlapping in time), which made the chart look "all joining
          up at the same time" mid-animation. Sequential is cleaner:
          left half draws to completion FIRST, then the right half
          draws. The eye follows commodity → platform → category
          rather than seeing both halves grow at once.
          Phasing computed below - each link is tagged 'left' (source
          is a commodity column node) or 'right' (source is a platform
          column node), and gets a separate `phaseIndex` so the stagger
          restarts cleanly at the start of phase 2.
          Numbers tuned for the typical 5 left ribbons + ~10 right
          ribbons we see on a populated site:
            * Phase 1 start at 350 ms (after nodes have faded in 400 ms,
              with a small overlap so the structure feels alive rather
              than waiting).
            * 25 ms stagger between left ribbons.
            * 600 ms draw per ribbon (was 800 ms - shorter so the total
              animation doesn't drag).
            * Phase 2 starts when the last left ribbon's draw completes,
              minus a 100 ms overlap so it doesn't feel like a pause.
          The `LEFT_DRAW_MS`, `STAGGER_MS`, and `PHASE_GAP_MS` constants
          live next to the calculation so future tweaks are obvious. */}
      <g>
        {(() => {
          const LEFT_DRAW_MS = 600
          const STAGGER_MS = 25
          const PHASE_START_MS = 350
          const PHASE_GAP_MS = -100 // negative = small overlap
          let leftCount = 0
          let rightCount = 0
          // Pre-walk to count left links so we know when phase 1 ends
          // and phase 2 can start. d3-sankey resolves `link.source` to
          // the node object, so .kind is reliable.
          const numLeft = layout.links.filter(l => l.source.kind === 'left').length
          const phase1EndMs = PHASE_START_MS + (numLeft - 1) * STAGGER_MS + LEFT_DRAW_MS
          const phase2StartMs = Math.max(PHASE_START_MS, phase1EndMs + PHASE_GAP_MS)
          return layout.links.map((link, i) => {
            /* Chris ask 5 Jun: filter pill dims ribbons it doesn't match;
               selection click also dims non-matching. Either gate fades. */
            const outOfFilter = activeCategories && !activeCategories.has(link.category)
            const dimmed = outOfFilter || (selection && selection.category !== link.category)
            const colour = COMMODITY_COLOUR[link.commodity] || '#8FA1B5'
            const isLeftPhase = link.source.kind === 'left'
            const phaseIndex = isLeftPhase ? leftCount++ : rightCount++
            const delay = isLeftPhase
              ? PHASE_START_MS + phaseIndex * STAGGER_MS
              : phase2StartMs + phaseIndex * STAGGER_MS
            return (
              <path
                key={i}
                className="sankey-link-draw"
                d={linkPath(link)}
                fill="none"
                stroke={colour}
                strokeOpacity={dimmed ? 0.10 : 0.45}
                strokeWidth={Math.max(1, link.width)}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-opacity 160ms ease',
                  animationDelay: `${delay}ms`,
                  animationDuration: `${LEFT_DRAW_MS}ms`,
                }}
                onClick={() => onSelect?.(link.category)}
              >
                <title>{link.category} · {link.value} meters</title>
              </path>
            )
          })
        })()}
      </g>

      {/* Nodes */}
      <g className="sankey-nodes-fade">
        {layout.nodes.map((n) => {
          const fillCol = n.kind === 'left'  ? (COMMODITY_COLOUR[n.commodity] || TEXT_MUTED)
                        : n.kind === 'right' ? (COMMODITY_COLOUR[n.commodity] || TEXT_MUTED)
                        : 'rgba(26,36,64,0.30)'
          const outOfFilterNode = n.kind === 'right' && activeCategories && !activeCategories.has(n.category)
          const dimmed = outOfFilterNode || (selection && n.kind === 'right' && selection.category !== n.category)
          const handleClick = () => {
            if (n.kind === 'right' && n.category) onSelect?.(n.category)
          }
          return (
            <g key={n.id}
              style={{ cursor: n.kind === 'right' ? 'pointer' : 'default',
                       opacity: dimmed ? 0.35 : 1,
                       transition: 'opacity 160ms ease' }}
              onClick={handleClick}
            >
              <rect
                x={n.x0} y={n.y0}
                width={n.x1 - n.x0}
                height={Math.max(2, n.y1 - n.y0)}
                fill={fillCol}
                fillOpacity={0.85}
                stroke="var(--color-nza-cream)"
                strokeWidth={1.5}
                rx={2}
              />

              {/* Left column labels (right-aligned outside the node) */}
              {n.kind === 'left' && (
                <text
                  x={n.x0 - 10}
                  y={(n.y0 + n.y1) / 2 + 4}
                  textAnchor="end"
                  fontFamily="var(--font-body)"
                  fontSize={12}
                  fontWeight={500}
                  fill={COMMODITY_COLOUR[n.commodity] || TEXT_BODY}
                >
                  {n.label}
                </text>
              )}

              {/* Middle column - platform logo on top of the node */}
              {n.kind === 'mid' && n.logo && (
                <foreignObject
                  x={(n.x0 + n.x1) / 2 - 50}
                  y={n.y0 - 24}
                  width={100} height={22}
                >
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundColor: 'var(--color-theme-base)',
                    WebkitMaskImage: `url(${n.logo})`,
                    maskImage: `url(${n.logo})`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center', maskPosition: 'center',
                    WebkitMaskSize: 'contain', maskSize: 'contain',
                  }} />
                </foreignObject>
              )}
              {n.kind === 'mid' && !n.logo && (
                <text
                  x={(n.x0 + n.x1) / 2}
                  y={n.y0 - 8}
                  textAnchor="middle"
                  fontFamily="var(--font-heading)"
                  fontSize={11}
                  fontWeight={600}
                  letterSpacing={0.5}
                  fill={TEXT_BODY}
                >
                  {n.label}
                </text>
              )}

              {/* Right column labels (left-aligned outside the node) +
                  meter count beneath */}
              {n.kind === 'right' && (
                <>
                  <text
                    x={n.x1 + 10}
                    y={(n.y0 + n.y1) / 2 - 2}
                    textAnchor="start"
                    fontFamily="var(--font-body)"
                    fontSize={12}
                    fontWeight={500}
                    fill={COMMODITY_COLOUR[n.commodity] || TEXT_BODY}
                  >
                    {n.label.replace(/^[^·]+·\s*/, '').trim() || n.label}
                  </text>
                  <text
                    x={n.x1 + 10}
                    y={(n.y0 + n.y1) / 2 + 12}
                    textAnchor="start"
                    fontFamily="var(--font-heading)"
                    fontSize={10}
                    fontWeight={500}
                    fill={TEXT_MUTED}
                    letterSpacing={0.4}
                  >
                    {n.meterCount} {n.meterCount === 1 ? 'meter' : 'meters'}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function titleCase(s) {
  if (!s) return ''
  return s.split(/[-\s]+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

/* ----- TREEMAP ----- */

function TreemapView({ groups, activeCategories, selection, onSelect }) {
  /* Brief 24.5 r2 - square-root scaling of cell sizes. Without it, sites
     like Millfield Green where one category dominates (Sycous 133 vs
     Landlord 1 vs Water 1 vs Waste 1) render as one giant block + three
     invisible slivers. The label still shows the TRUE meter count;
     only the cell-area encoding is rescaled so the smaller categories
     stay readable. Linear encoding for counts under ~10; sqrt for the
     dominating outliers. */
  const data = groups.map((g) => ({
    name: g.category,
    size: Math.sqrt(g.meterCount + 1) * 4,  /* sqrt-scaled cell area */
    meterCount: g.meterCount,                /* true value for label */
    totalKwh: g.totalKwh,
    commodity: g.commodity,
  }))
  return (
    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          animationDuration={600}
          animationEasing="ease-out"
          content={<TreemapCell selection={selection} activeCategories={activeCategories} onSelect={onSelect} />}
        />
      </ResponsiveContainer>
    </div>
  )
}

function TreemapCell(props) {
  const { x, y, width, height, name, meterCount, commodity, selection, activeCategories, onSelect } = props
  if (width <= 0 || height <= 0) return null
  const colour = COMMODITY_COLOUR[commodity] || '#8FA1B5'
  const outOfFilter = activeCategories && !activeCategories.has(name)
  const dimmed = outOfFilter || (selection && selection.category !== name)
  /* Strip the "Sycous · " / "Water · " prefix from the label inside the
     cell - the colour + icon already encode commodity, so the label
     can be cleaner. */
  const cleanName = (name || '').replace(/^[^·]+·\s*/, '').trim() || name
  return (
    <g style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 160ms ease' }}
       onClick={() => onSelect?.(name)}
    >
      <rect x={x} y={y} width={width} height={height}
        fill={colour}
        fillOpacity={0.85}
        stroke="var(--color-nza-cream)"
        strokeWidth={3}
        rx={4}
      />
      {width > 80 && height > 40 && (
        <>
          <text x={x + 12} y={y + 22}
            fontFamily="var(--font-body)" fontSize={13} fontWeight={600} fill="#0F1629">
            {cleanName}
          </text>
          <text x={x + 12} y={y + 40}
            fontFamily="var(--font-heading)" fontSize={11} fontWeight={500} fill="rgba(15,22,41,0.75)"
            fontVariantNumeric="tabular-nums" letterSpacing={0.3}>
            {meterCount} {meterCount === 1 ? 'meter' : 'meters'}
          </text>
        </>
      )}
      {width >= 40 && height >= 24 && width <= 80 && (
        <text x={x + width / 2} y={y + height / 2 + 4}
          textAnchor="middle"
          fontFamily="var(--font-heading)" fontSize={11} fontWeight={600} fill="#0F1629">
          {meterCount}
        </text>
      )}
    </g>
  )
}

/* ----- BARS ----- */

function BarsView({ groups, activeCategories, selection, onSelect }) {
  const data = [...groups].sort((a, b) => b.meterCount - a.meterCount).map((g) => ({
    name: g.category, meters: g.meterCount, commodity: g.commodity,
  }))
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" tick={{ fill: TEXT_MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: TEXT_BODY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={160}
        />
        <Tooltip
          cursor={{ fill: 'rgba(26,36,64,0.04)' }}
          contentStyle={{
            background: 'var(--color-theme-base)',
            border: `1px solid ${RULE}`,
            borderRadius: 6,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
          }}
          labelStyle={{ color: TEXT_BODY, fontWeight: 600 }}
          formatter={(v) => [`${v} meters`, '']}
        />
        <Bar dataKey="meters" onClick={(_, idx) => onSelect?.(data[idx].name)} animationDuration={700} animationEasing="ease-out">
          {data.map((d, i) => {
            const outOfFilter = activeCategories && !activeCategories.has(d.name)
            const dimmed = outOfFilter || (selection && selection.category !== d.name)
            return (
              <Cell key={i}
                fill={COMMODITY_COLOUR[d.commodity] || '#8FA1B5'}
                fillOpacity={dimmed ? 0.2 : 0.85}
                cursor="pointer"
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ----- SITE MAP PLACEHOLDER ----- */

function SiteMapPlaceholder() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 380, gap: 12,
      border: `1px dashed ${RULE}`,
      borderRadius: 8,
      color: TEXT_MUTED,
      textAlign: 'center',
      padding: 24,
    }}>
      <Layers size={24} color={TEXT_MUTED} />
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 500, color: TEXT_BODY }}>
        Spatial view of meters across the site
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5, maxWidth: 320 }}>
        Pending building footprint data from Westbrook. When the site-plan layer
        arrives, every meter will plot on its physical location and the
        category encoding will carry through.
      </div>
    </div>
  )
}

/* ============================================================ */
/*  Formatter                                                     */
/* ============================================================ */

function fmtCompact(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return Math.round(n).toString()
}

/* ============================================================ */
/*  Brief 24.5 r3 - SiteBanner (merged narrative + headline)      */
/* ============================================================ */

/* One compact card that absorbs page title + narrative card + headline
   strip. Top row: type pill + site name + condensed stats inline.
   Bottom row: narrative summary + fact pills. Single bordered
   container so it reads as ONE thing rather than three stacked
   panels. ~140px tall vs ~280px for the three separate pieces it
   replaces - gives the graphic + table 140px more vertical to claim. */
function SiteBanner({ siteId, siteName, summary, counts, platforms, dq, readiness, onReadinessClick }) {
  const totalLandlord = (counts.electricity || 0) + (counts.gas || 0)
  const totalSubMetered = platforms.find((p) => p.platform === 'sycous')?.meterCount || 0
  const totalVisible = dq.metersTotal + totalSubMetered

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gap: 32,
      padding: '16px 22px',
      background: 'rgba(232, 114, 92, 0.04)',
      border: '1px solid rgba(232, 114, 92, 0.18)',
      borderRadius: 10,
      alignItems: 'start',
    }}>
      {/* LEFT zone - identity + narrative + fact pills.
          Chris ask 5 Jun r3 (design system consistency): site icon now
          sits next to the type pill + name, same 44px coral-tinted
          mask treatment as the SiteHeader on Energy / Carbon / Water /
          Waste. One icon size + position across every site sub-tab. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {siteId === 'edwalton-office' ? (
            <span aria-hidden style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, flex: '0 0 38px',
              borderRadius: 999, background: 'var(--color-nza-coral)',
              color: 'var(--color-nza-cream)',
              fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700,
              letterSpacing: 0.4,
            }}>iv</span>
          ) : siteId && (
            <span aria-hidden style={{
              display: 'inline-block',
              width: 38, height: 38, flex: '0 0 38px',
              backgroundColor: 'var(--color-nza-coral)',
              WebkitMaskImage: `url(/sites/${siteId}/icon.svg)`,
              maskImage:       `url(/sites/${siteId}/icon.svg)`,
              WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center', maskPosition: 'center',
              WebkitMaskSize: 'contain', maskSize: 'contain',
            }} />
          )}
          <span style={{
            padding: '3px 9px',
            borderRadius: 999,
            background: 'var(--color-nza-coral)',
            color: 'var(--color-nza-cream)',
            fontFamily: 'var(--font-heading)',
            fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
          }}>{summary.type}</span>
          <span style={{
            fontFamily: 'var(--font-site)',
            fontSize: 22, fontWeight: 500,
            color: TEXT_BODY,
            letterSpacing: '-0.005em',
          }}>{siteName}</span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-heading)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: 1, textTransform: 'uppercase',
            color: 'var(--color-nza-coral)',
          }}>Meters</span>
        </div>

        <p style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-small)',
          lineHeight: 1.5,
          color: TEXT_BODY,
          maxWidth: 720,
        }}>{summary.summary}</p>

        {summary.facts && summary.facts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {summary.facts.map((f, i) => (
              <span key={i} style={{
                padding: '2px 9px',
                borderRadius: 999,
                background: 'rgba(26,36,64,0.05)',
                border: '1px solid rgba(26,36,64,0.08)',
                color: TEXT_BODY,
                fontFamily: 'var(--font-body)',
                fontSize: 10.5, fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT zone - condensed stat grid (2×2). Each cell is small
          but legible; the column reads as a quick-glance dashboard
          alongside the narrative. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        gridTemplateRows: 'auto auto',
        columnGap: 22, rowGap: 12,
        alignSelf: 'center',
        borderLeft: `1px solid ${RULE}`,
        paddingLeft: 28,
      }}>
        <BannerStat
          label="Meters"
          value={totalVisible}
          sub={`${totalLandlord} LL · ${totalSubMetered} sub`}
        />
        <BannerStat
          label="Data quality"
          value={dq.metersCurrent}
          valueSuffix="current"
          sub={`${dq.metersStale} stale · ${dq.metersMissing} missing`}
        />
        <BannerStatPlatforms platforms={platforms} />
        <BannerStatReadiness readiness={readiness} onClick={onReadinessClick} />
      </div>
    </section>
  )
}

function BannerStat({ label, value, valueSuffix, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 9, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>{label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 5,
        fontFamily: 'var(--font-display)',
        fontSize: 22, fontWeight: 400, color: TEXT_BODY, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
        {valueSuffix && (
          <span style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>
            {valueSuffix}
          </span>
        )}
      </span>
      {sub && (
        <span style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.4 }}>
          {sub}
        </span>
      )}
    </div>
  )
}

function BannerStatPlatforms({ platforms }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 9, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>Platforms</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {platforms.map((p) => <PlatformBadge key={p.platform} {...p} />)}
      </div>
    </div>
  )
}

function BannerStatReadiness({ readiness, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 9, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>GRESB readiness</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {['electricity', 'gas', 'water', 'waste'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onClick?.(k)}
            title={`${k} · ${readiness[k]}`}
            style={{
              width: 24, height: 7, borderRadius: 4,
              background: READINESS_COLOUR[readiness[k]] || READINESS_COLOUR['n/a'],
              border: 'none', padding: 0, cursor: 'pointer',
            }}
          />
        ))}
        <span aria-hidden style={{
          marginLeft: 6,
          width: 10, height: 10, borderRadius: 999,
          background: READINESS_COLOUR[readiness.overall],
          display: 'inline-block',
          boxShadow: `0 0 0 2px color-mix(in srgb, ${READINESS_COLOUR[readiness.overall]} 25%, transparent)`,
        }} />
      </div>
      <span style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.4 }}>
        Composite: <strong style={{ color: READINESS_COLOUR[readiness.overall], fontWeight: 600 }}>{readiness.overall.toUpperCase()}</strong>
      </span>
    </div>
  )
}

/* ============================================================ */
/*  Legacy NarrativeCard - kept only for backward compatibility   */
/*  if anything else still references it. New page uses SiteBanner.*/
/* ============================================================ */

function NarrativeCard({ siteName, summary }) {
  if (!summary) return null
  return (
    <section style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '16px 22px',
      background: 'rgba(232, 114, 92, 0.04)',
      border: '1px solid rgba(232, 114, 92, 0.18)',
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: 999,
          background: 'var(--color-nza-coral)',
          color: 'var(--color-nza-cream)',
          fontFamily: 'var(--font-heading)',
          fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
        }}>{summary.type}</span>
        <span style={{
          fontFamily: 'var(--font-site)',
          fontSize: 18, fontWeight: 500,
          color: TEXT_BODY,
        }}>{siteName}</span>
      </div>

      <p style={{
        margin: 0,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: TEXT_BODY,
        maxWidth: 880,
      }}>{summary.summary}</p>

      {summary.facts && summary.facts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {summary.facts.map((f, i) => (
            <span key={i} style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(26,36,64,0.05)',
              border: '1px solid rgba(26,36,64,0.10)',
              color: TEXT_BODY,
              fontFamily: 'var(--font-body)',
              fontSize: 11, fontWeight: 500,
            }}>{f}</span>
          ))}
        </div>
      )}
    </section>
  )
}

/* ============================================================ */
/*  Brief 24.5 Part 2h - Status legend                            */
/* ============================================================ */

/* Inline legend below the table explaining the green/amber/red dots.
   Sits as a subtle subscript so it earns its keep without claiming
   page weight. */
function StatusLegend() {
  const items = [
    { tone: READINESS_COLOUR.green, label: 'Current', detail: 'data within 30 days · 12 months covered' },
    { tone: READINESS_COLOUR.amber, label: 'Stale',   detail: 'partial coverage or aged 30–90 days' },
    { tone: READINESS_COLOUR.red,   label: 'Missing', detail: 'no recent reading · gap > 90 days' },
  ]
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18,
      paddingTop: 12,
      borderTop: `1px solid ${RULE}`,
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      color: TEXT_MUTED,
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10, fontWeight: 600,
        letterSpacing: 1, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>Status</span>
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: it.tone, flex: '0 0 8px',
          }} />
          <strong style={{ color: TEXT_BODY, fontWeight: 600 }}>{it.label}</strong>
          <span>· {it.detail}</span>
        </span>
      ))}
    </div>
  )
}
