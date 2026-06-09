# Brief 27 (NZA 26003-EPC-01) - BC2 EPC Data Acquisition & Coverage Pipeline

**Status:** Phase 1 active. Phase 2 blocked on Chris's data delivery.

**Brief:** `docs/briefs/active/27_EPC-01_acquisition.md`

**Local sequence note:** NZA reference 26003-EPC-01. Filed locally as Brief 27 (next monotonic after Brief 26 / BR-16).

## Why this brief

GRESB 2026 indicator BC2 (energy ratings) requires per-asset EPC data across IVG's 12 sites. The patched gresb.json (Brief 26) carries BC2 max2026 = 8.5pt; the existing forecast credits +1.2pt to BC2 in 2026 from EPC inventory work. This brief builds the acquisition + coverage pipeline that produces the underlying data.

## Pre-flight finding (8 Jun, before any code)

Unauthenticated HTTP probe of the legacy endpoint:

```
$ curl -I https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=NG12%205AB&size=5
HTTP 301 Moved Permanently
Final URL after redirect: https://get-energy-performance-data.communities.gov.uk/
Content-Type: text/html;charset=utf-8 (govuk-template--rebranded)
```

**Legacy API is retired.** The brief's step 1 has its "HTML response" branch — log clearly, document the One Login fallback as a manual step (One Login can't be scripted headlessly).

## Phase 1 parts log

- [x] Pre-flight HTTP probe + retirement detection (8 Jun, before code)
- [x] Part 0.5 (commit `c05af95`) - Brief landed + audit stub + current.md + STATUS.md
- [x] Parts 1+2+3 (commit `6262404`) - bundled Phase 1 build: probe + parse + .env.example + .gitignore.
- [x] Part 4 close (this commit) - audit doc populated with run instructions, Phase 2 gating, probe output evidence.

## Phase 2 parts log (blocked on Chris data delivery)

- [ ] Part 5 - IVG extract loader with documented expected schema + validation
- [ ] Part 6 - UPRN-first / address-fallback matcher + match report
- [ ] Part 7 - Vintage filter (CY2025 valid only; flag lapsed)
- [ ] Part 8 - Per-site coverage calc + portfolio rollup + BC2 asset table → `pipeline/dist/eir/epc.json`
- [ ] Part 9 - Wire `epc.json` consumption into the existing pipeline (so gresb.json BC2 forecast can read live coverage)
- [ ] Part 10 - Phase 2 close (audit + walkthrough + archive)

## Architectural decisions

### Where files live (per CLAUDE.md path note convention)

| Brief says | Project layout uses |
|---|---|
| `/data/raw/epc/` | `pipeline/source-data/epc/raw/` |
| `/data/processed/epc_certificates.parquet` | `pipeline/source-data/epc/processed/epc_certificates.parquet` |
| (implied) coverage output | `pipeline/dist/eir/epc.json` |
| `.env` at project root | `C:/Users/ChrisScott/Dev/ivg-esg-tool/.env` (gitignored) |

### Python dependencies

Adding to `pipeline/requirements.txt`:
- `pandas` — CSV → DataFrame
- `pyarrow` — Parquet writer (pandas dep)
- `python-dotenv` — `.env` loader
- `requests` — HTTP probe (legacy API resurrection check; not exercised in Phase 1)

### Single-script vs multi-reader

Lives as a single reader `pipeline/readers/read_epc.py` with CLI subcommands (`probe`, `parse`, `match`, `coverage`) — matches the existing reader pattern (`read_ecotricity.py`, `read_sycous.py` etc) but with multi-mode entry points so Phase 1 + Phase 2 stages can be invoked independently while developing.

`pipeline/build.py` orchestration deferred until Phase 2 PASS — we don't want a half-built EPC stage breaking the main pipeline build during development.

### Why the API key chassis stays even though legacy is retired

If the GOV.UK service ever re-exposes an authenticated API (or if MHCLG runs the legacy in parallel for back-compat), the `.env` loader + auth header builder are ready. Costs ~30 lines, prevents needing to re-architect later.

## Implementation notes

### Probe script

`cmd_probe` builds a request to the legacy domestic-search endpoint with `Accept: application/json`. It loads `.env` via `python-dotenv` (no-op if file missing) and adds Basic auth if `EPC_EMAIL` + `EPC_API_KEY` are present. Classification logic:

| Condition | Classification | Exit |
|---|---|---|
| `text/html` Content-Type AND final URL differs from probe URL | `retired` | 1 |
| `application/json` AND `resp.ok` | `live` | 0 |
| `application/json` AND `!resp.ok` (e.g. 401) | `live-but-needs-auth` | 0 |
| Other Content-Type | `unknown` (saves body preview) | 2 |
| `requests.RequestException` | `network_error` | 2 |

Verified output (8 Jun 17:28 UTC, unauthenticated):
- HTTP 200 after follow-redirects
- Final URL: `https://get-energy-performance-data.communities.gov.uk/?postcode=NG12%205AB&size=5`
- Content-Type: `text/html;charset=utf-8`
- Classification: `retired`

Probe report at `pipeline/dist/eir/epc_probe.json` (committed). Re-running the probe is idempotent — overwrites the same file. If MHCLG flips the legacy back on, the probe will detect and reclassify automatically without code change.

### Parse script

`cmd_parse` iterates ZIP files in `pipeline/source-data/epc/raw/`, opens each via `zipfile.ZipFile`, locates members matching `re.compile(r"certificates.*\.csv$", re.IGNORECASE)`, reads each CSV with `dtype=str, low_memory=False` (avoids pandas casting UPRN to int and dropping leading zeros), then:

1. Intersects against `RETAINED_COLUMNS` (per brief step 3) — missing cols are logged but don't fail the run
2. Tags rows with `SOURCE_ZIP` (filename) + `SOURCE_KIND` (`domestic` / `non-domestic` / `unknown` detected from filename)
3. Coerces `TOTAL_FLOOR_AREA` + `CURRENT_ENERGY_EFFICIENCY` to numeric, `LODGEMENT_DATE` + `INSPECTION_DATE` to datetime
4. Derives `EXPIRY_DATE = LODGEMENT_DATE + DateOffset(years=10)` per the England & Wales 10-year EPC lifetime
5. Concatenates all frames and writes Parquet to `pipeline/source-data/epc/processed/epc_certificates.parquet`

Idempotent under stable inputs: identical `raw/*.zip` set → identical Parquet output.

### .env / .gitignore

`.env.example` template committed at project root. Real `.env` added to `.gitignore`. The Phase 1 probe was verified unauthenticated — `.env` is not required for the current legacy-retired state. The credential chassis costs ~30 lines and runs the auth path automatically if MHCLG resurrects the legacy API.

`pipeline/source-data/epc/raw/` + `processed/` are covered by the existing `pipeline/source-data/` gitignore.

## Commit table

| Part | SHA | Description |
|---|---|---|
| Part 0.5 | `c05af95` | Brief + audit stub + current.md + STATUS.md + reconciliation pass |
| Parts 1+2+3 | `6262404` | Phase 1 build: probe + parse + .env.example + .gitignore + deps + verified probe output |
| Close | (this commit) | Audit run instructions + Phase 2 gating + probe-result table + commit table |

## Run instructions (post-Phase 1)

```bash
# Activate the project venv
cd C:/Users/ChrisScott/Dev/ivg-esg-tool
pipeline/.venv/Scripts/python.exe pipeline/readers/read_epc.py probe
# -> Re-checks legacy API. Writes pipeline/dist/eir/epc_probe.json.
#    Exit 1 if retired (current state); 0 if live.

# After dropping EPC bulk ZIPs at pipeline/source-data/epc/raw/:
pipeline/.venv/Scripts/python.exe pipeline/readers/read_epc.py parse
# -> Reads ZIPs, normalises certificate CSVs, writes
#    pipeline/source-data/epc/processed/epc_certificates.parquet

# Phase 2 subcommands (blocked on Chris data):
pipeline/.venv/Scripts/python.exe pipeline/readers/read_epc.py match
pipeline/.venv/Scripts/python.exe pipeline/readers/read_epc.py coverage
```

CLI is self-documenting: `read_epc.py --help` prints the subcommand list.

## Phase 2 gating (consolidated)

Chris to deliver:

1. **EPC bulk ZIPs** dropped at `pipeline/source-data/epc/raw/` (manually downloaded via GOV.UK One Login)
2. **LA codes** for IVG's 12 sites — validates scope, sanity-checks downloads
3. **IVG property reference extract** from Luke Kibble — UPRN + ADDRESS + POSTCODE + GFA m² per dwelling + per communal building
4. **Scotland confirmation** — flag any Scottish sites for separate register

No legacy API key needed (legacy retired).

## Phase 1 sign-off

- [x] Pre-flight probe finding documented before any code
- [x] `read_epc.py` with 4 CLI subcommands (probe + parse + Phase 2 stubs)
- [x] Probe verified end-to-end: HTTP 200 + html → classified `retired`
- [x] Parse verified end-to-end: errors cleanly when `raw/` is empty; creates `raw/` directory on first invocation
- [x] `.env.example` template at project root
- [x] `.env` added to `.gitignore`
- [x] Python deps added to `pipeline/requirements.txt`
- [x] All Phase 1 commits pushed to origin/main
- [x] Audit doc populated with run instructions + Phase 2 gating + commit table

**Phase 1 PASS.** Ready to receive Chris's data drops to unblock Phase 2.

## Phase 2 sign-off

(populated when Chris's data lands + Phase 2 ships)
