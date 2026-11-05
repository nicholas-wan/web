// Writes the breathing chips' halo keyframes into assets/css/custom.css,
// between the peek-halo markers.   node tools/css/peek-breathe-halo.cjs
//
// The breath used to animate the chip's box-shadow out to a 5px halo
// (2.6s, ease-in-out, peak at 50%), which repainted the chip every frame.
// Its .peek-glow span now holds five 1px rings, one per pixel of that
// spread, and only their opacity animates, so the compositor runs it. Each
// ring's opacity is the old halo at the same moment: with e the eased
// progress, the old spread reached 5e px at alpha 0.14e, so ring k (k-1 to
// k px out) shows e, and the ring the edge is crossing shows e times the
// fraction it covers. The rings run over 1.3s, alternate, which is the old
// 2.6s rise and fall.
const fs = require('fs');
const path = require('path');

const RINGS = 5;
const STEP = 0.02; // sample every 2% of the rise
const TOLERANCE = 0.004; // drop a sample that linear interpolation already meets

// CSS ease-in-out: cubic-bezier(0.42, 0, 0.58, 1).
function ease(t) {
  const bez = (u, a, b) => 3 * u * (1 - u) * (1 - u) * a + 3 * u * u * (1 - u) * b + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.42, 0.58) < t) lo = mid; else hi = mid;
  }
  return bez((lo + hi) / 2, 0, 1);
}
const ring = (k, t) => { const e = ease(t); return e * Math.min(1, Math.max(0, RINGS * e - (k - 1))); };

function keyframes(k) {
  const n = Math.round(1 / STEP);
  let points = [];
  for (let i = 0; i <= n; i++) { const t = i / n; points.push([t, ring(k, t)]); }
  // Leading zeros: keep only the last one, where the ring starts to show.
  const first = points.findIndex(p => p[1] > 0);
  points = points.slice(Math.max(0, first - 1));
  // Drop samples the straight line between their kept neighbours meets.
  const kept = [0];
  for (let i = 1; i < points.length - 1; i++) {
    const last = kept[kept.length - 1], a = points[last], c = points[i + 1];
    const meets = p => Math.abs(a[1] + (c[1] - a[1]) * (p[0] - a[0]) / (c[0] - a[0]) - p[1]) <= TOLERANCE;
    if (!points.slice(last + 1, i + 1).every(meets)) kept.push(i);
  }
  kept.push(points.length - 1);
  const pct = t => +(t * 100).toFixed(1) + '%';
  const op = v => (+v.toFixed(3)).toString().replace(/^0\./, '.');
  return `@keyframes peek-halo-${k} { ${kept.map(i => `${pct(points[i][0])} { opacity: ${op(points[i][1])}; }`).join(' ')} }`;
}

const css = Array.from({ length: RINGS }, (_, i) => keyframes(i + 1)).join('\n');
const file = path.join(__dirname, '..', '..', 'assets', 'css', 'custom.css');
const START = '/* peek-halo:start */', STOP = '/* peek-halo:end */';
const sheet = fs.readFileSync(file, 'utf8');
const a = sheet.indexOf(START), b = sheet.indexOf(STOP);
if (a < 0 || b < a) throw new Error('no peek-halo markers in custom.css');
const eol = sheet.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(file, sheet.slice(0, a + START.length) + eol + css.replace(/\n/g, eol) + eol + sheet.slice(b));
console.log(css);
