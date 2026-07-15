/* Travel map zoom + pan. The wheel zooms whenever the pointer is over the map;
   at either zoom limit the page is allowed to continue scrolling. Buttons,
   double-click, drag, and touch pinch remain available. Markers counter-scale
   so pins and popups keep their screen size. */
(function () {
  var viewport = document.querySelector('.travel-map__viewport');
  if (!viewport || typeof window.PointerEvent !== 'function') return;

  var map = viewport.closest('.travel-map');
  var canvas = viewport.querySelector('.travel-map__canvas');
  var controls = map ? map.querySelector('.travel-map__controls') : null;
  if (!canvas || !controls) return;

  var MIN_SCALE = 1;
  var MAX_SCALE = 7;
  var BUTTON_STEP = 1.5;
  var AREA_SCALE = 2.2;
  var STOP_SCALE = 4.2;

  /* Semantic zoom keeps the world view calm, then progressively reveals the
     same destinations already linked from each regional popup. Coordinates
     are percentages of the map artwork, so they stay attached while panning. */
  var DETAIL_POINTS = [
    /* Countries, states and larger areas. */
    ['area', 'California', 'travel_2019_siliconvalley#trip-section-1', 15.3, 43.4],
    ['area', 'Nevada', 'travel_2019_siliconvalley#trip-section-4', 17.2, 45.0],
    ['area', 'New York', 'travel_2023_usacanada#trip-section-2', 27.0, 41.7],
    ['area', 'Massachusetts', 'travel_2023_usacanada#trip-section-6', 28.0, 39.7],
    ['area', 'Washington D.C.', 'travel_2023_usacanada#trip-section-13', 25.8, 44.5],
    ['area', 'Ontario', 'travel_2023_usacanada#trip-section-8', 24.6, 34.0],
    ['area', 'France', 'travel_2022_europe#trip-section-2', 49.0, 41.3],
    ['area', 'Belgium', 'travel_2022_europe#trip-section-3', 49.8, 39.3],
    ['area', 'Netherlands', 'travel_2022_europe#trip-section-4', 50.4, 37.4],
    ['area', 'Germany', 'travel_2022_europe#trip-section-5', 51.4, 39.7],
    ['area', 'Switzerland', 'travel_2022_europe#trip-section-7', 50.7, 42.5],
    ['area', 'North Rhine-Westphalia', 'travel_2024_germany#trip-section-1', 52.6, 34.2],
    ['area', 'Honshu', 'travel_2025_japan#trip-section-1', 87.2, 38.2],
    ['area', 'Guangdong', 'travel_2026_guangzhou#trip-section-1', 81.6, 50.0],
    ['area', 'Western Australia', 'travel_2023_perth#trip-section-9', 78.7, 78.0],
    ['area', 'Victoria', 'travel_2024_australia#trip-section-1', 86.7, 82.7],
    ['area', 'New South Wales', 'travel_2024_australia#trip-section-6', 90.1, 77.8],

    /* Individual journal stops. */
    ['stop', 'Silicon Valley', 'travel_2019_siliconvalley#trip-section-1', 15.5, 44.3],
    ['stop', 'San Francisco', 'travel_2019_siliconvalley#trip-section-2', 15.0, 43.3],
    ['stop', 'Monterey', 'travel_2019_siliconvalley#trip-section-3', 15.1, 46.0],
    ['stop', 'Las Vegas', 'travel_2019_siliconvalley#trip-section-4', 17.3, 46.1],
    ['stop', 'Los Angeles', 'travel_2019_siliconvalley#trip-section-5', 15.8, 47.7],
    ['stop', 'New York', 'travel_2023_usacanada#trip-section-2', 27.0, 41.8],
    ['stop', 'Boston', 'travel_2023_usacanada#trip-section-6', 28.1, 39.7],
    ['stop', 'Washington D.C.', 'travel_2023_usacanada#trip-section-13', 25.8, 44.6],
    ['stop', 'Niagara Falls', 'travel_2023_usacanada#trip-section-8', 25.2, 37.5],
    ['stop', 'Toronto', 'travel_2023_usacanada#trip-section-11', 25.7, 35.6],
    ['stop', 'Paris', 'travel_2022_europe#trip-section-2', 49.0, 41.0],
    ['stop', 'Brussels', 'travel_2022_europe#trip-section-3', 49.8, 39.4],
    ['stop', 'Amsterdam', 'travel_2022_europe#trip-section-4', 50.4, 37.6],
    ['stop', 'Cologne · 2022', 'travel_2022_europe#trip-section-5', 51.1, 39.2],
    ['stop', 'Heidelberg', 'travel_2022_europe#trip-section-6', 51.5, 40.8],
    ['stop', 'Lucerne', 'travel_2022_europe#trip-section-7', 50.5, 43.1],
    ['stop', 'Zurich', 'travel_2022_europe#trip-section-8', 51.3, 42.4],
    ['stop', 'Kalkar', 'travel_2024_germany#trip-section-1', 51.8, 32.9],
    ['stop', 'Xanten', 'travel_2024_germany#trip-section-2', 52.4, 32.5],
    ['stop', 'Kleve', 'travel_2024_germany#trip-section-3', 53.0, 33.0],
    ['stop', 'Cologne · 2024', 'travel_2024_germany#trip-section-4', 53.5, 34.0],
    ['stop', 'Essen', 'travel_2024_germany#trip-section-5', 53.2, 35.1],
    ['stop', 'Rees', 'travel_2024_germany#trip-section-6', 52.4, 35.7],
    ['stop', 'Düsseldorf', 'travel_2024_germany#trip-section-7', 51.6, 35.3],
    ['stop', 'Duisburg', 'travel_2024_germany#trip-section-8', 51.2, 34.2],
    ['stop', 'Hiroshima', 'travel_2025_japan#trip-section-1', 85.8, 40.4],
    ['stop', 'Osaka & Nara', 'travel_2025_japan#trip-section-2', 86.6, 39.4],
    ['stop', 'Kyoto', 'travel_2025_japan#trip-section-3', 86.6, 38.4],
    ['stop', 'Nagoya', 'travel_2025_japan#trip-section-4', 87.3, 38.2],
    ['stop', 'Tokyo', 'travel_2025_japan#trip-section-5', 88.2, 37.0],
    ['stop', 'Old Guangzhou', 'travel_2026_guangzhou#trip-section-1', 81.1, 50.1],
    ['stop', 'Yongqingfang', 'travel_2026_guangzhou#trip-section-2', 81.4, 49.4],
    ['stop', 'Chimelong', 'travel_2026_guangzhou#trip-section-3', 81.8, 50.6],
    ['stop', 'Baiyun Mountain', 'travel_2026_guangzhou#trip-section-4', 81.9, 49.1],
    ['stop', 'Canton Tower', 'travel_2026_guangzhou#trip-section-5', 82.2, 49.9],
    ['stop', 'Fremantle', 'travel_2023_perth#trip-section-2', 78.7, 80.4],
    ['stop', 'Rottnest Island', 'travel_2023_perth#trip-section-3', 78.0, 79.6],
    ['stop', 'Caversham', 'travel_2023_perth#trip-section-4', 79.3, 79.2],
    ['stop', 'York & Hyden', 'travel_2023_perth#trip-section-5', 80.5, 78.3],
    ['stop', 'Cervantes & Geraldton', 'travel_2023_perth#trip-section-6', 78.8, 76.4],
    ['stop', 'Kalbarri', 'travel_2023_perth#trip-section-7', 77.9, 74.4],
    ['stop', 'Greenough & Lancelin', 'travel_2023_perth#trip-section-8', 79.4, 75.3],
    ['stop', 'Perth', 'travel_2023_perth#trip-section-9', 79.3, 78.3],
    ['stop', 'Melbourne', 'travel_2024_australia#trip-section-1', 86.9, 82.8],
    ['stop', 'Phillip Island', 'travel_2024_australia#trip-section-2', 87.5, 84.0],
    ['stop', 'Great Ocean Road', 'travel_2024_australia#trip-section-3', 85.9, 84.0],
    ['stop', 'Werribee', 'travel_2024_australia#trip-section-4', 86.4, 82.1],
    ['stop', 'Grampians', 'travel_2024_australia#trip-section-5', 85.5, 81.4],
    ['stop', 'Sydney', 'travel_2024_australia#trip-section-6', 90.2, 78.0],
    ['stop', 'Blue Mountains', 'travel_2024_australia#trip-section-7', 89.4, 77.0],
    ['stop', 'Taronga Zoo', 'travel_2024_australia#trip-section-8', 90.6, 77.3],
    ['stop', 'Wollongong', 'travel_2024_australia#trip-section-9', 90.1, 79.5],
    ['stop', 'SEA LIFE Aquarium', 'travel_2024_australia#trip-section-10', 89.7, 78.8]
  ];

  var scale = 1;
  var tx = 0;
  var ty = 0;

  var zoomInBtn = controls.querySelector('[data-map-zoom="in"]');
  var zoomOutBtn = controls.querySelector('[data-map-zoom="out"]');
  var resetBtn = controls.querySelector('[data-map-zoom="reset"]');
  var detailLinks = [];
  var regionMarkers = Array.prototype.slice.call(canvas.querySelectorAll('.travel-map__marker'));
  var detailLevel = '';
  var status = map.querySelector('.travel-map__status');

  var createDetailPoints = function () {
    var layer = document.createElement('div');
    layer.className = 'travel-map__detail-layer';
    DETAIL_POINTS.forEach(function (point, index) {
      var link = document.createElement('a');
      link.className = 'travel-map__detail travel-map__detail--' + point[0];
      link.href = point[2];
      link.style.left = point[3] + '%';
      link.style.top = point[4] + '%';
      link.setAttribute('data-map-level', point[0]);
      link.setAttribute('data-label-side', index % 3 === 0 ? 'left' : (index % 3 === 1 ? 'right' : 'below'));
      link.setAttribute('aria-label', 'Open ' + point[1] + ' in its travel journal');
      link.setAttribute('tabindex', '-1');

      var dot = document.createElement('span');
      dot.className = 'travel-map__detail-dot';
      dot.setAttribute('aria-hidden', 'true');
      var label = document.createElement('span');
      label.className = 'travel-map__detail-label';
      label.textContent = point[1];
      link.appendChild(dot);
      link.appendChild(label);
      layer.appendChild(link);
      detailLinks.push(link);
    });
    canvas.appendChild(layer);
  };

  var updateDetailLevel = function () {
    var nextLevel = scale >= STOP_SCALE ? 'stop' : (scale >= AREA_SCALE ? 'area' : 'region');
    if (nextLevel === detailLevel) return;
    detailLevel = nextLevel;
    canvas.setAttribute('data-map-detail', detailLevel);
    detailLinks.forEach(function (link) {
      link.setAttribute('tabindex', link.getAttribute('data-map-level') === detailLevel ? '0' : '-1');
    });
    regionMarkers.forEach(function (marker) {
      marker.setAttribute('tabindex', detailLevel === 'region' ? '0' : '-1');
    });
    if (status) {
      status.textContent = detailLevel === 'region'
        ? 'Regional view'
        : (detailLevel === 'area' ? 'Country and state view' : 'City and journal stop view');
    }
  };

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
    updateDetailLevel();
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

  /* Wheel and trackpad scrolling zoom around the pointer. Once the map reaches
     either limit, that same-direction gesture returns to normal page scroll. */
  viewport.addEventListener('wheel', function (event) {
    if (event.target.closest('.travel-map__controls')) return;
    var nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * Math.exp(-event.deltaY * 0.0018)));
    if (Math.abs(nextScale - scale) < 0.001) return;
    event.preventDefault();
    var rect = viewport.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, nextScale);
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
    var marker = event.target.closest('.travel-map__marker, .travel-map__detail');
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
  createDetailPoints();
  apply();
}());
