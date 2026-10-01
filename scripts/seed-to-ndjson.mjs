/** Converts src/content/seed/*.json into seed.ndjson for `sanity dataset import`. Reference fields become Sanity references. */
import { readFile, writeFile } from 'node:fs/promises';
const dir = new URL('../src/content/seed/', import.meta.url);
const read = async (f) => JSON.parse(await readFile(new URL(f, dir), 'utf8'));
const slug = (s) => ({ _type: 'slug', current: s });
const ref = (id) => ({ _type: 'reference', _ref: id, _key: id });
const docs = [];

const settings = await read('siteSettings.json');
delete settings.logo; // placeholder logo path; upload the real SVG in Studio
docs.push(settings);
for (const c of await read('courses.json')) {
  const { heroImage, gallery, faqs, testimonials, ...rest } = c;
  docs.push({ ...rest, slug: slug(c.slug), faqs: (faqs ?? []).map(ref), testimonials: (testimonials ?? []).map(ref), financeOptions: (c.financeOptions ?? []).map((f, i) => ({ ...f, _key: `f${i}` })), curriculum: (c.curriculum ?? []).map((g, i) => ({ ...g, _key: `c${i}` })), exams: (c.exams ?? []).map((e, i) => ({ ...e, _key: `e${i}` })) });
}
for (const d of await read('courseDates.json')) docs.push({ ...d, course: { _type: 'reference', _ref: d.course } });
for (const p of await read('pricingRules.json')) docs.push({ ...p, slug: slug(p.slug) });
for (const f of await read('faqs.json')) docs.push(f);
for (const t of await read('teamMembers.json')) docs.push({ ...t, slug: slug(t.slug) });
for (const c of await read('categories.json')) docs.push({ ...c, slug: slug(c.slug) });
for (const a of await read('authors.json')) docs.push({ ...a, slug: slug(a.slug) });
for (const p of await read('posts.json')) { const { body, image, ...rest } = p; docs.push({ ...rest, slug: slug(p.slug), bodyHtml: body, category: { _type: 'reference', _ref: p.category }, author: { _type: 'reference', _ref: p.author } }); }
for (const t of await read('testimonials.json')) docs.push(t);
for (const r of await read('redirects.json')) docs.push(r);
await writeFile(new URL('../seed.ndjson', import.meta.url), docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`[seed] wrote seed.ndjson with ${docs.length} documents`);
