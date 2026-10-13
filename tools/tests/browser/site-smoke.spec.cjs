const { test, expect } = require('@playwright/test');

test('nested missing URLs retain working assets and recovery links', async ({ page }) => {
  const failures = [];
  page.on('response', response => {
    if (/\/assets\//.test(response.url()) && response.status() >= 400) failures.push(response.url());
  });
  const response = await page.goto('/missing/deep/path');
  expect(response.status()).toBe(404);
  await expect(page.locator('#main')).toBeVisible();
  expect(failures).toEqual([]);
  const links = page.locator('.homepage-link');
  expect(await links.evaluateAll(items => items.map(a => new URL(a.href).pathname))).toEqual(['/index', '/experience', '/travel']);
  await links.first().click();
  await expect(page).toHaveURL(/\/index$/);
  await expect(page.locator('main')).toBeVisible();
});

test('phone navigation traps and restores keyboard focus with normal motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/skills');
  const toggle = page.getByRole('link', { name: 'Open navigation menu' });
  await toggle.click();
  const dialog = page.getByRole('dialog', { name: 'Site navigation' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('nav a').first()).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('phone gallery prepares hidden neighbours before horizontal navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  const gallery = page.locator('.journal-gallery-shell').filter({ has: page.locator('.brick:nth-child(5)') }).first();
  await gallery.scrollIntoViewIfNeeded();
  const images = gallery.locator('.brick img');
  await expect(images.nth(2)).toHaveAttribute('loading', 'eager');
  await gallery.getByRole('button', { name: 'Next photo', exact: true }).click();
  await expect(gallery.getByRole('status')).toHaveText(/^2 \/ /);
  await expect(images.nth(3)).toHaveAttribute('loading', 'eager');
});

test('journal animations pause behind the lightbox and resume when it closes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2023_usacanada');
  const video = page.locator('video.journal-animation').first();
  await video.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate(el => el.paused)).toBe(false);
  await video.locator('..').click();
  await expect(page.getByRole('dialog', { name: 'Media viewer' })).toBeVisible();
  await expect.poll(() => page.locator('video.journal-animation').evaluateAll(items => items.every(el => el.paused))).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => video.evaluate(el => el.paused)).toBe(false);
});
