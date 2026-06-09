# Chunk 9 — localhost render evidence

Captured 2026-05-08 at `http://localhost:5173/` from `npm run dev`.

The brief asked for a PNG screenshot here. The tooling available overnight (Claude Preview MCP) returns screenshots inline only — there's no save-to-disk path without spinning up an additional headless browser. The screenshot was reviewed visually and the structured DOM evidence below is the auditable substitute.

## DOM verification

Queried via JS in the running Vite dev server:

```js
{
  h1: "IVG ESG Tool",
  portfolio_listed: true,        // body contains "217,314" (total GIA)
  waste_listed: true,            // body contains "144.503" (tonnage total)
  edwalton_in_table: true,
  site_row_count: 13,
  site_names: [
    "Ampfield Meadows",
    "Austin Heath",
    "Blendworth Hills",
    "Bramshott Place",
    "Durrants Village",
    "Edwalton Office",
    "Elderswell",
    "Gifford Lea",
    "Great Alne Park",
    "Ledian Gardens",
    "Millbrook Village",
    "Millfield Green",
    "Sonning Common"
  ]
}
```

All 13 canonical sites render in the table, alphabetically sorted. Portfolio summary section displays totals from `portfolio.json` correctly.

## Visual notes

- Default Vite scaffold's `index.css` was replaced with a minimal light-theme reset; the scaffold otherwise forced 56px centred headings on a dark background that fought the inline styles in `App.jsx`.
- Page is a plain HTML report — no design system applied. Phase 0 is intentionally minimal per brief.

## Build verification

`npm run build` — succeeded (109ms, 213 KB JS / 1.78 KB CSS). Output in `eir/dist/`.
