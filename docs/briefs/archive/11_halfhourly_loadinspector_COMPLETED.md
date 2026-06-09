# Brief 11 — Half-hourly: Stark reader fix + PABLO Load Inspector port

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. The largest remaining workstream. Two tiers — fix the data first, then build the visualisation on it.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no Chris checkpoints. Push after each tier. Chris walks through on completion.

---

## ⚠️ Tier order matters — data integrity first

**TIER 1 — Stark reader fix (Parts 0–2).** The current half-hourly JSONs are built from the WRONG data — placeholder/old 2-column CSVs, not the real Stark exports. The Load Inspector must NOT be built on top of fake data. Fix the reader, rebuild the JSONs from the real 3-column Stark files, verify the numbers are real, **then** build the visualisation. Push after Tier 1.

**TIER 2 — Load Inspector port (Parts 3–5).** Port the PABLO Load Inspector (6 of 8 views) onto the now-real data. Wire into Site Detail > Energy > Half-hourly. Push at close.

If Tier 1 reveals the real CSVs aren't present, STOP after Tier 1 diagnostics and log it — do not build the Inspector on placeholder data.

---

## The bug being fixed (confirmed)

`pipeline/readers/read_half_hourly.py` currently:
- reads `row[1]` as the value — but the real Stark format is **3 columns** (`Date (D/M/YYYY), Time, Value`), so `row[1]` is the **Time** column, not the value
- hard-codes `start_date = "2025-01-01"` instead of deriving it from the data
- produces exactly 17,520 periods (one year) when the real files have **~32,510 rows** (~22 months, April 2024 → February 2026)

Because the old run used different (placeholder) CSVs, the output looked plausible and passed — the classic "looks right, isn't right" trap. This brief reads the real source of truth.

**Real Stark format (verified):**
```
Date (D/M/YYYY),Time,Value
07/02/2026,00:30,0.0      ← newest first (DESCENDING)
07/02/2026,00:00,0.0
06/02/2026,23:30,45.8
...
02/04/2024,00:30,47.6
02/04/2024,00:00,36.6      ← oldest last
```
- 3 columns, header row present
- DESCENDING chronology (newest first) — must sort ascending
- Date `DD/MM/YYYY`, Time `HH:MM`
- **HH-ending convention:** `00:30` is the half-hour *ending* at 00:30 (i.e. starting 00:00). The Load Inspector treats sample `i` as *starting* at `T0 + i×30min` — so when converting, the period starting at 00:00 is indexed first. (Handoff Section 9.1.)
- ~32,510 rows per file = ~677 days

**The 12 MPANs across 10 sites** (from `half_hourly_index.json` by_site):
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
The real CSVs are named `consumption_data_mpan_{MPAN}_from_*.csv` in `pipeline/source-data/`.

---

## Reference

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **`docs/briefs/LOAD_INSPECTOR_HANDOFF.md`** (in repo, 43KB) — the canonical Load Inspector spec with full PABLO source inline. Sections used: 2 (views), 3.1/3.2 (data shape + pre-processing), 4.1/4.2/4.3/4.4 (component + Recharts + heatmap), 6 (controls), 8 (visual style), 9 (gotchas: HH-ending, leap-year, DST, weekday classification). **Read in full before Tier 2.**
3. The existing (broken) `pipeline/readers/read_half_hourly.py`.
4. This brief at `docs/briefs/active/11_halfhourly_loadinspector.md`

---

## BEFORE DOING ANYTHING

0. Reconciliation (Rule 8): `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md`, `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 Land brief at `docs/briefs/active/11_halfhourly_loadinspector.md`, update current.md, quote title + the Tier-order block back. Commit `Brief 11 land: half-hourly reader fix + Load Inspector`.

1. **Confirm the REAL Stark CSVs are present and in the right format.** This is the gating check:
   ```bash
   ls pipeline/source-data/consumption_data_mpan_*.csv | wc -l        # expect ~12
   head -3 pipeline/source-data/consumption_data_mpan_2700007801700_*.csv
   ```
   The head must show 3 columns `Date (D/M/YYYY),Time,Value`. **If it shows 2 columns (old placeholder), STOP — escalate to STATUS.md: "real Stark CSVs not in source-data, Tier 1 cannot proceed."** Do not build on placeholder data.

2. **Confirm the handoff** at `docs/briefs/LOAD_INSPECTOR_HANDOFF.md`. If absent, escalate (Tier 2 depends on it).

3. Read the broken reader + the handoff (Sections 2, 3, 4, 9 at minimum). Begin Part 0.

---

## Scope statement

In scope: rewrite `read_half_hourly.py` for the real 3-col Stark format; rebuild 12 per-MPAN JSONs with real ~22-month data + correct aggregates; port PABLO Load Inspector (6 of 8 views — skip Weather + leave Data Quality's Assembly-Provenance card out); wire into Site Detail > Energy > Half-hourly toggle with meter selector for 2-MPAN sites.

Out of scope (log + continue): Weather view (handoff 2.8 — needs external weather fetch, PABLO-specific); waste (Brief 9); map polish (Brief 10); the deferred map card/pulse work. No emission-factor or carbon changes.

---

## Operational mode

Plough-through, tier order, push after each tier. Escalate (log + stop) for: real CSVs absent/wrong format (Tier 1 gate); handoff missing; a reader spot-check off by >5% from a hand-calc; build fails at a push point; PASS unmet after 15 min + 3 approaches. Otherwise keep going.

---

## Principles

1. **Read the source of truth.** Parse the real 3-col CSVs; derive dates from data; never hard-code `start_date`. This is the whole point of Tier 1.
2. **Honest data only.** If a meter's data is genuinely sparse/short, the aggregates reflect that — don't pad to 17,520. Real files are ~32,510 rows (~22 months); annualise where the handoff expects annual figures, and record the true coverage.
3. **HH-ending → start-of-period.** Apply the Section 9.1 convention once, consistently, and document it.
4. **IVG fonts + cream register** in the Instpector (Site Detail is cream). Recharts in IVG palette (coral/rose/teal/amber). HeatMap = custom flex/div grid, NOT Recharts (handoff 4.4). No JetBrains Mono / DM fonts.
5. **No `npm install` from Claude Code** — if a new dep is needed (none expected; Recharts already present), add to package.json only.
6. Browser-verify at Part 5.

---

# TIER 1 — Stark reader fix

### Part 0 — Diagnostics + reader rewrite plan

**Files:** audit doc `docs/audit/11_halfhourly_loadinspector.md` (new).

**Steps:**
0.1 For each of the 12 CSVs: confirm 3-col format, count rows, note first + last date (after recognising descending order). Record per-MPAN in the audit doc — this is the real-data baseline.
0.2 Note any anomalies: Ampfield Main (`3110000100948`) is legitimately tiny (~2.3 kW peak — communal supply), not a bug. Flag genuinely short/sparse files.

**Commit:** `Brief 11 Part 0: HH diagnostics — real Stark CSV baseline per MPAN`

---

### Part 1 — Rewrite read_half_hourly.py for real Stark format

**Files:** `pipeline/readers/read_half_hourly.py`, audit doc.

**Steps:**

1.1 **Parse function** — replace `_parse_csv`:
- `csv.DictReader`; auto-detect columns by header keyword (`date`, `time`, `value`) so future Stark exports with slightly different headers don't break
- Parse `DD/MM/YYYY` + `HH:MM`; build timestamp; apply HH-ending → start-of-period (subtract one 30-min interval so the period starting 00:00 indexes first) per handoff 9.1
- Collect `(timestamp, value)`, skip unparseable rows (count them)
- **Sort ASCENDING** (source is descending)
- Return `(hh_data, start_date, end_date, period_count)` with `start_date` = real first timestamp

1.2 **Remove the hard-coded `start_date = "2025-01-01"`** entirely. Derive from data.

1.3 **Aggregates** (handoff Section 3.2) — compute per MPAN:
- stats: `peak_kw`, `mean_kw`, `annual_kwh` (annualised from the ~22-month set: total kWh ÷ years_covered), `load_factor` (mean/peak), `weekday_mean`, `weekend_mean`, `coverage` (valid/total), `period_count`, `missing_periods`, `zero_periods`, `duration_days`, `years_covered`
- monthly: 12-month `kwh` / `peak_kw` / `mean_kw`, averaged across the years the data spans
- daily_profile: 24-hour weekday + weekend mean kW
- Weekday classification per handoff 9.4; handle leap-year + DST per 9.2/9.3 (don't assume exactly 17,520 — the real files span ~22 months; compute days from actual timestamps, don't `floor(len/48)` assuming 365)

1.4 **Per-MPAN JSON** at `pipeline/dist/eir/half_hourly/{mpan}.json`:
```json
{
  "mpan": "...", "site_id": "...", "meter_label": "...",
  "interval_hours": 0.5,
  "start_date": "2024-04-02", "end_date": "2026-02-07",
  "years_covered": 1.85,
  "hh_data": [ ... ],
  "stats": { ... }, "monthly": { ... }, "daily_profile": { ... },
  "data_status": "ready"
}
```

1.5 Keep `meter_label` sensible per site (e.g. Elderswell's two: "Electric Room" / "Plant Room"; Ampfield's two: "Energy Centre" / "Main"). Use existing labels from the current index if present.

**PASS (spot-checks — hand-calc against the CSV, within 5%):**
- Each MPAN's JSON has ~32,510 periods (NOT 17,520), real `start_date` ≈ 2024-04-02, real `end_date` ≈ 2026-02-07
- Millfield Green (`2700007801700`): peak/mean plausible for a clean site
- Ampfield Main (`3110000100948`): peak ~2.3 kW (tiny, real)
- No MPAN still showing the placeholder 17,520 / 2025-01-01 signature

**Commit:** `Brief 11 Part 1: read_half_hourly.py — real 3-col Stark format, real dates, real aggregates`

---

### Part 2 — Rebuild index + integrate + PUSH (Tier 1 done)

**Files:** `pipeline/dist/eir/half_hourly_index.json`, `pipeline/build.py` (confirm called), `pipeline/validate.py`, audit doc.

**Steps:**
2.1 Rebuild `half_hourly_index.json`: 12 MPAN entries with real `annual_kwh` + `peak_kw` + `data_status: "ready"`, plus the `by_site` map (unchanged structure — 10 sites, Elderswell + Ampfield with 2 each).
2.2 Extend `validate.py`: each HH JSON has period_count > 30,000; start_date < "2025-01-01"; no JSON with the 17,520/2025-01-01 placeholder signature.
2.3 `python pipeline/build.py` — clean rebuild, validation 0 issues.
2.4 **PUSH.** STATUS.md: "Tier 1 complete — HH data now real (was placeholder)".

**PASS:** 12 JSONs real; index real; validation passes; pushed.

**Commit:** `Brief 11 Part 2: rebuild HH index + validation — Tier 1 (real data) pushed`

---

# TIER 2 — Load Inspector port

### Part 3 — Transforms + LoadInspector shell + first 3 views

**Files:** `eir/src/lib/loadInspectorTransforms.js` (new), `eir/src/components/LoadInspector/LoadInspector.jsx` (new) + `views/{OverviewView,TimeSeriesView,DailyProfileView}.jsx`, `MonthJumpButtons.jsx`, audit doc.

**Steps:**
3.1 **Transforms** (handoff 4.2/4.3) — port verbatim into `loadInspectorTransforms.js`: `percentile(arr,p)`, duration-curve sort+thin, heat-colour interpolation (recolour cream→coral for IVG), time-axis tick helpers.
3.2 **LoadInspector.jsx** (handoff 4.1) — props `{ hhData, intervalHours, startDate, profileName }`; tab state for the 7 views (Weather excluded); tab bar in Stolzl Medium `--text-sm`. Cream register.
3.3 **OverviewView** (2.1) — 6 metric cards + peak/mean time series + duration curve.
3.4 **TimeSeriesView** (2.2) — zoom pills + MonthJumpButtons + day-range scrubber.
3.5 **DailyProfileView** (2.3) — monthly-overlay mode + single-month mode with Min/Max band + P25/P75. MonthJumpButtons shared.
3.6 Recharts in IVG palette (coral primary, rose secondary, teal tertiary, amber alert). All fonts IVG (Stolzl/Inter/IBM Plex Mono).

**PASS:** the 3 views render for a real MPAN (e.g. Millfield Green) without errors; charts show the real ~22-month data; no raw hex; no EOC fonts.

**Commit:** `Brief 11 Part 3: Load Inspector shell + Overview/TimeSeries/DailyProfile views`

---

### Part 4 — Remaining 3 views + Site Detail wiring

**Files:** `views/{MonthlyView,DurationCurveView,HeatMapView,DataQualityView}.jsx`, `eir/src/App.jsx` (Energy sub-tab), audit doc.

**Steps:**
4.1 **MonthlyView** (2.4) — 12 kWh bars + optional peak/mean overlay lines, dual y-axis.
4.2 **DurationCurveView** (2.5) — standalone larger duration curve.
4.3 **HeatMapView** (2.6) — **custom flex/div grid, NOT Recharts** (handoff 4.4). 12×24 (month×hour) or day×hour grid, cream→coral colour scale.
4.4 **DataQualityView** (2.7) — coverage % + monthly coverage bars. **Skip the Assembly-Provenance card** (PABLO-specific). Use the real `stats.coverage` / `missing_periods` / `zero_periods`.
4.5 **Wire into Site Detail > Energy.** Toggle `[Monthly] [Half-hourly]`:
- Monthly = existing chart (unchanged)
- Half-hourly: read `half_hourly_index.json` `by_site[siteId]` → 0 ⇒ "No half-hourly data"; 1 ⇒ load + render `<LoadInspector>`; 2 (Elderswell, Ampfield) ⇒ meter-selector dropdown above the Inspector
4.6 Replace the "Coming soon" tile.

**PASS:** all 6 views render; Millfield Green full set works; Elderswell shows meter selector (2 MPANs); Ampfield too; HeatMap is div-grid not Recharts; Data Quality shows real coverage; no "Coming soon" left.

**Commit:** `Brief 11 Part 4: Monthly/Duration/HeatMap/DataQuality views + Site Detail HH toggle`

---

### Part 5 — Walkthrough + close (→ PUSH)

**Steps:**
5.1 Boot dev server.
5.2 Self-walkthrough (MCP browser, 1440×900, screenshots to `docs/audit/11_screenshots/`):
- Site Detail > Energy > Half-hourly for Millfield Green → all 6 view tabs render, real ~22-month data visible
- Elderswell → meter selector switches between the 2 MPANs
- Ampfield → meter selector; Ampfield Main shows the tiny real load (~2.3 kW), not an error
- Each view: Overview (cards + 2 charts), Time Series (zoom + scrub), Daily Profile (overlay + single-month band), Monthly (bars + lines), Duration Curve, Heat Map (div grid), Data Quality (coverage)
- Cream register throughout; fonts Stolzl/Inter/IBM Plex Mono
- **No page scroll at 1440×900** (Hard Rule 9) — the Inspector fits within the Site Detail page; internal chart areas size to fit
5.3 Falsifiability:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/LoadInspector --include="*.jsx"   # → 0
grep -rn "JetBrains\|DM Sans\|DM Serif" eir/src                                       # → 0
cd eir && npm run build                                                               # → clean
```
5.4 Archive brief → `archive/11_halfhourly_loadinspector_COMPLETED.md`; repoint current.md; STATUS.md final; push.

**PASS:** 6 views work on real data for 1-MPAN and 2-MPAN sites; cream register; correct fonts; no scroll; build clean; pushed.

**Commit:** `Brief 11 close: half-hourly live — real Stark data + Load Inspector (6 views)`

---

## What MUST NOT happen
- No building the Load Inspector on placeholder data — Tier 1 gate is hard
- No hard-coded start_date — derive from data
- No `npm install` from Claude Code
- No Weather view; no Assembly-Provenance card
- No Recharts for the heat map (custom div grid per handoff 4.4)
- No JetBrains Mono / DM fonts
- No page scroll at 1440×900
- No partial commits within a Part; push after Tier 1 (Part 2) and at close (Part 5)

## When to escalate (log + stop)
- Real Stark CSVs absent or 2-col placeholder (Tier 1 gate — stop, do not build on fake data)
- Handoff missing
- A reader spot-check off >5% from hand-calc (parsing bug — diagnose)
- Build fails at a push point
- No-scroll breaks and can't be recovered
- 15 min stuck + 3 approaches

## Final report
1. HEAD SHA + tiers landed
2. Tier 1: reader parses real 3-col format? 12 JSONs ~32,510 periods, real dates (not 17,520/2025-01-01)?
3. Spot-checks within 5% (Millfield, Ampfield Main ~2.3kW)?
4. Tier 2: 6 views render on real data? meter selector for Elderswell + Ampfield?
5. HeatMap div-grid (not Recharts)? Weather + Assembly-Provenance correctly skipped?
6. Cream register + IVG fonts (0 EOC font strings)?
7. No scroll at 1440×900?
8. Pushes after Tier 1 + close?
9. grep raw-hex = 0? build clean? validation 0 issues?
10. Brief archived, current.md repointed?
11. Known issues?
12. Standing by for Chris.

## Notes for Claude Code
Tier 1 is the integrity gate — the current HH JSONs are fake (placeholder 2-col data, hard-coded 2025-01-01). Read the REAL 3-col Stark CSVs, derive everything from them, verify the numbers are real BEFORE building the Inspector. The spot-checks (32,510 periods, Ampfield Main ~2.3kW) are how you know you're on real data. The handoff is the spec for Tier 2 — port its source, adapt fonts to IVG, heat map stays a div grid. Confirm receipt (title + Tier-order block), then begin Part 0.
