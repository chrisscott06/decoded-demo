# EOC tokens — `index.css` `@theme` block

Source: `nza-eoc-nzr/src/index.css` lines 46–68.

## EOC tokens (full set)

```css
@theme {
  /* EOC Brand */
  --color-eoc-orange: #e8712b;
  --color-nza-teal: #3a7d7e;

  /* Theme Colours */
  --color-theme-estate: #5B7B9A;
  --color-theme-travel: #F2A93B;
  --color-theme-supply-chain: #347373;
  --color-theme-commuting: #D4891F;

  /* Backgrounds */
  --color-dark-bg: #0a0e17;
  --color-light-bg: #f8f7f4;
  --color-bg-strategy: #0F2222;

  /* Four-level type hierarchy */
  --font-hero: "Stolzl", sans-serif;          /* H1 — Stolzl Book (weight 400) */
  --font-display: "DM Serif Display", serif;  /* H2 — elegant serif */
  --font-heading: "Stolzl", sans-serif;       /* H3/H4 — Stolzl Medium (weight 500) */
  --font-body: "DM Sans", system-ui, sans-serif; /* Body — DM Sans 400 */
  --font-mono: "JetBrains Mono", ui-monospace, monospace; /* Numerical displays */
}
```

## IVG token mapping (what to add / change in `eir/src/styles/`)

| EOC token | IVG decision |
|---|---|
| `--color-eoc-orange` | Stay with existing `--color-nza-coral` (Brief 14 baseline). Don't introduce orange. |
| `--color-dark-bg` | Existing `--color-dark-register-bg: #0F1629` (Brief 10) — keep. |
| `--color-light-bg` | Existing cream token if present; otherwise N/A — IVG is dark-register-first. |
| `--font-hero` / `--font-display` | Use existing **Source Serif 4** (Brief 14) for both. Currently registered as `--font-site`. Re-purpose / add an alias `--font-display: var(--font-site)`. |
| `--font-heading` | Existing Stolzl 500 — keep. |
| `--font-body` | Existing Inter — keep. |
| `--font-mono` | **BANNED** (Chris 2026-06-03 SiteHoverCard ask). Audit any remaining `--font-mono` usage and re-route to Stolzl. Already done on SiteHoverCard. |

## Brief 17.5 §Part 1 — six new tokens to declare

For the Consumption chart (Part 3) and any future thematic energy view:

```css
@theme {
  /* Energy palette — pulls from Map view (Brief 14) gas-red / electricity-yellow.
     Six tokens cover the three states per commodity. */
  --color-energy-gas-landlord:                /* Brief 14 gas-red — exact */;
  --color-energy-gas-resident-submetered:     /* gas-red at lighter tone (≈75% L) */;
  --color-energy-gas-resident-estimated:      /* base gas-red, hatched fill applied via SVG pattern */;

  --color-energy-elec-landlord:               /* Brief 14 electricity-yellow — exact */;
  --color-energy-elec-resident-submetered:    /* electricity-yellow at lighter tone */;
  --color-energy-elec-resident-estimated:     /* base yellow, hatched fill via SVG pattern */;

  /* Scope opacity */
  --opacity-in-scope: 1;
  --opacity-out-of-scope: 0.4;
}
```

**Map view colour lookup needed in Part 1:** find the actual Brief 14 hex values for gas-red and electricity-yellow in the current codebase (likely in a `chart-colors.js` or `mapThemes.js` module), and bind the landlord tokens to those exact values. Do NOT redeclare new hex.

## Notes on EOC type usage at runtime

```css
@layer base {
  body { font-family: var(--font-body); font-weight: 400; }
  h1   { font-family: var(--font-hero);    font-weight: 400; }
  h2   { font-family: var(--font-display); }
  h3, h4 { font-family: var(--font-heading); font-weight: 500; }
  p, li, td, span, label, input, textarea, select, button {
    font-family: var(--font-body); font-weight: 400;
  }
}
```

- Body defaults map onto `<p>`, `<li>`, `<td>`, `<span>`, `<label>`, form controls — every text element except headings and explicit overrides gets Body (Inter for IVG).
- Headings get explicit fonts at the base layer — no per-component re-binding.
- Pill labels, nav labels, buttons inherit Body by default BUT are overridden in-component with `font-heading` class (Stolzl) — see `Navigation.jsx` `font-heading font-medium`.

## Site-name + `--font-site` rule (IVG-specific)

Brief 14 established `--font-site` = Source Serif 4 for site/village names only. Brief 17.5 §Part 1 mandates the audit: every site mention across the tool renders with the site icon + `--font-site`. EOC's `Leadership.jsx` does this conceptually with peer names in display font + logo tiles — same idea, different domain.

IVG audit targets:
1. PortfolioMap — already correct (Brief 14 close).
2. SiteHoverCard — site name already in `--font-site`; status icons now per 2026-06-03 fix.
3. PortfolioEnergy chart bars (Part 3 work) — bar labels must use icon + Source Serif.
4. PortfolioEnergy tooltips — same.
5. Site Overview / Site Detail page titles — already correct (Brief 15).
6. Home tiles — site names if any (currently no per-site tiles on home — N/A).
