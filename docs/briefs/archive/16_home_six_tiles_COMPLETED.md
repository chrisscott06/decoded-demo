# Brief 16 — Home page: six tiles, consistent shape, live numbers

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Small, tightly-scoped brief — the landing page only. Larger Portfolio restructure follows in Brief 17.
**Date opened:** 2026-05-25
**Mode:** Plough-through, no Chris checkpoints. Push at close. **Mandatory browser screenshot of the rendered tile grid in the close report.**

---

## Why this brief

The Home page currently shows four tiles (Electricity / Gas / Water / Waste) with inconsistent supporting copy — some say "landlord · utility meters", some say "billed · bulk meters", and each invents its own framing. Portfolio scale (13 sites · 217,314 m² · 961 units) sits as a small grey strip at the bottom; carbon is missing entirely. Chris wants the page rebuilt as **six tiles with a single consistent shape** so the reader compares substance, not framing.

**The consistency rule** — every tile has the same three-line silhouette:

1. Headline number + unit
2. One-line meaning (what the number is)
3. Coverage clause: `X of 13 sites · Y% data · [optional context]`

The Portfolio tile is the deliberate exception — it's the contextual anchor, not a measurement, so its third line carries scale rather than coverage.

"% data" here means **site coverage** for that commodity (sites with usable CY25 data ÷ 13). Granular meter-level data quality is a level deeper — that lives on the Portfolio thematic pages (Brief 17), not the tile.

---

## Reference

1. This brief at `docs/briefs/active/16_home_six_tiles.md`.
2. `eir/src/components/Landing.jsx` — the existing four-tile component. Current values hardcoded as constants from L89.
3. Live pipeline numbers (confirmed against `pipeline/dist/eir/portfolio.json`, `energy.json`, `water.json`, `carbon.json` on 25 May).

---

## BEFORE DOING ANYTHING

0. **Reconciliation:** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git status --short` clean, `git log --oneline -5` matches origin.

0.5 **Land brief** at `docs/briefs/active/16_home_six_tiles.md`, update `current.md`, quote title + Why-this-brief back. Commit `Brief 16 land: home six tiles`.

1. **Confirm inputs:**
   - `Landing.jsx` current tile structure (L89 onward) and the small grey "13 sites · 217,314 m²" strip at the bottom of the page.
   - Pipeline numbers ARE the source — derive each tile's headline from `pipeline/dist/eir/*.json`. Do not hardcode.
   - Icons drop-folder (Chris will share location — typically `eir/public/icons/home/` or `eir/src/assets/`).

---

## Scope statement

**In scope:**
- Replace the existing four-tile grid + bottom strip with a six-tile grid.
- Apply the consistent three-line shape across all six.
- Hook each tile's headline number, site count, and `% data` to live pipeline data (no hardcoded values).
- Place Chris-supplied icons next to each tile heading.
- Lay out as **2 rows × 3 columns** at 1440×900, with Portfolio tile top-left as anchor and Carbon bottom-right as punchline. No scroll.

**Out of scope (log + continue):** Portfolio nav restructure (Brief 17); thematic pages (Brief 17); any change to existing routes or the navigation strip itself; click-through interactions from tiles (Brief 17 will define those).

---

## The six tiles — exact copy

Each tile renders the headline value (computed from pipeline), unit, meaning line, and coverage line. Use the icons Chris provides.

| # | Headline | Unit | Meaning | Coverage line |
|---|----------|------|---------|---------------|
| 1 | **13** | sites | Retirement living | 217,314 m² GIA · 961 units |
| 2 | **8.3M** | kWh | IVG-billed electricity | 13 of 13 sites · 100% data · Ecotricity |
| 3 | **9.4M** | kWh | Heating fuel | 6 of 13 sites · 100% data |
| 4 | **17.9k** | m³ | Recorded consumption | 7 of 13 sites · 54% data · 10 water companies |
| 5 | **164** | t | Landfill diversion 99.9% | 12 of 13 sites · 100% data · BIFFA + Ash Waste |
| 6 | **2,450** | tCO₂e | Scope 1+2 inventory | 13 of 13 sites · Scope 3 in progress |

**Important — the values above are the truth-at-25-May.** Wire them from the pipeline so they update with the data (Carbon tile especially — its number will move as Scope 3 closes). The `% data` and `X of 13` fields likewise computed from the JSON, not hardcoded.

Site-count derivation rules (in case they're not in the JSON yet):
- **Electricity**: count sites where `energy.<site>.consumption_kwh.electricity` is non-null. Expect 13.
- **Gas**: count sites where `energy.<site>.consumption_kwh.gas` is non-null. Expect 6.
- **Water**: count sites where `water.<site>.consumption_m3` is non-null. Expect 7. `% data` = that count / 13.
- **Waste**: count sites with a non-null waste tonnage record. Expect 12.
- **Carbon**: 13 of 13 (Scope 1+2 is portfolio-wide).

---

## Operational mode

Plough-through. One commit per part. **Escalate (log + stop) for:** layout forcing the page below 1440×900 fold (scroll = fail); icon files not where expected; any tile's live number diverging from the table above by >2% (suggests pipeline drift — stop and flag to Chris before publishing a wrong number).

---

## Principles

1. **Same shape across all six** — number, meaning, coverage. The Portfolio tile is the only exception (anchor, not measurement) and uses the same silhouette with scale on the third line.
2. **Live numbers, not constants.** Each tile reads from `pipeline/dist/eir/*.json`. The current four hardcoded constants in `Landing.jsx` L89+ get removed.
3. **Icons next to headings, not standalone.** Each tile's icon sits inline with its heading row, not as a separate visual block.
4. **No scroll at 1440×900.** Six tiles in 2×3.
5. **Cream register, IVG fonts, existing tokens only.** No new fonts, no new colours. The Source Serif (`--font-site`) is NOT used here — these aren't site names.
6. **Browser-verify is the gate** (Brief 12/13/14/15 lesson). AFTER screenshot mandatory.

---

## Parts

**Part 1 — wire live numbers.** Replace the four hardcoded constants with derived values from `pipeline/dist/eir/*.json`. Add the two new (Portfolio, Carbon) data hooks. Commit `Brief 16 Part 1: live tile values from pipeline`.

**Part 2 — six-tile grid + consistent copy.** Replace the four-tile layout with 2×3; apply the exact copy from the table above; remove the old grey strip at the bottom. Commit `Brief 16 Part 2: six-tile grid with consistent shape`.

**Part 3 — icons.** Place Chris-supplied icons inline with tile headings; clean fallback (no broken glyph) if any icon is missing. Commit `Brief 16 Part 3: tile icons`.

**Part 4 — walkthrough.** Verify at 1440×900, no scroll, all six tiles legible, numbers match the table above (within 2%), icons present. Screenshot. Commit `Brief 16 close: home six tiles walkthrough`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all parts landed.
2. Six tiles render at 1440×900, no scroll. **AFTER screenshot.**
3. All six headline numbers match the table above (±2%); confirm each is computed from pipeline JSON, not hardcoded (paste the relevant code lines in the report).
4. Every tile has the three-line shape — number, meaning, coverage. Portfolio tile uses the same silhouette with scale on line 3.
5. Icons render inline with each tile heading; any missing icons have a clean fallback.
6. The old four-tile grid and the small grey portfolio strip at the bottom are gone (grep `4.5M\|7.6M\|17,939` returns no hits in `Landing.jsx`).
7. Build clean.
8. Brief archived; current.md repointed.
9. Known issues logged.
