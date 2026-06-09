# Brief 13 — Chart rendering fixes (two distinct root causes) + Carbon contrast

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Clears the three visual defects surfaced by the 24 May whole-tool review. Two of them are the analysis pages senior IVG contacts are most likely to open.
**Date opened:** 2026-05-24
**Mode:** Plough-through, no Chris checkpoints. Push at close. **Mandatory browser walkthrough on completion — every affected page, screenshot evidence.**

---

## Why this brief

The 24 May whole-tool review (repo pulled, built clean, real data confirmed) found the foundations sound but three visual defects live on client-facing pages. The Brief 12 ErrorBoundary catches *crashes* but does NOT catch a chart that renders-but-squashed — so these have been invisible to the green-build signal.

**Critical framing: the two "squashed chart" symptoms have TWO DIFFERENT root causes.** A single fix will only catch one. Both must be addressed explicitly or the brief fails its gate.

- **#1 Comparisons chart (Portfolio → Comparisons), App.jsx ~L436.** `<ResponsiveContainer width="100%" height="100%">` inside a `.page-noscroll` flex column. Percentage height only resolves if every ancestor resolves to a real pixel height. On this page the flex cascade does NOT fully close, so the chart collapses toward zero. **Root cause: unresolved percentage-height chain.**
- **#2 Reconciliation pie (Insights → Reconciliation), App.jsx ~L787.** `<ResponsiveContainer width="100%" height={320}>` — a *fixed* height — sitting in `.page-2col` which does not reserve vertical room for it, so it is clipped/squashed by its grid cell. **Root cause: fixed height in a grid cell with no reserved track height.** This is the OPPOSITE failure mode to #1.
- **#3 Carbon tab cream-on-cream readability (Site → Carbon).** The cream theme defines correct on-cream tokens (`--text-on-cream`, `--color-nza-cream` bg, navy headings) — the framework exists. Specific label/value elements are not picking up those tokens and render faded cream-on-cream. **Root cause: elements missing the on-cream text token, not a theme rebuild.**

---

## Reference

1. **NZA Development Bible** — Notion (CLAUDE.md / STATUS.md discipline, chunk PASS criteria, conventional commits, 15-min stuck rule).
2. This brief at `docs/briefs/active/13_chart_rendering_fixes.md`.
3. 24 May review findings (this document, Why-this-brief section).

---

## BEFORE DOING ANYTHING

0. **Reconciliation (Rule 8):** `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md` (no active brief, Brief 12 last), `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 **Land brief** at `docs/briefs/active/13_chart_rendering_fixes.md`, update `current.md`, quote title + Why-this-brief back. Commit `Brief 13 land: chart rendering fixes + Carbon contrast`.

1. **Reproduce all three defects in the browser FIRST, before touching code.** `cd eir && npm run dev`, open at 1440×900:
   - Portfolio → Comparisons: confirm the monthly comparison bar chart is collapsed/zero-height.
   - Insights → Reconciliation: confirm the "Where it sits" pie is clipped/squashed.
   - Site (any) → Carbon: confirm faded cream-on-cream labels.
   - **Screenshot each BEFORE state.** If any defect does NOT reproduce, log it and note in close — do not invent a fix for a non-defect.

2. **Confirm the CSS cascade for #1.** Read `.page-noscroll`, `.comp-chart-panel`, `.comp-chart-panel .panel-body` (index.css ~L1281–1296) and `Panel.jsx` `.panel-body`. Establish whether the chain from `.page-noscroll` down to the ResponsiveContainer has an unbroken resolvable height. It does not today — confirm where it breaks.

3. **Confirm the grid context for #2.** Read `.page-2col` and the Reconciliation page wrapper (App.jsx ~L700–790). Confirm the pie's parent grid cell does not reserve height for a 320px child.

---

## Scope statement

**In scope:**
- Fix #1 (Comparisons percentage-height chain) so the bar chart renders at full intended height with no scroll at 1440×900.
- Fix #2 (Reconciliation fixed-height pie in grid) so the pie renders fully without clipping.
- Fix #3 (Carbon cream-on-cream) so all labels/values meet legible contrast on the cream register.
- Add ONE falsifiability guard against regression (see Principles #4).

**Out of scope (log + continue):** any new data/pipeline work; the 3 pending HH MPANs (RFI item, not code); P03 waste workbook (Chris's call); Brief 10 Part 1 framer-motion reorder (separate pending); any new features. **No new tokens** — use existing ones.

---

## Operational mode

Plough-through. Each Part = one commit + STATUS/audit update. **Escalate (log + stop) for:** a fix that forces a new token or a structural rewrite of Panel/page grammar; no-scroll-at-1440×900 breaking unrecoverably; 15 min stuck + 3 approaches tried. Else keep going. Push at close.

---

## Principles

1. **Cream register, IVG fonts** unchanged — coral primary, navy text, Stolzl/Inter/IBM Plex Mono. Fix #3 uses existing on-cream tokens, introduces none.
2. **No-scroll at 1440×900 (Hard Rule 9)** on every page touched. The Comparisons fix must make the chart fill its space WITHOUT pushing the page into scroll.
3. **Prefer the minimal correct fix.** For #1 the correct pattern is a resolvable height chain (either give the chart container an explicit flex-basis/min-height that resolves, or switch the ResponsiveContainer to an explicit height that the noscroll layout can accommodate). For #2 the correct pattern is reserving the grid track height OR moving the pie to a container that resolves 320px. Do NOT "fix" #2 by copying the #1 approach — they are different bugs.
4. **Falsifiability guard.** ResponsiveContainer with `height="100%"` is only safe inside a fully-resolved height chain. Add a grep-able convention note in CLAUDE.md: any `height="100%"` ResponsiveContainer must sit under a parent with an explicit resolved height, documented inline. Grep new/edited files: `grep -rn 'height="100%"' eir/src` → every hit must have a resolvable parent (verified in walkthrough, not just grep).
5. **Browser-verify is the gate, not the build.** The build is already green and was green while these were broken. Green build ≠ pass. **AFTER state screenshots of all three pages are mandatory in the close report.**

---

## Parts

**Part 1 — #1 Comparisons percentage-height chain.** Fix the chain so the bar chart renders full-height. Verify no-scroll holds. Commit `Brief 13 Part 1: fix Comparisons chart height chain`.

**Part 2 — #2 Reconciliation fixed-height pie in grid.** Reserve/resolve the grid cell so the 320px pie renders unclipped. Commit `Brief 13 Part 2: fix Reconciliation pie grid clipping`.

**Part 3 — #3 Carbon cream-on-cream.** Apply existing on-cream text tokens to the faded labels/values. Commit `Brief 13 Part 3: Carbon tab on-cream contrast`.

**Part 4 — guard + walkthrough.** Add CLAUDE.md convention note (Principle 4). Full browser walkthrough at 1440×900 of ALL pages (not just the three — confirm no collateral regression, the Brief 6 lesson). Screenshot evidence. Commit `Brief 13 close: chart rendering fixes + walkthrough evidence`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all parts landed.
2. Comparisons bar chart renders at full intended height; no scroll at 1440×900. **AFTER screenshot.**
3. Reconciliation pie renders fully, unclipped. **AFTER screenshot.**
4. Carbon tab labels/values legible on cream. **AFTER screenshot.**
5. Both root causes named in close report and confirmed addressed *separately* (not one fix for both).
6. Full-tool walkthrough: every other page confirmed no collateral regression. List pages walked.
7. `grep -rn 'height="100%"' eir/src` hits enumerated, each confirmed under a resolved-height parent.
8. Build clean; CLAUDE.md convention note added.
9. Brief archived to `archive/13_chart_rendering_fixes_COMPLETED.md`; `current.md` repointed.
10. Known issues / anything deferred logged for next brief.
