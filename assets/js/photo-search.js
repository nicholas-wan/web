/* Travel photo search, injected on demand by travel-discovery.js.
   Contracts: "Travel atlas contracts" in README.md. */
(function() {
	'use strict';

	var form = document.getElementById('photo-search');
	var input = form && form.q;
	if (!input) return;

	var PAGE = 48, DEBOUNCE = 120, STORE = 'photo-search-recent';
	var explore = [], fuzzyTerms = [], renderedQuery = '', composing = form.dataset.searchComposing === 'true';
	// Field weights: tags, visible copy, description, trip, fallback aliases.
	var EXACT = [3, 2, 1, 1, 3], PREFIX = [2, 2, 1, 1, 2];
	var CJK = '\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f';
	// One token per CJK character, otherwise letter/digit runs.
	var WORD = new RegExp('[' + CJK + ']|[a-z0-9\u00df-\u024f\uac00-\ud7af]+', 'g');
	var SEGMENT = new RegExp('[' + CJK + ']|[^\\s!-/:-@[-`{-~\u00b7\u2013\u2014' + CJK + ']+', 'g');

	var status = document.getElementById('photo-search-status');
	var clearButton = form.querySelector('.photo-search__clear');
	var collapsible = document.querySelectorAll('.travel-atlas__layout, .photo-explore__map-heading, #main > .travel-archive-heading, #main > .travel-grid');
	var discovery = document.getElementById('photo-explore'), moment = document.getElementById('photo-moment');
	var titles = {}, seenMoments = [], momentHistory = [], momentAt = -1;
	var previousMoment = moment.querySelector('[data-explore-action="previous"]');
	var retry = document.getElementById('photo-search-retry'), loading = false;
	document.getElementById('photo-explore-seeds').content.querySelectorAll('[data-tag]').forEach(function(a) {
		titles[a.dataset.tag] = a.dataset.title;
	});
	var trips = {}, tags = [], photos = null, coverTopics = {}, failed = false, tiers;
	var timer = 0, saveTimer = 0, limit = PAGE, collapsed = false, tripFilter = '';

	function fold(value) {
		return String(value).toLowerCase().normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '').replace(/['\u2019]/g, '');
	}

	function tokens(value) {
		return fold(value).match(WORD) || [];
	}

	function unique(list) {
		return list.filter(function(item, index) { return list.indexOf(item) === index; });
	}

	function escape(value) {
		return String(value).replace(/[&<>"]/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; });
	}

	function plural(count, one, many) {
		return count + ' ' + (count === 1 ? one : many);
	}

	// Damerau-Levenshtein distance 1 (a and b already differ).
	function near(a, b) {
		if (a.length < b.length) return near(b, a);
		var i = 0;
		while (i < b.length && a[i] === b[i]) i++;
		if (a.length > b.length) return a.length - b.length === 1 && a.slice(i + 1) === b.slice(i);
		return a.slice(i + 1) === b.slice(i + 1) ||
			(a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
	}

	// 3 exact, 2 prefix, 1 fuzzy (terms of 5+ letters); fuzzy scores as prefix - 0.5.
	function kind(word, term, fuzzy) {
		if (word === term) return 3;
		if (word.lastIndexOf(term, 0) === 0) return 2;
		return fuzzy && term.length > 4 && near(word, term) ? 1 : 0;
	}

	// [best score, its field]; hidden fields (alt + section, trip) count half,
	// so they never outrank a tag, place or caption hit for the same term.
	function termScore(photo, term, fuzzy, aliases) {
		var best = [0, 0];
		photo.f.forEach(function(words, field) {
			if ((field === 4) !== !!aliases) return;
			words.forEach(function(word) {
				var match = kind(word, term, fuzzy);
				var score = (match === 3 ? EXACT[field] : match && PREFIX[field] - (match === 1 ? 0.5 : 0)) / (field > 1 ? 2 : 1);
				if (score > best[0]) best = [score, field];
			});
		});
		return best;
	}

	function prepare(data) {
		var expanded = {};
		data.trips.forEach(function(trip) { trips[trip.slug] = trip; });
		tags = data.tags.sort(function(a, b) { return b.count - a.count; });
		tags.forEach(function(tag) {
			tag.keys = [fold(tag.tag)].concat((tag.synonyms || []).map(fold));
			expanded[tag.tag] = tag.keys.slice(1).join(' ');
		});
		photos = data.photos.map(function(photo, order) {
			photo.variants = +(data.variants || '').charAt(order);
			var trip = trips[photo.trip] || {};
			// Newest trip first, journal order within it (the archive is newest first).
		photo.order = order - trip.order * 1e4;
			photo.f = [
				(photo.tags || []).join(' '),
				photo.place + ' ' + photo.caption,
				photo.alt + ' ' + photo.sectionTitle,
				trip.label + ' ' + trip.year,
				(photo.tags || []).map(function(name) { return expanded[name] || ''; }).join(' ')
			].map(function(text) { return unique(tokens(text)); });
			return photo;
		});
		// Tuples reference this index's photos and their tags, avoiding repeated
		// paths/words. Omitted crop coordinates mean 50%, not the search crop.
		// Group once: shuffling must not rescan every photo for every topic.
		coverTopics = {};
		(data.covers || []).forEach(function(row) {
			var photo = photos[row[0]];
			var cover = Object.assign({}, photo, {
				tags: row[1].map(function(i) { return photo.tags[i]; }),
				fx: row.length > 2 ? row[2] : 50, fy: row.length > 2 ? row[3] : 50
			});
			cover.tags.forEach(function(tag) { (coverTopics[tag] || (coverTopics[tag] = [])).push(cover); });
		});
	}

	function rank(hits) {
		var best = {};
		hits.forEach(function(hit) { best[hit.photo.trip] = Math.max(best[hit.photo.trip] || 0, hit.score); });
		return hits.sort(function(a, b) {
			return best[b.photo.trip] - best[a.photo.trip] || trips[b.photo.trip].order - trips[a.photo.trip].order ||
				b.why.length - a.why.length || b.score - a.score || a.photo.order - b.photo.order;
		});
	}

	function tripLabel(slug) {
		return trips[slug].label + ' · ' + trips[slug].year;
	}

	function search(terms) {
		var tier = [[], []];
		fuzzyTerms = [];
		var rows = photos.map(function(photo) {
			return terms.map(function(term) { return termScore(photo, term); });
		});
		// Fuzzy matches only stand in for a term with no exact or prefix hit at all.
		terms.forEach(function(term, t) {
			if (!rows.some(function(row) { return row[t][0]; })) rows.forEach(function(row, i) { row[t] = termScore(photos[i], term, false, true); });
			if (!rows.some(function(row) { return row[t][0]; })) {
				fuzzyTerms.push(term);
				rows.forEach(function(row, i) { row[t] = termScore(photos[i], term, 1); });
			}
		});
		var weight = terms.map(function(term, t) {
			return Math.log(1 + photos.length / rows.filter(function(row) { return row[t][0]; }).length);
		});
		rows.forEach(function(row, i) {
			var score = 0, why = [];
			row.forEach(function(best, t) {
				if (!best[0]) return;
				score += best[0] * weight[t];
				why.push(terms[t] + (best[1] === 4 ? ' (related tag)' : best[1] > 1 ? ' (in description)' : ''));
			});
			if (why.length) tier[why.length === terms.length ? 0 : 1].push({ photo: photos[i], score: score, why: why });
		});
		return tier.map(rank);
	}

	// Marks go in before escaping, so an entity's digits are never a segment.
	function highlight(text, terms) {
		return escape(String(text).replace(SEGMENT, function(segment) {
			return tokens(segment).some(function(word) {
				return terms.some(function(term) { return kind(word, term, fuzzyTerms.indexOf(term) >= 0); });
			}) ? '\x01' + segment + '\x02' : segment;
		})).replace(/\x01/g, '<mark>').replace(/\x02/g, '</mark>');
	}

	// title adds a muted leading label and a --try/--recent modifier.
	function chipList(list, label, replaceAll, title, extra) {
		return '<ul class="photo-search__chips' + (title ? ' photo-search__chips--' + title.toLowerCase() : '') +
			'" aria-label="' + label + '">' + (title ? '<li class="photo-search__label" aria-hidden="true">' + title + '</li>' : '') +
			list.map(function(tag) {
				return '<li><button type="button" class="photo-search__chip" data-tag="' + escape(tag.tag) + '"' +
					(replaceAll ? ' data-replace' : '') + '>' + escape(tag.tag) + (tag.count ? ' <span>' + tag.count + '</span>' : '') + '</button></li>';
			}).join('') + (extra || '') + '</ul>';
	}

	// The last four searches, kept only in this browser; a blocked store reads empty.
	function recent(list) {
		try {
			if (list) localStorage.setItem(STORE, JSON.stringify(list));
			var saved = JSON.parse(localStorage.getItem(STORE));
			return Array.isArray(saved) ? saved.filter(function(q) { return typeof q === 'string' && q.trim(); }).slice(0, 4) : [];
		} catch (error) {
			return [];
		}
	}

	function remember(query) {
		recent([query].concat(recent().filter(function(past) { return past !== query; })).slice(0, 4));
	}

	function shuffle(list) {
		for (var i = list.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1)), item = list[i];
			list[i] = list[j]; list[j] = item;
		}
		return list;
	}

	// Sample facets equally so large place/subject vocabularies cannot dominate.
	function exploreMore() {
		var previous = explore.map(function(tag) { return tag.tag; }), groups = {};
		try { if (!previous.length) previous = JSON.parse(sessionStorage.getItem('photo-search-explore')) || []; } catch (e) {}
		if (!Array.isArray(previous)) previous = [];
		var reviewed = tags.filter(function(tag) { return coverTopics[tag.tag]; });
		var pool = reviewed.filter(function(tag) { return previous.indexOf(tag.tag) < 0; });
		if (pool.length < 6) pool = reviewed;
		shuffle(pool).forEach(function(tag) { (groups[tag.facet] || (groups[tag.facet] = [])).push(tag); });
		var facets = shuffle(Object.keys(groups));
		explore = [];
		while (facets.length && explore.length < 6) {
			var facet = facets.shift();
			var tag = groups[facet].pop().tag;
			var candidates = shuffle(coverTopics[tag].slice());
			var unused = candidates.filter(function(photo) { return !explore.some(function(item) { return item.photo.id === photo.id; }); });
			if (!unused.length) { if (groups[facet].length) facets.push(facet); continue; }
			var varied = unused.filter(function(photo) { return !explore.some(function(item) { return item.photo.trip === photo.trip; }); });
			explore.push({ tag: tag, photo: (varied.length ? varied : unused)[0] });
			if (groups[facet].length) facets.push(facet);
		}
		try { sessionStorage.setItem('photo-search-explore', JSON.stringify(explore.map(function(tag) { return tag.tag; }))); } catch (e) {}
	}

	function thumbnail(photo, large) {
		var grid = document.querySelector(large ? '.photo-moment__content' : '.photo-explore__cards');
		var width = parseFloat(getComputedStyle(grid).gridTemplateColumns) - (large ? 0 : 2);
		var sources = photo.variants ? photo.thumb + ' 480w, ' + photo.src + ' ' + photo.w + 'w' : '';
		if (photo.variants === 2) sources += ', ' + photo.thumb.replace('-480.', '-800.') + ' 800w';
		return '<img loading="' + (large ? 'eager' : 'lazy') + '" decoding="async"' +
			(sources ? ' srcset="' + escape(sources) + '" sizes="' + Math.max(1, width || 480) + 'px"' : '') +
			' src="' + escape(photo.thumb) + '" alt="' + escape(photo.alt) +
			'" width="' + photo.w + '" height="' + photo.h + '" style="object-position:' +
			(photo.fx == null ? 50 : photo.fx) + '% ' + (photo.fy == null ? 50 : photo.fy) + '%">';
	}

	function renderExplore() {
		discovery.querySelector('.photo-explore__cards').innerHTML = explore.map(function(item) {
			var title = titles[item.tag] || item.tag.replace(/(^|\s)\S/g, function(letter) { return letter.toUpperCase(); });
			var context = item.photo.place + ' · ' + trips[item.photo.trip].year;
			return '<a class="photo-explore__card" data-cover-id="' + escape(item.photo.id) + '" data-explore-action="tag" data-tag="' + escape(item.tag) +
				'" href="travel?q=' + encodeURIComponent(item.tag) + '">' + thumbnail(item.photo) +
				'<span class="photo-explore__caption"><strong>' + escape(title) + '</strong><span><span>' + escape(context) +
				'</span></span></span></a>';
		}).join('');
	}

	// Choose a trip first so the longest journal cannot dominate. Do not repeat
	// a photo until the collection is exhausted; blocked storage still works.
	function pickMoment() {
		if (!seenMoments.length) {
			try { seenMoments = JSON.parse(sessionStorage.getItem('photo-explore-moments')) || []; } catch (e) {}
			if (!Array.isArray(seenMoments)) seenMoments = [];
			seenMoments = seenMoments.filter(function(id) { return typeof id === 'string' && photos.some(function(p) { return p.id === id; }); });
		}
		var last = photos.find(function(p) { return p.id === seenMoments[seenMoments.length - 1]; });
		var available = photos.filter(function(p) { return seenMoments.indexOf(p.id) < 0; });
		if (!available.length) { seenMoments = []; available = photos; }
		var tripPool = unique(available.map(function(p) { return p.trip; }));
		if (last && tripPool.length > 1) tripPool = tripPool.filter(function(trip) { return trip !== last.trip; });
		var trip = shuffle(tripPool)[0];
		var photo = shuffle(available.filter(function(p) { return p.trip === trip; }))[0];
		seenMoments.push(photo.id);
		try { sessionStorage.setItem('photo-explore-moments', JSON.stringify(seenMoments)); } catch (e) {}
		return photo;
	}

	function consumeIntent() {
		var action = form.dataset.exploreIntent;
		if (!action || !photos && !failed) return;
		if (failed) { status.textContent = 'Photo search is unavailable right now.'; return; }
		delete form.dataset.exploreIntent;
		if (action.indexOf('tag:') === 0) {
			input.value = action.slice(4);
			run();
			results.querySelector('.photo-hit').focus();
		} else if (action === 'shuffle') {
			exploreMore(); renderExplore();
			status.textContent = 'Six new photo topics to explore.';
		} else if (action === 'surprise' || action === 'previous') {
			if (action === 'previous') momentAt = Math.max(0, momentAt - 1);
			else {
				momentAt++;
				if (momentAt === momentHistory.length) momentHistory.push(pickMoment());
			}
			var photo = momentHistory[momentAt], first = moment.hidden;
			input.value = ''; run();
			discovery.hidden = true;
			moment.hidden = false;
			moment.querySelector('.photo-moment__content').innerHTML =
				'<a class="photo-moment__image" href="' + escape(photo.trip + '#photo=' + encodeURI(photo.id)) + '" aria-label="Open photo: ' + escape(photo.place) + '">' + thumbnail(photo, true) + '</a>' +
				'<div class="photo-moment__copy"><span class="travel-atlas__eyebrow">A moment from the journals</span>' +
				'<h2 id="photo-moment-title" tabindex="-1">' + escape(photo.place) + '</h2><p>' + escape(trips[photo.trip].label + ' · ' + trips[photo.trip].year) +
				'</p>' + (photo.sectionTitle === photo.place ? '' : '<p>' + escape(photo.sectionTitle) + '</p>') + '<a class="photo-moment__read" href="' + escape(photo.trip + '#' + photo.section) + '">Read this day <span aria-hidden="true">&#8599;</span></a></div>';
			status.textContent = photo.place + ' · ' + tripLabel(photo.trip);
			if (!momentAt && document.activeElement === previousMoment) moment.querySelector('[data-explore-action="surprise"]').focus();
			previousMoment.hidden = !momentAt;
			if (first) document.getElementById('photo-moment-title').focus();
		} else if (action === 'back') {
			moment.hidden = true; discovery.hidden = false; status.textContent = '';
			form.querySelector('[data-explore-action="surprise"]').focus();
		}
	}
	form.addEventListener('explore', consumeIntent);

	function starters() {
		var past = recent().map(function(query) { return { tag: query }; });
		return past.length ? chipList(past, 'Recent searches', true, 'Recent',
			'<li><button type="button" class="photo-search__chip photo-search__forget" data-forget aria-label="Clear recent searches">Clear</button></li>') : '';
	}

	// Complete a matching phrase (including a synonym), without duplicating it.
	function completeTag(value, tag) {
		var words = value.trim().split(/\s+/), keys = tag.keys;
		for (var i = 0; i < words.length; i++) {
			var tail = fold(words.slice(i).join(' '));
			if (keys.some(function(key) { return key.indexOf(tail) === 0; })) return { value: words.slice(0, i).concat(tag.tag).join(' '), start: i };
		}
		return null;
	}

	function card(photo, terms, why) {
		var caption = photo.caption && photo.caption !== photo.place ? ' \u00b7 ' + highlight(photo.caption, terms) : '';
		var focal = photo.fx == null && photo.fy == null ? '' : 'object-position:' +
			(photo.fx == null ? 50 : photo.fx) + '% ' + (photo.fy == null ? 50 : photo.fy) + '%;';
		focal = focal ? ' style="' + focal + '"' : '';
		return '<li><a class="photo-hit" href="' + escape(photo.trip + '#photo=' + encodeURI(photo.id)) + '">' +
			'<span class="photo-hit__media"><img loading="lazy" decoding="async" src="' + escape(photo.thumb) +
			'" alt="' + escape(photo.alt) + '" width="' + photo.w + '" height="' + photo.h + '"' + focal + '>' +
			(photo.video ? '<span class="photo-hit__video">Animation</span>' : '') +
			'</span><span class="photo-hit__trip">' + escape(tripLabel(photo.trip)) + '</span>' +
			'<span class="photo-hit__title"><strong>' + highlight(photo.place, terms) +
			'</strong>' + caption + '</span>' +
			(why ? '<span class="photo-hit__why">matches: ' + escape(why.join(', ')) + '</span>' : '') + '</a></li>';
	}

	var chips = form.querySelector('.photo-search__suggest');
	var results = document.getElementById('photo-results');
	var list = results.querySelector('.photo-results__list');
	var more = results.querySelector('.photo-results__more');

	// Up to six tags with photos whose name or synonym starts with the last term.
	function suggest(value) {
		var tail = /\S+$/.exec(value);
		var current = tail ? tokens(tail[0]).pop() : '';
		var earlier = tokens(value.slice(0, tail ? tail.index : value.length));
		var found = !current || !photos ? [] : tags.filter(function(tag) {
			return tag.count && tag.keys[0] !== fold(value.trim()) && completeTag(value, tag) &&
				!tokens(tag.tag).every(function(word) { return earlier.indexOf(word) >= 0; });
		}).sort(function(a, b) {
			return completeTag(value, a).start - completeTag(value, b).start;
		}).slice(0, 6);
		chips.innerHTML = found.length ? chipList(found, 'Suggested tags') : value.trim() || !photos ? '' : starters();
	}

	function closeAtlasOverlay() {
		if (!document.body.classList.contains('is-map-fullscreen')) return;
		document.querySelector('[data-map-close]').click();
		input.focus();
	}

	function collapse(active) {
		if (active === collapsed) return;
		collapsed = active;
		if (active) closeAtlasOverlay();
		collapsible.forEach(function(node) { node.hidden = active; node.inert = active; });
		form.classList.toggle('is-active', active);
	}

	function syncUrl(query) {
		var params = new URLSearchParams(location.search);
		if (query) params.set('q', query);
		else params.delete('q');
		history.replaceState(history.state, '', location.pathname + (params + '' ? '?' + params : '') + location.hash);
	}

	function render(terms, query) {
		renderedQuery = input.value;
		var shown = 0, html = '', sentence = [], runs = [], counts = {};
		// Legend chips, one per trip in run order; a pressed one narrows the grid.
		tiers.forEach(function(hits) {
			hits.forEach(function(hit) {
				var trip = hit.photo.trip;
				if (!counts[trip]) runs.push(trip);
				counts[trip] = ~~counts[trip] + 1;
			});
		});
		if (runs.length > 1) html = '<ul class="photo-search__chips photo-results__trips" aria-label="Journals with matches">' + runs.map(function(trip) {
			return '<li><button type="button" class="photo-search__chip" data-trip="' + escape(trip) + '" aria-pressed="' + (trip === tripFilter) + '">' +
				escape(tripLabel(trip)) + ' <span>' + counts[trip] + '</span></button></li>';
		}).join('') + '</ul>';
		var visible = tiers.map(function(hits) {
			return hits.filter(function(hit) { return !tripFilter || hit.photo.trip === tripFilter; });
		});
		var full = visible[0].length, total = full + visible[1].length;
		// Each tier is one continuous grid; the trip rides on each tile.
		visible.forEach(function(hits, tier) {
			hits = hits.slice(0, limit - shown);
			if (!hits.length) return;
			shown += hits.length;
			html += (tier ? '<h3 class="photo-results__tier">Partial matches</h3>' : visible[1].length ? '<h3 class="sr-only">Full matches</h3>' : '') +
				'<ul class="photo-results__grid">' + hits.map(function(hit) { return card(hit.photo, terms, tier && hit.why); }).join('') + '</ul>';
		});
		if (full) sentence.push(plural(full, 'photo matches', 'photos match') + (terms.length > 1 ? ' all terms' : ''));
		if (total > full) sentence.push(plural(total - full, 'partial match', 'partial matches'));
		if (tripFilter) sentence.push(tripLabel(tripFilter) + ' only');
		if (!total) {
			sentence.push('No photos for \u2018' + query + '\u2019');
			html = '<div class="photo-results__empty"><p>Try a popular subject instead:</p>' +
				chipList(tags.slice(0, 6), 'Popular tags', true) +
				'<button type="button" class="button photo-results__clear" data-clear>Clear search</button></div>';
		}
		list.innerHTML = html;
		status.textContent = sentence.join(' \u00b7 ');
		more.hidden = shown >= total;
		more.textContent = 'Show more (' + (total - shown) + ')';
		results.hidden = false;
	}

	function run() {
		// Async index completion must wait for committed IME text too.
		if (composing) return;
		results.inert = false;
		clearTimeout(timer);
		clearTimeout(saveTimer);
		var value = input.value, query = value.trim();
		if (!query && renderedQuery) { exploreMore(); renderExplore(); renderedQuery = ''; }
		discovery.hidden = !!query && !failed;
		moment.hidden = true;
		var terms = unique(tokens(value));
		clearButton.hidden = !value;
		syncUrl(query);
		collapse(!!query && !failed);
		suggest(value);
		if (!query || failed || !photos) {
			results.hidden = true;
			list.innerHTML = '';
			status.textContent = failed ?
				'Photo search is unavailable right now.' : !query ? '' : 'Loading photos\u2026';
			return;
		}
		limit = PAGE;
		tripFilter = '';
		tiers = search(terms);
		render(terms, query);
		// A query with hits that the visitor pauses on becomes a recent search.
		if (tiers[0].length + tiers[1].length) saveTimer = setTimeout(remember, 1000, query);
	}

	function clearSearch() {
		input.value = '';
		run();
		input.focus();
	}

	function hits() {
		return [].slice.call(list.querySelectorAll('.photo-hit'));
	}

	// A suggestion replaces the last term; a popular tag (data-replace) the query.
	function onClick(event) {
		var button = event.target.closest('button');
		if (event.target.closest('.photo-hit')) remember(input.value.trim());
		if (!button) return;
		var tag = button.getAttribute('data-tag'), trip = button.getAttribute('data-trip');
		if ((button === more || trip) && input.value !== renderedQuery) { run(); input.focus(); return; }
		var redraw = function() { render(unique(tokens(input.value)), input.value.trim()); };
		if (tag) {
			var match = tags.find(function(item) { return item.tag === tag; });
			input.value = (button.hasAttribute('data-replace') || !match ? tag : (completeTag(input.value, match) || { value: tag }).value) + ' ';
			run();
			input.focus();
		} else if (button === more) {
			var from = hits().length;
			limit += PAGE;
			redraw();
			hits()[from].focus();
		} else if (trip) {
			// The legend is rebuilt, so refocus the same chip.
			var at = [].indexOf.call(results.querySelectorAll('[data-trip]'), button);
			tripFilter = trip === tripFilter ? '' : trip;
			limit = PAGE;
			redraw();
			results.querySelectorAll('[data-trip]')[at].focus();
		} else if (button.hasAttribute('data-clear')) {
			clearSearch();
		} else if (button.hasAttribute('data-forget')) {
			recent([]);
			suggest('');
			input.focus();
		}
	}

	input.addEventListener('input', function() {
		delete form.dataset.exploreIntent;
		results.inert = true;
		clearButton.hidden = !input.value;
		clearTimeout(timer);
		if (!composing) timer = setTimeout(run, DEBOUNCE);
	});

	input.addEventListener('compositionstart', function() { composing = true; clearTimeout(timer); });
	input.addEventListener('compositionend', function() { composing = false; run(); });

	form.addEventListener('submit', function(event) {
		event.preventDefault();
		if (composing) return;
		run();
		if (matchMedia('(pointer: coarse)').matches) input.blur();
	});

	form.addEventListener('click', onClick);
	results.addEventListener('click', onClick);

	// Escape clears; arrows move from the field into the hits and between them.
	results.parentNode.addEventListener('keydown', function(event) {
		if (event.isComposing || composing) return;
		var key = event.key, all = hits(), index = all.indexOf(event.target);
		var step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[key];
		if (key === 'Escape' && input.value) {
			event.stopPropagation();
			clearSearch();
		} else if (event.target === input && key === 'ArrowDown' && all.length) {
			all[0].focus();
		} else if (step && index >= 0) {
			if (/Up|Down/.test(key)) step *= getComputedStyle(all[index].closest('ul')).gridTemplateColumns.split(' ').length;
			(all[Math.min(all.length - 1, index + step)] || input).focus();
		} else return;
		event.preventDefault();
	});

	// The loader's "/" shortcut can focus the field behind the atlas overlay.
	input.addEventListener('focus', closeAtlasOverlay);
	if (document.activeElement === input) closeAtlasOverlay();

	var initial = new URLSearchParams(location.search).get('q');
	if (initial && !input.value) input.value = initial;
	if (input.value) run();

	function loadIndex() {
		if (loading) return;
		loading = true; failed = false;
		retry.setAttribute('aria-disabled', 'true');
		form.setAttribute('aria-busy', 'true');
		status.textContent = 'Loading photos…';
		fetch(form.getAttribute('data-search-index'), { credentials: 'same-origin' })
		.then(function(response) {
			if (!response.ok) throw response.status;
			return response.json();
		})
		.then(prepare)
		.catch(function() { failed = true; })
		.then(function() {
			loading = false;
			form.removeAttribute('aria-busy');
			retry.removeAttribute('aria-disabled');
			var restoreFocus = document.activeElement === retry;
			retry.hidden = !failed;
			run();
			if (!failed && restoreFocus) input.focus();
			consumeIntent();
		});
	}
	form.addEventListener('retry-search', loadIndex);
	loadIndex();
})();
