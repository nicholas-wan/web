// The Agentic AI card's "Hunt from a report" chart (README "Agentic AI glance chart"): one moment of the hunt in
// three plain steps, so a viewer takes it in at a glance (owner, 31 Oct 2026: the agent console "doesnt have the
// simplicity or polish of the other charts ... that viewers can appreciate at a glance"; of the first drawing: "see
// if a laymen can understand and appreciate the agentic element. it doesnt have to be so squeezy inside. The zero
// blind spot sentence - dont understand"; "you can take up more space. doesnt have to be same size as other charts").
//   node tools/scenes/agentic-glance/build.cjs   writes scene-d.svg, scene-m.svg and scene.css here
//   node tools/scenes/agentic-glance/apply.cjs   puts the peek into experience.html and the CSS into internship-peek.css
// The moment, in plain words: AI agents turn the report into searches and the first comes back empty; empty doesn't
// mean safe, so the agent checks whether its search could even see the threat and tries another way; one unusual task
// on one computer, and a human analyst makes the call. The hunter's evidence sits under each step in small type
// (schtasks.exe and 0 results; event 4698, a task being created; \WinTaskUpdate on 1 host, not in the baseline).
// Two SVGs sharing one stylesheet: desktop 640x250, the three steps as columns read left to right in a 46rem card;
// phones 360x392, the steps stacked, in the inline card. Base styles are the final frame, motion runs only under
// .is-playing, .is-still holds the final frame. About 6 s, then internship-peek.js replays it every 10 s like the
// others. Two independent visual reviews (31 Oct 2026) set the finish: only the numbered headings bold; plain
// identical agent nodes with the followed one filled teal; pictures left-aligned with their headings and
// bottom-aligned across the row; no caption tier under the pictures; the dead end ("0 results") bright; a teal flag
// on a heavier hand-off line to the amber human; phone type at 11px or more at natural size. Colour: grey for the
// team, teal for the agent that re-plans and its finding, amber for the human alone. Strings stay generic (README).
const fs = require('fs'); const path = require('path');
const OUT = __dirname;

const C = { bg: '#061214', rule: '#24464b', line: '#1b3437', node: '#0b1b1e', ink: '#d8e6e4', body: '#a9bcba', mute: '#7f9b9a', dim: '#4f6f6e',
  teal: '#28d7c5', amb: '#ffb869' };
const ICON = {
  ana: '<circle cx="6" cy="4" r="2"/><path d="M2.3 10.6c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  rep: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
};
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}">${ICON[k]}</g>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);

// the three steps: a title, plain lines (wrapped for each layout), and the hunter's evidence under them
const STEPS = [
  { title: 'Search', d: ['AI agents turn the report into searches.', 'The first comes back empty.'], m: ['AI agents turn the report into searches.', 'The first comes back empty.'],
    ev: ['process = schtasks.exe', '0 results'] },
  { title: 'Re-plan', d: ["Empty doesn't mean safe. The agent", 'checks whether its search could even', 'see the threat, then tries another way.'],
    m: ["Empty doesn't mean safe. The agent", 'checks whether its search could even', 'see the threat, then tries another way.'], ev: ['event 4698', 'a task being created'] },
  { title: 'Hand off', d: ['One unusual task on one computer.', 'A human analyst makes the call.'], m: ['One unusual task on one computer.', 'A human analyst makes the call.'],
    ev: ['\\WinTaskUpdate', '1 host · not in baseline'] },
];
const ARIA = 'An illustrative hunt, in three steps. From a ransomware report, AI agents search for a scheduled-task persistence technique; the first search, for schtasks.exe, comes back empty. Empty is not the same as clear: tasks made through the Task Scheduler API never launch schtasks.exe, so the Detection agent re-plans around event 4698, a task being created. That finds one unusual task, \\WinTaskUpdate, on one host and not in the baseline, and a human analyst makes the call.';

// a plain agent node: a ring with a dot; the one we follow is filled teal
const node = (cx, cy, r, on, cls = '') => on
  ? `<g class="${cls}"><circle class="ag-nd" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" stroke="${C.teal}"/><circle class="ag-ndd" cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.bg}"/></g>`
  : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.node}" stroke="${C.dim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.dim}"/>`;
// the pictures, left-aligned at x and bottom-aligned at base, drawn at a size r
function picture(i, x, base, r) {
  if (i === 0) {
    // the team: a supervisor over three identical agents, the one that will re-plan filled teal
    const gap = r1(r * 2.7), ay = base - r, sy = r1(ay - r * 3.4), ax = [x + r, x + r + gap, x + r + 2 * gap], sx = ax[1];
    let p = ax.map(cx => `<path d="M${sx} ${sy + r} C${sx} ${sy + r + 8} ${cx} ${ay - r - 8} ${cx} ${ay - r}" stroke="${C.dim}"/>`).join('');
    p += `<path class="ag-c ag-c1" d="M${sx} ${sy + r} C${sx} ${sy + r + 8} ${ax[2]} ${ay - r - 8} ${ax[2]} ${ay - r}" pathLength="1" stroke="${C.teal}"/>`;
    p += node(sx, sy, r, false) + node(ax[0], ay, r, false) + node(ax[1], ay, r, false) + node(ax[2], ay, r, true, 'ag-det');
    return p;
  }
  if (i === 1) {
    // the agent we followed, drawing a loop around itself
    const R = r1(r * 1.25), lr = R + 8, cx = x + lr + 2, cy = base - R;
    return node(cx, cy, R, true) +
      `<path class="ag-loop" d="M${r1(cx + lr * .5)} ${r1(cy - lr * .87)} A${lr} ${lr} 0 1 1 ${r1(cx - lr * .95)} ${r1(cy - lr * .3)}" pathLength="1" stroke="${C.teal}" stroke-width="1.6"/>` +
      `<path class="ag-lh" d="M${r1(cx - lr * .95 - 5)} ${r1(cy - lr * .3 - 5.5)} L${r1(cx - lr * .95)} ${r1(cy - lr * .3)} L${r1(cx - lr * .95 + 6)} ${r1(cy - lr * .3 - 3)}" stroke="${C.teal}" stroke-width="1.6"/>`;
  }
  // the hand-off: the agent's finding, a flag, passed along a line to the human
  const R = r1(r * 1.25), cy = base - R, fs = r1(R * 1.45 / 8.7), fx = x + 2, lx0 = r1(fx + 9.5 * fs + 6), lx1 = lx0 + r1(r * 2.2), cx = lx1 + 4 + R;
  return `<g class="ag-flag" stroke-width="${r1(1.3 / fs)}">${icon('flag', fx, r1(cy - 6.2 * fs), fs, C.teal)}</g><path class="ag-he" d="M${lx0} ${cy} H${lx1}" stroke="${C.teal}" stroke-width="1.3" stroke-dasharray="4 3" stroke-linecap="round"/>` +
    `<g class="ag-ana"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.3"/>${icon('ana', r1(cx - 6 * R / 7), r1(cy - 6 * R / 7), r1(R / 7), C.amb)}</g>`;
}
const title = (i, x, y, f) => `<text class="ag-t" x="${x}" y="${y}" font-size="${f}" font-weight="700" fill="${C.ink}"><tspan fill="${i === 1 ? C.teal : i === 2 ? C.amb : C.mute}" font-size="${r1(f - 2)}">${i + 1}</tspan><tspan dx="7">${STEPS[i].title}</tspan></text>`;
const body = (lines, x, y, lh, f) => lines.map((t, j) => `<text x="${x}" y="${r1(y + j * lh)}" font-size="${f}" font-weight="400" fill="${C.body}">${esc(t)}</text>`).join('');
// the evidence: the search in mono, its result under it; "0 results" bright, so the dead end shows
const evidence = (i, x, y, f) =>
  `<text class="ag-ev ag-ev${i} ag-m" x="${x}" y="${y}" font-size="${f}" fill="${C.mute}">${esc(STEPS[i].ev[0])}</text>` +
  `<text class="ag-evr ag-evr${i}" x="${x}" y="${r1(y + f * 1.4)}" font-size="${f}" font-weight="${i === 0 ? 600 : 400}" fill="${i === 0 ? C.ink : C.mute}">${esc(STEPS[i].ev[1])}</text>`;
const header = (w, y, fh, fid) =>
  `<g class="ag-head">${icon('rep', 16, y - 10, 1.05, C.mute)}<text x="32" y="${y}" font-size="${fh}" font-weight="700" fill="${C.ink}">Ransomware report</text>` +
  `<text x="${w - 16}" y="${y}" text-anchor="end" font-size="${fid}" fill="${C.mute}">T1053.005 · Scheduled Task</text></g><path d="M16 ${y + 11} H${w - 16}" stroke="${C.line}"/>`;
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, read left to right; pictures left-aligned with their headings, bottom-aligned across the row
function desktop() {
  const W = 640, H = 250, col = 200, x0 = 16, gap = 8, base = 118, titleY = 146, bodyY = 165, lh = 15.5, f = { head: 11.5, hid: 9.5, title: 12.5, body: 10.8, ev: 9 };
  const s = [open('ag-scene', W, H), header(W, 23, f.head, f.hid)];
  STEPS.forEach((st, i) => {
    const x = x0 + i * (col + gap);
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, x + 2, base, 11)}</g>${title(i, x, titleY, f.title)}${body(st.d, x, bodyY, lh, f.body)}${evidence(i, x, r1(bodyY + 3 * lh + 5), f.ev)}</g>`);
    if (i < 2) s.push(`<path class="ag-chev" d="M${x + col - 15} ${base - 22} l4 5 -4 5" stroke="${C.dim}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  });
  return s.join('') + '</svg>';
}
// phones: the steps stacked, the picture beside each, type at 11px or more at the card's width
function phone() {
  const W = 360, H = 392, top = 44, row = 116, px = 14, tx = 76, lh = 16, f = { head: 12.5, hid: 11.5, title: 13.5, body: 13.2, ev: 12.5 };
  const s = [open('ag-scene ag-scene--m', W, H), header(W, 21, f.head, f.hid)];
  STEPS.forEach((st, i) => {
    const y = top + i * row, bodyY = y + 34;
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, px, y + 66, 6.5)}</g>${title(i, tx, y + 16, f.title)}${body(st.m, tx, bodyY, lh, f.body)}${evidence(i, tx, r1(bodyY + st.m.length * lh + 3), f.ev)}</g>`);
    if (i < 2) s.push(`<path d="M14 ${y + row - 8} H${W - 14}" stroke="${C.line}"/>`);
  });
  return s.join('') + '</svg>';
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// each step arrives in turn: its picture and words, then its evidence, then the evidence's result
const T = { s0: 0.2, c1: 0.5, det: 1.0, ev0: 1.1, r0: 1.9, s1: 2.6, loop: 2.7, lh: 3.3, ev1: 3.5, s2: 4.7, flag: 4.8, he: 5.1, ana: 5.3, ev2: 5.5 };
const OUT_EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)';
const P = '.is-playing svg.ag-scene';
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / 250; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / 392; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
svg.ag-scene text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
svg.ag-scene .ag-m { font-family: Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace; }
svg.ag-scene .ag-i { fill: none; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-flag .ag-i { stroke-width: inherit; }
svg.ag-scene path { fill: none; }
svg.ag-scene .ag-c { stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: .16 2; stroke-opacity: 0; }
svg.ag-scene .ag-loop { stroke-dasharray: 1 1; stroke-dashoffset: 0; stroke-linecap: round; }
svg.ag-scene .ag-lh { stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-s { transform-box: fill-box; }
/* playing: each step arrives once, in order; the followed agent lights as the pulse reaches it */
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-draw { from { stroke-dashoffset: 1; } }
@keyframes ag-det { from { fill: ${C.node}; stroke: ${C.dim}; } }
@keyframes ag-detd { from { fill: ${C.dim}; } }
@keyframes ag-comet { 0% { stroke-dashoffset: .18; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: -.82; stroke-opacity: 1; } 100% { stroke-dashoffset: -.82; stroke-opacity: 0; } }
${P} .ag-s0 { animation: ag-in .45s ${OUT_EZ} ${T.s0}s both; }
${P} .ag-c1 { animation: ag-comet .7s linear ${T.c1}s none; }
${P} .ag-det .ag-nd { animation: ag-det .4s ${IO} ${T.det}s both; }
${P} .ag-det .ag-ndd { animation: ag-detd .4s ${IO} ${T.det}s both; }
${P} .ag-ev0 { animation: ag-fade .35s ${IO} ${T.ev0}s both; }
${P} .ag-evr0 { animation: ag-fade .35s ${IO} ${T.r0}s both; }
${P} .ag-s1 { animation: ag-in .45s ${OUT_EZ} ${T.s1}s both; }
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
