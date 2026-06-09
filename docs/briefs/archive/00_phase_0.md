# IVG ESG Tool — Phase 0 overnight brief

**Author:** Chris Scott (via Claude Chat, 7 May 2026)
**For:** Claude Code (working unsupervised overnight)
**Estimated runtime:** 6–10 hours
**Scope:** Build the IVG data pipeline end-to-end, plus a minimal shell that renders the pipeline output on Vercel.

This brief is large because Chris will be asleep. The size does not remove checkpoints — every chunk has explicit PASS criteria and Co-Work does not proceed past a failure. If anything is unclear or you get stuck, **stop and write the blocker into STATUS.md**. Do not speculate-fix.

---

## Read order at session start

In this exact order, every time you start or resume a session:

1. `CLAUDE.md` (you'll create this in chunk 1; after that, read it first thereafter)
2. `STATUS.md` (you'll create this in chunk 1; after that, read it second)
3. This brief (`briefs/phase-0-overnight-brief.md` — copy from `/mnt/user-data/` if not yet placed)
4. `briefs/ivg-data-source-inventory.md` — the canonical reference for the four calc sheets

If you crash, restart, or run out of context mid-session: re-read in the same order. STATUS.md will tell you which chunk you were in.

---

## Project context

The IVG ESG Tool is a digital report and data platform for Inspired Villages Group's GRESB and GHG reporting. Phase 0 (this brief) builds the data pipeline that produces JSON output from four calculation spreadsheets, plus a minimal web shell that renders that output. Future phases (not in this brief) build the full ESG Inventory Report and the Energy Capacity & Procurement Report on top of the same pipeline.

**Two key facts that shape every decision:**

1. The pipeline is the spine. Both future report repos consume from `pipeline/dist/`. Get the pipeline right and the rest follows.
2. The data source documentation in `briefs/ivg-data-source-inventory.md` is canonical. When in doubt about a column name, sheet name, status flag, or site name variant — check the inventory. If the inventory contradicts what's in the spreadsheet, **stop and document in STATUS.md**.

---

## Environment

| Thing | Value |
|---|---|
| Local project root | `C:\Users\ChrisScott\Dev\ivg-esg-tool` |
| GitHub repo | `https://github.com/chrisscott06/ivg-esg-tool` (public, already created and linked) |
| Vercel | Linked to the GitHub repo via Chris's account; free tier |
| OS | Windows |
| Python | 3.11+ (use `python` or `py` per Windows convention; `pip` for installs) |
| Node | 20 LTS |
| Package manager | npm |
| Git remote | `origin` should already be set to the GitHub repo |

**Hard environment rules:**

- Never write to `OneDrive` paths. Source spreadsheets are *copied* into `pipeline/source_data/` before the session starts.
- Never delete files you did not create. If you find unexpected files, list them in STATUS.md and proceed without touching them.
- Stay on Vercel free tier. Do not configure paid features.
- Do not install global packages without documenting in CLAUDE.md.

---

## Pre-session prep (already done by Chris)

By the time you read this, Chris has:

- Created `C:\Users\ChrisScott\Dev\ivg-esg-tool\` (empty or with `.git/` only)
- Linked the empty folder to `github.com/chrisscott06/ivg-esg-tool`
- Linked the GitHub repo to Vercel
- Copied four spreadsheets into `pipeline/source_data/` — see "Source data files" below
- Placed this brief and the data source inventory in `briefs/`

**If `pipeline/source_data/` does not contain the four expected files:** stop. Document in STATUS.md. Do not proceed to chunk 3.

### Source data files (must be present before chunk 3)

```
pipeline/source_data/
├── 26003-NZA-IVG-XX-CA-X-2001 - Site_Overview.xlsx
├── 26003-NZA-XX-XX-CA-X_1001 - Arbnco_Master_Data_Gas_Electricity.xlsx
├── 26003-NZA-XX-XX-CA-X-1002 - IVG_Water_Updated_7_May_2026_v2.xlsx
└── 26003-NZA-XX-XX-CA-X-1003_P02 - IVG_Waste.xlsx
```

The exact filenames may differ slightly (date stamps, revision numbers). The pipeline must locate files by *prefix pattern*, not exact match. See `briefs/ivg-data-source-inventory.md` for canonical document references (`CA-X-2001`, `CA-X_1001`, `CA-X-1002`, `CA-X-1003`) — match against these.

---

## Hard rules (read every session)

These are non-negotiable. Encoded in `CLAUDE.md` after chunk 1; restated here for emphasis.

### Read order
Every session and every restart: `CLAUDE.md` → `STATUS.md` → current brief → relevant supporting docs.

### Chunk discipline
- One chunk at a time. Do not start chunk N+1 until chunk N is PASS.
- At the **start** of each chunk: write the chunk's intent into `STATUS.md` under "Currently working on".
- At the **end** of each chunk: write the chunk's outcome into `STATUS.md` under "Done", clear "Currently working on", commit + push to GitHub.
- This means STATUS.md gets updated **twice per chunk**, not once. The state is always honest.

### Verification
- **Pipeline chunks (3–8):** verification is JSON inspection. Run the pipeline, open the output file, check structure and values against pass criteria. Use `python -m json.tool` or jq for structural validation. Numerical values must match the source spreadsheet.
- **Shell chunk (9):** verification is browser-based. Run the dev server, open the page in a browser, screenshot evidence. The dev server confirms what the user sees — API responses can pass while UI is broken.
- "Verification means evidence" — every PASS must produce concrete evidence: a JSON file open in your editor, a screenshot, a numerical comparison. Not just "I think it works."

### Commits
- Commit after every PASS. Push after every commit.
- Conventional commit format: `chunk-N(scope): short description`. Examples:
  - `chunk-1(setup): initialise repo with CLAUDE.md, STATUS.md, .gitignore`
  - `chunk-3(pipeline): add Site Overview reader producing dist/eir/sites.json`
  - `chunk-9(shell): minimal landing page renders pipeline output`
- The body of the commit message can list the pass criteria that were satisfied.

### "Clean up before you build"
If you find unexpected files, configurations, or state inside the project: list them in STATUS.md, do not delete, do not modify, proceed.

### Stuck rule
If you have spent **15 continuous minutes on the same problem without progress**:
1. Stop.
2. Write the problem into STATUS.md under "Blocked".
3. Document what you tried, what error/output you saw, and what you would try next if you continued.
4. Move to the next chunk *only if it does not depend on the blocked chunk*. Otherwise, end the session cleanly.

This rule prevents 4am rabbit-hole work that the morning shows was the wrong approach.

### Hard stops (do not proceed without Chris)
Stop and document — do not act — if any of these happen:
- A spreadsheet's structure differs materially from the data source inventory (columns missing, sheet names different, sites you don't recognise)
- A pipeline reader produces zero rows when the inventory says it should produce 12+
- Git push fails for an authentication reason
- Vercel deployment requires entering payment details
- You're about to delete or modify a file in OneDrive
- You're about to modify `briefs/ivg-data-source-inventory.md` or this brief

---

## File templates

These are the exact contents to write in chunk 1.

### `CLAUDE.md` (project root)

```markdown
# IVG ESG Tool — CLAUDE.md

## What this project is

The IVG ESG Tool is a digital reporting platform for Inspired Villages Group's GRESB submission and GHG inventory. The pipeline reads four canonical calculation spreadsheets and produces JSON output that feeds two downstream reports (built in later phases).

**Phase 0 (current):** Build the pipeline + a minimal shell rendering pipeline output on Vercel.

## Environment

- Local: `C:\Users\ChrisScott\Dev\ivg-esg-tool`
- GitHub: https://github.com/chrisscott06/ivg-esg-tool (public, will go private later)
- Vercel: linked to GitHub repo, free tier
- Python: 3.11+ for the pipeline. Dependencies via `pipeline/requirements.txt` and a venv in `pipeline/.venv/`.
- Node: 20 LTS for the shell. Dependencies via `eir/package.json`.

## Folder structure

```
ivg-esg-tool/
├── CLAUDE.md                    # this file
├── STATUS.md                    # running log
├── README.md                    # project overview
├── .gitignore
├── pipeline/                    # Python data pipeline
│   ├── readers/
│   ├── source_data/             # four calc sheets (do not commit)
│   ├── dist/                    # generated JSON (committed)
│   ├── build.py
│   ├── site_resolver.py
│   ├── requirements.txt
│   └── .venv/                   # local venv (do not commit)
├── eir/                         # ESG Inventory Report shell (Phase 0 = minimal)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── briefs/                      # working briefs (gitignored)
│   ├── phase-0-overnight-brief.md
│   └── ivg-data-source-inventory.md
└── docs/                        # decisions, sketches
```

## Hard rules (non-negotiable)

1. Read order at session start: CLAUDE.md → STATUS.md → current brief → supporting docs.
2. One chunk at a time. Do not start chunk N+1 until N is PASS.
3. STATUS.md updated at the **start** and **end** of each chunk.
4. Commit + push after every PASS. Conventional commit messages: `chunk-N(scope): description`.
5. Pipeline verification = JSON inspection. Shell verification = browser + screenshot.
6. Never write to OneDrive paths. Never delete files you did not create.
7. Stuck for 15 continuous minutes → stop, document in STATUS.md, do not speculate-fix.
8. Hard stops: data structure mismatches, zero-row outputs where 12+ expected, auth failures, paid-tier prompts. Stop and document.

## Data source canonical reference

`briefs/ivg-data-source-inventory.md` is the single source of truth for spreadsheet structure, column names, status flag conventions, and the canonical site list. When in doubt, check the inventory. If the spreadsheet contradicts the inventory, stop and document.

## Canonical site list

13 entities: 12 villages + Edwalton Office. Site IDs are kebab-case slugs:
`austin-heath`, `gifford-lea`, `bramshott-place`, `millbrook-village`, `durrants-village`, `great-alne-park`, `ledian-gardens`, `elderswell`, `millfield-green`, `ampfield-meadows`, `blendworth-hills`, `sonning-common`, `edwalton-office`.

Site names vary across spreadsheets ("Austin Heath" vs "Austin Heath Village" vs "Head Office"). The site name resolver in `pipeline/site_resolver.py` maps all variants to canonical IDs.

## Voice and style (for any user-facing text generated by the shell)

- Measured, professional, slightly understated. Auditor-grade where it matters.
- No "we", no "you", no first-person.
- No internal-team language ("ship", "land", "deep-dive" as a verb).
- No NZA staff names anywhere.
- Sentence case for headings. Em-dashes for parenthetical clauses. No emojis in copy.

(Phase 0 has minimal user-facing text — these rules apply once content chapters are built.)
```

### `STATUS.md` (project root)

```markdown
# STATUS — IVG ESG Tool

Last updated: [datetime in UK timezone]

## Currently working on
[chunk number and brief description, OR "between chunks"]

## Done

### Chunk 1 — Repo skeleton
- [start time] Started
- [end time] PASS — files created, initial commit pushed

(format repeats for each completed chunk)

## Blocked
[empty unless something's wrong]

## Decisions for Chris in the morning
[list of judgement calls Co-Work hit overnight that Chris should review]

## Files of note
[anything unexpected found in the project, anything that needs human attention]
```

### `.gitignore` (project root)

```
# Python
pipeline/.venv/
pipeline/__pycache__/
pipeline/**/__pycache__/
*.pyc

# Node
node_modules/
eir/dist/
eir/.vite/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Project-specific
pipeline/source_data/    # source spreadsheets — do not commit
briefs/                  # working briefs — do not commit
docs/scratch/            # scratch notes
*.tmp

# Pipeline-generated logs (build_log.txt is committed; ad-hoc logs are not)
pipeline/*.log
```

### `README.md` (project root)

```markdown
# IVG ESG Tool

Digital reporting platform for Inspired Villages Group's GRESB submission and GHG inventory.

## Status

Phase 0 — pipeline + minimal shell. See `STATUS.md` for current state.

## Local development

Pipeline:
```
cd pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python build.py
```

Shell:
```
cd eir
npm install
npm run dev
```

## Documentation

- `CLAUDE.md` — project rules and structure
- `STATUS.md` — running log
- `briefs/` — working briefs (gitignored)
```

---

## Chunks

Each chunk has: **Goal**, **Steps**, **PASS criteria**, **Verification**, **Commit message**.

If a PASS criterion is not met, do not proceed. Document the failure in STATUS.md under "Blocked".

---

### Chunk 1 — Repo skeleton

**Goal:** Initialise the project structure on disk and on GitHub.

**Steps:**
1. `cd C:\Users\ChrisScott\Dev\ivg-esg-tool`
2. Confirm `git remote -v` shows origin pointing to `github.com/chrisscott06/ivg-esg-tool`. If not, stop.
3. Create the folder structure:
   ```
   pipeline/
   pipeline/readers/
   pipeline/source_data/
   pipeline/dist/
   pipeline/dist/eir/
   eir/
   briefs/
   docs/
   ```
4. Verify `pipeline/source_data/` contains four `.xlsx` files matching the canonical document references. If not, stop.
5. Create `CLAUDE.md`, `STATUS.md`, `.gitignore`, `README.md` from the templates above.
6. Move `phase-0-overnight-brief.md` and `ivg-data-source-inventory.md` from wherever they were placed into `briefs/` (if not already there).
7. `git add` all tracked files. `git status` should show: CLAUDE.md, STATUS.md, README.md, .gitignore as new. Should NOT show: source_data/*.xlsx, briefs/*.
8. `git commit -m "chunk-1(setup): initialise repo with CLAUDE.md, STATUS.md, .gitignore, README.md"`
9. `git push -u origin main` (or whatever the default branch is named — match the GitHub repo's default).

**PASS criteria:**
- All folders exist on disk.
- All four template files exist with correct content.
- Source data files are present in `pipeline/source_data/` but excluded from git.
- Briefs are present in `briefs/` but excluded from git.
- Initial commit appears on GitHub at `github.com/chrisscott06/ivg-esg-tool`.

**Verification:**
- `git ls-files | findstr /v "^$"` — should list 4 files (CLAUDE.md, STATUS.md, README.md, .gitignore).
- `git status` — clean working tree after commit.
- Open `github.com/chrisscott06/ivg-esg-tool` in a browser (or `git ls-remote origin`) — confirm push landed.

**Commit:** `chunk-1(setup): initialise repo with CLAUDE.md, STATUS.md, .gitignore, README.md`

---

### Chunk 2 — Pipeline foundations

**Goal:** Set up Python environment, dependencies, and the site name resolver. No readers yet.

**Steps:**
1. `cd pipeline`
2. `python -m venv .venv`
3. Activate the venv: `.venv\Scripts\activate`
4. Create `pipeline/requirements.txt` with:
   ```
   openpyxl==3.1.5
   ```
5. `pip install -r requirements.txt`
6. Create `pipeline/site_resolver.py`:
   ```python
   """Site name resolver — maps spelling variants across spreadsheets to canonical IDs."""
   
   CANONICAL_SITES = {
       "austin-heath": {
           "display": "Austin Heath",
           "ref": "AH",
           "variants": ["Austin Heath", "Austin Heath Village"],
       },
       "gifford-lea": {
           "display": "Gifford Lea",
           "ref": "GL",
           "variants": ["Gifford Lea"],
       },
       "bramshott-place": {
           "display": "Bramshott Place",
           "ref": "BP",
           "variants": ["Bramshott Place"],
       },
       "millbrook-village": {
           "display": "Millbrook Village",
           "ref": "MB",
           "variants": ["Millbrook Village"],
       },
       "durrants-village": {
           "display": "Durrants Village",
           "ref": "DV",
           "variants": ["Durrants Village"],
       },
       "great-alne-park": {
           "display": "Great Alne Park",
           "ref": "GA",
           "variants": ["Great Alne Park"],
       },
       "ledian-gardens": {
           "display": "Ledian Gardens",
           "ref": "LG",
           "variants": ["Ledian Gardens"],
       },
       "elderswell": {
           "display": "Elderswell",
           "ref": "EW",
           "variants": ["Elderswell"],
       },
       "millfield-green": {
           "display": "Millfield Green",
           "ref": "MG",
           "variants": ["Millfield Green"],
       },
       "ampfield-meadows": {
           "display": "Ampfield Meadows",
           "ref": "AM",
           "variants": ["Ampfield Meadows"],
       },
       "blendworth-hills": {
           "display": "Blendworth Hills",
           "ref": "BH",
           "variants": ["Blendworth Hills"],
       },
       "sonning-common": {
           "display": "Sonning Common",
           "ref": "SC",
           "variants": ["Sonning Common"],
       },
       "edwalton-office": {
           "display": "Edwalton Office",
           "ref": "EO",
           "variants": ["Edwalton Office", "Head Office", "Edwalton Business Park"],
       },
   }
   
   # Build reverse lookup at module load
   _VARIANT_TO_ID = {}
   for site_id, info in CANONICAL_SITES.items():
       for variant in info["variants"]:
           _VARIANT_TO_ID[variant.lower().strip()] = site_id
   
   # Known unmapped sites in source data — flag, don't fail
   KNOWN_UNMAPPED = {"edenbridge", "little mount farm", "portfolio total"}
   
   
   def resolve(name):
       """Return canonical site ID for a name, or None if unmappable.
       
       Caller is responsible for handling None — typically by adding
       to an 'unmapped' list in the build log.
       """
       if name is None:
           return None
       key = str(name).lower().strip()
       if key in _VARIANT_TO_ID:
           return _VARIANT_TO_ID[key]
       return None
   
   
   def is_known_unmapped(name):
       """True if a name is known to be unmapped (e.g. portfolio totals, out-of-scope sites)."""
       if name is None:
           return False
       return str(name).lower().strip() in KNOWN_UNMAPPED
   
   
   def all_canonical_ids():
       return list(CANONICAL_SITES.keys())
   ```
7. Create `pipeline/build.py` with a stub orchestrator:
   ```python
   """Pipeline orchestrator — calls each reader in sequence, writes JSON output."""
   
   import json
   import sys
   from datetime import datetime, timezone
   from pathlib import Path
   
   ROOT = Path(__file__).resolve().parent
   SOURCE_DATA = ROOT / "source_data"
   DIST_EIR = ROOT / "dist" / "eir"
   
   
   def main():
       DIST_EIR.mkdir(parents=True, exist_ok=True)
       log = []
       log.append(f"Pipeline build started at {datetime.now(timezone.utc).isoformat()}")
       log.append(f"Source data: {SOURCE_DATA}")
       log.append(f"Output: {DIST_EIR}")
       log.append("")
       log.append("Readers (placeholder — not yet implemented):")
       log.append("  - read_site_overview     [pending]")
       log.append("  - read_arbnco            [pending]")
       log.append("  - read_water             [pending]")
       log.append("  - read_waste             [pending]")
       log.append("  - build_portfolio        [pending]")
       log.append("")
       log.append(f"Pipeline build finished at {datetime.now(timezone.utc).isoformat()}")
       
       (DIST_EIR / "build_log.txt").write_text("\n".join(log), encoding="utf-8")
       print("\n".join(log))
   
   
   if __name__ == "__main__":
       main()
   ```
8. Run `python build.py`. Confirm `dist/eir/build_log.txt` is written with the pending-reader list.
9. Test the resolver manually in a Python REPL:
   ```python
   from site_resolver import resolve, is_known_unmapped, all_canonical_ids
   assert resolve("Austin Heath Village") == "austin-heath"
   assert resolve("Head Office") == "edwalton-office"
   assert resolve("Bramshott Place") == "bramshott-place"
   assert resolve("Edenbridge") is None
   assert is_known_unmapped("Edenbridge") is True
   assert is_known_unmapped("PORTFOLIO TOTAL") is True
   assert len(all_canonical_ids()) == 13
   print("Resolver checks passed")
   ```
10. Commit + push.

**PASS criteria:**
- `pipeline/.venv/` exists (gitignored).
- `pipeline/requirements.txt` exists with openpyxl pinned.
- `pipeline/site_resolver.py` exists and the manual REPL checks above all pass.
- `pipeline/build.py` runs without error and produces `pipeline/dist/eir/build_log.txt`.
- `pipeline/dist/eir/build_log.txt` is committed (the build log itself is part of the audit trail).
- Site resolver covers 13 canonical IDs and known unmapped names.

**Verification:**
- Run the REPL test snippet and confirm "Resolver checks passed" prints.
- `cat pipeline/dist/eir/build_log.txt` shows the pending-reader list.

**Commit:** `chunk-2(pipeline): add Python venv, openpyxl dep, site resolver, and orchestrator stub`

---

### Chunk 3 — Site Overview reader

**Goal:** Read `Site_Overview.xlsx` and produce `dist/eir/sites.json` with all 13 sites' identity, archetype, scope allocation, and EUI data.

**Steps:**
1. Create `pipeline/readers/__init__.py` (empty file, makes the package importable).
2. Create `pipeline/readers/read_site_overview.py`. Reference `briefs/ivg-data-source-inventory.md` for sheet structure.

   Read four sheets from the workbook:
   - `Site Overview` (header row 4, 31 columns, sites at rows 5–17, skip row 18 PORTFOLIO TOTAL)
   - `Scope Allocation` (header row 4, 12 columns, sites at rows 5–17)
   - `Phasing & Units` (header row 4, 16 columns, sites at rows 5–16 — Edwalton not present)
   - `Energy Benchmarks` (header row 4, 14 columns, 11 sites only — partial coverage expected)

3. The reader returns a dict keyed by canonical site ID. Each site record should look like:
   ```json
   {
     "id": "austin-heath",
     "display_name": "Austin Heath",
     "ref": "AH",
     "identity": {
       "total_units": 167,
       "completed": 122,
       "void": 20,
       "occupancy_pct": 73,
       "resi_gia_m2": 11375,
       "landlord_gia_m2": 2841,
       "total_gia_m2": 14216,
       "years_built": "2014-2020",
       "total_phases": null,
       "operational_phases": 3,
       "management_entity": "..."
     },
     "archetype": {
       "primary_heating": "Central gas + CHP",
       "hot_water": "Gas (communal)",
       "chp": "Yes",
       "heat_network": "...",
       "heat_billing": "...",
       "grid_type": "Bulk",
       "capacity_mva": ...,
       "asc_kva": ...,
       "solar_pv_kwp": ...,
       "battery": "...",
       "ev_chargers": "...",
       "pool_spa": "...",
       "restaurant": "...",
       "village_centre": "...",
       "sycous": "...",
       "ll_deduction": "...",
       "metering_arrangement": "..."
     },
     "scope_allocation": {
       "gas_landlord": "Scope 1",
       "gas_occupied_resi": "Scope 1",
       "gas_void": "Scope 1",
       "elec_communal_ll": "Scope 2",
       "elec_occupied_resi": "Scope 3 Cat 13",
       "elec_void": "Scope 2",
       "has_gas": true,
       "sycous_deduction": true,
       "notes": "Bulk gas supply..."
     },
     "phasing": {
       "open_year": 2014,
       "phases": [
         {"phase": 1, "units": 49, "complete_year": 1},
         {"phase": 2, "units": 57, "complete_year": 5},
         {"phase": 3, "units": 61, "complete_year": 8},
         {"phase": 4, "units": 0, "complete_year": 0}
       ],
       "total_units_planned": 167,
       "current_units": 167,
       "status": "Operational"
     },
     "energy_benchmarks": {
       "actual_elec_kwh": 423542,
       "actual_gas_kwh": 2582255,
       "actual_total_kwh": 3005797,
       "eui_total_kwh_m2": 211.4,
       "eui_elec_kwh_m2": 29.8,
       "eui_gas_kwh_m2": 181.6,
       "modelled_gas_eui_kwh_m2": 195,
       "gas_vs_model": 0.93,
       "tm54_benchmark": "55-65 (resi)",
       "notes": "..."
     },
     "notes": "..."
   }
   ```

4. Energy Benchmarks is partial (11 sites only). For sites without an Energy Benchmarks row, set `energy_benchmarks` to `null` rather than omitting the key.

5. Phasing & Units is partial (Edwalton not present). For Edwalton, set `phasing` to `null`.

6. Use the site name resolver. Any name that resolves to None should:
   - If it's a known-unmapped name (PORTFOLIO TOTAL, etc.), skip silently.
   - If it's not known-unmapped, log to build_log.txt as "Unmapped name in Site Overview: '<name>'".

7. Cross-validate: Site Overview and Scope Allocation should both yield 13 sites. If counts differ, log a discrepancy.

8. Wire the reader into `build.py`. After Site Overview reads, write `dist/eir/sites.json` (pretty-printed, UTF-8).

9. Update build_log.txt with what was read: rows scanned, sites resolved, unmapped names, partial-coverage flags.

10. Run `python build.py`. Inspect `dist/eir/sites.json` — all 13 sites present, structure as above.

**PASS criteria:**
- `dist/eir/sites.json` contains exactly 13 entries.
- All 13 canonical site IDs are present.
- Austin Heath shows: 167 total units, CHP "Yes", primary heating "Central gas + CHP", grid type "Bulk".
- Millfield Green shows: GSHP heating, no gas (`has_gas: false`).
- Edwalton Office's `phasing` is `null`, `energy_benchmarks` is `null`.
- Sonning Common's and Blendworth Hills's `energy_benchmarks` is `null` (partial Energy Benchmarks coverage).
- Build log lists the four sheets read and any flagged discrepancies.

**Verification:**
- `python -m json.tool pipeline/dist/eir/sites.json | findstr "\"id\":"` — should output 13 lines.
- Open `sites.json` in an editor; spot-check Austin Heath, Millfield Green, Edwalton Office.
- `cat pipeline/dist/eir/build_log.txt` — Site Overview section populated.

**Commit:** `chunk-3(pipeline): add Site Overview reader producing dist/eir/sites.json`

---

### Chunk 4 — Arbnco reader

**Goal:** Read `Arbnco_Master_Data_Gas_Electricity.xlsx` and produce `dist/eir/energy.json` with per-site consumption and emissions, scope-allocated.

**Steps:**
1. Create `pipeline/readers/read_arbnco.py`.
2. Read from the `Raw Data` sheet (canonical — see inventory). Header row 1, data rows 2–16. Row 2 is a portfolio-total row (Asset blank, Fund "Inspired Villages") — skip.
3. Use the site name resolver. Arbnco uses "Austin Heath Village" and "Head Office" — resolver handles. `Edenbridge` and `Little Mount Farm` should resolve to None — log as known unmapped, exclude from output but record in `build_log.txt`.
4. For each site, construct a record:
   ```json
   {
     "id": "austin-heath",
     "meters": {
       "electricity": 1,
       "gas": 2
     },
     "consumption_kwh": {
       "electricity": 423541.69,
       "gas": 2582255.0,
       "total": 3005796.69
     },
     "emissions_actual_tco2e": {
       "electricity": 74.97,
       "gas": 919.47,
       "total": 994.44
     },
     "emissions_national_avg_tco2e": {
       "electricity": 74.97,
       "gas": 919.47,
       "total": 994.44
     },
     "data_period": "CY2025"
   }
   ```
   (Confirm column mappings against the inventory.)

5. **Scope allocation:** for each site, look up its scope allocation from `sites.json` (load it; if not present, log error). Apportion the electricity and gas consumption into Scope 1, Scope 2, Scope 3 Cat 13 buckets per the allocation rules. The pipeline's first-pass approach: if `gas_landlord`, `gas_occupied_resi`, and `gas_void` are all "Scope 1", then 100% of gas → Scope 1. If any element of electricity is "Scope 3 Cat 13", flag with a note that resident energy needs splitting once Sycous data exists. **For Phase 0, do not attempt landlord/resident split** — the data isn't yet broken out at that level. Record consumption/emissions at the meter-aggregate level and flag in notes that resident split is pending.

6. Output structure: `energy.json` is keyed by site, with the structure above. Add a top-level `portfolio` key with totals.

7. Update build_log.txt: rows read, sites resolved, unmapped logged, scope allocation flags.

8. Wire into `build.py` after Site Overview.

9. Run pipeline. Inspect output.

**PASS criteria:**
- `dist/eir/energy.json` contains entries for sites with arbnco data.
- Austin Heath shows: 1 electricity meter, 2 gas meters, gas consumption 2,582,255 kWh, gas actual emissions 919.47 tCO2e.
- `Edenbridge` and `Little Mount Farm` are NOT in the output; they appear in build_log.txt under "Unmapped sites in Arbnco".
- Portfolio totals match the Raw Data row 2 (the portfolio row): total electricity ~8,315,414 kWh, total gas ~9,353,853 kWh.
- Build log records all reading activity.

**Verification:**
- Open `energy.json`; spot-check Austin Heath gas figures match the spreadsheet.
- Verify portfolio total matches Raw Data row 2.
- `cat pipeline/dist/eir/build_log.txt` — Arbnco section shows what was read and what was unmapped.

**Commit:** `chunk-4(pipeline): add Arbnco reader producing dist/eir/energy.json with scope allocation`

---

### Chunk 5 — Water reader

**Goal:** Read `IVG_Water_Updated_7_May_2026_v2.xlsx` and produce `dist/eir/water.json`.

**Steps:**
1. Create `pipeline/readers/read_water.py`.
2. Read from the `Dashboard` sheet (canonical). Header row 4, data rows 5–17, skip row 18 PORTFOLIO TOTAL, skip rows 19+ (notes).
3. Per-site record:
   ```json
   {
     "id": "great-alne-park",
     "water_company": "Severn Trent",
     "retailer": "WaterPlus",
     "meters_known": 3,
     "meters_with_cy2025_data": 3,
     "consumption_m3": 8548,
     "annual_estimate_m3": 8548,
     "data_quality": "Estimated",
     "data_status": "partial",
     "cy2025_coverage": "Feb 25 – Jan 26",
     "completeness": "100%",
     "key_gaps": "...",
     "arbnco_meters": 5
   }
   ```

4. Map `data_quality` → `data_status` (this is the field the UI's DataStatusBadge component will read):
   - "Actual" → "confirmed"
   - "Estimated" → "partial"
   - blank or "No data" → "missing"
   - any other unrecognised value → "partial" with a note logged

5. Use the resolver. "Edwalton Business Park" → `edwalton-office`.

6. Wire into `build.py`. Update build_log.txt.

**PASS criteria:**
- `dist/eir/water.json` contains 13 entries (one per canonical site, with `null`/missing data where appropriate).
- Great Alne Park shows: 3 meters, 8,548 m³, data_quality "Estimated", data_status "partial".
- Edwalton Office is keyed `edwalton-office` (not "Edwalton Business Park").
- Sites with no water data show data_status "missing".

**Verification:**
- `python -m json.tool pipeline/dist/eir/water.json | findstr "\"id\":"` — 13 lines.
- Spot-check Great Alne Park, Edwalton Office.

**Commit:** `chunk-5(pipeline): add Water reader producing dist/eir/water.json`

---

### Chunk 6 — Waste reader

**Goal:** Read `IVG_Waste.xlsx` and produce `dist/eir/waste.json` with per-site tonnage and Scope 3 Cat 5 emissions.

**Steps:**
1. Create `pipeline/readers/read_waste.py`.
2. Read from `Site_Summary` (skip metadata rows 1–7; header row 8) and `GHG_Calculations` (skip metadata rows 1–11; header row 12).
3. Per-site record:
   ```json
   {
     "id": "austin-heath",
     "contractor": "BIFFA",
     "tonnage_total": ...,
     "tonnage_by_stream": {
       "general": ...,
       "recycling": ...,
       "organic": ...,
       "glass": ...,
       "hazardous": ...
     },
     "emissions_scope3_cat5_tco2e": ...,
     "data_status": "confirmed",
     "data_period": "CY2025",
     "notes": "..."
   }
   ```
4. Sites with estimated weights (Gifford Lea via Ash Waste Services) → data_status "partial" with a note.
5. Sites with no waste data → data_status "missing".
6. Wire into `build.py`. Update build_log.txt.

**PASS criteria:**
- `dist/eir/waste.json` contains 13 entries.
- BIFFA contractor flagged on the 10 BIFFA sites.
- Gifford Lea shows data_status "partial" with a note about Ash Waste estimation.
- Sites with no waste data (e.g. Edwalton Office likely) show data_status "missing".

**Verification:**
- Inspect `waste.json`; spot-check Gifford Lea, Austin Heath.
- Build log records waste reading activity.

**Commit:** `chunk-6(pipeline): add Waste reader producing dist/eir/waste.json with Scope 3 Cat 5`

---

### Chunk 7 — Portfolio rollup

**Goal:** Produce `dist/eir/portfolio.json` aggregating across all four data domains.

**Steps:**
1. Create `pipeline/readers/build_portfolio.py`.
2. After all four readers have run, load `sites.json`, `energy.json`, `water.json`, `waste.json`.
3. Build `portfolio.json`:
   ```json
   {
     "site_count": 13,
     "village_count": 12,
     "office_count": 1,
     "total_gia_m2": ...,
     "total_landlord_gia_m2": ...,
     "total_units_completed": ...,
     "energy": {
       "total_electricity_kwh": ...,
       "total_gas_kwh": ...,
       "total_consumption_kwh": ...,
       "total_emissions_actual_tco2e": ...,
       "total_emissions_national_avg_tco2e": ...,
       "sites_with_data": ...
     },
     "water": {
       "total_consumption_m3": ...,
       "sites_with_confirmed_data": ...,
       "sites_with_partial_data": ...,
       "sites_with_missing_data": ...
     },
     "waste": {
       "total_tonnage": ...,
       "total_emissions_scope3_cat5_tco2e": ...,
       "sites_with_confirmed_data": ...,
       "sites_with_partial_data": ...,
       "sites_with_missing_data": ...
     },
     "data_period": "CY2025",
     "build_timestamp": "..."
   }
   ```
4. Wire into `build.py` as the final step before build_log.

**PASS criteria:**
- `dist/eir/portfolio.json` exists with all the structure above.
- Energy totals match Arbnco's Raw Data portfolio row.
- Site counts are correct (13 total, 12 villages, 1 office).
- Build timestamp is set.

**Verification:**
- Open `portfolio.json`; numerical totals cross-check against the source spreadsheets and against the per-site sum.

**Commit:** `chunk-7(pipeline): add portfolio rollup producing dist/eir/portfolio.json`

---

### Chunk 8 — Build log polish + validation

**Goal:** Make `build_log.txt` a useful audit trail. Add a validation pass that checks consistency.

**Steps:**
1. The build log should now contain, for each reader:
   - Source file name and last-modified timestamp
   - Sheet(s) read
   - Rows scanned, rows mapped to canonical sites, rows skipped
   - Unmapped names list
   - Partial-coverage flags
2. Add a `validate.py` script (or a function in build.py) that runs after all readers and reports:
   - Site count consistency (13 expected)
   - Energy: Arbnco portfolio total vs sum of per-site values (within rounding tolerance)
   - Each site present in `sites.json` is also present in `energy.json`, `water.json`, `waste.json` (or has a documented reason for absence)
   - All status flags are valid values from {confirmed, partial, missing, not_applicable}
3. Validation results print to stdout and append to build_log.txt.
4. Validation failures do NOT make the pipeline fail — they're warnings logged. (Hard failures are reserved for genuine data corruption: missing source file, malformed spreadsheet.)

**PASS criteria:**
- `python build.py` runs end-to-end and produces all five JSON files plus build_log.txt.
- build_log.txt has structured per-reader sections.
- Validation pass runs and reports results.
- No hard errors. Any warnings are listed in build_log.txt under "Validation".

**Verification:**
- `python build.py` from a clean state (delete `dist/eir/*.json` first, re-run).
- All five JSON files regenerate.
- build_log.txt is comprehensive and human-readable.

**Commit:** `chunk-8(pipeline): polish build log, add validation pass`

---

### Chunk 9 — Minimal shell

**Goal:** A minimal Vite + React shell at `/eir` that renders the pipeline output. Deployed to Vercel free tier.

This is intentionally minimal. No template integration. No design system. No methodology drawer. Just a working page that proves the data flows end-to-end and the pipeline → JSON → web pipeline works.

**Steps:**
1. `cd eir`
2. `npm create vite@latest . -- --template react` (note: in current directory; if Vite refuses because directory isn't empty, scaffold in a temp dir and copy files in).
3. `npm install`
4. Configure Vite to import JSON from outside the project: `eir/vite.config.js`:
   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'
   
   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@pipeline-data': path.resolve(__dirname, '../pipeline/dist/eir')
       }
     }
   })
   ```
5. Replace `eir/src/App.jsx` with a minimal landing page:
   ```jsx
   import portfolio from '@pipeline-data/portfolio.json'
   import sites from '@pipeline-data/sites.json'
   
   export default function App() {
     return (
       <div style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: '32px' }}>
         <h1>IVG ESG Tool</h1>
         <p style={{ color: '#666' }}>
           Phase 0 — minimal shell. Reporting period {portfolio.data_period}. Built {portfolio.build_timestamp}.
         </p>
         
         <section style={{ marginTop: 32 }}>
           <h2>Portfolio</h2>
           <ul>
             <li>Sites: {portfolio.site_count} ({portfolio.village_count} villages + {portfolio.office_count} office)</li>
             <li>Total GIA: {portfolio.total_gia_m2?.toLocaleString()} m²</li>
             <li>Total electricity (CY2025): {portfolio.energy.total_electricity_kwh?.toLocaleString()} kWh</li>
             <li>Total gas (CY2025): {portfolio.energy.total_gas_kwh?.toLocaleString()} kWh</li>
             <li>Total emissions (actual): {portfolio.energy.total_emissions_actual_tco2e?.toLocaleString()} tCO₂e</li>
           </ul>
         </section>
         
         <section style={{ marginTop: 32 }}>
           <h2>Sites</h2>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
               <tr>
                 <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Site</th>
                 <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Heating</th>
                 <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Grid</th>
                 <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Total GIA (m²)</th>
                 <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Units</th>
               </tr>
             </thead>
             <tbody>
               {Object.values(sites).map(site => (
                 <tr key={site.id}>
                   <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{site.display_name}</td>
                   <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{site.archetype?.primary_heating || '—'}</td>
                   <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{site.archetype?.grid_type || '—'}</td>
                   <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                     {site.identity?.total_gia_m2?.toLocaleString() || '—'}
                   </td>
                   <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                     {site.identity?.completed || '—'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </section>
       </div>
     )
   }
   ```
6. Confirm `sites.json` is a dict keyed by site ID. If the reader produced an array, adapt the JSX. Use what the pipeline actually output.
7. `npm run dev`. Visit `http://localhost:5173`. Confirm the page renders, portfolio totals are correct, the 13-site table populates.
8. Take a screenshot. Save it to `docs/chunk-9-localhost-screenshot.png`.
9. `npm run build`. Confirm build succeeds and produces `eir/dist/`.
10. Add a `vercel.json` at the repo root (or in `eir/`, depending on Vercel config) to point Vercel at the `eir` subfolder:
    ```json
    {
      "buildCommand": "cd eir && npm install && npm run build",
      "outputDirectory": "eir/dist",
      "installCommand": "echo skip-root-install"
    }
    ```
11. Commit + push. Vercel auto-deploys from the GitHub push.
12. Wait for Vercel build. Visit the Vercel URL. Confirm same render as localhost.
13. Take a second screenshot. Save to `docs/chunk-9-vercel-screenshot.png`.
14. Add the Vercel URL to STATUS.md under "Decisions for Chris in the morning" so Chris can find it.

**PASS criteria:**
- `npm run dev` works locally; page renders all 13 sites.
- `npm run build` works without errors.
- Vercel auto-deploy succeeds; the Vercel URL renders the same page.
- Two screenshots in `docs/`.
- No paywalls hit.

**Verification:**
- Both screenshots exist and look right.
- Vercel URL accessible and renders correctly.

**Commit:** `chunk-9(shell): minimal Vite shell renders pipeline output, deployed to Vercel`

**If Vercel fails for any reason that isn't a build error in your code (e.g. payment, account config):** STOP. Do not enter payment details. Document in STATUS.md. The local build still works, which is the primary deliverable.

---

## End-of-session protocol

When all chunks complete (or you reach a natural stopping point):

1. Final STATUS.md update:
   - "Currently working on" → "Session complete, awaiting Chris review"
   - "Done" populated for every completed chunk
   - "Decisions for Chris in the morning" populated with anything non-obvious you decided
   - "Files of note" populated with anything unexpected

2. Final commit:
   ```
   git commit -m "session-end: phase-0 complete (chunks 1-N), awaiting review"
   git push
   ```

3. Write a session summary to `docs/session-summary-YYYY-MM-DD.md` covering:
   - Time started, time finished
   - Chunks completed, chunks skipped (with reason)
   - Total commits pushed
   - Notable decisions made
   - Open questions for Chris
   - One-liner per chunk on whether it went smoothly or had issues

4. Final commit for the summary:
   ```
   git commit -m "docs: session summary for [date]"
   git push
   ```

If you stopped early due to a blocker:

- "Currently working on" should clearly state "BLOCKED at chunk N — see STATUS.md > Blocked"
- The Blocked section in STATUS.md should be the most informative section in the file
- Do not attempt chunks beyond the blocker if they depend on it

---

## Common gotchas to anticipate

These have caused problems in past NZA work — fix proactively if encountered:

- **Windows path separators in Python.** Use `pathlib.Path`, not string concatenation.
- **openpyxl with `data_only=True`** to read calculated values, not formula text.
- **Excel `None` cells** vs empty strings — coerce both to `None` consistently in the reader output.
- **JSON serialisation of numpy/pandas types** — convert to native Python int/float before json.dumps.
- **UTF-8 encoding** — write all JSON files with `encoding="utf-8"`. Console output on Windows may need `chcp 65001`.
- **PowerShell vs cmd vs Git Bash** — be explicit about which shell you're using. Bash heredocs don't work in cmd.
- **Vite + JSON imports from outside `src/`** — Vite by default doesn't allow this. The alias config in chunk 9 handles it. If still complaining, check `server.fs.allow` in vite.config.js.
- **Vercel + monorepo subfolder** — the `vercel.json` in chunk 9 tells Vercel the `eir` folder is the project root. If the auto-detected framework is wrong, override with `framework: "vite"` in vercel.json.

---

## Final note

The data source inventory (`briefs/ivg-data-source-inventory.md`) is authoritative. Read it. When the spreadsheet looks weird, check the inventory. When the inventory looks weird, stop and document.

If anything in *this* brief contradicts the inventory, the inventory wins.

If you finish all nine chunks, log it clearly in STATUS.md and stop. Do not start chunk 10 because there is no chunk 10. Sleep is for humans.

End of brief.
