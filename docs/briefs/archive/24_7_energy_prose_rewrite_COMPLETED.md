# Brief 24.7 — Energy chapter prose rewrite + Metering rename

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott (4 Jun, after reviewing the prose across all four Energy sub-tabs at portfolio level)
**Status:** Active. Content-only brief — no chart changes, no component refactoring, no data work. Plough-through with NO checkpoints.
**Date opened:** 2026-06-04
**Mode:** Push at close. Walkthrough at **1920×1080 + 1440×900**.

---

## Why this brief

Chris reviewed the prose across the four Energy chapter sub-tabs at portfolio level (Consumption / Heating strategy / Power strategy / Metering & data quality) and identified the same set of writing problems across all four pages:

- **Section headers try too hard to be evocative** — "The portfolio in one line," "The spread, phase by phase," "Where it gets mixed," "The meter estate" — they sound like newspaper subheads written by someone trying to be writerly. They don't tell the reader what's actually below.
- **The prose explains the chart rather than explaining the world** — sentences like "The matrix carries one cell per phase per site" are documentation of the visualisation, not insight into IVG.
- **Jargon is untranslated** — MPAN, MPRN, DNO, BNO, ASC, CHP all used without first-use explanation.
- **Opening sentences don't orient** — they jump straight into numbers or chart-mechanics, with no framing of *what this thing IVG actually is*.
- **One section makes a misleading claim** — describing landlord energy as "what IVG pays for" misrepresents the actual cost flow (IVG is invoiced; residents are recharged via service charge; DevCo absorbs voids).
- **One section publicly speculates** about Elderswell's VC heating arrangement — reads as us guessing in writing. Should be reframed as work-in-progress.

This brief replaces the prose on all four Energy sub-tabs at portfolio level, renames the fourth sub-tab from "Metering & data quality" to just "Metering," and establishes a small set of prose-style principles for the tool going forward.

**No chart changes. No component refactoring. No data layer changes.** Text-only updates plus one nav-label rename.

---

## Reference

1. **CLAUDE.md** — read first. Rule 11 inheritance unchanged.
2. **STATUS.md** — full read at session start.
3. **Brief 17** (archived) — established the original prose on these pages. This brief replaces that prose.
4. **Brief 24** (archived) — established the page structure. Structure unchanged here; only text changes.
5. **Brief 24.5** (active or shipped) — Metering refinement work. This brief's rename "Metering & data quality" → "Metering" supersedes any naming decisions in 24.5. Coordinate accordingly.

---

## BEFORE DOING ANYTHING

0. **Session-start read order (Hard Rule 1):** `cat CLAUDE.md` → `cat STATUS.md` → `cat docs/briefs/active/24_7_energy_prose_rewrite.md`.

0.1 **Reconciliation (Rule 8):** `ls docs/briefs/active/`, `cat docs/briefs/current.md`, `git log --oneline -10`, `git status --short` clean.

0.5 **Land brief.** Place at `docs/briefs/active/24_7_energy_prose_rewrite.md`. Create `docs/audit/24_7_energy_prose_rewrite.md` ("Pending"). Update `current.md`. **Update STATUS.md.** Commit `Brief 24.7 land: Energy prose rewrite`.

---

## Prose-style principles (apply to all four rewrites)

1. **Headers are plain noun phrases that name the section content.** "How IVG heats its homes" not "The spread, phase by phase." "How electricity reaches each site" not "Three electricity arrangements." Scannable signposts, not headlines.

2. **Opening sentence orients the reader to the world, not the page.** Tell them what they're looking at as a thing in real life (a portfolio of retirement villages built across years) before any number, any chart description, any jargon.

3. **Jargon gets translated on first use, then can stand alone.** First MPAN → "MPAN (the unique number for an electricity meter)." First DNO → "standard residential supply (each home has its own meter and own supplier)." First CHP → "combined heat and power (CHP)." First ASC → "Authorised Supply Capacity (ASC)." After first use the abbreviation alone is fine.

4. **Don't explain the chart in the prose.** Sentences about how the visualisation is constructed ("the matrix carries one cell per...," "adjacent identical phases merge into...") belong in the chart's own legend or tooltip, not in the narrative column. The prose tells the story the chart visualises; the chart is the visualisation.

5. **Don't speculate publicly.** Where we have a guess but no confirmation, the framing is "as part of NZA's ongoing site intelligence review we'll confirm" rather than "our best read is X but needs confirmation." The former positions the gap as work-in-progress; the latter reads as us hedging in writing.

6. **Drop "in-scope" from body copy.** The opening establishes the scope (13 villages, 2 out of scope, CY25, GRESB cycle). Everything else is implicitly within that frame. Don't keep restating it.

---

## Scope statement

**IN SCOPE:**
- **Page 1 — Consumption:** prose rewrite across all three sections (full text below).
- **Page 2 — Heating strategy:** prose rewrite across all three sections (full text below).
- **Page 3 — Power strategy:** prose rewrite, including restructure of the first section to cover both electricity AND gas supplier (full text below).
- **Page 4 — Metering:** prose rewrite + page title rename from "Metering & data quality" to **"Metering"** (full text below).
- Navigation label rename: every place "Metering & data quality" appears in nav, headers, breadcrumbs, page titles, URL slugs — rename to "Metering."
- Walkthrough + close.

**OUT OF SCOPE:**
- Any chart changes (Sankey, bar charts, donut, matrix, table — all stay as-is)
- Any component layout changes
- Any data pipeline changes
- The site-level versions of these pages (this brief covers portfolio-level only; site-level prose may need similar treatment in a future brief but is not in this brief's scope)
- Carbon / Water / Waste sub-tabs (those will need similar prose treatment when they're built out — not now)

---

## Operational mode

Plough-through. Small brief, content-only. Push at close.

**Escalate (log + stop) for:**
- Page title rename causes a routing break (unlikely but possible if URL slug is hardcoded somewhere)
- Any of the data figures in the proposed prose (12.1 GWh, 6.94 GWh, 4.25 GWh, 2.70 GWh, 1,049 sub-meters, 18 MWh void consumption etc) don't match what the page is currently showing. Surface the discrepancy and stop — DO NOT rewrite the numbers to match either the prose or the chart without checking with Chris. The figures in this brief came from earlier session work and should be accurate, but worth verifying against the live pipeline output.
- 15 min stuck + 3 approaches.

---

## Parts

### Part 1 — Prose replacements + Metering rename

This is the find-and-replace work across the four pages. For each page, the brief gives the *exact text to remove* and the *exact text to replace it with.* Claude Code is doing replacement, not interpretation.

---

#### Page 1 — Consumption (portfolio level)

**Section 1: rename "The portfolio in one line." → "What IVG used in CY2025."**

**REPLACE the section 1 body with:**

> Inspired Villages operates 13 retirement villages. 2 are out of scope for this GRESB reporting cycle — one is the head office (Edwalton) and the other only became operational in 2026 (Sonning Common, still under construction). Across the remaining 11 sites in CY2025, IVG used **19.0 GWh of energy** — split as **10.0 GWh of electricity** and **8.98 GWh of gas-equivalent**. Gas accounts for 63% of the landlord total by volume but is concentrated at just 6 sites; the other 5 run entirely on electricity.

**Section 2: rename "Where the consumption sits." → "Why some sites use much more than others."**

**REPLACE the section 2 body with:**

> Five sites carry roughly **74% of the total energy** — Austin Heath, Gifford Lea, Bramshott Place, Ledian Gardens, and one more. All have significant gas-fired heating. Austin Heath and Gifford Lea run central combined heat and power (CHP) plants serving every home from one source. Bramshott Place uses individual gas boilers in each home. Ledian Gardens runs a mixture of gas heat network, individual gas, and air-source heat pumps (ASHP) across its three phases.
>
> The sites without gas-fired communal heating run electricity-only and consume far less — typically a quarter or less of the heat-network sites' totals.

**Section 3: rename "Landlord, resident, and what we can see." → "Landlord vs resident energy."**

**REPLACE the section 3 body with:**

> The 19 GWh splits into two distinct categories worth being precise about.
>
> **Landlord energy** is the energy on IVG's commercial contracts with Ecotricity — covering communal lighting, lifts, plant rooms, and the gas supplies into the heat networks. Across the 11 sites this totals **12.1 GWh** in CY25. IVG is invoiced for this directly, but the cost is recharged to residents proportionally through the service charge. Where a home is vacant, the DevCo absorbs that share of the bill until a new resident takes over.
>
> **Resident energy** is what people use directly in their homes — **6.94 GWh** across the portfolio. How IVG sees this depends on the site's design:
>
> - At **bulk-metered sites** (Austin Heath, Gifford Lea, Millfield Green, Ampfield Meadows, Blendworth Hills), the resident electricity flows through IVG's commercial supply and is sub-metered apartment-by-apartment by Sycous — **4.25 GWh directly measured.**
> - At **standard residential sites** (Bramshott Place, Durrants Village, Great Alne Park, Elderswell, Ledian Gardens), each resident has their own meter and their own supplier. IVG never sees this directly. The figure shown — **2.70 GWh** — is *derived* by taking the total flowing into the site (from arbnco) and subtracting IVG's known landlord consumption. The arbnco methodology hasn't been published to NZA.
> - **Millbrook Village** is an honest gap — bulk-metered but with no Sycous sub-metering yet deployed, so no resident figure is reconstructed.
>
> 61% of the resident figure is directly measured. 39% is derived. Some is missing entirely. Worth being honest about that distinction when reading site-level numbers.

---

#### Page 2 — Heating strategy (portfolio level)

**Section 1: rename "The spread, phase by phase." → "How IVG heats its homes."**

**REPLACE the section 1 body with:**

> Inspired Villages has developed its sites across multiple years and design eras, with different heating strategies adopted as the portfolio grew. The result is a mixed picture across the 11 sites. Some sites have **central plant** — one large boiler or CHP unit serving every home via a heat network. Others give each home its own **individual unit** — a gas boiler, an air-source heat pump (ASHP), or a ground-source heat pump (GSHP). A few sites combine multiple strategies across different phases.
>
> Across the 11 sites the count is: **2 sites with CHP, 1 hybrid, 7 sites on ASHP, 1 on GSHP** — though several use different systems in different phases.

**Section 2: rename "Where it gets mixed." → "The sites with multiple strategies."**

**REPLACE the section 2 body with:**

> Four sites carry the complexity. Reading site by site:
>
> - **Bramshott Place** uses individual gas boilers in its earliest phase (Village Centre + apartments), then switches to individual air-source heat pumps for Phases 2 through 4 — a within-portfolio decarbonisation story across one site.
> - **Ledian Gardens** spans three completely different strategies across its three phases: a gas heat network in Phase 1, individual ASHP in Phase 2, individual GSHP in Phase 3. No Phase 4.
> - **Elderswell** pairs a TBC village-centre arrangement with gas-boilered apartments through all four phases.
> - **Millbrook Village** runs a hybrid on every phase — pool gas plus village-centre ASHP plus individual apartment ASHP.
>
> These four sites are also where the carbon arithmetic gets per-phase rather than per-site.

**Section 3: rename "What's confirmed vs what's pending." → "What's confirmed and what we're still checking."**

**REPLACE the section 3 body with:**

> One cell carries a TBC marker — **Elderswell's village centre**. As part of NZA's ongoing site intelligence review, we'll confirm exactly what's installed at each site. Every other phase on the 11 sites is confirmed.
>
> Two sites sit at the bottom of the matrix at lower visual weight: Sonning Common (under construction; out of GRESB 26 scope) and Edwalton Office (the head office, not a village).

---

#### Page 3 — Power strategy (portfolio level)

**Section 1: rename "Supplier." → "How IVG buys energy."**

This section now covers both electricity AND gas (since Ecotricity supplies both).

**REPLACE the section 1 body with:**

> **Ecotricity supplies every IVG site, for both electricity and gas.** A single commercial relationship covers all landlord electricity meters and all gas meters across the portfolio. Ecotricity also supplies properties that are vacant or between residents — those void periods stay on IVG's commercial contract until a new resident takes over their own supply.
>
> The next procurement window opens **October 2026**.

**Section 2: rename "Three electricity arrangements." → "How electricity reaches each site."**

**REPLACE the section 2 body with:**

> The 11 sites use one of three arrangements, all decided during construction based on the site's age and heating choice:
>
> - **Bulk-metered (microgrid)** — IVG holds one large commercial supply for the whole site, then distributes power through its own private wire network to each home. Residents are sub-billed through Sycous. *Five sites: Austin Heath, Blendworth Hills, Gifford Lea, Millbrook Village, Millfield Green* (plus Sonning Common, out of scope).
> - **Standard residential supply** — each resident has their own meter and their own supplier (the standard arrangement on the UK Distribution Network Operator, or DNO). IVG only meters the small landlord supply for communal areas. *Four sites: Bramshott Place, Durrants Village, Elderswell, Great Alne Park.*
> - **Private cable network with individual residents** — a hybrid: IVG owns the cable network on site (a Body of Network Operator, or BNO arrangement), but each resident has their own meter and their own supplier riding on IVG's infrastructure. *Two sites: Ampfield Meadows, Ledian Gardens.*
>
> The arrangement at each site reflects when it was built and what heating choice was made at construction. Bulk-metered sites tend to be the ones with communal heating systems.

**Section 3: rename "Capacity and procurement." → "Capacity and on-site generation."**

**REPLACE the section 3 body with:**

> Each electricity connection has a maximum capacity it's allowed to draw — set by the network operator and called the **Authorised Supply Capacity (ASC)**. NZA is working through the portfolio to confirm the ASC for every site. So far **3 of 11 sites have a confirmed ASC**; the rest are pending review. Where half-hourly data is available, peak demand and spare headroom against the ASC can also be derived — useful for planning future electrification additions.
>
> **Solar PV** is installed at several sites — most significantly at **Ledian Gardens (430 kWp)** and **Millfield Green** (covering about 50% of demand on-site). At bulk-metered sites, solar reduces grid draw on the landlord supply directly. The billing arrangement for what's exported back to the grid is under review.

---

#### Page 4 — Metering (portfolio level) + rename

**PAGE TITLE RENAME:**
- "Metering & data quality" → **"Metering"** everywhere it appears:
  - Sub-tab nav label
  - Page header / title
  - URL slug if applicable (e.g. `/portfolio/energy/metering-data-quality` → `/portfolio/energy/metering`; keep a redirect from old to new if URL-based routing exists)
  - Breadcrumbs
  - Any documentation references in the codebase

**Section 1: rename "The meter estate." → "How IVG sees its portfolio."**

**REPLACE the section 1 body with:**

> Across the 11 sites, IVG has visibility into its energy use through **three data platforms working together**, each playing a different role. The arrangement is different at each site depending on how it was built — some sites give IVG direct visibility into every home, others give visibility only into the communal areas, with resident usage either sub-metered separately or derived indirectly.
>
> This page shows every meter IVG can see, where the data comes from, and where the honest gaps sit.
>
> The 11 sites split into three metering arrangements (the same split as on the Power strategy page):
>
> - **Bulk-metered sites** — one large commercial meter at the site entrance, then Sycous sub-meters in every apartment. Full visibility, both landlord and resident.
> - **Standard residential sites** — IVG only sees its own landlord meters directly. Resident consumption is *derived* by subtracting landlord usage from the total flowing into the site (sourced from arbnco).
> - **Private cable sites** (Ampfield Meadows, Ledian Gardens) — IVG owns the cable but residents have their own contracts. Visibility sits between the two.

**Section 2: rename "Three platforms." → "The three platforms."**

**REPLACE the section 2 body with:**

> - **Ecotricity** invoices IVG for every landlord electricity meter (MPAN — Meter Point Administration Number) and every gas meter (MPRN — Meter Point Reference Number). This is the authoritative source for what IVG actually pays — directly measured, no estimation.
> - **Sycous** sub-meters individual residents at bulk-metered and private-cable sites. **1,049 sub-meters across 7 of 11 sites** — by volume, the single largest data source on the platform.
> - **arbnco** aggregates portfolio-wide totals and is used to derive resident consumption at standard residential sites by subtraction. arbnco's methodology hasn't been published to NZA.
>
> A fourth platform, **Meterpoint**, piggybacks Sycous meters at some sites for higher-frequency data — not yet integrated.

**Section 3: NEW — replace any existing "Coverage" section with this table.**

Add a new section titled **"Coverage at a glance"** with a small table beneath:

| | Landlord | Resident | How reliable |
|---|---|---|---|
| Bulk-metered (5 sites) | Full (Ecotricity invoiced) | Full (Sycous sub-metered) | Most reliable |
| Private cable (2 sites) | Full | Where Sycous deployed | Mixed |
| Standard residential (4 sites) | Full | **Derived from arbnco** | Plausible, not directly verifiable |

Table styling: minimal — no bordered cells, light row separation, IVG palette token for the header row. Match the table styling used elsewhere in the tool (e.g. the Power strategy site table).

**Section 4: NEW — replace any "high-consumption voids" prose with a callout block.**

Add a new section titled **"Worth flagging: high-consumption voids"** rendered as a callout block (subtle coral left-border, slightly tinted background) with this text:

> Ecotricity classifies 2 electricity meters as vacant but reports **18 MWh of consumption** against them across CY25 — concentrated at Ledian Gardens, Bramshott Place, and Elderswell. Three possible explanations: billing classification error, equipment running in genuinely vacant homes, or estimated readings on an inactive meter. NZA is investigating as part of the ongoing site intelligence review.

**REMOVE the existing "What this means for the rest of the page." section entirely.** Its content is now captured by the coverage table in Section 3, more honestly.

---

Commit `Brief 24.7 Part 1: Energy chapter prose rewrite + Metering rename`.

---

### Part 2 — Walkthrough + close

**2a — Walkthrough at 1920×1080.** Click through all four Energy sub-tabs at portfolio level:
- Consumption → confirm all three section headers and bodies match the new text
- Heating strategy → confirm all three section headers and bodies
- Power strategy → confirm all three section headers and bodies
- Metering → confirm rename in nav, page title, breadcrumbs; confirm all four sections (including the new coverage table and the void callout)

**2b — Walkthrough at 1440×900.** Same sequence, abbreviated. Confirm prose reads at the smaller viewport (line lengths, no horizontal scroll, headers still readable).

**2c — Routing check.** Click directly to the old "Metering & data quality" URL if applicable (`/portfolio/energy/metering-data-quality` or whatever the legacy slug was). Confirm it redirects to the new URL OR the new URL is the only one and old links don't exist.

**2d — Cross-page navigation check.** Click between the four sub-tabs in sequence. Confirm the Brief 24.6 transitions still work (cross-fade between sub-tabs).

**2e — No-regression check.** Site-level Energy chapter prose unchanged. The site-level pages still use whatever prose they had before — those weren't touched by this brief. Screenshot one site-level Energy page to confirm.

**2f — Audit doc populated** with screenshots of all four pages before/after.

**2g — STATUS.md final update. Brief archived. current.md repointed.**

Commit `Brief 24.7 close: Energy prose rewrite complete`.

---

## PASS criteria (close report must evidence each)

1. HEAD SHA + both Parts landed.
2. **Consumption page:** all three sections show new headers + new body text. AFTER screenshot.
3. **Heating strategy page:** all three sections show new headers + new body text. AFTER screenshot.
4. **Power strategy page:** all three sections show new headers + new body text. AFTER screenshot.
5. **Metering page:** title renamed (no longer "& data quality") in nav, header, breadcrumbs, URL. AFTER screenshots of each location.
6. **Metering page:** all four sections present — narrative intro + three platforms + coverage table + void callout. AFTER screenshot.
7. **Coverage table:** rendered with minimal styling, no bordered cells, IVG palette. AFTER screenshot.
8. **Void callout block:** rendered with coral left-border treatment. AFTER screenshot.
9. **Old "What this means for the rest of the page" section:** removed entirely from Metering page. Grep confirms no remaining traces.
10. **"in-scope" usage:** grep the rewritten prose for "in-scope" — should appear at most once per page (in the opening section if at all). Body copy should not repeat "in-scope" framing.
11. **Routing:** if old URL existed, redirect works. If not, only new URL exists. Documented in audit.
12. **1440×900 walkthrough:** all four pages render correctly at smaller viewport.
13. **Brief 24.6 transitions still working:** cross-fade between sub-tabs verified visually.
14. **No-regression on site-level Energy:** site-level prose unchanged. Screenshot.
15. **No-regression on portfolio Map / Water / Waste:** unchanged. Screenshot one.
16. **STATUS.md** entries per Part. Audit doc complete with before/after screenshots.
17. **Brief archived** to `archive/24_7_energy_prose_rewrite_COMPLETED.md`. `current.md` repointed.

---

## One last thing

Two small editorial notes for future writing in the tool:

**Voice.** The voice we're trying to land is "informed colleague explaining the portfolio honestly to a smart non-specialist." Not a consultancy report. Not a marketing page. Direct, confident, plain — but precise where precision matters (the landlord-vs-resident framing, the "derived not measured" callouts, the data-quality flags).

**The "honest gap" pattern.** Where there's something we don't know yet, the framing is consistent: "X is an honest gap — [what we don't have and why]. NZA is [working on it / asking IVG / pending platform integration]." Reads as work-in-progress rather than as us hedging. Use it for Millbrook (no Sycous coverage), Elderswell VC (TBC heating), arbnco methodology (not published), Meterpoint (not integrated), and any future gap that comes up.

Push at close.
