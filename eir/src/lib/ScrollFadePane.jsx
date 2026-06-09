/**
 * ScrollFadePane - bounded scrollable container with a bottom
 * mask-image fade and a floating coral chevron hint.
 *
 * Lifted from the PortfolioEnergy NarrativePane pattern (Chris ask
 * 2026-06-03) so the same "more below" affordance can be reused
 * across the GRESB chapter without each call site re-implementing
 * the ResizeObserver + scroll listener bookkeeping.
 *
 * Use:
 *   <ScrollFadePane style={{ maxHeight: 'calc(...)' }}>
 *     ...long content...
 *   </ScrollFadePane>
 *
 * The default fade uses the shared `.scroll-fade-y` class which
 * hides the system scrollbar entirely (scrollbar-width: none +
 * ::-webkit-scrollbar { width: 0 }). Chris ask: "make scrollbars
 * blend into the dark background" - answered by removing them in
 * favour of the fade + chevron affordance.
 */
import { useEffect, useRef, useState } from 'react'

export default function ScrollFadePane({
  children,
  className = '',
  style,
  innerClassName = '',
  innerStyle,
}) {
  const scrollRef = useRef(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function update() {
      const overflow = el.scrollHeight - el.clientHeight
      const distFromBottom = overflow - el.scrollTop
      /* Show only when there's >24 px of scrollable content remaining
         AND the content actually exceeds the container - so panes
         that happen to fit show no chevron. */
      setShowHint(overflow > 0 && distFromBottom > 24)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])

  /* Chris ask 5 Jun r11: "On the Forward planning page the box
     fades the last item even though it fits - looks like it needs
     scrolling when it doesn't. Sort it out across every page that
     uses this." The .scroll-fade-y CSS class always applies the
     96 px bottom mask. We now suppress that mask via inline style
     when there is no overflow OR the user has scrolled to the
     bottom - the same condition that already decides whether to
     show the coral chevron. So the fade and the chevron appear and
     disappear together: both visible only when there is genuinely
     more content below. The scrollbar-hide rules in the class
     still apply (no system scrollbars), but the fade only fires
     when it earns its keep. */
  const maskNone = 'none'
  const maskOn = 'linear-gradient(to bottom, black 0%, black calc(100% - 96px), transparent 100%)'
  return (
    <div
      className={className}
      style={{ position: 'relative', minHeight: 0, ...style }}
    >
      <div
        ref={scrollRef}
        className={`scroll-fade-y ${innerClassName}`.trim()}
        style={{
          overflowY: 'auto', minHeight: 0, ...innerStyle,
          /* Inline mask overrides the CSS class mask. When showHint
             is false (no overflow OR at bottom) we paint 'none' so
             the content is fully opaque. */
          WebkitMaskImage: showHint ? maskOn : maskNone,
          maskImage: showHint ? maskOn : maskNone,
        }}
      >
        {children}
      </div>
      {showHint && (
        <div className="scroll-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </div>
  )
}
