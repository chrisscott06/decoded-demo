/**
 * PasswordGate — demo-template preview gate.
 *
 * Pattern lifted from nza-eoc-nzr's PasswordGate. Cream register to
 * match the Home page's visual register; Trust wordmark × NZA lockup
 * rendered bigger than the in-app TopNav lockup so the gate reads as
 * a brand splash, not nav chrome.
 *
 * sessionStorage gate — auth persists for the tab, clears on close.
 * No backend; password is in the bundle (acceptable for demo scope —
 * it's a friction layer signalling "sample data, not public," not
 * real security).
 */
import { useState } from 'react'

const CORRECT_PASSWORD = 'demo'
const STORAGE_KEY = 'westbrook-demo-auth'

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

  /* NZA logo stays as a mask-tinted SVG (the SVG ships with a grey
     fill and doesn't use currentColor). The Trust wordmark is typeset
     directly in the heading font. */
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
        {/* Big Trust wordmark × NZA lockup — gate reads as a brand splash. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginBottom: 56,
        }}>
          <span
            role="img"
            aria-label="Westbrook Academies Trust"
            style={{
              color: 'var(--color-theme-base)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: '0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              height: 48,
            }}
          >
            Westbrook Academies Trust
          </span>
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
          Westbrook Trust ESG Reporting Tool — Demo
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(31, 51, 40,0.55)',
          textAlign: 'center',
          margin: '0 0 32px',
        }}>
          Enter the demo password to continue.
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
                border: '1px solid rgba(31, 51, 40,0.15)',
                borderRadius: 6,
                padding: '12px 14px',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-theme-base)',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-nza-coral)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(31, 51, 40,0.15)'}
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

        {/* Demo footer note. */}
        <p style={{
          fontSize: 10,
          color: 'rgba(31, 51, 40,0.32)',
          textAlign: 'center',
          margin: '40px 0 0',
          lineHeight: 1.5,
        }}>
          Sample report, fictional data, for demonstration only.<br />
          Not affiliated with any real Academy Trust.
        </p>
      </div>
    </div>
  )
}
