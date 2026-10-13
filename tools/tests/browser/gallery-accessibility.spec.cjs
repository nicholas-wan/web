const { test, expect } = require('@playwright/test');

test('slow original keeps the decoded preview during zoom and upgrades only when ready', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  const tile = page.locator('.content').filter({ has: page.locator('img[src*="moments/group-dinner"]') });
  const original = await tile.locator('img').evaluate(img => img.src);
  let release, requested;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { requested = resolve; });
  await page.route(original, async route => { requested(); await gate; await route.continue(); });
  try {
    await tile.click();
    const viewer = page.locator('img.lightbox__image');
    await expect(viewer).toHaveAttribute('src', /-(480|800)\./);
    await viewer.evaluate(img => img.decode());
    const preview = await viewer.getAttribute('src');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await started;
    await expect(viewer).toHaveAttribute('src', preview);
    expect(await viewer.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    release();
    await expect(viewer).toHaveAttribute('src', original);
    await viewer.evaluate(img => img.decode());
    await page.keyboard.press('Escape');
    await expect(tile).toBeFocused();
  } finally { release(); }
});

test('leaving a zoomed photo prevents a delayed original from replacing the next photo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  const tile = page.locator('.content').filter({ has: page.locator('img[src*="moments/group-dinner"]') });
  const original = await tile.locator('img').evaluate(img => img.src);
  let release, requested;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { requested = resolve; });
  await page.route(original, async route => { requested(); await gate; await route.continue().catch(() => {}); });
  try {
    await tile.click();
    const viewer = page.locator('img.lightbox__image');
    await expect(viewer).toHaveAttribute('src', /-(480|800)\./);
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await started;
    await page.getByRole('button', { name: 'Next media', exact: true }).click();
    await viewer.evaluate(img => img.decode());
    const nextAlt = await viewer.getAttribute('alt');
    release();
    await page.waitForTimeout(300);
    await expect(viewer).not.toHaveAttribute('src', original);
    await expect(viewer).toHaveAttribute('alt', nextAlt);
  } finally { release(); }
});

async function openLandscapeCaption(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  const photo = page.locator('.content').filter({
    has: page.locator('img[src*="moments/group-dinner"]')
  });
  await photo.click();
  await page.getByRole('button', { name: 'Use landscape view' }).click();
  const info = page.getByRole('button', { name: 'Show caption' });
  await info.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.lightbox__info')).toBeFocused();
  return photo;
}

test('advancing from Info keeps focus inside the lightbox and restores the trigger on close', async ({ page }) => {
  const photo = await openLandscapeCaption(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.lightbox__info')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Close media viewer' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(photo).toBeFocused();
});

test('orientation change transfers focus before hiding Info', async ({ page }) => {
  await openLandscapeCaption(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.lightbox__info')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Close media viewer' })).toBeFocused();
});

test('photo changes update a polite atomic caption without moving navigation focus', async ({ page }) => {
  await page.goto('/travel_2026_guangzhou');
  await page.locator('#main .content').first().click();
  const caption = page.locator('.lightbox__caption');
  const original = await caption.textContent();
  await expect(caption).toHaveAttribute('aria-live', 'polite');
  await expect(caption).toHaveAttribute('aria-atomic', 'true');
  const next = page.getByRole('button', { name: 'Next media', exact: true });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(caption).not.toHaveText(original);
  await expect(caption).toContainText('2 of');
  await expect(next).toBeFocused();
  await page.getByRole('button', { name: 'Previous media', exact: true }).click();
  await expect(caption).toHaveText(original);
});
