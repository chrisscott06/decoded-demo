/**
 * WaterTab - Site Detail · Water sub-tab (Brief 12 Part 2).
 *
 * Surfaces:
 *   1. Landlord / bulk water consumption (water.json - id-keyed at top level)
 *      - headline m³, DQ badge, retailer + supply company, coverage period.
 *   2. key_gaps prominently (the gap IS the story - X2/D2).
 *   3. Sycous resident sub-metering panel for sites in the Sycous platform
 *      (sycous.json `by_site[id]`). Cold Water (m³) and Hot Water (m³)
 *      services are surfaced explicitly; heat-only Sycous networks are noted.
 *   4. Non-Sycous sites get a clean "not sub-metered via Sycous" note.
 *
 * Cream register; X2 grammar; zero raw hex.
 */

import waterData from '@pipeline-data/water.json'
import sycousData from '@pipeline-data/sycous.json'
import sites from '@pipeline-data/sites.json'
import DataStatusBadge from '../DataStatusBadge.jsx'
import SiteHeader from './SiteHeader.jsx'

function fmt0(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-GB', { maximumFractionDigits: 0 })
}
function fmt1(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/* Bulk / landlord water card - m³ headline + supply info + key_gaps.
   Chris ask 8 Jun (v2) - the v1 140 px icon dominated the panel and
   ate the vertical space. v2: 64 px icon sits inline-left of the
   content, doesn't stretch the panel, just signals "this is water"
   at the start of the row.
   Chris ask 8 Jun (v3) - the panel-title, panel-subtitle (supplier
   name), and m³ number are all painted in the water blue
   (`#4A7BA0`) so the page reads as a single colour story. */
function BulkWaterCard({ w }) {
  const hasConsumption = w?.consumption_m3 != null && w.consumption_m3 > 0
  const WATER = '#4A7BA0'
  return (
    <div className="panel water-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <span aria-hidden style={{
        display: 'inline-block',
        flex: '0 0 64px',
        width: 64, height: 64,
        marginTop: 2,
        backgroundColor: WATER,
        WebkitMaskImage: 'url(/icons/ivg-nza-icons_water.svg)',
        maskImage:       'url(/icons/ivg-nza-icons_water.svg)',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',   maskPosition: 'center',
        WebkitMaskSize: 'contain',      maskSize: 'contain',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-head">
        <div className="panel-title" style={{ color: WATER }}>Bulk supply</div>
        <div className="panel-subtitle" style={{ color: WATER }}>
          {w?.water_company || 'Water company TBC'}
          {w?.retailer ? ` · ${w.retailer}` : ''}
        </div>
      </div>

      <div className="water-headline">
        {hasConsumption ? (
          <>
            <span className="water-headline-num" style={{ color: WATER }}>{fmt0(w.consumption_m3)}</span>
            <span className="water-headline-unit" style={{ color: WATER }}>m³</span>
          </>
        ) : (
          <span className="water-headline-empty">No billing data received</span>
        )}
      </div>

      <div className="water-meta">
        <div className="water-meta-row">
          <span className="water-meta-label">Status</span>
          <span><DataStatusBadge status={w?.data_status || 'missing'} /></span>
        </div>
        <div className="water-meta-row">
          <span className="water-meta-label">Quality</span>
          <span className="water-meta-value">{w?.data_quality || '-'}</span>
        </div>
        <div className="water-meta-row">
          <span className="water-meta-label">Coverage</span>
          <span className="water-meta-value">{w?.cy2025_coverage || '-'}</span>
        </div>
        <div className="water-meta-row">
          <span className="water-meta-label">Completeness</span>
          <span className="water-meta-value">{w?.completeness || '-'}</span>
        </div>
        <div className="water-meta-row">
          <span className="water-meta-label">Meters known</span>
          <span className="water-meta-value">
            {w?.meters_known ?? '-'}
            {w?.meters_with_cy2025_data != null && w?.meters_known != null
              ? ` (${w.meters_with_cy2025_data} with CY25 data)`
              : ''}
          </span>
        </div>
      </div>

      {w?.key_gaps && (
        <div className="water-gaps">
          <span className="water-gaps-label">Key gaps</span>
          <span className="water-gaps-body">{w.key_gaps}</span>
        </div>
      )}
      </div>
    </div>
  )
}

/* Sycous resident-water panel - Cold Water + Hot Water services when present.
 * Heat-only Sycous networks get a friendly note (water IS sub-metered, just
 * billed through heat). Non-Sycous sites get a clean "not on platform" note. */
function SycousWaterCard({ syc }) {
  if (!syc?.in_sycous) {
    return (
      <div className="panel water-panel water-sycous-panel">
        <div className="panel-head">
          <div className="panel-title">Resident water (Sycous)</div>
          <div className="panel-subtitle">Sub-metered to residents</div>
        </div>
        <p className="water-sycous-note">
          This site is not on the Sycous sub-metering platform - there is no
          per-resident water sub-metering chain to display.
        </p>
      </div>
    )
  }

  // Filter Sycous services to those measured in m³ (cold/hot water).
  // Heat & Hot Water (kWh) is energy-side; it's covered on the Energy tab.
  const waterServices = (syc.by_service || []).filter((s) => s.unit === 'm³')
  const hasMetered = waterServices.length > 0

  return (
    <div className="panel water-panel water-sycous-panel">
      <div className="panel-head">
        <div className="panel-title">Resident water (Sycous)</div>
        <div className="panel-subtitle">Network: {syc.sycous_network}</div>
      </div>

      <div className="water-sycous-summary">
        <div className="water-sycous-stat">
          <div className="water-sycous-stat-label">Properties</div>
          <div className="water-sycous-stat-value">{syc.properties_count ?? '-'}</div>
        </div>
        <div className="water-sycous-stat">
          <div className="water-sycous-stat-label">Meters</div>
          <div className="water-sycous-stat-value">{syc.meters_count ?? '-'}</div>
        </div>
        <div className="water-sycous-stat">
          <div className="water-sycous-stat-label">Services</div>
          <div className="water-sycous-stat-value water-sycous-services">
            {syc.services_covered?.join(' · ') || '-'}
          </div>
        </div>
      </div>

      {hasMetered ? (
        <div className="water-sycous-services-list">
          {waterServices.map((s, i) => (
            <div key={i} className="water-sycous-service">
              <div className="water-sycous-service-head">
                <span className="water-sycous-service-name">{s.service}</span>
                <span className="water-sycous-service-dq">
                  {s.data_quality_pct}% DQ
                </span>
              </div>
              <div className="water-sycous-service-num">
                <span className="water-sycous-service-value">{fmt1(s.annual_total)}</span>
                <span className="water-sycous-service-unit">{s.unit}</span>
                <span className="water-sycous-service-meta">
                  · {s.properties} props · {s.valid_reads}/{s.total_reads} valid reads
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="water-sycous-note">
          This Sycous network meters {syc.services_covered?.join(' & ') || 'heat'}
          {' '}only - resident water at this site is not separately sub-metered
          (it’s bundled into the heat-network billing).
        </p>
      )}

      {syc.reconciliation_note && (
        <p className="water-sycous-recon">{syc.reconciliation_note}</p>
      )}
    </div>
  )
}

export default function WaterTab({ siteId, site: siteProp }) {
  const w = waterData?.[siteId]
  const syc = sycousData?.by_site?.[siteId]
  /* `site` arrives from the parent (SitePage). Fall back to local
     sites.json lookup if WaterTab is mounted standalone (e.g. tests). */
  const site = siteProp || sites?.[siteId]

  return (
    <div className="page">
      {/* Chris ask 5 Jun r4: shared SiteHeader as the first child of
          `.page` so the 62 px navy site icon sits at the same x/y as
          on Overview and the other sub-tabs. Drops the prior
          `.water-header` block (redundant - SiteHeader already
          renders the eyebrow + site name). */}
      <SiteHeader site={site} />

      <div className="water-grid">
        <BulkWaterCard w={w} />
        <SycousWaterCard syc={syc} />
      </div>
    </div>
  )
}
