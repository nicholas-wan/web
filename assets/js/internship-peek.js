/* Internship peeks: hover or focus previews, click pins, Escape or an outside
   click closes. The desktop card lets the pointer through (so the next chip
   stays hoverable under it), and the preview stays open while the pointer is
   over the chip row or the card. On phones and touch (the stylesheet's inline
   branch) a tap opens the card in place. Scenes replay every 10s while on
   screen, with a short fade before each restart; reduced motion holds the
   final frame. */
(() => {
  const roots = [...document.querySelectorAll('.internship-demo-peek')];
  if (!roots.length) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(max-width: 736px), (hover: none)');
  const REPLAY = 10000, FADE = 240, GRACE = 130;
  // Phones keep the cards display:none until a tap, which would leave the
  // Shopee listing's faces unrequested until its scene had already started.
  if (document.fonts) ['400', '500', '700'].forEach(w => document.fonts.load(`${w} 11px Figtree`));
  let active = null, pinned = null, hovered = null, leaveTimer = null, pointer = { x: -1, y: -1 };

  const card = r => r.querySelector('.internship-demo-card');
  const chip = r => r.querySelector('button');
  const inside = (el, x, y) => { const b = el.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; };
  const onScreen = el => { const b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; };
  const inPeek = el => !!(el && el.closest && el.closest('.internship-demo-peek'));

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
  function close(r) {
    if (!r) return;
    chip(r).setAttribute('aria-expanded', 'false');
    const c = card(r);
    c.classList.remove('is-open', 'is-playing', 'is-still', 'is-fading');
    c.inert = true;
    clearInterval(r.loop);
    clearTimeout(r.fade);
    if (active === r) active = null;
  }
  function open(r) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
    if (active === r) return;
    close(active);
    active = r;
    const c = card(r);
    c.inert = false;
    c.classList.add('is-open');
    chip(r).setAttribute('aria-expanded', 'true');
    play(r);
    r.loop = setInterval(() => { if (!document.hidden && onScreen(c)) replay(r); }, REPLAY);
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
    r.addEventListener('mouseenter', () => { hovered = r; if (!touch.matches) open(r); });
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
      else { pinned = r; open(r); }
    });
    r.addEventListener('focusout', e => { if (!r.contains(e.relatedTarget) && pinned !== r) close(r); });
  });
  document.addEventListener('mousemove', e => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!active || hovered || touch.matches) return;
    if (inside(card(active), e.clientX, e.clientY)) { clearTimeout(leaveTimer); leaveTimer = null; }
    else if (!leaveTimer) scheduleLeave();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { pinned = null; close(active); } });
  document.addEventListener('pointerdown', e => {
    if (!active || active.contains(e.target)) return;
    // A press on another chip is a swap: its click opens that card. Closing
    // here would collapse an inline card under the finger and move the chip
    // before the tap's click lands.
    if (inPeek(e.target)) return;
    pinned = null;
    close(active);
  });
  motion.addEventListener('change', () => { if (active) play(active); });
  document.addEventListener('visibilitychange', () => {
    if (!active || !active.getAnimations) return;
    active.getAnimations({ subtree: true }).forEach(a => {
      if (document.hidden && a.playState === 'running') a.pause();
      else if (!document.hidden && a.playState === 'paused') a.play();
    });
  });
  // The chip row leaving the viewport closes its card; the top margin keeps
  // a card that still hangs into view open while its chip has scrolled off.
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting && active === e.target) { pinned = null; close(active); }
  }), { rootMargin: '220px 0px 0px 0px' });
  roots.forEach(r => observer.observe(r));
})();
