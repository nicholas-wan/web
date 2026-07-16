(function () {
  var images = Array.prototype.slice.call(document.querySelectorAll('#main img')).filter(function (image, index, candidates) {
    return !image.classList.contains('countrylogo') &&
      !image.hasAttribute('data-lightbox-ignore') &&
      !image.closest('.travel-section-nav, .travel-pagination, .site-pager') &&
      candidates.indexOf(image) === index;
  });
  if (!images.length) return;

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
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close image viewer">&times;</button>' +
    '<button class="lightbox__previous" type="button" aria-label="Previous image">&#8592;</button>' +
    '<figure class="lightbox__figure"><img class="lightbox__image" alt=""><figcaption class="lightbox__caption"></figcaption></figure>' +
    '<button class="lightbox__next" type="button" aria-label="Next image">&#8594;</button>';
  document.body.appendChild(overlay);

  var current = 0;
  var viewerImage = overlay.querySelector('.lightbox__image');
  var caption = overlay.querySelector('.lightbox__caption');
  var close = function () { overlay.classList.remove('is-visible'); document.body.classList.remove('lightbox-open'); };
  var show = function (index) {
    current = (index + images.length) % images.length;
    var source = images[current];
    viewerImage.src = source.currentSrc || source.src;
    viewerImage.alt = source.alt || 'Gallery image';
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
    if (!parts.length && source.alt) parts.push(source.alt);
    caption.textContent = parts.join(' · ');
    overlay.classList.add('is-visible');
    document.body.classList.add('lightbox-open');
  };
  images.forEach(function (image, index) {
    var trigger = image.closest('.content') || image;
    image.classList.add('journal-lightbox-trigger');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', 'Open image: ' + (image.alt || ('journal photo ' + (index + 1))));
    trigger.addEventListener('click', function (event) { event.preventDefault(); show(index); });
    trigger.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(index); } });
  });

  /* Compact mobile journals are horizontal. A fading edge plus one short cue
     makes that interaction discoverable, then gets out of the way after the
     visitor actually scrolls each gallery. */
  Array.prototype.forEach.call(document.querySelectorAll('.travel-gallery--compact, .guangzhou-day--compact .masonry'), function (gallery) {
    var cue = document.createElement('div');
    cue.className = 'journal-scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<span>Swipe to browse</span><i aria-hidden="true">&#8596;</i>';
    gallery.parentNode.insertBefore(cue, gallery);

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
  });
}());
