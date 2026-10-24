const {test,expect}=require('@playwright/test');
const peek=(page,company)=>page.locator('[data-company="'+company+'"]');
const chip=root=>root.locator('button');
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
 await expect(league.locator('.lg-review')).toHaveCSS('opacity','1');
 await expect(league.locator('.lg-review')).toHaveText('Risky profile');
 await expect(league.locator('.lg-needle')).toHaveCSS('transform',/matrix\(-0\.83/);
 // Three signals: each frame's line is drawn to its bar, no frame is left on
 // the phone, the classifier's route is drawn to its leaf, and the flag is
 // pinned to the photo.
 await expect(league.locator('.lg-bar')).toHaveCount(3);
 for(const link of await league.locator('.lg-link').all())await expect(link).toHaveCSS('stroke-dashoffset','0px');
 for(const frame of await league.locator('.lg-frame').all())await expect(frame).toHaveCSS('opacity','0');
 await expect(league.locator('.lg-route')).toHaveCSS('stroke-dashoffset','0px');
 await expect(league.locator('.lg-caps text')).toHaveText(['Signals','Model','Risk']);
 await expect(league.locator('.lg-badge')).toHaveCSS('opacity','1');
 await expect(league.locator('.lg-pick')).toHaveCSS('opacity','1');
 // Only the chosen leaf is lit; the phone's lettering is live text in the
 // League's own fonts (glyph-only subsets), not outlines.
 await expect(league.locator('.lg-leaf')).toHaveCSS('opacity','1');
 await expect(league.locator('.lg-leafc')).toHaveCSS('opacity','0.35');
 await expect(league.locator('.lg-mark text')).toHaveText(['THE','league']);
 await expect(league.locator('.lg-name')).toHaveText('James M.');
 await expect(league.locator('.lg-key text')).toHaveText(['Education','Profession','Interests','Groups']);
 await expect(league.locator('.lg-seps rect')).toHaveCount(await league.locator('.lg-sep').count());
 expect(await page.evaluate(async()=>{await document.fonts.ready;return ['italic 900 8px "League Mark"','8px "League Serif"','italic 8px "League Serif"'].every(f=>document.fonts.check(f));})).toBe(true);
 await page.keyboard.press('Escape');
 // Shopee's final frame: the title highlight and every word row, with solid
 // model edges and chips that hide what they pass over.
 await shopee.dispatchEvent('mouseenter');
 await expect(card(shopee)).toHaveClass(/is-still/);
 await expect(shopee.locator('.sp-crop')).toHaveCSS('opacity','1');
 await expect(shopee.locator('.sp-slot')).toHaveCount(5);
 for(const slot of await shopee.locator('.sp-slot').all())await expect(slot).toHaveCSS('opacity','1');
 for(const edge of await shopee.locator('.sp-edge').all())await expect(edge).toHaveCSS('stroke-dasharray','none');
 for(const rect of await shopee.locator('.sp-chip rect').all())expect(await rect.getAttribute('fill-opacity')).toBeNull();
 // The listing is set in Figtree (Shopee's own face is not free), in the
 // app's weights: medium title, regular meta, a dark value column.
 expect(await page.evaluate(async()=>{await document.fonts.ready;return ['400','500','700'].every(w=>document.fonts.check(w+' 11px Figtree'));})).toBe(true);
 await expect(shopee.locator('.sp-card .sp-title').first()).toHaveCSS('font-weight','500');
 await expect(shopee.locator('.sp-value').first()).toHaveCSS('fill','rgb(34, 34, 34)');
 await shopee.dispatchEvent('mouseleave');
 await page.keyboard.press('Escape');
 // The League's second peek, the A/B test, opens on its final frame: both
 // designs (A's border, B's badge) and two match-rate hills, apart.
 const ab=peek(page,'league-ab');
 await ab.dispatchEvent('mouseenter');
 await expect(card(ab)).toHaveClass(/is-still/);
 await expect(chip(ab)).toHaveText('A/B test a badge');
 // Simple on purpose (owner): no numbers, test jargon or verdict.
 const words=await ab.locator('svg.lgab-scene text').allTextContents();
 expect(words).toEqual(expect.arrayContaining(['Match rate by design','How likely','Match rate','A · Border','B · Badge','Most compatible']));
 expect(words.join(' ')).not.toMatch(/\bCI\b|Ship|better|confidence|\d+%/);
 await expect(ab.locator('.lgab-badge')).toHaveCount(2);
 await expect(ab.locator('.lgab-hill')).toHaveCount(2);
 const peaks=await ab.locator('.lgab-hill').evaluateAll(hs=>hs.map(h=>h.getBoundingClientRect()));
 // Each hill spans 8 standard deviations; centres 4 apart barely overlap.
 const mid=b=>b.left+b.width/2;
 expect(mid(peaks[1])-mid(peaks[0])).toBeGreaterThan(peaks[0].width*.4);
 await expect(ab.locator('.lgab-cap text')).toHaveText(['Randomise','Measure']);
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
  return [1,2,3,4,5].map(i=>{
  const c=root.querySelector('.sp-chip-'+i),a=c.getAnimations()[0];
  a.pause();a.currentTime=a.effect.getTiming().delay+a.effect.getTiming().duration*0.87;
  const t=c.querySelector('text').getBoundingClientRect(),w=root.querySelector('.sp-slot-'+i+' .sp-word').getBoundingClientRect();
  return Math.max(Math.abs(t.left-w.left),Math.abs(t.right-w.right),Math.abs(t.bottom-w.bottom));
 });});
 for(const gap of landings)expect(gap).toBeLessThan(0.6);
 await chip(shopee).click();
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
  await expect(shopee.locator('.sp-result')).toHaveCSS('opacity','1');
  // The floating return-to-top steps aside while a card is open on phones.
  const toTop=page.locator('#return-to-top');
  await expect(toTop).toHaveClass(/is-visible/);
  await expect(toTop).toHaveCSS('opacity','0');
  await expect(toTop).toHaveCSS('pointer-events','none');
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
