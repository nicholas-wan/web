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
    var nav = document.getElementById('nav');
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
         them. Offsets are layout values, so the cards' scrub cannot skew it.
         Where the nav docks (981px and up), the cluster centres in the space
         under it, so the settled frame keeps the bar. */
      if (window.innerWidth > 736 && links) {
        var pad = parseFloat(getComputedStyle(stage).paddingTop) || 0;
        var cluster = stage.offsetHeight - pad + links.offsetTop + links.offsetHeight - (section.offsetTop + section.offsetHeight);
        var dock = nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
        pinTop = dock + Math.max(0, Math.round((window.innerHeight - dock - cluster) / 2 - pad));
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
      /* Desktop runs the scrub while the scene is still rising: from its top
         55% of a viewport short of the pin to the pin itself, eased out, so
         the copy arrives with the photo and the scene is whole when the nav
         docks. It began at the pin before, which left a portrait with no
         words under the nav. The pin then only brings the cards up. */
      var lead = window.innerHeight * 0.55;
      var p = phone ? 0 : scrollable > 0
        ? Math.min(1, Math.max(0, (pinTop + lead - sectionTop) / lead))
        : 1;
      p = 1 - (1 - p) * (1 - p);
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
       39svh width tracks the small viewport, which the URL bar never moves,
       so those resizes skip measure()'s forced layouts. Desktop sizes the photo
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
  /* 1b. Hero gate: a scroll settling partway across the gated band      */
  /*     glides on to About. Phones land on its true top, where the      */
  /*     portrait finishes its sweep; wider screens land where the pin   */
  /*     ends, the scene whole over its cards. Reduced motion scrolls    */
  /*     plainly; touch, wheel, scroll keys or a scrollbar press cancel. */
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
    var pressing = false;
    var lastY = window.scrollY;
    var restY = lastY;
    var jumped = false;
    var direction = 0;
    var width = window.innerWidth;
    var FORWARD_SETTLE_MS = 90;
    var REVERSE_SETTLE_MS = 32;
    var NUDGE = 24;
    var SCROLL_KEY = /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| |Spacebar)$/;

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
      var section = document.querySelector('.intro-swipe');
      if (!section) { return intro.getBoundingClientRect().height; }
      var top = section.getBoundingClientRect().top + window.scrollY;
      if (mobile.matches) { return top; }
      /* Wider screens pin the stage at its sticky top while the cards rise
         under it. Land where the pin ends, with all three cards in, or at the
         page's end if that comes first. */
      var stage = section.querySelector('.intro-swipe__stage');
      var pin = parseFloat(getComputedStyle(stage).top) || 0;
      var settled = top - pin + section.offsetHeight - stage.offsetHeight;
      return Math.min(settled, document.documentElement.scrollHeight - window.innerHeight);
    }

    function glide(target, duration) {
      cancelGlide();
      var from = window.scrollY;
      var sign = target > from ? 1 : -1;
      var delta = target - from;
      if (Math.abs(delta) < 1) { restY = from; return; }
      var start = null;
      var expected = from;
      function finish() {
        glideFrame = null;
        lastY = restY = window.scrollY;
      }
      function step(now) {
        var y = window.scrollY;
        /* The browser's own smooth scroll (keys, the return-to-top button) may
           still be running when an upward glide starts. Follow it instead of
           pulling against it, then ease on from wherever it stops. */
        if (Math.abs(y - expected) > 1) {
          from = expected = y;
          delta = target - y;
          start = null;
          if (delta * sign < 4) {
            if (delta * sign > 0) { window.scrollTo(0, target); }
            finish();
            return;
          }
          glideFrame = requestAnimationFrame(step);
          return;
        }
        if (start === null) { start = now; }
        var t = Math.min(1, (now - start) / (duration || 900));
        var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, from + delta * eased);
        expected = window.scrollY;
        if (t < 1) { glideFrame = requestAnimationFrame(step); }
        else { finish(); }
      }
      glideFrame = requestAnimationFrame(step);
    }

    function armSettle(restart) {
      var reversing = direction < 0;
      /* Keep the first reverse timer so momentum cannot postpone it; replace
         a pending forward timer when the direction turns upward. */
      if (settleTimer) {
        if (reversing && settleDirection < 0 && !restart) { return; }
        clearTimeout(settleTimer);
      }
      settleDirection = reversing ? -1 : 1;
      settleTimer = setTimeout(settle, reversing ? REVERSE_SETTLE_MS : FORWARD_SETTLE_MS);
    }

    function settle() {
      settleTimer = 0;
      settleDirection = 0;
      if (!direction && !jumped) { return; }
      if (touching || pressing || glideFrame !== null) { return; }
      var edge = farEdge();
      var y = window.scrollY;
      var wasJump = jumped;
      jumped = false;
      if (y <= 1 || y >= edge - 1) { restY = y; return; }
      /* A link, find-in-page or restored scroll that lands mid-band settles on
         the nearer frame, which keeps what it landed on in view. */
      if (wasJump) { glide(y < edge - y ? 0 : edge); return; }
      /* A nudge of a few pixels off a frame (trackpad jitter, a small look
         back) springs back instead of crossing the whole band. */
      var frame = restY <= 1 ? 0 : restY >= edge - 1 ? edge : -1;
      if (frame >= 0 && Math.abs(y - frame) < NUDGE) { glide(frame, 400); return; }
      glide(direction > 0 ? edge : 0);
    }

    /* A scroll is the reader's own while it follows wheel, key, touch or
       scrollbar input; each moving frame extends the window, so momentum
       counts too. Anything else (a link, find-in-page, focus, a restored or
       scripted scroll such as return-to-top) is a jump. Read in the shared
       frame, so the scroll position never forces a restyle. */
    var inputAt = -1e9;
    function input() { inputAt = performance.now(); }
    addFrameJob(function (scrolled) {
      if (!scrolled || glideFrame !== null) { return; }
      var y = window.scrollY;
      if (y !== lastY) {
        var now = performance.now();
        var own = touching || pressing || now - inputAt < 250;
        if (own) { inputAt = now; }
        jumped = !own;
        direction = own ? (y > lastY ? 1 : -1) : 0;
        lastY = y;
      }
      armSettle();
    });

    /* The wheel scrolls before this passive listener runs, and a glide's next
       frame overwrites that scroll, so take the direction from the wheel itself
       (a wheel up mid-glide turns back). Each wheel restarts the settle timer,
       so a trackpad stream settles once it stops. */
    window.addEventListener('wheel', function (event) {
      if (!event.deltaY) { return; }
      input();
      pressing = false;
      cancelGlide();
      direction = event.deltaY > 0 ? 1 : -1;
      armSettle(true);
    }, { passive: true });
    // Only scrolling keys take the scroll back; they scroll after keydown.
    window.addEventListener('keydown', function (event) {
      if (SCROLL_KEY.test(event.key)) { input(); pressing = false; cancelGlide(); }
    });
    /* A press on the scrollbar holds like a finger. A browser may not report
       its release, so the next buttonless mousemove also counts as one. Other
       clicks never scroll, so they leave a glide alone. */
    function unpress() {
      if (pressing) { pressing = false; armSettle(); }
    }
    window.addEventListener('mousedown', function (event) {
      var root = document.documentElement;
      if (event.clientX < root.clientWidth && event.clientY < root.clientHeight) { return; }
      input();
      pressing = true;
      cancelGlide();
    });
    window.addEventListener('mouseup', unpress);
    window.addEventListener('mousemove', function (event) {
      if (!event.buttons) { unpress(); }
    }, { passive: true });

    window.addEventListener('touchstart', function () {
      input();
      touching = true;
      cancelGlide();
    }, { passive: true });
    var release = function (event) {
      input();
      touching = event.touches && event.touches.length > 0;
      if (!touching) { armSettle(); }
    };
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });

    // A new width moves the frames: re-aim a glide that is under way.
    window.addEventListener('resize', function () {
      if (window.innerWidth === width) { return; }
      width = window.innerWidth;
      if (glideFrame !== null) { cancelGlide(); armSettle(true); }
    });

    /* A reload or a return through history can restore the scroll mid-band
       before this runs; settle it on the nearer frame once the page is up. */
    function settleRestored() {
      // A reader already scrolling owns the scroll; their settle handles it.
      if (touching || pressing || glideFrame !== null || performance.now() - inputAt < 1000) { return; }
      lastY = window.scrollY;
      if (lastY > 1) { jumped = true; armSettle(true); }
    }
    window.addEventListener('pageshow', function () { setTimeout(settleRestored, 120); });
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
