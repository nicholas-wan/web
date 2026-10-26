// Builds a Work-page design study without changing the published page.
// Run: node tools/scenes/agentic-scroll/site-build.cjs
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const scene = fs.readFileSync(path.join(root, 'tools/scenes/agentic-console/scene.html'), 'utf8').trim();
const story = fs.readFileSync(path.join(__dirname, 'site-story.html'), 'utf8').replace('<!-- AGENTIC_SCENE -->', scene);
let page = fs.readFileSync(path.join(root, 'experience.html'), 'utf8');
const article = page.indexOf('<article class="case-study case-study--work" id="agentic-ai">');
const peek = page.indexOf('<p class="internship-demo-hint">', article);
const articleEnd = page.indexOf('</article>', peek);
if (article < 0 || peek < 0 || articleEnd < 0) throw new Error('Could not find the agentic card and chart');
page = page.slice(0, peek) + '<a class="agentic-story__link" href="#agentic-hunt">Explore an illustrative hunt <span aria-hidden="true">&darr;</span></a>\n\t\t\t\t\t' + page.slice(articleEnd, articleEnd + '</article>'.length) + '\n\n\t\t\t\t\t' + story + page.slice(articleEnd + '</article>'.length);
page = page.replace('class="is-preload"', 'class="page-experience"');
page = page.replace('</head>', '\t<link rel="stylesheet" href="../assets/css/internship-peek.css" />\n\t<link rel="stylesheet" href="agentic-scroll-site.css" />\n\t<script src="agentic-scroll.js" defer></script>\n</head>');
page = page.replace(/(href|src)="(assets\/|images\/)/g, '$1="../$2');
page = page.replace(/href="(index|experience|skills|personal|travel)(["#])/g, 'href="../$1$2');
fs.writeFileSync(path.join(root, 'lab/agentic-scroll-site.html'), page);
