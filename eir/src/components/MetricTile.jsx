import DataStatusBadge from './DataStatusBadge.jsx'

/**
 * MetricTile - label + value + unit + optional status badge + optional "why this matters" callout.
 *
 * Flat card, no shadow. Background uses surface-on-dark/cream tokens.
 *
 * Props:
 *   label    - uppercase muted label (e.g. "Electricity (landlord)")
 *   value    - the big number, string or formatted node
 *   unit     - small suffix (e.g. "kWh", "m²")
 *   status   - optional DataStatusBadge status
 *   why      - optional callout line
 *   big      - make the value 64px (default 48)
 *   onClick  - optional, makes the tile clickable
 *   iconUrl  - optional Chris-supplied Westbrook×NZA mask SVG; renders inline
 *              with the label (Chris ask 2026-06-02 - Site Overview
 *              tiles now carry the same icon language as the home
 *              page tiles).
 */
export default function MetricTile({ label, value, unit, status, why, big = false, onClick, iconUrl }) {
  const classes = ['tile']
  if (onClick) classes.push('clickable')
  if (iconUrl) classes.push('tile-with-icon')

  /* Chris ask 2026-06-02: when iconUrl is supplied, render the tile
     icon-left + text-right (same shape as the home page tiles). The
     existing column-flex stack stays as fallback for tiles without
     an icon. */
  if (iconUrl) {
    return (
      <div
        className={classes.join(' ')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 60,
            height: 60,
            flex: '0 0 60px',
            backgroundColor: 'currentColor',
            color: 'var(--color-nza-coral)',
            WebkitMaskImage: `url(${iconUrl})`,
            maskImage: `url(${iconUrl})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 auto' }}>
          <div className="tile-label">{label}</div>
          <div className={`tile-value${big ? ' tile-value-big' : ''}`}>
            <span>{value ?? '-'}</span>
            {unit && <span className="tile-unit">{unit}</span>}
            {status && (
              <span className="tile-status" style={{ marginLeft: 'auto' }}>
                <DataStatusBadge status={status} />
              </span>
            )}
          </div>
          {why && <div className="tile-why">{why}</div>}
        </div>
      </div>
    )
  }

  /* No icon - original column layout. */
  return (
    <div className={classes.join(' ')} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="tile-label">{label}</div>
      <div className={`tile-value${big ? ' tile-value-big' : ''}`}>
        <span>{value ?? '-'}</span>
        {unit && <span className="tile-unit">{unit}</span>}
        {status && (
          <span className="tile-status" style={{ marginLeft: 'auto' }}>
            <DataStatusBadge status={status} />
          </span>
        )}
      </div>
      {why && <div className="tile-why">{why}</div>}
    </div>
  )
}
