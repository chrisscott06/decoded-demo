import { useState, useMemo } from 'react'
import { Zap, Activity, BarChart3, TrendingDown, Grid3x3, ShieldCheck } from 'lucide-react'

import OverviewView from './views/OverviewView.jsx'
import TimeSeriesView from './views/TimeSeriesView.jsx'
import DailyProfileView from './views/DailyProfileView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import DurationCurveView from './views/DurationCurveView.jsx'
import HeatMapView from './views/HeatMapView.jsx'
import DataQualityView from './views/DataQualityView.jsx'

/**
 * LoadInspector - Brief 11 Tier 2 port of the PABLO Load Inspector.
 *
 * Six brief-mandated views + Data Quality (no Weather, no
 * Assembly-Provenance card). All views read from a pre-aggregated
 * per-MPAN JSON shape (see pipeline/readers/read_half_hourly.py output).
 *
 * Props:
 *   data   - the per-MPAN JSON: { hh_data, stats, monthly, daily_profile,
 *            start_date, end_date, mpan, meter_label, site_id, ... }
 *   meterLabel - fallback label string (used by header)
 */

/* Brief 24 Part 4 - trim 7 sub-tabs → 5. Monthly folds into Overview
   (bars there now); Data quality moves to the Metering & data quality
   combined page. Naming switches Sentence case ("Time series", "Daily
   profile", "Duration curve", "Heat map") per brief Part 4 spec. */
const VIEWS = [
  { id: 'overview',  label: 'Overview',       Icon: Activity },
  { id: 'timeseries', label: 'Time series',   Icon: Zap },
  { id: 'daily',     label: 'Daily profile',  Icon: BarChart3 },
  { id: 'duration',  label: 'Duration curve', Icon: TrendingDown },
  { id: 'heatmap',   label: 'Heat map',       Icon: Grid3x3 },
]

export default function LoadInspector({ data, meterLabel }) {
  const [view, setView] = useState('overview')

  const ctx = useMemo(() => ({
    hhData: data?.hh_data || [],
    startDate: data?.start_date || '2025-01-01',
    endDate: data?.end_date || data?.start_date,
    stats: data?.stats || {},
    monthly: data?.monthly || {},
    dailyProfile: data?.daily_profile || {},
    intervalHours: data?.interval_hours || 0.5,
    yearsCovered: data?.years_covered || 1,
  }), [data])

  if (!data || !data.hh_data?.length) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(26,36,64,0.55)',
      }}>
        No half-hourly data for this meter.
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case 'overview':   return <OverviewView ctx={ctx} />
      case 'timeseries': return <TimeSeriesView ctx={ctx} />
      case 'daily':      return <DailyProfileView ctx={ctx} />
      case 'monthly':    return <MonthlyView ctx={ctx} />
      case 'duration':   return <DurationCurveView ctx={ctx} />
      case 'heatmap':    return <HeatMapView ctx={ctx} />
      case 'quality':    return <DataQualityView ctx={ctx} />
      default:           return null
    }
  }

  return (
    /* Chris ask (post-Brief-15): fill the vertical space - no gap
       between the chart's X-axis and the Sycous strip below. Outer
       container is now flex column at height:100% so the active-view
       slot below the tab bar can grow with `flex: 1`. The parent
       (SiteEnergy Panel with fullHeight) provides the resolved
       pixel height that lets this chain settle (Brief 13 Rule 10). */
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      height: '100%',
      minHeight: 0,
    }}>
      {/* Header: meter label + date range + period count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(26,36,64,0.08)',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--color-nza-coral)',
            fontWeight: 500,
          }}>
            Half-hourly
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--color-theme-base)',
            marginTop: 2,
          }}>
            {meterLabel || data.meter_label || data.mpan}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'rgba(26,36,64,0.55)',
        }}>
          {ctx.startDate} → {ctx.endDate} · {ctx.stats.period_count?.toLocaleString('en-GB')} periods · {ctx.yearsCovered.toFixed(2)} yr
        </div>
      </div>

      {/* Tab bar */}
      <div role="tablist" aria-label="Load Inspector view" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        padding: 3,
        background: 'rgba(26,36,64,0.04)',
        borderRadius: 6,
      }}>
        {VIEWS.map((v) => {
          const isActive = view === v.id
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setView(v.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                background: isActive ? 'var(--color-nza-cream)' : 'transparent',
                color: isActive ? 'var(--color-nza-coral)' : 'rgba(26,36,64,0.7)',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
              }}
            >
              <v.Icon size={14} strokeWidth={1.7} />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* Active view - flex-fills the remaining vertical space below the
          header + tab bar. Each view itself flexes its chart wrapper to
          fill (Brief 13 Rule 10 ladder: flex-1 in a flex column with a
          definite parent height resolves to a real pixel size). */}
      <div style={{
        flex: '1 1 auto',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {renderView()}
      </div>
    </div>
  )
}
