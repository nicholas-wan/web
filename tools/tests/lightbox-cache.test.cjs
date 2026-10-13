// Deterministic download/decode ordering checks for the production lightbox.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../assets/js/gallery.js'), 'utf8');
const code = source.slice(source.indexOf('  var responsiveCandidate ='), source.indexOf('  var lightboxSource =')) +
  source.slice(source.indexOf('  var fittedImages ='), source.indexOf('  var clamp ='));

function setup() {
  const requests = [];
  const timers = new Map();
  let timer = 0;
  class Image {
    set src(url) { this.url = url; requests.push(this); }
    get src() { return this.url; }
    removeAttribute() { this.cancelled = true; this.url = ''; }
    decode() { return new Promise((resolve, reject) => { this.decoded = resolve; this.decodeFailed = reject; }); }
  }
  const media = Array.from({ length: 8 }, (_, i) => ({ tagName: 'IMG', getAttribute: key => ({
    src: `${i}-1600.jpg`, srcset: `${i}-480.jpg 480w, ${i}-800.jpg 800w, ${i}-1600.jpg 1600w`, width: '1600', height: '1200'
  })[key] }));
  const state = vm.createContext({ Image, Promise, window: { devicePixelRatio: 2,
    setTimeout: fn => { timers.set(++timer, fn); return timer; }, clearTimeout: id => timers.delete(id)
  }, viewport: { clientWidth: 390, clientHeight: 650 }, galleryMedia: media, current: 1,
  currentSource: media[1], currentIsVideo: false, zoomLevel: 1, navigationDirection: 1,
  imageRequest: 0, upgradeTimer: undefined, overlay: { classList: { contains: () => true } }, viewerImage: { src: 'thumbnail' }
  });
  vm.runInContext(code, state);
  return { state, media, requests, timers, runTimers() {
    for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
  }, async finish(url, failure = false) {
    const image = requests.findLast(image => image.src === url);
    assert.ok(image, `Expected request for ${url}`);
    image.onload();
    assert.equal(state.findFitted(url).ready, false, 'download alone must not mark the image ready');
    if (failure) image.decodeFailed(new Error('decode failed'));
    else image.decoded();
    for (let i = 0; i < 5; i++) await Promise.resolve();
  } };
}

test('reuse requests, promote current-image priority, and cap retained images at five', async () => {
  const { state: s, media, requests } = setup();
  const entry = s.prepareFitted(media[0], 'low');
  assert.equal(s.prepareFitted(media[0], 'high'), entry);
  assert.equal(requests.length, 1);
  assert.equal(entry.image.fetchPriority, 'high');
  for (let i = 1; i < 8; i++) s.prepareFitted(media[i], 'low');
  assert.equal(s.fittedImages.length, 5);
  assert.equal(await entry.promise, null);
  assert.equal(requests[0].cancelled, true);
});

test('cold image starts immediately with its next neighbour, retaining the thumbnail until decoded', async () => {
  const t = setup(), s = t.state;
  s.fitUpgrade();
  assert.equal(t.timers.size, 0, 'a cold current image must not wait behind a timer');
  assert.deepEqual(t.requests.map(i => i.src), ['1-800.jpg', '2-800.jpg']);
  assert.equal(s.viewerImage.src, 'thumbnail');
  assert.equal(t.requests[0].fetchPriority, 'high');
  await t.finish('1-800.jpg');
  assert.equal(s.viewerImage.src, '1-800.jpg');
  assert.deepEqual(t.requests.map(i => i.src), ['1-800.jpg', '2-800.jpg', '3-800.jpg', '0-800.jpg']);
  assert.ok(t.requests.slice(1).every(i => i.fetchPriority === 'low'));
});

test('prepared photo bypasses the timer and follows reverse navigation', async () => {
  const t = setup(), s = t.state;
  s.prepareFitted(t.media[1], 'low');
  await t.finish('1-800.jpg');
  s.navigationDirection = -1;
  s.fitUpgrade();
  assert.equal(t.timers.size, 0);
  assert.equal(s.viewerImage.src, '1-800.jpg');
  assert.deepEqual(t.requests.map(i => i.src), ['1-800.jpg', '0-800.jpg', '7-800.jpg', '2-800.jpg']);
});

test('out-of-order loads cannot replace a newer photo or start stale prefetches', async () => {
  const t = setup(), s = t.state;
  s.fitUpgrade(); t.runTimers();
  s.current = 4; s.currentSource = t.media[4]; s.fitUpgrade(); t.runTimers();
  await t.finish('1-800.jpg');
  assert.equal(s.viewerImage.src, 'thumbnail');
  assert.equal(t.requests.length, 4, 'stale completion must not enqueue more neighbours');
  await t.finish('4-800.jpg');
  assert.equal(s.viewerImage.src, '4-800.jpg');
});

test('an in-flight neighbour becomes high priority without a second request or delay', async () => {
  const t = setup(), s = t.state;
  const pending = s.prepareFitted(t.media[1], 'low');
  s.fitUpgrade();
  assert.equal(t.timers.size, 0);
  assert.equal(t.requests.filter(i => i.src === '1-800.jpg').length, 1);
  assert.equal(pending.image.fetchPriority, 'high');
  assert.equal(s.viewerImage.src, 'thumbnail');
  await t.finish('1-800.jpg');
  assert.equal(s.viewerImage.src, '1-800.jpg');
});

test('zoom and close invalidate pending display upgrades', async () => {
  const t = setup(), s = t.state;
  s.fitUpgrade(); t.runTimers();
  s.zoomLevel = 2; s.imageRequest++; s.viewerImage.src = 'original';
  await t.finish('1-800.jpg');
  assert.equal(s.viewerImage.src, 'original');
  assert.equal(t.requests.length, 2);
  s.zoomLevel = 1; s.current = 2; s.currentSource = t.media[2];
  s.fitUpgrade(); t.runTimers();
  s.imageRequest++; s.clearFittedImages();
  await Promise.resolve();
  assert.equal(s.fittedImages.length, 0);
  assert.ok(t.requests.every(i => i.cancelled));
  assert.equal(s.viewerImage.src, 'original');
});

test('decode errors preserve the fallback and allow a later retry', async () => {
  const t = setup(), s = t.state;
  s.fitUpgrade(); t.runTimers();
  await t.finish('1-800.jpg', true);
  assert.equal(s.viewerImage.src, 'thumbnail');
  assert.equal(s.findFitted('1-800.jpg'), undefined);
  s.prepareFitted(t.media[1], 'high');
  assert.equal(t.requests.filter(i => i.src === '1-800.jpg').length, 1);
});

test('video neighbour prefetch never downloads video sources', () => {
  const t = setup(), s = t.state;
  t.media[2].tagName = 'VIDEO'; s.currentIsVideo = true;
  s.fitUpgrade(); t.runTimers();
  assert.deepEqual(t.requests.map(i => i.src), ['3-800.jpg', '0-800.jpg']);
});

test('a fast swipe can show the next decoded image before the old current image finishes', async () => {
  const t = setup(), s = t.state;
  s.fitUpgrade();
  await t.finish('2-800.jpg');
  assert.equal(s.viewerImage.src, 'thumbnail');
  s.current = 2; s.currentSource = t.media[2];
  s.fitUpgrade();
  assert.equal(s.viewerImage.src, '2-800.jpg');
  assert.equal(t.requests.filter(i => i.src === '2-800.jpg').length, 1);
  await t.finish('1-800.jpg');
  assert.equal(s.viewerImage.src, '2-800.jpg');
  assert.ok(s.fittedImages.length <= 5);
});
