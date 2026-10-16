(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia && window.matchMedia('(max-width: 736px)').matches;
  var watchers = [];
  var scheduled = false;
  var REVEAL_DURATION = 480;
  var REVEAL_STAGGER = 60;
  /* The stagger counts from the first card revealed in the same frame, not
     from the card's position in the grid, and phones cap it at two steps:
     a fast flick used to land on cards that all waited the full 480ms
     before their 480ms fade, so the screen stayed white for about a second
     (Oct 2026). Cards also reveal a quarter viewport ahead of the fold. */
  var STAGGER_CAP = phone ? 2 : 8;
  var LOOKAHEAD = 0.25;

  function reveal(element, order) {
    var delay = Math.min(order, STAGGER_CAP) * REVEAL_STAGGER;
    element.style.setProperty('--reveal-delay', delay + 'ms');
    element.classList.add('is-revealed');
    window.setTimeout(function () {
      element.style.removeProperty('--reveal-delay');
      element.classList.add('is-reveal-settled');
    }, REVEAL_DURATION + delay + 40);
  }

  function inViewport(element, ratio) {
    var rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(rect.bottom, viewportHeight * (1 + LOOKAHEAD)) - Math.max(rect.top, 0);
    return visible > rect.height * ratio;
  }

  function checkWatchers() {
    scheduled = false;
    var batch = [];
    for (var index = watchers.length - 1; index >= 0; index--) {
      var watcher = watchers[index];
      if (inViewport(watcher.element, watcher.ratio)) {
        watchers.splice(index, 1);
        batch.unshift(watcher.element);
      }
    }
    batch.forEach(reveal);
    if (!watchers.length) {
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    }
  }

  function scheduleCheck() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(checkWatchers);
  }

  function revealListings() {
    var selectors = ['.education-grid .education-card', '.travel-grid .travel-card'];
    var items = [];
    selectors.forEach(function (selector) {
      Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
        element.setAttribute('data-reveal', '');
        items.push(element);
      });
    });
    if (!items.length) return;
    if (reduce) {
      items.forEach(function (element) {
        element.classList.add('is-revealed');
        element.classList.add('is-reveal-settled');
        element.style.removeProperty('--reveal-delay');
      });
      return;
    }
    watchers = items.map(function (element) {
      return { element: element, ratio: 0.12 };
    });
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck);
    scheduleCheck();
  }

  function bindTilt(element) {
    var frame = null;
    element.classList.add('js-tilt');
    element.addEventListener('pointermove', function (event) {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = null;
        var rect = element.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform = 'perspective(760px) rotateX(' + (-y * 8).toFixed(2) +
          'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) translateY(-4px)';
      });
    });
    element.addEventListener('pointerleave', function () {
      if (frame) window.cancelAnimationFrame(frame);
      frame = null;
      element.style.transform = '';
    });
  }

  function enableTilt() {
    if (reduce || !window.matchMedia ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    Array.prototype.forEach.call(
      document.querySelectorAll('.travel-grid .travel-card, .education-grid .education-card'),
      bindTilt
    );
  }

  revealListings();
  enableTilt();
})();
