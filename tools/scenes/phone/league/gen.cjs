// Builds scene-m.html (the taller phone-only League "Spot a risky profile"
// scene) from the desktop svg (orig.svg.html, copied verbatim from
// experience.html). The artwork is reused as is; each stage is placed by one
// uniform transform, and only the connecting lines and captions are new.
const fs = require('fs'), path = require('path');
const D = __dirname, P = require('./params.json');
const src = fs.readFileSync(path.join(D, 'orig.svg.html'), 'utf8');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('marker ' + a); return src.slice(i, j); };
const ren = s => s
  .replace(/\blg-(frame|badge|bar|wire|link|route|node|leafc|leaf|pick|gauge|needle|review|head)\b/g, 'lg-m-$1')
  .replace(/\blg(Mono|Photo|Risk)\b/g, 'lgm$1');
const f = n => +n.toFixed(2);

const defs = ren(cut('<defs>', '<g class="lg-links"')) ;
const phone = ren(cut('<g class="lg-phone">', '<g fill="none" stroke="#6b827b"'));
let middle = ren(cut('<g fill="none" stroke="#6b827b"', '<path d="M267 74A33'));
// The desktop wire-out runs right into the dial; here the dial sits under
// the model, so its own arrow is drawn below in scene units.
middle = middle.replace(/<path class="lg-m-wire lg-m-wire-out"[^>]*>\s*<\/path>\s*/, '').replace(/<path class="lg-m-head"[^>]*>\s*<\/path>\s*/, '');
const dial = ren(cut('<path d="M267 74A33', '<g transform="translate(0 -4)">'));
const pill = ren(cut('<g class="lg-review">', '<g class="lg-caps">')).replace(/<\/g>\s*<\/g>\s*$/, '</g>');

// Stage transforms: x' = s*x + tx.
const ph = { s: P.phoneS, tx: P.phoneX - 14 * P.phoneS, ty: P.phoneY - 2 * P.phoneS };
const md = { s: P.midS, tx: P.iconX - 105.7 * P.midS, ty: P.modelY - 74 * P.midS };
const mx = (x, t = md) => t.s * x + t.tx, my = (y, t = md) => t.s * y + t.ty;
const modelCx = mx(211), boxBottom = my(96);
const dl = { s: P.dialS }; dl.tx = modelCx - 300 * dl.s; dl.ty = P.dialY - 74 * dl.s;
const pl = { s: P.pillS }; pl.tx = modelCx - 300 * pl.s; pl.ty = P.pillY - 102 * pl.s;
const T = t => `transform="translate(${f(t.tx)} ${f(t.ty)}) scale(${t.s})"`;

// Links: from under the bezel to each signal row's icon.
const lx0 = mx(84, ph) , lx1 = mx(102);
const starts = P.linkFrom.map(y => my(y, ph)), ends = [50, 74, 98].map(y => my(y));
const k = (lx1 - lx0) * 0.55;
const links = starts.map((y0, i) => `<path class="lg-m-link lg-m-link-${i + 1}" pathLength="100" d="M${f(lx0)} ${f(y0)}C${f(lx0 + k)} ${f(y0)} ${f(lx1 - k)} ${f(ends[i])} ${f(lx1)} ${f(ends[i])}"></path>`).join('');
const sw = f(1.2 * P.midS);
// Model to dial: a short drop with the desktop arrowhead's shape.
const oy0 = boxBottom + P.outGap, oy1 = P.dialY - 37 * dl.s - P.outGap;
const hw = 3.5 * P.midS * 0.9, hh = 4 * P.midS * 0.9;
const out = `<g fill="none" stroke="#849a93" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path class="lg-m-out" pathLength="100" d="M${f(modelCx)} ${f(oy0)}V${f(oy1)}"></path><path class="lg-m-head" d="M${f(modelCx - hw)} ${f(oy1 - hh)}L${f(modelCx)} ${f(oy1)}L${f(modelCx + hw)} ${f(oy1 - hh)}"></path></g>`;

const capSig = P.sigCx ?? mx((105.7 + 166) / 2), capY = P.capY;
const caps = `<g class="lg-caps" text-anchor="middle">` +
  `<text x="${f(capSig)}" y="${f(P.capTop)}">Signals</text>` +
  `<text x="${f(modelCx)}" y="${f(P.capTop)}">Model</text>` +
  `<text x="${f(modelCx)}" y="${f(capY)}">Risk</text></g>`;
// One plain note under each caption (owner, 25 Oct 2026: "appropriate and
// concise explanations"), in the A/B phone scene's note style; each fades in
// with its step and holds in the final frame.
const note = (i, x, y, lines) => `<text class="lg-m-note lg-m-note-${i}" text-anchor="middle">` +
  lines.map((t, j) => `<tspan x="${f(x)}" y="${f(y + j * P.noteLead)}">${t}</tspan>`).join('') + '</text>';
const notes = note(1, capSig, P.capTop + P.noteGap, P.notes[0]) + note(2, modelCx, P.capTop + P.noteGap, P.notes[1]) + note(3, modelCx, capY + P.noteGap, P.notes[2]);

const aria = (src.match(/aria-label="([^"]*)"/) || [])[1];
const svg = `<svg class="league-brand-scene league-brand-scene--m" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${P.H}" role="img" aria-label="${aria}">
${defs}<g class="lg-m-links" fill="none" stroke="#849a93" stroke-width="${f(1.2 * P.phoneS * 0.9)}" stroke-linecap="round">${links}</g>
<g ${T(ph)}>${phone}</g>
<g ${T(md)}>${middle}</g>
${out}
<g ${T(dl)}>${dial}</g>
<g ${T(pl)}>${pill}</g>
${caps}
${notes}
</svg>
`;
fs.writeFileSync(path.join(D, 'scene-m.html'), svg);
console.log(JSON.stringify({ ph, md, dl, pl, modelCx: f(modelCx), boxBottom: f(boxBottom), starts: starts.map(f), ends: ends.map(f), lx0: f(lx0), lx1: f(lx1) }));
// Keep the plot's shape in step with the viewBox.
const cssPath = path.join(D, 'scene-m.css');
fs.writeFileSync(cssPath, fs.readFileSync(cssPath, 'utf8').replace(/aspect-ratio: 360 \/ \d+(\.\d+)?;/, `aspect-ratio: 360 / ${P.H};`));
