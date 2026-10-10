/* Travel photo search, injected on demand by travel.html's inline loader.
   Contracts: "Travel atlas contracts" in docs/project-context.md. */
(function() {
	'use strict';

	var form = document.getElementById('photo-search');
	var input = form && form.q;
	if (!input) return;

	var PAGE = 48, DEBOUNCE = 120;
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
	var timer = 0, limit = PAGE, collapsed = false;

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
	function kind(word, term) {
		if (word === term) return 3;
		if (word.lastIndexOf(term, 0) === 0) return 2;
		return term.length > 4 && near(word, term) ? 1 : 0;
	}

	function termScore(photo, term) {
		var best = 0;
		photo.f.forEach(function(words, field) {
			words.forEach(function(word) {
				var match = kind(word, term);
				var score = match === 3 ? EXACT[field] : match && PREFIX[field] - (match === 1 ? 0.5 : 0);
				if (score > best) best = score;
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
			photo.order = order;
			photo.f = [
				(photo.tags || []).map(function(name) { return expanded[name] || name; }).join(' '),
				photo.place + ' ' + photo.caption,
				photo.alt + ' ' + photo.sectionTitle,
				trip.label + ' ' + trip.year
			].map(function(text) { return unique(tokens(text)); });
			return photo;
		});
	}

	// Score, then journal order; trips group in the order of their best hit.
	function rank(hits) {
		var groups = [], byTrip = {};
		hits.sort(function(a, b) { return b.score - a.score || a.photo.order - b.photo.order; });
		hits.forEach(function(hit) {
			var trip = hit.photo.trip;
			if (!byTrip[trip]) groups.push(byTrip[trip] = { trip: trip, hits: [] });
			byTrip[trip].hits.push(hit);
		});
		groups.count = hits.length;
		return groups;
	}

	function search(terms) {
		var tier = [[], []];
		photos.forEach(function(photo) {
			var score = 0, matched = 0;
			terms.forEach(function(term) {
				var value = termScore(photo, term);
				score += value;
				if (value) matched++;
			});
			if (matched) tier[matched === terms.length ? 0 : 1].push({ photo: photo, score: score });
		});
		return tier.map(rank);
	}

	function highlight(text, terms) {
		return escape(text).replace(SEGMENT, function(segment) {
			return tokens(segment).some(function(word) {
				return terms.some(function(term) { return kind(word, term); });
			}) ? '<mark>' + segment + '</mark>' : segment;
		});
	}

	function chipList(list, label, replaceAll) {
		return '<ul class="photo-search__chips" aria-label="' + label + '">' + list.map(function(tag) {
			return '<li><button type="button" class="photo-search__chip" data-tag="' + escape(tag.tag) + '"' +
				(replaceAll ? ' data-replace' : '') + '>' + escape(tag.tag) + ' <span>' + tag.count + '</span></button></li>';
		}).join('') + '</ul>';
	}

	function card(photo, terms) {
		var caption = photo.caption && photo.caption !== photo.place ? ' \u00b7 ' + highlight(photo.caption, terms) : '';
		return '<li><a class="photo-hit" href="' + escape(photo.trip + '#photo=' + encodeURI(photo.id)) + '">' +
			'<span class="photo-hit__media"><img loading="lazy" decoding="async" src="' + escape(photo.thumb) +
			'" alt="' + escape(photo.alt) + '" width="' + photo.w + '" height="' + photo.h + '"></span>' +
			'<span class="photo-hit__body"><span class="photo-hit__title"><strong>' + highlight(photo.place, terms) +
			'</strong>' + caption + '</span><span class="photo-hit__meta">' +
			(photo.sectionTitle ? '<span class="photo-hit__pill">' + escape(photo.sectionTitle) + '</span>' : '') +
			(photo.video ? '<span class="photo-hit__pill photo-hit__pill--video">Animation</span>' : '') +
			'</span></span></a></li>';
	}

	var chips = form.querySelector('.photo-search__suggest');
	var results = document.getElementById('photo-results');
	var list = results.querySelector('.photo-results__list');
	var more = results.querySelector('.photo-results__more');

	// Up to six tags whose name or synonym starts with the last term.
	function suggest(value) {
		var tail = /\S+$/.exec(value);
		var current = tail ? tokens(tail[0]).pop() : '';
		var earlier = tokens(value.slice(0, tail ? tail.index : value.length));
		var found = !current || !photos ? [] : tags.filter(function(tag) {
			return tag.keys[0] !== current && tag.keys.some(function(key) { return key.lastIndexOf(current, 0) === 0; }) &&
				!tokens(tag.tag).every(function(word) { return earlier.indexOf(word) >= 0; });
		}).slice(0, 6);
		chips.innerHTML = found.length ? chipList(found, 'Suggested tags') : '';
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
		var shown = 0, html = '', sentence = [];
		var full = tiers[0].count, total = full + tiers[1].count;
		tiers.forEach(function(groups, tier) {
			if (tier && groups.length && shown < limit) html += '<h3 class="photo-results__tier">Partial matches</h3>';
			groups.forEach(function(group) {
				if (shown >= limit) return;
				var trip = trips[group.trip];
				var heading = tier ? 'h4' : 'h3';
				html += '<' + heading + ' class="photo-results__trip">' +
					escape(trip.label + ' \u00b7 ' + trip.year) +
					'</' + heading + '><ul class="photo-results__grid">' +
					group.hits.slice(0, limit - shown).map(function(hit) {
						shown++;
						return card(hit.photo, terms);
					}).join('') + '</ul>';
			});
		});
		if (full) sentence.push(plural(full, 'photo matches', 'photos match') + (terms.length > 1 ? ' all terms' : ''));
		if (total > full) sentence.push(plural(total - full, 'partial match', 'partial matches'));
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
		tiers = search(terms);
		render(terms, query);
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
		if (!button) return;
		var tag = button.getAttribute('data-tag');
		var tail = /\S+$/.exec(input.value);
		if (tag) {
			input.value = button.hasAttribute('data-replace') || !tail ? tag + ' ' : input.value.slice(0, tail.index) + tag + ' ';
			run();
			input.focus();
		} else if (button === more) {
			var from = hits().length;
			limit += PAGE;
			render(unique(tokens(input.value)), input.value.trim());
			hits()[from].focus();
		} else if (button.hasAttribute('data-clear')) {
			clearSearch();
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
