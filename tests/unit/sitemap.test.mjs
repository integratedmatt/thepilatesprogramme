import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sitemap.xml is a conventional urlset listing every page, and robots.txt points to it', () => {
  const xml = readFileSync('dist/client/sitemap.xml', 'utf8');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.doesNotMatch(xml, /xml-stylesheet|sitemapindex/);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 30, `only ${locs.length} URLs`);
  assert.ok(locs.every((u) => u.startsWith('https://www.thepilatesprogramme.co.uk/')));
  assert.ok(locs.includes('https://www.thepilatesprogramme.co.uk/'));
  assert.match(readFileSync('public/robots.txt', 'utf8'), /^Sitemap: https:\/\/www\.thepilatesprogramme\.co\.uk\/sitemap\.xml$/m);
});
