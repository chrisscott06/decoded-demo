/**
 * DataVintageBadge - small "Data updated {date} · CY2025" chip surfaced
 * in the primary nav (Brief 12 Part 4).
 *
 * Reads `build_timestamp` and `data_period` from portfolio.json. Both
 * already shipped by the pipeline (no build.py change needed). Renders
 * theme-aware (cream or dark register) and degrades gracefully if either
 * value is missing.
 */

import portfolio from '@pipeline-data/portfolio.json'

function formatBuildDate(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-GB', {
      day:   'numeric',
      month: 'short',
      year:  'numeric',
    })
  } catch {
    return null
  }
}

export default function DataVintageBadge({ theme = 'dark' }) {
  const date = formatBuildDate(portfolio?.build_timestamp)
  const period = portfolio?.data_period

  if (!date && !period) return null

  const isCream = theme === 'cream'
  const colour = isCream
    ? 'rgba(31, 51, 40, 0.55)'
    : 'rgba(243, 239, 227, 0.55)'

  return (
    <div
      className="data-vintage-badge data-vintage-badge--inline"
      title={portfolio?.build_timestamp ? `Pipeline build: ${portfolio.build_timestamp}` : undefined}
      style={{ color: colour }}
    >
      {/* Chris ask 4 Jun: dropped the green dot - it was making the
          badge read too loud next to the logo + primary nav. Plain
          muted text sits subtly in the secondary nav strip's far
          right now, doesn't compete with anything. */}
      <span className="data-vintage-text">
        {date && <span>Data updated <strong>{date}</strong></span>}
        {date && period && <span className="data-vintage-sep"> · </span>}
        {period && <span>{period}</span>}
      </span>
    </div>
  )
}
