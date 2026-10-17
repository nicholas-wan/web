// Page changes: custom.css names the active-tab mark so a cross-document
// view transition glides it to the new tab. It sits a change out when it
// would fly instead: off-screen on either page, an #anchor landing, an event
// page (no header, so the nav sits higher), or the homepage under its intro
// fade. In <head> so pagereveal is heard before first paint.
(function () {
  function mark() {
    return document.querySelector('#nav .nav-active-mark');
  }

  function settle(event, landing) {
    var transition = event.viewTransition;
    var el = mark();
    if (el) el.style.viewTransitionName = '';
    if (!transition) return;
    transition.ready.catch(function () {});
    transition.finished.catch(function () {});
    if (!el) return;
    var body = document.body.classList;
    var box = el.getBoundingClientRect();
    if (landing || box.bottom <= 0 || box.top >= window.innerHeight || body.contains('page-event') ||
        (body.contains('page-home') && body.contains('is-preload'))) {
      el.style.viewTransitionName = 'none';
    }
  }

  window.addEventListener('pageswap', function (event) { settle(event, false); });
  window.addEventListener('pagereveal', function (event) { settle(event, location.hash.length > 1); });
  window.addEventListener('pageshow', function (event) {
    var el = mark();
    if (event.persisted && el) el.style.viewTransitionName = '';
  });
})();
