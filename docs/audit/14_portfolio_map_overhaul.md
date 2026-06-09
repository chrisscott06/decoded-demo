# Brief 14 audit — Portfolio map overhaul

Six map-view defects/asks. The dot alignment, reorder slide, and click
contract were structural; the icons + redesigned card + Source Serif 4
made the page feel like a first-class showpiece. Absorbs the pending
Brief 10 Part 1 (framer-motion reorder).

Reference: [active/14_portfolio_map_overhaul.md](../briefs/active/14_portfolio_map_overhaul.md).

---

## Part 1 — Dot alignment (2026-05-24)

### Root cause

The old `SITE_POSITIONS` in `eir/src/lib/projection.js` was a hand-tuned
percentage table, documented as projecting from real lat/lon against an
**England-only** bounding box (`lat 50.4–53.4, lon -3.8–1.0`). The actual
dotted UK SVG at `eir/public/maps/uk-dotted-map.svg` covers the **whole
UK including Scotland** (dot extent 5.6%–99.4% x, 2.7%–97.6% y; SVG
aspect 1.81). Projecting central-southern England onto the full-UK
viewBox spread southern English sites across the entire silhouette —
Gifford Lea (Cheshire, lat 53.16) rendered visually over mid-Scotland.

### Fix

Rewrote `projection.js` as a function plus optional offset table:

- Exposed `BBOX` (lat 49.8–58.7, lon -6.5–1.8) covering the actual UK
  landmass shown in the SVG.
- Exposed `projectLatLon(lat, lon)` for reproducibility.
- `SITE_POSITIONS` is now computed at module load from
  `pipeline/site_coordinates.json` + per-site `EYEBALL_OFFSETS` (currently
  empty — Chris's Part 1 checkpoint review: "projection sound, proceed").
- `getMarkerPosition(siteId)` API unchanged.

### Chris checkpoint

Showed AFTER overlay zoomed on Millbrook (Devon, projected x=35.8 y=90.1)
and Ledian (Kent, projected x=86.0 y=84.0). Both rendered on landmass
within their respective regions. Approval: "Projection looks sound —
proceed."

### Commit

`39e47e4 Brief 14 Part 1: project map dots from real coordinates + calibration`
(also installed framer-motion + svgo per Chris's checkpoint authorisation).

---

## Part 2 — framer-motion leaderboard reorder (2026-05-24)

### Old behaviour

`.leaderboard` outer div had a metric+toggle-derived `key` that remounted
the entire list on metric change. CSS `animation: nza-row-shift 320ms`
played a one-shot entry fade — rows cross-faded instead of physically
moving.

### Fix

- Imported `motion` from framer-motion (^12.40.0 — installed in Part 1's
  npm pass).
- Removed the outer-div `key` (list now persists across metric changes).
- Removed the `animation: nza-row-shift` CSS (kept the keyframes in
  index.css as a no-cost fallback for any future caller).
- Each row `<div key={site.id}>` → `<motion.div layout transition={...}
  key={site.id}>` with the EOC-extract spring (`damping: 26, stiffness:
  300`).
- Data flow respects extract gotchas already: filter is BEFORE map (rowsRaw
  useMemo at L90-92), keys are stable site.id, the row's CSS only
  transitions `background` (not `transform` or `all`).

### Verified

Captured mid-flight transition (Waste theme → Energy theme): 12 of 13
rows had non-`none` computed transforms during the spring; bar colours
cross-fading green→blue as rows slid. Final state clean.

Absorbs the pending Brief 10 Part 1.

### Commit

`8c60d9b Brief 14 Part 2: framer-motion leaderboard reorder`

---

## Part 3 — Site icons (SVGO + render) (2026-05-24)

### SVGO

`npx svgo --multipass` over all 12 icons at
`eir/public/sites/<id>/icon.svg`. Modest gains (~1.2 kB total) — the
Cowork-generated icons were already fairly clean. Files retained at
native 1050×1050 viewBox with `fill: currentColor` semantics.

### Rendering — CSS mask-image approach

New `.site-icon` class:

```css
.site-icon {
  background-color: currentColor;
  -webkit-mask-image: var(--site-icon-url);
  mask-image: var(--site-icon-url);
  /* … */
}
```

The SVG is used as a clipping mask; the host element's `currentColor`
drives the fill. Icons inherit the row/card text colour automatically
(cream on dark, navy on cream). Per-row inline style sets
`--site-icon-url` so one class covers all 12 sites without per-icon
rules.

### Edwalton Office fallback

No site icon (its mark is the wide IVG wordmark, not icon-slot-shaped).
Uses `.site-icon-fallback` — bordered "iv" monogram in the same 20×20
footprint. Honest, not a broken image (brief Principle 4).

### Layout

- Leaderboard row name column widened 140 → 170 px to fit icon (20) + gap
  (8) + the longest names ("Blendworth Hills", "Bramshott Place").
- SiteHoverCard now shows the icon next to the name in the header.

### Commit

`0a0086a Brief 14 Part 3: site icons in leaderboard + card`

---

## Part 4 — Interaction + card redesign (2026-05-24)

### Click contract — the brief's "sacred" rule

After this brief, **no path** from the Map view navigates away **except**
the explicit "View site →" CTA on the card. Bare clicks select but do
not navigate.

### Implementation

Two state slots in `PortfolioMap`:

- `hoveredSiteId` — controls map highlight only (no card render).
- `selectedSiteId` — set on click; drives the floating card.

Wiring:

- `MapMarkers.onSelectSite` and `Leaderboard.onSelectSite` both call
  `setSelectedSiteId` (was `go()` — direct navigate). Bare click no
  longer leaves the Portfolio section.
- Card render block (was anchored to `hoverData.pos`) now anchored to
  `cardData.pos` (derived from `selectedSiteId`).
- The card's wrapping div drops `pointerEvents: none` so the View-site
  button + close (×) actually work.

### Card redesign (defect #5: duplicate energy line)

Old card had:
- "Total energy" block — `totalEnergy` kWh
- "Active metric value" block — when Energy theme active, ALSO
  `totalEnergy` (duplicate)

New card structure:
- Header: site icon + name + × close button
- Identity strip: units · GIA · primary heating
- **Five domain rows** (no duplication regardless of theme):
  - Electricity: 631k kWh
  - Gas: 2.4M kWh (or "(none)" when `has_gas: false`)
  - Water: 1,835 m³
  - Waste: 32 t · 100% diverted (diversion strap inline)
  - Carbon: 583.3 tCO₂e
- DQ badges row (Elec/Gas/Water/Waste)
- Coral **View site →** CTA — the ONLY navigation path

Card stays a SUMMARY (brief Principle 5) — not a mini site-page.

### Verified

- Hover dot: no card appears (state persists at last click; hover only
  highlights map).
- Click row "Gifford Lea": card anchors to its dot with all five
  domains. URL stays `/portfolio/map`.
- Click "View site →": navigates to `/site/gifford-lea/overview`.

### Commit

`af62ede Brief 14 Part 4: hover/click/card interaction + card redesign`

---

## Part 5 — Source Serif 4 + walkthrough close (2026-05-24)

### Source Serif 4 (Adobe via Google Fonts API, SIL OFL)

- Downloaded `source-serif-4-regular.ttf` (190 kB) +
  `source-serif-4-medium.ttf` (190 kB) from `fonts.gstatic.com` via
  curl, saved to `eir/src/fonts/source-serif-4/`.
- Added two `@font-face` declarations to `eir/src/fonts.css` (mirrors
  the Stolzl pattern — `font-display: swap`, relative path).
- New CSS token in `index.css`:
  `--font-site: 'Source Serif 4', Georgia, 'Cambria', serif;`
  (Georgia/Cambria are the FOUT fallbacks).

### Scoped strictly to site/village names

Applied at FOUR render sites (every place a `site.display_name` shows):

| Location | Wiring |
|---|---|
| `Leaderboard.jsx` row name | `style={{ fontFamily: 'var(--font-site)', fontWeight: 500 }}` |
| `SiteHoverCard.jsx` card heading | same |
| `Sidebar.jsx` list item | `style={{ fontFamily: 'var(--font-site)' }}` |
| `App.jsx` SiteOverview `<h1>` | `style={{ fontFamily: 'var(--font-site)', fontWeight: 500 }}` |
| `App.jsx` Comparisons Card title | `<Panel title={<span style={{ fontFamily: 'var(--font-site)' }}>{site.display_name}</span>}>` |

### Falsifiability

```
grep -rn "Source Serif\|--font-site\|font-site" eir/src \
    --include="*.jsx" --include="*.js" --include="*.css"
```

12 hits total: 5 application sites (all render `site.display_name`), 2
@font-face declarations in fonts.css, 1 token declaration in index.css,
4 documentation comments. **Every application hit is a site-name
render — no leakage.**

### Walkthrough (1440×900)

| Page | Status |
|---|---|
| `/portfolio/map` | ✓ Source Serif on 13 leaderboard names + card heading; site icons cream-coloured; framer slide on metric change; click → card → "View site →" |
| `/portfolio/sites` | ✓ Table view; no site-name render in Source Serif yet (out of Brief 14 scope — table column will be Brief 15 territory if Chris asks) |
| `/portfolio/comparisons` | ✓ Card titles "Austin Heath" / "Millfield Green" in Source Serif |
| `/site/austin-heath/overview` | ✓ Big serif h1 "Austin Heath"; sidebar 13 site names in serif |
| `/site/austin-heath/energy` etc. | ✓ Same sidebar treatment carries across all 7 Site Detail sub-tabs |
| `/insights/*` | ✓ No change (no site display_name rendered on these pages, by design) |
| `/` Landing | ✓ Unchanged |
| `/gresb` | ✓ Unchanged |

### Build

`cd eir && npx vite build` → **✓ built in 1.31 s**, no errors.

### Files touched (Part 5)

- `eir/src/fonts/source-serif-4/source-serif-4-regular.ttf` (new, 190 kB)
- `eir/src/fonts/source-serif-4/source-serif-4-medium.ttf` (new, 190 kB)
- `eir/src/fonts.css` (+18 lines: 2 @font-face declarations + comment)
- `eir/src/index.css` (+6 lines: --font-site token + comment)
- `eir/src/App.jsx` (Site Detail h1 + Comparisons Card title)
- `eir/src/components/Sidebar.jsx` (list item)
- `eir/src/components/portfolio/Leaderboard.jsx` (row name)
- `eir/src/components/portfolio/SiteHoverCard.jsx` (card heading)

---

## PASS — Brief 14 final

1. ✓ HEAD SHA + all 5 parts landed.
2. ✓ All 13 dots projected from real lat/lon; cluster correctly in
   southern/central England; projection function + offset table
   documented.
3. ✓ Leaderboard rows physically slide on metric change (12/13 rows
   with non-`none` transform mid-flight; cross-fading bar colours).
4. ✓ Site icons render next to every name; Edwalton = "iv" bordered
   monogram fallback; no broken glyphs; SVGO applied.
5. ✓ Click contract sacred: hover highlights only; click → card; "View
   site →" is the ONLY route out; bare click on marker AND row do not
   navigate.
6. ✓ Card redesigned: five clean domain rows, no duplicate energy.
7. ✓ Source Serif on site names ONLY; grep confirms no leakage (every
   --font-site hit is a `site.display_name` render).
8. ✓ No scroll at 1440×900 on the Map view; full-tool walkthrough — no
   collateral regression on any of the 8 routes.
9. ✓ Build clean (1.31 s).
10. ✓ Brief archived to `archive/14_portfolio_map_overhaul_COMPLETED.md`;
    current.md repointed; Brief 10 Part 1 cleared as absorbed.

### Known issues / for next brief

- Source Serif 4 currently TTF (~190 kB × 2 = 380 kB). For production
  could be re-encoded to woff2 (~50-70 kB × 2) for faster initial load.
  Brief 14 prioritised getting the type into place; conversion is a
  small optimisation pass.
- Brief 15 (Site section restructure) is the next active brief — Chris
  flagged it as queued behind 14. It will reuse `--font-site` (not
  re-declare) per its own brief.
- Inherited follow-ups: 3 pending HH MPANs, P03 waste workbook.

Brief 14 archived. Pushing.
