# Brief 24.6 — SiteEnergy data-refresh fix + site chapter transitions

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after diagnosis of the data-refresh bug + transition animation request)
**Status:** Active. Small focused brief — one bug fix + transition polish across the site chapter. 5 Parts. Plough-through with NO checkpoints.
**Date opened:** 2026-06-04
**Mode:** Push at close. Walkthrough at **1920×1080 + 1440×900**. Standard visual quality bar applies.

---

## Why this brief

Two related things landed in one brief because both are small and both touch the site chapter user experience:

**The bug.** Chris noticed that on the site Energy tab, navigating between sites (e.g. Millfield Green → Austin Heath) keeps the *previous site's data* on screen — the Duration curve / Time series / Heat map / Daily profile all continue to show Millfield's numbers even though the page header says Austin. The sub-tab selection persists correctly (good), but the chart data doesn't refresh (bug).

**Diagnosis already done** (see Reference 4 below): the bug is one specific React anti-pattern in `App.jsx` line 852 — `useState(readyMpans[0]?.mpan || null)` initialises `activeMpan` from props once on mount and never resets when `siteId` changes. The fix is ~5 lines.

**The polish request.** Chris asked for richer transitions across the site chapter. Specifically: page cross-fade when navigating between sites, charts coming to life when a page loads (bars growing, donut sweeping), and the granularity-change morph on Time series (1 week → 1 quarter visibly stretches between data shapes). The Duration curve already does a version of this (Recharts default animation); Chris likes it; he wants the rest of the chapter to feel similarly alive.

This brief lands both in one coordinated pass.

**Important coordination note for Brief 24.5:** Brief 24.5 Part 3b specified squash-and-stretch motion on Time series granularity changes. **Brief 24.6 supersedes that** — the granularity-morph work is done here in Part 4. If Brief 24.5 hasn't yet been dispatched to Claude Code, Chris should remove Part 3b from 24.5 before sending. If 24.5 has shipped, Part 4 of this brief is a refinement of whatever Part 3b produced.

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 is the contract.** This brief lives inside Rule 11.
2. **STATUS.md** — full read at session start.
3. **Brief 24** (archived or in `active/`) — the parent brief that established the site chapter structure.
4. **Diagnosis from Claude Chat (4 Jun):** the bug is at `eir/src/App.jsx:852`. The `useState(readyMpans[0]?.mpan || null)` initialiser only fires on first mount. When `siteId` changes via prop, React reconciles the same component instance and the stale `activeMpan` persists, so the data-loading `useEffect([activeMpan])` doesn't fire, and the stale `hhData` keeps rendering. Verified that other site tabs (SiteMetering, WaterTab, WasteTab) don't share this pattern — they initialise state from constants, not props. The bug is isolated to SiteEnergy.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (esp. Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/24_6_site_transitions.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.2 **Brief 24.5 check.** If `docs/briefs/active/24_5_metering_refinement.md` exists AND its Part 3b is unshipped, you can treat this brief's Part 4 as canonical for the granularity-morph work. If 24.5's Part 3b has already shipped, your Part 4 here is a polish pass on whatever's there.

0.5 **Land brief.** Place at `docs/briefs/active/24_6_site_transitions.md`. Create `docs/audit/24_6_site_transitions.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 24.6 land: SiteEnergy fix + transitions`.

1. **Confirm framer-motion is installed.** `cat eir/package.json | grep framer-motion`. Should be there from Brief 17.5 work. If not, `npm i framer-motion`.

---

## THE VISUAL QUALITY BAR

Three frames carried forward:

**Pretend you are a graphic designer.** Same bar as Brief 24 + 24.5. Transitions should feel intentional, not toy-like.

**Anti-patterns this brief explicitly refuses:**
- Animating everything (visual noise — only animate what genuinely benefits from motion)
- Transitions over 1 second (feels slow / janky)
- Ignoring `prefers-reduced-motion` (accessibility breach)
- Animating headers, sidebars, navigation chrome (only content area)
- Spring physics with too much bounce — looks toy-like for professional tool
- Sequential when parallel works (e.g. don't fade out then fade in if a cross-fade works)
- Re-triggering full chart entrance on every minor state change (e.g. filter pill click shouldn't replay the bar-growth animation)
- Transitions on user-typed interactions (e.g. typing in a search box shouldn't cause chart to re-animate)

**Reference timing values:**
- Page cross-fades: **200–250ms** ease-out
- Sub-tab fades: **180–200ms** ease-out
- Chart entrance (bars, donut, line, sankey): **600–800ms** ease-out
- Granularity morph: **350–450ms** spring (low bounce, ~0.6 damping)

---

## Scope statement

**IN SCOPE:**
- **Part 1 — Bug fix:** SiteEnergy stops showing stale data when `siteId` changes. ~5 lines in `App.jsx`.
- **Part 2 — Page-level transitions:** cross-fade content area on site-sidebar navigation; cross-fade on sub-tab switch (Overview / Energy / Carbon / Water / Waste / Metering).
- **Part 3 — Chart entrance animations:** bars grow, donut sweeps, line draws, heat map cells stagger-fade, Sankey ribbons grow. Per-chart configurations using Recharts native animation props where possible; custom framer-motion where not (heat map, Sankey).
- **Part 4 — Granularity-change morph on Time series:** the Pablo-spec squash-and-stretch. When user clicks 1 day / 1 week / 1 month / Quarter / 6 months / Year, the chart morphs between data shapes via spring transition or cross-fade fallback.
- **Part 5 — `prefers-reduced-motion` support + walkthrough + close:** all motion respects the user's OS-level motion preference. Full walkthrough at both viewports.

**OUT OF SCOPE:**
- Carbon / Water / Waste tab transitions (those tabs themselves are out of scope of the broader site chapter work; their internal animations stay as-is for now)
- Sidebar transitions (sidebar stays static; only the content area animates)
- Header transitions (header stays static)
- Loading skeletons / shimmer effects (separate workstream if Chris wants later)
- Page-transition direction inference (no "going forward / going back" affordances — just cross-fade)

---

## Operational mode

Plough-through, NO checkpoints. Small brief, push at close.

**Escalate (log + stop) for:**
- Recharts `isAnimationActive` doesn't behave as expected on a specific chart type (Sankey particularly — d3-sankey may need custom animation). Try ≥2 approaches before escalating.
- framer-motion spring on the granularity morph produces visual glitches with the actual data shapes (e.g. transitioning between 48-point and 365-point arrays). If spring doesn't work cleanly, fall back to cross-fade and document the call.
- The bug fix breaks something else (e.g. another component depends on activeMpan persisting). Verify and surface.
- 15 min stuck + 3 approaches.

---

## Principles

1. **Designer-mode throughout.** Same bar as Brief 24 + 24.5. Iterate transitions until they feel intentional, not stock.
2. **Performance first.** Animations should be smooth (60fps). If a chart entrance causes layout thrash, reduce duration or simplify before shipping.
3. **Accessibility.** `prefers-reduced-motion: reduce` disables non-essential transitions. Charts still draw, but instantly. Cross-fades become instant swaps.
4. **Rule 11 inheritance.** No layout changes. Only motion layered on top.
5. **Browser-verify is the gate.**

---

## Parts

### Part 1 — SiteEnergy data-refresh bug fix

**The diagnosis (already done by Claude Chat — see Reference 4):**

In `App.jsx` function `SiteEnergy` (starting line 839), the state initialiser at line 852:

```javascript
const [activeMpan, setActiveMpan] = useState(readyMpans[0]?.mpan || null)
```

…only fires on first mount. When `siteId` changes via prop (user clicks a different site in the sidebar), React reconciles the same component instance and keeps the stale `activeMpan` value. The `useEffect([activeMpan])` that loads `hhData` therefore doesn't fire, and the chart continues rendering the previous site's data.

**The fix:**

Inside `SiteEnergy`, immediately after the existing `useEffect` that loads HH data for `activeMpan` (around line 858), add this reset effect:

```javascript
// Brief 24.6 — reset MPAN selection + cached HH data when siteId
// changes. Without this, useState(readyMpans[0]?.mpan) only fires
// on first mount, so navigating Millfield → Austin keeps Millfield's
// activeMpan and therefore Millfield's loaded hhData on screen.
useEffect(() => {
  setActiveMpan(readyMpans[0]?.mpan || null)
  setHhData(null)
  setHhLoading(true)
}, [siteId])
```

Note: deliberately NOT adding `readyMpans` to the dependency array (it would loop). The effect only fires when `siteId` changes, and the fresh `readyMpans` is captured via closure on re-render.

**Preserve sub-tab selection.** The existing `view` state should NOT be reset by this effect — Chris explicitly likes that the sub-tab persists across site navigation. Verify after the fix that navigating Millfield (Duration curve) → Austin keeps you on Duration curve but with Austin's data.

**Verify with three-site walkthrough:**
1. Navigate `/site/millfield-green/energy/duration-curve` — note the curve shape (Millfield has 1 HH meter, low load)
2. Click Austin Heath in sidebar
3. URL changes to `/site/austin-heath/energy/duration-curve` AND curve visibly different (Austin has multiple meters, higher load)
4. Sub-tab still on Duration curve ✓
5. Click Gifford Lea, then Heat map sub-tab. Then click Bramshott. Heat map should update with Bramshott's data, sub-tab stays on Heat map.
6. Repeat across all 5 Energy sub-tabs to confirm fix applies universally (it should — all views read from the same `ctx`).

Commit `Brief 24.6 Part 1: SiteEnergy data-refresh fix`.

---

### Part 2 — Page-level transitions

Two transitions to wire up:

**2a — Site sidebar navigation (Millfield → Austin etc).** When the user clicks a different site in the sidebar, the **content area** (everything to the right of the sidebar, excluding the top-level header chrome) cross-fades. Outgoing content fades 0 → opacity 0 (200ms ease-out). New site's content fades opacity 0 → 1 (200ms ease-out, starting simultaneously — cross-fade, not sequential).

Implementation: wrap the routed content in framer-motion's `AnimatePresence` keyed on `siteId`. Each site's content gets a `motion.div` with `key={siteId}`, `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`, `transition={{ duration: 0.2, ease: 'easeOut' }}`.

**Don't animate:** the sidebar itself, the top nav (Home / Portfolio / Site / Insights / GRESB), the data-updated timestamp, the page-level header chrome. Only the content area below.

**2b — Sub-tab navigation (Overview → Energy → Carbon etc).** When the user clicks a different site sub-tab, the content area below the sub-tab bar cross-fades. Same approach: `AnimatePresence` keyed on `subTab`, `motion.div` with the same transition values but slightly shorter duration (180ms — sub-tab switches are more frequent so should feel snappier).

**Don't animate:** the sub-tab bar itself (the tabs stay rendered, just the underline/highlight moves — that's already animated by Brief 19.5's pattern). Only the content below the sub-tab strip.

PASS for Part 2:
- Screen recording or sequential screenshots showing the cross-fade on a site click (Millfield → Austin)
- Screen recording or sequential screenshots showing the cross-fade on a sub-tab click (Overview → Energy)
- Verify the sidebar, top nav, and sub-tab bar do NOT animate (only the content area)

Commit `Brief 24.6 Part 2: page-level transitions`.

---

### Part 3 — Chart entrance animations

When a chart first renders on a page (page load, site change, or sub-tab change), its data elements animate into place. Specific configurations per chart type:

**3a — Bar charts (Energy Overview monthly bars, Time series 1-month / quarter / year views, any other bars).**
- Recharts BarChart: set `isAnimationActive={true}`, `animationDuration={700}`, `animationEasing="ease-out"`.
- Bars grow from y-baseline (0) up to their full height in sequence, staggered by ~30ms per bar.
- If Recharts doesn't stagger natively, accept the simultaneous-grow as the default — staggering is nice-to-have not essential.

**3b — Donut chart (Energy Overview gas-vs-elec split donut).**
- Recharts PieChart with `innerRadius`: set `isAnimationActive={true}`, `animationDuration={800}`, `animationBegin={200}`.
- The donut should sweep from 0° to its full arc on first render. Recharts does this natively via the animation props.

**3c — Line / area charts (Time series, Daily profile, Duration curve).**
- Duration curve already animates (Chris noted this and likes it). Keep its current behaviour.
- Time series and Daily profile: configure same — line "draws" left-to-right via `isAnimationActive={true}`, `animationDuration={800}`, `animationEasing="ease-out"`.

**3d — Heat map (the Brief 24 redesign with the 9-stop ramp).**
- Heat map cells don't get Recharts animation. Use framer-motion to stagger-fade cells in: `<motion.rect>` (or whatever element) per cell, with `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `transition={{ duration: 0.4, delay: rowIndex * 0.02 }}`.
- Result: cells fade in row-by-row, top to bottom, taking ~600ms total for 12 rows.
- If 12 × 48 = 576 cells × motion is too expensive, fall back to: rows of cells fade in as units (12 row fades, 50ms stagger between rows). Document the call in audit doc.

**3e — Sankey (site Metering page graphic view).**
- d3-sankey doesn't have native entrance animation. Custom: on mount, draw ribbons with `stroke-dasharray` equal to their length, `stroke-dashoffset` equal to their length (invisible), then animate `stroke-dashoffset` to 0 over 800ms ease-out. Result: ribbons "draw" from source to target.
- Nodes (left/middle/right rectangles): fade in simultaneously with `motion.rect`, 400ms duration.
- Done before ribbons start, so the structure appears first then connects.

**3f — Treemap, Bars (Metering page alternate views).**
- Treemap: rectangles fade in with slight scale (0.95 → 1.0) over 500ms ease-out. Use framer-motion.
- Bars (the horizontal bar chart): use Recharts BarChart settings same as 3a.

**One critical thing:** the chart entrance animation should only fire on **first render** of the chart on the current page, not on every state change. Filter pill changes, view toggle (Sankey → Treemap → Bars) changes, search box typing — none of these should re-trigger the entrance animation. The chart morphs in-place via its own data update path (covered in Part 4 for Time series; default Recharts data-update animations for others).

If implementing this requires tracking "has this chart already mounted on this page," use a `useRef` flag inside the chart wrapper.

PASS for Part 3:
- Screen recording showing the Energy Overview monthly bars growing + donut sweeping on page load
- Screen recording showing the Sankey ribbons drawing left-to-right on the Metering page
- Screen recording showing the Heat map cells stagger-fading
- Verify filter pill clicks do NOT re-trigger entrance animations (chart just updates)

Commit `Brief 24.6 Part 3: chart entrance animations`.

---

### Part 4 — Granularity-change morph on Time series

(Supersedes Brief 24.5 Part 3b if 24.5 hasn't shipped that yet.)

When the user clicks a different granularity pill on Time series (1 day / 1 week / 2 weeks / 1 month / Quarter / 6 months / Year), the chart morphs between data shapes via spring transition rather than snapping.

**Implementation approach:** use framer-motion's `useTransform` and `motion.path` on the SVG path that draws the line/area. As the data array changes, framer-motion can morph the `d` attribute between old and new path strings.

Practical: keep the previous path's `d` string in a ref, and on data change, animate from the old `d` to the new `d` over 400ms with spring `{ stiffness: 100, damping: 18 }` (low bounce — professional, not bouncy).

**If path morphing produces visual glitches** (different point counts can cause weird interpolation), fall back to a cross-fade: render the old chart at full opacity, fade in the new chart at the same time, ~350ms duration. This is acceptable as the documented fallback — note the call in the audit doc.

**Test the dramatic transitions specifically:** 1 day → Year (going from 48 half-hourly points to 365 daily points, or whatever the year-view aggregation is). This is where the squash-and-stretch is most visible / most useful. If the morph works cleanly on this transition, it'll work on the others.

PASS for Part 4:
- Screen recording showing 1 week → 1 month transition with visible morph (not snap)
- Screen recording showing 1 day → Year transition (the dramatic case)
- Document in audit doc whether path-morph or cross-fade was used, and why

Commit `Brief 24.6 Part 4: Time series granularity morph`.

---

### Part 5 — `prefers-reduced-motion` + walkthrough + close

**5a — Accessibility.** Wrap the framer-motion + Recharts animation configs to respect the user's OS-level motion preference:

- Detect via CSS media query `(prefers-reduced-motion: reduce)` or framer-motion's `useReducedMotion()` hook.
- When set: all `transition.duration` becomes 0; all `isAnimationActive` becomes false. Effectively, content swaps instantly. Charts render without entrance animation.
- Test in browser by toggling the OS-level reduced-motion setting (or in Chrome devtools: Rendering tab → Emulate CSS media feature `prefers-reduced-motion`).

**5b — Performance check.** Open Chrome DevTools Performance tab. Record while:
- Navigating between sites
- Switching sub-tabs
- Loading the Metering page (Sankey animation)
- Clicking through Time series granularity pills

Check the framerate stays at or near 60fps. If any animation drops below 30fps consistently, reduce duration or simplify the animation before shipping.

**5c — Full walkthrough at 1920×1080.** Click through:
- Sidebar: Millfield → Austin → Gifford → Bramshott (cross-fades visible, data updates correctly per Part 1)
- Sub-tabs at Austin: Overview → Energy → Metering → back to Overview (cross-fades visible)
- Energy sub-tabs at Austin: Overview (bars + donut animate) → Time series (line draws) → Time series pills (1 day → 1 week → 1 month → Quarter → Year — each morphs) → Duration curve → Heat map (cells stagger) → Daily profile
- Metering: graphic toggle Sankey → Treemap → Bars (each renders with its entrance animation; subsequent toggles don't re-animate)

**5d — Walkthrough at 1440×900.** Same sequence, abbreviated. Confirm all animations still work at the smaller viewport.

**5e — No-regression check.** Portfolio chapter pages (Map, Energy, Water, Waste, GRESB) — confirm no transitions accidentally applied there. They should behave exactly as before.

**5f — Audit doc populated.** Screenshots embedded, framerate measurements pasted, framer-motion / Recharts configuration choices documented.

**5g — STATUS.md final update. Brief archived. current.md repointed.**

Commit `Brief 24.6 close: site chapter transitions complete`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 5 Parts landed.
2. **Part 1 bug fix:** screenshot sequence showing Millfield duration curve, then Austin duration curve (visibly different shape), then Gifford (visibly different shape). Sub-tab persists across navigation.
3. **Part 1 no-regression:** Energy sub-tabs other than Duration curve also refresh correctly on site change (Time series / Daily profile / Heat map / Overview tested).
4. **Part 2a site navigation cross-fade:** recording or sequential screenshots showing the content area fading between sites. Sidebar / top nav unchanged.
5. **Part 2b sub-tab cross-fade:** recording showing Overview → Energy fade. Sub-tab bar itself unchanged.
6. **Part 3a bars grow:** recording showing Energy Overview monthly bars growing from baseline on page load.
7. **Part 3b donut sweeps:** recording showing the donut sweeping from 0° to full arc.
8. **Part 3c lines draw:** recording showing Time series line drawing left-to-right.
9. **Part 3d heat map staggers:** recording showing cells fading in row-by-row.
10. **Part 3e Sankey ribbons draw:** recording showing the Sankey ribbons drawing from source to target.
11. **Part 3 — no re-trigger on state change:** confirm filter pill click on Metering page doesn't restart the Sankey entrance animation (chart just updates in place).
12. **Part 4 granularity morph:** recording showing 1 week → 1 month → Quarter → Year transitions on Time series. Audit doc notes whether path-morph or cross-fade was used.
13. **Part 5a reduced-motion:** screen recording with `prefers-reduced-motion: reduce` enabled showing animations disabled / instant.
14. **Part 5b performance:** Chrome DevTools framerate measurement >= 30fps across all animations, target 60fps.
15. **Part 5c walkthrough at 1920×1080:** full screenshot/recording set covering all the listed clicks.
16. **Part 5d walkthrough at 1440×900:** confirmed animations still work.
17. **Part 5e no-regression on portfolio:** portfolio pages unchanged.
18. **STATUS.md** start/end entries per Part. Audit doc complete.
19. **Brief archived** to `archive/24_6_site_transitions_COMPLETED.md`.

---

## One last thing

Pretend you're a graphic designer making this feel premium. Transitions are the place where "competent" becomes "delightful" — but also where overdoing it becomes "annoying." Hit the timing values from the THE VISUAL QUALITY BAR section. Iterate on the dramatic transitions (chart entrances, granularity morphs) until they feel intentional rather than stock-Recharts.

The bug fix is small. The transitions are the polish. Treat both with care.

Push at close.
