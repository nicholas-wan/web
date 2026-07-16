(function () {
  'use strict';

  var timeline = document.querySelector('[data-personal-timeline]');
  if (!timeline) return;

  var years = timeline.querySelector('[data-timeline-years]');
  var events = Array.prototype.slice.call(timeline.querySelectorAll('[data-timeline-event]'));
  var storyButtons = Array.prototype.slice.call(timeline.querySelectorAll('[data-story-open]'));
  var catsPreviewEvent = timeline.querySelector('.personal-timeline-event--cats-preview');
  var catsPreviewButton = timeline.querySelector('[data-cats-preview-toggle]');
  var dialog = document.querySelector('[data-story-dialog]');
  var stories = dialog ? Array.prototype.slice.call(dialog.querySelectorAll('[data-story]')) : [];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var activeStory = null;
  var scrollFrame = null;
  var catsHoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var catsOpenedByHover = false;
  var catsOpenedAt = 0;

  timeline.classList.add('is-enhanced');

  function updateTimelineProgress() {
    scrollFrame = null;
    if (!years) return;

    var bounds = years.getBoundingClientRect();
    var readingLine = window.innerHeight * 0.72;
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

    document.body.classList.add('personal-story-is-open');
    window.setTimeout(function () {
      var closeButton = dialog.querySelector('[data-story-close]');
      if (closeButton) closeButton.focus();
    }, 0);
  }

  function closeStory() {
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

  function setCatsPreview(open) {
    if (!catsPreviewEvent || !catsPreviewButton) return;
    if (catsPreviewEvent.classList.contains('is-cats-preview-open') === open) return;
    catsPreviewEvent.classList.toggle('is-cats-preview-open', open);
    catsPreviewButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      catsOpenedAt = Date.now();
      if (window.instgrm && window.instgrm.Embeds) {
        window.setTimeout(function () { window.instgrm.Embeds.process(); }, 0);
      }
    } else {
      catsOpenedByHover = false;
    }
  }

  if (catsPreviewEvent && catsPreviewButton) {
    catsPreviewButton.addEventListener('click', function () {
      var isOpen = catsPreviewEvent.classList.contains('is-cats-preview-open');
      if (catsHoverCapable && isOpen) {
        /* Hover already opened it; an explicit click pins it so a later scroll
           or mouseleave won't dismiss the thing the user just reached for. */
        catsOpenedByHover = false;
        return;
      }
      setCatsPreview(!isOpen);
    });

    if (catsHoverCapable) {
      /* Bind the opener to the card only (not the full-width timeline row) so
         sweeping the cursor across the empty gutter can't trigger a 29rem
         layout jump; closing is bound to the whole row so moving card→popover
         (a child of the row) doesn't count as leaving. */
      catsPreviewButton.addEventListener('mouseenter', function () {
        catsOpenedByHover = true;
        setCatsPreview(true);
      });
      catsPreviewEvent.addEventListener('mouseleave', function () { if (catsOpenedByHover) setCatsPreview(false); });
    }

    catsPreviewEvent.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!catsPreviewEvent.contains(document.activeElement)) setCatsPreview(false);
      }, 0);
    });

    document.addEventListener('click', function (event) {
      if (!catsPreviewEvent.contains(event.target)) setCatsPreview(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setCatsPreview(false);
    });
  }

  if (dialog) {
    dialog.addEventListener('click', function (event) {
      var closeButton = event.target.closest('[data-story-close]');

      if (closeButton || event.target === dialog) {
        closeStory();
      }
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('personal-story-is-open');
    });
  }

  window.addEventListener('scroll', function () {
    /* Only the desktop hover popover auto-dismisses on scroll, and only after a
       grace period so the opening/momentum scroll can't close it instantly. The
       mobile tap-to-open accordion stays put until toggled, dismissed, or
       Escape — otherwise the first scroll to reach it (or an iOS URL-bar
       collapse) would slam it shut before it can be read. */
    if (catsHoverCapable && catsOpenedByHover &&
        catsPreviewEvent && catsPreviewEvent.classList.contains('is-cats-preview-open') &&
        Date.now() - catsOpenedAt > 400) {
      setCatsPreview(false);
    }
    requestProgressUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  window.addEventListener('load', requestProgressUpdate);

  updateTimelineProgress();
}());
