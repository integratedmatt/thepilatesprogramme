/**
 * SEO basics on every built page. Fails the build on a missing title, description, canonical, og:image or
 * favicon, a page without exactly one <h1>, an <img> without alt, or a duplicate title or description.
 * Warns (without failing, so a long CMS entry never blocks a deploy) on titles over 65 characters and
 * descriptions outside 70 to 160 characters, the ranges search results show without truncating.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dir = process.argv[2] || 'dist';
async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '_astro') yield* walk(p); }
    else if (e.name.endsWith('.html')) yield p;
  }
}
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
const errors = [], warnings = [], titles = new Map(), descs = new Map();
let pages = 0;
for await (const file of walk(dir)) {
  const html = await readFile(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue; // redirect stubs
  pages++;
  const page = '/' + relative(dir, file).replace(/^client\//, '').replace(/\/?index\.html$|\.html$/, '');
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const err = (m) => errors.push(`${page}: ${m}`);
  if (!title) err('missing <title>');
  if (!desc) err('missing meta description');
  if (!/<link rel="canonical" href="https:\/\//.test(html)) err('missing absolute canonical');
  if (!/<meta property="og:image" content="https?:\/\//.test(html)) err('missing og:image');
  if (!/<link rel="icon"/.test(html) || !/<link rel="apple-touch-icon"/.test(html)) err('missing favicon links');
  const h1 = (body.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(`${h1} <h1> elements`);
  const noAlt = (body.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length;
  if (noAlt) err(`${noAlt} <img> without alt`);
  if (title.length > 65) warnings.push(`${page}: title ${title.length} chars: ${title}`);
  if (desc && (desc.length < 70 || desc.length > 160)) warnings.push(`${page}: description ${desc.length} chars`);
  if (!noindex) {
    (titles.get(title) ?? titles.set(title, []).get(title)).push(page);
    (descs.get(desc) ?? descs.set(desc, []).get(desc)).push(page);
  }
}
// Sitemap hygiene: every listed URL must be a built, indexable page whose canonical is itself, and must not
// be shadowed by a redirect. Server-rendered routes (no built HTML) are only checked against redirects.
const pageInfo = new Map();
for await (const file of walk(dir)) {
  const html = await readFile(file, 'utf8');
  const path = '/' + relative(dir, file).replace(/^client\//, '').replace(/\/?index\.html$|\.html$/, '');
  pageInfo.set(path.replace(/\/$/, '') || '/', { noindex: /<meta name="robots" content="[^"]*noindex/.test(html), canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] });
}
const sitemapFile = join(dir, dir.endsWith('client') ? '' : 'client', 'sitemap.xml');
const sitemap = await readFile(sitemapFile, 'utf8').catch(() => '');
const redirectSources = new Set(JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')).redirects.map((r) => r.source));
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = new URL(loc).pathname.replace(/\/$/, '') || '/';
  if (redirectSources.has(path)) errors.push(`sitemap lists ${path}, which redirects`);
  const info = pageInfo.get(path);
  if (!info) continue;
  if (info.noindex) errors.push(`sitemap lists ${path}, which is noindex`);
  if (info.canonical && info.canonical !== loc) errors.push(`sitemap lists ${loc} but its canonical is ${info.canonical}`);
}
if (!sitemap) errors.push('no sitemap.xml in the build');

for (const [t, ps] of titles) if (t && ps.length > 1) errors.push(`duplicate title on ${ps.join(', ')}: ${t}`);
for (const [, ps] of descs) if (ps.length > 1) errors.push(`duplicate description on ${ps.join(', ')}`);
for (const w of warnings) console.warn(`! ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) { console.error(`SEO check failed: ${errors.length} problem(s) across ${pages} pages.`); process.exit(1); }
console.log(`✓ SEO basics pass on ${pages} pages${warnings.length ? ` (${warnings.length} length warnings)` : ''}.`);
