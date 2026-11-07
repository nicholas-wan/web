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
// through, backspaced and retyped, then checked ("fields and syntax checked"); the beam sweeps again, 32 light, all but
// one dim again ("32 found · 1 unusual"). Step 3: Reporting readies, that one lifts off the logs and grows into the lead
// card along the line as Reporting's pen and the card's write it, a packet runs the dashed line to the analyst, who
// lights amber ("Analyst decides"), and the team relights with it. As Detection moves, the supervisor's wire follows it
// to where it works. Base styles are the final frame (reduced motion holds it); motion only under .is-playing; the
// replay rewinds what the run made. Teal for the machine, amber for the human alone; the product's name never
// appears; no SIEM's syntax; the aria-label starts "An illustrative hunt." (the verifier and the spec pin it).
// Desktop 640x266, the steps as columns; phones 360 wide, the steps stacked on a spine of numbers down the left, each
// step's words above its picture (drawn 1.08x), Detection and the result moving between them over the words.
// A polish pass (1 Nov 2026, owner: "suggest optimizations or polish. refer to professional websites and animations",
// then "Yes, ship all six"; proposed on lab/hunt-polish, reviewed by an independent visual review and a blind motion
// read): entrances ease out and the overshoot spring is kept for the two payoffs (the ring, the analyst); entrances
// start near their final size (.88, not .6); exits are shorter than entrances (.25 to .3 s on a standard ease: a first
// cut on Material's accelerate curve read as a hard cut); the queries type one character a step; the count rolls
// in place, each number replacing the last (.ag-odo; it rolled through a masked window until 5 Nov 2026); and each log tile is three rects
// (grey, the flicker, the light) so only opacity ever animates, the tiles cascading in by column. No fill keyframes
// remain. The story, its timing, words, colours and final frame are unchanged.
const fs = require('fs'); const path = require('path');
const OUT = __dirname;

// (7 Nov 2026 polish: the surface is the Work article's own #071315, so a phone shows no second box inside it; one
// surface for nodes and chips; every connector in one colour, dim; the header's rule the pills' border colour, round 2)
const C = { bg: '#071315', rule: '#24464b', node: '#0b1b1e', chip: '#0b1b1e', ink: '#d8e6e4', body: '#b4c6c4', mute: '#8ba7a6', dim: '#4f6f6e',
  teal: '#28d7c5', amb: '#ffb869' };
// one stroke for structure, one for emphasis and icons
const SW = 1, SE = 1.5;
const ICON = {
  bulb: '<path d="M6 1.4a3.6 3.6 0 0 0-2.1 6.5V9.4h4.2V7.9A3.6 3.6 0 0 0 6 1.4z"/><path d="M4.4 11h3.2"/>',
  pen: '<path d="M2 10.2l.9-2.9L8.4 1.8l2 2-5.5 5.5z"/><path d="M7.3 2.9l2 2"/>',
  // (7 Nov 2026, round 2: the lens and the analyst sat .4 and .7 units off their boxes' centres; drawn centred now)
  lens: '<circle cx="4.9" cy="4.9" r="3.2"/><path d="M7.3 7.3 10.3 10.3"/>',
  doc: '<path d="M3 1.6h4l2.2 2.2v6.6H3z"/><path d="M4.6 5.6h3M4.6 7.6h3"/>',
  flag: '<path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/>',
  ana: '<circle cx="6" cy="3.71" r="2"/><path d="M2.3 10.31c.6-2 2-3 3.7-3s3.1 1 3.7 3"/>',
  tick: '<path d="M2.4 6.4l2.4 2.4 4.8-5.2"/>',
};
const icon = (k, x, y, s, col) => `<g class="ag-i" transform="translate(${x} ${y}) scale(${s})" stroke="${col}" style="stroke-width:${(1.55 / s).toFixed(3)}">${ICON[k]}</g>`;   // (every icon draws at 1.55 units, whatever its scale)
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const r1 = v => +v.toFixed(1);
const T = (x, y, t, f = 10, col = C.mute, extra = '') => `<text x="${x}" y="${y}" font-size="${f}" fill="${col}"${extra ? ' ' + extra : ''}>${t}</text>`;

// (7 Nov 2026: phones break the lines where desktop does, three a step, since their words are now 13.6 units, 12px on an
// iPhone, the site's floor; at 12.5 they rendered 11px)
const STEPS = [
  { title: 'Purpose-built agents', d: ['A local model does best with one job, so', 'each narrow agent gets only the tools', 'and context that job needs.'] },
  { title: 'Equipped to adapt', d: ['No results can mean a bad query, not a', 'safe network. So the agent rewrites it,', 'checks the fix and searches again.'] },
  { title: 'Surface to the analyst', d: ['Agents flag what looks suspicious, with', 'the evidence attached. Only a human', 'analyst makes the call.'] },
];
// the two searches Detection writes, in no SIEM's syntax (the verifier's rule); MONO is a character's width at 9px
// (7 Nov 2026: the count steps 4 a column as the beam lights each column of 4, so it lands on 32 as the beam leaves;
// the numbers are right-aligned and "found" is drawn once, so nothing beside them moves while it counts)
const QUERIES = [['process', 'schtasks.exe'], ['event', 'task created']], MONO = 5.4, CNT = [4, 8, 12, 16, 20, 24, 28];
const ARIA = 'An illustrative hunt. From a ransomware report, a supervisor agent splits the hunt among narrow agents, each given only the tools and context its one job needs, because a local model does best with one job: forming a hypothesis, writing and running the detection logic, reporting. The Hypothesis agent\'s hunch is that attackers hide in scheduled tasks. The Detection agent\'s first search, for schtasks.exe, comes back empty, and empty does not mean safe: tasks made through the Task Scheduler API never launch schtasks.exe, so it rewrites the query, checks it and searches the event logs another way, around event 4698, a task being created. That returns 32 tasks created; one is unusual, \\WinTaskUpdate, on one host and not in the baseline. The Reporting agent writes it up as a lead with the evidence attached, and only a human analyst makes the call.';

// the layout, in the desktop's own units: the one line every hand-off travels along, the three agents' places, the
// supervisor, Detection's place in step 2, the logs, the query strip, the lead card and the analyst
// (5 Nov 2026, second review: the logs sit 7 higher so the count shares a baseline with Detection's name, the lead
// card lines up with step 3's heading, and the analyst moves 2 in so "Analyst decides" keeps the 16 margin)
// (7 Nov 2026: the logs 1.5 lower, so the unusual tile sits exactly on the line its flight runs along)
const L = 104, HUB = [138, 58], BX = [56, 116, 176], DX = 238, G = { x: 292, y: 75.5, ts: 9, tg: 3 }, OUTT = [2, 5];
G.w = 8 * (G.ts + G.tg) - G.tg; G.h = 4 * (G.ts + G.tg) - G.tg;
const OUTC = [G.x + OUTT[1] * (G.ts + G.tg) + G.ts / 2, G.y + OUTT[0] * (G.ts + G.tg) + G.ts / 2];
const Q = { x: 224, y: 143, w: 162, h: 16 }, CARD = { x: 432, y: 76, w: 98, h: 56 }, AX = 586, R = 16, QS = 1.2;
// (HX: the hunch's words centred in its pill, measured with bold rendering; PENY: the card's pen centred on its first
// row; GL1: what the check was)
const HX = 24.3, PENY = 6.8, GL1 = 'fields and syntax checked';
// each step's picture: its reach in the desktop's units [left, right, top, bottom] (phones scale and stack them by the
// top and bottom, and line their left edges up by LEFT; on a phone step 2 reaches further right and lower, for its
// larger query strip)
// (step 2's bottom on a phone is its strip, not its transient notes, which may hang into the gap below; the gaps
// between the three steps then match)
// (7 Nov 2026: trimmed to what each picture draws, so the phone's larger words still fit one screen; step 1's bottom
// set so the gaps above steps 2 and 3 match)
const REACH_M = [[16, 216, 48, 163], [220, r1(Q.x + Q.w * QS + 1), 59, 178], [430, 622, 76, 154]];

const badge = (cls, cx, cy, ic, name, on) => `<g class="ag-b ${cls}"><rect class="ag-b-glow" x="${cx - 18}" y="${cy - 18}" width="36" height="36" rx="11" fill="none" stroke="${C.teal}" stroke-width="5" stroke-opacity=".22"/>` +
  `<rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" rx="7" fill="${C.node}" stroke="${on ? C.teal : C.dim}" stroke-width="${SE}"/>` +
  `<g class="ag-bi">${icon(ic, r1(cx - 8.4), r1(cy - 8.4), 1.4, on ? C.teal : C.mute)}</g>${T(cx, cy + 28, name, 10, on ? C.teal : C.mute, 'text-anchor="middle"')}</g>`;   // (.ag-bi: the icon's own group, so it can move without losing its place)
const wire = x => `M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${x} ${L - 30} ${x} ${L - 14}`;

// the pictures, in the desktop's units. Detection stands on the side it leaves from: last on desktop, where it slides
// right into step 2, and first on a phone, where it leaves left for the spine.
// What a run makes sits in .ag-run groups, which the replay fades; the rest (the report, the supervisor, its wires and
// the three agents, Detection walking back to its place) stays through the seam, so the chart's starting point never
// blinks (7 Nov 2026).
function picture(i, phone) {
  if (i === 0) {
    const [hx, rx, dx] = phone ? [BX[1], BX[2], BX[0]] : BX;
    let p = `<g class="ag-team">${[hx, rx, dx].map((x, k) => `<path class="ag-wire ag-arm${k}${k === 2 ? ' ag-wire-det' : ''}" d="${wire(x)}" pathLength="1" stroke="${C.dim}" fill="none"/>`).join('')}` +
      // (the supervisor hands each agent its part: a pulse down each wire, the same teal token as every other hand-off)
      [hx, rx, dx].map((x, k) => `<path class="ag-fan ag-fan${k}" d="${wire(x)}" pathLength="1" stroke="${C.teal}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`).join('') +
      `<g class="ag-hub"><circle cx="${HUB[0]}" cy="${HUB[1]}" r="8" fill="${C.node}" stroke="${C.dim}" stroke-width="${SE}"/><circle cx="${HUB[0]}" cy="${HUB[1]}" r="2.6" fill="${C.dim}"/></g>${T(HUB[0] + 13, HUB[1] + 3.3, 'Supervisor')}` +
      badge('ag-bh', hx, L, 'bulb', 'Hypothesis') +
      // Detection's place in step 1: a dotted outline once it has moved on (owner); always drawn, under Detection while it is there
      `<rect class="ag-slot" x="${dx - 14}" y="${L - 14}" width="28" height="28" rx="7" fill="none" stroke="${C.dim}" stroke-dasharray="3.124 3.124"/>` +
      (phone ? `<g class="ag-det1">${badge('', dx, L, 'lens', 'Detection', true)}</g>` : '') + '</g>';
    p += `<g class="ag-rep"><rect x="16" y="${HUB[1] - 8}" width="104" height="16" rx="4" fill="${C.chip}" stroke="${C.rule}"/>${icon('doc', 19, HUB[1] - 6.6, 1.1, C.ink)}${T(35, HUB[1] + 3.3, 'Ransomware report', 9, C.body)}</g>` +
      `<path class="ag-rep-link" d="M120 ${HUB[1]} H${HUB[0] - 9}" stroke="${C.dim}" pathLength="1" fill="none"/>`;
    p += `<g class="ag-repb">${badge('ag-br', rx, L, 'pen', 'Reporting')}</g>`;
    // (the hunch shares the query strip's row, height and baseline: 16 high at y 143, words on 154.3)
    p += `<g class="ag-run ag-r1"><g class="ag-hunch"><rect x="16" y="143" width="200" height="16" rx="4" fill="${C.chip}" stroke="${C.teal}" stroke-opacity=".55"/>` +
      `<rect class="ag-hf" x="16" y="143" width="200" height="16" rx="4" fill="none" stroke="${C.teal}" stroke-width="${SE}"/>` +   // (it flashes as the pulse leaves with it)
      `<text x="${HX}" y="154.3" font-size="10" fill="${C.body}"><tspan font-weight="700" fill="${C.teal}">Hunch:</tspan> attackers hide in scheduled tasks</text>` +
      // (the same line again, only "scheduled tasks" painted, in teal: it shows while Detection types "schtasks", so the
      // query reads as the hunch put to work; opacity only, laid exactly over the words)
      `<text class="ag-hk" x="${HX}" y="154.3" font-size="10" fill="${C.teal}" fill-opacity="0"><tspan font-weight="700">Hunch:</tspan> attackers hide in <tspan fill-opacity="1">scheduled tasks</tspan></text></g>` +
      // (the hunch's pulse: a bright core over a soft glow, so the hand-off reads at a glance)
      ['ag-hglow" stroke-width="9', 'ag-hcore" stroke-width="3.6'].map(k => `<path class="ag-hpath ${k}" d="M${hx} ${L - 14} C${hx} ${L - 30} ${HUB[0]} ${HUB[1] + 20} ${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 20} ${dx} ${L - 30} ${dx} ${L - 14}" pathLength="1" stroke="${C.teal}" stroke-linecap="round" fill="none"/>`).join('') + '</g>';
    return p;
  }
  if (i === 1) {
    let p = T(G.x, G.y - 8, 'Event logs', 10, C.mute, 'class="ag-lg"');
    const TILE = `width="${G.ts}" height="${G.ts}" rx="2"`;
    p += `<g class="ag-logs">${Array.from({ length: 32 }, (_, k) => { const c = k % 8, r = (k / 8) | 0, out = r === OUTT[0] && c === OUTT[1];
      // (three rects a tile, grey, the flicker and the light, so only opacity ever animates; their size and colours are in the stylesheet)
      const dd = Math.max(Math.abs(r - OUTT[0]), Math.abs(c - OUTT[1]));   // (its distance from the unusual one: the dim closes in on it)
      return `<g class="ag-t" style="--c:${c};--d:${dd}" transform="translate(${G.x + c * (G.ts + G.tg)} ${G.y + r * (G.ts + G.tg)})"><rect ${TILE}/><rect class="ag-tm" ${TILE}/><rect class="ag-tl${out ? ' ag-tl-out' : ''}" ${TILE}/></g>`; }).join('')}</g>`;
    p += `<g class="ag-ring"><circle cx="${OUTC[0]}" cy="${OUTC[1]}" r="9" fill="none" stroke="${C.bg}" stroke-width="3.8"/><circle cx="${OUTC[0]}" cy="${OUTC[1]}" r="9" fill="none" stroke="${C.teal}" stroke-width="${SE}"/></g>`;
    const cone = `M${DX + 12} ${L - 3} L${G.x - 3} ${G.y - 4} H${G.x + G.w + 3} V${G.y + G.h + 2.5} H${G.x - 3} Z`;
    // (the beam is light, not a slab: clear at Detection, brightest where it reaches the logs, fading past them)
    const bx0 = DX + 12, bx1 = G.x + G.w + 3, at = r1((G.x - 3 - bx0) / (bx1 - bx0));
    p += [0, 1].map(k => { const id = `ag-bm-${phone ? 'm' : 'd'}${k}`, col = k ? C.teal : C.mute, peak = k ? .16 : .13;
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${bx0}" y1="0" x2="${bx1}" y2="0"><stop offset="0" stop-color="${col}" stop-opacity="0"/>` +
        `<stop offset="${at}" stop-color="${col}" stop-opacity="${peak}"/><stop offset="1" stop-color="${col}" stop-opacity="${+(peak * .3).toFixed(3)}"/></linearGradient>` +
        `<path class="ag-beam ag-beam${k}" d="${cone}" fill="url(#${id})"/>` +
        `<rect class="ag-bar ag-bar${k}" x="${G.x - 3}" y="${G.y - 3}" width="3" height="${G.h + 5.5}" rx="1.5" fill="${col}" style="--w:${G.w + 3}px"/>`; }).join('');
    // the counts: each number right-aligned on NX, "found" drawn once beside it, so nothing moves as the number changes
    // (it had jittered 2 units as the digits' widths changed); "1 unusual" after a drawn dot, evenly spaced
    const cy = L + 28, NX = G.x + 11.9, FX = NX + 2.7, DOT = FX + 28.3 + 3.2;   // (on one baseline with Detection's name; the dot 3.2 from each word, so "1 unusual" ends on the logs' right edge now that bold renders)
    p += `<g class="ag-n0">${T(NX, cy, '0', 10.5, C.body, 'text-anchor="end" font-weight="700"')}${T(FX, cy, 'found', 10.5, C.body, 'font-weight="700"')}</g>` +
      `<g class="ag-odo">${T(FX, cy, 'found', 10.5, C.teal, 'class="ag-fd" font-weight="700"')}` +   // (the count: each number replaces the last in place, in step with the beam)
      [...CNT, 32].map((v, j) => T(NX, cy, v, 10.5, C.teal, `class="ag-cnv" style="--j:${j}" text-anchor="end" font-weight="700"`)).join('') + '</g>' +
      `<g class="ag-qw"><circle cx="${r1(DOT)}" cy="${cy - 3.6}" r="1.4" fill="${C.teal}"/>${T(r1(DOT + 3.2), cy, '1 unusual', 10.5, C.teal, 'font-weight="700"')}</g>`;
    const tx0 = Q.x + 15, base = Q.y + 11.3;   // (the strike runs the whole first query, closing quote too, through its x-height)
    // (a phone draws the query strip QS larger, from its top left corner, so the query reads at about 10px on an iPhone)
    p += (phone ? `<g transform="translate(${Q.x} ${Q.y}) scale(${QS}) translate(${-Q.x} ${-Q.y})">` : '<g>') + `<g class="ag-q"><rect x="${Q.x}" y="${Q.y}" width="${Q.w}" height="${Q.h}" rx="4" fill="${C.chip}" stroke="${C.rule}"/>` +
      `<rect class="ag-qf" x="${Q.x}" y="${Q.y}" width="${Q.w}" height="${Q.h}" rx="4" fill="none" stroke="${C.teal}" stroke-width="${SE}"/>`;
    QUERIES.forEach(([f, v], k) => { const len = r1((f.length + v.length + 5) * MONO);
      p += `<g class="ag-q${k}"><text x="${Q.x + 5.5}" y="${base}" font-size="10" font-weight="700" fill="${C.teal}">&gt;</text>` +   // (ASCII: the font carries no other prompt glyph)
        [[f, 0, C.body], ['=', f.length + 1, C.dim], [`"${v}"`, f.length + 3, C.teal]].map(([run, at, col]) =>
          `<text class="ag-qt" x="${r1(tx0 + at * MONO)}" y="${base}" font-size="9" fill="${col}" textLength="${r1(run.length * MONO)}" lengthAdjust="spacingAndGlyphs">${esc(run)}</text>`).join('') +
        (k === 0 ? `<path class="ag-qx" d="M${tx0 - 1} ${Q.y + 9} H${r1(tx0 + len + 1)}" pathLength="1" stroke="${C.ink}" stroke-width="${SE}"/>` : `<g class="ag-qok">${icon('tick', Q.x + Q.w - 17, Q.y + 2, 1, C.teal)}</g>`) +
        `<rect class="ag-qc" x="${tx0 - .5}" y="${Q.y + 1.5}" width="${r1(len + 2)}" height="${Q.h - 3}" fill="${C.chip}"/>` +
        `<rect class="ag-qk" x="${tx0}" y="${Q.y + 3}" width="1.2" height="${Q.h - 6}" fill="${C.teal}" style="--w:${len}px"/></g>`; });
    const ny = r1(175 + (phone ? Q.h * (QS - 1) : 0));
    // ("fields and syntax checked" says what the check was; "query checked" left a reader asking what against, 7 Nov 2026)
    p += '</g></g>' + T(Q.x, ny, 'empty doesn&#39;t mean safe', 11, C.ink, 'class="ag-gl ag-gl0" font-weight="700"') + T(Q.x, ny, GL1, 11, C.teal, 'class="ag-gl ag-gl1" font-weight="700"');
    if (phone) p += `<g class="ag-det" style="--dx:0px">${badge('ag-bd', DX, L, 'lens', 'Detection', true)}</g>`;
    return p;
  }
  // the lead card: its contents sit evenly in it (the flag and the words 10.5 in from the left, the pen 10.5 from the
  // right, 7 Nov 2026, round 2). Its frame is one object, .ag-cf: in motion it starts as the unusual result itself, the
  // tile's size and colour, swells where it lies and travels along the line growing into the card (a container
  // transform; its stroke never scales). Desktop sets the card's caption and "Analyst decides" on the hunch and query
  // pills' baseline, 154.3, so the row reads as one line; a phone, with no pills beside them, keeps them under the card.
  const { x, y, w, h } = CARD, cap = phone ? y + h + 16 : 154.3;
  return `<g class="ag-card"><g class="ag-cf"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${C.chip}" stroke="${C.teal}" stroke-width="${SE}" vector-effect="non-scaling-stroke"/>` +
    `<rect class="ag-cft" x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${C.teal}"/></g>` +
    `<g class="ag-cc ag-cc0">${icon('flag', x + 6.9, y + 7.5, 1.2, C.teal)}<text x="${x + 24.9}" y="${y + 18.5}" font-size="10.5" font-weight="700" fill="${C.ink}">1 lead</text></g>` +
    `<g class="ag-cpen">${icon('pen', x + w - 24.5, y + PENY, 1.35, C.teal)}</g>` +
    `<g class="ag-cc ag-cc1">${T(x + 10.5, y + 35.5, 'Scheduled Task', 10, C.body)}</g><g class="ag-cc ag-cc2">${T(x + 10.5, y + 47.5, 'ATT&amp;CK T1053.005', 9, C.mute)}</g></g>` +
    `<g class="ag-trick">${T(x, cap, 'A known attacker trick', 10, C.body)}</g>` +
    // (the dashed line to the analyst extends behind the packet as it runs: a mask over it widens in step with it)
    `<mask id="ag-hem-${phone ? 'm' : 'd'}" maskUnits="userSpaceOnUse"><rect class="ag-hem" x="${x + w + 4}" y="${L - 4}" width="${AX - R - 6 - (x + w + 6) + 8}" height="8" fill="#fff"/></mask>` +
    `<path class="ag-he" d="M${x + w + 6} ${L} H${AX - R - 6}" stroke="${C.teal}" stroke-width="${SE}" stroke-dasharray="4 3" stroke-linecap="round" fill="none" mask="url(#ag-hem-${phone ? 'm' : 'd'})"/>` +
    `<rect class="ag-pk" x="${x + w + 1}" y="${L - 4}" width="11" height="8" rx="2" fill="${C.teal}" style="--dx:${AX - R - 6 - (x + w + 6)}px"/>` +
    `<g class="ag-ana"><circle cx="${AX}" cy="${L}" r="${R}" fill="${C.node}" stroke="${C.amb}" stroke-width="${SE}"/>${icon('ana', r1(AX - 13.7), r1(L - 13.7), 2.28, C.amb)}</g>` +
    `<circle class="ag-halo" cx="${AX}" cy="${L}" r="${R}" fill="none" stroke="${C.amb}" stroke-width="${SW}"/>${T(AX, cap, 'Analyst decides', 10, C.amb, 'class="ag-decides" text-anchor="middle" font-weight="700"')}`;
}

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
  if (phone) h += `<text x="16" y="${y + 21}" font-size="${fh}" fill="${C.body}">${HEADLINE}</text>`;
  return h + `</g><path d="M16 ${line} H${w - 16}" stroke="${C.rule}" shape-rendering="crispEdges"/>`;
}
const open = (cls, w, h) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ARIA)}"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.rule}"/>`;
// a soft teal light behind whichever step is acting (7 Nov 2026): static radial washes, crossfaded by opacity alone,
// four stops so the near-black never bands; none in the final frame
const wash = (id, boxes) => `<radialGradient id="${id}" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="${C.teal}" stop-opacity=".075"/><stop offset=".45" stop-color="${C.teal}" stop-opacity=".04"/>` +
  `<stop offset=".75" stop-color="${C.teal}" stop-opacity=".012"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></radialGradient>` +
  boxes.map(([x, y, w, h], i) => `<rect class="ag-wash ag-wash${i}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${id})"/>`).join('');

// desktop: three columns, the line running through them; the words sit 6 lower than they did (5 Nov 2026), so step 2's
// notes ("empty doesn't mean safe", "query checked") clear its heading by 16 and no longer read as part of it
// (7 Nov 2026: 266 tall, so the words' descenders sit 13 above the frame rather than 7; type on five sizes, 9, 10, 10.5,
// 11 and 12.5)
const DH = 266;
function desktop() {
  const W = 640, s = [open('ag-scene', W, DH), wash('ag-wash-d', [0, 1, 2].map(i => [8 + i * 208, 40, 208, DH - 46])), header(W, 23, 11)];
  STEPS.forEach((st, i) => { const x = 16 + i * 208;
    s.push(`<g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${title(i, x, 200, 12.5)}${body(st.d, x, 219, 15.5, 10.5)}</g></g>`); });
  // (what a run makes in three groups, step by step, so the replay can take it away right to left: .ag-r1 the hunch,
  // Detection's line and the supervisor's wire to where it works; .ag-r2 step 2; .ag-r3 step 3; round 2, 7 Nov 2026)
  const stage = `<g class="ag-p ag-p0">${picture(0, false)}</g>` +
    // the line: Detection's place to where it works, and on to step 3; the supervisor's wire follows Detection there as it moves
    `<g class="ag-run ag-r1"><path class="ag-ln ag-ln1" d="M${BX[2] + 15} ${L} H${DX - 15}" pathLength="1" stroke="${C.dim}" fill="none" shape-rendering="crispEdges"/>` +
    `<path class="ag-wire2" d="M${HUB[0]} ${HUB[1] + 8} C${HUB[0]} ${HUB[1] + 30} ${DX} ${L - 40} ${DX} ${L - 14}" pathLength="1" stroke="${C.dim}" fill="none"/></g>` +
    `<g class="ag-run ag-r2"><g class="ag-p ag-p1">${picture(1, false)}</g></g>` +
    `<g class="ag-run ag-r3"><path class="ag-ln ag-ln2" d="M${G.x + G.w + 8} ${L} H${CARD.x - 1.5}" pathLength="1" stroke="${C.dim}" fill="none" shape-rendering="crispEdges"/><g class="ag-p ag-p2">${picture(2, false)}</g></g>` +
    `<g class="ag-det" style="--dx:${DX - BX[2]}px">${badge('ag-bd', BX[2], L, 'lens', 'Detection', true)}</g>`;
  return s.join('') + `<g class="ag-stage">${stage}</g></svg>`;
}
// phones: each step's picture drawn a little over desktop size above its words, the whole drawing fitting one phone
// screen (owner, 1 Nov 2026, on an iPhone 16: "the whole animation is too long and cannot find the screen entirely";
// it was 1.4x with roomy gaps, 360x868, taller than Safari's viewport)
// The steps hang off one spine down the left, their numbers nodes on it, each step's heading and words above its
// picture, the way a phone shows a sequence of steps (owner, 1 Nov 2026: "the connectivity between panels is not good
// on mobile, as compared to desktop"; blind design reviews read an earlier track, wrapped round the words on the right,
// as a half-drawn border, and a picture above its heading as part of the step before). What moves is the thing itself,
// as on desktop (owner, 2 Nov 2026: "do the last designer wish").
// (7 Nov 2026, round 2: a blind motion director read the old routes, Detection shrunk to .4 on a three-leg L down the
// spine and the result running left, down and back right, as mechanical and backwards. Now each is one eased move at
// full size, straight to where it lands, over the words, which wait dimmed: Detection on a gentle curve down to step 2,
// and the result straight down into step 3, where it grows into the lead card as on desktop. The spine is the steps'
// progress only: its run to the next number fills as each move travels, and the number lights as it lands.)
// (7 Nov 2026, round 2: each picture starts on one left edge, the report's and the hunch's, x 84; they were centred,
// which gave the three panels three left edges)
const PS = 1.08, SP = 20, TX = 36, PX = 84, MB = 13.6, MT = 14.6, MLH = 17;   // (words, titles, line height)
const LEFT = [16, DX - 14, CARD.x];   // (each picture's left edge, in the desktop's units)
// the cubic-bezier curves as functions, so a sampled move eases exactly like the CSS beside it
const cubic = (x1, y1, x2, y2) => u => { let lo = 0, hi = 1, s = u;
  for (let i = 0; i < 32; i++) { s = (lo + hi) / 2; if (3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s < u) lo = s; else hi = s; }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s; };
const ease = cubic(.4, 0, .2, 1);   // (the site's standard curve)
const pct = v => +(100 * v).toFixed(2);
const node = (i, y) => `<circle class="ag-nd" cx="${SP}" cy="${y}" r="7.5" fill="${C.bg}" stroke="${i === 2 ? C.amb : C.teal}" stroke-opacity=".7"/>` +
  `<text x="${SP}" y="${r1(y + 3.6)}" font-size="10" font-weight="700" fill="${i === 2 ? C.amb : C.teal}" text-anchor="middle">${i + 1}</text>`;
function phone() {
  const W = 360, words = [], pics = [], at = [], nodes = [], boxes = []; let y = 60, H = 0;
  STEPS.forEach((st, i) => {
    const [, , y0, y1] = REACH_M[i], ty = r1(y + 19), by = r1(ty + 18.5), top = by + (st.d.length - 1) * MLH + 12;
    const px = r1(PX - PS * LEFT[i]), py = r1(top - PS * y0), bottom = top + PS * (y1 - y0);
    at[i] = [px, py]; nodes[i] = r1(ty - 4.6);
    words.push(`<circle cx="${SP}" cy="${nodes[i]}" r="7.5" fill="${C.bg}"/><g class="ag-sw ag-sw${i}"><g class="ag-s ag-s${i}">${node(i, nodes[i])}<text x="${TX}" y="${ty}" font-size="${MT}" font-weight="700" fill="${C.ink}">${STEPS[i].title}</text>${body(st.d, TX, by, MLH, MB)}</g></g>`);
    pics.push(`<g class="ag-p ag-p${i}"><g transform="translate(${px} ${py}) scale(${PS})">${picture(i, true)}</g></g>`);
    boxes.push([4, ty - 22, W - 8, bottom - ty + 30]);
    y = r1(bottom + 10); H = r1(bottom + 10);
  });
  const map = (i, [u, v]) => [at[i][0] + PS * u, at[i][1] + PS * v];
  const [d1, d2, out, cardC] = [map(0, [BX[0], L]), map(1, [DX, L]), map(1, OUTC), map(2, [CARD.x + CARD.w / 2, L])];
  const stem = `<path class="ag-rail" d="M${SP} ${r1(nodes[0] + 7.5)} V${r1(nodes[2] - 7.5)}" stroke="${C.teal}" stroke-opacity=".15" shape-rendering="crispEdges"/>`;   // (the rail, through the numbers)
  // (the spine's progress: from each number to the next, filled as that step's move travels)
  const tk = k => `<path class="ag-tk ag-tk${k + 1}" d="M${SP} ${r1(nodes[k] + 7.5)} V${r1(nodes[k + 1] - 7.5)}" pathLength="1" stroke="${C.teal}" fill="none" shape-rendering="crispEdges"/>`;
  // Detection, travelling: its exact badge, over the words, from its place in step 1 to its place in step 2
  const b = 14 * PS;
  const chip = `<g class="ag-tv ag-tv1"><rect x="${r1(d1[0] - b)}" y="${r1(d1[1] - b)}" width="${r1(2 * b)}" height="${r1(2 * b)}" rx="${r1(7 * PS)}" fill="${C.node}" stroke="${C.teal}" stroke-width="1.5"/>` +
    `${icon('lens', r1(d1[0] - 8.4 * PS), r1(d1[1] - 8.4 * PS), r1(1.4 * PS), C.teal)}</g>`;
  // its move: one curve bowing a little toward the spine, eased on the standard curve, lifting to 1.06 midway; sampled
  // by translation and scale (no rotation). The replay runs it backwards (its own keyframes: WebKit held a reversed
  // animation at its start), so Detection goes home the way it came.
  const [x0, y0] = d1, [x3, y3] = d2, dy = y3 - y0, c1 = [x0 - 18, y0 + .4 * dy], c2 = [x3 - 18, y3 - .4 * dy];
  const bz = s => [0, 1].map(k => (1 - s) ** 3 * d1[k] + 3 * (1 - s) ** 2 * s * c1[k] + 3 * (1 - s) * s * s * c2[k] + s ** 3 * d2[k]);
  const N = 40, frames = (name, at) => `@keyframes ${name} { ${Array.from({ length: N + 1 }, (_, i) => { const u = i / N, e = at(u), [x, yy] = bz(e);
    return `${pct(u)}% { transform: translate(${r1(x - x0)}px, ${r1(yy - y0)}px) scale(${(1 + .06 * Math.sin(Math.PI * e)).toFixed(3)}); }`; }).join(' ')} }`;
  const kf = frames('ag-tv1', ease) + '\n' + frames('ag-tv1-back', u => 1 - ease(u));
  return { svg: open('ag-scene ag-scene--m', W, H) + wash('ag-wash-m', boxes) + header(W, 23, MB, true) + stem +
    `<g class="ag-stage"><g class="ag-run ag-r2">${tk(0)}</g><g class="ag-run ag-r3">${tk(1)}</g>${pics[0]}<g class="ag-run ag-r2">${pics[1]}</g></g>` + words.join('') +
    // (step 3's picture and the traveller over the words: the lead grows on its way down to the card, Detection passes over them)
    `<g class="ag-stage"><g class="ag-run ag-r3">${pics[2]}</g>${chip}</g></svg>`, H, kf,
    // the result's start, the unusual tile's centre, in step 3's own units, from the card's centre
    from: [r1((out[0] - cardC[0]) / PS), r1((out[1] - cardC[1]) / PS)] };
}

// ---------------------------------------------------------------- motion (one stylesheet for both drawings)
// [start, duration] in seconds; LEAD holds the opened card still for a beat first ("slightly longer delay before it
// starts"), on every replay too. Each reading moment holds about 2 s (owner: "barely on screen for 0.5s").
const LEAD = 0.5;
// A review (5 Nov 2026, owner: "review web - th animation for enhancements", then "edit and push"; real-time recordings
// read by a blind motion designer and a blind first-time viewer) moved four beats: the struck query holds half a second
// before it is erased, and "query checked" holds about 2 s; Reporting comes forward as the lead card arrives and glows
// as its pen marks it; and on both layouts the team relights after "Analyst decides", so nothing competes with the
// analyst. A second review the same day (owner: "spare no effort, i really want to impress") filled the first second
// and gave Detection a breath back before it slides. A third pass (owner: "try to fix") lit step 2's words for a beat
// before its logs and query arrive and sent Reporting's pen across the top of the chart to write the lead.
// A polish pass (7 Nov 2026, owner: "optimize the th animation further. do research and review for consistency,
// alignment, polish, animation impressiveness"; a blind motion director, a blind hiring manager, a measured audit and a
// research pass):
// - the seam: the report, the supervisor, its wires and the three agents stay through the replay (only what the run made
//   fades, and Detection walks back to its place), so the chart's starting point never blinks; the run opens with the
//   report sent to the supervisor and a pulse down each wire to each agent, the same teal token every hand-off uses;
// - pacing: the hunch reads alone for about 1.5 s; step 2 arrives in order (Detection, then the logs, then the query);
//   the second sweep's count steps 4 a column with the beam and lands on 32 as it leaves; the notes ease in and out;
// - the end: the step captions dim as each step finishes (the current one bright); a soft light sits behind whichever
//   step is acting.
// Round 2 the same day (three fresh blind reviews: a motion director, 7 / 6 craft on desktop / phone; a first-time
// viewer, 7 / 6 impressive; a measured audit):
// - the payoff is one object: the unusual result lifts off the logs, swells and travels along the line growing into
//   the lead card (a container transform), its words writing in as it lands, and the dashed line then extends to the
//   analyst behind the packet. Reporting readies first (it lights and presses as "1 unusual" settles) and its own pen
//   writes in step with the card's, so the lead is its work without a second traveller (the pen's flight over the
//   chart, and the route it left, are gone);
// - each step's words light as its object lands (step 2 as Detection lands, step 3 as the result lifts), the logs grow
//   in rather than pop, the empty sweep runs as long as the full one, the struck query holds 1.5 s, and the team and
//   the captions relight with "Analyst decides" (one resolve, no second pop);
// - desktop's dotted outline still appears as Detection leaves (owner) and goes, with Detection's old line, 1.5 s after
//   Detection lands (a lasting empty box read as a missing agent);
// - the replay is a rewind (760 ms, the card's data-fade): what the run made fades right to left, step by step, and
//   Detection glides home the way it came, its place's outline coming back to meet it.
const t = {
  // step 1: the report is sent, the supervisor reads it and hands each agent its part along its wire
  rep: [0, .48], hub: [.22, .32], fan0: [.32, .32], fan1: [.4, .32], fan2: [.48, .32], bh: [.53, .32], br: [.61, .32], bd: [.69, .32],
  hyp: [.66, 2.2], hunch: [.95, .48], hf: [2.75, .52], hpath: [2.8, .8], hunchgo: [3.45, .32], lit: [3.52, .32], detglow: [3.52, 6.2],
  det: [3.75, .52], ln1: [3.75, .52], wire2: [3.9, .52], back: [4.1, .32], slot: [5.75, .48],
  // step 2: Detection lands, then the logs, then the query
  lg: [4.5, .32], logs: [4.55, .32], q: [4.75, .32], q0: [4.9, .6], hk: [5.0, 2.0], k0: [5.55, .1], s0: [5.65, .9], n0: [6.6, .48],
  gl0: [6.65, 2.55], qx: [7.5, .22], erase: [9.2, .32], q1: [9.6, .6], k1: [10.25, .1], ok: [10.25, .32], gl1: [10.3, 2.2],
  s1: [10.95, .9], dim: [11.95, .32], ring: [12.25, .48], qw: [12.45, .32],
  // step 3: Reporting readies, the result lifts and grows into the lead card along the line, the card goes to the analyst
  fwd: [12.95, .32], lift: [13.1, .72], detback: [13.1, .32], ln2: [13.3, .32], write: [13.62, .48],
  trick: [13.95, .32], pk: [14.1, .52], ana: [14.5, .48], halo: [14.75, .8],
  // the resolve: "Analyst decides", and with it the team and the step captions relight and the light goes
  all: [15.2, .48],
};
// the result's move into the card: a swell where it lies (SWELL), then the travel; a phone's is longer, straight down
// a step (and Detection's move between its stacked steps, TV1)
const SWELL = .16, MOVE = { d: t.lift[1], m: .92 }, TV1 = [t.det[0], .72];
const SH1 = +(TV1[1] - t.det[1]).toFixed(2), SH2 = +(MOVE.m - MOVE.d).toFixed(2);   // (a phone's two longer moves: everything after each waits for it)
const T1 = t.lg[0] - .1, LATE = t.lift[0] + .01;   // (on a phone, everything from step 2 waits SH1, everything after the lift SH2 more)
const tier = s => s >= LATE ? 2 : s >= T1 ? 1 : 0;
const RECV = [t.lit[0], t.s0[0] - .05, t.s1[0] - .05];
const PH = phone();
// one easing family: the site's standard and emphasized curves (custom.css --ease-emphasized), the spring for the two
// payoffs, linear only for machine motion (the beam, the pulses, the sampled moves), steps for typing
const STD = 'cubic-bezier(.4,0,.2,1)', EZ = 'cubic-bezier(.22,.8,.32,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
const STEPSQ = QUERIES.map(([f, v]) => `steps(${f.length + v.length + 5}, jump-none)`);   // (one step per character)
const d = v => +(LEAD + v).toFixed(3);
const sh = k => ['', ' + var(--ag-sh1)', ' + var(--ag-sh1) + var(--ag-sh2)'][k];
const when = (s, k = tier(s)) => k ? `calc(${d(s)}s${sh(k)})` : `${d(s)}s`;
const an = ([s, l], name, ez = STD, fill = 'both', k) => `${name} ${+(+l).toFixed(3)}s ${ez} ${when(s, k)} ${fill}`;
const P = '.is-playing svg.ag-scene', PM = '.is-playing svg.ag-scene--m', PD = '.is-playing svg.ag-scene:not(.ag-scene--m)', S = 'svg.ag-scene', SD = 'svg.ag-scene:not(.ag-scene--m)';
const F = '.internship-demo-card.is-fading svg.ag-scene';
const ends = Object.values(t).map(([s, l]) => d(s + l));
// the beam's sweeps cross the logs at a steady speed: column c is reached SW0/SW1 per column after the first (the
// flicker, the lights and the count all keyed to it); both sweeps take .8 s (the empty one had been quicker)
const BAR0 = [t.s0[0] + .05, .8], BAR1 = [t.s1[0] + .05, .8], col = ([s, l], c) => +(s + l * (12 * c + 7.5) / (G.w + 3)).toFixed(3), per = ([, l]) => +(l * 12 / (G.w + 3)).toFixed(4);
// the result becoming the card: it appears exactly over its lit tile (the tile's size, its stroke inside the tile's
// edge), swells 1.35 where it lies, then travels to the card's place, eased on the standard curve, growing mostly late so
// it stays small while it leaves the logs; the teal of the tile gives way to the card's surface on the way. Scale and
// translation only; the frame's stroke never scales, and the words are never scaled (they write in as it lands).
const morph = (name, [fx, fy], move, grow = 1.3, clear = .45) => { const T = SWELL + move, a = SWELL / T, w0 = (G.ts - SE) / CARD.w, h0 = (G.ts - SE) / CARD.h, sw = 1.35, N = 36;
  const at = (x, y, sx, sy) => `transform: translate(${r1(x)}px, ${r1(y)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)});`;
  const k = [`0% { opacity: 0; ${at(fx, fy, w0, h0)} }`, `1% { opacity: 1; ${at(fx, fy, w0, h0)} animation-timing-function: ${EZ}; }`];
  for (let i = 0; i <= N; i++) { const u = i / N, p = ease(u), g = Math.pow(p, grow);
    k.push(`${pct(a + (1 - a) * u)}% { opacity: 1; ${at(fx * (1 - p), fy * (1 - p), sw * w0 + (1 - sw * w0) * g, sw * h0 + (1 - sw * h0) * g)} }`); }
  return `@keyframes ${name} { ${k.join(' ')} }\n@keyframes ${name}-t { 0%, ${pct(a + (1 - a) * clear)}% { opacity: 1; } ${pct(a + (1 - a) * .95)}%, 100% { opacity: 0; } }`; };
// when each step takes the light, on each layout: as its object lands (step 2) or lifts (step 3)
const PLATE = .22;   // (a phone's card words come this much later: its lead grows late, after crossing step 3's words)
const STAGE = { d: [[t.det[0] + t.det[1] - .05, 0], [t.lift[0], 1]], m: [[TV1[0] + TV1[1] - .05, 0], [t.lift[0] + SWELL + MOVE.m - .2, 1]] };
const focus = (sel, [[w1, k1], [w2, k2]]) => `${sel} .ag-s0 { animation: ${an([w1, .48], 'ag-back', STD, 'forwards', k1)}, ${an(t.all, 'ag-fwd', STD, 'forwards')}; }
${sel} .ag-s1 { animation: ${an([w1, .48], 'ag-wake', EZ, 'both', k1)}, ${an([w2, .48], 'ag-back', STD, 'forwards', k2)}, ${an(t.all, 'ag-fwd', STD, 'forwards')}; }
${sel} .ag-s2 { animation: ${an([w2, .48], 'ag-wake', EZ, 'both', k2)}; }
${sel} .ag-wash0 { animation: ${an([0, .48], 'ag-on', EZ, 'forwards')}, ${an([w1, .48], 'ag-hide', STD, 'forwards', k1)}; }
${sel} .ag-wash1 { animation: ${an([w1, .48], 'ag-on', EZ, 'forwards', k1)}, ${an([w2, .48], 'ag-hide', STD, 'forwards', k2)}; }
${sel} .ag-wash2 { animation: ${an([w2, .48], 'ag-on', EZ, 'forwards', k2)}, ${an(t.all, 'ag-hide', STD, 'forwards')}; }`;
// the colours once, as custom properties, for everything the stylesheet paints
const VARS = Object.entries(C).map(([k, v]) => `--ag-${k}: ${v};`).join(' ');
const css = `/* The Agentic AI glance chart (tools/scenes/agentic-glance/build.cjs; README "Agentic AI glance chart"). Base styles
   are the final frame; motion only under .is-playing (internship-peek.js plays, fades and replays it; .is-still holds). */
.internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { aspect-ratio: 640 / ${DH}; }
.internship-demo-card__plot > svg.ag-scene--m { aspect-ratio: 360 / ${PH.H}; }
@media screen and (max-width: 736px) { .internship-demo-card__plot > svg.ag-scene:not(.ag-scene--m) { display: none; } }   /* (phones show the --m drawing: phone-scenes block) */
/* (the frame is the card's own outline, on its own 12px corners: the drawing's frame, at 1.15 px a unit, had rounder
   corners than the card and left a wedge of the card outside it; a phone shows none, its card bounded by the page) */
@media screen and (min-width: 737px) { .page-experience #agentic-ai .internship-demo-card { outline: 1px solid ${C.rule}; outline-offset: -1px; } }
${S} > rect:first-child { stroke-opacity: 0; }
${S} { ${VARS} }
${S} text { font-family: "Figtree", var(--font-display); }
${S} text:not([font-weight]) { font-weight: 400; }   /* (two weights, 400 and 700; scoped, so a font-weight attribute still makes its text bold) */
${S} text.ag-qt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; }
${S} .ag-i { fill: none; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
${S} .ag-logo path { fill: var(--ag-ink); }
${S} :is(.ag-b, .ag-cf, .ag-ana, .ag-hub, .ag-det, .ag-rep, .ag-hunch, .ag-n0, .ag-t, .ag-ring, .ag-halo, .ag-slot, .ag-qok, .ag-cpen, .ag-bi, .ag-logs, .ag-cc) { transform-box: fill-box; transform-origin: center; }
${S} :is(.ag-cpen, .ag-bi) { transform-origin: 10% 90%; }   /* (a pen turns on its nib) */
${SD} .ag-hunch { transform-origin: 20% 0; }   /* (the hunch drops out of Hypothesis, not the middle of the row) */
svg.ag-scene--m .ag-hunch { transform-origin: 50% 0; }
${S} .ag-qc { transform-box: fill-box; transform-origin: 100% 50%; }
${S} .ag-hem { transform-box: fill-box; transform-origin: 0 50%; }
${S} :is(.ag-wire, .ag-wire2, .ag-ln, .ag-rep-link, .ag-qx) { stroke-dasharray: 1 2; }   /* (drawn: the dash covers the path; undrawn, it sits before the start) */
${S} :is(.ag-hpath, .ag-fan) { stroke-dasharray: .12 2; stroke-opacity: 0; }
${S} .ag-hglow { opacity: .25; }
${S} .ag-wash { opacity: 0; }
${S} { --ag-sh1: 0s; --ag-sh2: 0s; }
svg.ag-scene--m { --ag-sh1: ${SH1}s; --ag-sh2: ${SH2}s; }   /* (a phone's two longer moves: everything after each waits for it) */
${S} .ag-tk { stroke-dasharray: 1 2; stroke-opacity: .55; stroke-width: 1.5; }
${S} .ag-tv { opacity: 0; transform-box: fill-box; transform-origin: center; }   /* (Detection in flight on a phone: hidden but while it moves) */
${S} .ag-det { transform: translateX(var(--dx)); }
${S} .ag-cnv:not(:last-child) { opacity: 0; }
${S} .ag-rep { opacity: .75; }
${S} .ag-hunch { opacity: .75; }
${S} .ag-logs rect { width: ${G.ts}px; height: ${G.ts}px; rx: 2px; fill: var(--ag-dim); fill-opacity: .55; }
${S} .ag-logs .ag-tm { fill: var(--ag-mute); fill-opacity: .3; opacity: 0; }   /* (the empty sweep only glances: nothing it passes should look found) */
${S} .ag-logs .ag-tl { fill: var(--ag-teal); fill-opacity: .9; opacity: .25; }   /* (the 32 found stay faintly lit, so the one unusual reads as one of 32) */
${S} .ag-logs .ag-tl-out { fill-opacity: 1; opacity: 1; }
/* the final frame: the supervisor's wire to where Detection works (owner, 5 Nov 2026: the rewire at the very end read as
   the chart going back to Detection). Desktop's dotted outline and the line from it go 1.5 s after Detection lands (a
   lasting empty box read as a missing agent); a phone keeps its old wire and the outline with Detection faint in it (its
   name hidden: a faint label read as a missing agent), since its two places are on separate steps */
${SD} :is(.ag-wire-det, .ag-slot, .ag-ln1) { opacity: 0; }
svg.ag-scene--m .ag-det1 { opacity: .25; }
svg.ag-scene--m .ag-det1 text { opacity: 0; }
svg.ag-scene--m .ag-nd { transform-box: fill-box; transform-origin: center; }
/* transient marks: hidden in the final frame */
${S} :is(.ag-hf, .ag-cft) { opacity: 0; }
${S} :is(.ag-b-glow, .ag-n0, .ag-gl, .ag-beam, .ag-bar, .ag-halo, .ag-q0, .ag-pk, .ag-hk, .ag-qf) { opacity: 0; }
${S} .ag-q1 .ag-qc { transform: scaleX(0); }   /* (the final frame shows the second query typed out: the cover wiped away, the caret gone) */
${S} .ag-q1 .ag-qk { opacity: 0; }
/* the replay, a rewind of 760 ms (the card's data-fade): what the run made fades right to left, step 3, then step 2,
   then the hunch and Detection's wire, and the waiting steps' words dim with their step; Detection glides home the way
   it came, its place's outline coming back to meet it, and greys as it lands. The report, the supervisor, its wires and
   the agents stay, so the next run starts from what is on screen. */
.internship-demo-card.is-fading .internship-demo-card__plot > svg.ag-scene { opacity: 1; }
${F} .ag-run { opacity: 0; transition: opacity 240ms ${STD}; }
${F} .ag-r2 { transition-delay: 100ms; }
${F} .ag-r1 { transition-delay: 200ms; }
${F} :is(.ag-sw1, .ag-sw2) { opacity: .25; transition: opacity 240ms ${STD}; }
${F} .ag-sw1 { transition-delay: 100ms; }
${F}:not(.ag-scene--m) .ag-det { animation: ag-return .52s ${EZ} .22s both; }
${F}:not(.ag-scene--m) .ag-slot { animation: ag-on .24s ${STD} .22s both; }
${F}:not(.ag-scene--m) .ag-wire-det { animation: ag-on .24s ${STD} .5s both; }
${F} :is(.ag-bd, .ag-det1 .ag-b, .ag-tv1) > rect:not(.ag-b-glow) { animation: ag-unlit-s .32s ${STD} .42s both; }
${F} :is(.ag-bd, .ag-det1 .ag-b, .ag-tv1) .ag-i { animation: ag-unlit-i .32s ${STD} .42s both; }
${F} .ag-bd text { animation: ag-unlit-t .32s ${STD} .42s both; }
${F}--m .ag-tv1 { opacity: 1; animation: ag-tv1-back .52s linear .22s both; }   /* (it takes Detection's place in step 2 and runs its move backwards) */
${F}--m .ag-det1 { animation: ag-unghost .24s ${STD} .5s both; }
${F}--m .ag-det1 .ag-b text { animation: ag-unlit-t .24s ${STD} both, ag-on .24s ${STD} .5s both; }
@keyframes ag-return { from { transform: translateX(var(--dx)); } to { transform: none; } }
@keyframes ag-unghost { from { opacity: .25; } to { opacity: 1; } }
@keyframes ag-unlit-s { from { stroke: ${C.teal}; } to { stroke: ${C.dim}; } }   /* (keyframes take the colours as values: WebKit ignored var() in them) */
@keyframes ag-unlit-i { from { stroke: ${C.teal}; } to { stroke: ${C.mute}; } }
@keyframes ag-unlit-t { from { fill: ${C.teal}; } to { fill: ${C.mute}; } }
@keyframes ag-fade { from { opacity: 0; } }
@keyframes ag-pop { from { opacity: 0; transform: scale(.88); } }
@keyframes ag-grow { from { opacity: 0; transform: scale(.96); } }
@keyframes ag-draw { from { stroke-dashoffset: 1.05; } }
@keyframes ag-wake { from { opacity: .25; } }
@keyframes ag-send { 0% { opacity: .75; transform: none; } 35% { opacity: 1; transform: translateX(3px); } 100% { opacity: .75; transform: none; } }
@keyframes ag-bump { 50% { transform: scale(1.25); } }
@keyframes ag-glow { 0%, 100% { opacity: 0; } 12%, 88% { opacity: 1; } }
@keyframes ag-hunch { from { opacity: 0; transform: translateY(-8px) scale(.9); } to { opacity: 1; transform: none; } }
@keyframes ag-hunchgo { from { opacity: 1; } to { opacity: .75; } }
@keyframes ag-work { 0% { opacity: 0; } 15%, 85% { opacity: .55; } 100% { opacity: 0; } }
@keyframes ag-pulse { 0% { stroke-dashoffset: .12; stroke-opacity: 0; } 12% { stroke-opacity: 1; } 88% { stroke-dashoffset: -.88; stroke-opacity: 1; } 100% { stroke-dashoffset: -.88; stroke-opacity: 0; } }
@keyframes ag-slide { 0% { transform: none; } 15% { transform: translateX(-3px); } 100% { transform: translateX(var(--dx)); } }   /* (a breath back before it goes) */
@keyframes ag-recv { 40% { transform: scale(1.06); } }
@keyframes ag-flash { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ag-on { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-dimto { from { opacity: 1; } to { opacity: .25; } }
@keyframes ag-write { from { opacity: 0; transform: translate(-4px, 4px) rotate(-14deg); } 60% { opacity: 1; transform: translate(1px, -1px) rotate(4deg); } to { opacity: 1; transform: none; } }
@keyframes ag-scribble { 0%, 100% { transform: none; } 30% { transform: translate(-1px, 1px) rotate(-12deg); } 60% { transform: translate(1px, -1px) rotate(5deg); } }   /* (Reporting's own pen, writing as the card's does) */
@keyframes ag-back { from { opacity: 1; } to { opacity: .75; } }
@keyframes ag-fwd { from { opacity: .75; } to { opacity: 1; } }
@keyframes ag-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-keep { from, to { opacity: 1; } }
@keyframes ag-hide { from { opacity: 1; } to { opacity: 0; } }
@keyframes ag-ghost { from { opacity: 1; } to { opacity: .25; } }
@keyframes ag-wipe { from { opacity: 1; transform: scaleX(1); } to { opacity: 1; transform: scaleX(0); } }
@keyframes ag-unwipe { from { opacity: 1; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
@keyframes ag-caret { to { transform: translateX(var(--w)); } }
@keyframes ag-caretback { from { transform: translateX(var(--w)); } to { transform: none; } }
@keyframes ag-shake { 0% { opacity: 0; transform: scale(1.15); } 35% { opacity: 1; transform: none; animation-timing-function: ${STD}; } 50% { transform: translateX(-2px); animation-timing-function: ${STD}; } 65% { transform: translateX(2px); animation-timing-function: ${STD}; } 80% { transform: translateX(-1px); animation-timing-function: ${STD}; } 100% { opacity: 1; transform: none; } }
@keyframes ag-glint { 0%, 100% { opacity: 0; } 15%, 75% { opacity: 1; } }
@keyframes ag-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes ag-say { from { opacity: 0; transform: translateY(4px); } }
@keyframes ag-beam { 0% { opacity: 0; } 15%, 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ag-bar { 0% { opacity: 0; transform: none; } 10%, 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--w)); } }
@keyframes ag-miss { 0%, 100% { opacity: 0; } 30% { opacity: 1; } }
@keyframes ag-light { from { opacity: 0; } }
@keyframes ag-lit-s { from { stroke: ${C.dim}; } }
@keyframes ag-lit-i { from { stroke: ${C.mute}; } }
@keyframes ag-lit-t { from { fill: ${C.mute}; } }
@keyframes ag-ring { from { opacity: 0; transform: scale(.4); } 35% { opacity: 1; } to { opacity: 1; transform: none; } }   /* (one overshoot: the spring runs the whole way) */
@keyframes ag-spring { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
@keyframes ag-halo { 0% { opacity: .85; transform: scale(1); } 30% { opacity: .25; } 100% { opacity: 0; transform: scale(2.1); } }
@keyframes ag-trace { from { stroke-dashoffset: 1; } }   /* (the spine's run to the next number, filled as the move travels) */
@keyframes ag-nd { 50% { transform: scale(1.35); stroke-opacity: 1; } }
@keyframes ag-pk { 0% { opacity: 0; transform: none; } 12%, 88% { opacity: 1; } 100% { opacity: 0; transform: translateX(var(--dx)); } }
${morph('ag-morph-d', [r1(OUTC[0] - CARD.x - CARD.w / 2), r1(OUTC[1] - L)], MOVE.d)}
${morph('ag-morph-m', PH.from, MOVE.m, 2.6, .6)}
${PH.kf}
/* step 1: the report is sent, the supervisor hands each agent its part, the hunch is carried to Detection, which moves on */
${P} .ag-rep { animation: ${an(t.rep, 'ag-send', STD, 'none')}; }
${P} .ag-hub { animation: ${an(t.hub, 'ag-bump', SPRING, 'none')}; }
${[0, 1, 2].map(k => `${P} .ag-fan${k} { animation: ${an(t['fan' + k], 'ag-pulse', 'linear', 'none')}; }`).join('\n')}   /* (a pulse down each wire, landing on its agent) */
${P} .ag-bh { animation: ${an(t.bh, 'ag-recv', STD, 'none')}; }
${P} .ag-bd { animation: ${[t.bd[0], ...RECV].map(s => an([s, .32], 'ag-recv', STD, 'none')).join(', ')}; }   /* (it gets its part, takes the hunch, then sends each search, with a small press) */
${P} .ag-bh .ag-b-glow { animation: ${an(t.hyp, 'ag-glow', 'linear', 'none')}; }
${P} .ag-hunch { animation: ${an(t.hunch, 'ag-hunch', EZ)}, ${an(t.hunchgo, 'ag-hunchgo', STD, 'forwards')}; }
${P} .ag-hk { animation: ${an(t.hk, 'ag-glint', STD, 'none')}; }   /* ("scheduled tasks" lights in the hunch while "schtasks" is typed) */
${P} .ag-hpath { animation: ${an(t.hpath, 'ag-pulse', 'linear', 'none')}; }
${P} .ag-hf { animation: ${an(t.hf, 'ag-flash', STD, 'none')}; }   /* (the hunch carried along the wires: up to the supervisor, down to Detection) */
${P} .ag-det { animation: ${an(t.det, 'ag-slide', STD)}, ${an(t.detback, 'ag-back', STD, 'forwards')}, ${an(t.all, 'ag-fwd', STD, 'forwards')}; }   /* (straight along the line; it steps back as Reporting takes over) */
/* Detection is neutral until the hunch lands on it, then lights (cause before effect; a blind continuity review) */
${P} :is(.ag-bd, .ag-det1 .ag-b) > rect:not(.ag-b-glow) { animation: ${an(t.lit, 'ag-lit-s', STD)}; }
${P} :is(.ag-bd, .ag-det1 .ag-b) .ag-i { animation: ${an(t.lit, 'ag-lit-i', STD)}; }
${P} :is(.ag-bd, .ag-det1 .ag-b) text { animation: ${an(t.lit, 'ag-lit-t', STD)}; }
${P} .ag-bd .ag-b-glow { animation: ${an(t.detglow, 'ag-glow', 'linear', 'none')}; }
/* (as Detection moves, its old wire fades while the new one draws after it: the supervisor re-routes to where it works;
   on desktop the dotted outline it left, and the line from it, go 1.5 s after it lands) */
${PD} .ag-wire-det { animation: ${an([0, t.wire2[0] + .1], 'ag-keep', 'linear')}, ${an([t.wire2[0] + .1, .32], 'ag-hide', STD, 'forwards')}; }
${PD} .ag-slot { animation: ${an([0, t.slot[0]], 'ag-keep', 'linear')}, ${an(t.slot, 'ag-hide', STD, 'forwards')}; }
${PD} .ag-ln1 { animation: ${an(t.ln1, 'ag-draw')}, ${an([0, t.slot[0]], 'ag-keep', 'linear')}, ${an(t.slot, 'ag-hide', STD, 'forwards')}; }
${P} .ag-wire2 { animation: ${an(t.wire2, 'ag-draw', STD)}; }
/* the team steps back while Detection works; Reporting readies as "1 unusual" settles (it lights, glows and presses),
   writes the lead with its own pen in step with the card's, and all come forward with "Analyst decides" */
${P} .ag-team { animation: ${an(t.back, 'ag-back', STD, 'forwards')}, ${an(t.all, 'ag-fwd', STD, 'forwards')}; }
${P} .ag-repb { animation: ${an(t.back, 'ag-back', STD, 'forwards')}, ${an(t.fwd, 'ag-fwd', STD, 'forwards')}; }
${P} .ag-br .ag-b-glow { animation: ${an([t.fwd[0], t.write[0] + t.write[1] + .2 - t.fwd[0]], 'ag-glow', 'linear', 'none')}; }   /* (from when it readies until its pen has written) */
${P} .ag-br { animation: ${an(t.br, 'ag-recv', STD, 'none')}, ${an([t.fwd[0] + .05, .32], 'ag-recv', STD, 'none')}; }
${P} .ag-br .ag-bi { animation: ${an(t.write, 'ag-scribble', STD, 'none')}; }
/* the step captions: the acting step bright, a finished one stepped back, the next one waiting; the light follows */
${focus(P, STAGE.d)}
${focus(PM, STAGE.m)}
/* step 2: the logs; a query, a sweep that finds nothing; struck, backspaced, retyped, checked; a sweep that finds 32, one unusual */
${P} .ag-lg { animation: ${an(t.lg, 'ag-fade')}; }
${P} .ag-logs { animation: ${an(t.logs, 'ag-grow', EZ)}; }   /* (the logs grow in as their tiles cascade) */
${P} .ag-q { animation: ${an(t.q, 'ag-fade')}; }
${P} .ag-q0 { animation: ${an([t.q[0], .01], 'ag-show', 'linear')}, ${an([t.q1[0] - .05, .1], 'ag-hide', 'linear', 'forwards')}; }
/* (jump-none: the last step lands before the end, since a plain steps() held forwards can stop a step short) */
${P} .ag-q0 .ag-qc { animation: ${an(t.q0, 'ag-wipe', STEPSQ[0])}, ${an(t.erase, 'ag-unwipe', STEPSQ[0], 'forwards')}; }
${P} .ag-q0 .ag-qk { animation: ${an(t.q0, 'ag-caret', STEPSQ[0])}, ${an(t.k0, 'ag-hide', 'linear', 'forwards')}, ${an([t.erase[0], .02], 'ag-show', 'linear', 'forwards')}, ${an(t.erase, 'ag-caretback', STEPSQ[0], 'forwards')}; }
${P} .ag-qx { animation: ${an(t.qx, 'ag-draw', EZ)}; }   /* (the strike, then 1.5 s to read what was struck before it is erased) */
${P} .ag-q1 { animation: ${an([t.q1[0], .05], 'ag-show', 'linear')}; }
${P} .ag-q1 .ag-qc { animation: ${an(t.q1, 'ag-wipe', STEPSQ[1])}; }
${P} .ag-q1 .ag-qk { animation: ${an([t.q1[0], t.k1[0] - t.q1[0]], 'ag-keep', 'linear')}, ${an(t.q1, 'ag-caret', STEPSQ[1])}, ${an(t.k1, 'ag-hide', 'linear', 'forwards')}; }
${P} .ag-qok { animation: ${an(t.ok, 'ag-pop', EZ)}; }
${P} .ag-beam0 { animation: ${an(t.s0, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar0 { animation: ${an(BAR0, 'ag-bar', 'linear', 'none')}; }
${P} .ag-t { animation: ag-fade .32s ${EZ} calc(${d(t.logs[0])}s + var(--c) * .03s + var(--ag-sh1)) both; }   /* (the logs cascade in by column) */
${P} .ag-tm { animation: ag-miss .48s ${STD} calc(${d(col(BAR0, 0))}s + var(--c) * ${per(BAR0)}s + var(--ag-sh1)) none; }   /* (the first sweep: each column flickers grey as the beam crosses it) */
${P} .ag-tl:not(.ag-tl-out) { animation: ag-on .32s ${EZ} calc(${d(col(BAR1, 0))}s + var(--c) * ${per(BAR1)}s + var(--ag-sh1)) both, ag-dimto ${t.dim[1]}s ${STD} calc(${d(t.dim[0])}s + (5 - var(--d)) * .06s + var(--ag-sh1)) forwards; }   /* (the second: each column lights as the beam crosses it, then they dim from the far edge inward, closing on the unusual one) */
${P} .ag-tl-out { animation: ag-light .32s ${EZ} calc(${d(col(BAR1, OUTT[1]))}s + var(--ag-sh1)) both; }
${P} .ag-n0 { animation: ${an(t.n0, 'ag-shake', EZ)}, ${an([t.erase[0], .22], 'ag-hide', STD, 'forwards')}; }
${P} .ag-gl0 { animation: ${an([t.gl0[0], .32], 'ag-rise', EZ, 'forwards')}, ${an([t.gl0[0] + t.gl0[1] - .22, .22], 'ag-hide', STD, 'forwards')}; }   /* (eased in, out a little faster) */
${P} .ag-gl1 { animation: ${an([t.gl1[0], .32], 'ag-rise', EZ, 'forwards')}, ${an([t.gl1[0] + t.gl1[1] - .22, .22], 'ag-hide', STD, 'forwards')}; }
${P} .ag-beam1 { animation: ${an(t.s1, 'ag-beam', 'linear', 'none')}; }
${P} .ag-bar1 { animation: ${an(BAR1, 'ag-bar', 'linear', 'none')}; }
/* (the count steps 4 a column as the beam lights each column, 4, 8 ... 32, landing as the beam leaves; "found" stays put) */
${P} .ag-fd { animation: ag-on .06s linear calc(${d(col(BAR1, 0))}s + var(--ag-sh1)) both; }
${P} .ag-cnv { animation: ag-on .06s linear calc(${d(col(BAR1, 0))}s + var(--j) * ${per(BAR1)}s + var(--ag-sh1)) both, ag-hide .06s linear calc(${d(col(BAR1, 0))}s + (var(--j) + 1) * ${per(BAR1)}s + var(--ag-sh1)) forwards; }
${P} .ag-cnv:last-child { animation: ag-on .06s linear calc(${d(col(BAR1, 7))}s + var(--ag-sh1)) both; }
${P} .ag-ring { animation: ${an(t.ring, 'ag-ring', SPRING)}; }
${P} .ag-qf { animation: ${an([t.s0[0] - .05, .32], 'ag-flash', STD, 'none')}, ${an([t.qx[0], t.k1[0] - t.qx[0] + .1], 'ag-work', STD, 'none')}, ${an([t.s1[0] - .05, .32], 'ag-flash', STD, 'none')}; }   /* (sent; lit while it is rewritten; sent again) */
${P} .ag-qw { animation: ${an(t.qw, 'ag-say', EZ)}; }
/* step 3: the unusual result lifts and grows into the lead card (one object: the card's frame starts as the tile), its
   words writing in line by line as it lands while Reporting's pen and the card's write together; then the packet runs
   the dashed line, uncovering it, and the analyst lights */
${PD} .ag-ln2 { animation: ${an(t.ln2, 'ag-draw')}; }
${PD} .ag-cf { animation: ${an(t.lift, 'ag-morph-d', 'linear')}; }
${PD} .ag-cft { animation: ${an(t.lift, 'ag-morph-d-t', 'linear')}; }
${PM} .ag-cf { animation: ${an([t.lift[0], SWELL + MOVE.m], 'ag-morph-m', 'linear', 'both', 1)}; }
${PM} .ag-cft { animation: ${an([t.lift[0], SWELL + MOVE.m], 'ag-morph-m-t', 'linear', 'both', 1)}; }
${[0, 1, 2].map(k => `${P} .ag-cc${k} { animation: ${an([t.write[0] + k * .06, .32], 'ag-say', EZ)}; }`).join('\n')}
${P} .ag-cpen { animation: ${an(t.write, 'ag-write', EZ)}; }   /* (the pen writes its mark) */
${[0, 1, 2].map(k => `${PM} .ag-cc${k} { animation: ${an([t.write[0] + PLATE + k * .06, .32], 'ag-say', EZ)}; }`).join('\n')}
${PM} .ag-cpen { animation: ${an([t.write[0] + PLATE, t.write[1]], 'ag-write', EZ)}; }
${PM} .ag-br .ag-bi { animation: ${an([t.write[0] + PLATE, t.write[1]], 'ag-scribble', STD, 'none')}; }
${P} .ag-trick { animation: ${an(t.trick, 'ag-say', EZ)}; }   /* (the caption last, once the card has its words) */
${P} .ag-hem { animation: ${an(t.pk, 'ag-unwipe', STD)}; }   /* (the line's mask widens in step with the packet, so the line extends behind it) */
${P} .ag-pk { animation: ${an(t.pk, 'ag-pk', STD, 'none')}; }
${P} .ag-ana { animation: ${an(t.ana, 'ag-spring', SPRING)}; }
${P} .ag-halo { animation: ${an(t.halo, 'ag-halo', EZ, 'none')}; }
${P} .ag-decides { animation: ${an([t.all[0], .32], 'ag-say', EZ)}; }   /* (once the halo has spread, so it never crosses it; the resolve comes with it) */
/* phones: Detection moves in one eased curve from its place in step 1 to its place in step 2, over the waiting words,
   the spine's run to step 2's number filling as it goes, and the number lights as it lands; the result grows into the
   card straight down a step, the run to step 3's number filling with it */
${PM} .ag-tk1 { animation: ${an(TV1, 'ag-trace', STD, 'both', 0)}; }
${PM} .ag-tv1 { animation: ${an(TV1, 'ag-tv1', 'linear', 'forwards', 0)}, ${an([TV1[0], .01], 'ag-show', 'linear', 'forwards', 0)}, ${an([TV1[0] + TV1[1] + .05, .1], 'ag-hide', 'linear', 'forwards', 0)}; }
${PM} .ag-s1 .ag-nd { animation: ${an([TV1[0] + TV1[1] - .1, .32], 'ag-nd', STD, 'none', 0)}; }
${PM} .ag-det { animation: ${an([TV1[0] + TV1[1] - .1, .12], 'ag-fade', STD, 'both', 0)}, ${an(t.detback, 'ag-back', STD, 'forwards', 1)}, ${an(t.all, 'ag-fwd', STD, 'forwards')}; }   /* (under the traveller, its exact size and place, just before it lands; it steps back as Reporting takes over) */
${PM} .ag-det .ag-bd { animation: ${RECV.slice(1).map(s => an([s, .32], 'ag-recv', STD, 'none')).join(', ')}; }
${PM} .ag-det .ag-bd .ag-b-glow { animation: ${an([TV1[0] + TV1[1] + .05, +(t.detglow[0] + t.detglow[1] + SH1 - TV1[0] - TV1[1] - .05).toFixed(2)], 'ag-glow', 'linear', 'none', 0)}; }   /* (its glow comes up once it has landed) */
${PM} .ag-tk2 { animation: ${an([t.lift[0], SWELL + MOVE.m], 'ag-trace', STD, 'both', 1)}; }
${PM} .ag-s2 .ag-nd { animation: ${an([t.lift[0] + SWELL + MOVE.m - .1, .32], 'ag-nd', STD, 'none', 1)}; }
${PM} .ag-wire-det { animation: none; }   /* (a phone keeps Detection's old wire, to its faint outline, throughout) */
${PM} .ag-det1 { animation: ${an([t.det[0], .22], 'ag-ghost', STD)}; }
${PM} .ag-det1 .ag-b { animation: ${an(t.bd, 'ag-recv', STD, 'none')}, ${an([t.lit[0], .32], 'ag-recv', STD, 'none')}; }   /* (it gets its part with the other two, then takes the hunch) */
${PM} .ag-det1 .ag-b text { animation: ${an(t.lit, 'ag-lit-t', STD)}, ${an([t.det[0], .22], 'ag-hide', STD)}; }   /* (its name goes as it leaves: only the outline stays) */
`;
fs.writeFileSync(path.join(OUT, 'scene-d.svg'), desktop());
fs.writeFileSync(path.join(OUT, 'scene-m.svg'), PH.svg);
fs.writeFileSync(path.join(OUT, 'scene.css'), css);
console.log('wrote scene-d.svg', desktop().length, 'scene-m.svg', PH.svg.length, '(phone 360x' + PH.H + ')', 'scene.css', css.length, 'ends ~', Math.max(...ends).toFixed(1) + 's', 'phone ~', (Math.max(...ends) + SH1 + SH2).toFixed(1) + 's');
