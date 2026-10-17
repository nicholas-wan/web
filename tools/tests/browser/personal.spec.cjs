const { test, expect } = require('@playwright/test');

test('personal galleries carry no photo controls and still play on touch', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/personal');
  // Owner decision (17 Oct 2026): no previous/next/pause row under the cards.
  await expect(page.locator('.personal-gallery-controls')).toHaveCount(0);
  const event = page.locator('[data-timeline-event]', { hasText: 'Latte & Mocha' });
  await event.scrollIntoViewIfNeeded();
  await expect(event).toHaveClass(/is-gallery-active/);
  await expect(event.locator('.personal-event-card__image img').first()).toHaveCSS('animation-name', 'personal-card-slideshow-first');
  await context.close();
});

test('keyboard focus plays the standalone galleries on desktop', async ({ browser }) => {
  // The suite defaults to reduced motion, which correctly holds the first photo.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/personal');
  for (const name of ['Orientation Group Leader photos', 'Naval Diving Unit photos']) {
    const card = page.getByRole('group', { name, exact: true });
    // Tab to the card like a keyboard user: script focus does not set
    // :focus-visible, which is what plays the crossfade.
    for (let i = 0; i < 60 && !(await card.evaluate(el => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(card).toBeFocused();
    await expect(card.locator('.personal-event-card__image img').first()).not.toHaveCSS('animation-name', 'none');
  }
  await context.close();
});

test('skills summaries stay visible and link-free at every breakpoint', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/skills');
    const detail = page.locator('#toolkit-ai-detail');
    await expect(detail).toBeVisible();
    await expect(detail).not.toHaveAttribute('inert', '');
    // Owner decision (Oct 2026): the summaries no longer link to case studies.
    await expect(page.locator('.toolkit-card__detail a')).toHaveCount(0);
  }
});
