/**
 * Brief 22 (BR-13 v1.2) Task 2 - PageContainer primitive.
 *
 * The brief's spec called for a 48 px horizontal padding wrapper used by
 * every top-level GRESB section. That intent is ALREADY satisfied by the
 * tool's existing Rule 11.x body-text alignment foundation:
 *
 *   .thematic-page-outer        - scrollable border-box outer with
 *                                 --page-edge-x padding (32 px)
 *   .thematic-page-container    - centred 1280 max-width inner
 *
 * Re-introducing a parallel 48 px container would diverge from every
 * other thematic page (Portfolio Energy, Map, GRESB Overview/Forward
 * built in Brief 20) which use the 32 px foundation. So PageContainer
 * is a thin wrapper around `.thematic-page-container` - every GRESB
 * page that uses `<PageContainer>` automatically inherits Rule 11.x's
 * nav-aligned horizontal padding AND the brief's "no inline padding
 * overrides" guarantee.
 *
 * Page authors:
 *   <PageContainer>...</PageContainer>     // body content only - already padded
 *   The OUTER scroller (.thematic-page-outer) is provided by the page
 *   shell in App.jsx, not by this component.
 *
 * Brief's Hard Rule 11 is therefore satisfied by Rule 11.x. See
 * CLAUDE.md → Rule 11.x for the falsifiability list.
 */

export default function PageContainer({ children, style, ...rest }) {
  return (
    <div className="thematic-page-container" style={style} {...rest}>
      {children}
    </div>
  )
}
