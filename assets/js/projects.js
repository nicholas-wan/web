/* 85% of a demo on screen: the bar for its preview and for the desktop carousel to turn. */
const pjVisible = d => { const b = d.getBoundingClientRect(); return Math.max(0, Math.min(innerHeight, b.bottom) - Math.max(0,b.top)) / b.height >= .85; };
/* Each sample app initializes only within 500px of the viewport. */
function projectsDemo(selector, init) {
	const roots = [...document.querySelectorAll(selector)];
	const boot = root => { if (!root.dataset.initialized) { root.dataset.initialized='1'; init(root); } };
	roots.forEach(root => root.addEventListener('focusin', () => boot(root), {once:true}));
	const io = new IntersectionObserver(entries => entries.forEach(e => {
		if (e.isIntersecting) { boot(e.target); io.unobserve(e.target); }
	}), {rootMargin:'500px'});
	roots.forEach(root => io.observe(root));
}
/* SquashBot demo in the bot's own words (squashbot/src). "Now" is Fri 13 Nov 2026, 9:41am. */
(() => {
'use strict';
const U = 'DodgerBlueee', WD = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');
const MO = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const CW = '(\\d{1,2}|one|two|three|four|five)';
const COURT = `\\b(?:courts?|crt|ct|c)\\s*#?\\s*${CW}\\b`;
const MW = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
const NOW = 581;
const T0 = Date.UTC(2026, 10, 13);
const dt = (o) => new Date(T0 + o * 864e5);
const sd = (o) => { const d = dt(o); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`; };
const cd = (o) => sd(o).replace(' ', ', ');
const ap = (m) => (m < 720 ? 'am' : 'pm');
const mm = (m) => String(m % 60).padStart(2, '0');
const ck = (m) => `${Math.floor(m / 60) % 12 || 12}${m % 60 ? `:${mm(m)}` : ''}${ap(m)}`;
const span = (s, e) => (e - s === 60 ? ck(s) : `${ck(s)}–${ck(e)}`);
const slots = (n) => `${n} slot${n === 1 ? '' : 's'}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const tag = (n) => `<span class="sq-at">${n}</span>`;
const free = (b) => b.cap - b.ppl.length;
const named = (b) => b.ppl.filter(Boolean);
const LOGO = '<svg viewBox="0 0 30 30" width="30" height="30"><g transform="translate(17.4 10.6) rotate(40)" fill="none"><ellipse rx="4.7" ry="6.5" fill="#2e3439"/><path d="M0-5.6V5.6M-4 0h8M-2.4-4.8v9.6M2.4-4.8v9.6" stroke="#79828a" stroke-width=".4"/><ellipse rx="4.7" ry="6.5" stroke="#f2f4f5" stroke-width="1.4"/><path d="M-2.2 6 0 10.4 2.2 6" stroke="#f2f4f5" stroke-width="1.2"/><path d="M0 10.6v6.2" stroke="#5a6067" stroke-width="2.8" stroke-linecap="round"/></g><circle cx="23.4" cy="22.4" r="2.3" fill="#141618" stroke="#50565c" stroke-width=".6"/><circle cx="24" cy="21.7" r=".45" fill="#f5c542"/></svg>';
const TICKS = '<svg viewBox="0 0 16 11" width="15" height="10"><path d="M1 5.8l2.8 2.8L10 2.2M6.4 8.6l.2.2L13 2.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

const intent = (t) => (/\b(?:courts?|crt|squash|book(?:ed|ing)?)\b/.test(t) ? /\d|\b(?:today|tonight|tomorrow|tmr)\b/.test(t)
	: new RegExp(`\\b(?:crt|ct)\\s*#?\\s*${CW}\\b|\\bc#?\\d{1,2}\\b`).test(t) && /\b(?:\d{1,2}(?:[:.]\d{2})?\s*[ap]m|\d{1,2}[:.]\d{2}|(?:[01]?\d|2[0-3])[0-5]\d)\b/.test(t));
function pDate(t) {
	if (/\b(?:tomorrow|tmrw?)\b/.test(t)) return 1;
	if (/\b(?:today|tonight)\b/.test(t)) return 0;
	let m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MW}`));
	if (m) {
		const at = (y) => (Date.UTC(y, MO.findIndex((x) => x.toLowerCase() === m[2]), m[1]) - T0) / 864e5;
		return at(2026) < -180 ? at(2027) : at(2026);
	}
	if (!(m = t.match(/\b(next\s+)?(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/))) return null;
	const a = (WD.findIndex((x) => x.toLowerCase() === m[2]) + 2) % 7;
	return m[1] && !a ? 7 : a;
}
const pCourt = (t) => { const m = t.match(new RegExp(COURT)); return m ? String(NUM[m[1]] || +m[1]) : null; };
function pTime(t) {
	t = t.replace(new RegExp(COURT, 'g'), ' ').replace(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MW}`, 'g'), ' ');
	const H = (h, mi, a) => (a ? (h % 12) + (a === 'pm' ? 12 : 0) : +h) * 60 + (+mi || 0);
	let m = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap]m)?\s*(?:-|–|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap]m)\b/);
	if (m) return { s: H(m[1], m[2], m[3] || m[6]), e: H(m[4], m[5], m[6]) };
	if ((m = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap]m)\b/))) return { s: H(m[1], m[2], m[3]) };
	if ((m = t.match(/\b([01]?\d|2[0-3])[:.]?([0-5]\d)\b/))) return { s: H(m[1], m[2]) };
	return null;
}
function draft(text) {
	const t = text.toLowerCase();
	if (!intent(t)) return null;
	const tm = pTime(t) || {};
	return { src: text, o: pDate(t), c: pCourt(t), s: tm.s ?? null, e: tm.e ?? null, ch: {}, is: [] };
}

function card(d) {
	const f = d.o == null ? 'd' : d.c == null ? 'c' : d.s == null ? 't' : '';
	const ask = '❓ Need your input';
	const L = ['🎾 <b>Confirm this squash booking</b>', '',
		`Date: ${d.o == null ? ask : `<b>${cd(d.o)} ${dt(d.o).getUTCFullYear()}</b>`}`,
		`Court: ${d.c == null ? ask : `<b>Court ${esc(d.c)}</b>`}`,
		`Time: ${d.s == null ? ask : `<b>${ck(d.s)}–${d.e == null ? `${ck(d.s + 60)} (1 hour)` : ck(d.e)}</b>`}`,
		'', `From: <code>${esc(d.src)}</code>`];
	if (d.is.length) L.push('', `⚠️ ${d.is.join(' ')}`);
	let kb = [];
	if (f) {
		const [name, q, n, def] = {
			d: ['date', 'Which date?', 2, [0, 1, 2, 3, 4, 5, 6]],
			c: ['court', 'Which court?', 4, ['1', '2', '3', '4'].filter((c) => c !== d.prior)],
			t: ['time', 'What time?', 3, [420, 480, 720, 1020, 1080, 1140, 1200, 1260]],
		}[f];
		const keys = (d.ch[f] = d.ch[f] || def).map((v, i) => ({ t: f === 'd' ? cd(v) : f === 'c' ? `Court ${v}` : ck(v), a: f + i }));
		L.push('', `<b>${q}</b>`);
		for (let i = 0; i < keys.length; i += n) kb.push(keys.slice(i, i + n));
		kb.push([{ t: `✍️ Type another ${name}`, a: `u${f}` }]);
	} else {
		L.push('', 'Nothing is saved until you tap <b>Add booking</b>.');
		kb = [[{ t: '✅ Add booking', a: 'y' }],
			[{ t: '📅 Change date', a: 'xd' }, { t: '🔢 Change court', a: 'xc' }], [{ t: '🕐 Change time', a: 'xt' }]];
	}
	if (!f) kb.push([{ t: '👤 Admin: booked by / free', a: 'admin' }]);
	kb.push([{ t: '✕ Cancel', a: 'n' }]);
	return { html: L, kb };
}

function init(root) {
	if (!root.querySelector('.sq [data-chat]')) return;
	root.dataset.sqReady = '1';
	const $ = (s) => root.querySelector(s);
	const [chat, pin, pm, sub, toastEl, input, snd, pinBtn, pinBox] = ['[data-chat]', '[data-pin]', '[data-pm]', '[data-sub]', '[data-toast]', '[data-in]', '.sq-snd', '.sq-pinbtn', '.sq-pin'].map($);
	const motion = matchMedia('(prefers-reduced-motion: reduce)');
	const still = () => motion.matches;
	const keyed = () => document.activeElement?.matches(':focus-visible');
	const focus = (el) => el && el.focus({ preventScroll: true });
	let S = null; let timers = []; let ptimers = [];
	const later = (ms, fn) => timers.push(setTimeout(fn, still() ? 0 : ms));
	const plater = (ms, fn) => ptimers.push(setTimeout(fn, ms));
	const sorted = () => S.courts.slice().sort((a, b) => a.o - b.o || a.s - b.s);

	function fill(m) {
		const kb = m.kb && m.kb.length;
		m.el.className = `sq-m sq-m--${m.me ? 'me' : 'bot'}${kb ? ' sq-m--kb' : ''}`;
		m.el.innerHTML = `<div class="sq-bub">${m.me ? '' : '<div class="sq-who">SquashBot</div>'}<div class="sq-tx">${m.html.map((l, i, a) => (l
			? `<div>${l}${i === a.length - 1 ? '<span class="sq-sp"></span>' : ''}</div>` : '<div class="sq-gap"></div>')).join('')
		}</div><span class="sq-tm">${m.time || '9:41'}${m.me ? TICKS : ''}</span></div>${kb ? `<div class="sq-kb">${m.kb.map((r) => `<div class="sq-kr">${
			r.map((k) => `<button type="button" class="sq-key" data-a="${k.a}">${k.t}</button>`).join('')}</div>`).join('')}</div>` : ''
		}${m.me ? '' : `<span class="sq-av" aria-hidden="true">${LOGO}</span>`}`;
	}
	function regroup() {
		S.msgs.forEach((m, i, a) => {
			m.el.classList.toggle('is-first', !a[i - 1] || !a[i - 1].me !== !m.me);
			const last = !a[i + 1] || !a[i + 1].me !== !m.me;
			m.el.classList.toggle('is-last', last);
			m.el.classList.toggle('is-tail', last && !(m.kb && m.kb.length));
		});
	}
	const bottom = (quiet) => chat.scrollTo({ top: chat.scrollHeight, behavior: quiet || still() ? 'auto' : 'smooth' });
	function post(m, quiet) {
		m.el = document.createElement('div');
		fill(m);
		S.msgs.push(m);
		chat.appendChild(m.el);
		regroup();
		if (!quiet && !still()) {
			m.el.classList.add('is-new');
			void m.el.offsetWidth;
			m.el.classList.remove('is-new');
		}
		bottom(quiet);
		return m;
	}
	function edit(m, props) {
		const had = m.el.contains(document.activeElement) && keyed();
		Object.assign(m, props);
		fill(m);
		regroup();
		bottom();
		if (had) focus(m.el.querySelector('.sq-key') || input);
	}
	function drop(m) {
		const el = m && m.el;
		if (!el) return;
		const had = el.contains(document.activeElement) && keyed();
		m.el = null;
		S.msgs = S.msgs.filter((x) => x !== m);
		regroup();
		if (still()) el.remove();
		else {
			el.style.height = `${el.offsetHeight}px`;
			void el.offsetWidth;
			el.classList.add('is-gone');
			el.style.height = '0';
			later(300, () => el.remove());
		}
		if (had) focus(input);
	}
	function typing(on) {
		sub.textContent = on ? 'SquashBot is typing…' : '8 members';
		sub.classList.toggle('is-typing', on);
	}
	function toast(text, ms = 1700) {
		toastEl.textContent = text;
		toastEl.classList.add('is-on');
		clearTimeout(S.tt);
		timers.push(S.tt = setTimeout(() => toastEl.classList.remove('is-on'), ms));
	}
	const placeholder = (t = 'Try: court 3 sat 7pm') => { input.placeholder = t; };
	const sendState = () => snd.classList.toggle('is-on', !!input.value.trim());

	function showPin(i, flash) {
		S.pin = i;
		pm.textContent = i ? `💰 Squash tab · owed to Nicholas ${U} · $2.00` : S.board;
		pin.setAttribute('aria-label', `Pinned message ${2 - i} of 2: ${pm.textContent}`);
		pinBtn.textContent = i ? '🧾 Tab' : '🎾 Courts';
		pinBtn.dataset.mini = i ? 'tab' : 'courts';
		root.querySelectorAll('.sq-pbar span').forEach((s, k) => s.classList.toggle('is-on', k !== i));
		if (flash && !still()) {
			pinBox.classList.remove('is-flash');
			void pinBox.offsetWidth;
			pinBox.classList.add('is-flash');
		}
	}
	function sync(quiet) {
		const rows = ['📌 <b>Court schedule</b>', ''].concat(sorted().map((b) => {
			const l = `${b.o > 1 ? sd(b.o) : b.o ? 'Tomorrow' : 'Today'} · ${span(b.s, b.e)} · <b>C${esc(b.c)}</b> · ${free(b) ? slots(free(b)) : 'full'}`;
			return free(b) ? l : `<s>${l}</s>`;
		}));
		const board = rows.join(' ').replace(/<[^>]+>/g, '').replace('  ', ' ');
		if (board !== S.board) {
			S.board = board;
			showPin(0, !quiet);
			if (S.bd) {
				edit(S.bd, { html: rows });
				if (!quiet) {
					S.bd.el.classList.add('sq-hl');
					later(380, () => { const el = S.bd?.el, r = chat.getBoundingClientRect(); if (el) chat.scrollTo({ top: chat.scrollTop + (el.getBoundingClientRect().top - r.top) * chat.offsetHeight / r.height - 6, behavior: still() ? 'auto' : 'smooth' }); });
				}
			}
			else S.bd = post({ html: rows, time: '9:15', kb: [[{ t: '🎾 Courts', a: 'c' }]], on: (a, m, key) => openMini('courts', key) }, quiet);
		}
		const next = sorted().find((b) => free(b) > 0 && (b.o || b.s > NOW));
		const html = next && [`🙋 <b>${slots(free(next))} left on Court ${esc(next.c)}</b>`,
			`${next.o > 1 ? `In ${next.o} days` : next.o ? 'Tomorrow' : 'Today'} · ${sd(next.o)} · ${span(next.s, next.e)}`,
			`Playing: ${named(next).map(tag).join(', ')}`];
		if (S.av && S.av.court === next) return S.av.html.join() === html.join() || edit(S.av, { html });
		drop(S.av);
		S.av = next && post({ html, court: next, on: onAvail, time: quiet ? '9:15' : 0,
			kb: [[{ t: '🙋 Join', a: 'join' }], [{ t: '⚙️ Admin: add / remove', a: 'admin' }]] }, quiet);
		if (S.av && !quiet) S.av.el.classList.add('sq-hl');
	}
	const onAvail = (a, m) => join(m.court);
	function join(b, quiet) {
		if (b.ppl.includes(U)) return toast('You are already on that court.', 2400);
		b.ppl.push(U);
		toast(`You are in: Court ${b.c}, ${sd(b.o)}.`);
		later(400, sync);
	}

	function onCard(a, m) {
		const d = S.draft;
		if (!d || m !== S.card) return;
		const [k, f] = a;
		if (a === 'y') return add(m);
		if (a === 'n') {
			S.draft = S.card = S.pending = null;
			placeholder();
			return edit(m, { html: ['✕ <em>Booking cancelled.</em>'], kb: 0 });
		}
		if (k === 'u') return ask(f);
		if (k === 'x') {
			if (f === 'd') d.o = null;
			if (f === 'c') { d.prior = d.c || d.prior; d.c = null; }
			if (f === 't') d.s = d.e = null;
			d.ch[f] = null;
		} else {
			const v = d.ch[k][+a.slice(1)];
			if (k === 't') { d.s = v; d.e = null; } else d[k === 'd' ? 'o' : 'c'] = v;
			d.ch[k] = null;
		}
		d.is = [];
		edit(m, card(d));
	}
	function add(m) {
		const d = S.draft;
		const e = d.e ?? d.s + 60;
		const err = d.o < 0 || (!d.o && d.s <= NOW) ? 'That booking time has already passed. Change the date or time.'
			: d.s < 420 ? 'Courts open at 7am. Choose a later start time.'
				: d.s > 1260 ? 'The last slot starts at 9pm. Choose an earlier start time.'
						: e > 1320 ? 'Courts close at 10pm. Choose an earlier finish time.' : '';
		if (err) { d.is = [err]; return edit(m, card(d)); }
		const b = { c: d.c, o: d.o, s: d.s, e, cap: 3, ppl: ['Nicholas', U] };
		S.courts.push(b);
		S.draft = S.card = S.pending = null;
		drop(S.prompt);
		placeholder();
		toast('✅ Booking added');
		drop(m);
		later(450, sync);
	}
	const FLD = { d: ['date', '13 Aug, tomorrow, or Friday'], c: ['court', '4 or Court A'], t: ['time', '9pm or 8pm-9:30pm'] };
	function ask(f, again) {
		const [name, ex] = FLD[f];
		drop(S.prompt);
		S.pending = f;
		S.prompt = post({ html: again ? [`⚠️ ${f === 'c' ? 'Reply with a court number or name, such as 4 or Court A.' : `I couldn’t read that ${name}.`} Please reply again.`]
			: [`${tag(U)}, reply with the ${name}.`, `Example: <code>${ex}</code>`] });
		placeholder(`Type the ${name}`);
		focus(input);
	}
	function reply(f, t, mine) {
		const d = S.draft;
		const v = f === 'd' ? pDate(t) : f === 'c' ? pCourt(`court ${t.replace(/^c[a-z]*\s*/, '')}`) || t.match(/^(?:court\s*)?([a-z])$/)?.[1].toUpperCase() : pTime(t);
		later(500, () => {
			drop(mine);
			if (v == null) return ask(f, 1);
			if (f === 't') { d.s = v.s; d.e = v.e ?? null; } else d[f === 'd' ? 'o' : 'c'] = v;
			d.ch[f] = null;
			drop(S.prompt);
			if (S.card) edit(S.card, card(d));
		});
	}
	function say(text, chip) {
		text = text.trim();
		if (!text) return;
		const mine = post({ me: 1, html: [esc(text)] });
		const f = !chip && S.draft && S.pending;
		input.value = '';
		sendState();
		placeholder();
		S.pending = null;
		if (f) return reply(f, text.toLowerCase(), mine);
		const d = draft(text);
		if (!d) return toast('Not a booking, so SquashBot stays quiet.', 2600);
		typing(true);
		later(700, () => {
			typing(false);
			drop(S.card);
			drop(S.prompt);
			S.draft = d;
			S.card = post({ ...card(d), on: onCard });
			const k = chat.offsetHeight / chat.getBoundingClientRect().height;
			chat.scrollTo({ top: chat.scrollTop + (S.card.el.getBoundingClientRect().top - chat.getBoundingClientRect().top) * k - 26, behavior: still() ? 'auto' : 'smooth' });
			later(550, () => drop(mine));
		});
	}

	const mini = document.createElement('div');
	mini.className = 'sq-mini'; mini.hidden = true;
	mini.setAttribute('role', 'dialog'); mini.setAttribute('aria-label', 'SquashBot Mini App');
	root.appendChild(mini);
	let miniOpener;
	function closeMini() { mini.hidden = true; chat.inert = false; if (miniOpener) miniOpener.focus({ preventScroll: true }); }
	/* The Mini App as squashbot/public/app draws it: title, Close, Courts | Tab, then rows. */
	function openMini(kind, opener, again) {
		if (opener) miniOpener = opener;
		const tab = kind === 'tab', row = (a, b) => `<div class="sq-mr"><span>${a}</span>${b}</div>`;
		mini.innerHTML = `<div class="sq-mtop"><b>${tab ? 'Tab' : 'Courts'}</b><button type="button" data-mx>Close</button></div><div class="sq-mseg">${[['courts', '🎾 Courts'], ['tab', '🧾 Tab']].map(([k, l]) =>
			`<button type="button" data-mk="${k}" aria-pressed="${k === kind}">${l}</button>`).join('')}</div>${tab
			? `<div class="sq-mcard"><strong>$2.00</strong>You owe Nicholas</div><div class="sq-mlbl">Your history</div><div class="sq-msec">${row('Court 4 · 10 Nov · 8pm–9pm · $6.00&nbsp;÷&nbsp;3', '<b>$2.00</b>')}</div><p>Courts are $6/hour from 6pm, on weekends and on public holidays, $3/hour otherwise, split across everyone who played.</p>`
			: `<div class="sq-msec">${sorted().map((b, i) => row(`<b>Court ${esc(b.c)} · ${sd(b.o)}</b>${span(b.s, b.e)} · ${free(b) ? `${free(b)} left` : 'full'} · ${b.ppl.length}/${b.cap}<br>👥 ${named(b).join(', ')}${b.ppl.length > named(b).length ? ` + ${b.ppl.length - named(b).length}` : ''}`,
				b.ppl.includes(U) ? `<button type="button" data-mj="${i}" class="is-out">Leave</button>` : free(b) ? `<button type="button" data-mj="${i}">Join</button>` : '<i>Full</i>')).join('')}</div><p>Tap a court to seat or remove players, or to change it.</p><button type="button" class="sq-madd" data-ma>➕ Add booking</button>`}`;
		mini.hidden = false; chat.inert = true; toastEl.classList.remove('is-on');
		(mini.querySelector(again) || mini.querySelector('button')).focus({ preventScroll: true });
	}
	mini.addEventListener('click', (e) => {
		const t = e.target.closest('button'), d = t && t.dataset;
		if (!t) return;
		if (d.mk) return openMini(d.mk, 0, `[data-mk="${d.mk}"]`);
		if (d.mj) {
			const b = sorted()[d.mj], k = b.ppl.indexOf(U);
			if (k < 0) join(b, 1); else { b.ppl.splice(k, 1); later(400, sync); }
			return openMini('courts', 0, `[data-mj="${d.mj}"]`);
		}
		closeMini();
		if (d.ma) focus(input);
	});
	root.addEventListener('keydown', e => { if (!mini.hidden && e.key === 'Escape') closeMini(); });
	root.querySelectorAll('[data-mini]').forEach(b => b.addEventListener('click', () => openMini(b.dataset.mini,b)));
	root.addEventListener('demo:reset', () => { mini.hidden = true; chat.inert = false; });

	chat.addEventListener('click', (e) => {
		const key = e.target.closest('.sq-key');
		const m = key && S.msgs.find((x) => x.el.contains(key));
		if (key && key.dataset.a === 'admin') return toast('The real app opens a seat picker here for admins.');
		if (m && m.on) m.on(key.dataset.a, m, key);
	});
	pin.addEventListener('click', () => showPin(S.pin ? 0 : 1));
	const chips = root.querySelectorAll('.sq-chip'), send = (c) => { c.hidden = true; say(c.textContent, 1); };
	chips.forEach((c) => c.addEventListener('click', () => send(c)));
	$('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); say(input.value); });
	input.addEventListener('input', sendState);

	const addKey = () => S.card?.el?.querySelector('[data-a="y"]');
	function press(el, fn) {
		if (!el) return;
		el.classList.add('is-press');
		plater(170, () => { el.classList.remove('is-press'); fn(); });
	}
	function stopPreview() {
		S.touched = 1;
		ptimers.forEach(clearTimeout);
		ptimers = [];
		root.querySelectorAll('.is-ring, .is-press').forEach((k) => k.classList.remove('is-ring', 'is-press'));
	}
	root.addEventListener('demo:stop', stopPreview);
	function preview() {
		if (S.touched || still()) return;
		const chip = $('.sq-chip');
		plater(700, () => press(chip, () => send(chip)));
		plater(3300, () => addKey()?.classList.add('is-ring'));
		plater(4100, () => press(addKey(), () => onCard('y', S.card)));
	}

	function build() {
		timers.concat(ptimers).forEach(clearTimeout);
		timers = []; ptimers = [];
		S = { msgs: [], touched: false,
			courts: [{ c: '1', o: 2, s: 600, e: 720, cap: 3, ppl: ['Nicholas'] }, { c: '2', o: 4, s: 1200, e: 1260, cap: 3, ppl: ['Nicholas', '', ''] },
				{ c: '3', o: 6, s: 1140, e: 1230, cap: 3, ppl: ['Nicholas', 'Priya'] }] };
		chat.innerHTML = '<div class="sq-day">Today</div>';
		chips.forEach((c) => { c.hidden = false; });
		toastEl.classList.remove('is-on');
		typing(false);
		input.value = '';
		sendState();
		placeholder();
		sync(1);

		chat.scrollTop = chat.scrollHeight;
	}
	build();
	root.addEventListener('demo:visible', preview);
	root.addEventListener('demo:reset', build);
}

const boot = () => projectsDemo('.app-demo--squash', init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();


/* Nag-bot demo. Wording from nag-bot's src/ and its Mini App (public/app). */
(() => {
const ME = 'Nicholas', CH = 'wash the litter box', NOW = '7:45 PM', MAX = 3, NEXT = 'in 42 days · Dec 20, 7:30 PM';

const PRE = [['30m', '8:15 PM'], ['1h', '8:45 PM'], ['2h', '9:45 PM'], ['3h', '10:45 PM'], ['6h', 'tomorrow 1:45 AM'],
	['🌙 9pm today', '9:00 PM'], ['📅 Tomorrow', 'tomorrow 7:45 PM', 2.5],
	['📅 1 week', 'in 7 days · Nov 15, 7:45 PM', 9], ['📅 2 weeks', 'in 14 days · Nov 22, 7:45 PM', 9]]
	.map(([l, w, post]) => [l, /^[ti]/.test(w) ? w : `today ${w}`, post]);

const CHORES = [['wash', '💩', CH, 'every 6 weeks', '7:30 PM'],
	['plants', '🪴', 'water plants', 'every Mon,Thu', '8:00 AM', 0, ['tomorrow 8:00 AM']],
	['trash', '🗑️', 'trash', 'daily', '7:00 PM', 0, ['tomorrow 7:00 PM']],
	['poop', '💩', 'clear poop', 'every 2 days', '9:00 PM', 'wash', ['tomorrow 9:00 PM', 'in 2 days · Tue 9:00 PM']],
	['shake', '💩', 'shake the litter box', 'every 4 days', '9:00 PM', 'poop', ['in 2 days · Tue 9:00 PM', 'in 4 days · Thu 9:00 PM']],
].map(([id, e, t, cad, at, parent, st]) => ({ id, e, t, cad, at, rep: cad[0].toUpperCase() + cad.slice(1), parent, st }));
const byId = (id) => CHORES.find((c) => c.id === id);

const PEOPLE = [['DodgerBlueee', 5, 3], [ME, 4, 2]], RECENT = [['🗑️', 'trash', ME, 'Nov 8, 7:05 PM'], ['💩', 'clear poop', 'DodgerBlueee', 'Nov 7, 9:12 PM'], ['🍽️', 'dishes', 'together', 'Nov 7, 8:40 PM']];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const B = (label, act, arg, cls, more = '') => `<button type="button"${cls ? ` class="${cls}"` : ''} data-act="${act}"${arg != null ? ` data-arg="${arg}"` : ''}${more}>${label}</button>`;
const emo = (e) => `<span class="n-emo" aria-hidden="true">${e}</span>`;
const main = (t, ...lines) => `<span class="n-main"><span class="n-t">${t}</span>${lines.map((l) => `<span class="n-m">${l}</span>`).join('')}</span>`;
const plain = (html) => html.replace('"n-t"', '"n-p"');
const CHEV = '<span class="n-chev" aria-hidden="true">›</span>';
const NAG_KB = [[['✅ Done', 'done'], ['🤝 Done together', 'tog'], ['😴 Snooze…', 'snooze']], [['🗑 Delete chore', 'del']]];
const SNOOZED_KB = [[...NAG_KB[0].slice(0, 2), ['🕐 Change snooze', 'snooze']], [['🙈 Hide', 'hide'], ...NAG_KB[1]]];
const SNOOZE_KB = [[0, 1, 2], [3, 4, 5], [6, 7, 8]].map((r) => r.map((i) => [PRE[i][0], 'z', i])).concat([[['← Back', 'zb']]]);

function setup(root) {
	if (root.dataset.nagReady || !root.querySelector('.nag .n-live')) return;
	root.dataset.nagReady = '1';
	const $ = (q) => root.querySelector(q);
	const nag = $('.nag'), live = $('.n-live'), pinMsg = $('.n-pinmsg'), sheet = $('.n-sheet'), app = $('.n-app'), sleft = $('.n-sleft'), pinBtn = $('.n-pinbtn');
	const chatToast = $('.n-toast'), appToast = $('.n-atoast'), chat = $('.n-chat'), behind = [$('.n-pin'), chat];
	let s, seq = 0, timers = [], preview = [];
	const later = (ms, fn, list = timers) => list.push(setTimeout(fn, ms));
	const fresh = () => ({ st: 'nagging', used: 0, snz: null, tog: 0, msgs: ['board', 'sn', 'card'].map((k) => ({ id: ++seq, k })) });

	const card = () => s.msgs.find((m) => m.k === 'card');
	const lead = ([t, u]) => (u ? '🔔 ' : '') + t.replace('snoozed · ', '😴 ');
	function go(el) { // scroll el into view, with the board's top if it fits, and flash it
		let y = 0;
		for (let n = el; n && n !== chat; n = n.offsetParent) y += n.offsetTop;
		chat.scrollTop = Math.min(y - 8, Math.max(live.offsetTop - 8, y + el.offsetHeight + 8 - chat.clientHeight));
		el.classList.add('is-flash');
	}
	function view(m) { // board = nag-bot's pinned choreListHtml
		if (m.k === 'board') return ['<span class="n-name">Nag-Bot</span>🐾 <b>Chores</b>' + board().map(([c, st]) => `<span class="n-brow">${lead(st)}\n${c.e} <b>${c.t}</b> · <i>${c.cad}</i></span>`).join(''), [[['🐾 Chores', 'open']]]];
		if (m.k === 'nd') return [`↩️ <b>${CH}</b> — not done after all, says ${ME}.`];
		if (m.k === 'back') return [`↩️ Restored <b>${CH}</b>`, [[['✅ OK', 'ok', m.id]]]];
		if (m.k === 'del') return [`🗑️ ${ME} deleted <s>${CH}</s>`, [[['↩️ Undo', 'undo', m.id], ['✅ OK', 'ok', m.id]]]];
		if (s.st === 'done') {
			return [`😻 <s>${CH}</s> — done by ${ME}${s.tog ? ' &amp; DodgerBlueee' : ''} at ${NOW}. Latte purrs approvingly.` +
				`<span class="n-reset${s.glow ? ' is-glow' : ''}">↪️ Resets too: clear poop, shake the litter box</span>`, [[['↩️ Not done', 'nd'], ['✅ OK', 'ok', m.id]]]];
		}
		const keys = m.kb ? SNOOZE_KB : s.snz ? SNOOZED_KB : NAG_KB;
		if (s.snz) return [`😴 <b>${CH}</b>\n${s.snz[2] ? `Postponed by ${ME} — back` : `Snoozed by ${ME} until`} ${s.snz[1]}.`, keys];
		return [`🐱 <b>${CH}</b> — nag #2\nMocha is watching you. Unblinking. 👀`, keys];
	}
	function renderChat() {
		live.innerHTML = s.msgs.map((m) => {
			const n = m.isNew ? ' is-new' : '', t = `<span class="n-time">${m.k === 'board' ? 'edited 7:30 PM' : (m.ed ? 'edited ' : '') + NOW}</span>`;
			m.isNew = 0;
			if (m.k[0] == 's') return `<div class="n-msg n-stk${n}"><img src="${m.k == 'sn' ? 'images/projects/nag-sticker-nag.webp" alt="Sticker: Mocha' : 'images/projects/nag-sticker-done.webp" alt="Sticker: Latte'}" width="120" height="120">${t}</div>`; // literal paths: the build publishes only images it can find
			const [html, keys] = view(m);
			const kb = keys ? `<div class="n-kb">${keys.map((r) => `<div class="n-row">${r.map(([l, a, arg]) => B(l, a, arg, a === 'done' && s.ring ? 'is-ring' : '')).join('')}</div>`).join('')}</div>` : '';
			return `<div class="n-msg${n}"><div class="n-bubble">${html}${t}</div>${kb}</div>`;
		}).join('');
		const [c, st] = board()[0];
		pinMsg.textContent = `🐾 Chores ${lead(st)} ${c.e} ${c.t} · ${c.cad}`;
		live.lastElementChild.classList.add('n-last');
		s.glow = 0;
	}
	function toast(text, el = chatToast) {
		el.textContent = text;
		el.classList.add('is-show');
		clearTimeout(el.t);
		timers.push(el.t = setTimeout(() => el.classList.remove('is-show'), 1400 + text.length * 30));
	}
	const push = (k) => s.msgs.push({ id: ++seq, k, isNew: !reduced() });
	const drop = (id) => { s.msgs = s.msgs.filter((m) => m.id !== +id && m.k !== id); };
	const edit = () => Object.assign(card(), { kb: 0, ed: 1 });
	function complete(tog, app) {
		if (s.st !== 'nagging') return;
		Object.assign(s, { st: 'done', tog, snz: null, glow: !reduced() });
		card() ? edit() : push('card');
		drop('sn');
		push('sd');
		if (!app) toast('Purrs 😻');
		return 1;
	}
	function appDone(tog) {
		if (!complete(tog, 1)) return;
		Object.assign(s, { scr: 'list', chore: null, trail: [] });
		toast(`💩 ${CH} — done · next ${NEXT}`, appToast);
	}
	const act = {
		done: () => complete(0),
		tog: () => complete(1),
		snooze: () => { if (s.used >= MAX) return toast(`😾 No snoozes left (${MAX} used) — time to do it.`); card().kb = 1; },
		zb: () => { card().kb = 0; },
		z: (i) => {
			const p = s.snz = PRE[i], left = MAX - ++s.used;
			edit();
			toast((p[2] ? `Postponed — back ${p[1]} 📅` : `Snoozed until ${p[1]} 😴`) + (left ? ` · ${left} snooze${left > 1 ? 's' : ''} left` : ' · last snooze'));
		},
		hide: () => { drop(card().id); drop('sn'); toast(`Hidden — back ${s.snz[1]} 😴`); },
		nd: () => { Object.assign(s, { st: 'nagging', tog: 0 }); edit(); push('nd'); toast('Taken back ↩️'); },
		ok: drop,
		del: () => { drop(card().id); drop('sn'); s.st = 'deleted'; push('del'); toast('Deleted 🗑 — tap ↩️ Undo in the chat if that was a slip.'); },
		undo: (id) => { Object.assign(s.msgs.find((m) => m.id === +id), { k: 'back', ed: 1 }); s.st = 'back'; toast('Restored 😺'); },
		open: () => sheetOpen(1),
		pin: () => later(0, () => go($('.n-bubble'))),
		close: () => (s.scr === 'chore' ? ([s.scr, s.chore] = s.trail.pop()) : sheetOpen(0)),
		tab: (v) => { s.scr = v; },
		chore: (id) => { s.trail.push([s.scr, s.chore]); Object.assign(s, { scr: 'chore', chore: id }); },
		quick: () => { s.tick = 1; later(380, () => { s.tick = 0; appDone(0); render(); }); },
		adone: () => appDone(0),
		atog: () => appDone(1),
	};

	const alive = (c) => c && (c.id !== 'wash' || s.st !== 'deleted');
	function status(c) { // [text, urgent, board order]
		const after = s.st === 'done';
		if (c.id !== 'wash') return [c.st[after && c.st[1] ? 1 : 0], 0, CHORES.indexOf(c) + after];
		if (after || s.st === 'back') return [NEXT, 0, 9];
		return s.snz ? [`snoozed · ${s.snz[1]}`, 0, s.snz[2] || 0] : ['nagging since 7:30 PM', 1, 0];
	}
	function board() { return CHORES.filter(alive).map((c) => [c, status(c)]).sort((a, b) => a[1][2] - b[1][2]); }
	function list() {
		return `<div class="n-sec">${board().map(([c, [st, urgent]]) => {
			const body = emo(c.e) + main(c.t, st, c.cad + (alive(byId(c.parent)) ? ` · resets with ${byId(c.parent).t}` : '')).replace('"n-m"', urgent ? '"n-m alert"' : '"n-m"');
			if (!urgent) return B(body + CHEV, 'chore', c.id, 'n-r');
			return `<div class="n-r">${B(body, 'chore', c.id, 'n-open')}${B(s.tick ? '✓' : 'Done', 'quick', 0, `n-quick${s.tick ? ' done' : ''}`, ` aria-label="Done: ${c.t}"`)}</div>`;
		}).join('')}</div>`;
	}
	function stats() {
		const now = s.st === 'done', tog = 2 + (now && s.tog);
		const people = PEOPLE.map(([n, c, solo]) => (now && (s.tog || n === ME) ? [n, c + 1, solo + !s.tog] : [n, c, solo])).sort((a, b) => b[1] - a[1]);
		const recent = now ? [['💩', CH, s.tog ? 'together' : ME, `Nov 8, ${NOW}`], ...RECENT] : RECENT;
		const row = (e, inner, n = '') => `<div class="n-r">${emo(e)}${inner}${n !== '' ? `<span class="n-count">${n}</span>` : ''}</div>`;
		return `<div class="n-label">Week of Nov 2 · ${people.reduce((n, p) => n + p[2], tog)} done</div><div class="n-sec">` +
			people.map(([n, c, solo], i) => row(['🥇', '🥈'][i], main(n, [`${solo} solo`, c > solo && `${c - solo} together`, !i && '🔥 3-week reign'].filter(Boolean).join(' · ')), c)).join('') +
			row('🤝', '<span class="n-main">Done together</span>', tog) + '</div><div class="n-note">🪦 1 chore expired with nobody on it</div>' +
			`<div class="n-label">Done</div><div class="n-sec">${recent.map(([e, t, who, when]) => row(e, plain(main(t, `${who} · ${when}`)))).join('')}</div>` +
			'<div class="n-note">Chores count; reminders do not. The week starts on Monday.</div>';
	}
	function chore(c) {
		const [st, urgent] = status(c), fv = (a, b) => `<div class="n-fv">${a}<span>${b}</span></div>`;
		const link = (e, l, a) => B(emo(e) + l, a, null, 'n-r n-link');
		let out = `<div class="n-h">${c.e} ${c.t}</div><div class="n-sub${urgent ? ' alert' : ''}">${st}</div>`;
		if (c.id === 'wash' && s.st === 'nagging') {
			out += `${B('Done', 'adone', null, 'n-primary')}<div class="n-sec">${link('🤝', 'Done together', 'atog')}</div>`;
		}
		const fam = [], walk = (k, d) => { if (alive(k)) fam.push([k, d]); CHORES.filter((x) => x.parent === k.id).forEach((x) => walk(x, d + 1)); };
		if (c.e === '💩') walk(CHORES[0], 0);
		if (fam.length > 1) {
			const mine = fam.find(([k]) => k === c)[1];
			out += '<div class="n-label">Family</div><div class="n-sec">' + fam.map(([k, d]) => {
				const self = k === c, rel = self ? 'this chore' : d < mine ? 'doing it resets this' : 'reset when this is done';
				const body = emo(k.e) + main(k.t, self ? rel : `${status(k)[0]} · ${rel}`), cls = `n-r n-fam${d ? ' nested' : ''}`, d2 = ` style="--d:${d}"`;
				return self ? `<div class="${cls} self"${d2}>${body}</div>` : B(body + CHEV, 'chore', k.id, cls, d2);
			}).join('') + fv(plain(main('Resets with', 'When that one is done')), alive(byId(c.parent)) ? byId(c.parent).t : 'Nothing') + '</div>';
		}
		return `${out}<div class="n-label">Schedule</div><div class="n-sec">${fv('Time', c.at)}${fv('Repeats', c.rep)}${fv('Nag every', '15, 30, 60 min')}</div>`;
	}
	function renderApp() {
		const c = s.scr === 'chore' && byId(s.chore);
		sleft.textContent = c ? '‹ Back' : 'Close';
		app.innerHTML = c ? chore(c) : `<div class="n-tabs"><div class="n-seg" role="group" aria-label="Section">${[['list', 'Chores'], ['stats', 'Stats']].map(([v, l]) =>
			B(l, 'tab', v, s.scr === v ? 'on' : '', ` aria-pressed="${s.scr === v}"`)).join('')}</div><span class="n-plus" aria-hidden="true">+</span></div>${s.scr === 'stats' ? stats() : list()}`;
	}
	function sheetOpen(on) {
		s.open = on;
		clearTimeout(sheet.t);
		behind.forEach((el) => { el.inert = !!on; });
		if (on) {
			Object.assign(s, { scr: 'list', chore: null, trail: [] });
			renderApp();
			sheet.hidden = false;
		} else timers.push(sheet.t = setTimeout(() => { sheet.hidden = true; }, reduced() ? 0 : 330));
		nag.classList.toggle('is-open', !!on);
		(on ? sleft : pinBtn).focus({ preventScroll: true });
	}

	const render = () => { renderChat(); if (s.open) renderApp(); };
	root.addEventListener('click', (e) => {
		const b = e.target.closest('[data-act]');
		if (!b) return;
		const was = s.scr + s.chore, key = b.dataset.act + b.dataset.arg;
		act[b.dataset.act](b.dataset.arg);
		render();
		if (s.open && was !== s.scr + s.chore) { app.scrollTop = 0; sleft.focus({ preventScroll: true }); }

		if (!root.contains(document.activeElement)) {
			const same = [...root.querySelectorAll('[data-act]')].find((x) => x.dataset.act + x.dataset.arg === key && x.offsetParent);
			(same || (s.open ? sleft : [...live.querySelectorAll('button')].pop()) || pinBtn).focus({ preventScroll: true });
		}
	});
	root.addEventListener('keydown', (e) => {
		if (!s.open) return;
		if (e.key === 'Escape') sheetOpen(0);
		const bs = [...sheet.querySelectorAll('button')].filter((b) => b.offsetParent), [a, z] = e.shiftKey ? [bs[0], bs.pop()] : [bs.pop(), bs[0]];
		if (e.key === 'Tab' && document.activeElement === a) { e.preventDefault(); z.focus(); }
	});

	root.addEventListener('demo:stop', () => {
		preview.forEach(clearTimeout);
		preview = [];
		if (s.ring) { s.ring = 0; renderChat(); }
	});
	root.addEventListener('demo:visible', () => {
		if (reduced()) return;
		later(250, () => { s.msgs.slice(1).forEach((m) => { m.isNew = 1; }); renderChat(); }, preview);
		later(600, () => { s.ring = 1; renderChat(); }, preview);
		later(1450, () => { const d = $('.is-ring'); if (d) d.classList.add('is-press'); }, preview);
		later(1700, () => { s.ring = 0; complete(0); renderChat(); }, preview);
		later(4200, () => go([...live.querySelectorAll('.n-brow')].pop()), preview);
	});
	root.addEventListener('demo:reset', () => {
		timers.concat(preview).forEach(clearTimeout);
		timers = [];
		preview = [];
		[chatToast, appToast].forEach((el) => el.classList.remove('is-show'));
		nag.classList.remove('is-open');
		sheet.hidden = true;
		behind.forEach((el) => { el.inert = false; });
		s = fresh();
		render();
		chat.scrollTop = 0;
	});

	s = fresh();
	renderChat();
}

const init = () => projectsDemo('.app-demo--nag', setup);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();


/* Finance tracker demo: the owner's phone tabs (finance_tracker app/index.html) in the app's words. Data invented. */
(() => {
const NW = [177760, 179160, 180480, 179640, 182320, 184120, 185560, 184480, 187480, 191900, 192520, 194480];
const MONTHS = NW.map((_, i) => 'Nov Dec Jan Feb Mar Apr May Jun Jul Aug Sep Oct'.split(' ')[i] + (i < 2 ? ' 2025' : ' 2026'));
const LO = Math.min(...NW), Y = v => 52 - (v - LO) / (Math.max(...NW) - LO) * 46;
const F = [0, 2].map(d => new Intl.NumberFormat('en-SG', { minimumFractionDigits: d, maximumFractionDigits: d }));

/* Amounts are written "S$1,234"; M gives each the markup Hide amounts masks. */
const money = (n, d, sign) => (sign ? '+' : '') + 'S$' + F[d ? 1 : 0].format(n);
const M = h => h.replace(/S\$([\d,.]*\d)/g, '<span class="f-m">S$<span class="f-d">$1</span></span>');
const icon = (id, c = '') => `<svg class="f-ic ${c}" aria-hidden="true"><use href="#fi-${id}"/></svg>`;
const rows = s => s.split(';').map(r => r.split('|'));

const CATS = [
	['food', 'Food &amp; dining', 288, 'Watami 30 74.56|Starbucks 22 18.4|Ya Kun 18 5.04|McDonald’s 11 32.8|Watami 4 100'],
	['transport', 'Transport', 104, 'SimplyGo 31 24.96|Grab 24 11.44|TADA 19 7.6|Grab 16 8.8|SimplyGo 8 23.2|Grab 3 8'],
	['travel', 'Travel', 180, 'Trip.com 27 164.8|KKday 27 67.2|Klook 14 16'],
	['delivery', 'Grab + Foodpanda', 224, 'GrabFood 29 67.32|Foodpanda 23 37.08|GrabFood 15 56.6|GrabFood 9 25.92|Foodpanda 2 29.08'],
	['games', 'Games', 120, 'Steam 26 47.92|HoYoverse 20 18.48|Kuro Games 13 35.2|Steam 5 50.4'],
	['flag', 'Possible card testing', 0, 'G2G 27 4.9|Xsolla 27 12.3|ZeusX 27 19.5']
].map(([k, n, t, s]) => {
	const c = { k, n, t }, tx = c.tx = s.split('|').map(r => { const p = r.split(' '), amt = +p.pop(), day = +p.pop(); return { who: p.join(' '), day, amt, c }; });
	const v = c.v = Math.round(c.x = tx.reduce((a, r) => a + r.amt, 0)), pc = Math.round((v - t) / t * 100);
	c.tone = Math.abs(pc) < 5 ? '' : pc > 0 ? 'f-bad' : 'f-good';
	c.vs = (Math.abs(pc) < 5 ? 'in line with' : (pc > 0 ? '+' : '−') + Math.abs(pc) + '% vs') + ' typical ' + money(t);
	return c;
});
const FLAG = CATS.pop();
FLAG.tone = 'f-bad';
FLAG.vs = '3 small charges (S$20.00 or less each) on one day from 3 merchants never seen before, S$36.70 in total';
const TOTAL = CATS.reduce((a, c) => a + c.v, 0);
const ALL = CATS.concat(FLAG).flatMap(c => c.tx).sort((a, b) => b.day - a.day);
/* Per person: premiums, cash %, policies, past, shortfall; cover needed and in force (S$k) for death, TPD, CI. */
const INS = [[1296, 58, 4, '1 past', 'S$60k on critical illness', 240, 260, 240, 260, 120, 60], [872, 71, 3, 'none past', 'S$40k on death and S$40k on TPD', 160, 120, 160, 120, 100, 100]];
/* Home register; state 1 needs info, 2 covered, 3 no active cover. */
const HOME = rows('FortyTwo sofa|1|Cost to confirm|;Hitachi fridge|2|Ends 2 Feb 2027|S$860;Daikin aircon|2|Ends 14 Mar 2028|S$1,712;Rinnai hob|2|Ends 20 Jun 2029|S$344;Bosch washer|3|Expired · 9 Aug 2026|S$476');

const row = (attrs, cls, ico, title, sub, end, tag = 'button') => `<${tag} class="f-row ${cls}" ${attrs}><span class="f-ico">${icon(ico)}</span><span class="f-rt"><span>${title}</span><span>${sub}</span></span>${end}${tag < 'c' ? icon('right', 'f-chev') : ''}</${tag}>`;
const info = (ico, title, sub, end) => row('', '', ico, title, sub, `<span class="f-rv">${end}</span>`, 'div');
const LOGO = 'Grab Foodpanda Klook Steam SimplyGo Ya Trip FortyTwo Hitachi Daikin Rinnai Bosch Watami Starbucks McDonald TADA KKday HoYoverse Kuro G2G Xsolla ZeusX'.split(' ');
const line = (cls, who, sub, end, tag = 'div') => `<${tag} class="f-tr ${cls}"><span class="f-ini" style="--h:${[...who].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7)};--i:${LOGO.findIndex(n => who.startsWith(n))}" aria-hidden="true">${who[0]}</span><span class="f-tn"><span>${who}</span><span>${sub}</span></span><span class="f-ta">${end}</span></${tag.slice(0, 6)}>`;
const txs = list => `<div>${list.map((r, i) =>
	(i && list[i - 1].day === r.day ? '' : `<div class="f-day">${'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[new Date(2026, 9, r.day).getDay()]} ${r.day} Oct</div>`) +
	line('c-' + r.c.k, r.who, r.c === FLAG ? 'New merchant' : r.c.n, '−' + money(r.amt, 2), r.c === FLAG ? 'button data-act="risk"' : 'div')).join('')}</div>`;
const T = t => `<div class="f-title">${t}</div>`;
const seg = (names, on, c = 'f-seg', b = 0) => `<div class="${c}">${names.map((n, i) => `<button data-sub="${i + b}" aria-pressed="${i + b === on}">${n}</button>`).join('')}</div>`;
const tiles = t => `<div class="f-stats">${t.map(([l, v, s = '']) => `<span>${l}<b>${v}</b><small>${s}</small></span>`).join('')}</div>`;
const card = (lbl, fig, note) => `<div class="f-card"><span class="f-lbl">${lbl}</span><span class="f-fig">${fig}</span><span class="f-note">${note}</span></div>`;
const hero = () => {
	const line = NW.map((v, i) => (i ? 'L' : 'M') + (i * 300 / 11).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
	return `<div class="f-worth"><span class="f-lbl">Net worth</span><span class="f-fig">${money(NW[11])}</span>
<span class="f-chg"><span class="f-pill">${money(NW[11] - NW[9], 0, 1)} since your visit on 14 Aug</span><span>${money(NW[11] - NW[0], 0, 1)} <span class="f-good">(+${((NW[11] - NW[0]) / NW[0] * 100).toFixed(1)}%)</span> since 8 ${MONTHS[0]}</span></span>
<div class="f-spark" tabindex="0" role="slider" aria-label="Net worth by month" aria-valuemin="0" aria-valuemax="11">
<svg viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true"><path d="${line}L300 56L0 56Z"/><path d="${line}"/><line y1="0" y2="56"/></svg></div>
<span class="f-axis"><span>${MONTHS[0]}</span><span>${MONTHS[11]}</span></span></div>`;
};
const PAGES = {
	overview: () => T('Overview') + `
<div class="f-ok">${icon('ok')}186 rows checked against their statements</div>${hero()}
<div class="f-list">${row('data-cat="flag"', 'is-bad', 'flag', 'Needs attention', 'Possible card testing', '<span class="f-badge">1</span>')}
${row('data-tab="spending"', '', 'spending', 'Key spending', 'Oct 2026 against typical', `<span class="f-rv">${money(TOTAL)}</span>`)}</div>
<div class="f-card f-pv"><span class="f-lbl">Last 3 statements · Aug–Oct 2026</span>${tiles([['Income', 'S$9,840'], ['Spent on cards', 'S$3,816'], ['Invested', 'S$2,400']])}
<span class="f-note">Card spending S$1,272 a month, <span class="f-good">6% lower</span> than the three statements before.</span></div>`,
	/* The eye hides all of Wealth, as privacy.js hides #pane-wealth. */
	wealth: s => T('Wealth') + seg(['Income', 'Net worth', 'Investments'], s) + `<div class="f-page f-pv">${[
		`<div class="f-card"><span class="f-lbl">Income outlook · salary credits through Oct 2026</span>${tiles([['2026 take-home pay so far', 'S$28,560', '+4.2% vs same period 2025'], ['2026 take-home forecast', 'S$34,760', 'S$32,240 floor']])}</div>
<div class="f-card"><span class="f-lbl">Long-range forecast · 5% midpoint</span>${tiles([3, 5, 10].map(y => [y + ' years', money(34760 * 1.05 ** y), 'in ' + (2026 + y)]))}</div>`,
		hero() + `<div class="f-list">${info('up', 'Assets', 'Cash, CPF, investments, property', 'S$324,960')}${info('statements', 'Liabilities', 'Home loan', 'S$130,480')}</div>`,
		card('Portfolio · 2 accounts', 'S$51,360', '<span class="f-pill">+S$3,940 (+8.3%)</span> past year') +
		`<div class="f-list">${info('wallet', 'Interactive Brokers', 'statements to 31 Oct 2026 · <span class="f-good">✓ numbers tally</span>', '+S$3,648')}${info('wallet', 'SRS', 'Phillip Securities (POEMS) · statement to 31 Oct 2026', '+S$292')}</div>`
	][s]}</div>`,
	insurance: s => {
		const [p, cash, n, past, short, ...g] = INS[s], gap = i => g[i * 2] - g[i * 2 + 1];
		return T('Insurance') + seg(['Nicholas', 'Alex'], s) + `<div class="f-why">Cover short ${short}</div>
${tiles([['Total premiums', money(p), `${cash}% cash · ${100 - cash}% CPF`], ['Active policies', n, past]])}<div class="f-card"><span class="f-lbl">Where the cover falls short</span>${['Death', 'TPD', 'Critical illness'].map((b, i) => `<div class="f-gap">${b}<span class="f-${gap(i) > 0 ? 'bad">Short S$' + gap(i) + ',000' : 'good">Covered'}</span><i style="--w:${Math.min(100, g[i * 2 + 1] / g[i * 2] * 100)}%"></i></div>`).join('')}</div>`;
	},
	home: s => T('Home') + card('Your home · 5 items', 'S$3,392', 'Recorded home costs · 4 priced · 1 unpriced') +
		seg(['Needs info', 'Covered', 'No active cover'].map((n, i) => `${n}<b><i class="k${i + 1}"></i>${HOME.filter(h => h[1] == i + 1).length}</b>`), s, 'f-chips', 1) + `<div>${HOME.filter(h => !s || h[1] == s).map(([n, k, w, v]) => line('k' + k, n, w, v)).join('')}</div>`,
	activity: s => T('Activity') + seg(['Transactions', 'Games'], s) + `<div class="f-cnt">${s ? '4 purchases' : ALL.length + ' card transactions'}<b>${money(s ? CATS[4].v : TOTAL + FLAG.x)} spent</b></div>${txs(s ? CATS[4].tx : ALL)}`,
	spending: () => `<div class="f-title">Key spending</div><div class="f-hint">Oct 2026 (bar) against your typical statement (tick). Tap one for its charges.</div>
<div class="f-list">${CATS.map(c => `<button class="f-row f-key c-${c.k}" data-cat="${c.k}"><span class="f-ico">${icon(c.k)}</span><span class="f-kn">${c.n}</span><span class="f-rv">${money(c.v)}</span>${icon('right', 'f-chev')}<span class="f-kd ${c.tone}">${c.vs}</span><span class="f-kb" aria-hidden="true"><i style="width:${c.v / 3.6}%"></i><b style="left:${c.t / 3.6}%"></b></span></button>`).join('')}</div>`,
	cat: c => `<div class="f-title">${c.n}</div><div class="f-sum">${money(c.x, 2)}</div><div class="f-hint ${c === FLAG ? 'f-bad' : ''}">${c === FLAG ? 'Tue 27 Oct · tap a charge for its check' : `${c.tx.length} charges in Oct 2026 · <span class="${c.tone}">${c.vs}</span>`}</div>${txs(c.tx)}`
};

function init(root) {
	const fd = root.querySelector('.fd');
	if (!fd || fd.dataset.ready) return;
	fd.dataset.ready = 1;
	const $ = s => fd.querySelector(s);
	const scroll = $('.f-scroll'), wrap = $('.f-sheet-wrap'), sheet = $('.f-sheet'), finger = $('.f-finger'), eye = $('[data-act="eye"]');
	const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
	let tab, cat, sub, opener, savedTop = 0, timers = [], raf = 0, playing = false, touched = false, scrub;

	function render(push) {
		const c = cat && CATS.concat(FLAG).find(x => x.k === cat);
		$('.f-top').hidden = !!c; $('.f-bar').hidden = !c && tab !== 'spending';
		$('.f-back span').textContent = c && c !== FLAG ? 'Key spending' : 'Overview';
		scroll.innerHTML = M(`<div class="f-page${push && !still() ? ' is-push' : ''}">${c ? PAGES.cat(c) : PAGES[tab](sub[tab] ?? +(tab === 'wealth'))}</div>`);
		fd.querySelectorAll('.f-tab').forEach(t => t.setAttribute('aria-pressed', t.dataset.tab === (tab === 'spending' ? 'overview' : tab)));
		scrub = $('.f-spark') && bindScrub();
	}
	function go(t) { tab = t; cat = null; render(); scroll.scrollTop = 0; }

	function bindScrub() {
		const worth = $('.f-worth'), spark = $('.f-spark'), fig = $('.f-fig'), axis = $('.f-axis'), mk = $('line');
		const rest = [fig.innerHTML, axis.innerHTML];
		let idx = 11, down = false;
		const at = i => {
			idx = Math.max(0, Math.min(11, i));
			const x = idx * 300 / 11;
			mk.setAttribute('x1', x); mk.setAttribute('x2', x);
			worth.classList.add('is-scrub');
			fig.innerHTML = M(money(NW[idx]));
			axis.innerHTML = `<span class="f-at">${MONTHS[idx]}</span>`;
			aria(idx);
		};
		const aria = i => { spark.setAttribute('aria-valuenow', i); spark.setAttribute('aria-valuetext', MONTHS[i] + ', ' + money(NW[i])); };
		const end = () => { down = false; idx = 11; worth.classList.remove('is-scrub'); fig.innerHTML = rest[0]; axis.innerHTML = rest[1]; aria(11); };
		const fromX = x => { const b = spark.getBoundingClientRect(); at(Math.round(Math.min(1, Math.max(0, (x - b.left) / b.width)) * 11)); };
		spark.addEventListener('pointerdown', e => { down = true; try { spark.setPointerCapture(e.pointerId); } catch (_) {} fromX(e.clientX); });
		spark.addEventListener('pointermove', e => { if (down) fromX(e.clientX); });
		['pointerup', 'pointercancel'].forEach(t => spark.addEventListener(t, () => { if (down) end(); }));
		spark.addEventListener('keydown', e => {
			const k = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
			if (k) { e.preventDefault(); at((worth.classList.contains('is-scrub') ? idx : 11) + k); } else if (e.key === 'Escape') end();
		});
		spark.addEventListener('blur', end);
		end();
		return { at, end };
	}

	/* The check drawer as the app words it; a paired phone is a read-only copy. */
	function openSheet(user) {
		opener = user;
		sheet.innerHTML = `<div class="f-sh"><span><b>Medium priority check</b><span class="f-hint">Tue 27 Oct · 3 charges</span></span><button class="f-done" data-act="close">Done</button></div>
<p class="f-why">${FLAG.vs}</p><p class="f-hint">Refunds are netted before this check. This is an anomaly, not a fraud verdict.</p>
<button class="f-rec" disabled>I recognize this</button><div class="f-res is-no" role="status"><b>Read-only copy</b>Open Finances on the computer to save this.</div>`;
		if (user) sheet.setAttribute('aria-modal', 'true'); else sheet.removeAttribute('aria-modal');
		wrap.hidden = false;
		if (user) $('.f-done').focus();
	}
	function closeSheet() {
		if (wrap.hidden) return;
		wrap.hidden = true; sheet.innerHTML = '';
		if (opener) opener.focus({ preventScroll: true });
		opener = null;
	}

	fd.addEventListener('click', e => {
		const t = e.target.closest('[data-act],[data-tab],[data-cat],[data-sub]');
		if (!t) return;
		const a = t.dataset.act;
		if (a === 'eye') {
			const on = fd.classList.toggle('is-masked');
			eye.setAttribute('aria-pressed', on);
			eye.setAttribute('aria-label', on ? 'Show amounts' : 'Hide amounts');
			eye.firstChild.firstChild.setAttribute('href', on ? '#fi-eye-off' : '#fi-eye');
		} else if (a === 'back') {
			const k = cat; cat = null; if (!k || k === 'flag') go('overview'); else render(); scroll.scrollTop = savedTop;
			const backTo = k ? $(`[data-cat="${k}"]`) : $('[data-tab="spending"]'); if (backTo) backTo.focus({ preventScroll: true });
		} else if (a === 'close') closeSheet();
		else if (a === 'risk') openSheet(t);
		else if (t.dataset.tab) { go(t.dataset.tab); const target = $(`.f-tab[data-tab="${tab === 'spending' ? 'overview' : tab}"]`); if (target) target.focus({ preventScroll: true }); }
		else if (t.dataset.sub) { const i = +t.dataset.sub; sub[tab] = sub[tab] === i ? null : i; render(); $(`[data-sub="${i}"]`).focus(); }
		else { savedTop = scroll.scrollTop; cat = t.dataset.cat; render(1); scroll.scrollTop = 0; $('.f-back').focus(); }
	});
	fd.addEventListener('keydown', e => {
		if (!wrap.hidden && (e.key === 'Escape' || (e.key === 'Tab' && opener))) { e.preventDefault(); if (e.key === 'Tab') $('.f-done').focus(); else closeSheet(); }
		else if (e.key === 'Escape' && cat) $('.f-back').click();
	});

	const later = (ms, fn) => timers.push(setTimeout(fn, ms)), fc = (c, on) => finger.classList.toggle(c, on);
	const place = (el, fx) => {
		const r = fd.getBoundingClientRect(), b = el.getBoundingClientRect(), k = fd.offsetWidth / r.width || 1;
		finger.style.setProperty('--finger-x', (b.left - r.left + b.width * fx) * k + 'px');
		finger.style.setProperty('--finger-y', (b.top - r.top + b.height / 2) * k + 'px');
	};
	const sweep = (from, to, ms, done) => {
		const t0 = performance.now();
		fc('is-drag', 1);
		const step = now => {
			const p = Math.min(1, (now - t0) / ms), x = from + (to - from) * (p < .5 ? 2 * p * p : 1 - (2 - 2 * p) ** 2 / 2);
			place($('.f-spark'), x / 11);
			scrub.at(Math.round(x));
			if (p < 1) raf = requestAnimationFrame(step); else { fc('is-drag', 0); done(); }
		};
		raf = requestAnimationFrame(step);
	};
	const tap = (sel, ms, fn) => {
		later(ms, () => place($(sel), .5));
		later(ms + 550, () => fc('is-down', 1));
		later(ms + 700, () => { fc('is-down', 0); fn(); });
	};
	function play() {
		if (playing || touched || still()) return;
		playing = true;
		later(250, () => { place($('.f-spark'), 1); fc('is-on', 1); });
		later(650, () => {
			fc('is-down', 1);
			sweep(11, 3, 1500, () => sweep(3, 7, 650, () => {
				later(250, () => { fc('is-down', 0); scrub.end(); });
				tap('[data-cat="flag"]', 350, () => { cat = 'flag'; render(1); });
				tap('[data-act="risk"]', 1600, () => { openSheet(); fc('is-on', 0); });
				later(5600, () => { closeSheet(); playing = false; });
			}));
		});
	}
	function stop() {
		touched = true;
		if (!playing) return;
		playing = false;
		timers.forEach(clearTimeout); timers = [];
		cancelAnimationFrame(raf);
		finger.className = 'f-finger';
		if (scrub) scrub.end();
	}
	root.addEventListener('demo:stop', stop);

	function reset() {
		playing = true; stop(); touched = false;
		opener = null; closeSheet();
		if (fd.classList.contains('is-masked')) eye.click();
		sub = {}; go('overview');
	}
	root.addEventListener('demo:visible', play);
	root.addEventListener('demo:reset', reset);
	reset();
}

const boot = () => projectsDemo('.app-demo--finance', init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


/* Travel Packing demo: sample items and rules from data/seed.json; quantities by the app's computeQty. */
(() => {

const CATS = [
	['Clothes', '#B2452C', '#9E3B24', '178,69,44', [
		['Basics', [['Underwear', 'hanger', [1, 1, 3, 8]], ['Sleep Shirt', 'shirt', [0.5, 1, 2, 4]], ['Shorts', 'hanger', [0.5, 0, 2, 4]]]],
		['Casual', [['Shirts', 'shirt', [0.6, 0, 2, 6]], ['Polo Shirts', 'shirt', [0.6, 1, 2, 5], 'One worn on the day'],
			['Pants', 'hanger', [0.5, 1, 2, 4], 'One worn on the day'], ['Socks', 'sock', [0.8, 0, 3, 7]], ['Thick Socks', 'sock', [0.5, 0, 2, 4], '', 'x']]],
		['Footwear', [['Sports Shoes', 'shoe', 1], ['Slippers', 'shoe', 1], ['Boots', 'shoe', 1, 'Thick shoes for cold trips', 'x']]]]],
	['Basics', '#0F6E6B', '#0C5F5C', '15,110,107', [
		['Backpack', [['Earpiece', 'headphones', 1], ['Portable Charger', 'battery-charging', 2, 'Plus one wire each', 'e'], ['eSIM', 'device-mobile', 1, 'Buy and install before flying', 'e']]],
		['Funds', [['Wallet', 'wallet', 1, '', 'e'], ['Debit/Credit Cards', 'credit-card', 1, '', 'e'], ['Travel Adaptor', 'plug', 1, '', 'e']]],
		['Travel Info', [['Passport', 'id', 1, '', 'e'], ['Travel Confirmations', 'file-check', 1, '', 'e']]]]],
	['Hygiene', '#2E5FA6', '#27508F', '46,95,166', [
		['Dental', [['Toothbrush', 'dental', 1], ['Toothpaste', 'dental', 1]]], ['Others', [['Retainer', 'dental', 1, '', 'e']]]]],
];
CATS.sort((a,b) => ['Basics','Hygiene','Clothes'].indexOf(a[0]) - ['Basics','Hygiene','Clothes'].indexOf(b[0]));
const ITEMS = CATS.flatMap(([cat, , , , groups]) => groups.flatMap(([group, list]) => list.map(([name, icon, rule, note, f = '']) =>
	({ id: name.toLowerCase().replace(/\W+/g, '-'), name, icon, rule, note, cat, group, ess: f.includes('e'), ext: f.includes('x') }))));
const qtyFor = (r, nights) => r.length ? Math.max(r[2], Math.min(r[3], Math.ceil(nights * r[0]) + r[1])) : r;
const svg = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#pk-${id}"/></svg>`;
const count = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function init(root) {
	if (root.dataset.pkReady || !root.querySelector('.pk .pk-cubes')) return;
	root.dataset.pkReady = 1;
	/* Pass dates N days out. */
	root.querySelectorAll('[data-day]').forEach(e => e.textContent = new Date(Date.now() + e.dataset.day * 864e5).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
	const $ = s => root.querySelector(s), cubes = $('.pk-cubes'), tap = $('.pk-tap'), scroller = $('.pk-scroll');
	const box = id => cubes.querySelector(`[data-id="${id}"] input`);
	let S, timers = [], previewing = false, touched = false;
	/* A trip under way, so the per-category counts and bars say something. */
	const PRE = Object.fromEntries('earpiece wallet debit-credit-cards toothbrush toothpaste shorts slippers'.split(' ').map(k => [k, true]));
	const fresh = () => ({ key: 'normal', hide: false, last: false, folded: new Set(), normal: { nights: 4, ...PRE }, extended: { nights: 7 } });
	const items = (L = S[S.key]) => ITEMS.filter(i => S.key === 'extended' || !i.ext)
		.map(i => ({ ...i, packed: !!L[i.id], qty: L[i.id + '#'] || qtyFor(i.rule, L.nights) }));
	const shown = i => (!S.last || (i.ess && !i.packed)) && (!S.hide || !i.packed);
	const later = (fn, ms, keep) => { const t = setTimeout(() => { timers = timers.filter(x => x.t !== t); fn(); }, ms); timers.push({ t, keep }); };
	const stop = all => { timers = timers.filter(x => !all && x.keep || clearTimeout(x.t)); };

	const row = i => `<div class="pk-item${i.packed ? ' packed' : ''}${i.qty === 1 ? ' one' : ''}" data-id="${i.id}">
<label class="pk-check"><input type="checkbox"${i.packed ? ' checked' : ''} aria-label="${i.name}${i.ess ? ', essential' : ''}"></label>${svg('t-' + i.icon, 'pk-ti')}
<div class="pk-label"><div class="pk-name"><span>${i.name}</span>${i.ess ? svg('tag') : ''}</div>${i.note ? `<div class="pk-sub">${i.note}</div>` : ''}</div>
<div class="pk-qty"><button type="button" data-act="qty" data-d="-1" aria-label="Fewer ${i.name}">${svg('minus')}</button><output>${i.qty}</output><button type="button" data-act="qty" data-d="1" aria-label="More ${i.name}">${svg('plus')}</button></div></div>`;

	function render() {
		const all = items();
		root.querySelectorAll('.pk-tab').forEach(t => t.setAttribute('aria-pressed', t.dataset.key === S.key));
		root.dataset.key = S.key;
		$('[data-act=hide]').setAttribute('aria-pressed', S.hide);
		$('.pk-lc').setAttribute('aria-pressed', S.last);
		cubes.innerHTML = CATS.map(([cat, head, ink, rgb, groups]) => {
			const ci = all.filter(i => i.cat === cat), open = !S.folded.has(cat);
			if (S.last && !ci.some(shown)) return '';
			return `<div class="pk-cube${open ? '' : ' collapsed'}" data-cat="${cat}" style="--c-head:${head};--c-ink:${ink};--c-soft:rgba(${rgb},.16)">
<div class="pk-chead-wrap"><button class="pk-chead" type="button" data-act="fold" aria-expanded="${open}"><span class="pk-cname">${cat}</span>
<span class="pk-count"><span class="pk-num"></span>${svg('check', 'pk-tick')}${svg('chevron', 'pk-chev')}</span><span class="pk-cbar"></span></button></div>
<div class="pk-cbody"><div class="pk-cinner">${groups.map(([g]) => {
				const gs = ci.filter(i => i.group === g && shown(i));
				return gs.length ? `<div class="pk-group" data-group="${g}"><div class="pk-ghead"><span class="pk-gname">${g}</span><span class="pk-gcount"></span></div>${
					[...gs.filter(i => !i.packed), ...gs.filter(i => i.packed)].map(row).join('')}</div>` : '';
			}).join('')}</div></div></div>`;
		}).join('');
		refresh();
	}

	function refresh() {
		const all = items(), n = all.filter(i => i.packed).length, pct = Math.round(n / all.length * 100);
		const left = all.filter(i => i.ess && !i.packed).length, bar = $('.pk-bar'), note = $('.pk-note');
		const nightsLabel=count(S[S.key].nights, 'night').replace(/^\d+/, '<b>$&</b>');
		if ($('.pk-nlabel').innerHTML !== nightsLabel) $('.pk-nlabel').innerHTML=nightsLabel;
		$('.pk-plabel').innerHTML = `<b>${n}</b> of ${all.length} packed`;
		bar.style.setProperty('--fill', pct + '%');
		bar.setAttribute('aria-valuenow', pct);
		$('.pk-lc use').setAttribute('href', left ? '#pk-alert' : '#pk-check');
		$('.pk-lcn').textContent = left ? left + ' left' : 'Clear';
		note.className = `pk-note${S.last ? ' on' : ''}${left ? '' : ' clear'}`;
		note.innerHTML = S.last ? svg(left ? 'alert' : 'check') + (left ? `<div><b>${count(left, 'essential')} still to pack</b>Only unpacked essentials are shown.</div>`
			: '<div><b>Every essential is packed</b>Your last-call check is clear.</div>') + '<button type="button" data-act="last">Show everything</button>' : '';
		cubes.querySelectorAll('.pk-cube').forEach(cube => {
			const ci = all.filter(i => i.cat === cube.dataset.cat), p = ci.filter(i => i.packed).length;
			cube.classList.toggle('done', p === ci.length);
			cube.querySelector('.pk-num').textContent = p === ci.length ? 'Packed' : `${p} of ${ci.length}`;
			cube.querySelector('.pk-cbar').style.setProperty('--fill', p / ci.length * 100 + '%');
			cube.querySelectorAll('.pk-group').forEach(g => {
				const gi = ci.filter(i => i.group === g.dataset.group);
				g.querySelector('.pk-gcount').textContent = gi.filter(i => i.packed).length + '/' + gi.length;
			});
		});
	}

	function tick(el, packed) {
		const id = el.dataset.id, leaving = packed && (S.hide || S.last);
		S[S.key][id] = packed;
		el.classList.toggle('packed', packed);
		el.classList.toggle('leaving', leaving);
		refresh();
		later(() => {
			const focused = el.contains(document.activeElement), top = scroller.scrollTop;
			const next = [...cubes.querySelectorAll('.pk-item:not(.leaving)')].find(r => el.compareDocumentPosition(r) & 4);
			render();
			scroller.scrollTop = top;
			if (focused) (leaving ? next ? box(next.dataset.id) : $('.pk-lc') : box(id)).focus({ preventScroll: true });
		}, leaving ? 300 : 260, true);
	}

	function nights(d) {
		const L = S[S.key], before = items();
		L.nights = Math.max(1, Math.min(120, L.nights + d));
		items().forEach((i, k) => {
			const out = cubes.querySelector(`[data-id="${i.id}"] output`);
			if (!out || i.qty === before[k].qty) return;
			out.textContent = i.qty;
			out.classList.remove('pk-bump'); void out.offsetWidth; out.classList.add('pk-bump');
		});
		refresh();
		$('.pk-nlabel b').classList.add('pk-pop');
	}

	root.addEventListener('click', e => {
		const el = e.target.closest('[data-act], .pk-label, .pk-ti'), act = el && el.dataset.act;
		if (!el) return;
		if (!act) el.parentNode.querySelector('input').click();
		else if (act === 'list' && S.key !== el.dataset.key) { S.key = el.dataset.key; render(); scroller.scrollTop = 0; }
		else if (act === 'nights') nights(+el.dataset.d);
		else if (act === 'hide') { S.hide = !S.hide; render(); }
		else if (act === 'last') { S.last = !S.last; render(); if (el.closest('.pk-note')) $('.pk-lc').focus(); }
		else if (act === 'fold') {
			const cube = el.closest('.pk-cube'), cat = cube.dataset.cat, open = S.folded.delete(cat);
			if (!open) S.folded.add(cat);
			cube.classList.toggle('collapsed', !open);
			el.setAttribute('aria-expanded', open);
		} else if (act === 'qty') {
			const id = el.closest('.pk-item').dataset.id, it = items().find(i => i.id === id);
			const q = el.parentNode.querySelector('output').textContent = S[S.key][id + '#'] = Math.max(1, Math.min(99, it.qty + +el.dataset.d));
			el.closest('.pk-item').classList.toggle('one', q === 1);
		}
	});
	root.addEventListener('change', e => tick(e.target.closest('.pk-item'), e.target.checked));
	root.addEventListener('animationend', e => e.target.classList.remove('pk-pop', 'pk-bump'));

	root.addEventListener('demo:stop', e => {
		touched = true;
		if (previewing) { previewing = false; stop(); tap.className = 'pk-tap'; }
	});
	function moveTap(el, jump) {
		const r = el.getBoundingClientRect(), p = root.getBoundingClientRect(), k = root.offsetWidth / p.width;
		tap.style.transition = jump ? 'none' : '';
		tap.style.translate = `${(r.left + r.width / 2 - p.left) * k}px ${(r.top + r.height / 2 - p.top) * k}px`;
	}
	function preview() {
		if (previewing || touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		previewing = true;
		const plus = () => $('[data-act=nights][data-d="1"]'), head = c => () => $(`[data-cat="${c}"] .pk-chead`), to = (top, at) => later(() => scroller.scrollTo({ top, behavior: 'smooth' }), at);
		moveTap(head('Basics')(), true);
		later(() => tap.classList.add('on'), 60);
		[[head('Basics'), 450], [head('Hygiene'), 900], [plus, 2050], [plus, 2600], [head('Basics'), 3300], [() => $('.pk-lc'), 4000], [() => box('esim'), 5150], [() => $('.pk-note [data-act=last]'), 5850]].forEach(([get, at], k) => {
			if (k) later(() => moveTap(get()), at - 420);
			later(() => { tap.classList.remove('press'); void tap.offsetWidth; tap.classList.add('press'); get().click(); }, at);
		});
		/* The list follows the taps: the stepper with Clothes under it, Last call's note with the essentials, then back to the top. */
		to(112, 950); to(222, 4050); to(0, 5900);
		later(() => tap.classList.remove('on'), 6050);
		later(() => { previewing = false; tap.className = 'pk-tap'; }, 6350);
	}

	root.addEventListener('demo:visible', () => later(preview, 250));
	root.addEventListener('demo:reset', () => {
		previewing = false;
		touched = false;
		stop(true);
		root.classList.add('pk-instant');
		tap.className = 'pk-tap';
		S = fresh();
		render();
		scroller.scrollTop = 0;
		requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('pk-instant')));
	});
	S = fresh();
	render();
}

const start = () => { projectsDemo('.app-demo--packing', init); if (innerWidth > 1099) new Set([...document.querySelectorAll('[data-script]')].map(f => f.dataset.script)).forEach(src => document.head.append(Object.assign(document.createElement('script'), { src }))); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


/* Desktop shows one project at a time; the rail's thumbnails (recorded from each demo) switch them. */
(() => {
	const rail = document.querySelector('.app-rail');
	if (!rail) return;
	const tabs = [...rail.children], wide = matchMedia('(min-width: 981px)'), still = matchMedia('(prefers-reduced-motion: reduce)');
	const cards = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
	const at = () => cards.findIndex(c => '#' + c.id === location.hash);
	let cur = Math.max(0, at());
	function show(i, focus) {
		if (i !== cur) rail.classList.add('is-turn');
		cur = i;
		tabs.forEach((t, k) => {
			const v = t.querySelector('video'), on = k === i;
			t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
			cards[k].hidden = wide.matches && !on;
			if (wide.matches && !v.src) { v.poster = v.dataset.poster; v.src = v.dataset.src; }
		});
		if (focus) tabs[i].focus();
		rail.style.setProperty('--dwell', [9, 8, 12.5, 10][i] + 's');
		cue();
		hold();
		document.dispatchEvent(new Event('scroll'));
	}
	// One thumbnail plays at a time, each in turn; hovering a tab plays its own.
	const vids = tabs.map(t => t.querySelector('video'));
	let turn = 0, hover = -1, auto = 0, over = 0;
	function cue() {
		const run = wide.matches && !still.matches, k = hover >= 0 ? hover : auto ? (cur + 1) % 4 : [0, 1, 2, 3].filter(n => n !== cur)[turn % 3];
		vids.forEach((v, n) => { tabs[n].classList.toggle('is-live', run && n === k && n !== cur); if (n !== k || !run) v.pause(); });
		if (run && k !== cur) { if (hover < 0) vids[k].currentTime = 0; vids[k].play().catch(() => {}); }
	}
	vids.forEach(v => v.addEventListener('ended', () => { if (hover < 0) { turn++; cue(); } }));
	tabs.forEach((t, n) => { t.addEventListener('pointerenter', () => { hover = n; cue(); }); t.addEventListener('pointerleave', () => { hover = -1; cue(); }); });
	// It also turns by itself while 85% of the chosen phone is on screen and the pointer is off the phone and the rail; a tab click or a touch on a demo ends it for good.
	function hold() { rail.classList.toggle('is-hold', !!over || !pjVisible(cards[cur].querySelector('.app-demo'))); }
	const quit = () => { auto = 0; rail.classList.remove('is-auto'); cue(); };
	rail.addEventListener('animationend', e => { if (!auto || e.animationName !== 'pj-fill') return; const n = (cur + 1) % 4, d = cards[n].querySelector('.app-demo'); if (!d.dataset.user) delete d.dataset.seen; show(n); });
	[rail, ...document.querySelectorAll('.app-phone')].forEach(el => { el.addEventListener('pointerenter', () => { over = 1; hold(); }); el.addEventListener('pointerleave', () => { over = 0; hold(); }); });
	cards.forEach(c => ['pointerup', 'keydown'].forEach(t => c.addEventListener(t, quit)));
	addEventListener('scroll', hold, { passive: true });
	rail.addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) { quit(); show(tabs.indexOf(t)); } });
	rail.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowLeft: 3, Home: 4 - cur, End: 3 - cur || 4 }[e.key]; if (d) { e.preventDefault(); quit(); show((cur + d) % 4, 1); } });
	addEventListener('hashchange', () => { const i = at(); if (i >= 0 && cards[i].hidden) { quit(); show(i); cards[i].scrollIntoView(); } });
	const start = () => { auto = wide.matches && !still.matches ? 1 : 0; rail.classList.toggle('is-auto', !!auto); show(cur); };
	[wide, still].forEach(m => m.addEventListener('change', start));
	// Phones: the site's Menu pill steps aside while a demo's top bar is under it.
	addEventListener('scroll', () => document.body.classList.toggle('pj-under', !wide.matches && cards.some(c => { const r = c.querySelector('.app-demo').getBoundingClientRect(); return r.top < 76 && r.bottom > 76; })), { passive: true });
	start();
})();

/* One guided preview at a time, after 500 ms of settled scrolling at 85% visibility; a tap or key hands control to the reader. */
(() => {
	const demos = [...document.querySelectorAll('.app-demo')];
	const motion = matchMedia('(prefers-reduced-motion: reduce)');
	let active = null, paused = null, settle = 0, finish = 0, busy = null, busyAt = 0;
	const emit = (d, name) => d.dispatchEvent(new CustomEvent(name));
	function stop() {
		clearTimeout(finish);
		if (active) { emit(active,'demo:stop'); delete active.dataset.playing; active = null; }
	}
	function choose() {
		if (active || paused || motion.matches || document.hidden) return;
		const wait = busyAt + 8000 - Date.now();
		if (busy && wait > 0 && pjVisible(busy)) { settle = setTimeout(choose, wait); return; }
		const d = demos.find(d => !d.dataset.seen && !d.dataset.user && pjVisible(d));
		if (!d) return;
		active=d; d.dataset.playing='1'; d.dataset.seen='1';
		emit(d,'demo:reset'); emit(d,'demo:visible');
		finish=setTimeout(() => { stop(); schedule(); }, d.dataset.demo === 'finance' ? 10000 : 6500);
	}
	function schedule() { clearTimeout(settle); settle=setTimeout(choose,500); }
	document.addEventListener('scroll', () => {
		if (active && !pjVisible(active)) { const d=active; stop(); delete d.dataset.seen; }
		schedule();
	}, { capture:true, passive:true });
	window.addEventListener('resize',schedule,{passive:true});
	document.addEventListener('visibilitychange', () => { if (document.hidden) { const d = active; stop(); if (d) delete d.dataset.seen; } else schedule(); });
	motion.addEventListener('change', () => { stop(); schedule(); });
	demos.forEach(d => {
		d.addEventListener('pointerdown', () => { if (active === d) { paused=d; stop(); } }, {capture:true,passive:true});
		d.addEventListener('pointercancel', () => { if (paused === d) { paused=null; delete d.dataset.seen; schedule(); } }, {passive:true});
		const own = () => { d.querySelectorAll('[data-demo-live]').forEach(e => e.setAttribute('aria-live','polite')); d.dataset.user='1'; busy = d; busyAt = Date.now(); if (paused === d) paused=null; if (active === d) stop(); emit(d,'demo:stop'); schedule(); };
		d.addEventListener('pointerup',own,{capture:true,passive:true});
		d.addEventListener('keydown',own,{capture:true});
		const reset=d.closest('.app-card').querySelector('.app-demo__reset');
		reset.addEventListener('click', () => {
			if (active === d) stop(); if (paused === d) paused=null;
			d.dataset.user='1'; emit(d,'demo:reset'); reset.focus({preventScroll:true}); schedule();
		});
	});
	schedule();
})();
