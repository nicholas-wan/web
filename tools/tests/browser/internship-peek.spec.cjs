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
 await expect(league.locator('.lg-needle')).toHaveCSS('transform',/matrix\(-0\.84/);
 await page.keyboard.press('Escape');
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
