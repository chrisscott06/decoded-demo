# decoded-demo — CLAUDE.md

> **This is a permanent demo template, not a live client engagement.**
>
> The repo started life as an anonymised copy of the IVG ESG Tool
> (the live client project at `chrisscott06/ivg-esg-tool`). All
> client-identifying data has been replaced with a fictional
> Multi-Academy Trust narrative so the tool can be screenshotted,
> demoed, or handed to prospects without leaking real client data.

## What this is

A digital ESG / GRESB reporting platform shown as if it were built
for the fictional **Westbrook Academies Trust** — a UK Multi-Academy
Trust running 11 schools across England. The pipeline reads source
spreadsheets and produces JSON output that feeds the report shell
(Portfolio, Site, GRESB chapters).

The demo's purpose is to show the *format* of the report, not to
expose any real numbers. Per-site values are perturbed within
±10 % of the source IVG values via a deterministic `seed=42`
multiplier (`_meta._demo_note` field stamped on every perturbed
JSON file in `pipeline/dist/eir/`).

## Environment

- Local: `C:\Users\ChrisScott\Dev\decoded-demo`
- GitHub: `https://github.com/chrisscott06/decoded-demo`
- Vercel: separate project from the IVG production tool (will be
  wired up after the first manual visual QA pass).
- Python: 3.11+ for the pipeline. `pipeline/requirements.txt` + venv
  at `pipeline/.venv/`.
- Node: 20 LTS for the shell. `eir/package.json` (`"name":
  "westbrook-trust-demo"`).
- Vite dev port: **5174** (source IVG production is on 5173 — both
  can run side by side without colliding).

## Launching locally

Double-click `launch.bat` at the repo root. It:

1. `cd`s into the demo's `eir/` dev project.
2. Runs `git pull origin main`.
3. Runs `npm install --silent`.
4. Starts the Vite dev server (`npm run dev`) in a new window.
5. Opens `http://localhost:5174/` in the default browser after 5s.

## Demo password

Set in `eir/src/components/PasswordGate.jsx`:

  `CORRECT_PASSWORD = 'NZAI-demo-2026'`

sessionStorage key is `westbrook-demo-auth` so the gate clears on
tab close.

## Trust + schools

**Westbrook Academies Trust** runs 11 schools across England. Site
IDs (kebab-case slugs) match the source IVG tool 1-for-1 so committed
JSON keys and URL routes stay stable; only display names + refs are
new.

| Site ID            | Ref | School                                          | Region            |
|--------------------|-----|-------------------------------------------------|-------------------|
| `austin-heath`     | BPS | Beechgrove Primary School                       | South West        |
| `gifford-lea`      | WSA | Whitfield Secondary Academy                     | Midlands          |
| `bramshott-place`  | HOC | Holloway College (Sixth Form)                   | London            |
| `millbrook-village`| MHP | Marston Hill C of E Primary                     | South East        |
| `durrants-village` | HUT | Hartwell University Technical College           | North West        |
| `great-alne-park`  | STM | St Margaret's Catholic Secondary                | Yorkshire         |
| `ledian-gardens`   | EAF | Eastlea Federation (Multi-Academy Trust)        | East of England   |
| `elderswell`       | RVF | Riverdale Free School                           | South West        |
| `millfield-green`  | PCC | Penrith Community College (Further Education)   | North West        |
| `ampfield-meadows` | ASN | Aldergate Special Educational Needs School      | Midlands          |
| `blendworth-hills` | PEP | Pennington Pre-Prep & Junior (Independent)      | South East        |

Dropped from the source IVG tool: Sonning Common, Edwalton Office
(the 2 out-of-scope sites — pre-launch + head office).

## decodED palette

| Token (CSS)                       | Hex       | Role                                          |
|-----------------------------------|-----------|-----------------------------------------------|
| `--color-nza-cream`               | `#F3EFE3` | Canvas (warm cream)                           |
| `--color-nza-cream-light`         | `#FAF6EB` | Elevated canvas (slightly lighter)            |
| `--color-nza-coral`               | `#E8743C` | Accent orange (CTA + active highlight)        |
| `--color-theme-base`              | `#1F3328` | Dark register (deep green-tinted near-black)  |
| `--color-theme-body`              | `#F3EFE3` | On-dark cream text                            |
| `--color-theme-accent-primary`    | `#F4A878` | Softer accent orange                          |
| `--color-westbrook-primary`       | `#0F5D43` | Brand deep green (decodED primary)            |
| `--color-westbrook-primary-light` | `#3A8867` | Brand light green                             |
| `--metric-electricity`            | `#E6B91E` | Electricity (LOCKED across NZA tools)         |
| `--metric-gas`                    | `#D94B3D` | Gas (LOCKED across NZA tools)                 |
| `--theme-energy`                  | `#E8743C` | Energy chapter (orange family)                |
| `--theme-water`                   | `#5A8FB5` | Water chapter (info blue)                     |
| `--theme-waste`                   | `#8B5CB5` | Waste chapter (purple)                        |
| `--theme-carbon`                  | `#3D8B5C` | Carbon chapter (green)                        |
| `--theme-meters`                  | `#4A9C9C` | Meters chapter (deep teal)                    |
| `--theme-overview`                | `#5A6B5F` | Overview chapter (muted green-grey)           |

The token NAMES are kept from the source IVG tool (renaming them
would have rippled through hundreds of utility-class consumers
unnecessarily); the VALUES are all retuned to live in the decodED
family. A small `--color-westbrook-*` alias block at the bottom of
`@theme` in `eir/src/index.css` gives future authors role-named
tokens (`primary`, `secondary`, `accent`, `warning`, `text-cream`,
`text-navy`, `text-muted`) per the demo-template brief convention.

## Folder structure

```
decoded-demo/
├── CLAUDE.md                    # this file
├── README.md                    # public-facing project overview
├── STATUS.md                    # running log
├── launch.bat                   # double-click to run locally
├── rebuild-pipeline.bat         # rebuild generated JSON from spreadsheets
├── .gitignore
├── pipeline/                    # Python data pipeline
│   ├── readers/                 # per-source readers
│   ├── source-data/             # source spreadsheets (DO NOT COMMIT — gitignored)
│   ├── dist/                    # generated JSON (committed; perturbed per Phase 4)
│   ├── build.py
│   ├── site_resolver.py         # 11 canonical site IDs + variant lookup
│   ├── requirements.txt
│   └── .venv/                   # local venv (do not commit)
├── eir/                         # ESG Reporting Tool shell (React 19 + Vite 8)
│   ├── src/
│   ├── public/                  # site icons, NZA logo (IVG logo deleted Phase 1)
│   ├── package.json
│   └── vite.config.js           # port 5174 strictPort
└── docs/                        # demo docs (intentionally minimal)
```

## Provenance

Forked from the IVG production tool at:

  Repo:   `chrisscott06/ivg-esg-tool`
  Commit: `f2a54ea` (2026-06-10, "chore(launchers): remove start.bat
           from production project")

Anonymisation landed across five named phases:

| Phase | Commit on this repo's main | What                                   |
|-------|----------------------------|----------------------------------------|
| 0     | first commit on main       | Initial copy from source + launch.bat  |
| 1     | next commit                | Strip IVG branding → Westbrook         |
| 2     | next commit                | Apply decodED palette                  |
| 3     | next commit                | Anonymise site names + drop 2 OOS      |
| 4     | next commit                | Randomise headline ±10 % (seed=42)     |
| 5     | this commit                | CLAUDE + README polish + final sweep   |

## Voice and style (carries from the source tool)

- Measured, professional, slightly understated. Auditor-grade where
  it matters.
- No "we", no "you", no first-person.
- No internal-team language ("ship", "land", "deep-dive" as a verb).
- Sentence case for headings. Em-dashes for parenthetical clauses.
- No emojis in copy.

These rules apply once narrative content is added; the demo carries
them from the source tool's design discipline.

## Design discipline carried from the source

The source IVG tool's design rules around thematic-page grammar,
body-text alignment foundation, type scale, ResponsiveContainer
heights, and Recharts 3.x PieChart sizing are all preserved in the
codebase comments at the components that implement them. They
describe the UI shell, not the client engagement, so they carry
across unchanged. Search the codebase for "Hard Rule 11" /
"Rule 11.x" / "Brief 17.5.3" comments for the canonical references.
