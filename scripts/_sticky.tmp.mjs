import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, w, h, path] of [['mat-390', 390, 844, '/become-a-pilates-instructor/mat-pilates-teacher-training'], ['reformer-360', 360, 740, '/become-a-pilates-instructor/reformer-pilates-teacher-training']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('tpp-consent', JSON.stringify({ analytics: true, marketing: true, ts: Date.now() })); } catch {} });
  await page.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '#dev-toolbar-root, astro-dev-toolbar { display: none !important; }' });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/sticky-v3-${name}.png`, clip: { x: 0, y: h - 130, width: w, height: 130 } });
  const r = await page.evaluate(() => { const b = document.getElementById('sticky-bar').getBoundingClientRect(); const n = document.querySelector('.sticky-next').getBoundingClientRect(); const btn = document.querySelector('#sticky-bar .btn').getBoundingClientRect(); return { bar: [b.y, b.height], nextRight: n.right, btnLeft: btn.x, vh: innerHeight }; });
  console.log(name, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
