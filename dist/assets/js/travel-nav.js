(function () {
  var nav = document.querySelector('.travel-section-nav');
  if (!nav || !window.IntersectionObserver) return;

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

  var observer = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (entry) { return entry.isIntersecting; });
    if (visible.length) setActive(visible[0].target);
  }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

  sections.forEach(function (section) { observer.observe(section); });
}());
