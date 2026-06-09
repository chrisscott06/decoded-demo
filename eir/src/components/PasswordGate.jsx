/**
 * PasswordGate - client preview gate (Chris ask 8 Jun).
 *
 * Pattern lifted from nza-eoc-nzr's PasswordGate. Cream register to
 * match the Home page's visual register; IVG × NZA lockup rendered
 * bigger than the in-app TopNav lockup so the gate reads as a brand
 * splash, not nav chrome.
 *
 * sessionStorage gate - auth persists for the tab, clears on close.
 * No backend; password is in the bundle (acceptable for client
 * preview scope - it's a friction layer signalling "not public",
 * not real security).
 */
import { useState } from 'react'

const CORRECT_PASSWORD = 'NZA-ivg-2026'
const STORAGE_KEY = 'ivg-esg-auth'

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === 'true'
  )
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (authenticated) return children

  /* Mask-tinted logo span - same trick LogoLockup uses so we honour
     each SVG's silhouette but paint the colour ourselves (the IVG
     SVG ships with `fill="white"` and the NZA SVG with a grey fill;
     neither uses currentColor). */
  /* `position` arg parallels LogoLockup's v4 fix: each SVG has
     internal padding around its glyph; push IVG content to the
     right edge of its box and NZA content to the left edge so the
     × sits visually between the actual glyph edges, not the box
     edges. */
  const maskLogo = (url, w, h, position = 'center') => ({
    display: 'block',
    width: w, height: h,
    backgroundColor: 'var(--color-theme-base)',
    WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: position, maskPosition: position,
    WebkitMaskSize: 'contain', maskSize: 'contain',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-nza-cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Big IVG × NZA lockup - sized roughly 2× the in-app TopNav
            version so the gate reads as a brand splash. Chris ask
            8 Jun (v3): same correction as `LogoLockup` - the IVG
            box now matches the SVG's 1.589 aspect ratio (77 tall →
            122 wide) so the IVG content fills it edge-to-edge.
            Previous box (264×77) was letterboxing the IVG content
            to 122×77 and leaving ~70 px of dead padding each side.
            Visible IVG size unchanged; only the apparent gap to
            the × closes up. The marginLeft hack on the × is gone. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginBottom: 56,
        }}>
          <span role="img" aria-label="Inspired Villages Group"
            style={maskLogo('/ivg-logo.svg', 122, 77, 'right center')} />
          <span style={{
            color: 'var(--color-theme-base)',
            fontWeight: 300, fontSize: 36,
          }}>×</span>
          <span role="img" aria-label="Net Zero Advisory"
            style={maskLogo('/nza-logo-02.svg', 156, 48, 'left center')} />
        </div>

        {/* Heading + sub */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 28, fontWeight: 500,
          color: 'var(--color-theme-base)',
          textAlign: 'center',
          margin: '0 0 8px',
          lineHeight: 1.25,
        }}>
          IVG ESG Reporting Tool
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(26,36,64,0.55)',
          textAlign: 'center',
          margin: '0 0 32px',
        }}>
          Enter the preview password to continue.
        </p>

        {/* Password row */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false) }}
              placeholder="Password"
              autoFocus
              style={{
                flex: 1,
                background: '#FFFFFF',
                border: '1px solid rgba(26,36,64,0.15)',
                borderRadius: 6,
                padding: '12px 14px',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-theme-base)',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-nza-coral)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(26,36,64,0.15)'}
            />
            <button
              type="submit"
              style={{
                padding: '12px 22px',
                background: 'var(--color-nza-coral)',
                color: 'var(--color-nza-cream)',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Enter
            </button>
          </div>
          {error && (
            <p style={{
              color: '#C84444',
              fontSize: 12,
              margin: '10px 0 0',
              textAlign: 'center',
            }}>
              Incorrect password. Please try again.
            </p>
          )}
        </form>

        {/* Confidential note */}
        <p style={{
          fontSize: 10,
          color: 'rgba(26,36,64,0.32)',
          textAlign: 'center',
          margin: '40px 0 0',
          lineHeight: 1.5,
        }}>
          Confidential preview. Please do not share the link or password externally.
        </p>
      </div>
    </div>
  )
}
