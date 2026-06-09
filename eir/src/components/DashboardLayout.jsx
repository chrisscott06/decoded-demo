/**
 * DashboardLayout - fills 100vh, hides page scroll, lets inner panels scroll.
 *
 * Layout:
 *   ┌────────────────────────────────────────┐
 *   │ topNav (56px)                          │
 *   ├────────────────────────────────────────┤
 *   │ subNav (48px, optional)                │
 *   ├──────────┬─────────────────────────────┤
 *   │ sidebar  │ children (flex-1, overflow- │
 *   │ (240px,  │ hidden - inner panels       │
 *   │ optional)│ scroll independently)       │
 *   └──────────┴─────────────────────────────┘
 *
 * Props:
 *   topNav    : ReactNode (always rendered)
 *   subNav    : ReactNode | null
 *   sidebar   : ReactNode | null
 *   children  : main content
 *   theme     : 'dark' | 'cream'  - applies body class for global theming
 */
import { useEffect } from 'react'

export default function DashboardLayout({ topNav, subNav, sidebar, children, theme = 'dark' }) {
  useEffect(() => {
    if (theme === 'cream') document.body.classList.add('theme-cream')
    else document.body.classList.remove('theme-cream')
    return () => document.body.classList.remove('theme-cream')
  }, [theme])

  return (
    <div className="dashboard">
      {topNav}
      {subNav}
      <div className="dashboard-body">
        {sidebar}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  )
}
