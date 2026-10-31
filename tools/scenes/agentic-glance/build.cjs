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
// the status line: what is happening, in plain words, while it plays ([start, end] in the timeline's raw seconds);
// the layman reader's one ask (31 Oct 2026: "one plain-English line that changes at each step"), the way agent
// products narrate their state (Linear's agent activity; Vercel's chain of thought)
// it shows above whichever step is acting, larger than the labels (the second round's layman reader: the words
// should be "big, right next to the moving dot"); the last number is the step
const STATUS = [[0.35, 2.0, 'Reading the report', 0], [2.05, 4.1, 'Forming a hypothesis', 0], [4.15, 5.9, 'Detection takes over', 0], [6.0, 7.85, 'Writing a search', 1],
  [7.9, 9.45, 'Search found nothing', 1], [9.5, 11.65, 'Rewriting the search', 1], [11.7, 13.8, 'Searching again', 1], [13.85, 15.75, '1 looks unusual', 1],
  [15.8, 18.0, 'Writing up the lead', 2], [18.05, 20.3, 'Sent to an analyst', 2]];
// the second search's count, rolled through on its way to 32
const CNT = [4, 9, 15, 22, 28];
// plain words under the jargon while it is on screen (the third round: both reviewers asked for a gloss): what each
// search looks for, why the first one missed, and what the technique on the card is; [start, end, text] raw seconds
const GLOSS = [[7.3, 8.6, 'looks for the tool by name'], [8.65, 10.0, 'no match: attackers can skip that tool'], [11.0, 12.2, 'now looks for the action: a new task'], [14.1, 15.5, "one new task doesn't match the rest"]];
const GLOSS_CARD = 'a known attacker trick', HUNCH = 'Hunch: attackers hide in scheduled tasks';

// a plain agent node: a ring with a dot; the one we follow is solid teal
const node = (cx, cy, r, on, cls = '') => on
  ? `<circle class="${cls} ag-nd" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" stroke="${C.teal}"/>`
  : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.node}" stroke="${C.dim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .3)}" fill="${C.dim}"/>`;
// transient marks, invisible in the final frame: a node lighting up for a moment, a ring rippling out
const flash = (cls, cx, cy, r) => `<circle class="ag-fl ${cls}" cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}" fill-opacity=".22" stroke="${C.teal}" stroke-width="1.2"/>`;
const ripple = (cls, cx, cy, r, col = C.teal) => `<circle class="ag-rip ${cls}" cx="${cx}" cy="${cy}" r="${r}" stroke="${col}" stroke-width="1.4"/>`;
// an agent at work: a short arc turning round it, the spinner agent products show while a model thinks (Prophet's
// "analyzing", a chat's tool call in flight)
const spin = (cls, cx, cy, r, w = 1.6) => `<circle class="ag-spin ${cls}" cx="${cx}" cy="${cy}" r="${r}" pathLength="1" fill="none" stroke="${C.teal}" stroke-width="${w}"/>`;
const label = (x, y, f, t, anchor = 'middle', col = C.mute, cls = '') => `<text${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" text-anchor="${anchor}" font-size="${f}" fill="${col}">${esc(t)}</text>`;
// where the followed dot starts and lands, in each picture's own units (desktop() and phone() map them onto the card)
const ANCH = [];
// the pictures, left-aligned at x and centred on cy, drawn at a size r (phones draw the same ones, scaled up)
function picture(i, x, cy, r) {
  if (i === 0) {
    // the team: a supervisor over three narrow agents, each labelled with its job; the wires draw down as the card
    // opens, the report drops into the supervisor, a pulse runs to Hypothesis and back, then to Detection, which
    // lights; Reporting lights later, in step 3
    const gap = 60, lf = 9.5, drop = r1(r * 3.4);
    const ay = r1(cy + 22), sy = r1(ay - drop), ax = [x + 22]; ax[1] = ax[0] + gap; ax[2] = ax[0] + 2 * gap; const scx = ax[1];
    const on = ON, rep = REP;
    ANCH[0] = { det: [ax[on], ay] };
    const wire = cx => `M${scx} ${sy + r} C${scx} ${sy + r + 8} ${cx} ${ay - r - 8} ${cx} ${ay - r}`;
    let p = ax.map(cx => `<path class="ag-wd" d="${wire(cx)}" pathLength="1" stroke="${C.dim}"/>`).join('');
    p += `<path class="ag-c ag-c0" d="${wire(ax[HYP])}" pathLength="1" stroke="${C.teal}"/><path class="ag-c ag-c0r" d="${wire(ax[HYP])}" pathLength="1" stroke="${C.teal}"/><path class="ag-c ag-c1" d="${wire(ax[on])}" pathLength="1" stroke="${C.teal}"/>`;
    // Reporting's marks, kept outside the team so they stay bright while it steps back
    let rm = `<path class="ag-c ag-c2" d="${wire(ax[rep])}" pathLength="1" stroke="${C.teal}"/>` + flash('ag-fl-rep', ax[rep], ay, r) + spin('ag-sp-rep', ax[rep], ay, r + 3);
    p += ripple('ag-rip-det', ax[on], ay, r) + `<g class="ag-supn">${node(scx, sy, r, false)}</g>` + [0, 1, 2].map(k => node(ax[k], ay, r, k === on, k === on ? 'ag-det' : '')).join('') +
      `<circle class="ag-det-dot" cx="${ax[on]}" cy="${ay}" r="${r1(r * .3)}" fill="${C.dim}"/>`;   // until it lights, Detection looks like the others
    p += spin('ag-sp-sup', scx, sy, r + 3) + spin('ag-sp-hyp', ax[HYP], ay, r + 3);
    // the threat report itself, labelled, left of the supervisor, before it drops in
    p += `<g class="ag-doc">${icon('rep', r1(scx - 70), r1(sy - 23), 2, C.ink)}${label(scx - 58, r1(sy + 12), 9, 'Threat report')}</g>`;   // the label under the page, so it never reads on one line with Supervisor
    p += label(scx, sy - r - 7, lf, 'Supervisor');
    JOBS.forEach((j, k) => {
      const ly = ay + r + lf + 3;
      p += `<g class="${k === ON ? 'ag-job-on' : ''}">${label(ax[k], ly, lf, j, 'middle', k === ON ? C.teal : C.mute)}</g>`;
      if (k === HYP) p += label(ax[k], ly, lf, j, 'middle', C.teal, 'ag-fl ag-fl-hyp'), rm += `<g class="ag-hyplit"><circle cx="${ax[k]}" cy="${ay}" r="${r}" fill="${C.node}" stroke="${C.teal}" stroke-width="1.4"/><circle cx="${ax[k]}" cy="${ay}" r="${r1(r * .3)}" fill="${C.teal}"/>${label(ax[k], ly, lf, j, 'middle', C.teal)}</g>`;   // the whole path lit in the final frame
      if (k === REP) rm += label(ax[k], ly, lf, j, 'middle', C.teal, 'ag-fl ag-fl-rep') +   // Reporting stays lit through step 3, so it is clear who wrote the lead
        `<g class="ag-replit"><circle cx="${ax[k]}" cy="${ay}" r="${r}" fill="${C.node}" stroke="${C.teal}" stroke-width="1.4"/><circle cx="${ax[k]}" cy="${ay}" r="${r1(r * .3)}" fill="${C.teal}"/>${label(ax[k], ly, lf, j, 'middle', C.teal)}</g>`;
    });
    // the hypothesis, in plain words: it pops out of Hypothesis under the team, then is drawn into Detection as it lights
    const hy = r1(ay + 31), hw = 192;
    rm += `<g class="ag-hunch" style="--hx:${r1(ax[on] - (x + hw / 2))}px;--hy:${r1(ay - hy - 7)}px"><rect class="ag-hunch-p" x="${x}" y="${hy}" width="${hw}" height="15" rx="7.5" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".6"/>` +
      `<text class="ag-hunch-t" x="${x + 9}" y="${r1(hy + 10.8)}" font-size="9.5" fill="${C.body}"><tspan font-weight="700" fill="${C.teal}">Hunch:</tspan>${esc(HUNCH.slice(6))}</text>` +
      `<circle class="ag-hunch-d" cx="${r1(x + hw / 2)}" cy="${r1(hy + 7.5)}" r="3" fill="${C.teal}"/></g>`;
    return `<g class="ag-team">${p}</g>${rm}`;
  }
  if (i === 1) {
    // the acting agent, the same teal dot, landed from step 1, with its kit of tools; it writes a search, sends it
    // (a pulse along the wire), finds none, loops back, rewrites and checks its query, searches again, the count rolls
    // up to 32 as the results fill in, and the analysis singles out one
    const lr = r + 10, cx = x + lr + 3;
    // the arc runs clockwise from 60 degrees above the right to just above the left; its arrowhead is two strokes
    // either side of the tangent at the end, like a retry icon (owner: "the arrow on 2nd chart still looks weird")
    const pt = (deg, d = 0) => { const t = deg * Math.PI / 180; return `${r1(cx + lr * Math.cos(t) + d * -Math.sin(t))} ${r1(cy + lr * Math.sin(t) + d * Math.cos(t))}`; };
    const t1 = LOOP_END * Math.PI / 180, tip = [cx + lr * Math.cos(t1), cy + lr * Math.sin(t1)];
    const tb = (LOOP_END - 16) * Math.PI / 180, back = Math.atan2(cy + lr * Math.sin(tb) - tip[1], cx + lr * Math.cos(tb) - tip[0]);
    const wing = sgn => `${r1(tip[0] + 6 * Math.cos(back + sgn * .7))} ${r1(tip[1] + 6 * Math.sin(back + sgn * .7))}`;
    const head = `M${wing(1)} L${r1(tip[0])} ${r1(tip[1])} L${wing(-1)}`;
    // a faint outline of the agent and its kit from the first frame, so the card is never two-thirds empty
    let p = `<g class="ag-gh ag-gh1"><circle cx="${cx}" cy="${cy}" r="${r}" stroke="${C.rule}"/>${[0, 1, 2].map(k => `<rect x="${cx + lr + 12}" y="${r1(cy - 33 + k * 24)}" width="102" height="18" rx="4" stroke="${C.rule}"/>`).join('')}</g>` +
      node(cx, cy, r, true, 'ag-n1') + spin('ag-sp-det', cx, cy, r + 5) +
      `<path class="ag-loop" d="M${pt(-60)} A${lr} ${lr} 0 1 1 ${pt(LOOP_END)}" pathLength="1" stroke="${C.teal}" stroke-width="1.5"/>` +
      `<path class="ag-lh" d="${head}" stroke="${C.teal}" stroke-width="1.5"/>`;
    ANCH[1] = { node: [cx, cy] };
    {
      const tx = cx + lr + 12, th = 18, tw = 102, ty0 = cy - th * 1.5 - 6;
      TOOLS.forEach(([ic, name], k) => {
        const ty = r1(ty0 + k * (th + 6)), wire = `M${cx + lr + 2} ${cy} C${cx + lr + 6} ${cy} ${tx - 6} ${ty + th / 2} ${tx} ${ty + th / 2}`;
        const glow = g => `<path class="ag-fl ag-gw ${g}" d="${wire}" stroke="${C.teal}" stroke-width="1.4"/><rect class="ag-fl ${g}" x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="${C.teal}" fill-opacity=".05" stroke="${C.teal}"/>`;
        const cnt = (t, cls, wgt, col) => `<text class="${cls}" x="${tx + tw - 7}" y="${ty + 12.5}" text-anchor="end" font-size="9.5" font-weight="${wgt}" fill="${col}">${t}</text>`;
        p += `<g class="ag-tool ag-tool${k}"><path d="${wire}" stroke="${C.rule}"/>` +
          (k === 0 ? `<path class="ag-c ag-sw0" d="${wire}" pathLength="1" stroke="${C.teal}"/><path class="ag-c ag-sw1" d="${wire}" pathLength="1" stroke="${C.teal}"/>` : '') +
          `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>` +
          (k === 0 ? glow('ag-g0a') + glow('ag-g0b') : glow(`ag-g${k}`)) +
          (k === 1 ? icon(ic, tx + 6, ty + 3, 1, C.dim).replace(' class="ag-tick"', '') : '') + `${icon(ic, tx + 6, ty + 3, 1, C.teal)}<text x="${tx + 22}" y="${ty + 12.5}" font-size="10" fill="${C.body}">${name}</text>`;
        // what the search found: none the first time; the second time the count rolls up to every task created
        if (k === 0) p += cnt('0 found', 'ag-none', 600, C.mute) + CNT.map((v, j) => cnt(v + ' found', 'ag-cnt ag-cnt' + j, 700, C.teal)).join('') + cnt('32 found', 'ag-found', 700, C.teal);
        p += '</g>';
      });
    }
    // the query itself, under the kit while the agent works, the way agent products open the tool call in flight and
    // fold it away once it's done: a line of code streams in a few characters at a time behind a caret; after the
    // empty search it is backspaced out and the new one typed in; then it gives way to the results, a grey dot each,
    // filling in as the count rolls, and the analysis fades all but the one that fits no baseline. All of it is
    // transient, so the final frame keeps its plain glance
    {
      const sx = x + 3, qy = r1(cy + 38), qw = 162, qh = 18, tx0 = sx + 15, base = r1(qy + 12.2);   // sx: the loop's left edge
      p += `<g class="ag-q"><rect x="${sx}" y="${qy}" width="${qw}" height="${qh}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>`;
      QUERIES.forEach(([f, v], k) => {
        const len = r1((f.length + v.length + 5) * MONO);
        p += `<g class="ag-q${k}"><text x="${sx + 6}" y="${base}" font-size="10" font-weight="700" fill="${C.teal}">&#8250;</text>` +
          `<text class="ag-qt" x="${tx0}" y="${base}" font-size="9" textLength="${len}" lengthAdjust="spacing"><tspan fill="${C.body}">${f}</tspan><tspan fill="${C.dim}"> = </tspan><tspan fill="${C.teal}">"${esc(v)}"</tspan></text>` +
          (k === 0 ? `<path class="ag-qx" d="M${tx0 - 1} ${r1(qy + qh / 2 + .5)} H${r1(tx0 + len + 1)}" pathLength="1" stroke="${C.mute}" stroke-width="1.2"/>` : '') +   // struck through before it goes
          `<rect class="ag-qc" x="${tx0 - .5}" y="${qy + 1.5}" width="${r1(len + 2)}" height="${qh - 3}" fill="${C.chip}"/>` +
          `<rect class="ag-qk" x="${tx0}" y="${qy + 3}" width="1.2" height="${qh - 6}" fill="${C.teal}" style="--w:${len}px"/></g>`;
      });
      let d = '', n = 0; const gx = sx + 8, gs = 6.4, gw = 15 * gs, OUT = 26;   // OUT: the unusual one, 11th along the second row
      for (let j = 0; j < 32; j++) if (j !== OUT) d += `<circle cx="${r1(gx + (j % 16) * gs)}" cy="${r1(qy + 5.5 + (j >> 4) * 7)}" r="2" fill="${C.dim}" style="--i:${n++};--c:${j % 16}"/>`;
      const ox = r1(gx + (OUT % 16) * gs), oy = r1(qy + 12.5);
      ANCH[1].out = [ox, oy];
      p += `<g class="ag-qd"><g class="ag-qg">${d}<circle cx="${ox}" cy="${oy}" r="2" fill="${C.dim}" style="--i:${OUT};--c:${OUT % 16}"/></g>` +
        `<g class="ag-qs" style="--w:${gw + 6}px"><rect x="${gx - 27}" y="${qy + 2}" width="24" height="${qh - 4}" fill="url(#ag-tail)"/><rect x="${gx - 3}" y="${qy + 2}" width="2" height="${qh - 4}" rx="1" fill="${C.teal}"/></g>` +
        `${ripple('ag-qr', ox, oy, 4)}<circle class="ag-qo" cx="${ox}" cy="${oy}" r="3" fill="${C.teal}"/>` +
        `<text class="ag-qw" x="${r1(gx + gw + 9)}" y="${base}" font-size="9" font-weight="600" fill="${C.teal}">1 unusual</text></g></g>` +
        GLOSS.map(([, , t], j) => `<text class="ag-gl ag-gl${j}" x="${sx}" y="${r1(qy + qh + 12.5)}" font-size="10" fill="${C.mute}">${esc(t)}</text>`).join('');
    }
    return p;
  }
  // the hand-off: a lead card, the finding with its evidence attached, grown from the dot that flew in from step 2
  // and passed along a line to the human, who waits grey and lights amber when it arrives
  const R = r1(r * 1.25);
  const person = (cx, col, cls) => `<g class="${cls}"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.node}" stroke="${col}" stroke-width="1.5"/>${icon('ana', r1(cx - 6 * R / 7), r1(cy - 6 * R / 7), r1(R / 7), col)}</g>`;
  const packet = (lx0, lx1) => `<rect class="ag-pk" x="${lx0 - 4.5}" y="${cy - 3.5}" width="9" height="7" rx="1.5" fill="${C.teal}" style="--dx:${r1(lx1 - lx0)}px"/>`;
  const cw = 90, ch = 57, cx0 = x - 1.5, cy0 = cy - ch / 2, lx0 = cx0 + cw + 6, lx1 = lx0 + 53, cx = lx1 + 6.5 + R;   // the card's stroke on the heading's edge; the dashes end on a full dash
  ANCH[2] = { flag: [r1(cx0 + 13), r1(cy0 + 14)] };
  const ghost = `<g class="ag-gh ag-gh2"><rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" stroke="${C.rule}"/><path d="M${lx0} ${cy} H${lx1}" stroke="${C.rule}" stroke-dasharray="4 3"/><circle cx="${cx}" cy="${cy}" r="${R}" stroke="${C.rule}"/></g>`;
  // the write-up: the lead and the technique it names; the text starts under the flag's pole
  return ghost + `<g class="ag-flag"><rect class="ag-cardf" x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" fill="${C.chip}"/>` +
    `<rect class="ag-cardo" x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="5" stroke="${C.teal}" stroke-opacity=".7"/>` +
    `<g class="ag-lead">${icon('flag', cx0 + 7, cy0 + 8, 1.2, C.teal)}<text x="${cx0 + 25}" y="${cy0 + 19}" font-size="10.5" font-weight="700" fill="${C.ink}">1 lead</text></g>` +
    `<text class="ag-ln0" x="${cx0 + 10.5}" y="${cy0 + 34}" font-size="9.5" fill="${C.body}">Scheduled Task</text>` +
    `<text class="ag-ln1" x="${cx0 + 10.5}" y="${cy0 + 46}" font-size="9" letter-spacing=".02em" fill="${C.mute}">T1053.005</text></g>` +
    `<path class="ag-he" d="M${lx0} ${cy} H${lx1}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round"/>` +
    packet(lx0, lx1) + person(cx, C.dim, 'ag-anw') + person(cx, C.amb, 'ag-ana') + ripple('ag-halo', cx, cy, R, C.amb) + ripple('ag-halo2', cx, cy, R, C.amb) +
    `<text class="ag-glc" x="${cx0 + 1}" y="${r1(cy0 + ch + 13.5)}" font-size="10" fill="${C.mute}">${GLOSS_CARD}</text>` +   // kept in the final frame: the one term a layman can't read
    `<text class="ag-anl" x="${r1(cx + R)}" y="${r1(cy + R + 16)}" text-anchor="end" font-size="9.5" font-weight="600" fill="${C.amb}">Analyst decides</text>`;   // the human's role, kept in the final frame
}
// the followed dot, drawn over everything: from step 1's Detection to step 2's agent, then the unusual result from
// step 2's grid to the lead card's flag. Each rides two nested groups, one easing across and one easing down, so it
// travels an arc (map: a picture's units to the card's)
function heroes(map, s, phone) {
  const [a, b] = [map(0, ANCH[0].det), map(1, ANCH[1].node)], [o, f] = [map(1, ANCH[1].out), map(2, ANCH[2].flag)];
  const hero = (cls, [x0, y0], [x1, y1], r, op = 1, dip = 0) => `<g class="ag-hx ${cls}" style="--dx:${r1(x1 - x0)}px"><g class="ag-hy" style="--dy:${r1(y1 - y0)}px;--dip:${dip}px"><circle class="ag-hc" cx="${r1(x0)}" cy="${r1(y0)}" r="${r1(r)}" fill="${C.teal}"${op < 1 ? ` fill-opacity="${op}"` : ''}/></g></g>`;
  // the first dips under Reporting's label on desktop, so it never looks bound for Reporting; on phones it falls straight
  return hero('ag-h1', a, b, 13 * s, 1, phone ? r1((b[1] - a[1]) / 2) : 40) + hero('ag-h2 ag-tr2', o, f, 4 * s, .25) + hero('ag-h2 ag-tr1', o, f, 4 * s, .5) + hero('ag-h2', o, f, 4 * s);
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
// the headline under the product line. At its right, while it plays, the status line says what is happening
const PRODUCT = 'Agentic Threat Hunting', HEADLINE = 'From a ransomware report to one lead';
function header(w, y, fh, phone) {
  const s = r1(fh * (phone ? 1.45 : 1.25)), sx = 16 + s + 6, line = phone ? y + 35 : y + 11;
  // the divider is a glyph in the same line of text, so it keeps its place whichever font loads
  let h = `<g class="ag-head">${logo(16, r1(y - s + fh * (phone ? .38 : .3)), s)}<text x="${sx}" y="${y}" font-size="${fh}" font-weight="700" fill="${C.ink}">${PRODUCT}` +
    (phone ? '</text>' : `<tspan dx="8" font-weight="400" fill="${C.dim}">|</tspan><tspan dx="8" font-weight="400" fill="${C.body}">${HEADLINE}</tspan></text>`);
  if (phone) h += `<text x="16" y="${y + 21}" font-size="${r1(fh - .5)}" fill="${C.body}">${HEADLINE}</text>`;
  return h + `</g><path d="M16 ${line} H${w - 16}" stroke="${C.line}"/>`;
}
// the status line over each step: a spinner and the phrase (pos: where each step's line starts)
const status = (pos, f) => [0, 1, 2].map(i => { const [x, y] = pos[i];
  return `<g class="ag-st">${spin(`ag-sp-st${i}`, x + 4.5, r1(y - f * .35), 4.5, 1.4)}${STATUS.map(([, , t, st], j) => st === i ? `<text class="ag-st${j}" x="${x + 14}" y="${y}" font-size="${f}" font-weight="600" fill="${C.ink}">${esc(t)}</text>` : '').join('')}</g>`; }).join('');
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><defs><linearGradient id="ag-tail" x1="0" x2="1"><stop offset="0" stop-color="${C.teal}" stop-opacity="0"/><stop offset="1" stop-color="${C.teal}" stop-opacity=".35"/></linearGradient></defs><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, read left to right, under a band where the status line plays (DH: the card's height); pictures left-aligned with their headings, on one centreline
const DH = 270;
function desktop() {
  const W = 640, H = DH, col = 200, x0 = 16, gap = 8, pcy = 112, titleY = 200, bodyY = 219, lh = 15.5, f = { head: 11.5, hid: 9.5, title: 12.5, body: 10.3 };
  const s = [open('ag-scene', W, H), header(W, 23, f.head)];
  STEPS.forEach((st, i) => {
    const x = x0 + i * (col + gap);
    s.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}">${picture(i, x + 2, pcy, 13)}</g>${title(i, x, titleY, f.title)}${body(st.d, x, bodyY, lh, f.body)}</g>`);
    if (i < 2) s.push(`<path class="ag-chev ag-chev${i}" d="M${x + col - 16} ${pcy - 5} l4 5 -4 5" stroke="${C.mute}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  });
  return s.join('') + status([0, 1, 2].map(i => [x0 + i * (col + gap) + 2, 52]), 11) + heroes((i, p) => p, 1, false) + '</svg>';
}
// phones: the steps stacked, each with the desktop's full picture (labels, kit, lead card) drawn larger above its
// words, so nothing is squeezed (owner, 31 Oct 2026: "on mobile, you can take up more space for the animations. dont
// need to squeeze"), each centred on the card ("not centered on mobile"); EXT and EXTX are each picture's reach
// above and below its centreline and left and right of its origin, in the picture's own units
const PS = 1.4, EXT = [[48, 70], [34, 70], [29, 48]], EXTX = [[-5, 159], [-1, 163.5], [-2, 187.3]];
function phone() {
  const W = 360, x = 14, lh = 18.5, f = { head: 13, hid: 11, title: 14.5, body: 13.4 };
  const parts = [], at = [], top = []; let y = 64;
  STEPS.forEach((st, i) => {
    top[i] = y;   // (the status line plays in the band above each picture)
    const cy = r1(y + 36 + EXT[i][0] * PS), ty = r1(cy + EXT[i][1] * PS + 22), by = r1(ty + 22);
    const px = r1(W / 2 - PS * (EXTX[i][0] + EXTX[i][1]) / 2 - PS * 2);
    at[i] = [px, cy];
    parts.push(`<g class="ag-s ag-s${i}"><g class="ag-p ag-p${i}"><g transform="translate(${px} ${cy}) scale(${PS})">${picture(i, 2, 0, 13)}</g></g>${title(i, x + 2, ty, f.title)}${body(st.m, x + 2, by, lh, f.body)}</g>`);
    y = r1(by + (st.m.length - 1) * lh + 22);
    if (i < 2) parts.push(`<path d="M14 ${y} H${W - 14}" stroke="${C.line}"/>`);
  });
  const H = r1(y + 2);
  return { svg: open('ag-scene ag-scene--m', W, H) + header(W, 25, f.head, true) + parts.join('') + status(top.map(t => [16, t + 20]), 12.5) + heroes((i, [u, v]) => [at[i][0] + PS * u, at[i][1] + PS * v], PS, true) + '</svg>', H };
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// [start, duration] in raw seconds (PACE and LEAD turn them into played ones). The motion follows explainer practice
// (a research pass and three independent reviews, 31 Oct 2026): one teal dot the eye can follow through all three
// steps; whatever is idle steps back while another step acts; a plain-English status line; cause just before effect;
// holds on the beats that matter ("0 found", "1 looks unusual", the hand-off); one spring, saved for the human.
// Step 1: the wires draw, the report drops into the supervisor, which spins as it reads, sends a pulse to Hypothesis
// and back, then to Detection, which lights. The dot leaves Detection for step 2 and lands as the agent there. Step 2:
// the kit arrives, the agent spins as it types its search, a pulse runs out to search, "0 found" lands and holds; the
// loop draws as the search is backspaced and rewritten, the fix is checked, a second pulse goes out and the count rolls
// up as the results fill in; the scan passes, all but one fade, "1 unusual". Step 3: Reporting spins as the unusual
// dot flies into step 3 and the lead card grows from it; the card draws back a touch, a small card runs the line as
// its dashes march, and the waiting grey person lights amber with a spring and two halos.
const T = {
  s0: [0.2, .5], wd: [0.3, .6], doc: [0.2, 1.8], supn: [1.95, .4], spsup: [2.0, .9], c0: [2.4, .6], hyp: [2.9, 1.0], sphyp: [2.9, 1.0], c0r: [3.8, .6], c1: [4.2, .6],
  det: [4.75, .45], ripdet: [4.75, 1.0], h1: [5.2, .8],
  s1: [5.2, .5], n1: [5.99, .01], tool: [[6.0, .3], [6.2, .3], [6.4, .3]],
  spdet: [6.1, 2.2], q: [6.2, .3], q0: [6.45, .8], k0: [7.3, .15],
  g0a: [7.35, 1.0], sw0: [7.35, .45], none: [7.9, .45], noneout: [9.9, .15],
  loop: [9.4, 1.0], lh: [10.3, .25], erase: [9.5, .5], q0out: [10.05, .1], q1: [10.15, .8], k1: [11.6, .15], g1: [11.0, .8], tick: [11.2, .5],
  g0b: [11.75, .9], sw1: [11.75, .45], q1out: [12.2, .15], qd: [12.25, .15], dots: [12.3, .15], cnt: [12.3, .09], found: [12.75, .3],
  g2: [13.2, .9], qs: [13.3, .8], qo: [13.85, .45], qr: [13.85, 1.0], qdim: [14.0, .4], qw: [14.05, .3],
  h2: [15.6, 1.3], hunch: [3.6, 1.3], jolt: [7.9, .36], strike: [9.15, .25],
  s2: [15.4, .5], c2: [14.9, .6], sprep: [15.9, 1.2], rep: [16.0, .9], card: [16.85, .75], lead: [16.85, .3], ln: [[17.05, .3], [17.2, .3]], he: [17.4, .3], anw: [16.9, .3], glc: [17.3, .3],
  antic: [17.9, .35], pk: [18.1, .6], ana: [18.65, .55], halo: [18.75, 1.1], halo2: [18.95, 1.1], anl: [19.4, .4], hyplit: [19.9, .45],
  dim0: [[5.6, 19.9]], dim1: [[16.2, 20.05]],   // (the team stays back through step 3, only Reporting's marks lit; both return, left to right, once the halos have run)
};
const RISE = 'cubic-bezier(.2,.8,.3,1)', OUT_EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)', DOWN = 'cubic-bezier(.55,.05,.85,.45)';
const P = '.is-playing svg.ag-scene', PH = phone();
// PACE scales the whole timeline at once, keeping its rhythm (owner, 31 Oct 2026: "make the animation faster", then,
// once the queries were written out, "maybe animation can speed up more even slightly", then "i think its too fast now":
// about 13.5 s). LEAD holds the opened card still for a beat before anything moves ("slightly longer delay before it
// starts"), on every replay too; it is in played seconds, outside PACE.
const PACE = 0.67, LEAD = 0.5, k = v => +(v * PACE).toFixed(3), kd = v => +(LEAD + v * PACE).toFixed(3);
const a = ([d, s], name, ez = IO, fill = 'both') => `${name} ${k(s)}s ${ez} ${kd(d)}s ${fill}`;
const at = (t, name, ez, fill) => `animation: ${a(t, name, ez, fill)};`;
// a window on a transient mark: shown from one moment, hidden at another (several animations, one element)
const show = t => a(t, 'ag-show', 'linear'), hide = t => a(t, 'ag-hide', 'linear', 'forwards');
// shown at once for a span, then gone: a count held
const held = ([d, s]) => `${a([d, .12], 'ag-show', 'linear', 'forwards')}, ${hide([d + s - .15, .15])}`;
// a spinner: in, turning at one rate (0.9 s a turn, whatever PACE), out
const spinning = ([d, s]) => `animation: ${show([d, .2])}, ${hide([d + s - .25, .25])}, ag-turn .9s linear ${kd(d)}s ${Math.ceil(k(s) / .9)};`;
// a picture stepping back while another acts, then forward again
const dimmed = spans => 'animation: ' + spans.map(([d, e]) => `${a([d, .45], 'ag-dimin', 'ease', 'forwards')}, ${a([e, .45], 'ag-dimout', 'ease', 'forwards')}`).join(', ') + ';';
const ends = Object.entries(T).filter(([n]) => !/^(dim|gl)/.test(n)).flatMap(([, v]) => Array.isArray(v[0]) ? v : [v]).map(([d, s]) => kd(d + s));   // (the dim and gloss spans are [start, end])
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / ${DH}; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / ${PH.H}; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
svg.ag-scene text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
svg.ag-scene .ag-i { fill: none; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene .ag-flag .ag-i { stroke-width: inherit; }
svg.ag-scene :is(.ag-ana, .ag-anw) .ag-i { stroke-width: .85; }
svg.ag-scene .ag-logo path { fill: ${C.ink}; }   /* (scaled R/7, so about the other icons' 1.3-1.8) */
svg.ag-scene .ag-doc .ag-i { stroke-width: .6; }
svg.ag-scene path, svg.ag-scene .ag-rip, svg.ag-scene .ag-cardo { fill: none; }
svg.ag-scene .ag-doc path:first-child { fill: ${C.chip}; }
svg.ag-scene .ag-c { stroke-width: 3; stroke-linecap: round; stroke-dasharray: .2 2; stroke-opacity: 0; }
svg.ag-scene .ag-loop, svg.ag-scene .ag-tick, svg.ag-scene .ag-wd, svg.ag-scene .ag-qx { stroke-dasharray: 1 2; stroke-dashoffset: 0; stroke-linecap: round; }   /* (undrawn, the dash sits wholly before the start, so no round cap shows as a dot) */
svg.ag-scene .ag-lh { stroke-linecap: round; stroke-linejoin: round; }
svg.ag-scene :is(.ag-s, .ag-chev, .ag-ana, .ag-rip, .ag-found, .ag-doc, .ag-supn, .ag-none, .ag-qo, .ag-hc, .ag-spin) { transform-box: fill-box; transform-origin: center; }
svg.ag-scene .ag-rip { vector-effect: non-scaling-stroke; }
svg.ag-scene .ag-flag { transform-box: fill-box; transform-origin: 14% 25%; }   /* (the flag, where the dot lands) */
svg.ag-scene .ag-qc { transform-box: fill-box; transform-origin: 100% 50%; }
svg.ag-scene .ag-spin { stroke-dasharray: .25 .75; stroke-linecap: round; }
svg.ag-scene :is(.ag-none, .ag-cnt, .ag-found) { font-variant-numeric: tabular-nums; }
svg.ag-scene text.ag-qt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; }
/* transient marks: hidden in the final frame, shown only while they play */
svg.ag-scene :is(.ag-fl, .ag-rip, .ag-doc, .ag-none, .ag-cnt, .ag-pk, .ag-det-dot, .ag-spin, .ag-q0, .ag-q1, .ag-qc, .ag-qs, .ag-hc, .ag-anw, .ag-st text, .ag-hunch, .ag-gl, .ag-gh) { opacity: 0; }
svg.ag-scene .ag-qg circle { opacity: .42; }   /* (the final frame keeps the result row, quiet, with the one unusual result lit) */
svg.ag-scene .ag-gh { fill: none; stroke-opacity: .6; }
svg.ag-scene :is(.ag-hunch, .ag-hunch-p) { transform-box: fill-box; transform-origin: center; }
svg.ag-scene .ag-hunch-d { opacity: 0; }   /* (the final frame keeps the result row, quiet, with the one unusual result lit: the second review's payoff) */
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-out { from { opacity: 1; } }
@keyframes ag-wake { from { opacity: .2; } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-draw { from { stroke-dashoffset: 1.05; } }
@keyframes ag-det { from { fill: ${C.node}; stroke: ${C.dim}; } }
@keyframes ag-job { from { fill: ${C.mute}; } }
@keyframes ag-comet { 0% { stroke-dashoffset: .2; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: -.8; stroke-opacity: 1; } 100% { stroke-dashoffset: -.8; stroke-opacity: 0; } }
@keyframes ag-comet-r { 0% { stroke-dashoffset: -.8; stroke-opacity: 0; } 20% { stroke-opacity: 1; } 80% { stroke-dashoffset: .2; stroke-opacity: 1; } 100% { stroke-dashoffset: .2; stroke-opacity: 0; } }
@keyframes ag-flash { 0%, 100% { opacity: 0; } 25%, 65% { opacity: 1; } }
@keyframes ag-rip { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.8); } }
@keyframes ag-halo { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.7); } }
@keyframes ag-doc { 0% { opacity: 0; transform: translate(0, -20px); } 18%, 50% { opacity: 1; transform: translate(0, 0); } 62% { opacity: 1; transform: translate(-3px, -3px); } 100% { opacity: 0; transform: translate(58px, 5px) scale(.4); } }
@keyframes ag-bump { 50% { transform: scale(1.1); } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 12%, 88% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
@keyframes ag-march { to { stroke-dashoffset: -14; } }
@keyframes ag-pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes ag-land { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: none; } }
@keyframes ag-shake { 0% { opacity: 0; transform: scale(1.3); } 35% { opacity: 1; transform: scale(1); } 50% { transform: translateX(-2px); } 65% { transform: translateX(2px); } 80% { transform: translateX(-1px); } 100% { opacity: 1; transform: none; } }
@keyframes ag-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-hide { from { opacity: 1; } to { opacity: 0; } }
@keyframes ag-say { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes ag-turn { to { transform: rotate(360deg); } }
@keyframes ag-wipe { from { opacity: 1; transform: scaleX(1); } to { opacity: 1; transform: scaleX(0); } }
@keyframes ag-unwipe { from { opacity: 1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
@keyframes ag-caret { to { transform: translateX(var(--w)); } }
@keyframes ag-caret-back { from { transform: translateX(var(--w)); } to { transform: none; } }
@keyframes ag-scan { 0% { opacity: 0; transform: none; } 15%, 85% { opacity: .7; } 100% { opacity: 0; transform: translateX(var(--w)); } }
@keyframes ag-dimin { from { opacity: 1; } to { opacity: .42; } }
@keyframes ag-dimout { from { opacity: .42; } to { opacity: 1; } }
@keyframes ag-hx { to { transform: translateX(var(--dx)); } }
@keyframes ag-hy { to { transform: translateY(var(--dy)); } }
@keyframes ag-hy1 { 45% { transform: translateY(var(--dip)); } 100% { transform: translateY(var(--dy)); } }
@keyframes ag-spring { from { transform: scale(.8); } to { transform: none; } }
@keyframes ag-h1m { 0% { opacity: 0; transform: scale(.35); } 10% { opacity: 1; } 22%, 72% { opacity: .2; } 88% { opacity: 1; transform: scale(.45); } 96% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ag-h2m { 0% { opacity: 0; transform: scale(.75); } 6% { opacity: 1; } 25%, 38% { opacity: 1; transform: translateY(-5px) scale(2.2); } 46%, 74% { opacity: .2; } 85% { opacity: 1; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ag-h1 { 0% { opacity: 0; transform: scale(.35); } 18% { opacity: 0; } 28% { opacity: 1; } 88% { opacity: 1; transform: scale(.45); } 96% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }   /* (it appears once clear of the labels and stays small in flight, so it never covers words; full size as it lands) */
@keyframes ag-h2 { 0% { opacity: 0; transform: scale(.75); } 6% { opacity: 1; } 25%, 38% { transform: translateY(-5px) scale(2.2); } 85% { transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }   /* (it lifts out of the row and swells before it flies) */
@keyframes ag-grow { from { opacity: 0; transform: scale(.12); } 45% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes ag-antic { 45% { transform: translateX(-5px); } }
@keyframes ag-hunch { 0% { opacity: 0; transform: translateY(-12px) scale(.6); } 12% { opacity: 1; transform: none; } 70% { opacity: 1; transform: none; } 96% { opacity: 1; transform: translate(var(--hx), var(--hy)); } 100% { opacity: 0; transform: translate(var(--hx), var(--hy)); } }   /* (its words fade, the pill collapses to a dot, and the dot is drawn into Detection) */
@keyframes ag-collapse { to { opacity: 0; transform: scale(.03, .4); } }
@keyframes ag-jolt { 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }
/* the status line: the spinner turns throughout, each phrase rises in and leaves */
/* (each phrase fades out just before the next rises in: never two at once, never a blank beat) */
${[0, 1, 2].map(i => { const mine = STATUS.filter(st => st[3] === i); return `${P} .ag-sp-st${i} { ${spinning([mine[0][0], mine[mine.length - 1][1] - mine[0][0]])} }`; }).join('\n')}
${STATUS.map(([d, e, , st], j) => { const nx = STATUS[j + 1] && STATUS[j + 1][3] === st ? STATUS[j + 1][0] : e; return `${P} .ag-st${j} { animation: ${a([d + .03, .3], 'ag-say', OUT_EZ, 'forwards')}, ${hide([nx - .12, .12])}; }`; }).join('\n')}
/* step 1: the wires draw, the report drops into the supervisor, which reads it, sends a pulse to Hypothesis and back, then hands Detection the hunt */
${P} .ag-s0 { ${at(T.s0, 'ag-in', OUT_EZ)} }
${P} .ag-wd { ${at(T.wd, 'ag-draw')} }
${P} .ag-doc { ${at(T.doc, 'ag-doc', IO, 'none')} }
${P} .ag-doc text { animation: ${hide([T.doc[0] + 0.9, .2])}; }   /* (the label goes before the page moves, so it never smears into the node) */
${P} .ag-supn { ${at(T.supn, 'ag-bump', SPRING, 'none')} }
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
${P} .ag-chev { ${at(T.s0, 'ag-fade')} }
${P} .ag-hunch { ${at(T.hunch, 'ag-hunch', IO, 'none')} }
${P} .ag-hunch-t { animation: ${hide([T.hunch[0] + .7, .12])}; }
${P} .ag-hunch-p { ${at([T.hunch[0] + .75, .2], 'ag-collapse', 'cubic-bezier(.55,0,1,.45)', 'forwards')} }
${P} .ag-hunch-d { ${at([T.hunch[0] + .85, .08], 'ag-show', 'linear')} }
${P} .ag-gh1 { animation: ag-show .01s linear 0s both, ${hide([5.95, .1])}; }   /* (from the first frame until the agent lands) */
${P} .ag-gh2 { animation: ag-show .01s linear 0s both, ${hide([T.card[0], .2])}; }
${P} .ag-team { ${dimmed(T.dim0)} }
/* the followed dot: Detection to step 2's agent, then the unusual result to the lead card */
${P} .ag-h1 { ${at(T.h1, 'ag-hx', IO)} }
${P} .ag-h1 .ag-hy { ${at(T.h1, 'ag-hy1', 'ease-in-out')} }   /* (down under the labels, then up into step 2) */
${P} .ag-h1 .ag-hc { animation: ${a(T.h1, 'ag-h1', 'linear')}, ${hide([T.h1[0] + T.h1[1] + .01, .03])}; }   /* (the agent below shows the instant it lands, then the dot goes) */
${P} .ag-h2 { ${at([T.h2[0] + .45, T.h2[1] - .45], 'ag-hx', IO)} }
${P} .ag-h2 .ag-hy { ${at([T.h2[0] + .45, T.h2[1] - .45], 'ag-hy', DOWN)} }
${P} .ag-h2 .ag-hc { animation: ${a(T.h2, 'ag-h2', IO)}, ${hide([T.h2[0] + T.h2[1] - .02, .15])}; }
${[1, 2].map(g => { const t = [T.h2[0] + .06 * g, T.h2[1]], f = [t[0] + .45, t[1] - .45];
  return `${P} .ag-h2.ag-tr${g} { ${at(f, 'ag-hx', IO)} }
${P} .ag-h2.ag-tr${g} .ag-hy { ${at(f, 'ag-hy', DOWN)} }
${P} .ag-h2.ag-tr${g} .ag-hc { animation: ${a(t, 'ag-h2', IO)}, ${hide([t[0] + t[1] - .12, .1])}; }`; }).join('\n')}   /* (two fading ghosts a beat behind, so the eye keeps it) */
/* phones: the dots fall straight down the stacked steps, so they fade back while they cross the words, and travel without ghosts */
.is-playing svg.ag-scene--m .ag-h1 .ag-hc { animation-name: ag-h1m, ag-hide; }
.is-playing svg.ag-scene--m .ag-h2 .ag-hc { animation-name: ag-h2m, ag-hide; }
svg.ag-scene--m :is(.ag-tr1, .ag-tr2) { display: none; }
/* step 2: the agent lands, writes a search, sends it and finds nothing; loops, rewrites and checks; finds 32, one unusual */
${P} .ag-s1 { ${at(T.s1, 'ag-wake', OUT_EZ)} }
${P} .ag-p1 { ${dimmed(T.dim1)} }
${P} .ag-n1 { ${at(T.n1, 'ag-show', 'linear')} }
${T.tool.map((t, k) => `${P} .ag-tool${k} { animation: ${a(t, 'ag-in', OUT_EZ)}${k ? '' : ', ' + a(T.jolt, 'ag-jolt', 'linear', 'none')}; }`).join('\n')}
${P} .ag-qx { ${at(T.strike, 'ag-draw', OUT_EZ)} }
${GLOSS.map(([d, e], j) => `${P} .ag-gl${j} { animation: ${a([d + .03, .25], 'ag-say', OUT_EZ, 'forwards')}, ${hide([e - .12, .12])}; }`).join('\n')}
${P} .ag-glc { ${at(T.glc, 'ag-say', OUT_EZ)} }
${P} .ag-hyplit { ${at(T.hyplit, 'ag-show', 'ease')} }
${P} .ag-sp-det { ${spinning(T.spdet)} }
${P} .ag-q { animation: ${show(T.q)}; }
/* (jump-none: the last step lands before the end, since a plain steps() held forwards can stop a step short) */
${P} .ag-q0 .ag-qc { animation: ${a(T.q0, 'ag-wipe', 'steps(8, jump-none)')}, ${a(T.erase, 'ag-unwipe', 'steps(8, jump-none)', 'forwards')}; }
${P} .ag-q0 .ag-qk { animation: ${a(T.q0, 'ag-caret', 'steps(8, jump-none)')}, ${hide(T.k0)}, ${a([T.erase[0], .05], 'ag-show', 'linear', 'forwards')}, ${a(T.erase, 'ag-caret-back', 'steps(8, jump-none)', 'forwards')}; }
${P} .ag-q0 { animation: ${a([T.q[0], .01], 'ag-show', 'linear')}, ${hide(T.q0out)}; }
${P} .ag-q1 { animation: ${show([T.q1[0], .1])}, ${hide(T.q1out)}; }
${P} .ag-q1 .ag-qc { ${at(T.q1, 'ag-wipe', 'steps(8, jump-none)')} }
${P} .ag-q1 .ag-qk { animation: ${a(T.q1, 'ag-caret', 'steps(8, jump-none)')}, ${hide(T.k1)}; }
${P} .ag-g0a { ${at(T.g0a, 'ag-flash', IO, 'none')} }
${P} .ag-sw0 { ${at(T.sw0, 'ag-comet', 'linear', 'none')} }
${P} .ag-none { animation: ${a(T.none, 'ag-shake', OUT_EZ)}, ${hide(T.noneout)}; }
${P} .ag-loop { ${at(T.loop, 'ag-draw')} }
${P} .ag-lh { ${at(T.lh, 'ag-fade')} }
${P} .ag-g1 { ${at(T.g1, 'ag-flash', IO, 'none')} }
${P} .ag-tick { ${at(T.tick, 'ag-draw')} }
${P} .ag-g0b { ${at(T.g0b, 'ag-flash', IO, 'none')} }
${P} .ag-sw1 { ${at(T.sw1, 'ag-comet', 'linear', 'none')} }
${CNT.map((v, j) => `${P} .ag-cnt${j} { animation: ${a([T.cnt[0] + j * T.cnt[1], .01], 'ag-show', 'linear', 'forwards')}, ${hide([T.cnt[0] + (j + 1) * T.cnt[1], .01])}; }`).join('\n')}
${P} .ag-found { ${at(T.found, 'ag-land', OUT_EZ)} }
${P} .ag-qd { animation: ${show(T.qd)}; }
${P} .ag-qg circle { animation: ag-show ${k(T.dots[1])}s linear calc(${kd(T.dots[0])}s + var(--i) * ${k(.02)}s) both, ag-dimin ${k(.3)}s ease calc(${kd(T.qs[0] + .05)}s + (var(--c) * 6.4 + 3) / 102 * ${k(T.qs[1])}s) forwards; }   /* (a wave: each steps back as the scan passes it) */
${P} .ag-g2 { ${at(T.g2, 'ag-flash', IO, 'none')} }
${P} .ag-qs { ${at(T.qs, 'ag-scan', 'linear', 'none')} }
${P} .ag-qo { ${at(T.qo, 'ag-pop', OUT_EZ)} }
${P} .ag-qr { ${at(T.qr, 'ag-rip', OUT_EZ, 'none')} }
${P} .ag-qw { animation: ${a(T.qw, 'ag-fade')}, ${hide([T.h2[0] - .15, .12])}, ${a([T.h2[0] + .9, .3], 'ag-show', 'linear', 'forwards')}; }   /* (out of the dots' way as they launch) */
${P} .ag-replit { ${at([T.rep[0], .2], 'ag-show', 'linear')} }   /* (lit into the final frame: the whole path, Detection found it and Reporting wrote it up) */
${P} .ag-anl { ${at(T.anl, 'ag-in', OUT_EZ)} }   /* (once the halos have run, so they never cross it) */
/* step 3: Reporting writes it up as the dot flies in; the card grows from it; the hand-off, and the human lights */
${P} .ag-s2 { ${at(T.s2, 'ag-wake', OUT_EZ)} }
${P} .ag-c2 { ${at(T.c2, 'ag-comet', 'linear', 'none')} }
${P} .ag-sp-rep { ${spinning(T.sprep)} }
${P} .ag-fl-rep { ${at(T.rep, 'ag-flash', IO, 'none')} }
${P} .ag-flag { animation: ${a(T.card, 'ag-grow', OUT_EZ)}, ${a(T.antic, 'ag-antic', IO, 'none')}; }
${P} .ag-lead { ${at(T.lead, 'ag-fade')} }
${P} .ag-ln0 { ${at(T.ln[0], 'ag-in', OUT_EZ)} }
${P} .ag-ln1 { ${at(T.ln[1], 'ag-in', OUT_EZ)} }
${P} .ag-he { animation: ${a(T.he, 'ag-fade')}, ${a(T.pk, 'ag-march', 'linear', 'none')}; }
${P} .ag-anw { animation: ${a(T.anw, 'ag-show', 'linear', 'forwards')}, ${hide([T.ana[0] + .1, .05])}; }   /* (the amber one is already on top, so the person never blinks) */
${P} .ag-pk { ${at(T.pk, 'ag-pk', IO, 'none')} }
${P} .ag-ana { animation: ${a([T.ana[0], .01], 'ag-show', 'linear')}, ${a(T.ana, 'ag-spring', SPRING)}; }
${P} .ag-halo { ${at(T.halo, 'ag-halo', OUT_EZ, 'none')} }
${P} .ag-halo2 { ${at(T.halo2, 'ag-halo', OUT_EZ, 'none')} }
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), PH.svg);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', PH.svg.length, '(phone 360x' + PH.H + ')', 'scene.css', css.length, 'ends ~', Math.max(...ends).toFixed(1) + 's');
