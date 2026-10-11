// Read-only DOM audit, shared by CI and interactive browser verification.
module.exports = function auditTravelGeometry() {
  const errors = [];
  const map = document.querySelector('.travel-map');
  const viewport = document.querySelector('.travel-map__viewport').getBoundingClientRect();
  const visible = el => {
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (node.hidden || style.display === 'none' || style.visibility === 'hidden' || +style.opacity < 0.1) return false;
    }
    return el.getBoundingClientRect().width > 0;
  };
  const intersects = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  const controls = [...map.querySelectorAll('.travel-map__trip-picker, .travel-map__controls, .travel-map__close, .travel-map__regions, .travel-map__status, .travel-map__hint, .travel-map__detail-card')].filter(visible);
  const labels = [...map.querySelectorAll('.travel-map__detail-label')].filter(visible);
  labels.forEach((label, i) => {
    const box = label.getBoundingClientRect();
    if (box.left < viewport.left - 1 || box.right > viewport.right + 1 || box.top < viewport.top - 1 || box.bottom > viewport.bottom + 1) errors.push('clipped: ' + label.textContent);
    if (label.scrollWidth > label.clientWidth + 1) errors.push('text overflow: ' + label.textContent);
    labels.slice(i + 1).forEach(other => {
      if (intersects(box, other.getBoundingClientRect())) errors.push('overlap: ' + label.textContent + ' / ' + other.textContent);
    });
    controls.forEach(control => {
      if (intersects(box, control.getBoundingClientRect())) errors.push('control overlap: ' + label.textContent + ' / ' + control.className);
    });
  });
  const list = map.querySelector('.travel-map__label-list');
  if (visible(list)) {
    const box = list.getBoundingClientRect();
    controls.forEach(control => {
      if (intersects(box, control.getBoundingClientRect())) errors.push('list/control overlap: ' + control.className);
    });
    const canvas = map.querySelector('.travel-map__canvas');
    const level = canvas.dataset.mapDetail;
    const trip = document.querySelector('#travel-map-trip').value;
    const expected = [...map.querySelectorAll('.travel-map__detail')].filter(el => el.dataset.mapLevel === level && (!trip || el.dataset.mapTrip === trip) && !el.classList.contains('is-label-offscreen')).length;
    if (list.children.length !== expected) errors.push('missing list destinations');
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('page overflow');
  return { errors, labels: labels.length, listed: list.hidden ? 0 : list.children.length };
};
