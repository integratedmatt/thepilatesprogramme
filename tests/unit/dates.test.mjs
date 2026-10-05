import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dates = JSON.parse(readFileSync('src/content/seed/courseDates.json', 'utf8'));
const courses = JSON.parse(readFileSync('src/content/seed/courses.json', 'utf8'));

test('every seeded date points at a seeded course and has an Arketa URL', () => {
  const ids = new Set(courses.map((c) => c._id));
  for (const d of dates) { assert.ok(ids.has(d.course), d._id); assert.match(d.arketaUrl, /^(schedule\?|series\/)/); assert.ok(d.endDate >= d.startDate); }
});

test('past dates are not rendered on the dates page', () => {
  const html = readFileSync('dist/client/course-dates/index.html', 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  for (const d of dates) {
    const present = html.includes(`data-date-id="${d._id}"`);
    if (d.endDate < today) assert.equal(present, false, `${d._id} is past but rendered`);
    else assert.equal(present, true, `${d._id} is upcoming but missing`);
  }
});

test('no course copy contains banned accreditation wording', () => {
  const text = JSON.stringify(courses);
  assert.doesNotMatch(text, /level\s*3|ofqual|\bNVQ\b|regulated/i);
});

test('google reviews seed never ships invented reviews', () => {
  const g = JSON.parse(readFileSync('src/content/seed/googleReviews.json', 'utf8'));
  for (const r of g.reviews) assert.doesNotMatch(r.text, /LAYOUT TEST|lorem|placeholder/i);
  if (g.reviews.length) assert.ok(g.fetchedAt && g.placeId, 'reviews must come from a real Places API fetch');
});
