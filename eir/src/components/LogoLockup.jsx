/**
 * LogoLockup - IVG × NZA brand lockup using real SVGs from /public.
 *
 * Chris ask 4 Jun: both logos render the SAME colour on each register.
 *   Dark register  → both pure white
 *   Cream register → both navy (var(--color-theme-base))
 *
 * Why we can't just set `color` on an <img>: the IVG SVG ships with a
 * hardcoded `fill="white"` and the NZA SVG ships with a hardcoded
 * `fill: #58595b` (dark grey). Neither uses currentColor, so the
 * parent's CSS color has no effect. We tint both via CSS mask-image +
 * background-color so the silhouette comes from the SVG and the colour
 * comes from us. Same trick used for the Sankey cluster icons.
 */
export default function LogoLockup({ theme = 'dark' }) {
  const isCream = theme === 'cream'
  /* Chris ask 8 Jun - both logos AND the × all share one colour
     (full opacity, no muting). Previously the × sat at 25% opacity
     against the full-strength logos which read as "two separate
     brands with a faint connector"; full-opacity × makes the
     lockup read as one composed mark. */
  const colour = isCream ? 'var(--color-theme-base)' : '#FFFFFF'

  /* Chris ask 8 Jun (v3): the previous v2 marginLeft hack was
     chasing the wrong cause. The real problem: the IVG SVG viewBox
     is 151×95 (aspect 1.589), but the box was sized at 132×38
     (aspect 3.47). With `maskSize: contain` the IVG content gets
     letterboxed to ~60 px wide × 38 tall - leaving ~36 px of
     transparent dead space on each side of the box. That dead
     space WAS the apparent "gap to ×".
     Fix: size the box to match the SVG's natural aspect (60×38)
     so the IVG content fills it edge-to-edge. The CSS gap of 8 px
     then sits between the actual visible IVG edge and the ×.
     The marginLeft compensation is no longer needed.
     Net visible size: same as v2 (60×38) - only the dead box
     padding goes away.
     NZA viewBox is 978×298 (aspect 3.28); the 78×24 NZA box
     (aspect 3.25) is already a near-perfect fit, no change. */
  const ivgBox = { width: 60, height: 38 }
  const nzaBox = { width: 78, height: 24 }
  /* Chris ask 8 Jun (v4): the v3 aspect-ratio fix removed the
     letterbox padding around the BOX, but each SVG still has its
     own internal padding inside the viewBox (transparent margin
     around the glyph shapes). To butt the × visually flush against
     the actual visible glyph edges, push each logo's content
     toward the × via mask-position: the IVG mask right-aligns
     within its box (so the IVG's last visible pixel hugs the
     right edge of the box, adjacent to the ×), and the NZA mask
     left-aligns within its box (so the first NZA pixel hugs the
     left edge, adjacent to the ×). */
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
        aria-label="Inspired Villages Group"
        style={{ ...ivgBox, ...maskBase('/ivg-logo.svg', 'right center') }}
      />
      <span style={{ color: colour, fontWeight: 300, fontSize: 20 }}>×</span>
      <span
        role="img"
        aria-label="Net Zero Advisory"
        style={{ ...nzaBox, ...maskBase('/nza-logo-02.svg', 'left center') }}
      />
    </div>
  )
}
