# Site Imagery — Handover

**Date:** 2026-05-22
**Prepared by:** Cowork session (Chris)
**Purpose:** Hand to Claude Chat to write an implementation brief for Claude Code.
**Repo:** `github.com/chrisscott06/ivg-esg-tool` · committed locally as `252907e`, **not pushed**.

This handover covers a completed data-gathering job: per-site imagery for all 13
canonical sites has been collected, processed, and committed to `public/sites/`.
What remains is **integrating that imagery into the EIR shell UI** — that is the
work a brief should describe.

---

## 1. READ THIS FIRST — parallel-session collision

This repo is being driven by a separate, structured "brief lifecycle" session
(Claude Code working through numbered Briefs). During its **Brief 6**, that
session saw this imagery work as untracked stray files, classified it as
out-of-scope "EOC map-extraction artefacts", and moved it to
`.archive-eoc-extraction/` (gitignored) — **the image binaries were lost in
that move**. Everything was regenerated and is now committed (tracked), and a
`public/sites/README.md` marks it as intentional.

**Implication for the brief:** the brief must explicitly state that
`public/sites/` imagery is an in-scope, sanctioned part of the project, so the
brief-lifecycle session does not archive or delete it again. Ideally the
imagery work becomes its own numbered Brief.

---

## 2. What was delivered

All under `public/sites/{site_id}/`. `site_id` values are the **pipeline
canonical IDs** from `pipeline/site_resolver.py` (confirmed with Chris):

```
ampfield-meadows  austin-heath      blendworth-hills  bramshott-place
durrants-village  elderswell        gifford-lea       great-alne-park
ledian-gardens    millbrook-village millfield-green   sonning-common
edwalton-office
```

### File types per site folder

| File | Format | Notes |
|---|---|---|
| `hero.jpg` | JPEG q85, 1600×1067 | Village exterior photo from IVG marketing carousel |
| `aerial.png` | PNG, 1024×1024 | Esri World Imagery satellite crop, centred on the site |
| `site-plan.png` | PNG, ≤2000px longest side | Masterplan rasterised from NZA drawings @200 DPI |
| `icon.svg` | SVG, scalable | Village line-art emblem; uses `fill: currentColor` |
| `_meta.json` | JSON | Provenance: source URLs, coordinates, dates, attribution |

### Coverage matrix

| site_id | hero | aerial | site-plan | icon |
|---|---|---|---|---|
| ampfield-meadows | Y | Y | — | Y |
| austin-heath | Y | Y | Y | Y |
| blendworth-hills | Y | Y | — | Y |
| bramshott-place | Y | Y | Y | Y |
| durrants-village | Y | Y | Y | Y |
| elderswell | Y | Y | Y | Y |
| gifford-lea | Y | Y | Y | Y |
| great-alne-park | Y | Y | Y | Y |
| ledian-gardens | Y | Y | Y | Y |
| millbrook-village | Y | Y | Y | Y |
| millfield-green | Y | Y | — | Y |
| sonning-common | Y | Y | — | Y |
| edwalton-office | — | Y | — | — |

Extras: `public/sites/millfield-green/aerial-from-smart-grid-report.jpg` — a
high-res aerial supplied with the original handover (page 7 of an NZA report).

### Supporting files (also committed)

- `public/sites/README.md` — explains the folder; marks it in-scope.
- `public/sites/extraction-log.csv` — source drawing per site plan (12 rows:
  8 extracted + 4 "no drawing"). *Placed here, not repo root — see §6.*
- `src/data/sites.json` — canonical 13-site manifest (see §4).
- `scripts/scrape_heroes.py`, `scripts/build_aerials.py`, `scripts/README.md`.

---

## 3. How each image type was produced

**Heroes** — IVG `og:image` heroes were rejected: they carry a large centre
logo and several are lifestyle stock shots. Instead, the header **carousel**
images were used (1600px, show the actual village buildings, only a small logo
lockup). Each was hand-picked from that village's gallery. Clean no-logo body
photos exist but only at 600px — too small for a 1200px hero.

**Aerials** — Esri World Imagery (free, no API key), 1024×1024 centred crops at
zoom 18. `build_aerials.py` had a centring bug (it computed but discarded the
sub-tile offset) — **fixed**: it now works in global pixel space and crops a
truly centred window. Bramshott Place's aerial is centred ~180m west of the
official coordinate, which sits in woodland (`_meta.json` records this).

**Site plans** — page 1 of the chosen drawing rendered at 200 DPI, white margins
trimmed, resized to ≤2000px. Title blocks were intentionally kept (they carry
drawing number + revision). Source drawings live in the NZA folder:
`…\26003 - IVG x NZA IESP\02 - Shared & Published\K_Client\2026_03_19 - Previous Data\Layouts\`
Per-site source filenames are in `extraction-log.csv`.

**Icons** — extracted as inline `<svg>` from the IVG "Our villages" menu. The
source markup had an invalid lowercase `viewbox` attribute — **fixed** to
`viewBox` so they scale. They inherit colour via `fill: currentColor`.

---

## 4. `src/data/sites.json` — what changed

This file is the canonical 13-site manifest (12 villages + Edwalton office),
plus 2 coming-soon sites in `coming_soon_for_reference_only`.

**ID reconciliation** — the original handover `sites.json` disagreed with
`pipeline/site_resolver.py` on 3 IDs. Resolved (per Chris) in favour of the
pipeline IDs: `millbrook`→`millbrook-village`, `durrants`→`durrants-village`,
`widmore-park`→`sonning-common`.

**Postcodes** — 9 of the 13 handover postcodes were wrong. All corrected from
authoritative IVG village-page data. Each site now has `postcode`, `address`,
`latitude`, `longitude`, and `coordinates_source`. Coordinates came from the
embedded map data on the IVG village pages (exact), except Edwalton (geocoded
from postcode NG12 4JL).

---

## 5. What is NOT done — gaps

1. **4 villages have no site plan** — Ampfield Meadows, Blendworth Hills,
   Millfield Green, Sonning Common (Widmore Park). The NZA `Layouts` folder has
   no subfolder for them. **Action: chase IVG / NZA for masterplan drawings.**
   The NZA folder used was `2026_03_19 - Previous Data` — a fuller / more recent
   drawings folder may exist and should be checked.
2. **Edwalton head office** has only an aerial — no hero (no IVG village page)
   and no icon (not in the villages menu). The original handover suggested a
   Google Street View tile or an office icon. Decision still open.
3. **Site plan source folder is dated** — drawings in `Previous Data` are mostly
   2020–2021 vintage. Newer revisions may exist elsewhere in the NZA project.
4. **Elderswell's site plan** is a design-option "sketch", not an issued
   masterplan — it was the only site-overview drawing available. Flagged in
   `extraction-log.csv` and `_meta.json`.

---

## 6. Git state & known deviations

- **Committed** as `252907e` on `main` — 65 files, 1 commit ahead of `origin/main`.
- **Not pushed.** The parallel session may have moved the remote; pushing risks
  divergence. Chris to reconcile and push.
- `extraction-log.csv` is in `public/sites/`, **not the repo root** as the
  original brief asked — the repo's working-folder mount blocks creation of new
  files at the repo root (subdirectories are fine).
- `.git/objects/` contains leftover `tmp_obj_*` files — the mount blocked git's
  own cleanup step. Harmless; `git gc` clears them.
- `STATUS.md` was deliberately **not** edited, to avoid clashing with the
  parallel session that owns the brief-lifecycle log.
- `.archive-eoc-extraction/` still exists (gitignored) — leftover empty dirs
  plus stale copies of the scripts. Can be deleted by Chris.

---

## 7. Regenerating (if needed)

From repo root, after `pip install requests beautifulsoup4 Pillow mercantile`:

```
python scripts/scrape_heroes.py      # heroes (NB: uses og:image — see §3 caveat)
python scripts/build_aerials.py      # aerials + writes lat/long into sites.json
```

`scrape_heroes.py` as written fetches `og:image` (the logo-heavy version). The
delivered heroes were hand-picked carousel images — re-running the script would
overwrite them with the inferior default. Site plans require local access to the
NZA drawings folder (a Cowork session); they cannot be regenerated in CI.

---

## 8. Suggested scope for the implementation brief

The data is ready; the build work is **surfacing it in the EIR shell**. The
original handover proposed:

- **Site detail page** — hero photo as the page header, with site-plan and
  aerial as thumbnails that open in a lightbox.
- **Portfolio overview** — a grid of hero photos with the site name overlaid;
  the `icon.svg` emblems could key the site list / table rows.
- Graceful fallback for the 4 missing site plans and for Edwalton (no hero/icon).
- `_meta.json` provides attribution strings to display where required.

A brief should also decide: whether imagery becomes its own numbered Brief;
whether to push the existing commit or rebuild on top of current `main`; and how
to handle the missing assets (placeholder vs. omit).

---

## 9. Source / reference files

- Original handover: the uploaded `HANDOVER.md`, `COWORK_BRIEF.md`, `sites.json`,
  `scrape_heroes.py`, and `site-imagery-handover.zip`.
- NZA drawings: `…\K_Client\2026_03_19 - Previous Data\Layouts\` (8 village
  subfolders; read-only, not modified).
- IVG marketing site: `https://www.inspiredvillages.co.uk/villages/{slug}`.
