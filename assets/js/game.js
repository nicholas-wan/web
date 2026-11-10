/* ==========================================================================
   game.js — playful, gamified interactions layer
   Loaded on the homepage; smaller route-specific bundles cover listings and journals.
   Everything degrades gracefully and respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* One frame for the homepage's scroll effects: each effect measures, then
     each writes, so no effect's write forces the next one's read to restyle
     the page. A job reads when called and returns its write, if any;
     `scrolled` says whether a scroll asked for this frame. */
  var frameJobs = [];
  var framePending = false;
  var frameScrolled = false;
  function runFrame() {
    framePending = false;
    var scrolled = frameScrolled;
    frameScrolled = false;
    var writes = frameJobs.map(function (job) { return job(scrolled); });
    writes.forEach(function (write) { if (write) { write(); } });
  }
  function queueFrame() {
    if (framePending) { return; }
    framePending = true;
    requestAnimationFrame(runFrame);
  }
  function addFrameJob(job) {
    if (!frameJobs.length) {
      window.addEventListener('scroll', function () { frameScrolled = true; queueFrame(); }, { passive: true });
      window.addEventListener('resize', queueFrame, { passive: true });
    }
    frameJobs.push(job);
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    initIntroFade();
    initIntroSwipe();
    initHeroSnap();
    initCardScrub();
    initHeroBurst();
    initKonami();
  });

  /* The intro fades once the main content crosses the old Scrollex handoff
     zones, and returns when scrolling up. Runs under reduced motion too. */
  function initIntroFade() {
    var intro = document.getElementById('intro');
    var main = document.getElementById('main');
    if (!intro || !main) return;
    var compact = window.matchMedia('(max-width: 480px)');
    addFrameJob(function () {
      var threshold = window.innerHeight * (compact.matches ? 0.65 : 0.75);
      var hidden = main.getBoundingClientRect().top <= threshold;
      return function () { intro.classList.toggle('hidden', hidden); };
    });
    compact.addEventListener('change', queueFrame);
    queueFrame();
  }

  /* The desktop scene pins while it scrubs; phones use the portrait's entry
     through one viewport so no completed scene retains a dead scroll tail. */
  function initIntroSwipe() {
    var section = document.querySelector('.intro-swipe');
    if (!section) { return; }
    if (reduce) { section.classList.add('is-static'); return; }
    var photo = section.querySelector('.intro-swipe__photo');
    var text = section.querySelector('.intro-swipe__text');
    var stage = section.querySelector('.intro-swipe__stage');
    var links = document.querySelector('.homepage .homepage-links');
    var pinTop = 0;

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
      /* Desktop pins the stage where the photo and the cards under it sit
         centred as one cluster, so the scene settles with no dead band between
         them. Offsets are layout values, so the cards' scrub cannot skew it. */
      if (window.innerWidth > 736 && links) {
        var pad = parseFloat(getComputedStyle(stage).paddingTop) || 0;
        var cluster = stage.offsetHeight - pad + links.offsetTop + links.offsetHeight - (section.offsetTop + section.offsetHeight);
        pinTop = Math.max(0, Math.round((window.innerHeight - cluster) / 2 - pad));
        section.style.setProperty('--swipe-top', pinTop + 'px');
      }
    }

    function read() {
      var phone = window.innerWidth <= 736;
      /* The stage pins at pinTop and travels the section's height less its
         own. Where the page ends before that (a tall window), the scrub runs
         over the scroll that is left, so the copy always arrives. */
      var sectionTop = section.getBoundingClientRect().top;
      var room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY + pinTop - sectionTop;
      var scrollable = Math.min(section.offsetHeight - stage.offsetHeight, room);
      var p = phone ? 0 : scrollable > 0
        ? Math.min(1, Math.max(0, (pinTop - sectionTop) / scrollable))
        : 1;
      var textProgress = p;
      /* On phones, begin the horizontal motion when the portrait itself first
         enters the bottom of the viewport. Waiting for the sticky section to
         reach the top made a visible sliver sit still for too long. */
      var photoProgress = p;
      if (phone) {
        var photoTop = photo.getBoundingClientRect().top;
        var settledPhotoTop = photoTop - Math.max(sectionTop, 0);
        var visibleTravel = Math.max(window.innerHeight - settledPhotoTop, 1);
        photoProgress = Math.min(1, Math.max(0, (window.innerHeight - photoTop) / visibleTravel));
        /* Bring the copy in as soon as the portrait starts moving rather than
           leaving a portrait-only pause in the middle of the mobile handoff. */
        textProgress = Math.max(p, Math.min(1, Math.max(0, (photoProgress - 0.06) / 0.82)));
      }
      return function () {
        section.style.setProperty('--p', textProgress.toFixed(4));
        section.style.setProperty('--photo-p', photoProgress.toFixed(4));
      };
    }
    function update() { read()(); }

    addFrameJob(read);
    /* A phone URL-bar resize changes only the height, and the phone photo's
       42vh cap tracks the large viewport, which the URL bar never moves, so
       those resizes skip measure()'s forced layouts. Desktop sizes the photo
       by 62vh of a real window, so every desktop resize re-measures. read()
       takes the viewport height and always runs, in the shared next frame. */
    var measuredWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth !== measuredWidth || window.innerWidth > 736) {
        measuredWidth = window.innerWidth;
        measure();
      }
    });
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
  /* 1b. Phone hero gate: a scroll settling partway across the gated     */
  /*     band glides to the About section's true top, where the portrait */
  /*     finishes its rightward sweep. Desktop and reduced motion scroll */
  /*     plainly; new touch or wheel input cancels an in-flight glide.   */
  /* ------------------------------------------------------------------ */
  function initHeroSnap() {
    if (!document.body.classList.contains('page-home') || reduce) { return; }
    var intro = document.getElementById('intro');
    if (!intro) { return; }
    var mobile = window.matchMedia('(max-width: 736px)');
    var glideFrame = null;
    var settleTimer = 0;
    var settleDirection = 0;
    var touching = false;
    var lastY = window.scrollY;
    var direction = 0;
    var FORWARD_SETTLE_MS = 90;
    var REVERSE_SETTLE_MS = 32;

    function cancelGlide() {
      if (glideFrame !== null) {
        cancelAnimationFrame(glideFrame);
        glideFrame = null;
        lastY = window.scrollY;
      }
    }

    /* Measure the About section itself rather than assuming the hero's height
       is its document offset: the nav/main/article spacing between them left
       the mobile glide short, with the portrait still partly translated. */
    function farEdge() {
      var introHeight = intro.getBoundingClientRect().height;
      var section = document.querySelector('.intro-swipe');
      if (!section) { return introHeight; }
      return section.getBoundingClientRect().top + window.scrollY;
    }

    function glide(target) {
      cancelGlide();
      var from = window.scrollY;
      var delta = target - from;
      if (!delta) { return; }
      var DURATION = 900;
      var start = null;
      function step(now) {
        if (start === null) { start = now; }
        var t = Math.min(1, (now - start) / DURATION);
        var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, from + delta * eased);
        if (t < 1) { glideFrame = requestAnimationFrame(step); }
        else { glideFrame = null; lastY = window.scrollY; }
      }
      glideFrame = requestAnimationFrame(step);
    }

    function armSettle() {
      var reversing = direction < 0;
      /* Keep the first reverse timer so momentum cannot postpone it; replace
         a pending forward timer when the direction turns upward. */
      if (settleTimer) {
        if (reversing && settleDirection < 0) { return; }
        clearTimeout(settleTimer);
      }
      settleDirection = reversing ? -1 : 1;
      settleTimer = setTimeout(settle, reversing ? REVERSE_SETTLE_MS : FORWARD_SETTLE_MS);
    }

    function settle() {
      settleTimer = 0;
      settleDirection = 0;
      if (!direction) { return; }
      if (touching || glideFrame !== null || !mobile.matches) { return; }
      var edge = farEdge();
      var y = window.scrollY;
      if (y <= 1 || y >= edge - 1) { return; }
      glide(direction > 0 ? edge : 0);
    }

    // Read in the shared frame, so the scroll position never forces a restyle.
    addFrameJob(function (scrolled) {
      if (!scrolled || glideFrame !== null) { return; }
      var y = window.scrollY;
      if (y !== lastY) { direction = y > lastY ? 1 : -1; lastY = y; }
      armSettle();
    });

    // Also cancel on wheel for narrow pointer-driven viewports.
    window.addEventListener('wheel', cancelGlide, { passive: true });

    window.addEventListener('touchstart', function () {
      touching = true;
      cancelGlide();
    }, { passive: true });
    var release = function (event) {
      touching = event.touches && event.touches.length > 0;
      if (!touching) { armSettle(); }
    };
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });
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

    function read() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // Read every card before writing any, so a write cannot force a layout.
      var rects = Array.prototype.map.call(cards, function (card) { return card.getBoundingClientRect(); });
      return function () { write(vh, rects); };
    }
    function write(vh, rects) {
      for (var i = 0; i < cards.length; i++) {
        var r = rects[i];
        // Rects include the scrub translate; undo it so progress reads the
        // layout position and the loop stays stable.
        var top = r.top - (1 - last[i]) * LIFT;
        // 0 as the card's top crosses the viewport bottom, 1 once it has
        // risen 35% of the viewport; each card trails the one before it.
        // Desktop cards rest about 20% up when the About scene settles, so
        // they finish inside that rise instead of stopping half-faded.
        var wide = window.innerWidth > 736;
        var p = (vh - top) / (vh * (wide ? 0.14 : 0.35)) - i * (wide ? 0.12 : 0.15);
        p = Math.min(1, Math.max(0, p));
        last[i] = p;
        var iconP = Math.min(1, Math.max(0, (p - 0.2) / 0.68));
        var pulse = Math.max(0, 1 - Math.abs(iconP - 0.82) / 0.18);
        cards[i].style.setProperty('--cp', p.toFixed(4));
        cards[i].style.setProperty('--ip', iconP.toFixed(4));
        cards[i].style.setProperty('--pulse', pulse.toFixed(4));
      }
    }

    addFrameJob(read);
    read()();
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
    var msg = toastQueue.shift();
    document.body.appendChild(t);
    setTimeout(function () { t.textContent = msg; t.classList.add('is-visible'); }, 20);
    setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () {
        if (t.parentNode) { t.parentNode.removeChild(t); }
        nextToast();
      }, 400);
    }, 3200);
  }
})();
