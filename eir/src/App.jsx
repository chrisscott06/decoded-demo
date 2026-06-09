import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Zap, Flame, Droplets, Recycle, ArrowRight,
  Maximize2, Layers, Users, Sun, Wind, Activity, Info, X } from 'lucide-react'
import {
  COLOR_TEXT_MUTED_ON_DARK,
  COLOR_THEME_BASE,
  COLOR_THEME_BODY,
  COLOR_NZA_CORAL,
  COLOR_SCOPE_12,
  COLOR_CAT_ESTATE,
  FONT_BODY,
} from './tokens/chart-colors.js'

// ----- pipeline data imports -----
import portfolio from '@pipeline-data/portfolio.json'
import sites from '@pipeline-data/sites.json'
import reconciliation from '@pipeline-data/reconciliation.json'
import electricityMonthly from '@pipeline-data/electricity_monthly.json'
import mpanRegister from '@pipeline-data/mpan_register.json'
import waterData from '@pipeline-data/water.json'
import wasteData from '@pipeline-data/waste.json'
import rfiStatus from '@pipeline-data/rfi_status.json'
import sycousData from '@pipeline-data/sycous.json'
import carbonData from '@pipeline-data/carbon.json'
/* Brief 20 (BR-13) Task 1 - Phase 1 GRESB visualisation reads from
   eir/src/data/gresb.json (manually populated from P09 SH-2000
   tracker; Phase 2/Brief 21+ will automate via a Python pipeline).
   The old gresb_stub.json import is dropped; the pipeline still emits
   it for backwards-compat with cached deploys but App.jsx no longer
   consumes it. */
import gresb from './data/gresb.json'
/* Brief 20 Task 2 - atomic component library, with a hidden
   /gresb/test showcase route below for Phase 1 verification per the
   brief's PASS criterion. */
import * as GresbAtoms from './components/gresb/atomic.jsx'
/* Brief 20 Task 3 - full Overview + Forward planning sub-tab bodies. */
import { GresbOverview } from './components/gresb/Overview.jsx'
import { GresbForward } from './components/gresb/Forward.jsx'
import GresbAspects from './components/gresb/Aspects.jsx'
import PageContainer from './components/layout/PageContainer.jsx'
import hhIndex from '@pipeline-data/half_hourly_index.json'

// ----- components -----
import DataStatusBadge from './components/DataStatusBadge.jsx'
import MetricTile from './components/MetricTile.jsx'
// UkMap removed Brief 7 Part 4 - replaced by PortfolioMapModule on /portfolio/map.
// siteCoordinates moved into PortfolioMap.jsx via projection.js percent coords.
// EnergyChart retired post-Brief-15 - outer Monthly/HH toggle dropped per
// Chris ask 2026-05-24. Monthly is now LoadInspector's internal tab.
// import EnergyChart from './components/EnergyChart.jsx'
import PortfolioMapModule from './components/PortfolioMap.jsx'
import PortfolioEnergy from './components/portfolio/PortfolioEnergy.jsx'
import PortfolioPlaceholder from './components/portfolio/PortfolioPlaceholder.jsx'
import { motion, useReducedMotion } from 'framer-motion'
import LoadInspector from './components/LoadInspector/LoadInspector.jsx'
/* Brief 24 r3 - HH view components rendered directly inside the
   SiteEnergy tabs (no LoadInspector wrapper needed for the new
   tab-per-view architecture). */
import TimeSeriesView    from './components/LoadInspector/views/TimeSeriesView.jsx'
import DailyProfileView  from './components/LoadInspector/views/DailyProfileView.jsx'
import DurationCurveView from './components/LoadInspector/views/DurationCurveView.jsx'
import HeatMapView       from './components/LoadInspector/views/HeatMapView.jsx'
import TopNav from './components/TopNav.jsx'
import SubNav from './components/SubNav.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import BodyPageLayout from './components/BodyPageLayout.jsx'
import Landing from './components/Landing.jsx'
import Panel from './components/Panel.jsx'
import Sidebar from './components/Sidebar.jsx'
import WasteTab from './components/site/WasteTab.jsx'
import WaterTab from './components/site/WaterTab.jsx'
import SiteHeader from './components/site/SiteHeader.jsx'
import SycousPanel from './components/site/SycousPanel.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PhasingPage from './components/PhasingPage.jsx'
/* Brief 24 - site chapter upgrade. */
import SiteMetering from './components/site/SiteMetering.jsx'
import { gresbReadiness, landlordMeterCounts } from './lib/siteDerivations.js'

// ================ formatters ================

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-GB') : '-')

const fmtCompact = (n) => {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + 'M'
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000).toLocaleString('en-GB') + 'k'
  return n.toLocaleString('en-GB', { maximumFractionDigits: 1 })
}

const fmt1 = (n) => (typeof n === 'number' ? Math.round(n * 10) / 10 : null)

// ================ tiny router ================

function useLocation() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function navigate(to) {
  if (window.location.pathname === to) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/* Chris ask 9 Jun - Site-area responsive design.
   Recharts 3.x <PieChart> doesn't accept CSS unit width/height props
   (must be plain integers). To match the fluid CSS clamp() that sizes
   the donut wrapper, this hook computes the same min(max, vw*factor)
   in JS and returns an integer that PieChart consumes directly.
   Re-runs on window resize so the donut tracks viewport changes
   without remount. SSR-safe (returns maxPx when window is absent). */
function useFluidSize(minPx, vwFactor, maxPx) {
  const compute = () => {
    if (typeof window === 'undefined') return maxPx
    return Math.round(Math.max(minPx, Math.min(maxPx, window.innerWidth * vwFactor)))
  }
  const [size, setSize] = useState(compute)
  useEffect(() => {
    function onResize() { setSize(compute()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPx, vwFactor, maxPx])
  return size
}

/* Chris ask 8 Jun (post-Brief 24.8 close):
   The primary-nav Site link was greying out on a cold session
   because no localStorage entry existed and the user hadn't yet
   clicked through a Portfolio Map pin -> "View site" CTA. Phase 1B
   behaviour was correct but introduced unnecessary friction for a
   first-time Westbrook user who just wanted to click Site.
   Fix: default to ampfield-meadows on cold load. Existing
   localStorage entries take precedence so anyone who's already
   navigated through a site keeps their last selection.
   ampfield-meadows was Chris's pick - reasonable demonstrator site
   (BNO/bulk+Sycous arrangement, has the full data spread). */
const DEFAULT_SITE_ID = 'ampfield-meadows'

function useCurrentSiteId(path) {
  const [siteId, setSiteId] = useState(() => {
    try { return localStorage.getItem('ivg.currentSiteId') || DEFAULT_SITE_ID } catch { return DEFAULT_SITE_ID }
  })
  useEffect(() => {
    const m = path.match(/^\/site\/([a-z0-9-]+)/)
    if (m) {
      setSiteId(m[1])
      try { localStorage.setItem('ivg.currentSiteId', m[1]) } catch {}
    }
  }, [path])
  return siteId
}

// ================ status helpers ================

function elecStatus(siteId) {
  const rec = reconciliation.by_site?.[siteId]
  if (!rec) return 'missing'
  if ((rec.eco_landlord_elec_kwh || 0) <= 0 && (rec.arb_elec_kwh || 0) <= 0) return 'missing'
  if ((rec.derived_resident_elec_kwh || 0) > 0) return 'partial'
  return 'confirmed'
}

function gasStatus(siteId) {
  const rec = reconciliation.by_site?.[siteId]
  if (!rec) return 'missing'
  const eco = rec.eco_gas_kwh || 0
  const arb = rec.arb_gas_kwh || 0
  if (eco === 0 && arb === 0) return 'not_applicable'
  if (eco === 0 || arb === 0) return 'partial'
  const gap = Math.abs(eco - arb) / Math.max(eco, arb)
  if (gap > 0.10) return 'partial'
  return 'confirmed'
}

function waterStatus(siteId) { return waterData?.[siteId]?.data_status || 'missing' }
function wasteStatus(siteId) { return wasteData?.[siteId]?.data_status || 'missing' }
function overallSiteStatus(siteId) {
  // Best-of-four: green if all confirmed, amber if any partial, red if any missing
  const all = [elecStatus(siteId), gasStatus(siteId), waterStatus(siteId), wasteStatus(siteId)]
  if (all.every(s => s === 'confirmed' || s === 'not_applicable')) return 'confirmed'
  if (all.some(s => s === 'missing')) return 'missing'
  return 'partial'
}

// ================ sub-tab definitions ================

/* Brief 17 (Chris override): the four legacy Portfolio sub-tabs
   (Overview / Sites / Phasing / Comparisons) are stripped from the
   nav. The thematic pages - Energy first, then Water / Waste /
   Carbon - take their place alongside the Map.
   • Stripped routes still resolve (redirected to /portfolio/map by
     the router below) so any external bookmarks don't 404.
   • Phasing keeps its top-level /phasing route - just removed from
     this nav. */
const PORTFOLIO_SUBTABS = [
  { key: 'map',    label: 'Map',    path: '/portfolio/map' },
  { key: 'energy', label: 'Energy', path: '/portfolio/energy' },
]

function siteSubtabs(id) {
  /* Chris ask 5 Jun: tab label "Meters" (was "Metering & data quality").
     The combined page covers both meter inventory + data quality
     summary; cleaner label fits better in the secondary nav. Legacy
     URLs /site/<id>/meters and /site/<id>/data-quality still route
     to /metering - see the router below. */
  return [
    { key: 'overview',  label: 'Overview', path: `/site/${id}/overview` },
    { key: 'energy',    label: 'Energy',   path: `/site/${id}/energy` },
    { key: 'carbon',    label: 'Carbon',   path: `/site/${id}/carbon` },
    { key: 'water',     label: 'Water',    path: `/site/${id}/water` },
    { key: 'waste',     label: 'Waste',    path: `/site/${id}/waste` },
    { key: 'metering',  label: 'Meters',   path: `/site/${id}/metering` },
  ]
}

/* SiteHeader extracted to components/site/SiteHeader.jsx - see that file
   for the full Chris-ask history. Sub-tab components MUST render it
   INSIDE their `<div className="page">` wrapper so the icon's
   horizontal position matches Overview (the `.page` wrapper provides
   the shared padding + max-width). */
// Imported via top-of-file alongside other component imports.

// ================ Brief 6 Part 3 narratives ================

/**
 * PageNarrative - eyebrow + heading + body block at the top of non-Site-Detail
 * pages. Text is verbatim from Brief 6 / design note D6.
 */
function PageNarrative({ eyebrow, heading, body, maxWidth = 720 }) {
  return (
    <div className="page-narrative" style={{ maxWidth }}>
      <p className="page-narrative-eyebrow">{eyebrow}</p>
      <h1 className="page-narrative-heading">{heading}</h1>
      <p className="page-narrative-body">{body}</p>
    </div>
  )
}

const NARRATIVES = {
  'portfolio-map': {
    eyebrow: 'PORTFOLIO MAP',
    heading: '13 retirement villages under operational control.',
    body: 'Every dot is a site. Switch theme to recolour the leaderboard and resize the map dots - energy in kWh, water in m³, waste in tonnes, carbon in tCO₂e. Hover any row or dot for a quick preview. Click to drill into the site.',
  },
  'portfolio-sites': {
    eyebrow: 'ALL SITES',
    heading: 'Every site, every metric.',
    body: 'Sortable table view of the full portfolio. Status badges per metric show what’s confirmed, partial, or pending. Click any row to drill into Site Detail.',
  },
  'portfolio-comparisons': {
    eyebrow: 'SITE COMPARISON',
    heading: 'Two sites, side by side.',
    body: 'Pick any two villages and compare GIA, energy, carbon intensity, and data quality. The monthly chart below stacks both sites’ consumption to surface seasonal patterns.',
  },
  'gresb': {
    eyebrow: 'GRESB READINESS 2026',
    heading: 'Score target: 52 → 62 by July.',
    body: 'Five indicators tracked: data coverage, policies, green leases, ESG fit-out guides, BREEAM In-Use certifications. The full scorecard arrives in the next phase of work - this preview shows progress to date.',
  },
}

// ================ portfolio page ================

/* Brief 8 follow-up: single-view dashboard, no scroll. The Map
   page-narrative was dropped (its eyebrow + heading now live inline-
   left inside the module); `.page-noscroll` caps the viewport so the
   map fills the remaining vertical space.

   This wrapper was deleted alongside the other dead components in
   Brief 17 Part 1 - restored here because PortfolioPage's render
   table still references `<PortfolioMap />` and the Map page went
   blank without it. (Chris-reported regression.) */
function PortfolioMap() {
  return (
    <div className="page page-noscroll">
      <PortfolioMapModule navigate={navigate} />
    </div>
  )
}

function PortfolioPage({ subTab, subSubTab, currentSiteId }) {
  return (
    <DashboardLayout
      topNav={<TopNav active="portfolio" activeSecondary={subTab} currentSiteId={currentSiteId} navigate={navigate} />}
    >
      <ErrorBoundary scope={`portfolio/${subTab}`} theme="dark">
        {subTab === 'map' && <PortfolioMap />}
        {subTab === 'energy' && <PortfolioEnergy subSubTab={subSubTab} />}
        {subTab === 'water' && (
          <PortfolioPlaceholder
            eyebrow="Portfolio · Water"
            title="Water."
            body="The portfolio Water chapter - per-site m³, leakage flags, retailer mix and the 13-site water-quality heat map - is being prepared from the P03 water workbook."
          />
        )}
        {subTab === 'waste' && (
          <PortfolioPlaceholder
            eyebrow="Portfolio · Waste"
            title="Waste."
            body="The portfolio Waste chapter - tonnage by stream, disposal split, Scope 3 Cat 5 emissions and the diversion-rate scoreboard - is being assembled from the latest BIFFA + SUEZ feeds."
          />
        )}
        {subTab === 'carbon' && (
          <PortfolioPlaceholder
            eyebrow="Portfolio · Carbon"
            title="Carbon."
            body="The portfolio Carbon chapter - Scope 1 / 2 / 3 (Cat 5 + Cat 13) tCO₂e at portfolio level, intensity per m² and per unit, and the trajectory against the NZA Net Zero glidepath - is being wired up."
          />
        )}
        {/* Brief 17: overview / sites / phasing / comparisons stripped
            from the nav; redirect handles bookmarks. Render guarded
            with empty so a stale subTab string doesn't break the
            ErrorBoundary. */}
      </ErrorBoundary>
    </DashboardLayout>
  )
}

// ================ site sub-tabs ================

/* Chris ask 2026-05-24: per-site imagery on Site Overview. Assets live
   at eir/public/sites/<id>/{hero.jpg, aerial.png, site-plan.*}. Each
   value is the filename if present, null if absent. Site plans landed
   in two file types (Chris ask 2026-06-02 batch: jpg from new uploads,
   png from earlier batches) - encode the extension here so the JSX
   doesn't have to guess. */
const SITE_ASSETS = {
  'ampfield-meadows':  { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.jpg' },
  'austin-heath':      { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'blendworth-hills':  { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.jpg' },
  'bramshott-place':   { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'durrants-village':  { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'edwalton-office':   { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: null            },
  'elderswell':        { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'gifford-lea':       { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'great-alne-park':   { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'ledian-gardens':    { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'millbrook-village': { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.png' },
  'millfield-green':   { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.jpg' },
  'sonning-common':    { hero: 'hero.jpg', aerial: 'aerial.png', sitePlan: 'site-plan.jpg' },
}

function SiteOverview({ site, siteId, rec }) {
  const cy25 = electricityMonthly[siteId]?.cy25
  const water = waterData?.[siteId]
  const waste = wasteData?.[siteId]
  const allMpans = mpanRegister[siteId] || []
  const elecMpans = allMpans.filter((m) => m.type === 'HH' || m.type === 'NHH')
  const gasMprns = allMpans.filter((m) => m.type === 'Gas')
  const landlordElec = elecMpans.filter((m) => (m.category || '').toLowerCase().startsWith('landlord'))
  const monthsCovered = landlordElec.length
    ? Math.max(...landlordElec.map((m) => m.months_covered || 0))
    : 0

  // Brief 24 Part 3 - tile captions now count LANDLORD meters only,
  // not total MPANs. The total-MPAN count was misleading on a landlord-
  // kWh tile (it included resident/void/inactive MPANs that don't
  // contribute to the figure shown). Total counts moved to the
  // Metering & data quality page where they belong.
  const ll = landlordMeterCounts(siteId)
  const elecLine = ll.electricity > 0
    ? `${ll.electricity} Landlord meter${ll.electricity === 1 ? '' : 's'}${monthsCovered ? ` · 12 mo CY25` : ''}`
    : 'no landlord meters'
  const gasLine = ll.gas > 0
    ? `${ll.gas} Landlord MPRN${ll.gas === 1 ? '' : 's'} · 12 mo CY25`
    : 'none on site'
  const waterLine = ll.water != null && ll.water > 0
    ? `${ll.water} landlord water meter${ll.water === 1 ? '' : 's'} · CY25`
    : 'meter inventory pending'
  const wasteLine = ll.waste != null && ll.waste > 0
    ? `${ll.waste} collection point${ll.waste === 1 ? '' : 's'} · CY25${waste?.contractor ? ` · ${waste.contractor}` : ''}`
    : (waste?.contractor || 'contractor TBC')

  // Chris ask 2026-05-24: per-site imagery on the right (was: 14-field
  // Site facts dl from Brief 15 Part 1). Hero photo / aerial / site plan
  // toggle on top + 8 most important facts compressed to a tight strip
  // below.
  const a = site.archetype || {}
  const id = site.identity || {}
  const assets = SITE_ASSETS[siteId] || { hero: null, aerial: null, sitePlan: null }
  /* Chris ask 2026-06-02 (revised): hero photos AND aerial shots use
     `cover` so they fill the window edge-to-edge - mild edge-crop is
     fine for both (heroes are 3:2 promo shots, aerials are top-downs
     where the village should be centred and crop-tolerant). Site
     plans stay `contain` because they're technical drawings - title
     blocks and site extent must read fully. Some current aerials are
     zoomed too far out; those will need re-shooting so the village
     fills the frame properly. */
  const views = [
    assets.hero      && { key: 'hero',   label: 'Photo',     file: assets.hero,      fit: 'cover' },
    assets.aerial    && { key: 'aerial', label: 'Aerial',    file: assets.aerial,    fit: 'cover' },
    assets.sitePlan  && { key: 'plan',   label: 'Site plan', file: assets.sitePlan,  fit: 'contain' },
  ].filter(Boolean)
  const [imgView, setImgView] = useState(views[0]?.key || 'hero')
  const activeView = views.find((v) => v.key === imgView) || views[0]

  /* Chris ask 2026-05-24 (post-imagery): a "View metadata" toggle that
     slides a card across the square image, revealing the deeper Westbrook
     site profile (units, occupancy, phasing, amenities, system spec).
     Keeps the page calm - energy/water/waste own the tiles, but every
     Westbrook fact we have is one click away. */
  const [metaOpen, setMetaOpen] = useState(false)

  /* Chris ask 2026-05-24: metadata icon strip below the H1.
     Six summary fields with categorical icons - physical/structural
     (GIA · Phases · Units) + strategy (Heating · Power · Solar).
     Classifies the freeform archetype strings into clean categories. */
  const heatRaw = (a.primary_heating || '').toLowerCase()
  const heatStrat =
    heatRaw.includes('mix')        ? { label: 'Hybrid', icon: Wind } :
    heatRaw.includes('ashp') && heatRaw.includes('gas') ? { label: 'Hybrid (gas + ASHP)', icon: Wind } :
    heatRaw.includes('gshp') || heatRaw.includes('ashp') ? { label: 'Electric (heat pump)', icon: Zap } :
    heatRaw.includes('gas')        ? { label: 'Gas', icon: Flame } :
    heatRaw.includes('landlord')   ? { label: 'Landlord (office)', icon: Activity } :
    heatRaw ? { label: a.primary_heating, icon: Activity } :
              { label: '-', icon: Activity }

  const gridRaw = (a.grid_type || '').toLowerCase()
  const powerStrat =
    gridRaw.includes('bulk')       ? { label: 'Bulk (microgrid)', icon: Activity } :
    gridRaw.includes('bno')        ? { label: 'BNO', icon: Activity } :
    gridRaw.includes('dno') || gridRaw.includes('individual') ? { label: 'Individual MPANs', icon: Activity } :
    gridRaw.includes('nhh') || gridRaw.includes('office') ? { label: 'Single NHH (office)', icon: Activity } :
    gridRaw ? { label: a.grid_type, icon: Activity } :
              { label: '-', icon: Activity }

  const solarStrat =
    a.solar_pv_kwp ? { label: `${a.solar_pv_kwp} kWp`, icon: Sun, on: true } :
                     { label: 'None', icon: Sun, on: false }

  // Phases - "{operational} of {planned}" if both exist; planned comes
  // from phasing.phases[].length, operational from identity.operational_phases.
  const phasesPlanned = site.phasing?.phases?.filter((p) => p.units > 0).length ||
                        site.phasing?.phases?.length || null
  const phasesOp = id.operational_phases ?? null
  const phasesLabel = (phasesOp != null && phasesPlanned != null)
    ? `${phasesOp} of ${phasesPlanned} ops`
    : (phasesOp != null ? `${phasesOp} ops` : '-')

  const metadataIcons = [
    { icon: Maximize2, label: 'GIA',     value: id.total_gia_m2 != null ? `${fmt(id.total_gia_m2)} m²` : '-' },
    { icon: Layers,    label: 'Phases',  value: phasesLabel },
    { icon: Users,     label: 'Units',   value: (id.completed != null && id.total_units != null) ? `${id.completed} of ${id.total_units}` : (id.completed ?? '-') },
    { icon: heatStrat.icon,  label: 'Heating', value: heatStrat.label },
    { icon: powerStrat.icon, label: 'Power',   value: powerStrat.label },
    { icon: solarStrat.icon, label: 'Solar',   value: solarStrat.label, dim: !solarStrat.on },
  ]

  return (
    /* Chris ask 8 Jun (v3): the v2 fix locked SiteHeader at the top
       of the page as a full-width row above the body grid. Worked
       for "lands at same vertical position as other tabs" but left
       a wide empty band right of the H1 (the row stretches to the
       container width but the H1 only fills the left ~40%) and
       squashed the photo's vertical real-estate.
       v3: SiteHeader sits INSIDE the left column of the 2-col grid,
       above the 4 tiles. Image on the right column expands UP to
       fill the full grid height (matches the left column's
       SiteHeader + tiles stack). No empty band; image gets ~120 px
       taller. SiteHeader is still at the top-LEFT corner of the
       page where Chris wants it. The horizontal position of the
       icon + H1 still matches the other tabs (same .page padding +
       Rule 11 container alignment). */
    <div className="page">
      <div className="site-overview-body">
        <div className="site-overview-left">
          <SiteHeader site={site} />
          {/* 4 utility tiles - vertical stack, generous breathing room. */}
          <div className="site-overview-tiles-col">
            <MetricTile iconUrl="/icons/ivg-nza-icons_elec-solid.svg" label="Electricity (landlord)" value={fmtCompact(cy25?.landlord_kwh)} unit="kWh" status={elecStatus(siteId)} why={elecLine} />
            <MetricTile iconUrl="/icons/ivg-nza-icons_gas-solid.svg"         label="Gas (landlord)"         value={fmtCompact(rec?.eco_gas_kwh)} unit="kWh" status={gasStatus(siteId)} why={gasLine} />
            <MetricTile iconUrl="/icons/ivg-nza-icons_water.svg"          label="Water"                  value={fmtCompact(water?.consumption_m3)} unit="m³" status={waterStatus(siteId)} why={waterLine} />
            <MetricTile iconUrl="/icons/ivg-nza-icons_recycling.svg"      label="Waste"                  value={fmt(fmt1(waste?.tonnage_total))} unit="t" status={wasteStatus(siteId)} why={wasteLine} />
          </div>
        </div>

        {/* RIGHT: BIG image pushed to the top, fills the remaining
            horizontal space and the full body height. */}
        <div className="site-imagery-big">
          {activeView ? (
            <img
              src={`/sites/${siteId}/${activeView.file}`}
              alt={`${site.display_name} - ${activeView.label}`}
              className={`site-imagery-img site-imagery-img-${activeView.fit}`}
              loading="lazy"
            />
          ) : (
            <div className="site-imagery-empty-inner">
              No imagery on file for this site.
            </div>
          )}

          {/* Photo / Aerial / Site plan toggle - top-left overlay. */}
          {views.length > 1 && (
            <div className="site-imagery-toggle-overlay">
              {views.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setImgView(v.key)}
                  className={`site-imagery-pill ${imgView === v.key ? 'active' : ''}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* View details pill - top-right overlay. Sits above both
              image and slide-over so it's always tappable. */}
          <button
            type="button"
            onClick={() => setMetaOpen((v) => !v)}
            className="site-imagery-info-btn"
            aria-label={metaOpen ? 'Hide site metadata' : 'View site metadata'}
            aria-expanded={metaOpen}
          >
            {metaOpen ? <X size={16} strokeWidth={2} /> : <Info size={16} strokeWidth={2} />}
            <span>{metaOpen ? 'Close' : 'View details'}</span>
          </button>

          {/* Chris ask 2026-05-24 (revised, again): chip strip removed
              from the image bottom - the 6 icons live inside the
              slide-over now (header of the panel) so the photo reads
              cleanly without metadata chrome on top of it. */}

          {/* Slide-over metadata panel - always in the DOM; the
              `.is-open` class drives a CSS transform transition. The
              6 metadata icons get a 3×2 chip header at the top of the
              panel so it doesn't read as a dry list of dts. */}
          <div
            className={`site-imagery-meta-overlay ${metaOpen ? 'is-open' : ''}`}
            aria-hidden={!metaOpen}
          >
            <SiteMetadataPanel site={site} metadataIcons={metadataIcons} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* Chris ask 2026-05-24 (post-imagery): slide-over metadata panel.
   Lives inside the 320×320 imagery card; "View details" toggle swipes
   it across the image. Four compact sections - Identity, Phasing,
   Amenities, Systems - exposing every Westbrook fact we have in sites.json
   without cluttering the main page. */
function SiteMetadataPanel({ site, metadataIcons = [] }) {
  const id = site.identity || {}
  const a = site.archetype || {}
  const phasing = site.phasing || {}
  const phases = (phasing.phases || []).filter((p) => p.units > 0)

  // Compact rows - value first, label below. Skip rows with no value
  // (prevents the panel from filling with em-dashes).
  const idRows = [
    id.years_built && ['Built',        id.years_built],
    id.total_units != null && ['Units (planned)', id.total_units],
    id.completed != null && ['Completed', id.completed],
    id.occupancy_pct != null && ['Occupancy', `${id.occupancy_pct}%`],
    id.void != null && ['Void', id.void],
    id.total_gia_m2 != null && ['Total GIA', `${fmt(id.total_gia_m2)} m²`],
    id.landlord_gia_m2 != null && ['Landlord GIA', `${fmt(id.landlord_gia_m2)} m²`],
    id.resi_gia_m2 != null && ['Resident GIA', `${fmt(id.resi_gia_m2)} m²`],
    id.management_entity && ['Managed by', id.management_entity],
  ].filter(Boolean)

  const sysRows = [
    a.primary_heating && ['Heating',      a.primary_heating],
    a.hot_water       && ['Hot water',    a.hot_water],
    a.heat_network    && ['Heat network', a.heat_network],
    a.chp             && ['CHP',          a.chp],
    a.grid_type       && ['Grid',         a.grid_type],
    a.metering_arrangement && ['Metering', a.metering_arrangement],
    a.capacity_mva != null && ['Capacity', `${a.capacity_mva} MVA`],
    a.solar_pv_kwp != null && ['Solar PV', `${a.solar_pv_kwp} kWp`],
    a.battery         && ['Battery',      a.battery],
    a.ev_chargers     && ['EV chargers',  a.ev_chargers],
  ].filter(Boolean)

  const amenRows = [
    a.village_centre && ['Village centre', a.village_centre],
    a.restaurant     && ['Restaurant',     a.restaurant],
    a.pool_spa       && ['Pool / spa',     a.pool_spa],
  ].filter(Boolean)

  return (
    <div className="site-meta-panel">
      <div className="site-meta-panel-eyebrow">Site profile · indicative</div>

      {metadataIcons.length > 0 && (
        <div className="site-meta-panel-chips">
          {metadataIcons.map((m) => {
            const Icon = m.icon
            return (
              <div className={`panel-chip ${m.dim ? 'dim' : ''}`} key={m.label}>
                <span className="panel-chip-icon">
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <div className="panel-chip-text">
                  <div className="panel-chip-label">{m.label}</div>
                  <div className="panel-chip-value">{m.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {idRows.length > 0 && (
        <section className="site-meta-panel-section">
          <h4>Identity</h4>
          <dl>
            {idRows.map(([k, v]) => (
              <div key={k} className="site-meta-panel-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {phases.length > 0 && (
        <section className="site-meta-panel-section">
          <h4>Phasing {phasing.open_year ? `· opened ${phasing.open_year}` : ''}</h4>
          <ul className="site-meta-panel-phases">
            {phases.map((p) => (
              <li key={p.phase}>
                <span>Phase {p.phase}</span>
                <span>{p.units} units</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sysRows.length > 0 && (
        <section className="site-meta-panel-section">
          <h4>Systems</h4>
          <dl>
            {sysRows.map(([k, v]) => (
              <div key={k} className="site-meta-panel-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {amenRows.length > 0 && (
        <section className="site-meta-panel-section">
          <h4>Amenities</h4>
          <dl>
            {amenRows.map(([k, v]) => (
              <div key={k} className="site-meta-panel-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}

/* Brief 24 Part 4a - Monthly overview component. Lives at the top of
   SiteEnergy. Left: 12-month grouped bars showing gas + electricity
   kWh by calendar month for CY25, palette from --metric-* tokens (gas
   NZA deep red, electricity rich amber-gold). Right: donut showing
   annual split with total in the centre. Top: 3 headline figures
   (annual gas / electricity / total) + an HH-availability chip. */
function SiteEnergyMonthlyOverview({ siteId, readyCount, pendingCount, totalHhMpans }) {
  /* Chris ask 9 Jun - fluid donut size matches the CSS clamp on
     .site-energy-donut-wrap so the wrapper and the Recharts integer-
     pixel PieChart never disagree. */
  const donutPx = useFluidSize(280, 0.22, 380)
  /* Brief 24.6 Part 3a + Chris ask 8 Jun - Recharts native animation
     on bars and the donut. With StrictMode dropped (see main.jsx),
     Recharts 3.x's animation system works against stable refs and
     the strand bug no longer triggers, so we can let `isAnimationActive`
     default to true. `useReducedMotion()` short-circuits to false
     when the OS-level reduced-motion preference is on. A fresh
     entrance plays on every mount; SiteChapterFade's keyed re-mount
     gives a fresh mount whenever the user navigates between sites
     or sub-tabs. */
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  const monthlyRaw = electricityMonthly[siteId]?.monthly || []
  /* CY25 = months whose `month` field starts with "2025-". */
  const cy25 = monthlyRaw.filter((m) => (m.month || '').startsWith('2025-'))
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const data = MONTH_LABELS.map((lbl, i) => {
    const monthKey = `2025-${String(i + 1).padStart(2, '0')}`
    const row = cy25.find((m) => m.month === monthKey) || {}
    return {
      month: lbl,
      electricity: Math.round(((row.elec_landlord || 0) + (row.hh || 0) + (row.nhh || 0))),
      gas: Math.round(row.gas || 0),
    }
  })
  const totalElec = data.reduce((s, d) => s + d.electricity, 0)
  const totalGas  = data.reduce((s, d) => s + d.gas, 0)
  const grandTotal = totalElec + totalGas
  const donut = [
    { name: 'Electricity', value: totalElec, fill: 'var(--metric-electricity)', iconUrl: '/icons/ivg-nza-icons_elec-solid.svg' },
    { name: 'Gas',         value: totalGas,  fill: 'var(--metric-gas)',         iconUrl: '/icons/ivg-nza-icons_gas-solid.svg' },
  ].filter((d) => d.value > 0)

  /* HH availability chip - colour codes the readiness state at a glance. */
  const hhChip = readyCount > 0
    ? { label: `Half-hourly: ${readyCount} meter${readyCount === 1 ? '' : 's'}`, tone: 'green' }
    : pendingCount > 0
      ? { label: `Half-hourly: pending Stark export`, tone: 'amber' }
      : totalHhMpans > 0
        ? { label: `Half-hourly: pending`, tone: 'amber' }
        : { label: `No half-hourly meter on this site`, tone: 'muted' }
  const HH_TONE_BG = { green: 'rgba(124,196,112,0.16)', amber: 'rgba(232,161,60,0.16)', muted: 'rgba(31, 51, 40,0.06)' }
  const HH_TONE_FG = { green: '#3F8C3A', amber: '#A86F1D', muted: 'rgba(31, 51, 40,0.55)' }

  /* Brief 24 r3: "a nice big bar chart, a nice big donut chart, a
     little bit of breathing space between the two. Don't be afraid
     to do that." Overview is now its own tab - the bars + donut
     share full page width with a comfortable 80px gutter, the bar
     chart claims ~360px tall, the donut sits at 320px. Headline
     figures + HH chip span the top across the full width. */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Headline strip - Brief 24 r4 Chris ask: gas + electricity icons
          next to the figures so it's iconographically explicit at the
          top of the page.
          Brief 24.8 Part 3 ConsumptionBreakdownCard removed 8 Jun -
          the Portfolio Consumption chart carries the landlord/resident
          story portfolio-wide; duplicating it here ate page real-
          estate without adding information density worth the space.
          For TBC sites (Marston Hill/Penrith Community/Pennington Prep) the data-
          quality story now lives only on Meters + the Portfolio
          chart's TBC bar treatment. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
        <HeadlineFigure
          label="Electricity" value={fmtKwh(totalElec)} colour="var(--metric-electricity)"
          iconUrl="/icons/ivg-nza-icons_elec-solid.svg"
        />
        <HeadlineFigure
          label="Gas" value={fmtKwh(totalGas)} colour="var(--metric-gas)"
          iconUrl="/icons/ivg-nza-icons_gas-solid.svg"
        />
        <HeadlineFigure
          label="Total" value={fmtKwh(grandTotal)} colour="var(--color-theme-base)"
        />
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 999,
          background: HH_TONE_BG[hhChip.tone], color: HH_TONE_FG[hhChip.tone],
          fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
        }}>{hhChip.label}</span>
      </div>

      {/* Bars + donut - bigger again for r4 because Chris ask said
          "really make use of the vertical space as well".
          Chris ask 9 Jun: hoisted inline grid/heights to the
          .site-energy-bars-donut + .site-energy-bars-wrap +
          .site-energy-donut-wrap CSS classes so the fluid layout
          tokens (--site-donut-col-w, --site-energy-gutter,
          --site-chart-bar-h) carry the responsive scaling, and the
          @media (max-width: 900px) stack rule reflows for accidental
          tablet/phone access. */}
      <div className="site-energy-bars-donut">
        <div className="site-energy-bars-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 14, left: 0 }} barCategoryGap="22%">
              <CartesianGrid stroke="rgba(31, 51, 40,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(31, 51, 40,0.6)', fontSize: 12, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v/1e3)}k` : v}
                tick={{ fill: 'rgba(31, 51, 40,0.55)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} width={52} />
              <Tooltip
                cursor={{ fill: 'rgba(31, 51, 40,0.04)' }}
                contentStyle={{ background: 'var(--color-nza-cream)', border: '1px solid rgba(31, 51, 40,0.15)', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 12 }}
                labelStyle={{ color: 'var(--color-theme-base)', fontWeight: 600 }}
                formatter={(v, name) => [`${fmtKwh(v)}`, name]}
              />
              <Bar dataKey="electricity" name="Electricity" fill="var(--metric-electricity)" radius={[3, 3, 0, 0]}
                isAnimationActive={animate} animationDuration={700} animationEasing="ease-out" />
              <Bar dataKey="gas"         name="Gas"         fill="var(--metric-gas)"         radius={[3, 3, 0, 0]}
                isAnimationActive={animate} animationDuration={700} animationEasing="ease-out" animationBegin={120} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut - bigger again. r4: 380×380 design, now fluid via
            useFluidSize(280, 22vw, 380) so the PieChart integer-pixel
            props track viewport. */}
        <div className="site-energy-donut-wrap">
          {donut.length > 0 ? (
            <>
              <PieChart width={donutPx} height={donutPx}>
                {/* Chris ask 8 Jun - donut sweeps circularly on mount.
                    Recharts native animation now works with StrictMode
                    removed; the empty-paths-on-mount strand bug
                    (previously documented in Brief 13) no longer
                    triggers. `animationBegin={200}` lets the bars
                    start growing before the donut spin kicks in,
                    matching the brief's "structure-first then accent"
                    rhythm.
                    Chris ask 9 Jun: inner/outer radii proportional to
                    donutPx (110/380 = 0.289, 170/380 = 0.447) so ring
                    thickness stays consistent at every viewport. */}
                <Pie data={donut} dataKey="value" innerRadius={Math.round(donutPx * 0.289)} outerRadius={Math.round(donutPx * 0.447)}
                  stroke="var(--color-nza-cream)" strokeWidth={4}
                  startAngle={90} endAngle={-270}
                  isAnimationActive={animate} animationDuration={800} animationBegin={200}>
                  {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
              <div aria-hidden style={{ position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 600,
                  letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(31, 51, 40,0.55)' }}>Total CY25</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400,
                  color: 'var(--color-theme-base)', lineHeight: 1.1, marginTop: 8 }}>{fmtMwhCompact(grandTotal)}</span>
              </div>
              {/* Chris ask 8 Jun (v2) - brand icons replace the colour
                  squares; tint matches the donut segment fill. Icons
                  bumped 18 -> 36 px so they really stand out. */}
              <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: 28,
                fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(31, 51, 40,0.75)' }}>
                {donut.map((d) => (
                  <span key={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ScopeIcon url={d.iconUrl} tint={d.fill} size={36} />
                    {d.name} {Math.round((d.value / grandTotal) * 100)}%
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'rgba(31, 51, 40,0.55)', fontSize: 12, fontStyle: 'italic' }}>No CY25 monthly data.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* Brief 24.8 Part 3 ConsumptionBreakdownCard removed entirely
   8 Jun. The portfolio Consumption chart carries the landlord/
   resident split portfolio-wide; surfacing it again on every
   site Energy page just duplicated the information at the cost
   of vertical real-estate on the most-visited site surface. The
   pipeline methodology fields (total_site_kwh / landlord_kwh /
   resident_kwh / data_quality_flag) remain populated in
   reconciliation.json and feed PortfolioEnergy.jsx - they're
   not deleted, just no longer rendered per-site. Future surface
   for TBC data-quality at site level could live on the Meters
   tab if needed. */

function HeadlineFigure({ label, value, colour, iconUrl }) {
  /* Brief 24 r4 Chris ask: gas + electricity icons next to the
     headlines so the page is iconographically explicit about what
     we're looking at, even before the bars read. Icons mask-painted
     in the metric colour. Chris ask 8 Jun: bumped 30 -> 60 px so
     the icons really stand out above the bar chart. */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {iconUrl && (
        <span aria-hidden style={{
          display: 'inline-block',
          width: 60, height: 60,
          flex: '0 0 60px',
          backgroundColor: colour,
          WebkitMaskImage: `url(${iconUrl})`,
          maskImage: `url(${iconUrl})`,
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center', maskPosition: 'center',
          WebkitMaskSize: 'contain', maskSize: 'contain',
        }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(31, 51, 40,0.55)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: colour, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    </div>
  )
}
function fmtKwh(n) {
  if (typeof n !== 'number' || !isFinite(n) || n === 0) return '-'
  if (n >= 1e6) return `${(n/1e6).toFixed(2)} GWh`
  if (n >= 1e3) return `${(n/1e3).toFixed(0)} MWh`
  return `${Math.round(n)} kWh`
}
function fmtMwhCompact(n) {
  if (typeof n !== 'number' || !isFinite(n) || n === 0) return '-'
  if (n >= 1e6) return `${(n/1e6).toFixed(2)} GWh`
  return `${(n/1e3).toFixed(0)} MWh`
}

/* Module-level cache so Energy's `view` (overview / granular / daily /
   duration / heatmap / metering) survives a SiteChapterFade key-remount
   when the user navigates between sites - see comment inside SiteEnergy. */
let _lastEnergyView = 'overview'

function SiteEnergy({ siteId }) {
  /* Brief 24 Part 4 r2 (Chris ask 4 Jun, after the first pass left the
     monthly overview unbuilt): "Remove any mention of half-hourly
     load. First thing I want to see is monthly data for gas and
     electricity." Built inline below - Monthly bars left + donut
     right, CY25 figures from electricity_monthly.json. The HH
     inspector still appears underneath when data exists, but it no
     longer hogs the title bar. */
  const allMpans = (hhIndex?.mpans || []).filter((m) => m.site_id === siteId)
  const readyMpans = allMpans.filter((m) => m.data_status === 'ready')
  const pendingMpans = allMpans.filter((m) => m.data_status === 'pending')

  const [activeMpan, setActiveMpan] = useState(readyMpans[0]?.mpan || null)
  const [hhData, setHhData] = useState(null)
  const [hhLoading, setHhLoading] = useState(false)

  // Dynamic-import the per-MPAN JSON only when needed. Vite code-splits
  // these so the bundle stays small until the user opens this tab.
  useEffect(() => {
    if (!activeMpan) {
      setHhData(null)
      return
    }
    setHhLoading(true)
    let cancelled = false
    import(`@pipeline-data/half_hourly/${activeMpan}.json`)
      .then((mod) => {
        if (cancelled) return
        setHhData(mod.default || mod)
        setHhLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(`Failed to load HH data for ${activeMpan}:`, err)
        setHhData(null)
        setHhLoading(false)
      })
    return () => { cancelled = true }
  }, [activeMpan])

  /* Brief 24.6 Part 1 - SiteEnergy data-refresh bug fix.
     `useState(readyMpans[0]?.mpan)` only fires on first mount, so
     when the user navigates Penrith Community → Austin in the sidebar the
     prop changes but the same SiteEnergy instance reconciles and
     keeps Penrith Community's `activeMpan` (and therefore Penrith Community's
     loaded `hhData`) on screen. Reset both whenever `siteId`
     changes; the HH-load effect above then runs with the fresh
     MPAN and pulls the new site's data.

     Deliberately only `siteId` in the dep array - `readyMpans` is a
     new reference every render and would loop; the fresh array is
     captured via closure on this run. The `view` sub-tab state
     stays put because Chris wants the sub-tab to persist across
     site navigation. */
  useEffect(() => {
    setActiveMpan(readyMpans[0]?.mpan || null)
    setHhData(null)
    setHhLoading(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const readyCount = readyMpans.length
  const totalHhMpans = allMpans.length

  /* Brief 24 Part 4 r3 (Chris ask 4 Jun, after r2 left the bars + HH
     inspector always visible together): tabs at the top, full-screen
     views, no "Half-hourly inspector" wrapper. Overview is the
     monthly bars + donut; HH tabs share a meter selector strip and
     render full-height below.
     Chris ask 8 Jun - Energy sub-tab now persists across site
     navigation (Penrith Community Heat Map → Beechgrove Primary School = Beechgrove Primary School
     Heat Map). The previous behaviour reset to 'overview' because
     SiteChapterFade's keyed re-mount on siteId change wiped the
     local `view` state. Lifting `_lastEnergyView` to module scope
     means subsequent mounts re-initialise from whatever the user
     last picked. Initialiser reads the module value once; the
     useEffect keeps it in sync so the next mount sees fresh state. */
  const [view, setView] = useState(() => _lastEnergyView)
  useEffect(() => { _lastEnergyView = view }, [view])
  const hhAvailable = readyCount > 0

  /* Brief 24 r4 follow-up (Chris ask 4 Jun): when you navigate from a
     ready-HH site to a pending-HH site (e.g. Eldswell → Aldergate SEN)
     while a granular view is active, SiteEnergy doesn't remount -
     `view` stayed on "granular". The pill rendered selected-looking
     (coral fill) but the content area showed the pending notice,
     which read like a stuck loader. Auto-snap back to Overview when
     the current view becomes unavailable for the new site. */
  useEffect(() => {
    if (!hhAvailable && view !== 'overview') setView('overview')
  }, [hhAvailable, view])

  const ctx = hhData ? {
    hhData: hhData.hh_data || [],
    startDate: hhData.start_date || '2025-01-01',
    endDate: hhData.end_date || hhData.start_date,
    stats: hhData.stats || {},
    monthly: hhData.monthly || {},
    dailyProfile: hhData.daily_profile || {},
    intervalHours: hhData.interval_hours || 0.5,
    yearsCovered: hhData.years_covered || 1,
  } : null

  /* Chris ask (2026-05-24, post-Brief-15): drop the outer
     Monthly/Half-hourly toggle. Monthly already lives as a tab inside
     LoadInspector (Overview / Time Series / Daily Profile / Monthly /
     Duration / Heat Map / Data Quality), so the outer toggle was
     duplicative. Site Energy now always renders the LoadInspector
     (or the pending notice for sites without HH data). Trade-off
     surfaced to Chris: 3 pending-HH sites (Bramshott + 2 Aldergate SEN
     meters) + Edwalton (no HH meter at all) now show only the pending
     notice - they no longer fall back to the Ecotricity monthly chart.
     EnergyChart import retired since this is its only consumer. */

  /* Chris ask 5 Jun r2: site header + pill selector on the SAME line.
     SiteHeader's right slot carries the pill row so the icon + name
     and the page tabs sit alongside each other rather than stacked. */
  const site = sites[siteId]

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SiteHeader
        site={site}
        right={<SiteEnergyTabBar active={view} onChange={setView} hhAvailable={hhAvailable} />}
      />

      {view === 'overview' && (
        <SiteEnergyMonthlyOverview
          siteId={siteId}
          readyCount={readyCount}
          pendingCount={pendingMpans.length}
          totalHhMpans={totalHhMpans}
        />
      )}

      {view !== 'overview' && (
        <SiteEnergyHHView
          view={view}
          ctx={ctx}
          loading={hhLoading}
          readyMpans={readyMpans}
          pendingCount={pendingMpans.length}
          totalHhMpans={totalHhMpans}
          activeMpan={activeMpan}
          setActiveMpan={setActiveMpan}
        />
      )}
    </div>
  )
}

const SITE_ENERGY_VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'granular', label: 'Granular data',  hhRequired: true },
  { id: 'daily',    label: 'Daily profile',  hhRequired: true },
  { id: 'duration', label: 'Duration curve', hhRequired: true },
  { id: 'heatmap',  label: 'Heat map',       hhRequired: true },
]

function SiteEnergyTabBar({ active, onChange, hhAvailable }) {
  /* Brief 24 r4 r2 Chris ask 4 Jun: EOC-style segmented control. The
     whole row reads as one solid container - a muted track with all
     five pills inside it. The active state is a single coral pill
     that SLIDES between positions via framer-motion's layoutId, so
     switching tabs feels like one piece of UI moving rather than five
     buttons changing state independently. */
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
      <div role="tablist" aria-label="Site energy views" style={{
        display: 'inline-flex',
        background: 'rgba(31, 51, 40,0.06)',
        borderRadius: 999,
        padding: 4,
        border: '1px solid rgba(31, 51, 40,0.05)',
      }}>
        {SITE_ENERGY_VIEWS.map((v) => {
          const isActive = active === v.id
          const isDisabled = v.hhRequired && !hhAvailable
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled || undefined}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(v.id)}
              title={isDisabled ? 'No half-hourly data at this site' : undefined}
              style={{
                position: 'relative',
                /* Chris ask r2: drop font + padding so the row sits in
                   the same scale as the secondary "Overview Energy
                   Carbon..." nav above it, rather than dwarfing it. */
                padding: '5px 14px',
                background: 'transparent',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-caption)', fontWeight: 500, letterSpacing: 0.3,
                color: isActive ? 'var(--color-nza-cream)'
                       : isDisabled ? 'rgba(31, 51, 40,0.25)'
                       : 'rgba(31, 51, 40,0.62)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'color 220ms ease',
              }}
            >
              {/* Sliding coral pill - only the active button renders it;
                  framer-motion's shared layoutId animates its move from
                  one button to the next. */}
              {isActive && (
                <motion.span
                  aria-hidden
                  layoutId="site-energy-tab-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--color-nza-coral)',
                    borderRadius: 999,
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{v.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SiteEnergyHHView({ view, ctx, loading, readyMpans, pendingCount, totalHhMpans, activeMpan, setActiveMpan }) {
  if (totalHhMpans === 0) {
    return (
      <div style={{
        padding: 36, textAlign: 'center',
        fontFamily: 'var(--font-body)', fontSize: 14,
        color: 'rgba(31, 51, 40,0.55)',
        background: 'rgba(31, 51, 40,0.03)',
        borderRadius: 10,
      }}>
        No half-hourly meter on this site. Ecotricity monthly billing is recorded but no HH meter is installed.
      </div>
    )
  }
  if (!ctx && readyMpans.length === 0) {
    return (
      <div style={{
        padding: 36, textAlign: 'center',
        fontFamily: 'var(--font-body)', fontSize: 14,
        color: 'rgba(31, 51, 40,0.55)',
        background: 'rgba(31, 51, 40,0.03)',
        borderRadius: 10,
      }}>
        Half-hourly data is pending. The Stark export for this site hasn't been pulled yet.
      </div>
    )
  }
  if (loading || !ctx) {
    return (
      <div style={{
        padding: 36, textAlign: 'center',
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'rgba(31, 51, 40,0.55)',
      }}>
        Loading half-hourly data...
      </div>
    )
  }

  /* Granular AND Heat map views - pre-clamp to CY25 so the chart only
     shows the calendar year Westbrook cares about (Chris ask 5 Jun: 'on the
     heat map, can we just show CY25 and filter out the other stuff').
     Daily profile and Duration curve keep the full dataset because
     aggregate views benefit from the longer time range. */
  const cy25Ctx = clampCtxToYear(ctx, 2025)
  const eyebrowCtx = (view === 'granular' || view === 'heatmap') ? cy25Ctx : ctx

  /* Eyebrow strip: meter selector + dataset metadata. Subordinate to
     the chart below; the chart claims the page. */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0 }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: 14, paddingBottom: 4,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10, fontWeight: 600,
          letterSpacing: 1.2, textTransform: 'uppercase',
          color: 'rgba(31, 51, 40,0.5)',
        }}>Electric only{readyMpans.length > 1 ? ` · ${readyMpans.length} meters` : ''}</span>

        {readyMpans.length > 1 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {readyMpans.map((m) => {
              const isActive = m.mpan === activeMpan
              return (
                <button
                  key={m.mpan}
                  type="button"
                  onClick={() => setActiveMpan(m.mpan)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-nza-coral)' : 'rgba(31, 51, 40,0.12)',
                    background: isActive ? 'rgba(232, 116, 60,0.10)' : 'transparent',
                    color: isActive ? 'var(--color-nza-coral)' : 'rgba(31, 51, 40,0.7)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11, fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                  }}
                >{m.meter_label || m.mpan}</button>
              )
            })}
          </div>
        )}

        {pendingCount > 0 && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11, color: 'rgba(31, 51, 40,0.5)',
            fontStyle: 'italic',
          }}>{pendingCount} more meter{pendingCount === 1 ? '' : 's'} pending Stark export</span>
        )}

        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-body)',
          fontSize: 11, color: 'rgba(31, 51, 40,0.45)',
          fontVariantNumeric: 'tabular-nums',
        }}>{eyebrowCtx.startDate} → {eyebrowCtx.endDate}</span>
      </div>

      {/* Brief 24 r4 r2 - CHART HEIGHT BUG. The previous fix gave the
         wrapper an explicit `height: 560` but kept it as a regular
         block element, so TimeSeriesView's own internal `flex: 1`
         chain still bottomed out (the chart wrapper inside the view
         has `flex: 1, minHeight: 200`, which only resolves to a
         definite pixel height when its parent is a flex container).
         Result: chart wrapper was 200px minHeight but Recharts read
         the height as 0 because minHeight isn't a definite height.
         Fix: make THIS wrapper a flex column container. The view's
         outer `flex: 1` then grows to fill 560px, and the chart
         wrapper's `flex: 1` resolves cleanly. */}
      <div style={{
        height: view === 'heatmap' ? 'auto' : 560,
        minHeight: view === 'heatmap' ? 420 : undefined,
        display: 'flex', flexDirection: 'column',
      }}>
        {view === 'granular' && <TimeSeriesView ctx={cy25Ctx} />}
        {view === 'daily'    && <DailyProfileView ctx={ctx} />}
        {view === 'duration' && <DurationCurveView ctx={ctx} />}
        {view === 'heatmap'  && <HeatMapView ctx={cy25Ctx} />}
      </div>
    </div>
  )
}

/* Brief 24 r4 - Chris ask: "When we get to granular data, we only
   want to see calendar year 2025, so remove any mention of months
   before and after." Slice the HH dataset down to the year's days
   so the TimeSeriesView's month jumps + scrubber only see CY25. */
function clampCtxToYear(ctx, year) {
  if (!ctx || !ctx.hhData?.length || !ctx.startDate) return ctx
  const PERIODS_PER_DAY = 48
  const totalDays = Math.floor(ctx.hhData.length / PERIODS_PER_DAY)
  /* Use day-counting via setDate for DST-safety. Computing day indexes
     via (ms2 - ms1) / 86400000 across a DST boundary accumulates a
     1-hour shift that nudges Math.round and leaks one day at each
     boundary - the heat map's "Dec" column at the start of CY25 was
     this in action. setDate(d.getDate()+1) honours local calendar. */
  const parseLocal = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const fmtIso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const sameYMD = (a, b) => fmtIso(a) === fmtIso(b)
  const datasetStart = parseLocal(ctx.startDate)
  const yearStart    = new Date(year, 0, 1)
  const yearEnd      = new Date(year + 1, 0, 1)
  /* Walk day by day from datasetStart to find the index of yearStart
     and yearEnd in the dataset. O(days) but the dataset is bounded. */
  let startDayIdx = 0
  let endDayIdx = totalDays
  const cursor = new Date(datasetStart)
  for (let i = 0; i <= totalDays; i += 1) {
    if (sameYMD(cursor, yearStart)) startDayIdx = i
    if (sameYMD(cursor, yearEnd))   endDayIdx   = i
    cursor.setDate(cursor.getDate() + 1)
  }
  /* If yearStart precedes datasetStart, keep startDayIdx at 0 (dataset
     already starts inside CY). If yearEnd is past the dataset, endDayIdx
     stays at totalDays. */
  if (yearStart < datasetStart) startDayIdx = 0
  if (endDayIdx <= startDayIdx) return ctx  /* dataset doesn't cover this year */
  const sliced = ctx.hhData.slice(startDayIdx * PERIODS_PER_DAY, endDayIdx * PERIODS_PER_DAY)
  const slicedStart = startDayIdx === 0 ? datasetStart : new Date(year, 0, 1)
  const slicedEnd = (() => {
    const d = new Date(slicedStart)
    d.setDate(d.getDate() + (endDayIdx - startDayIdx - 1))
    return d
  })()
  return {
    ...ctx,
    hhData: sliced,
    startDate: fmtIso(slicedStart),
    endDate: fmtIso(slicedEnd),
  }
}

/* Dead code preserved temporarily so the legacy Panel-wrapped path
   doesn't crash if it's reached from a stale state. Should never
   render under the new tab architecture. */
function _LegacyHHPanel() {
  return (
    <>
      <Panel
        title={readyCount > 0 ? 'Half-hourly inspector' : 'Half-hourly inspector - unavailable'}
        subtitle={
          readyCount > 0
            ? `${readyCount} meter${readyCount === 1 ? '' : 's'} · real Stark export`
            : (totalHhMpans > 0 ? 'Stark export pending' : 'No half-hourly meter at this site')
        }
        pad="tight"
        fullHeight
        className="site-energy-panel"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0 }}>
          {/* Meter selector for 2-MPAN sites + pending notices */}
          {(readyMpans.length > 1 || pendingMpans.length > 0) && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 2,
              flex: '0 0 auto',
            }}>
              {readyMpans.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: 'rgba(31, 51, 40,0.55)',
                  }}>
                    Meter
                  </span>
                  {readyMpans.map((m) => {
                    const isActive = m.mpan === activeMpan
                    return (
                      <button
                        key={m.mpan}
                        type="button"
                        onClick={() => setActiveMpan(m.mpan)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: isActive ? 'var(--color-nza-coral)' : 'rgba(31, 51, 40,0.12)',
                          background: isActive ? 'rgba(232, 116, 60,0.10)' : 'transparent',
                          color: isActive ? 'var(--color-nza-coral)' : 'rgba(31, 51, 40,0.7)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 11,
                          fontWeight: isActive ? 500 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {m.meter_label || m.mpan}
                      </button>
                    )
                  })}
                </div>
              )}
              {pendingMpans.length > 0 && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'rgba(31, 51, 40,0.55)',
                  fontStyle: 'italic',
                }}>
                  {pendingMpans.length} meter{pendingMpans.length === 1 ? '' : 's'} pending - Stark export not yet pulled
                </div>
              )}
            </div>
          )}

          {/* Inspector itself, or pending state */}
          {totalHhMpans === 0 ? (
            <div style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'rgba(31, 51, 40,0.55)',
              background: 'rgba(31, 51, 40,0.03)',
              borderRadius: 8,
            }}>
              No half-hourly meter on this site - Ecotricity monthly billing is recorded but no HH meter is installed.
            </div>
          ) : readyMpans.length === 0 && pendingMpans.length > 0 ? (
            <div style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'rgba(31, 51, 40,0.55)',
              background: 'rgba(31, 51, 40,0.03)',
              borderRadius: 8,
            }}>
              Half-hourly data is pending - the Stark export for this site hasn't been pulled yet.
            </div>
          ) : hhLoading ? (
            <div style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'rgba(31, 51, 40,0.55)',
            }}>
              Loading half-hourly data…
            </div>
          ) : hhData ? (
            <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <LoadInspector
                data={hhData}
                meterLabel={readyMpans.find((m) => m.mpan === activeMpan)?.meter_label}
              />
            </div>
          ) : null}
        </div>
      </Panel>
    </>
  )
}

/* Mask-tinted SVG icon for the metric rows + donut legends. Size
   defaults to 18 px (scope-dot rhythm) but most call-sites pass
   36 px now - Chris ask 8 Jun "make them much bigger, twice as big". */
function ScopeIcon({ url, tint, size = 18 }) {
  return (
    <span aria-hidden style={{
      display: 'inline-block',
      width: size, height: size,
      flex: `0 0 ${size}px`,
      backgroundColor: tint,
      WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      WebkitMaskSize: 'contain', maskSize: 'contain',
    }} />
  )
}

function SiteCarbon({ siteId, site }) {
  // Chunk 14
  // Chris ask 9 Jun - same fluid donut sizing as Energy
  const donutPx = useFluidSize(280, 0.22, 380)
  const c = carbonData.by_site?.[siteId]
  const portfolio = carbonData.portfolio || {}
  const median = (() => {
    const intensities = Object.values(carbonData.by_site || {})
      .map((s) => s.intensity_per_m2_gia)
      .filter((v) => v != null && v > 0)
      .sort((a, b) => a - b)
    if (!intensities.length) return null
    return intensities[Math.floor(intensities.length / 2)]
  })()

  if (!c) {
    return (
      <div className="page">
        <SiteHeader site={site} />
        <div className="empty-state">No carbon data available for this site.</div>
      </div>
    )
  }

  /* Chris ask 8 Jun - follow GHG Protocol scope palette:
       Scope 1 = teal green   (direct emissions)
       Scope 2 = grey         (indirect from purchased energy)
       Scope 3 = purple       (other indirect)
     Picked to match the GHG Protocol "Corporate Standard" diagram
     Chris referenced. The previous coral / teal / slate trio carried
     no semantic meaning. */
  const GHG_SCOPE_1 = '#5BB8AF'  // teal green
  const GHG_SCOPE_2 = '#9DA6AE'  // medium grey
  const GHG_SCOPE_3 = '#8576A8'  // muted purple

  const data = [
    { name: 'Scope 1 (gas)',  value: c.scope_1_tco2e,        fill: GHG_SCOPE_1 },
    { name: 'Scope 2 (elec)', value: c.scope_2_tco2e,        fill: GHG_SCOPE_2 },
    { name: 'Scope 3 Cat 13', value: c.scope_3_cat13_tco2e,  fill: GHG_SCOPE_3 },
  ]
  const total = c.total_actual_tco2e

  const intensity = c.intensity_per_m2_gia ? c.intensity_per_m2_gia * 1000 : null  // kg/m²
  const medianKg = median ? median * 1000 : null
  const diffPct = (intensity && medianKg) ? (intensity - medianKg) / medianKg * 100 : null

  return (
    <div className="page">
      <SiteHeader site={site} />
      {/* Brief 15 Part 3 - vertical-stack layout: narrow LEFT for the
          stacked scope figures + intensity table + median callout; wider
          RIGHT for the donut chart at near-full-height. Replaces the
          balanced 40fr/55fr page-2col with site-carbon-grid. */}
      <div className="site-carbon-grid">
        <Panel title="Scope breakdown" subtitle="Carbon emissions for CY2025" theme="cream">
          <div className="carbon-scopes">
            {/* Chris ask 8 Jun (v2) - scope-row icons bumped 18 -> 36 px
                to match the donut bottom legend so the left panel and
                the chart on the right speak the same visual language. */}
            <div className="carbon-row"><ScopeIcon url="/icons/ivg-nza-icons_gas-solid.svg"  tint={GHG_SCOPE_1} size={36} /><div><div className="carbon-label">Scope 1 (direct - gas)</div><div className="carbon-value">{fmt(fmt1(c.scope_1_tco2e))} <span className="carbon-unit">tCO₂e</span></div></div></div>
            <div className="carbon-row"><ScopeIcon url="/icons/ivg-nza-icons_elec-solid.svg" tint={GHG_SCOPE_2} size={36} /><div><div className="carbon-label">Scope 2 (purchased - elec landlord)</div><div className="carbon-value">{fmt(fmt1(c.scope_2_tco2e))} <span className="carbon-unit">tCO₂e</span></div></div></div>
            <div className="carbon-row"><ScopeIcon url="/icons/ivg-nza-icons_co2.svg"        tint={GHG_SCOPE_3} size={36} /><div><div className="carbon-label">Scope 3 Cat 13 (downstream leased)</div><div className="carbon-value">{fmt(fmt1(c.scope_3_cat13_tco2e))} <span className="carbon-unit">tCO₂e</span></div></div></div>
            <div className="carbon-row carbon-total"><span /><div><div className="carbon-label">Total</div><div className="carbon-value">{fmt(fmt1(total))} <span className="carbon-unit">tCO₂e</span></div></div></div>
          </div>
          <div className="carbon-intensity">
            <div><div className="carbon-il">Intensity per m²</div><div className="carbon-iv">{intensity ? intensity.toFixed(1) : '-'} <span>kg/m²</span></div></div>
            <div><div className="carbon-il">Intensity per unit</div><div className="carbon-iv">{c.intensity_per_unit ? c.intensity_per_unit.toFixed(2) : '-'} <span>t/unit</span></div></div>
          </div>
          {medianKg && intensity && (
            <div className="callout-card" style={{ marginTop: 16 }}>
              Portfolio median intensity is {medianKg.toFixed(1)} kg/m². This site is {diffPct >= 0 ? `${diffPct.toFixed(0)}% above` : `${Math.abs(diffPct).toFixed(0)}% below`} median.
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted-on-cream)' }}>
            Scope 3 Cat 5 (waste): pending BIFFA tonnage CY2025.
          </div>
        </Panel>

        <Panel title="Where it sits" subtitle="Click a segment for tooltip" theme="cream">
          {/* Brief 13 Part 2 + Chris ask 8 Jun update: two issues combined
              to make the pie invisible.
              (1) ResponsiveContainer reported width(-1)/height(-1) - confirmed
                  via the dev-server warning ("The width(-1) and height(-1)
                  of chart should be greater than 0… add a minHeight or use
                  aspect"). Fix: skip ResponsiveContainer, use PieChart with
                  explicit pixel width+height. The pie is fixed-size anyway.
              (2) The Recharts 3.x empty-paths-on-mount strand bug that
                  previously forced `isAnimationActive={false}` was caused by
                  React 19 StrictMode's dev-only double-mount writing tweens
                  to stale `<path>` refs (Pablo handoff 8 Jun). With
                  StrictMode dropped (main.jsx) the bug no longer triggers
                  and Recharts native animation works - the donut sweeps
                  circularly on mount. Fill comes from each data entry's
                  `fill` property (Recharts auto-picks it up); no `<Cell>`
                  needed.
              (Different root cause from Defect #1: there the unresolved
              percentage chain meant a min-height floor sufficed.) */}
          {/* Brief 15 Part 3 - pie bumped 420×320 → 560×480 (innerR 70→100,
              outerR 120→170) so it fills near-full-height of the right
              column. Overlay margin-top -240 (was -160) to compensate. */}
          {/* Chris ask 5 Jun r2: "numbers covered by donut, CO2 icon tiny".
              Rebuilt as a position:absolute overlay centred at exactly
              the donut's cy=45% so the infographic stack lives INSIDE
              the ring rather than being clipped by it. CO2 icon
              bumped 38 → 72px, value bumped 30 → 40px, inner radius
              bumped 100 → 120 so there's actual room for the stack. */}
          {/* Chris ask 8 Jun - carbon donut restyled to mirror the
              Energy donut's visual language:
              * Outer wrapper sized like the Energy donut (380×380 with
                480 surrounding height for legend space).
              * Overlay uses `inset: 0 + justifyContent: center` so the
                CO2 icon + number sit dead-centre vertically (was offset
                low under the old `top: 45%` percentage trick).
              * CO2 icon doubled 72 → 144 px and tinted dark navy
                (`--color-theme-base`) instead of coral — matches the
                Energy donut's number weight.
              * "Total" eyebrow removed; "tonnes of CO2" kept as the
                small unit caption below the number.
              * `startAngle={90} endAngle={-270}` sweeps CLOCKWISE from
                12 o'clock (Recharts default goes counter-clockwise from
                3 o'clock).
              * Recharts `<Legend>` replaced with the same custom
                bottom-strip legend the Energy donut uses, coloured
                via GHG Protocol palette. */}
          {/* Chris ask 9 Jun - fluid donut: PieChart integer props
              follow useFluidSize, inner/outer radii proportional so
              ring thickness stays consistent. Wrapper height stays a
              tad larger than the donut so the centre CO2 icon + number
              still sit dead-centre per Brief 24.8 layout maths. */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: Math.round(donutPx * 1.26) }}>
            <PieChart width={donutPx} height={donutPx}>
              <Pie data={data} dataKey="value" innerRadius={Math.round(donutPx * 0.289)} outerRadius={Math.round(donutPx * 0.447)}
                stroke="var(--color-nza-cream)" strokeWidth={4}
                startAngle={90} endAngle={-270}
                isAnimationActive={true} animationDuration={800} animationBegin={200}>
                {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: COLOR_THEME_BASE, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }}
                labelStyle={{ color: COLOR_THEME_BODY }}
                formatter={(v) => `${fmt(fmt1(v))} tCO₂e`}
              />
            </PieChart>

            {/* Chris ask 8 Jun (v4): both the CO2 icon and the
                number shift down so they're centred inside the
                donut, with the icon shifting more so it almost
                touches the number.
                Layout maths (480 overlay, 36 paddingBottom):
                  * available 444; stack 80 + (-12 overlap) + 34
                    + 2 + 11 = 115; stack top at (444-115)/2 = 165.
                  * Icon top y=165, bottom y=245. Number top y=233
                    (12 px overlap into the icon), centre y=250.
                    Donut centre y=240 -> number sits ~10 px below
                    donut centre, icon's centre near 205 (was 185
                    pre-v4) - both shifted down. Icon shifted ~20 px,
                    number ~6 px (icon-more, per Chris ask). */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              paddingBottom: 36,
              pointerEvents: 'none',
              textAlign: 'center',
            }}>
              <span aria-hidden style={{
                display: 'inline-block',
                width: 80, height: 80,
                marginBottom: -12,
                backgroundColor: 'rgba(31, 51, 40,0.32)',
                WebkitMaskImage: 'url(/icons/ivg-nza-icons_co2.svg)',
                maskImage: 'url(/icons/ivg-nza-icons_co2.svg)',
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                WebkitMaskSize: 'contain', maskSize: 'contain',
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 34, fontWeight: 400, lineHeight: 1,
                color: 'var(--color-theme-base)',
                fontVariantNumeric: 'tabular-nums',
              }}>{fmt(fmt1(total))}</div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                marginTop: 2,
                color: 'rgba(31, 51, 40,0.55)',
              }}>tonnes of CO₂e</div>
            </div>

            {/* Custom bottom-strip legend matching the Energy donut.
                Chris ask 8 Jun (v2) - icons bumped 18 -> 36 px;
                tint matches each scope's GHG-palette segment fill. */}
            <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 28,
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(31, 51, 40,0.75)' }}>
              {data.map((d, i) => (
                <span key={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <ScopeIcon
                    url={i === 0 ? '/icons/ivg-nza-icons_gas-solid.svg'
                       : i === 1 ? '/icons/ivg-nza-icons_elec-solid.svg'
                       :           '/icons/ivg-nza-icons_co2.svg'}
                    tint={d.fill}
                    size={36}
                  />
                  {d.name} {total > 0 ? `${Math.round((d.value / total) * 100)}%` : ''}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function SiteMeters({ siteId }) {
  const allMpans = mpanRegister[siteId] || []
  const elecMpans = allMpans.filter((m) => m.type === 'HH' || m.type === 'NHH')
  const gasMprns = allMpans.filter((m) => m.type === 'Gas')
  const water = waterData?.[siteId]

  const [elecFilter, setElecFilter] = useState('all')
  const [gasFilter, setGasFilter] = useState('landlord')

  const ELEC_FILTERS = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'landlord', label: 'Landlord', match: (c) => (c.category || '').toLowerCase().startsWith('landlord') || (c.category || '').toLowerCase().startsWith('construction') },
    { key: 'voids', label: 'Voids', match: (c) => (c.category || '').toLowerCase().startsWith('void') || (c.category || '').toLowerCase().includes('resident') },
    { key: 'inactive', label: 'Inactive', match: (c) => (c.category || '').toLowerCase().startsWith('inactive') },
  ]
  const GAS_FILTERS = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'landlord', label: 'Landlord', match: (c) => (c.category || '').toLowerCase().startsWith('landlord') },
  ]

  const elecActive = ELEC_FILTERS.find((f) => f.key === elecFilter)
  const filteredElec = elecMpans.filter((m) => elecActive.match(m))
  const gasActive = GAS_FILTERS.find((f) => f.key === gasFilter)
  const filteredGas = gasMprns.filter((m) => gasActive.match(m))

  return (
    <div className="page">
      {/* Section A - Electricity (MPANs) */}
      <Panel
        title="Electricity (MPANs)"
        subtitle={elecMpans.length ? `${elecMpans.length} MPANs - showing ${filteredElec.length}` : 'No electricity MPANs recorded'}
        actions={elecMpans.length > 0 ? (
          <div className="toggle-group">
            {ELEC_FILTERS.map((f) => (
              <button key={f.key} className={`toggle-pill ${elecFilter === f.key ? 'active' : ''}`} onClick={() => setElecFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
        pad={elecMpans.length ? 'none' : 'normal'}
        scroll={elecMpans.length > 0}
      >
        {elecMpans.length === 0 ? (
          <div className="empty-state">No electricity MPANs recorded for this site.</div>
        ) : (
          <table className="site-table">
            <thead>
              <tr>
                <th>MPAN</th>
                <th>Type</th>
                <th>Category</th>
                <th className="num">CY25 kWh</th>
                <th className="num">Months</th>
              </tr>
            </thead>
            <tbody>
              {filteredElec.map((m) => (
                <tr key={m.mpan}>
                  <td style={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{m.mpan}</td>
                  <td>{m.type}</td>
                  <td>{m.category}</td>
                  <td className="num">{fmt(m.cy25_kwh)}</td>
                  <td className="num">{m.months_covered ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Section B - Gas (MPRNs) */}
      <Panel
        title="Gas (MPRNs)"
        subtitle={gasMprns.length ? `${gasMprns.length} MPRN${gasMprns.length === 1 ? '' : 's'} - showing ${filteredGas.length}` : 'No gas supply at this site'}
        actions={gasMprns.length > 0 ? (
          <div className="toggle-group">
            {GAS_FILTERS.map((f) => (
              <button key={f.key} className={`toggle-pill ${gasFilter === f.key ? 'active' : ''}`} onClick={() => setGasFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
        pad={gasMprns.length ? 'none' : 'normal'}
      >
        {gasMprns.length === 0 ? (
          <div className="empty-state">No gas supply at this site.</div>
        ) : (
          <table className="site-table">
            <thead>
              <tr>
                <th>MPRN</th>
                <th>Category</th>
                <th className="num">CY25 kWh</th>
                <th className="num">Months</th>
              </tr>
            </thead>
            <tbody>
              {filteredGas.map((m) => (
                <tr key={m.mpan}>
                  <td style={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{m.mpan}</td>
                  <td>{m.category}</td>
                  <td className="num">{fmt(m.cy25_kwh)}</td>
                  <td className="num">{m.months_covered ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Section C - Water meters */}
      <Panel
        title="Water (Meters)"
        subtitle={water?.meters_known
          ? `${water.meters_known} meter${water.meters_known === 1 ? '' : 's'} identified · ${water.meters_with_cy2025_data ?? 0} with CY2025 data`
          : 'Meter inventory pending'}
      >
        {!water || !water.meters_known ? (
          <div className="empty-state">Meter inventory pending for this site.</div>
        ) : (
          <>
            <div className="meters-row">
              <div className="meters-cell">
                <div className="meters-label">Water company</div>
                <div className="meters-value">{water.water_company || '-'}</div>
              </div>
              <div className="meters-cell">
                <div className="meters-label">Retailer</div>
                <div className="meters-value">{water.retailer || '-'}</div>
              </div>
              <div className="meters-cell">
                <div className="meters-label">CY2025 consumption</div>
                <div className="meters-value">{water.consumption_m3 != null ? `${fmt(water.consumption_m3)} m³` : '-'}</div>
              </div>
              <div className="meters-cell">
                <div className="meters-label">Data quality</div>
                <div className="meters-value">{water.data_quality || '-'}</div>
              </div>
              <div className="meters-cell">
                <div className="meters-label">Coverage</div>
                <div className="meters-value">{water.cy2025_coverage || '-'}</div>
              </div>
              <div className="meters-cell">
                <div className="meters-label">Completeness</div>
                <div className="meters-value">{water.completeness || '-'}</div>
              </div>
            </div>
            {water.key_gaps && (
              <div className="callout-card" style={{ marginTop: 16 }}>
                <strong>Key gaps:</strong> {water.key_gaps}
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}

function SiteDataQuality({ siteId }) {
  const rec = reconciliation.by_site?.[siteId]
  const mpans = mpanRegister[siteId] || []
  const landlord = mpans.filter((m) => (m.category || '').toLowerCase().startsWith('landlord') || (m.category || '').toLowerCase().startsWith('construction'))
  const water = waterData?.[siteId]
  const waste = wasteData?.[siteId]
  const syc = sycousData.by_site?.[siteId]
  const site = sites[siteId]

  return (
    <div className="page">
      <div className="page-2col">
        <Panel title="Data quality" subtitle="By metric - what's confirmed, what's pending" pad="none" scroll>
          <table className="site-table">
            <thead>
              <tr><th>Metric</th><th>Status</th><th>Source</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr><td>Electricity landlord</td><td><DataStatusBadge status={elecStatus(siteId)} /></td><td>Ecotricity CY25</td><td>{landlord.length} landlord MPAN{landlord.length === 1 ? '' : 's'}, 15-month coverage</td></tr>
              <tr><td>Gas</td><td><DataStatusBadge status={gasStatus(siteId)} /></td><td>Ecotricity CY25</td><td>{(site?.scope_allocation?.has_gas) ? `${rec?.eco_meters_gas || 0} gas MPRN${(rec?.eco_meters_gas || 0) === 1 ? '' : 's'}` : 'No gas on site'}</td></tr>
              <tr><td>Water</td><td><DataStatusBadge status={waterStatus(siteId)} /></td><td>{water?.data_quality || '-'}</td><td>{water?.key_gaps || water?.cy2025_coverage || '-'}</td></tr>
              <tr><td>Waste</td><td><DataStatusBadge status={wasteStatus(siteId)} /></td><td>{waste?.contractor || '-'}</td><td>{waste?.tonnage_total ? `${Math.round(waste.tonnage_total*10)/10} t · ${Math.round((waste.diversion_rate||0)*100)}% diversion` : (waste?.notes || '-')}</td></tr>
              <tr><td>Resident energy</td><td><DataStatusBadge status={(rec?.derived_resident_elec_kwh || 0) > 0 || (rec?.derived_resident_gas_kwh || 0) > 0 ? 'partial' : 'not_applicable'} /></td><td>Derived (arbnco − Eco landlord)</td><td>Sycous direct integration pending</td></tr>
            </tbody>
          </table>
        </Panel>

        <SycousPanel siteId={siteId} mode="full" />
      </div>
    </div>
  )
}

// ================ site page ================

/* Brief 24.6 Part 2 - page-level fade-in on nav.
   A plain `<div>` keyed on `${siteId}/${subTab}` re-mounts whenever
   the user navigates between sites or sub-tabs. The CSS class
   `site-chapter-fade` runs a 200 ms opacity 0→1 keyframe on every
   mount, giving the new chapter a clean fade-in. The old subtree
   is dropped instantly - visually reads as a smooth swap.
   `initialKey` is captured via `useState` so it survives re-renders
   without changing. The class is only applied once the current
   key differs from the captured initial - Chris asked for fades
   on user-driven nav, NOT on cold open. (A module-level flag was
   tried first but useReducedMotion's async settle triggers a
   re-render after the cold-load mount; with the flag already true,
   that re-render erroneously added the fade class. useState
   freezes the cold-load key so the comparison stays stable.)
   Why CSS rather than framer-motion: AnimatePresence + StrictMode +
   framer-motion 12 left animations frozen mid-session (verified via
   DOM sampling). CSS keyframes are bulletproof.
   `reducedMotion` short-circuits the class application; CSS @media
   also no-ops the keyframe as a belt-and-braces fallback. */
function SiteChapterFade({ siteId, subTab, reducedMotion, children }) {
  const currentKey = `${siteId}/${subTab}`
  const [initialKey] = useState(currentKey)
  const animate = currentKey !== initialKey && !reducedMotion
  return (
    <div
      key={currentKey}
      className={animate ? 'site-chapter-fade' : ''}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}
    >
      {children}
    </div>
  )
}

function SitePage({ siteId, subTab, currentSiteId }) {
  const site = sites[siteId]
  const rec = reconciliation.by_site?.[siteId]
  /* Brief 24.6 Part 2 + Part 5a - page-level fade-in on nav. Respects
     the OS-level prefers-reduced-motion preference: when set, the
     transition has duration 0 (instant swap). */
  const reducedMotion = useReducedMotion()

  const allCanonical = Object.values(sites).map((s) => ({ id: s.id, display_name: s.display_name }))

  if (!site) {
    return (
      <BodyPageLayout
        activePrimary="site"
        activeSecondary={subTab}
        currentSiteId={currentSiteId}
        navigate={navigate}
        sidebar={<Sidebar sites={allCanonical} activeSiteId={siteId} subTab={subTab} navigate={navigate} statusFor={overallSiteStatus} readinessFor={gresbReadiness} />}
      >
        <div className="page"><div className="empty-state">Site not found: "{siteId}"</div></div>
      </BodyPageLayout>
    )
  }

  return (
    <BodyPageLayout
      activePrimary="site"
      activeSecondary={subTab}
      currentSiteId={currentSiteId}
      navigate={navigate}
      sidebar={<Sidebar sites={allCanonical} activeSiteId={siteId} subTab={subTab} navigate={navigate} statusFor={overallSiteStatus} readinessFor={gresbReadiness} />}
    >
      <ErrorBoundary scope={`site/${siteId}/${subTab}`} theme="cream">
        {/* Brief 24.6 Part 2 - page-level fade-in on nav.
            A keyed `motion.div` re-mounts whenever siteId OR subTab
            changes. React drops the old subtree instantly and mounts
            the new one at `initial:opacity:0`, then animates to 1
            over 200ms. Visually reads as a clean swap-and-fade.
            Why not AnimatePresence: nested AnimatePresence + React 19
            StrictMode + framer-motion 12 left the exit phase stuck
            (`opacity:1` frozen indefinitely on the outgoing child,
            new child stuck at `opacity:0` - verified mid-session via
            Chrome MCP DOM sampling). A plain key-remount sidesteps
            the issue entirely.
            `firstMountRef` suppresses the fade on initial page load -
            Chris explicitly didn't want the chapter to fade in on
            cold open, only on user-driven nav.
            `prefers-reduced-motion` → duration 0. */}
        <SiteChapterFade
          siteId={siteId}
          subTab={subTab}
          reducedMotion={reducedMotion}
        >
          {subTab === 'overview' && <SiteOverview site={site} siteId={siteId} rec={rec} />}
          {subTab === 'energy' && <SiteEnergy siteId={siteId} />}
          {subTab === 'carbon' && <SiteCarbon siteId={siteId} site={site} />}
          {subTab === 'water' && <WaterTab siteId={siteId} site={site} />}
          {subTab === 'waste' && <WasteTab siteId={siteId} site={site} />}
          {/* Brief 24 Part 5 - Meters + Data quality folded into
              Metering & data quality. Legacy sub-tabs route to
              the new combined page. */}
          {(subTab === 'metering' || subTab === 'meters' || subTab === 'data-quality') && (
            <SiteMetering siteId={siteId} />
          )}
        </SiteChapterFade>
      </ErrorBoundary>
    </BodyPageLayout>
  )
}

// ================ GRESB page (Brief 20 / BR-13) ================

/* Brief 20 (BR-13) Task 1 - minimal shell for Phase 1. Reads from
   eir/src/data/gresb.json (manually populated from P09 SH-2000 tracker
   on 2026-06-04; Phase 2/Brief 21+ will automate). Sub-tab body
   placeholders are wired here; full visualisation lands in Task 3
   (overview), Task 4 (aspect drill-in), Task 5 (dependency drill-in). */
function GresbPage({ currentSiteId, subTab, drillCode }) {
  const sub = subTab || 'overview'
  const meta = gresb.meta || {}
  const headline = gresb.headline || {}

  /* Drill-in resolution. Whichever sub-tab is active, if a code is in
     the URL we render the drill-in placeholder for the matched entity
     (Phase 1 placeholders only; Task 4 / Task 5 fill these out). */
  let drillEntity = null
  if (drillCode) {
    if (sub === 'aspects') {
      drillEntity = (gresb.aspects || []).find((a) => a.code === drillCode)
    } else if (sub === 'dependencies') {
      drillEntity = (gresb.criticalDependencies || []).find((d) => d.id === drillCode)
    }
  }

  return (
    <DashboardLayout
      topNav={
        <TopNav
          activePrimary="gresb"
          activeSecondary={sub}
          currentSiteId={currentSiteId}
          navigate={navigate}
        />
      }
    >
      {/* Rule 11.x - body alignment foundation.
          .thematic-page-outer = border-box scroller with --page-edge-x
          padding + reserved scrollbar gutters; .thematic-page-container
          = centred 1280 inner. Every page that wants nav-aligned body
          text uses this pair (see index.css). */}
      {/* Chris ask 5 Jun r8 (gresb-only): "On the overview page in the
          GRESB section, have it so the page doesn't scroll but the
          left text column does." Override the shared
          `.thematic-page-outer` class's `overflow-y: auto` with
          `overflow: hidden` so the page itself never scrolls - every
          scrollable surface inside (Overview narrative pane,
          Aspects narrative + card list) handles its own overflow
          via the shared ScrollFadePane + scroll-fade-y treatment. */}
      <div className="thematic-page-outer" style={{ gap: 24, overflow: 'hidden' }}>
        {/* Element 1 - Header strip (lives on every sub-tab so the
            submission deadline is always one glance away). Wrapped in
            .thematic-page-container so its left edge aligns with the
            nav strips above (Rule 11.x).

            Chris ask 5 Jun r4: "Make the GRESB icon much bigger.
            Give it breathing space vertically, knock it down a line
            or two. Remove the 2026 - I don't know what that's for."
            Logo bumped from 0.95em (~30 px) to 80 px so it reads as
            a proper hero mark. Year span removed (the submission-due
            line below already carries the year). Top padding lifted
            to 28 px so the logo doesn't sit jammed against the
            tertiary nav. The "Last updated" meta still sits opposite
            the logo on the right; aligned to the BOTTOM so it docks
            against the entity/submission line. */}
        <div className="thematic-page-container" style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, paddingTop: 28,
        }}>
          <div>
            <h1 style={{
              margin: 0,
              lineHeight: 1,
              display: 'flex', alignItems: 'center',
            }}>
              <img
                src="/logos/ivg-nza-logos_gresb.svg"
                alt="GRESB"
                style={{
                  height: 80,
                  width: 'auto',
                  display: 'block',
                }}
                draggable={false}
              />
            </h1>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body-small)',
              color: 'var(--text-muted-on-dark)',
              marginTop: 14,
            }}>
              {meta.entityName} · submission due {meta.submissionDeadline}
            </div>
          </div>
          {/* Chris ask 5 Jun r5: "Remove the whole Last updated /
              Tracker version thing from the top right. That's really
              valuable real estate. It's completely unnecessary." The
              meta info still has audit value to the NZA team so we
              move it to a small muted footer caption at the very
              bottom of the gresb chapter (see below the sub-tab
              body), where it's "more for us to know rather than for
              everyone to see." */}
        </div>

        {/* Drill-in OR sub-tab body. Drill-in wins when ?:code is set. */}
        {drillCode && !drillEntity && (
          <GresbTask1Placeholder
            title="Not found"
            body={`No ${sub === 'aspects' ? 'aspect' : 'dependency'} with code "${drillCode}" in gresb.json.`}
          />
        )}
        {drillCode && drillEntity && sub === 'aspects' && (
          <GresbTask1Placeholder
            title={`${drillEntity.code} - ${drillEntity.name}`}
            body={`Aspect drill-in placeholder. Full layout lands in Task 4 (per-aspect breakdown - indicators, "the play here", evidence list, retired/parked badges).\n\nThis aspect carries ${drillEntity.indicators?.length || 0} indicators. Westbrook-name: "${drillEntity.ivgName}". Component band: ${drillEntity.component}. Score 2025 → ${drillEntity.score2025} / Floor → ${drillEntity.floor2026} / Ceiling → ${drillEntity.ceiling2026} / Max → ${drillEntity.max2026}.`}
          />
        )}
        {/* Brief 22 Task 6 - Dependencies drill-in branch removed entirely. */}

        {/* Sub-tab body - only renders when no drill-in is active. */}
        {!drillCode && sub === 'overview' && (
          <GresbOverview gresb={gresb} navigate={navigate} />
        )}
        {!drillCode && sub === 'aspects' && (
          <PageContainer>
            <GresbAspects gresb={gresb} />
          </PageContainer>
        )}
        {!drillCode && sub === 'forward' && (
          <GresbForward gresb={gresb} />
        )}
        {/* Brief 20 Task 2 - hidden /gresb/test route renders the
            atomic component library in isolation per the brief's PASS
            criterion. Not surfaced in nav. */}
        {!drillCode && sub === 'test' && <GresbComponentShowcase />}
        {!drillCode && !['overview', 'aspects', 'forward', 'test'].includes(sub) && (
          <GresbTask1Placeholder
            title="Unknown sub-tab"
            body={`No GRESB sub-tab "${sub}". Valid sub-tabs: overview · aspects · dependencies · forward.`}
          />
        )}

        {/* Chris ask 5 Jun r5: tiny audit-trail caption at the bottom
            of the gresb chapter. The Last updated / Tracker version
            info used to sit top-right of the header strip but it's
            "more for us to know rather than for everyone to see" - so
            it now sits discreetly at the page foot, scoped to the
            container so it shares the body's left edge. */}
        <div className="thematic-page-container" style={{
          paddingTop: 24,
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'rgba(243, 239, 227, 0.32)',
          letterSpacing: 0.3,
        }}>
          Last updated {meta.lastUpdated}
          {meta.version && <> · Tracker version {meta.version}</>}
        </div>
      </div>
    </DashboardLayout>
  )
}

/* Brief 20 Task 2 - hidden showcase route at /gresb/test renders the
   10 atomic components in isolation per the brief's PASS criterion
   ("Each component renders in isolation"). Not surfaced in nav; used
   for visual verification during Phase 1 build and as a regression
   check during Tasks 3-5. */
function GresbComponentShowcase() {
  const {
    IndicatorBadge, AspectBadge, StatusPill, ConfidencePill,
    StarRating, ScoreRangeBar, ProgressMiniBar, EvidenceItem,
    RetiredBadge, ParkedBadge,
  } = GresbAtoms
  const Section = ({ title, children }) => (
    <div style={{
      maxWidth: 900, margin: '0 auto 24px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--rule-on-dark)',
      borderRadius: 8,
      padding: '16px 20px',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-caption)',
        textTransform: 'uppercase', letterSpacing: 0.4,
        color: 'var(--color-nza-coral)',
        margin: '0 0 12px 0',
      }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
  return (
    <div data-gresb-showcase>
      <Section title="IndicatorBadge">
        <IndicatorBadge code="LE2" />
        <IndicatorBadge code="PO1.1" />
        <IndicatorBadge code="EN1" />
        <IndicatorBadge code="RES6" />
      </Section>
      <Section title="AspectBadge - three component bands">
        <AspectBadge code="LE" variant="management" />
        <AspectBadge code="PO" variant="management" />
        <AspectBadge code="EN" variant="performance" />
        <AspectBadge code="GH" variant="performance" />
        <AspectBadge code="RES" variant="residential" />
      </Section>
      <Section title="StatusPill - four statuses">
        <StatusPill status="In place" />
        <StatusPill status="At risk" />
        <StatusPill status="Missing" />
        <StatusPill status="Not applicable" />
      </Section>
      <Section title="ConfidencePill - H / M / L">
        <ConfidencePill level="H" />
        <ConfidencePill level="M" />
        <ConfidencePill level="L" />
        <ConfidencePill />
      </Section>
      <Section title="StarRating - 0 / 1 / 2 / 3 / 4 / 5">
        <StarRating count={0} />
        <StarRating count={1} />
        <StarRating count={2} />
        <StarRating count={3} />
        <StarRating count={4} />
        <StarRating count={5} />
      </Section>
      <Section title="ScoreRangeBar - full 100-pt range with overlays">
        <div style={{ width: '100%' }}>
          <ScoreRangeBar score2025={52} floor={45} ceiling={79} target={62} targetStar={2} />
        </div>
      </Section>
      <Section title="ProgressMiniBar - three sample aspects">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted-on-dark)', marginBottom: 4 }}>LE - 2025=6.83 · floor=3.75 · ceiling=5.00 · max=5</div>
            <ProgressMiniBar value={3.75} ceiling={5.00} max={5} score2025={6.83} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted-on-dark)', marginBottom: 4 }}>EN - 2025=2.50 · floor=5.00 · ceiling=8.00 · max=10</div>
            <ProgressMiniBar value={5.00} ceiling={8.00} max={10} score2025={2.50} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted-on-dark)', marginBottom: 4 }}>SE - 2025=null · floor=2.0 · ceiling=2.5 · max=3</div>
            <ProgressMiniBar value={2.0} ceiling={2.5} max={3} />
          </div>
        </div>
      </Section>
      <Section title="EvidenceItem - read-only Phase 1">
        <div style={{ width: '100%' }}>
          <EvidenceItem name="Westbrook ESG Policy 2026" validUntil="2027-03-31" />
          <EvidenceItem name="Sustainability Statement" validUntil="2026-12-31" url="https://example.org/policy.pdf" />
          <EvidenceItem name="Climate Risk Assessment v2" />
        </div>
      </Section>
      <Section title="RetiredBadge / ParkedBadge">
        <RetiredBadge year={2026} />
        <ParkedBadge label="Parked → 2027" />
      </Section>
    </div>
  )
}

/* Phase 1 Task 1 - minimal placeholder card. Tasks 3–5 will replace
   these per-sub-tab with the full visualisation layouts per the
   brief's Element 1–6 spec + Appendix B style guide. */
function GresbTask1Placeholder({ title, body }) {
  return (
    <div style={{
      maxWidth: 720, margin: '0 auto',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--rule-on-dark)',
      borderRadius: 8,
      padding: '20px 24px',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-theme-body)',
      lineHeight: 1.55,
    }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-section-title)',
        fontWeight: 600,
        margin: '0 0 12px 0',
        color: 'var(--color-theme-body)',
      }}>{title}</h2>
      <p style={{
        whiteSpace: 'pre-wrap',
        fontSize: 'var(--text-body-small)',
        color: 'var(--text-muted-on-dark)',
        margin: 0,
      }}>{body}</p>
    </div>
  )
}

// ================ root ================

/* Brief 15 Part 4 - wrapper that renders the PhasingPage on the cream
   register (Site Detail's BodyPageLayout already toggles body.theme-cream
   and gives a cream backdrop). Reuses the layout primitive so the data-
   vintage badge + top nav stay consistent. */
function PhasingChapter({ currentSiteId }) {
  return (
    <BodyPageLayout
      activePrimary="portfolio"
      activeSecondary="phasing"
      currentSiteId={currentSiteId}
      navigate={navigate}
    >
      <ErrorBoundary scope="phasing" theme="cream">
        <PhasingPage />
      </ErrorBoundary>
    </BodyPageLayout>
  )
}

export default function App() {
  const path = useLocation()
  const currentSiteId = useCurrentSiteId(path)

  // Route parsing
  // /                            → portfolio overview
  // /portfolio/<sub>             → portfolio <sub>
  // /site/<id>                   → site overview
  // /site/<id>/<sub>             → site <sub>
  // /insights                    → insights reconciliation
  // /insights/<sub>              → insights <sub>
  // /gresb                       → gresb stub

  // Brief 8 Part 1: '/' renders <Landing> (exec-summary cream front door).
  // Brief 6's wider /→map redirect kept for /portfolio and /portfolio/overview
  // so the sub-tab nav stays canonical on `/portfolio/map`.
  // Brief 17: the four stripped sub-tabs (overview / sites / phasing /
  // comparisons) redirect to /portfolio/map as well - bookmarks don't 404.
  useEffect(() => {
    const STRIPPED = ['/portfolio', '/portfolio/overview', '/portfolio/sites', '/portfolio/phasing', '/portfolio/comparisons']
    if (STRIPPED.includes(path)) {
      window.history.replaceState({}, '', '/portfolio/map')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    /* Brief 20 (BR-13) Task 1 - bare /gresb → /gresb/overview so the
       sub-tab nav has a canonical landing. */
    if (path === '/gresb') {
      window.history.replaceState({}, '', '/gresb/overview')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    /* Brief 22 (BR-13 v1.2) Task 6 - Dependencies sub-tab removed.
       Redirect /gresb/dependencies and /gresb/dependencies/:code to
       /gresb/overview so any bookmarks from the Brief 20 era don't 404. */
    if (path === '/gresb/dependencies' || path.startsWith('/gresb/dependencies/')) {
      window.history.replaceState({}, '', '/gresb/overview')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [path])

  /* Chris ask 8 Jun - subtle section-level fade.
     Resolve the route into `node` + `sectionKey`, then render once
     wrapped in a keyed `.app-section-fade` div. React drops the old
     subtree on key change and the CSS keyframe (in index.css) fades
     the new section in over ~220 ms. The fade applies to top-level
     transitions only - Home / Portfolio / Site / GRESB. Switches
     within a section (e.g. site sub-tab clicks) are handled by the
     existing SiteChapterFade. */
  let node = null
  let sectionKey = ''

  // Root path → landing (handled before the route table below).
  if (path === '/' || path === '') {
    node = <Landing navigate={navigate} currentSiteId={currentSiteId} />
    sectionKey = 'home'
    return <div key={sectionKey} className="app-section-fade">{node}</div>
  }

  let route = { section: 'portfolio', subTab: 'map', siteId: null, subSubTab: null }
  if (path === '/portfolio' || path === '/portfolio/overview') {
    route = { section: 'portfolio', subTab: 'map' }
  } else if (path.startsWith('/portfolio/')) {
    /* Brief 17 - third segment captured as subSubTab for the thematic
       Energy page (4 inner tabs). map etc. ignore it. */
    const parts = path.split('/').filter(Boolean)
    route = { section: 'portfolio', subTab: parts[1] || 'map', subSubTab: parts[2] || null }
  } else if (path.startsWith('/portfolio')) {
    route = { section: 'portfolio', subTab: 'map' }
  } else if (path.startsWith('/site/')) {
    const parts = path.split('/').filter(Boolean)
    let sub = parts[2] || 'overview'
    // Legacy aliases:
    //   /site/{id}/mpans         → meters (Phase 1B+ rename)
    //   /site/{id}/meters        → metering (Brief 24 combined page)
    //   /site/{id}/data-quality  → metering (Brief 24 combined page)
    if (sub === 'mpans') sub = 'meters'
    if (sub === 'meters' || sub === 'data-quality') sub = 'metering'
    route = { section: 'site', siteId: parts[1], subTab: sub }
  } else if (path.startsWith('/gresb')) {
    /* Brief 20 (BR-13) Task 1 - parse /gresb/<subtab>/<code?>.
       4 sub-tabs: overview / aspects / dependencies / forward.
       Aspect + dependency drill-ins live at /gresb/aspects/:code and
       /gresb/dependencies/:code respectively. Bare /gresb redirects
       to the Overview sub-tab. */
    const parts = path.split('/').filter(Boolean)
    /* parts[0] === 'gresb' guaranteed by the path.startsWith check */
    const subTab = parts[1] || null
    const drillCode = parts[2] || null
    route = { section: 'gresb', subTab, drillCode }
  } else if (path.startsWith('/phasing')) {
    /* Brief 15 Part 4 - standalone phasing reference. Top-level route
       so it can render in its own cream register (Site Detail's cream
       wrapper, no sidebar) for dense tabular reading. Linked from
       Portfolio sub-nav in Part 5. */
    route = { section: 'phasing' }
  }

  if (route.section === 'site' && route.siteId) {
    node = <SitePage siteId={route.siteId} subTab={route.subTab} currentSiteId={currentSiteId} />
    sectionKey = 'site'
  } else if (route.section === 'gresb') {
    node = <GresbPage
      currentSiteId={currentSiteId}
      subTab={route.subTab}
      drillCode={route.drillCode}
    />
    sectionKey = 'gresb'
  } else if (route.section === 'phasing') {
    node = <PhasingChapter currentSiteId={currentSiteId} />
    sectionKey = 'phasing'
  } else {
    node = <PortfolioPage subTab={route.subTab} subSubTab={route.subSubTab} currentSiteId={currentSiteId} />
    sectionKey = 'portfolio'
  }

  return <div key={sectionKey} className="app-section-fade">{node}</div>
}
