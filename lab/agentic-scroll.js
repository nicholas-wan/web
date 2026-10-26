(() => {
  const story = document.querySelector('.story');
  const wrap = document.querySelector('#console-wrap');
  if (!story || !wrap) return;
  const steps = [
    ['Intake', 'Start with a report.', 'The supervisor extracts three techniques worth checking, then delegates the work.', 0],
    ['Hypothesis', 'Turn it into a testable claim.', 'A hypothesis gives the hunt a specific behaviour to look for.', 6.4],
    ['Prior work', 'Avoid repeating a hunt.', 'PowerShell was covered recently, so the team spends its attention elsewhere.', 11.4],
    ['Negative result', 'A clean result is still an answer.', 'The Run keys search finds only known activity and records that result.', 15.9],
    ['Re-plan', 'Know when the search is inconclusive.', 'The first scheduled-task search misses a creation path. The agent changes course.', 20.3],
    ['Validate', 'Check before running.', 'A new event 4698 query is checked before it is used.', 25.6],
    ['Lead', 'Find what differs from baseline.', 'One root-level task is flagged with its supporting evidence.', 30.1],
    ['Hand-off', 'Bring the analyst in.', 'The agent hands over a lead and the evidence for human review.', 33.5]
  ];
  const end = 35.7;
  const els = {
    number: document.querySelector('#step-number'), kicker: document.querySelector('#step-kicker'),
    title: document.querySelector('#step-title'), copy: document.querySelector('#step-copy'),
    fill: document.querySelector('#progress-fill'), dots: document.querySelector('#chapter-dots'),
    prev: document.querySelector('.chapter-nav__prev'), next: document.querySelector('.chapter-nav__next')
  };
  let animations = [], current = -1, queued = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  steps.forEach((step, i) => {
    const dot = document.createElement('button');
    dot.type = 'button'; dot.setAttribute('aria-label', `Go to step ${i + 1}: ${step[0]}`);
    dot.addEventListener('click', () => jump(i)); els.dots.append(dot);
  });
  function jump(i) {
    const start = story.getBoundingClientRect().top + scrollY;
    const span = story.offsetHeight - innerHeight;
    const time = Math.min(end, steps[i][3] + (i ? 0.5 : 0));
    scrollTo({top: start + span * time / end, behavior: reduced.matches ? 'instant' : 'smooth'});
  }
  els.prev.addEventListener('click', () => jump(Math.max(0, current - 1)));
  els.next.addEventListener('click', () => jump(Math.min(steps.length - 1, current + 1)));
  function update() {
    queued = false;
    const rect = story.getBoundingClientRect();
    const span = Math.max(1, rect.height - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / span));
    const time = progress * end;
    // All scene tracks share one authored clock. WAAPI lets scroll drive that
    // clock in both directions without reproducing the scene's CSS keyframes.
    const index = Math.max(0, steps.findLastIndex(s => time >= s[3]));
    const sceneTime = reduced.matches ? Math.min(end, steps[index][3] + 0.7) : time;
    for (const animation of animations) animation.currentTime = sceneTime * 1000;
    if (index !== current) {
      current = index;
      const [label, title, copy] = steps[index];
      els.number.textContent = String(index + 1).padStart(2, '0');
      els.kicker.textContent = `${String(index + 1).padStart(2, '0')} / ${label}`;
      els.title.textContent = title; els.copy.textContent = copy;
      [...els.dots.children].forEach((dot, j) => j === index ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
      els.prev.disabled = index === 0; els.next.disabled = index === steps.length - 1;
    }
    els.fill.style.width = `${progress * 100}%`;
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  requestAnimationFrame(() => {
    animations = wrap.getAnimations({subtree: true}).filter(a => a instanceof CSSAnimation);
    animations.forEach(a => a.pause());
    update();
    addEventListener('scroll', schedule, {passive: true});
    addEventListener('resize', schedule, {passive: true});
  });
})();
