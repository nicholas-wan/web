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
  var scrollFrame = null;

  function warmGallery(event) {
    if (!event || event.dataset.galleryWarm === 'true') return;
    event.dataset.galleryWarm = 'true';
    Array.prototype.forEach.call(event.querySelectorAll('.personal-event-card__image--slideshow img'), function (image) {
      image.fetchPriority = 'low';
      image.loading = 'eager';
    });
  }

  timeline.classList.add('is-enhanced');

  function updateTimelineProgress() {
    scrollFrame = null;
    if (!years) return;

    var bounds = years.getBoundingClientRect();
    /* Reveal as the leading edge enters the viewport so a quick scroll never
       leaves bare timeline dots beside cards that still look missing. */
    var readingLine = window.innerHeight * 0.94;
    var progress = (readingLine - bounds.top) / Math.max(bounds.height, 1);
    progress = Math.max(0, Math.min(1, progress));
    years.style.setProperty('--timeline-progress', progress.toFixed(4));

    events.forEach(function (event) {
      var eventBounds = event.getBoundingClientRect();
      var eventRevealPoint = eventBounds.top + Math.min(eventBounds.height * 0.12, 32);
      var reached = eventRevealPoint <= readingLine;
      event.classList.toggle('is-past', reached);
      event.classList.toggle('is-visible', reducedMotion.matches || reached);
    });

    /* On touch, animate only the gallery card nearest the reader's visual
       focus. Other cards return to their first image instead of running three
       synchronized slideshows elsewhere on the page. */
    var galleryFocus = window.innerHeight * 0.55;
    var activeGallery = null;
    var activeGalleryDistance = Infinity;

    if (!reducedMotion.matches) {
      galleryEvents.forEach(function (event) {
        var card = event.querySelector('.personal-event-card');
        var cardBounds = card.getBoundingClientRect();
        var isInReadingBand = cardBounds.bottom > window.innerHeight * 0.15 &&
          cardBounds.top < window.innerHeight * 0.9;
        var distance = Math.abs((cardBounds.top + cardBounds.bottom) / 2 - galleryFocus);

        if (isInReadingBand && distance < activeGalleryDistance) {
          activeGallery = event;
          activeGalleryDistance = distance;
        }
      });
    }

    galleryEvents.forEach(function (event) {
      event.classList.toggle('is-gallery-active', event === activeGallery);
    });
    /* A touch slideshow waits four seconds between frames. Starting these
       nearby low-priority fetches when its card enters the reading band gives
       later frames time to decode without loading every gallery up front. */
    warmGallery(activeGallery);
  }

  function requestProgressUpdate() {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateTimelineProgress);
  }

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('load', requestProgressUpdate);

  updateTimelineProgress();
}());
