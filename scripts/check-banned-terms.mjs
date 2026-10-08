/**
 * Fails the build if any built page contains wording the client has ruled out.
 *
 * Section 2.4 of the spec: "Level 3", "Ofqual", "NVQ" or "regulated" (TPP courses are not Ofqual-regulated).
 * Client feedback, 8 Oct 2026 (claude/2026-10-08_tpp-website-feedback-sarah.md):
 *   - "qualify" / "qualification" for TPP courses: they are certifications. Use certify, certification, certified.
 *   - "80 hours" and "supported hours": the hours are 30 observation, 25 personal study and 25 practice teaching,
 *     completed independently. List them separately.
 *   - "eight weeks" / "8-week": time to certify is usually around 6 months, anywhere from 3 to 12.
 *   - "This isn't for you": positive framing only.
 *   - "Zoom" and "random exercises": the exams are "all online"; the practical is a 45-minute class.
 *   - "welcome trainees": studios do not routinely welcome trainees to observe or cover; say "ask your local studio".
 *   - "£5": the equipment hire price is not published.
 *
 * Allowlist: exact phrases in scripts/banned-terms.allowlist.json (the fitness qualification discount sentence
 * is about the student's prior award, and "qualified teachers from any provider" refers to other schools' graduates).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2] || 'dist';
const allowlist = JSON.parse(await readFile(new URL('./banned-terms.allowlist.json', import.meta.url), 'utf8'));
const banned = [
  /level\s*3/gi, /ofqual/gi, /\bNVQ\b/g, /regulated/gi,
  /qualif/gi,
  /\b80\s*(practice\s*|supported\s*)?hours?\b/gi, /supported\s*(practice\s*)?hours?/gi,
  /\beight\s*weeks?\b/gi, /\b8[\s-]*weeks?\b/gi,
  /isn['’]t for you/gi, /not for you if/gi,
  /\bZoom\b/g, /random exercises?/gi,
  /welcome trainees/gi,
  /£5\b(?![\d,])/g,
];

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html') || e.name === 'llms.txt') yield p;
  }
}

let failures = 0;
for await (const file of walk(dir)) {
  let text = (await readFile(file, 'utf8')).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  for (const phrase of allowlist) text = text.split(phrase).join(' ');
  for (const re of banned) {
    const m = text.match(re);
    if (m) {
      failures++;
      const i = text.search(re);
      console.error(`✗ ${file}: "${m[0]}" …${text.slice(Math.max(0, i - 80), i + 80)}…`);
    }
  }
}
if (failures) { console.error(`\n${failures} banned-term match(es). See the header of scripts/check-banned-terms.mjs for the rules.`); process.exit(1); }
console.log('✓ No banned terms found.');
