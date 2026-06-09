/**
 * Sidebar - persistent left rail listing all sites, used on Site Detail
 * pages.
 *
 * Brief 24 Part 2 overhaul (4 Jun):
 *   - Darker background (was the cream-elev; now near-navy elev so the
 *     dark register reads consistently against the secondary nav above)
 *   - Site icon replaces the small status dot. Icon tinted by GRESB
 *     readiness (mask-image + currentColor). Falls back to a coloured
 *     dot for the Edwalton office (no site icon SVG).
 *   - Below the icon row: 4 thin sub-indicator pills (elec / gas /
 *     water / waste), each coloured by its sub-indicator state. Tooltip
 *     names the indicator + state on hover.
 *   - Footer key explaining the four readiness pills.
 *
 * Props:
 *   sites: array of { id, display_name }
 *   activeSiteId: string | null
 *   navigate: (path) => void
 *   subTab: current site sub-tab (overview/energy/...) - used in href
 *   statusFor: optional (siteId) => 'confirmed'|'partial'|'missing'
 *              (kept for backward compat - used as 4-pill fallback if
 *              gresbReadiness can't compute)
 *   readinessFor: (siteId) => { electricity, gas, water, waste, overall }
 *                 from siteDerivations.gresbReadiness - new in Brief 24
 */

const READINESS_COLOUR = {
  green: '#3D8B5C',   /* --theme-carbon (Brief 24-rotation green) */
  amber: '#E6B91E',
  red:   '#D85F4D',
  'n/a': 'rgba(255,255,255,0.18)',
}

const SUB_LABEL = {
  electricity: 'Electricity',
  gas:         'Gas',
  water:       'Water',
  waste:       'Waste',
}

export default function Sidebar({
  sites, activeSiteId, navigate, subTab = 'overview',
  statusFor, readinessFor,
}) {
  const sorted = [...sites].sort((a, b) => a.display_name.localeCompare(b.display_name))
  return (
    <aside className="sidebar sidebar--brief24">
      <div className="sidebar-header">Sites</div>
      <nav className="sidebar-nav">
        {sorted.map((s) => {
          const readiness = readinessFor ? readinessFor(s.id) : null
          const fallback = statusFor ? statusFor(s.id) : null
          const overall  = readiness?.overall || mapLegacyStatus(fallback)
          const overallColour = READINESS_COLOUR[overall] || 'rgba(255,255,255,0.25)'

          return (
            <a
              key={s.id}
              href={`/site/${s.id}/${subTab}`}
              onClick={(e) => { e.preventDefault(); navigate(`/site/${s.id}/${subTab}`) }}
              className={`sidebar-item sidebar-item--brief24 ${activeSiteId === s.id ? 'active' : ''}`}
            >
              {/* Single row: icon + name + inline mini-pills on the
                  right. Pulled inline (was stacked below) so all 13
                  sites fit without scroll at typical viewport heights. */}
              {s.id === 'edwalton-office' ? (
                <span aria-hidden style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20,
                  borderRadius: 999,
                  background: overallColour,
                  color: 'var(--color-theme-base)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: 0.3,
                  flex: '0 0 20px',
                }}>iv</span>
              ) : (
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 20, height: 20,
                    flex: '0 0 20px',
                    backgroundColor: overallColour,
                    WebkitMaskImage: `url(/sites/${s.id}/icon.svg)`,
                    maskImage:       `url(/sites/${s.id}/icon.svg)`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center', maskPosition: 'center',
                    WebkitMaskSize: 'contain', maskSize: 'contain',
                  }}
                />
              )}
              <span style={{
                fontFamily: 'var(--font-site)',
                flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{s.display_name}</span>

              {readiness && (
                <span className="sidebar-pills-inline" role="group" aria-label="GRESB readiness sub-indicators">
                  {['electricity', 'gas', 'water', 'waste'].map((k) => (
                    <span
                      key={k}
                      title={`${SUB_LABEL[k]} · ${readiness[k]}`}
                      className="sidebar-pill sidebar-pill--inline"
                      style={{ background: READINESS_COLOUR[readiness[k]] || READINESS_COLOUR['n/a'] }}
                    />
                  ))}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Footer key - explains the readiness encoding */}
      <div className="sidebar-key">
        <div className="sidebar-key-title">GRESB readiness</div>
        <div className="sidebar-key-line">Landlord coverage across electricity, gas, water, waste.</div>
        <div className="sidebar-key-swatches">
          <span className="sidebar-key-swatch"><i style={{ background: READINESS_COLOUR.green }} />Full</span>
          <span className="sidebar-key-swatch"><i style={{ background: READINESS_COLOUR.amber }} />Partial</span>
          <span className="sidebar-key-swatch"><i style={{ background: READINESS_COLOUR.red }} />Missing</span>
        </div>
      </div>
    </aside>
  )
}

function mapLegacyStatus(s) {
  if (!s) return null
  if (s === 'confirmed')      return 'green'
  if (s === 'partial')        return 'amber'
  if (s === 'not_applicable') return 'n/a'
  return 'red'
}
