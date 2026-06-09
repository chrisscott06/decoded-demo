# Brief 18 — Heating strategy matrix (real data, 5-column structure, inline detail panel)

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (3 Jun, after Brief 17 close)
**Status:** Active. Replaces the placeholder `<HeatingPanes />` matrix shipped in Brief 17 Amendment 2.
**Date opened:** 2026-06-03
**Mode:** Plough-through with **ONE Chris checkpoint** (after Part 1 = pipeline data correct). Push at close. Walkthrough at **1920×1080 + 1440×900**.

---

## Why this brief

Brief 17 Amendment 2 shipped `<HeatingPanes />` with **placeholder per-phase heating data fabricated by Claude Code**. The pipeline only carries site-level `primary_heating`; per-phase strategy was never sourced. This brief encodes the real per-phase data, corrects three site-level inaccuracies in the pipeline, restructures the matrix to the **VC P1 + Apt P1 + Apt P2 + Apt P3 + Apt P4** five-column layout, and adds the inline detail panel.

Per-phase data is operational fact, sourced from Chris (3 Jun). The matrix doubles as a structured ask back to IVG to confirm/correct via the "TBC" cells.

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 carries the grammar; do not respec.** This brief specifies component content + data + interaction only.
2. **STATUS.md** — full read at session start.
3. **Brief 17** (archived) — `HeatingPanes` exists at `eir/src/components/portfolio/PortfolioEnergy.jsx:935+` as the component to replace. Rule 11 inherited verbatim.
4. **Brief 14** — Map data-card pattern (hover row → click expands inline detail beside). This brief reuses that interaction grammar for the matrix.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (esp. Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/18_heating_strategy_matrix.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.5 **Land brief.** Place at `docs/briefs/active/18_heating_strategy_matrix.md`. Create `docs/audit/18_heating_strategy_matrix.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 18 land: heating strategy matrix`.

---

## The matrix data — canonical, per Chris (3 Jun)

**Five columns:** `VC P1 · Apt P1 · Apt P2 · Apt P3 · Apt P4`

The VC sits in Phase 1 only on every site that has a VC. Phases 2–4 are pure apartments.

**Three pipeline corrections required first (Part 1):**

| Site | Field | Current | Correct to |
|---|---|---|---|
| Ledian Gardens | `phasing.phases.length` | 4 | **3** (P1 = 72 units, P2 = 50, P3 = 40) |
| Sonning Common | `phasing.phases.length` | 4 | **2** |
| Millfield Green | `archetype.primary_heating` | `"ASHP (heat network)"` | **`"Individual GSHP"`** |
| Ampfield Meadows | `archetype.primary_heating` | `"GSHP (Kensa) + ASHP"` | **`"ASHP throughout"`** |

These corrections are sourced from Chris's clarification on 3 Jun. They are pipeline source-data corrections, not display overrides — fix the underlying field so all downstream tabs (Carbon, site pages) read the corrected value.

**Per-phase heating, all 13 sites:**

| Site | VC P1 | Apt P1 | Apt P2 | Apt P3 | Apt P4 | Notes |
|---|---|---|---|---|---|---|
| Austin Heath | CHP | CHP | CHP | CHP | CHP | Central gas + CHP heat network throughout |
| Gifford Lea | CHP | CHP | CHP | CHP | CHP | Central gas + CHP heat network throughout |
| Bramshott Place | Gas | Gas | ASHP | ASHP | ASHP | P1 gas boilers (VC + apts); ASHP from P2 |
| Ledian Gardens | Gas (HN) | Gas (HN) | ASHP | GSHP | — | P1 gas heat network; P2 ASHP; P3 GSHP; **no P4** |
| Elderswell | Hybrid (TBC) | Gas | Gas | Gas | Gas | VC: GSHP + CHP (Chris best read, TBC); apts: gas boilers throughout |
| Durrants Village | ASHP | ASHP | ASHP | ASHP | ASHP | Individual ASHP throughout |
| Millbrook Village | Hybrid | Hybrid | Hybrid | Hybrid | Hybrid | Pool gas + VC ASHP + individual apt ASHP — genuinely hybrid; detail in panel |
| Great Alne Park | ASHP | ASHP | ASHP | ASHP | ASHP | Individual ASHP throughout |
| Millfield Green | GSHP | GSHP | GSHP | GSHP | GSHP | Individual GSHP throughout (corrected from heat network) |
| Ampfield Meadows | ASHP | ASHP | ASHP | ASHP | ASHP | ASHP throughout (corrected from GSHP+ASHP) |
| Blendworth Hills | ASHP | ASHP | ASHP | ASHP | ASHP | Individual ASHP throughout |
| Sonning Common | GSHP | GSHP | GSHP | — | — | Individual GSHP; **only 2 phases**; out of GRESB FY25 scope |
| Edwalton Office | — | — | — | — | — | n/a (office, out of scope) |

**Display logic:**
- **Horizontal merging:** adjacent cells with the same strategy visually merge into one wider cell (`grid-column: span N`). E.g. Austin Heath = one wide "CHP" cell spanning all 5 columns. Bramshott = "Gas" spanning cols 1–2, "ASHP" spanning cols 3–5.
- **Dashed empty cell** where the phase doesn't exist (Ledian Apt P4, Sonning Common Apt P3 + P4, Edwalton everything). Visually distinct from a TBC cell — empty grey-outline.
- **TBC marker** on Elderswell VC P1 — coral-outlined cell with the existing "↺ confirm per-phase" treatment Claude Code already built. Doubles as an IVG ask.
- **GRESB-26 out-of-scope sites** (Sonning Common, Edwalton) render with the existing GRESB-26 darker-shade tokens from Rule 11. Same treatment as the Consumption chart's out-of-scope bars.

---

## Scope statement

**In scope:**
- Pipeline corrections (Part 1): phase counts for Ledian + Sonning Common; `primary_heating` for Millfield Green + Ampfield.
- New pipeline reader `pipeline/readers/build_heating_matrix.py` (or appropriate module) that emits per-phase heating data into `sites.json` as a new `heating_by_phase` block per site. Falsifiability: paste relevant JSON in close report.
- Replace placeholder `<HeatingPanes />` matrix with the 5-column data-driven version reading from `heating_by_phase` (Part 2).
- Inline detail panel pattern reusing Brief 14's Map-card grammar (Part 3): hover row highlights, click row expands inline detail panel beside the matrix (matrix shrinks to make room, not overlay/drawer).
- Hybrid icon: lucide `Flame + Zap` composite. Ship as-is; refinement deferred.

**Out of scope (log + continue):**
- Bespoke Hybrid icon SVG (use lucide composite for now).
- Updating the Carbon page / site-detail pages to consume `heating_by_phase` — that's downstream work for whichever brief touches those pages next.
- Confirming Elderswell's actual VC heating with IVG — Elderswell renders as Hybrid (TBC) which IS the IVG ask. Don't fabricate detail.
- Per-phase heating for sites we don't have data on at apartment level beyond "ASHP throughout" / "GSHP throughout" / etc — those are uniform-strategy sites, no per-phase data needed.

---

## Operational mode

Plough-through with ONE Chris checkpoint (end of Part 1, pipeline data correct). **Escalate (log + stop) for:**
- Pipeline corrections breaking downstream calculations (e.g. Ledian's 3-phase shift cascades to other tabs in ways that don't reconcile) — Part 1 checkpoint catches this; do not proceed to Part 2 until verified.
- The 5-column structure failing to render cleanly with the horizontal merging logic at narrow viewports — try at 1440×900 first; if it doesn't fit, surface.
- Per-Rule-11: container max-width or narrative-flex breaking when the matrix expands/contracts on detail-panel toggle — Rule 11 grammar holds, do not redesign.
- 15 min stuck + 3 approaches.

---

## Principles

1. **Real data, never fabricated.** The placeholder data in current `<HeatingPanes />` is replaced. Where data is uncertain (Elderswell VC), render the explicit TBC marker rather than committing to a guess.
2. **Pipeline source-of-truth.** Per-phase heating lives in `sites.json` via the new reader. Component reads from JSON, never hardcoded.
3. **Rule 11 inherits.** Same `--text-*` tokens, same combined-legend-filter pattern (filter pills above matrix), same GRESB-26 darker-shade treatment, same motion. Inline detail panel uses Brief 14's Map-card grammar.
4. **Horizontal merging is honest.** Adjacent identical cells merge visually. Don't draw four separate "CHP" cells when one wide cell tells the truth more cleanly.
5. **Browser-verify is the gate.** 1920×1080 primary walkthrough, 1440×900 graceful scale-down. AFTER screenshots mandatory.

---

## Parts

**Each Part: STATUS.md updated at start + end. Commit + push after PASS. Hard Rules 2, 3, 4 apply.**

### Part 1 — Pipeline corrections + new reader (CHECKPOINT)

- Apply the four pipeline corrections listed in the data table above. Source the corrections from Chris (3 Jun); cite in the commit body.
- Write `pipeline/readers/build_heating_matrix.py` (or appropriate module). The reader emits a `heating_by_phase` block per site with one entry per matrix cell:
  ```
  heating_by_phase: {
    vc_p1: { system: "CHP", confidence: "confirmed", note: null },
    apt_p1: { system: "CHP", confidence: "confirmed", note: null },
    apt_p2: { system: "CHP", confidence: "confirmed", note: null },
    apt_p3: { system: "CHP", confidence: "confirmed", note: null },
    apt_p4: { system: "CHP", confidence: "confirmed", note: null }
  }
  ```
- For Ledian (3 phases): `apt_p4 = null` (signals dashed-empty cell). For Sonning Common (2 phases): `apt_p3 = apt_p4 = null`. For Edwalton: all cells `null`.
- For Elderswell VC P1: `system = "Hybrid"`, `confidence = "TBC"`, `note = "Best read: GSHP + CHP at VC; gas boilers in apartments. Confirm with IVG operations."`
- For Millbrook: every cell `system = "Hybrid"`, `confidence = "confirmed"`, `note = "Pool gas + VC ASHP + individual apt ASHP."`
- Allowed `system` values: `CHP`, `Heat network (gas)`, `Heat network (ASHP)`, `Individual gas`, `Individual ASHP`, `Individual GSHP`, `Mixed`, `Hybrid`, `TBC`.

**Checkpoint:** push Part 1 + paste JSON inspection of:
- Ledian `phasing.phases.length === 3` + the 3 phase entries (72/50/40 units)
- Sonning Common `phasing.phases.length === 2`
- Millfield Green `archetype.primary_heating === "Individual GSHP"`
- Ampfield Meadows `archetype.primary_heating === "ASHP throughout"`
- Three example `heating_by_phase` blocks (one uniform site, one varied site, one with TBC)

**Stop here for Chris to confirm before Part 2.**

Commit `Brief 18 Part 1: pipeline corrections + heating_by_phase reader (CHECKPOINT)`.

### Part 2 — Matrix component swap (5-column, horizontal merging, GRESB-26)

- Replace placeholder data in `<HeatingPanes />` matrix with reads from `heating_by_phase`.
- Restructure to **5 columns**: VC P1 / Apt P1 / Apt P2 / Apt P3 / Apt P4. Update the column header row and grid template.
- Implement **horizontal merging** via `grid-column: span N` where adjacent cells have identical `system` value (and same `confidence`). E.g. Austin Heath = single "CHP" cell spanning 5 columns. Bramshott = "Gas" cell spanning cols 1–2, "ASHP" cell spanning cols 3–5.
- Dashed-empty cell rendering where `system === null` (Ledian P4, Sonning P3/P4, Edwalton).
- TBC cell rendering where `confidence === "TBC"` (Elderswell VC P1) — reuse the existing "↺ confirm per-phase" coral-italic marker from current `<HeatingPanes />`.
- GRESB-26 sites (Sonning Common, Edwalton) render with darker-shade tokens per Rule 11 (`--color-gresb26-*`). Sonning Common's filled cells use darker variants of the heating-strategy colours; Edwalton's all-dashed row uses darker grey.
- Hybrid icon: lucide composite `<Flame />` + `<Zap />` overlapped (small Zap top-right of Flame). Standardise to ~16px size to match the existing icon set.

Commit `Brief 18 Part 2: matrix component swap`.

### Part 3 — Inline detail panel + walkthrough + close

- Implement the inline detail panel using **Brief 14's Map-card pattern**:
  - Default state: matrix occupies the full graphic-pane width (~732px).
  - Hover any site row: row highlights (consistent with current matrix hover).
  - Click site row: matrix shrinks left (animate width with framer-motion `layout`), detail panel slides in on the right (~280px wide), showing:
    - Site name + icon (`--font-site`)
    - "Heating strategy" header
    - Per-phase breakdown: each phase listed with its `system` value and any `note`
    - Closing × in top-right of panel
  - Click site row again, or click ×, or click another site row: panel closes / switches.
- Detail panel respects Rule 11 type scale (`--text-subsection-title` for site name, `--text-body-small` for the per-phase list, `--text-caption` for notes).
- Walkthrough at 1920×1080 + 1440×900. Screenshots land in `docs/audit/18_heating_strategy_matrix.md`. Include: matrix default state, matrix with detail panel open on Ledian (most varied site), matrix with detail panel open on Elderswell (TBC site), matrix with detail panel open on Millbrook (Hybrid site).
- Falsifiability:
  - JSON inspection: `cat pipeline/dist/eir/sites.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['ledian-gardens']['heating_by_phase'])"` returns 4 entries with `apt_p4: null`.
  - Computed CSS values for matrix grid template, detail panel width, framer-motion layout transition.
  - `grep -n "fabricated\|placeholder\|TODO" eir/src/components/portfolio/PortfolioEnergy.jsx` — should return zero in the HeatingPanes region.
- **STATUS.md final update.**
- Brief archived to `archive/18_heating_strategy_matrix_COMPLETED.md`. `current.md` repointed.

Commit `Brief 18 close: heating matrix + detail panel`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 3 parts landed; Part 1 checkpoint approved by Chris before Part 2 began.
2. **Pipeline corrections live:** Ledian = 3 phases (72/50/40 units), Sonning Common = 2 phases, Millfield Green primary_heating = "Individual GSHP", Ampfield = "ASHP throughout". JSON inspection pasted.
3. **`heating_by_phase` reader functional:** populated for all 13 sites with the matrix data from this brief. Three example blocks pasted (one uniform, one varied, one TBC).
4. **5-column matrix structure** at 1920×1080: VC P1 / Apt P1 / Apt P2 / Apt P3 / Apt P4. **AFTER screenshot.**
5. **Horizontal merging functional:** Austin Heath = 1 cell spanning 5 cols; Bramshott = 2 cells (Gas span 1-2, ASHP span 3-5); Ledian = 4 cells (Gas span 1-2, ASHP 3, GSHP 4, empty 5); Elderswell = 2 cells (Hybrid-TBC col 1, Gas span 2-5). Pasted CSS grid-column values from devtools.
6. **Dashed-empty cells** render distinctly from TBC cells. Visible in screenshot for Ledian P4, Sonning P3/P4, Edwalton.
7. **TBC cell on Elderswell VC P1** renders with coral marker. Visible in screenshot.
8. **GRESB-26 darker-shade treatment** on Sonning Common + Edwalton rows. Visible in screenshot.
9. **Inline detail panel** working: open on Ledian + Elderswell + Millbrook. Matrix shrinks left, panel slides in right via framer-motion. **AFTER screenshot of each detail-panel state.**
10. **Rule 11 inheritance held:** computed CSS confirms container max-width 1280, narrative width (4-paragraph narrative still in 400-520 band), gutter 48, type tokens used throughout. Pasted values.
11. **No fabrication grep clean:** placeholder/TODO/fabricated markers absent from HeatingPanes region.
12. 1440×900 graceful scale-down verified.
13. No regression on Consumption / Power / Metering sub-tabs or other tool pages.
14. **STATUS.md start/end entries** for each Part. Audit doc populated.
15. Brief archived; current.md repointed.
16. Known issues / deferrals logged — explicitly: bespoke Hybrid icon SVG; Elderswell VC heating confirmation (IVG ask); downstream consumption of `heating_by_phase` by Carbon page and site-detail pages.
