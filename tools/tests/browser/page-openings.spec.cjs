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
  test(`internship entries contain text and keep descriptions with tags at ${width}px`, async ({ page }) => {
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
        // The peek scenes' labels live in a card that floats below the chip
        // on wider screens, past the entry by design; internship-peek.spec
        // checks that card on its own.
        if (node.parentElement.closest('.internship-demo-card')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1) overflow.push(node.textContent.trim());
        }
      }
      const company = card.querySelector('.case-study__company').getBoundingClientRect();
      const body = card.querySelector('.internship-entry__body').getBoundingClientRect();
      const lede = card.querySelector('.case-study__lede').getBoundingClientRect();
      const tags = card.querySelector('.case-study__tags').getBoundingClientRect();
      return {
        id: card.id, top: box.top, bottom: box.bottom, left: box.left, width: box.width, overflow,
        company: { left: company.left, right: company.right, top: company.top, bottom: company.bottom },
        body: { left: body.left, top: body.top },
        tagGap: tags.top - lede.bottom,
        expectedTagGap: parseFloat(getComputedStyle(card.querySelector('.case-study__tags')).marginTop),
        ledeSize: parseFloat(getComputedStyle(card.querySelector('.case-study__lede')).fontSize)
      };
    }));
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.overflow, card.id + ' text overflow').toEqual([]);
      if (width <= 736) expect(card.ledeSize, card.id + ' phone text floor').toBeGreaterThanOrEqual(12);
      expect(Math.abs(card.left - cards[0].left), card.id + ' entry left edge').toBeLessThanOrEqual(1);
      expect(Math.abs(card.width - cards[0].width), card.id + ' entry width').toBeLessThanOrEqual(1);
      expect(Math.abs(card.tagGap - card.expectedTagGap), card.id + ' no stretched tag gap').toBeLessThanOrEqual(1);
      if (width > 736) {
        expect(card.body.left, card.id + ' description beside company').toBeGreaterThan(card.company.right);
        expect(Math.abs(card.body.top - card.company.top), card.id + ' columns top align').toBeLessThanOrEqual(1);
      } else {
        expect(card.body.top, card.id + ' description below company').toBeGreaterThan(card.company.bottom);
        expect(Math.abs(card.body.left - card.company.left), card.id + ' phone left edges').toBeLessThanOrEqual(1);
      }
    }
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].top, cards[i].id + ' follows previous entry').toBeGreaterThanOrEqual(cards[i - 1].bottom - 1);
    }
  });
}
