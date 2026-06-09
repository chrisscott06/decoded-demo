# EOC tertiary sub-sub-tab pill row — `Leadership.jsx`

Source: `nza-eoc-nzr/src/components/inventory/Leadership.jsx` lines 736–748.

```jsx
<div className="shrink-0 pt-3 pb-3">
  <div className="mb-2">
    <h1 className="text-[2rem] font-display text-eoc-orange">Leadership</h1>
  </div>
  <div className="flex flex-wrap gap-1.5">
    {subTabs.map(t => (
      <button key={t.id} onClick={() => handleTabChange(t.id)}
        className={`px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all ${
          activeTab === t.id
            ? 'bg-eoc-orange text-white'
            : 'bg-white/5 text-gray-500 hover:text-gray-300'
        }`}>
        {t.label}
      </button>
    ))}
  </div>
</div>
```

## Key specs — what this is and isn't

- **Not a sticky ribbon.** Lives inside the page-content column (`max-w-7xl mx-auto`).
- **Lives BELOW the page title `<h1>`**, not above it. Title → 8px margin → pill row.
- **Header strip wrapper:** `shrink-0 pt-3 pb-3` (12px top + 12px bottom — generous breathing room).
- **Title:** `text-[2rem]` (32px) `font-display` (DM Serif Display) `text-eoc-orange`. Serif heading in accent colour — the page identity marker. Use **Source Serif 4** in IVG.
- **Pill metrics:** `px-3 py-1` (12px L/R, 4px T/B), `text-xs` (12px), `font-heading font-medium` (Stolzl 500), `rounded-lg` (8px corner radius), `gap-1.5` (6px between pills).
- **Active pill:** `bg-eoc-orange text-white` (full coral fill, white text).
- **Inactive pill:** `bg-white/5 text-gray-500 hover:text-gray-300` (faint surface, muted text).
- **Rendered height:** 12px text + 8px padding ≈ 24-28px.

## Three-level descending visual weight — confirmed

| Tier | Height | Text size | Text weight |
|---|---|---|---|
| Primary nav | ~49px | 14px (`text-sm`) | 500 |
| Secondary nav | ~36px | 12.8px (`text-[0.8rem]`) | 500 |
| Tertiary pills | ~26px | 12px (`text-xs`) | 500 |

Each tier is ~13px shorter than the one above. Same Stolzl Medium 500 throughout, only the size descends — visual hierarchy from type size + padding, not from changing the font.

## IVG application

This is the pattern PortfolioEnergy needs for its four sub-sub-tabs (Consumption / Heating strategy / Power strategy / Metering & data quality).

Current IVG implementation in `PortfolioEnergy.jsx` already has a pill bar — verify against these specs and adjust where needed:
- Pill `padding: 4px 12px; font-size: 0.75rem; font-weight: 500`
- Active `background: var(--color-nza-coral); color: white`
- Inactive `background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5)`
- Container `gap: 6px`
- Title above pills uses **Source Serif 4** at 2rem, coral colour
