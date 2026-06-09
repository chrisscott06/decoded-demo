# Phase 1B+ — Quick wins (independent of EOC map extraction)

**Status:** Three small fixes Claude Code can action immediately while the EOC map handoff is being extracted. Self-contained. Should take 60-90 minutes total.

**Demo context:** Same — IVG demo tomorrow (22 May). Phase 1B shipped 18 of 19 chunks tonight. This brief addresses three specific gaps surfaced during Chris's review.

---

## Fix 1 — Rename "MPANs" tab to "Meters" and broaden content

**Scope:** Site Detail > MPANs sub-tab becomes Site Detail > Meters. The tab now shows ALL meters at the site: MPANs (electricity), MPRNs (gas), water meters.

**Steps:**

1. **Rename the sub-tab label** from "MPANs" to "Meters" in the sub-nav config for Site Detail.
2. **Rename the route** from `/site/{id}/mpans` to `/site/{id}/meters`. Add a 301-style redirect (or React route alias) from the old path so links don't break.
3. **Restructure the tab content** into 3 sections:

   **Section A — Electricity (MPANs)** (existing content, no changes)
   - All/Landlord/Voids/Inactive filter pills
   - Table: MPAN | Type | Category | CY25 kWh | Months
   - Reads from `mpan_register.json`

   **Section B — Gas (MPRNs)** (new)
   - Smaller filter pill row: All / Landlord (default to Landlord)
   - Table: MPRN | Category | CY25 kWh | Months
   - Reads from `mpan_register.json` filtered to gas type
   - If no gas at the site (most all-electric sites), show empty state: "No gas supply at this site"

   **Section C — Water (Meters)** (new)
   - Read from `water.json` for the site
   - Header line: "{meters_known} meters identified, {meters_with_cy2025_data} with CY2025 data"
   - Single info row showing:
     - Water company: `{water_company}`
     - Retailer: `{retailer}`
     - CY2025 consumption: `{consumption_m3} m³` (or "—" if null)
     - Data quality: `{data_quality}`
     - Coverage period: `{cy2025_coverage}`
     - Completeness: `{completeness}`
   - "Key gaps" callout below: text from `key_gaps` field, styled as a "Why this matters" callout (coral left border)
   - If `meters_known == 0`: show "Meter inventory pending" empty state

**PASS criteria:**
- Sub-nav shows "Meters" not "MPANs"
- Old `/site/{id}/mpans` URL still works (redirect or alias)
- For Austin Heath: shows 1 electricity MPAN + 2 gas MPRNs + 3 water meters with rich "Never billed since 2016" narrative
- For Millfield Green: 1 electricity MPAN + 0 gas (empty state) + water info
- For Sonning Common: empty/sparse data handled gracefully

**Commit:** `fix(meters): rename MPANs to Meters, add gas + water sections`

---

## Fix 2 — Comparisons chart Y-axis cut off

**Scope:** Portfolio > Comparisons sub-tab. The monthly consumption comparison chart at the bottom has the X-axis labels off-screen and Y-axis spacing wrong.

**Symptom (verified in browser):** Chart Y-axis labels show 200k, 400k, 600k, 800k spread vertically with massive spacing — but the chart's bottom (X-axis with month labels) is outside the visible viewport. Chart container is too tall, or the chart inside isn't constrained to its container.

**Root cause likely:** Recharts `ResponsiveContainer` is being given a fixed height that exceeds available viewport space, OR the Y-axis domain is set too wide (showing 200k–800k when actual max is ~700k), OR the chart's `<Bar>` is using auto-scaling that produces excessive Y-axis range.

**Fix steps:**

1. **Open Comparisons component**, find the ResponsiveContainer for the monthly consumption chart.
2. **Constrain height**: set the panel containing this chart to use a `flex: 1` and `min-height: 0` so it doesn't push beyond the panel. ResponsiveContainer should use `width="100%" height="100%"`.
3. **Check Y-axis domain**: explicitly set `domain={[0, 'dataMax']}` instead of letting Recharts pick. This forces axis to actual data range.
4. **Reduce Y-axis tick count**: add `tickCount={5}` to the YAxis component to prevent excessive ticks.
5. **Verify X-axis labels render**: month labels "Oct 24", "Nov 24" etc. should be visible at the bottom.
6. **Open in actual browser at 1440×900 to confirm fix.** Take a screenshot if helpful. Phase 1B builds didn't include browser-side verification — that's the root cause we missed this in chunk 19.

**Specific Recharts pattern to use:**
```jsx
<div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={monthlyData} margin={{top: 20, right: 30, left: 20, bottom: 40}}>
      <XAxis 
        dataKey="month" 
        tick={{fill: 'var(--text-muted-on-dark)', fontSize: 12}}
        angle={-45}
        textAnchor="end"
        height={60}
      />
      <YAxis 
        tick={{fill: 'var(--text-muted-on-dark)', fontSize: 12}}
        tickCount={5}
        domain={[0, 'dataMax']}
        tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
      />
      <Tooltip />
      {selectedSites.map(siteId => (
        <Bar key={siteId} dataKey={siteId} fill={getSiteColor(siteId)} />
      ))}
    </BarChart>
  </ResponsiveContainer>
</div>
```

**PASS criteria:**
- Chart fully visible at 1440×900 viewport — both Y-axis labels AND X-axis month labels on screen
- Y-axis shows reasonable values (e.g. 0, 200k, 400k, 600k — not stretched to 1M when max is 700k)
- X-axis month labels readable at angle
- **Verified in browser** by opening localhost and looking, not just inferring from code

**Commit:** `fix(comparisons): correct Y-axis spacing and ensure X-axis labels visible`

---

## Fix 3 — Wire up rich water + waste data on Site Detail Overview tab

**Scope:** The 4 metric tiles on Site Detail > Overview currently show basic values (524k kWh / 0 kWh / 5k m³ / —). The water + waste tiles should show much richer data when clicked.

**Phase 1B status:** Water + waste tiles work (chunk 4 fixed the field mapping bug). Numbers display. But the rich underlying data (BIFFA waste streams, water completeness narrative, etc.) is not surfaced on the Overview tab.

**Decision:** Don't expand the Overview tiles themselves — they should stay compact summary tiles. Instead, **the rich data lives on the Meters tab** (Fix 1 above for water; Fix 1 already covered gas).

**But add to Site Detail > Overview**: a small "data quality narrative" strip below the 4 tiles, summarising key findings:

```
Below the 2x2 metric tiles, full-width strip:

DATA QUALITY OVERVIEW
• Electricity: {n} MPAN(s), {months_covered} months CY2025, Ecotricity billing
• Gas: {n} MPRN(s) or "No gas on site"
• Water: {meters_known} meters, {data_quality_label} ({completeness})
• Waste: {contractor}, {data_status_label}, {tonnage_total or "tonnages not tracked"} t
```

Each line is small (Inter 13px), grey text on the dark bg, with a coloured dot at the start matching the status (green/amber/red/grey).

**For waste specifically — Site Detail > Carbon tab (if expanding scope):**

The Carbon tab currently shows Scope 1/2/3 from electricity + gas only. Worth flagging that **waste emissions (Scope 3 Cat 5)** exist in `waste.json` as `emissions_scope3_cat5_tco2e` but are currently null for all sites pending BIFFA tonnage data.

For now: add a small line under the Carbon pie: "Scope 3 Cat 5 (waste): Pending BIFFA tonnage CY2025"

**PASS criteria:**
- Site Detail > Overview shows the 4-line data quality narrative below the 2x2 tiles
- Coloured dots match status
- For Austin Heath: shows "Water: 3 meters, None (0%)" and "Waste: BIFFA, missing"
- For Gifford Lea: shows richer water + waste info reflecting the partial data

**Commit:** `feat(site-overview): add data quality narrative strip below metric tiles`

---

## After these 3 fixes

The site is meaningfully better but the map is still naff and the landing infographic is still oversized. Both depend on the EOC extraction landing.

**When EOC handoff arrives:** Chris and Claude Chat will plan the bigger Phase 1C brief covering:
- Map module port (the big visual upgrade)
- Landing infographic resize + text-on-left treatment
- Landing infographic functional drill-down refinements
- Anything else the EOC handoff surfaces as porting opportunity

**Approximate time for these 3 fixes:**
- Fix 1 (Meters tab): 45 minutes
- Fix 2 (Comparisons): 15-20 minutes
- Fix 3 (data quality strip): 20 minutes

Total: ~80 minutes if going clean.

---

## Voice / style reminder

Per CLAUDE.md and previous briefs:
- Measured, professional, slightly understated
- No first-person
- No emojis in body copy
- Sentence case headings
- Em-dashes for parentheticals
- Empty states are honest ("Pending CY2025 data" not "0" or blank)

---

End of quick wins brief.
