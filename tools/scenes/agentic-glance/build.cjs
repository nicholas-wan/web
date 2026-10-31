// The Agentic AI card's "Hunt from a report" chart (README "Agentic AI glance chart"): one hunt in three plain steps,
// so a viewer takes it in at a glance (owner, 31 Oct 2026: the agent console "doesnt have the simplicity or polish of
// the other charts ... that viewers can appreciate at a glance"; "see if a laymen can understand and appreciate the
// agentic element. it doesnt have to be so squeezy inside"; "you can take up more space"). The narrative is the
// owner's (same day): "Narrow AI subagents purpose built for specific task. Agents equipped with tools and skills to
// iteratively adjust and adapt based on evidence found. Agents surface suspicious threats to assist analyst." Later
// the same day he asked for the animation to be "longer and more complex", with more narrative: it now plays the hunt
// as cause and effect over about 15 s, and each step shows one claim of the card's writeup without naming it.
//   node tools/scenes/agentic-glance/build.cjs   writes scene-d.svg, scene-m.svg and scene.css here
//   node tools/scenes/agentic-glance/apply.cjs   puts the peek into experience.html and the CSS into internship-peek.css
// Step 1, purpose-built agents (context engineering): the report drops into the supervisor, which hands a slice to
// each narrow agent in the product's order, Hypothesis first, then Detection, which lights and keeps the hunt.
// Step 2, equipped to adapt (defined tool access, guardrails): the agent's kit arrives; its first search comes back
// with none ("0 found", held: the hinge of the story); empty doesn't mean safe, so it loops back, checks its new
// query (the tick draws) and searches another way, and "0 found" turns into "1 found"; then it analyses the results. Step 3, surface to the analyst (analyst
// review points): the Report agent back in step 1 lights, the lead card writes itself, and the lead travels
// along the line to the amber human, who makes the call. Report agent last, as in the product (prime-th th-core).
// The hunter's specifics (schtasks.exe and nothing found; event 4698; \WinTaskUpdate on 1 host, not in the baseline)
// live in the aria-label only (owner: an evidence tier under each step "doesnt add value").
// Two SVGs sharing one stylesheet: desktop 640x246, the steps as columns in a 46rem card, the three pictures on one
// optical centreline; phones 360 wide, the steps stacked, each with the same picture drawn 1.4x above its words.
// Base styles are the final frame, motion runs only under .is-playing, .is-still holds the final frame; anything
// transient (pulses, ripples, glows, "0 found") is invisible in the base styles. internship-peek.js replays it once
// the final frame has held for 3 s. The finish comes from rounds of independent design reviews and blind reads (a
// reader with no brief says what the picture tells them): only the numbered headings bold; plain identical agent
// nodes, the followed one solid teal in both steps; pictures left-aligned with their headings; picture labels at 9px
// or more at natural size; teal for the machine and its finding, amber for the human alone; no hunter's jargon in
// the sentences. Strings stay generic (README); the aria-label starts "An illustrative hunt." (the verifier and the
// spec pin it).
const fs = require('fs'); const path = require('path');
const OUT = __dirname;

const C = { bg: '#061214', rule: '#24464b', line: '#1b3437', node: '#0b1b1e', chip: '#0a191c', ink: '#d8e6e4', body: '#b4c6c4', mute: '#8ba7a6', dim: '#4f6f6e',
  teal: '#28d7c5', amb: '#ffb869' };
const ICON = {
  ana: '<circle cx="6" cy="4" r="2"/><path d="M2.3 10.6c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  rep: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
  search: '<circle cx="5.2" cy="5.2" r="3.2"/><path d="M7.6 7.6 10.6 10.6"/>',
  check: '<path class="ag-tick" pathLength="1" d="M2.4 6.4l2.4 2.4 4.8-5.2"/>',
  bars: '<path d="M2.4 10.2V7.4M5 10.2V3.4M7.6 10.2V5.6M10.2 10.2V9"/>',
};
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}">${ICON[k]}</g>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);

// the three steps: a title and plain lines (wrapped for each layout)
const STEPS = [
  { title: 'Purpose-built agents', d: ['A local model does best with one job, so', 'each narrow agent gets only the tools', 'and context that job needs.'],
    m: ['A local model does best with one job, so each', 'narrow agent gets only the tools and context', 'that job needs.'] },
  { title: 'Equipped to adapt', d: ['No results can mean a bad query, not a', 'safe network. So the agent rewrites it,', 'checks the fix and searches again.'],
    m: ['No results can mean a bad query, not a safe network.', 'So the agent rewrites it, checks the fix and', 'searches again.'] },
  { title: 'Surface to the analyst', d: ['Agents flag what looks suspicious, with', 'the evidence attached. Only a human', 'analyst makes the call.'],
    m: ['Agents flag what looks suspicious, with the evidence', 'attached. Only a human analyst makes the call.'] },
];
const JOBS = ['Hypothesis', 'Detection', 'Report'], HYP = 0, ON = 1, REP = 2;   // the product's own agents, the three that read best (prime-th th-core: hypothesis, detection_logic, report); Detection searches
const LOOP_END = 200;   // degrees, clockwise from the right: where the loop's arc ends and its arrowhead points up
const TOOLS = [['search', 'search'], ['check', 'check query'], ['bars', 'analyse results']];   // the Detection agent's own steps (past hunts is the Hypothesis agent's tool)
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each given only the tools and context its one job needs, because a local model does best with one job: forming a hypothesis, writing and running the detection logic, reporting. Agents carry tools and skills. The Detection agent\'s first search, for schtasks.exe, comes back empty, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so the agent asks whether its search could have missed the threat, checks a new query and searches another way, around event 4698, a task being created. That surfaces one unusual task, \\WinTaskUpdate, on one host and not in the baseline. The Report agent writes it up with the evidence attached, and only a human analyst makes the call.';

// a plain agent node: a ring with a dot; the one we follow is solid teal
const node = (cx, cy, r, on, cls = '') => on
  ? `<circle class="${cls} ag-nd" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" stroke="${C.teal}"/>`
  : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.node}" stroke="${C.dim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.dim}"/>`;
// transient marks, invisible in the final frame: a node lighting up for a moment, a search rippling out
const flash = (cls, cx, cy, r) => `<circle class="ag-fl ${cls}" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" fill-opacity=".22" stroke="${C.teal}" stroke-width="1.6"/>`;
const ripple = (cls, cx, cy, r, col = C.teal) => `<circle class="ag-rip ${cls}" cx="${cx}" cy="${cy}" r="${r}" stroke="${col}" stroke-width="1.4"/>`;
const label = (x, y, f, t, anchor = 'middle', col = C.mute, cls = '') => `<text${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" text-anchor="${anchor}" font-size="${f}" fill="${col}">${esc(t)}</text>`;
// the pictures, left-aligned at x and centred on cy, drawn at a size r (phones draw the same ones, scaled up)
function picture(i, x, cy, r) {
  if (i === 0) {
    // the team: a supervisor over three narrow agents, each labelled with its job; the report drops into the
    // supervisor, a pulse runs to Hypothesis and then to Detection, which lights; Report lights later, in step 3
    const gap = 60, lf = 9.5, drop = r1(r * 3.4);
    const ay = r1(cy + 22), sy = r1(ay - drop), ax = [x + 22]; ax[1] = ax[0] + gap; ax[2] = ax[0] + 2 * gap; const scx = ax[1];
    const on = ON, rep = REP;
    const wire = cx => `M${scx} ${sy + r} C${scx} ${sy + r + 8} ${cx} ${ay - r - 8} ${cx} ${ay - r}`;
    let p = ax.map(cx => `<path d="${wire(cx)}" stroke="${C.dim}"/>`).join('');
    p += `<path class="ag-c ag-c0" d="${wire(ax[HYP])}" pathLength="1" stroke="${C.teal}"/><path class="ag-c ag-c0r" d="${wire(ax[HYP])}" pathLength="1" stroke="${C.teal}"/><path class="ag-c ag-c1" d="${wire(ax[on])}" pathLength="1" stroke="${C.teal}"/>` +
      `<path class="ag-c ag-c2" d="${wire(ax[rep])}" pathLength="1" stroke="${C.teal}"/>`;
    p += ripple('ag-rip-det', ax[on], ay, r) + node(scx, sy, r, false) + [0, 1, 2].map(k => node(ax[k], ay, r, k === on, k === on ? 'ag-det' : '')).join('') +
      `<circle class="ag-det-dot" cx="${ax[on]}" cy="${ay}" r="${r1(r * .3)}" fill="${C.dim}"/>`;   // until it lights, Detection looks like the others
    p += flash('ag-fl-sup', scx, sy, r) + flash('ag-fl-hyp', ax[HYP], ay, r) + flash('ag-fl-rep', ax[rep], ay, r);
    // the report itself, left of the supervisor, before it slides in
    p += `<g class="ag-doc">${icon('rep', r1(scx - 70), r1(sy - 12), 2, C.ink)}</g>`;
    p += label(scx, sy - r - 5, lf, 'Supervisor');
    JOBS.forEach((j, k) => {
      const ly = ay + r + lf + 3;
      p += `<g class="${k === ON ? 'ag-job-on' : ''}">${label(ax[k], ly, lf, j, 'middle', k === ON ? C.teal : C.mute)}</g>`;
      if (k === HYP) p += label(ax[k], ly, lf, j, 'middle', C.teal, 'ag-fl ag-fl-hyp');
      if (k === REP) p += label(ax[k], ly, lf, j, 'middle', C.teal, 'ag-fl ag-fl-rep');
    });
    return p;
  }
  if (i === 1) {
    // the acting agent, the same teal dot, with its kit of tools; it searches (a ripple), finds none, loops back,
    // checks its new query, searches again and finds one, then analyses the results
    const lr = r + 10, cx = x + lr + 3;
    // the arc runs clockwise from 60 degrees above the right to just above the left; its arrowhead is two strokes
    // either side of the tangent at the end, like a retry icon (owner: "the arrow on 2nd chart still looks weird")
    const pt = (deg, d = 0) => { const t = deg * Math.PI / 180; return `${r1(cx + lr * Math.cos(t) + d * -Math.sin(t))} ${r1(cy + lr * Math.sin(t) + d * Math.cos(t))}`; };
    const t1 = LOOP_END * Math.PI / 180, tip = [cx + lr * Math.cos(t1), cy + lr * Math.sin(t1)];
    const tb = (LOOP_END - 16) * Math.PI / 180, back = Math.atan2(cy + lr * Math.sin(tb) - tip[1], cx + lr * Math.cos(tb) - tip[0]);
    const wing = sgn => `${r1(tip[0] + 6 * Math.cos(back + sgn * .7))} ${r1(tip[1] + 6 * Math.sin(back + sgn * .7))}`;
    const head = `M${wing(1)} L${r1(tip[0])} ${r1(tip[1])} L${wing(-1)}`;
    let p = ripple('ag-rip0', cx, cy, r) + ripple('ag-rip1', cx, cy, r) + ripple('ag-rip2', cx, cy, r) + ripple('ag-rip3', cx, cy, r) +
      flash('ag-fl-arr', cx, cy, r + 4) + node(cx, cy, r, true) +
      `<path class="ag-loop" d="M${pt(-60)} A${lr} ${lr} 0 1 1 ${pt(LOOP_END)}" pathLength="1" stroke="${C.teal}" stroke-width="1.5"/>` +
      `<path class="ag-lh" d="${head}" stroke="${C.teal}" stroke-width="1.5"/>`;
    {
      const tx = cx + lr + 12, th = 18, tw = 102, ty0 = cy - th * 1.5 - 6;
      TOOLS.forEach(([ic, name], k) => {
        const ty = r1(ty0 + k * (th + 6)), wire = `M${cx + lr + 2} ${cy} C${cx + lr + 6} ${cy} ${tx - 6} ${ty + th / 2} ${tx} ${ty + th / 2}`;
        const glow = g => `<path class="ag-fl ag-gw ${g}" d="${wire}" stroke="${C.teal}" stroke-width="1.4"/><rect class="ag-fl ${g}" x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="${C.teal}" fill-opacity=".12" stroke="${C.teal}"/>`;
        p += `<g class="ag-tool ag-tool${k}"><path d="${wire}" stroke="${C.rule}"/>` +
          `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>` +
          (k === 0 ? glow('ag-g0a') + glow('ag-g0b') : glow(`ag-g${k}`)) +
          (k === 1 ? icon(ic, tx + 6, ty + 3, 1, C.dim).replace(' class="ag-tick"', '') : '') + `${icon(ic, tx + 6, ty + 3, 1, C.teal)}<text x="${tx + 22}" y="${ty + 12.5}" font-size="10" fill="${C.body}">${name}</text>`;
        // what the search found: none the first time, one the second
        if (k === 0) p += `<text class="ag-none" x="${tx + tw - 7}" y="${ty + 12.5}" text-anchor="end" font-size="9.5" font-weight="600" fill="${C.body}">0 found</text>` +
          `<text class="ag-found" x="${tx + tw - 7}" y="${ty + 12.5}" text-anchor="end" font-size="9.5" font-weight="700" fill="${C.teal}">1 found</text>`;
        p += '</g>';
      });
    }
    return p;
  }
  // the hand-off: a lead card, the finding with its evidence attached, passed along a line to the human
  const R = r1(r * 1.25);
  const human = cx => `<g class="ag-ana"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.5"/>${icon('ana', r1(cx - 6 * R / 7), r1(cy - 6 * R / 7), r1(R / 7), C.amb)}</g>` +
    ripple('ag-halo', cx, cy, R, C.amb);
  const packet = (lx0, lx1) => `<circle class="ag-pk" cx="${lx0}" cy="${cy}" r="3" fill="${C.teal}" style="--dx:${r1(lx1 - lx0)}px"/>`;
  const cw = 90, ch = 57, cx0 = x - 1.5, cy0 = cy - ch / 2, lx0 = cx0 + cw + 6, lx1 = lx0 + 53, cx = lx1 + 6.5 + R;   // the card's stroke on the heading's edge; the dashes end on a full dash
  // the write-up: the lead and the technique it names; the text starts under the flag's pole
  return `<g class="ag-flag"><rect class="ag-cardf" x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" fill="${C.chip}"/>` +
    `<rect class="ag-cardo" x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" pathLength="1" stroke="${C.teal}" stroke-opacity=".7"/>` +
    `<g class="ag-lead">${icon('flag', cx0 + 7, cy0 + 8, 1.2, C.teal)}<text x="${cx0 + 25}" y="${cy0 + 19}" font-size="10.5" font-weight="700" fill="${C.ink}">1 lead</text></g>` +
    `<text class="ag-ln0" x="${cx0 + 10.5}" y="${cy0 + 34}" font-size="9.5" fill="${C.body}">Scheduled Task</text>` +
    `<text class="ag-ln1" x="${cx0 + 10.5}" y="${cy0 + 46}" font-size="9" letter-spacing=".02em" fill="${C.mute}">T1053.005</text></g>` +
    `<path class="ag-he" d="M${lx0} ${cy} H${lx1}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round"/>` +
    packet(lx0, lx1) + human(cx);
}
const title = (i, x, y, f) => `<text class="ag-t" x="${x}" y="${y}" font-size="${f}" font-weight="700" fill="${C.ink}"><tspan fill="${i === 2 ? C.amb : C.teal}" font-size="${r1(f - 2)}">${i + 1}</tspan><tspan dx="7">${STEPS[i].title}</tspan></text>`;
const body = (lines, x, y, lh, f) => lines.map((t, j) => `<text x="${x}" y="${r1(y + j * lh)}" font-size="${f}" font-weight="400" fill="${C.body}">${esc(t)}</text>`).join('');
// the product's mark in its one-colour form, ink on a tile in the chart's own colours (owner, 31 Oct 2026: use the
// logo, but "dont put the exact product name. Agentic Threat Hunting"); its brand orange stayed out after a visual
// review found it the loudest thing on the card, spending warm colour before the amber human arrives
const MARK = ['M14 2.2A10 10 0 0 1 21.8 10L18.97 10A7.25 7.25 0 0 0 14 5.03ZM21.8 14A10 10 0 0 1 14 21.8L14 18.97A7.25 7.25 0 0 0 18.97 14ZM10 21.8A10 10 0 0 1 2.2 14L5.03 14A7.25 7.25 0 0 0 10 18.97ZM2.2 10A10 10 0 0 1 10 2.2L10 5.03A7.25 7.25 0 0 0 5.03 10Z', 'M12 6L18 12L12 18L6 12Z'];
const logo = (x, y, s) => `<g class="ag-logo"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r1(s * .25)}" fill="${C.node}" stroke="${C.rule}"/>` +
  `<g transform="translate(${r1(x + s * .17)} ${r1(y + s * .17)}) scale(${+(s * .66 / 24).toFixed(4)})">${MARK.map(d => `<path d="${d}"/>`).join('')}</g></g>`;
// the header: the product line and what the viewer is looking at (the technique is on the lead card); phones stack
// the headline under the product line
const PRODUCT = 'Agentic Threat Hunting', HEADLINE = 'From a ransomware report to one lead';
function header(w, y, fh, phone) {
  const s = r1(fh * (phone ? 1.45 : 1.25)), sx = 16 + s + 6, line = phone ? y + 35 : y + 11;
  // the divider is a glyph in the same line of text, so it keeps its place whichever font loads
  let h = `<g class="ag-head">${logo(16, r1(y - s + fh * (phone ? .38 : .3)), s)}<text x="${sx}" y="${y}" font-size="${fh}" font-weight="700" fill="${C.ink}">${PRODUCT}` +
    (phone ? '</text>' : `<tspan dx="8" font-weight="400" fill="${C.dim}">|</tspan><tspan dx="8" font-weight="400" fill="${C.body}">${HEADLINE}</tspan></text>`);
  if (phone) h += `<text x="16" y="${y + 21}" font-size="${r1(fh - .5)}" fill="${C.body}">${HEADLINE}</text>`;
  return h + `</g><path d="M16 ${line} H${w - 16}" stroke="${C.line}"/>`;
}
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, read left to right; pictures left-aligned with their headings, on one centreline
function desktop() {
  const W = 640, H = 246, col = 200, x0 = 16, gap = 8, pcy = 100, titleY = 178, bodyY = 197, lh = 15.5, f = { head: 11.5, hid: 9.5, title: 12.5, body: 10.3 };
  const s = [open('ag-scene', W, H), header(W, 23, f.head)];
  STEPS.forEach((st, i) => {
    const x = x0 + i * (col + gap);
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, x + 2, pcy, 13)}</g>${title(i, x, titleY, f.title)}${body(st.d, x, bodyY, lh, f.body)}</g>`);
    if (i < 2) s.push(`<path class="ag-chev ag-chev${i}" d="M${x + col - 16} ${pcy - 5} l4 5 -4 5" stroke="${C.mute}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  });
  return s.join('') + '</svg>';
}
// phones: the steps stacked, each with the desktop's full picture (labels, kit, lead card) drawn larger above its
// words, so nothing is squeezed (owner, 31 Oct 2026: "on mobile, you can take up more space for the animations. dont
// need to squeeze"), each centred on the card ("not centered on mobile"); EXT and EXTX are each picture's reach
// above and below its centreline and left and right of its origin, in the picture's own units
const PS = 1.4, EXT = [[48, 50], [34, 34], [29, 29]], EXTX = [[-5, 159], [-1, 163.5], [-2, 187.3]];
function phone() {
  const W = 360, x = 14, lh = 18.5, f = { head: 13, hid: 11, title: 14.5, body: 13.4 };
  const parts = []; let y = 64;
  STEPS.forEach((st, i) => {
    const cy = r1(y + 26 + EXT[i][0] * PS), ty = r1(cy + EXT[i][1] * PS + 22), by = r1(ty + 22);
    const px = r1(W / 2 - PS * (EXTX[i][0] + EXTX[i][1]) / 2 - PS * 2);
    parts.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}"><g transform="translate(${px} ${cy}) scale(${PS})">${picture(i, 2, 0, 13)}</g></g>${title(i, x + 2, ty, f.title)}${body(st.m, x + 2, by, lh, f.body)}</g>`);
    y = r1(by + (st.m.length - 1) * lh + 22);
    if (i < 2) parts.push(`<path d="M14 ${y} H${W - 14}" stroke="${C.line}"/>`);
  });
  const H = r1(y + 2);
  return { svg: open('ag-scene ag-scene--m', W, H) + header(W, 25, f.head, true) + parts.join('') + '</svg>', H };
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// [start, duration] in seconds. Steps 2 and 3 wait with their words dimmed and their pictures hidden, so the card's shape shows from the start. Step 1: the report
// drops in, the supervisor hands Hypothesis its slice and takes its result back, then hands Detection the hunt, which
// lands with a ripple. Step 2: the kit, a search that finds none (held, the hinge of the story), the loop and the
// checked query, a second search that finds one, the analysis. Step 3: the Report agent lights, the lead card writes
// itself, then travels to the human.
const T = {
  s0: [0.2, .5], doc: [0.3, 1.4], sup: [1.5, .7], c0: [1.8, .7], hyp: [2.3, 1.0], c0r: [3.0, .6], c1: [3.5, .7], det: [4.1, .45], ripdet: [4.1, 1.0], chev0: [4.9, .9],
  s1: [5.2, .5], arr: [5.4, .9], tool: [[5.7, .35], [5.95, .35], [6.2, .35]],
  g0a: [6.7, 1.3], rip0: [6.8, 1.1], rip1: [7.1, 1.1], none: [7.7, 3.6],
  loop: [8.9, 1.0], g1: [9.3, 1.1], tick: [9.55, .5], lh: [9.8, .25],
  g0b: [10.4, 1.3], rip2: [10.5, 1.1], rip3: [10.8, 1.1], found: [11.3, .45], g2: [11.7, .9], chev1: [12.4, .9],
  s2: [12.8, .5], c2: [12.9, .6], rep: [13.4, .8], cardf: [13.9, .4], cardo: [13.9, .8], lead: [14.4, .35], ln: [[14.6, .35], [14.8, .35]],
  he: [15.3, .4], pk: [15.5, .55], ana: [16.0, .5], halo: [16.4, 1.1],
};
const OUT_EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)';
const P = '.is-playing svg.ag-scene', PH = phone();
const at = ([d, s], name, ez = IO, fill = 'both') => `animation: ${name} ${s}s ${ez} ${d}s ${fill};`;
const ends = Object.values(T).flatMap(v => Array.isArray(v[0]) ? v : [v]).map(([d, s]) => d + s);
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / 246; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / ${PH.H}; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
svg.ag-scene text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
svg.ag-scene .ag-i { fill: none; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-flag .ag-i { stroke-width: inherit; }
svg.ag-scene .ag-ana .ag-i { stroke-width: .85; }
svg.ag-scene .ag-logo path { fill: ${C.ink}; }   /* (scaled R/7, so about the other icons' 1.3-1.8) */
svg.ag-scene .ag-doc .ag-i { stroke-width: .6; }
svg.ag-scene path, svg.ag-scene .ag-rip, svg.ag-scene .ag-cardo { fill: none; }
svg.ag-scene .ag-doc path:first-child { fill: ${C.chip}; }
svg.ag-scene .ag-c { stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: .16 2; stroke-opacity: 0; }
svg.ag-scene .ag-loop, svg.ag-scene .ag-tick, svg.ag-scene .ag-cardo { stroke-dasharray: 1 2; stroke-dashoffset: 0; stroke-linecap: round; }   /* (undrawn, the dash sits wholly before the start, so no round cap shows as a dot) */
svg.ag-scene .ag-lh { stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-s, svg.ag-scene .ag-chev, svg.ag-scene .ag-ana { transform-box: fill-box; transform-origin: center; }
svg.ag-scene .ag-rip, svg.ag-scene .ag-found, svg.ag-scene .ag-doc { transform-box: fill-box; transform-origin: center; }
svg.ag-scene .ag-rip { vector-effect: non-scaling-stroke; }
/* transient marks: hidden in the final frame, shown only while they play */
svg.ag-scene .ag-fl, svg.ag-scene .ag-rip, svg.ag-scene .ag-doc, svg.ag-scene .ag-none, svg.ag-scene .ag-pk, svg.ag-scene .ag-det-dot { opacity: 0; }
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-out { from { opacity: 1; } }
@keyframes ag-wake { from { opacity: .2; } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-draw { from { stroke-dashoffset: 1.05; } }
@keyframes ag-det { from { fill: ${C.node}; stroke: ${C.dim}; } }
@keyframes ag-job { from { fill: ${C.mute}; } }
@keyframes ag-comet { 0% { stroke-dashoffset: .18; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: -.82; stroke-opacity: 1; } 100% { stroke-dashoffset: -.82; stroke-opacity: 0; } }
@keyframes ag-comet-r { 0% { stroke-dashoffset: -.82; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: .18; stroke-opacity: 1; } 100% { stroke-dashoffset: .18; stroke-opacity: 0; } }
@keyframes ag-flash { 0%, 100% { opacity: 0; } 25%, 65% { opacity: 1; } }
@keyframes ag-hold { 0%, 100% { opacity: 0; } 8%, 90% { opacity: 1; } }
@keyframes ag-rip { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.8); } }
@keyframes ag-halo { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); } }
@keyframes ag-doc { 0% { opacity: 0; transform: translate(0, -6px); } 25%, 55% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(58px, 0) scale(.4); } }
@keyframes ag-chev { 0%, 100% { stroke: ${C.mute}; transform: none; } 45% { stroke: ${C.teal}; transform: translateX(3px); } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 15%, 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
@keyframes ag-pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.1); } 100% { transform: scale(1); } }
/* step 1: the report drops into the supervisor, which hands Hypothesis its slice and takes its result back, then hands Detection the hunt */
${P} .ag-s0 { ${at(T.s0, 'ag-in', OUT_EZ)} }
${P} .ag-doc { ${at(T.doc, 'ag-doc', IO, 'none')} }
${P} .ag-fl-sup { ${at(T.sup, 'ag-flash', IO, 'none')} }
${P} .ag-c0 { ${at(T.c0, 'ag-comet', 'linear', 'none')} }
${P} .ag-fl-hyp { ${at(T.hyp, 'ag-flash', IO, 'none')} }
${P} .ag-c0r { ${at(T.c0r, 'ag-comet-r', 'linear', 'none')} }
${P} .ag-c1 { ${at(T.c1, 'ag-comet', 'linear', 'none')} }
${P} .ag-rip-det { ${at(T.ripdet, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-det { ${at(T.det, 'ag-det')} }
${P} .ag-det-dot { ${at(T.det, 'ag-out')} }
${P} .ag-job-on text { ${at(T.det, 'ag-job')} }
${P} .ag-chev0 { ${at(T.chev0, 'ag-chev', IO, 'none')} }
/* step 2: the agent and its kit; a search that finds nothing, the loop and the checked query, a search that finds one */
${P} .ag-s1 { ${at(T.s1, 'ag-wake', OUT_EZ)} }
${P} .ag-p1 { ${at(T.s1, 'ag-fade')} }
${P} .ag-fl-arr { ${at(T.arr, 'ag-flash', IO, 'none')} }
${T.tool.map((t, k) => `${P} .ag-tool${k} { ${at(t, 'ag-fade')} }`).join('\n')}
${P} .ag-g0a { ${at(T.g0a, 'ag-flash', IO, 'none')} }
${P} .ag-rip0 { ${at(T.rip0, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-rip1 { ${at(T.rip1, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-none { ${at(T.none, 'ag-hold', 'linear', 'none')} }
${P} .ag-loop { ${at(T.loop, 'ag-draw')} }
${P} .ag-lh { ${at(T.lh, 'ag-fade')} }
${P} .ag-g1 { ${at(T.g1, 'ag-flash', IO, 'none')} }
${P} .ag-tick { ${at(T.tick, 'ag-draw')} }
${P} .ag-g0b { ${at(T.g0b, 'ag-flash', IO, 'none')} }
${P} .ag-rip2 { ${at(T.rip2, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-rip3 { ${at(T.rip3, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-found { ${at(T.found, 'ag-pop', OUT_EZ)} }
${P} .ag-g2 { ${at(T.g2, 'ag-flash', IO, 'none')} }
${P} .ag-chev1 { ${at(T.chev1, 'ag-chev', IO, 'none')} }
/* step 3: the Report agent lights and the lead card writes itself; the lead travels to the human */
${P} .ag-s2 { ${at(T.s2, 'ag-wake', OUT_EZ)} }
${P} .ag-p2 { ${at(T.s2, 'ag-fade')} }
${P} .ag-flag { ${at(T.cardf, 'ag-fade')} }
${P} .ag-cardo { ${at(T.cardo, 'ag-draw')} }
${P} .ag-lead { ${at(T.lead, 'ag-fade')} }
${P} .ag-ln0 { ${at(T.ln[0], 'ag-fade')} }
${P} .ag-ln1 { ${at(T.ln[1], 'ag-fade')} }
${P} .ag-c2 { ${at(T.c2, 'ag-comet', 'linear', 'none')} }
${P} .ag-fl-rep { ${at(T.rep, 'ag-flash', IO, 'none')} }
${P} .ag-he { ${at(T.he, 'ag-fade')} }
${P} .ag-pk { ${at(T.pk, 'ag-pk', IO, 'none')} }
${P} .ag-ana { ${at(T.ana, 'ag-pop', OUT_EZ)} }
${P} .ag-halo { ${at(T.halo, 'ag-halo', OUT_EZ, 'none')} }
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), PH.svg);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', PH.svg.length, '(phone 360x' + PH.H + ')', 'scene.css', css.length, 'ends ~', Math.max(...ends).toFixed(1) + 's');
