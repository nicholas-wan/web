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
    '<div class="lightbox__tools" role="group" aria-label="Image controls">' +
      '<button class="lightbox__rotate" type="button" aria-label="Use landscape view" aria-pressed="false" hidden>&#8635;</button>' +
      '<button class="lightbox__info" type="button" aria-label="Show caption" aria-expanded="false" aria-controls="lightbox-caption" hidden>i</button>' +
      '<button class="lightbox__zoom-out" type="button" aria-label="Zoom out" disabled>&minus;</button>' +
      '<button class="lightbox__zoom-in" type="button" aria-label="Zoom in">&plus;</button>' +
    '</div>' +
    '<button class="lightbox__previous" type="button" aria-label="Previous media">&#8592;</button>' +
    '<figure class="lightbox__figure"><div class="lightbox__viewport"><img class="lightbox__image" alt="" draggable="false"><video class="lightbox__image lightbox__video" role="button" tabindex="0" aria-label="Pause animation" loop muted playsinline hidden></video></div><figcaption id="lightbox-caption" class="lightbox__caption"></figcaption></figure>' +
    '<button class="lightbox__next" type="button" aria-label="Next media">&#8594;</button>';
  document.body.appendChild(overlay);

  var current = 0;
  var viewport = overlay.querySelector('.lightbox__viewport');
  var viewerImage = overlay.querySelector('img.lightbox__image');
  var viewerVideo = overlay.querySelector('.lightbox__video');
  var caption = overlay.querySelector('.lightbox__caption');
  var tools = overlay.querySelector('.lightbox__tools');
  var rotateButton = overlay.querySelector('.lightbox__rotate');
  var infoButton = overlay.querySelector('.lightbox__info');
  var zoomOutButton = overlay.querySelector('.lightbox__zoom-out');
  var zoomInButton = overlay.querySelector('.lightbox__zoom-in');
  var phonePortrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)');
  var currentSource = null;
  var currentIsVideo = false;
  var rotation = 0;
  var fitScale = 1;
  var zoomLevel = 1;
  var panX = 0;
  var panY = 0;
  var captionOpen = false;
  var lastImageTap = 0;
  var clamp = function (value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  };
  var sourceDimensions = function () {
    if (!currentSource) return { width: 0, height: 0 };
    return {
      width: currentSource.naturalWidth || Number(currentSource.getAttribute('width')) || viewerImage.naturalWidth || 0,
      height: currentSource.naturalHeight || Number(currentSource.getAttribute('height')) || viewerImage.naturalHeight || 0
    };
  };
  var canUseLandscapeView = function () {
    var dimensions = sourceDimensions();
    return !currentIsVideo && phonePortrait.matches && dimensions.width > dimensions.height * 1.12;
  };
  var transformedBounds = function () {
    var quarterTurn = Math.abs(rotation) % 180 === 90;
    var scale = fitScale * zoomLevel;
    return {
      width: (quarterTurn ? viewerImage.clientHeight : viewerImage.clientWidth) * scale,
      height: (quarterTurn ? viewerImage.clientWidth : viewerImage.clientHeight) * scale
    };
  };
  var clampPan = function () {
    var bounds = transformedBounds();
    var maxX = Math.max(0, (bounds.width - viewport.clientWidth) / 2);
    var maxY = Math.max(0, (bounds.height - viewport.clientHeight) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  };
  var renderMediaTransform = function () {
    clampPan();
    viewerImage.style.setProperty('--lightbox-pan-x', panX + 'px');
    viewerImage.style.setProperty('--lightbox-pan-y', panY + 'px');
    viewerImage.style.setProperty('--lightbox-rotation', rotation + 'deg');
    viewerImage.style.setProperty('--lightbox-scale', fitScale * zoomLevel);
    rotateButton.setAttribute('aria-pressed', rotation ? 'true' : 'false');
    rotateButton.setAttribute('aria-label', rotation ? 'Return to normal view' : 'Use landscape view');
    zoomOutButton.disabled = zoomLevel <= 1;
    zoomInButton.disabled = zoomLevel >= 3;
    viewport.classList.toggle('is-zoomed', zoomLevel > 1);
  };
  var calculateFitScale = function () {
    fitScale = 1;
    if (!rotation || !viewerImage.clientWidth || !viewerImage.clientHeight) return;
    var rotatedWidth = viewerImage.clientHeight;
    var rotatedHeight = viewerImage.clientWidth;
    fitScale = Math.min(viewport.clientWidth / rotatedWidth, viewport.clientHeight / rotatedHeight);
  };
  var renderCaptionState = function () {
    var collapsed = Boolean(rotation);
    var revealed = collapsed && captionOpen;
    overlay.classList.toggle('is-caption-collapsed', collapsed);
    caption.classList.toggle('is-revealed', revealed);
    infoButton.hidden = !collapsed || !caption.textContent.trim();
    infoButton.setAttribute('aria-expanded', revealed ? 'true' : 'false');
    infoButton.setAttribute('aria-label', revealed ? 'Hide caption' : 'Show caption');
  };
  var resetMediaTransform = function () {
    rotation = 0;
    fitScale = 1;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    captionOpen = false;
    lastImageTap = 0;
    renderCaptionState();
    renderMediaTransform();
  };
  var syncMediaTools = function () {
    var canRotate = canUseLandscapeView();
    if (rotation && !canRotate) resetMediaTransform();
    tools.hidden = currentIsVideo;
    rotateButton.hidden = !canRotate;
    renderCaptionState();
    renderMediaTransform();
  };
  var setZoom = function (nextZoom) {
    zoomLevel = clamp(nextZoom, 1, 3);
    if (zoomLevel > 1 && currentSource && currentSource.src && viewerImage.src !== currentSource.src) {
      viewerImage.src = currentSource.src;
    }
    if (zoomLevel === 1) {
      panX = 0;
      panY = 0;
    }
    renderMediaTransform();
  };
  var toggleLandscapeView = function () {
    rotation = rotation ? 0 : 90;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    captionOpen = false;
    renderCaptionState();
    calculateFitScale();
    renderMediaTransform();
  };
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
    resetMediaTransform();
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
    currentSource = source;
    currentIsVideo = isVideo;
    resetMediaTransform();
    if (isVideo) {
      viewerImage.onload = null;
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
      viewerImage.onload = function () {
        syncMediaTools();
        calculateFitScale();
        renderMediaTransform();
      };
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
    syncMediaTools();
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    if (opening) {
      lockBackgroundScroll();
      closeButton.focus();
    }
  };

  /* At the fitted scale, one-finger horizontal gestures keep circular
     previous/next navigation. Once an image is zoomed, that same gesture pans
     instead. Two fingers always zoom. Native touch events remain the iPhone
     path; Pointer Events add pen and mouse panning without double-firing touch. */
  var SWIPE_THRESHOLD = 48;
  var SWIPE_AXIS_RATIO = 1.25;
  var SWIPE_CLICK_SLOP = 10;
  var swipePointerId = null;
  var swipeTouchId = null;
  var swipeStartX = 0;
  var swipeStartY = 0;
  var gestureMode = null;
  var pointerMode = null;
  var startPanX = 0;
  var startPanY = 0;
  var pinchStartDistance = 0;
  var pinchStartZoom = 1;
  var ignoreClickUntil = 0;
  var touchDistance = function (first, second) {
    var deltaX = second.clientX - first.clientX;
    var deltaY = second.clientY - first.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };
  var touchById = function (touches, identifier) {
    for (var index = 0; index < touches.length; index += 1) {
      if (touches[index].identifier === identifier) return touches[index];
    }
    return null;
  };
  var cancelGesture = function () {
    swipePointerId = null;
    swipeTouchId = null;
    gestureMode = null;
    pointerMode = null;
    viewport.classList.remove('is-interacting');
  };
  var startsOnControl = function (target) {
    return target.closest && target.closest('button');
  };
  var completeSwipe = function (endX, endY, event) {
    var deltaX = endX - swipeStartX;
    var deltaY = endY - swipeStartY;
    var horizontalDistance = Math.abs(deltaX);
    var verticalDistance = Math.abs(deltaY);
    cancelGesture();
    if (Math.max(horizontalDistance, verticalDistance) >= SWIPE_CLICK_SLOP) {
      ignoreClickUntil = Date.now() + 500;
    }
    if (horizontalDistance < SWIPE_THRESHOLD || horizontalDistance <= verticalDistance * SWIPE_AXIS_RATIO) return;
    if (event.cancelable) event.preventDefault();
    show(current + (deltaX < 0 ? 1 : -1));
  };

  overlay.addEventListener('touchstart', function (event) {
    if (!overlay.classList.contains('is-visible') || startsOnControl(event.target)) {
      cancelGesture();
      return;
    }
    if (!currentIsVideo && event.touches.length === 2 && viewport.contains(event.target)) {
      gestureMode = 'pinch';
      pinchStartDistance = touchDistance(event.touches[0], event.touches[1]) || 1;
      pinchStartZoom = zoomLevel;
      viewport.classList.add('is-interacting');
      ignoreClickUntil = Date.now() + 500;
      if (event.cancelable) event.preventDefault();
      return;
    }
    if (event.touches.length !== 1) {
      cancelGesture();
      return;
    }
    var touch = event.touches[0];
    swipeTouchId = touch.identifier;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
    if (!currentIsVideo && zoomLevel > 1 && viewport.contains(event.target)) {
      gestureMode = 'pan';
      startPanX = panX;
      startPanY = panY;
      viewport.classList.add('is-interacting');
    } else {
      gestureMode = 'swipe';
    }
  }, { passive: false });
  overlay.addEventListener('touchmove', function (event) {
    if (gestureMode === 'pinch' && event.touches.length >= 2) {
      if (event.cancelable) event.preventDefault();
      setZoom(pinchStartZoom * touchDistance(event.touches[0], event.touches[1]) / pinchStartDistance);
      return;
    }
    if (gestureMode !== 'pan') return;
    var touch = touchById(event.touches, swipeTouchId);
    if (!touch) return;
    if (event.cancelable) event.preventDefault();
    panX = startPanX + touch.clientX - swipeStartX;
    panY = startPanY + touch.clientY - swipeStartY;
    renderMediaTransform();
    ignoreClickUntil = Date.now() + 500;
  }, { passive: false });
  overlay.addEventListener('touchend', function (event) {
    if (gestureMode === 'pinch') {
      if (event.touches.length < 2) {
        cancelGesture();
        renderMediaTransform();
      }
      return;
    }
    if (gestureMode === 'pan') {
      if (!touchById(event.touches, swipeTouchId)) {
        cancelGesture();
        renderMediaTransform();
      }
      return;
    }
    if (gestureMode !== 'swipe' || swipeTouchId === null) return;
    for (var index = 0; index < event.changedTouches.length; index += 1) {
      var touch = event.changedTouches[index];
      if (touch.identifier === swipeTouchId) {
        completeSwipe(touch.clientX, touch.clientY, event);
        return;
      }
    }
    cancelGesture();
  }, { passive: false });
  overlay.addEventListener('touchcancel', cancelGesture, { passive: true });

  overlay.addEventListener('pointerdown', function (event) {
    if (!overlay.classList.contains('is-visible') || startsOnControl(event.target)) return;
    if (event.pointerType === 'touch') return;
    var canPan = !currentIsVideo && zoomLevel > 1 && viewport.contains(event.target);
    if (!canPan && event.pointerType !== 'pen') return;
    if (!event.isPrimary) {
      cancelGesture();
      return;
    }
    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    pointerMode = canPan ? 'pan' : 'swipe';
    startPanX = panX;
    startPanY = panY;
    if (canPan) viewport.classList.add('is-interacting');
    if (overlay.setPointerCapture) overlay.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener('pointermove', function (event) {
    if (event.pointerId !== swipePointerId || pointerMode !== 'pan') return;
    event.preventDefault();
    panX = startPanX + event.clientX - swipeStartX;
    panY = startPanY + event.clientY - swipeStartY;
    renderMediaTransform();
    ignoreClickUntil = Date.now() + 500;
  });
  overlay.addEventListener('pointerup', function (event) {
    if (event.pointerId !== swipePointerId) return;
    if (pointerMode === 'pan') {
      cancelGesture();
      renderMediaTransform();
    } else {
      completeSwipe(event.clientX, event.clientY, event);
    }
  });
  overlay.addEventListener('pointercancel', cancelGesture);
  overlay.addEventListener('click', function (event) {
    if (Date.now() >= ignoreClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  rotateButton.addEventListener('click', toggleLandscapeView);
  infoButton.addEventListener('click', function () {
    captionOpen = !captionOpen;
    renderCaptionState();
  });
  zoomOutButton.addEventListener('click', function () { setZoom(zoomLevel - 0.5); });
  zoomInButton.addEventListener('click', function () { setZoom(zoomLevel + 0.5); });
  viewerImage.addEventListener('click', function () {
    var now = Date.now();
    if (now - lastImageTap < 320) setZoom(zoomLevel > 1 ? 1 : 2);
    lastImageTap = now;
  });
  window.addEventListener('resize', function () {
    if (!overlay.classList.contains('is-visible')) return;
    syncMediaTools();
    calculateFitScale();
    renderMediaTransform();
  });

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
