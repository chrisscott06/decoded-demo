/**
 * Minimal inline markdown renderer - Brief 25.1 (BR-13 v1.4.1) Task 2.
 *
 * Supports only:
 *   `**text**` → <strong> in white   (emphasis on body-grey paragraphs)
 *   `*text*`   → <em> in muted grey  (de-emphasis / scope notes)
 *
 * No full markdown spec. Lives here so both Overview narrative and
 * Aspects narrative call the same helper.
 */

import { Fragment } from 'react'

const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g

export function renderInlineMarkdown(text) {
  if (text == null) return null
  const parts = String(text).split(TOKEN_RE)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#ffffff', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ color: '#6a7a8e', fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

/**
 * Render a narrative section.
 *
 * v1.4.1 schema: { heading, paragraphs, bullets, paragraphsAfterBullets }
 * v1.4.2 extension (BR-13 Task 2): also supports a SECOND interleaved
 * bullet block after the existing paragraphsAfterBullets:
 *   { ..., bulletsAfter, paragraphsAfterBulletsAfter }
 *
 * Both new fields are optional - sections that omit them render
 * exactly as v1.4.1 did. Used by the "How it's scored." section
 * which needs two bullet lists (components, then star bands)
 * interleaved with explanatory paragraphs.
 *
 * Caller provides the styling tokens. This keeps the renderer
 * surface-agnostic (works in Overview's narrative pane AND Aspects'
 * left column with their respective body/muted colours).
 */
export function NarrativeSection({
  section,
  /* Style overrides - all optional. Chris ask 5 Jun r12: "Text on
     the left is greyed out, it starts fading out" - actual measured
     overflow is false, so the perceived dimness comes from the body
     colour. Bumped from #b8c5d3 (slightly desaturated blue-grey) to
     #d4dbe5 - closer to the dashboard's white-ish text-on-dark
     tokens - so the narrative reads clearly without competing with
     the coral subsection headings. */
  headingColor = 'var(--color-nza-coral)',
  bodyColor = '#d4dbe5',
  bulletColor = 'var(--color-nza-coral)',
}) {
  if (!section) return null
  const {
    heading,
    paragraphs,
    bullets,
    paragraphsAfterBullets,
    bulletsAfter,
    paragraphsAfterBulletsAfter,
  } = section

  /* Shared style helpers so the original + interleaved blocks
     render identically. */
  const paragraphBlock = (arr, key) => (
    Array.isArray(arr) && arr.length > 0 && (
      <div key={key} style={{
        marginTop: 12,
        display: 'flex', flexDirection: 'column', gap: 12,
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        lineHeight: 1.5,
        color: bodyColor,
      }}>
        {arr.map((p, i) => (
          <p key={i} style={{ margin: 0 }}>{renderInlineMarkdown(p)}</p>
        ))}
      </div>
    )
  )

  const bulletBlock = (arr, key) => (
    Array.isArray(arr) && arr.length > 0 && (
      <ul key={key} style={{
        margin: '12px 0 0 0',
        padding: 0,
        listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 8,
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        lineHeight: 1.5,
        color: bodyColor,
      }}>
        {arr.map((b, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span aria-hidden style={{
              flex: '0 0 6px',
              width: 6, height: 6,
              borderRadius: 999,
              background: bulletColor,
              marginTop: 7,
            }} />
            <span>{renderInlineMarkdown(b)}</span>
          </li>
        ))}
      </ul>
    )
  )

  return (
    <section>
      {heading && (
        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-subsection-title)',
          fontWeight: 400,
          color: headingColor,
          margin: '0 0 12px 0',
          paddingBottom: 4,
          borderBottom: `1px solid ${headingColor}`,
          lineHeight: 'var(--text-subsection-title-lh)',
        }}>{heading}</h4>
      )}

      {/* First paragraph block has no top margin (sits flush against
          the heading); subsequent blocks share the 12 px gap helper. */}
      {Array.isArray(paragraphs) && paragraphs.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: 1.5,
          color: bodyColor,
        }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0 }}>{renderInlineMarkdown(p)}</p>
          ))}
        </div>
      )}

      {bulletBlock(bullets, 'bullets')}
      {paragraphBlock(paragraphsAfterBullets, 'parasAfterBullets')}
      {bulletBlock(bulletsAfter, 'bulletsAfter')}
      {paragraphBlock(paragraphsAfterBulletsAfter, 'parasAfterBulletsAfter')}
    </section>
  )
}
