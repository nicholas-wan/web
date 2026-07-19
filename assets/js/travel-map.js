/* Travel map zoom + pan. The wheel zooms whenever the pointer is over the map;
   at either zoom limit the page is allowed to continue scrolling. Buttons,
   double-click, drag, and touch pinch remain available. Markers counter-scale
   so pins and popups keep their screen size. */
(function () {
  var viewport = document.querySelector('.travel-map__viewport');
  if (!viewport || typeof window.PointerEvent !== 'function') return;

  var map = viewport.closest('.travel-map');
  var canvas = viewport.querySelector('.travel-map__canvas');
  var mapImage = canvas ? canvas.querySelector('img') : null;
  var controls = map ? map.querySelector('.travel-map__controls') : null;
  if (!canvas || !controls) return;

  var MIN_SCALE = 1;
  var MAX_SCALE = 10;
  var DESKTOP_INITIAL_SCALE = 1.12;
  /* The zoom-out floor is the opening view, not the raw world map: the desktop
     crop exists to hide the empty polar margins, so zooming out past it only
     reveals blank space. Tracks the breakpoint via resetView. */
  var minScale = MIN_SCALE;
  var BUTTON_STEP = 1.5;
  var AREA_SCALE = 2.2;
  var STOP_SCALE = 4.2;

  /* Semantic zoom keeps the world view calm, then progressively reveals
     map-scale destinations. Latitude/longitude is projected with the same
     Natural Earth 1 projection used by tools/maps/generate-world-map.ps1. */
  var DETAIL_POINTS = [
    /* Countries, states and larger areas. */
    ['area', 'California', 'travel_2019_siliconvalley#trip-section-1', 36.7783, -119.4179],
    ['area', 'Nevada', 'travel_2019_siliconvalley#trip-section-4', 38.8026, -116.4194],
    ['area', 'New York', 'travel_2023_usacanada#trip-section-2', 42.9538, -75.5268],
    ['area', 'Massachusetts', 'travel_2023_usacanada#trip-section-6', 42.4072, -71.3824],
    ['area', 'Washington D.C.', 'travel_2023_usacanada#trip-section-14', 38.9072, -77.0369],
    ['area', 'Ontario', 'travel_2023_usacanada#trip-section-9', 50.0, -85.0],
    ['area', 'France', 'travel_2022_europe#trip-section-2', 46.2276, 2.2137],
    ['area', 'Belgium', 'travel_2022_europe#trip-section-3', 50.5039, 4.4699],
    ['area', 'Netherlands', 'travel_2022_europe#trip-section-4', 52.1326, 5.2913],
    ['area', 'Germany', 'travel_2022_europe#trip-section-5', 51.1657, 10.4515],
    ['area', 'Switzerland', 'travel_2022_europe#trip-section-7', 46.8182, 8.2275],
    ['area', 'North Rhine-Westphalia', 'travel_2024_germany#trip-section-1', 51.4332, 7.6616],
    ['area', 'Honshu', 'travel_2025_japan#trip-section-1', 36.5, 138.0],
    ['area', 'Guangdong', 'travel_2026_guangzhou#trip-section-1', 23.379, 113.763],
    ['area', 'Western Australia', 'travel_2023_perth#trip-section-2', -25.2744, 122.2983],
    ['area', 'Victoria', 'travel_2024_australia#trip-section-1', -37.4713, 144.7852],
    ['area', 'New South Wales', 'travel_2024_australia#trip-section-6', -31.2532, 146.9211],

    /* Individual journal stops at a useful world-map scale. */
    ['stop', 'Silicon Valley', 'travel_2019_siliconvalley#trip-section-1', 37.3875, -122.0575],
    ['stop', 'San Francisco', 'travel_2019_siliconvalley#trip-section-2', 37.7749, -122.4194],
    ['stop', 'Monterey', 'travel_2019_siliconvalley#trip-section-3', 36.6002, -121.8947],
    ['stop', 'Las Vegas', 'travel_2019_siliconvalley#trip-section-4', 36.1699, -115.1398],
    ['stop', 'Los Angeles', 'travel_2019_siliconvalley#trip-section-5', 34.0522, -118.2437],
    ['stop', 'New York City', 'travel_2023_usacanada#trip-section-2', 40.7128, -74.006],
    ['stop', 'Boston', 'travel_2023_usacanada#trip-section-6', 42.3601, -71.0589],
    ['stop', 'Washington D.C.', 'travel_2023_usacanada#trip-section-14', 38.9072, -77.0369],
    ['stop', 'Niagara Falls', 'travel_2023_usacanada#trip-section-9', 43.0962, -79.0377],
    ['stop', 'Toronto', 'travel_2023_usacanada#trip-section-11', 43.6532, -79.3832],
    ['stop', 'Paris', 'travel_2022_europe#trip-section-2', 48.8566, 2.3522],
    ['stop', 'Brussels', 'travel_2022_europe#trip-section-3', 50.8503, 4.3517],
    ['stop', 'Amsterdam', 'travel_2022_europe#trip-section-4', 52.3676, 4.9041],
    ['stop', 'Cologne · 2022', 'travel_2022_europe#trip-section-5', 50.9375, 6.9603],
    ['stop', 'Heidelberg', 'travel_2022_europe#trip-section-6', 49.3988, 8.6724],
    ['stop', 'Lucerne', 'travel_2022_europe#trip-section-7', 47.0502, 8.3093],
    ['stop', 'Zurich', 'travel_2022_europe#trip-section-8', 47.3769, 8.5417],
    ['stop', 'Kalkar', 'travel_2024_germany#trip-section-1', 51.7391, 6.2912],
    ['stop', 'Xanten', 'travel_2024_germany#trip-section-2', 51.6626, 6.4543],
    ['stop', 'Kleve', 'travel_2024_germany#trip-section-3', 51.7883, 6.1387],
    ['stop', 'Cologne · 2024', 'travel_2024_germany#trip-section-4', 50.9375, 6.9603],
    ['stop', 'Essen', 'travel_2024_germany#trip-section-5', 51.4556, 7.0116],
    ['stop', 'Rees', 'travel_2024_germany#trip-section-6', 51.7579, 6.3973],
    ['stop', 'Düsseldorf', 'travel_2024_germany#trip-section-7', 51.2277, 6.7735],
    ['stop', 'Duisburg', 'travel_2024_germany#trip-section-8', 51.4344, 6.7623],
    ['stop', 'Hiroshima', 'travel_2025_japan#trip-section-1', 34.3853, 132.4553],
    ['stop', 'Osaka & Nara', 'travel_2025_japan#trip-section-2', 34.6937, 135.5023],
    ['stop', 'Kyoto', 'travel_2025_japan#trip-section-3', 35.0116, 135.7681],
    ['stop', 'Nagoya', 'travel_2025_japan#trip-section-4', 35.1815, 136.9066],
    ['stop', 'Tokyo', 'travel_2025_japan#trip-section-5', 35.6762, 139.6503],
    ['stop', 'Guangzhou', 'travel_2026_guangzhou#trip-section-1', 23.1291, 113.2644],
    ['stop', 'Fremantle', 'travel_2023_perth#trip-section-2', -32.0569, 115.7439],
    ['stop', 'Rottnest Island', 'travel_2023_perth#trip-section-3', -32.0069, 115.5393],
    ['stop', 'Caversham', 'travel_2023_perth#trip-section-4', -31.875, 115.97],
    ['stop', 'Hyden', 'travel_2023_perth#trip-section-5', -32.443, 118.897],
    ['stop', 'Geraldton', 'travel_2023_perth#trip-section-6', -28.777, 114.614],
    ['stop', 'Kalbarri', 'travel_2023_perth#trip-section-7', -27.710, 114.165],
    ['stop', 'Greenough', 'travel_2023_perth#trip-section-8', -28.95, 114.73],
    ['stop', 'Perth', 'travel_2023_perth#trip-section-9', -31.9523, 115.8613],
    ['stop', 'Melbourne', 'travel_2024_australia#trip-section-1', -37.8136, 144.9631],
    ['stop', 'Phillip Island', 'travel_2024_australia#trip-section-2', -38.4835, 145.2310],
    ['stop', 'Great Ocean Road', 'travel_2024_australia#trip-section-3', -38.665, 143.105],
    ['stop', 'Werribee', 'travel_2024_australia#trip-section-4', -37.8999, 144.6611],
    ['stop', 'Grampians', 'travel_2024_australia#trip-section-5', -37.258, 142.481],
    ['stop', 'Sydney', 'travel_2024_australia#trip-section-6', -33.8688, 151.2093],
    ['stop', 'Blue Mountains', 'travel_2024_australia#trip-section-7', -33.712, 150.311],
    ['stop', 'Wollongong', 'travel_2024_australia#trip-section-9', -34.4278, 150.8931]
  ];

  var X_MAX = Math.PI * 0.8707;
  var POLE = Math.PI / 2;
  var POLE_2 = POLE * POLE;
  var POLE_4 = POLE_2 * POLE_2;
  var Y_MAX = POLE * (1.007226 + POLE_2 * (0.015085 + POLE_4 * (-0.044475 + 0.028874 * POLE_2 - 0.005916 * POLE_4)));

  var projectCoordinate = function (latitude, longitude) {
    var lambda = longitude * Math.PI / 180;
    var phi = latitude * Math.PI / 180;
    var phi2 = phi * phi;
    var phi4 = phi2 * phi2;
    var rawX = lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4)));
    var rawY = phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
    return { x: (rawX + X_MAX) / (2 * X_MAX) * 100, y: (Y_MAX - rawY) / (2 * Y_MAX) * 100 };
  };

  var scale = 1;
  var tx = 0;
  var ty = 0;

  var zoomInBtn = controls.querySelector('[data-map-zoom="in"]');
  var zoomOutBtn = controls.querySelector('[data-map-zoom="out"]');
  var resetBtn = controls.querySelector('[data-map-zoom="reset"]');
  var teaser = document.querySelector('[data-map-open]');
  var closeBtn = map.querySelector('[data-map-close]');
  var regionsBar = map.querySelector('.travel-map__regions');
  var mobileMapQuery = window.matchMedia('(max-width: 520px)');
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isFullscreen = false;
  var lastFocused = null;
  var flyFrame = 0;
  var detailLinks = [];
  var regionMarkers = Array.prototype.slice.call(canvas.querySelectorAll('.travel-map__marker'));
  var detailLevel = '';
  var labelLayoutFrame = 0;
  var labelLayoutTimer = 0;
  var applyFrame = 0;
  var status = map.querySelector('.travel-map__status');

  var positionRegionMarkers = function () {
    regionMarkers.forEach(function (marker) {
      var point = projectCoordinate(
        parseFloat(marker.getAttribute('data-map-lat')),
        parseFloat(marker.getAttribute('data-map-lon'))
      );
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      marker.style.left = point.x + '%';
      marker.style.top = point.y + '%';
    });
  };

  var createDetailPoints = function () {
    var layer = document.createElement('div');
    layer.className = 'travel-map__detail-layer';
    DETAIL_POINTS.forEach(function (point, index) {
      var position = projectCoordinate(point[3], point[4]);
      var link = document.createElement('a');
      link.className = 'travel-map__detail travel-map__detail--' + point[0];
      link.href = point[2];
      link.style.left = position.x + '%';
      link.style.top = position.y + '%';
      link.setAttribute('data-map-level', point[0]);
      link.setAttribute('data-label-order', index.toString());
      link.setAttribute('aria-label', 'Open ' + point[1] + ' in its travel journal');
      link.setAttribute('tabindex', '-1');

      var dot = document.createElement('span');
      dot.className = 'travel-map__detail-dot';
      dot.setAttribute('aria-hidden', 'true');
      var label = document.createElement('span');
      label.className = 'travel-map__detail-label';
      label.textContent = point[1];
      var leader = document.createElement('span');
      leader.className = 'travel-map__detail-leader';
      leader.setAttribute('aria-hidden', 'true');
      link.appendChild(dot);
      link.appendChild(leader);
      link.appendChild(label);
      layer.appendChild(link);
      detailLinks.push(link);
    });
    canvas.appendChild(layer);
  };

  var boxesOverlap = function (first, second, padding) {
    return first.left < second.right + padding && first.right + padding > second.left &&
      first.top < second.bottom + padding && first.bottom + padding > second.top;
  };

  var overlapArea = function (first, second, padding) {
    var width = Math.min(first.right, second.right + padding) - Math.max(first.left, second.left - padding);
    var height = Math.min(first.bottom, second.bottom + padding) - Math.max(first.top, second.top - padding);
    return Math.max(0, width) * Math.max(0, height);
  };

  var LABEL_DIRECTIONS = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }
  ];
  var LABEL_DISTANCES = [0, 14, 28, 44, 62, 82, 104];

  var makeLabelCandidate = function (markerX, markerY, width, height, direction, distance) {
    var gap = 11 + distance;
    var left = direction.x > 0 ? gap : (direction.x < 0 ? -width - gap : -width / 2);
    var top = direction.y > 0 ? gap : (direction.y < 0 ? -height - gap : -height / 2);
    return {
      left: markerX + left,
      top: markerY + top,
      right: markerX + left + width,
      bottom: markerY + top + height,
      offsetX: left,
      offsetY: top
    };
  };

  var applyLabelCandidate = function (link, label, leader, candidate, width, height) {
    label.style.setProperty('--label-x', candidate.offsetX + 'px');
    label.style.setProperty('--label-y', candidate.offsetY + 'px');
    var centreX = candidate.offsetX + width / 2;
    var centreY = candidate.offsetY + height / 2;
    leader.style.setProperty('--leader-length', Math.hypot(centreX, centreY) + 'px');
    leader.style.setProperty('--leader-angle', Math.atan2(centreY, centreX) + 'rad');
    link.classList.remove('is-label-offscreen');
  };

  /* Labels remain readable callouts while their dots retain true coordinates.
     Try progressively wider placements and draw a thin leader back to each
     marker instead of silently hiding later labels in a dense cluster. */
  var layoutLabels = function () {
    labelLayoutFrame = 0;
    labelLayoutTimer = 0;
    var occupied = [];
    detailLinks.forEach(function (link) { link.classList.remove('is-label-hidden', 'is-label-offscreen'); });
    if (detailLevel === 'region' || (mobileMapQuery.matches && !isFullscreen)) return;

    var viewportRect = viewport.getBoundingClientRect();
    var viewportPadding = 5;

    detailLinks.forEach(function (link) {
      if (link.getAttribute('data-map-level') !== detailLevel) return;
      var label = link.querySelector('.travel-map__detail-label');
      var leader = link.querySelector('.travel-map__detail-leader');
      var dot = link.querySelector('.travel-map__detail-dot');
      if (!label || !leader || !dot) return;

      var dotRect = dot.getBoundingClientRect();
      var markerX = dotRect.left + dotRect.width / 2;
      var markerY = dotRect.top + dotRect.height / 2;
      if (markerX < viewportRect.left || markerX > viewportRect.right ||
          markerY < viewportRect.top || markerY > viewportRect.bottom) {
        link.classList.add('is-label-offscreen');
        return;
      }

      var width = label.offsetWidth;
      var height = label.offsetHeight;
      var order = parseInt(link.getAttribute('data-label-order'), 10) || 0;
      var candidates = [];
      LABEL_DISTANCES.forEach(function (distance) {
        LABEL_DIRECTIONS.forEach(function (_, directionIndex) {
          var direction = LABEL_DIRECTIONS[(directionIndex + order) % LABEL_DIRECTIONS.length];
          candidates.push(makeLabelCandidate(markerX, markerY, width, height, direction, distance));
        });
      });

      var selected = candidates.find(function (candidate) {
        var insideViewport = candidate.left >= viewportRect.left + viewportPadding &&
          candidate.right <= viewportRect.right - viewportPadding &&
          candidate.top >= viewportRect.top + viewportPadding &&
          candidate.bottom <= viewportRect.bottom - viewportPadding;
        return insideViewport && !occupied.some(function (accepted) {
          return boxesOverlap(candidate, accepted, 4);
        });
      });

      if (!selected) {
        selected = candidates.reduce(function (best, candidate) {
          var outside = Math.max(0, viewportRect.left + viewportPadding - candidate.left) +
            Math.max(0, candidate.right - viewportRect.right + viewportPadding) +
            Math.max(0, viewportRect.top + viewportPadding - candidate.top) +
            Math.max(0, candidate.bottom - viewportRect.bottom + viewportPadding);
          var collision = occupied.reduce(function (total, accepted) {
            return total + overlapArea(candidate, accepted, 4);
          }, 0);
          var score = outside * 1000 + collision;
          return !best || score < best.score ? { candidate: candidate, score: score } : best;
        }, null).candidate;
      }

      applyLabelCandidate(link, label, leader, selected, width, height);
      occupied.push(selected);
    });
  };

  var scheduleLabelLayout = function () {
    if (labelLayoutFrame) window.cancelAnimationFrame(labelLayoutFrame);
    if (labelLayoutTimer) window.clearTimeout(labelLayoutTimer);
    /* Collision layout reads every visible label's geometry. Debounce it until
       zoom/pan input settles so touch gestures stay on the compositor path. */
    labelLayoutTimer = window.setTimeout(function () {
      labelLayoutFrame = window.requestAnimationFrame(layoutLabels);
    }, 90);
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
    scale = Math.min(MAX_SCALE, Math.max(minScale, scale));
    var minX = viewport.clientWidth - canvas.offsetWidth * scale;
    var minY = viewport.clientHeight - canvas.offsetHeight * scale;
    tx = Math.min(0, Math.max(minX, tx));
    ty = Math.min(0, Math.max(minY, ty));
  };

  var apply = function () {
    applyFrame = 0;
    clamp();
    var zoomed = scale > 1.001;
    canvas.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
    canvas.style.setProperty('--map-scale', scale);
    updateDetailLevel();
    scheduleLabelLayout();
    viewport.classList.toggle('is-zoomed', zoomed);
    /* While zoomed the map owns touch gestures; at rest the page scrolls. */
    viewport.style.touchAction = zoomed ? 'none' : 'pan-y';
    if (zoomInBtn) zoomInBtn.disabled = scale >= MAX_SCALE - 0.001;
    if (zoomOutBtn) zoomOutBtn.disabled = scale <= minScale + 0.001;
    if (resetBtn) resetBtn.hidden = !zoomed;
  };

  var scheduleApply = function () {
    if (applyFrame) return;
    applyFrame = window.requestAnimationFrame(apply);
  };

  /* Phones open the map as a full-screen overlay and never see the tiny
     letterboxed world strip: the overlay's zoom-out floor is the scale that
     fills the screen height, which already reads as country-level detail. */
  var fitHeightScale = function () {
    if (!canvas.offsetHeight) return MIN_SCALE;
    return Math.min(MAX_SCALE, viewport.clientHeight / canvas.offsetHeight);
  };

  var REGION_VIEWS = {
    americas: { lat: 38.5, lon: -98.5, scale: 4.4 },
    /* Europe's stops span only ~6 degrees of longitude, so its chip zooms
       well past STOP_SCALE before the cluster is comfortably separated. */
    europe: { lat: 49.6, lon: 5.5, scale: 8 },
    asia: { lat: 29.5, lon: 126.5, scale: 4.4 },
    australia: { lat: -33.2, lon: 132.7, scale: 4.4 }
  };
  var OPENING_VIEW = { lat: 28, lon: 123 };

  var viewFor = function (lat, lon, targetScale) {
    targetScale = Math.min(MAX_SCALE, Math.max(minScale, targetScale));
    var point = projectCoordinate(lat, lon);
    var targetTx = viewport.clientWidth / 2 - point.x / 100 * canvas.offsetWidth * targetScale;
    var targetTy = viewport.clientHeight / 2 - point.y / 100 * canvas.offsetHeight * targetScale;
    targetTx = Math.min(0, Math.max(viewport.clientWidth - canvas.offsetWidth * targetScale, targetTx));
    targetTy = Math.min(0, Math.max(viewport.clientHeight - canvas.offsetHeight * targetScale, targetTy));
    return { scale: targetScale, tx: targetTx, ty: targetTy };
  };

  var stopFly = function () {
    if (flyFrame) {
      window.cancelAnimationFrame(flyFrame);
      flyFrame = 0;
    }
  };

  var flyTo = function (lat, lon, targetScale) {
    stopFly();
    var target = viewFor(lat, lon, targetScale);
    if (reducedMotionQuery.matches) {
      scale = target.scale;
      tx = target.tx;
      ty = target.ty;
      apply();
      return;
    }
    var from = { scale: scale, tx: tx, ty: ty };
    var start = null;
    var DURATION = 520;
    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / DURATION);
      var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      scale = from.scale + (target.scale - from.scale) * eased;
      tx = from.tx + (target.tx - from.tx) * eased;
      ty = from.ty + (target.ty - from.ty) * eased;
      apply();
      flyFrame = t < 1 ? window.requestAnimationFrame(step) : 0;
    };
    flyFrame = window.requestAnimationFrame(step);
  };

  var setActiveRegion = function (key) {
    if (!regionsBar) return;
    Array.prototype.forEach.call(regionsBar.querySelectorAll('[data-map-region]'), function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-map-region') === key);
    });
  };

  /* The desktop atlas opens on a restrained crop that removes the unused
     polar margin while keeping every journal region visible. The phone
     overlay opens fit-to-height over East Asia instead. */
  var resetView = function () {
    stopFly();
    if (isFullscreen) {
      minScale = fitHeightScale();
      var opening = viewFor(OPENING_VIEW.lat, OPENING_VIEW.lon, minScale);
      scale = opening.scale;
      tx = opening.tx;
      ty = opening.ty;
      setActiveRegion('');
      apply();
      return;
    }
    var useDesktopCrop = window.matchMedia('(min-width: 981px)').matches;
    minScale = useDesktopCrop ? DESKTOP_INITIAL_SCALE : MIN_SCALE;
    scale = minScale;
    tx = useDesktopCrop ? (viewport.clientWidth - canvas.offsetWidth * scale) / 2 : 0;
    ty = 0;
    scheduleApply();
  };

  var openFullscreen = function () {
    if (isFullscreen) return;
    /* The full vector map stays out of the phone's initial critical path, then
       starts fetching as soon as the visitor asks to open the overlay. */
    if (mapImage) {
      mapImage.fetchPriority = 'low';
      mapImage.loading = 'eager';
    }
    isFullscreen = true;
    lastFocused = document.activeElement;
    map.classList.add('is-fullscreen');
    map.setAttribute('role', 'dialog');
    map.setAttribute('aria-modal', 'true');
    map.setAttribute('aria-label', 'Interactive travel map');
    document.body.classList.add('is-map-fullscreen');
    /* Overlay layout must settle before the fit-to-height floor is measured. */
    window.requestAnimationFrame(function () {
      resetView();
      if (closeBtn) closeBtn.focus();
    });
  };

  var closeFullscreen = function () {
    if (!isFullscreen) return;
    isFullscreen = false;
    stopFly();
    map.classList.remove('is-fullscreen');
    map.removeAttribute('role');
    map.removeAttribute('aria-modal');
    map.removeAttribute('aria-label');
    document.body.classList.remove('is-map-fullscreen');
    setActiveRegion('');
    resetView();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  };

  /* Zoom keeping the viewport point (px, py) anchored. */
  var zoomAt = function (px, py, nextScale) {
    nextScale = Math.min(MAX_SCALE, Math.max(minScale, nextScale));
    var ratio = nextScale / scale;
    tx = px - (px - tx) * ratio;
    ty = py - (py - ty) * ratio;
    scale = nextScale;
    /* Fully zoomed out returns to the opening composition. */
    if (scale <= minScale + 0.001) {
      tx = minScale > MIN_SCALE ? (viewport.clientWidth - canvas.offsetWidth * scale) / 2 : 0;
      ty = 0;
    }
    scheduleApply();
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
    else resetView();
  });

  if (teaser) teaser.addEventListener('click', openFullscreen);
  if (closeBtn) closeBtn.addEventListener('click', closeFullscreen);
  if (regionsBar) {
    regionsBar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-map-region]');
      if (!button) return;
      var view = REGION_VIEWS[button.getAttribute('data-map-region')];
      if (!view) return;
      setActiveRegion(button.getAttribute('data-map-region'));
      flyTo(view.lat, view.lon, view.scale);
    });
  }

  /* The overlay is a modal dialog: Escape closes it and Tab stays inside. */
  document.addEventListener('keydown', function (event) {
    if (!isFullscreen) return;
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      closeFullscreen();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = Array.prototype.filter.call(
      map.querySelectorAll('a[href], button:not([disabled]):not([hidden]), [tabindex="0"]'),
      function (element) { return element.offsetParent !== null; }
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* Leaving the phone breakpoint (e.g. rotating to landscape past 520px)
     returns to the inline map so the overlay never strands itself. */
  var handleMobileChange = function (event) {
    if (!event.matches) closeFullscreen();
  };
  if (mobileMapQuery.addEventListener) mobileMapQuery.addEventListener('change', handleMobileChange);

  /* Wheel and trackpad scrolling zoom around the pointer. Once the map reaches
     either limit, that same-direction gesture returns to normal page scroll. */
  viewport.addEventListener('wheel', function (event) {
    if (event.target.closest('.travel-map__controls')) return;
    var nextScale = Math.min(MAX_SCALE, Math.max(minScale, scale * Math.exp(-event.deltaY * 0.0018)));
    if (Math.abs(nextScale - scale) < 0.001) return;
    event.preventDefault();
    stopFly();
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

  /* iOS Safari does not reliably fire dblclick for touch, so double-tap
     zoom is detected from the pointer stream instead. */
  var lastTap = { time: 0, x: 0, y: 0 };

  viewport.addEventListener('pointerdown', function (event) {
    if (event.target.closest('.travel-map__controls, .travel-map__close, .travel-map__regions')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopFly();
    if (event.pointerType === 'touch' && pointers.size === 0) {
      var tapGap = event.timeStamp - lastTap.time;
      if (tapGap > 0 && tapGap < 350 &&
          Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30) {
        lastTap.time = 0;
        var tapRect = viewport.getBoundingClientRect();
        zoomAt(event.clientX - tapRect.left, event.clientY - tapRect.top, scale * 1.8);
      } else {
        lastTap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
      }
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      var info = pinchInfo();
      pinchStart = { dist: info.dist, scale: scale };
    }
    if (pointers.size === 1) { dragMoved = false; dragDistance = 0; }
    /* Capture only once a pinch (or, below, a real drag) starts: capturing
       on every press retargets the eventual click to the viewport, which
       silently swallowed marker and journal-link taps while zoomed. */
    if (pointers.size === 2) viewport.setPointerCapture(event.pointerId);
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
      if (dragDistance > 5 && !dragMoved) {
        dragMoved = true;
        viewport.setPointerCapture(event.pointerId);
      }
      pointers.set(event.pointerId, next);
      scheduleApply();
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
    scheduleApply();
  });

  window.addEventListener('resize', function () {
    /* Orientation changes move the overlay's fit-to-height floor. */
    if (isFullscreen) {
      minScale = fitHeightScale();
      if (scale < minScale) scale = minScale;
    }
    apply();
  });
  /* Crossing the desktop breakpoint changes the opening crop, and with it the
     zoom-out floor — re-establish the matching baseline view. */
  var desktopCrop = window.matchMedia('(min-width: 981px)');
  if (desktopCrop.addEventListener) desktopCrop.addEventListener('change', resetView);
  positionRegionMarkers();
  createDetailPoints();
  resetView();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleLabelLayout);
}());
