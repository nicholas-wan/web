const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'dist/assets/data/photo-index.json'), 'utf8'));
const reviews = JSON.parse(fs.readFileSync(path.join(root, 'journals/explore-covers.json'), 'utf8'));

function setup(saved = {}) {
  const node = () => ({ value: '', hidden: false, innerHTML: '', textContent: '', dataset: {},
    addEventListener() {}, querySelector() { return node(); }, querySelectorAll() { return []; },
    classList: { toggle() {} }, focus() {}, removeAttribute() {}, firstChild: { textContent: '' } });
  const form = node(), input = form.q = node(), results = node();
  results.parentNode = node();
  const nodes = { 'photo-search': form, 'photo-results': results, 'photo-search-status': node(),
    'photo-explore': node(), 'photo-explore-seeds': { content: node() } };
  const storage = { getItem: key => saved[key] || null, setItem: (key, value) => { saved[key] = value; } };
  const context = { document: { getElementById: id => nodes[id], querySelectorAll: () => [] },
    localStorage: storage, sessionStorage: storage, setTimeout: () => 1, clearTimeout() {},
    URLSearchParams, location: { search: '', pathname: '/travel', hash: '' }, history: { replaceState() {} } };
  let source = fs.readFileSync(path.join(root, 'assets/js/photo-search.js'), 'utf8');
  source = source.replace('\tvar initial =', '\tglobalThis.api = { prepare, search, tokens, highlight, completeTag, sampleExplore: exploreMore, exploreMore: () => saveExplore(exploreMore()), recent, run, tripLabel, getExplore: () => explore, getTags: () => tags }; return;\n\tvar initial =');
  vm.runInNewContext(source, context);
  context.api.prepare(structuredClone(index));
  return { ...context.api, input, status: nodes['photo-search-status'], saved };
}

test('exploration samples four populated facets with matching, distinct photos and fresh topics', () => {
  const api = setup();
  api.exploreMore();
  const first = api.getExplore().map(t => t.tag);
  assert.equal(new Set(first).size, 4);
  assert.equal(new Set(first.map(name => index.tags.find(t => t.tag === name).facet)).size, 4);
  assert.equal(new Set(api.getExplore().map(t => t.photo.id)).size, 4);
  assert.ok(api.getExplore().every(t => t.photo.tags.includes(t.tag)));
  api.exploreMore();
  assert.ok(api.getExplore().every(t => !first.includes(t.tag)));
  const reloaded = setup(api.saved);
  reloaded.exploreMore();
  assert.ok(reloaded.getExplore().every(t => !api.getExplore().some(p => p.tag === t.tag)));
});

test('sampling replacement topics does not commit a pending or failed batch', () => {
  const api = setup();
  api.exploreMore();
  const prior = api.getExplore(), storage = api.saved['photo-search-explore'];
  const next = api.sampleExplore();
  assert.equal(next.length, 4);
  assert.ok(next.every(item => !prior.some(old => old.tag === item.tag)));
  assert.equal(api.getExplore(), prior);
  assert.equal(api.saved['photo-search-explore'], storage);
});

test('every exploration candidate has at least one full-match photo', () => {
  const api = setup();
  for (const tag of api.getTags().filter(t => t.count)) {
    assert.ok(api.search(api.tokens(tag.tag))[0].length, tag.tag);
  }
});

test('discovery only uses visually reviewed topic/crop pairs, including after repeated shuffles', () => {
  const api = setup();
  const reviewed = new Map(reviews.map(c => [c.id, c]));
  for (let i = 0; i < 150; i++) {
    api.exploreMore();
    assert.equal(api.getExplore().length, 4);
    for (const { tag, photo } of api.getExplore()) {
      const cover = reviewed.get(photo.id);
      assert.ok(cover && cover.tags.includes(tag), `${tag}: ${photo.id}`);
      assert.equal(photo.fx, cover.fx);
      assert.equal(photo.fy, cover.fy);
    }
  }
  // The original has tea cups, but its search thumbnail crops them out.
  const ramen = index.photos.find(p => p.id === '2023_perth/day3/bariuma_ramen');
  assert.ok(ramen.tags.includes('tea'));
  assert.ok(!reviews.some(c => c.id === ramen.id && c.tags.includes('tea')));
  const tea = reviews.filter(c => c.tags.includes('tea'));
  assert.ok(tea.length > 0);
  assert.ok(tea.every(c => c.id !== ramen.id));
});

test('compact cover references round-trip every reviewed topic and focal point', () => {
  assert.equal(index.version, 2);
  const decoded = index.covers.map(([position, topics, fx = 50, fy = 50]) => {
    const photo = index.photos[position];
    assert.ok(photo && !photo.video);
    return { id: photo.id, tags: topics.map(i => photo.tags[i]), fx, fy };
  });
  assert.deepEqual(decoded, reviews.map(({ id, tags, fx, fy }) => ({ id, tags, fx, fy })));
  assert.equal(new Set(decoded.map(c => c.id)).size, decoded.length);
  // Matches verify.ps1: 480 -> 560 KB when every journal alt became a descriptive
  // sentence (Oct 2026); the index carries each alt because search ranks on it.
  assert.ok(fs.statSync(path.join(root, 'dist/assets/data/photo-index.json')).size <= 560 * 1024);
});

test('bubble tea is its own topic and misidentified animals are corrected', () => {
  const bubble = reviews.find(c => c.id === '2025_japan/day4_nara/osaka3');
  assert.ok(bubble.tags.includes('bubble tea'));
  assert.ok(!bubble.tags.includes('tea'));
  const api = setup();
  assert.ok(api.search(api.tokens('bubble tea'))[0].some(h => h.photo.id === bubble.id));
  assert.ok(api.search(api.tokens('boba'))[0].some(h => h.photo.id === bubble.id));
  assert.ok(api.search(api.tokens('bubble tea'))[0].every(h => h.photo.tags.includes('bubble tea')));
  for (const [id, correct, wrong] of [
    ['2023_perth/day5/lobster_shack_02', 'lobster', 'crab'],
    ['2025_japan/day13_tokyo/tokyo3', 'squid', 'fish'],
    ['2026_guangzhou/day3/toucan', 'toucan', 'parrot']
  ]) {
    const cover = reviews.find(c => c.id === id);
    assert.ok(cover.tags.includes(correct));
    assert.ok(!index.photos.find(p => p.id === id).tags.includes(wrong));
  }
  const model = reviews.find(c => c.id === '2026_chengdu_zhangjiajie/day3/brick-hotpot-diner');
  assert.ok(model && model.tags.includes('miniature'));
  assert.ok(!model.tags.includes('hotpot'));
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
  assert.equal(api.tripLabel('travel_2023_usacanada'), 'USA & Canada · 2023');
});

test('corrupt saved searches cannot stop initialization', () => {
  for (const value of ['{}', '42', '"panda"', 'null', '[null,2,"panda"]', '{']) {
    const api = setup({ 'photo-search-recent': value });
    assert.ok(api.recent().every(q => typeof q === 'string'));
    assert.doesNotThrow(() => api.run());
  }
});
