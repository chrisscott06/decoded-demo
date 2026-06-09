/**
 * Brief 20 (BR-13) Task 3 - GRESB thematic-page layout primitives.
 *
 * Inherits Rule 11 grammar from PortfolioEnergy verbatim - narrative
 * 400 px / gutter 48 / graphic 1fr, inside a centred 1280 container.
 * NarrativePara renders the DM Serif Display title + coral underline
 * + body text in --text-body-small per Brief 17.5.2 Part 4.
 *
 * Sections stack vertically with 64 px gaps so each narrative/graphic
 * pair reads as its own beat while the alignment grid stays unified.
 *
 * (Future refactor candidate: hoist these primitives + PortfolioEnergy's
 * equivalents into a single shared component. For now, lightly
 * duplicated to keep the GRESB delivery surgical.)
 */

/* ---------- ThematicContainer ---------- */
/* Rule 11.x - body wrapper. The .thematic-page-container class in
   index.css handles every horizontal-alignment property (max-width,
   margin, padding-left, padding-right, box-sizing). This component
   only layers on the GRESB-specific vertical rhythm: 64px gap between
   sections (each section is its own narrative/graphic beat), 48px
   bottom breathing. Never override the horizontal props. */
export function ThematicContainer({ children }) {
  return (
    <div className="thematic-page-container" style={{
      display: 'flex', flexDirection: 'column',
      gap: 64,
      paddingBottom: 48,
    }}>{children}</div>
  )
}

/* ---------- ThematicSection ---------- */
/* One narrative-left / graphic-right beat. 400 px narrative / 48 px
   gutter / 1fr graphic. At 1920×1080 the graphic gets 832 px; at
   1440×900 it gets 592 px. */
export function ThematicSection({ narrative, graphic }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
      gap: 48,
      alignItems: 'start',
    }}>
      <NarrativeColumn>{narrative}</NarrativeColumn>
      <GraphicColumn>{graphic}</GraphicColumn>
    </div>
  )
}

/* ---------- NarrativeColumn ---------- */
/* Stack subsections with 48 px gap (Brief 17.5.2 Part 4). */
export function NarrativeColumn({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 48,
      minWidth: 0,
    }}>{children}</div>
  )
}

/* ---------- GraphicColumn ---------- */
/* Internal gap 32 (Brief 17.5.2 Part 3). */
export function GraphicColumn({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 32,
      minWidth: 0,
    }}>{children}</div>
  )
}

/* ---------- NarrativePara ---------- */
/* DM Serif Display title in coral + 1px coral underline + body in
   --text-body-small Inter, identical to PortfolioEnergy. */
export function NarrativePara({ title, children, continuation = false }) {
  return (
    <div style={{ marginTop: continuation ? -36 : 0 }}>
      {title && (
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-subsection-title)',
          fontWeight: 400,
          color: 'var(--color-nza-coral)',
          margin: '0 0 16px 0',
          paddingBottom: 5,
          borderBottom: '1px solid var(--color-nza-coral)',
          lineHeight: 'var(--text-subsection-title-lh)',
          letterSpacing: '-0.005em',
        }}>{title}</h3>
      )}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: 'var(--color-theme-body)',
        margin: 0,
      }}>{children}</p>
    </div>
  )
}

/* ---------- Token ---------- */
/* Subtle coral-tinted span for narrative emphasis - used the same way
   PortfolioEnergy uses its <Token> helper. */
export function Token({ children }) {
  return (
    <span style={{
      color: 'var(--color-nza-coral)',
      fontWeight: 500,
    }}>{children}</span>
  )
}
