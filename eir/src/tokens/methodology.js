// Tier 3 - Methodology tokens. Locked, theme-independent.
// Risk ratings, scope colours, data-quality tiers, and categorical themes
// have semantic meaning that must not vary by client or theme - a Scope 3
// colour means Scope 3 in every NZA report.

export const risk = {
  low: '#8FCB85',
  moderate: '#E6B91E',
  major: '#D94B3D',
  severe: '#4C3D6B',
  noData: '#A9C5DA',
};

export const scopes = {
  scope12: '#4A9C9C',
  scope3: '#534E86',
};

export const dq = {
  activityBased: '#22C55E',
  supplierSpecific: '#3B82F6',
  industryAverage: '#E8743C',
  proxy: '#EF4444',
};

export const categoricalThemes = {
  estate: '#5A8FB5',
  travel: '#E8743C',
  supplyChain: '#2A5A4B',
  commuting: '#F4A878',
};
