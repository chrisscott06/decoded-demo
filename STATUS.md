# STATUS — decoded-demo

Last updated: 2026-06-10 (Phase 1 land — IVG branding stripped)

## Demo template setup

The repo is an anonymised demo template forked from `chrisscott06/ivg-esg-tool`
and reskinned for the fictional Westbrook Academies Trust. See `CLAUDE.md`
for the demo's context and `README.md` for how to run it locally.

The original IVG-engagement STATUS.md ran 147 KB of brief-and-chunk close
notes. That history isn't relevant to a demo audience and was wiped here.
Future demo-template work should append from this point onward, following
the same chapter-per-brief pattern the source tool used.

## Demo template chapters

### Phase 0 — Repo setup (2026-06-10)
Copy from source IVG tool, init git, set remote, baseline commit, push.
launch.bat added. vite port set to 5174 + strictPort. Source IVG repo's
`start.bat` deleted in the same step.

### Phase 1 — Strip client branding (2026-06-10)
Bulk text sweep "Inspired Villages [Group]" → "Westbrook Academies Trust"
and `\bIVG\b` → "Westbrook" across 63 source files (496 substitutions).
LogoLockup + PasswordGate rewritten as text-wordmark × NZA-logo lockup.
index.html title rebranded. eir/package.json name set to
"westbrook-trust-demo". Client logos at `eir/public/ivg-logo*.svg`
deleted. `docs/` engagement history wiped + replaced with a minimal
placeholder. Root `STATUS.md` and `README.md` and `CLAUDE.md` rewritten
to demo-template scope (deep palette + school list + provenance polish
deferred to Phase 5).

### Phase 2 — apply decodED palette (2026-06-10)
Token values in `eir/src/index.css` retuned to decodED's deep-green +
cream + orange family: --color-nza-coral → #E8743C, --color-nza-cream
→ #F3EFE3, --color-theme-base → #1F3328 deep green-tinted surfaceDark,
--metric-gas + --metric-electricity locked to decodED's standardised
metric values. Thematic section colours (energy / water / waste /
carbon / meters) retuned to live in the same decodED family while
staying mutually distinct. Token NAMES kept (sole --color-westbrook-*
aliases added at the bottom of @theme to give future authors the
role-named surface the brief asked for). Hex-literal sweep across
eir/src updated 26 files, 231 substitutions, catching case variants
and rgba/rgb decimal triples. chart-colors.js JS mirror brought into
lockstep with the CSS.
### Phase 3 — anonymise site names (2026-06-10)
11 in-scope IVG site names → 11 school names via a structure-aware
Python sweep. Pipeline `dist/` data layer (1.9 MB across 17 files,
not part of the original Phase 0 copy — `dist/` was excluded; brought
across before this phase since the UI loads from it). Site IDs kept
identical (austin-heath, gifford-lea, ...) so committed JSON keys
and URL routes stay stable; only display names + refs changed. The
2 OOS sites (Sonning Common, Edwalton Office) dropped from every
data structure that referenced them: top-level keys in sites.json,
site_summaries.json, _meta.json; array entries by id/ref/display
match; site_coordinates.json rewritten by hand. pipeline/site_resolver.py
rewritten — 11 schools, OOS markers added to KNOWN_UNMAPPED so any
residual spreadsheet rows referencing the old names get classified
as "known OOS" not "unmapped." Site icon directories renamed
implicitly (eir/public/sites/<id>/ — IDs preserved, icon.svg
content kept per Chris's explicit ask). Sonning + Edwalton dirs
deleted. pipeline/dist/eir/build_log.txt + eir/public/sites/extraction-log.csv
deleted (engagement history not relevant to the demo). 39 JSON
files structurally-pruned + renamed; 27 text files renamed (236
substitutions); narrative copy in PortfolioEnergy + Landing edited
by hand where it referenced "13 retirement villages" or the OOS
sites by name.
### Phase 4 — randomise headline numbers ±10 % deterministic (2026-06-10)
Per-site multipliers in [0.90, 1.10] generated via random.seed(42).
Applied to every numeric energy / carbon / water / waste value across
seven dist files. Portfolio rollups recomputed from perturbed per-site
values. portfolio.json's stale top-level headcounts (site_count=13,
village_count=12, office_count=1, gresb_oos_site_ids=[..2..]) reset
to reflect the demo's 11-school estate (11/11/0/[]). Site identity
fields (GIA, units, occupancy %) NOT perturbed — factual descriptors,
not measurements. GRESB scores NOT perturbed — abstract indicator
points, not real-world measurements.

Per-site multipliers (stable across regenerations with seed=42):
  austin-heath × 1.0279
  gifford-lea × 0.9050
  bramshott-place × 0.9550
  millbrook-village × 0.9446
  durrants-village × 1.0473
  great-alne-park × 1.0353
  ledian-gardens × 1.0784
  elderswell × 0.9174
  millfield-green × 0.9844
  ampfield-meadows × 0.9060
  blendworth-hills × 0.9437
  mean = 0.9768

Honest headline shift: -2.6 % on portfolio total energy consumption
(17,669 → 17,203 MWh), -1.6 % on actual emissions (2,615 → 2,573 tCO2e).
Per-site shifts span -9.5 % to +7.8 % so per-site charts WILL look
visibly different — the magnitude story per site changes meaningfully
even though the portfolio total doesn't move dramatically. Per the
brief's honest-by-default rule: this matches the "headline barely
moves but per-site shape shifts" pattern Chris flagged. Did NOT
layer a global shift on top to push the headline further away from
the source — defer to Chris if he wants that.
### Phase 5 — metadata polish + final sweep (2026-06-10)
CLAUDE.md expanded with decodED palette table (16 tokens with hex
+ role), 11-school list with site IDs + refs + regions, password
location, launch.bat instructions, provenance commit hash from the
source tool (`f2a54ea`), and the 6-commit phase ledger. README.md
rewritten as a public-facing 30-line description stressing
"fictional, not a real client report."

Final residuals sweep:
  - `inspiredvillages.co.uk` URLs scrubbed from all 11
    eir/public/sites/<id>/_meta.json files (source_page +
    source_image_url fields blanked).
  - scripts/ directory dropped (one-shot IVG hero-photo +
    aerial-fetch scripts — no longer relevant in a fictional
    school context).
  - pipeline/dist/eir/ JSON files re-swept for "IVG" / "Inspired
    Villages" residuals — 4 files updated (reconciliation,
    rfi_status, sites, water).

Final grep state: `\\bIVG\\b|Inspired Villages|inspiredvillages` =
24 hits across 6 files, all deliberate provenance language in
CLAUDE.md / STATUS.md / README.md / index.css comments /
chart-colors.js comments / PortfolioEnergy.jsx comments. Zero
user-visible IVG leaks.

## Outstanding for Chris

  - **Vercel wire-up:** create a new Vercel project pointing at
    `chrisscott06/decoded-demo`, link main branch, confirm build
    + dev URL.
  - **Visual QA pass:** boot `launch.bat`, click through every
    chapter and chart. The retune happened code-side; no
    foreground browser walkthrough yet. Likely-to-catch issues:
    chart contrast on the new dark register; water-vs-overview
    distinction now that water moved to info-blue; GRESB-26
    darker-shade pair on out-of-scope bars (now an empty array —
    the OOS layer may render zero bars or hide its empty state).
  - **Optional headline shift:** if the -2.4 % portfolio shift
    isn't far enough from the source, add a global multiplier
    in `.phase4_perturb.py` (e.g. 1.07) and re-run after `git
    checkout` of the dist files.
  - **"Retirement villages" → "schools" prose sweep:** Phase 3
    handled NAMES; the narrative copy in PortfolioEnergy still
    talks about "phases" / "village centres" / "residents" /
    "bulk meter for the whole village" — sensible for IVG but
    reading slightly off for an education estate.
