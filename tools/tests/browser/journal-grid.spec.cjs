const { test, expect } = require('@playwright/test');

for (const width of [390, 768, 1280]) {
  test(`tall journal photos preserve grid alignment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const trip of ['2026_guangzhou', '2026_chengdu_zhangjiajie', '2025_japan', '2022_europe', '2017_seoul']) {
      await page.goto('/travel_' + trip);
      const tall = page.locator('.guangzhou-gallery__brick--tall');
      for (let i = 0; i < await tall.count(); i++) {
        const tile = tall.nth(i);
        await tile.scrollIntoViewIfNeeded();
        await tile.locator('img').evaluate(img => img.decode());
        const geometry = await tile.evaluate(el => {
          const box = el.getBoundingClientRect();
          const media = el.querySelector('.content-image').getBoundingClientRect();
          const content = el.querySelector('.content').getBoundingClientRect();
          const grid = getComputedStyle(el.parentElement);
          return {
            width: box.width, height: box.height, mediaHeight: media.height,
            contentHeight: content.height, gap: parseFloat(grid.rowGap),
            rows: grid.gridTemplateRows.split(' ').map(parseFloat)
          };
        });
        if (width > 736) {
          expect(Math.abs(geometry.height - (geometry.width * 1.5 + geometry.gap)), trip).toBeLessThan(1);
          expect(Math.abs(geometry.mediaHeight - geometry.height), trip).toBeLessThan(1);
          expect(Math.max(...geometry.rows) - Math.min(...geometry.rows), trip).toBeLessThan(1);
        } else {
          expect(Math.abs(geometry.mediaHeight - geometry.width * 0.75), trip).toBeLessThan(1);
          expect(Math.abs(geometry.contentHeight - geometry.height), trip).toBeLessThan(1);
        }
      }
    }
  });
}
