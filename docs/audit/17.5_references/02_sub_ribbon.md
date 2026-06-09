# EOC sub-nav ribbon — `SubNav.jsx`

Source: `nza-eoc-nzr/src/components/shared/SubNav.jsx`.

```jsx
<div className={`sticky top-[49px] z-40 ${bg} border-b border-white/5 px-6`}>
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center gap-0.5 overflow-x-auto -ml-3">
      {tabs.map(tab => (
        <Link key={tab.key} to={tab.path}
          className={`px-3 py-2 text-[0.8rem] font-heading font-medium whitespace-nowrap transition-all rounded-md ${
            isActive ? `${activeColor} ${activeBg}` : defaultInactive
          }`}>
          {tab.label}
        </Link>
      ))}
    </div>
  </div>
</div>
```

## Key specs

- **Sticky offset:** `sticky top-[49px] z-40` — tucks directly under the 49px primary nav.
- **Background per section:**
  - Inventory: `bg-[#141B2D]` (deep navy)
  - Strategy: `bg-[#0D1D1D]` (near-black green-tinted)
  - Explainers: `bg-[#F0EFE9]` (cream)
- **Bottom border:** `border-b border-white/5` (barely-visible 1px hairline on dark variants).
- **Horizontal padding:** `px-6` outer + `max-w-7xl mx-auto` inner — SAME left edge as primary nav.
- **Negative left margin trick:** the tab strip uses `-ml-3` to offset the first tab's `px-3` so the tab LABEL aligns with the outer column edge, not the tab background.
- **Tab metrics:** `px-3 py-2` (12px L/R, 8px T/B) + `text-[0.8rem]` (12.8px) + `font-heading font-medium` (Stolzl 500). Rendered height ≈ 36px.
- **Active state:**
  - Inventory: `text-eoc-orange bg-eoc-orange/10` + `rounded-md` (active tab gets 10%-tint orange chip)
  - Strategy: `text-emerald-400 bg-emerald-400/10`
  - Explainers: `text-nza-teal bg-nza-teal/10`
- **Inactive state:**
  - On dark: `text-white/40 hover:text-white/60`
  - On cream (Explainers): `text-[#7A9A8A] hover:text-[#5A7A6A]`
- **Inter-tab gap:** `gap-0.5` (2px) — very tight.

## IVG translation

IVG's current secondary row (the Portfolio sub-tabs: Map / Energy) sits as its own block. Match EOC slim:
- Background `#141B2D` (or whichever IVG dark-register token aligns — Brief 10 used `#0F1629` for the page; sub-nav can be a touch lighter for visible separation).
- `px-6` outer + `max-w-7xl mx-auto` inner.
- Tab: `padding: 8px 12px; font-size: 0.8rem; font-weight: 500; font-family: var(--font-heading)`.
- Active: `color: var(--color-nza-coral); background: rgba(var(--color-nza-coral-rgb), 0.10)`.
- Inactive: `color: rgba(255,255,255,0.4); :hover color: rgba(255,255,255,0.6)`.
- Use the `-ml-3` trick so the active tab's TEXT (not its background) sits on the same vertical line as the primary nav labels above and the page title below.

## The "left-alignment grid" — why it matters

The EOC report reads as ONE clean column because every left edge is the same. From top to bottom on a non-landing page:

```
| nav label | nav label | nav label | nav label |        <- primary nav (49px tall)
| sub-tab | sub-tab | sub-tab |                          <- sub-nav  (36px tall)
| Page Title                                              <- page header
| narrative body text...                                  <- body
```

All four `|` markers above sit on the same x-coordinate. That's the result of: outer `px-6` + inner `max-w-7xl mx-auto` + tab `-ml-3` to compensate for its own `px-3`.

IVG's current Energy page violates this — the page title is indented further right than the nav above it. Fix by routing the whole page through the same `max-w-7xl mx-auto + px-6` shell.
