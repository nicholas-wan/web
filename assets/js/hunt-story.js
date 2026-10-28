/* The Agentic AI story on Experience (hs-; README "Agentic AI story"): three pinned chapters in #agentic-ai,
   injected on demand by the inline loader after the story (tools/scenes/agentic-story/build.cjs). A frame is
   a resting point; its big move is scrubbed by the scroll (27 Oct 2026, lab/scroll-speed-review.md): three
   0..1 values go on each chapter's .hs-objs as custom properties (not the scene root: that restyles the
   console's 300 nodes a frame), --hs-p0 (frame 0's arrival), --hs-pN (frame N's arrival over TRAVEL screens)
   and --hs-pe (the exit); the CSS drives the moves from them, the console's fade is set inline, and the
   values chase the scroll (TAU) since wheels scroll in notches. Then nothing changes for the dwell. Chapter 01
   measures each data-hs-from element's offset from its source (--hs-dx/--hs-dy) so chips and facts start where
   they are pulled from; objects a frame has not reached (data-hs-late="N") stay visibility:hidden. The engineering chapter scrubs the console's paused CSS
   animations with the same scroll clock. Native scrolling is never touched (no snapping, no wheel handling); the buttons
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
  const MINFEED = 110, MINOBJ = 230;
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
    const consoleFeed = panel && panel.querySelector('.c2-f');
    const steps = [...root.querySelectorAll('.hs-step')], dots = [...root.querySelectorAll('.hs-dot')];
    const prev = root.querySelector('.hs-prev'), next = root.querySelector('.hs-next'), fill = root.querySelector('.hs-fill');
    const N = steps.length;
    const clocked = !!(panel && data.d);
    if (!stage || !frame || !list || !(panel || objs) || N < 2 || (clocked && !canClock)) return;

    let live = false, tl = data.d, anims = [], vh = 0, total = 0;
    let goal = -1, queued = 0, aim = -1, sizeKey = '', sideH = 0;
    const hold = f => (data.hold && data.hold[f]) || GAP;   // the dwell after frame f's resting point
    const rest = f => { let u = 0; for (let i = 0; i < f; i++) u += hold(i); return u; };
    const openingRest = () => clocked ? Math.max(A0, rest(1) - TRAVEL - 0.12) : A0;
    const uNow = () => -root.getBoundingClientRect().top / vh;

    // ---------------------------------------------------------------- the scrubbed progress values
    const names = []; for (let f = 0; f < N; f++) names.push('--hs-p' + f); names.push('--hs-pe');
    if (clocked) names.push('--hs-run');
    const holders = [...root.querySelectorAll('.hs-objs')];
    // objects a frame has not reached yet stay hidden: [element, the value that reveals it]
    const late = [...root.querySelectorAll('[data-hs-late]')].map(el => [el, +el.dataset.hsLate]);
    let pt = [], pc = [], praf = 0, plast = 0, shown = '';
    const targets = u => {
      const v = [clamp((u + ENTER) / (ENTER + A0))];
      for (let f = 1; f < N; f++) v.push(clamp((u - (rest(f) - TRAVEL)) / TRAVEL));
      v.push(clamp((u - rest(N - 1)) / LAST));
      if (clocked) v.push(clamp((u + ENTER) / (ENTER + openingRest())));
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
      if (consoleFeed) consoleFeed.style.opacity = (1 - clamp((pc[N + 1] - 0.72) / 0.16)).toFixed(3);
      if (clocked) renderConsole();
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
        // Match the CSS anchor. A phone hypothesis grows from its top edge, not its centre;
        // centring a tall card on a short lane sent its entrance through the paragraph above.
        const origin = getComputedStyle(ch).transformOrigin.split(' ').map(parseFloat);
        const rx = (origin[0] || 0) / (ch.offsetWidth || 1), ry = (origin[1] || 0) / (ch.offsetHeight || 1);
        ch.style.setProperty('--hs-dx', ((a.left + a.width * rx - b.left - b.width * rx) / z).toFixed(1) + 'px');
        ch.style.setProperty('--hs-dy', ((a.top + a.height * ry - b.top - b.height * ry) / z).toFixed(1) + 'px');
      }
      root.classList.remove('is-measure');
    }

    // The console shares the scroll clock with its surrounding objects. Its long pauses are
    // removed, but every meaningful beat remains reversible and ends before the map arrives.
    let cum = [], end = 0;
    function index() {
      let sum = 0;
      cum = tl.live.map(([a, b]) => { const start = sum; sum += b - a; return start; });
      end = tl.live.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, tl.end[0]) - a), 0);
    }
    function renderConsole() {
      if (!live || !clocked || !anims.length) return;
      const p = pc[N + 1] || 0, distance = p * end;
      let time = tl.end[0];
      if (p < 1) for (let i = 0; i < tl.live.length; i++) {
        const [a, b] = tl.live[i];
        if (distance <= cum[i] + b - a) { time = a + Math.max(0, distance - cum[i]); break; }
      }
      for (const a of anims) {
        const nextTime = Math.min(time * 1000, a.hsEnd);
        // Completed effects need no repeated seek while another beat or the map moves.
        if (a.hsTime !== nextTime) { a.currentTime = nextTime; a.hsTime = nextTime; }
      }
      const at = goal < 0 ? '-1' : goal > 0 || p >= 0.999 ? String(goal) : 'moving';
      if (root.dataset.hsAt !== at) root.dataset.hsAt = at;
    }
    function sync() {
      if (!live || !clocked) return;
      anims = panel.getAnimations({ subtree: true }).filter(a => typeof CSSAnimation === 'undefined' || a instanceof CSSAnimation);
      for (const a of anims) { a.pause(); a.hsEnd = a.effect.getComputedTiming().endTime; a.hsTime = null; }
      renderConsole();
    }
    function setGoal(f) {
      goal = f;
      show();
      if (clocked) renderConsole(); else root.dataset.hsAt = goal;
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
      const status = root.querySelector('.hs-status');
      if (status) status.textContent = `Step ${f + 1} of ${N}: ${steps[f].querySelector('.hs-h').textContent}`;
      const top = scrollY + root.getBoundingClientRect().top + (f === 0 ? openingRest() : rest(f)) * vh;
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
      if (queued) cancelAnimationFrame(queued); queued = 0;
      if (praf) cancelAnimationFrame(praf); praf = 0;
      pc = []; shown = '';
      for (const h of holders) names.forEach(n => h.style.removeProperty(n));
      for (const [el] of late) el.style.visibility = '';
      if (panel) { panel.style.opacity = ''; panel.style.transform = ''; }
      if (consoleFeed) consoleFeed.style.opacity = '';
      root.classList.remove('is-live', 'is-playing', 'is-end', 'is-tight');
      root.style.height = '';
      ['--hs-feed', '--hs-trim', '--hs-objh', '--hs-z', '--hs-oz', '--hs-lanes-h', '--hs-env-h'].forEach(p => root.style.removeProperty(p));
      steps.forEach(s => s.classList.remove('is-on'));
      anims = [];
      flag(pinOn, document.body, 'hs-pinned', root, false);
      delete root.dataset.hsAt; delete root.dataset.hsF;
      void root.offsetWidth;
    }
    // Fit the complete composition at readable sizes; short windows retain the static story.
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
      const compose = () => {
        let over = squeeze(room);
        if (!panel) {
          let need = Math.max(...[...objs.children].map(k => k.offsetHeight));
          // Measure the whole composition before choosing a smaller prose layout.
          if (root.clientWidth <= 560 && root.classList.contains('hs-scene--product')) {
            const lanes = objs.querySelector('.hs-lanes'), env = objs.querySelector('.hs-env');
            root.style.setProperty('--hs-lanes-h', lanes.offsetHeight + 'px');
            root.style.setProperty('--hs-env-h', env.offsetHeight + 'px');
            const src = objs.querySelector('.hs-src');
            const sourceHeight = [...src.children].reduce((h, el) => h + el.offsetHeight, 0) + 12;
            need = Math.max(need, lanes.offsetHeight + env.offsetHeight + 20, sourceHeight);
          }
          if (need > objs.clientHeight) {
            root.style.setProperty('--hs-objh', Math.ceil(need) + 'px');
            over = frame.offsetHeight - room;
          }
        }
        return over;
      };
      let over = compose();
      if (over > 0) { root.classList.add('is-tight'); over = compose(); }
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
      if (clocked) sync();
      root.classList.add('is-jump');   // no transitions on arrival
      measure();
      setP(uNow(), true);
      show(); if (clocked) renderConsole(); else root.dataset.hsAt = goal;
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(on);
    if (clocked) new MutationObserver(() => { if (live && !anims.length) requestAnimationFrame(sync); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    on();
  });
})();
