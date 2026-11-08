const {test,expect}=require('@playwright/test');
const BASE = 'http://127.0.0.1:' + (process.env.PW_PORT || '4321'); // matches playwright.config.cjs
test('opening layout and four postcards exist before external scripts arrive',async({page})=>{
 await page.route('**/*.js*',route=>route.abort());
 await page.goto('/travel');
 await expect(page.locator('html')).toHaveClass(/travel-timeline/);
 await expect(page.locator('html')).toHaveClass(/travel-phone-rail/);
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
 await page.setViewportSize({width:390,height:844});await page.route('**/seoul-winter-banner*',r=>r.abort());await page.goto('/travel');const row=page.locator('.mobile-journal-row').filter({hasText:'Seoul'});await row.scrollIntoViewIfNeeded();await expect(row.locator('img')).toHaveClass(/journal-photo-failed/);await expect(row.getByRole('link',{name:'Read journal'})).toBeVisible();expect(await row.locator('.travel-card__image').evaluate(e=>e.getBoundingClientRect().height)).toBe(150);
});

test.describe('mobile reading animation',()=>{
 test.use({hasTouch:true,reducedMotion:'no-preference'});
 test('every scene on screen repeats; the nearest is the focus and follows the reader',async({page})=>{
  await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('/travel');
  const scenes=page.locator('.mobile-journal-list .authored-scene'),active=page.locator('.mobile-journal-list .is-active'),focus=page.locator('.mobile-journal-list .is-focus');
  await expect(page.locator('.mobile-journal-list .authored-scene > svg')).toHaveCount(10);
  await scenes.nth(2).evaluate(el=>el.scrollIntoView({block:'center'}));await page.clock.runFor(100);
  await expect(scenes.nth(2)).toHaveClass(/is-active/);await expect(scenes.nth(2)).toHaveClass(/is-focus/);
  await expect(focus).toHaveCount(1);expect(await active.count()).toBeGreaterThan(1);
  // Repeats rewind the scene in place: the loop counter moves, the class list does not.
  await scenes.nth(2).evaluate(el=>{window.sceneLoops=0;window.sceneClassChanges=0;new MutationObserver(records=>records.forEach(r=>{if(r.attributeName==='data-loop')window.sceneLoops++;else window.sceneClassChanges++;})).observe(el,{attributes:true,attributeFilter:['class','data-loop']});});
  await page.clock.runFor(15000);await expect(scenes.nth(2)).toHaveClass(/is-active/);
  expect(await page.evaluate(()=>[window.sceneLoops,window.sceneClassChanges])).toEqual([2,0]);
  // Australia opens part-way in, with its ferry already in the tile.
  await scenes.nth(3).evaluate(el=>el.scrollIntoView({block:'center'}));await page.clock.runFor(100);
  expect(await scenes.nth(3).evaluate(el=>Math.min(...el.getAnimations({subtree:true}).filter(a=>a.animationName).map(a=>a.currentTime)))).toBeGreaterThanOrEqual(1500);
  await scenes.nth(5).evaluate(el=>el.scrollIntoView({block:'center'}));await page.clock.runFor(100);
  await expect(scenes.nth(5)).toHaveClass(/is-focus/);await expect(scenes.nth(2)).not.toHaveClass(/is-active/);await expect(focus).toHaveCount(1);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(active).toHaveCount(0);await expect(focus).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(scenes.nth(5)).toHaveClass(/is-focus/);
  await page.evaluate(()=>scrollTo(0,0));await page.clock.runFor(100);await expect(active).toHaveCount(0);
 });
});

test('no JavaScript retains ten visible journal covers',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(BASE + '/travel');await expect(page.locator('.travel-card img:visible')).toHaveCount(10);await context.close();
});

// Scene artwork ships as one cached file (8 Nov 2026): phones fetch it after load and the rail
// borrows each single SVG; wider screens use the head preload, so the file is fetched once.
test('scene artwork waits for load on phones and fills each visible slot once',async({page})=>{
 const requests=[];page.on('request',r=>{if(r.url().includes('travel-scenes.svg'))requests.push(r.url());});
 await page.setViewportSize({width:390,height:844});await page.goto('/travel');
 await expect(page.locator('.mobile-journal-list .authored-scene > svg')).toHaveCount(10);
 await expect(page.locator('.journal-chronology .authored-scene > svg')).toHaveCount(0);
 const timing=await page.evaluate(()=>({load:performance.getEntriesByType('navigation')[0].loadEventStart,scenes:performance.getEntriesByType('resource').find(e=>e.name.includes('travel-scenes.svg')).startTime}));
 expect(timing.scenes).toBeGreaterThanOrEqual(timing.load);expect(requests).toHaveLength(1);
 await page.setViewportSize({width:1280,height:900});
 await expect(page.locator('.journal-chronology .authored-scene > svg')).toHaveCount(10);
 await expect(page.locator('.mobile-journal-list .authored-scene > svg')).toHaveCount(0);
});
test('wider screens fetch the preloaded scene artwork once',async({page})=>{
 const requests=[];page.on('request',r=>{if(r.url().includes('travel-scenes.svg'))requests.push(r.url());});
 await page.setViewportSize({width:1280,height:900});await page.goto('/travel');
 await expect(page.locator('.journal-chronology .authored-scene > svg')).toHaveCount(10);
 await page.waitForLoadState('load');expect(requests).toHaveLength(1);
});
