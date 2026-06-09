# Brief — Peak Load vs Supply Capacity & PV Phasing (current vs full-site)

**For:** Claude Code
**Repo:** ivg-esg-tool
**Author:** Claude Chat (for Chris / NZA)
**Context:** Feeds the ECPR (Energy Capacity & Procurement Report) and the Smart Grid / Power Procurement Strategy. Distinct from GRESB renewable-energy reporting — see Rule 7.

---

## Objective
Build a single, data-grounded view of **electrical capacity headroom** and **PV deployment** across **all portfolio sites**, distinguishing what is **operational now** from the **full-site (all-phases) design end-state**. Flag every field where source data is missing rather than estimating.

---

## Data source
Primary input: `Inspired_Villages_-_Projects_Overview.xlsx`, sheet **`Site Info`** (the `PV Design` tab is a blank template — ignore it).

The sheet is **transposed** — sites run across columns, fields down rows. Six development sites carry full data: Millfield Green, Broadbridge Heath, Amfield Meadows, Blendworth Hills, Sonning Common, Albourne. Existing operational sites are NOT in this sheet — see Rule 4.

Relevant row groups in `Site Info`:
- `Utility` → DNO, Site Peak Load, Secured Capacity, Costs, DNO Supply Ref, G99 Ref
- `Areas` → VC Communal / VC Resi / Phase 1–4 Apartments (m²) / Total
- `No. Units` → per phase + total
- `PV` → Phase 1 VC+others / Phase 1 Apts / Phase 2 / Phase 3 / Phase 4 Apts / Total / Ground-mount option

---

## Rules
1. **No fabrication.** Where a value isn't in source, write `null` and surface as "Data missing" in the UI — never estimate or infer.
2. **Aggregate from raw rows**, not cached totals. Do not trust the sheet's own `Total` cells — recompute PV totals and area totals from the phase rows and assert they reconcile (flag any mismatch ≥1%).
3. **Phase-tag everything.** Each phase carries an `operational` boolean. Default mapping from the Planning & Phasing notes (CONFIRM with Chris before locking — these are construction dates, not confirmed PC):
   - Millfield Green: Ph1 operational; Ph2 2025; Ph3 2028; Ph4 2030
   - Broadbridge Heath: Ph1 operational; Ph2 2025
   - Others: treat as not-yet-operational unless Chris confirms
4. **All portfolio sites.** Extend the schema to every portfolio site, not just the 6 here. For operational sites absent from this sheet, create the records with `null` capacity/PV and flag "Awaiting startup data — agreed supply capacity & operational PV." Chris will source agreed supply capacity from startup info.
5. **Two PV figures, not one** (key requirement):
   - `pv_kwp_current` = sum of PV on phases where `operational = true`
   - `pv_kwp_full` = sum of PV across all designed phases
   - Both per site + portfolio roll-up. Surface as two adjacent columns everywhere PV appears.
6. **Capacity headroom:** compute `headroom = secured_capacity − site_peak_load` per site where both exist; flag negative (over-subscribed) in red, flag `null` where either is missing. Note Amfield's nuance verbatim (1.5MVA transformer, only 0.6MVA powered in Ph1) — don't flatten it.
7. **GRESB vs ECPR separation (critical):** this dataset must NOT silently flow into GRESB renewable-energy figures. GRESB reports only generation from operational phases during the reporting year. Tag this dataset `purpose: "ECPR/strategy"`. If it feeds any GRESB view, it must filter to `operational = true` AND reporting-year generation only.

---

## Deliverables
1. **Data layer:** extend the JSON site model with `dno`, `site_peak_load_mva`, `secured_capacity_mva`, `headroom_mva`, `pv_kwp_current`, `pv_kwp_full`, and a `phases[]` array (each: name, units, area_m2, pv_kwp, operational, heating_type if known).
2. **Capacity table** (`/capacity` or within Site Detail): per site — DNO · peak load · secured capacity · headroom (colour-coded) · current PV · full PV · missing-data flags.
3. **PV phasing view:** stacked bar per site, operational phases solid, future phases hatched/translucent, so current-vs-full reads at a glance.
4. **Portfolio roll-up:** total current PV, total full PV, total secured capacity, count of sites with capacity data missing.

## PASS criteria
- Recomputed PV/area totals reconcile to source phase rows (or mismatch flagged).
- Every missing field renders as an explicit "Data missing" flag, never a zero or guess.
- `pv_kwp_current` and `pv_kwp_full` both present and visibly distinct.
- Mandatory browser walkthrough (Process Rule 10) before close — confirm no Recharts height-collapse on the new charts.

## Open items for Chris (do not block the build)
- Confirm operational/PC status per phase (Rule 3).
- Provide agreed supply capacity for existing operational sites (Rule 4).
