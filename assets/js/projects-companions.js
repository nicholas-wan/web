/* Companion devices on the Projects page (owner, 9 Nov 2026: "make the tabs more interesting - like how packing
   list showed a desktop view. see the paprika app", which shows each feature on another device). projects.js loads
   this on screens 1100px and up only, outside the page's 80 KB ceiling. Each one is decorative (inert, aria-hidden)
   and follows its phone demo live:
   - Finance: the tracker's desktop layout on a laptop (header, pill tabs, wide cards, the check drawer at the side),
     drawn from whatever the phone shows, with its amounts hidden when the phone hides them.
   - Nag-bot and SquashBot: another member's lock screen, where each new message in the chat arrives as a Telegram
     notification, newest on top. The pinned board is edited in place, so it never notifies. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const figs = { finance: $('.cpn[data-for=finance]'), nag: $('.cpn[data-for=nag]'), squash: $('.cpn[data-for=squash]') };
const ic = (id) => `<svg class="f-ic" aria-hidden="true"><use href="#fi-${id}"/></svg>`;
document.head.append(Object.assign(document.createElement('style'), { textContent: `
.page-projects .cpn{margin:1.6rem 0 0!important;padding:0;box-sizing:border-box}
.page-projects .cpn figcaption{margin:.55rem 0 0;font:400 .875rem/1.35 Archivo,system-ui,sans-serif;color:#9aa0a8;text-align:left}
.page-projects .cpn--laptop{max-width:540px;padding:0 10px}
.page-projects .cpn--laptop figcaption{margin-left:-10px}
.page-projects .cpn-lid{position:relative;padding:9px 9px 14px;border-radius:14px 14px 4px 4px;background:linear-gradient(#26282d,#1b1c20);box-shadow:inset 0 0 0 1px #34363c,0 24px 60px -18px color-mix(in srgb,var(--app) 45%,transparent)}
.page-projects .cpn-lid::before{content:"";position:absolute;top:4px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#3a3d43}
.page-projects .cpn-screen{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:3px;background:#161614}
.page-projects .cpn-base{position:relative;height:11px;margin:0 -10px;border-radius:0 0 10px 10px/0 0 9px 9px;background:linear-gradient(#3a3d43,#232529 55%,#17181b);box-shadow:0 10px 18px -10px #000}
.page-projects .cpn-base::before{content:"";position:absolute;top:0;left:50%;width:16%;height:4px;transform:translateX(-50%);border-radius:0 0 6px 6px;background:#17181b}
.page-projects .cpn .cpf .fd{position:absolute;inset:0 auto auto 0;width:880px;height:550px;transform-origin:0 0;display:block;background:radial-gradient(circle at 50% -260px,#26372fb8,#0000 640px),var(--bg)}
.page-projects .cpf-top{display:flex;align-items:center;gap:10px;height:52px;padding:0 28px;border-bottom:1px solid #ffffff0f}
.page-projects .cpf-top>b{font-size:15px;font-weight:650;color:var(--br)}
.page-projects .cpf-top .f-mark{width:28px;height:28px;font-size:15px}
.page-projects .cpf-sp{flex:1}
.page-projects .cpf-chip{display:flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--b);border-radius:8px;color:var(--t2);font-size:12.5px;font-weight:600}
.page-projects .cpf-chip .f-ic{width:15px;height:15px}
.page-projects .cpf-chip.is-on{border-color:var(--br);background:var(--tint);color:var(--br)}
.page-projects .cpf-tabs{display:flex;gap:4px;height:48px;align-items:center;padding:0 22px;border-bottom:1px solid var(--b)}
.page-projects .cpf-tabs span{display:flex;align-items:center;gap:7px;height:34px;padding:0 13px;border-radius:9px;color:var(--t2);font-size:14px;font-weight:600}
.page-projects .cpf-tabs .f-ic{width:16px;height:16px}
.page-projects .cpf-tabs .on{background:var(--tint);color:var(--br)}
.page-projects .cpf-main{height:450px;overflow:hidden;padding:18px 30px 0}
.page-projects .cpf-main .f-page{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px;align-items:start}
.page-projects .cpf-main .f-page>*{grid-column:1/-1}
.page-projects .cpf-main .f-page>:is(.f-list,.f-card){grid-column:auto}
.page-projects .cpf-main .f-title{margin:0 0 2px;font-size:24px}
.page-projects .cpf-main .f-worth{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);column-gap:30px;padding:18px 22px}
.page-projects .cpf-main .f-worth>*{grid-column:1}
.page-projects .cpf-main .f-spark{grid-column:2;grid-row:1/4;height:auto;min-height:92px;margin:0}
.page-projects .cpf-main .f-axis{grid-column:2;grid-row:4;margin:0;padding:4px 0 2px;background:none}
.page-projects .cpf-main .f-spark line{display:none}
.page-projects .cpf-drawer{position:absolute;top:0;right:0;bottom:0;width:330px;display:grid;align-content:start;gap:12px;padding:22px 20px;border-left:1px solid var(--b);background:var(--s);box-shadow:-20px 0 40px #00000059}
.page-projects .cpf-drawer[hidden]{display:none}
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
const on = (fig, html) => { fig.querySelector('.cpn-app,.cpl').innerHTML = html; fig.classList.add('is-on'); };

/* Finance: the phone's current page, laid out as the desktop app lays out the same tab. */
if (figs.finance) {
	const fd = $('#finance-tracker .fd'), screen = $('.cpn-screen', figs.finance);
	const TABS = [['overview', 'overview', 'Overview'], ['wealth', 'wallet', 'Wealth'], ['insurance', 'shield', 'Insurance'], ['home', 'home', 'Home'], ['activity', 'list', 'Activity']];
	if (fd) {
		on(figs.finance, '<div class="cpf app-demo--finance"><div class="fd"><div class="cpf-top"><span class="f-mark">N</span><b>Finances</b><span class="cpf-sp"></span><span class="cpf-chip">' + ic('up') + 'Share on Wi-Fi</span><span class="cpf-chip cpf-eye"></span></div><div class="cpf-tabs"></div><div class="cpf-main"></div><div class="cpf-drawer f-sheet" hidden></div></div></div>');
		const app = $('.cpf .fd', figs.finance), tabs = $('.cpf-tabs', app), main = $('.cpf-main', app), eye = $('.cpf-eye', app), drawer = $('.cpf-drawer', app);
		new ResizeObserver(() => { app.style.transform = `scale(${screen.clientWidth / 880})`; }).observe(screen);
		watch(fd, () => {
			const tab = ($('.f-tab[aria-pressed=true]', fd) || {}).dataset?.tab || 'overview', masked = fd.classList.contains('is-masked'), sheet = $('.f-sheet-wrap', fd);
			tabs.innerHTML = TABS.map(([k, i, n]) => `<span class="${k === tab ? 'on' : ''}">${ic(i)}${n}</span>`).join('');
			app.classList.toggle('is-masked', masked);
			eye.classList.toggle('is-on', masked);
			eye.innerHTML = ic(masked ? 'eye-off' : 'eye') + (masked ? 'Amounts hidden' : 'Hide amounts');
			main.innerHTML = $('.f-scroll', fd).innerHTML.replace(/ is-push/g, '');
			drawer.hidden = !sheet || sheet.hidden;
			if (!drawer.hidden) drawer.innerHTML = $('.f-sheet', fd).innerHTML;
		});
	}
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
