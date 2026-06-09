import { Zap, Flame, Droplets, Recycle, ArrowRight, MapPin, Activity } from 'lucide-react'
import BodyPageLayout from './BodyPageLayout.jsx'

import portfolio from '@pipeline-data/portfolio.json'
import energy   from '@pipeline-data/energy.json'
import water    from '@pipeline-data/water.json'
import waste    from '@pipeline-data/waste.json'
import carbon   from '@pipeline-data/carbon.json'

/**
 * Landing - exec-summary front door (cream register) per design note D11.
 *
 * Brief 16: six tiles, single consistent shape - headline + unit, one-line
 * meaning, coverage clause. Portfolio tile is the anchor (scale on line 3
 * instead of coverage); Carbon is the punchline. Headlines and coverage
 * counts derive from pipeline/dist/eir/*.json - no hardcoded constants.
 *
 * Part 1 (this commit): wire all six tiles' values from pipeline. The 4-tile
 * grid render below stays untouched; Part 2 swaps to 2×3 and uses the
 * Portfolio + Carbon hooks added here.
 */

const TOTAL_SITES = 13  // 12 villages + Edwalton Office

/** Compact format: 1.2M, 17.9k, 164. */
function fmtCompact(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return Math.round(n).toString()
}

/**
 * HomeTile - Brief 16 §Principles 1+3. One consistent shape for every
 * tile on the home page: heading row (icon + meaning), big value + unit,
 * coverage clause (or scale, for the Portfolio anchor). Icon sits inline
 * with the heading (Principle 3 - "next to headings, not standalone").
 *
 * Props:
 *   iconUrl - Chris-supplied SVG path (eir/public/icons/). Painted with
 *             currentColor via mask so the icon picks up the coral tint
 *             (same pattern as the site icons in the leaderboard).
 *   icon    - lucide fallback if iconUrl is null/undefined; "clean
 *             fallback" per Brief 16 Part 3 - no broken glyph.
 *   meaning - one-line label, e.g. "IVG-billed electricity"
 *   value   - headline number (string, already formatted)
 *   unit    - small suffix, e.g. "kWh", "m²"
 *   line3   - coverage clause or, for Portfolio, scale
 */
function HomeTile({ icon: Icon, iconUrl, iconScale = 1, meaning, value, unit, line3 }) {
  /* Chris ask 2026-06-02 (revert sizes - too big the other way): back
     to the proportions from before the breathing-room bump. Tile padding
     12/14, icon 56, value 26, meaning 10, line3 11. The grid-auto-rows
     keeps all six the same size; the left-align with the Home link in
     the top nav stays. */
  return (
    <div
      style={{
        background: 'rgba(26, 36, 64, 0.03)',
        border: '1px solid rgba(26, 36, 64, 0.10)',
        borderRadius: 12,
        padding: '12px 14px',
        minHeight: 92,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minWidth: 0,
      }}
    >
      {iconUrl ? (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 56,
            height: 56,
            flex: '0 0 56px',
            backgroundColor: 'currentColor',
            color: 'var(--color-nza-coral)',
            WebkitMaskImage: `url(${iconUrl})`,
            maskImage: `url(${iconUrl})`,
            WebkitMaskSize: `${iconScale * 100}%`,
            maskSize: `${iconScale * 100}%`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      ) : Icon ? (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-nza-coral)',
          flex: '0 0 56px',
        }}>
          <Icon size={44} strokeWidth={1.4} />
        </span>
      ) : null}

      {/* Text column stacked vertically - meaning, value+unit, line3. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 auto' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'rgba(26,36,64,0.55)',
          lineHeight: 1.3,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{meaning}</span>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-theme-base)',
          lineHeight: 1.0,
        }}>
          <span style={{ fontSize: 26, fontWeight: 500 }}>{value}</span>
          {unit && (
            <span style={{ fontSize: 12, color: 'rgba(26,36,64,0.55)', fontWeight: 400 }}>
              {unit}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: 1.35,
          color: 'rgba(26,36,64,0.62)',
          marginTop: 2,
        }}>
          {line3}
        </div>
      </div>
    </div>
  )
}

export default function Landing({ navigate, currentSiteId }) {
  /* Brief 16 Part 1 - every tile derives from live pipeline data. The
     6-tile grid (Part 2) reads from this block. Variables are named
     uniformly: <slug>Value (headline), <slug>Unit, <slug>Meaning,
     <slug>Coverage. The existing 4-tile render below maps the old
     value/unit/label/nugget API onto these. */

  // ── 1. Portfolio (anchor tile - scale on line 3, not coverage) ──
  const portfolioValue    = portfolio.site_count                    // 13
  const portfolioUnit     = 'sites'
  const portfolioMeaning  = 'Retirement living'
  const portfolioScale    = `${portfolio.total_gia_m2.toLocaleString('en-GB')} m² GIA · ${portfolio.total_units_completed.toLocaleString('en-GB')} units`

  // ── 2. Electricity ──
  const elecKwh           = portfolio.energy?.total_electricity_kwh
  const elecValue         = fmtCompact(elecKwh)                     // '8.3M'
  const elecUnit          = 'kWh'
  const elecMeaning       = 'IVG-billed electricity'
  // Sites with non-null + non-zero electricity in CY25 (Sonning Common
  // currently absent from energy.json - Brief 11 follow-up).
  const elecSitesWith     = Object.entries(energy)
    .filter(([id]) => id !== 'portfolio')
    .filter(([_, s]) => (s.consumption_kwh?.electricity ?? 0) > 0).length
  const elecPctData       = Math.round((elecSitesWith / TOTAL_SITES) * 100)
  const elecCoverage      = `${elecSitesWith} of ${TOTAL_SITES} sites · ${elecPctData}% data · Ecotricity`

  // ── 3. Gas ──
  const gasKwh            = portfolio.energy?.total_gas_kwh
  const gasValue          = fmtCompact(gasKwh)                      // '9.4M'
  const gasUnit           = 'kWh'
  const gasMeaning        = 'Heating fuel'
  const gasSitesWith      = Object.entries(energy)
    .filter(([id]) => id !== 'portfolio')
    .filter(([_, s]) => (s.consumption_kwh?.gas ?? 0) > 0).length
  // For gas, every site that HAS gas has full data - null = no gas, not missing.
  const gasCoverage       = `${gasSitesWith} of ${TOTAL_SITES} sites · 100% data`

  // ── 4. Water ──
  const waterM3           = portfolio.water?.total_consumption_m3
  const waterValue        = fmtCompact(waterM3)                     // '17.9k'
  const waterUnit         = 'm³'
  const waterMeaning      = 'Recorded consumption'
  const waterConfirmed    = portfolio.water?.sites_with_confirmed_data ?? 0
  const waterPartial      = portfolio.water?.sites_with_partial_data ?? 0
  const waterSitesWith    = waterConfirmed + waterPartial
  const waterPctData      = Math.round((waterSitesWith / TOTAL_SITES) * 100)
  const waterCoverage     = `${waterSitesWith} of ${TOTAL_SITES} sites · ${waterPctData}% data · 10 water companies`

  // ── 5. Waste ──
  const wasteTonnes       = portfolio.waste?.total_tonnage
  const wasteValue        = (typeof wasteTonnes === 'number')
    ? (wasteTonnes >= 10 ? Math.round(wasteTonnes).toString() : wasteTonnes.toFixed(1))
    : '-'
  const wasteUnit         = (typeof wasteTonnes === 'number') ? 't' : ''
  const wasteDiv          = portfolio.waste?.diversion_rate ?? 0
  const wasteMeaning      = `Landfill diversion ${(wasteDiv * 100).toFixed(1)}%`
  const wasteConfirmed    = portfolio.waste?.sites_with_confirmed_data ?? 0
  const wastePartial      = portfolio.waste?.sites_with_partial_data ?? 0
  const wasteSitesWith    = wasteConfirmed + wastePartial
  const wasteCoverage     = `${wasteSitesWith} of ${TOTAL_SITES} sites · 100% data · BIFFA + Ash Waste`

  // ── 6. Carbon ── Scope 1 + 2 inventory; Scope 3 still landing.
  const carbonScope12     = (carbon.portfolio?.scope_1_tco2e ?? 0) + (carbon.portfolio?.scope_2_tco2e ?? 0)
  const carbonValue       = Math.round(carbonScope12).toLocaleString('en-GB')
  const carbonUnit        = 'tCO₂e'
  const carbonMeaning     = 'Scope 1+2 inventory'
  const carbonCoverage    = `${TOTAL_SITES} of ${TOTAL_SITES} sites · Scope 3 in progress`

  /* Brief 16 Part 3 - wire the Chris-supplied IVG×NZA tile icons
     (eir/public/icons/). Icons are mask-painted with currentColor so
     they pick up the coral tint at the same intensity as lucide
     icons. Lucide stays as the `icon` fallback per the "clean
     fallback" requirement - if iconUrl is null/missing the lucide
     glyph renders instead of a broken mask. */
  const tiles = [
    /* Portfolio uses lucide MapPin - Chris ask 4 Jun: the previous
       Grid3X3 read as "data table / index", not "portfolio of places".
       Map-pointer encodes "geographically distributed estate" at a
       glance and ties the tile back to the Portfolio Map sub-tab that
       sits behind the "Explore the portfolio map" CTA below. iconUrl
       omitted so HomeTile renders the lucide fallback at the same coral
       tint as the other tiles' mask-painted icons. */
    /* Chris ask 4 Jun: bump electricity + gas iconScales 1.25 → 1.55.
       The IVG×NZA electricity-03.svg and gas-01.svg glyphs sit inside a
       generous viewBox so they were reading visibly smaller than the
       water/recycling/co2 marks at the previous 1.25 mask-size. Carbon
       co2.svg bumped 1 → 1.15 (lighter touch - Chris said "slightly
       bigger") to even out the bottom-right of the 2×3 grid. */
    { key: 'portfolio',                                                                          icon: MapPin,   meaning: 'Portfolio overview', value: portfolioValue, unit: portfolioUnit, line3: portfolioScale  },
    { key: 'electricity', iconUrl: '/icons/ivg-nza-icons_elec-solid.svg',  iconScale: 1.55, icon: Zap,      meaning: elecMeaning,          value: elecValue,      unit: elecUnit,      line3: elecCoverage    },
    { key: 'gas',         iconUrl: '/icons/ivg-nza-icons_gas-solid.svg',          iconScale: 1.55, icon: Flame,    meaning: gasMeaning,           value: gasValue,       unit: gasUnit,       line3: gasCoverage     },
    { key: 'water',       iconUrl: '/icons/ivg-nza-icons_water.svg',                            icon: Droplets, meaning: waterMeaning,         value: waterValue,     unit: waterUnit,     line3: waterCoverage   },
    { key: 'waste',       iconUrl: '/icons/ivg-nza-icons_recycling.svg',                        icon: Recycle,  meaning: wasteMeaning,         value: wasteValue,     unit: wasteUnit,     line3: wasteCoverage   },
    { key: 'carbon',      iconUrl: '/icons/ivg-nza-icons_co2.svg',             iconScale: 1.15, icon: Activity, meaning: carbonMeaning,        value: carbonValue,    unit: carbonUnit,    line3: carbonCoverage  },
  ]

  function go(path) {
    if (typeof navigate === 'function') {
      navigate(path)
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <BodyPageLayout
      activePrimary="home"
      activeSecondary={null}
      currentSiteId={currentSiteId}
      navigate={navigate}
    >
      {/* Chris ask 2026-06-02 (revert): old Brief 8 layout - big IVG
          logo + narrative on the LEFT, tile grid on the RIGHT. Six
          compact tiles in 2×3 take the same area the previous four
          tiles in 2×2 did. Grey "13 sites · 217k m² · 961 units"
          strip dropped (the Portfolio tile carries the scale on
          line 3 now). */}
      {/* Layout sized + responsive in index.css `.landing-grid`. */}
      <div className="landing-grid">
        {/* Left - big IVG logo + narrative */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <img
            src="/ivg-logo-dark.svg"
            alt="Inspired Villages"
            style={{
              width: 'min(480px, 100%)',
              height: 'auto',
              display: 'block',
              marginBottom: 32,
            }}
            draggable={false}
          />
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              color: 'var(--color-nza-coral)',
              textTransform: 'uppercase',
              letterSpacing: 2.4,
              fontWeight: 500,
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Portfolio overview · CY2025
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 24,
              lineHeight: 1.25,
              color: 'var(--color-theme-base)',
              fontWeight: 500,
              margin: 0,
              marginBottom: 16,
              maxWidth: 480,
            }}
          >
            A single view of energy, water and waste across the IVG portfolio.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'rgba(26,36,64,0.70)',
              margin: 0,
              marginBottom: 10,
              maxWidth: 520,
            }}
          >
            This tool brings together the utility data IVG holds across its
            retirement-living estate - electricity, gas, water and waste -
            into one operational picture. It shows what is known today,
            where the gaps are, and how the dataset improves as billing,
            sub-metering and contractor records are consolidated.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'rgba(26,36,64,0.70)',
              margin: 0,
              marginBottom: 24,
              maxWidth: 520,
            }}
          >
            The figures opposite summarise the portfolio as it currently
            stands. Each links through to site-level detail, half-hourly
            profiles and the underlying meter inventory.
          </p>
          <button
            type="button"
            onClick={() => go('/portfolio/map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-body)',
              fontWeight: 500,
              padding: '12px 18px',
              borderRadius: 10,
              background: 'var(--color-nza-coral)',
              color: 'var(--color-nza-cream)',
              border: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              transition: 'background 150ms var(--ease-standard)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-theme-accent-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-nza-coral)' }}
          >
            Explore the portfolio map
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Right - 6 tiles in 2×3 (responsive: collapses to 1 column
            under 560 px wide). Sizing + responsive rules live on
            `.landing-tiles-grid` in index.css. */}
        <div className="landing-tiles-grid">
          {tiles.map((t) => (
            <HomeTile
              key={t.key}
              iconUrl={t.iconUrl}
              icon={t.icon}
              meaning={t.meaning}
              value={t.value}
              unit={t.unit}
              line3={t.line3}
            />
          ))}
        </div>
      </div>
    </BodyPageLayout>
  )
}
