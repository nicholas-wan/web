/* Small previews; activate existing navigation immediately, without moving
   overflow-clipped ancestors or loading the atlas just to paint the shortcut. */
(function () {
  'use strict';
  var nav = document.querySelector('.travel-portals');
  if (!nav) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var onScreen = false;
  var seen = new WeakSet();
  // Touch screens have no hover replay, so the two previews take turns while visible.
  var touch = matchMedia('(hover: none)');
  var timer = 0, turn = 0;
  function syncPause() { nav.classList.toggle('is-paused', document.hidden || !onScreen); loop(); }
  function loop() {
    clearTimeout(timer);
    if (!touch.matches || reduced.matches || document.hidden || !onScreen) return;
    var links = nav.querySelectorAll('a');
    play(links[turn++ % links.length]);
    timer = setTimeout(loop, 2400);
  }
  function play(link) {
    if (reduced.matches || document.hidden || !onScreen) return;
    link.classList.remove('is-playing');
    void link.offsetWidth;
    link.classList.add('is-playing');
  }
  var observer = new IntersectionObserver(function (entries) {
    onScreen = entries[0].isIntersecting;
    syncPause();
    if (onScreen && !touch.matches) nav.querySelectorAll('a').forEach(function (link) {
      if (!seen.has(link)) { seen.add(link); play(link); }
    });
  }, { threshold: .5 });
  observer.observe(nav);
  document.addEventListener('visibilitychange', syncPause);
  reduced.addEventListener('change', function () {
    if (reduced.matches) nav.querySelectorAll('.is-playing').forEach(function (link) { link.classList.remove('is-playing'); });
  });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('pointerenter', function () { play(link); });
    link.addEventListener('focus', function () { play(link); });
    link.addEventListener('click', function (event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      var mapLink = link.dataset.portal === 'map';
      var target = document.querySelector(mapLink ? '.travel-atlas__layout' : '#travel-archive-title');
      if (!target) return;
      event.preventDefault();
      var form = document.getElementById('photo-search');
      var clear = form && form.querySelector('[data-clear]');
      if (clear && (form.q.value || form.classList.contains('is-active'))) clear.click();
      requestAnimationFrame(function () {
        if (mapLink && matchMedia('(max-width:520px)').matches) {
          var opener = document.querySelector('[data-map-open]');
          if (opener) { opener.click(); return; }
        }
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        var margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - margin, behavior: reduced.matches ? 'instant' : 'smooth' });
      });
    });
  });
})();
