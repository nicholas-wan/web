/* Route stop place card (18 Nov 2026, journal UX mockup 6), loaded by gallery.js on journals
   that opt in with data-route-photos: a bottom sheet on phones and a centred card on desktop with
   the stop's photos, price, hours and map links. gallery.js keeps the history entry and the
   lightbox; this file gets them through the hooks it passes in. */
window.travelPlaceCard = function (hooks) {
  var escapeText = function (text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  /* "10 am" and "4:30 pm" never break across lines. */
  var factText = function (text) { return escapeText(text).replace(/(\d) ([ap]m)\b/g, '$1&nbsp;$2'); };
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
    /* gallery.js may name a better target, such as the folded route's "View all" button. */
    (hooks.focusTarget ? hooks.focusTarget(cardPlace) : cardPlace.stop).focus({ preventScroll: true });
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
    /* The sheet drags down: past a fifth of its height it closes, less (or a cancelled touch)
       springs back. */
    var dragY = null;
    var dragBy = function (event) { return event.changedTouches[0].clientY - dragY; };
    var settle = function () { dragY = null; sheet.style.transition = ''; sheet.style.transform = ''; };
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
    sheet.addEventListener('touchcancel', settle, { passive: true });
    /* Tab moves through the card's own controls and wraps, so it never leaves the dialog, and it
       reaches the map links in WebKit too, whose default Tab skips links. */
    document.addEventListener('keydown', function (event) {
      if (!cardOpen()) return;
      if (event.key === 'Escape') return closeCard();
      if (event.key !== 'Tab') return;
      var items = Array.prototype.slice.call(sheet.querySelectorAll('button, a[href]'));
      var at = items.indexOf(document.activeElement);
      event.preventDefault();
      items[at < 0 ? (event.shiftKey ? items.length - 1 : 0) : (at + (event.shiftKey ? items.length - 1 : 1)) % items.length].focus();
    });
  };
  var openCard = function (place) {
    if (!card) buildCard();
    cardPlace = place;
    var own = place.own;
    var photos = hooks.photoCount(own.length);
    var shown = own.slice(0, 4);
    var facts = [['Price', place.price], ['Hours', place.hours]].filter(function (fact) { return fact[1]; }).map(function (fact) {
      /* Hours may list sessions split by "|", one a line. */
      return '<dt>' + fact[0] + '</dt><dd>' + fact[1].split('|').map(factText).join('<br>') + '</dd>';
    }).join('');
    var map = function (url, query, label, extra) {
      return '<a class="place-card__map' + extra + '" href="' + url + encodeURIComponent(query) + '" target="_blank" rel="noopener">' + label + '</a>';
    };
    var sheet = card.firstChild;
    /* Layout after Google and Apple Maps' place sheets (owner, 18 Nov 2026: "make it look more
       professional"): a small teal eyebrow for where it sits in the trip, the name, its Chinese
       name on a quiet line of its own, the photos, ruled facts, one full-width primary action and
       the map apps as two soft buttons with a pin each. Amap is named 高德地图, as it is known
       in China (owner: "nobody knows what Amap means"). One row of up to four thumbnails; more photos
       than that put "+N" on the last one. */
    sheet.innerHTML = '<span class="place-card__handle" aria-hidden="true"></span>' +
      '<button class="place-card__close" type="button" data-card="close" aria-label="Close place card">&times;</button>' +
      '<p class="place-card__eyebrow">' + (place.day ? place.day + ' &middot; ' : '') + 'Stop ' + place.at + '</p>' +
      '<p class="place-card__title" id="place-card-title">' + escapeText(place.name) + '</p>' +
      (place.zh ? '<p class="place-card__meta" lang="zh-Hans">' + escapeText(place.zh) + '</p>' : '') +
      (own.length ? '<button class="place-card__photos" type="button" data-card="view" aria-label="View ' + photos +
        '" style="--cells: ' + shown.length + '">' + shown.map(function (media) {
          return '<img alt="" decoding="async" src="' + escapeText(hooks.stillOf(media)) + '">';
        }).join('') + (own.length > shown.length ? '<span class="place-card__more">+' + (own.length - shown.length) + '</span>' : '') + '</button>' : '') +
      (facts ? '<dl class="place-card__facts">' + facts + '</dl>' : '') +
      '<div class="place-card__actions">' + (own.length ? '<button class="place-card__view" type="button" data-card="view">View ' + photos + '</button>' : '') +
      '<div class="place-card__maps">' +
      map('https://www.google.com/maps/search/?api=1&query=', place.zh ? place.name + ', ' + place.zh : place.name, 'Google Maps', '') +
      map('https://uri.amap.com/search?keyword=', place.zh || place.name, '<span lang="zh-Hans">高德地图</span>', ' place-card__map--amap') + '</div></div>';
    /* A sheet dragged shut, or left mid-drag, opens from the bottom again. */
    sheet.style.transition = '';
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
