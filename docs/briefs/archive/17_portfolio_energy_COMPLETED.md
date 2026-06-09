# Brief 17 — Portfolio › Energy page (first thematic page)

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. The first of the new thematic Portfolio pages. The Map stays as-is from Brief 14; Overview / Sites / Phasing / Comparisons sub-tabs to be stripped in a later brief — **do NOT remove them in this brief.** This brief adds Energy alongside them.
**Date opened:** 2026-05-26
**Mode:** Plough-through with **ONE Chris checkpoint** in Part 1 (the in-scope/out-of-scope plumbing — see Part 1). Push at close. **Mandatory browser walkthrough on completion — screenshot every sub-tab.**

---

## Why this brief

We're rebuilding the Portfolio section thematically. Five new pages eventually: **Overview · Energy · Water · Waste · Carbon** plus the existing Map. This brief builds **Energy**, the largest and most data-rich of them, and in doing so establishes the **thematic-page template** (narrative left, interactive graphic right, sub-tabs switching both panes together) that the other three will reuse.

The full storyboard (narrative drafts, graphic specs, all decisions) is at `docs/briefs/refs/storyboard_energy_v2.md` — referenced as STORYBOARD throughout.

**Two structural points the storyboard must be applied through:**

1. **GRESB FY25 scope.** Sonning Common and Edwalton Office are **out of scope** for IVG's GRESB FY25 assessment. Sonning Common only comes into operation in FY26; Edwalton is an office, not a residential village. **The in-scope portfolio for this page is 11 sites, not 13.** Both out-of-scope sites still appear on the Map (Brief 14's territory) and may be referenced on pages where context demands it, but they **do not enter the portfolio totals** on the Energy page, and any "13" anywhere in copy or charts becomes "**11 (in-scope) · 2 (out of scope)**" or simply "11" with the out-of-scope sites called out separately.

2. **Scope statements on every aggregate.** Every "total electricity" or "total gas" number must carry a one-line scope statement attached: **landlord-only**, **landlord + sub-metered resident**, or **full estate (landlord + arbnco-derived resident)**. The reader should never have to wonder what a number includes. The brief specifies the scope per aggregate explicitly in the tokens table below.

---

## Reference

1. **NZA Development Bible** — Notion. CLAUDE.md Process Rules (especially Rule 10 on chart heights, Rule 8 reconciliation).
2. This brief at `docs/briefs/active/17_portfolio_energy.md`.
3. **STORYBOARD** at `docs/briefs/refs/storyboard_energy_v2.md` — copy from Chris's session output. **Read this first** — it carries the narrative prose, the four-tab structure, the graphic specs, and the design decisions already made with Chris. The brief below is mechanical wiring; the storyboard is the substance.

---

## BEFORE DOING ANYTHING

0. **Reconciliation:** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 **Land brief.** Place this brief at `docs/briefs/active/17_portfolio_energy.md`. Place STORYBOARD at `docs/briefs/refs/storyboard_energy_v2.md` (Chris provides). Update `current.md`. Quote the brief title + Why-this-brief section back. Commit `Brief 17 land: portfolio energy page`.

1. **Confirm inputs.**
   - Pipeline JSON: `pipeline/dist/eir/{portfolio,energy,sites,sycous,mpan_register,water,carbon}.json`. Each token in the table below cites its source path.
   - Existing Portfolio sub-tab array (`App.jsx` ~L128–131). **Add "Energy" — do not remove any existing tab.**
   - Brief 14's `--font-site` token (reuse on site-name renders inside this page; don't re-declare).
   - Brief 15's vertical-stack layout grammar — this page obeys it but extends it: narrative pane LEFT, graphic pane RIGHT, sub-tabs ABOVE both.

---

## Scope statement

**In scope:**
- New route `/portfolio/energy` rendered as a thematic page with four sub-tabs: **Consumption · Heating strategy · Power strategy · Metering & data quality**.
- Layout: narrative pane left (~40% width), graphic pane right (~60% width), sub-tabs above both. No scroll on graphic at 1440×900; narrative may scroll vertically within its own pane.
- In-scope/out-of-scope plumbing in the pipeline (see Part 1) — flag the 2 out-of-scope sites once, consume the flag everywhere.
- All four sub-tabs implemented per STORYBOARD, with the prose, tokens, and graphics as drafted.
- "Energy" added to the Portfolio sub-tab navigation alongside the existing tabs. **Do not remove Overview / Sites / Phasing / Comparisons in this brief** — those come out in a later restructuring brief, separately.

**Out of scope (log + continue):** the other thematic pages (Water / Waste / Carbon — separate briefs); the eventual Portfolio Overview page; stripping the existing sub-tabs; any change to the Map view; any change to per-site pages; any data ingestion of the new IVG-provided files (GIA, voids) — that's its own brief; the Meterpoint integration; the per-unit sanity spreadsheet (a separate reference artefact, not embedded here).

---

## Operational mode

Plough-through. One commit per Part. **Escalate (log + stop) for:**
- The in-scope/out-of-scope plumbing turning out to require broader pipeline changes than the brief anticipates (Part 1 checkpoint covers this).
- Any token in the table below returning a value that differs from the storyboard expectation by more than 5% (suggests pipeline drift — stop, show Chris).
- The heating-strategy matrix demanding per-phase data that doesn't exist (mark cells "confirm per-phase" per STORYBOARD §2; do NOT fabricate).
- The arbnco-derived resident figures returning the per-unit-implausible values flagged in the per-unit sanity check (Millbrook / Durrants / Great Alne / Ampfield / Blendworth) — render with the hatched-fill suspect treatment per STORYBOARD §1, do NOT silently smooth them.
- No-scroll-at-1440×900 on graphic pane breaking.
- 15 min stuck + 3 approaches.

Else keep going.

---

## Principles

1. **GRESB scope is structural, not cosmetic.** The 11-in-scope / 2-out-of-scope split runs through every aggregate, every chart, every token. Out-of-scope sites are visibly marked, not hidden. **Falsifiability:** after build, `grep -rn '"13"\|13 sites\|of 13' eir/src/components/portfolio/Energy*` returns no hits where "13" is being used as the in-scope portfolio count.
2. **Scope statements on every aggregate.** Every total kWh, total m³, total tCO₂e on this page carries a one-line scope attached (landlord / landlord + sub-metered / full estate derived). Specified per token in the table below.
3. **arbnco honesty.** Resident figures are presented but not editorialised beyond what the data supports. Methodology is stated as unpublished. Suspect sites are visually flagged (hatched fill on stacked bars per STORYBOARD §1).
4. **Honest per-phase gaps.** Heating-strategy matrix cells where per-phase data isn't in `sites.json` render as **"confirm per-phase"** rather than fabricated.
5. **Cream register, IVG fonts.** Source Serif (`--font-site`) reused on site-name renders only — no other use, no re-declaration. New tokens introduced ONLY for arrangement icons, heating strategy icons, and the four-segment stack palette.
6. **Browser-verify is the gate** (Briefs 12/13/14/15/16 lesson). Build clean ≠ pass. AFTER screenshots mandatory for: each of the four sub-tabs, the out-of-scope visual treatment, the hatched-fill suspect-arbnco treatment, the heating matrix with "confirm per-phase" cells, the power table with traffic-light status.

---

## Parts

### Part 1 — Pipeline plumbing + new route + sub-tab nav (CHECKPOINT)

The structural plumbing. Done first because everything else depends on it.

- Add `gresb_in_scope: bool` to each site record in `sites.json` (computed in the pipeline, not hand-edited). Sonning Common = `false`, Edwalton Office = `false`, all others = `true`.
- Add `portfolio_inscope` totals alongside the existing `portfolio` block in `portfolio.json` — computed by summing in-scope sites only. Existing `portfolio` block (all 13) stays for reference.
- Add the new route `/portfolio/energy` rendering a stub page with the four sub-tab shell and "in progress" placeholders in each pane.
- Add **"Energy"** to the Portfolio sub-tab nav — between **Map** and **Sites** (which stay). Do not strip existing tabs.

**Checkpoint:** before continuing to Part 2, push the stub + show Chris the pipeline JSON deltas + screenshot of the new tab in nav + screenshot of the empty four-sub-tab shell. Confirm the plumbing is right.

Commit `Brief 17 Part 1: portfolio energy route + scope plumbing`.

### Part 2 — Consumption sub-tab

Per STORYBOARD §1.

- Narrative pane left: implement the four-paragraph prose with the tokens listed below.
- Graphic pane right: stacked horizontal bar per site, 11 in-scope sites sorted by total kWh descending. Toggle pills (By commodity / By billing party / Total only). Portfolio total card top-right. Hatched fill for arbnco-derived-suspect segments.
- Hover tooltip per segment: site · category · kWh · % of site · % of portfolio · source.
- Use the colour palette from Principle 5.

Commit `Brief 17 Part 2: consumption sub-tab`.

### Part 3 — Heating strategy sub-tab

Per STORYBOARD §2.

- Narrative pane left: three-paragraph prose with tokens.
- Graphic pane right: building-archetype × phasing matrix. Three archetype rows per site (VC services · VC apartments · outer blocks), columns Phase 1–4. Cells contain heating-strategy icons OR "confirm per-phase" treatment where data isn't in the pipeline. Legend strip above. Hover detail per cell.
- Icons: communal gas + CHP / individual gas / ASHP / GSHP / heat network / none. Style matches Ledian capacity-study report iconography.

Commit `Brief 17 Part 3: heating strategy sub-tab`.

### Part 4 — Power strategy sub-tab

Per STORYBOARD §3.

- Narrative pane left: four-paragraph prose (supplier · three arrangements · capacity · solar) with tokens.
- Graphic pane right: per-site table with iconography columns (Arrangement, Solar) and data columns (ASC, CY25 peak, Spare capacity, Status). Traffic-light Status column with thresholds per STORYBOARD §3. Filter pills (All / Bulk / DNO / Pending review). Summary strip above table.

Commit `Brief 17 Part 4: power strategy sub-tab`.

### Part 5 — Metering & data quality sub-tab

Per STORYBOARD §4.

- Narrative pane left: five-paragraph prose (estate · three platforms · high-consumption voids · what it means) with tokens.
- Graphic pane right: stacked horizontal bar per site with three segments (Landlord HH / Landlord NHH / Void), with a darker shade on the void segment where high-consumption. Filter pills (All / Landlord only / Voids only / Sub-meters). Sub-meters toggle switches the chart to Sycous coverage view. Data-quality summary strip below.

Commit `Brief 17 Part 5: metering & data quality sub-tab`.

### Part 6 — Walkthrough + close

- Full 1440×900 walkthrough of all four sub-tabs. AFTER screenshots, every tab.
- Verify in-scope/out-of-scope handling: every aggregate uses 11; out-of-scope sites mentioned visibly where they're referenced; falsifiability grep clean.
- Verify scope statements present on every total in the rendered narrative.
- Verify the four bullets under "Operational mode escalations" did not silently fire — log any that did.
- Brief archived to `archive/17_portfolio_energy_COMPLETED.md`; `current.md` repointed.

Commit `Brief 17 close: portfolio energy walkthrough + evidence`.

---

## Tokens — wire from pipeline, NOT hardcoded

Every bolded `{{token}}` in the storyboard maps to a value computed from `pipeline/dist/eir/*.json`. Tokens listed here with **source path** and **scope statement**. Wire as live JSX/JS values, not string constants.

### Consumption sub-tab

| Token | Source | Computation | Scope statement |
|---|---|---|---|
| `total_elec_gwh` | `portfolio.json` (new in-scope block) | sum of `energy.<site>.consumption_kwh.electricity` for in-scope sites / 1e6 | **Landlord** electricity only |
| `total_gas_gwh` | same | sum gas / 1e6 | **Landlord** gas only |
| `total_energy_gwh` | same | sum total / 1e6 | **Landlord** combined |
| `gas_share_pct` | derived | `gas / (elec + gas) * 100` | Of landlord total |
| `top5_pct` | derived | sum of top 5 sites' total / portfolio total * 100 | In-scope sites only |
| `landlord_total_gwh` | same as `total_energy_gwh` | same | Same as above — surface explicitly for clarity |
| `landlord_gwh` | same | same | Same |
| `derived_resident_gwh` | `energy.json` `arbnco_derived_resident_total` (compute in pipeline) | sum of arbnco-Eco delta for in-scope multi-residential sites / 1e6 | **arbnco-derived resident**, methodology unpublished |
| `suspect_pct` | derived | % of `derived_resident_gwh` from sites flagged suspect (Millbrook, Durrants, Great Alne, Ampfield, Blendworth) | Per the per-unit sanity check |

### Heating strategy sub-tab

No numeric tokens — narrative is descriptive. Site counts ("2 sites", "4 sites", "7 sites") are derived from `sites.json` archetype field per the storyboard's three categories.

### Power strategy sub-tab

| Token | Source | Computation | Scope statement |
|---|---|---|---|
| `total_mpan_count` | `mpan_register.json` | count of electricity MPANs for in-scope sites | All MPAN types (incl. void) |
| `total_mprn_count` | same | count of gas MPRNs for in-scope sites | All MPRNs |
| `asc_complete` | `sites.json.archetype.asc_reviewed` (new field; falsy until populated) | count of in-scope sites with ASC review complete | Of 11 in-scope |
| `avg_spare_pct` | derived from ASC fields | mean of (ASC – peak)/ASC across reviewed sites * 100 | Reviewed sites only |

### Metering & data quality sub-tab

| Token | Source | Computation | Scope statement |
|---|---|---|---|
| `lhh_count` | `mpan_register.json` | count `category == "Landlord (HH)"` in-scope | Landlord HH only |
| `lnhh_count` | same | count `category.startswith("Landlord (NHH)")` in-scope | Landlord NHH only |
| `void_count` | same | count `category.startswith("Void")` in-scope | All void categories combined |
| `void_high_count` | same | count `category == "Void - HIGH consumption"` in-scope | Subset of void |
| `void_high_kwh` | same | sum cy25_kwh for those | Same |
| `ledian_void_count` / `_kwh` | same, filtered to Ledian | | Same |
| `bramshott_void_count` / `_kwh` | same | | Same |
| `elderswell_void_count` / `_kwh` | same | | Same |
| `sycous_property_count` | `sycous.json` portfolio block | sum of properties for in-scope sites | Sycous-covered only |
| `sycous_meter_count` | same | sum of meters for in-scope sites | Same |
| `full_coverage_count` | `mpan_register.json` | count meters with `months_covered >= 12` in-scope | All meters |
| `partial_count` | same | count `0 < months_covered < 12` | Same |
| `none_count` | same | count `months_covered == 0` | Same |
| `total_meter_count` | same | total electricity + gas meters in-scope | Same |
| `sycous_sites_with_full_coverage` | `sycous.json` | count of in-scope Sycous sites with 100% valid reads | Sycous sites only |

**If any token can't be computed cleanly from the existing pipeline** (e.g. `arbnco_derived_resident_total` isn't yet a field): add it to the pipeline as part of Part 1's plumbing. Do NOT hardcode the value in the React component.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 6 parts landed; Part 1 checkpoint approved by Chris before Parts 2–5 began.
2. `/portfolio/energy` route exists with 4 sub-tabs, navigable. **AFTER screenshots of all 4.**
3. **In-scope handling:** falsifiability grep clean (no "13 sites" / "of 13" in Energy components). Every aggregate uses the 11-site portfolio. Out-of-scope sites (Sonning Common, Edwalton) referenced where context demands, with visible "out of scope FY25" marker.
4. **Scope statements present** on every aggregate in rendered narrative (paste a grep showing the scope language appears next to each total).
5. Consumption tab: stacked bar with 11 sites + 4 segments + 3 toggle pills + portfolio total card + hatched fill on suspect-arbnco segments rendered correctly. **AFTER screenshot.**
6. Heating tab: building-archetype × phasing matrix with Ledian-style iconography; "confirm per-phase" cells where per-phase data isn't in pipeline. **AFTER screenshot showing both populated and confirm-per-phase cells.**
7. Power tab: per-site table with iconography + 4 data columns + traffic-light status + filter pills. ASC tokens computed correctly; pending sites flagged grey. **AFTER screenshot.**
8. Metering tab: 3-segment stacked bar + 4 filter pills incl. sub-meter toggle + data-quality summary strip. **AFTER screenshot.**
9. All tokens from the table above are wired to live pipeline values (paste relevant JSX lines showing each token's source).
10. Build clean; no-scroll-at-1440×900 on graphic pane on all 4 sub-tabs.
11. No regression on other Portfolio sub-tabs (Map, Overview, Sites, Phasing, Comparisons all still render — Brief 14/15 work intact).
12. Brief archived; current.md repointed.
13. Known issues / deferrals logged — explicitly note the pending Water / Waste / Carbon / Overview thematic pages, the pending Portfolio sub-tab strip-out, the GIA-file ingestion, the voids-file integration, and the Meterpoint integration.
