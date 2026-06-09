// Tier 3 - Methodology tokens. Locked, theme-independent.
// Risk ratings, scope colours, data-quality tiers, and categorical themes
// have semantic meaning that must not vary by client or theme - a Scope 3
// colour means Scope 3 in every NZA report.

export const risk = {
  low: '#8FCB85',
  moderate: '#E8A13C',
  major: '#D9464B',
  severe: '#4C3D6B',
  noData: '#A9C5DA',
};

export const scopes = {
  scope12: '#5BBFB5',
  scope3: '#534E86',
};

export const dq = {
  activityBased: '#22C55E',
  supplierSpecific: '#3B82F6',
  industryAverage: '#F2A93B',
  proxy: '#EF4444',
};

export const categoricalThemes = {
  estate: '#5B7B9A',
  travel: '#F2A93B',
  supplyChain: '#347373',
  commuting: '#D4891F',
};
