/**
 * Map themes - drives the leaderboard sort + map dot colour/size on
 * /portfolio/map. Six themes per design note D2 + D3 (Overview, Energy,
 * Water, Waste, Carbon, Data quality), each with one or more metrics.
 *
 * Accessor signature: (site, energy, water, waste, carbon, mpanRegister) => number | null | Array
 *   - site:         entry from sites.json (keyed by site id)
 *   - energy:       entry from energy.json (keyed by site id) or undefined
 *   - water:        entry from water.json (keyed by site id) or undefined
 *   - waste:        entry from waste.json (keyed by site id) or undefined
 *   - carbon:       entry from carbon.json.by_site[id] or undefined
 *   - mpanRegister: full mpan_register.json keyed object - accessor reads `reg[site.id]`
 *                   to get the meter array. Added Brief 8 Part 2 (Meters theme).
 *                   Other themes ignore it.
 *
 * Return null for "no data" - leaderboard ranks nulls last; map renders a
 * muted dot.
 *
 * Render modes (consumed by Leaderboard):
 *   bar       - single fill in the theme colour
 *   gridBar   - fill colour by value (traffic-light per `colorScale`)
 *   stacked   - segments per `stackKeys`
 *   icons     - categorical (Set of distinct value chips)
 *
 * Toggles: by default ['total','perUnit','perM2']. Set `intensity: true`
 * to suppress (the metric is already an intensity); set `categorical: true`
 * to suppress (toggle is meaningless for icons).
 *
 * Field names verified against the real JSONs in pipeline/dist/eir/
 * (Brief 7 Part 1 BEFORE-DOING-ANYTHING step 3).
 */

import { MAP_THEME_HEX, METRIC_HEX } from '../tokens/chart-colors.js'

// Safe-access helpers ------------------------------------------------------

const n = (v) => (typeof v === 'number' && isFinite(v) ? v : null)

const sum = (...vals) => {
  const nums = vals.filter((v) => typeof v === 'number' && isFinite(v))
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null
}

// Data-quality completeness score across the four streams (Elec/Gas/Water/Waste).
// confirmed = 1.0, partial = 0.5, missing = 0, not_applicable = excluded.
// Returns a percentage 0–100; null if no streams apply.
function dqScore(energy, water, waste, site) {
  const streams = []
  // Electricity present if energy.consumption_kwh.electricity is non-null.
  if (n(energy?.consumption_kwh?.electricity) !== null) {
    streams.push(1.0)
  } else {
    streams.push(0)
  }
  // Gas applicable only if site has gas (scope_allocation.has_gas).
  const hasGas = site?.scope_allocation?.has_gas
  if (hasGas) {
    streams.push(n(energy?.consumption_kwh?.gas) !== null ? 1.0 : 0)
  }
  // Water by data_status.
  const wMap = { confirmed: 1.0, partial: 0.5, missing: 0, not_applicable: null }
  const ws = wMap[water?.data_status]
  if (ws !== undefined && ws !== null) streams.push(ws)
  // Waste by data_status.
  const sMap = { confirmed: 1.0, partial: 0.5, missing: 0, not_applicable: null }
  const ss = sMap[waste?.data_status]
  if (ss !== undefined && ss !== null) streams.push(ss)
  if (!streams.length) return null
  return (streams.reduce((a, b) => a + b, 0) / streams.length) * 100
}

// Themes -------------------------------------------------------------------

export const MAP_CATEGORIES = [
  {
    id: 'overview',
    label: 'Overview',
    desc: 'Portfolio-wide context - completed units, conditioned area, energy footprint.',
    color: 'var(--theme-overview)',
    colorHex: MAP_THEME_HEX.overview,
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'units_completed',
        label: 'Units completed',
        desc: 'Occupied + completed apartments (sites.json identity.completed).',
        accessor: (site) => n(site?.identity?.completed),
        format: 'count',
        unit: 'units',
        render: 'bar',
        intensity: true,
      },
      {
        key: 'gia_total',
        label: 'Total GIA',
        desc: 'Gross internal area across the whole site (residential + landlord).',
        accessor: (site) => n(site?.identity?.total_gia_m2),
        format: 'm2',
        unit: 'm²',
        render: 'bar',
        intensity: true,
      },
      {
        key: 'gia_landlord',
        label: 'Landlord GIA',
        desc: 'Landlord-controlled common-part area only (the GRESB Scope 1+2 boundary).',
        accessor: (site) => n(site?.identity?.landlord_gia_m2),
        format: 'm2',
        unit: 'm²',
        render: 'bar',
        intensity: true,
      },
    ],
  },

  {
    id: 'energy',
    label: 'Energy',
    desc: 'Electricity + gas consumption, by source. Switch Total / Per Unit / Per m² to compare like-for-like.',
    color: 'var(--theme-energy)',
    colorHex: MAP_THEME_HEX.energy,
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'energy_total',
        label: 'Total energy',
        desc: 'Electricity + gas (kWh, CY2025).',
        accessor: (site, energy) => n(energy?.consumption_kwh?.total),
        format: 'kwh',
        unit: 'kWh',
        render: 'bar',
      },
      {
        key: 'electricity',
        label: 'Electricity',
        desc: 'Landlord + bulk grid electricity (kWh, CY2025).',
        accessor: (site, energy) => n(energy?.consumption_kwh?.electricity),
        format: 'kwh',
        unit: 'kWh',
        render: 'bar',
        // Brief 10 Part 5 - sub-metric tint override: rides yellow even
        // though the Energy theme is blue.
        color: 'var(--metric-electricity)',
        colorHex: METRIC_HEX.electricity,
      },
      {
        key: 'gas',
        label: 'Gas',
        desc: 'Gas (kWh, CY2025) - sites without gas hidden.',
        accessor: (site, energy) => n(energy?.consumption_kwh?.gas),
        format: 'kwh',
        unit: 'kWh',
        render: 'bar',
        filter: (site) => site?.scope_allocation?.has_gas === true,
        // Brief 10 Part 5 - sub-metric tint override: gas → warm red.
        color: 'var(--metric-gas)',
        colorHex: METRIC_HEX.gas,
      },
    ],
  },

  {
    id: 'water',
    label: 'Water',
    desc: 'Mains water consumption. Reliability varies - Estimated vs Actual flagged in the data-quality view.',
    color: 'var(--theme-water)',
    colorHex: MAP_THEME_HEX.water,
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'water_total',
        label: 'Water consumption',
        desc: 'CY2025 mains water (m³).',
        accessor: (site, energy, water) => n(water?.consumption_m3),
        format: 'm3',
        unit: 'm³',
        render: 'bar',
      },
    ],
  },

  {
    id: 'waste',
    label: 'Waste',
    desc: 'Operational waste tonnage and diversion from landfill. BIFFA-covered sites only.',
    color: 'var(--theme-waste)',
    colorHex: MAP_THEME_HEX.waste,
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'waste_total',
        label: 'Total tonnage',
        desc: 'CY2025 collected waste (tonnes, all streams).',
        accessor: (site, energy, water, waste) => n(waste?.tonnage_total),
        format: 'tonnes',
        unit: 't',
        render: 'bar',
      },
      {
        key: 'diversion',
        label: 'Diversion rate',
        desc: '% diverted from landfill. Higher is better - colour-graded.',
        // Brief 9 - waste.json stores diversion_rate as a 0-1 fraction;
        // convert to 0-100 here so formatValue('percent') reads it right.
        accessor: (site, energy, water, waste) => {
          const r = waste?.diversion_rate
          return typeof r === 'number' ? r * 100 : null
        },
        format: 'percent',
        unit: '%',
        render: 'gridBar',
        intensity: true,
        goodHigh: true,
        colorScale: 'reverse', // high = good (green); low = bad (red)
        legend: [
          { label: 'High (≥75%)',  color: 'var(--color-risk-low)' },
          { label: 'Mid (40–75%)', color: 'var(--color-risk-moderate)' },
          { label: 'Low (<40%)',   color: 'var(--color-risk-major)' },
        ],
      },
    ],
  },

  {
    id: 'carbon',
    label: 'Carbon',
    desc: 'Greenhouse-gas inventory by scope. Stacked bars show the Scope 1 + 2 + 3 Cat 13 breakdown.',
    color: 'var(--theme-carbon)',
    colorHex: MAP_THEME_HEX.carbon,
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'carbon_total',
        label: 'Total tCO₂e',
        desc: 'Scope 1 + 2 + 3 Cat 13 (CY2025 actual).',
        accessor: (site, energy, water, waste, carbon) => n(carbon?.total_actual_tco2e),
        format: 'tco2e',
        unit: 'tCO₂e',
        render: 'bar',
      },
      {
        key: 'carbon_stacked',
        label: 'By scope',
        desc: 'Scope 1 (gas) · Scope 2 (landlord elec) · Scope 3 Cat 13 (resi elec).',
        accessor: (site, energy, water, waste, carbon) => n(carbon?.total_actual_tco2e),
        format: 'tco2e',
        unit: 'tCO₂e',
        render: 'stacked',
        stackKeys: [
          { key: 'scope1', label: 'Scope 1',  field: 'scope_1_tco2e',        color: 'var(--color-risk-major)' },
          { key: 'scope2', label: 'Scope 2',  field: 'scope_2_tco2e',        color: 'var(--color-scope-12)' },
          { key: 'scope3', label: 'Scope 3 Cat 13', field: 'scope_3_cat13_tco2e', color: 'var(--color-scope-3)' },
        ],
        // Stacked uses the carbon entry directly.
        stackAccessor: (site, energy, water, waste, carbon) => carbon || null,
        // Static legend rendered below the leaderboard.
        legend: [
          { label: 'Scope 1 (gas)',                color: 'var(--color-risk-major)' },
          { label: 'Scope 2 (landlord elec)',      color: 'var(--color-scope-12)' },
          { label: 'Scope 3 Cat 13 (resi elec)',   color: 'var(--color-scope-3)' },
        ],
      },
      {
        key: 'intensity_per_unit',
        label: 'Per unit',
        desc: 'tCO₂e per completed unit - like-for-like comparison.',
        accessor: (site, energy, water, waste, carbon) => n(carbon?.intensity_per_unit),
        format: 'tco2e',
        unit: 'tCO₂e/unit',
        render: 'bar',
        intensity: true,
      },
      {
        key: 'intensity_per_m2',
        label: 'Per m²',
        desc: 'tCO₂e per m² total GIA.',
        accessor: (site, energy, water, waste, carbon) => n(carbon?.intensity_per_m2_gia),
        format: 'tco2e',
        unit: 'tCO₂e/m²',
        render: 'bar',
        intensity: true,
      },
    ],
  },

  {
    id: 'meters',
    label: 'Meters',
    desc: 'Meter inventory and instrumentation maturity. Composition shows the live mix per site; coverage tracks where half-hourly data is in place.',
    color: 'var(--theme-meters)',
    colorHex: MAP_THEME_HEX.meters,
    toggles: [],
    metrics: [
      {
        key: 'composition',
        label: 'Composition',
        desc: 'Meter mix per site: half-hourly, monthly, gas, void/inactive (precedence-resolved, no double-count).',
        // Returns an ARRAY of segments - Leaderboard's stacked branch handles
        // array-shaped accessor output. Each meter goes into ONE bucket by
        // precedence: Void/Inactive → Gas → HH → NHH.
        accessor: (s, e, w, wa, c, reg) => {
          const meters = (reg && reg[s.id]) || []
          let hh = 0, nhh = 0, gas = 0, dead = 0
          for (const m of meters) {
            const cat = String(m.category || '').toLowerCase()
            if (cat.includes('void') || cat.includes('inactive')) {
              dead++
            } else if (m.type === 'Gas') {
              gas++
            } else if (m.type === 'HH') {
              hh++
            } else {
              nhh++
            }
          }
          return [
            { label: 'Half-hourly', value: hh,   color: 'var(--color-nza-coral)' },
            { label: 'Monthly',     value: nhh,  color: 'var(--color-theme-accent-primary)' },
            { label: 'Gas',         value: gas,  color: 'var(--color-categorical-commuting)' },
            { label: 'Void',        value: dead, color: 'rgba(255,255,255,0.18)' },
          ]
        },
        format: (segs) => {
          if (!Array.isArray(segs)) return '-'
          const total = segs.reduce((t, x) => t + (x.value || 0), 0)
          return total.toString()
        },
        unit: 'meters',
        render: 'stacked',
        // Static legend rendered below the leaderboard for Composition.
        legend: [
          { label: 'Half-hourly', color: 'var(--color-nza-coral)' },
          { label: 'Monthly',     color: 'var(--color-theme-accent-primary)' },
          { label: 'Gas',         color: 'var(--color-categorical-commuting)' },
          { label: 'Void/Inactive', color: 'rgba(255,255,255,0.18)' },
        ],
      },
      {
        key: 'total_utility',
        label: 'Total utility',
        desc: 'All utility meters at the site (MPANs + MPRNs).',
        accessor: (s, e, w, wa, c, reg) => ((reg && reg[s.id]) || []).length,
        format: (v) => (typeof v === 'number' ? v.toString() : '-'),
        unit: 'meters',
        render: 'bar',
      },
      {
        key: 'landlord_meters',
        label: 'Landlord meters',
        desc: 'Meters classified as landlord-owned (vs resident or void).',
        accessor: (s, e, w, wa, c, reg) => {
          const ms = (reg && reg[s.id]) || []
          return ms.filter((m) => String(m.category || '').toLowerCase().includes('landlord')).length
        },
        format: (v) => (typeof v === 'number' ? v.toString() : '-'),
        unit: 'meters',
        render: 'bar',
      },
      {
        key: 'hh_coverage',
        label: 'HH coverage',
        desc: 'Share of landlord meters with half-hourly data. High = audit-ready.',
        accessor: (s, e, w, wa, c, reg) => {
          const ms = ((reg && reg[s.id]) || []).filter((m) => String(m.category || '').toLowerCase().includes('landlord'))
          if (!ms.length) return null
          return (ms.filter((m) => m.type === 'HH').length / ms.length) * 100
        },
        format: 'percent',
        unit: '%',
        render: 'gridBar',
        intensity: true,
        goodHigh: true, // high coverage = green (alias for colorScale: 'reverse')
        colorScale: 'reverse',
        legend: [
          { label: 'High (≥75%)',  color: 'var(--color-risk-low)' },
          { label: 'Mid (40–75%)', color: 'var(--color-risk-moderate)' },
          { label: 'Low (<40%)',   color: 'var(--color-risk-major)' },
        ],
      },
    ],
  },

  {
    id: 'dataQuality',
    label: 'Data quality',
    desc: 'Completeness of the four primary streams (Elec / Gas / Water / Waste). High = audit-ready.',
    color: 'var(--theme-dq)',
    colorHex: MAP_THEME_HEX.dataQuality,
    toggles: ['total'],
    metrics: [
      {
        key: 'dq_completeness',
        label: 'Completeness score',
        desc: 'Mean of stream completeness: confirmed=1.0, partial=0.5, missing=0. Gas excluded for all-electric sites.',
        accessor: (site, energy, water, waste) => dqScore(energy, water, waste, site),
        format: 'percent',
        unit: '%',
        render: 'gridBar',
        intensity: true,
        colorScale: 'reverse', // high = good
        legend: [
          { label: 'High (≥75%)',  color: 'var(--color-risk-low)' },
          { label: 'Mid (40–75%)', color: 'var(--color-risk-moderate)' },
          { label: 'Low (<40%)',   color: 'var(--color-risk-major)' },
        ],
      },
      {
        key: 'heating_archetype',
        label: 'Heating type',
        desc: 'Primary heating archetype (from sites.json archetype.primary_heating).',
        accessor: (site) => site?.archetype?.primary_heating || null,
        format: 'text',
        unit: '',
        render: 'icons',
        categorical: true,
      },
      {
        key: 'grid_type',
        label: 'Grid type',
        desc: 'Bulk (microgrid) vs Standard supply.',
        accessor: (site) => site?.archetype?.grid_type || null,
        format: 'text',
        unit: '',
        render: 'icons',
        categorical: true,
      },
    ],
  },
]

/**
 * Format a number for leaderboard display.
 * Compact at ≥1k (k/M); 1 dp at <1k; 0 dp for counts.
 */
export function formatValue(v, fmt) {
  if (v === null || v === undefined || !isFinite(v)) return '-'
  if (fmt === 'count' || fmt === 'units') return Math.round(v).toLocaleString('en-GB')
  if (fmt === 'percent') return v.toFixed(0) + '%'
  if (fmt === 'text') return String(v)
  // numeric units - compact above 1k
  if (v >= 1_000_000) return (v / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + 'M'
  if (v >= 1_000) return Math.round(v / 1_000).toLocaleString('en-GB') + 'k'
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString('en-GB')
  return v.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

/**
 * Normalise a value by the current toggle mode.
 * Returns null if normalisation can't be applied (missing denominator).
 * Intensity metrics ignore the mode (toggle suppressed in the UI anyway).
 */
export function applyToggle(value, site, mode, metric) {
  if (value === null || value === undefined) return null
  if (metric?.intensity || metric?.categorical) return value
  if (mode === 'total' || !mode) return value
  if (mode === 'perUnit') {
    const u = site?.identity?.completed
    return u && u > 0 ? value / u : null
  }
  if (mode === 'perM2') {
    const a = site?.identity?.total_gia_m2
    return a && a > 0 ? value / a : null
  }
  return value
}

/**
 * Find a theme by id; falls back to Energy.
 */
export function findCategory(id) {
  return MAP_CATEGORIES.find((c) => c.id === id) || MAP_CATEGORIES[1]
}

/**
 * Find a metric within a theme by key; falls back to the theme's first metric.
 */
export function findMetric(category, key) {
  return category.metrics.find((m) => m.key === key) || category.metrics[0]
}
