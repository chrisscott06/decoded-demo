# Phase 0 — overnight session summary

**Date:** 2026-05-08 (UK)
**Started:** ~00:08 BST
**Finished:** ~01:25 BST
**Duration:** ~1h 17m
**Outcome:** All 9 chunks PASSed. Pipeline + minimal shell live on Vercel.

## Chunks completed

| # | Chunk | Outcome | Notes |
|---|---|---|---|
| 1 | Repo skeleton | PASS | Smooth — git init, remote add, templates, first push all clean |
| 2 | Pipeline foundations | PASS | Hit a latent .gitignore bug (inline trailing comments don't work in gitignore) — fixed in same commit |
| 3 | Site Overview reader | PASS | Two brief-vs-workbook divergences flagged for morning review |
| 4 | Arbnco reader | PASS | Brief and inventory both omitted the leading blank column in Raw Data; reader handles correctly |
| 5 | Water reader | PASS | "Mixed" data_quality not in brief's mapping table — defaulted to partial per brief's prescribed handling |
| 6 | Waste reader | PASS | Workbook tracks `cardboard` not `hazardous` (brief said hazardous) — used cardboard |
| 7 | Portfolio rollup | PASS | Per-site Arbnco elec sum is 6.3 MWh below portfolio row (0.08%) — inventory warned of this drift |
| 8 | Validation pass | PASS | Clean rebuild from empty dist/eir/, 0 validation issues |
| 9 | Vite shell + Vercel | PASS | Deploy live at https://ivg-esg-tool.vercel.app/ |

Total commits pushed: 10 (1 init + 8 chunks + 1 session summary)

## Live URLs

- **Vercel:** https://ivg-esg-tool.vercel.app/
- **GitHub:** https://github.com/chrisscott06/ivg-esg-tool

## Notable decisions made

### Path adaptations from brief
- Brief assumed `pipeline/source_data/` (underscore) and `briefs/` (root). Actual layout is `pipeline/source-data/` (hyphen) and `docs/briefs/`. Honoured your layout — CLAUDE.md, .gitignore, and pipeline code reference actual paths. No source files moved.

### Workbook contradicts brief PASS criteria — workbook wins
- **Site refs (chunk 3):** brief/inventory have `MB`/`GA`/`MG`/`EO`. Workbook has `MV`/`GAP`/`MFG`/`HQ`. Updated `site_resolver.py` ref values to match workbook. The 2-letter refs are display metadata only; canonical kebab-case IDs unchanged.
- **Blendworth Hills energy benchmarks (chunk 3):** brief said this should be `null`. Workbook has real EUI data for Blendworth Hills. Used the data.
- **Millfield Green heating (chunk 3):** brief said "GSHP". Workbook says "ASHP (heat network)". Used workbook value.
- **Sonning Common waste (chunk 6):** brief implied no waste data ("missing"). Workbook has real BIFFA data (0.095 t total / 0.002 tCO2e). Used the data.
- **Waste tonnage stream "hazardous" → "cardboard" (chunk 6):** brief listed hazardous as a stream. Workbook tracks cardboard. Used cardboard.

### Latent gitignore bug
The brief's `.gitignore` template has inline trailing comments after path patterns. Git's gitignore syntax does NOT support inline comments — the rule becomes a literal pattern with the comment baked in. Source spreadsheets and briefs were silently NOT being ignored under chunk 1's commit. Caught at chunk 2 staging via `git check-ignore`. Fixed in chunk-2 commit. **Worth updating the brief template if you hand it to anyone else.**

### Stdout encoding
Windows default cp1252 console choked on en-dashes/arrows from build_log.txt output. Fixed at top of build.py with `sys.stdout.reconfigure(encoding="utf-8", errors="replace")`. JSON files were always written explicitly as UTF-8, so this only affected the live console output.

### Sycous resident split (chunk 4)
Brief explicitly defers landlord/resident electricity split until Sycous data is available. Reader records meter-aggregate consumption + emissions and adds a `notes` field flagging the pending split for sites where any electricity stream is `Scope 3 Cat 13`. No attempt to invent the apportionment.

### Vercel
Deploy went through cleanly to https://ivg-esg-tool.vercel.app/ on the chunk-9 push. No paywalls, no auth prompts, no payment required. Free tier is fine for this scale.

### Screenshot caveat (chunk 9)
The brief asked for a PNG screenshot at `docs/chunk-9-localhost-screenshot.png`. The available tooling (Claude Preview MCP) returns screenshots inline only — there's no save-to-disk path without spinning up a separate headless browser. Substituted DOM evidence in `docs/chunk-9-localhost-render-evidence.md`: queried via JS in the running dev server, captured all 13 site names + portfolio totals as structured data. Same audit value, different format.

## Open questions for Chris

1. **Refs:** keep workbook's `MV`/`GAP`/`MFG`/`HQ` (current state), or revert to the brief/inventory's `MB`/`GA`/`MG`/`EO`? If the latter, also worth deciding whether to update the workbook to match.
2. **Inventory updates:** several brief PASS criteria are stale relative to current workbook contents (Blendworth Hills energy, Millfield Green heating, Sonning Common waste, the leading blank column in Arbnco Raw Data). Worth a single inventory refresh pass before Phase 1 starts.
3. **Vercel project name:** the deploy is at `ivg-esg-tool.vercel.app` — fine for now. If you want a custom domain or rename, that's a Vercel dashboard decision.
4. **CLAUDE.md voice/style rules:** the chunk-9 shell is very plain. Once you're ready for content chapters, the voice rules in CLAUDE.md (no "we"/"you", no first-person, sentence case, em-dashes) will apply — flag for me when you start that work.

## Files of note

- `pipeline/source-data/` (hyphen) — your actual path; gitignored. 4 .xlsx files present.
- `docs/briefs/` — gitignored. Contains both inventory + phase-0 brief.
- `pipeline/dist/eir/` — committed audit trail. 5 JSON files + build_log.txt. Regenerable from source.
- `docs/chunk-9-localhost-render-evidence.md` — DOM-level evidence in lieu of PNG screenshot.
- `.claude/launch.json` — added for Claude Preview MCP. Project-local; safe to ignore or remove.

## Next time I touch this

Read CLAUDE.md, then this STATUS.md, then `docs/briefs/phase-0-overnight-brief.md`, then `docs/briefs/ivg-data-source-inventory.md`. Per chunk discipline.
