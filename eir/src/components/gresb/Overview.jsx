/**
 * Brief 22 (BR-13 v1.2) Task 3 - /gresb/overview redesign (v2).
 *
 * Designer pass after Chris's first-cut review:
 *
 * 1. Layout: narrative was crushed at 240 px. Flipped to Rule 11 thematic-
 *    page proportions: 480 narrative + 48 gap + 1fr cards. Cards now sit at
 *    ~700 px wide, narrative gets comfortable reading column.
 *
 * 2. ScoreBand redesigned as a QUINTILE band:
 *    - GRESB star thresholds aren't linearly spaced (1→2 is 25 pts, 4→5 is
 *      only 10 pts). A linear 0–100 bar misrepresented the difficulty curve.
 *    - New bar: 6 segments of equal visual width - <1★, 1★, 2★, 3★, 4★, 5★.
 *      The star journey reads honestly: each step looks the same size.
 *    - Each segment is a SOLID colour (no translucency fighting the dark bg):
 *      coral → amber → olive → teal-green → deep teal. Star band = star colour.
 *    - Star glyphs sit INSIDE each segment as labels so you can read the
 *      bar without a separate legend.
 *
 * 3. Markers:
 *    - IVG / Target / 2025-ref get explicit vertical bars with labels above
 *      the bar (was below, where they collided with threshold numbers).
 *    - Peer + Global moved off the bar (they were 3 pts apart and collided).
 *      Surfaced as a small context strip below the bar so the data is still
 *      there without the visual collision.
 *
 * 4. Cards: 32 px internal padding (was 20–24), 28 px between sections so
 *    the bar can breathe. Cards now read more like a designed report than
 *    a dashboard tile.
 */

import { StarRating } from './atomic.jsx'
import PageContainer from '../layout/PageContainer.jsx'
import { NarrativeSection as MarkdownSection } from '../../lib/inlineMarkdown.jsx'
import ScrollFadePane from '../../lib/ScrollFadePane.jsx'

const CORAL = 'var(--color-nza-coral)'
const TEXT_BODY = 'var(--color-theme-body)'
const TEXT_MUTED = 'var(--text-muted-on-dark)'
/* Brief 23 (v1.3): target = achievable = 62 - no buffer. The 56px target
   number rotates from coral to confident green to communicate
   "achievable, committed." Token: --theme-carbon = #7CC470 (post-4 Jun
   palette rotation where Carbon took the green slot). */
const GREEN_CONFIDENT = 'var(--theme-carbon)'

/* Star band → solid colour. Coral (struggling) → deep teal (leader).
   Picked so each tier is visually distinct on the dark register
   (#0F1729) without translucency. */
const STAR_COLORS = {
  0: '#5A3530',  // <1★ - dark coral-brown
  1: '#C44A2C',  // 1★  - coral (where IVG sits in 2025)
  2: '#D8A347',  // 2★  - amber (target zone)
  3: '#A8B765',  // 3★  - olive
  4: '#4E9C8A',  // 4★  - teal-green
  5: '#2F7866',  // 5★  - deep teal
}

/* Read JSON.starBands with safe defaults. */
function getThresholds(starBands) {
  const out = [30, 55, 67, 80, 90]
  ;(starBands || []).forEach((b, i) => { if (i < 5) out[i] = b.thresholdIndicative2025 ?? out[i] })
  return out
}

/* Map a 0–100 score to a fractional position on the QUINTILE bar.
   The bar has 6 equal-width zones: <1★, 1★, 2★, 3★, 4★, 5★. A score
   within its zone maps proportionally inside that zone's slot. */
function scoreToBarPct(score, thresholds) {
  if (score == null) return null
  const [t1, t2, t3, t4, t5] = thresholds
  const ZONE_W = 100 / 6  // 16.667%
  const zoneAt = (z, from, to) => (z * ZONE_W) + (((score - from) / (to - from)) * ZONE_W)
  if (score <= t1)  return zoneAt(0, 0,  t1)
  if (score <= t2)  return zoneAt(1, t1, t2)
  if (score <= t3)  return zoneAt(2, t2, t3)
  if (score <= t4)  return zoneAt(3, t3, t4)
  if (score <= t5)  return zoneAt(4, t4, t5)
  return zoneAt(5, t5, 100)
}

export function GresbOverview({ gresb }) {
  const h = gresb.headline || {}
  const meta = gresb.meta || {}
  const score2025 = h.score2025
  const star2025 = h.star2025
  const defendable = h.defendable2026 ?? h.floor2026
  const achievable = h.achievable2026 ?? h.ceiling2026
  const target = h.target2026
  const targetStar = h.targetStar
  const stretch = h.stretch2026          /* Brief 23 (v1.3) - Tier-C calendar-locked items */
  const band = (achievable != null && defendable != null) ? achievable - defendable : null
  const targetEqualsAchievable = target != null && achievable != null && target === achievable
  const thresholds = getThresholds(gresb.starBands)

  return (
    <PageContainer style={{
      display: 'grid',
      /* Narrative trimmed to give the 64 px gap room to breathe (Chris ask). */
      gridTemplateColumns: 'minmax(360px, 440px) minmax(0, 1fr)',
      gap: 64,
      alignItems: 'start',
      paddingBottom: 48,
    }}>

      {/* ===== LEFT - NARRATIVE =====
          Brief 25.1 (v1.4.1): reads from data.overviewPageNarrative.sections[]
          which now supports paragraphs + bullets + paragraphsAfterBullets
          with **bold** / *italic* markdown inline.

          Chris ask 5 Jun r6: "For the scrollable text, do it the way
          we did on every other page, where it kind of fades out
          towards the bottom and has a little pink arrow to guide the
          user to read more down there." Wrap in ScrollFadePane which
          - hides the system scrollbar (answers "scrollbars are dark
            grey, make them blend"),
          - applies a 96 px bottom mask-image fade,
          - shows a bouncing coral chevron when content extends below
            the visible area, hiding when scrolled to the bottom. */}
      <ScrollFadePane
        style={{ minWidth: 0 }}
        innerStyle={{
          /* Chris ask 5 Jun r10: the prior `- 32px` over-subtracted
             from the top but ignored the GRESB header strip (28 + 80
             logo + 14 + 22 entity ≈ 144) sitting above the pane PLUS
             the outer flex gap (24) and the footer caption strip
             (~36). Net: pane extended ~141 px below the viewport at
             855 px tall, so "What this tool does" rendered off-screen
             and couldn't be reached by scrolling. Subtracting 200 px
             reserves room for header + gap + footer + a small
             bottom breather, so the pane bottom sits inside the
             viewport. */
          maxHeight: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 200px)',
          paddingRight: 8,
        }}
      >
        <NarrativePane>
          {(gresb.overviewPageNarrative?.sections || []).map((s, i) => (
            <MarkdownSection key={i} section={s} />
          ))}
        </NarrativePane>
      </ScrollFadePane>

      {/* ===== RIGHT - INFOGRAPHIC CARDS =====
          Chris ask 5 Jun r13: top of the right-side infographic
          always aligns with the GRESB logo top (y=108). Same -140
          lift used on Aspects + Forward so the eye picks up a
          single horizontal alignment line across the chapter.

          Chris ask 5 Jun r14: "On fullscreen the cards sit at the
          top and leave a big empty space at the bottom. Stuff
          should move down naturally to fit, like a report."
          Solution: give the wrapper an explicit viewport-bounded
          height and `justify-content: safe center` so the cards
          centre vertically when there's room AND fall back to
          top-anchored when content would overflow the container
          ("safe" keyword keeps the behaviour graceful at small
          viewports - no centring past the top edge). At 855 vh
          the cards sit ~37 px below the logo (effectively
          top-anchored); at 1080 vh they centre with ~150 px of
          breathing room above and below. */}
      <div style={{
        display: 'flex', flexDirection: 'column', minWidth: 0,
        marginTop: -140,
        height: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 32px)',
        justifyContent: 'safe center',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0,
        }}>
        <Card2025Result
          score={score2025}
          star={star2025}
          thresholds={thresholds}
        />
        <Card2026Forecast
          defendable={defendable}
          achievable={achievable}
          target={target}
          targetStar={targetStar}
          stretch={stretch}
          targetEqualsAchievable={targetEqualsAchievable}
          ref2025={score2025}
          thresholds={thresholds}
          submissionDeadline={meta.submissionDeadline}
          forecastCard={gresb.forecast2026Card}
        />
        </div>
      </div>

    </PageContainer>
  )
}

/* ------------------------------------------------------------------ */
/*  Narrative primitives                                                */
/* ------------------------------------------------------------------ */

function NarrativePane({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>
      {children}
    </div>
  )
}

function NarrativeSection({ title, children }) {
  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-subsection-title)',
        fontWeight: 400,
        color: CORAL,
        margin: '0 0 14px 0',
        paddingBottom: 5,
        borderBottom: `1px solid ${CORAL}`,
        lineHeight: 'var(--text-subsection-title-lh)',
        letterSpacing: '-0.005em',
      }}>{title}</h3>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: TEXT_MUTED,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Cards                                                               */
/* ------------------------------------------------------------------ */

function CardShell({ children, accent = false }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: accent ? `1px solid ${CORAL}` : '1px solid var(--rule-on-dark)',
      borderRadius: 12,
      padding: '28px 32px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>{children}</div>
  )
}

function CardHeader({ eyebrow, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 600,
        letterSpacing: 0.8, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>{eyebrow}</span>
      {right && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, color: TEXT_MUTED,
        }}>{right}</span>
      )}
    </div>
  )
}

function Card2025Result({ score, star, thresholds }) {
  return (
    <CardShell>
      <CardHeader eyebrow="2025 result" right="22nd of 22 · peer group" />
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 56, fontWeight: 400, lineHeight: 1,
          color: STAR_COLORS[star] || TEXT_BODY,
        }}>{score}</span>
        <span style={{ fontSize: 14, color: TEXT_MUTED }}>/ 100</span>
        <StarRating count={star} size={20} />
        <span style={{ fontSize: 13, color: TEXT_MUTED, marginLeft: 4 }}>
          {star}-star
        </span>
      </div>
      <QuintileBand
        thresholds={thresholds}
        markers={[
          { score, label: `IVG ${score}`, kind: 'primary' },
        ]}
      />
      <ContextStrip
        items={[
          { label: 'Peer group avg', value: '82' },
          { label: 'Global avg',     value: '79' },
        ]}
      />
    </CardShell>
  )
}

function Card2026Forecast({ defendable, achievable, target, targetStar, stretch, targetEqualsAchievable, ref2025, thresholds, submissionDeadline, forecastCard }) {
  /* Brief 13 v1.4.2 Task 4 + Chris's annotated screenshot (5 Jun r5):
     "Rather than having defendable / target / stretch at the bottom
     of the graph, why not just show those? Get rid of those three
     things and then just show an arrow showing the range of
     defendable and stretch, with those annotations next to it
     rather than pieces of data off the graph."

     The bar keeps:
       - Star zones background
       - Coral operational range tint (Defendable → Achievable), no edges
       - ONE bold white TARGET tick + label

     The 3-column DEFENDABLE / TARGET / STRETCH legend below the bar
     is GONE. In its place:
       - A horizontal range arrow under the threshold row, with
         "DEFENDABLE 45" at the left tip and "STRETCH 65" at the
         right tip. This conveys "this is the range we operate in"
         in a single glance - no repeating numbers off the chart.
       - A single italic caption beneath the arrow with a clickable
         "Aspects page" link, sourced from data.forecast2026Card.

     Reads from `data.forecast2026Card` (Brief 13 v1.4.2 - the old
     forecast2026Legend object is no longer in the JSON). The caption
     text is split on the literal phrase "Aspects page" so the link
     can be injected without parsing markdown. */
  const captionText = forecastCard?.caption
    || 'from 45 carry-forward - the 17-point climb is mapped on the Aspects page.'
  const captionParts = captionText.split('Aspects page')
  return (
    <CardShell accent>
      <CardHeader
        eyebrow="2026 forecast"
        right={submissionDeadline ? `submission ${submissionDeadline}` : null}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 56, fontWeight: 400, lineHeight: 1,
          color: GREEN_CONFIDENT,
        }}>{target}</span>
        <span style={{ fontSize: 14, color: TEXT_MUTED }}>target</span>
        <StarRating count={targetStar} size={20} />
        <span style={{ fontSize: 13, color: TEXT_MUTED, marginLeft: 4 }}>
          {targetStar}-star
        </span>
      </div>
      <QuintileBand
        thresholds={thresholds}
        span={{ from: defendable, to: achievable, tint: 'coral-no-border' }}
        markers={[{ score: target, label: `TARGET ${target}`, kind: 'primary' }]}
        rangeArrow={(defendable != null && stretch != null) ? {
          from: defendable,
          to: stretch,
          fromLabel: 'DEFENDABLE',
          toLabel: 'STRETCH',
        } : null}
      />
      <p style={{
        margin: 0,
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontStyle: 'italic',
        lineHeight: 1.5,
        color: '#6a7a8e',
      }}>
        {captionParts[0]}
        {captionParts.length > 1 && (
          <>
            <a
              href="/gresb/aspects"
              onClick={(e) => {
                e.preventDefault()
                window.history.pushState({}, '', '/gresb/aspects')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              style={{
                color: 'var(--color-nza-coral)',
                fontStyle: 'italic',
                textDecoration: 'none',
                borderBottom: '1px solid currentColor',
              }}
            >Aspects page</a>
            {captionParts.slice(1).join('Aspects page')}
          </>
        )}
      </p>
    </CardShell>
  )
}

/* Brief 25.1 (v1.4.1) Task 5 - 3-column legend strip replacing the
   overlapping inline labels under the forecast bar. Renders one
   column per items[] entry: uppercase label, big white value, muted
   caption. Top border separates from the bar above. */
function ForecastLegendStrip({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      gap: 16,
      paddingTop: 14,
      borderTop: '1px solid var(--rule-on-dark)',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: 1.2, textTransform: 'uppercase',
            color: '#6a7a8e',
          }}>{it.label}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24, fontWeight: 600,
            color: '#ffffff', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{it.value}</span>
          {it.caption && (
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              lineHeight: 1.4,
              color: '#6a7a8e',
            }}>{it.caption}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Quintile band - 6 equal-width zones, star glyphs inside              */
/* ------------------------------------------------------------------ */

function QuintileBand({ thresholds, markers = [], span = null, annotations = null, stretch = null, rangeArrow = null }) {
  const BAR_H = 36
  const ZONES = [
    { tier: 0, label: '',     from: 0,             to: thresholds[0] },
    { tier: 1, label: '★',    from: thresholds[0], to: thresholds[1] },
    { tier: 2, label: '★★',   from: thresholds[1], to: thresholds[2] },
    { tier: 3, label: '★★★',  from: thresholds[2], to: thresholds[3] },
    { tier: 4, label: '★★★★', from: thresholds[3], to: thresholds[4] },
    { tier: 5, label: '★★★★★',from: thresholds[4], to: 100 },
  ]

  const spanPct = span && {
    from: scoreToBarPct(span.from, thresholds),
    to:   scoreToBarPct(span.to,   thresholds),
  }

  return (
    <div>
      {/* Marker labels ABOVE the bar (so threshold numbers below don't collide).
          Primary marker (TARGET on the forecast bar) is the visual
          anchor - coral, slightly larger, bolder - per Chris's "the
          target has got to be the thing that stands out". */}
      <div style={{ position: 'relative', height: 22 }}>
        {markers.map((m, i) => {
          const pct = scoreToBarPct(m.score, thresholds)
          if (pct == null) return null
          const isPrimary = m.kind === 'primary'
          return (
            <span key={i} style={{
              position: 'absolute',
              left: `${pct}%`,
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-heading)',
              fontSize: isPrimary ? 13 : 11,
              fontWeight: isPrimary ? 700 : 400,
              letterSpacing: isPrimary ? 1 : 0,
              color: isPrimary ? '#ffffff' : TEXT_MUTED,
              whiteSpace: 'nowrap',
              bottom: 4,
            }}>{m.label}</span>
          )
        })}
      </div>

      {/* The bar */}
      <div style={{
        position: 'relative',
        height: BAR_H,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
      }}>
        {ZONES.map((z, i) => (
          <div key={i} style={{
            flex: 1,
            background: STAR_COLORS[z.tier],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 13,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            letterSpacing: 0.5,
            opacity: 0.92,
          }}>{z.label}</div>
        ))}

        {/* Defendable→Achievable span overlay (Card B only). Chris ask
            5 Jun r4: drop the coral edges - they read as "two red
            lines" of equal weight to the target and steal focus. The
            `coral-no-border` tint keeps the soft coral fill that
            signals the operational range without competing for
            attention. */}
        {spanPct && (() => {
          const tint = span?.tint || 'white'
          const noBorder = tint === 'coral-no-border'
          const useCoral = tint === 'coral' || tint === 'coral-no-border'
          const bg     = useCoral ? 'rgba(232, 114, 92, 0.18)' : 'rgba(255,255,255,0.18)'
          const border = useCoral ? 'rgba(232, 114, 92, 0.55)' : 'rgba(255,255,255,0.4)'
          return (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${spanPct.from}%`, width: `${spanPct.to - spanPct.from}%`,
              background: bg,
              borderLeft: noBorder ? 'none' : `1px solid ${border}`,
              borderRight: noBorder ? 'none' : `1px solid ${border}`,
              pointerEvents: 'none',
            }} />
          )
        })()}

        {/* Brief 23 (v1.3) - stretch tick. Sits beyond the achievable
            ceiling as a separate dashed marker. Encoded as a thin
            dashed vertical strip on the bar with no label inline (the
            labelled annotation appears below the bar, in its own
            stretch row). */}
        {stretch != null && (() => {
          const pct = scoreToBarPct(stretch, thresholds)
          if (pct == null) return null
          return (
            <div aria-hidden style={{
              position: 'absolute', top: -3, bottom: -3,
              left: `${pct}%`,
              width: 0,
              borderLeft: '2px dashed rgba(255,255,255,0.55)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }} />
          )
        })()}

        {/* Marker tick lines. Primary (TARGET) tick is bumped to 4 px
            and extends 5 px above + below the bar so it visually
            anchors as THE focus of the chart - per Chris's "the
            target has got to be the thing that stands out". */}
        {markers.map((m, i) => {
          const pct = scoreToBarPct(m.score, thresholds)
          if (pct == null) return null
          const isPrimary = m.kind === 'primary'
          return (
            <div key={i} style={{
              position: 'absolute',
              top: isPrimary ? -5 : -3, bottom: isPrimary ? -5 : -3,
              left: `${pct}%`,
              width: isPrimary ? 4 : 2,
              background: isPrimary ? '#ffffff' : 'rgba(255,255,255,0.7)',
              transform: 'translateX(-50%)',
              boxShadow: isPrimary ? '0 0 0 1px rgba(0,0,0,0.55), 0 0 12px rgba(255,255,255,0.35)' : 'none',
              pointerEvents: 'none',
            }} />
          )
        })}
      </div>

      {/* Thresholds row - show the numeric cut-offs BELOW each zone boundary */}
      <div style={{
        position: 'relative',
        height: 16,
        marginTop: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        color: TEXT_MUTED,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {[0, thresholds[0], thresholds[1], thresholds[2], thresholds[3], thresholds[4], 100].map((v, i) => (
          <span key={i} style={{
            position: 'absolute',
            left: `${(i * 100) / 6}%`,
            transform: i === 0 ? 'translateX(0)' : i === 6 ? 'translateX(-100%)' : 'translateX(-50%)',
            top: 0,
          }}>{v}</span>
        ))}
      </div>

      {/* Brief 13 v1.4.2 Task 4 + Chris ask 5 Jun r5: range arrow
          replacing the prior 3-column DEFENDABLE/TARGET/STRETCH
          legend. A thin horizontal line between Defendable and Stretch
          positions, with arrowheads at each end and an "ENDPOINT_LABEL
          value" pair sitting BELOW each tip. Lives in the bar's
          coordinate system so the arrow lines up with the bar above. */}
      {rangeArrow && (() => {
        const fromPct = scoreToBarPct(rangeArrow.from, thresholds)
        const toPct   = scoreToBarPct(rangeArrow.to,   thresholds)
        if (fromPct == null || toPct == null) return null
        return (
          <div style={{ position: 'relative', marginTop: 12, paddingBottom: 30 }}>
            {/* The arrow line - sits at the top of this strip. */}
            <div style={{
              position: 'absolute', top: 6, height: 1,
              left: `${fromPct}%`, width: `${toPct - fromPct}%`,
              background: 'rgba(255,255,255,0.45)',
            }} />
            {/* Left arrowhead (◀) */}
            <div style={{
              position: 'absolute', top: 1, left: `${fromPct}%`,
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '7px solid rgba(255,255,255,0.6)',
            }} />
            {/* Right arrowhead (▶) */}
            <div style={{
              position: 'absolute', top: 1, left: `${toPct}%`,
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '7px solid rgba(255,255,255,0.6)',
            }} />
            {/* Left endpoint label: "DEFENDABLE 45" stacked. */}
            <div style={{
              position: 'absolute', top: 14,
              left: `${fromPct}%`, transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10, fontWeight: 700,
                letterSpacing: 1.1, textTransform: 'uppercase',
                color: '#9aa8b9',
              }}>{rangeArrow.fromLabel}</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15, fontWeight: 500,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{rangeArrow.from}</span>
            </div>
            {/* Right endpoint label: "STRETCH 65" stacked. */}
            <div style={{
              position: 'absolute', top: 14,
              left: `${toPct}%`, transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10, fontWeight: 700,
                letterSpacing: 1.1, textTransform: 'uppercase',
                color: '#9aa8b9',
              }}>{rangeArrow.toLabel}</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15, fontWeight: 500,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{rangeArrow.to}</span>
            </div>
          </div>
        )
      })()}

      {/* Inline annotations - dotted leader from the bar boundary down
          to a label block (eyebrow + value + hint). Chris ask: structure
          like an editorial graphic, not a dashboard footer strip.

          Brief 23 (v1.3): if `stretch` is set AND distinct from any
          existing annotation score, an auto Stretch annotation is
          appended with a DASHED leader (matches the dashed tick on
          the bar above) so the visual semantic "this is the conditional
          ceiling" stays consistent between the bar mark and the label. */}
      {(() => {
        const out = annotations ? [...annotations] : []
        const existingScores = new Set(out.map((a) => a.score))
        if (stretch != null && !existingScores.has(stretch)) {
          out.push({
            score: stretch,
            eyebrow: 'Stretch',
            value: stretch,
            hint: 'if Tier-C lands',
            leader: 'dashed',
          })
        }
        if (out.length === 0) return null
        return (
          <div style={{ position: 'relative', height: 64, marginTop: 6 }}>
            {out.map((a, i) => {
              const pct = scoreToBarPct(a.score, thresholds)
              if (pct == null) return null
              const leaderStyle = a.leader === 'dashed'
                ? '1px dashed rgba(255,255,255,0.55)'
                : '1px dotted rgba(255,255,255,0.5)'
              const valueColor = a.leader === 'dashed' ? TEXT_MUTED : TEXT_BODY
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  top: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4,
                }}>
                  <div style={{
                    width: 1, height: 18,
                    borderLeft: leaderStyle,
                  }} />
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: 0.6, textTransform: 'uppercase',
                    color: TEXT_MUTED,
                    whiteSpace: 'nowrap',
                  }}>{a.eyebrow}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18, fontWeight: 400, lineHeight: 1,
                    color: valueColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{a.value}</div>
                  {a.hint && (
                    <div style={{
                      fontSize: 10,
                      color: TEXT_MUTED,
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                    }}>{a.hint}</div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

/* Small context strip at the bottom of each card. Surfaces reference
   numbers (Peer 82 / Global 79 / Defendable / Achievable) without
   cluttering the bar. */
function ContextStrip({ items }) {
  return (
    <div style={{
      display: 'flex', gap: 24, flexWrap: 'wrap',
      paddingTop: 4,
      borderTop: '1px solid var(--rule-on-dark)',
      fontFamily: 'var(--font-body)',
      fontSize: 12,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            color: TEXT_MUTED,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            fontSize: 10,
            fontWeight: 500,
          }}>{it.label}</span>
          <span style={{
            color: TEXT_BODY,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}>{it.value}</span>
        </div>
      ))}
    </div>
  )
}
