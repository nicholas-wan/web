(function () {
  'use strict';

  var bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.innerHTML = '<span class="read-progress__fill"></span>';
  document.body.appendChild(bar);
  var fill = bar.firstChild;
  var scheduled = false;

  function update() {
    scheduled = false;
    var maximum = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maximum > 0 ? Math.min(window.scrollY / maximum, 1) : 1;
    fill.style.width = (progress * 100) + '%';
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  update();
})();
