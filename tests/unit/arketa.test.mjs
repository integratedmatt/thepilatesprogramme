import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of src/lib/arketa.ts (kept in sync by the e2e test which checks rendered links).
const ARKETA_BASE = 'https://app.arketa.co/iframe/pilatesprogramme/';
function arketaUrl(path, { courseSlug, dateId }) {
  const clean = path.replace(/^\/+/, '');
  const [base, query = ''] = clean.split('?');
  const params = new URLSearchParams(query);
  if (base.startsWith('schedule') && !params.has('showPrivate')) params.set('showPrivate', 'true');
  params.set('utm_source', 'website'); params.set('utm_medium', 'book_button'); params.set('utm_campaign', courseSlug);
  if (dateId) params.set('utm_content', dateId);
  return `${ARKETA_BASE}${base}?${params.toString()}`;
}

test('schedule links get showPrivate and UTMs', () => {
  const u = new URL(arketaUrl('schedule?serviceId=2souTJywf2FNGYMw3Np9', { courseSlug: 'mat-pilates-teacher-training', dateId: 'date-mat-2026-10-27' }));
  assert.equal(u.origin + u.pathname, 'https://app.arketa.co/iframe/pilatesprogramme/schedule');
  assert.equal(u.searchParams.get('serviceId'), '2souTJywf2FNGYMw3Np9');
  assert.equal(u.searchParams.get('showPrivate'), 'true');
  assert.equal(u.searchParams.get('utm_source'), 'website');
  assert.equal(u.searchParams.get('utm_medium'), 'book_button');
  assert.equal(u.searchParams.get('utm_campaign'), 'mat-pilates-teacher-training');
  assert.equal(u.searchParams.get('utm_content'), 'date-mat-2026-10-27');
});

test('series links (online CPD) do not get showPrivate', () => {
  const u = new URL(arketaUrl('series/JgwhP1I5P1NAjOEGNOav', { courseSlug: 'jumpboard-online' }));
  assert.equal(u.pathname, '/iframe/pilatesprogramme/series/JgwhP1I5P1NAjOEGNOav');
  assert.equal(u.searchParams.get('showPrivate'), null);
  assert.equal(u.searchParams.get('utm_campaign'), 'jumpboard-online');
});
