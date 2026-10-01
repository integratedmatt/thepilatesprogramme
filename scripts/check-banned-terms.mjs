/**
 * Fails the build if any built page contains "Level 3", "Ofqual", "NVQ" or "regulated" outside the allowlist.
 * Allowlist: exact phrases in scripts/banned-terms.allowlist.json (the fitness qualification discount sentence).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2] || 'dist';
const allowlist = JSON.parse(await readFile(new URL('./banned-terms.allowlist.json', import.meta.url), 'utf8'));
const banned = [/level\s*3/gi, /ofqual/gi, /\bNVQ\b/g, /regulated/gi];

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
if (failures) { console.error(`\n${failures} banned-term match(es). See Section 2.4 of the spec.`); process.exit(1); }
console.log('✓ No banned accreditation terms found.');
