# decoded-demo

A permanent anonymised demo of an ESG / GRESB reporting tool,
presented as if built for the fictional **Westbrook Academies Trust**
— a UK Multi-Academy Trust running 11 schools.

**Fictional, not a real client report.** All school names, regional
distribution, source spreadsheets, and chapter narratives have been
anonymised. Per-site values are perturbed ±10 % from the source via
a deterministic `seed=42` multiplier so the format is real but the
magnitudes are not. See `_meta._demo_note` in any `pipeline/dist/eir/*.json`
for the explicit honesty marker.

## Running it

```
git clone https://github.com/chrisscott06/decoded-demo.git
cd decoded-demo
launch.bat
```

`launch.bat` pulls main, runs `npm install --silent`, starts Vite on
port **5174**, and opens the browser. Demo password (set in
`eir/src/components/PasswordGate.jsx`):

  `NZAI-demo-2026`

Requires Python 3.11+ and Node 20 LTS.

## Stack

- React 19 + Vite 8 (shell at `eir/`)
- Recharts 3.x + framer-motion 12 (charts + transitions)
- Python 3.11 pandas pipeline (data layer at `pipeline/`)
- Vercel deployment (separate project from any source tool; wired
  up after first visual QA pass)

## Palette

Anchored in the decodED brand: deep green primary, warm cream
canvas, orange accent. Full token table in `CLAUDE.md` under
"decodED palette."

## Provenance

Forked from a private NZA client tool at a fixed commit (see
`CLAUDE.md` "Provenance" section for the exact reference).
Anonymisation landed across five named commits on `main` — `git log`
makes the cleanup visible.

## License + use

Internal demo template for NZA prospect conversations. Not a
shippable product, not affiliated with any real Academy Trust, not
an authoritative source for any school's footprint.
