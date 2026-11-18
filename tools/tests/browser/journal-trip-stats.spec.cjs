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
  expect((await stats.textContent()).replace(/\s+/g, ' ').trim()).toBe('7 days · 34 stops · 55 photos');
  await expect(stats.locator('b')).toHaveText(['7', '34', '55']);
  // No money in the trip line: ticket prices alone, without flights, stays and food, read as the trip's cost (owner, 18 Nov 2026).
  await expect(stats).not.toContainText(/[¥$]/);
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

test('Chengdu notes what we paid on Klook: one-attraction tickets inline on their stop, the 2-day tour once on Day 5', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const tours = page.locator('.travel-route__tour');
  await expect(tours).toHaveCount(1);
  // Owner, 18 Nov 2026: a Klook booking for one attraction replaces its online price, inline with the mark.
  const klookPrices = page.locator('.travel-route__price:has(> .travel-route__klook)');
  await expect(klookPrices).toHaveText(['S$13', 'S$60 with feeding', 'S$12 night']);
  await expect(page.locator('#trip-section-2 ~ .guangzhou-day__route .travel-route__total')).toHaveText('About S$73 a person · what we paid on Klook');
  // The tour covers Days 5 and 6, so it is written once, on Day 5, or readers would add it twice.
  const tour = page.locator('#trip-section-5 ~ .guangzhou-day__route .travel-route__tour');
  await expect(tour).toHaveText('Klook tour, Days 5–6, with tickets: S$207 a person');
  await expect(tour.locator('.travel-route__klook')).toBeVisible();
  expect(await tour.evaluate(el => el.previousElementSibling.className)).toBe('travel-route__total');
  await expect(page.locator('#trip-section-6 ~ .guangzhou-day__route .travel-route__tour')).toHaveCount(0);
});
