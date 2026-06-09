# Audit — Brief 19 (Peak load vs supply capacity + PV phasing)

**Status:** Pending — populated at close.

Brief at `docs/briefs/active/19_capacity_pv_phasing.md`.

Tracks:
- Source workbook ingest: `Inspired_Villages_-_Projects_Overview.xlsx` → sheet `Site Info` (transposed layout, sites across columns, fields down rows).
- New pipeline reader producing the per-site capacity + PV phasing block.
- Schema extension to `sites.json`: `dno`, `site_peak_load_mva`, `secured_capacity_mva`, `headroom_mva`, `pv_kwp_current`, `pv_kwp_full`, `phases[]` (with `operational` boolean per phase).
- Reconciliation assertion: PV/area totals match the source phase rows (mismatch ≥ 1% flagged).
- GRESB vs ECPR purpose tag — this dataset MUST NOT silently feed GRESB renewable-energy figures. Tag `purpose: "ECPR/strategy"`.
- Capacity table UI (per-site DNO / peak / secured / headroom / current PV / full PV / missing flags).
- PV phasing view (stacked bar per site — operational phases solid, future hatched/translucent).
- Portfolio roll-up tile / strip.
- All missing values rendered as explicit "Data missing" — never zero or guess.

PASS criteria 1–4 to be evidenced here at close.

Open items carried into the brief:
1. Confirm operational/PC status per phase (Rule 3 default mapping — Millfield Green / Broadbridge Heath; others treated as not-yet-operational).
2. Agreed supply capacity for existing operational sites absent from `Site Info` (Rule 4).
