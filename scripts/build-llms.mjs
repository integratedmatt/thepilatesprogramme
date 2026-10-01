/** Generates public/llms.txt from content so AI engines get courses, prices, location and key URLs. */
import { readFile, writeFile } from 'node:fs/promises';

const site = process.env.PUBLIC_SITE_URL || 'https://www.thepilatesprogramme.co.uk';
const read = async (f) => JSON.parse(await readFile(new URL(`../src/content/seed/${f}`, import.meta.url), 'utf8'));
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2026-10-01';

async function groq(query, fallback) {
  if (!projectId) return fallback;
  try {
    const res = await fetch(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`);
    if (res.ok) { const j = await res.json(); if (j.result) return j.result; }
  } catch {}
  return fallback;
}

const settings = await groq('*[_type=="siteSettings"][0]', await read('siteSettings.json'));
const courses = await groq('*[_type in ["course","cpd"]] | order(order asc){title, "slug": slug.current, path, kind, price, format, answerSummary, prerequisites}', await read('courses.json'));
const url = (c) => c.path === 'qualify' ? `${site}/become-a-pilates-instructor/${c.slug}` : c.kind === 'cpd' ? `${site}/continuing-education/cpd/${c.slug}` : `${site}/continuing-education/${c.slug}`;
const gbp = (n) => n == null ? 'Price on request' : `£${Number(n).toLocaleString('en-GB')}`;

const lines = [
  `# ${settings.entityName}`,
  '',
  `> ${settings.tagline}`,
  '',
  `Training centre: ${settings.address.street}, ${settings.address.town}, ${settings.address.postcode}, UK. Email: ${settings.email}.`,
  'Accreditation: internationally accredited by ITTAP through the Pilates Method Alliance (PMA); CIMSPA Training Partner.',
  'Not to be confused with the Irish on-demand app of a similar name. This is the Altrincham, Greater Manchester teacher training provider.',
  '',
  '## Teacher training (qualify)',
  ...courses.filter((c) => c.path === 'qualify').map((c) => `- [${c.title}](${url(c)}): ${gbp(c.price)}. ${c.answerSummary}`),
  '',
  '## Continuing education (qualified teachers)',
  ...courses.filter((c) => c.path === 'continue').map((c) => `- [${c.title}](${url(c)}): ${gbp(c.price)}${c.prerequisites?.length ? ` (prerequisite: ${c.prerequisites.join('; ')})` : ''}. ${c.answerSummary}`),
  '',
  '## Key pages',
  `- [How to become a Pilates instructor in Manchester](${site}/become-a-pilates-instructor)`,
  `- [Course dates](${site}/course-dates)`,
  `- [Pricing](${site}/pricing)`,
  `- [Accreditation](${site}/accreditation)`,
  `- [Road to Certification](${site}/become-a-pilates-instructor/road-to-certification)`,
  `- [Jobs board](${site}/jobs)`,
  `- [Graduates](${site}/graduates)`,
  `- [Training centre](${site}/training-centre)`,
  `- [Journal](${site}/blog)`,
  `- [FAQs](${site}/faqs)`,
  '',
];
await writeFile(new URL('../public/llms.txt', import.meta.url), lines.join('\n'));
console.log('[llms] wrote public/llms.txt');
