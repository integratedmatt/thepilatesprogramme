import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seed = JSON.parse(readFileSync('src/content/seed/redirects.json', 'utf8'));
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const expected = {
  '/uk-pilates-barre-instructor-courses': '/become-a-pilates-instructor',
  '/mat-pilates-course': '/become-a-pilates-instructor/mat-pilates-teacher-training',
  '/reformer-pilates-course': '/become-a-pilates-instructor/reformer-pilates-teacher-training',
  '/barre-course': '/become-a-pilates-instructor/barre-teacher-training',
  '/advanced-reformer-pilates-course-1': '/continuing-education/advanced-reformer',
  '/chair-pilates-course': '/continuing-education/chair',
  '/cadillac-pilates-course': '/continuing-education/cadillac',
  '/barrel-pilates-course': '/continuing-education/barrels',
  '/uk-pilates-cpd-courses': '/continuing-education/cpd',
  '/prenatalandpostpartumcpd': '/continuing-education/cpd/prenatal-postpartum',
  '/strengthandendurancecpd': '/continuing-education/cpd/strength-endurance',
  '/jumpboard': '/continuing-education/cpd/jumpboard-online',
  '/painscience': '/continuing-education/cpd/pain-science',
  // '/about' -> '/training-centre' is deliberately absent: /about is now a page, and the redirect hid it.
  '/elevatingothers': '/elevating-others',
};

test('all Section 5.1 redirects are in the seed and in vercel.json as 301s', () => {
  for (const [from, to] of Object.entries(expected)) {
    const s = seed.find((r) => r.from === from);
    assert.ok(s, `seed missing ${from}`); assert.equal(s.to, to); assert.equal(s.permanent, true);
    const v = vercel.redirects.find((r) => r.source === from);
    assert.ok(v, `vercel.json missing ${from}`); assert.equal(v.destination, to); assert.equal(v.permanent, true);
  }
});

test('no redirect hides a page on this site', () => {
  for (const r of vercel.redirects) {
    for (const p of [`src/pages${r.source}.astro`, `src/pages${r.source}/index.astro`]) {
      assert.throws(() => readFileSync(p), `${r.source} redirects but ${p} exists`);
    }
  }
});

test('every redirect target exists as a built page', () => {
  for (const r of vercel.redirects) {
    const dest = r.destination.replace(/#.*$/, ''); // a fragment (e.g. /about#training-centre) still targets a built page
    const p = dest === '/' ? 'dist/client/index.html' : `dist/client${dest}/index.html`;
    assert.doesNotThrow(() => readFileSync(p), `${r.destination} not built`);
  }
});
