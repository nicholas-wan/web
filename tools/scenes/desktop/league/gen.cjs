// Builds scene-d.html and scene-d.css: the desktop League "Spot a risky
// profile" scene with a bold step caption and a short plain note under each
// stage, as on phones. Reads orig-d.html, the desktop svg before notes (copied from experience.html)
// (svg.league-brand-scene, not the --m copy), keeps its artwork, classes and
// timings, and only spaces the three stages out so the notes fit side by
// side: the phone and signals stay put, the model and the dial with its pill
// each move right by one translate, the wires between them are redrawn to
// the new gaps, and the viewBox grows from 150 to H units tall.
// Run: node tools/scenes/desktop/league/gen.cjs
const fs = require('fs'), path = require('path');
const D = __dirname, ROOT = path.join(D, '..', '..', '..', '..');
const f = n => +n.toFixed(2);
const P = {
  H: 160,          // viewBox height (was 150)
  x0: 11,          // viewBox left; the phone's side buttons sit 2 units in
  capSize: 11,     // caption font size, units (about 12.8px at 1366)
  noteSize: 10,    // note font size, units (about 11.6px at 1366)
  gap: 14,         // clear space between neighbouring notes, units
  capY: 128,       // caption baseline
  noteY: 142,      // first note line baseline
  noteLead: 12.5,
  // Approved wording (identical to the phone scene), one array per stage.
  notes: [['Photo, bio and', 'other clues.'], ['A classifier', 'weighs them.'], ['Risky profiles go', 'to manual review.']],
  // Widest line of each note at 1 unit of Merriweather 300 (measured in
  // Chromium with the site's font: 66.7, 80, 83.1 at 10 units).
  noteW: [6.67, 8.0, 8.31],
};
// Optional --H=<units> to match another card's height (the League row's two
// cards share one slot): the extra height goes half above the artwork, half
// between the artwork and the captions, and the note leading opens slightly.
const argH = +((process.argv.find(a => a.startsWith('--H=')) || '').slice(4));
let top = 0;
if (argH && argH !== P.H) {
  const extra = argH - P.H;
  top = -f(extra / 2); P.capY += f(extra / 4); P.noteY += f(extra / 4); P.noteLead += f(Math.min(1, extra / 20)); P.H = argH;
}

// The current desktop svg, nested <svg> (the photo) included.
const page = fs.readFileSync(path.join(D, 'orig-d.html'), 'utf8'); // the desktop svg before notes
const i0 = page.indexOf('<svg class="league-brand-scene"');
if (i0 < 0) throw new Error('desktop svg not found');
let depth = 0, i1 = -1;
for (const m of page.slice(i0).matchAll(/<svg\b|<\/svg>/g)) {
  depth += m[0] === '</svg>' ? -1 : 1;
  if (!depth) { i1 = i0 + m.index + 6; break; }
}
let svg = page.slice(i0, i1);
const swap = (from, to) => { if (!svg.includes(from)) throw new Error('missing: ' + from); svg = svg.replace(from, to); };

// Columns. Signals stay centred at 136 (icons 105.7 to bars 166); each note
// is centred under its stage and the next stage sits one gap further on.
const w = P.noteW.map(k => k * P.noteSize), pillW = 98.5;
const sigCx = 136;
const modCx = sigCx + w[0] / 2 + P.gap + w[1] / 2;
const riskCx = modCx + w[1] / 2 + P.gap + w[2] / 2;
const dxM = f(modCx - 211), dxR = f(riskCx - 300);
const right = P.x0 + 360;
if (riskCx + pillW / 2 > right - 1) throw new Error('pill overruns the right edge: ' + f(riskCx + pillW / 2));

swap(/viewBox="[^"]*"/.exec(svg)[0], `viewBox="${P.x0} ${top} 360 ${P.H}"`);
// Wires: signals to the model's root, then model to dial.
const mIn = 187 + dxM, k = (mIn - 170) / 17;
swap('d="M170 50C181 50 178 74 187 74"', `d="M170 50C${f(170 + 11 * k)} 50 ${f(mIn - 9 * k)} 74 ${f(mIn)} 74"`);
swap('d="M170 74H187"', `d="M170 74H${f(mIn)}"`);
swap('d="M170 98C181 98 178 74 187 74"', `d="M170 98C${f(170 + 11 * k)} 98 ${f(mIn - 9 * k)} 74 ${f(mIn)} 74"`);
swap('d="M238 74H254"', `d="M${f(238 + dxM)} 74H${f(254 + dxR)}"`);
swap('d="M250 70.5L254 74L250 77.5"', `d="M${f(250 + dxR)} 70.5L${f(254 + dxR)} 74L${f(250 + dxR)} 77.5"`);
// The model and the dial move as wholes. The needle's pivot (300 74, in
// view-box units) is applied in its own user space, so it moves with them.
swap('<g class="lg-model">', `<g transform="translate(${dxM} 0)"><g class="lg-model">`);
const dialStart = '<path d="M267 74A33 33 0 0 1 333 74" fill="none" stroke="#e6eeec"';
const hub = '<circle cx="300" cy="74" r="3" fill="#26332f"></circle>';
swap('</g>\n' + dialStart, '</g></g>\n<g transform="translate(' + dxR + ' 0)">' + dialStart);
swap(hub, hub + '</g>');
swap('<g transform="translate(0 -4)"><g class="lg-review">', `<g transform="translate(${dxR} -4)"><g class="lg-review">`);
// Captions on one row, each centred over its note.
const caps = svg.match(/<g class="lg-caps">[\s\S]*?<\/g>/)[0];
const xs = [sigCx, modCx, riskCx];
const notes = P.notes.map((lines, n) => `<text class="lg-d-note lg-d-note-${n + 1}" text-anchor="middle">` +
  lines.map((t, j) => `<tspan x="${f(xs[n])}" y="${f(P.noteY + j * P.noteLead)}">${t}</tspan>`).join('') + '</text>').join('');
swap(caps, `<g class="lg-caps">` +
  ['Signals', 'Model', 'Risk'].map((t, n) => `<text x="${f(xs[n])}" y="${P.capY}" text-anchor="middle">${t}</text>`).join('') +
  `</g>\n<g class="lg-d-notes">${notes}</g>`);
fs.writeFileSync(path.join(D, 'scene-d.html'), svg);

const S = 'svg.league-brand-scene:not(.league-brand-scene--m)';
const css = `/* The League, "Spot a risky profile", desktop: a plain note under each
   step caption, as on phones (owner, 26 Oct 2026: "desktop charts dont have
   this fidelity of descriptions"). Generated by
   tools/scenes/desktop/league/gen.cjs. The svg is ${P.H} units tall (was 150),
   the stages spaced so the notes sit side by side. Base styles are the final
   frame; each note fades in as its step starts under .is-playing, and
   .is-still (reduced motion) holds it. */
.internship-demo-card__plot > ${S} { aspect-ratio: 360 / ${P.H}; }
${S} .lg-caps text { font-size: ${P.capSize}px; }
${S} .lg-d-note { font-family: Merriweather, Georgia, serif; font-size: ${P.noteSize}px; font-weight: 300; fill: #596273; }
.is-playing ${S} .lg-d-note-1 { animation: lgd-note 0.5s ease 0.2s both; }
.is-playing ${S} .lg-d-note-2 { animation: lgd-note 0.5s ease 2.45s both; }
.is-playing ${S} .lg-d-note-3 { animation: lgd-note 0.5s ease 4.3s both; }
@keyframes lgd-note { from { opacity: 0; } to { opacity: 1; } }
`;
fs.writeFileSync(path.join(D, 'scene-d.css'), css);
console.log(JSON.stringify({ viewBox: `${P.x0} ${top} 360 ${P.H}`, sigCx, modCx: f(modCx), riskCx: f(riskCx), dxM, dxR, pillRight: f(riskCx + pillW / 2), right }));
