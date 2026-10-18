const {test,expect}=require('@playwright/test');
for(const width of [320,390,1366])test(`travel deferred photos and tour controls at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/travel');
 const hidden=page.locator(width<=736?'.travel-grid > .travel-card img':'.mobile-journal-card img');
 expect(await hidden.evaluateAll(es=>es.every(e=>!e.getAttribute('src')))).toBe(true);
 await expect(page.getByRole('button',{name:'Pause tour',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Pause tour',exact:true}).click();
 await expect(page.locator('.journal-chronology')).toHaveClass(/tour-paused/);
 await page.waitForTimeout(700);await expect(page.locator('.authored-scene.is-active')).toHaveCount(0);
 await page.getByRole('button',{name:'Next',exact:true}).click();
 const photo=page.locator(width<=736?'.mobile-journal-card img':'.travel-card.preview-selected img').filter({visible:true}).first();
 await photo.scrollIntoViewIfNeeded();await expect.poll(()=>photo.evaluate(e=>e.naturalWidth)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 if(width<=736){const link=page.locator('.mobile-read').first();expect(await link.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);expect(await link.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(12);}
});
test('travel image failure preserves geometry and readable journal links',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('**/seoul-winter-banner*',r=>r.abort());await page.goto('/travel');const row=page.locator('.mobile-journal-row').first();await row.scrollIntoViewIfNeeded();await expect(row.locator('img')).toHaveClass(/journal-photo-failed/);await expect(row.getByRole('link',{name:'Read journal'})).toBeVisible();expect(await row.locator('.travel-card__image').evaluate(e=>e.getBoundingClientRect().height)).toBe(120);
});

test.describe('touch tour recovery',()=>{
 test.use({hasTouch:true,reducedMotion:'no-preference'});
 test('tapping a scene does not strand the tour on retained pointer focus',async({page})=>{
  await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('/travel');
  const scenes=page.locator('.mobile-journal-list .authored-scene');await scenes.first().scrollIntoViewIfNeeded();await scenes.first().tap();
  await expect(scenes.first()).toHaveClass(/is-active/);await page.clock.runFor(8000);
  await expect(scenes.first()).not.toHaveClass(/is-active/);
  await expect(page.locator('.mobile-journal-list .authored-scene.is-active')).toHaveCount(1);
 });
});

test('no JavaScript retains ten visible journal covers',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto('http://127.0.0.1:4321/travel');await expect(page.locator('.travel-card img:visible')).toHaveCount(10);await context.close();
});
