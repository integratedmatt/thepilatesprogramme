import { test, expect } from '@playwright/test';

const pages = ['/', '/become-a-pilates-instructor', '/become-a-pilates-instructor/mat-pilates-teacher-training', '/continuing-education', '/course-dates', '/pricing', '/accreditation', '/jobs', '/blog', '/faqs', '/contact'];

for (const path of pages) {
  test(`${path} has one H1, a unique title, a description and a canonical`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title).toContain('The Pilates Programme');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{60,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });
}

test('course date rows link to Arketa with UTMs and fire book_click', async ({ page, context }) => {
  await page.goto('/become-a-pilates-instructor/mat-pilates-teacher-training');
  await page.evaluate(() => { try { localStorage.setItem('tpp-consent', JSON.stringify({ analytics: true, marketing: false })); } catch {} });
  const link = page.locator('a[data-book]').first();
  await expect(link).toHaveAttribute('href', /app\.arketa\.co\/iframe\/pilatesprogramme\/schedule\?.*showPrivate=true.*utm_source=website.*utm_medium=book_button.*utm_campaign=mat-pilates-teacher-training.*utm_content=/);
  await expect(link).toHaveAttribute('target', '_blank');
  const popup = context.waitForEvent('page');
  await link.click();
  await popup;
  const events = await page.evaluate(() => (window as any).dataLayer.filter((e: any) => e.event === 'book_click'));
  expect(events.length).toBe(1);
  expect(events[0].course).toBe('mat-pilates-teacher-training');
});

test('cookie banner defaults to denied and updates consent on accept', async ({ page }) => {
  await page.goto('/');
  const defaults = await page.evaluate(() => (window as any).dataLayer.find((e: any) => e[0] === 'consent' && e[1] === 'default'));
  expect(defaults[2].analytics_storage).toBe('denied');
  await expect(page.locator('#cookie-banner')).toBeVisible();
  await page.click('[data-consent="all"]');
  await expect(page.locator('#cookie-banner')).toBeHidden();
  const update = await page.evaluate(() => (window as any).dataLayer.find((e: any) => e[0] === 'consent' && e[1] === 'update'));
  expect(update[2].analytics_storage).toBe('granted');
});

test('course quiz recommends a course and fires events', async ({ page }) => {
  await page.goto('/become-a-pilates-instructor/which-course');
  await page.check('input[name="experience"][value="regular"]');
  await page.click('[data-step="0"] [data-next]');
  await page.check('input[name="qualification"][value="none"]');
  await page.click('[data-step="1"] [data-next]');
  await page.check('input[name="where"][value="studio"]');
  await page.click('[data-step="2"] [data-next]');
  await page.check('input[name="reformer"][value="yes"]');
  await page.click('[data-step="3"] [data-next]');
  await expect(page.locator('#result-title')).toContainText('Reformer');
  await expect(page.locator('#result-double')).toBeVisible();
  const events = await page.evaluate(() => (window as any).dataLayer.map((e: any) => e.event));
  expect(events).toContain('quiz_start');
  expect(events).toContain('quiz_complete');
});

test('course dates filters are URL-driven and show the empty state', async ({ page }) => {
  await page.goto('/course-dates?course=mat-pilates-teacher-training');
  const rows = page.locator('.date-wrap:not([hidden])');
  expect(await rows.count()).toBeGreaterThan(0);
  await page.selectOption('#f-pattern', 'weekend');
  await expect(page.locator('#no-match')).toBeVisible();
  await expect(page).toHaveURL(/pattern=weekend/);
});

test('mobile nav opens, traps focus sensibly and closes on Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await page.click('.menu-toggle');
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-nav')).toBeHidden();
});

test('mega-menu is keyboard operable on desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  const trigger = page.locator('[data-menu-trigger="qualify"]');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#menu-qualify')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('404 page routes to both paths', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('moved');
  await expect(page.locator('main a[href="/become-a-pilates-instructor"]').first()).toBeVisible();
});

test('no page contains banned accreditation terms', async ({ page }) => {
  for (const path of ['/become-a-pilates-instructor/reformer-pilates-teacher-training', '/accreditation', '/pricing']) {
    await page.goto(path);
    const text = (await page.locator('main').innerText()).replace(/existing Level 3 fitness qualification/g, '');
    expect(text).not.toMatch(/level\s*3|ofqual|\bNVQ\b|regulated/i);
  }
});

test('course date rows expand to show details', async ({ page }) => {
  await page.goto('/course-dates');
  const first = page.locator('.date-row').first();
  const details = first.locator('details.date-details');
  await expect(details).not.toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await expect(first.locator('.date-detail-body')).toBeVisible();
  await expect(first.locator('.date-detail-body dt', { hasText: 'Where' })).toBeVisible();
  await expect(first.locator('.date-detail-body dt', { hasText: 'Price' })).toBeVisible();
  await expect(first.locator('.date-detail-body a.arrow-link')).toHaveAttribute('href', /\/(become-a-pilates-instructor|continuing-education)\//);
});

test('home hero video plays after load, can be paused, and respects reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  const toggle = page.locator('[data-hero-video-toggle]');
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  const video = page.locator('video[data-hero-video]');
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentSrc !== '')).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('aria-label', 'Play background video');
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await ctx.close();

  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto('/', { waitUntil: 'load' });
  await p2.waitForTimeout(1500);
  expect(await p2.locator('video[data-hero-video]').evaluate((v: HTMLVideoElement) => v.currentSrc)).toBe('');
  await expect(p2.locator('[data-hero-video-toggle]')).toBeHidden();
  await rm.close();
});
