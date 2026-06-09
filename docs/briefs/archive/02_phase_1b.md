# IVG ESG Tool — Phase 1B overnight brief

**Author:** Chris Scott (via Claude Chat, 21 May 2026, ~7:30pm)
**For:** Claude Code (working unsupervised overnight on the IVG ESG Tool repo)
**Estimated runtime:** 10-14 hours
**Scope:** Full UI restructure to no-scroll dashboard + 5 data wirings (water/waste fix, carbon view, Sycous integration, half-hourly Load Inspector, GRESB stub) + new 4-section navigation with sub-tabs + Site Detail sidebar + functional 4-quadrant landing infographic

**Demo context:** Chris demos this to IVG (Rob Preston, Jez Conen, Laura Bagnall) on **22 May (tomorrow)**. The audience is mixed: Rob/Laura are operations, Jez is technical/GRESB lead. The deliverable transforms a working prototype (Phase 1A) into a polished operational dashboard.

**Critical context — read this twice:**
- Phase 1A shipped tonight: working pipeline + 3 page shell (Portfolio, Site Detail, Insights). Live screenshots reviewed — visual style is matching NZA carbon inventory reports.
- Phase 1A commits are **local on Chris's machine** at the time of writing this brief. Chris will push Phase 1A to main as the first action in the Phase 1B session, then you start from a clean push.
- Phase 1B is a **bigger swing than Phase 1A** — roughly double the scope. Tiered chunks let Claude Code ship the highest-value items first.

This brief is large because Chris will be working alongside you (he's awake tonight). The size does not remove checkpoints — every chunk has explicit PASS criteria and Claude Code does not proceed past a failure. If anything is unclear or you get stuck, **stop and write the blocker into STATUS.md**. Do not speculate-fix.

---

## Read order at session start

In this exact order, every time you start or resume a session:

1. `CLAUDE.md`
2. `STATUS.md` (will show Phase 1A complete + Phase 1B starting)
3. This brief (`docs/briefs/phase-1b-overnight-brief.md`)
4. `docs/briefs/phase-1a-overnight-brief.md` (the previous brief — gives you visual conventions in Appendix C)
5. `docs/briefs/LOAD_INSPECTOR_HANDOFF.md` (the PABLO half-hourly extraction — required for chunk 18)
6. Existing readers in `pipeline/readers/` (study the pattern before writing new ones)
7. Existing components in `eir/src/components/` (study what Phase 1A built before extending)

If you crash, restart, or run out of context mid-session: re-read in the same order.

---

## What's already built (Phase 1A — do not break)

**Pipeline:**
- 4 Phase 0 readers + 3 Phase 1A readers (Ecotricity electricity_monthly, mpan_register, reconciliation, plus RFI register)
- `pipeline/site_coordinates.json` (committed static data)
- Validation extended with cross-checks
- 9 JSON files in `pipeline/dist/eir/`: sites, energy, water, waste, portfolio, electricity_monthly, mpan_register, reconciliation, rfi_status

**Shell components:**
- `DataStatusBadge`, `MetricTile`, `UkMap`, `EnergyChart` — all built in Phase 1A
- Top nav (Portfolio | Insights), brand palette tokens, Playfair + Inter fonts
- Landing page (Portfolio overview with map + stat tiles + site list)
- Site Detail page (header + metric tiles + monthly chart + MPAN inventory + data quality)
- Insights page (reconciliation chart + £49k void callout + completeness heatmap)

**Known bug from Phase 1A demo review:**
- Water + waste tiles on Site Detail show "Missing" / "Not yet integrated into Phase 1A" — but the data is sitting in `pipeline/dist/eir/water.json` and `waste.json`, just not being read. Fix in chunk 4.
- Edwalton Office shows "—" for GIA / Units in the All Sites table but has data. Same root cause — field mapping. Fix in chunk 4.

This brief **extends and restructures** what's there. Most of the Phase 1A components are kept; the page layout is what changes.

---

## What you are building (16 chunks)

### Pipeline additions (chunks 2-7)
1. Phase 1A push verification + new branch hygiene
2. Sycous reader (annual sub-metering data, 7 sites covered)
3. Half-hourly reader (12 Stark CSVs → per-MPAN JSON with pre-computed aggregates)
4. Water + waste field-mapping fix (the Phase 1A bug — wires existing JSON into the pages)
5. Carbon emissions data layer (existing energy.json → derived carbon JSON with Scope 1/2/3 breakdown)
6. GRESB Readiness stub data (minimal placeholder JSON — full read on Sunday)
7. Pipeline integration + validation + clean rebuild

### Shell restructure (chunks 8-12)
8. New token system + top-nav rebuild (4 sections: Portfolio | Site | Insights | GRESB)
9. Sub-nav component + dashboard layout primitives (no-scroll viewport, panels)
10. Portfolio section restructure (4 sub-tabs: Overview / Map / Sites / Comparisons)
11. Site Detail section restructure (5 sub-tabs + persistent site sidebar)
12. Insights section restructure (3 sub-tabs)

### Feature pages (chunks 13-18)
13. Landing infographic (4-quadrant grid — the new Portfolio > Overview)
14. Carbon view component (Site Detail > Carbon sub-tab)
15. Sycous coverage panel (Site Detail > Data Quality sub-tab)
16. GRESB Readiness stub page
17. Comparisons view (Portfolio > Comparisons sub-tab)
18. Half-hourly Load Inspector port (Site Detail > Energy sub-tab toggle)

### Final QA (chunk 19)
19. End-to-end QA + local build verification

---

## Tier gates (critical — read carefully)

**Tier 1 — must-have for demo (target: done by midnight BST)**
- Chunks 1-12 (pipeline + restructure)
- Chunk 13 (landing infographic)
- Chunk 16 (GRESB stub)

If any chunk in Tier 1 PASSes, commit immediately and move on. If chunk 9 (dashboard layout primitives) blocks, **stop entirely** — the rest of Tier 1 depends on it.

**Tier 2 — high-value (target: done by 2-3am BST)**
- Chunk 14 (Carbon view)
- Chunk 15 (Sycous panel)
- Chunk 17 (Comparisons)

After Tier 1 is solid, work through Tier 2 in order. If you're running short on time, prefer leaving a sub-tab as "coming soon" stub over half-building it.

**Tier 3 — stretch (target: only if Tier 1+2 done well by 3am BST)**
- Chunk 18 (Half-hourly Load Inspector)

This is the highest-effort visual work in the brief (~6-8 hours per the Load Inspector handoff). **Only attempt if Tier 1+2 PASS by 3am AND remaining time is at least 4 hours**. Otherwise, leave the HH toggle as "Coming soon" — the rest of the demo is strong enough without it.

**Tier 4 — must-do regardless**
- Chunk 19 (Final QA + local build)

After whichever tier you reach, **always do chunk 19**. Don't push to main — local build only. Chris pushes in the morning.

---

## Chunked build plan (PASS criteria per chunk)

> **Stuck rule:** 15 continuous minutes blocked → stop, document blocker in STATUS.md, do not speculate-fix.

> **Test-before-proceed rule:** every chunk has explicit PASS criteria. Run them before declaring PASS. If even one criterion fails, fix or document.

---

### Chunk 1 — Session start, push Phase 1A, plan

**Goal:** Read context, verify Phase 1A is pushed to main, write Phase 1B plan to STATUS.md.

**Steps:**
1. Read CLAUDE.md, STATUS.md, this brief, Phase 1A brief, LOAD_INSPECTOR_HANDOFF.md.
2. Chris should have already done `git push origin main` to push Phase 1A. Verify: `git status` clean, `git log origin/main..HEAD` empty. If commits remain unpushed, **stop and ask Chris to push first**.
3. Verify Vercel auto-deployed Phase 1A: `curl -I https://ivg-esg-tool.vercel.app/` returns 200.
4. Quick visual check of live URL — confirm Portfolio, Site Detail, Insights pages all loading.
5. Update STATUS.md with Phase 1B plan: 19 chunks, tier gates, expected completion times per tier.

**PASS criteria:**
- Phase 1A pushed and live on Vercel
- STATUS.md shows Phase 1B chunk plan
- LOAD_INSPECTOR_HANDOFF.md confirmed present in docs/briefs/

**Commit:** `chunk-1(phase-1b): session start, plan documented`

---

### Chunk 2 — Sycous reader

**Goal:** Build `pipeline/readers/read_sycous.py` to read the Sycous workbook and produce `dist/eir/sycous.json`.

**Source file:** `pipeline/source-data/26003-NZA-XX-XX-CA-X-1004 - IVG_Sycous_data.xlsx` (note the spaces in filename — use glob pattern `*1004*Sycous*`).

**Source workbook structure** (verify in chunk 2 inspection):

The workbook has 5 sheets:
- **1. Summary** — Network → IVG Site mapping (rows 6-12), site-level overview (rows 17-23), detail by site+service (rows 28-39)
- **2. Data Quality** — observation notes per site
- **3. Reconciliation** — Sycous vs arbnco per site (rows 5-18)
- **4. Questions** — questions for Sycous (out of scope)
- **5. Raw Data** — 1049 meter rows, annual readings

**Network → IVG Site mapping** (hard-code if needed, but ideally read from Summary tab):
- Tattenhall → gifford-lea
- Warwick Gates → austin-heath
- Turvey → elderswell
- Chandlers Ford → ampfield-meadows
- Ledian Farm → ledian-gardens
- Horndean → blendworth-hills
- Caddington → millfield-green

**Output structure (`dist/eir/sycous.json`):**
```json
{
  "by_site": {
    "millfield-green": {
      "in_sycous": true,
      "sycous_network": "Caddington",
      "properties_count": 130,
      "meters_count": 133,
      "services_covered": ["Electricity"],
      "by_service": [
        {
          "service": "Electricity",
          "properties": 130,
          "meters": 133,
          "valid_reads": 118,
          "data_quality_pct": 89,
          "annual_kwh": 850000
        }
      ],
      "data_quality_summary": "89% data quality on electricity meters",
      "reconciliation_note": "Aligned — appears as 'Caddington' network. Sycous data present and high quality."
    },
    "bramshott-place": {
      "in_sycous": false,
      "reconciliation_note": "Heat network site with substantial sub-metering but not on Sycous."
    },
    ...
  },
  "portfolio": {
    "sites_with_sycous": 7,
    "sites_without_sycous": 6,
    "total_properties_metered": 669,
    "total_meters": 1049,
    "supply_types": ["Electricity", "Heat & Hot Water", "Heat", "Hot Water", "Cold Water"]
  }
}
```

**For each of the 7 Sycous sites**, populate `by_service` with one row per service the site has (Electricity, Heat & Hot Water, etc.). The annual_kwh per service comes from the Raw Data tab — sum the `Consumption_num` column where Network matches AND Supply Type matches.

**For the 6 sites NOT on Sycous**, `in_sycous: false` plus the reconciliation note from the Reconciliation tab.

**PASS criteria:**
- File exists at `pipeline/dist/eir/sycous.json`
- 13 canonical sites + 2 dev sites = 15 entries (or only 13 if dev sites genuinely not on Sycous — verify against reconciliation tab)
- 7 sites with `in_sycous: true`
- Spot check: Millfield Green has 130 properties, ~89% data quality
- Spot check: Blendworth Hills has 0% valid reads (data quality issue noted)
- Spot check: Bramshott Place `in_sycous: false`

**Commit:** `chunk-2(phase-1b): sycous reader`

---

### Chunk 3 — Half-hourly reader

**Goal:** Build `pipeline/readers/read_half_hourly.py` to read the 12 Stark CSV files and produce a per-MPAN JSON with pre-computed aggregates (per the Load Inspector handoff Section 10 recommendation).

**Source files:** 12 CSV files in `pipeline/source-data/`:
- `Ampfield_Meadows_Energy_Centre_3110000087890_2025.csv`
- `Ampfield_Meadows_Main_3110000100948_2025.csv`
- `Austin_Heath_1170000537858_2025.csv`
- `Bramshott_Clubhouse_2000054195811_2025.csv`
- `Durrants_Village_2700000897657_2025.csv`
- `Elderswell_Electric_Room_2700007408969_2025.csv`
- `Elderswell_Plant_Room_2700007408978_2025.csv`
- `Gifford_Lea_1300060637737_2025.csv`
- `Great_Alne_Park_2700004078407_2025.csv`
- `Ledian_Gardens_1900092082315_2025.csv`
- `Millfield_Green_2700007801700_2025.csv`
- `Springbok_Hall_2700001623991_2025.csv` (this is Millbrook Village's Springbok Hall — site_id = millbrook-village)

**CSV format:**
```
DateTime,Consumption_kWh
Wed 01/01/2025 00:30,27.04
Wed 01/01/2025 01:00,26.16
...
```

17,520 rows per file (48 × 365). DateTime format: `Day DD/MM/YYYY HH:MM`.

**MPAN → Site_ID mapping:**
- 1170000537858 → austin-heath
- 1300060637737 → gifford-lea
- 1900092082315 → ledian-gardens
- 2000054195811 → bramshott-place (the Clubhouse meter)
- 2700000897657 → durrants-village
- 2700001623991 → millbrook-village (Springbok Hall)
- 2700004078407 → great-alne-park
- 2700007408969 → elderswell (Electric Room)
- 2700007408978 → elderswell (Plant Room — same site, two meters)
- 2700007801700 → millfield-green
- 3110000087890 → ampfield-meadows (Energy Centre)
- 3110000100948 → ampfield-meadows (Main)

**Output: one JSON file per MPAN** at `dist/eir/half_hourly/{mpan}.json`:

```json
{
  "mpan": "2700007801700",
  "site_id": "millfield-green",
  "meter_label": "Millfield Green",
  "year": 2025,
  "interval_hours": 0.5,
  "start_date": "2025-01-01",
  "hh_data": [27.04, 26.16, 24.38, ...],
  "stats": {
    "peak_kw": 195.3,
    "mean_kw": 95.8,
    "annual_kwh": 839456,
    "load_factor": 0.49,
    "weekday_mean": 102.1,
    "weekend_mean": 79.5,
    "duration_days": 365,
    "coverage": 1.0,
    "period_count": 17520,
    "missing_periods": 0,
    "zero_periods": 12
  },
  "monthly": {
    "kwh": [62000, 58000, 71000, 65000, 70000, 68000, 67000, 67000, 72000, 71000, 80000, 88000],
    "peak_kw": [180, 175, 195, 185, 170, 165, 168, 170, 175, 178, 188, 195],
    "mean_kw": [83, 85, 95, 90, 94, 95, 90, 90, 100, 95, 110, 118]
  },
  "daily_profile": {
    "weekday_24h": [50, 48, 47, 46, 45, 48, 75, 110, 130, 125, 120, 118, 115, 112, 108, 105, 110, 125, 140, 130, 110, 95, 80, 60],
    "weekend_24h": [45, 43, 42, 41, 40, 42, 55, 70, 85, 90, 90, 88, 85, 82, 80, 78, 82, 92, 100, 95, 85, 70, 60, 50]
  }
}
```

Also produce **one index file** at `dist/eir/half_hourly_index.json`:
```json
{
  "mpans": [
    {"mpan": "2700007801700", "site_id": "millfield-green", "meter_label": "Millfield Green", "annual_kwh": 839456, "peak_kw": 195.3},
    ...
  ],
  "by_site": {
    "millfield-green": ["2700007801700"],
    "elderswell": ["2700007408969", "2700007408978"],
    "ampfield-meadows": ["3110000087890", "3110000100948"],
    ...
  }
}
```

**Implementation:**
- Parse CSVs using Python's `csv` module or pandas
- Parse DateTime as `%a %d/%m/%Y %H:%M` format
- Stark uses **HH-ending** convention (first row is `00:30` = 00:00-00:30) — preserve this; the Load Inspector treats first sample as start of day. Document this in code comments.
- Compute stats per `LOAD_INSPECTOR_HANDOFF.md` Section 3.2 spec
- Output JSON with reasonable indentation but **not** indented inside `hh_data` array (one line per array)

**PASS criteria:**
- 12 files written at `dist/eir/half_hourly/`
- 1 index file at `dist/eir/half_hourly_index.json`
- Spot check: Austin Heath MPAN file has 17520 hh_data values
- Spot check: Millfield Green peak_kw between 100 and 250
- Spot check: Elderswell has 2 entries in the index (Electric Room + Plant Room)
- Stats verified: load_factor = mean_kw / peak_kw within 0.001 tolerance

**Commit:** `chunk-3(phase-1b): half-hourly reader`

---

### Chunk 4 — Water + waste field-mapping fix

**Goal:** Fix the Phase 1A bug where Site Detail tiles + completeness heatmap show water/waste as "Missing" when the data exists in `water.json` and `waste.json`.

**Root cause:** Phase 1A wrote new component code expecting fields like `total_tonnage_t` and `consumption_total_m3` but the existing JSON has `tonnage_total` and `consumption_m3`. Pure field-name mismatch.

**Source JSON (existing — DO NOT MODIFY):**

`water.json` fields per site:
- `consumption_m3` — total annual consumption (m³)
- `data_status` — "confirmed" / "partial" / "missing"
- `data_quality` — "Actual" / "Estimated" / "Mixed" / "Unknown"
- `meters_known`, `meters_with_cy2025_data`
- `cy2025_coverage` — text label
- `completeness` — percentage text
- `key_gaps` — narrative text

`waste.json` fields per site:
- `tonnage_total` — total annual tonnage
- `tonnage_by_stream` — object with `general`, `recycling`, `glass`, `organic`, `cardboard`
- `diversion_rate` — 0..1
- `emissions_scope3_cat5_tco2e` — Scope 3 Cat 5 emissions
- `contractor` — name (e.g. "BIFFA")
- `data_status` — "confirmed" / "partial" / "missing"

**What to fix (in `eir/src/`):**

1. **Site Detail page's water and waste MetricTiles** — read the correct fields:
   ```jsx
   <MetricTile
     label="Water"
     value={formatNumber(water?.consumption_m3)}
     unit="m³"
     status={water?.data_status}
     callout={water?.key_gaps ? `Source: ${water.data_quality}. ${water.cy2025_coverage}` : null}
   />
   <MetricTile
     label="Waste"
     value={formatNumber(waste?.tonnage_total, 1)}
     unit="t"
     status={waste?.data_status}
     callout={waste?.contractor ? `Contractor: ${waste.contractor}. Diversion: ${Math.round((waste.diversion_rate||0)*100)}%` : null}
   />
   ```

2. **Site Detail Data Quality table** — rows for water and waste should show real status:
   - Water row: status from `water.data_status`, source from `water.data_quality`, notes from `water.key_gaps`
   - Waste row: status from `waste.data_status`, source from contractor, notes about tonnage + diversion

3. **Insights data completeness heatmap** — the heatmap cells for Water + Waste columns should pull from `data_status` field, not hard-coded "missing".

4. **All Sites table on Portfolio page** — if any columns reference water or waste status, ensure they read correctly.

5. **Edwalton Office GIA bug** — the "All Sites" table shows "—" for Edwalton's GIA and Units. Check why: probably `identity.total_gia_m2` is null/0 for the office (since it's not measured in m² the same way villages are). If null, display "Office" or the office's known floor area; if zero, show "—" (correct). Document the decision in code comment.

**PASS criteria:**
- Site Detail for Austin Heath shows: Water status "Missing" (correct — `water.json` says missing for Austin Heath), Waste status "Confirmed" (BIFFA contractor)
- Site Detail for Great Alne Park shows: Water 8,548 m³ Partial, Waste tonnage Confirmed
- Site Detail for Millbrook Village shows: Water 1,649 m³ Partial, Waste Missing
- Heatmap shows water+waste cells correctly coloured (not all red)
- Edwalton Office row in table shows actual GIA or a sensible placeholder

**Commit:** `chunk-4(phase-1b): water+waste field mapping fix`

---

### Chunk 5 — Carbon emissions data layer

**Goal:** Produce `dist/eir/carbon.json` from existing energy.json data. No new source reading — this is a derived JSON for the new Carbon view.

**Inputs (from existing energy.json):**
- Per site: `total_electricity_kwh`, `total_gas_kwh`
- Per site: `emissions_actual_tco2e` (Scope 1 + 2 location-based)
- Per site: `emissions_national_avg_tco2e`

**Outputs (per site):**
```json
{
  "by_site": {
    "austin-heath": {
      "scope_1_tco2e": 470.5,        // gas combustion
      "scope_2_tco2e": 87.6,         // grid electricity
      "scope_3_cat13_tco2e": 720.4,  // resident energy (derived from arbnco delta or Sycous if available)
      "total_actual_tco2e": 1278.5,
      "intensity_per_unit": 7.66,     // tCO2e / occupied unit / year
      "intensity_per_m2_gia": 0.0899, // tCO2e / m² / year
      "national_avg_tco2e": 884.7,    // for benchmarking
      "monthly": [/* 12 months total tCO2e, even split if monthly not available */]
    },
    ...
  },
  "portfolio": {
    "scope_1_tco2e": 1820,
    "scope_2_tco2e": 795,
    "scope_3_cat13_tco2e": 4250,
    "total_actual_tco2e": 6865,
    "by_scope_pct": {"scope_1": 26.5, "scope_2": 11.6, "scope_3": 61.9}
  }
}
```

**Scope splitting logic:**
- Scope 1 = gas consumption × natural gas emission factor (use 0.18254 kgCO2e/kWh — UK 2024 standard)
- Scope 2 = electricity (landlord only) × grid factor (use 0.20705 kgCO2e/kWh — UK 2024 grid average)
- Scope 3 Cat 13 = derived resident electricity × grid factor + (if heat network) resident heat × heat network factor

For Phase 1B, use simplified factors — accuracy improves once full SBTi work is done. Constants:
- `GAS_FACTOR = 0.18254` (kgCO2e/kWh)
- `ELEC_GRID_FACTOR = 0.20705` (kgCO2e/kWh — based on UK 2024 average from BEIS)

**Monthly carbon**: if monthly electricity/gas data exists (from `electricity_monthly.json`), apply factors per month. Otherwise, distribute annual evenly across 12 months and flag in a comment.

**PASS criteria:**
- File exists
- 13 sites with carbon breakdown
- Portfolio totals make sense (Scope 3 > Scope 2 > Scope 1 for a residential portfolio with bulk meters)
- Spot check: Austin Heath Scope 1 ≈ 470 tCO2e (matches gas consumption × factor)

**Commit:** `chunk-5(phase-1b): carbon emissions data layer`

---

### Chunk 6 — GRESB Readiness stub data

**Goal:** Minimal stub JSON for the GRESB section. Full read on Sunday.

**Output: `dist/eir/gresb_stub.json`:**
```json
{
  "current_score_2025": 52,
  "target_score_2026": 62,
  "portfolio_change": {
    "assets_2025": 3,
    "assets_2026": 11
  },
  "indicators_summary": {
    "data_coverage": {"status": "improving", "target_points": 5.5, "current_progress_pct": 35},
    "policies": {"status": "in_progress", "target_points": 4.3, "current_progress_pct": 50},
    "green_leases": {"status": "scoping", "target_points": 5.0, "current_progress_pct": 10},
    "esg_fit_out_guides": {"status": "not_started", "target_points": 3.0, "current_progress_pct": 0},
    "breeam_in_use": {"status": "scoping", "target_points": 8.5, "current_progress_pct": 0}
  },
  "coming_soon_message": "Full GRESB Readiness scorecard arrives Sunday with indicator-by-indicator detail and submission roadmap."
}
```

**PASS criteria:**
- File exists
- Valid JSON

**Commit:** `chunk-6(phase-1b): gresb stub data`

---

### Chunk 7 — Pipeline integration + clean rebuild

**Goal:** Wire new readers into `pipeline/build.py`. Extend validation. Clean rebuild.

**Steps:**
1. Add to `pipeline/build.py`: imports and calls for `read_sycous`, `read_half_hourly`, `build_carbon`, `build_gresb_stub`.
2. Extend `pipeline/validate.py`:
   - sycous.json has 13+ site entries, exactly 7 with `in_sycous: true`
   - half_hourly_index.json has 12 MPANs across 8 sites (austin-heath, gifford-lea, ledian-gardens, bramshott-place, durrants-village, millbrook-village, great-alne-park, elderswell × 2, millfield-green, ampfield-meadows × 2)
   - carbon.json portfolio total > 5000 tCO2e
3. Delete `pipeline/dist/eir/*.json` and any half_hourly/ folder. Run `python pipeline/build.py`.
4. Confirm:
   - All previous 9 JSON files regenerate (sites, energy, water, waste, portfolio, electricity_monthly, mpan_register, reconciliation, rfi_status)
   - 4 new JSON files (sycous, carbon, gresb_stub, half_hourly_index)
   - 12 new files in `dist/eir/half_hourly/`
   - Validation 0 issues

**PASS criteria:**
- Clean rebuild from empty dist produces all expected files (9 + 4 + 12 = 25 JSON files total in pipeline/dist/eir/)
- Validation TOTAL ISSUES: 0
- Build log shows all readers ran

**Commit:** `chunk-7(phase-1b): integrate new readers, clean rebuild`

---

### Chunk 8 — Token system + top-nav rebuild

**Goal:** Expand the CSS token system. Rebuild the top navigation to support 4 sections (Portfolio | Site | Insights | GRESB).

**Token additions (in `eir/src/index.css` under `:root`):**

```css
/* Add to existing tokens */

/* Viewport */
--app-min-height: 100vh;
--app-content-max-width: 1600px;

/* Top nav */
--topnav-height: 56px;
--topnav-bg: var(--bg-dark);  /* slightly darker than page */
--topnav-text: var(--text-on-dark);

/* Sub nav */
--subnav-height: 48px;
--subnav-bg-on-dark: rgba(255,255,255,0.04);
--subnav-bg-on-cream: rgba(0,0,0,0.04);
--subnav-active-underline: var(--color-accent);

/* Sidebar */
--sidebar-width: 240px;
--sidebar-bg-on-dark: rgba(0,0,0,0.25);
--sidebar-item-active: rgba(227, 93, 74, 0.15);

/* Panels */
--panel-bg-on-dark: rgba(255,255,255,0.03);
--panel-bg-on-cream: rgba(0,0,0,0.02);
--panel-border-on-dark: rgba(255,255,255,0.06);
--panel-border-on-cream: rgba(0,0,0,0.06);
--panel-radius: 12px;
--panel-padding: 24px;
```

**Top nav rebuild:**

The top nav should now be 4 sections: Portfolio | Site | Insights | GRESB.

**Important: "Site" is only enabled when a site is selected.** If you land on `/` (Portfolio), the Site tab in the top nav is greyed out / disabled. Once you click into a site (e.g. from the map or table), the Site tab becomes active and clickable.

Implementation: track `currentSiteId` in app state. Top nav "Site" link:
- If `currentSiteId` is null: greyed, disabled, tooltip "Select a site from Portfolio to enable"
- If `currentSiteId` is set: clickable, navigates to `/site/{currentSiteId}/overview`

Routes:
- `/` → Portfolio > Overview (default landing)
- `/portfolio/{overview|map|sites|comparisons}` → Portfolio sub-tabs
- `/site/{siteId}/{overview|energy|carbon|mpans|data-quality}` → Site sub-tabs
- `/insights/{reconciliation|voids|data-quality}` → Insights sub-tabs
- `/gresb` → GRESB stub

**PASS criteria:**
- New tokens visible in DevTools on `:root`
- Top nav shows 4 sections
- Site nav greyed when no site selected
- Active section highlighted with coral pill background
- Logos right-aligned (IVG × NZA)

**Commit:** `chunk-8(phase-1b): token system + top-nav rebuild`

---

### Chunk 9 — Sub-nav + dashboard layout primitives

**Goal:** Build the layout primitives that every page will use. **This is the highest-risk structural chunk** — if it goes wrong, every subsequent page goes wrong too.

**Components to build:**

**1. `SubNav` component** (`eir/src/components/SubNav.jsx`):
- Horizontal strip of clickable tabs
- Active tab has coral underline + coral text
- Inactive tabs are muted with hover state
- Receives `items` prop (array of `{label, path}`) and current path
- Optional `theme` prop (`'dark'` or `'cream'`) for the right styling

**2. `DashboardLayout` component** (`eir/src/components/DashboardLayout.jsx`):
- Wraps every page
- Fills viewport (`height: 100vh`, no page scroll possible)
- Renders top nav + sub-nav + main content area
- Main content area has `overflow: hidden` — child panels must handle their own scrolling
- Props: `topNav`, `subNav` (or null), `sidebar` (or null), `children`

**3. `Panel` component** (`eir/src/components/Panel.jsx`):
- Container for content blocks
- Background: `var(--panel-bg-on-dark)` or `var(--panel-bg-on-cream)`
- Border: `1px solid var(--panel-border-*)`
- Radius: `var(--panel-radius)`
- Padding: `var(--panel-padding)`
- Props: `title` (optional, renders as Playfair sub-heading), `theme`, `scroll` (boolean, makes content scrollable inside)
- Children: whatever the panel contains

**4. `Sidebar` component** (`eir/src/components/Sidebar.jsx`):
- Persistent left sidebar used on Site Detail
- Fixed width `var(--sidebar-width)`
- Shows list of 13 sites (sorted by display_name)
- Each item: site name + small completeness indicator dot (green/amber/red/grey from `data_status` of electricity_landlord)
- Active site highlighted with coral-tinted background
- Click → navigate to that site's Overview sub-tab
- Scrollable if it overflows

**Layout pattern:**

For Portfolio / Insights / GRESB pages:
```
<DashboardLayout>
  <TopNav />
  <SubNav items={sectionSubTabs} />
  <main>
    {/* Page content fills remaining viewport */}
  </main>
</DashboardLayout>
```

For Site Detail page:
```
<DashboardLayout>
  <TopNav />
  <SubNav items={siteSubTabs} />
  <div style={{display: 'flex', flex: 1}}>
    <Sidebar siteList={sites} activeSiteId={siteId} />
    <main style={{flex: 1, overflow: 'hidden'}}>
      {/* Site content */}
    </main>
  </div>
</DashboardLayout>
```

**Critical constraint:** every page must fit `100vh` without page scroll. Use `flex: 1`, `overflow: hidden`, and `overflow-y: auto` on inner panels only.

**Test this works at multiple viewport sizes:** 1366×768, 1440×900, 1920×1080. If it breaks at 1366×768, that's a problem.

**PASS criteria:**
- `npm run build` succeeds
- Open in browser, verify no page scroll appears at 1440×900
- SubNav renders with hover states
- Panels render with correct background per theme
- Sidebar renders with 13 sites, active state works
- Resize browser between 1366×768 and 1920×1080 — content adapts

**Commit:** `chunk-9(phase-1b): sub-nav + layout primitives`

---

### Chunk 10 — Portfolio section restructure

**Goal:** Restructure Portfolio page into 4 sub-tabs. For now, build the routing + container — content for Overview (infographic) is chunk 13.

**Sub-tabs:**
- **Overview** (`/portfolio/overview` or `/`) — placeholder for now, chunk 13 fills this
- **Map** (`/portfolio/map`) — the existing UkMap component, full screen, with site-list legend on left
- **Sites** (`/portfolio/sites`) — the existing All Sites table, full screen
- **Comparisons** (`/portfolio/comparisons`) — placeholder for now, chunk 17 fills this

**Steps:**
1. Set up routing under `/portfolio/*`
2. Move the existing landing content (map + cards + table) into the appropriate sub-tabs
3. Default landing on `/` should redirect to `/portfolio/overview`
4. Map sub-tab: UkMap full screen, site list panel on left (~340px wide)
5. Sites sub-tab: full-screen table, header is sticky on scroll within panel

**PASS criteria:**
- `/portfolio/map` shows map + side list
- `/portfolio/sites` shows table
- `/portfolio/overview` shows "Coming in next chunk" placeholder
- `/portfolio/comparisons` shows "Coming in next chunk" placeholder
- Sub-nav highlights correct tab

**Commit:** `chunk-10(phase-1b): portfolio section restructure`

---

### Chunk 11 — Site Detail section restructure + sidebar

**Goal:** Restructure Site Detail into 5 sub-tabs with persistent sidebar.

**Sub-tabs:**
- **Overview** (`/site/{id}/overview`) — site header + metric tiles (existing content from Phase 1A, but reorganised into a 2-panel layout)
- **Energy** (`/site/{id}/energy`) — monthly chart + later (chunk 18) the HH toggle
- **Carbon** (`/site/{id}/carbon`) — placeholder for chunk 14
- **MPANs** (`/site/{id}/mpans`) — the MPAN inventory table, full screen
- **Data Quality** (`/site/{id}/data-quality`) — the data quality table (chunk 4 fixes) + Sycous panel (chunk 15)

**Layout: sidebar on left always visible, main content right.**

**Overview layout (2-panel):**
```
+----------------+----------------------+
|   Panel 1      |   Panel 2            |
|   - Site name  |   - Monthly chart    |
|   - Tags row   |   - "Quick facts"    |
|   - 4 metric   |     row              |
|     tiles      |                      |
|     in 2x2     |                      |
+----------------+----------------------+
```

**Energy layout:** big stacked chart fills most of the viewport, with header showing site name + a toggle for "Monthly" / "Half-hourly" (HH disabled if no HH data; chunk 18 makes it functional).

**MPANs layout:** full-screen table that scrolls vertically inside the panel. Filter pill at top: "All / Landlord / Voids / Inactive".

**Data Quality layout:** the existing table + Sycous coverage panel (chunk 15).

**PASS criteria:**
- `/site/austin-heath/overview` shows the redesigned layout
- Sidebar shows 13 sites, austin-heath highlighted
- Click another site in sidebar → URL changes, content updates
- All 5 sub-tabs accessible from sub-nav
- No page scroll at 1440×900

**Commit:** `chunk-11(phase-1b): site detail section restructure with sidebar`

---

### Chunk 12 — Insights section restructure

**Goal:** Restructure Insights into 3 sub-tabs.

**Sub-tabs:**
- **Reconciliation** (`/insights/reconciliation`) — the existing Ecotricity vs arbnco chart + commentary
- **Voids** (`/insights/voids`) — the £49k callout + per-site void breakdown table
- **Data Quality** (`/insights/data-quality`) — the heatmap (full screen) + RFI status panel below

**Layouts:**

**Reconciliation:** 
```
+----------------+----------------------+
|  Left panel    |  Right panel         |
|  - Title       |  - Reconciliation    |
|  - Commentary  |    grouped bar chart |
|  - Why this    |                      |
|    matters     |                      |
+----------------+----------------------+
```

**Voids:**
```
+------------------------------------+
|  Big £49k callout (full width)     |
+------------------------------------+
|  Per-site void breakdown table     |
|  (scrolls inside panel)            |
+------------------------------------+
```

**Data Quality:**
```
+----------------+----------------------+
|  Heatmap       |  RFI status panel    |
|  (large)       |  27 outstanding      |
|                |  Grouped by theme    |
|                |  (scrolls if needed) |
+----------------+----------------------+
```

The RFI status panel reads from `rfi_status.json` (built in Phase 1A chunk 6). Group items by theme letter, show count per theme, expandable to see individual items.

**PASS criteria:**
- All 3 sub-tabs render
- Heatmap visible on Data Quality tab
- RFI panel shows 27 items grouped by theme

**Commit:** `chunk-12(phase-1b): insights section restructure`

---

### Chunk 13 — Landing infographic (Portfolio > Overview)

**Goal:** Build the 4-quadrant landing infographic. This is the new "first thing they see" — must be visually striking.

**Layout: 4 large quadrants filling the viewport** (after top nav + sub nav).

```
+----------------+----------------+
|                |                |
|   ⚡ ELEC      |   🔥 GAS       |
|   4.5M kWh    |   7.6M kWh     |
|   Confirmed   |   Confirmed    |
|   "Click for  |   "Click for   |
|   reconcili-  |   reconcili-   |
|   ation"      |   ation"       |
|                |                |
+----------------+----------------+
|                |                |
|   💧 WATER    |   ♻️ WASTE     |
|   ~18k m³     |   145 t        |
|   Partial     |   Confirmed    |
|   "Click for  |   "Click for   |
|   site list"  |   site list"   |
|                |                |
+----------------+----------------+
```

**Design specs per quadrant:**
- Background: slight tint of cream/dark depending on theme (e.g. `rgba(255,255,255,0.03)` on dark)
- Hover state: lifts slightly, background tint deepens, cursor pointer
- Click action: navigates per the mappings below
- Icon: large Lucide-React icon (`Zap` for electricity, `Flame` for gas, `Droplets` for water, `Recycle` for waste) — 64px in coral
- Big number: Playfair Display 96px in coral
- Unit + subtitle: Inter 16px
- DataStatusBadge centered or top-right
- Optional one-line "Why this matters" footnote

**Click-to-drill mappings:**
- Electricity quadrant → `/insights/reconciliation`
- Gas quadrant → `/insights/reconciliation` (same — gas is in the chart)
- Water quadrant → `/portfolio/sites?filter=water`
- Waste quadrant → `/portfolio/sites?filter=waste`

(For filter URLs, just pass a query param. The Sites table can read it and apply a default filter if you want; otherwise just navigate to the unfiltered list — the filter feature is a polish item.)

**Data source:**
- Portfolio totals: `portfolio.json` (existing)
- Status badges: derive from per-site `data_status` counts (count "confirmed", "partial", "missing" per metric)

**Below the 4-quadrant grid** (small horizontal strip):
"13 sites · 217,314 m² GIA · 961 units · Data CY2025"

**PASS criteria:**
- `/` and `/portfolio/overview` show the 4-quadrant infographic
- All 4 quadrants clickable, navigate correctly
- Big numbers visible (no truncation)
- Mobile / narrow viewport: 4 quadrants stack into 2x2 grid then 1-column if very narrow

**Commit:** `chunk-13(phase-1b): landing infographic`

---

### Chunk 14 — Carbon view (Site Detail > Carbon sub-tab)

**Goal:** Build the Carbon emissions view for Site Detail.

**Layout:**

```
+----------------+----------------------+
|  Left panel    |  Right panel         |
|  - "Carbon"    |  - Carbon stacked    |
|    title       |    bar (Scope 1/2/3) |
|  - Scope       |  - or pie chart      |
|    breakdown:  |    (your call —      |
|    big numbers |    pie probably      |
|    Scope 1, 2, |    clearer for       |
|    3 in tonnes |    3 categories)     |
|                |                      |
|  - Intensity:  |                      |
|    kgCO2e/m²   |                      |
|    kgCO2e/unit |                      |
+----------------+----------------------+
|  Comparison vs portfolio median       |
|  + "Why this matters" callout         |
+---------------------------------------+
```

**Data source:** `carbon.json` per site.

**Chart:** Use Recharts pie chart with 3 segments (Scope 1 in coral, Scope 2 in sage, Scope 3 in muted blue). Hollow centre with site total tCO2e in Playfair.

**Intensity comparison:** "X kgCO2e/m² — portfolio median is Y. Site is N% above/below median."

**PASS criteria:**
- `/site/austin-heath/carbon` renders all elements
- Pie chart shows Scope 1/2/3 segments
- Intensity numbers visible
- Comparison line shows position vs portfolio

**Commit:** `chunk-14(phase-1b): carbon view`

---

### Chunk 15 — Sycous coverage panel (Site Detail > Data Quality sub-tab)

**Goal:** Add a Sycous coverage panel to the Data Quality tab.

**Panel content** (read from `sycous.json` per site):

If `in_sycous: true`:
```
SYCOUS SUB-METERING
Network: {sycous_network}
Properties: {properties_count}
Services covered: {services_covered.join(', ')}

[Table per service:]
| Service | Properties | Meters | Valid reads | Data quality |
| Electricity | 130 | 133 | 118 | 89% |
| Heat & Hot Water | 130 | 133 | 127 | 95% |
```

If `in_sycous: false`:
```
SYCOUS SUB-METERING
Not on Sycous platform.
Reconciliation note: {reconciliation_note}
```

**PASS criteria:**
- Millfield Green shows Sycous coverage with services + quality %
- Bramshott Place shows "Not on Sycous platform"
- Blendworth Hills shows Sycous coverage but 0% valid reads (data quality flag)

**Commit:** `chunk-15(phase-1b): sycous coverage panel`

---

### Chunk 16 — GRESB Readiness stub page

**Goal:** Build the placeholder page at `/gresb`.

**Page content (full viewport):**

```
+---------------------------------------+
|  Top nav (GRESB active)               |
+---------------------------------------+
|                                       |
|       Big "GRESB Readiness"           |
|       title (Playfair coral)          |
|                                       |
|       Sub: "Coming Sunday"            |
|                                       |
|       3 stat cards in a row:          |
|       [Current 2025: 52]              |
|       [Target 2026: 62]               |
|       [Assets: 3 → 11]                |
|                                       |
|       5 indicator strips with         |
|       progress bars:                  |
|       - Data Coverage 35%             |
|       - Policies 50%                  |
|       - Green Leases 10%              |
|       - ESG Fit-Out 0%                |
|       - BREEAM In-Use 0%              |
|                                       |
|       "Full scorecard arrives         |
|       Sunday with indicator-by-       |
|       indicator detail"               |
|                                       |
+---------------------------------------+
```

**Data source:** `gresb_stub.json`.

**Progress bars:** simple horizontal bars showing `current_progress_pct` out of 100, with coral fill on dark track.

**PASS criteria:**
- `/gresb` renders the stub
- 3 stat cards visible (52, 62, 3→11)
- 5 indicator strips with progress bars

**Commit:** `chunk-16(phase-1b): gresb stub page`

---

### Chunk 17 — Comparisons view (Portfolio > Comparisons sub-tab)

**Goal:** Build the site-to-site comparison view.

**Layout:**

```
+---------------------------------------+
|  Top: 3 site picker dropdowns        |
|  [Site A: Austin Heath]              |
|  [Site B: Millfield Green]           |
|  [Site C: + Add site]                |
+---------------------------------------+
|                                       |
|  3-column comparison:                 |
|                                       |
|  +----------+ +----------+ +-------+ |
|  | Site A   | | Site B   | | Site C| |
|  | metrics  | | metrics  | | ...   | |
|  | mini bar | | mini bar | |       | |
|  | charts   | | charts   | |       | |
|  +----------+ +----------+ +-------+ |
|                                       |
+---------------------------------------+
|  Comparison chart at bottom           |
|  Side-by-side monthly bars            |
+---------------------------------------+
```

**Per-site card content:**
- Site name (Playfair 24px)
- Heating archetype
- Total GIA + units
- CY25 elec landlord + gas
- Tiny pie of Scope 1/2/3
- Data quality status (4 small badges)

**Bottom comparison chart:** grouped bar chart, x-axis = months, grouped bars per site (one colour per site).

**PASS criteria:**
- `/portfolio/comparisons` renders
- 2 sites pre-selected by default (Austin Heath + Millfield Green as examples)
- 3rd column shows "+ Add site" placeholder
- Comparison chart at bottom shows monthly data for selected sites

**Commit:** `chunk-17(phase-1b): comparisons view`

---

### Chunk 18 — Half-hourly Load Inspector port (Tier 3 - STRETCH)

**Goal:** Port the PABLO Load Inspector to IVG. Add toggle to Site Detail > Energy sub-tab.

**CRITICAL:** Only attempt this chunk if Tier 1+2 are PASS by 3am AND ≥4 hours remain. Otherwise leave the HH toggle as "Coming soon" — the rest of the demo stands alone.

**Read `docs/briefs/LOAD_INSPECTOR_HANDOFF.md` in full before starting.** It contains the complete spec, all transforms, all components.

**Approach (per handoff Section 10):**

1. **Create `lib/loadInspectorTransforms.js`** — port verbatim:
   - `percentile(arr, p)` function
   - Duration curve thinning logic
   - Heat color interpolation
   - Tick generation helpers

2. **Create `components/LoadInspector/LoadInspector.jsx`** — top-level component with:
   - Props: `hhData`, `intervalHours`, `startDate`, `profileName`, `asc`
   - Tab state for 6 views (Overview, Time Series, Daily Profile, Monthly, Duration Curve, Heat Map, Data Quality)
   - Tab bar at top
   - View switcher

3. **Port 6 of 8 views** (skip Weather + Assembly Provenance per handoff Section 10):
   - `OverviewView.jsx`
   - `TimeSeriesView.jsx`
   - `DailyProfileView.jsx`
   - `MonthlyView.jsx`
   - `DurationCurveView.jsx`
   - `HeatMapView.jsx`
   - `DataQualityView.jsx`

4. **Wire into Site Detail > Energy sub-tab:**
   - Toggle at top: "Monthly view" / "Half-hourly view"
   - If site has no HH data (check `half_hourly_index.json by_site[siteId]`), toggle is disabled
   - If site has 1 HH MPAN: toggle straight to the Load Inspector
   - If site has multiple HH MPANs (Elderswell has 2, Ampfield has 2): meter selector dropdown above the Inspector

5. **Style: rebuild against IVG tokens.** Don't fight PABLO's Tailwind. Use IVG's Inter + Playfair + navy/coral/cream. Chart series colours from PABLO can stay (gold, magenta, teal, green — good contrast on either background).

6. **Pre-computed aggregates** are already in the per-MPAN JSON from chunk 3 — use those, don't recompute on the client.

**PASS criteria:**
- Toggle visible on Energy sub-tab for sites with HH data
- 6 of 8 views render correctly for at least one site (Millfield Green has the cleanest data — start there)
- No console errors
- View switching is responsive (<200ms transition)
- Mobile breakpoint: tabs scroll horizontally if needed

**Commit:** `chunk-18(phase-1b): half-hourly load inspector port`

---

### Chunk 19 — Final QA + local build verification (REQUIRED)

**Goal:** End-to-end QA. Local build success. **DO NOT push to main.** Chris pushes in the morning after eyeballing.

**Steps:**
1. `npm run build` in eir/. Should succeed with zero warnings.
2. `npm run preview` — load all routes:
   - `/` (Portfolio > Overview infographic)
   - `/portfolio/{overview|map|sites|comparisons}`
   - `/site/{austin-heath|millfield-green|sonning-common}/{overview|energy|carbon|mpans|data-quality}`
   - `/insights/{reconciliation|voids|data-quality}`
   - `/gresb`
3. Mobile breakpoint test: resize browser to 375px width, every page should be usable (even if degraded).
4. Multi-viewport test: 1366×768, 1440×900, 1920×1080 — verify no page scroll appears at any of these.
5. Click-test critical paths:
   - Land on `/` → click Electricity quadrant → arrives at Insights > Reconciliation
   - Land on `/` → top nav: click GRESB → arrives at GRESB stub
   - Portfolio > Map → click site dot → arrives at Site Detail > Overview
   - Site Detail sidebar → click another site → URL changes
   - Site Detail > Carbon sub-tab → pie chart renders
6. Data accuracy spot check: Austin Heath CY25 elec landlord ~ 457k kWh; Millbrook 12 MPANs; £49k visible on insights/voids.
7. Update STATUS.md: chunks completed, tier reached, any unresolved issues, visual problems Chris should know about.
8. Write `docs/phase-1b-demo-readiness.md` summarising: what works, what's rough, what's missing, suggested 1-hour polish list.

**PASS criteria:**
- `npm run build` succeeds, zero warnings
- All routes load locally
- No page scroll at 1440×900
- No console errors
- STATUS.md updated, demo-readiness doc written

**Do NOT do:**
- Do not push to main
- Do not run `vercel deploy`
- Do not change vercel.json

**Commit:** `chunk-19(phase-1b): QA + local build verified, ready for Chris review`

---

## Hard stops (stop immediately, document, exit)

- Phase 1A not pushed to main (chunk 1)
- Source workbooks missing from `pipeline/source-data/`
- Excel/CSV parsing produces zero rows where 1000+ expected
- Chunk 9 layout primitives fail to fit viewport at 1366×768
- `npm run build` produces errors in chunk 19
- Any 15-minute block

## Voice and style for any user-facing copy

Per CLAUDE.md and Phase 1A brief:
- Measured, professional, slightly understated
- No first-person ("we", "our")
- No internal-team language
- Sentence case headings
- Em-dashes for parentheticals
- No emojis in body copy (status icons in DataStatusBadge are OK, Lucide icons in infographic are OK)

---

## Appendix A — Visual conventions reference

Refer to **Phase 1A brief Appendix C** for the full visual conventions. They still apply in Phase 1B. The key tokens / patterns:

- Dark navy bg for Portfolio, Insights, GRESB
- Cream bg for Site Detail (or stay dark — see chunk 11 — Phase 1A used dark for interior pages, continue that pattern unless Chris signals otherwise)
- Playfair coral titles, Inter body
- Status colour ramp: green → amber → red → grey
- No box shadows, no gradients, no animations beyond hover
- Generous whitespace, panel-based layout

Also refer to `docs/briefs/visual-references/visual-reference-*.png` (the 5 NZA carbon inventory screenshots).

---

## Appendix B — Data file inventory

**Source files in `pipeline/source-data/`:**
- `26003-NZA-XX-XX-CA-X_1001b_P02_Ecotricity_Master_Data_Gas_Electricity.xlsx` (3.4 MB)
- `26003-NZA-XX-XX-CA-X-1004 - IVG_Sycous_data.xlsx` (150 KB) — NEW for Phase 1B
- `26003-NZA-IVG-XX-CA-X-2002_P03_GRESB_Site_Classification.xlsx` (15 KB) — NOT READ tonight
- `26003-NZA-IVG-XX-CA-X-2003_P02_IVG_GRESB_Data_Coverage_Calculator.xlsx` (18 KB) — NOT READ tonight
- 12 Stark HH CSVs (~1 MB each, 17520 rows × 2 cols) — NEW for Phase 1B
- Existing Phase 0 files (Site Overview, Arbnco, Water, Waste)

**Pipeline outputs in `dist/eir/` after Phase 1B:**
- 9 from Phase 0 + 1A: sites, energy, water, waste, portfolio, electricity_monthly, mpan_register, reconciliation, rfi_status
- 4 new: sycous, carbon, gresb_stub, half_hourly_index
- 12 new per-MPAN files in `half_hourly/{mpan}.json`

**Total: 13 JSON + 12 HH JSON + build_log.txt**

---

End of brief.
