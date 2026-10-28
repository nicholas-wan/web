// Regression coverage for the phone collision reported on 28 Oct 2026.
// Check actual rendered text through the transitions, not only the frame index.
const { test, expect } = require('@playwright/test');

const scene = (page, i) => page.locator('#agentic-ai .hs-scene').nth(i);
const sizes = [[375, 548], [360, 640], [390, 740], [390, 844], [1366, 768], [1920, 1080]];

async function openStory(page, width, height, motion = 'no-preference') {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto('/experience');
  await page.locator('#agentic-ai .hs-story').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.hsStory === 1);
  await page.evaluate(() => document.fonts.ready);
}

async function position(page, i, u) {
  await scene(page, i).evaluate((root, screens) => {
    const h = root.querySelector('.hs-stage').offsetHeight;
    scrollTo({ top: root.getBoundingClientRect().top + scrollY + screens * h, behavior: 'instant' });
  }, u);
  // Let the scroll-following ease settle; the temporal path is sampled separately
  // by the next scroll position. This is deliberately not the eight-second demo timer.
  await page.waitForTimeout(240);
}

async function settledScroll(page) {
  let previous = null, unchanged = 0;
  await expect.poll(async () => {
    const y = await page.evaluate(() => scrollY);
    unchanged = previous !== null && Math.abs(y - previous) < 0.5 ? unchanged + 1 : 0;
    previous = y;
    return unchanged;
  }, { intervals: [100], timeout: 5000 }).toBeGreaterThanOrEqual(3);
}

async function geometry(locator) {
  return locator.evaluate(root => {
    const rect = r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    const opacity = el => {
      let a = 1;
      for (let p = el; p && p !== root.parentElement; p = p.parentElement) {
        const c = getComputedStyle(p);
        if (c.display === 'none' || c.visibility !== 'visible') return 0;
        a *= Number(c.opacity);
      }
      return a;
    };
    const clipped = (r, el) => {
      let out = rect(r);
      for (let p = el; p && p !== root.parentElement; p = p.parentElement) {
        const c = getComputedStyle(p), b = p.getBoundingClientRect();
        if (/hidden|clip|auto|scroll/.test(c.overflowX)) { out.left = Math.max(out.left, b.left); out.right = Math.min(out.right, b.right); }
        if (/hidden|clip|auto|scroll/.test(c.overflowY)) { out.top = Math.max(out.top, b.top); out.bottom = Math.min(out.bottom, b.bottom); }
      }
      out.width = out.right - out.left; out.height = out.bottom - out.top;
      return out;
    };
    const active = root.querySelector('.hs-step.is-on');
    const words = [];
    const walker = document.createTreeWalker(root.querySelector('.hs-console'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement;
      if (!node.textContent.trim() || opacity(el) < 0.2) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        const b = clipped(r, el);
        if (b.width > 1 && b.height > 1) words.push({ text: node.textContent.trim().slice(0, 55), ...b });
      }
    }
    const copy = active ? rect(active.getBoundingClientRect()) : null;
    const controls = [...root.querySelectorAll('.hs-btn')].filter(el => opacity(el) > 0.1).map(el => rect(el.getBoundingClientRect()));
    const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
    const collisions = copy ? words.filter(w => intersects(w, copy) || controls.some(c => intersects(w, c))) : [];
    const overlay = root.querySelector('.hs-o2');
    const obscuredAgents = overlay && opacity(overlay) > 0.2 ? [...root.querySelectorAll('.c2-node')].filter(el => opacity(el) > 0.2 && intersects(overlay.getBoundingClientRect(), el.getBoundingClientRect())).map(el => el.textContent.trim()) : [];
    return { collisions, obscuredAgents, controls, live: root.classList.contains('is-live'), frame: root.dataset.hsF, words: words.length, overflow: document.documentElement.scrollWidth - innerWidth };
  });
}

for (const [width, height] of sizes) {
  test(`story polish: readable collision-free motion, forward and backward at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(180000);
    await openStory(page, width, height);
    for (let i = 0; i < 3; i++) {
      const s = scene(page, i);
      const live = await s.evaluate(e => e.classList.contains('is-live'));
      if (!live) {
        // Record useful measurements before rejecting fallback at supported phone sizes.
        console.info(`Readable static fallback: chapter ${i + 1} at ${width}x${height}`);
        if (process.env.STORY_REVIEW_DIAGNOSTICS) {
          console.info(await s.evaluate(root => {
            const cls = root.className, style = root.getAttribute('style');
            root.classList.add('is-live', 'is-tight');
            root.style.setProperty('--hs-objh', '230px');
            root.style.setProperty('--hs-feed', '110px');
            const read = sel => [...root.querySelectorAll(sel)].map(el => ({ cls: el.className, h: el.offsetHeight, w: el.offsetWidth }));
            const out = { frame: read('.hs-frame'), list: read('.hs-steps'), stage: read('.hs-stage'), objects: read('.hs-objs > *, .hs-src > *') };
            root.className = cls;
            if (style === null) root.removeAttribute('style'); else root.setAttribute('style', style);
            return out;
          }));
        }
        expect(live, `chapter ${i + 1} should animate at supported ${width}x${height}`).toBe(true);
      }
      const holds = await s.evaluate(e => JSON.parse(e.dataset.hsStory).hold);
      if (i === 1 && width <= 560) {
        await expect(s.locator('.c2-g'), 'phone retains the agent hierarchy').toBeVisible();
        for (const role of ['sup', 'hyp', 'inv', 'det']) await expect(s.locator(`.c2-n--${role}`)).toBeVisible();
      }
      const rests = [i === 1 ? Math.max(0.3, (holds?.[0] || 0.8) - 0.62) : 0.3, holds?.[0] || 0.8, (holds?.[0] || 0.8) + (holds?.[1] || 0.8)];
      const positions = [-0.25, 0, 0.15, 0.3];
      for (const end of rests.slice(1)) for (const p of [0, 0.1, 0.25, 0.5, 0.75, 1]) positions.push(end - 0.5 + p * 0.5);
      for (const u of [...positions, ...positions.slice().reverse()]) {
        await position(page, i, u);
        const g = await geometry(s);
        expect(g.collisions, `chapter ${i + 1}, screen offset ${u}, frame ${g.frame}`).toEqual([]);
        expect(g.obscuredAgents, `query overlay must not obscure the agent hierarchy at ${u}`).toEqual([]);
        expect(g.overflow).toBeLessThanOrEqual(1);
        for (const c of g.controls) {
          expect(c.width, 'arrow hit target width').toBeGreaterThanOrEqual(43.5);
          expect(c.height, 'arrow hit target height').toBeGreaterThanOrEqual(43.5);
        }
      }
      // At a readable resting frame, ancestor transforms must not shrink labels.
      for (const [restFrame, u] of rests.entries()) {
        await position(page, i, u + 0.02);
        await expect.poll(() => s.locator('.hs-objs').evaluate((e, f) => Number(getComputedStyle(e).getPropertyValue(`--hs-p${f}`)), restFrame)).toBe(1);
        if (width >= 1366) {
          const balance = await s.locator('.hs-frame').evaluate(e => {
            const r = e.getBoundingClientRect();
            return Math.abs((r.top + r.bottom) / 2 - innerHeight / 2);
          });
          expect(balance, 'desktop composition stays centred in the viewport').toBeLessThanOrEqual(2);
        }
        if (i === 1 && restFrame === 0) await expect.poll(() => s.locator('.hs-objs').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--hs-run')))).toBe(1);
        const small = await s.evaluate(root => {
          if (innerWidth > 560) return []; // The established 12px floor is the phone contract.
          const selectors = '.hs-chip code,.hs-lane-t,.hs-lab,.hs-lo dt,.hs-lo dd,.hs-env-l dt,.hs-env-l dd,.hs-scope-l,.hs-key span,.hs-gfoot,.hs-ov-b,.hs-ov-row,.hs-out,.hs-trace li,.hs-tr-n,.hs-wmap svg text,.c2-chip,.c2-cid,.c2-tag,.c2-call,.c2-code,.c2-mono,.c2-evn,.c2-name';
          return [...root.querySelectorAll(selectors)].flatMap(el => {
            let alpha = 1;
            for (let p = el; p && p !== root.parentElement; p = p.parentElement) {
              const c = getComputedStyle(p);
              if (c.display === 'none' || c.visibility !== 'visible') return [];
              alpha *= Number(c.opacity);
            }
            const r = el.getBoundingClientRect();
            if (alpha < 0.8 || !r.width || !r.height) return [];
            const matrix = typeof el.getScreenCTM === 'function' ? el.getScreenCTM() : null;
            const scale = matrix ? Math.hypot(matrix.c, matrix.d) : el.offsetHeight ? r.height / el.offsetHeight : 1;
            const px = parseFloat(getComputedStyle(el).fontSize) * scale;
            return px < 11.7 ? [{ text: el.textContent.trim().slice(0, 70), px }] : [];
          });
        });
        expect(small, `chapter ${i + 1}, resting at ${u}`).toEqual([]);
        if (process.env.STORY_REVIEW_SCREENSHOTS) {
          const file = test.info().outputPath(`chapter-${i + 1}-rest-${u.toFixed(2)}.png`);
          await page.screenshot({ path: file });
          await test.info().attach(`chapter-${i + 1}-rest-${u}`, { path: file, contentType: 'image/png' });
        }
      }
    }
  });
}

for (const [width, height] of [[1366, 768], [375, 548]]) test(`story polish: navigation lands on finished frames at ${width}x${height}`, async ({ page }) => {
  await openStory(page, width, height);
  for (const i of [0, 1, 2]) {
    const s = scene(page, i);
    const hold = await s.evaluate(e => JSON.parse(e.dataset.hsStory).hold[0]);
    await position(page, i, hold + 0.03);
    await s.locator('.hs-prev').click();
    await expect(s).toHaveAttribute('data-hs-f', '0');
    await settledScroll(page);
    await expect.poll(() => s.locator('.hs-objs').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--hs-p0')))).toBeGreaterThan(0.995);
    if (i === 1) await expect.poll(() => s.locator('.hs-objs').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--hs-run')))).toBeGreaterThan(0.995);
    if (width > 560) {
      await position(page, i, hold + 0.03);
      await s.locator('.hs-dot').first().click();
      await expect(s).toHaveAttribute('data-hs-f', '0');
      await settledScroll(page);
      await expect.poll(() => s.locator('.hs-objs').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--hs-p0')))).toBeGreaterThan(0.995);
    }
    await s.locator('.hs-next').click();
    await expect(s).toHaveAttribute('data-hs-f', '1');
    await settledScroll(page);
    await expect.poll(() => s.locator('.hs-objs').evaluate(e => Number(getComputedStyle(e).getPropertyValue('--hs-p1')))).toBeGreaterThan(0.995);
  }
});

test('story polish: a genuinely small screen retains readable static content', async ({ page }) => {
  await openStory(page, 320, 480);
  for (let i = 0; i < 3; i++) {
    const s = scene(page, i);
    if (await s.evaluate(e => e.classList.contains('is-live'))) continue;
    for (const step of await s.locator('.hs-step').all()) await expect(step).toBeVisible();
    for (const object of await s.locator('.hs-doc,.hs-hyp,.hs-rows,.hs-kb,.hs-ov').all()) await expect(object).toBeVisible();
    for (const control of await s.locator('.hs-btn,.hs-dot').all()) await expect(control).toBeHidden();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('story polish: switching to reduced motion restores all content without trapped controls', async ({ page }) => {
  await openStory(page, 390, 740);
  await position(page, 0, 1.7);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.hs-scene.is-live')).toHaveCount(0);
  for (const step of await page.locator('.hs-step').all()) {
    await expect(step).toBeVisible();
    await expect(step).toHaveCSS('opacity', '1');
  }
  for (const control of await page.locator('.hs-btn,.hs-dot').all()) await expect(control).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
