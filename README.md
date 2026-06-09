# decoded-demo

A permanent, anonymised demo of the IVG ESG Tool, presented as if
built for the fictional **Westbrook Academies Trust** — a UK
Multi-Academy Trust running 11 schools.

**Fictional, not a real client report.** All site names, numbers,
and supporting prose have been anonymised. Per-site values are
perturbed ±10 % from the source via a deterministic seed=42
multiplier so the format is real but the magnitudes are not.

## Status

Demo template, ongoing. See `STATUS.md` (intentionally minimal in
the demo) and `CLAUDE.md` (full demo-template provenance + palette
+ school list — populated by Phase 5 of the demo-template brief).

## Running it

Double-click `launch.bat` at the repo root. Pulls `main`, runs
`npm install --silent`, starts Vite on port 5174, opens the
browser. Requires:

- Python 3.11+
- Node 20 LTS

The demo runs on a different port (5174) from the source IVG
production tool (5173) so both can run side by side.

The password gate uses the demo password `NZAI-demo-2026`.

## Stack

- React 19 + Vite 8 (shell at `eir/`)
- Recharts 3.x + framer-motion 12 (charts + transitions)
- Python 3.11 pandas pipeline (data layer at `pipeline/`)
- Vercel deployment (separate from the IVG production project)

## Palette

Anchored in the decodED brand: deep green primary, warm cream
canvas, orange accent. Full token table in `CLAUDE.md` (added by
Phase 5).

## Provenance

Forked from `chrisscott06/ivg-esg-tool` at production HEAD. See
the first commit on `main` ("Initial copy from ...") for the
exact reference point. Anonymisation pass landed across five
named phases of the demo-template brief.
