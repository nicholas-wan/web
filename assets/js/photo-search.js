/* Travel photo search, injected on demand by travel.html's inline loader.
   Contracts: "Travel atlas contracts" in docs/project-context.md. */
(function() {
	'use strict';

	var form = document.getElementById('photo-search');
	var input = form && form.q;
	if (!input) return;

	var PAGE = 48, DEBOUNCE = 120, STORE = 'photo-search-recent';
	// Quick-fill searches across facets; only tags with hits are offered.
	var TRY = ['mount fuji', 'penguin', 'ramen', 'snow', 'sunset', 'zoo', 'temple', 'beach', 'night', 'kangaroo', 'castle', 'sushi', 'autumn leaves', 'museum'];
	// Field weights: tags + synonyms, place + caption, alt + section, trip.
	var EXACT = [3, 2, 1, 1], PREFIX = [2, 2, 1, 1];
	var CJK = '\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f';
	// One token per CJK character, otherwise letter/digit runs.
	var WORD = new RegExp('[' + CJK + ']|[a-z0-9\u00df-\u024f\uac00-\ud7af]+', 'g');
	var SEGMENT = new RegExp('[' + CJK + ']|[^\\s!-/:-@[-`{-~\u00b7\u2013\u2014' + CJK + ']+', 'g');

	var status = document.getElementById('photo-search-status');
	var clearButton = form.querySelector('.photo-search__clear');
	var collapsible = document.querySelectorAll('.travel-atlas__layout, #main > .travel-archive-heading, #main > .travel-grid');
	var trips = {}, tags = [], photos = null, failed = false, tiers;
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
	function termScore(photo, term, fuzzy) {
		var best = [0, 0];
		photo.f.forEach(function(words, field) {
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
			expanded[tag.tag] = tag.keys.join(' ');
		});
		photos = data.photos.map(function(photo, order) {
			var trip = trips[photo.trip] || {};
			// Newest trip first, journal order within it (the archive is newest first).
		photo.order = order - trip.order * 1e4;
			photo.f = [
				(photo.tags || []).map(function(name) { return expanded[name] || name; }).join(' '),
				photo.place + ' ' + photo.caption,
				photo.alt + ' ' + photo.sectionTitle,
				trip.label + ' ' + trip.year
			].map(function(text) { return unique(tokens(text)); });
			return photo;
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
		return escape(trips[slug].label + ' · ' + String(trips[slug].year).slice(-2));
	}

	function search(terms) {
		var tier = [[], []];
		var rows = photos.map(function(photo) {
			return terms.map(function(term) { return termScore(photo, term); });
		});
		// Fuzzy matches only stand in for a term with no exact or prefix hit at all.
		terms.forEach(function(term, t) {
			if (!rows.some(function(row) { return row[t][0]; })) rows.forEach(function(row, i) { row[t] = termScore(photos[i], term, 1); });
		});
		var weight = terms.map(function(term, t) {
			return Math.log(1 + photos.length / rows.filter(function(row) { return row[t][0]; }).length);
		});
		rows.forEach(function(row, i) {
			var score = 0, why = [];
			row.forEach(function(best, t) {
				if (!best[0]) return;
				score += best[0] * weight[t];
				why.push(terms[t] + (best[1] > 1 ? ' (in description)' : ''));
			});
			if (why.length) tier[why.length === terms.length ? 0 : 1].push({ photo: photos[i], score: score, why: why });
		});
		return tier.map(rank);
	}

	// Marks go in before escaping, so an entity's digits are never a segment.
	function highlight(text, terms) {
		return escape(String(text).replace(SEGMENT, function(segment) {
			return tokens(segment).some(function(word) {
				return terms.some(function(term) { return kind(word, term, 1); });
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
			return JSON.parse(localStorage.getItem(STORE)) || [];
		} catch (error) {
			return [];
		}
	}

	function remember(query) {
		recent([query].concat(recent().filter(function(past) { return past !== query; })).slice(0, 4));
	}

	// Before any typing: Recent (when kept) then Try.
	function starters() {
		var past = recent().map(function(query) { return { tag: query }; });
		return (past.length ? chipList(past, 'Recent searches', true, 'Recent',
			'<li><button type="button" class="photo-search__chip photo-search__forget" data-forget aria-label="Clear recent searches">Clear</button></li>') : '') +
			chipList(TRY.map(function(name) {
				return tags.filter(function(tag) { return tag.tag === name && tag.count; })[0];
			}).filter(Boolean).slice(0, 8), 'Suggested searches', true, 'Try');
	}

	function card(photo, terms, why) {
		var caption = photo.caption && photo.caption !== photo.place ? ' \u00b7 ' + highlight(photo.caption, terms) : '';
		var focal = photo.fx == null && photo.fy == null ? '' : ' style="object-position:' +
			(photo.fx == null ? 50 : photo.fx) + '% ' + (photo.fy == null ? 50 : photo.fy) + '%"';
		return '<li><a class="photo-hit" href="' + escape(photo.trip + '#photo=' + encodeURI(photo.id)) + '">' +
			'<span class="photo-hit__media"><img loading="lazy" decoding="async" src="' + escape(photo.thumb) +
			'" alt="' + escape(photo.alt) + '" width="' + photo.w + '" height="' + photo.h + '"' + focal + '>' +
			'<span class="photo-hit__trip">' + tripLabel(photo.trip) + '</span>' +
			(photo.video ? '<span class="photo-hit__video">Animation</span>' : '') +
			'</span><span class="photo-hit__title"><strong>' + highlight(photo.place, terms) +
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
			return tag.count && tag.keys[0] !== current && tag.keys.some(function(key) { return key.lastIndexOf(current, 0) === 0; }) &&
				!tokens(tag.tag).every(function(word) { return earlier.indexOf(word) >= 0; });
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
		collapsible.forEach(function(node) { node.hidden = active; });
		form.classList.toggle('is-active', active);
	}

	function syncUrl(query) {
		var params = new URLSearchParams(location.search);
		if (query) params.set('q', query);
		else params.delete('q');
		history.replaceState(history.state, '', location.pathname + (params + '' ? '?' + params : '') + location.hash);
	}

	function render(terms, query) {
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
				tripLabel(trip) + ' <span>' + counts[trip] + '</span></button></li>';
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
			html += (tier ? '<h3 class="photo-results__tier">Partial matches</h3>' : '') +
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
		clearTimeout(timer);
		clearTimeout(saveTimer);
		var value = input.value, query = value.trim();
		var terms = unique(tokens(value));
		clearButton.hidden = !value;
		syncUrl(query);
		collapse(!!query && !failed);
		suggest(value);
		if (!query || failed || !photos) {
			results.hidden = true;
			list.innerHTML = '';
			status.textContent = !query ? '' : failed ?
				'Photo search is unavailable right now.' :
				'Loading photos\u2026';
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
		var tail = /\S+$/.exec(input.value);
		var redraw = function() { render(unique(tokens(input.value)), input.value.trim()); };
		if (tag) {
			input.value = button.hasAttribute('data-replace') || !tail ? tag + ' ' : input.value.slice(0, tail.index) + tag + ' ';
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
		clearButton.hidden = !input.value;
		clearTimeout(timer);
		timer = setTimeout(run, DEBOUNCE);
	});

	form.addEventListener('submit', function(event) {
		event.preventDefault();
		run();
		if (matchMedia('(pointer: coarse)').matches) input.blur();
	});

	form.addEventListener('click', onClick);
	results.addEventListener('click', onClick);

	// Escape clears; arrows move from the field into the hits and between them.
	results.parentNode.addEventListener('keydown', function(event) {
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

	fetch(form.getAttribute('data-search-index'), { credentials: 'same-origin' })
		.then(function(response) {
			if (!response.ok) throw response.status;
			return response.json();
		})
		.then(prepare)
		.catch(function() { failed = true; })
		.then(run);
})();
