(function () {
  var nav = document.querySelector('.travel-section-nav');
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#trip-section-"]'));
  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  }).filter(Boolean);
  if (!sections.length) return;

  var setActive = function (section) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + section.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  /* Position-based scrollspy: the current section is the last heading above
     the 30%-viewport line. Unlike observing the thin <h2> elements with an
     IntersectionObserver band, this also resolves after anchor jumps and on
     initial load. */
  var update = function () {
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

  var supportsDialog = typeof window.HTMLDialogElement === 'function';

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
      if (window.matchMedia('(min-width: 601px)').matches) {
        var desktopExpanded = group.classList.toggle('is-expanded');
        button.textContent = desktopExpanded ? 'Show less' : 'View full route';
        button.setAttribute('aria-expanded', desktopExpanded ? 'true' : 'false');
        return;
      }

      if (!supportsDialog) {
        var expanded = group.classList.toggle('is-expanded');
        button.textContent = expanded ? 'Show less' : 'View full route';
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        return;
      }

      var dayHeading = group.closest('.guangzhou-day').querySelector('h2');
      var dialog = document.createElement('dialog');
      var dialogHeading = document.createElement('strong');
      var closeButton = document.createElement('button');
      var routeCopy = route.cloneNode(true);

      dialog.className = 'guangzhou-route-dialog';
      dialogHeading.textContent = dayHeading ? dayHeading.textContent + ' route' : 'Full route';
      closeButton.type = 'button';
      closeButton.className = 'guangzhou-route-dialog__close';
      closeButton.textContent = 'Close';
      dialog.appendChild(dialogHeading);
      dialog.appendChild(routeCopy);
      dialog.appendChild(closeButton);
      document.body.appendChild(dialog);

      closeButton.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', function () { dialog.remove(); });
      dialog.showModal();
    });

    window.addEventListener('resize', function () {
      group.classList.remove('is-expanded');
      button.textContent = 'View full route';
      button.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(updateDesktopWrap);
    });
  });
}());
