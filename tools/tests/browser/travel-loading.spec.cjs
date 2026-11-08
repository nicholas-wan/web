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
 // The clock is paused, so performance.now() stands still and every programmatic scroll reads as a flick:
 // the scroll holds scenes, and the 140ms settle timer is the stop. CSS animation time stays real, so
 // these checks read play states and rates rather than exact scene times (except a held opening frame).
 const rail=page=>{
  const scenes=page.locator('.mobile-journal-list .authored-scene');
  // A 1px lead-in first: the first scroll event after a pause measures its speed over the whole pause.
  const scroll=async how=>{await page.evaluate(async how=>{const once=()=>new Promise(r=>addEventListener('scroll',r,{once:true}));let p=once();scrollBy(0,1);await p;p=once();
   how.by?scrollBy(0,how.by):document.querySelectorAll('.mobile-journal-list .authored-scene')[how.to].scrollIntoView({block:'center'});await p;},how);await page.waitForTimeout(100);await page.clock.runFor(32);};
  const anims=(i,mv)=>scenes.nth(i).evaluate((el,mv)=>el.getAnimations({subtree:true}).filter(a=>a.animationName&&a.animationName.startsWith('mv-')===mv).map(a=>({t:Math.round(a.currentTime),state:a.playState,rate:a.playbackRate})),!!mv);
  const states=async(i,mv)=>[...new Set((await anims(i,mv)).map(a=>a.state))];
  return {scenes,scroll,anims,states,active:page.locator('.mobile-journal-list .is-active'),focus:page.locator('.mobile-journal-list .is-focus'),held:page.locator('.mobile-journal-list .is-held')};
 };
 test('a flick holds scenes on their opening frame; the stop starts them; two passes, then a rest',async({page})=>{
  await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('/travel');
  const {scenes,scroll,anims,states,active,focus,held}=rail(page);
  await expect(page.locator('.mobile-journal-list .authored-scene > svg')).toHaveCount(10);
  await page.clock.pauseAt(Date.now()+1000);await expect(active).toHaveCount(0);
  // Mid-flick: Australia is set on its opening frame (1.5s in) and held at a lighter tint; no ring yet.
  await scroll({to:3});
  await expect(scenes.nth(3)).toHaveClass(/is-active/);await expect(scenes.nth(3)).toHaveClass(/is-held/);await expect(focus).toHaveCount(0);
  expect(await anims(3)).toEqual(expect.arrayContaining([expect.objectContaining({t:1500,state:'paused'})]));
  expect(await states(3)).toEqual(['paused']);
  await expect.poll(()=>scenes.nth(3).evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('0.78');
  // The stop: no scene is held, the ring is on, and the top scene opens fast, then eases back to normal speed.
  await page.clock.runFor(120);
  await expect(held).toHaveCount(0);await expect(focus).toHaveCount(1);await expect(scenes.nth(3)).toHaveClass(/is-focus/);
  expect(await states(3)).toEqual(['running']);
  expect(await page.locator('.mobile-journal-list .is-active').evaluateAll(es=>Math.max(...es.flatMap(e=>e.getAnimations({subtree:true}).map(a=>a.playbackRate))))).toBe(3);
  await page.clock.runFor(1000);
  expect((await anims(3)).every(a=>a.rate===1)).toBe(true);
  // Repeats rewind to frame 0 in place, not to the opening point, and the class list does not flap.
  await scenes.nth(3).evaluate(el=>{window.sceneClassChanges=0;new MutationObserver(r=>{window.sceneClassChanges+=r.length;}).observe(el,{attributes:true,attributeFilter:['class']});});
  // The first loop is due by about 6.1s of fake time (the beat's timers run on the fake clock too); real time only brings it sooner.
  await page.clock.runFor(5000);
  expect((await anims(3)).every(a=>a.t<1000&&a.state==='running')).toBe(true);
  // After the second pass it plays on to a lit frame and rests there, still in colour with its ring.
  await page.clock.runFor(10000);
  expect(await states(3)).toEqual(['paused']);expect(await page.evaluate(()=>window.sceneClassChanges)).toBe(0);
  // A nudge (even a quick one) leaves it resting; about a row of scrolling plays it again.
  await scroll({by:60});await page.clock.runFor(200);expect(await states(3)).toEqual(['paused']);
  await scroll({by:140});await page.clock.runFor(200);expect(await states(3)).toEqual(['running']);
  // Reduced motion clears every scene; scrolling the rail away stops them.
  await page.emulateMedia({reducedMotion:'reduce'});await expect(active).toHaveCount(0);await expect(focus).toHaveCount(0);await expect(held).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(focus).toHaveCount(1);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);await page.clock.runFor(200);await expect(active).toHaveCount(0);
 });
 test("Guangzhou's river boat crosses while its scene plays and freezes mid-flick; desktop hides it",async({page})=>{
  await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('/travel');
  const {scenes,scroll,states}=rail(page),boat=page.locator('.mobile-journal-list .gz-boat');
  await expect(page.locator('.mobile-journal-list .authored-scene > svg')).toHaveCount(10);
  await page.clock.pauseAt(Date.now()+1000);
  await expect(boat).toHaveCSS('display','inline');
  await scroll({to:1});expect(await states(1,true)).toEqual(['paused']);
  await page.clock.runFor(200);expect(await states(1,true)).toEqual(['running']);
  await page.setViewportSize({width:1280,height:900});
  await expect(page.locator('.journal-chronology .gz-boat')).toHaveCSS('display','none');
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
