/**
 * WasteTab - Site Detail · Waste sub-tab (Brief 12 Part 1).
 *
 * X2 page grammar: heading + short context, rich visual, single view at
 * 1440×900 (Hard Rule 9). Cream register only - this tab is reached via
 * /site/{id}/waste which the existing BodyPageLayout already paints cream.
 *
 * Data: waste.json (id-keyed at top level - `waste[siteId]`). Fields:
 *   contractor, tonnage_total, tonnage_by_stream {general/recycling/glass/
 *   organic/cardboard}, disposal_split {landfill/incinerated/recycled/ad},
 *   emissions_by_route, emissions_scope3_cat5_tco2e, diversion_rate,
 *   data_status, data_period, notes.
 *
 * Office (Edwalton) carries `data_status: not_applicable` and null tonnages
 * - render the clean empty state, not blanks.
 *
 * Zero raw hex; every colour flows through index.css tokens.
 */

import wasteData from '@pipeline-data/waste.json'
import sites from '@pipeline-data/sites.json'
import DataStatusBadge from '../DataStatusBadge.jsx'
import SiteHeader from './SiteHeader.jsx'

const STREAM_TOKENS = {
  general:   'var(--color-risk-major)',          // residual - undesirable
  /* Chris ask 8 Jun: --theme-waste rotated teal → purple (swap with
     --theme-meters). Recycling now renders in the NZA-family purple,
     keeping waste off the green/teal "low-carbon" semantic and
     ceding that colour to carbon. Glass stays dark teal — the two
     are no longer a teal pair but the stream-family logic still
     reads in the bar chart. */
  recycling: 'var(--theme-waste)',               // purple (was green pre-4-Jun, teal 4-8 Jun, now purple)
  glass:     'var(--color-categorical-supply-chain)', // dark teal
  organic:   'var(--color-risk-low)',            // lime-green
  cardboard: 'var(--metric-electricity)',        // amber-gold
}
const STREAM_LABELS = {
  general:   'General (residual)',
  recycling: 'Recycling',
  glass:     'Glass',
  organic:   'Organic',
  cardboard: 'Cardboard',
}

const DISPOSAL_TOKENS = {
  landfill:    'var(--color-risk-major)',
  incinerated: 'var(--color-risk-moderate)',
  recycled:    'var(--color-risk-low)',
  ad:          'var(--theme-waste)',
}
const DISPOSAL_LABELS = {
  landfill:    'Landfill',
  incinerated: 'Incinerated (EfW)',
  recycled:    'Recycled',
  ad:          'AD / Composted',
}

function fmt1(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
function fmt2(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function pct(n, digits = 1) {
  if (n == null) return '-'
  return Number(n * 100).toFixed(digits)
}

/* Horizontal value bar - flat, semantic, tokenised. */
function ValueBar({ label, value, share, colour, unit = 't' }) {
  const widthPct = Math.max(0, Math.min(100, share * 100))
  return (
    <div className="waste-bar-row">
      <div className="waste-bar-label">{label}</div>
      <div className="waste-bar-track">
        <div className="waste-bar-fill" style={{ width: `${widthPct}%`, background: colour }} />
      </div>
      <div className="waste-bar-value">
        <span className="waste-bar-num">{fmt1(value)}</span>
        <span className="waste-bar-unit">{unit}</span>
      </div>
    </div>
  )
}

/* Conic-gradient diversion ring + big % in the middle. */
function DiversionRing({ rate }) {
  const pctValue = rate == null ? 0 : Math.round(rate * 1000) / 10 // one dp
  const fillDeg = pctValue * 3.6
  return (
    <div className="waste-ring">
      <div
        className="waste-ring-disc"
        style={{
          background: `conic-gradient(var(--color-risk-low) 0deg ${fillDeg}deg, var(--color-risk-major) ${fillDeg}deg 360deg)`,
        }}
      >
        <div className="waste-ring-inner">
          <div className="waste-ring-pct">{pctValue.toFixed(1)}%</div>
          <div className="waste-ring-label">diverted<br/>from landfill</div>
        </div>
      </div>
    </div>
  )
}

export default function WasteTab({ siteId, site: siteProp }) {
  const w = wasteData?.[siteId]
  /* `site` arrives from parent; fall back to local lookup for standalone use. */
  const site = siteProp || sites?.[siteId]

  // Not-applicable (Edwalton office) - clean state, not blanks.
  if (!w || w.data_status === 'not_applicable') {
    return (
      <div className="page">
        <SiteHeader site={site} />
        <div className="empty-state-card">
          <p className="empty-state-headline">No waste contract for this site.</p>
          <p className="empty-state-body">
            {w?.notes || 'Treated centrally / serviced via building landlord - not in IVG’s operational waste boundary.'}
          </p>
        </div>
      </div>
    )
  }

  // Missing / no data - honest pending state.
  if (w.data_status === 'missing' || !w.tonnage_total) {
    return (
      <div className="page">
        <SiteHeader site={site} />
        <div className="empty-state-card">
          <p className="empty-state-headline">Waste data pending.</p>
          <p className="empty-state-body">{w?.notes || 'Contractor data not yet received for this site.'}</p>
        </div>
      </div>
    )
  }

  const total = w.tonnage_total
  const streams = w.tonnage_by_stream || {}
  const split = w.disposal_split || {}
  const emissions = w.emissions_scope3_cat5_tco2e
  const diversion = w.diversion_rate

  return (
    <div className="page">
      <SiteHeader site={site} />
      {/* Chris ask 8 Jun - big recycling icon on the left anchors
          the waste page visually before the tonnage hero reads.
          Stacks horizontally: icon | tonnage block | diversion ring.
          Chris ask 8 Jun (v2) - tint the tonnage number + contractor
          name in the same waste purple (`#8B6FB8`) as the icon so the
          page reads as a single colour story (matches what Water now
          does in blue). The DataStatusBadge keeps its own palette. */}
      <div className="waste-header" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span aria-hidden style={{
          display: 'inline-block',
          flex: '0 0 140px',
          width: 140, height: 140,
          backgroundColor: '#8B6FB8',
          WebkitMaskImage: 'url(/icons/ivg-nza-icons_recycling.svg)',
          maskImage:       'url(/icons/ivg-nza-icons_recycling.svg)',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',   maskPosition: 'center',
          WebkitMaskSize: 'contain',      maskSize: 'contain',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="waste-h1" style={{ color: '#8B6FB8' }}>
            {fmt1(total)}<span className="waste-h1-unit" style={{ color: '#8B6FB8' }}> tonnes</span>
          </h2>
          <p className="waste-context">
            <strong style={{ color: '#8B6FB8' }}>{w.contractor || 'Contractor TBC'}</strong>
            {' · '}
            <DataStatusBadge status={w.data_status} />
            {' · '}
            {w.data_period || 'CY2025'}
          </p>
        </div>
        <DiversionRing rate={diversion} />
      </div>

      <div className="waste-grid">
        <div className="panel waste-panel">
          <div className="panel-head">
            <div className="panel-title">By stream</div>
            <div className="panel-subtitle">Tonnage per waste stream</div>
          </div>
          <div className="waste-bars">
            {Object.keys(STREAM_LABELS).map((k) => {
              const v = streams[k] || 0
              const share = total > 0 ? v / total : 0
              return (
                <ValueBar
                  key={k}
                  label={STREAM_LABELS[k]}
                  value={v}
                  share={share}
                  colour={STREAM_TOKENS[k]}
                />
              )
            })}
          </div>
        </div>

        <div className="panel waste-panel">
          <div className="panel-head">
            <div className="panel-title">Disposal fate</div>
            <div className="panel-subtitle">Where the waste actually ends up</div>
          </div>
          <div className="waste-bars">
            {Object.keys(DISPOSAL_LABELS).map((k) => {
              const v = split[k] || 0
              const share = total > 0 ? v / total : 0
              return (
                <ValueBar
                  key={k}
                  label={DISPOSAL_LABELS[k]}
                  value={v}
                  share={share}
                  colour={DISPOSAL_TOKENS[k]}
                />
              )
            })}
          </div>
        </div>

        <div className="panel waste-panel waste-emissions-panel">
          <div className="panel-head">
            <div className="panel-title">Scope 3 Cat 5 emissions</div>
            <div className="panel-subtitle">DEFRA 2025 factors · operational waste</div>
          </div>
          <div className="waste-emissions-big">
            <span className="waste-emissions-num">{fmt2(emissions)}</span>
            <span className="waste-emissions-unit">tCO₂e</span>
          </div>
          <p className="waste-emissions-narrative">
            Near-total diversion makes Scope 3 Cat 5 a rounding error on the
            site’s carbon footprint - {pct(diversion)}% of mass is kept out of
            landfill, so the bulk of mass moves through low-factor routes
            (recycling, AD, EfW with energy recovery).
          </p>
        </div>
      </div>

      {w.notes && (
        <div className="waste-notes">
          <span className="waste-notes-label">Method</span>
          <span className="waste-notes-body">{w.notes}</span>
        </div>
      )}
    </div>
  )
}
