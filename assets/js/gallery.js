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
    '<figure class="lightbox__figure"><img class="lightbox__image" alt=""><video class="lightbox__image lightbox__video" controls loop muted playsinline hidden></video><figcaption class="lightbox__caption"></figcaption></figure>' +
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
  var close = function () {
    viewerVideo.pause();
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
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
    document.body.classList.add('lightbox-open');
    if (opening) closeButton.focus();
  };
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
      var focusable = overlay.querySelectorAll('button, video[controls]');
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
