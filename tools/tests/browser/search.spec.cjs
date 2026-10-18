const { test, expect } = require('@playwright/test');
test.use({ actionTimeout: 10000 });

for (const width of [320, 375, 768, 1024, 1366]) {
  test(`four real discovery cards form the intended rows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    const cards = page.locator('.photo-explore__cards > .photo-explore__card');
    const images = page.locator('.photo-explore__cards img');
    await expect(cards).toHaveCount(4);
    await expect(images).toHaveCount(4);
    await expect(page.locator('[data-explore-action="surprise"], #photo-moment')).toHaveCount(0);
    const assertRows = async () => {
      const boxes = await cards.evaluateAll(es => es.map(e => {
        const box = e.getBoundingClientRect();
        return { top: Math.round(box.top), width: box.width, height: box.height };
      }));
      expect(boxes.every(box => box.width > 0 && box.height > 0)).toBe(true);
      const rows = [...new Set(boxes.map(box => box.top))];
      expect(rows.length).toBe(width >= 981 ? 1 : 2);
      expect(rows.map(top => boxes.filter(box => box.top === top).length)).toEqual(width >= 981 ? [4] : [2, 2]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    };
    await assertRows();
    await page.getByRole('button', { name: 'Another mix' }).click();
    await expect(page.locator('#photo-search-status')).toHaveText('Four new photo topics to explore.');
    await expect(cards).toHaveCount(4);
    await expect(images).toHaveCount(4);
    await assertRows();
  });
}

for (const width of [390, 1280]) {
  test(`search and discovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/travel');
    const input = page.getByRole('searchbox', { name: 'Search travel photos' });
    const explore = page.locator('.photo-explore__cards');
    await expect(explore).toBeVisible();
    await expect(explore.locator('[data-tag]')).toHaveCount(4);
    expect(await page.locator('script[src*="photo-search"]').count()).toBe(0);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('photo-index.json')))).toBe(false);
    const first = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    await page.getByRole('button', { name: 'Another mix' }).click();
    await expect(page.locator('#photo-search-status')).toHaveText('Four new photo topics to explore.');
    const second = await explore.locator('[data-tag]').evaluateAll(es => es.map(e => e.dataset.tag));
    expect(second.every(tag => !first.includes(tag))).toBe(true);
    await expect(page.getByRole('button', { name: 'Another mix' })).toBeFocused();
    await explore.locator('[data-tag]').first().click();
    await expect(page.locator('.photo-hit').first()).toBeVisible();
    await page.locator('.photo-search__clear').click();
    await input.fill('mount f');
    const fuji = page.locator('.photo-search__suggest [data-tag="mount fuji"]');
    await expect(fuji).toBeVisible();
    await fuji.click();
    await expect(input).toHaveValue('mount fuji ');
    await expect(page).toHaveURL(/q=mount\+fuji/);
    await expect(page.locator('.travel-atlas__layout')).toHaveAttribute('inert', '');
    await input.fill('zoo');
    await expect(page.locator('.photo-results__more')).toBeVisible();
    await page.locator('.photo-results__more').click();
    await expect(page.locator('.photo-hit')).toHaveCount(96);
    await expect(page.locator('.photo-hit').nth(48)).toBeFocused();
    await page.locator('[data-trip]').first().click();
    await expect(page.locator('[data-trip][aria-pressed="true"]')).toHaveCount(1);
    await input.press('Escape');
    await expect(page.locator('#photo-results')).toBeHidden();
    await expect(page.locator('.travel-atlas__layout')).not.toHaveAttribute('inert');
    await input.fill('qzxqzxqzx');
    await expect(page.locator('.photo-results__empty')).toBeVisible();
    await expect(page.locator('#photo-search-status')).toContainText('No photos');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await input.fill('red panda');
    await expect(page.locator('.photo-hit').first()).toBeVisible();
    await input.press('ArrowDown');
    await expect(page.locator('.photo-hit').first()).toBeFocused();
    await page.locator('.photo-hit').first().click();
    await expect(page).toHaveURL(/#photo=/);
    await expect(page.locator('.lightbox')).toBeVisible({ timeout: 15000 });
  });
}

test('index failure is visible even with an empty field', async ({ page }) => {
  await page.route('**/photo-index.json*', route => route.abort());
  await page.goto('/travel');
  await page.getByRole('searchbox').focus();
  await expect(page.locator('#photo-search-status')).toHaveText('Photo search is unavailable right now.');
  await expect(page.locator('.travel-grid')).toBeVisible();
});

test('cold postcard click survives a delayed index, reload avoids its previous topics', async ({ page }) => {
  await page.route('**/photo-index.json*', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/travel');
  const cards = page.locator('.photo-explore__cards [data-tag]');
  const first = await cards.evaluateAll(es => es.map(e => e.dataset.tag));
  await page.reload();
  const next = await cards.evaluateAll(es => es.map(e => e.dataset.tag));
  expect(next.length).toBe(4);
  expect(next.every(tag => !first.includes(tag))).toBe(true);
  await cards.first().click();
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await expect(page.locator('.photo-hit').first()).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveValue(next[0]);
});

test('postcards and journal links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/travel');
  await expect(page.locator('.photo-explore__card')).toHaveCount(4);
  await expect(page.locator('.photo-explore__card').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Surprise me' })).toHaveCount(0);
  await expect(page.locator('.travel-grid')).toBeVisible();
  await context.close();
});

test('initial and shuffled postcards render the reviewed thumbnail and crop for their topic', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; sessionStorage.removeItem('photo-search-explore'); });
  await page.goto('/travel');
  const indexUrl = await page.locator('#photo-search').getAttribute('data-search-index');
  const data = await (await page.request.get('/' + indexUrl)).json();
  const cards = page.locator('.photo-explore__cards .photo-explore__card');
  await expect(cards).toHaveCount(4);
  const tea = page.locator('.photo-explore__cards [data-tag="tea"]');
  await expect(tea).toHaveCount(1);
  await expect(tea).not.toHaveAttribute('data-cover-id', '2023_perth/day3/bariuma_ramen');
  for (let batch = 0; batch < 2; batch++) {
    const rendered = await cards.evaluateAll(es => es.map(e => ({
      id: e.dataset.coverId, tag: e.dataset.tag, src: e.querySelector('img').getAttribute('src'),
      crop: getComputedStyle(e.querySelector('img')).objectPosition,
      caption: e.querySelector('.photo-explore__caption').textContent
    })));
    expect(rendered).toHaveLength(4);
    for (const card of rendered) {
      const row = data.covers.find(c => data.photos[c[0]].id === card.id);
      const cover = { tags: row[1].map(i => data.photos[row[0]].tags[i]), fx: row[2] ?? 50, fy: row[3] ?? 50 };
      expect(cover.tags).toContain(card.tag);
      expect(card.src).toBe(data.photos.find(p => p.id === card.id).thumb);
      expect(card.crop).toBe(`${cover.fx}% ${cover.fy}%`);
      expect(card.caption).not.toContain('Photo:');
      expect(card.caption).toMatch(/ · \d{4}/);
      expect(card.caption).not.toContain('Â');
    }
    if (!batch) {
      await page.getByRole('button', { name: 'Another mix' }).click();
      await expect(page.locator('#photo-search-status')).toHaveText('Four new photo topics to explore.');
    }
  }
});

test('corrupt recent storage, IME composition and restored URL queries', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('photo-search-recent', '{}'));
  await page.goto('/travel?q=penguin');
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  await page.locator('#photo-search-input').evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = '京都';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/q=penguin/);
  await page.locator('#photo-search-input').evaluate(input => input.dispatchEvent(new CompositionEvent('compositionend')));
  await expect(page).toHaveURL(/q=%E4%BA%AC%E9%83%BD/);
  await expect(page.locator('.photo-hit').first()).toBeVisible();
});

test('layout and child scrolls cannot cancel a photo landing; visitor input still can', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const timer = setInterval(() => {
      const strip = document.querySelector('.travel-jump-groups');
      if (strip) strip.dispatchEvent(new Event('scroll'));
      // Simulate browser scroll anchoring while a cold layout is settling.
      window.scrollBy(0, 1);
    }, 50);
    setTimeout(() => clearInterval(timer), 6000);
  });
  const url = '/travel_2026_chengdu_zhangjiajie#photo=2026_chengdu_zhangjiajie/day2/red-panda-bamboo';
  await page.goto(url);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'false', { timeout: 15000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await page.waitForTimeout(5500);
  await expect(page.locator('.lightbox')).toHaveAttribute('aria-hidden', 'true');
});

test('pending input cannot paginate stale hits', async ({ page }) => {
  await page.goto('/travel?q=zoo');
  await expect(page.locator('.photo-results__more')).toBeVisible();
  await page.locator('#photo-search-input').evaluate(input => {
    input.value = 'penguin';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.photo-results__more').click();
  });
  await expect(page).toHaveURL(/q=penguin/);
  await expect(page.locator('.photo-hit').first()).toBeVisible();
  expect(await page.locator('.photo-hit').count()).toBeLessThanOrEqual(48);
});

test('long recent queries stay inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('photo-search-recent', JSON.stringify(['panda '.repeat(25)])));
  await page.goto('/travel');
  await page.getByRole('searchbox').focus();
  const recent = page.locator('.photo-search__chips--recent [data-tag]');
  await expect(recent).toBeVisible();
  const box = await recent.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(390);
});
