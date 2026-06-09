# EOC primary nav ribbon — `Navigation.jsx`

Source: `nza-eoc-nzr/src/components/shared/Navigation.jsx`.

```jsx
<nav className={`fixed top-0 w-full z-50 px-6 py-2.5 transition-all ${
  isLanding
    ? 'bg-transparent'
    : 'bg-white/90 backdrop-blur border-b border-gray-200'
}`}>
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Nav links - left-aligned for immediate section awareness */}
    <ul className="flex items-center gap-5">
      {NAV_ITEMS.map(({ key, path, label }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path)
        return (
          <li key={key}>
            <Link to={path}
              className={`text-sm font-heading font-medium transition-colors ${
                isActive ? 'text-eoc-orange'
                  : isLanding ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
    {/* Logo lockup right-aligned, h-7 (28px) */}
  </div>
</nav>
```

## Key specs

- **Height:** `py-2.5` (10px top + 10px bottom) + `text-sm` (14px line) + `font-medium` (500) line-height ≈ 49px total. Confirmed by sub-nav `sticky top-[49px]`.
- **Horizontal padding:** `px-6` (24px L/R) on outer; `max-w-7xl` (1280px) inner.
- **Item gap:** `gap-5` (20px between nav items).
- **Active color:** EOC `text-eoc-orange` (#e8712b). IVG equivalent → `var(--color-nza-coral)`.
- **Inactive non-landing:** `text-gray-600 hover:text-gray-900` (dark text on cream/white background).
- **Background non-landing:** `bg-white/90 backdrop-blur border-b border-gray-200`. Translucent white over dark page so content underneath softly bleeds through.
- **Landing:** transparent background, nav text `text-white/60 hover:text-white` over the hero.
- **Position:** `fixed top-0 w-full z-50`.

## IVG translation

IVG's TopNav.jsx currently sits in its own row above a secondary row. To match EOC slimness:
- Pad to 10px vertical, 24px horizontal.
- Use the existing Stolzl 500 (14px = `0.875rem`) for labels.
- Active state: `color: var(--color-nza-coral)`.
- Background: a dark register (IVG uses dark navy `#0F1629` per Brief 10 — keep) instead of EOC's cream, since IVG's primary register is dark. Add subtle bottom border.
- Constrain inner to `max-w-7xl mx-auto` for left-alignment continuity.

Notable difference: EOC keeps a logo lockup on the RIGHT. IVG's current convention is to keep the logo zone on the LEFT (per Brief 14 / Brief 16 — IVG branding is the report's identity). Honour IVG convention here; do not mirror EOC.
