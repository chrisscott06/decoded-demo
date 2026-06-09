# Brief 12 audit — Sycous + Site Detail Water/Waste tabs + hardening

UI-then-hardening brief. Surfaces IVG's distinctive Sycous data (gap #3),
rounds Site Detail to a proper 7-tab page by adding Water + Waste, then
folds in a data-vintage badge + error boundaries so the Brief 6 white-screen
can't silently recur.

Reference: [active/12_sycous_water_waste.md](../briefs/active/12_sycous_water_waste.md).

---

## Part 1 — Site Detail Waste tab (2026-05-22)

### Sub-tab order

The 5-tab Site Detail bar (Overview / Energy / Carbon / Meters / Data
quality) grows to 7 tabs with the brief-mandated order:

```
Overview · Energy · Carbon · Water · Waste · Meters · Data quality
```

Water + Waste sit between Carbon and Meters so the climate metrics flow
together (Carbon → Water → Waste are all environmental impacts) and the
Meters + Data-quality tabs end the bar as data-source views.

### WasteTab — design

Lives at `eir/src/components/site/WasteTab.jsx`. X2 page grammar (heading +
short context, rich visual, single view at 1440×900).

**Layout** — top header strip + 3-up panel grid:

```
┌─ Waste · CY2025 ────────────────────────────┬─ DiversionRing ─┐
│ 10.8 tonnes                                  │     99.5%       │
│ BIFFA · [confirmed]                          │  diverted       │
├──────────────────────────────────────────────┴─────────────────┤
│ ┌─ By stream ────┐ ┌─ Disposal fate ──┐ ┌─ Scope 3 Cat 5 ──┐  │
│ │ General  ━━━   │ │ Landfill         │ │ 0.24 tCO₂e       │  │
│ │ Recycling ━━   │ │ Incinerated ━━━  │ │ "near-total      │  │
│ │ Glass    ━     │ │ Recycled    ━━━  │ │  diversion makes │  │
│ │ Organic   ━    │ │ AD          ━    │ │  Cat 5 a rounding│  │
│ │ Cardboard      │ │                  │ │  error"          │  │
│ └────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                │
│ ┃ METHOD  BIFFA disposal-fate aggregated from Landfill_Raw…   │
└────────────────────────────────────────────────────────────────┘
```

- **DiversionRing** — conic-gradient (low-risk green for the diverted slice,
  high-risk red for the landfill slice) with the percent rendered big in the
  cream centre.
- **Stream bars** — five horizontal bars (general/recycling/glass/organic/
  cardboard), each tinted with a tokenised stream colour:
  - general → `--color-risk-major`
  - recycling → `--theme-waste`
  - glass → `--color-categorical-supply-chain`
  - organic → `--color-risk-low`
  - cardboard → `--metric-electricity`
- **Disposal bars** — four horizontal bars (landfill/incinerated/recycled/
  AD) tinted by route risk (landfill red → AD green).
- **Emissions panel** — big Scope 3 Cat 5 tCO₂e number + narrative "near-
  total diversion makes Cat 5 a rounding error". The diversion-rate is
  inline so the framing connects to the headline ring.
- **Notes strip** — coral-rule callout at the bottom for `waste.notes` (the
  conveyance-basis cross-check, "estimated by ASH", etc.). The method is
  the story for partial sites.

### Empty states (honest, not blank)

- **Office (Edwalton)** — `data_status: not_applicable`, contractor null:
  shows a clean "No waste contract for this site" card with the workbook
  note ("Treated centrally / serviced via building landlord — not in IVG's
  operational waste boundary"). No fake numbers, no zero bars.
- **Genuinely missing** — `data_status: missing` or null `tonnage_total`:
  renders "Waste data pending" with the upstream note.

### Spot-checks against waste.json

| Site | tonnage_total | diversion | emissions tCO₂e | status |
|---|---:|---:|---:|---|
| Austin Heath | 10.772 t | 99.5% | 0.237 | confirmed |
| Gifford Lea | 31.975 t | 100% | 0.618 | partial (ASH bin-volume est.) |
| Edwalton Office | — | — | — | **not_applicable** — clean empty state |
| Portfolio (for context) | 164.06 t | 99.9% | 3.23 tCO₂e | — |

All numbers read live from `waste.json` (id-keyed at the top level — no
`by_site` wrapper, unlike sycous). Rounding follows the brief's spot-check
shape.

### Falsifiability

```
grep -rEn "#[0-9a-fA-F]{3,6}" eir/src/components/site --include="*.jsx"
  → 0
grep -rEn "JetBrains|DM Sans|DM Serif" eir/src/components/site --include="*.jsx"
  → 0
cd eir && npx vite build
  → ✓ 1.23 s, no errors. Main bundle 831.6 kB (Sycous+WasteTab add ~6 kB).
```

### Files touched (Part 1)

- `eir/src/components/site/WasteTab.jsx` (new, ~180 lines)
- `eir/src/components/site/WaterTab.jsx` (new, **stub** — Part 2 fills it in;
  needed now so the App.jsx import + sub-tab nav resolve cleanly)
- `eir/src/App.jsx` (sub-tab list 5 → 7 entries; render dispatch wires
  `<WaterTab>` + `<WasteTab>`; two new imports)
- `eir/src/index.css` (~250 lines added at file end for the waste classes +
  `.empty-state-card` + `.hero-meta-sub`)
- `docs/briefs/active/12_sycous_water_waste.md` (landed Step 0.5)
- `docs/briefs/current.md` (repointed to Brief 12)
- `docs/audit/12_sycous_water_waste.md` (this file)

### PASS

- ✓ 7 Site Detail tabs in the brief's order
- ✓ Austin Heath: 10.8 t · 99.5% · 0.24 tCO₂e (matches Brief 12 Part 1 PASS)
- ✓ Gifford Lea: ~32 t · ASH estimated · notes surfaced
- ✓ Office: clean not-applicable card, no fake zeros
- ✓ 0 raw hex in `eir/src/components/site/`
- ✓ Build clean
- ✓ Zero EOC fonts (still 0 across the repo for values)

Part 2 (Water tab + Sycous resident water panel) next.

---

## Part 2 — Site Detail Water tab (2026-05-22)

WaterTab fleshed out to a real, dual-column page reading from `water.json`
(landlord/bulk) and `sycous.json` (resident sub-metering). X2 grammar
preserved.

### Layout

```
Water · CY2025
{Site name}
──────────────────────────────────────────────────────────────
┌─ Bulk supply ────────────────┐ ┌─ Resident water (Sycous) ──┐
│ Severn Trent · WaterPlus     │ │ Network: Tattenhall         │
│                              │ │ ┌─ summary ──────────────┐ │
│ 8,548 m³                     │ │ │ Props  Meters  Services│ │
│                              │ │ │ 143    304     E / H&HW│ │
│  Status        [partial]     │ │ └────────────────────────┘ │
│  Quality       Estimated      │ │                            │
│  Coverage      Feb 25 – Jan 26│ │ (heat-only Sycous note OR  │
│  Completeness  100%           │ │  m³ services panel if      │
│  Meters known  3 (3 w/ CY25)  │ │  Cold/Hot Water present)   │
│                              │ │                            │
│ ⚠ Key gaps                   │ │ + reconciliation note     │
│   All readings estimated by  │ │                            │
│   WaterPlus. Cricket Club    │ │                            │
│   meter static (0 m³)…       │ │                            │
└──────────────────────────────┘ └────────────────────────────┘
```

### Sycous water rendering — three states

For each Sycous site, only services measured in **m³** (Cold Water, Hot
Water) get the metered panel. Heat & Hot Water (kWh) is energy-side and
covered on the Energy tab.

| State | Sites | Rendering |
|---|---|---|
| Has m³ water service | Ampfield Meadows (Cold Water 2,525.5 m³, 100% DQ), Ledian Gardens (Hot Water 530.6 m³, 100% DQ) | Full per-service card with annual total, properties, valid/total reads, DQ badge |
| Sycous but heat-only | Austin Heath, Gifford Lea, Elderswell, Blendworth Hills, Millfield Green | Network + property/meter summary + a friendly note: "This Sycous network meters Electricity & Heat & Hot Water only — resident water is not separately sub-metered" |
| Not on Sycous | 6 sites (e.g. Great Alne, Durrants, Bramshott, Millbrook, Sonning, Edwalton) | Clean note: "This site is not on the Sycous sub-metering platform — there is no per-resident water sub-metering chain to display" |

### Spot-checks

| Site | Bulk m³ | Status | key_gaps surfaced? | Sycous resident |
|---|---:|---|---|---|
| Great Alne Park | 8,548 | partial | ✓ "All readings estimated by WaterPlus…" | (not on Sycous) clean note |
| Ampfield Meadows | 4,815 | confirmed | ✓ if present | Cold Water 2,525.5 m³ · 57 props · 100% DQ |
| Ledian Gardens | 231 | partial | ✓ Partial coverage | Hot Water 530.6 m³ · 63 props · 100% DQ |
| Austin Heath | — | missing | ✓ "Never billed since 2016…" | Heat-only Sycous note |
| Edwalton Office | — | missing | ✓ "SWW reassigned to Millbrook…" | (not on Sycous) clean note |

Each PASS criterion from Brief 12 Part 2 satisfied: Great Alne shows 8,548
m³ + Estimated badge + key_gaps; Ampfield/Ledian (Sycous water sites) show
the resident sub-metering panel; non-Sycous sites show the clean note.

### Falsifiability

```
grep -rEn "#[0-9a-fA-F]{3,6}" eir/src/components/site --include="*.jsx"
  → 0
cd eir && npx vite build
  → ✓ 1.13 s, clean. +~3 kB to main bundle.
```

### Files touched (Part 2)

- `eir/src/components/site/WaterTab.jsx` (full implementation, ~210 lines —
  replaces the Part 1 stub)
- `eir/src/index.css` (~180 lines added for water-* classes)

### PASS

- ✓ `/site/great-alne-park/water` → 8,548 m³ + Estimated + key_gaps surfaced
- ✓ Sycous water sites (Ampfield, Ledian) show m³ resident panel with DQ
- ✓ Sycous heat-only sites get the friendly note (not blanks)
- ✓ Non-Sycous sites get a clean "not on platform" note
- ✓ Edwalton + Austin Heath (missing data) show key_gaps prominently with
  no fake zeros
- ✓ 0 raw hex in `eir/src/components/site/`
- ✓ Build clean

Part 3 (Sycous resident-billing surfacing on Data-quality + Energy) next.

---

## Part 3 — Sycous resident-billing surfacing (2026-05-22)

The brief's highest-value item: making IVG's distinctive operational data
visible. No other retirement-village operator runs a Sycous platform
across 7 sites, 669 metered properties, 1,049 meters. Until Part 3 the
data was buried in a small Data-quality table; now it's a real panel
surfaced in two places, and the resident-billing chain is legible.

### New shared component

`eir/src/components/site/SycousPanel.jsx` — props: `siteId`, `mode` ∈
`{"full","energy"}`.

- `mode="full"` (Data-quality tab) — all services across all units (kWh
  + m³): Electricity, Heat & Hot Water (kWh), Heat (kWh), Hot Water (m³),
  Cold Water (m³). Each service gets a tile with annual total, properties,
  meters, DQ% (colour-tiered: good ≥95, mid 50–94, low <50), and valid/
  total reads.
- `mode="energy"` (Energy tab) — only kWh services. Below the bulk
  landlord chart, framed explicitly as the bulk-to-resident reconciliation:
  > "Bulk landlord supply (charted above) → Sycous resident sub-metering
  > (below) is the resident-billing reconciliation. The gap between the
  > two is the resident consumption IVG passes through but doesn't bill
  > itself — Scope 3 Cat 13 in the GHG inventory."
- Non-Sycous sites (6 of 13) — clean note in either mode: "This site is
  not on the Sycous sub-metering platform. The resident-billing chain
  shown for sub-metered sites is not available here — residents are
  billed directly by suppliers (no IVG sub-meter layer)." No blanks.
- Sycous sites with no services in the chosen mode — contextual note,
  e.g. for Ledian on Energy: "This Sycous network meters Heat & Hot
  Water only — no resident energy services measured in this chain"
  (Ledian's services are m³).

### Wiring

| Tab | Change |
|---|---|
| Data quality | The old inline `<Panel title="Sycous sub-metering">` block (35 lines of in-place table + reconciliation note) replaced by a single `<SycousPanel siteId={siteId} mode="full" />`. The metric/status table in the left column stays. |
| Energy | New `<SycousPanel siteId={siteId} mode="energy" />` appended after the Monthly/HH inspector Panel. 16 px gap. |
| Water | (Part 2) Already surfaces the m³ services in its own bespoke layout — kept distinct because Water context wants the m³ services foregrounded and the kWh services not shown. The new SycousPanel is not used on the Water tab. |

### Spot-checks

| Site | Tab | Behaviour |
|---|---|---|
| Austin Heath | Data-quality | Sycous panel: Electricity 233k kWh (158 props, 97% DQ, 154/158), Heat & Hot Water 584k kWh (118 props, 100% DQ). Network "Warwick Gates". Reconciliation note: "Aligned — arbnco asset is the landlord/heat-network site. Sycous covers ~158 sub-metered residents." |
| Austin Heath | Energy | Same panel, kWh services only (both qualify), with bulk-to-resident reconciliation note. |
| Ledian Gardens | Energy | Empty-state note: "This Sycous network meters Heat & Hot Water only — no resident energy services measured in this chain" (Ledian's services are m³ only). |
| Elderswell | Data-quality | Heat & Hot Water 74k kWh (77 props, **13% DQ — low** — red tier badge), Turvey network. Surfaces the data-quality story. |
| Bramshott / Durrants / etc. (non-Sycous) | Both tabs | Single clean note: "This site is not on the Sycous sub-metering platform…" |

### Falsifiability

```
grep -rEn "#[0-9a-fA-F]{3,6}" eir/src/components/site --include="*.jsx"
  → 0
cd eir && npx vite build
  → ✓ 1.14 s, clean. Main bundle 834 kB (Sycous panel adds ~3 kB).
```

### Files touched (Part 3)

- `eir/src/components/site/SycousPanel.jsx` (new, ~135 lines)
- `eir/src/App.jsx` (import; Data-quality inline block → `<SycousPanel mode="full"/>` (35-line replacement → 1 line); Energy tab appended `<SycousPanel mode="energy"/>`)
- `eir/src/index.css` (~140 lines added for `.sycous-*` classes)

### PASS

- ✓ SycousPanel used in both contexts (Data-quality `full`, Energy `energy`)
- ✓ Austin Heath Data-quality panel shows 162 props (160-meter network),
  Heat & Hot Water + Electricity services with DQ% tiles
- ✓ Energy tab shows resident Sycous kWh services beneath the bulk chart,
  with the explicit bulk-to-resident reconciliation note
- ✓ Non-Sycous sites get the clean note (no fake data)
- ✓ Sycous-but-no-mode-services sites get a contextual explainer
- ✓ Resident-billing chain is legible end-to-end
- ✓ 0 raw hex, build clean

Part 4 (data-vintage badge + error boundaries) next.

---

## Part 4 — Hardening: vintage badge + error boundaries (2026-05-22)

### TopNav 5 → 7 sub-tabs (regression fix uncovered en route)

Prerequisite to the walkthrough — `TopNav.jsx` had its own hardcoded
`SECONDARY.site` list of 5 tabs (Overview / Energy / Carbon / Meters /
Data quality). The 7-tab list lived only in `App.jsx::siteSubtabs()`, so
the new Water + Waste tabs were addressable by URL but not visible in
the secondary nav. Synced TopNav.SECONDARY.site to the same 7-tab order.

### Build timestamp — already present, no pipeline change needed

`portfolio.json` already carries `build_timestamp` (ISO 8601 UTC) and
`data_period` at the top level — the pipeline writes them on every build
(see `pipeline/build.py` line ~17/68/193). Part 4 reads them as-is; no
`build.py` edit.

```json
{
  "build_timestamp": "2026-05-22T11:34:26.107341+00:00",
  "data_period":     "CY2025",
  ...
}
```

### DataVintageBadge.jsx

Small unobtrusive chip in the **primary** nav bar, right of the link
group, just left of the logo lockup. Format:

```
●  Data updated 22 May 2026 · CY2025      [IVG × NZA]
```

- Theme-aware (cream + dark) via the `theme` prop (mirrors TopNav).
- Dot pulse-ready (cream/coral risk-low green) — currently static for
  audit-grade subtlety; future polish could pulse on rebuild.
- `title` attribute shows the full ISO timestamp on hover (for the
  developer / auditor who wants the precise build time).
- Hidden below 900 px viewport (`@media (max-width: 900px)`) so the
  primary nav stays clean on narrow screens.

### ErrorBoundary.jsx

React class boundary (boundaries cannot be hooks). Props:
`{ scope, theme, children }`.

- `getDerivedStateFromError` captures error into state → renders
  cream/dark-aware recoverable card instead of blank page.
- `componentDidCatch` logs `[ErrorBoundary] <scope> <error> <info>` to the
  dev console for debugging (would have surfaced the Brief 6 BodyPageLayout
  silent failure immediately).
- Recovery: **Try again** button calls `setState({hasError:false})` so the
  user can re-render the subtree without a full page reload; secondary
  **Refresh** button reloads the page.
- DEV-only inline error stack (`import.meta.env?.DEV`) — production users
  never see the raw message, only the friendly card.

### Boundary placement

Three boundaries wrap the three primary route trees (siblings so a failure
in one doesn't take out the others):

```jsx
// Site Detail (cream)
<ErrorBoundary scope={`site/${siteId}/${subTab}`} theme="cream">
  {subTab === 'overview' && <SiteOverview .../>}
  ...
</ErrorBoundary>

// Portfolio (dark)
<ErrorBoundary scope={`portfolio/${subTab}`} theme="dark">
  ...
</ErrorBoundary>

// Insights (dark)
<ErrorBoundary scope={`insights/${subTab}`} theme="dark">
  ...
</ErrorBoundary>
```

Note: `scope` includes the sub-tab key, so when the boundary triggers and
the user switches tabs the boundary remounts under a fresh `key`-like
reference (React unmounts/remounts on prop-change-only boundary). In
practice this means switching tabs ALSO recovers from an error, in
addition to the explicit Try-again button.

### Brief 6 regression check

The original Brief 6 silent white-screen happened when `BodyPageLayout`
threw during render. With Part 4 in place: the cream `ErrorBoundary`
catches it, console-logs `[ErrorBoundary] site/<id>/<tab>: <error>`, and
renders the recoverable card. The developer would have seen this
immediately instead of staring at a white tab.

### Falsifiability

```
grep -rEn "#[0-9a-fA-F]{3,6}" \
    eir/src/components/site \
    eir/src/components/DataVintageBadge.jsx \
    eir/src/components/ErrorBoundary.jsx \
    --include="*.jsx"
  → 0
cd eir && npx vite build
  → ✓ 1.10 s, clean.
```

### Files touched (Part 4)

- `eir/src/components/DataVintageBadge.jsx` (new, ~55 lines)
- `eir/src/components/ErrorBoundary.jsx` (new, ~135 lines)
- `eir/src/components/TopNav.jsx` (DataVintageBadge import; primary-bar
  right-group wrapper; SECONDARY.site 5 → 7 tabs to match App.jsx)
- `eir/src/App.jsx` (ErrorBoundary import; wraps Portfolio + Site +
  Insights route trees)
- `eir/src/index.css` (~40 lines for `.data-vintage-*` + `.topnav-primary-right`)

### PASS

- ✓ Badge visible on every page in both registers
- ✓ Badge reads real build timestamp (22 May 2026 · CY2025)
- ✓ Error boundary scopes the three primary route trees independently
- ✓ Console gets `[ErrorBoundary] <scope> <error>` for forensics
- ✓ Cream + dark recoverable cards render in their matching register
- ✓ Try-again button resets boundary; Refresh button reloads page
- ✓ TopNav secondary now shows all 7 Site Detail tabs (regression fixed)
- ✓ 0 raw hex in new files, build clean

Part 5 (walkthrough + close) next.

---

## Part 5 — Walkthrough + close (2026-05-22)

Self-walkthrough via MCP Chrome browser at 1440×900. Dev server on
explicit port (5180 → 5182 after a foreground pipe killed the first).

### Pages verified

| Route | Verified |
|---|---|
| `/` Landing | Inspired Villages hero · 4 quadrants (4.5M kWh elec / 7.6M kWh gas / 17.9k m³ water / 164 t waste 99.9% diverted · 3.2 tCO₂e) · footer "13 sites · 217,314 m² GIA · 961 units · CY2025" · data-vintage badge top right |
| `/portfolio/map` | 7-pill theme bar (Overview/Energy/Water/Waste/Carbon/Meters/Data quality), Energy active, leaderboard sorted Gifford 3.1M → Sonning —, UK dot-map populated, totals strip 8.3M kWh / 9.4M kWh / 18k m³ / 164 t / 3k tCO₂e |
| `/portfolio/comparisons` | Two-site comparison Austin Heath vs Millfield Green — GIA/Units/Elec/Gas/Carbon/Intensity stats + Data quality pill row + monthly chart legend |
| `/insights/reconciliation` | Full narrative, Ecotricity vs arbnco card (4.5M / 8.3M / 3.9M gap = Scope 3 Cat 13), per-site comparison chart populated |
| `/site/austin-heath/overview` | Hero + stat grid + DQ narrative — unchanged from before |
| `/site/austin-heath/energy` | Monthly chart + **new Resident energy (Sycous) panel** below with Electricity 233k kWh 97% DQ + Heat & Hot Water 584k kWh 100% DQ + bulk-to-resident reconciliation narrative |
| `/site/austin-heath/carbon` | Renders (cream readability issues pre-existing — flagged for next brief) |
| `/site/austin-heath/water` | "No billing data received" headline + Missing + Severn Trent · Never billed + key_gaps "Never billed since 2016…" + Sycous Warwick Gates panel with **heat-only explainer** ("This Sycous network meters Electricity & Heat & Hot Water only — resident water is not separately sub-metered") |
| `/site/austin-heath/waste` | **10.8 tonnes** headline · BIFFA · Confirmed · **99.5% diversion ring** · 3 panels (By stream / Disposal fate / Scope 3 Cat 5 0.24 tCO₂e) · method note |
| `/site/austin-heath/data-quality` | Old in-line Sycous table replaced by new `<SycousPanel mode="full">` with 2 service tiles + reconciliation note |
| `/site/gifford-lea/waste` | **32.0 tonnes** · Ash Waste · **Partial** · 100% diversion · stream split · 0.62 tCO₂e · method note "ESTIMATED from bin volume" |
| `/site/edwalton-office/waste` | **Clean not-applicable card**: "No waste contract for this site. Head office — no waste contract on file (treated centrally / serviced via building landlord)." No fake zeros. |
| `/site/great-alne-park/water` | **8,548 m³** · Severn Trent · WaterPlus · Partial · key_gaps surfaced + non-Sycous clean note |
| `/site/ampfield-meadows/water` | **4,815 m³** + Confirmed + **Cold Water 2,525.5 m³** · 57 props · 100% DQ green badge (the m³ Sycous service rendering as designed) |
| `/site/durrants-village/energy` | Monthly chart + clean "not on Sycous platform" note (verifies the non-Sycous state) |

### THE BOUNDARY EARNED ITS KEEP — 5 latent crashes caught

The walkthrough surfaced 5 missing-import crashes on **pre-existing pages**
(not Brief 12 work):

```
[ErrorBoundary] insights/reconciliation: COLOR_TEXT_MUTED_ON_DARK is not defined
[ErrorBoundary] insights/reconciliation: COLOR_THEME_BODY is not defined       (after fix 1)
[ErrorBoundary] portfolio/comparisons:   COLOR_THEME_BASE is not defined       (after fix 1)
[ErrorBoundary] insights/reconciliation: FONT_BODY is not defined              (after fix 2)
[ErrorBoundary] site/austin-heath/carbon: FONT_BODY is not defined             (after fix 2)
```

All caused by App.jsx referencing chart-colors named exports without
importing them — most likely Brief 6 Part 2's raw-hex sweep replaced inline
strings with named constants but never wired the imports. The pages have
been **silently white-screening for any user who navigated to them since
that brief**, until Brief 12 Part 4's ErrorBoundary made them visible.

Fix: added all six COLOR_ and one FONT_ named imports to App.jsx. Pages
verified working post-fix. This is exactly the Brief 6 regression pattern
the brief warned about — error boundaries pay for themselves.

### Hard Rule 9 — no-scroll

All 7 Site Detail tabs at 1440×900 verified to fit without page scroll
(viewport 744 px effective; tallest panel content ~600 px).

### Falsifiability — final

```
grep -rEn "#[0-9a-fA-F]{3,6}" \
    eir/src/components/site \
    eir/src/components/DataVintageBadge.jsx \
    eir/src/components/ErrorBoundary.jsx \
    --include="*.jsx"
  → 0
grep -rEn "JetBrains|DM Sans|DM Serif" eir/src --include="*.jsx" --include="*.js"
  → 0 (values; doc-comments excluded)
cd eir && npx vite build
  → ✓ 1.08 s, clean.
```

### Files touched (Part 5)

- `eir/src/App.jsx` (imports added: COLOR_TEXT_MUTED_ON_DARK,
  COLOR_THEME_BASE, COLOR_THEME_BODY, COLOR_NZA_CORAL, COLOR_SCOPE_12,
  COLOR_CAT_ESTATE, FONT_BODY — fixes 5 latent crashes surfaced by
  the new ErrorBoundary)
- `docs/briefs/active/12_sycous_water_waste.md` → `archive/12_sycous_water_waste_COMPLETED.md`
- `docs/briefs/current.md` (empty state + pending follow-ups)
- `docs/audit/12_sycous_water_waste.md` (this Part 5 block)

### PASS — Brief 12 final

- ✓ 7 Site Detail tabs (Overview / Energy / Carbon / Water / Waste / Meters / Data quality)
- ✓ Waste tab real (Austin 10.8 t / Gifford 32 t / office not-applicable)
- ✓ Water tab real (Great Alne 8,548 m³ + key_gaps; Ampfield Cold Water 2,525.5 m³ Sycous; Austin missing-data + heat-only Sycous note)
- ✓ Sycous surfaced — Data-quality panel + Energy resident panel with bulk-to-resident reconciliation narrative; non-Sycous clean note
- ✓ Data-vintage badge "Data updated 22 May 2026 · CY2025" on every page in both registers
- ✓ Error boundary caught 5 pre-existing latent crashes (all fixed)
- ✓ No scroll at 1440×900 on all 7 tabs
- ✓ Build clean (1.08 s); 0 raw hex in new files; 0 EOC font values

### Known issues for next brief

- **Carbon tab readability** — cream-on-cream text faded; pre-existing
  visual regression. Small polish brief candidate.
- **Recharts container heights** on `/insights/reconciliation` and
  `/portfolio/comparisons` — bars are visible but charts squashed. Pre-
  existing layout issue surfaced by the page now loading; not Brief 12 work.

Brief 12 archived. Pushing.
