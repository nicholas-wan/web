/* Companion devices on the Projects page (owner, 9 Nov 2026: "make the tabs more interesting - like how packing
   list showed a desktop view. see the paprika app", which shows each feature on another device). projects.js loads
   this on screens 1100px and up only, outside the page's 80 KB ceiling. Each one is decorative (inert, aria-hidden)
   and follows its phone demo live:
   - Finance: where the work happens (owner, 9 Nov 2026, on a laptop that only repeated the phone: "What value does it
     show?"). Statements are downloaded and checked on the PC, and the phone reads a copy, so no bank login leaves it.
   - Nag-bot and SquashBot: another member's lock screen, where each new message in the chat arrives as a Telegram
     notification, newest on top. The pinned board is edited in place, so it never notifies. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const figs = { finance: $('.cpn[data-for=finance]'), nag: $('.cpn[data-for=nag]'), squash: $('.cpn[data-for=squash]') };
document.head.append(Object.assign(document.createElement('style'), { textContent: `
.page-projects .cpn{margin:2rem 0 0!important;padding:0;box-sizing:border-box}
.page-projects .cpn figcaption{margin:.55rem 0 0;font:400 .875rem/1.35 Archivo,system-ui,sans-serif;color:#9aa0a8;text-align:left}
.page-projects .cpn--flow{margin-top:2rem!important}
.page-projects .cpf-flow{display:flex;gap:36px;max-width:516px;margin:0!important;padding:0;list-style:none}
.page-projects .cpf-flow li{flex:1;min-width:0;display:grid;gap:10px;justify-items:center;margin:0;padding:0}
.page-projects .cpf-flow li:nth-child(2){--i:1}
.page-projects .cpf-flow li:nth-child(3){--i:2}
.page-projects .cpf-t{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:3/2;box-sizing:border-box;border:1px solid #ffffff14;border-radius:14px;background:#1b1c1f;color:#9a9a9f}
.page-projects .cpf-t svg{width:40px;height:40px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.page-projects .cpf-pc{color:var(--app);border-color:color-mix(in srgb,var(--app) 38%,transparent);box-shadow:0 10px 30px -14px color-mix(in srgb,var(--app) 45%,transparent)}
.page-projects .cpf-dot{fill:currentColor;stroke:none;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 0 3px currentColor)}
.page-projects .cpf-line{stroke-dasharray:1}
.page-projects .cpf-flow li+li .cpf-t::before{content:"";position:absolute;top:50%;left:-37px;width:36px;height:1px;background:#ffffff2e;transform-origin:0}
.page-projects .cpf-flow li+li .cpf-t::after{content:"";position:absolute;top:calc(50% - 1.5px);left:-37px;width:4px;height:4px;border-radius:50%;background:var(--app);opacity:0}
.page-projects .cpf-flow>li>span:last-child{font:400 14px/1.3 Archivo,system-ui,sans-serif;color:#8e8e93;white-space:nowrap}
.page-projects .cpf-flow:not(.is-run) .cpf-t{opacity:0}
.page-projects .cpf-flow.is-run .cpf-t{animation:cpf-up .45s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * 120ms) both}
.page-projects .cpf-flow.is-run li+li .cpf-t::before{animation:cpf-line .25s ease-out calc(var(--i) * 120ms + 280ms) both}
.page-projects .cpf-flow.is-run li+li .cpf-t::after{animation:cpf-run .5s ease-in-out calc(var(--i) * 120ms + 520ms) both}
.page-projects .cpf-flow:not(.is-run) .cpf-line{stroke-dashoffset:1}
.page-projects .cpf-flow.is-run .cpf-line{animation:cpf-draw .7s ease-out .4s both}
.page-projects .cpf-flow.is-run .cpf-dot{animation:cpf-pop .3s ease-out 1.05s both}
@keyframes cpf-up{from{opacity:0;transform:translateY(8px)}}
@keyframes cpf-line{from{transform:scaleX(0)}}
@keyframes cpf-draw{from{stroke-dashoffset:1}}
@keyframes cpf-run{15%{opacity:1}85%{opacity:1}to{left:-6px;opacity:0}}
@keyframes cpf-pop{from{opacity:0;transform:scale(0)}}
@media (prefers-reduced-motion: reduce){.page-projects .cpf-flow *,.page-projects .cpf-flow *::before,.page-projects .cpf-flow *::after{animation:none!important}.page-projects .cpf-flow:not(.is-run) .cpf-t{opacity:1}.page-projects .cpf-flow .cpf-line{stroke-dashoffset:0!important}}
.page-projects .cpn--lock{display:block}
.page-projects .cpn--lock figcaption{max-width:20rem;margin:1rem 0 0}
.page-projects .cpl{flex:none;width:226px;height:410px;padding:7px;box-sizing:border-box;border-radius:34px;background:#050607;box-shadow:inset 0 0 0 1px #3b4047,0 24px 50px -24px color-mix(in srgb,var(--app) 60%,transparent)}
.page-projects .cpl-s{position:relative;height:100%;overflow:hidden;border-radius:28px;background:var(--wall);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;text-align:center}
.page-projects .cpl-s::before{content:"";position:absolute;top:8px;left:50%;width:62px;height:18px;margin-left:-31px;border-radius:10px;background:#000}
.page-projects .cpl-s p{margin:0;text-align:center!important;color:#fff!important}
.page-projects .cpl-s .cpl-d{margin-top:38px;font:600 12.5px/1.3 inherit;opacity:.85}
.page-projects .cpl-s .cpl-c{font:600 62px/1.05 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:-.02em}
.page-projects .cpl-n{position:absolute;left:8px;right:8px;top:156px;display:grid;gap:6px}
.page-projects .cpl-n div{display:grid;grid-template-columns:24px minmax(0,1fr) auto;column-gap:8px;padding:9px 10px;border-radius:15px;background:#ffffff38;-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);text-align:left;font-size:10.5px;line-height:1.3}
.page-projects .cpl-n i{grid-row:span 2;width:24px;height:24px;border-radius:6px;background:linear-gradient(#2aabee,#229ed9) center/100%}
.page-projects .cpl-n i::before{content:"";display:block;width:100%;height:100%;background:#fff;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 11.6 17.3 6.8c.6-.2 1.1.1.9.9l-2 9.6c-.2.7-.6.8-1.2.5l-3.1-2.3-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.2 5.8-5.3c.3-.2-.1-.4-.4-.2l-7.2 4.5-3.1-1c-.7-.2-.7-.7.1-1Z'/%3E%3C/svg%3E") center/70% no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 11.6 17.3 6.8c.6-.2 1.1.1.9.9l-2 9.6c-.2.7-.6.8-1.2.5l-3.1-2.3-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.2 5.8-5.3c.3-.2-.1-.4-.4-.2l-7.2 4.5-3.1-1c-.7-.2-.7-.7.1-1Z'/%3E%3C/svg%3E") center/70% no-repeat}
.page-projects .cpl-n b{font-weight:650;color:#fff!important}
.page-projects .cpl-n small{font-size:9.5px;opacity:.7}
.page-projects .cpl-n span{grid-column:2/-1;white-space:pre-line;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.page-projects .cpl-n .is-new{animation:cpl-in .45s cubic-bezier(.22,1,.36,1) both}
.page-projects .cpl-h{position:absolute;left:50%;bottom:8px;width:84px;height:4px;margin-left:-42px;border-radius:4px;background:#fff}
@keyframes cpl-in{from{opacity:0;transform:translateY(-14px) scale(.96)}}
@media (prefers-reduced-motion: reduce){.page-projects .cpl-n .is-new{animation:none}}
@media screen and (max-width: 1099px){.page-projects .cpn{display:none}}` }));

/* Watches a phone and redraws its companion once per frame at most. */
const watch = (src, draw) => {
	let q = 0;
	const run = () => { q = 0; draw(); };
	new MutationObserver(() => { q = q || requestAnimationFrame(run); }).observe(src, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'hidden'] });
	run();
};
const on = (fig, html) => { fig.querySelector('.cpl').innerHTML = html; fig.classList.add('is-on'); };

/* Finance: three tiles, downloads, the PC that checks them (its laptop draws the tracker's new desktop hero line, ending
   on today's point), and the iPhone it syncs to (design review, 9 Nov 2026: one shape, one icon each, gold only where
   the work happens). They play once each time they scroll into view. */
if (figs.finance) {
	const flow = $('.cpf-flow', figs.finance);
	figs.finance.classList.add('is-on');
	new IntersectionObserver(([e]) => flow.classList.toggle('is-run', e.isIntersecting), { threshold: 0.6 }).observe(flow);
}

/* A lock screen fed by a chat: wallpaper, date, clock and the newest notifications on top. */
const lock = (fig, chat, { wall, date, clock, group, read }) => {
	on(fig, `<div class="cpl-s" style="--wall:${wall}"><p class="cpl-d">${date}</p><p class="cpl-c">${clock}</p><div class="cpl-n"></div><span class="cpl-h"></span></div>`);
	const list = $('.cpl-n', fig), seen = new Set();
	let first = true;
	watch(chat, () => {
		const items = read().slice(-3).reverse();
		list.innerHTML = items.map(([who, text]) => {
			const key = who + text, fresh = !first && !seen.has(key);
			seen.add(key);
			return `<div class="${fresh ? 'is-new' : ''}"><i></i><b>${group}</b><small>now</small><span>${who}: ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></div>`;
		}).join('');
		first = false;
	});
};
const flat = (el) => el.textContent.replace(/[ \t\r]+/g, ' ').replace(/ *\n */g, '\n').trim();

if (figs.nag) {
	const live = $('#nag-bot .n-live');
	if (live) lock(figs.nag, live, { wall: 'radial-gradient(120% 70% at 50% 0%,#e9a36f,#b4663d 45%,#5b2d1a)', date: 'Monday 9 November', clock: '7:45', group: 'Chores',
		read: () => [...live.querySelectorAll('.n-msg')].filter((m) => !m.querySelector('.n-brow')).map((m) => {
			if (m.classList.contains('n-stk')) return ['Nag-Bot', 'Sticker'];
			const b = m.querySelector('.n-bubble').cloneNode(true);
			b.querySelectorAll('.n-time,.n-name').forEach((e) => e.remove());
			return ['Nag-Bot', flat(b)];
		}) });
}

if (figs.squash) {
	const chat = $('#squashbot [data-chat]');
	if (chat) lock(figs.squash, chat, { wall: 'radial-gradient(120% 70% at 50% 0%,#3b6ea5,#1b3654 48%,#0b1622)', date: new Date(Date.now() + (12 - new Date().getDay()) % 7 * 864e5).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', ''), clock: '9:41', group: 'Squash',
		read: () => [...chat.querySelectorAll('.sq-m')].filter((m) => !/Court schedule/.test(m.textContent)).map((m) => {
			const lines = [...m.querySelectorAll('.sq-tx > div')].map(flat).filter(Boolean).join('\n');
			return [m.classList.contains('sq-m--me') ? 'DodgerBlueee' : 'SquashBot', lines];
		}) });
}
})();
