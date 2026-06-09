# Phase 1A — demo readiness (for Chris's morning review)

**Status:** 15 chunks complete, all PASS. Local build green. **Not pushed** per brief.
**Demo:** IVG (Rob Preston, Jez Conen, Laura Bagnall) on 22 May 2026.

## How to run locally

```
cd eir
npm run dev          # http://localhost:5173
# OR
npm run build && npm run preview
```

Three routes:
- `/` — Portfolio overview (hero + UK map + sortable table)
- `/site/<id>` — site detail (hero + monthly chart + MPAN inventory + data quality)
- `/insights` — Eco vs arbnco reconciliation chart + £49k void callout + completeness heatmap

## What works (the demo story)

1. **Landing page** opens with deep-navy bg, "Portfolio overview" coral title, 4 stat tiles, UK map with 13 coral-haloed dots, sortable site table.
2. **Click any dot or row** → site detail. Austin Heath has 2.9 GWh elec / 2.5 GWh gas, four MetricTiles, monthly stacked-bar chart, MPAN inventory (3 MPANs), data quality table.
3. **Sonning Common** correctly handles no-data state ("No electricity data available", "No MPANs recorded").
4. **Site Detail → MPAN inventory** for Ledian Gardens shows 5 landlord MPANs by default with "Show 64 voids" expander — telling visualisation of the void problem.
5. **Insights** opens with hero containing the rec-gap callout ("3.9M kWh implied resident electricity"), horizontal grouped bar chart Eco vs arbnco.
6. **The £49,134 / year void callout** in Playfair 96px coral is the money line.
7. **Heatmap** at the bottom of Insights is 13×4 — every cell clickable to site detail.
8. **Mobile** works — table collapses to cards, hero stacks, no horizontal overflow.

## What's rough — top 3 visible issues for the 1-hour polish

1. **UK map is a solid silhouette, not stippled.** Brief offered both, took the fallback path to save risk. Stippling would be a nice polish — add an SVG `<pattern>` of dots clipped to the GB path. Probably 30-60 min of CSS/SVG work.
2. **Bramshott Place gas reconciliation has an 80% gap.** Eco shows 394k kWh, arbnco shows 1.94M kWh. Real data discrepancy — Eco workbook is probably missing some Bramshott gas MPRNs. Worth flagging during demo as "this is exactly the kind of insight the tool is designed to surface" rather than hiding it. Validation log captures it.
3. **Water + Waste tiles on site detail and heatmap show "missing".** Phase 0 had water + waste data, but Phase 1A UI doesn't wire them through to MetricTile / heatmap. 30 min job to add water.json + waste.json imports and re-derive status per site.

## What's NOT in this build (explicit non-goals per brief)

- Stippled UK map (took fallback)
- Real WLCA / embodied carbon
- Resident data via Sycous (RFI item B8 pending)
- Stark HH consumption data (Phase 2 ECPR)
- RFI status display on the UI (rfi_status.json is generated but not yet rendered)
- Pushing to main / Vercel deploy

## Data findings worth narrating during demo

- **3.89 GWh implied resident electricity** (arbnco total − Eco landlord) across the portfolio. This is the GHG Scope 3 Cat 13 gap.
- **82 high-consumption voids** = £49,134/year. Top three: Ledian Gardens (48 voids / £29k), Bramshott Place (21 / £12k), Durrants Village (3 / £5k). Durrants is the most striking — only 3 MPANs but ~6 MWh each.
- **Single-meter sites reconcile within 10%** between Eco and arbnco. Multi-meter sites (Bramshott in particular) are off, but the workbook's `Arbnco vs Eco Landlord` tab already has a "Match" / "Investigate" note — so the methodology to surface these is already in place.
- **Sonning Common and Edenbridge** have only Stark/development data — they appear correctly as missing across all the dashboards.

## Architecture summary for Q&A

- Pipeline reads 7 source workbooks (Phase 0: Site Overview, Arbnco, Water, Waste; Phase 1A: Ecotricity, RFI). Site Overview source has been removed since Phase 0 prep — pipeline falls back to cached Phase 0 JSON for that one (documented in build.py).
- 9 JSON outputs: sites, energy, water, waste, portfolio, electricity_monthly, mpan_register, reconciliation, rfi_status. All committed to git so Vercel always serves the latest.
- Validate.py runs after readers — currently flags 3 real data gaps as warnings.
- Vite + React 19 + Recharts 3 in `eir/`. Bundle 652 KB / 184 KB gzipped.
- Tiny custom router (no react-router dep). Vercel SPA rewrites already configured.

## Suggested 1-hour polish list (if Chris has time before demo)

1. Wire water + waste data into the heatmap and site detail tiles (30 min)
2. Add an RFI status panel to the Insights page (15 min) — `rfi_status.json` is ready
3. Try the stippled UK map (30-60 min — optional)
4. Polish copy on the Insights hero ("Where the data lives..." could be more punchy)
5. Verify Bramshott Place gas discrepancy with Chris's spreadsheet — might be fixable in the workbook before demo

## When you push

After verifying locally:
```
git push origin main
```

Vercel auto-deploys. The free tier handles the bundle size. Last Phase 0 deploy was at https://ivg-esg-tool.vercel.app/ — that URL takes the new build.

## Commits this session

Chunks 1–15, all committed locally to `main`. 14 commits total this session. Branch is ahead of `origin/main` by 14 commits, ready to push.
