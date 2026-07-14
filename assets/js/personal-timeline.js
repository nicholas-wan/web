(function () {
  'use strict';

  var timeline = document.querySelector('[data-personal-timeline]');
  if (!timeline) return;

  var years = timeline.querySelector('[data-timeline-years]');
  var events = Array.prototype.slice.call(timeline.querySelectorAll('[data-timeline-event]'));
  var storyButtons = Array.prototype.slice.call(timeline.querySelectorAll('[data-story-open]'));
  var dialog = document.querySelector('[data-story-dialog]');
  var stories = dialog ? Array.prototype.slice.call(dialog.querySelectorAll('[data-story]')) : [];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var duration = parseInt(timeline.getAttribute('data-slide-duration'), 10) || 6500;
  var activeStory = null;
  var activeSlide = 0;
  var autoplayTimer = null;
  var isPlaying = false;
  var scrollFrame = null;

  timeline.classList.add('is-enhanced');

  function updateTimelineProgress() {
    scrollFrame = null;
    if (!years) return;

    var bounds = years.getBoundingClientRect();
    var readingLine = window.innerHeight * 0.56;
    var progress = (readingLine - bounds.top) / Math.max(bounds.height, 1);
    progress = Math.max(0, Math.min(1, progress));
    years.style.setProperty('--timeline-progress', progress.toFixed(4));

    events.forEach(function (event) {
      var eventBounds = event.getBoundingClientRect();
      var eventMiddle = eventBounds.top + (eventBounds.height / 2);
      var reached = eventMiddle <= readingLine;
      event.classList.toggle('is-past', reached);
      event.classList.toggle('is-visible', reducedMotion.matches || reached);
    });
  }

  function requestProgressUpdate() {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateTimelineProgress);
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function activeSlides() {
    if (!activeStory) return [];
    return Array.prototype.slice.call(activeStory.querySelectorAll('.personal-story__slide'));
  }

  function activeChapters() {
    if (!activeStory) return [];
    return Array.prototype.slice.call(activeStory.querySelectorAll('.personal-story__chapter'));
  }

  function updateControls() {
    if (!activeStory) return;
    var slides = activeSlides();
    var counter = activeStory.querySelector('[data-story-counter]');
    var toggle = activeStory.querySelector('[data-story-toggle]');

    if (counter) counter.textContent = (activeSlide + 1) + ' / ' + slides.length;
    if (toggle) {
      toggle.textContent = isPlaying ? 'Pause' : 'Play';
      toggle.setAttribute('aria-label', isPlaying ? 'Pause automatic playback' : 'Play story automatically');
    }
  }

  function restartProgressAnimation() {
    if (!activeStory) return;
    activeStory.classList.remove('is-playing');
    void activeStory.offsetWidth;
    if (isPlaying && activeSlides().length > 1 && !document.hidden) {
      activeStory.classList.add('is-playing');
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    var slides = activeSlides();
    if (!isPlaying || slides.length < 2 || document.hidden) return;

    autoplayTimer = window.setTimeout(function () {
      showSlide(activeSlide + 1);
    }, duration);
  }

  function showSlide(index) {
    var slides = activeSlides();
    var chapters = activeChapters();
    if (!slides.length) return;

    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === activeSlide);
    });
    chapters.forEach(function (chapter, chapterIndex) {
      chapter.classList.toggle('is-active', chapterIndex === activeSlide);
    });

    updateControls();
    restartProgressAnimation();
    scheduleAutoplay();
  }

  function openStory(storyId) {
    if (!dialog) return;
    clearAutoplay();

    activeStory = stories.find(function (story) {
      return story.getAttribute('data-story') === storyId;
    }) || null;
    if (!activeStory) return;

    stories.forEach(function (story) {
      story.classList.toggle('is-active', story === activeStory);
    });
    dialog.classList.toggle('personal-story-dialog--instagram', storyId === 'cats');
    dialog.classList.toggle('personal-story-dialog--orientation', storyId === 'orientation');

    activeStory.style.setProperty('--story-duration', duration + 'ms');
    activeSlide = 0;
    isPlaying = activeSlides().length > 1 && !reducedMotion.matches;
    showSlide(0);

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    if (storyId === 'cats' && window.instgrm && window.instgrm.Embeds) {
      window.setTimeout(function () {
        window.instgrm.Embeds.process();
      }, 0);
    }

    document.body.classList.add('personal-story-is-open');
    window.setTimeout(function () {
      var closeButton = dialog.querySelector('[data-story-close]');
      if (closeButton) closeButton.focus();
    }, 0);
  }

  function closeStory() {
    clearAutoplay();
    if (activeStory) activeStory.classList.remove('is-playing');
    document.body.classList.remove('personal-story-is-open');

    if (dialog && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }

  storyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      openStory(button.getAttribute('data-story-open'));
    });
  });

  if (dialog) {
    dialog.addEventListener('click', function (event) {
      var closeButton = event.target.closest('[data-story-close]');
      var previousButton = event.target.closest('[data-story-previous]');
      var nextButton = event.target.closest('[data-story-next]');
      var toggleButton = event.target.closest('[data-story-toggle]');

      if (closeButton || event.target === dialog) {
        closeStory();
        return;
      }

      if (previousButton) {
        showSlide(activeSlide - 1);
        return;
      }

      if (nextButton) {
        showSlide(activeSlide + 1);
        return;
      }

      if (toggleButton) {
        isPlaying = !isPlaying;
        showSlide(activeSlide);
      }
    });

    dialog.addEventListener('close', function () {
      clearAutoplay();
      document.body.classList.remove('personal-story-is-open');
      if (activeStory) activeStory.classList.remove('is-playing');
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearAutoplay();
      if (activeStory) activeStory.classList.remove('is-playing');
    } else if (activeStory && dialog && dialog.open) {
      restartProgressAnimation();
      scheduleAutoplay();
    }
  });

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);

  updateTimelineProgress();
}());
