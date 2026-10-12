import { chromium } from '@playwright/test';
const out = process.argv[2];
const pages = [
  ['barre', '/become-a-pilates-instructor/barre-teacher-training'],
  ['reformer', '/become-a-pilates-instructor/reformer-pilates-teacher-training'],
  ['chair', '/continuing-education/chair'],
  ['cadillac', '/continuing-education/cadillac'],
  ['barrels', '/continuing-education/barrels'],
  ['road', '/become-a-pilates-instructor/road-to-certification'],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [vp, w, h] of [['m', 390, 844], ['d', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, path] of pages) {
    await page.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${vp}-${name}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 900) } });
  }
  await ctx.close();
}
await browser.close();
console.log('done');
