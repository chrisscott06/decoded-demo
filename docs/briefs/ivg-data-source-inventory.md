# IVG pipeline — data source inventory

This document is the canonical reference for the four data sources that feed `nza-ivg-data-pipeline/`. It describes each source, its location, sheet structure, status conventions, and the per-source quirks Co-Work needs to know before writing readers.

It also defines the **canonical site list** (used as the join key across all sources) and the **site name resolver** that maps the variant spellings each source uses back to canonical IDs.

The Stark HH CSVs are documented separately at the end — they're not consumed by the EIR pipeline but feed the ECPR pipeline later.

---

## Canonical site list

The pipeline's canonical site list comes from the **Site Overview** sheet (source 1 below). All other sources are joined to this list via the site name resolver.

| Canonical ID | Display name | Ref |
|---|---|---|
| `austin-heath` | Austin Heath | AH |
| `gifford-lea` | Gifford Lea | GL |
| `bramshott-place` | Bramshott Place | BP |
| `millbrook-village` | Millbrook Village | MB |
| `durrants-village` | Durrants Village | DV |
| `great-alne-park` | Great Alne Park | GA |
| `ledian-gardens` | Ledian Gardens | LG |
| `elderswell` | Elderswell | EW |
| `millfield-green` | Millfield Green | MG |
| `ampfield-meadows` | Ampfield Meadows | AM |
| `blendworth-hills` | Blendworth Hills | BH |
| `sonning-common` | Sonning Common | SC |
| `edwalton-office` | Edwalton Office | EO |

13 entities total — 12 villages + head office.

### Site name variants observed

Each source spells some sites differently. The site name resolver lives in the pipeline and handles these:

| Canonical | Site Overview | Arbnco | Water | Waste |
|---|---|---|---|---|
| `austin-heath` | Austin Heath | Austin Heath Village | Austin Heath | Austin Heath |
| `edwalton-office` | Edwalton Office | Head Office | Edwalton Business Park | *(not in waste data)* |
| `gifford-lea` | Gifford Lea | Gifford Lea | Gifford Lea | Gifford Lea |

Plus two sites appear in **Arbnco but not the Site Overview**: `Edenbridge` and `Little Mount Farm`. These are out of EIR scope (probably future sites or non-IVG entries). The reader should flag these as "unmapped" rather than fail.

Resolver implementation: a single dict in `pipeline/site_resolver.py` keyed by canonical ID, with each value a list of accepted variants. Lookup is case-insensitive and whitespace-tolerant.

---

## Source 1 — Site Overview *(per-site metadata, archetype tags, GIA, EUI, scope allocation)*

### File

- **Path:** `01a - Live Projects/26003 - IVG x NZA IESP/01 - WIP/CA_Calcs/26003-NZA-IVG-XX-CA-X-2001 - Site_Overview.xlsx`
- **Document reference:** `26003-NZA-IVG-XX-CA-X-2001`
- **Status:** Live, maintained by Chris

### Role in pipeline

This is the **canonical site list** and the **archetype taxonomy**. Every other source joins to this. Read first; everything else depends on it.

### Sheets

**Sheet 1: `Site Overview`** *(primary)*

- Header row: 4
- Data rows: 5–17 (13 sites) + row 18 (PORTFOLIO TOTAL — skip)
- 31 columns:

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Site | string | Canonical site name |
| 2 | Ref | string | Two-letter ref (AH, GL, etc.) |
| 3 | Total Units | int | |
| 4 | Completed | int | |
| 5 | Void | int | |
| 6 | Occupancy | percent | |
| 7 | Resi GIA (m²) | number | |
| 8 | Landlord GIA (m²) | number | |
| 9 | Total GIA (m²) | number | |
| 10 | Year(s) Built | string | e.g. "2014-2020" |
| 11 | Total Phases | int | |
| 12 | Operational Phases | int | |
| 13 | Primary Heating | string | e.g. "Central gas + CHP", "ASHP", "GSHP" |
| 14 | Hot Water | string | |
| 15 | CHP? | string | "Yes" / "Yes (R410A)" / "No" |
| 16 | Heat Network? | string | |
| 17 | Heat Billing | string | |
| 18 | Grid Type | string | "Bulk" / "DNO" / "Block metered" |
| 19 | Capacity (MVA) | number | |
| 20 | ASC (kVA) | number | |
| 21 | Solar PV (kWp) | number | |
| 22 | Battery | string | |
| 23 | EV Chargers | string | |
| 24 | Pool / Spa | string | |
| 25 | Restaurant | string | |
| 26 | Village Centre | string | |
| 27 | Sycous? | string | |
| 28 | LL Deduction? | string | |
| 29 | Metering Arrangement | string | |
| 30 | Management Entity | string | |
| 31 | Notes | string | |

**Sheet 2: `Scope Allocation`** *(GHG scope assignment per site, per energy stream)*

- Header row 4, data rows 5–17 (13 sites)
- Columns: Site, Ref, Gas Landlord, Gas Occupied Resi, Gas Void, Elec Communal (LL), Elec Occupied Resi, Elec Void, Grid Type, Has Gas?, Sycous Deduction?, Notes
- Each Gas/Elec column contains the assigned scope: "Scope 1", "Scope 2", "Scope 3 Cat 13", or "—"
- Used by the pipeline to apportion arbnco consumption into the correct GHG scope

**Sheet 3: `Phasing & Units`** *(phase-by-phase build-out timeline and unit counts)*

- Header row 4, data rows 5–16 (12 villages — Edwalton excluded)
- Columns: Site, Ref, Open Year, Phase 1–4 Units, Total/Current Units, Phase 1–4 Complete (yr), Capacity (MVA), Status, Notes

**Sheet 4: `Energy Benchmarks`** *(EUI calcs, modelled vs actual)*

- Header row 4, data rows 5–15 (**11 sites only** — Sonning Common, Blendworth Hills, Edwalton excluded due to no consumption data)
- Columns: Site, Ref, Total GIA (m²), Landlord GIA (m²), Actual Elec (kWh), Actual Gas (kWh), Actual Total (kWh), EUI Total/Elec/Gas (kWh/m²), Modelled Gas EUI, Gas vs Model, TM54 Benchmark, Notes
- **Reader must handle partial coverage** — not every site has a row here

### Reader responsibilities

- Output: `dist/eir/sites.json` keyed by canonical ID
- Each site's record contains identity, archetype tags (heating, grid, generation, amenities), scope allocations per energy stream, EUI benchmarks where available
- Validate: every site in Site Overview has a Scope Allocation row (13 in both)
- Flag: sites missing from Energy Benchmarks (expected: SC, BH, EO)
- Skip: row 18 (PORTFOLIO TOTAL)

---

## Source 2 — Arbnco *(electricity + gas consumption, GHG-ready)*

### File

- **Path:** `01a - Live Projects/26003 - IVG x NZA IESP/01 - WIP/CA_Calcs/26003-NZA-XX-XX-CA-X_1001 - Arbnco_Master_Data_Gas_Electricity.xlsx`
- **Document reference:** `26003-NZA-XX-XX-CA-X_1001`
- **Status:** Updated when arbnco refreshes (Chris will keep current)

### Role in pipeline

**Single source of truth for GHG and GRESB.** Monthly aggregates of electricity and gas, with arbnco's own carbon emissions calculations. The EIR's GHG Inventory chapter and the GRESB chapter both consume this directly.

The Stark HH CSVs are *not* read by the EIR pipeline — they're for the ECPR. Arbnco gives the EIR everything it needs.

### Sheets

**Sheet 1: `01_Inputs`** *(metadata only — skip)*

- Project name, reference, client, document reference, revision, date

**Sheet 2: `Energy Summary`** *(roll-up — read for portfolio totals if needed)*

- Aggregated portfolio totals

**Sheet 3: `Electricity`** *(per-site electricity summary)*

- Header row 4, data rows 5–17 (12 sites + portfolio total — skip totals)
- Columns: Site / Village, Meters, Consumption (kWh), Actual Carbon (tCO₂e), Nat. Avg Carbon (tCO₂e), % of Total, Notes

**Sheet 4: `Gas`** *(per-site gas summary)*

- Header row 4, data rows 5–11 (gas sites only)
- Same column structure as Electricity

**Sheet 5: `Notes`** *(methodology — skip in pipeline; useful reference for the report's methodology drawer)*

**Sheet 6: `Raw Data`** *(canonical — read this preferentially)*

- Header row 1, data rows 2–16
- Row 2 is a portfolio-total row (Asset blank, Fund "Inspired Villages") — skip
- 16 columns: Asset, Fund, # Electricity Meters, # Gas Meters, Total Consumption (kWh), Electricity Consumption (kWh), Gas Consumption (kWh), Total Carbon Emissions (tCO2e), Electricity Use Actual Carbon (tCO2e), Gas Use Actual Carbon (tCO2e), Total National Average Carbon (tCO2e), Electricity Use National Average Carbon (tCO2e), Gas Use National Average Carbon (tCO2e), Active for updates, Notes

### Quirks

- **"Austin Heath Village"** in Arbnco vs "Austin Heath" in Site Overview — resolver handles
- **"Head Office"** in Arbnco = "Edwalton Office" in Site Overview — resolver handles
- **`Edenbridge` and `Little Mount Farm`** appear in Arbnco's Raw Data but are not IVG portfolio sites — flag as unmapped, exclude from output
- **Rounding inconsistencies** between the Electricity/Gas summary sheets and the Raw Data sheet may exist — Raw Data is canonical
- **Data period is CY2025** (1 Jan – 31 Dec 2025) — verify in `Notes` sheet that this hasn't shifted

### Reader responsibilities

- Output: `dist/eir/energy.json` — per-site consumption + emissions, both Actual and National Average
- Read from `Raw Data` sheet (canonical), use `Electricity` and `Gas` summary sheets for cross-validation only
- Apply scope allocation from Source 1 to split consumption into Scope 1 / Scope 2 / Scope 3 Cat 13 buckets per site
- Output portfolio totals separately
- Flag and exclude unmapped sites with a warning log

---

## Source 3 — Water *(per-site water consumption + meter register)*

### File

- **Path:** `01a - Live Projects/26003 - IVG x NZA IESP/01 - WIP/CA_Calcs/26003-NZA-XX-XX-CA-X-1002 - IVG_Water_Updated_7_May_2026_v2.xlsx`
- **Document reference:** `26003-NZA-XX-XX-CA-X-1002`
- **Status:** Updated 7 May 2026 (most recent)

### Role in pipeline

Per-site water consumption for CY2025. Feeds the EIR's water indicators and the GRESB indicator readiness for water.

### Sheets

Nine sheets — not all needed by the pipeline.

**Sheet 1: `Dashboard`** *(canonical — read this)*

- Header row 4, data rows 5–17 (13 sites) + row 18 (portfolio total — skip)
- Rows 19+ are summary/notes — skip
- 12 columns: Site, Water Company, Retailer, Water Meters (Known), Meters with CY2025 Data, CY2025 Consumption (m³), Annual Estimate (m³), Data Quality, CY2025 Coverage, Completeness, Key Gaps & Actions, arbnco Meters

**Sheet 2: `Meter Register`** *(reference — meter-level detail)*

- Header row 1, data rows 2–40
- 11 columns: Site, Meter Serial, Water Company, Retailer, Account Ref, Description, RFI Register?, Portal Data?, CY2025 Consumption (m³), Data Source, Notes

**Sheets 3–8: per-portal raw reads** *(skip — too granular; feed into the Dashboard manually)*

- `Anglian Water Reads`, `WaterPlus Reads`, `SWW Reads`, `WaterPlus Bills`, `SE Water Reads`, `SE Water Properties`

**Sheet 9: `Data Gaps`** *(reference — outstanding actions, mostly historic now)*

### Status flag conventions

The Dashboard's `Data Quality` column uses these values:
- `Actual` — meter reads available
- `Estimated` — supplier estimates only
- *(blank or "No data")* — site not yet covered

The `CY2025 Coverage` column is a date range string (e.g. "Mar 25 – Jan 26") or blank.

The `Completeness` column is a percentage or qualitative string.

### Reader responsibilities

- Output: `dist/eir/water.json` — per-site water consumption
- Read from `Dashboard` sheet
- Map Data Quality → DataStatusBadge state: Actual → "Confirmed", Estimated → "Partial", blank → "Missing"
- Skip portfolio total and notes rows
- **`Edwalton Business Park`** in this sheet = `edwalton-office` canonical — resolver handles
- Note: water company (wholesale) and retailer (commercial supplier) are different things — preserve both

---

## Source 4 — Waste *(per-site waste tonnage, GHG-ready)*

### File

- **Path:** `01a - Live Projects/26003 - IVG x NZA IESP/01 - WIP/CA_Calcs/26003-NZA-XX-XX-CA-X-1003_P02 - IVG_Waste.xlsx`
- **Document reference:** `26003-NZA-XX-XX-CA-X-1003`, P02

### Role in pipeline

Per-site waste tonnage by stream, with DEFRA emission factors applied for Scope 3 Category 5. Feeds the EIR's waste indicators and Scope 3 Cat 5 emissions.

### Sheets

**Sheet 1: `Site_Summary`** *(canonical — read this)*

- Metadata in rows 1–7 — skip
- Header row 8 (begins "Site / Village")
- Data rows 9 onwards (sites)

**Sheet 2: `DEFRA_Inputs`** *(reference — emission factors)*

- DEFRA 2025 emission factors for waste disposal methods
- Header row 7: DEFRA Category, Waste Type, Disposal Method, kgCO2e/tonne, IVG Mapping, Notes
- Used by `GHG_Calculations` sheet — pipeline reader probably doesn't need to consume this directly

**Sheet 3: `GHG_Calculations`** *(canonical for emissions — read this)*

- Per-site Scope 3 Cat 5 calculations, breakdown by disposal method
- Header row 12 (begins "Site / Village")

**Sheet 4: `Charts`** *(skip)*

**Sheet 5: `Convey_Raw`** *(skip — 2,793 raw conveyance records, feed into Site_Summary upstream)*

- Useful reference for audit but pipeline doesn't need to read it

**Sheet 6: `Landfill_Raw`** *(skip — disposal-method breakdown by EWC code, feeds GHG_Calculations)*

**Sheet 7: `Ash_Waste_Raw`** *(skip — Gifford Lea-specific supplementary source, already incorporated into Site_Summary)*

### Quirks

- **Most sites use BIFFA**; Gifford Lea uses Ash Waste Services; some sites have unknown contractors
- Weights for Gifford Lea are **estimated from service rates** (no portal data) — the `Site_Summary` and `Ash_Waste_Raw` sheets flag this
- Reporting period is CY2025; conveyance data extends Apr 2024 – Apr 2026 in raw form

### Reader responsibilities

- Output: `dist/eir/waste.json` — per-site waste data + Scope 3 Cat 5 emissions
- Read from `Site_Summary` and `GHG_Calculations` sheets
- Skip metadata rows (1–7 for Site_Summary, 1–11 for GHG_Calculations)
- Flag estimated vs actual data quality
- Sites with no waste data (e.g. Edwalton Office if not present) → empty-state flag

---

## Stark HH CSVs *(ECPR pipeline only — not read by EIR pipeline)*

### Files

9 CSVs in the project: `consumption_data_mpan_<MPAN>_from_20240401000000_at_<timestamp>.csv`

Format:
- Columns: `Date (D/M/YYYY)`, `Time`, `Value`
- ~32,500 rows per file (covers Apr 2024 – Feb 2026 at HH resolution)
- One file per MPAN, 9 MPANs covered

### MPAN-to-site mapping

This mapping comes from the **electricity register** in the (legacy) Unified Consumption Register. Until that's promoted into a dedicated calc sheet, the ECPR reader hardcodes the mapping:

| MPAN | Site |
|---|---|
| 1170000537858 | Austin Heath |
| 1300060637737 | Gifford Lea |
| 2700001623991 | Millbrook Village |
| 2700000897657 | Durrants Village |
| 2700004078407 | Great Alne Park |
| 1900092082315 | Ledian Gardens |
| 2700007408969 | Elderswell (Electric Room) |
| 2700007408978 | Elderswell (Plant Room) |
| 2700007801700 | Millfield Green |

Bramshott Place, Ampfield Meadows, Blendworth Hills, Sonning Common, Edwalton Office — no Stark HH data currently. Some are NHH only; some are pending download.

### Role in pipeline

Half-hourly electricity consumption per MPAN. Used by the ECPR for capacity headroom analysis, peak demand, ASC review, load profile visualisations. Not consumed by the EIR pipeline — Arbnco's monthly aggregates are sufficient there.

### Reader responsibilities (ECPR pipeline, deferred)

- Output: `dist/ecpr/hh_consumption/<canonical-site-id>.json`
- Aggregate to daily, weekly, monthly for visualisation downsampling
- Compute peak demand, load factor, headroom against Site Overview's ASC value
- Flag data gaps (missing days, suspicious zeros, meter faults)

---

## Universal status flag conventions

Across all sources, status flags map to the `DataStatusBadge` component as follows:

| Source flag | Component state | Meaning |
|---|---|---|
| ✅, "Confirmed", "Actual", populated value | `Confirmed` | Data is in hand and validated |
| ⚠️, "Partial", "Estimated", "TBC", "[TO CONFIRM]" | `Partial` | Some data, with caveats |
| ❌, "Missing", "No info", blank where data expected | `Missing` | Data not yet available |
| *(not in scope)* | `NotApplicable` | Hide or grey out — site doesn't have this category |

Each reader is responsible for translating its source's idioms to one of these four states and emitting a `data_status` field per data point.

---

## Output structure

The pipeline produces one JSON file per domain, plus a portfolio rollup:

```
nza-ivg-data-pipeline/dist/
├── eir/
│   ├── sites.json          # from Source 1 (Site Overview)
│   ├── energy.json         # from Source 2 (Arbnco)
│   ├── water.json          # from Source 3 (Water)
│   ├── waste.json          # from Source 4 (Waste)
│   ├── portfolio.json      # rollup
│   └── build_log.txt       # what was read, written, skipped, missing
└── ecpr/
    ├── sites.json          # symlink/copy from eir/sites.json (same metadata)
    ├── hh_consumption/
    │   ├── austin-heath.json
    │   ├── gifford-lea.json
    │   └── ...
    └── build_log.txt
```

Both report repos consume from `dist/eir/` and `dist/ecpr/` respectively. The site list in EIR and ECPR is identical — same file, just delivered to two consumers.

---

## Update workflow

```
1. Chris edits the relevant calc sheet (Site Overview / Arbnco / Water / Waste)
2. Chris places updated file in pipeline/source_data/ replacing previous version
3. Chris runs: python pipeline/build.py
4. Pipeline regenerates affected JSON files in dist/
5. Git commit, push to nza-ivg-data-pipeline
6. Report repos pull latest pipeline output (mechanism TBD — git submodule recommended)
7. Report repos rebuild and redeploy
```

Five-to-seven steps depending on JSON-delivery mechanism. Same workflow whether one figure changed or all four sources refreshed.

---

End of inventory.
