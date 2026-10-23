// Page changes: custom.css names the active-tab mark, and on desktop tab
// pages the page title, so a cross-document view transition glides each to
// its new place. Either sits a change out when it would fly instead:
// off-screen on either page, an #anchor landing, an event page (no header,
// so the nav sits higher), or the homepage under its intro fade. In <head>
// so pagereveal is heard before first paint.
(function () {
  function named() {
    var list = [];
    var mark = document.querySelector('#nav .nav-active-mark');
    if (mark) list.push(mark);
    // Titles are only named at 981px and up (custom.css), so phones skip the style
    // reads: a journal has one <h2> per day and each read cost a style recalc.
    if (!window.matchMedia('(min-width: 981px)').matches) return list;
    var titles = document.querySelectorAll('#main h1, #main h2');
    var i;
    // Clear every inline name before reading any, so the reads share one recalc.
    for (i = 0; i < titles.length; i++) titles[i].style.viewTransitionName = '';
    for (i = 0; i < titles.length; i++) {
      if (getComputedStyle(titles[i]).viewTransitionName === 'page-title') list.push(titles[i]);
    }
    return list;
  }

  function settle(event, landing) {
    var transition = event.viewTransition;
    var els = named();
    els.forEach(function (el) { el.style.viewTransitionName = ''; });
    if (!transition) return;
    transition.ready.catch(function () {});
    transition.finished.catch(function () {});
    var body = document.body.classList;
    var skip = landing || body.contains('page-event') ||
      (body.contains('page-home') && body.contains('is-preload'));
    els.forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (skip || box.bottom <= 0 || box.top >= window.innerHeight) {
        el.style.viewTransitionName = 'none';
      }
    });
  }

  window.addEventListener('pageswap', function (event) { settle(event, false); });
  window.addEventListener('pagereveal', function (event) { settle(event, location.hash.length > 1); });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) named().forEach(function (el) { el.style.viewTransitionName = ''; });
  });
})();
