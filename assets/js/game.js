/* ==========================================================================
   game.js — playful, gamified interactions layer
   Loaded on every generated page (see tools/site/build.ps1 template + runtimeJs).
   Everything degrades gracefully and respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Fire callback once per element when it scrolls into view. Uses a
     rAF-throttled scroll/resize check instead of IntersectionObserver so it
     also works in throttled/embedded renderers where IO never delivers. */
  var watchers = [];
  var watchScheduled = false;

  function inViewport(el, ratio) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) { return false; }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return visible > r.height * (ratio || 0.15);
  }

  function checkWatchers() {
    watchScheduled = false;
    for (var i = watchers.length - 1; i >= 0; i--) {
      var w = watchers[i];
      if (inViewport(w.el, w.ratio)) {
        watchers.splice(i, 1);
        w.cb(w.el);
      }
    }
    if (!watchers.length) {
      window.removeEventListener('scroll', scheduleWatch);
      window.removeEventListener('resize', scheduleWatch);
    }
  }

  function scheduleWatch() {
    if (watchScheduled) { return; }
    watchScheduled = true;
    requestAnimationFrame(checkWatchers);
  }

  function onVisible(el, cb, ratio) {
    if (!watchers.length) {
      window.addEventListener('scroll', scheduleWatch, { passive: true });
      window.addEventListener('resize', scheduleWatch);
    }
    watchers.push({ el: el, cb: cb, ratio: ratio });
    scheduleWatch();
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    restoreDate();
    initIntroSwipe();
    initCardScrub();
    initReveal();
    initCounters();
    initTilt();
    initHeroBurst();
    initKonami();
    initReadProgress();
  });

  /* ------------------------------------------------------------------ */
  /* 1. Date + analog clock                                              */
  /*    These ran as inline scripts in the source index.html but sit     */
  /*    after </footer>, so the static build dropped them and the        */
  /*    deployed home page shipped an empty date + frozen clock. Restore. */
  /* ------------------------------------------------------------------ */
  function restoreDate() {
    var para = document.getElementById('para1');
    if (para && !para.textContent.trim()) {
      var d = new Date();
      var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      para.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
    }
  }

  /* iPhone-style swipe intro: the section is taller than the viewport and
     its stage pins while scroll progress (--p, 0 to 1) swipes the profile
     photo from center to its left slot and slides the intro text in from
     the right. Reversible; scrolling back re-centers the photo. Without JS
     --p defaults to 1 (settled layout); small screens and reduced motion
     use the static layout. */
  function initIntroSwipe() {
    var section = document.querySelector('.intro-swipe');
    if (!section) { return; }
    if (reduce) { section.classList.add('is-static'); return; }
    var photo = section.querySelector('.intro-swipe__photo');
    var text = section.querySelector('.intro-swipe__text');

    // Measure at rest (--p: 1) so the start positions are exact whatever the
    // layout width: desktop centers the photo; the stacked mobile variant
    // parks it fully offscreen left (48px covers the box-shadow bleed).
    function measure() {
      var prev = section.style.getPropertyValue('--p');
      var prevPhoto = section.style.getPropertyValue('--photo-p');
      section.style.setProperty('--p', '1');
      section.style.setProperty('--photo-p', '1');
      var pr = photo.getBoundingClientRect();
      if (window.innerWidth <= 736) {
        section.style.setProperty('--swipe-photo', (-(pr.right + 48)).toFixed(1) + 'px');
      } else {
        section.style.setProperty('--swipe-photo', ((window.innerWidth / 2) - (pr.left + pr.width / 2)).toFixed(1) + 'px');
      }
      var tr = text.getBoundingClientRect();
      section.style.setProperty('--swipe-text', (window.innerWidth - tr.left + 32).toFixed(1) + 'px');
      if (prev) { section.style.setProperty('--p', prev); }
      else { section.style.removeProperty('--p'); }
      if (prevPhoto) { section.style.setProperty('--photo-p', prevPhoto); }
      else { section.style.removeProperty('--photo-p'); }
    }

    function update() {
      var scrollable = section.offsetHeight - window.innerHeight;
      var sectionTop = section.getBoundingClientRect().top;
      var p = scrollable > 0
        ? Math.min(1, Math.max(0, -sectionTop / scrollable))
        : 1;
      var textProgress = p;
      /* On phones, begin the horizontal motion when the portrait itself first
         enters the bottom of the viewport. Waiting for the sticky section to
         reach the top made a visible sliver sit still for too long. */
      var photoProgress = p;
      if (window.innerWidth <= 736) {
        var photoTop = photo.getBoundingClientRect().top;
        var settledPhotoTop = photoTop - Math.max(sectionTop, 0);
        var visibleTravel = Math.max(window.innerHeight - settledPhotoTop, 1);
        photoProgress = Math.min(1, Math.max(0, (window.innerHeight - photoTop) / visibleTravel));
        /* Bring the copy in as soon as the portrait starts moving rather than
           leaving a portrait-only pause in the middle of the mobile handoff. */
        textProgress = Math.max(p, Math.min(1, Math.max(0, (photoProgress - 0.06) / 0.82)));
      }
      section.style.setProperty('--p', textProgress.toFixed(4));
      section.style.setProperty('--photo-p', photoProgress.toFixed(4));
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    if (document.readyState === 'complete') {
      measure();
    } else {
      // Image dimensions affect the rest layout; re-measure once loaded.
      window.addEventListener('load', measure);
      measure();
    }
    update();
  }

  /* ------------------------------------------------------------------ */
  /* 2. Scroll reveal (staggered)                                        */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    var groups = [
      '.hero-badges .hero-badge',
      '.homepage-links .homepage-link',
      '.education-grid .education-card',
      '.posts > article',
      '.travel-grid .travel-card'
    ];
    var all = [];
    groups.forEach(function (sel) {
      var items = document.querySelectorAll(sel);
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.hasAttribute('data-reveal') || el.hasAttribute('data-scrub')) { continue; }
        el.setAttribute('data-reveal', '');
        el.style.setProperty('--reveal-delay', (Math.min(i, 8) * 70) + 'ms');
        all.push(el);
      }
    });
    // Any elements authored with data-reveal directly.
    var authored = document.querySelectorAll('[data-reveal]:not(.is-revealed)');
    for (var j = 0; j < authored.length; j++) {
      if (all.indexOf(authored[j]) === -1) { all.push(authored[j]); }
    }
    if (!all.length) { return; }

    if (reduce) {
      all.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }
    all.forEach(function (el) {
      onVisible(el, function (target) { target.classList.add('is-revealed'); }, 0.12);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2b. Homepage cards: scroll-scrubbed entrance                        */
  /* ------------------------------------------------------------------ */
  function initCardScrub() {
    var cards = document.querySelectorAll('.homepage .homepage-links .homepage-link');
    if (!cards.length || reduce) { return; }
    var LIFT = 48;
    var last = [];
    for (var i = 0; i < cards.length; i++) {
      cards[i].setAttribute('data-scrub', '');
      cards[i].style.setProperty('--cp', '0');
      cards[i].style.setProperty('--ip', '0');
      cards[i].style.setProperty('--pulse', '0');
      last.push(0);
    }

    function update() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        // Rects include the scrub translate; undo it so progress reads the
        // layout position and the loop stays stable.
        var top = r.top - (1 - last[i]) * LIFT;
        // 0 as the card's top crosses the viewport bottom, 1 once it has
        // risen 35% of the viewport; each card trails the one before it.
        var p = (vh - top) / (vh * 0.35) - i * 0.15;
        p = Math.min(1, Math.max(0, p));
        last[i] = p;
        var iconP = Math.min(1, Math.max(0, (p - 0.2) / 0.68));
        var pulse = Math.max(0, 1 - Math.abs(iconP - 0.82) / 0.18);
        cards[i].style.setProperty('--cp', p.toFixed(4));
        cards[i].style.setProperty('--ip', iconP.toFixed(4));
        cards[i].style.setProperty('--pulse', pulse.toFixed(4));
      }
    }

    var ticking = false;
    function schedule() {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }

  /* ------------------------------------------------------------------ */
  /* 3. Count-up stat numbers                                            */
  /* ------------------------------------------------------------------ */
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) { return; }

    function run(el) {
      if (el.getAttribute('data-counted') === 'true') { return; }
      el.setAttribute('data-counted', 'true');
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (reduce) { el.textContent = String(target); return; }
      var dur = 1400;
      var startTs = null;
      function step(ts) {
        if (startTs === null) { startTs = ts; }
        var p = Math.min((ts - startTs) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) { requestAnimationFrame(step); }
        else { el.textContent = String(target); }
      }
      requestAnimationFrame(step);
    }

    if (reduce) {
      for (var i = 0; i < els.length; i++) { run(els[i]); }
      return;
    }

    var cardCounters = [];
    for (var k = 0; k < els.length; k++) {
      var card = els[k].closest ? els[k].closest('.homepage-link[data-scrub]') : null;
      if (card) { cardCounters.push({ el: els[k], card: card }); }
      else { onVisible(els[k], run, 0.5); }
    }

    if (cardCounters.length) {
      var counterTicking = false;
      function checkCardCounters() {
        counterTicking = false;
        var remaining = 0;
        for (var i = 0; i < cardCounters.length; i++) {
          var item = cardCounters[i];
          if (item.el.getAttribute('data-counted') === 'true') { continue; }
          var progress = parseFloat(item.card.style.getPropertyValue('--ip')) || 0;
          if (progress >= 0.78) { run(item.el); }
          else { remaining++; }
        }
        if (!remaining) {
          window.removeEventListener('scroll', scheduleCounterCheck);
          window.removeEventListener('resize', scheduleCounterCheck);
        }
      }
      function scheduleCounterCheck() {
        if (counterTicking) { return; }
        counterTicking = true;
        requestAnimationFrame(checkCardCounters);
      }
      window.addEventListener('scroll', scheduleCounterCheck, { passive: true });
      window.addEventListener('resize', scheduleCounterCheck);
      scheduleCounterCheck();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Pointer tilt (3D) with cursor glow                               */
  /* ------------------------------------------------------------------ */
  function initTilt() {
    if (reduce) { return; }
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }
    var sel = '.travel-grid .travel-card, .education-grid .education-card';
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.classList.add('js-tilt');
      bindTilt(el);
    }
  }

  function bindTilt(el) {
    var max = 8;
    var frame = null;
    el.addEventListener('pointermove', function (ev) {
      if (frame) { return; }
      frame = requestAnimationFrame(function () {
        frame = null;
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(760px) rotateX(' + (-py * max).toFixed(2) +
          'deg) rotateY(' + (px * max).toFixed(2) + 'deg) translateY(-4px)';
        el.style.setProperty('--gx', (px * 100 + 50) + '%');
        el.style.setProperty('--gy', (py * 100 + 50) + '%');
        el.style.setProperty('--icon-x', (px * 12).toFixed(2) + 'px');
        el.style.setProperty('--icon-y', (py * 12).toFixed(2) + 'px');
      });
    });
    el.addEventListener('pointerleave', function () {
      if (frame) { cancelAnimationFrame(frame); frame = null; }
      el.style.transform = '';
      el.style.removeProperty('--icon-x');
      el.style.removeProperty('--icon-y');
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. Confetti / particle burst helper                                 */
  /* ------------------------------------------------------------------ */
  var COLORS = ['#00e0e0', '#11807d', '#ffd166', '#ef476f', '#06d6a0', '#ffffff'];

  function burst(x, y, count, power) {
    if (reduce) { return; }
    var cv = document.createElement('canvas');
    cv.className = 'fx-canvas';
    var w = cv.width = window.innerWidth;
    var h = cv.height = window.innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var parts = [];
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = (0.4 + Math.random()) * power;
      parts.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - power * 0.5,
        s: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 60 + (Math.random() * 40 | 0)
      });
    }
    var maxLife = 110;
    var frames = 0;
    (function anim() {
      frames++;
      ctx.clearRect(0, 0, w, h);
      var alive = false;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.vy += 0.16;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        if (p.life > 0 && p.y < h + 30) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(Math.min(p.life / maxLife, 1), 0);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
          ctx.restore();
        }
      }
      if (alive && frames < 260) { requestAnimationFrame(anim); }
      else if (cv.parentNode) { cv.parentNode.removeChild(cv); }
    })();
  }

  /* ------------------------------------------------------------------ */
  /* 6. Hero image click burst                                           */
  /* ------------------------------------------------------------------ */
  function initHeroBurst() {
    var hero = document.querySelector('.intro-swipe__photo');
    if (!hero) { return; }
    hero.classList.add('is-interactive');
    hero.addEventListener('click', function (ev) {
      burst(ev.clientX, ev.clientY, 60, 9);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Konami-code easter egg                                           */
  /* ------------------------------------------------------------------ */
  function initKonami() {
    var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      var key = e.keyCode || e.which;
      if (key === seq[pos]) {
        pos++;
        if (pos === seq.length) { pos = 0; unlock(); }
      } else {
        pos = (key === seq[0]) ? 1 : 0;
      }
    });
  }

  function unlock() {
    burst(window.innerWidth / 2, window.innerHeight * 0.32, 180, 13);
    toast('🏆 Achievement Unlocked — you found the secret!');
  }

  /* Toast queue: chapter-complete and achievement toasts can fire in the
     same instant, so show them one after another instead of clobbering. */
  var toastQueue = [];
  var toastActive = false;
  function toast(msg) {
    toastQueue.push(msg);
    if (!toastActive) { nextToast(); }
  }
  function nextToast() {
    if (!toastQueue.length) { toastActive = false; return; }
    toastActive = true;
    var t = document.createElement('div');
    t.className = 'game-toast';
    t.setAttribute('role', 'status');
    t.textContent = toastQueue.shift();
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-visible'); }, 20);
    setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () {
        if (t.parentNode) { t.parentNode.removeChild(t); }
        nextToast();
      }, 400);
    }, 3200);
  }

  /* ------------------------------------------------------------------ */
  /* 8. Journal reading progress bar                                     */
  /* ------------------------------------------------------------------ */
  var TRIPS = {
    travel_2017_seoul: 'Seoul',
    travel_2019_siliconvalley: 'Silicon Valley',
    travel_2022_europe: 'Europe',
    travel_2023_perth: 'Perth',
    travel_2023_usacanada: 'USA & Canada',
    travel_2024_australia: 'Australia',
    travel_2024_germany: 'Germany',
    travel_2025_japan: 'Japan',
    travel_2026_guangzhou: 'Guangzhou'
  };

  function pageSlug() {
    var p = window.location.pathname.split('/').pop() || 'index';
    return p.replace(/\.html$/, '') || 'index';
  }

  function initReadProgress() {
    if (!TRIPS[pageSlug()]) { return; }

    var bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.innerHTML = '<span class="read-progress__fill"></span>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(window.scrollY / max, 1) : 1;
      fill.style.width = (pct * 100) + '%';
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    update();
  }
})();
