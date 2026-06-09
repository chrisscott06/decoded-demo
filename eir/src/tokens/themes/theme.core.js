// Tier 2 - Active theme: NZA Core.
// This is the template's default theme. Per-client forks replace this file
// (or swap the import in src/tokens/colors.js) with the client palette.

import { anchors } from '../anchors.js';

export const theme = {
  name: 'nza-core',
  base: '#1A2440',
  accents: {
    primary: '#F08080',
    secondary: '#A896C4',
  },
  cta: anchors.nzaCoral,
  body: anchors.nzaCream,
};
