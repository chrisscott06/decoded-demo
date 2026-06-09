/**
 * ErrorBoundary - catches render-time errors in its subtree and shows a
 * recoverable cream/dark-aware message instead of a blank page
 * (Brief 12 Part 4 - hardening against a repeat of the Brief 6 silent
 * white-screen).
 *
 * Usage: wrap a route's content. The boundary is per-instance: a failure
 * in Site Detail won't take out the Insights routes. Recovery is via tab
 * switch or refresh.
 *
 * Must be a class component - React error boundaries cannot be hooks-based.
 */

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Surface to the dev console so the developer sees a stack trace; the
    // recoverable UI below is what the user sees.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.scope || 'unscoped', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isCream = this.props.theme === 'cream' || this.props.theme == null
    return (
      <div
        className="error-boundary-card"
        role="alert"
        style={{
          maxWidth: 560,
          margin: '48px auto',
          padding: '24px 28px',
          background: isCream
            ? 'var(--panel-bg-on-cream)'
            : 'var(--panel-bg-on-dark)',
          border: `1px solid ${isCream ? 'var(--panel-border-on-cream)' : 'var(--panel-border-on-dark)'}`,
          borderRadius: 'var(--panel-radius)',
          color: isCream ? 'var(--text-on-cream)' : 'var(--text-on-dark)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 18,
            color: isCream ? 'var(--text-on-cream)' : 'var(--text-on-dark)',
            marginBottom: 8,
          }}
        >
          This view couldn’t load.
        </div>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            color: isCream ? 'var(--text-muted-on-cream)' : 'var(--text-muted-on-dark)',
            margin: '0 0 16px',
          }}
        >
          Something unexpected went wrong rendering this section. Try another tab,
          or refresh the page. The error has been logged to the console for
          investigation.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1px solid var(--color-nza-coral)',
              background: 'var(--color-nza-coral)',
              color: 'var(--color-nza-cream)',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: `1px solid ${isCream ? 'rgba(31, 51, 40,0.2)' : 'rgba(243, 239, 227,0.2)'}`,
              background: 'transparent',
              color: isCream ? 'var(--text-on-cream)' : 'var(--text-on-dark)',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
        {import.meta.env?.DEV && this.state.error && (
          <pre
            style={{
              marginTop: 16,
              padding: '10px 12px',
              background: isCream
                ? 'rgba(0,0,0,0.04)'
                : 'rgba(255,255,255,0.04)',
              borderRadius: 4,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: isCream ? 'var(--text-muted-on-cream)' : 'var(--text-muted-on-dark)',
              overflow: 'auto',
              maxHeight: 160,
              whiteSpace: 'pre-wrap',
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
        )}
      </div>
    )
  }
}
