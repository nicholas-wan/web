/* Travel map zoom + pan. Pointer-events based: Ctrl/Cmd + wheel (and trackpad
   pinch) zooms, buttons zoom, double-click zooms in, one-finger/mouse drag pans
   while zoomed, two-finger pinch zooms on touch. Markers counter-scale via the
   --map-scale custom property so pins and popups keep their screen size. */
(function () {
  var viewport = document.querySelector('.travel-map__viewport');
  if (!viewport || typeof window.PointerEvent !== 'function') return;

  var map = viewport.closest('.travel-map');
  var canvas = viewport.querySelector('.travel-map__canvas');
  var controls = map ? map.querySelector('.travel-map__controls') : null;
  if (!canvas || !controls) return;

  var MIN_SCALE = 1;
  var MAX_SCALE = 4;
  var BUTTON_STEP = 1.5;

  var scale = 1;
  var tx = 0;
  var ty = 0;

  var zoomInBtn = controls.querySelector('[data-map-zoom="in"]');
  var zoomOutBtn = controls.querySelector('[data-map-zoom="out"]');
  var resetBtn = controls.querySelector('[data-map-zoom="reset"]');

  var clamp = function () {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    var minX = viewport.clientWidth - canvas.offsetWidth * scale;
    var minY = viewport.clientHeight - canvas.offsetHeight * scale;
    tx = Math.min(0, Math.max(minX, tx));
    ty = Math.min(0, Math.max(minY, ty));
  };

  var apply = function () {
    clamp();
    var zoomed = scale > 1.001;
    canvas.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
    canvas.style.setProperty('--map-scale', scale);
    viewport.classList.toggle('is-zoomed', zoomed);
    /* While zoomed the map owns touch gestures; at rest the page scrolls. */
    viewport.style.touchAction = zoomed ? 'none' : 'pan-y';
    if (zoomInBtn) zoomInBtn.disabled = scale >= MAX_SCALE - 0.001;
    if (zoomOutBtn) zoomOutBtn.disabled = !zoomed;
    if (resetBtn) resetBtn.hidden = !zoomed;
  };

  /* Zoom keeping the viewport point (px, py) anchored. */
  var zoomAt = function (px, py, nextScale) {
    nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    var ratio = nextScale / scale;
    tx = px - (px - tx) * ratio;
    ty = py - (py - ty) * ratio;
    scale = nextScale;
    if (scale <= 1.001) { tx = 0; ty = 0; }
    apply();
  };

  var zoomAtCenter = function (factor) {
    zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, scale * factor);
  };

  controls.addEventListener('click', function (event) {
    var button = event.target.closest('[data-map-zoom]');
    if (!button) return;
    var mode = button.getAttribute('data-map-zoom');
    if (mode === 'in') zoomAtCenter(BUTTON_STEP);
    else if (mode === 'out') zoomAtCenter(1 / BUTTON_STEP);
    else { scale = 1; tx = 0; ty = 0; apply(); }
  });

  /* Ctrl/Cmd + wheel zooms (trackpad pinches arrive as ctrlKey wheels). A bare
     wheel keeps scrolling the page, with a short hint so the gesture is
     discoverable. */
  var hint = document.createElement('div');
  hint.className = 'travel-map__wheel-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'Use Ctrl + scroll to zoom the map';
  viewport.appendChild(hint);
  var hintTimer = null;

  viewport.addEventListener('wheel', function (event) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      var rect = viewport.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, scale * Math.exp(-event.deltaY * 0.0022));
    } else if (scale > 1.001) {
      hint.classList.add('is-visible');
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(function () { hint.classList.remove('is-visible'); }, 1200);
    }
  }, { passive: false });

  viewport.addEventListener('dblclick', function (event) {
    if (event.target.closest('.travel-map__controls')) return;
    event.preventDefault();
    var rect = viewport.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, scale * 1.6);
  });

  /* Drag to pan + two-pointer pinch. */
  var pointers = new Map();
  var pinchStart = null;
  var dragMoved = false;
  var dragDistance = 0;

  var pinchInfo = function () {
    var pts = Array.from(pointers.values());
    return {
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
      cx: (pts[0].x + pts[1].x) / 2,
      cy: (pts[0].y + pts[1].y) / 2
    };
  };

  viewport.addEventListener('pointerdown', function (event) {
    if (event.target.closest('.travel-map__controls')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      var info = pinchInfo();
      pinchStart = { dist: info.dist, scale: scale };
    }
    if (pointers.size === 1) { dragMoved = false; dragDistance = 0; }
    if (scale > 1.001 || pointers.size === 2) viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', function (event) {
    var prev = pointers.get(event.pointerId);
    if (!prev) return;
    var next = { x: event.clientX, y: event.clientY };

    if (pointers.size === 2 && pinchStart) {
      pointers.set(event.pointerId, next);
      var info = pinchInfo();
      var rect = viewport.getBoundingClientRect();
      zoomAt(info.cx - rect.left, info.cy - rect.top, pinchStart.scale * (info.dist / pinchStart.dist));
      return;
    }

    if (pointers.size === 1 && scale > 1.001) {
      tx += next.x - prev.x;
      ty += next.y - prev.y;
      dragDistance += Math.abs(next.x - prev.x) + Math.abs(next.y - prev.y);
      /* Threshold keeps a slightly-jittery tap on a marker working. */
      if (dragDistance > 5) dragMoved = true;
      pointers.set(event.pointerId, next);
      apply();
    }
  });

  var releasePointer = function (event) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
    /* The drag's own click (if any) fires synchronously after pointerup;
       clear the flag afterwards so it can't swallow a later, unrelated click. */
    window.setTimeout(function () { dragMoved = false; }, 0);
  };
  viewport.addEventListener('pointerup', releasePointer);
  viewport.addEventListener('pointercancel', releasePointer);

  /* A pan drag must not activate the marker/link underneath on release. */
  viewport.addEventListener('click', function (event) {
    if (!dragMoved) return;
    dragMoved = false;
    if (event.target.closest('.travel-map__controls')) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  /* Keyboard focus moving to an off-screen marker: the browser nudges
     scrollLeft/scrollTop on the overflow-hidden viewport, which desyncs the
     transform. Undo that and pan the marker into view instead. */
  viewport.addEventListener('focusin', function (event) {
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
    var marker = event.target.closest('.travel-map__marker');
    if (!marker || scale <= 1.001) return;
    var markerX = (marker.offsetLeft) * scale + tx;
    var markerY = (marker.offsetTop) * scale + ty;
    var pad = 40;
    if (markerX < pad) tx += pad - markerX;
    else if (markerX > viewport.clientWidth - pad) tx -= markerX - (viewport.clientWidth - pad);
    if (markerY < pad) ty += pad - markerY;
    else if (markerY > viewport.clientHeight - pad) ty -= markerY - (viewport.clientHeight - pad);
    apply();
  });

  window.addEventListener('resize', apply);
  apply();
}());
