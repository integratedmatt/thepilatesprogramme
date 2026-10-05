/**
 * Fetches the business's Google rating and reviews from the official Google Places API (New) at build time
 * and writes src/content/seed/googleReviews.json. Without credentials it leaves the existing file untouched,
 * so the site never shows invented reviews.
 *
 *   GOOGLE_PLACES_API_KEY=... GOOGLE_PLACE_ID=... node scripts/fetch-google-reviews.mjs
 *   GOOGLE_PLACES_API_KEY=... node scripts/fetch-google-reviews.mjs --find "The Pilates Programme Altrincham"
 *
 * The Places API returns the overall rating, the total count and up to five reviews Google selects as most relevant.
 * Google requires reviews to be shown with the author's name and a Google attribution, which the site does.
 */
import { writeFile } from 'node:fs/promises';

const key = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;
const out = new URL('../src/content/seed/googleReviews.json', import.meta.url);
const findIdx = process.argv.indexOf('--find');

if (!key) { console.log('[google-reviews] GOOGLE_PLACES_API_KEY not set, skipping (no reviews shown)'); process.exit(0); }

if (findIdx > -1) {
  const query = process.argv[findIdx + 1] || 'The Pilates Programme Altrincham';
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount' },
    body: JSON.stringify({ textQuery: query, regionCode: 'GB' }),
  });
  console.log(JSON.stringify(await res.json(), null, 2));
  process.exit(0);
}

if (!placeId) { console.log('[google-reviews] GOOGLE_PLACE_ID not set. Run with --find to look it up.'); process.exit(0); }

try {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews' },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const p = await res.json();
  const data = {
    source: 'google',
    placeId,
    name: p.displayName?.text ?? '',
    rating: p.rating ?? null,
    count: p.userRatingCount ?? null,
    url: p.googleMapsUri ?? '',
    fetchedAt: new Date().toISOString(),
    reviews: (p.reviews ?? []).map((r) => ({
      author: r.authorAttribution?.displayName ?? 'Google user',
      authorUrl: r.authorAttribution?.uri ?? '',
      rating: r.rating ?? null,
      text: (r.originalText?.text ?? r.text?.text ?? '').trim(),
      publishTime: r.publishTime ?? '',
      relativeTime: r.relativePublishTimeDescription ?? '',
      url: r.googleMapsUri ?? '',
    })),
  };
  await writeFile(out, JSON.stringify(data, null, 2) + '\n');
  console.log(`[google-reviews] ${data.rating}★ from ${data.count} reviews, ${data.reviews.length} review texts saved`);
} catch (e) {
  // A failed fetch keeps the last good file rather than breaking the build.
  console.warn('[google-reviews] fetch failed, keeping previous data:', e.message);
}
