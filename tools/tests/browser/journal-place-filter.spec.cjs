const { test, expect } = require('@playwright/test');

// Place chips filter a day's photos (18 Nov 2026), on journals that opt in with data-route-photos.
// The phone counter and arrows follow the visible tiles; desktop grid tiles reflow.

const day6 = page => page.locator('#trip-section-6 ~ .journal-gallery-shell');

test('Chengdu Day 6 filters its photos by place on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const shell = day6(page);
  const chips = shell.locator('.journal-place-filter button');
  await expect(chips).toHaveText(['All 11', 'Grand Canyon Glass Bridge 1', 'Tianmen Mountain 4', 'Tianmen Cave 2', 'Glass Skywalk 2', 'Dayong Bridge Park 2']);
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

test('at 320px All stays in view once the place chips scroll, and every chip is a 44px target', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
    viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const shell = day6(page);
  await shell.locator('.journal-place-filter').scrollIntoViewIfNeeded();
  const row = shell.locator('.journal-place-filter__places');
  await row.evaluate(node => { node.scrollLeft = node.scrollWidth; });
  const cave = shell.locator('.journal-place-filter button', { hasText: 'Tianmen Cave' });
  await cave.tap();
  await expect(cave).toHaveAttribute('aria-pressed', 'true');
  expect(await row.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  const all = shell.locator('.journal-place-filter button', { hasText: 'All' });
  // All is on screen, uncovered, and still works.
  const hit = await all.evaluate(node => {
    const box = node.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { left: box.left, right: box.right, own: node === top || node.contains(top) };
  });
  expect(hit.left).toBeGreaterThanOrEqual(8);
  expect(hit.right).toBeLessThan(320);
  expect(hit.own).toBe(true);
  // Slim text tabs that are real 44px targets on phones: a tap 21px above or below the middle lands on the tab.
  const targets = await shell.locator('.journal-place-filter button').evaluateAll(chips => chips.map(chip => {
    const box = chip.getBoundingClientRect();
    const port = chip.parentNode.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const at = y => { const found = document.elementFromPoint(x, y); return found && found.closest('button') === chip; };
    return { height: box.height, visible: box.left >= port.left && box.right <= Math.min(port.right, innerWidth), reach: at(box.top + box.height / 2 - 21.75) && at(box.top + box.height / 2 + 21.75) };
  }));
  expect(targets.filter(target => target.visible).length).toBeGreaterThan(1);
  for (const target of targets.filter(target => target.visible)) {
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.reach).toBe(true);
  }
  await all.tap();
  await expect(shell.locator('.brick:visible')).toHaveCount(11);
  await context.close();
});

// Fix round 3 (18 Nov 2026 review): a chosen tab could sit half off-screen (Day 6's Tianmen Cave).
test('a chosen place tab scrolls wholly into view, clear of the fade at All', async ({ browser }) => {
  for (const [width, height] of [[390, 844], [320, 640]]) {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
      viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/travel_2026_chengdu_zhangjiajie');
    const shell = day6(page);
    await shell.locator('.journal-place-filter').scrollIntoViewIfNeeded();
    const row = shell.locator('.journal-place-filter__places');
    const chips = row.locator('button');
    const count = await chips.count();
    // Left to right, then back to the first place.
    for (const at of [...Array(count).keys(), 0]) {
      await chips.nth(at).tap();
      await expect(chips.nth(at)).toHaveAttribute('aria-pressed', 'true');
      const fit = await chips.nth(at).evaluate(chip => {
        const port = chip.parentNode.getBoundingClientRect();
        const box = chip.getBoundingClientRect();
        // Once scrolled, the row fades over its first 2rem.
        const clear = port.left + (chip.parentNode.scrollLeft > 2 ? 30 : 0);
        return { left: box.left >= clear - 1, right: box.right <= Math.min(port.right, innerWidth) + 1 };
      });
      expect(fit, width + 'px tab ' + at).toEqual({ left: true, right: true });
    }
    await context.close();
  }
});

// Fix round 3: a gallery of one photo showed "1 / 1" beside two dead arrows.
test('phone galleries of a single photo have no counter or arrows; a one-photo place tab keeps them', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const shells = await page.locator('.journal-gallery-shell').evaluateAll(nodes => nodes.map(node => ({
    tiles: node.querySelectorAll('.brick').length,
    controls: node.querySelectorAll('.journal-gallery-controls').length
  })));
  expect(shells.some(shell => shell.tiles === 1)).toBe(true);
  for (const shell of shells) expect(shell.controls).toBe(shell.tiles > 1 ? 1 : 0);
  await expect(page.locator('#trip-section-1 ~ .journal-gallery-shell .journal-gallery-controls')).toHaveCount(0);

  // Filtering down to one photo keeps the row, so the gallery does not jump between tabs.
  const shell = day6(page);
  await shell.scrollIntoViewIfNeeded();
  const single = shell.locator('.journal-place-filter__places button').filter({ has: page.locator('span', { hasText: /^1$/ }) }).first();
  await single.click();
  await expect(shell.locator('.brick:visible')).toHaveCount(1);
  await expect(shell.locator('.journal-gallery-count')).toHaveText('1 / 1');
  await expect(shell.locator('.journal-gallery-controls')).toBeVisible();
});
