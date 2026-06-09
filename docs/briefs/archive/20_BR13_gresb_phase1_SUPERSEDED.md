# Brief 13 — GRESB Visualisation Module (Phases 1–3)

**Status:** Phase 1 executable  ·  Phases 2–3 outlined for trajectory only
**Repo:** `chrisscott06/ivg-esg-tool`
**Branch convention:** `feat/brief-13-gresb-phase-1`
**Tracker baseline:** P09 GRESB Submission Tracker
**Submission deadline driving urgency:** 1 July 2026

---

## Context

The IVG ESG Tool is becoming the central source of truth for IVG. Today the GRESB picture lives in slide decks and the SH-2000 submission tracker — neither of which IVG actually engages with. They've delegated the work to NZA and expect the answer to come via the tool. This brief brings GRESB into the tool as a first-class section, designed for IVG's reading rhythm (glance + drill), not GRESB's auditor rhythm (every credit, every evidence trail).

The aim across three phases is a self-updating GRESB page that IVG can use as their single source of truth for the submission — and that NZA uses as the operational delivery surface. By next year's submission this should be the place we point IVG to, full stop. No back-and-forth slides.

---

## The three-phase vision

| Phase | Purpose | Scope | Status |
|---|---|---|---|
| **Phase 1** | Visualisation layer | Static page reading from a JSON snapshot of P09. Shows headline forecast, aspect cards, per-credit detail, critical dependencies, forward-planning panel. **Read-only.** | Execute this brief |
| **Phase 2** | Live data wiring | JSON regenerated from the live SH-2000 tracker (Python pipeline). Score/status updates as Cowork updates rows. | Future brief (Brief 14) |
| **Phase 3** | Interactive IVG-facing layer | Action queue (tick boxes), evidence vault with expiry tracking, document linking, completion state. Becomes IVG's daily workspace for the submission. | Future brief (Brief 15) |

Phase 1 establishes the architecture (route, component tree, data shape, styling). Phases 2–3 plug in without restructuring.

---

## Phase 1 spec — what we're building NOW

### Route structure

```
/gresb                          → top-level GRESB page (the home)
/gresb/aspect/:code             → per-aspect detail page (e.g. /gresb/aspect/SE)
/gresb/dependency/:code         → per-dependency detail page (e.g. /gresb/dependency/CD1)
```

Add a new top-level nav entry "GRESB" alongside Portfolio in the existing app header.

### Page 1 — `/gresb` (the home page)

Six elements stacked vertically. Single-view spirit per Hard Rule 9 (target: viewable without scroll on a 1440×900 desktop; mobile is naturally scrollable). The page itself can scroll if needed — Hard Rule 9 is the design north star not an absolute on this page (justified: the page is intentionally a digest of a large dataset).

**Element 1 — Header strip**
- Page title: "GRESB 2026" with subtitle "Inspired Villages Group · submission due 1 July 2026"
- Right side: small "last updated" timestamp from the JSON `meta.lastUpdated`

**Element 2 — Headline forecast cards (3 cards in a row)**
- Card A: "2025 Score" — big number `52` with 1 star icon next to it, small label "1-star"
- Card B: "2026 Forecast" — range `45 – 79` with subtitle "Floor – Ceiling"
- Card C: "Target" — `62` with 2 star icons, small label "2-star"

**Element 3 — Score range visualisation (full width, ~120px tall)**
A horizontal bar showing the 0–100 GRESB score range, segmented at the star thresholds (30, 50, 60, 75, 90). Each segment gradient-coloured from amber (low) → teal (high). Overlaid markers:
- A vertical line + dot at `52` labelled "2025"
- A translucent shaded band from `45` to `79` labelled "2026 forecast range"
- A flag/marker at `62` labelled "Target 2-star"
- Star thresholds labelled below the bar: "1★ 30  ·  2★ 50  ·  3★ 60  ·  4★ 75  ·  5★ 90"

**Element 4 — Critical Dependencies row (4 cards in a row, on warning amber background)**
Each card shows:
- Dependency code badge (CD1, CD2, etc.)
- Short title
- "Affects:" line
- Status pill (default "Outstanding")
- Owner avatar/text

Click → navigates to `/gresb/dependency/:code`

**Element 5 — Aspect cards grid (15 cards, 3-column responsive grid)**
Cards grouped visually by component band:
- Management band (5 cards): LE, PO, RP, RM, SE — teal accent
- Performance band (9 cards): RA, T, TC, EN, GH, WT, WS, BC, MR — blue accent
- Residential band (1 card): RES — green accent

Each card:
- Aspect code badge in top-left
- Aspect name in plain English (the `ivgName` from JSON, not GRESB-speak)
- Mini progress bar: 2025 → Floor → Ceiling vs aspect Max
- Three small numbers underneath: `2025: 6.83` · `Floor: 3.75` · `Ceiling: 5.00`
- Confidence indicator (small H/M/L pill, colour-coded)
- Click → navigates to `/gresb/aspect/:code`

**Element 6 — Forward planning panel (2 columns)**
Left column: "Locked in for 2027" — list of things being delivered this cycle that benefit 2027 too
Right column: "On the to-do list for 2027" — list of deliberately deferred items
Both items have a short note explaining why.

Optional small footer: "Expected 2027 forecast: TBD — refresh after submission"

### Page 2 — `/gresb/aspect/:code` (aspect detail)

A drill-down for one aspect. Structure:

- Breadcrumb: `← GRESB · Leadership`
- Header card: aspect code badge, aspect name, summary statement, big numbers (2025, Floor, Ceiling, Max)
- "The play here" callout — a 2-3 sentence strategic summary pulled from the JSON `aspects[i].playHere`
- Indicator list — one expandable row per indicator. Collapsed shows: indicator badge, IVG-speak title, status icon (✓/⚠/✗/—), forecast range `0.75 → 1.00`, confidence pill. Expanded shows:
  - **What's needed:** 2-3 bullets in plain English (`needed` field)
  - **What you have:** list of evidence items (`youHave` field, just text in Phase 1; will link in Phase 3)
  - **The gap:** what's still missing (`gap` field)
  - **Next year:** forward note (`nextYear` field)
  - GRESB-speak appendix collapsed by default: "Show GRESB technical detail" → reveals indicator code, full GRESB description, evidence type, prefill eligibility

Retired indicators (LE3, SE2.2) rendered greyed out with strike-through and a small "Retired 2026" badge.

Parked indicators (RM6.2, RM6.4) rendered with an amber "Parked → 2027" badge.

### Page 3 — `/gresb/dependency/:code` (dependency detail)

A focused page for each critical dependency. Structure:

- Breadcrumb: `← GRESB · CD1 Residential Component status`
- Header: dependency code, title, "Critical Dependency" red badge
- "What this is" — plain English explanation
- "Why it matters" — affected indicators with their forecast impact
- "Resolution" — what needs doing, by whom, by when
- Status pill, owner, links

---

## Phase 1 tasks (executable)

### Task 1: Add `/gresb` route and JSON data layer

1.1 Create `src/data/gresb.json` populated from P09. (Spec for the JSON shape is in **Appendix A** below.)

1.2 Add the new route to `src/App.jsx` (or wherever the router lives) — three new routes: `/gresb`, `/gresb/aspect/:code`, `/gresb/dependency/:code`.

1.3 Add a "GRESB" entry to the top-level nav, after "Portfolio" / before any future entries.

**PASS:** Visiting `/gresb` renders a placeholder page with the page title "GRESB 2026" and reads metadata from the JSON. Navigating to `/gresb/aspect/LE` renders a placeholder aspect page. No console errors.

### Task 2: Component library — atomic pieces

Create a small set of reusable components in `src/components/gresb/`. These should match the visual style guide (Appendix B):

- `<IndicatorBadge code="LE2" />` — pill with monospace text, teal background
- `<AspectBadge code="LE" variant="management|performance|residential" />`
- `<StatusPill status="In place|At risk|Missing|Not applicable" />` — coloured pill
- `<ConfidencePill level="H|M|L" />` — coloured pill
- `<StarRating count={2} />` — renders n filled stars + (5-n) empty stars
- `<ScoreRangeBar score2025={52} floor={45} ceiling={79} target={62} />` — the main visualisation
- `<ProgressMiniBar value={3.75} ceiling={5.00} max={5} score2025={6.83} />` — for aspect cards
- `<EvidenceItem name="..." validUntil="2026-12-31" url={null} />` — read-only in Phase 1, will be clickable in Phase 3
- `<RetiredBadge />`, `<ParkedBadge />`

**PASS:** Each component renders in isolation (could be tested in a Storybook-style scratch page or just inspected directly). Visual style matches Appendix B.

### Task 3: Build the `/gresb` home page

Compose the six elements above using the atomic components. Read all data from `src/data/gresb.json`.

3.1 Header strip
3.2 Headline forecast cards (3 cards)
3.3 ScoreRangeBar with overlays
3.4 Critical Dependencies row (4 cards)
3.5 Aspect cards grid (15 cards in 3 columns, with the 3 bands visually distinguished)
3.6 Forward planning panel (2 columns)

**PASS:** Page renders cleanly at 1440×900 (no horizontal scroll, content reads top to bottom in the order above). Cards are clickable and route correctly. Visual style matches Appendix B. **Browser walkthrough completed per Process Rule 10** — green build is not sufficient evidence.

### Task 4: Build the `/gresb/aspect/:code` detail page

Render the aspect detail layout for each of the 15 aspects, driven by the JSON. Indicator rows expand/collapse on click. Retired and Parked indicators visually distinct.

**PASS:** Each aspect URL renders correctly. Click into LE → see 6 indicators (LE1-LE6) with LE3 marked Retired. Click into RM → see 12 indicators including RM6.2 / RM6.4 marked Parked. Browser walkthrough completed.

### Task 5: Build the `/gresb/dependency/:code` detail page

Render each of CD1–CD4 as a focused dependency page using the JSON `criticalDependencies` array.

**PASS:** Each dependency URL renders. Browser walkthrough completed.

### Task 6: Mobile responsiveness

The grid layouts should collapse cleanly on narrow viewports (< 768px). The ScoreRangeBar stays full-width. Aspect cards stack to single column on mobile. Critical Dependencies row stacks. Forward planning columns stack.

**PASS:** Render at 375px width — all content visible without horizontal scroll, all components legible. Browser walkthrough on mobile completed.

### Task 7: README update

Add a short section to the project README explaining the GRESB page: what it is, where the data lives, who updates it (currently manual via JSON; Phase 2 will automate).

**PASS:** README updated with a brief GRESB section pointing to `src/data/gresb.json` as the source of truth.

---

## Brief close criteria (Phase 1)

- All 7 tasks PASS
- Deployed to Vercel preview
- URL of preview shared back to Chris
- Chris verifies in browser per Process Rule 10 — walkthrough each of the 15 aspects, all 4 dependencies, and the home page at desktop + mobile widths
- No console errors anywhere

---

## Appendix A — Data layer specification (`src/data/gresb.json`)

```json
{
  "meta": {
    "version": "P09",
    "lastUpdated": "2026-06-04",
    "submissionDeadline": "2026-07-01",
    "entityName": "Inspired Villages Group",
    "trackerSource": "26003-NZA-IVG-XX-SH-2000_P09"
  },

  "headline": {
    "score2025": 52,
    "star2025": 1,
    "floor2026": 45,
    "ceiling2026": 79,
    "target2026": 62,
    "targetStar": 2
  },

  "starBands": [
    { "name": "1-star", "threshold": 30 },
    { "name": "2-star", "threshold": 50 },
    { "name": "3-star", "threshold": 60 },
    { "name": "4-star", "threshold": 75 },
    { "name": "5-star", "threshold": 90 }
  ],

  "criticalDependencies": [
    {
      "id": "CD1",
      "title": "Residential Component status",
      "shortTitle": "Are we Residential?",
      "question": "Confirm Residential Component participation in the GRESB portal (≥75% GAV residential — IVG is at 100% retirement living so should qualify automatically, but needs to be flagged in portal setup).",
      "affects": "TC + BC + RES scoring (~+5pt automatic uplift opportunity)",
      "affectedIndicators": ["TC3", "TC4", "TC5.1", "TC5.2", "TC6.1", "TC6.2", "BC1.1", "BC1.2", "RES6"],
      "status": "Outstanding",
      "owner": "Chris (portal access)",
      "actionRequired": "Self-serve portal check"
    },
    {
      "id": "CD2",
      "title": "Resident apartment tenure & operational control",
      "shortTitle": "Who controls resident apartments?",
      "question": "Do residents own a long lease or rent? Who controls operating/environmental policy in resident apartments? Drives the GHG boundary, Scope 1&2 split, and EN1/BC2 floor-area coverage simultaneously.",
      "affects": "EN1, GH1, WT1, BC2 boundary (~5pt swing)",
      "affectedIndicators": ["EN1", "GH1", "WT1", "BC2"],
      "status": "Outstanding",
      "owner": "NZA → Rob/Jez",
      "actionRequired": "Short question to IVG operations"
    },
    {
      "id": "CD3",
      "title": "T1.2 Net Zero target base year",
      "shortTitle": "Target base year?",
      "question": "Old L&G/SBTi target had 2021 baseline. Should new IVG/NWPF target retain 2021 or rebase to 2025? Choice affects ambition curve and any future SBTi validation path.",
      "affects": "T1.2 target (~2pt) + future-cycle reporting baselines",
      "affectedIndicators": ["T1.2"],
      "status": "Outstanding",
      "owner": "NZA + NWPF",
      "actionRequired": "Decision after NZA scopes options"
    },
    {
      "id": "CD4",
      "title": "Arbnco data nature",
      "shortTitle": "Is Arbnco resident data actual?",
      "question": "GRESB prohibits apportioned/aggregate estimates above thresholds. If Arbnco resident-data is apportioned (not per-meter actual), IVG's strong coverage position is in jeopardy.",
      "affects": "EN1, GH1 coverage integrity (~5pt swing)",
      "affectedIndicators": ["EN1", "GH1"],
      "status": "Outstanding",
      "owner": "NZA → Stephen Preece (arbnco)",
      "actionRequired": "Technical confirmation from supplier"
    }
  ],

  "aspects": [
    {
      "code": "LE",
      "name": "Leadership",
      "ivgName": "ESG Leadership & Governance",
      "component": "Management",
      "summary": "How IVG's leadership owns ESG outcomes — who's responsible, what they're accountable for, how it's structured.",
      "playHere": "Mostly holds via prefill — verify it carries post-NWPF. LE6 is the only meaningful gap (financial consequences for ESG metrics covering all personnel groups). LE3 retired for 2026 — guaranteed −2pt structural drop.",
      "score2025": 6.83,
      "floor2026": 3.75,
      "ceiling2026": 5.00,
      "max2026": 5,
      "indicators": [
        {
          "code": "LE1",
          "ivgName": "ESG leadership commitments",
          "scoring": "not-scored",
          "score2025": null,
          "floor2026": 0,
          "ceiling2026": 0,
          "max2026": 0,
          "confidence": "N/A",
          "owner": "—",
          "needed": ["Narrative statement of ESG commitments at entity level"],
          "youHave": [],
          "gap": "Reporting-only indicator — no score implications.",
          "nextYear": "Same — non-scored",
          "evidence": [],
          "gresbDetail": { "type": "narrative", "prefillEligible": false }
        }
        /* ...LE2 through LE6 to be populated from P09... */
      ]
    }
    /* ...all 15 aspects populated similarly... */
  ],

  "forwardPlanning": {
    "lockedInFor2027": [
      {
        "title": "Self-certified EMS document (RM1)",
        "note": "Once delivered for 2026, defends ~1.25pt every cycle until ISO 14001 path opens."
      },
      {
        "title": "Portfolio Climate Risk Assessment (RM6.1/6.3 + RM5)",
        "note": "Foundation for the parked RM6.2/6.4 financial-impact pair to layer on in 2027."
      },
      {
        "title": "Policy library reconciliation",
        "note": "Anna's policy mapping work creates the audit-grade library for future cycles."
      },
      {
        "title": "Net Zero target (T1.2) under IVG/NWPF ownership",
        "note": "Once set, defends 2pts and unlocks SBTi validation path."
      }
    ],
    "todoFor2027": [
      {
        "title": "RM6.2 + RM6.4 — climate risk financial impact assessment",
        "note": "Specialist TCFD-style modelling. 2pts available. Park to 2027 with climate data provider."
      },
      {
        "title": "BREEAM In-Use on flagship asset",
        "note": "BC1.2 future-cycle path. Indicative quote requested from Sam for Millfield Green."
      },
      {
        "title": "ISAE 3000 assurance (MR1-MR4)",
        "note": "5.5pt available once paid assurance commissioned. Deferred this cycle by design — groundwork being laid."
      },
      {
        "title": "Embodied carbon strategy (RM4.2, future scoring)",
        "note": "Unscored in 2026 but signalled to score in future. Get methodology in place ahead of curve."
      }
    ]
  }
}
```

**Population workflow for Phase 1:**
Chris (or main chat) generates the full JSON from P09 once. Saved into the repo as static asset. Phase 2 will replace this manual population with an automated pipeline (Python script reads SH-2000 .xlsx and emits gresb.json on each tracker save).

---

## Appendix B — Visual style guide

The look-and-feel should evoke the GRESB digital guide (gitbook): clean, minimal, card-based, generous whitespace, teal accents, professional. Without using any GRESB brand assets (logos protected) — we match the aesthetic, not the IP.

### Colour palette

```css
/* Primary (GRESB-inspired teal) */
--gresb-teal-50:  #F0FDFA;
--gresb-teal-100: #CCFBF1;
--gresb-teal-500: #14B8A6;   /* primary accent — buttons, badges, links */
--gresb-teal-700: #0F766E;   /* dark teal — headers, indicator badges */
--gresb-teal-900: #134E4A;   /* deepest teal — page titles, dark text-on-light */

/* Existing NZA blue (keep for continuity with rest of tool) */
--nza-blue-500:   #44789D;
--nza-blue-700:   #2C5371;

/* Status colours */
--status-success: #10B981;   /* In place, held, maxed */
--status-warning: #F59E0B;   /* At risk, partial, awaiting */
--status-danger:  #EF4444;   /* Missing, calendar-locked, gap */
--status-neutral: #6B7280;   /* Not applicable, retired */

/* Component band accents (for aspect cards) */
--band-management:  #14B8A6;  /* teal */
--band-performance: #44789D;  /* NZA blue */
--band-residential: #10B981;  /* green */

/* Surfaces */
--surface-page:    #FFFFFF;
--surface-card:    #FFFFFF;
--surface-subtle:  #F9FAFB;  /* table rows, hover states */
--border-subtle:   #E5E7EB;
--text-primary:    #111827;
--text-secondary:  #6B7280;
--text-tertiary:   #9CA3AF;
```

### Typography

- **Body:** existing app font (Inter or system-ui) — don't change for this page
- **Indicator codes / data:** monospace (`ui-monospace`, `SF Mono`, `Menlo`, `Consolas`) — gives the GitBook code-style feel
- **Page titles:** sans, 28-32px, weight 700, colour `--gresb-teal-900`
- **Card titles:** sans, 16-18px, weight 600
- **Body text:** sans, 14-15px, weight 400, line-height 1.5
- **Small labels:** sans, 11-12px, weight 500, uppercase tracking 0.05em

### Components

- **Cards:** white background, 1px solid `--border-subtle`, 8px border-radius, 16-20px padding. Subtle shadow on hover: `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`.
- **Indicator badges:** rounded-full pill, `--gresb-teal-100` background, `--gresb-teal-700` text, monospace font, 11-12px, padding `2px 8px`.
- **Aspect badges:** similar pill, but coloured per band (management = teal, performance = blue, residential = green).
- **Status pills:** rounded-full, coloured per status. Show icon + label (e.g. ✓ In place, ⚠ At risk, ✗ Missing).
- **Confidence pills:** small, single-letter (H/M/L), colour-coded background.
- **Star rating:** lucide-react Star icon, filled `--gresb-teal-500`, empty `--text-tertiary`.
- **Buttons:** primary buttons `--gresb-teal-500` background with white text. Secondary buttons white with `--gresb-teal-700` border + text.
- **Links:** `--gresb-teal-700`, underline on hover only.

### Layout principles

- **Generous whitespace** — at least 24px between major sections.
- **Card-first** — almost everything is in a card. Cards group related info.
- **Progressive disclosure** — GRESB-speak (indicator codes, technical descriptions) hidden by default behind "Show technical detail" toggles. IVG-speak surfaced.
- **Single-view spirit** (Hard Rule 9) — home page designed to fit a 1440×900 desktop without scroll, mobile is naturally scrollable. Aspect detail pages can scroll.
- **No emoji decoration** — icons via lucide-react only. Star ratings via Star icon. No 🎯 / 📊 / ⚠️ in UI text (those were fine for the tracker but feel wrong in product UI).

### Icons (lucide-react)

- `Star` — for star ratings
- `Check`, `AlertTriangle`, `X`, `Info`, `Clock` — for status indicators
- `ChevronRight`, `ChevronDown` — for navigation + expandable rows
- `ExternalLink` — for outbound links (evidence URLs in Phase 3)
- `Calendar` — for dates / expiry indicators

---

## Hard rules + process rules (from CLAUDE.md)

- **Hard Rule 9 (single-view/no-scroll)** — followed in spirit. Home page targets 1440×900 fit; aspect detail pages allowed to scroll given content density.
- **Process Rule 10 (mandatory browser walkthrough)** — non-negotiable. Green build is not sufficient. Each task closes only after browser verification at desktop (1440×900) AND mobile (375×667) widths.
- **No fabrication** — all numbers must come from the JSON. No placeholder values. If something isn't in the JSON, render an empty state ("No data") rather than inventing a number.
- **No assumed dependencies** — only use libraries already in `package.json`. If a new dependency is needed (e.g. a chart library for the ScoreRangeBar), raise it back to Chris before installing — we may already have what we need (lucide-react + CSS gradients can probably handle the ScoreRangeBar without any chart lib).

---

## Phase 2 stub (Brief 14 to come)

**Goal:** Replace manual JSON population with a live pipeline.

Outline:
1. Python script `scripts/build_gresb_json.py` reads `26003-NZA-IVG-XX-SH-2000_PNN.xlsx` (latest version, auto-detected) and emits `src/data/gresb.json`.
2. Pre-commit or GitHub Action runs this script when tracker is updated.
3. Cowork operational sweep updates trigger regeneration.
4. `meta.version` and `meta.lastUpdated` automatically reflect the source.

Not in this brief — call out as upcoming so the Phase 1 JSON shape is built to accept automation cleanly.

---

## Phase 3 stub (Brief 15 to come)

**Goal:** Interactive IVG-facing layer — the action queue and evidence vault.

Outline:
1. New page `/gresb/actions` — open IVG asks sorted by point impact + deadline. Tickable. Awaiting/Done states persist (via window.storage or a simple backend).
2. New page `/gresb/evidence` — the evidence vault. All evidence catalogued by document, with expiry tracking, links to SharePoint/audit-trail folder, and indicator-mapping ("this policy supports PO1, PO2, PO3").
3. Public-document expiry tracking — when a public sustainability report's "valid until" date approaches, flag warning. When expires, flag red.
4. Per-indicator evidence linking — clicking "What you have" items in the aspect detail opens the evidence directly.
5. Status-change workflow — Chris or IVG can mark items "In place" / "Awaiting" — propagates to the home page Outstanding count.

Not in this brief, but the data shape in Appendix A reserves `evidence`, `youHave`, `gap`, `actionRequired` fields exactly so Phase 3 has them ready.

---

## Open questions for Chris before kick-off

1. **Confirm route structure:** is `/gresb` the right home, or should it be `/portfolio/gresb` (nested under existing Portfolio section)?
2. **Confirm JSON authorship:** for Phase 1 I'll generate the full populated `gresb.json` from P09. Cowork picks up the file maintenance from there, or Chris does the manual updates pre-Phase 2? Either works — affects who Phase 1 hands off to.
3. **Star icon style** — solid filled star or outlined? GRESB uses solid green stars; I'd match that.
4. **GRESB section in main nav** — should it be a top-level item ("Portfolio | GRESB | Settings") or live inside Portfolio? My preference: top-level, since it's becoming the central source of truth.

---

## Changelog
- v1.0 — 04 Jun 2026 — Brief 13 issued, Phase 1 executable
