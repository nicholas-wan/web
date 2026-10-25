// Motion for the Agentic AI peek ("Hunt from a report") on Experience.
//   node tools/scenes/agentic-hunt-motion.cjs        rewrites the generated block in
//                                                    assets/css/internship-peek.css
//   node tools/scenes/agentic-hunt-motion.cjs wide   prints the CSS with mono forced to
//                                                    "Courier New", to check wide fallbacks
// Static rules are the final frame (so is-still and reduced motion need
// nothing); one timeline compiles to keyframes. Every stop is in absolute
// seconds, so beats are retimed in T below. The markup is in experience.html
// (search `ah-scene`).
const fs = require('fs'); const path = require('path');
const wide = process.argv[2] === 'wide';
const E = { mv: 'cubic-bezier(.65,0,.35,1)', out: 'cubic-bezier(.33,1,.68,1)', wipe: 'cubic-bezier(.45,0,.55,1)', rise: 'cubic-bezier(.7,0,.3,1)', lin: 'linear' };
const S = '.ah-scene ';
const map = new Map(); let kcss = ''; let n = 0;
// stops: [t, decl, ease-of-the-segment-that-starts-here]; a missing t=0 stop holds the first state
function anim(sel, stops) {
  if (stops[0][0] > 0) stops = [[0, stops[0][1], null], ...stops];
  const end = stops[stops.length - 1][0]; const name = 'ah-k' + (n++);
  kcss += `@keyframes ${name} {\n` + stops.map(([t, d, e]) => `  ${(t / end * 100).toFixed(3)}% { ${d}${e ? `; animation-timing-function: ${E[e] || e}` : ''} }`).join('\n') + '\n}\n';
  if (!map.has(sel)) map.set(sel, []);
  map.get(sel).push(`${name} ${end}s linear both`);
}
const op = v => `opacity: ${v}`;
const tr = (x, y) => `transform: translate(${x}px, ${y}px)`;
const enter = (sel, t, d = .4, dy = 3) => anim(sel, [[t, `${op(0)}; ${tr(0, dy)}`, 'out'], [t + d, `${op(1)}; ${tr(0, 0)}`]]);
const fade = (sel, a, b, from = 0, to = 1, e = 'out') => anim(sel, [[a, op(from), e], [b, op(to)]]);

// ---------- timeline (seconds) ----------
const T = {
  open: .05, hl: [.35, .8], fold: [.85, 1.2],
  chipIn: [1.0, 1.2], fly: [1.0, 1.6], grow: [1.6, 1.88],
  hop: [[.05, .35], [1.72, 2.07], [2.85, 3.2], [4.05, 4.4]],
  h1: [1.98, 2.44], h2: [2.44, 2.86],
  code: 3.0, tokIn: [3.08, 3.2], tokFly: [3.1, 3.56], q1: [3.02, 3.52], q2: [3.66, 4.12],
  valid: 4.06, rows: 4.24, warm: [4.72, 5.12], verdict: 4.98, review: 5.14, ring: [5.12, 6.0],
};
// bead stops at each node (offsets from the supervisor dot at y 3.2)
const NODE = [0, 12.8, 41.3, 67.8, 123.8];

const bead = [[0, tr(0, 0), null]];
T.hop.forEach(([a, b], i) => { bead.push([a, tr(0, NODE[i]), 'mv'], [b, tr(0, NODE[i + 1])]); });
anim('.ah-bead', bead);
anim('.ah-bead', [[0, op(0), 'out'], [.05, op(1)], [T.warm[0], op(1), 'out'], [T.warm[1], op(0)]]);
// each hairline lights over its own hop, on the bead's curve
T.hop.forEach(([a, b], i) => anim(`.ah-e${i + 1}`, [[a, 'transform: scaleY(0)', 'mv'], [b, 'transform: scaleY(1)']]));
const lit = 'fill: #28d7c5; stroke: #28d7c5', idle = 'fill: #0e2024; stroke: #3a6f73';
T.hop.forEach(([, b], i) => {
  const st = [[b - .12, idle, 'out'], [b + .15, lit]];
  if (i === 3) st.push([T.warm[0], lit, 'out'], [T.warm[1], 'fill: #ffb869; stroke: #ffb869']);
  anim(`.ah-n${i + 1}`, st);
});
// one slow ring on the Flag node, kept inside the scene and clear of the label
anim('.ah-ring', [[T.ring[0], `${op(0)}; transform: scale(1)`, 'out'], [T.ring[0] + .1, `${op(.6)}; transform: scale(1.5)`, 'out'], [T.ring[1], `${op(0)}; transform: scale(2.7)`]]);

// step labels: dim (upcoming) -> bright while that step's agent works -> settled
const LD = '#4f7477';
const on = T.hop.map(([, b]) => b - .15), done = [T.hop[1][0] + .1, T.hop[2][0] + .1, T.hop[3][0] + .1, T.ring[0] + .3];
on.forEach((t, i) => anim(`.ah-s${i + 1}`, [[t, `fill: ${LD}`, 'out'], [t + .3, 'fill: #f4f2ea'], [done[i], 'fill: #f4f2ea', 'out'], [done[i] + .4, 'fill: #d8e6e4']]));

// 1 report: opens as a card; the bars and card fold away, the quote and its highlight stay
anim('.ah-doc', [[T.open, `${op(0)}; ${tr(0, 3)}`, 'out'], [T.open + .35, `${op(1)}; ${tr(0, 0)}`], [T.fold[0], `${op(1)}; ${tr(0, 0)}`, 'mv'], [T.fold[1], `${op(0)}; ${tr(0, -2)}`]]);
enter('.ah-title', T.open, .35);
enter('.ah-quote', T.open, .35);
anim('.ah-hl', [[T.hl[0], 'transform: scaleX(0)', 'mv'], [T.hl[1], 'transform: scaleX(1)']]);
anim('.ah-phrase', [[T.hl[0] + .15, 'fill: #c4d6d4', 'out'], [T.hl[1], 'fill: #e8fffb']]);
// the phrase lifts as a chip the size of its highlight, fading in as it rises
const DX = -56.1, DY = 14.4, GROW = 64.5;
fade('.ah-chip', T.chipIn[0], T.chipIn[1]);
// up out of the quote line first, then along the empty title line: it never crosses text
anim('.ah-chipx', [[T.fly[0] + .14, tr(DX, 0), 'mv'], [T.fly[1], tr(0, 0)]]);
anim('.ah-chipy', [[T.fly[0], tr(0, DY), 'mv'], [T.fly[0] + .4, tr(0, 0)]]);
// the rim widens leftwards into the pill while the words cross-fade and the ID rides the
// growing edge in: the pill is never partly empty
anim('.ah-rim', [[T.grow[0], `stroke-dashoffset: ${GROW}`, 'mv'], [T.grow[1], 'stroke-dashoffset: 0']]);
fade('.ah-chiptext', T.grow[0] - .02, T.grow[0] + .12, 1, 0, 'mv');
fade('.ah-tname', T.grow[0] + .02, T.grow[0] + .22, 0, 1, 'mv');
anim('.ah-id, .ah-dot', [[T.grow[0], `${op(0)}; ${tr(16, 0)}`, 'mv'], [T.grow[1], `${op(1)}; ${tr(0, 0)}`]]);
// the ID is clipped to the rim's growing left edge, so it never shows outside the pill
anim('.ah-pillclip', [[T.grow[0], tr(GROW, 0), 'mv'], [T.grow[1], tr(0, 0)]]);
anim('.ah-arrow', [[T.grow[0] + .05, `${op(0)}; ${tr(-3, 0)}`, 'out'], [T.grow[1] + .15, `${op(1)}; ${tr(0, 0)}`]]);

// 2 hypothesis and 3 rule: soft-edged wipes on one curve, no caret
const WIPE = { h1: 226.8, h2: 190, q1: 178.4, q2: 219 };
const wipe = (k, [a, b]) => anim(`.ah-w-${k}`, [[a, tr(-WIPE[k], 0), 'wipe'], [b, tr(0, 0)]]);
wipe('h1', T.h1); wipe('h2', T.h2);
enter('.ah-code', T.code, .3, 2);
wipe('q1', T.q1); wipe('q2', T.q2);
// 4698 lifts from the hypothesis and lands in EventCode= as that line reaches it; it turns
// into the code font in flight, so it lands already matching
const TX = -20.25, TY = -15;
anim('.ah-token', [[T.tokIn[0], op(0), 'out'], [T.tokIn[1], op(1)], [T.tokFly[1] - .02, op(1), 'mv'], [T.tokFly[1] + .14, op(0)]]);
// the rim only appears once the copy has left the sentence, so it never touches its neighbours
anim('.ah-tokrim', [[T.tokFly[0] + .06, op(0), 'out'], [T.tokFly[0] + .2, op(1)], [T.tokFly[1] - .16, op(1), 'mv'], [T.tokFly[1] - .01, op(0)]]);
fade('.ah-toksans', T.tokFly[0] + .1, T.tokFly[0] + .32, 1, 0, 'mv');
fade('.ah-tokmono', T.tokFly[0] + .1, T.tokFly[0] + .32, 0, 1, 'mv');
anim('.ah-tokx', [[T.tokFly[0], tr(TX, 0), 'mv'], [T.tokFly[1], tr(0, 0)]]);
anim('.ah-toky', [[T.tokFly[0], tr(0, TY), 'mv'], [T.tokFly[1], tr(0, 0)]]);
fade('.ah-code4698', T.tokFly[1] - .06, T.tokFly[1] + .1, 0, 1, 'mv');
anim('.ah-valid', [[T.valid, `${op(0)}; ${tr(-3, 0)}`, 'out'], [T.valid + .4, `${op(1)}; ${tr(0, 0)}`]]);

// 4 flag: rows settle, then the one that is not in the baseline warms
['.ah-r1', '.ah-r2', '.ah-r3'].forEach((s, i) => enter(s, T.rows + i * .08, .38, 3));
['.ah-hit', '.ah-hitbar', '.ah-note'].forEach(s => fade(s, T.warm[0], T.warm[1]));
anim('.ah-res-hit', [[T.warm[0], 'fill: #9db4b3', 'out'], [T.warm[1], 'fill: #f4f2ea']]);
enter('.ah-verdict', T.verdict, .42, 4);
enter('.ah-review', T.review, .42, 4);

// ---------- static rules: the final frame ----------
const MONO = wide ? '"Courier New", monospace' : 'Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace';
const base = `/* Generated by tools/scenes/agentic-hunt-motion.cjs: edit and rerun it. */
${S}{ font-family: "Figtree", "Source Sans Pro", Helvetica, sans-serif; }
${S}.ah-edge { stroke: #24464b; stroke-width: .9; fill: none; }
${S}.ah-lit { stroke: #28d7c5; stroke-width: .9; fill: none; transform-box: fill-box; transform-origin: 50% 0; }
${S}.ah-sup { fill: #0e2024; stroke: #9db4b3; stroke-width: 1; }
${S}.ah-suplab { font-size: 9px; font-weight: 500; fill: #9db4b3; }
${S}.ah-node { fill: #28d7c5; stroke: #28d7c5; stroke-width: 1; }
${S}.ah-n4 { fill: #ffb869; stroke: #ffb869; }
${S}.ah-ring { fill: none; stroke: #ffb869; stroke-width: .8; opacity: 0; transform-box: fill-box; transform-origin: center; }
${S}.ah-bead { opacity: 0; }
${S}.ah-lab { font-family: "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; font-size: 12px; font-weight: 700; fill: #d8e6e4; }
${S}.ah-doc { opacity: 0; }
${S}.ah-docbox { fill: #071315; stroke: #24464b; stroke-width: 1; }
${S}.ah-bars rect { fill: #3a6f73; opacity: .55; }
${S}.ah-title { font-size: 10px; font-weight: 500; fill: #d8e6e4; }
${S}.ah-qtext { font-size: 10px; fill: #a9bfbe; }
${S}.ah-phrase { fill: #e8fffb; }
${S}.ah-hl { fill: #28d7c5; fill-opacity: .2; transform-box: fill-box; transform-origin: 0 50%; }
${S}.ah-arrow { fill: none; stroke: #6f9d9c; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
${S}.ah-rim { fill: none; stroke-linecap: round; stroke-dasharray: 126.1 400; stroke-dashoffset: 0; }
${S}.ah-rim-edge { stroke: #2a8f86; stroke-width: 15.6; }
${S}.ah-rim-fill { stroke: #12363a; stroke-width: 14; }
${S}.ah-chiptext { font-size: 10px; fill: #e8fffb; opacity: 0; }
${S}.ah-mono { font-family: ${MONO}; font-size: 10px; fill: #d8e6e4; }
${S}.ah-id { fill: #b8f2eb; }
${S}.ah-dot { font-size: 10px; fill: #9db4b3; }
${S}.ah-tname { font-size: 10px; font-weight: 500; fill: #e8fffb; }
${S}.ah-wipe, ${S}.ah-pillclip { transform-box: view-box; }
${S}.ah-hyp { font-size: 10.5px; fill: #d8e6e4; }
${S}.ah-key { fill: #b8f2eb; }
${S}.ah-code { fill: #071315; stroke: #24464b; stroke-width: 1; }
${S}.ah-f { fill: #9db4b3; }
${S}.ah-op { fill: #6f9d9c; }
${S}.ah-v { fill: #b8f2eb; }
${S}.ah-kw { fill: #28d7c5; }
${S}.ah-token { opacity: 0; }
${S}.ah-token rect { fill: #12363a; stroke: #2a8f86; stroke-width: .8; }
${S}.ah-toksans { font-size: 10.5px; fill: #e8fffb; }
${S}.ah-tokmono { fill: #e8fffb; opacity: 0; }
${S}.ah-valid path { fill: none; stroke: #28d7c5; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
${S}.ah-valid text { font-size: 9.5px; font-weight: 500; fill: #9db4b3; }
${S}.ah-res { fill: #9db4b3; }
${S}.ah-res-hit { fill: #f4f2ea; }
${S}.ah-hit { fill: #ffb869; fill-opacity: .12; }
${S}.ah-hitbar { fill: #ffb869; }
${S}.ah-note { font-size: 9.5px; font-weight: 500; fill: #ffb869; }
${S}.ah-verdict rect { fill: #ffb869; }
${S}.ah-verdict text { font-size: 9.5px; font-weight: 700; fill: #071315; }
${S}.ah-review rect { fill: #0e2024; stroke: #3a6f73; stroke-width: .9; }
${S}.ah-review circle, ${S}.ah-review path { fill: none; stroke: #b8f2eb; stroke-width: .9; stroke-linecap: round; }
${S}.ah-review text { font-size: 9.5px; font-weight: 500; fill: #b8f2eb; }
`;
let rules = '';
for (const [sel, list] of map) rules += sel.split(', ').map(s => `.is-playing ${S}${s}`).join(', ') + ` { animation: ${list.join(', ')}; }\n`;
const out = base + '\n/* timeline */\n' + kcss + rules +
  `@media (prefers-reduced-motion: reduce) { .is-playing ${S}* { animation: none !important; } }\n`;
if (wide) { process.stdout.write(out); process.exit(0); }
const file = path.join(__dirname, '..', '..', 'assets', 'css', 'internship-peek.css');
const START = '/* agentic-hunt:start */', END = '/* agentic-hunt:end */';
const css = fs.readFileSync(file, 'utf8');
const a = css.indexOf(START), b = css.indexOf(END);
if (a < 0 || b < a) throw new Error('markers not found in ' + file);
fs.writeFileSync(file, css.slice(0, a + START.length) + '\n' + out + css.slice(b));
console.log('agentic hunt: wrote', n, 'keyframes into', file);
