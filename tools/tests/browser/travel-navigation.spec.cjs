const { test, expect } = require('@playwright/test');

for (const width of [768, 1366]) {
  test(`map shortcut scrolls the document without trapping the Travel opening at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    await page.locator('.travel-portal[data-portal="map"]').click();
    await expect(page.locator('.travel-atlas__layout')).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    expect(await page.locator('.travel-atlas').evaluate(el => el.scrollTop)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.locator('.travel-atlas').evaluate(el => el.scrollTop)).toBe(0);
    await expect(page.locator('.travel-portals')).toBeInViewport();
    await expect(page.getByRole('searchbox')).toBeInViewport();
  });
}

for (const width of [375, 1366]) {
  test(`journal shortcut clears search and restores the archive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel?q=panda');
    await expect(page.locator('.photo-hit').first()).toBeVisible();
    await expect(page.locator('.travel-grid')).toBeHidden();
    await page.locator('.travel-portal[data-portal="journals"]').click();
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await expect(page.locator('#photo-results')).toBeHidden();
    await expect(page.locator('.travel-grid')).toBeVisible();
    await expect(page.locator('.travel-grid')).not.toHaveAttribute('inert');
    await expect(page.locator('#travel-archive-title')).toBeFocused();
    await expect(page.locator('#travel-archive-title')).toBeInViewport();
    expect(new URL(page.url()).searchParams.has('q')).toBe(false);
    if (width === 375) {
      await expect(page.locator('.journal-chronology')).toBeHidden();
    } else {
      await expect(page.locator('.journal-chronology')).toBeVisible();
      const tops = await page.locator('.travel-grid > .travel-card').evaluateAll(es => es.slice(0, 5).map(e => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops.slice(0, 4)).size).toBe(1);
      expect(tops[4]).toBeGreaterThan(tops[0]);
    }
  });
}

test('phone map shortcut opens the atlas and its close control restores browsing', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/travel');
  await page.locator('.travel-portal[data-portal="map"]').click();
  await expect(page.locator('body')).toHaveClass(/is-map-fullscreen/);
  await page.getByRole('button', { name: 'Close map', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/is-map-fullscreen/);
  expect(await page.locator('.travel-atlas').evaluate(el => el.scrollTop)).toBe(0);
});

for (const width of [1366, 1920]) {
  test(`timeline endpoints fit and trip selection finds the matching journal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto('/travel');
    const timeline = page.locator('.journal-chronology');
    await timeline.scrollIntoViewIfNeeded();
    await expect(timeline).toBeVisible();
    const trips = timeline.locator('.chronology-trip');
    await expect(trips).toHaveCount(10);
    const fitting = await timeline.evaluate(el => {
      const scroller = el.querySelector('.chronology-scroll');
      const bounds = scroller.getBoundingClientRect();
      return {
        overflow: scroller.scrollWidth - scroller.clientWidth,
        labels: [...el.querySelectorAll('.chronology-name')].map(name => {
          const box = name.getBoundingClientRect();
          return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
        })
      };
    });
    expect(fitting.overflow).toBeLessThanOrEqual(1);
    expect(fitting.labels.every(Boolean)).toBe(true);
    const hrefs = await trips.evaluateAll(es => es.map(e => e.getAttribute('href')));
    const cardHrefs = await page.locator('.travel-card__image').evaluateAll(es => es.map(e => e.getAttribute('href')));
    expect([...hrefs].sort()).toEqual([...cardHrefs].sort());
    const starts = await trips.evaluateAll(es => es.map(e => e.dataset.start));
    expect(starts).toEqual([...starts].sort());
    for (const trip of [trips.first(), trips.last()]) {
      // Keep a stationary pointer from generating a hover as scrolling restores
      // the timeline; this assertion exercises keyboard focus independently.
      await page.mouse.move(0, 0);
      await trip.focus();
      const name = await trip.locator('.chronology-label').innerText();
      const href = await trip.getAttribute('href');
      const card = page.locator('.travel-card').filter({ has: page.locator(`a[href="${href}"]`) });
      const dates = await card.locator('.date').innerText();
      await expect(timeline.locator('.chronology-detail')).toContainText(name);
      await expect(timeline.locator('.chronology-detail')).toContainText(dates);
      await trip.locator('.chronology-name').click();
      expect(await card.evaluate(el => el.contains(document.activeElement) && document.activeElement.tagName === 'A')).toBe(true);
      await expect(page.locator('.travel-card.is-timeline-selected')).toHaveCount(1);
      expect(await page.locator(`.travel-card__image[href="${href}"]`).evaluate(el => el.closest('.travel-card').classList.contains('is-timeline-selected'))).toBe(true);
      await expect(page).toHaveURL(/\/travel(?:#.*)?$/);
      await timeline.scrollIntoViewIfNeeded();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
