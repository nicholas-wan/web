const { test, expect } = require('@playwright/test');
test.use({ actionTimeout: 10000 });

for (const width of [390, 1280]) {
  test(`search and discovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    const input = page.getByRole('searchbox', { name: 'Search travel photos' });
    await input.focus();
    const explore = page.locator('.photo-search__chips--explore');
    await expect(explore).toBeVisible();
    const first = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    await page.getByRole('button', { name: 'Shuffle exploration suggestions' }).click();
    const second = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    expect(second.every(tag => !first.includes(tag))).toBe(true);
    await expect(page.getByRole('button', { name: 'Shuffle exploration suggestions' })).toBeFocused();
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
