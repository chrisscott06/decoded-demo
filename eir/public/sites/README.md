# public/sites — per-site imagery

Imagery for each of the 13 canonical sites (12 villages + Edwalton head office),
keyed by the `site_id` used in `pipeline/site_resolver.py` and `src/data/sites.json`.

This is an **intentional, in-scope workstream** (the "site imagery" handover) —
not stray extraction artefacts. Do not archive or delete without checking with Chris.

## Files per site folder

| File | What it is |
|---|---|
| `hero.jpg` | Village exterior photo — Westbrook marketing carousel image, max 2000px, JPEG q85 |
| `aerial.png` | 1024×1024 satellite crop, Esri World Imagery, centred on the site coordinate |
| `site-plan.png` | Masterplan / site-layout drawing rasterised from the NZA drawings folder |
| `icon.svg` | Village line-art emblem from the Westbrook "Our villages" menu (`fill: currentColor`) |
| `_meta.json` | Provenance — source URLs, coordinates, capture dates, attribution |

## Coverage

- `hero.jpg` — 12 villages (not Edwalton — head office, no Westbrook village page)
- `aerial.png` — all 13 sites
- `icon.svg` — 12 villages (not Edwalton — not in the villages menu)
- `site-plan.png` — 8 villages only. No drawings were available for
  ampfield-meadows, blendworth-hills, millfield-green or sonning-common —
  see `extraction-log.csv`. These need chasing up with Westbrook.
- `millfield-green/aerial-from-smart-grid-report.jpg` — a pre-extracted
  high-res aerial supplied with the handover.

## Regenerating

- `scripts/scrape_heroes.py` — hero photos
- `scripts/build_aerials.py` — aerials + writes lat/long into `src/data/sites.json`
- Site plans were extracted in a Cowork session with local access to the NZA
  drawings folder; see `extraction-log.csv` for the source drawing per site.
