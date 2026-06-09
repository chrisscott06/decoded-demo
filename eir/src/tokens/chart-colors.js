/**
 * Chart colours - JS-side mirror of the CSS tokens in eir/src/index.css.
 * Recharts and other libraries that need raw hex strings import from here.
 *
 * Single source of truth: if a colour changes, update BOTH index.css and this
 * file. The Part 2 sweep enforces no raw hex in JSX outside this module.
 *
 * Names match the CSS token names (with COLOR_ prefix for clarity).
 */

// Tier 1 - anchors
export const COLOR_NZA_CORAL = '#E8725C';
export const COLOR_NZA_CREAM = '#EDE5D8';

// Tier 2 - NZA Core theme
export const COLOR_THEME_BASE = '#1A2440';
export const COLOR_THEME_ACCENT_PRIMARY = '#F08080';
export const COLOR_THEME_ACCENT_SECONDARY = '#A896C4';
export const COLOR_THEME_CTA = '#E8725C';
export const COLOR_THEME_BODY = '#EDE5D8';

// Tier 3 - risk
export const COLOR_RISK_LOW = '#8FCB85';
export const COLOR_RISK_MODERATE = '#E8A13C';
export const COLOR_RISK_MAJOR = '#D9464B';
export const COLOR_RISK_SEVERE = '#4C3D6B';
export const COLOR_RISK_NO_DATA = '#A9C5DA';

// Tier 3 - scopes
export const COLOR_SCOPE_12 = '#5BBFB5';
export const COLOR_SCOPE_3 = '#534E86';

// Tier 3 - categorical
export const COLOR_CAT_ESTATE = '#5B7B9A';
export const COLOR_CAT_TRAVEL = '#F2A93B';
export const COLOR_CAT_SUPPLY_CHAIN = '#347373';
export const COLOR_CAT_COMMUTING = '#D4891F';

// Muted text helpers (used in Recharts axis ticks)
export const COLOR_TEXT_MUTED_ON_DARK = '#8a8a8a';
export const COLOR_TEXT_MUTED_ON_CREAM = '#666666';

// UK silhouette - lighter navy used for the GB outline on the Phase 1B fallback map
// (replaced in Brief 6 Part 4 by the dotted SVG). Keep for backward compat.
export const COLOR_UK_SILHOUETTE = '#1a2632';

// Font family strings (matches CSS --font-heading / --font-body)
export const FONT_HEADING = 'Stolzl, sans-serif';
export const FONT_BODY = 'Inter, system-ui, sans-serif';
export const FONT_MONO = 'IBM Plex Mono, ui-monospace, monospace';

// Map theme accents - hex mirrors of the CSS --theme-* tokens in
// index.css. Keep in sync. Sub-metric overrides (Electricity, Gas)
// consumed from METRIC_HEX.
//
// Chris ask 2026-06-02: Energy ⇄ orange, Water ⇄ blue, Carbon was teal.
// Chris ask 2026-06-04: Waste ⇄ Carbon (Waste teal, Carbon green -
//   classic "low-carbon = green" semantic), Meters pink → NZA-family
//   purple (one step deeper than the existing accent-secondary lilac
//   so heating-matrix "Mixed" stays distinct).
export const MAP_THEME_HEX = {
  overview:    '#5B7B9A', // slate (neutral umbrella)
  energy:      '#E5732A', // orange
  water:       '#5BA3D9', // blue
  waste:       '#8B6FB8', // purple (Chris ask 8 Jun - swapped with meters)
  carbon:      '#7CC470', // green (was teal; swapped with waste in earlier round)
  meters:      '#5BBFB5', // teal (Chris ask 8 Jun - swapped with waste)
  dataQuality: '#347373', // dark teal (distinct from waste's lighter teal)
}

// Brief 10 Part 5 - sub-metric tint overrides (a metric in a theme can
// carry its own colorHex; e.g. Electricity rides yellow even though
// Energy is blue).
export const METRIC_HEX = {
  // Chris ask 4 Jun: electricity rotated from lemon #E8C547 to richer
  // amber/gold; gas rotated from coral #D85F4D to NZA deep red #B8443A.
  // See index.css :root --metric-electricity + --metric-gas for the
  // designer rationale. This JS mirror feeds the Map markers + month
  // ramp; keep in lockstep with the CSS tokens.
  electricity: '#D4A017', // rich amber-gold (was lemon #E8C547)
  gas:         '#B8443A', // NZA deep red (was coral #D85F4D)
}

// Chris ask 8 Jun - weekday/weekend pair for the Daily Profile
// redesign. Pablo's palette: teal weekday + pink-magenta weekend.
// High-contrast (different hue + different value) so colour-blind
// readers still see two distinct lines. Used by DailyProfileView's
// new side-by-side weekday-vs-weekend chart.
export const COLOR_WEEKDAY = '#00AEEF';  // Pablo teal
export const COLOR_WEEKEND = '#E84393';  // Pablo pink-magenta

// Brief 11 Tier 2 - Load Inspector chart helpers.
// 12-month colour ramp for the Daily Profile "all months" overlay (cool
// winter → warm summer). Values mirror the theme tokens where possible.
export const MONTH_RAMP_HEX = [
  COLOR_CAT_ESTATE,           // Jan
  '#5BA3D9',                  // Feb - theme-energy
  COLOR_SCOPE_12,             // Mar
  '#7CC470',                  // Apr - theme-waste
  '#A1C16A',                  // May - green-lime tween
  METRIC_HEX.electricity,     // Jun
  '#E5732A',                  // Jul - theme-carbon
  METRIC_HEX.gas,             // Aug
  '#D49AB0',                  // Sep - theme-meters
  COLOR_THEME_ACCENT_SECONDARY, // Oct - purple
  COLOR_SCOPE_3,              // Nov
  COLOR_CAT_SUPPLY_CHAIN,     // Dec
]

// Chart tooltip background - pure white reads on both cream and dark
// surroundings without bleed-through. Used by every Recharts <Tooltip>
// inside the Load Inspector.
export const COLOR_TOOLTIP_BG = '#FFFFFF'

// Brief 7 - Data-quality status hex (waste/water status badges in hover card).
export const STATUS_HEX = {
  confirmed:      COLOR_RISK_LOW,        // green
  partial:        COLOR_RISK_MODERATE,   // amber
  missing:        COLOR_RISK_MAJOR,      // red
  not_applicable: COLOR_RISK_NO_DATA,    // pale blue-grey
}
