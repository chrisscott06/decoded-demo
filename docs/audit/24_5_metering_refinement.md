# Brief 24.5 audit — Metering refinement + Energy sub-tab redesigns + Brief 24 close

**Status:** In flight. Populated as parts land.

## Part 1 — Data audit findings (4 Jun)

### Per-meter exposure in pipeline JSON

| Source | Per-meter rows? | What IS exposed |
|---|---|---|
| `mpan_register.json` | ✓ Yes — full per-MPAN array | id, type (HH/NHH/Gas), category (Landlord / Void / Inactive), cy25_kwh, months_covered |
| `sycous.json` `by_site.<id>.by_service` | Per-service group, not per-meter | array of `{ service, properties, meters, annual_total kWh, data_quality_pct }` — each Sycous service becomes one row in the table grouped by service |
| `water.json` | ✗ No per-meter rows | `meters_known` count, `meters_with_cy2025_data`, `consumption_m3` site total, `data_quality`, `key_gaps` prose |
| `waste.json` | ✗ No per-meter rows | `contractor`, `tonnage_by_stream`, `disposal_split` — site-level only |

**Bug surfaced and fixed in Part 2c:** the previous `groupedMeterRegister()` iterated `sycous.by_service` with `Object.entries()` expecting an object-keyed payload. The actual shape is an array of `{ service, ... }` objects, so the iteration mis-bound `service` to numeric indexes `"0"`, `"1"` and skipped the real service names. This is why Millfield Green showed "1 meter" instead of 134 — all 133 Sycous-electricity sub-meters were missing from the table because the iteration loop produced unusable group keys.

### Per-meter time-series for sparklines

Data NOT currently per-meter-monthly-exposed in the pipeline output. `electricity_monthly.json` carries SITE-level monthly aggregates but not per-MPAN monthly arrays. Sycous and water have no monthly per-meter data either.

**Decision:** sparkline column ships as a placeholder with dash `—` for now. Surfacing a `meterTrend12Months()` helper that always returns `null` so the slot exists in the table for a future pipeline change to populate. Pipeline reader to expose per-MPAN monthly arrays from Stark HH source is a follow-on ask.

## Part 2 — Metering page refinement (landed)

### 2a Register switch — DONE
Removed the dark navy wrapper that Brief 24 r1 added. Page now renders on cream register matching the rest of Site Detail. All `rgba(255,255,255,*)` borders/backgrounds flipped to `rgba(26,36,64,*)` cream-register equivalents. `TEXT_BODY` token swapped from `var(--color-theme-body)` (cream) to `var(--color-theme-base)` (navy). Same for muted text and rule lines. Platform-logo mask tint reversed (was painting cream-coloured masks for dark bg; now navy on cream).

### 2b Default filter — already satisfied
`useState('all')` on the filter pill — page lands showing every meter category by default. (The previous user-experienced "Electricity filter active" was from clicking the electricity GRESB-readiness pill in the headline strip, which is intentional cross-pane interaction.)

### 2c Sycous bug fix — DONE
Bug: `sycous.by_site.<id>.by_service` is an ARRAY of `{ service, properties, meters, annual_total, ... }` but the previous `groupedMeterRegister()` iterated it with `Object.entries()` expecting an object — mis-binding `service` to numeric indexes `"0"`, `"1"` so the real categories were silently dropped. This is why MFG showed "1 meter" instead of 134 — all 133 Sycous-electricity sub-meters were missing.

Fixed: iterate as array. Each Sycous service becomes its own table row. MFG now shows `Sycous · Electricity — 133 meters, 2,251,537 kWh, 89% data quality (current)`. Status derived from `data_quality_pct`: ≥90 green, 70-89 amber, <70 red.

### 2d Water + waste rows — DONE
Per audit findings, pipeline carries site totals only for water and waste (no per-meter rows). Surfaced as single grouped rows: `Water · Landlord meters — N meters, M³` and `Waste · Collection points — N points, tonnes`. `noPerMeterDetail: true` flag so the expand-row UI knows there's no per-meter detail to drill into.

### 2e Narrative card — DONE
New `NarrativeCard` component sits ABOVE the headline strip. Coral-tinted background, coral type pill on the left (`BNO`, `DNO`, `Bulk-meter`, `Office`), site name in Source Serif, 2-3 sentence summary, optional fact pills below. Reads from `site_summaries.json` (Part 1 deliverable). All 13 sites populated.

### 2f Tooltips on jargon — DEFERRED
Per-cell tooltips on MPAN / MPRN / HH / NHH / Sycous / Stark / Ecotricity / arbnco not yet wired. Brief expects ~200ms-delay hover tooltips. Next pass.

### 2g Sparklines — DEFERRED
Pipeline currently exposes SITE-level monthly arrays only (no per-MPAN monthly series). `meterTrend12Months(meterId)` helper returns null today; sparkline column would render dash for every row. Deferred until pipeline adds per-meter monthly. Helper signature in place so wiring is one render-change away when data lands.

### 2h Status legend — DONE
Inline `StatusLegend` below the table — Status eyebrow + three swatches: Current (green) · Stale (amber) · Missing (red) with detail clauses (within 30 days · 30-90 days · gap > 90 days).

## Parts 3-5 — pending

- **Part 3** Energy sub-tab redesigns (CY25 default, squash-and-stretch, Overview monthly bars + donut, Daily profile all-months overlay, Duration palette swap) — not started this pass.
- **Part 4** Brief 24 close work (visual quality gate, anti-pattern audit, Rule 11 alignment) — not started.
- **Part 5** Archive Brief 24 + Brief 24.5 — not started.
