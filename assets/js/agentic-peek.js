/* The Agentic AI console peek (README "Agentic AI console peek"), loaded by internship-peek.js on the
   "Hunt from a report" chip's first open, outside the Work page's 80 KB ceiling. Desktop docks the card inline
   on a click (a popover this size covered the page; hovers elsewhere leave it open, Escape or the chip closes
   it); phones open it as internship-peek.js opens any card. The run plays once, about 21 s, and rests on Done
   with its tally. One button pauses, resumes and, at the end, replays it; the run also holds while the card is
   mostly off screen or the tab is hidden, and picks up where it was. The last progress segment finishing marks
   the end. Reduced motion shows the finished run (is-still) with no button. */
(() => {
  const r = document.querySelector('.internship-demo-peek[data-company="agentic"]');
  const c = r && r.querySelector('.internship-demo-card'), b = r && r.querySelector('.internship-demo-peek__chip');
  const ctl = c && c.querySelector('.hsk-ctl'), zoom = window.peekZoom;
  if (!ctl || !zoom || window.agenticPeek) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const play = () => { c.classList.remove('is-playing', 'is-still'); void c.offsetWidth; c.classList.add(motion.matches ? 'is-still' : 'is-playing'); };

  // docking (desktop): open inline under the chip, then frame the card the way the other peeks do
  let docked = false;
  function reveal() {
    const grow = (r.finalHeight || c.offsetHeight) - c.offsetHeight, cardBottom = zoom.top(c) + c.offsetHeight + grow;
    const art = r.closest('.case-study'), hint = art && art.querySelector('.internship-demo-hint');
    const a = (art || b).getBoundingClientRect(), top = c.getBoundingClientRect().top, bottom = Math.max(cardBottom, b.getBoundingClientRect().bottom);
    zoom.frame([[a.top, Math.max(a.bottom + grow, cardBottom)], [Math.min((hint || b).getBoundingClientRect().top, top), bottom], [top, cardBottom]], false);
  }
  function toggle() {
    docked = !docked;
    r.dataset.docked = docked ? '1' : '';
    b.setAttribute('aria-expanded', docked);
    b.classList.remove('is-breathing');
    c.inert = !docked;
    if (r.grow) r.grow.cancel();
    if (docked) {
      c.classList.add('is-open');
      const g = zoom.grow(c, b, true, 0);
      r.finalHeight = g.h; r.grow = g.a;
      play();
      requestAnimationFrame(() => { if (docked) reveal(); });
    } else {
      if (c.contains(document.activeElement)) b.focus();   // Escape or the button: focus returns to the chip, not an inert card
      r.grow = zoom.shut(c, false, true, late => { if (!late || !docked) { c.classList.remove('is-open', 'is-playing', 'is-still'); c.style.overflow = ''; } });
    }
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && docked) toggle(); });
  motion.addEventListener('change', () => { if (docked) play(); });

  // the run's states
  const holds = new Set(), ended = () => c.classList.contains('is-ended');
  const runs = () => c.getAnimations({ subtree: true }).filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.hunt-panel'));
  const sync = () => {
    const stop = holds.size > 0 && !ended();
    runs().forEach(a => { if (stop && a.playState === 'running') a.pause(); else if (!stop && a.playState === 'paused') a.play(); });
    c.classList.toggle('is-paused', holds.has('user') && !ended());
    const [t, l] = ended() ? ['Replay', 'Replay the hunt'] : holds.has('user') ? ['Resume', 'Resume the hunt'] : ['Pause', 'Pause the hunt'];
    ctl.textContent = t; ctl.setAttribute('aria-label', l);
  };
  const hold = (k, on) => { if (on) holds.add(k); else holds.delete(k); sync(); };
  let run = 0;
  // each fresh run clears the last one's pause and end, then watches its last segment
  const start = () => {
    const id = ++run;
    holds.delete('user'); c.classList.remove('is-ended', 'is-paused');
    requestAnimationFrame(() => {
      const last = c.querySelector('.hsk-prog .hsk-seg:last-child b'), a = last && last.getAnimations()[0];
      if (a) a.finished.then(() => { if (id === run) { c.classList.add('is-ended'); sync(); } }, () => {});
      sync();
    });
  };
  new MutationObserver(ms => {
    if (c.classList.contains('is-playing') && ms.some(m => !(m.oldValue || '').includes('is-playing'))) start();
  }).observe(c, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  ctl.addEventListener('click', () => { if (ended()) play(); else hold('user', !holds.has('user')); });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  new IntersectionObserver(([e]) => hold('away', !e.isIntersecting), { threshold: 0.2 }).observe(c);

  window.agenticPeek = { toggle };
  if (c.classList.contains('is-playing')) start();   // a phone tap that loaded this script is already playing
})();
