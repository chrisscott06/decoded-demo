# LEADERBOARD_REORDER_EXTRACT — framer-motion `layout` reorder pattern

Extracted from the EOC Inventory map's `MapView.jsx` leaderboard. Covers the
sliding row-reorder animation **only** — no bars, colours, or data wiring.

Real code, not a reconstruction. Source: `docs/briefs/MAP_MODULE_HANDOFF.md`
Sections 3 + 7 + 8.

---

## 1. Library + version

```jsonc
// package.json (EOC)
"framer-motion": "^12.38.0",
```

That's it for the reorder. The same package also drives `AnimatePresence`
(modal + chevron-expand) but those are independent surfaces.

Import:

```js
import { motion } from 'framer-motion'
```

`AnimatePresence` is **not** needed for the row-reorder — it's only used for
the inline chevron-expand and modal. Layout animations work on plain
`motion.*` elements as long as the element stays mounted between renders
(which sort-reordering does — same rows, different positions).

---

## 2. The row markup — exact source

```jsx
{sortedOffices.map((office) => {
  // ...precompute val, widthPct, isSelected, isHovered, breakdown etc...

  return (
    <motion.div key={office.id} layout
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className={`rounded px-2 transition-colors ${
        isSelected ? 'bg-white/10' : isHovered ? 'bg-white/[0.04]' : ''
      }`}>
      <div style={{ height: ROW_HEIGHT }}
        className="w-full flex items-center gap-2 cursor-pointer"
        onClick={() => setSelectedOffice(office)}
        onMouseEnter={() => setHoveredOffice(office.id)}
        onMouseLeave={() => setHoveredOffice(null)}>
        {/* ...row contents (flag, name, bar, value, chevron)... */}
      </div>

      {/* Inline expand uses AnimatePresence; the outer reorder does not. */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            {/* ...breakdown rows... */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})}
```

The reorder is **just two extra attributes on the row's outer element**:

```jsx
<motion.div
  layout                                                       // ← the magic
  transition={{ type: 'spring', damping: 26, stiffness: 300 }} // ← the feel
>
```

`layout` tells framer-motion to measure the row's bounding box before and
after each render, compute the delta, and animate the transform. The
`transition` overrides the default spring with EOC's specific tuning.

---

## 3. Key strategy — stable id, not array index

```jsx
{sortedOffices.map((office) => (
  <motion.div key={office.id} layout ...>
```

`office.id` is the **stable identity** — it survives across sort orders.
This is the critical bit:

- ✗ `key={index}` — React reuses the same DOM node for whichever office
  happens to be at position N, and framer measures no delta because the
  "node" stayed put.
- ✓ `key={office.id}` — React keeps the same DOM node attached to the same
  *office* across renders. When that office's position changes,
  framer measures `oldRect → newRect` and animates the difference.

In IVG terms: use `key={site.id}` where `site.id` is the kebab-case
canonical id (`austin-heath`, `gifford-lea`, etc.) — never the array
position.

---

## 4. `layoutId` usage — **none in this pattern**

`layoutId` is for **shared-element transitions across components** (e.g. a
thumbnail morphing into a fullscreen modal). The EOC leaderboard reorder
doesn't use it — every row stays in the same component tree, just at a
different position. Plain `layout` is enough.

If you ever want a row to "fly out" into a different surface (e.g. a row
expands into a detail panel that lives elsewhere on the page), that's
where `layoutId` comes in. For the in-place reorder you're porting, skip
it.

---

## 5. Container setup — nothing special

The EOC rows sit in a plain Tailwind flex/grid column. **No `position:
relative` required on the container** — framer-motion measures absolute
bounding boxes via `getBoundingClientRect()`, not offsets-from-parent.

```jsx
<div className="space-y-1 overflow-y-auto pr-2">
  {sortedOffices.map((office) => (
    <motion.div key={office.id} layout ... >
      {/* row */}
    </motion.div>
  ))}
</div>
```

Requirements that **do** matter:

1. The rows must be **direct children of a reflowing container**. A flex
   column, a grid with `auto` row sizes, or a vertical stack of plain
   block elements — all work. The container's normal layout dictates where
   each row "wants to be" after the sort; framer animates the delta from
   where the row was last frame to where it wants to be this frame.
2. Don't apply `transform` to the row from your own styles — framer owns
   the transform property during layout animations and will fight any
   competing transform. Background, padding, border, opacity are all fine.
3. Don't wrap the row in another `motion.div` that itself has `layout` —
   nested layout animations get confused. One `layout` per row, on the
   outermost row element.

---

## 6. Gotchas

### "Rows animate on first mount"

Framer-motion's `layout` prop by design **doesn't animate on initial
mount** — it takes the first measurement and only animates on subsequent
re-layouts. So you get a clean static first render, then smooth reorders.

If you ever see rows animating in from the top on mount, the culprit is
usually an `initial={{...}}` prop you added by mistake, or a parent
component re-mounting the entire list (e.g. a `key` on the *container*
that changes when the metric changes). The fix is to keep the container
stable across metric changes — only the rows inside should be keyed by
stable site id.

(Note: in the current IVG `Leaderboard.jsx` from Brief 7, the **container**
has `key={`${activeCategory?.id}-${activeMetric?.key}-${toggleMode}`}` —
that intentionally remounts the list on every theme/metric/toggle change
to drive the CSS `nza-row-shift` keyframe fallback. When you port the
framer-motion reorder, **remove that key from the container** so the same
DOM nodes survive across metric switches and framer can animate the
delta. Keep the row-level `key={site.id}`.)

### Layout thrash on rapid toggling

A spring transition that's still in-flight when the user clicks another
metric will be cancelled and a new spring will start from the current
in-flight position. That's actually what you want — it's velocity-aware
(spring picks up the momentum) and feels alive, not stalled. No code
needed; just don't fight it with state debouncing.

### Performance at ~13 rows

Trivial. Framer-motion's layout animations use CSS `transform` (GPU
composited), and 13 rows × 60fps is well inside the budget on any
machine. The published threshold where you'd worry is **~100+ rows** —
past that, consider `layoutDependency` to limit when measurement runs.

### `transition-colors` Tailwind class on the same element

The EOC row has `className="... transition-colors"` on the same
`motion.div` as `layout`. They don't conflict — `transition-colors` is
CSS transitioning `background-color`; `layout` animates `transform`.
Different properties, different engines, both run cleanly together.

### Rows entering / leaving the list (filter changes)

The EOC pattern doesn't use `AnimatePresence` for the leaderboard outer
list because re-sorts keep all rows mounted. **If you have a filter that
hides rows** (e.g. IVG's `Energy → Gas` metric filters out all-electric
sites), wrap the list in `<AnimatePresence>` and add
`exit={{ opacity: 0, x: -20 }}` + `initial={{ opacity: 0 }}` to the row
for clean fade-outs. The EOC `has_gas`-filtered Gas metric uses exactly
this pattern in the same file (around line ~330 of `MapView.jsx`,
referenced in Section 3 of the handoff).

### Don't put the `layout` on a child of `motion.div`

`<motion.div layout><div layout>...</div></motion.div>` won't work the way
you'd expect. The outer one measures the whole row; the inner one would
measure itself relative to its parent. Pick the outermost element of the
visual row and put `layout` there.

---

## 7. The exact transition values — paste-ready

```jsx
transition={{ type: 'spring', damping: 26, stiffness: 300 }}
```

That's the literal object from `MapView.jsx`. The motion feels:

- **Quick** — typical settling time ~400 ms
- **Slightly soft landing** — damping 26 against stiffness 300 gives a
  visible-but-subtle deceleration; not stiff/snappy (would be
  `damping: 40+`), not bouncy (would be `damping: 10`)
- **Velocity-aware** — interrupting a still-animating row picks up its
  current velocity rather than starting from rest, so rapid metric
  switches feel continuous

Default framer-motion spring is roughly `{ damping: 10, stiffness: 100 }`
(slow + bouncy). The EOC values trade bounce for crispness, which reads
better for a data leaderboard where you want the eye to follow the rank
change, not watch a row wobble.

If you want to tune from here:

| Effect | Move |
|---|---|
| Snappier | `stiffness: 400`, keep damping |
| Softer / longer settle | `stiffness: 200`, `damping: 28` |
| Slight overshoot | `damping: 18` (don't go below 14 or it bounces visibly) |
| No spring, just easing | `transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}` |

For a data dashboard, `{ type: 'spring', damping: 26, stiffness: 300 }`
is the right starting point — it's the EOC default and it's been
walked-through-with-clients shipped.

---

## Minimal port checklist

1. `npm install framer-motion@^12.38.0`
2. `import { motion } from 'framer-motion'`
3. In the leaderboard row's outer element: change `<div ...>` →
   `<motion.div layout transition={{ type: 'spring', damping: 26,
   stiffness: 300 }} ...>`
4. Make sure the row's `key` is `{site.id}` (or whatever your stable
   per-row identity is), not the array index
5. Remove any `key` from the **container** that changes on metric switch
   — that would remount everything and defeat the layout animation
6. If you have a filter that hides rows, wrap in `<AnimatePresence>` and
   add `initial`/`exit` to the row

That's the whole port. Everything else in the row (bar fill, value
column, hover colours, click handlers) stays as it is.
