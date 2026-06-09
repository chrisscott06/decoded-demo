# decoded-demo — CLAUDE.md

> **This is a demo template, not a live client engagement.**
>
> The repo started life as an anonymised copy of the IVG ESG Tool
> (the live client project at `chrisscott06/ivg-esg-tool`). All
> client-identifying data has been replaced with a fictional Academy
> Trust narrative so the tool can be screenshotted, demoed, or
> handed to prospects without leaking real client data.

## What this is

A digital ESG / GRESB reporting platform shown as if it were built
for the fictional **Westbrook Academies Trust** — a Multi-Academy
Trust running 11 schools across England. The pipeline reads four
canonical calculation spreadsheets and produces JSON output that
feeds two downstream report pages.

The demo's purpose is to show the *format* of the report, not to
expose any real numbers. Per-site values are perturbed within
±10 % of the source IVG values via a deterministic seed=42
multiplier (see `_meta._demo_note` in the gresb.json).

## Environment

- Local: `C:\Users\ChrisScott\Dev\decoded-demo`
- GitHub: `https://github.com/chrisscott06/decoded-demo`
- Vercel: separate project from the IVG production tool (will be
  wired up after Phase 5).
- Python: 3.11+ for the pipeline. `pipeline/requirements.txt` + venv
  at `pipeline/.venv/`.
- Node: 20 LTS for the shell. `eir/package.json`.
- Vite dev port: **5174** (production IVG on 5173 — both can run
  side by side).

## Launching locally

Double-click `launch.bat` at the repo root. It pulls the latest
`main`, runs `npm install --silent`, starts Vite on port 5174, and
opens the browser at `http://localhost:5174/`.

## Demo password

The PasswordGate constant is in `eir/src/components/PasswordGate.jsx`.
Default for this demo: `NZAI-demo-2026`.

## Folder structure

```
decoded-demo/
├── CLAUDE.md                    # this file
├── README.md                    # public-facing project overview
├── STATUS.md                    # running log (starts fresh in this repo)
├── launch.bat                   # double-click to run locally
├── rebuild-pipeline.bat         # rebuild generated JSON from spreadsheets
├── .gitignore
├── pipeline/                    # Python data pipeline
│   ├── readers/
│   ├── source-data/             # source spreadsheets (do not commit)
│   ├── dist/                    # generated JSON (committed)
│   ├── build.py
│   ├── site_resolver.py
│   ├── requirements.txt
│   └── .venv/                   # local venv (do not commit)
├── eir/                         # ESG Reporting Tool shell
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── docs/                        # demo-template docs (intentionally minimal)
```

## Provenance + further polish

The repo's Phase 1 commit lands the bulk anonymisation pass. A
deeper rewrite of this file — palette token table, fictional Trust
+ school name list, source commit reference, design discipline
inherited from the source tool — is performed in Phase 5 of the
demo-template setup brief.

The design discipline rules from the source IVG engagement (Hard
Rule 11 thematic-page grammar, Hard Rule 11.x body-text alignment
foundation, type scale tokens, etc.) carry across unchanged — they
describe the UI shell, not the client. They're preserved in the
codebase comments at the components that implement them.
