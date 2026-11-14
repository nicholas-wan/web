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
  // Focus lands on the dialog itself (WebKit ringed a focused tile, which read as selected); Tab enters the tiles.
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Tab');
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

// 8 Nov 2026 review: a tap on the dim closes the sheet on touch WebKit too (it sends no click there), without following
// a link under the dim; and home's trigger is the same labelled Menu pill as every other page.
test('a tap on the dim closes the phone sheet, and home has the labelled pill', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(BASE + '/skills');
  const toggle = page.getByRole('link', { name: 'Open navigation menu' });
  const box = await toggle.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeVisible();
  const home = await page.locator('#header .logo').boundingBox();
  await page.touchscreen.tap(home.x + home.width / 2, home.y + home.height / 2);
  await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeHidden();
  await page.waitForTimeout(400);
  await expect(page).toHaveURL(/\/skills$/);
  await page.goto(BASE + '/index');
  await expect(page.locator('#navPanelToggle')).toHaveText('Menu');
  await expect(page.locator('#navPanelToggle')).toHaveCSS('font-size', /^1[2-9]/);
  await context.close();
});

// 10 Nov 2026 (owner: "index page has huge white space"): the desktop About scene settles as one
// frame, photo and copy over the cards, with no dead band above the photo or between it and the cards.
test('desktop About settles with the photo and cards in one frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, height] of [[1440, 900], [1366, 768], [820, 1180]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/index');
    await page.waitForLoadState('load');
    // The pin starts where the section's top meets --swipe-top and lasts the section's height less the stage's.
    const settle = await page.evaluate(() => {
      const section = document.querySelector('.intro-swipe');
      const stage = section.querySelector('.intro-swipe__stage');
      const pin = parseFloat(section.style.getPropertyValue('--swipe-top'));
      return section.getBoundingClientRect().top + scrollY - pin + section.offsetHeight - stage.offsetHeight;
    });
    await page.evaluate(y => window.scrollTo(0, y), settle);
    await expect.poll(() => page.evaluate(() => document.querySelector('.intro-swipe').style.getPropertyValue('--p'))).toMatch(/^(1\.0000|0\.99)/);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.homepage-link:last-child')).opacity)).toBe('1');
    const frame = await page.evaluate(() => {
      const photo = document.querySelector('.intro-swipe__photo img').getBoundingClientRect();
      const cards = document.querySelector('.homepage-links').getBoundingClientRect();
      // From 981px the nav docks over the sheet, and the cluster centres in the space under it.
      const nav = document.getElementById('nav');
      const navBottom = getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().bottom : 0;
      return { top: photo.top - navBottom, gap: cards.top - photo.bottom, bottom: innerHeight - cards.bottom, ratio: photo.width / photo.height };
    });
    expect(frame.top).toBeGreaterThanOrEqual(0);
    expect(frame.bottom).toBeGreaterThanOrEqual(0);
    expect(frame.gap).toBeLessThan(80);
    // Centred as one cluster: the space above the photo matches the space under the cards.
    expect(Math.abs(frame.top - frame.bottom)).toBeLessThan(40);
    // The photo keeps its 3:4 shape (portrait tablets once letterboxed it inside a tall white card).
    expect(Math.abs(frame.ratio - 0.75)).toBeLessThan(0.01);
  }
});

// 10 Nov 2026 (owner: "is it weird that the photo suddenly pops up? with nothing in between"): the
// scrub starts before the pin, so the copy is already arriving when the nav reaches the top.
test('desktop About copy arrives with the photo, not after it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, height] of [[1440, 900], [1366, 768], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/index');
    await page.waitForLoadState('load');
    const navTop = await page.evaluate(() => document.getElementById('nav').getBoundingClientRect().top + scrollY);
    await page.evaluate(y => window.scrollTo(0, y), navTop);
    await expect.poll(() => page.evaluate(() => parseFloat(document.querySelector('.intro-swipe').style.getPropertyValue('--p')))).toBeGreaterThan(0.8);
    const frame = await page.evaluate(() => {
      const photo = document.querySelector('.intro-swipe__photo img').getBoundingClientRect();
      const title = document.querySelector('.intro-swipe__text h2').getBoundingClientRect();
      const sheet = document.querySelector('#main .post.featured').getBoundingClientRect();
      return { photoBottom: photo.bottom, titleLeft: title.left, titleRight: title.right, photoRight: photo.right, sheetRight: sheet.right, vh: innerHeight };
    });
    // The whole photo is in view and the title is on the sheet beside it.
    expect(frame.photoBottom).toBeLessThanOrEqual(frame.vh);
    expect(frame.titleLeft).toBeGreaterThan(frame.photoRight);
    expect(frame.titleRight).toBeLessThan(frame.sheetRight);
  }
});

// 11 Nov 2026 (review of the staged entrance): it plays on the first view of Home in a visit; a
// return from another page starts at rest, so no blurred name ghosts the page transition.
test('the staged hero entrance plays once per visit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  const nameAnimation = () => page.evaluate(() => getComputedStyle(document.querySelector('#intro h1')).animationName);
  await page.goto('/index');
  await page.waitForLoadState('load');
  expect(await nameAnimation()).not.toBe('none');
  await page.goto('/experience');
  await page.goto('/index');
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => document.documentElement.classList.contains('hero-seen'))).toBe(true);
  expect(await nameAnimation()).toBe('none');
});

// 10 Nov 2026 (owner: "desktop should glide too"): a wheel scroll that stops partway down the hero
// glides on to the settled About frame, photo and copy over all three cards. Owner, the same day:
// "the header bar is on neither resting frame", so the bar runs along the hero's foot and docks
// over the settled scene.
test('desktop hero gate glides to the settled About frame, with the bar on both frames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, height] of [[1440, 900], [1366, 768], [1024, 640]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/index');
    await page.waitForLoadState('load');
    const settle = await page.evaluate(() => {
      const section = document.querySelector('.intro-swipe');
      const stage = section.querySelector('.intro-swipe__stage');
      const pin = parseFloat(getComputedStyle(stage).top);
      return Math.round(section.getBoundingClientRect().top + scrollY - pin + section.offsetHeight - stage.offsetHeight);
    });
    const navAt = () => page.evaluate(() => { const r = document.getElementById('nav').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
    const hero = await navAt();
    expect(hero.bottom).toBe(hero.vh);
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, 200);
    // Within a pixel: WebKit rounds the fractional pin differently.
    await expect.poll(() => page.evaluate(s => Math.abs(scrollY - s), settle), { timeout: 4000 }).toBeLessThanOrEqual(1);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.homepage-link:last-child')).opacity)).toBe('1');
    expect((await navAt()).top).toBe(0);
    const cardsBottom = await page.evaluate(() => document.querySelector('.homepage-links').getBoundingClientRect().bottom);
    expect(cardsBottom).toBeLessThanOrEqual(height);
    // A wheel back up glides home, where the bar again runs along the foot.
    await page.mouse.wheel(0, -120);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 4000 }).toBe(0);
  }
});

// 10 Nov 2026 (owner: "the index page is kind of weird now"): the phone About cluster is centred in
// its one-viewport scene; bottom-anchored, all the spare height was one blank band above "About me".
test('phone About is centred in its scene with a 3:4 photo', async ({ browser }) => {
  for (const [width, height] of [[390, 844], [390, 664], [320, 568]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(BASE + '/index');
    await page.waitForLoadState('load');
    const top = await page.evaluate(() => document.querySelector('.intro-swipe').getBoundingClientRect().top + scrollY);
    await page.evaluate(y => window.scrollTo(0, Math.ceil(y)), top);
    await expect.poll(() => page.evaluate(() => document.querySelector('.intro-swipe').style.getPropertyValue('--photo-p'))).toMatch(/^(1.0000|0.99)/);
    const frame = await page.evaluate(() => {
      const scene = document.querySelector('.intro-swipe').getBoundingClientRect();
      const head = document.querySelector('.intro-swipe__head').getBoundingClientRect();
      const copy = document.querySelector('.intro-swipe__text').getBoundingClientRect();
      const photo = document.querySelector('.intro-swipe__photo img').getBoundingClientRect();
      return { above: head.top - scene.top, below: scene.bottom - copy.bottom, ratio: photo.width / photo.height, left: photo.left, right: photo.right, vw: innerWidth };
    });
    expect(frame.above).toBeGreaterThanOrEqual(0);
    expect(frame.below).toBeGreaterThanOrEqual(0);
    expect(Math.abs(frame.above - frame.below)).toBeLessThan(4);
    expect(Math.abs(frame.ratio - 0.75)).toBeLessThan(0.01);
    expect(frame.left).toBeGreaterThanOrEqual(0);
    expect(frame.right).toBeLessThanOrEqual(frame.vw);
    await context.close();
  }
});

// Each hero circle opens outwards from a fixed slot, so its icon and its neighbour stay where they are.
test('hero buttons open outwards without moving each other', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/index');
  const buttons = page.locator('#intro .portfolio-hero__cta');
  await expect(buttons).toHaveCount(2);
  expect(await buttons.evaluateAll(items => items.map(a => new URL(a.href).pathname + new URL(a.href).hash))).toEqual(['/experience#selected-work', '/projects']);
  const rest = await buttons.evaluateAll(items => items.map(a => a.getBoundingClientRect().toJSON()));
  for (const index of [0, 1]) {
    await buttons.nth(index).hover();
    await expect(buttons.nth(index).locator('.portfolio-hero__cta-label')).toHaveCSS('opacity', '1');
    const open = await buttons.evaluateAll(items => items.map(a => a.getBoundingClientRect().toJSON()));
    expect(open[index].width).toBeGreaterThan(rest[index].width + 80);
    // The inner edge (and so the icon) of the open one holds, and the other does not move at all.
    const inner = index === 0 ? 'right' : 'left';
    expect(Math.abs(open[index][inner] - rest[index][inner])).toBeLessThan(1);
    expect(Math.abs(open[1 - index].left - rest[1 - index].left)).toBeLessThan(1);
    await page.mouse.move(5, 5);
    await expect.poll(() => buttons.nth(index).evaluate(a => a.getBoundingClientRect().width)).toBeLessThan(rest[index].width + 1);
  }
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

test('phones: return-to-top steps off the footer, and a two-stop route has no View all button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/skills');
  const top = page.locator('#return-to-top');
  await page.evaluate(() => scrollTo(0, 400));
  await expect(top).toHaveClass(/is-visible/);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(top).not.toHaveClass(/is-visible/);
  await page.goto('/travel_2017_seoul');
  const route = page.locator('.guangzhou-day__route').first();
  await expect(route.locator('.travel-route-summary')).toBeVisible();
  await expect(route.locator('.travel-route__more')).toBeHidden();
  // Longer routes keep theirs.
  await page.goto('/travel_2023_perth');
  await expect(page.locator('.guangzhou-day__route .travel-route__more').first()).toBeVisible();
});
