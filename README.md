# IVG ESG Tool

Digital reporting platform for Inspired Villages Group's GRESB submission and GHG inventory.

## Status

Phase 0 — pipeline + minimal shell. See `STATUS.md` for current state.

## Local development

Pipeline:

```
cd pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python build.py
```

Shell:

```
cd eir
npm install
npm run dev
```

## Sections

### GRESB Visualisation Module

The `/gresb` chapter is the central source of truth for IVG's GRESB submission. Three sub-tabs replace the slide-deck-and-email cycle:

- **Overview** — five-section explainer narrative (What is GRESB · How it's scored · Last year · This year · What this tool does — Brief 13 v1.4.2) on the left; on the right, a 2025 Result card and a simplified 2026 Forecast card. The forecast card surfaces ONE bold TARGET 62 tick on the star quintile band — no competing inline markers. Below the bar, a horizontal range arrow runs Defendable → Stretch with endpoint values (45 / 65), replacing the prior 3-column legend strip. A single italic caption beneath links through to the Aspects page where the 17-point climb is broken down.
- **Aspects** — Molson-pattern accordion covering all 68 indicators across Management / Performance / Residential. Per-aspect colour theming; per-indicator 4-panel detail (What it means · Last year · What we need to do · Evidence required). Eight visual enhancements light up conditionally on JSON content: panel-header lucide icons, verdict banners with auto-extracted validator quotes, GRESB-tracked-issues chip grids, numbered action checklists, document-type icons (13 evidence types), "Changed for 2026" amber banners, inline peer-comparison bars, owner/confidence/last-updated metadata footers. Non-scored / retired / parked cards expand on click and surface explainer content rather than being locked. **Brief 13 v1.4.3 — Path to Max:** every action-needed and substantive defending indicator now shows a "PATH TO MAX" subsection at the bottom of the Last Year panel — separated by a 1 px rule, aspect-coloured label, a one-line realistic-cycle summary (`gapToMaxSummary`), and a markdown-flavoured detail paragraph (`gapToMaxDetail`). 18 additional indicators carry verbatim 2025 portal narratives in `whatLastYearSubmitted`. Reader doesn't need to open the GRESB portal or any other document.
- **Forward planning** — text-left / graphic-right pane (Brief 13 v1.4.3 redesign). Narrative on the left; on the right, three segmented cycle cards (2026 / 2027 / 2028) above a thin animated progress bar with star-tier markers; clicking a cycle spring-animates the fill from 0 to the selected target and swaps the bar colour (coral / teal / green). Below the bar, a scrollable "WHAT LANDS IN {cycle}" panel lists the per-cycle delta items with aspect-coloured dots and the per-item point contribution. 5-star caveat panel and "not pursuing" pills sit as a bottom strip below the 2-col body.

Data source: `eir/src/data/gresb.json` (v1.4.3, P09 SH-2000 tracker — defendable 45 / target 62 / achievable 62 / stretch 65 / target 2-star, with the v1.4.2 Overview explainer narrative, `forecast2026Card` caption, and v1.4.3 `gapToMaxSummary` / `gapToMaxDetail` on every action-needed indicator + 18 additional verbatim 2025 narratives).

## Documentation

- `CLAUDE.md` — project rules and structure
- `STATUS.md` — running log
- `docs/briefs/` — working briefs (gitignored)
