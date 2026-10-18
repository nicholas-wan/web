const { test, expect } = require('@playwright/test');

for (const width of [768, 1366]) {
  test(`map shortcut scrolls the document without trapping the Travel opening at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    await page.locator('.travel-portal[data-portal="map"]').click();
    await expect(page.locator('.travel-atlas__layout')).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    expect(await page.locator('.travel-atlas').first().evaluate(el => el.scrollTop)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.locator('.travel-atlas').first().evaluate(el => el.scrollTop)).toBe(0);
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
    await expect(page.locator(width===375?'.mobile-journal-list':'.travel-grid')).toBeVisible();
    await expect(page.locator('.travel-grid')).not.toHaveAttribute('inert');
    await expect(page.locator('#travel-archive-title')).toBeFocused();
    await expect(page.locator('#travel-archive-title')).toBeInViewport();
    expect(new URL(page.url()).searchParams.has('q')).toBe(false);
    if (width === 375) {
      await expect(page.locator('.journal-chronology')).toBeHidden();
    } else {
      await expect(page.locator('.journal-chronology')).toBeVisible();
      const cells = await page.locator('.travel-grid > .travel-card').evaluateAll(es => es.map(e => getComputedStyle(e).gridArea));
      expect(new Set(cells).size).toBe(1);
      await expect(page.locator('.travel-grid > .travel-card.preview-selected')).toHaveCount(1);
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
  expect(await page.locator('.travel-atlas').first().evaluate(el => el.scrollTop)).toBe(0);
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
    await expect(timeline.locator('.authored-scene > svg')).toHaveCount(10);
    const fitting = await timeline.evaluate(el => {
      const scroller = el.querySelector('.chronology-scroll');
      const bounds = el.querySelector('.chronology-track').getBoundingClientRect();
      return {
        overflow: scroller.scrollWidth - scroller.clientWidth,
        labels: [...el.querySelectorAll('.chronology-name')].map(name => {
          const box = name.getBoundingClientRect();
          return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
        })
      };
    });
    if(fitting.overflow>1) await expect(timeline.locator('.chronology-controls')).toBeVisible();
    expect(fitting.labels.every(Boolean)).toBe(true);
    const scenes = await trips.evaluateAll(es => es.map(trip => {
      const art = trip.querySelector('.authored-scene').getBoundingClientRect();
      const scroll = trip.closest('.chronology-track').getBoundingClientRect();
      const bounds = trip.getBoundingClientRect();
      const connector = getComputedStyle(trip, '::before');
      const connectorTop = bounds.top + parseFloat(connector.top);
      const connectorBottom = connectorTop + parseFloat(connector.height);
      const gap = trip.classList.contains('lane-1')
        ? trip.querySelector('.chronology-name').getBoundingClientRect().top - connectorBottom
        : connectorTop - trip.querySelector('.chronology-date').getBoundingClientRect().bottom;
      return { width: art.width, height: art.height, fits: art.left >= scroll.left - 1 && art.right <= scroll.right + 1 && art.top >= scroll.top - 1 && art.bottom <= scroll.bottom + 1, gap };
    }));
    for (const scene of scenes) {
      expect(scene.width).toBeCloseTo(136, 0);
      expect(scene.height).toBeCloseTo(91, 0);
      expect(scene.fits).toBe(true);
      expect(scene.gap).toBeGreaterThanOrEqual(5);
    }
    const hrefs = await trips.evaluateAll(es => es.map(e => e.getAttribute('href')));
    const cardHrefs = await page.locator('.travel-grid .travel-card__image').evaluateAll(es => es.map(e => e.getAttribute('href')));
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
      await expect(page.locator('.travel-card.preview-selected')).toHaveCount(1);
      expect(await page.locator(`.travel-grid .travel-card__image[href="${href}"]`).evaluate(el => el.closest('.travel-card').classList.contains('preview-selected'))).toBe(true);
      await expect(page).toHaveURL(/\/travel(?:#.*)?$/);
      await timeline.scrollIntoViewIfNeeded();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('timeline dates stay unadorned and activate their matching journal', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1080 });
  await page.goto('/travel');
  const trip = page.locator('.journal-chronology .chronology-trip').last();
  const date = trip.locator('.chronology-date');
  await date.hover();
  // Decorations on an ancestor paint through descendants even when the date's
  // own computed style says none, so check the full clickable label chain.
  expect(await date.evaluate(el => {
    for (let node = el; node; node = node.parentElement) {
      if (getComputedStyle(node).textDecorationLine.includes('underline')) return false;
      if (node.classList.contains('chronology-trip')) break;
    }
    return true;
  })).toBe(true);
  const href = await trip.getAttribute('href');
  await date.click();
  await expect(page.locator(`.travel-grid .travel-card__image[href="${href}"]`)).toBeFocused();
  await expect(page.locator('.travel-card.preview-selected')).toHaveCount(1);
  await expect(page).toHaveURL(/\/travel(?:#.*)?$/);
});

test.describe('destination scene interactions', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('visible timeline tours each destination rightward, rests, and repeats', async ({ page }) => {
    await page.clock.install();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/travel');
    await page.mouse.move(0, 0);
    await page.locator('.journal-chronology').scrollIntoViewIfNeeded();
    const scenes = page.locator('.journal-chronology .authored-scene');
    const active = page.locator('.journal-chronology .authored-scene.is-active');
    const pulse = page.locator('.chronology-pulse');
    await expect(scenes.first()).toHaveClass(/is-active/);
    await page.clock.pauseAt(new Date(Date.now() + 50));
    const durations = await scenes.evaluateAll(es => es.map(e => Number(e.dataset.duration)));
    for (let index = 0; index < durations.length; index++) {
      await expect(scenes.nth(index)).toHaveClass(/is-active/);
      await expect(active).toHaveCount(1);
      await page.clock.runFor(durations[index] + 160);
      await expect(active).toHaveCount(0);
      if (index < durations.length - 1) {
        await expect(pulse).toBeVisible();
        const movement = await pulse.evaluate(el => {
          const animation = el.getAnimations()[0];
          if (!animation) return null;
          const frames = animation.effect.getKeyframes();
          return { duration: animation.effect.getTiming().duration, start: new DOMMatrix(frames[0].transform).m41, end: new DOMMatrix(frames.at(-1).transform).m41 };
        });
        expect(movement).not.toBeNull();
        expect(movement.duration).toBe(650);
        expect(movement.end).toBeGreaterThan(movement.start);
        // The test clock controls scheduler timers, not the browser's WAAPI
        // timeline. Complete the verified pulse to advance its real callback.
        await pulse.evaluate(async el => {
          const animation = el.getAnimations()[0];
          animation.finish();
          await animation.finished;
        });
      }
    }
    await expect(pulse).toBeHidden();
    await page.clock.runFor(1999);
    await expect(active).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(scenes.first()).toHaveClass(/is-active/);
    await expect(active).toHaveCount(1);
  });

  test('hover and keyboard focus share one finite active scene', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 1080 });
    await page.goto('/travel');
    await page.locator('.journal-chronology').scrollIntoViewIfNeeded();
    const trips = page.locator('.journal-chronology .chronology-trip');
    const active = page.locator('.journal-chronology .authored-scene.is-active');
    await trips.first().locator('.chronology-name').hover();
    await expect(trips.first().locator('.authored-scene')).toHaveClass(/is-active/);
    await expect(active).toHaveCount(1);
    await expect(page.locator('.chronology-pulse')).toBeHidden();
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await trips.nth(1).focus();
    await expect(trips.nth(1).locator('.authored-scene')).toHaveClass(/is-active/);
    await expect(trips.first().locator('.authored-scene')).not.toHaveClass(/is-active/);
    await expect(active).toHaveCount(1);
    await expect(active).toHaveCount(0, { timeout: 8000 });
    // Keyboard focus retains manual control after its finite scene ends.
    await page.waitForTimeout(2200);
    await expect(active).toHaveCount(0);
    await expect(page.locator('.chronology-pulse')).toBeHidden();
    expect(await page.locator('.journal-chronology .authored-scene').evaluateAll(es => es.flatMap(e => e.getAnimations({ subtree: true })).filter(a => a.playState === 'running').length)).toBe(0);
  });

  test('changing reduced-motion preference stops a scene and prevents replay', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 1080 });
    await page.goto('/travel');
    await page.locator('.journal-chronology').scrollIntoViewIfNeeded();
    const trips = page.locator('.journal-chronology .chronology-trip');
    await trips.first().locator('.chronology-name').hover();
    await expect(page.locator('.journal-chronology .authored-scene.is-active')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.journal-chronology .authored-scene.is-active')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await trips.nth(1).focus();
    await expect(page.locator('.journal-chronology .authored-scene.is-active')).toHaveCount(0);
    expect(await page.locator('.journal-chronology .authored-scene').evaluateAll(es => es.flatMap(e => e.getAnimations({ subtree: true })).filter(a => a.playState === 'running').length)).toBe(0);
  });
});
