/* The Agentic AI story on Experience (hs-; README "Agentic AI story"): three pinned chapters in #agentic-ai,
   injected on demand by the inline loader after the story (tools/scenes/agentic-story/build.cjs). A frame is
   a resting point; its big move is scrubbed by the scroll (27 Oct 2026, lab/scroll-speed-review.md): three
   0..1 values go on each chapter's .hs-objs as custom properties (not the scene root: that restyles the
   console's 300 nodes a frame), --hs-p0 (frame 0's arrival), --hs-pN (frame N's arrival over TRAVEL screens)
   and --hs-pe (the exit); the CSS drives the moves from them, the console's fade is set inline, and the
   values chase the scroll (TAU) since wheels scroll in notches. Then nothing changes for the dwell. Chapter 01
   measures each data-hs-from element's offset from its source (--hs-dx/--hs-dy) so chips and facts start where
   they are pulled from; objects a frame has not reached (data-hs-late="N") stay visibility:hidden. The engineering chapter drives the console's paused CSS
   animations from a clock. Native scrolling is never touched (no snapping, no wheel handling); the buttons
   and dots scroll smoothly to a frame. Base styles are the final state (no JS, reduced motion, short screens). */
(() => {
  if (!window.requestAnimationFrame || window.hsStory) return;
  window.hsStory = 1;
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const onMotion = fn => { if (motion.addEventListener) motion.addEventListener('change', fn); else if (motion.addListener) motion.addListener(fn); addEventListener('hs-plain', fn); };
  // plain mode (html.hs-plain, toggled by the DSTA logo in the inline loader) is treated like reduced motion
  const moving = () => motion.matches && !document.documentElement.classList.contains('hs-plain');

  // ---------------------------------------------------------------- the chapters
  const scenes = [...document.querySelectorAll('.hs-scene')];
  if (!scenes.length) return;
  const canClock = !!Element.prototype.getAnimations;
  // scroll geometry, in screens (small viewport heights); a frame's words and objects change together
  // (README "Motion and length")
  const GAP = 0.8;    // from one frame's resting point to the next: the dwell
  const LAST = 0.5;   // the last frame's dwell, then the stage lets go
  const TRAVEL = 0.5; // a later frame's move runs over this much scroll before its resting point
  const TZ = TRAVEL;  // ...and its text swaps where that move starts
  const HYST = 0.06;  // ...and swaps back only once the reader is this much further back
  const ENTER = 0.32; // the first frame starts once the stage is this close to pinning
  const A0 = 0.3;     // ...and its move completes this far after the pin (that frame holds longer)
  const TAU = 0.07;   // the chase's time constant, s
  const BACK = 0.6, CATCH = 0.45, MINFEED = 110, MINOBJ = 230;
  const clamp = x => (x < 0 ? 0 : x > 1 ? 1 : x);
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const svh = () => probe.getBoundingClientRect().height || innerHeight;
  const pinOn = new Set();
  const flag = (set, el, cls, scene, on) => { if (on) set.add(scene); else set.delete(scene); el.classList.toggle(cls, set.size > 0); };

  scenes.forEach(root => {
    let data;
    try { data = JSON.parse(root.getAttribute('data-hs-story')); } catch (e) { return; }
    const stage = root.querySelector('.hs-stage'), frame = root.querySelector('.hs-frame'), list = root.querySelector('.hs-steps');
    const panel = root.querySelector('.hs-console > .hunt-panel'), objs = root.querySelector('.hs-objs');
    const steps = [...root.querySelectorAll('.hs-step')], dots = [...root.querySelectorAll('.hs-dot')];
    const prev = root.querySelector('.hs-prev'), next = root.querySelector('.hs-next'), fill = root.querySelector('.hs-fill');
    const N = steps.length;
    const clocked = !!(panel && data.d);
    if (!stage || !frame || !list || !(panel || objs) || N < 2 || (clocked && !canClock)) return;

    let live = false, tl = data.d, anims = [], vh = 0, total = 0;
    let goal = -1, m = 0, t = 0, rate = 0, raf = 0, queued = 0, aim = -1, sizeKey = '', sideH = 0;
    const hold = f => (data.hold && data.hold[f]) || GAP;   // the dwell after frame f's resting point
    const rest = f => { let u = 0; for (let i = 0; i < f; i++) u += hold(i); return u; };
    const uNow = () => -root.getBoundingClientRect().top / vh;

    // ---------------------------------------------------------------- the scrubbed progress values
    const names = []; for (let f = 0; f < N; f++) names.push('--hs-p' + f); names.push('--hs-pe');
    const holders = [...root.querySelectorAll('.hs-objs')];
    // objects a frame has not reached yet stay hidden: [element, the value that reveals it]
    const late = [...root.querySelectorAll('[data-hs-late]')].map(el => [el, +el.dataset.hsLate]);
    let pt = [], pc = [], praf = 0, plast = 0, shown = '';
    const targets = u => {
      const v = [clamp((u + ENTER) / (ENTER + A0))];
      for (let f = 1; f < N; f++) v.push(clamp((u - (rest(f) - TRAVEL)) / TRAVEL));
      v.push(clamp((u - rest(N - 1)) / LAST));
      return v;
    };
    const apply = () => {
      const vals = pc.map(p => p.toFixed(4)), key = vals.join();
      if (key === shown) return;
      shown = key;
      for (const h of holders) names.forEach((n, i) => h.style.setProperty(n, vals[i]));
      for (const [el, i] of late) el.style.visibility = pc[i] > 0 ? '' : 'hidden';
      // the camera pulls back: the console shrinks toward the map's query step while it fades
      if (panel && N > 1) { const o = Math.min(1, pc[1] / 0.45); panel.style.opacity = (1 - o * o).toFixed(3); panel.style.transform = o ? `scale(${(1 - 0.62 * o).toFixed(4)})` : ''; }
    };
    function chase(now) {
      praf = 0;
      if (!live) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - plast) / 1000));
      plast = now;
      const k = 1 - Math.exp(-dt / TAU);
      let more = false;
      for (let i = 0; i < pt.length; i++) {
        const d = pt[i] - pc[i];
        if (Math.abs(d) < 0.0015) pc[i] = pt[i]; else { pc[i] += d * k; more = true; }
      }
      apply();
      if (more) praf = requestAnimationFrame(chase);
    }
    function setP(u, snap) {
      pt = targets(u);
      if (snap || !pc.length) { pc = pt.slice(); apply(); if (praf) cancelAnimationFrame(praf); praf = 0; return; }
      if (!praf) { plast = performance.now() - 16; praf = requestAnimationFrame(chase); }
    }
    // chapter 01: where each marked phrase sits relative to its chip at rest (the chip starts there)
    function measure() {
      const movers = [...root.querySelectorAll('[data-hs-from]')];
      if (!movers.length) return;
      root.classList.add('is-measure');
      // offsets are applied inside the zoom and the objects' scale
      const z = (parseFloat(root.style.getPropertyValue('--hs-z')) || 1) * (parseFloat(root.style.getPropertyValue('--hs-oz')) || 1);
      for (const ch of movers) {
        const mk = root.querySelector(ch.dataset.hsFrom);
        if (!mk) continue;
        const a = mk.getBoundingClientRect(), b = ch.getBoundingClientRect();
        ch.style.setProperty('--hs-dx', ((a.left - b.left) / z).toFixed(1) + 'px');
        ch.style.setProperty('--hs-dy', ((a.top + a.height / 2 - b.top - b.height / 2) / z).toFixed(1) + 'px');
      }
      root.classList.remove('is-measure');
    }

    // ---------------------------------------------------------------- the console's clock (as C)
    // m counts story seconds of motion only (holds between live spans are skipped); frame -1 is m = 0
    let cum = [];
    const index = () => { let s = 0; cum = tl.live.map(([a, b]) => { const c = s; s += b - a; return c; }); };
    const M = x => { let r = 0; tl.live.forEach(([a, b], i) => { if (x >= a) r = cum[i] + Math.min(b, x) - a; }); return r; };
    const T = y => {
      for (let i = 0; i < tl.live.length; i++) { const [a, b] = tl.live[i]; if (y <= cum[i] + (b - a) + 1e-9) return a + Math.max(0, y - cum[i]); }
      return tl.live[tl.live.length - 1][1];
    };
    const mEnd = f => (f < 0 ? 0 : M(tl.end[f]));
    const tEnd = f => (f < 0 ? T(0) : tl.end[f]);
    const spanAt = y => { let i = 0; while (i < cum.length - 1 && y > cum[i] + tl.live[i][1] - tl.live[i][0] + 1e-9) i++; return i; };
    let runR = null, runAt = 0, runM = 0, waiting = [];
    function run(r, now) {
      runR = r; runM = m; runAt = now; waiting = [];
      const ms = t * 1000;
      for (const a of anims) {
        a.pause(); a.playbackRate = r || 1; a.currentTime = ms;
        if (!r) continue;
        if (r > 0 ? t < a.hsE : t <= a.hsE) a.play(); else if (r < 0) waiting.push(a);
      }
    }
    function sync() {
      if (!live || !clocked) return;
      const all = panel.getAnimations({ subtree: true }).filter(a => typeof CSSAnimation === 'undefined' || a instanceof CSSAnimation);
      const held = new Set(anims);
      if (!all.some(a => !held.has(a)) && !anims.some(a => a.playState === 'idle')) return;
      anims = [...new Set([...anims.filter(a => a.playState !== 'idle'), ...all])];
      for (const a of anims) a.hsE = a.effect.getComputedTiming().endTime / 1000;
      run(0, 0); runR = null;
      if (m !== mEnd(goal) && !raf) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      raf = 0;
      if (!live) return;
      const g = mEnd(goal), s = goal > 0 ? mEnd(goal - 1) : 0, catching = m < s - 1e-6;
      const r = m < g ? (catching ? rate : Math.max(0.5, (g - s) / (data.dur[goal] || 1))) : m > g ? -rate : 0;
      if (r !== runR) run(r, now);
      else {
        let nm = runM + r * (now - runAt) / 1000;
        nm = r > 0 ? Math.min(catching ? s : g, nm) : Math.max(g, nm);
        const jump = spanAt(nm) !== spanAt(m);
        m = nm; t = m === g ? tEnd(goal) : T(m);
        if (m === g) run(0, now);
        else if (jump) run(r, now);
        else if (waiting.length) waiting = waiting.filter(a => { if (t > a.hsE) return true; a.currentTime = t * 1000; a.play(); return false; });
      }
      if (m !== g) raf = requestAnimationFrame(tick);
      else root.dataset.hsAt = goal;
    }
    function setGoal(f) {
      goal = f;
      if (aim === goal) aim = -1;
      show();
      if (!clocked) { root.dataset.hsAt = goal; return; }
      sync();
      const g = mEnd(goal);
      if (m < g) { const s = goal > 0 ? mEnd(goal - 1) : 0; rate = Math.max(4, (s - m) / CATCH); }
      else rate = Math.max(2, (m - g) / BACK);
      runR = null;
      if (m !== g) { root.dataset.hsAt = 'moving'; if (!raf) raf = requestAnimationFrame(tick); }
      else { if (raf) cancelAnimationFrame(raf); raf = 0; t = tEnd(goal); run(0, 0); root.dataset.hsAt = goal; }
    }

    // ---------------------------------------------------------------- frames, controls
    function show() {
      const k = Math.max(0, goal);
      root.dataset.hsF = goal;   // what the CSS keys the text on
      steps.forEach((s, i) => s.classList.toggle('is-on', i === k));
      dots.forEach((d, i) => {
        d.classList.toggle('is-done', i < goal);
        if (i === k) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      if (prev) prev.setAttribute('aria-disabled', String(k === 0));
      if (next) next.setAttribute('aria-disabled', String(k === N - 1));
      root.classList.toggle('is-end', k === N - 1);
    }
    // the frame for scroll position u: forward once inside a frame's trigger zone, back only past it
    function pick(u) {
      let f = goal;
      if (f < 0 && u >= -ENTER) f = 0;
      while (f >= 0 && f < N - 1 && u >= rest(f + 1) - TZ) f++;
      while (f > 0 && u < rest(f) - TZ - HYST) f--;
      if (f === 0 && u < -ENTER - HYST) f = -1;
      return f;
    }
    function update() {
      queued = 0;
      if (!live) return;
      const r = root.getBoundingClientRect(), u = -r.top / vh;
      root.classList.toggle('is-off', r.bottom <= 0 || r.top >= vh);
      if (fill) fill.style.transform = `scaleX(${Math.max(0, Math.min(1, u / total)).toFixed(4)})`;
      flag(pinOn, document.body, 'hs-pinned', root, r.top <= 1 && r.bottom >= vh - 1);
      setP(u);
      const f = pick(u);
      if (f !== goal) setGoal(f);
    }
    const kick = () => { if (live && !queued) queued = requestAnimationFrame(update); };
    function jump(f) {
      if (!live || f < 0 || f >= N) return;
      aim = f;
      const top = scrollY + root.getBoundingClientRect().top + rest(f) * vh;
      scrollTo({ top: Math.round(top), behavior: 'smooth' });
    }
    const from = () => (aim >= 0 ? aim : Math.max(0, goal));
    if (prev) prev.addEventListener('click', () => jump(from() - 1));
    if (next) next.addEventListener('click', () => jump(from() + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => jump(i)));
    const drop = () => { aim = -1; };
    addEventListener('scrollend', drop);
    addEventListener('wheel', drop, { passive: true });
    addEventListener('touchstart', drop, { passive: true });

    // ---------------------------------------------------------------- on / off
    function off() {
      live = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (queued) cancelAnimationFrame(queued); queued = 0;
      if (praf) cancelAnimationFrame(praf); praf = 0;
      pc = []; shown = '';
      for (const h of holders) names.forEach(n => h.style.removeProperty(n));
      for (const [el] of late) el.style.visibility = '';
      if (panel) { panel.style.opacity = ''; panel.style.transform = ''; }
      root.classList.remove('is-live', 'is-playing', 'is-end', 'is-tight');
      root.style.height = '';
      ['--hs-feed', '--hs-trim', '--hs-objh', '--hs-z', '--hs-oz'].forEach(p => root.style.removeProperty(p));
      steps.forEach(s => s.classList.remove('is-on'));
      anims = [];
      flag(pinOn, document.body, 'hs-pinned', root, false);
      delete root.dataset.hsAt; delete root.dataset.hsF;
      void root.offsetWidth;
    }
    // the stage must fit the screen: the feed (or the objects' area) gives way, then the words take a smaller
    // size (is-tight), then the console zooms out (to 0.7), before the chapter stays a list
    function squeeze(room) {
      ['--hs-feed', '--hs-objh'].forEach(p => root.style.removeProperty(p));
      let over = frame.offsetHeight - room;
      const feed = panel && panel.querySelector('.c2-f');
      if (over > 0 && feed) {
        root.style.setProperty('--hs-feed', Math.max(MINFEED, Math.floor(feed.offsetHeight - over)) + 'px');
        over = frame.offsetHeight - room;
      } else if (over > 0 && !panel) {
        root.style.setProperty('--hs-objh', Math.max(MINOBJ, Math.floor(objs.offsetHeight - over)) + 'px');
        over = frame.offsetHeight - room;
      }
      return over;
    }
    function fit() {
      const cs = getComputedStyle(stage);
      const room = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      root.classList.remove('is-tight'); ['--hs-z', '--hs-oz'].forEach(p => root.style.removeProperty(p));
      let over = squeeze(room);
      if (over > 0) { root.classList.add('is-tight'); over = squeeze(room); }
      const box = stage.querySelector('.hs-console');
      if (over > 0 && box) {
        const h = box.offsetHeight;
        root.style.setProperty('--hs-z', Math.max(0.7, (h - over) / h).toFixed(3));
        over = frame.offsetHeight - room;
      }
      // an object taller than its area is scaled to fit it, not spilled over the words
      if (!panel) {
        const need = Math.max(...[...objs.children].map(k => k.offsetHeight));
        if (need > objs.clientHeight) root.style.setProperty('--hs-oz', Math.max(0.62, objs.clientHeight / need).toFixed(3));
      }
      root.style.setProperty('--hs-trim', Math.max(0, Math.floor(-over / 2)) + 'px');
      return over <= 0;
    }
    function on() {
      // a reader already past the story must not move (scroll anchoring may have absorbed the growth)
      const card = root.closest('article') || document.body, ref = card.getBoundingClientRect().bottom, above = root.getBoundingClientRect().bottom <= 0;
      start();
      if (above) { const d = card.getBoundingClientRect().bottom - ref; if (Math.abs(d) > 1) scrollBy(0, d); }
      update();
    }
    function start() {
      off();
      sizeKey = innerWidth + 'x' + Math.round(svh());
      if (!moving()) return;
      root.classList.add('is-live', 'is-playing');
      vh = stage.offsetHeight;
      if (!vh || !fit()) return off();
      sideH = list.offsetHeight;
      total = rest(N - 1) + LAST;
      root.style.height = Math.round(vh + total * vh) + 'px';
      live = true;
      if (clocked) { tl = panel.clientWidth <= data.narrow ? data.p : data.d; index(); }
      // arrive on the frame for wherever the page is, already at rest there
      goal = -1; goal = pick(uNow());
      if (clocked) { m = mEnd(goal); t = tEnd(goal); runR = null; sync(); run(0, 0); }
      root.classList.add('is-jump');   // no transitions on arrival
      measure();
      setP(uNow(), true);
      show(); root.dataset.hsAt = goal;
      void root.offsetWidth;
      requestAnimationFrame(() => root.classList.remove('is-jump'));
    }
    let fitQueued = 0;
    const refit = () => {
      if (fitQueued) return;
      fitQueued = requestAnimationFrame(() => {
        fitQueued = 0;
        const key = innerWidth + 'x' + Math.round(svh());
        if (key !== sizeKey || (live && Math.abs(list.offsetHeight - sideH) > 1)) on();
      });
    };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', refit);
    if (window.ResizeObserver) new ResizeObserver(refit).observe(list);
    onMotion(on);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) measure(); });
    if (clocked) new MutationObserver(() => { if (live && !anims.length) requestAnimationFrame(sync); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    on();
  });
})();
