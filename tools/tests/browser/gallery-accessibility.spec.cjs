const { test, expect } = require('@playwright/test');

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
