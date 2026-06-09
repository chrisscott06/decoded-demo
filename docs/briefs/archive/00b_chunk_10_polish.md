# Chunk 10 — polish chunk 9

**Author:** Chris (via Claude main thread, 2026-05-08 ~01:35 BST)
**Scope:** Polish the Phase 0 minimal shell. Single chunk, single PR-equivalent commit (or a small batch — same chunk discipline).
**Stop rule:** When PASS criteria below are met, stop. Do **not** start Phase 1.

## What changes

1. **IVG brand colours.** No IVG palette source found in `docs/` — using the fallbacks Chris specified:
   - Primary navy: `#1a2740`
   - Accent coral: `#e35d4a`
   - Neutral scale: `#f7f7f5` (page bg), `#e5e5e0` (rules), `#666` (muted), `#1a1a1a` (body)
   - Documented here so Chris can correct in the morning.
2. **Typography.** Playfair Display (serif) for h1/h2 via Google Fonts. Inter (sans) for body via Google Fonts, system stack as fallback. Sentence case headings only.
3. **Three summary cards** at top of landing replacing the bullet list for Sites / GIA / Emissions. Cards visually distinct (border, padding, big number, label).
4. **Sortable site table.** Click column header → sort asc/desc on that column. Visual indicator for sort state.
5. **Per-site detail stub at `/site/[id]`.** Uses same shell layout. Body shows the site's full JSON record pretty-formatted in a `<pre>`. Back link to landing. Tiny client-side router (no router dep) + Vercel SPA rewrite.
6. **Header data-status strip:** "Reporting period CY2025 · Built {build_timestamp}".
7. **Mobile-responsive.** Below 640px viewport, the site table becomes a stacked card list. Real CSS `@media`, not JS feature detection.

## What does NOT change

- Pipeline output (no reader changes; data is still derived from `pipeline/dist/eir/*.json`)
- vercel.json buildCommand (only adds SPA rewrites)
- Branding language — Phase 0 still uses placeholder copy. Voice rules from CLAUDE.md apply when content chapters arrive.

## PASS criteria (write into STATUS.md before starting)

- [ ] All 13 canonical sites render in the landing-page table
- [ ] Clicking any column header sorts the table; clicking again reverses; visual indicator visible
- [ ] Clicking a site row navigates to `/site/[id]` and renders the full JSON for that site
- [ ] Brand palette applied: navy primary used for h1/links/sort indicators, coral accent used at least once (e.g. card accent), neutral scale used for body/muted/borders
- [ ] Playfair Display loads and applies to h1/h2; Inter loads and applies to body
- [ ] Header strip shows "Reporting period CY2025 · Built …"
- [ ] At <640px viewport, the table layout switches to stacked cards (verify by resizing dev server browser tab)
- [ ] `npm run build` passes
- [ ] After push, Vercel deploys and `/` + at least one `/site/[id]` URL both return HTTP 200 with the right content baked into the bundle

## Verification

- Dev server visual check at desktop and mobile widths
- DOM check via `preview_eval` for the sort + routing behaviours
- Vercel curl probes at root and `/site/austin-heath`
- All evidence captured in `docs/chunk-10-render-evidence.md`

## Commit

`chunk-10(shell): polish minimal shell with brand palette, summary cards, sortable table, site detail stubs, mobile responsive`

## Hard stop

If Vercel SPA rewrite breaks deployment for any reason that isn't a build error in your code: stop, document, leave the previous-good deploy in place. Same rule as chunk 9.
