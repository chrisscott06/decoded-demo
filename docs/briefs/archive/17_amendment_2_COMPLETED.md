# Brief 17 — Amendment 2: resume Parts 3–5 + italic scope cleanup

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (3 Jun, after Brief 17.5.3 close + Consumption tab review)
**Applies to:** Brief 17 (active, paused since 17.5 → 17.5.2 → 17.5.3 sequence landed)
**Status:** Resumes Brief 17 Parts 3, 4, 5 (Heating · Power · Metering) under the now-locked thematic-page grammar. Also a small Part 2 cleanup (italic scope captions on Consumption).
**Date opened:** 2026-06-03
**Mode:** Plough-through. Push at close. Mandatory walkthrough at **1920×1080 AND 1440×900**.

---

## Why this amendment

The grammar is locked. CLAUDE.md Rule 11 now carries: thematic-page composition, measured layout numbers (1280px container, 400–520 narrative band, 48 gutter, vertical rhythm), fluid type scale, nav-alignment grid, combined-legend-filter pattern, GRESB-26 darker-shade treatment, motion conventions. New thematic content **inherits Rule 11 verbatim — does not redesign.**

Two things outstanding before Brief 17 closes:

1. **Three Energy sub-tabs unbuilt** (Heating · Power · Metering) — placeholder stubs only. The storyboard at `docs/briefs/refs/storyboard_energy_v2.md` is the substance reference; this amendment specifies the corrections layered on top of it and pins each tab's deliverables.
2. **Consumption tab carries three italic "Scope: ..." captions** that read as clutter. The chart's segments + colours + tooltips already communicate scope; the captions are reader-noise. Drop them, lift genuinely useful information into prose where appropriate.

---

## Reference

1. **CLAUDE.md** — read first. **Rule 11 is the canonical grammar; do not respec it.** This amendment specifies *content per sub-tab only.*
2. **STATUS.md** — read full file. Add session-start entry.
3. **STORYBOARD** at `docs/briefs/refs/storyboard_energy_v2.md` — substance reference. Use sections §2 (Heating), §3 (Power), §4 (Metering & data quality) as the basis for narrative and graphic, layered with the corrections in this amendment.
4. **Brief 17** original (still active) — Parts 1, 2 landed; this amendment resumes Parts 3–5.
5. **Briefs 17.5, 17.5.2, 17.5.3** (all archived) — established Rule 11.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` (full file, particularly Rule 11) → `cat STATUS.md` → `cat docs/briefs/active/17_portfolio_energy.md` → `cat docs/briefs/active/17_amendment_2.md` (this file) → `cat docs/briefs/refs/storyboard_energy_v2.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.5 **Land amendment** at `docs/briefs/active/17_amendment_2.md`. **Update STATUS.md:** "Brief 17 resumed — Amendment 2 picks up Parts 3-5 against locked Rule 11 grammar." Commit `Brief 17 Amendment 2 land: resume Parts 3-5 + italic cleanup`.

1. **Confirm inputs.**
   - Rule 11 in CLAUDE.md is the grammar contract — do not modify in this amendment.
   - `docs/audit/17.5.3_*.md` for the current Consumption-tab reference layout.
   - Pipeline JSON: `sites.json`, `mpan_register.json`, `energy.json`, `sycous.json`, `reconciliation.json`, `portfolio.json`. Each token in the spec cites its source.

---

## Operational mode

Plough-through. **Escalate (log + stop) for:**
- Rule 11 (layout numbers, type scale, alignment) not holding when new sub-tabs render — stop and surface; the contract is the contract.
- A token in the spec returning a value materially different from what's listed below (>5% drift) — stop, may indicate pipeline state has changed since this amendment was written.
- The heating-strategy matrix demanding per-phase data that doesn't exist in the pipeline — render as "confirm per-phase" per storyboard §2; do NOT fabricate.
- A chart pattern needing a new design token — stop and ask Chris before introducing one. The palette / type / layout token sets are closed by Rule 11.
- 15 min stuck + 3 approaches.

---

## Principles

1. **Rule 11 inherits, doesn't redesign.** Same `.thematic-page-container`, same narrative-flex / 48-gutter / graphic-flex grid, same `--text-*` tokens, same combined-legend-filter pattern, same motion. Each sub-tab differs only in narrative content and graphic type.
2. **No italic scope captions.** Throughout this amendment + Consumption cleanup. Where scope information genuinely matters (e.g. arbnco methodology unpublished, GRESB-26 muting), fold it into main prose. The chart itself communicates the rest.
3. **Honest data, never fabricated.** The Heating matrix carries "confirm per-phase" cells where per-phase strategy isn't in `sites.json`. The Metering tab flags Ecotricity as the source of void-classification data without editorialising.
4. **Browser-verify is the gate** (Rule 9). 1920×1080 primary walkthrough, 1440×900 graceful scale-down. AFTER screenshots mandatory each tab.

---

## Parts

### Part 2.5 — Consumption italic-scope cleanup (small)

Three italic `Scope: ...` captions currently sit under the subsection bodies on Consumption (under "The portfolio in one line.", "Landlord, resident, and what we can see.", and the closing scope footnote on the Resident paragraph). Drop them.

**Lift these specific bits of information into the main prose:**
- The arbnco methodology-unpublished caveat (already implied; make it explicit one place in the Resident paragraph).
- The GRESB-26 muting note for Sonning Common + Edwalton Office (already implied by the chart; do NOT add to prose — the chart's darker-shade bars + tooltip carry this).

Drop the rest. The chart legend and tooltips do the rest of the work.

Commit `Brief 17 Part 2.5: drop italic scope captions on Consumption`.

### Part 3 — Heating strategy sub-tab

Per storyboard §2, with the corrections from this session layered on top.

**Narrative (left pane, ~3 short subsections):**

§1 — *The spread.* IVG runs **three heating strategies** across the 11 in-scope sites:
- **Communal gas with CHP** — Austin Heath, Gifford Lea (2 sites)
- **Hybrid** — Bramshott Place, Ledian Gardens, Millbrook Village, Elderswell (4 sites)
- **All-electric** — Ampfield Meadows, Blendworth Hills, Durrants Village, Great Alne Park, Millfield Green (5 sites)
- Plus Edwalton Office and Sonning Common (GRESB-26, out of scope)

Roughly half the in-scope estate is fully electrified for heating; the other half retains gas in some form. The split is broadly chronological — older flagship developments carry communal CHP; newer phases default to heat pumps.

§2 — *Why it matters.* Heating strategy concentrates Scope 1 emissions at the CHP sites, dictates which sites consume gas at all, defines where the decarbonisation lever is, and drives the metering arrangement (communal CHP requires bulk-meter approach, which is why older sites tend to be microgrids).

§3 — *The detail that matters at site level.* The portfolio view shows the *shape* of the estate's heating strategy and spread of building archetypes. The genuinely unusual cases — Ledian's mixed strategy across phases, Millbrook's gas-for-pool-only, the per-phase variation across hybrid sites — are covered on each site page.

**Important correction from storyboard §2:** Millfield Green is **all-electric (individual GSHP)**, NOT a communal heat network. The storyboard's earlier categorisation as "ASHP heat network" was wrong. The 2/4/5 split above is canonical.

**Graphic (right pane): building-archetype × phasing matrix.**

Three rows per site for the three building archetypes:
- **VC communal services** (lobby, gym, restaurant, plant)
- **VC apartments** (apartments inside the village centre)
- **Outer apartment blocks** (free-standing or terraced blocks)

Columns: **Phase 1 / Phase 2 / Phase 3 / Phase 4** where the site has multiple phases. Cells contain a small icon indicating that combination's heating strategy: communal gas + CHP / individual gas / ASHP / GSHP / district heat network / none-or-not-built. Empty cells where a phase doesn't exist.

**Per-phase data is not in `sites.json`** — only site-level archetype. The matrix cells that don't have per-phase data render the strategy at site-level + an explicit **"confirm per-phase"** marker. This doubles as the structured ask back to IVG to firm up per-phase strategy in writing.

Visual reference: the Ledian Gardens capacity-study report iconography (already referenced in earlier briefs).

**No italic scope captions.** Any necessary caveat ("per-phase data confirmed at site level only") goes in prose.

Commit `Brief 17 Part 3: heating strategy sub-tab`.

### Part 4 — Power strategy sub-tab

Per storyboard §3.

**Narrative (left pane, ~4 short subsections):**

§1 — *Supplier.* Ecotricity is IVG's supplier for **both electricity and gas** across the entire portfolio — a single commercial relationship covering all landlord MPANs and gas MPRNs. Ecotricity also provides the energy supply for properties that are vacant or between residents — those void periods remain under IVG's commercial contract. The next procurement window opens **October 2026**.

§2 — *Three electricity arrangements.*
- **Bulk meter / microgrid** — a single commercial MPAN serves the whole site; IVG distributes power through a private wire network; residents sub-billed through Sycous. The 7 in-scope sites: Ampfield Meadows, Austin Heath, Blendworth Hills, Gifford Lea, Millbrook Village, Millfield Green, plus Sonning Common (out of scope).
- **DNO standard** — residents have individual MPANs directly with their own suppliers on infrastructure operated by the local DNO. IVG only meters landlord/common-area supply. Sites: Bramshott Place, Durrants Village, Elderswell, Great Alne Park.
- **DNO with IVG-owned cable** (Ledian Gardens only) — IVG owns the physical cable network on site; each resident has their own MPRN and chooses their own supplier; the energy supplier uses IVG's infrastructure to deliver. One site, but the highest unit count in the portfolio.

The arrangement at each site was a development-era decision tied to age, phase, and the heating choice made at construction.

§3 — *Capacity and procurement.* Authorised Supply Capacity (ASC) review is in progress across the portfolio. Sites with completed reviews show the comparison in the table below; sites pending review are flagged.

§4 — *Solar PV.* PV is installed at several sites — most significantly **Ledian Gardens (430 kWp)** and **Millfield Green (~50% on-site PV)**. At bulk-meter sites, PV reduces grid draw on the landlord supply directly. Export and on-site consumption billing methodology for the PV-equipped sites is under review.

**Graphic (right pane): per-site table** with iconography in leftmost columns and four data columns.

| Site | Arrangement | Solar | ASC | CY25 peak | Spare capacity | Status |

- **Arrangement icon** — bulk/microgrid, DNO-standard, DNO-IVG-cable, office
- **Solar** — kWp where installed; blank where none
- **ASC** — kVA, where available; "pending" where not reviewed
- **CY25 peak** — kVA, where HH data covers it
- **Spare capacity** — derived as ASC minus peak; absolute kVA and as %
- **Status** — traffic light: green (>30% spare), amber (10–30%), red (<10% or peak > ASC), grey (pending review)

Sortable by any column. Filter pill above the table: All / Bulk-meter / DNO / Pending review.

Summary strip above: **Sites with capacity review complete: X of 11** (in-scope) · **Headroom across reviewed sites: Y%**.

Commit `Brief 17 Part 4: power strategy sub-tab`.

### Part 5 — Metering & data quality sub-tab

Per storyboard §4.

**Narrative (left pane, ~4 short subsections):**

§1 — *The meter estate.* IVG's electricity meter estate runs through **{{total_mpan_count}} MPANs** across the 11 in-scope sites. Three categories only: **Landlord HH**, **Landlord NHH**, **Void**. Everything else — residents' own MPANs at DNO sites, the Ledian-via-ElectraLink residents — is not visible to IVG directly. Resident consumption at DNO sites is inferred via arbnco-minus-Ecotricity rather than read from individual meters.

Gas is simpler: **{{total_mprn_count}} MPRNs**, all landlord/communal, all on Ecotricity.

§2 — *Three platforms.*
- **Ecotricity** (supplier). Provides HH and NHH billing data for every landlord MPAN and every gas MPRN. The authoritative source for what IVG is invoiced.
- **arbnco** (aggregator). Pulls meter data across the portfolio including non-landlord points. Used to derive resident consumption at DNO sites by subtraction. Arbnco's methodology has not been published to NZA.
- **Sycous** (resident sub-metering). Operates sub-meters at bulk / microgrid / heat-network sites that bill residents for their share of energy. Covers **{{sycous_inscope_sites}} of 11** in-scope sites, sub-metering **{{sycous_property_count}} properties** through **{{sycous_meter_count}} sub-meters** across five supply types.

A fourth platform — **Meterpoint** — piggybacks Sycous meters at some sites for higher-frequency data. NZA is in early conversations with Meterpoint about API access; not yet integrated.

§3 — *The high-consumption voids.* A specific point worth surfacing honestly. Ecotricity classifies **{{void_high_count}} electricity MPANs** as vacant but reports material consumption against them — **{{void_high_kwh}} kWh** in total across CY25. Three sites carry the bulk: Ledian Gardens, Bramshott Place, Elderswell. This data is Ecotricity-provided. Possible explanations: incorrect billing classification (the meter sits on a resident-occupied unit), genuinely vacant units with equipment left running, or estimated consumption against an inactive meter. Worth investigating; not editorialised further than the data supports.

§4 — *What this means for the rest of the page.* Landlord figures (Consumption tab) are invoiced totals from Ecotricity — accurate. Derived resident figures rely on arbnco's methodology and are plausible at DNO sites but not directly verifiable. Sycous sub-metering covers 7 of 11 in-scope sites — see Consumption tab for per-site flags. Heating strategy data is comprehensive at site level; per-phase detail is incomplete (an explicit IVG ask).

**Graphic (right pane): stacked horizontal bar per site** with three segments.

Each bar:
- **Landlord HH** (deep coral)
- **Landlord NHH** (mid coral)
- **Void** (grey, with darker shade for high-consumption voids specifically)

Sorted by total MPAN count descending. Filter pills above:
- **All meters** (default)
- **Landlord only**
- **Voids only** (highlights the high-consumption subset visually)
- **Sub-meters** (switches the chart to Sycous coverage view — properties × meters per site)

Hover any segment: site · category · MPAN count · % of site total · total CY25 kWh on these meters.

Summary strip below the chart: **{{full_coverage_count}}** of {{total_meter_count}} meters with full 12-month CY25 data · **{{partial_count}}** partial · **{{none_count}}** no readings. Sycous coverage 100% on **{{sycous_sites_with_full_coverage}}** of {{sycous_inscope_sites}} sub-metered in-scope sites.

Commit `Brief 17 Part 5: metering & data quality sub-tab`.

### Part 6 — Walkthrough + close

- 1920×1080 walkthrough of all four Energy sub-tabs (Consumption + the three new ones). 1440×900 graceful scale-down verification.
- Screenshots land in `docs/audit/17_portfolio_energy.md`.
- **Confirm Rule 11 inheritance:** for each of the three new tabs, paste the computed CSS values showing container max-width, narrative width, gutter, type-token use. Numbers must match Rule 11.
- Falsifiability greps (paste in close report):
  - `grep -rn "font-size:" eir/src --include='*.jsx'` — should remain at zero hits.
  - `grep -rn "italic" eir/src/components/portfolio/PortfolioEnergy.jsx` — italic scope captions removed; only deliberately-italic prose (none expected) remains.
  - Per Rule 11 falsifiability checks (container width, body line-height, nav-edge alignment).
- **STATUS.md final update.**
- Brief 17 archived to `archive/17_portfolio_energy_COMPLETED.md`. `current.md` repointed.
- Commit `Brief 17 close: Energy page complete (4 sub-tabs + design system)`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + Part 2.5 + Parts 3-5 + Part 6 landed.
2. **Consumption italic scope captions removed** — falsifiability grep returns zero `italic` hits in PortfolioEnergy.jsx (except for any deliberately styled inline emphasis, documented).
3. **Heating tab:** building-archetype × phasing matrix with Ledian-style iconography; correct 2/4/5 split (Millfield Green in all-electric, NOT communal heat); "confirm per-phase" cells where per-phase data absent. **AFTER screenshot.**
4. **Power tab:** per-site table with arrangement icons, solar kWp, ASC / peak / spare / status, traffic-light status, filter pills, summary strip. **AFTER screenshot.**
5. **Metering tab:** stacked bar with three categories + four filter pills incl. sub-meter toggle + data-quality summary strip. **AFTER screenshot.**
6. **Rule 11 inheritance** evidenced for all three new tabs — computed CSS values pasted for container max-width (1280), narrative width (within 400-520 band), gutter (48), nav alignment (left edges aligned at x=320 at 1920 viewport).
7. All tokens listed in this amendment wired to live pipeline values (no hardcoded).
8. **1920×1080** primary walkthrough with screenshots each tab.
9. **1440×900** scale-down verified.
10. **No regression** on Consumption, Map, Home, Site Detail tabs. Rule 11 type scale grep still returns zero font-size hits.
11. **STATUS.md start/end entries** for each Part. Audit doc populated. Bible discipline evidenced.
12. CLAUDE.md Rule 11 unchanged — the contract held.
13. Brief 17 archived; current.md repointed.
14. Known issues / deferrals logged — explicitly the four future thematic pages (Water, Waste, Carbon, Overview) need their own storyboards + briefs; GIA / voids / Meterpoint still deferred; ASC review completeness flagged per Power tab status column.
