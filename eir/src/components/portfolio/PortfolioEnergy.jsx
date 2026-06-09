import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'

import portfolio from '@pipeline-data/portfolio.json'
import sites from '@pipeline-data/sites.json'
import reconciliation from '@pipeline-data/reconciliation.json'
import mpanRegister from '@pipeline-data/mpan_register.json'
import sycous from '@pipeline-data/sycous.json'
import capacityPv from '@pipeline-data/capacity_pv.json'   /* Brief 19 ECPR/strategy */
import MeteringSankey from './MeteringSankey.jsx'           /* Brief 21 - Sankey replaces the bar chart on the Metering sub-tab */
import ScrollFadePane from '../../lib/ScrollFadePane.jsx'

/**
 * PortfolioEnergy - first thematic Portfolio page (Brief 17 + 17.5).
 *
 * Layout: 4 sub-tabs + 2-pane body (narrative LEFT, graphic RIGHT).
 *   /portfolio/energy[/consumption]  → Sub-tab 1
 *   /portfolio/energy/heating        → Sub-tab 2
 *   /portfolio/energy/power          → Sub-tab 3
 *   /portfolio/energy/metering       → Sub-tab 4
 *
 * GRESB FY25 scope: 11 in-scope sites (Sonning Common + Edwalton out).
 * Source of truth: portfolio.portfolio_inscope.site_ids +
 * portfolio.gresb_out_of_scope_site_ids. Consumption chart v2
 * (Brief 17.5 Part 3) shows ALL 13 sites with out-of-scope muted to
 * 0.4 opacity by default; one top-of-chart pill toggles them between
 * muted and hidden entirely.
 */

const SUB_TABS = [
  { key: 'consumption', label: 'Consumption' },
  { key: 'heating',     label: 'Heating strategy' },
  { key: 'power',       label: 'Power strategy' },
  { key: 'metering',    label: 'Metering' },
]
const DEFAULT_SUB_TAB = 'consumption'

const IN_SCOPE_IDS = portfolio.portfolio_inscope?.site_ids || []
const OUT_OF_SCOPE_IDS = portfolio.gresb_out_of_scope_site_ids || []
const IN_SCOPE_SET = new Set(IN_SCOPE_IDS)

/* Brief 17.5 Part 1 - palette tokens bound to existing Map view colours
   (--metric-electricity = #E8C547, --metric-gas = #D85F4D). Resident
   sub-metered uses lighter shades of the same family; resident
   arbnco-estimated paints with the base hex + a hatched SVG <pattern>
   fill so the "derived, methodology unpublished" provenance is
   encoded visually. No new hex declared here - sourced live from
   :root via getComputedStyle when needed for SVG <pattern> children. */
const COLOR_LL_ELEC          = 'var(--color-energy-elec-landlord)'             /* #E8C547 */
const COLOR_LL_GAS           = 'var(--color-energy-gas-landlord)'              /* #D85F4D */
const COLOR_RES_ELEC_SUB     = 'var(--color-energy-elec-resident-submetered)'  /* #F4E08E */
const COLOR_RES_HEAT_SUB     = 'var(--color-energy-gas-resident-submetered)'   /* #E89A8E */
const COLOR_RES_ELEC_ARBNCO  = 'var(--color-energy-elec-resident-estimated)'   /* base yellow + <pattern> hatch */

function navigate(to) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function fmtGwh(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  const g = n / 1e6
  return g >= 10 ? g.toFixed(1) : g.toFixed(2)
}
function fmtKwhCompact(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} GWh`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} MWh`
  return `${Math.round(n)} kWh`
}

export default function PortfolioEnergy({ subSubTab }) {
  const active = subSubTab && SUB_TABS.some((t) => t.key === subSubTab) ? subSubTab : DEFAULT_SUB_TAB
  useEffect(() => {
    if (subSubTab && !SUB_TABS.some((t) => t.key === subSubTab)) {
      window.history.replaceState({}, '', '/portfolio/energy')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [subSubTab])

  return (
    /* Brief 17.5 Part 1 - outer page entry fade (0.3s opacity-only) per
       EOC reference Pattern 1 (docs/audit/17.5_references/06_framer_motion.md).
       Paints over the dark body bg so there's no white flash on entry
       from another Portfolio sub-tab. */
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="thematic-page-outer"
      style={{ height: '100%' }}
    >
      <div
        className="thematic-page-container"
        style={{
          /* Rule 11.x foundation handles max-width, margin auto,
             box-sizing, padding-left, padding-right. Energy layers on
             flex sizing + bottom breathing + 24px gap between the
             tertiary strip and the toggle/pane stack. */
          flex: 1, display: 'flex', flexDirection: 'column',
          minHeight: 0,
          gap: 24,
          paddingBottom: 48,
        }}
      >
        {/* Tertiary sub-tab strip - Brief 19.5 Pattern A (underline).
            Strip stays 32px tall (Rule 11). Inactive tabs are text-only
            in muted-grey; active tab gets coral text + 2px coral
            underline. No pill backgrounds. Gap 28px between tabs per
            brief. The marginLeft: -12 nudge from the prior pill
            treatment is dropped - with zero horizontal padding on each
            button, the first tab's text now sits flush at the
            container's left edge, naturally inheriting the alignment
            grid established in Brief 17.5.3. */}
        <div role="tablist" aria-label="Energy sub-sections" style={{
          height: 32, flexShrink: 0,
          display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {SUB_TABS.map((t) => {
            const isActive = t.key === active
            return (
              <button
                key={t.key} type="button" role="tab" aria-selected={isActive}
                onClick={() => navigate(`/portfolio/energy/${t.key}`)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-theme-body)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-muted-on-dark)'
                }}
                style={{
                  /* Text-only - no pill background, no border-radius.
                     Bottom padding 4 + 2px underline = 6px below
                     baseline, matching the strip's vertical rhythm.
                     Inactive border-bottom is transparent so layout
                     doesn't shift when state flips. */
                  padding: '6px 0 4px 0',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--color-nza-coral)'
                    : '2px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--color-nza-coral)' : 'var(--text-muted-on-dark)',
                  /* Chris ask 4 Jun: tertiary type must read lighter than
                     the secondary above. Drop size --text-body-small (13.29)
                     → --text-caption (11.87) so it matches the secondary
                     nav's size; drop weight 500 (medium) → 400 (Stolzl
                     Book) so it reads one step lighter than the medium
                     secondary. Coral active state still cues the
                     selection clearly. */
                  fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)', fontWeight: 400,
                  letterSpacing: 0.2, cursor: 'pointer',
                  transition: 'color 180ms var(--ease-standard), border-color 180ms var(--ease-standard)',
                }}
              >{t.label}</button>
            )
          })}
        </div>

        {/* 2-pane body - Amendment 1 Part 6 fade-and-grow on sub-tab swap.
            Brief 17.5.2 Part 2: narrative-pane band 400-520 (fit test on
            Consumption picks 500px); gutter 48; graphic fills remainder. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: 'grid',
              /* Rule 11 - narrative sits in the 400–520 band, per-sub-tab
                 widths permitted ("Different sub-tabs within the same
                 page may sit at different widths - intentional").
                 Power Strategy takes the floor (400 px) so the 8-column
                 table can use the full 832 px graphic pane.
                 Chris ask 4 Jun: "make the table wider so we don't have
                 to scroll there, and make the text column narrower". */
              /* Per-sub-tab narrative-pane widths (Rule 11 fit test):
                 - Power: 400 (table needs the full graphic pane)
                 - Metering: 360 (Brief 21 follow-up - Chris asked for narrower
                   narrative + wider Sankey so labels stop clipping; Sankey then
                   has ~872 px on the right vs 732 with the default 500 narrative)
                 - All other sub-tabs: 400–500 fit-tested band */
              gridTemplateColumns:
                active === 'power'    ? '400px minmax(0, 1fr)' :
                active === 'metering' ? '360px minmax(0, 1fr)' :
                                        'minmax(400px, 500px) minmax(0, 1fr)',
              gap: 48,
              flex: 1, minHeight: 0, minWidth: 0,
            }}
          >
            {active === 'consumption' && <ConsumptionPanes />}
            {active === 'heating'     && <HeatingPanes />}
            {active === 'power'       && <PowerPanes />}
            {active === 'metering'    && <MeteringPanes />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ============================================================
   Sub-tab 1 - Consumption (Brief 24.8 Part 2 - rewrite)
   ============================================================

   Brief 24.8 replaces the Brief 17.5 Amendment 1 6-toggle row + 5-
   segment additive stack with a 3-view RADIO filter model:

     [ Total ]  [ Landlord ]  [ Resident ]
                              └─ [ All ] [ Sycous ] [ arbnco ]

   The previous chart was a real data-integrity bug: at bulk-metered
   sites it stacked the Ecotricity bulk meter (the WHOLE site supply)
   on top of the Sycous sub-meters (which sit physically downstream of
   the bulk meter) - counting the same kWh twice, inflating portfolio
   totals 2-4x at those sites. Brief 24.8 Part 1 fixed the pipeline
   methodology; Part 2 (this code) reads from the new fields and
   exposes the three views as a filter rather than an additive stack.

   View semantics, read from `reconciliation.by_site[sid]`:

     Total     → bar = total_site_kwh.{gas, electricity}
                 (Ecotricity bulk at bulk sites; Eco + arbnco at DNO/BNO)
     Landlord  → bar = landlord_kwh.{gas, electricity}
                 (measured at DNO/BNO; derived bulk-minus-Sycous at
                  bulk+Sycous; TBC at Millfield/Millbrook/Blendworth)
     Resident  → bar = resident_kwh.{gas, electricity}
                 (Sycous-measured at bulk+Sycous; arbnco-derived at
                  DNO; TBC at the same three sites)

   Sub-filter (Resident view only): `All` shows every resident bar
   regardless of source; `Sycous` greys out sites that have no Sycous-
   measured data; `arbnco` greys out sites that have no arbnco-derived
   data. Greyed-out sites stay in the leaderboard with their tick
   visible but no bar drawn - the filter behaviour is honest about
   "this site isn't in scope for this lens" without hiding it.

   TBC sites (Millfield, Millbrook, Blendworth in CY25) get a thin
   striped grey bar at the chart baseline in Landlord and Resident
   views, with hover tooltip explaining the data-quality reason. Total
   view shows them with normal bars (the bulk meter total is trusted
   even when the split isn't derivable).

   Per-bar fill convention:
     - Measured (Ecotricity, Sycous direct): SOLID fill
     - Derived (bulk-minus-Sycous landlord, arbnco-derived resident):
       diagonal-stripe pattern fill
     - TBC: separate thin striped grey bar at baseline
   Source markers in the legend explain the convention per view.

   Motion: chart key on `${view}-${residentSource}` force-remounts
   Recharts on filter change, triggering native bar entrance animation
   (500ms, 50ms gas/elec stagger). Site-name ticks animate their x via
   framer-motion (matches the prior chart's behaviour). Headline strip
   above the chart updates per view via outer fade.
*/

const COLOR_GAS_SOLID  = 'var(--metric-gas)'
const COLOR_ELEC_SOLID = 'var(--metric-electricity)'
const COLOR_ELEC_DERIVED_URL = 'url(#derived-elec-stripe)'
const COLOR_TBC_URL          = 'url(#tbc-stripe)'

/* TBC bar visual height as a fraction of the highest DATA-row total
   in the current view. 2.5% (Part 4 polish - bumped from 1.8% so the
   bar is more clearly visible against the chart baseline; brief asks
   for "~8 px tall" which at a 460 px chart height equates to ~1.7%
   minimum, but a touch more weight reads better at smaller screens).
   Falls back to a fixed kWh if no DATA rows exist (edge case). */
const TBC_BAR_PCT = 0.025
const TBC_BAR_FALLBACK_KWH = 30000

/* Headline strip helper: pull the methodology_v2 summary safely with
   a defensive fallback so the page doesn't blank if the field is
   missing (older JSON shipped without Brief 24.8). */
function getMethodology() {
  return reconciliation.portfolio?.methodology_v2 || {
    total_kwh: { electricity: 0, gas: 0, total: 0 },
    landlord_kwh: { electricity: 0, gas: 0, total: 0 },
    resident_kwh: { electricity: 0, gas: 0, total: 0, by_source: { sycous_measured_elec: 0, arbnco_derived_elec: 0 } },
    sites_with_full_data: 0,
    sites_with_tbc: [],
    in_scope_count: 0,
  }
}

function ConsumptionPanes() {
  /* Build per-in-scope-site rows from the Brief 24.8 methodology
     fields. Each row carries all three views' raw values plus their
     source flags; the active view's predicate is applied per render
     to produce bar heights + fill choices. */
  const rows = useMemo(() => {
    return IN_SCOPE_IDS.map((sid) => {
      const rec = reconciliation.by_site?.[sid] || {}
      const tot = rec.total_site_kwh || {}
      const ll = rec.landlord_kwh || {}
      const res = rec.resident_kwh || {}
      const src = rec.resident_kwh_by_source || {}
      return {
        site_id: sid,
        site_name: sites[sid]?.display_name || sid,
        in_scope: true,
        arrangement: src.arrangement || 'unclassified',

        /* Total view */
        total_gas:  tot.gas ?? 0,
        total_elec: tot.electricity ?? 0,
        total_all:  tot.total ?? 0,

        /* Landlord view */
        landlord_gas:        ll.gas ?? 0,
        landlord_elec:       ll.electricity,  /* null at TBC sites */
        landlord_source:     ll.source,       /* 'measured' | 'derived' | 'TBC' */
        landlord_tbc_reason: ll.tbc_reason,

        /* Resident view */
        resident_gas:        res.gas ?? 0,
        resident_elec:       res.electricity, /* null at TBC sites */
        resident_source:     res.source,      /* 'measured' | 'derived' | 'mixed' | 'TBC' */
        resident_tbc_reason: res.tbc_reason,

        data_quality_flag: rec.data_quality_flag,
      }
    })
  }, [])

  /* ----- Filter state -----
     view: 'total' | 'landlord' | 'resident'
     residentSource: 'all' | 'sycous' | 'arbnco' (only when view === 'resident')
  */
  const [view, setView] = useState('total')
  const [residentSource, setResidentSource] = useState('all')

  /* ----- Per-view derived row state -----
     For each row, classify its state in the active view:
       'data'   → real bar (gas + elec segments)
       'tbc'    → thin striped grey bar at baseline
       'greyed' → no bar, tick rendered greyed-out, tooltip explains
                  the filter excludes this site
     Then sort: data rows by descending total; greyed rows next;
     TBC rows last. Sort happens within each state group.
  */
  const classifiedRows = useMemo(() => {
    function classify(r) {
      if (view === 'total') {
        /* Total view is trusted at every in-scope site - bulk meter is
           the source of truth even when the split isn't derivable. */
        return {
          state: 'data',
          gas: r.total_gas,
          elec: r.total_elec,
          source: 'measured',
          total: (r.total_gas || 0) + (r.total_elec || 0),
        }
      }
      if (view === 'landlord') {
        if (r.landlord_source === 'TBC') {
          return { state: 'tbc', gas: 0, elec: 0, source: 'TBC', total: 0, reason: r.landlord_tbc_reason }
        }
        return {
          state: 'data',
          gas: r.landlord_gas || 0,
          elec: r.landlord_elec || 0,
          source: r.landlord_source, /* 'measured' or 'derived' */
          total: (r.landlord_gas || 0) + (r.landlord_elec || 0),
        }
      }
      /* view === 'resident' */
      if (r.resident_source === 'TBC') {
        return { state: 'tbc', gas: 0, elec: 0, source: 'TBC', total: 0, reason: r.resident_tbc_reason }
      }
      /* Sub-filter by Sycous / arbnco. measured = Sycous; derived =
         arbnco-derived. mixed could be either; we keep mixed sites
         visible under either sub-filter. */
      if (residentSource === 'sycous' && r.resident_source === 'derived') {
        return { state: 'greyed', gas: 0, elec: 0, source: r.resident_source, total: 0,
                 reason: 'No Sycous coverage at this site (residents on individual MPANs with their own suppliers).' }
      }
      if (residentSource === 'arbnco' && r.resident_source === 'measured') {
        return { state: 'greyed', gas: 0, elec: 0, source: r.resident_source, total: 0,
                 reason: 'No arbnco-derived resident data at this site (bulk-metered with direct Sycous sub-metering instead).' }
      }
      return {
        state: 'data',
        gas: r.resident_gas || 0,
        elec: r.resident_elec || 0,
        source: r.resident_source, /* 'measured' | 'derived' | 'mixed' */
        total: (r.resident_gas || 0) + (r.resident_elec || 0),
      }
    }

    const enriched = rows.map((r) => ({ ...r, ...classify(r) }))

    /* TBC bar visual height = small fraction of the tallest DATA bar
       in the current view. Recomputed per view so the proportion
       stays right when the Y-axis scale changes. */
    const dataMax = Math.max(0, ...enriched.filter((r) => r.state === 'data').map((r) => r.total))
    const tbcHeight = dataMax > 0 ? dataMax * TBC_BAR_PCT : TBC_BAR_FALLBACK_KWH

    /* Final per-row dataKeys for Recharts. */
    const final = enriched.map((r) => ({
      ...r,
      bar_gas:  r.state === 'data' ? (r.gas || 0)  : 0,
      bar_elec: r.state === 'data' ? (r.elec || 0) : 0,
      bar_tbc:  r.state === 'tbc'  ? tbcHeight     : 0,
    }))

    /* Sort: data > greyed > tbc; within each group, descending by total. */
    const order = { data: 0, greyed: 1, tbc: 2 }
    final.sort((a, b) => {
      const d = order[a.state] - order[b.state]
      if (d !== 0) return d
      return (b.total || 0) - (a.total || 0)
    })

    return final
  }, [rows, view, residentSource])

  /* ----- Headline strip per view -----
     Three big-number tiles. Values pulled from the methodology_v2
     portfolio block so chart bars and headline numbers always match. */
  const methodology = getMethodology()
  const headlineTiles = useMemo(() => {
    const m = methodology
    if (view === 'total') {
      return [
        { label: 'Portfolio total', value: `${fmtGwh(m.total_kwh.total)} GWh`, sub: `${m.in_scope_count} sites · CY25` },
        { label: 'Electricity',     value: `${fmtGwh(m.total_kwh.electricity)} GWh` },
        { label: 'Gas',             value: `${fmtGwh(m.total_kwh.gas)} GWh` },
      ]
    }
    if (view === 'landlord') {
      const fullCount = m.sites_with_full_data
      const tbcCount = m.sites_with_tbc.length
      return [
        { label: 'Landlord total',       value: `${fmtGwh(m.landlord_kwh.total)} GWh`, sub: `${fullCount} sites · ${tbcCount} pending` },
        { label: 'Landlord electricity', value: `${fmtGwh(m.landlord_kwh.electricity)} GWh` },
        { label: 'Landlord gas',         value: `${fmtGwh(m.landlord_kwh.gas)} GWh` },
      ]
    }
    /* view === 'resident' */
    const sycousGwh = m.resident_kwh.by_source.sycous_measured_elec
    const arbncoGwh = m.resident_kwh.by_source.arbnco_derived_elec
    if (residentSource === 'sycous') {
      return [
        { label: 'Sycous-measured', value: `${fmtGwh(sycousGwh)} GWh`, sub: 'directly measured electricity' },
      ]
    }
    if (residentSource === 'arbnco') {
      return [
        { label: 'arbnco-derived', value: `${fmtGwh(arbncoGwh)} GWh`, sub: 'estimated by subtraction' },
      ]
    }
    return [
      { label: 'Resident total',  value: `${fmtGwh(m.resident_kwh.total)} GWh`, sub: `${m.sites_with_tbc.length} sites pending` },
      { label: 'Sycous-measured', value: `${fmtGwh(sycousGwh)} GWh` },
      { label: 'arbnco-derived',  value: `${fmtGwh(arbncoGwh)} GWh` },
    ]
  }, [view, residentSource, methodology])

  /* ----- Narrative tokens (read from methodology_v2 so the prose
     tokens stay live regardless of which view is active). The
     surrounding prose is unchanged here - Brief 24.8 Part 5 rewrites
     the prose itself to match the corrected figures. ----- */
  const inScopeTotals = { total: methodology.total_kwh.total }
  const t_elec_total = methodology.total_kwh.electricity
  const t_gas_total  = methodology.total_kwh.gas
  const t_landlord   = methodology.landlord_kwh.total
  const t_resident   = methodology.resident_kwh.total
  const t_resident_submetered = methodology.resident_kwh.by_source.sycous_measured_elec
  const t_resident_arbnco     = methodology.resident_kwh.by_source.arbnco_derived_elec
  const gas_share_pct = t_landlord ? Math.round((methodology.landlord_kwh.gas / t_landlord) * 100) : 0
  const gas_site_count = rows.filter((r) => r.total_gas > 0).length
  const submetered_pct_of_resident = t_resident
    ? Math.round((t_resident_submetered / (t_resident_submetered + t_resident_arbnco)) * 100) : 0
  const top5_pct = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.total_all - a.total_all)
    const top5 = sorted.slice(0, 5).reduce((s, r) => s + r.total_all, 0)
    return methodology.total_kwh.total ? Math.round((top5 / methodology.total_kwh.total) * 100) : 0
  }, [rows, methodology.total_kwh.total])

  /* ----- Fill choice per row's bar segment.
     - Gas always solid (landlord_gas / total_gas always measured).
     - Electricity solid when source='measured'; striped when 'derived'.
     - 'mixed' rendered as solid (visually equivalent to measured;
       could be split in a future iteration). */
  function fillForGas(_row) {
    return COLOR_GAS_SOLID
  }
  function fillForElec(row) {
    if (row.source === 'derived') return COLOR_ELEC_DERIVED_URL
    return COLOR_ELEC_SOLID
  }

  return (
    <>
      <NarrativePane>
        {/* Brief 24.8 Part 5 - Consumption prose rewrite. Figures now
            reference the methodology_v2 portfolio block (Brief 24.8
            Part 1 corrected the bulk-site double-counting bug). The
            tokens were already wired in Part 2; this rewrite aligns
            the surrounding prose to the corrected figures + adds
            honest TBC framing for the three sites with pending splits
            (Millbrook, Millfield, Blendworth). Headers stay as the
            plain noun phrases Brief 24.7 established. */}
        <NarrativePara title="What Westbrook used in CY2025.">
          Westbrook Academies Trust operates 13 retirement villages. 2 are out of scope for this GRESB reporting cycle - one is the head office (Edwalton) and the other only became operational in 2026 (Sonning Common, still under construction). Across the remaining 11 sites in CY2025, Westbrook used{' '}
          <Token>{fmtGwh(inScopeTotals.total)} GWh</Token> of energy - split as{' '}
          <Token>{fmtGwh(t_elec_total)} GWh</Token> of electricity and{' '}
          <Token>{fmtGwh(t_gas_total)} GWh</Token> of gas. Gas accounts for{' '}
          <Token>{gas_share_pct}%</Token> of the landlord total by volume but is concentrated at just{' '}
          <Token>{gas_site_count} sites</Token>; the rest run entirely on electricity.
        </NarrativePara>

        <NarrativePara title="Why some sites use much more than others.">
          Five sites carry roughly <Token>{top5_pct}%</Token> of the total energy - Gifford Lea, Austin Heath, Ledian Gardens, Elderswell, and Durrants Village. The first four run gas-fired heating in some form: Gifford Lea and Austin Heath via central combined heat and power (CHP) plants serving every home from one source, Ledian Gardens via a mix of gas heat network and air-source heat pumps (ASHP) across its three phases, Elderswell via a heat network at its village centre with individual heat pumps in apartments. Durrants Village is the outlier - electricity-only throughout - but it supports a large resident base which lifts its total close to the heat-network sites'. Bramshott Place, with individual gas boilers in each home, sits just below the top five.
        </NarrativePara>

        <NarrativePara continuation>
          The sites without gas-fired communal heating run electricity-only and consume far less - typically half or less of the heat-network sites' totals - even when they support similar resident numbers.
        </NarrativePara>

        <NarrativePara title="Landlord vs resident energy.">
          The portfolio figure splits into two distinct categories worth being precise about.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Landlord energy</strong> is the energy on Westbrook's commercial contracts with Ecotricity - covering communal lighting, lifts, plant rooms, and the gas supplies into the heat networks. Across 8 of the 11 sites where the split is measurable this totals{' '}
          <Token>{fmtGwh(t_landlord)} GWh</Token> in CY25. Westbrook is invoiced for this directly, but the cost is recharged to residents proportionally through the service charge. Where a home is vacant, the DevCo absorbs that share of the bill until a new resident takes over.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Resident energy</strong> is what people use directly in their homes -{' '}
          <Token>{fmtGwh(t_resident)} GWh</Token> across the 8 sites with a measurable split. How Westbrook sees this depends on the site's design:
        </NarrativePara>

        <NarrativePara continuation>
          At <strong>bulk-metered sites with Sycous coverage</strong> (Austin Heath, Gifford Lea, Ampfield Meadows), the resident electricity flows through Westbrook's commercial supply and is sub-metered apartment-by-apartment by Sycous -{' '}
          <Token>{fmtGwh(t_resident_submetered)} GWh</Token> directly measured. At <strong>standard residential sites</strong> (Bramshott Place, Durrants Village, Great Alne Park, Elderswell, Ledian Gardens), each resident has their own meter and their own supplier. Westbrook never sees this directly. The figure shown -{' '}
          <Token>{fmtGwh(t_resident_arbnco)} GWh</Token> - is <em>derived</em> by taking the total flowing into the site (from arbnco) and subtracting Westbrook's known landlord consumption. The arbnco methodology hasn't been published to NZA.
        </NarrativePara>

        <NarrativePara continuation>
          Three sites currently show TBC on the landlord/resident split. <strong>Millbrook Village</strong> is bulk-metered with no Sycous sub-metering deployed - NZA is working with Westbrook to deploy coverage. <strong>Millfield Green</strong>'s Sycous readings exceed the bulk meter total, which is physically impossible if both measure electricity - NZA is investigating with Westbrook and Sycous to resolve the data anomaly. <strong>Blendworth Hills</strong> has Sycous deployed but the sub-meters currently read zero across the site. Their site totals are reliable (the bulk meter tells us what flowed in); only the split between landlord and resident is pending.
        </NarrativePara>

        <NarrativePara continuation>
          <Token>{submetered_pct_of_resident}%</Token> of the resident figure is directly measured. The rest is derived. Worth being honest about that distinction when reading site-level numbers.
        </NarrativePara>
      </NarrativePane>

      <GraphicPane>
        {/* Headline strip: 3 (or 1) big-number tiles above the chart.
            Updates per view. Outer fade keyed on view+source so the
            tile content swaps cleanly when the filter changes. */}
        <HeadlineStrip tiles={headlineTiles} fadeKey={`${view}-${residentSource}`} />

        {/* Primary filter pill row: Total / Landlord / Resident.
            Radio-style (single-active). Sub-row appears beneath when
            Resident is active. Both rows together occupy ~64 px of
            vertical real-estate (matches the prior toggle-row footprint
            within Rule 11's vertical rhythm). */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ViewPillRow view={view} setView={setView} />
          <AnimatePresence initial={false}>
            {view === 'resident' && (
              <motion.div
                key="resident-sub-row"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <ResidentSubPillRow source={residentSource} setSource={setResidentSource} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chart canvas. Filter changes force-remount via the key prop
            so Recharts replays its native bar entrance animation
            (500 ms, 50 ms stagger). Bottom margin tightened from 84
            to 70 (rotated 10 px labels fit in ~50-58 px). */}
        <div style={{ flex: 1, minHeight: 280, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={`${view}-${residentSource}`}
              data={classifiedRows}
              margin={{ top: 4, right: 12, bottom: 70, left: 4 }}
            >
              <defs>
                {/* Derived-electricity stripe pattern. Solid measured
                    bars use --metric-electricity (rich amber-gold);
                    derived bars use the same base with white diagonals
                    so the "derived = lifted off" reading carries
                    through. 7 px pitch, 1.5 px weight - same recipe as
                    the Brief 17.5 arbnco hatch (kept on-brand). */}
                <pattern id="derived-elec-stripe" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
                  <rect width="7" height="7" fill="var(--metric-electricity)" />
                  <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                </pattern>
                {/* TBC pattern - cooler grey base with white diagonals.
                    Reads as "pending" rather than "data": absence of
                    colour family, presence of structure. */}
                <pattern id="tbc-stripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="rgba(255,255,255,0.14)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                </pattern>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="site_id"
                type="category"
                interval={0}
                tickLine={false} axisLine={false}
                height={70}
                tick={<SiteIconTick rows={classifiedRows} />}
              />
              <YAxis
                type="number"
                /* Clamp the Y domain to the next 500k above dataMax so
                   the tallest bar doesn't get wasted vertical space. */
                domain={[0, (dataMax) => Math.ceil(dataMax / 500000) * 500000]}
                tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v}
                tick={{ fontSize: 11, fill: 'var(--text-muted-on-dark)', fontFamily: "'Inter', system-ui, sans-serif" }}
                tickLine={false} axisLine={false}
                width={50}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const row = payload[0]?.payload
                  if (!row) return null
                  return (
                    <div style={{
                      background: 'var(--color-theme-base)',
                      border: '1px solid var(--rule-on-dark)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.3,
                      pointerEvents: 'none',
                      minWidth: 160, maxWidth: 280,
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-site)',
                        fontSize: 'var(--text-body)',
                        fontWeight: 500,
                        color: 'var(--color-nza-coral)',
                        marginBottom: 4,
                      }}>{row.site_name}</div>
                      {row.state === 'tbc' ? (
                        <>
                          <div style={{
                            fontSize: 'var(--text-body-small)',
                            color: 'var(--color-theme-body)',
                            fontWeight: 500,
                            marginBottom: 4,
                          }}>{view === 'landlord' ? 'Landlord' : 'Resident'} TBC</div>
                          <div style={{
                            fontSize: 'var(--text-caption)',
                            color: 'var(--text-muted-on-dark)',
                            lineHeight: 1.45,
                          }}>{row.reason}</div>
                        </>
                      ) : row.state === 'greyed' ? (
                        <div style={{
                          fontSize: 'var(--text-caption)',
                          color: 'var(--text-muted-on-dark)',
                          lineHeight: 1.45,
                        }}>{row.reason}</div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: 'var(--text-body-small)',
                            color: 'var(--color-theme-body)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{fmtKwhCompact(row.total)}</div>
                          {row.source === 'derived' && (
                            <div style={{
                              fontSize: 'var(--text-caption)',
                              color: 'var(--text-muted-on-dark)',
                              fontStyle: 'italic',
                              marginTop: 2,
                            }}>derived figure</div>
                          )}
                        </>
                      )}
                    </div>
                  )
                }}
              />

              {/* Gas segment - solid colour, no derived variant.
                  Rendered with per-row <Cell>s for fill (Resident view
                  has resident_gas = 0 so this Bar effectively only
                  paints in Total + Landlord views). */}
              <Bar
                dataKey="bar_gas"
                stackId="x"
                name="Gas"
                isAnimationActive
                animationBegin={0}
                animationDuration={500}
              >
                {classifiedRows.map((row) => (
                  <Cell key={`gas-${row.site_id}`} fill={fillForGas(row)} />
                ))}
              </Bar>

              {/* Electricity segment - per-row fill chooses solid vs
                  derived-stripe based on the row's source flag. */}
              <Bar
                dataKey="bar_elec"
                stackId="x"
                name="Electricity"
                isAnimationActive
                animationBegin={50}
                animationDuration={500}
              >
                {classifiedRows.map((row) => (
                  <Cell key={`elec-${row.site_id}`} fill={fillForElec(row)} />
                ))}
              </Bar>

              {/* TBC bar - thin striped grey at the chart baseline for
                  rows with state='tbc'. Rendered through the same
                  stackId so the TBC sites still occupy their X slot
                  but only paint this thin sliver. */}
              <Bar
                dataKey="bar_tbc"
                stackId="x"
                name="TBC"
                fill={COLOR_TBC_URL}
                isAnimationActive
                animationBegin={100}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend strip below the chart - source/measured convention. */}
        <ChartLegend view={view} residentSource={residentSource} />
      </GraphicPane>
    </>
  )
}

/* ============================================================
   Brief 24.8 Part 2 - Consumption chart helpers
   ============================================================ */

/* Headline strip: 3 big-number tiles above the chart. Outer fade
   keyed on view so the values swap cleanly when the filter changes. */
function HeadlineStrip({ tiles, fadeKey }) {
  return (
    <div style={{ flexShrink: 0, position: 'relative', height: 56 }}>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={fadeKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
            gap: 32,
            position: 'absolute', inset: 0,
          }}
        >
          {tiles.map((t, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-muted-on-dark)',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}>{t.label}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-section-title)',
                color: 'var(--color-nza-coral)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}>{t.value}</div>
              {t.sub && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-muted-on-dark)',
                }}>{t.sub}</div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* Primary view pill row: Total / Landlord / Resident. Radio-style
   (single-active). Active = NZA coral fill + white label; inactive =
   transparent surface + body colour + body-coloured border. */
const VIEW_OPTIONS = [
  { key: 'total',    label: 'Total' },
  { key: 'landlord', label: 'Landlord' },
  { key: 'resident', label: 'Resident' },
]

function ViewPillRow({ view, setView }) {
  return (
    <div role="radiogroup" aria-label="Consumption view"
         style={{ display: 'flex', gap: 8, height: 32, alignItems: 'center' }}>
      {VIEW_OPTIONS.map((opt) => {
        const active = view === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setView(opt.key)}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: active ? '1px solid var(--color-nza-coral)' : '1px solid var(--rule-on-dark)',
              background: active ? 'var(--color-nza-coral)' : 'transparent',
              color: active ? '#fff' : 'var(--color-theme-body)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body-small)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 180ms var(--ease-standard), color 180ms var(--ease-standard), border-color 180ms var(--ease-standard)',
            }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* Resident sub-row: All / Sycous / arbnco. Smaller pills (subservient
   to the primary row) but same colour grammar. */
const RES_SOURCE_OPTIONS = [
  { key: 'all',    label: 'All sources' },
  { key: 'sycous', label: 'Sycous · measured' },
  { key: 'arbnco', label: 'arbnco · derived' },
]

function ResidentSubPillRow({ source, setSource }) {
  return (
    <div role="radiogroup" aria-label="Resident data source"
         style={{ display: 'flex', gap: 6, height: 28, alignItems: 'center' }}>
      {RES_SOURCE_OPTIONS.map((opt) => {
        const active = source === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setSource(opt.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: active ? '1px solid var(--color-nza-coral)' : '1px solid var(--rule-on-dark)',
              background: active ? 'var(--color-nza-coral)' : 'transparent',
              color: active ? '#fff' : 'var(--color-theme-body)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-caption)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 180ms var(--ease-standard), color 180ms var(--ease-standard), border-color 180ms var(--ease-standard)',
            }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* Chart legend strip: explains the visual convention per view. Lives
   below the chart canvas, height 28 px, body-small typography. Brief
   24.8 Part 4 polish: prefix the row with a "Convention:" key so the
   solid-vs-striped reading is unmistakable on first scan. */
function ChartLegend({ view, residentSource }) {
  const items = []
  let conventionKey = null
  if (view === 'total') {
    items.push({ swatch: 'var(--metric-gas)',         label: 'Gas' })
    items.push({ swatch: 'var(--metric-electricity)', label: 'Electricity' })
  } else if (view === 'landlord') {
    conventionKey = 'Solid = measured · striped = derived'
    items.push({ swatch: 'var(--metric-gas)',         label: 'Gas · measured' })
    items.push({ swatch: 'var(--metric-electricity)', label: 'Electricity · measured' })
    items.push({ stripe: 'derived',                   label: 'Electricity · derived (bulk - Sycous)' })
    items.push({ stripe: 'tbc',                       label: 'TBC · pending sub-meter / anomaly' })
  } else {
    /* resident */
    conventionKey = 'Solid = measured · striped = derived'
    if (residentSource !== 'arbnco') {
      items.push({ swatch: 'var(--metric-electricity)', label: 'Sycous · measured' })
    }
    if (residentSource !== 'sycous') {
      items.push({ stripe: 'derived',                   label: 'arbnco · derived' })
    }
    items.push({ stripe: 'tbc',                         label: 'TBC · pending sub-meter / anomaly' })
  }
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
      minHeight: 28,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted-on-dark)',
    }}>
      {conventionKey && (
        <span style={{
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}>{conventionKey}</span>
      )}
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {it.swatch ? (
            <span aria-hidden style={{
              width: 12, height: 12, background: it.swatch, borderRadius: 2,
            }} />
          ) : it.stripe === 'derived' ? (
            <span aria-hidden style={{
              width: 12, height: 12, borderRadius: 2,
              background: 'repeating-linear-gradient(45deg, var(--metric-electricity), var(--metric-electricity) 2px, rgba(255,255,255,0.55) 2px, rgba(255,255,255,0.55) 4px)',
            }} />
          ) : (
            <span aria-hidden style={{
              width: 12, height: 12, borderRadius: 2,
              background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.14), rgba(255,255,255,0.14) 2px, rgba(255,255,255,0.35) 2px, rgba(255,255,255,0.35) 4px)',
            }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  )
}

/* ----- Amendment 1 Part 5: top-row toggle button + separator ----- */

function ToggleBtn({ label, active, onClick, glyph, svgGlyph, swatch, hatched, tone }) {
  /* Glyph badge (small square at the left of the button) styled by props:
       - `swatch`     → solid colour swatch (Gas/Electricity toggles)
       - `hatched`    → arbnco hatched fill (legacy - kept for callers)
       - `svgGlyph`   → small inline SVG (Resident toggle "person" icon)
       - `tone="oos"` → GRESB-26 dark token surface
       - default      → neutral surface with the glyph text */
  let badgeBg = 'rgba(255,255,255,0.05)'
  let badgeColor = 'var(--color-theme-body)'
  if (swatch) badgeBg = swatch
  else if (hatched) badgeBg = 'repeating-linear-gradient(45deg, var(--color-energy-elec-resident-submetered), var(--color-energy-elec-resident-submetered) 2px, rgba(255,255,255,0.55) 2px, rgba(255,255,255,0.55) 4px)'
  else if (tone === 'oos') { badgeBg = 'var(--color-gresb26-gas)'; badgeColor = 'var(--color-theme-body)' }

  /* Chris ask 2026-06-03: Resident toggle's "person" SVG glyph -
     small head + torso silhouette. Stroked in currentColor so it
     inherits the badge's text colour. */
  let svgContent = null
  if (svgGlyph === 'person') {
    svgContent = (
      <svg width="11" height="11" viewBox="0 0 18 18" aria-hidden style={{ display: 'block' }}>
        <circle cx="9" cy="6" r="2.6" fill="currentColor" />
        <path d="M 3.5 16 C 3.5 11.5 6 10 9 10 C 12 10 14.5 11.5 14.5 16 Z" fill="currentColor" />
      </svg>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px 4px 4px', borderRadius: 999,
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: `1px solid ${active ? 'var(--rule-on-dark)' : 'rgba(255,255,255,0.04)'}`,
        color: active ? 'var(--color-theme-body)' : 'rgba(255,255,255,0.45)',
        fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer', letterSpacing: 0.15,
        opacity: active ? 1 : 0.7,
        transition: 'background 180ms var(--ease-standard), color 180ms var(--ease-standard), opacity 180ms var(--ease-standard)',
      }}>
      <span aria-hidden style={{
        /* Icon glyph (LL / 26 / person) - fixed 9 px because it's a
           single-glyph icon, not text content. Documented exception
           to Brief 17.5.3 §"no font-size in component-local CSS." */
        width: 18, height: 18, borderRadius: '50%',
        background: badgeBg,
        color: badgeColor,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 600, lineHeight: 1, letterSpacing: 0,
        border: swatch || hatched || tone === 'oos' ? 'none' : '1px solid var(--rule-on-dark)',
        flex: '0 0 18px',
      }}>
        {svgContent /* SVG glyph (e.g. person) takes precedence */
          || (!swatch && !hatched ? glyph : '')}
      </span>
      {label}
    </button>
  )
}

/* SubChip - compact secondary toggle that appears under/beside a
   primary ToggleBtn (Chris ask 2026-06-03: Resident → Sycous|arbnco).
   Smaller and visually subservient - no full pill border, just a
   tiny swatch + label that lights up when active. */
function SubChip({ label, active, onClick, swatch, hatched }) {
  let badgeBg = swatch
  if (hatched) badgeBg = 'repeating-linear-gradient(45deg, var(--color-energy-elec-resident-submetered), var(--color-energy-elec-resident-submetered) 2px, rgba(255,255,255,0.55) 2px, rgba(255,255,255,0.55) 4px)'
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', borderRadius: 999,
        background: 'transparent', border: 'none',
        color: active ? 'var(--color-theme-body)' : 'rgba(255,255,255,0.35)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-caption)',
        cursor: 'pointer', letterSpacing: 0.1,
        opacity: active ? 1 : 0.6,
        transition: 'color 180ms var(--ease-standard), opacity 180ms var(--ease-standard)',
      }}>
      <span aria-hidden style={{
        width: 10, height: 10, borderRadius: 2,
        background: badgeBg,
        opacity: active ? 1 : 0.35,
        flex: '0 0 10px',
        display: 'inline-block',
      }} />
      {label}
    </button>
  )
}

function ToggleSep() {
  return (
    <span aria-hidden style={{
      display: 'inline-block', width: 1, height: 16, margin: '0 4px',
      background: 'var(--rule-on-dark)',
    }} />
  )
}

/* ----- Custom XAxis tick - site icon (mask-image) + Source Serif site name -----
   Audited per Brief 17.5 §Part 1 site-icon rule: every site mention across
   the tool renders icon + --font-site. The icon is rendered via a
   foreignObject containing an HTML <div> with mask-image (background-color
   = currentColor → inherits text fill from the row's colour). */

function SiteIconTick(props) {
  const { x, y, payload, rows } = props
  const sid = payload?.value
  const row = rows.find((r) => r.site_id === sid)
  if (!row) return null
  const iconUrl = `/sites/${sid}/icon.svg`
  const inScope = row.in_scope !== false
  /* Brief 24.8 Part 2: row.state may be 'data' | 'tbc' | 'greyed' for
     the new Consumption chart. Greyed = filter excludes the site; we
     reduce opacity heavily so the leaderboard slot stays visible but
     the site reads as out-of-filter. TBC stays full-opacity since the
     bar itself communicates "pending" via the striped grey treatment. */
  const greyedOut = row.state === 'greyed'
  /* Chris ask 2026-06-03: site-name ticks now SLIDE along with their
     bars when the sort changes (matches the Leaderboard's framer-
     motion `layout` behaviour on the Map view). Implementation:
     animate the transform attribute via motion.g with the current
     `x` from Recharts as the target - framer-motion tweens from the
     previous render's x to the new x. Same easing as the bar growth
     so they feel synchronised. */
  const opacity = greyedOut ? 0.35 : (inScope ? 1 : 0.7)
  const color = (greyedOut || !inScope) ? 'var(--text-muted-on-dark)' : 'var(--color-theme-body)'
  return (
    <motion.g
      initial={false}
      animate={{ x, y: y + 6 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ opacity, transition: 'opacity 150ms var(--ease-standard)' }}>
      <foreignObject x={-12} y={0} width={24} height={24}>
        <div style={{
          width: 24, height: 24,
          color,
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url(${iconUrl})`,
          maskImage: `url(${iconUrl})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }} />
      </foreignObject>
      {/* Brief 24.8 Part 4 polish - small coral dot at the top-right of
          the site icon when this site carries a data-quality flag.
          Visual hint that hovering will reveal pending-data context
          even when the bar itself doesn't render in the current view. */}
      {row.data_quality_flag && (
        <circle
          cx={10} cy={3} r={3}
          fill="var(--color-nza-coral)"
          opacity={0.85}
        />
      )}
      {/* Site name rotated -38° below the icon - 13 sites at ~50 px slots
          can't fit horizontal labels. Anchored "end" so the label trails
          back leftward from below its bar. Source Serif 4 per Brief 14. */}
      <text
        x={0} y={34}
        textAnchor="end"
        fontFamily="var(--font-site)"
        fontSize={10}
        fontWeight={500}
        fill={color}
        transform="rotate(-38)"
      >
        {row.site_name}
      </text>
    </motion.g>
  )
}

/* ============================================================
   Layout primitives + stub for Parts 3-5
   ============================================================ */

function NarrativePane({ children }) {
  /* Chris ask 2026-06-03 (stronger): bottom mask widened (96 px in
     index.css) so the fade is unmistakably visible. Floating chevron
     pulses down when the pane is scrollable AND user hasn't reached
     the bottom yet. Chevron auto-hides when content fits or when
     scrolled to the bottom. */
  const scrollRef = useRef(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function update() {
      const overflow = el.scrollHeight - el.clientHeight
      const distFromBottom = overflow - el.scrollTop
      /* Show when there's >24px of scrollable content remaining. */
      setShowHint(distFromBottom > 24)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    /* Re-evaluate when content size changes (sub-tab swap, narrative reflow). */
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])

  /* Chris ask 5 Jun r11: same conditional-mask fix as ScrollFadePane.
     The CSS class's 96 px bottom mask is now overridden inline to
     'none' when there's no overflow OR the user has scrolled to the
     bottom (i.e. showHint is false). Reads consistently with the
     gresb chapter's panes: fade + chevron appear and disappear
     together. */
  const maskValue = showHint
    ? 'linear-gradient(to bottom, black 0%, black calc(100% - 96px), transparent 100%)'
    : 'none'
  return (
    <div style={{ position: 'relative', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        ref={scrollRef}
        className="scroll-fade-y"
        style={{
          /* Brief 17.5.2 Part 4 - gap 48 between subsection blocks. */
          display: 'flex', flexDirection: 'column', gap: 48,
          overflowY: 'auto', minHeight: 0, flex: 1,
          WebkitMaskImage: maskValue, maskImage: maskValue,
        }}
      >{children}</div>
      {showHint && (
        <div className="scroll-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </div>
  )
}

function GraphicPane({ children }) {
  return (
    <div style={{
      /* Brief 17.5.2 Part 3 - gap 32 between toggle row and chart canvas
         (previously 10). Spec §"Gap from toggle row to chart canvas: 32px." */
      display: 'flex', flexDirection: 'column', gap: 32,
      minHeight: 0, minWidth: 0,
    }}>{children}</div>
  )
}

function NarrativePara({ title, children, continuation = false }) {
  return (
    /* Brief 17.5.2 Part 4 - subsection rhythm.
         continuation=true: this is a continuation paragraph within the
         previous subsection (no title). NarrativePane sets a 48px gap
         between siblings as the default subsection gap; continuation
         compensates with marginTop: -36 to net the 12px paragraph gap.
       Title: Source Serif 4 at 22px (sits in the 20-24 spec band) +
       1px coral underline 5px below baseline (4-6 spec window) + 16px
       gap from underline to body. Body: 15px Inter with 24px absolute
       line-height (spec §"Body text line-height: 24px"). */
    <div style={{ marginTop: continuation ? -36 : 0 }}>
      {title && (
        <h3 style={{
          /* Chris ask 2026-06-03: subsection title routed --font-site
             (Source Serif 4) → --font-display (DM Serif Display).
             EOC's editorial banner uses DM Serif Display; Source Serif
             4 was reading too "textbook humanist" for these banners.
             --font-site stays scoped to site display names. */
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-subsection-title)',
          fontWeight: 400,  /* DM Serif Display has only weight 400 - natural display weight */
          color: 'var(--color-nza-coral)',
          margin: '0 0 16px 0',
          paddingBottom: 5,
          borderBottom: '1px solid var(--color-nza-coral)',
          lineHeight: 'var(--text-subsection-title-lh)',
          letterSpacing: '-0.005em',
        }}>{title}</h3>
      )}
      <p style={{
        fontFamily: 'var(--font-body)',
        /* Chris ask 2026-06-03 (post-17.5.3): the narrative body
           read too big at --text-body (15.71 at 1920). Stepped down
           to --text-body-small (clamp 12-15, 13.29 at 1920) to match
           the Home page body size - same comfortable scale across
           the report. Subsection title above stays at --text-
           subsection-title (16-20), keeping the visual hierarchy
           one tier above body. */
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: 'var(--color-theme-body)',
        margin: 0,
      }}>{children}</p>
    </div>
  )
}

function Token({ children }) {
  return (
    <strong style={{ color: 'var(--color-nza-coral)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
      {children}
    </strong>
  )
}

/* Brief 24.7 - Coverage table on the Metering sub-tab.
   Minimal styling: no bordered cells, a faint row separator, the
   header row tinted with the existing Westbrook palette. */
function CoverageTable() {
  /* Chris ask 8 Jun: the table rendered as invisible navy-on-navy
     because every text colour was `var(--text-on-cream)` or
     `var(--color-theme-base)` - both cream-register dark-text tokens
     that resolve to ~the same hue as the dark page background.
     PortfolioEnergy runs on the dark register, so text needs the
     dark-register body colour (`--color-theme-body`, the cream tint
     used for body text on navy). Row separator switched from the dark
     rgba(26,36,64,0.06) to a light rgba(255,255,255,0.10) for the
     same reason. Header row tint bumped from coral 8% to coral 16%
     so it still reads as a band above the body text. */
  const rows = [
    { arrangement: 'Bulk-metered (5 sites)',       landlord: 'Full (Ecotricity invoiced)', resident: 'Full (Sycous sub-metered)',      reliability: 'Most reliable' },
    { arrangement: 'Private cable (2 sites)',      landlord: 'Full',                       resident: 'Where Sycous deployed',           reliability: 'Mixed' },
    { arrangement: 'Standard residential (4 sites)', landlord: 'Full',                     resident: <strong>Derived from arbnco</strong>, reliability: 'Plausible, not directly verifiable' },
  ]
  return (
    <div style={{
      marginTop: 8, width: '100%',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-caption)',
      color: 'var(--color-theme-body)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr 1.2fr',
        padding: '8px 10px',
        background: 'rgba(232, 114, 92, 0.16)',
        color: 'var(--color-nza-coral)',
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        fontSize: 10,
      }}>
        <span />
        <span>Landlord</span>
        <span>Resident</span>
        <span>How reliable</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr 1.2fr',
          padding: '10px',
          borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none',
          lineHeight: 1.4,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--color-theme-body)' }}>{r.arrangement}</span>
          <span>{r.landlord}</span>
          <span>{r.resident}</span>
          <span>{r.reliability}</span>
        </div>
      ))}
    </div>
  )
}

/* Brief 24.7 - Void callout on the Metering sub-tab.
   Subtle coral left border + slightly tinted background. The exact
   void figures (count + kWh) stay live via the props so the callout
   updates when the pipeline numbers change.
   Chris ask 8 Jun: text colour was `var(--text-on-cream)` (dark
   navy) which rendered invisible against the dark navy page. Swap to
   `--color-theme-body` (cream tint for dark-register body text) and
   bump the background tint from coral 5% to 8% so the callout still
   sits as a quiet block beneath the table without disappearing. */
function VoidCallout({ voidCount, voidKwh, voidKwhLabel }) {
  return (
    <div style={{
      marginTop: 8,
      padding: '14px 16px',
      background: 'rgba(232, 114, 92, 0.08)',
      borderLeft: '3px solid var(--color-nza-coral)',
      borderRadius: 4,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-body-small)',
      lineHeight: 1.5,
      color: 'var(--color-theme-body)',
    }}>
      Ecotricity classifies{' '}
      <Token>{voidCount} electricity meters</Token>{' '}
      as vacant but reports{' '}
      <Token>{voidKwhLabel}</Token>{' '}
      of consumption against them across CY25 - concentrated at Ledian Gardens, Bramshott Place, and Elderswell. Three possible explanations: billing classification error, equipment running in genuinely vacant homes, or estimated readings on an inactive meter. NZA is investigating as part of the ongoing site intelligence review.
    </div>
  )
}

function ScopeLine({ children }) {
  return (
    <em style={{
      display: 'block', marginTop: 4,
      /* Brief 17.5.3 Part 2 - caption-tier (clamp 11-13).
         Italic scope captions sit visually below body. */
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--text-caption-lh)',
      color: 'var(--text-muted-on-dark)', fontStyle: 'italic',
    }}>{children}</em>
  )
}

/* ============================================================
   Brief 18 - Heating strategy matrix
   ============================================================
   Inherits Rule 11 thematic-page grammar (narrative left,
   single graphic right). Replaces the stub 3-col category grid
   shipped in Brief 17 Amendment 2 with a 5-column matrix
   reading from `sites.heating_by_phase` (populated by
   pipeline/readers/build_heating_matrix.py - Brief 18 Part 1).

   Columns: VC P1 · Apt P1 · Apt P2 · Apt P3 · Apt P4
   Rows: 13 sites (11 in-scope + 2 OOS)
   Cells with adjacent identical (system, confidence) merge
   horizontally via grid-column: span N. Null systems render as
   dashed-empty (phase doesn't exist). TBC confidence renders as
   dashed coral (Elderswell VC P1). GRESB-26 OOS rows render
   their filled cells with a darker shade.
*/

const PHASE_SLOTS = ['vc_p1', 'apt_p1', 'apt_p2', 'apt_p3', 'apt_p4']
/* Two-line column headers per Chris ask 3 Jun - `category` on line 1,
   `phase` on line 2. Reads cleanly at any width without abbreviation. */
const PHASE_HEADERS = {
  vc_p1:  { category: 'Village centre', phase: 'Phase 1' },
  apt_p1: { category: 'Apartments',     phase: 'Phase 1' },
  apt_p2: { category: 'Apartments',     phase: 'Phase 2' },
  apt_p3: { category: 'Apartments',     phase: 'Phase 3' },
  apt_p4: { category: 'Apartments',     phase: 'Phase 4' },
}

/* Site display order - visual grouping by category for readability.
   In-scope first; OOS at the bottom. Order matches brief 18 §"The
   matrix data" table. */
const HEATING_ROW_ORDER = [
  'austin-heath', 'gifford-lea',
  'bramshott-place', 'ledian-gardens', 'elderswell',
  'durrants-village', 'millbrook-village', 'great-alne-park',
  'millfield-green', 'ampfield-meadows', 'blendworth-hills',
  'sonning-common', 'edwalton-office',
]

/* Palette per heating system. Filled cells use bg = color@22%,
   border = color@55%. Tokens reused from the existing palette where
   possible; Heat network (gas/ASHP) get distinct hex for legibility
   against CHP and Individual variants. */
const HEATING_SYSTEM_COLOR = {
  'CHP':                  'var(--metric-gas)',           /* #D85F4D coral-red - bulk gas plant */
  /* Chris ask 4 Jun: --metric-gas rotated to NZA deep red #B8443A -
     same hex this slot used to occupy. HN gas pushed one step deeper
     to #9C2F25 so the sibling distinction from CHP/landlord gas is
     preserved (CHP at #B8443A, HN gas at #9C2F25, GRESB-26 OOS at
     #7A2417 - three-step descending ladder). */
  'Heat network (gas)':   '#9C2F25',                     /* deeper red, distinct from CHP */
  'Heat network (ASHP)':  '#C8AA3A',                     /* deeper yellow, distinct from individual ASHP */
  'Individual gas':       '#E8A13C',                     /* amber - gas appliance per dwelling */
  'Individual ASHP':      'var(--metric-electricity)',   /* #E8C547 yellow */
  /* Chris ask 4 Jun: theme-waste rotated to teal, theme-carbon to green.
     GSHP repointed to --theme-carbon so the "ground-source green" semantic
     is preserved (the token name carries no meaning at this callsite -
     we're routing the visual green, not the carbon concept). */
  'Individual GSHP':      'var(--theme-carbon)',         /* #7CC470 ground-source green */
  'Mixed':                '#A896C4',                     /* lilac - distinct from Hybrid */
  'Hybrid':               'var(--theme-energy)',         /* #E5732A orange - gas+electric blend */
}

/* Compact pill label per system. Used inside each cell. */
const HEATING_SYSTEM_PILL = {
  'CHP':                  'Gas + CHP',
  'Heat network (gas)':   'Gas HN',
  'Heat network (ASHP)':  'ASHP HN',
  'Individual gas':       'Gas',
  'Individual ASHP':      'ASHP',
  'Individual GSHP':      'GSHP',
  'Mixed':                'Mixed',
  'Hybrid':               'Hybrid',
}

/* Fuel-type icon per system. Three icons across the eight systems -
   the meaningful axis is what fuel drives the heat. */
const HEATING_SYSTEM_ICON = {
  'CHP':                  '/icons/ivg-nza-icons_gas-solid.svg',          /* gas-driven CHP */
  'Heat network (gas)':   '/icons/ivg-nza-icons_gas-solid.svg',
  'Heat network (ASHP)':  '/icons/ivg-nza-icons_elec-solid.svg',
  'Individual gas':       '/icons/ivg-nza-icons_gas-solid.svg',
  'Individual ASHP':      '/icons/ivg-nza-icons_elec-solid.svg',
  'Individual GSHP':      '/icons/ivg-nza-icons_elec-solid.svg',  /* GSHP is electric-driven */
  'Mixed':                '/icons/ivg-nza-icons_hybrid.svg',
  'Hybrid':               '/icons/ivg-nza-icons_hybrid.svg',
}

/* Communal vs individual. Drives the cell border style:
     'communal'   -> dotted border (shared central plant - CHP, heat
                     network, site-level hybrid w/ pool/VC plant)
     'individual' -> solid border  (each dwelling has its own appliance)
   Dashed border styles stay reserved for TBC (coral) and null (grey). */
const HEATING_SYSTEM_KIND = {
  'CHP':                  'communal',
  'Heat network (gas)':   'communal',
  'Heat network (ASHP)':  'communal',
  'Individual gas':       'individual',
  'Individual ASHP':      'individual',
  'Individual GSHP':      'individual',
  'Mixed':                'individual',  /* ASHP + GSHP individual mix per dwelling */
  'Hybrid':               'communal',    /* Millbrook pool gas + VC ASHP plant */
}

/* RLE-merge adjacent cells with the same (system, confidence).
   Returns runs in column order, each with `span` (1-5) and `slots`
   (the cell ids it covers). */
function _mergeHeatingRow(cellsBySlot) {
  const runs = []
  for (const slot of PHASE_SLOTS) {
    const c = cellsBySlot[slot] || { system: null, confidence: null, note: null }
    const last = runs[runs.length - 1]
    if (
      last &&
      last.system === c.system &&
      last.confidence === c.confidence
    ) {
      last.span += 1
      last.slots.push(slot)
    } else {
      runs.push({
        system: c.system,
        confidence: c.confidence,
        note: c.note,
        span: 1,
        slots: [slot],
      })
    }
  }
  return runs
}

function HeatingPanes() {
  const rows = useMemo(() => {
    return HEATING_ROW_ORDER.map((sid) => {
      const site = sites[sid]
      const cells = site?.heating_by_phase || {}
      return {
        id: sid,
        site,
        runs: _mergeHeatingRow(cells),
        inScope: IN_SCOPE_SET.has(sid),
      }
    }).filter((r) => r.site)
  }, [])

  /* Summary tallies for narrative tokens. Counted from
     archetype.primary_heating since heating_by_phase per-row is
     more granular than the portfolio summary classes. */
  const tallies = useMemo(() => {
    const t = { chp: 0, gas: 0, hybrid: 0, ashp: 0, gshp: 0, mixed: 0 }
    rows.forEach((r) => {
      if (!r.inScope) return
      const ph = r.site?.archetype?.primary_heating || ''
      const lower = ph.toLowerCase()
      if (lower.includes('chp'))            t.chp += 1
      else if (lower.includes('hybrid'))    t.hybrid += 1
      else if (lower.includes('gshp'))      t.gshp += 1
      else if (lower.includes('ashp'))      t.ashp += 1
      else if (lower.includes('gas'))       t.gas += 1
      else if (lower.includes('mix'))       t.mixed += 1
    })
    return t
  }, [rows])

  return (
    <>
      <NarrativePane>
        {/* Brief 24.7 - Heating strategy prose rewrite. */}
        <NarrativePara title="How Westbrook heats its homes.">
          Westbrook Academies Trust has developed its sites across multiple years and design eras, with different heating strategies adopted as the portfolio grew. The result is a mixed picture across the 11 sites. Some sites have <strong>central plant</strong> - one large boiler or CHP unit serving every home via a heat network. Others give each home its own <strong>individual unit</strong> - a gas boiler, an air-source heat pump (ASHP), or a ground-source heat pump (GSHP). A few sites combine multiple strategies across different phases.
        </NarrativePara>

        <NarrativePara continuation>
          Across the 11 sites the count is:{' '}
          <Token>{tallies.chp} sites with CHP</Token>,{' '}
          <Token>{tallies.hybrid} hybrid</Token>,{' '}
          <Token>{tallies.ashp} sites on ASHP</Token>,{' '}
          <Token>{tallies.gshp} on GSHP</Token> - though several use different systems in different phases.
        </NarrativePara>

        <NarrativePara title="The sites with multiple strategies.">
          Four sites carry the complexity. Reading site by site:
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Bramshott Place</strong> uses individual gas boilers in its earliest phase (Village Centre + apartments), then switches to individual air-source heat pumps for Phases 2 through 4 - a within-portfolio decarbonisation story across one site.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Ledian Gardens</strong> spans three completely different strategies across its three phases: a gas heat network in Phase 1, individual ASHP in Phase 2, individual GSHP in Phase 3. No Phase 4.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Elderswell</strong> pairs a TBC village-centre arrangement with gas-boilered apartments through all four phases.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Millbrook Village</strong> runs a hybrid on every phase - pool gas plus village-centre ASHP plus individual apartment ASHP.
        </NarrativePara>

        <NarrativePara continuation>
          These four sites are also where the carbon arithmetic gets per-phase rather than per-site.
        </NarrativePara>

        <NarrativePara title="What's confirmed and what we're still checking.">
          One cell carries a TBC marker - <strong>Elderswell's village centre</strong>. As part of NZA's ongoing site intelligence review, we'll confirm exactly what's installed at each site. Every other phase on the 11 sites is confirmed.
        </NarrativePara>

        <NarrativePara continuation>
          Two sites sit at the bottom of the matrix at lower visual weight: Sonning Common (under construction; out of GRESB 26 scope) and Edwalton Office (the head office, not a village).
        </NarrativePara>
      </NarrativePane>

      <GraphicPane>
        <HeatingMatrix rows={rows} />
      </GraphicPane>
    </>
  )
}

/* The matrix itself - flex column of rows. Each row is its own inner
   grid (180px site label + 5 phase columns) so the whole row gets a
   click handler + hover/selected highlight. The grid template stays
   identical across header + body rows so columns align vertically. */
const HEATING_GRID_TEMPLATE = '180px repeat(5, minmax(0, 1fr))'

function HeatingMatrix({ rows }) {
  /* Chris ask 5 Jun r11: was using a bare .scroll-fade-y class with
     no overflow detection, so the bottom rows of the 13-site matrix
     were greyed out by the 96 px mask even when they fit. Switched
     to the shared ScrollFadePane which conditionally applies the
     mask + chevron only when scrolling is genuinely needed. */
  return (
    <ScrollFadePane
      style={{ flex: 1, minHeight: 0, minWidth: 0 }}
      innerStyle={{
        height: '100%',
        paddingRight: 4,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      {/* Header row - two-line column labels per Chris ask 3 Jun */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: HEATING_GRID_TEMPLATE,
        columnGap: 4,
      }}>
        <div />
        {PHASE_SLOTS.map((slot) => {
          const h = PHASE_HEADERS[slot]
          return (
            <div key={slot} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              paddingBottom: 6,
              borderBottom: '1px solid var(--rule-on-dark)',
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
                color: 'var(--text-muted-on-dark)',
                fontWeight: 500, letterSpacing: 0.2,
                lineHeight: 1.2,
              }}>{h.category}</span>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
                color: 'var(--color-theme-body)',
                fontWeight: 500, letterSpacing: 0.3,
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}>{h.phase}</span>
            </div>
          )
        })}
      </div>
      {/* Site rows - static (no interactivity per Chris ask 3 Jun:
          "graphic is telling the story, let's remove" the detail panel). */}
      {rows.map((r, rowIdx) => (
        <div
          key={r.id}
          style={{
            display: 'grid',
            gridTemplateColumns: HEATING_GRID_TEMPLATE,
            columnGap: 4,
            padding: '2px 0',
          }}
        >
          <HeatingSiteLabel
            site={r.site}
            rowIndex={rowIdx + 1}
            inScope={r.inScope}
          />
          {r.runs.map((run, i) => (
            <HeatingMatrixCell
              key={`${r.id}-${i}`}
              run={run}
              inScope={r.inScope}
              isOffice={r.id === 'edwalton-office'}
            />
          ))}
        </div>
      ))}
    </ScrollFadePane>
  )
}

function HeatingSiteLabel({ site, rowIndex, inScope }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      opacity: inScope ? 1 : 0.55,
      paddingRight: 4,
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
        color: 'var(--text-muted-on-dark)',
        minWidth: 14, textAlign: 'right',
      }}>{rowIndex}.</span>
      <span
        aria-hidden
        style={{
          width: 16, height: 16, flex: '0 0 16px',
          backgroundColor: 'var(--color-theme-body)',
          WebkitMaskImage: `url(/sites/${site.id}/icon.svg)`,
          maskImage: `url(/sites/${site.id}/icon.svg)`,
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        }}
      />
      <span style={{
        fontFamily: 'var(--font-site)', fontSize: 'var(--text-body-small)',
        color: 'var(--color-theme-body)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{site.display_name}</span>
    </div>
  )
}

/* Cell height - Brief 18 ask 3 Jun: stretch vertically so the icon + label
   can breathe. Icon fills most of the vertical space (~2x prior size). */
const HEATING_CELL_HEIGHT = 36
const HEATING_CELL_ICON = 30   /* icon scaled to fill the cell, leaving 3 px above/below */

function HeatingMatrixCell({ run, inScope, isOffice }) {
  const { system, confidence, span } = run
  /* Null system - phase doesn't exist. Dashed grey for in-scope, darker
     dashed for OOS (Edwalton's entirely-null row, Sonning P3+P4). */
  if (system === null) {
    return (
      <div style={{
        gridColumn: `span ${span}`,
        background: 'transparent',
        border: `1px dashed ${inScope
          ? 'color-mix(in srgb, var(--text-muted-on-dark) 65%, transparent)'
          : 'color-mix(in srgb, var(--text-muted-on-dark) 35%, transparent)'}`,
        borderRadius: 4,
        height: HEATING_CELL_HEIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
        color: inScope ? 'var(--text-muted-on-dark)' : 'color-mix(in srgb, var(--text-muted-on-dark) 50%, transparent)',
        opacity: isOffice ? 0.6 : 0.9,
      }}>
        {isOffice ? '-' : ''}
      </div>
    )
  }

  /* TBC - dashed coral border, transparent bg, label in coral italic.
     Chris ask 3 Jun: drop the ↺ marker - the dashed coral + italic
     already signal "tentative". */
  if (confidence === 'TBC') {
    return (
      <div style={{
        gridColumn: `span ${span}`,
        background: 'transparent',
        border: '1px dashed var(--color-nza-coral)',
        borderRadius: 4,
        height: HEATING_CELL_HEIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
        color: 'var(--color-nza-coral)',
        fontStyle: 'italic',
      }}>
        <HeatingSystemIcon system={system} color="var(--color-nza-coral)" size={HEATING_CELL_ICON} />
        <span>{HEATING_SYSTEM_PILL[system] || system}</span>
      </div>
    )
  }

  /* Filled cell - Chris ask 3 Jun: solid lighter shade of the system
     colour (no transparency). Bg = `color-mix(base 55%, white 45%)`
     for in-scope, `color-mix(base 60%, #000 40%)` for OOS. Text
     sits dark on pastel (in-scope) or cream on darkened (OOS) for
     contrast. Border style still encodes individual vs communal. */
  const baseColor = HEATING_SYSTEM_COLOR[system] || 'var(--text-muted-on-dark)'
  const kind = HEATING_SYSTEM_KIND[system] || 'individual'
  const borderStyle = kind === 'communal' ? 'dotted' : 'solid'
  const borderWidth = kind === 'communal' ? 2 : 1
  const fillBg = inScope
    ? `color-mix(in srgb, ${baseColor} 55%, #FFFFFF 45%)`
    : `color-mix(in srgb, ${baseColor} 60%, #000000 40%)`
  const borderColor = inScope
    ? `color-mix(in srgb, ${baseColor} 80%, #000000 20%)`
    : `color-mix(in srgb, ${baseColor} 85%, #FFFFFF 15%)`
  const labelColor = inScope ? 'var(--color-theme-base)' : 'var(--color-theme-body)'
  const iconColor  = inScope ? 'var(--color-theme-base)' : 'var(--color-theme-body)'

  return (
    <div style={{
      gridColumn: `span ${span}`,
      background: fillBg,
      border: `${borderWidth}px ${borderStyle} ${borderColor}`,
      borderRadius: 4,
      height: HEATING_CELL_HEIGHT,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
      color: labelColor,
      fontWeight: 600,
      letterSpacing: 0.2,
    }}>
      <HeatingSystemIcon system={system} color={iconColor} size={HEATING_CELL_ICON} />
      <span>{HEATING_SYSTEM_PILL[system] || system}</span>
    </div>
  )
}

/* Mask-image SVG icon tinted to `color`. Reuses the existing
   /icons/ivg-nza-icons_*.svg family + the hybrid composite built
   from the same paths. */
function HeatingSystemIcon({ system, color, size = 14 }) {
  const url = HEATING_SYSTEM_ICON[system]
  if (!url) return null
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size, height: size,
        flex: `0 0 ${size}px`,
        backgroundColor: color,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: 'contain', maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
      }}
    />
  )
}

/* ============================================================
   Brief 17 Amendment 2 Part 4 - Power strategy sub-tab
   ============================================================ */

const POWER_ARRANGEMENT = {
  'austin-heath':       'bulk',
  'gifford-lea':        'bulk',
  'millfield-green':    'bulk',
  'ampfield-meadows':   'bno',      /* Brief 19 follow-up (Chris 4 Jun): Ampfield is
                                       BNO too, same arrangement as Ledian. */
  'blendworth-hills':   'bulk',
  'millbrook-village':  'bulk',
  'sonning-common':     'bulk',     /* OOS - included for completeness */
  'bramshott-place':    'dno',
  'durrants-village':   'dno',
  'elderswell':         'dno',
  'great-alne-park':    'dno',
  'ledian-gardens':     'bno',      /* Brief 18 follow-up (Chris 3 Jun): Ledian is BNO -
                                       Westbrook-owned private cable network behind the DNO
                                       point of connection. */
  'edwalton-office':    'office',   /* OOS */
}

/* Coloured pill per arrangement. Tokens match the mock-up palette:
   Bulk = coral; DNO = amber; BNO = lilac; Office = grey-blue. */
const ARR_META = {
  bulk:   {
    label: 'Bulk',
    glyph: '⏚',
    color: 'var(--color-nza-coral)',
    desc:  'Single landlord MPAN; resident sub-billed via Sycous.',
  },
  dno:    {
    label: 'DNO',
    glyph: '◇',
    color: '#E8A13C',
    desc:  'Residents on individual MPANs with their own suppliers.',
  },
  bno:    {
    label: 'BNO',
    glyph: '◆',
    color: '#A896C4',
    desc:  'Westbrook-owned private cable network behind the DNO point of connection; residents on individual MPANs.',
  },
  office: {
    label: 'Office',
    glyph: '◯',
    color: 'var(--theme-overview)',
    desc:  'NHH office utility billed to landlord, no resident metering.',
  },
}

function PowerPanes() {
  const allSiteIds = [...IN_SCOPE_IDS, ...OUT_OF_SCOPE_IDS]
  const rows = useMemo(() => {
    return allSiteIds.map((sid) => {
      const site = sites[sid]
      const cap = capacityPv?.sites?.[sid] || null
      const arr = POWER_ARRANGEMENT[sid] || 'dno'
      /* Brief 19: ASC + peak + headroom + solar all sourced from
         capacity_pv.json (ECPR/strategy purpose-tagged sibling file).
         Secured capacity stored as MVA → convert to kVA for display. */
      const securedMva = cap?.secured_capacity_mva ?? null
      const asc = securedMva != null ? Math.round(securedMva * 1000) : null
      const peak = cap?.site_peak_load_kw ?? null
      const peakScope = cap?.site_peak_load_scope ?? null   /* full_site | landlord_only */
      const spare = cap?.headroom_kva ?? null
      const solarFull = cap?.pv_kwp_full ?? null
      const solarCurrent = cap?.pv_kwp_current ?? null
      const dno = cap?.dno ?? null
      const missingFields = cap?.missing_fields || []
      /* Meter count - landlord HH MPANs per site from mpan_register
         (the meters Westbrook directly operates on the landlord side). */
      const meterCount = (mpanRegister[sid] || []).filter(
        (m) => m.category === 'Landlord (HH)'
      ).length || null
      return {
        site_id: sid,
        site_name: site?.display_name || sid,
        in_scope: IN_SCOPE_SET.has(sid),
        arrangement: arr,
        dno,
        asc,
        peak,
        peakScope,
        spare,
        solarCurrent,
        solarFull,
        meterCount,
        missingFields,
      }
    })
  }, [])

  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('asc')
  const [sortDir, setSortDir] = useState('desc')
  const filteredRows = useMemo(() => {
    let r = rows
    if (filter === 'bulk')   r = r.filter((x) => x.arrangement === 'bulk')
    if (filter === 'dno')    r = r.filter((x) => x.arrangement === 'dno' || x.arrangement === 'bno')
    if (filter === 'pending') r = r.filter((x) => x.asc == null)
    /* sort */
    return [...r].sort((a, b) => {
      if (a.in_scope !== b.in_scope) return a.in_scope ? -1 : 1
      const av = a[sortKey] ?? -Infinity
      const bv = b[sortKey] ?? -Infinity
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [rows, filter, sortKey, sortDir])

  const reviewed = rows.filter((r) => r.in_scope && r.asc != null).length
  const reviewedPct = Math.round((reviewed / IN_SCOPE_IDS.length) * 100)

  return (
    <>
      <NarrativePane>
        {/* Brief 24.7 - Power strategy prose rewrite. */}
        <NarrativePara title="How Westbrook buys energy.">
          <strong>Ecotricity supplies every Westbrook site, for both electricity and gas.</strong> A single commercial relationship covers all landlord electricity meters and all gas meters across the portfolio. Ecotricity also supplies properties that are vacant or between residents - those void periods stay on Westbrook's commercial contract until a new resident takes over their own supply.
        </NarrativePara>

        <NarrativePara continuation>
          The next procurement window opens <Token>October 2026</Token>.
        </NarrativePara>

        <NarrativePara title="How electricity reaches each site.">
          The 11 sites use one of three arrangements, all decided during construction based on the site's age and heating choice:
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Bulk-metered (microgrid)</strong> - Westbrook holds one large commercial supply for the whole site, then distributes power through its own private wire network to each home. Residents are sub-billed through Sycous. <em>Five sites: Austin Heath, Blendworth Hills, Gifford Lea, Millbrook Village, Millfield Green</em> (plus Sonning Common, out of scope).
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Standard residential supply</strong> - each resident has their own meter and their own supplier (the standard arrangement on the UK Distribution Network Operator, or DNO). Westbrook only meters the small landlord supply for communal areas. <em>Four sites: Bramshott Place, Durrants Village, Elderswell, Great Alne Park.</em>
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Private cable network with individual residents</strong> - a hybrid: Westbrook owns the cable network on site (a Body of Network Operator, or BNO arrangement), but each resident has their own meter and their own supplier riding on Westbrook's infrastructure. <em>Two sites: Ampfield Meadows, Ledian Gardens.</em>
        </NarrativePara>

        <NarrativePara continuation>
          The arrangement at each site reflects when it was built and what heating choice was made at construction. Bulk-metered sites tend to be the ones with communal heating systems.
        </NarrativePara>

        <NarrativePara title="Capacity and on-site generation.">
          Each electricity connection has a maximum capacity it's allowed to draw - set by the network operator and called the <strong>Authorised Supply Capacity (ASC)</strong>. NZA is working through the portfolio to confirm the ASC for every site. So far{' '}
          <Token>{reviewed} of {IN_SCOPE_IDS.length} sites have a confirmed ASC</Token>; the rest are pending review. Where half-hourly data is available, peak demand and spare headroom against the ASC can also be derived - useful for planning future electrification additions.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Solar PV</strong> is installed at several sites - most significantly at{' '}
          <Token>Ledian Gardens (430 kWp)</Token> and{' '}
          <Token>Millfield Green</Token> (covering about 50% of demand on-site). At bulk-metered sites, solar reduces grid draw on the landlord supply directly. The billing arrangement for what's exported back to the grid is under review.
        </NarrativePara>
      </NarrativePane>

      <GraphicPane>
        {/* Top: filter pills + summary strip */}
        <div style={{
          height: 32, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
        }}>
          {[
            { k: 'all', l: 'All' },
            { k: 'bulk', l: 'Bulk-meter' },
            { k: 'dno', l: 'DNO' },
            { k: 'pending', l: 'Pending review' },
          ].map((p) => {
            const active = p.k === filter
            return (
              <button key={p.k} type="button" onClick={() => setFilter(p.k)}
                style={{
                  padding: '4px 10px', border: 'none', borderRadius: 999,
                  background: active ? 'var(--color-nza-coral)' : 'rgba(255,255,255,0.05)',
                  color: active ? 'white' : 'var(--text-muted-on-dark)',
                  fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
                  fontWeight: active ? 500 : 400, letterSpacing: 0.2, cursor: 'pointer',
                  transition: 'background 150ms var(--ease-standard)',
                }}>{p.l}</button>
            )
          })}
        </div>
        {/* Table - Chris ask 4 Jun: smaller font, tighter padding, no
            internal scroll, rollup totals as a <tfoot> row instead of
            a separate footer strip. */}
        <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
            color: 'var(--color-theme-body)',
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule-on-dark)' }}>
                {[
                  { k: 'site_name',   l: 'Site',         w: '22%', align: 'left'  },
                  { k: 'arrangement', l: 'Arrangement',  w: '12%', align: 'left'  },
                  { k: 'dno',         l: 'DNO',          w:  '8%', align: 'left'  },
                  { k: 'meterCount',  l: 'Meters',       w:  '7%', align: 'left'  },
                  { k: 'solarFull',   l: 'Solar PV',     w: '17%', align: 'left'  },
                  /* Chris ask 4 Jun: drop the standalone ASC kVA column -
                     the new ASC-vs-Peak cell now carries both numbers
                     in the Solar-PV grammar (e.g. 259 / 1300 kVA + bar). */
                  { k: 'peak',        l: 'ASC vs Peak',  w: '21%', align: 'left'  },
                  { k: 'spare',       l: 'Headroom',     w: '13%', align: 'left'  },
                ].map((c) => (
                  <th key={c.k} onClick={() => {
                    if (sortKey === c.k) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
                    else { setSortKey(c.k); setSortDir('desc') }
                  }}
                    style={{
                      width: c.w, textAlign: c.align, padding: '5px 6px',
                      fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
                      color: 'var(--text-muted-on-dark)', letterSpacing: 0.3,
                      textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
                    }}>{c.l}{sortKey === c.k ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => <PowerTableRow key={r.site_id} row={r} />)}
            </tbody>
            <PowerTableTotals rows={rows} rollup={capacityPv?.portfolio_rollup} />
          </table>
        </div>
      </GraphicPane>
    </>
  )
}

/* Brief 19 Deliverable 4 - portfolio totals as a <tfoot> row INSIDE
   the table (Chris ask 4 Jun: "totals at the bottom of the table ...
   Do you want a sum? Yeah"). Sums what makes sense to sum (meters,
   PV, ASC, peak), shows portfolio counts where summing doesn't
   (headroom is a per-site %, not portfolio-wide). */
function PowerTableTotals({ rows, rollup }) {
  if (!rollup) return null
  /* Sums computed live from the rendered rows so they reflect any
     filter that's been applied (rather than always showing the
     pipeline's full-portfolio rollup). */
  const totMeters = rows.reduce((s, r) => s + (r.meterCount || 0), 0)
  const totSolarCurrent = rows.reduce((s, r) => s + (r.solarCurrent || 0), 0)
  const totSolarFull   = rows.reduce((s, r) => s + (r.solarFull   || 0), 0)
  const totAsc = rows.reduce((s, r) => s + (r.asc || 0), 0)
  const totPeak = rows.reduce((s, r) => s + (r.peak || 0), 0)
  const sitesWithCapacity = rows.filter((r) => r.asc != null).length
  const sitesWithPeak     = rows.filter((r) => r.peak != null).length

  const labelStyle = {
    fontFamily: 'var(--font-heading)', fontSize: 10,
    color: 'var(--text-muted-on-dark)',
    textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: 500,
    lineHeight: 1.1,
  }
  const valueStyle = {
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
    color: 'var(--color-theme-body)', fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.2,
  }
  const cell = (label, value, unit) => (
    <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>
          {value}{unit ? <span style={{ color: 'var(--text-muted-on-dark)', fontWeight: 400 }}> {unit}</span> : null}
        </span>
      </span>
    </td>
  )
  return (
    <tfoot>
      <tr style={{
        borderTop: '2px solid color-mix(in srgb, var(--color-nza-coral) 50%, transparent)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>
          <span style={{ ...labelStyle, color: 'var(--color-nza-coral)' }}>Portfolio totals</span>
          <br />
          <span style={{ ...valueStyle, fontSize: 'var(--text-caption)' }}>{rows.length} sites</span>
        </td>
        {/* Arrangement - leave blank for now (sum-of-categories not meaningful here) */}
        <td style={{ padding: '8px 6px' }} />
        {/* DNO - count distinct */}
        {cell('DNO refs', new Set(rows.map((r) => r.dno).filter(Boolean)).size, '')}
        {/* Meters - sum */}
        {cell('Meters', totMeters, '')}
        {/* Solar PV - current / full */}
        {cell('Solar PV', `${totSolarCurrent} / ${totSolarFull}`, 'kWp')}
        {/* ASC vs Peak - combined cell mirrors the row layout:
            sum of measured peak / sum of secured (in kVA). */}
        {cell('ASC vs Peak', `${totPeak.toFixed(0)} / ${totAsc.toFixed(0)}`, 'kVA')}
        {/* Headroom - coverage counts rather than % (per-site %s don't sum) */}
        {cell('Coverage', `${sitesWithPeak}/${rows.length}`, 'peak · ' + sitesWithCapacity + ' ASC')}
      </tr>
    </tfoot>
  )
}

/* Spare-% palette - green / amber / red bands. */
function _sparePillColor(pct) {
  if (pct == null) return 'var(--text-muted-on-dark)'
  if (pct > 30)  return 'var(--color-risk-low)'       /* #8FCB85 - green */
  if (pct >= 10) return 'var(--color-risk-moderate)'  /* #E8A13C - amber */
  return 'var(--color-risk-major)'                    /* #D9464B - red */
}

function PowerTableRow({ row }) {
  const arrMeta = ARR_META[row.arrangement] || ARR_META.dno
  /* Spare % derived from capacity_pv headroom_kva (already computed in
     the pipeline as secured - peak, only when both exist). */
  const sparePct = row.spare != null && row.asc ? Math.round(row.spare / row.asc * 100) : null
  return (
    <tr style={{
      borderBottom: '1px solid var(--rule-on-dark)',
      opacity: row.in_scope ? 1 : 0.55,
    }}>
      {/* Site - icon + name */}
      <td style={{ padding: '4px 6px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{
            width: 14, height: 14, flex: '0 0 14px',
            backgroundColor: 'var(--color-theme-body)',
            WebkitMaskImage: `url(/sites/${row.site_id}/icon.svg)`,
            maskImage: `url(/sites/${row.site_id}/icon.svg)`,
            WebkitMaskSize: 'contain', maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          }} />
          <span style={{ fontFamily: 'var(--font-site)' }}>{row.site_name}</span>
        </span>
      </td>
      {/* Arrangement - coloured pill */}
      <td style={{ padding: '4px 6px' }} title={arrMeta.desc}>
        <ArrangementPill meta={arrMeta} />
      </td>
      {/* DNO - Brief 19 column */}
      <td style={{ padding: '4px 6px' }}>
        {row.dno
          ? <span style={{ color: 'var(--color-theme-body)' }}>{row.dno}</span>
          : <span style={{ color: 'var(--text-muted-on-dark)' }}>-</span>}
      </td>
      {/* Meters - count + meter icon */}
      <td style={{ padding: '4px 6px', fontVariantNumeric: 'tabular-nums' }}>
        {row.meterCount != null ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span aria-hidden style={{
              width: 12, height: 12, flex: '0 0 12px',
              backgroundColor: 'var(--text-muted-on-dark)',
              WebkitMaskImage: 'url(/icons/ivg-nza-icons_meter.svg)',
              maskImage: 'url(/icons/ivg-nza-icons_meter.svg)',
              WebkitMaskSize: 'contain', maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            }} />
            {row.meterCount}
          </span>
        ) : <span style={{ color: 'var(--text-muted-on-dark)' }}>-</span>}
      </td>
      {/* Solar PV - Brief 19: current/full kWp + mini stacked bar
          (operational solid, future hatched per Rule 3). */}
      <td style={{ padding: '4px 6px' }}>
        <PvPhasingCell current={row.solarCurrent} full={row.solarFull} />
      </td>
      {/* ASC vs Peak - combined cell carrying both figures + utilisation
          bar. Standalone ASC kVA column dropped per Chris ask 4 Jun. */}
      <td style={{ padding: '4px 6px' }}>
        <PeakBar peak={row.peak} asc={row.asc} scope={row.peakScope} muted={!row.in_scope} />
      </td>
      {/* Headroom - colour-coded pill */}
      <td style={{ padding: '4px 6px', fontVariantNumeric: 'tabular-nums' }}>
        {sparePct != null ? (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: `color-mix(in srgb, ${_sparePillColor(sparePct)} 20%, transparent)`,
            color: _sparePillColor(sparePct),
            fontWeight: 600,
          }}>{sparePct}%</span>
        ) : <span style={{ color: 'var(--text-muted-on-dark)' }}>-</span>}
      </td>
    </tr>
  )
}

/* Brief 19 Deliverable 3 - per-site PV phasing as a mini stacked bar
   in the Solar PV cell. Operational portion solid; future portion
   hatched (Rule 3 - "operational solid, future hatched/translucent").
   Reads `current` vs `full` kWp from capacity_pv.json. */
function PvPhasingCell({ current, full }) {
  /* No PV data at all (sites absent from workbook) */
  if (full == null || full === 0) {
    return <span style={{ color: 'var(--text-muted-on-dark)', fontVariantNumeric: 'tabular-nums' }}>-</span>
  }
  const cur = current || 0
  const curPct = full > 0 ? (cur / full) * 100 : 0
  const futurePct = 100 - curPct
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', gap: 3,
      minWidth: 80,
    }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
        color: 'var(--color-theme-body)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ color: cur > 0 ? 'var(--color-theme-body)' : 'var(--text-muted-on-dark)' }}>
          {cur}
        </span>
        <span style={{ color: 'var(--text-muted-on-dark)' }}> / {full} kWp</span>
      </span>
      {/* Mini horizontal stacked bar */}
      <span style={{
        display: 'block', height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid color-mix(in srgb, var(--metric-electricity) 40%, transparent)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Operational segment - solid */}
        {curPct > 0 && (
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${curPct}%`,
            background: 'var(--metric-electricity)',
          }} />
        )}
        {/* Future segment - hatched diagonals */}
        {futurePct > 0 && (
          <span style={{
            position: 'absolute', left: `${curPct}%`, top: 0, bottom: 0,
            width: `${futurePct}%`,
            backgroundImage:
              'repeating-linear-gradient(45deg, color-mix(in srgb, var(--metric-electricity) 50%, transparent) 0, color-mix(in srgb, var(--metric-electricity) 50%, transparent) 2px, transparent 2px, transparent 5px)',
          }} />
        )}
      </span>
    </span>
  )
}

/* Coloured pill for an arrangement (Bulk / DNO / BNO / Office). Glyph
   + label, palette per ARR_META. */
function ArrangementPill({ meta }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      background: `color-mix(in srgb, ${meta.color} 22%, transparent)`,
      border: `1px solid color-mix(in srgb, ${meta.color} 55%, transparent)`,
      color: meta.color,
      fontFamily: 'var(--font-heading)', fontSize: 'var(--text-caption)',
      fontWeight: 600, letterSpacing: 0.2,
    }}>
      <span style={{ fontSize: '0.85em' }}>{meta.glyph}</span>
      {meta.label}
    </span>
  )
}

/* Peak vs ASC cell - Chris ask 4 Jun: match the Solar PV cell grammar.
   Dual numeric `peak / asc` on top, mini stacked bar below (peak as
   solid utilisation-band fill, remaining headroom as transparent
   space inside the outline).
   `scope` distinguishes full-site bulk peaks from landlord-only DNO/BNO
   peaks; the latter gets an `LL` badge so the figure isn't misread as
   full-site demand. */
function PeakBar({ peak, asc, scope, muted }) {
  /* Both null - graceful empty state. */
  if (peak == null && asc == null) {
    return <span style={{ color: 'var(--text-muted-on-dark)', fontVariantNumeric: 'tabular-nums' }}>-</span>
  }
  const pct = (peak != null && asc) ? Math.min(100, Math.max(0, (peak / asc) * 100)) : 0
  /* Utilisation bands - low peak / ASC ratio = green, mid = amber,
     high = red. When ASC is unknown the bar reads as awaiting. */
  const fillColor = asc
    ? (pct > 90 ? 'var(--color-risk-major)'
        : pct >= 70 ? 'var(--color-risk-moderate)'
        : 'var(--color-risk-low)')
    : 'var(--text-muted-on-dark)'
  const peakLabel = peak != null ? peak : '-'
  const ascLabel  = asc  != null ? asc  : '-'
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', gap: 3,
      minWidth: 80,
    }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: muted ? 'var(--text-muted-on-dark)' : 'var(--color-theme-body)' }}>
          <span style={{ color: peak != null ? (muted ? 'var(--text-muted-on-dark)' : 'var(--color-theme-body)') : 'var(--text-muted-on-dark)' }}>
            {peakLabel}
          </span>
          <span style={{ color: 'var(--text-muted-on-dark)' }}> / {ascLabel} kVA</span>
        </span>
        {scope === 'landlord_only' && peak != null && (
          <span title="Landlord-side MPAN only - residents on individual MPANs not included in this peak"
            style={{
              fontFamily: 'var(--font-heading)', fontSize: 9,
              color: 'var(--text-muted-on-dark)',
              textTransform: 'uppercase', letterSpacing: 0.3,
              padding: '1px 4px', border: '1px solid var(--rule-on-dark)',
              borderRadius: 2,
              flexShrink: 0,
            }}>LL</span>
        )}
      </span>
      {/* Mini horizontal stacked bar - peak as utilisation-banded fill,
          remainder is headroom (transparent space inside the outline). */}
      <span style={{
        display: 'block', height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid color-mix(in srgb, ${asc ? 'var(--metric-electricity)' : 'var(--text-muted-on-dark)'} 40%, transparent)`,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {peak != null && asc && pct > 0 && (
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: `color-mix(in srgb, ${fillColor} 75%, transparent)`,
          }} />
        )}
        {/* When ASC is null but peak is known, render a dashed-fill
            stripe instead so the "unknown ceiling" state reads clearly. */}
        {peak != null && !asc && (
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, right: 0,
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 5px)',
          }} />
        )}
      </span>
    </span>
  )
}

/* ============================================================
   Brief 17 Amendment 2 Part 5 - Metering & data quality sub-tab
   ============================================================ */

function MeteringPanes() {
  /* mpan_register is keyed by site_id; values are arrays of MPAN
     records each with .type (HH/NHH) and .category (Landlord HH /
     Landlord NHH / Void / etc). Aggregate per site by category. */
  const meterRows = useMemo(() => {
    const ALL = [...IN_SCOPE_IDS, ...OUT_OF_SCOPE_IDS]
    return ALL.map((sid) => {
      const list = mpanRegister[sid] || []
      const counts = { landlord_hh: 0, landlord_nhh: 0, void: 0, other: 0 }
      const kwh = { landlord_hh: 0, landlord_nhh: 0, void: 0 }
      let high_void = 0
      list.forEach((m) => {
        const c = (m.category || '').toLowerCase()
        const kk = m.cy25_kwh || 0
        if (c.includes('void')) {
          counts.void += 1
          kwh.void += kk
          if (kk > 5000) high_void += 1
        } else if (c.includes('landlord') && (m.type || '').toLowerCase() === 'hh') {
          counts.landlord_hh += 1
          kwh.landlord_hh += kk
        } else if (c.includes('landlord')) {
          counts.landlord_nhh += 1
          kwh.landlord_nhh += kk
        } else {
          counts.other += 1
        }
      })
      const total = counts.landlord_hh + counts.landlord_nhh + counts.void
      return {
        site_id: sid,
        site_name: sites[sid]?.display_name || sid,
        in_scope: IN_SCOPE_SET.has(sid),
        ...counts, total, high_void, kwh,
      }
    }).filter((r) => r.total > 0).sort((a, b) => {
      if (a.in_scope !== b.in_scope) return a.in_scope ? -1 : 1
      return b.total - a.total
    })
  }, [])

  const totals = useMemo(() => {
    return meterRows.filter((r) => r.in_scope).reduce((acc, r) => ({
      landlord_hh: acc.landlord_hh + r.landlord_hh,
      landlord_nhh: acc.landlord_nhh + r.landlord_nhh,
      void: acc.void + r.void,
      high_void: acc.high_void + r.high_void,
      high_void_kwh: acc.high_void_kwh + (r.high_void > 0 ? r.kwh.void : 0),
      total: acc.total + r.total,
    }), { landlord_hh: 0, landlord_nhh: 0, void: 0, high_void: 0, high_void_kwh: 0, total: 0 })
  }, [meterRows])

  const sycousMeta = sycous?.portfolio || {}

  /* Brief 21 Part 1 - narrative reads from portfolio.metering_sankey.commodities
     so counts stay honest at Sankey-level granularity. The local MeteringPanes
     classifier (used by the existing stacked-bar chart) lumps gas MPRNs into
     the NHH bucket because it pre-dates the Sankey scope split - that's why
     the page previously read "56 NHH" instead of the correct "44 NHH + 12 gas
     MPRNs". Numbers below come from the pipeline, never hardcoded. */
  const ms = portfolio.metering_sankey || {}
  const c = ms.commodities || {}
  const elecTotalInScope =
    (c['elec-hh'] || 0) + (c['elec-nhh'] || 0) +
    (c['elec-void'] || 0) + (c['elec-other'] || 0)

  return (
    <>
      <NarrativePane>
        {/* Brief 24.7 - Metering prose rewrite. Page title also renamed
            from "Metering & data quality" to "Metering" in the nav
            constants (TopNav + PortfolioEnergy SUB_TABS). The "What
            this means for the rest of the page" section was removed;
            its content is now captured by the coverage table below. */}
        <NarrativePara title="How Westbrook sees its portfolio.">
          Across the 11 sites, Westbrook has visibility into its energy use through <strong>three data platforms working together</strong>, each playing a different role. The arrangement is different at each site depending on how it was built - some sites give Westbrook direct visibility into every home, others give visibility only into the communal areas, with resident usage either sub-metered separately or derived indirectly.
        </NarrativePara>

        <NarrativePara continuation>
          This page shows every meter Westbrook can see, where the data comes from, and where the honest gaps sit.
        </NarrativePara>

        <NarrativePara continuation>
          The 11 sites split into three metering arrangements (the same split as on the Power strategy page):
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Bulk-metered sites</strong> - one large commercial meter at the site entrance, then Sycous sub-meters in every apartment. Full visibility, both landlord and resident.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Standard residential sites</strong> - Westbrook only sees its own landlord meters directly. Resident consumption is <em>derived</em> by subtracting landlord usage from the total flowing into the site (sourced from arbnco).
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Private cable sites</strong> (Ampfield Meadows, Ledian Gardens) - Westbrook owns the cable but residents have their own contracts. Visibility sits between the two.
        </NarrativePara>

        <NarrativePara title="The three platforms.">
          <strong>Ecotricity</strong> invoices Westbrook for every landlord electricity meter (MPAN - Meter Point Administration Number) and every gas meter (MPRN - Meter Point Reference Number). This is the authoritative source for what Westbrook actually pays - directly measured, no estimation.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>Sycous</strong> sub-meters individual residents at bulk-metered and private-cable sites.{' '}
          <Token>{sycousMeta.total_meters} sub-meters across {sycousMeta.sites_with_sycous} of 11 sites</Token> - by volume, the single largest data source on the platform.
        </NarrativePara>

        <NarrativePara continuation>
          <strong>arbnco</strong> aggregates portfolio-wide totals and is used to derive resident consumption at standard residential sites by subtraction. arbnco's methodology hasn't been published to NZA.
        </NarrativePara>

        <NarrativePara continuation>
          A fourth platform, <strong>Meterpoint</strong>, piggybacks Sycous meters at some sites for higher-frequency data - not yet integrated.
        </NarrativePara>

        <NarrativePara title="Coverage at a glance.">
          <CoverageTable />
        </NarrativePara>

        <NarrativePara title="Worth flagging: high-consumption voids.">
          <VoidCallout
            voidCount={totals.high_void}
            voidKwh={totals.high_void_kwh}
            voidKwhLabel={fmtKwhCompact(totals.high_void_kwh)}
          />
        </NarrativePara>
      </NarrativePane>

      <GraphicPane>
        {/* Brief 21 Part 2 - Sankey replaces the per-site stacked-bar chart.
            The bar chart's MeteringRow + meterRows/totals memos above are kept
            for reference (cheap to keep, surgical to remove later) but are no
            longer rendered. The Sankey owns the entire graphic pane: filter
            pills on top, SVG canvas in the flex middle, summary strip at
            the bottom - all three live inside MeteringSankey.jsx so the
            graphic pane keeps Rule 11 column gap discipline. */}
        <MeteringSankey />
      </GraphicPane>
    </>
  )
}

function MeteringRow({ row, maxTotal }) {
  const pct = (n) => row.total ? (n / row.total * 100) : 0
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 1fr 70px',
      gap: 8, alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid var(--rule-on-dark)',
      opacity: row.in_scope ? 1 : 0.55,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-site)', fontSize: 'var(--text-body-small)',
        color: 'var(--color-theme-body)', minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        <span aria-hidden style={{
          width: 14, height: 14, flex: '0 0 14px',
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url(/sites/${row.site_id}/icon.svg)`,
          maskImage: `url(/sites/${row.site_id}/icon.svg)`,
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        }} />
        {row.site_name}
      </div>
      <div style={{ display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
        {row.landlord_hh > 0 && (
          <div title={`Landlord HH: ${row.landlord_hh}`} style={{
            width: `${pct(row.landlord_hh)}%`,
            background: 'var(--color-energy-elec-landlord)',
          }} />
        )}
        {row.landlord_nhh > 0 && (
          <div title={`Landlord NHH: ${row.landlord_nhh}`} style={{
            width: `${pct(row.landlord_nhh)}%`,
            background: 'var(--color-energy-elec-resident-submetered)',
          }} />
        )}
        {row.void > 0 && (
          <div title={`Void: ${row.void}${row.high_void ? ' (' + row.high_void + ' high-consumption)' : ''}`} style={{
            width: `${pct(row.void)}%`,
            background: row.high_void > 0 ? 'var(--color-risk-major)' : 'var(--text-muted-on-dark)',
          }} />
        )}
      </div>
      <div style={{
        textAlign: 'right',
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-small)',
        fontVariantNumeric: 'tabular-nums', color: 'var(--color-theme-body)',
      }}>{row.total}</div>
    </div>
  )
}

function StubPair({ subTab }) {
  return (
    <>
      <NarrativePane>
        <NarrativePara title={`Narrative pane · in progress`}>
          Brief 17 Part {subTab === 'heating' ? 3 : subTab === 'power' ? 4 : 5} lands the
          {' '}{SUB_TABS.find((t) => t.key === subTab)?.label.toLowerCase()} narrative here.
        </NarrativePara>
      </NarrativePane>
      <GraphicPane>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed var(--rule-on-dark)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-small)',
          color: 'var(--text-muted-on-dark)',
        }}>
          Graphic pane · in progress
        </div>
      </GraphicPane>
    </>
  )
}
