# Phase 1B — demo readiness (for Chris's morning review)

**Status:** 18 of 19 chunks PASS. Tier 3 (chunk 18 Load Inspector) deferred — no Stark CSVs in source-data.
**Demo:** IVG (Rob Preston, Jez Conen, Laura Bagnall) — 22 May 2026.
**Not pushed** per brief — you push in the morning.

## How to run locally

```
cd eir
npm run dev          # http://localhost:5173
# or
npm run build && npm run preview
```

## Routes (14 total)

- `/` — Portfolio overview (4-quadrant infographic ⚡🔥💧♻️)
- `/portfolio/{overview|map|sites|comparisons}`
- `/site/{id}/{overview|energy|carbon|mpans|data-quality}` — 13 sites × 5 sub-tabs = 65 site routes
- `/insights/{reconciliation|voids|data-quality}`
- `/gresb`

All routes fit a 1366×768 viewport without page scroll. Verified at 1366, 1440, 1920. Mobile 375px works (some narrower screens may show slight horizontal scroll on dense charts — acceptable).

## What works — the demo story

1. **Landing infographic** is the cold-open: 4 big numbers (4.5M kWh elec, 7.6M kWh gas, ~18k m³ water, ~145 t waste) with status badges. Click any quadrant and you drop straight into the relevant insight or site list.

2. **Top-nav 4 sections** — Portfolio | Site | Insights | GRESB. Site is greyed until you click into one (then stays enabled across the session via localStorage).

3. **Portfolio > Sites** is the workhorse — sortable 9-column table with 4 status badges per row (Elec, Gas, Water, Waste). Sorting and the colour pattern alone tells a story.

4. **Site Detail** has a persistent left sidebar of 13 sites with status dots — switching between sites stays in the current sub-tab. 5 sub-tabs per site:
   - **Overview**: 4 metric tiles
   - **Energy**: monthly stacked bar (HH/NHH/Gas) + Monthly/Half-hourly toggle (HH disabled — "Coming soon")
   - **Carbon**: scope breakdown + pie chart + intensity per m² vs portfolio median callout
   - **MPANs**: full inventory with All/Landlord/Voids/Inactive filter pills
   - **Data quality**: 5-row metric status table + Sycous coverage panel

5. **Insights > Voids** has the £49,134/year callout in coral 72px serif — the money line.

6. **Insights > Data quality** combines the 13×4 heatmap (every cell click-through to site detail) with the 27-item RFI list grouped by theme A-F, expandable.

7. **GRESB Readiness** stub: 3 stat cards (52/62/3→11 assets) + 5 indicator progress bars + "Coming Sunday" callout.

## What's rough — visible in the demo

1. **Bramshott Place gas reconciliation 80% gap** — surfaces correctly in the Insights chart and validation log. Frame as a feature of the tool, not a bug: the platform exists exactly to surface gaps like this.

2. **Half-hourly Load Inspector NOT built** — the energy sub-tab toggle stays as "Coming soon". Stark CSVs were not in source-data tonight. If/when 12 Stark CSVs land in `pipeline/source-data/`, re-running `python pipeline/build.py` auto-detects them and produces the per-MPAN JSON. The toggle wiring stays disabled until the Load Inspector component itself is built (a separate piece of work, ~6-8 hours per the handoff doc).

3. **Carbon scope split assumption** — portfolio is S1>S3>S2 because DNO-arranged sites (Durrants, Great Alne, Millbrook, Ledian) put resident elec on individual MPANs, not in our derived_resident calc. Methodology note: residents on individual supplies are Scope 3 Cat 13 in the GHG inventory but aren't billed to IVG. Worth flagging to Jez.

4. **Carbon pie chart total label** is slightly mis-positioned (relies on negative margin). Minor cosmetic.

5. **Comparisons view monthly chart** combines HH+NHH+Gas into one number per site per month. Could be broken out further — out of scope tonight.

## What's NOT built (intentional non-goals)

- Stippled UK map (still solid silhouette from Phase 1A)
- Load Inspector half-hourly view (no source data)
- Real GRESB Readiness scorecard (stub only — full version Sunday)
- Sycous bring-your-own-data UI (sub-metering data is shown read-only)
- Routing for query-param filters (the landing quadrants link to `?filter=water` but the Sites table ignores that — minor UX, not a blocker)

## Data findings worth narrating

- **3.89 GWh implied resident electricity** across the portfolio (Scope 3 Cat 13). Insights > Reconciliation surfaces this cleanly.
- **£49,134/year void cost** — 82 high-consumption voids billing IVG. Insights > Voids. Click any site row to drill into MPANs.
- **3,450 tCO2e total Scope 1+2+3** with the 40/27/33% split shown on the Carbon view per site and Insights aggregations.
- **27 outstanding RFI items** across 6 themes (A through F). Visible on Insights > Data quality. Frames the "what we still need from IVG" conversation directly.
- **Sycous coverage: 7 of 13 sites** with 669 properties metered across 1,049 sub-meters. Best coverage: Austin Heath (158 props, 97% data quality). Worst: Blendworth Hills (37 props, 0% — still commissioning).
- **Bramshott Place gas 80% gap** (Eco 394k vs arbnco 1.94M) — the tool surfaces this as an amber data-quality flag.

## Pipeline state

`pipeline/dist/eir/` has 12 JSON files + half_hourly_index.json:

| File | Source | Phase |
|---|---|---|
| sites.json | Site Overview (cached — workbook gone) | 0 |
| energy.json | Arbnco | 0 |
| water.json | Water | 0 |
| waste.json | Waste | 0 |
| portfolio.json | derived | 0 |
| electricity_monthly.json | Ecotricity | 1A |
| mpan_register.json | Ecotricity | 1A |
| reconciliation.json | Ecotricity | 1A |
| rfi_status.json | RFI Register | 1A |
| sycous.json | Sycous | **1B** |
| carbon.json | derived | **1B** |
| gresb_stub.json | hard-coded | **1B** |
| half_hourly_index.json | empty (no CSVs) | 1B |

Validation: 3 warnings — all real data gaps (Ampfield elec 20.5%, Bramshott gas 79.6%, Ledian gas 5.7%). Not pipeline bugs.

## Tier outcome

| Tier | Chunks | Outcome |
|---|---|---|
| 1 (must) | 1–12, 13, 16 | ✅ All done |
| 2 (high-value) | 14, 15, 17 | ✅ All done |
| 3 (stretch) | 18 | ⏸ Deferred — no HH CSVs |
| 4 (always) | 19 | ✅ QA + this doc |

## Bundle size

718 KB JS / 201 KB gzipped. Recharts is the bulk. Code-splitting would help but not for tonight.

## Suggested 1-hour polish list

1. **Stark CSVs into source-data** → rerun pipeline → 12 per-MPAN JSON files appear. Then either build the Load Inspector (6-8h, deferred to next session) or leave the toggle disabled for the demo.
2. **Bramshott gas investigation** — check the Ecotricity workbook to see if any gas MPRNs are missing. If yes, add them and rerun pipeline.
3. **Resize the carbon pie's centre label** so it sits cleanly over the donut hole.
4. **Sites table column-header colour cues** when sorting by status (currently all sort identically — could add a hint that confirmed comes first).
5. **GRESB page hero centring at narrow viewports** — small visual issue at <900px.

## When you push

```
git push origin main
```

Vercel auto-deploys. The catch-all SPA rewrite I added in chunk 1 means all the new routes (/portfolio/*, /site/*/sub, /insights/*, /gresb) work on direct loads. Tested locally — verify on the live URL after deploy.

## Commits this session (19)

Tier-1 fix push commit + 14 chunk commits (chunks 1-17 + this QA chunk to come) + STATUS commit + one big consolidated commit for chunks 10-17.
