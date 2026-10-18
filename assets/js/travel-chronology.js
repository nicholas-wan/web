/* Progressive enhancement for the static travel chronology. */
(() => {
  'use strict';
  const section = document.querySelector('.journal-chronology');
  const grid = document.querySelector('.travel-grid');
  const heading = document.querySelector('.travel-archive-heading');
  if (!section || !grid || !heading) return;
  const track = section.querySelector('.chronology-track');
  const scroller = section.querySelector('.chronology-scroll');
  const links = [...track.querySelectorAll('.chronology-trip')];
  const detail = section.querySelector('.chronology-detail');
  const controls = section.querySelector('.chronology-controls');
  const buttons = controls.querySelectorAll('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const month = value => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;
  const weights = links.slice(1).map((link, i) => 1 + Math.sqrt(Math.max(0, month(link.dataset.start) - month(links[i].dataset.start))));
  const sum = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  track.style.minWidth = Math.max(1000, links.length * 100) + 'px';
  links.forEach((link, i) => {
    if (i) cumulative += weights[i - 1];
    const fraction = sum ? cumulative / sum : .5;
    link.style.left = 'calc(' + fraction * 100 + '% + ' + (56 - 112 * fraction) + 'px)';
    const destination = link.getAttribute('href');
    const cardLink = [...grid.querySelectorAll('a.travel-card__image[href]')].find(a => a.getAttribute('href') === destination);
    const card = cardLink && cardLink.closest('.travel-card');
    if (!card) return;
    const name = link.querySelector('.chronology-label').textContent;
    const dates = card.querySelector('.date').textContent.trim();
    link.setAttribute('aria-label', name + ', ' + dates + ', ' + link.dataset.countries + '; find journal');
    const describe = () => { detail.textContent = name + ' · ' + dates + ' · ' + link.dataset.countries; };
    link.addEventListener('pointerenter', describe);
    link.addEventListener('focus', () => {
      describe();
      // Reveal the label, which extends beyond the dot's anchor box.
      const label = link.querySelector('.chronology-name').getBoundingClientRect();
      const bounds = scroller.getBoundingClientRect();
      if (label.left < bounds.left + 4) scroller.scrollLeft += label.left - bounds.left - 4;
      else if (label.right > bounds.right - 4) scroller.scrollLeft += label.right - bounds.right + 4;
    });
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      describe();
      grid.querySelectorAll('.is-timeline-selected').forEach(c => c.classList.remove('is-timeline-selected'));
      card.classList.add('is-timeline-selected');
      cardLink.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY + card.getBoundingClientRect().top - 30, behavior: reduced.matches ? 'instant' : 'smooth' });
    });
  });
  const updateControls = () => {
    buttons[0].disabled = scroller.scrollLeft <= 1;
    buttons[1].disabled = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    controls.hidden = scroller.scrollWidth <= scroller.clientWidth + 2;
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => scroller.scrollBy({ left: (i ? 1 : -1) * scroller.clientWidth * .8, behavior: reduced.matches ? 'instant' : 'smooth' })));
  scroller.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(scroller);
  updateControls();
  const syncHidden = () => { section.hidden = heading.hidden; };
  new MutationObserver(syncHidden).observe(heading, { attributes: true, attributeFilter: ['hidden'] });
  syncHidden();
  let inView = false;
  const pause = () => section.classList.toggle('is-paused', !inView || document.hidden);
  document.addEventListener('visibilitychange', pause);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView && !reduced.matches) section.classList.add('is-revealed');
    pause();
  }, { threshold: .2 }).observe(section);
  pause();
})();

/* Destination scenes: sequential visible tour, with manual interaction priority. */
(() => {
  'use strict';
  const section = document.querySelector('.journal-chronology');
  if (!section) return;
  const track = section.querySelector('.chronology-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [];
  const pulse = document.createElement('span');
  pulse.className = 'chronology-pulse';
  pulse.setAttribute('aria-hidden', 'true');
  pulse.hidden = true;
  track.append(pulse);
  let active = null, hovered = null, inView = false;
  let guideTimer, guideAnimation, guideRun = 0;
  const stop = entry => {
    if (!entry) return;
    clearTimeout(entry.timer);
    clearTimeout(entry.intent);
    entry.run++;
    entry.art.classList.remove('is-active');
    entry.art.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    if (active === entry) active = null;
  };
  const stopGuide = () => {
    clearTimeout(guideTimer);
    guideTimer = null;
    guideRun++;
    if (guideAnimation) guideAnimation.cancel();
    guideAnimation = null;
    pulse.hidden = true;
    if (active && active.automatic) stop(active);
  };
  const stopAll = () => { stopGuide(); entries.forEach(stop); };
  const canGuide = () => inView && !section.hidden && !document.hidden && !reduced.matches && !hovered && !section.contains(document.activeElement);
  const play = (entry, automatic = false) => {
    entries.forEach(item => clearTimeout(item.intent));
    if (!entry.visible || document.hidden || reduced.matches || section.hidden) return false;
    if (active && active !== entry) stop(active);
    stop(entry);
    active = entry;
    entry.automatic = automatic;
    const run = entry.run;
    entry.art.classList.add('is-active');
    entry.timer = setTimeout(() => {
      if (entry.run === run) stop(entry);
    }, entry.duration + 80);
    return true;
  };
  const position = entry => {
    const dot = entry.trip.querySelector('.chronology-dot').getBoundingClientRect();
    return dot.left + dot.width / 2 - track.getBoundingClientRect().left;
  };
  const schedule = delay => {
    clearTimeout(guideTimer);
    if (canGuide()) guideTimer = setTimeout(() => { guideTimer = null; startSequence(); }, delay);
  };
  function startSequence() {
    if (!canGuide()) return;
    const visible = entries.filter(entry => entry.visible);
    if (!visible.length) return;
    const run = ++guideRun;
    let previous = position(visible[0]);
    const step = index => {
      if (run !== guideRun || !canGuide()) return;
      if (index === visible.length) { pulse.hidden = true; schedule(2000); return; }
      const entry = visible[index];
      if (!entry.visible) { stopGuide(); schedule(2000); return; }
      const next = position(entry);
      pulse.hidden = false;
      const perform = () => {
        if (run !== guideRun || !canGuide()) return;
        pulse.style.transform = 'translateX(' + next + 'px)';
        if (guideAnimation) guideAnimation.cancel();
        guideAnimation = null;
        previous = next;
        if (!play(entry, true)) { stopGuide(); schedule(2000); return; }
        guideTimer = setTimeout(() => { guideTimer = null; step(index + 1); }, entry.duration + 160);
      };
      if (!index) perform();
      else {
        guideAnimation = pulse.animate([
          { transform: 'translateX(' + previous + 'px)' },
          { transform: 'translateX(' + next + 'px)' }
        ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
        guideAnimation.finished.then(perform).catch(() => {});
      }
    };
    step(0);
  }
  const observer = new IntersectionObserver(items => items.forEach(item => {
    const entry = entries.find(candidate => candidate.art === item.target);
    if (!entry) return;
    entry.visible = item.isIntersecting && item.intersectionRatio > .5;
    if (!entry.visible) {
      if (active === entry && entry.automatic) stopGuide();
      stop(entry);
    }
    if (entry.visible && document.activeElement === entry.trip && active !== entry) {
      stopGuide(); play(entry);
    } else if (entry.visible && !active && !guideTimer && pulse.hidden) schedule(500);
  }), { threshold: [0, .5, 1] });
  section.querySelectorAll('.authored-scene').forEach(art => {
    const trip = art.closest('.chronology-trip');
    const entry = { trip, art, duration: Number(art.dataset.duration), visible: false, run: 0 };
    entries.push(entry);
    observer.observe(art);
    trip.addEventListener('pointerenter', () => {
      hovered = entry;
      stopGuide();
      entries.forEach(item => clearTimeout(item.intent));
      entry.intent = setTimeout(() => play(entry), 100);
    });
    trip.addEventListener('pointerleave', () => {
      if (hovered === entry) hovered = null;
      clearTimeout(entry.intent);
      schedule(2000);
    });
    trip.addEventListener('focus', () => { stopGuide(); play(entry); });
  });
  section.addEventListener('focusout', () => setTimeout(() => schedule(2000), 0));
  section.querySelector('.chronology-scroll').addEventListener('scroll', () => {
    stopGuide(); schedule(2000);
  }, { passive: true });
  new IntersectionObserver(items => {
    const wasInView = inView;
    inView = items[0].isIntersecting && items[0].intersectionRatio >= .5;
    if (inView && !wasInView) schedule(500);
    else if (!inView) stopAll();
  }, { threshold: [0, .5, 1] }).observe(section);
  new MutationObserver(() => {
    if (section.hidden) stopAll(); else schedule(500);
  }).observe(section, { attributes: true, attributeFilter: ['hidden'] });
  reduced.addEventListener('change', () => { stopAll(); schedule(2000); });
  document.addEventListener('visibilitychange', () => { stopAll(); if (!document.hidden) schedule(2000); });
  window.addEventListener('pagehide', stopAll);
})();
