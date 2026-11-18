const { test, expect } = require('@playwright/test');

// The place card's loader (gallery.js, 18 Nov 2026 review): place-card.js loads on demand, so a
// failed or slow load, a folded phone route and a hidden stop must each leave the reader somewhere
// sensible. Then the viewer's place context, its way on, and the route's photo-count tags.

const journal = '/travel_2026_chengdu_zhangjiajie';
const cardScript = /place-card[^/]*\.js/;
const route = (page, day) => page.locator('#trip-section-' + day + ' ~ .guangzhou-day__route');

test('a failed load opens the stop\'s photos, a priced stop waits, and the next tap retries', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let requests = 0;
  await page.route(cardScript, routed => { requests += 1; return routed.abort(); });
  await page.goto(journal);
  const viewer = page.locator('.lightbox');
  const stop = route(page, 6).locator('.has-card', { hasText: 'Tianmen Cave' });
  await stop.click();
  await expect(viewer).toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox__context')).toHaveText(/1 of 2 · Day 6$/);
  await expect(page.locator('.place-card')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toHaveClass(/is-visible/);
  await expect(stop).toBeFocused();

  // A stop with a price and no photos has nothing to fall back to.
  const tried = requests;
  await route(page, 5).locator('.has-card', { hasText: 'Bailong Elevator' }).click();
  await expect.poll(() => requests).toBeGreaterThan(tried);
  await page.waitForTimeout(300);
  await expect(viewer).not.toHaveClass(/is-visible/);
  await expect(page.locator('.place-card')).toHaveCount(0);

  await page.unroute(cardScript);
  await stop.click();
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  await expect(page.locator('.place-card__title')).toHaveText('Tianmen Cave');
});

test('a card still loading never opens over a lightbox opened meanwhile, nor once its stop has left the screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(cardScript, async routed => { await held; await routed.continue(); });
  // A held script holds the load event too.
  await page.goto(journal, { waitUntil: 'domcontentloaded' });
  const length = await page.evaluate(() => history.length);
  await route(page, 6).locator('.has-card', { hasText: 'Tianmen Cave' }).click();
  await page.locator('#trip-section-6 ~ .journal-gallery-shell .content').first().click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  release();
  await expect.poll(() => page.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  await page.waitForTimeout(300);
  await expect(page.locator('.place-card.is-visible')).toHaveCount(0);
  expect(await page.evaluate(() => history.length)).toBe(length + 1);
  await page.goBack();
  await expect(viewer).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');

  // A waiting tap dims its stop, and is dropped once the stop has left the screen (polish, 18 Nov
  // 2026; it was dropped after three seconds, which lost real taps on slow 3G).
  let late;
  const slow = new Promise(resolve => { late = resolve; });
  await page.unroute(cardScript);
  await page.route(cardScript, async routed => { await slow; await routed.continue(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const waiting = route(page, 6).locator('.has-card', { hasText: 'Skywalk' });
  await waiting.click();
  await expect(waiting).toHaveClass(/is-loading/);
  await page.evaluate(() => window.scrollTo(0, 0));
  late();
  await expect(waiting).not.toHaveClass(/is-loading/);
  await expect.poll(() => page.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  await page.waitForTimeout(300);
  await expect(page.locator('.place-card.is-visible')).toHaveCount(0);
  // The dropped tap leaves nothing stuck: the next tap opens its card at once.
  await route(page, 6).locator('.has-card', { hasText: 'Tianmen Cave' }).click();
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  await expect(page.locator('.place-card__title')).toHaveText('Tianmen Cave');
});

test('a card still loading never opens after a lightbox was opened and closed meanwhile', async ({ page }) => {
  // Fix round, 18 Nov 2026 review: checking only whether the lightbox was showing let the late
  // card open once it had closed again.
  await page.setViewportSize({ width: 1440, height: 900 });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(cardScript, async routed => { await held; await routed.continue(); });
  await page.goto(journal, { waitUntil: 'domcontentloaded' });
  await route(page, 6).locator('.has-card', { hasText: 'Tianmen Cave' }).click();
  const viewer = page.locator('.lightbox');
  await page.locator('#trip-section-6 ~ .journal-gallery-shell .content').first().click();
  await expect(viewer).toHaveClass(/is-visible/);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toHaveClass(/is-visible/);
  release();
  await expect.poll(() => page.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  await page.waitForTimeout(300);
  await expect(page.locator('.place-card.is-visible')).toHaveCount(0);
  await expect(viewer).not.toHaveClass(/is-visible/);
});

test('phones load the card as a folded route comes near, before any tap', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(journal);
  const day6 = route(page, 6);
  // Folded, the stops are not rendered, so they could never be watched.
  await expect(day6.locator('.has-card').first()).toBeHidden();
  await day6.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect.poll(() => page.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  await context.close();
});

test('closing the card or its photos returns focus to the stop', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(journal);
  const day6 = route(page, 6);
  const more = day6.locator('.travel-route__more');
  const stop = day6.locator('.guangzhou-route__stop').nth(2);
  await more.scrollIntoViewIfNeeded();
  await more.click();
  await stop.click();
  const card = page.locator('.place-card');
  await expect(card).toHaveClass(/is-visible/);
  // The card ignores clicks for 350 ms after it opens (a double click's second click).
  await page.waitForTimeout(400);
  await card.locator('.place-card__view').click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await expect(viewer).not.toHaveClass(/is-visible/);
  await expect(stop).toBeFocused();

  // With the card unavailable, the stop opens the photos directly; closing lands the same way.
  await page.route(cardScript, routed => routed.abort());
  await page.reload();
  await more.scrollIntoViewIfNeeded();
  await more.click();
  await stop.click();
  await expect(viewer).toHaveClass(/is-visible/);
  await page.keyboard.press('Escape');
  await expect(stop).toBeFocused();
  await context.close();
});

test('the viewer names the place only when the caption does not, and its way on is a quiet outline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(journal);
  const context = page.locator('.lightbox__context');
  const open = (title, nth) => page.evaluate(([title, nth]) => [...document.querySelectorAll('#main .content')]
    .filter(tile => tile.querySelector('.content-title').textContent === title)[nth].click(), [title, nth]);
  await open('LEGO store, Taikoo Li', 0);
  await expect(context).toHaveText(/1 of 4 at Taikoo Li · Day 3$/);
  await page.keyboard.press('Escape');
  await open('Taikoo Li', 0);
  await expect(context).toHaveText(/4 of 4 · Day 3$/);
  await page.keyboard.press('Escape');

  await open('Tianmen Cave', 1);
  await expect(context).toHaveText(/2 of 2 · Day 6$/);
  const next = page.getByRole('button', { name: 'Next stop: Glass Skywalk' });
  await expect(next).toHaveText('Next: Glass Skywalk →');
  const style = await next.evaluate(node => {
    const css = getComputedStyle(node);
    return { background: css.backgroundColor, border: css.borderTopWidth, borderColor: css.borderTopColor, color: css.color, height: node.offsetHeight };
  });
  expect(style.color).toBe('rgb(255, 255, 255)');
  expect(style.border).toBe('1px');
  expect(parseFloat(style.background.split(',')[3])).toBeLessThan(0.2);
  expect(parseFloat(style.borderColor.split(',')[3])).toBeLessThan(0.6);
  expect(style.height).toBe(await page.locator('.lightbox__place-thumb').first().evaluate(node => node.offsetHeight));
});

test('route stops carry no photo-count tags: the card and the viewer give the count', async ({ page }) => {
  // Owner, 18 Nov 2026: the stacked-squares tag read as a copy button, and map and photo sites
  // show a count only with the photos themselves.
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(journal);
    await expect(page.locator('.travel-route__count, [data-count]')).toHaveCount(0);
  }
});
