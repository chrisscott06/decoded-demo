# Brief 24.7 - Energy chapter prose rewrite + Metering rename

**Status:** Closed pending Chris walkthrough

**Brief:** `docs/briefs/archive/24_7_energy_prose_rewrite_COMPLETED.md`

## Parts log

- [x] Part 0.5 - Brief landed
- [x] Part 1 - Prose replacements + Metering rename
- [x] Part 1 (extension) - Tool-wide em-dash sweep (Chris ask alongside)
- [x] Part 2 - Close (this doc, archive, push)

## Implementation notes

### Part 1 - prose rewrite

All four Portfolio Energy sub-tabs rewritten in `PortfolioEnergy.jsx`:

- **Consumption** (lines ~397): three section headers renamed to plain noun phrases ("What IVG used in CY2025" / "Why some sites use much more than others" / "Landlord vs resident energy"). Opening sentence orients to "what IVG is" (13 retirement villages, 2 out of scope). Jargon (CHP, ASHP) translated on first use. Landlord-vs-resident reframed honestly: IVG invoiced, residents recharged via service charge, DevCo absorbs voids.
- **Heating strategy**: three section headers renamed ("How IVG heats its homes" / "The sites with multiple strategies" / "What's confirmed and what we're still checking"). Per-site breakdown of the four mixed-strategy sites split into separate paragraphs for readability. Elderswell VC heating reframed as work-in-progress (NZA review in progress) not speculation.
- **Power strategy**: three section headers renamed ("How IVG buys energy" / "How electricity reaches each site" / "Capacity and on-site generation"). Section 1 now covers both electricity AND gas under one Ecotricity supplier framing. Bulk/DNO/BNO arrangements translated on first use.
- **Metering**: renamed from "Metering & data quality" in `SUB_TABS` (line 37). New prose follows the brief verbatim. Removed the "What this means for the rest of the page" section entirely - its content is now captured by the new `CoverageTable`. Added `VoidCallout` component for the high-consumption voids flag.

Live data values preserved via `<Token>` components throughout. The brief's hardcoded numbers (19.0 GWh, 10.0 GWh, etc.) were not hardcoded into the prose - the prose uses `<Token>{fmtGwh(...)}</Token>` so the displayed figures stay in lockstep with the pipeline.

### Em-dash sweep (Chris ask alongside)

Tool-wide sweep replacing em-dash (U+2014) with regular hyphen (U+002D) across all `.jsx`, `.js`, `.json`, `.css` files in `eir/src/`. Single command:

```
find eir/src -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.json" -o -name "*.css" \) -exec sed -i 's/—/-/g' {} +
```

64 files touched. Verified `grep -rl '—' eir/src` returns 0 hits. Docs folder (`docs/briefs/`, `docs/audit/`) NOT swept - author-facing markdown stays in its own voice.

Note: Chris's CLAUDE.md style note says "Em-dashes for parenthetical clauses". This sweep overrides that for the deployed app (per Chris ask 8 Jun). The CLAUDE.md note should be updated if the no-em-dash rule is permanent.

## DOM verification (1920x1080)

| Check | Result |
|---|---|
| Em-dashes in rendered Consumption page body | 0 |
| New "What IVG used in CY2025" heading present | Yes |
| Old "The portfolio in one line" heading gone | Yes |
| "Metering" sub-tab label (no "& data quality") | Yes |
| New "How IVG sees its portfolio" heading present | Yes |
| `CoverageTable` ("Coverage at a glance") rendered | Yes |
| `VoidCallout` ("Worth flagging: high-consumption voids") rendered | Yes |
| Old "What this means for the rest" section removed | Yes |

## Files touched

- `eir/src/components/portfolio/PortfolioEnergy.jsx` - prose rewrite + sub-tab rename + `CoverageTable` + `VoidCallout` helpers
- 64 files across `eir/src/` - em-dash sweep (cosmetic, no logic changes)

## Commits

(filled in by close commit)

