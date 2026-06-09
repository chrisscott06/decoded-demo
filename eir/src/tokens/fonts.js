// Font family constants for use in SVG inline styles, Recharts props, and
// any other place where a Tailwind class won't reach. Tailwind classes
// (font-heading, font-body, etc.) are generated from @theme in index.css.
//
// JetBrains Mono is explicitly NOT used. Mono role is IBM Plex Mono.
// (Design spec § Typography - family table contains a drafting bug listing
// JetBrains; the prose immediately below resolves to IBM Plex Mono. This
// file follows the prose and Chris's standing instruction.)

export const FONT_HEADING = "'Stolzl', sans-serif";        // Stolzl Medium 500
export const FONT_HERO = "'Stolzl', sans-serif";           // Stolzl Book 400
export const FONT_BODY = "'Inter', system-ui, sans-serif"; // Inter variable
// FONT_DISPLAY retired Brief 10 Part 3 - DM Serif Display was unused EOC
// leakage. Editorial accents now use FONT_HEADING (Stolzl Medium).
export const FONT_DISPLAY = "'Stolzl', sans-serif";        // alias preserved for any straggling importers
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

// ── Five-token typography scale for the cream/dark editorial register ──
// Per Chris's 2026-05-21 mini-template direction. These are THE ONLY
// typography tokens used in the cream-register pages (Home / Explainers /
// CarbonAccounting). If a page needs a different size, surface to Chris.
//
// Family assignments are conventional, applied by component via the
// font-heading / font-body Tailwind classes; the token itself only fixes
// size + line-height.
export const TYPE_CHAPTER       = { size: '40px', lineHeight: '1.15' }; // Stolzl Medium
export const TYPE_CHAPTER_SUB   = { size: '18px', lineHeight: '1.6'  }; // Inter
export const TYPE_PAGE_HEADING  = { size: '28px', lineHeight: '1.2'  }; // Stolzl Medium
export const TYPE_SUBHEADING    = { size: '18px', lineHeight: '1.3'  }; // Stolzl Medium (+ coral underline)
export const TYPE_BODY          = { size: '15px', lineHeight: '1.6'  }; // Inter
