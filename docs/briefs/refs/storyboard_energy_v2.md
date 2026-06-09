# Portfolio › Energy — storyboard v2

**What this is.** A read-and-mark-up document. Each sub-tab has draft narrative (left-pane prose) and graphic specification (right-pane). Bolded values are *data tokens* that read live from the pipeline. Voice is intended to match NZA's house style — direct, no clichés, no "we recommend", concrete.

**Layout.** Narrative left, single interactive graphic right. Sub-tabs switch both panes together — text and chart stay paired. Four sub-tabs: **Consumption · Heating strategy · Power strategy · Metering & data quality.**

---

## Sub-tab 1 — Consumption

### Narrative (left pane)

**The portfolio in one line.**
IVG consumed **{{total_elec_gwh}} GWh** of electricity and **{{total_gas_gwh}} GWh** of gas across **13 sites** in CY2025 — **{{total_energy_gwh}} GWh** combined. Gas accounts for **{{gas_share_pct}}%** by volume but is concentrated in **6 sites**: the other 7 are entirely electric. That asymmetry runs through everything on this page.

**Where the consumption sits.**
The five biggest energy consumers carry roughly **{{top5_pct}}%** of total kWh. Austin Heath and Gifford Lea sit at the top because both operate central gas CHP plants serving the whole village's heating. Bramshott Place and Ledian Gardens follow — both with significant gas-fired heating, in Bramshott's case through individual unit-level boilers and in Ledian's through a mixed strategy of heat network, individual gas and ASHP across different phases. Sites without communal heating run electricity-only profiles, typically a quarter or less of the heat-network sites' totals.

**Landlord, resident, and what we can see.**
The figures above split into two categories worth being precise about.

**Landlord** is what IVG buys directly from Ecotricity on its commercial contracts — landlord half-hourly and non-half-hourly meters, plus the gas MPRNs. Across the portfolio this totals **{{landlord_total_gwh}} GWh**. This is the figure IVG is invoiced and pays for.

**Resident** is the energy used by residents in their homes. IVG's visibility of this varies by site arrangement. At bulk-meter / microgrid sites the resident energy *passes through* IVG's landlord supply and is sub-billed via Sycous. At DNO sites residents have their own MPANs with their own suppliers and IVG never sees those directly. The figure shown for resident consumption — **{{derived_resident_gwh}} GWh** portfolio-wide — is *derived* from arbnco's aggregated meter feed minus the known Ecotricity landlord figure. Arbnco has not published its methodology to NZA. Per-unit sanity checks show the derivation is plausible at some sites and clearly suspect at others (see Metering & data quality tab). The numbers are presented but not editorialised beyond what the data supports.

The Consumption chart shows both — landlord directly, resident derived — and flags the sites where the derivation is suspect.

### Graphic (right pane)

**Primary chart: stacked horizontal bar per site, sorted by total kWh.** All 13 sites visible at 1440×900.

Each bar stacks four segments by default:
- **Landlord — electricity** (deep coral)
- **Landlord — gas** (rust)
- **Resident — derived electricity** (teal, with a hatched fill where arbnco data flagged suspect)
- **Resident — derived gas** (deep teal, same hatched-where-suspect treatment)

Three toggle pills above the chart control what's shown:
- **By commodity** (default): four-segment stack as above
- **By billing party**: collapses to two segments — total landlord, total derived resident
- **Total only**: single bar per site

Small portfolio total card sits at the top right:
> Landlord (measured): **{{landlord_gwh}} GWh** · Resident (derived): **{{derived_resident_gwh}} GWh** · Of resident figure, **{{suspect_pct}}%** flagged for review

Hover any segment shows: site · category · kWh · % of site · % of portfolio · *source* (Ecotricity-measured or arbnco-derived).

### Decisions locked / open

- Sites sorted by total kWh descending. ✓
- Hatched fill for arbnco-derived-suspect segments (the Millbrook / Durrants / Great Alne / Ampfield / Blendworth tier). ✓
- Portfolio total card present at top right. ✓
- *Open:* should the toggle pills also include a "per residential m²" intensity view, now that the GIA file gives us residential area? My lean: not yet — adds a fourth toggle and the intensity story belongs on Carbon. Defer.

---

## Sub-tab 2 — Heating strategy

### Narrative (left pane)

**The spread.**
IVG operates three distinct heating strategies across the portfolio:

- **Communal gas with CHP** — Austin Heath, Gifford Lea. Two sites, both flagship developments. Central plant rooms serve the whole village via heat networks. These are the two largest gas consumers.
- **Hybrid** — Bramshott Place, Ledian Gardens, Millbrook Village, Elderswell. Four sites where heating strategy varies by phase, archetype or sub-location: individual gas boilers in some units, ASHPs in others, partial heat networks at Ledian, gas restricted to the swimming pool at Millbrook.
- **All-electric** — Ampfield Meadows, Blendworth Hills, Durrants Village, Great Alne Park, Millfield Green, Sonning Common, plus Edwalton Office. Seven sites running entirely on heat pumps (a mix of GSHP and ASHP, individual rather than communal) with no gas connection.

Roughly half the estate (7 of 13 sites) is fully electrified for heating. The other half retains gas in some form. The split is broadly chronological: the older flagship developments carry communal CHP; newer phases and developments default to heat pumps.

**Why it matters.**
Heating strategy determines almost everything else on the Energy page. It dictates which sites consume gas at all (the 6-of-13 split). It concentrates Scope 1 emissions at the CHP sites. It defines the decarbonisation lever: gas-served sites are the targets for future intervention, and the cost and feasibility of that intervention varies by archetype. It also drives the metering arrangement at most sites — communal CHP requires a bulk-meter approach to be efficient, which is why the older sites tend to be microgrids.

**The detail that matters at site level.**
What this tab does *not* try to do is explain every site's heating fully. The genuinely unusual cases — Ledian's mixed strategy across phases, Millbrook's gas-for-pool-only setup, the per-phase variation across hybrid sites — are covered on each site page. The portfolio view's job is to show the *shape* of the estate's heating strategy and the spread of building archetypes within each site.

### Graphic (right pane)

**Building-archetype × phasing matrix**, styled after the Ledian capacity-study report iconography (small coloured strategy icons, grouped per site, with phasing variation shown where it exists).

Each site appears as a row group containing up to three sub-rows for the three building archetypes:
- **VC communal services** (lobby, gym, restaurant, plant)
- **VC apartments** (apartments inside the village centre)
- **Outer apartment blocks** (free-standing or terraced blocks across the wider site)

For each archetype, columns show **Phase 1 / Phase 2 / Phase 3 / Phase 4** (where the site has multiple phases). Cells contain a small icon indicating that combination's heating strategy: communal gas + CHP, individual gas, ASHP, GSHP, district heat network, none/not built. Empty cells where a phase doesn't exist.

Above the matrix: a small legend showing the icon for each strategy and the count of cells in that category across the portfolio.

Hover any cell shows: site · archetype · phase · strategy · units served · CY25 status (occupied / partial / pending).

### Decisions locked / open

- Three building archetypes (VC services, VC apartments, outer blocks). ✓
- Up to four phases per site. ✓
- Ledian capacity-study iconography style. ✓
- *Honest gap:* per-phase heating strategy data is not currently in `sites.json` — only site-level. The matrix needs IVG to confirm each cell. The page should mark cells as **"confirm per-phase"** where data is missing, the same way the standalone Phasing reference does. This makes the matrix double as a structured ask back to IVG.

---

## Sub-tab 3 — Power strategy

### Narrative (left pane)

**Supplier.**
Ecotricity is IVG's supplier for both electricity and gas across the entire portfolio — a single commercial relationship covering **{{total_mpan_count}} MPANs** and **{{total_mprn_count}} MPRNs**. Ecotricity also provides the energy supply for properties that are vacant or between residents — those void periods remain under IVG's commercial contract rather than reverting to the previous resident's tariff. The next procurement window opens in **October 2026**.

**Three electricity arrangements.**
IVG operates three fundamentally different electricity arrangements across the portfolio:

- **Bulk meter / microgrid.** A single commercial MPAN serves the whole site; IVG distributes power internally through a private wire network; residents are sub-billed through Sycous. The seven sites in this arrangement are: Ampfield Meadows, Austin Heath, Blendworth Hills, Gifford Lea, Millbrook Village, Millfield Green, and Sonning Common.
- **DNO standard.** Residents have individual MPANs directly with their own suppliers, on infrastructure operated by the local Distribution Network Operator. IVG only meters landlord/common-area supply. The four sites here are Bramshott Place, Durrants Village, Elderswell, and Great Alne Park.
- **DNO with IVG-owned cable** (Ledian Gardens). A hybrid: IVG owns the physical cable network on site, but each resident has their own MPRN and chooses their own supplier. The energy supplier uses IVG's infrastructure to deliver to each resident. One site, but an important one — it carries the highest unit count in the portfolio and the most distinctive arrangement.

Plus the Edwalton Office, on a single NHH commercial meter.

The arrangement at each site was a development-era decision rather than a strategic one — generally tied to age, phase, and the heating choice made at construction. It significantly affects what IVG can see, influence and procure: at bulk sites IVG controls 100% of the supply tariff for every resident; at DNO sites IVG influences only the 10–20% of supply consumed in common areas; at Ledian the position is somewhere in between.

**Capacity and procurement.**
Authorised Supply Capacity (ASC) review is in progress across the portfolio. The work compares each site's contracted capacity against actual CY25 peak demand to identify over-capacity (where IVG is paying for headroom it doesn't use) or under-capacity (where peak demand is approaching contractual limits). Sites with completed reviews show the comparison in the table below; sites pending review are flagged.

**Solar PV.**
PV is installed at several sites — most significantly **Ledian Gardens (430 kWp)** and **Millfield Green (~50% on-site PV)**. At bulk-meter sites, PV reduces grid draw on the landlord supply directly. At DNO sites the picture is more complex because solar offsets common-area landlord consumption only, with the residential portion still drawn from the grid through individual MPANs. Export and on-site consumption billing methodology for the PV-equipped sites is under review.

### Graphic (right pane)

**Per-site table** with iconography in the leftmost columns and four data columns:

| Site | Arrangement | Solar | ASC | CY25 peak | Spare capacity | Status |

Iconography columns:
- **Arrangement** — small icon: bulk/microgrid, DNO-standard, DNO-IVG-cable, office
- **Solar** — kWp where installed; blank where none

Data columns:
- **ASC** — kVA, where available
- **CY25 peak** — kVA, where HH data covers it
- **Spare capacity** — derived as ASC minus peak; absolute and as %
- **Status** — traffic light: green (>30% spare), amber (10–30%), red (<10% or peak > ASC), grey (pending ASC review)

Sortable by any column. Filter pill above the table: All / Bulk-meter / DNO / Pending review.

Above the table: small summary strip — *Sites with capacity review complete: **{{asc_complete}}** of 13 · Capacity headroom across reviewed sites: **{{avg_spare_pct}}%***.

### Decisions locked / open

- Table view (not chart) — locked.
- Iconography for arrangement and solar — locked, style to match Heating tab matrix.
- Traffic-light status with explicit thresholds (>30 / 10–30 / <10 / pending). ✓
- *Open:* should solar PV have a separate row of detail (orientation, age, MCS-certification status) or stay as a single column with site-page drill-down for detail? My lean: single column here; detail on site page.

---

## Sub-tab 4 — Metering & data quality

### Narrative (left pane)

**The meter estate.**
IVG's electricity meter estate runs through **{{total_mpan_count}} MPANs** across 13 sites. The estate breaks into three categories:

- **Landlord half-hourly (HH)** — the metered points IVG is invoiced on for HH-billed supplies. Typically one per bulk-meter site plus selected larger NHH supplies. **{{lhh_count}} meters portfolio-wide.**
- **Landlord non-half-hourly (NHH)** — landlord supply on standard NHH tariff (common area lighting, lifts, small plant). **{{lnhh_count}} meters.**
- **Void** — registered MPANs at addresses where there is no active resident. **{{void_count}} meters.**

Everything else — residents' own MPANs at DNO sites, the Ledian-via-ElectraLink residents — is *not visible to IVG directly*. Resident consumption is inferred from arbnco's aggregated feed rather than read from individual meters.

Gas is simpler: **{{total_mprn_count}} MPRNs**, all landlord/communal, all on Ecotricity.

**The three platforms.**
Three platforms together carry the data IVG has on its energy estate:

- **Ecotricity** (supplier). Provides the half-hourly and non-half-hourly billing data for every landlord MPAN and every gas MPRN. The authoritative source for what IVG is actually billed.
- **arbnco** (aggregator). Pulls meter data from across the portfolio including non-landlord points. Used to derive resident consumption by subtracting Ecotricity landlord from arbnco totals. Arbnco's methodology — which meters it counts, how it estimates gaps, what it includes from DNO sites — has not been published to NZA. The per-unit sanity check below shows where arbnco's figures align with plausible resident consumption and where they don't.
- **Sycous** (resident sub-metering). Operates the sub-meters at bulk / microgrid / heat-network sites that bill residents for their share of energy. Covers **7 of 13 sites**, sub-metering **{{sycous_property_count}} properties** through **{{sycous_meter_count}} sub-meters** across five supply types: electricity, heat, hot water, heat & hot water combined, and cold water (Ledian uniquely).

A fourth platform — **Meterpoint** — piggybacks Sycous meters at some sites for higher-frequency data. NZA is in early conversations with Meterpoint about API access; for now Meterpoint data is not integrated.

**The high-consumption voids.**
A specific point worth surfacing honestly. Ecotricity classifies **{{void_high_count}} electricity MPANs** as vacant but reports consumption against them — **{{void_high_kwh}} kWh** in total across CY25. Three sites carry the bulk: Ledian Gardens (**{{ledian_void_count}}**, **{{ledian_void_kwh}} kWh**), Bramshott Place (**{{bramshott_void_count}}**, **{{bramshott_void_kwh}}**), and Elderswell (**{{elderswell_void_count}}**, **{{elderswell_void_kwh}}**).

This data is provided by Ecotricity. The explanation could be incorrect billing classification (the meter sits on a resident-occupied unit but Ecotricity has it as void), genuinely vacant units with equipment left running, or estimated consumption against an inactive meter. Without further information from Ecotricity or a cross-check against IVG's own occupancy data, we report what's there and flag it for investigation.

**What this means for the rest of the page.**
The Consumption tab's landlord figures are accurate — they're invoiced totals from Ecotricity. The derived resident figures rely on arbnco's methodology and are plausible at some sites but suspect at others; this is visible in the per-unit analysis. The Heating tab's archetype data is comprehensive at site level but per-phase detail is incomplete (an explicit IVG ask). The Power tab's capacity figures are accurate for sites with completed ASC review and pending elsewhere.

### Graphic (right pane)

**Stacked horizontal bar per site** showing the breakdown of MPANs by category.

Each bar stacks three segments:
- **Landlord HH** (deep coral)
- **Landlord NHH** (mid coral)
- **Void** (grey, with a darker shade for high-consumption voids specifically)

Sorted by total MPAN count descending — which puts Bramshott (49), Elderswell (52) and Ledian (69) at the top, showing the DNO sites carry the longest tails.

Filter pills above the chart:
- **All meters** (default)
- **Landlord only**
- **Voids only** (highlights the high-consumption subset visually)
- **Sub-meters** (switches the chart to Sycous coverage — properties × meters per site)

Hover any segment shows: site · category · MPAN count · % of site total · total CY25 kWh on these meters.

Below the chart, a small data-quality summary strip:
> **{{full_coverage_count}}** of {{total_meter_count}} meters have full 12-month CY25 data · **{{partial_count}}** partial · **{{none_count}}** with no readings. Sycous coverage on **{{sycous_sites_with_full_coverage}}** of 7 sub-metered sites is 100%; on the remaining sites coverage gaps are documented per site.

### Decisions locked / open

- Stacked bar chart with three segments + filter pills. ✓ (your call)
- Sub-meter view as a chart toggle within the same graphic. ✓
- Honest framing of arbnco methodology (no editorialising). ✓
- Honest framing of high-consumption voids (data-source attribution + plausible explanations). ✓
- *Open:* should the chart show the *kWh* on void meters as a separate visual layer (e.g. dot markers showing kWh-per-MPAN against the bar), or keep it as a hover-only detail? My lean: hover only. Adds clutter to keep on screen.

---

## Cross-cutting

**Tokens to wire from pipeline.** Every bolded value above is a token. The brief will need to list them explicitly with their pipeline source — Claude Code shouldn't have to guess where `{{void_high_kwh}}` comes from. I'll do that in the brief itself.

**Voice check.** I've written this in NZA-direct style — no "we recommend", no hedging beyond what the data demands. If anything reads stilted or off-voice, mark it; I'd rather you flag now than later.

**What's NOT in this storyboard but will be in the brief.**
- Exact colour palette for the four-segment stacks
- Exact icon library for the Heating matrix and Power table
- Specific chart library and component reuse (Recharts continues from prior briefs)
- Falsifiability greps and PASS criteria
- The reading-mode handover: short narrative summary at the top of each tab for the two-minute reader (this is something to discuss before brief — currently each tab starts straight into §1)

---

## Things to mark up

1. **Tone and voice.** Anywhere it reads off, mark it.
2. **Sub-tab 1, Decision-open:** intensity-per-m² toggle on Consumption — defer to Carbon, or include here?
3. **Sub-tab 2, Decision-honest-gap:** the "confirm per-phase" treatment is right, isn't it? Same as the Phasing reference?
4. **Sub-tab 3, Decision-open:** solar PV — single column or row of detail?
5. **Sub-tab 4, Decision-open:** void kWh as visual layer or hover only?
6. **Cross-cutting:** should every tab carry a one-paragraph **TL;DR at the top** for the two-minute reader, with the longer prose underneath? My lean: yes, but it'd change the rhythm of every tab.

Once you've worked through this, the brief writes itself — most decisions are now made, the prose just needs your edits, and the tokens go in a wiring table.
