import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('tpp-consent', JSON.stringify({ analytics: true, marketing: true, ts: Date.now() })); } catch {} });
await page.goto('http://localhost:4321/become-a-pilates-instructor/mat-pilates-teacher-training', { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo(0, 1400)); await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  // Find whatever fixed element sits near the bottom-centre of the viewport apart from the sticky bar.
  const found = [];
  const walk = (root) => { for (const el of root.querySelectorAll('*')) { const cs = getComputedStyle(el); if (cs.position === 'fixed') { const r = el.getBoundingClientRect(); if (r.height > 0 && r.y > innerHeight - 200) found.push({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0, 60), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], z: cs.zIndex, bottom: cs.bottom, inShadow: root !== document }); } if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  return found;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
