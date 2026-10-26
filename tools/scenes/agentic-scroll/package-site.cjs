// Make the Work-page mockup openable as a local file with its own assets.
// Run: node tools/scenes/agentic-scroll/package-site.cjs <output-directory>
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const out = process.argv[2] && path.resolve(process.argv[2]);
if (!out) throw new Error('Pass an output directory');
const frames = process.argv[3] === 'frames';
const pageName = frames ? 'agentic-scroll-frames' : 'agentic-scroll-site';
const write = (name, data) => {
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, data);
};
const copy = name => write(name, fs.readFileSync(path.join(root, name)));
let html = fs.readFileSync(path.join(root, `lab/${pageName}.html`), 'utf8');
html = html.replace(/href="\.\.\/(index|experience|skills|personal|travel)(["#])/g,
  (_, route, tail) => `href="https://nicholaswan.me/${route}${tail}`);
write(`lab/${pageName}.html`, html);
copy('lab/agentic-scroll-site.css');
copy(frames ? 'lab/agentic-scroll-frames.css' : 'lab/agentic-scroll.js');
if (frames) copy('lab/agentic-scroll-frames.js');
for (const name of ['icons.css', 'main.css', 'custom.css', 'internship-peek.css']) {
  let css = fs.readFileSync(path.join(root, 'assets/css', name), 'utf8');
  css = css.replace(/url\("\.\.\/icons\/([^" ]+\.svg)"\)/g, (_, icon) => {
    const svg = fs.readFileSync(path.join(root, 'assets/icons', icon));
    return `url("data:image/svg+xml;base64,${svg.toString('base64')}")`;
  });
  write(`assets/css/${name}`, css);
}
for (const font of fs.readdirSync(path.join(root, 'assets/fonts'))) copy(`assets/fonts/${font}`);
for (const [, image] of html.matchAll(/(?:src|href)="\.\.\/(images\/[^" ]+)"/g)) copy(image);
