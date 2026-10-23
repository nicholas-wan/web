const {test,expect}=require('@playwright/test');
test('internship peeks support hover, pin, Escape and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/experience');
 const shopee=page.locator('[data-company="shopee"]'),league=page.locator('[data-company="league"]');
 await shopee.locator('button').hover();
 await expect(shopee.locator('button')).toHaveAttribute('aria-expanded','true');
 await expect(shopee.locator('.sp-brand')).toBeVisible();
 await shopee.locator('button').click();
 await page.mouse.move(0,0);
 await expect(shopee.locator('button')).toHaveAttribute('aria-expanded','true');
 await league.locator('button').hover();
 await expect(league.locator('button')).toHaveAttribute('aria-expanded','true');
 await expect(shopee.locator('button')).toHaveAttribute('aria-expanded','false');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(league.locator('.internship-demo-card')).toHaveClass(/is-still/);
 await page.keyboard.press('Escape');
 await expect(league.locator('button')).toHaveAttribute('aria-expanded','false');
 await expect(league.locator('.internship-demo-card')).toHaveAttribute('inert','');
});
test('phone internship peeks open inline without overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/experience');
 for(const company of ['shopee','league']){
 const root=page.locator('[data-company="'+company+'"]');
 await root.locator('button').click();
 await expect(root.locator('button')).toHaveAttribute('aria-expanded','true');
 await expect(root.locator('.internship-demo-card')).toHaveCSS('position','static');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await root.locator('button').click();
 await expect(root.locator('button')).toHaveAttribute('aria-expanded','false');
 }
});
