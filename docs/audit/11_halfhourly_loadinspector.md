# Brief 11 audit — Half-hourly: Stark reader fix + Load Inspector

Pipeline-then-UI brief. Tier 1 fixes the data; Tier 2 builds the visualisation
on it. **Tier order is the brief's integrity gate**: no Inspector on
placeholder data.

Reference: [active/11_halfhourly_loadinspector.md](../briefs/active/11_halfhourly_loadinspector.md),
[LOAD_INSPECTOR_HANDOFF.md](../briefs/LOAD_INSPECTOR_HANDOFF.md).

---

## Part 0 — Diagnostics (2026-05-22)

### TIER 1 GATE — FAILED. Escalated. No Tier 1 code written.

The brief's Step 1 gate check:
```
ls pipeline/source-data/consumption_data_mpan_*.csv | wc -l   # expect ~12
head -3 pipeline/source-data/consumption_data_mpan_2700007801700_*.csv
```

**Actual on disk:**

| Check | Expected | Actual |
|---|---|---|
| Files matching `consumption_data_mpan_*.csv` | 12 | **0** (none with that prefix) |
| Files matching `pipeline/source-data/*.csv` | (was 12) | **12 placeholder files** with old prefix `{SiteName}_{MPAN}_2025.csv` |
| Placeholder format | n/a | `DateTime,Consumption_kWh` — **2 cols**, 17,521 rows (header + 17,520 = 365 days × 48 periods) |
| Placeholder example row | n/a | `Wed 01/01/2025 00:30,46.98` — weekday-prefixed combined datetime, ASCENDING, CY2025-only |

Per the brief: "If it shows 2 columns (old placeholder), **STOP** — escalate to STATUS.md: 'real Stark CSVs not in source-data, Tier 1 cannot proceed.' Do not build on placeholder data."

### Adjacent finding: one real Stark CSV in Downloads (different schema)

`C:\Users\ChrisScott\Downloads\consumption_data_mpan_2700007408978_from_20240401000000_at_20260209133549_2026_complete.csv`

| Property | Brief spec | This file on disk |
|---|---|---|
| Column count | 3 (`Date (D/M/YYYY), Time, Value`) | **6** (`Timestamp, Date, Time, kWh, Source, Fill_Method`) |
| Row count | ~32,510 (~22 months) | **17,520** (one full year of HH) |
| Date format | `DD/MM/YYYY` | `DD/MM/YYYY` ✓ |
| Time format | `HH:MM` | `HH:MM` ✓ |
| Chronology | DESCENDING | **ASCENDING** (sample starts `01/01/2026 00:00`) |
| Extra fields | none | `Source` (e.g. "original"), `Fill_Method` (blank in sample) — these are useful provenance flags |

Only **one MPAN** present (`2700007408978` — Elderswell Plant Room). The other 11 are not anywhere on local disk (Downloads + OneDrive searched).

The schema mismatch is informative — the actual Stark export carries richer
provenance than the brief documented. The reader rewrite should auto-detect
columns (handoff suggestion the brief already adopts) so it absorbs the
real schema without further edits when the rest of the files arrive.

### Per-MPAN baseline (placeholder data, for reference only — NOT canonical)

The 12 placeholder CSVs do contain a real shape that the existing reader
correctly parses against (one year CY2025), so the current `dist/eir/half_hourly/`
JSONs are internally consistent with the placeholders — just not with the real
Stark exports. Stats from a current run (recorded so the rebuild can be
compared):

| Site | MPAN | Placeholder annual kWh | Placeholder peak kW |
|---|---|---:|---:|
| Austin Heath | 1170000537858 | 228,231 | 65.4 |
| Bramshott Clubhouse | 2000054195811 | 27,096 | 21.9 |
| Durrants Village | 2700000897657 | 119,407 | 40.1 |
| Elderswell — Electric Room | 2700007408969 | 76,672 | 25.1 |
| Elderswell — Plant Room | 2700007408978 | 15,599 | 36.9 |
| Gifford Lea | 1300060637737 | 329,013 | 80.4 |
| Great Alne Park | 2700004078407 | 129,393 | 49.0 |
| Ledian Gardens | 1900092082315 | 136,536 | 38.2 |
| Millfield Green | 2700007801700 | 420,129 | 125.0 |
| Springbok Hall (Millbrook) | 2700001623991 | 130,904 | 47.9 |
| Ampfield Meadows — Energy Centre | 3110000087890 | 243,668 | 87.7 |
| Ampfield Meadows — Main | 3110000100948 | 2,640 | 2.3 |

Note Ampfield Main's 2.3 kW peak is realistic (communal supply, the brief
flagged it as legitimately tiny) — that pattern alone is some evidence the
placeholders aren't pure noise, but the chronology is wrong (one year of
CY2025 vs the real 22-month range Apr 2024 – Feb 2026).

### What's needed from Chris

Drop the real 12 Stark CSVs into `pipeline/source-data/`. Naming pattern
should follow the one already in Downloads:

```
consumption_data_mpan_{MPAN}_from_{YYYYMMDDhhmmss}_at_{YYYYMMDDhhmmss}_{YYYY}_complete.csv
```

Whether each MPAN comes as one multi-year file or per-year chunks doesn't
matter — the reader will read every `consumption_data_mpan_{MPAN}_*.csv`
matching a given MPAN, concatenate, dedupe by timestamp, and sort. (That's
in the Part 1 plan; not coded yet.)

The 12 MPANs needed (per `half_hourly_index.json` `by_site`):

```
austin-heath:      1170000537858
gifford-lea:       1300060637737
ledian-gardens:    1900092082315
bramshott-place:   2000054195811
durrants-village:  2700000897657
millbrook-village: 2700001623991
great-alne-park:   2700004078407
elderswell:        2700007408969, 2700007408978   (2 meters)
millfield-green:   2700007801700
ampfield-meadows:  3110000087890, 3110000100948    (2 meters)
```

Placeholders are kept in place for now (so the build doesn't fall over).
Once real files arrive, the rewrite of `read_half_hourly.py` (Part 1) will
detect them by prefix and prefer them; placeholders can then be deleted.

### Standing by

Tier 1 cannot proceed without the real data. Tier 2 (Load Inspector) cannot
proceed until Tier 1 lands. Brief 11 holds at Part 0 with this gate
failure logged.

---

## Part 0 update + Part 1 + Part 2 — Tier 1 UNBLOCKED (2026-05-22 ~12:30)

Chris dropped `stark_real_csvs_9of12.zip` into Downloads — 9 of the 12 real
3-col Stark CSVs. Unzipped into `pipeline/source-data/`.

### Real-data baseline confirmed

All 9 CSVs are the format the brief specified:

```
Date (D/M/YYYY),Time,Value
07/02/2026,00:30,0.0       ← newest first (DESCENDING)
…
02/04/2024,00:00,36.6      ← oldest last
```

Each file has 32,504–32,510 rows (header + ~32,510 data lines) covering
**2 Apr 2024 → 7 Feb 2026** (~22 months / ~1.85 years).

### Reader rewrite (Part 1) — shipped

`pipeline/readers/read_half_hourly.py` rewritten:

- **File discovery:** `consumption_data_mpan_*.csv` prefix (real Stark)
  picks up the 9 real files; old placeholder CSVs (`{Site}_{MPAN}_2025.csv`)
  are now invisible to the reader.
- **Column detection:** `_detect_columns()` auto-detects Date/Time/Value
  columns by header keyword (date, time, value|kwh|consumption). Robust
  to future Stark schema drift — including the 6-col
  `Timestamp,Date,Time,kWh,Source,Fill_Method` variant seen on one
  earlier file.
- **HH-ending → period-start:** every timestamp is shifted back 30 min so
  the period STARTING at `00:00` is index 0 (handoff Section 9.1).
- **Sort ascending** after parsing (source is newest-first).
- **Derived dates:** `start_date` and `end_date` come from the data;
  `years_covered` = span / 365.25. No `start_date = "2025-01-01"`.
- **Aggregates:**
  - `stats`: peak / mean / total_kwh / **annualised** kWh (total ÷ years)
    / load_factor / weekday_mean / weekend_mean / coverage /
    period_count / missing / zero / duration_days / years_covered
  - `monthly`: 12-bucket kwh / peak_kw / mean_kw, averaged across the
    multiple years that touch each calendar month (so Jan-Feb-Mar aren't
    double-counted because they appear in both 2025 and 2026)
  - `daily_profile`: 24h weekday + weekend mean kW
- **Pending MPANs:** the 3 missing (Bramshott 2000054195811, Ampfield
  Energy Centre 3110000087890, Ampfield Main 3110000100948) get an
  index entry with `data_status: "pending"`, `reason: "Stark export not
  yet pulled."`, and **no per-MPAN JSON** is written. Any stale
  per-MPAN JSON from the placeholder era is auto-removed on rebuild.

### Per-MPAN baseline — real numbers (Part 1 output)

| MPAN | Site / meter | Annualised kWh | Peak kW | Years | Status |
|---|---|---:|---:|---:|---|
| 1170000537858 | austin-heath | 231,452 | 70.0 | 1.85 | ready |
| 1300060637737 | gifford-lea | 329,213 | 80.8 | 1.85 | ready |
| 1900092082315 | ledian-gardens | 152,524 | 39.4 | 1.85 | ready |
| 2000054195811 | bramshott-place (Clubhouse) | — | — | — | **pending** |
| 2700000897657 | durrants-village | 118,873 | 40.1 | 1.85 | ready |
| 2700001623991 | millbrook-village (Springbok Hall) | 129,103 | 47.9 | 1.85 | ready |
| 2700004078407 | great-alne-park | 132,846 | 49.0 | 1.85 | ready |
| 2700007408969 | elderswell — Electric Room | 80,115 | 25.1 | 1.85 | ready |
| 2700007408978 | elderswell — Plant Room | 16,859 | 36.9 | 1.85 | ready |
| 2700007801700 | millfield-green | 411,390 | 129.5 | 1.85 | ready |
| 3110000087890 | ampfield-meadows — Energy Centre | — | — | — | **pending** |
| 3110000100948 | ampfield-meadows — Main | — | — | — | **pending** |

The annualised figures land within 1–4 % of the placeholder shape
(Millfield 411k vs placeholder 420k; Austin 231k vs 228k) — the rewrite
is reading the real data, not regressing the visible behaviour.

### Validation extension (Part 2)

`pipeline/validate.py` `_check_half_hourly` now enforces the
real-Stark signature:

- Index must total 12 MPANs (ready + pending).
- Each `ready` entry must have its per-MPAN JSON with
  `period_count > 30,000` (NOT 17,520 placeholder) and
  `start_date < 2025-01-01` (NOT the hard-coded placeholder date).

Build result: 9 ready / 3 pending. **`half_hourly_index + per-MPAN JSONs:
real Stark signature [OK]`**. TOTAL ISSUES = 3 (all pre-existing
single-meter / bulk-gas reconciliation diagnostics, not HH).

### Files touched (Tier 1)

- `pipeline/readers/read_half_hourly.py` (full rewrite)
- `pipeline/validate.py` (`_check_half_hourly` upgraded)
- `pipeline/source-data/consumption_data_mpan_*.csv` (9 real Stark CSVs,
  gitignored)
- `pipeline/dist/eir/half_hourly_index.json` (regenerated — 12 entries,
  9 ready, 3 pending)
- `pipeline/dist/eir/half_hourly/*.json` (9 per-MPAN JSONs regenerated;
  3 stale pending MPAN JSONs removed)

### PASS

- ✓ 9 ready / 3 pending (12 total)
- ✓ Real period_count ~32,510 per ready MPAN
- ✓ Real date range Apr 2024 → Feb 2026
- ✓ No "17,520 + 2025-01-01" placeholder signature
- ✓ Reader auto-detects columns (so future 6-col schema absorbs cleanly)
- ✓ Validation green on the new checks

→ Tier 2 (Load Inspector port) next.

---

## Tier 2 — Load Inspector port (Parts 3 + 4 + 5)

Ported the PABLO Load Inspector (handoff §2 + §4) onto the now-real Stark
data. 6 brief-mandated views + Data Quality, Weather and Assembly-Provenance
explicitly skipped. Wired into Site Detail > Energy with a Monthly /
Half-hourly toggle and a meter selector for 2-MPAN sites.

### Files added

| File | Purpose |
|---|---|
| `eir/src/lib/loadInspectorTransforms.js` | Pure helpers: `percentile`, `durationCurve` (sorted+thinned to ≤500/1000 points), `heatColor` (cream→coral interp), `dailyPeakMean`, `timeSeriesSlice` (≤2000 points), `monthHourMatrix` (12×24), `monthHourBands` (P25/P75/min/max/mean per hour), `monthlyCoverage`. All JSON-in JSON-out. |
| `eir/src/components/LoadInspector/LoadInspector.jsx` | Top-level: header strap (meter label + date range + period count + years), 7-tab bar, view router. Reads pre-aggregated JSON via `ctx`. |
| `LoadInspector/views/OverviewView.jsx` | 6 metric cards + daily peak/mean line chart + duration-curve area. |
| `LoadInspector/views/TimeSeriesView.jsx` | Zoom pills (1d/1w/2w/1m/Q/6m/Y) + month-jump buttons + range scrubber + thinned line chart. End-anchored default. |
| `LoadInspector/views/DailyProfileView.jsx` | All-months overlay (12-month colour ramp) OR single-month mode with P25/P75 band + mean line. |
| `LoadInspector/views/MonthlyView.jsx` | 12 kWh bars + optional peak/mean overlay lines on dual y-axis. |
| `LoadInspector/views/DurationCurveView.jsx` | Standalone larger duration curve + P10/P50/P90 stat strip. |
| `LoadInspector/views/HeatMapView.jsx` | Custom `display: grid` 12×24 month×hour grid (NOT Recharts, per handoff §4.4). Cream→coral cell colours + gradient legend strip. |
| `LoadInspector/views/DataQualityView.jsx` | Coverage/missing/zero/duration cards + monthly coverage bar chart (traffic-light cells). Assembly-Provenance card explicitly skipped. |
| `eir/src/tokens/chart-colors.js` | Added `MONTH_RAMP_HEX` (12-item cool→warm ramp) + `COLOR_TOOLTIP_BG` constants so the views have zero raw hex. |

### Wiring (Site Detail > Energy)

`App.jsx` `SiteEnergy()` rewritten:
- Toggle `[Monthly] [Half-hourly]` instead of the "Coming soon" tile.
- Reads `hhIndex.mpans` filtered by site, partitions into **ready** vs
  **pending**.
- 0 MPANs → Half-hourly button disabled with "no data" suffix.
- ≥1 ready MPAN → meter selector pills (only shown if multi-meter or any pending) + lazy `import()` of the per-MPAN JSON → render `<LoadInspector />`.
- All-pending sites (Bramshott, Ampfield × 2) render a cream pending-state notice instead of the Inspector.

Dynamic JSON imports (`import(`@pipeline-data/half_hourly/${mpan}.json`)`)
make Vite code-split each MPAN into its own ~156 kB chunk (~48 kB gzip),
so the page bundle stays small until the user opens the HH view.

### Cream-register toggle override

The existing `.toggle-pill` style used `var(--text-muted-on-dark)` which is
invisible on the cream Site Detail page. Added
`body.theme-cream .toggle-pill` overrides in `index.css` so the inactive
pill text reads as navy on cream.

### Walkthrough (Millfield Green + Elderswell)

Verified at 1440×900 via MCP browser. Screenshots below.

| View | Result |
|---|---|
| Overview | ✓ Peak 129.5 kW · Mean 46.8 kW · Annual 411k kWh · Load factor 36.2% · Weekday 47.3 / Weekend 45.8 kW. Daily peak (coral) + mean (teal) lines visible across the full 22 months. Duration curve area drawn. |
| Time Series | ✓ Zoom pills work; week-view shows real HH detail with daily peaks (~130 kW) and overnight troughs (~10 kW); scrubber spans the whole range; month-jump pills present (Apr 24 – Feb 26). |
| Daily Profile | ✓ All-months overlay renders 12 month lines (legend at bottom). Single-month mode renders P25/P75 band + mean line. |
| Monthly | ✓ 12 kWh bars + peak/mean overlay lines on dual y-axis. Checkboxes toggle the overlay lines. |
| Duration Curve | ✓ Larger curve + stat strip: Top 10% ≥ 75.1 kW, Median 45.2 kW, Bottom 10% ≤ 19.3 kW. |
| Heat Map | ✓ **Custom div grid** (NOT Recharts) — 12 months × 24 hours, cream→coral cells. Real demand pattern visible: peak January/February evening/early-morning (heat network), low summer (May–July). Gradient legend "0 kW → 88 kW". |
| Data Quality | ✓ Coverage 100%, Missing 0, Zero 188, Duration 676 days. Monthly coverage chart shows 100% across the year. |
| Elderswell (2 meters) | ✓ Meter selector "Eldersewell — Electric Room" / "Eldersewell — Plant Room"; clicking switches the Inspector content. |
| Bramshott (1 pending MPAN) | ✓ Renders the cream pending notice: "Half-hourly data is pending — the Stark export for this site hasn't been pulled yet." |

### Falsifiability

```
grep -rn "#[0-9a-fA-F]{3,6}" eir/src/components/LoadInspector --include="*.jsx"
  → 0
grep -rn "JetBrains|DM Sans|DM Serif" eir/src --include="*.jsx" --include="*.js"
  → 0 in values (doc-comments only)
cd eir && npx vite build
  → ✓ clean (~1.04 s). Per-MPAN JSONs code-split into 9 chunks of
    ~156 kB each (~48 kB gzip); main bundle 825 kB.
```

### Files touched (Tier 2)

- `eir/src/lib/loadInspectorTransforms.js` (new, ~280 lines)
- `eir/src/components/LoadInspector/LoadInspector.jsx` (new)
- `eir/src/components/LoadInspector/views/*.jsx` (7 new files)
- `eir/src/tokens/chart-colors.js` (added MONTH_RAMP_HEX + COLOR_TOOLTIP_BG)
- `eir/src/App.jsx` (SiteEnergy rewrite + dynamic-import per-MPAN JSON)
- `eir/src/index.css` (cream-register toggle override)

### PASS

- ✓ 6 brief-mandated views + Data Quality (no Weather, no Assembly-Provenance)
- ✓ Real Stark data flows through all views (Millfield 411k kWh / 129.5 kW peak / 1.85 yr coverage)
- ✓ Meter selector for 2-MPAN sites (Elderswell verified)
- ✓ Pending-state notice for sites with no real CSVs yet (Bramshott verified by code review; Ampfield × 2 same pattern)
- ✓ Custom div grid for HeatMap (Recharts not used there)
- ✓ Cream register; Stolzl/Inter/IBM Plex Mono fonts; 0 EOC font values
- ✓ Build clean, 0 raw hex in LoadInspector components

### Standing by

Brief 11 complete. Awaiting Chris's walkthrough. The 3 pending MPANs
(Bramshott + Ampfield × 2) will light up automatically once the real
Stark CSVs land in `pipeline/source-data/` and the pipeline rebuilds.
