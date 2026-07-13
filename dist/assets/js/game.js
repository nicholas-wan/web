/* ==========================================================================
   game.js — playful, gamified interactions layer
   Loaded on every generated page (see build-site.ps1 template + runtimeJs).
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
    restoreDateClock();
    initReveal();
    initCounters();
    initTilt();
    initXpBars();
    initHeroBurst();
    initKonami();
    initAchievements();
    initQuestLog();
    initReadProgress();
    initPhotoTracking();
  });

  /* ------------------------------------------------------------------ */
  /* 1. Date + analog clock                                              */
  /*    These ran as inline scripts in the source index.html but sit     */
  /*    after </footer>, so the static build dropped them and the        */
  /*    deployed home page shipped an empty date + frozen clock. Restore. */
  /* ------------------------------------------------------------------ */
  function restoreDateClock() {
    var para = document.getElementById('para1');
    if (para && !para.textContent.trim()) {
      var d = new Date();
      var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      para.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
    }

    var hourhand = document.getElementById('hourhand');
    if (!hourhand) { return; }
    var hands = [
      document.querySelector('#secondhand > *'),
      document.querySelector('#minutehand > *'),
      document.querySelector('#hourhand > *')
    ];
    var cx = 100, cy = 100;
    function shifter(val) { return [val, cx, cy].join(' '); }
    var date = new Date();
    var hoursAngle = 360 * date.getHours() / 12 + date.getMinutes() / 2;
    var minuteAngle = 360 * date.getMinutes() / 60;
    var secAngle = 360 * date.getSeconds() / 60;

    if (hands[0] && hands[1] && hands[2]) {
      hands[0].setAttribute('from', shifter(secAngle));
      hands[0].setAttribute('to', shifter(secAngle + 360));
      hands[1].setAttribute('from', shifter(minuteAngle));
      hands[1].setAttribute('to', shifter(minuteAngle + 360));
      hands[2].setAttribute('from', shifter(hoursAngle));
      hands[2].setAttribute('to', shifter(hoursAngle + 360));
    }

    var svg = hourhand.ownerSVGElement || document.querySelector('#main svg');
    if (svg && !svg.getAttribute('data-ticks')) {
      for (var i = 1; i <= 12; i++) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', '100');
        el.setAttribute('y1', '30');
        el.setAttribute('x2', '100');
        el.setAttribute('y2', '40');
        el.setAttribute('transform', 'rotate(' + (i * 360 / 12) + ' 100 100)');
        el.setAttribute('style', 'stroke: #ffffff;');
        svg.appendChild(el);
      }
      svg.setAttribute('data-ticks', '1');
    }
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
        if (el.hasAttribute('data-reveal')) { continue; }
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
  /* 3. Count-up stat numbers                                            */
  /* ------------------------------------------------------------------ */
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) { return; }

    function run(el) {
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
    for (var k = 0; k < els.length; k++) { onVisible(els[k], run, 0.5); }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Pointer tilt (3D) with cursor glow                               */
  /* ------------------------------------------------------------------ */
  function initTilt() {
    if (reduce) { return; }
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }
    var sel = '.homepage-link, .travel-grid .travel-card, .education-grid .education-card';
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
      });
    });
    el.addEventListener('pointerleave', function () {
      if (frame) { cancelAnimationFrame(frame); frame = null; }
      el.style.transform = '';
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. Skill XP bars (skills page)                                      */
  /* ------------------------------------------------------------------ */
  function initXpBars() {
    var table = document.querySelector('.skillstable');
    if (!table) { return; }
    var cells = table.querySelectorAll('td');
    var bars = [];
    for (var i = 0; i < cells.length; i++) {
      var td = cells[i];
      // Proficiency cells contain only star icons and no text.
      if (td.textContent.trim().length) { continue; }
      var stars = td.querySelectorAll('.fa-star');
      if (!stars.length) { continue; }
      var n = Math.min(stars.length, 3);
      var pct = Math.round((n / 3) * 100);

      var wrap = document.createElement('div');
      wrap.className = 'xp-bar';
      wrap.setAttribute('role', 'img');
      wrap.setAttribute('aria-label', n + ' out of 3');
      var track = document.createElement('span');
      track.className = 'xp-bar__track';
      var fill = document.createElement('span');
      fill.className = 'xp-bar__fill';
      fill.setAttribute('data-pct', pct);
      fill.style.width = reduce ? (pct + '%') : '0%';
      var label = document.createElement('span');
      label.className = 'xp-bar__label';
      label.textContent = n + '/3';
      track.appendChild(fill);
      wrap.appendChild(track);
      wrap.appendChild(label);
      td.innerHTML = '';
      td.appendChild(wrap);
      bars.push(fill);
    }
    if (!bars.length || reduce) { return; }

    function fillBar(fill) { fill.style.width = fill.getAttribute('data-pct') + '%'; }
    bars.forEach(function (b) {
      // Watch the row, not the fill: the fill starts at width 0 and a
      // zero-size element never registers as visible.
      onVisible(b.parentNode, function () { fillBar(b); }, 0.5);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 6. Confetti / particle burst helper                                 */
  /* ------------------------------------------------------------------ */
  var COLORS = ['#00e0e0', '#128a86', '#ffd166', '#ef476f', '#06d6a0', '#ffffff'];

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
  /* 7. Hero image click burst                                           */
  /* ------------------------------------------------------------------ */
  function initHeroBurst() {
    var hero = document.querySelector('.homepage-image');
    if (!hero) { return; }
    hero.classList.add('is-interactive');
    hero.addEventListener('click', function (ev) {
      burst(ev.clientX, ev.clientY, 60, 9);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 8. Konami-code easter egg                                           */
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
    achUnlock('secret');
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
  /* 9. Achievement system (persisted in localStorage)                   */
  /* ------------------------------------------------------------------ */
  var TRIPS = {
    travel_2019_siliconvalley: 'Silicon Valley',
    travel_2022_europe: 'Europe',
    travel_2023_perth: 'Perth',
    travel_2023_usacanada: 'USA & Canada',
    travel_2024_australia: 'Australia',
    travel_2024_germany: 'Germany',
    travel_2025_japan: 'Japan'
  };
  var SECTIONS = ['index', 'experience', 'skills', 'personal', 'travel'];
  var ACHIEVEMENTS = [
    { id: 'explorer', icon: 'fa-compass', title: 'Explorer', desc: 'Visit every section of the site' },
    { id: 'globetrotter', icon: 'fa-globe', title: 'Globetrotter', desc: 'Open all 7 travel journals' },
    { id: 'completionist', icon: 'fa-book', title: 'Completionist', desc: 'Read a travel journal to the end' },
    { id: 'photographer', icon: 'fa-camera-retro', title: "Photographer's Eye", desc: 'View 25 photos in the gallery' },
    { id: 'secret', icon: 'fa-gamepad', title: 'Secret Finder', desc: 'Enter a legendary code' }
  ];
  var STORE_KEY = 'nw-game-v1';
  var state = loadState();

  function loadState() {
    var base = { ach: {}, journals: {}, chapters: {}, pages: {}, photos: 0 };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) { return base; }
      var parsed = JSON.parse(raw);
      for (var k in base) { if (!(k in parsed)) { parsed[k] = base[k]; } }
      return parsed;
    } catch (e) { return base; }
  }

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function pageSlug() {
    var p = window.location.pathname.split('/').pop() || 'index';
    return p.replace(/\.html$/, '') || 'index';
  }

  function achUnlock(id) {
    if (state.ach[id]) { return; }
    state.ach[id] = Date.now();
    saveState();
    var def = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      if (ACHIEVEMENTS[i].id === id) { def = ACHIEVEMENTS[i]; break; }
    }
    toast('🏆 Achievement unlocked — ' + (def ? def.title : id));
    burst(window.innerWidth / 2, window.innerHeight - 60, 45, 8);
    updateAchCount();
    renderAchList();
  }

  function achCount() {
    var n = 0;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) { if (state.ach[ACHIEVEMENTS[i].id]) { n++; } }
    return n;
  }

  var achCountEl = null;
  var achListEl = null;

  function updateAchCount() {
    if (achCountEl) { achCountEl.textContent = achCount() + '/' + ACHIEVEMENTS.length; }
  }

  function renderAchList() {
    if (!achListEl) { return; }
    achListEl.innerHTML = '';
    ACHIEVEMENTS.forEach(function (a) {
      var unlocked = !!state.ach[a.id];
      var li = document.createElement('li');
      li.className = 'ach-item' + (unlocked ? ' is-unlocked' : '');
      li.innerHTML = '<span class="ach-item__icon icon fa ' + (unlocked ? a.icon : 'fa-lock') + '" aria-hidden="true"></span>' +
        '<span class="ach-item__text"><strong>' + a.title + '</strong><em>' +
        (unlocked || a.id !== 'secret' ? a.desc : '???') + '</em></span>';
      achListEl.appendChild(li);
    });
  }

  function initAchievements() {
    var slug = pageSlug();
    if (SECTIONS.indexOf(slug) !== -1) { state.pages[slug] = 1; }
    if (TRIPS[slug]) { state.journals[slug] = 1; }
    saveState();

    // Trophy toggle + drawer, fixed bottom-left on every page.
    var toggle = document.createElement('button');
    toggle.className = 'ach-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Achievements');
    toggle.innerHTML = '<span class="icon fa fa-trophy" aria-hidden="true"></span><span class="ach-toggle__count"></span>';
    var drawer = document.createElement('aside');
    drawer.className = 'ach-drawer';
    drawer.hidden = true;
    drawer.setAttribute('aria-label', 'Achievements');
    drawer.innerHTML = '<h4>Achievements</h4><ul class="ach-list"></ul>';
    document.body.appendChild(toggle);
    document.body.appendChild(drawer);
    achCountEl = toggle.querySelector('.ach-toggle__count');
    achListEl = drawer.querySelector('.ach-list');
    updateAchCount();
    renderAchList();
    toggle.addEventListener('click', function () {
      var open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!drawer.hidden && !drawer.contains(e.target) && !toggle.contains(e.target)) {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Evaluate cross-page achievements on arrival.
    var allPages = SECTIONS.every(function (s) { return state.pages[s]; });
    if (allPages) { achUnlock('explorer'); }
    var allTrips = Object.keys(TRIPS).every(function (t) { return state.journals[t]; });
    if (allTrips) { achUnlock('globetrotter'); }
  }

  /* ------------------------------------------------------------------ */
  /* 10. Travel quest log: progress meter + visited stamps               */
  /* ------------------------------------------------------------------ */
  function initQuestLog() {
    var grid = document.querySelector('.travel-grid');
    if (!grid || pageSlug() !== 'travel') { return; }

    var read = Object.keys(TRIPS).filter(function (t) { return state.journals[t]; }).length;
    var total = Object.keys(TRIPS).length;
    var pct = Math.round((read / total) * 100);

    var log = document.createElement('div');
    log.className = 'quest-log';
    log.innerHTML = '<span class="quest-log__eyebrow"><span class="icon fa fa-map-marker" aria-hidden="true"></span> Quest log</span>' +
      '<div class="quest-log__row">' +
      '<div class="xp-bar"><span class="xp-bar__track"><span class="xp-bar__fill" data-pct="' + pct + '" style="width:' + (reduce ? pct + '%' : '0%') + '"></span></span>' +
      '<span class="xp-bar__label">' + read + '/' + total + ' journals</span></div>' +
      '<span class="quest-log__meta">7 trips · 9 countries</span></div>';
    grid.parentNode.insertBefore(log, grid);
    if (!reduce) {
      var fill = log.querySelector('.xp-bar__fill');
      onVisible(fill.parentNode, function () { fill.style.width = fill.getAttribute('data-pct') + '%'; }, 0.5);
    }

    // Stamp cards whose journals have been opened.
    var links = grid.querySelectorAll('a[href]');
    var stamped = {};
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href').replace(/\.html$/, '');
      if (state.journals[href] && TRIPS[href]) {
        var card = links[i];
        while (card && !(card.classList && card.classList.contains('travel-card'))) { card = card.parentNode; }
        if (card && !stamped[href]) {
          stamped[href] = 1;
          card.classList.add('is-visited');
          var stamp = document.createElement('span');
          stamp.className = 'travel-stamp';
          stamp.textContent = 'VISITED';
          card.appendChild(stamp);
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 11. Journal reading progress + chapter complete                     */
  /* ------------------------------------------------------------------ */
  function initReadProgress() {
    var slug = pageSlug();
    if (!TRIPS[slug]) { return; }

    var bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.innerHTML = '<span class="read-progress__fill"></span>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;
    var done = false;

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(window.scrollY / max, 1) : 1;
      fill.style.width = (pct * 100) + '%';
      if (pct >= 0.97 && !done) {
        done = true;
        if (!state.chapters[slug]) {
          state.chapters[slug] = 1;
          saveState();
          toast('📖 Chapter complete — ' + TRIPS[slug] + ' ✓');
          burst(window.innerWidth / 2, window.innerHeight * 0.5, 70, 9);
          achUnlock('completionist');
        }
      }
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* 12. Lightbox photo-view tracking                                    */
  /* ------------------------------------------------------------------ */
  function initPhotoTracking() {
    if (!('MutationObserver' in window)) { return; }
    var seen = {};
    // gallery.js appends the lightbox lazily; watch for the image's src swaps.
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (t.className === 'lightbox__image' && t.src && !seen[t.src]) {
          seen[t.src] = 1;
          state.photos = (state.photos || 0) + 1;
          saveState();
          if (state.photos >= 25) { achUnlock('photographer'); }
        }
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['src'], subtree: true });
  }
})();
