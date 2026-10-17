const { test, expect } = require('@playwright/test');

const openings = [
  ['/experience', '.portfolio-headline h1'],
  ['/skills', '.skills-heading h2'],
  ['/personal', '.personal-timeline__intro h1'],
  ['/travel', '.travel-atlas__header h1']
];

for (const width of [320, 375, 1366]) {
  test(`page openings share title placement and typography at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const titles = [];
    for (const [route, selector] of openings) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const title = page.locator(selector);
      await expect(title).toBeVisible();
      titles.push(await title.evaluate(el => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          x: box.left, y: box.top,
          typography: Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'color'].map(key => [key, style[key]]))
        };
      }));
    }
    for (let i = 1; i < titles.length; i++) {
      expect(Math.abs(titles[i].x - titles[0].x), openings[i][0] + ' title left edge').toBeLessThanOrEqual(1);
      expect(Math.abs(titles[i].y - titles[0].y), openings[i][0] + ' title top edge').toBeLessThanOrEqual(1);
      expect(titles[i].typography, openings[i][0] + ' title style').toEqual(titles[0].typography);
    }
  });
}

for (const width of [320, 375, 768, 1024, 1366, 1920]) {
  test(`internship cards contain their text and align desktop rows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/experience');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.internship-group').scrollIntoViewIfNeeded();
    const cards = await page.locator('.case-study--internship').evaluateAll(items => items.map(card => {
      const box = card.getBoundingClientRect();
      const overflow = [];
      // Range rectangles catch overflowing text even when a clipping ancestor
      // hides it or the element's own border box still fits the card.
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1) overflow.push(node.textContent.trim());
        }
      }
      return {
        id: card.id, height: box.height, overflow,
        rows: ['.case-study__company', 'h2', '.case-study__lede', '.case-study__tags'].map(selector => card.querySelector(selector).getBoundingClientRect().top),
        ledeSize: parseFloat(getComputedStyle(card.querySelector('.case-study__lede')).fontSize)
      };
    }));
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.overflow, card.id + ' text overflow').toEqual([]);
      if (width <= 736) expect(card.ledeSize, card.id + ' phone text floor').toBeGreaterThanOrEqual(12);
      if (width > 980) {
        expect(Math.abs(card.height - cards[0].height), card.id + ' height').toBeLessThanOrEqual(1);
        card.rows.forEach((top, index) => expect(Math.abs(top - cards[0].rows[index]), card.id + ' row ' + index).toBeLessThanOrEqual(1));
      }
    }
  });
}
