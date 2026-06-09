# Brief 27 (NZA 26003-EPC-01) - BC2 EPC Data Acquisition & Coverage Pipeline

**Author:** Chris Scott (architect role; transcribed verbatim into briefs/active per Process Rule 7)
**Local sequence:** Brief 27. NZA reference 26003-EPC-01.
**Date opened:** 2026-06-08
**Status:** Phase 1 active. Phase 2 blocked on Chris's data delivery (see Open items).

---

## Context

GRESB 2026 indicator BC2 (energy ratings) requires per-asset EPC data across all 12 IVG sites. Source is the MHCLG Energy Performance of Buildings open data (England & Wales). We hold an account on the legacy `epc.opendatacommunities.org` service (HTTP Basic auth, email + API key). That site has a stated retirement date of 30 May 2026 which has passed, but the account/key machinery was confirmed live as of 8 June 2026. The replacement is the GOV.UK One Login "Get energy performance of buildings data" service, which is bulk-download-based. Resolve which service is live before building the acquisition layer - do not assume.

## Credentials

Email and API key to be supplied via a `.env` file at project root (NOT committed - add to `.gitignore`). Basic auth token = `base64(email:apikey)` using UTF-8.

## Phase 1 - Acquisition (build now)

1. Write a connectivity/auth test: authenticated GET to `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=NG12%205AB&size=5`. If it returns JSON → legacy API live, proceed with legacy path. If it returns HTML → legacy API retired; log clearly and document the One Login bulk-download fallback as a manual step (One Login can't be scripted headlessly).
2. On the legacy path: enumerate available bulk files via `/api/v1/files`, then download the per-local-authority domestic AND non-domestic zips for the local authorities covering IVG's sites (LA codes to be parameterised - supplied in Phase 2). Each zip yields a certificates CSV + recommendations CSV linked on `LMK_KEY`. Cache raw zips to `/data/raw/epc/`; do not re-download if present.
3. Parse all certificate CSVs into a single normalised dataframe keyed on `UPRN` and `LMK_KEY`, retaining: `UPRN`, `LMK_KEY`, `ADDRESS`, `POSTCODE`, `CURRENT_ENERGY_RATING`, `CURRENT_ENERGY_EFFICIENCY`, `TOTAL_FLOOR_AREA`, `LODGEMENT_DATE`, `INSPECTION_DATE`, certificate validity/expiry. Output to `/data/processed/epc_certificates.parquet`.

## Phase 2 - Match & coverage (executes once IVG extract lands)

4. Ingest IVG property reference extract (one row per dwelling + per communal building: address, postcode, UPRN, GFA m²). Schema TBC - build against a documented expected schema and validate on load.
5. Match IVG units to EPC records: UPRN exact-match first; fall back to normalised address+postcode for unmatched. Output a match report (matched / unmatched / multi-match for manual review).
6. Vintage filter: retain only certificates valid during CY2025 (expiry ≥ 2025-01-01). Flag lapsed.
7. Coverage calc: per site, covered GFA = Σ `TOTAL_FLOOR_AREA` of matched valid certificates; denominator = IVG total GFA per site. Report per-site and portfolio coverage ratio. Report exact certificate-covered area, never 100% of building GFA where the EPC confers legal compliance - this is an explicit GRESB BC2 rule.
8. Output BC2-ready asset table (energy rating type = EPC, rating band, numeric rating, valid dates, covered area per asset) in the schema consumed by the existing `gresb.json` pipeline.

## Constraints

- No hardcoded values.
- Raw CSV aggregation, not cached summaries.
- `.env` for secrets.
- England & Wales only - flag any Scottish sites for the separate Scottish register.
- Follow CLAUDE.md read order at session start.

## Open items for Chris

- (a) IVG local-authority codes + property reference extract from Luke Kibble
- (b) confirm no Scottish sites

---

## Path note (Claude Code layout deviation)

Per CLAUDE.md "the brief uses `pipeline/source_data/` (underscore) ... The actual layout uses `pipeline/source-data/` (hyphen)". Applies here too: the brief says `/data/raw/epc/` and `/data/processed/epc_certificates.parquet`. The project's actual layout is `pipeline/source-data/epc/raw/` and `pipeline/source-data/epc/processed/`. Generated JSON output goes to `pipeline/dist/eir/epc.json` per the existing pipeline convention. Do not "fix" paths back.

## Pre-flight observation (8 Jun, Claude Code)

Unauthenticated probe of the legacy endpoint:
```
curl -I https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=NG12%205AB&size=5
→ HTTP 301 Moved Permanently
→ Final URL after redirect: https://get-energy-performance-data.communities.gov.uk/
→ Content-Type: text/html;charset=utf-8 (govuk-template--rebranded)
```

**Legacy API is RETIRED.** Per brief step 1: "If it returns HTML → legacy API retired; log clearly and document the One Login bulk-download fallback as a manual step." Phase 1 deliverables pivot:

- Connectivity probe lands as a script (confirms retirement programmatically; will continue to detect a service comeback automatically)
- Step 2 enumerate-via-`/api/v1/files` cannot run (legacy gone)
- Acquisition is now Chris's manual download via One Login, dropped at `pipeline/source-data/epc/raw/`
- Step 3 parsing harness builds the certificates → normalised DataFrame → Parquet pipeline, consuming whatever ZIP/CSV layout the new service provides
- API key chassis (.env loader) built defensively in case the service comes back; not exercised in Phase 1

## Phase 1 deliverables, post-retirement

- [x] Pre-flight HTTP probe + retirement detection
- [ ] `pipeline/readers/read_epc.py` with `--probe` / `--parse` modes
- [ ] Connectivity probe writes a JSON report + console summary
- [ ] Parser reads `pipeline/source-data/epc/raw/*.zip`, decompresses certificate CSVs, normalises columns, writes `pipeline/source-data/epc/processed/epc_certificates.parquet`
- [ ] `.env.example` template documenting `EPC_EMAIL` / `EPC_API_KEY` for future use
- [ ] `.gitignore` updated for `pipeline/source-data/epc/raw/` + `pipeline/source-data/epc/processed/` + `.env`
- [ ] Audit doc captures connectivity result + One Login fallback procedure + Phase 2 blockers

## What Phase 2 needs from Chris (consolidated)

| # | Item | Notes |
|---|---|---|
| 1 | One Login bulk EPC files (zips), dropped at `pipeline/source-data/epc/raw/` | Per-LA filtering if the new service supports it; national domestic + non-domestic if not |
| 2 | LA codes for IVG's 12 sites | Validates scope on load + sanity-checks downloads |
| 3 | IVG property reference extract from Luke Kibble | UPRN + ADDRESS + POSTCODE + GFA m² per dwelling + communal building |
| 4 | Scotland confirmation | Scottish sites use separate register; flag any |
| 5 | ~~Legacy API key~~ | NOT NEEDED - legacy retired |

## Hard rules referenced

- CLAUDE.md read order at session start
- Hard rule 6 (never delete files I didn't create)
- Process Rule 7 (this brief lives at `docs/briefs/active/`)
- Process Rule 8 (session-start reconciliation done before kickoff)
- Hard rule 9 (sanctioned asset directories — `pipeline/source-data/` never deleted)
