/** Writes public/images/world-dots.svg: a dot-matrix land layer on an even screen-space grid. */
import { writeFile } from 'node:fs/promises';
import { geoContains } from 'd3-geo';
import { land, projection, VIEW_WIDTH, DOT_STEP, DOT_SIZE } from '../src/lib/worldmap.mjs';

const l = land();
const { projection: p, height } = projection();
const parts = [];
for (let y = DOT_STEP / 2; y < height; y += DOT_STEP) {
  for (let x = DOT_STEP / 2; x < VIEW_WIDTH; x += DOT_STEP) {
    const ll = p.invert([x, y]);
    if (ll && geoContains(l, ll)) parts.push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_WIDTH} ${height}" width="${VIEW_WIDTH}" height="${height}"><path d="${parts.join('')}" fill="none" stroke="#D9D3CA" stroke-width="${DOT_SIZE}" stroke-linecap="round"/></svg>\n`;
await writeFile(new URL('../public/images/world-dots.svg', import.meta.url), svg);
console.log(`[world-map] ${parts.length} dots, viewBox ${VIEW_WIDTH}x${height}, ${(svg.length / 1024).toFixed(1)}KB`);
