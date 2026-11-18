const { test, expect } = require('@playwright/test');

// Swipe down to close the lightbox (18 Nov 2026). Real touch input through CDP,
// so touch-action, click synthesis and the history step all take part.
test.skip(({ browserName }) => browserName !== 'chromium', 'CDP touch input is Chromium-only');

const openPhone = async (browser, reducedMotion = 'reduce') => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
  const page = await context.newPage();
  await page.goto('/travel_2026_guangzhou');
  const trigger = page.locator('#main .content').filter({ has: page.locator('img[src*="moments/group-dinner"]') });
  await trigger.scrollIntoViewIfNeeded();
  const before = { url: page.url(), scrollY: await page.evaluate(() => window.scrollY) };
  await trigger.tap();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  const cdp = await context.newCDPSession(page);
  const box = await page.locator('.lightbox__viewport').boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  // Moves through `points` (offsets from the start), pausing `pause` ms between moves;
  // `hold` runs before release. A number pair (dx, dy, steps) is a straight line.
  const line = (dx, dy, steps) => Array.from({ length: steps }, (_, i) => [dx * (i + 1) / steps, dy * (i + 1) / steps]);
  // `stepMs` stamps each event that many milliseconds after the last, so a flick's speed is the
  // test's to set rather than the CI runner's (a slow runner once read a flick as a slow drag).
  const drag = async (points, pause, hold, stepMs) => {
    const t0 = Date.now() / 1000;
    const at = i => (stepMs ? { timestamp: t0 + i * stepMs / 1000 } : {});
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x, y: start.y }], ...at(0) });
    for (const [i, [dx, dy]] of points.entries()) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + dx, y: start.y + dy }], ...at(i + 1) });
      if (pause) await page.waitForTimeout(pause);
    }
    if (hold) await hold();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], ...at(points.length + 1) });
  };
  return { context, page, trigger, before, drag, line, start };
};

test('a long drag down closes the viewer onto the same page and scroll', async ({ browser }) => {
  const { context, page, trigger, before, drag, line } = await openPhone(browser, 'no-preference');
  await drag(line(0, 360, 12), 30, async () => {
    // Mid-drag the figure follows the finger and the backdrop thins.
    const figure = page.locator('.lightbox__figure');
    expect(await figure.evaluate(element => element.style.transform)).toContain('translate3d');
    const alpha = await page.locator('.lightbox').evaluate(element => parseFloat(getComputedStyle(element).backgroundColor.split(',')[3]));
    expect(alpha).toBeLessThan(0.5);
  });
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
  await expect(trigger).toBeFocused();
  // The fade finishes and the drag's inline styles go.
  await expect.poll(() => page.locator('.lightbox__figure').evaluate(element => element.style.transform)).toBe('');
  expect(page.url()).toBe(before.url);
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before.scrollY)).toBeLessThan(2);
  // Closing stepped back over the viewer's history entry, and a reopen still works.
  await trigger.tap();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  await context.close();
});

test('a short slow drag springs back; a quick flick closes', async ({ browser }) => {
  const { context, page, drag, line } = await openPhone(browser);
  // The controls and caption leave as soon as the drag reads as a dismiss, not partway down
  // (18 Nov 2026 review: the half-clear caption smeared over the page behind).
  const chrome = ['.lightbox__close', '.lightbox__next', '.lightbox__caption'];
  const opacities = () => page.evaluate(selectors => selectors.map(selector => getComputedStyle(document.querySelector(selector)).opacity), chrome);
  const resting = await opacities();
  expect(resting.every(value => parseFloat(value) > 0.5)).toBe(true);
  await drag(line(0, 40, 4), 40, async () => {
    await expect.poll(opacities).toEqual(['0', '0', '0']);
  });
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(opacities).toEqual(resting);
  await drag(line(0, 120, 12), 40);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  expect(await page.locator('.lightbox__figure').evaluate(element => element.style.transform)).toBe('');
  expect(await page.locator('.lightbox').evaluate(element => element.style.backgroundColor)).toBe('');
  // Upward drags do nothing: the figure never follows the finger, even while it is held.
  await drag(line(0, -300, 10), 20, async () => {
    expect(await page.locator('.lightbox__figure').evaluate(element => element.style.transform)).toBe('');
    expect(await page.locator('.lightbox').evaluate(element => element.style.backgroundColor)).toBe('');
  });
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  // A quick flick: 110px in about 50ms.
  await drag(line(0, 110, 3), 0, null, 16);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
  await context.close();
});

test('horizontal swipes still page, and zoomed or mouse drags never close', async ({ browser }) => {
  const { context, page, drag, line, start } = await openPhone(browser);
  const viewer = page.locator('img.lightbox__image');
  const first = await viewer.getAttribute('alt');
  await drag(line(-180, 30, 8), 10);
  await expect(viewer).not.toHaveAttribute('alt', first);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  // A horizontal start locks the axis: turning downward afterwards does not close.
  await drag([[-30, 2], ...line(0, 400, 8).map(([, dy]) => [-30, dy])], 20);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  // Zoomed, the same drag pans.
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await drag(line(0, 400, 12), 20);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  // A mouse drag down at the fitted scale does nothing.
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + 400, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false');
  await context.close();
});
