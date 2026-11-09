/* Companion devices on the Projects page (owner, 9 Nov 2026: "make the tabs more interesting - like how packing
   list showed a desktop view. see the paprika app", which shows each feature on another device). projects.js loads
   this on screens 1100px and up only, outside the page's 80 KB ceiling. Each one is decorative (inert, aria-hidden)
   and follows its phone demo live:
   - Finance: where the work happens (owner, 9 Nov 2026, on a laptop that only repeated the phone: "What value does it
     show?"). Statements are downloaded, filed and checked on the PC, and the phone reads a copy, so no bank login
     leaves the PC. The three steps play once each time they scroll into view, then nudge the phone's badge.
   - Nag-bot and SquashBot: another member's lock screen, where each new message in the chat arrives as a Telegram
     notification, newest on top. The pinned board is edited in place, so it never notifies. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const figs = { finance: $('.cpn[data-for=finance]'), nag: $('.cpn[data-for=nag]'), squash: $('.cpn[data-for=squash]') };
document.head.append(Object.assign(document.createElement('style'), { textContent: `
.page-projects .cpn{margin:1.6rem 0 0!important;padding:0;box-sizing:border-box}
.page-projects .cpn figcaption{margin:.55rem 0 0;font:400 .875rem/1.35 Archivo,system-ui,sans-serif;color:#9aa0a8;text-align:left}
.page-projects .cpf-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:560px;margin:0!important;padding:0;list-style:none;counter-reset:s}
.page-projects .cpf-flow li{position:relative;display:grid;grid-template-rows:150px auto;gap:10px;margin:0;padding:0}
.page-projects .cpf-flow li+li::before{content:"";position:absolute;top:72px;left:-19px;width:16px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2d2f34,var(--app));transform-origin:0;transition:transform .35s}
.page-projects .cpf-flow>li>span{font:500 .8rem/1.35 Archivo,system-ui,sans-serif;color:#c9ccd1;text-align:left}
.page-projects .cpf-flow>li>span::before{counter-increment:s;content:counter(s);display:inline-grid;place-items:center;width:17px;height:17px;margin-right:6px;border-radius:50%;background:color-mix(in srgb,var(--app) 22%,transparent);color:var(--app);font-size:.68rem;font-weight:700}
.page-projects .cpf-v{align-self:end;display:grid;gap:5px;box-sizing:border-box;font:500 10px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;color:#eceae4;text-align:left}
.page-projects .cpf-v b{color:inherit!important;font-weight:650;font-size:11px}
.page-projects .cpf-v i{display:block;overflow:hidden;font-style:normal;white-space:nowrap;text-overflow:ellipsis;transition:opacity .35s,transform .35s}
.page-projects .cpf-dl{position:relative;height:128px;padding:20px 10px 10px;border-radius:4px 10px 10px 10px;background:linear-gradient(#2b2d33,#202226);box-shadow:inset 0 0 0 1px #3a3d44}
.page-projects .cpf-dl::before{content:"";position:absolute;top:-8px;left:0;width:42%;height:12px;border-radius:5px 5px 0 0;background:#2b2d33;box-shadow:inset 1px 1px 0 #3a3d44,inset -1px 0 0 #3a3d44}
.page-projects .cpf-dl i{padding:5px 6px 5px 22px;border-radius:5px;background:#ffffff0d url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 14'%3E%3Cpath d='M1 1h7l3 3v9H1z' fill='%23e5484d'/%3E%3C/svg%3E") 6px 50%/10px no-repeat;color:#b9bcc2}
.page-projects .cpf-pc{position:relative;height:132px;padding:6px 6px 10px;border-radius:7px 7px 2px 2px;background:#1b1c20;box-shadow:inset 0 0 0 1px #34363c}
.page-projects .cpf-pc::after{content:"";position:absolute;left:-9px;right:-9px;bottom:-7px;height:7px;border-radius:0 0 7px 7px;background:linear-gradient(#3a3d43,#17181b)}
.page-projects .cpf-pc>div,.page-projects .cpf-ph>div{display:grid;gap:3px;height:100%;box-sizing:border-box;padding:7px 8px;border-radius:3px;background:#161614;align-content:start}
.page-projects .cpf-pc>div>b{color:#4fc79e!important}
.page-projects .cpf-pc i::before{content:"✓ ";color:#4fc79e}
.page-projects .cpf-pc .cpf-ok{margin-top:3px;color:#5dcaa5}
.page-projects .cpf-pc .cpf-ok::before,.page-projects .cpf-pc .cpf-bad::before{content:""}
.page-projects .cpf-pc .cpf-bad{color:#f09595;font-weight:650}
.page-projects .cpf-ph{justify-self:center;width:86px;height:150px;padding:5px;border-radius:16px;background:#050607;box-shadow:inset 0 0 0 1px #3b4047}
.page-projects .cpf-ph>div{position:relative;border-radius:12px;padding:30px 7px 7px;gap:2px}
.page-projects .cpf-ph i{color:#f09595;font-size:9px;white-space:normal}
.page-projects .cpf-ph em{position:absolute;top:30px;right:7px;display:grid;place-items:center;width:15px;height:15px;border-radius:50%;background:#f09595;color:#2b0d0d;font:700 9px/1 system-ui;font-style:normal;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.page-projects .cpf-ph small{position:absolute;left:7px;right:7px;bottom:9px;padding:3px 0;border-radius:6px;background:#341313;color:#f09595;font-size:8.5px;text-align:center}
.page-projects .cpf-flow:not(.is-run) li+li::before{transform:scaleX(0)}
.page-projects .cpf-flow:not(.is-run) i,.page-projects .cpf-flow:not(.is-run) .cpf-ph small{opacity:0;transform:translateY(4px)}
.page-projects .cpf-flow:not(.is-run) .cpf-ph em{transform:scale(0)}
.page-projects .cpf-flow.is-run :is(i,small,em),.page-projects .cpf-flow.is-run li+li::before{transition-delay:var(--d,0s)}
.page-projects #finance-tracker .f-badge.cpf-ping{animation:cpf-ping .8s 2}
@keyframes cpf-ping{40%{transform:scale(1.35);box-shadow:0 0 0 6px #f0959533}}
@media (prefers-reduced-motion: reduce){.page-projects .cpf-flow *,.page-projects .cpf-flow li::before{transition:none!important}.page-projects #finance-tracker .f-badge.cpf-ping{animation:none}}
.page-projects .cpn--lock{display:flex;align-items:flex-end;gap:18px}
.page-projects .cpn--lock figcaption{max-width:12rem;margin:0 0 .3rem}
.page-projects .cpl{flex:none;width:226px;height:468px;padding:7px;box-sizing:border-box;border-radius:34px;background:#050607;box-shadow:inset 0 0 0 1px #3b4047,0 24px 50px -24px color-mix(in srgb,var(--app) 60%,transparent)}
.page-projects .cpl-s{position:relative;height:100%;overflow:hidden;border-radius:28px;background:var(--wall);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;text-align:center}
.page-projects .cpl-s::before{content:"";position:absolute;top:8px;left:50%;width:62px;height:18px;margin-left:-31px;border-radius:10px;background:#000}
.page-projects .cpl-s p{margin:0;text-align:center!important;color:#fff!important}
.page-projects .cpl-s .cpl-d{margin-top:46px;font:600 12.5px/1.3 inherit;opacity:.85}
.page-projects .cpl-s .cpl-c{font:600 62px/1.05 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:-.02em}
.page-projects .cpl-n{position:absolute;left:8px;right:8px;bottom:34px;display:grid;gap:6px}
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

/* Finance: downloads, then the PC files and checks them, then the phone's read-only copy. Each line comes in on a
   delay (--d), so the steps read left to right; leaving the view resets them for the next visit. */
if (figs.finance) {
	const f = figs.finance, flow = $('.cpf-flow', f), still = matchMedia('(prefers-reduced-motion: reduce)');
	[...f.querySelectorAll('i, small, em, li')].forEach((e, n) => e.style.setProperty('--d', `${n * 0.22}s`));
	f.classList.add('is-on');
	let t;
	new IntersectionObserver(([e]) => {
		clearTimeout(t);
		flow.classList.toggle('is-run', e.isIntersecting);
		const b = $('#finance-tracker .f-badge');
		if (e.isIntersecting && b && !still.matches) t = setTimeout(() => { b.classList.remove('cpf-ping'); void b.offsetWidth; b.classList.add('cpf-ping'); }, 3600);
	}, { threshold: 0.6 }).observe(flow);
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
	if (chat) lock(figs.squash, chat, { wall: 'radial-gradient(120% 70% at 50% 0%,#3b6ea5,#1b3654 48%,#0b1622)', date: 'Friday 13 November', clock: '9:41', group: 'Squash',
		read: () => [...chat.querySelectorAll('.sq-m')].filter((m) => !/Court schedule/.test(m.textContent)).map((m) => {
			const lines = [...m.querySelectorAll('.sq-tx > div')].map(flat).filter(Boolean).join('\n');
			return [m.classList.contains('sq-m--me') ? 'DodgerBlueee' : 'SquashBot', lines];
		}) });
}
})();
