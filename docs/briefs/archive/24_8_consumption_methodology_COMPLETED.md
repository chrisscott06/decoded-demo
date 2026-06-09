# Brief 24.8 — Consumption methodology fix + Total/Landlord/Resident filter

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after diagnosing the bulk-site double-counting bug + agreeing the new filter methodology)
**Status:** Active. Methodology + chart restructure + filter UI + data-quality handling. 5 Parts. Plough-through with NO checkpoints.
**Date opened:** 2026-06-04
**Mode:** Push at close. Walkthrough at **1920×1080 + 1440×900**.

---

## Why this brief

The portfolio Consumption chart has a methodology bug that inflates the headline numbers. At bulk-metered sites (Austin Heath, Gifford Lea, Millfield Green, Ampfield Meadows, Blendworth Hills, Millbrook), the chart stacks Ecotricity's bulk meter reading AS landlord + Sycous's sub-metered reading AS resident — but Sycous sub-meters measure electricity that has *already passed through* the Ecotricity bulk meter. They're physically the same electricity counted twice.

Diagnosis run against the live pipeline (`reconciliation.json`) confirmed:

- Millfield Green: Ecotricity bulk = 840k kWh, Sycous = 2,252k kWh → chart stacks both → displays ~3 GWh, physically impossible at a site with one supply.
- Austin Heath, Gifford Lea, Ampfield Meadows all show the same pattern at smaller magnitudes.
- The DNO sites (Bramshott, Durrants, Great Alne, Elderswell) are correctly handled — Ecotricity sees only landlord supply; arbnco-derived covers residents; they're measuring different physical flows so stacking is honest.

The fix is twofold: a **methodology correction** (at bulk sites, total = Ecotricity bulk reading; resident = Sycous; landlord = bulk minus Sycous) AND a **filter model** that lets users see the data through three lenses (Total / Landlord / Resident) rather than a single additive stack. Plus a data-quality flag at Millfield Green where Sycous data is impossibly large (Sycous 2.7× the bulk reading — almost certainly a Sycous-side measurement or service-code error to investigate with IVG).

**Knock-on consequences:** The headline portfolio totals on the Consumption page are wrong. The Brief 24.7 prose that locked "19.0 GWh combined" needs revision after Part 1 produces the corrected numbers. The site-level Consumption pages need the same fix.

---

## Reference

1. **CLAUDE.md** — read first. Rule 11 inheritance unchanged.
2. **STATUS.md** — full read at session start.
3. **Brief 17.5 Part 2** (archived) — established the `resident_kwh_by_source` strip-rule. This brief introduces a new field model layered on top, not replacing.
4. **Brief 24.7** (active or shipped) — Energy chapter prose. **This brief revises the figures cited in 24.7's Consumption prose.** Part 5 here updates those numbers.
5. **Diagnosis run by Claude Chat (4 Jun):** confirmed via `pipeline/dist/eir/reconciliation.json` that bulk-site stacking inflates totals 2-4× per site. Full data table preserved in audit doc.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` → `cat STATUS.md` → `cat docs/briefs/active/24_8_consumption_methodology.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.2 **Brief 24.7 coordination check.** If Brief 24.7 hasn't shipped yet, dispatch order doesn't matter — Part 5 here updates the numbers. If 24.7 has shipped, Part 5 reaches into the same prose blocks and updates the cited figures.

0.5 **Land brief.** Place at `docs/briefs/active/24_8_consumption_methodology.md`. Create `docs/audit/24_8_consumption_methodology.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 24.8 land: consumption methodology fix`.

---

## The methodology, locked

For every in-scope site, three states drive what the chart shows. They must mathematically reconcile: **Total = Landlord + Resident** at every site (or the relevant value is TBC with a flag).

### Total (the leaderboard view, default)

Site total = the directly-measured total energy flowing into the site:

- **Bulk-metered sites** (Austin, Blendworth, Gifford, Millbrook, Millfield, Ampfield): Total = Ecotricity bulk meter reading. This IS the full site energy because everything flows through one commercial supply.
- **DNO sites** (Bramshott, Durrants, Elderswell, Great Alne): Total = Ecotricity landlord + arbnco-derived resident = roughly arbnco total. Sum of measured landlord + estimated resident.
- **BNO sites** (Ledian, Ampfield): Total = Ecotricity landlord + Sycous-measured resident + arbnco-derived resident (where mixed coverage exists). Mixed reconstruction.

### Landlord

The energy used for landlord-communal purposes (lighting, lifts, plant rooms, gas into heat networks):

- **Bulk-metered sites with Sycous**: Landlord = Ecotricity bulk − Sycous total. *Derived figure.* Mark visually as derived.
- **Bulk-metered sites without Sycous** (Millbrook): Landlord = **TBC**. Cannot derive without Sycous. Surface as data gap.
- **DNO sites**: Landlord = Ecotricity landlord supply. Directly measured.
- **BNO sites**: Landlord = Ecotricity landlord supply. Directly measured.
- **All sites**: Landlord gas = Ecotricity gas (whether heat-network or boiler supply).

### Resident

The energy used by residents in their homes:

- **Bulk-metered sites with Sycous**: Resident = Sycous total. Directly measured.
- **Bulk-metered sites without Sycous** (Millbrook): Resident = **TBC**. Cannot measure without Sycous. Surface as data gap.
- **DNO sites**: Resident = arbnco-derived. Estimated by subtraction.
- **BNO sites**: Resident = mix of Sycous-measured (where deployed) + arbnco-derived (where not). Mark by source.

### Sub-toggle within Resident view

When Resident is active, a second-row toggle lets the user filter by data source:

- **All sources** (default): every site with any resident measurement appears, regardless of source.
- **Sycous only**: only sites with Sycous-measured resident data appear. Other sites grey out with tooltip.
- **arbnco only**: only sites with arbnco-derived resident data appear. Other sites grey out with tooltip.

This sub-toggle is the data-quality lens — "show me what we directly measure" vs "show me what we derive."

### Data-quality flags (the honest gaps)

Where the methodology can't produce a number, the chart surfaces it honestly:

- **Millbrook Village**: Landlord and Resident bars show empty with tooltip: "Bulk-metered site with no Sycous sub-metering deployed — landlord/resident split not measurable. NZA is working with IVG to deploy Sycous; until then only the site total is available."
- **Millfield Green**: Sycous reading (2,252k kWh) exceeds Ecotricity bulk (840k kWh) — physically impossible if both measure electricity. Derived landlord would go negative. Bar shows **TBC** with tooltip: "Sycous reading at Millfield exceeds the bulk meter total — likely a Sycous-side measurement or service-code error. NZA is investigating with IVG/Sycous. Until resolved, landlord and resident splits cannot be reliably derived." Sycous values for Millfield are not used in resident totals until resolved.

Both these surface the data integrity story rather than hiding it.

---

## Scope statement

**IN SCOPE:**
- **Part 1 — Pipeline reconciliation update.** New fields in `reconciliation.json` per site: `total_site_kwh`, `landlord_elec_kwh`, `landlord_gas_kwh`, `resident_elec_kwh`, `resident_gas_kwh`, plus `landlord_elec_source` and `resident_elec_source` strings (measured / derived / TBC), plus `data_quality_flag` enum. The new fields layer on top of existing `eco_landlord_elec_kwh` and `submetered_elec` fields (don't break existing references — both old and new should be present for now).
- **Part 2 — Portfolio Consumption chart restructure.** Three view states (Total / Landlord / Resident). Bar configuration per state. Sub-toggle for Sycous/arbnco within Resident. Data-quality bar treatment for Millbrook + Millfield. Filter UI as a radio-style toggle row above the chart.
- **Part 3 — Site-level Consumption page updates.** Same methodology fix at site level. Each site's Consumption page reads from the corrected pipeline figures and displays the appropriate view (single-site doesn't need Total/Landlord/Resident toggle — it can show all three simultaneously since there's only one bar to render).
- **Part 4 — Data-quality handling polish.** Tooltip wording per the methodology section above. Visual treatment for "derived" vs "measured" bars (subtle pattern fill or marker dot in legend). TBC bar treatment for Millbrook + Millfield.
- **Part 5 — Brief 24.7 prose update.** The Consumption page prose written in Brief 24.7 cites "19.0 GWh combined," "10.0 GWh electricity," "12.1 GWh landlord," "6.94 GWh resident," "4.25 GWh Sycous," "2.70 GWh arbnco-derived." All these figures need recalculation against the corrected methodology and updated in the prose. Same for the 74% top-5-sites claim and the "61% directly measured" line. New figures need verification before they land.

**OUT OF SCOPE:**
- Heating strategy / Power strategy / Metering page prose (Brief 24.7 prose on those pages doesn't depend on the methodology fix — unchanged).
- Carbon / Water / Waste tabs (untouched by this brief).
- The Sankey on the Metering page (its meter counts are unaffected; the kWh figures it cites would need updating but the Sankey itself is structurally correct).
- Investigation of *why* Millfield's Sycous data is wrong (that's an IVG/Sycous conversation, not engineering work).
- Per-meter sparklines on Metering page (Brief 24.5 work, separate).

---

## Operational mode

Plough-through, NO checkpoints. Push at close.

**Escalate (log + stop) for:**
- The recalculated headline figures look implausible (e.g. portfolio total goes from 19 GWh to <5 GWh, or somehow goes up). Sanity-check against expectations: bulk sites should shrink dramatically because we're not double-counting; DNO sites stay roughly the same. Net portfolio total should land somewhere between 12-16 GWh — surface specific numbers, stop before updating prose.
- Brief 24.5 (Metering refinement) has shipped fields like `landlord_meters_only` that this brief's new field model conflicts with. Reconcile — both old and new field names should coexist temporarily until a separate cleanup brief.
- Negative landlord figure appears at any site other than Millfield. We expect only Millfield to go negative; if others do, the methodology has another hole. Stop, surface, investigate.
- 20 min stuck + 3 approaches.

---

## Principles

1. **The methodology section above is the contract.** Every code change traces back to it.
2. **Honest gaps over invented numbers.** TBC + tooltip is always better than a plausible-looking but wrong figure.
3. **Both old and new pipeline fields coexist temporarily.** Don't break Brief 17.5's `resident_kwh_by_source` references — add the new model alongside. Cleanup is a separate brief once everything reads from the new fields.
4. **Designer-mode throughout** — same bar as Brief 24 onwards. Filter UI should match the visual register of the existing pill rows.
5. **Browser-verify is the gate.**

---

## Parts

### Part 1 — Pipeline reconciliation update

`pipeline/readers/build_reconciliation.py` (or wherever `reconciliation.json` is built):

Add per-site fields alongside the existing structure:

```python
{
  # ... existing fields preserved ...
  "total_site_kwh": {
    "electricity": float,    # the directly-measured site total
    "gas": float,            # always Ecotricity gas
    "total": float
  },
  "landlord_kwh": {
    "electricity": float,    # bulk minus Sycous (bulk sites with Sycous)
                             # OR Ecotricity landlord (DNO/BNO sites)
                             # OR None (Millbrook, Millfield, where TBC)
    "gas": float,            # always Ecotricity gas
    "source": str,           # "measured" | "derived" | "TBC"
    "tbc_reason": str | None # explanatory text when source = TBC
  },
  "resident_kwh": {
    "electricity": float,    # Sycous total (bulk+Sycous sites)
                             # OR arbnco-derived (DNO sites)
                             # OR sum of Sycous + arbnco (BNO sites)
                             # OR None (Millbrook, Millfield, where TBC)
    "gas": float,            # Sycous heat at heat-network sites, else 0
    "source": str,           # "measured" | "derived" | "mixed" | "TBC"
    "tbc_reason": str | None
  },
  "data_quality_flag": str | None  # "millfield_sycous_anomaly" | "millbrook_no_sycous" | None
}
```

**Per-site logic, by metering arrangement:**

**Bulk-metered with Sycous** (Austin, Blendworth*, Gifford, Ampfield):
```python
total_site_elec = eco_landlord_elec_kwh  # the bulk reading
resident_elec = sycous_submetered_elec_total
landlord_elec = total_site_elec - resident_elec
if landlord_elec < 0:
    # Sycous data anomaly — defer to TBC
    landlord_elec = None
    resident_elec = None
    data_quality_flag = f"{site_id}_sycous_anomaly"
```

*Blendworth has Sycous deployed but currently shows 0 kWh — treat as bulk-no-Sycous case for now.

**Bulk-metered without Sycous** (Millbrook):
```python
total_site_elec = eco_landlord_elec_kwh  # the bulk reading
landlord_elec = None  # cannot derive
resident_elec = None  # cannot measure
data_quality_flag = "millbrook_no_sycous"
```

**DNO** (Bramshott, Durrants, Elderswell, Great Alne):
```python
total_site_elec = eco_landlord_elec_kwh + eco_void_elec_kwh + arbnco_derived_elec
landlord_elec = eco_landlord_elec_kwh + eco_void_elec_kwh  # void stays on IVG contract
resident_elec = arbnco_derived_elec  # source = "derived"
```

**BNO** (Ledian, Ampfield):
```python
total_site_elec = eco_landlord_elec_kwh + sycous_submetered_elec_total + arbnco_derived_elec
landlord_elec = eco_landlord_elec_kwh
resident_elec = sycous_submetered_elec_total + arbnco_derived_elec
# source = "mixed" if both > 0; "measured" if only Sycous; "derived" if only arbnco
```

**Millfield Green specifically:**
- Sycous reading (2,252k) > Ecotricity bulk (840k) → triggers the anomaly path.
- `total_site_elec` = 840k (the bulk reading — this we still trust).
- `landlord_elec` = None, `resident_elec` = None, `data_quality_flag = "millfield_sycous_anomaly"`.
- Total view still shows Millfield's bar at 840k. Landlord and Resident views show TBC with tooltip.

**Portfolio aggregation:**

Add a top-level `portfolio` block to `reconciliation.json`:
```python
{
  "total_kwh": { "electricity": ..., "gas": ..., "total": ... },
  "landlord_kwh": { "electricity": ..., "gas": ..., "total": ... },  # excludes TBC sites
  "resident_kwh": {
    "electricity": ...,
    "gas": ...,
    "total": ...,
    "by_source": {
      "sycous_measured_elec": ...,    # sum across bulk+sycous + BNO Sycous portions
      "arbnco_derived_elec": ...,     # sum across DNO + BNO arbnco portions
    }
  },
  "sites_with_full_data": int,        # count of sites with all three present
  "sites_with_tbc": [str],            # site_ids with any TBC
  "in_scope_count": 11
}
```

PASS for Part 1: regenerated `reconciliation.json` inspected. Headline numbers logged in audit doc. Per-site landlord/resident/total sums verified to reconcile (or marked TBC consistently). Millfield specifically shows total=840k, landlord=TBC, resident=TBC, flag set.

Commit `Brief 24.8 Part 1: reconciliation methodology + new fields`.

---

### Part 2 — Portfolio Consumption chart restructure

`eir/src/components/portfolio/PortfolioEnergy.jsx`, the `ConsumptionPanes` component (line 245 onwards).

**Filter UI: radio-style toggle row above the chart:**

```
[ Total ]  [ Landlord ]  [ Resident ]
                          └─ [ All ]  [ Sycous ]  [ arbnco ]   (only when Resident active)
```

Three primary pills. When Resident is active, a second row of sub-pills appears below. Active pill = NZA coral fill, inactive = transparent with border. Match the Brief 19.5 active-pill pattern exactly.

**State management:**

```jsx
const [view, setView] = useState('total')  // 'total' | 'landlord' | 'resident'
const [residentSource, setResidentSource] = useState('all')  // 'all' | 'sycous' | 'arbnco'
```

**Bar data per state:**

- **Total view:** for each site, bar height = `total_site_kwh.total`. Segmented by gas (coral) + electricity (gold). All 11 sites show. Sort by total desc.
- **Landlord view:** for each site, bar height = `landlord_kwh.total`. Segmented by gas + electricity. Sites with `landlord_kwh.source === 'TBC'` (Millbrook, Millfield) show as **TBC bar** — a thin grey placeholder at the bottom of the chart, with hover tooltip explaining why. Other sites sort by landlord total desc.
- **Resident view (All source):** for each site, bar height = `resident_kwh.total`. Segmented by gas + electricity. TBC sites show TBC bar. Sort by resident total desc. Each bar has a small marker (texture or icon in legend) indicating its primary source: Sycous / arbnco / Mixed.
- **Resident view (Sycous only):** bars only at sites where `resident_kwh.source` includes Sycous-measured data. Other sites greyed out fully, hover tooltip explains "No Sycous coverage at this site."
- **Resident view (arbnco only):** bars only at sites where `resident_kwh.source` includes arbnco-derived data. Other sites greyed out, hover tooltip explains "No arbnco-derived resident data at this site (this is a [bulk-metered / BNO] site)."

**TBC bar visual treatment:**
- Thin grey bar at the bottom of the chart, ~8px tall
- Diagonal stripe pattern fill
- Hover reveals the tooltip from the methodology section above
- Still occupies the site's slot in the leaderboard so site order is preserved

**Source markers for Resident bars:**
- Sycous-measured: solid fill, small dot in legend "Sycous · measured"
- arbnco-derived: diagonal-stripe pattern fill, dot in legend "arbnco · derived"
- Mixed: split bar with both fills, dot in legend "Mixed sources"

**Sort behaviour:** each view sorts bars left-to-right by descending value within that view. So the leaderboard re-orders when filter changes. TBC sites always last regardless of view.

**Transition behaviour:** when the filter changes, bars should smoothly resize and re-order (framer-motion `layout` prop on each bar element, ~300ms spring). The Brief 24.6 cross-fade infrastructure is the foundation; this builds on it.

**Headline strip above the chart:**

Three big-number tiles, updating per view:
- **Total view:** "Portfolio total: X.X GWh · CY25"
- **Landlord view:** "Landlord total: X.X GWh · across N sites · M sites pending"
- **Resident view:** "Resident total: X.X GWh · Y.Y GWh measured · Z.Z GWh derived"

These numbers come from `reconciliation.json`'s new `portfolio` block.

PASS for Part 2: AFTER screenshots at 1920×1080 + 1440×900 showing:
- Total view (default), full leaderboard
- Landlord view with Millfield + Millbrook as TBC bars
- Resident view (All) with source markers
- Resident view (Sycous only) with non-Sycous sites greyed
- Resident view (arbnco only) with non-arbnco sites greyed
- Filter transition recording showing bars re-sizing

Commit `Brief 24.8 Part 2: Consumption chart Total/Landlord/Resident filter`.

---

### Part 3 — Site-level Consumption page updates

For each site's Consumption page (probably `eir/src/components/site/SiteConsumption.jsx` or equivalent — verify path):

Site-level pages don't need the Total/Landlord/Resident *toggle* because there's only one site's worth of data. Instead, show all three simultaneously as three small cards or a single bar with breakdown:

```
┌────────────────────────────────────────┐
│  TOTAL: X kWh                          │
│  ────────────────────────────────────  │
│  Landlord: X kWh (measured / derived)  │
│  Resident: X kWh (source: ...)         │
└────────────────────────────────────────┘
```

For Millfield Green specifically, the site page surfaces the TBC honestly:

```
TOTAL: 840k kWh (bulk meter, Ecotricity)
─────────────────────────────────────────
Landlord: TBC — Sycous reading anomaly
Resident: TBC — Sycous reading anomaly

⚠ Data quality flag: Sycous sub-meter readings at Millfield Green exceed the bulk meter total, which is physically impossible if both measure electricity. NZA is investigating with IVG and Sycous to determine whether the Sycous data is mis-categorised (e.g. measuring heat output from GSHPs rather than electricity input) or has a units/pipeline error. Until resolved, only the bulk meter total is reliable.
```

For Millbrook:

```
TOTAL: X kWh (bulk meter, Ecotricity)
─────────────────────────────────────────
Landlord: TBC — no Sycous coverage
Resident: TBC — no Sycous coverage

ℹ Data gap: Millbrook Village is bulk-metered without Sycous sub-metering deployed. The landlord/resident split cannot be derived without sub-meter data. NZA is working with IVG to deploy Sycous coverage.
```

For sites with full data (Austin, Gifford, Ledian etc), show the three numbers cleanly without the data-quality block.

Source attribution always visible (small text next to each figure): "measured" / "derived" / "mixed."

PASS for Part 3: AFTER screenshots of site-level Consumption page for: Austin Heath (full data), Bramshott Place (DNO arrangement), Ledian Gardens (BNO mix), Millbrook (TBC honest gap), Millfield Green (TBC data anomaly).

Commit `Brief 24.8 Part 3: site-level Consumption methodology`.

---

### Part 4 — Data-quality handling polish

Three things to nail:

**4a — Tooltip wording.** Use the methodology section text verbatim for TBC tooltips. Both Millbrook and Millfield Green get their specific explanations. Format: bold first line stating the situation, second line explaining the work-in-progress.

**4b — Visual marker for derived vs measured.** Subtle diagonal-stripe pattern fill for derived bars (arbnco-derived resident, bulk-minus-Sycous landlord). Solid fill for directly measured bars (Ecotricity landlord at DNO/BNO, Sycous resident). Legend below the chart explains the convention: solid = measured, striped = derived.

**4c — TBC bar styling.** Thin grey bar at the chart baseline, ~8px tall, diagonal stripes, hover reveals tooltip. The bar takes the site's slot in the leaderboard order so the site name still appears on the axis. The visual disposition is "here's the site, this dimension isn't measurable" rather than hiding the site entirely.

PASS for Part 4: AFTER screenshots showing tooltip on Millfield TBC bar, tooltip on Millbrook TBC bar, legend explaining measured/derived convention, derived bars (Bramshott arbnco-resident, Austin landlord-derived) visually distinct from measured bars.

Commit `Brief 24.8 Part 4: data quality visual polish`.

---

### Part 5 — Brief 24.7 prose update

The Consumption page prose locked in Brief 24.7 cites figures that change with the methodology fix. Update them.

**Sources for the updated figures:** read `reconciliation.json`'s new `portfolio` block (Part 1 output). Don't hand-calculate — pull from the pipeline.

**Specific text to revise:**

**Section 1 ("What IVG used in CY2025"):**

Original line (24.7): "Across the remaining 11 sites in CY2025, IVG used **19.0 GWh of energy** — split as **10.0 GWh of electricity** and **8.98 GWh of gas-equivalent**."

**REPLACE with:** "Across the 11 sites in CY2025, IVG used **X.X GWh of energy** — split as **Y.Y GWh of electricity** and **Z.Z GWh of gas**." (Numbers from `portfolio.total_kwh`.)

The "Gas accounts for 63%" line needs recalculation too — likely changes because the electricity total comes down significantly.

The "concentrated at just 6 sites" claim — verify whether still true after recalculation. May change.

**Section 2 ("Why some sites use much more than others"):**

Original line: "Five sites carry roughly **74% of the total energy**"

**REPLACE with:** "[N] sites carry roughly **[P]% of the total energy**" — recalculate from new figures. The named sites (Austin, Gifford, Bramshott, Ledian) likely stay the same in identity but the percentage will change.

**Section 3 ("Landlord vs resident energy"):**

Original lines:
- "Across the 11 sites this totals **12.1 GWh** in CY25" (landlord)
- "what people use directly in their homes — **6.94 GWh** across the portfolio"
- "**4.25 GWh directly measured**" (Sycous)
- "**2.70 GWh** [derived from arbnco]"
- "61% of the resident figure is directly measured. 39% is derived."

**REPLACE all four figures** with new numbers from `portfolio.landlord_kwh.total`, `portfolio.resident_kwh.total`, `portfolio.resident_kwh.by_source.sycous_measured_elec`, `portfolio.resident_kwh.by_source.arbnco_derived_elec`. Recalculate the 61/39% split.

**ADD a new sentence near the resident discussion:**

"Two sites currently show TBC on the landlord/resident split: Millbrook Village (no Sycous sub-metering deployed) and Millfield Green (Sycous data under investigation — readings exceed the bulk meter total). Their site totals are reliable; the landlord/resident split is pending."

PASS for Part 5: updated prose published. New numbers cross-checked against the chart's headline strip — they must match. If chart shows portfolio total of 14.2 GWh, prose says 14.2 GWh.

Commit `Brief 24.8 Part 5: prose figure updates`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + all 5 Parts landed.
2. **Part 1 pipeline:** new `total_site_kwh`, `landlord_kwh`, `resident_kwh`, `data_quality_flag` fields present in `reconciliation.json` per site. Top-level `portfolio` block present. Per-site sums reconcile (Landlord + Resident = Total) or are consistently TBC. Millfield Green specifically shows `data_quality_flag: millfield_sycous_anomaly`.
3. **Part 1 sanity check:** portfolio total electricity comes in between 6-10 GWh (down from inflated 10.0). Portfolio gas roughly unchanged (gas methodology was correct). If outside this range, surface and stop before Part 5.
4. **Part 2 chart:** filter UI rendered as 3 primary pills + sub-pills under Resident. AFTER screenshot.
5. **Part 2 Total view:** leaderboard with all 11 sites, segmented gas/electricity. Headline strip shows portfolio total.
6. **Part 2 Landlord view:** bars resized to landlord-only. Millfield + Millbrook show TBC bars at baseline.
7. **Part 2 Resident view (All):** bars with source markers (solid vs striped). Headline shows breakdown.
8. **Part 2 Resident view (Sycous only):** non-Sycous sites greyed.
9. **Part 2 Resident view (arbnco only):** non-arbnco sites greyed.
10. **Part 2 transitions:** filter change animates smoothly (bars resize, re-sort).
11. **Part 3 site-level pages:** Austin (full data), Bramshott (DNO), Ledian (BNO), Millbrook (TBC honest gap), Millfield (TBC anomaly) all screenshot.
12. **Part 4 visual polish:** TBC bar styling verified, derived/measured legend visible, tooltips on hover for TBC bars.
13. **Part 5 prose:** all four cited figures updated. Cross-check numbers match chart headline strip.
14. **No-regression:** Heating strategy / Power strategy / Metering pages unchanged. Screenshot one.
15. **No-regression on transitions:** Brief 24.6 cross-fades still work between sub-tabs.
16. **STATUS.md** entries per Part. Audit doc complete with screenshots + before/after figure comparison.
17. **Brief archived** to `archive/24_8_consumption_methodology_COMPLETED.md`.

---

## One last thing

This brief is more than cosmetic — it fixes a real data integrity issue that affects every number on the Consumption page. The temptation will be to ship Parts 1-4 quickly and treat Part 5 (prose update) as boilerplate. **Don't.** The prose figures need to match the chart figures exactly, sourced from the new `portfolio` block, not eyeballed from the chart. A mismatch between prose ("19.0 GWh combined") and chart (showing actual smaller number) would undermine reader trust more than the original bug did.

Also: the Millfield Green TBC tooltip will be visible to IVG. Wording matters — surface it as "NZA investigating with IVG/Sycous" rather than "data error." It's a data-quality flag in collaborative tone, not blame.

Push at close.
