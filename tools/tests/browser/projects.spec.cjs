const { test, expect } = require('@playwright/test');

// Desktop shows one project at a time; its rail tab brings a card into view.
async function show(page, id) {
  const tab = page.locator(`.app-rail [aria-controls="${id}"]`);
  if (await tab.isVisible()) await tab.click();
}

test('Projects has four equal apps, sample labels and safe source links between Work and Skills', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('#nav .links li.active a')).toHaveText('Projects');
  await expect(page.locator('#nav .links a')).toHaveText(['About', 'Work', 'Projects', 'Skills', 'Personal', 'Travel']);
  await expect(page.locator('.app-card h2')).toHaveText(['SquashBot', 'Nag-bot', 'Finance tracker', 'Travel Packing']);
  await expect(page.locator('.app-why li')).toHaveCount(12);
  await expect(page.locator('.app-demo__reset')).toHaveCount(4);
  await expect(page.locator('.app-demo__skip')).toHaveCount(4);
  await expect(page.locator('#finance-tracker .f-top')).not.toContainText('Sample');
  await expect(page.locator('#nag-bot a.app-card__repo')).toHaveAttribute('href', 'https://github.com/nicholas-wan/tele-nagbot');
  await expect(page.locator('#finance-tracker a:not(.app-demo__skip)')).toHaveCount(0);
  await expect(page.locator('.site-pager__link--previous')).toHaveAttribute('href', 'experience');
  await expect(page.locator('.site-pager__link--next')).toHaveAttribute('href', 'skills');
  await expect(page.locator('.project-more')).toHaveCount(0);
});

test('Phone frames fit with reset, avoid overflow, and let scroll escape the list', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto('/projects');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  // Phones drop the floating return-to-top: it sat on the demos' buttons.
  await expect(page.locator('#return-to-top')).toBeHidden();
  for (const id of ['squashbot', 'nag-bot', 'finance-tracker', 'travel-packing']) {
    const intro = await page.locator(`#${id} .app-card__intro`).boundingBox();
    expect(intro.y + intro.height).toBeLessThan((await page.locator(`#${id} .app-phone`).boundingBox()).y);
  }
  for (const id of ['squashbot', 'nag-bot', 'finance-tracker', 'travel-packing']) {
    const app = page.locator(`#${id}`);
    expect((await app.locator('figure.app-card__demo').boundingBox()).height).toBeLessThan(659);
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
  await expect(app.locator('[data-chat]')).toContainText('Tomorrow · 9pm · C4 · 1 slot');
  await expect(app.locator('[data-chat] .sq-m--bot')).toHaveCount(2);
  await app.locator('[data-mini="courts"]').click();
  await expect(app.locator('.sq-mini')).toContainText('Court 4');
  await app.locator('.sq-mini [data-mk="tab"]').click();
  await expect(app.locator('.sq-mini')).toContainText('You owe Nicholas');
  await page.keyboard.press('Escape');
  await expect(app.locator('.sq-mini')).toBeHidden();
  await app.getByRole('button', { name: 'Start over SquashBot' }).click();
  await expect(app.locator('[data-pm]')).not.toContainText('C4');
});

test('Nag snooze, shared credit and half sheet work', async ({ page }) => {
  await page.goto('/projects');
  await show(page, 'nag-bot');
  const app = page.locator('#nag-bot');
  await app.getByRole('button', { name: 'Snooze…', exact: false }).click();
  await app.getByRole('button', { name: '30m', exact: true }).click();
  await expect(app.locator('.n-live')).toContainText('Snoozed');
  await app.getByRole('button', { name: 'Done together', exact: false }).click();
  await expect(app.locator('.n-live')).toContainText('Nicholas & DodgerBlueee');
  await expect(app.locator('.n-pinmsg')).not.toContainText('nagging');
  await app.locator('.n-pinbtn').click();
  await expect(app.locator('.n-sheet')).toBeVisible();
  // A half sheet: well under the phone's height, whatever size the phone is drawn at.
  expect((await app.locator('.n-sheet').boundingBox()).height).toBeLessThan((await app.locator('.app-demo').boundingBox()).height * 0.65);
  await page.keyboard.press('Escape');
  await expect(app.locator('.n-pinbtn')).toBeFocused();
  await app.getByRole('button', { name: 'Start over Nag-bot' }).click();
  await expect(app.locator('.n-live')).toContainText('nag #2');
});

test('Finance chart, masking, drill-down and the six phone tabs reset independently', async ({ page }) => {
  await page.goto('/projects');
  await show(page, 'finance-tracker');
  // The phone's own figure: the laptop beside it (wide screens) copies the same page.
  const app = page.locator('#finance-tracker figure.app-card__demo');
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
  await expect(app.locator('.f-title')).toHaveText('Possible card testing');
  await app.locator('[data-act="risk"]').first().click();
  await expect(app.getByRole('dialog')).toContainText('not a fraud verdict');
  await expect(app.getByRole('dialog')).toHaveAttribute('aria-modal','true');
  await expect(app.getByRole('button', { name: 'I recognize this' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(app.locator('[data-act="risk"]').first()).toBeFocused();
  await expect(app.locator('.f-tab')).toHaveText(['Overview', 'Wealth', 'Insurance', 'Home', 'Activity']);
  await app.locator('.f-tab[data-tab="wealth"]').click();
  await app.getByRole('button', { name: 'Investments' }).click();
  await expect(app.locator('.f-scroll')).toContainText('numbers tally');
  await app.locator('.f-tab[data-tab="insurance"]').click();
  await app.getByRole('button', { name: 'Alex' }).click();
  await expect(app.locator('.f-scroll .f-why')).toHaveText('Cover short S$40k on death and S$40k on TPD');
  await app.locator('.f-tab[data-tab="home"]').click();
  await app.getByRole('button', { name: /No active cover/ }).click();
  await expect(app.locator('.f-scroll .f-tr')).toHaveCount(1);
  await app.getByRole('button', { name: 'Start over Finance tracker' }).click();
  await expect(app.locator('.f-title')).toHaveText('Overview');
  await expect(app.getByRole('slider')).toHaveAttribute('aria-valuenow', '11');
  await expect(app.getByRole('button', { name: 'Hide amounts' })).toBeVisible();
});

test('Companion devices follow their phones on wide screens and never load on narrow ones', async ({ page }) => {
  const loads = [];
  page.on('request', (r) => { if (r.url().includes('projects-companions.js')) loads.push(r.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects');
  await show(page, 'finance-tracker');
  const fin = page.locator('#finance-tracker'), flow = fin.locator('.cpf-flow');
  await flow.scrollIntoViewIfNeeded();
  await expect(fin.locator('.cpn--flow')).toBeVisible();
  expect(loads).toHaveLength(1);
  expect(loads[0]).toMatch(/projects-companions\.js\?v=/);
  await expect(flow).toHaveClass(/is-run/);
  await expect(flow.locator('li > span:last-child')).toHaveText(['Bank PDFs downloaded', 'Checked on the PC', 'Read-only on phone']);
  await show(page, 'nag-bot');
  const nag = page.locator('#nag-bot');
  await nag.scrollIntoViewIfNeeded();
  await nag.locator('.n-kb button', { hasText: 'Done' }).first().click();
  await expect(nag.locator('.cpl-n')).toContainText('done by Nicholas');
  await show(page, 'squashbot');
  const sq = page.locator('#squashbot');
  await expect(sq.locator('.cpl-n')).toContainText('slots left on Court 1');
  const narrow = await page.context().newPage(), narrowLoads = [];
  narrow.on('request', (r) => { if (r.url().includes('projects-companions.js')) narrowLoads.push(r.url()); });
  await narrow.setViewportSize({ width: 1024, height: 800 });
  await narrow.goto('/projects');
  await narrow.waitForLoadState('load');
  await expect(narrow.locator('.cpn').first()).toBeHidden();
  expect(narrowLoads).toHaveLength(0);
  await narrow.close();
});

test('Packing laptop follows the phone on wide screens and never loads on narrow ones', async ({ page }) => {
  const loads = [];
  page.on('request', (r) => { if (r.url().includes('projects-laptop.js')) loads.push(r.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects');
  await show(page, 'travel-packing');
  const app = page.locator('#travel-packing'), lap = app.locator('.pkl');
  await app.scrollIntoViewIfNeeded();
  await expect(lap).toBeVisible();
  expect(loads[0]).toMatch(/projects-laptop\.js\?v=/);
  await expect(lap.locator('.pkl-bar > span').first()).toHaveText('7 of 20 packed');
  await app.getByRole('checkbox', { name: 'Passport, essential', exact: true }).check();
  await app.getByRole('button', { name: 'More nights', exact: true }).click();
  await expect(lap.locator('.pkl-bar > span').first()).toHaveText('8 of 20 packed');
  await expect(lap.locator('.pkl-pill')).toContainText('5 nights');
  await expect(lap.locator('.pkl-row.is-packed .pkl-name', { hasText: 'Passport' })).toHaveCount(1);
  await app.getByRole('button', { name: 'Start over Travel Packing' }).click();
  await expect(lap.locator('.pkl-bar > span').first()).toHaveText('7 of 20 packed');
  const narrow = await page.context().newPage(), narrowLoads = [];
  narrow.on('request', (r) => { if (r.url().includes('projects-laptop.js')) narrowLoads.push(r.url()); });
  await narrow.setViewportSize({ width: 1024, height: 800 });
  await narrow.goto('/projects');
  await narrow.waitForLoadState('load');
  await expect(narrow.locator('#travel-packing .pkl')).toBeHidden();
  expect(narrowLoads).toHaveLength(0);
  await narrow.close();
});

test('Packing computes quantities, packs essentials, filters and resets', async ({ page }) => {
  await page.goto('/projects');
  await show(page, 'travel-packing');
  const app = page.locator('#travel-packing');
  await app.scrollIntoViewIfNeeded();
  await expect(app.locator('.pk-cname')).toHaveText(['Basics', 'Hygiene', 'Clothes']);
  await app.getByRole('button', { name: 'More nights', exact: true }).click();
  await expect(app.locator('.pk-nlabel')).toHaveText('5 nights');
  await app.getByRole('checkbox', { name: 'Passport, essential', exact: true }).check();
  await expect(app.locator('.pk-plabel')).toContainText('8 of');
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
  // The resumed preview sends the first chip, which then leaves the row; the reader taps the second.
  await app.locator('.sq-chip').nth(1).click();
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
  await expect(page.locator('#squashbot-why')).toBeFocused();
});

test('All four demos accept phone-sized interactions without clipped controls', async ({ page }) => {
  await page.setViewportSize({width:393,height:659});
  await page.goto('/projects');
  await page.locator('#squashbot .sq-chip').first().click();
  await page.locator('#squashbot [data-a="y"]').click();
  await expect(page.locator('#squashbot [data-pm]')).toContainText('C4');
  await page.locator('#nag-bot .app-demo').scrollIntoViewIfNeeded();
  await page.locator('#nag-bot').getByRole('button',{name:'Snooze…',exact:false}).click();
  await page.locator('#nag-bot').getByRole('button',{name:'30m',exact:true}).click();
  await expect(page.locator('#nag-bot .n-live')).toContainText('Snoozed');
  await page.locator('#finance-tracker .app-demo').scrollIntoViewIfNeeded();
  await page.locator('#finance-tracker [data-cat="flag"]').click();
  await page.locator('#finance-tracker [data-act="risk"]').first().click();
  await expect(page.locator('#finance-tracker .f-res')).toContainText('Read-only copy');
  await page.locator('#travel-packing .app-demo').scrollIntoViewIfNeeded();
  await page.locator('#travel-packing').getByRole('button',{name:'More nights',exact:true}).click();
  await expect(page.locator('#travel-packing .pk-nlabel')).toHaveText('5 nights');
  await page.locator('#travel-packing').getByRole('checkbox',{name:'Sports Shoes',exact:true}).check();
  await expect(page.locator('#travel-packing .pk-plabel')).toContainText('8 of');
});

test('Desktop shows one project at a time and the rail switches with clicks and arrow keys', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects');
  await expect(page.locator('.app-card:visible')).toHaveCount(1);
  await expect(page.locator('#squashbot')).toBeVisible();
  await page.locator('.app-rail [aria-controls="finance-tracker"]').click();
  await expect(page.locator('#finance-tracker')).toBeVisible();
  await expect(page.locator('#squashbot')).toBeHidden();
  await expect(page.locator('.app-rail [aria-controls="finance-tracker"]')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#travel-packing')).toBeVisible();
  await expect(page.locator('.app-rail [aria-controls="travel-packing"]')).toBeFocused();
  await page.setViewportSize({ width: 393, height: 659 });
  await expect(page.locator('.app-rail')).toBeHidden();
  await expect(page.locator('.app-card:visible')).toHaveCount(4);
});
