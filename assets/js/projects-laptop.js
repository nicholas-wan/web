/* Travel Packing's laptop on the Projects page (owner, 9 Nov 2026: "i also like the mockup style you did of adding
   the desktop version"). projects.js loads this on screens 1100px and up only, outside the page's 80 KB ceiling.
   The laptop shows the demo's sample list as the app lays it out on a wider screen, and follows the phone's ticks,
   nights, list and Start over. Like the real app, Hide packed and Last call belong to the device that set them, so
   the laptop always shows the whole list. Rows the phone hides are inferred exactly: Hide packed hides only packed
   items, and Last call hides an essential only once it is packed. A row that just changed fades from the accent. */
(() => {
const fig = document.querySelector('.pkl'), app = fig && fig.querySelector('.pkl-app'), phone = document.querySelector('#travel-packing .pk');
if (!app || !phone) return;
document.head.append(Object.assign(document.createElement('style'), { textContent: `.page-projects .pkl{margin:1rem 0 0!important;padding:0 10px;max-width:520px;box-sizing:border-box}
.page-projects .pkl-lid{position:relative;padding:9px 9px 14px;border-radius:14px 14px 4px 4px;background:linear-gradient(#26282d,#1b1c20);box-shadow:inset 0 0 0 1px #34363c,0 24px 60px -18px rgba(95,208,197,.22),0 18px 40px -20px #000}
.page-projects .pkl-lid::before{content:"";position:absolute;top:4px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#3a3d43}
.page-projects .pkl-screen{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:3px;background:#ECEAE4}
.page-projects .pkl-base{position:relative;height:11px;margin:0 -10px;border-radius:0 0 10px 10px/0 0 9px 9px;background:linear-gradient(#3a3d43,#232529 55%,#17181b);box-shadow:0 10px 18px -10px #000}
.page-projects .pkl-base::before{content:"";position:absolute;top:0;left:50%;width:16%;height:4px;transform:translateX(-50%);border-radius:0 0 6px 6px;background:#17181b}
.page-projects .pkl figcaption{margin:.4rem 0 0 -10px;font:400 .875rem/1.35 Archivo,system-ui,sans-serif;color:#9aa0a8;text-align:left}
.page-projects .pkl-app{position:absolute;top:0;left:0;display:flex;flex-direction:column;width:760px;height:475px;transform-origin:0 0;overflow:hidden;background:#ECEAE4;color:#15201F;font:400 14px/1.3 Archivo,system-ui,sans-serif;text-align:left;letter-spacing:0;-webkit-font-smoothing:antialiased}
.page-projects .pkl-app svg{fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
.page-projects .pkl-app b{color:inherit!important;font-weight:600}
.page-projects .pkl-top{display:flex;flex:none;align-items:center;gap:8px;height:46px;padding:0 22px;border-bottom:1px solid rgba(21,32,31,.13)}
.page-projects .pkl-top>b{font-size:15px;color:#15201F!important}
.page-projects .pkl-brand{width:20px;height:20px;color:#0F6E6B}
.page-projects .pkl-tabs{display:flex;gap:24px;margin:0 auto;padding-right:60px;font-size:14px;color:#44524F}
.page-projects .pkl-tabs span{height:46px;line-height:46px}
.page-projects .pkl-tabs .on{color:#15201F;background:linear-gradient(#0F6E6B,#0F6E6B) 0 100%/100% 2px no-repeat}
.page-projects .pkl-share{padding:3px 9px;border-radius:999px;background:rgba(15,110,107,.12);color:#0C5F5C;font-size:12.5px;font-weight:600}
/* The list head is the app's boarding pass (packing styles.css "boarding pass"), at the laptop's scale. */
.page-projects .pkl-pass{display:grid;flex:none;grid-template-columns:1fr 176px;margin:12px 22px 0;border:1px solid rgba(21,32,31,.13);border-radius:8px;background:#fff;-webkit-mask:radial-gradient(circle at calc(100% - 176px) 0,#0000 7px,#000 7.5px) top/100% 51% no-repeat,radial-gradient(circle at calc(100% - 176px) 100%,#0000 7px,#000 7.5px) bottom/100% 51% no-repeat;mask:radial-gradient(circle at calc(100% - 176px) 0,#0000 7px,#000 7.5px) top/100% 51% no-repeat,radial-gradient(circle at calc(100% - 176px) 100%,#0000 7px,#000 7.5px) bottom/100% 51% no-repeat}
.page-projects .pkl-pband{display:flex;align-items:center;justify-content:space-between;height:22px;margin:-1px -1px 0;padding:0 12px;border-radius:8px 0 0 0;background:#0F6E6B;color:#fff;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.page-projects .pkl-pband span{display:inline-flex;align-items:center;gap:5px}
.page-projects .pkl-pband span+span{opacity:.78;font-weight:500}
.page-projects .pkl-pband svg{width:11px;height:11px}
.page-projects .pkl-pstub>.pkl-pband{margin-left:-1px;border-radius:0 8px 0 0;font-size:9px}
.page-projects .pkl-pass i{display:block;font-style:normal;font-size:7.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#647170}
.page-projects .pkl-ptop{display:flex;gap:26px;padding:9px 14px 0}
.page-projects .pkl-ptop b{display:block;margin-top:2px;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase}
.page-projects .pkl-proute{display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:0 12px;padding:8px 14px 0}
.page-projects .pkl-proute .to{text-align:right}
.page-projects .pkl-pcode{display:block;font-size:26px;line-height:1;font-weight:700!important;letter-spacing:.02em}
.page-projects .pkl-proute i{margin-top:3px;letter-spacing:.08em}
.page-projects .pkl-pline{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:5px;height:26px;color:#0F6E6B}
.page-projects .pkl-pline u{display:block;height:1px;background:rgba(21,32,31,.28)}
.page-projects .pkl-pline svg{width:14px;height:14px}
.page-projects .pkl-pfields{display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:0 22px;padding:10px 14px 11px}
.page-projects .pkl-pfields>div>b{display:inline-flex;align-items:center;height:22px;margin-top:3px;font-size:10px}
.page-projects .pkl-pill,.page-projects .pkl-chip{display:inline-block;height:22px;margin-top:3px;padding:0 9px;border:1px solid rgba(21,32,31,.28);border-radius:999px;font-size:10px;line-height:20px;color:#44524F}
.page-projects .pkl-pstub{border-left:1px solid rgba(21,32,31,.13);border-radius:0 8px 8px 0}
.page-projects .pkl-psay{padding:8px 12px 0;font-size:9px;line-height:1.3;color:#44524F}
.page-projects .pkl-psay b{display:block;font-size:14px;line-height:1.15;letter-spacing:-.01em}
.page-projects .pkl-pfine{display:grid;grid-template-columns:1fr 1fr;gap:6px 8px;padding:8px 12px 10px}
.page-projects .pkl-pfine .w{grid-column:1/-1}
.page-projects .pkl-pfine b{display:flex;align-items:center;gap:3px;margin-top:1px;font-size:9px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.page-projects .pkl-pfine svg{width:9px;height:9px;color:#0F6E6B}
.page-projects .pkl-pill b,.page-projects .pkl-bar b{color:#15201F!important}
.page-projects .pkl-sp{flex:1}
.page-projects .pkl-btn{padding:5px 11px;border:1px solid rgba(21,32,31,.2);border-radius:7px;background:#fff;font-size:13px;font-weight:500;color:#15201F;white-space:nowrap}
.page-projects .pkl-btn--p{border-color:#0F6E6B;background:#0F6E6B;color:#fff}
.page-projects .pkl-btn--r{border-color:transparent;background:none;color:#A8261F}
.page-projects .pkl-bar{display:flex;flex:none;align-items:center;gap:10px;margin:0 22px 12px;padding:4px 0 12px;border-bottom:1px solid rgba(21,32,31,.13);font-size:13px;color:#44524F}
.page-projects .pkl-bar b{font-size:15px}
.page-projects .pkl-bar em,.page-projects .pkl-chead em{position:relative;display:block;height:5px;border-radius:3px;background:#DEDBD4;overflow:hidden}
.page-projects .pkl-bar em{width:120px}
.page-projects .pkl-bar u,.page-projects .pkl-chead u{position:absolute;inset:0 auto 0 0;border-radius:3px;background:#0F6E6B;transition:width .35s ease}
.page-projects .pkl-cols{display:grid;flex:1;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start;min-height:0;padding:0 18px;overflow:hidden;-webkit-mask-image:linear-gradient(#000 calc(100% - 46px),transparent);mask-image:linear-gradient(#000 calc(100% - 46px),transparent)}
.page-projects .pkl-cube{overflow:hidden;border:1px solid rgba(21,32,31,.13);border-radius:10px;background:#fff}
.page-projects .pkl-chead{display:grid;grid-template-columns:1fr auto;gap:7px 8px;padding:10px 14px 11px;background:var(--c);color:#fff}
.page-projects .pkl-chead b{font-size:15px;color:#fff!important}
.page-projects .pkl-chead span{font-size:12.5px;opacity:.9}
.page-projects .pkl-chead em{grid-column:1/-1;height:4px;background:rgba(0,0,0,.22)}
.page-projects .pkl-chead u{background:#fff}
.page-projects .pkl-ghead{display:flex;justify-content:space-between;padding:9px 14px 3px;border-top:1px solid rgba(21,32,31,.1);font-size:10.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#647170}
.page-projects .pkl-chead+.pkl-ghead{border-top:0}
.page-projects .pkl-row{display:flex;align-items:center;gap:6px;min-width:0;height:34px;margin:0 6px;padding:0 8px;border-radius:6px;font-weight:600;font-size:13.5px}
.page-projects .pkl-row.is-packed{font-weight:400}
.page-projects .pkl-row.is-packed>:not(.pkl-box){opacity:.38}
.page-projects .pkl-row.is-flash{animation:pkl-flash 1s ease-out}
.page-projects .pkl-row.is-flash>*{opacity:1!important}
@keyframes pkl-flash{0%,35%{background:rgba(15,110,107,.18)}100%{background:rgba(15,110,107,0)}}
.page-projects .pkl-box{flex:none;display:grid;place-items:center;width:16px;height:16px;border:1.5px solid var(--c);border-radius:4px}
.page-projects .pkl-row.is-packed .pkl-box{border-color:#0F6E6B;background:#0F6E6B;color:#fff}
.page-projects .pkl-box svg{width:11px;height:11px;stroke-width:3}
.page-projects .pkl-ti{flex:none;width:16px;height:16px;color:var(--c)}
.page-projects .pkl-name{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.page-projects .pkl-ess{flex:none;width:11px;height:11px;margin-left:-2px;color:#647170}
.page-projects .pkl-ess path{fill:currentColor;stroke:none}
.page-projects .pkl-qty{margin-left:auto;padding-left:4px;font-size:12px;font-weight:500;color:#44524F}
@media screen and (max-width: 1099px){.page-projects .pkl{display:none}}
@media (prefers-reduced-motion: reduce){.page-projects .pkl-row.is-flash{animation:none}.page-projects .pkl-bar u,.page-projects .pkl-chead u{transition:none}}` }));
fig.classList.add('is-on');

/* The demo's sample (projects.js CATS, from packing's data/seed.json): keep the two in step. */
const CATS = [
	['Basics', '#0F6E6B', [['Backpack', [['Earpiece', 'headphones', 1], ['Portable Charger', 'battery-charging', 2, 'e'], ['eSIM', 'device-mobile', 1, 'e']]],
		['Funds', [['Wallet', 'wallet', 1, 'e'], ['Debit/Credit Cards', 'credit-card', 1, 'e'], ['Travel Adaptor', 'plug', 1, 'e']]],
		['Travel Info', [['Passport', 'id', 1, 'e'], ['Travel Confirmations', 'file-check', 1, 'e']]]]],
	['Hygiene', '#2E5FA6', [['Dental', [['Toothbrush', 'dental', 1], ['Toothpaste', 'dental', 1]]], ['Others', [['Retainer', 'dental', 1, 'e']]]]],
	['Clothes', '#B2452C', [['Basics', [['Underwear', 'hanger', [1, 1, 3, 8]], ['Sleep Shirt', 'shirt', [0.5, 1, 2, 4]], ['Shorts', 'hanger', [0.5, 0, 2, 4]]]],
		['Casual', [['Shirts', 'shirt', [0.6, 0, 2, 6]], ['Polo Shirts', 'shirt', [0.6, 1, 2, 5]], ['Pants', 'hanger', [0.5, 1, 2, 4]], ['Socks', 'sock', [0.8, 0, 3, 7]], ['Thick Socks', 'sock', [0.5, 0, 2, 4], 'x']]],
		['Footwear', [['Sports Shoes', 'shoe', 1], ['Slippers', 'shoe', 1], ['Boots', 'shoe', 1, 'x']]]]],
];
const ITEMS = CATS.flatMap(([cat, color, groups]) => groups.flatMap(([group, list]) => list.map(([name, icon, rule, f = '']) =>
	({ id: name.toLowerCase().replace(/\W+/g, '-'), name, icon, rule, cat, color, group, ess: f.includes('e'), ext: f.includes('x') }))));
const qtyFor = (r, n) => (r.length ? Math.max(r[2], Math.min(r[3], Math.ceil(n * r[0]) + r[1])) : r);
const PRE = 'earpiece wallet debit-credit-cards toothbrush toothpaste shorts slippers'.split(' ');
/* The pass's trips, as projects.html gives the phone: destination code, city and days to departure. */
const TRIP = { normal: ['CTU', 'Chengdu', 12], extended: ['HRB', 'Harbin', 40] };
const day = n => new Date(Date.now() + n * 864e5).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const fresh = () => ({ normal: { nights: 4, packed: new Set(PRE), qty: {} }, extended: { nights: 7, packed: new Set(), qty: {} } });
const use = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#pk-${id}"/></svg>`;
let S = fresh(), key = 'normal', last = '';
const flashAt = new Map();

function read() {
	key = phone.querySelector('.pk-tab[aria-pressed="true"]')?.dataset.key || 'normal';
	const L = S[key], hide = phone.querySelector('[data-act="hide"]')?.getAttribute('aria-pressed') === 'true';
	const lastCall = phone.querySelector('.pk-lc')?.getAttribute('aria-pressed') === 'true';
	L.nights = +phone.querySelector('.pk-nlabel b')?.textContent || L.nights;
	const set = (id, packed) => { if (L.packed.has(id) !== packed) { packed ? L.packed.add(id) : L.packed.delete(id); flashAt.set(id, performance.now()); } };
	const seen = new Set();
	for (const r of phone.querySelectorAll('.pk-item[data-id]')) {
		const it = ITEMS.find(i => i.id === r.dataset.id);
		if (!it) continue;
		seen.add(it.id);
		set(it.id, r.classList.contains('packed') || r.classList.contains('leaving'));
		const q = +r.querySelector('output')?.textContent;
		if (q && q !== qtyFor(it.rule, L.nights)) L.qty[it.id] = q; else delete L.qty[it.id];
	}
	for (const it of ITEMS) if (!seen.has(it.id) && (key === 'extended' || !it.ext) && ((hide && !lastCall) || (lastCall && it.ess))) set(it.id, true);
}
function draw() {
	read();
	const L = S[key], now = performance.now();
	const all = ITEMS.filter(i => key === 'extended' || !i.ext).map(i => ({ ...i, packed: L.packed.has(i.id), qty: L.qty[i.id] || qtyFor(i.rule, L.nights) }));
	const n = all.filter(i => i.packed).length, left = all.filter(i => i.ess && !i.packed).length, [to, city, days] = TRIP[key];
	const row = i => {
		const t = now - (flashAt.get(i.id) ?? -1e9);
		return `<div class="pkl-row${i.packed ? ' is-packed' : ''}${t < 1000 ? ` is-flash" style="--c:${i.color};animation-delay:-${Math.round(t)}ms` : `" style="--c:${i.color}`}"><span class="pkl-box">${i.packed ? use('check') : ''}</span>${use('t-' + i.icon, 'pkl-ti')}<span class="pkl-name">${i.name}</span>${i.ess ? use('tag', 'pkl-ess') : ''}${i.qty > 1 ? `<span class="pkl-qty">×${i.qty}</span>` : ''}</div>`;
	};
	const cube = ([cat, color, groups]) => {
		const ci = all.filter(i => i.cat === cat), p = ci.filter(i => i.packed).length;
		return `<div class="pkl-cube"><div class="pkl-chead" style="--c:${color}"><b>${cat}</b><span>${p === ci.length ? 'Packed ✓' : `${p} of ${ci.length}`}</span><em><u style="width:${p / ci.length * 100}%"></u></em></div>${
			groups.map(([g]) => { const gi = ci.filter(i => i.group === g); return gi.length ? `<div class="pkl-ghead"><span>${g}</span><span>${gi.filter(i => i.packed).length}/${gi.length}</span></div>${
				[...gi.filter(i => !i.packed), ...gi.filter(i => i.packed)].map(row).join('')}` : ''; }).join('')}</div>`;
	};
	const html = `<div class="pkl-top">${use('plane', 'pkl-brand')}<b>Travel Packing</b><span class="pkl-tabs"><span${key === 'normal' ? ' class="on"' : ''}>Normal trip</span><span${key === 'extended' ? ' class="on"' : ''}>Extended trip</span><span>✎ Defaults</span></span><span class="pkl-share">Sharing on Wi-Fi</span></div>
<div class="pkl-pass"><div class="pkl-pmain"><div class="pkl-pband"><span>${use('plane')}Travel Packing</span><span>Boarding pass</span></div>
<div class="pkl-ptop"><div><i>Passenger</i><b>Nicholas Wan</b></div><div><i>Trip</i><b>${key === 'normal' ? 'Normal trip' : 'Extended trip'}</b></div></div>
<div class="pkl-proute"><div><b class="pkl-pcode">SIN</b><i>Singapore</i></div><span class="pkl-pline"><u></u>${use('plane')}<u></u></span><div class="to"><b class="pkl-pcode">${to}</b><i>${city}</i></div></div>
<div class="pkl-pfields"><div><i>Date</i><span class="pkl-chip">${day(days)}</span></div><div><i>Nights</i><span class="pkl-pill">− <b>${L.nights}</b> nights +</span></div><div><i>Return</i><b>${day(days + L.nights)}</b></div><div><i>Boarding</i><b>Opens ${day(days - 1)}</b></div></div></div>
<div class="pkl-pstub"><div class="pkl-pband"><span>${to}</span></div><div class="pkl-psay"><b>${days} days to go</b>Last call opens the day before</div>
<div class="pkl-pfine"><div class="w"><i>Passenger</i><b>Nicholas Wan</b></div><div><i>Route</i><b>SIN${use('plane')}${to}</b></div><div><i>Date</i><b>${day(days)}</b></div><div><i>Nights</i><b>${L.nights}</b></div><div><i>Return</i><b>${day(days + L.nights)}</b></div></div></div></div>
<div class="pkl-bar"><span><b>${n}</b> of ${all.length} packed</span><em><u style="width:${n / all.length * 100}%"></u></em><span class="pkl-sp"></span><span class="pkl-btn">Hide packed</span><span class="pkl-btn">Last call · ${left ? left + ' left' : 'Clear'}</span></div>
<div class="pkl-cols">${CATS.map(cube).join('')}</div>`;
	// The phone often re-renders without a change here; leave the laptop alone then, so its fades and bars run on.
	if (html !== last) app.innerHTML = last = html;
}
let queued = false;
new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; draw(); }); } })
	.observe(phone, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-pressed'] });
/* Start over puts the phone back to its sample, and the laptop with it, without flashing every row. */
document.querySelector('#travel-packing .app-demo__reset')?.addEventListener('click', () => { S = fresh(); flashAt.clear(); });
new ResizeObserver(() => { app.style.transform = `scale(${app.parentNode.clientWidth / 760})`; }).observe(app.parentNode);
draw();
})();
