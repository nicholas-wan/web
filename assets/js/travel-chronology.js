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
