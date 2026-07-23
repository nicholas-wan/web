
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
	var compactIntro = window.matchMedia('(max-width: 480px)');

	function watchMedia(query, callback) {
		if (query.addEventListener) query.addEventListener('change', callback);
		else query.addListener(callback);
	}

	// Reveal content as soon as its DOM and interaction handlers are ready.
	// The homepage keeps its load-synchronised intro/scramble choreography;
	// content pages should not remain under the theme fade while images load.
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

	// Retain the theme's smooth in-page links without the old scrolly plugin.
	Array.prototype.forEach.call(document.querySelectorAll('a.scrolly'), function(link) {
		link.addEventListener('click', function(event) {
			var href = link.getAttribute('href');
			if (!href || href.charAt(0) !== '#' || href.length < 2) return;
			var target;
			try { target = document.querySelector(href); }
			catch (error) { return; }
			if (!target) return;
			event.preventDefault();
			window.scrollTo({
				top: Math.max(0, target.getBoundingClientRect().top + window.scrollY),
				behavior: reducedMotion.matches ? 'auto' : 'smooth'
			});
		});
	});

	// The background layer always exists, but scroll-linked parallax only runs
	// on a standard-density desktop pointer and when motion has not been reduced.
	(function setupParallax(element, intensity) {
		var background = document.createElement('div');
		var desktopPointer = window.matchMedia('(min-width: 1281px) and (hover: hover) and (pointer: fine)');
		var enabled = false;
		var frame = null;
		var elementTop = 0;
		background.className = 'bg fixed';
		element.appendChild(background);

		function renderParallax() {
			frame = null;
			if (!enabled) return;
			var offset = (window.scrollY - elementTop) * intensity;
			background.style.transform = 'matrix(1,0,0,1,0,' + offset + ')';
		}

		function queueParallax() {
			if (enabled && frame === null) frame = window.requestAnimationFrame(renderParallax);
		}

		function measureParallax() {
			elementTop = element.getBoundingClientRect().top + window.scrollY;
			queueParallax();
		}

		function syncParallax() {
			var shouldEnable = desktopPointer.matches && !reducedMotion.matches && window.devicePixelRatio <= 1;
			if (shouldEnable === enabled) {
				queueParallax();
				return;
			}
			enabled = shouldEnable;
			background.classList.toggle('fixed', !enabled);
			if (enabled) {
				window.addEventListener('scroll', queueParallax, { passive: true });
				queueParallax();
			}
			else {
				window.removeEventListener('scroll', queueParallax);
				if (frame !== null) window.cancelAnimationFrame(frame);
				frame = null;
				background.style.transform = 'none';
			}
		}

		watchMedia(desktopPointer, syncParallax);
		watchMedia(reducedMotion, syncParallax);
		window.addEventListener('resize', measureParallax, { passive: true });
		window.addEventListener('load', measureParallax, { once: true });
		measureParallax();
		syncParallax();
	})(wrapper, 0.925);

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

	var toggleToneFrame = null;
	function renderToggleTone() {
		toggleToneFrame = null;
		if (!header) {
			navPanelToggle.classList.add('alt');
			return;
		}
		navPanelToggle.classList.toggle('alt', header.getBoundingClientRect().bottom <= window.innerHeight * 0.05);
	}
	function queueToggleTone() {
		if (toggleToneFrame === null) toggleToneFrame = window.requestAnimationFrame(renderToggleTone);
	}
	window.addEventListener('scroll', queueToggleTone, { passive: true });
	window.addEventListener('resize', queueToggleTone, { passive: true });
	queueToggleTone();

	// The wrapper-level pill steps away on downward reading progress and returns
	// on upward intent. Context and sticky navigation parents opt out.
	var toggleScrollY = window.scrollY;
	window.addEventListener('scroll', function() {
		if (navPanelToggle.parentElement !== wrapper) return;
		var y = window.scrollY;
		if (Math.abs(y - toggleScrollY) < 8) return;
		if (y > toggleScrollY && y > 160 && !body.classList.contains('is-navPanel-visible'))
			navPanelToggle.classList.add('is-scrolled-away');
		else
			navPanelToggle.classList.remove('is-scrolled-away');
		toggleScrollY = y;
	}, { passive: true });

	var navPanel = document.createElement('div');
	navPanel.id = 'navPanel';
	navPanel.setAttribute('role', 'dialog');
	navPanel.setAttribute('aria-modal', 'true');
	navPanel.setAttribute('aria-label', 'Site navigation');
	navPanel.setAttribute('aria-hidden', 'true');
	navPanel.innerHTML =
		'<span class="nav-panel__handle" aria-hidden="true"></span>' +
		'<div class="nav-panel__header"><span>Navigate</span></div>' +
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

	document.addEventListener('click', function(event) {
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
			var firstLink = navPanel.querySelector('nav a');
			var focusTries = 0;
			(function focusIntoPanel() {
				if (!firstLink || !body.classList.contains('is-navPanel-visible')) return;
				firstLink.focus({ preventScroll: true });
				if (document.activeElement !== firstLink && ++focusTries < 30)
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
		if (!navPanel.contains(document.activeElement)) {
			event.preventDefault();
			first.focus();
		}
		else if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		}
		else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
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
	watchMedia(mobileNav, syncNavMode);
	syncNavMode();

	// The intro fades once the main content crosses the same desktop/mobile
	// handoff zones formerly managed by Scrollex, and returns when scrolling up.
	var intro = document.getElementById('intro');
	if (intro) {
		var introFrame = null;
		function syncIntro() {
			introFrame = null;
			var threshold = window.innerHeight * (compactIntro.matches ? 0.65 : 0.75);
			intro.classList.toggle('hidden', main.getBoundingClientRect().top <= threshold);
		}
		function queueIntro() {
			if (introFrame === null) introFrame = window.requestAnimationFrame(syncIntro);
		}
		watchMedia(compactIntro, queueIntro);
		window.addEventListener('scroll', queueIntro, { passive: true });
		window.addEventListener('resize', queueIntro, { passive: true });
		queueIntro();
	}

	// Return-to-top visibility and scrolling no longer require a second script.
	var returnToTop = document.getElementById('return-to-top');
	if (returnToTop) {
		var topFrame = null;
		function syncReturnToTop() {
			topFrame = null;
			returnToTop.classList.toggle('is-visible', window.scrollY >= 50);
		}
		function queueReturnToTop() {
			if (topFrame === null) topFrame = window.requestAnimationFrame(syncReturnToTop);
		}
		window.addEventListener('scroll', queueReturnToTop, { passive: true });
		returnToTop.addEventListener('click', function(event) {
			event.preventDefault();
			window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
		});
		queueReturnToTop();
	}
})();

/*Canvas*/
var canvas = document.getElementById('nokey');
var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var compactCanvas = window.matchMedia && window.matchMedia('(max-width: 736px)').matches;
if (canvas && reducedMotion) {
   canvas.hidden = true;
}
if (canvas && !reducedMotion) {
   var can_w = parseInt(canvas.getAttribute('width')),
   can_h = parseInt(canvas.getAttribute('height')),
   ctx = canvas.getContext('2d'),
   animationFrameId = null,
   canvasRunning = false;

// console.log(typeof can_w);

var ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      alpha: 1,
      phase: 0
   },
   ball_color = {
       r: 0,
       g: 224,
       b: 224
   },
   R = 2,
   balls = [],
   alpha_f = 0.03,
   alpha_phase = 0,

// Line
   link_line_width = 0.8,
   dis_limit = compactCanvas ? 145 : 210,
   ball_limit = compactCanvas ? 9 : 14,
   add_mouse_point = true,
   mouse_in = false,
   mouse_ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      type: 'mouse'
   };

// Random speed
function getRandomSpeed(pos){
    var  min = -1,
       max = 1;
    switch(pos){
        case 'top':
            return [randomNumFrom(min, max), randomNumFrom(0.1, max)];
            break;
        case 'right':
            return [randomNumFrom(min, -0.1), randomNumFrom(min, max)];
            break;
        case 'bottom':
            return [randomNumFrom(min, max), randomNumFrom(min, -0.1)];
            break;
        case 'left':
            return [randomNumFrom(0.1, max), randomNumFrom(min, max)];
            break;
        default:
            return;
            break;
    }
}
function randomArrayItem(arr){
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumFrom(min, max){
    return Math.random()*(max - min) + min;
}
// Random Ball
function getRandomBall(){
    var pos = randomArrayItem(['top', 'right', 'bottom', 'left']);
    switch(pos){
        case 'top':
            return {
                x: randomSidePos(can_w),
                y: -R,
                vx: getRandomSpeed('top')[0],
                vy: getRandomSpeed('top')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'right':
            return {
                x: can_w + R,
                y: randomSidePos(can_h),
                vx: getRandomSpeed('right')[0],
                vy: getRandomSpeed('right')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'bottom':
            return {
                x: randomSidePos(can_w),
                y: can_h + R,
                vx: getRandomSpeed('bottom')[0],
                vy: getRandomSpeed('bottom')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'left':
            return {
                x: -R,
                y: randomSidePos(can_h),
                vx: getRandomSpeed('left')[0],
                vy: getRandomSpeed('left')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
    }
}
function randomSidePos(length){
    return Math.ceil(Math.random() * length);
}

// Draw Ball
function renderBalls(){
    Array.prototype.forEach.call(balls, function(b){
       if(!b.hasOwnProperty('type')){
           ctx.fillStyle = 'rgba('+ball_color.r+','+ball_color.g+','+ball_color.b+','+b.alpha+')';
           ctx.beginPath();
           ctx.arc(b.x, b.y, R, 0, Math.PI*2, true);
           ctx.closePath();
           ctx.fill();
       }
    });
}

// Update balls
function updateBalls(){
    var new_balls = [];
    Array.prototype.forEach.call(balls, function(b){
        b.x += b.vx;
        b.y += b.vy;

        if(b.x > -(50) && b.x < (can_w+50) && b.y > -(50) && b.y < (can_h+50)){
           new_balls.push(b);
        }

        // alpha change
        b.phase += alpha_f;
        b.alpha = Math.abs(Math.cos(b.phase));
        // console.log(b.alpha);
    });

    balls = new_balls.slice(0);
}

// loop alpha
function loopAlphaInf(){

}

// Draw lines
function renderLines(){
    var fraction, alpha;
    for (var i = 0; i < balls.length; i++) {
        for (var j = i + 1; j < balls.length; j++) {

           fraction = getDisOf(balls[i], balls[j]) / dis_limit;

           if(fraction < 1){
               alpha = ((1 - fraction) * 0.45).toString();

               ctx.strokeStyle = 'rgba(150,150,150,'+alpha+')';
               ctx.lineWidth = link_line_width;

               ctx.beginPath();
               ctx.moveTo(balls[i].x, balls[i].y);
               ctx.lineTo(balls[j].x, balls[j].y);
               ctx.stroke();
               ctx.closePath();
           }
        }
    }
}

// calculate distance between two points
function getDisOf(b1, b2){
    var  delta_x = Math.abs(b1.x - b2.x),
       delta_y = Math.abs(b1.y - b2.y);

    return Math.sqrt(delta_x*delta_x + delta_y*delta_y);
}

// add balls if there a little balls
function addBallIfy(){
    if(balls.length < ball_limit){
        balls.push(getRandomBall());
    }
}

// Render
function render(){
    if(!canvasRunning){
        return;
    }
    ctx.clearRect(0, 0, can_w, can_h);

    renderBalls();

    renderLines();

    updateBalls();

    addBallIfy();

    animationFrameId = window.requestAnimationFrame(render);
}

// Init Balls
function initBalls(num){
    for(var i = 1; i <= num; i++){
        balls.push({
            x: randomSidePos(can_w),
            y: randomSidePos(can_h),
            vx: getRandomSpeed('top')[0],
            vy: getRandomSpeed('top')[1],
            r: R,
            alpha: 1,
            phase: randomNumFrom(0, 10)
        });
    }
}
// Init Canvas
function initCanvas(){
    // clientWidth/Height exclude the scrollbar; innerWidth/Height include it,
    // which made the canvas wider than the layout viewport and let the page
    // scroll horizontally by the scrollbar width.
    var docEl = document.documentElement;
    canvas.setAttribute('width', docEl.clientWidth);
    canvas.setAttribute('height', docEl.clientHeight);

    can_w = parseInt(canvas.getAttribute('width'));
    can_h = parseInt(canvas.getAttribute('height'));
}
window.addEventListener('resize', function(e){
    initCanvas();
});

function goMovie(){
    initCanvas();
    if(!balls.length){
        initBalls(compactCanvas ? 11 : 20);
    }
    if(!document.hidden && !canvasRunning){
        canvasRunning = true;
        animationFrameId = window.requestAnimationFrame(render);
    }
}
function stopMovie(){
    canvasRunning = false;
    if(animationFrameId !== null){
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}
goMovie();

document.addEventListener('visibilitychange', function(){
    if(document.hidden){
        stopMovie();
    } else {
        goMovie();
    }
});

// Mouse effect
canvas.addEventListener('mouseenter', function(){
    mouse_in = true;
    balls.push(mouse_ball);
});
canvas.addEventListener('mouseleave', function(){
    mouse_in = false;
    var new_balls = [];
    Array.prototype.forEach.call(balls, function(b){
        if(!b.hasOwnProperty('type')){
            new_balls.push(b);
        }
    });
    balls = new_balls.slice(0);
});
canvas.addEventListener('mousemove', function(e){
    var e = e || window.event;
    mouse_ball.x = e.pageX;
    mouse_ball.y = e.pageY;
    // console.log(mouse_ball);
});

}

// Shared progressive enhancement: keep gallery pages fast and external links safe.
(function() {
	var images = document.querySelectorAll('img');
	Array.prototype.forEach.call(images, function(image, index) {
		image.decoding = 'async';
		// Leave alt="" alone: an intentional empty alt marks a decorative image
		// and must stay empty, not be filled with filename noise.
		if (index > 1 && !image.hasAttribute('loading')) {
			image.loading = 'lazy';
		}
	});

	var links = document.querySelectorAll('a[target="_blank"], a[target="__blank"]');
	Array.prototype.forEach.call(links, function(link) {
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
	});
})();

// Toolkit details stay visible in the static desktop rows and become explicit
// disclosures on smaller screens, so pointer travel and keyboard focus never
// resize the desktop layout unexpectedly. Details ship expanded so the content
// also remains reachable without JS and in print.
(function() {
	var cards = Array.prototype.slice.call(document.querySelectorAll('.toolkit-card'));
	if (!cards.length) return;
	var desktopCards = window.matchMedia('(min-width: 981px)');

	function setExpanded(card, expanded) {
		var button = card.querySelector('.toolkit-card__toggle');
		var detail = card.querySelector('.toolkit-card__detail');
		var hint = card.querySelector('.toolkit-card__hint');
		var label = card.querySelector('.toolkit-card__toggle-label');
		var title = card.querySelector('.toolkit-card__title');
		card.classList.toggle('is-expanded', expanded);
		if (button) button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		if (detail) {
			if (expanded) detail.style.setProperty('--toolkit-detail-height', detail.scrollHeight + 'px');
			detail.setAttribute('aria-hidden', expanded ? 'false' : 'true');
		}
		if (hint) hint.textContent = expanded ? 'Hide details' : 'View details';
		if (label && title) label.textContent = (expanded ? 'Hide ' : 'View ') + title.textContent + ' details';
	}
	function collapseOthers(activeCard) {
		cards.forEach(function(card) {
			if (card === activeCard) return;
			setExpanded(card, false);
		});
	}
	cards.forEach(function(card) {
		var button = card.querySelector('.toolkit-card__toggle');
		card.classList.add('toolkit-card--js');
		setExpanded(card, desktopCards.matches);

		if (button) {
			// Enter/Space arrive as native button clicks.
			button.addEventListener('click', function() {
				var expanded = !card.classList.contains('is-expanded');
				collapseOthers(card);
				setExpanded(card, expanded);
			});
		}
		card.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') {
				setExpanded(card, false);
				if (button) button.focus();
			}
		});
	});

	function syncCardMode() {
		cards.forEach(function(card) {
			setExpanded(card, desktopCards.matches ? true : card.classList.contains('is-expanded'));
		});
	}

	if (desktopCards.addEventListener) desktopCards.addEventListener('change', function() {
		cards.forEach(function(card) { setExpanded(card, desktopCards.matches); });
	});
	else desktopCards.addListener(function() {
		cards.forEach(function(card) { setExpanded(card, desktopCards.matches); });
	});

	window.addEventListener('resize', syncCardMode);
})();
