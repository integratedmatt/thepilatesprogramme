/**
 * Shared world map projection. Used at build time by scripts/build-world-map.mjs (the dot-matrix land layer)
 * and by WorldMap.astro (markers, labels, arcs), so both layers line up exactly.
 */
import { geoEqualEarth, geoInterpolate, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-110m.json');

export const VIEW_WIDTH = 1000;
export const DOT_STEP = 7;      // spacing between land dots, in viewBox units
export const DOT_SIZE = 3.4;    // dot diameter, in viewBox units

/** Land without Antarctica, so the map crops to where people live. */
export function land() {
  const all = feature(topo, topo.objects.land);
  const polys = (all.geometry ?? all.features?.[0]?.geometry).coordinates.filter((poly) => poly[0].some(([, lat]) => lat > -60));
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } };
}

let cached;
/** Equal Earth, centred on 10°E so the UK to Australia story sits mid-frame, fitted to the land. */
export function projection() {
  if (cached) return cached;
  const l = land();
  const p = geoEqualEarth().rotate([-10, 0]).fitWidth(VIEW_WIDTH, l);
  const [[, y0], [, y1]] = geoPath(p).bounds(l);
  const pad = 8;
  p.translate([p.translate()[0], p.translate()[1] - y0 + pad]);
  cached = { projection: p, height: Math.ceil(y1 - y0 + pad * 2) };
  return cached;
}

/** Great-circle arc between two [lng, lat] points, projected to an SVG path. */
export function arcPath(from, to, steps = 48) {
  const { projection: p } = projection();
  const interp = geoInterpolate(from, to);
  const pts = Array.from({ length: steps + 1 }, (_, i) => p(interp(i / steps)));
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
}

export function point(lng, lat) {
  const [x, y] = projection().projection([lng, lat]);
  return { x: +x.toFixed(1), y: +y.toFixed(1) };
}
