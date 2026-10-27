/* Internship peeks: hover or focus previews, click pins, Escape or an outside
   click closes. The desktop card lets the pointer through (so the next chip
   stays hoverable under it) and stays open while the pointer is over the
   chips or the card. On phones and touch a tap opens the card in place, open
   while the page scrolls until a chip or Escape closes it. Scenes replay
   every 10s on screen (longer if needed to hold the final frame for 3s),
   fading before each restart; reduced motion holds the final frame. */
(() => {
  const roots = [...document.querySelectorAll('.internship-demo-peek')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(max-width: 736px), (hover: none)');
  const REPLAY = 10000, HOLD = 3000, FADE = 240, GRACE = 130;
  // Phones keep the cards display:none until a tap, which would leave the
  // scenes' faces unrequested until a scene had already started. Warm them
  // once the page has loaded, so they never compete with the text's fonts.
  const warmFonts = () => { if (document.fonts) ['400 11px Figtree', '500 11px Figtree', '700 11px Figtree', 'italic 900 8px "League Mark"', '8px "League Serif"', 'italic 8px "League Serif"'].forEach(f => document.fonts.load(f)); };
  if (document.readyState === 'complete') warmFonts();
  else addEventListener('load', warmFonts, { once: true });
  let active = null, pinned = null, hovered = null, leaveTimer = null, pointer = { x: -1, y: -1 };

  const card = r => r.querySelector('.internship-demo-card');
  const chip = r => r.querySelector('button');
  const inside = (el, x, y) => { const b = el.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; };
  const onScreen = el => { const b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; };
  const inPeek = el => !!(el && el.closest && el.closest('.internship-demo-peek'));
  // Each row's first chip breathes while on screen with none of its charts
  // open (owner, 25 Oct 2026: "keep repeating the pulse ... whenever its closed").
  const breathers = [...new Set(roots.map(r => r.closest('.case-study')))]
    .map(row => roots.find(r => r.closest('.case-study') === row));
  const shown = new Set();
  // All breathing chips share one phase.
  const breathe = () => breathers.forEach(r => {
    const b = chip(r), on = shown.has(r) && !(active && active.closest('.case-study') === r.closest('.case-study'));
    if (on !== b.classList.contains('is-breathing')) b.style.animationDelay = on ? `${-(performance.now() % 2600)}ms` : '';
    b.classList.toggle('is-breathing', on);
  });
  if (breathers.length) {
    const io = new IntersectionObserver(es => { es.forEach(e => { const r = e.target.closest('.internship-demo-peek'); if (e.isIntersecting) shown.add(r); else shown.delete(r); }); breathe(); }, { threshold: 0.5 });
    breathers.forEach(r => io.observe(chip(r)));
  }

  function play(r) {
    const c = card(r);
    c.classList.remove('is-playing', 'is-still', 'is-fading');
    void c.offsetWidth;
    c.classList.add(motion.matches ? 'is-still' : 'is-playing');
  }
  function replay(r) {
    if (motion.matches) return;
    card(r).classList.add('is-fading');
    clearTimeout(r.fade);
    r.fade = setTimeout(() => { if (active === r) play(r); }, FADE);
  }
  // Smart zoom (owner, 25 Oct 2026), shared with anomaly-peek.js as
  // window.peekZoom. grow(): a card grows out of its chip (CSS, --grow-x); an
  // inline one unfolds the space below, padding and all; a swap in one slot
  // (`from`, the old height) neither zooms again nor fades in blank. shut(): a
  // swap goes at once; an inline card folds away. frame(spans): after a click
  // or tap the page centres the first [top, bottom] span (viewport px) that
  // fits, else puts the last one's top near the top: a 700-1000ms cosine ease
  // (touch: the browser's smooth scroll), stopped by any scroll, touch or key.
  // Hovers wait (lock) until the mouse moves: the ease slides chips under it.
  const layoutTop = el => { const p = el.offsetParent; return (p ? p.getBoundingClientRect().top + p.clientTop : 0) + el.offsetTop; };
  const layoutLeft = el => { const p = el.offsetParent; return (p ? p.getBoundingClientRect().left + p.clientLeft : 0) + el.offsetLeft; };
  const box = (el, gap) => { const cs = getComputedStyle(el); return [
    { paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', marginTop: `${-gap}px` },
    { paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, borderTopWidth: cs.borderTopWidth, borderBottomWidth: cs.borderBottomWidth, marginTop: cs.marginTop }]; };
  const zoom = window.peekZoom = { lock: false, stop() {}, top: layoutTop,
    grow(el, chipEl, inline, from, gap = 0) {
      if (from) {
        el.style.animation = 'none';
        if (!inline) { el.style.transform = 'none'; el.style.transition = 'none'; setTimeout(() => { el.style.transform = el.style.transition = ''; }, 160); }
      }
      const b = chipEl.getBoundingClientRect(), h = el.offsetHeight;
      el.style.setProperty('--grow-x', `${Math.round(b.left + b.width / 2 - layoutLeft(el))}px`);
      if (!inline || motion.matches || !el.animate) return { h };
      const [flat, rest] = from ? [{}, {}] : box(el, gap);
      el.style.overflow = 'hidden';
      const a = el.animate([{ height: `${from}px`, ...flat }, { height: `${h}px`, ...rest }], { duration: 500, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
      a.onfinish = () => { el.style.overflow = ''; };
      return { h, a };
    },
    // done(late): late when it runs after the fold, by which time the card
    // may have been opened again.
    shut(el, swap, inline, done, gap = 0) {
      if (swap) { el.style.transition = 'none'; done(); requestAnimationFrame(() => { el.style.transition = ''; }); }
      else if (inline && !motion.matches && el.animate && el.classList.contains('is-open')) {
        const [flat, rest] = box(el, gap);
        el.style.overflow = 'hidden';
        const a = el.animate([{ height: `${el.offsetHeight}px`, opacity: 1, ...rest }, { height: '0px', opacity: 0, ...flat }], { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
        a.onfinish = () => done(true);
        return a;
      } else done();
    },
    frame(spans, native) {
      zoom.stop();
      const vv = window.visualViewport;
      if (vv && vv.scale > 1.05) return;
      const vh = vv ? vv.height : innerHeight, fit = spans.find(([t, b]) => b - t <= vh - 8);
      const by = Math.round(fit ? (fit[0] + fit[1]) / 2 - vh / 2 : spans[spans.length - 1][0] - 16);
      if (Math.abs(by) < 8) return;
      const y = scrollY + by, stops = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
      if (motion.matches) { scrollTo(0, y); return; }
      let raf = 0, again = 0, end = 0;
      const off = () => { cancelAnimationFrame(raf); clearTimeout(again); clearTimeout(end); stops.forEach(e => removeEventListener(e, off)); if (zoom.stop === off) { zoom.stop = () => {}; if (native) scrollTo(0, scrollY); } };
      zoom.stop = off;
      stops.forEach(e => addEventListener(e, off, { passive: true }));
      if (native) {
        // Off the main thread, so it stays smooth while the card grows (a
        // scripted ease stuttered on phones); retried once it has grown.
        scrollTo({ top: y, behavior: 'smooth' });
        if (y > document.documentElement.scrollHeight - innerHeight) again = setTimeout(() => scrollTo({ top: y, behavior: 'smooth' }), 520);
        end = setTimeout(off, 1600);
        return;
      }
      zoom.lock = true;
      const y0 = scrollY, dur = Math.min(1000, Math.max(700, 650 + Math.abs(by)));
      let t0 = null, last = y0;
      const step = t => {
        if (t0 === null) t0 = t;
        if (Math.abs(scrollY - last) > 2) return off();
        const p = Math.min(1, (t - t0) / dur);
        scrollTo(0, Math.round(y0 + by * (1 - Math.cos(Math.PI * p)) / 2));
        last = scrollY; // a page still growing may stop it short
        if (p < 1) raf = requestAnimationFrame(step); else off();
      };
      raf = requestAnimationFrame(step);
    } };
  let at = '';
  addEventListener('mousemove', e => { const k = e.clientX + ' ' + e.clientY; if (k !== at) { at = k; zoom.lock = false; } }, { passive: true });
  if (!roots.length) return;

  // `swap`: another card in the same row is opening in its place.
  function close(r, swap) {
    if (!r) return;
    if (r === active) zoom.stop();
    chip(r).setAttribute('aria-expanded', 'false');
    const c = card(r);
    if (r.grow) { r.grow.cancel(); r.grow = null; }
    r.grow = zoom.shut(c, swap, touch.matches, late => {
      if (late && active === r) return;
      c.classList.remove('is-open', 'is-playing', 'is-still', 'is-fading');
      c.style.overflow = c.style.animation = '';
    });
    c.inert = true;
    clearInterval(r.loop);
    clearTimeout(r.fade);
    if (active === r) active = null;
    breathe();
  }
  // Frame the whole entry (owner, 25 Oct 2026: "bring the whole league
  // section in the center of the screen"), else the call to action, chips
  // and card, else the card, measured at the card's final height.
  function reveal(r) {
    const c = card(r), grow = (r.finalHeight || c.offsetHeight) - c.offsetHeight, cardBottom = layoutTop(c) + c.offsetHeight + grow;
    const art = r.closest('.case-study'), hint = art && art.querySelector('.internship-demo-hint');
    const a = (art || chip(r)).getBoundingClientRect();
    const top = c.getBoundingClientRect().top, bottom = Math.max(cardBottom, chip(r).getBoundingClientRect().bottom);
    zoom.frame([[a.top, Math.max(a.bottom + grow, cardBottom)], [Math.min((hint || chip(r)).getBoundingClientRect().top, top), bottom], [top, cardBottom]], touch.matches);
  }
  function open(r) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
    if (active === r) return;
    // Swapping between cards in one shared slot (the League row) grows the
    // new card from the old one's height, so the row below doesn't jump.
    const swapFrom = active && active.closest('.case-study') === r.closest('.case-study') ? card(active).offsetHeight : 0;
    close(active, swapFrom > 0 || touch.matches);
    active = r;
    const c = card(r);
    if (r.grow) { r.grow.cancel(); r.grow = null; }
    c.inert = false;
    c.classList.add('is-open');
    const g = zoom.grow(c, chip(r), touch.matches, swapFrom);
    r.finalHeight = g.h;
    r.grow = g.a;
    chip(r).setAttribute('aria-expanded', 'true');
    breathe();
    play(r);
    loop(r);
  }
  // A scene longer than REPLAY allows still holds its final frame for HOLD.
  function loop(r) {
    const c = card(r), end = Math.max(0, ...c.getAnimations({ subtree: true }).map(a => a.effect.getComputedTiming().endTime).filter(Number.isFinite));
    clearInterval(r.loop);
    r.loop = setInterval(() => { if (!document.hidden && onScreen(c)) replay(r); }, Math.max(REPLAY, end + HOLD + FADE));
  }
  // The pointer has left the chip row and the card: after a short grace a
  // pinned card returns, otherwise the preview closes.
  function scheduleLeave() {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      leaveTimer = null;
      if (hovered) return;
      if (pinned) { open(pinned); return; }
      if (active && !inside(card(active), pointer.x, pointer.y)) close(active);
    }, GRACE);
  }

  roots.forEach(r => {
    const b = chip(r);
    r.addEventListener('mouseenter', () => { if (zoom.lock) return; hovered = r; if (!touch.matches) open(r); });
    r.addEventListener('mouseleave', () => { if (hovered === r) hovered = null; if (!touch.matches) scheduleLeave(); });
    b.addEventListener('focus', () => {
      if (touch.matches) return;
      // Keyboard focus moves on for good: another chip's pin is dropped, so
      // it cannot pop back open later from a stray hover.
      if (pinned && pinned !== r) pinned = null;
      open(r);
    });
    b.addEventListener('click', () => {
      if (pinned === r) { pinned = null; close(r); }
      else { pinned = r; open(r); requestAnimationFrame(() => { if (active === r) reveal(r); }); }
    });
    r.addEventListener('focusout', e => { if (!r.contains(e.relatedTarget) && pinned !== r) close(r); });
  });
  document.addEventListener('mousemove', e => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!active || hovered || touch.matches) return;
    if (inside(card(active), e.clientX, e.clientY)) { clearTimeout(leaveTimer); leaveTimer = null; }
    else if (!leaveTimer) scheduleLeave();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { pinned = null; if (active) close(active); } });
  // Outside presses close a floating (desktop) card. Inline cards (phones,
  // touch) close only from a chip or Escape: a finger's press outside may be
  // the start of a scroll, and closing then collapsed the card mid-read.
  document.addEventListener('pointerdown', e => {
    if (!active || touch.matches || e.pointerType !== 'mouse' || active.contains(e.target)) return;
    // A press on another chip is a swap: its click opens that card.
    if (inPeek(e.target)) return;
    pinned = null;
    close(active);
  });
  motion.addEventListener('change', () => { if (active) { play(active); loop(active); } });
  document.addEventListener('visibilitychange', () => {
    if (!active || !active.getAnimations) return;
    active.getAnimations({ subtree: true }).forEach(a => {
      if (document.hidden && a.playState === 'running') a.pause();
      else if (!document.hidden && a.playState === 'paused') a.play();
    });
  });
  // A floating card closes once its chip is well off screen (it watches the
  // chip: a peek in a shared row has no box). Inline cards stay open while the
  // page scrolls (owner: phone charts must not close on scrolling).
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    const r = e.target.closest('.internship-demo-peek');
    if (!e.isIntersecting && active === r && !touch.matches) { pinned = null; close(active); }
  }), { rootMargin: '220px 0px 0px 0px' });
  roots.forEach(r => observer.observe(chip(r)));
})();
