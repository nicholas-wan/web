const { test, expect } = require('@playwright/test');

test('Projects has four equal apps, sample labels and safe source links between Work and Skills', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('#nav .links li.active a')).toHaveText('Projects');
  await expect(page.locator('#nav .links a')).toHaveText(['About', 'Work', 'Projects', 'Skills', 'Personal', 'Travel']);
  await expect(page.locator('.app-card h2')).toHaveText(['SquashBot', 'Nag-bot', 'Finance tracker', 'Travel Packing']);
  await expect(page.locator('.app-why li')).toHaveCount(12);
  await expect(page.locator('.app-demo__reset')).toHaveCount(4);
  await expect(page.locator('.app-demo__skip')).toHaveCount(4);
  await expect(page.locator('.f-sample')).toHaveText('Sample');
  await expect(page.locator('#nag-bot a:not(.app-demo__skip), #finance-tracker a:not(.app-demo__skip)')).toHaveCount(0);
  await expect(page.locator('.site-pager__link--previous')).toHaveAttribute('href', 'experience');
  await expect(page.locator('.site-pager__link--next')).toHaveAttribute('href', 'skills');
  await expect(page.locator('.project-index h3')).toHaveText('Brawl Stars');
});

test('Phone frames fit with reset, avoid overflow, and let scroll escape the list', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto('/projects');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  for (const id of ['squashbot', 'nag-bot', 'finance-tracker', 'travel-packing']) {
    const app = page.locator(`#${id}`);
    expect((await app.locator('figure').boundingBox()).height).toBeLessThan(659);
    const foot = await app.locator('.app-card__foot').boundingBox();
    const phone = await app.locator('.app-phone').boundingBox();
    expect(foot.y + foot.height).toBeLessThan(phone.y + 2);
  }
  const list = page.locator('.pk-scroll');
  await page.locator('#travel-packing .app-demo').scrollIntoViewIfNeeded();
  await expect(page.locator('.pk-cname')).toHaveCount(3);
  await list.evaluate(e => { e.scrollTop = e.scrollHeight; });
  // Older WebKit omits this property and uses its normal page scroll chaining.
  expect(await list.evaluate(e => getComputedStyle(e).getPropertyValue('overscroll-behavior-y'))).toMatch(/^(auto|)$/);
  const b = await list.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 20);
});

test('Squash booking updates the court Mini App and resets', async ({ page }) => {
  await page.goto('/projects');
  const app = page.locator('#squashbot');
  await app.locator('.sq-chip').first().click();
  await expect(app.locator('[data-chat]')).toContainText('Confirm this squash booking');
  await app.getByRole('button', { name: 'Add booking', exact: false }).click();
  await expect(app.locator('[data-pm]')).toContainText('C4');
  await app.locator('[data-mini="courts"]').click();
  await expect(app.locator('.sq-mini')).toContainText('Court 4');
  await page.keyboard.press('Escape');
  await expect(app.locator('.sq-mini')).toBeHidden();
  await app.getByRole('button', { name: 'Start over SquashBot' }).click();
  await expect(app.locator('[data-pm]')).not.toContainText('C4');
});

test('Nag snooze, shared credit and half sheet work', async ({ page }) => {
  await page.goto('/projects');
  const app = page.locator('#nag-bot');
  await app.getByRole('button', { name: 'Snooze…', exact: false }).click();
  await app.getByRole('button', { name: '30m', exact: true }).click();
  await expect(app.locator('.n-live')).toContainText('Snoozed');
  await app.getByRole('button', { name: 'Done together', exact: false }).click();
  await expect(app.locator('.n-live')).toContainText('Nicholas & Alex');
  await app.locator('.n-pinbtn').click();
  await expect(app.locator('.n-sheet')).toBeVisible();
  expect((await app.locator('.n-sheet').boundingBox()).height).toBeLessThan(350);
  await page.keyboard.press('Escape');
  await expect(app.locator('.n-pinbtn')).toBeFocused();
  await app.getByRole('button', { name: 'Start over Nag-bot' }).click();
  await expect(app.locator('.n-live')).toContainText('nag #2');
});

test('Finance chart, masking, drill-down and stopped import reset independently', async ({ page }) => {
  await page.goto('/projects');
  const app = page.locator('#finance-tracker');
  await app.scrollIntoViewIfNeeded();
  const chart = app.getByRole('slider');
  await chart.focus(); await page.keyboard.press('ArrowLeft');
  await expect(chart).toHaveAttribute('aria-valuenow', '10');
  await app.getByRole('button', { name: 'Hide amounts' }).click();
  await expect(app.getByRole('button', { name: 'Show amounts' })).toHaveAttribute('aria-pressed', 'true');
  await app.getByRole('button', { name: /Key spending/ }).click();
  await expect(app.locator('.f-key')).toHaveCount(5);
  await app.locator('.f-key').first().click();
  await expect(app.locator('.f-tr').first()).toBeVisible();
  await app.locator('.f-back').click();
  await app.locator('.f-back').click();
  await app.getByRole('button', { name: /Needs attention/ }).click();
  await app.locator('[data-st="1"]').click();
  await expect(app.getByRole('dialog')).toContainText('not imported');
  await expect(app.getByRole('dialog')).toHaveAttribute('aria-modal','true');
  await page.keyboard.press('Escape');
  await expect(app.locator('[data-st="1"]')).toBeFocused();
  await app.getByRole('button', { name: 'Start over Finance tracker' }).click();
  await expect(app.getByRole('slider')).toHaveAttribute('aria-valuenow', '11');
  await expect(app.getByRole('button', { name: 'Hide amounts' })).toBeVisible();
});

test('Packing computes quantities, packs essentials, filters and resets', async ({ page }) => {
  await page.goto('/projects');
  const app = page.locator('#travel-packing');
  await app.scrollIntoViewIfNeeded();
  await expect(app.locator('.pk-cname')).toHaveText(['Basics', 'Hygiene', 'Clothes']);
  await app.getByRole('button', { name: 'More nights', exact: true }).click();
  await expect(app.locator('.pk-nlabel')).toHaveText('5 nights');
  await app.getByRole('checkbox', { name: 'Passport, essential', exact: true }).check();
  await expect(app.locator('.pk-plabel')).toContainText('1 of');
  await app.locator('.pk-lc').click();
  await expect(app.locator('[data-id="passport"]')).toHaveCount(0);
  await expect(app.locator('.pk-note')).toContainText('still to pack');
  await app.getByRole('button', { name: 'Start over Travel Packing' }).click();
  await expect(app.locator('.pk-nlabel')).toHaveText('4 nights');
  await expect(app.getByRole('checkbox', { name: 'Passport, essential', exact: true })).not.toBeChecked();
});

test('Reduced motion leaves ready apps without previews or animation', async ({ page }) => {
  await page.goto('/projects');
  await page.locator('#squashbot .app-demo').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-playing]')).toHaveCount(0);
  await expect(page.locator('#squashbot .sq-chat')).not.toContainText('Confirm this squash booking');
  for (const app of await page.locator('.app-demo').all()) {
    expect(await app.evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
  }
});

test('Previews serialize, resume after swipes and hand over after a tap', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/projects');
  const app = page.locator('#squashbot .app-demo');
  await app.scrollIntoViewIfNeeded();
  await expect(app).toHaveAttribute('data-playing', '1');
  await expect(page.locator('[data-playing]')).toHaveCount(1);
  await app.dispatchEvent('pointerdown', { pointerId: 1 });
  await expect(page.locator('[data-playing]')).toHaveCount(0);
  await app.dispatchEvent('pointercancel', { pointerId: 1 });
  await expect(app).toHaveAttribute('data-playing', '1');
  await app.locator('.sq-chip').first().click();
  await expect(app).toHaveAttribute('data-user', '1');
  await expect(app).not.toHaveAttribute('data-playing', '1');
  await page.waitForTimeout(3500);
  await expect(app.locator('.sq-chat')).toContainText('Confirm this squash booking');
  await expect(app.locator('[data-pm]')).not.toContainText('C4');
});

test('Reset hover stays teal and demo headings do not change the page outline', async ({ page }) => {
  await page.goto('/projects');
  const reset=page.getByRole('button',{name:'Start over SquashBot'});
  await reset.hover();
  expect(await reset.evaluate(e => getComputedStyle(e).color)).not.toBe('rgb(24, 191, 239)');
  await expect(page.locator('.app-demo h1, .app-demo h2, .app-demo h3, .app-demo [role="heading"]')).toHaveCount(0);
  await page.locator('.app-demo__skip').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#squashbot-title')).toBeFocused();
});

test('All four demos accept phone-sized interactions without clipped controls', async ({ page }) => {
  await page.setViewportSize({width:393,height:659});
  await page.goto('/projects');
  await page.locator('#squashbot .sq-chip').first().click();
  await page.locator('#squashbot [data-a="y"]').click();
  await expect(page.locator('#squashbot [data-pm]')).toContainText('C4');
  await page.locator('#nag-bot').getByRole('button',{name:'Snooze…',exact:false}).click();
  await page.locator('#nag-bot').getByRole('button',{name:'30m',exact:true}).click();
  await expect(page.locator('#nag-bot .n-live')).toContainText('Snoozed');
  await page.locator('#finance-tracker .app-demo').scrollIntoViewIfNeeded();
  await page.locator('#finance-tracker [data-tab="ledger"]').click();
  await page.locator('#finance-tracker [data-st="1"]').click();
  await expect(page.locator('#finance-tracker .f-res')).toContainText('not imported');
  await page.locator('#travel-packing .app-demo').scrollIntoViewIfNeeded();
  await page.locator('#travel-packing').getByRole('button',{name:'More nights',exact:true}).click();
  await expect(page.locator('#travel-packing .pk-nlabel')).toHaveText('5 nights');
  await page.locator('#travel-packing').getByRole('checkbox',{name:'Earpiece',exact:true}).check();
  await expect(page.locator('#travel-packing .pk-plabel')).toContainText('1 of');
});
