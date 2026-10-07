/**
 * Writes vercel.json from the redirect content (Sanity when configured, else the seed).
 * Runs before every build so redirects stay in the CMS.
 */
import { readFile, writeFile, access } from 'node:fs/promises';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2026-10-01';

async function loadRedirects() {
  if (projectId) {
    try {
      const q = encodeURIComponent('*[_type == "redirect"]{from, to, permanent}');
      const res = await fetch(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${q}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.result) && json.result.length) return json.result;
      }
    } catch (e) {
      console.warn('[redirects] Sanity unavailable, using seed', e.message);
    }
  }
  return JSON.parse(await readFile(new URL('../src/content/seed/redirects.json', import.meta.url), 'utf8'));
}

const exists = (p) => access(new URL(p, import.meta.url)).then(() => true, () => false);
/** A redirect from a path that is now a real page would hide that page (and leave a redirect in the sitemap). */
async function shadowsPage(from) {
  if (!/^\/[a-z0-9/-]*$/i.test(from)) return false;
  const base = `../src/pages${from.replace(/\/$/, '')}`;
  return (await exists(`${base}.astro`)) || (await exists(`${base}/index.astro`));
}
const all = await loadRedirects();
const redirects = [];
for (const r of all) {
  if (r.from && (await shadowsPage(r.from))) console.warn(`[redirects] skipped ${r.from} -> ${r.to}: ${r.from} is a page on this site`);
  else redirects.push(r);
}
const base = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  trailingSlash: false,
  redirects: redirects
    .filter((r) => r.from && r.to && r.from !== r.to)
    .map((r) => ({ source: r.from, destination: r.to, permanent: r.permanent !== false })),
  // /sitemap.xml is where most tools look first; serve the index there too (a rewrite, so it answers 200).
  rewrites: [{ source: '/sitemap.xml', destination: '/sitemap-index.xml' }],
  headers: [
    { source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] },
    { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/video/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
  ],
  crons: [{ path: '/api/cron/expire-jobs', schedule: '15 2 * * *' }],
};
await writeFile(new URL('../vercel.json', import.meta.url), JSON.stringify(base, null, 2) + '\n');
console.log(`[redirects] wrote vercel.json with ${base.redirects.length} redirects`);
