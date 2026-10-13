const { test, expect } = require('@playwright/test');

test('standalone personal galleries support keyboard photo selection without navigation', async ({ page }) => {
  await page.goto('/personal');
  for (const [name, total] of [['Orientation Group Leader', 2], ['Naval Diving Unit', 3]]) {
    const controls = page.getByRole('group', { name: name + ' photos', exact: true });
    const event = controls.locator('..');
    const next = controls.getByRole('button', { name: 'Next photo', exact: true });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(controls.getByRole('status')).toContainText('Photo 2 of ' + total);
    await expect(event.locator('img.is-gallery-selected')).toHaveCSS('opacity', '1');
    await expect(next).toBeFocused();
    await controls.getByRole('button', { name: 'Previous photo', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(controls.getByRole('status')).toContainText('Photo 1 of ' + total);
    await page.keyboard.press('Space');
    await expect(controls.getByRole('status')).toContainText('Photo ' + total + ' of ' + total);
    await expect(page).toHaveURL(/\/personal$/);
  }
  await expect(page.locator('a .personal-gallery-controls')).toHaveCount(0);
});

test('touch autoplay pauses on a selected frame and resumes explicitly', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/personal');
  const controls = page.getByRole('group', { name: 'Latte & Mocha photos', exact: true });
  const event = controls.locator('..');
  await controls.scrollIntoViewIfNeeded();
  await expect(event).toHaveClass(/is-gallery-active/);
  await controls.getByRole('button', { name: 'Pause automatic photos', exact: true }).tap();
  await expect(event).toHaveClass(/is-gallery-paused/);
  const photo = event.locator('img.is-gallery-selected');
  await expect(photo).toHaveCSS('animation-name', 'none');
  await expect(photo).toHaveCSS('opacity', '1');
  await controls.getByRole('button', { name: 'Resume automatic photos', exact: true }).tap();
  await expect(event).not.toHaveClass(/is-gallery-paused/);
  await expect(event.locator('.personal-event-card__image img').first()).toHaveCSS('animation-name', 'personal-card-slideshow-first');
  await controls.getByRole('button', { name: 'Next photo', exact: true }).tap();
  await expect(event).toHaveClass(/is-gallery-paused/);
  await expect(controls.getByRole('status')).toContainText('Photo 2 of 5');
  await context.close();
});

test('visible skills evidence stays keyboard-accessible at every breakpoint', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/skills');
    const detail = page.locator('#toolkit-ai-detail');
    await expect(detail).toHaveAttribute('aria-hidden', 'false');
    await expect(detail).not.toHaveAttribute('inert', '');
    const evidence = detail.getByRole('link', { name: 'See the agentic AI case study' });
    await evidence.focus();
    await expect(evidence).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/experience#agentic-ai$/);
  }
});
