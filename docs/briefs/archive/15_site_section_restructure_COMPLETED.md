# Brief 15 — Site section restructure + layout principle + phasing reference + Portfolio sub-tab naming

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** DRAFT — **do NOT start until Brief 14 has landed and pushed.** Brief 14 is editing the Portfolio map + hover card live; this brief must not collide. On Brief 14 close, reconcile against the new HEAD, then begin.
**Date opened:** 2026-05-24
**Mode:** Plough-through, no Chris checkpoints. Push at close. **Mandatory browser walkthrough on completion — screenshot every changed tab.**

---

## Why this brief

From the 24 May rendered-tool review (Chris living in the Site section, screenshots). The Site pages are functionally real but structurally poor: full-width misused, charts cut off, data bars laid left-to-right, a contrast bug, and a half-page Sycous slab. The fixes share ONE root principle, so the brief is built around it.

**Confirmed against HEAD `888764c`:**

1. **Full-width is overused.** Overview has a wide horizontally-scrolling table and a large centred text block eating vertical space. Rule going forward: **full width only when the content needs it.** Most site content does not.
2. **THE LAYOUT PRINCIPLE (the spine of this brief).** Data tiles / figures / status badges **stack vertically down a narrow left column**; charts take the **remaining width at near-full height.** Today the data bars run left-to-right and the charts are squashed/cut off — this recurs on Overview, Energy, Carbon. Fix it as a principle, applied to every tab in scope, not a per-tab patch.
3. **Overview "highlight to read" contrast bug.** Body text on the Overview renders near-invisible until selected (see screenshot — the "Data quality overview" block only legible when highlighted). Same family as the Brief 13 Carbon cream-on-cream fix; here on Overview. Use existing on-cream tokens.
4. **Overview centre text block too large.** The "Mix heat network…" descriptor + spacing eats vertical real estate. Trim / move into the left column per the layout principle.
5. **Energy monthly chart shows overlapping years.** Currently Oct-24 → Dec-25 (15 months — two Novembers, two Decembers visible). Change to a clean **calendar year Jan–Dec (12 bars)**. Half-hourly view is good — leave it.
6. **The Sycous "Resident energy" slab is too big.** It occupies ~half the Energy tab to convey ~3 facts (network, properties/meters, 100% reads) + the reconciliation narrative. Demote to a **small opt-in** (collapsed strip / expandable), NOT deleted — it carries the bulk→resident→Cat 13 GHG story which is genuinely valuable. Default collapsed; expand on click.

**Plus three architecture asks (Chris's calls, 24 May):**

7. **Standalone phasing reference table** (Chris: "just a standalone reference table for now"). A table view of the generic data behind every site. **IMPORTANT — data reality:** `sites.json` has a `phasing` block (`open_year`, `phases[]` with `phase`/`units`/`complete_year`, `total_units_planned`, `current_units`, `status`, `notes`) and a SITE-LEVEL `archetype` (`primary_heating`, `grid_type`, `solar_pv_kwp`, `battery`, `chp`, etc.). **There is NO per-phase heating or per-phase power strategy in the data** — only one strategy per whole site. So: build the table from what EXISTS (units per phase, timing, site-level heating/power/grid, occupancy, status) and **surface the per-phase heating/power as an explicit gap.** This table doubles as the structured ask handed back to IVG to firm up in writing. Do NOT fabricate per-phase strategy.
8. **Comparisons — leave in Portfolio, defer building out** (Chris). No work on Comparisons in this brief beyond whatever the renaming in #9 implies. Log that its real build waits until site detail is richer.
9. **Portfolio sub-tab naming — rethink now** (Chris). Current order (App.jsx L128–131): **Overview / Map / Sites / Comparisons.** Note: there is ALREADY a Portfolio "Overview" sub-tab — reconcile, don't duplicate. Propose and apply a cleaner naming/order. Keep Comparisons present (deferred), but the labels should make the section read coherently.

---

## Reference

1. **NZA Development Bible** — Notion. CLAUDE.md Process Rule 10 (chart heights) applies — the Energy chart change touches Recharts.
2. This brief at `docs/briefs/active/15_site_section_restructure.md`.
3. 24 May review (this Why-this-brief section).
4. **Brief 14** (`archive/14_portfolio_map_overhaul_COMPLETED.md` once closed) — for the Source Serif site-name token (reuse it on site titles here) and whatever sub-tab changes 14 made to the map. Reconcile.

---

## BEFORE DOING ANYTHING

0. **Confirm Brief 14 is closed + pushed.** `git log --oneline -8` must show Brief 14 close on `origin/main`. If not, STOP — this brief is blocked.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `tail -20 STATUS.md`, `git status --short` clean.

0.5 **Land brief** at `docs/briefs/active/15_site_section_restructure.md`, update `current.md`, quote title + Why-this-brief back. Commit `Brief 15 land: site section restructure`.

1. **Confirm inputs:**
   - `sites.json` `phasing` + `archetype` + `identity` blocks (read 2–3 sites incl. Ledian + an office). Confirm the per-phase strategy gap is real across sites, not just Ledian.
   - Site Overview render code (App.jsx ~L520–545 MetricTiles + the descriptor block + the "data quality overview" text).
   - Site Energy render code (the monthly chart date range; the Sycous panel `SycousPanel.jsx mode="energy"`).
   - The Source Serif token from Brief 14 — reuse on site titles, do not re-add.
   - Portfolio sub-tab array (App.jsx L128–131).

---

## Scope statement

**In scope:**
- **Layout principle** (#2) applied to **Site → Overview, Energy, Carbon**: vertical left column for tiles/figures/badges; charts fill remaining width near-full-height; no left-to-right data bars; no cut-off charts; full width only where needed (#1, #4).
- **Overview contrast bug** (#3) fixed with on-cream tokens.
- **Energy monthly chart** → calendar Jan–Dec, 12 bars (#5).
- **Sycous slab** → collapsed opt-in, default closed, expandable, narrative preserved (#6).
- **Standalone phasing reference table** (#7) — built from real fields, per-phase heating/power surfaced as gap; reachable as its own route (a standalone page — Chris's "standalone for now"; not a Site tab, not the map).
- **Portfolio sub-tab renaming** (#9) — reconcile the existing Overview tab, propose+apply coherent labels/order, keep Comparisons present-but-deferred.
- No-scroll-at-1440×900 on every page touched.

**Out of scope (log + continue):** Site → Water / Waste / Meters / Data quality tabs (Chris will interrogate these next — SEPARATE brief); building out Comparisons (#8 — deferred); any pipeline DATA change (read what exists; the phasing table reads existing fields); the map + hover card (Brief 14's territory); Insights + GRESB sections.

---

## Operational mode

Plough-through. Each Part = one commit + STATUS/audit. **Escalate (log + stop) for:** the layout principle forcing a rewrite of shared layout components (BodyPageLayout / Panel) that risks other tabs — stop and show Chris the blast radius; phasing data turning out to have per-phase strategy after all (then ask Chris whether to use it); no-scroll breaking; 15 min stuck + 3 approaches. Else keep going.

---

## Principles

1. **FULL WIDTH ONLY WHEN NEEDED.** Default to constrained, readable column widths. A wide horizontally-scrolling table is a failure state. (#1)
2. **VERTICAL-STACK LAYOUT.** Tiles/figures/badges stack vertically in a narrow left column; charts take remaining width at near-full height. This is THE principle — every in-scope tab obeys it. (#2)
3. **Honest data, never fabricated.** The phasing table shows real fields and flags the per-phase heating/power gap as an IVG ask. No invented per-phase strategy. (#7)
4. **Demote, don't delete.** The Sycous panel collapses to opt-in; its Cat 13 narrative is preserved, just not dominating. (#6)
5. **Cream register, IVG fonts; reuse Brief 14's Source Serif on site titles.** No new fonts.
6. **Browser-verify is the gate, not the build** (Brief 12/13/14 lesson). AFTER screenshots mandatory for: Overview (legible text, vertical layout), Energy (Jan–Dec chart, collapsed Sycous, near-full-height chart), Carbon (vertical layout), phasing table, renamed Portfolio sub-tabs.

---

## Parts

**Part 1 — layout principle on Site Overview.** Vertical left column; trim descriptor; fix contrast bug; full width only where needed. Commit `Brief 15 Part 1: Site Overview vertical layout + contrast fix`.

**Part 2 — Site Energy.** Apply layout principle (chart near-full-height); monthly chart → Jan–Dec 12 bars; Sycous slab → collapsed opt-in. Commit `Brief 15 Part 2: Site Energy layout + calendar chart + Sycous opt-in`.

**Part 3 — Site Carbon layout.** Apply the vertical-stack principle (scope breakdown left, donut right at proper height — Brief 13 already fixed the pie clipping; this is layout consistency). Commit `Brief 15 Part 3: Site Carbon vertical layout`.

**Part 4 — standalone phasing reference table.** New route; table from real fields; per-phase heating/power gap surfaced; clean for handing to IVG. Commit `Brief 15 Part 4: standalone phasing reference table`.

**Part 5 — Portfolio sub-tab rename + walkthrough.** Reconcile existing Overview tab; apply coherent labels/order; Comparisons present-but-deferred. Full 1440×900 walkthrough + screenshots. Commit `Brief 15 close: portfolio sub-tab naming + walkthrough evidence`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all parts landed; confirmed started AFTER Brief 14 close.
2. Site Overview: vertical left column, no wide scrolling table, descriptor trimmed, all text legible without highlighting. **AFTER screenshot.**
3. Site Energy: monthly chart is Jan–Dec (12 bars, no overlap); chart near-full-height; Sycous panel collapsed by default, expandable, narrative intact. **AFTER screenshots (collapsed + expanded).**
4. Site Carbon: vertical-stack layout, chart proper height. **AFTER screenshot.**
5. Layout principle confirmed applied to all three tabs — no left-to-right data bars, no cut-off charts remain in scope.
6. Standalone phasing table: real fields only; per-phase heating/power gap explicitly surfaced; reachable route. **AFTER screenshot.**
7. Portfolio sub-tabs renamed coherently; existing Overview reconciled (not duplicated); Comparisons present + deferred. **AFTER screenshot.**
8. No scroll at 1440×900 on every touched page; full-tool walkthrough confirms no collateral regression (list routes).
9. Build clean; Source Serif reused (not re-added) on site titles — grep confirms no second serif declaration.
10. Brief archived; current.md repointed.
11. Known issues logged — explicitly note Water/Waste/Meters/Data-quality tabs still pending Chris's deeper review, and Comparisons build still deferred.
