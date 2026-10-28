// The Agentic AI story on Experience (README "Agentic AI story"): three pinned chapters in the #agentic-ai
// card, driven by assets/js/hunt-story.js, which an inline loader injects on demand.
const {test,expect}=require('@playwright/test');
const scenes=page=>page.locator('#agentic-ai .hs-scene');
const at=(page,i)=>page.locator('#agentic-ai .hs-scene').nth(i);
// Scroll so chapter i rests on frame f (resting points 0.6 of its stage height apart, or a frame's own hold).
const rest=(page,i,f)=>at(page,i).evaluate((s,f)=>{const vh=s.querySelector('.hs-stage').offsetHeight;const d=JSON.parse(s.getAttribute('data-hs-story'));let u=0;for(let k=0;k<f;k++)u+=(d.hold&&d.hold[k])||0.8;scrollTo(0,Math.round(s.getBoundingClientRect().top+scrollY+u*vh+2));},f);
const noSideScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const FORBIDDEN=/index=wineventlog|SysUpdate|Splunk|only known|known activity|days to hours|hours instead of days|\bdays\b|SPL crafter|Post-query|Evidence found|\d+ hits|\btokens?\b/i;

test('agentic story: without motion, every chapter is a complete static list with its objects, in the approved, generic words',async({page})=>{
 for(const [w,h] of [[1366,768],[390,844]]){
  await page.setViewportSize({width:w,height:h});
  await page.goto('/experience');
  // The retired chip peek is gone.
  await expect(page.locator('[data-company="agentic"], #agentic-demo-card, #agentic-ai .internship-demo-hint')).toHaveCount(0);
  await page.locator('#agentic-ai .hs-story').scrollIntoViewIfNeeded();
  await expect(scenes(page)).toHaveCount(3);
  await expect(page.locator('#agentic-ai .hs-scene.is-live')).toHaveCount(0);
  await expect(page.locator('#agentic-ai .hs-ctitle')).toHaveText(['Built the way hunters plan a hunt.','Narrow agents, one supervisor.','Context engineering, evals and human review.']);
  await expect(page.locator('#agentic-ai .hs-clabel')).toHaveText(['01 Understanding the analyst','02 Designing the workflow','03 Making the model reliable']);
  await expect(page.locator('#agentic-ai .hs-step .hs-h')).toHaveText(['One report becomes one hunt per technique.','Tailored to this environment.','Each hypothesis says what to look for, and where.','Each agent has one job.','Every search ends in a verdict: lead, clean or re-plan.','Every attempt is recorded.','Narrow the context for each call.','Ground the model, then test it against an answer key.','Human in the loop at the checkpoints.']);
  await expect(page.locator('#agentic-ai .hs-cline').first()).toHaveText('An illustrative hunt, from a threat report to a claim it can test.');
  for(const sel of ['.hs-step','.hs-doc','.hs-env','.hs-hyp','.hs-fact','.hs-lanes','.hs-lo','.hs-o2','.hs-wmap','.hs-trace','.hs-rows','.hs-wr.is-x','.hs-out','.hs-kb','.hs-gold','.hs-cells','.hs-ov','.hs-ov-chain','.hs-ov-row','.hs-ov-act','.hunt-panel .c2']){
   for(const el of await page.locator('#agentic-ai '+sel).all()){await expect(el).toBeVisible();await expect(el).toHaveCSS('opacity','1');}
  }
  const label=await page.locator('#agentic-ai .hunt-panel .c2').getAttribute('aria-label');
  expect(label.startsWith('An illustrative hunt.')).toBe(true);
  // Generic and unquestionable: no SIEM vendor syntax, real malware, retired wording or days-to-hours claim.
  const words=await page.locator('#agentic-ai .hs-story').textContent();
  expect(words).not.toMatch(FORBIDDEN);
  expect(label).not.toMatch(FORBIDDEN);
  for(const s of ['event_id = 4698','\\WinTaskUpdate','root-level','not in baseline','Flagged','Checked','Task creation events','Scoped to','Analyst review','Inconclusive · re-plan','Valid negative · logged','Verdict','Sub-hunt 1','Covered recently','Look for','Query handed on','1 task not in baseline','Knowledge base','Golden set','F1 is reported too','Human review','Threat evidence in 1 of 3 techniques','Confirm lead','Confirmed by the analyst'])expect(words).toContain(s);
  expect(await page.content()).not.toMatch(/index=wineventlog|SysUpdate|Splunk/);
  expect(await noSideScroll(page)).toBe(true);
 }
});

test('agentic story: the loader injects hunt-story.js once, from its versioned URL, never as a page script',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/experience');
 const url=await page.locator('#agentic-ai .hs-story').getAttribute('data-hs-script');
 expect(url).toMatch(/^assets\/js\/hunt-story\.js\?v=[0-9a-f]{8}$/);
 await page.locator('#agentic-ai .hs-story').scrollIntoViewIfNeeded();
 await expect(page.locator('script[src*="hunt-story.js"]')).toHaveCount(1);
 await page.evaluate(()=>scrollBy(0,4000));
 await page.waitForTimeout(300);
 await page.evaluate(()=>scrollTo(0,0));
 await page.waitForTimeout(300);
 await page.locator('#agentic-ai .hs-story').scrollIntoViewIfNeeded();
 await expect(page.locator('script[src*="hunt-story.js"]')).toHaveCount(1);
 expect(await page.locator('script[src*="hunt-story.js"]').getAttribute('src')).toBe(url);
});

test('agentic story: pinned chapters advance with the scroll, rewind, release, and leave no sideways scroll',async({page})=>{
 test.setTimeout(180000);
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [w,h] of [[1366,768],[390,844]]){
  await page.setViewportSize({width:w,height:h});
  await page.goto('/experience');
  await page.locator('#agentic-ai .hs-story').scrollIntoViewIfNeeded();
  await expect(page.locator('#agentic-ai .hs-scene.is-live')).toHaveCount(3);
  for(let i=0;i<3;i++){
   const s=at(page,i);
   // Each chapter pins for its frames' dwells and a short release: about one screen, except chapter 02,
   // whose first frame holds 1.4 screens for the console's 8s run (review, 27 Oct 2026).
   const [screens,want,hold]=await s.evaluate(e=>{const d=JSON.parse(e.getAttribute('data-hs-story'));const n=e.querySelectorAll('.hs-step').length;let u=0.5;for(let k=0;k<n-1;k++)u+=(d.hold&&d.hold[k])||0.8;return [e.offsetHeight/e.querySelector('.hs-stage').offsetHeight-1,u,d.hold?d.hold[0]:0];});
   expect(Math.abs(screens-want)).toBeLessThan(0.1);
   expect(hold).toBe(i===1?1.4:1.1);
   const n=await s.locator('.hs-step').count();
   for(let f=0;f<n;f++){
    await rest(page,i,f);
    await expect(s).toHaveAttribute('data-hs-f',String(f));
    // Chapter 02's first frame plays the console's run (8s); the others are CSS transitions.
    await expect(s).toHaveAttribute('data-hs-at',String(f),{timeout:15000});
    await expect(s.locator('.hs-step.is-on .hs-h')).toHaveCount(1);
    // Pinned: the stage sits at the top of the screen, and nothing scrolls sideways.
    expect(Math.round(await s.locator('.hs-stage').evaluate(e=>e.getBoundingClientRect().top))).toBe(0);
    expect(await noSideScroll(page)).toBe(true);
   }
   // Release: past the last frame's dwell the stage scrolls away with the page.
   await s.evaluate(e=>scrollTo(0,e.getBoundingClientRect().bottom+scrollY-innerHeight*0.5));
   await page.waitForTimeout(200);
   expect(await s.locator('.hs-stage').evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(-50);
   await expect(s).toHaveAttribute('data-hs-f',String(n-1));
  }
  // Rewind: back above the story, every chapter returns to its opening state.
  await rest(page,1,0);
  await expect(at(page,1)).toHaveAttribute('data-hs-f','0');
  // ...and the chapter below it, now off screen again, is back in its opening state
  await expect(at(page,2)).toHaveAttribute('data-hs-f','-1');
  await page.locator('#agentic-ai .hs-story').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight*1.5));
  for(let i=0;i<3;i++)await expect(at(page,i)).toHaveAttribute('data-hs-f','-1');
  // the console's run rewinds too, to its opening state
  await expect(at(page,1)).toHaveAttribute('data-hs-at','-1',{timeout:8000});
 }
});

test('agentic story: wheel notches keep native scrolling through the pinned chapters',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/experience');
 await at(page,0).evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-300));
 await page.waitForTimeout(600);
 await page.mouse.move(683,384);
 let y=await page.evaluate(()=>scrollY);
 const odd=[];
 for(let i=0;i<30;i++){
  await page.mouse.wheel(0,100);
  await page.waitForTimeout(300);
  const ny=await page.evaluate(()=>scrollY);
  if(ny-y!==100)odd.push(ny-y);
  y=ny;
 }
 expect(odd).toEqual([]);
});
