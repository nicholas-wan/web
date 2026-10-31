// The agent console on Experience (prefix c2-): the live system inside the Agentic AI card's "Hunt from a
// report" peek (README "Agentic AI console peek"); peek.cjs adds the status strip and the story panel around it.
//   node tools/scenes/agentic-console/build.cjs   writes scene.html, scene.css and timeline.json (the caption times
//                                                  peek.cjs remaps the story's phone offsets with) here
//   node tools/scenes/agentic-console/apply.cjs   puts the peek into experience.html and its CSS into internship-peek.css
// peek.cjs reads its beat times from the markup and CSS written here, so rerun both after changing the timeline.
// Strings were revised 27 Oct 2026 ("only expected entries", "Inconclusive, so it re-plans", a vendor-neutral
// pseudo-query) and 31 Oct 2026 after a threat-hunter review: a root-level path alone is not suspicious (many
// updaters live there), event 4698 needs its audit policy on, and stacking should surface the rare tail. A content
// review the same day made the checked query count hosts per task, which is what its evidence rows show.
// Story timing, strings and the timeline are below; base.css holds the static (final-frame) styles.
// Base: the caption-led console (one caption, one focal point per beat). From the annotation-led one: the end
// is split in two (7a the flag and its evidence; 7b the graph steps back, a bead travels, the Analyst lights
// with a flag badge) and the caption changes to the hand-off line in the frame the Analyst arrives.
// Rules: a caption appears only after the result it explains has landed and goes as the next entry lands;
// the header chip a beat is about is ringed; chip outcome slots stay empty until they resolve.
// Phones get their own timeline: +0.4s on every caption hold.
// Performance model (kept from v3 final): one transform per arriving slot (nested slots), everything else
// paint-only (registered custom properties feeding color-mix(), SVG strokes), windowed or fill-backwards tracks.
const fs = require('fs'); const path = require('path');
const OUT = __dirname;
const r3 = v => +(+v).toFixed(3);

// ---------------------------------------------------------------- story
const AG = {
  sup: { name: 'Supervisor', c: 'var(--c2-sup)', hex: '#8cb2ff' },
  hyp: { name: 'Hypothesis', c: 'var(--c2-hyp)', hex: '#f2a27a' },
  inv: { name: 'Investigator', c: 'var(--c2-inv)', hex: '#e3c463' },
  det: { name: 'Detection', c: 'var(--c2-det)', hex: '#63d6a0' },
  ana: { name: 'Analyst', c: 'var(--c2-amb)', hex: '#ffb869' },
};
const CAPS = [
  'Reads the report, picks what to hunt',
  'Turns it into a claim it can test',
  'Hunted recently, so set aside',
  'Only expected entries, still an answer',
  'Inconclusive, so it re-plans',
  'Checks the query before it runs',
  'Flags one task not in the baseline',
  'Hands it to an analyst, with the evidence',
];
// feed entries, oldest first (times filled in below). L = lands in the feed; D = a tool's result; R = result time.
const E = [
  { ag: 'sup', ty: 'tool', name: 'extract_ttps', res: 'three techniques' },
  { ag: 'hyp', ty: 'reason', text: 'An adversary may persist on workstations via scheduled tasks that relaunch the payload at logon.', wipe: 1.3 },
  { ag: 'inv', ty: 'tool', name: 'search_past_hunts', res: 'PowerShell · covered by a recent hunt' },
  { ag: 'det', ty: 'tool', name: 'run_search', res: 'Valid negative · only expected entries', rk: 'ok' },
  { ag: 'det', ty: 'tool', name: 'run_search', res: 'Scheduled tasks · Inconclusive', rk: 'inc', sub: 'Tasks made through the Task Scheduler API never launch schtasks.exe.' },
  { ag: 'det', ty: 'reason', text: 'Look for the task being created instead: event 4698, audited on these workstations.', replan: true, wipe: 1.0 },
  { ag: 'det', ty: 'tool', name: 'check_query', res: 'Query validated', rk: 'ok', code: true },
  { ag: 'det', ty: 'tool', name: 'request_review', res: 'Lead for analyst review', flag: true },
];
// --- timeline (desktop). Each caption starts just after its entry's result and fades (0.2s) as the next entry lands.
const GAP = 0.2, TOOL = 0.55, TRAVEL = 0.55;
const HOLD = [0.5, 0.7, 2.4, 0.8, 0, 3.0];          // hold before the next entry lands (31 Oct 2026: three beats; beat 5 and 7 set below;
                                                     // motion review: 0.6s off the set-aside hold, 1.4s onto the checked query, so beat 2's last line is read before beat 3)
const T0 = {};
const cap = [];
E[0].L = 0.6; E[0].D = E[0].L + TOOL; cap[0] = E[0].D + 0.15;
E[1].L = cap[0] + HOLD[0] + GAP; E[1].R = E[1].L + E[1].wipe; cap[1] = E[1].R + 0.1;
E[2].L = cap[1] + HOLD[1] + GAP; E[2].D = E[2].L + TOOL; cap[2] = E[2].D + 0.12;
E[3].L = cap[2] + HOLD[2] + GAP; E[3].D = E[3].L + TOOL; cap[3] = E[3].D + 0.12;
E[4].L = cap[3] + HOLD[3] + GAP; E[4].D = E[4].L + 0.6; cap[4] = E[4].D + 0.12;
// the re-plan: "Inconclusive" holds ~1.1s, then the loop draws under Detection, then the new plan lands
T0.LOOP = [E[4].D + 0.8, E[4].D + 0.8 + 0.9];
E[5].L = T0.LOOP[1] + 0.4; E[5].R = E[5].L + E[5].wipe;
E[6].L = E[5].R + 0.9; E[6].D = E[6].L + 0.65; cap[5] = E[6].D + 0.12;
E[7].L = cap[5] + HOLD[5] + GAP; E[7].D = E[7].L + 0.55;
cap[6] = E[7].D + 0.65;                              // after the Flagged badge and the evidence rows are in
T0.HUSH = cap[6] + 1.2;                              // 7b: the rest of the graph steps back
T0.HAND = [T0.HUSH + 0.25, 0.9];                     // amber bead: Detection -> the Analyst
T0.ANA = T0.HAND[0] + T0.HAND[1] - 0.15;             // the Analyst arrives as the bead lands
cap[7] = T0.ANA;                                     // ...and the hand-off line appears in that same frame
T0.END = cap[7] + 0.9;
for (const e of E) { e.L = r3(e.L); if (e.D != null) e.D = r3(e.D); }
const CAP_IN = 0.22;                                 // caption fade-in; fade-out is GAP
const CAP_ENTRY = [0, 1, 2, 3, 4, 6, 7];             // the entry each caption explains (the re-plan caption spans entries 4-5)
const capOut = i => (i < 7 ? (i === 6 ? T0.ANA : E[CAP_ENTRY[i + 1]].L) : null);  // gone by the time the next beat's entry lands
// chips: [technique, outcome, which entry resolves it, ring windows (entry-index ranges)]; `sn` and `short` are the name and
// outcome a narrow strip header shows instead (481–520px: the long ones clipped at the console's edge)
const CHIPS = [
  { id: 'T1053.005', name: 'Scheduled Task', out: 'Flagged', oc: 'var(--c2-amb)', ob: 'rgba(255,184,105,.7)', flag: true, at: () => E[7].D + 0.3 },
  { id: 'T1059.001', name: 'PowerShell', out: 'covered by a recent hunt', short: 'hunted recently', oc: 'var(--c2-sec)', ob: '#2b5155', at: () => E[2].D + 0.1 },
  { id: 'T1547.001', name: 'Registry Run Keys', sn: 'Run Keys', out: 'Valid negative', oc: '#7fe6da', ob: '#2b5155', ok: true, at: () => E[3].D + 0.1 },
];
const RINGS = [
  [0, () => E[1].L - 0.3, () => E[2].L - 0.35], [0, () => E[4].L - 0.3, () => T0.HUSH + 0.3],
  [1, () => E[2].L - 0.3, () => E[3].L - 0.35],
  [2, () => E[3].L - 0.3, () => E[4].L - 0.35],
];

// ---------------------------------------------------------------- phone timeline: +0.4s per caption hold
const PH = 0.4;
const TPh = t => { let s = 0; for (const c of cap) if (c + 0.3 < t - 1e-9) s += PH; return r3(t + s); };
const TD = t => r3(t);

// ---------------------------------------------------------------- geometry
// wide (panel > 825): graph column 256px; caption row 44px over the feed; list top = graph y 44 -> first dot y 59
const W = {
  sup: { x: 68, y: 76, w: 120, h: 32 },
  hyp: { x: 16, y: 138, w: 74, h: 50 }, inv: { x: 94, y: 138, w: 74, h: 50 }, det: { x: 172, y: 138, w: 74, h: 50 },
  ana: { x: 158, y: 244, w: 88, h: 30 },
  rail: 266, dot: 59, bus: 220,
};
// strip (tablets and phones): graph strip 268x160 at x 14; rail at x 6
const S = {
  sup: { x: 64, y: 8, w: 140, h: 30 },
  hyp: { x: 16, y: 60, w: 78, h: 44 }, inv: { x: 101, y: 60, w: 78, h: 44 }, det: { x: 186, y: 60, w: 78, h: 44 },
  ana: { x: 174, y: 124, w: 90, h: 28 },
  rail: 6, bus: 112,
};
const DOT_STRIP = 160 + 44 + 15;   // the strip layouts: a 160px graph, the 44px log-label row, then the feed's first dot
const cx = g => g.x + g.w / 2, bot = g => g.y + g.h;
function geo(G, strip, dot) {
  const sb = bot(G.sup), sc = cx(G.sup);
  const e = {};
  e.in = strip ? `M${sc} ${G.sup.y} V${G.sup.y}` : `M82 0 V${G.sup.y}`;
  for (const k of ['hyp', 'inv', 'det']) { const g = G[k]; e[k] = `M${sc} ${sb} C${sc} ${sb + 16} ${cx(g)} ${g.y - 16} ${cx(g)} ${g.y}`; }
  const hx = strip ? 216 : 200; e.ana = `M${hx} ${bot(G.det)} V${G.ana.y}`;
  const d = G.det, lb = bot(d);
  const loop = strip
    ? { d: `M252 ${lb} C252 ${lb + 13} 234 ${lb + 13} 234 ${lb + 3}`, ax: 234, ay: lb + 2 }
    : { d: `M236 ${lb} C236 ${lb + 19} 214 ${lb + 19} 214 ${lb + 3}`, ax: 214, ay: lb + 2 };
  const spark = {};
  if (strip) {
    const y = G.sup.y + G.sup.h / 2; spark.sup = `M${G.sup.x} ${y} H10 Q6 ${y} 6 ${y + 4} V${dot}`;
    for (const k of ['hyp', 'inv', 'det']) { const px = G[k].x + 10, yy = bot(G[k]); spark[k] = `M${px} ${yy} V${G.bus - 4} Q${px} ${G.bus} ${px - 4} ${G.bus} H10 Q6 ${G.bus} 6 ${G.bus + 4} V${dot}`; }
  } else {
    const px = G.sup.x + G.sup.w - 14; spark.sup = `M${px} ${G.sup.y} V${dot + 6} Q${px} ${dot} ${px + 6} ${dot} H${G.rail}`;
    for (const k of ['hyp', 'inv', 'det']) { const px = G[k].x + 12, yy = bot(G[k]); spark[k] = `M${px} ${yy} V${G.bus - 8} Q${px} ${G.bus} ${px + 8} ${G.bus} H${G.rail - 8} Q${G.rail} ${G.bus} ${G.rail} ${G.bus - 8} V${dot}`; }
  }
  return { e, loop, spark };
}

// ---------------------------------------------------------------- icons (drawn for this page)
const ICON = {
  sup: '<circle cx="6" cy="6" r="1.6"/><circle cx="2.4" cy="2.6" r="1"/><circle cx="9.6" cy="2.6" r="1"/><circle cx="6" cy="10.2" r="1"/><path d="M3.1 3.3l1.7 1.6M8.9 3.3L7.2 4.9M6 7.6v1.6"/>',
  hyp: '<path d="M4.6 1.6h2.8M5.1 1.6v3.1L2.4 9.6a.9.9 0 0 0 .8 1.3h5.6a.9.9 0 0 0 .8-1.3L6.9 4.7V1.6"/><path d="M3.6 7.6h4.8"/>',
  inv: '<path d="M2 6a4 4 0 1 0 1.2-2.85"/><path d="M1.8 1.6v1.9h1.9"/><path d="M6 3.9V6l1.5 1"/>',
  det: '<circle cx="6" cy="6" r="3.6"/><circle cx="6" cy="6" r="1"/><path d="M6 .9v2M6 9.1v2M.9 6h2M9.1 6h2"/>',
  ana: '<circle cx="6" cy="4" r="2"/><path d="M2.3 10.6c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  rep: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  loop: '<path d="M9.6 6a3.6 3.6 0 1 1-1.1-2.6"/><path d="M8.9 1.6v2.1H6.8"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
  tick: '<path d="M3 6.3l2 2 4-4.3"/>',
};
const svgI = (k, cls = '') => `<svg class="c2-ico ${cls}" viewBox="0 0 12 12" aria-hidden="true">${ICON[k]}</svg>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- html
const posv = k => { const a = W[k], b = S[k]; return `--x:${a.x}px;--y:${a.y}px;--w:${a.w}px;--h:${a.h}px;--sx:${b.x}px;--sy:${b.y}px;--sw:${b.w}px;--sh:${b.h}px`; };
const node = k => `<div class="c2-node c2-n--${k}" style="${posv(k)};--a:${AG[k].c}"><span class="c2-tile">${svgI(k, 'c2-ico--main')}${k === 'det' ? svgI('loop', 'c2-ico--loop') : ''}</span><span class="c2-name">${AG[k].name}</span>${k === 'ana' ? `<i class="c2-halo"></i><span class="c2-pin">${svgI('flag')}</span>` : ''}</div>`;

function wires(G, strip, dot, cls, w, h) {
  const { e, loop, spark } = geo(G, strip, dot);
  let s = `<svg class="c2-wires ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs>`;
  for (const k of ['hyp', 'inv', 'det']) s += `<linearGradient id="c2g-${cls}-${k}" gradientUnits="userSpaceOnUse" x1="0" y1="${bot(G.sup)}" x2="0" y2="${G[k].y}"><stop offset="0" stop-color="#8cb2ff" stop-opacity=".6"/><stop offset="1" stop-color="${AG[k].hex}"/></linearGradient>`;
  s += '</defs>';
  s += `<path class="c2-edge c2-edge--in" d="${e.in}" stroke="#8cb2ff"/>`;
  for (const k of ['hyp', 'inv', 'det']) s += `<path class="c2-edge c2-edge--${k}" d="${e[k]}" stroke="url(#c2g-${cls}-${k})"/>`;
  s += `<path class="c2-edge c2-edge--ana" d="${e.ana}" stroke="#ffb869"/>`;
  s += `<path class="c2-loop" d="${loop.d}" pathLength="1"/><path class="c2-loopbead" d="${loop.d}" pathLength="1"/><path class="c2-loophead" d="M${loop.ax - 3} ${loop.ay + 4} L${loop.ax} ${loop.ay} L${loop.ax + 3} ${loop.ay + 4}"/>`;
  PULSES.forEach(([k], i) => {
    const col = k === 'in' ? '#8cb2ff' : AG[k].hex;
    s += `<path class="c2-comet c2-pc${i}" d="${e[k]}" pathLength="1" stroke="${col}"/><path class="c2-bead c2-pb${i}" d="${e[k]}" pathLength="1" stroke="${col}"/>`;
  });
  s += `<path class="c2-comet c2-hc" d="${e.ana}" pathLength="1" stroke="#ffb869"/><path class="c2-bead c2-hb" d="${e.ana}" pathLength="1" stroke="#ffb869"/>`;
  for (const k of ['sup', 'hyp', 'inv', 'det']) s += `<path class="c2-wire c2-sw-${k}" d="${spark[k]}" stroke="${AG[k].hex}"/><path class="c2-comet c2-sc-${k}" d="${spark[k]}" pathLength="1" stroke="${AG[k].hex}"/><path class="c2-bead c2-sb-${k}" d="${spark[k]}" pathLength="1" stroke="${AG[k].hex}"/>`;
  return s + '</svg>';
}
// delegation pulses along graph edges: [edge, start]; travel 0.5s
const PULSE = 0.5;
const PULSES = [['in', 0.3], ['hyp', E[1].L - TRAVEL - PULSE - 0.1], ['inv', E[2].L - TRAVEL - PULSE - 0.1], ['det', E[3].L - TRAVEL - PULSE - 0.1]];

function card(e) {
  const a = AG[e.ag];
  if (e.ty === 'reason') {
    return `<div class="c2-card c2-card--reason"><span class="c2-row"><span class="c2-tag">Reason</span><b class="c2-who">${a.name}</b>${e.replan ? `<span class="c2-replan">${svgI('loop')}re-plan</span>` : ''}<span class="c2-txt"><span class="c2-wipe">${esc(e.text)}</span></span></span></div>`;
  }
  const icon = `<svg class="c2-si" viewBox="0 0 12 12" aria-hidden="true"><circle class="c2-spin" cx="6" cy="6" r="4.4" pathLength="1"/><path class="c2-tick" d="M3.2 6.3l1.9 1.9 3.7-4" pathLength="1"/></svg>`;
  const code = e.code ? `<span class="c2-code"><span class="c2-cl c2-cl1"><b>event_id</b> = 4698</span><span class="c2-cl c2-cl2">| <b>count distinct</b> host <b>by</b> task_name | <b>sort</b> count</span></span>` : '';
  const flag = e.flag ? `<span class="c2-flag">${svgI('flag')}Flagged</span>` : '';
  const sub = e.sub ? `<span class="c2-sub"><span class="c2-wipe">${esc(e.sub)}</span></span>` : '';
  const evid = e.flag ? `<span class="c2-ev"><span class="c2-evr c2-evr1"><span class="c2-mono c2-path"><span class="c2-pdir">\\Microsoft\\Windows\\Chkdsk\\</span><span class="c2-leaf">ProactiveScan</span></span><span class="c2-evn">built-in</span></span><span class="c2-evr c2-evr2"><span class="c2-mono c2-task">\\WinTaskUpdate</span><span class="c2-evn c2-evn--amb">1 host · not in baseline</span></span></span>` : '';
  return `<div class="c2-card c2-card--tool${e.flag ? ' c2-card--flag' : ''}"><span class="c2-row"><span class="c2-tag">Tool</span>${icon}<span class="c2-call">${e.name}</span><span class="c2-res c2-wipe${e.rk ? ' c2-res--' + e.rk : ''}">${esc(e.res)}</span>${flag}${sub}</span>${code}${evid}</div>`;
}
function entries() {
  let inner = '';
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    const O = e.flag ? 0.8 : e.code ? 0.7 : e.ty === 'reason' ? 0.6 : 0.55;
    const tv = (n, t) => `--${n}d:${TD(t)}s;--${n}p:${TPh(t)}s;`;
    const vars = `${tv('L', e.L)}--O:${O}s;${e.D != null ? tv('D', e.D) : ''}--a:${AG[e.ag].c}${e.wipe ? `;--wd:${e.wipe}s` : ''}`;
    inner = `<div class="c2-s c2-s${i}${i === E.length - 1 ? ' c2-s--top' : ''}" style="${vars}"><i class="c2-dot"></i>${card(e)}${inner}<i class="c2-veil"></i></div>`;
  }
  return inner;
}

const chipHtml = CHIPS.map((c, i) => `<span class="c2-chip c2-chip${i}" style="--oc:${c.oc};--ob:${c.ob}"><span class="c2-cid">${c.id}</span><span class="c2-cn">${c.sn ? `<span class="c2-col">${c.name}</span><span class="c2-cos">${c.sn}</span>` : c.name}</span><span class="c2-co">${c.flag ? svgI('flag') : c.ok ? svgI('tick') : ''}${c.short ? `<span class="c2-col">${c.out}</span><span class="c2-cos">${c.short}</span>` : c.out}</span></span>`).join('');
const ARIA = 'An illustrative hunt. Agents turn a ransomware report into three techniques to hunt. PowerShell was covered by a recent hunt, so it is set aside. The Run keys search finds only expected entries, a valid negative. For scheduled tasks the first search is inconclusive, so the Detection agent re-plans around event 4698 and checks its query before it runs. It flags one task, \\WinTaskUpdate, on one host and not in the baseline, and hands it to an analyst with the evidence.';
const html = `<div class="c2" role="img" aria-label="${esc(ARIA)}">
<div class="c2-head"><span class="c2-rep">${svgI('rep')}<span>Ransomware report</span></span><svg class="c2-arrow" viewBox="0 0 14 12" aria-hidden="true"><path d="M1 6h11M8.5 2.5 12 6l-3.5 3.5"/></svg><span class="c2-chips">${chipHtml}</span></div>
<div class="c2-cap"><span class="c2-ticks">${CAPS.map((_, i) => `<i class="c2-tk c2-tk${i}${i === CAPS.length - 1 ? ' c2-tk--now' : ''}"></i>`).join('')}</span><span class="c2-lines">${CAPS.map((t, i) => `<span class="c2-line c2-line${i}${i === CAPS.length - 1 ? ' c2-line--fin' : ''}">${esc(t)}</span>`).join('')}</span></div>
<div class="c2-g">
  ${wires(W, false, W.dot, 'c2-ww', 276, 312)}
  ${wires(S, true, DOT_STRIP, 'c2-wt', 268, 230)}
  ${['sup', 'hyp', 'inv', 'det', 'ana'].map(node).join('\n  ')}
</div>
<div class="c2-f"><div class="c2-list"><i class="c2-rail"></i>${entries()}</div></div>
</div>`;

// ---------------------------------------------------------------- animation compiler (one pass per timeline)
let kcss = ''; let kn = 0;
const EZ = { io: 'cubic-bezier(.45,0,.25,1)', out: 'cubic-bezier(.22,1,.36,1)', lin: 'linear' };
const P = (t, d) => (Math.max(0, Math.min(1, t / d)) * 100).toFixed(3) + '%';
function kf(stops) { const n = 'c2-k' + (kn++); kcss += `@keyframes ${n}{${stops.map(([p, d, e]) => `${p}{${d}${e ? `;animation-timing-function:${EZ[e] || e}` : ''}}`).join('')}}\n`; return n; }

// one timeline of animations; phones reuse the same keyframes with remapped delays and durations
// (same animation names in both, so crossing the phone breakpoint never restarts anything)
function tracks() {
  const rules = [];
  const add = (sel, name, dur, delay, fill, tf = 'linear') => rules.push([sel, { name, dur: r3(dur), delay: r3(delay), fill, tf }]);
  // a window on a 0..1 property: off -> on (rin) ... on -> off (rout), no fill outside it
  function win(sel, prop, a, b, rin = 0.3, rout = 0.4, startOn = false, on = 1) {
    const dur = r3(b - a + rout);
    const st = [[P(0, dur), `${prop}:${startOn ? on : 0}`, 'io']];
    if (!startOn) st.push([P(rin, dur), `${prop}:${on}`, null]);
    st.push([P(b - a, dur), `${prop}:${on}`, 'io'], ['100%', `${prop}:0`, null]);
    add(sel, kf(st), dur, a, 'none');
  }
  // a property that ends at its base value: `from` at a, ramp to `to` (fill backwards)
  function settle(sel, prop, from, a, ramp = 0.3, to = 1, ease = 'io') {
    add(sel, kf([['0%', `${prop}:${from}`, ease], ['100%', `${prop}:${to}`, null]]), ramp, a, 'backwards');
  }
  function comet(sel, t0, d, head) {
    const D = r3(d + 0.25);
    add(sel, kf([['0%', `stroke-dashoffset:${head ? 0 : .18};stroke-opacity:0`, 'io'], [P(0.15, D), 'stroke-opacity:1', null], [P(d, D), `stroke-dashoffset:${head ? -1 : -.82};stroke-opacity:1`, 'lin'], ['100%', `stroke-dashoffset:${head ? -1 : -.82};stroke-opacity:0`, null]]), D, t0, 'none');
  }

  // captions: sequential swap, never overlapping. In at cap[i]; out over GAP before the next beat's entry lands.
  CAPS.forEach((_, i) => {
    const sel = `.c2-line${i}`;
    if (i === CAPS.length - 1) settle(sel, '--c2-v', 0, cap[i], CAP_IN);
    else win(sel, '--c2-v', cap[i], capOut(i) - GAP, CAP_IN, GAP);
    // progress dots: lit from the beat on, the current one brighter
    settle(`.c2-tk${i}`, '--c2-v', 0, cap[i], 0.25);
    if (i < CAPS.length - 1) win(`.c2-tk${i}`, '--c2-g', cap[i], capOut(i) - GAP, 0.25, 0.3);
    else settle(`.c2-tk${i}`, '--c2-g', 0, cap[i], 0.25);
  });
  // nodes: idle until first used, a soft ring while acting
  const FIRST = { sup: 0.8, hyp: PULSES[1][1] + PULSE, inv: PULSES[2][1] + PULSE, det: PULSES[3][1] + PULSE };
  const ACTIVE = { sup: [[FIRST.sup, PULSES[1][1]]], hyp: [[FIRST.hyp, PULSES[2][1]]], inv: [[FIRST.inv, PULSES[3][1]]], det: [[FIRST.det, T0.HAND[0] + 0.3]] };
  for (const k of ['sup', 'hyp', 'inv', 'det']) {
    const f = FIRST[k];
    add(`.c2-n--${k}`, kf([['0%', '--c2-on:0', null], [P(f - 0.3, f), '--c2-on:0', 'io'], ['100%', '--c2-on:1', null]]), f, 0, 'backwards');
    for (const [a, b] of ACTIVE[k]) win(`.c2-n--${k}`, '--c2-g', a, b, 0.35, 0.5);
  }
  for (const k of ['sup', 'hyp', 'inv']) settle(`.c2-n--${k}`, '--c2-hush', 0, T0.HUSH, 0.7);
  win('.c2-n--det', '--c2-rp', T0.LOOP[0] - 0.15, E[5].R + 0.3, 0.35, 0.45);
  // the Analyst: absent until the bead lands, then fades in, rings once and shows its flag badge
  add('.c2-n--ana', kf([['0%', 'opacity:0', 'out'], ['100%', 'opacity:1', null]]), 0.4, T0.ANA, 'backwards');
  settle('.c2-pin', '--c2-v', 0, T0.ANA + 0.45, 0.35);
  add('.c2-halo', 'c2-halo', 1.3, T0.ANA + 0.15, 'none', 'cubic-bezier(.22,1,.36,1)');
  // header: the report glows while read; chips appear with the extracted techniques, outcomes fill in when known
  win('.c2-rep', '--c2-g', 0.05, 1.1, 0.3, 0.5);
  CHIPS.forEach((c, i) => { settle(`.c2-chip${i}`, '--c2-a', 0, E[0].D + i * 0.15, 0.4); settle(`.c2-chip${i}`, '--c2-o', 0, c.at(), 0.4); });
  // the chip each beat is about is ringed
  for (const [i, a, b] of RINGS) win(`.c2-chip${i}`, '--c2-r', a(), b(), 0.35, 0.45);
  // edges: brighten once used; Supervisor-side edges step back for the hand-off
  const USED = { in: 0.55, hyp: PULSES[1][1] + 0.25, inv: PULSES[2][1] + 0.25, det: PULSES[3][1] + 0.25 };
  for (const k of ['in', 'hyp', 'inv']) {
    const u = USED[k], h = T0.HUSH, d = r3(h + 0.7);
    add(`.c2-edge--${k}`, kf([['0%', 'stroke-opacity:.28', null], [P(u, d), 'stroke-opacity:.28', 'io'], [P(u + 0.5, d), 'stroke-opacity:.8', null], [P(h, d), 'stroke-opacity:.8', 'io'], ['100%', 'stroke-opacity:.32', null]]), d, 0, 'backwards');
  }
  add('.c2-edge--det', kf([['0%', 'stroke-opacity:.28', 'io'], ['100%', 'stroke-opacity:.8', null]]), 0.5, USED.det, 'backwards');
  settle('.c2-edge--ana', 'stroke-opacity', 0, T0.HAND[0] + 0.1, T0.HAND[1], 0.8);
  // pulses (stroke-opacity: plain opacity on SVG parts gets composited)
  PULSES.forEach(([, t], i) => { comet(`.c2-pc${i}`, t, PULSE, false); comet(`.c2-pb${i}`, t, PULSE, true); });
  comet('.c2-hc', T0.HAND[0], T0.HAND[1], false); comet('.c2-hb', T0.HAND[0], T0.HAND[1], true);
  // sparks: from the acting node down its wire into the feed, one per entry
  {
    const D = r3(TRAVEL + 0.25);
    const kc = kf([['0%', 'stroke-dashoffset:.16;stroke-opacity:0', 'io'], [P(0.15, D), 'stroke-opacity:1', null], [P(TRAVEL, D), 'stroke-dashoffset:-.84;stroke-opacity:1', 'lin'], ['100%', 'stroke-dashoffset:-.84;stroke-opacity:0', null]]);
    const kb = kf([['0%', 'stroke-dashoffset:0;stroke-opacity:0', 'io'], [P(0.15, D), 'stroke-opacity:1', null], [P(TRAVEL, D), 'stroke-dashoffset:-1;stroke-opacity:1', 'lin'], ['100%', 'stroke-dashoffset:-1;stroke-opacity:0', null]]);
    const kw = kf([['0%', 'stroke-opacity:0', 'io'], ['30%', 'stroke-opacity:.45', null], ['62%', 'stroke-opacity:.45', 'io'], ['100%', 'stroke-opacity:0', null]]);
    for (const e of E) { const t0 = e.L - TRAVEL; add(`.c2-sc-${e.ag}`, kc, D, t0, 'none'); add(`.c2-sb-${e.ag}`, kb, D, t0, 'none'); add(`.c2-sw-${e.ag}`, kw, 0.8, t0, 'none'); }
  }
  // feed focus: the newest entry gets its agent's ring; everything older sits under a veil (~40%)
  E.forEach((e, i) => {
    const next = i < E.length - 1 ? E[i + 1].L : null;
    if (next != null) { win(`.c2-s${i} > .c2-card`, '--c2-g', e.L - 0.25, next - 0.3, 0.35, 0.45); win(`.c2-s${i} > .c2-veil`, '--c2-v', e.L - 0.3, next - 0.1, 0.4, 0.4); }
    else { win(`.c2-s${i} > .c2-card`, '--c2-g', e.L - 0.25, T0.HUSH, 0.35, 0.6); settle(`.c2-s${i} > .c2-veil`, '--c2-v', 0, e.L - 0.3, 0.4); }
  });
  // re-plan loop
  add('.c2-loop', kf([['0%', 'stroke-dashoffset:1', 'io'], ['100%', 'stroke-dashoffset:0', null]]), T0.LOOP[1] - T0.LOOP[0], T0.LOOP[0], 'backwards');
  comet('.c2-loopbead', T0.LOOP[0], T0.LOOP[1] - T0.LOOP[0], true);
  add('.c2-loophead', kf([['0%', 'stroke-opacity:0', 'io'], ['100%', 'stroke-opacity:1', null]]), 0.3, T0.LOOP[1] - 0.15, 'backwards');

  const by = new Map(); for (const [s, a] of rules) { if (!by.has(s)) by.set(s, []); by.get(s).push(a); }
  const desk = [...by].map(([s, as]) => `.is-playing .hunt-panel ${s}{animation:${as.map(a => `${a.name} ${a.dur}s ${a.tf} ${a.delay}s ${a.fill}`).join(',')}}`).join('\n');
  // phones: same names, remapped start and end (a window that spans a beat boundary stretches a little)
  const phone = [...by].map(([s, as]) => {
    const m = as.map(a => { const d0 = TPh(a.delay), d1 = TPh(a.delay + a.dur); return [d0, r3(d1 - d0)]; });
    return `.is-playing .hunt-panel ${s}{animation-delay:${m.map(x => x[0] + 's').join(',')};animation-duration:${m.map(x => x[1] + 's').join(',')}}`;
  }).join('\n');
  return { desk, phone };
}

// ---------------------------------------------------------------- css
const { desk, phone } = tracks();
const css = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8') + `\n/* ---- generated (story ends at ${r3(T0.END)}s; phones ${TPh(T0.END)}s) ---- */\n` + kcss + desk + `\n@container c2p (max-width: 480px) {\n${phone}\n}\n`;
fs.writeFileSync(path.join(OUT, 'scene.html'), html);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ PH, caps: cap.map(r3) }) + '\n');
console.log('wrote scene.html', html.length, 'scene.css', css.length, 'keyframes', kn);
CAPS.forEach((c, i) => {
  const out = i < 7 ? capOut(i) - GAP : null;
  console.log(`  ${String(i + 1).padStart(2)} ${r3(cap[i]).toFixed(2).padStart(6)} -> ${out == null ? '  end ' : r3(out).toFixed(2).padStart(6)}  shown ${out == null ? '   -' : (out - cap[i]).toFixed(2)}s  phone ${TPh(cap[i]).toFixed(2)}${out == null ? '' : ' -> ' + TPh(out).toFixed(2)}  ${c}`);
});
console.log('  entries L/D:', E.map(e => `${e.L}/${e.D ?? (e.R ? r3(e.R) : '-')}`).join('  '), ' loop', T0.LOOP.map(r3), ' hush', r3(T0.HUSH), ' ana', r3(T0.ANA), ' end', r3(T0.END));
