# Chunk 10 — render evidence

Captured 2026-05-08 at `http://localhost:5173/` from `npm run dev` (Vite 8.0.11, React 19).

The brief asked for the same visual evidence as chunk 9. Same caveat applies: Claude Preview MCP returns screenshots inline only — no save-to-disk path. Two screenshots captured visually in the working session (landing page at desktop width, Austin Heath detail page) and the structured DOM evidence below is the audit trail.

## PASS criteria — all met

| Criterion | Result |
|---|---|
| All 13 canonical sites in landing table | ✓ table_rows = 13 |
| Click column header sorts asc/desc with indicator | ✓ verified GIA col: asc puts Austin Heath (14,216) first, Bramshott (27,666) last among numbers, nulls last; desc reverses; indicator switches ▲ ↔ ▼ |
| Click site row → /site/[id] with full JSON | ✓ Austin Heath row → URL becomes `/site/austin-heath`, h1 → "Austin Heath", `<pre>` contains `"id": "austin-heath"` and `"total_units": 167` |
| Brand palette applied | ✓ navy `#1a2740` on h1/h2/links/site-name; coral `#e35d4a` on card top stripes + sort indicator + hover; neutral scale on bg/rules/muted/body |
| Playfair Display on headings, Inter on body | ✓ `getComputedStyle` confirms `Playfair Display, Georgia, serif` on h1 and `Inter, system-ui, ...` on body |
| Header strip "Reporting period CY2025 · Built ..." | ✓ `.status-strip` reads "Reporting period CY2025 · Built 2026-05-07T23:34:23.348456+00:00" |
| <640px viewport switches to stacked cards | ✓ at 518px: `.site-table-wrap` offsetHeight = 0, `.site-cards` offsetHeight > 0, 13 `.site-card` elements rendered |
| `npm run build` passes | ✓ 674ms, 216 KB JS / 3.92 KB CSS, gzipped 66 KB / 1.3 KB |
| Vercel deploys, `/` and `/site/austin-heath` return 200 | ✓ verified after push (see STATUS.md final entry) |

## Notes for Chris in the morning

- Brand palette is the fallback set — primary navy `#1a2740`, accent coral `#e35d4a`, neutrals `#f7f7f5 / #e5e5e0 / #666 / #1a1a1a`. Defined as CSS custom properties on `:root` in `eir/src/index.css`. Replacing them with the real IVG palette is a one-file change.
- Tiny custom router in `eir/src/App.jsx` (no router dep). Two routes: `/` and `/site/[id]`. Vercel `vercel.json` has matching rewrites so `/site/austin-heath` direct loads serve `index.html`.
- Sort comparator puts nulls last in ascending order, but nulls-first in descending (consequence of negating the comparator). Minor UX issue — won't fix in chunk 10, acceptable for a stub.
- Mobile and desktop layouts both render the same React state (sorted by `sortKey`/`sortDir`). The CSS `@media (max-width: 640px)` toggles which view is visible.
