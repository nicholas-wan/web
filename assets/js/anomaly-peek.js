/* Anomaly peek: the flavour of anomaly detection on the Cyber Detection
   Analytics card, kept small until asked for (Oct 2026, owner-approved after
   a lab trial). Work page only.
   - A call to action sits above three chips (Phishing domains, Statistical
     baseline, Graph analysis), each with a tiny live preview. On arrival the
     previews play for about four seconds, rest on their amber flags, and each
     chip glows once; at most every 20s, and every 15s while on screen.
   - Hovering, focusing or tapping a chip opens only that chart, in a card
     below the chips (never over the writeup). A click or tap pins it and
     eases the page to frame it; leaving, Escape or a tap elsewhere closes it
     (an inline card on phones and touch tablets closes from its chip).
   - A chart animates only while open and on screen. Reduced motion (even
     mid-visit): still frames. All data is simulated, so no disclaimer. */
(function () {
  'use strict';
  var root = document.querySelector('.anomaly-peek');
  if (!root) { return; }
  var NS = 'http://www.w3.org/2000/svg';
  var motionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = !!(motionQuery && motionQuery.matches);

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) { node.setAttribute(k, attrs[k]); }
    if (parent) { parent.appendChild(node); }
    return node;
  }
  function ease(f) { return f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; }
  function lerp(a, b, f) { return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
  function clamp(f) { return Math.max(0, Math.min(1, f)); }

  // ---- Simulated signal shared by the mini preview and the full chart ----
  // Uniform noise on ±6 has sigma 6/sqrt(3); the normal range is the expected
  // level ± 3 sigma, which plain noise never leaves. Two periodic anomalies.
  var SIGMA = 6 / Math.sqrt(3), BAND = 3 * SIGMA, MAX = 120;
  function expected(t) { return 58 + 20 * Math.sin(t / 9) + 7 * Math.sin(t / 3.1); }
  function noise(t) { var s = Math.sin(t * 12.9898 + 78.233) * 43758.5453; return ((s - Math.floor(s)) * 2 - 1) * 6; }
  function sample(t) {
    var v = expected(t) + noise(t);
    if (t % 37 === 19) { v += 7 * SIGMA; } else if (t % 53 === 30) { v -= 6 * SIGMA; }
    return v;
  }

  // ---- One animation loop for whatever is currently live ----
  var tickers = [], rafId = null, last = 0;
  function loop(ts) {
    var dt = Math.min(100, ts - last);
    last = ts;
    tickers = tickers.filter(function (t) { return t.live(); });
    tickers.forEach(function (t) { t.tick(dt); });
    rafId = tickers.length ? window.requestAnimationFrame(loop) : null;
  }
  function wake(ticker) {
    if (tickers.indexOf(ticker) < 0) { tickers.push(ticker); }
    if (rafId === null) { rafId = window.requestAnimationFrame(function (ts) { last = ts; loop(ts); }); }
  }

  // ---- Full time-series chart ----
  function createSeries(host) {
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false' }, host);
    var clipId = 'peek-clip-' + Math.random().toString(36).slice(2, 8);
    var clipRect = el('rect', {}, el('clipPath', { id: clipId }, el('defs', {}, svg)));
    var axis = el('line', { class: 'peek-axis' }, svg);
    var slide = el('g', {}, el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg));
    var band = el('path', { class: 'peek-band' }, slide);
    var mid = el('path', { class: 'peek-mid' }, slide);
    var line = el('path', { class: 'peek-line' }, slide);
    var flags = el('g', {}, slide);
    var W = 0, H = 130, N = 60, dx = 0, pad = { top: 20, right: 6, bottom: 16, left: 6 };
    var t0 = 0, phase = 0, drawnIn = false, STEP = 900;
    function y(v) { return pad.top + (H - pad.top - pad.bottom) * (1 - v / MAX); }
    function x(i) { return pad.left + i * dx; }
    function layout() {
      W = Math.round(host.clientWidth) || 300;
      N = Math.max(30, Math.round(W / 6.5));
      dx = (W - pad.left - pad.right) / (N - 1);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      clipRect.setAttribute('x', pad.left); clipRect.setAttribute('y', 0);
      clipRect.setAttribute('width', W - pad.left - pad.right); clipRect.setAttribute('height', H);
      axis.setAttribute('x1', pad.left); axis.setAttribute('x2', W - pad.right);
      axis.setAttribute('y1', H - pad.bottom + 0.5); axis.setAttribute('y2', H - pad.bottom + 0.5);
      draw();
    }
    function draw() {
      var top = '', bottom = '', m = '', l = '';
      flags.textContent = '';
      for (var i = 0; i <= N; i++) {
        var t = t0 + i, e = expected(t), v = sample(t), px = x(i).toFixed(1);
        top += (i ? 'L' : 'M') + px + ' ' + y(e + BAND).toFixed(1);
        m += (i ? 'L' : 'M') + px + ' ' + y(e).toFixed(1);
        l += (i ? 'L' : 'M') + px + ' ' + y(v).toFixed(1);
        var z = (v - e) / SIGMA;
        if (Math.abs(z) > 3) {
          var fx = x(i), fy = y(v);
          var ring = el('circle', { class: 'peek-pulse', cx: fx, cy: fy, r: 4.5 }, flags);
          ring.style.animationDelay = (-(performance.now() % 1600)).toFixed(0) + 'ms';
          el('circle', { class: 'peek-flag', cx: fx, cy: fy, r: 4.5 }, flags);
          var label = el('text', { class: 'peek-label', x: fx, y: fy + (z > 0 ? -10 : 19), 'text-anchor': 'middle' }, flags);
          label.textContent = (z > 0 ? '+' : '−') + Math.abs(z).toFixed(1) + 'σ';
        }
      }
      for (var j = N; j >= 0; j--) { bottom += 'L' + x(j).toFixed(1) + ' ' + y(expected(t0 + j) - BAND).toFixed(1); }
      band.setAttribute('d', top + bottom + 'Z');
      mid.setAttribute('d', m);
      line.setAttribute('d', l);
      slide.setAttribute('transform', 'translate(' + (-phase * dx).toFixed(2) + ' 0)');
    }
    function drawIn() {
      if (drawnIn || reduce) { drawnIn = true; return; }
      drawnIn = true;
      var len = line.getTotalLength();
      line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      svg.classList.add('is-drawing');
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 820ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      line.style.strokeDashoffset = '0';
      window.setTimeout(function () {
        line.style.transition = ''; line.style.strokeDasharray = ''; line.style.strokeDashoffset = '';
        svg.classList.remove('is-drawing');
      }, 860);
    }
    return {
      layout: layout,
      open: function () { if (Math.abs(host.clientWidth - W) >= 1) { layout(); } drawIn(); },
      tick: function (dt) {
        phase += dt / STEP;
        if (phase >= 1) { t0 += Math.floor(phase); phase %= 1; draw(); }
        else { slide.setAttribute('transform', 'translate(' + (-phase * dx).toFixed(2) + ' 0)'); }
      },
      setPaused: function (p) { svg.classList.toggle('is-paused', p); }
    };
  }

  // ---- Full graph chart: usual links, packets, an unusual link that comes and goes ----
  var NODES = [[0.10, 0.28], [0.08, 0.72], [0.27, 0.50], [0.30, 0.14], [0.26, 0.88],
    [0.70, 0.18], [0.90, 0.38], [0.68, 0.62], [0.90, 0.80], [0.52, 0.36]];
  var EDGES = [[0, 2], [1, 2], [3, 2], [4, 2], [2, 9], [9, 5], [9, 7], [5, 6], [7, 8], [6, 8], [0, 3], [1, 4], [9, 6], [2, 7]];
  var ODD = [[4, 5], [3, 8], [1, 6], [0, 7]];
  function createGraph(host) {
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false' }, host);
    var CYCLE = 6500, GROW = 600, TRAVEL = 900, HOLD = 3600, FADE = 600;
    var W = 0, H = 130, pts = [];
    var edgeEls = EDGES.map(function () { return el('line', { class: 'peek-edge' }, svg); });
    var odd = el('path', { class: 'peek-odd', fill: 'none' }, svg);
    var nodeEls = NODES.map(function () { return el('circle', { class: 'peek-node', r: 4 }, svg); });
    var packets = [0, 1, 2].map(function () { return el('circle', { class: 'peek-packet', r: 2.2 }, svg); });
    var oddPacket = el('circle', { class: 'peek-odd-packet', r: 3 }, svg);
    var ring = el('circle', { class: 'peek-ring', r: 4 }, svg);
    var label = el('text', { class: 'peek-label', 'text-anchor': 'middle' }, svg);
    label.textContent = 'Unusual link';
    var gt = GROW + TRAVEL + 1300, nextPacket = 0, live = [], bends = [];
    // Each unusual link bows only as far as it must to miss every other node;
    // its label sits just above its middle, wherever it crosses the fewest
    // usual links (review, Oct 2026: it sat on a grey edge by the target).
    function bez(a, k, b, f) { return lerp(lerp(a, k, f), lerp(k, b, f), f); }
    function bend(pair, lw) {
      var a = pts[pair[0]], b = pts[pair[1]], m = lerp(a, b, 0.5), len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      var nx = (a.y - b.y) / len, ny = (b.x - a.x) / len, best = null;
      for (var i0 = 0; i0 < 21; i0++) {
        var s = (i0 % 2 ? -4 : 4) * Math.ceil(i0 / 2);
        if (best && best.gap >= 14) { break; }
        var k = { x: m.x + nx * s * 2, y: m.y + ny * s * 2 }, gap = Infinity;
        for (var i = 1; i < 24; i++) {
          var q = bez(a, k, b, i / 24);
          if (q.y < 6 || q.y > H - 6) { gap = -1; }
          pts.forEach(function (n, j) { if (j !== pair[0] && j !== pair[1]) { gap = Math.min(gap, Math.hypot(q.x - n.x, q.y - n.y)); } });
        }
        if (!best || gap > best.gap) { best = { k: k, gap: gap }; }
      }
      var k = best.k, lab = null;
      [0.5, 0.42, 0.58, 0.34, 0.66].forEach(function (f) {
        var q = bez(a, k, b, f);
        // Above the curve first; then below, or beside it where it runs steep.
        [[0, -7], [0, 15], [lw / 2 + 8, 4], [-lw / 2 - 8, 4]].forEach(function (o) {
          var x = Math.max(lw / 2 + 3, Math.min(W - lw / 2 - 3, q.x + o[0])), y = Math.max(13, Math.min(H - 3, q.y + o[1])), hits = 0;
          function hit(p) { if (Math.abs(p.x - x) < lw / 2 + 6 && p.y > y - 15 && p.y < y + 6) { hits++; } }
          EDGES.forEach(function (e) { for (var i = 0; i <= 40; i++) { hit(lerp(pts[e[0]], pts[e[1]], i / 40)); } });
          for (var i = 0; i <= 60; i++) { hit(bez(a, k, b, i / 60)); }
          pts.forEach(function (n) { hit(n); hit({ x: n.x, y: n.y - 4 }); hit({ x: n.x, y: n.y + 4 }); });
          if (!lab || hits < lab.hits) { lab = { x: x, y: y, hits: hits }; }
        });
      });
      return { k: k, lab: lab };
    }
    function layout() {
      W = Math.round(host.clientWidth) || 300;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      pts = NODES.map(function (p) { return { x: 12 + p[0] * (W - 24), y: 18 + p[1] * (H - 36) }; });
      EDGES.forEach(function (e, k) {
        edgeEls[k].setAttribute('x1', pts[e[0]].x); edgeEls[k].setAttribute('y1', pts[e[0]].y);
        edgeEls[k].setAttribute('x2', pts[e[1]].x); edgeEls[k].setAttribute('y2', pts[e[1]].y);
      });
      nodeEls.forEach(function (n, k) { n.setAttribute('cx', pts[k].x); n.setAttribute('cy', pts[k].y); });
      var lw = 66;
      try { lw = label.getComputedTextLength() || lw; } catch (e) {}
      bends = ODD.map(function (pair) { return bend(pair, lw); });
      render(false);
    }
    function render(withPackets) {
      if (withPackets && gt >= nextPacket) {
        var e = EDGES[Math.floor(Math.random() * EDGES.length)];
        live.push({ e: Math.random() < 0.5 ? e : [e[1], e[0]], start: gt });
        nextPacket = gt + 420;
      }
      live = live.filter(function (p) { return gt - p.start < 1100; });
      packets.forEach(function (c, k) {
        var p = withPackets && live[k];
        if (!p) { c.setAttribute('visibility', 'hidden'); return; }
        var q = lerp(pts[p.e[0]], pts[p.e[1]], ease((gt - p.start) / 1100));
        c.setAttribute('cx', q.x.toFixed(1)); c.setAttribute('cy', q.y.toFixed(1)); c.setAttribute('visibility', 'visible');
      });
      var c = gt % CYCLE, pick = Math.floor(gt / CYCLE) % ODD.length, pair = ODD[pick], bd = bends[pick];
      var a = pts[pair[0]], b = pts[pair[1]];
      var fade = c > HOLD ? Math.max(0, 1 - (c - HOLD) / FADE) : 1;
      // Grow along the bow: the first part of the curve, cut at f.
      var f = ease(Math.min(1, c / GROW)), end = bez(a, bd.k, b, f), kf = lerp(a, bd.k, f);
      odd.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'Q' + kf.x.toFixed(1) + ' ' + kf.y.toFixed(1) + ' ' + end.x.toFixed(1) + ' ' + end.y.toFixed(1));
      odd.style.opacity = fade.toFixed(3);
      var tp = (c - GROW) / TRAVEL;
      if (tp > 0 && tp < 1) {
        var q = bez(a, bd.k, b, ease(tp));
        oddPacket.setAttribute('cx', q.x.toFixed(1)); oddPacket.setAttribute('cy', q.y.toFixed(1)); oddPacket.setAttribute('visibility', 'visible');
      } else { oddPacket.setAttribute('visibility', 'hidden'); }
      var rp = (c - GROW - TRAVEL) / 1200;
      if (rp > 0 && rp < 1) {
        ring.setAttribute('cx', b.x); ring.setAttribute('cy', b.y);
        ring.setAttribute('r', (4 + rp * 10).toFixed(1)); ring.style.opacity = (0.9 * (1 - rp)).toFixed(3);
        ring.setAttribute('visibility', 'visible');
      } else { ring.setAttribute('visibility', 'hidden'); }
      nodeEls.forEach(function (n, k) { n.classList.toggle('is-odd', k === pair[1] && c > GROW + TRAVEL && fade > 0); });
      label.setAttribute('x', bd.lab.x.toFixed(1));
      label.setAttribute('y', bd.lab.y.toFixed(1));
      label.style.opacity = (c > GROW ? fade : 0).toFixed(3);
    }
    return {
      layout: layout,
      open: function () { if (Math.abs(host.clientWidth - W) >= 1) { layout(); } },
      tick: function (dt) { gt += dt; render(true); },
      setPaused: function () {}
    };
  }

  // ---- Phishing domains: a copy lifts off a real sign-in page, matching
  // features link up, then a dot swapped for a hyphen and an altered logo are
  // marked and the copy is outlined. A one-line key names each difference as
  // it shows, its swatch matching the mark, so the pages stay clean (owner,
  // Oct 2026: the logo is "changed slightly to avoid detection"). Unnumbered:
  // it names what differs, not the detector's steps.
  var TEAL = '#11807d', AMBER = '#c46d1c', INK = '#20343d', SOFT = '#d7e4e2';
  function dash(node, f) { node.setAttribute('stroke-dashoffset', (1 - f).toFixed(3)); node.setAttribute('visibility', f > 0 ? 'visible' : 'hidden'); }
  function drawable(node) { node.setAttribute('pathLength', 1); node.setAttribute('stroke-dasharray', '1 1'); return node; }
  function createSite(host) {
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false' }, host);

    var depthId='depth-'+Math.random().toString(36).slice(2,8), defs=el('defs',{},svg);
    var surface=el('linearGradient',{id:depthId+'surface',x1:0,y1:0,x2:0,y2:1},defs);
    el('stop',{offset:0,'stop-color':'#ffffff'},surface);el('stop',{offset:1,'stop-color':'#f4f7f5'},surface);
    var buttonGradient=el('linearGradient',{id:depthId+'button',x1:0,y1:0,x2:0,y2:1},defs);
    el('stop',{offset:0,'stop-color':'#249b91'},buttonGradient);el('stop',{offset:1,'stop-color':'#076b69'},buttonGradient);
    // Pages sit 6 higher than before the key, so the plot keeps its 130.
    var W = 0, H = 130, PY = 8, PH = 104, pw = 0, x0 = 4, x1 = 0, t = 0, DUR = 4800, LOOP = 10000;
    var pages = [], marks = {}, swapX = 0, swapW = 0, tx = 22, idle = false;
    // A dot swapped for a hyphen (eservices.example.sg -> eservices-example.sg).
    // Narrow bars use the shorter "my" pair rather than cutting the address.
    var NAMES = ['eservices', 'my'], name = NAMES[0];
    function fill(p) {
      p.url.textContent = name + (p.fake ? '' : '.example.sg');
      if (!p.fake) { return; }
      p.swap = el('tspan', {}, p.url); p.swap.textContent = '-';
      p.url.appendChild(document.createTextNode('example.sg'));
    }
    function page(fake) {
      var g = el('g', {}, svg), p = { g: g };
      p.shadow = el('rect',{y:PY+3,height:PH,rx:9,fill:'#173e35',opacity:0.10},g);
      p.box = el('rect', { y: PY, height: PH, rx: 9, fill: 'url(#'+depthId+'surface)', stroke: '#bbd0c8', 'stroke-width': 1.2 }, g);
      // Compact browser chrome, inside the existing card footprint.
      p.chrome = el('path',{fill:'#e8efec'},g);
      [9,14,19].forEach(function(x){el('circle',{cx:x,cy:PY+5.5,r:1.35,fill:'#91aaa0'},g);});
      p.tab = el('path',{fill:'#fff',stroke:'#d5e1db','stroke-width':0.65},g);
      p.divider = el('path',{fill:'none',stroke:'#d8e4de','stroke-width':0.7},g);
      p.bar = el('rect', { x: 6, y: PY + 12, height: 18, rx: 4, fill: '#f2f8f7' }, g);
      p.bar.setAttribute('stroke','#ffffff');p.bar.setAttribute('stroke-width','0.8');
      p.lock = el('g', {}, g);
      el('path', { d: 'M12 ' + (PY + 15) + 'v-2a2.5 2.5 0 0 1 5 0v2', fill: 'none', stroke: TEAL, 'stroke-width': 1.2, opacity: 0.7 }, p.lock);
      el('rect', { x: 11, y: PY + 14.5, width: 7, height: 5, rx: 1.2, fill: TEAL, opacity: 0.7 }, p.lock);
      if(fake){p.highlight=el('rect',{y:PY+14,height:16,rx:2,fill:AMBER,opacity:0},g);}
      p.url = el('text', { class: 'peek-url', x: 22, y: PY + 25.5 }, g);
      p.logo = el('circle', { r: fake ? 9 : 10, fill: fake ? '#2a9d8a' : TEAL }, g);
      p.tick = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': fake ? 2.4 : 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      p.title = el('rect', { y: PY + 62, height: 5, rx: 2.5, fill: INK, opacity: 0.78 }, g);
      p.field = el('rect', { x: 12, y: PY + 73, height: 10, rx: 3, fill: 'none', stroke: SOFT }, g);
      p.button = el('rect', { x: 12, y: PY + 88, height: 11, rx: 4, fill: TEAL }, g);
      p.scan = el('g', { opacity: 0 }, g);
      el('rect', { x: -5, y: PY + 2, width: 10, height: PH - 4, rx: 5, fill: TEAL, opacity: 0.08 }, p.scan);
      el('rect', { x: -1, y: PY + 2, width: 2, height: PH - 4, rx: 1, fill: TEAL, opacity: 0.55 }, p.scan);
      p.button.setAttribute('fill','url(#'+depthId+'button)');
      p.field.setAttribute('fill','#ffffff');p.field.setAttribute('stroke','#c5d8d0');
      p.edge=el('path',{fill:'none',stroke:'#ffffff','stroke-width':1,opacity:0.8},g);
      p.fake = fake;
      return p;
    }
    pages = [page(false), page(true)];
    var real = pages[0], fake = pages[1], stroke = { fill: 'none', stroke: AMBER, 'stroke-width': 1.5, 'stroke-linecap': 'round' };
    ['url', 'logo', 'outline'].forEach(function (k) { marks[k] = drawable(el('path', stroke, svg)); });
    marks.outline.setAttribute('stroke-width', 1.8);
    var halo = el('rect', { fill: 'none', stroke: AMBER, 'stroke-width': 1 }, svg);
    // Compare the same features on both pages, then retain only the differences.
    var referenceMark = drawable(el('path', {fill:'none',stroke:TEAL,'stroke-width':1.5,'stroke-linecap':'round'}, svg));
    var comparisonLink = drawable(el('path', {fill:'none',stroke:TEAL,'stroke-width':1,'stroke-dasharray':'2 3',opacity:0.45}, svg));
    var referenceLogo = drawable(el('path', {fill:'none',stroke:TEAL,'stroke-width':1,opacity:0.6}, svg));
    var tag = el('g', {}, svg);
    var tagBox = el('rect', { width: 64, height: 16, rx: 8, fill: AMBER }, tag);
    var tagText = el('text', { class: 'peek-tag', 'text-anchor': 'middle' }, tag);
    tagText.textContent = 'Phishing';
    // The key: each entry's swatch repeats its mark (a marked character, a ring).
    function keyItem(label, ring) {
      var g = el('g', {}, svg), k = { g: g };
      if (ring) { el('circle', { cx: 5, cy: -4, r: 4.5, fill: 'none', stroke: AMBER, 'stroke-width': 1.5 }, g); }
      else {
        el('rect', { x: 1.5, y: -10, width: 7, height: 11, rx: 1.5, fill: AMBER, opacity: 0.18 }, g);
        el('path', { d: 'M2 0.5h6', stroke: AMBER, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
        el('text', { class: 'peek-url', x: 5, y: -1.5, 'text-anchor': 'middle', style: 'fill:' + AMBER }, g).textContent = '-';
      }
      k.text = el('text', { class: 'peek-key', x: 15 }, g);
      k.text.textContent = label;
      return k;
    }
    var legend = [keyItem('Domain squatting', false), keyItem('Altered logo', true)];
    function layout() {
      W = Math.round(host.clientWidth) || 300;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      // The narrowest phones tighten the gap and padding so the address fits.
      var narrow = W < 240, gap = Math.max(narrow ? 6 : 14, Math.min(24, W * 0.06)), inset = narrow ? 3 : 6;
      x0 = narrow ? 2 : 4; pw = (W - 2 * x0 - gap) / 2; x1 = x0 + pw + gap; tx = narrow ? 17 : 22;
      pages.forEach(function (p) {
        p.url.setAttribute('x', tx); p.url.setAttribute('letter-spacing', narrow ? -0.2 : 0);
        p.lock.setAttribute('transform', 'translate(' + (tx - 22) + ' 6)');
        p.bar.setAttribute('x', inset); p.bar.setAttribute('width', pw - 2 * inset);
        var cx = pw / 2 + (p.fake ? 2 : 0), cy = PY + (p.fake ? 45 : 44);
        p.chrome.setAttribute('d','M0 '+(PY+9)+'Q0 '+PY+' 9 '+PY+'H'+(pw-9)+'Q'+pw+' '+PY+' '+pw+' '+(PY+9)+'V'+(PY+33)+'H0Z');
        p.tab.setAttribute('d','M27 '+(PY+10)+'L29 '+(PY+3)+'H'+Math.min(65,pw-10)+'L'+Math.min(68,pw-7)+' '+(PY+10)+'Z');
        p.divider.setAttribute('d','M1 '+(PY+33)+'H'+(pw-1));
        p.box.setAttribute('width', pw);p.shadow.setAttribute('width',pw);
        p.edge.setAttribute('d','M5 '+(PY+8)+'Q5 '+(PY+2)+' 11 '+(PY+2)+'H'+(pw-11));
        p.logo.setAttribute('cx', cx); p.logo.setAttribute('cy', cy);
        // The copy's check is tipped 14 degrees: just enough to slip past an exact match.
        p.tick.setAttribute('d', 'M' + (cx - 6) + ' ' + cy + 'l4 4 8-9');
        if (p.fake) { p.tick.setAttribute('transform', 'rotate(-14 ' + cx + ' ' + cy + ')'); }
        p.title.setAttribute('x', pw * 0.25); p.title.setAttribute('width', pw * 0.5);
        p.field.setAttribute('width', pw - 24); p.button.setAttribute('width', pw - 24);
      });
      var room = pw - inset - tx - (narrow ? 3 : 6);
      name = NAMES[0]; pages.forEach(fill);
      try {
        if (fake.url.getComputedTextLength() > room) { name = NAMES[1]; pages.forEach(fill); }
        if (fake.url.getComputedTextLength() > room) { pages.forEach(function (p) { p.url.setAttribute('letter-spacing', -0.45); }); }
      } catch (e) {}
      // Underline the hyphen (at least 6px wide); estimate while hidden.
      try { swapX = fake.url.getSubStringLength(0, name.length); swapW = fake.url.getSubStringLength(name.length, 1); } catch (e) { swapX = 0; }
      if (!swapX) { swapX = 54; swapW = 4; }
      if (swapW < 6) { swapX -= (6 - swapW) / 2; swapW = 6; }
      marks.url.setAttribute('d', 'M' + (x1 + tx + swapX).toFixed(1) + ' ' + (PY + 29) + 'h' + swapW.toFixed(1));
      fake.highlight.setAttribute('x',tx+swapX-2);fake.highlight.setAttribute('width',swapW+4);
      var referenceX = x0 + tx + swapX, candidateX = x1 + tx + swapX;
      referenceMark.setAttribute('d', 'M'+referenceX+' '+(PY+29)+'h'+swapW);
      comparisonLink.setAttribute('d', 'M'+(referenceX+swapW/2)+' '+(PY+32)+'H'+(candidateX+swapW/2));
      var lx = x1 + pw / 2 + 2, ly = PY + 45;
      referenceLogo.setAttribute('d', 'M'+(x0+pw/2)+' '+(PY+29)+'a15 15 0 1 1-.01 0');
      // The key ends under the copy's right edge, in line with the tag, when it
      // fits there (into the gap at most); otherwise it centres under both
      // pages. A tight bar narrows the space between entries rather than wrap.
      var kw = legend.map(function (k) { var w = 0; try { w = k.text.getComputedTextLength(); } catch (e) {} return 15 + (w || 80); });
      var kgap = Math.max(8, Math.min(16, W - 4 - kw[0] - kw[1])), kspan = kw[0] + kgap + kw[1];
      var kx = x1 + pw - kspan >= x0 + pw + 2 ? x1 + pw - kspan : Math.max(2, (W - kspan) / 2);
      legend[0].x = kx; legend[1].x = kx + kw[0] + kgap;
      marks.logo.setAttribute('d', 'M' + lx + ' ' + (ly - 15) + 'a15 15 0 1 1-.01 0');
      var r = 9, w = pw - 2 * r, h = PH - 2 * r;
      marks.outline.setAttribute('d', 'M' + (x1 + r) + ' ' + PY + 'h' + w + 'a9 9 0 0 1 9 9v' + h + 'a9 9 0 0 1-9 9h-' + w + 'a9 9 0 0 1-9-9v-' + h + 'a9 9 0 0 1 9-9z');
      tagBox.setAttribute('x', x1 + pw - 64); tagBox.setAttribute('y', PY - 8);
      tagText.setAttribute('x', x1 + pw - 32); tagText.setAttribute('y', PY + 4);
      idle = false;
      render();
    }
    function render() {
      var c = reduce ? DUR : t % LOOP;
      var split = ease(clamp((c-200)/950));
      var clear = reduce ? 1 : 1-ease(clamp((c-9500)/500));
      // One anchored reference; a copy pulls away once, then comparison is stationary.
      real.g.setAttribute('transform','translate('+x0+' 0)');
      real.g.style.opacity='1';
      fake.g.setAttribute('transform','translate('+(x0+(x1-x0)*split).toFixed(2)+' 0)');
      fake.g.style.opacity=(clamp(c/200)*clear).toFixed(3);
      pages.forEach(function(p){p.scan.style.opacity='0';});
      // Attention follows corresponding punctuation, making the substitution legible.
      var address=ease(clamp((c-1450)/450));
      var relation=ease(clamp((c-1650)/650));
      var altered=ease(clamp((c-2050)/450));
      var comparisonFade=reduce?0:1-clamp((c-2900)/600);
      dash(referenceMark,address);referenceMark.style.opacity=(comparisonFade*clear).toFixed(3);
      dash(comparisonLink,relation);comparisonLink.style.opacity=(0.32*comparisonFade*clear).toFixed(3);
      dash(marks.url,altered);fake.highlight.style.opacity=(0.18*altered*clear).toFixed(3);fake.swap.setAttribute('fill',altered>0.1?AMBER:INK);
      // A second paired comparison distinguishes the copied emblem from the reference.
      var logo=ease(clamp((c-2800)/650));
      dash(referenceLogo,logo);referenceLogo.style.opacity=((reduce?0:0.5*(1-clamp((c-3650)/650)))*clear).toFixed(3);
      dash(marks.logo,logo);
      dash(marks.outline,ease(clamp((c-3700)/700)));
      Object.keys(marks).forEach(function(k){marks[k].style.opacity=clear.toFixed(3);});
      var tg=ease(clamp((c-4350)/350));
      tag.style.opacity=(tg*clear).toFixed(3);
      tag.setAttribute('transform','translate(0 '+(2*(1-tg)).toFixed(2)+')');
      // Each key entry settles in as its own mark finishes, then holds.
      [ease(clamp((c-2300)/450)),ease(clamp((c-3200)/450))].forEach(function(f,i){
        legend[i].g.style.opacity=(f*clear).toFixed(3);
        legend[i].g.setAttribute('transform','translate('+legend[i].x.toFixed(1)+' '+(PY+PH+15+2*(1-f)).toFixed(2)+')');
      });
      // No repeated halo: a long quiet result is the reward for the reveal.
      halo.setAttribute('visibility','hidden');
    }
    return {
      layout: layout,
      // Re-measure on every open: the address font may have loaded since.
      open: function () { t = 0; layout(); },
      tick: function (dt) { t += dt; render(); },
      setPaused: function () { if (reduce) { render(); } }
    };
  }

  // ---- Mini previews inside the chips ----
  // Each plays for RUN ms; when its anomaly is caught, one ring marks it.
  var RUN = 4200, RING = 900;
  function ringAt(ring, p, f) {
    var on = f > 0 && f < 1;
    ring.setAttribute('visibility', on ? 'visible' : 'hidden');
    if (!on) { return; }
    ring.setAttribute('cx', p.x.toFixed(1)); ring.setAttribute('cy', p.y.toFixed(1));
    ring.setAttribute('r', (2.6 + f * 3).toFixed(2)); ring.style.opacity = (0.8 * (1 - f)).toFixed(3);
  }
  function createMiniSeries(svg) {
    var W = 56, H = 18, N = 22, STEP = 260;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    // Line and band fade out at both ends instead of stopping at a hard edge.
    var id = 'mini-fade-' + Math.random().toString(36).slice(2, 8), defs = el('defs', {}, svg);
    var grad = el('linearGradient', { id: id + 'g' }, defs);
    [[0, 0], [0.12, 1], [0.88, 1], [1, 0]].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': '#fff', 'stop-opacity': s[1] }, grad); });
    el('rect', { width: W, height: H, fill: 'url(#' + id + 'g)' }, el('mask', { id: id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs));
    var faded = el('g', { mask: 'url(#' + id + ')' }, svg);
    var band = el('path', { class: 'mini-band' }, faded);
    var line = el('path', { class: 'mini-line' }, faded);
    var ring = el('circle', { class: 'mini-ring' }, svg);
    var dot = el('circle', { class: 'mini-flag' }, svg);
    // Rest on a window (t 4..26) holding only the upward spike at t=19, clear
    // of the dip at t=30; the run starts so the spike enters from the right.
    var END = 4, START = END - Math.round(RUN / STEP);
    var elapsed = 0, flag = null;
    function yy(v) { return 2 + (H - 4) * (1 - (v - 20) / 95); }
    function draw(pos) {
      var base = Math.floor(pos), frac = pos - base, dx = W / (N - 1), top = '', bot = '', l = '';
      flag = null;
      for (var i = 0; i <= N; i++) {
        var tt = base + i, px = (i - frac) * dx;
        top += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + yy(expected(tt) + BAND).toFixed(1);
        l += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + yy(sample(tt)).toFixed(1);
        if (Math.abs(sample(tt) - expected(tt)) > 3 * SIGMA && px > 2 && px < W - 2) { flag = { x: px, y: Math.max(3, yy(sample(tt))) }; }
      }
      for (var j = N; j >= 0; j--) { bot += 'L' + ((j - frac) * dx).toFixed(1) + ' ' + yy(expected(base + j) - BAND).toFixed(1); }
      band.setAttribute('d', top + bot + 'Z');
      line.setAttribute('d', l);
      // The flag grows in as its point clears the right-hand fade.
      var r = flag ? 2.6 * Math.min(1, (W - 2 - flag.x) / 7) : 0;
      dot.setAttribute('visibility', r > 0.3 ? 'visible' : 'hidden');
      if (flag) { dot.setAttribute('cx', flag.x.toFixed(1)); dot.setAttribute('cy', flag.y.toFixed(1)); dot.setAttribute('r', r.toFixed(2)); dot.style.strokeWidth = Math.min(1, r / 2.6).toFixed(2); }
    }
    function at(ms) {
      // Eased both ways: the scroll gathers pace, then settles on the flag.
      draw(START + ease(Math.min(1, ms / RUN)) * (END - START));
      ringAt(ring, flag, flag ? (ms - RUN) / RING : 0);
    }
    at(RUN + RING);
    return {
      replay: function () { elapsed = 0; at(0); },
      tick: function (dt) { elapsed += dt; at(elapsed); },
      done: function () { return elapsed >= RUN + RING; },
      rest: function () { at(RUN + RING); }
    };
  }
  function createMiniGraph(svg) {
    var W = 56, H = 18, GROW = 2000;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    var P = [{ x: 6, y: 5 }, { x: 6, y: 13 }, { x: 20, y: 9 }, { x: 36, y: 5 }, { x: 50, y: 10 }];
    [[0, 2], [1, 2], [2, 3], [3, 4]].forEach(function (e) {
      el('line', { class: 'mini-edge', x1: P[e[0]].x, y1: P[e[0]].y, x2: P[e[1]].x, y2: P[e[1]].y }, svg);
    });
    // The unusual link bows below the usual path, so it reads as a new route.
    var C = { x: 28, y: 19 };
    var odd = el('path', { class: 'mini-odd' }, svg);
    var packet = el('circle', { class: 'mini-packet', r: 1.4 }, svg);
    var ring = el('circle', { class: 'mini-ring' }, svg);
    var nodes = P.map(function (p) { return el('circle', { class: 'mini-node', cx: p.x, cy: p.y, r: 2.2 }, svg); });
    var elapsed = 0;
    function draw(ms) {
      // A packet runs the usual path, then the unusual link grows to node 4.
      var route = [P[0], P[2], P[3], P[4]], f = (ms % 1400) / 1400, seg = Math.min(2, Math.floor(f * 3));
      var q = lerp(route[seg], route[seg + 1], ease(f * 3 - seg));
      packet.setAttribute('cx', q.x.toFixed(1)); packet.setAttribute('cy', q.y.toFixed(1));
      packet.setAttribute('visibility', ms < RUN - 600 ? 'visible' : 'hidden');
      // Grow the curve to g by splitting it there (de Casteljau).
      var g = Math.max(0, Math.min(1, (ms - GROW) / 700)), e = ease(g), c = lerp(P[1], C, e), end = lerp(c, lerp(C, P[4], e), e);
      odd.setAttribute('d', 'M' + P[1].x + ' ' + P[1].y + 'Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + end.x.toFixed(1) + ' ' + end.y.toFixed(1));
      odd.style.opacity = Math.min(1, g * 4).toFixed(3);
      nodes[4].classList.toggle('is-odd', g >= 1);
      ringAt(ring, P[4], (ms - GROW - 700) / RING);
    }
    draw(RUN);
    return {
      replay: function () { elapsed = 0; draw(0); },
      tick: function (dt) { elapsed += dt; draw(Math.min(elapsed, RUN)); },
      done: function () { return elapsed >= RUN; },
      rest: function () { draw(RUN); }
    };
  }

  function createMiniSite(svg) {
    var W = 56, H = 18, X0 = 8, X1 = 30;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    // The chart in miniature: a copy slides out from behind a tiny sign-in
    // page, then its outline and one address mark turn amber.
    function page(fake) {
      var g = el('g', {}, svg), p = { g: g };
      p.box = el('rect', { x: 0, y: 2, width: 18, height: 14, rx: 2.5, fill: '#fff', stroke: '#cfdcda', 'stroke-width': 0.6 }, g);
      el('rect', { x: 2.5, y: 4, width: 13, height: 2.4, rx: 1.2, fill: '#e3eceb' }, g);
      el('circle', { cx: fake ? 9.6 : 9, cy: fake ? 9.4 : 9.2, r: fake ? 1.9 : 2.2, fill: fake ? '#2a9d8a' : TEAL }, g);
      el('rect', { x: 4, y: 12.6, width: 10, height: 1.8, rx: 0.9, fill: TEAL }, g);
      if (fake) { p.mark = el('rect', { x: 6, y: 4, width: 3.2, height: 2.4, rx: 1, fill: AMBER }, g); }
      return p;
    }
    var real = page(false), copy = page(true), ring = el('circle', { class: 'mini-ring' }, svg), elapsed = 0;
    real.g.setAttribute('transform', 'translate(' + X0 + ' 0)');
    function draw(ms) {
      var m = ease(clamp((ms - 800) / 1000)), on = ms >= 2300;
      copy.g.setAttribute('transform', 'translate(' + (X0 + (X1 - X0) * m).toFixed(2) + ' 0)');
      copy.g.style.opacity = clamp((ms - 300) / 300).toFixed(2);
      copy.box.setAttribute('stroke', on ? AMBER : '#cfdcda'); copy.box.setAttribute('stroke-width', on ? 0.9 : 0.6);
      copy.mark.style.opacity = on ? 1 : 0;
      ringAt(ring, { x: X1 + 9.6, y: 9.4 }, (ms - 2500) / RING);
    }
    draw(RUN);
    return {
      replay: function () { elapsed = 0; draw(0); },
      tick: function (dt) { elapsed += dt; draw(Math.min(elapsed, RUN)); },
      done: function () { return elapsed >= RUN; },
      rest: function () { draw(RUN); }
    };
  }

  // ---- Wire chips, minis and cards ----
  var card = root.closest('.case-study') || root.parentElement;
  var keys = ['site', 'series', 'graph'], charts = {};
  var makers = { site: [createSite, createMiniSite], series: [createSeries, createMiniSeries], graph: [createGraph, createMiniGraph] };
  keys.forEach(function (k) {
    var c = charts[k] = { chip: root.querySelector('[data-peek="' + k + '"]'), pop: root.querySelector('[data-peek-card="' + k + '"]') };
    c.chart = makers[k][0](c.pop.querySelector('.anomaly-card__plot'));
    c.mini = makers[k][1](c.chip.querySelector('[data-mini]'));
  });
  keys.forEach(function (k) { charts[k].chart.layout(); });

  var onScreen = false;
  // Minis: play each time the card comes into view, then rest (and loop).
  var miniTicker = {
    live: function () {
      var active = onScreen && !document.hidden && !reduce && keys.some(function (k) { return !charts[k].mini.done(); });
      if (!active) { keys.forEach(function (k) { if (reduce || charts[k].mini.done()) { charts[k].mini.rest(); } }); }
      return active;
    },
    tick: function (dt) {
      keys.forEach(function (k) { if (!charts[k].mini.done()) { charts[k].mini.tick(dt); } });
      if (keys.every(function (k) { return charts[k].mini.done(); })) {
        if (nudgePending) { nudgePending = false; nudge(); }
        loopLater();
      }
    }
  };
  // While the card stays on screen they replay every 15s, without the glow,
  // holding while a chart is open or the tab is hidden.
  var loopTimer = 0;
  function loopLater() {
    window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(function () {
      if (!onScreen || reduce) { return; }
      if (document.hidden || keys.some(function (k) { return charts[k].state.open; })) { loopLater(); return; }
      lastReplay = performance.now();
      keys.forEach(function (k) { charts[k].mini.replay(); });
      resume();
    }, 15000);
  }
  // When the previews come to rest, each chip glows once (CSS), unless one
  // is already open: the reader has found them.
  var nudgePending = false;
  function nudge() {
    if (keys.some(function (k) { return charts[k].state.open; })) { return; }
    keys.forEach(function (k) {
      var chip = charts[k].chip;
      if (chip.classList.contains('is-breathing')) { return; }
      chip.classList.remove('is-nudging');
      void chip.offsetWidth;
      chip.classList.add('is-nudging');
      chip.addEventListener('animationend', function done(e) {
        if (e.animationName !== 'peek-nudge') { return; }
        chip.classList.remove('is-nudging');
        chip.removeEventListener('animationend', done);
      });
    });
  }
  // Each open chart animates while open and on screen.
  keys.forEach(function (k) {
    var c = charts[k];
    c.state = { hovering: false, focus: false, pinned: false, dismissed: false, open: false, touched: 0, leave: null };
    c.ticker = {
      live: function () { var on = c.state.open && onScreen && !document.hidden && !reduce; c.chart.setPaused(!on); return on; },
      tick: function (dt) { c.chart.tick(dt); }
    };
  });

  var inline = window.matchMedia('(max-width: 736px), (hover: none)');
  function place(c) {
    // Phones and touch tablets show the card inline below the chips (CSS),
    // so nothing to place.
    if (inline.matches) { c.pop.style.left = ''; c.pop.style.top = ''; return; }
    // Below the chip row, left-aligned with the chip and kept inside the card.
    // The row is unpositioned, so chip and row offsets are both card-relative.
    var pop = c.pop, chip = c.chip;
    var w = pop.offsetWidth, cw = card.clientWidth, padX = 12;
    var left = Math.max(padX, Math.min(cw - w - padX, chip.offsetLeft));
    pop.style.left = left + 'px';
    pop.style.top = (root.offsetTop + root.offsetHeight + 8) + 'px';
  }
  // One card at a time. Whatever the reader is hovering or focusing right
  // now wins; failing that, the last pinned card shows. So hovering the other
  // chip previews it over a pin, and the pin returns when the pointer leaves.
  var stamp = 0;
  // The first chip breathes whenever the card is on screen and no chart is
  // open, so the invitation comes back after a chart is closed (owner, Oct
  // 2026: "should keep repeating the pulse even after clicked before").
  function breathe() { charts[keys[0]].chip.classList.toggle('is-breathing', onScreen && !keys.some(function (k) { return charts[k].state.open; })); }
  function update() {
    var want = keys.filter(function (k) { var s = charts[k].state; return !s.dismissed && (s.hovering || s.focus); });
    if (!want.length) { want = keys.filter(function (k) { var s = charts[k].state; return !s.dismissed && s.pinned; }); }
    want.sort(function (x, y) { return charts[y].state.touched - charts[x].state.touched; });
    var show = want[0] || null;
    // A swap (another chart opening in this one's place) grows the new card
    // from the old one's height, so the page below doesn't jump.
    var from = 0;
    if (show) { keys.forEach(function (k) { if (k !== show && charts[k].state.open) { from = charts[k].pop.offsetHeight; } }); }
    keys.forEach(function (k) {
      var c = charts[k], s = c.state, v = k === show;
      if (v === s.open) { return; }
      s.open = v;
      if (v) {
        if (c.motion) { c.motion.cancel(); c.motion = null; }
        c.pop.classList.add('is-open');
      } else { hide(c, !!show); }
      c.chip.setAttribute('aria-expanded', String(v));
      // Place first: on phones the card only gets its width once displayed.
      if (v) {
        place(c); grow(c, from); c.chart.open(); wake(c.ticker);
      }
    });
    breathe();
  }
  function inside(c, node) { return !!node && (c.pop.contains(node) || c.chip.contains(node)); }
  // Smart zoom (owner, 25 Oct 2026): window.peekZoom, from internship-peek.js.
  // An inline card's top margin folds into the row gap above it.
  function gap(c) { return parseFloat(window.getComputedStyle(c.pop.parentNode).rowGap) || 0; }
  function grow(c, from) {
    if (c.motion) { c.motion.cancel(); }
    var g = window.peekZoom.grow(c.pop, c.chip, inline.matches, from, gap(c));
    c.height = g.h; c.motion = g.a;
  }
  function hide(c, swap) {
    var pop = c.pop;
    if (c.motion) { c.motion.cancel(); }
    c.motion = window.peekZoom.shut(pop, swap, inline.matches, function (late) {
      if (late && c.state.open) { return; }
      pop.classList.remove('is-open');
      pop.style.overflow = pop.style.animation = '';
    }, gap(c));
  }
  function reveal(c) {
    var bottom = window.peekZoom.top(c.pop) + (c.height || c.pop.offsetHeight);
    window.peekZoom.frame([[root.getBoundingClientRect().top, bottom], [c.pop.getBoundingClientRect().top, bottom]], inline.matches);
  }

  keys.forEach(function (k) {
    var c = charts[k], s = c.state;
    [c.chip, c.pop].forEach(function (node) {
      // Inline cards open on click only: hover would push the page about.
      node.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || inline.matches || window.peekZoom.lock) { return; }
        window.clearTimeout(s.leave);
        if (!s.hovering) { s.dismissed = false; }
        s.hovering = true;
        s.touched = ++stamp;
        update();
      });
      node.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') { return; }
        window.clearTimeout(s.leave);
        s.leave = window.setTimeout(function () { s.hovering = false; update(); }, 200);
      });
      node.addEventListener('focusin', function (e) {
        if (!inside(c, e.relatedTarget)) { s.dismissed = false; }
        s.focus = true;
        s.touched = ++stamp;
        update();
      });
      node.addEventListener('focusout', function (e) { if (!inside(c, e.relatedTarget)) { s.focus = false; update(); } });
    });
    c.chip.addEventListener('click', function () {
      if (s.open && s.pinned) { s.pinned = false; s.dismissed = true; }
      else {
        // Pinning one card unpins the other.
        keys.forEach(function (o) { charts[o].state.pinned = false; });
        s.pinned = true; s.dismissed = false; s.touched = ++stamp;
      }
      update();
      if (s.open) { window.requestAnimationFrame(function () { if (s.open) { reveal(c); } }); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    keys.forEach(function (k) {
      var c = charts[k], s = c.state;
      if (!s.open) { return; }
      s.pinned = false; s.dismissed = true; update();
    });
  });
  // Outside presses close a floating card: a mouse on press, touch on the tap
  // itself (click), since a finger's pointerdown may be the start of a scroll.
  // Inline cards (phones, touch tablets) close from their chip instead.
  function closeOutside(target) {
    if (inline.matches) { return; }
    keys.forEach(function (k) {
      var c = charts[k], s = c.state;
      if (s.open && !inside(c, target)) { s.pinned = false; s.dismissed = true; update(); }
    });
  }
  document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { closeOutside(e.target); } });
  document.addEventListener('click', function (e) { if (e.pointerType && e.pointerType !== 'mouse') { closeOutside(e.target); } });

  var lastW = card.clientWidth;
  if ('ResizeObserver' in window) new ResizeObserver(function () {
    if (Math.abs(card.clientWidth - lastW) < 1) { return; }
    lastW = card.clientWidth;
    keys.forEach(function (k) { charts[k].chart.layout(); if (charts[k].state.open) { place(charts[k]); } });
  }).observe(card);

  function resume() {
    if (!onScreen || document.hidden || reduce) { return; }
    wake(miniTicker);
    keys.forEach(function (k) { if (charts[k].state.open) { wake(charts[k].ticker); } });
  }
  var lastReplay = -Infinity;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var was = onScreen;
      onScreen = entries[entries.length - 1].isIntersecting;
      var now = performance.now();
      if (onScreen && !was && !reduce && now - lastReplay > 20000) {
        lastReplay = now;
        keys.forEach(function (k) { charts[k].mini.replay(); });
        nudgePending = true;
      }
      breathe();
      resume();
    }, { threshold: 0.15 }).observe(card);
  } else { onScreen = true; breathe(); }
  document.addEventListener('visibilitychange', resume);
  function onMotionChange() {
    reduce = motionQuery.matches;
    if (reduce) { keys.forEach(function (k) { charts[k].mini.rest(); }); }
    resume();
  }
  if (motionQuery) {
    if (motionQuery.addEventListener) { motionQuery.addEventListener('change', onMotionChange); }
    else if (motionQuery.addListener) { motionQuery.addListener(onMotionChange); }
  }
})();
