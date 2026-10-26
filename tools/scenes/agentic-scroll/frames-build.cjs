// Builds the chaptered Work-page mockup from the current case study and scene.
// Run: node tools/scenes/agentic-scroll/frames-build.cjs
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
require('./site-build.cjs');
const scene = fs.readFileSync(path.join(root, 'tools/scenes/agentic-console/scene.html'), 'utf8').trim();
let page = fs.readFileSync(path.join(root, 'lab/agentic-scroll-site.html'), 'utf8');
const chapter = (id, theme, eyebrow, title, intro, label, first, firstCopy, art = scene) => `
<section class="agentic-story agentic-frames agentic-frames--${theme}" id="${id}" data-agentic-frames="${theme}" aria-label="${title}">
  <div class="agentic-story__sticky">
    <div class="agentic-story__inner">
      <div class="agentic-story__heading">
        <p class="agentic-story__eyebrow">${eyebrow}</p>
        <span class="agentic-story__count" aria-hidden="true"><strong data-step-number>01</strong> / 05</span>
      </div>
      <div class="agentic-story__narrative" aria-live="polite">
        <div><p class="agentic-story__kicker" data-step-kicker>01 / ${label}</p><h2 data-step-title>${first}</h2><p data-step-copy>${firstCopy}</p></div>
        <div class="agentic-story__nav" aria-label="${title} chapters"><button type="button" data-prev aria-label="Previous chapter" disabled>&larr;</button><div data-dots></div><button type="button" data-next aria-label="Next chapter">&rarr;</button></div>
      </div>
      <div class="agentic-frames__console console-wrap is-playing"><div class="hunt-panel">${art}</div></div>
      <div class="agentic-story__foot"><div class="agentic-story__progress" aria-hidden="true"><span data-progress-fill></span></div><p>${intro}</p></div>
    </div>
  </div>
</section>`;
const first = chapter('agentic-hunt', 'agents', 'Agentic threat hunting / The team', 'The agents in the hunt', 'Scroll again to advance to the next agent', 'Supervisor', 'Supervisor picks the hunt.', 'A report becomes three techniques worth checking.');
const interlude = `
<section class="agentic-frames__interlude" aria-labelledby="agentic-deeper-title">
  <p class="agentic-story__kicker">A closer look / Detection</p>
  <h2 id="agentic-deeper-title">The hard part is knowing when to change course.</h2>
  <p>The first scheduled-task search cannot settle the question. A second short sequence follows the Detection agent from that uncertainty to an evidence-backed lead.</p>
  <a href="#agentic-detection">Follow the re-plan <span aria-hidden="true">&darr;</span></a>
</section>`;
const second = chapter('agentic-detection', 'detection', 'Agentic threat hunting / A closer look', 'How Detection re-plans', 'Scroll again to advance the investigation', 'Valid negative', 'A result can still be useful.', 'Only known Run keys appear. The agent records that answer.', scene.replace(/c2g-/g, 'c2g-detail-'));
const start = page.indexOf('<section class="agentic-story story" id="agentic-hunt"');
const end = page.indexOf('</section>', start) + '</section>'.length;
if (start < 0 || end < '</section>'.length) throw new Error('Could not find the first mockup story');
page = page.slice(0, start) + first + interlude + second + page.slice(end);
page = page.replace('href="agentic-scroll-site.css" />', 'href="agentic-scroll-site.css" />\n\t<link rel="stylesheet" href="agentic-scroll-frames.css" />');
page = page.replace('src="agentic-scroll.js" defer', 'src="agentic-scroll-frames.js" defer');
page = page.replace('<title>Nicholas Wan - Product &amp; AI Portfolio</title>', '<title>Agentic hunt chapters - Nicholas Wan</title>');
fs.writeFileSync(path.join(root, 'lab/agentic-scroll-frames.html'), page);
