// Standalone scroll-story prototype using the authored agentic console scene.
// Run: node tools/scenes/agentic-scroll/build.cjs
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const scene = fs.readFileSync(path.join(root, 'tools/scenes/agentic-console/scene.html'), 'utf8').trim();
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
fs.writeFileSync(path.join(root, 'lab/agentic-scroll.html'), template.replace('<!-- AGENTIC_SCENE -->', scene));
