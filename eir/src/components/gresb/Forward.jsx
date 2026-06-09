/**
 * Brief 23 (BR-13 v1.3) Task 4 - /gresb/forward FULL REDESIGN.
 *
 * The list-of-cards layout from v1.2 is replaced with a 5-section
 * visual storytelling page:
 *
 *   1. Header     - story narrative paragraph from JSON
 *   2. HERO       - SVG climbing-waterfall: blocks stacked bottom-to-top,
 *                   heights ∝ point contributions, cycle-coloured fills,
 *                   star threshold dashed lines, year-cycle brackets right
 *   3. Cycles     - 3 cards (2026 / 2027 / 2028) breaking the blocks
 *                   down by cycle with rationale + item sub-cards
 *   4. Caveat     - "5-star is not on the roadmap" panel
 *   5. NotPursuing - small pills at the bottom with reason tooltips
 *
 * Data: forwardPlanning.narrative (storyHeading, storyText, fivePillarCaveat)
 *       forwardPlanning.waterfall.blocks (29 blocks - see arithmetic in
 *         docs/audit/23 once landed)
 *       forwardPlanning.lockedInFor2027 + todoFor2027 (cycle 2026/2027 items)
 *       forwardPlanning.notPursuing (label + reason for the pills)
 *
 * The waterfall has honest mismatch information: delta blocks within
 * each cycle stack with their TRUE point contributions; the cycle's
 * canonical target marker sits at the JSON's `target-NNNN.baseline`.
 * When deltas overshoot the target marker (2026: deltas sum 20.65,
 * target = 17 climb to 62), the surplus shows as "stretch zone."
 * When they undershoot (2027 / 2028), the gap is rendered as a labelled
 * "to find" strip. This is information, not a chart error.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { ThematicContainer } from './layout.jsx'
import ScrollFadePane from '../../lib/ScrollFadePane.jsx'

/* ------------------------------------------------------------------ */
/*  Tokens                                                              */
/* ------------------------------------------------------------------ */

const TEXT_BODY  = 'var(--color-theme-body)'
const TEXT_MUTED = 'var(--text-muted-on-dark)'
const RULE_SUBTLE = '#2a3e5c'

/* Cycle palette - drives the waterfall block fills, the cycle
   breakdown card accents, the ProgressBar fill, AND the CycleToggle
   eyebrow colour. Single source so every surface stays in lockstep. */
const CYCLE_COLOUR = {
  'baseline':            '#8FA1B5',                       // muted slate - 2025 starting position
  'baseline-adjustment': 'var(--color-nza-coral)',         // coral - structural drop arrow
  'defendable':          '#8FA1B5',                        // muted slate - defendable floor
  '2026':                'var(--color-nza-coral)',         // coral - this cycle
  '2027':                'var(--gresb-teal-500)',          // teal - next step up
  '2028':                '#7CC470',                        // green - into 4-star (=--theme-carbon)
  'target-2026':         'var(--color-nza-coral)',
  'target-2027':         'var(--gresb-teal-500)',
  'target-2028':         '#7CC470',
}

/* Resolve the cycle's primary colour - single helper so ProgressBar,
   CyclePanel, CycleToggle etc all read from one source and the bar /
   box / dot can never drift apart. */
function cycleColourFor(cycle) {
  return CYCLE_COLOUR[cycle] || 'var(--color-nza-coral)'
}

/* Star threshold lines on the chart - values mirror gresb.starBands
   (Overview reads the same defaults). */
const STAR_THRESHOLDS = [
  { score: 30, label: '★',     name: '1-star floor' },
  { score: 55, label: '★★',    name: '2-star floor' },
  { score: 67, label: '★★★',   name: '3-star floor' },
  { score: 80, label: '★★★★',  name: '4-star floor' },
  { score: 90, label: '★★★★★', name: '5-star floor' },
]

const CYCLE_META = {
  '2026': { label: '2026 · this cycle',   subhead: 'Banking the foundation. Every item below scores this cycle AND defends for free in future cycles.' },
  '2027': { label: '2027 · next step up', subhead: '+13pt onto the 2026 base. Specialist work + first paid assurance.' },
  '2028': { label: '2028 · into 4-star',  subhead: 'Aspirational territory. Requires broader certification + new scored categories.' },
}

/* ------------------------------------------------------------------ */
/*  Top-level component                                                 */
/* ------------------------------------------------------------------ */

export function GresbForward({ gresb }) {
  const fp = gresb.forwardPlanning || {}
  const blocks = fp.waterfall?.blocks || []
  const narrative = fp.narrative || {}
  const notPursuing = fp.notPursuing || []

  /* Build aspect-code lookup so a block's indicator (e.g. "RM1") can
     pull its aspect colour for the per-item dot. */
  const indicatorToAspect = useMemo(() => {
    const map = {}
    for (const aspect of (gresb.aspects || [])) {
      for (const ind of (aspect.indicators || [])) {
        if (ind.code) map[ind.code] = aspect
      }
    }
    return map
  }, [gresb.aspects])

  /* Brief 13 v1.4.3 (Chris ask 5 Jun r9): full redesign in the
     text-left / graphic-right pattern. The previous layout was a
     squashed SVG climbing-waterfall + three repeat cycle cards -
     "doesn't look very clean, I don't like it." The new layout
     mirrors Overview: narrative explainer on the left, a clean thin
     progress bar + cycle toggle on the right that animates the
     climb as the reader toggles between 2026 / 2027 / 2028. The
     "three windows" become the toggle states. */
  const score2025 = gresb.headline?.score2025 ?? 52
  /* Defendable = the 2026 starting point AFTER the structural drop
     from retired indicators. So the cycle climb is target - defendable
     (45 -> 62 = +17 in 2026), NOT target - score2025 (which would
     read +10 and obscure the 7-point structural cost). */
  const defendable = blocks.find((b) => b.category === 'defendable')?.baseline
    ?? gresb.headline?.defendable2026 ?? 45
  const targets = useMemo(() => ({
    '2026': blocks.find((b) => b.category === 'target-2026')?.baseline ?? 62,
    '2027': blocks.find((b) => b.category === 'target-2027')?.baseline ?? 75,
    '2028': blocks.find((b) => b.category === 'target-2028')?.baseline ?? 85,
  }), [blocks])
  const cycleDeltas = useMemo(() => ({
    '2026': blocks.filter((b) => b.category === '2026'),
    '2027': blocks.filter((b) => b.category === '2027'),
    '2028': blocks.filter((b) => b.category === '2028'),
  }), [blocks])

  return (
    <ThematicContainer>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 440px) minmax(0, 1fr)',
        gap: 64,
        alignItems: 'start',
        paddingBottom: 32,
      }}>
        <NarrativeLeft
          narrative={narrative}
          meta={gresb.meta}
        />
        <ProgressGraphic
          score2025={score2025}
          defendable={defendable}
          targets={targets}
          cycleDeltas={cycleDeltas}
          indicatorToAspect={indicatorToAspect}
        />
      </div>

      {/* Bottom strip: 5-star caveat + not-pursuing pills below the
          2-col body, full-width inside the container. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        {narrative.fivePillarCaveat && (
          <FiveStarCaveat text={narrative.fivePillarCaveat} />
        )}
        {notPursuing.length > 0 && (
          <NotPursuingPills items={notPursuing} />
        )}
      </div>
    </ThematicContainer>
  )
}

/* ============================================================ */
/*  Narrative column (left)                                       */
/* ============================================================ */

function NarrativeLeft({ narrative, meta }) {
  const heading = narrative.storyHeading || 'The story so far.'
  const text = narrative.storyText
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 600,
        letterSpacing: 2.2, textTransform: 'uppercase',
        color: 'var(--color-nza-coral)',
      }}>
        Forward planning · GRESB 2026
      </div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-section-title)',
        fontWeight: 400,
        color: 'var(--color-nza-coral)',
        margin: 0,
        paddingBottom: 6,
        borderBottom: '1px solid var(--color-nza-coral)',
        lineHeight: 'var(--text-section-title-lh)',
      }}>{heading}</h2>
      {text && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-small)',
          lineHeight: 'var(--text-body-small-lh)',
          color: TEXT_BODY,
          margin: 0,
        }}>{text}</p>
      )}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: TEXT_MUTED,
        margin: 0,
      }}>
        Toggle a cycle on the right to see where the score lands and
        what's contributing in that year. GRESB scoring is
        cumulative - every item banked in 2026 keeps defending in
        2027 and beyond.
      </div>
    </div>
  )
}

/* ============================================================ */
/*  Progress graphic column (right)                                */
/*  Cycle toggle + animated thin progress bar + per-cycle items   */
/* ============================================================ */

const CYCLES = [
  { key: '2026', starLabel: '★★',   subhead: 'this cycle'   },
  { key: '2027', starLabel: '★★★',  subhead: 'next step up' },
  { key: '2028', starLabel: '★★★★', subhead: 'into 4-star'  },
]

function ProgressGraphic({ score2025, defendable, targets, cycleDeltas, indicatorToAspect }) {
  const [cycle, setCycle] = useState('2026')
  const target = targets[cycle]
  const deltas = cycleDeltas[cycle] || []
  /* 2026 climbs from the defendable floor (45) since the structural
     7-point drop has already been absorbed; later cycles climb from
     the previous cycle's target. */
  const prevTarget = cycle === '2026' ? defendable : targets[String(Number(cycle) - 1)]

  return (
    /* Chris ask 5 Jun r13: single shared horizontal alignment line
       across Overview / Aspects / Forward - the top of the
       right-side infographic always sits at y=108 (GRESB logo
       top). `marginTop: -140` is the canonical lift; same value
       used on Overview cards and Aspects toggle row. Bumped from
       -80 by 60 px so all three pages share one alignment line.
       The cycle panel below is bounded to the remaining viewport
       via ScrollFadePane so the long 2026 item list (15 entries)
       scrolls internally with the coral chevron hint instead of
       running off the page. */
    /* Chris ask 8 Jun (supersedes 5 Jun r14): lock the toggle / bar
       / panel at a fixed vertical position. The earlier
       `justify-content: safe center` reflowed the column when
       cycle changed from 2026 (15 items) → 2027 (fewer items) →
       2028, dragging the CycleToggle pills + ProgressBar visibly
       up/down with the panel height. Cards now anchor at the
       canonical -140 lift (GRESB logo alignment) - Chris asked for
       "fixed position, doesn't have to be perfectly centred, just
       sits reasonably on the page". Panel content height varies
       but the cards above it stay put. */
    <div style={{
      display: 'flex', flexDirection: 'column', minWidth: 0,
      marginTop: -140,
      height: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 32px)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <CycleToggle cycle={cycle} setCycle={setCycle} targets={targets} />
        <ProgressBar target={target} cycle={cycle} score2025={score2025} />
        <CyclePanel
          cycle={cycle}
          deltas={deltas}
          prevTarget={prevTarget}
          target={target}
          indicatorToAspect={indicatorToAspect}
        />
      </div>
    </div>
  )
}

/* ---------- toggle row ----------
   Chris ask 8 Jun: the YEAR eyebrow inside each box always carries
   its cycle colour - so all three boxes show a coral / teal / green
   colour cue at a glance, matching the ProgressBar fill for whichever
   year is selected. Previously every eyebrow was coral and the boxes
   read as identical pink cards. Active vs inactive is still shown
   via the border + background tint (cycle-coloured when active,
   subtle slate when not). */
function CycleToggle({ cycle, setCycle, targets }) {
  return (
    <div role="tablist" aria-label="Cycle" style={{
      display: 'flex', gap: 10,
    }}>
      {CYCLES.map((c) => {
        const isActive = cycle === c.key
        const colour = cycleColourFor(c.key)
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setCycle(c.key)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: `1px solid ${isActive ? colour : RULE_SUBTLE}`,
              background: isActive
                ? `color-mix(in srgb, ${colour} 12%, transparent)`
                : 'transparent',
              cursor: 'pointer',
              transition: 'background 180ms var(--ease-standard), border-color 180ms var(--ease-standard)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
              textAlign: 'left',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11, fontWeight: 600,
              letterSpacing: 1.4, textTransform: 'uppercase',
              color: colour,
            }}>
              {c.key}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 500,
              color: TEXT_BODY,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {targets[c.key]}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: TEXT_MUTED,
            }}>
              {c.starLabel} · {c.subhead}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- thin progress bar with star thresholds ---------- */
const BAR_MIN = 0
const BAR_MAX = 100
function scoreToPct(score) {
  return ((score - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100
}

function ProgressBar({ target, cycle, score2025 }) {
  const targetPct = scoreToPct(target)
  const ivgPct = scoreToPct(score2025)
  const cycleColour = cycleColourFor(cycle)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Star tier labels above */}
      <div style={{ position: 'relative', height: 16 }}>
        {STAR_THRESHOLDS.map((t) => {
          const left = scoreToPct(t.score)
          return (
            <span key={t.score} style={{
              position: 'absolute',
              left: `${left}%`,
              transform: 'translateX(-50%)',
              top: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              color: TEXT_MUTED,
              letterSpacing: 0.4,
              whiteSpace: 'nowrap',
            }}>{t.label}</span>
          )
        })}
      </div>
      {/* The bar itself */}
      <div style={{
        position: 'relative',
        height: 12,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'visible',
      }}>
        {/* Animated cycle fill */}
        <motion.div
          initial={false}
          animate={{ width: `${targetPct}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            background: cycleColour,
            borderRadius: 999,
          }}
        />
        {/* 2025 IVG marker - a small white tick */}
        <div aria-hidden style={{
          position: 'absolute',
          left: `${ivgPct}%`,
          top: -4, bottom: -4,
          width: 2,
          background: 'rgba(255,255,255,0.55)',
          transform: 'translateX(-50%)',
        }} />
        {/* Star threshold tick marks */}
        {STAR_THRESHOLDS.map((t) => {
          const left = scoreToPct(t.score)
          return (
            <div key={t.score} aria-hidden style={{
              position: 'absolute',
              left: `${left}%`,
              top: -2, bottom: -2,
              width: 1,
              background: 'rgba(255,255,255,0.18)',
              transform: 'translateX(-50%)',
            }} />
          )
        })}
        {/* Big target dot at the tip of the fill */}
        <motion.div
          initial={false}
          animate={{ left: `${targetPct}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 22, height: 22,
            borderRadius: 999,
            background: cycleColour,
            border: '3px solid var(--color-theme-base)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
          }}
        />
      </div>
      {/* Score numbers row */}
      <div style={{ position: 'relative', height: 18 }}>
        <span style={{
          position: 'absolute',
          left: `${ivgPct}%`,
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: TEXT_MUTED,
          whiteSpace: 'nowrap',
        }}>IVG {score2025}</span>
        <motion.span
          initial={false}
          animate={{ left: `${targetPct}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          style={{
            position: 'absolute',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            color: TEXT_BODY,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}>
          {cycle} · {target}
        </motion.span>
      </div>
    </div>
  )
}

/* ---------- per-cycle items panel ---------- */
function CyclePanel({ cycle, deltas, prevTarget, target, indicatorToAspect }) {
  const climb = Math.round((target - prevTarget) * 10) / 10
  const cycleColour = cycleColourFor(cycle)
  return (
    <motion.section
      key={cycle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 20,
        border: `1px solid ${RULE_SUBTLE}`,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.015)',
      }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: 1.4, textTransform: 'uppercase',
            color: TEXT_MUTED,
          }}>
            What lands in {cycle}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: TEXT_BODY,
            marginTop: 4,
          }}>
            {CYCLE_META[cycle]?.subhead}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 500,
          color: cycleColour,
          fontVariantNumeric: 'tabular-nums',
        }}>
          +{climb} pt
        </div>
      </header>
      {/* Chris ask 5 Jun r10: "Make the box with what lands
          scrollable, because the mini-page goes off the bottom of
          the page and you can't see it." The 2026 list has 15
          entries which overflows even at 1080 viewport. Wrap the
          list in ScrollFadePane so it scrolls internally with the
          shared coral-chevron + bottom-fade treatment. maxHeight
          calc leaves room for the toggle row (~110), bar block
          (~70), card padding + header (~110), header strip on
          /gresb chrome (~144), bottom footer (~36) and the
          page-outer flex gaps. */}
      <ScrollFadePane
        innerStyle={{
          maxHeight: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 460px)',
          paddingRight: 8,
        }}
      >
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {deltas.length === 0 && (
            <li style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: TEXT_MUTED,
              fontStyle: 'italic',
            }}>No delta items registered for this cycle.</li>
          )}
          {deltas.map((b, i) => {
            const aspect = b.indicator && indicatorToAspect[b.indicator.split('+')[0]]
            const dotColour = aspect?.colour?.primary || cycleColour
            return (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '6px 0',
              }}>
                <span aria-hidden style={{
                  flex: '0 0 8px',
                  width: 8, height: 8,
                  borderRadius: 999,
                  background: dotColour,
                  marginTop: 6,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: TEXT_BODY,
                    lineHeight: 1.35,
                  }}>{b.label}</div>
                  {b.note && (
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: TEXT_MUTED,
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}>{b.note}</div>
                  )}
                </div>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  color: TEXT_BODY,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}>+{b.delta}</span>
              </li>
            )
          })}
        </ul>
      </ScrollFadePane>
    </motion.section>
  )
}

/* ============================================================ */
/*  Section 1 - Header                                            */
/* ============================================================ */

function Header({ title, text, meta }) {
  return (
    <header style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      paddingBottom: 8,
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 600,
        letterSpacing: 2.2, textTransform: 'uppercase',
        color: 'var(--color-nza-coral)',
      }}>
        GRESB 2026 · {meta?.entityName || 'Inspired Villages Group'}
        {meta?.submissionDeadline && (
          <> · submission due {meta.submissionDeadline}</>
        )}
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-section-title)',
        fontWeight: 400,
        color: 'var(--color-nza-coral)',
        margin: 0,
        paddingBottom: 6,
        borderBottom: '1px solid var(--color-nza-coral)',
        lineHeight: 'var(--text-section-title-lh)',
      }}>{title}</h2>

      {text && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-small)',
          lineHeight: 'var(--text-body-small-lh)',
          color: TEXT_BODY,
          margin: 0,
          maxWidth: 880,
        }}>{text}</p>
      )}
    </header>
  )
}

/* ============================================================ */
/*  Section 2 - Hero waterfall chart                              */
/* ============================================================ */

/* Layout numbers - see Brief 23 file head for the design rationale. */
const W = 880
const H = 600
const PAD_TOP    = 32
const PAD_BOTTOM = 32
const PAD_LEFT   = 64
const PAD_RIGHT  = 200
const PLOT_W = W - PAD_LEFT - PAD_RIGHT
const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const SCORE_MIN = 25  /* don't show the empty 0-25 band - IVG's range
                         starts at ~45 anyway */
const SCORE_MAX = 95  /* leave 5pt headroom above the 4-star/2028 line */

function yScale(score) {
  return PAD_TOP + (SCORE_MAX - score) * (PLOT_H / (SCORE_MAX - SCORE_MIN))
}

const BLOCK_W = 240
const BLOCK_X_LEFT = PAD_LEFT + (PLOT_W - BLOCK_W) / 2
const BLOCK_X_RIGHT = BLOCK_X_LEFT + BLOCK_W

function WaterfallChart({ blocks, indicatorToAspect }) {
  /* Walk blocks once to compute layout metadata. Each block becomes a
     "row" with its bottom/top score and cycle anchor. */
  const layout = useMemo(() => buildLayout(blocks), [blocks])

  /* Hover tooltip state. Floating card follows the hovered block. */
  const [hover, setHover] = useState(null) // { rowIdx, x, y, row }

  return (
    <section aria-label="Multi-year point build-up"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-subsection-title)',
        fontWeight: 400,
        color: TEXT_BODY,
        margin: 0,
      }}>
        The point build-up
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-body-small)',
        lineHeight: 'var(--text-body-small-lh)',
        color: TEXT_MUTED,
        margin: 0,
        maxWidth: 760,
      }}>
        Each block is one action contributing to the climb from where IVG
        sits today (52) through the defendable floor (45) and up through
        the multi-year cycle plan. Hover any block for detail; click to
        jump to the relevant indicator.
      </p>

      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
          role="img"
        >
          {/* ---- Star threshold dashed lines (back layer) ---- */}
          {STAR_THRESHOLDS.map((t) => {
            const y = yScale(t.score)
            if (y < PAD_TOP || y > H - PAD_BOTTOM) return null
            return (
              <g key={t.score}>
                <line
                  x1={PAD_LEFT - 8} x2={W - PAD_RIGHT + 12}
                  y1={y} y2={y}
                  stroke="rgba(255,255,255,0.10)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 12} y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fontFamily="var(--font-heading)"
                  fill={TEXT_MUTED}
                  letterSpacing={0.6}
                >{t.label} {t.score}</text>
              </g>
            )
          })}

          {/* ---- Cycle brackets on the right margin ---- */}
          {layout.cycleSpans.map((span) => (
            <CycleBracket key={span.cycle} span={span} />
          ))}

          {/* ---- Block rows ---- */}
          {layout.rows.map((row, i) => (
            <WaterfallRow
              key={i}
              row={row}
              rowIdx={i}
              indicatorToAspect={indicatorToAspect}
              onHover={(payload) => setHover(payload)}
              onLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hover && (
          <BlockTooltip hover={hover} />
        )}
      </div>
    </section>
  )
}

/* ----- Layout computation ----- */

/**
 * Given the ordered blocks, return:
 *   rows[]      - one per block, with computed Y span + role
 *   cycleSpans  - { cycle, topY, bottomY, label } for the right-margin brackets
 */
function buildLayout(blocks) {
  /* Two passes:
       1. Extract canonical baselines (defendable, target-2026/27/28)
          for cycle-bracket boundaries - these are the JSON's stated
          cycle endpoints, the visual ground truth.
       2. Walk blocks in order, maintaining cumulative runningTotal for
          delta-block geometry. Target markers DO NOT reset the running
          total - they're labelled annotations at their canonical
          baseline. When cumulative overshoots target (2026 case:
          deltas sum to 65.65 vs target 62), the overshoot is rendered
          as visible "stretch zone" above the target marker. When
          cumulative undershoots (2028 case: 84.65 vs target 85), the
          gap is also visible. Both communicate genuine information. */

  const baselines = {}
  for (const block of blocks) {
    if (block.baseline != null) baselines[block.category] = block.baseline
  }

  const rows = []
  let runningTotal = SCORE_MIN
  let firstSeen = false

  for (const block of blocks) {
    const cat = block.category
    if (block.baseline != null) {
      if (!firstSeen) {
        runningTotal = block.baseline
        firstSeen = true
      } else if (cat === 'baseline' || cat === 'defendable') {
        runningTotal = block.baseline
      }
      rows.push({
        kind: 'marker',
        category: cat,
        label: block.label,
        score: block.baseline,
        note: block.note,
        y: yScale(block.baseline),
      })
      continue
    }
    /* Delta block - adds (positive or negative) to the running total. */
    const cycle = cycleKeyFromCategory(cat)
    const scoreBottom = runningTotal
    const scoreTop    = runningTotal + block.delta
    rows.push({
      kind: 'delta',
      category: cat,
      cycle,
      label: block.label,
      delta: block.delta,
      indicator: block.indicator,
      note: block.note,
      scoreBottom,
      scoreTop,
      yBottom: yScale(scoreBottom),
      yTop:    yScale(scoreTop),
    })
    runningTotal = scoreTop
  }

  /* Cycle-bracket boundaries come from the canonical baselines:
       2026: defendable      → target-2026
       2027: target-2026     → target-2027
       2028: target-2027     → target-2028
     This gives a clean three-segment partition along the score axis
     regardless of how the cumulative deltas overshoot or undershoot
     each cycle's stated target. */
  const cycleSpans = []
  const cycleBounds = [
    { cycle: '2026', from: baselines['defendable'],   to: baselines['target-2026'] },
    { cycle: '2027', from: baselines['target-2026'],  to: baselines['target-2027'] },
    { cycle: '2028', from: baselines['target-2027'],  to: baselines['target-2028'] },
  ]
  for (const { cycle, from, to } of cycleBounds) {
    if (from == null || to == null) continue
    cycleSpans.push({
      cycle,
      topY: yScale(Math.max(from, to)),
      bottomY: yScale(Math.min(from, to)),
      label: CYCLE_META[cycle]?.label || cycle,
    })
  }

  return { rows, cycleSpans }
}

function cycleKeyFromCategory(cat) {
  if (cat === '2026' || cat === 'target-2026') return '2026'
  if (cat === '2027' || cat === 'target-2027') return '2027'
  if (cat === '2028' || cat === 'target-2028') return '2028'
  return null
}

/* ----- Block row renderers ----- */

function WaterfallRow({ row, rowIdx, indicatorToAspect, onHover, onLeave }) {
  if (row.kind === 'marker') {
    return <MarkerRow row={row} rowIdx={rowIdx} />
  }
  return (
    <DeltaRow
      row={row}
      rowIdx={rowIdx}
      indicatorToAspect={indicatorToAspect}
      onHover={onHover}
      onLeave={onLeave}
    />
  )
}

function MarkerRow({ row, rowIdx }) {
  /* Brief: each cycle's target marker is a horizontal line + label.
     Baseline + defendable markers are styled muted; target-* markers
     in their cycle colour. */
  const isTarget = row.category.startsWith('target-')
  const colour = CYCLE_COLOUR[row.category] || TEXT_MUTED
  const lineColour = isTarget ? colour : 'rgba(255,255,255,0.25)'
  const strokeDash = row.category === 'baseline-adjustment' ? '3 3' : null

  return (
    <motion.g
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rowIdx * 0.04, ease: [0.4, 0, 0.2, 1] }}
    >
      <line
        x1={BLOCK_X_LEFT - 6} x2={BLOCK_X_RIGHT + 6}
        y1={row.y} y2={row.y}
        stroke={lineColour}
        strokeWidth={isTarget ? 2 : 1}
        strokeDasharray={strokeDash}
      />
      <text
        x={BLOCK_X_RIGHT + 12}
        y={row.y + 4}
        fontSize={isTarget ? 12 : 11}
        fontWeight={isTarget ? 600 : 500}
        fontFamily="var(--font-heading)"
        fill={isTarget ? colour : TEXT_BODY}
        letterSpacing={0.4}
      >
        {row.score} · {row.label}
      </text>
    </motion.g>
  )
}

function DeltaRow({ row, rowIdx, indicatorToAspect, onHover, onLeave }) {
  const fill = CYCLE_COLOUR[row.category] || '#8FA1B5'
  const height = Math.max(row.yBottom - row.yTop, 4) /* minimum 4px so very small deltas are still tappable */
  const firstIndicator = (row.indicator || '').split('+')[0].trim()
  const aspect = indicatorToAspect[firstIndicator]
  const aspectPrimary = aspect?.colour?.primary || null

  /* Text-fit thresholds - see Brief 23 file head. */
  const showFullText = height >= 30
  const showTitleOnly = height >= 16

  function handleClick() {
    if (!firstIndicator) return
    const url = `/gresb/aspects?expand=${encodeURIComponent(firstIndicator)}`
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', url)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <motion.g
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rowIdx * 0.04, ease: [0.4, 0, 0.2, 1] }}
      style={{ cursor: firstIndicator ? 'pointer' : 'default' }}
      onMouseEnter={(e) => onHover({
        rowIdx,
        x: BLOCK_X_RIGHT + 14,
        y: (row.yTop + row.yBottom) / 2,
        row,
        aspectName: aspect?.name,
      })}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      <rect
        x={BLOCK_X_LEFT}
        y={row.yTop}
        width={BLOCK_W}
        height={height}
        rx={3}
        fill={fill}
        fillOpacity={0.85}
        stroke={fill}
        strokeWidth={1}
      />

      {/* Indicator-code mini-pill, top-right. Hidden on very short blocks. */}
      {firstIndicator && height >= 14 && (
        <g>
          <rect
            x={BLOCK_X_RIGHT - 6 - 8 * firstIndicator.length}
            y={row.yTop + 4}
            width={6 + 8 * firstIndicator.length}
            height={14}
            rx={3}
            fill={aspectPrimary ? `color-mix(in srgb, ${aspectPrimary} 35%, #0F1629 65%)` : 'rgba(0,0,0,0.45)'}
            stroke={aspectPrimary || 'rgba(255,255,255,0.20)'}
            strokeWidth={1}
          />
          <text
            x={BLOCK_X_RIGHT - 4}
            y={row.yTop + 14}
            textAnchor="end"
            fontFamily="ui-monospace, JetBrains Mono, Consolas, monospace"
            fontSize={9}
            fontWeight={600}
            fill={aspectPrimary || '#fff'}
            letterSpacing={0.2}
          >{firstIndicator}</text>
        </g>
      )}

      {/* Inline text inside the block - height-fit aware */}
      {showFullText && (
        <>
          <text
            x={BLOCK_X_LEFT + 12}
            y={row.yTop + 18}
            fontSize={12}
            fontWeight={500}
            fontFamily="var(--font-body)"
            fill="#0F1629"
          >
            {truncate(row.label, 26)}
          </text>
          <text
            x={BLOCK_X_LEFT + 12}
            y={row.yTop + 18 + 14}
            fontSize={11}
            fontWeight={600}
            fontFamily="var(--font-heading)"
            fill="rgba(15,22,41,0.85)"
            fontVariantNumeric="tabular-nums"
          >
            {row.delta > 0 ? `+${row.delta}` : row.delta} pt
          </text>
        </>
      )}
      {!showFullText && showTitleOnly && (
        <text
          x={BLOCK_X_LEFT + 12}
          y={row.yTop + height / 2 + 4}
          fontSize={11}
          fontWeight={500}
          fontFamily="var(--font-body)"
          fill="#0F1629"
        >
          {truncate(row.label, 24)} · {row.delta > 0 ? `+${row.delta}` : row.delta}
        </text>
      )}
    </motion.g>
  )
}

function CycleBracket({ span }) {
  /* Curly-brace-ish bracket on the right margin. SVG path approximating
     a stretched brace - two arcs meeting at a centre point. */
  const x = BLOCK_X_RIGHT + 90
  const top = span.topY
  const bottom = span.bottomY
  const midY = (top + bottom) / 2
  const bx = x - 8
  const path = `
    M ${bx} ${top}
    C ${x} ${top}, ${x} ${midY - 4}, ${x + 6} ${midY}
    C ${x} ${midY + 4}, ${x} ${bottom}, ${bx} ${bottom}
  `
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth={1}
      />
      <text
        x={x + 12}
        y={midY + 4}
        fontSize={11}
        fontFamily="var(--font-heading)"
        fontWeight={500}
        fill={CYCLE_COLOUR[span.cycle] || TEXT_BODY}
        letterSpacing={0.5}
      >
        {span.label}
      </text>
    </g>
  )
}

function BlockTooltip({ hover }) {
  const { row, aspectName } = hover
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: `${(hover.x / W) * 100}%`,
        top: `${(hover.y / H) * 100}%`,
        transform: 'translate(8px, -50%)',
        pointerEvents: 'none',
        background: 'var(--color-theme-base)',
        border: '1px solid var(--rule-on-dark)',
        borderRadius: 6,
        padding: '10px 12px',
        minWidth: 200, maxWidth: 280,
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
        zIndex: 10,
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: TEXT_BODY,
        marginBottom: 4,
      }}>{row.label}</div>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 600,
        color: CYCLE_COLOUR[row.category] || TEXT_BODY,
        marginBottom: row.note ? 6 : 0,
      }}>
        {row.delta != null
          ? `${row.delta > 0 ? '+' : ''}${row.delta} pt`
          : `Score ${row.score}`}
        {row.cycle && <> · {row.cycle}</>}
        {row.indicator && <> · {row.indicator}</>}
      </div>
      {row.note && (
        <div style={{
          fontSize: 11,
          color: TEXT_MUTED,
          lineHeight: 1.45,
        }}>{row.note}</div>
      )}
      {aspectName && (
        <div style={{
          fontSize: 10,
          color: TEXT_MUTED,
          marginTop: 6,
          fontStyle: 'italic',
        }}>{aspectName} aspect</div>
      )}
    </div>
  )
}

function truncate(s, n) {
  if (!s) return ''
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}

/* ============================================================ */
/*  Section 3 - Cycle breakdown cards (3 columns)                 */
/* ============================================================ */

function CycleBreakdown({ blocks, todoFor2027, indicatorToAspect }) {
  /* Group delta blocks by cycle, then for 2027 splice in todoFor2027
     items (the brief's list of parked items destined for 2027). 2026
     and 2028 cycles read straight from the waterfall blocks. */
  const groups = useMemo(() => {
    const out = { '2026': [], '2027': [], '2028': [] }
    for (const b of blocks) {
      const c = cycleKeyFromCategory(b.category)
      if (c && b.delta != null) {
        out[c].push({
          source: 'waterfall',
          title: b.label,
          delta: b.delta,
          note: b.note,
          indicator: b.indicator,
        })
      }
    }
    /* Splice todoFor2027 into the 2027 column. Brief: "2027 column:
       forwardPlanning.todoFor2027 array + filtered blocks" */
    for (const t of (todoFor2027 || [])) {
      /* Avoid duplicating entries the waterfall already lists. */
      const dup = out['2027'].some((item) => item.title === t.title)
      if (!dup) {
        out['2027'].push({
          source: 'todo',
          title: t.title,
          delta: t.pointPotential ?? null,
          note: t.note,
          indicator: null,
        })
      }
    }
    return out
  }, [blocks, todoFor2027])

  return (
    <section aria-label="Cycle breakdown"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 20,
      }}>
      {['2026', '2027', '2028'].map((cycle) => (
        <CycleCard
          key={cycle}
          cycle={cycle}
          items={groups[cycle] || []}
          indicatorToAspect={indicatorToAspect}
        />
      ))}
    </section>
  )
}

function CycleCard({ cycle, items, indicatorToAspect }) {
  const colour = CYCLE_COLOUR[cycle] || TEXT_BODY
  const meta = CYCLE_META[cycle] || { label: cycle, subhead: '' }
  return (
    <div style={{
      background: `color-mix(in srgb, ${colour} 4%, transparent)`,
      border: `${cycle === '2028' ? 1 : 2}px solid color-mix(in srgb, ${colour} 50%, transparent)`,
      borderRadius: 8,
      padding: '18px 18px 16px 18px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11, fontWeight: 700,
          letterSpacing: 1.4, textTransform: 'uppercase',
          color: colour,
          marginBottom: 6,
        }}>{meta.label}</div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: 1.5,
          color: TEXT_MUTED,
          margin: 0,
        }}>{meta.subhead}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && (
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: 'italic' }}>
            No items in this cycle.
          </div>
        )}
        {items.map((item, i) => (
          <CycleItem key={i} item={item} colour={colour} indicatorToAspect={indicatorToAspect} />
        ))}
      </div>
    </div>
  )
}

function CycleItem({ item, colour, indicatorToAspect }) {
  const firstIndicator = (item.indicator || '').split('+')[0].trim()
  const aspect = firstIndicator ? indicatorToAspect[firstIndicator] : null

  function handleClick() {
    if (!firstIndicator) return
    const url = `/gresb/aspects?expand=${encodeURIComponent(firstIndicator)}`
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div
      onClick={handleClick}
      role={firstIndicator ? 'button' : undefined}
      tabIndex={firstIndicator ? 0 : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'baseline',
        gap: 10,
        padding: '8px 10px',
        background: 'rgba(15,22,41,0.4)',
        borderLeft: `2px solid ${colour}`,
        borderRadius: 4,
        cursor: firstIndicator ? 'pointer' : 'default',
      }}
    >
      {item.delta != null && (
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12, fontWeight: 600,
          color: colour,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {item.delta > 0 ? '+' : ''}{item.delta}
        </span>
      )}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12, fontWeight: 500,
        color: TEXT_BODY,
        lineHeight: 1.4,
        minWidth: 0,
      }}>
        {item.title}
        {item.note && (
          <span style={{
            display: 'block',
            fontSize: 10, fontWeight: 400,
            color: TEXT_MUTED,
            fontStyle: 'italic',
            marginTop: 2,
            lineHeight: 1.4,
          }}>{item.note}</span>
        )}
      </span>
      {firstIndicator && (
        <span style={{
          fontFamily: 'ui-monospace, JetBrains Mono, Consolas, monospace',
          fontSize: 10, fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 3,
          background: aspect?.colour?.tint || 'rgba(255,255,255,0.05)',
          color: aspect?.colour?.primary || TEXT_MUTED,
          whiteSpace: 'nowrap',
        }}>{firstIndicator}</span>
      )}
    </div>
  )
}

/* ============================================================ */
/*  Section 4 - 5-star caveat panel                               */
/* ============================================================ */

function FiveStarCaveat({ text }) {
  return (
    <section style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: 20,
      border: `1px solid ${RULE_SUBTLE}`,
      borderRadius: 8,
      background: 'rgba(255,255,255,0.015)',
    }}>
      <Info size={18} color="var(--color-nza-coral)" style={{ flex: '0 0 18px', marginTop: 2 }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4,
          margin: '0 0 6px 0',
          color: TEXT_BODY,
        }}>5-star is not on the roadmap - here's why.</h4>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-small)',
          lineHeight: 'var(--text-body-small-lh)',
          color: TEXT_MUTED,
          margin: 0,
        }}>{text}</p>
      </div>
    </section>
  )
}

/* ============================================================ */
/*  Section 5 - Not pursuing pills                                */
/* ============================================================ */

function NotPursuingPills({ items }) {
  const [activeIdx, setActiveIdx] = useState(null)
  return (
    <section aria-label="Not pursuing"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        paddingTop: 16,
        borderTop: `1px solid ${RULE_SUBTLE}`,
      }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10, fontWeight: 600,
        letterSpacing: 1.4, textTransform: 'uppercase',
        color: TEXT_MUTED,
      }}>
        What we're deliberately NOT pursuing:
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            style={{
              position: 'relative',
              padding: '5px 12px',
              background: 'rgba(42,62,92,0.40)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              fontFamily: 'var(--font-body)',
              fontSize: 11, fontWeight: 500,
              color: TEXT_BODY,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            {item.title}
            {activeIdx === i && item.reason && (
              <span style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 260,
                padding: '8px 12px',
                background: 'var(--color-theme-base)',
                border: '1px solid var(--rule-on-dark)',
                borderRadius: 6,
                fontSize: 11,
                color: TEXT_MUTED,
                lineHeight: 1.5,
                textAlign: 'left',
                whiteSpace: 'normal',
                pointerEvents: 'none',
                boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
                zIndex: 5,
              }}>{item.reason}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
