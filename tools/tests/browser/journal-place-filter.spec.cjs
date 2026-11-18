const { test, expect } = require('@playwright/test');

// Place chips filter a day's photos (18 Nov 2026), on journals that opt in with data-route-photos.
// The phone counter and arrows follow the visible tiles; desktop grid tiles reflow.

const day6 = page => page.locator('#trip-section-6 ~ .journal-gallery-shell');

test('Chengdu Day 6 filters its photos by place on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const shell = day6(page);
  const chips = shell.locator('.journal-place-filter button');
  await expect(chips).toHaveText(['All 11', 'Zhangjiajie Glass Bridge 1', 'Tianmen Cableway 1', 'Tianmen Cave 2', 'Skywalk 2']);
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  const tiles = shell.locator('.brick:visible');
  const counter = shell.locator('.journal-gallery-count');
  const next = shell.getByRole('button', { name: 'Next photo' });
  const gallery = shell.locator('.masonry');

  await shell.scrollIntoViewIfNeeded();
  await next.click();
  await next.click();
  await expect(counter).toHaveText('3 / 11');

  await chips.filter({ hasText: 'Tianmen Cave' }).click();
  await expect(chips.filter({ hasText: 'Tianmen Cave' })).toHaveAttribute('aria-pressed', 'true');
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'false');
  await expect(tiles).toHaveCount(2);
  await expect(tiles.locator('.content-title')).toHaveText(['Tianmen Cave', 'Tianmen Cave']);
  await expect(gallery).toHaveAttribute('aria-label', '2 photos');
  await expect(counter).toHaveText('1 / 2');
  expect(await gallery.evaluate(node => node.scrollLeft)).toBe(0);
  await expect(shell.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
  await next.click();
  await expect(counter).toHaveText('2 / 2');
  await expect(next).toBeDisabled();

  await chips.first().click();
  await expect(tiles).toHaveCount(11);
  await expect(counter).toHaveText('1 / 11');
  await expect(gallery).toHaveAttribute('aria-label', '11 photos');
});

test('desktop filtered tiles reflow from the first grid cell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const shell = day6(page);
  await shell.scrollIntoViewIfNeeded();
  await shell.locator('.journal-place-filter button', { hasText: 'Skywalk' }).click();
  const boxes = await shell.locator('.brick:visible').evaluateAll(tiles => tiles.map(tile => tile.getBoundingClientRect().toJSON()));
  const grid = await shell.locator('.masonry').evaluate(node => node.getBoundingClientRect().toJSON());
  expect(boxes).toHaveLength(2);
  expect(Math.abs(boxes[0].left - grid.left)).toBeLessThan(1);
  expect(Math.abs(boxes[0].top - grid.top)).toBeLessThan(1);
  expect(Math.abs(boxes[1].top - boxes[0].top)).toBeLessThan(1);
  expect(boxes[1].left).toBeGreaterThan(boxes[0].right);
  expect(boxes[1].left - boxes[0].right).toBeLessThan(20);
});

test('days with photos at fewer than two places, and journals not opted in, get no chips', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const rows = await page.locator('.journal-place-filter').evaluateAll(filters => filters.map(filter => filter.closest('section').querySelector('h2').id));
  expect(rows).not.toContain('trip-section-1');
  expect(rows).toContain('trip-section-6');
  for (const slug of ['travel_2025_japan', 'travel_2026_guangzhou']) {
    await page.goto('/' + slug);
    await expect(page.locator('.journal-gallery-shell').first()).toBeAttached();
    await expect(page.locator('.journal-place-filter'), slug).toHaveCount(0);
  }
});
