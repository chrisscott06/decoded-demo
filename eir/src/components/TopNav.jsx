/**
 * TopNav - Brief 6 two-bar pattern.
 *
 * Bar 1 (primary): chapter links (Portfolio | Site | GRESB) + logo lockup
 * Bar 2 (secondary): sub-page tabs for the active chapter, when present
 *
 * Theme-aware: cream-register for Site Detail pages, dark for everything else.
 *
 * Site link greyed when currentSiteId is null (Phase 1B behaviour preserved).
 */
import LogoLockup from './LogoLockup.jsx'
import DataVintageBadge from './DataVintageBadge.jsx'

/* Chris ask 8 Jun (pre-Westbrook-handoff):
   - Portfolio top-link stays live (Map + Energy work well).
   - Insights chapter removed entirely (the three sub-tabs were
     scaffolds that never matured).
   - Both Portfolio AND Site sub-navs: Water / Waste / Carbon greyed
     (placeholder pages don't have content yet).
   The disabled gate honours an `item.disabled` flag now, not just the
   former 'site' special case. */
const PRIMARY = [
  { key: 'home',      label: 'Home',      path: '/' },
  { key: 'portfolio', label: 'Portfolio', path: '/portfolio/map' },
  { key: 'site',      label: 'Site',      pathFromSiteId: (id) => id ? `/site/${id}/overview` : null },
  { key: 'gresb',     label: 'GRESB',     path: '/gresb' },
]

const SECONDARY = {
  /* Brief 17 (Chris override): Portfolio sub-nav simplifies to just
     Map + Energy, the thematic-page direction. Overview / Sites /
     Phasing / Comparisons stripped - their routes still resolve and
     redirect to /portfolio/map (see App.jsx).
     Chris ask 8 Jun: Water / Waste / Carbon greyed pre-Westbrook handoff -
     placeholder routes still resolve but the tabs are unclickable so
     the user doesn't see an empty page. */
  portfolio: [
    { key: 'map',    label: 'Map',    path: '/portfolio/map' },
    { key: 'energy', label: 'Energy', path: '/portfolio/energy' },
    { key: 'water',  label: 'Water',  path: '/portfolio/water',  disabled: true },
    { key: 'waste',  label: 'Waste',  path: '/portfolio/waste',  disabled: true },
    { key: 'carbon', label: 'Carbon', path: '/portfolio/carbon', disabled: true },
  ],
  /* Chris ask 5 Jun: combine Meters + Data quality into a single "Meters"
     tab. The combined page surface (SiteMetering.jsx) already covers
     both - meter inventory + data quality status legend + per-platform
     coverage. Legacy URLs /site/<id>/meters and /site/<id>/data-quality
     both still route to /metering (App.jsx router).
     Chris ask 8 Jun (correction): Site sub-tabs all stay live - the
     per-site Energy/Carbon/Water/Waste pages are in good shape. The
     greying-out only applies to the Portfolio chapter's Water /
     Waste / Carbon thematic pages, not the Site-level ones. */
  site: (id) => [
    { key: 'overview',  label: 'Overview', path: `/site/${id}/overview` },
    { key: 'energy',    label: 'Energy',   path: `/site/${id}/energy` },
    { key: 'carbon',    label: 'Carbon',   path: `/site/${id}/carbon` },
    { key: 'water',     label: 'Water',    path: `/site/${id}/water` },
    { key: 'waste',     label: 'Waste',    path: `/site/${id}/waste` },
    { key: 'metering',  label: 'Meters',   path: `/site/${id}/metering` },
  ],
  /* Brief 22 (BR-13 v1.2) Task 6 - Dependencies sub-tab removed (CDs are
     NZA-internal working notes, surfaced only in the P09 tracker, not
     Westbrook-facing). GRESB nav is now three sub-tabs:
     Overview · Aspects · Forward planning. */
  gresb: [
    { key: 'overview', label: 'Overview',         path: '/gresb/overview' },
    { key: 'aspects',  label: 'Aspects',          path: '/gresb/aspects' },
    { key: 'forward',  label: 'Forward planning', path: '/gresb/forward' },
  ],
}

export default function TopNav({
  activePrimary,     // 'portfolio' | 'site' | 'gresb'
  active,            // legacy alias for activePrimary (Phase 1B compat)
  activeSecondary,   // sub-page key
  currentSiteId,     // string | null
  theme = 'dark',    // 'dark' | 'cream'
  navigate,
}) {
  if (!activePrimary && active) activePrimary = active
  const isCream = theme === 'cream'
  const bg = isCream ? 'var(--color-nza-cream)' : 'var(--color-theme-base)'
  const text = isCream ? 'var(--color-theme-base)' : 'var(--color-theme-body)'
  const textMuted = isCream ? 'rgba(31, 51, 40, 0.55)' : 'rgba(243, 239, 227, 0.6)'
  const border = isCream ? 'rgba(31, 51, 40, 0.1)' : 'rgba(243, 239, 227, 0.1)'
  const subBg = isCream ? 'rgba(31, 51, 40, 0.04)' : 'rgba(243, 239, 227, 0.04)'

  let subTabs = []
  if (activePrimary === 'site' && currentSiteId) {
    subTabs = SECONDARY.site(currentSiteId)
  } else if (typeof SECONDARY[activePrimary] === 'object' && Array.isArray(SECONDARY[activePrimary])) {
    subTabs = SECONDARY[activePrimary]
  }

  function clickPrimary(item, e) {
    e?.preventDefault?.()
    if (item.disabled) return
    if (item.key === 'site') {
      if (currentSiteId) navigate(item.pathFromSiteId(currentSiteId))
      return  // disabled when no site
    }
    navigate(item.path)
  }

  function clickSecondary(item, e) {
    e?.preventDefault?.()
    if (item.disabled) return
    navigate(item.path)
  }

  return (
    <>
      {/* Primary bar */}
      <nav
        className="topnav-primary"
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          height: 'var(--topnav-height)',
        }}
      >
        <div className="topnav-primary-inner">
          <div className="topnav-primary-links">
            {PRIMARY.map((item) => {
              const isActive = activePrimary === item.key
              /* Disabled when the item carries an explicit `disabled`
                 flag (Portfolio pre-Westbrook-handoff) OR when it's the Site
                 link with no current site loaded (Phase 1B behaviour). */
              const disabled = !!item.disabled || (item.key === 'site' && !currentSiteId)
              const tooltipText = item.disabled
                ? 'Coming soon'
                : (item.key === 'site' && !currentSiteId
                    ? 'Select a site from Portfolio to enable'
                    : undefined)
              return (
                <a
                  key={item.key}
                  href={item.path || '#'}
                  onClick={(e) => clickPrimary(item, e)}
                  className={`topnav-primary-link ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  style={{
                    color: disabled
                      ? (isCream ? 'rgba(31, 51, 40,0.25)' : 'rgba(243, 239, 227,0.25)')
                      : isActive
                        ? 'var(--color-nza-coral)'
                        : textMuted,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  title={tooltipText}
                  aria-disabled={disabled || undefined}
                >
                  {item.label}
                </a>
              )
            })}
          </div>
          <div className="topnav-primary-right">
            <LogoLockup theme={theme} />
          </div>
        </div>
      </nav>

      {/* Secondary bar. Brief 19.5 (Chris extension 4 Jun): when the
          GRESB chapter is active, the secondary nav adopts the
          tertiary's Pattern A underline-on-active treatment so the
          GRESB workflow and the Portfolio thematic sub-sub-tabs share
          one consistent design grammar. The Portfolio Map/Energy and
          Insights secondary navs keep the existing pill treatment via
          the absence of the --underline modifier. */}
      {subTabs.length > 0 && (() => {
        const underline = activePrimary === 'gresb'
        return (
          <div
            className={`topnav-secondary ${underline ? 'topnav-secondary--underline' : ''}`}
            style={{
              background: subBg,
              borderBottom: `1px solid ${border}`,
              height: 'var(--subnav-height)',
            }}
          >
            <div className="topnav-secondary-inner">
              {subTabs.map((item) => {
                const isActive = activeSecondary === item.key
                const disabled = !!item.disabled
                return (
                  <a
                    key={item.key}
                    href={item.path}
                    onClick={(e) => clickSecondary(item, e)}
                    className={`topnav-secondary-link ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    style={{
                      color: disabled
                        ? (isCream ? 'rgba(31, 51, 40,0.25)' : 'rgba(243, 239, 227,0.25)')
                        : isActive
                          ? 'var(--color-nza-coral)'
                          : textMuted,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                    title={disabled ? 'Coming soon' : undefined}
                    aria-disabled={disabled || undefined}
                  >
                    {item.label}
                  </a>
                )
              })}
              {/* Data-vintage timestamp pushed to the far right of the
                  secondary nav (Chris ask 4 Jun) - quiet metadata,
                  doesn't compete with the primary nav. */}
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                <DataVintageBadge theme={theme} />
              </span>
            </div>
          </div>
        )
      })()}
    </>
  )
}
