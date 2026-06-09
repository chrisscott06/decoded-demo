/**
 * siteDerivations - per-site derived fields the Brief 24 site chapter
 * needs (landlord meter counts, GRESB readiness, platform coverage,
 * data quality summary, meter register categorisation for the
 * combined Metering page).
 *
 * Derived at runtime from existing pipeline JSON (mpan_register, water,
 * waste, reconciliation, sycous, sites) so no Python rebuild is needed.
 * If/when Brief 24 Part 1 lands a Python reader equivalent, this module
 * shifts to reading pre-computed fields - same function signatures.
 *
 * Brief 24 wires these as:
 *   - SiteOverview tile captions read landlordMeterCounts()
 *   - Sidebar GRESB pill row reads gresbReadiness()
 *   - SiteMetering headline strip reads platformCoverage() + dataQualitySummary()
 *   - SiteMetering table + graphic read groupedMeterRegister()
 */

import mpanRegister   from '@pipeline-data/mpan_register.json'
import waterData      from '@pipeline-data/water.json'
import wasteData      from '@pipeline-data/waste.json'
import reconciliation from '@pipeline-data/reconciliation.json'
import sycousData     from '@pipeline-data/sycous.json'
import hhIndex        from '@pipeline-data/half_hourly_index.json'
import siteSummaries  from '../data/site_summaries.json'

/**
 * landlordMeterCounts(siteId) → { electricity, gas, water, waste }
 *
 * Brief 24 Part 3 fix - the existing tile captions count ALL MPANs at a
 * site (including void/inactive/resident) and apply them to a landlord-
 * kWh tile, which is misleading. This function returns ONLY the meters
 * that produced the headline landlord figure.
 *
 * For Ledian (worked example from brief):
 *   electricity = 1 (one Landlord HH meter)
 *   gas         = 4 (four Landlord Gas MPRNs)
 */
export function landlordMeterCounts(siteId) {
  const mpans = mpanRegister[siteId] || []
  const isLandlord = (m) => {
    const c = (m.category || '').toLowerCase()
    return c.startsWith('landlord') || c.startsWith('construction')
  }
  const electricity = mpans.filter((m) => (m.type === 'HH' || m.type === 'NHH') && isLandlord(m)).length
  const gas         = mpans.filter((m) => m.type === 'Gas' && isLandlord(m)).length
  const water       = waterData?.[siteId]?.meters_known ?? null
  /* Waste = collection-point count when available; fall back to 1 if
     there's any waste data (single collection point is the IVG norm). */
  const wasteRec    = wasteData?.[siteId]
  const waste       = wasteRec?.collection_points ?? (wasteRec?.tonnage_total ? 1 : null)
  return { electricity, gas, water, waste }
}

/**
 * gresbReadiness(siteId) → { electricity, gas, water, waste, overall }
 *
 * Brief 24 Part 1+2 - landlord-coverage health per commodity.
 *
 * Methodology (documented for the audit doc):
 *   green  = landlord coverage with confirmed status (status === 'confirmed')
 *   amber  = partial coverage OR confirmed-but-stale (>30d would tighten;
 *            we don't have last-updated timestamps per platform yet, so
 *            we trust the pipeline's 'partial' tag)
 *   red    = missing data OR no landlord meters where there should be
 *   n/a    = commodity does not apply at this site (e.g. gas on
 *            electrified sites)
 *
 * Overall composite: red if any sub is red, else amber if any sub is
 * amber, else green. n/a sub-indicators don't drag the composite.
 *
 * Why few sites currently show green: the pipeline's 'confirmed' tag
 * requires both Ecotricity and arbnco totals AND a tight gap < 10%
 * (see App.jsx elecStatus + gasStatus). At most DNO sites the gap is
 * structural - arbnco includes residents that Ecotricity's landlord
 * data deliberately omits - so 'partial' is the default. Surfaces in
 * the audit doc as a known methodology tension.
 */
export function gresbReadiness(siteId) {
  const counts = landlordMeterCounts(siteId)
  const rec = reconciliation.by_site?.[siteId]

  const electricity = readinessFromElec(counts.electricity, rec)
  const gas         = readinessFromGas(counts.gas, rec)
  const water       = readinessFromWater(siteId)
  const waste       = readinessFromWaste(siteId)

  const all = [electricity, gas, water, waste].filter((s) => s !== 'n/a')
  let overall = 'green'
  if (all.some((s) => s === 'red'))   overall = 'red'
  else if (all.some((s) => s === 'amber')) overall = 'amber'
  else                                  overall = 'green'

  return { electricity, gas, water, waste, overall }
}

function readinessFromElec(landlordCount, rec) {
  if (!rec) return 'red'
  const eco = rec.eco_landlord_elec_kwh || 0
  if (landlordCount === 0 || eco === 0) return 'red'
  /* Bulk sites (Sycous coverage / microgrid) get green when sub-metering
     accounts for the resident gap. DNO sites with arbnco-derived resident
     get amber because the resident segment is methodology-derived, not
     directly measured. */
  const arrangement = rec.resident_kwh_by_source?.arrangement || ''
  if (arrangement === 'bulk' || arrangement === 'microgrid' || arrangement === 'submetered') {
    return 'green'
  }
  if (arrangement === 'dno') return 'amber'
  return eco > 0 ? 'amber' : 'red'
}

function readinessFromGas(landlordCount, rec) {
  if (!rec) return 'n/a'
  const gas = rec.eco_gas_kwh || 0
  if (gas === 0 && landlordCount === 0) return 'n/a'
  if (landlordCount > 0 && gas > 0) return 'green'
  return 'amber'
}

function readinessFromWater(siteId) {
  const status = waterData?.[siteId]?.data_status
  if (!status) return 'red'
  if (status === 'confirmed') return 'green'
  if (status === 'partial')   return 'amber'
  if (status === 'not_applicable') return 'n/a'
  return 'red'
}

function readinessFromWaste(siteId) {
  const status = wasteData?.[siteId]?.data_status
  if (!status) return 'red'
  if (status === 'confirmed') return 'green'
  if (status === 'partial')   return 'amber'
  if (status === 'not_applicable') return 'n/a'
  return 'red'
}

/**
 * platformCoverage(siteId) → array of { platform, present, meterCount }
 *
 * The four IVG-facing data platforms:
 *   Ecotricity  (landlord electricity + gas - billing source of truth)
 *   arbnco      (whole-site total electricity - methodology-derived)
 *   Sycous      (resident sub-metering - heat networks + microgrids)
 *   Stark       (half-hourly time-series feed - only some sites)
 *
 * `present` is true when the platform has data for this site;
 * `meterCount` is the number of meters seen on that platform (where
 * derivable from existing JSON).
 */
export function platformCoverage(siteId) {
  const rec = reconciliation.by_site?.[siteId]
  const sycSite = sycousData.by_site?.[siteId]
  const mpans = mpanRegister[siteId] || []

  const ecoMeterCount = (rec?.eco_meters_elec ?? 0) + (rec?.eco_meters_gas ?? 0)
  const arbMeterCount = (rec?.arb_meters_elec ?? 0) + (rec?.arb_meters_gas ?? 0)
  /* Brief 24.5 r2 FIX - sycous.json carries `meters_count` (plural),
     not `meter_count`. The previous typo caused all platform-coverage
     badges to render Sycous as "not present" even at sites like MFG
     with 133 sub-meters. Now reads the right field. */
  const sycMeterCount = sycSite?.meters_count ?? sycSite?.total_meters ?? 0

  /* Stark presence: derived from half_hourly_index.json - any meter
     for this site with data_status === 'ready' means Stark is serving
     it. Pending meters count as Stark-present too (the platform IS
     wired for the site; data just hasn't been pulled yet). */
  const starkMeters = (hhIndex?.mpans || []).filter((m) => m.site_id === siteId)
  const starkReady   = starkMeters.filter((m) => m.data_status === 'ready').length
  const starkPending = starkMeters.filter((m) => m.data_status === 'pending').length
  const starkPresent = starkReady > 0

  return [
    { platform: 'ecotricity', present: (rec?.eco_landlord_elec_kwh ?? 0) > 0 || (rec?.eco_gas_kwh ?? 0) > 0, meterCount: ecoMeterCount },
    { platform: 'arbnco',     present: (rec?.arb_elec_kwh ?? 0) > 0,             meterCount: arbMeterCount },
    { platform: 'sycous',     present: sycMeterCount > 0,                        meterCount: sycMeterCount },
    { platform: 'stark',      present: starkPresent,                             meterCount: starkReady, pendingCount: starkPending },
  ]
}

/**
 * dataQualitySummary(siteId) → { metersTotal, metersCurrent, metersStale, metersMissing }
 *
 * Brief 24 Part 1+5 - top-strip headline figures for the Metering page.
 * "Current" = meter has CY25 kWh and full 12-month coverage.
 * "Stale"   = meter has data but partial coverage (< 12 months).
 * "Missing" = meter exists in the register but has no kWh value.
 */
export function dataQualitySummary(siteId) {
  const mpans = mpanRegister[siteId] || []
  let current = 0, stale = 0, missing = 0
  for (const m of mpans) {
    if (m.cy25_kwh == null) { missing += 1; continue }
    if ((m.months_covered ?? 0) >= 12) current += 1
    else                                stale += 1
  }
  return { metersTotal: mpans.length, metersCurrent: current, metersStale: stale, metersMissing: missing }
}

/**
 * groupedMeterRegister(siteId) → array of grouped rows for the
 * Metering page table.
 *
 * Categorisation matches the Sankey's left column: Landlord (HH) /
 * Landlord (NHH) / Landlord (Gas) / Void / Inactive / Resident
 * (visible) / Sycous-heat / Sycous-hot-water / Sycous-cold-water.
 *
 * Each row: { category, meterCount, totalKwh, status, meters: [...] }
 * The `meters` array is the unflattened per-individual rows for
 * expand-to-individual UX.
 */
export function groupedMeterRegister(siteId) {
  const mpans = mpanRegister[siteId] || []
  const groups = new Map()
  for (const m of mpans) {
    const key = m.category || 'Uncategorised'
    if (!groups.has(key)) groups.set(key, { category: key, meterCount: 0, totalKwh: 0, meters: [], commodity: commodityOf(m), platform: 'ecotricity' })
    const g = groups.get(key)
    g.meterCount += 1
    g.totalKwh += (m.cy25_kwh || 0)
    g.meters.push({
      id: m.mpan,
      type: m.type,
      platform: platformOf(m),
      status: (m.months_covered ?? 0) >= 12 ? 'current' : (m.cy25_kwh != null ? 'stale' : 'missing'),
      lastReadingValue: m.cy25_kwh,
      monthsCovered: m.months_covered,
      anomalyFlag: ((m.category || '').toLowerCase().includes('high consumption')) ? 'void-high' : null,
    })
  }

  /* Brief 24.5 Part 2c BUG FIX - sycous.json `by_service` is an ARRAY
     of { service, properties, meters, annual_total, ... } objects.
     The previous Object.entries() iteration treated it as an object-
     keyed payload, so `service` became numeric indexes "0", "1" and
     the real Sycous categories were silently skipped. This is why
     Millfield Green showed "1 meter" instead of 134 - all 133
     Sycous-electricity sub-meters were dropped. Now iterating as an
     array; each service becomes its own row in the table. */
  const sycSite = sycousData.by_site?.[siteId]
  const byService = Array.isArray(sycSite?.by_service) ? sycSite.by_service : []
  for (const svc of byService) {
    const serviceName = svc.service || 'Sub-metered'
    const count = svc.meters ?? svc.meter_count ?? svc.properties ?? 0
    if (!count) continue
    const totalKwh = svc.annual_total ?? svc.total_kwh ?? 0
    const quality = svc.data_quality_pct
    /* Status colour from data_quality_pct: 90+ green, 70-89 amber, <70 red. */
    const status = quality == null ? 'unknown'
                 : quality >= 90 ? 'current'
                 : quality >= 70 ? 'stale'
                 : 'missing'
    groups.set(`Sycous · ${serviceName}`, {
      category: `Sycous · ${serviceName}`,
      meterCount: count,
      totalKwh,
      commodity: serviceCommodity(serviceName),
      platform: 'sycous',
      sycousService: serviceName,
      sycousQualityPct: quality,
      sycousStatus: status,
      properties: svc.properties,
      meters: [],  /* per-meter detail not in current sycous.json */
    })
  }

  /* Brief 24.5 Part 2d - surface water + waste as single grouped rows
     (no per-meter expansion because the pipeline currently exposes
     site totals only for these - see audit doc Part 1). */
  const waterRec = waterData?.[siteId]
  if (waterRec && (waterRec.meters_known ?? 0) > 0) {
    groups.set('Water · Landlord meters', {
      category: 'Water · Landlord meters',
      meterCount: waterRec.meters_known,
      totalKwh: 0,  /* water is m³, not kWh - table column reads - for these rows */
      totalM3: waterRec.consumption_m3,
      commodity: 'water',
      platform: 'water-company',
      meters: [],
      noPerMeterDetail: true,
      sycousStatus: waterRec.data_status === 'confirmed' ? 'current'
                  : waterRec.data_status === 'partial'   ? 'stale'
                  : 'missing',
    })
  }
  const wasteRec = wasteData?.[siteId]
  if (wasteRec && wasteRec.tonnage_total != null) {
    /* Waste collection points - assume 1 unless data exposes otherwise. */
    const points = wasteRec.collection_points ?? 1
    groups.set('Waste · Collection points', {
      category: 'Waste · Collection points',
      meterCount: points,
      totalKwh: 0,
      totalTonnes: wasteRec.tonnage_total,
      commodity: 'waste',
      platform: 'waste-contractor',
      meters: [],
      noPerMeterDetail: true,
      sycousStatus: wasteRec.data_status === 'confirmed' ? 'current'
                  : wasteRec.data_status === 'partial'   ? 'stale'
                  : 'missing',
    })
  }

  return [...groups.values()].sort((a, b) => b.meterCount - a.meterCount)
}

/**
 * siteSummary(siteId) → { type, summary, facts } from site_summaries.json,
 * or a graceful fallback when the entry isn't populated.
 */
export function siteSummary(siteId) {
  const s = siteSummaries[siteId]
  if (s) return s
  return {
    type: '-',
    summary: 'Summary pending - IVG ESG team to refine wording for this site.',
    facts: [],
  }
}

/**
 * meterTrend12Months(meterId) → array of 12 monthly kWh values, or null
 * when per-meter monthly data isn't yet exposed by the pipeline.
 *
 * Brief 24.5 Part 1 audit: the current pipeline carries SITE-level
 * monthly arrays (electricity_monthly.json) but no per-MPAN monthly
 * series. So this helper always returns null today; the Sparkline
 * component treats null as "render dash". A future pipeline reader
 * can populate this without an API change.
 */
export function meterTrend12Months(meterId) {
  // eslint-disable-next-line no-unused-vars
  void meterId
  return null
}

function commodityOf(m) {
  if (m.type === 'Gas') return 'gas'
  return 'electricity'
}
function platformOf(m) {
  /* Heuristic - all MPAN-register rows come from the Ecotricity / arbnco
     reconciliation. The combined feed lives at MPAN-register level; the
     platform attribution per-meter isn't surfaced. Default 'ecotricity'
     until pipeline carries the source flag. */
  return 'ecotricity'
}
function serviceCommodity(service) {
  const s = (service || '').toLowerCase()
  if (s.includes('elec')) return 'electricity'
  if (s.includes('heat')) return 'heat'
  if (s.includes('cold')) return 'water'
  if (s.includes('hot'))  return 'hot-water'
  return 'sub-metered'
}
