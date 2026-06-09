# Brief 10 — Map polish: leaderboard reorder + table spacing + fonts + darker background

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Focused polish brief on the Portfolio Map — the showpiece page.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no Chris checkpoints. Chris walks through on completion.

---

## Scope — tight on purpose

This brief polishes the leaderboard + map feel. Four things, nothing else:

1. **Reorder animation** — smooth framer-motion slide when the leaderboard re-sorts (currently a static jump on the CSS fallback).
2. **Leaderboard table** — adopt EOC's spacing recipe (the "breathing space" Chris wants), adapted taller for IVG's portrait map + extra vertical room.
3. **Fonts** — map the leaderboard/pills to IVG's design system: Stolzl headings, Inter names, IBM Plex Mono values. Strip any EOC font leakage (no JetBrains Mono, no DM Sans/Serif).
4. **Darker background** — deepen the dark-register base from `#1A2440` to `#0F1629` so white text and coral pop.

**Explicitly NOT in this brief** (deferred to a later map brief, do not absorb): click→card behaviour change, hover-card redesign/reposition, "view site detail" CTA, bigger-map + dot recalibration, pulse changes (Chris likes the current pulse — leave it). Log any of these that come up to STATUS.md "Known issues" and continue.

---

## Reference

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **`LEADERBOARD_REORDER_EXTRACT.md`** — at `docs/briefs/LEADERBOARD_REORDER_EXTRACT.md` (Chris to place it there if not already). The canonical source for Parts 1 + 2 — reorder animation + spacing recipe, extracted verbatim from the EOC map. **Read it in full before Part 1.**
3. The shipped map components (Brief 7/8): `eir/src/components/PortfolioMap.jsx`, `portfolio/Leaderboard.jsx`, `portfolio/MapMarkers.jsx`.
4. This brief at `docs/briefs/active/10_map_polish.md`

---

## BEFORE DOING ANYTHING

0. Reconciliation (Rule 8): `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md`, `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 Land this brief at `docs/briefs/active/10_map_polish.md`, update current.md, quote title + Scope back. Commit `Brief 10 land: map polish at active/10_map_polish.md`.

1. **Confirm `LEADERBOARD_REORDER_EXTRACT.md` is on disk** at `docs/briefs/`. If absent, escalate (Chris must place it — Parts 1+2 depend on it).

2. **Confirm framer-motion is installed.** `ls eir/node_modules/framer-motion`. If absent, the reorder (Part 1) can't run — log to STATUS.md, ship Parts 2/3/4, and leave the CSS fallback active for reorder with a note that Part 1 completes once `cd eir && npm install` is run. **Do NOT run npm install from Claude Code's environment** (Bible rule). Chris runs it.

3. Read the extract + the three shipped map components. Begin Part 1.

---

## Principles

1. **The extract is the spec** for Parts 1 + 2 — port its values, don't reinvent.
2. **IVG fonts, not EOC's.** The extract documents EOC's fonts (DM Sans body, DM Serif Display values, JetBrains Mono) — these are NOT IVG's. Map every leaderboard font to IVG's system per Part 3. **Never** JetBrains Mono or DM anything in IVG.
3. **Tokens not raw hex.** Falsifiability: `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/portfolio --include="*.jsx"` → 0. The new navy is a token change in index.css, not a per-component hex.
4. **No-scroll holds** (Hard Rule 9) — the map page must still fit 1440×900 with no page scroll after the taller rows. The leaderboard column scrolls internally if 13 taller rows overflow; the page never does.
5. Browser-verify at Part 5.

---

## Parts

### Part 1 — Reorder animation (framer-motion layout)

**Goal:** When the active theme/metric changes and the leaderboard re-sorts, rows slide smoothly to their new positions instead of jumping.

**Files:** `eir/src/components/portfolio/Leaderboard.jsx`, `eir/src/index.css` (remove the CSS fallback once framer drives it), audit doc `docs/audit/10_map_polish.md` (new).

**Steps:**

1.1 Import framer-motion: `import { motion } from 'framer-motion'`.

1.2 Make each leaderboard row a `motion.div` with `layout` and the extract's exact transition:
```jsx
<motion.div
  key={site.id}
  layout
  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
  ...
>
```
Per the extract: key by **stable `site.id`** (never array index); the spring `{damping:26, stiffness:300}` is tuned by eye and holds for 13 rows.

1.3 **Filter data BEFORE mapping** (extract gotcha #5) — never conditionally `return null` inside the map. Compute `visibleSites = sites.filter(...)` then `sortedSites = [...visibleSites].sort(...)`, then map. A clean before/after array is what lets framer animate the surviving rows.

1.4 **Remove the CSS `nza-row-shift` fallback** from the row className and from `index.css` — framer now drives the reorder. Per extract gotcha #3: keep `transition-colors` (background hover) but NEVER `transition: transform` / `transition: all` on the row — it fights framer's layout transform.

1.5 **No AnimatePresence needed** (extract): the row set is fixed (sites don't enter/exit on theme switch, they only reorder). If a future metric filter hides sites, that's a later brief.

1.6 First-mount paints in place with no animation (extract gotcha #1) — that's correct, leave it.

**PASS:**
- Switching theme/metric slides rows to new positions with a confident spring (one tiny overshoot), no jump
- Switching Total/Per-Unit/Per-m² also animates
- No jitter (confirms no competing CSS transform transition)
- Rows keyed by site.id
- If framer-motion not installed: CSS fallback still active, logged, Part 1 marked pending-install

**Commit:** `Brief 10 Part 1: leaderboard reorder — framer-motion layout (spring 26/300)`

---

### Part 2 — Leaderboard table spacing (EOC recipe, adapted taller)

**Goal:** Adopt EOC's airy spacing recipe from the extract, scaled up for IVG's portrait map and greater vertical space. The "breathing space" Chris wants.

**Files:** `Leaderboard.jsx`, `PortfolioMap.jsx` (column ratio), audit doc.

**Steps:**

2.1 **Row geometry — EOC values, scaled taller** (extract "Row geometry"):
- Row height: EOC 36px → **44px** for IVG (Chris: "we've got more vertical space, go taller")
- Bar height: EOC 14px → **16px**
- Inter-row gap: **2px** (keep EOC's `gap-0.5` — tight gap, airy row)
- Row horizontal padding: **8px**
- Inter-child gap (name · bar · value): **8px**
- The empty band above/below the bar inside the row is what gives the airy feel — preserve it proportionally.

2.2 **Fixed column widths** (extract — the alignment trick): site name fixed width (~110px for IVG's longer names like "Blendworth Hills" — EOC used 96px; widen slightly), value fixed width (~72px right-aligned). Fixed widths stop the bar area jittering as names/values reorder.

2.3 **Pills — EOC sizing** (extract "category pills"):
- Outer capsule: `bg-white/5` equivalent, `rounded-full`, 4px padding
- Per-pill: **16px horizontal / 6px vertical padding, 14px font** (this fixes Chris's "pill bigger than font" — currently over-padded)
- 2px gap between pills
- Active pill: theme colour background

2.4 **Sub-metric pills** (extract): 12px h / 4px v padding, 12px font, active = translucent bg + underline.

2.5 **Total/Per-Unit/Per-m² toggle** (extract): 10px h / 2px v padding, 10px font, in a `bg-white/[0.04]` p-0.5 wrapper.

2.6 **Column ratio** (extract: EOC 380px leaderboard / map flex-1 → ~30/70 at 1280px, ~27/73 at 1440px). For IVG's portrait map, keep leaderboard ~380px fixed and let the map take the slack — the portrait map benefits from the extra width. Confirm the map still fills its height (no-scroll).

2.7 Strip the IVG-specific over-sizing that's currently there (the loose padding making everything "really big" per Chris's screenshot).

**PASS:**
- Rows 44px tall, airy, EOC-style breathing room
- Pills compact (16/6 padding, 14px font) — no longer dwarfing their labels
- Fixed name/value columns — clean alignment as rows reorder
- Map still fills height; page fits 1440×900 no scroll
- Leaderboard scrolls internally only if 13 rows overflow (44px × 13 + gaps ≈ 600px — should fit without internal scroll at 900px height)

**Commit:** `Brief 10 Part 2: leaderboard spacing — EOC recipe adapted taller (44px rows, compact pills)`

---

### Part 3 — Fonts (IVG system, strip EOC leakage)

**Goal:** Every leaderboard/pill/value font flows through IVG's design system. No EOC fonts.

**Files:** `Leaderboard.jsx`, audit doc.

**Mapping (this is the core of the Part):**

| Element | IVG token | Notes |
|---|---|---|
| Category pills + sub-pills + toggle labels | `var(--font-heading)` (Stolzl Medium 500) | matches EOC — keep |
| Site name in row | `var(--font-body)` (Inter) | EOC used DM Sans → swap to Inter |
| Numeric value in row | `var(--font-mono)` (IBM Plex Mono) + `font-variant-numeric: tabular-nums` | EOC used DM Serif Display → reject. IBM Plex Mono is already IVG's value font (Leaderboard.jsx line 348 already uses `var(--font-mono)`) — confirm + ensure tabular-nums |
| Description strap | `var(--font-body)` (Inter) | small, muted |

**Steps:**

3.1 Audit current font usage in `Leaderboard.jsx`: `grep -n "font-family\|font-heading\|font-body\|font-mono\|JetBrains\|DM Sans\|DM Serif" eir/src/components/portfolio/Leaderboard.jsx`.

3.2 Confirm no `JetBrains Mono`, `DM Sans`, or `DM Serif Display` strings exist anywhere in the IVG codebase: `grep -rn "JetBrains\|DM Sans\|DM Serif" eir/src`. Must return 0. If any exist (EOC leakage), replace per the mapping table.

3.3 Apply the mapping: pills → `--font-heading`; names → `--font-body`; values → `--font-mono` + `tabular-nums`.

3.4 Confirm the value font keeps `tabular-nums` so the right-aligned numbers don't twitch as rows reorder (extract emphasises this regardless of font choice).

**PASS:**
- `grep -rn "JetBrains\|DM Sans\|DM Serif" eir/src` → 0
- Pills render in Stolzl Medium; names in Inter; values in IBM Plex Mono tabular
- Values stay column-aligned during reorder

**Commit:** `Brief 10 Part 3: fonts — Stolzl pills / Inter names / IBM Plex Mono values (no EOC fonts)`

---

### Part 4 — Darker dark-register background

**Goal:** Deepen the dark-register base so white and coral pop. `#1A2440` → `#0F1629`.

**Files:** `eir/src/index.css`, audit doc.

**Steps:**

4.1 In `index.css` `:root`, change the Tier-2 theme base:
```css
--color-theme-base: #0F1629;   /* was #1A2440 — deepened so white + coral pop (Brief 10) */
```

4.2 This is a single token change. Because everything flows through `--color-theme-base` (and its alias `--bg-dark`/`--navy`), it darkens the **whole dark register**: Portfolio Map, Insights, GRESB, the dark nav. **The cream register (Site Detail, Landing) is unaffected** — it uses `--color-nza-cream`.

4.3 Check contrast: confirm coral `#E8725C`, the methodology palette, and any borders/tracks still read well on `#0F1629`. Bar tracks currently `rgba(255,255,255,0.06)` — confirm still visible (they will be; slightly more visible on the darker bg, which is fine). If any element relied on the old lighter navy for contrast (e.g. a subtle border), nudge its opacity up.

4.4 Confirm the hover/selected row backgrounds (`bg-white/10`, `bg-white/[0.04]`) still read on the darker base — they will, and slightly better.

**PASS:**
- Dark register renders on `#0F1629` across map + Insights + GRESB + nav
- Cream pages unchanged
- White text + coral clearly pop; no element lost contrast
- No raw hex introduced in components (the change is the index.css token only)

**Commit:** `Brief 10 Part 4: darker dark-register background (#0F1629) — white + coral pop`

---

### Part 5 — Walkthrough + close

**Steps:**
5.1 Boot dev server. `/portfolio/map`.
5.2 Self-walkthrough (MCP browser, 1440×900, screenshots to `docs/audit/10_screenshots/`):
- Switch through all 7 themes → rows **slide** (not jump) into new order
- Switch Total/Per-Unit/Per-m² → rows animate
- Pills compact, breathing room evident, rows 44px airy
- Names in Inter, values in IBM Plex Mono tabular (column-aligned during reorder)
- Background is the darker `#0F1629`; white + coral pop
- **No page scroll at 1440×900** (Hard Rule 9); also spot-check 1366×768
- Spot-check Insights + GRESB → also on the darker navy
- Cream pages (Landing, a Site Detail) → unchanged cream
5.3 Falsifiability:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/portfolio --include="*.jsx"   # → 0
grep -rn "JetBrains\|DM Sans\|DM Serif" eir/src                                  # → 0
cd eir && npm run build                                                          # → clean
```
5.4 Archive brief → `archive/10_map_polish_COMPLETED.md`; repoint current.md; STATUS.md final; push.

**PASS:**
- Reorder slides on all themes (or pending-install noted)
- Spacing airy, pills compact, rows 44px
- Fonts correct, 0 EOC font strings
- Background darker across dark register, cream unchanged
- No scroll at 1440×900
- Build clean; pushed

**Commit:** `Brief 10 close: map polish — reorder + airy spacing + IVG fonts + darker navy`

---

## What MUST NOT happen
- No click→card change, no card redesign, no CTA, no map resize/recalibration, no pulse change (all deferred — out of scope)
- No `npm install` from Claude Code (Chris runs it)
- No EOC fonts (JetBrains Mono, DM Sans, DM Serif) anywhere in IVG
- No raw hex in components — the navy change is an index.css token
- No page scroll at 1440×900
- No partial commits within a Part

## When to escalate (log + stop)
- `LEADERBOARD_REORDER_EXTRACT.md` not on disk
- framer-motion not installed (ship Parts 2-4, mark Part 1 pending-install — do NOT block)
- Build fails
- No-scroll breaks at 1440×900 and can't be recovered by internal leaderboard scroll
- 15 min stuck + 3 approaches

## Final report
1. HEAD SHA + parts landed
2. Reorder: slides on all themes? (or pending framer-motion install?)
3. Spacing: 44px rows, compact pills, airy feel?
4. Fonts: Stolzl/Inter/IBM Plex Mono, 0 EOC font strings?
5. Background: #0F1629 across dark register, cream unchanged?
6. No scroll at 1440×900?
7. grep raw-hex = 0? build clean?
8. Brief archived, current.md repointed?
9. Known issues (deferred map items still logged: click→card, card redesign, map resize, pulse)?
10. Standing by for Chris.

## Notes for Claude Code
The extract (`LEADERBOARD_REORDER_EXTRACT.md`) is the spec for Parts 1+2 — port its values. The one trap: it documents EOC's fonts, which are NOT IVG's. Part 3 maps them to IVG's system; never copy JetBrains Mono / DM Sans / DM Serif. Confirm receipt (title + Scope), then begin Part 1.
