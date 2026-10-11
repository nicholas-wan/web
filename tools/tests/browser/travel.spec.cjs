const { test, expect } = require('@playwright/test');
const audit = require('./geometry.cjs');

async function settled(page) {
  // Covers the map's fly-to, fade and debounced label measurement.
  await page.waitForTimeout(700);
  expect((await page.evaluate(audit)).errors).toEqual([]);
}

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1280, 900]]) {
  test(`travel geometry at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/travel');
    await page.evaluate(() => document.fonts.ready);
    const grid = page.locator('.travel-grid');
    await grid.scrollIntoViewIfNeeded();
    expect(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width <= 320 ? 1 : width <= 1100 ? 2 : 3);
    expect(await page.locator('.travel-card').count()).toBe(10);
    if (width <= 600) {
      const card = page.locator('.travel-card').first();
      await expect(card.locator('.actions')).toBeHidden();
      const target = await card.locator('.travel-card__image').getAttribute('href');
      await card.locator('h2').click({ force: true });
      await expect(page).toHaveURL(new RegExp(target + '$'));
      await page.goBack();
    }
    if (width <= 520) await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
    await settled(page);
    const picker = page.getByRole('combobox', { name: 'Explore a trip', exact: true });
    const trips = await picker.locator('option').evaluateAll(options => options.map(o => o.value));
    for (const trip of trips) {
      await picker.selectOption(trip);
      await settled(page);
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await settled(page);
      const stop = page.locator('.travel-map__detail.is-trip-active:not(.is-label-offscreen) .travel-map__detail-label, .travel-map__label-list:not([hidden]) a').filter({ visible: true }).first();
      if (trip && await stop.count()) {
        // Keyboard activation also covers destination accessibility.
        await stop.locator('..').press('Enter');
        await expect(page.locator('[data-map-detail-card]')).toBeVisible();
        await settled(page);
        await page.getByRole('button', { name: 'Close place details', exact: true }).click();
        await settled(page);
      }
      await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
      await settled(page);
    }
    if (width <= 520) {
      await page.getByRole('button', { name: 'Close map', exact: true }).click();
      await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
      await settled(page);
      await page.setViewportSize({ width: height, height: width });
      await settled(page);
    }
  });
}

test('crowded labels retain every destination in a scrollable list', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
  // Simulate much larger destination text: the local placement search cannot fit it.
  await page.addStyleTag({ content: '.travel-map__detail-label { font-size: 80px !important; }' });
  await page.locator('#travel-map-trip').selectOption('germany');
  await settled(page);
  const list = page.locator('.travel-map__label-list');
  await expect(list).toBeVisible();
  await expect(list.locator('a')).toHaveCount(8);
  await list.locator('a').last().click();
  await expect(page.locator('[data-map-detail-card]')).toBeVisible();
  await settled(page);
});
