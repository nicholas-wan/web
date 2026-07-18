(function () {
  'use strict';

  var timeline = document.querySelector('[data-personal-timeline]');
  if (!timeline) return;

  var years = timeline.querySelector('[data-timeline-years]');
  var events = Array.prototype.slice.call(timeline.querySelectorAll('[data-timeline-event]'));
  var galleryEvents = events.filter(function (event) {
    return event.querySelector('.personal-event-card__image--slideshow');
  });
  var storyButtons = Array.prototype.slice.call(timeline.querySelectorAll('[data-story-open]'));
  var dialog = document.querySelector('[data-story-dialog]');
  var stories = dialog ? Array.prototype.slice.call(dialog.querySelectorAll('[data-story]')) : [];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var activeStory = null;
  var storyOpener = null;
  var scrollFrame = null;

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
  }

  function requestProgressUpdate() {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateTimelineProgress);
  }

  function openStory(storyId) {
    if (!dialog) return;

    activeStory = stories.find(function (story) {
      return story.getAttribute('data-story') === storyId;
    }) || null;
    if (!activeStory) return;

    stories.forEach(function (story) {
      story.classList.toggle('is-active', story === activeStory);
    });
    dialog.classList.toggle('personal-story-dialog--orientation', storyId === 'orientation');

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    document.documentElement.classList.add('personal-story-is-open');
    document.body.classList.add('personal-story-is-open');
    window.setTimeout(function () {
      var closeButton = dialog.querySelector('[data-story-close]');
      if (closeButton) closeButton.focus();
    }, 0);
  }

  function restoreStoryFocus() {
    if (storyOpener && document.contains(storyOpener)) storyOpener.focus();
    storyOpener = null;
  }

  function closeStory() {
    document.documentElement.classList.remove('personal-story-is-open');
    document.body.classList.remove('personal-story-is-open');

    if (dialog && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else {
        dialog.removeAttribute('open');
        restoreStoryFocus();
      }
    }
  }

  storyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      storyOpener = button;
      openStory(button.getAttribute('data-story-open'));
    });
  });

  if (dialog) {
    dialog.addEventListener('click', function (event) {
      var closeButton = event.target.closest('[data-story-close]');

      if (closeButton || event.target === dialog) closeStory();
    });

    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeStory();
    });

    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('personal-story-is-open');
      document.body.classList.remove('personal-story-is-open');
      restoreStoryFocus();
    });
  }

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('load', requestProgressUpdate);

  updateTimelineProgress();
}());
