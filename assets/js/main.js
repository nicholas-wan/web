
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
/* Homepage background: the drifting particle network behind the hero, plus
   "calm signals" (Oct 2026, owner-approved after a lab trial): every few
   seconds one small bright signal hops along the existing links from node to
   node, like a message passing between agents, and each node it reaches
   glows briefly. The signal is clipped out of the hero text block so it never
   crosses the name or headline. No labels and no extra lines. Hidden under
   reduced motion, paused off screen and in hidden tabs, and phone
   height-only resizes are ignored. */
(function () {
  'use strict';

  var canvas = document.getElementById('nokey');
  if (!canvas) { return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.hidden = true; return; }

  var ctx = canvas.getContext('2d');
  var compactCanvas = window.matchMedia('(max-width: 736px)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var W = 0, H = 0;
  var R = 2, LINK = compactCanvas ? 145 : 210, ball_limit = compactCanvas ? 9 : 14;
  var balls = [];
  var mouse = { x: 0, y: 0, mouse: true, active: false };

  // Signals: a hop takes HOP ms; a chain makes up to HOPS hops, then the next
  // chain starts after a quiet gap so the effect stays occasional.
  var HOP = 900, HOPS = 4, GAP = 1800;
  var signal = null, nextSignalAt = 0;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawn() {
    var side = Math.floor(Math.random() * 4), b = { r: R, alpha: 1, phase: rand(0, 10), glow: 0 };
    if (side === 0) { b.x = rand(0, W); b.y = -R; b.vx = rand(-1, 1); b.vy = rand(0.1, 1); }
    else if (side === 1) { b.x = W + R; b.y = rand(0, H); b.vx = rand(-1, -0.1); b.vy = rand(-1, 1); }
    else if (side === 2) { b.x = rand(0, W); b.y = H + R; b.vx = rand(-1, 1); b.vy = rand(-1, -0.1); }
    else { b.x = -R; b.y = rand(0, H); b.vx = rand(0.1, 1); b.vy = rand(-1, 1); }
    return b;
  }

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  // The hero text (name to CTA): signals pass behind it, never across it.
  var textBox = null;
  function measureText() {
    var top = document.querySelector('#intro h1');
    var bottom = document.querySelector('#intro .portfolio-hero__actions') || top;
    var summary = document.querySelector('#intro .portfolio-hero__summary') || top;
    if (!top) { textBox = null; return; }
    var c = canvas.getBoundingClientRect(), a = top.getBoundingClientRect(), s = summary.getBoundingClientRect(), b = bottom.getBoundingClientRect();
    textBox = {
      x: Math.min(a.left, s.left, b.left) - c.left - 16, y: a.top - c.top - 16,
      w: Math.max(a.right, s.right, b.right) - Math.min(a.left, s.left, b.left) + 32, h: b.bottom - a.top + 32
    };
  }

  function initCanvas() {
    var docEl = document.documentElement;
    W = docEl.clientWidth; H = docEl.clientHeight;
    canvas.width = W; canvas.height = H;
    measureText();
  }

  function neighbours(from) {
    return balls.filter(function (b) { return b !== from && !b.mouse && dist(b, from) < LINK * 0.85; });
  }

  function startSignal(t) {
    var candidates = balls.filter(function (b) { return !b.mouse && b.x > 0 && b.x < W && b.y > 0 && b.y < H && neighbours(b).length; });
    if (!candidates.length) { nextSignalAt = t + 600; return; }
    var from = candidates[Math.floor(Math.random() * candidates.length)];
    var opts = neighbours(from);
    signal = { from: from, to: opts[Math.floor(Math.random() * opts.length)], start: t, hops: 1, trail: [] };
    from.glow = 1;
  }

  function stepSignal(t) {
    if (!signal) { if (t >= nextSignalAt) { startSignal(t); } return; }
    var p = (t - signal.start) / HOP;
    if (p >= 1) {
      signal.to.glow = 1;
      // Hop on to a node not just visited, if the link still holds.
      var opts = neighbours(signal.to).filter(function (b) { return b !== signal.from; });
      if (signal.hops >= HOPS || !opts.length || balls.indexOf(signal.to) < 0) { signal = null; nextSignalAt = t + GAP; return; }
      signal = { from: signal.to, to: opts[Math.floor(Math.random() * opts.length)], start: t, hops: signal.hops + 1, trail: signal.trail };
      p = 0;
    }
    // Both ends drift while the signal travels, so place it along the live link.
    var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    var x = signal.from.x + (signal.to.x - signal.from.x) * e;
    var y = signal.from.y + (signal.to.y - signal.from.y) * e;
    signal.trail.unshift({ x: x, y: y });
    signal.trail.length = Math.min(signal.trail.length, 10);
    signal.x = x; signal.y = y;
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    var pts = mouse.active ? balls.concat([mouse]) : balls;

    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var f = dist(pts[i], pts[j]) / LINK;
        if (f < 1) {
          var lit = signal && ((pts[i] === signal.from && pts[j] === signal.to) || (pts[j] === signal.from && pts[i] === signal.to));
          ctx.strokeStyle = lit ? 'rgba(0,224,224,' + ((1 - f) * 0.7).toFixed(3) + ')' : 'rgba(150,150,150,' + ((1 - f) * 0.45).toFixed(3) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }

    balls.forEach(function (b) {
      if (b.glow > 0.02) {
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 14);
        g.addColorStop(0, 'rgba(0,224,224,' + (0.5 * b.glow).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,224,224,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 14, 0, Math.PI * 2); ctx.fill();
        b.glow *= 0.94;
      }
      ctx.fillStyle = 'rgba(0,224,224,' + Math.max(b.alpha, b.glow).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.fill();
    });

    if (signal && signal.trail.length) {
      ctx.save();
      if (textBox) {
        ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(textBox.x, textBox.y, textBox.w, textBox.h); ctx.clip('evenodd');
      }
      signal.trail.forEach(function (pt, k) {
        ctx.fillStyle = 'rgba(200,255,252,' + (k === 0 ? 1 : 0.45 * (1 - k / signal.trail.length)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, k === 0 ? 2.6 : 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    }
  }

  function update() {
    balls = balls.filter(function (b) {
      b.x += b.vx; b.y += b.vy;
      b.phase += 0.03; b.alpha = Math.abs(Math.cos(b.phase));
      return b.x > -50 && b.x < W + 50 && b.y > -50 && b.y < H + 50;
    });
    if (balls.length < ball_limit) { balls.push(spawn()); }
  }

  // The canvas sits behind the hero only; once the reader scrolls past it,
  // stop repainting an unseen layer every frame.
  var canvasRunning = false, rafId = null, canvasOnScreen = true;
  function frame(t) {
    if (!canvasRunning) { return; }
    stepSignal(t);
    render(t);
    update();
    rafId = window.requestAnimationFrame(frame);
  }
  function start() {
    if (!document.hidden && canvasOnScreen && !canvasRunning) {
      canvasRunning = true; rafId = window.requestAnimationFrame(frame);
    }
  }
  function stop() {
    canvasRunning = false;
    if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  initCanvas();
  for (var n = 0; n < (compactCanvas ? 11 : 20); n++) {
    var b = spawn(); b.x = rand(0, W); b.y = rand(0, H); balls.push(b);
  }
  nextSignalAt = 1400; // let the headline scramble finish first
  start();

  // A phone URL-bar show/hide changes only the height; re-initialising then
  // would clear the bitmap mid-scroll for nothing visible.
  window.addEventListener('resize', function () {
    var docEl = document.documentElement;
    if (compactCanvas && docEl.clientWidth === W && Math.abs(docEl.clientHeight - H) < 160) { return; }
    initCanvas();
  });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measureText); }
  window.setTimeout(measureText, 1300);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      canvasOnScreen = entries[entries.length - 1].isIntersecting;
      if (canvasOnScreen) { start(); } else { stop(); }
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });

  // The hero text sits above the canvas, so track the pointer on the document.
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.active = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    }, { passive: true });
  }
})();

/*Canvas end*/
