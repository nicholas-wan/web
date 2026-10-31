// The Agentic AI card's "Hunt from a report" chart (README "Agentic AI glance chart"): one moment of the hunt in
// three plain steps, so a viewer takes it in at a glance (owner, 31 Oct 2026: the agent console "doesnt have the
// simplicity or polish of the other charts ... that viewers can appreciate at a glance"; "see if a laymen can
// understand and appreciate the agentic element. it doesnt have to be so squeezy inside"; "you can take up more
// space"). The narrative is the owner's (same day): "Narrow AI subagents purpose built for specific task. Agents
// equipped with tools and skills to iteratively adjust and adapt based on evidence found. Agents surface suspicious
// threats to assist analyst."
//   node tools/scenes/agentic-glance/build.cjs   writes scene-d.svg, scene-m.svg and scene.css here
//   node tools/scenes/agentic-glance/apply.cjs   puts the peek into experience.html and the CSS into internship-peek.css
// Step 1, purpose-built agents: a supervisor splits the hunt among narrow agents, each built for one job (the team,
// each specialist's job labelled, Hypothesis, Detection and Report as in the product; the pulse reaches Detection); the first search comes back empty.
// Step 2, tools to adapt on evidence: the acting agent with its kit; empty doesn't mean safe, so it asks whether
// its search could have missed it and searches another way (the loop). Step 3, surface to the analyst: agents
// surface what looks suspicious with the evidence attached (a lead card passed along a line to the human), and a
// human analyst makes the call. The hunter's evidence sits under each step in small type (schtasks.exe and
// 0 results; event 4698, a task being created; \WinTaskUpdate on 1 host, not in the baseline).
// Two SVGs sharing one stylesheet: desktop 640x296, the steps as columns in a 46rem card, the three pictures on one
// optical centreline; phones 360x470, the steps stacked with smaller pictures. Base styles are the final frame,
// motion runs only under .is-playing, .is-still holds the final frame. About 6 s, then internship-peek.js replays
// it every 10 s like the others. The finish comes from rounds of independent design reviews and blind reads (a
// reader with no brief says what the picture tells them): only the numbered headings bold; plain identical agent
// nodes, the followed one solid teal in both steps; pictures left-aligned with their headings; picture labels at
// 9px or more at natural size; the dead end bright; teal for the machine and its finding, amber for the human
// alone; no hunter's jargon in the sentences (it lives in the evidence lines). Strings stay generic (README); the
// aria-label starts "An illustrative hunt." (the verifier and the spec pin it).
const fs = require('fs'); const path = require('path');
const OUT = __dirname;

const C = { bg: '#061214', rule: '#24464b', line: '#1b3437', node: '#0b1b1e', chip: '#0a191c', ink: '#d8e6e4', body: '#b4c6c4', mute: '#8ba7a6', dim: '#4f6f6e',
  teal: '#28d7c5', amb: '#ffb869' };
const ICON = {
  ana: '<circle cx="6" cy="4" r="2"/><path d="M2.3 10.6c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  rep: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
  search: '<circle cx="5.2" cy="5.2" r="3.2"/><path d="M7.6 7.6 10.6 10.6"/>',
  check: '<path d="M2.4 6.4l2.4 2.4 4.8-5.2"/>',
  clock: '<circle cx="6" cy="6" r="4.2"/><path d="M6 3.6V6l1.8 1.2"/>',
};
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}">${ICON[k]}</g>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);

// the three steps: a title, plain lines (wrapped for each layout), and the hunter's evidence under them
const STEPS = [
  { title: 'Purpose-built agents', d: ['A supervisor splits the hunt among', 'narrow agents, each built for one job.', 'The first search comes back empty.'],
    m: ['A supervisor splits the hunt among', 'narrow agents, each built for one job.', 'The first search comes back empty.'], ev: ['process = schtasks.exe', '0 results'] },
  { title: 'Tools to adapt on evidence', d: ["Empty doesn't mean safe, so the agent", 'asks whether its search could have', 'missed it, and searches another way.'],
    m: ["Empty doesn't mean safe, so the agent", 'asks whether its search could have', 'missed it, and searches another way.'], ev: ['event 4698', 'a task being created'] },
  { title: 'Surface to the analyst', d: ['Agents surface what looks suspicious,', 'evidence attached. A human analyst', 'makes the call.'],
    m: ['Agents surface what looks suspicious,', 'evidence attached. A human analyst', 'makes the call.'], ev: ['\\WinTaskUpdate', '1 host · not in baseline'] },
];
const JOBS = ['Hypothesis', 'Detection', 'Report'], ON = 1;   // the product's own agents, the three that read best (prime-th th-core: hypothesis, detection_logic, report); Detection searches
const TOOLS = [['search', 'search'], ['check', 'check query'], ['clock', 'analyse results']];   // the Detection agent's own steps (past hunts is the Hypothesis agent's tool)
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each built for one job: forming a hypothesis, writing and running the detection logic, reporting. The first search, for schtasks.exe, comes back empty. Agents carry tools and skills, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so the Detection agent asks whether its search could have missed the threat and searches another way, around event 4698, a task being created. That surfaces one unusual task, \\WinTaskUpdate, on one host and not in the baseline, with the evidence attached, and a human analyst makes the call.';

// a plain agent node: a ring with a dot; the one we follow is solid teal
const node = (cx, cy, r, on, cls = '') => on
  ? `<circle class="${cls} ag-nd" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" stroke="${C.teal}"/>`
  : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.node}" stroke="${C.dim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.dim}"/>`;
const label = (x, y, f, t, anchor = 'middle', col = C.mute) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${f}" fill="${col}">${esc(t)}</text>`;
// the pictures, left-aligned at x and centred on cy, drawn at a size r; `rich` adds the labels and kit (desktop)
function picture(i, x, cy, r, rich) {
  if (i === 0) {
    // the team: a supervisor over three narrow agents, each labelled with its job; the one that searches lights
    const gap = rich ? 60 : r1(r * 2.4), lf = rich ? 9.5 : 8.5, drop = r1(r * 3.4);
    const ay = rich ? r1(cy + 22) : r1(cy + r * 1.7), sy = r1(ay - drop), ax = [x + (rich ? 26 : r)]; ax[1] = ax[0] + gap; ax[2] = ax[0] + 2 * gap; const scx = ax[1];
    let p = ax.map(cx => `<path d="M${scx} ${sy + r} C${scx} ${sy + r + 8} ${cx} ${ay - r - 8} ${cx} ${ay - r}" stroke="${C.dim}"/>`).join('');
    const on = rich ? ON : 2;
    p += `<path class="ag-c ag-c1" d="M${scx} ${sy + r} C${scx} ${sy + r + 8} ${ax[on]} ${ay - r - 8} ${ax[on]} ${ay - r}" pathLength="1" stroke="${C.teal}"/>`;
    p += node(scx, sy, r, false) + [0, 1, 2].map(k => node(ax[k], ay, r, k === on, k === on ? 'ag-det' : '')).join('');
    if (rich) {
      p += label(scx, sy - r - 5, lf, 'Supervisor');
      JOBS.forEach((j, k) => p += `<g class="${k === ON ? 'ag-job-on' : ''}">${label(ax[k], ay + r + lf + 3, lf, j, 'middle', k === ON ? C.teal : C.mute)}</g>`);
    }
    return p;
  }
  if (i === 1) {
    // the acting agent, the same teal dot, with its kit of tools, drawing a loop around itself as it searches again
    const lr = r + 10, cx = x + lr + 3;
    let p = node(cx, cy, r, true) +
      `<path class="ag-loop" d="M${r1(cx + lr * .5)} ${r1(cy - lr * .87)} A${lr} ${lr} 0 1 1 ${r1(cx - lr * .95)} ${r1(cy - lr * .3)}" pathLength="1" stroke="${C.teal}" stroke-width="1.6"/>` +
      `<path class="ag-lh" d="M${r1(cx - lr * .95 - 5)} ${r1(cy - lr * .3 - 6)} L${r1(cx - lr * .95 + 1)} ${r1(cy - lr * .3 + 1)} L${r1(cx - lr * .95 + 6.5)} ${r1(cy - lr * .3 - 3.5)} Z" fill="${C.teal}" stroke="${C.teal}" stroke-width="1"/>`;
    if (rich) {
      const tx = cx + lr + 12, th = 18, tw = 84, ty0 = cy - th * 1.5 - 6;
      TOOLS.forEach(([ic, name], k) => {
        const ty = r1(ty0 + k * (th + 6));
        p += `<g class="ag-tool ag-tool${k}"><path d="M${cx + r} ${cy} C${cx + r + 9} ${cy} ${tx - 9} ${ty + th / 2} ${tx} ${ty + th / 2}" stroke="${C.line}"/>` +
          `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="${C.chip}" stroke="${C.line}"/>${icon(ic, tx + 6, ty + 3, 1, C.teal)}` +
          `<text x="${tx + 22}" y="${ty + 12.5}" font-size="10" fill="${C.body}">${name}</text></g>`;
      });
    }
    return p;
  }
  // the hand-off: a lead card, the finding with its evidence attached, passed along a line to the human
  const R = r1(r * 1.25);
  if (!rich) {
    const fs = r1(R * 1.45 / 8.7), fx = x + 2, lx0 = r1(fx + 9.5 * fs + 5), lx1 = lx0 + r1(r * 1.4), cx = lx1 + 4 + R;
    return `<g class="ag-flag" stroke-width="${r1(1.3 / fs)}">${icon('flag', fx, r1(cy - 6.2 * fs), fs, C.teal)}</g><path class="ag-he" d="M${lx0} ${cy} H${lx1}" stroke="${C.teal}" stroke-width="1.3" stroke-dasharray="4 3" stroke-linecap="round"/>` +
      `<g class="ag-ana"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.3"/>${icon('ana', r1(cx - 6 * R / 7), r1(cy - 6 * R / 7), r1(R / 7), C.amb)}</g>`;
  }
  const cw = 96, ch = 56, cx0 = x + 2, cy0 = cy - ch / 2, lx0 = cx0 + cw + 6, lx1 = lx0 + 30, cx = lx1 + 5 + R;
  return `<g class="ag-flag"><rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".7"/>` +
    `${icon('flag', cx0 + 8, cy0 + 7, 1.4, C.teal)}<text x="${cx0 + 28}" y="${cy0 + 19}" font-size="10" font-weight="700" fill="${C.ink}">1 lead</text>` +
    `<path d="M${cx0 + 9} ${cy0 + 32} H${cx0 + 74}M${cx0 + 9} ${cy0 + 39} H${cx0 + 56}M${cx0 + 9} ${cy0 + 46} H${cx0 + 66}" stroke="${C.dim}" stroke-width="2" stroke-linecap="round"/></g>` +
    `<path class="ag-he" d="M${lx0} ${cy} H${lx1}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round"/>` +
    `<g class="ag-ana"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.3"/>${icon('ana', r1(cx - 6 * R / 7), r1(cy - 6 * R / 7), r1(R / 7), C.amb)}</g>`;
}
const title = (i, x, y, f) => `<text class="ag-t" x="${x}" y="${y}" font-size="${f}" font-weight="700" fill="${C.ink}"><tspan fill="${i === 2 ? C.amb : C.teal}" font-size="${r1(f - 2)}">${i + 1}</tspan><tspan dx="7">${STEPS[i].title}</tspan></text>`;
const body = (lines, x, y, lh, f) => lines.map((t, j) => `<text x="${x}" y="${r1(y + j * lh)}" font-size="${f}" font-weight="400" fill="${C.body}">${esc(t)}</text>`).join('');
// the evidence: the search in mono, its result under it; "0 results" bright, so the dead end shows
const evidence = (i, x, y, f) =>
  `<text class="ag-ev ag-ev${i}" x="${x}" y="${y}" font-size="${r1(f * .8)}" font-weight="700" letter-spacing=".08em" fill="${C.dim}">EVIDENCE</text>` +
  `<text class="ag-ev ag-ev${i} ag-m" x="${x}" y="${r1(y + f * 1.35)}" font-size="${f}" fill="${C.mute}">${esc(STEPS[i].ev[0])}</text>` +
  `<text class="ag-evr ag-evr${i}" x="${x}" y="${r1(y + f * 2.75)}" font-size="${f}" font-weight="600" fill="${C.ink}">${esc(STEPS[i].ev[1])}</text>`;
// the header: what the viewer is looking at, and for the hunter the report and technique
const header = (w, y, fh, fid, short) =>
  `<g class="ag-head">${icon('rep', 16, y - 10, 1.05, C.mute)}<text x="32" y="${y}" font-size="${fh}" font-weight="700" fill="${C.ink}">How one hunt ran</text>` +
  `<text x="${w - 16}" y="${y}" text-anchor="end" font-size="${fid}" fill="${C.mute}">${short ? 'Ransomware report · T1053.005' : 'Ransomware report · T1053.005 Scheduled Task'}</text></g><path d="M16 ${y + 11} H${w - 16}" stroke="${C.line}"/>`;
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, read left to right; pictures left-aligned with their headings, on one centreline
function desktop() {
  const W = 640, H = 296, col = 200, x0 = 16, gap = 8, pcy = 100, titleY = 178, bodyY = 197, lh = 15.5, f = { head: 11.5, hid: 9.5, title: 12.5, body: 10.3, ev: 9 };
  const s = [open('ag-scene', W, H), header(W, 23, f.head, f.hid)];
  STEPS.forEach((st, i) => {
    const x = x0 + i * (col + gap);
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, x + 2, pcy, 13, true)}</g>${title(i, x, titleY, f.title)}${body(st.d, x, bodyY, lh, f.body)}${evidence(i, x, r1(bodyY + 3 * lh + 5), f.ev)}</g>`);
    if (i < 2) s.push(`<path class="ag-chev" d="M${x + col - 9} ${pcy - 5} l4 5 -4 5" stroke="${C.mute}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  });
  return s.join('') + '</svg>';
}
// phones: the steps stacked, a smaller picture beside each, inset like the text, type at 11px or more
function phone() {
  const W = 360, H = 470, top = 44, row = 142, px = 20, tx = 92, lh = 17, f = { head: 13, hid: 11, title: 14, body: 13.4, ev: 13 };
  const s = [open('ag-scene ag-scene--m', W, H), header(W, 21, f.head, f.hid, true)];
  STEPS.forEach((st, i) => {
    const y = top + i * row, bodyY = y + 34;
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, px, y + row / 2 - 6, 9, false)}</g>${title(i, tx, y + 16, f.title)}${body(st.m, tx, bodyY, lh, f.body)}${evidence(i, tx, r1(bodyY + st.m.length * lh + 3), f.ev)}</g>`);
    if (i < 2) s.push(`<path d="M14 ${y + row - 8} H${W - 14}" stroke="${C.line}"/>`);
  });
  return s.join('') + '</svg>';
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// each step arrives in turn: its picture and words, the kit chip by chip, then its evidence, then the result
const T = { s0: 0.2, c1: 0.5, det: 1.0, ev0: 1.1, r0: 1.9, s1: 2.6, tool: [2.8, 3.0, 3.2], loop: 2.9, lh: 3.5, ev1: 3.7, s2: 4.8, flag: 4.9, he: 5.2, ana: 5.4, ev2: 5.6 };
const OUT_EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)';
const P = '.is-playing svg.ag-scene';
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / 296; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / 470; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
svg.ag-scene text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
svg.ag-scene .ag-m { font-family: Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace; }
svg.ag-scene .ag-i { fill: none; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-flag .ag-i { stroke-width: inherit; }
svg.ag-scene path { fill: none; }
svg.ag-scene .ag-c { stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: .16 2; stroke-opacity: 0; }
svg.ag-scene .ag-loop { stroke-dasharray: 1 1; stroke-dashoffset: 0; stroke-linecap: round; }
svg.ag-scene .ag-lh { fill: ${C.teal}; stroke-linejoin: round; }
svg.ag-scene .ag-s { transform-box: fill-box; }
/* playing: each step arrives once, in order; the searching agent and its job label light as the pulse reaches it */
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-draw { from { stroke-dashoffset: 1; } }
@keyframes ag-det { from { fill: ${C.node}; stroke: ${C.dim}; } }
@keyframes ag-job { from { fill: ${C.mute}; } }
@keyframes ag-comet { 0% { stroke-dashoffset: .18; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: -.82; stroke-opacity: 1; } 100% { stroke-dashoffset: -.82; stroke-opacity: 0; } }
${P} .ag-s0 { animation: ag-in .45s ${OUT_EZ} ${T.s0}s both; }
${P} .ag-c1 { animation: ag-comet .7s linear ${T.c1}s none; }
${P} .ag-det { animation: ag-det .4s ${IO} ${T.det}s both; }
${P} .ag-job-on text { animation: ag-job .4s ${IO} ${T.det}s both; }
${P} .ag-ev0 { animation: ag-fade .35s ${IO} ${T.ev0}s both; }
${P} .ag-evr0 { animation: ag-fade .35s ${IO} ${T.r0}s both; }
${P} .ag-s1 { animation: ag-in .45s ${OUT_EZ} ${T.s1}s both; }
${P} .ag-tool0 { animation: ag-fade .3s ${IO} ${T.tool[0]}s both; }
${P} .ag-tool1 { animation: ag-fade .3s ${IO} ${T.tool[1]}s both; }
${P} .ag-tool2 { animation: ag-fade .3s ${IO} ${T.tool[2]}s both; }
${P} .ag-loop { animation: ag-draw .7s ${IO} ${T.loop}s both; }
${P} .ag-lh { animation: ag-fade .25s ${IO} ${T.lh}s both; }
${P} .ag-ev1, ${P} .ag-evr1 { animation: ag-fade .35s ${IO} ${T.ev1}s both; }
${P} .ag-s2 { animation: ag-in .45s ${OUT_EZ} ${T.s2}s both; }
${P} .ag-flag { animation: ag-fade .3s ${IO} ${T.flag}s both; }
${P} .ag-he { animation: ag-fade .3s ${IO} ${T.he}s both; }
${P} .ag-ana { animation: ag-fade .4s ${OUT_EZ} ${T.ana}s both; }
${P} .ag-ev2, ${P} .ag-evr2 { animation: ag-fade .35s ${IO} ${T.ev2}s both; }
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), phone());
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', phone().length, 'scene.css', css.length, 'ends ~', (T.ev2 + 0.35).toFixed(1) + 's');
