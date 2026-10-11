const { test, expect } = require('@playwright/test');
test.use({ actionTimeout: 10000 });

for (const width of [390, 1280]) {
  test(`search and discovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    const input = page.getByRole('searchbox', { name: 'Search travel photos' });
    const explore = page.locator('.photo-explore__cards');
    await expect(explore).toBeVisible();
    await expect(explore.locator('[data-tag]')).toHaveCount(6);
    expect(await page.locator('script[src*="photo-search"]').count()).toBe(0);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('photo-index.json')))).toBe(false);
    const first = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    await page.getByRole('button', { name: 'Another mix' }).click();
    await expect(page.locator('#photo-search-status')).toHaveText('Six new photo topics to explore.');
    const second = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    expect(second.every(tag => !first.includes(tag))).toBe(true);
    await expect(page.getByRole('button', { name: 'Another mix' })).toBeFocused();
    await explore.locator('[data-tag]').first().click();
    await expect(page.locator('.photo-hit').first()).toBeVisible();
    await page.locator('.photo-search__clear').click();
    await input.fill('mount f');
    const fuji = page.locator('.photo-search__suggest [data-tag="mount fuji"]');
    await expect(fuji).toBeVisible();
    await fuji.click();
    await expect(input).toHaveValue('mount fuji ');
    await expect(page).toHaveURL(/q=mount\+fuji/);
    await expect(page.locator('.travel-atlas__layout')).toHaveAttribute('inert', '');
    await input.fill('zoo');
    await expect(page.locator('.photo-results__more')).toBeVisible();
    await page.locator('.photo-results__more').click();
    await expect(page.locator('.photo-hit')).toHaveCount(96);
    await expect(page.locator('.photo-hit').nth(48)).toBeFocused();
    await page.locator('[data-trip]').first().click();
    await expect(page.locator('[data-trip][aria-pressed="true"]')).toHaveCount(1);
    await input.press('Escape');
    await expect(page.locator('#photo-results')).toBeHidden();
    await expect(page.locator('.travel-atlas__layout')).not.toHaveAttribute('inert');
    await input.fill('qzxqzxqzx');
    await expect(page.locator('.photo-results__empty')).toBeVisible();
    await expect(page.locator('#photo-search-status')).toContainText('No photos');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await input.fill('red panda');
    await expect(page.locator('.photo-hit').first()).toBeVisible();
    await input.press('ArrowDown');
    await expect(page.locator('.photo-hit').first()).toBeFocused();
    await page.locator('.photo-hit').first().click();
    await expect(page).toHaveURL(/#photo=/);
    await expect(page.locator('.lightbox')).toBeVisible({ timeout: 15000 });
  });
}

test('index failure is visible even with an empty field', async ({ page }) => {
  await page.route('**/photo-index.json*', route => route.abort());
  await page.goto('/travel');
  await page.getByRole('searchbox').focus();
  await expect(page.locator('#photo-search-status')).toHaveText('Photo search is unavailable right now.');
  await expect(page.locator('.travel-grid')).toBeVisible();
});

test('cold postcard click survives a delayed index, reload avoids its previous topics', async ({ page }) => {
  await page.route('**/photo-index.json*', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/travel');
  const cards = page.locator('.photo-explore__cards [data-tag]');
  const first = await cards.evaluateAll(es => es.map(e => e.dataset.tag));
  await page.reload();
  const next = await cards.evaluateAll(es => es.map(e => e.dataset.tag));
  expect(next.length).toBe(6);
  expect(next.every(tag => !first.includes(tag))).toBe(true);
  await cards.first().click();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page.locator('.photo-hit').first()).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveValue(next[0]);
});

test('Surprise me previews real moments, changes trips, and returns focus at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Surprise me' }).click();
  await expect(page.locator('#photo-moment')).toBeVisible();
  await expect(page.locator('#photo-moment-title')).toBeFocused();
  const first = await page.locator('.photo-moment__image').getAttribute('href');
  expect(first).toMatch(/^travel_.+#photo=.+/);
  const day = await page.getByRole('link', { name: 'Read this day' }).getAttribute('href');
  expect(day).toMatch(/^travel_.+#trip-section-\d+/);
  await page.getByRole('button', { name: 'Another moment' }).click();
  const next = await page.locator('.photo-moment__image').getAttribute('href');
  expect(next.split('#')[0]).not.toBe(first.split('#')[0]);
  await expect(page.getByRole('button', { name: 'Another moment' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Back to exploring' }).click();
  await expect(page.locator('#photo-moment')).toBeHidden();
  await expect(page.locator('.photo-explore__cards [data-tag]')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Surprise me' })).toBeFocused();
});

test('postcards and journal links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/travel');
  await expect(page.locator('.photo-explore__card')).toHaveCount(6);
  await expect(page.locator('.photo-explore__card').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Surprise me' })).toHaveCount(0);
  await expect(page.locator('.travel-grid')).toBeVisible();
  await context.close();
});

test('corrupt recent storage, IME composition and restored URL queries', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('photo-search-recent', '{}'));
  await page.goto('/travel?q=penguin');
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await page.locator('#photo-search-input').evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = '京都';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/q=penguin/);
  await page.locator('#photo-search-input').evaluate(input => input.dispatchEvent(new CompositionEvent('compositionend')));
  await expect(page).toHaveURL(/q=%E4%BA%AC%E9%83%BD/);
  await expect(page.locator('.photo-hit').first()).toBeVisible();
});

test('layout and child scrolls cannot cancel a photo landing; visitor input still can', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const timer = setInterval(() => {
      const strip = document.querySelector('.travel-jump-groups');
      if (strip) strip.dispatchEvent(new Event('scroll'));
      // Simulate browser scroll anchoring while a cold layout is settling.
      window.scrollBy(0, 1);
    }, 50);
    setTimeout(() => clearInterval(timer), 6000);
  });
  const url = '/travel_2026_chengdu_zhangjiajie#photo=2026_chengdu_zhangjiajie/day2/red-panda-bamboo';
  await page.goto(url);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false', { timeout: 15000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForTimeout(5500);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
});

test('pending input cannot paginate stale hits', async ({ page }) => {
  await page.goto('/travel?q=zoo');
  await expect(page.locator('.photo-results__more')).toBeVisible();
  await page.locator('#photo-search-input').evaluate(input => {
    input.value = 'penguin';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.photo-results__more').click();
  });
  await expect(page).toHaveURL(/q=penguin/);
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  expect(await page.locator('.photo-hit').count()).toBeLessThanOrEqual(48);
});

test('long recent queries stay inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('photo-search-recent', JSON.stringify(['panda '.repeat(25)])));
  await page.goto('/travel');
  await page.getByRole('searchbox').focus();
  const recent = page.locator('.photo-search__chips--recent [data-tag]');
  await expect(recent).toBeVisible();
  const box = await recent.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(390);
});
