/**
 * LogoLockup — Trust × NZA brand lockup.
 *
 * Demo template version. The source production tool rendered a client
 * SVG to the left of a × and the NZA logo to the right. For the demo
 * we drop the client SVG and replace it with a typographic wordmark
 * for the fictional Trust ("Westbrook Academies Trust"). Same colour
 * + tinting discipline as before:
 *
 *   Dark register  → both wordmark and NZA logo render cream/white
 *   Cream register → both render navy (var(--color-theme-base))
 *
 * NZA logo stays as an SVG-via-mask-tint (the SVG ships with a
 * hardcoded #58595b fill and doesn't use currentColor, so we paint it
 * via CSS mask + background-color). The Trust wordmark is just text in
 * the heading font.
 */
export default function LogoLockup({ theme = 'dark' }) {
  const isCream = theme === 'cream'
  /* Both marks AND the × all share one colour at full opacity, so the
     lockup reads as one composed mark, not two separate brands with a
     faint connector (Chris ask 8 Jun, carried from the source tool). */
  const colour = isCream ? 'var(--color-theme-base)' : '#FFFFFF'

  const nzaBox = { width: 78, height: 24 }

  const maskBase = (url, position = 'center') => ({
    backgroundColor: colour,
    WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: position, maskPosition: position,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    display: 'block',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-label="Co-brand lockup">
      <span
        role="img"
        aria-label="Westbrook Academies Trust"
        style={{
          color: colour,
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '0.02em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          /* Sit on the same vertical baseline as the NZA mark below. */
          display: 'inline-flex',
          alignItems: 'center',
          height: 24,
        }}
      >
        Westbrook Academies Trust
      </span>
      <span style={{ color: colour, fontWeight: 300, fontSize: 20 }}>×</span>
      <span
        role="img"
        aria-label="Net Zero Advisory"
        style={{ ...nzaBox, ...maskBase('/nza-logo-02.svg', 'left center') }}
      />
    </div>
  )
}
