/* Each isolated sample app initializes only within 500px of the viewport. */
function projectsDemo(selector, init) {
  const roots = [...document.querySelectorAll(selector)];
  const boot = root => { if (!root.dataset.initialized) { root.dataset.initialized='1'; init(root); } };
  roots.forEach(root => root.addEventListener('focusin', () => boot(root), {once:true}));
  if (!('IntersectionObserver' in window)) return roots.forEach(boot);
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { boot(e.target); io.unobserve(e.target); }
  }), {rootMargin:'500px'});
  roots.forEach(root => io.observe(root));
}
/* SquashBot demo. Wording is the bot's own (squashbot/src); sample data only. "Now" is Fri 13 Nov 2026, 9:41am. */
(() => {
  'use strict';
  const WD = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');
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
      return at(2026) < 0 ? at(2027) : at(2026);
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
        c: ['court', 'Which court?', 4, ['1', '2', '3', '4', '5'].filter((c) => c !== d.prior)],
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
    kb.push([{ t: '✕ Cancel', a: 'n' }]);
    return { html: L, kb };
  }

  function init(root) {
    if (!root.querySelector('.sq [data-chat]')) return;
    root.dataset.sqReady = '1';
    const $ = (s) => root.querySelector(s);
    const [chat, pin, pm, sub, toastEl, input, snd] = ['[data-chat]', '[data-pin]', '[data-pm]', '[data-sub]', '[data-toast]', '[data-in]', '.sq-snd'].map($);
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
    const placeholder = (t = 'Message') => { input.placeholder = t; };
    const sendState = () => snd.classList.toggle('is-on', !!input.value.trim());

    function showPin(i, flash) {
      S.pin = i;
      pm.textContent = i ? '💰 Squash tab · owed to Nicholas Alex · $2.00' : S.board;
      pin.setAttribute('aria-label', `Pinned message ${2 - i} of 2: ${pm.textContent}`);
      root.querySelectorAll('.sq-pbar span').forEach((s, k) => s.classList.toggle('is-on', k !== i));
      if (flash && !still()) {
        pin.classList.remove('is-flash');
        void pin.offsetWidth;
        pin.classList.add('is-flash');
      }
    }
    function sync(quiet) {
      const board = `📌 Court schedule ${sorted().map((b) => `${b.o > 1 ? sd(b.o) : b.o ? 'Tomorrow' : 'Today'} · ${span(b.s, b.e)} · C${esc(b.c)} · ${
        free(b) ? slots(free(b)) : 'full'}${b.by ? ' ↳ booked by Alex' : ''}`).join(' ')}`;
      if (board !== S.board) { S.board = board; showPin(0, !quiet); }
      const next = sorted().find((b) => free(b) > 0 && (b.o || b.s > NOW));
      const html = next && [`🙋 <b>${slots(free(next))} left on Court ${esc(next.c)}</b>`,
        `${next.o > 1 ? `In ${next.o} days` : next.o ? 'Tomorrow' : 'Today'} · ${sd(next.o)} · ${span(next.s, next.e)}`,
        `Playing: ${named(next).map(tag).join(', ')}`];
      if (S.av && S.av.court === next) return S.av.html.join() === html.join() || edit(S.av, { html });
      drop(S.av);
      S.av = next && post({ html, court: next, on: onAvail, time: quiet ? '9:15' : 0,
        kb: [[{ t: '🙋 Join', a: 'join' }], [{ t: '⚙️ Admin: add / remove', a: 'admin' }]] }, quiet);
    }
    function onAvail(a, m) {
      const b = m.court;
      if (b.ppl.includes('Alex')) return toast('You are already on that court.', 2400);
      b.ppl.push('Alex');
      toast('You are in.');
      post({ html: [`✅ <b>You are on</b> Court ${esc(b.c)}`,
        `${sd(b.o)} · ${span(b.s, b.e)} · ${free(b) ? `${slots(free(b))} · ${b.ppl.length}/${b.cap}` : 'full'}`, `👥 ${named(b).map(tag).join(', ')}`] });
      later(400, sync);
    }

    function myTab() {
      drop(S.tab);
      S.tab = post({ html: ['🧾 <b>Your squash tab</b>', 'Owed to Nicholas: <b>$2.00</b>', '', '• Court 4 · 10 Nov · 8pm–9pm · $6.00 ÷ 3 — $2.00', '',
        'Courts are $6/hour from 6pm, on weekends, and on public holidays, $3/hour otherwise, split across everyone who played.', '',
        'Only you can see this.'], kb: [[{ t: '👍 OK', a: 'ok' }]], on: (a, m) => drop(m) });
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
      const err = !d.o && d.s <= NOW ? 'That booking time has already passed. Change the date or time.'
        : d.s < 420 ? 'Courts open at 7am. Choose a later start time.'
          : d.s > 1260 ? 'The last slot starts at 9pm. Choose an earlier start time.'
              : e > 1320 ? 'Courts close at 10pm. Choose an earlier finish time.' : '';
      if (err) return toast(err, 3400);
      S.courts.push({ c: d.c, o: d.o, s: d.s, e, cap: 3, ppl: ['Nicholas', 'Alex'], by: 1 });
      S.draft = S.card = S.pending = null;
      drop(S.prompt);
      placeholder();
      toast('✅ Booking added');
      drop(m);
      later(450, sync);
    }
    function ask(f) {
      const [name, ex] = { d: ['date', '13 Aug, tomorrow, or Friday'], c: ['court', '4 or Court A'], t: ['time', '9pm or 8pm-9:30pm'] }[f];
      drop(S.prompt);
      S.pending = f;
      S.prompt = post({ html: [`${tag('Alex')}, reply with the ${name}.`, `Example: <code>${ex}</code>`] });
      placeholder(`Type the ${name}`);
      focus(input);
    }
    function reply(f, t, mine) {
      const d = S.draft;
      const v = f === 'd' ? pDate(t) : f === 'c' ? pCourt(`court ${t.replace(/^c[a-z]*\s*/, '')}`) : pTime(t);
      if (v == null) d.is = f === 'd' ? [] : [f === 'c' ? 'Reply with a court number or name, such as 4 or Court A.' : 'I could not read that time.'];
      else if (f === 't') { d.s = v.s; d.e = v.e ?? null; } else d[f === 'd' ? 'o' : 'c'] = v;
      d.ch[f] = null;
      later(500, () => { drop(S.prompt); drop(mine); if (S.card) edit(S.card, card(d)); });
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
      if (!d) return;
      typing(true);
      later(700, () => {
        typing(false);
        drop(S.card);
        drop(S.prompt);
        S.draft = d;
        S.card = post({ ...card(d), on: onCard });
        later(550, () => drop(mine));
      });
    }

    const mini = document.createElement('div');
    mini.className = 'sq-mini'; mini.hidden = true;
    mini.setAttribute('role', 'dialog'); mini.setAttribute('aria-label', 'SquashBot Mini App');
    root.appendChild(mini);
    let miniOpener;
    function closeMini() { mini.hidden = true; chat.inert = false; if (miniOpener) miniOpener.focus({ preventScroll: true }); }
    function openMini(kind, opener) {
      miniOpener = opener;
      const courts = sorted();
      mini.innerHTML = `<div class="sq-mini__bar"><button type="button" data-mini-close>Close</button><b>SquashBot</b><span>mini app</span></div><div class="sq-mini__body">${kind === 'tab' ? '<div class="sq-mini__title">My tab</div><p>Owed to Nicholas</p><strong>$2.00</strong><div class="sq-mini__row">Court 4 · 10 Nov · 8–9pm<br>$6.00 ÷ 3 players</div>' : '<div class="sq-mini__title">Courts</div>' + courts.map(b => `<div class="sq-mini__row"><b>Court ${esc(b.c)} · ${sd(b.o)}</b><br>${span(b.s,b.e)} · ${slots(free(b))} free</div>`).join('')}</div>`;
      mini.hidden = false; chat.inert = true;
      mini.querySelector('button').addEventListener('click',closeMini);
      mini.querySelector('button').focus({ preventScroll: true });
    }
    root.addEventListener('keydown', e => { if (!mini.hidden && e.key === 'Escape') closeMini(); });
    root.querySelectorAll('[data-mini]').forEach(b => b.addEventListener('click', () => openMini(b.dataset.mini,b)));
    root.addEventListener('demo:reset', () => { mini.hidden = true; chat.inert = false; });

    chat.addEventListener('click', (e) => {
      const key = e.target.closest('.sq-key');
      const m = key && S.msgs.find((x) => x.el.contains(key));
      if (key && key.dataset.a === 'admin') return toast('In the real app, group admins can add or remove players.');
      if (m && m.on) m.on(key.dataset.a, m, key);
    });
    pin.addEventListener('click', () => showPin(S.pin ? 0 : 1));
    root.querySelectorAll('.sq-chip').forEach((c) => c.addEventListener('click', () => say(c.textContent, 1)));
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
      plater(700, () => press(chip, () => say(chip.textContent, 1)));
      plater(2500, () => addKey()?.classList.add('is-ring'));
      plater(3000, () => press(addKey(), () => onCard('y', S.card)));
    }

    function build() {
      timers.concat(ptimers).forEach(clearTimeout);
      timers = []; ptimers = [];
      S = { msgs: [], touched: false,
        courts: [{ c: '1', o: 2, s: 600, e: 720, cap: 3, ppl: ['Nicholas'] }, { c: '2', o: 4, s: 1200, e: 1260, cap: 3, ppl: ['Nicholas', '', ''] }] };
      chat.innerHTML = '<div class="sq-day">Today</div>';
      toastEl.classList.remove('is-on');
      typing(false);
      input.value = '';
      sendState();
      placeholder();
      post({ html: ['💰 <b>Squash tab</b> · owed to Nicholas', '', 'Alex · <b>$2.00</b>'], time: '9:02',
        kb: [[{ t: '🧾 My tab', a: 'tab' }]], on: myTab }, 1);
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


/* Nag-bot demo. Wording from nag-bot's src/ and its Mini App (public/app). Sample data only. */
(() => {
  const ME = 'Nicholas', CH = 'wash the litter box', NOW = '7:45 PM', MAX = 3;

  const PRE = [['30m', '8:15 PM'], ['1h', '8:45 PM'], ['2h', '9:45 PM'], ['3h', '10:45 PM'], ['6h', 'tomorrow 1:45 AM', 'Nov 9, 1:45 AM'],
    ['🌙 9pm today', '9:00 PM'], ['📅 Tomorrow', 'tomorrow 7:45 PM', 'Nov 9, 7:45 PM', 1],
    ['📅 1 week', 'in 7 days · Nov 15, 7:45 PM', 'Nov 15, 7:45 PM', 1], ['📅 2 weeks', 'in 14 days · Nov 22, 7:45 PM', 'Nov 22, 7:45 PM', 1]]
    .map(([l, w, short, post]) => (short ? [l, w, short, post] : [l, `today ${w}`, `Nov 8, ${w}`]));

  const CHORES = [['wash', '💩', CH, 'every 6 weeks', '7:30pm'],
    ['plants', '🪴', 'water plants', 'every Mon,Thu', '8am', 0, ['tomorrow 8:00 AM']],
    ['trash', '🗑️', 'trash', 'daily', '7pm', 0, ['tomorrow 7:00 PM']],
    ['poop', '💩', 'clear poop', 'every 2 days', '9pm', 'wash', ['tomorrow 9:00 PM', 'Tue 10 Nov 9:00 PM']],
    ['shake', '💩', 'shake the litter box', 'every 4 days', '9pm', 'poop', ['Tue 10 Nov 9:00 PM', 'Thu 12 Nov 9:00 PM']],
  ].map(([id, e, t, cad, at, parent, st]) => ({ id, e, t, cad, rep: `${cad[0].toUpperCase()}${cad.slice(1)} at ${at}`, parent, st }));
  const byId = (id) => CHORES.find((c) => c.id === id);

  const PEOPLE = [['Alex', 5, 3], [ME, 4, 2]], RECENT = [['🗑️', 'trash', ME, 'Nov 8, 7:05 PM'], ['💩', 'clear poop', 'Alex', 'Nov 7, 9:12 PM'], ['🍽️', 'dishes', 'together', 'Nov 7, 8:40 PM']];
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
    const nag = $('.nag'), live = $('.n-live'), sheet = $('.n-sheet'), app = $('.n-app'), sleft = $('.n-sleft'), pinBtn = $('.n-pinbtn');
    const chatToast = $('.n-toast'), appToast = $('.n-atoast'), behind = [$('.n-pin'), $('.n-chat')];
    let s, seq = 0, timers = [], preview = [];
    const later = (ms, fn, list = timers) => list.push(setTimeout(fn, ms));
    const fresh = () => ({ st: 'nagging', used: 0, snz: null, tog: 0, msgs: [{ id: ++seq, k: 'card' }] });

    const card = () => s.msgs.find((m) => m.k === 'card');
    function view(m) {
      if (m.k === 'nd') return [`↩️ <b>${CH}</b> — not done after all, says ${ME}.`];
      if (m.k === 'del') return [`🗑️ ${ME} deleted <s>${CH}</s>`, [[['↩️ Undo', 'undo', m.id], ['✅ OK', 'ok', m.id]]]];
      if (s.st === 'done') {
        return [`😻 <s>${CH}</s> — done by ${ME}${s.tog ? ' &amp; Alex' : ''} at ${NOW}. ${s.tog ? 'Latte' : 'Mocha'} purrs approvingly.` +
          `<span class="n-reset${s.glow ? ' is-glow' : ''}">↪️ Resets too: clear poop, shake the litter box</span>`, [[['↩️ Not done', 'nd'], ['✅ OK', 'ok', m.id]]]];
      }
      const keys = m.kb ? SNOOZE_KB : s.snz ? SNOOZED_KB : NAG_KB;
      if (s.snz) return [`😴 <b>${CH}</b>\n${s.snz[3] ? `Postponed by ${ME} — back` : `Snoozed by ${ME} until`} ${s.snz[1]}.`, keys];
      return [`🐱 <b>${CH}</b> — nag #2\nMocha is watching you. Unblinking. 👀`, keys];
    }
    function renderChat() {
      live.innerHTML = s.msgs.map((m) => {
        const [html, keys] = view(m);
        const kb = keys ? `<div class="n-kb">${keys.map((r) => `<div class="n-row">${r.map(([l, a, arg]) => B(l, a, arg, a === 'done' && s.ring ? 'is-ring' : '')).join('')}</div>`).join('')}</div>` : '';
        const cls = (m.isNew ? ' is-new' : '') + (m.k === 'card' && s.pre ? ' is-pre' : '');
        m.isNew = 0;
        return `<div class="n-msg${cls}"><div class="n-bubble">${html}<span class="n-time">${m.ed ? 'edited ' : ''}${NOW}</span></div>${kb}</div>`;
      }).join('');
      const all = root.querySelectorAll('.n-msg');
      all.forEach((el, i) => el.classList.toggle('n-last', i === all.length - 1));
      s.glow = 0;
    }
    function toast(text, el = chatToast) {
      el.textContent = text;
      el.classList.add('is-show');
      clearTimeout(el.t);
      timers.push(el.t = setTimeout(() => el.classList.remove('is-show'), 1400 + text.length * 30));
    }
    const push = (k) => s.msgs.push({ id: ++seq, k, isNew: !reduced() });
    const drop = (id) => { s.msgs = s.msgs.filter((m) => m.id !== +id); };
    const edit = () => Object.assign(card(), { kb: 0, ed: 1 });
    function complete(tog) {
      if (s.st !== 'nagging') return;
      Object.assign(s, { st: 'done', tog, snz: null, glow: !reduced() });
      card() ? edit() : push('card');
      toast('Purrs 😻');
      return 1;
    }
    function appDone(tog) {
      if (!complete(tog)) return;
      Object.assign(s, { scr: 'list', chore: null, trail: [] });
      toast(`💩 ${CH} — done · next Sun, Dec 20, 7:30 PM`, appToast);
    }
    const act = {
      done: () => complete(0),
      tog: () => complete(1),
      snooze: () => { card().kb = 1; },
      zb: () => { card().kb = 0; },
      z: (i) => {
        if (s.used >= MAX) return toast(`😾 No snoozes left (${MAX} used) — time to do it.`);
        const p = s.snz = PRE[i], left = MAX - ++s.used;
        edit();
        toast((p[3] ? `Postponed — back ${p[1]} 📅` : `Snoozed until ${p[1]} 😴`) + (left ? ` · ${left} snooze${left > 1 ? 's' : ''} left` : ' · last snooze'));
      },
      hide: () => { drop(card().id); toast(`Hidden — back ${s.snz[2]} 😴`); },
      nd: () => { Object.assign(s, { st: 'nagging', tog: 0 }); edit(); push('nd'); toast('Taken back ↩️'); },
      ok: drop,
      del: () => { drop(card().id); s.st = 'deleted'; push('del'); toast('Deleted 🗑 — tap ↩️ Undo in the chat if that was a slip.'); },
      undo: (id) => { drop(id); Object.assign(s, { st: 'nagging', snz: null, used: 0 }); push('card'); toast('Restored 😺'); },
      open: () => sheetOpen(1),
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
      if (after) return ['Sun 20 Dec 7:30 PM', 0, 9];
      return s.snz ? [`snoozed · ${s.snz[1]}`, 0, 0] : ['nagging since today 7:30 PM', 1, 0];
    }
    function list() {
      return `<div class="n-sec">${CHORES.filter(alive).map((c) => [c, status(c)]).sort((a, b) => a[1][2] - b[1][2]).map(([c, [st, urgent]]) => {
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
        }).join('') + fv(plain(main('Resets with', 'When that one is done, this resets too')), alive(byId(c.parent)) ? byId(c.parent).t : 'Nothing') + '</div>';
      }
      return `${out}<div class="n-label">Schedule</div><div class="n-sec">${fv('Repeats', c.rep)}${fv('Nag every', '15, 30, 60 min')}</div>`;
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
        (same || (s.open ? sleft : live.querySelector('.n-msg:last-child button')) || pinBtn).focus({ preventScroll: true });
      }
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && s.open) sheetOpen(0); if (e.key === 'Tab' && s.open) { const bs = [...sheet.querySelectorAll('button')].filter(b => b.offsetParent); const first = bs[0], last = bs[bs.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } });

    function stopPreview() {
      if (!preview.length && !s.pre) return;
      preview.forEach(clearTimeout);
      preview = [];
      s.ring = s.pre = 0;

      root.querySelectorAll('.is-ring, .is-pre').forEach((el) => el.classList.remove('is-ring', 'is-pre'));
    }
    root.addEventListener('demo:stop', stopPreview);
    root.addEventListener('demo:visible', () => {
      if (reduced()) return;
      later(450, () => { s.pre = 0; card().isNew = 1; renderChat(); }, preview);
      later(1350, () => { s.ring = 1; renderChat(); }, preview);
      later(5600, () => { const d = $('.is-ring'); if (d) d.classList.add('is-press'); }, preview);
      later(5850, () => { preview = []; s.ring = 0; complete(0); renderChat(); }, preview);
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
    });

    s = fresh();
    s.pre = false;
    renderChat();
  }

  const init = () => projectsDemo('.app-demo--nag', setup);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* Finance tracker demo: phone Overview, spending, and import checks that fail closed. All data invented. */
(() => {
const NW = [444400, 447900, 451200, 449100, 455800, 460300, 463900, 461200, 468700, 479750, 481300, 486200];
const MONTHS = NW.map((_, i) => 'Nov Dec Jan Feb Mar Apr May Jun Jul Aug Sep Oct'.split(' ')[i] + (i < 2 ? ' 2025' : ' 2026'));
const LO = Math.min(...NW), Y = v => 52 - (v - LO) / (Math.max(...NW) - LO) * 46;
const F = [0, 2].map(d => new Intl.NumberFormat('en-SG', { minimumFractionDigits: d, maximumFractionDigits: d }));

const money = (n, d, sign) => `<span class="f-m">${sign ? '+' : ''}S$<span class="f-d">${F[d ? 1 : 0].format(n)}</span></span>`;
const icon = (id, c = '') => `<svg class="f-ic ${c}" aria-hidden="true"><use href="#fi-${id}"/></svg>`;

const CATS = [
  ['food', 'Food &amp; dining', 720, 'Paradise Dynasty 30 186.4|GrabFood 25 52.6|Jumbo Seafood 22 248|Foodpanda 18 41|Shake Shack 11 82|Imperial Treasure 4 250'],
  ['travel', 'Travel', 450, 'Scoot 27 412|Agoda 27 168|Klook 14 40'],
  ['groceries', 'Grab + Foodpanda', 560, 'GrabFood 29 168.3|Foodpanda 23 92.7|GrabFood 15 141.5|GrabFood 9 64.8|Foodpanda 2 72.7'],
  ['shopping', 'Games', 300, 'Steam 26 119.8|Nintendo 20 46.2|PlayStation 13 88|Steam 5 126'],
  ['transport', 'Transport', 260, 'SimplyGo 31 62.4|Grab 24 28.6|ComfortDelGro 19 19|Gojek 16 22|SimplyGo 8 58|Grab 3 20']
].map(([k, n, t, s]) => {
  const tx = s.split('|').map(r => { const p = r.split(' '), amt = +p.pop(), day = +p.pop(); return { who: p.join(' '), day, amt }; });
  const v = Math.round(tx.reduce((a, r) => a + r.amt, 0)), pc = Math.round((v - t) / t * 100);
  return { k, n, t, tx, v, tone: Math.abs(pc) < 5 ? '' : pc > 0 ? 'f-bad' : 'f-good',
    vs: (Math.abs(pc) < 5 ? 'in line with' : (pc > 0 ? '+' : '−') + Math.abs(pc) + '% vs') + ' typical ' + money(t) };
});
const TOTAL = CATS.reduce((a, c) => a + c.v, 0);

const STMTS = [['Card statement', 'Oct', 52, 2986.1, 3214.6], ['Bank account', 'Oct', 31, 18420.55, 6912.4, 6972.4], ['Card statement', 'Sep', 48, 3102.45, 2986.1], ['Bank account', 'Sep', 29, 17960.2, 5379.65]]
  .map(([n, m, rows, open, sum, printed]) => ({ n, m: m + ' 2026', bad: !!printed, ck: [
    ['Statement month read', m + ' 2026, matches its file name'],
    ['Every row read', rows + ' rows, none unreadable'],
    ['Balance carries over', `Opens at ${m > 'P' ? 'Aug' : 'Sep'}’s closing ${money(open, 2)}`],
    printed ? ['Totals don’t add up', `Rows ${money(sum, 2)}, printed ${money(printed, 2)}`] : ['Totals add up', `Rows ${money(sum, 2)} = printed ${money(sum, 2)}`]
  ] }));

const row = (attrs, cls, ico, title, sub, end) => `<button class="f-row ${cls}" ${attrs}><span class="f-ico">${icon(ico)}</span><span class="f-rt"><span>${title}</span><span>${sub}</span></span>${end}${icon('right', 'f-chev')}</button>`;
const PAGES = {
  overview: () => {
    const line = NW.map((v, i) => (i ? 'L' : 'M') + (i * 300 / 11).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    return `<div class="f-title">Overview</div>
<div class="f-worth"><span class="f-lbl">Net worth</span><span class="f-fig">${money(NW[11])}</span>
<span class="f-chg"><span class="f-pill">${money(NW[11] - NW[9], 0, 1)} since your visit on 14 Aug</span><span>${money(NW[11] - NW[0], 0, 1)} <span class="f-good">(+${((NW[11] - NW[0]) / NW[0] * 100).toFixed(1)}%)</span> since ${MONTHS[0]}</span></span>
<div class="f-spark" tabindex="0" role="slider" aria-label="Net worth by month" aria-valuemin="0" aria-valuemax="11">
<svg viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true"><path d="${line}L300 56L0 56Z"/><path d="${line}"/><line y1="0" y2="56"/></svg></div>
<span class="f-axis"><span>${MONTHS[0]}</span><span>${MONTHS[11]}</span></span></div>
<div class="f-card"><span class="f-lbl">Last 3 statements · Aug–Oct 2026</span><div class="f-stats">
${[['Earned', 24600], ['Spent on cards', 9540], ['Invested', 6000]].map(s => `<span>${s[0]}<b>${money(s[1])}</b></span>`).join('')}</div>
<span class="f-note">Card spending ${money(3180)} a month, <span class="f-good">6% lower</span> than the three statements before.</span></div>
<div class="f-list">${row('data-tab="spending"', '', 'spending', 'Key spending', 'Oct 2026 against typical', `<span class="f-rv">${money(TOTAL)}</span>`)}
${row('data-tab="statements"', 'is-bad', 'statements', 'Needs attention', '1 import stopped', '<span class="f-badge">1</span>')}</div>`;
  },
  wealth: () => PAGES.overview().split('<div class="f-card">')[0].replace('>Overview<', '>Wealth<'),
  spending: () => `<div class="f-title">Spending</div><div class="f-hint">Oct 2026 (bar) against your typical month (tick). Tap one for its charges.</div>
<div class="f-list">${CATS.map(c => `<button class="f-row f-key c-${c.k}" data-cat="${c.k}"><span class="f-ico">${icon(c.k)}</span><span class="f-kn">${c.n}</span><span class="f-rv">${money(c.v)}</span>${icon('right', 'f-chev')}<span class="f-kd ${c.tone}">${c.vs}</span><span class="f-kb" aria-hidden="true"><i style="width:${c.v / 9}%"></i><b style="left:${c.t / 9}%"></b></span></button>`).join('')}</div>`,
  statements: () => `<div class="f-title">Ledger</div><div class="f-hint">Through Oct 2026 · next around 4 Dec</div>
<div class="f-list">${STMTS.map((s, i) => row(`data-st="${i}"`, s.bad ? 'is-bad' : 'is-ok', s.bad ? 'no' : 'ok', s.n, s.m + (s.bad ? ' · totals don’t add up' : ' · all checks passed'), '')).join('')}</div>
<div class="f-hint">A statement that doesn’t add up stops its import; the last good data stays.</div>`,
  cat: c => `<div class="f-title">${c.n}</div><div class="f-sum">${money(c.v, 2)}</div><div class="f-hint">${c.tx.length} charges in Oct 2026 · <span class="${c.tone}">${c.vs}</span></div><div>${c.tx.map((r, i) =>
    (i && c.tx[i - 1].day === r.day ? '' : `<div class="f-day">${'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[new Date(2026, 9, r.day).getDay()]} ${r.day} Oct</div>`) +
    `<div class="f-tr c-${c.k}"><span class="f-ini" style="--h:${[...r.who].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7)}" aria-hidden="true">${r.who[0]}</span><span class="f-tn"><span>${r.who}</span><span>${c.n}</span></span><span class="f-ta">${money(r.amt, 2)}</span></div>`).join('')}</div>`
};

function init(root) {
  const fd = root.querySelector('.fd');
  if (!fd || fd.dataset.ready) return;
  fd.dataset.ready = 1;
  const $ = s => fd.querySelector(s);
  const scroll = $('.f-scroll'), wrap = $('.f-sheet-wrap'), sheet = $('.f-sheet'), finger = $('.f-finger'), eye = $('[data-act="eye"]');
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tab, cat, opener, savedTop = 0, timers = [], ticks = [], raf = 0, playing = false, touched = false, scrub, finish;

  function render(push) {
    const c = CATS.find(x => x.k === cat);
    $('.f-top').hidden = !!c; $('.f-bar').hidden = !c && tab !== 'spending';
    scroll.innerHTML = `<div class="f-page${push && !still() ? ' is-push' : ''}">${c ? PAGES.cat(c) : PAGES[tab]()}</div>`;
    fd.querySelectorAll('.f-tab').forEach(t => t.setAttribute('aria-pressed', t.dataset.tab === (tab === 'statements' ? 'ledger' : tab === 'spending' ? 'overview' : tab)));
    scrub = !c && (tab === 'overview' || tab === 'wealth') && bindScrub();
  }
  function go(t) { tab = t === 'ledger' ? 'statements' : t === 'wealth' ? 'wealth' : t; cat = null; render(); scroll.scrollTop = 0; }

  function bindScrub() {
    const worth = $('.f-worth'), spark = $('.f-spark'), fig = $('.f-fig'), axis = $('.f-axis'), mk = $('line');
    const rest = [fig.innerHTML, axis.innerHTML];
    let idx = 11, down = false;
    const at = i => {
      idx = Math.max(0, Math.min(11, i));
      const x = idx * 300 / 11;
      mk.setAttribute('x1', x); mk.setAttribute('x2', x);
      worth.classList.add('is-scrub');
      fig.innerHTML = money(NW[idx]);
      axis.innerHTML = `<span class="f-at">${MONTHS[idx]}</span>`;
      aria(idx);
    };
    const aria = i => { spark.setAttribute('aria-valuenow', i); spark.setAttribute('aria-valuetext', MONTHS[i] + ', S$' + F[0].format(NW[i])); };
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

  function openSheet(i, user) {
    const s = STMTS[i];
    opener = user && $(`[data-st="${i}"]`);
    sheet.setAttribute('aria-label', `${s.m} ${s.n.toLowerCase()} checks`);
    sheet.innerHTML = `<div class="f-sh"><span><b>${s.m} ${s.n.toLowerCase()}</b><span class="f-hint">${s.bad ? 'Import stopped' : 'Imported'} · ${s.m > 'P' ? '4 Oct' : '3 Nov'} 2026</span></span><button class="f-done" data-act="close">Done</button></div>
<div class="f-checks">${s.ck.map(c => `<div class="f-ck is-wait"><i>${icon('ok')}</i><span>${c[0]}<small>${c[1]}</small></span></div>`).join('')}</div>
<div class="f-res is-wait${s.bad ? ' is-no' : ''}" role="status" aria-live="${user ? 'polite' : 'off'}"><b>${s.bad ? 'Totals don’t add up — not imported' : 'All four checks passed — imported'}</b>${s.bad ? 'The import stopped before changing anything. The last good data, through Sep 2026, is kept.' : 'Its rows are in the Overview and Spending.'}</div>`;
    if (user) sheet.setAttribute('aria-modal','true'); else sheet.removeAttribute('aria-modal');
    wrap.hidden = false;
    const cks = sheet.querySelectorAll('.f-ck'), res = $('.f-res');
    const settle = n => {
      cks[n].className = 'f-ck ' + (s.bad && n > 2 ? 'is-no' : 'is-ok');
      if (s.bad && n > 2) cks[n].querySelector('use').setAttribute('href', '#fi-no');
    };
    finish = () => { ticks.forEach(clearTimeout); ticks = []; cks.forEach((_, n) => settle(n)); res.classList.remove('is-wait'); };
    if (still()) finish();
    else {
      cks.forEach((_, n) => ticks.push(setTimeout(() => settle(n), 400 + n * 400)));
      ticks.push(setTimeout(finish, 1800));
    }
    if (user) $('.f-done').focus();
  }
  function closeSheet() {
    ticks.forEach(clearTimeout); ticks = [];
    if (wrap.hidden) return;
    wrap.hidden = true; sheet.innerHTML = '';
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  }

  fd.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-tab],[data-cat],[data-st]');
    if (!t) return;
    const a = t.dataset.act;
    if (a === 'eye') {
      const on = fd.classList.toggle('is-masked');
      eye.setAttribute('aria-pressed', on);
      eye.setAttribute('aria-label', on ? 'Show amounts' : 'Hide amounts');
      eye.firstChild.firstChild.setAttribute('href', on ? '#fi-eye-off' : '#fi-eye');
    } else if (a === 'back') {
      const k = cat; cat = null; if (!k) go('overview'); else render(); scroll.scrollTop = savedTop;
      const backTo = k ? $(`[data-cat="${k}"]`) : $('[data-tab="spending"]'); if (backTo) backTo.focus({ preventScroll: true });
    } else if (a === 'close') closeSheet();
    else if (t.dataset.tab) { go(t.dataset.tab); const target = $(`.f-tab[data-tab="${tab === 'statements' ? 'ledger' : tab === 'spending' ? 'overview' : tab}"]`); if (target) target.focus({ preventScroll: true }); }
    else if (t.dataset.cat) { savedTop = scroll.scrollTop; cat = t.dataset.cat; render(1); scroll.scrollTop = 0; $('.f-back').focus(); }
    else openSheet(+t.dataset.st, 1);
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
        tap('.f-tab[data-tab="ledger"]', 250, () => go('statements'));
        tap('[data-st="1"]', 1300, () => openSheet(1));
        later(4800, () => { closeSheet(); go('overview'); fc('is-on', 0); playing = false; });
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
    if (!wrap.hidden) finish();
  }
  root.addEventListener('demo:stop', stop);

  function reset() {
    playing = true; stop(); touched = false;
    opener = null; closeSheet();
    if (fd.classList.contains('is-masked')) eye.click();
    go('overview');
  }
  root.addEventListener('demo:visible', play);
  root.addEventListener('demo:reset', reset);
  reset();
}

const boot = () => projectsDemo('.app-demo--finance', init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


/* Travel Packing demo: items, rules, notes and essentials from data/seed.json; quantities by the app's computeQty. */
(() => {

const CATS = [
  ['Clothes', '#B2452C', '#9E3B24', '178,69,44', [
    ['Basics', [['Underwear', 'hanger', [1, 1, 3, 8]], ['Sleep Shirt', 'shirt', [0.5, 1, 2, 4]], ['Shorts', 'hanger', [0.5, 0, 2, 4]]]],
    ['Casual', [['Shirts', 'shirt', [0.6, 0, 2, 6]], ['Polo Shirts', 'shirt', [0.6, 1, 2, 5], 'One worn on the day'],
      ['Pants', 'hanger', [0.5, 1, 2, 4], 'One worn on the day'], ['Socks', 'sock', [0.8, 0, 3, 7]], ['Thick Socks', 'sock', [0.5, 0, 2, 4], '', 'x']]],
    ['Footwear', [['Sports Shoes', 'shoe', 1], ['Slippers', 'shoe', 1], ['Boots', 'shoe', 1, 'Thick shoes for cold trips', 'x']]]]],
  ['Basics', '#0F6E6B', '#0C5F5C', '15,110,107', [
    ['Backpack', [['Earpiece', 'headphones', 1], ['Portable Charger', 'battery-charging', 2, 'Plus one wire each', 'e'], ['ESIM', 'device-mobile', 1, 'Buy and install before flying', 'e']]],
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
  const $ = s => root.querySelector(s), cubes = $('.pk-cubes'), tap = $('.pk-tap'), scroller = $('.pk-scroll');
  const box = id => cubes.querySelector(`[data-id="${id}"] input`);
  let S, timers = [], previewing = false, touched = false;
  const fresh = () => ({ key: 'normal', hide: false, last: false, folded: new Set(), normal: { nights: 4 }, extended: { nights: 7 } });
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
    $('.pk-h1').textContent = S.key === 'normal' ? 'Normal trip' : 'Extended trip';
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
    const el = e.target.closest('[data-act], .pk-label'), act = el && el.dataset.act;
    if (!el) return;
    if (!act) el.parentNode.querySelector('input').click();
    else if (act === 'list' && S.key !== el.dataset.key) { S.key = el.dataset.key; S.hide = S.last = false; render(); scroller.scrollTop = 0; }
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
      el.parentNode.querySelector('output').textContent = S[S.key][id + '#'] = Math.max(1, Math.min(99, it.qty + +el.dataset.d));
    }
  });
  root.addEventListener('change', e => tick(e.target.closest('.pk-item'), e.target.checked));
  root.addEventListener('animationend', e => e.target.classList.remove('pk-pop', 'pk-bump'));

  root.addEventListener('demo:stop', e => {
    touched = true;
    if (previewing) { previewing = false; stop(); tap.className = 'pk-tap'; }
  });
  function moveTap(el, jump) {
    const r = el.getBoundingClientRect(), p = root.getBoundingClientRect();
    tap.style.transition = jump ? 'none' : '';
    tap.style.translate = `${r.left + r.width / 2 - p.left}px ${r.top + r.height / 2 - p.top}px`;
  }
  function preview() {
    if (previewing || touched || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    previewing = true;
    const plus = () => $('[data-act=nights][data-d="1"]');
    moveTap(plus(), true);
    later(() => tap.classList.add('on'), 60);
    [[plus, 600], [plus, 1350], [() => box('underwear'), 2700], [() => box('sleep-shirt'), 3900]].forEach(([get, at], k) => {
      if (k) later(() => moveTap(get()), at - 450);
      later(() => { tap.classList.remove('press'); void tap.offsetWidth; tap.classList.add('press'); get().click(); }, at);
    });
    later(() => tap.classList.remove('on'), 4500);
    later(() => { previewing = false; tap.className = 'pk-tap'; }, 4800);
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

const start = () => projectsDemo('.app-demo--packing', init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


/* One guided preview at a time, after 500 ms of settled scrolling and 90% visibility.
   A swipe pauses and re-arms the preview; an intentional tap or key hands control to the reader. */
(() => {
  const demos = [...document.querySelectorAll('.app-demo')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, paused = null, settle = 0, finish = 0;
  const emit = (d, name) => d.dispatchEvent(new CustomEvent(name));
  const visible = d => { const b = d.getBoundingClientRect(); return Math.max(0, Math.min(innerHeight, b.bottom) - Math.max(0,b.top)) / b.height >= .9; };
  function stop() {
    clearTimeout(finish);
    if (active) { emit(active,'demo:stop'); delete active.dataset.playing; active = null; }
  }
  function choose() {
    if (active || paused || motion.matches || document.hidden) return;
    const d = demos.find(d => !d.dataset.seen && !d.dataset.user && visible(d));
    if (!d) return;
    active=d; d.dataset.playing='1'; d.dataset.seen='1';
    emit(d,'demo:reset'); emit(d,'demo:visible');
    finish=setTimeout(() => { stop(); schedule(); }, d.dataset.demo === 'finance' ? 10000 : 6500);
  }
  function schedule() { clearTimeout(settle); settle=setTimeout(choose,500); }
  document.addEventListener('scroll', () => {
    if (active && !visible(active)) { const d=active; stop(); delete d.dataset.seen; }
    schedule();
  }, { capture:true, passive:true });
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else schedule(); });
  motion.addEventListener('change', () => { stop(); schedule(); });
  demos.forEach(d => {
    d.addEventListener('pointerdown', () => { if (active === d) { paused=d; stop(); } }, {capture:true,passive:true});
    d.addEventListener('pointercancel', () => { if (paused === d) { paused=null; delete d.dataset.seen; schedule(); } }, {passive:true});
    const own = () => { d.querySelectorAll('[data-demo-live]').forEach(e => e.setAttribute('aria-live','polite')); d.dataset.user='1'; if (paused === d) paused=null; if (active === d) stop(); emit(d,'demo:stop'); schedule(); };
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
