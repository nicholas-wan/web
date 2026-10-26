(() => {
  const sequences = {
    agents: [
      ['Supervisor', 'Supervisor picks the hunt.', 'A report becomes three techniques worth checking.', 2.5],
      ['Hypothesis', 'Hypothesis makes a testable claim.', 'It frames the behaviour the hunt can look for.', 8.7],
      ['Investigator', 'Investigator checks what was done.', 'PowerShell was covered recently, so the team does not repeat that hunt.', 13.4],
      ['Detection', 'Detection changes course.', 'When one search cannot answer, it re-plans and checks a better query.', 27.8],
      ['Analyst', 'The analyst gets a lead.', 'The agent hands over a flagged task and the evidence for review.', 35.5]
    ],
    detection: [
      ['Valid negative', 'A result can still be useful.', 'Only known Run keys appear. The agent records that answer.', 17.2],
      ['Inconclusive', 'The first search cannot settle it.', 'Scheduled tasks made through the API may not launch schtasks.exe.', 21.3],
      ['Re-plan', 'Change the question.', 'Detection looks for the task being created through event 4698.', 23.5],
      ['Validate', 'Check the query before it runs.', 'The revised event 4698 query is validated first.', 27.8],
      ['Flag', 'Flag a lead for review.', 'A root-level task differs from the baseline. Its evidence goes to an analyst.', 31.6]
    ]
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-agentic-frames]').forEach(section => {
    const steps = sequences[section.dataset.agenticFrames];
    const wrap = section.querySelector('.agentic-frames__console');
    const number = section.querySelector('[data-step-number]');
    const kicker = section.querySelector('[data-step-kicker]');
    const title = section.querySelector('[data-step-title]');
    const copy = section.querySelector('[data-step-copy]');
    const dots = section.querySelector('[data-dots]');
    const prev = section.querySelector('[data-prev]');
    const next = section.querySelector('[data-next]');
    const fill = section.querySelector('[data-progress-fill]');
    let animations = [], index = -1, timer = 0, queued = false;
    const setFrame = (i, first = false) => {
      if (i === index) return;
      index = i;
      clearTimeout(timer);
      if (!first && !reduced.matches) wrap.classList.add('is-switching');
      const show = () => {
        const [agent, heading, body, clock] = steps[i];
        animations.forEach(animation => { animation.currentTime = clock * 1000; });
        number.textContent = String(i + 1).padStart(2, '0');
        kicker.textContent = `${String(i + 1).padStart(2, '0')} / ${agent}`;
        title.textContent = heading;
        copy.textContent = body;
        [...dots.children].forEach((dot, j) => j === i ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
        prev.disabled = i === 0; next.disabled = i === steps.length - 1;
        requestAnimationFrame(() => wrap.classList.remove('is-switching'));
      };
      if (first || reduced.matches) show(); else timer = setTimeout(show, 180);
    };
    const jump = i => {
      const top = section.getBoundingClientRect().top + scrollY;
      const travel = section.offsetHeight - innerHeight;
      scrollTo({top: top + travel * ((i + .18) / steps.length), behavior: reduced.matches ? 'instant' : 'smooth'});
    };
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
      const travel = Math.max(1, rect.height - innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      setFrame(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
      fill.style.width = `${progress * 100}%`;
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    requestAnimationFrame(() => {
      animations = wrap.getAnimations({subtree: true}).filter(a => a instanceof CSSAnimation);
      animations.forEach(animation => animation.pause());
      setFrame(0, true); update();
      addEventListener('scroll', schedule, {passive: true});
      addEventListener('resize', schedule, {passive: true});
    });
  });
})();
