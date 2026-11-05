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
// through, backspaced and retyped, then checked ("query checked"); the beam sweeps again, 32 light, all but one dim
// again ("32 found · 1 unusual"). Step 3: that one lifts off the logs, travels along the line and unfolds into the
// lead card, Reporting comes forward and its pen marks the card, a small card runs the dashed line and the analyst
// lights amber ("Analyst decides"). At the end the supervisor's wire is redrawn to where Detection works and the
// dotted outline goes. Base styles are the final frame (reduced motion holds it); motion only under .is-playing;
// the replay fades the drawing only. Teal for the machine, amber for the human alone; the product's name never
// appears; no SIEM's syntax; the aria-label starts "An illustrative hunt." (the verifier and the spec pin it).
// Desktop 640x260, the steps as columns; phones 360 wide, the steps stacked on a spine of numbers down the left, each
// step's words above its picture (drawn 1.08x), the hand-offs a teal dot running the spine from one picture to the next.
// A polish pass (1 Nov 2026, owner: "suggest optimizations or polish. refer to professional websites and animations",
// then "Yes, ship all six"; proposed on lab/hunt-polish, reviewed by an independent visual review and a blind motion
// read): entrances ease out and the overshoot spring is kept for the two payoffs (the ring, the analyst); entrances
// start near their final size (.88, not .6); exits are shorter than entrances (.25 to .3 s on a standard ease: a first
// cut on Material's accelerate curve read as a hard cut); the queries type one character a step; the count rolls
// like an odometer through a one-row window whose edges fade (.ag-odo, masked); and each log tile is three rects
// (grey, the flicker, the light) so only opacity ever animates, the tiles cascading in by column. No fill keyframes
// remain. The story, its timing, words, colours and final frame are unchanged.
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
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}" style="stroke-width:${(1.55 / s).toFixed(3)}">${ICON[k]}</g>`;   // (every icon draws at 1.55 units, whatever its scale)
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);
const T = (x, y, t, f = 10, col = C.mute, extra = '') => `<text x="${x}" y="${y}" font-size="${f}" fill="${col}"${extra ? ' ' + extra : ''}>${t}</text>`;

const STEPS = [
  { title: 'Purpose-built agents', d: ['A local model does best with one job, so', 'each narrow agent gets only the tools', 'and context that job needs.'],
    m: ['A local model does best with one job, so each narrow', 'agent gets only the tools and context that job needs.'] },
  { title: 'Equipped to adapt', d: ['No results can mean a bad query, not a', 'safe network. So the agent rewrites it,', 'checks the fix and searches again.'],
    m: ['No results can mean a bad query, not a safe', 'network. So the agent rewrites it, checks the fix', 'and searches again.'] },   // (three lines: the track runs past their ends)
  { title: 'Surface to the analyst', d: ['Agents flag what looks suspicious, with', 'the evidence attached. Only a human', 'analyst makes the call.'],
    m: ['Agents flag what looks suspicious, with the evidence', 'attached. Only a human analyst makes the call.'] },
];
// the two searches Detection writes, in no SIEM's syntax (the verifier's rule); MONO is a character's width at 9px
const QUERIES = [['process', 'schtasks.exe'], ['event', 'task created']], MONO = 5.4, CNT = [10, 14, 19, 24, 28];   // (two digits each, so the count keeps its left edge and "found" stays put as it rolls)
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each given only the tools and context its one job needs, because a local model does best with one job: forming a hypothesis, writing and running the detection logic, reporting. The Hypothesis agent\'s hunch is that attackers hide in scheduled tasks. The Detection agent\'s first search, for schtasks.exe, comes back empty, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so it rewrites the query, checks it and searches the event logs another way, around event 4698, a task being created. That returns 32 tasks created; one is unusual, \\WinTaskUpdate, on one host and not in the baseline. The Reporting agent writes it up as a lead with the evidence attached, and only a human analyst makes the call.';

// the layout, in the desktop's own units: the one line every hand-off travels along, the three agents' places, the
// supervisor, Detection's place in step 2, the logs, the query strip, the lead card and the analyst
// (5 Nov 2026, second review: the logs sit 7 higher so the count shares a baseline with Detection's name, the lead
// card lines up with step 3's heading, and the analyst moves 2 in so "Analyst decides" keeps the 16 margin)
const L = 104, HUB = [138, 58], BX = [56, 116, 176], DX = 252, G = { x: 292, y: 74, ts: 9, tg: 3 }, OUTT = [2, 5];
G.w = 8 * (G.ts + G.tg) - G.tg; G.h = 4 * (G.ts + G.tg) - G.tg;
const OUTC = [G.x + OUTT[1] * (G.ts + G.tg) + G.ts / 2, G.y + OUTT[0] * (G.ts + G.tg) + G.ts / 2];
const Q = { x: 238, y: 143, w: 162, h: 16 }, CARD = { x: 432, y: 76, w: 92, h: 56 }, AX = 586, R = 16, QS = 1.2;
// each step's picture: its reach in the desktop's units [left, right, top, bottom] (phones scale and stack them; on a
// phone step 2 reaches further right and lower, for its larger query strip)
// (step 2's bottom on a phone is its strip, not its transient notes, which may hang into the gap below; the gaps
// between the three steps then match)
const REACH = [[16, 216, 47, 166], [234, 404, 57, 179], [430, 622, 74, 158]];
const REACH_M = [REACH[0], [234, r1(Q.x + Q.w * QS + 1), 57, 173], REACH[2]];

const badge = (cls, cx, cy, ic, name, on) => `<g class="ag-b ${cls}"><rect class="ag-b-glow" x="${cx - 18}" y="${cy - 18}" width="36" height="36" rx="11" fill="none" stroke="${C.teal}" stroke-width="5" stroke-opacity=".22"/>` +
  `<rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" rx="7" fill="${C.node}" stroke="${on ? C.teal : C.dim}" stroke-width="1.4"/>` +
  `${icon(ic, r1(cx - 8.4), r1(cy - 8.4), 1.4, on ? C.teal : C.mute)}${T(cx, cy + 28, name, 10, on ? C.teal : C.mute, 'text-anchor="middle"')}</g>`;
const wire = x => `M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${x} ${L - 30} ${x} ${L - 14}`;

// the pictures, in the desktop's units. Detection stands on the side it leaves from: last on desktop, where it slides
// right into step 2, and first on a phone, where it leaves left for the spine
function picture(i, phone) {
  if (i === 0) {
    const [hx, rx, dx] = phone ? [BX[1], BX[2], BX[0]] : BX;
    let p = `<g class="ag-team">${[hx, rx, dx].map((x, k) => `<path class="ag-wire ag-arm${k}${k === 2 ? ' ag-wire-det' : ''}" d="${wire(x)}" pathLength="1" stroke="${C.dim}" fill="none"/>`).join('')}` +
      `<g class="ag-hub"><circle cx="${HUB[0]}" cy="${HUB[1]}" r="8" fill="${C.node}" stroke="${C.dim}" stroke-width="1.3"/><circle cx="${HUB[0]}" cy="${HUB[1]}" r="2.6" fill="${C.dim}"/></g>${T(HUB[0] + 13, HUB[1] + 3.3, 'Supervisor')}` +
      badge('ag-bh', hx, L, 'bulb', 'Hypothesis') +
      // Detection's place in step 1: a dotted outline once it has moved on (owner)
      `<rect class="ag-slot" x="${dx - 14}" y="${L - 14}" width="28" height="28" rx="7" fill="none" stroke="${C.dim}" stroke-dasharray="3.124 3.124"/>` +
      (phone ? `<g class="ag-det1">${badge('', dx, L, 'lens', 'Detection', true)}</g>` : '') + '</g>';
    p += `<g class="ag-rep"><rect x="16" y="${HUB[1] - 9}" width="104" height="18" rx="4" fill="${C.chip}" stroke="${C.rule}"/>${icon('doc', 21, HUB[1] - 6.6, 1.1, C.ink)}${T(37, HUB[1] + 3.3, 'Ransomware report', 9, C.body)}</g>` +
      `<path class="ag-rep-link" d="M120 ${HUB[1]} H${HUB[0] - 9}" stroke="${C.dim}" pathLength="1" fill="none"/>`;
    p += `<g class="ag-repb">${badge('ag-br', rx, L, 'pen', 'Reporting')}</g>`;
    p += `<g class="ag-hunch"><rect x="16" y="146" width="200" height="17" rx="8.5" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".55"/>` +
      `<text x="25" y="158" font-size="10" fill="${C.body}"><tspan font-weight="700" fill="${C.teal}">Hunch:</tspan> attackers hide in scheduled tasks</text>` +
      // (the same line again, only "scheduled tasks" painted, in teal: it shows while Detection types "schtasks", so the
      // query reads as the hunch put to work; opacity only, laid exactly over the words)
      `<text class="ag-hk" x="25" y="158" font-size="10" fill="${C.teal}" fill-opacity="0"><tspan font-weight="700">Hunch:</tspan> attackers hide in <tspan fill-opacity="1">scheduled tasks</tspan></text></g>` +
      `<path class="ag-hpath" d="M${hx} ${L - 14} C${hx} ${L - 30} ${HUB[0]} ${HUB[1] + 20} ${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${dx} ${L - 30} ${dx} ${L - 14}" pathLength="1" stroke="${C.teal}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    return p;
  }
  if (i === 1) {
    let p = T(G.x, G.y - 8, 'Event logs', 10, C.mute, 'class="ag-lg"');
    const TILE = `width="${G.ts}" height="${G.ts}" rx="2"`;
    p += `<g class="ag-logs">${Array.from({ length: 32 }, (_, k) => { const c = k % 8, r = (k / 8) | 0, out = r === OUTT[0] && c === OUTT[1];
      // (three rects a tile, grey, the flicker and the light, so only opacity ever animates; their size and colours are in the stylesheet)
      const dd = Math.max(Math.abs(r - OUTT[0]), Math.abs(c - OUTT[1]));   // (its distance from the unusual one: the dim closes in on it)
      return `<g class="ag-t" style="--c:${c};--d:${dd}" transform="translate(${G.x + c * (G.ts + G.tg)} ${G.y + r * (G.ts + G.tg)})"><rect ${TILE}/><rect class="ag-tm" ${TILE}/><rect class="ag-tl${out ? ' ag-tl-out' : ''}" ${TILE}/></g>`; }).join('')}</g>`;
    p += `<g class="ag-ring"><circle cx="${OUTC[0]}" cy="${OUTC[1]}" r="9" fill="none" stroke="${C.bg}" stroke-width="3.8"/><circle cx="${OUTC[0]}" cy="${OUTC[1]}" r="9" fill="none" stroke="${C.teal}" stroke-width="1.4"/></g>`;
    const cone = `M${DX + 12} ${L - 3} L${G.x - 3} ${G.y - 4} H${G.x + G.w + 3} V${G.y + G.h + 2.5} H${G.x - 3} Z`;
    // (the beam is light, not a slab: clear at Detection, brightest where it reaches the logs, fading past them)
    const bx0 = DX + 12, bx1 = G.x + G.w + 3, at = r1((G.x - 3 - bx0) / (bx1 - bx0));
    p += [0, 1].map(k => { const id = `ag-bm-${phone ? 'm' : 'd'}${k}`, col = k ? C.teal : C.mute, peak = k ? .16 : .13;
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${bx0}" y1="0" x2="${bx1}" y2="0"><stop offset="0" stop-color="${col}" stop-opacity="0"/>` +
        `<stop offset="${at}" stop-color="${col}" stop-opacity="${peak}"/><stop offset="1" stop-color="${col}" stop-opacity="${+(peak * .3).toFixed(3)}"/></linearGradient>` +
        `<path class="ag-beam ag-beam${k}" d="${cone}" fill="url(#${id})"/>` +
        `<rect class="ag-bar ag-bar${k}" x="${G.x - 3}" y="${G.y - 3}" width="3" height="${G.h + 5.5}" rx="1.5" fill="${col}" style="--w:${G.w + 3}px"/>`; }).join('');
    const cy = L + 28;   // (on one baseline with Detection's name)
    const ROLL = 15, cid = 'ag-cc-' + (phone ? 'm' : 'd');   // (the count rolls up through a window one row tall whose edges fade, so a passing row never shows a hard cut)
    p += T(G.x, cy, '0 found', 10.5, C.body, 'class="ag-n0" font-weight="700"') +   // (on its own, left with the grid)
      `<linearGradient id="${cid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".2" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="${cid}" maskUnits="userSpaceOnUse" x="${G.x - 2}" y="${cy - 11}" width="52" height="${ROLL}"><rect x="${G.x - 2}" y="${cy - 11}" width="52" height="${ROLL}" fill="url(#${cid}g)"/></mask>` +
      `<g mask="url(#${cid})"><g class="ag-odo" style="--roll:${-ROLL * CNT.length}px">` +
      [...CNT, 32].map((v, j) => T(G.x, cy + j * ROLL, v + ' found', 10.5, C.teal, 'class="ag-cnv" font-weight="700"')).join('') + '</g></g>' +
      T(G.x + 47.5, cy, '&#183; 1 unusual', 10.5, C.teal, 'class="ag-qw" font-weight="700"');
    const tx0 = Q.x + 15, base = Q.y + 11.3;
    // (a phone draws the query strip QS larger, from its top left corner, so the query reads at about 10px on an iPhone)
    p += (phone ? `<g transform="translate(${Q.x} ${Q.y}) scale(${QS}) translate(${-Q.x} ${-Q.y})">` : '<g>') + `<g class="ag-q"><rect x="${Q.x}" y="${Q.y}" width="${Q.w}" height="${Q.h}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>` +
      `<rect class="ag-qf" x="${Q.x}" y="${Q.y}" width="${Q.w}" height="${Q.h}" rx="4" fill="none" stroke="${C.teal}" stroke-width="1.2"/>`;
    QUERIES.forEach(([f, v], k) => { const len = r1((f.length + v.length + 5) * MONO);
      p += `<g class="ag-q${k}"><text x="${Q.x + 6}" y="${base}" font-size="10" font-weight="700" fill="${C.teal}">&#8250;</text>` +
        [[f, 0, C.body], ['=', f.length + 1, C.dim], [`"${v}"`, f.length + 3, C.teal]].map(([run, at, col]) =>
          `<text class="ag-qt" x="${r1(tx0 + at * MONO)}" y="${base}" font-size="9" fill="${col}" textLength="${r1(run.length * MONO)}" lengthAdjust="spacingAndGlyphs">${esc(run)}</text>`).join('') +
        (k === 0 ? `<path class="ag-qx" d="M${tx0 - 1} ${Q.y + Q.h / 2 + .5} H${r1(tx0 + len - 1.5)}" pathLength="1" stroke="${C.mute}" stroke-width="1.2"/>` : `<g class="ag-qok">${icon('tick', Q.x + Q.w - 17, Q.y + 2, 1, C.teal)}</g>`) +
        `<rect class="ag-qc" x="${tx0 - .5}" y="${Q.y + 1.5}" width="${r1(len + 2)}" height="${Q.h - 3}" fill="${C.chip}"/>` +
        `<rect class="ag-qk" x="${tx0}" y="${Q.y + 3}" width="1.2" height="${Q.h - 6}" fill="${C.teal}" style="--w:${len}px"/></g>`; });
    const ny = r1(175 + (phone ? Q.h * (QS - 1) : 0));
    p += '</g></g>' + T(Q.x, ny, 'empty doesn&#39;t mean safe', 11, C.ink, 'class="ag-gl ag-gl0" font-weight="600"') + T(Q.x, ny, 'query checked', 11, C.teal, 'class="ag-gl ag-gl1" font-weight="600"');
    if (phone) p += `<g class="ag-det" style="--dx:0px">${badge('ag-bd', DX, L, 'lens', 'Detection', true)}</g>`;
    return p;
  }
  const { x, y, w, h } = CARD;
  return `<g class="ag-card"><rect class="ag-cf" x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${C.chip}" stroke="${C.teal}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` +
    `<g class="ag-cc">${icon('flag', x + 8, y + 9, 1.2, C.teal)}<text x="${x + 26}" y="${y + 20}" font-size="10.5" font-weight="700" fill="${C.ink}">1 lead</text>` +
    `<g class="ag-cpen">${icon('pen', x + w - 21, y + 5, 1.35, C.teal)}</g>` +
    `${T(x + 10.5, y + 37, 'Scheduled Task', 10, C.body)}${T(x + 10.5, y + 49, 'T1053.005', 9, C.mute, 'letter-spacing=".02em"')}</g></g>` +
    `<g class="ag-trick">${T(x, y + h + 16, 'a known attacker trick', 10, C.body)}</g>` +
    `<path class="ag-he" d="M${x + w + 6} ${L} H${AX - R - 6}" stroke="${C.teal}" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" fill="none"/>` +
    `<rect class="ag-pk" x="${x + w + 1}" y="${L - 4}" width="11" height="8" rx="2" fill="${C.teal}" style="--dx:${AX - R - 6 - (x + w + 6)}px"/>` +
    `<g class="ag-ana"><circle cx="${AX}" cy="${L}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="1.5"/>${icon('ana', r1(AX - 13.7), r1(L - 13.7), 2.28, C.amb)}</g>` +
    `<circle class="ag-halo" cx="${AX}" cy="${L}" r="${R}" fill="none" stroke="${C.amb}" stroke-width=".9"/>${T(AX, CARD.y + CARD.h + 16, 'Analyst decides', 10, C.amb, 'class="ag-decides" text-anchor="middle" font-weight="600"')}`;
}
// the result's flight, from the unusual tile to the card's flag (map: desktop units to the drawing's)
const fly = map => { const [a, b] = [map(1, OUTC), map(2, [CARD.x + 9, L])], s1 = map(1, [1, 0])[0] - map(1, [0, 0])[0];
  return `<g class="ag-fly" style="--dx:${r1(b[0] - a[0])}px"><g class="ag-fly-y" style="--dy:${r1(b[1] - a[1])}px"><rect class="ag-fly-t" x="${r1(a[0] - 4.5 * s1)}" y="${r1(a[1] - 4.5 * s1)}" width="${r1(9 * s1)}" height="${r1(9 * s1)}" rx="${r1(2 * s1)}" fill="${C.teal}" stroke="${C.bg}" stroke-width="1.5" paint-order="stroke"/></g></g>`; };

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
  return h + `</g><path d="M16 ${line} H${w - 16}" stroke="${C.line}" shape-rendering="crispEdges"/>`;
}
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;

// desktop: three columns, the line running through them; the words sit 6 lower than they did (5 Nov 2026), so step 2's
// notes ("empty doesn't mean safe", "query checked") clear its heading by 16 and no longer read as part of it
const DH = 260;
function desktop() {
  const W = 640, s = [open('ag-scene', W, DH), header(W, 23, 11.5)];
  STEPS.forEach((st, i) => { const x = 16 + i * 208;
    s.push(`<g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${title(i, x, 200, 12.5)}${body(st.d, x, 219, 15.5, 10.3)}</g></g>`); });
  const stage = [0, 1, 2].map(i => `<g class="ag-p ag-p${i}">${picture(i, false)}</g>`).join('') +
    // the line: Detection's place to where it works, and on to step 3; at the end the supervisor's wire is redrawn to it
    `<path class="ag-ln ag-ln1" d="M${BX[2] + 15} ${L} H${DX - 15}" pathLength="1" stroke="${C.rule}" fill="none" shape-rendering="crispEdges"/><path class="ag-ln ag-ln2" d="M${G.x + G.w + 8} ${L} H${CARD.x - 1.5}" pathLength="1" stroke="${C.rule}" fill="none" shape-rendering="crispEdges"/>` +
    `<path class="ag-wire2" d="M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 30} ${DX} ${L - 40} ${DX} ${L - 14}" pathLength="1" stroke="${C.dim}" fill="none"/>` +
    `<g class="ag-det" style="--dx:${DX - BX[2]}px">${badge('ag-bd', BX[2], L, 'lens', 'Detection', true)}</g>` + fly((i, p) => p);
  return s.join('') + `<g class="ag-stage">${stage}</g></svg>`;
}
// phones: each step's picture drawn a little over desktop size and centred above its words, the whole drawing
// fitting one phone screen (owner, 1 Nov 2026, on an iPhone 16: "the whole animation is too long and cannot find the
// screen entirely"; it was 1.4x with roomy gaps, 360x868, taller than Safari's viewport)
// The steps hang off one spine down the left, their numbers nodes on it, each step's heading and words above its
// picture, the way a phone shows a sequence of steps (owner, 1 Nov 2026: "the connectivity between panels is not good
// on mobile, as compared to desktop"; blind design reviews read an earlier track, wrapped round the words on the right,
// as a half-drawn border, and a picture above its heading as part of the step before). What moves is the thing itself,
// as on desktop (owner, 2 Nov 2026: "do the last designer wish"): Detection, shrunk to fit the rail, leaves its place,
// runs down past step 2's number, which lights the step, and lands full size where it works; then the unusual result
// swells off its tile, runs along its row and through Detection (which pulses as it relays it), down past step 3's
// number, and the lead card grows from it. Each runs at a steady speed, so the line it leaves lit is exactly its tail,
// and moves by translation only (sampled along its path), so nothing turns at the corners. No path crosses the words;
// the rail through the numbers is faint from the first frame and lit where something has run.
const PS = 1.08, SP = 20, TX = 36, RR = 12, RJ = 6, CX = 192;   // (RJ: a branch where the rail carries on)
// a path built from moves that keeps a fine polyline of itself, for its length and for the points a traveller passes
const route = (x, y) => { let d = `M${r1(x)} ${r1(y)}`, len = 0; const pts = [[x, y, 0]];
  const add = (px, py) => { const [lx, ly] = pts[pts.length - 1]; len += Math.hypot(px - lx, py - ly); pts.push([px, py, len]); };
  const bez = (ps, n) => { for (let i = 1; i <= n; i++) { let q = ps.map(c => c.slice()); const u = i / n;
    while (q.length > 1) q = q.slice(1).map((c, j) => [q[j][0] + (c[0] - q[j][0]) * u, q[j][1] + (c[1] - q[j][1]) * u]); add(...q[0]); } };
  const o = {
    h(x2) { d += ` H${r1(x2)}`; add(x2, y); x = x2; return o; },
    v(y2) { d += ` V${r1(y2)}`; add(x, y2); y = y2; return o; },
    q(cx, cy, x2, y2) { d += ` Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`; bez([[x, y], [cx, cy], [x2, y2]], 16); x = x2; y = y2; return o; },
    s(x2, y2) { const m = (x + x2) / 2; d += ` C${r1(m)} ${r1(y)} ${r1(m)} ${r1(y2)} ${r1(x2)} ${r1(y2)}`; bez([[x, y], [m, y], [m, y2], [x2, y2]], 24); x = x2; y = y2; return o; },
    at(dist) { const k = Math.max(1, pts.findIndex(q => q[2] >= dist)), [ax, ay, al] = pts[k - 1], [bx, by, bl] = pts[k] || pts[k - 1], f = bl > al ? (dist - al) / (bl - al) : 0;
      return [ax + (bx - ax) * f, ay + (by - ay) * f]; },
    get d() { return d; }, get len() { return len; } }; return o; };
// a traveller's keyframes: it first takes its travelling size where it stands (the first HOLD of its run), then moves
// along its path at a steady speed by translation only (no rotation), its scale and visibility set by distance
const HOLD = .12;
const keys = (name, p, s0, scale, seen = () => 1, n = 64) => { const [x0, y0] = p.at(0);
  return `@keyframes ${name} { 0% { opacity: 1; transform: none; } ${Array.from({ length: n + 1 }, (_, i) => { const dist = p.len * i / n, [x, y] = p.at(dist);
    return ` ${+(100 * (HOLD + (1 - HOLD) * i / n)).toFixed(2)}% { opacity: ${seen(dist)}; transform: translate(${r1(x - x0)}px, ${r1(y - y0)}px) scale(${+(i ? scale(dist, p.len) : s0).toFixed(3)}); }`; }).join('')} }`; };
const node = (i, y) => `<circle class="ag-nd" cx="${SP}" cy="${y}" r="7.5" fill="${C.bg}" stroke="${i === 2 ? C.amb : C.teal}" stroke-opacity=".7"/>` +
  `<text x="${SP}" y="${r1(y + 3.6)}" font-size="10" font-weight="700" fill="${i === 2 ? C.amb : C.teal}" text-anchor="middle">${i + 1}</text>`;
function phone() {
  const W = 360, words = [], pics = [], at = [], nodes = []; let y = 60, H = 0;
  STEPS.forEach((st, i) => {
    const [x0, x1, y0, y1] = REACH_M[i], ty = r1(y + 18), by = r1(ty + 17), top = by + (st.m.length - 1) * 16 + 14;
    const px = r1(CX - PS * (x0 + x1) / 2), py = r1(top - PS * y0), bottom = top + PS * (y1 - y0);
    at[i] = [px, py]; nodes[i] = r1(ty - 4.6);
    words.push(`<circle cx="${SP}" cy="${nodes[i]}" r="7.5" fill="${C.bg}"/><g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${node(i, nodes[i])}<text x="${TX}" y="${ty}" font-size="13.5" font-weight="700" fill="${C.ink}">${STEPS[i].title}</text>${body(st.m, TX, by, 16, 12.5)}</g></g>`);
    pics.push(`<g class="ag-p ag-p${i}"><g transform="translate(${px} ${py}) scale(${PS})">${picture(i, true)}</g></g>`);
    y = r1(bottom + 12); H = r1(bottom + 14);
  });
  const map = (i, [u, v]) => [at[i][0] + PS * u, at[i][1] + PS * v], half = 14 * PS;
  const [d1, d2, out, logs, card] = [map(0, [BX[0], L]), map(1, [DX, L]), map(1, OUTC), map(1, [G.x - 3, 0]), map(2, [CARD.x + 5, L])];
  const [L1, L2, L3] = [d1[1], d2[1], card[1]];
  // the first dot: Detection's centre, out to the spine, down past step 2's number, in to Detection's new place
  const v1 = route(d1[0], L1).h(SP + RJ).q(SP, L1, SP, L1 + RJ), pass2 = v1.len + nodes[1] - (L1 + RJ);
  v1.v(L2 - RJ).q(SP, L2, SP + RJ, L2).h(d2[0]);
  // the second: the lit result, along its row and through Detection to the spine, down past step 3's number, to the card
  const v2 = route(out[0], out[1]).h(logs[0]).s(logs[0] - 16, L2), relay = v2.len + (logs[0] - 16 - d2[0]);
  v2.h(SP + RJ); const on2 = v2.len; v2.q(SP, L2, SP, L2 + RJ); const pass3 = v2.len + nodes[2] - (L2 + RJ);
  v2.v(L3 - RR).q(SP, L3, SP + RR, L3).h(card[0]);
  // what they leave lit: from Detection's edge, then the spine straight on through step 2's branch to the card
  const k1 = route(d1[0] - half, L1).h(SP + RJ).q(SP, L1, SP, L1 + RJ).v(L2 - RJ).q(SP, L2, SP + RJ, L2).h(d2[0]);
  const k2 = route(SP, L2 - RJ).v(L3 - RR).q(SP, L3, SP + RR, L3).h(card[0]);
  const stem = `<path class="ag-rail" d="M${SP} ${r1(nodes[0] + 7.5)} V${r1(nodes[2] - 7.5)}" stroke="${C.teal}" stroke-opacity=".15" shape-rendering="crispEdges"/>`;   // (the rail, through the numbers)
  const lit = [k1, k2].map((p, k) => `<path class="ag-tk ag-tk${k + 1}" d="${p.d}" pathLength="1" stroke="${C.teal}" fill="none"/>`).join('');
  // the travellers, Detection and the result, over the pictures and under the numbers: each starts exactly on what it
  // leaves, passes behind the numbers (Detection shrunk to a number's size) and lands exactly where what it becomes appears
  const b = 14 * PS, ts = G.ts * PS;
  const chip = `<g class="ag-tv ag-tv1"><rect x="${r1(d1[0] - b)}" y="${r1(L1 - b)}" width="${r1(2 * b)}" height="${r1(2 * b)}" rx="${r1(7 * PS)}" fill="${C.node}" stroke="${C.teal}" stroke-width="1.5"/>` +
    `${icon('lens', r1(d1[0] - 8.4 * PS), r1(L1 - 8.4 * PS), r1(1.4 * PS), C.teal)}</g>`;
  const cell = `<rect class="ag-tv ag-tv2" x="${r1(out[0] - ts / 2)}" y="${r1(out[1] - ts / 2)}" width="${r1(ts)}" height="${r1(ts)}" rx="${r1(2 * PS)}" fill="${C.teal}" stroke="${C.bg}" stroke-width="1.5" paint-order="stroke"/>`;
  // (Detection shrinks to .65 where it stands, travels so, is hidden while it passes behind step 2's number and grows back
  // over its last 44 units, eased, so it lands rather than pops; the result swells to 1.35 where it stands, the lift
  // before it goes)
  const GROW = 44;
  const kf = keys('ag-tv1', v1, .65, (dd, l) => { const u = Math.max(0, 1 - (l - dd) / GROW); return .65 + .35 * u * u * (3 - 2 * u); }, dd => Math.abs(dd - pass2) < 12 ? 0 : 1) + '\n' +
    keys('ag-tv2', v2, 1.35, () => 1.35);
  return { svg: open('ag-scene ag-scene--m', W, H) + header(W, 23, 12.5, true) + stem + `<g class="ag-stage">${lit}</g><g class="ag-stage">${pics.join('')}${cell}${chip}</g>` + words.join('') + '</svg>', H, kf,
    // (each run's length, and as fractions of it: where its line starts, the number it passes, Detection's relay)
    run: [v1.len, v2.len], lead: [half / v1.len, on2 / v2.len], pass: [pass2 / v1.len, pass3 / v2.len], relay: relay / v2.len };
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// [start, duration] in seconds; LEAD holds the opened card still for a beat first ("slightly longer delay before it
// starts"), on every replay too. Each reading moment holds about 2 s (owner: "barely on screen for 0.5s").
const LEAD = 0.5;
// A review (5 Nov 2026, owner: "review web - th animation for enhancements", then "edit and push"; real-time recordings
// read by a blind motion designer and a blind first-time viewer) moved four beats: the struck query holds half a second
// before it is erased, and "query checked" holds about 2 s (everything from the erase on is .45 s later); Reporting
// comes forward as the lead card arrives and glows as its pen marks it, not half a second before there is a card; and
// on both layouts the team relights (and on desktop the supervisor's wire is redrawn and the dotted outline goes) a
// second after "Analyst decides", so nothing competes with the analyst. The report now stands by the supervisor from
// the first frame, faint, and brightens as the lead-in ends, so a replay never opens on an empty card.
// A second review the same day (owner: "spare no effort, i really want to impress"; a motion director, a benchmark
// of professional explainers, a VP of Product and a technical audit, README "Agentic AI glance chart") pulled step 1's
// arrivals into the first .8 s, put "Analyst decides" with the halo and the relight a second after it, and moved
// Detection's slide .05 later so it takes the hunch, breathes back and goes.
const t = {
  rep: [0, .4], replink: [.3, .25], hub: [.42, .3], bh: [.62, .3], br: [.7, .3], bd: [.78, .3], wire0: [.45, .3], wire1: [.53, .3], wire2d: [.61, .3],
  hyp: [.85, 1.45], hunch: [.95, .4], hpath: [2.1, .8], hunchgo: [2.75, .3], detglow: [2.8, 4.95], det: [3.0, .6], ln1: [3.0, .6], w1: [3.0, .5], back: [3.15, .3],
  lg: [3.45, .35], logs: [3.5, .4], q: [3.55, .25], q0: [3.7, .6], hk: [3.9, 2.0], k0: [4.35, .1], s0: [4.4, .8], n0: [5.35, .4], gl0: [5.4, 2.4], qx: [6.3, .2], erase: [7.0, .35],
  q1: [7.4, .6], k1: [8.05, .1], ok: [8.05, .3], gl1: [8.1, 2.2], s1: [8.75, .6], cnt: [8.95, .07], dim: [9.55, .3], ring: [9.88, .45], qw: [10.1, .3],
  ln2: [10.8, .3], fly: [10.7, .5], lit: [2.85, .3], w2: [10.8, .45], fwd: [11.4, .4], card: [11.4, .5], cpen: [11.7, .35], trick: [11.8, .3],
  he: [11.95, .35], pk: [12.1, .55], ana: [12.65, .5], halo: [12.75, .85], decides: [13.3, .35], all: [14.3, .5], wire2: [14.3, .5], slotout: [14.55, .25],
};
const LATE = 10.75;   // (where step 3 starts: on a phone, everything from here waits for the second run as well)
// phones: the two dots' runs (about 370 and 450 units, too far for the desktop's half-second moves), at one steady
// speed; everything after the first arrival waits SH1 longer on a phone, everything after the second SH2 (they add up)
const PH = phone(), dur = len => +(Math.min(1.2, Math.max(1, len / 380)) / (1 - HOLD)).toFixed(2), tAt = (tv, f) => +(tv[0] + (HOLD + (1 - HOLD) * f) * tv[1]).toFixed(3);
const TV1 = [t.det[0], dur(PH.run[0])], TV2 = [t.fly[0] + .1, dur(PH.run[1])];
const SH1 = +(TV1[0] + TV1[1] + .1 - (t.det[0] + t.det[1])).toFixed(2), SH2 = +(TV2[0] + TV2[1] - .02 - t.card[0]).toFixed(2);
const tier = s => s >= LATE ? 2 : s >= 3.4 ? 1 : 0;
const RECV = [t.lit[0], t.s0[0] - .05, t.s1[0] - .05];
const RUN = 'cubic-bezier(.37,0,.63,1)', OUTEZ = 'cubic-bezier(.4,0,.2,1)', EZ = 'cubic-bezier(.22,1,.36,1)', IO = 'cubic-bezier(.45,0,.25,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)', STEPS8 = 'steps(8, jump-none)';
const STEPSQ = QUERIES.map(([f, v]) => `steps(${f.length + v.length + 5}, jump-none)`);   // (one step per character)
const d = v => +(LEAD + v).toFixed(3);
const sh = k => ['', ' + var(--ag-sh1)', ' + var(--ag-sh1) + var(--ag-sh2)'][k];
const when = (s, k = tier(s)) => k ? `calc(${d(s)}s${sh(k)})` : `${d(s)}s`;
const an = ([s, l], name, ez = IO, fill = 'both', k) => `${name} ${l}s ${ez} ${when(s, k)} ${fill}`;
const P = '.is-playing svg.ag-scene', PM = '.is-playing svg.ag-scene--m', S = 'svg.ag-scene';
const ends = Object.values(t).map(([s, l]) => d(s + l));
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / ${DH}; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / ${PH.H}; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
${S} text { font-family: "Figtree", "Source Sans Pro", "Source Sans Fallback", Helvetica, sans-serif; }
${S} text.ag-qt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; }
${S} .ag-i { fill: none; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
${S} .ag-logo path { fill: ${C.ink}; }
${S} :is(.ag-b, .ag-cf, .ag-ana, .ag-hub, .ag-det, .ag-rep, .ag-hunch, .ag-n0, .ag-t, .ag-ring, .ag-fly-t, .ag-halo, .ag-slot, .ag-qok, .ag-cpen) { transform-box: fill-box; transform-origin: center; }
${S} .ag-cf { transform-origin: ${(900 / CARD.w).toFixed(1)}% 50%; }   /* (it unfolds from where the result lands on its edge) */
${S} .ag-cpen { transform-origin: 10% 90%; }   /* (the pen turns on its nib) */
svg.ag-scene:not(.ag-scene--m) .ag-hunch { transform-origin: 20% 0; }   /* (the hunch drops out of Hypothesis, not the middle of the row) */
svg.ag-scene--m .ag-hunch { transform-origin: 50% 0; }
${S} .ag-qc { transform-box: fill-box; transform-origin: 100% 50%; }
${S} :is(.ag-wire, .ag-wire2, .ag-ln, .ag-rep-link, .ag-qx) { stroke-dasharray: 1 2; }   /* (drawn: the dash covers the path; undrawn, it sits before the start) */
${S} .ag-hpath { stroke-dasharray: .12 2; stroke-opacity: 0; }
${S} { --ag-sh1: 0s; --ag-sh2: 0s; }
svg.ag-scene--m { --ag-sh1: ${SH1}s; --ag-sh2: ${SH2}s; }   /* (a phone's two longer runs: everything after each arrival waits for it) */
${S} .ag-tk { stroke-dasharray: 1 2; stroke-opacity: .5; stroke-width: 1.5; }
${S} .ag-tv { opacity: 0; transform-box: fill-box; transform-origin: center; }   /* (the travellers: hidden but while they run) */
${S} .ag-det { transform: translateX(var(--dx)); }
${S} .ag-odo { transform: translateY(var(--roll)); }
${S} .ag-cnv { font-variant-numeric: tabular-nums; }
${S} .ag-rep { opacity: .85; }
${S} .ag-hunch { opacity: .75; }
${S} .ag-logs rect { width: ${G.ts}px; height: ${G.ts}px; rx: 2px; fill: ${C.dim}; fill-opacity: .55; }
${S} .ag-logs .ag-tm { fill: ${C.mute}; fill-opacity: .3; opacity: 0; }   /* (the empty sweep only glances: nothing it passes should look found) */
${S} .ag-logs .ag-tl { fill: ${C.teal}; fill-opacity: .9; opacity: .35; }   /* (the 32 found stay faintly lit, so the one unusual reads as one of 32) */
${S} .ag-logs .ag-tl-out { fill-opacity: 1; opacity: 1; }
/* the final frame: the supervisor's wire to where Detection works, no dotted outline (a phone keeps it, with Detection
   faint in it, since its two places are on separate steps) */
${S}:not(.ag-scene--m) :is(.ag-slot, .ag-wire-det, .ag-ln1) { opacity: 0; }
svg.ag-scene--m .ag-det1 { opacity: .28; }
svg.ag-scene--m > rect:first-child { stroke-opacity: 0; }   /* (the card's frame bounds it; with the rail, a second outline read as a double border) */
svg.ag-scene--m .ag-cf { transform-origin: 0% 50%; }   /* (it arrives from where the dot lands, its left edge) */
svg.ag-scene--m .ag-nd { transform-box: fill-box; transform-origin: center; }
/* transient marks: hidden in the final frame */
${S} :is(.ag-b-glow, .ag-n0, .ag-cn, .ag-gl, .ag-beam, .ag-bar, .ag-halo, .ag-fly, .ag-q0, .ag-pk, .ag-hk, .ag-qf) { opacity: 0; }
${S} .ag-q1 .ag-qc { transform: scaleX(0); }   /* (the final frame shows the second query typed out: the cover wiped away, the caret gone) */
${S} .ag-q1 .ag-qk { opacity: 0; }
/* the replay: the drawing fades and starts over while the card, its header and its words stay */
.internship-demo-card.is-fading .internship-demo-card__plot > svg.ag-scene { opacity: 1; }
.internship-demo-card.is-fading ${S} .ag-stage { opacity: 0; transition: opacity 240ms ease; }
.internship-demo-card.is-fading ${S} :is(.ag-sw1, .ag-sw2) { opacity: .22; transition: opacity 240ms ease; }
@keyframes ag-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-pop { from { opacity: 0; transform: scale(.88); } }
@keyframes ag-draw { from { stroke-dashoffset: 1.05; } }
@keyframes ag-wake { from { opacity: .22; } }
@keyframes ag-ready { from { opacity: .4; transform: translateX(-4px); } to { opacity: .85; transform: none; } }
@keyframes ag-bump { 50% { transform: scale(1.25); } }
@keyframes ag-glow { 0%, 100% { opacity: 0; } 12%, 88% { opacity: 1; } }
@keyframes ag-hunch { from { opacity: 0; transform: translateY(-8px) scale(.9); } to { opacity: 1; transform: none; } }
@keyframes ag-hunchgo { from { opacity: 1; } to { opacity: .75; } }
@keyframes ag-pulse { 0% { stroke-dashoffset: .12; stroke-opacity: 0; } 12% { stroke-opacity: 1; } 88% { stroke-dashoffset: -.88; stroke-opacity: 1; } 100% { stroke-dashoffset: -.88; stroke-opacity: 0; } }
@keyframes ag-slide { 0% { transform: none; } 15% { transform: translateX(-3px); } 100% { transform: translateX(var(--dx)); } }   /* (a breath back before it goes) */
@keyframes ag-recv { 40% { transform: scale(1.08); } }
@keyframes ag-flash { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ag-on { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-dimto { from { opacity: 1; } to { opacity: .35; } }
@keyframes ag-write { from { opacity: 0; transform: translate(-4px, 4px) rotate(-14deg); } 60% { opacity: 1; transform: translate(1px, -1px) rotate(4deg); } to { opacity: 1; transform: none; } }
@keyframes ag-back { from { opacity: 1; } to { opacity: .4; } }
@keyframes ag-fwd { from { opacity: .4; } to { opacity: 1; } }
@keyframes ag-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-keep { from, to { opacity: 1; } }
@keyframes ag-roll { ${CNT.map((_, k) => `${k * 20}% { transform: translateY(${-k * 15}px); } ${k * 20 + 9}% { transform: translateY(${-k * 15}px); animation-timing-function: ${OUTEZ}; }`).join(' ')} 100% { transform: translateY(${-CNT.length * 15}px); } }   /* (each number holds, then the next rolls in) */
@keyframes ag-hide { from { opacity: 1; } to { opacity: 0; } }
@keyframes ag-ghost { from { opacity: 1; } to { opacity: .28; } }
@keyframes ag-wipe { from { opacity: 1; transform: scaleX(1); } to { opacity: 1; transform: scaleX(0); } }
@keyframes ag-unwipe { from { opacity: 1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
@keyframes ag-caret { to { transform: translateX(var(--w)); } }
@keyframes ag-caretback { from { transform: translateX(var(--w)); } to { transform: none; } }
@keyframes ag-shake { 0% { opacity: 0; transform: scale(1.15); } 35% { opacity: 1; transform: none; animation-timing-function: ${IO}; } 50% { transform: translateX(-2px); animation-timing-function: ${IO}; } 65% { transform: translateX(2px); animation-timing-function: ${IO}; } 80% { transform: translateX(-1px); animation-timing-function: ${IO}; } 100% { opacity: 1; transform: none; } }
@keyframes ag-glint { 0%, 100% { opacity: 0; } 15%, 75% { opacity: 1; } }
@keyframes ag-hold { 0% { opacity: 0; transform: translateY(4px); } 10%, 90% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes ag-say { from { opacity: 0; transform: translateY(4px); } }
@keyframes ag-beam { 0% { opacity: 0; } 15%, 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ag-bar { 0% { opacity: 0; transform: none; } 10%, 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--w)); } }
@keyframes ag-miss { 0%, 100% { opacity: 0; } 30% { opacity: 1; } }
@keyframes ag-light { from { opacity: 0; } }
@keyframes ag-lit-s { from { stroke: ${C.dim}; } }
@keyframes ag-lit-i { from { stroke: ${C.mute}; } }
@keyframes ag-lit-t { from { fill: ${C.mute}; } }
@keyframes ag-ring { from { opacity: 0; transform: scale(.4); } 35% { opacity: 1; } to { opacity: 1; transform: none; } }   /* (one overshoot: the spring runs the whole way) */
@keyframes ag-flyx { to { transform: translateX(var(--dx)); } }
@keyframes ag-flyy { to { transform: translateY(var(--dy)); } }
/* (the result appears exactly over the lit tile first, then lifts; fading in while lifting made it start above the tile) */
@keyframes ag-flyt { 0% { opacity: 0; transform: none; } 1% { opacity: 1; transform: none; } 12% { opacity: 1; transform: scale(1.35); } 30% { transform: scale(1.35); } 100% { opacity: 1; transform: none; } }   /* (it swells where it lies, as on phones, and rides the line) */
@keyframes ag-unfold { from { opacity: 0; transform: scale(.1); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes ag-spring { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
@keyframes ag-halo { 0% { opacity: .85; transform: scale(1); } 30% { opacity: .3; } 100% { opacity: 0; transform: scale(2.1); } }
${PH.kf}   /* (each held at its end until what it becomes has arrived over it) */
@keyframes ag-trace { from { stroke-dashoffset: 1; } }   /* (a line drawn exactly behind its dot) */
@keyframes ag-arrive { from { opacity: 0; transform: scale(.92); } }
@keyframes ag-cardgrow { 0% { opacity: 0; transform: scale(.12); } 1% { opacity: 1; transform: scale(.12); } }   /* (hidden until the dot lands) */
@keyframes ag-relay { 50% { transform: scale(1.15); } }
@keyframes ag-nd { 50% { transform: scale(1.35); stroke-opacity: 1; } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 12%, 88% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
/* step 1: the report reaches the supervisor, the badges fan out, the hunch is carried to Detection, which moves on */
${P} .ag-stage { animation: ag-fade .25s ${OUTEZ} 0s none; }   /* (on every start, so a replay fades back in) */
${P} .ag-rep { animation: ${an(t.rep, 'ag-ready', EZ)}; }   /* (faint by the supervisor from the first frame, then sent) */
${P} .ag-rep-link { animation: ${an(t.replink, 'ag-draw')}; }
${P} .ag-hub { animation: ${an(t.hub, 'ag-bump', SPRING, 'none')}; }
${P} .ag-arm0 { animation: ${an(t.wire0, 'ag-draw')}; }
${P} .ag-arm1 { animation: ${an(t.wire1, 'ag-draw')}; }   /* (each branch draws into its badge as that badge pops) */
${P} .ag-bh { animation: ${an(t.bh, 'ag-pop', EZ)}; }
${P} .ag-br { animation: ${an(t.br, 'ag-pop', EZ)}; }
${P} .ag-bd { animation: ${an(t.bd, 'ag-pop', EZ)}, ${RECV.map(s => an([s, .3], 'ag-recv', OUTEZ, 'none')).join(', ')}; }   /* (it takes the hunch, then sends each search, with a small press) */
${P} .ag-bh .ag-b-glow { animation: ${an(t.hyp, 'ag-glow', 'linear', 'none')}; }
${P} .ag-hunch { animation: ${an(t.hunch, 'ag-hunch', EZ)}, ${an(t.hunchgo, 'ag-hunchgo', OUTEZ, 'forwards')}; }
${P} .ag-hk { animation: ${an(t.hk, 'ag-glint', OUTEZ, 'none')}; }   /* ("scheduled tasks" lights in the hunch while "schtasks" is typed) */
${P} .ag-hpath { animation: ${an(t.hpath, 'ag-pulse', 'linear', 'none')}; }   /* (the hunch carried along the wires: up to the supervisor, down to Detection) */
${P} .ag-det { animation: ${an(t.det, 'ag-slide', IO)}; }   /* (straight along the line, as in the redesign) */
/* Detection is neutral until the hunch lands on it, then lights (cause before effect; a blind continuity review) */
${P} :is(.ag-bd, .ag-det1 .ag-b) > rect:not(.ag-b-glow) { animation: ${an(t.lit, 'ag-lit-s', OUTEZ)}; }
${P} :is(.ag-bd, .ag-det1 .ag-b) .ag-i { animation: ${an(t.lit, 'ag-lit-i', OUTEZ)}; }
${P} :is(.ag-bd, .ag-det1 .ag-b) text { animation: ${an(t.lit, 'ag-lit-t', OUTEZ)}; }
${P} .ag-bd .ag-b-glow { animation: ${an(t.detglow, 'ag-glow', 'linear', 'none')}; }
/* (on desktop these three are gone from the final frame, so they are held on while it plays, then go together) */
${P} .ag-slot { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an([t.det[0] + .2, .3], 'ag-pop', EZ)}, ${an(t.slotout, 'ag-hide', OUTEZ, 'forwards')}; }
${P} .ag-wire-det { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an(t.wire2d, 'ag-draw')}, ${an(t.slotout, 'ag-hide', OUTEZ, 'forwards')}; }
${P} .ag-ln1 { animation: ${an([0, t.slotout[0]], 'ag-keep', 'linear')}, ${an(t.ln1, 'ag-draw')}, ${an(t.slotout, 'ag-hide', OUTEZ, 'forwards')}; }
${P} .ag-wire2 { animation: ${an(t.wire2, 'ag-draw', EZ)}; }
${P} .ag-s1 { animation: ${an(t.w1, 'ag-wake', EZ)}; }
/* the team steps back while Detection works, Reporting comes forward to write the lead, all forward at the end */
${P} .ag-team { animation: ${an(t.back, 'ag-back', OUTEZ, 'forwards')}, ${an(t.all, 'ag-fwd', OUTEZ, 'forwards')}; }
${P} .ag-repb { animation: ${an(t.back, 'ag-back', OUTEZ, 'forwards')}, ${an(t.fwd, 'ag-fwd', OUTEZ, 'forwards')}; }
${P} .ag-br .ag-b-glow { animation: ${an([t.cpen[0] - .1, 1.1], 'ag-glow', 'linear', 'none')}; }   /* (as its pen marks the card) */
/* step 2: the logs; a query, a sweep that finds nothing; struck, backspaced, retyped, checked; a sweep that finds 32, one unusual */
${P} .ag-lg { animation: ${an(t.lg, 'ag-fade')}; }
${P} .ag-q { animation: ${an(t.q, 'ag-fade')}; }
${P} .ag-q0 { animation: ${an([t.q[0], .01], 'ag-show', 'linear')}, ${an([t.q1[0] - .05, .1], 'ag-hide', 'linear', 'forwards')}; }
/* (jump-none: the last step lands before the end, since a plain steps() held forwards can stop a step short) */
${P} .ag-q0 .ag-qc { animation: ${an(t.q0, 'ag-wipe', STEPSQ[0])}, ${an(t.erase, 'ag-unwipe', STEPSQ[0], 'forwards')}; }
${P} .ag-q0 .ag-qk { animation: ${an(t.q0, 'ag-caret', STEPSQ[0])}, ${an(t.k0, 'ag-hide', 'linear', 'forwards')}, ${an([t.erase[0], .02], 'ag-show', 'linear', 'forwards')}, ${an(t.erase, 'ag-caretback', STEPSQ[0], 'forwards')}; }
${P} .ag-qx { animation: ${an(t.qx, 'ag-draw', EZ)}; }
${P} .ag-q1 { animation: ${an([t.q1[0], .05], 'ag-show', 'linear')}; }
${P} .ag-q1 .ag-qc { animation: ${an(t.q1, 'ag-wipe', STEPSQ[1])}; }
${P} .ag-q1 .ag-qk { animation: ${an([t.q1[0], t.k1[0] - t.q1[0]], 'ag-keep', 'linear')}, ${an(t.q1, 'ag-caret', STEPSQ[1])}, ${an(t.k1, 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-qok { animation: ${an(t.ok, 'ag-pop', EZ)}; }
${P} .ag-beam0 { animation: ${an(t.s0, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar0 { animation: ${an([t.s0[0] + .05, .7], 'ag-bar', 'linear', 'none')}; }
${P} .ag-t { animation: ag-fade .3s ${EZ} calc(${d(t.logs[0])}s + var(--c) * .03s + var(--ag-sh1)) both; }   /* (the logs cascade in by column) */
${P} .ag-tm { animation: ag-miss .4s ${OUTEZ} calc(${d(t.s0[0] + .1)}s + var(--c) * .08s + var(--ag-sh1)) none; }   /* (the first sweep: each flickers grey and settles) */
${P} .ag-tl:not(.ag-tl-out) { animation: ag-on .3s ${EZ} calc(${d(t.s1[0] + .1)}s + var(--c) * .07s + var(--ag-sh1)) both, ag-dimto ${t.dim[1]}s ${OUTEZ} calc(${d(t.dim[0])}s + (5 - var(--d)) * .06s + var(--ag-sh1)) forwards; }   /* (the second: each lights with the sweep, then they dim from the far edge inward, closing on the unusual one) */
${P} .ag-tl-out { animation: ag-light .3s ${EZ} calc(${d(t.s1[0] + .1)}s + var(--c) * .07s + var(--ag-sh1)) both; }
${P} .ag-n0 { animation: ${an(t.n0, 'ag-shake', EZ)}, ${an([t.erase[0], .15], 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-gl0 { animation: ${an(t.gl0, 'ag-hold', 'linear', 'none')}; }
${P} .ag-gl1 { animation: ${an(t.gl1, 'ag-hold', 'linear', 'none')}; }
${P} .ag-beam1 { animation: ${an(t.s1, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar1 { animation: ${an([t.s1[0] + .05, .55], 'ag-bar', 'linear', 'none')}; }
${P} .ag-odo { animation: ${an([t.cnt[0], .12], 'ag-show', EZ)}, ${an([t.cnt[0], .55], 'ag-roll', 'linear')}; }   /* (hidden until the second sweep, then rolls 4, 9, 15, 22, 28, 32 with the columns lighting and settles) */
${P} .ag-ring { animation: ${an(t.ring, 'ag-ring', SPRING)}; }
${P} .ag-qf { animation: ${an([t.s0[0] - .05, .35], 'ag-flash', OUTEZ, 'none')}, ${an([t.s1[0] - .05, .35], 'ag-flash', OUTEZ, 'none')}; }
${P} .ag-qw { animation: ${an(t.qw, 'ag-say', EZ)}; }
/* step 3: the result travels along the line and unfolds into the lead; Reporting's pen marks it; the hand-off */
${P} .ag-ln2 { animation: ${an(t.ln2, 'ag-draw')}; }
${P} .ag-fly { animation: ${an([t.fly[0] + .2, t.fly[1]], 'ag-flyx', IO)}; opacity: 1; }
${P} .ag-fly-y { animation: ${an([t.fly[0] + .2, t.fly[1]], 'ag-flyy', EZ)}; }
${P} .ag-fly-t { animation: ${an([t.fly[0], t.fly[1] + .2], 'ag-flyt', IO)}, ${an([t.card[0] + .05, .1], 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-s2 { animation: ${an(t.w2, 'ag-wake', EZ)}; }
${P} .ag-cf { animation: ${an(t.card, 'ag-unfold', EZ)}; }
${P} .ag-cc { animation: ${an([t.card[0] + .3, .25], 'ag-fade', EZ)}; }   /* (its words fade in once the frame is mostly open: text is never scaled) */
${P} .ag-cpen { animation: ${an([t.cpen[0], .45], 'ag-write', EZ)}; }   /* (the pen writes its mark) */
${P} .ag-trick { animation: ${an(t.trick, 'ag-say', EZ)}; }
${P} .ag-he { animation: ${an(t.he, 'ag-fade')}; }
${P} .ag-pk { animation: ${an(t.pk, 'ag-pk', IO, 'none')}; }
${P} .ag-ana { animation: ${an(t.ana, 'ag-spring', SPRING)}; }
${P} .ag-halo { animation: ${an(t.halo, 'ag-halo', EZ, 'none')}; }
${P} .ag-decides { animation: ${an(t.decides, 'ag-say', EZ)}; }   /* (once the halo has run, so it never crosses it) */
/* phones: Detection's two places are on separate steps, so a dot leaves its place in step 1, passes step 2's number,
   which lights the step, and Detection arrives where it lands; the result's dot relays through Detection, passes step
   3's number and the lead card arrives where it lands. Linear, so each line is drawn exactly behind its dot. */
${PM} .ag-tk1 { animation: ${an([tAt(TV1, PH.lead[0]), +((1 - HOLD) * (1 - PH.lead[0]) * TV1[1]).toFixed(3)], 'ag-trace', 'linear', 'both', 0)}; }
${PM} .ag-tv1 { animation: ${an(TV1, 'ag-tv1', 'linear', 'forwards', 0)}, ${an([TV1[0] + TV1[1] + .05, .12], 'ag-hide', 'linear', 'forwards', 0)}; }
${PM} .ag-s1 { animation: ${an([tAt(TV1, PH.pass[0]) - .05, .45], 'ag-wake', EZ, 'both', 0)}; }
${PM} .ag-s1 .ag-nd { animation: ${an([tAt(TV1, PH.pass[0]) - .1, .35], 'ag-nd', IO, 'none', 0)}; }
${PM} .ag-det { animation: ${an([TV1[0] + TV1[1] - .04, .1], 'ag-fade', 'linear', 'both', 0)}; }   /* (under the chip, now its exact size and place) */
${PM} .ag-tk2 { animation: ${an([tAt(TV2, PH.lead[1]), +((1 - HOLD) * (1 - PH.lead[1]) * TV2[1]).toFixed(3)], 'ag-trace', 'linear', 'both', 1)}; }
${PM} .ag-tv2 { animation: ${an(TV2, 'ag-tv2', 'linear', 'forwards', 1)}, ${an([TV2[0] + TV2[1] + .02, .08], 'ag-hide', 'linear', 'forwards', 1)}; }
${PM} .ag-det .ag-bd { animation: ${RECV.slice(1).map(s => an([s, .3], 'ag-recv', OUTEZ, 'none')).join(', ')}, ${an([tAt(TV2, PH.relay) - .12, .3], 'ag-relay', IO, 'none', 1)}; }
${PM} .ag-det .ag-bd .ag-b-glow { animation: ${an([TV1[0] + TV1[1] + .05, +(t.detglow[0] + t.detglow[1] + SH1 - TV1[0] - TV1[1] - .05).toFixed(2)], 'ag-glow', 'linear', 'none', 0)},   /* (its glow comes up once it has landed) */ ${an([tAt(TV2, PH.relay) - .15, .45], 'ag-glow', 'linear', 'none', 1)}; }   /* (it visibly relays the result) */
${PM} .ag-s2 { animation: ${an([tAt(TV2, PH.pass[1]) - .05, .45], 'ag-wake', EZ, 'both', 1)}; }
${PM} .ag-s2 .ag-nd { animation: ${an([tAt(TV2, PH.pass[1]) - .1, .35], 'ag-nd', IO, 'none', 1)}; }
${PM} .ag-cf { animation-name: ag-cardgrow; animation-duration: .35s; }   /* (out of the dot, from the card's left edge) */
/* Reporting is a screen away from the lead on a phone, so it steps forward with the team at the end rather than
   flashing while the eye follows the dot down (blind reads, twice); the pen on the card is its mark */
${PM} .ag-repb { animation: ${an(t.back, 'ag-back', OUTEZ, 'forwards')}, ${an(t.all, 'ag-fwd', OUTEZ, 'forwards')}; }
${PM} .ag-team { animation: ${an(t.back, 'ag-back', OUTEZ, 'forwards')}, ${an(t.all, 'ag-fwd', OUTEZ, 'forwards')}; }
${PM} .ag-br .ag-b-glow { animation: none; }
${PM} .ag-det1 { animation: ${an([t.det[0], .15], 'ag-ghost', OUTEZ)}; }
${PM} .ag-det1 .ag-b { animation: ${an(t.bd, 'ag-pop', EZ)}, ${an([t.lit[0], .3], 'ag-recv', OUTEZ, 'none')}; }   /* (it pops in with the other two badges; it had no entrance and sat there from the first frame) */
${PM} .ag-slot { animation: ${an([t.det[0] + .2, .3], 'ag-pop', EZ)}; }
${PM} .ag-wire-det { animation: ${an(t.wire2d, 'ag-draw')}; }
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), PH.svg);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', PH.svg.length, '(phone 360x' + PH.H + ')', 'scene.css', css.length, 'ends ~', Math.max(...ends).toFixed(1) + 's', 'phone ~', (Math.max(...ends) + SH1 + SH2).toFixed(1) + 's');
