const { test, expect } = require('@playwright/test');

test('holding a completed pan before release does not close the lightbox', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  const trigger = page.locator('#main .content').filter({
    has: page.locator('img[src*="moments/group-dinner"]')
  });
  await trigger.scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  const original = await trigger.locator('img').evaluate(image => image.src);
  await trigger.click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  // Finish the source upgrade before choosing a point in the empty letterbox.
  await expect(page.locator('img.lightbox__image')).toHaveAttribute('src', original);
  await page.locator('img.lightbox__image').evaluate(image => image.decode());
  const viewport = await page.locator('.lightbox__viewport').boundingBox();
  const start = { x: viewport.x + viewport.width / 2, y: viewport.y + 12 };
  expect(await page.evaluate(point => document.elementFromPoint(point.x, point.y)
    .classList.contains('lightbox__viewport'), start)).toBe(true);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 35, start.y + 10, { steps: 4 });
  // Longer than the old 500ms suppression window, while the button stays down.
  await page.waitForTimeout(650);
  await page.mouse.up();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');

  // Suppressing the drag's release must not swallow a deliberate control click.
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
  await expect(trigger).toBeFocused();
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollY)).toBeLessThan(2);
});

test('touch swipes page at fit and pan the same photo when zoomed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_guangzhou');
  await page.locator('#main .content').filter({ has: page.locator('img[src*="moments/group-dinner"]') }).click();
  const viewer = page.locator('img.lightbox__image');
  const swipe = () => viewer.evaluate(image => {
    const dispatch = (type, x, ended) => {
      const touch = new Touch({ identifier: 1, target: image, clientX: x, clientY: 350 });
      image.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true,
        touches: ended ? [] : [touch], changedTouches: [touch] }));
    };
    dispatch('touchstart', 300, false);
    dispatch('touchmove', 120, false);
    dispatch('touchend', 120, true);
  });
  const first = await viewer.getAttribute('alt');
  await swipe();
  await expect(viewer).not.toHaveAttribute('alt', first);
  const next = await viewer.getAttribute('alt');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await swipe();
  await expect(viewer).toHaveAttribute('alt', next);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
});
