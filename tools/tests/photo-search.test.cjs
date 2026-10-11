const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'dist/assets/data/photo-index.json'), 'utf8'));

function setup(saved = {}) {
  const node = () => ({ value: '', hidden: false, innerHTML: '', textContent: '', dataset: {},
    addEventListener() {}, querySelector() { return node(); }, querySelectorAll() { return []; },
    classList: { toggle() {} }, focus() {} });
  const form = node(), input = form.q = node(), results = node();
  results.parentNode = node();
  const nodes = { 'photo-search': form, 'photo-results': results, 'photo-search-status': node(),
    'photo-explore': node(), 'photo-moment': node(), 'photo-explore-seeds': { content: node() } };
  const storage = { getItem: key => saved[key] || null, setItem: (key, value) => { saved[key] = value; } };
  const context = { document: { getElementById: id => nodes[id], querySelectorAll: () => [] },
    localStorage: storage, sessionStorage: storage, setTimeout: () => 1, clearTimeout() {},
    URLSearchParams, location: { search: '', pathname: '/travel', hash: '' }, history: { replaceState() {} } };
  let source = fs.readFileSync(path.join(root, 'assets/js/photo-search.js'), 'utf8');
  source = source.replace('\tvar initial =', '\tglobalThis.api = { prepare, search, tokens, highlight, completeTag, exploreMore, pickMoment, recent, run, tripLabel, getExplore: () => explore, getTags: () => tags }; return;\n\tvar initial =');
  vm.runInNewContext(source, context);
  context.api.prepare(structuredClone(index));
  return { ...context.api, input, status: nodes['photo-search-status'], saved };
}

test('exploration samples six populated facets with matching, distinct photos and fresh topics', () => {
  const api = setup();
  api.exploreMore();
  const first = api.getExplore().map(t => t.tag);
  assert.equal(new Set(first).size, 6);
  assert.equal(new Set(first.map(name => index.tags.find(t => t.tag === name).facet)).size, 6);
  assert.equal(new Set(api.getExplore().map(t => t.photo.id)).size, 6);
  assert.ok(api.getExplore().every(t => t.photo.tags.includes(t.tag)));
  api.exploreMore();
  assert.ok(api.getExplore().every(t => !first.includes(t.tag)));
  const reloaded = setup(api.saved);
  reloaded.exploreMore();
  assert.ok(reloaded.getExplore().every(t => !api.getExplore().some(p => p.tag === t.tag)));
});

test('Surprise me visits every photo before repeating, varies trips and survives reload', () => {
  const api = setup(), seen = new Set();
  let last;
  for (let i = 0; i < index.photos.length; i++) {
    const photo = api.pickMoment();
    assert.ok(!seen.has(photo.id));
    const remainingTrips = new Set(index.photos.filter(p => !seen.has(p.id)).map(p => p.trip));
    if (last && remainingTrips.size > 1) assert.notEqual(photo.trip, last.trip);
    seen.add(photo.id); last = photo;
  }
  assert.equal(seen.size, index.photos.length);
  const next = api.pickMoment();
  assert.notEqual(next.trip, last.trip);
  const reloaded = setup(api.saved);
  assert.notEqual(reloaded.pickMoment().id, next.id);
});

test('every exploration candidate has at least one full-match photo', () => {
  const api = setup();
  for (const tag of api.getTags().filter(t => t.count)) {
    assert.ok(api.search(api.tokens(tag.tag))[0].length, tag.tag);
  }
});

test('phrase completion preserves earlier context and does not repeat words', () => {
  const api = setup(), fuji = api.getTags().find(t => t.tag === 'mount fuji');
  assert.equal(api.completeTag('mount f', fuji).value, 'mount fuji');
  assert.equal(api.completeTag('japan mount f', fuji).value, 'japan mount fuji');
  assert.equal(api.completeTag('japan fuji', fuji).value, 'japan mount fuji');
  assert.equal(api.completeTag('penguin', fuji), null);
});

test('matching and highlighting share the same fuzzy fallback policy', () => {
  const api = setup();
  api.search(['beach']);
  assert.equal(api.highlight('A bench near the beach', ['beach']), 'A bench near the <mark>beach</mark>');
  const typo = api.search(['pengiun']);
  assert.ok(typo[0].length);
  assert.equal(api.highlight('Penguin', ['pengiun']), '<mark>Penguin</mark>');
});

test('exact subject matches lead and journals remain contiguous within each tier', () => {
  const api = setup(), tiers = api.search(['red', 'panda']);
  assert.ok(tiers[0][0].photo.tags.includes('red panda'), JSON.stringify(tiers[0].slice(0, 3).map(h => ({place:h.photo.place, tags:h.photo.tags, score:h.score}))));
  for (const hits of tiers) {
    const closed = new Set();
    let previous;
    for (const hit of hits) {
      if (hit.photo.trip !== previous) {
        assert.ok(!closed.has(hit.photo.trip));
        if (previous) closed.add(previous);
        previous = hit.photo.trip;
      }
    }
  }
});

test('diacritics, CJK, photo links and numeric highlights retain their meaning', () => {
  const api = setup();
  assert.ok(api.search(api.tokens('düsseldorf'))[0].length);
  assert.ok(api.search(api.tokens('京都'))[0].length);
  assert.equal(api.highlight('A & B <3>', ['3']), 'A &#38; B &#60;<mark>3</mark>&#62;');
  assert.equal(api.tripLabel('travel_2023_usacanada'), 'USA & Canada · 23');
});

test('corrupt saved searches cannot stop initialization', () => {
  for (const value of ['{}', '42', '"panda"', 'null', '[null,2,"panda"]', '{']) {
    const api = setup({ 'photo-search-recent': value });
    assert.ok(api.recent().every(q => typeof q === 'string'));
    assert.doesNotThrow(() => api.run());
  }
});
