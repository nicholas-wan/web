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
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var sectionStart = function (heading) {
    var previous = heading && heading.previousElementSibling;
    return previous && previous.matches('.guangzhou-day__date, .travel-journal__date') ? previous : heading;
  };
  /* Publish the real single-row toolbar height for native anchor jumps;
     the bounded correction also clears the date above each heading. */
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
    /* #photo=<id> lands its tile the same way; gallery.js (loaded first)
       resolves and opens it. */
    var gallery = window.travelGallery;
    var photo = /^#photo=(.+)$/.exec(hash);
    var media = photo && gallery ? gallery.find(photo[1]) : null;
    var target = media ? media.closest('.brick') || media :
      /^#trip-section-\d+$/.test(hash) && document.getElementById(hash.slice(1));
    if (!media) target = sectionStart(target);
    if (!target) return;
    /* Viewer up (back/forward): re-land after close()'s scroll restore,
       which would otherwise read as visitor input. */
    if (media && gallery.close()) {
      window.requestAnimationFrame(function () { startAnchorLanding(true); });
      return;
    }

    var cancelled = false;
    var observer = null;
    var timer = null;
    var deadline = Date.now() + 5000;
    var scrollArmed = false;
    var expectedScrollY = null;
    var manualEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    var cancel = function () { cancelled = true; cleanup(); };
    var cancelUnexpectedScroll = function (event) {
      // Horizontal gallery/section-strip scrolling is not a visitor moving the
      // document. Capturing those events used to cancel photo deep links.
      if (event.target !== document && event.target !== window) return;
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
      /* Tearing down must also disarm. correct() is reachable from two async
         entry points that were queued before teardown — the double rAF below and
         document.fonts.ready — and its only guard is this flag. A landing torn
         down by a later startAnchorLanding() (fonts still pending at load, or
         pageshow landing within two frames of load) used to resurrect itself
         here: it re-armed its own 160ms timer with every cancel listener already
         removed, so nothing the visitor did could stop it, and it scrolled them
         back to the anchor minutes into reading. That is the self-scrolling
         report the landing correction exists to prevent. */
      cancelled = true;
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
    /* Only a landing that no visitor input ended opens the photo. */
    var finish = function () {
      cleanup();
      if (!media) return;
      /* Centre it in a sideways phone row; flash it once the viewer, whose
         backdrop hides it, closes. */
      var row = target.parentNode;
      row.scrollLeft += target.getBoundingClientRect().left - row.getBoundingClientRect().left -
        (row.clientWidth - target.offsetWidth) / 2;
      gallery.open(media, function () {
        target.classList.add('is-deep-linked');
        window.setTimeout(function () { target.classList.remove('is-deep-linked'); }, 1500);
      });
    };
    var correct = function () {
      if (cancelled || window.location.hash !== hash) {
        cleanup();
        return;
      }
      if (Date.now() > deadline) {
        /* Before load, the load restart opens it instead. */
        (document.readyState === 'complete' ? finish : cleanup)();
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
        /* A heading near the end of the document cannot reach the top of the
           viewport — scrollTo clamps at the end of the scroll range. Measured
           unclamped overshoot on the last section: Guangzhou +292px, Germany
           +164px, Silicon Valley +92px. delta never fell to 0, so stableTicks
           never reached 2 and the loop held the viewport for the full deadline;
           worse, the clamped scroll landed away from expectedScrollY, so the
           correction read its own movement back as visitor input and cancelled
           itself. Recompute the ceiling every tick — the document is still
           growing in exactly this window. */
        var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        var wanted = Math.max(0, Math.min(targetTop - offset, maxScroll));
        var delta = wanted - scrollY;
        if (Math.abs(delta) > 1) {
          stableTicks = 0;
          expectedScrollY = wanted;
          scrollArmed = true;
          window.scrollTo(0, expectedScrollY);
          lastScrollY = window.pageYOffset;
        } else if (document.readyState === 'complete' &&
                   (!document.fonts || document.fonts.status === 'loaded')) {
          stableTicks += 1;
          if (stableTicks >= 2) {
            finish();
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

  /* Explicit desktop controls make the horizontally scrollable row discoverable. */
  var edgeStrip = nav.querySelector('.travel-jump-groups');
  if (edgeStrip) {
    var back = document.createElement('button');
    var forward = document.createElement('button');
    back.className = forward.className = 'travel-strip-arrow';
    back.type = forward.type = 'button';
    back.textContent = '\u2190';
    forward.textContent = '\u2192';
    back.setAttribute('aria-label', 'Earlier trip sections');
    forward.setAttribute('aria-label', 'Later trip sections');
    nav.insertBefore(back, edgeStrip);
    nav.appendChild(forward);
    [back, forward].forEach(function (button, index) {
      button.addEventListener('click', function () {
        edgeStrip.scrollBy({ left: (index ? 1 : -1) * edgeStrip.clientWidth * 0.75,
          behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      });
    });
    var markStripEdges = function () {
      var hidden = edgeStrip.scrollWidth - edgeStrip.clientWidth;
      var moreStart = edgeStrip.scrollLeft > 2;
      var moreEnd = edgeStrip.scrollLeft < hidden - 2;
      if (!moreStart && document.activeElement === back && moreEnd) forward.focus({ preventScroll: true });
      if (!moreEnd && document.activeElement === forward && moreStart) back.focus({ preventScroll: true });
      back.disabled = !moreStart;
      forward.disabled = !moreEnd;
    };
    edgeStrip.addEventListener('scroll', markStripEdges, { passive: true });
    window.addEventListener('resize', markStripEdges);
    window.addEventListener('load', markStripEdges);
    /* fonts.ready resolves before the tabs are re-laid out in Merriweather,
       so a measurement taken in its callback still sees the narrower fallback
       font and can leave the flag off while the swapped-in row overflows.
       Observe the strip and its groups instead: ResizeObserver fires after
       layout, so any later growth (font swap, late CSS) re-measures. */
    if (document.fonts) document.fonts.ready.then(function () { window.requestAnimationFrame(markStripEdges); });
    if (typeof ResizeObserver === 'function') {
      var stripObserver = new ResizeObserver(markStripEdges);
      stripObserver.observe(edgeStrip);
      Array.prototype.forEach.call(edgeStrip.children, function (group) { stripObserver.observe(group); });
    }
    markStripEdges();
  }

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#trip-section-"]'));
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      requestAnimationFrame(function () { manualSinceNav = false; startAnchorLanding(true); });
    });
  });
  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  }).filter(Boolean);
  if (!sections.length) return;

  var activeSectionId = '';
  var centreActiveLink = function (activeLink) {
    /* No strip means no horizontal overflow to centre within, so there is
       nothing to do. The previous scrollIntoView fallback here was the exact
       call the scrolling contract forbids: on a child of the sticky strip
       iPhone Safari transfers it to the root page. It survived only because
       every generated journal happens to render the strip. */
    var strip = nav.querySelector('.travel-jump-groups');
    if (!strip) return;

    /* iPhone Safari may move the root page when scrollIntoView is called on a
       child of a sticky horizontal strip. Scroll only the strip so changing
       the active section can never add vertical momentum to the document. */
    var stripRect = strip.getBoundingClientRect();
    var linkRect = activeLink.getBoundingClientRect();
    var targetLeft = strip.scrollLeft + linkRect.left - stripRect.left -
      (stripRect.width - linkRect.width) / 2;
    strip.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
  };

  var setActive = function (section) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + section.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (activeSectionId !== section.id) {
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
      if (sectionStart(sections[i]).getBoundingClientRect().top <= line) current = sections[i];
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
  var routeGroups = document.querySelectorAll('.guangzhou-day__route');
  if (!routeGroups.length) return;
  var phoneNav = window.matchMedia('(max-width: 600px)');

  Array.prototype.forEach.call(routeGroups, function (group, index) {
    var button = group.querySelector('.guangzhou-route__more');
    var route = group.querySelector('.guangzhou-route');
    if (!route) return;
    var stops = route.querySelectorAll('.guangzhou-route__stop');
    if (!stops.length) return;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'guangzhou-route__more';
      group.appendChild(button);
    }
    group.classList.add('guangzhou-day__route--collapsible');
    var summary = document.createElement('p');
    summary.className = 'travel-route-summary';
    var place = function (stop) { return stop.querySelector('span').textContent.trim(); };
    summary.textContent = place(stops[0]) + (stops.length > 1 ? ' \u2192 ' + place(stops[stops.length - 1]) : '');
    group.insertBefore(summary, route);
    route.id = 'journal-route-' + index;
    button.removeAttribute('aria-haspopup');
    button.setAttribute('aria-controls', route.id);
    var collapsedLabel = 'View all ' + stops.length + (stops.length === 1 ? ' stop' : ' stops');
    var syncRoute = function () {
      var expanded = group.classList.contains('is-expanded');
      button.textContent = expanded ? 'Hide route' : collapsedLabel;
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      route.hidden = phoneNav.matches && !expanded;
    };

    group.classList.add('is-truncated');
    syncRoute();

    var updateDesktopWrap = function () {
      group.classList.remove('is-desktop-wrapped');
      if (phoneNav.matches) return;

      var firstTop = stops.length ? stops[0].offsetTop : 0;
      var wrapped = Array.prototype.some.call(stops, function (stop) {
        return stop.offsetTop > firstTop + 2;
      });
      group.classList.toggle('is-desktop-wrapped', wrapped);
    };

    requestAnimationFrame(updateDesktopWrap);
    button.addEventListener('click', function () {
      group.classList.toggle('is-expanded');
      syncRoute();
    });

    // Phone URL-bar show/hide fires resize with only the height changed;
    // collapsing then would snap an open route shut mid-read.
    var lastWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      group.classList.remove('is-expanded');
      syncRoute();
      requestAnimationFrame(updateDesktopWrap);
    });
  });
}());
