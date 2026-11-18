const { test, expect } = require('@playwright/test');

// Route stops open their photos only on journals that opt in, with exact title matching
// (18 Nov 2026: substring matching gave older journals' stops every photo of their day).

const journals = ['travel_2017_seoul', 'travel_2019_siliconvalley', 'travel_2022_europe', 'travel_2023_perth',
  'travel_2023_usacanada', 'travel_2024_australia', 'travel_2024_germany', 'travel_2025_japan', 'travel_2026_guangzhou'];

test('journals that have not opted in keep plain route stops', async ({ page }) => {
  for (const slug of journals) {
    await page.goto('/' + slug);
    await expect(page.locator('.has-photos'), slug).toHaveCount(0);
  }
});

test('Chengdu stops own exactly their photos, count within the place and offer the next stop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const labels = await page.locator('.has-photos').evaluateAll(stops => stops.map(stop => stop.getAttribute('aria-label')));
  expect(labels).toHaveLength(20);
  expect(labels).toContain('View 4 photos of Taikoo Li');
  expect(labels).toContain('View 2 photos of Tianmen Cave');
  expect(labels).toContain('View 2 photos of Chengdu');

  const day6 = page.locator('#trip-section-6 ~ .guangzhou-day__route');
  await day6.locator('.travel-route__more').click();
  await day6.getByRole('button', { name: 'View 2 photos of Tianmen Cave' }).click();
  const context = page.locator('.lightbox__context');
  await expect(context).toHaveText(/1 of 2 at Tianmen Cave · Day 6$/);
  await expect(page.locator('.lightbox__place-thumb')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next media', exact: true }).click();
  await expect(context).toHaveText(/2 of 2 at Tianmen Cave · Day 6$/);
  await page.getByRole('button', { name: 'Next stop: Skywalk' }).click();
  await expect(context).toHaveText(/1 of 2 at Skywalk · Day 6$/);
});

test('Back closes the lightbox, keeps the page and its scroll, and a quick reopen stays open', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tile = page.locator('#main .content').nth(5);
  await tile.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await tile.click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  await page.goBack();
  await expect(viewer).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  expect(await page.evaluate(() => scrollY)).toBe(y);

  await tile.click();
  await expect(viewer).toHaveClass(/is-visible/);
  await page.evaluate(() => { document.querySelector('.lightbox__close').click(); document.querySelectorAll('#main .content')[5].click(); });
  await page.waitForTimeout(500);
  await expect(viewer).toHaveClass(/is-visible/);
});
