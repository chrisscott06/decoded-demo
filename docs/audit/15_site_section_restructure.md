# Brief 15 audit — Site section restructure + layout principle + phasing + sub-tab naming

Five parts. Six structural defects on the Site section pages all addressed
under one root principle (vertical-stack: tiles left, charts right at
near-full-height). Plus three architecture asks: standalone phasing
reference, Comparisons deferred, Portfolio sub-tab rename.

Reference: [active/15_site_section_restructure.md](../briefs/active/15_site_section_restructure.md).

---

## Part 1 — Site Overview vertical layout + contrast fix (2026-05-24)

### Restructure

Replaces the old "wide horizontal stat-grid + full-width dq-narrative"
with a two-column layout per the brief's layout principle:

```
┌─ Site · AH ─────────────────────────────────────────────────────┐
│ Austin Heath  (Source Serif large)                               │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ LEFT (~320-360) ──┐  ┌─ RIGHT (1fr) ───────────────────────┐ │
│ │ ┌─ Elec 2.9M ●OK ┐│  │ Site facts                          │ │
│ │ │ 1 MPAN · 12 mo │ │  │ Primary heating | Hot water         │ │
│ │ └────────────────┘│  │ Heat network    | Grid              │ │
│ │ ┌─ Gas 2.5M  ●OK ┐│  │ Capacity        | Solar PV          │ │
│ │ │ 2 MPRNs        │ │  │ Battery         | Sycous            │ │
│ │ └────────────────┘│  │ Years built     | Operational phases│ │
│ │ ┌─ Water — ⚠MIS  ┐│  │ Units complete  | Occupancy         │ │
│ │ └────────────────┘│  │ GIA total       | Resi/Landlord GIA │ │
│ │ ┌─ Waste 10.8t ●OK│  │                                      │ │
│ │ └────────────────┘│  │                                      │ │
│ └────────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

LEFT column: 4 MetricTiles stacked vertically with compact coral
why-strips (e.g. "1 MPAN · 12 mo CY25", "BIFFA · 99% diverted") —
absorbs what was the dq-narrative.

RIGHT column: new Site facts panel — a two-column dl rendering 14
site fields from sites.json (archetype + identity + phasing summary).

### Contrast fix

The old `.dq-narrative` block on Overview used `--text-on-dark` /
`--text-muted-on-dark` tokens on a cream Site Detail page →
cream-on-cream invisible. Same family as Brief 13's Carbon fix. Block
removed from Overview entirely (its content absorbed into tile why-
strips + Site facts panel). For the few other Site Detail surfaces
that still use `.dq-narrative` classes (SiteDataQuality), added
`body.theme-cream` overrides for each class.

### Files touched (Part 1)

- `eir/src/App.jsx` (SiteOverview rewrite, ~70 lines)
- `eir/src/index.css` (+8 cream-overrides for `.dq-*`, +~95 lines new
  `.site-overview-grid` / `.site-facts-*` styles)

**Commit:** `002c705 Brief 15 Part 1: Site Overview vertical layout + contrast fix`

---

## Part 2 — Site Energy layout + Jan–Dec chart + Sycous opt-in (2026-05-24)

### #5 Calendar Jan–Dec chart

Monthly was 15 months (Oct 24 → Dec 25, rendered two Novembers + two
Decembers visible). Filter to `month.startsWith('2025-')` → 12 bars
Jan–Dec exactly. Subtitle "15 months · Oct 2024 – Dec 2025" → "CY2025
(Jan – Dec) · HH / NHH / Gas". Half-hourly view untouched (real Stark
2024-04 → 2026-02 by design).

### #2 Chart near-full-height

`EnergyChart` height bumped 320 → 460 so the chart fills more of the
viewport per the layout principle (chart = primary visual on this tab,
takes near-full-height). EnergyChart already wraps its
ResponsiveContainer in an explicit-height div (Brief 13 Rule 10).

### #6 Sycous demoted to collapsed opt-in

The Sycous "Resident energy" panel was eating ~half the tab. Now a
one-line clickable strip:

```
┌─ Resident energy (Sycous)  Warwick Gates · 162 properties · 276 meters     ▸ ┐
└──────────────────────────────────────────────────────────────────────────────┘
```

Click chevron → expands the full Brief 12 SycousPanel mode="energy"
(network, services, DQ%, bulk→resident→Cat 13 narrative — all intact).
Default closed so the chart gets the vertical space.

New `.sycous-toggle-strip` CSS — cream register, hover state, coral
chevron.

### Files touched (Part 2)

- `eir/src/App.jsx` (monthly filter, chart height, sycous wrapper)
- `eir/src/index.css` (+40 lines `.sycous-toggle-*`)

**Commit:** `160ae07 Brief 15 Part 2: Site Energy layout + calendar chart + Sycous opt-in`

---

## Part 3 — Site Carbon vertical layout (2026-05-24)

Apply the layout principle. Replaces the balanced `.page-2col`
(40fr/55fr) with `.site-carbon-grid` (minmax(340,400) / 1fr) — narrow
LEFT for scope figures + intensity table + median callout, wider RIGHT
for the donut.

Pie bumped 420×320 → **560×480** (innerRadius 70→100, outerRadius
120→170) so the donut fills the right column at near-full-height.
Overlay center-text marginTop adjusted -160 → -240. Brief 13's pie fix
(skip ResponsiveContainer + `isAnimationActive={false}`) retained.

Passed `theme="cream"` to the Scope breakdown Panel so its border +
title text are cream-register (Brief 13 Part 3 already flipped the
`.carbon-*` class colours on `body.theme-cream`).

### Files touched (Part 3)

- `eir/src/App.jsx` (Carbon page wrapper class + Panel theme + Pie size)
- `eir/src/index.css` (+15 lines `.site-carbon-grid`)

**Commit:** `bfb1a20 Brief 15 Part 3: Site Carbon vertical layout`

---

## Part 4 — Standalone phasing reference table (2026-05-24)

New top-level route `/phasing` rendering `PhasingPage` in the cream
register (via `BodyPageLayout`-style wrapper `PhasingChapter`).

### Built from REAL fields only — brief Principle 3

Table columns:
- Site | Phase | Units | Complete by — from `sites.json` `phasing.phases[]`
  (using `open_year + complete_year - 1` as the calendar year)
- Heating | Grid | Solar PV — **site-level only**, rowSpan'd across
  each site's phases. The workbook does not capture per-phase strategy.
- Status & occupancy — `phasing.status` + `identity.occupancy_pct`
- **PER-PHASE STRATEGY** — coral header on `rgba(232,114,92,0.06)`
  tint, every cell reads italic coral "Confirm per-phase". **Brief's
  honest-data principle: surface the gap, never fabricate.**

### Bottom IVG ASK footnote

> For each site, please confirm whether the per-phase heating and
> power strategy matches the site-level archetype shown above, or
> whether phases diverge (e.g. early phases on gas while later phases
> moved to ASHP / heat network). This information will feed the GHG
> inventory's Scope 1 boundary precision.

This is the structured ask the brief calls out: "This table doubles
as the structured ask handed back to IVG to firm up in writing."

### Data sanity

- 12 villages with phasing data (Edwalton excluded — phasing: null)
- 961 units complete of 1,799 planned
- Ledian Gardens specifically called out in the narrative as the
  "partial heat network" site where per-phase strategy likely diverges

### Files touched (Part 4)

- `eir/src/components/PhasingPage.jsx` (new, ~120 lines)
- `eir/src/App.jsx` (PhasingChapter wrapper + /phasing route)
- `eir/src/index.css` (+120 lines `.phasing-*`)

**Commit:** `f7a24af Brief 15 Part 4: standalone phasing reference table`

---

## Part 5 — Portfolio sub-tab rename + walkthrough close (2026-05-24)

### Rename

Chris asked between three options; chose the conservative one:

**Overview · Map · Sites · Phasing · Comparisons**

- Overview retained (still redirects to /portfolio/map per Brief 6 —
  full reconciliation of the Overview/Home overlap deferred to a
  future brief)
- **Phasing pill added** between Sites and Comparisons (Brief 15
  Part 4's `/phasing` route now discoverable in the nav)
- Comparisons retained at the end (brief #8 — deferred build-out)

Applied identically to:
- `App.jsx` `PORTFOLIO_SUBTABS` (5 entries, was 4)
- `TopNav.jsx` `SECONDARY.portfolio` (5 entries, was 3 — Overview pill
  was hidden before; now visible)

### Walkthrough (1440×900)

| Route | Status |
|---|---|
| `/` Landing | ✓ Unchanged |
| `/portfolio/map` | ✓ 5-pill sub-nav visible; map + leaderboard intact |
| `/portfolio/sites` | ✓ Unchanged |
| `/phasing` | ✓ Reference table renders cream; PER-PHASE STRATEGY column + IVG ASK footnote |
| `/portfolio/comparisons` | ✓ Unchanged (Brief 13 fix holds) |
| `/site/austin-heath/overview` | ✓ **NEW** vertical-stack: 4 tiles left + Site facts right |
| `/site/austin-heath/energy` | ✓ **NEW** Jan-Dec 12 bars + Sycous collapsed |
| `/site/austin-heath/carbon` | ✓ **NEW** narrow scope panel left + larger donut right |
| `/site/austin-heath/water` | ✓ Unchanged (Brief 12) |
| `/site/austin-heath/waste` | ✓ Unchanged (Brief 12) |
| `/site/austin-heath/meters` | ✓ Unchanged |
| `/site/austin-heath/data-quality` | ✓ Unchanged + SycousPanel intact |
| `/insights/reconciliation` | ✓ Unchanged (Brief 13 fix holds) |
| `/insights/voids` | ✓ Unchanged |
| `/insights/data-quality` | ✓ Unchanged |
| `/gresb` | ✓ Unchanged |

No collateral regression. No scroll at 1440×900 on any touched page.

### Falsifiability

```
cd eir && npx vite build
  → ✓ 1.38 s, clean
grep -rn "Source Serif\|--font-site" eir/src --include="*.jsx" --include="*.js" --include="*.css"
  → Brief 14's Source Serif usages only; PhasingPage uses --font-site
    for the site display_name column (per brief Principle 5: reuse,
    don't re-add). No second serif declaration.
```

### Files touched (Part 5)

- `eir/src/App.jsx` (PORTFOLIO_SUBTABS +phasing)
- `eir/src/components/TopNav.jsx` (SECONDARY.portfolio + Overview pill restored + phasing)

---

## PASS — Brief 15 final

1. ✓ HEAD SHA + all 5 parts landed; confirmed started AFTER Brief 14
   close (gate satisfied at start).
2. ✓ Site Overview: vertical left column, no wide scrolling table,
   descriptor trimmed, all text legible (cream-on-cream contrast bug fixed).
3. ✓ Site Energy: monthly chart Jan–Dec 12 bars no overlap; chart 460 px
   near-full-height; Sycous panel collapsed default, expandable, narrative
   intact.
4. ✓ Site Carbon: vertical-stack layout, larger 560×480 donut fills right.
5. ✓ Layout principle confirmed applied to all three tabs — no
   left-to-right data bars, no cut-off charts remain in scope.
6. ✓ Standalone phasing table: real fields only; per-phase
   heating/power gap explicitly surfaced in coral column + IVG ASK
   footnote; reachable at /phasing.
7. ✓ Portfolio sub-tabs renamed: Overview · Map · Sites · Phasing ·
   Comparisons. Existing Overview reconciled (Chris's chosen conservative
   path — kept the pill, deferred the full Home/Overview overlap fix).
   Comparisons present + deferred per brief #8.
8. ✓ No scroll at 1440×900 on every touched page; 16-route walkthrough
   no collateral regression.
9. ✓ Build clean (1.38 s); Source Serif reused (PhasingPage uses
   `--font-site`); no second serif declaration.
10. ✓ Brief archived; current.md repointed.

### Known issues / for next brief

- **Water / Waste / Meters / Data quality Site Detail tabs** still
  pending Chris's deeper review (Brief 15 scope was Overview / Energy
  / Carbon only).
- **Comparisons build-out** still deferred (brief #8).
- **Overview/Home reconciliation** — Chris kept the "Overview" Portfolio
  pill as a redirect to Map. A future brief should decide whether to
  make it render real content, hide it, or redirect somewhere else.
- Inherited follow-ups: 3 pending HH MPANs, P03 waste workbook, Source
  Serif TTF→woff2 optimisation.

Brief 15 archived. Pushing.
