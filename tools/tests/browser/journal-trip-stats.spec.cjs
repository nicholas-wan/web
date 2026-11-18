const { test, expect } = require('@playwright/test');

// The trip at a glance (18 Nov 2026): build.ps1 (Add-TripStats) counts days, stops, photos and
// guide-price tickets for journals that opt in with data-route-photos, and sets the line under the
// banner, whose lower hairline stands in for the first day's divider.

const others = ['travel_2017_seoul', 'travel_2019_siliconvalley', 'travel_2022_europe', 'travel_2023_perth',
  'travel_2023_usacanada', 'travel_2024_australia', 'travel_2024_germany', 'travel_2025_japan', 'travel_2026_guangzhou'];

test('Chengdu shows the trip at a glance under its banner, and no other journal has one', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const stats = page.locator('.travel-journal__stats');
  await expect(stats).toHaveCount(1);
  expect((await stats.textContent()).replace(/\s+/g, ' ').trim()).toBe('7 days · 29 stops · 55 photos · ≈ ¥1,040 in fees a person');
  await expect(stats.locator('b')).toHaveText(['7', '29', '55', '≈ ¥1,040']);
  const geometry = await page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect();
    return { banner: box('.journal-banner'), stats: box('.travel-journal__stats'), date: box('.guangzhou-day__date') };
  });
  // The banner keeps its place near the top on phones; the line follows it, one row at 390px.
  expect(geometry.banner.top).toBeLessThan(220);
  expect(geometry.stats.top).toBeGreaterThan(geometry.banner.bottom);
  expect(geometry.stats.height).toBeLessThan(48);
  expect(geometry.date.top).toBeGreaterThan(geometry.stats.bottom);

  for (const slug of others) {
    await page.goto('/' + slug);
    await expect(page.locator('.travel-journal__stats'), slug).toHaveCount(0);
  }
});

test('Chengdu Days 5 and 6 note the Klook tour price after the official total, and no other day does', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tours = page.locator('.travel-route__tour');
  await expect(tours).toHaveCount(2);
  for (const day of [5, 6]) {
    const tour = page.locator(`#trip-section-${day} ~ .guangzhou-day__route .travel-route__tour`);
    await expect(tour).toHaveText('Klook 2-day tour: we paid S$207 a person');
    await expect(tour.locator('.travel-route__klook')).toBeVisible();
    expect(await tour.evaluate(el => el.previousElementSibling.className)).toBe('travel-route__total');
  }
});
