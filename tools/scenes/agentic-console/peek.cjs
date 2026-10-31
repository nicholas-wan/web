// The Agentic AI card's "Hunt from a report" peek (README "Agentic AI console peek"; shipped 31 Oct 2026 after
// three rounds of independent reviews). It wraps the agent console (scene.html) in:
//  - a status strip: Running / Paused / Done, the beat (1/3..3/3), a 3-segment bar whose current segment fills,
//    "Local LLM · on-premises", and one Pause-Resume-Replay button (internship-peek.js drives the states);
//  - two columns: the story panel first (each beat's headline, one "why" line, then its picture building one
//    part at a time), then the live console, in its own c2p container so it lays out for the width it gets.
// Three beats, not eight (pacing review: ~11 words/s across five competing regions became one place to look):
//   1 plan the hunt (report, techniques, the hypothesis, a covered technique set aside)   console entries 0-2
//   2 catch a blind spot (valid negative, 0 results that can't see API-made tasks, re-plan, checked query) 3-6
//   3 hand off to an analyst (the rare task, its evidence, the next step)               entry 7 and the Analyst
// Every time is read from the console's own markup and CSS, for desktop and phones; apply.cjs writes the result.
const BEATS = ['Plan the hunt', 'Catch a blind spot', 'Hand off to an analyst'];
const FIRST = [0, 3, 7];                               // the console entry each beat starts with
const TALLY = '1 lead for analyst review · 1 valid negative · 1 set aside';
const r2 = v => +v.toFixed(2);

// ---------------------------------------------------------------- the story panel, one scene per beat
// Parts arrive at the beat's start (--s, generated) plus their own offset (--t), timed to land with the matching
// console entry; resting styles are each scene's finished state, so pause, reduced motion and the end need nothing.
// (one class attribute per element: a second one is ignored, and with it the part's animation)
const a = (t, cls = '') => `class="hsk-a${cls ? ' ' + cls : ''}" style="--t:${t}s"`;
const tick = '<svg class="hsk-tk" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.3l2 2 4-4.3"/></svg>';
const flag = '<svg class="hsk-tk" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 10.6V1.9h6L7.6 4.1 9 6.3H3"/></svg>';
const top = (h, why) => `<p class="hsk-h">${h}</p><p class="hsk-why">${why}</p>`;
const SCENES = [
  // 1 plan the hunt (~7 s), in the console's order: phrases become techniques, the Hypothesis agent writes at
  // ~2 s, the Investigator checks past hunts at ~4.3 s
  top('From a report to a hypothesis it can test', 'Past hunts are checked first; recently covered techniques are set aside.')
  + `<p ${a(0.2, 'hsk-doc')}>…<mark ${a(0.6, 'mk')}>create a scheduled task</mark> … <mark ${a(1.0, 'mk')}>run PowerShell</mark> … <mark ${a(1.4, 'mk')}>add a Run key</mark>…</p>`
  + `<p class="hsk-ids"><code ${a(1.2)}>Scheduled Task</code><code ${a(1.6, 'is-out')}>PowerShell<b class="hsk-a" style="--t:4.6s">hunted recently</b></code><code ${a(2)}>Run Keys</code></p>`
  + `<dl class="hsk-kv hsk-a" style="--t:2.4s"><div><dt>Hypothesis</dt><dd>A new task runs at logon, outside the baseline</dd></div></dl>`,
  // 2 catch a blind spot (~10 s): one clean negative, one search that couldn't have seen it, the re-plan, the check
  //   (the checked query lands with the console's result at ~7.8 s and holds two seconds before beat 3)
  top('Zero results is a blind spot, not a negative', 'The verdict sets the next step: revise, record or raise a lead.')
  + `<ul class="hsk-rows"><li ${a(0.5)}><span>Run keys vs baseline</span><b class="is-ok hsk-a" style="--t:1.2s">${tick}Valid negative</b></li>`
  + `<li ${a(2.1)}><span>process = schtasks.exe</span><b class="is-warn hsk-a" style="--t:2.7s">0 results</b></li></ul>`
  + `<p class="hsk-note hsk-a" style="--t:3.6s">Tasks made through the Task Scheduler API never launch schtasks.exe.</p>`
  + `<p class="hsk-src"><span class="hsk-a" style="--t:5.2s">Re-plan: event 4698 · a task was created</span><b class="hsk-a" style="--t:7.5s">${tick}Query checked against this telemetry</b></p>`,
  // 3 hand off (~6 s and the end): the rare task stands out, with its evidence and the next step
  top('Hands it to an analyst, with the evidence', 'Agents raise leads, not verdicts; an analyst decides what it is.')
  + `<ul class="hsk-bars"><li><span>\\Microsoft\\…\\ProactiveScan</span><i ${a(0.4, 'gr')}></i><b>in baseline</b></li>`
  + `<li><span>\\Microsoft\\…\\ScheduledDefrag</span><i ${a(0.6, 'gr')}></i><b>in baseline</b></li>`
  + `<li class="is-lead"><span>\\WinTaskUpdate</span><i ${a(0.8, 'gr')}></i><b>1 host</b></li></ul>`
  + `<p ${a(1.6, 'hsk-res is-lead')}>${flag}Not in the baseline · lead for analyst review</p>`
  + `<p ${a(2.6, 'hsk-next')}>Next: check who created the task and what it runs</p>`,
];

// ---------------------------------------------------------------- the chip, card and strip (the chip and card as
// approved 26 Oct 2026, before the scroll story replaced them)
const MINI = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 24"><rect x="1.5" y="2.5" width="17" height="19" rx="2" fill="#0e2024" stroke="#3a6f73"/><path d="M4.5 7H15.5M4.5 10.5H12" stroke="#3a6f73" stroke-width="1.4" stroke-linecap="round"/><rect x="4" y="13" width="11" height="3" rx="1" fill="#28d7c5" opacity=".45"/><path d="M4.5 18.5H13" stroke="#3a6f73" stroke-width="1.4" stroke-linecap="round"/><path d="M21.5 12H26.5M24.5 10L26.5 12L24.5 14" fill="none" stroke="#6f9a96" stroke-linecap="round" stroke-linejoin="round"/><rect x="29.5" y="4.5" width="23" height="15" rx="2" fill="#071315" stroke="#24464b"/><path d="M32.5 9H44M32.5 12.5H49M32.5 16H40" stroke="#b8f2eb" stroke-width="1.3" stroke-linecap="round" opacity=".8"/><path d="M32.5 9H36.5M35.5 12.5H39" stroke="#28d7c5" stroke-width="1.3" stroke-linecap="round"/><path d="M55.5 12H60.5M58.5 10L60.5 12L58.5 14" fill="none" stroke="#6f9a96" stroke-linecap="round" stroke-linejoin="round"/><rect x="63" y="6" width="13" height="12" rx="2" fill="#ffb869"/><path d="M67 9V15M67 9.4H72L70.6 11L72 12.6H67" fill="none" stroke="#071315" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const span = (cls, txt) => `<span class="hsk-v ${cls}">${txt}</span>`;
function strip() {
  const words = span('hsk-wr', 'Running') + span('hsk-wd', 'Done') + span('hsk-wp', 'Paused');
  const steps = BEATS.map((b, i) => span(`hsk-s${i}`, `${i + 1}/3 · ${b}`)).join('') + span('hsk-sd', TALLY);
  const segs = BEATS.map((_, i) => `<i class="hsk-seg hsk-g${i}"><b></b></i>`).join('');
  return `<div class="hsk-bar"><p class="hsk-status"><i class="hsk-dot" aria-hidden="true"></i><span class="hsk-words">${words}</span><span class="hsk-steps">${steps}</span></p><span class="hsk-env">Local LLM · on-premises</span><button type="button" class="hsk-ctl" aria-label="Pause the hunt">Pause</button><span class="hsk-prog" aria-hidden="true">${segs}</span></div>`;
}

// the whole peek: hint, chip and card around the console (scene.html, one line)
exports.html = scene => {
  // a quiet ring on each agent while it works
  for (const ag of ['sup', 'hyp', 'inv', 'det']) {
    const re = new RegExp(`(<div class="c2-node c2-n--${ag}"[^>]*>)`);
    if (!re.test(scene)) throw new Error('console node not found: ' + ag);
    scene = scene.replace(re, '$1<i class="hsk-work" aria-hidden="true"></i>');
  }
  const story = `<div class="hsk-tool" aria-hidden="true"><div class="hsk-tss">${SCENES.map((s, i) => `<div class="hsk-ts hsk-ts${i}">${s}</div>`).join('')}</div></div>`;
  const panel = `<div class="hunt-panel">${strip()}<div class="hsk-stage">${story}<div class="hsk-live">${scene}</div></div></div>`;
  return '<p class="internship-demo-hint"><strong><span class="anomaly-peek__hint-hover">Click the chart</span><span class="anomaly-peek__hint-touch">Tap the chart</span></strong> to see it in action</p>'
    + `<div class="internship-demo-peek" data-company="agentic" data-script="assets/js/agentic-peek.js"><button type="button" class="internship-demo-peek__chip" aria-expanded="false" aria-controls="agentic-demo-card"><span class="internship-demo-peek__mini" aria-hidden="true">${MINI}</span>Hunt from a report</button>`
    + `<div class="internship-demo-card" id="agentic-demo-card" inert=""><div class="internship-demo-card__plot">${panel}</div></div></div>`;
};

// ---------------------------------------------------------------- timing, read from the console
function times(scene, sceneCss) {
  // feed entries: when each card starts arriving (L - O), its result (D) or the end of its wipe, and its agent
  const E = [];
  for (const m of scene.matchAll(/class="c2-s c2-s(\d)[^"]*" style="([^"]*)"/g)) {
    const v = k => { const x = m[2].match(new RegExp(`--${k}:([\\d.]+)s`)); return x ? +x[1] : null; };
    E[+m[1]] = { ag: m[2].match(/--a:var\(--c2-(\w+)\)/)[1], O: v('O'), wd: v('wd') || 0.8, d: { L: v('Ld'), D: v('Dd') }, p: { L: v('Lp'), D: v('Dp') } };
  }
  if (E.length !== 8 || E.includes(undefined)) throw new Error('console feed timing not found');
  // the console's last caption (the Analyst arriving) closes the run
  const phoneAt = sceneCss.indexOf('@container c2p (max-width: 480px)', sceneCss.indexOf('.is-playing .hunt-panel .c2-line0'));
  const fin = { d: +sceneCss.slice(0, phoneAt).match(/\.c2-line7\{animation:c2-k\d+ [\d.]+s linear ([\d.]+)s/)[1],
                p: +sceneCss.slice(phoneAt).match(/\.c2-line7\{animation-delay:([\d.]+)s/)[1] };
  const out = {};
  for (const k of ['d', 'p']) {
    const B = FIRST.map((i, n) => (n === 0 ? 0.05 : r2(E[i][k].L - E[i].O - 0.3)));
    const work = {};
    E.forEach(e => { const s = r2(Math.max(0, e[k].L - e.O - 0.7)), f = r2((e[k].D ?? e[k].L + e.wd) + 0.15); (work[e.ag] ||= []).push([s, f]); });
    out[k] = { B, END: r2(fin[k] + 1.8), work };
  }
  return out;
}
exports.css = (scene, sceneCss) => {
  const T = times(scene, sceneCss), X = '.is-playing .hunt-panel';
  // a shown-window keyframe with fixed 0.25 s fades, whatever the window's length
  const KF = new Map();
  const show = (s, f) => {
    const d = r2(f - s), n = 'hsk-w' + Math.round(d * 100), e = r2(Math.min(25, 25 / d));
    if (!KF.has(n)) KF.set(n, `@keyframes ${n}{0%{--c2-v:0}${e}%,${r2(100 - e)}%{--c2-v:1}100%{--c2-v:0}}`);
    return `${n} ${d}s linear ${s}s none`;
  };
  const timeline = ({ B, END, work }) => {
    const L = [];
    B.forEach((s, i) => {
      const f = i < B.length - 1 ? B[i + 1] : END;
      L.push(`${X} .hsk-ts${i}{--s:${s}s;animation:${i < B.length - 1 ? show(s, f) : `hsk-in .3s linear ${s}s backwards`}}`);
      L.push(`${X} .hsk-s${i}{animation:${show(s, f)}}`);
      L.push(`${X} .hsk-g${i} b{animation:hsk-fill ${r2(f - s)}s linear ${s}s both}`);
    });
    L.push(`${X} .hsk-wr{animation:${show(B[0], END)}}`);
    L.push(`${X} .hsk-wd,${X} .hsk-sd{animation:hsk-in .35s linear ${END}s backwards}`);
    for (const [ag, ws] of Object.entries(work)) L.push(`${X} .c2-n--${ag} .hsk-work{animation:${ws.map(([s, f]) => show(s, f)).join(',')}}`);
    return L.join('\n');
  };
  const desk = timeline(T.d), phone = timeline(T.p);
  return `/* ---- peek timing (generated by peek.cjs; run ends at ${T.d.END}s, phones ${T.p.END}s) ---- */\n${[...KF.values()].join('\n')}\n${desk}\n@container c2p (max-width: 480px) {\n${phone}\n}`;
};
