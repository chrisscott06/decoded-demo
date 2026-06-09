# Audit — Brief 20 (BR-13 GRESB Visualisation Module Phase 1)

**Status:** Pending — populated at brief close.

Brief at `docs/briefs/active/20_BR13_gresb_phase1.md`. Authored as "Brief 13 — GRESB Visualisation Module" by the brief author; filed as Brief 20 locally because Brief 13 already exists in this repo (chart-rendering fixes, chunks 78–82).

**Scope (Phase 1 only — Phases 2 + 3 stubbed in brief for context):**
- Static visualisation layer reading from `eir/src/data/gresb.json`
- Top-level GRESB section in primary nav (peer to Portfolio / Site / Insights)
- 4 sub-tabs per late update: Overview · Aspects · Dependencies · Forward planning
- Per-aspect drill-in `/gresb/aspects/:code` (15 aspects)
- Per-dependency drill-in `/gresb/dependencies/:code` (4 CDs)
- Component library: IndicatorBadge / AspectBadge / StatusPill / ConfidencePill / StarRating / ScoreRangeBar / ProgressMiniBar / RetiredBadge / ParkedBadge
- Visual style guide per brief Appendix B (GRESB-inspired teal palette, monospace for codes, card-first layout)
- Hard Rule 9 spirit — home page targets 1440×900 single-view; drill-ins allowed to scroll
- Process Rule 10 — browser walkthrough at desktop (1440×900) + mobile (375×667) mandatory before close

**Out of scope (Phases 2 + 3, explicitly):**
- Live data pipeline from SH-2000 .xlsx → JSON (Phase 2, future Brief 21+)
- Action queue + evidence vault + status workflow (Phase 3)

**Tasks (7):**
1. /gresb routes + JSON + top-nav entry — **in progress**
2. Component library — atomic pieces
3. /gresb/overview home (6 elements)
4. /gresb/aspects/:code drill-in
5. /gresb/dependencies/:code drill-in
6. Mobile responsiveness (375×667 walkthrough)
7. README update

**Source:** `eir/src/data/gresb.json` — populated from P09 SH-2000 tracker; meta.lastUpdated 2026-06-04.

PASS evidence to be added per task at close.
