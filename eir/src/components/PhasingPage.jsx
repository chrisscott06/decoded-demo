/**
 * PhasingPage - standalone phasing reference table (Brief 15 Part 4).
 *
 * Chris's brief: "just a standalone reference table for now". A table view
 * of the generic data behind every site. Built from REAL fields only -
 * sites.json has a `phasing` block (`open_year`, `phases[]` with
 * `phase`/`units`/`complete_year`, `total_units_planned`, `current_units`,
 * `status`, `notes`) and a SITE-LEVEL `archetype` (`primary_heating`,
 * `grid_type`, etc.).
 *
 * CRITICAL - data reality: there is NO per-phase heating or per-phase
 * power strategy in the data. Only ONE strategy per whole site. So this
 * table surfaces what EXISTS (units per phase, timing, site-level
 * heating/grid, occupancy, status) and explicitly flags the per-phase
 * heating/power gap as an Westbrook ask. Do NOT fabricate per-phase strategy.
 *
 * This page doubles as the structured ask handed back to Westbrook to firm up
 * in writing (Brief Principle 3, honest data never fabricated).
 *
 * Cream register; reuses Brief 14's --font-site for the village names.
 */

import { useEffect } from 'react'
import sites from '@pipeline-data/sites.json'

function PhaseRow({ site, phase, isFirst, totalPhases }) {
  const a = site.archetype || {}
  const id = site.identity || {}
  return (
    <tr className={isFirst ? 'phasing-row-first' : ''}>
      {/* Site cell - only on first phase row, spans all phases. */}
      {isFirst ? (
        <td className="phasing-cell-site" rowSpan={totalPhases}>
          <div className="phasing-site-name">{site.display_name}</div>
          <div className="phasing-site-ref">{site.ref || ''}</div>
        </td>
      ) : null}

      <td className="phasing-cell-num">{phase.phase}</td>
      <td className="phasing-cell-num">{phase.units > 0 ? phase.units : '-'}</td>
      <td className="phasing-cell-text">
        {phase.complete_year > 0
          ? (site.phasing?.open_year
              ? site.phasing.open_year + (phase.complete_year - 1)
              : `+${phase.complete_year - 1}y`)
          : '-'}
      </td>

      {/* Site-level rows - only on first phase row, spans all phases. */}
      {isFirst ? (
        <>
          <td className="phasing-cell-text" rowSpan={totalPhases}>{a.primary_heating || '-'}</td>
          <td className="phasing-cell-text" rowSpan={totalPhases}>{a.grid_type || '-'}</td>
          <td className="phasing-cell-text" rowSpan={totalPhases}>
            {a.solar_pv_kwp ? `${a.solar_pv_kwp} kWp` : '-'}
          </td>
          <td className="phasing-cell-text" rowSpan={totalPhases}>
            {site.phasing?.status || '-'}
            {id.occupancy_pct != null && (
              <span className="phasing-meta"> · {id.occupancy_pct}% occ</span>
            )}
          </td>
          <td className="phasing-cell-gap" rowSpan={totalPhases}>
            {/* Brief Principle 3: explicit Westbrook ask, not fabricated data. */}
            Confirm per-phase
          </td>
        </>
      ) : null}
    </tr>
  )
}

export default function PhasingPage() {
  // Brief 15 Part 4 - PhasingPage uses the cream register (same as Site
  // Detail) for dense tabular reading. PortfolioPage's DashboardLayout
  // is dark by default, so toggle body.theme-cream while mounted (mirrors
  // BodyPageLayout's approach for Site Detail).
  useEffect(() => {
    document.body.classList.add('theme-cream')
    return () => document.body.classList.remove('theme-cream')
  }, [])

  // Filter to sites with phasing data (excludes Edwalton office which has
  // phasing: null). Sort by display_name.
  const sitesWithPhasing = Object.values(sites)
    .filter((s) => s.phasing && Array.isArray(s.phasing.phases) && s.phasing.phases.length > 0)
    .sort((a, b) => a.display_name.localeCompare(b.display_name))

  // Portfolio totals
  const totalUnits = sitesWithPhasing.reduce((sum, s) => sum + (s.identity?.completed || 0), 0)
  const totalPlanned = sitesWithPhasing.reduce((sum, s) => sum + (s.phasing?.total_units_planned || 0), 0)
  const totalSites = sitesWithPhasing.length

  return (
    <div className="page phasing-page">
      <div className="phasing-header">
        <p className="eyebrow">Reference · phasing</p>
        <h1 className="phasing-h1">Site phasing &amp; strategy reference</h1>
        <p className="phasing-narrative">
          A reference table covering each of the {totalSites} villages with
          phasing data - {totalUnits.toLocaleString('en-GB')} units complete of {totalPlanned.toLocaleString('en-GB')} planned.
          Phasing timing and unit count come from the sites workbook. The
          heating, grid, and solar columns are <strong>site-level only</strong> -
          the workbook does not currently capture per-phase heating or power
          strategy. The right-most column is an explicit Westbrook ask:
          confirm whether each phase shares the site-level strategy or
          diverges (relevant for sites in flight like Eastlea Federation where
          the heat network is partial).
        </p>
      </div>

      <div className="phasing-table-wrap">
        <table className="phasing-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Phase</th>
              <th>Units</th>
              <th>Complete by</th>
              <th>Heating (site-level)</th>
              <th>Grid (site-level)</th>
              <th>Solar PV (site-level)</th>
              <th>Status &amp; occupancy</th>
              <th className="phasing-th-gap">Per-phase strategy</th>
            </tr>
          </thead>
          <tbody>
            {sitesWithPhasing.map((site) => {
              const phases = site.phasing.phases
              return phases.map((p, i) => (
                <PhaseRow
                  key={`${site.id}-${p.phase}`}
                  site={site}
                  phase={p}
                  isFirst={i === 0}
                  totalPhases={phases.length}
                />
              ))
            })}
          </tbody>
        </table>
      </div>

      <div className="phasing-footnote">
        <span className="phasing-footnote-label">Westbrook ask</span>
        <span>
          For each site, please confirm whether the per-phase heating and
          power strategy matches the site-level archetype shown above, or
          whether phases diverge (e.g. early phases on gas while later
          phases moved to ASHP / heat network). This information will
          feed the GHG inventory's Scope 1 boundary precision.
        </span>
      </div>
    </div>
  )
}
