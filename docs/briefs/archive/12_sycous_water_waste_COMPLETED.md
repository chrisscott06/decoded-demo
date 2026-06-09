# Brief 12 — Sycous resident-billing chain + Site Detail Water & Waste tabs + hardening

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Surfaces IVG's most distinctive data (Sycous), rounds Site Detail to a proper 7-tab page, and folds in two cheap hardening wins.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no Chris checkpoints. Push at close. Walkthrough on completion.

---

## Why this brief

From the 22 May whole-tool gap review (tracked in the Site Detail roadmap note):
- **#3 Sycous built but never surfaced — the highest-value gap.** `sycous.json` holds the resident sub-metering data (7 sites, per-service Electricity / Heat & Hot Water / Cold Water, property + meter counts, valid-reads, data-quality %, annual totals). No other retirement-village operator has Sycous heat-cost analytics. It's invisible in the UI today. The bulk-gas → Sycous-heat → resident-bill reconciliation is IVG's most distinctive operational narrative.
- **#5 Site Detail Water + Waste are stubs** — only Overview tiles; no dedicated tabs. Waste is now real (164 t, Brief 9); water has rich per-site data. Both deserve proper tabs.
- **Two hardening bits** (Tier 2): a **data-vintage / "last updated" badge** (credibility, trivial) and **error boundaries** on Site Detail routes (the Brief 6 white-screen must never recur silently).

Site Detail goes from 5 tabs to **7**: Overview / Energy / Carbon / **Water** / **Waste** / Meters / Data quality. Sycous surfaces on the Water + Data-quality tabs (resident water/heat is sub-metered via Sycous) and as the resident-billing story.

---

## Reference

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **Site Detail roadmap note** — https://www.notion.so/368d645e05cc8129bd4ef4fb73ef0111 (X1-X3 cross-cutting decisions; D4 Sycous panel; the gap-review backlog)
3. This brief at `docs/briefs/active/12_sycous_water_waste.md`

---

## BEFORE DOING ANYTHING

0. Reconciliation (Rule 8): `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md` (no active brief, Brief 11 last), `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 Land brief at `docs/briefs/active/12_sycous_water_waste.md`, update current.md, quote title + Why this brief back. Commit `Brief 12 land: Sycous + Site Detail Water/Waste + hardening`.

1. **Confirm the data shapes** (read one entry each):
   - `pipeline/dist/eir/sycous.json` — `by_site[id]`: `in_sycous`, `sycous_network`, `properties_count`, `meters_count`, `services_covered`, `by_service[]` (`service`, `properties`, `meters`, `valid_reads`, `total_reads`, `data_quality_pct`, `annual_total`, `unit`). `portfolio`: `sites_with_sycous` (7), `total_properties_metered` (669), `total_meters` (1049), `supply_types`.
   - `pipeline/dist/eir/water.json` — `by_site[id]` or top-level per-site: `water_company`, `retailer`, `meters_known`, `meters_with_cy2025_data`, `consumption_m3`, `data_quality`, `data_status`, `cy2025_coverage`, `completeness`, `key_gaps`.
   - `pipeline/dist/eir/waste.json` — per-site: `contractor`, `tonnage_total`, `tonnage_by_stream` {general/recycling/glass/organic/cardboard}, `disposal_split` {landfill/incinerated/recycled/ad}, `emissions_by_route`, `emissions_scope3_cat5_tco2e`, `diversion_rate`, `data_status`, `notes`.

2. **Confirm the pipeline build timestamp source** for the data-vintage badge — check if `build.py` writes a `generated_at` / `build_date` anywhere (e.g. a `meta.json` or a field in `portfolio.json`). If not, Part 4 adds one.

3. Read `App.jsx` sub-tab definitions (lines ~123-127) and `BodyPageLayout.jsx`. Begin Part 1.

---

## Scope statement

In scope: Water tab + Waste tab on Site Detail (7 tabs total); Sycous surfaced (resident-billing story on Water tab + integrated into Data-quality); data-vintage badge; error boundaries on Site Detail routes.

Out of scope (log + continue): Scope 3 expansion (gap #1 — blocked on IVG data); GRESB real content (#2); methodology page (#6); map compare-mode / export (#Tier-2 others); Meters exploration (separate brief C); the deferred map polish items. No new pipeline data (read what exists; the one addition is a build timestamp if absent).

---

## Operational mode

Plough-through. Each Part one commit + STATUS/audit. Escalate (log+stop) for: a needed JSON missing/wrong shape; build fails; no-scroll breaks unrecoverably; 15 min stuck + 3 approaches. Else keep going. Push at close.

---

## Principles

1. **Cream register, IVG fonts** (X3): coral primary, rose secondary, teal tertiary, amber alert, navy text; Stolzl headings, Inter body, IBM Plex Mono values. No JetBrains/DM.
2. **X2 page grammar:** heading + short context, rich visual; single view, no scroll at 1440×900 (Hard Rule 9).
3. **Honest data:** sites not in Sycous (6 of 13) show a clean "not sub-metered via Sycous" state, not blanks. Office waste `not_applicable`. Surface `key_gaps` / `notes` — they're the story.
4. **Tokens not raw hex.** Falsifiability: `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components --include="*.jsx"` on new files → 0.
5. Browser-verify at Part 5.

---

## Parts

### Part 1 — Site Detail Waste tab

**Goal:** New `/site/{id}/waste` tab showing the real waste story per site.

**Files:** `App.jsx` (add sub-tab + route), `eir/src/components/site/WasteTab.jsx` (new), audit doc `docs/audit/12_sycous_water_waste.md` (new).

**Steps:**
1.1 Add `{ key:'waste', label:'Waste', path:`/site/${id}/waste` }` to the Site Detail sub-tabs (after `data-quality`? No — order: Overview / Energy / Carbon / **Water** / **Waste** / Meters / Data quality. Insert Water + Waste after Carbon, before Meters). Wire the route to `<WasteTab siteId=.../>` in BodyPageLayout (cream).
1.2 **WasteTab layout** (X2 grammar): heading "Waste" + one-line context (contractor + data period) left; visuals right/below:
- **Stream breakdown** — horizontal bars or a compact stacked bar: general / recycling / glass / organic / cardboard (t). Coral/rose/teal/amber/navy.
- **Disposal split + diversion** — the headline: a diversion ring or bar (e.g. "99.x% diverted") with the landfill/incinerated/recycled/AD split. This is the strong story.
- **Emissions** — Scope 3 Cat 5 tCO₂e for the site, with the "tiny because diverted" framing (a one-liner comparing to the site's total carbon if available).
- **Contractor + notes** — small caption (BIFFA / ASH / SWP; `notes`).
1.3 Office (Edwalton) + any `not_applicable`/`missing` site: clean empty state ("No waste contract for this site" / "Waste data pending").

**PASS:** `/site/austin-heath/waste` shows 10.77 t, stream breakdown, ~98% diversion, 0.24 tCO₂e; Gifford Lea shows ~32 t; office shows not-applicable; no raw hex; no scroll at 1440×900.

**Commit:** `Brief 12 Part 1: Site Detail Waste tab — stream / disposal / diversion / emissions`

---

### Part 2 — Site Detail Water tab (+ Sycous resident water)

**Goal:** New `/site/{id}/water` tab: landlord/bulk water + the Sycous resident sub-metering story.

**Files:** `App.jsx`, `eir/src/components/site/WaterTab.jsx` (new), audit doc.

**Steps:**
2.1 Add the `water` sub-tab + route (positioned before Waste per Part 1.1).
2.2 **WaterTab layout:**
- Heading "Water" + context (water company + retailer) left.
- **Consumption** — `consumption_m3` headline, `data_quality` + `data_status` badge, `cy2025_coverage`.
- **Coverage / gaps** — surface `key_gaps` prominently (e.g. Ledian "Bulk meter only Jun–Aug, need remaining bills") — the gap IS the story (X2/D2 ethos).
- **Sycous resident water** (if `in_sycous` and a Cold/Hot Water service present): a panel showing resident sub-metering — properties, meters, valid-reads, data-quality %, annual total for the water-related services. This is the resident-billing surface for water.
2.3 Sites not in Sycous: show landlord water only + a "resident water not sub-metered via Sycous" note.

**PASS:** `/site/great-alne-park/water` shows 8,548 m³, Severn Trent/WaterPlus, Estimated badge, key_gaps surfaced; a Sycous site (e.g. Austin Heath) shows the resident sub-metering panel; non-Sycous site shows the note; no scroll.

**Commit:** `Brief 12 Part 2: Site Detail Water tab + Sycous resident water panel`

---

### Part 3 — Sycous resident-billing story (the distinctive narrative)

**Goal:** Make the bulk-supply → Sycous-sub-metering → resident reconciliation visible. This is gap #3, the highest-value item. Surface it on the Data-quality tab (D4) and as a resident-energy panel on the Energy tab.

**Files:** `eir/src/components/site/DataQualityTab.jsx` (update — integrate Sycous per D4), `eir/src/components/site/EnergyTab.jsx` or wherever Energy renders (add resident panel), `eir/src/components/site/SycousPanel.jsx` (new shared component), audit doc.

**Steps:**
3.1 **SycousPanel.jsx** (shared) — given a site's `sycous.by_site[id]`, render the per-service table/cards: for each `by_service` entry (Electricity, Heat & Hot Water, Cold Water): service name, properties, meters, valid-reads / total-reads, data-quality %, annual total (kWh or m³). 100%-valid-reads services are a good-news story — surface the DQ% as a small ring or bar, not just a number.
3.2 **Data-quality tab (D4):** replace the standalone Sycous table with `<SycousPanel>` integrated into the completeness narrative — "resident services are sub-metered via Sycous on network {sycous_network}; here's the coverage." Keep the existing metric/status/notes table.
3.3 **Energy tab resident panel:** add a compact "Resident energy (Sycous)" panel showing the resident Electricity + Heat & Hot Water annual totals — this is the bulk-to-resident reconciliation: landlord bulk supply at the top, resident sub-metered consumption below, the difference visible. Frame it as the reconciliation story (the ~3.9 GWh resident-elec gap from the Insights reconciliation is the portfolio version of this).
3.4 Non-Sycous sites: panel shows "Not sub-metered via Sycous" cleanly.

**PASS:** Austin Heath Data-quality shows the Sycous panel (162 props, Heat & Hot Water + Electricity services, DQ%); Energy tab shows resident Sycous totals; a non-Sycous site shows the clean note; the resident-billing chain is legible; no scroll.

**Commit:** `Brief 12 Part 3: Sycous resident-billing surfaced — Data-quality + Energy panels`

---

### Part 4 — Hardening: data-vintage badge + error boundaries

**Goal:** A "last updated" badge showing data vintage; error boundaries so a component failure shows a recoverable message, not a silent white screen.

**Files:** `pipeline/build.py` (add build timestamp if absent), `eir/src/components/DataVintageBadge.jsx` (new), `eir/src/components/ErrorBoundary.jsx` (new), `App.jsx` (wrap Site Detail routes; render badge), audit doc.

**Steps:**
4.1 **Build timestamp:** if `build.py` doesn't already write one, add `generated_at` (ISO date) to `portfolio.json` `meta` (or a small `meta.json`). Rebuild so it's present.
4.2 **DataVintageBadge.jsx** — small, unobtrusive (e.g. bottom of the nav or a corner): "Data updated {date} · CY2025". Reads `generated_at`. Both registers (cream + dark) — theme-aware.
4.3 **ErrorBoundary.jsx** — a React class error boundary: catches render errors in its children, shows a recoverable cream/dark-aware message ("This view couldn't load. Try another tab or refresh.") with the error logged to console. NOT a white screen.
4.4 **Wrap** each Site Detail route's content in `<ErrorBoundary>` (and ideally the map + insights routes too — cheap). The Brief 6 BodyPageLayout bug would have shown the recoverable message instead of blanking.
4.5 Render `<DataVintageBadge>` once in the app shell (visible on every page).

**PASS:** badge shows the real build date on every page; deliberately throwing in a Site Detail child renders the recoverable message not a blank page; both registers styled; no raw hex.

**Commit:** `Brief 12 Part 4: hardening — data-vintage badge + error boundaries`

---

### Part 5 — Walkthrough + close

**Steps:**
5.1 Boot dev server.
5.2 Self-walkthrough (MCP, 1440×900, screenshots to `docs/audit/12_screenshots/`):
- Site Detail now has 7 tabs: Overview / Energy / Carbon / Water / Waste / Meters / Data quality
- Waste tab: Austin Heath (10.77t, diversion, emissions), Gifford Lea (~32t), office (not-applicable)
- Water tab: Great Alne (8,548 m³, key_gaps), a Sycous site resident-water panel, a non-Sycous note
- Sycous: Data-quality panel + Energy resident panel on a Sycous site; clean note on non-Sycous
- Data-vintage badge visible with real date
- Error boundary: confirm a forced child error shows the recoverable message (can test by temporarily throwing, then revert)
- **No page scroll at 1440×900** on all 7 tabs (Hard Rule 9)
- Cream register, IVG fonts throughout
5.3 Falsifiability:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/site eir/src/components/SycousPanel.jsx eir/src/components/DataVintageBadge.jsx eir/src/components/ErrorBoundary.jsx --include="*.jsx"  # → 0
grep -rn "JetBrains\|DM Sans\|DM Serif" eir/src   # → 0
cd eir && npm run build                            # → clean
```
5.4 Archive brief → `archive/12_sycous_water_waste_COMPLETED.md`; repoint current.md; STATUS.md final; push.

**PASS:** 7 tabs; Waste + Water real; Sycous surfaced (resident-billing legible); badge + error boundaries working; no scroll; build clean; pushed.

**Commit:** `Brief 12 close: Sycous resident-billing + Water/Waste tabs + hardening`

---

## What MUST NOT happen
- No fake data for non-Sycous sites (6 of 13) — clean "not sub-metered" state
- No fake waste/water — office not_applicable, gaps surfaced honestly
- No Scope 3 expansion, GRESB content, methodology page, Meters exploration (other briefs)
- No `npm install` from Claude Code
- No JetBrains/DM fonts; no raw hex in new components
- No page scroll at 1440×900
- No partial commits within a Part

## When to escalate (log + stop)
- A needed JSON missing/wrong shape
- Build fails
- No-scroll breaks unrecoverably
- 15 min stuck + 3 approaches

## Final report
1. HEAD SHA + parts landed
2. 7 Site Detail tabs (Overview/Energy/Carbon/Water/Waste/Meters/Data quality)?
3. Waste tab real (Austin 10.77t, Gifford ~32t, office N/A)?
4. Water tab real (Great Alne 8,548 m³, key_gaps surfaced)?
5. Sycous surfaced — Data-quality + Energy panels; resident-billing legible; non-Sycous clean note?
6. Data-vintage badge with real date on every page?
7. Error boundary catches a forced child error (recoverable, not blank)?
8. No scroll at 1440×900 on all 7 tabs?
9. grep raw-hex = 0? EOC fonts = 0? build clean?
10. Brief archived, current.md repointed?
11. Known issues?
12. Standing by for Chris.

## Notes for Claude Code
The Sycous surfacing (Part 3) is the highest-value item — it's the distinctive IVG data no competitor has. Make the resident-billing chain (bulk supply → Sycous sub-metering → resident) legible, not just a table dump. Error boundaries (Part 4) are insurance against a repeat of the Brief 6 silent white-screen. Confirm receipt (title + Why this brief), then begin Part 1.
