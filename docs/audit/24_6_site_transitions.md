# Brief 24.6 — SiteEnergy data-refresh fix + site chapter transitions

**Status:** Complete pending Chris walkthrough

**Brief:** `docs/briefs/archive/24_6_site_transitions_COMPLETED.md`

## Parts log

- [x] Part 0.5 — Brief landed (commit `69f1236`)
- [x] Part 1 — SiteEnergy data-refresh bug fix (`e40874b`)
- [x] Part 2 — Page-level fade-in on nav (`98df849`)
- [x] Part 3 — Chart entrance animations (`7e94f2b`)
- [x] Part 4 — Time series granularity cross-fade (`d07984a`)
- [x] Part 5a — prefers-reduced-motion + cold-load fix (`4bf1713`)
- [x] Part 5 — close (this doc, archive, push)

## Implementation notes

### Part 1 — bug fix
Diagnosed by Claude Chat: `App.jsx` `SiteEnergy` `useState(readyMpans[0]?.mpan)` initialiser only fires on first mount. Fix landed as a `useEffect([siteId])` reset just below the existing HH-load effect — resets `activeMpan`, `hhData`, `hhLoading` on every siteId change. `readyMpans` deliberately NOT in the dep array (closure capture is sufficient and a dep would loop).

Verified via Chrome MCP client-side sidebar nav: Millfield 125 kW → Austin 65.4 kW → Gifford 80.4 kW Heat map peaks all distinct, sub-tab "Heat map" persisted across all three navigations.

### Part 2 — page-level fade-in (NOT cross-fade)

**Approach changed from brief.** The brief specified framer-motion `AnimatePresence` cross-fade. We attempted three implementations:

1. **Nested AnimatePresence + mode="popLayout"** — both old and new content stacked at opacity 1; outgoing exit phase ran (Austin dropped to 0) but the element never unmounted. New child layered on top.
2. **Single AnimatePresence + mode="wait" + composite key `${siteId}/${subTab}`** — exit animation never fired (opacity stuck at 1 on outgoing for 500ms+ verified via DOM polling). React 19 StrictMode dev-only double-mount appears to confuse framer-motion 12's exit phase.
3. **AnimatePresence + default mode (sync)** — outgoing stuck at opacity 1, incoming stuck at opacity 0, no animation progress.

All three were verified via Chrome MCP DOM sampling; the framer-motion / React 19 / StrictMode interaction simply leaves animations frozen.

**Landed pattern:** plain CSS `@keyframes site-chapter-fade-in` triggered by a key-remount. The wrapper `<div key={"${siteId}/${subTab}"}>` re-mounts whenever the user navigates and the `.site-chapter-fade` class runs a 200 ms opacity 0→1 fade. The old subtree is dropped instantly — visually reads as a smooth swap-and-fade given the 200 ms timing.

This is technically "fade-in only" rather than "cross-fade". At the brief's timing (200 ms fade-in only, vs 200 ms cross-fade with overlap) the visual difference is barely perceptible.

**Cold-load suppression** uses `useState(currentKey)` to capture the initial key. The fade class only applies when `currentKey !== initialKey` — i.e. user has actually navigated, not just cold-loaded. An earlier attempt with a module-level `_coldLoadDone` flag failed because `useReducedMotion()` triggers an async re-render after settling, and by then the flag was already true → class erroneously added on cold load. `useState` freezes the cold-load key so the comparison stays stable across re-renders.

`prefers-reduced-motion`: belt-and-braces — the JS check ANDs against the `reducedMotion` prop, and `@media (prefers-reduced-motion: reduce) { .site-chapter-fade { animation: none } }` no-ops the keyframe.

### Part 3 — chart entrance animations

**3a — Energy Overview bars.** Recharts `<Bar>` `isAnimationActive={animateOnFirst}` with 700 ms ease-out duration. A `useRef(true)` flag inside `SiteEnergyMonthlyOverview` flips false after first mount via `useEffect` — subsequent state-driven re-renders within the same site visit pass false and Recharts skips the entrance. A fresh site visit via `SiteChapterFade`'s keyed re-mount produces a new ref → animation re-runs. Gas bar has `animationBegin={120}` so the two bars stagger.

**3b/3c — Pie + Line not enabled.** Brief 13 documented Recharts 3.x animation bugs: animated `<PieChart>` ends with empty `<path>` `d` attributes (mid-animation stranding); animated `<Line>` strands with empty paths on mount. Both deliberately stay at `isAnimationActive={false}` with documented in-line comments. Part 4's granularity-change morph covers the Time series entrance via a different mechanism (the keyed cross-fade).

**3d — Heat map row stagger.** Per-cell `<motion.rect>` rejected on cost (365 days × 48 hh-slots = 17 520 cells × framer-motion bookkeeping). Brief explicitly licensed the row-fallback. Cells now grouped per hh-slot in `<g.hm-row>`; inline `animation-delay: ${hhIdx * 12}ms` produces a 12 ms-per-row stagger. Last row delay 564 ms + 320 ms keyframe = 884 ms total paint. `animation-fill-mode: backwards` keeps rows invisible during their delay (otherwise lower rows would flash visible before their delay elapsed).

**3e — Sankey entrance.** Two-phase:
- **Nodes** (left/mid/right rectangles): `.sankey-nodes-fade` wrapper `<g>` with 400 ms ease-out opacity 0→1 keyframe.
- **Links**: each ribbon `<path>` carries `pathLength="1"` (normalised), `strokeDasharray={1}`, `strokeDashoffset={1}`, and CSS `animation: sankey-link-draw-in 0.8s ease-out forwards`. Per-ribbon stagger via inline `animationDelay: ${300 + i * 25}ms` so the first ribbon starts at 300 ms (after nodes are visible) and successive ribbons follow at 25 ms intervals. `forwards` fill-mode holds the final state — without it, the dashoffset would snap back to 1 after the keyframe ended and ribbons would vanish.

**3f — Treemap / Bars in Metering alternates.** NOT addressed in this brief (time budget). Filed as a follow-up.

### Part 4 — Time series granularity cross-fade (path-morph fallback)

**Approach:** key the chart wrapper `<div>` on `zoomDays`. Each granularity-pill click force-remounts the chart subtree and the new CSS class `.time-series-morph` runs a 350 ms ease-out keyframe — opacity 0→1 with a 2 px upward translate.

**Why cross-fade rather than path-morph (the brief's preferred approach):**
- Recharts 3.x's documented `<Line>` entrance bug (Brief 13 family fix) makes Recharts-native path-morph unreliable.
- framer-motion path morphing between SVG path strings with mismatched point counts (48 → 365 — the dramatic 1 day → Year transition) is fragile. Brief acknowledged this and licensed a cross-fade fallback explicitly.

The cross-fade reads as a clean visual swap when flipping granularities; the 2 px translate adds just enough "alive" quality to feel intentional rather than a hard cut. Verified the morph div has `animation-name: time-series-morph-in` and `animation-duration: 0.35s` both on initial mount and on Year click (key change triggers re-mount).

### Part 5a — prefers-reduced-motion

Every CSS animation has a matching `@media (prefers-reduced-motion: reduce)` rule that sets `animation: none`. The Sankey link rule additionally sets `stroke-dashoffset: 0` so links stay fully drawn.

For Recharts Bar animation (the only JS-driven animation): `useReducedMotion()` ANDs against the first-mount flag.

`SiteChapterFade`'s class application is gated on `!reducedMotion` for belt-and-braces; the @media query would no-op the keyframe regardless.

## Verification — DOM evidence (1920×1080)

The headless Chrome MCP tab is `document.hidden`, which throttles `document.timeline` and pauses CSS animation playback (verified via `document.timeline.currentTime === 0`). All visual playback verification therefore relies on DOM-structure and computed-style checks; the keyframes will play normally in a foreground tab.

| Animation | DOM evidence |
|---|---|
| Site chapter fade (Part 2) | Cold load: `.site-chapter-fade` absent on `/site/austin-heath/overview`. After clicking Gifford: `.site-chapter-fade` present, `animationName: "site-chapter-fade-in"`, `animationDuration: "0.2s"`. ✓ |
| Energy Overview bars (Part 3a) | `<Bar>` props: `isAnimationActive={true}` on first mount, `animationDuration={700}`, `animationEasing="ease-out"`, gas bar `animationBegin={120}`. ✓ |
| Heat map row stagger (Part 3d) | 48 `<g.hm-row>` rows present; sample delays: 0 ms, 12 ms, 24 ms (rows 0–2), 564 ms (row 47); animation name `hm-row-fade-in`. ✓ |
| Sankey nodes fade (Part 3e) | `<g.sankey-nodes-fade>` present; animation name `sankey-nodes-fade-in`. ✓ |
| Sankey link draw (Part 3e) | 14 link paths with `.sankey-link-draw`; stroke-dasharray `1px` (pathLength normalised); delays: 300 ms, 325 ms, 350 ms…; animation name `sankey-link-draw-in`. ✓ |
| Time series morph (Part 4) | Initial mount: `.time-series-morph` with `animation-name: time-series-morph-in`, `animation-duration: 0.35s`. After Year click: re-mounted with same animation. ✓ |

## Carried-forward follow-ups

- **Treemap + Metering alternate bars entrance (3f)** — not landed; file as a small refinement when time allows.
- **Pie + Line native animation** — blocked by Recharts 3.x bugs (Brief 13 documented). Would unblock cleaner donut sweep + line draw on initial chart entrance; cross-fade fallback in Part 4 is the workaround for Time series specifically.
- **Foreground-tab visual confirmation by Chris** — recommend Chris does a one-pass walkthrough at 1920×1080 + 1440×900 to confirm the timings feel right. If the 200 ms page fade feels too short or 350 ms granularity cross-fade too long, durations can be tuned in `eir/src/index.css`.

## Files touched

- `eir/src/App.jsx` — `SiteChapterFade` helper, `SiteEnergyMonthlyOverview` bar animation gates, `SiteEnergy` reset effect (Part 1)
- `eir/src/index.css` — 4 keyframes (`site-chapter-fade-in`, `hm-row-fade-in`, `sankey-nodes-fade-in`, `sankey-link-draw-in`, `time-series-morph-in`) + matching reduced-motion media queries
- `eir/src/components/LoadInspector/views/HeatMapView.jsx` — row grouping
- `eir/src/components/LoadInspector/views/TimeSeriesView.jsx` — keyed wrapper + morph class
- `eir/src/components/site/SiteMetering.jsx` — Sankey path className + pathLength + nodes group class

## Commits

| SHA | Subject |
|---|---|
| `69f1236` | Brief 24.6 land: SiteEnergy fix + transitions |
| `e40874b` | Brief 24.6 Part 1: SiteEnergy data-refresh fix |
| `98df849` | Brief 24.6 Part 2: page-level fade-in on site nav |
| `7e94f2b` | Brief 24.6 Part 3: chart entrance animations |
| `d07984a` | Brief 24.6 Part 4: Time series granularity cross-fade |
| `4bf1713` | Brief 24.6 Part 5a: prefers-reduced-motion + cold-load suppression fix |
