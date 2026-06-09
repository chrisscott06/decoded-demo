# EOC reference extraction — Brief 17.5 unblock

**Source:** `C:\Users\ChrisScott\Dev\nza-eoc-nzr` (local clone — Chris dropped path 2026-06-03)
**Screenshot:** Inventory › Leadership › The Peer Landscape (Chris provided inline 2026-06-03). Shows three-tier ribbon stack (top nav cream / sub-nav dark navy / sub-sub-tab pill row), left-aligned grid, narrative-left + chart-right SplitPanel, framer-motion outer fade.

Files copied/distilled into this folder:
- `00_summary.md` (this file) — the locked specs for Brief 17.5 Part 1.
- `01_top_ribbon.md` — primary nav dimensions + behaviour.
- `02_sub_ribbon.md` — secondary nav strip dimensions + behaviour.
- `03_sub_sub_tabs.md` — tertiary pill bar pattern (page-local, not a ribbon).
- `04_page_layout.md` — MainLayout + SplitPanel + page shell pattern.
- `05_tokens_and_type.md` — colours + type hierarchy tokens, with IVG mapping.
- `06_framer_motion.md` — transition curves + AnimatePresence patterns.

---

## Headline measurements — lock these into IVG

### Three-tier ribbon stack (descending visual weight)

| Tier | EOC source | Rendered height | Background |
|---|---|---|---|
| 1. Primary nav (Home / Explainers / Inventory / Strategy) | `Navigation.jsx` — `px-6 py-2.5` | **~49px** (confirmed by SubNav `sticky top-[49px]`) | Cream `bg-white/90 backdrop-blur` non-landing |
| 2. Secondary sub-nav (Overview / Map / Themes / Leadership) | `SubNav.jsx` — `px-6` + tab `px-3 py-2 text-[0.8rem]` | **~36px** (12.8px text + 16px vertical padding + ~6px line-height slack) | Section-tinted: Inventory `#141B2D`, Strategy `#0D1D1D`, Explainers cream `#F0EFE9` |
| 3. Sub-sub-tab pill row (Why It Matters / Clients / Peer Landscape) | `Leadership.jsx` — page-local `flex gap-1.5` + `px-3 py-1 rounded-lg text-xs` | **~28px** (12px text + 8px vertical padding) | Inherits page background; pills `bg-eoc-orange text-white` active, `bg-white/5 text-gray-500` inactive |

**Critical:** the tertiary "pill row" is NOT a third sticky ribbon. It is part of the page-content header strip, sitting inside the page's `max-w-7xl mx-auto` column. Only the top two are sticky.

### Left-alignment grid

All three tiers AND the page title AND the body all align to the same left edge. The mechanism is identical across all three:

```
<div class="max-w-7xl mx-auto" style="padding: 0 24px">
  ... content ...
</div>
```

- Top nav: `<nav class="px-6"><div class="max-w-7xl mx-auto">`
- Sub-nav: `<div class="px-6"><div class="max-w-7xl mx-auto">`
- Page: `<div class="px-6"><div class="max-w-7xl mx-auto">`

All three use `px-6` on the outer + `max-w-7xl mx-auto` inside, producing one continuous left edge from primary nav to page body at every viewport width up to 1280px.

### Type hierarchy (EOC)

| Token | Font | Weight | EOC usage | IVG equivalent (already in repo) |
|---|---|---|---|---|
| `--font-hero` | Stolzl | 400 | H1 | Stolzl 500 (current `--font-heading`) — keep |
| `--font-display` | DM Serif Display | 400 | H2, page titles ("Leadership") | **Source Serif 4** — already in IVG, currently `--font-site` |
| `--font-heading` | Stolzl | 500 | H3, H4, nav labels, pill labels | Stolzl 500 (current `--font-heading`) — keep |
| `--font-body` | DM Sans | 400 | Body, list items, table cells | **Inter** — already in IVG, currently `--font-body` |
| `--font-mono` | JetBrains Mono | 400 | Numerical displays | **BANNED in IVG** (Chris 2026-06-03) — re-route any mono usage to Stolzl |

### Palette tokens (EOC, for reference)

```
--color-eoc-orange: #e8712b;   /* primary accent, active nav, accent text */
--color-nza-teal: #3a7d7e;     /* explainers accent */
--color-dark-bg: #0a0e17;      /* near-black page background (Inventory / Strategy / Home) */
--color-light-bg: #f8f7f4;     /* cream (Explainers) */
```

For IVG we keep `--color-nza-coral` as the primary accent (Brief 14 baseline). Bring in:
- Brief 17.5 §Part 1 lists six energy palette tokens that we need to declare from the Map view colours (Brief 14).

---

## Brief 17.5 Part 1 — concrete to-do list

Distilled from §Part 1 of the brief + the EOC reference above:

1. **Slim TopNav primary ribbon** to ~49px total height (from current taller value), `px-6 py-2.5` equivalent. Maintain left-alignment via `max-w-7xl mx-auto`.
2. **Slim TopNav secondary ribbon** to ~36px total height with tighter `px-3 py-2 text-[0.8rem]` pill metrics. Use section-tinted background — for IVG we use dark navy `#141B2D` (matches the new dark register).
3. **Sub-sub-tab pill row in PortfolioEnergy** kept as page-local component at ~28px, NOT a third sticky ribbon. Use `bg-coral text-white` active / `bg-white/5 text-white/50` inactive (matches existing pill pattern).
4. **Left-aligned grid** — both ribbons and the page body share one `max-w-7xl mx-auto + px-6` column so the left edge is continuous. Audit and fix any page indenting the title further right.
5. **Declare 6 palette tokens** in `eir/src/styles/tokens.css` (or whichever file currently holds colours):
   - `--color-energy-gas-landlord` — matches Map view gas-red
   - `--color-energy-gas-resident-submetered` — lighter red
   - `--color-energy-gas-resident-estimated` — base red + hatched fill via SVG `<pattern>`
   - `--color-energy-elec-landlord` — matches Map view electricity-yellow
   - `--color-energy-elec-resident-submetered` — lighter yellow
   - `--color-energy-elec-resident-estimated` — base yellow + hatched fill
   - PLUS: in-scope/out-of-scope opacity tokens (1.0 / 0.4).
6. **framer-motion** version verification (EOC uses `^12.38.0`; IVG already on `^12.40.x` per Brief 13 — confirm).
   - Add to PortfolioEnergy: wrap the right-pane chart in `<AnimatePresence mode="wait">` + `<motion.div key={subSubTab}>` with `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}`.
   - Outer page entry: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>` (matches EOC `Leadership.jsx` line 730-733).
7. **Site icon + `--font-site` audit** — every site-name render across the tool uses icon + Source Serif. Map already correct. Audit Energy chart bars, tooltips, narrative pane callouts.

Part 1 checkpoint — push, screenshot, show Chris before Part 2.
