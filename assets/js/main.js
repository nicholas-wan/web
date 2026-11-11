
(function() {
	'use strict';

	var body = document.body;
	var wrapper = document.getElementById('wrapper');
	var header = document.getElementById('header');
	var nav = document.getElementById('nav');
	var main = document.getElementById('main');
	if (!body || !wrapper || !nav || !main) return;

	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	var mobileNav = window.matchMedia('(max-width: 980px)');

	// Reveal content once ready; the homepage waits for load (its intro).
	function revealPage() {
		window.setTimeout(function() {
			body.classList.remove('is-preload');
		}, 100);
	}
	if (body.classList.contains('page-home')) {
		if (document.readyState === 'complete') revealPage();
		else window.addEventListener('load', revealPage, { once: true });
	}
	else {
		revealPage();
	}

	// Build the mobile navigation sheet.
	var navPanelToggle = document.createElement('a');
	navPanelToggle.href = '#navPanel';
	navPanelToggle.id = 'navPanelToggle';
	navPanelToggle.setAttribute('aria-label', 'Open navigation menu');
	navPanelToggle.setAttribute('aria-controls', 'navPanel');
	navPanelToggle.setAttribute('aria-expanded', 'false');
	navPanelToggle.textContent = 'Menu';
	wrapper.appendChild(navPanelToggle);

	var mobileContextBar = document.querySelector('.mobile-context-bar');
	if (mobileContextBar) {
		mobileContextBar.appendChild(navPanelToggle);
		navPanelToggle.classList.add('alt');
	}
	else if (body.classList.contains('page-home')) {
		body.appendChild(navPanelToggle);
		navPanelToggle.classList.add('alt');
	}

	// The scroll-driven chrome shares one frame: all reads, then all writes.
	var returnToTop = document.getElementById('return-to-top');
	var chromeFrame = null;
	var chromeScrolled = false;
	// The floating pill (wrapper, or body on home) steps away on downward
	// reading and returns on upward intent; context and sticky bars opt out.
	var toggleScrollY = window.scrollY;
	function stepAway(y) {
		var p = navPanelToggle.parentElement;
		if (p !== wrapper && p !== body) return;
		if (Math.abs(y - toggleScrollY) < 8) return;
		if (y > toggleScrollY && y > Math.min(160, document.documentElement.scrollHeight - innerHeight - 8) && !body.classList.contains('is-navPanel-visible'))
			navPanelToggle.classList.add('is-scrolled-away');
		else
			navPanelToggle.classList.remove('is-scrolled-away');
		toggleScrollY = y;
	}
	function renderChrome() {
		chromeFrame = null;
		var scrolled = chromeScrolled;
		chromeScrolled = false;
		var y = window.scrollY;
		// Headerless pages keep the solid pill.
		var alt = !header || header.getBoundingClientRect().bottom <= window.innerHeight * 0.05;

		navPanelToggle.classList.toggle('alt', alt);
		if (scrolled) stepAway(y);
		if (returnToTop) returnToTop.classList.toggle('is-visible', y >= 50);
	}
	function queueChrome() {
		if (chromeFrame === null) chromeFrame = window.requestAnimationFrame(renderChrome);
	}
	window.addEventListener('scroll', function() {
		chromeScrolled = true;
		queueChrome();
	}, { passive: true });
	window.addEventListener('resize', queueChrome, { passive: true });
	queueChrome();

	var navPanel = document.createElement('div');
	navPanel.id = 'navPanel';
	navPanel.setAttribute('role', 'dialog');
	navPanel.setAttribute('aria-modal', 'true');
	navPanel.setAttribute('aria-label', 'Site navigation');
	navPanel.tabIndex = -1;
	navPanel.setAttribute('aria-hidden', 'true');
	navPanel.innerHTML =
		'<span class="nav-panel__handle" aria-hidden="true"></span>' +
		'<nav></nav>' +
		'<a href="#navPanel" class="close" aria-label="Close navigation menu"></a>';
	body.appendChild(navPanel);
	var navPanelInner = navPanel.querySelector('nav');
	var navContent = Array.prototype.slice.call(nav.children);
	var panelDelay = 280;

	function setPanelOpen(open) {
		body.classList.toggle('is-navPanel-visible', open);
	}

	function closePanel() {
		if (!body.classList.contains('is-navPanel-visible')) return;
		setPanelOpen(false);
		window.setTimeout(function() {
			navPanel.scrollTop = 0;
			Array.prototype.forEach.call(navPanel.querySelectorAll('form'), function(form) {
				form.reset();
			});
		}, panelDelay);
	}

	navPanelToggle.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		setPanelOpen(!body.classList.contains('is-navPanel-visible'));
	});
	navPanelToggle.addEventListener('keydown', function(event) {
		if (event.key === ' ' || event.key === 'Spacebar') {
			event.preventDefault();
			navPanelToggle.click();
		}
	});

	navPanel.addEventListener('click', function(event) {
		var link = event.target.closest('a');
		if (!link) return;
		var href = link.getAttribute('href');
		if (!href || href === '#' || href === '#navPanel') {
			event.preventDefault();
			closePanel();
			return;
		}
		if (link.target === '_blank') {
			closePanel();
			return;
		}
		event.preventDefault();
		closePanel();
		window.setTimeout(function() {
			window.location.href = href;
		}, panelDelay + 10);
	});

	// (iOS sends no click for a tap on the dim)
	document.addEventListener('pointerup', function(event) {
		if (!body.classList.contains('is-navPanel-visible')) return;
		if (navPanel.contains(event.target) || navPanelToggle.contains(event.target)) return;
		closePanel();
	});

	var touchStartX = null;
	var touchStartY = null;
	navPanel.addEventListener('touchstart', function(event) {
		if (!event.touches.length) return;
		touchStartX = event.touches[0].pageX;
		touchStartY = event.touches[0].pageY;
	}, { passive: true });
	navPanel.addEventListener('touchmove', function(event) {
		if (touchStartX === null || touchStartY === null || !event.touches.length) return;
		var diffX = touchStartX - event.touches[0].pageX;
		var diffY = touchStartY - event.touches[0].pageY;
		if (Math.abs(diffX) < 20 && diffY < -50) {
			touchStartX = null;
			touchStartY = null;
			closePanel();
		}
	}, { passive: true });

	var navPanelWasOpen = false;
	function syncNavPanelState() {
		var isOpen = body.classList.contains('is-navPanel-visible');
		navPanelToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		navPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
		if (isOpen && !navPanelWasOpen) {
			// The dialog itself: WebKit rang a focused tile, which looked selected.
			var focusTries = 0;
			(function focusIntoPanel() {
				if (!body.classList.contains('is-navPanel-visible')) return;
				navPanel.focus({ preventScroll: true });
				if (document.activeElement !== navPanel && ++focusTries < 30)
					window.setTimeout(focusIntoPanel, 20);
			})();
		}
		else if (!isOpen && navPanelWasOpen && navPanel.contains(document.activeElement)) {
			navPanelToggle.focus({ preventScroll: true });
		}
		navPanelWasOpen = isOpen;
	}
	new MutationObserver(syncNavPanelState).observe(body, { attributes: true, attributeFilter: ['class'] });
	syncNavPanelState();

	window.addEventListener('keydown', function(event) {
		if (event.key === 'Escape' && body.classList.contains('is-navPanel-visible')) {
			event.preventDefault();
			closePanel();
			return;
		}
		if (event.key !== 'Tab' || !body.classList.contains('is-navPanel-visible')) return;
		var focusable = Array.prototype.filter.call(
			navPanel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
			function(element) { return element.getClientRects().length > 0; }
		);
		if (!focusable.length) return;
		var first = focusable[0];
		var last = focusable[focusable.length - 1];
		if (!navPanel.contains(document.activeElement) || document.activeElement === navPanel) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
		}
		else if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		}
		else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
		else {
			// Safari may skip links in its native Tab order. Advance explicitly
			// within the modal so that platform preferences cannot release focus.
			event.preventDefault();
			focusable[focusable.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1)].focus();
		}
	});

	function syncNavMode() {
		var mobile = mobileNav.matches;
		var destination = mobile ? navPanelInner : nav;
		if (!mobile) closePanel();
		navContent.forEach(function(node) {
			destination.appendChild(node);
		});
		Array.prototype.forEach.call(destination.querySelectorAll('.icons, .icon'), function(icon) {
			icon.classList.toggle('alt', mobile);
		});
	}
	mobileNav.addEventListener('change', syncNavMode);
	syncNavMode();

	// Return-to-top scrolls here; renderChrome shows it past 50px.
	if (returnToTop) {
		returnToTop.addEventListener('click', function(event) {
			event.preventDefault();
			window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
		});
	}
})();

/*Canvas*/
/* Hunt lens with sonar (11 Nov 2026, owner: "port A5", lab/index-motion A5),
   built on the owner-approved canvas: the drifting network and its signal hop
   stay. A faint lens (the pointer; a slow drift on touch, a tap aims it)
   reveals a hidden mesh. A few threats hide in it, seen only as dim amber
   points in the lens; near one the lens leans onto it, and a rest finds it:
   it warms, a signal walks two links to it, a teal ring closes, and it stays
   amber for the visit. Each find (and the lens's first arrival) sends one
   faint wave across the hero that shows the mesh in a band and blinks unfound
   threats. No labels; nothing drawn over the hero text; hidden under reduced
   motion and paused off screen. */
(function () {
  'use strict';

  var canvas = document.getElementById('nokey');
  if (!canvas) { return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.hidden = true; return; }

  var ctx = canvas.getContext('2d');
  var compactCanvas = window.matchMedia('(max-width: 736px)').matches;
  var hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var W = 0, H = 0, HB = 0, DPR = 1, PI2 = Math.PI * 2;
  var R = 2, LINK = compactCanvas ? 145 : 210, ball_limit = compactCanvas ? 9 : 14;
  var LR = 104, DLINK = compactCanvas ? 70 : 82, MAG = 0.3;
  var TEAL = '0,224,224', AMBER = '255,178,72';
  var balls = [], dust = [];
  var lens = { x: 0, y: 0, k: 0, on: 0, v: 0 };
  var ptr = { x: 0, y: 0, on: false }, tap = null;

  // Threats: a few at first; once all are found, one more surfaces now and then, up to CAP.
  var THREATS = compactCanvas ? 4 : 6, CAP = compactCanvas ? 5 : 8, RESURFACE = compactCanvas ? 30000 : 24000;
  var threats = [], seeded = false, nextFind = 0, quietSince = 0;
  // The ambient chain and a hunt run side by side; a hunt ends the chain at its next node.
  var HOP = 900, HOPS = 4, GAP = 1800, HUNT_HOP = 560, WARM = 650;
  var signal = null, hunt = null, nextAt = 0, last = 0;
  // Waves burst out and ease off, crossing the hero in DUR ms; at most one per 4s.
  var pings = [], firstPing = false, lastPing = 0, BAND = compactCanvas ? 46 : 64, DUR = compactCanvas ? 1500 : 1800;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function smooth(e0, e1, x) { var u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return u * u * (3 - 2 * u); }
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function spawn() {
    var side = Math.floor(Math.random() * 4), b = { r: R, alpha: 1, phase: rand(0, 10), glow: 0 };
    if (side === 0) { b.x = rand(0, W); b.y = -R; b.vx = rand(-1, 1); b.vy = rand(0.1, 1); }
    else if (side === 1) { b.x = W + R; b.y = rand(0, H); b.vx = rand(-1, -0.1); b.vy = rand(-1, 1); }
    else if (side === 2) { b.x = rand(0, W); b.y = H + R; b.vx = rand(-1, 1); b.vy = rand(-1, -0.1); }
    else { b.x = -R; b.y = rand(0, H); b.vx = rand(0.1, 1); b.vy = rand(-1, 1); }
    return b;
  }

  // The hero text (name to CTA), from the glyphs and buttons, not their block
  // boxes: nothing is drawn across it. HB: the hero's foot (the desktop bar is below).
  var box = null;
  function measureText() {
    var intro = document.getElementById('intro');
    var parts = intro ? intro.querySelectorAll('h1, [data-scramble-source], .portfolio-hero__scramble-support, .portfolio-hero__cta') : [];
    var c = canvas.getBoundingClientRect();
    HB = intro ? Math.min(H || c.height, intro.getBoundingClientRect().bottom - c.top) : H;
    if (!parts.length) { box = null; return; }
    var l = 1e5, t = 1e5, r = -1e5, btm = -1e5;
    Array.prototype.forEach.call(parts, function (el) {
      var range = document.createRange(); range.selectNodeContents(el);
      var q = el.classList.contains('portfolio-hero__cta') ? el.getBoundingClientRect() : range.getBoundingClientRect();
      if (!q.width) { return; }
      l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); btm = Math.max(btm, q.bottom);
    });
    box = { x: l - c.left - 20, y: t - c.top - 20, w: r - l + 40, h: btm - t + 40 };
  }
  function boxDist(x, y) {
    if (!box) { return 1e4; }
    var dx = Math.max(box.x - x, 0, x - box.x - box.w), dy = Math.max(box.y - y, 0, y - box.y - box.h);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function seedDust() {
    var n = Math.min(360, Math.round(W * H / (compactCanvas ? 3000 : 4000)));
    dust = [];
    for (var i = 0; i < n; i++) {
      var a = rand(0, PI2), v = rand(0.04, 0.14);
      dust.push({ x: rand(0, W), y: rand(0, H), vx: Math.cos(a) * v, vy: Math.sin(a) * v, hv: 0, ht: 0 });
    }
  }

  function initCanvas() {
    var r = canvas.getBoundingClientRect(), oldW = W, oldH = H;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    LR = compactCanvas ? 104 : Math.max(110, Math.min(150, Math.min(r.width, r.height) * 0.17));
    W = Math.round(r.width) || document.documentElement.clientWidth; H = Math.round(r.height) || document.documentElement.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    measureText();
    seedDust();
    // Threats survive a resize, scaled, and moved if now too close to the text.
    if (hunt) { hunt = null; nextFind = 0; }
    threats.forEach(function (d) {
      d.x *= W / (oldW || W); d.y *= H / (oldH || H); d.ht = 0; d.hv = 0;
      if (!fits(d.x, d.y)) { var p = findSpot(d); if (p) { d.x = p[0]; d.y = p[1]; } }
      dust.push(d);
    });
  }

  // The lens's drift with no pointer: an orbit around the text where the sides
  // have room, else a slow Lissajous in the larger free band.
  function patrolAt(a) {
    var b = box || { x: W / 2, y: H / 2, w: 0, h: 0 };
    if ((W - b.w) / 2 > LR * 1.7) {
      return [W / 2 + (W / 2 - LR * 0.9) * Math.cos(a), b.y + b.h / 2 + (H / 2 - LR * 0.6) * Math.sin(a) + H * 0.06 * Math.sin(2.7 * a)];
    }
    var below = H - b.y - b.h >= b.y, lo = below ? b.y + b.h + LR * 0.9 : LR * 0.35, hi = below ? H - LR * 0.35 : b.y - LR * 0.9;
    return [W / 2 + (W / 2 - LR * 0.55) * Math.sin(a * 1.6), (lo + hi) / 2 + Math.max(0, (hi - lo) / 2) * Math.sin(a * 2.4 + 1)];
  }

  // A threat sits where the lens can open fully on it: clear of text, edges and bar.
  function fits(x, y) {
    var m = compactCanvas ? 30 : 56;
    return boxDist(x, y) > LR * 0.85 && x > m && x < W - m && y > m && y < Math.min(H, HB || H) - Math.max(m, LR * 0.45);
  }
  // A free spot well apart from the others; half of them (all on touch) on the drift.
  function findSpot(self) {
    var gap = compactCanvas ? 92 : Math.max(200, Math.min(W, H) * 0.27), onPath = !hover || Math.random() < 0.5;
    for (var tries = 0; tries < 400; tries++) {
      var x, y, p;
      if (onPath) { p = patrolAt(rand(0, PI2 * 5)); x = p[0] + rand(-0.3, 0.3) * LR; y = p[1] + rand(-0.3, 0.3) * LR; }
      else { x = rand(0, W); y = rand(0, H); }
      if (!fits(x, y)) { continue; }
      if (threats.every(function (o) { return o === self || Math.hypot(o.x - x, o.y - y) > gap * (tries > 300 ? 0.6 : 1); })) { return [x, y]; }
    }
    return null;
  }
  function addThreat() {
    var p = findSpot(null);
    if (!p) { return; }
    var d = { x: p[0], y: p[1], hv: 0, ht: 0, threat: { found: 0, seen: 0, hint: 0, ph: rand(0, 6000) } };
    threats.push(d); dust.push(d); // threats hold still, so finds never drift together
  }
  function nearestHidden(p) {
    var best = null, bd = 1e9;
    threats.forEach(function (d) { if (!d.threat.found) { var dd = dist(d, p); if (dd < bd) { bd = dd; best = d; } } });
    return best ? { d: best, dd: bd } : null;
  }

  function stepLens(t, f) {
    var target, rate;
    if (ptr.on) {
      target = [ptr.x, ptr.y]; rate = 0.16;
      var m = nearestHidden(ptr); // close to a threat, the lens leans onto it
      if (m) { var pull = 0.5 * smooth(LR * 0.8, LR * 0.2, m.dd); target = [ptr.x + (m.d.x - ptr.x) * pull, ptr.y + (m.d.y - ptr.y) * pull]; }
    } else {
      target = patrolAt(t * 0.00016); rate = 0.035;
      if (tap) {
        var w = smooth(tap.t + 5000, tap.t + 8000, t);
        target = [tap.x + (target[0] - tap.x) * w, tap.y + (target[1] - tap.y) * w]; rate = 0.06;
        if (w >= 1) { tap = null; }
      }
    }
    if (!lens.on) { lens.x = target[0]; lens.y = target[1]; }
    var q = 1 - Math.pow(1 - rate, f);
    var mx = (target[0] - lens.x) * q, my = (target[1] - lens.y) * q;
    lens.x += mx; lens.y += my;
    lens.v += (Math.sqrt(mx * mx + my * my) / f - lens.v) * 0.15; // px per frame, smoothed
    // It arrives after the headline resolves, and is gone before its rim meets the text or the bar.
    lens.on = Math.min(1, lens.on + (t > 1900 ? 0.012 * f : 0));
    lens.k = lens.on * smooth(LR * 0.4, LR * 0.95, boxDist(lens.x, lens.y));
    if (HB && HB < H - 1) { lens.k *= smooth(HB + LR * 0.2, HB - LR * 0.6, lens.y); }
  }

  // Lens weight of a point: full in the inner third, nothing past the rim.
  function fall(x, y) { var dx = x - lens.x, dy = y - lens.y; return smooth(LR, LR * 0.35, Math.sqrt(dx * dx + dy * dy)) * lens.k; }
  // A slight fisheye: points inside the lens bulge outward, so it reads as glass.
  function place(p) {
    var dx = p.x - lens.x, dy = p.y - lens.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d >= LR || !lens.k) { p.px = p.x; p.py = p.y; return; }
    var u = 1 - d / LR, s = 1 + MAG * u * u * lens.k;
    p.px = lens.x + dx * s; p.py = lens.y + dy * s;
  }

  function neighbours(from) {
    return balls.filter(function (b) { return b !== from && dist(b, from) < LINK * 0.85; });
  }
  function startSignal(t) {
    var candidates = balls.filter(function (b) { return b.x > 0 && b.x < W && b.y > 0 && b.y < H && neighbours(b).length; });
    if (!candidates.length) { nextAt = t + 600; return; }
    var from = pick(candidates);
    signal = { from: from, to: pick(neighbours(from)), start: t, hops: 1, trail: [] };
    from.glow = 1;
  }

  // A hunt: the threat warms to amber, a signal walks two mesh links to it, a ring closes.
  function dustNear(p, skip) {
    return dust.filter(function (d) { return d !== p && !d.threat && skip.indexOf(d) < 0 && dist(d, p) < DLINK && boxDist(d.x, d.y) > 24 && d.x > 24 && d.x < W - 24 && d.y > 24 && d.y < H - 24; });
  }
  function startHunt(s, t) {
    var n1 = dustNear(s, []), path = [s];
    if (n1.length) {
      var a = pick(n1), n2 = dustNear(a, [s]).filter(function (d) { return dist(d, s) > DLINK * 0.6; });
      path = n2.length ? [pick(n2), a, s] : [a, s];
    }
    path.forEach(function (d) { d.ht = 1; });
    hunt = { s: s, path: path, start: t, hop: -1, trail: [], done: 0 };
    if (signal) { signal.hops = HOPS; }
  }
  // A hunt starts once the lens has rested 300ms on a hidden threat.
  function lookForThreats(t, f) {
    if (!seeded && t > 1500) {
      seeded = true;
      for (var i = 0; i < THREATS; i++) { addThreat(); }
      nextFind = 2600;
    }
    var near = nearestHidden(lens), best = near && near.dd < LR * 0.6 ? near.d : null;
    threats.forEach(function (d) { if (d !== best) { d.threat.seen = 0; } });
    if (!best || hunt || t < nextFind || lens.k < 0.6 || lens.v > (ptr.on ? 6 : 3)) { if (best) { best.threat.seen = 0; } return; }
    best.threat.seen += f * 16.67;
    if (best.threat.seen > 300) { startHunt(best, t); }
  }
  function resurface(t) {
    if (!seeded || hunt || threats.length >= CAP) { return; }
    if (threats.some(function (d) { return !d.threat.found; })) { quietSince = 0; return; }
    if (!quietSince) { quietSince = t; return; }
    if (t - quietSince > RESURFACE) { addThreat(); quietSince = 0; }
  }

  // Sonar: a wave from a find, or from the lens as it first appears.
  function radius(p, t) { var u = Math.min(1, (t - p.t) / DUR); return u < 0 ? -1 : (p.far + BAND) * (1 - Math.pow(1 - u, 2.6)); }
  function ping(x, y, t) {
    if (lastPing && t - lastPing < 4000) { return; }
    lastPing = t;
    pings.push({ x: x, y: y, t: t, prev: 0, far: Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)) });
  }
  function stepPings(t) {
    if (!firstPing && lens.on > 0.15 && seeded) { firstPing = true; ping(lens.x, lens.y, t); }
    pings = pings.filter(function (p) { return t - p.t < DUR; });
    pings.forEach(function (p) {
      var r = radius(p, t), r0 = p.prev;
      p.prev = r;
      // The front is fast early on, so test everything it swept since the last frame.
      function crossed(x, y, pad) { var d = Math.hypot(x - p.x, y - p.y); return d >= r0 - pad && d < r + pad; }
      threats.forEach(function (d) {
        if (!d.threat.found && (!d.threat.hint || t - d.threat.hint > 3200) && crossed(d.x, d.y, BAND * 0.3)) { d.threat.hint = t; }
      });
      balls.forEach(function (b) { if (crossed(b.x, b.y, 6) && boxDist(b.x, b.y) > 30) { b.glow = Math.max(b.glow, 0.3); } });
    });
  }
  // How much a passing wave shows a point: a soft band, fainter far out.
  function waveAt(x, y, t) {
    var w = 0;
    pings.forEach(function (p) {
      var r = radius(p, t), off = Math.abs(Math.hypot(x - p.x, y - p.y) - r);
      if (off < BAND) { w = Math.max(w, 0.78 * smooth(BAND, 0, off) * (1 - 0.55 * smooth(0, p.far, r))); }
    });
    return w;
  }
  function hintAt(d, t) { return d.threat && !d.threat.found && d.threat.hint ? 1 - smooth(500, 3200, t - d.threat.hint) : 0; }

  function stepSignal(t) {
    if (!signal) {
      if (t >= nextAt) { startSignal(t); }
    } else {
      var p = (t - signal.start) / HOP;
      if (p >= 1) {
        signal.to.glow = 1;
        var opts = neighbours(signal.to).filter(function (b) { return b !== signal.from; });
        if (signal.hops >= HOPS || !opts.length || balls.indexOf(signal.to) < 0) { signal = null; nextAt = t + GAP; }
        else { signal = { from: signal.to, to: pick(opts), start: t, hops: signal.hops + 1, trail: signal.trail }; p = 0; }
      }
      if (signal) { follow(signal.from, signal.to, p, signal.trail); }
    }
    if (!hunt) { return; }
    var e = t - hunt.start - WARM, hop = Math.floor(e / HUNT_HOP);
    if (hunt.done) {
      // The next hunt may start 700ms after a find; this one's path fades on its own.
      if (t - hunt.done > 700) {
        var old = hunt.path; hunt = null; nextFind = t;
        window.setTimeout(function () { old.forEach(function (d) { if (!hunt || hunt.path.indexOf(d) < 0) { d.ht = 0; } }); }, 1700);
      }
      return;
    }
    if (e < 0) { return; }
    if (hop >= hunt.path.length - 1) { hunt.done = t; hunt.s.threat.found = t; ping(hunt.s.px, hunt.s.py, t); hunt.trail = []; return; }
    if (hop !== hunt.hop) { hunt.hop = hop; hunt.path[hop].glow = 1; }
    follow(hunt.path[hop], hunt.path[hop + 1], (e - hop * HUNT_HOP) / HUNT_HOP, hunt.trail);
  }
  function follow(from, to, p, trail) {
    var k = ease(Math.min(1, p)), x = from.px + (to.px - from.px) * k, y = from.py + (to.py - from.py) * k;
    trail.unshift({ x: x, y: y });
    trail.length = Math.min(trail.length, 10);
  }

  function line(a, b, style) {
    ctx.strokeStyle = style; ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  function dot(x, y, r, style) { ctx.fillStyle = style; ctx.beginPath(); ctx.arc(x, y, r, 0, PI2); ctx.fill(); }
  function ring(x, y, r, style, a0, a1) { ctx.strokeStyle = style; ctx.beginPath(); ctx.arc(x, y, r, a0 || 0, a1 === undefined ? PI2 : a1); ctx.stroke(); }
  function glow(x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    dot(x, y, r, g);
  }
  function lit(a, b, s) { return s && ((a === s.from && b === s.to) || (b === s.from && a === s.to)); }
  function clipText() {
    ctx.save();
    if (box) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip('evenodd'); }
  }
  function drawTrail(tr) {
    tr.forEach(function (pt, k) {
      dot(pt.x, pt.y, k === 0 ? 2.6 : 1.8, 'rgba(200,255,252,' + (k === 0 ? 1 : 0.45 * (1 - k / tr.length)).toFixed(3) + ')');
    });
  }
  // A find, for good: a steady amber point breathing slowly, its teal ring closing once.
  function drawFind(d, t) {
    var c = t - d.threat.found, settle = smooth(0, 1600, c), breathe = 0.5 + 0.5 * Math.sin((t + d.threat.ph) / 1000);
    glow(d.px, d.py, 12 - 3 * settle, AMBER, 0.3 + (0.1 + 0.06 * breathe - 0.3) * settle);
    dot(d.px, d.py, 1.9, 'rgba(' + AMBER + ',0.88)');
    var sweep = ease(smooth(0, 1100, c));
    ring(d.px, d.py, 6.5 + 3 * (1 - sweep), 'rgba(' + TEAL + ',' + (0.5 - 0.18 * smooth(1100, 3200, c)).toFixed(3) + ')', -Math.PI / 2, -Math.PI / 2 + PI2 * sweep);
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 0.8;
    clipText();

    // The lens: a barely-there pool of light with a faint rim.
    if (lens.k > 0.01) {
      var g = ctx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, LR);
      g.addColorStop(0, 'rgba(' + TEAL + ',' + (0.045 * lens.k).toFixed(3) + ')');
      g.addColorStop(0.75, 'rgba(' + TEAL + ',' + (0.02 * lens.k).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + TEAL + ',0)');
      dot(lens.x, lens.y, LR, g);
      ring(lens.x, lens.y, LR * 0.97, 'rgba(' + TEAL + ',' + (0.07 * lens.k).toFixed(3) + ')');
    }

    // The hidden mesh, where the lens, a hunt or a passing wave shows it.
    var shown = [];
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.hv += (d.ht - d.hv) * 0.1;
      d.w = Math.max(fall(d.x, d.y), d.hv * 0.8, pings.length ? waveAt(d.x, d.y, t) : 0, 0.9 * hintAt(d, t));
      if (d.w > 0.01 || d.threat) { place(d); }
      if (d.w > 0.01) { shown.push(d); }
    }
    for (i = 0; i < shown.length; i++) {
      for (var j = i + 1; j < shown.length; j++) {
        var a = shown[i], b = shown[j], f = dist(a, b) / DLINK;
        // A hunt's links are grey until its signal has crossed them, then teal.
        var ia = hunt && a.ht ? hunt.path.indexOf(a) : -1, ib = hunt && b.ht ? hunt.path.indexOf(b) : -1;
        var hop = ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1 ? Math.min(ia, ib) : -1;
        var w = Math.min(a.w, b.w);
        if (hop >= 0 && (hunt.done || hop <= hunt.hop)) { line(a, b, 'rgba(' + TEAL + ',' + ((hop === hunt.hop && !hunt.done ? 0.6 : 0.36) * w).toFixed(3) + ')'); }
        else if (f < 1 || hop >= 0) { line(a, b, 'rgba(160,190,190,' + (0.26 * w * Math.max(1 - f, hop >= 0 ? 0.6 : 0)).toFixed(3) + ')'); }
      }
    }
    shown.forEach(function (d) {
      if (d.glow > 0.02) { glow(d.px, d.py, 10, TEAL, 0.4 * d.glow); d.glow *= 0.94; }
      if (!d.threat) { dot(d.px, d.py, 1.2, 'rgba(170,215,215,' + (0.7 * d.w).toFixed(3) + ')'); return; }
      if (d.threat.found) { return; } // drawn with the finds, above the network
      if (hunt && d === hunt.s) {
        var warm = smooth(0, WARM, t - hunt.start), steady = Math.max(d.w, warm);
        glow(d.px, d.py, 12, AMBER, (0.12 + 0.18 * warm) * steady);
        dot(d.px, d.py, 1.6 + 0.3 * warm, 'rgba(' + AMBER + ',' + ((0.7 + 0.18 * warm) * steady).toFixed(3) + ')');
        return;
      }
      // Hidden: a dim amber point, through the lens or for a moment after a wave.
      var hk = hintAt(d, t), age = t - d.threat.hint;
      if (hk > 0 && age < 900) { var o = ease(age / 900); ring(d.px, d.py, 4 + 12 * o, 'rgba(' + AMBER + ',' + (0.35 * (1 - o)).toFixed(3) + ')'); }
      glow(d.px, d.py, 9, AMBER, 0.12 * d.w + 0.1 * hk);
      dot(d.px, d.py, 1.6, 'rgba(' + AMBER + ',' + (0.7 * d.w).toFixed(3) + ')');
    });
    ctx.restore();

    // The network, as before; the lens lifts what it covers by about 15%.
    for (i = 0; i < balls.length; i++) { place(balls[i]); balls[i].lw = fall(balls[i].x, balls[i].y); }
    for (i = 0; i < balls.length; i++) {
      for (j = i + 1; j < balls.length; j++) {
        a = balls[i]; b = balls[j]; f = dist(a, b) / LINK;
        if (f < 1) {
          line(a, b, lit(a, b, signal) ? 'rgba(' + TEAL + ',' + ((1 - f) * 0.7).toFixed(3) + ')'
            : 'rgba(150,150,150,' + ((1 - f) * 0.45 * (1 + 0.15 * Math.max(a.lw, b.lw))).toFixed(3) + ')');
        }
      }
    }
    balls.forEach(function (b) {
      if (b.glow > 0.02) { glow(b.px, b.py, 14, TEAL, 0.5 * b.glow); b.glow *= 0.94; }
      dot(b.px, b.py, R, 'rgba(' + TEAL + ',' + Math.min(1, Math.max(b.alpha + 0.15 * b.lw, b.glow)).toFixed(3) + ')');
    });

    clipText();
    threats.forEach(function (d) { if (d.threat.found) { drawFind(d, t); } });
    if (signal && signal.trail.length) { drawTrail(signal.trail); }
    if (hunt && hunt.trail.length) { drawTrail(hunt.trail); }
    ctx.restore();
  }

  function update(f) {
    balls = balls.filter(function (b) {
      b.x += b.vx * f; b.y += b.vy * f;
      b.phase += 0.03 * f; b.alpha = Math.abs(Math.cos(b.phase));
      return b.x > -50 && b.x < W + 50 && b.y > -50 && b.y < H + 50;
    });
    if (balls.length < ball_limit) { balls.push(spawn()); }
    dust.forEach(function (d) {
      if (d.threat) { return; }
      d.x += d.vx * f; d.y += d.vy * f;
      if (d.ht) { return; }
      if (d.x < -10) { d.x += W + 20; } else if (d.x > W + 10) { d.x -= W + 20; }
      if (d.y < -10) { d.y += H + 20; } else if (d.y > H + 10) { d.y -= H + 20; }
    });
  }

  var canvasRunning = false, rafId = null, canvasOnScreen = true;
  function frame(t) {
    if (!canvasRunning) { return; }
    var f = last ? Math.min(3, (t - last) / 16.67) : 1;
    last = t;
    stepLens(t, f);
    balls.forEach(place);
    lookForThreats(t, f);
    resurface(t);
    stepPings(t);
    stepSignal(t);
    render(t);
    update(f);
    rafId = window.requestAnimationFrame(frame);
  }
  function start() {
    if (!document.hidden && canvasOnScreen && !canvasRunning) { canvasRunning = true; last = 0; rafId = window.requestAnimationFrame(frame); }
  }
  function stop() {
    canvasRunning = false;
    if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  initCanvas();
  for (var n = 0; n < (compactCanvas ? 11 : 20); n++) { var b0 = spawn(); b0.x = rand(0, W); b0.y = rand(0, H); balls.push(b0); }
  nextAt = 2600; // after the entrance and the headline scramble
  start();

  window.addEventListener('resize', function () {
    if (compactCanvas && canvas.getBoundingClientRect().width === W && Math.abs(canvas.getBoundingClientRect().height - H) < 160) { return; }
    initCanvas();
  });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measureText); }
  [900, 1400].forEach(function (ms) { window.setTimeout(measureText, ms); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      canvasOnScreen = entries[entries.length - 1].isIntersecting;
      if (canvasOnScreen) { start(); } else { stop(); }
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });

  // The hero text sits above the canvas, so listen on the document.
  function local(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; }
  if (hover) {
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') { return; }
      var p = local(e);
      ptr.x = p[0]; ptr.y = p[1];
      ptr.on = p[0] >= 0 && p[1] >= 0 && p[0] <= p[2].width && p[1] <= p[2].height;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { ptr.on = false; });
  }
  // A tap on the hero (not on a link) aims the drifting lens there.
  document.addEventListener('click', function (e) {
    if (ptr.on || (e.target.closest && e.target.closest('a, button'))) { return; }
    var p = local(e);
    if (p[1] < 0 || p[1] > p[2].height) { return; }
    tap = { x: p[0], y: p[1], t: performance.now() };
  });
})();

/*Canvas end*/
