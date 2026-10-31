const {test,expect}=require('@playwright/test');
const peek=(page,company)=>page.locator('[data-company="'+company+'"]');
const chip=root=>root.locator('.internship-demo-peek__chip');
const card=root=>root.locator('.internship-demo-card');

test('internship peeks: hover previews, click pins, focus drops a foreign pin, Escape closes, reduced motion holds the final frame',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/experience');
 const shopee=peek(page,'shopee'),league=peek(page,'league');
 await chip(shopee).hover();
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','true');
 await expect(card(shopee)).toHaveClass(/is-playing/);
 // The pointer may move down onto the card and the preview stays; moving on
 // to the next row's chip, which the card lets the pointer through to, swaps.
 const from=await chip(shopee).boundingBox(),to=await chip(league).boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
 await page.mouse.move(from.x+from.width/2,from.y+from.height+40,{steps:8});
 await page.waitForTimeout(250);
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','true');
 await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:12});
 await expect(chip(league)).toHaveAttribute('aria-expanded','true');
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','false');
 await page.mouse.move(0,0);
 await expect(chip(league)).toHaveAttribute('aria-expanded','false');
 // Click pins; a hover on the other chip swaps the card and the pin returns.
 await chip(shopee).click();
 await page.mouse.move(0,0);
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','true');
 await league.dispatchEvent('mouseenter');
 await expect(chip(league)).toHaveAttribute('aria-expanded','true');
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','false');
 await league.dispatchEvent('mouseleave');
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','true');
 await expect(chip(league)).toHaveAttribute('aria-expanded','false');
 // Keyboard focus on the other chip drops the pin, so after Tab moves on
 // nothing is open and nothing pops back from a stray hover.
 await chip(league).focus();
 await expect(chip(league)).toHaveAttribute('aria-expanded','true');
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','false');
 await page.keyboard.press('Tab');
 await expect(chip(league)).toHaveAttribute('aria-expanded','false');
 await league.dispatchEvent('mouseenter');
 await league.dispatchEvent('mouseleave');
 await page.waitForTimeout(300);
 await expect(chip(shopee)).toHaveAttribute('aria-expanded','false');
 await expect(chip(league)).toHaveAttribute('aria-expanded','false');
 // Reduced motion: the scene opens on its final frame.
 await page.emulateMedia({reducedMotion:'reduce'});
 await league.dispatchEvent('mouseenter');
 await expect(card(league)).toHaveClass(/is-still/);
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-review')).toHaveCSS('opacity','1');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-review')).toHaveText('Risky profile');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-needle')).toHaveCSS('transform',/matrix\(-0\.97/);
 // Three signals: each frame's line is drawn to its bar, no frame is left on
 // the phone, the classifier's route is drawn to its leaf, and the flag is
 // pinned to the photo.
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-bar')).toHaveCount(3);
 for(const link of await league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-link').all())await expect(link).toHaveCSS('stroke-dashoffset','0px');
 for(const frame of await league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-frame').all())await expect(frame).toHaveCSS('opacity','0');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-route')).toHaveCSS('stroke-dashoffset','0px');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-caps text')).toHaveText(['Signals','Model','Risk']);
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-badge')).toHaveCSS('opacity','1');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-pick')).toHaveCSS('opacity','1');
 // Only the chosen leaf is lit; the phone's lettering is live text in the
 // League's own fonts (glyph-only subsets), not outlines.
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-leaf')).toHaveCSS('opacity','1');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-leafc')).toHaveCSS('opacity','0.35');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-mark text')).toHaveText(['THE','league']);
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-name')).toHaveText('James M.');
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-key text')).toHaveText(['Education','Profession','Interests','Groups']);
 await expect(league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-seps rect')).toHaveCount(await league.locator('svg.league-brand-scene:not(.league-brand-scene--m) .lg-sep').count());
 expect(await page.evaluate(async()=>{await document.fonts.ready;return ['italic 900 8px "League Mark"','8px "League Serif"','italic 8px "League Serif"'].every(f=>document.fonts.check(f));})).toBe(true);
 await page.keyboard.press('Escape');
 // Shopee's final frame: the title highlight and every word row, with solid
 // model edges and chips that hide what they pass over. The story is one
 // model per language (owner, 26 Oct 2026): an Indonesian title, Indonesian
 // words only, and the Indonesian model in front of its unlabelled siblings.
 await shopee.dispatchEvent('mouseenter');
 await expect(card(shopee)).toHaveClass(/is-still/);
 await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-crop')).toHaveCSS('opacity','1');
 await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-slot')).toHaveCount(3);
 for(const svg of ['svg.sp-brand:not(.sp-brand--m)','svg.sp-brand--m']){
  await expect(shopee.locator(svg+' .sp-word')).toHaveText(['Sepatu','Lari','Pria']);
  await expect(shopee.locator(svg+' .sp-code')).toHaveText(['ID','ID','ID','ID']);
  await expect(shopee.locator(svg+' .sp-stack rect')).toHaveCount(4);
  await expect(shopee.locator(svg+' .sp-stack text')).toHaveCount(0);
  expect(await shopee.locator(svg).getAttribute('aria-label')).toMatch(/read by a text model/);
  expect(await shopee.locator(svg).textContent()).not.toMatch(/[฀-๿一-鿿]/);
 }
 await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-d-note tspan')).toHaveText(['Breaks the title','into tokens.','Predicts the','attributes.','Fills in the','product specs.']);
 for(const slot of await shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-slot').all())await expect(slot).toHaveCSS('opacity','1');
 for(const edge of await shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-edge').all())await expect(edge).toHaveCSS('stroke-dasharray','none');
 for(const rect of await shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-chip rect').all())expect(await rect.getAttribute('fill-opacity')).toBeNull();
 // The listing is set in Figtree (Shopee's own face is not free), in the
 // app's weights: medium title, regular meta, a dark value column.
 expect(await page.evaluate(async()=>{await document.fonts.ready;return ['400','500','700'].every(w=>document.fonts.check(w+' 11px Figtree'));})).toBe(true);
 await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-card .sp-title').first()).toHaveCSS('font-weight','500');
 await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-value').first()).toHaveCSS('fill','rgb(34, 34, 34)');
 await shopee.dispatchEvent('mouseleave');
 await page.keyboard.press('Escape');
 // The League's second peek, the A/B test, opens on its final frame: both
 // designs (A's border, B's badge) and two match-rate hills, apart.
 const ab=peek(page,'league-ab');
 await ab.dispatchEvent('mouseenter');
 await expect(card(ab)).toHaveClass(/is-still/);
 await expect(chip(ab)).toHaveText('A/B test a badge');
 // Simple on purpose (owner): no numbers, test jargon or verdict.
 const words=await ab.locator('svg.lgab-scene:not(.lgab-scene--m) text').allTextContents();
 expect(words).toEqual(expect.arrayContaining(['Match rate by design','How likely','Match rate','A · Border','B · Badge','Most compatible']));
 expect(words.join(' ')).not.toMatch(/\bCI\b|Ship|better|confidence|\d+%/);
 await expect(ab.locator('svg.lgab-scene:not(.lgab-scene--m) .lgab-badge')).toHaveCount(2);
 await expect(ab.locator('svg.lgab-scene:not(.lgab-scene--m) .lgab-hill')).toHaveCount(2);
 const peaks=await ab.locator('svg.lgab-scene:not(.lgab-scene--m) .lgab-hill').evaluateAll(hs=>hs.map(h=>h.getBoundingClientRect()));
 // Each hill spans 8 standard deviations; centres 1.25 apart: B only
 // slightly better (owner: "they have to be even closer").
 const mid=b=>b.left+b.width/2,gap=mid(peaks[1])-mid(peaks[0]);
 expect(gap).toBeGreaterThan(peaks[0].width*.1);
 expect(gap).toBeLessThan(peaks[0].width*.2);
 await expect(ab.locator('svg.lgab-scene:not(.lgab-scene--m) .lgab-cap text')).toHaveText(['Randomise','Measure']);
 // While playing, each hill and its label run on exactly their lane's curve,
 // so the chart moves with its bar (tools/scenes/league-ab-motion.py).
 await page.emulateMedia({reducedMotion:'no-preference'});
 await ab.dispatchEvent('mouseleave');
 await page.keyboard.press('Escape');
 await ab.dispatchEvent('mouseenter');
 await expect(card(ab)).toHaveClass(/is-playing/);
 const timing=await ab.evaluate(root=>['a','b'].map(k=>['.lgab-fill-','.lgab-hill-','.lgab-hx-','.lgab-tx-'].map(sel=>{
  const t=root.querySelector('svg.lgab-scene:not(.lgab-scene--m) '+sel+k).getAnimations()[0].effect.getTiming();return [t.delay,t.duration,t.easing].join();
 })));
 for(const arm of timing)expect(new Set(arm).size).toBe(1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await ab.dispatchEvent('mouseleave');
 await page.keyboard.press('Escape');
 // Each flying word lands as an exact copy of its row's word (same left edge,
 // width and baseline), so the handover into the word column never jumps.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await chip(shopee).click();
 await expect(card(shopee)).toHaveClass(/is-playing/);
 const landings=await shopee.evaluate(root=>{
  // Settle the word column first, then hold each chip at its landing mark.
  root.querySelector('.internship-demo-card').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=8000;});
  return [1,2,3].map(i=>{
  const d=root.querySelector('svg.sp-brand:not(.sp-brand--m)'),c=d.querySelector('.sp-chip-'+i),a=c.getAnimations()[0];
  a.pause();a.currentTime=a.effect.getTiming().delay+a.effect.getTiming().duration*0.87;
  const t=c.querySelector('text').getBoundingClientRect(),w=d.querySelector('.sp-slot-'+i+' .sp-word').getBoundingClientRect();
  return Math.max(Math.abs(t.left-w.left),Math.abs(t.right-w.right),Math.abs(t.bottom-w.bottom));
 });});
 for(const gap of landings)expect(gap).toBeLessThan(0.6);
 // A chip only fades once its row is fully in, so a landing word never
 // blinks pale; chips pass behind rows that have already landed.
 const handovers=await shopee.evaluate(root=>[1,2,3].map(i=>{
  const d=root.querySelector('svg.sp-brand:not(.sp-brand--m)'),c=d.querySelector('.sp-chip-'+i).getAnimations()[0].effect,s=root.querySelector('.sp-slot-'+i).getAnimations()[0].effect;
  const fade=c.getTiming().delay+c.getTiming().duration*.865,full=s.getTiming().delay+s.getTiming().duration;
  return fade-full;
 }));
 for(const slack of handovers)expect(slack).toBeGreaterThanOrEqual(-5);
 expect(await shopee.evaluate(root=>!!(root.querySelector('svg.sp-brand:not(.sp-brand--m) .sp-chips').compareDocumentPosition(root.querySelector('svg.sp-brand:not(.sp-brand--m) .sp-words'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 // The previous assertions pause the scene's animations mid-flight, so use
 // the button's click event to close it without waiting for visual stability.
 await chip(shopee).dispatchEvent('click');
 await expect(chip(league)).toHaveAttribute('aria-expanded','false');
 await expect(card(league)).toHaveAttribute('inert','');
});

test('phone internship peeks open inline, swap on one tap, and keep the thumbnail inside its pill',async({page})=>{
 for(const width of [390,360]){
  await page.setViewportSize({width,height:844});
  await page.goto('/experience');
  const shopee=peek(page,'shopee'),league=peek(page,'league');
  await chip(shopee).click();
  await expect(chip(shopee)).toHaveAttribute('aria-expanded','true');
  await expect(card(shopee)).toHaveCSS('position','static');
  await expect(shopee.locator('svg.sp-brand:not(.sp-brand--m) .sp-result')).toHaveCSS('opacity','1');
  // Phones drop the floating return-to-top on the Work page (it sat on the tags and chips), as Personal does.
  const toTop=page.locator('#return-to-top');
  await expect(toTop).toHaveClass(/is-visible/);
  await expect(toTop).toBeHidden();
  // One tap on the other chip opens it, even though closing Shopee moves the chip.
  await chip(league).click();
  await expect(chip(league)).toHaveAttribute('aria-expanded','true');
  await expect(chip(shopee)).toHaveAttribute('aria-expanded','false');
  await expect(card(league)).toHaveCSS('position','static');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const root of [shopee,league]){
   const pill=await root.locator('.internship-demo-peek__mini').boundingBox();
   const svg=await root.locator('.internship-demo-peek__mini svg').boundingBox();
   expect(svg.x+svg.width).toBeLessThanOrEqual(pill.x+pill.width+0.5);
   expect(svg.y+svg.height).toBeLessThanOrEqual(pill.y+pill.height+0.5);
  }
  await chip(league).click();
  await expect(chip(league)).toHaveAttribute('aria-expanded','false');
  await expect(toTop).toHaveCSS('pointer-events','auto');
  await expect(toTop).toHaveCSS('opacity','0.6');
 }
});

test('agentic AI chart: a hover previews it like the internship charts, it plays one ~13 s hunt in three narrative steps and replays, reduced motion holds the final frame, and phones get the stacked drawing',async({page})=>{
 const scene=root=>card(root).locator('svg.ag-scene:not(.ag-scene--m)');
 const phoneScene=root=>card(root).locator('svg.ag-scene--m');
 const shown=loc=>loc.evaluate(e=>+getComputedStyle(e).opacity);
 await page.setViewportSize({width:1366,height:768});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/experience');
 const root=peek(page,'agentic');
 await expect(chip(root)).toHaveText('Hunt from a report');
 // Desktop: a hover previews it, floating below its chip like the other internship charts.
 await root.dispatchEvent('mouseenter');
 await expect(card(root)).toHaveClass(/is-open/);
 await expect(card(root)).toHaveClass(/is-still/);
 await expect(card(root)).toHaveCSS('position','absolute');
 await expect(scene(root)).toBeVisible();
 await expect(phoneScene(root)).toBeHidden();
 // Reduced motion holds the final frame: all three steps, the human and the second search's find shown; nothing
 // transient (the report on its way in, pulses, ripples, glows, spinners, the query strip, the first search's "0 found") is left on screen.
 for(const s of ['.ag-s0','.ag-s1','.ag-s2','.ag-ana','.ag-found'])expect(await shown(scene(root).locator(s))).toBe(1);
 for(const s of ['.ag-doc','.ag-none','.ag-pk','.ag-det-dot','.ag-q'])expect(await shown(scene(root).locator(s))).toBe(0);
 for(const o of await scene(root).locator('.ag-fl, .ag-rip, .ag-spin, .ag-lc').evaluateAll(es=>es.map(e=>+getComputedStyle(e).opacity)))expect(o).toBe(0);
 const words=await scene(root).textContent();
 for(const s of ['Agentic Threat Hunting','From a ransomware report to one lead','Purpose-built agents','Equipped to adapt','Surface to the analyst','Supervisor','Hypothesis','Detection','Report','A local model does best with one job, so','each narrow agent gets only the tools','and context that job needs.','Only a human','No results can mean a bad query, not a','safe network. So the agent rewrites it,','checks the fix and searches again.','check query','32 found','Agents flag what looks suspicious, with','analyst makes the call.','Scheduled Task','T1053.005'])expect(words).toContain(s);
 const label=await scene(root).getAttribute('aria-label');
 expect(label.startsWith('An illustrative hunt.')).toBe(true);
 // The hunter's specifics are in the label, not on the chart.
 for(const s of ['schtasks.exe','event 4698','\\WinTaskUpdate','human analyst'])expect(label).toContain(s);
 // Generic and unquestionable: no real malware, internal component names, product names, counts of hits,
 // a root-level path as the reason, or the card's days-to-hours claim.
 const forbidden=/prime[- ]?th|SysUpdate|Evidence found|SPL crafter|Post-query|Splunk|root-level|days to hours|\bdays\b|\d+ hits|tokens?\b/i;
 expect(words).not.toMatch(forbidden);
 expect(label).not.toMatch(forbidden);
 // The card is wider than the other charts (46rem: three steps side by side) and the drawing fills it.
 const c=await card(root).boundingBox(),d=await scene(root).boundingBox();
 expect(Math.abs(c.width-d.width)).toBeLessThan(2);
 expect(c.width).toBeGreaterThan(560);
 expect(c.width).toBeLessThan(760);
 await root.dispatchEvent('mouseleave');
 await expect(card(root)).not.toHaveClass(/is-open/);
 // Playing: one hunt told as cause and effect, replayed by the shared loop once the final frame has held; no button, no story panel.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await chip(root).click();
 await expect(card(root)).toHaveClass(/is-playing/);
 const end=await card(root).evaluate(c=>Math.max(...c.getAnimations({subtree:true}).map(a=>a.effect.getComputedTiming().endTime).filter(Number.isFinite)));
 expect(end).toBeGreaterThan(11000);
 expect(end).toBeLessThan(17000);
 expect(await shown(scene(root).locator('.ag-s2'))).toBeLessThan(1);
 await expect(card(root).locator('.hsk-ctl')).toHaveCount(0);
 await page.keyboard.press('Escape');
 await expect(chip(root)).toHaveAttribute('aria-expanded','false');
 // Phones: a tap opens it inline with the stacked drawing, and nothing scrolls sideways.
 await page.setViewportSize({width:390,height:844});
 await page.goto('/experience');
 await chip(root).click();
 await expect(card(root)).toHaveCSS('position','static');
 await expect(phoneScene(root)).toBeVisible();
 await expect(scene(root)).toBeHidden();
 // Phones draw the same full pictures, larger, so the drawing uses the width rather than squeezing beside the text.
 const pb=await phoneScene(root).boundingBox();
 expect(pb.height).toBeGreaterThan(pb.width*1.8);
 await expect(phoneScene(root).locator('.ag-tool')).toHaveCount(3);
 await expect(phoneScene(root).locator('.ag-logo')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('phone charts stay open while the page scrolls and a finger lands elsewhere; the chip closes them',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/experience');
 const touchDown=()=>page.evaluate(()=>document.querySelector('#main').dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true})));
 for(const company of ['shopee','league','league-ab','agentic']){
  const root=peek(page,company);
  await chip(root).click();
  await expect(chip(root)).toHaveAttribute('aria-expanded','true');
  // A scroll starts with a finger down outside the card, then the chip leaves the screen.
  await touchDown();
  await page.evaluate(()=>scrollBy(0,1600));
  await page.waitForTimeout(150);
  await expect(chip(root)).toHaveAttribute('aria-expanded','true');
  await chip(root).evaluate(e=>e.scrollIntoView({block:'center'}));
  await chip(root).click();
  await expect(chip(root)).toHaveAttribute('aria-expanded','false');
 }
 // The anomaly charts already behave this way; keep them so.
 const site=page.locator('[data-peek="site"]');
 await site.evaluate(e=>e.scrollIntoView({block:'center'}));
 await site.click();
 await touchDown();
 await page.evaluate(()=>scrollBy(0,1600));
 await expect(site).toHaveAttribute('aria-expanded','true');
});

test('internship rows invite a hover (or a tap on phones), and the first chip of each row breathes whenever its charts are closed',async({page})=>{
 await page.goto('/experience');
 const hints=page.locator('.case-study--internship .internship-demo-hint');
 await expect(hints).toHaveCount(2);
 await expect(hints.first()).toHaveText('Hover the chart to see it in action',{useInnerText:true});
 // The agentic chart invites a hover like the internship rows.
 await expect(page.locator('#agentic-ai .internship-demo-hint')).toHaveText('Hover the chart to see it in action',{useInnerText:true});
 const first=chip(peek(page,'shopee'));
 await first.scrollIntoViewIfNeeded();
 await expect(first).toHaveClass(/is-breathing/);
 await first.hover();
 await expect(first).not.toHaveClass(/is-breathing/);
 // Closed again, it breathes again.
 await page.mouse.move(0,0);
 await expect(chip(peek(page,'shopee'))).toHaveAttribute('aria-expanded','false');
 await expect(first).toHaveClass(/is-breathing/);
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await expect(hints.nth(1)).toHaveText('Tap a chart to see it in action',{useInnerText:true});
 await expect(page.locator('#agentic-ai .internship-demo-hint')).toHaveText('Tap the chart to see it in action',{useInnerText:true});
});

test('smart zoom: a click near the bottom eases the whole card into view, keeps the chip on screen, and hover never scrolls',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/experience');
 const lower=async loc=>{await loc.evaluate(e=>{const r=e.getBoundingClientRect();scrollBy(0,r.bottom-(innerHeight-120));});await page.waitForTimeout(150);};
 for(const [chipSel,cardSel] of [['[data-company="shopee"] button','#shopee-demo-card'],['[data-company="league-ab"] button','#league-ab-card'],['[data-peek="series"]','#anomaly-card-series']]){
  const c=page.locator(chipSel);
  await lower(c);
  const y=await page.evaluate(()=>scrollY);
  await c.hover();
  await page.waitForTimeout(500);
  expect(await page.evaluate(()=>scrollY)).toBe(y);
  await c.click();
  await page.waitForTimeout(1300);
  const box=await page.locator(cardSel).boundingBox(),chipBox=await c.boundingBox();
  expect(box.y+box.height).toBeLessThanOrEqual(768);
  expect(chipBox.y).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.mouse.move(0,0);
 }
});
