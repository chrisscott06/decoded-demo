// Active palette entry point.
// To switch to a different theme (PABLO, NZ:AI, decodED), change the
// theme import below. Every component imports colour from here.

import { theme } from './themes/theme.core.js';
import { anchors } from './anchors.js';
import { risk, scopes, dq, categoricalThemes } from './methodology.js';

export { theme, anchors, risk, scopes, dq, categoricalThemes };
