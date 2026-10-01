/**
 * Pulls photography from the existing Squarespace site into public/images/site/ and writes a manifest.
 *
 *   node scripts/pull-site-images.mjs            # crawl the live site
 *   SITE_ORIGIN=https://www.thepilatesprogramme.co.uk node scripts/pull-site-images.mjs
 *
 * Needs network access to www.thepilatesprogramme.co.uk and images.squarespace-cdn.com.
 * Output: public/images/site/<page>-<n>.jpg (max 2000px wide, Squarespace resizes via ?format=)
 *         src/content/seed/siteImages.json  { page, src, alt, width, height, file }
 * Afterwards, map the files you want onto heroImage / gallery fields in the seed (or upload them to Sanity).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const origin = process.env.SITE_ORIGIN || 'https://www.thepilatesprogramme.co.uk';
const pages = ['', 'uk-pilates-barre-instructor-courses', 'mat-pilates-course', 'reformer-pilates-course', 'barre-course', 'about', 'advanced-reformer-pilates-course-1', 'chair-pilates-course', 'cadillac-pilates-course', 'barrel-pilates-course', 'uk-pilates-cpd-courses', 'prenatalandpostpartumcpd', 'strengthandendurancecpd', 'jumpboard', 'painscience', 'elevatingothers', 'faqs', 'contact'];
const UA = 'Mozilla/5.0 (compatible; TPP-rebuild-image-pull)';
const outDir = new URL('../public/images/site/', import.meta.url);
await mkdir(outDir, { recursive: true });

const manifest = [];
const seen = new Set();
for (const page of pages) {
  const url = `${origin}/${page}`;
  let html;
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) { console.warn(`skip ${url}: ${res.status}`); continue; }
    html = await res.text();
  } catch (e) { console.warn(`skip ${url}: ${e.message}`); continue; }

  // Squarespace emits images as <img data-src ... alt ...>, data-image attributes and og:image.
  const found = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = (tag.match(/\bdata-src="([^"]+)"/) || tag.match(/\bsrc="([^"]+)"/) || [])[1];
    const alt = (tag.match(/\balt="([^"]*)"/) || [, ''])[1];
    const w = Number((tag.match(/\bdata-image-dimensions="(\d+)x(\d+)"/) || [])[1] || 0);
    const h = Number((tag.match(/\bdata-image-dimensions="(\d+)x(\d+)"/) || [])[2] || 0);
    if (src) found.push({ src, alt, w, h });
  }
  for (const m of html.matchAll(/\bdata-image="([^"]+)"/g)) found.push({ src: m[1], alt: '', w: 0, h: 0 });
  const og = html.match(/property="og:image" content="([^"]+)"/);
  if (og) found.push({ src: og[1], alt: 'Open Graph image', w: 0, h: 0 });

  let n = 0;
  for (const img of found) {
    const clean = img.src.replace(/\?.*$/, '');
    if (!/squarespace-cdn\.com|static1\.squarespace/.test(clean) || seen.has(clean)) continue;
    if (/\.(svg|gif)$/i.test(clean) || /logo/i.test(clean)) continue; // logos handled separately
    seen.add(clean);
    n++;
    const file = `${page || 'home'}-${n}.jpg`;
    const dest = new URL(file, outDir);
    if (!existsSync(dest)) {
      try {
        const res = await fetch(`${clean}?format=2000w`, { headers: { 'user-agent': UA } });
        if (!res.ok) throw new Error(String(res.status));
        await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      } catch (e) { console.warn(`failed ${clean}: ${e.message}`); continue; }
    }
    manifest.push({ page: page || 'home', src: clean, alt: img.alt, width: img.w || undefined, height: img.h || undefined, file: `/images/site/${file}` });
    console.log(`✓ ${file}  ${img.alt || '(no alt)'}`);
  }
}
await writeFile(new URL('../src/content/seed/siteImages.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${manifest.length} images saved. Manifest: src/content/seed/siteImages.json`);
