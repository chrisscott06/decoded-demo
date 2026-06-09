/**
 * Brief 23 (BR-13 v1.3) Task 3 - /gresb/aspects with 8 visual enhancements.
 *
 * Inherits Brief 22's Molson-pattern accordion (component toggle →
 * aspect groups → indicator cards → 4-panel expanded detail) and
 * layers in:
 *
 *   1. lucide icons in panel headers (Info / Clock / Target / FileText)
 *   2. Verdict banner at top of LAST YEAR panel (coloured strip + score
 *      + italic validator quote auto-extracted from decision2025)
 *   3. GRESB-tracked-issues as a chip grid inside WHAT IT MEANS panel
 *      (when indicator.gresbTrackedIssues populated)
 *   4. Numbered action checklist in WHAT WE NEED TO DO (when
 *      indicator.whatWeNeedToDoChecklist populated; falls back to prose)
 *   5. Document-type icons in EVIDENCE REQUIRED (13 lucide icons mapped
 *      from evidenceRequired.type)
 *   6. "What's changed for 2026" amber banner with AlertTriangle (existing
 *      behaviour from v1.2, kept + icon added)
 *   7. Inline peer comparison data points (when indicator.peerComparison
 *      populated - array of {label, ivgStatus, peerPercent})
 *   8. Owner / confidence / last-updated metadata footer
 *
 * Plus: all cards (non-scored / retired / parked) become clickable per
 * the v1.3 JSON `clickable` flag (defaults true). When expanded, their
 * `whatItMeans` explainer surfaces in panel 1; other panels fall back
 * to "-" gracefully when fields are empty.
 *
 * Plus: URL state extension - `?expand=<indicatorCode>` deep-links to a
 * specific card. Used by the Forward Planning waterfall (Task 4) to
 * route block clicks → relevant indicator pre-expanded. The aspect's
 * component is auto-switched if the deep-linked indicator sits in a
 * different one than the current ?component=… filter.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { NarrativeSection as MarkdownSection, renderInlineMarkdown } from '../../lib/inlineMarkdown.jsx'
import ScrollFadePane from '../../lib/ScrollFadePane.jsx'
import {
  Info,
  Clock,
  Target,
  FileText,
  Globe,
  BarChart3,
  Building2,
  CheckSquare,
  BadgeCheck,
  MessageSquare,
  Users,
  Workflow,
  GraduationCap,
  Scroll,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'

const TEXT_BODY = 'var(--color-theme-body)'
const TEXT_MUTED = 'var(--text-muted-on-dark)'
const BG_CARD = '#1a1f2e'
const RULE_SUBTLE = '#2a3e5c'

const COMPONENTS = [
  { key: 'Management',  label: 'Management',  total: '30 pt' },
  { key: 'Performance', label: 'Performance', total: '70 pt' },
  { key: 'Residential', label: 'Residential', total: '3.5 pt' },
]

const PRIORITY_TAG = {
  'action-needed': 'action needed',
  'defending':     'defending',
  'easy-win':      'easy win',
  'confirm-only':  'confirm only',
  'standard':      'standard',
  'retired':       'retired 2026',
  'parked':        'parked → 2027',
  'non-scored':    'reporting only',
}

const MUTED_PRIORITIES = new Set(['retired', 'parked', 'non-scored'])

/* Decision-verdict colour map for inline emphasis inside expanded panels. */
const VERDICT_STYLES = [
  { test: /\b(Accepted|MAXED|Maxed)\b/g,    color: '#7BC97B' },           // green
  { test: /\bPartially Accepted\b/g,        color: '#F5B048' },           // amber
  { test: /\b(Not Accepted|Not scored)\b/g, color: 'var(--color-nza-coral)' },
]

function colorisedDecision(text) {
  if (!text) return text
  let parts = [text]
  for (const v of VERDICT_STYLES) {
    parts = parts.flatMap((p) => {
      if (typeof p !== 'string') return [p]
      const out = []
      let last = 0
      const re = new RegExp(v.test.source, 'g')
      let m
      while ((m = re.exec(p))) {
        if (m.index > last) out.push(p.slice(last, m.index))
        out.push(<span key={`v-${v.color}-${m.index}`} style={{ color: v.color, fontWeight: 600 }}>{m[0]}</span>)
        last = m.index + m[0].length
      }
      if (last < p.length) out.push(p.slice(last))
      return out
    })
  }
  return parts
}

/* ------------------------------------------------------------------ */
/*  Brief 23 enhancement helpers                                        */
/* ------------------------------------------------------------------ */

/** Verdict tone tokens used by the verdict banner. */
const VERDICT_TONE = {
  'Accepted':            { color: '#7BC97B', label: 'ACCEPTED' },
  'Maxed':               { color: '#7BC97B', label: 'MAXED' },
  'MAXED':               { color: '#7BC97B', label: 'MAXED' },
  'Partially Accepted':  { color: '#F5B048', label: 'PARTIALLY ACCEPTED' },
  'Not Accepted':        { color: 'var(--color-nza-coral)', label: 'NOT ACCEPTED' },
  'Not scored':          { color: TEXT_MUTED, label: 'NOT SCORED' },
}

/**
 * Parse decision2025 prose into structured verdict / score / quote.
 * Examples:
 *   "Partially Accepted (0.17/1.5). Evidence provided but not shared with investors..."
 *     → { verdict: "Partially Accepted", score: "0.17 / 1.5", quote: null }
 *   "Not Accepted (0/1.5). Validator note: \"Does not support...\""
 *     → { verdict: "Not Accepted", score: "0 / 1.5", quote: "Does not support..." }
 *   "N/A" → null
 */
function parseDecision(decision) {
  if (!decision || typeof decision !== 'string') return null
  const trimmed = decision.trim()
  if (trimmed === 'N/A' || trimmed === '-') return null

  /* Order matters - "Partially Accepted" must match before "Accepted". */
  const verdictKeys = ['Partially Accepted', 'Not Accepted', 'Not scored', 'MAXED', 'Maxed', 'Accepted']
  let verdict = null
  for (const k of verdictKeys) {
    if (trimmed.toLowerCase().startsWith(k.toLowerCase()) || trimmed.includes(k)) {
      verdict = k
      break
    }
  }
  if (!verdict) return null

  /* Score in parens like "(0.17/1.5)". */
  const scoreMatch = trimmed.match(/\(([\d.]+)\s*\/\s*([\d.]+)\)/)
  const score = scoreMatch ? `${scoreMatch[1]} / ${scoreMatch[2]}` : null

  /* Validator quote in "Validator note: \"...\"" or "Validator note: '…'" */
  const quoteMatch = trimmed.match(/[Vv]alidator note:\s*["“']([^"”']+)["”']/)
  const quote = quoteMatch ? quoteMatch[1] : null

  return { verdict, score, quote }
}

/** Document-type → lucide icon. Drives the small glyph in EVIDENCE REQUIRED. */
const EVIDENCE_TYPE_ICON = {
  'policy-document':         FileText,
  'public-disclosure':       Globe,
  'data-submission':         BarChart3,
  'asset-spreadsheet':       Building2,
  'asset-spreadsheet-flag':  CheckSquare,
  'third-party-validation':  BadgeCheck,
  'narrative-only':          MessageSquare,
  'survey-confirmation':     Users,
  'process-description':     Workflow,
  'programme-description':   Workflow,
  'training-records':        GraduationCap,
  'target-document':         Target,
  'lease-contract-clauses':  Scroll,
}

/** Default explainer copy for non-scored / retired / parked when JSON
   doesn't override via whatItMeans. */
const PRIORITY_DEFAULT_EXPLAINER = {
  'non-scored': "Reporting-only indicator. GRESB asks for narrative context but doesn't score. Feeds validator decisions on adjacent scored indicators.",
  'retired':    "Indicator retired for 2026 (e.g. LE3 was retired this cycle = guaranteed -2pt structural drop).",
  'parked':     "Deliberately scoped out for this cycle. See Forward Planning for the 2027 plan.",
}

/* ------------------------------------------------------------------ */
/*  Top-level component                                                 */
/* ------------------------------------------------------------------ */

export default function GresbAspects({ gresb }) {
  const aspects = gresb.aspects || []
  const meta = gresb.meta || {}

  /* ----- URL state: component + expand=<indicatorCode>. -----
     Component: filters which aspect group block is visible.
     Expand: deep-links to a specific indicator card; on mount, the
     component auto-switches to the linked indicator's component
     (so the Forward Planning waterfall's "click block → /gresb/aspects/
     X?expand=Y" lands on the right view regardless of saved component). */
  const [component, setComponent] = useState(() => {
    if (typeof window === 'undefined') return 'Management'
    const q = new URLSearchParams(window.location.search).get('component')
    return capitaliseComponent(q) || 'Management'
  })
  const [expandedCode, setExpandedCode] = useState(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('expand') || null
  })

  /* On first mount, if an ?expand=<code> param is set, auto-switch the
     component to the aspect that owns that indicator. */
  useEffect(() => {
    if (!expandedCode) return
    const owningAspect = aspects.find((a) =>
      (a.indicators || []).some((i) => i.code === expandedCode)
    )
    if (owningAspect && owningAspect.component && owningAspect.component !== component) {
      setComponent(owningAspect.component)
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  /* Persist component to URL. */
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('component', component.toLowerCase())
    window.history.replaceState({}, '', url.toString())
  }, [component])

  /* Persist expand to URL - strip when null, write when set. */
  useEffect(() => {
    const url = new URL(window.location.href)
    if (expandedCode) url.searchParams.set('expand', expandedCode)
    else              url.searchParams.delete('expand')
    window.history.replaceState({}, '', url.toString())
  }, [expandedCode])

  const filtered = aspects.filter((a) => a.component === component)
  /* Brief 25 Task 3 - left narrative column. 240px on desktop;
     stacks above the toggle on mobile (<768px). Reads from
     data.aspectsPageNarrative.sections. */
  const narrativeSections = gresb.aspectsPageNarrative?.sections || []

  return (
    <div className="gresb-aspects-layout" style={{
      display: 'grid',
      /* Chris ask 5 Jun r6: bump column gap from 32 to 64 - "we'll
         put a horizontal spacer between the text and the aspect
         boxes, I think maybe go 64." Adds clear breathing room
         between the explainer narrative on the left and the
         indicator card area on the right. */
      gap: 64,
      paddingBottom: 48,
      /* Lift moved OFF the parent grid (was -60). Earlier the lift
         pulled the narrative aside H4 ("What you're looking at") up
         into the same vertical band as the header's
         entity-submission line, so the H4's 1 px coral underline
         struck through "Westbrook Academies Trust · submission due ...".
         Now the parent grid sits at its natural y; the right column
         alone carries a larger lift to align the toggle with the
         logo top (see right-column wrapper below). */
    }}>

      {/* ----- Left narrative column. Chris ask 5 Jun r6: same
              scroll-fade-y + coral chevron treatment as the rest of
              the app - hides the dark grey system scrollbar (Chris:
              "make scrollbars blend into the dark blue") and shows a
              pulsing coral arrow when there's more text below. The
              outer <aside> retains `position: sticky` so the column
              tracks page-level scroll if it ever happens; the inner
              ScrollFadePane bounds the visible height to the
              viewport and scrolls within. ----- */}
      {narrativeSections.length > 0 && (
        <aside className="gresb-aspects-narrative" style={{
          position: 'sticky', top: 16,
          alignSelf: 'start',
        }}>
          <ScrollFadePane
            innerStyle={{
              maxHeight: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 32px)',
              paddingRight: 8,
            }}
            innerClassName="gresb-aspects-narrative-inner"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {narrativeSections.map((s, i) => (
                <MarkdownSection key={i} section={s} />
              ))}
            </div>
          </ScrollFadePane>
        </aside>
      )}

      {/* ----- Right column: toggle (frozen at top) + scrollable card area -
              Brief 25 Chris ask 5 Jun. The component toggle row stays
              put as a "frozen" header; the indicator cards scroll
              within their own bounding box rather than pushing the
              whole page down. max-height calc leaves room for the
              top + secondary nav and the page padding. */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0,
        /* Chris ask 5 Jun r13: single shared horizontal alignment
           line across Overview / Aspects / Forward - top of the
           right-side infographic always at y=108 (GRESB logo top).
           `marginTop: -140` is the canonical lift; same value used
           on Overview cards and Forward toggle. Bumped from -132
           by 8 px so all three pages share one alignment line.

           Height calc tuned so the scroll area's bottom edge sits
           inside the viewport. At 855 viewport: 100vh - 60 - 30 -
           110 = 655, with the column starting at y=108 the bottom
           lands at y=763 - ~92 px breathing room above the page
           bottom, no more clipped clicks on the last card.

           The narrative aside on the left is NOT lifted - it stays
           below the header so its H4 underline doesn't collide
           with the entity-submission line. */
        marginTop: -140,
        height: 'calc(100vh - var(--topnav-height) - var(--subnav-height) - 110px)',
        minHeight: 480,
      }}>
      {/* ----- Component toggle bar - Chris ask 5 Jun r15 follow-on:
              "make it the same as the site energy pill so it's like a
              single pill where it slides between the three." EOC-
              style segmented control: one solid track containing the
              three buttons, with a coral pill that SLIDES between
              positions via framer-motion's shared layoutId. Same
              pattern as App.jsx::SiteEnergyTabBar, palette inverted
              for the dark register (lit track, light-muted inactive
              text, white-on-coral active text). ----- */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <div role="tablist" aria-label="GRESB component" style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 999,
          padding: 4,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {COMPONENTS.map((c) => {
            const isActive = component === c.key
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setComponent(c.key)}
                style={{
                  position: 'relative',
                  padding: '6px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 999,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13, fontWeight: 500, letterSpacing: 0.3,
                  color: isActive ? '#ffffff' : TEXT_MUTED,
                  cursor: 'pointer',
                  transition: 'color 220ms ease',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {isActive && (
                  <motion.span
                    aria-hidden
                    layoutId="gresb-aspects-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--color-nza-coral)',
                      borderRadius: 999,
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{c.label}</span>
                <span style={{
                  position: 'relative', zIndex: 1,
                  opacity: isActive ? 0.85 : 0.6,
                  fontSize: 11,
                }}>{c.total}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ----- Scrollable card area. Chris ask 5 Jun r6: same
              scroll-fade-y + coral chevron treatment as the rest of
              the app so the dark grey system scrollbar disappears
              into the navy background. The chevron pulses at the
              bottom centre until the user reaches the end. ----- */}
      <ScrollFadePane
        className="gresb-aspects-scroll"
        style={{ flex: 1, minHeight: 0 }}
        innerStyle={{
          height: '100%',
          paddingRight: 6,
          paddingTop: 4,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {filtered.length === 0 && (
            <p style={{ color: TEXT_MUTED, fontSize: 14 }}>
              No aspects in the {component} component.
            </p>
          )}
          {filtered.map((aspect) => (
            <AspectGroup
              key={aspect.code}
              aspect={aspect}
              expandedCode={expandedCode}
              setExpandedCode={setExpandedCode}
              meta={meta}
            />
          ))}
          {/* Legend strip lives inside the scrollable area - it's a
              footer for the card list, not a page-level chrome. */}
          <LegendStrip />
        </div>
      </ScrollFadePane>
      </div>
    </div>
  )
}

/* Brief 25 - render **bold** markdown syntax inline as <strong>.
   Simple regex-based parser, no full markdown engine needed. */
function renderInlineBold(text) {
  if (!text) return null
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--color-theme-body)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function capitaliseComponent(q) {
  if (!q) return null
  const map = { management: 'Management', performance: 'Performance', residential: 'Residential' }
  return map[q.toLowerCase()] || null
}

/* ------------------------------------------------------------------ */
/*  Aspect group                                                        */
/* ------------------------------------------------------------------ */

function AspectGroup({ aspect, expandedCode, setExpandedCode, meta }) {
  const primary = aspect.colour?.primary || '#8FA1B5'
  const tint    = aspect.colour?.tint    || `${primary}20`
  const indicators = aspect.indicators || []

  return (
    <section>
      <header style={{
        display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
        marginBottom: 16,
      }}>
        <span aria-hidden style={{
          display: 'inline-block', width: 10, height: 10,
          borderRadius: 999, background: primary,
        }} />
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13, fontWeight: 600,
          letterSpacing: 1.4, textTransform: 'uppercase',
          color: primary,
          margin: 0,
        }}>
          {aspect.name}
        </h3>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, color: TEXT_MUTED,
          marginLeft: 6,
        }}>
          {indicators.length} indicator{indicators.length === 1 ? '' : 's'}
          {aspect.max2026 != null && <> · {aspect.max2026} pt</>}
        </span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {indicators.map((ind) => (
          <IndicatorCard
            key={ind.code}
            indicator={ind}
            aspectColour={{ primary, tint }}
            isExpanded={expandedCode === ind.code}
            onToggle={() => setExpandedCode(expandedCode === ind.code ? null : ind.code)}
            meta={meta}
          />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Indicator card                                                      */
/* ------------------------------------------------------------------ */

function IndicatorCard({ indicator, aspectColour, isExpanded, onToggle, meta }) {
  const muted = MUTED_PRIORITIES.has(indicator.priority)
  const actionNeeded = indicator.priority === 'action-needed'
  /* Brief 23: clickable defaults true. Previously muted (retired/parked/
     non-scored) were locked - now they open and reveal an explainer. */
  const canExpand = indicator.clickable !== false

  const { primary, tint } = aspectColour
  const cardOpacity =
    indicator.priority === 'retired'    ? 0.55 :
    indicator.priority === 'parked'     ? 0.7  :
    indicator.priority === 'non-scored' ? 0.55 :
    1

  return (
    <article style={{
      background: BG_CARD,
      border: actionNeeded ? `2px solid ${primary}` : `1px solid ${RULE_SUBTLE}`,
      borderRadius: 8,
      opacity: cardOpacity,
      transition: 'border-color 150ms ease',
    }}>
      {/* Collapsed header (always rendered, acts as click target) */}
      <button
        type="button"
        onClick={() => canExpand && onToggle()}
        aria-expanded={isExpanded}
        disabled={!canExpand}
        style={{
          all: 'unset',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto auto',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          width: '100%',
          cursor: canExpand ? 'pointer' : 'default',
          boxSizing: 'border-box',
        }}
      >
        {/* Code pill */}
        <CodePill code={indicator.code} primary={primary} tint={tint} muted={muted} />

        {/* Title */}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14, fontWeight: 500,
          color: muted ? TEXT_MUTED : TEXT_BODY,
          textDecoration: indicator.priority === 'retired' ? 'line-through' : 'none',
          textAlign: 'left',
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {indicator.ivgName || indicator.code}
        </span>

        {/* Score snippet */}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11, color: TEXT_MUTED,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {indicator.score2025 != null
            ? `${indicator.score2025} / ${indicator.max2026 ?? '-'} last year`
            : `- / ${indicator.max2026 ?? '-'} last year`}
        </span>

        {/* Status tag */}
        <PriorityTag priority={indicator.priority} primary={primary} tint={tint} />

        {/* Chevron */}
        <span aria-hidden style={{
          color: TEXT_MUTED,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 200ms ease',
          fontSize: 14,
          lineHeight: 1,
        }}>›</span>
      </button>

      {/* Expanded detail */}
      {isExpanded && canExpand && (
        <ExpandedDetail indicator={indicator} primary={primary} tint={tint} meta={meta} muted={muted} />
      )}
    </article>
  )
}

function CodePill({ code, primary, tint, muted }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 44,
      padding: '4px 10px',
      borderRadius: 999,
      background: muted ? '#6a7a8e20' : tint,
      color: muted ? '#b8c5d3' : primary,
      fontFamily: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
      fontSize: 11, fontWeight: 600,
      letterSpacing: 0.4,
      whiteSpace: 'nowrap',
    }}>{code}</span>
  )
}

function PriorityTag({ priority, primary, tint }) {
  const label = PRIORITY_TAG[priority] || priority
  if (priority === 'action-needed') {
    return (
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 4,
        background: tint, color: primary,
        textTransform: 'uppercase', letterSpacing: 0.4,
        whiteSpace: 'nowrap',
      }}>{label}</span>
    )
  }
  if (MUTED_PRIORITIES.has(priority)) {
    return (
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 4,
        background: 'rgba(184,197,211,0.08)',
        color: '#b8c5d3',
        textTransform: 'uppercase', letterSpacing: 0.4,
        whiteSpace: 'nowrap',
      }}>{label}</span>
    )
  }
  return (
    <span style={{
      fontFamily: 'var(--font-body)',
      fontSize: 11, fontWeight: 500,
      color: TEXT_MUTED,
      textTransform: 'lowercase', letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

/* ------------------------------------------------------------------ */
/*  Expanded detail                                                     */
/* ------------------------------------------------------------------ */

function ExpandedDetail({ indicator, primary, tint, meta, muted }) {
  /* Brief 23 - derive verdict triple (verdict / score / validator quote)
     from decision2025 prose. parseDecision returns null when N/A or
     unparseable, in which case the verdict banner is suppressed. */
  const verdict = parseDecision(indicator.decision2025)

  /* What it means: explicit whatItMeans wins. For muted indicators with
     empty whatItMeans, fall back to the priority-default explainer so
     non-scored / retired / parked cards always say SOMETHING when
     opened (per brief: "Content for non-scored / retired / parked cards
     explains what they are"). */
  const whatItMeans =
    indicator.whatItMeans
    || indicator.gresbDetail?.description
    || PRIORITY_DEFAULT_EXPLAINER[indicator.priority]
    || null

  /* Evidence text + type icon. */
  const evidenceText =
    indicator.evidenceRequired?.description
    || indicator.gresbDetail?.evidenceType
    || null
  const evidenceType = indicator.evidenceRequired?.type
  const EvidenceIcon = evidenceType ? EVIDENCE_TYPE_ICON[evidenceType] : null
  const validation = indicator.evidenceRequired?.validation || null

  /* Decision sub-text inside Last Year panel (after the verdict banner).
     If parseDecision pulled out a quote, the banner shows the quote and
     we suppress it here to avoid duplication; otherwise we render the
     full decision2025 string colourised. */
  const showFullDecisionText = !verdict || !verdict.quote

  /* Brief 25 (BR-13 v1.4) - explicit `validatorReason` field beats the
     regex extraction from decision2025 prose. */
  const validatorReason = indicator.validatorReason || verdict?.quote || null
  /* Brief 25 - new whatLastYearSubmitted prose. */
  const whatLastYearSubmitted = indicator.whatLastYearSubmitted || null
  /* Brief 13 v1.4.3 - Path to Max content (gapToMaxSummary +
     gapToMaxDetail). Only the summary's presence gates the section -
     it carries the headline ("Realistic this cycle: 0.5 / 1"); the
     detail expands underneath with markdown-flavoured prose. */
  const gapToMaxSummary = indicator.gapToMaxSummary || null
  const gapToMaxDetail = indicator.gapToMaxDetail || null

  /* Brief 23 + 25 enhancement: GRESB-tracked-issues, checklist, peer
     comparison, open questions strip. Each lights up conditionally
     on JSON. v1.4 changes gresbTrackedIssues shape from plain string
     array → array of { label, peerPercent, ivgClaimed } - IssueChipGrid
     accepts both. */
  const trackedIssues = indicator.gresbTrackedIssues || null
  const checklist     = indicator.whatWeNeedToDoChecklist || null
  const peer          = indicator.peerComparison || null
  const openQuestions = indicator.openQuestionsForIVG || null

  return (
    <div style={{
      borderTop: `1px solid ${RULE_SUBTLE}`,
      padding: '18px 18px 20px 18px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Changed for 2026 banner - enhancement #6 (gained AlertTriangle
         icon in v1.3). Only renders when populated. */}
      {indicator.whatsChanged2026 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '8px 12px',
          background: 'rgba(245,176,72,0.10)',
          borderLeft: '3px solid #F5B048',
          borderRadius: '0 4px 4px 0',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#F5B048',
        }}>
          <AlertTriangle size={14} style={{ flex: '0 0 14px', marginTop: 2 }} aria-hidden />
          <span>
            <strong style={{ fontWeight: 600 }}>Changed for 2026:</strong>{' '}
            <span style={{ color: TEXT_BODY }}>{indicator.whatsChanged2026}</span>
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 16,
      }}>
        {/* Panel 1 - What it means + GRESB-tracked-issues chips */}
        <Panel header="What it means" icon={Info} primary={primary}>
          {whatItMeans || '-'}
          {trackedIssues && trackedIssues.length > 0 && (
            <IssueChipGrid issues={trackedIssues} primary={primary} tint={tint} />
          )}
          {peer && peer.length > 0 && (
            <PeerComparisonStrip rows={peer} primary={primary} />
          )}
        </Panel>

        {/* Panel 2 - Last year (verdict banner + validator reason + what
            Westbrook submitted). Brief 25 (v1.4) adds explicit validatorReason
            + whatLastYearSubmitted fields - both render conditionally
            below the verdict pill. */}
        <Panel header="Last year" icon={Clock} primary={primary}>
          {verdict && <VerdictBanner verdict={verdict} score={verdict.score} />}
          {validatorReason && (
            <p style={{
              margin: '8px 0 0 0',
              fontStyle: 'italic',
              color: TEXT_MUTED,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              “{validatorReason}”
            </p>
          )}
          {whatLastYearSubmitted && (
            <p style={{
              margin: '8px 0 0 0',
              fontSize: 12,
              lineHeight: 1.5,
              color: TEXT_BODY,
            }}>
              {whatLastYearSubmitted}
            </p>
          )}
          {!validatorReason && !whatLastYearSubmitted && showFullDecisionText && indicator.decision2025 && (
            <div style={{ marginTop: verdict ? 8 : 0 }}>
              {colorisedDecision(indicator.decision2025)}
            </div>
          )}
          {!verdict && !indicator.decision2025 && !whatLastYearSubmitted && '-'}
          {indicator.score2025 != null && (
            <div style={{ marginTop: 8, color: TEXT_MUTED, fontSize: 11 }}>
              Score: <strong style={{ color: TEXT_BODY }}>{indicator.score2025}</strong>
              {indicator.max2026 != null && <> / {indicator.max2026}</>}
            </div>
          )}
          {/* Brief 13 v1.4.3 Task 2 - Path to Max subsection. Visually
              delineated from the "what we did last year" content by a
              subtle 1 px horizontal rule, with an aspect-coloured
              "PATH TO MAX" label, then the realistic-cycle summary on
              one line, then the gap-detail paragraph. Only renders
              when gapToMaxSummary is populated (i.e. action-needed
              and meaningful defending indicators); silently absent on
              retired / non-scored / parked entries - backward
              compatible. Markdown bold / italic inside gapToMaxDetail
              is rendered via the shared inlineMarkdown helper. */}
          {gapToMaxSummary && (
            <div style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10, fontWeight: 600,
                letterSpacing: 1.4, textTransform: 'uppercase',
                color: primary,
              }}>
                Path to max
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.45,
                color: '#ffffff',
              }}>
                {renderInlineMarkdown(gapToMaxSummary)}
              </div>
              {gapToMaxDetail && (
                <div style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#b8c5d3',
                }}>
                  {renderInlineMarkdown(gapToMaxDetail)}
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Panel 3 - What we need to do (numbered checklist or prose) */}
        <Panel header="What we need to do" icon={Target} primary={primary}>
          {checklist && checklist.length > 0 ? (
            <NumberedChecklist items={checklist} primary={primary} />
          ) : indicator.whatWeNeedToDo ? (
            indicator.whatWeNeedToDo
          ) : indicator.needed?.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {indicator.needed.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          ) : '-'}
        </Panel>

        {/* Panel 4 - Evidence required (with doc-type icon) */}
        <Panel header="Evidence required" icon={FileText} primary={primary}>
          {evidenceText ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {EvidenceIcon && (
                <EvidenceIcon size={14} style={{ flex: '0 0 14px', marginTop: 2, color: primary }} aria-hidden />
              )}
              <span>{evidenceText}</span>
            </div>
          ) : '-'}
          {validation && (
            <div style={{ marginTop: 6, color: TEXT_MUTED, fontSize: 11 }}>
              Validated: <strong style={{ color: TEXT_BODY }}>{validation}</strong>
            </div>
          )}
        </Panel>
      </div>

      {/* Brief 25 (v1.4) - Open questions strip. Sits below the
         4-panel grid, above the metadata footer. Amber-tinted,
         flagged as key questions for Westbrook (Chris ask 5 Jun r14 - the
         tool is ongoing Westbrook-facing chrome, not tied to one meeting). */}
      {openQuestions && openQuestions.length > 0 && (
        <OpenQuestionsStrip questions={openQuestions} />
      )}

      {/* Enhancement #8 - metadata footer.
         Owner in aspect colour; confidence + last-updated muted.
         Last-updated falls back to meta.lastUpdated when indicator
         doesn't carry its own timestamp. Renders only when at least
         one field has a value to surface. */}
      <MetadataFooter
        owner={indicator.owner}
        confidence={indicator.confidence}
        lastUpdated={indicator.lastUpdated || meta.lastUpdated}
        primary={primary}
      />
    </div>
  )
}

function Panel({ header, icon: Icon, primary, children }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.18)',
      borderRadius: 6,
      padding: '14px 16px',
    }}>
      {/* Enhancement #1 - lucide icon in panel header. 14px per brief,
         coloured to the aspect's primary so the four panels read as a
         single set on the aspect's palette. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 8,
      }}>
        {Icon && <Icon size={12} color={primary} strokeWidth={2.2} aria-hidden />}
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.6,
          color: primary,
        }}>{header}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12, lineHeight: 1.5,
        color: '#b8c5d3',
      }}>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Enhancement primitives                                              */
/* ------------------------------------------------------------------ */

/** #2 - verdict banner at top of Last Year panel. Coloured strip with
   solid bullet + uppercase verdict + monospace score. */
function VerdictBanner({ verdict, score }) {
  const tone = VERDICT_TONE[verdict.verdict] || { color: TEXT_MUTED, label: verdict.verdict.toUpperCase() }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px',
      borderRadius: 4,
      background: `color-mix(in srgb, ${tone.color} 18%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tone.color} 45%, transparent)`,
      fontFamily: 'var(--font-heading)',
      fontSize: 11, fontWeight: 600,
      letterSpacing: 0.5,
      color: TEXT_BODY,
      whiteSpace: 'nowrap',
      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      <span aria-hidden style={{
        display: 'inline-block',
        width: 8, height: 8, borderRadius: 999,
        background: tone.color,
        flex: '0 0 8px',
      }} />
      <span style={{ color: tone.color }}>{tone.label}</span>
      {score && (
        <>
          <span aria-hidden style={{ color: TEXT_MUTED, fontWeight: 400 }}>·</span>
          <span style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
            color: TEXT_BODY,
            fontVariantNumeric: 'tabular-nums',
          }}>{score}</span>
        </>
      )}
    </div>
  )
}

/** #3 - GRESB-tracked-issues chip grid (3–4 per row, 11px text, aspect
   outline). Renders below the What It Means prose.
   Brief 25 (v1.4): issues can now be plain strings (v1.3 shape) OR
   { label, peerPercent, ivgClaimed } objects. When peerPercent is
   present, the chip label reads "Label (NN%)". When ivgClaimed is
   true, the chip background fills with the aspect colour. */
function IssueChipGrid({ issues, primary, tint }) {
  return (
    <div style={{
      marginTop: 10,
      display: 'flex', flexWrap: 'wrap', gap: 6,
    }}>
      {issues.map((issue, i) => {
        const isObj = typeof issue === 'object' && issue !== null
        const label = isObj ? issue.label : issue
        const peerPct = isObj ? issue.peerPercent : null
        const ivgClaimed = isObj ? !!issue.ivgClaimed : false
        return (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px',
            borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${primary} 55%, transparent)`,
            background: ivgClaimed ? primary : tint,
            color: ivgClaimed ? '#0F1629' : TEXT_BODY,
            fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: ivgClaimed ? 600 : 500,
            letterSpacing: 0.1,
            whiteSpace: 'nowrap',
          }}>
            {label}
            {peerPct != null && (
              <span style={{
                fontFamily: 'ui-monospace, "JetBrains Mono", Consolas, monospace',
                fontSize: 10,
                opacity: ivgClaimed ? 0.85 : 0.65,
                fontVariantNumeric: 'tabular-nums',
              }}>{peerPct}%</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

/** Brief 25 (v1.4) - OPEN QUESTIONS FOR Westbrook strip. Sits below the
   4-panel grid inside the expanded card. Amber-tinted border-left
   over a darker panel, with HelpCircle icon-prefixed list items.
   Only renders when openQuestionsForIVG has at least one entry -
   draws explicit attention to anything the Westbrook board needs to
   confirm for the GRESB submission. (Chris ask 5 Jun r14: the tool
   is ongoing Westbrook-facing chrome, not tied to one meeting - copy
   reads as steady-state "key questions" rather than dated calls.) */
function OpenQuestionsStrip({ questions }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: '#1a1f2e',
      borderLeft: '3px solid #F5B048',
      borderRadius: '0 4px 4px 0',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10, fontWeight: 600,
        letterSpacing: 1.2, textTransform: 'uppercase',
        color: '#F5B048',
      }}>Key questions for Westbrook</div>
      <ul style={{
        margin: 0, padding: 0,
        listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {questions.map((q, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontFamily: 'var(--font-body)',
            fontSize: 12, lineHeight: 1.5,
            color: '#b8c5d3',
          }}>
            <HelpCircle size={14} style={{ flex: '0 0 14px', marginTop: 2, color: '#F5B048' }} aria-hidden />
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** #4 - numbered action checklist replacing prose for whatWeNeedToDo
   when whatWeNeedToDoChecklist is populated. Numbers in aspect colour. */
function NumberedChecklist({ items, primary }) {
  return (
    <ol style={{
      margin: 0, padding: 0,
      listStyle: 'none',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span aria-hidden style={{
            flex: '0 0 18px',
            fontFamily: 'var(--font-heading)',
            fontSize: 11, fontWeight: 700,
            color: primary,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: '18px',
          }}>{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

/** #7 - inline peer comparison strip. Each row: label · Westbrook status ·
   peer percent · 10-segment horizontal bar showing peer adoption. */
function PeerComparisonStrip({ rows, primary }) {
  return (
    <div style={{
      marginTop: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
      paddingTop: 10,
      borderTop: '1px dashed rgba(255,255,255,0.10)',
    }}>
      {rows.map((row, i) => {
        const pct = typeof row.peerPercent === 'number' ? Math.max(0, Math.min(100, row.peerPercent)) : null
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto 1fr',
            alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
          }}>
            <span style={{ color: TEXT_MUTED, whiteSpace: 'nowrap' }}>{row.label}:</span>
            <span style={{ color: primary, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Westbrook: {row.ivgStatus ?? '-'}
            </span>
            {pct != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  position: 'relative',
                  flex: 1, height: 6,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3, overflow: 'hidden',
                  minWidth: 60,
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${pct}%`,
                    background: primary,
                    opacity: 0.85,
                  }} />
                </span>
                <span style={{
                  color: TEXT_BODY,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  fontSize: 11,
                }}>Peer {pct}%</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** #8 - owner / confidence / last-updated metadata footer.
   Owner in aspect colour; confidence + date muted. Renders only when
   at least one field has a value. */
function MetadataFooter({ owner, confidence, lastUpdated, primary }) {
  if (!owner && !confidence && !lastUpdated) return null
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap',
      gap: 16, alignItems: 'baseline',
      paddingTop: 10,
      borderTop: `1px solid ${RULE_SUBTLE}`,
      fontFamily: 'var(--font-body)',
      fontSize: 10,
      color: TEXT_MUTED,
    }}>
      {owner && (
        <span>
          Owner:{' '}
          <strong style={{ color: primary, fontWeight: 600 }}>{owner}</strong>
        </span>
      )}
      {confidence && (
        <span>
          Confidence: <strong style={{ color: TEXT_BODY, fontWeight: 600 }}>{confidence}</strong>
        </span>
      )}
      {lastUpdated && (
        <span>
          Last updated:{' '}
          <strong style={{ color: TEXT_BODY, fontWeight: 600 }}>{formatDate(lastUpdated)}</strong>
        </span>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

/* ------------------------------------------------------------------ */
/*  Legend strip                                                        */
/* ------------------------------------------------------------------ */

function LegendStrip() {
  return (
    <div style={{
      display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
      paddingTop: 16,
      borderTop: `1px solid ${RULE_SUBTLE}`,
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      color: TEXT_MUTED,
    }}>
      <LegendItem
        swatch={<span style={{
          display: 'inline-block', width: 14, height: 14,
          border: '2px solid #8FA1B5', borderRadius: 3,
        }} />}
        label="Action needed (border in aspect colour)"
      />
      <LegendItem
        swatch={<span style={{
          display: 'inline-block', width: 14, height: 14,
          border: `1px solid ${RULE_SUBTLE}`, borderRadius: 3,
        }} />}
        label="Standard / defending / easy win"
      />
      <LegendItem
        swatch={<span style={{
          display: 'inline-block', width: 14, height: 14,
          border: '1px dashed #8FA1B5', borderRadius: 3,
          opacity: 0.5,
        }} />}
        label="Retired / parked / non-scored (click for explainer)"
      />
    </div>
  )
}

function LegendItem({ swatch, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {swatch}
      <span>{label}</span>
    </span>
  )
}
