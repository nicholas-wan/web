// The Agentic AI story on Experience (prefix hs-): three short pinned chapters in the dark #agentic-ai card.
//   node tools/scenes/agentic-story/build.cjs        writes the story's markup into experience.html
//   node tools/scenes/agentic-console/apply.cjs      then (re)fills the console inside chapter 02
// Approved 27 Oct 2026 as mockup E3 (lab/scrolly/e); re-aimed 28 Oct 2026 as mockup H (lab/scrolly/h) so each
// chapter sells one capability from the CV; see README "Agentic AI story". The story runs from the analyst,
// into the design, to the model, and back to the analyst:
//   01 Understanding the analyst   "Built around how analysts plan."  the card's dark      report, techniques, environment, hypothesis
//   02 Designing the workflow      "Each step has one job."           a deeper near-black  the console, then the workflow map and one run
//   03 Making the model reliable "Context engineering, evals and human review." the one switch, to the site's warm light
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

// ---------------------------------------------------------------- 01: the report, its techniques as sub-hunts, this environment, the hypothesis
// One object carried through the chapter (rework, 28 Oct 2026, after an independent review found its cards only
// fading in and out): the report's phrases lift into technique chips; the chips become one sub-hunt lane each
// (deck slide 4: the supervisor "orchestrates one sub-hunt per technique"); the environment card marks the
// PowerShell lane as covered by a recent hunt; then the scheduled-task lane grows into the hypothesis, whose scope
// row takes three facts from the environment. The environment rows and the hypothesis are illustrative.
const FACTS = ['Task creation events', 'Workstations', 'Task baseline'];
const TECH = [['T1053.005', 'Scheduled Task', 'To hunt'], ['T1059.001', 'PowerShell', 'Covered recently'], ['T1547.001', 'Registry Run Keys', 'To hunt']];
const OBJ_1 = `<div class="hs-objs hs-objs--1"><div class="hs-src">`
  + `<div class="hs-doc"><p class="hs-lab">${ico(I.doc)}Ransomware report</p>`
  + `<p class="hs-doc-t">After gaining access, the operators <mark class="hs-m0">create a scheduled task</mark> that relaunches the payload at logon. They <mark class="hs-m1">run PowerShell</mark> to stage their tools, and <mark class="hs-m2">add a Run key</mark> so it survives a reboot.</p>`
  + `<span class="hs-doc-l" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`
  + `<p class="hs-chips">${TECH.map(([id, n], i) => chip(id, n, ` hs-c${i}`, `.hs-m${i}`)).join('')}</p></div>`
  + `<div class="hs-lanes" data-hs-late="1">${TECH.map(([id, n, s], i) => `<div class="hs-lane hs-l${i}${i === 1 ? ' is-skip' : ''}" data-hs-from=".hs-c${i}" style="--i:${i}">${chip(id, n, ' hs-lchip')}<span class="hs-lane-t"><b>Sub-hunt ${i + 1}</b><span>${s}</span></span></div>`).join('')}</div>`
  + `<div class="hs-card hs-env" data-hs-late="1"><p class="hs-lab">${ico(I.env)}This environment</p><dl class="hs-env-l">`
  + `<div><dt>Logs</dt><dd><span class="hs-e0">${FACTS[0]}</span> kept</dd></div>`
  + `<div><dt>Assets</dt><dd><span class="hs-e1">${FACTS[1]}</span> in scope</dd></div>`
  + `<div><dt>Known</dt><dd><span class="hs-e2">${FACTS[2]}</span> for scheduled tasks</dd></div>`
  + `<div class="hs-env-h"><dt>Hunts</dt><dd>PowerShell: covered by a recent hunt</dd></div></dl></div>`
  + `<div class="hs-card hs-hyp" data-hs-late="2" data-hs-from=".hs-l0"><p class="hs-lab hs-lab--hyp">${ico(I.flask)}Hypothesis · sub-hunt 1</p>`
  + `<p class="hs-hyp-t">An adversary may persist on workstations via scheduled tasks that relaunch the payload at logon.</p>`
  + `<dl class="hs-lo"><div><dt>Look for</dt><dd>A new task that runs at logon, outside the baseline</dd></div><div><dt>Normal here</dt><dd>Built-in tasks recorded in the task baseline</dd></div></dl>`
  + `<p class="hs-scope"><span class="hs-scope-l">Scoped to</span>${FACTS.map((t, i) => `<span class="hs-fact hs-f${i}" data-hs-from=".hs-e${i}">${t}</span>`).join('')}</p></div></div>`;

// ---------------------------------------------------------------- 02: the console, then the workflow map and its trace
// The steps in the order of the owner's deck (slides 4 and 9; redrawn 28 Oct 2026): the hypothesis, past hunts
// checked first, the planner, the query checked before it runs, the verdict and an analyst. The verdict is the
// deck's judge (slide 9: "evidence found, valid negative, or inconclusive"; "Read results" was too slight a name,
// owner, 28 Oct 2026), drawn with its three exits: inconclusive goes back to the planner, a valid negative is
// logged, a lead goes to a person. The second frame pulls back from the console onto the map, which draws itself;
// the third runs one hunt along it: each step lights as the dot passes, and the trace beneath it logs each attempt
// (slide 9, "Record every attempt, gap and review flag"; the query is handed on to detection engineering).
// --at is where the dot first reaches a step, as a share of the run; the CSS lights the step there.
const along = (pts, x, y) => {   // distance along a polyline to its first pass through (x, y)
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const on = (ax === bx && x === ax && (y - ay) * (y - by) <= 0) || (ay === by && y === ay && (x - ax) * (x - bx) <= 0);
    if (on) return d + Math.abs(x - ax) + Math.abs(y - ay);
    d += Math.abs(bx - ax) + Math.abs(by - ay);
  }
  return d;
};
const total = pts => along(pts, Infinity, Infinity);
const poly = pts => 'M' + pts.map(([x, y]) => `${x} ${y}`).join('L');
const head = (x, y, d) => {   // a small arrowhead with its tip at (x, y), pointing r, l, u or d
  const [dx, dy] = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] }[d], s = 7, w = 4.2, bx = x - dx * s, by = y - dy * s;
  return `M${x} ${y}L${bx - dy * w} ${by + dx * w}L${bx + dy * w} ${by - dx * w}Z`;
};
const node = (x, y, w, t, k, amb, at) => `<g class="hs-w-node hs-w-n${k}${amb ? ' hs-w-amb' : ''}" style="--at:${at}"><rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" rx="22"/><text x="${x}" y="${y + 5.5}" text-anchor="middle">${t}</text></g>`;
const STEPS = ['Hypothesis', 'Past hunts', 'Plan', 'Checked query', 'Verdict', 'Analyst review'];
const LOOPL = 'Inconclusive · re-plan';
let RUN_AT = [], RUN_AT_T = [];   // where the dot reaches each trace line (the verdict twice, then the analyst), wide and tall runs
const WIDE = (() => {
  // two rows: the first three left to right, the last three right to left; the loop rises from the verdict
  // (bottom middle) into the planner (top right) through the band between the rows, beside the main line
  const y1 = 130, y2 = 300, X = [100, 290, 480], W = 150, ym = (y1 + y2) / 2, xl = X[2] - 45;
  const P = [[X[0], y1], [X[1], y1], [X[2], y1], [X[2], y2], [X[1], y2], [X[0], y2]];
  const run = [[X[0], y1], [X[2], y1], [X[2], y2], [X[1], y2], [X[1], ym], [xl, ym], [xl, y1], [X[2], y1], [X[2], y2], [X[1], y2], [X[0], y2]];
  const L = total(run), at = P.map(([x, y]) => r3(along(run, x, y) / L));
  RUN_AT = [at[4], r3(along(run.slice(6), X[1], y2) / L + along(run.slice(0, 7), Infinity, Infinity) / L), 1];
  const main = `M${X[0] + W / 2} ${y1}H${X[1] - W / 2}M${X[1] + W / 2} ${y1}H${X[2] - W / 2}M${X[2]} ${y1 + 22}V${y2 - 22}M${X[2] - W / 2} ${y2}H${X[1] + W / 2}M${X[1] - W / 2} ${y2}H${X[0] + W / 2}`;
  const heads = [head(X[1] - W / 2, y1, "r"), head(X[2] - W / 2, y1, "r"), head(X[2], y2 - 22, "d"), head(X[1] + W / 2, y2, "l"), head(X[0] + W / 2, y2, "l")];
  const loop = `M${X[1]} ${y2 - 22}V${ym}H${xl}V${y1 + 28}`;
  const stub = `M${X[1]} ${y2 + 22}V${y2 + 50}`;
  return `<svg class="hs-w hs-w-wide" viewBox="0 90 580 300" aria-hidden="true">`
    + `<path class="hs-w-line" pathLength="1" d="${main}"/>`
    + heads.map((d, i) => `<path class="hs-w-head hs-w-h${i + 1}" d="${d}"/>`).join('')
    + `<path class="hs-w-loop" pathLength="1" d="${loop}"/><path class="hs-w-head hs-w-hl" d="${head(xl, y1 + 22, "u")}"/>`
    + `<text class="hs-w-ll" x="${(X[1] + xl) / 2}" y="${ym + 22}" text-anchor="middle">${LOOPL}</text>`
    + `<path class="hs-w-stub" d="${stub}"/><text class="hs-w-ll hs-w-sl" x="${X[1]}" y="${y2 + 70}" text-anchor="middle">Valid negative · logged</text>`
    + `<text class="hs-w-ll hs-w-lead" x="${(X[0] + X[1]) / 2}" y="${y2 - 30}" text-anchor="middle">Lead</text>`
    + P.map(([x, y], i) => node(x, y, W, STEPS[i], i, i === 5, at[i])).join('')
    + `<circle class="hs-w-glow" r="11" style="offset-path: path('${poly(run)}')"/><circle class="hs-w-dot" r="4.5" style="offset-path: path('${poly(run)}')"/>`
    + `</svg>`;
})();
const TALL = (() => {
  // one column; the loop runs up the right side from the verdict to the planner. The valid-negative exit is
  // left to the trace here: there is no room beside the column for a label at the 12px phone floor.
  const X = 180, Y = [60, 130, 200, 270, 340, 410], W = 190;
  const run = [[X, Y[0]], [X, Y[4]], [X + 150, Y[4]], [X + 150, Y[2]], [X, Y[2]], [X, Y[5]]];
  const L = total(run), at = Y.map(y => r3(along(run, X, y) / L));
  RUN_AT_T = [at[4], r3((along(run.slice(4), X, Y[4]) + total(run.slice(0, 5))) / L), 1];
  const main = Y.slice(0, -1).map((y, i) => `M${X} ${y + 22}V${Y[i + 1] - 22}`).join('');
  const loop = `M${X + 95} ${Y[4]}H${X + 150}V${Y[2]}H${X + 101}`;
  return `<svg class="hs-w hs-w-tall" viewBox="0 0 360 456" aria-hidden="true">`
    + `<path class="hs-w-line" pathLength="1" d="${main}"/>`
    + Y.slice(1).map((y, i) => `<path class="hs-w-head hs-w-h${i + 1}" d="${head(X, y - 22, "d")}"/>`).join('')
    + `<path class="hs-w-loop" pathLength="1" d="${loop}"/><path class="hs-w-head hs-w-hl" d="${head(X + 95, Y[2], "l")}"/>`
    + `<text class="hs-w-ll" x="${X + 150}" y="${Y[3] - 4}" text-anchor="middle" transform="rotate(90 ${X + 150} ${Y[3]})">${LOOPL}</text>`
    + `<text class="hs-w-ll hs-w-lead" x="${X + 12}" y="${Y[4] + 40}">Lead</text>`
    + Y.map((y, i) => node(X, y, W, STEPS[i], i, i === 5, at[i])).join('')
    + `<circle class="hs-w-glow" r="10" style="offset-path: path('${poly(run)}')"/><circle class="hs-w-dot" r="4" style="offset-path: path('${poly(run)}')"/>`
    + `</svg>`;
})();
const MAP = `<figure class="hs-wmap" role="img" data-hs-late="1" aria-label="The workflow: hypothesis, past hunts, plan, checked query, verdict, analyst review. An inconclusive verdict goes back to planning, a valid negative is logged, and a lead goes to a person.">${WIDE}${TALL}</figure>`;
// One hunt's trace, in the console's own story: the first plan's search for schtasks.exe launches is
// inconclusive (tasks made through the Task Scheduler API never launch it), the re-plan around event 4698 is
// checked and finds the lead, and the analyst's review hands the query on.
const TRACE = [['Plan 1', 'schtasks.exe launches', 'Inconclusive', 'inc'], ['Plan 2', 'Event 4698, query checked', 'Lead', 'lead'], ['Review', 'Lead flagged for an analyst', 'Query handed on', 'keep']];
const TRACE_EL = `<ol class="hs-trace" data-hs-late="2" aria-label="The hunt's trace">${TRACE.map(([n, s, v, k], i) => `<li class="is-${k}" style="--at:${RUN_AT[i]};--att:${RUN_AT_T[i]}"><span class="hs-tr-n">${n}</span><span class="hs-tr-s">${s}</span><b>${v}</b></li>`).join('')}</ol>`;
// The query is a neutral pseudo-query (the console's own, 27 Oct 2026), so no SIEM vendor is named.
const OBJ_2 = `<div class="hs-objs hs-objs--2">`
  + `<div class="hs-card hs-o2"><p class="hs-was">Scheduled tasks <span>Inconclusive</span></p><p class="hs-lab">${ico(I.down)}New plan</p>`
  + `<code class="hs-q">event_id = 4698<br>| count by host, task_name</code><p class="hs-res hs-res--ok">${ico(I.shield)}Checked</p></div>`
  + MAP + TRACE_EL + `</div>`;

// ---------------------------------------------------------------- 03: the model's three limits, one decision each
// From the owner's deck, "Engineering Challenges and Design Decisions" (27 Oct 2026): context bloat (raw rows stay
// with the step that judges them), inconsistent output (grounding in a knowledge base, then testing against an
// answer key) and compounded errors (a person at the checkpoints), reordered so the story still ends on the
// analyst. Each frame transforms its object rather than swapping cards (rework, 28 Oct 2026): the wall of result
// rows converges into the one row that matters while the count in context falls from 80 to 1; the golden set's
// cells flip over one by one like a scoreboard; the hunt's overview assembles for the analyst, who confirms the lead.
// The rows, the knowledge base and the lead are illustrative, in the product's own shapes (a Check result, its
// review flag). The golden set is the method of the owner's model evaluation (26 Oct 2026: one hunt, 7 techniques
// attacked and 5 left alone, a reviewer's answer key, every model through the same hunt, agents, prompts and data,
// accuracy and F1 both reported); the run scored on it here is illustrative, and no model or score is on the page.
const WALL = [['WS-011', '\\Microsoft\\Windows\\Defrag\\ScheduledDefrag'], ['WS-014', '\\Microsoft\\Windows\\Chkdsk\\ProactiveScan'], ['WS-019', '\\Microsoft\\Windows\\WindowsUpdate\\Scheduled Start'], ['WS-022', '\\Microsoft\\Windows\\DiskCleanup\\SilentCleanup'], ['WS-027', '\\Microsoft\\Windows\\TPM\\Tpm-Maintenance'], ['WS-031', '\\WinTaskUpdate', 1], ['WS-036', '\\Microsoft\\Windows\\Time Synchronization\\SynchronizeTime'], ['WS-040', '\\Microsoft\\Windows\\Diagnosis\\Scheduled'], ['WS-047', '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan'], ['WS-052', '\\Microsoft\\Windows\\Servicing\\StartComponentCleanup'], ['WS-058', '\\Microsoft\\Windows\\Maintenance\\WinSAT'], ['WS-063', '\\Microsoft\\Windows\\Application Experience\\ProgramDataUpdater']];
const HIT = WALL.findIndex(r => r[2]);
const KB = [['Technique notes', I.doc], ['Telemetry catalogue', I.db], ['Environment profile', I.env], ['Past hunts', I.hist]];
const RUN = 'cccc' + 'w' + 'mm' + 'nnnnn';   // c caught with its own evidence, w wrong evidence, m missed, n correctly clean
const OUTCOME = { c: 'Caught, own evidence', w: 'Wrong evidence', m: 'Missed', n: 'Correct: no attack' };
const cells = (from, to) => [...RUN.slice(from, to)].map((k, i) => `<i class="hs-cell is-${k}" style="--i:${from + i}"><b></b></i>`).join('');
// The analyst's view is the product's hunt overview (owner, 28 Oct 2026: the old lead-and-avatar ending "looks very
// lame", "check ... H-0010 to see how its done"; th-frontend FindingsOverview): the determination with its verdict bar,
// the attack chain by tactic in kill-chain order holding all three sub-hunts, the evidence row with its human-review
// next step, and the analyst's decision. Verdict tones follow the product: No evidence is neutral grey, never green.
const CHAIN = [['Execution', [['T1059.001', 'PowerShell', 'cov', 'Covered']]], ['Persistence', [['T1053.005', 'Scheduled Task', 'thr', 'Threat'], ['T1547.001', 'Registry Run Keys', 'neg', 'No evidence']]]];
let chipN = 0;
const OV = `<div class="hs-card hs-ov" data-hs-late="2">`
  + `<p class="hs-lab">${ico(I.ctx)}Hunt overview<span class="hs-ov-lt">&nbsp;· 3 techniques hunted</span></p>`
  + `<p class="hs-ov-h">Threat evidence in 1 of 3 techniques</p>`
  + `<p class="hs-ov-e">On <span class="hs-ent">WS-031</span>, as <span class="hs-ent">SYSTEM</span>.</p>`
  + `<p class="hs-ov-bar" aria-hidden="true"><i class="is-thr" style="--i:0"></i><i class="is-neg" style="--i:1"></i><i class="is-cov" style="--i:2"></i></p>`
  + `<ol class="hs-ov-chain">${CHAIN.map(([tac, fs], i) => `<li class="hs-ov-col${fs.some(f => f[2] === 'thr') ? ' is-thr' : ''}" style="--i:${i}"><p class="hs-ov-t">${tac}<span>${fs.length} technique${fs.length > 1 ? 's' : ''}</span></p>`
    + fs.map(([id, n, k, v]) => `<span class="hs-ov-chip is-${k}" style="--j:${chipN++}"><span><code>${id}</code><b>${v}</b></span><span class="hs-ov-n">${n}</span></span>`).join('') + `</li>`).join('')}</ol>`
  + `<div class="hs-ov-row"><code class="hs-ov-id">T1053.005</code><span class="hs-ov-ev"><code>\\WinTaskUpdate</code> not in baseline</span><span class="hs-ov-rv"><b>Human review</b>Check who created the task and what it runs</span></div>`
  + `<div class="hs-ov-act"><span class="hs-ava">${ico(I.person)}</span><span class="hs-ov-who"><b>Analyst</b><span>Judges the lead</span></span><span class="hs-ov-btns"><span class="hs-ov-b">Dismiss</span><span class="hs-ov-b is-go">${ico(I.check)}Confirm lead</span></span></div>`
  + `<p class="hs-ov-done">${ico(I.check)}Confirmed by the analyst · query handed to detection engineering</p></div>`;
const OBJ_3 = `<div class="hs-objs hs-objs--3">`
  + `<div class="hs-card hs-rows" data-hs-late="0" style="--n:${WALL.length};--hit:${HIT}">`
  + `<p class="hs-pipe"><span>Plan</span><i aria-hidden="true"></i><span>Query</span><i aria-hidden="true"></i><span class="is-on">Verdict</span></p>`
  + `<p class="hs-lab">${ico(I.db)}Result rows<span class="hs-rows-n"><span class="hs-rows-s">80, judged here only</span><span class="hs-cnt" aria-hidden="true">In context: </span></span></p>`
  + `<div class="hs-wall">${WALL.map(([h, k, x], i) => `<p class="hs-wr${x ? ' is-x' : ''}" style="--i:${i}"><span>${h}</span><span>${k}</span></p>`).join('')}</div>`
  + `<p class="hs-out">${ico(I.down)}<span>Passed on</span><b>1 task not in baseline: <code>\\WinTaskUpdate</code></b></p></div>`
  + `<div class="hs-card hs-kb" data-hs-late="1"><p class="hs-lab">${ico(I.ctx)}Knowledge base</p>`
  + `<p class="hs-kbc">${KB.map(([k, ic], i) => `<span style="--i:${i}">${ico(ic)}${k}</span>`).join('')}</p>`
  + `<div class="hs-gold"><p class="hs-lab">${ico(I.flask)}Golden set<span class="hs-rows-n">a reviewer's answer key</span></p>`
  + `<div class="hs-cells" role="img" aria-label="An illustrative run scored against the golden set: of 7 attacked techniques, 4 caught with their own evidence, 1 flagged with the wrong evidence and 2 missed; all 5 left alone correctly called clean.">`
  + `<span class="hs-cg"><span class="hs-cr">${cells(0, 7)}</span><span class="hs-cgl">Attacked · 7</span></span>`
  + `<span class="hs-cg"><span class="hs-cr">${cells(7, 12)}</span><span class="hs-cgl">Left alone · 5</span></span></div>`
  + `<p class="hs-key" aria-hidden="true">${Object.entries(OUTCOME).map(([k, t]) => `<span><i class="hs-cell is-${k}"><b></b></i>${t}</span>`).join('')}</p>`
  + `<p class="hs-gfoot">Same hunt, agents, prompts and data for every model; only the model changes. Accuracy alone rewards calling everything clean, so F1 is reported too.</p></div></div>`
  + OV + `</div>`;

// ---------------------------------------------------------------- the chapters (owner-approved copy, 28 Oct 2026)
// Each chapter sells one capability from the CV, in headlines that state a decision (copy review, 28 Oct 2026).
// The environment claims are the owner's ("accurate as written"). No team, funding or stakeholder claims here.
const CH = [
  // Headlines carry the terms AI product roles name (research, 28 Oct 2026: evals, guardrails and human review,
  // orchestration, tool access, traces, context engineering, grounding), in plain words; never "RAG",
  // "autonomous" or "memory", which would overclaim.
  { id: 'product', n: '01', label: 'Understanding the analyst', title: 'Built the way hunters plan a hunt.', line: 'An illustrative hunt, from a threat report to a claim it can test.', objs: OBJ_1,
    frames: [
      { hold: 1.1, h: 'One report becomes one hunt per technique.', p: 'The techniques are pulled out of the report and duplicates merged. Each runs as its own sub-hunt, so every model call works on one technique.' },
      { hold: 0.9, h: 'Tailored to this environment.', p: 'A hypothesis is only testable where the data exists, so what this environment logs and what is normal here come first. A technique hunted recently is not investigated twice.' },
      { h: 'Each hypothesis says what to look for, and where.', p: 'Written for this environment, with what to look for and what is normal here, so a hunt can confirm it or rule it out.' },
    ] },
  { id: 'eng', n: '02', label: 'Designing the workflow', title: 'Narrow agents, one supervisor.', line: 'Two decisions shaped it: when to re-plan, and when a person steps in.', console: true, objs: OBJ_2,
    frames: [
      // hold: this frame's dwell in screens (others 0.8: a 0.5-screen move, then a still; denser frames hold longer, owner, 28 Oct 2026). The console's 8s run needs the reader to linger: at
      // 0.6 a steady scroll or one Page Down left it after about a second (review, 27 Oct 2026).
      { beats: [1, 2, 3, 4, 5], dur: 8, hold: 1.4, h: 'Each agent has one job.', p: 'Planning, writing the query and judging the result are separate agents. Past hunts are checked first, and each query is checked against its plan before it runs.' },
      { beats: [], dur: 1, hold: 0.9, h: 'Every search ends in a verdict: lead, clean or re-plan.', p: 'A separate step judges what came back. Incomplete coverage goes back to planning, a clean result is logged, and a lead goes to an analyst.' },
      { beats: [], dur: 1, h: 'Every attempt is recorded.', p: 'Each plan, its query, its verdict and its review flag are logged, so an analyst can see why the agent re-planned and what it ruled out.' },
    ] },
  // 03's frames are the deck's three challenges in its own words, shortened (owner, 27 Oct 2026: the old
  // context card over a "Telemetry" block was "kind of useless")
  { id: 'trust', n: '03', label: 'Making the model reliable', title: 'Context engineering, evals and human review.', line: 'On-premises: large telemetry, a tight context.', objs: OBJ_3, amber: true,
    frames: [
      { hold: 1.1, h: 'Narrow the context for each call.', p: 'Query results are the largest thing in a hunt, so detection logic is split into a planner, a query writer and a judge. Only the judge reads the rows; one short finding is passed on.' },
      { hold: 1.2, h: 'Ground the model, then test it against an answer key.', p: 'The same input can give a different answer each run. A knowledge base anchors each answer, and every model runs the same hunt against a reviewer\'s answer key, including techniques nobody attacked.' },
      { h: 'Human in the loop at the checkpoints.', p: 'In a chain of calls, each mistake feeds the next. Plans that need judgement go to an analyst, every verdict carries a review flag, and a search that runs out of attempts is handed over, not looped.' },
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
