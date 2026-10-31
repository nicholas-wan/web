// The Agentic AI card's "Hunt from a report" chart (README "Agentic AI glance chart"): one hunt in three steps, the
// owner's narrative (31 Oct 2026: "Narrow AI subagents purpose built for specific task. Agents equipped with tools and
// skills to iteratively adjust and adapt based on evidence found. Agents surface suspicious threats to assist
// analyst"). Version C refined (1 Nov 2026): fresh blind reviews found the earlier chart's motion generic and its
// words too fast, a redesign gave it continuity but lost the self-correction, and the owner chose a hybrid ("the
// first one has better continuity, but the second one second module shows more technical depth. combination of
// both?"), then the beam version, refined ("Yes, refine C"; "follow the resdesign version on how it moved, with the
// dotted line"; "fix then push"). Blind scores, the previous C against this one: 6 / 5.5 and 6 / 6 against 7.5 / 7
// and 7 / 7 (motion designer craft / understanding; layman understanding / impressive).
//   node tools/scenes/agentic-glance/build.cjs   writes scene-d.svg, scene-m.svg and scene.css here
//   node tools/scenes/agentic-glance/apply.cjs   puts the peek into experience.html and the CSS into internship-peek.css
// One object travels along one line. Step 1: the ransomware report reaches the supervisor, three agent badges fan out
// (one tool each: Hypothesis a bulb, Reporting a pen, Detection a lens; the product's own agents), the hunch pops out
// of Hypothesis and a pulse carries it along the wires to Detection, which slides straight along the line into step
// 2, leaving a dotted outline (owner); the rest of the team steps back. Step 2: the event logs; Detection types its
// first query, its beam sweeps the logs and nothing lights ("0 found", "empty doesn't mean safe"); the query is struck
// through, backspaced and retyped, then checked ("query checked"); the beam sweeps again, 32 light, all but one step
// back ("32 found · 1 unusual"). Step 3: that one lifts off the logs, travels along the line and unfolds into the
// lead card, Reporting comes forward and its pen marks the card, a small card runs the dashed line and the analyst
// lights amber ("Analyst decides"). At the end the supervisor's wire is redrawn to where Detection works and the
// dotted outline goes. Base styles are the final frame (reduced motion holds it); motion only under .is-playing;
// the replay fades the drawing only. Teal for the machine, amber for the human alone; the product's name never
// appears; no SIEM's syntax; the aria-label starts "An illustrative hunt." (the verifier and the spec pin it).
// Desktop 640x254, the steps as columns; phones 360 wide, each step's picture drawn 1.4x above its words, where
// Detection's move and the result's flight fade between the stacked steps.
const fs = require('fs'); const path = require('path');
const OUT = __dirname;

const C = { bg: '#061214', rule: '#24464b', line: '#1b3437', node: '#0b1b1e', chip: '#0a191c', ink: '#d8e6e4', body: '#b4c6c4', mute: '#8ba7a6', dim: '#4f6f6e',
  teal: '#28d7c5', amb: '#ffb869' };
const ICON = {
  bulb: '<path d="M6 1.4a3.6 3.6 0 0 0-2.1 6.5V9.4h4.2V7.9A3.6 3.6 0 0 0 6 1.4z"/><path d="M4.4 11h3.2"/>',
  pen: '<path d="M2 10.2l.9-2.9L8.4 1.8l2 2-5.5 5.5z"/><path d="M7.3 2.9l2 2"/>',
  lens: '<circle cx="5.2" cy="5.2" r="3.2"/><path d="M7.6 7.6 10.6 10.6"/>',
  doc: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
  ana: '<circle cx="6" cy="4" r="2"/><path d="M2.3 10.6c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  tick: '<path d="M2.4 6.4l2.4 2.4 4.8-5.2"/>',
};
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}">${ICON[k]}</g>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);
const T = (x, y, t, f = 9.5, col = C.mute, extra = '') => `<text x="${x}" y="${y}" font-size="${f}" fill="${col}"${extra ? ' ' + extra : ''}>${t}</text>`;

const STEPS = [
  { title: 'Purpose-built agents', d: ['A local model does best with one job, so', 'each narrow agent gets only the tools', 'and context that job needs.'],
    m: ['A local model does best with one job, so each', 'narrow agent gets only the tools and context', 'that job needs.'] },
  { title: 'Equipped to adapt', d: ['No results can mean a bad query, not a', 'safe network. So the agent rewrites it,', 'checks the fix and searches again.'],
    m: ['No results can mean a bad query, not a safe network.', 'So the agent rewrites it, checks the fix and', 'searches again.'] },
  { title: 'Surface to the analyst', d: ['Agents flag what looks suspicious, with', 'the evidence attached. Only a human', 'analyst makes the call.'],
    m: ['Agents flag what looks suspicious, with the evidence', 'attached. Only a human analyst makes the call.'] },
];
// the two searches Detection writes, in no SIEM's syntax (the verifier's rule); MONO is a character's width at 9px
const QUERIES = [['process', 'schtasks.exe'], ['event', 'task created']], MONO = 5.4, CNT = [4, 9, 15, 22, 28];
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each given only the tools and context its one job needs, because a local model does best with one job: forming a hypothesis, writing and running the detection logic, reporting. The Hypothesis agent\'s hunch is that attackers hide in scheduled tasks. The Detection agent\'s first search, for schtasks.exe, comes back empty, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so it rewrites the query, checks it and searches the event logs another way, around event 4698, a task being created. That returns 32 tasks created; one is unusual, \\WinTaskUpdate, on one host and not in the baseline. The Reporting agent writes it up as a lead with the evidence attached, and only a human analyst makes the call.';

// the layout, in the desktop's own units: the one line every hand-off travels along, the three agents' places, the
// supervisor, Detection's place in step 2, the logs, the query strip, the lead card and the analyst
const L = 104, HUB = [138, 58], BX = [56, 116, 176], DX = 252, G = { x: 292, y: 81, ts: 9, tg: 3 }, OUTT = [2, 5];
G.w = 8 * (G.ts + G.tg) - G.tg; G.h = 4 * (G.ts + G.tg) - G.tg;
const OUTC = [G.x + OUTT[1] * (G.ts + G.tg) + G.ts / 2, G.y + OUTT[0] * (G.ts + G.tg) + G.ts / 2];
const Q = { x: 238, y: 143, w: 162, h: 16 }, CARD = { x: 436, y: 76, w: 92, h: 56 }, AX = 588, R = 16;
// each step's picture: its reach in the desktop's units [left, right, top, bottom] (phones scale and stack them)
const REACH = [[16, 216, 47, 166], [234, 404, 64, 179], [434, 622, 74, 158]];

const badge = (cls, cx, cy, ic, name, on) => `<g class="ag-b ${cls}"><rect class="ag-b-glow" x="${cx - 18}" y="${cy - 18}" width="36" height="36" rx="10" fill="none" stroke="${C.teal}" stroke-width="5" stroke-opacity=".22"/>` +
  `<rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" rx="7" fill="${C.node}" stroke="${on ? C.teal : C.dim}" stroke-width="1.4"/>` +
  `${icon(ic, r1(cx - 8.4), r1(cy - 8.4), 1.4, on ? C.teal : C.mute)}${T(cx, cy + 28, name, 9.5, on ? C.teal : C.mute, 'text-anchor="middle"')}</g>`;
const wire = x => `M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${x} ${L - 30} ${x} ${L - 14}`;

// the pictures, in the desktop's units; phone: Detection's move becomes a fade between the stacked steps
function picture(i, phone) {
  if (i === 0) {
    let p = `<g class="ag-team">${BX.map((x, k) => `<path class="ag-wire${k === 2 ? ' ag-wire-det' : ''}" d="${wire(x)}" pathLength="1" stroke="${C.dim}" fill="none"/>`).join('')}` +
      `<g class="ag-hub"><circle cx="${HUB[0]}" cy="${HUB[1]}" r="8" fill="${C.node}" stroke="${C.dim}" stroke-width="1.3"/><circle cx="${HUB[0]}" cy="${HUB[1]}" r="2.6" fill="${C.dim}"/></g>${T(HUB[0] + 13, HUB[1] + 3.3, 'Supervisor')}` +
      badge('ag-bh', BX[0], L, 'bulb', 'Hypothesis') +
      // Detection's place in step 1: a dotted outline once it has moved on (owner)
      `<rect class="ag-slot" x="${BX[2] - 14}" y="${L - 14}" width="28" height="28" rx="7" fill="none" stroke="${C.dim}" stroke-dasharray="3 3"/>` +
      (phone ? `<g class="ag-det1">${badge('', BX[2], L, 'lens', 'Detection', true)}</g>` : '') + '</g>';
    p += `<g class="ag-rep"><rect x="16" y="${HUB[1] - 9}" width="104" height="18" rx="5" fill="${C.chip}" stroke="${C.rule}"/>${icon('doc', 21, HUB[1] - 6.6, 1.1, C.ink)}${T(37, HUB[1] + 3.3, 'Ransomware report', 9, C.body)}</g>` +
      `<path class="ag-rep-link" d="M120 ${HUB[1]} H${HUB[0] - 9}" stroke="${C.dim}" pathLength="1" fill="none"/>`;
    p += `<g class="ag-repb">${badge('ag-br', BX[1], L, 'pen', 'Reporting')}</g>`;
    p += `<g class="ag-hunch"><rect x="16" y="146" width="200" height="17" rx="8.5" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".55"/>` +
      `<text x="25" y="158" font-size="10" fill="${C.body}"><tspan font-weight="700" fill="${C.teal}">Hunch:</tspan> attackers hide in scheduled tasks</text></g>` +
      `<path class="ag-hpath" d="M${BX[0]} ${L - 14} C${BX[0]} ${L - 30} ${HUB[0]} ${HUB[1] + 20} ${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${BX[2]} ${L - 30} ${BX[2]} ${L - 14}" pathLength="1" stroke="${C.teal}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    return p;
  }
  if (i === 1) {
    let p = T(G.x, 73, 'Event logs', 10.5, C.mute, 'class="ag-lg"');
    p += `<g class="ag-logs">${Array.from({ length: 32 }, (_, k) => { const c = k % 8, r = (k / 8) | 0;
      return `<rect class="ag-t${r === OUTT[0] && c === OUTT[1] ? ' ag-t-out' : ''}" x="${G.x + c * (G.ts + G.tg)}" y="${G.y + r * (G.ts + G.tg)}" width="${G.ts}" height="${G.ts}" rx="2" style="--c:${c}"/>`; }).join('')}</g>`;
    p += `<circle class="ag-ring" cx="${OUTC[0]}" cy="${OUTC[1]}" r="9" fill="none" stroke="${C.teal}" stroke-width="1.4"/>`;
    const cone = `M${DX + 12} ${L - 3} L${G.x - 3} ${G.y - 4} H${G.x + G.w + 3} V${G.y + G.h + 4} H${G.x - 3} Z`;
    p += [0, 1].map(k => `<path class="ag-beam ag-beam${k}" d="${cone}" fill="${k ? C.teal : C.mute}" fill-opacity="${k ? .12 : .1}"/>` +
      `<rect class="ag-bar ag-bar${k}" x="${G.x - 3}" y="${G.y - 4}" width="3" height="${G.h + 8}" rx="1.5" fill="${k ? C.teal : C.mute}" style="--w:${G.w + 3}px"/>`).join('');
    const cy = 137;
    p += T(G.x, cy, '0 found', 10.5, C.body, 'class="ag-n0" font-weight="700"') + CNT.map((v, j) => T(G.x, cy, v + ' found', 10.5, C.teal, `class="ag-cn ag-cn${j}" font-weight="700"`)).join('') +
      T(G.x, cy, '32 found', 10.5, C.teal, 'class="ag-n32" font-weight="700"') + T(G.x + 50, cy, '&#183; 1 unusual', 10.5, C.teal, 'class="ag-qw" font-weight="700"');
    const tx0 = Q.x + 15, base = Q.y + 11.3;
    p += `<g class="ag-q"><rect x="${Q.x}" y="${Q.y}" width="${Q.w}" height="${Q.h}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>`;
    QUERIES.forEach(([f, v], k) => { const len = r1((f.length + v.length + 5) * MONO);
      p += `<g class="ag-q${k}"><text x="${Q.x + 6}" y="${base}" font-size="10" font-weight="700" fill="${C.teal}">&#8250;</text>` +
        `<text class="ag-qt" x="${tx0}" y="${base}" font-size="9" textLength="${len}" lengthAdjust="spacing"><tspan fill="${C.body}">${f}</tspan><tspan fill="${C.dim}"> = </tspan><tspan fill="${C.teal}">"${esc(v)}"</tspan></text>` +
        (k === 0 ? `<path class="ag-qx" d="M${tx0 - 1} ${Q.y + Q.h / 2 + .5} H${r1(tx0 + len + 1)}" pathLength="1" stroke="${C.mute}" stroke-width="1.2"/>` : `<g class="ag-qok">${icon('tick', Q.x + Q.w - 17, Q.y + 2, 1, C.teal)}</g>`) +
        `<rect class="ag-qc" x="${tx0 - .5}" y="${Q.y + 1.5}" width="${r1(len + 2)}" height="${Q.h - 3}" fill="${C.chip}"/>` +
        `<rect class="ag-qk" x="${tx0}" y="${Q.y + 3}" width="1.2" height="${Q.h - 6}" fill="${C.teal}" style="--w:${len}px"/></g>`; });
    p += '</g>' + T(Q.x, 175, 'empty doesn&#39;t mean safe', 11, C.ink, 'class="ag-gl ag-gl0" font-weight="600"') + T(Q.x, 175, 'query checked', 11, C.teal, 'class="ag-gl ag-gl1" font-weight="600"');
    if (phone) p += `<g class="ag-det" style="--dx:0px">${badge('ag-bd', DX, L, 'lens', 'Detection', true)}</g>`;
    return p;
  }
  const { x, y, w, h } = CARD;
  return `<g class="ag-card"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".75"/>` +
    `${icon('flag', x + 8, y + 9, 1.2, C.teal)}<text x="${x + 26}" y="${y + 20}" font-size="10.5" font-weight="700" fill="${C.ink}">1 lead</text>` +
    `<g class="ag-cpen">${icon('pen', x + w - 21, y + 5, 1.35, C.teal)}</g>` +
    `${T(x + 10.5, y + 37, 'Scheduled Task', 9.8, C.body)}${T(x + 10.5, y + 49, 'T1053.005', 9, C.mute, 'letter-spacing=".02em"')}</g>` +
    `<g class="ag-trick">${T(x, y + h + 16, 'a known attacker trick', 10.5, C.body)}</g>` +
    `<path class="ag-he" d="M${x + w + 6} ${L} H${AX - R - 6}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" fill="none"/>` +
    `<rect class="ag-pk" x="${x + w + 2}" y="${L - 3.5}" width="9" height="7" rx="1.5" fill="${C.teal}" style="--dx:${AX - R - 6 - (x + w + 6)}px"/>` +
    `<g class="ag-ana"><circle cx="${AX}" cy="${L}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.5"/>${icon('ana', r1(AX - 13.7), r1(L - 13.7), 2.28, C.amb)}</g>` +
    `<circle class="ag-halo" cx="${AX}" cy="${L}" r="${R}" fill="none" stroke="${C.amb}" stroke-width="1.4"/>${T(AX, L + R + 18, 'Analyst decides', 9.8, C.amb, 'class="ag-decides" text-anchor="middle" font-weight="600"')}`;
}
// the result's flight, from the unusual tile to the card's flag (map: desktop units to the drawing's)
const fly = map => { const [a, b] = [map(1, OUTC), map(2, [CARD.x + 14, CARD.y + 15])], s1 = map(1, [1, 0])[0] - map(1, [0, 0])[0];
  return `<g class="ag-fly" style="--dx:${r1(b[0] - a[0])}px"><g class="ag-fly-y" style="--dy:${r1(b[1] - a[1])}px"><rect class="ag-fly-t" x="${r1(a[0] - 4.5 * s1)}" y="${r1(a[1] - 4.5 * s1)}" width="${r1(9 * s1)}" height="${r1(9 * s1)}" rx="${r1(2 * s1)}" fill="${C.teal}"/></g></g>`; };

const title = (i, x, y, f) => `<text x="${x}" y="${y}" font-size="${f}" font-weight="700" fill="${C.ink}"><tspan fill="${i === 2 ? C.amb : C.teal}" font-size="${r1(f - 2)}">${i + 1}</tspan><tspan dx="7">${STEPS[i].title}</tspan></text>`;
const body = (lines, x, y, lh, f) => lines.map((t, j) => T(x, r1(y + j * lh), esc(t), f, C.body)).join('');
const MARK = ['M14 2.2A10 10 0 0 1 21.8 10L18.97 10A7.25 7.25 0 0 0 14 5.03ZM21.8 14A10 10 0 0 1 14 21.8L14 18.97A7.25 7.25 0 0 0 18.97 14ZM10 21.8A10 10 0 0 1 2.2 14L5.03 14A7.25 7.25 0 0 0 10 18.97ZM2.2 10A10 10 0 0 1 10 2.2L10 5.03A7.25 7.25 0 0 0 5.03 10Z', 'M12 6L18 12L12 18L6 12Z'];
const logo = (x, y, s) => `<g class="ag-logo"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r1(s * .25)}" fill="${C.node}" stroke="${C.rule}"/>` +
  `<g transform="translate(${r1(x + s * .17)} ${r1(y + s * .17)}) scale(${+(s * .66 / 24).toFixed(4)})">${MARK.map(d => `<path d="${d}"/>`).join('')}</g></g>`;
const PRODUCT = 'Agentic Threat Hunting', HEADLINE = 'From a ransomware report to one lead';
function header(w, y, fh, phone) {
  const s = r1(fh * (phone ? 1.45 : 1.25)), sx = 16 + s + 6, line = phone ? y + 35 : y + 11;
  let h = `<g class="ag-head">${logo(16, r1(y - s + fh * (phone ? .38 : .3)), s)}<text x="${sx}" y="${y}" font-size="${fh}" font-weight="700" fill="${C.ink}">${PRODUCT}` +
    (phone ? '</text>' : `<tspan dx="8" font-weight="400" fill="${C.dim}">|</tspan><tspan dx="8" font-weight="400" fill="${C.body}">${HEADLINE}</tspan></text>`);
  if (phone) h += `<text x="16" y="${y + 21}" font-size="${r1(fh - .5)}" fill="${C.body}">${HEADLINE}</text>`;
  return h + `</g><path d="M16 ${line} H${w - 16}" stroke="${C.line}"/>`;
}
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, the line running through them
const DH = 254;
function desktop() {
  const W = 640, s = [open('ag-scene', W, DH), header(W, 23, 11.5)];
  STEPS.forEach((st, i) => { const x = 16 + i * 208;
    s.push(`<g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${title(i, x, 194, 12.5)}${body(st.d, x, 213, 15.5, 10.3)}</g></g>`); });
  const stage = [0, 1, 2].map(i => `<g class="ag-p ag-p${i}">${picture(i, false)}</g>`).join('') +
    // the line: Detection's place to where it works, and on to step 3; at the end the supervisor's wire is redrawn to it
    `<path class="ag-ln ag-ln1" d="M${BX[2] + 15} ${L} H${DX - 15}" pathLength="1" stroke="${C.rule}" fill="none"/><path class="ag-ln ag-ln2" d="M${G.x + G.w + 8} ${L} H${CARD.x - 6}" pathLength="1" stroke="${C.rule}" fill="none"/>` +
    `<path class="ag-wire2" d="M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 30} ${DX} ${L - 40} ${DX} ${L - 14}" pathLength="1" stroke="${C.dim}" fill="none"/>` +
    `<g class="ag-det" style="--dx:${DX - BX[2]}px">${badge('ag-bd', BX[2], L, 'lens', 'Detection', true)}</g>` + fly((i, p) => p);
  return s.join('') + `<g class="ag-stage">${stage}</g></svg>`;
}
// phones: each step's picture drawn 1.4x and centred above its words, with room between them
const PS = 1.4;
function phone() {
  const W = 360, words = [], pics = [], at = []; let y = 64;
  STEPS.forEach((st, i) => {
    const [x0, x1, y0, y1] = REACH[i], px = r1((W - PS * (x1 - x0)) / 2 - PS * x0), py = r1(y + 18 - PS * y0);
    at[i] = [px, py];
    pics.push(`<g class="ag-p ag-p${i}"><g transform="translate(${px} ${py}) scale(${PS})">${picture(i, true)}</g></g>`);
    const ty = r1(y + 18 + PS * (y1 - y0) + 26), by = r1(ty + 22);
    words.push(`<g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${title(i, 16, ty, 14.5)}${body(st.m, 16, by, 18.5, 13.4)}</g></g>`);
    y = r1(by + (st.m.length - 1) * 18.5 + 22);
    if (i < 2) words.push(`<path d="M14 ${y} H${W - 14}" stroke="${C.line}"/>`);
  });
  const H = r1(y + 2), map = (i, [u, v]) => [at[i][0] + PS * u, at[i][1] + PS * v];
  return { svg: open('ag-scene ag-scene--m', W, H) + header(W, 25, 13, true) + words.join('') + `<g class="ag-stage">${pics.join('')}${fly(map)}</g></svg>`, H };
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// [start, duration] in seconds; LEAD holds the opened card still for a beat first ("slightly longer delay before it
// starts"), on every replay too. Each reading moment holds about 2 s (owner: "barely on screen for 0.5s").
const LEAD = 0.5;
const t = {
  rep: [0.3, .5], replink: [.75, .25], hub: [.85, .3], wires: [.9, .35], bh: [1.0, .3], br: [1.08, .3], bd: [1.16, .3],
  hyp: [1.2, 1.1], hunch: [1.3, .4], hpath: [2.1, .8], hunchgo: [2.75, .4], detglow: [2.8, 4.95], det: [2.95, .55], ln1: [2.95, .55], w1: [3.0, .5], back: [3.15, .45],
  lg: [3.45, .35], logs: [3.5, .4], q: [3.55, .25], q0: [3.7, .6], k0: [4.35, .1], s0: [4.4, .8], n0: [5.35, .4], gl0: [5.4, 1.95], qx: [6.3, .2], erase: [6.55, .35],
  q1: [6.95, .6], k1: [7.6, .1], ok: [7.6, .3], gl1: [7.65, 1.3], s1: [8.3, .6], cnt: [8.5, .07], dim: [9.1, .45], ring: [9.35, .4], qw: [9.5, .3],
  ln2: [10.1, .35], fly: [10.25, .7], w2: [10.35, .45], fwd: [10.45, .4], card: [10.95, .5], cpen: [11.25, .35], trick: [11.35, .3],
  he: [11.5, .35], pk: [11.65, .55], ana: [12.2, .5], halo: [12.3, 1.1], decides: [13.35, .3], all: [12.75, .5], wire2: [12.85, .6], slotout: [12.85, .5],
};
const EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)', STEPS8 = 'steps(8, jump-none)';
const d = v => +(LEAD + v).toFixed(3);
const an = ([s, l], name, ez = IO, fill = 'both') => `${name} ${l}s ${ez} ${d(s)}s ${fill}`;
const P = '.is-playing svg.ag-scene', PM = '.is-playing svg.ag-scene--m', S = 'svg.ag-scene', PH = phone();
const ends = Object.values(t).map(([s, l]) => d(s + l));
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / ${DH}; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / ${PH.H}; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
${S} text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
${S} text.ag-qt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; }
${S} .ag-i { fill: none; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
${S} .ag-ana .ag-i { stroke-width: .7; }
${S} .ag-logo path { fill: ${C.ink}; }
${S} :is(.ag-b, .ag-card, .ag-ana, .ag-hub, .ag-det, .ag-rep, .ag-hunch, .ag-n0, .ag-t, .ag-ring, .ag-fly-t, .ag-halo, .ag-slot, .ag-qok, .ag-cpen) { transform-box: fill-box; transform-origin: center; }
${S} .ag-card { transform-origin: 15% 25%; }
${S} .ag-qc { transform-box: fill-box; transform-origin: 100% 50%; }
${S} :is(.ag-wire, .ag-wire2, .ag-ln, .ag-rep-link, .ag-qx) { stroke-dasharray: 1 2; }   /* (drawn: the dash covers the path; undrawn, it sits before the start) */
${S} .ag-hpath { stroke-dasharray: .12 2; stroke-opacity: 0; }
${S} .ag-det { transform: translateX(var(--dx)); }
${S} .ag-rep { opacity: .85; }
${S} .ag-hunch { opacity: .75; }
${S} .ag-t { fill: ${C.dim}; fill-opacity: .55; }
${S} .ag-t-out { fill: ${C.teal}; fill-opacity: 1; }
/* the final frame: the supervisor's wire to where Detection works, no dotted outline (a phone keeps it, with Detection
   faint in it, since its two places are on separate steps) */
${S}:not(.ag-scene--m) :is(.ag-slot, .ag-wire-det, .ag-ln1) { opacity: 0; }
svg.ag-scene--m .ag-det1 { opacity: .3; }
/* transient marks: hidden in the final frame */
${S} :is(.ag-b-glow, .ag-n0, .ag-cn, .ag-gl, .ag-beam, .ag-bar, .ag-halo, .ag-fly, .ag-q0, .ag-pk) { opacity: 0; }
/* the replay: the drawing fades and starts over while the card, its header and its words stay */
.internship-demo-card.is-fading .internship-demo-card__plot > svg.ag-scene { opacity: 1; }
.internship-demo-card.is-fading ${S} .ag-stage { opacity: 0; transition: opacity 240ms ease; }
.internship-demo-card.is-fading ${S} :is(.ag-sw1, .ag-sw2) { opacity: .22; transition: opacity 240ms ease; }
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-pop { from { opacity: 0; transform: scale(.6); } }
@keyframes ag-draw { from { stroke-dashoffset: 1.05; } }
@keyframes ag-wake { from { opacity: .22; } }
@keyframes ag-slidein { from { opacity: 0; transform: translateX(-10px); } to { opacity: .85; transform: none; } }
@keyframes ag-bump { 50% { transform: scale(1.25); } }
@keyframes ag-glow { 0%, 100% { opacity: 0; } 12%, 88% { opacity: 1; } }
@keyframes ag-hunch { from { opacity: 0; transform: translateY(-14px) scale(.7); } }
@keyframes ag-hunchgo { from { opacity: 1; } to { opacity: .75; } }
@keyframes ag-pulse { 0% { stroke-dashoffset: .12; stroke-opacity: 0; } 12% { stroke-opacity: 1; } 88% { stroke-dashoffset: -.88; stroke-opacity: 1; } 100% { stroke-dashoffset: -.88; stroke-opacity: 0; } }
@keyframes ag-slide { from { transform: none; } to { transform: translateX(var(--dx)); } }
@keyframes ag-back { from { opacity: 1; } to { opacity: .4; } }
@keyframes ag-fwd { from { opacity: .4; } to { opacity: 1; } }
@keyframes ag-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-keep { from, to { opacity: 1; } }
@keyframes ag-hide { from { opacity: 1; } to { opacity: 0; } }
@keyframes ag-ghost { from { opacity: 1; } to { opacity: .3; } }
@keyframes ag-wipe { from { opacity: 1; transform: scaleX(1); } to { opacity: 1; transform: scaleX(0); } }
@keyframes ag-unwipe { from { opacity: 1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
@keyframes ag-caret { to { transform: translateX(var(--w)); } }
@keyframes ag-caretback { from { transform: translateX(var(--w)); } to { transform: none; } }
@keyframes ag-shake { 0% { opacity: 0; transform: scale(1.3); } 35% { opacity: 1; transform: none; } 50% { transform: translateX(-2px); } 65% { transform: translateX(2px); } 80% { transform: translateX(-1px); } 100% { opacity: 1; transform: none; } }
@keyframes ag-hold { 0% { opacity: 0; transform: translateY(4px); } 10%, 90% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes ag-say { from { opacity: 0; transform: translateY(4px); } }
@keyframes ag-beam { 0% { opacity: 0; } 15%, 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ag-bar { 0% { opacity: 0; transform: none; } 10%, 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--w)); } }
@keyframes ag-miss { 0%, 100% { fill: ${C.dim}; fill-opacity: .55; } 30% { fill: ${C.mute}; fill-opacity: .9; } }
@keyframes ag-tile { 0% { fill: ${C.dim}; fill-opacity: .55; } 22%, 62% { fill: ${C.teal}; fill-opacity: .9; } 100% { fill: ${C.dim}; fill-opacity: .55; } }
@keyframes ag-light { from { fill: ${C.dim}; fill-opacity: .55; } }
@keyframes ag-ring { 0% { opacity: 0; transform: scale(.4); } 60% { opacity: 1; transform: scale(1.15); } 100% { opacity: 1; transform: none; } }
@keyframes ag-flyx { to { transform: translateX(var(--dx)); } }
@keyframes ag-flyy { to { transform: translateY(var(--dy)); } }
@keyframes ag-flyt { 0% { opacity: 0; transform: none; } 10% { opacity: 1; transform: translateY(-6px) scale(1.7); } 30% { transform: translateY(-6px) scale(1.7); } 100% { opacity: 1; transform: none; } }
@keyframes ag-flytm { 0% { opacity: 0; transform: none; } 10% { opacity: 1; transform: translateY(-6px) scale(1.7); } 30% { opacity: 1; transform: translateY(-6px) scale(1.7); } 45%, 75% { opacity: .25; } 100% { opacity: 1; transform: none; } }
@keyframes ag-unfold { from { opacity: 0; transform: scale(.1); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes ag-spring { from { opacity: 0; transform: scale(.75); } to { opacity: 1; transform: none; } }
@keyframes ag-halo { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.8); } }
@keyframes ag-march { to { stroke-dashoffset: -14; } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 12%, 88% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
/* step 1: the report reaches the supervisor, the badges fan out, the hunch is carried to Detection, which moves on */
${P} .ag-rep { animation: ${an(t.rep, 'ag-slidein', EZ)}; }
${P} .ag-rep-link { animation: ${an(t.replink, 'ag-draw')}; }
${P} .ag-hub { animation: ${an(t.hub, 'ag-bump', SPRING, 'none')}; }
${P} .ag-wire { animation: ${an(t.wires, 'ag-draw')}; }
${P} .ag-bh { animation: ${an(t.bh, 'ag-pop', SPRING)}; }
${P} .ag-br { animation: ${an(t.br, 'ag-pop', SPRING)}; }
${P} .ag-bd { animation: ${an(t.bd, 'ag-pop', SPRING)}; }
${P} .ag-bh .ag-b-glow { animation: ${an(t.hyp, 'ag-glow', 'linear', 'none')}; }
${P} .ag-hunch { animation: ${an(t.hunch, 'ag-hunch', EZ)}, ${an(t.hunchgo, 'ag-hunchgo', 'ease', 'forwards')}; }
${P} .ag-hpath { animation: ${an(t.hpath, 'ag-pulse', 'linear', 'none')}; }   /* (the hunch carried along the wires: up to the supervisor, down to Detection) */
${P} .ag-det { animation: ${an(t.det, 'ag-slide', IO)}; }   /* (straight along the line, as in the redesign) */
${P} .ag-bd .ag-b-glow { animation: ${an(t.detglow, 'ag-glow', 'linear', 'none')}; }
/* (on desktop these three are gone from the final frame, so they are held on while it plays, then go together) */
${P} .ag-slot { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an([t.det[0] + .2, .3], 'ag-pop', SPRING)}, ${an(t.slotout, 'ag-hide', 'ease', 'forwards')}; }
${P} .ag-wire-det { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an(t.wires, 'ag-draw')}, ${an(t.slotout, 'ag-hide', 'ease', 'forwards')}; }
${P} .ag-ln1 { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an(t.ln1, 'ag-draw')}, ${an(t.slotout, 'ag-hide', 'ease', 'forwards')}; }
${P} .ag-wire2 { animation: ${an(t.wire2, 'ag-draw', EZ)}; }
${P} .ag-s1 { animation: ${an(t.w1, 'ag-wake', EZ)}; }
/* the team steps back while Detection works, Reporting comes forward to write the lead, all forward at the end */
${P} .ag-team { animation: ${an(t.back, 'ag-back', 'ease', 'forwards')}, ${an(t.all, 'ag-fwd', 'ease', 'forwards')}; }
${P} .ag-repb { animation: ${an(t.back, 'ag-back', 'ease', 'forwards')}, ${an(t.fwd, 'ag-fwd', 'ease', 'forwards')}; }
${P} .ag-br .ag-b-glow { animation: ${an([t.fwd[0], 1.3], 'ag-glow', 'linear', 'none')}; }
/* step 2: the logs; a query, a sweep that finds nothing; struck, backspaced, retyped, checked; a sweep that finds 32, one unusual */
${P} .ag-lg { animation: ${an(t.lg, 'ag-fade')}; }
${P} .ag-logs { animation: ${an(t.logs, 'ag-fade')}; }
${P} .ag-q { animation: ${an(t.q, 'ag-fade')}; }
${P} .ag-q0 { animation: ${an([t.q[0], .01], 'ag-show', 'linear')}, ${an([t.q1[0] - .05, .1], 'ag-hide', 'linear', 'forwards')}; }
/* (jump-none: the last step lands before the end, since a plain steps() held forwards can stop a step short) */
${P} .ag-q0 .ag-qc { animation: ${an(t.q0, 'ag-wipe', STEPS8)}, ${an(t.erase, 'ag-unwipe', STEPS8, 'forwards')}; }
${P} .ag-q0 .ag-qk { animation: ${an(t.q0, 'ag-caret', STEPS8)}, ${an(t.k0, 'ag-hide', 'linear', 'forwards')}, ${an([t.erase[0], .02], 'ag-show', 'linear', 'forwards')}, ${an(t.erase, 'ag-caretback', STEPS8, 'forwards')}; }
${P} .ag-qx { animation: ${an(t.qx, 'ag-draw', EZ)}; }
${P} .ag-q1 { animation: ${an([t.q1[0], .05], 'ag-show', 'linear')}; }
${P} .ag-q1 .ag-qc { animation: ${an(t.q1, 'ag-wipe', STEPS8)}; }
${P} .ag-q1 .ag-qk { animation: ${an(t.q1, 'ag-caret', STEPS8)}, ${an(t.k1, 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-qok { animation: ${an(t.ok, 'ag-pop', SPRING)}; }
${P} .ag-beam0 { animation: ${an(t.s0, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar0 { animation: ${an([t.s0[0] + .05, .7], 'ag-bar', 'linear', 'none')}; }
${P} .ag-t:not(.ag-t-out) { animation: ag-tile calc(${(t.dim[0] + t.dim[1] - t.s1[0]).toFixed(2)}s - var(--c) * .07s) ease calc(${d(t.s1[0] + .1)}s + var(--c) * .07s) both, ag-miss .5s ease calc(${d(t.s0[0] + .1)}s + var(--c) * .08s) none; }   /* (the first sweep: each flickers grey and settles; the second: each lights, then steps back; the flicker listed last, so it wins while it plays) */
${P} .ag-t-out { animation: ag-light .3s ease calc(${d(t.s1[0] + .1)}s + var(--c) * .07s) both, ag-miss .5s ease calc(${d(t.s0[0] + .1)}s + var(--c) * .08s) none; }
${P} .ag-n0 { animation: ${an(t.n0, 'ag-shake', EZ)}, ${an([t.erase[0], .15], 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-gl0 { animation: ${an(t.gl0, 'ag-hold', 'linear', 'none')}; }
${P} .ag-gl1 { animation: ${an(t.gl1, 'ag-hold', 'linear', 'none')}; }
${P} .ag-beam1 { animation: ${an(t.s1, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar1 { animation: ${an([t.s1[0] + .05, .55], 'ag-bar', 'linear', 'none')}; }
${CNT.map((v, j) => `${P} .ag-cn${j} { animation: ${an([+(t.cnt[0] + j * t.cnt[1]).toFixed(3), .01], 'ag-show', 'linear', 'forwards')}, ${an([+(t.cnt[0] + (j + 1) * t.cnt[1]).toFixed(3), .01], 'ag-hide', 'linear', 'forwards')}; }`).join('\n')}
${P} .ag-n32 { animation: ${an([+(t.cnt[0] + CNT.length * t.cnt[1]).toFixed(3), .01], 'ag-show', 'linear')}; }
${P} .ag-ring { animation: ${an(t.ring, 'ag-ring', SPRING)}; }
${P} .ag-qw { animation: ${an(t.qw, 'ag-say', EZ)}; }
/* step 3: the result travels along the line and unfolds into the lead; Reporting's pen marks it; the hand-off */
${P} .ag-ln2 { animation: ${an(t.ln2, 'ag-draw')}; }
${P} .ag-fly { animation: ${an([t.fly[0] + .2, t.fly[1]], 'ag-flyx', IO)}; opacity: 1; }
${P} .ag-fly-y { animation: ${an([t.fly[0] + .2, t.fly[1]], 'ag-flyy', 'cubic-bezier(.55,.05,.85,.45)')}; }
${P} .ag-fly-t { animation: ${an([t.fly[0], t.fly[1] + .2], 'ag-flyt', IO)}, ${an([t.card[0] + .05, .1], 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-s2 { animation: ${an(t.w2, 'ag-wake', EZ)}; }
${P} .ag-card { animation: ${an(t.card, 'ag-unfold', EZ)}; }
${P} .ag-cpen { animation: ${an(t.cpen, 'ag-pop', SPRING)}; }
${P} .ag-trick { animation: ${an(t.trick, 'ag-say', EZ)}; }
${P} .ag-he { animation: ${an(t.he, 'ag-fade')}, ${an(t.pk, 'ag-march', 'linear', 'none')}; }
${P} .ag-pk { animation: ${an(t.pk, 'ag-pk', IO, 'none')}; }
${P} .ag-ana { animation: ${an(t.ana, 'ag-spring', SPRING)}; }
${P} .ag-halo { animation: ${an(t.halo, 'ag-halo', EZ, 'none')}; }
${P} .ag-decides { animation: ${an(t.decides, 'ag-say', EZ)}; }   /* (once the halo has run, so it never crosses it) */
/* phones: Detection's two places are on separate steps, so it fades from one and arrives at the other, and the
   result's flight fades back while it crosses the words */
${PM} .ag-det { animation: ${an([t.det[0] + .3, .4], 'ag-pop', SPRING)}; }
${PM} .ag-det1 { animation: ${an(t.det, 'ag-ghost', 'ease')}; }
${PM} .ag-fly-t { animation-name: ag-flytm, ag-hide; }
${PM} .ag-slot { animation: ${an([t.det[0] + .2, .3], 'ag-pop', SPRING)}; }
${PM} .ag-wire-det { animation: ${an(t.wires, 'ag-draw')}; }
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), PH.svg);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', PH.svg.length, '(phone 360x' + PH.H + ')', 'scene.css', css.length, 'ends ~', Math.max(...ends).toFixed(1) + 's');
