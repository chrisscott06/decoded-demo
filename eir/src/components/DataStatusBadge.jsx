/**
 * DataStatusBadge - pill component for data status.
 *
 * status: 'confirmed' | 'partial' | 'missing' | 'not_applicable'
 * label?: override the auto-derived label
 * noDot?: omit the leading dot glyph
 */
export default function DataStatusBadge({ status = 'missing', label, noDot = false }) {
  const text = label ?? defaultLabel(status)
  const classes = ['badge', `badge-${status}`]
  if (noDot) classes.push('no-dot')
  return <span className={classes.join(' ')}>{text}</span>
}

function defaultLabel(status) {
  switch (status) {
    case 'confirmed': return 'Confirmed'
    case 'partial': return 'Partial'
    case 'missing': return 'Missing'
    case 'not_applicable': return 'N/A'
    default: return status
  }
}
