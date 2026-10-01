/**
 * Structured data check across the built site (or a preview URL via BASE_URL).
 * Verifies each JSON-LD block parses and that required types/fields are present per page type.
 * For Google's Rich Results Test run `BASE_URL=https://preview... npm run test:schema` and inspect the summary.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.env.BASE_URL;
const required = {
  '/': ['EducationalOrganization'],
  '/become-a-pilates-instructor/mat-pilates-teacher-training': ['Course', 'FAQPage', 'BreadcrumbList'],
  '/continuing-education/chair': ['Course', 'BreadcrumbList'],
  '/course-dates': ['Course'],
  '/faqs': ['FAQPage'],
  '/blog/how-to-become-a-pilates-instructor-uk': ['Article', 'BreadcrumbList'],
  '/training-centre': ['LocalBusiness'],
};

async function html(path) {
  if (base) return (await fetch(`${base}${path}`)).text();
  const file = path === '/' ? 'dist/client/index.html' : join('dist/client', path, 'index.html');
  try { return await readFile(file, 'utf8'); } catch { return readFile(join('dist/client', `${path}.html`), 'utf8'); }
}

let failures = 0;
for (const [path, types] of Object.entries(required)) {
  let text;
  try { text = await html(path); } catch (e) { console.error(`✗ ${path}: could not load (${e.message})`); failures++; continue; }
  const blocks = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const found = new Set();
  for (const b of blocks) {
    try {
      const j = JSON.parse(b);
      const list = Array.isArray(j) ? j : [j];
      for (const item of list) { const t = item['@type']; (Array.isArray(t) ? t : [t]).forEach((x) => found.add(x)); }
      for (const item of list) {
        if (item['@type'] === 'Course' && !(item.name && item.description && item.provider)) throw new Error('Course missing name/description/provider');
        if (item['@type'] === 'Article' && !(item.headline && item.datePublished && item.author?.name)) throw new Error('Article missing headline/datePublished/author');
        if (item['@type'] === 'JobPosting' && !(item.title && item.datePosted && item.hiringOrganization && item.jobLocation)) throw new Error('JobPosting missing required fields');
        if (item['@type'] === 'FAQPage' && !item.mainEntity?.length) throw new Error('FAQPage has no questions');
      }
    } catch (e) { console.error(`✗ ${path}: invalid JSON-LD: ${e.message}`); failures++; }
  }
  const missing = types.filter((t) => !found.has(t));
  if (missing.length) { console.error(`✗ ${path}: missing ${missing.join(', ')} (found: ${[...found].join(', ')})`); failures++; }
  else console.log(`✓ ${path}: ${[...found].join(', ')}`);
}
if (failures) process.exit(1);
console.log('✓ Structured data present and parseable.');
