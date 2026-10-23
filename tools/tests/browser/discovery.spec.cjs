const { test, expect } = require('@playwright/test');

test('submitting before the search module arrives keeps the query without navigating', async ({ page }) => {
  let release, requests = 0;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/photo-search.js*', async route => {
    requests++;
    await gate;
    await route.continue();
  });
  let documents = 0;
  page.on('request', request => { if (request.isNavigationRequest()) documents++; });
  await page.goto('/travel');
  const input = page.getByRole('searchbox');
  await input.fill('panda');
  await input.press('Enter');
  await expect(page.locator('#photo-search-status')).toHaveText('Loading photos…');
  await expect(input).toHaveValue('panda');
  expect(documents).toBe(1);
  release();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page).toHaveURL(/q=panda/);
  expect(documents).toBe(1);
  expect(requests).toBe(1);
});

for (const delayed of ['photo-search.js', 'photo-index.json']) {
  test(`composition waits for commitment when ${delayed} arrives mid-input`, async ({ page }) => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route(`**/${delayed}*`, async route => { await gate; await route.continue(); });
    await page.goto('/travel');
    const input = page.getByRole('searchbox');
    await input.focus();
    if (delayed === 'photo-index.json') await expect(page.locator('#photo-search')).toHaveAttribute('aria-busy', 'true');
    await input.evaluate(input => {
      input.dispatchEvent(new CompositionEvent('compositionstart'));
      input.value = '京都';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    });
    const indexLoaded = page.waitForResponse(response => response.url().includes('photo-index.json'));
    release();
    await indexLoaded;
    await expect(page.locator('#photo-search')).not.toHaveAttribute('aria-busy');
    await expect(page).toHaveURL(/\/travel$/);
    await expect(page.locator('#photo-results')).toBeHidden();
    await input.evaluate(input => input.dispatchEvent(new CompositionEvent('compositionend')));
    await expect(page).toHaveURL(/q=%E4%BA%AC%E9%83%BD/);
    await expect(page.locator('.photo-hit').first()).toBeVisible();
  });
}

test('retry recovers a pending discovery action without duplicate downloads', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-index.json*', async route => {
    requests++;
    if (requests === 1) return route.abort();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto('/travel');
  await page.locator('.photo-explore__card').first().click();
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(retry).toBeDisabled();
  await retry.evaluate(button => { button.click(); button.click(); });
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page.locator('.photo-hit').first()).toBeFocused();
  expect(requests).toBe(2);
  await expect(retry).toBeHidden();
});

test('retry respects a query edited after failure and survives a second failure', async ({ page }) => {
  let requests = 0;
  await page.route('**/photo-index.json*', route => ++requests < 3 ? route.abort() : route.continue());
  await page.goto('/travel');
  await page.locator('.photo-explore__card').first().click();
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await page.getByRole('searchbox').fill('red panda');
  await retry.click();
  await expect(page.locator('#photo-search-status')).toHaveText('Photo search is unavailable right now.');
  await retry.click();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page.getByRole('searchbox')).toHaveValue('red panda');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.locator('#photo-moment')).toHaveCount(0);
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

test('visible postcards are eager and high-density previews select larger images', async ({ browser }) => {
  // Four columns have narrower slots; DPR 3 requires a source above 480px.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/travel');
  const images = page.locator('.photo-explore__cards img');
  await expect(images).toHaveCount(4);
  const visible = await images.evaluateAll(es => es.filter(e => e.getBoundingClientRect().top < innerHeight).map(e => e.loading));
  expect(visible.length).toBeGreaterThan(0);
  expect(visible.every(value => value === 'eager')).toBe(true);
  expect(await page.locator('script[src*="photo-search"]').count()).toBe(0);
  const responsive = page.locator('.photo-explore__cards img[srcset]').first();
  await responsive.evaluate(img => img.decode());
  expect(await responsive.evaluate(img => img.currentSrc !== new URL(img.getAttribute('src'), location.href).href)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  // Phones cap the slot at the 160px journal-tile size so DPR-3 screens take the 480w file (24 Oct 2026).
  await expect.poll(() => responsive.evaluate(img => Math.abs(parseFloat(img.sizes) - Math.min(160, img.getBoundingClientRect().width)))).toBeLessThan(1);
  await context.close();
});

test('atlas waits for approach and replays a cold phone activation', async ({ page }) => {
  // Four postcards bring the atlas higher; keep it outside its preload range.
  await page.setViewportSize({ width: 390, height: 600 });
  await page.route('**/travel-map.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/travel');
  const atlasTop = await page.locator('.travel-atlas__layout').evaluate(el => el.getBoundingClientRect().top);
  expect(atlasTop).toBeGreaterThan(600 + 120);
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
  await page.setViewportSize({ width: 390, height: 600 });
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
