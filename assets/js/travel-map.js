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

  var TRIPS = {
    'silicon-valley': {
      title: 'California & Nevada',
      dates: 'August 2019 – April 2020',
      image: 'images/travel/2019_sv/SF_sutro_sunset.jpg',
      imageAlt: 'Sunset in San Francisco'
    },
    'usa-canada': {
      title: 'USA & Canada',
      dates: '10 – 28 October 2023',
      image: 'images/travel/2023_usa_canada/cover_photo.jpg',
      imageAlt: 'New York skyline'
    },
    europe: {
      title: 'Western Europe',
      dates: '22 October – 1 November 2022',
      image: 'images/travel/2022_europe/day2/paris3-card.jpg',
      imageAlt: 'Eiffel Tower in Paris'
    },
    germany: {
      title: 'North Rhine-Westphalia',
      dates: '6 – 28 April 2024',
      image: 'images/travel/2024_germany/germany_banner_card.jpg',
      imageAlt: 'Germany travel photograph'
    },
    japan: {
      title: 'Japan',
      dates: '23 October – 8 November 2025',
      image: 'images/travel/2025_japan/day14_hakone/fuji1.jpg',
      imageAlt: 'Mount Fuji framed by autumn trees'
    },
    seoul: {
      title: 'Seoul & Gangwon',
      dates: '18 – 26 December 2017',
      image: 'images/travel/2017_seoul/namsan-tower.webp',
      imageAlt: 'Winter view over Seoul from Namsan Tower'
    },
    guangzhou: {
      title: 'Guangdong · Guangzhou',
      dates: '10 – 15 May 2026',
      image: 'images/travel/2026_guangzhou/day5/canton-tower-couple.webp',
      imageAlt: 'Nicholas and his wife at Canton Tower'
    },
    perth: {
      title: 'Western Australia',
      dates: '28 June – 8 July 2023',
      image: 'images/travel/2023_perth/perth_card.jpg',
      imageAlt: 'Perth travel photograph'
    },
    australia: {
      title: 'Victoria & New South Wales',
      dates: '2 – 14 August 2024',
      image: 'images/travel/2024_australia/melbourne_12apostles/apostles3.jpg',
      imageAlt: 'Twelve Apostles at sunset'
    }
  };

  /* Semantic zoom keeps the world view calm, then progressively reveals
     map-scale destinations. Latitude/longitude is projected with the same
     Natural Earth 1 projection used by tools/maps/generate-world-map.ps1. */
  var DETAIL_POINTS = [
    /* Countries, states and larger areas. */
    ['area', 'California', 'travel_2019_siliconvalley#trip-section-1', 36.7783, -119.4179, 'silicon-valley'],
    ['area', 'Nevada', 'travel_2019_siliconvalley#trip-section-4', 38.8026, -116.4194, 'silicon-valley'],
    ['area', 'New York', 'travel_2023_usacanada#trip-section-2', 42.9538, -75.5268, 'usa-canada'],
    ['area', 'Massachusetts', 'travel_2023_usacanada#trip-section-6', 42.4072, -71.3824, 'usa-canada'],
    ['area', 'Washington D.C.', 'travel_2023_usacanada#trip-section-14', 38.9072, -77.0369, 'usa-canada'],
    ['area', 'Ontario', 'travel_2023_usacanada#trip-section-9', 50.0, -85.0, 'usa-canada'],
    ['area', 'France', 'travel_2022_europe#trip-section-2', 46.2276, 2.2137, 'europe'],
    ['area', 'Belgium', 'travel_2022_europe#trip-section-3', 50.5039, 4.4699, 'europe'],
    ['area', 'Netherlands', 'travel_2022_europe#trip-section-4', 52.1326, 5.2913, 'europe'],
    ['area', 'Germany', 'travel_2022_europe#trip-section-5', 51.1657, 10.4515, 'europe'],
    ['area', 'Switzerland', 'travel_2022_europe#trip-section-7', 46.8182, 8.2275, 'europe'],
    ['area', 'North Rhine-Westphalia', 'travel_2024_germany#trip-section-1', 51.4332, 7.6616, 'germany'],
    ['area', 'Japan', 'travel_2025_japan#trip-section-1', 36.5, 138.0, 'japan'],
    ['area', 'South Korea', 'travel_2017_seoul#trip-section-1', 36.5, 127.8, 'seoul'],
    ['area', 'Guangdong', 'travel_2026_guangzhou#trip-section-1', 23.379, 113.763, 'guangzhou'],
    ['area', 'Western Australia', 'travel_2023_perth#trip-section-2', -25.2744, 122.2983, 'perth'],
    ['area', 'Victoria', 'travel_2024_australia#trip-section-1', -37.4713, 144.7852, 'australia'],
    ['area', 'New South Wales', 'travel_2024_australia#trip-section-6', -31.2532, 146.9211, 'australia'],

    /* Individual journal stops at a useful world-map scale. */
    ['stop', 'Silicon Valley', 'travel_2019_siliconvalley#trip-section-1', 37.3875, -122.0575, 'silicon-valley'],
    ['stop', 'San Francisco', 'travel_2019_siliconvalley#trip-section-2', 37.7749, -122.4194, 'silicon-valley'],
    ['stop', 'Monterey', 'travel_2019_siliconvalley#trip-section-3', 36.6002, -121.8947, 'silicon-valley'],
    ['stop', 'Las Vegas', 'travel_2019_siliconvalley#trip-section-4', 36.1699, -115.1398, 'silicon-valley'],
    ['stop', 'Los Angeles', 'travel_2019_siliconvalley#trip-section-5', 34.0522, -118.2437, 'silicon-valley'],
    ['stop', 'New York City', 'travel_2023_usacanada#trip-section-2', 40.7128, -74.006, 'usa-canada'],
    ['stop', 'Boston', 'travel_2023_usacanada#trip-section-6', 42.3601, -71.0589, 'usa-canada'],
    ['stop', 'Washington D.C.', 'travel_2023_usacanada#trip-section-14', 38.9072, -77.0369, 'usa-canada'],
    ['stop', 'Niagara Falls', 'travel_2023_usacanada#trip-section-9', 43.0962, -79.0377, 'usa-canada'],
    ['stop', 'Toronto', 'travel_2023_usacanada#trip-section-11', 43.6532, -79.3832, 'usa-canada'],
    ['stop', 'Paris', 'travel_2022_europe#trip-section-2', 48.8566, 2.3522, 'europe'],
    ['stop', 'Brussels', 'travel_2022_europe#trip-section-3', 50.8503, 4.3517, 'europe'],
    ['stop', 'Amsterdam', 'travel_2022_europe#trip-section-4', 52.3676, 4.9041, 'europe'],
    ['stop', 'Cologne · 2022', 'travel_2022_europe#trip-section-5', 50.9375, 6.9603, 'europe'],
    ['stop', 'Heidelberg', 'travel_2022_europe#trip-section-6', 49.3988, 8.6724, 'europe'],
    ['stop', 'Lucerne', 'travel_2022_europe#trip-section-7', 47.0502, 8.3093, 'europe'],
    ['stop', 'Zurich', 'travel_2022_europe#trip-section-8', 47.3769, 8.5417, 'europe'],
    ['stop', 'Kalkar', 'travel_2024_germany#trip-section-1', 51.7391, 6.2912, 'germany'],
    ['stop', 'Xanten', 'travel_2024_germany#trip-section-2', 51.6626, 6.4543, 'germany'],
    ['stop', 'Kleve', 'travel_2024_germany#trip-section-3', 51.7883, 6.1387, 'germany'],
    ['stop', 'Cologne · 2024', 'travel_2024_germany#trip-section-4', 50.9375, 6.9603, 'germany'],
    ['stop', 'Essen', 'travel_2024_germany#trip-section-5', 51.4556, 7.0116, 'germany'],
    ['stop', 'Rees', 'travel_2024_germany#trip-section-6', 51.7579, 6.3973, 'germany'],
    ['stop', 'Düsseldorf', 'travel_2024_germany#trip-section-7', 51.2277, 6.7735, 'germany'],
    ['stop', 'Duisburg', 'travel_2024_germany#trip-section-8', 51.4344, 6.7623, 'germany'],
    ['stop', 'Hiroshima', 'travel_2025_japan#trip-section-1', 34.3853, 132.4553, 'japan'],
    ['stop', 'Osaka & Nara', 'travel_2025_japan#trip-section-2', 34.6937, 135.5023, 'japan'],
    ['stop', 'Kyoto', 'travel_2025_japan#trip-section-3', 35.0116, 135.7681, 'japan'],
    ['stop', 'Nagoya', 'travel_2025_japan#trip-section-4', 35.1815, 136.9066, 'japan'],
    ['stop', 'Tokyo', 'travel_2025_japan#trip-section-5', 35.6762, 139.6503, 'japan'],
    ['stop', 'Seoul', 'travel_2017_seoul#trip-section-1', 37.5665, 126.9780, 'seoul'],
    ['stop', 'Nami Island', 'travel_2017_seoul#trip-section-2', 37.7914, 127.5255, 'seoul'],
    ['stop', 'Chuncheon', 'travel_2017_seoul#trip-section-3', 37.8813, 127.7300, 'seoul'],
    ['stop', 'Guangzhou', 'travel_2026_guangzhou#trip-section-1', 23.1291, 113.2644, 'guangzhou'],
    ['stop', 'Fremantle', 'travel_2023_perth#trip-section-2', -32.0569, 115.7439, 'perth'],
    ['stop', 'Rottnest Island', 'travel_2023_perth#trip-section-3', -32.0069, 115.5393, 'perth'],
    ['stop', 'Caversham', 'travel_2023_perth#trip-section-4', -31.875, 115.97, 'perth'],
    ['stop', 'Hyden', 'travel_2023_perth#trip-section-5', -32.443, 118.897, 'perth'],
    ['stop', 'Geraldton', 'travel_2023_perth#trip-section-6', -28.777, 114.614, 'perth'],
    ['stop', 'Kalbarri', 'travel_2023_perth#trip-section-7', -27.710, 114.165, 'perth'],
    ['stop', 'Greenough', 'travel_2023_perth#trip-section-8', -28.95, 114.73, 'perth'],
    ['stop', 'Perth', 'travel_2023_perth#trip-section-9', -31.9523, 115.8613, 'perth'],
    ['stop', 'Melbourne', 'travel_2024_australia#trip-section-1', -37.8136, 144.9631, 'australia'],
    ['stop', 'Phillip Island', 'travel_2024_australia#trip-section-2', -38.4835, 145.2310, 'australia'],
    ['stop', 'Great Ocean Road', 'travel_2024_australia#trip-section-3', -38.665, 143.105, 'australia'],
    ['stop', 'Werribee', 'travel_2024_australia#trip-section-4', -37.8999, 144.6611, 'australia'],
    ['stop', 'Grampians', 'travel_2024_australia#trip-section-5', -37.258, 142.481, 'australia'],
    ['stop', 'Sydney', 'travel_2024_australia#trip-section-6', -33.8688, 151.2093, 'australia'],
    ['stop', 'Blue Mountains', 'travel_2024_australia#trip-section-7', -33.712, 150.311, 'australia'],
    ['stop', 'Wollongong', 'travel_2024_australia#trip-section-9', -34.4278, 150.8931, 'australia']
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
  var fullscreenCloseTimer = 0;
  var flyFrame = 0;
  var detailLinks = [];
  var regionMarkers = Array.prototype.slice.call(canvas.querySelectorAll('.travel-map__marker'));
  var detailLevel = '';
  var labelLayoutFrame = 0;
  var labelLayoutTimer = 0;
  var applyFrame = 0;
  var renderSettleTimer = 0;
  var committedScale = 1;
  var status = map.querySelector('.travel-map__status');
  var tripPicker = map.querySelector('[data-map-trip]');
  var detailCard = map.querySelector('[data-map-detail-card]');
  var detailCardClose = map.querySelector('[data-map-detail-close]');
  var detailCardImage = map.querySelector('[data-map-detail-image]');
  var detailCardPosition = map.querySelector('[data-map-detail-position]');
  var detailCardTitle = map.querySelector('[data-map-detail-title]');
  var detailCardMeta = map.querySelector('[data-map-detail-meta]');
  var detailCardLink = map.querySelector('[data-map-detail-link]');
  var routeLayer = null;
  var routePath = null;
  var activeTrip = '';
  var selectedDetail = null;
  var detailCardHideTimer = 0;

  var baseCanvasWidth = function () {
    return viewport.clientWidth;
  };

  var baseCanvasHeight = function () {
    return baseCanvasWidth() * 624 / 1200;
  };

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

  var createRouteLayer = function () {
    var namespace = 'http://www.w3.org/2000/svg';
    routeLayer = document.createElementNS(namespace, 'svg');
    routeLayer.setAttribute('class', 'travel-map__route-layer');
    routeLayer.setAttribute('viewBox', '0 0 1200 624');
    routeLayer.setAttribute('preserveAspectRatio', 'none');
    routeLayer.setAttribute('aria-hidden', 'true');
    routePath = document.createElementNS(namespace, 'path');
    routePath.setAttribute('class', 'travel-map__route-path');
    routePath.setAttribute('vector-effect', 'non-scaling-stroke');
    routeLayer.appendChild(routePath);
    canvas.insertBefore(routeLayer, canvas.querySelector('.travel-map__marker'));
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
      link.setAttribute('data-map-trip', point[5]);
      link.setAttribute('data-map-point', index.toString());
      link.setAttribute('data-label-order', index.toString());
      link.setAttribute('aria-label', 'Show details for ' + point[1]);
      link.setAttribute('aria-controls', 'travel-map-detail-card');
      link.setAttribute('aria-expanded', 'false');
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
      link.addEventListener('click', function (event) {
        event.preventDefault();
        showPointDetails(point, link);
      });
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
      if (activeTrip && link.getAttribute('data-map-trip') !== activeTrip) return;
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

  var stopsForTrip = function (tripKey) {
    return DETAIL_POINTS.filter(function (point) {
      return point[0] === 'stop' && point[5] === tripKey;
    }).sort(function (first, second) {
      var firstSection = parseInt((first[2].match(/trip-section-(\d+)/) || [0, 0])[1], 10);
      var secondSection = parseInt((second[2].match(/trip-section-(\d+)/) || [0, 0])[1], 10);
      return firstSection - secondSection;
    });
  };

  var renderRoute = function () {
    if (!routePath) return;
    var stops = stopsForTrip(activeTrip);
    if (stops.length < 2) {
      routePath.setAttribute('d', '');
      return;
    }
    var points = stops.map(function (stop) {
      var projected = projectCoordinate(stop[3], stop[4]);
      return { x: projected.x * 12, y: projected.y * 6.24 };
    });
    var path = 'M ' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);
    for (var index = 1; index < points.length; index += 1) {
      var previous = points[index - 1];
      var next = points[index];
      var distance = Math.hypot(next.x - previous.x, next.y - previous.y);
      var bend = Math.min(14, distance * 0.09);
      var controlX = (previous.x + next.x) / 2;
      var controlY = (previous.y + next.y) / 2 - bend;
      path += ' Q ' + controlX.toFixed(2) + ' ' + controlY.toFixed(2) +
        ' ' + next.x.toFixed(2) + ' ' + next.y.toFixed(2);
    }
    routePath.setAttribute('d', path);
  };

  var updateStatus = function () {
    if (!status) return;
    var viewLabel = detailLevel === 'region'
      ? 'Regional view'
      : (detailLevel === 'area' ? 'Country and state view' : 'City and journal stop view');
    status.textContent = activeTrip && TRIPS[activeTrip]
      ? TRIPS[activeTrip].title + ' · ' +
        (detailLevel === 'region' ? 'Regions' : (detailLevel === 'area' ? 'Areas' : 'Stops'))
      : viewLabel;
  };

  var syncDetailTabStops = function () {
    detailLinks.forEach(function (link) {
      var matchesLevel = link.getAttribute('data-map-level') === detailLevel;
      var matchesTrip = !activeTrip || link.getAttribute('data-map-trip') === activeTrip;
      link.setAttribute('tabindex', matchesLevel && matchesTrip ? '0' : '-1');
    });
    regionMarkers.forEach(function (marker) {
      marker.setAttribute('tabindex', detailLevel === 'region' && !activeTrip ? '0' : '-1');
    });
  };

  var updateDetailLevel = function () {
    var nextLevel = scale >= STOP_SCALE ? 'stop' : (scale >= AREA_SCALE ? 'area' : 'region');
    if (nextLevel === detailLevel) return;
    detailLevel = nextLevel;
    canvas.setAttribute('data-map-detail', detailLevel);
    syncDetailTabStops();
    updateStatus();
  };

  var clamp = function () {
    scale = Math.min(MAX_SCALE, Math.max(minScale, scale));
    var minX = viewport.clientWidth - baseCanvasWidth() * scale;
    var minY = viewport.clientHeight - baseCanvasHeight() * scale;
    tx = Math.min(0, Math.max(minX, tx));
    ty = Math.min(0, Math.max(minY, ty));
  };

  /* Keep transforms on the compositor while the map moves, then commit most
     or all of the zoom into the SVG's CSS dimensions. This prompts a sharp
     vector rerender without making every gesture pay layout/paint costs. */
  var settleRenderScale = function () {
    renderSettleTimer = 0;
    var width = baseCanvasWidth();
    var maxLayoutScale = width ? Math.max(1, 4800 / width) : scale;
    committedScale = Math.min(scale, maxLayoutScale);
    canvas.style.width = (committedScale * 100) + '%';
    canvas.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + (scale / committedScale) + ')';
    canvas.style.setProperty('--map-scale', scale / committedScale);
    viewport.classList.remove('is-map-interacting');
    scheduleLabelLayout();
  };

  var scheduleRenderSettle = function () {
    viewport.classList.add('is-map-interacting');
    if (renderSettleTimer) window.clearTimeout(renderSettleTimer);
    renderSettleTimer = window.setTimeout(settleRenderScale, 120);
  };

  var apply = function () {
    applyFrame = 0;
    clamp();
    var zoomed = scale > 1.001;
    var transientScale = scale / committedScale;
    canvas.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + transientScale + ')';
    canvas.style.setProperty('--map-scale', transientScale);
    scheduleRenderSettle();
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
    var height = baseCanvasHeight();
    if (!height) return MIN_SCALE;
    return Math.min(MAX_SCALE, viewport.clientHeight / height);
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
    var width = baseCanvasWidth();
    var height = baseCanvasHeight();
    var targetTx = viewport.clientWidth / 2 - point.x / 100 * width * targetScale;
    var targetTy = viewport.clientHeight / 2 - point.y / 100 * height * targetScale;
    targetTx = Math.min(0, Math.max(viewport.clientWidth - width * targetScale, targetTx));
    targetTy = Math.min(0, Math.max(viewport.clientHeight - height * targetScale, targetTy));
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

  var fitTrip = function (tripKey) {
    var stops = stopsForTrip(tripKey);
    if (!stops.length) return;
    var projected = stops.map(function (stop) {
      return projectCoordinate(stop[3], stop[4]);
    });
    var xs = projected.map(function (point) { return point.x; });
    var ys = projected.map(function (point) { return point.y; });
    var routeWidth = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) / 100 * baseCanvasWidth();
    var routeHeight = (Math.max.apply(null, ys) - Math.min.apply(null, ys)) / 100 * baseCanvasHeight();
    var availableWidth = Math.max(120, viewport.clientWidth - (isFullscreen ? 88 : 130));
    var availableHeight = Math.max(120, viewport.clientHeight - (isFullscreen ? 190 : 105));
    var widthScale = routeWidth > 1 ? availableWidth / routeWidth : 9;
    var heightScale = routeHeight > 1 ? availableHeight / routeHeight : 9;
    var targetScale = Math.min(9, Math.max(STOP_SCALE + 0.45, Math.min(widthScale, heightScale)));
    var centreLatitude = stops.reduce(function (total, stop) { return total + stop[3]; }, 0) / stops.length;
    var centreLongitude = stops.reduce(function (total, stop) { return total + stop[4]; }, 0) / stops.length;
    flyTo(centreLatitude, centreLongitude, targetScale);
  };

  var closePointDetails = function (returnFocus, immediate) {
    if (detailCardHideTimer) window.clearTimeout(detailCardHideTimer);
    detailCardHideTimer = 0;
    var focusTarget = selectedDetail;
    if (selectedDetail) {
      selectedDetail.classList.remove('is-selected');
      selectedDetail.setAttribute('aria-expanded', 'false');
    }
    selectedDetail = null;
    if (!detailCard || detailCard.hidden) return;
    detailCard.classList.remove('is-visible');
    var finish = function () {
      detailCard.hidden = true;
      detailCardHideTimer = 0;
    };
    if (immediate === true || reducedMotionQuery.matches) finish();
    else detailCardHideTimer = window.setTimeout(finish, 180);
    if (returnFocus && focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
  };

  var setActiveTrip = function (tripKey, shouldFly) {
    if (tripKey && !TRIPS[tripKey]) return;
    if (activeTrip !== tripKey) closePointDetails(false, true);
    activeTrip = tripKey;
    canvas.classList.toggle('is-trip-selected', Boolean(activeTrip));
    detailLinks.forEach(function (link) {
      link.classList.toggle('is-trip-active', Boolean(activeTrip) &&
        link.getAttribute('data-map-trip') === activeTrip);
    });
    if (tripPicker && tripPicker.value !== activeTrip) tripPicker.value = activeTrip;
    setActiveRegion('');
    renderRoute();
    syncDetailTabStops();
    updateStatus();
    scheduleLabelLayout();
    if (shouldFly && activeTrip) fitTrip(activeTrip);
  };

  var keepSelectedClearOfCard = function (link) {
    if (!isFullscreen || !detailCard || detailCard.hidden) return;
    var dot = link.querySelector('.travel-map__detail-dot');
    if (!dot) return;
    var dotRect = dot.getBoundingClientRect();
    var cardRect = detailCard.getBoundingClientRect();
    var safeBottom = cardRect.top - 28;
    if (dotRect.bottom > safeBottom) {
      ty -= dotRect.bottom - safeBottom;
      scheduleApply();
    }
  };

  var showPointDetails = function (point, link) {
    if (!detailCard || !TRIPS[point[5]]) return;
    if (detailCardHideTimer) window.clearTimeout(detailCardHideTimer);
    detailCardHideTimer = 0;
    if (selectedDetail && selectedDetail !== link) {
      selectedDetail.classList.remove('is-selected');
      selectedDetail.setAttribute('aria-expanded', 'false');
    }
    if (activeTrip !== point[5]) setActiveTrip(point[5], false);
    selectedDetail = link;
    link.classList.add('is-selected');
    link.setAttribute('aria-expanded', 'true');

    var trip = TRIPS[point[5]];
    var stops = stopsForTrip(point[5]);
    var stopIndex = stops.indexOf(point);
    detailCardPosition.textContent = point[0] === 'stop'
      ? 'Stop ' + (stopIndex + 1) + ' of ' + stops.length + ' · ' + trip.title
      : 'Region · ' + trip.title;
    detailCardTitle.textContent = point[1];
    detailCardMeta.textContent = trip.dates;
    detailCardImage.src = trip.image;
    detailCardImage.alt = trip.imageAlt;
    detailCardLink.href = point[2];
    detailCardLink.firstChild.nodeValue = point[0] === 'stop'
      ? 'Open this journal stop '
      : 'Open this journal section ';
    detailCardLink.setAttribute('aria-label', 'Open ' + point[1] + ' in the ' + trip.title + ' journal');
    detailCard.classList.toggle('is-left', parseFloat(link.style.left) > 50);
    detailCard.hidden = false;
    window.requestAnimationFrame(function () {
      detailCard.classList.add('is-visible');
      keepSelectedClearOfCard(link);
    });
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
    tx = useDesktopCrop ? (viewport.clientWidth - baseCanvasWidth() * scale) / 2 : 0;
    ty = 0;
    scheduleApply();
  };

  var finishFullscreenClose = function () {
    if (fullscreenCloseTimer) window.clearTimeout(fullscreenCloseTimer);
    fullscreenCloseTimer = 0;
    map.classList.remove('is-fullscreen', 'is-fullscreen-visible');
    map.removeAttribute('role');
    map.removeAttribute('aria-modal');
    map.removeAttribute('aria-label');
    map.removeAttribute('aria-hidden');
    document.body.classList.remove('is-map-fullscreen');
    resetView();
  };

  var openFullscreen = function () {
    if (isFullscreen) return;
    if (fullscreenCloseTimer) {
      window.clearTimeout(fullscreenCloseTimer);
      fullscreenCloseTimer = 0;
    }
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
    map.removeAttribute('aria-hidden');
    document.body.classList.add('is-map-fullscreen');
    /* Overlay layout must settle before the fit-to-height floor is measured. */
    window.requestAnimationFrame(function () {
      resetView();
      if (closeBtn) closeBtn.focus();
      window.requestAnimationFrame(function () {
        map.classList.add('is-fullscreen-visible');
      });
    });
  };

  var closeFullscreen = function (immediate) {
    if (!isFullscreen) {
      if (immediate === true && fullscreenCloseTimer) finishFullscreenClose();
      return;
    }
    isFullscreen = false;
    stopFly();
    map.classList.remove('is-fullscreen-visible');
    map.setAttribute('aria-hidden', 'true');
    setActiveTrip('', false);
    closePointDetails(false, true);
    setActiveRegion('');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
    if (immediate === true || reducedMotionQuery.matches) finishFullscreenClose();
    else fullscreenCloseTimer = window.setTimeout(finishFullscreenClose, 220);
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
      tx = minScale > MIN_SCALE ? (viewport.clientWidth - baseCanvasWidth() * scale) / 2 : 0;
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
    else {
      setActiveTrip('', false);
      closePointDetails(false, true);
      resetView();
    }
  });

  if (teaser) teaser.addEventListener('click', openFullscreen);
  if (closeBtn) closeBtn.addEventListener('click', closeFullscreen);
  if (detailCardClose) {
    detailCardClose.addEventListener('click', function () {
      closePointDetails(true);
    });
  }
  if (tripPicker) {
    tripPicker.addEventListener('change', function () {
      closePointDetails(false, true);
      if (!tripPicker.value) {
        setActiveTrip('', false);
        resetView();
        return;
      }
      setActiveTrip(tripPicker.value, true);
    });
  }
  if (regionsBar) {
    regionsBar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-map-region]');
      if (!button) return;
      var view = REGION_VIEWS[button.getAttribute('data-map-region')];
      if (!view) return;
      setActiveTrip('', false);
      closePointDetails(false, true);
      setActiveRegion(button.getAttribute('data-map-region'));
      flyTo(view.lat, view.lon, view.scale);
    });
  }

  /* The overlay is a modal dialog: Escape closes it and Tab stays inside. */
  document.addEventListener('keydown', function (event) {
    var isEscape = event.key === 'Escape' || event.key === 'Esc';
    if (isEscape && selectedDetail) {
      event.preventDefault();
      closePointDetails(true);
      return;
    }
    if (!isFullscreen) return;
    if (isEscape) {
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
    if (!map.contains(document.activeElement)) {
      /* Focus can leave the overlay by clicking a non-focusable region (the map
         canvas), landing on <body>. Without this branch the next Tab escapes to
         the page behind the modal; pull it back in, matching the lightbox and
         mobile-nav traps. */
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
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
    if (!event.matches) closeFullscreen(true);
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
    var transientScale = scale / committedScale;
    var markerX = marker.offsetLeft * transientScale + tx;
    var markerY = marker.offsetTop * transientScale + ty;
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
  createRouteLayer();
  createDetailPoints();
  resetView();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleLabelLayout);
}());
