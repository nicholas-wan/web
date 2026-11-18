const { test, expect } = require('@playwright/test');

// Day maps in route boxes (18 Nov 2026): build.ps1 Add-RouteMaps inlines an SVG from
// journals/route-coordinates.json on journals that opt in with data-route-photos.

const others = ['travel_2017_seoul', 'travel_2019_siliconvalley', 'travel_2022_europe', 'travel_2023_perth',
  'travel_2023_usacanada', 'travel_2024_australia', 'travel_2024_germany', 'travel_2025_japan', 'travel_2026_guangzhou'];

const pinsOf = map => map.locator('[data-route-pin]').evaluateAll(pins => pins.map(pin => [pin.getAttribute('data-route-pin'), pin.textContent]));

test('Chengdu Day 6 map numbers its pins as its stops, and pin 3 opens Tianmen Cave', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await expect(page.locator('svg.travel-route-map')).toHaveCount(6);

  const day6 = page.locator('#trip-section-6 ~ .guangzhou-day__route');
  const map = day6.locator('svg.travel-route-map');
  await map.scrollIntoViewIfNeeded();
  // Shown while the route is folded, under the Route label and above the summary.
  await expect(day6).not.toHaveClass(/is-expanded/);
  await expect(map).toBeVisible();
  expect(await map.evaluate(svg => [svg.previousElementSibling.tagName, svg.nextElementSibling.className])).toEqual(['STRONG', 'travel-route-summary']);
  // Pin numbers stay at least 12px on a phone.
  expect((await map.boundingBox()).width).toBeGreaterThanOrEqual(300);
  expect(await day6.locator('.guangzhou-route__stop > span:first-child').allTextContents()).toEqual(['Zhangjiajie Glass Bridge', 'Tianmen Cableway', 'Tianmen Cave', 'Skywalk']);
  expect(await pinsOf(map)).toEqual([['0', '1'], ['1', '2'], ['2', '3'], ['3', '4']]);

  // Pins on every map stay apart, even for stops 200 m apart (Tianmen Cave and the Skywalk).
  const overlaps = await page.locator('svg.travel-route-map').evaluateAll(maps => maps.flatMap(svg => {
    const circles = [...svg.querySelectorAll('[data-route-pin] circle')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy'), +c.getAttribute('r')]);
    return circles.flatMap((a, i) => circles.slice(i + 1).filter(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < a[2] + b[2]).map(() => svg.getAttribute('aria-label')));
  }));
  expect(overlaps).toEqual([]);

  await map.locator('[data-route-pin="2"]').click();
  await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox__context')).toHaveText(/1 of 2 at Tianmen Cave · Day 6$/);

  // Static: no tiles, no map service, nothing off the site.
  const origin = new URL(page.url()).origin;
  expect(requests.filter(url => !url.startsWith(origin) && !url.startsWith('data:'))).toEqual([]);
  expect(requests.filter(url => /tile|openstreetmap|mapbox|amap|\.pbf/i.test(url))).toEqual([]);
});

test('Day 1 leaves Singapore off its map and Day 7 has none', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const day1 = page.locator('#trip-section-1 ~ .guangzhou-day__route svg.travel-route-map');
  // Stop 1 (Singapore) is 2,900 km out; Tianfu airport and the Dujiangyan stops remain.
  expect(await pinsOf(day1)).toEqual([['1', '2'], ['2', '3'], ['3', '4']]);
  await expect(page.locator('#trip-section-7 ~ .guangzhou-day__route svg.travel-route-map')).toHaveCount(0);
  // Day 4 drops the Chengdu departure and the homestay, which has no published point.
  expect(await pinsOf(page.locator('#trip-section-4 ~ .guangzhou-day__route svg.travel-route-map'))).toEqual([['1', '2'], ['3', '4'], ['4', '5']]);
});

test('Desktop shows the map as a small panel under the Route label', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const day5 = page.locator('#trip-section-5 ~ .guangzhou-day__route');
  const map = await day5.locator('svg.travel-route-map').boundingBox();
  const label = await day5.locator('strong').first().boundingBox();
  const stops = await day5.locator('.guangzhou-route').boundingBox();
  expect(map.width).toBeLessThanOrEqual(400);
  expect(map.height / map.width).toBeCloseTo(160 / 300, 2);
  expect(map.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
  expect(stops.y).toBeGreaterThanOrEqual(map.y + map.height);
});

test('journals that have not opted in have no day maps', async ({ page }) => {
  for (const slug of others) {
    await page.goto('/' + slug);
    await expect(page.locator('.travel-route-map, [data-route-pin]'), slug).toHaveCount(0);
  }
});
