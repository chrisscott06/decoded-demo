/**
 * PortfolioPlaceholder - clean "coming soon" page for Portfolio sub-tabs
 * that haven't been built out yet (Water / Waste / Carbon). Mirrors the
 * thematic-page-outer / thematic-page-container alignment foundation
 * (Rule 11.x) so the placeholder sits cleanly in the same horizontal
 * grid as the real Energy thematic page next door.
 *
 * Visual: centred eyebrow + headline + supporting line + small "coming
 * soon" pill so the Westbrook team can preview the nav and feel where the
 * content will land.
 */

export default function PortfolioPlaceholder({ eyebrow, title, body, eta = 'To be added end of day' }) {
  return (
    <div className="thematic-page-outer" style={{ justifyContent: 'center' }}>
      <div className="thematic-page-container" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 18,
        paddingTop: 120, paddingBottom: 120,
        maxWidth: 640,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11, fontWeight: 600,
          letterSpacing: 1.6, textTransform: 'uppercase',
          color: 'var(--text-muted-on-dark)',
        }}>{eyebrow}</span>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-page-title)',
          fontWeight: 400, lineHeight: 1.1,
          color: 'var(--color-theme-body)',
          margin: 0,
        }}>{title}</h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body)',
          lineHeight: 'var(--text-body-lh)',
          color: 'var(--text-muted-on-dark)',
          margin: '8px 0 0 0',
          maxWidth: 520,
        }}>{body}</p>

        <span style={{
          marginTop: 12,
          padding: '6px 14px',
          borderRadius: 999,
          border: '1px solid color-mix(in srgb, var(--color-nza-coral) 30%, transparent)',
          background: 'color-mix(in srgb, var(--color-nza-coral) 8%, transparent)',
          color: 'var(--color-nza-coral)',
          fontFamily: 'var(--font-heading)',
          fontSize: 11, fontWeight: 500,
          letterSpacing: 0.6, textTransform: 'uppercase',
        }}>{eta}</span>
      </div>
    </div>
  )
}
