# Brief 21 — Metering & data quality Sankey + iconography

> **Filed locally as Brief 21.** Authored as "Brief 20" by NZA, but the local Brief 20 (`20_BR13_gresb_phase1.md`) is already mid-flight (GRESB Phase 1, Tasks 1-3 landed, Tasks 4-7 outstanding). Renumbered locally per Process Rule 7 to avoid collision — same pattern as BR-13 being filed as Brief 20. All filenames + commits + close-report references use **21** locally; references to "Brief 20" inside the brief body below mean *this* brief in author-numbering.
>
> Audit folder: `docs/audit/21_metering_sankey/` (prototype HTML copied 2026-06-04). Audit doc: `docs/audit/21_metering_sankey.md` (pending).

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after Sankey prototype review)
**Status:** Active. Replaces the placeholder stacked-bar chart currently rendered in the Metering & data quality sub-tab of the Energy page.
**Date opened:** 2026-06-04
**Mode:** Plough-through with **ONE Chris checkpoint** (after Part 2 = Sankey rendering with real numbers, before iconography pass in Part 3). Push at close. Walkthrough at **1920×1080 + 1440×900**.

---

## Why this brief

Brief 17 Amendment 2 shipped a stacked-bar chart for Metering & data quality that, after review, doesn't carry the richness of the underlying data. The page has five distinct meter populations across four data platforms across 11 sites — a relationship structure that a bar chart can't communicate.

Chris reviewed a Sankey prototype on 4 Jun and locked the structure: three-column flow (commodity → platform → sites), real pipeline numbers, click-to-highlight interaction, click-isolate-flows interactivity. The prototype proved the structure works; this brief productionises it inside the IVG ESG tool with proper iconography.

**Prototype location** (read-only reference): the audit doc `docs/audit/20_metering_sankey/` will hold a copy.

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 is the grammar contract** for layout, type scale, nav alignment, palette, motion. This brief does NOT modify Rule 11; it adds a chart that lives within it.
2. **STATUS.md** — full read at session start.
3. **Brief 17 Amendment 2** (archived) — established the Metering & data quality narrative content. This brief replaces only the *graphic*, not the prose (except for the small "16 → 12 gas MPRNs" correction in Part 1).
4. **Brief 14** (archived) — established site icons (`eir/public/sites/<site>/icon.svg`) and the `--font-site` Source Serif treatment. Reuse for the Sankey's right column.
5. **Brief 18** (archived) — established the lucide-composite icon pattern (Flame + Zap for Hybrid heating). This brief extends that approach for commodity icons.
6. **Sankey prototype** at `docs/audit/20_metering_sankey/sankey_prototype.html` (Chris provides) — the visual reference for structure, flow widths, and interaction behaviour.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (esp. Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/20_metering_sankey.md` → open the Sankey prototype HTML in browser to feel the interaction.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.5 **Land brief.** Place at `docs/briefs/active/20_metering_sankey.md`. Create `docs/audit/20_metering_sankey/` and copy the prototype HTML into it. Create `docs/audit/20_metering_sankey.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 20 land: Metering Sankey`.

1. **Confirm inputs.**
   - `pipeline/dist/eir/mpan_register.json` — per-site MPAN counts.
   - `pipeline/dist/eir/sycous.json` — per-site Sycous sub-meter counts per service.
   - `pipeline/dist/eir/sites.json` — `phasing.total_units_planned` per site for DNO-resident estimate.
   - `pipeline/dist/eir/portfolio.json` — `portfolio_inscope.site_ids` for filtering.
   - `eir/public/logos/` — platform logos. **Verify presence of: `stark.svg`, `ecotricity.svg`, `sycous.svg`, `arbnco.svg` (or wordmark equivalent). If any are missing, list in close report and fall back to text label rendered in `--text` color at `--text-body-small` weight 600.**
   - `eir/public/sites/<site>/icon.svg` — site icons, reused per Brief 14.

---

## The data — every number ground-truthed from the pipeline

These are the numbers as of the latest pipeline run (3 Jun); the brief expects Claude Code to verify them at Part 1 and surface any drift.

### Left column — commodity nodes (11 total)

| Node ID | Label | Count | Source |
|---|---|---|---|
| `gas` | Gas | **12** | Sum `category == 'Landlord (Gas)'` in `mpan_register.json` across in-scope sites |
| `elec-hh` | Elec — Landlord HH | **16** | Sum `category == 'Landlord (HH)'` |
| `elec-nhh` | Elec — Landlord NHH | **44** | Sum `category == 'Landlord (NHH)'` + `'Landlord (NHH) - heuristic'` |
| `elec-void` | Elec — Void / between residents | **128** | Sum `category` starts-with `'Void'` |
| `elec-other` | Elec — Other (Inactive / unclear) | **19** | Sum `category == 'Inactive (no consumption)'` + `'Resident or Void'` |
| `sycous-elec` | Sub-metered electricity | **496** | Sycous total for `service == 'Electricity'` |
| `sycous-heat` | Sub-metered heat | **95** | Sycous total for `service == 'Heat'` |
| `sycous-hhw` | Sub-metered heat & hot water | **338** | Sycous total for `service == 'Heat & Hot Water'` |
| `sycous-hw` | Sub-metered hot water | **63** | Sycous total for `service == 'Hot Water'` |
| `sycous-cw` | Sub-metered cold water | **57** | Sycous total for `service == 'Cold Water'` |
| `invisible-resident` | Resident MPANs (DNO/BNO) | **~842** | Estimated = sum `phasing.total_units_planned` at DNO + BNO sites (Bramshott + Durrants + Great Alne + Elderswell + Ledian) |

### Middle column — platform nodes (5 total)

| Node ID | Label | Logo | Notes |
|---|---|---|---|
| `stark` | Stark | `stark.svg` | Reads only the 16 Landlord HH meters |
| `ecotricity` | Ecotricity | `ecotricity.svg` | Bills all landlord NHH + void + other + gas (227 meters total) |
| `sycous` | Sycous | `sycous.svg` | All 1,049 sub-meters |
| `arbnco` | arbnco | `arbnco.svg` or text fallback | Aggregator — re-reads Ecotricity data + derives DNO resident; rendered as a thin secondary node connected from Ecotricity (re-reading) and to the invisible channel (derivation) |
| `invisible` | Invisible to IVG | none — small "—" or "?" mark | The honest gap |

### Right column — site nodes (11 in-scope)

| Node ID | Label | Icon |
|---|---|---|
| `site-austin-heath` | Austin Heath | `eir/public/sites/austin-heath/icon.svg` |
| `site-gifford-lea` | Gifford Lea | ... |
| `site-bramshott-place` | Bramshott Place | ... |
| `site-millbrook-village` | Millbrook Village | ... |
| `site-durrants-village` | Durrants Village | ... |
| `site-great-alne-park` | Great Alne Park | ... |
| `site-ledian-gardens` | Ledian Gardens | ... |
| `site-elderswell` | Elderswell | ... |
| `site-millfield-green` | Millfield Green | ... |
| `site-ampfield-meadows` | Ampfield Meadows | ... |
| `site-blendworth-hills` | Blendworth Hills | ... |

Sonning Common and Edwalton Office are **out of scope** for GRESB FY25 and **excluded from the Sankey** by default. Same treatment as elsewhere — don't add a separate visual layer here.

### Per-site MPAN breakdown (for site-level link generation)

Claude Code computes these directly from `mpan_register.json`. The numbers below are reference values for verification:

| Site | HH | NHH | Void | Other | Gas | Sycous total | DNO-est |
|---|---|---|---|---|---|---|---|
| Austin Heath | 1 | 0 | 0 | 0 | 2 | 276 | — |
| Gifford Lea | 1 | 1 | 0 | 0 | 1 | 286 | — |
| Bramshott Place | 3 | 14 | 25 | 4 | 3 | 0 | 191 |
| Millbrook Village | 1 | 10 | 1 | 0 | 1 | 0 | — |
| Durrants Village | 1 | 8 | 3 | 2 | 0 | 0 | 173 |
| Great Alne Park | 1 | 8 | 0 | 0 | 0 | 0 | 171 |
| Ledian Gardens | 1 | 0 | 54 | 10 | 4 | 126 | 162 |
| Elderswell | 2 | 2 | 44 | 3 | 1 | 77 | 145 |
| Millfield Green | 1 | 0 | 0 | 0 | 0 | 133 | — |
| Ampfield Meadows | 2 | 1 | 0 | 0 | 0 | 114 | — |
| Blendworth Hills | 2 | 0 | 1 | 0 | 0 | 37 | — |

If Claude Code's computed values diverge from these by >5%, **stop and surface** — suggests pipeline state has changed since this brief was written.

---

## Iconography

### Left column commodity icons (lucide composites + existing IVG icons)

Same discipline as Brief 18's Hybrid icon (Flame + Zap composite). Use lucide-react where available, and existing IVG SVGs where they exist. Compose at small size (~16px) beside the commodity label.

| Commodity | Icon |
|---|---|
| Gas | Existing IVG gas-flame SVG (already in the tool from Brief 14 Map) |
| Elec — Landlord HH | Existing IVG electricity-bolt SVG + small lucide `Clock` overlay (HH = half-hourly) |
| Elec — Landlord NHH | IVG bolt + small lucide `Calendar` overlay (NHH = monthly billing cycle) |
| Elec — Void | IVG bolt + lucide `Home` outline (residential, vacant) |
| Elec — Other | Small dotted circle (matches existing "estimated" data-quality treatment from the Energy Consumption tab) |
| Sub-metered electricity | Lucide `Zap` + small `Gauge` (sub-meter indicator) |
| Sub-metered heat | Lucide `Flame` + `Gauge` |
| Sub-metered heat & hot water | Lucide `Flame` + `Droplet` composite |
| Sub-metered hot water | Lucide `Droplet` + small steam glyph (or just `Droplet` with warm-tone tint) |
| Sub-metered cold water | Lucide `Droplet` (cool-tone tint) |
| Invisible-resident | Lucide `EyeOff` or `HelpCircle` |

These render to the **left** of each commodity label in the Sankey's left column. Icon size: 14–16px to match `--text-body` scale.

### Middle column platform logos

Logos from `eir/public/logos/`. If a logo file is missing, render the platform name in `--text-body-small` weight 600 in `--coral` as a clear fallback. Do NOT proceed silently with a missing logo — log the gap.

### Right column site icons

Reuse the per-site `icon.svg` from Brief 14 (`eir/public/sites/<site>/icon.svg`). Render at 14px to the **left** of each site label, matching the existing pattern from the Consumption chart's x-axis ticks.

---

## Scope statement

**In scope:**
- Pipeline check (Part 1): verify all commodity counts; surface drift; add 12-MPRN correction to the narrative; ensure the DNO-resident estimate is computed in the pipeline (not the React component).
- Sankey component (Part 2): d3-sankey-based, 3-column layout, 11 commodity + 5 platform + 11 site nodes, real flow widths, click-to-highlight interaction, hover tooltips, filter pills above the chart (All / Ecotricity / Stark / Sycous / Invisible).
- Iconography (Part 3): commodity icons (lucide composites + existing IVG), platform logos from `/logos/`, site icons reused.
- Replace placeholder `<MeteringPanes />` graphic in `PortfolioEnergy.jsx` with the Sankey. **Narrative pane stays — only the chart changes** (with the small 16→12 gas correction).
- Honest treatment of estimated DNO-resident flow: dashed ribbon, smaller opacity, tooltip explicitly notes estimation.
- Rule 11 inheritance: container, type scale, nav alignment all unchanged.

**Out of scope (log + continue):**
- Sankey on any other sub-tab (Consumption, Heating, Power) — they keep their existing charts.
- New commodity icons as bespoke SVG (lucide composites + IVG existing icons are the iteration; bespoke can come later).
- The narrative paragraph 3 (high-consumption voids context) — stays. Don't remove or rewrite.
- Sonning Common / Edwalton inclusion — out of scope for GRESB FY25, not in the Sankey.
- Bottom-up resident estimate methodology — Chris said come back to that.
- arbnco methodology investigation — separate workstream.

---

## Operational mode

Plough-through with ONE checkpoint after Part 2 (Sankey rendering, before iconography pass).

**Escalate (log + stop) for:**
- Commodity counts diverging from the reference table by >5% — suggests pipeline drift; stop and surface.
- d3-sankey unable to fit the 27-node graph cleanly in the available canvas (1216px × ~720px at 1920×1080 viewport) — propose a layout fix before continuing.
- Logos folder missing files — list missing, render text fallback, continue but log in close report.
- The Sankey rendering breaks Rule 11 alignment (e.g. the chart container pushes outside the 1280px width or overflows the graphic pane) — stop, do not redesign Rule 11.
- 15 min stuck + 3 approaches.

---

## Principles

1. **Real data, computed live.** No hardcoded counts in the React component. Falsifiability: `grep -E "1049|496|338|842|128" eir/src/components/portfolio/PortfolioEnergy.jsx` should return zero hits (these numbers should appear only in the pipeline JSON or be derived in `useMemo` from it).
2. **Honest invisible-to-IVG.** The estimated DNO resident count (~842) is rendered with dashed stroke, lower opacity, and a tooltip explicitly stating "Estimated — pipeline doesn't carry this; counted as 1 MPAN per planned unit at DNO + BNO sites." Don't render it indistinguishable from the measured flows.
3. **Logos and icons earn their keep.** Platform logos in the middle column make the platforms visually identifiable, not just named. Commodity icons in the left column distinguish HH vs NHH vs Void at a glance. Site icons in the right column reuse the existing established treatment.
4. **Rule 11 inheritance.** Same `--text-*` tokens, same container, same nav-alignment. The Sankey lives inside the existing graphic pane; doesn't change the page composition.
5. **Click-to-highlight, not click-to-filter-page.** The Sankey is a self-contained graphic. Clicking a node highlights its connected flows within the diagram and dims the rest — it does NOT cascade to filter the narrative or other components on the page.
6. **Browser-verify is the gate.** 1920×1080 primary walkthrough, 1440×900 graceful scale-down. AFTER screenshots mandatory for: default state, single-node-highlighted state (e.g. click Sycous), single-site-highlighted state (e.g. click Ledian), invisible-channel-only filter state.

---

## Parts

**Each Part: STATUS.md updated at start + end. Commit + push after PASS. Hard Rules 2, 3, 4 apply.**

### Part 1 — Pipeline preparation + corrections

- Verify the commodity counts in the reference table against the live pipeline. If any diverge >5%, stop and surface; otherwise update the reference table in the brief with the verified-as-of-today numbers.
- Add a `metering_sankey` block to `portfolio.json` (or appropriate JSON output) that pre-computes:
  - The 11 commodity totals
  - The per-site MPAN breakdown (HH / NHH / Void / Other / Gas / Sycous-total)
  - The DNO-resident estimate per site (planned units at the 5 DNO/BNO sites)
- Correct the **"16 gas MPRNs"** reference in the existing Metering narrative paragraph 1 to **"12 gas MPRNs"**. This is the small Part-2 narrative cleanup folded in.
- Cross-check that Sonning Common and Edwalton are correctly excluded.

Commit `Brief 20 Part 1: pipeline preparation + gas count correction`.

### Part 2 — Sankey component (CHECKPOINT)

- Install d3 and d3-sankey if not already (`npm i d3 d3-sankey`).
- Create `eir/src/components/portfolio/MeteringSankey.jsx` (or appropriate path) implementing the 3-column Sankey per the prototype. Read all data from `portfolio.json`'s new `metering_sankey` block.
- Layout: nodes ordered top-to-bottom per the reference tables. Use `nodeSort(null)` to preserve declared order. Padding 8px between nodes; node width 14px.
- Colour the ribbons by **commodity** (not platform) — i.e. each link inherits its source commodity's colour token. This makes the visual story "this commodity flows through this platform to these sites."
- Click-to-highlight: clicking any node isolates its connected flows (BFS from that node) and dims the rest. Click the same node or empty space to release.
- Hover tooltips: per-node and per-link, showing the count and a short detail string.
- Filter pills above the chart: All / Ecotricity / Stark / Sycous / Invisible to IVG — same behaviour as click-to-highlight, but persisted until another pill is selected.
- Replace placeholder `<MeteringPanes />` content with this component. Keep narrative pane unchanged (other than the Part 1 correction).

**Checkpoint:** push Part 2 + AFTER screenshots at 1920×1080 showing default state + one highlighted state. Confirm structure + flow widths + interaction with Chris before Part 3.

Commit `Brief 20 Part 2: Sankey component with click-to-highlight (CHECKPOINT)`.

### Part 3 — Iconography pass

- **Commodity icons (left column):** render lucide composites and existing IVG icons per the iconography table. Icon size 14–16px, positioned to the left of the commodity label.
- **Platform logos (middle column):** load logos from `eir/public/logos/`. Position above or beside the platform node. If a logo file is missing, render the platform name as text fallback in `--coral` `--text-body-small` weight 600 — and **list the missing logos in the close report** so they can be added later.
- **Site icons (right column):** reuse `eir/public/sites/<site>/icon.svg` at 14px to the left of each site label, matching the established Brief 14 pattern.
- Verify icon contrast against the dark register palette — if any icon disappears against the background, apply `filter: invert(1)` or `currentColor` mask treatment.

Commit `Brief 20 Part 3: iconography pass`.

### Part 4 — Walkthrough + close

- Full 1920×1080 walkthrough of the Metering & data quality sub-tab. Screenshots:
  - Default state (all visible)
  - One commodity highlighted (e.g. click Sycous-elec)
  - One platform highlighted (e.g. click Sycous)
  - One site highlighted (e.g. click Ledian Gardens)
  - "Invisible to IVG" filter pill active
- 1440×900 graceful scale-down screenshot.
- Falsifiability greps in close report:
  - `grep -E "1049|496|338|842|128" eir/src/components/portfolio/` — zero hits expected (all numbers from pipeline JSON).
  - `grep -rn "font-size:" eir/src --include='*.jsx'` — Rule 11 type scale grep still zero.
  - Computed CSS values for container width, narrative width, gutter — confirm Rule 11 layout numbers held.
- Rule 11 status: unchanged. Confirm in close report.
- Known issues logged: any missing logos, any commodity counts that drifted, any iconography gaps.
- **STATUS.md final update.**
- Brief archived to `archive/20_metering_sankey_COMPLETED.md`. `current.md` repointed.

Commit `Brief 20 close: Sankey + iconography`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 4 parts landed; Part 2 checkpoint approved by Chris before Part 3 began.
2. **Pipeline preparation:** `portfolio.json` carries `metering_sankey` block with commodity totals + per-site breakdown + DNO-resident estimate. JSON inspection pasted.
3. **Gas count corrected:** the existing narrative says "12" not "16". Diff pasted.
4. **Sankey rendering** with 27 nodes + commodity-coloured ribbons at 1920×1080. **AFTER screenshot.**
5. **Click-to-highlight functional:** clicking a node isolates connected flows. **AFTER screenshot of highlighted state.**
6. **Filter pills functional:** All / Ecotricity / Stark / Sycous / Invisible. **AFTER screenshot of one filter applied.**
7. **Invisible-to-IVG flow honest:** dashed stroke + lower opacity + tooltip explicitly notes estimation. **AFTER screenshot showing the dashed ribbon.**
8. **Commodity icons rendering** at left column — at least HH (clock-overlay) and NHH (calendar-overlay) visibly distinguishable. **AFTER screenshot.**
9. **Platform logos rendering** at middle column. Any missing logos listed in close report.
10. **Site icons rendering** at right column reusing Brief 14 SVGs.
11. **No hardcoded counts:** `grep -E "1049|496|338|842|128" eir/src/components/portfolio/` returns zero hits.
12. **Rule 11 inheritance:** computed CSS values for container max-width (1280), narrative width (within 400-520 band), gutter (48), Rule 11 font-size grep still zero. Pasted.
13. 1440×900 graceful scale-down verified.
14. No regression on Consumption / Heating / Power sub-tabs or other tool pages.
15. STATUS.md start/end entries per Part. Audit doc populated. Bible discipline evidenced.
16. Brief archived; current.md repointed.
17. Known issues logged — explicitly: any missing logos, any future bespoke commodity SVG work, Meterpoint platform integration still deferred.
