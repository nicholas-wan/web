/* Inlined immediately after the inert seeds to avoid a late postcard layout shift. */
(function () {
  'use strict';
  var old = [], key = 'photo-search-explore';
  var seeds = Array.from(document.getElementById('photo-explore-seeds').content.children);
  try { old = JSON.parse(sessionStorage.getItem(key)) || []; } catch (e) {}
  if (!Array.isArray(old)) old = [];
  var pool = seeds.filter(function (a) { return old.indexOf(a.dataset.tag) < 0; });
  if (pool.length < 4) pool = seeds.slice();
  var cards = [];
  while (pool.length && cards.length < 4) cards.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].cloneNode(true));
  document.querySelectorAll('[data-explore-action], .photo-explore__hint').forEach(function (b) { b.hidden = false; });
  var cardGrid = document.querySelector('.photo-explore__cards');
  // Phones cap the slot at 160px, like journal tiles, so DPR-3 screens take the 480w file, not 800w.
  // On phones the slot is that cap (travel-discovery.js refines it once laid out), so skip the read: mid-parse it forced a layout (Oct 2026).
  var phone = matchMedia('(max-width: 736px)').matches;
  var slot = phone ? 160 : parseFloat(getComputedStyle(cardGrid).gridTemplateColumns) - 2;
  cards.forEach(function (a) { var img = a.querySelector('img'); img.sizes = Math.max(1, slot) + 'px'; img.loading = 'lazy'; });
  cardGrid.replaceChildren.apply(cardGrid, cards);
  // The postcards sit below the journals since 21 Nov 2026, so they stay lazy on every screen.
  try { sessionStorage.setItem(key, JSON.stringify(cards.map(function (a) { return a.dataset.tag; }))); } catch (e) {}
}());
