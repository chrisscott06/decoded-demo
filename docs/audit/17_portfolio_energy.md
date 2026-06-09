# Audit — Brief 17 (Portfolio › Energy) close

**Closed:** 2026-06-03
**Brief:** `docs/briefs/active/17_portfolio_energy.md` (Parts 1–2 landed) + `docs/briefs/active/17_amendment_2.md` (Parts 2.5, 3, 4, 5, 6)
**Status:** All six parts PASS. Brief 17 archived alongside Amendment 2. `current.md` re-pointed to the next active brief (empty state).

---

## Scope as built

Brief 17 set out a four-sub-tab Portfolio › Energy thematic page: **Consumption · Heating strategy · Power strategy · Metering & data quality**. Parts 1 (route + shell) and 2 (Consumption) landed earlier. Then Briefs 17.5 / 17.5.2 / 17.5.3 paused Brief 17 to lock the thematic-page grammar (Rule 11) — design system, page layout, type scale, nav alignment. Amendment 2 resumed Brief 17 against the locked grammar:

- **Part 2.5** — drop italic `Scope: …` captions on Consumption (clutter; chart + tooltips carry scope).
- **Part 3** — `<HeatingPanes />` (building-archetype × phasing matrix, 2/4/5 split with explicit Millfield Green correction).
- **Part 4** — `<PowerPanes />` (13-row sortable table with arrangement / solar / ASC / peak / spare / status).
- **Part 5** — `<MeteringPanes />` (stacked horizontal bar per site, Landlord HH / Landlord NHH / Void).
- **Part 6** — walkthrough at 1920×1080 + 1440×900, audit doc (this file), brief archival.

---

## Rule 11 inheritance — falsifiability

The premise of Amendment 2 is that new thematic content **inherits** the locked grammar without per-pane redesign. Every measurement below was captured live from the running dev server at 1920×1080 via `getComputedStyle` / `getBoundingClientRect` — no eyeballing.

### 1920×1080 viewport — all four sub-tabs identical

| Metric | Consumption | Heating | Power | Metering | Rule 11 spec |
|---|---|---|---|---|---|
| `.thematic-page-container` width | 1280.00 px | 1280.00 px | 1280.00 px | 1280.00 px | **1280 px** ✓ |
| Container x (left edge) | 320.00 | 320.00 | 320.00 | 320.00 | **320 ±2** at 1920 vw ✓ |
| Narrative pane width | 500.00 | 500.00 | 500.00 | 500.00 | 400–520 band ✓ |
| Narrative pane x | 320.00 | 320.00 | 320.00 | 320.00 | shares container x ✓ |
| Gutter (narrative → graphic) | 48.00 | 48.00 | 48.00 | 48.00 | **48 px** ✓ |
| Graphic pane width | 732.00 | 732.00 | 732.00 | 732.00 | 1280 − 500 − 48 = 732 ✓ |
| Graphic pane x | 868.00 | 868.00 | 868.00 | 868.00 | 320 + 500 + 48 = 868 ✓ |
| Body `<p>` font-size | 13.29 px | 13.29 px | 13.29 px | 13.29 px | `var(--text-body-small)` at 1920 = 13.29 ✓ |
| Subsection title font-size | 17.71 px | 17.71 px | 17.71 px | 17.71 px | `var(--text-subsection-title)` at 1920 = 17.71 ✓ |
| Subsection title font-family | DM Serif Display | DM Serif Display | DM Serif Display | DM Serif Display | `--font-display` ✓ |
| Subsection title colour | rgb(232,114,92) | rgb(232,114,92) | rgb(232,114,92) | rgb(232,114,92) | coral `#E8725C` ✓ |
| h3 count | 3 | 3 | 3 | 4 | per-pane content |
| Tertiary tab indicator | active | active | active | active | white text vs 60% opacity ✓ |

All four sub-tabs share one rendering shell (`<NarrativePane>` + `<GraphicPane>` from PortfolioEnergy.jsx). Per-pane code defines *what goes inside* the shell, not the shell itself. The numbers above are the falsification: any future pane that deviates from the 1280/500/48/732/x=320 grid is a Rule 11 violation.

### 1440×900 viewport — graceful scale-down

Container collapses but stays anchored to the breathing rule. Sampled at Metering:

| Metric | Value | Rule 11 spec |
|---|---|---|
| Container width | 1280.00 px | unchanged ✓ |
| Container x | 80.00 | breathing rule: `max(32, (vw − 1280) / 2)` = 80 at 1440 ✓ |
| Narrative width | 500.00 | unchanged ✓ |
| Gutter | 48.00 | unchanged ✓ |
| Graphic width | 732.00 | unchanged ✓ |
| Body font-size | 12.00 px | `clamp(12px, …)` min ✓ |
| Subsection title | 16.00 px | `clamp(16px, …)` min ✓ |

All four sub-tabs render under this same envelope at 1440×900 — verified by route-switching + DOM eval per pane.

---

## Per-pane content verification

### Part 2.5 — Consumption italic-scope cleanup
Three `Scope: …` italic lines removed. Chart segments + colours + tooltips already carry the scope distinction (Gas / Electricity × Landlord / Resident × GRESB-26-in-scope vs out-of-scope dark shade). The lines read as duplicative noise against the tightened type scale.
- Committed at `3f7a900`.

### Part 3 — Heating strategy (`<HeatingPanes />`)
- 3-column category grid keyed by explicit `HEATING_CATEGORY` map (`chp` / `hybrid` / `electric`).
- **Millfield Green correction** applied as inline override — `electric`, not heat network. Recorded in the map declaration as the canonical source.
- Per-site cards inside each column: 3-row × 4-phase mini-matrix + "confirm per-phase" status badge.
- Narrative: 3 subsections — "The spread.", "Why it matters.", "The detail that matters at site level."
- DOM verification at 1920: `h3Count = 3`, all under 500 px narrative pane at x=320.

### Part 4 — Power strategy (`<PowerPanes />`)
- 13-row sortable table — columns: arrangement / solar PV / ASC kVA / peak kW / spare kW / traffic-light status.
- `POWER_ARRANGEMENT` map declares `bulk` / `dno` / `ivg_cable` / `office` per site.
- Filter pill row above table: All / Bulk / DNO / Pending review.
- Narrative: 3 subsections — "Supplier.", "Three electricity arrangements.", "Capacity and procurement."
- DOM verification at 1920: `h3Count = 3`, `tableRows = 13`, filter buttons render.
- *Note:* a 1440 screenshot caught the tab indicator mid framer-motion swap — the DOM eval (3 h3s + 13 rows + Power tab in white) confirms the route is correct; the visual stale-frame is a preview MCP timing artifact, not a real rendering bug.

### Part 5 — Metering & data quality (`<MeteringPanes />`)
- Stacked horizontal bar per site (Landlord HH / Landlord NHH / Void) sourced from `mpan_register.json`.
- Narrative: 4 subsections — "The meter estate.", "Three platforms.", "The high-consumption voids.", "What this means for the rest of the page."
- DOM verification at 1920: `h3Count = 4`, all under 500 px narrative pane at x=320.

---

## Build state

- **Build:** Vite production build clean (1.66 s, 0 errors, 0 warnings).
- **Live route check:** all four `/portfolio/energy/{consumption|heating|power|metering}` routes resolve, content renders, tertiary nav indicator follows the route.
- **One JSX fix during implementation:** `>5000` interpreted as JSX token → escaped as `{'>'}5000`.

---

## Commits — Brief 17 close

| SHA | Title |
|---|---|
| (Brief 17 Parts 0.5–2 land earlier) | landed pre-pause |
| (Briefs 17.5 / 17.5.2 / 17.5.3 close earlier) | grammar locks |
| `6612ed4` | Brief 17 Amendment 2 land: resume Parts 3-5 + italic cleanup |
| `3f7a900` | Brief 17 Part 2.5: drop italic scope captions on Consumption |
| `c85fbbe` | Brief 17 Amendment 2 Parts 3+4+5: heating, power, metering sub-tabs |
| _(this commit)_ | Brief 17 close: archive briefs + audit doc + repoint current.md |

---

## Follow-ups carried forward

Brief 17 closes the **Energy** thematic page. The pending-follow-ups list in `current.md` already includes:

- Other thematic pages (Water / Waste / Carbon / Overview) inherit Brief 17.5.2 layout + 17.5.3 type scale verbatim — copy PortfolioEnergy.jsx shell structure, change content.
- Type-scale sweep beyond PortfolioEnergy + TopNav (Home / Map / Site Detail / Insights / GRESB still on legacy fixed-px aliases).
- Portfolio_GIA.xlsx ingestion (deferred Brief 17 Part 1 flag) — needed for Carbon thematic page intensity figures.
- Brief 11 — 3 pending MPANs.
- P03 waste workbook swap.
- arbnco-suspect indicator now structural via Brief 17.5 Part 2 strip-rule (resolved).

No new follow-ups generated by Amendment 2.

---

## Verdict

PASS on all six parts. Rule 11 inheritance is exact across all four sub-tabs at 1920×1080 and graceful at 1440×900. The thematic page now functions as the canonical template for the next three thematic pages (Water / Waste / Carbon / Overview).
