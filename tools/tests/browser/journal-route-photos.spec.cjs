const { test, expect } = require('@playwright/test');

// The card ignores clicks for 350 ms after it opens (the second click of a double click), so a
// test clicking inside it waits that out first.
const settle = page => page.waitForTimeout(400);

// Route stops open their photos on every journal (18 Nov 2026, owner: Chengdu's changes on all of
// them), by one exact rule in gallery.js: a photo goes to the first stop of its day that its caption
// text names, else its title (substring matching gave older journals' stops every photo of their day).

// The route box of the day section whose heading starts with `heading`.
const routeOf = async (page, heading) => {
  const id = await page.locator('#main h2[id^="trip-section-"]', { hasText: heading }).first().getAttribute('id');
  return page.locator('#' + id + ' ~ .guangzhou-day__route');
};
const cardFor = async (page, heading, name) => {
  const route = await routeOf(page, heading);
  const more = route.locator('.travel-route__more');
  if (await more.isVisible()) await more.click();
  await route.locator('.has-card', { hasText: name }).first().click();
  await settle(page);
  return page.locator('.place-card .place-card__sheet');
};

test('every journal with routes gets route photos, by caption text first, then title', async ({ page }) => {
  for (const [slug, count] of [['travel_2017_seoul', 7], ['travel_2022_europe', 33], ['travel_2023_perth', 38],
    ['travel_2023_usacanada', 79], ['travel_2024_australia', 32], ['travel_2025_japan', 26], ['travel_2026_guangzhou', 20]]) {
    await page.goto('/' + slug);
    await expect(page.locator('.has-photos'), slug).toHaveCount(count);
  }
  // No routes, nothing to open.
  for (const slug of ['travel_2019_siliconvalley', 'travel_2024_germany']) {
    await page.goto('/' + slug);
    await expect(page.locator('.has-card'), slug).toHaveCount(0);
  }
  // Perth titles every Day 3 photo "Rottnest Island" and names the bay in the text, so the bay wins.
  await page.goto('/travel_2023_perth');
  const day3 = await routeOf(page, 'Day 3');
  await expect(day3.locator('.has-photos', { hasText: 'Porpoise Bay' })).toHaveAttribute('aria-label', 'Open the place card for Porpoise Bay (4 photos)');
  await expect(day3.locator('.has-photos', { hasText: 'Rottnest Island' }).first()).toHaveAttribute('aria-label', 'Open the place card for Rottnest Island (5 photos)');
  // Accents fold: "Cologne // Hohenzollernbrücke".
  await page.goto('/travel_2022_europe');
  await expect((await routeOf(page, 'Day 5')).locator('.has-photos', { hasText: 'Hohenzollernbrücke' })).toHaveCount(1);
});

test('Japan and Guangzhou cards: a caption in two scripts matches either, and 高德地图 only for Chinese places', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2025_japan');
  // "Atomic Bomb Dome 原爆ドーム" matches the stop written 原爆ドーム with its English subtitle.
  let sheet = await cardFor(page, 'Hiroshima', '原爆ドーム');
  await expect(sheet.locator('.place-card__title')).toHaveText('原爆ドーム');
  await expect(sheet.locator('.place-card__title')).toHaveAttribute('lang', 'ja');
  await expect(sheet.locator('.place-card__meta span').first()).toHaveText('Atomic Bomb Dome');
  await expect(sheet.locator('.place-card__meta span').first()).not.toHaveAttribute('lang', /./);
  await expect(sheet.getByRole('link', { name: 'Google Maps' })).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('原爆ドーム, Atomic Bomb Dome'));
  await expect(sheet.locator('.place-card__map')).toHaveCount(1);
  // Google Maps takes the whole row without its partner.
  const widths = await sheet.evaluate(node => [node.querySelector('.place-card__map').getBoundingClientRect().width, node.querySelector('.place-card__view').getBoundingClientRect().width]);
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(2);
  await page.keyboard.press('Escape');

  await page.goto('/travel_2026_guangzhou');
  // "Dongshankou" matches the pinyin subtitle Dōngshānkǒu, accents folded.
  sheet = await cardFor(page, 'Day 5', '东山口');
  await expect(sheet.locator('.place-card__title')).toHaveAttribute('lang', 'zh-Hans');
  await expect(sheet.locator('.place-card__meta span').first()).toHaveText('Dōngshānkǒu');
  await expect(sheet.locator('.place-card__meta span').first()).not.toHaveAttribute('lang', /./);
  await expect(sheet.getByRole('link', { name: '高德地图' })).toHaveAttribute('href', 'https://uri.amap.com/search?keyword=' + encodeURIComponent('东山口'));
  await expect(sheet.locator('.place-card__view')).toHaveText('View 1 photo');
});

test('Chengdu stops own exactly their photos, count within the place and offer the next stop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const labels = await page.locator('.has-photos').evaluateAll(stops => stops.map(stop => stop.getAttribute('aria-label')));
  expect(labels).toHaveLength(25);
  expect(labels).toContain('Open the place card for Taikoo Li (4 photos)');
  expect(labels).toContain('Open the place card for Tianmen Cave (2 photos)');
  // The airport stops are named for the airport (fix round, 18 Nov 2026), so its photos match by
  // name; Day 1 has no airport photo, Day 4 two and Day 7 one.
  expect(labels).toContain('Open the place card for Tianfu Airport (2 photos)');
  expect(labels).toContain('Open the place card for Tianfu Airport (1 photo)');
  await expect(page.locator('.guangzhou-route__stop', { hasText: 'Tianfu Airport' })).toHaveCount(3);
  await expect(page.locator('.guangzhou-route__stop[data-photos="Tianfu Airport"]')).toHaveCount(0);

  const day6 = page.locator('#trip-section-6 ~ .guangzhou-day__route');
  await day6.locator('.travel-route__more').click();
  await day6.getByRole('button', { name: 'Open the place card for Tianmen Cave (2 photos)' }).click();
  await settle(page);
  // The strip's 350 ms guard starts when View photos opens the viewer, so time from that click.
  const viewed = Date.now();
  await page.locator('.place-card').getByRole('button', { name: 'View 2 photos', exact: true }).last().click();
  const context = page.locator('.lightbox__context');
  await expect(context).toHaveText(/1 of 2 · Day 6$/);
  await expect(page.locator('.lightbox__place-thumb')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next media', exact: true }).click();
  await expect(context).toHaveText(/2 of 2 · Day 6$/);
  // For 350 ms after View photos the strip ignores clicks (a double tap's second tap), then works.
  const nextStop = page.getByRole('button', { name: 'Next stop: Glass Skywalk' });
  await nextStop.click();
  // Only a click that surely landed inside the guard must have been ignored; a slow runner may be past it.
  if (Date.now() - viewed < 300) await expect(context).toHaveText(/2 of 2 · Day 6$/);
  await page.waitForTimeout(400);
  if (/2 of 2/.test(await context.textContent())) await nextStop.click();
  await expect(context).toHaveText(/1 of 2 · Day 6$/);
});

test('Back closes the lightbox, keeps the page and its scroll, and a quick reopen stays open', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tile = page.locator('#main .content').nth(5);
  await tile.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await tile.click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  await page.goBack();
  await expect(viewer).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  expect(await page.evaluate(() => scrollY)).toBe(y);

  await tile.click();
  await expect(viewer).toHaveClass(/is-visible/);
  await page.evaluate(() => { document.querySelector('.lightbox__close').click(); document.querySelectorAll('#main .content')[5].click(); });
  await page.waitForTimeout(500);
  await expect(viewer).toHaveClass(/is-visible/);
});

// Place card (18 Nov 2026, mockup 6): a stop with photos or a price opens a card first. It takes
// the lightbox's one history entry and hands it on, so one Back closes whichever is showing.
const openStop = async (page, day, name) => {
  const route = page.locator('#trip-section-' + day + ' ~ .guangzhou-day__route');
  const more = route.locator('.travel-route__more');
  if (await more.isVisible()) await more.click();
  const stop = route.locator('.has-card', { hasText: name });
  await stop.click();
  await settle(page);
  return stop;
};

test('a stop with photos opens its place card, which hands its history entry to the lightbox', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const length = await page.evaluate(() => history.length);
  const stop = await openStop(page, 6, 'Tianmen Cave');
  const card = page.locator('.place-card');
  const sheet = card.getByRole('dialog', { name: 'Tianmen Cave' });
  await expect(card).toHaveClass(/is-visible/);
  await expect(sheet.locator('.place-card__eyebrow')).toHaveText('Day 6 · Stop 3');
  await expect(sheet.locator('.place-card__meta > [lang]')).toHaveText('天门洞');
  await expect(sheet.locator('.place-card__photos img')).toHaveCount(2);
  // Every photo is showing, so no "N photos" tile repeats the View button.
  await expect(sheet.locator('.place-card__more')).toHaveCount(0);
  await expect(sheet.locator('.place-card__price')).toHaveText('¥42 escalator, optional');
  await expect(sheet.locator('dt')).toHaveCount(0);
  await expect(sheet.locator('.place-card__close')).toBeFocused();
  const amap = sheet.getByRole('link', { name: '高德地图' });
  const google = sheet.getByRole('link', { name: 'Google Maps' });
  await expect(amap).toHaveAttribute('href', 'https://uri.amap.com/search?keyword=' + encodeURIComponent('天门洞'));
  await expect(google).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Tianmen Cave, 天门洞'));
  for (const link of [amap, google]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  }
  expect(await page.evaluate(() => history.length)).toBe(length + 1);

  await sheet.locator('.place-card__view').click();
  const viewer = page.locator('.lightbox');
  await expect(viewer).toHaveClass(/is-visible/);
  await expect(card).not.toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox__context')).toHaveText(/1 of 2 · Day 6$/);
  expect(await page.evaluate(() => history.length)).toBe(length + 1);

  await page.goBack();
  await expect(viewer).not.toHaveClass(/is-visible/);
  await expect(card).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  await expect(stop).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/place-card-open|lightbox-open/);
});

test('Escape, the backdrop, the close button and Back close the place card and keep the page', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const card = page.locator('.place-card');
  const stop = await openStop(page, 4, '72 Wonder Tower');
  await expect(card.locator('dt')).toHaveText(['Hours']);
  await expect(card.locator('.place-card__price')).toHaveText('S$12 night');
  await expect(card.locator('.place-card__price .travel-route__klook')).toBeVisible();
  await expect(card.locator('.place-card__photos img')).toHaveCount(4);
  await expect(card.locator('.place-card__more')).toHaveCount(0);
  // Only the 4:30 pm day/night split is solid across sources; one session a line, times unbroken.
  expect(await card.locator('dd').nth(0).evaluate(dd => dd.innerHTML)).toBe('Day ticket until 4:30&nbsp;pm<br>Night ticket from 4:30&nbsp;pm');
  await page.keyboard.press('Escape');
  await expect(card).not.toHaveClass(/is-visible/);
  await expect(stop).toBeFocused();

  await stop.click();
  await expect(card).toHaveClass(/is-visible/);
  await settle(page);
  await page.mouse.click(8, 450);
  await expect(card).not.toHaveClass(/is-visible/);

  await stop.click();
  await settle(page);
  await card.getByRole('button', { name: 'Close place card' }).click();
  await expect(card).not.toHaveClass(/is-visible/);

  await stop.click();
  await page.goBack();
  await expect(card).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  // Each close stepped back over its entry, so a quick reopen stays open.
  await stop.click();
  await page.keyboard.press('Escape');
  await stop.click();
  await page.waitForTimeout(500);
  await expect(card).toHaveClass(/is-visible/);
});

test('a priced stop without photos opens a card with no photos or View button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const stop = page.locator('.has-card', { hasText: 'Bailong Elevator' });
  await expect(stop).not.toHaveClass(/has-photos/);
  await expect(stop).toHaveAttribute('aria-label', 'Open the place card for Bailong Elevator');
  await openStop(page, 5, 'Bailong Elevator');
  const card = page.locator('.place-card');
  await expect(card).toHaveClass(/is-visible/);
  await expect(card.locator('.place-card__title')).toHaveText('Bailong Elevator');
  await expect(card.locator('.place-card__photos, .place-card__view')).toHaveCount(0);
  await expect(card.locator('.place-card__price')).toHaveText('¥65 one way');
  await expect(card.locator('dd')).toHaveCount(0);
  await expect(card.getByRole('link')).toHaveText(['Google Maps', '高德地图']);
  // Stops with neither photos nor a price stay plain text.
  await expect(page.locator('.guangzhou-route__stop', { hasText: 'Zhangjiajie Airport' }).first()).not.toHaveAttribute('role', 'button');
});

// Fix round (18 Nov 2026, owner: "make sure it looks compact and tidy, especially on mobile").
test('the phone sheet stays compact: one row of photos, "+N" only past four, one primary button and quiet map links', async ({ page }) => {
  for (const [width, height] of [[390, 844], [320, 640]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/travel_2026_chengdu_zhangjiajie');
    await openStop(page, 4, '72 Wonder Tower');
    const sheet = page.locator('.place-card__sheet');
    await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
    const box = await sheet.boundingBox();
    expect(box.height, width + 'px sheet').toBeLessThanOrEqual(height * 0.6);
    const thumbs = await sheet.locator('.place-card__photos img').evaluateAll(images => images.map(image => image.getBoundingClientRect().top));
    expect(new Set(thumbs).size, 'one row').toBe(1);
    // One full-width primary action; the map apps are two soft buttons side by side, 44px tall.
    const view = await sheet.locator('.place-card__view').boundingBox();
    expect(Math.round(view.height)).toBe(44);
    expect(view.width).toBeGreaterThan(box.width * 0.85);
    const links = await sheet.locator('.place-card__map').evaluateAll(items => items.map(item => Math.round(item.getBoundingClientRect().height)));
    expect(links.length).toBe(2);
    expect(links).toEqual([44, 44]);
    const hours = await sheet.locator('dd').nth(0).evaluate(dd => dd.getBoundingClientRect().height / parseFloat(getComputedStyle(dd).lineHeight));
    expect(Math.round(hours), width + 'px hours lines').toBe(2);
    await page.keyboard.press('Escape');
  }

  // Seven photos: four thumbnails, the last marked +3.
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await openStop(page, 2, 'Red Panda Forest Park');
  const strip = page.locator('.place-card__photos');
  await expect(strip).toHaveAttribute('aria-label', 'View 7 photos');
  await expect(strip.locator('img')).toHaveCount(4);
  await expect(strip.locator('.place-card__more')).toHaveText('+3');
  const [last, more] = await page.evaluate(() => ['.place-card__photos img:last-of-type', '.place-card__more'].map(selector => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)];
  }));
  expect(more).toEqual(last);
});

test('a cancelled drag springs the sheet back, and a sheet left mid-drag reopens clean', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const stop = await openStop(page, 6, 'Tianmen Cave');
  const sheet = page.locator('.place-card__sheet');
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  const touch = (type, y) => sheet.evaluate((node, [type, y]) => {
    const point = new Touch({ identifier: 1, target: node, clientX: 200, clientY: y });
    node.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === 'touchmove' || type === 'touchstart' ? [point] : [], changedTouches: [point] }));
  }, [type, y]);
  const inline = () => sheet.evaluate(node => [node.style.transform, node.style.transition]);
  await touch('touchstart', 600);
  await touch('touchmove', 680);
  expect(await inline()).toEqual(['translateY(80px)', 'none']);
  await touch('touchcancel', 680);
  expect(await inline()).toEqual(['', '']);
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);

  // Closed with Escape mid-drag: the next open starts from no inline transform or transition.
  await touch('touchstart', 600);
  await touch('touchmove', 650);
  await page.keyboard.press('Escape');
  await expect(page.locator('.place-card')).not.toHaveClass(/is-visible/);
  await stop.click();
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  expect(await inline()).toEqual(['', '']);
  await context.close();
});

// WebKit's default Tab skips links, so a trap that waits for the last link let focus out.
const tabStaysInside = async (page, engine) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await openStop(page, 4, '72 Wonder Tower');
  const sheet = page.locator('.place-card__sheet');
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  const focused = () => page.evaluate(() => {
    const node = document.activeElement;
    return node.closest('.place-card__sheet') ? node.getAttribute('aria-label') || node.textContent.trim() : 'outside: ' + node.tagName;
  });
  const forward = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); forward.push(await focused()); }
  expect(forward, engine).toEqual(['View 4 photos', 'View 4 photos', 'Google Maps', '高德地图', 'Close place card', 'View 4 photos']);
  const back = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Shift+Tab'); back.push(await focused()); }
  expect(back, engine).toEqual(['Close place card', '高德地图', 'Google Maps', 'View 4 photos', 'View 4 photos', 'Close place card']);
  await expect(sheet).toBeVisible();
};

test('Tab and Shift+Tab stay inside the place card in Chromium and WebKit', async ({ page, browserName }) => {
  await tabStaysInside(page, browserName);
  if (browserName !== 'chromium') return;
  const { webkit } = require('@playwright/test');
  const browser = await webkit.launch();
  const context = await browser.newContext({ baseURL: new URL(page.url()).origin, reducedMotion: 'reduce' });
  try { await tabStaysInside(await context.newPage(), 'webkit'); }
  finally { await browser.close(); }
});

test('one or two photos fill the card at a real picture shape from the 800w file', async ({ page }) => {
  // Owner, 18 Nov 2026: a single photo was a thin, blurry strip ("really small and looks stretched").
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  for (const [day, name, count, ratio] of [[3, 'Dongmen Wharf', 1, 1.5], [4, 'Tianfu Airport', 2, 4 / 3]]) {
    await openStop(page, day, name);
    const images = page.locator('.place-card__photos img');
    await expect(images).toHaveCount(count);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('src', /-800\.(webp|jpe?g|png)$/);
      const box = await image.boundingBox();
      expect(Math.abs(box.width / box.height - ratio)).toBeLessThan(0.05);
    }
    await page.keyboard.press('Escape');
  }
});

// Fix round 3 (18 Nov 2026 review): the second click of a double click, or a second quick tap,
// landed on the card that had just opened and closed it or opened the lightbox.
test('a double click or two quick taps on a stop leave its card open', async ({ browser, page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const stop = page.locator('#trip-section-6 ~ .guangzhou-day__route .has-card', { hasText: 'Tianmen Cave' });
  await stop.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  await stop.dblclick();
  await settle(page);
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox')).not.toHaveClass(/is-visible/);
  // Past the guard the card's own controls work as before.
  await page.locator('.place-card__close').click();
  await expect(page.locator('.place-card')).not.toHaveClass(/is-visible/);

  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await context.newPage();
  await phone.goto('/travel_2026_chengdu_zhangjiajie');
  const route = phone.locator('#trip-section-6 ~ .guangzhou-day__route');
  await route.locator('.travel-route__more').scrollIntoViewIfNeeded();
  await route.locator('.travel-route__more').tap();
  await expect.poll(() => phone.evaluate(() => typeof window.travelPlaceCard)).toBe('function');
  const box = await route.locator('.has-card', { hasText: 'Tianmen Cave' }).boundingBox();
  await phone.touchscreen.tap(box.x + 40, box.y + 10);
  await phone.waitForTimeout(60);
  await phone.touchscreen.tap(box.x + 40, box.y + 10);
  await phone.waitForTimeout(400);
  await expect(phone.locator('.place-card')).toHaveClass(/is-visible/);
  await expect(phone.locator('.lightbox')).not.toHaveClass(/is-visible/);
  await context.close();
});

test('"+N" sits on a dark layer over the fourth thumbnail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  // Any stop with five or more photos, whatever it is called.
  const stop = page.getByRole('button', { name: /\((?:[5-9]|\d\d) photos\)$/, includeHidden: true }).first();
  await page.locator('.guangzhou-day__route').filter({ has: stop }).locator('.travel-route__more').click();
  await stop.click();
  await expect(page.locator('.place-card')).toHaveClass(/is-visible/);
  const more = page.locator('.place-card__more');
  await expect(more).toHaveText(/^\+\d+$/);
  const layer = await more.evaluate(node => {
    const css = getComputedStyle(node);
    const rgba = css.backgroundColor.match(/[\d.]+/g).map(Number);
    const box = node.getBoundingClientRect();
    return { alpha: rgba[3], darkest: Math.max(rgba[0], rgba[1], rgba[2]), color: css.color, onTop: document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2) === node };
  });
  expect(layer.alpha).toBeGreaterThanOrEqual(0.4);
  expect(layer.darkest).toBeLessThan(40);
  expect(layer.color).toBe('rgb(255, 255, 255)');
  expect(layer.onTop).toBe(true);
});

// Fix round 3 (18 Nov 2026 review): a folded phone route was a wall of small grey lines. Folded,
// it is the summary and View all; the total and Klook lines come with the stops, and the numbered
// list replaces the summary. Desktop routes keep every line.
test('folded phone routes show only the summary and View all; expanded ones drop the summary', async ({ page }) => {
  const shown = route => route.evaluate(node => [...node.children].filter(child => child.getClientRects().length)
    .map(child => child.classList[0] || child.tagName.toLowerCase()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const day2 = page.locator('#trip-section-5 ~ .guangzhou-day__route');
  const folded = ['strong', 'travel-route-summary', 'travel-route__more'];
  // Day 5 has a day total and the Klook tour line.
  const tours = await day2.locator('.travel-route__tour').count();
  expect(tours).toBeGreaterThan(0);
  const lines = ['travel-route', 'travel-route__total'].concat(Array(tours).fill('travel-route__tour'));
  expect(await shown(day2)).toEqual(folded);
  await day2.locator('.travel-route__more').click();
  expect(await shown(day2)).toEqual(['strong'].concat(lines, 'travel-route__more'));
  await day2.locator('.travel-route__more').click();
  expect(await shown(day2)).toEqual(folded);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  expect(await shown(day2)).toEqual(['strong'].concat(lines));
});

// Phone round, 18 Nov 2026 (owner, mockups K1, K4, K7).
test('folded summaries name the stops alone, except a CJK name keeps its English', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await expect(page.locator('.travel-route-summary').nth(1)).toHaveText('Panda Valley → Summer Island Apartment');
  await page.goto('/travel_2025_japan');
  await expect(page.locator('.travel-route-summary').first()).toContainText('Hiroshima Airport');
});

test('a one-photo day fills the phone row; desktop keeps its quarter tile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tile = page.locator('#trip-section-1 ~ .journal-gallery-shell .travel-gallery__item, #trip-section-1 ~ .travel-gallery .travel-gallery__item').first();
  const row = await tile.evaluate(item => [item.getBoundingClientRect().width, item.parentElement.clientWidth - parseFloat(getComputedStyle(item.parentElement).paddingRight)]);
  expect(Math.abs(row[0] - row[1])).toBeLessThan(2);
});

test('closing the viewer lands on the tile of the photo last shown; the same photo keeps the place', async ({ browser }) => {
  for (const how of ['close', 'back']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto('/travel_2026_chengdu_zhangjiajie');
    await page.locator('#trip-section-2 ~ .journal-gallery-shell .content').first().click();
    await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
    for (let i = 0; i < 14; i += 1) await page.getByRole('button', { name: 'Next media', exact: true }).click();
    await expect(page.locator('.lightbox__caption')).toContainText('Bon Appetit');
    if (how === 'close') await page.getByRole('button', { name: 'Close media viewer' }).click();
    else await page.goBack();
    await expect(page.locator('.lightbox')).not.toHaveClass(/is-visible/);
    await page.waitForTimeout(300);
    const landed = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { title: a.querySelector('.content-title') && a.querySelector('.content-title').textContent, top: r.top, bottom: r.bottom }; });
    expect(landed.title, how).toBe('Bon Appetit');
    expect(landed.top, how).toBeGreaterThanOrEqual(0);
    expect(landed.bottom, how).toBeLessThanOrEqual(844);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tile = page.locator('#trip-section-2 ~ .journal-gallery-shell .content').first();
  await tile.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await tile.click();
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await context.close();
});

// 18 Nov 2026 (owner: "visit stops and hide route button seems broken. check day 3"): a stop with no
// subtitle sits a few pixels lower on desktop and was taken for a second row.
test('a desktop route whose stops all fit one row has no View all button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  for (const day of [3, 7]) {
    const route = page.locator(`#trip-section-${day} ~ .guangzhou-day__route`);
    await expect(route, `Day ${day}`).not.toHaveClass(/is-desktop-wrapped/);
    await expect(route.locator('.travel-route__more'), `Day ${day}`).toBeHidden();
  }
});

// Full review, 18 Nov 2026.
test('a reopen before the close\'s own Back lands keeps one entry, so the next Back stays on the journal', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tile = page.locator('.travel-gallery .content').nth(3);
  await tile.scrollIntoViewIfNeeded();
  await tile.tap();
  await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
  // Close and reopen in one task, inside the tap's user activation, before the Back's popstate.
  await page.evaluate(() => { document.querySelector('.lightbox__close').click(); document.querySelectorAll('.travel-gallery .content')[3].click(); });
  await page.waitForTimeout(500);
  await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
  await page.goBack();
  await expect(page.locator('.lightbox')).not.toHaveClass(/is-visible/);
  expect(page.url()).toContain('travel_2026_chengdu_zhangjiajie');
  await context.close();
});

test('closing lands on the last photo in bare-masonry journals too, and Back to route lands on the route', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/travel_2025_japan');
  await page.locator('.masonry .content').nth(2).click();
  await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
  for (let i = 0; i < 9; i += 1) await page.getByRole('button', { name: 'Next media', exact: true }).click();
  const shownSrc = await page.locator('img.lightbox__image').getAttribute('src');
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await page.waitForTimeout(300);
  const focused = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { src: (a.querySelector('img') || {}).currentSrc || '', top: r.top, bottom: r.bottom }; });
  expect(focused.top).toBeGreaterThanOrEqual(0);
  expect(focused.bottom).toBeLessThanOrEqual(844);
  expect(shownSrc.split('/').pop().replace(/-\d+w?\.\w+$|\.\w+$/, '')).toBe(focused.src.split('/').pop().replace(/-\d+w?\.\w+$|\.\w+$/, ''));

  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await page.locator('#trip-section-2 ~ .journal-gallery-shell .content').nth(2).click();
  for (let i = 0; i < 8; i += 1) await page.getByRole('button', { name: 'Next media', exact: true }).click();
  await expect(page.locator('.lightbox__context')).toContainText('7 of 7');
  await page.getByRole('button', { name: 'Back to the route' }).click();
  await page.waitForTimeout(300);
  const route = await page.locator('#trip-section-2 ~ .guangzhou-day__route').evaluate(r => { const b = r.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; });
  expect(route.bottom).toBeGreaterThan(0);
  expect(route.top).toBeLessThan(844);
  await context.close();
});
