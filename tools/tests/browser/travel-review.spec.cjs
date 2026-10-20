const { test, expect } = require('@playwright/test');

test('subject searches separate contextual photos and reset related results on query changes', async ({ page }) => {
  await page.goto('/travel?q=mount+fuji');
  await expect(page.locator('.photo-hit')).toHaveCount(4);
  await expect(page.locator('.photo-hit').first()).toContainText('Fujiyoshida');
  expect((await page.locator('.photo-hit').allTextContents()).join(' ')).not.toContain('Tokyo');
  await expect(page.locator('.photo-hit[href*="kawaguchi1"]')).toHaveCount(0);
  await page.getByRole('button', { name: /Show related photos/ }).click();
  await expect(page.getByRole('heading', { name: 'Related photos', exact: true })).toBeVisible();
  await expect(page.locator('.photo-hit').nth(4)).toBeFocused();
  await page.getByRole('searchbox').fill('red panda');
  await expect(page.getByRole('button', { name: /Show related photos/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Related photos', exact: true })).toHaveCount(0);
});

test('empty searches offer concrete populated subjects without counts', async ({ page }) => {
  await page.goto('/travel?q=zzzzunfindable');
  const empty = page.locator('.photo-results__empty');
  await expect(empty).toBeVisible();
  await expect(empty.locator('[data-tag]')).toHaveCount(6);
  await expect(empty.locator('[data-tag] span')).toHaveCount(0);
  await empty.locator('[data-tag="cat"]').click();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
});

test('show all lives beside the heading and stays reversible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/travel');
  const toggle = page.locator('.travel-archive-heading .journal-show-all');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.travel-grid')).toHaveClass(/journals-expanded/);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
