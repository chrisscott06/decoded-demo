/**
 * SiteHeader - shared header for every Site Detail sub-tab except
 * Overview (which has its own bigger hero) and Meters (own SiteBanner).
 *
 * Chris ask 5 Jun r3: "It needs to be the same colour, the same size,
 * and the same location on every page. On the overview page, I like
 * that it's nice and big." Mirrors SiteOverview's hero treatment -
 * 62 px navy site icon + 40 px Source Serif 4 H1 - so the icon sits
 * in exactly the same horizontal position on every page. To achieve
 * the "same location" promise, SiteHeader MUST be rendered INSIDE the
 * sub-tab's `<div className="page">` wrapper (which provides the
 * shared padding + max-width). Earlier it rendered outside the page
 * wrapper and Carbon's icon drifted 32 px left, 47 px up. See Brief
 * 24 r4 in the close report for the full diagnostic.
 *
 * Optional `right` slot: renders inline on the right of the eyebrow
 * row (used by SiteEnergy for the view-pill row so the pills sit
 * alongside the eyebrow rather than below the H1).
 */
export default function SiteHeader({ site, right = null }) {
  if (!site) return null
  const isOffice = site.id === 'edwalton-office'
  return (
    <header className="site-page-header">
      <div className="site-page-header-eyebrow-row">
        <p className="site-page-header-eyebrow">Site · {site.ref || '-'}</p>
        {right && (
          <div className="site-page-header-right">
            {right}
          </div>
        )}
      </div>
      <div className="site-page-header-name-row">
        {isOffice ? (
          <span className="site-icon-fallback site-icon-hero" aria-hidden>iv</span>
        ) : (
          <span
            className="site-icon site-icon-hero"
            aria-hidden
            style={{ '--site-icon-url': `url(/sites/${site.id}/icon.svg)` }}
          />
        )}
        <h1 className="site-page-header-name">{site.display_name}</h1>
      </div>
    </header>
  )
}
