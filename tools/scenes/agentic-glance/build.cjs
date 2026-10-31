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
// query (the tick draws) and searches another way, and "0 found" turns into "32 found", every task created; then it analyses them and one is unusual. Step 3, surface to the analyst (analyst
// review points): the Report agent back in step 1 lights, the lead card writes itself, and the lead travels
// along the line to the amber human, who makes the call. Report agent last, as in the product (prime-th th-core).
// The hunter's specifics (schtasks.exe and nothing found; event 4698; \WinTaskUpdate on 1 host, not in the baseline)
// live in the aria-label, not in the final frame (owner: an evidence tier under each step "doesnt add value"). While
// it plays, the motion shows what an agent and a query look like (owner, 31 Oct 2026: "more detailed / slick - how
// does an agent, query, look like"): each agent spins while it works, and the Detection agent writes its two queries
// out under its kit, generic rather than any SIEM's syntax, then folds them into the analysis; none of it stays.
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
const JOBS = ['Hypothesis', 'Detection', 'Reporting'], HYP = 0, ON = 1, REP = 2;   // the product's own agents, the three that read best (prime-th th-core: hypothesis, detection_logic, report); Detection searches
const LOOP_END = 200;   // degrees, clockwise from the right: where the loop's arc ends and its arrowhead points up
const TOOLS = [['search', 'search'], ['check', 'check query'], ['bars', 'analyse results']];   // the Detection agent's own steps (past hunts is the Hypothesis agent's tool)
// the two searches the agent writes, in no SIEM's syntax (the verifier's rule): the tool the obvious hunt looks for,
// then the event a task's creation logs whichever tool made it; MONO is a character's width at 9px, fixed by textLength
const QUERIES = [['process', 'schtasks.exe'], ['event', 'task created']], MONO = 5.4;
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each given only the tools and context its one job needs, because a local model does best with one job: forming a hypothesis, writing and running the detection logic, reporting. Agents carry tools and skills. The Detection agent\'s first search, for schtasks.exe, comes back empty, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so the agent asks whether its search could have missed the threat, checks a new query and searches another way, around event 4698, a task being created. That returns every task created; analysing them surfaces one unusual task, \\WinTaskUpdate, on one host and not in the baseline. The Reporting agent writes it up with the evidence attached, and only a human analyst makes the call.';

// a plain agent node: a ring with a dot; the one we follow is solid teal
const node = (cx, cy, r, on, cls = '') => on
  ? `<circle class="${cls} ag-nd" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" stroke="${C.teal}"/>`
  : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.node}" stroke="${C.dim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.dim}"/>`;
// transient marks, invisible in the final frame: a node lighting up for a moment, a search rippling out
const flash = (cls, cx, cy, r) => `<circle class="ag-fl ${cls}" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" fill-opacity=".22" stroke="${C.teal}" stroke-width="1.2"/>`;
const ripple = (cls, cx, cy, r, col = C.teal) => `<circle class="ag-rip ${cls}" cx="${cx}" cy="${cy}" r="${r}" stroke="${col}" stroke-width="1.4"/>`;
// an agent at work: a short arc turning round it, the spinner agent products show while a model thinks (Prophet's
// "analyzing", a chat's tool call in flight)
const spin = (cls, cx, cy, r) => `<circle class="ag-spin ${cls}" cx="${cx}" cy="${cy}" r="${r}" pathLength="1" fill="none" stroke="${C.teal}" stroke-width="1.6"/>`;
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
    p += flash('ag-fl-sup', scx, sy, r) + flash('ag-fl-hyp', ax[HYP], ay, r) + flash('ag-fl-rep', ax[rep], ay, r) +
      spin('ag-sp-sup', scx, sy, r + 3) + spin('ag-sp-hyp', ax[HYP], ay, r + 3) + spin('ag-sp-rep', ax[rep], ay, r + 3);
    // the threat report itself, labelled, left of the supervisor, before it slides in
    p += `<g class="ag-doc">${icon('rep', r1(scx - 70), r1(sy - 23), 2, C.ink)}${label(scx - 58, r1(sy + 12), 9, 'Threat report')}</g>`;   // the label under the page, so it never reads on one line with Supervisor
    p += label(scx, sy - r - 7, lf, 'Supervisor');
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
      flash('ag-fl-arr', cx, cy, r + 4) + node(cx, cy, r, true) + spin('ag-sp-det', cx, cy, r + 5) +
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
          (k === 1 ? icon(ic, tx + 6, ty + 3, 1, C.dim).replace(' class="ag-tick"', '') : '') + `${icon(ic, tx + 6, ty + 3, 1, C.teal)}<text${k === 1 ? ' class="ag-ck"' : ''} x="${tx + 22}" y="${ty + 12.5}" font-size="10" fill="${C.body}">${name}</text>` +
          (k === 1 ? `<text class="ag-rw" x="${tx + 22}" y="${ty + 12.5}" font-size="10" font-weight="600" fill="${C.teal}">rewrite query</text>` : '');
        // what the search found: none the first time, one the second
        if (k === 0) p += `<text class="ag-none" x="${tx + tw - 7}" y="${ty + 12.5}" text-anchor="end" font-size="9.5" font-weight="600" fill="${C.body}">0 found</text>` +
          `<text class="ag-found" x="${tx + tw - 7}" y="${ty + 12.5}" text-anchor="end" font-size="9.5" font-weight="700" fill="${C.teal}">32 found</text>`;
        p += '</g>';
      });
    }
    // the query itself, under the kit while the agent works, the way agent products open the tool call in flight and
    // fold it away once it's done: a line of code streams in a few characters at a time behind a caret; after the
    // empty search it is selected and rewritten; then it gives way to the analysis, every result a grey dot and the
    // one that fits no baseline teal. All of it is transient, so the final frame keeps its plain glance
    {
      const sx = x + 3, qy = r1(cy + 39), qw = 162, qh = 14, tx0 = sx + 15, base = r1(qy + 9.9);   // sx: the loop's left edge
      p += `<g class="ag-q"><rect x="${sx}" y="${qy}" width="${qw}" height="${qh}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>`;
      QUERIES.forEach(([f, v], k) => {
        const len = r1((f.length + v.length + 5) * MONO);
        p += `<g class="ag-q${k}">` + (k === 0 ? `<rect class="ag-qsel" x="${tx0 - 1.5}" y="${qy + 2.5}" width="${r1(len + 3)}" height="${qh - 5}" rx="2" fill="${C.teal}" fill-opacity=".28"/>` : '') +
          `<text x="${sx + 6}" y="${base}" font-size="10" font-weight="700" fill="${C.teal}">&#8250;</text>` +
          `<text class="ag-qt" x="${tx0}" y="${base}" font-size="9" textLength="${len}" lengthAdjust="spacing"><tspan fill="${C.body}">${f}</tspan><tspan fill="${C.dim}"> = </tspan><tspan fill="${C.teal}">"${esc(v)}"</tspan></text>` +
          `<rect class="ag-qc" x="${tx0 - .5}" y="${qy + 1.5}" width="${r1(len + 2)}" height="${qh - 3}" fill="${C.chip}"/>` +
          `<rect class="ag-qk" x="${tx0}" y="${qy + 3}" width="1.2" height="${qh - 6}" fill="${C.teal}" style="--w:${len}px"/></g>`;
      });
      // the analysis: the results as an even grid of grey dots, a scan passing over them, and the one result that
      // fits no baseline set apart in teal with its word
      let d = ''; const gx = sx + 8, gs = 6.4, gw = 15 * gs, OUT = 26;   // OUT: the unusual one, 11th along the second row
      for (let j = 0; j < 32; j++) if (j !== OUT) d += `<circle cx="${r1(gx + (j % 16) * gs)}" cy="${r1(qy + 4.5 + (j >> 4) * 5)}" r="1.6" fill="${C.dim}"/>`;
      const ox = r1(gx + (OUT % 16) * gs), oy = r1(qy + 9.5);
      p += `<g class="ag-qd">${d}<rect class="ag-qs" x="${gx - 3}" y="${qy + 2}" width="2" height="${qh - 4}" rx="1" fill="${C.teal}" style="--w:${gw + 6}px"/>` +
        `<circle cx="${ox}" cy="${oy}" r="1.6" fill="${C.dim}"/>${ripple('ag-qr', ox, oy, 3)}<circle class="ag-qo" cx="${ox}" cy="${oy}" r="2.4" fill="${C.teal}"/>` +
        `<text class="ag-qw" x="${r1(gx + gw + 9)}" y="${base}" font-size="9" font-weight="600" fill="${C.teal}">1 unusual</text></g></g>`;
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
const PS = 1.4, EXT = [[48, 50], [34, 57], [29, 29]], EXTX = [[-5, 159], [-1, 163.5], [-2, 187.3]];
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
// Each agent spins while it works (the supervisor reading the report, Hypothesis, Detection writing its query,
// Reporting), and the query is written out under the kit before each search runs (q0, q1), selected and replaced in
// between (sel, q0out), and folds into the analysis dots (qd) once the second search finds one.
const T = {
  s0: [0.2, .5], doc: [0.2, 2.0], sup: [2.0, .7], spsup: [1.9, 1.0], c0: [2.3, .7], hyp: [2.8, 1.0], sphyp: [2.8, 1.0], c0r: [3.5, .6], c1: [4.0, .7], det: [4.6, .45], ripdet: [4.6, 1.0], chev0: [5.0, .9],
  s1: [5.3, .5], arr: [5.5, .9], tool: [[5.8, .35], [6.05, .35], [6.3, .35]],
  spdet: [6.4, 3.6], q: [6.5, .3], q0: [6.7, .8], k0: [7.6, .15],
  g0a: [7.6, 1.3], rip0: [7.7, 1.1], rip1: [8.0, 1.1], none: [8.5, 1.5],
  loop: [10.0, 1.0], lh: [10.9, .25], rw: [10.1, 1.5], sel: [10.2, .15], q0out: [10.8, .15], q1: [10.9, .8], k1: [11.9, .15], g1: [11.5, 1.0], tick: [11.7, .5],
  g0b: [12.4, 1.3], rip2: [12.5, 1.1], rip3: [12.8, 1.1], found: [13.3, .45],
  q1out: [13.8, .15], g2: [13.8, .9], qd: [14.0, .2], qs: [14.1, .8], qo: [14.65, .45], qr: [14.65, 1.0], qw: [14.85, .3], chev1: [15.0, .9], qout: [17.4, .4],
  s2: [15.5, .5], c2: [15.6, .6], rep: [16.1, .8], sprep: [16.0, 1.1], cardf: [16.6, .4], cardo: [16.6, .8], lead: [17.1, .35], ln: [[17.3, .3], [17.5, .3]],
  he: [17.9, .4], pk: [18.1, .55], ana: [18.6, .5], halo: [19.0, 1.1],
};
const OUT_EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)';
const P = '.is-playing svg.ag-scene', PH = phone();
// PACE scales the whole timeline at once, keeping its rhythm (owner, 31 Oct 2026: "make the animation faster", then,
// once the queries were written out, "maybe animation can speed up more even slightly": about 12.7 s)
const PACE = 0.63, k = v => +(v * PACE).toFixed(3);
const a = ([d, s], name, ez = IO, fill = 'both') => `${name} ${k(s)}s ${ez} ${k(d)}s ${fill}`;
const at = (t, name, ez, fill) => `animation: ${a(t, name, ez, fill)};`;
// a window on a transient mark: shown from one moment, hidden at another (several animations, one element)
const show = t => a(t, 'ag-show', 'linear'), hide = t => a(t, 'ag-hide', 'linear', 'forwards');
// shown at once for a span, then gone: a label swapped in, a count held
const held = ([d, s]) => `${a([d, .12], 'ag-show', 'linear', 'forwards')}, ${hide([d + s - .15, .15])}`;
// a spinner: in, turning at one rate (0.9 s a turn, whatever PACE), out
const spinning = ([d, s]) => `animation: ${show([d, .2])}, ${hide([d + s - .25, .25])}, ag-turn .9s linear ${k(d)}s ${Math.ceil(k(s) / .9)};`;
const ends = Object.values(T).flatMap(v => Array.isArray(v[0]) ? v : [v]).map(([d, s]) => k(d + s));
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
svg.ag-scene .ag-fl, svg.ag-scene .ag-rip, svg.ag-scene .ag-doc, svg.ag-scene .ag-none, svg.ag-scene .ag-rw, svg.ag-scene .ag-pk, svg.ag-scene .ag-det-dot { opacity: 0; }
svg.ag-scene .ag-spin, svg.ag-scene .ag-q, svg.ag-scene .ag-qsel, svg.ag-scene .ag-qc, svg.ag-scene .ag-qs { opacity: 0; }
svg.ag-scene .ag-spin { stroke-dasharray: .25 .75; stroke-linecap: round; transform-box: fill-box; transform-origin: center; }
svg.ag-scene text.ag-qt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; }
svg.ag-scene .ag-qc { transform-box: fill-box; transform-origin: 100% 50%; }
svg.ag-scene .ag-qo { transform-box: fill-box; transform-origin: center; }
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
@keyframes ag-rip { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.8); } }
@keyframes ag-halo { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); } }
@keyframes ag-doc { 0% { opacity: 0; transform: translate(0, -6px); } 12%, 60% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(58px, 5px) scale(.4); } }
@keyframes ag-chev { 0%, 100% { stroke: ${C.mute}; transform: none; } 45% { stroke: ${C.teal}; transform: translateX(3px); } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 15%, 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
@keyframes ag-pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes ag-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-hide { from { opacity: 1; } to { opacity: 0; } }
@keyframes ag-turn { to { transform: rotate(360deg); } }
@keyframes ag-wipe { from { opacity: 1; transform: scaleX(1); } to { opacity: 1; transform: scaleX(0); } }
@keyframes ag-caret { to { transform: translateX(var(--w)); } }
@keyframes ag-scan { 0% { opacity: 0; transform: none; } 15%, 85% { opacity: .7; } 100% { opacity: 0; transform: translateX(var(--w)); } }
/* step 1: the report drops into the supervisor, which hands Hypothesis its slice and takes its result back, then hands Detection the hunt */
${P} .ag-s0 { ${at(T.s0, 'ag-in', OUT_EZ)} }
${P} .ag-doc { ${at(T.doc, 'ag-doc', IO, 'none')} }
${P} .ag-doc text { animation: ${hide([T.doc[0] + 1.0, .2])}; }   /* (the label goes before the page moves, so it never smears into the node) */
${P} .ag-fl-sup { ${at(T.sup, 'ag-flash', IO, 'none')} }
${P} .ag-sp-sup { ${spinning(T.spsup)} }
${P} .ag-sp-hyp { ${spinning(T.sphyp)} }
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
/* the agent thinks and writes its query, a few characters at a time behind a caret; later selects and rewrites it */
${P} .ag-sp-det { ${spinning(T.spdet)} }
${P} .ag-q { animation: ${show(T.q)}, ${hide(T.qout)}; }
${P} .ag-q0 { animation: ${hide(T.q0out)}; }
${P} .ag-q1 { animation: ${show([T.q1[0], .1])}, ${hide(T.q1out)}; }
/* (jump-none: the last step lands before the end, since a plain steps() held forwards can stop a step short) */
${['q0', 'q1'].map((q, j) => `${P} .ag-${q} .ag-qc { ${at(T[q], 'ag-wipe', 'steps(8, jump-none)')} }\n${P} .ag-${q} .ag-qk { animation: ${a(T[q], 'ag-caret', 'steps(8, jump-none)')}, ${hide(T['k' + j])}; }`).join('\n')}
${P} .ag-qsel { ${at(T.sel, 'ag-show', 'linear')} }
${P} .ag-qd { animation: ${show(T.qd)}; }
${P} .ag-qs { ${at(T.qs, 'ag-scan', 'linear', 'none')} }
${P} .ag-qo { ${at(T.qo, 'ag-pop', OUT_EZ)} }
${P} .ag-qw { ${at(T.qw, 'ag-fade')} }
${P} .ag-qr { ${at(T.qr, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-g0a { ${at(T.g0a, 'ag-flash', IO, 'none')} }
${P} .ag-rip0 { ${at(T.rip0, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-rip1 { ${at(T.rip1, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-none { ${'animation: ' + held(T.none)}; }
${P} .ag-loop { ${at(T.loop, 'ag-draw')} }
${P} .ag-lh { ${at(T.lh, 'ag-fade')} }
${P} .ag-g1 { ${at(T.g1, 'ag-flash', IO, 'none')} }
${P} .ag-rw { ${'animation: ' + held(T.rw)}; }
${P} .ag-ck { animation: ${hide([T.rw[0] - .12, .12])}, ${a([T.rw[0] + T.rw[1] + .05, .15], 'ag-show', 'linear', 'forwards')}; }   /* (in sequence, never crossfaded) */
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
${P} .ag-ln0 { ${at(T.ln[0], 'ag-in', OUT_EZ)} }
${P} .ag-ln1 { ${at(T.ln[1], 'ag-in', OUT_EZ)} }
${P} .ag-sp-rep { ${spinning(T.sprep)} }
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
