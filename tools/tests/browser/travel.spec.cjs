const { test, expect } = require('@playwright/test');
const audit = require('./geometry.cjs');

// Each geometry check has its own page and viewport; split the long trip sweeps
// across workers instead of running every viewport in one worker.
test.describe.configure({ mode: 'parallel' });

async function settled(page) {
  await expect(page.locator('.travel-map__canvas')).toHaveAttribute('data-map-detail', /^(region|area|stop)$/);
  // Covers the map's fly-to, fade and debounced label measurement: wait until the
  // map has stopped interacting and no label, list entry or card has moved or
  // faded for 400 ms, instead of a fixed 700 ms. The map's longest timer is
  // finishFullscreenClose's 220 ms. Gives up after 10 s, naming what still moved.
  await page.evaluate(() => new Promise((resolve, reject) => {
    const viewport = document.querySelector('.travel-map__viewport');
    if (!viewport) { reject(new Error('settled(): the page has no .travel-map__viewport')); return; }
    const snapshot = () => [viewport.classList.contains('is-map-interacting') ? 'map viewport still has is-map-interacting' : '', ...[...document.querySelectorAll('.travel-map__detail-label, .travel-map__place, .travel-map__label-list a, [data-map-detail-card]')].map(el => {
      const box = el.getBoundingClientRect();
      return `${el.className} "${(el.textContent || '').trim().slice(0, 40)}" ${box.left} ${box.top} ${box.width} ${box.height} ${getComputedStyle(el).opacity} ${el.hidden}`;
    })];
    const start = performance.now();
    let last = snapshot(), since = start, changed = 'nothing';
    const tick = () => {
      const now = performance.now(), current = snapshot();
      if (current.join('|') !== last.join('|')) {
        const index = current.findIndex((entry, i) => entry !== last[i]);
        changed = current[0] || (index < 0 ? `the number of map elements (${last.length - 1} to ${current.length - 1})` : `${last[index] || '(none)'} -> ${current[index]}`);
        last = current; since = now;
      }
      if (!current[0] && now - since >= 400) resolve();
      else if (now - start >= 10000) reject(new Error(`settled(): the map did not stay still for 400 ms within 10 s; last change: ${current[0] || changed}`));
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  expect((await page.evaluate(audit)).errors).toEqual([]);
}

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1280, 900]]) {
  test(`travel geometry at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/travel');
    await page.evaluate(() => document.fonts.ready);
    const grid = page.locator(width<=736?'.mobile-journal-list':'.travel-grid');
    await grid.scrollIntoViewIfNeeded();
    if(width>736) expect(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width>=1100?3:1);
    else await expect(grid.locator('.mobile-journal-row')).toHaveCount(10);
    expect(await page.locator('.travel-card').count()).toBe(10);
    if (width <= 600) {
      const card = page.locator('.mobile-journal-card').first();
      await expect(card.locator('.actions')).toBeHidden();
      const target = await card.locator('.travel-card__image').getAttribute('href');
      await card.locator('.travel-card__image').click();
      await expect(page).toHaveURL(new RegExp(target + '$'));
      await page.goBack();
    }
    if (width <= 520) await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
    else await page.locator('.travel-map__viewport').scrollIntoViewIfNeeded();
    await settled(page);
    const picker = page.getByRole('combobox', { name: 'Explore a trip', exact: true });
    const trips = await picker.locator('option').evaluateAll(options => options.map(o => o.value));
    for (const trip of trips) {
      await picker.selectOption(trip);
      await settled(page);
      const zoomIn = page.getByRole('button', { name: 'Zoom in', exact: true });
      // A tightly clustered trip may already fit at the maximum zoom.
      if (await zoomIn.isEnabled()) await zoomIn.click();
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

// The opening view used to skip collision layout entirely: Chengdu hid Korea.
for (const width of [600, 768, 1024, 1280, 1920]) {
  test(`opening atlas keeps every region label clear at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/travel');
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: 'Reset map view', exact: true }).click();
    await settled(page);
    expect((await page.evaluate(audit)).labels).toBe(12);
    await expect(page.locator('.travel-map__marker--guangzhou .travel-map__place')).toHaveText('Guangzhou');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Reset map view', exact: true }).click();
    await settled(page);
    expect((await page.evaluate(audit)).labels).toBe(12);
  });
}
