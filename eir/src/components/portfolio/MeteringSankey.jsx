/**
 * Brief 21 - Metering & data quality Sankey.
 *
 * Three-column flow:
 *   LEFT   - 11 commodity rows (right-aligned label + count) clustered
 *            into 6 visual GROUPS, each with a single BIG icon to the
 *            far left of the cluster (Chris ask 4 Jun #2: don't put a
 *            small icon on every row; group them by what they measure
 *            and show ONE big icon per group).
 *   MIDDLE - 3 platform nodes with full-size brand wordmarks above the
 *            node bar: Ecotricity · Sycous · Arbnco (Visible via Arbnco).
 *   RIGHT  - 11 site rows: big village icon · site name · meter count
 *            (Chris ask 4 Jun #4: icon first so the rhythm reads as
 *            "village → its meters" rather than abstract text alone).
 *
 * Ribbon width = meter count. Colour follows the source commodity so
 * the visual story is "this commodity flows through this platform to
 * these sites." The Arbnco channel (resident MPANs at the 5 DNO + BNO
 * sites - Bramshott, Hartwell UTC, St Margaret's, Riverdale Free School, Eastlea) is
 * DASHED + lower opacity because the count is estimated (1 MPAN per
 * planned unit; pipeline doesn't carry the resident total directly).
 *
 * Highlight algorithm: STRICT 1-HOP. Clicking a node OR a filter pill
 * lights only the links DIRECTLY touching that node - not the full
 * BFS-connected subgraph. Previous BFS lit the entire graph (every
 * node connects to every node within 2 hops) so the filter felt
 * broken: "Ecotricity" lit Sycous ribbons too. 1-hop is the
 * narratively-useful highlight: "show me what THIS specific platform/
 * commodity/site directly touches".
 *
 * Every number lives in portfolio.metering_sankey (precomputed by
 * pipeline/readers/build_metering_sankey.py). No hardcoded counts.
 */

import { useMemo, useRef, useState } from 'react'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

import portfolio from '@pipeline-data/portfolio.json'
import sitesData from '@pipeline-data/sites.json'

/* Chris ask 4 Jun #7: stop letterboxing the SVG horizontally. The graphic
   pane is roughly 870 wide × 720 tall at 1920×1080 (ratio ~1.20). A
   square-ish viewBox + preserveAspectRatio="meet" was leaving ~30 px of
   empty space on each side AND truncating site names on the right
   because the right column wasn't getting enough viewBox-units. Going
   landscape: 1000 × 700 (ratio 1.43). Now meet-fits to WIDTH, the full
   870 px is used horizontally, and there's only a modest vertical
   letterbox - exactly what Chris asked for ("squash vertically, use the
   width"). */
const W = 1000
const H = 700
const NODE_WIDTH = 14
/* Chris ask #3 (4 Jun): more vertical gap between sankey nodes - was 8
   (Ecotricity / Sycous / Arbnco bars sat almost flush against each
   other; logos were overlapping the meter-count text below the bar
   above). 28 px gives each platform comfortable breathing room above
   AND below, so logos sit cleanly. */
const NODE_PADDING = 28

/* Per-row labels. Trimmed from the prototype's longer strings so they
   fit inside the 200 px label slot without ellipsis - the big cluster
   icons to the left now carry the categorisation (Electric / Heat /
   etc.) so the row labels can focus on what differentiates them within
   the cluster. */
const COMMODITY_LABEL = {
  'gas':                'Gas',
  'elec-hh':            'Landlord HH',
  'elec-nhh':           'Landlord NHH',
  'elec-void':          'Void / vacant',
  'elec-other':         'Inactive / unclear',
  'sycous-elec':        'Resident electric',
  'sycous-heat':        'Resident heat',
  'sycous-hhw':         'Resident heat + HW',
  'sycous-hw':          'Resident hot water',
  'sycous-cw':          'Resident cold water',
  'invisible-resident': 'Resident MPANs + MPRNs',
}

const COMMODITY_COLOR_VAR = {
  'gas':                '--metering-gas',
  'elec-hh':            '--metering-elec-hh',
  'elec-nhh':           '--metering-elec-nhh',
  'elec-void':          '--metering-elec-void',
  'elec-other':         '--metering-elec-other',
  'sycous-elec':        '--metering-sycous-elec',
  'sycous-heat':        '--metering-sycous-heat',
  'sycous-hhw':         '--metering-sycous-hhw',
  'sycous-hw':          '--metering-sycous-hw',
  'sycous-cw':          '--metering-sycous-cw',
  'invisible-resident': '--metering-invisible',
}

/* Cluster groups for the BIG icon column on the far left.
   Each cluster spans 1+ commodity rows and renders one icon vertically
   centred on the cluster's y-range (computed AFTER the sankey layout
   so the icon tracks node sizing). */
/* Five themed clusters (Chris ask 4 Jun #5):
   1. Gas
   2. Electricity (every electric meter - landlord HH/NHH/Void/Other and
      Sycous-elec) - one theme not five.
   3. Heating (every Sycous heat service - space heat, hot water, the
      combined heat-and-hot-water bundle) - three rows, one theme.
   4. Cold water (its own theme)
   5. Resident MPANs (its own theme - dual-fuel grid + gas icons because
      the 828 includes 687 electric + 141 gas residents, mostly at Bramshott)
   Rows are grouped vertically inside each cluster with a small intra-pad,
   and the clusters are separated by a big inter-pad - applied as a
   post-process to the d3-sankey layout below. */
/* Each cluster carries its theme COLOUR for the icon tint. Chris ask 4 Jun #8:
   - Gas → red (matches gas ribbons)
   - Electricity → yellow/gold (matches HH ribbon hue)
   - Heating → red (matches sycous-heat/hhw ribbons)
   - Cold water → blue (matches cold-water ribbon)
   - Resident MPANs + MPRNs → slate grey (both grid + gas icons in the
     same neutral) so the dual-fuel cluster doesn't fight with the other
     red themes above. */
const CLUSTERS = [
  { key: 'gas',         rows: ['gas'],                                                          icons: ['/icons/ivg-nza-icons_gas.svg'],                                            colorVar: '--metering-gas' },
  { key: 'electricity', rows: ['elec-hh', 'elec-nhh', 'elec-void', 'elec-other', 'sycous-elec'], icons: ['/icons/ivg-nza-icons_electricity.svg'],                                    colorVar: '--metering-elec-hh' },
  { key: 'heating',     rows: ['sycous-heat', 'sycous-hhw', 'sycous-hw'],                       icons: ['/icons/nza-sim icons_space-heating.svg', '/icons/nza-sim icons_dhw.svg'], colorVar: '--metering-sycous-hhw' },
  { key: 'cold-water',  rows: ['sycous-cw'],                                                    icons: ['/icons/ivg-nza-icons_water.svg'],                                          colorVar: '--metering-sycous-cw' },
  { key: 'resident',    rows: ['invisible-resident'],                                           icons: ['/icons/ivg-nza-icons_grid.svg', '/icons/ivg-nza-icons_gas.svg'],            colorVar: '--text-muted-on-dark' },
]

const PLATFORM = {
  'ecotricity': { label: 'Ecotricity',         logo: '/logos/ivg-nza-logos_ecotricity.svg' },
  'sycous':     { label: 'Sycous',             logo: '/logos/ivg-nza-logos_sycous.svg' },
  'arbnco':     { label: 'Visible via Arbnco', logo: '/logos/ivg-nza-logos_arbnco.svg' },
}

const LEFT_ORDER = [
  'gas',
  'elec-hh', 'elec-nhh', 'elec-void', 'elec-other',
  'sycous-elec', 'sycous-heat', 'sycous-hhw', 'sycous-hw', 'sycous-cw',
  'invisible-resident',
]
const MIDDLE_ORDER = ['ecotricity', 'sycous', 'arbnco']

const FILTER_PILLS = [
  { key: 'all',        label: 'All meters', nodeId: null,         logo: null },
  { key: 'ecotricity', label: 'Ecotricity', nodeId: 'ecotricity', logo: '/logos/ivg-nza-logos_ecotricity.svg' },
  { key: 'sycous',     label: 'Sycous',     nodeId: 'sycous',     logo: '/logos/ivg-nza-logos_sycous.svg' },
  { key: 'arbnco',     label: 'Arbnco',     nodeId: 'arbnco',     logo: '/logos/ivg-nza-logos_arbnco.svg' },
]

/* Geometry constants. Chris ask 4 Jun #6: labels pinned to far-left so
   the sankey ribbons stretch wider; cluster icons FLOAT over the
   ribbons (rendered after links) rather than living in their own
   column. Gives both the cluster icons and the ribbons more room. */
/* Chris ask 4 Jun #8: icons all the same size, all a bit smaller. Each
   individual icon is fixed at ICON_SIZE; multi-icon clusters render N
   icons side by side with ICON_GAP between them. The cluster's
   foreignObject is wide enough to fit two icons + gap, centred - so a
   single-icon cluster's icon sits dead-centre in the slot. */
const ICON_SIZE = 32
const ICON_GAP = 8
const CLUSTER_ICON_W = ICON_SIZE * 2 + ICON_GAP   // = 72, fits the widest cluster (2 icons)
const CLUSTER_ICON_H = ICON_SIZE
/* Map node id -> cluster colour var so each row can colour its label
   text to match the cluster's theme. (Per-cluster lookup is faster
   than scanning CLUSTERS on every render.) */
const ROW_TO_CLUSTER_COLOR = {}
CLUSTERS.forEach((c) => c.rows.forEach((id) => { ROW_TO_CLUSTER_COLOR[id] = c.colorVar }))
/* Chris ask 4 Jun #9: icons OFF the sankey ribbons, back to a far-left
   column to the LEFT of the labels. Labels then sit between the icon
   column and the sankey bar (still right-aligned). */
const CLUSTER_ICON_X = 8
const LEFT_LABEL_X = CLUSTER_ICON_X + CLUSTER_ICON_W + 12   // 92
const LEFT_LABEL_W = 150                                    // label slot 92→242
const SANKEY_LEFT = LEFT_LABEL_X + LEFT_LABEL_W + 8         // 250
const SANKEY_RIGHT = 800
const SITE_ICON_W = 32
const INTRA_CLUSTER_PAD = 10
const INTER_CLUSTER_PAD = 56

/* ------------------------------------------------------------------ */
/*  Graph construction                                                 */
/* ------------------------------------------------------------------ */

function buildGraph(ms) {
  const c = ms.commodities || {}
  const perMpan = ms.per_site_mpans || {}
  const perSycous = ms.per_site_sycous || {}
  const arbncoEstimate = ms.dno_bno_resident_estimate || {}
  const siteOrder = ms.site_order || []

  const nodes = []
  for (const id of LEFT_ORDER) {
    nodes.push({ id, name: COMMODITY_LABEL[id], col: 'left', colorVar: COMMODITY_COLOR_VAR[id] })
  }
  for (const id of MIDDLE_ORDER) {
    nodes.push({ id, name: PLATFORM[id].label, col: 'middle', colorVar: null, logo: PLATFORM[id].logo })
  }
  for (const sid of siteOrder) {
    nodes.push({
      id: 'site-' + sid,
      siteId: sid,
      name: sitesData[sid]?.display_name || sid,
      col: 'right',
      colorVar: null,
      siteIcon: `/sites/${sid}/icon.svg`,
    })
  }

  const links = []
  if (c['gas'])        links.push({ source: 'gas',        target: 'ecotricity', value: c['gas'],        colorVar: '--metering-gas' })
  if (c['elec-hh'])    links.push({ source: 'elec-hh',    target: 'ecotricity', value: c['elec-hh'],    colorVar: '--metering-elec-hh' })
  if (c['elec-nhh'])   links.push({ source: 'elec-nhh',   target: 'ecotricity', value: c['elec-nhh'],   colorVar: '--metering-elec-nhh' })
  if (c['elec-void'])  links.push({ source: 'elec-void',  target: 'ecotricity', value: c['elec-void'],  colorVar: '--metering-elec-void' })
  if (c['elec-other']) links.push({ source: 'elec-other', target: 'ecotricity', value: c['elec-other'], colorVar: '--metering-elec-other' })

  if (c['sycous-elec']) links.push({ source: 'sycous-elec', target: 'sycous', value: c['sycous-elec'], colorVar: '--metering-sycous-elec' })
  if (c['sycous-heat']) links.push({ source: 'sycous-heat', target: 'sycous', value: c['sycous-heat'], colorVar: '--metering-sycous-heat' })
  if (c['sycous-hhw'])  links.push({ source: 'sycous-hhw',  target: 'sycous', value: c['sycous-hhw'],  colorVar: '--metering-sycous-hhw' })
  if (c['sycous-hw'])   links.push({ source: 'sycous-hw',   target: 'sycous', value: c['sycous-hw'],   colorVar: '--metering-sycous-hw' })
  if (c['sycous-cw'])   links.push({ source: 'sycous-cw',   target: 'sycous', value: c['sycous-cw'],   colorVar: '--metering-sycous-cw' })

  if (c['invisible-resident']) {
    links.push({ source: 'invisible-resident', target: 'arbnco', value: c['invisible-resident'], colorVar: '--metering-invisible', estimated: true })
  }

  for (const sid of siteOrder) {
    const m = perMpan[sid] || {}
    if (m.hh)        links.push({ source: 'ecotricity', target: 'site-' + sid, value: m.hh,        colorVar: '--metering-elec-hh' })
    if (m.nhh)       links.push({ source: 'ecotricity', target: 'site-' + sid, value: m.nhh,       colorVar: '--metering-elec-nhh' })
    if (m.void_betw) links.push({ source: 'ecotricity', target: 'site-' + sid, value: m.void_betw, colorVar: '--metering-elec-void' })
    if (m.other)     links.push({ source: 'ecotricity', target: 'site-' + sid, value: m.other,     colorVar: '--metering-elec-other' })
    if (m.gas)       links.push({ source: 'ecotricity', target: 'site-' + sid, value: m.gas,       colorVar: '--metering-gas' })

    const r = perSycous[sid] || {}
    const sycTotal = (r.elec || 0) + (r.heat || 0) + (r.hhw || 0) + (r.hw || 0) + (r.cw || 0)
    if (sycTotal) links.push({ source: 'sycous', target: 'site-' + sid, value: sycTotal, colorVar: '--metering-sycous-elec' })

    if (arbncoEstimate[sid]) {
      links.push({ source: 'arbnco', target: 'site-' + sid, value: arbncoEstimate[sid], colorVar: '--metering-invisible', estimated: true })
    }
  }

  return { nodes, links }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MeteringSankey() {
  const ms = portfolio.metering_sankey || {}
  const totals = ms.totals || {}
  const svgRef = useRef(null)
  const [activePill, setActivePill] = useState('all')
  const [highlightId, setHighlightId] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const layout = useMemo(() => {
    const { nodes, links } = buildGraph(ms)
    const sk = sankey()
      .nodeId((d) => d.id)
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .extent([[SANKEY_LEFT, 64], [SANKEY_RIGHT, H - 14]])
      .nodeSort(null)
    const result = sk({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    })

    /* ---- Post-process: theme-grouped left column ----
       d3-sankey lays the 11 left nodes out uniformly. Chris ask #5: group
       them by theme - small intra-cluster pad, big inter-cluster pad. We
       keep each node's HEIGHT (which encodes its meter count and drives
       link width) and only shift Y positions, then patch each link's y0
       (source-side anchor) to track its source node's new position. */
    const leftNodes = result.nodes.filter((n) => n.col === 'left')
    const originals = new Map(leftNodes.map((n) => [n.id, { y0: n.y0, y1: n.y1, h: n.y1 - n.y0 }]))

    const extentY0 = 64
    const extentY1 = H - 14
    const totalH = extentY1 - extentY0
    const totalNodeH = leftNodes.reduce((s, n) => s + (n.y1 - n.y0), 0)
    const clusterRows = CLUSTERS.map((c) => c.rows)
    const totalIntra = clusterRows.reduce((s, c) => s + Math.max(0, c.length - 1) * INTRA_CLUSTER_PAD, 0)
    const totalInter = Math.max(0, clusterRows.length - 1) * INTER_CLUSTER_PAD
    const scale = Math.max(0, (totalH - totalIntra - totalInter)) / Math.max(1, totalNodeH)

    let y = extentY0
    for (let ci = 0; ci < clusterRows.length; ci++) {
      const cluster = clusterRows[ci]
      for (let ri = 0; ri < cluster.length; ri++) {
        const node = result.nodes.find((n) => n.id === cluster[ri])
        if (!node) continue
        const newH = originals.get(node.id).h * scale
        node.y0 = y
        node.y1 = y + newH
        y += newH
        if (ri < cluster.length - 1) y += INTRA_CLUSTER_PAD
      }
      if (ci < clusterRows.length - 1) y += INTER_CLUSTER_PAD
    }

    /* Patch link source-side y to track the new source node position. */
    result.links.forEach((l) => {
      if (l.source.col === 'left') {
        const orig = originals.get(l.source.id)
        const fraction = orig.h > 0 ? (l.y0 - orig.y0) / orig.h : 0
        l.y0 = l.source.y0 + fraction * (l.source.y1 - l.source.y0)
      }
    })

    return result
  }, [ms])

  /* Per-filter site counts (Chris ask #3). When a platform pill is active,
     each site's right-column count shows only that platform's contribution.
     When no filter, show the full site total. */
  function siteDisplayValue(n) {
    if (!highlightId) return n.value
    if (highlightId === 'ecotricity' || highlightId === 'sycous' || highlightId === 'arbnco') {
      return layout.links
        .filter((l) => l.target.id === n.id && l.source.id === highlightId)
        .reduce((s, l) => s + l.value, 0)
    }
    return n.value
  }

  /* Cluster y-bounds - computed AFTER sankey layout so icons track
     where the sankey actually placed each row. Chris ask 5 Jun r7:
     "move that icon so they sit immediately above the top bar of the
     theme that they represent." We now expose `yTop` (the y0 of the
     top-most row in the cluster) instead of the prior `yMid`, so the
     icon can be anchored ABOVE the first bar rather than floating
     beside the cluster's vertical middle. */
  const clusterPositions = useMemo(() => {
    const byId = new Map(layout.nodes.map((n) => [n.id, n]))
    return CLUSTERS.map((c) => {
      const ys = c.rows.map((id) => byId.get(id)).filter(Boolean)
      if (!ys.length) return null
      const yTop = Math.min(...ys.map((n) => n.y0))
      return { ...c, yTop }
    }).filter(Boolean)
  }, [layout])

  const colours = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const cs = getComputedStyle(document.documentElement)
    const out = {}
    for (const v of Object.values(COMMODITY_COLOR_VAR)) {
      out[v] = cs.getPropertyValue(v).trim() || '#888'
    }
    out['--color-nza-coral'] = cs.getPropertyValue('--color-nza-coral').trim() || '#E8765A'
    return out
  }, [])

  /* STRICT 1-HOP HIGHLIGHT.
     Lit = (the selected node) ∪ (every node directly connected by ONE
     link) ∪ (every link touching the selected node).
     Previous behaviour (BFS across full subgraph) lit everything
     because the graph is fully connected within 2 hops - meaningless
     as a filter. */
  const lit = useMemo(() => {
    if (!highlightId) return { nodes: null, links: null }
    const litLinks = new Set()
    const litNodes = new Set([highlightId])
    for (const l of layout.links) {
      const sid = l.source.id
      const tid = l.target.id
      if (sid === highlightId || tid === highlightId) {
        litLinks.add(l)
        litNodes.add(sid)
        litNodes.add(tid)
      }
    }
    return { nodes: litNodes, links: litLinks }
  }, [highlightId, layout])

  function dim(n) { return lit.nodes && !lit.nodes.has(n.id) ? 0.12 : 1 }
  function dimLink(l) { return lit.links && !lit.links.has(l) ? 0.12 : 1 }
  /* Cluster icon dim - track WHETHER ANY row in the cluster is lit. */
  function dimCluster(c) {
    if (!lit.nodes) return 1
    return c.rows.some((id) => lit.nodes.has(id)) ? 1 : 0.12
  }

  function selectNode(id) {
    setHighlightId((cur) => (cur === id ? null : id))
    setActivePill('all')
  }
  function selectPill(p) {
    setActivePill(p.key)
    setHighlightId(p.nodeId)
  }

  function showNodeTip(e, n) {
    const detail =
      n.col === 'left'
        ? `${n.value.toLocaleString()} meters total across the portfolio`
        : n.col === 'middle'
        ? `${n.value.toLocaleString()} meters routed through ${n.name}`
        : `${n.value.toLocaleString()} meters at this site (sum of all platforms)`
    setTooltip({
      x: e.clientX, y: e.clientY,
      html: `<div style="font-weight:600;color:var(--color-nza-coral);margin-bottom:4px">${escapeHtml(n.name)}</div><div style="color:var(--text-muted-on-dark);font-size:11px;line-height:1.4">${escapeHtml(detail)}</div>`,
    })
  }
  function showLinkTip(e, l) {
    const detail = l.estimated
      ? `Visible only via Arbnco's aggregation - these residents own individual MPANs (DNO / BNO) and aren't billed by Westbrook. Count is the actual arbnco meter count for this site (arb_meters minus eco_meters, electric + gas).`
      : ''
    setTooltip({
      x: e.clientX, y: e.clientY,
      html: `<div style="font-weight:600;color:var(--color-nza-coral);margin-bottom:4px">${escapeHtml(l.source.name)} → ${escapeHtml(l.target.name)}</div><div style="color:var(--text-muted-on-dark);font-size:11px">${l.value.toLocaleString()} meters</div>${detail ? `<div style="color:var(--text-muted-on-dark);font-size:11px;margin-top:6px;line-height:1.4">${escapeHtml(detail)}</div>` : ''}`,
    })
  }
  function hideTip() { setTooltip(null) }

  function handleSvgClick(e) {
    if (e.target === svgRef.current) {
      setHighlightId(null)
      setActivePill('all')
    }
  }

  const ROW_H = 26
  const SITE_ROW_H = 32

  return (
    <>
      {/* Filter pills */}
      {/* Chris ask 4 Jun #10: filter pill row CENTRED above the sankey,
          and pills show the platform LOGO (not text) for Ecotricity /
          Sycous / Arbnco. "All meters" stays as a text pill because
          there's no logo for it. */}
      <div role="tablist" aria-label="Sankey filter" style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {FILTER_PILLS.map((p) => {
          const isActive = activePill === p.key
          const hasLogo = !!p.logo
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={p.label}
              onClick={() => selectPill(p)}
              style={{
                /* Logo pills get tighter horizontal padding so the
                   wordmark sits cleanly inside; text pill keeps its
                   regular padding. Both heights match via the logo's
                   24 px display height + 6/6 vertical padding. */
                padding: hasLogo ? '6px 12px' : '6px 14px',
                borderRadius: 999,
                /* Inactive: subtle 1 px rule. Active: 1 px coral with a
                   gentle coral wash background so the logo wordmark
                   stays legible (filled coral bg would clash with the
                   logo's own brand colour). */
                border: `1px solid ${isActive ? 'var(--color-nza-coral)' : 'var(--rule-on-dark)'}`,
                background: isActive
                  ? (hasLogo ? 'color-mix(in srgb, var(--color-nza-coral) 14%, transparent)' : 'var(--color-nza-coral)')
                  : 'transparent',
                color: isActive && !hasLogo ? '#fff' : 'var(--text-muted-on-dark)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-caption)',
                fontWeight: 400,
                letterSpacing: 0.2,
                cursor: 'pointer',
                transition: 'all 180ms var(--ease-standard)',
                display: 'inline-flex', alignItems: 'center',
                height: 32,
              }}
            >{hasLogo
              ? (<img src={p.logo} alt={p.label}
                   style={{ height: 22, width: 'auto', display: 'block' }} />)
              : p.label}</button>
          )
        })}
      </div>

      {/* Sankey canvas */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
          onClick={handleSvgClick}
        >
          {/* Cluster icons (far left) - one or more icons per group.
              Multi-icon clusters (Resident MPANs = grid + gas) split the
              40 px width horizontally between the icons. */}
          {/* Cluster icons moved BELOW the links group so they float on
              top of the ribbons (Chris ask #6). */}

          {/* Links */}
          <g fill="none">
            {layout.links.map((l, i) => {
              const stroke = colours[l.colorVar] || '#888'
              const baseOp = l.estimated ? 0.25 : 0.45
              return (
                <path
                  key={i}
                  d={sankeyLinkHorizontal()(l)}
                  stroke={stroke}
                  strokeOpacity={baseOp * dimLink(l)}
                  strokeWidth={Math.max(1, l.width)}
                  strokeDasharray={l.estimated ? '4 3' : undefined}
                  style={{ cursor: 'pointer', transition: 'stroke-opacity 200ms var(--ease-standard)' }}
                  onMouseMove={(e) => showLinkTip(e, l)}
                  onMouseLeave={hideTip}
                />
              )
            })}
          </g>

          {/* Cluster icons - floating ON TOP of the ribbons.
              Chris ask 8 Jun (v2): icons now sit above the LABEL area
              (right-aligned with the label text), not in their own
              far-left column. The icon's bottom edge sits 6 px above
              the top of the cluster's first row. Multi-icon clusters
              render their icons side by side, right-aligned with the
              label edge so a 1-icon cluster (Gas) and a 2-icon cluster
              (Resident MPANs + MPRNs) share the same right boundary. */}
          {clusterPositions.map((c) => (
            <foreignObject
              key={c.key}
              x={LEFT_LABEL_X}
              y={c.yTop - CLUSTER_ICON_H - 6}
              width={LEFT_LABEL_W}
              height={CLUSTER_ICON_H}
              style={{ opacity: dimCluster(c), pointerEvents: 'none', transition: 'opacity 200ms var(--ease-standard)' }}
            >
              <div xmlns="http://www.w3.org/1999/xhtml" style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                gap: ICON_GAP,
              }}>
                {c.icons.map((iconUrl, i) => (
                  <span key={i} style={{
                    /* Fixed size per icon - same across clusters regardless of
                       icon count, per Chris ask. */
                    width: ICON_SIZE, height: ICON_SIZE,
                    flexShrink: 0,
                    backgroundColor: `var(${c.colorVar})`,
                    WebkitMaskImage: `url("${iconUrl}")`, maskImage: `url("${iconUrl}")`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center', maskPosition: 'center',
                    WebkitMaskSize: 'contain', maskSize: 'contain',
                  }} />
                ))}
              </div>
            </foreignObject>
          ))}

          {/* Nodes */}
          {layout.nodes.map((n) => {
            const fill = n.colorVar ? (colours[n.colorVar] || '#888') : (colours['--color-nza-coral'] || '#E8765A')
            const op = (n.col === 'middle' ? 0.95 : 0.85) * dim(n)
            const h = Math.max(2, n.y1 - n.y0)
            const yMid = (n.y0 + n.y1) / 2
            return (
              <g key={n.id}>
                <rect
                  x={n.x0} y={n.y0}
                  width={n.x1 - n.x0} height={h}
                  fill={fill} opacity={op} rx={2}
                  style={{ cursor: 'pointer', transition: 'opacity 200ms var(--ease-standard)' }}
                  onClick={(e) => { e.stopPropagation(); selectNode(n.id) }}
                  onMouseMove={(e) => showNodeTip(e, n)}
                  onMouseLeave={hideTip}
                />

                {n.col === 'left' && (
                  /* Single-line label · count, LEFT-aligned right next to
                     the cluster icon (Chris ask #4 - was 2-line right-
                     aligned which (a) wasted horizontal space between
                     icon and label, and (b) overlapped adjacent rows when
                     the sankey gave a row a very small slice). One line
                     means small rows never collide vertically. */
                  <foreignObject
                    x={LEFT_LABEL_X}
                    y={yMid - ROW_H / 2}
                    width={LEFT_LABEL_W}
                    height={ROW_H}
                    style={{ opacity: dim(n), pointerEvents: 'none' }}
                  >
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      gap: 8,
                      width: '100%', height: '100%',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {/* Chris ask 4 Jun #9: label text coloured by
                          cluster theme (gas = red, electric = yellow,
                          heating = red, cold water = blue, resident =
                          slate). Resident MPANs + MPRNs splits across
                          two lines so the dual-fuel rename doesn't eat
                          horizontal space. */}
                      <span style={{
                        fontSize: 14, fontWeight: 500,
                        color: `var(${ROW_TO_CLUSTER_COLOR[n.id] || '--color-theme-body'})`,
                        lineHeight: 1.15,
                        textAlign: 'right',
                        whiteSpace: 'pre-line',
                      }}>{n.id === 'invisible-resident' ? 'Resident MPANs\n+ MPRNs' : n.name}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 400,
                        color: 'var(--text-muted-on-dark)',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}>{n.value.toLocaleString()}</span>
                    </div>
                  </foreignObject>
                )}

                {n.col === 'middle' && (
                  <>
                    {/* BIG brand logo immediately above the node bar -
                        110 x 36. Chris ask 5 Jun r7: "same principle
                        as the [icons for the] logos for the companies
                        who manage the data" - i.e. anchor the platform
                        logos to sit 6 px above the top edge of their
                        bar, matching the cluster-icon rule above.
                        y = bar top - logo height - 6 px gap. */}
                    {n.logo && (
                      <image
                        href={n.logo}
                        x={(n.x0 + n.x1) / 2 - 55}
                        y={n.y0 - 36 - 6}
                        width={110} height={36}
                        opacity={dim(n)}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </>
                )}

                {n.col === 'right' && (
                  /* Big village icon · site name · count, laid out via
                     foreignObject + flex. Chris ask 4 Jun #4: icon
                     FIRST, then name, then count - reads as "village →
                     its meters" rather than abstract text alone. Site
                     icons use fill: currentColor in their source SVGs so
                     mask-image + backgroundColor gives consistent cream
                     tinting on the dark register. */
                  <foreignObject
                    x={n.x1 + 8}
                    y={yMid - SITE_ROW_H / 2}
                    width={W - n.x1 - 16}
                    height={SITE_ROW_H}
                    style={{ opacity: dim(n), pointerEvents: 'none' }}
                  >
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', height: '100%',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {n.siteIcon && (
                        <span aria-hidden style={{
                          display: 'inline-block',
                          width: SITE_ICON_W, height: SITE_ICON_W,
                          flexShrink: 0,
                          backgroundColor: 'var(--color-theme-body)',
                          WebkitMaskImage: `url("${n.siteIcon}")`, maskImage: `url("${n.siteIcon}")`,
                          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center', maskPosition: 'center',
                          WebkitMaskSize: 'contain', maskSize: 'contain',
                        }} />
                      )}
                      <div style={{
                        display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1,
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-site)',
                          fontSize: 14, fontWeight: 500, lineHeight: 1.2,
                          color: 'var(--color-theme-body)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{n.name}</div>
                        <div style={{
                          fontSize: 11, fontWeight: 400,
                          color: 'var(--text-muted-on-dark)',
                          fontVariantNumeric: 'tabular-nums',
                        }}>{siteDisplayValue(n).toLocaleString()} meters</div>
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            )
          })}
        </svg>

        {tooltip && (
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              left: tooltip.x + 12, top: tooltip.y - 10,
              background: '#1A2540',
              border: '1px solid var(--rule-on-dark)',
              color: 'var(--color-theme-body)',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              maxWidth: 280,
              pointerEvents: 'none',
              zIndex: 100,
            }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}
      </div>

      {/* Summary strip removed (Chris ask #5) - the totals + framing read
          better via tooltip + the per-filter site counts on the right
          column. Frees vertical space so the Sankey itself uses it. */}
    </>
  )
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
}
