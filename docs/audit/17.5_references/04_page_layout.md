# EOC page layout shell — `MainLayout.jsx` + `SplitPanel.jsx` + per-page wrapper

## Outer shell — `MainLayout.jsx`

```jsx
<div className="h-screen overflow-hidden flex flex-col">
  <Navigation />
  <main className={`flex-1 min-h-0 overflow-hidden ${isLanding ? '' : 'pt-[49px]'}`}>
    <Outlet />
  </main>
  {!isLanding && <SectionNav />}
</div>
```

- `h-screen overflow-hidden` — fills viewport, NEVER scrolls. All scrolling happens inside individual page components.
- `pt-[49px]` clears the fixed top nav.
- `<SectionNav>` is the "Next: Strategy" pill in the bottom-right corner — independent of sub-nav.

## Per-page wrapper — the formula

Every Inventory page (Overview / Map / Themes / Leadership) follows this:

```jsx
<motion.div
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="min-h-screen bg-dark-bg text-white px-6"
  style={{ height: 'calc(100vh - 49px)', overflow: 'hidden' }}>
  <div className="max-w-7xl mx-auto h-full flex flex-col">
    <div className="shrink-0 pt-3 pb-3">
      {/* title + sub-sub-tab pill row */}
    </div>
    <div className="flex-1 min-h-0">
      <SplitPanel leftContent={leftContent} rightContent={rightContent} />
    </div>
  </div>
</motion.div>
```

### Key behaviours

- **`height: calc(100vh - 49px)` + `overflow: hidden`** — the page is exactly viewport-minus-nav and never page-scrolls. All scrolling happens inside `<SplitPanel>`'s left/right panes.
- **`max-w-7xl mx-auto`** — same left edge as the two ribbons above.
- **Header strip is `shrink-0`** — fixed-height. Title + pill row don't move.
- **Body is `flex-1 min-h-0`** — fills remaining vertical space; min-h-0 prevents flex from over-stretching.
- **`<motion.div>` outer** — fades the whole page in on route entry (0.3s opacity-only). Kills the white-flash that Chris flagged in earlier briefs.

## `SplitPanel.jsx` — the narrative-left / chart-right pattern

```jsx
<div className="grid gap-6 h-full" style={{
  gridTemplateColumns: 'minmax(320px, 460px) 1fr',  // default
}}>
  <div className="split-panel__left relative min-h-0">
    <div className="overflow-y-auto scroll-fade pr-4 h-full">
      {leftContent}
    </div>
    <ScrollHint scrollRef={scrollRef} />
  </div>
  <div className="split-panel__right flex items-start justify-center min-h-0">
    <div className="w-full h-full flex items-start justify-center overflow-y-auto scroll-fade" style={{ padding: '2%' }}>
      {rightContent}
    </div>
  </div>
</div>
```

### Specs

- **Grid columns default:** `minmax(320px, 460px) 1fr` — narrative pane between 320px and 460px wide, chart pane takes remainder.
- **Grid columns `wide` variant:** `1fr 1fr` — used on Strategy `The Plan` only.
- **Grid columns `reversed`:** `1fr minmax(320px, 460px)` — narrative on the right.
- **Gap:** `gap-6` (24px between panes).
- **Both panes:** `h-full min-h-0 overflow-y-auto scroll-fade` — scroll independently with a bottom-fade mask.
- **Right pane:** `items-start justify-center` — chart top-aligned (NOT centred vertically) so it sits next to where narrative starts. `padding: 2%` for breathing room.
- **Mobile breakpoint (< 1024px):** `grid-template-columns: 1fr` — stacks vertically.

## Narrative pane styling — the IVG-relevant bits

From `InventoryOverview.jsx` line 19:

```jsx
<motion.div
  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="space-y-3 text-[0.8rem] text-gray-400 leading-[1.7]">
  <p>...</p>
  <h3 style={{
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.92)',
    borderBottom: '1.5px solid var(--color-eoc-orange)',
    paddingBottom: '0.35rem',
    letterSpacing: '0.005em',
    lineHeight: 1.2,
  }}>
    Section heading
  </h3>
```

### Narrative defaults

- Body text: `text-[0.8rem]` (12.8px), `text-gray-400` (medium muted), `leading-[1.7]` (1.7 line-height — generous).
- Paragraph spacing: `space-y-3` (12px).
- Strong/highlighted text: `text-white` (full white pops out of the gray-400).
- Section H3 within narrative: serif (`var(--font-display)`), 1.05rem, white at 92% opacity, with a 1.5px coral underline + 0.35rem padding-bottom = a token typographic divider.

### IVG application

PortfolioEnergy's Consumption narrative already exists from Brief 17 Part 2. Apply these defaults:
- Body: 0.8rem Inter 400, `color: var(--color-text-muted)` (a new token — currently we use `var(--color-text-light-secondary)`).
- Strong: `color: white` (or `var(--color-text-light-primary)` if that token exists).
- Inline H3: Source Serif 4, 1.05rem, 92% white, 1.5px coral underline.
