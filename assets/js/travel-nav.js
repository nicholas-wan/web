(function () {
  var nav = document.querySelector('.travel-section-nav');
  if (!nav) return;

  /* Every journal uses the same iPhone scroll safeguards. The bug was first
     isolated on one trip, but it came from this shared sticky navigation. */
  document.documentElement.classList.add('is-travel-journal-scroll-guard');

  var menuToggle = document.getElementById('navPanelToggle');
  if (menuToggle) {
    nav.insertBefore(menuToggle, nav.firstChild);
    nav.classList.add('travel-section-nav--with-menu');
  }

  var mobileNav = window.matchMedia('(max-width: 980px)');
  /* Publish the toolbar's real height as --travel-nav-offset so the CSS
     scroll-margin-top on trip sections clears it even when the link row wraps
     (USA/Canada reaches ~5 rows at desktop). This makes the native hash jump
     land correctly on its own; the bounded landing correction below stays as
     the safety net for late layout shifts. */
  var lastNavOffset = 0;
  var publishNavOffset = function () {
    var offset = Math.ceil(nav.getBoundingClientRect().height) + 12;
    if (offset !== lastNavOffset) {
      lastNavOffset = offset;
      document.documentElement.style.setProperty('--travel-nav-offset', offset + 'px');
    }
  };
  var updateNavSurface = function () {
    var isStuck = mobileNav.matches && nav.getBoundingClientRect().top <= 1;
    nav.classList.toggle('is-stuck', isStuck);
    publishNavOffset();
  };
  updateNavSurface();

  /* A browser hash jump can happen before lazy media and web fonts settle.
     Keep the requested heading just below the real sticky toolbar for a short,
     bounded landing window, then release control as soon as the visitor acts. */
  var landingCleanup = null;
  /* Once the visitor scrolls or touches, the load/pageshow restarts below
     must not re-land the old hash: arriving with #trip-section-1, reading
     ahead, and then being yanked back to the top when the page finished
     loading was a real iPhone report. A fresh chip tap re-arms via
     hashchange. */
  var manualSinceNav = false;
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (name) {
    window.addEventListener(name, function () { manualSinceNav = true; }, { capture: true, passive: true });
  });
  var startAnchorLanding = function (force) {
    if (landingCleanup) landingCleanup();
    if (manualSinceNav && !force) return;
    var hash = window.location.hash;
    if (!/^#trip-section-\d+$/.test(hash)) return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    var cancelled = false;
    var observer = null;
    var timer = null;
    var deadline = Date.now() + 5000;
    var scrollArmed = false;
    var expectedScrollY = null;
    var manualEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    var cancel = function () { cancelled = true; cleanup(); };
    var cancelUnexpectedScroll = function () {
      /* A visitor can move the page after load but before the first delayed
         correction sample on image-heavy journals. Treat that as ownership
         of the viewport too. Native pre-load hash movement is still allowed. */
      if (!scrollArmed) {
        if (document.readyState !== 'complete') return;
        manualSinceNav = true;
        cancel();
        return;
      }
      if (expectedScrollY !== null && Math.abs(window.pageYOffset - expectedScrollY) <= 2) {
        expectedScrollY = null;
        return;
      }
      manualSinceNav = true;
      cancel();
    };
    var cleanup = function () {
      if (timer) window.clearTimeout(timer);
      if (observer) observer.disconnect();
      manualEvents.forEach(function (name) { window.removeEventListener(name, cancel, true); });
      window.removeEventListener('scroll', cancelUnexpectedScroll, true);
      if (landingCleanup === cleanup) landingCleanup = null;
    };
    landingCleanup = cleanup;
    manualEvents.forEach(function (name) { window.addEventListener(name, cancel, true); });
    window.addEventListener('scroll', cancelUnexpectedScroll, { capture: true, passive: true });

    /* While media, fonts, and gallery shells are still settling, both the
       scroll position and the anchor's document position keep moving. On
       iPhone Safari, correcting during that churn — or during the browser's
       own in-flight anchor scroll — yanks the viewport every tick and reads
       as the page scrolling by itself. Only correct after both have held
       still for a full tick, so the loop observes the churn and pins the
       heading once, when the layout is actually ready to receive it. */
    var lastScrollY = null;
    var lastTargetTop = null;
    var stableTicks = 0;
    var correct = function () {
      if (cancelled || Date.now() > deadline || window.location.hash !== hash) {
        cleanup();
        return;
      }
      /* Apply the sticky visual state before measuring: its compact mobile
         typography can change the toolbar height after the native hash jump. */
      updateNavSurface();
      var offset = Math.ceil(nav.getBoundingClientRect().height) + 12;
      var scrollY = window.pageYOffset;
      var targetTop = target.getBoundingClientRect().top + scrollY;
      var settled = lastScrollY !== null && lastTargetTop !== null &&
        Math.abs(scrollY - lastScrollY) <= 1 &&
        Math.abs(targetTop - lastTargetTop) <= 1;
      lastScrollY = scrollY;
      lastTargetTop = targetTop;
      if (settled) {
        var delta = targetTop - scrollY - offset;
        if (Math.abs(delta) > 1) {
          stableTicks = 0;
          expectedScrollY = Math.max(0, scrollY + delta);
          scrollArmed = true;
          window.scrollTo(0, expectedScrollY);
          lastScrollY = window.pageYOffset;
        } else if (document.readyState === 'complete' &&
                   (!document.fonts || document.fonts.status === 'loaded')) {
          stableTicks += 1;
          if (stableTicks >= 2) {
            cleanup();
            return;
          }
        }
      } else {
        stableTicks = 0;
      }
      scrollArmed = true;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(correct, 160);
    };

    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(function () { window.requestAnimationFrame(correct); });
      observer.observe(document.getElementById('main') || document.body);
      observer.observe(nav);
    }
    window.requestAnimationFrame(function () { window.requestAnimationFrame(correct); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(correct);
  };

  window.addEventListener('hashchange', function () {
    manualSinceNav = false;
    startAnchorLanding(true);
  });
  window.addEventListener('pageshow', function () { startAnchorLanding(); });
  window.addEventListener('load', function () {
    if (window.location.hash) startAnchorLanding();
  });
  startAnchorLanding(true);

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#trip-section-"]'));
  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  }).filter(Boolean);
  if (!sections.length) return;

  var activeSectionId = '';
  var centreActiveLink = function (activeLink) {
    var strip = nav.querySelector('.travel-jump-groups');
    if (!strip) {
      activeLink.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
      return;
    }

    /* iPhone Safari may move the root page when scrollIntoView is called on a
       child of a sticky horizontal strip. Scroll only the strip so changing
       the active section can never add vertical momentum to the document. */
    var stripRect = strip.getBoundingClientRect();
    var linkRect = activeLink.getBoundingClientRect();
    var targetLeft = strip.scrollLeft + linkRect.left - stripRect.left -
      (stripRect.width - linkRect.width) / 2;
    strip.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  };

  var setActive = function (section) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + section.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (mobileNav.matches && activeSectionId !== section.id) {
      var activeLink = nav.querySelector('a[href="#' + section.id + '"]');
      if (activeLink) centreActiveLink(activeLink);
    }
    activeSectionId = section.id;
  };

  /* Position-based scrollspy: the current section is the last heading above
     the 30%-viewport line. Unlike observing the thin <h2> elements with an
     IntersectionObserver band, this also resolves after anchor jumps and on
     initial load. */
  var update = function () {
    updateNavSurface();
    var line = window.innerHeight * 0.3;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) current = sections[i];
      else break;
    }
    setActive(current);
  };

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}());

(function () {
  var routeGroups = document.querySelectorAll('.guangzhou-day__route--collapsible');
  if (!routeGroups.length) return;

  Array.prototype.forEach.call(routeGroups, function (group) {
    var button = group.querySelector('.guangzhou-route__more');
    var route = group.querySelector('.guangzhou-route');
    if (!button || !route) return;

    group.classList.add('is-truncated');
    button.setAttribute('aria-expanded', 'false');

    var updateDesktopWrap = function () {
      group.classList.remove('is-desktop-wrapped');
      if (window.matchMedia('(max-width: 600px)').matches) return;

      var stops = route.querySelectorAll('.guangzhou-route__stop');
      var firstTop = stops.length ? stops[0].offsetTop : 0;
      var wrapped = Array.prototype.some.call(stops, function (stop) {
        return stop.offsetTop > firstTop + 2;
      });
      group.classList.toggle('is-desktop-wrapped', wrapped);
    };

    requestAnimationFrame(updateDesktopWrap);
    button.addEventListener('click', function () {
      var expanded = group.classList.toggle('is-expanded');
      button.textContent = expanded ? 'Show less' : 'View full route';
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    window.addEventListener('resize', function () {
      group.classList.remove('is-expanded');
      button.textContent = 'View full route';
      button.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(updateDesktopWrap);
    });
  });
}());
