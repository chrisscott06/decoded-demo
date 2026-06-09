/**
 * Site marker positions as percent of the dotted UK SVG box.
 *
 * The dotted UK silhouette at `eir/public/maps/uk-dotted-map.svg` covers
 * the whole UK including Scotland (viewBox 0 0 1409.97 2548.17, portrait;
 * dot extent x ~5.6%–99.4%, y ~2.7%–97.6%). The aspect ratio (1.81) is
 * consistent with a Mercator-like projection of UK landmass spanning
 * roughly lat 49.8°–58.7° and lon -6.5°–1.8°, which is what this module
 * uses as the projection bounding box.
 *
 * Brief 14 Part 1 rewrite - replaces the previous bounding box
 * (lat 50.4–53.4, lon -3.8–1.0) which assumed the SVG covered only
 * central southern England. That bbox spread IVG's southern-English sites
 * across the WHOLE UK silhouette, so e.g. Gifford Lea (Cheshire, lat 53.16)
 * ended up rendered visually over Scotland. The new bbox covers all of
 * the UK landmass shown in the SVG, so IVG sites cluster in the
 * lower-right of the silhouette (southern/central England) as they should.
 *
 * Method:
 *   1. Equirectangular projection from real lat/lon (pipeline/site_coordinates.json)
 *      against the BBOX below.
 *   2. Apply a per-site offset from EYEBALL_OFFSETS for sites that need
 *      manual nudging once the projected positions are rendered.
 *   3. Positions exposed as a frozen object via SITE_POSITIONS (computed
 *      at module load), plus the underlying projectLatLon(lat, lon)
 *      function for any future tooling that needs to project new sites.
 *
 * Adding a new site:
 *   - Add it to pipeline/site_coordinates.json with lat/lon.
 *   - Import the JSON below.
 *   - Re-render; if it sits off its town, add a {dx, dy} to EYEBALL_OFFSETS.
 *
 * Dev sites (Edenbridge / Little Mount Lake) are projected too; they only
 * render IF present in sites.json - getMarkerPosition returns null for
 * unknown ids, which makes <MapMarkers> skip rendering a dot for them.
 */

// site_coordinates.json lives at pipeline/ root (not pipeline/dist/eir/)
// so use the @pipeline-static alias (set in eir/vite.config.js).
import siteCoordinates from '@pipeline-static/site_coordinates.json'

/**
 * Bounding box for the projection - Chris ask 2026-06-02: the portfolio
 * is entirely in southern + central England, so the previous full-UK
 * bbox left the top 55% of the SVG empty (Scotland + N England with no
 * markers). New bbox crops to the Brighton → Liverpool / Cardiff →
 * Norwich window IVG uses on its own marketing site. Markers spread
 * across the visible area, no wasted vertical.
 *
 * Coordinates picked against the SVG's equirectangular projection
 * (1° lat ≈ 286 SVG-px, 1° lon ≈ 170 SVG-px from the full bbox math).
 * This bbox corresponds to SVG viewBox window (340, 1430, 1070, 970) -
 * MapMarkers' inline-SVG viewBox must stay in sync with these values.
 */
export const BBOX = {
  latMin: 49.85,  // ~Lizard Point (south Cornwall) - Chris ask: don't clip the foot
  latMax: 53.7,   // ~Liverpool / Manchester
  lonMin: -5.8,   // ~Land's End (west Cornwall) - keep the bottom-left of the silhouette in view
  lonMax:  1.8,   // ~Lowestoft / Norfolk coast
}

/**
 * Per-site eyeball nudges (added to the projected position, in
 * percentage-points). Chris ask 2026-06-02: equirectangular projection
 * pushes southern sites too far north on this cropped + dotted SVG
 * (the SVG itself uses a Mercator-ish projection). The dy values
 * below compensate site-by-site against the IVG website reference,
 * heaviest in the south, lightest near the top. dx tweaks address
 * coastal precision (Bramshott et al. snap to nearer-coast dots).
 */
export const EYEBALL_OFFSETS = {
  'gifford-lea':       { dx: 10,    dy: 17 },
  'edwalton-office':   { dx:  4,    dy: 19 },
  'austin-heath':      { dx:  5,    dy: 16 },
  'great-alne-park':   { dx:  5,    dy: 16 },
  'elderswell':        { dx:  5,    dy: 17 },
  'millfield-green':   { dx:  5,    dy: 18 },
  'ledian-gardens':    { dx: -2,    dy: 14 },
  'sonning-common':    { dx:  0,    dy: 19 },
  'durrants-village':  { dx:  0,    dy: 14 },
  'bramshott-place':   { dx: -1,    dy: 16 },
  'ampfield-meadows':  { dx:  0,    dy: 16 },
  'blendworth-hills':  { dx:  0.5,  dy: 16 },
  'millbrook-village': { dx:  0,    dy:  8 },
}

/**
 * Equirectangular projection from a (lat, lon) to a percent (x, y)
 * position on the SVG. y is inverted because SVG y=0 is at the top.
 */
export function projectLatLon(lat, lon) {
  const x = (lon - BBOX.lonMin) / (BBOX.lonMax - BBOX.lonMin) * 100
  const y = (BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin) * 100
  return { x, y }
}

/**
 * Computed at module load: every site in site_coordinates.json projected
 * + any eyeball offset applied. Frozen so consumers can't mutate.
 */
export const SITE_POSITIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(siteCoordinates).map(([id, s]) => {
      const { x, y } = projectLatLon(s.lat, s.lon)
      const off = EYEBALL_OFFSETS[id] || { dx: 0, dy: 0 }
      return [id, { x: +(x + off.dx).toFixed(2), y: +(y + off.dy).toFixed(2) }]
    })
  )
)

/**
 * Look up a site's marker position.
 * @param {string} siteId
 * @returns {{x:number,y:number}|null} percentages, or null if unknown
 */
export function getMarkerPosition(siteId) {
  return SITE_POSITIONS[siteId] || null
}
