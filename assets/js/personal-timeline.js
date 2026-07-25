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
  var focusAnimationFrame = null;
  var focusAnimationTimer = null;
  var focusAnimatedEvents = [];
  var lastScrollY = window.scrollY;
  var lastScrollTime = Date.now();
  var scrollVelocity = 0;
  var velocityDecayTimer = null;
  var touchTime = null;
  var MAX_FOCUS_ANIMATION_VELOCITY = 0.85;
  var MAX_FOLD_ANIMATION_VELOCITY = 0.85;
  var resnapping = false;

  function cancelFocusAnimations() {
    if (focusAnimationFrame !== null) window.cancelAnimationFrame(focusAnimationFrame);
    if (focusAnimationTimer !== null) window.clearTimeout(focusAnimationTimer);
    focusAnimatedEvents.forEach(function (event) {
      event.classList.remove('is-focus-flipping', 'is-focus-flipping-active', 'is-focus-revealing');
      event.style.removeProperty('--focus-flip-y');
      event.style.removeProperty('--focus-reveal-bottom');
    });
    focusAnimationFrame = null;
    focusAnimationTimer = null;
    focusAnimatedEvents = [];
  }

  /* Keep the fold/unfold itself atomic so Safari never follows a changing
     document height during momentum scrolling. FLIP the rendered event boxes
     from their old geometry to the new geometry instead: transforms stay on
     the compositor and make the same handoff read as a short, smooth resize. */
  function animateMobileFocusHandoff(beforeBounds, previousEvent, nextEvent) {
    if (!singleRail.matches || reducedMotion.matches || !previousEvent || !nextEvent ||
        previousEvent === nextEvent) return;

    var previousIndex = events.indexOf(previousEvent);
    var nextIndex = events.indexOf(nextEvent);
    if (Math.abs(previousIndex - nextIndex) !== 1 || scrollVelocity > MAX_FOCUS_ANIMATION_VELOCITY) {
      cancelFocusAnimations();
      return;
    }

    cancelFocusAnimations();

    [previousEvent, nextEvent].forEach(function (event) {
      var index = events.indexOf(event);
      var before = beforeBounds[index];
      var after = event.getBoundingClientRect();

      var deltaY = before.top - after.top;
      var revealBottom = event === nextEvent ? Math.max(after.height - before.height, 0) : 0;
      if (Math.abs(deltaY) < 0.5 && revealBottom < 0.5) return;

      event.style.setProperty('--focus-flip-y', deltaY.toFixed(2) + 'px');
      if (revealBottom >= 0.5) {
        event.style.setProperty('--focus-reveal-bottom', revealBottom.toFixed(2) + 'px');
        event.classList.add('is-focus-revealing');
      }
      event.classList.add('is-focus-flipping');
      focusAnimatedEvents.push(event);
    });

    if (!focusAnimatedEvents.length) return;
    /* Commit the inverted geometry before starting the transform transition. */
    timeline.offsetHeight;
    focusAnimationFrame = window.requestAnimationFrame(function () {
      focusAnimationFrame = null;
      focusAnimatedEvents.forEach(function (event) {
        event.classList.add('is-focus-flipping-active');
        event.style.setProperty('--focus-flip-y', '0px');
        event.style.setProperty('--focus-reveal-bottom', '0px');
      });
      focusAnimationTimer = window.setTimeout(cancelFocusAnimations, 210);
    });
  }

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
    /* --detail-height is a max-height cap, and is-focus grows --image-col, which
       narrows the text column: a description wraps to more lines focused than it
       does at rest. Measuring at rest capped six of nine cards below their
       focused height, so overflow: hidden ate the last line of whichever card the
       visitor was being asked to read. Measure every card in the focused
       geometry instead — that is the narrowest column any card ever gets, so the
       cap becomes a worst case and a card needing less simply never reaches it. */
    var focused = events.filter(function (event) {
      return event.classList.contains('is-focus');
    });

    timeline.classList.add('is-measuring');
    folded.forEach(function (event) {
      event.classList.remove('is-condensed');
    });
    events.forEach(function (event) {
      event.classList.add('is-focus');
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

    events.forEach(function (event) {
      if (focused.indexOf(event) === -1) event.classList.remove('is-focus');
    });
    folded.forEach(function (event) {
      event.classList.add('is-condensed');
    });
    /* Commit the restored folded geometry while transitions are still
       suppressed. Without this read the before-change style is the fully open
       one measured above, and CSS Transitions takes transition-* from the
       after-change style — so is-measuring's transition: none could not stop it
       and every foldable property animated back down from open on each load and
       on every frame of a resize drag. */
    timeline.offsetHeight;
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
    var previousFocusedEvent = focusedEvent;
    focusedEvent = focusEvent;

    /* Fast desktop scrolling piles half-finished fold transitions across many
       cards. Above reading speed, snap the folds in one atomic pass (the
       is-measuring pattern) instead of smearing; the class drops as velocity
       decays so the next slow frame animates the settle. The single rail is
       exempt — its handoff is already atomic with a compositor FLIP. */
    var desktopFold = !singleRail.matches && !reducedMotion.matches;
    var suppressFolds = desktopFold && scrollVelocity > MAX_FOLD_ANIMATION_VELOCITY;
    if (suppressFolds !== resnapping) {
      timeline.classList.toggle('is-resnapping', suppressFolds);
      resnapping = suppressFolds;
    }

    /* When a fold is applied atomically it changes card heights in one frame,
       and any height change above the card being read drags it up or down. Pin
       the focused card: note where it sits before the fold pass, then correct
       the scroll by however far the fold moved it. Reading the post-fold
       position back forces layout first, so a browser whose native scroll
       anchoring already held the card reports ~0 here and this stays a no-op;
       it only takes over where anchoring is absent, never double-compensating.
       Slow (animated) frames are left to native anchoring — the synchronous
       read sees the not-yet-advanced transition, so there is nothing to cancel
       and no scroll is written mid-read. */
    var anchorIndex = suppressFolds && focusEvent ? events.indexOf(focusEvent) : -1;
    var anchorBefore = anchorIndex !== -1 ? eventBounds[anchorIndex].top : null;

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

    if (anchorBefore !== null) {
      var foldShift = focusEvent.getBoundingClientRect().top - anchorBefore;
      /* Sub-pixel noise is not worth a scroll write, and a shift near a whole
         viewport means focus jumped to a distant card rather than a fold nudging
         the current one — a deliberate move, not drift to cancel. */
      if (Math.abs(foldShift) > 0.5 && Math.abs(foldShift) < viewport * 0.9) {
        window.scrollBy(0, foldShift);
        /* Absorb the correction so trackScroll does not read it back as user
           scroll velocity on the next event. */
        lastScrollY = window.scrollY;
      }
    }

    animateMobileFocusHandoff(eventBounds, previousFocusedEvent, focusEvent);

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

  function trackScroll() {
    var now = Date.now();
    var nextScrollY = window.scrollY;
    var elapsed = Math.max(1, Math.min(now - lastScrollTime, 80));
    var measuredVelocity = Math.abs(nextScrollY - lastScrollY) / elapsed;
    scrollVelocity = Math.max(measuredVelocity, scrollVelocity * 0.72);
    lastScrollY = nextScrollY;
    lastScrollTime = now;
    /* Velocity decays per scroll event, so a movement that ends abruptly with no
       further events — a keyboard End/Home jump, a scrollbar release — left the
       last high reading latched and is-resnapping with it, holding
       transition: none !important over the whole timeline until the visitor
       scrolled again. Settle it once the page actually stops moving. */
    if (velocityDecayTimer !== null) window.clearTimeout(velocityDecayTimer);
    velocityDecayTimer = window.setTimeout(function () {
      velocityDecayTimer = null;
      scrollVelocity = 0;
      requestProgressUpdate();
    }, 180);
    requestProgressUpdate();
  }

  window.addEventListener('scroll', trackScroll, { passive: true });
  window.addEventListener('wheel', function (event) {
    if (event.deltaY) {
      scrollDirection = event.deltaY < 0 ? -1 : 1;
    }
  }, { passive: true });
  window.addEventListener('touchstart', function (event) {
    touchY = event.touches.length ? event.touches[0].clientY : null;
    touchTime = Date.now();
    lastScrollY = window.scrollY;
    lastScrollTime = touchTime;
  }, { passive: true });
  window.addEventListener('touchmove', function (event) {
    if (touchY === null || !event.touches.length) return;
    var nextTouchY = event.touches[0].clientY;
    var nextTouchTime = Date.now();
    var touchElapsed = Math.max(nextTouchTime - touchTime, 1);
    scrollVelocity = Math.max(scrollVelocity, Math.abs(nextTouchY - touchY) / touchElapsed);
    if (Math.abs(nextTouchY - touchY) > 2) scrollDirection = nextTouchY > touchY ? -1 : 1;
    touchY = nextTouchY;
    touchTime = nextTouchTime;
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
