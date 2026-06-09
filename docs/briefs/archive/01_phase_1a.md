# IVG ESG Tool — Phase 1A overnight brief

**Author:** Chris Scott (via Claude Chat, 21 May 2026)
**For:** Claude Code (working unsupervised overnight)
**Estimated runtime:** 7–10 hours
**Scope:** Two new pipeline readers + UK map + Site Detail page + Portfolio Insights page. Deploy-ready by morning.

**Demo context:** Chris has a live client demo tomorrow (22 May) with IVG (Rob Preston, Jez Conen, Laura Bagnall). They will see this on the Vercel URL. The audience is mixed: Rob/Laura are operations, Jez is technical/GRESB lead. The deliverable is the moment that determines whether this tool gets traction.

**CRITICAL visual convention note:** This tool must visually match NZA's existing carbon inventory reports. Five reference images are provided in `docs/briefs/visual-references/`. **Read Appendix C in full before building ANY UI component, and look at the reference images.** The existing Phase 0 shell styling is a placeholder — almost everything UI-side is being redone in this brief to match the NZA design language.

This brief is large because Chris will be asleep. The size does not remove checkpoints — every chunk has explicit PASS criteria and you do not proceed past a failure. If anything is unclear or you get stuck, **stop and write the blocker into STATUS.md**. Do not speculate-fix.

---

## Read order at session start

In this exact order, every time you start or resume a session:

1. `CLAUDE.md`
2. `STATUS.md`
3. This brief (`docs/briefs/phase-1a-overnight-brief.md`)
4. `docs/briefs/ivg-data-source-inventory.md` (Phase 0 reference)
5. Existing readers in `pipeline/readers/` (study the pattern before writing new ones)

If you crash, restart, or run out of context mid-session: re-read in the same order.

---

## What's already built (Phase 0 — do not break)

- Pipeline: 4 readers + validator + builder produce 5 JSON files in `pipeline/dist/eir/`
- Shell: Vite + React, brand palette applied, landing page with sortable table, `/site/[id]` JSON stub
- Tiny custom router (no react-router dependency) — preserve this approach
- Mobile breakpoint at 640px
- Vercel deploys from main on push

This brief **adds** to that — does not replace. The existing 5 JSON files stay. The existing Landing page gets extended. The Site Detail stub gets replaced. A new Insights page gets added.

---

## What you are building

### Pipeline additions

1. **`pipeline/readers/read_ecotricity.py`** — reads `pipeline/source-data/Ecotricity_Master_IVG_AUDIT.xlsx` and produces three JSON files:
   - `dist/eir/electricity_monthly.json` — per site, monthly HH/NHH/Gas kWh + landlord/void split + CY25 totals
   - `dist/eir/mpan_register.json` — per site, list of MPANs with classification (HH/NHH/Gas type + Landlord/Void category + CY25 kWh + months covered + account)
   - `dist/eir/reconciliation.json` — per site Eco landlord vs arbnco totals + portfolio totals + void investigation summary

2. **`pipeline/readers/read_rfi_register.py`** — reads `pipeline/source-data/26003-NZA-IVG-XX-SH-1000_P06_-_RFI_Register.xlsx` and produces:
   - `dist/eir/rfi_status.json` — per RFI item: theme, sub-theme, status, owner, due date. Used by the Insights page data-status heatmap.

3. **`pipeline/site_coordinates.json`** — committed static data file (sibling to `site_resolver.py`). Lat/lon for each canonical site. **Content provided in Appendix A of this brief — copy it verbatim.**

4. **`pipeline/build.py`** — orchestrator picks up new readers automatically if you follow the existing pattern (`readers/__init__.py` imports). Update if needed.

5. **`pipeline/validate.py`** — add cross-checks:
   - Eco landlord electricity per site should be within ±20% of arbnco for single-meter sites (Austin Heath, Gifford Lea, Millfield Green, Edwalton Office, Ampfield Meadows)
   - Eco gas per site should match arbnco within ±5% for sites with bulk gas (Austin Heath, Gifford Lea, Bramshott, Millbrook, Elderswell, Ledian)
   - 222 total MPANs in mpan_register.json
   - Every electricity_monthly.json site has 15 months of data (Oct 2024 to Dec 2025)

### Shell additions

6. **`UkMap` component** (`eir/src/components/UkMap.jsx`) — static SVG outline of UK with 15 dots positioned by lat/lon. Dot colour = data completeness traffic light. Click dot → navigate to site detail.

7. **`EnergyChart` component** (`eir/src/components/EnergyChart.jsx`) — Recharts stacked bar, 15 months × HH/NHH/Gas. Orange/grey/navy.

8. **`MetricTile` component** (`eir/src/components/MetricTile.jsx`) — used on Site Detail. Label + value + unit + data status badge + "Why this matters" line.

9. **`DataStatusBadge` component** (`eir/src/components/DataStatusBadge.jsx`) — pill component, green/amber/red/grey for confirmed/partial/missing/not_applicable.

10. **Landing page extension** — keep existing structure, add UK map above the cards, add data completeness columns to the site table.

11. **Site Detail page** — replace JSON dump with real layout: header + 4 metric tiles + monthly electricity chart + MPAN inventory table + data quality strip.

12. **Insights page** (`/insights` route) — three sections: reconciliation chart (Eco vs arbnco), void waste callout, data completeness heatmap.

13. **Router update** — add `/insights` route. Update nav (currently no nav — add a simple top strip with three links: Portfolio / Insights / [Site detail accessed via map/table click]).

### Deploy

14. **Local build success only** — Chris will push and verify Vercel in the morning. Do **not** push to main. Do **not** trigger Vercel deploy.

---

## Chunked build plan (15 chunks, PASS criteria per chunk)

> **Stuck rule:** 15 continuous minutes blocked → stop, document blocker in STATUS.md, do not speculate-fix.

> **Test-before-proceed rule:** every chunk has explicit PASS criteria. Run them before declaring PASS. If even one criterion fails, fix or document.

---

### Chunk 1 — Session start, plan, dependencies

**Goal:** Read context, install any new deps, write plan to STATUS.md.

**Steps:**
1. Read CLAUDE.md, STATUS.md, this brief, ivg-data-source-inventory.md, and existing pipeline readers in order.
2. Confirm `pipeline/source-data/Ecotricity_Master_IVG_AUDIT.xlsx` and `pipeline/source-data/26003-NZA-IVG-XX-SH-1000_P06_-_RFI_Register.xlsx` are present. If missing, **hard stop** — document in STATUS.md and exit.
3. Inspect the Ecotricity workbook structure (`openpyxl` load, print sheet names + first 5 rows of each tab). Document findings in `docs/phase-1a-ecotricity-structure.md`.
4. Inspect the RFI Register similarly. Document in `docs/phase-1a-rfi-structure.md`.
5. Update STATUS.md with chunk plan and findings.

**PASS criteria:**
- Both source files present and readable
- Sheet structure documented
- STATUS.md shows chunk plan for chunks 2-15

**Commit:** `chunk-1(phase-1a): inspect source workbooks, document structure`

---

### Chunk 2 — Site coordinates static file

**Goal:** Create `pipeline/site_coordinates.json` from Appendix A. Quick, low-risk chunk to build momentum.

**Steps:**
1. Create `pipeline/site_coordinates.json` with content from Appendix A verbatim.
2. Spot-check: file is valid JSON, 15 entries, each has name + lat + lon.

**PASS criteria:**
- File exists at `pipeline/site_coordinates.json`
- Valid JSON, 15 entries
- All canonical site IDs from CLAUDE.md present, plus 2 dev sites (edenbridge-dev, little-mount-lake-dev)
- Lat values 50–54 (UK bounding box)
- Lon values -4 to +1 (UK bounding box)

**Commit:** `chunk-2(phase-1a): add site coordinates static file`

---

### Chunk 3 — Ecotricity reader: monthly electricity

**Goal:** First of three outputs from the Ecotricity workbook. Produce `dist/eir/electricity_monthly.json`.

**Source data:**
The Ecotricity_Master_IVG_AUDIT.xlsx workbook has 16 tabs. The key one for this chunk is **"Site x Month Summary"** which contains a matrix: rows are sites grouped in fives (Site name, then HH / NHH / Gas / TOTAL / blank), columns are months (Oct 24 to Dec 25 — 15 months — plus 15mo Total + CY25 Total).

The structure (from Chris's chunk-1 inspection — verify against actual):
- Row 4 = headers (Site, Type, Oct 24, Nov 24, ..., Dec 25, 15mo Total, CY25 Total)
- Row 5 = Austin Heath HH
- Row 6 = Austin Heath NHH
- Row 7 = Austin Heath Gas
- Row 8 = Austin Heath TOTAL (skip — we compute)
- Row 9 = blank (skip)
- Row 10 onwards = Gifford Lea (HH/NHH/Gas/TOTAL/blank), then Bramshott Place, then... in this order:
  `Austin Heath, Gifford Lea, Bramshott Place, Millbrook Village, Durrants Village, Great Alne Park, Ledian Gardens, Elderswell, Millfield Green, Ampfield Meadows, Blendworth Hills, Sonning Common, Edwalton Office, Edenbridge (dev), Little Mount Lake (dev)`

**Output structure (`dist/eir/electricity_monthly.json`):**
```json
{
  "austin-heath": {
    "monthly": [
      {"month": "2024-10", "hh": 0, "nhh": 0, "gas": 0, "elec_landlord": 0, "elec_void": 0},
      {"month": "2024-11", "hh": ..., "nhh": ..., "gas": ..., ...},
      ... 15 entries total ...
    ],
    "cy25": {
      "hh_kwh": 456470,
      "nhh_kwh": 0,
      "gas_kwh": 2475308,
      "total_kwh": 2931778,
      "landlord_kwh": 2931778,
      "void_kwh": 0
    }
  },
  ...
}
```

**Landlord vs Void split:** the Site x Month Summary doesn't directly give this — you'll need to cross-reference with the MPAN Register tab (Supply Category column). For each month, sum the kWh of MPANs whose category starts with "Landlord" vs "Void". This requires also reading the Raw - Units tab and apportioning bills to months, OR — pragmatic alternative — derive the landlord/void split for the CY25 total from MPAN Register and apply the same proportion to each month. Document the choice in STATUS.md.

**PASS criteria:**
- File exists at `pipeline/dist/eir/electricity_monthly.json`
- 15 sites present (13 canonical + 2 dev)
- Each site has 15 monthly entries (Oct 2024 to Dec 2025)
- CY25 totals match the Site x Month Summary "CY25 Total" column within ±1%
- Spot check: Austin Heath CY25 total = ~2.93 GWh; Millbrook = ~480 MWh; Ledian = ~1.56 GWh
- `landlord_kwh + void_kwh` approximately equals `hh_kwh + nhh_kwh` for electricity sites

**Commit:** `chunk-3(phase-1a): electricity_monthly.json reader`

---

### Chunk 4 — Ecotricity reader: MPAN register

**Goal:** Produce `dist/eir/mpan_register.json` from the MPAN Register tab.

**Source tab:** "MPAN Register" — 222 rows starting at row 5. Columns to extract (verify column letters in chunk 1 inspection):
- A: MPAN number (14-digit)
- B: Site ID (formula result — kebab-case)
- D: Type (HH / NHH / Gas)
- J: Supply Category (Landlord (HH), Landlord (NHH), Landlord (NHH) - heuristic, Landlord (Gas), Landlord (Office), Construction, Void - Normal (low), Void - HIGH CONSUMPTION, Inactive (no consumption))
- K: Category Source (text justification)
- Plus computed columns for CY25 kWh and account name

The workbook has formulas. Use `data_only=True` when loading with openpyxl to get computed values, not formula strings.

**Output structure (`dist/eir/mpan_register.json`):**
```json
{
  "austin-heath": [
    {
      "mpan": "1170000537858",
      "type": "HH",
      "category": "Landlord (HH)",
      "category_source": "RFI / Auto: HH meter",
      "cy25_kwh": 456470,
      "months_covered": 12,
      "account": "Austin Heath Management Limited"
    },
    ...
  ],
  ...
}
```

Sort each site's MPANs in this order: landlord types first (HH, NHH, Gas, Office), then Construction, then Void HIGH, then Void Normal, then Inactive. Within each group, sort by CY25 kWh descending.

**PASS criteria:**
- File exists
- Total MPAN count across all sites = 222
- Per-category counts match expected: 17 Landlord HH + 45 Landlord NHH + 1 NHH heuristic + 1 Office + 1 Construction + 12 Landlord Gas + 82 Void HIGH + 46 Void Normal + 17 Inactive
- Spot check: Millbrook Village has 11 NHH MPANs all on Management Ltd account
- Spot check: Ledian Gardens has ~65 MPANs total (~17 landlord + ~48 void HIGH)

**Commit:** `chunk-4(phase-1a): mpan_register.json reader`

---

### Chunk 5 — Ecotricity reader: reconciliation

**Goal:** Produce `dist/eir/reconciliation.json` — per site Eco vs arbnco + portfolio totals + void investigation summary.

**Source tabs:** "Landlord vs Resident" (per-site Eco landlord + void totals) and "Arbnco Reference" (per-site arbnco totals) and "Void Investigation" (high-consumption voids by site).

**Output structure:**
```json
{
  "by_site": {
    "austin-heath": {
      "eco_landlord_elec_kwh": 456470,
      "eco_void_elec_kwh": 0,
      "eco_gas_kwh": 2475308,
      "eco_meters_elec": 1,
      "eco_meters_gas": 2,
      "arb_elec_kwh": 423542,
      "arb_gas_kwh": 2582255,
      "arb_meters_elec": 1,
      "arb_meters_gas": 2,
      "derived_resident_elec_kwh": 0,
      "derived_resident_gas_kwh": 106947
    },
    ...
  },
  "portfolio": {
    "eco_landlord_elec_kwh": 4515932,
    "eco_void_elec_kwh": 189679,
    "eco_gas_kwh": 7635743,
    "arb_elec_kwh": 8309121,
    "arb_gas_kwh": 9353853,
    "derived_resident_elec_kwh": 3911351,
    "derived_resident_gas_kwh": 1922856,
    "eco_meters_total": 222,
    "arb_meters_total": 1051
  },
  "voids": {
    "by_site": {
      "ledian-gardens": {"high_count": 48, "high_kwh": 104307, "normal_count": 12, "inactive_count": 10},
      "bramshott-place": {"high_count": 21, "high_kwh": 42915, "normal_count": 0, "inactive_count": 4},
      ...
    },
    "portfolio": {
      "total_voids": 145,
      "high_voids": 82,
      "normal_voids": 46,
      "inactive_voids": 17,
      "total_high_kwh": 178669,
      "estimated_annual_cost_gbp": 49134
    }
  }
}
```

**PASS criteria:**
- File exists
- Portfolio Eco landlord elec ≈ 4.5 GWh (within ±1%)
- Portfolio arbnco elec ≈ 8.3 GWh
- Portfolio derived resident elec ≈ 3.9 GWh
- 82 high voids, £49k cost

**Commit:** `chunk-5(phase-1a): reconciliation.json reader`

---

### Chunk 6 — RFI Register reader

**Goal:** Produce `dist/eir/rfi_status.json` from the RFI Register workbook.

**Source tab:** "RFI_P06" — list of RFI items with theme/sub-theme/status/owner/due date.

Headers at row 12 (per Phase 0 inventory pattern). Data starts row 13. Columns:
- B: Theme
- C: Ref (e.g. A1, A2, B1)
- D: Sub-theme
- E: Information request (long text — truncate for JSON output to 200 chars)
- F: Purpose

**Output structure:**
```json
{
  "items": [
    {
      "ref": "A1",
      "theme": "A. Organisational Boundary & Reporting",
      "sub_theme": "Ownership structure",
      "request_summary": "Please confirm the current JV arrangement...",
      "status": "Open"
    },
    ...
  ],
  "summary": {
    "total": 33,
    "by_theme": {"A": 6, "B": 9, "C": 3, ...},
    "by_status": {"Open": 33, "Responded": 0, "Closed": 0}
  }
}
```

Status defaults to "Open" if no status column populated (matches P06 state).

**PASS criteria:**
- File exists
- 30+ items (33 expected)
- All 7 themes present (A through G)

**Commit:** `chunk-6(phase-1a): rfi_status.json reader`

---

### Chunk 7 — Validation extension

**Goal:** Extend `pipeline/validate.py` with new cross-checks.

**Steps:**
1. Existing validation checks stay (Phase 0).
2. Add: total MPAN count = 222
3. Add: every site in electricity_monthly.json has 15 months of data
4. Add: single-meter site reconciliation within tolerance
5. Add: gas reconciliation within tolerance
6. Cross-check site coordinates against canonical site list — every canonical ID must have a coordinate.

**PASS criteria:**
- Validation runs clean (TOTAL VALIDATION ISSUES: 0)
- Build log shows the new checks ran

**Commit:** `chunk-7(phase-1a): extend validation`

---

### Chunk 8 — Pipeline integration + clean rebuild

**Goal:** Wire new readers into `pipeline/build.py`. Clean rebuild from empty `dist/eir/`.

**Steps:**
1. Add the 3 new outputs to the build orchestrator.
2. Delete `pipeline/dist/eir/*.json` (keep build_log.txt? — clear and let it regenerate).
3. `python pipeline/build.py` — should produce all 8 JSON files (5 old + 3 new) + build_log.txt.
4. Verify validation runs clean.

**PASS criteria:**
- Clean rebuild from empty dist produces all 8 files
- Validation 0 issues
- Build log shows all readers ran

**Commit:** `chunk-8(phase-1a): integrate new readers, clean rebuild`

---

### Chunk 9 — Reusable components: DataStatusBadge + MetricTile

**Goal:** Build the small reusable components first. Used by multiple pages.

**Before starting:** Read Appendix C in full (especially C.1, C.4, C.9, C.14). Look at the reference images in `docs/briefs/visual-reference-*.png`.

**`eir/src/components/DataStatusBadge.jsx`:**

Per Appendix C.9. Pill component:
- Rounded rectangle, height 24px, padding 4px 12px
- Font: Inter 12px weight 500, white text
- Background colour by status: confirmed=`#3eb489`, partial=`#e8b94e`, missing=`#d65c4e`, not_applicable=`#6a6a6a`
- Optional small dot icon to the left of the label

**`eir/src/components/MetricTile.jsx`:**

Per Appendix C and the image references:
- Card-style component but **no box shadow** (the design is flat)
- Background: slightly lighter than the page bg (use `rgba(255,255,255,0.04)` on dark, `rgba(0,0,0,0.03)` on cream)
- Padding: 24px
- Border-radius: 8px
- Layout: small label at top (Inter 13px, muted), big value in Playfair (48-64px depending on context), small unit + status badge below
- Optional "Why this matters" callout line at the bottom in muted Inter 13px
- Optional onClick → navigation

Update `eir/src/index.css` with the expanded token set from Appendix C.1 (--bg-dark, --bg-cream, --text-on-dark, etc.) and the status colours from C.9.

**PASS criteria:**
- Both components render in isolation when added to App.jsx test mount
- DataStatusBadge shows correct colours for all 4 states
- MetricTile shows label, value, unit, badge, callout
- Tokens added to `:root` in index.css

**Commit:** `chunk-9(phase-1a): DataStatusBadge + MetricTile components`

---

### Chunk 10 — UK map component

**Goal:** Build the `UkMap` component. **Highest-risk chunk** — give yourself a budget of 90 minutes max; if blocked at 90, stop and document.

**Before starting:** Re-read Appendix C.6 carefully. Look closely at `docs/briefs/visual-reference-3-inventory-map.png` — that's the look to match (it's a world map there but the styling is what we want for our UK version).

**Approach (per C.6):**

1. **Background**: page navy `#0f1419`
2. **UK landmass**: stippled dot pattern in `#2a3845` (slightly lighter than bg)
3. **Site markers**: coral filled circle (~10px diameter) with translucent coral halo behind (~30px diameter, opacity 0.25)
4. **Hover tooltip**: small dark box with site name + key metric
5. **Side legend (left of map)**: list of sites sorted by some metric, with inline horizontal bars

**Step-by-step:**

1. Get a simplified UK outline SVG path. Sources to try (in order, abort if not found in 20 minutes):
   - Wikipedia: "File:United Kingdom location map.svg" — public domain, has clean path
   - natural-earth-vector (GitHub): low-res GB outline GeoJSON
   - Fallback: hand-trace a coarse outline path. Coarseness is fine — the dotted overlay hides imprecision.

2. Build the stippling effect:
   - Create an SVG `<pattern>` of small circles (3px diameter, fill `#2a3845`, spaced 10px apart in a grid)
   - Apply pattern to the UK outline path as fill
   - Alternative (if pattern approach is finicky): generate a grid of points across the viewBox, test each point against the UK path with `isPointInPath`, only render dots where true

3. ViewBox sized to UK bounding box: roughly `lat 49.9 to 56.0` (Y axis, INVERTED), `lon -6.0 to 2.0` (X axis).

4. Convert lat/lon to SVG x,y:
   ```js
   function project(lat, lon, viewBox) {
     const x = ((lon - viewBox.minLon) / (viewBox.maxLon - viewBox.minLon)) * viewBox.width;
     const y = ((viewBox.maxLat - lat) / (viewBox.maxLat - viewBox.minLat)) * viewBox.height;
     return { x, y };
   }
   ```

5. Render dots: for each site, render two circles — the halo (r=15, fill coral with opacity 0.25) and the marker (r=6, fill coral). Add `onClick` to navigate to site detail.

6. Hover state: enlarge marker to r=8, show tooltip with site name + landlord CY25 elec.

7. Left-side legend: list 15 sites with name + horizontal bar (coral fill on `rgba(255,255,255,0.08)` track) + numeric value. Sort by landlord elec desc.

8. Colour-code dots by data completeness: if a site has electricity_monthly with 12 months + landlord kWh > 0 → keep coral. If partial → amber `#e8b94e`. If missing → red `#d65c4e`. This is secondary to the visual style — the halo + coral is the dominant treatment.

**Fallback path (if stippling fails or eats time):**
- Use solid silhouette of UK in `#1a2632` (slightly lighter than bg)
- Coral dots with halos on top
- This loses the stippled aesthetic but keeps the overall feel. Acceptable for demo.

**PASS criteria:**
- Component renders 15 dots positioned roughly correctly (Bramshott south coast, Edwalton north, Millbrook far west, Ledian east Kent)
- Dots have coral halo effect
- Click navigates to `/site/[id]`
- Hover shows tooltip
- Left-side legend visible with horizontal bars
- Responsive: SVG scales with container width

**Commit:** `chunk-10(phase-1a): UkMap component`

---

### Chunk 11 — EnergyChart component

**Goal:** Build the Recharts stacked bar.

**Before starting:** Read Appendix C.8.

**Steps:**
1. Install recharts if not already: `npm install recharts` in eir/.
2. `eir/src/components/EnergyChart.jsx`:

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function EnergyChart({ data }) {
  // data: array of { month, hh, nhh, gas }
  // Renders stacked bar chart, 15 months wide
  // Colours per C.8: HH = #e35d4a (coral), NHH = #888, Gas = #1a2740 (navy)
  // Grid: rgba(0,0,0,0.05) on cream bg (this chart appears on Site Detail which is cream)
  // Y axis labels in muted text
  // Tooltip: dark navy box with white text + drop shadow
}
```

3. Format month labels as "Oct 24", "Nov 24", etc.

**PASS criteria:**
- Component renders with sample Austin Heath data
- 15 bars visible (Oct 24 to Dec 25)
- Stacked HH (coral), NHH (grey), Gas (navy)
- Tooltip on hover shows month + values
- ResponsiveContainer adapts to mobile

**Commit:** `chunk-11(phase-1a): EnergyChart component`

---

### Chunk 12 — Landing page extension

**Goal:** Rebuild the Landing page following the left-text / right-visual pattern from Appendix C.5.

**Before starting:** Read Appendix C.1, C.2, C.3, C.4, C.5, C.7. Look at `docs/briefs/visual-reference-1-home.png` — that's the target shape.

**Page structure (top to bottom):**

1. **Top navigation bar** (Appendix C.2): cream-grey strip, "Portfolio | Insights" links, IVG × NZA logos on right
2. **Sub-nav bar** (C.3): empty for Portfolio for now (or could have "Overview" tab) — keep the bar present for consistency, even if empty
3. **Hero section** (C.5 — left/right layout):
   - **Left 40%**: 
     - Big title: "Portfolio overview" (Playfair Display 56px, coral)
     - Subtitle paragraph: "13 sites under operational control across England. Landlord electricity and gas data from Ecotricity billing, cross-checked against arbnco portfolio totals. Data CY2025."
     - 4 stat tiles in a 2×2 grid: Sites count / Total GIA / CY25 elec landlord / CY25 gas
   - **Right 55%**: UK map component with 13 dots
4. **Below hero (full-width)**: "All sites" section
   - Section subtitle: "All sites" (Playfair 24px, sage)
   - Site table with these columns: Site / Heating / Grid / Total GIA / Units / Elec data / Gas data
   - Last two columns are DataStatusBadge components
   - Mobile: collapse to stacked cards (existing pattern works, just style cards per the new tokens)

**Critical changes from current Landing:**
- Page background: switch to `--bg-dark` (was light)
- Title: switch from current style to Playfair 56px coral
- Layout: left/right split, NOT stacked
- Cards: restyle per Appendix C (no shadow, slight bg tint, big Playfair number)
- Table: restyle per C.10 (no vertical borders, generous row height)

**PASS criteria:**
- Page bg is deep navy
- Top nav bar visible with Portfolio in active state
- Left-right hero layout works on desktop
- UK map visible and clickable
- 4 stat tiles visible left side
- Site table visible below with status badges in last 2 columns
- Mobile: layout stacks correctly

**Commit:** `chunk-12(phase-1a): landing page rebuild`

---

### Chunk 13 — Site Detail page

**Goal:** Replace JSON dump with a real page on cream background.

**Before starting:** Read Appendix C.1, C.4, C.5, C.10. Look at `docs/briefs/visual-reference-4-inventory-themes.png` — that's the closest reference (cream/light treatment for an interior page).

Wait — the visual references all show dark or navy treatments for interior pages. The cream treatment idea was based on Image 2 (Explainers). For Site Detail specifically, use the **dark navy bg with cream text** approach to match other interior pages. This is a tactical adjustment — flag in STATUS.md if Chris wants it changed.

**Actually**: Site Detail uses **dark navy bg** (`--bg-dark`) to match Inventory/Insights style. Cream/light is reserved for special pages like Explainers (which we're not building in Phase 1A).

**Page structure (top to bottom):**

1. **Top nav** (C.2): with "Portfolio | Insights | Site Detail" (3rd active)
2. **Sub-nav** (C.3): tabs across the top — "Overview / Energy / MPANs / Data Quality". For Phase 1A, these can be in-page anchors that scroll to sections (don't need to be real routes).
3. **Back link**: small "← Back to portfolio" link, Inter 14px muted
4. **Hero section** (left/right layout):
   - **Left 40%**:
     - Big title: site display_name (Playfair 56px, coral)
     - Subtitle: archetype tags (heating, grid type, units, GIA) in clean row
     - 4 MetricTiles in 2×2 grid: Electricity (landlord) / Gas (landlord) / Water / Waste
   - **Right 55%**:
     - Subtitle: "Monthly electricity"
     - EnergyChart with this site's monthly data
5. **Section: MPAN inventory** (full-width below hero):
   - Section subtitle: "MPAN inventory" (Playfair 24px, sage)
   - Table styled per C.10
   - Show landlord MPANs always visible (top)
   - Voids collapsible with "Show 47 voids" expander
   - Columns: MPAN / Type / Category / CY25 kWh / Months Covered
6. **Section: Data quality** (full-width):
   - Section subtitle: "Data quality"
   - Table:
     | Metric | Status | Source | Notes |
     |---|---|---|---|
     | Electricity landlord | DataStatusBadge | Ecotricity billing CY25 | 12 months, X MPANs |
     | Gas | DataStatusBadge | Ecotricity billing | ... |
     | Water | DataStatusBadge | etc | |
     | Waste | DataStatusBadge | etc | |
     | Resident energy | DataStatusBadge | Derived from arbnco delta | Sycous integration pending |

**Empty data handling:** if a site has no electricity_monthly entry (Sonning Common might not), show "No electricity data available — see Data Quality below" placeholder in the energy section and skip the chart.

**PASS criteria:**
- `/site/austin-heath` renders all 4 sections, no JSON dump visible
- Page bg matches other interior pages (dark navy)
- 4 MetricTiles arranged in 2×2 in left column
- EnergyChart visible right column
- MPAN table shows landlord + collapsible voids
- Data Quality table shows status badges
- `/site/sonning-common` handles empty data gracefully
- Mobile: tiles stack 2×2 then chart full-width below, MPAN table scrolls horizontally

**Commit:** `chunk-13(phase-1a): site detail page`

---

### Chunk 14 — Portfolio Insights page

**Goal:** New page at `/insights`. Three sections.

**Before starting:** Read Appendix C.1, C.4, C.5, C.13.

**Page structure (top to bottom):**

1. **Top nav** (with Insights in active state)
2. **Sub-nav** (can be empty or have "Reconciliation / Voids / Data Quality" anchors)
3. **Hero section** (left/right layout per C.5):
   - **Left 40%**:
     - Big title: "Insights" (Playfair 56px, coral)
     - Subtitle paragraph: "Where the data lives, where the gaps are, and what triangulating across Ecotricity, arbnco, and Stark tells us."
   - **Right 55%**:
     - Subtitle: "Ecotricity vs arbnco — CY25 electricity"
     - Recharts horizontal grouped bar chart, 13 sites × 2 bars (Eco landlord, arbnco total). Coral for Eco, sage `#5ba59d` for arbnco.
     - Callout below: "Single-meter sites match within 10%. Multi-meter sites show 50-80% gap — arbnco is including resident MPANs despite the landlord-only note. The gap = ~3.9 GWh implied resident electricity (Scope 3 Cat 13)."

4. **Section: Void waste** (full-width, special treatment per C.13):
   - Background: slightly different tint, e.g. `rgba(227, 93, 74, 0.06)` (faint coral wash)
   - Left side: Big number "£49,134 / year" in Playfair 96px coral
   - Subtitle: "82 high-consumption void apartments billing IVG above standby levels. 178,669 kWh across CY25."
   - 3-column breakdown below:
     - "Ledian Gardens" — 48 voids — 104 MWh
     - "Bramshott Place" — 21 voids — 43 MWh
     - "Durrants Village" — 3 voids — 18 MWh — "eye-catching"

5. **Section: Data completeness heatmap** (full-width):
   - Section subtitle: "Data completeness"
   - CSS grid: 13 sites (rows) × 4 metrics (cols: Elec / Gas / Water / Waste)
   - Each cell: 60px tall, coloured per status (green/amber/red/grey)
   - Each cell shows status as small text inside
   - Clickable → navigate to site detail
   - Hover: slight scale + outline

**PASS criteria:**
- `/insights` route works, page bg deep navy
- Reconciliation chart visible right of hero
- £49k callout big and prominent
- Heatmap renders 13×4 grid, colour-coded
- Cells clickable

**Commit:** `chunk-14(phase-1a): insights page`

---

### Chunk 15 — Final QA + local build verification

**Goal:** End-to-end QA, local build success, do not push.

**Steps:**
1. `npm run build` in eir/. Should succeed with no warnings.
2. `npm run preview` — load all routes:
   - `/` (Landing)
   - `/site/austin-heath`, `/site/millbrook-village`, `/site/sonning-common` (each works)
   - `/insights`
3. Mobile breakpoint test: resize browser to 375px width, every page should be usable.
4. Click-test: dots on map navigate, table rows navigate, insights heatmap cells navigate.
5. Spot-check data accuracy: Austin Heath CY25 = 2.93 GWh; Millbrook landlord MPAN count = 12; £49k void cost visible on insights.
6. Update STATUS.md with: chunks completed, any unresolved issues, any visual problems Chris should know about before pushing.
7. Write `docs/phase-1a-demo-readiness.md` summarising: what works, what's rough, what's missing, suggested 1-hour polish list for Chris.

**PASS criteria:**
- `npm run build` succeeds, zero warnings
- All routes load locally
- Mobile breakpoint behaves
- No JSON dumps visible anywhere
- STATUS.md updated, demo-readiness doc written

**Do NOT do:**
- Do not push to main
- Do not run `vercel deploy`
- Do not change vercel.json

**Commit:** `chunk-15(phase-1a): QA + local build verified, ready for Chris review`

---

## Hard stops (stop immediately, document, exit)

- Source workbooks missing from `pipeline/source-data/` (chunk 1)
- Excel parsing produces zero rows where 100+ expected (chunks 3-6)
- Validation fails after chunk 7 with cross-check breach >50%
- Recharts install fails (chunk 11)
- `npm run build` produces errors (chunk 15)
- Any 15-minute block

## Voice and style for any user-facing copy

Per CLAUDE.md:
- Measured, professional, slightly understated
- No first-person ("we", "our")
- No internal-team language
- Sentence case headings
- Em-dashes for parentheticals
- No emojis in body copy (status icons in DataStatusBadge are OK)

Example callouts that fit the voice:
- ✓ "13 sites under operational control. Click any dot to drill into site detail."
- ✓ "Single-meter sites match arbnco within 10%. Multi-meter sites show a 50-80% gap, consistent with arbnco including resident MPANs."
- ✗ "We've found that arbnco's data is unreliable" (first person, accusatory)
- ✗ "🚨 £49k of waste!" (emoji, sensationalist)

---

## Appendix A — Site coordinates (verbatim content for `pipeline/site_coordinates.json`)

```json
{
  "austin-heath": {"name": "Austin Heath", "lat": 52.290, "lon": -1.560},
  "gifford-lea": {"name": "Gifford Lea", "lat": 53.156, "lon": -2.756},
  "bramshott-place": {"name": "Bramshott Place", "lat": 51.082, "lon": -0.794},
  "millbrook-village": {"name": "Millbrook Village", "lat": 50.682, "lon": -3.527},
  "durrants-village": {"name": "Durrants Village", "lat": 51.082, "lon": -0.345},
  "great-alne-park": {"name": "Great Alne Park", "lat": 52.220, "lon": -1.840},
  "ledian-gardens": {"name": "Ledian Gardens", "lat": 51.220, "lon": 0.640},
  "elderswell": {"name": "Elderswell", "lat": 52.165, "lon": -0.595},
  "millfield-green": {"name": "Millfield Green", "lat": 51.876, "lon": -0.475},
  "ampfield-meadows": {"name": "Ampfield Meadows", "lat": 51.020, "lon": -1.418},
  "blendworth-hills": {"name": "Blendworth Hills", "lat": 50.910, "lon": -1.020},
  "sonning-common": {"name": "Sonning Common", "lat": 51.518, "lon": -0.965},
  "edwalton-office": {"name": "Edwalton Office", "lat": 52.917, "lon": -1.131},
  "edenbridge-dev": {"name": "Edenbridge (dev)", "lat": 51.197, "lon": 0.066},
  "little-mount-lake-dev": {"name": "Little Mount Lake (dev)", "lat": 51.131, "lon": 0.262}
}
```

---

## Appendix B — Expected source data structure

**`Ecotricity_Master_IVG_AUDIT.xlsx`** — 16 tabs. Key tabs for this brief:
- "MPAN Register" — 222 MPANs with classification (rows 5–226, see chunk 4 spec)
- "Site x Month Summary" — 15 months × 15 sites × HH/NHH/Gas (see chunk 3 spec)
- "Landlord vs Resident" — per-site landlord/void totals (see chunk 5)
- "Arbnco Reference" — per-site arbnco totals (see chunk 5)
- "Void Investigation" — high-consumption voids (see chunk 5)

Tabs you do not need: "Raw - Units", "Raw - Invoices", "Raw - Credits" (those are the source data the workbook computes from — the summary tabs are pre-computed for you).

**`26003-NZA-IVG-XX-SH-1000_P06_-_RFI_Register.xlsx`** — 11 tabs. Key tab:
- "RFI_P06" — 33 RFI items (see chunk 6 spec)

Other tabs (Electricity LL, Electricity Void, Gas LL, etc.) contain MPAN-level detail that's also in the Ecotricity master — don't double-source. Just RFI_P06.

---

## Appendix C — Visual conventions (CRITICAL — read before any UI work)

This tool must visually match NZA's existing carbon inventory reports (Eckersley O'Callaghan / Net Zero Advisory / Kurb). Those reports are narrative documents; this is an operational dashboard, so adapt where needed — but the design language is the same.

The existing Phase 0 brand palette in `eir/src/index.css` (navy/coral/cream) **needs to be expanded** with the section colour system and additional tokens below. Update `:root` with the full token list before building any new components.

### C.1 Section colour system (page-level identity)

Each top-level section has its own background colour. Inverts between dark and light. This is the strongest visual signal in the design.

| Section | Page background | Text colour | When used |
|---|---|---|---|
| Portfolio (Home) | `#0f1419` (deep navy) | cream/white | Landing |
| Insights / Inventory | `#0f1419` (deep navy) | cream/white | Reconciliation, void analysis, completeness heatmap |
| Site Detail | `#f5f1ea` (cream) | dark navy/black | Per-site drill-down |
| Methodology (future) | `#1f3a32` (forest green) | cream/white | Phase 2 |

For Phase 1A: only the **deep navy** and **cream** treatments are needed. Forest green is for future sections.

**Token names:**
```css
--bg-dark: #0f1419;          /* deep navy - Portfolio + Insights */
--bg-cream: #f5f1ea;         /* cream - Site Detail */
--bg-forest: #1f3a32;        /* forest green - future */
--text-on-dark: #e8e6e0;     /* cream-ish text on dark bg */
--text-on-cream: #1a1a1a;    /* dark text on cream bg */
--text-muted-on-dark: #8a8a8a;
--text-muted-on-cream: #666666;
```

### C.2 Top navigation bar

Light cream/grey strip at top of every page (the bar is the SAME colour regardless of which section's page is below it — it's a constant element):
- Background: `#e5e5e0` (cream-grey)
- Height: 64px
- Left: section labels in horizontal row — `Portfolio` / `Insights` / `Site Detail` (last only visible when on a site page; or just Portfolio + Insights for Phase 1A)
- Right: logos (for Phase 1A: just "IVG × NZA" text logos in muted grey)
- Active section: coral text `#e35d4a` with subtle coral background pill
- Inactive sections: dark grey `#1a1a1a`
- Font: Inter, weight 500, size 16px

### C.3 Sub-navigation bar (immediately below top nav)

A darker contextual band per section:
- Portfolio: thin navy `#0f1419` band, height 48px
- Site Detail page: thin cream-darker `#e8e2d4` band, height 48px
- Sub-nav items use the page's accent colour for active state
- Used for tabs WITHIN a section (e.g. on Site Detail: `Overview / Energy / MPANs / Data Quality`)

For Phase 1A landing/insights pages, the sub-nav can be empty or omitted. On Site Detail page, use it for in-page tabs.

### C.4 Typography

- **Big section titles (page hero)**: Playfair Display, weight 400, size 56px on desktop / 36px mobile, colour **coral `#e35d4a`** when on dark bg, or **navy `#0f1419`** when on cream bg. Use sentence case ("Your Net Zero Strategy" pattern — but our pages: "Portfolio overview", "Site detail", "Insights").
- **Section subtitles**: Playfair Display, weight 400, size 24px, colour `#7ba89f` (muted sage green) when on dark, or `#3a5d52` when on cream. Used for "Where the grids are today" type sub-headings.
- **Body text**: Inter, weight 400, size 15-16px, line-height 1.6.
- **Small / caption**: Inter, weight 400, size 12-13px, in muted colour.
- **Numbers in callouts** (donut centre, big stats): Playfair Display, weight 400, size 64-80px.
- **Letter-spacing**: slightly loose on titles (`letter-spacing: 0.01em`).

### C.5 Layout — left text panel + right visual

The recurring page pattern (used on Home, Explainers, parts of Inventory):

```
+----------------------------------------------------------+
|                  TOP NAV                                 |
|----------------------------------------------------------|
|                  SUB-NAV (if used)                       |
|----------------------------------------------------------|
|                                                          |
|   LEFT 40%             |        RIGHT 55%                |
|   - Big title in       |        - Hero visual            |
|     coral/navy         |          (chart, map, diagram)  |
|   - Narrative          |        - Takes most of screen   |
|     paragraph          |          height                 |
|   - CTA buttons        |        - Optional legend below  |
|                        |                                 |
+----------------------------------------------------------+
```

- Max content width: 1400px, centred
- Side padding: 60px desktop, 20px mobile
- Generous vertical padding above hero: 80-120px from top of sub-nav
- Left and right columns: about 40/55 split with a 5% gutter
- Mobile: stack — left content first, then right visual below

This is the **default page pattern**. Use it for:
- Landing (left: title + intro + cards / right: UK map)
- Site Detail (left: site name + metadata + metric tiles / right: monthly chart)
- Insights (left: section title + commentary / right: reconciliation chart, then below: void callout full-width, then below: heatmap full-width)

### C.6 Map style (CRITICAL for landing page)

Reference: the Inventory > Map page (Image 3).

- **Background**: page navy `#0f1419`
- **Land mass**: stippled/dotted pattern in muted blue-grey. Each "dot" is a small circle, ~3px diameter, fill `#2a3845` (slightly lighter than bg), spaced ~10px apart in a grid pattern that follows the UK outline.
- **City/site markers**: coral filled circle `#e35d4a`, ~10px diameter
- **Halo effect**: translucent coral circle behind each marker, ~30px diameter, opacity 0.25 — gives the soft glow effect
- **Hover tooltip**: small dark navy box with site name + key metric, e.g. "Millfield Green • 840 MWh • 89 units". Inter 13px. Slight drop shadow.
- **Side legend (left of map)**: list of sites with inline horizontal bar showing a value + expand chevron, sorted by value desc. Each row: site name + bar (coral fill on dark track) + numeric value + chevron.

**Implementation approach for UK:**
- Use a stippled dot pattern over a UK outline — can be done with SVG `<pattern>` element clipped by UK path, OR by generating a grid of dots and only rendering those that fall inside the UK outline path.
- If full stippling is too risky for overnight, **fallback**: solid UK silhouette in `#1a2632` (slightly lighter than bg) with coral dots on top. Accept that the stippling effect can be added in a polish pass.
- Either way: the **soft coral halo behind each site dot is essential** — that's the signature look.

### C.7 Pill toggle groups (used for filters/views throughout)

Reference: "By Theme | By Scope" toggle in Image 1, "General | Estate | Travel | Supply | Total" in Image 3, "Overview | Grid Carbon | Data Gaps" in Image 4.

```css
.toggle-group {
  display: inline-flex;
  background: rgba(255,255,255,0.05); /* on dark bg */
  border-radius: 24px;
  padding: 4px;
}
.toggle-pill {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted-on-dark);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-pill.active {
  background: var(--color-accent); /* coral */
  color: white;
}
```

On cream bg: swap the wrapper background to `rgba(0,0,0,0.04)` and active pill stays coral.

### C.8 Charts (Recharts conventions)

**Donut chart** (Home hero pattern — could be used for "Portfolio energy by source"):
- Outer radius 200, inner radius 130 (thin ring, lots of breathing room in centre)
- Hollow centre with big number (Playfair 72px) + tiny caption below
- Segments use the **theme palette**: coral `#e35d4a` for one segment, sage `#5ba59d` for another, muted blue `#6b88a3` for a third, amber `#d4a44a` for a fourth
- Legend to the side, NOT below: with coloured dot + label + value, right-aligned numbers, with chevron for drill-down

**Horizontal bar chart** (Image 3 left side, Image 4 grid carbon):
- Track: `rgba(255,255,255,0.08)` rail
- Fill: coral `#e35d4a` OR theme colour (green/amber/orange/red for status ranges)
- Height: 28px per bar
- Right-aligned numeric value at end of bar
- For Image 4 style range bars: coloured fill from min to max, with white-circle dot at "central case" position

**Stacked bar chart** (the EnergyChart for monthly electricity):
- Bars per month, 15 months
- Stacks: HH (coral `#e35d4a`), NHH (muted grey `#888`), Gas (navy `#1a2740`)
- Background grid lines very subtle: `rgba(255,255,255,0.05)` on dark, `rgba(0,0,0,0.05)` on cream
- Y axis labels in muted text colour
- X axis labels at 45deg if needed, otherwise horizontal "Oct 24" style
- Tooltip on hover: dark navy box, drop shadow, white text

### C.9 Status colour palette (for DataStatusBadge)

The carbon inventory uses a coordinated colour ramp for ranges (clean to dirty):
- Cleanest/best: `#3eb489` (green)
- Light positive: `#9bc88f` (yellow-green)
- Warning: `#e8b94e` (amber)
- Concern: `#e89c4e` (orange)
- Worst: `#d65c4e` (red)

For our DataStatusBadge:
- `confirmed`: `#3eb489` (green)
- `partial`: `#e8b94e` (amber)
- `missing`: `#d65c4e` (red)
- `not_applicable`: `#6a6a6a` (muted grey)

Pill style: rounded rectangle, height 24px, padding 4px 12px, font Inter 12px weight 500, white text on coloured background.

### C.10 Tables

- No vertical borders — only horizontal
- Row borders: `rgba(255,255,255,0.06)` on dark, `rgba(0,0,0,0.06)` on cream
- Header row: slightly muted text (`text-muted-on-dark/cream`), uppercase, letter-spacing 0.05em, font 12px
- Body rows: 16px font, generous row height (56px)
- Hover state: subtle row highlight `rgba(255,255,255,0.03)` on dark, `rgba(0,0,0,0.03)` on cream
- Numeric columns right-aligned
- No alternating row colours (would clash with the section bg colour identity)

### C.11 Buttons

**Primary CTA** (e.g. "Take me to the strategy" in Image 1):
- Background: coral `#e35d4a`
- Text: white, Inter 14px weight 500
- Padding: 14px 28px
- Border-radius: 8px
- Hover: slight darken `#cc5343`
- Subtle right-arrow icon → after text

**Secondary** ("Let me explore"):
- Background: transparent
- Border: 1px solid `rgba(255,255,255,0.2)` on dark, or `rgba(0,0,0,0.15)` on cream
- Same text and padding
- Hover: subtle background tint

### C.12 Callout cards (for "Why this matters" lines)

On dark bg:
- Background: `rgba(255,255,255,0.04)`
- Border-left: 3px solid coral `#e35d4a`
- Padding: 16px 20px
- Text: Inter 14px, slightly muted
- Border-radius: 0 6px 6px 0

On cream bg: invert — `rgba(0,0,0,0.03)` background.

### C.13 The £49k void callout (Insights page) — special treatment

Inspired by Image 1's hero stat treatment:
- Full-width section, dark navy bg
- Big number left-aligned, Playfair 96px in coral
- "£49,134 / year" with secondary text underneath
- 3-column breakdown below with site hot spots
- Use spacing and typography to give it gravitas — this is the "money line" of the demo

### C.14 Generous whitespace — non-negotiable

The whole design language relies on **lots of space above the fold**. The hero typically starts ~120px from the top of the sub-nav bar. Don't cram content. Pages should breathe.

Minimum vertical spacing between major sections: 64px desktop, 40px mobile.

### C.15 Fonts (already loaded)

- **Playfair Display** (serif): all titles, big numbers, section sub-headings. Weight 400 primarily.
- **Inter** (sans): all body text, labels, buttons, table cells, navigation. Weights 400 and 500.

Both already loaded via Google Fonts in Phase 0.

### C.16 What NOT to do

- ❌ No box shadows on cards / tiles (the design is flat — uses background colour shifts for hierarchy, not shadows)
- ❌ No bright primary colours other than coral (no blue links, no bright greens, no purples)
- ❌ No emojis in body copy (status badges may use icon glyphs from Lucide React only)
- ❌ No gradient backgrounds
- ❌ No animations beyond subtle hover state transitions (0.2s ease)
- ❌ No drop shadows except on hover tooltips
- ❌ Do NOT use the existing Phase 0 landing layout as-is — it's a placeholder. The new layout follows C.5 (left text / right visual) pattern.

### C.17 Component spec reminder — match these patterns

When building each new component in chunks 9-14, **first** look at how the carbon inventory reports do equivalent things (per the images). When in doubt, match. The brief here captures what's extractable from the images — the public repo will have more detail when available, but Claude Code should use what's documented here in the meantime.

Specifically:
- **UkMap (chunk 10)**: see C.6 — stippled UK + coral dots + halos + left legend with inline bars
- **EnergyChart (chunk 11)**: see C.8 — stacked bar, coral/grey/navy palette, subtle gridlines
- **MetricTile (chunk 9)**: minimal card, no shadow, page-appropriate bg, big number in Playfair, label in Inter, status badge in corner
- **DataStatusBadge (chunk 9)**: see C.9 — green/amber/red/grey pill
- **Landing page (chunk 12)**: see C.5 — title left, map right
- **Site Detail (chunk 13)**: cream bg, navy title, then full-width sections below — metric tiles row, energy chart, MPAN table
- **Insights (chunk 14)**: dark bg, three full-width sections stacked

---

## Appendix D — Reference images

Five images of the existing NZA carbon inventory reports are at:
- `docs/briefs/visual-references/visual-reference-1-home.png`
- `docs/briefs/visual-references/visual-reference-2-explainers.png`
- `docs/briefs/visual-references/visual-reference-3-inventory-map.png`
- `docs/briefs/visual-references/visual-reference-4-inventory-themes.png`
- `docs/briefs/visual-references/visual-reference-5-strategy.png`

Chris will place these in `docs/briefs/visual-references/` before starting Claude Code. **View these before building UI components.** They show exactly what the design language looks like in practice.

What each shows:
1. **Home (visual-reference-1)**: dark navy bg, left-text/right-donut layout, coral title, hero stat with donut + side legend
2. **Explainers (visual-reference-2)**: cream bg, left text panel + right illustrated diagram, shows the colour inversion pattern
3. **Inventory Map (visual-reference-3)**: dark navy bg, dotted world map, coral markers with halos, left side has site-list with inline bars and value bars
4. **Inventory Themes (visual-reference-4)**: dark navy bg, left text + right horizontal range bars (status colour ramp green→red), pill toggle group at top
5. **Strategy (visual-reference-5)**: forest green bg, toggle controls, intervention list with right-side Gantt-style timeline

If the images are not present, fall back to the written spec in Appendix C.

---

## Notes for the morning (Chris's review checklist)

When Chris wakes up, suggested order:
1. Read STATUS.md and `docs/phase-1a-demo-readiness.md`
2. `npm run preview` locally, click through every route
3. If acceptable: `git push origin main`, watch Vercel deploy, verify live URL
4. Fix top 3 visible issues (estimated 1-2 hours)
5. Demo at IVG

If something is fundamentally broken (e.g. map dots wildly mispositioned, charts not rendering), the fallback is: revert to the chunk-10 polished landing (already deployed) for the demo, present the new pages as "in development" with screenshots from the local build.

---

End of brief.
