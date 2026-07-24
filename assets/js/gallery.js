(function () {
  var journalAnimations = Array.prototype.slice.call(document.querySelectorAll('video.journal-animation'));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* The build renames each animation's autoplay attribute to data-autoplay,
     because the attribute makes the browser download every video at page load.
     Playback starts here instead, and only once the animation is near the
     viewport; leaving again pauses it so long journals do not keep dozens of
     offscreen loops decoding. */
  var syncAnimation = function (video) {
    if (reducedMotion.matches) {
      video.pause();
      video.currentTime = 0;
    } else if (video.__nearViewport) {
      var playback = video.play();
      if (playback && playback.catch) playback.catch(function () {});
    } else {
      video.pause();
    }
  };
  var syncAnimationPreference = function () {
    journalAnimations.forEach(syncAnimation);
  };
  if (journalAnimations.length) {
    if ('IntersectionObserver' in window) {
      var animationWarmup = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.__nearViewport = entry.isIntersecting;
          syncAnimation(entry.target);
        });
      }, { rootMargin: '600px' });
      journalAnimations.forEach(function (video) { animationWarmup.observe(video); });
    } else {
      journalAnimations.forEach(function (video) { video.__nearViewport = true; });
      syncAnimationPreference();
    }
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncAnimationPreference);
    else if (reducedMotion.addListener) reducedMotion.addListener(syncAnimationPreference);
  }

  var images = Array.prototype.slice.call(document.querySelectorAll('#main img')).filter(function (image, index, candidates) {
    return !image.classList.contains('countrylogo') &&
      !image.hasAttribute('data-lightbox-ignore') &&
      // The journal banner is a hero, not a gallery photo: it should not get a
      // zoom cursor or open the lightbox. Exclude it by class, with the hero
      // container as belt-and-braces in case the class ever moves.
      !image.classList.contains('journal-banner') &&
      !image.closest('.travel-journal__hero-image, .guangzhou-journal__hero-image') &&
      !image.closest('.travel-section-nav, .travel-pagination, .site-pager') &&
      candidates.indexOf(image) === index;
  });
  var galleryMedia = images.concat(journalAnimations).sort(function (left, right) {
    return left.compareDocumentPosition(right) & 4 ? -1 : 1;
  });
  if (!galleryMedia.length) return;

  /* Native lazy loading is deliberately conservative, which can leave a
     blank tile after a quick journal scroll or horizontal swipe. Warm only
     the low-priority images approaching the viewport; the rest keep their
     native lazy behaviour and do not compete with the page's first image. */
  var warmImage = function (image) {
    if (image.loading !== 'lazy') return;
    image.fetchPriority = 'low';
    image.loading = 'eager';
  };
  if ('IntersectionObserver' in window) {
    var imageWarmup = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        warmImage(entry.target);
        imageWarmup.unobserve(entry.target);
      });
    }, { rootMargin: '900px' });
    images.forEach(function (image) {
      if (image.loading === 'lazy') imageWarmup.observe(image);
    });
  }

  /* Backfill alt text from each photo's caption so screen readers (and the
     lightbox trigger's aria-label below) announce the real place instead of a
     filename. Journal images carry .content-text / .content-title captions. */
  images.forEach(function (image) {
    if (image.getAttribute('alt')) return;
    var content = image.closest('.content');
    var cap = content && content.querySelector('.content-text, .content-title, .gallery-caption');
    if (cap && cap.textContent.trim()) image.setAttribute('alt', cap.textContent.trim());
  });

  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Media viewer');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close media viewer">&times;</button>' +
    '<button class="lightbox__previous" type="button" aria-label="Previous media">&#8592;</button>' +
    '<figure class="lightbox__figure"><img class="lightbox__image" alt=""><video class="lightbox__image lightbox__video" role="button" tabindex="0" aria-label="Pause animation" loop muted playsinline hidden></video><figcaption class="lightbox__caption"></figcaption></figure>' +
    '<button class="lightbox__next" type="button" aria-label="Next media">&#8594;</button>';
  document.body.appendChild(overlay);

  var current = 0;
  var viewerImage = overlay.querySelector('img.lightbox__image');
  var viewerVideo = overlay.querySelector('.lightbox__video');
  var caption = overlay.querySelector('.lightbox__caption');
  /* aria-modal tells assistive tech the page behind the dialog is gone, so
     focus must actually move into the dialog on open, stay inside it while it
     is up, and land back on the opening photo on close. */
  var lastTrigger = null;
  var closeButton = overlay.querySelector('.lightbox__close');
  /* The clips are muted GIF-style loops, so native scrub/fullscreen chrome is
     pure noise. The whole frame is a play/pause button instead: keyboard
     operable, and labelled with the action it performs. The label tracks real
     playback state (loop, reduced-motion) so a pause affordance always survives
     (WCAG pause-stop-hide) — including the reduced-motion case, which opens the
     clip paused with the toggle as the only way to ever start it. */
  var syncVideoLabel = function () {
    viewerVideo.setAttribute('aria-label', viewerVideo.paused ? 'Play animation' : 'Pause animation');
  };
  var toggleVideo = function () {
    if (viewerVideo.paused) {
      var resume = viewerVideo.play();
      if (resume && resume.catch) resume.catch(function () {});
    } else {
      viewerVideo.pause();
    }
  };
  viewerVideo.addEventListener('click', toggleVideo);
  viewerVideo.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      toggleVideo();
    }
  });
  viewerVideo.addEventListener('play', syncVideoLabel);
  viewerVideo.addEventListener('pause', syncVideoLabel);
  var lockedScrollY = 0;
  var lockBackgroundScroll = function () {
    lockedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('lightbox-open');
    document.body.style.setProperty('--lightbox-scroll-offset', '-' + lockedScrollY + 'px');
    document.body.classList.add('lightbox-open');
  };
  var unlockBackgroundScroll = function () {
    document.documentElement.classList.remove('lightbox-open');
    document.body.classList.remove('lightbox-open');
    document.body.style.removeProperty('--lightbox-scroll-offset');
    window.scrollTo(0, lockedScrollY);
  };
  var close = function () {
    viewerVideo.pause();
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    unlockBackgroundScroll();
    if (lastTrigger) { lastTrigger.focus({ preventScroll: true }); lastTrigger = null; }
  };
  var show = function (index) {
    var opening = !overlay.classList.contains('is-visible');
    current = (index + galleryMedia.length) % galleryMedia.length;
    var source = galleryMedia[current];
    var isVideo = source.tagName === 'VIDEO';
    var accessibleName = source.alt || source.getAttribute('aria-label') || 'Gallery media';
    if (isVideo) {
      viewerImage.hidden = true;
      viewerVideo.hidden = false;
      viewerVideo.src = source.currentSrc || source.querySelector('source').src;
      viewerVideo.poster = source.poster;
      if (reducedMotion.matches) viewerVideo.pause();
      else {
        var lightboxPlayback = viewerVideo.play();
        if (lightboxPlayback && lightboxPlayback.catch) lightboxPlayback.catch(function () {});
      }
      syncVideoLabel();
    } else {
      viewerVideo.pause();
      viewerVideo.hidden = true;
      viewerImage.hidden = false;
      warmImage(source);
      viewerImage.src = source.currentSrc || source.src;
      viewerImage.alt = accessibleName;
    }
    /* Caption = place + detail. `.content-title` is often the city (repeated
       across dozens of photos) and `.content-text` the actual location, so show
       both, de-duplicated, rather than just the first match (which was the city). */
    var content = source.closest('.content');
    var parts = [];
    if (content) {
      var titleEl = content.querySelector('.content-title');
      var textEl = content.querySelector('.content-text, .gallery-caption');
      if (titleEl) parts.push(titleEl.textContent.trim());
      if (textEl) parts.push(textEl.textContent.trim());
    } else {
      var figCaption = source.closest('figure') ? source.closest('figure').querySelector('figcaption') : null;
      if (figCaption) parts.push(figCaption.textContent.trim());
    }
    parts = parts.filter(function (part, index) { return part && parts.indexOf(part) === index; });
    if (!parts.length) parts.push(accessibleName);
    caption.textContent = parts.join(' · ');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    if (opening) {
      lockBackgroundScroll();
      closeButton.focus();
    }
  };

  /* Touch and pen users get the same circular previous/next navigation as the
     buttons and arrow keys. Listen on the full overlay so short landscape media
     still has a generous gesture surface. Native touch events are the reliable
     iPhone path; Pointer Events are kept for pens only to avoid double-firing. */
  var SWIPE_THRESHOLD = 48;
  var SWIPE_AXIS_RATIO = 1.25;
  var SWIPE_CLICK_SLOP = 10;
  var swipePointerId = null;
  var swipeTouchId = null;
  var swipeStartX = 0;
  var swipeStartY = 0;
  var ignoreClickUntil = 0;
  var cancelSwipe = function () {
    swipePointerId = null;
    swipeTouchId = null;
  };
  var startsOnControl = function (target) {
    return target.closest && target.closest('button');
  };
  var completeSwipe = function (endX, endY, event) {
    var deltaX = endX - swipeStartX;
    var deltaY = endY - swipeStartY;
    var horizontalDistance = Math.abs(deltaX);
    var verticalDistance = Math.abs(deltaY);
    cancelSwipe();
    if (Math.max(horizontalDistance, verticalDistance) >= SWIPE_CLICK_SLOP) {
      ignoreClickUntil = Date.now() + 500;
    }
    if (horizontalDistance < SWIPE_THRESHOLD || horizontalDistance <= verticalDistance * SWIPE_AXIS_RATIO) return;
    if (event.cancelable) event.preventDefault();
    show(current + (deltaX < 0 ? 1 : -1));
  };

  overlay.addEventListener('touchstart', function (event) {
    if (!overlay.classList.contains('is-visible') || event.touches.length !== 1 || startsOnControl(event.target)) {
      cancelSwipe();
      return;
    }
    var touch = event.touches[0];
    swipeTouchId = touch.identifier;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
  }, { passive: true });
  overlay.addEventListener('touchend', function (event) {
    if (swipeTouchId === null) return;
    for (var index = 0; index < event.changedTouches.length; index += 1) {
      var touch = event.changedTouches[index];
      if (touch.identifier === swipeTouchId) {
        completeSwipe(touch.clientX, touch.clientY, event);
        return;
      }
    }
    cancelSwipe();
  }, { passive: false });
  overlay.addEventListener('touchcancel', cancelSwipe, { passive: true });

  overlay.addEventListener('pointerdown', function (event) {
    if (!overlay.classList.contains('is-visible') || event.pointerType !== 'pen' || startsOnControl(event.target)) return;
    if (!event.isPrimary) {
      cancelSwipe();
      return;
    }
    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    if (overlay.setPointerCapture) overlay.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener('pointerup', function (event) {
    if (event.pointerId !== swipePointerId) return;
    completeSwipe(event.clientX, event.clientY, event);
  });
  overlay.addEventListener('pointercancel', cancelSwipe);
  overlay.addEventListener('click', function (event) {
    if (Date.now() >= ignoreClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  galleryMedia.forEach(function (media, index) {
    var trigger = media.closest('.content') || media;
    media.classList.add('journal-lightbox-trigger');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', 'Open media: ' + (media.alt || media.getAttribute('aria-label') || ('journal item ' + (index + 1))));
    trigger.addEventListener('click', function (event) { event.preventDefault(); lastTrigger = trigger; show(index); });
    trigger.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lastTrigger = trigger; show(index); } });
  });

  /* Compact mobile journals are horizontal. A fading edge plus one short cue
     makes that interaction discoverable, then gets out of the way after the
     visitor actually scrolls each gallery. */
  Array.prototype.forEach.call(document.querySelectorAll('.travel-gallery--compact, .guangzhou-day--compact .masonry'), function (gallery) {
    var shell = document.createElement('div');
    var cue = document.createElement('div');

    shell.className = 'journal-gallery-shell';
    gallery.parentNode.insertBefore(shell, gallery);
    shell.appendChild(gallery);

    cue.className = 'journal-scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<span>Swipe to browse</span><i aria-hidden="true">&#8596;</i>';
    shell.appendChild(cue);

    var refreshCue = function () {
      var scrollable = gallery.scrollWidth > gallery.clientWidth + 4;
      cue.hidden = !scrollable;
      gallery.classList.toggle('has-scroll-cue', scrollable && gallery.scrollLeft < 6);
    };
    var dismissCue = function () {
      if (gallery.scrollLeft < 6) return;
      cue.classList.add('is-dismissed');
      gallery.classList.remove('has-scroll-cue');
    };

    gallery.addEventListener('scroll', dismissCue, { passive: true });
    window.addEventListener('resize', refreshCue);
    requestAnimationFrame(refreshCue);
  });

  overlay.querySelector('.lightbox__close').addEventListener('click', close);
  overlay.querySelector('.lightbox__previous').addEventListener('click', function () { show(current - 1); });
  overlay.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  overlay.addEventListener('click', function (event) { if (event.target === overlay) close(); });
  document.addEventListener('keydown', function (event) {
    if (!overlay.classList.contains('is-visible')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
    if (event.key === 'Tab') {
      var focusable = overlay.querySelectorAll('button, video');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (!overlay.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}());
