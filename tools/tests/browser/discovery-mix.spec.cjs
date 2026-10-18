const { test, expect } = require('@playwright/test');

async function prepare(page, motion = 'reduce') {
  await page.emulateMedia({ reducedMotion: motion });
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.pendingMixImages = [];
    HTMLImageElement.prototype.decode = function () {
      if (this.isConnected) return decode.call(this);
      return new Promise((resolve, reject) => window.pendingMixImages.push({ resolve, reject }));
    };
    window.mixAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (this.closest('.photo-explore__cards')) window.mixAnimations.push(options.duration);
      return animate.call(this, frames, options);
    };
  });
  await page.goto('/travel');
  await page.getByRole('searchbox').focus();
  await expect(page.locator('#photo-search')).not.toHaveAttribute('aria-busy');
  // Wait for the lazy index as well as the module before controlling decoding.
  await expect(page.locator('script[src*="photo-search.js"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.querySelector('#photo-search-status').textContent)).not.toBe('Loading photos…');
  return page.locator('[data-explore-action="shuffle"]');
}

const batch = page => page.locator('.photo-explore__cards > a').evaluateAll(cards => cards.map(card => card.dataset.tag));
const saved = page => page.evaluate(() => sessionStorage.getItem('photo-search-explore'));
const release = page => page.evaluate(() => window.pendingMixImages.splice(0).forEach(image => image.resolve()));

test('a cold index failure restores the mix button and retry completes its pending intent', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-index.json*', route => ++requests === 1 ? route.abort() : route.continue());
  await page.goto('/travel');
  const button = page.locator('[data-explore-action="shuffle"]');
  const before = await batch(page), storage = await saved(page);
  await button.click();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(button).not.toHaveAttribute('aria-disabled');
  await expect(button).toContainText('Another mix');
  expect(await batch(page)).toEqual(before);
  expect(await saved(page)).toBe(storage);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('#photo-search-status')).toHaveText('Six new photo topics to explore.');
  expect(await batch(page)).not.toEqual(before);
});

test('starting composition cancels a mix queued behind a cold module', async ({ page }) => {
  let releaseModule;
  const gate = new Promise(resolve => { releaseModule = resolve; });
  await page.route('**/photo-search.js*', async route => { await gate; await route.continue(); });
  await page.goto('/travel');
  const button = page.locator('[data-explore-action="shuffle"]');
  const before = await batch(page), storage = await saved(page);
  await button.click();
  await expect(button).toContainText('Loading photos…');
  const input = page.getByRole('searchbox');
  await input.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionstart')));
  await expect(button).not.toHaveAttribute('aria-disabled');
  const loaded = page.waitForResponse(response => response.url().includes('photo-index.json'));
  releaseModule();
  await loaded;
  await expect(page.locator('#photo-search')).not.toHaveAttribute('aria-busy');
  expect(await batch(page)).toEqual(before);
  expect(await saved(page)).toBe(storage);
});

test('mix retains the visible batch and focus until decoding, ignores repeat clicks, and skips motion when reduced', async ({ page }) => {
  const button = await prepare(page);
  const before = await batch(page), storage = await saved(page);
  await button.focus();
  await button.press('Enter');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toContainText('Loading photos…');
  await expect(button).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  const pending = await page.evaluate(() => window.pendingMixImages.length);
  await button.evaluate(el => { el.click(); el.click(); });
  expect(await page.evaluate(() => window.pendingMixImages.length)).toBe(pending);
  expect(await batch(page)).toEqual(before);
  expect(await saved(page)).toBe(storage);
  await release(page);
  await expect(button).not.toHaveAttribute('aria-disabled');
  expect(await batch(page)).not.toEqual(before);
  expect(await saved(page)).not.toBe(storage);
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => window.mixAnimations)).toEqual([]);
});

test('a failed replacement preserves the batch and selection history and can be retried', async ({ page }) => {
  const button = await prepare(page);
  const before = await batch(page), storage = await saved(page);
  await button.focus();
  await button.press('Enter');
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await page.evaluate(() => window.pendingMixImages.splice(0).forEach(image => image.reject(new Error('decode failed'))));
  await expect(page.locator('#photo-search-status')).toContainText('Choose Another mix to try again');
  expect(await batch(page)).toEqual(before);
  expect(await saved(page)).toBe(storage);
  await expect(button).toBeFocused();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await release(page);
  await expect(page.locator('#photo-search-status')).toHaveText('Six new photo topics to explore.');
  expect(await batch(page)).not.toEqual(before);
});

test('using an old postcard while decoding cancels the mix and preserves keyboard focus', async ({ page, browserName }) => {
  const button = await prepare(page);
  const before = await batch(page), storage = await saved(page);
  await button.focus();
  await button.press('Enter');
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  const card = page.locator('.photo-explore__cards > a').first();
  // WebKit's default keyboard policy skips links; focus the same link directly.
  if (browserName === 'webkit') await card.focus();
  else await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await expect(button).not.toHaveAttribute('aria-disabled');
  await release(page);
  await expect(card).toBeFocused();
  expect(await batch(page)).toEqual(before);
  expect(await saved(page)).toBe(storage);
  await expect(page.locator('#photo-search-status')).toBeEmpty();
});

test('a stale mix cannot replace a search or a newer mix after Surprise and Back', async ({ page }) => {
  const button = await prepare(page);
  const storage = await saved(page);
  await button.click();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await page.evaluate(() => { window.oldMixImages = window.pendingMixImages.splice(0); });
  await page.getByRole('searchbox').fill('panda');
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await page.evaluate(() => window.oldMixImages.forEach(image => image.resolve()));
  await expect(page.locator('#photo-search-status')).toContainText('photos match');
  expect(await saved(page)).toBe(storage);
  await page.getByRole('searchbox').fill('');
  await expect(page.locator('#photo-explore')).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await page.evaluate(() => { window.oldMixImages = window.pendingMixImages.splice(0); });
  await page.getByRole('button', { name: 'Surprise me', exact: true }).click();
  await expect(page.locator('#photo-moment')).toBeVisible();
  await page.getByRole('button', { name: 'Back to exploring', exact: true }).click();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await release(page);
  await expect(button).not.toHaveAttribute('aria-disabled');
  const latest = await batch(page), latestStorage = await saved(page);
  await page.evaluate(() => window.oldMixImages.forEach(image => image.resolve()));
  expect(await batch(page)).toEqual(latest);
  expect(await saved(page)).toBe(latestStorage);
  await expect(page.locator('#photo-search-status')).toHaveText('Six new photo topics to explore.');
});

test('successful mix crossfades for 220ms without moving the grid', async ({ page }) => {
  const button = await prepare(page, 'no-preference');
  await button.focus();
  await button.press('Enter');
  const before = await page.locator('.photo-explore__cards').boundingBox();
  await expect.poll(() => page.evaluate(() => window.pendingMixImages.length)).toBeGreaterThan(0);
  await release(page);
  await expect(button).not.toHaveAttribute('aria-disabled');
  const after = await page.locator('.photo-explore__cards').boundingBox();
  expect(Math.abs(before.height - after.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(before.y - after.y)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.mixAnimations)).toEqual([220, 220, 220, 220, 220, 220, 220]);
  await expect(button).toBeFocused();
});

test('phone mix waits only for visible slots, leaving lower images lazy', async ({ page }) => {
  const button = await prepare(page);
  await page.setViewportSize({ width: 375, height: 600 });
  await button.click();
  const visible = await page.locator('.photo-explore__cards > a img').evaluateAll(images => images.filter(img => {
    const box = img.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight;
  }).length);
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(6);
  expect(await page.evaluate(() => window.pendingMixImages.length)).toBe(visible);
  await release(page);
  await expect(button).not.toHaveAttribute('aria-disabled');
  expect(await page.locator('.photo-explore__cards > a img[loading="lazy"]').count()).toBe(6 - visible);
});
