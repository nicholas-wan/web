// The Agentic AI story on Experience (prefix hs-): three short pinned chapters in the dark #agentic-ai card.
//   node tools/scenes/agentic-story/build.cjs        writes the story's markup into experience.html
//   node tools/scenes/agentic-console/apply.cjs      then (re)fills the console inside chapter 02
// Approved 27 Oct 2026 as mockup E3 (lab/scrolly/e); see README "Agentic AI story". The story runs from the
// outside world, into the system, and back to people, two frames a chapter:
//   01 Understanding the work    "From a report to a plan."   the card's dark      report, techniques, hypothesis
//   02 Engineering choices       "Built for a local model."   a deeper near-black  the console, then one small diagram
//   03 Keeping people in charge  "Analysts make the call."    the one switch, to the site's warm light
// This file owns the story's words, objects, diagram and the chapter-02 timeline (from the console's beat
// times, checked against tools/scenes/agentic-console/scene.html, so a console change that moves them fails
// here). It replaces the existing .hs-story block (or, the first time, the old chip peek) and the inline
// loader after it, keeping the console panel already in the page; apply.cjs owns that panel's contents.
// Styles: the hand-written "Agentic AI story" section of assets/css/internship-peek.css. Script:
// assets/js/hunt-story.js, injected on demand by the inline loader (outside the 80 KB <script src> ceiling).
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const r3 = v => +(+v).toFixed(3);

// ---------------------------------------------------------------- the console's story times
// Same formulas as tools/scenes/agentic-console/build.cjs (desktop timeline; phones add 0.4s per caption
// hold); checked below against the --Ld/--Lp values that build writes into scene.html.
const GAP = 0.2, TOOL = 0.55, TRAVEL = 0.55, HOLD = [3.4, 3.4, 3.2, 3.5, 0, 3.3];
const E = [{}, { wipe: 1.3 }, {}, {}, {}, { wipe: 1.0 }, {}, {}];
const cap = [], T0 = {};
E[0].L = 1.1; E[0].D = E[0].L + TOOL; cap[0] = E[0].D + 0.15;
E[1].L = cap[0] + HOLD[0] + GAP; E[1].R = E[1].L + E[1].wipe; cap[1] = E[1].R + 0.1;
E[2].L = cap[1] + HOLD[1] + GAP; E[2].D = E[2].L + TOOL; cap[2] = E[2].D + 0.12;
E[3].L = cap[2] + HOLD[2] + GAP; E[3].D = E[3].L + TOOL; cap[3] = E[3].D + 0.12;
E[4].L = cap[3] + HOLD[3] + GAP; E[4].D = E[4].L + 0.6; cap[4] = E[4].D + 0.12;
T0.LOOP = [E[4].D + 1.05, E[4].D + 1.95];
E[5].L = T0.LOOP[1] + 0.4; E[5].R = E[5].L + E[5].wipe;
E[6].L = E[5].R + 1.6; E[6].D = E[6].L + 0.65; cap[5] = E[6].D + 0.12;
E[7].L = cap[5] + HOLD[5] + GAP; E[7].D = E[7].L + 0.55;
cap[6] = E[7].D + 0.65;
T0.HUSH = cap[6] + 2.5; T0.ANA = T0.HUSH + 0.25 + 0.9 - 0.15; cap[7] = T0.ANA;
const PH = 0.4;
const TPh = t => { let s = 0; for (const c of cap) if (c + 0.3 < t - 1e-9) s += PH; return r3(t + s); };
// Each console beat: P = its action starts, R = its result has settled. The console's own captions are
// hidden in the story, so the holds between one beat's R and the next one's P are skipped by the clock.
const P = [0, E[1].L - 1.15, E[2].L - 1.15, E[3].L - 1.15, E[4].L - TRAVEL, E[6].L - TRAVEL, E[7].L - TRAVEL, T0.HUSH];
const R = [E[0].D + 0.75, cap[1] + 0.25, E[2].D + 0.5, E[3].D + 0.5, E[5].R + 0.3, cap[5] + 0.25, cap[6] + 0.3, T0.ANA + 1.5];

const scene = fs.readFileSync(path.join(ROOT, 'tools', 'scenes', 'agentic-console', 'scene.html'), 'utf8');
for (let i = 0; i < 8; i++) {
  const m = scene.match(new RegExp(`c2-s${i}\\b[^"]*" style="--Ld:([\\d.]+)s;--Lp:([\\d.]+)s`));
  if (!m || Math.abs(+m[1] - E[i].L) > 0.002 || Math.abs(+m[2] - TPh(E[i].L)) > 0.002) throw new Error(`console timing drift at entry ${i}: ${m && m.slice(1)} vs ${r3(E[i].L)}/${TPh(E[i].L)}; update the formulas above`);
}

// ---------------------------------------------------------------- icons (12x12 line icons)
const ico = (d, c = '') => `<svg class="hs-i${c}" viewBox="0 0 12 12" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  doc: 'M3 1.5h4.2L9.5 3.8v6.7H3zM7 1.5v2.5h2.5M4.6 6.3h3.2M4.6 8.2h2.2',
  flask: 'M4.4 1.5h3.2M5 1.6v3L2.4 9.4a.8.8 0 0 0 .7 1.1h5.8a.8.8 0 0 0 .7-1.1L7 4.6v-3M3.6 7.4h4.8',
  hist: 'M2.1 6a3.9 3.9 0 1 0 1.2-2.8M2 1.8v1.7h1.7M6 3.9V6l1.4 1',
  db: 'M2.5 3c0-.8 1.6-1.4 3.5-1.4s3.5.6 3.5 1.4S7.9 4.4 6 4.4 2.5 3.8 2.5 3zM2.5 3v6c0 .8 1.6 1.4 3.5 1.4s3.5-.6 3.5-1.4V3M2.5 6c0 .8 1.6 1.4 3.5 1.4S9.5 6.8 9.5 6',
  shield: 'M6 1.2 2.3 2.6v3c0 2.3 1.5 4.1 3.7 5.1 2.2-1 3.7-2.8 3.7-5.1v-3zM4.3 6l1.2 1.2 2.2-2.3',
  check: 'M2.6 6.3l2.1 2.1 4.7-4.8',
  flag: 'M3 10.6V1.6M3 2h5.6L7.3 3.9l1.3 1.9H3',
  person: 'M6 5.6a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2zM2.2 10.8c.4-2.1 1.9-3.3 3.8-3.3s3.4 1.2 3.8 3.3',
  down: 'M6 2v8M3 7l3 3 3-3',
  trace: 'M1.5 9.5h2l1.5-5 2 6 1.5-4h2',
};
const chip = (id, name, c = '') => `<span class="hs-chip${c}"><code>${id}</code>${name}</span>`;

// ---------------------------------------------------------------- the design (chapter 02's last frame)
// One small diagram, drawn twice (wide, and tall for phones): an on-premises boundary, the agents' loop
// around a local model, the tools they work through, and a traces-and-evaluation line.
const tick = (x, y, s) => `<path class="hs-a-ico" transform="translate(${x} ${y}) scale(${s})" d="${I.check}"/>`;
const ring = (cx, cy, r, lab) => `<g class="hs-a-loop">`
  + `<circle class="hs-a-ring" cx="${cx}" cy="${cy}" r="${r}" pathLength="1" transform="rotate(-90 ${cx} ${cy})"/>`
  + [[0, -r], [r, 0], [0, r], [-r, 0]].map(([dx, dy]) => `<circle class="hs-a-stn" cx="${cx + dx}" cy="${cy + dy}" r="6"/>`).join('')
  + lab.map(([t, x, y, a]) => `<text class="hs-a-step" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`).join('')
  + `<text class="hs-a-model" x="${cx}" y="${cy + 7}" text-anchor="middle">Local model</text></g>`
  + `<g class="hs-a-orbit" style="transform-origin:${cx}px ${cy}px"><circle class="hs-a-glow" cx="${cx}" cy="${cy - r}" r="15"/><circle class="hs-a-dot" cx="${cx}" cy="${cy - r}" r="6.5"/></g>`;
const pill = (x, y, w, h, t, i, n) => `<g class="hs-a-tool hs-a-t${n}"><rect class="hs-a-pill" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/><rect class="hs-a-hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>`
  + `<path class="hs-a-ico" transform="translate(${x + 18} ${y + h / 2 - 8}) scale(1.35)" d="${i}"/><text class="hs-a-tl" x="${x + 46}" y="${y + h / 2 + 5.5}">${t}</text></g>`;
const bound = (x, y, w, h, rx, lx) => `<rect class="hs-a-bound" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" pathLength="1"/>`
  + `<g class="hs-a-onprem"><rect x="${lx}" y="${y - 15}" width="150" height="30" rx="15"/><text x="${lx + 75}" y="${y + 5}" text-anchor="middle">On-premises</text></g>`;
const band = (x1, x2, y, lx, ly) => `<text class="hs-a-bl" x="${lx}" y="${ly}">Traces and evaluation</text><g class="hs-a-band"><line class="hs-a-line" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`
  + `<circle class="hs-a-eval" cx="${x2 + 22}" cy="${y}" r="15"/>${tick(x2 + 13, y - 9, 1.5)}`
  + [0, 1, 2].map(i => `<circle class="hs-a-flow hs-a-f${i}" cx="${x1}" cy="${y}" r="3.5" style="--x:${x2 - x1}px"/>`).join('') + `</g>`;
const STEPS4 = (cx, cy, r) => [['Plan', cx, cy - r + 32, 'middle'], ['Act', cx + r - 16, cy + 5, 'end'], ['Observe', cx, cy + r - 22, 'middle'], ['Adjust', cx - r + 16, cy + 5, 'start']];
// Phones: Act and Adjust sit outside the ring, so they clear "Local model" (review, 27 Oct 2026).
const STEPS4T = (cx, cy, r) => [['Plan', cx, cy - r + 32, 'middle'], ['Act', cx + r + 12, cy + 5, 'start'], ['Observe', cx, cy + r - 22, 'middle'], ['Adjust', cx - r - 12, cy + 5, 'end']];
const WIDE = `<svg class="hs-dia-w" viewBox="0 0 760 450" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
  + bound(12, 24, 736, 410, 30, 40)
  + ring(280, 210, 142, STEPS4(280, 210, 142))
  + `<path class="hs-a-wire hs-a-wt" d="M428 210C478 210 474 156 520 156M428 210C478 210 474 264 520 264"/>`
  + pill(520, 130, 196, 52, 'Log search', I.db, 0) + pill(520, 238, 196, 52, 'Memory', I.hist, 1)
  + `<path class="hs-a-wire hs-a-drop" d="M280 358V388M618 290V388"/>`
  + band(56, 680, 388, 56, 374)
  + `</svg>`;
const TALL = `<svg class="hs-dia-t" viewBox="0 0 360 456" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
  + bound(6, 20, 348, 428, 24, 24)
  + ring(180, 168, 104, STEPS4T(180, 168, 104))
  + `<path class="hs-a-wire hs-a-wt" d="M180 286C180 300 96 298 96 314M180 286C180 300 264 298 264 314"/>`
  + pill(20, 314, 152, 46, 'Log search', I.db, 0) + pill(188, 314, 152, 46, 'Memory', I.hist, 1)
  + `<path class="hs-a-wire hs-a-drop" d="M180 360V404"/>`
  + band(28, 296, 404, 28, 390)
  + `</svg>`;
const DIA = `<figure class="hs-dia" role="img" aria-label="It runs on-premises. The agents loop around a local model: plan, act, observe, adjust. They work through log search and memory, and the traces feed evaluation.">${WIDE}${TALL}</figure>`;

// ---------------------------------------------------------------- each chapter's objects
const OBJ_1 = `<div class="hs-objs hs-objs--1"><div class="hs-src">`
  + `<div class="hs-doc"><p class="hs-lab">${ico(I.doc)}Ransomware report</p>`
  + `<p class="hs-doc-t">After gaining access, the operators <mark class="hs-m0">create a scheduled task</mark> that relaunches the payload at logon. They <mark class="hs-m1">run PowerShell</mark> to stage their tools, and <mark class="hs-m2">add a Run key</mark> so it survives a reboot.</p>`
  + `<span class="hs-doc-l" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`
  + `<p class="hs-chips">${chip('T1053.005', 'Scheduled Task', ' hs-c0')}${chip('T1059.001', 'PowerShell', ' hs-c1')}${chip('T1547.001', 'Registry Run Keys', ' hs-c2')}</p></div>`
  + `<div class="hs-card hs-hyp"><p class="hs-lab hs-lab--hyp">${ico(I.flask)}Hypothesis</p>`
  + `<p class="hs-hyp-t">An adversary may persist on workstations via scheduled tasks that relaunch the payload at logon.</p></div></div>`;
// The query is a neutral pseudo-query (the console's own, 27 Oct 2026), so no SIEM vendor is named.
const OBJ_2 = `<div class="hs-objs hs-objs--2">`
  + `<div class="hs-card hs-o2"><p class="hs-was">Scheduled tasks <span>Inconclusive</span></p><p class="hs-lab">${ico(I.down)}New plan</p>`
  + `<code class="hs-q">event_id = 4698<br>| count by host, task_name</code><p class="hs-res hs-res--ok">${ico(I.shield)}Checked</p></div>`
  + DIA + `</div>`;
const TRACE = [['Read the report'], ['Wrote a hypothesis'], ['Checked past hunts'], ['Ran the searches'], ['Re-planned one search and checked it'], ['Flagged a lead', 'amb'], ['Analyst review', 'open']];
// The trace first, then the lead handed to the analyst: the story ends on a person (27 Oct 2026).
const OBJ_3 = `<div class="hs-objs hs-objs--3">`
  + `<div class="hs-card hs-trace"><p class="hs-lab">${ico(I.trace)}Trace</p><ol>${TRACE.map(([t, k], i) => `<li class="hs-tr${k ? ' hs-tr--' + k : ''}" style="--i:${i}">${ico(k === 'open' ? I.person : k === 'amb' ? I.flag : I.check)}<span>${t}</span>${k === 'open' ? '<em>Open</em>' : ''}</li>`).join('')}</ol></div>`
  + `<div class="hs-hand">`
  + `<div class="hs-card hs-lead"><p class="hs-lead-top"><span class="hs-lab">${ico(I.flag)}Lead</span><span class="hs-badge">Flagged</span></p>`
  + `<p class="hs-lead-n">\\WinTaskUpdate</p><p class="hs-tags"><span>root-level</span><span>not in baseline</span></p>`
  + `<div class="hs-ev"><p class="hs-lab">Evidence</p>${chip('T1053.005', 'Scheduled Task')}<p class="hs-ev-q"><code>event_id = 4698</code><span>${ico(I.check)}Checked</span></p></div></div>`
  + `<span class="hs-link" aria-hidden="true"></span>`
  + `<div class="hs-seat"><span class="hs-ava">${ico(I.person)}</span><span class="hs-seat-t"><b>Analyst</b><span>Judges the lead</span></span></div></div></div>`;

// ---------------------------------------------------------------- the chapters (owner-approved copy, 27 Oct 2026)
const CH = [
  // Copy revised 27 Oct 2026 (content review; owner-approved): 01's line anchors on the analyst's workflow, 02 ends
  // on evaluation, and 03 ends on the analyst rather than the log. No team, funding or stakeholder claims here.
  { id: 'product', n: '01', label: 'Understanding the work', title: 'From a report to a plan.', line: 'An illustrative hunt, built around how analysts plan one.', objs: OBJ_1,
    frames: [
      { h: 'Only what’s worth hunting goes in.', p: 'Models reason best over short, focused input, so the agent pulls out just the techniques worth hunting.' },
      { h: 'Each technique becomes a hypothesis.', p: 'A claim a hunt can test.' },
    ] },
  { id: 'eng', n: '02', label: 'Engineering choices', title: 'Built for a local model.', line: 'Each choice keeps the model’s job narrow.', console: true, objs: OBJ_2,
    frames: [
      // hold: this frame's dwell in screens (others 0.6). The console's 8s run needs the reader to linger: at
      // 0.6 a steady scroll or one Page Down left it after about a second (review, 27 Oct 2026).
      { beats: [1, 2, 3, 4, 5], dur: 8, hold: 1.4, h: 'Each agent has one narrow job.', p: 'Past hunts are checked first. Searches run where the data lives and return only a short result, and each query is checked before it runs.' },
      { beats: [], dur: 1, h: 'Every run is measured.', p: 'Traces from each hunt feed evaluation, so changes to the agents are tested, not assumed.' },
    ] },
  { id: 'trust', n: '03', label: 'Keeping people in charge', title: 'Analysts make the call.', line: 'Analyst review points are part of the design.', objs: OBJ_3, amber: true,
    frames: [
      { h: 'Every step is logged.', p: 'So any lead can be traced back and reviewed.' },
      { h: 'Each lead comes with its evidence.', p: 'An analyst judges every one.' },
    ] },
];

// ---------------------------------------------------------------- page
const FILE = path.join(ROOT, 'experience.html');
let page = fs.readFileSync(FILE, 'utf8');
const block = (src, at) => {   // the <div> starting at `at`, matched by depth
  const re = /<div\b|<\/div>/g; re.lastIndex = at; let d = 0, m;
  while ((m = re.exec(src))) { d += m[0] === '</div>' ? -1 : 1; if (!d) return src.slice(at, m.index + 6); }
  throw new Error('unclosed block');
};
const card = page.indexOf('id="agentic-ai"'), cardEnd = page.indexOf('</article>', card);
if (card < 0) throw new Error('no #agentic-ai card in experience.html');
let from = page.indexOf('<div class="hs-story"', card), to;
if (from > 0 && from < cardEnd) {
  to = from + block(page, from).length;
  const loaderAt = page.indexOf('<script>', to);
  if (loaderAt >= 0 && loaderAt < cardEnd && /^\s*$/.test(page.slice(to, loaderAt))) to = page.indexOf('</script>', loaderAt) + 9;
} else {
  // first run: the retired chip peek (call to action, chip and docked card)
  from = page.indexOf('<p class="internship-demo-hint">', card);
  const peekAt = page.indexOf('<div class="internship-demo-peek" data-company="agentic">', card);
  if (from < 0 || peekAt < 0 || peekAt > cardEnd) throw new Error('neither the story nor the old agentic peek is in the #agentic-ai card');
  to = peekAt + block(page, peekAt).length;
}
// keep the console that apply.cjs placed (an empty slot until it runs)
const old = page.slice(from, to), panelAt = old.indexOf('<div class="hunt-panel">');
const panel = panelAt >= 0 ? block(old, panelAt) : '<div class="hunt-panel"></div>';

const arrow = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
let html = '';
CH.forEach(c => {
  const id = `hs-${c.id}-t`;
  let story = { n: c.frames.length };
  if (c.console) {
    const tl = T => {
      let last = T(R[0]);
      const end = c.frames.map(f => (last = f.beats.length ? T(R[f.beats[f.beats.length - 1]]) : last));
      return { live: [1, 2, 3, 4, 5, 6, 7].map(b => [T(P[b]), T(R[b])]), end };
    };
    story = { narrow: 480, dur: c.frames.map(f => f.dur), d: tl(r3), p: tl(TPh) };
  }
  if (c.frames.some(f => f.hold)) story.hold = c.frames.map(f => f.hold || 0);
  const steps = c.frames.map(f => `<li class="hs-step"><p class="hs-h">${f.h}</p><p class="hs-p">${f.p}</p></li>`).join('');
  const dots = c.frames.map(f => `<button type="button" class="hs-dot" aria-label="${f.h.replace(/<[^>]+>/g, '').replace(/\.$/, '')}"></button>`).join('');
  html += `<div class="hs-ch hs-ch--${c.id}">`
    + `<header class="hs-chead"><p class="hs-clabel"><i>${c.n}</i> ${c.label}</p><h3 class="hs-ctitle" id="${id}">${c.title}</h3><p class="hs-cline">${c.line}</p></header>`
    + `<section class="hs-scene hs-scene--${c.id}${c.amber ? ' is-amb' : ''}" aria-labelledby="${id}" data-hs-story='${JSON.stringify(story)}'>`
    + `<div class="hs-stage"><div class="hs-frame">`
    + `<div class="hs-side"><ol class="hs-steps">${steps}</ol>`
    + `<div class="hs-nav"><button type="button" class="hs-btn hs-prev" aria-label="Previous step">${arrow('M13 8H3.5M7.5 4 3.5 8l4 4')}</button><span class="hs-dots">${dots}</span><button type="button" class="hs-btn hs-next" aria-label="Next step">${arrow('M3 8h9.5M8.5 4l4 4-4 4')}</button></div></div>`
    + `<div class="hs-console">${c.console ? panel : ''}${c.objs}</div>`
    + `<div class="hs-bar" aria-hidden="true"><span class="hs-fill"></span></div>`
    + `</div></div></section></div>`;
});
// The story's script is not a <script src> (the page's JavaScript stays under its 80 KB ceiling): this
// loader injects it once the story is a screen away. build.ps1 versions the data-hs-script URL.
const loader = `<script>/* Loads the Agentic AI story's script on demand (tools/scenes/agentic-story). */(function(){var s=document.querySelector('.hs-story');if(!s||!s.getAttribute('data-hs-script'))return;var go=function(){if(s.hsLoaded)return;s.hsLoaded=1;var j=document.createElement('script');j.src=s.getAttribute('data-hs-script');document.head.appendChild(j)};if(!('IntersectionObserver'in window))return go();var o=new IntersectionObserver(function(e){if(e.some(function(x){return x.isIntersecting})){o.disconnect();go()}},{rootMargin:'100% 0px'});o.observe(s)})();</script>`;
const story = `<div class="hs-story" data-hs-script="assets/js/hunt-story.js">${html}</div>${loader}`;
page = page.slice(0, from) + story + page.slice(to);
fs.writeFileSync(FILE, page);
console.log('agentic story written:', story.length, 'bytes', panelAt >= 0 ? '(console kept)' : '(empty console slot: run tools/scenes/agentic-console/apply.cjs)');
