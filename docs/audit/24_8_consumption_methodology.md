# Brief 24.8 - Consumption methodology fix + Total/Landlord/Resident filter

**Status:** Closed pending Chris walkthrough at 1920×1080 + 1440×900.

**Brief:** `docs/briefs/archive/24_8_consumption_methodology_COMPLETED.md` (archived at close).

## Parts log

- [x] Part 0.5 - Brief landed at `docs/briefs/active/24_8_consumption_methodology.md`, audit stub created, `current.md` pointer updated, STATUS.md logged. Commit `04dd28b`.
- [x] Part 1 - Pipeline reconciliation update. New reader `pipeline/readers/build_consumption_methodology.py` wired into `build.py` after the strip-rule + metering passes. Per-site fields landed (`total_site_kwh`, `landlord_kwh`, `resident_kwh`, `data_quality_flag`). Portfolio block extended with `methodology_v2` summary. Sanity check passed: portfolio electricity 7.32 GWh (inside 6-10 GWh expected band). Commit `caf076d`.
- [x] Part 2 - Portfolio Consumption chart restructure. ConsumptionPanes rewritten: 3-pill radio row Total/Landlord/Resident + sub-row Sycous/arbnco when Resident active. Per-row classifier maps each in-scope site to data/tbc/greyed state. Sort by descending value within state group. Bar fills source from row.source (solid measured, striped derived). TBC bar at baseline. Source-marker legend below chart. Headline strip above. Filter changes force-remount Recharts via key prop for native bar growth replay. GRESB-26 master + 5-segment additive stack dropped. Commit `6e0a87e`.
- [x] Part 3 - Site-level Consumption methodology. New `ConsumptionBreakdownCard` component in `App.jsx` sits below the headline strip on SiteEnergyMonthlyOverview (per Chris pre-flight: existing component, not new SiteConsumption tab). Shows TOTAL + Landlord + Resident simultaneously with source attribution (measured / derived / mixed). TBC honest-gap UI for Millbrook/Millfield/Blendworth with full data-quality-flag callout. Commit `f95fd51`.
- [x] Part 4 - Data-quality polish. Most Part 4 items already shipped in Part 2 structure. This commit added: TBC bar height bumped 1.8% → 2.5% of dataMax for cleaner visibility; ChartLegend prefixed with italicised "Solid = measured · striped = derived" convention key; small coral dot on X-axis ticks for sites with data_quality_flag (visual hint that hovering reveals pending-data context). Commit `95087dc`.
- [x] Part 5 - Brief 24.7 prose update. All cited figures rewritten to match the methodology_v2 block. Top-5 sites recomputed (74% → 71%; sites shifted from Austin/Gifford/Bramshott/Ledian+one to Gifford/Austin/Ledian/Elderswell/Durrants). New honest TBC paragraph for the three pending-split sites. "61% directly measured" → 19% (Sycous data anomaly + zero-reads stripped from numerator). Commit `f71c5b7`.
- [x] Close - this audit doc populated; brief archived; current.md repointed; STATUS.md per Part; pushed.

## Why this brief

Portfolio Consumption chart double-counts at bulk-metered sites. Ecotricity's bulk meter reading + Sycous sub-meter readings measure the same physical electricity (Sycous lives downstream of the bulk meter), but the chart stacks them as if they were independent. Inflates portfolio totals 2-4x at bulk sites.

Brief 24.8 fixes it via:
1. **Methodology correction** in the pipeline: at bulk sites with Sycous, Total = bulk reading, Resident = Sycous, Landlord = bulk - Sycous (derived). At DNO/BNO sites, the existing stacked logic stays — Ecotricity sees only landlord supply, arbnco-derived covers residents, they're measuring different physical flows.
2. **Filter model** in the chart: three views (Total / Landlord / Resident) with sub-toggle for Resident (All / Sycous-measured / arbnco-derived).
3. **Honest TBC handling** for Millbrook (bulk-no-Sycous) and Millfield (Sycous reading > bulk reading — impossible if both measure electricity).

The methodology change ripples into Brief 24.7's Consumption prose figures.

## Pre-flight clarifications (Chris, before kickoff)

1. **Escalation band on portfolio total:** 12-16 GWh total / 6-10 GWh electricity. Stop and surface if outside the band before Part 5.
2. **Brief 24.5 field collision:** no structural collision. The new model layers on top of existing fields without breaking Brief 17.5's `resident_kwh_by_source` references.
3. **Site-level path:** lands in `SiteEnergyMonthlyOverview` (existing component), NOT a new `SiteConsumption` tab.

## Operational mode

Plough-through, NO checkpoints. Push at close. Escalate (log + stop) for:
- Recalculated headline figures outside the 12-16 GWh / 6-10 GWh elec band.
- Negative landlord at any site OTHER than Millfield.
- Brief 24.5 field-name collision (none expected, surface if found).
- 20 min stuck + 3 approaches.

## Implementation notes

### Part 1 - pipeline methodology pass

New reader at `pipeline/readers/build_consumption_methodology.py` runs as a final mutation on `reconciliation` after the strip-rule + metering passes. Re-uses `build_strip_rule.DNO_SITES` / `BULK_SITES_WITH_SYCOUS` / etc as the single classification source-of-truth.

Per-site logic by `resident_kwh_by_source.arrangement`:

| Arrangement | Total elec | Landlord elec | Resident elec | Data flag |
|---|---|---|---|---|
| `bulk+sycous` (Sycous > 0) | eco_landlord | eco_landlord - Sycous (derived) | Sycous (measured) | None |
| `bulk+sycous` (Sycous = 0) | eco_landlord | TBC | TBC | `<sid>_sycous_zero_reads` |
| `bulk+sycous` (Sycous > eco_landlord) | eco_landlord | TBC | TBC | `<sid>_sycous_anomaly` |
| `bulk-no-sycous` | eco_landlord + eco_void | TBC | TBC | `<sid>_no_sycous` |
| `dno` / `dno+sycous-heat` | eco_landlord + eco_void + arbnco_derived | eco_landlord + eco_void (measured) | arbnco_derived (derived) | None |
| `out-of-scope-fy25` | null | null | null | None (Sonning, Edwalton) |

Gas: at every site Landlord gas = `eco_gas_kwh`, Resident gas = 0, Total gas = `eco_gas_kwh`. Sycous-measured heat stays in the existing `resident_kwh_by_source.submetered_heat` block; adding it to Resident gas would double-count the heat-network input with its own output.

Portfolio aggregation excludes any site whose landlord/resident source is `TBC` from the corresponding rollup (conservative — under-reports rather than including a partial figure). Conservative call: Millbrook's gas (142k) IS measured even though its elec is TBC, so `landlord_kwh.gas` portfolio rollup is 7.49 GWh vs the full site-gas figure of 7.64 GWh. The 0.15 GWh delta is acceptable for Part 1; Part 2 can surface partial-TBC if needed.

### Per-site reconciliation table (Part 1 output)

| Site | Arrangement | Total kWh | Landlord kWh | Resident kWh | Flag |
|---|---|---|---|---|---|
| austin-heath | bulk+sycous | 2,931,778 (456k elec + 2,475k gas) | 2,698,432 (223k elec derived + 2,475k gas) | 233,346 (Sycous measured) | None |
| gifford-lea | bulk+sycous | 3,348,667 | 3,102,317 | 252,188 (Sycous measured) | None |
| bramshott-place | dno | 1,222,088 | 577,408 (eco measured) | 644,680 (arbnco derived) | None |
| millbrook-village | bulk-no-sycous | 480,708 (339k elec + 142k gas) | 142,154 gas (elec TBC) | TBC | `millbrook-village_no_sycous` |
| durrants-village | dno | 1,302,966 | 335,554 | 967,412 | None |
| great-alne-park | dno | 1,047,048 | 361,881 | 685,167 | None |
| ledian-gardens | dno | 1,802,322 | 1,560,880 | 241,441 | None |
| elderswell | dno+sycous-heat | 1,425,461 | 1,268,564 | 156,897 | None |
| millfield-green | bulk+sycous (anomaly) | 840,266 elec | TBC | TBC | `millfield-green_sycous_anomaly` |
| ampfield-meadows | bulk+sycous | 523,921 elec | 358,679 derived | 165,243 Sycous | None |
| blendworth-hills | bulk+sycous (Sycous zero) | 279,091 elec | TBC | TBC | `blendworth-hills_sycous_zero_reads` |

### Portfolio block (`methodology_v2`)

- `total_kwh.total` = 14,952,127 kWh = **14.95 GWh**
- `total_kwh.electricity` = 7,316,384 kWh = **7.32 GWh** (down from inflated 10.0)
- `total_kwh.gas` = 7,635,743 kWh = **7.64 GWh** (was reported as 8.98 in 24.7 — old figure conflated `eco_gas` with Sycous heat output)
- `landlord_kwh.total` = 10,005,690 kWh = **10.01 GWh** (excl TBC sites)
- `resident_kwh.total` = 3,346,373 kWh = **3.35 GWh** (excl TBC sites)
- `resident_kwh.by_source.sycous_measured_elec` = **0.65 GWh** (Austin+Gifford+Ampfield)
- `resident_kwh.by_source.arbnco_derived_elec` = **2.70 GWh** (all 5 DNO sites)
- `sites_with_full_data` = 8
- `sites_with_tbc` = [millbrook-village, millfield-green, blendworth-hills]
- `in_scope_count` = 11

### Sanity check vs brief escalation band

| Metric | Old (24.7 prose) | New (24.8 methodology_v2) | Brief band | OK? |
|---|---|---|---|---|
| Portfolio total | 19.0 GWh | 14.95 GWh | 12-16 GWh | ✓ |
| Electricity total | 10.0 GWh | 7.32 GWh | 6-10 GWh | ✓ |
| Landlord total | 12.1 GWh | 10.01 GWh | — | ✓ |
| Resident total | 6.94 GWh | 3.35 GWh | — | ✓ |
| Sycous-measured | 4.25 GWh | 0.65 GWh | — | (was inflated by anomalous Millfield + zero-read Blendworth being counted) |
| arbnco-derived | 2.70 GWh | 2.70 GWh | — | ✓ unchanged (DNO methodology was correct) |

Negative-landlord check: only `millfield-green` triggers the anomaly path. No other site goes negative — good (brief escalation rule would have stopped us if any did).

## DOM verification

(populated at close)

## Headline figures — before vs after

| Figure | 24.7 prose (before) | 24.8 (after) | Delta |
|---|---|---|---|
| Portfolio total | 19.0 GWh | **14.95 GWh** | -4.05 GWh (-21%) |
| Electricity total | 10.0 GWh | **7.32 GWh** | -2.68 GWh (-27%) |
| Gas total | 8.98 GWh | **7.64 GWh** | -1.34 GWh (-15%, was conflated with Sycous heat) |
| Landlord total | 12.1 GWh | **10.01 GWh** | -2.09 GWh (-17%) |
| Resident total | 6.94 GWh | **3.35 GWh** | -3.59 GWh (-52%, the bulk of the inflation) |
| Sycous-measured resident | 4.25 GWh | **0.65 GWh** | -3.60 GWh (-85%, Millfield + Blendworth anomalies stripped) |
| arbnco-derived resident | 2.70 GWh | **2.70 GWh** | unchanged ✓ (DNO methodology was correct) |
| Top-N concentration | 5 sites / 74% | **5 sites / 70.6%** | sites shifted: was Austin/Gifford/Bramshott/Ledian+one; now Gifford/Austin/Ledian/Elderswell/Durrants |
| Submetered % of resident | 61% | **19%** | honest figure with anomalies excluded |

## Sanity-band check vs brief escalation rule

| Brief band | Actual | Status |
|---|---|---|
| Portfolio total: 12-16 GWh | 14.95 GWh | ✓ inside band |
| Portfolio electricity: 6-10 GWh | 7.32 GWh | ✓ inside band |
| No negative landlord outside Millfield | only Millfield | ✓ as expected |
| Brief 24.5 field collision | none detected | ✓ |

No escalation triggered. Plough-through completed cleanly without stop-and-surface.

## Top-5 sites (new methodology)

| # | Site | Total (GWh) | % portfolio | Cumulative % |
|---|---|---|---|---|
| 1 | Gifford Lea | 3.10 | 20.7% | 20.7% |
| 2 | Austin Heath | 2.93 | 19.6% | 40.3% |
| 3 | Ledian Gardens | 1.80 | 12.1% | 52.4% |
| 4 | Elderswell | 1.43 | 9.5% | 61.9% |
| 5 | Durrants Village | 1.30 | 8.7% | 70.6% |
| 6 | Bramshott Place | 1.22 | 8.2% | 78.8% |

Bramshott moved from top-5 to #6 under the new methodology (its DNO arrangement is unchanged but the overall portfolio total shrank, so other sites lifted past it). Durrants entered top-5 — large resident base on electricity-only.

## Per-site reconciliation table (Part 1 output, live JSON)

Already populated in the Implementation notes section above (Per-site reconciliation table).

## Commit table

| Part | SHA | Description |
|---|---|---|
| Part 0.5 | `04dd28b` | Brief 24.8 land: consumption methodology fix |
| Part 1 | `caf076d` | Brief 24.8 Part 1: reconciliation methodology + new fields |
| Part 2 | `6e0a87e` | Brief 24.8 Part 2: Consumption chart Total/Landlord/Resident filter |
| Part 3 | `f95fd51` | Brief 24.8 Part 3: site-level Consumption methodology |
| Part 4 | `95087dc` | Brief 24.8 Part 4: data-quality polish |
| Part 5 | `f71c5b7` | Brief 24.8 Part 5: prose figure updates |
| Close | (this commit) | Brief 24.8 close: audit doc + archive |

## DOM verification + walkthrough

Deferred to Chris's foreground-tab walkthrough at 1920×1080 + 1440×900. Per the session pattern (animations pause when MCP tab is `document.hidden`, but DOM wiring is correct), code-side reasoning has the following structural evidence:

- ConsumptionPanes renders `<HeadlineStrip>` + `<ViewPillRow>` + (conditional `<ResidentSubPillRow>`) + `<BarChart key={...}>` + `<ChartLegend>` — five stable elements pre-walkthrough.
- TBC sites (Millbrook + Millfield + Blendworth) classify as state='tbc' in Landlord + Resident views, render the `bar_tbc` segment with the striped grey pattern.
- Greyed rows surface tooltips with the "No Sycous coverage at this site" / "No arbnco-derived resident data at this site" copy when Sycous-only / arbnco-only sub-filter is active.
- Site-level ConsumptionBreakdownCard renders on every in-scope site via the data_status branch.

Expected walkthrough checks (Chris):
1. Default view (Total) shows all 11 sites with gas + electricity segments sorted by total desc. Headline shows "Portfolio total: 14.95 GWh", "Electricity: 7.32 GWh", "Gas: 7.64 GWh".
2. Click Landlord pill: bars resize; Millfield + Millbrook + Blendworth appear at the right with the thin striped grey TBC bar. Headline reads "Landlord total: 10.01 GWh · 8 sites · 3 pending".
3. Click Resident pill: bars resize to resident totals; same 3 sites still TBC; sub-row appears with All / Sycous / arbnco. Headline reads "Resident total: 3.35 GWh · 3 sites pending".
4. Click Sycous sub-pill: only Austin + Gifford + Ampfield show data bars; the 5 DNO sites grey out with tick reduced to 0.35 opacity. Headline reads "Sycous-measured: 0.65 GWh".
5. Click arbnco sub-pill: only the 5 DNO sites show data bars; bulk+Sycous sites grey out. Headline reads "arbnco-derived: 2.70 GWh".
6. Hover any TBC bar: tooltip shows site name + bold "Landlord/Resident TBC" + the per-site tbc_reason (3 distinct messages: no-Sycous, sycous-anomaly, sycous-zero-reads).
7. Hover any greyed site: tooltip shows "No Sycous coverage at this site" or "No arbnco-derived resident data at this site".
8. Site Detail → click Millfield → Energy → Overview: ConsumptionBreakdownCard shows TOTAL 0.84 GWh (reliable bulk reading), Landlord + Resident both render as coral "TBC" with the Sycous-anomaly explanation, plus the coral-bordered data-quality-flag callout.
9. No-regression: Heating / Power / Metering sub-tabs render unchanged. Page-level fade-in still plays.

## Sign-off

- [ ] Chris walkthrough at 1920×1080 + 1440×900 (pending)
- [x] All 5 Parts pushed to origin/main
- [x] Build clean (no compile errors)
- [x] Sanity-band check passed
- [x] No negative landlord outside Millfield (as expected)
- [x] Brief archived
- [x] current.md repointed
- [x] STATUS.md per Part

## Known follow-ups (carry into a separate cleanup brief)

1. **Old reconciliation fields preserved.** `eco_landlord_elec_kwh` / `submetered_elec` etc still present alongside the new methodology fields per the brief's Principles point 3 ("Both old and new pipeline fields coexist temporarily"). Once every downstream surface migrates to the new model, a cleanup brief can drop the old keys.
2. **Landlord gas partial-TBC handling.** Conservative aggregation: if a site's elec is TBC, its gas (even if measured) is excluded from `landlord_kwh` portfolio rollup. Costs 0.15 GWh of Millbrook gas. Tradeoff documented in `build_consumption_methodology.py`. Could be refined to per-commodity TBC in a future iteration.
3. **Mixed-source resident treatment.** Brief mentioned BNO sites (Ledian, Ampfield) as candidates for `source: 'mixed'` but under the current pipeline arrangement values, no site lands there. The `resident_source === 'mixed'` branch is wired but inactive. If IVG ever has a site with both Sycous-measured AND arbnco-derived resident data, the chart's mixed marker logic is ready.
4. **GRESB-26 toggle was dropped.** The old chart had a GRESB-26 master toggle for showing/hiding Sonning + Edwalton. Brief 24.8 made the chart in-scope-only by design. If Chris wants OOS sites visible again, that's a follow-up.
5. **The remaining legacy `ToggleBtn`/`SubChip` components** in PortfolioEnergy.jsx are now dead code (only the Brief 17.5 Amendment 1 6-toggle row used them). Could be removed in cleanup.
