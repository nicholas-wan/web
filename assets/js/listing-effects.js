(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var watchers = [];
  var scheduled = false;

  function inViewport(element, ratio) {
    var rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return visible > rect.height * ratio;
  }

  function checkWatchers() {
    scheduled = false;
    for (var index = watchers.length - 1; index >= 0; index--) {
      var watcher = watchers[index];
      if (inViewport(watcher.element, watcher.ratio)) {
        watchers.splice(index, 1);
        watcher.element.classList.add('is-revealed');
      }
    }
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
      Array.prototype.forEach.call(document.querySelectorAll(selector), function (element, index) {
        element.setAttribute('data-reveal', '');
        element.style.setProperty('--reveal-delay', (Math.min(index, 8) * 70) + 'ms');
        items.push(element);
      });
    });
    if (!items.length) return;
    if (reduce) {
      items.forEach(function (element) { element.classList.add('is-revealed'); });
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
        element.style.setProperty('--gx', (x * 100 + 50) + '%');
        element.style.setProperty('--gy', (y * 100 + 50) + '%');
        element.style.setProperty('--icon-x', (x * 12).toFixed(2) + 'px');
        element.style.setProperty('--icon-y', (y * 12).toFixed(2) + 'px');
      });
    });
    element.addEventListener('pointerleave', function () {
      if (frame) window.cancelAnimationFrame(frame);
      frame = null;
      element.style.transform = '';
      element.style.removeProperty('--icon-x');
      element.style.removeProperty('--icon-y');
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
