/**
 * Brief 20 (BR-13) Task 2 - GRESB atomic component library.
 *
 * Ten reusable primitives consumed by the /gresb routes:
 *   <IndicatorBadge code="LE2" />
 *   <AspectBadge code="LE" variant="management|performance|residential" />
 *   <StatusPill status="In place|At risk|Missing|Not applicable" />
 *   <ConfidencePill level="H|M|L" />
 *   <StarRating count={2} max={5} />
 *   <ScoreRangeBar score2025={52} floor={45} ceiling={79} target={62} />
 *   <ProgressMiniBar value={3.75} ceiling={5.00} max={5} score2025={6.83} />
 *   <EvidenceItem name="..." validUntil="2026-12-31" url={null} />
 *   <RetiredBadge />
 *   <ParkedBadge label="Parked → 2027" />
 *
 * Tuned for the Westbrook tool's dark register. No new dependencies - uses
 * lucide-react (already in package.json from Brief 8) and CSS
 * gradients for the bar (no chart lib needed per brief Principle 4).
 * Visual style follows Appendix B; GRESB-specific tokens declared in
 * index.css.
 */

import {
  Star, Check, AlertTriangle, X as XIcon, Info, ExternalLink, Calendar,
} from 'lucide-react'

/* ---------- shared style helpers ---------- */

const PILL_BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  borderRadius: 999,
  fontFamily: 'var(--font-heading)',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: 0.2,
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
  padding: '2px 8px',
}

const MONO_PILL_BASE = {
  ...PILL_BASE,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontWeight: 600,
  letterSpacing: 0.3,
}

/* ---------- IndicatorBadge ---------- */
/* e.g. "LE2" - monospace pill with teal accents. Consumed wherever an
   indicator code is referenced in copy or rows. */
export function IndicatorBadge({ code }) {
  return (
    <span style={{
      ...MONO_PILL_BASE,
      background: 'color-mix(in srgb, var(--gresb-teal-500) 18%, transparent)',
      color: 'var(--gresb-teal-500)',
      border: '1px solid color-mix(in srgb, var(--gresb-teal-500) 35%, transparent)',
    }}>{code}</span>
  )
}

/* ---------- AspectBadge ---------- */
/* e.g. "LE" with band variant. Same shape as IndicatorBadge but coloured
   by component band per Appendix B (Management = teal, Performance =
   NZA blue, Residential = green). */
const ASPECT_BAND_COLOR = {
  management:  'var(--gresb-band-management)',
  performance: 'var(--gresb-band-performance)',
  residential: 'var(--gresb-band-residential)',
}
export function AspectBadge({ code, variant = 'management' }) {
  const tint = ASPECT_BAND_COLOR[variant] || ASPECT_BAND_COLOR.management
  return (
    <span style={{
      ...MONO_PILL_BASE,
      background: `color-mix(in srgb, ${tint} 18%, transparent)`,
      color: tint,
      border: `1px solid color-mix(in srgb, ${tint} 35%, transparent)`,
    }}>{code}</span>
  )
}

/* ---------- StatusPill ---------- */
/* "In place" / "At risk" / "Missing" / "Not applicable" - icon + label.
   Status colours reuse the existing Westbrook risk-token palette so the
   visual language stays consistent with the rest of the tool. */
const STATUS_META = {
  'In place':        { icon: Check,          color: 'var(--color-risk-low)'      },
  'At risk':         { icon: AlertTriangle,  color: 'var(--color-risk-moderate)' },
  'Missing':         { icon: XIcon,          color: 'var(--color-risk-major)'    },
  'Not applicable':  { icon: Info,           color: 'var(--text-muted-on-dark)'  },
}
export function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META['Missing']
  const Icon = meta.icon
  return (
    <span style={{
      ...PILL_BASE,
      background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
      color: meta.color,
      border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
      gap: 5,
    }}>
      <Icon size={12} strokeWidth={2.5} aria-hidden />
      <span>{status}</span>
    </span>
  )
}

/* ---------- ConfidencePill ---------- */
/* Single-letter H / M / L pill. Smallest of the pills - sits inline in
   indicator rows + aspect cards. */
const CONFIDENCE_META = {
  H: { color: 'var(--color-risk-low)',      label: 'High' },
  M: { color: 'var(--color-risk-moderate)', label: 'Medium' },
  L: { color: 'var(--color-risk-major)',    label: 'Low' },
}
export function ConfidencePill({ level }) {
  const meta = CONFIDENCE_META[level]
  if (!meta) {
    return (
      <span style={{
        ...PILL_BASE,
        padding: '1px 6px',
        fontSize: 10,
        background: 'transparent',
        color: 'var(--text-muted-on-dark)',
        border: '1px solid var(--rule-on-dark)',
      }} title="Confidence not set">-</span>
    )
  }
  return (
    <span
      title={`${meta.label} confidence`}
      style={{
        ...PILL_BASE,
        padding: '1px 6px',
        fontSize: 10,
        background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
        color: meta.color,
        border: `1px solid color-mix(in srgb, ${meta.color} 35%, transparent)`,
        minWidth: 16,
        justifyContent: 'center',
      }}>{level}</span>
  )
}

/* ---------- StarRating ---------- */
/* lucide-react Star icons. Filled count out of max. Solid filled per
   GRESB convention (Chris answer 4 Jun); tint via the GRESB teal. */
export function StarRating({ count = 0, max = 5, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < count
        return (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            fill={filled ? 'var(--gresb-teal-500)' : 'none'}
            stroke={filled ? 'var(--gresb-teal-500)' : 'var(--text-muted-on-dark)'}
            aria-hidden
          />
        )
      })}
    </span>
  )
}

/* ---------- ScoreRangeBar ---------- */
/* Brief 19.5 Element 3: full-width 0-100 horizontal score bar segmented
   at star thresholds (30 / 50 / 60 / 75 / 90), gradient amber-to-teal.
   Overlays:
     - vertical line + dot at score2025 ("2025")
     - shaded band from floor to ceiling ("2026 forecast range")
     - flag at target ("Target {N}-star")
     - star thresholds labelled below the bar */
const STAR_THRESHOLDS = [
  { name: '1★', x: 30 },
  { name: '2★', x: 50 },
  { name: '3★', x: 60 },
  { name: '4★', x: 75 },
  { name: '5★', x: 90 },
]
export function ScoreRangeBar({
  score2025, floor, ceiling, target,
  targetStar, height = 18,
}) {
  /* Clamp values to 0-100 just in case */
  const clamp = (n) => Math.max(0, Math.min(100, n))
  const has2025 = typeof score2025 === 'number'
  const hasFloor = typeof floor === 'number'
  const hasCeiling = typeof ceiling === 'number'
  const hasTarget = typeof target === 'number'
  const bandLeft = hasFloor ? clamp(floor) : null
  const bandRight = hasCeiling ? clamp(ceiling) : null
  const bandWidth = bandLeft != null && bandRight != null ? bandRight - bandLeft : 0
  return (
    <div style={{ width: '100%' }}>
      {/* The bar */}
      <div style={{ position: 'relative', height, marginBottom: 28 }}>
        {/* Track + gradient fill */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          borderRadius: 999,
          background: 'linear-gradient(to right, var(--color-risk-major) 0%, var(--color-risk-moderate) 30%, var(--gresb-teal-500) 60%, var(--gresb-teal-700) 100%)',
          opacity: 0.35,
          border: '1px solid var(--rule-on-dark)',
        }} />
        {/* Forecast band (floor → ceiling) */}
        {bandWidth > 0 && (
          <div title={`2026 forecast range ${floor} – ${ceiling}`} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${bandLeft}%`, width: `${bandWidth}%`,
            borderRadius: 999,
            background: 'color-mix(in srgb, var(--gresb-teal-500) 35%, transparent)',
            border: '1px solid color-mix(in srgb, var(--gresb-teal-500) 65%, transparent)',
          }} />
        )}
        {/* 2025 score - vertical line + dot */}
        {has2025 && (
          <div title={`2025 score ${score2025}`} style={{
            position: 'absolute', top: -4, bottom: -4,
            left: `${clamp(score2025)}%`, width: 2,
            transform: 'translateX(-1px)',
            background: 'var(--color-theme-body)',
          }}>
            <div style={{
              position: 'absolute', top: -4, left: -3,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-theme-body)',
            }} />
          </div>
        )}
        {/* Target flag */}
        {hasTarget && (
          <div title={`Target ${target}${targetStar ? ` (${targetStar}-star)` : ''}`} style={{
            position: 'absolute', top: -10, bottom: -10,
            left: `${clamp(target)}%`,
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '7px solid var(--color-nza-coral)',
              marginBottom: -1,
            }} />
            <div style={{ width: 2, flex: 1, background: 'var(--color-nza-coral)' }} />
          </div>
        )}
        {/* Star threshold ticks under the bar */}
        {STAR_THRESHOLDS.map((t) => (
          <div key={t.name} style={{
            position: 'absolute', top: '100%', left: `${t.x}%`,
            transform: 'translateX(-50%)',
            marginTop: 6,
            fontFamily: 'var(--font-body)', fontSize: 10,
            color: 'var(--text-muted-on-dark)',
            whiteSpace: 'nowrap',
          }}>{t.name} {t.x}</div>
        ))}
      </div>
    </div>
  )
}

/* ---------- ProgressMiniBar ---------- */
/* Per-aspect mini bar for the 15-aspect grid. Shows last-year score +
   this-year floor-to-ceiling forecast range vs the aspect's max. */
export function ProgressMiniBar({ value, ceiling, max, score2025 }) {
  if (!max || max <= 0) {
    return <span style={{ color: 'var(--text-muted-on-dark)', fontSize: 11 }}>-</span>
  }
  const clamp = (n) => Math.max(0, Math.min(100, (n / max) * 100))
  const has2025 = typeof score2025 === 'number'
  const floorPct = typeof value === 'number' ? clamp(value) : 0
  const ceilPct  = typeof ceiling === 'number' ? clamp(ceiling) : floorPct
  const bandWidth = Math.max(0, ceilPct - floorPct)
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--rule-on-dark)' }}>
      {bandWidth > 0 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${floorPct}%`, width: `${bandWidth}%`,
          background: 'color-mix(in srgb, var(--gresb-teal-500) 50%, transparent)',
        }} />
      )}
      {has2025 && (
        <div title={`2025 score ${score2025}`} style={{
          position: 'absolute', top: -2, bottom: -2,
          left: `${clamp(score2025)}%`, width: 2,
          transform: 'translateX(-1px)',
          background: 'var(--color-nza-coral)',
        }} />
      )}
    </div>
  )
}

/* ---------- EvidenceItem ---------- */
/* Single line: name + valid-until date + optional outbound link icon.
   Read-only in Phase 1 - Phase 3 will make the name clickable to open
   the linked document. */
export function EvidenceItem({ name, validUntil, url }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0',
      borderBottom: '1px dashed var(--rule-on-dark)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--color-theme-body)',
    }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      {validUntil && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11,
          color: 'var(--text-muted-on-dark)',
        }}>
          <Calendar size={11} strokeWidth={2} aria-hidden />
          <span>valid → {validUntil}</span>
        </span>
      )}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center',
          color: 'var(--gresb-teal-500)',
          textDecoration: 'none',
        }}>
          <ExternalLink size={12} strokeWidth={2} aria-label="Open evidence" />
        </a>
      )}
    </div>
  )
}

/* ---------- RetiredBadge ---------- */
export function RetiredBadge({ year = 2026 }) {
  return (
    <span style={{
      ...PILL_BASE,
      background: 'rgba(255, 255, 255, 0.06)',
      color: 'var(--text-muted-on-dark)',
      border: '1px solid var(--rule-on-dark)',
      fontSize: 10,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    }}>Retired {year}</span>
  )
}

/* ---------- ParkedBadge ---------- */
export function ParkedBadge({ label = 'Parked → 2027' }) {
  return (
    <span style={{
      ...PILL_BASE,
      background: 'color-mix(in srgb, var(--color-risk-moderate) 15%, transparent)',
      color: 'var(--color-risk-moderate)',
      border: '1px solid color-mix(in srgb, var(--color-risk-moderate) 35%, transparent)',
      fontSize: 10,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    }}>{label}</span>
  )
}
