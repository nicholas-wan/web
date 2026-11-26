// Puts the Agentic AI card's "Hunt from a report" chart on Experience (docs/contracts/work.md "Agentic AI glance chart").
//   node tools/scenes/agentic-glance/build.cjs && node tools/scenes/agentic-glance/apply.cjs
// In experience.html, replaces the #agentic-ai card's peek (the internship-demo-peek, and a hint line before it as the
// pre-Nov 2026 markup had) with the chip, its hint and the card around scene-d.svg and scene-m.svg. In assets/css/internship-peek.css, writes scene.css
// between the agentic-glance markers (on the first run, the agentic-console markers it replaced).
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n').trim();
const sceneD = read('scene-d.svg'), sceneM = read('scene-m.svg'), css = read('scene.css');

// (data-fade: the replay is a 760 ms rewind, not the shared 240 ms fade; build.cjs's is-fading rules; data-spotlight: on
// phones the rest of the page dims once a tap has framed the card; data-dock: on a screen with a mouse a click opens the
// card in the page's flow, and its close button, .ag-close, folds it; internship-peek.js. The hint shares the chip's row:
// beside it on desktop, above it on phones and touch, CSS)
// the chip's thumbnail (the 26 Oct 2026 peek's: a report, its findings, a flag)
const MINI = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 24"><rect x="1.5" y="2.5" width="17" height="19" rx="2" fill="#0e2024" stroke="#3a6f73"/><path d="M4.5 7H15.5M4.5 10.5H12" stroke="#3a6f73" stroke-width="1.4" stroke-linecap="round"/><rect x="4" y="13" width="11" height="3" rx="1" fill="#28d7c5" opacity=".45"/><path d="M4.5 18.5H13" stroke="#3a6f73" stroke-width="1.4" stroke-linecap="round"/><path d="M21.5 12H26.5M24.5 10L26.5 12L24.5 14" fill="none" stroke="#6f9a96" stroke-linecap="round" stroke-linejoin="round"/><rect x="29.5" y="4.5" width="23" height="15" rx="2" fill="#071315" stroke="#24464b"/><path d="M32.5 9H44M32.5 12.5H49M32.5 16H40" stroke="#b8f2eb" stroke-width="1.3" stroke-linecap="round" opacity=".8"/><path d="M32.5 9H36.5M35.5 12.5H39" stroke="#28d7c5" stroke-width="1.3" stroke-linecap="round"/><path d="M55.5 12H60.5M58.5 10L60.5 12L58.5 14" fill="none" stroke="#6f9a96" stroke-linecap="round" stroke-linejoin="round"/><rect x="63" y="6" width="13" height="12" rx="2" fill="#ffb869"/><path d="M67 9V15M67 9.4H72L70.6 11L72 12.6H67" fill="none" stroke="#071315" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const CLOSE = '<button type="button" class="ag-close" aria-label="Close the chart"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>';
const peek = `<div class="internship-demo-peek" data-company="agentic" data-dock=""><div class="ag-row"><button type="button" class="internship-demo-peek__chip" aria-expanded="false" aria-controls="agentic-demo-card"><span class="internship-demo-peek__mini" aria-hidden="true">${MINI}</span>Hunt from a report</button>`
  + '<p class="internship-demo-hint"><strong><span class="anomaly-peek__hint-hover">Click the chart</span><span class="anomaly-peek__hint-touch">Tap the chart</span></strong> to see it in action</p></div>'
  + `<div class="internship-demo-card" id="agentic-demo-card" data-fade="760" data-spotlight="" inert="">${CLOSE}<div class="internship-demo-card__plot">${sceneD}${sceneM}</div></div></div>`;

// the element that starts at index i, through its matching close tag
function end(html, i) {
  const tag = html.slice(i).match(/^<(\w+)/)[1];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g'); re.lastIndex = i;
  let depth = 0, m;
  while ((m = re.exec(html))) { depth += m[1] ? -1 : 1; if (!depth) return re.lastIndex; }
  throw new Error('unclosed ' + tag);
}
const pageFile = path.join(root, 'experience.html');
let page = fs.readFileSync(pageFile, 'utf8');
const card = page.indexOf('id="agentic-ai"'), stop = page.indexOf('</article>', card);
if (card < 0 || stop < 0) throw new Error('no #agentic-ai card in experience.html');
const wrap = page.indexOf('<div class="internship-demo-peek" data-company="agentic"', card);
if (wrap < 0 || wrap > stop) throw new Error('no agentic peek to replace in the #agentic-ai card');
const hint = page.indexOf('<p class="internship-demo-hint">', card), from = hint >= 0 && hint < wrap ? hint : wrap;
page = page.slice(0, from) + peek + page.slice(end(page, wrap));
fs.writeFileSync(pageFile, page);

const file = path.join(root, 'assets', 'css', 'internship-peek.css');
let sheet = fs.readFileSync(file, 'utf8');
const START = '/* agentic-glance:start */', STOP = '/* agentic-glance:end */';
if (!sheet.includes(START)) sheet = sheet.replace('/* agentic-console:start */', START).replace('/* agentic-console:end */', STOP);
if (!sheet.includes(START) || !sheet.includes(STOP)) throw new Error('no agentic markers in internship-peek.css');
const block = `${START}\n/* Generated by tools/scenes/agentic-glance (build.cjs, then apply.cjs): edit there and rerun. */\n${css}\n${STOP}`;
fs.writeFileSync(file, sheet.slice(0, sheet.indexOf(START)) + block + sheet.slice(sheet.indexOf(STOP) + STOP.length));
console.log('agentic glance chart applied:', page.length, 'bytes of page,', css.length, 'bytes of CSS');
