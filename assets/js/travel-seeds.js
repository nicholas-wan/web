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
  var cardWidth = parseFloat(getComputedStyle(cardGrid).gridTemplateColumns) - 2;
  cards.forEach(function (a) { a.querySelector('img').sizes = Math.max(1, cardWidth) + 'px'; });
  cardGrid.replaceChildren.apply(cardGrid, cards);
  // Only attached, initially visible images are eager; template images stay inert.
  cards.forEach(function (a) {
    var img = a.querySelector('img'), box = img.getBoundingClientRect();
    if (box.top < innerHeight && box.bottom > 0) img.loading = 'eager';
  });
  try { sessionStorage.setItem(key, JSON.stringify(cards.map(function (a) { return a.dataset.tag; }))); } catch (e) {}
}());
