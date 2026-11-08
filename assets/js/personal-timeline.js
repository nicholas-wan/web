(function () {
  'use strict';

  var timeline = document.querySelector('[data-personal-timeline]');
  if (!timeline) return;

  var years = timeline.querySelector('[data-timeline-years]');
  /* Only the rail fill reads --timeline-progress; setting it on the years
     container invalidated every card's style on each scroll frame. */
  var progressFill = timeline.querySelector('[data-timeline-progress]');
  var events = Array.prototype.slice.call(timeline.querySelectorAll('[data-timeline-event]'));
  var galleryEvents = events.filter(function (event) {
    return event.querySelector('.personal-event-card__image--slideshow');
  });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var singleRail = window.matchMedia('(max-width: 736px)');
  var scrollFrame = null;
  var pageLoaded = document.readyState === 'complete';
  var focusedEvent = null;
  var scrollDirection = 1;
  var lastScrollY = window.scrollY;

  /* The first frame is the one on screen, so it loads at high priority and
     the frames after the next at low. Chrome raises any laid-out image in the
     viewport to high, even hidden or at opacity 0, so those download through
     a detached image and get their sources back once that arrives (Nov 2026).
     The next frame loads in place: it is due two seconds after activation, and
     handed back that way Chrome logged its fade-in as a new, larger LCP (the
     opened Cats card, 2.1 s to 5.6 s on slow 4G; frames 3-5 were not). */
  function warmGallery(event) {
    if (!event || event.dataset.galleryWarm === 'true') return;
    event.dataset.galleryWarm = 'true';
    Array.prototype.forEach.call(event.querySelectorAll('.personal-event-card__image--slideshow img'), function (image, index) {
      var src = image.getAttribute('src');
      var srcset = image.getAttribute('srcset');
      if (index < 2 || image.complete || !src) {
        if (!index) image.fetchPriority = 'high';
        image.loading = 'eager';
        return;
      }
      var probe = new Image();
      image.style.visibility = 'hidden';
      image.removeAttribute('srcset');
      image.removeAttribute('src');
      probe.onload = probe.onerror = function () {
        if (srcset) image.setAttribute('srcset', srcset);
        image.setAttribute('src', src);
        image.loading = 'eager';
        image.style.visibility = '';
      };
      probe.fetchPriority = 'low';
      probe.sizes = image.sizes;
      if (srcset) probe.srcset = srcset;
      probe.src = src;
    });
  }

  /* A low-priority frame can still be on its way when its crossfade starts:
     on slow 4G the Cats card faded its first photo out to an empty frame for
     ~0.75 s and the second popped in unfaded (Nov 2026). Each frame's fade-in
     fires animationstart at opacity 0, so hold the whole slideshow there until
     that photo arrives (or fails), then let the crossfade carry on. */
  document.addEventListener('animationstart', function (startEvent) {
    var image = startEvent.target;
    if (image.tagName !== 'IMG' || !image.previousElementSibling) return;
    var slideshow = image.closest('.personal-event-card__image--slideshow');
    if (!slideshow || (image.getAttribute('src') && image.complete)) return;
    slideshow.classList.add('is-awaiting-frame');
    var resume = function () {
      if (!image.getAttribute('src') || !image.complete) return;
      image.removeEventListener('load', resume);
      image.removeEventListener('error', resume);
      slideshow.classList.remove('is-awaiting-frame');
    };
    image.addEventListener('load', resume);
    image.addEventListener('error', resume);
  });

  timeline.classList.add('is-enhanced');

  /* Focus and dimming change only opacity, transform, border and shadow. Cards
     never change size with scroll position (9 Nov 2026): the old fold/unfold
     moved the page under the card being read on 40% of desktop frames, and
     the FLIP handoffs, scroll pinning and velocity gates built to hide that
     could not. Nothing here writes scroll or changes layout. */
  function updateTimelineProgress() {
    scrollFrame = null;
    if (!years) return;

    var scrollY = window.scrollY;
    if (scrollY !== lastScrollY) scrollDirection = scrollY < lastScrollY ? -1 : 1;
    lastScrollY = scrollY;

    var viewport = window.innerHeight;
    var bounds = years.getBoundingClientRect();
    var readingLine = viewport * 0.94;
    var progress = (readingLine - bounds.top) / Math.max(bounds.height, 1);
    progress = Math.max(0, Math.min(1, progress));
    if (progressFill) progressFill.style.setProperty('--timeline-progress', progress.toFixed(4));

    /* A lower reading line promotes the next card early while moving down. On
       reverse scroll, shift the line upward so the previous card takes focus
       without waiting until it reaches the middle of the viewport. */
    var readingFocusFactor = singleRail.matches
      ? (scrollDirection < 0 ? 0.44 : 0.5)
      : (scrollDirection < 0 ? 0.54 : 0.62);
    var readingFocus = viewport * readingFocusFactor;
    var dimAbove = viewport * 0.48;
    var undimBelow = viewport * 0.58;
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
         card by card. The rail dot above still tracks position both ways.
         It starts as soon as any of the card is on screen: waiting for the
         reading line left cards blank or faint along the bottom edge. */
      if (reducedMotion.matches || reached || rect.top < viewport) event.classList.add('is-visible');

      if (reducedMotion.matches || rect.bottom <= 0 || rect.top >= viewport) return;
      distances[index] = Math.abs((rect.top + rect.bottom) / 2 - readingFocus);
      if (distances[index] < focusDistance) {
        focusDistance = distances[index];
        focusEvent = event;
      }
    });

    /* Keep the current card until its successor is clearly nearer, so focus
       does not flicker between two cards near the reading line. */
    var heldIndex = events.indexOf(focusedEvent);
    var focusMargin = scrollDirection < 0 ? 16 : 48;
    if (heldIndex !== -1 && distances[heldIndex] !== Infinity &&
        focusEvent !== focusedEvent && focusDistance > distances[heldIndex] - focusMargin) {
      focusEvent = focusedEvent;
    }
    focusedEvent = focusEvent;

    /* At either end of the page the reading line cannot reach the first or
       last cards, so they would stay dimmed while parked in view. */
    var atEnd = scrollY + viewport >= document.documentElement.scrollHeight - 2;
    var atEdge = atEnd || scrollY <= 2;

    /* Phones dim every card but the one being read. Desktop dims only cards
       already read, with a band between the two lines so a card resting on
       the boundary does not flicker. */
    events.forEach(function (event, index) {
      var dimmed;

      if (singleRail.matches) {
        dimmed = event !== focusEvent;
      } else {
        dimmed = event.classList.contains('is-dimmed');
        if (eventBounds[index].bottom < dimAbove) dimmed = true;
        else if (eventBounds[index].bottom > undimBelow) dimmed = false;
        if (event === focusEvent) dimmed = false;
      }
      if (atEdge && eventBounds[index].top < viewport && eventBounds[index].bottom > 0) dimmed = false;

      event.classList.toggle('is-focus', event === focusEvent);
      event.classList.toggle('is-dimmed', dimmed && !reducedMotion.matches);
    });

    var activeGallery = null;
    var activeGalleryDistance = Infinity;

    if (!reducedMotion.matches) {
      galleryEvents.forEach(function (event) {
        var cardBounds = event.querySelector('.personal-event-card').getBoundingClientRect();
        var isInReadingBand = cardBounds.bottom > viewport * 0.15 && cardBounds.top < viewport * 0.9;
        /* On touch, later frames stay out of layout (so unloaded) until a
           gallery is warm. Warm each as soon as its card is on screen, ahead of
           activation in the reading band and its first crossfade two seconds
           later. Measured on slow 4G at reading pace, every gallery had all its
           frames by activation; a two-viewport lead restored ~400 KB of the
           first-load saving for no visible gain. Until the page has loaded
           only the active gallery warms (below): warming every on-screen card
           at once pulled ~255 KB of hidden frames in with the visible photos
           and held the first screen back ~1.2 s on slow 4G (Nov 2026). */
        if (pageLoaded && cardBounds.top < viewport && cardBounds.bottom > 0) warmGallery(event);
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

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  singleRail.addEventListener('change', requestProgressUpdate);
  window.addEventListener('load', function () {
    pageLoaded = true;
    requestProgressUpdate();
  });

  updateTimelineProgress();
}());
