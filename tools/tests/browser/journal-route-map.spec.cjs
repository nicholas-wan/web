const { test, expect } = require('@playwright/test');

// Day maps in route boxes (18 Nov 2026, tidied after review the same day): build.ps1 Add-RouteMaps
// inlines an SVG from journals/route-coordinates.json on journals that opt in with data-route-photos.
// It fits the day's main cluster, draws far stops as edge markers and lists stops with no point
// in one "Not mapped" line. Phones show it only in the expanded route; desktop puts it right of the stops.

const others = ['travel_2017_seoul', 'travel_2019_siliconvalley', 'travel_2022_europe', 'travel_2023_perth',
  'travel_2023_usacanada', 'travel_2024_australia', 'travel_2024_germany', 'travel_2025_japan', 'travel_2026_guangzhou'];

const routeOf = (page, day) => page.locator(`#trip-section-${day} ~ .guangzhou-day__route`).first();
// [stop index, number drawn] for every pin and edge marker; the number is each group's first text.
const pinsOf = map => map.locator('[data-route-pin]').evaluateAll(pins => pins.map(pin => [pin.getAttribute('data-route-pin'), pin.querySelector('text').textContent]));
const markersOf = map => map.locator('.travel-route-map__off').evaluateAll(pins => pins.map(pin => [pin.getAttribute('data-route-pin'), pin.querySelector('.travel-route-map__label').textContent]));

test('phones show the day map only in the expanded route, and Day 5 fits its main cluster', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  await expect(page.locator('svg.travel-route-map__svg')).toHaveCount(6);

  // Folded: no map, so the box stays the summary, the total and the button.
  const day6 = routeOf(page, 6);
  await day6.scrollIntoViewIfNeeded();
  await expect(day6).not.toHaveClass(/is-expanded/);
  await expect(day6.locator('.travel-route-map')).toBeHidden();
  await day6.locator('.guangzhou-route__more').click();
  await expect(day6.locator('.travel-route-map')).toBeVisible();
  // After the summary, above the stops; compact (300x130 viewBox).
  expect(await day6.locator('.travel-route-map').evaluate(map => [map.previousElementSibling.className, map.nextElementSibling.id])).toEqual(['travel-route-summary', 'journal-route-5']);
  const box = await day6.locator('svg.travel-route-map__svg').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(300);
  expect(box.height).toBeLessThanOrEqual(150);
  // The Glass Bridge, 38 km from Tianmen, is an edge marker, not the map's scale.
  expect(await markersOf(day6)).toEqual([['0', '38 km']]);
  expect(await pinsOf(day6)).toEqual([['1', '2'], ['2', '3'], ['3', '4'], ['0', '1']]);

  // Day 5: the park's five stops spread out; Dayong Ancient City, 25 km south, waits at the edge.
  const day5 = routeOf(page, 5);
  await day5.scrollIntoViewIfNeeded();
  await day5.locator('.guangzhou-route__more').click();
  expect(await markersOf(day5)).toEqual([['5', '25 km']]);
  const pins = await day5.locator('[data-route-pin] circle:not(.travel-route-map__hit)').evaluateAll(circles => circles.map(circle => {
    const rect = circle.getBoundingClientRect();
    return [rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width];
  }));
  expect(pins).toHaveLength(6);
  for (const [, , size] of pins) expect(size).toBeGreaterThanOrEqual(22);
  const gaps = pins.flatMap((a, i) => pins.slice(i + 1).map(b => Math.hypot(a[0] - b[0], a[1] - b[1])));
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(22);
  // Tap targets: the lone gate pin gets the full 44px.
  const hit = await day5.locator('[data-route-pin="0"] .travel-route-map__hit').boundingBox();
  expect(hit.width).toBeGreaterThanOrEqual(44);

  // A price-only stop (no photos) has a place card, so its pin opens it: Bailong Elevator.
  await expect(day5.locator('.guangzhou-route__stop').nth(2)).not.toHaveClass(/has-photos/);
  await day5.locator('[data-route-pin="2"]').click();
  await expect(page.locator('.place-card')).toBeVisible();
  await expect(page.locator('.place-card')).toContainText('Bailong Elevator');

  // Static: no tiles, no map service, nothing off the site.
  const origin = new URL(page.url()).origin;
  expect(requests.filter(url => !url.startsWith(origin) && !url.startsWith('data:'))).toEqual([]);
  expect(requests.filter(url => /tile|openstreetmap|mapbox|amap|\.pbf/i.test(url))).toEqual([]);
});

test('every stop is a pin, an edge marker or in the "Not mapped" line, and pins never overlap', async ({ page }) => {
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  for (const day of [1, 2, 3, 4, 5, 6]) {
    const route = routeOf(page, day);
    const stops = await route.locator('.guangzhou-route__stop').count();
    const drawn = (await pinsOf(route)).map(([index, number]) => {
      expect(String(+index + 1), `day ${day}`).toBe(number);
      return +number;
    });
    const noted = (await route.locator('.travel-route-map__num').allTextContents()).map(Number);
    expect([...drawn, ...noted].sort((a, b) => a - b), `day ${day}`).toEqual(Array.from({ length: stops }, (_, i) => i + 1));
  }
  // Day 1 zooms to Dujiangyan; Singapore and Tianfu Airport point off the map.
  expect(await markersOf(routeOf(page, 1))).toEqual([['0', '3,300 km'], ['1', '110 km']]);
  // No point for the massage shop or the homestay (a private address): named, never guessed.
  await expect(routeOf(page, 3).locator('.travel-route-map__note')).toHaveText('Not mapped: 2 Massage');
  await expect(routeOf(page, 4).locator('.travel-route-map__note')).toHaveText('Not mapped: 3 River View Homestay');
  // Day 7 is a flight home: no map.
  await expect(routeOf(page, 7).locator('.travel-route-map')).toHaveCount(0);

  const overlaps = await page.locator('svg.travel-route-map__svg').evaluateAll(maps => maps.flatMap(svg => {
    const circles = [...svg.querySelectorAll('[data-route-pin] circle:not(.travel-route-map__hit)')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy'), +c.getAttribute('r')]);
    return circles.flatMap((a, i) => circles.slice(i + 1).filter(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < a[2] + b[2] + 1).map(() => svg.getAttribute('aria-label')));
  }));
  expect(overlaps).toEqual([]);
  // Each map stays small.
  const sizes = await page.locator('svg.travel-route-map__svg').evaluateAll(maps => maps.map(svg => svg.outerHTML.length));
  for (const size of sizes) expect(size).toBeLessThan(2560);
});

test('a pin does what its stop does: Tianmen Cave opens its card, then its photos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  const day6 = routeOf(page, 6);
  await day6.scrollIntoViewIfNeeded();
  await day6.locator('.guangzhou-route__more').click();
  await day6.locator('[data-route-pin="2"]').click();
  await expect(page.locator('.place-card')).toContainText('Tianmen Cave');
  await page.locator('.place-card__view').click();
  await expect(page.locator('.lightbox')).toHaveClass(/is-visible/);
  await expect(page.locator('.lightbox__context')).toHaveText(/1 of 2 at Tianmen Cave · Day 6$/);
});

test('desktop puts the map right of the stops and numbers the stops to match the pins', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/travel_2026_chengdu_zhangjiajie');
  for (const day of [5, 6]) {
    const route = routeOf(page, day);
    await route.scrollIntoViewIfNeeded();
    const map = await route.locator('svg.travel-route-map__svg').boundingBox();
    const label = await route.locator('strong').first().boundingBox();
    const stops = await route.locator('.guangzhou-route').boundingBox();
    const outer = await route.boundingBox();
    expect(map.width).toBeLessThanOrEqual(300);
    expect(map.height / map.width).toBeCloseTo(130 / 300, 2);
    // Beside, not above: level with the Route label, right of the stops, inside the box.
    expect(Math.abs(map.y - label.y)).toBeLessThan(12);
    expect(map.x).toBeGreaterThanOrEqual(stops.x + stops.width);
    expect(map.x + map.width).toBeLessThanOrEqual(outer.x + outer.width);
    expect(outer.height).toBeLessThan(220);
    // Each stop carries its pin number in the same teal disc.
    const discs = await route.locator('.guangzhou-route__stop').evaluateAll(stops => stops.map(stop => {
      const disc = getComputedStyle(stop, '::before');
      return [disc.content, disc.backgroundColor, disc.width];
    }));
    for (const disc of discs) expect(disc).toEqual(['counter(route-stop)', 'rgb(17, 128, 125)', expect.stringMatching(/px$/)]);
  }
  // Routes without a map keep the plain arrows (Day 7).
  const day7 = await routeOf(page, 7).locator('.guangzhou-route__stop').first().evaluate(stop => getComputedStyle(stop, '::before').content);
  expect(day7).toBe('none');
});

test('journals that have not opted in have no day maps', async ({ page }) => {
  for (const slug of others) {
    await page.goto('/' + slug);
    await expect(page.locator('.travel-route-map, [data-route-pin], .has-route-map'), slug).toHaveCount(0);
  }
});
