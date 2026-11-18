/* Route stop place card (18 Nov 2026, journal UX mockup 6), loaded by gallery.js on journals
   that opt in with data-route-photos: a bottom sheet on phones and a centred card on desktop with
   the stop's photos, price, hours and map links. gallery.js keeps the history entry and the
   lightbox; this file gets them through the hooks it passes in. */
window.travelPlaceCard = function (hooks) {
  var escapeText = function (text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  /* One or two photos fill the card's width, so they take the 800w file. */
  var largeOf = function (media) {
    var wide = /(\S+)\s+800w/.exec(media.getAttribute('srcset') || '');
    return wide ? wide[1] : hooks.stillOf(media);
  };
  /* "10 am" and "4:30 pm" never break across lines. */
  var factText = function (text) { return escapeText(text).replace(/(\d) ([ap]m)\b/g, '$1&nbsp;$2'); };
  var card = null;
  var cardPlace = null;
  var cardDown = null;
  var openedAt = 0;
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
    /* The stop, or a better target such as the folded route's "View all" button. */
    hooks.focusTarget(cardPlace).focus({ preventScroll: true });
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
      /* The second click of a double click or tap lands on the card just opened: ignore it. */
      if (event.detail && Date.now() - openedAt < 350) return;
      var action = event.target.closest('[data-card]');
      if ((action && action.getAttribute('data-card') === 'close') || (event.target === card && cardDown === card)) closeCard();
      else if (action) { var at = event.target.closest('[data-at]'); hideCard(); hooks.openPhotos(cardPlace, at ? +at.getAttribute('data-at') : 0); }
      cardDown = null;
    });
    /* The sheet drags down: past a fifth of its height or on a flick it closes, else (or on a
       cancelled touch) it springs back. */
    var dragY = null;
    var dragAt = 0;
    var dragBy = function (event) { return event.changedTouches[0].clientY - dragY; };
    var settle = function () { dragY = null; sheet.style.transition = ''; sheet.style.transform = ''; };
    sheet.addEventListener('touchstart', function (event) {
      dragY = event.touches.length === 1 && sheet.scrollTop <= 0 ? event.touches[0].clientY : null;
      dragAt = event.timeStamp;
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
      if (moved > Math.max(64, sheet.offsetHeight / 5) || (moved > 48 && moved / (event.timeStamp - dragAt) > 0.5)) closeCard();
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
    var map = function (url, query, label, extra) {
      return '<a class="place-card__map' + extra + '" href="' + url + encodeURIComponent(query) + '" target="_blank" rel="noopener">' + label + '</a>';
    };
    var sheet = card.firstChild;
    /* Layout after Google and Apple Maps' place sheets; the README's place-card bullet has the
       owner's decisions. Up to four thumbnails, "+N" on the last when there are more. */
    sheet.innerHTML = '<span class="place-card__handle" aria-hidden="true"></span>' +
      '<button class="place-card__close" type="button" data-card="close" aria-label="Close place card">&times;</button>' +
      '<p class="place-card__eyebrow">' + (place.day ? place.day + ' &middot; ' : '') + 'Stop ' + place.at + '</p>' +
      '<p class="place-card__title" id="place-card-title">' + escapeText(place.name) + '</p>' +
      /* The price ends the Chinese name's line at the right, as the route list writes it. Only a
         Chinese subtitle is marked zh-Hans. */
      (place.sub || place.price ? '<p class="place-card__meta"><span' + (place.zh ? ' lang="zh-Hans">' : '>') + escapeText(place.sub || '') + '</span>' +
        (place.price ? '<span class="place-card__price">' + factText(place.price) + '</span>' : '') + '</p>' : '') +
      (own.length ? '<button class="place-card__photos' + (shown.length === 1 ? ' is-single' : shown.length === 2 ? ' is-pair' : '') +
        '" type="button" data-card="view" aria-label="View ' + photos + '" style="--cells: ' + shown.length + '">' + shown.map(function (media, i) {
          return '<img alt="" decoding="async" data-at="' + i + '" src="' + escapeText(shown.length > 2 ? hooks.stillOf(media) : largeOf(media)) + '">';
        }).join('') + (own.length > shown.length ? '<span class="place-card__more" data-at="' + (shown.length - 1) + '">+' + (own.length - shown.length) + '</span>' : '') + '</button>' : '') +
      /* Hours may list sessions split by "|", one a line. */
      (place.hours ? '<dl class="place-card__facts"><dt>Hours</dt><dd>' + place.hours.split('|').map(factText).join('<br>') + '</dd></dl>' : '') +
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
    openedAt = Date.now();
    sheet.querySelector('.place-card__close').focus({ preventScroll: true });
  };
  return { open: openCard, closeFromHistory: function () { closeCard(true); } };
};
