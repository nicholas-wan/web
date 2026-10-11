/* Small travel bootstrap: six postcards now, search and atlas at point of use. */
(function () {
  'use strict';
  var form = document.getElementById('photo-search'), input = form.q;
  var status = document.getElementById('photo-search-status');
  var retry = document.getElementById('photo-search-retry');
  var script, ready = false, old = [], key = 'photo-search-explore';
  var seeds = Array.from(document.getElementById('photo-explore-seeds').content.children);
  try { old = JSON.parse(sessionStorage.getItem(key)) || []; } catch (e) {}
  if (!Array.isArray(old)) old = [];
  var pool = seeds.filter(function (a) { return old.slice(0, 6).indexOf(a.dataset.tag) < 0; });
  var cards = [];
  while (pool.length && cards.length < 6) cards.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].cloneNode(true));
  document.querySelectorAll('[data-explore-action], .photo-explore__hint').forEach(function (b) { b.hidden = false; });
  var cardGrid = document.querySelector('.photo-explore__cards');
  var cardWidth = parseFloat(getComputedStyle(cardGrid).gridTemplateColumns) - 2;
  cards.forEach(function (a) { a.querySelector('img').sizes = Math.max(1, cardWidth) + 'px'; });
  cardGrid.replaceChildren.apply(cardGrid, cards);
  var imageObserver = new ResizeObserver(function () {
    document.querySelectorAll('.photo-explore__cards img, .photo-moment__content img').forEach(function (img) {
      var width = img.getBoundingClientRect().width;
      if (width) img.sizes = width + 'px';
    });
  });
  imageObserver.observe(cardGrid);
  imageObserver.observe(document.querySelector('.photo-moment__content'));
  // Only attached, initially visible images are eager; template images stay inert.
  cards.forEach(function (a) {
    var img = a.querySelector('img'), box = img.getBoundingClientRect();
    if (box.top < innerHeight && box.bottom > 0) img.loading = 'eager';
  });
  try { sessionStorage.setItem(key, JSON.stringify(cards.map(function (a) { return a.dataset.tag; }))); } catch (e) {}
  function send() { form.dispatchEvent(new Event('explore')); }
  function loadSearch() {
    if (script) return;
    retry.setAttribute('aria-disabled', 'true');
    script = document.createElement('script');
    script.src = form.dataset.searchScript;
    script.onload = function () { ready = true; send(); };
    script.onerror = function () {
      script.remove(); script = null;
      status.textContent = 'Photo search is unavailable right now.';
      retry.removeAttribute('aria-disabled');
      retry.hidden = false;
    };
    document.body.appendChild(script);
  }
  retry.addEventListener('click', function () {
    if (ready) form.dispatchEvent(new Event('retry-search'));
    else { status.textContent = 'Loading photos…'; loadSearch(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-explore-action]');
    if (!b || b.disabled || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    form.dataset.exploreIntent = b.dataset.exploreAction === 'tag' ? 'tag:' + b.dataset.tag : b.dataset.exploreAction;
    status.textContent = 'Loading photos…';
    if (ready) send(); else loadSearch();
  });
  if (/[?&]q=/.test(location.search)) loadSearch();
  input.onfocus = input.onpointerdown = input.onkeydown = loadSearch;
  input.oninput = function () { delete form.dataset.exploreIntent; };
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) {
      e.preventDefault(); input.focus();
    }
  });

  var atlas = document.querySelector('.travel-atlas__layout'), mapScript, mapReady = false, pending;
  form.addEventListener('focusin', function () { pending = null; });
  var mapStatus = atlas.querySelector('.travel-map__status');
  function loadMap() {
    if (mapScript || mapReady) return;
    atlas.setAttribute('aria-busy', 'true');
    mapScript = document.createElement('script');
    mapScript.src = atlas.dataset.mapScript;
    mapScript.onload = function () {
      mapReady = true;
      atlas.removeAttribute('aria-busy');
      if (observer) observer.disconnect();
      if (pending && !atlas.hidden) { var action = pending; pending = null; action(); }
    };
    mapScript.onerror = function () {
      mapScript.remove(); mapScript = null; pending = null;
      atlas.removeAttribute('aria-busy');
      mapStatus.textContent = 'Map unavailable. Select a map control to try again, or browse the journals below.';
    };
    document.body.appendChild(mapScript);
  }
  // Warm on approach or focus, and replay an early activation after initialization.
  atlas.addEventListener('pointerdown', loadMap, true);
  atlas.addEventListener('focusin', loadMap);
  atlas.addEventListener('keydown', function (e) {
    if (mapReady || !(e.target.matches('.travel-map__viewport, [role="button"]')) ||
        !/^(Enter| |ArrowLeft|ArrowRight|ArrowUp|ArrowDown|\+|-|0)$/.test(e.key)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    pending = function () { e.target.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true })); };
    loadMap();
  }, true);
  ['click', 'change'].forEach(function (type) {
    atlas.addEventListener(type, function (e) {
      if (mapReady || e.target.closest('a')) return;
      var target = e.target;
      e.preventDefault(); e.stopImmediatePropagation();
      pending = function () {
        var marker = target.closest('.travel-map__marker');
        if (marker && type === 'click') marker.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        else target.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      };
      loadMap();
    }, true);
  });
  var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    if (!atlas.hidden && entries.some(function (entry) { return entry.isIntersecting; })) loadMap();
  }, { rootMargin: '120px' }) : null;
  if (observer) observer.observe(atlas); else loadMap();
}());
