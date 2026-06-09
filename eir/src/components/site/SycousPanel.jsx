/**
 * SycousPanel - shared component surfacing the resident-billing chain
 * (Brief 12 Part 3).
 *
 * Westbrook's most distinctive operational data: the bulk-supply → Sycous
 * sub-metering → resident-bill chain. No other retirement-village operator
 * has this. Used in two contexts:
 *
 *   mode="full"   - Data-quality tab: full per-service table with DQ%,
 *                   network, properties + meters, reconciliation note.
 *   mode="energy" - Energy tab: just the kWh services (Electricity + heat),
 *                   framed as resident energy beneath the landlord bulk chart.
 *
 * Non-Sycous sites get a clean, single-line "not on platform" note in either
 * mode. Sites with services missing in the chosen mode get a contextual note
 * (e.g. "this Sycous network meters heat only").
 *
 * Cream register; X2 grammar; zero raw hex.
 */

import sycousData from '@pipeline-data/sycous.json'

function fmtCompact(n) {
  if (n == null) return '-'
  const v = Number(n)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 10_000)    return `${(v / 1_000).toFixed(0)}k`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('en-GB', { maximumFractionDigits: 1 })
}
function fmt(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-GB', { maximumFractionDigits: 1 })
}

/* Service tile - one tile per Sycous service. Used by both modes. */
function ServiceTile({ s }) {
  const dq = s.data_quality_pct ?? 0
  const dqClass =
    dq >= 95 ? 'sycous-dq-good' :
    dq >= 50 ? 'sycous-dq-mid'  :
               'sycous-dq-low'

  return (
    <div className="sycous-service-tile">
      <div className="sycous-service-name">{s.service}</div>
      <div className="sycous-service-figure">
        <span className="sycous-service-value">{fmtCompact(s.annual_total)}</span>
        <span className="sycous-service-unit">{s.unit}</span>
      </div>
      <div className="sycous-service-meta">
        {s.properties} props · {s.meters} meters
      </div>
      <div className={`sycous-service-dq ${dqClass}`}>
        <span className="sycous-service-dq-num">{dq}%</span>
        <span className="sycous-service-dq-label">
          {s.valid_reads}/{s.total_reads} valid reads
        </span>
      </div>
    </div>
  )
}

export default function SycousPanel({ siteId, mode = 'full' }) {
  const syc = sycousData?.by_site?.[siteId]

  // Non-Sycous: clean note, identical in both modes.
  if (!syc?.in_sycous) {
    return (
      <div className="sycous-panel sycous-panel-empty">
        <div className="sycous-panel-head">
          <div className="sycous-panel-title">Resident sub-metering (Sycous)</div>
        </div>
        <p className="sycous-empty-note">
          This site is not on the Sycous sub-metering platform. The
          resident-billing chain shown for sub-metered sites is not
          available here - residents are billed directly by suppliers (no
          Westbrook sub-meter layer).
        </p>
      </div>
    )
  }

  // Filter services to the mode.
  const allServices = syc.by_service || []
  const energyServices = allServices.filter((s) => s.unit === 'kWh')
  const services = mode === 'energy' ? energyServices : allServices

  return (
    <div className="sycous-panel">
      <div className="sycous-panel-head">
        <div className="sycous-panel-title">
          {mode === 'energy' ? 'Resident energy (Sycous)' : 'Resident sub-metering (Sycous)'}
        </div>
        <div className="sycous-panel-subtitle">
          Network: <strong>{syc.sycous_network}</strong> · {syc.properties_count} properties · {syc.meters_count} meters
        </div>
      </div>

      {services.length > 0 ? (
        <div className="sycous-services-grid">
          {services.map((s, i) => <ServiceTile key={i} s={s} />)}
        </div>
      ) : (
        <p className="sycous-empty-note">
          This Sycous network meters{' '}
          <strong>{syc.services_covered?.join(' & ') || 'this site'}</strong>
          {' '}only - no resident {mode === 'energy' ? 'energy' : ''} services
          measured in this chain.
        </p>
      )}

      {mode === 'energy' && services.length > 0 && (
        <p className="sycous-recon-note">
          Bulk landlord supply (charted above) → Sycous resident sub-metering
          (below) is the resident-billing reconciliation. The gap between the
          two is the resident consumption Westbrook passes through but doesn’t bill
          itself - Scope 3 Cat 13 in the GHG inventory.
        </p>
      )}

      {mode === 'full' && syc.reconciliation_note && (
        <p className="sycous-recon-note">{syc.reconciliation_note}</p>
      )}
    </div>
  )
}
