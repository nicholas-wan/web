const { test, expect } = require('@playwright/test');

// Route stops open their photos only on journals that opt in, with exact title matching
// (18 Nov 2026: substring matching gave older journals' stops every photo of their day).

const journals = ['travel_2017_seoul', 'travel_2019_siliconvalley', 'travel_2022_europe', 'travel_2023_perth',
  'travel_2023_usacanada', 'travel_2024_australia', 'travel_2024_germany', 'travel_2025_japan', 'travel_2026_guangzhou'];

test('journals that have not opted in keep plain route stops', async ({ page }) => {
  for (const slug of journals) {
    await page.goto('/' + slug);
    await expect(page.locator('.has-photos, .has-card'), slug).toHaveCount(0);
  }
});

test('Chengdu stops own exactly their photos, count within the place and offer the next stop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const labels = await page.locator('.has-photos').evaluateAll(stops => stops.map(stop => stop.getAttribute('aria-label')));
  expect(labels).toHaveLength(20);
  expect(labels).toContain('Open the place card for Taikoo Li (4 photos)');
  expect(labels).toContain('Open the place card for Tianmen Cave (2 photos)');
  expect(labels).toContain('Open the place card for Chengdu (2 photos)');

  const day6 = page.locator('#trip-section-6 ~ .guangzhou-day__route');
  await day6.locator('.travel-route__more').click();
  await day6.getByRole('button', { name: 'Open the place card for Tianmen Cave (2 photos)' }).click();
  await page.locator('.place-card').getByRole('button', { name: 'View 2 photos', exact: true }).last().click();
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

// Place card (18 Nov 2026, mockup 6): a stop with photos or a price opens a card first. It takes
// the lightbox's one history entry and hands it on, so one Back closes whichever is showing.
const openStop = async (page, day, name) => {
  const route = page.locator('#trip-section-' + day + ' ~ .guangzhou-day__route');
  const more = route.locator('.travel-route__more');
  if (await more.isVisible()) await more.click();
  const stop = route.locator('.has-card', { hasText: name });
  await stop.click();
  return stop;
};

test('a stop with photos opens its place card, which hands its history entry to the lightbox', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const length = await page.evaluate(() => history.length);
  const stop = await openStop(page, 6, 'Tianmen Cave');
  const card = page.locator('.place-card');
  const sheet = card.getByRole('dialog', { name: 'Tianmen Cave' });
  await expect(card).toHaveClass(/is-visible/);
  await expect(sheet.locator('.place-card__meta')).toHaveText('天门洞 · Day 6 · stop 3');
  await expect(sheet.locator('.place-card__photos img')).toHaveCount(2);
  await expect(sheet.locator('.place-card__more')).toHaveText('2 photos');
  await expect(sheet.locator('dt')).toHaveText(['Price']);
  await expect(sheet.locator('dd')).toHaveText(['¥32 escalator, optional']);
  await expect(sheet.locator('.place-card__close')).toBeFocused();
  const amap = sheet.getByRole('link', { name: 'Amap' });
  const google = sheet.getByRole('link', { name: 'Google Maps' });
  await expect(amap).toHaveAttribute('href', 'https://uri.amap.com/search?keyword=' + encodeURIComponent('天门洞'));
  await expect(google).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Tianmen Cave, 天门洞'));
  for (const link of [amap, google]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  }
  expect(await page.evaluate(() => history.length)).toBe(length + 1);

  await sheet.locator('.place-card__view').click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  await expect(card).not.toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox__context')).toHaveText(/1 of 2 at Tianmen Cave · Day 6$/);
  expect(await page.evaluate(() => history.length)).toBe(length + 1);

  await page.goBack();
  await expect(viewer).not.toHaveClass(/is-visible/);
  await expect(card).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  await expect(stop).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/place-card-open|lightbox-open/);
});

test('Escape, the backdrop, the close button and Back close the place card and keep the page', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const card = page.locator('.place-card');
  const stop = await openStop(page, 4, '72 Wonder Tower');
  await expect(card.locator('dt')).toHaveText(['Price', 'Hours']);
  await expect(card.locator('.place-card__photos img')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(card).not.toHaveClass(/is-visible/);
  await expect(stop).toBeFocused();

  await stop.click();
  await expect(card).toHaveClass(/is-visible/);
  await page.mouse.click(8, 450);
  await expect(card).not.toHaveClass(/is-visible/);

  await stop.click();
  await card.getByRole('button', { name: 'Close place card' }).click();
  await expect(card).not.toHaveClass(/is-visible/);

  await stop.click();
  await page.goBack();
  await expect(card).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  // Each close stepped back over its entry, so a quick reopen stays open.
  await stop.click();
  await page.keyboard.press('Escape');
  await stop.click();
  await page.waitForTimeout(500);
  await expect(card).toHaveClass(/is-visible/);
});

test('a priced stop without photos opens a card with no photos or View button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const stop = page.locator('.has-card', { hasText: 'Bailong Elevator' });
  await expect(stop).not.toHaveClass(/has-photos/);
  await expect(stop).toHaveAttribute('aria-label', 'Open the place card for Bailong Elevator');
  await openStop(page, 5, 'Bailong Elevator');
  const card = page.locator('.place-card');
  await expect(card).toHaveClass(/is-visible/);
  await expect(card.locator('.place-card__title')).toHaveText('Bailong Elevator');
  await expect(card.locator('.place-card__photos, .place-card__view')).toHaveCount(0);
  await expect(card.locator('dd')).toHaveText(['¥65 one way']);
  await expect(card.getByRole('link')).toHaveText(['Amap', 'Google Maps']);
  // Stops with neither photos nor a price stay plain text.
  await expect(page.locator('.guangzhou-route__stop', { hasText: 'Zhangjiajie Airport' }).first()).not.toHaveAttribute('role', 'button');
});
