// The Agentic AI story on Experience (prefix hs-): three short pinned chapters in the dark #agentic-ai card.
//   node tools/scenes/agentic-story/build.cjs        writes the story's markup into experience.html
//   node tools/scenes/agentic-console/apply.cjs      then (re)fills the console inside chapter 02
// Approved 27 Oct 2026 as mockup E3 (lab/scrolly/e); re-aimed 28 Oct 2026 as mockup H (lab/scrolly/h) so each
// chapter sells one capability from the CV; see README "Agentic AI story". The story runs from the analyst,
// into the design, to the model, and back to the analyst:
//   01 Understanding the analyst   "Built around how analysts plan."  the card's dark      report, techniques, environment, hypothesis
//   02 Designing the workflow      "Each step has one job."           a deeper near-black  the console, then the workflow map and one run
//   03 Making a local model work   "Give the model less to read."     the one switch, to the site's warm light
// This file owns the story's words, objects, the map and the chapter-02 timeline (from the console's beat
// times, checked against tools/scenes/agentic-console/scene.html, so a console change that moves them fails
// here). It replaces the existing .hs-story block and the inline loader after it, keeping the console panel
// already in the page; apply.cjs owns that panel's contents.
// Styles: the hand-written "Agentic AI story" section of assets/css/internship-peek.css. Script:
// assets/js/hunt-story.js, injected on demand by the inline loader (outside the 80 KB <script src> ceiling).
// Objects a frame has not reached carry data-hs-late="N"; an element with data-hs-from="sel" starts on that
// element (the engine measures the offset), so chips and facts are pulled from their source by the scroll.
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
  env: 'M2 9.5h8M3 9.5V5l3-2.5L9 5v4.5M5 9.5V7h2v2.5',
  ctx: 'M2.5 2.5h7v7h-7zM4.5 5h3M4.5 7h2',
};
const chip = (id, name, c = '', from = '') => `<span class="hs-chip${c}"${from ? ` data-hs-from="${from}"` : ''}><code>${id}</code>${name}</span>`;

// ---------------------------------------------------------------- 01: the report, its techniques, this environment, the hypothesis
// The environment rows are illustrative (what is logged, which assets, a baseline, a past hunt); the hypothesis
// is scoped by three of them, pulled from the card into its scope row.
const FACTS = ['Task creation events', 'Workstations', 'Task baseline'];
const OBJ_1 = `<div class="hs-objs hs-objs--1"><div class="hs-src">`
  + `<div class="hs-doc"><p class="hs-lab">${ico(I.doc)}Ransomware report</p>`
  + `<p class="hs-doc-t">After gaining access, the operators <mark class="hs-m0">create a scheduled task</mark> that relaunches the payload at logon. They <mark class="hs-m1">run PowerShell</mark> to stage their tools, and <mark class="hs-m2">add a Run key</mark> so it survives a reboot.</p>`
  + `<span class="hs-doc-l" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`
  + `<p class="hs-chips">${chip('T1053.005', 'Scheduled Task', ' hs-c0', '.hs-m0')}${chip('T1059.001', 'PowerShell', ' hs-c1', '.hs-m1')}${chip('T1547.001', 'Registry Run Keys', ' hs-c2', '.hs-m2')}</p></div>`
  + `<div class="hs-card hs-env" data-hs-late="1"><p class="hs-lab">${ico(I.env)}This environment</p><dl class="hs-env-l">`
  + `<div><dt>Logs</dt><dd><span class="hs-e0">${FACTS[0]}</span> kept</dd></div>`
  + `<div><dt>Assets</dt><dd><span class="hs-e1">${FACTS[1]}</span> in scope</dd></div>`
  + `<div><dt>Known</dt><dd><span class="hs-e2">${FACTS[2]}</span> for scheduled tasks</dd></div>`
  + `<div class="hs-env-dim"><dt>Hunts</dt><dd>PowerShell: covered by a recent hunt</dd></div></dl></div>`
  + `<div class="hs-card hs-hyp" data-hs-late="2"><p class="hs-lab hs-lab--hyp">${ico(I.flask)}Hypothesis</p>`
  + `<p class="hs-hyp-t">An adversary may persist on workstations via scheduled tasks that relaunch the payload at logon.</p>`
  + `<p class="hs-scope"><span class="hs-scope-l">Scoped to</span>${FACTS.map((t, i) => `<span class="hs-fact hs-f${i}" data-hs-from=".hs-e${i}">${t}</span>`).join('')}</p></div></div>`;

// ---------------------------------------------------------------- 02: the console, then the workflow map
// The steps and the two decisions the workflow makes: an inconclusive search goes back to planning, and a lead
// goes to a person. Drawn by the scroll; in the last frame one hunt runs the path, loop included. The run is on
// the loop's own corners, and the dot sits under the pills in DOM order, so it slides beneath them.
const node = (x, y, w, t, k, amb) => `<g class="hs-w-node hs-w-n${k}${amb ? ' hs-w-amb' : ''}"><rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" rx="22"/><text x="${x}" y="${y + 5.5}" text-anchor="middle">${t}</text></g>`;
const STEPS = ['Plan', 'Past hunts', 'Search', 'Check', 'Lead', 'Analyst review'];
const WIDE = (() => {
  const y1 = 130, y2 = 300, X = [100, 290, 480], W = 150;
  const main = `M${X[0] + W / 2} ${y1}H${X[1] - W / 2}M${X[1] + W / 2} ${y1}H${X[2] - W / 2}M${X[2]} ${y1 + 22}V${y2 - 22}M${X[2] - W / 2} ${y2}H${X[1] + W / 2}M${X[1] - W / 2} ${y2}H${X[0] + W / 2}`;
  const loop = `M${X[2]} ${y1 - 22}V${y1 - 80}H${X[0]}V${y1 - 22}`;
  const run = `M${X[0]} ${y1}H${X[2]}V${y1 - 80}H${X[0]}V${y1}H${X[2]}V${y2}H${X[0]}`;
  return `<svg class="hs-w hs-w-wide" viewBox="0 20 580 320" aria-hidden="true">`
    + `<path class="hs-w-line" pathLength="1" d="${main}"/>`
    + `<path class="hs-w-loop" pathLength="1" d="${loop}"/><text class="hs-w-ll" x="290" y="${y1 - 88}" text-anchor="middle">Inconclusive · re-plan</text>`
    + `<circle class="hs-w-glow" r="11" style="offset-path: path('${run}')"/><circle class="hs-w-dot" r="4.5" style="offset-path: path('${run}')"/>`
    + node(X[0], y1, W, STEPS[0], 0) + node(X[1], y1, W, STEPS[1], 1) + node(X[2], y1, W, STEPS[2], 2)
    + node(X[2], y2, W, STEPS[3], 3) + node(X[1], y2, W, STEPS[4], 4) + node(X[0], y2, W, STEPS[5], 5, 1)
    + `</svg>`;
})();
const TALL = (() => {
  const X = 180, Y = [60, 130, 200, 270, 340, 410], W = 190;
  const main = Y.slice(0, -1).map((y, i) => `M${X} ${y + 20}V${Y[i + 1] - 20}`).join('');
  const loop = `M${X + 95} ${Y[2]}H${X + 150}V${Y[0]}H${X + 95}`;
  const run = `M${X} ${Y[0]}V${Y[2]}H${X + 150}V${Y[0]}H${X}V${Y[5]}`;
  return `<svg class="hs-w hs-w-tall" viewBox="0 0 360 456" aria-hidden="true">`
    + `<path class="hs-w-line" pathLength="1" d="${main}"/>`
    + `<path class="hs-w-loop" pathLength="1" d="${loop}"/><text class="hs-w-ll" x="${X + 150}" y="${Y[1] + 4}" text-anchor="middle" transform="rotate(90 ${X + 150} ${Y[1]})">Inconclusive · re-plan</text>`
    + `<circle class="hs-w-glow" r="10" style="offset-path: path('${run}')"/><circle class="hs-w-dot" r="4" style="offset-path: path('${run}')"/>`
    + STEPS.map((t, i) => node(X, Y[i], W, t, i, i === 5)).join('')
    + `</svg>`;
})();
const MAP = `<figure class="hs-wmap" role="img" data-hs-late="1" aria-label="The workflow: plan, past hunts, search, check, lead, analyst review. An inconclusive search goes back to planning; a lead goes to a person.">${WIDE}${TALL}</figure>`;
// The query is a neutral pseudo-query (the console's own, 27 Oct 2026), so no SIEM vendor is named.
const OBJ_2 = `<div class="hs-objs hs-objs--2">`
  + `<div class="hs-card hs-o2"><p class="hs-was">Scheduled tasks <span>Inconclusive</span></p><p class="hs-lab">${ico(I.down)}New plan</p>`
  + `<code class="hs-q">event_id = 4698<br>| count by host, task_name</code><p class="hs-res hs-res--ok">${ico(I.shield)}Checked</p></div>`
  + MAP + `</div>`;

// ---------------------------------------------------------------- 03: what the model reads, then the analyst
const CTX = [['Hypothesis', 'Persistence via scheduled tasks on workstations', I.flask], ['Environment', 'Task creation events kept · workstations', I.env], ['Past hunts', 'PowerShell covered recently', I.hist], ['Last result', 'Only expected entries', I.db]];
const OBJ_3 = `<div class="hs-objs hs-objs--3">`
  + `<div class="hs-ctxw" data-hs-late="0"><div class="hs-tele" aria-hidden="true"><p class="hs-lab">${ico(I.db)}Telemetry</p><span class="hs-tele-l">${'<i></i>'.repeat(14)}</span><p class="hs-tele-n">Searched where it lives; never read whole</p></div>`
  + `<div class="hs-card hs-ctx"><p class="hs-lab">${ico(I.ctx)}Context for one step</p><ul>${CTX.map(([k, v, ic], i) => `<li style="--i:${i}">${ico(ic)}<b>${k}</b><span>${v}</span></li>`).join('')}</ul></div></div>`
  + `<div class="hs-hand" data-hs-late="1">`
  + `<div class="hs-card hs-lead"><p class="hs-lead-top"><span class="hs-lab">${ico(I.flag)}Lead</span><span class="hs-badge">Flagged</span></p>`
  + `<p class="hs-lead-n">\\WinTaskUpdate</p><p class="hs-tags"><span>root-level</span><span>not in baseline</span></p>`
  + `<div class="hs-ev"><p class="hs-lab">Evidence</p>${chip('T1053.005', 'Scheduled Task')}<p class="hs-ev-q"><code>event_id = 4698</code><span>${ico(I.check)}Checked</span></p></div></div>`
  + `<span class="hs-link" aria-hidden="true"></span>`
  + `<div class="hs-seat"><span class="hs-ava">${ico(I.person)}</span><span class="hs-seat-t"><b>Analyst</b><span>Judges the lead</span></span></div></div>`
  + `<p class="hs-evl" data-hs-late="1">${ico(I.trace)}Traces from every hunt feed evaluation ${ico(I.check)}</p></div>`;

// ---------------------------------------------------------------- the chapters (owner-approved copy, 28 Oct 2026)
// Each chapter sells one capability from the CV, in headlines that state a decision (copy review, 28 Oct 2026).
// The environment claims are the owner's ("accurate as written"). No team, funding or stakeholder claims here.
const CH = [
  // Headlines carry the terms AI product roles name (research, 28 Oct 2026: evals, guardrails and human review,
  // orchestration, tool access, traces, context engineering, grounding), in plain words; never "RAG",
  // "autonomous" or "memory", which would overclaim.
  { id: 'product', n: '01', label: 'Understanding the analyst', title: 'Grounded in how analysts plan.', line: 'An illustrative hunt, built around how analysts plan one.', objs: OBJ_1,
    frames: [
      { h: 'The input is scoped before the model sees it.', p: 'Models reason best over short, focused input, so the agent pulls out just the techniques worth hunting.' },
      { h: 'Grounded in what this environment logs.', p: 'A hypothesis is only testable where the data exists. What this environment logs, and what is normal here, comes before any hypothesis.' },
      { h: 'Each technique becomes a testable hypothesis.', p: 'A claim a hunt can test.' },
    ] },
  { id: 'eng', n: '02', label: 'Designing the workflow', title: 'Narrow agents, one supervisor.', line: 'Two decisions shaped it: when to re-plan, and when a person steps in.', console: true, objs: OBJ_2,
    frames: [
      // hold: this frame's dwell in screens (others 0.6). The console's 8s run needs the reader to linger: at
      // 0.6 a steady scroll or one Page Down left it after about a second (review, 27 Oct 2026).
      { beats: [1, 2, 3, 4, 5], dur: 8, hold: 1.4, h: 'Each agent gets one job and the tools for it.', p: 'Past hunts are checked first. Searches run where the data lives and return only a short result, and each query is checked before it runs.' },
      { beats: [], dur: 1, h: 'Re-plans when inconclusive. Hands leads to a human.', p: 'An inconclusive search goes back to planning. A lead goes to an analyst to review.' },
      { beats: [], dur: 1, h: 'One hunt, traced start to finish.', p: 'Plan, past hunts, search, re-plan, check, lead, review.' },
    ] },
  { id: 'trust', n: '03', label: 'Making a local model work', title: 'Context engineering for a local model.', line: 'On-premises, a small context, large telemetry.', objs: OBJ_3, amber: true,
    frames: [
      { h: 'Tools return results; the context stays small.', p: 'Searches return a short result. Past hunts and environment facts are fetched just in time, so each step fits a small context.' },
      { h: 'Traces feed evals. Analysts make the call.', p: 'Every run is evaluated from its traces. Each lead goes to an analyst with its evidence.' },
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
// It also owns the hidden plain mode: clicking the DSTA logo toggles html.hs-plain (remembered in localStorage),
// which keeps the story a static list, as under reduced motion; hunt-story.js re-checks on the hs-plain event.
const loader = `<script>/* Loads the Agentic AI story's script on demand (tools/scenes/agentic-story); the DSTA logo toggles plain mode. */(function(){var s=document.querySelector('.hs-story');if(!s||!s.getAttribute('data-hs-script'))return;var K='hs-plain',h=document.documentElement,l=document.querySelector('.company-logo--dsta');try{if(localStorage.getItem(K))h.classList.add(K)}catch(e){}if(l)l.addEventListener('click',function(){var p=h.classList.toggle(K);try{if(p)localStorage.setItem(K,'1');else localStorage.removeItem(K)}catch(e){}dispatchEvent(new Event(K))});var go=function(){if(s.hsLoaded)return;s.hsLoaded=1;var j=document.createElement('script');j.src=s.getAttribute('data-hs-script');document.head.appendChild(j)};if(!('IntersectionObserver'in window))return go();var o=new IntersectionObserver(function(e){if(e.some(function(x){return x.isIntersecting})){o.disconnect();go()}},{rootMargin:'100% 0px'});o.observe(s)})();</script>`;
const story = `<div class="hs-story" data-hs-script="assets/js/hunt-story.js">${html}</div>${loader}`;
page = page.slice(0, from) + story + page.slice(to);
fs.writeFileSync(FILE, page);
console.log('agentic story written:', story.length, 'bytes', panelAt >= 0 ? '(console kept)' : '(empty console slot: run tools/scenes/agentic-console/apply.cjs)');
