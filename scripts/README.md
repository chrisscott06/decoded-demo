# Scripts — Site Imagery

Two Python scripts plus the Cowork brief. Run from repo root.

## Setup

```bash
pip install requests beautifulsoup4 Pillow
```

Copy `sites.json` (from this handover) into the repo at `src/data/sites.json`.

## scrape_heroes.py

Fetches the marketing hero photo for each operational site from inspiredvillages.co.uk.

```bash
# All sites
python scripts/scrape_heroes.py

# One site (debugging)
python scripts/scrape_heroes.py --site millfield-green

# Dry run — don't write files, just show what would happen
python scripts/scrape_heroes.py --dry-run
```

Output: `public/sites/{site_id}/hero.jpg` + entry in `public/sites/{site_id}/_meta.json`.

Note: Edwalton (head office) has no `ivg_url` and will be skipped — handle that one manually (e.g. Street View or office icon).

## build_aerials.py

Geocodes each site's postcode (via postcodes.io, free) and fetches a satellite image.

```bash
# Just geocode — populates lat/long in sites.json
python scripts/build_aerials.py --geocode-only

# Geocode + fetch aerials using Esri World Imagery (no API key needed)
python scripts/build_aerials.py

# With a Google Maps key (sharper, includes attribution baked in)
GOOGLE_MAPS_API_KEY=AIza... python scripts/build_aerials.py
```

Output: `public/sites/{site_id}/aerial.png` + entry in `_meta.json`.

The script updates `sites.json` in place to add resolved lat/long for each site.

## Notes

- **Verify postcodes first.** Several entries in `sites.json` are marked `postcode_approx` because Chris's session memory wasn't 100% confident on them. Run `--geocode-only` first and eyeball the results before fetching aerials. If the geocoded lat/long is wrong, update `sites.json` manually before re-running.
- **Be respectful with the Westbrook site.** The scraper does one request per village page + one per image (~24 requests). Add a small `time.sleep(0.5)` between sites if you want to be extra polite.
- **Re-runs are idempotent.** Both scripts overwrite, so you can re-run safely after editing `sites.json`.

## Site plans (the third image type)

The site plans need to be extracted from Chris's local NZA drawings folder. See `COWORK_BRIEF.md` — that's a prompt to paste into Cowork running on Chris's machine. Cowork can iterate the local folder and rasterize the drawings; the scripts in this folder cannot.
