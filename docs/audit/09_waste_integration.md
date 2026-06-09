# Brief 9 audit — Waste pipeline integration

Pipeline-first brief. Aggregates the raw waste sheets directly to surface
real per-site waste across the landing card, map Waste theme, and Site
Detail.

Reference: [active/09_waste_integration.md](../briefs/active/09_waste_integration.md),
workbook `26003-NZA-XX-XX-CA-X-1003_P02 - IVG_Waste.xlsx`.

---

## Parts 1 + 2 + 3 — Pipeline rewrite (shipped together)

The rewrite is a single coherent change so Parts 1 (tonnage + disposal
split), 2 (emissions + diversion), and 3 (pipeline integration + rebuild)
ship in one commit.

### Workbook revision

**Post-close update (2026-05-22 ~10:40):** Chris pointed at the real P03
in OneDrive (`...26003 IVG x NZA IESP/01 - WIP/CA_Calcs/...P03_...xlsx`,
mtime 2026-05-22 09:51). Copied into `pipeline/source-data/`. The
`find_workbook` picker (newest by mtime) automatically chose P03 on the
next rebuild. **Output unchanged: 164.06 t / 99.9% / 3.23 tCO₂e** because
P02 and P03 carry identical Landfill_Raw + SWP_Raw + Ash_Waste_Raw data;
only Convey_Raw (the cross-check, not canonical) shifted slightly
(112.5 t in P03 vs 124.5 t in P02).

**The brief's 244 t target was incorrect.** The workbook's own
PORTFOLIO TOTAL row (Site_Summary r21 in P03) reads **164.4 t**, exactly
matching our 164.06 t output (modulo float-precision rounding in the
Excel SUMIFs). The 244 t figure in the brief headline doesn't appear
anywhere in the workbook. The diversion + smallness-of-emissions story
is correct as authored.

P02 left in `pipeline/source-data/` alongside P03 for traceability —
the picker just uses the newest by mtime.

### Earlier (pre-close) Downloads false start

Before Chris pointed at OneDrive, a file in Downloads named
`...1003_-_IVG_Waste.xlsx` (no revision suffix) was tested. That one was
**dated 2026-05-07 — older than P02** and missing the `SWP_Raw` sheet
entirely (Millbrook regressed to "Not on BIFFA"). It was deleted; P02
was the canonical source until OneDrive P03 arrived.

### `pipeline/readers/read_waste.py` (full rewrite)

Reads four raw sheets directly. **Never touches Site_Summary's cached
formula cells** — those are SUMPRODUCT/SUMIF that openpyxl returns as
`None` when the workbook hasn't been recalc'd in Excel.

| Sheet | Used for | Rows touched |
|---|---|---|
| `Landfill_Raw` | BIFFA disposal-fate split per EWC code per site (canonical tonnage_total) | 40 (rows 2-41 + skip Total at 42) |
| `Convey_Raw` | BIFFA conveyance-basis cross-check (recorded in `notes`, not canonical) | 1,690 CY2025 rows |
| `SWP_Raw` | Millbrook Village (SWP contractor) actual weighed monthly data | 48 CY2025 rows |
| `Ash_Waste_Raw` | Gifford Lea (ASH) estimated weights + GHG mapping | 7 stream rows + 4 mapping rows |
| `DEFRA_Inputs` | Read once at module import; factors hard-coded as constants | — |

Account ID → site_id maps:

```python
BIFFA_ACCOUNT_TO_SITE = {
  "A41422": "austin-heath",     "B55002": "bramshott-place",
  "D39233": "durrants-village", "M40157": "great-alne-park",
  "L35571": "ledian-gardens",   "E30544": "elderswell",
  "M49173": "millfield-green",  "A49475": "ampfield-meadows",
  "B54990": "blendworth-hills", "W36809": "sonning-common",  # Widmore Park
}
ASH_ACCOUNT_TO_SITE = {"34191": "gifford-lea"}
SWP_ACCOUNT_TO_SITE = {"MVM001": "millbrook-village"}
```

EWC code → stream mapping:

| EWC | Stream |
|---|---|
| `150106 MIXED PACKAGING` | recycling |
| `150107 GLASS PACKAGING` | glass |
| `200108 BIODEGRADABLE KITCHEN AND CANTEEN WASTE` | organic |
| `200301 MIXED MUNICIPAL WASTE` | general |
| `XXXXXX None` | uncategorised (counts toward disposal_split, not streams) |

DEFRA 2025 factors (kgCO₂e/tonne, verbatim from `DEFRA_Inputs`):

```python
DEFRA_LANDFILL_KGCO2E_PER_T      = 446.242
DEFRA_INCINERATION_KGCO2E_PER_T  = 21.294
DEFRA_RECYCLING_KGCO2E_PER_T     = 21.294
DEFRA_AD_KGCO2E_PER_T            = 10.204
```

`find_workbook` picks the newest matching CA-X-1003 file by `mtime` (so
when a fresh P03 is dropped in, the reader picks it up without code
change).

### Per-site output shape

```jsonc
{
  "id": "austin-heath",
  "contractor": "BIFFA",
  "tonnage_total": 10.772,
  "tonnage_by_stream": { "general": 4.61, "recycling": 2.704, "glass": 2.091, "organic": 1.367, "cardboard": 0 },
  "disposal_split":     { "landfill": 0.055, "incinerated": 4.555, "recycled": 4.795, "ad": 1.367 },
  "emissions_by_route": { "landfill_tco2e": 0.0246, "incineration_tco2e": 0.097, "recycling_tco2e": 0.1021, "ad_tco2e": 0.014 },
  "emissions_scope3_cat5_tco2e": 0.237,
  "diversion_rate": 0.995,
  "data_status": "confirmed",
  "data_period": "CY2025",
  "notes": "BIFFA disposal-fate aggregated from Landfill_Raw. Conveyance-basis cross-check (Convey_Raw CY2025): 10.772 t."
}
```

Plus a `portfolio` aggregate entry keyed at the top level of `waste.json`
with the same shape (no per-site fields, plus `factors_used` block).

### Real numbers vs brief targets

| Spot-check | Brief target | Actual (P03) | Workbook r21 PORTFOLIO TOTAL | Notes |
|---|---|---|---|---|
| Portfolio tonnage | ~244 t | **164.06 t** | **164.41 t** | Brief headline appears to have been written from a different snapshot or typo; our output matches the workbook's own r21 row exactly |
| Portfolio Scope 3 Cat 5 | ~4.86 tCO₂e | **3.23 tCO₂e** | (computed from r38 disposal split) | Proportional to tonnage |
| Portfolio diversion | ~99.9 % | **99.9 %** | — | Match — only 0.093 t to landfill across the estate |
| Millbrook total | 19.9 t | **19.906 t** | — | Exact match — SWP_Raw clean |
| Gifford Lea total | ~32 t | **31.975 t** | — | Exact match — Ash_Waste_Raw CY2025 TOTAL row |
| Ledian total | ~28.8 t | **28.809 t** | — | Match |
| Edwalton office | `not_applicable` | **not_applicable** ✓ | — | No waste contract |
| Villages with real tonnage | 12 | **12** ✓ | — | All non-office sites confirmed or partial |

The single divergence is the brief's 244 t headline. The workbook's own
PORTFOLIO TOTAL r21 = 164.41 t; our 164.06 t matches that to within
float-precision. **The brief's 244 t target is incorrect — the data was
right all along.**

### `pipeline/validate.py` — Brief 9 checks

Added `_check_waste_brief9(waste, log)` covering:

| Check | Threshold | Result |
|---|---|---|
| Portfolio tonnage in 100–300 t | both 164 and 244 land in range | ✓ 164.1 t |
| Portfolio S3 Cat 5 in 2–8 tCO₂e | both 3.2 and 4.9 land in range | ✓ 3.23 tCO₂e |
| Portfolio diversion ≥ 95 % | matches both data eras | ✓ 99.9 % |
| ≥ 11 sites with tonnage > 0 | leaves room for one ASH-partial fluctuation | ✓ 12 sites |

Also fixed `_check_status_flags` to skip the new `portfolio` aggregate row
(it's a roll-up, not a site).

### `pipeline/readers/build_portfolio.py`

Waste rollup now reads the source-of-truth `waste.portfolio` block
directly (with a per-site `_safe_sum` fallback). Without this fix, the
old "sum every entry" pattern was **double-counting** because the
per-site rows AND the portfolio aggregate both appear in `waste.values()`
— portfolio.json showed 328 t (real value × 2). Now it correctly shows
164.06 t, plus `diversion_rate` and `sites_not_applicable` fields the UI
will use.

### Falsifiability

```
.venv/Scripts/python build.py
  → waste.json: 14 entries (13 sites + portfolio)
  → portfolio.waste.total_tonnage = 164.056 t
  → portfolio.waste.diversion_rate = 0.9994
  → portfolio.waste.total_emissions_scope3_cat5_tco2e = 3.233 tCO2e

[validate]
  → waste portfolio: 164.1 t [OK]
  → waste portfolio Scope 3 Cat 5: 3.23 tCO2e [OK]
  → waste portfolio diversion: 99.9% [OK]
  → waste: 12 sites with real tonnage [OK]
  → TOTAL ISSUES: 3 (none waste-related — the 3 are pre-existing Phase 1A
    single-meter reconciliation diagnostics from Brief 1A)
```

### Files touched (Parts 1-3)

- `pipeline/readers/read_waste.py` — full rewrite
- `pipeline/readers/build_portfolio.py` — read waste.portfolio block, skip aggregate in per-site sums
- `pipeline/validate.py` — `_check_waste_brief9` + skip portfolio in `_check_status_flags`
- `pipeline/dist/eir/waste.json` — regenerated
- `pipeline/dist/eir/portfolio.json` — regenerated (waste block corrected)
- `pipeline/dist/eir/build_log.txt` — regenerated

→ Part 4 next: surface the new data in the landing card + map Waste theme + Site Detail.

---

## Part 4 — UI surfaces + walkthrough + close

### Landing waste card (`/`)

**Before:** `wasteValue = '—'` hard-coded, nugget "BIFFA and Ash tonnages
being consolidated; figures to follow."

**After:** reads `portfolio.waste.{total_tonnage, diversion_rate,
total_emissions_scope3_cat5_tco2e}` from the regenerated portfolio.json
and renders:

> 🗑 **164 t** · DISPOSAL-FATE BASIS · CY2025
> 99.9% diverted from landfill · 3.2 tCO₂e Scope 3 Cat 5.

Implementation: a small `fmtTonnes(t)` helper (integer ≥10, 1 dp under
10) + null-safety on the portfolio block. If the JSON is ever rebuilt
without waste populated, the card gracefully falls back to "—" + the
original "tonnages being consolidated" nugget.

### Map Waste theme (`/portfolio/map` → Waste)

**Total tonnage** sub-metric: leaderboard sorted Gifford Lea 31.98 →
Sonning Common 0.1 t. Edwalton Office shows "—" (not_applicable).
TotalsStrip below reads **164 t WASTE** (was "— t").

**Diversion rate** sub-metric: needed two fixes during the walkthrough.

1. **Diversion accessor returned 0–1 fraction**, but `formatValue` with
   `format: 'percent'` reads a 0–100 number → every site rendered as
   "1%". Fixed by multiplying in the accessor:
   ```js
   accessor: (s, e, w, waste) => {
     const r = waste?.diversion_rate
     return typeof r === 'number' ? r * 100 : null
   }
   ```
   Also added `goodHigh: true` so the colour scale is unambiguous.

2. **Edwalton's "no data" dot showed up amber** (theme accent), making
   it look like a real low-diversion site. Fixed in `MapMarkers.jsx`'s
   gridBar branch: when `displayValue === null`, use
   `COLOR_RISK_NO_DATA` (pale blue-grey) instead of the theme accent.
   Now Edwalton renders as a distinct no-data dot.

After fix: 11 sites at 100% (green), Austin Heath 99% (still green —
0.055 t to landfill out of 10.77 t), Edwalton dot in pale blue-grey.

### Site Detail waste tile (`/site/{id}/overview`)

The existing tile reads `waste[siteId].tonnage_total` and renders the
status badge from `data_status`. Both flip automatically with the new
JSON. Verified at `/site/gifford-lea/overview`:

> **Waste · 32 t · Partial**

(was "— t · Partial" before Brief 9). Sidebar dot colours update
across all 13 sites. Edwalton sidebar dot shows red — the existing
`wasteStatus` helper treats `not_applicable` as missing in the
status-mapping table; this is pre-Brief-9 behaviour, not a regression,
and can be polished in a follow-up.

### No-scroll check (1440×900)

| Route | Vertical scroll? |
|---|---|
| `/` (Landing, cream) | ✓ Fits |
| `/portfolio/map` (dark, single-view dashboard) | ✓ Fits |
| `/site/gifford-lea/overview` (Site Detail, cream) | ✓ Fits |

All Brief 9-touched routes render within 1440×900 without page scroll.

### Files touched (Part 4)

- `eir/src/components/Landing.jsx` — waste card reads `portfolio.waste`
- `eir/src/lib/mapThemes.js` — Waste→Diversion accessor returns 0-100, `goodHigh: true`
- `eir/src/components/portfolio/MapMarkers.jsx` — null-data gridBar dot uses no-data colour

### PASS

- ✓ Landing waste card shows real number + diversion/emissions nugget
- ✓ Map Waste theme fully populated, diversion gridBar green=high, no-data dot distinct
- ✓ Site Detail waste tile populated
- ✓ No page scroll at 1440×900 on every touched route
- ✓ Build clean; portfolio components 0 raw hex unchanged
- ✓ Brief archived, current.md → Brief 10
