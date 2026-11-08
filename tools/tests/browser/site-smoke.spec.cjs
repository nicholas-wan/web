const { test, expect } = require('@playwright/test');
const BASE = 'http://127.0.0.1:' + (process.env.PW_PORT || '4321'); // matches playwright.config.cjs

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

// Menu revamp (8 Nov 2026): every tab carries a hidden icon beside its label,
// the current tab says so with aria-current, and the phone sheet lays the six
// pages out as a three-across grid of tiles at least 44px tall.
test('menu tabs show page icons, mark the current page, and tile the phone sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects');
  await expect(page.locator('#nav .links a')).toHaveText(['About', 'Work', 'Projects', 'Skills', 'Personal', 'Travel']);
  await expect(page.locator('#nav .links a svg.nav-icon[aria-hidden="true"]')).toHaveCount(6);
  await expect(page.locator('#nav .links a[aria-current]')).toHaveCount(1);
  await expect(page.locator('#nav .links li.active a')).toHaveAttribute('aria-current', 'page');
  await page.goto('/travel_2026_guangzhou');
  await expect(page.locator('#nav .links li.active a')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#nav .links li.active a')).toHaveText('Travel');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects');
  await page.getByRole('link', { name: 'Open navigation menu' }).click();
  const tiles = page.getByRole('dialog', { name: 'Site navigation' }).locator('.links a');
  await expect(tiles).toHaveCount(6);
  const boxes = await tiles.evaluateAll(items => items.map(a => a.getBoundingClientRect().toJSON()));
  expect(new Set(boxes.map(box => Math.round(box.top))).size).toBe(2);
  for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
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

test('DPR-3 phones use small journal tiles while the lightbox and zoom retain detail', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    for (const trip of ['2026_guangzhou', '2025_japan']) {
      await page.goto(BASE + '/travel_' + trip);
      const tile = page.locator('#main .content').filter({ has: page.locator('img[srcset*="-480"]') }).first();
      const image = tile.locator('img');
      await tile.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
      expect(await image.evaluate(img => img.currentSrc)).toMatch(/-480\.(?:jpg|webp)$/);
      const original = await image.evaluate(img => img.src);
      await tile.click();
      const viewer = page.locator('img.lightbox__image');
      await expect(viewer).toHaveAttribute('src', /-800\.(?:jpg|webp)$/);
      await viewer.evaluate(img => img.decode());
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await expect(viewer).toHaveAttribute('src', original);
      await page.keyboard.press('Escape');
    }
  } finally { await context.close(); }
});

test('phone deep links land with the day date visible below the toolbar', async ({ browser }) => {
  // The browser's own post-load anchor jump cancels travel-nav.js's correction, so
  // scroll-margin-top alone must clear the date above each heading (24 Oct 2026).
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  for (const target of ['travel_2023_perth#trip-section-9', 'travel_2025_japan#trip-section-4', 'travel_2017_seoul#trip-section-2']) {
    await page.goto('about:blank');
    await page.goto('/' + target);
    const id = target.split('#')[1];
    // Let fonts, images and the landing correction settle, then check where it rests.
    await page.waitForTimeout(2500);
    expect(await page.evaluate(id => {
      const heading = document.getElementById(id);
      const date = heading.previousElementSibling.getBoundingClientRect().top;
      const toolbar = document.querySelector('.travel-section-nav').getBoundingClientRect().bottom;
      return date >= toolbar && heading.getBoundingClientRect().top < innerHeight / 3;
    }, id)).toBe(true);
  }
  await context.close();
});

// Phone banner crops (5 Nov 2026): phones fetch only the cropped WebP tier their
// width and density pick, wider screens only the <img> tier, never both.
for (const [width, scale, expected] of [[390, 3, 'japan_banner_japan-phone-1200.webp'], [390, 2, 'japan_banner_japan-phone-800.webp'], [1366, 1, 'japan_banner_japan-1200.webp']]) {
  test(`Japan banner fetches only ${expected} at ${width}px DPR ${scale}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: scale });
    const page = await context.newPage();
    const banners = [];
    page.on('request', request => { if (/japan_banner_japan/.test(request.url())) banners.push(request.url().split('/').pop()); });
    await page.goto('/travel_2025_japan');
    const banner = page.locator('img.journal-banner');
    await expect.poll(() => banner.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.waitForTimeout(500);
    expect(await banner.evaluate(image => image.currentSrc.split('/').pop())).toBe(expected);
    expect([...new Set(banners)]).toEqual([expected]);
    await context.close();
  });
}
