# RFI Register workbook structure (Phase 1A reference)

**File:** `pipeline/source-data/26003-NZA-IVG-XX-SH-1000_P06_-_RFI_Register.xlsx`
**Document ref:** `26003-NZA-IVG-XX-SH-1000`, P06 (issued 2026-05-21)
**Sheets:** 11

## The tab we need

### `RFI_P06`

- 42 rows × 17 cols
- Project metadata in rows 2–8 (skip)
- "RFI" label r11 (skip)
- Header r12
- Data r13+

| Col | Field | Notes |
|---|---|---|
| B (2) | Theme | "A. Organisational Boundary & Reporting" etc. **Only set on first row of each theme — needs forward-fill.** |
| C (3) | Ref | A1, A2, B1, ... |
| D (4) | Sub-theme | |
| E (5) | Information request | long text — truncate to 200 chars per brief |
| F (6) | Purpose | |
| G (7) | Preferred format | |

- max_row 42, header r12, so data r13–r42 = up to 30 items (brief said 33, will confirm exact count in chunk 6)
- Status defaults to "Open" — no status column populated in P06

## Tabs we don't need

`Site Register`, `Electricty LL`, `Electricty Void`, `Electricty Sub`, `Gas LL`, `Heat & DHW Sub`, `Water`, `Water Sub`, `Waste`, `ZZ- Data Validation` — these are the per-domain RFI breakouts that are also covered by the Ecotricity master + per-domain pipelines. The roll-up RFI_P06 is sufficient for Phase 1A.

## Theme letters seen

A, B, C — confirmed in inspection. Brief expects A–G. Will confirm exact set in chunk 6.
