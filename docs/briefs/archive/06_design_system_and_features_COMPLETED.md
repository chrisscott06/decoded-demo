# Brief 6 — NZA design system + left-side narrative + map module port + half-hourly Load Inspector

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Largest IVG brief to date — six Parts, plough-through end to end.
**Date opened:** 2026-05-22
**Mode:** **No Chris checkpoints mid-flight.** Claude Code runs all six Parts in sequence without pausing for review. Chris is asleep. He runs the walkthrough when he wakes up; that's the only human gate.

---

## Target outcome

The IVG ESG Tool adopts the NZA design system established in the `nzai-demo` repo — Stolzl/Inter/DM Serif/IBM Plex fonts, the three-tier token system (anchors + theme + methodology), the two-bar primary + secondary nav, the cream/dark editorial register. Every page except individual Site Detail pages gains a left-side explanatory narrative (2-3 sentences) so the reader has context for what they're looking at. The EOC Map module is ported into Portfolio > Map per the canonical handoff document. The PABLO Load Inspector is ported into Site Detail > Energy > Half-hourly toggle per its canonical handoff. The Stark half-hourly reader is fixed to handle actual Stark export format (3 columns, descending chronology, no day-of-week prefix). Nine Stark CSVs in `pipeline/source-data/` are processed; three missing MPANs (Bramshott Clubhouse, Ampfield Energy Centre, Ampfield Main) surface as "data pending — not yet pulled from Stark".

After this brief lands the IVG ESG Tool reads visually like a real NZA report: Stolzl headlines, cream-register Site Detail pages, dark-register dashboards, two-bar nav with logo lockup. The Portfolio > Map view is the leaderboard-driven multi-theme map pattern from the EOC reference. The Site Detail > Energy view supports half-hourly drill-down for 9 of 12 MPANs with a 6-tab Load Inspector. The 4-quadrant infographic landing is replaced by Portfolio > Map as the default surface. The IVG demo lands with a tool that looks like NZA, tells a richer story, and surfaces Phase 1B + Brief 5 data properly.

This is the first IVG ESG Tool brief written under the NZA Development Bible discipline post-bootstrap.

---

## Reference documents — read once at session start

1. **NZA Development Bible** — https://www.notion.so/32dd645e05cc813b881edd454053e238
2. **IVG Map module + landing architecture (design note)** — https://www.notion.so/367d645e05cc8104b18fd8011d79200a
3. **`docs/briefs/MAP_MODULE_HANDOFF.md`** — 855 lines, EOC map module spec
4. **`docs/briefs/LOAD_INSPECTOR_HANDOFF.md`** — 987 lines, PABLO Load Inspector spec
5. **`nzai-demo` repository** at `C:\Users\ChrisScott\Dev\nzai-demo` (local) or `github.com/chrisscott06/nzai-demo` (remote) — **READ-ONLY structural reference for this brief.** Never modify, commit, or push `nzai-demo`. The IVG project's design system is forklifted FROM nzai-demo, not into it.
6. **`STATUS.md`** and **`CLAUDE.md`** at IVG repo root — established by Brief 5
7. This brief at **`docs/briefs/active/06_design_system_and_features.md`**

---

## BEFORE DOING ANYTHING

0. **Session-start reconciliation pass** per Process Rule 8:
   - `ls docs/briefs/active/` — should be empty (Brief 5 archived); will contain Brief 6 after step 0.5
   - `cat docs/briefs/current.md` — confirms last active brief was Brief 5
   - `tail -30 STATUS.md` — confirms Brief 5 close
   - `git log --oneline -20` — last commit should be Brief 5 close
   - `git status --short` — confirm clean working tree

0.5 **Land this brief on disk.** Save this brief at `docs/briefs/active/06_design_system_and_features.md` as the first action. Confirm receipt by quoting the brief's title and "Target outcome" first paragraph back to Chris in chat (per Bible Rule 1). Update `docs/briefs/current.md` to point to Brief 6. Commit:

```
Brief 6 land: brief on disk at active/06_design_system_and_features.md

Per Process Rule 7. Brief 6 spans NZA design system forklift, left-side
narrative, map module port, half-hourly Load Inspector, Stark reader fix.
Six Parts, plough-through, no Chris checkpoints mid-flight.
```

1. **Handle the untracked files at repo root** (`public/`, `scripts/`, `src/`, `extraction-log.csv` — mentioned in Brief 5's close report). These are EOC map-extraction artefacts that landed in the wrong place. Auto-action:
   - Create `.archive-eoc-extraction/` at repo root
   - Move `public/`, `scripts/`, `src/`, `extraction-log.csv` into it
   - Add `.archive-eoc-extraction/` to `.gitignore`
   - Commit as `chore: archive EOC extraction artefacts to .archive-eoc-extraction/ (gitignored)`
   - **Do not investigate or use the contents** — the canonical map handoff is at `docs/briefs/MAP_MODULE_HANDOFF.md` and is self-contained per Bible Rule 3.

2. **Confirm Stark CSVs at `pipeline/source-data/`.** Expected: 9 files named like `consumption_data_mpan_{13-or-14-digit-MPAN}_from_*.csv`. Confirm with:
   ```bash
   ls pipeline/source-data/consumption_data_mpan_*.csv 2>/dev/null | wc -l
   ```
   - If exactly 9: proceed. Log the 9 MPAN IDs to STATUS.md.
   - If fewer than 9: log the count and missing MPANs to STATUS.md, then **continue anyway** — the reader produces empty index entries for missing MPANs.
   - If more than 9: log and continue.

3. **Confirm the UK dotted SVG.** Expected at `eir/public/maps/uk-dotted-map.svg`.
   - If present there: good.
   - If at repo-root `public/maps/uk-dotted-map.svg`: move to `eir/public/maps/uk-dotted-map.svg` (Vite only serves from `eir/public/`).
   - If absent: log to STATUS.md and continue. Part 4's map will fall back to a coloured rectangle with a "UK SVG not yet placed at eir/public/maps/uk-dotted-map.svg" notice in dev console.

4. **Read all reference documents** listed above. The handoff docs are dense; the brief assumes Claude Code has internalised them by Part 4 / Part 5.

5. Begin Part 1.

---

## Scope statement

In scope:
- NZA design system forklift from `nzai-demo` to IVG: tokens, fonts, `@font-face` declarations, type scale, motion tokens (Part 1)
- Sweep raw hex values out of IVG components; everything flows through tokens (Part 2)
- Two-bar primary + secondary nav with logo lockup; cream-register `BodyPageLayout` for Site Detail; dark-register for dashboards (Part 3)
- Left-side explanatory narrative (2-3 sentences) on every page except individual Site Detail pages (Part 3)
- EOC Map module port to `Portfolio > Map` per the canonical handoff (Part 4)
- 4-quadrant infographic landing replaced by Map view as default Portfolio surface (Part 4)
- Stark reader rewrite to handle actual Stark format; process 9 of 12 MPANs; 3 missing surface as "data pending" (Part 5)
- PABLO Load Inspector port to `Site Detail > Energy > Half-hourly` toggle, 6 of 8 views (Part 5)
- Walkthrough verification by Claude Code's MCP browser tools; Chris's manual walkthrough on wake (Part 6)

Out of scope (do not absorb during this brief; log to STATUS.md "Known issues" and continue):
- Sites table redesign — still "naff" per Chris, deferred
- GRESB Readiness real build — Sunday work
- Sycous resident-energy chart on Site Detail Energy tab — annual data only, deferred
- Weather analysis tab in Load Inspector — handoff Section 10 says skip for first port
- New comparisons view — existing Comparisons works after Brief 5's Y-axis fix
- Migration of IVG repo into nzai-demo (Path B / Framing 3) — deferred to a future brief

No pipeline data model changes (the existing JSONs stay; new HH JSONs join them). No GitHub Actions changes. No Vercel config changes (the catch-all SPA rewrite from Brief 5 Part 1 covers the new routes).

---

## Operational mode — plough through, no Chris checkpoints

Authorisation up front. No per-Part sign-off. No "stop and ask Chris" gates mid-brief. Claude Code makes the small decisions inline and documents them in STATUS.md / audit docs as it goes. Chris runs the walkthrough on wake (Part 6); that's the only human gate.

**Escalation triggers** (the only conditions that stop execution and log a blocker to STATUS.md):
- A reference document file (handoff, design note, this brief) is missing from disk
- The Stark reader rewrite fails because the actual CSV format differs from what's documented (3-col `Date, Time, Value`)
- The map outline SVG is corrupt (parsable but renders empty) AND the fallback rectangle also fails to render
- A Part's PASS criteria cannot be met after the 15-minute stuck-rule has fired and Claude Code has tried 3 different approaches per Bible "When stuck"
- Vercel build fails after Part 4 push (the new dependencies + entry-point changes are risky; if build fails, halt before Part 5)

Otherwise: keep going. Each Part is one commit. Each Part updates STATUS.md and audit docs in the same commit. Final report at end of Part 6.

---

## Principles

1. **Design spec wins.** If a nzai-demo pattern and an EOC pattern disagree, nzai-demo wins (it's the NZA canonical). If a handoff doc and the design note disagree, the design note wins (it's the IVG-specific architectural decision).

2. **No new physics, no new data.** The pipeline already produces the JSONs the UI reads; Part 5 only adds the half-hourly JSONs by fixing the Stark reader. No engine changes, no recalculation of carbon factors, no new emission constants.

3. **Reuse before rebuild.** Per Bible "Clean up before you build" — when extending a component, look at what's there first. Delete old hex tokens after replacing them; don't leave parallel paths.

4. **Falsifiability for every Part.** Each Part below has explicit, observable PASS criteria. If they can't be met, the Part doesn't close.

5. **Browser verification mandatory at Part 6.** Per Process Rule 9 added in Brief 5. Claude Code's MCP browser tools boot the dev server, click every route, capture screenshots, document findings. Chris's manual walkthrough is the close gate.

6. **Tokens, not raw hex.** Per nzai-demo's CLAUDE.md rule 4. After Part 2, `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx"` returns zero results outside `eir/src/tokens/`. This is a falsifiability gate.

7. **Closed type scale.** After Part 2, no arbitrary `font-size: NNpx` outside `index.css`. All sizes flow through the 10-token design-spec scale or the 5-token editorial scale.

8. **No `npm install` from Claude Code's environment** per Bible "Claude Code rules". Add `framer-motion` to `package.json` only; Chris's local environment installs. If a Part runs locally and the package isn't resolvable, fall back to the CSS-keyframe pattern from nzai-demo's `nza-entry` and continue — do NOT block on Chris.

9. **Documentation hygiene.** Each Part's commit includes STATUS.md + (where appropriate) audit-doc updates. Brief 6's audit doc at `docs/audit/06_design_system_and_features.md`.

10. **No quiet scope expansion.** New issues surfaced during work → log to `STATUS.md` "Known issues" → continue. No absorbing new work mid-brief.

---

## Parts

### Part 1 — NZA design system forklift: tokens, fonts, type scale, motion

**Goal:** The IVG repo has the same design-token foundation as `nzai-demo`. Stolzl/Inter/DM Serif/IBM Plex fonts load via `@font-face` (Google Fonts CDN removed). The three-tier token system lives at `eir/src/tokens/`. CSS custom properties in `eir/src/index.css` mirror nzai-demo's `@theme` block (adapted: no Tailwind in IVG, so the tokens live as `:root` CSS variables instead of `@theme` directives, but with identical names and values).

**Files touched:**
- `eir/index.html` — Google Fonts CDN link removed
- `eir/src/index.css` — full token system rewrite under `:root`; old Phase 1A/1B tokens preserved as aliases where they map cleanly to new tokens (e.g. `--coral: var(--color-nza-coral)`)
- `eir/src/fonts.css` (new) — `@font-face` declarations for Stolzl Book + Medium + Light + Regular + Bold + Thin
- `eir/src/fonts/stolzl/` (new directory) — six `.otf` files copied from `nzai-demo/src/fonts/stolzl/`
- `eir/src/tokens/` (new directory):
  - `anchors.js` — copy from `nzai-demo/src/tokens/anchors.js`
  - `themes/theme.core.js` — copy from `nzai-demo/src/tokens/themes/theme.core.js`
  - `methodology.js` — copy from `nzai-demo/src/tokens/methodology.js`
  - `colors.js` — copy from `nzai-demo/src/tokens/colors.js`
  - `fonts.js` — copy from `nzai-demo/src/tokens/fonts.js`
  - `motion.js` — copy from `nzai-demo/src/tokens/motion.js`
- `eir/src/main.jsx` — import `./fonts.css` after `./index.css`
- `docs/audit/06_design_system_and_features.md` (new) — Part 1 findings

**Steps:**

1.1 **Copy the Stolzl `.otf` files.**
- Source: `C:\Users\ChrisScott\Dev\nzai-demo\src\fonts\stolzl\` (six files: `stolzl_book.otf`, `stolzl_medium.otf`, `stolzl_light.otf`, `stolzl_regular.otf`, `stolzl_bold.otf`, `stolzl_thin.otf`)
- Dest: `eir/src/fonts/stolzl/`
- Use file-system copy (don't reference across repos). Confirm 6 `.otf` files exist at dest.

1.2 **Create `eir/src/fonts.css`** matching nzai-demo's pattern:

```css
/* Stolzl @font-face declarations. The six weights match the .otf files
   in eir/src/fonts/stolzl/. font-display: swap so text renders in
   Inter (Google-fallback) until Stolzl loads — prevents flash of
   invisible text. */
@font-face {
  font-family: 'Stolzl';
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_light.otf') format('opentype');
}
@font-face {
  font-family: 'Stolzl';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_book.otf') format('opentype');
}
@font-face {
  font-family: 'Stolzl';
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_medium.otf') format('opentype');
}
@font-face {
  font-family: 'Stolzl';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_regular.otf') format('opentype');
}
@font-face {
  font-family: 'Stolzl';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_bold.otf') format('opentype');
}
@font-face {
  font-family: 'Stolzl';
  font-weight: 100;
  font-style: normal;
  font-display: swap;
  src: url('./fonts/stolzl/stolzl_thin.otf') format('opentype');
}
```

Verify the weight numbers match the actual `.otf` files — open one in a font tool if uncertain, but Stolzl's standard mapping is: Thin 100, Light 300, Book 400, Medium 500, Regular 600, Bold 700.

1.3 **Copy the token JS files** from `nzai-demo/src/tokens/` to `eir/src/tokens/`. Six files: `anchors.js`, `methodology.js`, `colors.js`, `fonts.js`, `motion.js`, plus the subdirectory `themes/theme.core.js`. Preserve directory structure.

1.4 **Update `eir/index.html`** — remove the Google Fonts CDN block:
```html
<!-- REMOVE these three lines: -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```
Inter and DM Serif Display remain available as system / Google fallback — for now leave a single fallback Inter import (without Playfair) only if the rendered Inter at default weights doesn't look right. Default plan: remove all CDN font links; rely on the system Inter stack + Stolzl from `@font-face`. Decision deferred to step 1.7 (verify in browser).

1.5 **Rewrite `eir/src/index.css`** end to end. Pattern:

```css
@import "./fonts.css";

/* ===== NZA Design System — Tier 1 anchors + Tier 2 theme + Tier 3 methodology =====
   Forklifted from nzai-demo. Source: nzai-demo/src/index.css @theme block.
   IVG uses plain CSS (no Tailwind), so tokens live as :root custom properties
   rather than Tailwind @theme directives. Names and values are identical to
   nzai-demo so a future Tailwind migration is a mechanical lift. */

:root {
  /* === Fonts === */
  --font-heading: 'Stolzl', sans-serif;
  --font-hero: 'Stolzl', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-display: 'DM Serif Display', serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* === Type scale: design-spec 10 tokens ===
     Closed scale. Arbitrary font-size: Npx outside this file is forbidden. */
  --text-micro: 10px;
  --text-micro-lh: 1.4;
  --text-xs: 12px;
  --text-xs-lh: 1.5;
  --text-sm: 14px;
  --text-sm-lh: 1.55;
  --text-base: 16px;
  --text-base-lh: 1.7;
  --text-lg: 18px;
  --text-lg-lh: 1.6;
  --text-h4: 20px;
  --text-h4-lh: 1.3;
  --text-h3: 24px;
  --text-h3-lh: 1.25;
  --text-h2: 28px;
  --text-h2-lh: 1.2;
  --text-h1: 36px;
  --text-h1-lh: 1.15;
  --text-display: 64px;
  --text-display-lh: 1.05;

  /* === Type scale: editorial-register 5 tokens === */
  --text-chapter: 40px;
  --text-chapter-lh: 1.15;
  --text-chapter-sub: 18px;
  --text-chapter-sub-lh: 1.6;
  --text-page-heading: 28px;
  --text-page-heading-lh: 1.2;
  --text-subheading: 18px;
  --text-subheading-lh: 1.3;
  --text-body: 15px;
  --text-body-lh: 1.6;

  /* === Tier 1 — anchors === */
  --color-nza-coral: #E8725C;
  --color-nza-cream: #EDE5D8;

  /* === Tier 2 — Active theme: NZA Core === */
  --color-theme-base: #1A2440;
  --color-theme-accent-primary: #F08080;
  --color-theme-accent-secondary: #A896C4;
  --color-theme-cta: #E8725C;
  --color-theme-body: #EDE5D8;

  /* === Tier 3 — methodology (risk) === */
  --color-risk-low: #8FCB85;
  --color-risk-moderate: #E8A13C;
  --color-risk-major: #D9464B;
  --color-risk-severe: #4C3D6B;
  --color-risk-no-data: #A9C5DA;

  /* === Tier 3 — methodology (scopes) === */
  --color-scope-12: #5BBFB5;
  --color-scope-3: #534E86;

  /* === Tier 3 — methodology (data quality) === */
  --color-dq-activity-based: #22C55E;
  --color-dq-supplier-specific: #3B82F6;
  --color-dq-industry-average: #F2A93B;
  --color-dq-proxy: #EF4444;

  /* === Tier 3 — categorical themes === */
  --color-categorical-estate: #5B7B9A;
  --color-categorical-travel: #F2A93B;
  --color-categorical-supply-chain: #347373;
  --color-categorical-commuting: #D4891F;

  /* === Motion === */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-gentle: cubic-bezier(0.4, 0, 0.6, 1);
  --duration-instant: 150ms;
  --duration-entry: 250ms;
  --duration-cascade: 350ms;
  --duration-transition: 500ms;
  --duration-chapter: 700ms;

  /* === IVG-specific layout (preserved from Phase 1B) === */
  --app-content-max-width: 1600px;
  --topnav-height: 56px;
  --subnav-height: 48px;
  --sidebar-width: 240px;
  --panel-radius: 12px;
  --panel-padding: 24px;

  /* === Legacy aliases — point old Phase 1A/1B token names at the new tokens
        so existing component code keeps working during the sweep in Part 2 ===
        These aliases are deleted in Part 2 once components are updated. */
  --bg-dark: var(--color-theme-base);
  --bg-cream: var(--color-nza-cream);
  --text-on-dark: var(--color-theme-body);
  --text-on-cream: var(--color-theme-base);
  --coral: var(--color-nza-coral);
  --coral-dark: var(--color-theme-accent-primary);
  --navy: var(--color-theme-base);

  --status-confirmed: var(--color-risk-low);
  --status-partial: var(--color-risk-moderate);
  --status-missing: var(--color-risk-major);
  --status-not-applicable: var(--color-risk-no-data);

  /* Old --serif token is being deprecated; for now it aliases to --font-heading
     because Playfair-Display is being removed. The sweep in Part 2 changes
     all consumers to --font-heading. */
  --serif: var(--font-heading);
  --sans: var(--font-body);
}

body {
  font-family: var(--font-body);
  background-color: var(--color-theme-base);
  color: var(--color-theme-body);
  margin: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 500;
  margin: 0;
}

/* motion.entry — opacity 0→1, y 8→0, 250ms ease-standard */
@keyframes nza-entry {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.nza-entry {
  animation: nza-entry var(--duration-entry) var(--ease-standard) both;
}

/* The remainder of the existing IVG index.css (layout primitives, component
   classes, etc.) goes BELOW this block, unchanged for now. Part 2 sweeps it. */
```

Important: do NOT delete the existing layout primitives (`.topnav`, `.subnav`, `.dashboard-layout`, `.panel`, `.sidebar`, etc.) in this Part. The aliases mean the existing CSS keeps working. Part 2 sweeps consumers; Part 3 deletes the aliases.

1.6 **Update `eir/src/main.jsx`** to import fonts.css. Add immediately after the existing `import './index.css'`:

```jsx
import './index.css'
// fonts.css is imported via index.css's @import, but explicit import here
// ensures Vite picks it up in the dep graph for HMR.
```

(If index.css's `@import "./fonts.css"` works cleanly in dev + build, the second import is redundant — verify with `npm run build`.)

1.7 **Smoke test.**
- Run `cd eir && npm run dev` — confirm dev server starts on the configured port (5173 by default, or whatever `vite.config.js` locks)
- Open `http://localhost:5173/` — confirm:
  - Page renders without console errors
  - Body text is Inter (system fallback OK; will be Google Inter if CDN was kept)
  - Heading text is Stolzl (loads from `eir/src/fonts/stolzl/`)
  - Navy bg `#1A2440` everywhere it was `#0f1419` before (note: Phase 1A used `#0f1419`, nzai-demo uses `#1A2440`. The theme change is intentional)
  - Coral is `#E8725C` (slightly different from Phase 1A's `#e35d4a` — also intentional)
- If body fonts look wrong, restore a minimal Google Fonts CDN link in `index.html` for Inter only (keep Stolzl from `@font-face`; Inter is acceptable from Google).

1.8 **Audit doc.** Create `docs/audit/06_design_system_and_features.md` with Part 1 findings:
- Old → new colour mappings (Phase 1B's `#0f1419` → NZA Core `#1A2440`; `#e35d4a` → `#E8725C`)
- Font swap notes (Playfair → Stolzl Medium for headings; Inter stays)
- Token name changes Part 2 will sweep
- Any rendering issues seen in 1.7's smoke test

**PASS criteria:**
- `eir/src/tokens/` contains 6 files matching nzai-demo
- `eir/src/fonts/stolzl/` contains 6 `.otf` files
- `eir/src/fonts.css` exists with 6 `@font-face` declarations
- `eir/src/index.css` `:root` block contains all NZA tokens AND legacy aliases
- Dev server renders home page without console errors
- Stolzl loads (visible in Network tab in DevTools as `.otf` requests with 200 status)
- Heading text uses Stolzl (visually distinct from Inter — heavier, more geometric)
- Site-wide background is `#1A2440` not `#0f1419`
- `eir/index.html` no longer references Google Fonts CDN for Playfair Display

**Commit:**
```
Brief 6 Part 1: NZA design system foundation — tokens + Stolzl fonts

- Forklifted three-tier token system from nzai-demo into eir/src/tokens/:
  anchors, themes/theme.core, methodology, colors, fonts, motion (six files).
- Stolzl .otf files copied to eir/src/fonts/stolzl/ (six weights).
- eir/src/fonts.css declares @font-face for Stolzl (Thin/Light/Book/Medium/
  Regular/Bold) with font-display: swap.
- eir/src/index.css :root block rewritten to mirror nzai-demo's @theme block
  — design-spec 10-token type scale, editorial-register 5-token type scale,
  Tier 1 anchors, Tier 2 theme.core, Tier 3 methodology palettes, motion
  tokens. Legacy Phase 1A/1B token names preserved as aliases (--coral,
  --bg-dark, etc.) so existing components keep working; Part 2 sweeps them.
- eir/index.html: Playfair Display CDN link removed (Stolzl replaces it).
  Inter remains (system fallback or kept via CDN if rendering needs it).

Colour-theme shift: dark bg now #1A2440 (NZA Core) vs Phase 1B's #0f1419;
coral now #E8725C vs Phase 1B's #e35d4a. Intentional — aligns with NZA
design system.

No component changes yet. Part 2 sweeps raw hex out of components.
Audit doc at docs/audit/06_design_system_and_features.md.
```

---

### Part 2 — Sweep raw hex out of IVG components; everything flows through tokens

**Goal:** Every JSX file in `eir/src/` uses `var(--token-name)` or token-derived class names. Zero raw `#xxxxxx` hex codes outside `eir/src/tokens/` and `eir/src/index.css`. Falsifiability: `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx"` returns zero matches.

Also: every `font-size: NNpx` inline style maps to one of the 15 type-scale tokens (10 design-spec + 5 editorial).

**Files touched:**
- `eir/src/App.jsx` (1168 lines — bulk of the work)
- `eir/src/components/*.jsx` (nine files: DashboardLayout, DataStatusBadge, EnergyChart, MetricTile, Panel, Sidebar, SubNav, TopNav, UkMap)
- `eir/src/index.css` — delete the legacy aliases once consumers are updated (NOT before)
- `docs/audit/06_design_system_and_features.md` — append Part 2 findings

**Steps:**

2.1 **Inventory raw hex usages.**
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx" --include="*.js"
```
Capture the full list in the audit doc. Expect ~20+ usages per Brief 5 baseline finding.

2.2 **Map each raw hex to a token.** Use this mapping table (extend if new hexes appear):

| Old hex | New token | Used for |
|---|---|---|
| `#0f1419` or `#0F1419` | `var(--color-theme-base)` | dark bg |
| `#1a2740` or `#1A2740` | `var(--color-theme-base)` | navy text on cream / borders |
| `#1A2440` | `var(--color-theme-base)` | already-NZA navy |
| `#e35d4a` or `#E35D4A` | `var(--color-nza-coral)` | coral primary |
| `#cc5343` | `var(--color-theme-accent-primary)` | hover coral (use Persian Rose) |
| `#f5f1ea` or `#F5F1EA` | `var(--color-nza-cream)` | cream bg |
| `#e8e6e0` | `var(--color-theme-body)` | cream text on dark |
| `#1a1a1a` | `var(--color-theme-base)` | text on cream |
| `#8a8a8a` | `var(--color-theme-body) / 60%` (use `opacity: 0.6` or `rgba`) | muted text on dark |
| `#3eb489` | `var(--color-risk-low)` | confirmed status |
| `#e8b94e` | `var(--color-risk-moderate)` | partial status |
| `#d65c4e` | `var(--color-risk-major)` | missing status |
| `#5ba59d` or `#5BA59D` | `var(--color-scope-12)` | sage accent (or scope 1+2 colour) |
| Playfair Display / `var(--serif)` | `var(--font-heading)` | Stolzl headings |
| `'Playfair Display', ...` | `var(--font-heading)` | inline font-family |

For any hex not in the table, find the closest semantic match in the methodology palette (e.g. a green that doesn't match `--color-risk-low` exactly: use `--color-risk-low` anyway unless the value is meaningful).

2.3 **Sweep `eir/src/App.jsx` first.** This file is 1168 lines and contains the most usages. Approach:
- Read the file in 200-line chunks
- For each chunk, find every hex code and font-family inline style
- Replace with the token
- After all chunks, run `grep -n "#[0-9a-fA-F]\{3,6\}" eir/src/App.jsx` — should return zero

2.4 **Sweep each component file.** Same process:
- `DashboardLayout.jsx`
- `DataStatusBadge.jsx`
- `EnergyChart.jsx`
- `MetricTile.jsx`
- `Panel.jsx`
- `Sidebar.jsx`
- `SubNav.jsx`
- `TopNav.jsx`
- `UkMap.jsx`

Special cases:
- **Recharts**: chart fill colours often need a raw hex value rather than `var(--token)`. In these cases, read the token value at module-top and assign to a JS constant:
  ```jsx
  import { useEffect, useState } from 'react'
  // Pattern: read CSS custom property once, pass to Recharts
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const COLOR_CORAL = cssVar('--color-nza-coral') || '#E8725C'
  // ... use COLOR_CORAL in Recharts fill props
  ```
  Or simpler — define a `chart-colors.js` module under `eir/src/tokens/` that exports the hex values as JS constants alongside the CSS tokens (single source of truth, two consumers). Recommended.
- **SVG inline `fill="#..."`**: pass via prop or use CSS `fill: var(--token)`.

2.5 **Inventory inline `font-size: NNpx`.**
```bash
grep -rn "font-size:" eir/src --include="*.jsx"
```
Replace any arbitrary `NNpx` with the closest type-scale token. Mapping:

| Old size | Token | Variable |
|---|---|---|
| 10px | `--text-micro` | micro |
| 12px | `--text-xs` | extra-small |
| 13-14px | `--text-sm` | small |
| 15px | `--text-body` | editorial body |
| 16px | `--text-base` | base |
| 18px | `--text-lg` or `--text-subheading` | large / subheading |
| 20px | `--text-h4` | h4 |
| 24px | `--text-h3` | h3 |
| 28px | `--text-h2` or `--text-page-heading` | h2 / page heading |
| 36px | `--text-h1` | h1 |
| 40px | `--text-chapter` | chapter |
| 64px | `--text-display` | display |
| 72px-96px (Playfair display) | `--text-display` | display (closest token) |

Specifically: the £49,134 callout that Phase 1B set at 72px Playfair becomes `var(--text-display)` Stolzl Medium. The 4-quadrant infographic big numbers stay at `--text-chapter` (40px) per the new register.

2.6 **Delete legacy aliases from `eir/src/index.css`** once all components updated. Search for any remaining usage:
```bash
grep -rn "var(--coral)\|var(--bg-dark)\|var(--text-on-dark)\|var(--serif)\|var(--sans)\|var(--status-confirmed)\|var(--status-partial)\|var(--status-missing)\|var(--navy)" eir/src --include="*.jsx" --include="*.css"
```
Must return zero in `.jsx` files. If a few remain in `.css` (layout primitives), update those too. Then remove the alias block from `eir/src/index.css`.

2.7 **Smoke test** — boot dev server, visit:
- `/` (Portfolio Overview / landing)
- `/portfolio/map`
- `/portfolio/sites`
- `/portfolio/comparisons`
- `/site/austin-heath/overview`
- `/site/austin-heath/energy`
- `/site/austin-heath/carbon`
- `/site/austin-heath/meters` (renamed from MPANs in Brief 5)
- `/site/austin-heath/data-quality`
- `/insights/reconciliation`
- `/insights/voids`
- `/insights/data-quality`
- `/gresb`

Each page must:
- Render without console errors
- Show navy bg `#1A2440` (visible by inspecting the body element)
- Show Stolzl on headings
- Show Inter on body text
- Show coral `#E8725C` on accent elements (not the old `#e35d4a`)
- Not have any visibly broken layout from missing tokens

2.8 **Audit doc append** — Part 2 findings:
- Number of hex usages found and swept
- Any hex codes that didn't map to a token cleanly (decision per hex)
- Any inline `font-size` not mapped to type scale (decision per size)
- Legacy aliases deleted

**PASS criteria:**
- `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx"` returns ZERO matches
- `grep -rn "font-size: [0-9]" eir/src --include="*.jsx"` returns ZERO matches outside tokens
- Legacy alias block removed from `eir/src/index.css`
- All 14 routes render without console errors
- Navy bg, Stolzl headings, NZA coral visible across all pages

**Commit:**
```
Brief 6 Part 2: Token sweep — zero raw hex in components

- Swept all raw hex codes from eir/src/App.jsx (1168 lines) and the
  nine component files in eir/src/components/. Every colour now flows
  through CSS custom properties from index.css :root.
- font-size: Npx inline styles replaced with the type-scale tokens.
  No arbitrary sizes outside the 15-token scale (10 design-spec + 5
  editorial-register).
- Legacy aliases (--coral, --bg-dark, --text-on-dark, --serif, --sans,
  --status-*, --navy) deleted from index.css now that consumers updated.
- Recharts chart-fill hexes moved to eir/src/tokens/chart-colors.js as
  JS constants alongside the CSS tokens. Single source of truth.

Falsifiability:
  grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx" → 0 matches
  grep -rn "font-size: " eir/src --include="*.jsx"           → 0 matches

Audit doc at docs/audit/06_design_system_and_features.md updated.
```

---

### Part 3 — Two-bar nav + cream/dark register + left-side narrative on every page

**Goal:** The IVG ESG Tool has nzai-demo's two-bar nav with logo lockup. Site Detail pages render in the cream editorial register (cream bg, navy text, coral accents, Stolzl Medium headings); Portfolio / Insights / GRESB pages stay in the dark dashboard register (navy bg, cream text). Every page except individual Site Detail pages has a left-side explanatory narrative (2-3 sentences) explaining what the user is looking at.

**Files touched:**
- `eir/src/components/TopNav.jsx` — rewritten to match nzai-demo's two-bar pattern
- `eir/src/components/SubNav.jsx` — may merge into TopNav per nzai-demo's approach
- `eir/src/components/BodyPageLayout.jsx` (new) — cream-register wrapper for Site Detail
- `eir/src/components/DashboardLayout.jsx` — updated to act as the dark-register wrapper
- `eir/src/components/LogoLockup.jsx` (new) — three-logo lockup (IVG × NZA × Partner placeholders)
- `eir/src/App.jsx` — Site Detail pages wrap in BodyPageLayout; other pages stay in DashboardLayout. Left-side narrative blocks added per page.
- `docs/audit/06_design_system_and_features.md` — append Part 3 findings

**Steps:**

3.1 **Port the TopNav pattern from nzai-demo.** Reference: `nzai-demo/src/components/TopNav.jsx`. The pattern:
- Primary bar (top, fixed): chapter links + logo lockup right-aligned
- Secondary bar (below primary, fixed): sub-page tabs for the active chapter
- Active primary item: coral text colour
- Active secondary item: coral underline
- Empty secondary bar for chapters with no sub-pages

**Adapt for IVG's actual structure:**

Primary chapters (4):
- `portfolio` — "Portfolio"
- `site` — "Site" (greyed when no site selected; per Phase 1B behaviour)
- `insights` — "Insights"
- `gresb` — "GRESB"

Secondary tabs per chapter:
- Portfolio: `[map, sites, comparisons]` (Overview removed — Map is the new default per design note D6)
- Site: `[overview, energy, carbon, meters, data-quality]`
- Insights: `[reconciliation, voids, data-quality]`
- GRESB: `[]` (single page)

**Implementation:** rewrite `TopNav.jsx`. Plain CSS, not Tailwind. Use the token system. The route logic and current-page detection stay (existing `useLocation` from App.jsx). The visual rewrite follows nzai-demo's pattern but using:
- Background: cream `var(--color-nza-cream)` when on a cream-register page; dark `var(--color-theme-base)` when on a dark-register page. The wrapper decides; TopNav reads via prop.
- Primary nav text: `var(--color-theme-base)` on cream, `var(--color-theme-body)` on dark; active = `var(--color-nza-coral)`
- Secondary nav: same colour rules; active = coral underline
- Logo lockup: three rectangles labelled "IVG", "Net Zero Advisory", "Partner Logo" (placeholders) — see step 3.2

`SubNav.jsx` can either be merged into TopNav (cleaner) or kept as a separate component called by TopNav. Recommended: merge.

3.2 **Create `eir/src/components/LogoLockup.jsx`** matching nzai-demo's `LogoLockup` sub-component:

```jsx
/**
 * LogoLockup — three placeholder rectangles. Replace with real SVG
 * imports when client/partner logos arrive. Rendered right-aligned
 * in the primary nav bar.
 */
export default function LogoLockup({ theme = 'cream' }) {
  const textColor = theme === 'cream'
    ? 'var(--color-theme-base)'
    : 'var(--color-theme-body)';
  const borderColor = theme === 'cream'
    ? 'rgba(26, 36, 64, 0.3)'
    : 'rgba(237, 229, 216, 0.3)';
  const divColor = theme === 'cream'
    ? 'rgba(26, 36, 64, 0.2)'
    : 'rgba(237, 229, 216, 0.2)';

  const labelStyle = {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: textColor,
    border: `1px solid ${borderColor}`,
    padding: '4px 8px',
    borderRadius: '4px',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} aria-label="Co-brand lockup">
      <span style={labelStyle}>IVG</span>
      <span style={{ color: divColor, fontWeight: 300 }}>×</span>
      <span style={labelStyle}>Net Zero Advisory</span>
      <span style={{ color: divColor, fontWeight: 300 }}>×</span>
      <span style={labelStyle}>Partner Logo</span>
    </div>
  );
}
```

3.3 **Create `eir/src/components/BodyPageLayout.jsx`** — cream-register wrapper for Site Detail pages. Reference: `nzai-demo/src/components/BodyPageLayout.jsx`:

```jsx
import TopNav from './TopNav';

/**
 * BodyPageLayout — cream-register page wrapper. Used for Site Detail
 * pages where the editorial register applies. Cream background, navy
 * text, coral accents, Stolzl Medium headings, five-token type scale.
 *
 * Per Brief 6 / design note D6.
 */
export default function BodyPageLayout({ children, activePrimary, activeSecondary, currentSiteId, onNavigate }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-nza-cream)',
      color: 'var(--color-theme-base)',
      paddingTop: 'calc(var(--topnav-height) + var(--subnav-height))',
    }}>
      <TopNav
        theme="cream"
        activePrimary={activePrimary}
        activeSecondary={activeSecondary}
        currentSiteId={currentSiteId}
        onNavigate={onNavigate}
      />
      <main style={{ maxWidth: 'var(--app-content-max-width)', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
```

3.4 **Update `eir/src/components/DashboardLayout.jsx`** — the dark-register wrapper. Phase 1B already established this; update to:
- Use `var(--color-theme-base)` for bg, `var(--color-theme-body)` for text
- Pass `theme="dark"` to TopNav
- Use the same `paddingTop` to account for the two-bar nav

3.5 **Site Detail pages → BodyPageLayout.** In `App.jsx`, the routing currently wraps everything in DashboardLayout. Update so:
- Routes matching `/site/{siteId}/{subTab}` use `<BodyPageLayout>` instead
- All other routes stay in `<DashboardLayout>`

This is the key visual differentiation: when the user clicks into a Site, the chrome shifts from dark (estate-level view) to cream (site-level deep-dive), matching EOC's pattern where Inventory > Map is dark and Explainers > Carbon Accounting is cream.

3.6 **Add left-side explanatory narrative to every non-Site-Detail page.** The pattern: 2-3 sentences positioned to the left of the main content, in `var(--font-body)`, `var(--text-body)` size, `var(--color-theme-body)` colour with 70% opacity on dark register or `var(--color-theme-base)` at 70% on cream. Coral-uppercase eyebrow above ("PORTFOLIO MAP", "DATA QUALITY", etc.) per nzai-demo's Home page pattern.

Page-by-page narrative text (Chris approved these; write verbatim, no improvising):

- **Portfolio > Map (the new default landing)**
  - Eyebrow: "PORTFOLIO MAP"
  - Heading: "13 retirement villages under operational control."
  - Body: "Every dot is a site. Switch theme to recolour the leaderboard and resize the map dots — energy in kWh, water in m³, waste in tonnes, carbon in tCO₂e. Hover any row or dot for a quick preview. Click to drill into the site."

- **Portfolio > Sites**
  - Eyebrow: "ALL SITES"
  - Heading: "Every site, every metric."
  - Body: "Sortable table view of the full portfolio. Status badges per metric show what's confirmed, partial, or pending. Click any row to drill into Site Detail."

- **Portfolio > Comparisons**
  - Eyebrow: "SITE COMPARISON"
  - Heading: "Two sites, side by side."
  - Body: "Pick any two villages and compare GIA, energy, carbon intensity, and data quality. The monthly chart below stacks both sites' consumption to surface seasonal patterns."

- **Insights > Reconciliation**
  - Eyebrow: "RECONCILIATION"
  - Heading: "Ecotricity billing vs arbnco totals."
  - Body: "The gap between landlord billing and total estate consumption is the resident energy IVG doesn't bill. About 3.9 GWh annually — the Scope 3 Cat 13 boundary the GHG inventory needs to define."

- **Insights > Voids**
  - Eyebrow: "VOID COST"
  - Heading: "82 high-consumption voids."
  - Body: "Empty apartments billing IVG £49,134/year through landlord meters. Click any site row to see the offending MPANs. Re-letting or sub-metering each saves ~£600/year."

- **Insights > Data quality**
  - Eyebrow: "DATA COMPLETENESS"
  - Heading: "13 sites × 4 metrics."
  - Body: "The heatmap surfaces what's confirmed, partial, or missing across the portfolio. The RFI list on the right tracks every outstanding question with IVG — 27 items across themes A through F."

- **GRESB**
  - Eyebrow: "GRESB READINESS 2026"
  - Heading: "Score target: 52 → 62 by July."
  - Body: "Five indicators tracked: data coverage, policies, green leases, ESG fit-out guides, BREEAM In-Use certifications. The full scorecard arrives in the next phase of work — this preview shows progress to date."

**Layout pattern for the narrative**: 40/60 split. Narrative left in a `max-width: 480px` column; main content (chart, table, map) takes the remaining 60% to the right. On the Map page specifically, the narrative goes ABOVE the leaderboard+map grid, not to the left — because the leaderboard IS the left column. See step 3.7.

3.7 **Map page layout special case.** Per design note D6, the new `/portfolio/map` becomes the default landing. Layout:

```
+-------------------------------------------------------+
| TopNav primary + secondary                            |
+-------------------------------------------------------+
|                                                       |
| [Narrative block, full width, max 800px, centred]    |
| Eyebrow: PORTFOLIO MAP                                |
| Heading: 13 retirement villages...                    |
| Body: Every dot is a site...                          |
|                                                       |
| [Theme pills: Overview | Energy | Water | Waste |    |
|                Carbon | Data quality]                 |
| [Sub-metric pills based on active theme]              |
|                                                       |
| +-------------+  +---------------------------+        |
| | Leaderboard |  |  UK Map (dotted SVG)     |        |
| | 13 rows     |  |  with pulsing markers     |        |
| | sorted by   |  |                           |        |
| | active      |  |                           |        |
| | metric      |  |                           |        |
| +-------------+  +---------------------------+        |
|                                                       |
| [Compact totals strip: ⚡ 4.5M kWh · 🔥 7.6M kWh ·  |
|  💧 18k m³ · ♻️ 145 t · 3.45k tCO₂e]                |
+-------------------------------------------------------+
```

Part 4 builds the leaderboard+map; Part 3's job here is just the surrounding layout — narrative block above, totals strip below. Use a placeholder rectangle for the leaderboard+map until Part 4.

3.8 **The 4-quadrant infographic landing (`/portfolio/overview`) is removed.** Route `/` and `/portfolio/overview` redirect to `/portfolio/map`. Add the redirect in App.jsx's routing logic. The 4-quadrant component code can be deleted (Phase 1B chunk-13). The totals strip on the new Map page preserves the 4 portfolio numbers in compact form.

3.9 **Audit doc append** — Part 3 findings:
- TopNav merged with SubNav (or kept separate, document choice)
- Logo lockup placeholder strategy
- BodyPageLayout vs DashboardLayout decision per route
- Left-side narrative text verbatim per page

**PASS criteria:**
- Two-bar nav visible on every route — primary bar with logo lockup right-aligned, secondary bar with sub-tabs
- Portfolio / Insights / GRESB use dark register (navy bg, cream text)
- Site Detail (`/site/{id}/*`) uses cream register (cream bg, navy text, coral accents)
- Every non-Site-Detail page has the eyebrow + heading + body narrative block per step 3.6
- `/` and `/portfolio/overview` redirect to `/portfolio/map`
- Map page layout has narrative above, leaderboard+map placeholder in middle, totals strip below
- All routes still render without errors

**Commit:**
```
Brief 6 Part 3: Two-bar nav + cream/dark register + page narratives

- TopNav rewritten to nzai-demo's two-bar pattern (primary + secondary).
  IVG primary chapters: Portfolio | Site | Insights | GRESB. Site greyed
  until a site selected (Phase 1B behaviour preserved).
- LogoLockup component (IVG × NZA × Partner placeholders) right-aligned
  on primary bar. Theme-aware: cream on cream-register, faded-on-dark
  on dark-register.
- BodyPageLayout (new) wraps Site Detail in cream register: cream bg,
  navy text, coral accents, Stolzl Medium headings, five-token editorial
  type scale.
- DashboardLayout (existing, updated) wraps Portfolio / Insights / GRESB
  in dark register: navy bg, cream text.
- Every non-Site-Detail page gains an eyebrow + heading + body narrative
  block per design note D6. Text verbatim from brief (Chris-approved).
- /portfolio/overview removed; / and /portfolio/overview redirect to
  /portfolio/map (new default landing). Four-quadrant infographic
  component deleted (Phase 1B chunk-13 → archived).
- Map page placeholder layout: narrative above, leaderboard+map placeholder
  middle, totals strip below. Part 4 fills the placeholder.

Audit doc updated.
```

---

### Part 4 — EOC Map module port to Portfolio > Map

**Goal:** The placeholder on the new `/portfolio/map` becomes the live leaderboard-driven multi-theme map per `docs/briefs/MAP_MODULE_HANDOFF.md` and the design note. 13 IVG sites, 6 themes (Overview, Energy, Water, Waste, Carbon, Data quality), Total/Per Unit/Per m² toggle, click-to-drill navigates to Site Detail.

**Critical reference:** `docs/briefs/MAP_MODULE_HANDOFF.md` — read in full before this Part. The handoff has the full EOC source code pasted inline; this Part adapts it for IVG.

**Files touched:**
- `eir/src/components/PortfolioMap.jsx` (new) — top-level component, leaderboard + map + state, replaces the placeholder
- `eir/src/components/portfolio/Leaderboard.jsx` (new) — extracted per handoff Section 10's file checklist
- `eir/src/components/portfolio/MapMarkers.jsx` (new) — the SVG outline + absolute-positioned markers
- `eir/src/components/portfolio/SiteHoverCard.jsx` (new) — hover preview card
- `eir/src/components/portfolio/TotalsStrip.jsx` (new) — compact 5-metric strip below the map
- `eir/src/lib/mapThemes.js` (new) — the 6-theme `MAP_CATEGORIES` config object
- `eir/src/lib/projection.js` (new) — `latLngToPercent` + per-site nudge table (hand-calibrated per design note D4)
- `eir/src/tokens/chart-colors.js` — may add new entries for map theme accents
- `eir/src/App.jsx` — wire `<PortfolioMap>` into the `/portfolio/map` route, replacing the placeholder from Part 3
- `eir/package.json` — add `framer-motion: ^12.38.0` dependency
- `docs/audit/06_design_system_and_features.md` — append Part 4 findings + per-site nudge calibration record

**Steps:**

4.1 **Add `framer-motion` to `package.json`.** Edit the file directly to add `"framer-motion": "^12.38.0"` to `dependencies`. Do NOT run `npm install` — per CLAUDE.md, Chris runs it locally. Log this in STATUS.md so Chris knows to install before testing.

**Fallback:** if `framer-motion` is not resolvable at build/dev time, gracefully degrade to CSS keyframe transitions using the existing `nza-entry` keyframe + a custom `nza-row-shift` keyframe for the leaderboard reorder. Per handoff Section 10 — "If you must avoid framer-motion, look at the FLIP technique or hand-rolled CSS before falling back to no animation". For Brief 6 first iteration, the CSS fallback is acceptable; the framer-motion version is the upgrade once npm install runs.

4.2 **Build `mapThemes.js` per design note D2.** Six themes, each with: `id`, `label`, `color` (accent), `metrics` (array of sub-metrics), `toggles` (array of allowed Total/Per Unit/Per m² values), and a `desc` string for the strap line. Use the existing JSON files (`portfolio.json`, `energy.json`, `water.json`, `waste.json`, `carbon.json`) as data sources.

Spec for each theme (write verbatim — derived from design note D2 + D3):

```js
export const MAP_CATEGORIES = [
  {
    id: 'overview',
    label: 'Overview',
    color: 'var(--color-categorical-estate)',  // navy-grey
    toggles: [],
    metrics: [
      {
        key: 'units',
        label: 'Units',
        desc: 'Total dwelling count per site',
        accessor: (site) => site.identity?.total_units || 0,
        format: (v) => v.toLocaleString('en-GB'),
        unit: 'units',
        render: 'bar',
      },
      {
        key: 'gia',
        label: 'GIA',
        desc: 'Gross internal area (m²)',
        accessor: (site) => site.identity?.total_gia_m2 || 0,
        format: (v) => `${Math.round(v / 1000)}k`,
        unit: 'm²',
        render: 'bar',
      },
      {
        key: 'heating_archetype',
        label: 'Heating',
        desc: 'Heating system archetype',
        accessor: (site) => site.identity?.heating_archetype || '—',
        format: (v) => v,
        unit: '',
        render: 'icons',  // single icon per site, coloured by archetype
        categorical: true,
      },
      {
        key: 'grid_type',
        label: 'Grid type',
        desc: 'Connection model: bulk (microgrid) or DNO (individual MPANs)',
        accessor: (site) => site.identity?.grid_type || '—',
        format: (v) => v,
        unit: '',
        render: 'icons',
        categorical: true,
      },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    color: 'var(--color-nza-coral)',
    toggles: ['total', 'perUnit', 'perM2'],
    metrics: [
      {
        key: 'total_energy_kwh',
        label: 'Total energy',
        desc: 'Combined electricity + gas (kWh, CY2025)',
        accessor: (site, energy) => (energy.total_electricity_kwh || 0) + (energy.total_gas_kwh || 0),
        format: (v) => `${(v/1000).toFixed(0)}k`,
        unit: 'kWh',
        render: 'bar',
      },
      {
        key: 'electricity_kwh',
        label: 'Electricity',
        desc: 'Landlord electricity (kWh, CY2025)',
        accessor: (site, energy) => energy.total_electricity_kwh || 0,
        format: (v) => `${(v/1000).toFixed(0)}k`,
        unit: 'kWh',
        render: 'bar',
      },
      {
        key: 'gas_kwh',
        label: 'Gas',
        desc: 'Bulk gas (kWh, CY2025)',
        accessor: (site, energy) => energy.total_gas_kwh || 0,
        format: (v) => `${(v/1000).toFixed(0)}k`,
        unit: 'kWh',
        render: 'bar',
        filter: (site, energy) => (energy.total_gas_kwh || 0) > 0,  // hide all-electric sites
      },
      {
        key: 'energy_intensity',
        label: 'Per m²',
        desc: 'Total energy per gross internal area (kWh/m²)',
        accessor: (site, energy) => {
          const total = (energy.total_electricity_kwh || 0) + (energy.total_gas_kwh || 0);
          const gia = site.identity?.total_gia_m2 || 1;
          return total / gia;
        },
        format: (v) => v.toFixed(0),
        unit: 'kWh/m²',
        render: 'gridBar',  // traffic-light: low (green) → high (red)
        intensity: true,  // Total/Per-Unit toggle doesn't affect this
      },
    ],
  },
  {
    id: 'water',
    label: 'Water',
    color: 'var(--color-scope-12)',  // teal — water reads as teal in IVG palette
    toggles: ['total', 'perUnit'],
    metrics: [
      {
        key: 'water_m3',
        label: 'Total water',
        desc: 'Annual water consumption (m³, CY2025 where known)',
        accessor: (site, energy, water) => water.consumption_m3 || 0,
        format: (v) => `${(v/1000).toFixed(1)}k`,
        unit: 'm³',
        render: 'bar',
      },
      {
        key: 'water_quality',
        label: 'Data quality',
        desc: 'Coverage and confidence of water consumption data',
        accessor: (site, energy, water) => {
          const status = water.data_status;
          if (status === 'confirmed') return 100;
          if (status === 'partial') return 50;
          return 0;
        },
        format: (v) => `${v}%`,
        unit: '',
        render: 'gridBar',
      },
    ],
  },
  {
    id: 'waste',
    label: 'Waste',
    color: 'var(--color-categorical-commuting)',  // amber
    toggles: ['total', 'perUnit'],
    metrics: [
      {
        key: 'waste_tonnes',
        label: 'Total tonnage',
        desc: 'Annual waste tonnage (t, CY2025 where known)',
        accessor: (site, energy, water, waste) => waste.tonnage_total || 0,
        format: (v) => v.toFixed(1),
        unit: 't',
        render: 'bar',
      },
      {
        key: 'diversion',
        label: 'Diversion',
        desc: 'Percentage of waste diverted from landfill',
        accessor: (site, energy, water, waste) => (waste.diversion_rate || 0) * 100,
        format: (v) => `${v.toFixed(0)}%`,
        unit: '',
        render: 'gridBar',
      },
    ],
  },
  {
    id: 'carbon',
    label: 'Carbon',
    color: 'var(--color-scope-3)',  // purple — Scope 3 colour from methodology
    toggles: ['total', 'perM2', 'perUnit'],
    metrics: [
      {
        key: 'total_tco2e',
        label: 'Total tCO₂e',
        desc: 'Combined Scope 1+2+3 emissions (tCO₂e, CY2025)',
        accessor: (site, energy, water, waste, carbon) => carbon.total_actual_tco2e || 0,
        format: (v) => v.toFixed(0),
        unit: 'tCO₂e',
        render: 'bar',
      },
      {
        key: 'scope_breakdown',
        label: 'By scope',
        desc: 'Scope 1 (gas) · Scope 2 (electricity) · Scope 3 (residents)',
        accessor: (site, energy, water, waste, carbon) => [
          { label: 'Scope 1', value: carbon.scope_1_tco2e || 0 },
          { label: 'Scope 2', value: carbon.scope_2_tco2e || 0 },
          { label: 'Scope 3', value: carbon.scope_3_cat13_tco2e || 0 },
        ],
        format: (v) => v.toFixed(0),
        unit: 'tCO₂e',
        render: 'stacked',
      },
      {
        key: 'intensity_per_m2',
        label: 'Per m²',
        desc: 'Carbon intensity per gross internal area (kgCO₂e/m²)',
        accessor: (site, energy, water, waste, carbon) => (carbon.intensity_per_m2_gia || 0) * 1000,  // tCO2e/m² → kgCO2e/m²
        format: (v) => v.toFixed(0),
        unit: 'kgCO₂e/m²',
        render: 'gridBar',
        intensity: true,
      },
    ],
  },
  {
    id: 'data-quality',
    label: 'Data quality',
    color: 'var(--color-categorical-supply-chain)',  // dark teal
    toggles: [],
    metrics: [
      {
        key: 'completeness',
        label: 'Completeness',
        desc: 'Percentage of metrics (Elec, Gas, Water, Waste) confirmed for this site',
        accessor: (site, energy, water, waste) => {
          let count = 0, total = 4;
          if (energy.data_status_electricity === 'confirmed') count++;
          if (energy.data_status_gas === 'confirmed' || !energy.has_gas) count++;  // no gas = complete
          if (water.data_status === 'confirmed') count++;
          if (waste.data_status === 'confirmed') count++;
          return (count / total) * 100;
        },
        format: (v) => `${v.toFixed(0)}%`,
        unit: '',
        render: 'gridBar',  // traffic-light per site
      },
    ],
  },
];
```

4.3 **Build `projection.js`** with hand-calibrated positions per design note D4. The 13 sites and their lat/lon are in `pipeline/site_coordinates.json`. Calibrate by:
- Project lat/lon to percent of SVG viewBox (Option A from handoff Section 10 as starting point)
- Render the map with markers
- Inspect each marker in browser — does it land on the right town? If off by more than ~3% in either axis, add a per-site `dx/dy` nudge
- After ~30 minutes of calibration, all 13 sites land visibly correctly on the UK SVG

Output: a single function `getMarkerPosition(siteId)` returning `{x: percent, y: percent}` per site. Internally either projects lat/lon + applies nudges (Option A) or returns hand-coded percentages (Option B). Recommend Option B for 13 sites — cleaner and bulletproof.

```js
// Calibrated by eye against eir/public/maps/uk-dotted-map.svg viewBox.
// If the SVG is replaced, re-calibrate these percentages.
export const SITE_POSITIONS = {
  'austin-heath':     { x: 52.0, y: 53.0 },
  'gifford-lea':      { x: 44.5, y: 47.5 },
  'ledian-gardens':   { x: 64.0, y: 70.0 },
  'bramshott-place':  { x: 51.0, y: 71.0 },
  'durrants-village': { x: 53.5, y: 67.5 },
  'millbrook-village':{ x: 53.0, y: 60.0 },
  'great-alne-park':  { x: 50.0, y: 56.0 },
  'elderswell':       { x: 56.5, y: 56.5 },
  'millfield-green':  { x: 56.0, y: 51.5 },
  'ampfield-meadows': { x: 49.0, y: 73.0 },
  'sonning-common':   { x: 56.5, y: 65.0 },
  'blendworth-hills': { x: 53.0, y: 73.0 },
  'edwalton-office':  { x: 54.5, y: 47.0 },
};
// These values are starting points; Claude Code calibrates against the
// actual SVG during Part 4 build and updates this table.
```

4.4 **Build `Leaderboard.jsx`.** Per handoff Section 3 + the design note. Adapt EOC's pattern:
- Rows sorted by current metric's accessor value, descending
- Each row: site name (left) + horizontal bar (middle) + numeric value (right)
- Active row highlighted on hover
- Click row → navigate to `/site/{siteId}/overview`
- Cross-talk: hovering a row sets `hoveredSiteId` in shared state; the map dot scales up to indicate
- Filter applied per metric (e.g. Energy > Gas hides all-electric sites)
- For `render: 'stacked'`, render coloured segments per breakdown item
- For `render: 'gridBar'`, colour the bar by value (green low → red high, or reversed for "diversion")
- For `render: 'icons'` with categorical data (heating archetype), show a coloured icon — e.g. small circle keyed to archetype

Use framer-motion's `layout` prop on each row (or CSS fallback) for the reorder animation when theme changes.

4.5 **Build `MapMarkers.jsx`.** Per handoff Section 4. Adapt EOC's pattern:
- `<img src="/maps/uk-dotted-map.svg">` at 100% width, `object-contain`
- Map markers absolutely positioned on top, percentages from `SITE_POSITIONS`
- Outer pulse halo: animated via Tailwind's `animate-ping` (not available in plain CSS — use a custom CSS keyframe with `transform: scale(1) → scale(1.6)` and `opacity: 0.5 → 0` over 2 seconds, infinite)
- Inner dot: 12×12 px filled with current theme's `color`, with `box-shadow` glow
- Hover: scale inner dot to 1.4
- Selected (hover or hover-from-leaderboard): scale + colour shift to white inner with theme-colour halo
- Click: navigate to `/site/{siteId}/overview`

4.6 **Build `SiteHoverCard.jsx`.** A floating card that appears on hover (3-4 stats per design note Q3 answer). Anchored above the dot OR beside the leaderboard row (whichever the user is hovering).

Stats to show:
- Site name (Stolzl Medium)
- Units count + GIA
- Total energy (kWh)
- Active theme's current metric value (re-emphasise what the row/dot is sorted by)
- Data quality summary (4 small badges: Elec, Gas, Water, Waste, each green/amber/red/grey)

4.7 **Build `TotalsStrip.jsx`.** Compact bottom strip per design note D6:

```
[⚡ 4.5M kWh · 🔥 7.6M kWh · 💧 18k m³ · ♻️ 145 t · 3.45k tCO₂e]
```

Plain row of 5 metrics, each with a small icon (use `lucide-react`'s `Zap`, `Flame`, `Droplets`, `Recycle`, `Wind`). Reads from `portfolio.json`. No interactivity — display only.

4.8 **Wire `PortfolioMap.jsx`** together — the top-level component. State:
- `activeCategoryId` (default: `'energy'` per design note Q2 — first-impression theme)
- `activeMetricKey` (default: first metric of active category)
- `toggleMode` (default: `'total'`)
- `hoveredSiteId` (default: `null`)
- `selectedSiteId` (for click-to-drill, redirects to Site Detail)

Layout per Part 3's step 3.7. The narrative block stays from Part 3; the leaderboard + map placeholder gets replaced by `<Leaderboard />` and `<MapMarkers />`. `<TotalsStrip />` below.

4.9 **Audit doc append** — Part 4 findings:
- Site position calibration record (final SITE_POSITIONS table)
- Theme config decisions per metric
- `framer-motion` install state (added to package.json; pending Chris npm install)
- CSS-keyframe fallback used or not
- Cross-talk leaderboard ↔ map wiring approach

**PASS criteria:**
- `/portfolio/map` renders the full map view (no longer the placeholder)
- Default theme: Energy. Default metric: Total energy.
- All 13 sites visible in leaderboard, sorted descending by Total energy (Millfield Green, Gifford Lea, Ampfield Meadows likely top 3)
- All 13 dots visible on the UK SVG at approximately correct geographic positions
- Switching theme re-sorts the leaderboard and re-colours the dots
- Switching Total → Per Unit re-normalises and re-sorts
- Hovering a row scales the corresponding map dot up
- Hovering a dot highlights the corresponding row
- Clicking a row OR dot navigates to `/site/{siteId}/overview`
- Hover card shows 4-5 stats on dot hover
- Totals strip shows portfolio numbers at bottom
- `/` and `/portfolio/overview` still redirect to `/portfolio/map` (from Part 3)
- No console errors

**Commit:**
```
Brief 6 Part 4: EOC map module ported to Portfolio > Map

- PortfolioMap.jsx (new top-level) + Leaderboard.jsx + MapMarkers.jsx
  + SiteHoverCard.jsx + TotalsStrip.jsx wired into /portfolio/map.
- Six themes per design note D2: Overview, Energy, Water, Waste, Carbon,
  Data quality. Each with 2-4 sub-metrics. Theme config in
  eir/src/lib/mapThemes.js.
- Three-way toggle Total / Per Unit / Per m² per theme; each theme declares
  which toggles apply. Per design note D3.
- Hand-calibrated site positions per design note D4 in
  eir/src/lib/projection.js. SITE_POSITIONS exports {x, y} percentages for
  all 13 sites.
- Leaderboard ↔ map cross-talk: hover row highlights dot, hover dot
  highlights row. Click either → navigate to /site/{id}/overview per design
  note D7.
- framer-motion added to package.json (^12.38.0). Pending Chris npm install
  locally. CSS-keyframe fallback (`nza-row-shift`) used until install runs.
- TotalsStrip (compact 5-metric strip below map) preserves Phase 1B's 4
  portfolio numbers + carbon total in editorial register.

Read MAP_MODULE_HANDOFF.md Section 9 gotchas: marker overlap mitigation
applied via reduced pulse radius. Calibration log in audit doc.
```

---

### Part 5 — Stark reader fix + half-hourly Load Inspector port

**Goal:** The Stark half-hourly reader handles the actual Stark export format (3 columns `Date (D/M/YYYY), Time, Value`, descending chronology, no day-of-week prefix). 9 of 12 MPANs in `pipeline/source-data/` are processed into per-MPAN JSON at `pipeline/dist/eir/half_hourly/{mpan}.json` with pre-computed aggregates per `LOAD_INSPECTOR_HANDOFF.md` Section 3.2. The 3 missing MPANs (Bramshott Clubhouse, Ampfield Energy Centre, Ampfield Main) appear in `half_hourly_index.json` with a `pending: true` flag. The Load Inspector component is built per the handoff (6 of 8 views: Overview, Time Series, Daily Profile, Monthly, Duration Curve, Heat Map, Data Quality — Weather and Assembly Provenance skipped per handoff Section 10). It's wired into `Site Detail > Energy > Half-hourly` toggle for the 9 MPANs that have data.

**Critical reference:** `docs/briefs/LOAD_INSPECTOR_HANDOFF.md` — read in full before this Part. The handoff has the full PABLO source pasted inline; this Part adapts it for IVG.

**Files touched:**
- `pipeline/readers/read_half_hourly.py` — rewritten to handle actual Stark format
- `pipeline/dist/eir/half_hourly/*.json` (9 new files, one per MPAN with data)
- `pipeline/dist/eir/half_hourly_index.json` (rewritten with 9 ready + 3 pending entries)
- `eir/src/components/LoadInspector/LoadInspector.jsx` (new top-level)
- `eir/src/components/LoadInspector/views/OverviewView.jsx` (new)
- `eir/src/components/LoadInspector/views/TimeSeriesView.jsx` (new)
- `eir/src/components/LoadInspector/views/DailyProfileView.jsx` (new)
- `eir/src/components/LoadInspector/views/MonthlyView.jsx` (new)
- `eir/src/components/LoadInspector/views/DurationCurveView.jsx` (new)
- `eir/src/components/LoadInspector/views/HeatMapView.jsx` (new)
- `eir/src/components/LoadInspector/views/DataQualityView.jsx` (new)
- `eir/src/components/LoadInspector/MonthJumpButtons.jsx` (new — shared month-pill component)
- `eir/src/lib/loadInspectorTransforms.js` (new — pure transforms ported per handoff Section 10)
- `eir/src/App.jsx` — Site Detail > Energy gets a Monthly / Half-hourly toggle; when toggled to HH, render `<LoadInspector>`
- `docs/audit/06_design_system_and_features.md` — append Part 5 findings

**Steps:**

5.1 **Rewrite `pipeline/readers/read_half_hourly.py`** to handle the actual Stark format. The change:

```python
def parse_stark_csv(csv_path: Path) -> tuple[list[float], datetime, int]:
    """Parse a Stark consumption export.
    
    Actual Stark format (verified May 2026):
        Date (D/M/YYYY),Time,Value
        07/02/2026,00:30,0.0
        ...
        02/04/2024,00:00,21.3
    
    - Three columns, not two
    - Date and Time in separate columns
    - No day-of-week prefix
    - DESCENDING chronology (latest reading first)
    - Date format: DD/MM/YYYY
    - Time format: HH:MM (HH-ending convention: 00:30 = 00:00-00:30 period)
    
    Returns:
        (hh_data, start_date, period_count)
        hh_data is ASCENDING chronological order (chronologically first → last)
        start_date is the timestamp of the first sample
        period_count is len(hh_data)
    """
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Detect columns. Header may be 'Date (D/M/YYYY)' or 'Date' or 'DateTime'.
        date_col = next((k for k in reader.fieldnames if 'date' in k.lower()), None)
        time_col = next((k for k in reader.fieldnames if 'time' in k.lower()), None)
        value_col = next((k for k in reader.fieldnames if 'value' in k.lower() or 'consumption' in k.lower() or 'kwh' in k.lower()), None)
        if not (date_col and time_col and value_col):
            raise ValueError(f"Stark CSV columns not recognised in {csv_path.name}: {reader.fieldnames}")
        
        for row in reader:
            try:
                d = datetime.strptime(row[date_col].strip(), '%d/%m/%Y')
                t_parts = row[time_col].strip().split(':')
                hour, minute = int(t_parts[0]), int(t_parts[1])
                # HH-ending: 00:30 means 00:00-00:30. Index by start-of-period.
                # So 00:30 indexes the half-hour ending at 00:30 (start at 00:00).
                # Adjust to start-of-period timestamp.
                ts = d.replace(hour=hour, minute=minute) - timedelta(minutes=30)
                val = float(row[value_col])
                rows.append((ts, val))
            except (ValueError, KeyError) as e:
                # Skip bad rows; log for diagnosis but don't crash
                continue
    
    # Sort ascending (Stark gives descending)
    rows.sort(key=lambda r: r[0])
    
    if not rows:
        raise ValueError(f"No valid rows parsed from {csv_path.name}")
    
    start_date = rows[0][0]
    hh_data = [r[1] for r in rows]
    return hh_data, start_date, len(hh_data)
```

Test it on each of the 9 CSVs. Each should produce ~32,500 rows (2 years × 365 × 48 = 35,040 expected; ~32,500 actual implies some gaps which is expected for real data). Log the actual count per MPAN to STATUS.md.

5.2 **Pre-compute aggregates per LOAD_INSPECTOR_HANDOFF.md Section 3.2.** For each MPAN's HH data, compute:

```python
def compute_aggregates(hh_data: list[float], start_date: datetime) -> dict:
    """Compute the pre-aggregated stats / monthly / daily-profile blocks
    that the Load Inspector component reads. Per LOAD_INSPECTOR_HANDOFF.md
    Section 3.2."""
    n = len(hh_data)
    if n == 0:
        return {'stats': {}, 'monthly': {}, 'daily_profile': {}}
    
    # Basic stats
    valid = [v for v in hh_data if v is not None and not math.isnan(v)]
    peak = max(valid) if valid else 0
    mean = sum(valid) / len(valid) if valid else 0
    annual_kwh = sum(valid) * 0.5  # HH samples are kW; × 0.5 = kWh per period
    load_factor = mean / peak if peak else 0
    period_count = n
    missing = n - len(valid)
    zero_count = sum(1 for v in valid if v == 0)
    
    # Weekday / weekend mean
    weekday_vals, weekend_vals = [], []
    periods_per_day = 48
    days = n // periods_per_day
    for day_idx in range(days):
        d = start_date + timedelta(days=day_idx)
        is_weekend = d.weekday() >= 5
        for p in range(periods_per_day):
            idx = day_idx * periods_per_day + p
            if idx >= n: break
            v = hh_data[idx]
            if v is None: continue
            (weekend_vals if is_weekend else weekday_vals).append(v)
    weekday_mean = sum(weekday_vals) / len(weekday_vals) if weekday_vals else 0
    weekend_mean = sum(weekend_vals) / len(weekend_vals) if weekend_vals else 0
    
    # Monthly buckets — for a 2-year dataset, average per calendar month
    monthly_kwh = [0.0] * 12
    monthly_count = [0] * 12
    monthly_peak = [0.0] * 12
    for day_idx in range(days):
        d = start_date + timedelta(days=day_idx)
        m = d.month - 1
        for p in range(periods_per_day):
            idx = day_idx * periods_per_day + p
            if idx >= n: break
            v = hh_data[idx]
            if v is None: continue
            monthly_kwh[m] += v * 0.5
            monthly_count[m] += 1
            if v > monthly_peak[m]: monthly_peak[m] = v
    # Average across years if 2 years of data
    years_covered = max(1, days // 365)
    monthly_kwh_avg = [k / years_covered for k in monthly_kwh]
    monthly_mean = [
        (monthly_kwh[m] / 0.5) / monthly_count[m] if monthly_count[m] else 0
        for m in range(12)
    ]
    
    # Daily profile — weekday and weekend
    weekday_profile = [0.0] * 24
    weekend_profile = [0.0] * 24
    weekday_count_per_hour = [0] * 24
    weekend_count_per_hour = [0] * 24
    for day_idx in range(days):
        d = start_date + timedelta(days=day_idx)
        is_weekend = d.weekday() >= 5
        for p in range(periods_per_day):
            idx = day_idx * periods_per_day + p
            if idx >= n: break
            v = hh_data[idx]
            if v is None: continue
            hour = p // 2
            if is_weekend:
                weekend_profile[hour] += v
                weekend_count_per_hour[hour] += 1
            else:
                weekday_profile[hour] += v
                weekday_count_per_hour[hour] += 1
    weekday_24h = [
        weekday_profile[h] / weekday_count_per_hour[h] if weekday_count_per_hour[h] else 0
        for h in range(24)
    ]
    weekend_24h = [
        weekend_profile[h] / weekend_count_per_hour[h] if weekend_count_per_hour[h] else 0
        for h in range(24)
    ]
    
    return {
        'stats': {
            'peak_kw': round(peak, 1),
            'mean_kw': round(mean, 1),
            'annual_kwh': round(annual_kwh / years_covered, 0),  # annualised
            'load_factor': round(load_factor, 3),
            'weekday_mean': round(weekday_mean, 1),
            'weekend_mean': round(weekend_mean, 1),
            'duration_days': days,
            'coverage': round(len(valid) / n, 3) if n else 0,
            'period_count': period_count,
            'missing_periods': missing,
            'zero_periods': zero_count,
            'years_covered': years_covered,
        },
        'monthly': {
            'kwh': [round(k, 0) for k in monthly_kwh_avg],
            'peak_kw': [round(p, 1) for p in monthly_peak],
            'mean_kw': [round(m, 1) for m in monthly_mean],
        },
        'daily_profile': {
            'weekday_24h': [round(v, 1) for v in weekday_24h],
            'weekend_24h': [round(v, 1) for v in weekend_24h],
        },
    }
```

5.3 **Output structure per MPAN.** Write JSON to `pipeline/dist/eir/half_hourly/{mpan}.json`:

```json
{
  "mpan": "2700007801700",
  "site_id": "millfield-green",
  "meter_label": "Millfield Green",
  "interval_hours": 0.5,
  "start_date": "2024-04-02",
  "end_date": "2026-02-07",
  "years_covered": 2,
  "hh_data": [21.3, 19.4, 20.4, ...],
  "stats": { ... },
  "monthly": { ... },
  "daily_profile": { ... },
  "data_status": "ready"
}
```

5.4 **Rebuild `half_hourly_index.json`.** Format:

```json
{
  "mpans": [
    {"mpan": "1170000537858", "site_id": "austin-heath",       "meter_label": "Austin Heath",       "annual_kwh": 457000, "peak_kw": 145.3, "data_status": "ready"},
    {"mpan": "1300060637737", "site_id": "gifford-lea",        "meter_label": "Gifford Lea",        "annual_kwh": 658000, "peak_kw": 175.0, "data_status": "ready"},
    ...
    {"mpan": "2000054195811", "site_id": "bramshott-place",    "meter_label": "Bramshott Clubhouse", "annual_kwh": null, "peak_kw": null, "data_status": "pending", "pending_reason": "Stark CSV not yet pulled"},
    {"mpan": "3110000087890", "site_id": "ampfield-meadows",   "meter_label": "Ampfield Energy Centre", "annual_kwh": null, "peak_kw": null, "data_status": "pending", "pending_reason": "Stark CSV not yet pulled"},
    {"mpan": "3110000100948", "site_id": "ampfield-meadows",   "meter_label": "Ampfield Main",       "annual_kwh": null, "peak_kw": null, "data_status": "pending", "pending_reason": "Stark CSV not yet pulled"}
  ],
  "by_site": {
    "austin-heath":       ["1170000537858"],
    "gifford-lea":        ["1300060637737"],
    "ledian-gardens":     ["1900092082315"],
    "bramshott-place":    ["2000054195811"],
    "durrants-village":   ["2700000897657"],
    "millbrook-village":  ["2700001623991"],
    "great-alne-park":    ["2700004078407"],
    "elderswell":         ["2700007408969", "2700007408978"],
    "millfield-green":    ["2700007801700"],
    "ampfield-meadows":   ["3110000087890", "3110000100948"]
  }
}
```

The `data_status: "ready"` / `data_status: "pending"` flag drives UI rendering downstream.

5.5 **Run the pipeline.** From repo root:
```bash
python pipeline/build.py
```
Confirm:
- 9 files appear at `pipeline/dist/eir/half_hourly/{mpan}.json`
- `half_hourly_index.json` has 12 mpan entries (9 ready, 3 pending)
- No exceptions raised

5.6 **Build the Load Inspector component.** Per `LOAD_INSPECTOR_HANDOFF.md` Sections 2-10. Files:

- `eir/src/lib/loadInspectorTransforms.js` — port verbatim from handoff Section 4:
  - `percentile(arr, p)` function
  - Duration curve thinning logic
  - Heat color interpolation function
  - Tick generation helpers
- `eir/src/components/LoadInspector/LoadInspector.jsx` — top-level, props per handoff Section 10:
  ```js
  <LoadInspector
    hhData={number[]}
    intervalHours={0.5}
    startDate={string}
    profileName={string}
    asc={number | null}
  />
  ```
  - Tab state for 7 views (Overview, Time Series, Daily Profile, Monthly, Duration Curve, Heat Map, Data Quality)
  - Tab bar at top using `var(--text-sm)` Stolzl Medium
- Six view components per handoff Section 2 (one per tab). Render in the cream register (since Site Detail is cream). Each view's main chart should use Recharts in the IVG palette:
  - Coral (`var(--color-nza-coral)`) for primary line/area
  - Persian Rose (`var(--color-theme-accent-primary)`) for secondary
  - Scope 12 teal (`var(--color-scope-12)`) for tertiary
  - Risk amber (`var(--color-risk-moderate)`) for alerts
- `MonthJumpButtons.jsx` — shared component for the Month Jump bar (All, Jan-Dec)

Specific notes per view (read the handoff for the full spec; this is just adaptation):
- Overview: keep all six metric cards + daily peak/mean chart + duration curve, in cream register
- Time Series: zoom pills (7 options), month-jump buttons, day-range scrubber slider — all using `var(--text-sm)` Stolzl Medium for labels
- Daily Profile: Month Jump bar + percentile bands. Coral mean line, coral-soft band for min/max, coral-mid band for P25/P75
- Monthly: stacked bar (12 months) + peak line + mean line
- Duration Curve: large coral area chart with x-axis as percentage
- Heat Map: 12×24 grid using the custom flex/div pattern (NOT Recharts — per handoff Section 9 gotcha 9). Colour interpolation from cream → coral (replace EOC's dark-navy→periwinkle scheme to match IVG palette)
- Data Quality: coverage % card + monthly coverage bar chart. SKIP the Assembly Provenance card per handoff Section 10.

5.7 **Wire LoadInspector into Site Detail > Energy.** In `App.jsx`, the Energy sub-tab currently has a Monthly chart. Add a toggle:

```
[Monthly view] [Half-hourly view]
```

When toggle = Monthly: existing monthly chart (no change).
When toggle = Half-hourly:
- Read `half_hourly_index.json` to find `by_site[siteId]`
- If empty: show "No half-hourly data available for this site"
- If 1 MPAN: load that MPAN's JSON, render `<LoadInspector>` with the data
- If multiple MPANs (Elderswell has 2, Ampfield will have 2): meter selector dropdown above the inspector
- If MPAN's `data_status === 'pending'`: show "Half-hourly data pending — Stark CSV not yet pulled. Brief 7 will integrate the missing files."

5.8 **Audit doc append** — Part 5 findings:
- Stark format diagnosis (3-col vs 2-col)
- 9 MPANs processed (per-MPAN row counts)
- 3 MPANs pending (which sites affected)
- Load Inspector views ported (6 of 8)
- Performance: typical view render time on a 2-year HH dataset

**PASS criteria:**
- `pipeline/readers/read_half_hourly.py` handles actual Stark CSV format without errors
- 9 per-MPAN JSON files exist at `pipeline/dist/eir/half_hourly/`
- `half_hourly_index.json` has 12 entries: 9 with `data_status: "ready"`, 3 with `data_status: "pending"`
- Site Detail > Energy > Half-hourly toggle works
- For Millfield Green (one of the cleanest datasets), all 6 Load Inspector views render correctly
- For Elderswell (2 MPANs), the meter selector lets you switch between Electric Room and Plant Room
- For Bramshott Place (pending), the "data pending" message renders
- No console errors

**Commit:**
```
Brief 6 Part 5: Stark reader rewrite + half-hourly Load Inspector port

Reader:
- pipeline/readers/read_half_hourly.py rewritten to handle actual Stark
  format: 3-col Date/Time/Value, no day-of-week prefix, descending
  chronology. Auto-detects column names so future Stark exports don't
  break.
- 9 CSVs in pipeline/source-data/ processed → 9 per-MPAN JSONs at
  pipeline/dist/eir/half_hourly/. Two years of HH data per site
  (April 2024 → February 2026).
- 3 missing MPANs (2000054195811 Bramshott Clubhouse,
  3110000087890 + 3110000100948 Ampfield) surface in the index with
  data_status: "pending". UI renders graceful empty state.
- Pre-computed aggregates per LOAD_INSPECTOR_HANDOFF.md Section 3.2:
  stats (peak / mean / load_factor / weekday_mean / weekend_mean),
  monthly (12-month kwh / peak / mean averaged across years),
  daily_profile (24-hour weekday + weekend means).

Load Inspector:
- 6 of 8 views ported per handoff Section 10: Overview, Time Series,
  Daily Profile, Monthly, Duration Curve, Heat Map, Data Quality.
  Weather and Assembly Provenance skipped (PABLO-specific dependencies).
- Pure transforms in eir/src/lib/loadInspectorTransforms.js — percentile,
  durationCurve thinning, heat color interpolation, getTimeAxisConfig.
- Wired into Site Detail > Energy > Half-hourly toggle. Meter selector
  for sites with multiple MPANs (Elderswell, Ampfield).
- Cream register styling (Site Detail is cream-register per Part 3).
- Heat Map uses custom flex/div grid per handoff Section 9 gotcha (not
  Recharts).

Audit doc updated with diagnosis, row counts per MPAN, and view-render
performance notes.
```

---

### Part 6 — Walkthrough + close

**Goal:** Claude Code runs browser verification using MCP browser tools. Documents findings, captures screenshots. STATUS.md final. Brief 6 archived. `current.md` points to whatever's next (or empty).

**Files touched:**
- `docs/audit/06_design_system_and_features.md` — append "Part 6 walkthrough"
- `docs/audit/06_screenshots/*.png` (new directory + files for screenshot captures)
- `docs/briefs/active/06_design_system_and_features.md` → `docs/briefs/archive/06_design_system_and_features_COMPLETED.md`
- `docs/briefs/current.md` — repointed (empty, awaiting next brief)
- `STATUS.md` — close-out entry

**Steps:**

6.1 **Boot dev server.** `cd eir && npm run dev` on localhost:5173 (or whatever vite.config locks). If `framer-motion` isn't installed locally, the CSS-keyframe fallback should be active — verify by inspecting a leaderboard row's class names.

6.2 **Claude Code self-walkthrough** using MCP browser tools. For each route below: navigate, wait for full load, capture screenshot at 1440×900 (the demo resolution), document findings.

Routes to verify (15 total — covering all 14 from Brief 5 + new map):

1. `/` (redirects to `/portfolio/map`)
2. `/portfolio/map` — new map view
3. `/portfolio/sites` — sortable table (Brief 1A/1B work)
4. `/portfolio/comparisons` — Brief 5 Y-axis fix verified
5. `/portfolio/overview` (redirects to `/portfolio/map`)
6. `/site/austin-heath/overview` (cream register — visual check)
7. `/site/austin-heath/energy` (cream register; Half-hourly toggle to Load Inspector)
8. `/site/austin-heath/carbon` (cream register)
9. `/site/austin-heath/meters` (Brief 5 work — electricity + gas + water sections)
10. `/site/austin-heath/data-quality`
11. `/site/millfield-green/energy` (Half-hourly view should show the cleanest data)
12. `/site/elderswell/energy` (Half-hourly view should show meter selector for 2 MPANs)
13. `/site/bramshott-place/energy` (Half-hourly view should show "data pending")
14. `/insights/reconciliation`
15. `/insights/voids`
16. `/insights/data-quality`
17. `/gresb`

For each route, document:
- Renders without console errors (YES/NO)
- Stolzl loaded on headings (YES/NO)
- Correct register (cream/dark) per route classification (YES/NO)
- Left-side narrative present (where expected) (YES/NO)
- Any visual oddities (free-text)
- Screenshot at 1440×900 captured to `docs/audit/06_screenshots/{route}.png`

6.3 **Specific checks for Part 4 (Map):**
- Default theme is Energy with Total energy metric selected
- 13 sites in leaderboard, sorted descending
- 13 dots visible on UK map at reasonable geographic positions
- Switch theme to Water → leaderboard re-sorts, dots resize
- Switch toggle from Total → Per Unit → re-sort
- Hover a row → corresponding dot scales up
- Hover a dot → corresponding row highlights
- Click a row → navigates to `/site/{id}/overview`
- Click a dot → navigates to `/site/{id}/overview`
- Hover card shows on dot hover with 4-5 stats

6.4 **Specific checks for Part 5 (Load Inspector):**
- Millfield Green Half-hourly view loads all 6 view tabs without errors
- Overview view: 6 metric cards + daily peak/mean chart + duration curve all visible
- Time Series view: zoom pills work, scrub slider works
- Daily Profile view: Month Jump bar works (try Jan vs Jul)
- Monthly view: 12 bars with peak + mean lines
- Duration Curve view: full coral area chart, x-axis 0-100%
- Heat Map view: 12×24 grid, cream→coral colour scale
- Data Quality view: coverage % card, monthly coverage bar chart

6.5 **Token sweep falsifiability:**
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src --include="*.jsx"
```
Must return 0 matches. Append the actual grep output to the audit doc.

6.6 **Build verification:**
```bash
cd eir && npm run build
```
Must succeed with zero warnings. Capture output to the audit doc.

6.7 **Bundle size check.** Compare `dist/` size before vs after Brief 6. Recharts adds nothing (already in); framer-motion adds ~22KB gzipped; Stolzl `.otf` files add ~120KB each (×6 = ~720KB across all weights, served once per session). Document in audit doc; flag if total bundle gzip > 400KB.

6.8 **STATUS.md final entry:**

```markdown
## Brief 6 — NZA design system + map + Load Inspector (COMPLETE)

All 6 Parts shipped. NZA design system live across all 17 routes. Map module
ported. Load Inspector ported for 9 of 12 MPANs.

Walkthrough by Claude Code self-verification at Part 6:
- 17 routes tested at 1440×900, all render without console errors
- Stolzl loaded on headings (visible in Network panel)
- Cream register on Site Detail pages, dark register elsewhere
- Map: 13 sites, 6 themes, Total/Per-Unit/Per-m² toggle working
- Load Inspector: 6 of 8 views working for Millfield Green; meter selector
  working for Elderswell; "data pending" state working for Bramshott
- Falsifiability passed: 0 raw hex in JSX, build clean, bundle 380KB gzip

Awaiting Chris's manual walkthrough on wake.
```

6.9 **Archive Brief 6:**
```bash
git mv docs/briefs/active/06_design_system_and_features.md \
        docs/briefs/archive/06_design_system_and_features_COMPLETED.md
```

6.10 **Update `docs/briefs/current.md`** to empty state (awaiting next brief).

6.11 **Final commit:**

```
Brief 6 close: Design system + map + Load Inspector live for IVG demo

NZA design system forklifted: Stolzl + Inter + DM Serif + IBM Plex Mono
fonts. Three-tier token system at eir/src/tokens/. Two-bar nav with logo
lockup. Cream/dark editorial register applied per route.

EOC map module ported to /portfolio/map: 13 sites, 6 themes (Overview,
Energy, Water, Waste, Carbon, Data quality), Total/Per-Unit/Per-m² toggle,
hand-calibrated positions, click-to-drill, hover preview.

PABLO Load Inspector ported to Site Detail > Energy > Half-hourly: 6 of 8
views (Overview, Time Series, Daily Profile, Monthly, Duration Curve,
Heat Map, Data Quality). Stark reader rewritten for actual export format.
9 of 12 MPANs processed (2-year datasets); 3 surface as data pending.

Left-side narrative on every non-Site-Detail page per design note D6.

Zero raw hex in JSX. Closed type scale enforced. Build clean.

Brief archived. STATUS.md updated. Audit doc complete with screenshots.

Awaiting Chris's manual walkthrough.
```

**PASS criteria:**
- All 17 routes verified rendering
- Token-sweep grep returns 0 matches
- Build succeeds with 0 warnings
- Screenshots captured in `docs/audit/06_screenshots/`
- STATUS.md updated
- Brief archived
- `current.md` empty

---

## What MUST NOT happen in Brief 6

- No `npm install` from Claude Code's environment
- No modification of `nzai-demo` repo (read-only reference)
- No Sites table redesign (out of scope, log to STATUS.md "Known issues")
- No GRESB real build
- No Sycous chart integration on Site Detail Energy
- No Weather analysis tab in Load Inspector
- No engine / data model / pipeline schema changes
- No partial commits — each Part is one commit with STATUS.md + audit-doc updates
- No skipping Part 6 self-walkthrough
- No expanding scope to absorb new issues
- No pushing Part 4 if Vercel build fails (halt + log to STATUS.md per escalation triggers)

---

## When to escalate (log to STATUS.md and stop)

- Reference doc missing from disk (handoff, design note, brief)
- Stark CSV format unparseable (3-col Date/Time/Value pattern not actually present)
- Map outline SVG corrupt AND fallback rectangle also fails
- Vercel build fails after Part 4 push
- A Part's PASS criteria cannot be met after 15 minutes + 3 different approaches per Bible's "When stuck"
- npm install fails in a way that blocks dev server boot (then framer-motion fallback didn't work either)

For everything else: plough through. Final report at Part 6.

---

## Final report fields (Claude Code populates at Part 6 close)

1. New origin/main HEAD SHA
2. Number of commits in Brief 6 chain
3. Brief archived to `docs/briefs/archive/06_design_system_and_features_COMPLETED.md` confirmed
4. `docs/briefs/current.md` final state (empty / pointing somewhere)
5. Token-sweep grep result (must be 0)
6. Build output (must be clean)
7. Bundle size before / after (KB gzip)
8. Map module: themes tested, sites positioned, framer-motion install state
9. Load Inspector: MPANs processed (count), views rendering correctly (per Millfield Green check)
10. Stark reader: 9 CSVs parsed, 3 pending logged
11. Screenshots: count + path
12. Known issues logged to STATUS.md (any new ones surfaced during work)
13. CLAUDE.md unchanged (no scope drift) — confirm with `git diff CLAUDE.md` is empty
14. Vercel deployment state (URL serving Brief 6 work or last-known-good)
15. Standing by for Chris's wake-time walkthrough

---

## Notes for Claude Code

Pattern matches PABLO Brief 45's structure and the NZA Development Bible:

- BEFORE-DOING-ANYTHING checklist is mandatory at session start
- Each Part is one commit, with STATUS.md + audit-doc in the same commit
- Plough-through means no checkpoints with Chris — but every escalation trigger DOES pause, log, and surface
- This is the first IVG brief with full bible discipline; future briefs follow this exact pattern
- The handoff documents (MAP_MODULE_HANDOFF, LOAD_INSPECTOR_HANDOFF) are reference material — DO NOT modify them
- The nzai-demo repo is a read-only structural reference — DO NOT modify

If polish work surfaces a real bug elsewhere, log it in STATUS.md "Known issues" and continue without fixing here. New work needs new brief authorisation.

Standing by for authorisation to begin Part 1. Confirm receipt by quoting this brief's title and "Target outcome" first paragraph back to Chris in chat, then proceed.
