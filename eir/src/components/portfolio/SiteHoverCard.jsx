import { useRef } from 'react'
import { formatValue } from '../../lib/mapThemes.js'
import { STATUS_HEX } from '../../tokens/chart-colors.js'

/**
 * SiteHoverCard - floating site summary card.
 *
 * Brief 14 Part 4 redesign:
 *   - Bare hover no longer shows the card. Hover highlights the map only;
 *     the card appears on CLICK (`selected` semantics).
 *   - The card is the ONLY navigation path out of the Portfolio Map. Bare
 *     clicks on marker or leaderboard row select but do not navigate. The
 *     card carries an explicit "View site →" CTA that calls onViewSite.
 *   - Duplicate-energy bug (Brief defect #5) fixed: card now lists the
 *     five domain summaries (elec, gas, water, waste, carbon) once each;
 *     no separate "active metric" line repeating whatever the user just
 *     selected via the theme pills.
 *   - pointerEvents now ENABLED so the View-site button + dismiss action work.
 *   - Includes an explicit close (×) button + onDismiss prop.
 *
 * Props:
 *   site       - sites.json entry (or null → renders nothing)
 *   energy     - energy.json entry
 *   water      - water.json entry
 *   waste      - waste.json entry
 *   carbon     - carbon.json.by_site entry
 *   onViewSite - () => void, called by the "View site →" CTA. The ONLY
 *                path that leaves the Portfolio section.
 *   onDismiss  - () => void, optional close handler (× button)
 */

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  partial: 'Partial',
  missing: 'Missing',
  not_applicable: 'N/A',
}

/* Chris ask 2026-06-03: status badges now ride the IVG icon language
   from the home page tiles, laid out in a uniform 2×2 grid so each
   cell occupies the same footprint regardless of label length. The
   icon picks up the status colour via mask + currentColor; the label
   + status text sit to the right. */
const DOMAIN_ICONS = {
  Elec:  '/icons/ivg-nza-icons_elec-solid.svg',
  Gas:   '/icons/ivg-nza-icons_gas-solid.svg',
  Water: '/icons/ivg-nza-icons_water.svg',
  Waste: '/icons/ivg-nza-icons_recycling.svg',
}
function DqBadge({ label, status }) {
  const color = STATUS_HEX[status] || STATUS_HEX.missing
  const iconUrl = DOMAIN_ICONS[label]
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.04)',
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        lineHeight: 1.3,
        color: 'var(--color-theme-body)',
        minWidth: 0,
      }}
    >
      {iconUrl && (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            flex: '0 0 16px',
            backgroundColor: 'currentColor',
            color,
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
      )}
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}: <span style={{ color }}>{STATUS_LABELS[status] || status}</span>
      </span>
    </span>
  )
}

/* Summary row: label : value pair. Used for the five domain figures. */
function SummaryRow({ label, value, unit }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '4px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{
        fontSize: 11,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: 'var(--text-muted-on-dark)',
      }}>
        {label}
      </span>
      <span style={{
        /* Chris ask 2026-06-03: IBM Plex Mono dropped from the card -
           data values now ride the same Stolzl heading face as the rest
           of the dashboard. Tabular-nums keeps numeric alignment. */
        fontFamily: 'var(--font-heading)',
        fontSize: 12.5,
        fontWeight: 500,
        color: 'var(--color-theme-body)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value == null || value === '' ? <span style={{ color: 'var(--text-muted-on-dark)' }}>-</span> : (
          <>
            {value}
            {unit && <span style={{ color: 'var(--text-muted-on-dark)', marginLeft: 4 }}>{unit}</span>}
          </>
        )}
      </span>
    </div>
  )
}

export default function SiteHoverCard({ site, energy, water, waste, carbon, onViewSite, onDismiss }) {
  /* Brief 19 follow-up (Chris 4 Jun): clamp.right logic dropped.
     Placement is now driven by the parent (PortfolioMap) via
     quadrant-aware translate based on marker pos.x / pos.y so the
     card always opens away from the nearest viewport edge. */
  const ref = useRef(null)

  if (!site) return null

  const units = site.identity?.completed
  const gia = site.identity?.total_gia_m2

  // Domain figures (clean, deduped - no separate "active metric" line)
  const elec = energy?.consumption_kwh?.electricity
  const gas = energy?.consumption_kwh?.gas
  const waterM3 = water?.consumption_m3
  const wasteT = waste?.tonnage_total
  const carbonT = carbon?.total_actual_tco2e
  const diversion = waste?.diversion_rate

  // DQ status across streams
  const elecPresent = typeof elec === 'number'
  const gasApplicable = site.scope_allocation?.has_gas === true
  const gasPresent = typeof gas === 'number'
  const elecStatus = elecPresent ? 'confirmed' : 'missing'
  const gasStatus = !gasApplicable ? 'not_applicable' : (gasPresent ? 'confirmed' : 'missing')
  const waterStatus = water?.data_status || 'missing'
  const wasteStatus = waste?.data_status || 'missing'

  // Format helpers
  const fmtKwh = (v) => (typeof v === 'number' ? `${formatValue(v, 'kwh')} kWh` : null)
  const fmtM3 = (v) => (typeof v === 'number' ? `${v.toLocaleString('en-GB')}` : null)
  const fmtT = (v) => (typeof v === 'number' ? `${(Math.round(v * 10) / 10).toLocaleString('en-GB')}` : null)
  const fmtTCO2 = (v) => (typeof v === 'number' ? `${(Math.round(v * 10) / 10).toLocaleString('en-GB')}` : null)

  // Waste value + diversion strap as a single cell
  const wasteValueNode = typeof wasteT === 'number'
    ? (
      <>
        {fmtT(wasteT)}
        {typeof diversion === 'number' && (
          <span style={{ color: 'var(--text-muted-on-dark)', marginLeft: 4 }}>
            t · {Math.round(diversion * 100)}% diverted
          </span>
        )}
      </>
    )
    : null

  return (
    <div
      ref={ref}
      style={{
        /* Brief 19 follow-up (Chris 4 Jun): NOT position: absolute. The
           parent wrapper is the absolutely-positioned element + the one
           that owns the transform. If THIS element is absolute too, the
           wrapper collapses to 0×0 and its translate(-100%, -100%)
           reduces to (0, 0) - the card never actually moves by its own
           dimensions. Static layout here lets the wrapper inherit our
           dimensions so the parent's transform works as intended. */
        position: 'relative',
        // Brief 14 Part 4: pointerEvents now AUTO (was none) so the
        // View-site button + close (×) actually work.
        pointerEvents: 'auto',
        zIndex: 30,
        background: 'rgba(20, 28, 50, 0.97)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 8,
        padding: '12px 14px 10px',
        minWidth: 260,
        maxWidth: 320,
        boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        animation: 'nza-entry 180ms var(--ease-standard) both',
      }}
    >
      {/* Header - site icon + name + close */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}>
        {site.id === 'edwalton-office' ? (
          <span className="site-icon site-icon-fallback" aria-hidden>iv</span>
        ) : (
          <span
            className="site-icon"
            aria-hidden
            style={{ '--site-icon-url': `url(/sites/${site.id}/icon.svg)` }}
          />
        )}
        {/* Brief 14 Part 5 - site/village name in --font-site (Source Serif 4). */}
        <div style={{
          fontFamily: 'var(--font-site)',
          fontWeight: 500,
          fontSize: 'var(--text-lg)',
          color: 'var(--color-theme-body)',
          lineHeight: 1.2,
          flex: 1,
        }}>
          {site.display_name || site.id}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close site card"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted-on-dark)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '4px 6px',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-theme-body)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted-on-dark)' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Identity strip */}
      <div style={{
        display: 'flex',
        gap: 12,
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'var(--text-muted-on-dark)',
        marginBottom: 10,
      }}>
        {typeof units === 'number' && <span>{units} units</span>}
        {typeof gia === 'number' && <span>{formatValue(gia, 'm2')} m² GIA</span>}
        {site.archetype?.primary_heating && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {site.archetype.primary_heating}
          </span>
        )}
      </div>

      {/* Five domain figures - no duplication, one row per domain */}
      <div style={{ marginBottom: 10 }}>
        <SummaryRow label="Electricity" value={fmtKwh(elec)} />
        <SummaryRow label="Gas" value={gasApplicable ? fmtKwh(gas) : null} unit={!gasApplicable ? '(none)' : null} />
        <SummaryRow label="Water" value={fmtM3(waterM3)} unit={fmtM3(waterM3) ? 'm³' : null} />
        <SummaryRow label="Waste" value={wasteValueNode} />
        <SummaryRow label="Carbon" value={fmtTCO2(carbonT)} unit={fmtTCO2(carbonT) ? 'tCO₂e' : null} />
      </div>

      {/* DQ badges - 2×2 grid so cells are uniform, not staggered. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 6,
        marginBottom: 10,
      }}>
        <DqBadge label="Elec" status={elecStatus} />
        <DqBadge label="Gas" status={gasStatus} />
        <DqBadge label="Water" status={waterStatus} />
        <DqBadge label="Waste" status={wasteStatus} />
      </div>

      {/* View-site CTA - the ONLY navigation path out of the Portfolio Map.
          Brief 14 Part 4 "click contract": bare clicks never navigate;
          leaving the Portfolio section is a deliberate choice on this button. */}
      {onViewSite && (
        <button
          type="button"
          onClick={onViewSite}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--color-nza-coral)',
            border: 'none',
            borderRadius: 6,
            color: 'var(--color-nza-cream)',
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.3,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
        >
          View site <span aria-hidden>→</span>
        </button>
      )}
    </div>
  )
}
