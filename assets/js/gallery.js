(function () {
  var images = Array.prototype.slice.call(document.querySelectorAll('#main img')).filter(function (image, index, candidates) {
    return !image.classList.contains('countrylogo') &&
      !image.hasAttribute('data-lightbox-ignore') &&
      !image.closest('.travel-section-nav, .travel-pagination, .site-pager') &&
      candidates.indexOf(image) === index;
  });
  if (!images.length) return;

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
    var title = source.closest('.content')?.querySelector('.content-title, .gallery-caption') || source.closest('figure')?.querySelector('figcaption');
    caption.textContent = title ? title.textContent.trim() : (source.alt || '');
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
