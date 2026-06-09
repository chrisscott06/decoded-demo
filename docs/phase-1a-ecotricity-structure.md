# Ecotricity workbook structure (Phase 1A reference)

**File:** `pipeline/source-data/26003-NZA-XX-XX-CA-X_1001b_P02 - Ecotricity_Master_Data_Gas_Electricity.xlsx`
**Document ref:** `26003-NZA-XX-XX-CA-X_1001b`, P02 (last modified 2026-05-21 15:36)
**Sheets:** 17 (brief said 16; close enough)
**Note:** filename differs from brief's `Ecotricity_Master_IVG_AUDIT.xlsx` but content matches. Locate via prefix pattern `*CA-X_1001b*.xlsx`.

## Tabs we need

### `MPAN Register` (chunk 4)

- 226 rows × 12 cols
- Header r4. Data r5–r226 = 222 MPANs ✓ matches brief
- Site_ID column already kebab-case (e.g. `austin-heath`, `ampfield-meadows`) — no resolver needed

| Col | Field | Notes |
|---|---|---|
| A (1) | MPAN/MPRN | 14-digit string |
| B (2) | Site_ID | kebab-case canonical |
| C (3) | Site Name | display name |
| D (4) | Type | HH / NHH / Gas |
| E (5) | Meter Serial | |
| F (6) | CY25 Total (kWh) | numeric |
| G (7) | CY25 Months | int 0–12 |
| H (8) | Address | often blank |
| I (9) | Address Postcode | often blank |
| J (10) | Supply Category | "Landlord (HH)", "Landlord (NHH)", "Landlord (NHH) - heuristic", "Landlord (Gas)", "Landlord (Office)", "Construction", "Void - Normal (low)", "Void - HIGH CONSUMPTION", "Inactive (no consumption)" |
| K (11) | Category Source | text justification |
| L (12) | Notes | |

### `Site x Month Summary` (chunk 3)

- 78 rows × 19 cols
- Header r4. Headers: Site, Type, Oct 24, Nov 24, ..., Dec 25, 15mo Total, CY25 Total (cols 1–19)
- 15 months: cols 3–17 (Oct 2024 through Dec 2025)
- 15mo Total: col 18
- CY25 Total: col 19
- Per site: **4 data rows + 1 blank** (brief said 5 in a group). Layout:
  - Row N: site HH
  - Row N+1: site NHH
  - Row N+2: site Gas
  - Row N+3: site TOTAL ← skip (we compute)
  - Row N+4: blank ← skip
- Site order: Austin Heath, Gifford Lea, Bramshott Place, Millbrook Village, Durrants Village, Great Alne Park, Ledian Gardens, Elderswell, Millfield Green, Ampfield Meadows, Blendworth Hills, Sonning Common, Edwalton Office, Edenbridge (dev), Little Mount Lake (dev) — 15 sites
- Austin Heath CY25 total: 2,931,778 kWh ✓ matches brief "~2.93 GWh"

### `Landlord vs Resident` (chunk 5)

- 20 rows × 13 cols
- Header r4
- Cols: Site, Landlord (HH), Landlord (NHH), Landlord (NHH) heuristic, Landlord (Gas), Landlord (Office), Construction, Void Normal, Void HIGH, Inactive, Tot Landlord, Tot Void, Total CY25
- Data r5–r17 (13 canonical sites) + r18+ likely totals

### `Arbnco Reference` (chunk 5)

- 19 rows × 10 cols
- Header r4
- Cols: Site_ID, arbnco Site Name, Elec Meters, Gas Meters, Electricity kWh, Gas kWh, Total kWh, Actual Carbon, Nat Avg Carbon, Notes
- Already keyed by canonical site_id

### `Arbnco vs Eco Landlord` (chunk 5 — pre-computed deltas)

- 20 rows × 9 cols
- Header r4
- Cols: Site, Eco Elec Landlord, Arbnco Elec, Δ Elec, Δ% Elec, Eco Gas Landlord, Arbnco Gas, Δ% Gas, Notes
- Already computes deltas — use this for the reconciliation output

### `Derived Resident Energy` (chunk 5 — pre-computed)

- 20 rows × 10 cols
- Header r4
- Cols: Site, Eco Landlord Elec, Arbnco Total Elec, Derived Resident Elec, Eco Landlord Gas, Arbnco Total Gas, Derived Resident Gas, Total Derived Resident, % Resident of Total, Notes
- The "Derived Resident Elec" / "Derived Resident Gas" columns are exactly what we need for the reconciliation output

### `Void Investigation` (chunk 5)

- 100 rows × 9 cols
- r4 contains the headline: "82 high-consumption voids..."
- **By-site summary**: header r7, data r8–r13, TOTAL r14
- TOTAL row r14: 82 voids / 178,669 kWh / £49,134 ✓ matches brief exactly
- **Per-MPAN detail**: header r18, data r19+

## Tabs we don't need

`README`, `Methodology`, `Lookup - Sites/Eco Entity Map/File Index`, `Site Profiles (Charts)`, `Exceptions`, `Raw - Units`, `Raw - Invoices`, `Raw - Credits`.

## Landlord vs Void split for monthly data — implementation choice

The Site x Month Summary doesn't directly distinguish landlord vs void in each cell — only HH/NHH/Gas totals. Brief offered two approaches:

1. Cross-reference Raw - Units month-by-month (heavy)
2. Apportion: take landlord/void ratio from the MPAN Register CY25 totals and apply to each month (pragmatic)

**Going with #2** for chunk 3. Documented as the choice. The MPAN Register has CY25 kWh per MPAN with Supply Category — sum landlord MPANs vs void MPANs per site, get the proportion, apply to each month's total. Inevitably loses month-by-month void variation but acceptable for Phase 1A.
