(() => {
  // Time is the authored console's animation clock. Repeated times are reading
  // holds; the intervals between them scrub the actual motion in both directions.
  const stories = {
    agents: {
      steps: [
        ['Supervisor', 'Supervisor picks the hunt.', 'A report becomes three techniques worth checking.', 2.5, .6],
        ['Hypothesis', 'Hypothesis makes a testable claim.', 'It frames the behaviour the hunt can look for.', 8.7, 1.75],
        ['Investigator', 'Investigator checks what was done.', 'PowerShell was covered recently, so the team does not repeat that hunt.', 13.4, 2.85],
        ['Detection', 'Detection changes course.', 'When one search cannot answer, it re-plans and checks a better query.', 27.8, 4.6],
        ['Analyst', 'The analyst gets a lead.', 'The agent hands over a flagged task and the evidence for review.', 35.5, 6]
      ],
      points: [[0, 0], [.35, 2.5], [.85, 2.5], [1.5, 8.7], [2, 8.7], [2.6, 13.4], [3.1, 13.4], [4.35, 27.8], [4.85, 27.8], [5.75, 35.5], [6.25, 35.5]],
      starts: [0, 1.25, 2.38, 3.9, 5.43]
    },
    detection: {
      steps: [
        ['Valid negative', 'A result can still be useful.', 'Only known Run keys appear. The agent records that answer.', 17.2, .6],
        ['Inconclusive', 'The first search cannot settle it.', 'Scheduled tasks made through the API may not launch schtasks.exe.', 21.3, 1.75],
        ['Re-plan', 'Change the question.', 'Detection looks for the task being created through event 4698.', 23.5, 2.75],
        ['Validate', 'Check the query before it runs.', 'The revised event 4698 query is validated first.', 27.8, 3.95],
        ['Flag', 'Flag a lead for review.', 'A root-level task differs from the baseline. Its evidence goes to an analyst.', 31.6, 5.15]
      ],
      points: [[0, 16], [.35, 17.2], [.85, 17.2], [1.5, 21.3], [2, 21.3], [2.5, 23.5], [3, 23.5], [3.7, 27.8], [4.2, 27.8], [4.9, 31.6], [5.4, 31.6]],
      starts: [0, 1.25, 2.32, 3.45, 4.65]
    }
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controllers = [];
  const gate = {locked: false, moving: false, lastInput: 0, arrived: 0, raf: 0, timer: 0};
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const unitAt = c => {
    const rect = c.section.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - innerHeight) * c.total, 0, c.total);
  };
  const active = () => controllers.find(c => {
    const rect = c.section.getBoundingClientRect();
    return rect.top <= 24 && rect.bottom >= innerHeight - 24;
  });
  const nextHold = (c, direction) => {
    const unit = unitAt(c);
    if (direction > 0) return c.steps.findIndex(step => step[4] > unit + .08);
    for (let i = c.steps.length - 1; i >= 0; i--) if (c.steps[i][4] < unit - .08) return i;
    return -1;
  };
  const releaseWhenReady = () => {
    clearTimeout(gate.timer);
    if (gate.moving) return;
    const now = performance.now();
    const wait = Math.max(gate.arrived + 650 - now, gate.lastInput + 450 - now);
    if (wait <= 0) { gate.locked = false; return; }
    gate.timer = setTimeout(releaseWhenReady, wait + 5);
  };
  const advance = (c, i) => {
    if (i < 0 || gate.locked) return;
    gate.locked = true;
    gate.moving = true;
    gate.lastInput = performance.now();
    const rect = c.section.getBoundingClientRect();
    const destination = rect.top + scrollY + (rect.height - innerHeight) * c.steps[i][4] / c.total;
    const from = scrollY;
    if (reduced.matches) {
      scrollTo(0, destination);
      gate.moving = false; gate.arrived = performance.now(); releaseWhenReady();
      return;
    }
    const duration = clamp(Math.abs(destination - from) * .8, 750, 1250);
    let started = null;
    const frame = now => {
      if (started === null) started = now;
      const p = Math.min(1, (now - started) / duration);
      scrollTo(0, from + (destination - from) * (1 - Math.cos(Math.PI * p)) / 2);
      if (p < 1) gate.raf = requestAnimationFrame(frame);
      else { gate.moving = false; gate.arrived = performance.now(); releaseWhenReady(); }
    };
    gate.raf = requestAnimationFrame(frame);
  };
  const clockAt = (points, unit) => {
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i];
      if (unit <= end) {
        const [start, from] = points[i - 1];
        const p = Math.max(0, Math.min(1, (unit - start) / (end - start)));
        const ease = p * p * (3 - 2 * p);
        return from + (to - from) * ease;
      }
    }
    return points[points.length - 1][1];
  };
  document.querySelectorAll('[data-agentic-frames]').forEach(section => {
    const {steps, points, starts} = stories[section.dataset.agenticFrames];
    const total = points[points.length - 1][0];
    const wrap = section.querySelector('.agentic-frames__console');
    const number = section.querySelector('[data-step-number]');
    const kicker = section.querySelector('[data-step-kicker]');
    const title = section.querySelector('[data-step-title]');
    const copy = section.querySelector('[data-step-copy]');
    const dots = section.querySelector('[data-dots]');
    const prev = section.querySelector('[data-prev]');
    const next = section.querySelector('[data-next]');
    const fill = section.querySelector('[data-progress-fill]');
    let animations = [], index = -1, queued = false;
    const setText = i => {
      if (i === index) return;
      index = i;
      const [agent, heading, body] = steps[i];
      number.textContent = String(i + 1).padStart(2, '0');
      kicker.textContent = `${String(i + 1).padStart(2, '0')} / ${agent}`;
      title.textContent = heading;
      copy.textContent = body;
      [...dots.children].forEach((dot, j) => j === i ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
      prev.disabled = i === 0; next.disabled = i === steps.length - 1;
    };
    const controller = {section, steps, total};
    controllers.push(controller);
    const jump = i => advance(controller, i);
    steps.forEach((step, i) => {
      const dot = document.createElement('button');
      dot.type = 'button'; dot.setAttribute('aria-label', `Go to ${step[0]}`);
      dot.addEventListener('click', () => jump(i)); dots.append(dot);
    });
    prev.addEventListener('click', () => jump(Math.max(0, index - 1)));
    next.addEventListener('click', () => jump(Math.min(steps.length - 1, index + 1)));
    const update = () => {
      queued = false;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -innerHeight || rect.top > innerHeight * 2) return;
      const travel = Math.max(1, rect.height - innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const unit = progress * total;
      const stage = Math.max(0, starts.findLastIndex(start => unit >= start));
      const time = reduced.matches ? steps[stage][3] : clockAt(points, unit);
      animations.forEach(animation => { animation.currentTime = time * 1000; });
      setText(stage);
      fill.style.width = `${progress * 100}%`;
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    requestAnimationFrame(() => {
      animations = wrap.getAnimations({subtree: true}).filter(a => a instanceof CSSAnimation);
      animations.forEach(animation => animation.pause());
      setText(0); update();
      addEventListener('scroll', schedule, {passive: true});
      addEventListener('resize', schedule, {passive: true});
    });
  });
  // One wheel, swipe or keyboard gesture reaches one authored hold. While the
  // console travels there, later momentum events cannot skip the reading beat.
  let wheelTotal = 0, wheelAt = 0;
  addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const c = active();
    if (!c) return;
    const distance = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const direction = Math.sign(distance);
    if (!direction) return;
    const target = nextHold(c, direction);
    if (target < 0 && !gate.locked) return;
    event.preventDefault();
    gate.lastInput = performance.now();
    if (gate.locked) { releaseWhenReady(); return; }
    if (performance.now() - wheelAt > 180 || Math.sign(wheelTotal) !== direction) wheelTotal = 0;
    wheelAt = performance.now();
    wheelTotal += distance;
    if (Math.abs(wheelTotal) >= 35) { wheelTotal = 0; advance(c, target); }
  }, {passive: false});
  let touch = null;
  addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || event.target.closest('button, a, input, textarea')) return;
    const c = active();
    touch = c ? {controller: c, y: event.touches[0].clientY, lastY: event.touches[0].clientY} : null;
  }, {passive: true});
  addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) return;
    touch.lastY = event.touches[0].clientY;
    const direction = Math.sign(touch.y - touch.lastY);
    if (gate.locked || (direction && nextHold(touch.controller, direction) >= 0)) {
      event.preventDefault();
      gate.lastInput = performance.now();
    }
  }, {passive: false});
  addEventListener('touchend', () => {
    if (!touch) return;
    const gesture = touch; touch = null;
    const delta = gesture.y - gesture.lastY;
    if (Math.abs(delta) < 35 || gate.locked) return;
    const target = nextHold(gesture.controller, Math.sign(delta));
    if (target >= 0) advance(gesture.controller, target);
  }, {passive: true});
  addEventListener('keydown', event => {
    if (event.target.closest('button, a, input, textarea, select, [contenteditable]')) return;
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1 :
      ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0;
    if (!direction) return;
    const c = active();
    if (!c) return;
    const target = nextHold(c, direction);
    if (target < 0 && !gate.locked) return;
    event.preventDefault();
    gate.lastInput = performance.now();
    if (gate.locked) { releaseWhenReady(); return; }
    advance(c, target);
  });
})();
