const { test, expect } = require('@playwright/test');

test('retry recovers a pending discovery action without duplicate downloads', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-index.json*', async route => {
    requests++;
    if (requests === 1) return route.abort();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Surprise me', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(retry).toBeDisabled();
  await retry.evaluate(button => { button.click(); button.click(); });
  await expect(page.locator('#photo-moment')).toBeVisible();
  await expect(page.locator('#photo-moment-title')).toBeFocused();
  expect(requests).toBe(2);
  await expect(retry).toBeHidden();
});

test('retry respects a query edited after failure and survives a second failure', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-index.json*', route => ++requests < 3 ? route.abort() : route.continue());
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Surprise me', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await page.getByRole('searchbox').fill('red panda');
  await retry.click();
  await expect(page.locator('#photo-search-status')).toHaveText('Photo search is unavailable right now.');
  await retry.click();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page.getByRole('searchbox')).toHaveValue('red panda');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.locator('#photo-moment')).toBeHidden();
  expect(requests).toBe(3);
});

test('the lazy module itself can be retried', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-search.js*', route => ++requests === 1 ? route.abort() : route.continue());
  await page.goto('/travel');
  await page.locator('.photo-explore__card').first().click();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.photo-hit').first()).toBeFocused();
  expect(requests).toBe(2);
});

test('previous moments are reversible without consuming unseen photos', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Surprise me', exact: true }).click();
  const image = page.locator('.photo-moment__image');
  await expect(image).toBeVisible();
  const first = await image.getAttribute('href');
  const previous = page.getByRole('button', { name: 'Previous moment', exact: true });
  const next = page.getByRole('button', { name: 'Another moment', exact: true });
  await expect(previous).toBeDisabled();
  await next.click();
  const second = await image.getAttribute('href');
  const seen = await page.evaluate(() => sessionStorage.getItem('photo-explore-moments'));
  await previous.click();
  await expect(image).toHaveAttribute('href', first);
  await expect(next).toBeFocused();
  await next.click();
  await expect(image).toHaveAttribute('href', second);
  expect(await page.evaluate(() => sessionStorage.getItem('photo-explore-moments'))).toBe(seen);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('visible postcards are eager and high-density previews select larger images', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/travel');
  const images = page.locator('.photo-explore__cards img');
  await expect(images).toHaveCount(6);
  const visible = await images.evaluateAll(es => es.filter(e => e.getBoundingClientRect().top < innerHeight).map(e => e.loading));
  expect(visible.length).toBeGreaterThan(0);
  expect(visible.every(value => value === 'eager')).toBe(true);
  expect(await page.locator('script[src*="photo-search"]').count()).toBe(0);
  const responsive = page.locator('.photo-explore__cards img[srcset]').first();
  await responsive.evaluate(img => img.decode());
  expect(await responsive.evaluate(img => img.currentSrc !== new URL(img.getAttribute('src'), location.href).href)).toBe(true);
  await page.getByRole('button', { name: 'Surprise me', exact: true }).click();
  const preview = page.locator('.photo-moment__image img');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('loading', 'eager');
  await expect(preview).toHaveAttribute('srcset', /800w/);
  await preview.evaluate(img => img.decode());
  const source = new URL(await preview.evaluate(img => img.currentSrc)).pathname;
  expect(source).not.toContain('-480.');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => preview.evaluate(img => Math.abs(parseFloat(img.sizes) - img.getBoundingClientRect().width))).toBeLessThan(1);
  await context.close();
});

test('atlas waits for approach and replays a cold phone activation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/travel-map.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/travel');
  expect(await page.locator('script[src*="travel-map.js"]').count()).toBe(0);
  await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/is-map-fullscreen/);
  await page.getByRole('button', { name: 'Close map', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true })).toBeFocused();
  expect(await page.locator('script[src*="travel-map.js"]').count()).toBe(1);
});

test('a cold atlas keyboard activation and failed download remain recoverable', async ({ page }) => {
  let requests = 0;
  await page.route('**/travel-map.js*', async route => {
    if (++requests === 1) return route.abort();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto('/travel');
  const pin = page.locator('.travel-map__marker--japan [role="button"]');
  await pin.focus();
  await expect(page.locator('.travel-map__status')).toContainText('Map unavailable');
  await pin.press('Enter');
  await expect(page.locator('[data-map-detail-card]')).toBeVisible();
  await expect(page.locator('#travel-map-trip')).toHaveValue('japan');
  expect(requests).toBe(2);
});

test('starting a search cancels a map activation that is still downloading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/travel-map.js*', async route => { await gate; await route.continue(); });
  await page.goto('/travel');
  await page.getByRole('button', { name: 'Open the interactive travel atlas', exact: true }).click();
  await page.getByRole('searchbox').fill('panda');
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  release();
  await expect(page.locator('.travel-atlas__layout')).not.toHaveAttribute('aria-busy');
  await expect(page.locator('body')).not.toHaveClass(/is-map-fullscreen/);
  await expect(page.getByRole('searchbox')).toBeFocused();
});
