# EOC framer-motion patterns

Source: `Leadership.jsx`, `InventoryOverview.jsx`. Library: `framer-motion ^12.38.0` (IVG is on `^12.40.x` per Brief 13 — compatible).

## Pattern 1 — Outer page entry fade

Used on every Inventory / Strategy / Themes page. Kills the white-flash that appears when entering a section from a darker section.

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="min-h-screen bg-dark-bg text-white px-6"
  style={{ height: 'calc(100vh - 49px)', overflow: 'hidden' }}
>
  {/* page content */}
</motion.div>
```

- **Duration:** 0.3s.
- **Properties:** opacity only (no y-translate on outer).
- **Pair with:** body `background-color: var(--color-dark-bg)` so the page starts dark + opacity-0, then fades in. The body bg shows briefly between routes — that "punctuation" between chapters is intentional.

## Pattern 2 — Sub-tab content swap

When a sub-sub-tab is clicked, the right-pane content fades out + slides up while the new content fades in + slides down. Used in `Leadership.jsx` lines 666–712.

```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}                              // KEY is the tab id — drives the swap
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18 }}
  >
    {rightPaneContent()}
  </motion.div>
</AnimatePresence>
```

- **Mode `"wait"`** — outgoing finishes before incoming starts. Cleaner than `sync` for this density.
- **Duration:** 0.18s — fast (the snap a reader expects when clicking a tab).
- **Travel:** 8px y (subtle).
- **Key:** must change for AnimatePresence to detect the swap. Use the sub-tab key directly.

## Pattern 3 — Delayed supporting content

Used on `InventoryOverview.jsx` lines 84–92. The narrative is the protagonist; the table on the right enters slightly later so the eye reads the framing prose first.

```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.45, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
  className="w-full h-full pt-2 pl-2">
  <InventoryTable />
</motion.div>
```

- **Duration:** 0.45s (longer — content has more presence).
- **Delay:** 0.25s.
- **Easing:** `[0.4, 0, 0.2, 1]` — Material `standard easing`. Lets the chart settle.
- **Travel:** 12px y.

## Pattern 4 — Inline detail-card replacement

In `Leadership.jsx` the left pane swaps between the narrative and a selected peer/client detail card. Uses the same AnimatePresence wrapper but keyed by `peer-${id}` / `client-${name}` / `narrative-${tab}`.

```jsx
<AnimatePresence mode="wait">
  {showPeerCard ? (
    <motion.div key={`peer-${selectedPeer.firm}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      <PeerCard d={selectedPeer} onClose={() => setSelectedPeer(null)} />
    </motion.div>
  ) : (
    <motion.div key={`narrative-${activeTab}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      {leftPanelContent()}
    </motion.div>
  )}
</AnimatePresence>
```

## IVG application for Brief 17.5

**Part 1 minimum:**
- Wrap `PortfolioEnergy.jsx` outer with Pattern 1 — outer page entry fade (0.3s opacity).
- Wrap the right-pane chart container with Pattern 2 — AnimatePresence keyed to `subSubTab` so chart fades+slides on Consumption/Heating/Power/Metering switch.

**Part 3 extension (Consumption chart v2):**
- Each bar group can also use `<motion.rect>` with `layout` prop for the bar reorder if a legend-filter toggle changes sort order.
- Bar growth on first render: framer-motion `initial={{ scaleY: 0 }}` `animate={{ scaleY: 1 }}` with stagger per bar (~0.04s delay each).

**Be mindful of Brief 13 / Process Rule 10:** framer-motion `<motion.div>` around a Recharts `<ResponsiveContainer>` must still resolve to an explicit pixel height. Animating opacity/y is safe; animating height is NOT safe — wraps with `layout` on the parent of a ResponsiveContainer will crash the chart.
