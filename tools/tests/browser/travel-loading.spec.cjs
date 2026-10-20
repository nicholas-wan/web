const {test,expect}=require('@playwright/test');
test('opening layout and four postcards exist before external scripts arrive',async({page})=>{
 await page.route('**/*.js*',route=>route.abort());
 await page.goto('/travel');
 await expect(page.locator('html')).toHaveClass(/timeline-review/);
 await expect(page.locator('html')).toHaveClass(/mobile-variant-a/);
 await expect(page.locator('.photo-explore__cards > a')).toHaveCount(4);
 await expect(page.locator('.photo-explore__cards > a').first()).toBeVisible();
});
for(const width of [320,390,1366])test(`travel deferred photos and no tour controls at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/travel');
 const hidden=page.locator(width<=736?'.travel-grid > .travel-card img':'.mobile-journal-card img');
 expect(await hidden.evaluateAll(es=>es.every(e=>!e.getAttribute('src')))).toBe(true);
 // Tour controls were removed (20 Oct 2026); the tour stops for hover, focus, hidden tabs and reduced motion.
 await expect(page.locator('.travel-tour-controls')).toHaveCount(0);
 const photo=page.locator(width<=736?'.mobile-journal-card img':'.travel-card.preview-selected img').filter({visible:true}).first();
 await photo.scrollIntoViewIfNeeded();await expect.poll(()=>photo.evaluate(e=>e.naturalWidth)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 if(width<=736){const link=page.locator('.mobile-journal-card .travel-card__image').first();expect(await link.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);expect(await link.evaluate(e=>parseFloat(getComputedStyle(e.querySelector('.mobile-photo-cta')).fontSize))).toBeGreaterThanOrEqual(12);}
});
test('travel image failure preserves geometry and readable journal links',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('**/seoul-winter-banner*',r=>r.abort());await page.goto('/travel');const row=page.locator('.mobile-journal-row').first();await row.scrollIntoViewIfNeeded();await expect(row.locator('img')).toHaveClass(/journal-photo-failed/);await expect(row.getByRole('link',{name:'Read journal'})).toBeVisible();expect(await row.locator('.travel-card__image').evaluate(e=>e.getBoundingClientRect().height)).toBe(150);
});

test.describe('mobile reading animation',()=>{
 test.use({hasTouch:true,reducedMotion:'no-preference'});
 test('nearest scene repeats and follows the reader',async({page})=>{
  await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('/travel');
  const scenes=page.locator('.mobile-journal-list .authored-scene');
  await scenes.nth(2).evaluate(el=>el.scrollIntoView({block:'center'}));await page.clock.runFor(100);
  await expect(scenes.nth(2)).toHaveClass(/is-active/);
  await scenes.nth(2).evaluate(el=>{window.sceneRestarts=0;new MutationObserver(records=>{window.sceneRestarts+=records.length;}).observe(el,{attributes:true,attributeFilter:['class']});});
  await page.clock.runFor(15000);await expect(scenes.nth(2)).toHaveClass(/is-active/);
  expect(await page.evaluate(()=>window.sceneRestarts)).toBeGreaterThanOrEqual(4);
  await scenes.nth(5).evaluate(el=>el.scrollIntoView({block:'center'}));await page.clock.runFor(100);
  await expect(scenes.nth(5)).toHaveClass(/is-active/);await expect(scenes.nth(2)).not.toHaveClass(/is-active/);
  await expect(page.locator('.mobile-journal-list .is-active')).toHaveCount(1);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.mobile-journal-list .is-active')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(scenes.nth(5)).toHaveClass(/is-active/);
  await page.evaluate(()=>scrollTo(0,0));await page.clock.runFor(100);await expect(page.locator('.mobile-journal-list .is-active')).toHaveCount(0);
 });
});

test('no JavaScript retains ten visible journal covers',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto('http://127.0.0.1:4321/travel');await expect(page.locator('.travel-card img:visible')).toHaveCount(10);await context.close();
});
