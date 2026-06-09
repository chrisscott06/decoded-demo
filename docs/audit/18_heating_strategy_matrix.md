# Audit — Brief 18 (Heating strategy matrix) close

**Closed:** 2026-06-03
**Brief:** `docs/briefs/active/18_heating_strategy_matrix.md` (Parts 1–3 + 2.5 prep)
**Status:** PASS on all 16 criteria. Brief archived. `current.md` repointed.

---

## Scope as built

Replaces the placeholder `<HeatingPanes />` matrix shipped in Brief 17 Amendment 2 with a 5-column data-driven matrix sourced from real per-phase heating decisions (Chris, 3 Jun). Three Parts:

- **Part 1** — pipeline corrections (Ledian phase count 4→3 with 72/50/40 units, Sonning Common 4→2, Millfield Green `primary_heating` → `"Individual GSHP"`, Ampfield Meadows → `"ASHP throughout"`) + new `pipeline/readers/build_heating_matrix.py` reader emitting a `heating_by_phase` block per site. CHECKPOINT — approved by Chris before Part 2.
- **Part 2 (prep)** — bespoke Hybrid icon at `eir/public/icons/ivg-nza-icons_hybrid.svg` composed from the existing gas + electricity SVGs at 0.55× scale, side-by-side. Stays in the NZA icon family (Chris ask).
- **Part 2** — `<HeatingPanes />` swapped. 5-column matrix (VC P1 / Apt P1 / Apt P2 / Apt P3 / Apt P4). Horizontal merging via `grid-column: span N` for adjacent identical `(system, confidence)` cells. Dashed-empty for null phases. Dashed coral for TBC (Elderswell VC P1). GRESB-26 sites get the `color-mix(base 30%, #000 35%)` darker shade.
- **Part 2 (Chris ask, 3 Jun)** — drop the legend (matrix is self-describing); pill label `"CHP"` → `"Gas + CHP"`; per-cell fuel-type icon (gas / electricity / hybrid) via mask-image; border style encodes individual vs communal (solid vs dotted); cell height 28 → 36.
- **Part 3** — inline detail panel via Brief 14 Map-card pattern. Click a row → matrix shrinks left (728 → 432 px) via framer-motion `layout`; 280 px panel slides in right via `AnimatePresence`. Panel shows site name + icon, "Heating strategy" header, per-phase breakdown with the same icon + border encoding as the matrix, any TBC notes, and the "N later phases not in plan" notice for partial-row sites.

---

## PASS criteria — evidence

### 1. HEAD SHA + all 3 parts landed; Part 1 checkpoint approved before Part 2

Commits in order:
- `14f9d60` Brief 18 land
- `1e14084` Brief 18 Part 1 (CHECKPOINT) — pushed, Chris approved before proceeding
- `0128988` Brief 18 Part 2 (prep): hybrid icon
- `f4f7740` Brief 18 Part 2: matrix component swap
- `<this commit>` Brief 18 Part 3 + close

### 2. Pipeline corrections live (JSON inspection)

From `pipeline/dist/eir/sites.json`:

```
ledian-gardens.phasing.phases.length        = 3
  [{P1, 72 units, year 1}, {P2, 50 units, year 5}, {P3, 40 units, year 9}]
ledian-gardens.phasing.total_units_planned  = 162
sonning-common.phasing.phases.length        = 2
millfield-green.archetype.primary_heating   = "Individual GSHP"
ampfield-meadows.archetype.primary_heating  = "ASHP throughout"
```

### 3. `heating_by_phase` reader functional — all 13 sites populated

Three representative blocks:

**Austin Heath** (uniform CHP — all 5 slots identical):
```
vc_p1, apt_p1, apt_p2, apt_p3, apt_p4 → {system: "CHP", confidence: "confirmed", note: null}
```

**Ledian Gardens** (varied — 3-phase, no P4):
```
vc_p1:  {system: "Heat network (gas)", confidence: "confirmed", note: null}
apt_p1: {system: "Heat network (gas)", confidence: "confirmed", note: null}
apt_p2: {system: "Individual ASHP",    confidence: "confirmed", note: null}
apt_p3: {system: "Individual GSHP",    confidence: "confirmed", note: null}
apt_p4: {system: null,                 confidence: null,        note: null}
```

**Elderswell** (TBC at VC):
```
vc_p1:  {system: "Hybrid",         confidence: "TBC",
         note: "Best read: GSHP + CHP at VC; gas boilers in apartments. Confirm with IVG operations."}
apt_p1..apt_p4: {system: "Individual gas", confidence: "confirmed", note: null}
```

### 4. 5-column matrix at 1920×1080

Columns: **VC P1 / Apt P1 / Apt P2 / Apt P3 / Apt P4**. Grid template `180px repeat(5, minmax(0, 1fr))` shared by header + body rows; column tracks align vertically.

### 5. Horizontal merging functional — RLE span counts (live DOM eval, 1920×1080)

| Span | Count | Sites |
|---|---|---|
| 5 | 9 | Austin Heath, Gifford Lea (Gas + CHP); Durrants, Great Alne, Ampfield, Blendworth (ASHP); Millbrook (Hybrid); Millfield (GSHP); Edwalton (all null) |
| 4 | 1 | Elderswell apts P1–P4 (Individual gas) |
| 3 | 2 | Bramshott apts P2–P4 (ASHP); Sonning VC P1 + apt P1–P2 (GSHP) |
| 2 | 3 | Bramshott VC P1 + apt P1 (Gas); Ledian VC P1 + apt P1 (Heat network gas); Sonning apt P3–P4 (null) |
| 1 | 4 | Ledian apt P2 (ASHP), apt P3 (GSHP), apt P4 (null); Elderswell VC P1 (Hybrid TBC) |
| **Total** | **19** | spanned matrix cells |

Plus 6 header cells + 13 site label cells = 38 grid children. **Matches DOM count exactly.**

### 6. Dashed-empty distinct from TBC (live DOM eval)

Cell border-style + width sample:

| Cell | border-style | border-width |
|---|---|---|
| Gas + CHP (communal) | `dotted` | 2 px |
| Gas HN (communal) | `dotted` | 2 px |
| Hybrid (communal) | `dotted` | 2 px |
| Gas, ASHP, GSHP (individual) | `solid` | 1 px |
| ↺ Hybrid TBC | `dashed` | 1 px (coral) |
| — (null) | `dashed` | 1 px (grey) |

Four states distinct. Three border styles (solid / dotted / dashed) × two colour treatments (system colour vs coral vs grey).

### 7. TBC marker on Elderswell VC P1

Renders dashed coral border + coral italic text with rotate marker (`↺`) + Hybrid icon + label. Verified in-session — row 5 first column shows the dashed coral pill against the otherwise-filled apartments-gas run.

### 8. GRESB-26 darker-shade treatment on Sonning Common + Edwalton

Live colour sample at 1920×1080:
- Ledian GSHP cell (in-scope): `background: srgb(0.486, 0.769, 0.439 / 0.3)`; border: same hue at /0.6.
- Sonning Common GSHP cell (OOS): `background: srgb(0.224, 0.355, 0.203 / 0.65)`; border: same hue at /0.9.

`color-mix(in srgb, base 30%, #000 35%)` applied to OOS rows. Edwalton's all-null row renders dashed-grey at row opacity 0.55. Visible in screenshots.

### 9. Inline detail panel — Ledian, Elderswell, Millbrook

Live measurement at 1920×1080 (Ledian selected):

```
matrix width default = 728 px
matrix width with panel = 432 px
panel width = 280 px
panel height = 876 px
```

framer-motion `layout` on the matrix wrapper + `AnimatePresence` on the panel deliver a 0.28 s width/opacity transition (`cubic-bezier(0.4, 0, 0.2, 1)` standard easing). Click another row → smooth switch (`AnimatePresence` with `key={selectedRow.id}`). Click × or the selected row again → panel exits.

In-session walkthrough captured all four states (default + 3 detail-panel opens) plus the 1440 graceful at the same width geometry. Per-state DOM eval results:

- **Default** (no selection): matrix 728 px wide; no panel rendered.
- **Ledian** (`phaseLabels: ['VC P1','Apt P1','Apt P2','Apt P3']`): matrix 432, panel 280, panel text contains "Heat network (gas)", "Individual ASHP", "Individual GSHP", "not in plan" notice for the missing Apt P4. Selected row has coral left-border highlight and coral-tinted bg.
- **Elderswell**: panel renders TBC VC P1 with coral italic "↺ Hybrid" + IVG-confirm note in caption; remaining four phases as solid Individual gas.
- **Millbrook**: panel renders five Hybrid phases (dotted border per communal kind) with the "Pool gas + VC ASHP + individual apt ASHP." note repeated.
- **1440×900**: container x=80, matrix 432 with panel open, panel 280, panel height 696 (viewport floor). All states render under the same envelope as 1920.

### 10. Rule 11 inheritance held

Computed at 1920×1080:
- `.thematic-page-container` width = 1280, x = 320 ✓
- Narrative pane width = 500, x = 320; gutter 48; graphic pane width = 732, x = 868 ✓
- Subsection h3 = 17.71 px DM Serif Display coral ✓
- Body p = 13.29 px (`--text-body-small`) ✓

Computed at 1440×900:
- Container width = 1280, x = 80 (breathing rule satisfied) ✓
- Matrix width default = 728; with detail panel = 432 ✓
- Panel width = 280 ✓

### 11. No fabrication grep clean

```
grep -nE 'fabricated|placeholder|TODO' eir/src/components/portfolio/PortfolioEnergy.jsx | wc -l = 0
```

(In the HeatingPanes region. Other regions unaffected.)

### 12. 1440×900 graceful scale-down

Container collapses to x=80 (breathing rule); matrix + panel keep their widths. Type tokens hit clamp() min. Detail panel renders identically.

### 13. No regression on other sub-tabs / pages

Build clean (1.55 s). Consumption / Power / Metering / other thematic pages unaffected — the only file touched in Part 2 + Part 3 is `PortfolioEnergy.jsx`, and only the HeatingPanes region.

### 14. STATUS.md start/end entries for each Part

Brief 18 START, Part 0.5 END, Part 1 END (CHECKPOINT), Part 2 prep END, Part 2 END, Part 3 + close END entries all in STATUS.md.

### 15. Brief archived; current.md repointed

`docs/briefs/active/18_heating_strategy_matrix.md` → `docs/briefs/archive/18_heating_strategy_matrix_COMPLETED.md`. `docs/briefs/current.md` updated.

### 16. Known issues / deferrals logged

- **Elderswell VC P1 heating** — TBC; renders the IVG ask in the matrix + detail panel. Awaiting confirmation from IVG operations.
- **Ledian total mismatch** — `phasing.total_units_planned` = 162 (sum of phase units); `identity.total_units` = 115 (current head count). Read as "115 complete of 162 planned" until/unless Chris asks for `identity.total_units` to move.
- **Downstream consumption of `heating_by_phase`** — Carbon page and site-detail pages don't yet read this block. Future briefs.

---

## Verdict

PASS on all 16 criteria. Brief 18 closes. PortfolioEnergy.jsx heating sub-tab is now data-driven, falsifiable per phase, and self-describing via the cell encoding (icon = fuel; colour = system; border = individual vs communal; dashed = TBC or null).
