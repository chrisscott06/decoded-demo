/**
 * BodyPageLayout - cream editorial register wrapper for Site Detail pages.
 *
 * Brief 6 Part 3 / design note D6.
 *
 * Background: cream. Text: navy. Coral accents. Stolzl Medium headings.
 * Editorial 5-token type scale applies for in-page typography.
 *
 * Props:
 *   activePrimary    - chapter key ('site' for these pages)
 *   activeSecondary  - sub-tab key (overview/energy/carbon/meters/data-quality)
 *   currentSiteId    - site id for the active page
 *   navigate         - (path) => void
 *   sidebar          - optional ReactNode (sidebar to render on the left)
 *   children         - main content
 */
import { useEffect } from 'react'
import TopNav from './TopNav.jsx'

export default function BodyPageLayout({
  activePrimary,
  activeSecondary,
  currentSiteId,
  navigate,
  sidebar = null,
  children,
}) {
  useEffect(() => {
    document.body.classList.add('theme-cream')
    return () => document.body.classList.remove('theme-cream')
  }, [])

  return (
    <div className="dashboard theme-cream-page">
      <TopNav
        activePrimary={activePrimary}
        activeSecondary={activeSecondary}
        currentSiteId={currentSiteId}
        theme="cream"
        navigate={navigate}
      />
      <div className="dashboard-body">
        {sidebar}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  )
}
