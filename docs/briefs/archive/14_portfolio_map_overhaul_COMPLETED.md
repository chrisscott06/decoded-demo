# Brief 14 — Portfolio map overhaul: alignment, reorder, icons, interaction, site-name serif

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Reworks the Portfolio → Map view — the first thing anyone clicks after Home. Fixes dot alignment, restores the EOC reorder, adds site icons, redesigns the click interaction so it no longer ejects the user into a site page, and introduces ONE scoped editorial serif for site names.
**Date opened:** 2026-05-24
**Mode:** Plough-through, no Chris checkpoints, EXCEPT one mandatory checkpoint in Part 1 (the dot calibration — see Part 1). Push at close. **Mandatory browser walkthrough on completion — screenshot evidence of every changed behaviour.**

---

## Why this brief

From the 24 May rendered-tool review (Chris walking the live app, screenshots). Six defects/asks on the Map view, all confirmed against HEAD `888764c`:

1. **Dot alignment is wrong.** Markers are positioned by hand-tuned percentages in `eir/src/lib/projection.js` (`SITE_POSITIONS`), nudged by eye in Brief 7. They don't sit on their real UK locations. **Real lat/lon exists for all 13 sites** in `pipeline/site_coordinates.json` and the dotted-map SVG bounding box is documented in `projection.js` (lat 50.4–53.4, lon -3.8–1.0, viewBox 0 0 1409.97 2548.17). Project from real coordinates to get them roughly right in ONE pass, then fine-tune by eye.
2. **Leaderboard reorder is a fade, not a slide.** The list remounts on metric change (React `key` changes) and plays a one-shot entry animation, so rows cross-fade instead of physically moving. Chris wants the EOC behaviour: a site that's top for Water and bottom for Waste visibly *slides* down when you switch metric. **framer-motion `^12.38.0` is already installed.** This is the pending "Brief 10 Part 1" item — absorb it here.
3. **No site icons.** Each `eir/public/sites/<id>/` folder has an `icon.svg` (12 sites locally; Edwalton office uses the Inspired Villages logo lockup already in the tool). Put the icon next to each site name in the Leaderboard (and the redesigned card). Icons are Illustrator-exported SVGs carrying editor cruft — optimise with SVGO first.
4. **Click ejects the user.** Both marker and Leaderboard row currently call `go(siteId)` → immediate navigate to `/site/<id>/overview` (`PortfolioMap.jsx` `go()` ~L216; `MapMarkers.jsx` L231; `Leaderboard.jsx` L231). Chris does NOT want a bare click to leave the Portfolio section.
5. **Card is bland + has a bug.** The hover card (`SiteHoverCard.jsx`) duplicates the energy line ("3.1M kWh total energy" / "3.1M kWh Total energy"). Redesign it and fix the duplicate.
6. **Site names want an editorial serif.** No serif currently in the design system (DM Serif was removed in Brief 10 P3 as unscoped leakage). Add ONE — **Source Serif 4** — scoped STRICTLY to site/village names. Free, self-hosted like Stolzl, no licence question.

**The new interaction (Chris's exact spec):** Hover = highlight on the map only. Click = the data card appears. The card carries an explicit **"View site →"** affordance. Only that explicit action navigates. Bare clicking never leaves the Portfolio section — leaving is a deliberate choice.

---

## Reference

1. **NZA Development Bible** — Notion. CLAUDE.md Process Rule 10 (ResponsiveContainer height convention) applies if any chart is touched.
2. This brief at `docs/briefs/active/14_portfolio_map_overhaul.md`.
3. `docs/audit/07_portfolio_map.md` — the original calibrated-table approach for dot positions (superseded by the projection method here, but useful context).
4. 24 May review findings (this Why-this-brief section).

---

## BEFORE DOING ANYTHING

0. **Reconciliation (Rule 8):** `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md` (no active brief, Brief 13 last), `tail -20 STATUS.md`, `git log --oneline -8`, `git status --short` clean.

0.5 **Land brief** at `docs/briefs/active/14_portfolio_map_overhaul.md`, update `current.md` (and clear the now-absorbed Brief 10 Part 1 follow-up). Quote title + Why-this-brief back. Commit `Brief 14 land: portfolio map overhaul`.

1. **Confirm the inputs before coding:**
   - `pipeline/site_coordinates.json` — 13 real sites + 2 dev. lat/lon present.
   - `eir/src/lib/projection.js` — current `SITE_POSITIONS` (the hand-tuned %s to be replaced) + documented SVG bounding box.
   - `ls eir/public/sites/*/icon.svg` — confirm count (expect 12; note any missing; Edwalton uses IVG logo).
   - `eir/src/components/portfolio/Leaderboard.jsx` — reorder mechanism (the remounting `key` ~L155, the `animation: nza-row-shift` ~L162).
   - `eir/src/components/portfolio/SiteHoverCard.jsx` — the duplicate energy line.
   - `eir/src/components/portfolio/MapMarkers.jsx` + `PortfolioMap.jsx` `go()` — the current click→navigate path.
   - Confirm framer-motion present: `grep framer-motion eir/package.json` + `ls eir/node_modules/framer-motion`.

---

## Scope statement

**In scope:**
- **Part 1** — replace hand-tuned `SITE_POSITIONS` with a projection from real lat/lon against the documented SVG bounding box; produce a fresh position table; ONE Chris checkpoint to fine-tune the handful that sit slightly off.
- **Part 2** — framer-motion `layout` reorder: rows keyed by stable `site.id`, physically sliding to new positions on metric change (replaces remount-and-fade). Respects the disabled-bar-animation context from Brief 13 (this is layout animation on DOM rows, not Recharts).
- **Part 3** — SVGO-optimise the site icons; render `icon.svg` next to each site name in the Leaderboard + redesigned card; Edwalton uses the IVG logo lockup.
- **Part 4** — interaction redesign: hover = map highlight only; click = card appears; card carries "View site →" as the ONLY navigation path. Remove the bare-click→navigate from marker + row. Redesign `SiteHoverCard` (fix the duplicate energy line; lift it visually from its current bland state).
- **Part 5** — add Source Serif 4 (self-hosted, @font-face like Stolzl), scoped to site/village names ONLY via a single new token/role; full 1440×900 walkthrough + screenshots.

**Out of scope (log + continue):** the 3 pending HH MPANs (RFI item, not code); P03 waste workbook (Chris's call); any pipeline data change beyond reading `site_coordinates.json`; the Carbon/chart work (done in Brief 13); the SITE PAGE itself (separate brief — the card redesign here must NOT pre-empt site-page decisions; keep the card a summary, not a mini-page).

---

## Operational mode

Plough-through, with ONE checkpoint (Part 1 dot calibration — stop, show Chris the projected positions on a screenshot, take nudge instructions, then continue). **Escalate (log + stop) for:** projection maths producing dots clearly off the landmass (suggests bounding-box mismatch — stop and show Chris); framer-motion layout animation fighting the existing CSS; Source Serif bleeding beyond site names; no-scroll-at-1440×900 breaking; 15 min stuck + 3 approaches. Else keep going.

---

## Principles

1. **Cream register, IVG fonts.** Source Serif is the FOURTH family, with exactly ONE job (site names). It must not appear anywhere else. Falsifiability: after Part 5, `grep -rn "Source Serif\|font-serif\|--font-site" eir/src` — every hit must be a site-name render. Any other usage = fail.
2. **Projection, then calibration.** Part 1 gets dots *roughly* right by maths (one pass, all 13), THEN Chris fine-tunes. Do not hand-nudge from scratch — that's the method that drifted last time. Keep the projection function so positions are reproducible, with a documented per-site offset table for the eyeball corrections.
3. **The click contract is sacred (defect #4).** After this brief, NO path from the Map view navigates away except the explicit "View site →" on the card. Verify by clicking every marker and every row in the walkthrough — none may change route on their own.
4. **Honest fallback.** Any site missing an `icon.svg` shows a clean default mark or the bare name — never a broken-image glyph. Edwalton = IVG logo.
5. **Card stays a summary.** It is NOT the site page and must not grow into one. It summarises across metrics + offers the door out. Site-page redesign is a separate brief.
6. **Browser-verify is the gate, not the build** (Brief 12/13 lesson, now Process Rule 10-adjacent). Green build ≠ pass. AFTER screenshots mandatory: dots aligned, a reorder mid-slide, icons in rows, the card on click, "View site →" working, a bare click NOT navigating.

---

## Parts

**Part 1 — dot alignment (CHECKPOINT).** Write the projection (equirectangular, the documented bounding box), regenerate `SITE_POSITIONS`, render, screenshot, **stop and show Chris**, apply nudge instructions, commit `Brief 14 Part 1: project map dots from real coordinates + calibration`.

**Part 2 — reorder slide.** framer-motion `layout` rows, stable `site.id` keys, remove the remount `key` + `nza-row-shift`. Commit `Brief 14 Part 2: framer-motion leaderboard reorder`.

**Part 3 — icons.** SVGO pass; icons in Leaderboard rows + card; Edwalton IVG logo; fallback. Commit `Brief 14 Part 3: site icons in leaderboard + card`.

**Part 4 — interaction + card redesign.** Hover=highlight; click=card; "View site →" sole nav; remove bare-click nav; redesign card + fix duplicate energy line. Commit `Brief 14 Part 4: hover/click/card interaction + card redesign`.

**Part 5 — serif + walkthrough.** Source Serif 4 @font-face, scoped to site names; full walkthrough + screenshots. Commit `Brief 14 close: site-name serif + walkthrough evidence`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all parts landed.
2. All 13 dots sit on their real UK locations (post-calibration). Projection function retained + offset table documented. **AFTER screenshot.**
3. Leaderboard rows physically slide on metric change (not fade). **AFTER screenshot mid-transition or description of the motion.**
4. Site icons render next to every site name; Edwalton = IVG logo; no broken glyphs; SVGO applied. **AFTER screenshot.**
5. Hover highlights map only; click shows card; "View site →" is the ONLY route out; bare click on marker AND row does NOT navigate (both verified). **AFTER screenshots.**
6. Card redesigned; duplicate energy line gone. **AFTER screenshot.**
7. Source Serif on site names ONLY; grep confirms no leakage.
8. No scroll at 1440×900 on the Map view; full-tool walkthrough confirms no collateral regression (list routes).
9. Build clean.
10. Brief archived to `archive/14_portfolio_map_overhaul_COMPLETED.md`; current.md repointed; Brief 10 Part 1 follow-up cleared as absorbed.
11. Known issues / deferrals logged.
