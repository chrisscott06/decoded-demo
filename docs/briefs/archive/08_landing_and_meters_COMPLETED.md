# Brief 8 — Exec-summary landing + Meters map theme

**Author:** Claude Chat (architect)
**Authorised by:** Chris Scott
**Status:** Active. Tight, two-part brief sized for a short pre-demo window. Both parts are additive to the working map shipped in Brief 7.
**Date opened:** 2026-05-22
**Mode:** Plough-through, no checkpoints. Push at the end of each Part so Chris always has the best state. Demo imminent.

---

## Why this brief is small

Brief 7 shipped the Portfolio Map (6 themes) cleanly. Two demo-lifting pieces remain that fit a short window and are LOW RISK because they add to working code rather than restructuring it:

1. **Exec-summary landing** at `/` — the front door. First thing the audience sees. ~30-40 min.
2. **Meters theme** — the meter-anatomy view (void-block composition + instrumentation dots), the most novel thing in the demo. Slots into the map that already exists. ~30 min.

NOT in this brief (→ Brief 9, after the demo): Stark reader fix, Load Inspector. Those are hours of work and won't land pre-demo; "Coming soon" is already shown, so no regression.

**Order: Part 1 (landing) first** — it's the bigger demo win and the lower risk. If only Part 1 lands, the demo still gains its front door. Push after each Part.

---

## Reference

1. **Design note** — https://www.notion.so/367d645e05cc8104b18fd8011d79200a — **D10 (Meters theme)** and **D11 (landing)** are what this implements.
2. **`nzai-demo/src/pages/Home.jsx`** — the cream-register two-column pattern the landing copies.
3. The shipped `eir/src/lib/mapThemes.js` (Brief 7) — Part 2 adds one theme to it.
4. This brief at `docs/briefs/active/08_landing_and_meters.md`

---

## BEFORE DOING ANYTHING

0. Reconciliation (Rule 8): `ls docs/briefs/active/` (empty), `cat docs/briefs/current.md`, `tail -20 STATUS.md`, `git log --oneline -8` (HEAD should be Brief 7 close `10178fe` or later — **if Brief 7 isn't pushed yet, that's fine, you're continuing on the same local main**), `git status --short` clean.

0.5 Land this brief at `docs/briefs/active/08_landing_and_meters.md`, update `current.md`, quote title + this "Why this brief is small" section back to Chris. Commit:
```
Brief 8 land: exec-summary landing + Meters map theme

Two-part pre-demo brief. Additive to Brief 7's working map. Push per Part.
```

1. Read `pipeline/dist/eir/reconciliation.json` and `portfolio.json` to confirm the landing figures (exact values are in Part 1 — verify they match).

2. Read the shipped `eir/src/lib/mapThemes.js`, `Leaderboard.jsx`, `MapMarkers.jsx`, `PortfolioMap.jsx` from Brief 7 — Part 2 extends them.

3. Read `nzai-demo/src/pages/Home.jsx` and the existing `eir/src/components/BodyPageLayout.jsx`.

4. Begin Part 1.

---

## Principles

1. Additive, not restructuring — don't touch the working map except to add the Meters theme.
2. Tokens not raw hex. Falsifiability: `grep -rn "#[0-9a-fA-F]\{3,6\}" eir/src/components/Landing.jsx eir/src/lib/mapThemes.js` → 0.
3. Honest numbers — waste shows "—" (data is null); electricity/gas lead with the billed/landlord figure and note the total-vs-billed gap.
4. Browser-verify each Part via MCP before pushing.
5. Push after each Part.

---

## Part 1 — Exec-summary landing (D11)

**Goal:** `/` renders a cream-register executive summary: narrative left, four utility cards right, CTA to the map. Replaces Brief 6's `/`→map redirect.

**Files:** `eir/src/components/Landing.jsx` (new), `eir/src/App.jsx` (route `/` → `<Landing>`, remove the redirect), `docs/audit/08_landing_and_meters.md` (new).

**Steps:**

1.1 **Free the `/` route.** In App.jsx (Brief 6 added a redirect ~line 1194-1207 sending `/` → `/portfolio/map`). Change so `/` renders `<Landing>`. Keep `/portfolio` and `/portfolio/overview` → `/portfolio/map`.

1.2 **Build `Landing.jsx`** wrapped in `BodyPageLayout` (cream register, `activePrimary="portfolio"`, `activeSecondary={null}`). Two-column grid `gridTemplateColumns: 'minmax(360px, 520px) 1fr'`, gap 64px, max-width container, vertically centred — mirror `nzai-demo/src/pages/Home.jsx` structure exactly.

1.3 **Left column — narrative (verbatim):**
- Eyebrow: `PORTFOLIO OVERVIEW · CY2025` — coral, `--font-heading`, `--text-subheading`, uppercase, letter-spacing widest, mb-4
- Heading: `A single view of energy, water and waste across the IVG portfolio.` — `--font-heading`, `--text-chapter`, `--color-theme-base`, mb-6
- Paragraph 1 (`--font-body`, `--text-body`, `--color-theme-base` 70%, mb-3): `This tool brings together the utility data IVG holds across its retirement-living estate — electricity, gas, water and waste — into one operational picture. It shows what is known today, where the gaps are, and how the dataset improves as billing, sub-metering and contractor records are consolidated.`
- Paragraph 2 (same style, mb-8): `The figures opposite summarise the portfolio as it currently stands. Each links through to site-level detail, half-hourly profiles and the underlying meter inventory. The picture will sharpen over time; for now it establishes the baseline and shows where attention is needed most.`
- CTA button (coral bg `--color-nza-coral`, cream text, `--font-heading` medium, px-4 py-3 rounded-lg, hover darken): `Explore the portfolio map →` → navigate `/portfolio/map`

1.4 **Right column — four utility cards (2×2 grid, gap 20px).** Each card: panel bg (cream-register subtle, `rgba(26,36,64,0.03)`), border `rgba(26,36,64,0.10)`, rounded-xl, p-6. Contents: lucide icon (coral, 32px) top; big number (`--font-heading`, `--text-h1`, `--color-theme-base`); unit inline (`--text-base`, muted); label (`--text-sm`, uppercase, muted, letter-spacing); nugget (`--text-sm`, `--color-theme-base` 60%, mt-2).

**Verified figures (from reconciliation.json + portfolio.json — confirm in step 1):**

- **Electricity** — `Zap`. **4.5M kWh**. Label: "LANDLORD · UTILITY METERS". Nugget: "Total estate use ~8.3M kWh — the ~3.9M gap is resident energy not billed to IVG." *(eco_landlord_elec_kwh 4,509,907; arb_elec_kwh 8,309,121; derived_resident_elec_kwh 3,889,276)*
- **Gas** — `Flame`. **7.6M kWh**. Label: "BILLED · BULK METERS". Nugget: "Total estate ~9.4M kWh; communal heating across the gas-served sites." *(eco_gas_kwh 7,635,743; arb_gas_kwh 9,353,853)*
- **Water** — `Droplets`. **17.9k m³**. Label: "WHERE METERED". Nugget: "Confirmed at 3 sites, partial at 4, outstanding at 6." *(water.total_consumption_m3 17,859)*
- **Waste** — `Recycle`. **—**. Label: "CONTRACTOR RECORDS". Nugget: "BIFFA and Ash tonnages being consolidated; figures to follow." **Do NOT invent a tonnage — portfolio waste.total_tonnage is null.**

1.5 **Strap below cards** (`--text-sm`, muted, centred): `13 sites · 217,314 m² GIA · 961 units · CY2025`.

**PASS:**
- `/` shows the cream exec-summary, narrative left, 4 cards right
- Figures match real data; waste = "—"; electricity + gas nuggets tell the billed-vs-total story
- CTA → `/portfolio/map`
- No raw hex; no console errors; renders at 1440×900 without scroll
- Browser-verified via MCP

1.6 **PUSH.** `git push origin main`. STATUS.md: "Part 1 landing complete + pushed".

**Commit:**
```
Brief 8 Part 1: exec-summary landing (D11)

Cream-register front door at /. Narrative left, four utility cards right
(real figures: 4.5M kWh landlord elec, 7.6M kWh billed gas, 17.9k m³ water,
waste "—" pending tonnage), CTA to the map. Reverses Brief 6's /→map
redirect. Honest billed-vs-total framing in the elec + gas nuggets.
```

---

## Part 2 — Meters map theme (D10)

**Goal:** Add the seventh theme, Meters, to the shipped map. Stacked composition (HH/Monthly/Gas/Void), plus total/landlord counts and HH-coverage %, with the special dot encoding (size by meter count, colour by coverage).

**Files:** `eir/src/lib/mapThemes.js` (add theme), `eir/src/components/portfolio/MapMarkers.jsx` (dot-encoding branch), possibly `Leaderboard.jsx` (confirm stacked + gridBar goodHigh supported — Brief 7 built these), `App.jsx`/`PortfolioMap.jsx` (ensure `mpan_register.json` is loaded and passed to accessors), audit doc.

**Steps:**

2.1 **Confirm the accessor signature.** Brief 7's themes use `(site, energy, water, waste, carbon)` — the Meters theme needs `mpanRegister` too. Check how PortfolioMap loads data and how accessors are called. If the signature is only 5 args, extend the call site to pass `mpan_register.json` as a 6th arg, and load that JSON at mount. Other themes ignore it.

2.2 **Add the Meters theme to `MAP_CATEGORIES`** (after Carbon, before Data quality):
```js
{
  id: 'meters', label: 'Meters', color: 'var(--color-theme-accent-secondary)', toggles: [],
  metrics: [
    { key:'composition', label:'Composition',
      desc:'Meter mix per site: half-hourly, monthly, gas, void/inactive',
      // Each meter into ONE segment by precedence: Gas → Void → HH → NHH (no double-count).
      accessor:(s,e,w,wa,c,reg)=>{
        const meters=reg[s.id]||[]; let hh=0,nhh=0,gas=0,dead=0;
        for(const m of meters){
          const cat=String(m.category||'').toLowerCase();
          if(cat.includes('void')||cat.includes('inactive')) dead++;
          else if(m.type==='Gas') gas++;
          else if(m.type==='HH') hh++;
          else nhh++;
        }
        return [
          {label:'Half-hourly',value:hh,  color:'var(--color-nza-coral)'},
          {label:'Monthly',    value:nhh, color:'var(--color-theme-accent-primary)'},
          {label:'Gas',        value:gas, color:'var(--color-categorical-commuting)'},
          {label:'Void',       value:dead,color:'rgba(255,255,255,0.18)'},
        ];
      },
      format:(segs)=>segs.reduce((t,x)=>t+x.value,0).toString(), unit:'meters', render:'stacked' },
    { key:'total_utility', label:'Total utility', desc:'All utility meters (MPANs + MPRNs)',
      accessor:(s,e,w,wa,c,reg)=>(reg[s.id]||[]).length, format:v=>v.toString(), unit:'meters', render:'bar' },
    { key:'landlord_meters', label:'Landlord meters', desc:'Landlord-category meters',
      accessor:(s,e,w,wa,c,reg)=>(reg[s.id]||[]).filter(m=>String(m.category||'').toLowerCase().includes('landlord')).length,
      format:v=>v.toString(), unit:'meters', render:'bar' },
    { key:'hh_coverage', label:'HH coverage', desc:'Share of landlord meters with half-hourly data',
      accessor:(s,e,w,wa,c,reg)=>{ const ms=(reg[s.id]||[]).filter(m=>String(m.category||'').toLowerCase().includes('landlord')); if(!ms.length)return 0; return ms.filter(m=>m.type==='HH').length/ms.length*100; },
      format:v=>`${v.toFixed(0)}%`, unit:'', render:'gridBar', goodHigh:true },
  ],
},
```

2.3 **Leaderboard support check.** Brief 7 built `stacked` (Carbon by-scope used it) and `gridBar`. Confirm:
- `stacked` reads the accessor's returned array of `{label,value,color}` and draws proportional segments — should already work from Carbon.
- `gridBar` honours a `goodHigh` flag (high = green). If Brief 7 didn't implement `goodHigh`, add it: when `goodHigh`, invert the ramp so high values are green (`--color-risk-low`), low are red (`--color-risk-major`).

2.4 **MapMarkers dot-encoding branch (D10).** When `activeCategoryId === 'meters'`: dot **size** by total meter count (`reg[siteId].length`), dot **colour** by HH-coverage % on a green→red ramp (green = high coverage). For all other themes, keep Brief 7's default (size by active metric, colour by theme). Add this as a clean conditional; document it.

2.5 **Verify the data renders the story.** Confirmed counts: Ledian 69 meters (1 HH / 64 NHH / 4 gas / 54 void) → long bar, mostly Monthly+Void, big red dot. Millfield Green 1 (1 HH) → tiny all-coral bar, small green dot. Elderswell 52 (44 void). Bramshott 49 (25 void). Austin Heath 3 (1 HH + 2 gas).

**PASS:**
- Map shows 7 theme pills incl. Meters
- Meters → Composition: stacked bars, Ledian dominated by Monthly+Void, Millfield a clean coral sliver
- Meters → HH coverage: gridBar green (high) → red (low)
- Map dots in Meters theme: sized by count, coloured by coverage (Ledian big+red, Millfield small+green)
- Other 6 themes unchanged
- No raw hex; build clean; browser-verified via MCP

2.6 **PUSH.** STATUS.md: "Part 2 Meters theme complete + pushed". Archive brief → `archive/08_landing_and_meters_COMPLETED.md`; repoint current.md (next = Brief 9: Stark reader fix + Load Inspector).

**Commit:**
```
Brief 8 Part 2: Meters map theme (D10) — meter-anatomy view

Seventh theme added to the map. Composition (stacked: HH/Monthly/Gas/Void,
precedence-resolved, no double-count), Total utility, Landlord meters,
HH coverage % (gridBar, goodHigh). Map dots in this theme size by meter
count, colour by HH coverage (green=high). Surfaces instrumentation
maturity across the estate — Ledian's void wall vs Millfield's clean
single meter. mpan_register.json wired through accessors.

Brief 8 closed. Next: Brief 9 — Stark reader fix + Load Inspector.
```

---

## What MUST NOT happen
- No touching the Stark reader or Load Inspector (Brief 9)
- No restructuring the working map — Meters is additive
- No `npm install` from Claude Code
- No fake waste tonnage
- No inventing the electricity/gas figures — use the reconciliation.json values
- No holding both parts for one push — push after Part 1 and Part 2

## When to escalate (log + stop)
- Design note or a needed JSON missing
- Brief 7's Leaderboard doesn't actually support `stacked` (then Meters Composition can't render — log it, ship the other 3 Meters sub-metrics, note Composition pending)
- Build fails at a push point
- PASS unmet after 15 min + 3 approaches

## Final report
1. HEAD SHA + both parts landed?
2. Landing: live, figures correct, waste "—", CTA works?
3. Meters theme: 7 pills, composition stacked, coverage dots green→red?
4. Pushes after Part 1 + Part 2?
5. grep raw-hex = 0? build clean?
6. Brief archived, current.md → Brief 9?
7. Known issues (HH reader still pending for Brief 9)?
8. Standing by for Chris.

## Notes for Claude Code
Two small additive parts on top of Brief 7's working map. Part 1 (landing) first — bigger win, lower risk. Push after each. If the clock runs out mid-Part-2, ship whatever Meters sub-metrics work and note the rest. Confirm receipt (title + "Why this brief is small"), then begin Part 1.

Standing by for authorisation.
