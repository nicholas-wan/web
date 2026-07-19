(function () {
  'use strict';

  var timeline = document.querySelector('[data-personal-timeline]');
  if (!timeline) return;

  var years = timeline.querySelector('[data-timeline-years]');
  var events = Array.prototype.slice.call(timeline.querySelectorAll('[data-timeline-event]'));
  var galleryEvents = events.filter(function (event) {
    return event.querySelector('.personal-event-card__image--slideshow');
  });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var singleRail = window.matchMedia('(max-width: 736px)');
  var scrollFrame = null;
  var needsMeasure = false;
  var focusedEvent = null;
  var scrollDirection = 1;
  var touchY = null;

  function warmGallery(event) {
    if (!event || event.dataset.galleryWarm === 'true') return;
    event.dataset.galleryWarm = 'true';
    Array.prototype.forEach.call(event.querySelectorAll('.personal-event-card__image--slideshow img'), function (image) {
      image.fetchPriority = 'low';
      image.loading = 'eager';
    });
  }

  var details = Array.prototype.slice.call(
    timeline.querySelectorAll('.personal-event-card__body > span:not(.personal-event-card__meta)')
  );

  function measureCards() {
    needsMeasure = false;
    var folded = events.filter(function (event) {
      return event.classList.contains('is-condensed');
    });

    timeline.classList.add('is-measuring');
    folded.forEach(function (event) {
      event.classList.remove('is-condensed');
    });
    details.forEach(function (detail) {
      detail.style.removeProperty('--detail-height');
    });

    var detailHeights = details.map(function (detail) {
      return detail.scrollHeight;
    });

    details.forEach(function (detail, index) {
      detail.style.setProperty('--detail-height', detailHeights[index] + 'px');
    });

    folded.forEach(function (event) {
      event.classList.add('is-condensed');
    });
    timeline.classList.remove('is-measuring');
  }

  timeline.classList.add('is-enhanced');
  measureCards();

  function updateTimelineProgress() {
    scrollFrame = null;
    if (!years) return;
    if (needsMeasure) measureCards();

    var viewport = window.innerHeight;
    var bounds = years.getBoundingClientRect();
    var readingLine = viewport * 0.94;
    var progress = (readingLine - bounds.top) / Math.max(bounds.height, 1);
    progress = Math.max(0, Math.min(1, progress));
    years.style.setProperty('--timeline-progress', progress.toFixed(4));

    /* A lower reading line promotes the next card early while moving down. On
       reverse scroll, shift the line upward so the previous card takes focus
       without waiting until it reaches the middle of the viewport. */
    var readingFocusFactor = singleRail.matches
      ? (scrollDirection < 0 ? 0.44 : 0.5)
      : (scrollDirection < 0 ? 0.54 : 0.62);
    var readingFocus = viewport * readingFocusFactor;
    var foldAbove = viewport * 0.48;
    var unfoldBelow = viewport * 0.58;
    var eventBounds = [];
    var distances = [];
    var focusEvent = null;
    var focusDistance = Infinity;

    events.forEach(function (event, index) {
      var rect = event.getBoundingClientRect();
      eventBounds[index] = rect;
      distances[index] = Infinity;

      var eventRevealPoint = rect.top + Math.min(rect.height * 0.12, 32);
      var reached = eventRevealPoint <= readingLine;
      event.classList.toggle('is-past', reached);

      /* The reveal is an entrance, not a state. Re-deriving it from position
         every frame meant scrolling up ran the entrance backwards: each card
         crossing back under the reading line faded to nothing and slid out
         through its 1.5rem offset, so an upward read dismantled the timeline
         card by card. The rail dot above still tracks position both ways. */
      if (reducedMotion.matches || reached) event.classList.add('is-visible');

      if (reducedMotion.matches || rect.bottom <= 0 || rect.top >= viewport) return;
      distances[index] = Math.abs((rect.top + rect.bottom) / 2 - readingFocus);
      if (distances[index] < focusDistance) {
        focusDistance = distances[index];
        focusEvent = event;
      }
    });

    /* Height changes can move the focus boundary, so keep the current card
       until its successor is clearly nearer. */
    var heldIndex = events.indexOf(focusedEvent);
    var focusMargin = scrollDirection < 0 ? 16 : 48;
    if (heldIndex !== -1 && distances[heldIndex] !== Infinity &&
        focusEvent !== focusedEvent && focusDistance > distances[heldIndex] - focusMargin) {
      focusEvent = focusedEvent;
    }
    focusedEvent = focusEvent;

    events.forEach(function (event, index) {
      var folded;

      if (singleRail.matches) {
        folded = event !== focusEvent;
      } else {
        folded = event.classList.contains('is-condensed');
        if (eventBounds[index].bottom < foldAbove) folded = true;
        else if (eventBounds[index].bottom > unfoldBelow) folded = false;
        if (event === focusEvent) folded = false;
      }

      event.classList.toggle('is-focus', event === focusEvent);
      event.classList.toggle('is-condensed', folded && !reducedMotion.matches);
    });

    var activeGallery = null;
    var activeGalleryDistance = Infinity;

    if (!reducedMotion.matches) {
      galleryEvents.forEach(function (event) {
        var cardBounds = event.querySelector('.personal-event-card').getBoundingClientRect();
        var isInReadingBand = cardBounds.bottom > viewport * 0.15 && cardBounds.top < viewport * 0.9;
        var distance = event === focusEvent
          ? -1
          : Math.abs((cardBounds.top + cardBounds.bottom) / 2 - readingFocus);

        if (isInReadingBand && distance < activeGalleryDistance) {
          activeGallery = event;
          activeGalleryDistance = distance;
        }
      });
    }

    galleryEvents.forEach(function (event) {
      event.classList.toggle('is-gallery-active', event === activeGallery);
    });
    warmGallery(activeGallery);
  }

  function requestProgressUpdate() {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateTimelineProgress);
  }

  function remeasureAndUpdate() {
    needsMeasure = true;
    requestProgressUpdate();
  }

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('wheel', function (event) {
    if (event.deltaY) scrollDirection = event.deltaY < 0 ? -1 : 1;
  }, { passive: true });
  window.addEventListener('touchstart', function (event) {
    touchY = event.touches.length ? event.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener('touchmove', function (event) {
    if (touchY === null || !event.touches.length) return;
    var nextTouchY = event.touches[0].clientY;
    if (Math.abs(nextTouchY - touchY) > 2) scrollDirection = nextTouchY > touchY ? -1 : 1;
    touchY = nextTouchY;
  }, { passive: true });
  window.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home') scrollDirection = -1;
    else if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'End' || event.key === ' ') scrollDirection = 1;
  });
  window.addEventListener('resize', remeasureAndUpdate);
  if (singleRail.addEventListener) singleRail.addEventListener('change', remeasureAndUpdate);
  window.addEventListener('load', remeasureAndUpdate);

  updateTimelineProgress();
}());
