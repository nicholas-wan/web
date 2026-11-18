/* Route stop place card (18 Nov 2026, journal UX mockup 6), loaded by gallery.js on journals
   that opt in with data-route-photos: a bottom sheet on phones and a centred card on desktop with
   the stop's photos, price, hours and map links. gallery.js keeps the history entry and the
   lightbox; this file gets them through the hooks it passes in. */
window.travelPlaceCard = function (hooks) {
  var escapeText = function (text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var card = null;
  var cardPlace = null;
  var cardDown = null;
  var cardOpen = function () { return card && card.classList.contains('is-visible'); };
  var hideCard = function () {
    card.classList.remove('is-visible');
    card.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('place-card-open');
  };
  var closeCard = function (fromHistory) {
    if (!cardOpen()) return;
    hideCard();
    if (!fromHistory) hooks.releaseEntry();
    cardPlace.stop.focus({ preventScroll: true });
  };
  var buildCard = function () {
    card = document.createElement('div');
    card.className = 'place-card';
    card.innerHTML = '<div class="place-card__sheet" role="dialog" aria-modal="true" aria-labelledby="place-card-title"></div>';
    document.body.appendChild(card);
    var sheet = card.firstChild;
    /* The dimmed page closes it when the press both began and ended there. View photos keeps
       the entry: the lightbox finds it and pushes none of its own. */
    card.addEventListener('pointerdown', function (event) { cardDown = event.target; });
    card.addEventListener('click', function (event) {
      var action = event.target.closest('[data-card]');
      if ((action && action.getAttribute('data-card') === 'close') || (event.target === card && cardDown === card)) closeCard();
      else if (action) { hideCard(); hooks.openPhotos(cardPlace); }
      cardDown = null;
    });
    /* The sheet drags down: past a fifth of its height it closes, less springs back. */
    var dragY = null;
    var dragBy = function (event) { return event.changedTouches[0].clientY - dragY; };
    sheet.addEventListener('touchstart', function (event) {
      dragY = event.touches.length === 1 && sheet.scrollTop <= 0 ? event.touches[0].clientY : null;
    }, { passive: true });
    sheet.addEventListener('touchmove', function (event) {
      if (dragY === null) return;
      sheet.style.transition = 'none';
      sheet.style.transform = 'translateY(' + Math.max(0, dragBy(event)) + 'px)';
    }, { passive: true });
    sheet.addEventListener('touchend', function (event) {
      if (dragY === null) return;
      var moved = dragBy(event);
      dragY = null;
      sheet.style.transition = '';
      if (moved > Math.max(64, sheet.offsetHeight / 5)) closeCard();
      else sheet.style.transform = '';
    }, { passive: true });
    document.addEventListener('keydown', function (event) {
      if (!cardOpen()) return;
      if (event.key === 'Escape') closeCard();
      var items = sheet.querySelectorAll('button, a');
      var edge = items[event.shiftKey ? 0 : items.length - 1];
      if (event.key === 'Tab' && (document.activeElement === edge || !sheet.contains(document.activeElement))) {
        event.preventDefault();
        items[event.shiftKey ? items.length - 1 : 0].focus();
      }
    });
  };
  var openCard = function (place) {
    if (!card) buildCard();
    cardPlace = place;
    var own = place.own;
    var photos = hooks.photoCount(own.length);
    var facts = [['Price', place.price], ['Hours', place.hours]].filter(function (fact) { return fact[1]; }).map(function (fact) {
      return '<dt>' + fact[0] + '</dt><dd>' + escapeText(fact[1]) + '</dd>';
    }).join('');
    var map = function (url, query, label) {
      return '<a class="place-card__map" href="' + url + encodeURIComponent(query) + '" target="_blank" rel="noopener">' + label + '</a>';
    };
    var sheet = card.firstChild;
    sheet.innerHTML = '<span class="place-card__handle" aria-hidden="true"></span>' +
      '<button class="place-card__close" type="button" data-card="close" aria-label="Close place card">&times;</button>' +
      '<p class="place-card__title" id="place-card-title">' + escapeText(place.name) + '</p>' +
      '<p class="place-card__meta">' + (place.zh ? '<span lang="zh-Hans">' + escapeText(place.zh) + '</span> · ' : '') + place.day + ' · stop ' + place.at + '</p>' +
      (own.length ? '<button class="place-card__photos' + (own.length > 3 ? ' is-mosaic' : '') + '" type="button" data-card="view" aria-label="View ' + photos +
        '" style="--cells: ' + (Math.min(own.length, 4) + 1) + '">' + own.slice(0, 4).map(function (media) {
          return '<img alt="" decoding="async" src="' + escapeText(hooks.stillOf(media)) + '">';
        }).join('') + '<span class="place-card__more">' + photos + '</span></button>' : '') +
      (facts ? '<dl class="place-card__facts">' + facts + '</dl>' : '') +
      '<div class="place-card__actions">' + (own.length ? '<button class="place-card__view" type="button" data-card="view">View ' + photos + '</button>' : '') +
      map('https://uri.amap.com/search?keyword=', place.zh || place.name, 'Amap') +
      map('https://www.google.com/maps/search/?api=1&query=', place.zh ? place.name + ', ' + place.zh : place.name, 'Google Maps') + '</div>';
    /* A sheet dragged shut faded from where it was let go; it opens from the bottom again. */
    sheet.style.transform = '';
    sheet.scrollTop = 0;
    card.setAttribute('aria-hidden', 'false');
    card.classList.add('is-visible');
    document.documentElement.classList.add('place-card-open');
    /* As the lightbox does: one same-URL entry, only for an open the reader made. */
    hooks.claimEntry();
    sheet.querySelector('.place-card__close').focus({ preventScroll: true });
  };
  return { open: openCard, closeFromHistory: function () { closeCard(true); } };
};
