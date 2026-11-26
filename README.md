# Nicholas Wan's website

Static personal site. `tools/site/build.ps1` builds `dist/` from the root pages and `journals/`; GitHub Actions verifies and deploys it to GitHub Pages.

## Commands

```powershell
powershell.exe -NoProfile -File tools/site.ps1 check  # clean build + verify (Windows PowerShell 5.1)
powershell.exe -NoProfile -File tools/site.ps1 test   # check + unit + browser tests: everything CI runs (after the build, verify and unit tests run beside the browser tests; about 3 min)
.\tools\site.ps1 build          # build only (-Clean to start fresh)
.\tools\site.ps1 verify         # verify an existing dist/
node tools/preview-server.mjs   # preview dist/ at http://localhost:4321 (plain static servers 404 the extensionless URLs)
```

CI then runs these; run them before pushing, after a build, from `tools/tests/browser` (first `npm ci` and `npx playwright install chromium webkit`):

```powershell
npm run test:unit   # search and lightbox logic
npm test            # Playwright layout checks (PW_PORT=4398 if 4321 is taken: an existing server there is reused)
```

CI splits the browser tests across three Windows runners at once with `PW_SPLIT=a|b|c` (`playwright.config.cjs`: a is the travel map and navigation files, b Projects and the Work peeks, c every other file, so a new spec always runs). On one runner they took about 6 of CI's 7.5 minutes. Set `PW_SPLIT` locally only to rerun one third; the groups are by file, sized from measured run times, so rebalance them there if one third grows much longer than the others.

## Layout

- `assets/` styles, scripts, fonts, downloads · `images/` source media · `images-webp/` WebP overlay the build prefers
- `journals/` journal fragments, manifest, photo tags, template · `partials/` shared fragments
- `tools/` build, verify, image, map and font tooling · `docs/photo-edits.csv` photo-edit log
- `dist/` generated; never edit or commit it
- `lab/` local-only prototypes and review pages (git-ignored); lab paths named below exist only on the machine that made them

## Editing photos

Edit under `images/` (or `images-webp/`), delete its `-480`/`-800`/`-1200` siblings (`.jpg` or `.webp`), run `python .\tools\images\make-responsive-variants.py` and then the same with `--webp-tiers`, then `git checkout --` any sibling it re-encoded for a photo you didn't touch. Prefer a tile's `--focus-x`/`--focus-y` to cropping pixels. Log grades, crops and removals in `docs/photo-edits.csv` with their commit; removals never touch people.

## Owner preferences

Decided 16–17 Oct 2026; do not propose otherwise. Details are under [Behaviour contracts](#behaviour-contracts).

- Hero: desktop buttons stay 3rem icon circles that reveal their label on hover (phones keep the pills); copy is approved text; the canvas keeps its calm signals. Two buttons since 10 Nov 2026 (owner: "next to the view selected work maybe can also add a projects icon"): selected work, then Projects.
- Motion is calm and earns its place; decorative effects (magnetic buttons, spotlight grids) are declined, and there are no decorative entrance reveals; the staged hero entrance is the one approved exception.
- Pages crossfade in 220ms with no black load wait; desktop tab-page titles glide into place.
- Work: no contact line; anomaly charts open one at a time from their chips, never over the writeup, with no "simulated" note. Phishing domains leads the three charts; its fake keeps the padlock (most phishing sites use HTTPS).
- Skills cards carry no case-study links.
- Keep the current Home, Skills and Personal designs. The compact Tech stack proposal was rejected (18 Oct 2026).
- No Work section-shortcut row (declined 18 Oct 2026).
- No homepage sections drawn as constellations (option "F", the owner's own idea; dropped 17 Nov 2026, owner: "doesnt look that professional"): the hunt lens and sonar already give the hero its own idea.
- Personal: unfocused cards recede through their photo (`saturate(0.35)`, 0.8 opacity) while their text keeps full contrast (9 Nov 2026; the earlier 0.55 whole-card dim only worked while dimmed cards hid their text); galleries have no photo controls.
- No skip link, no change to the homepage cards' focus ring; return-to-top stays on phones (except Work, Travel, journals, Personal and Projects, where it is hidden), and steps aside once the footer is on screen so it never sits on the contact row (14 Nov 2026; at every width since the footer band of 17 Nov 2026, whose desktop icons sit at the right, where the button is).
- Every gallery or card image ships `-480`/`-800` siblings with a `sizes` matching its slot.
- Phone text never drops below 12px; section headings on a page share one style.
- No SEO, analytics or resume-PDF work.
- Not optimised for accessibility (owner, 16 Nov 2026: "key is for mobile > desktop view (with mouse)"): no accessibility audits and no keyboard-only or screen-reader-only work (focus rings, ARIA, tab order, WCAG fixes). The phone view comes first, then the desktop view used with a mouse.

## Build and deployment

Root HTML files are legacy content sources; `tools/site/build.ps1` generates `dist/`.

### Build notes

- Match CI on Windows with `powershell.exe -NoProfile -File tools/site.ps1 check`; a PowerShell 7 pass is not enough. In 5.1, `@(...)` around a root-array `ConvertFrom-Json` nests it: assign the result directly. 5.1 reads the `.ps1` files (no BOM) in the ANSI codepage, so keep `tools/site.ps1` and `tools/site/*.ps1` ASCII and write other characters as `[char]0x..` (`verify.ps1` fails on any other byte).
- Builds are incremental (`assets/fonts` and `assets/icons` are mirrored, so a removed source file also leaves `dist/`); use `build -Clean` after removing other files or to reset.
- `-Output` must be a `dist*` folder directly inside the repo, as `-Clean` empties it.
- Speed (15 Nov 2026, measured on this laptop; output byte-identical before and after): `check` 28 s to 15 s, clean build 16 s to 8 s, unchanged rebuild 13.5 s to 6 s. Windows PowerShell 5.1 is slow at per-item work, so keep hot loops (per photo, per image, per reference) free of: a scriptblock passed to `[regex]::Replace` (it was rebuilt on every call; `ConvertTo-JsonString` alone cost 6 s), `Where-Object`/`ForEach-Object`/`Select-Object` pipelines (use `foreach`, a dictionary or a `HashSet`; verify's cover lookup scanned every review per cover, about 7 s), and `Join-Path`/`Test-Path`/`Get-FileHash`/`Add-Member` (use string joins, `[IO.File]::Exists`, `Get-FileSha256` in `common.ps1` and `PSObject.Properties.Add`). To find a slow step, time a copy of the script with a stopwatch line before each top-level statement. Images in `dist/images` are hard links to their sources (15 Nov 2026, same output): fresh copies made antivirus scan each one again when verify first hashed the discovery thumbnails, about 4 s, so `check` went from 17 s to 12 s. Never edit a `dist/` image in place; that edits the source. Off the repo's volume the build copies instead. Second pass (26 Nov 2026, same laptop, median of 3, all 2,979 `dist/` files byte-identical): verify 6.8 s to 3.2 s, clean build 7.6 s to 5.9 s, unchanged rebuild 6.4 s to 4.8 s. Verify's CRLF warning ran `git ls-files --eol`, which reads every tracked file, photos included (2.4 s); it now asks only for `':(attr:text)'` paths, the same 224 lines in 0.1 s. The rest was the same per-item rule above: `Join-Path`/`Test-Path` per photo in verify's photo-index checks, the build's `Resolve-SourceImagePath` and image attributes, verify re-hashing the same assets for every page (`Get-DistAssetRef` is memoised), each tag escaped once, and `-Clean` emptying `dist/` with .NET deletes. Tried and dropped: a larger `[regex]::CacheSize` (no change). What is left is spread thin; the largest single cost is the ~2,900 hard links themselves (about 0.45 s).

### Checks and output

- The build fails on any generated reference to an `images/` path missing from both `images/` and `images-webp/`; it alone covers CSS `url()`, script strings and `data-poster`.
- `verify.ps1` checks HTML attributes and fails on any `<img>` without `alt`.
- Only referenced images ship, plus `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest` and `favicon.ico` (Chromium always requests it).

### Responsive images

- Banner `sizes`: `266px` on DPR-3 phones (`(max-width: 736px) and (min-resolution: 2.5dppx)`, the pattern Personal uses), `100vw` on other phones, `calc(100vw - 176px)` to 1024px, `1024px` to 1680px, `1366px` above. The 266px slot (15 Nov 2026, owner decision) gives 3x phones the `-800` tier at about 2.2x instead of `-1200` (Seoul and Guangzhou, which have no `-1200`, `-800` instead of the original): phone LCP at 390px, Slow 4G, 4x CPU, median of 5 against the previous build, Germany 3.62 to 1.32 s, Europe 2.94 to 1.14 s, Chengdu 2.59 to 1.10 s, about 75-105 KB less per page; luma SSIM of the rendered banner against the `-1200` render 0.91-0.94. The preload follows the `<img>`; Japan's phone crop `<source>` keeps `100vw`.
- Banners get a `-1200` tier (`make-responsive-variants.py --banners-only`, q82 JPEG / q80 WebP, kept only if it saves a fifth), made for DPR-3 phones; since 15 Nov 2026 those take `-800` (see the line above) and `-1200` serves 2x tablets and small laptops. Seoul and Guangzhou are excluded (2:1 art).
- Journal tiles use a density-capped `160px` phone slot. Desktop four-up tiles use their measured widths (`20vw` to 1179px, `224px` to 1365px, `240px` to 1680px, `325px` above; the real middle band is 244px, rounded down so 2x laptops take `-480` at 2.0x instead of `-800`, Nov 2026). Two-up sparse days keep `20vw`. Non-journal galleries keep `800px`.
- JPEG originals' `-480`/`-800` tiers are WebP since 5 Nov 2026 (owner-approved; originals untouched). `make-responsive-variants.py --webp-tiers` encodes each at the lowest quality whose luma SSIM matches its q78 JPEG tier (median q78-80) and switches a photo only when both tiers save a tenth: 651 of 725 photos, tiers about 24% smaller (108 to 82 MB), full journal scrolls 13-23% lighter. The build prefers a `.webp` tier beside a JPEG (`Get-TileVariantSuffix`); `verify.ps1` rejects mixed or JPEG-beside-WebP srcsets. Originals stay JPEG, as do og images (`kyoto4-800.jpg` and the banners'), the 73 photos where WebP saved too little, and `blackforest4.jpeg`, whose `-480.jpg` predates its re-crop (480x360 against a 1360x1200 original; needs a fresh tier and cover review). WebP needs Safari 14+, which the overlay already assumed.
- Journal banners' `-480`/`-800`/`-1200` tiers followed on 6 Nov 2026 (owner-approved; originals untouched), from the same `--webp-tiers` run and equal-SSIM rule. They use the tiles' tenth, not the `-1200` tier's fifth: that fifth weighs an extra file against fetching the original, while a format swap adds no file or srcset entry. Silicon Valley, Europe, Perth, USA & Canada, Germany and Japan switched (tiers 18-29% smaller; the 390px DPR-3 hero 151 to 109 KB, 84 to 59 KB, 76 to 61 KB, 213 to 171 KB); Australia's `-800` saved 8%, so its tiers stay JPEG. Seoul, Chengdu and Guangzhou were WebP already. Desktops at 1440px DPR 2 and 1920px still take the JPEG original. Phone LCP (390px DPR 3, 4x CPU, Slow 4G, median of 3) fell 3.49 to 2.56s on Silicon Valley, 4.35 to 3.90s on Germany and 2.26 to 2.16s on Perth. In Chrome the WebP tiers decode to the same SSIM as measured; after the browser's resize their luma SSIM against a lossless tier is within 0.004 of the JPEG's, with no difference visible at 2x zoom. `verify.ps1` pins each banner's tier format and checks every banner preload mirrors its `<img>` exactly.
- Phone banner crops (5 Nov 2026, owner-approved; originals untouched): `--phone-banners` writes `<stem>-phone-<width>.webp` for every srcset tier from the boxes in `tools/images/phone-banner-crops.json` (each tier resized as before, then cut to the rows a 320-736px cover-fit box can show, plus 2%; WebP from q80, SSIM at least the old tier's). The build wraps the banner in `<picture>` with a `(max-width: 736px)` source of the same widths at `100vw`, so phones keep their tier and framing, and splits the head preload by the same media query; the `<img>` and desktop are unchanged. Only Japan has them (its 10rem strip shows about two-thirds of the photo: 175 KB to 97 KB at 390px DPR 3, 415 KB to 145 KB at 430px). The rest gain no crop: Perth, USA & Canada, Australia and Germany are contain-fit up to 600px, and the phone boxes of Seoul, Silicon Valley, Chengdu and Guangzhou run from 1.41:1 to 2.64:1 across their photo's own ratio, so together they see the whole frame; Europe's band is 98% of it and WebP alone saves under a fifth.
- The same `160px` phone cap (24 Oct 2026) applies to Browse photos postcards (`travel-seeds.js`, `travel-discovery.js`), search tiles (`photo-search.js`) and the phone journal list photos (`travel-chronology.js`). The list photos are 224px wide, so DPR-3 phones get about 2.1x density; the owner accepted that softening for roughly 460 KB less per full scroll.
- The three Read journals shortcut photos have dedicated 200px WebP copies (`*-200.webp`, made from the originals with Pillow at q80, 24 Oct 2026, owner-approved), about 22 KB instead of 133 KB.
- Journal animations use `data-poster`, not `poster`, which loads eagerly. `gallery.js` attaches it near the viewport; `travel-map.js` reads either. Their `<source>` ships as `data-src` too (6 Nov 2026): with `src` in the markup, WebKit froze the main thread about 3 s after load on USA & Canada (37 videos); deferred, 0.35 s.

### CSS and JavaScript

- `assets/css/custom.css` is the authored source. The build splits route blocks, each between `/* Route bundle: <name>:start */` and `/* Route bundle: <name>:end */` comments (never ordinary headings), into `travel-map-page.css`, `travel-journal.css`, `travel-search.css`, `travel-navigation.css`, `experience-page.css`, `personal-page.css`, `skills-page.css` and `gallery.css` (masonry, lightbox and event bar; house, prewed and journals, before `travel-journal.css`); shared rules stay in generated `custom.css`. Route bundles load after `custom.css`, so a rule moved into one now follows every shared rule: check equal-specificity shared rules for the same element before moving it.
- `assets/js/main.js` is the authored, dependency-free theme shell. Its marked canvas block becomes homepage-only `canvas-background.js`.
- Published JavaScript ships without whole-line comments (26 Nov 2026), by the rule the per-page ceiling counts with (see Dead ends); comments after code on a line stay, so write comments on their own lines. `verify.ps1`'s stale-dist check applies the same strip. Code is not otherwise minified.
- Route scripts: `game.js` (homepage), `anomaly-peek.js` and `internship-peek.js` (Work; the latter also drives the Agentic AI console peek), `listing-effects.js` (Skills, Travel), `journal-progress.js` (journals). Verification enforces route ownership, rejects the retired jQuery/theme-helper runtime and caps per-page JavaScript.

### Theme stylesheet

- `assets/css/main.css` is Massively with rules pruned whose selectors match nothing in the HTML, scripts or rendered DOM. `-moz-`/`-ms-` duplicates of unprefixed declarations and declarations that an identical selector in `custom.css` always overrides were removed too (5 Nov 2026); `-webkit-` ones and `vh`/`svh` fallback pairs stay.
- Base styles for `h4`–`h6`, `em`, `b`, `ol`, `blockquote`, `code`, `pre`, `hr`, `sub`, `sup`, `mark`, tables, `dl` and `iframe` are kept on purpose. Form controls and the grid, box, feature and pagination components are gone; restore their rules from `vendor/massively/` before using them.
- `tools/css/computed-style-check.py` (needs `pip install playwright` and Edge) baselines styles for `prune-main-css.py`.

### Deployment

- `.github/workflows/pages.yml` checks out `master`, runs `tools/site.ps1 check` under Windows PowerShell 5.1 and deploys `dist/`. The Pages source must remain **GitHub Actions**; the custom domain lives in Pages settings, which `CNAME` does not replace.
- Before upload, CI runs the search and lightbox Node suites, then the Playwright suites in `tools/tests/browser` (Chromium geometry, WebKit smoke) against `dist/`. A failure blocks deployment and uploads screenshots and traces.
- Local run after `site.ps1 check`: `cd tools/tests/browser`, `npm ci`, `npx playwright install chromium webkit`, `npm test`. Interactive audits may reuse the read-only `geometry.cjs`.

### Asset tooling

```powershell
python .\tools\images\make-responsive-variants.py
python .\tools\images\make-responsive-variants.py --webp-tiers   # needs scikit-image
python .\tools\images\convert-curated-webp.py
```

- `make-touch-icons.py` regenerates the home-screen icons from the owner-approved "NW" monogram.
- Animations ship as an H.264 MP4 plus a static `-poster.webp`. Do not add animated WebP or GIF tiles.
- `node tools/css/peek-breathe-halo.cjs` writes the Work page chips' breathing-halo keyframes into `custom.css` between the `/* peek-halo:start */` and `/* peek-halo:end */` markers; change the breath there and rerun it, never by hand.
- `tools/maps/generate-world-map.ps1` rebuilds `images/travel/world-map.svg` at `-Tolerance 0.25`, keeping every feature, sub-pixel islets included.
- Do not re-encode originals. (The one-off `tools/legacy/` capping and GIF-conversion scripts were removed on 5 Nov 2026; they are in git history.)

**Editing a photo:**

1. Delete its `-480`/`-800`/`-1200` siblings, `.jpg` and `.webp`; the tool skips existing variants. `--banners-only` restores `-1200`. A banner with `-phone-*` crops: delete those too, re-check its boxes in `phone-banner-crops.json`, then run `--phone-banners`.
2. The tool re-encodes every `-800.jpg` that has no `-800.webp`: `git checkout --` each changed sibling you did not edit.
3. Run it again with `--webp-tiers`. It turns the new JPEG tiers into WebP where that saves a tenth at equal SSIM and deletes the JPEG tiers no source names. If a Discovery cover's thumbnail changed, re-inspect its crop (see Discovery covers), update `explore-covers.json`, and rerun to prune its old `-480.jpg`.
4. Tiles are fixed `object-fit: cover` boxes, so a crop moves the framing, not the grid. Check desktop and phone; prefer `--focus-x`/`--focus-y` for framing.
5. Re-grab video posters from the tile's own MP4 at their existing size.

### Photo search

- The build generates `assets/data/photo-index.json` from the journals plus:
  - `journals/tag-vocabulary.json`: controlled tags, each with a facet (place, subject, activity, food, people, animal, season, weather, time, event), synonyms and, for places, an optional `parent` (city, region, country, continent).
  - `journals/photo-tags.json`: tile id to tags. The id is the path under `images/travel/` without extension, so WebP swaps keep it; animations keep `.mp4`, as some share a still's name.
- The travel page's `data-search-index` carries the index's content-hashed URL. `verify.ps1` checks the index tile by tile and enforces a **560 KB** budget. The Discovery bootstrap has a **7 KB** budget and loads the index and atlas lazily.

```powershell
python -I .\tools\photos\seed_photo_tags.py
```

- `TRIPS` holds facts captions omit; `STOP_PHRASES` blocks false matches. The script merges: hand edits survive, ids of removed tiles are kept and reported for re-keying, and a second run changes nothing.
- The check fails if any tile has no tags or an unknown tag.

**Tagging a new journal:**

1. Add its `TRIPS` row and new places (with `parent`) or terms to the vocabulary; run the seed script; hand-correct the new entries.
2. Other facets come from Claude agent sessions viewing each photo, not a script (Nicholas declined the Anthropic API).
3. Build once, make a manifest per ~60 tiles, have each agent write `tools/photos/work/tags/<manifest>.json`, and validate it with `python -I tools/photos/validate_tags.py <file>` (vocabulary tags only, 3–14 per tile, every manifest id present).
4. Merge into `photo-tags.json`; `tools/photos/work/` is git-ignored. Add words agents wanted to the vocabulary before the next pass.

### Discovery covers

- Topics: `journals/explore-themes.json`. Covers come only from the reviewed pool in `journals/explore-covers.json`, so a new search tag cannot become a cover.
- Review each topic against the actual 8:5 card crop. Record photo id, thumbnail path, SHA-256, focal point (0–100%) and visible topics. Re-inspect a changed image's crop before updating its digest. (The 601 thumbnails that became WebP on 5 Nov 2026 were checked by rendering old and new 8:5 crops at each focal point: same framing, SSIM 0.89-0.99, a sample viewed side by side. `MONTEREY_bigsby`, a banner, followed on 6 Nov the same way: same framing, SSIM 0.95.)
- The build rejects missing photos, animations, duplicate ids, unknown topics and changed thumbnails. All covers must fit the index budget.
- Use specific topic labels such as **bubble tea**. Keep four cards per batch and the lazy-loading budgets. Postcards show place · year, no "Photo:" prefix.
- Postcard captions (21 Nov 2026): the topic in Merriweather 700, the place · year one quieter line that ends with an ellipsis rather than wrapping, both top-aligned, so titles in a row line up. Search result captions use the site serif (they were in the theme's Raleway).

### Source-of-truth rules

- Edit source files, never `dist/`.
- `build.ps1` owns the document head and cache-busting versions.
- `verify.ps1` independently checks generated content and private-artifact exclusions.
- Keep `images-webp/` tracked so CI needs no Pillow or nondeterministic recompression.

## Behaviour contracts

Fragile behaviour the markup does not reveal. Read [`AGENTS.md`](AGENTS.md) first; see [Build and deployment](#build-and-deployment), and for journals [Travel journals](#travel-journals) plus all of [`journals/_template.html`](journals/_template.html).

### Architecture

- Static Massively-theme site; root HTML is legacy source; `tools/site/build.ps1` generates `dist/`.
- Shared code: `assets/css/custom.css`, `assets/js/`, generated-page partials.
- Marker-bounded route CSS lives in `custom.css`; the build splits it into page bundles.
- `vendor/massively/sass/` is reference only.
- Journals: fragments in `journals/manifest.json`, rendered by `partials/travel-journal.html`.
- Keep public URLs, responsiveness, accessibility and visual language unless Nicholas asks.

### Contracts by page

Each page's contracts live in its own file under `docs/contracts/` (moved word for word on 26 Nov 2026, when this README was 324 KB). Read the file for the page you are changing, and `site-wide.md` for shared behaviour:

- [`site-wide.md`](docs/contracts/site-wide.md): Navigation, the bar and footer, page transitions, tokens, fonts and other behaviour every page shares.
- [`home.md`](docs/contracts/home.md): The homepage: hero, lens and sonar, About and the section cards.
- [`work.md`](docs/contracts/work.md): The Experience (Work) page: case studies, anomaly charts, internship peeks and the Agentic AI glance chart.
- [`projects.md`](docs/contracts/projects.md): The Projects page: the dark showcase, the four live demos and their companion devices.
- [`journals.md`](docs/contracts/journals.md): Every travel journal page: openings, banners, galleries, captions, routes, the strip and scrolling. Adding a journal: see Travel journals in the README and all of journals/_template.html.
- [`personal.md`](docs/contracts/personal.md): The Personal timeline and its House and Pre-wedding pages.
- [`travel.md`](docs/contracts/travel.md): The Travel page: the journals archive, the atlas, photo search and Discovery.

### Dead ends and hidden dependencies

- **No SEO, analytics or resume-PDF work (owner decision, Jul 2026):** no og tags, structured data or tracking. The League "1 year internship" note is intentional.
- **Declined from the Oct 2026 site critique:** every item is in [Owner preferences](#owner-preferences); do not propose them again.
- **Phone main-thread time: measured, mostly the page itself (24 Oct 2026, do not retry blindly).** At 4x CPU on a 390px phone, journals block for about 140-315ms after load, mostly the first full layout and the first style pass of markup the scripts add. `content-visibility: auto` on `section.guangzhou-day` was tried and dropped: blocking time was the same with days skipped, laid out, or removed entirely. What did help, by A/B against the previous build: `page-transitions.js` skips its per-heading style reads on phones (titles are only named at 981px+), far galleries no longer measure on load, and `travel-seeds.js` skips its mid-parse layout read on phones (Japan 310 -> 263ms, Guangzhou 239 -> 209ms, USA & Canada 344 -> 315ms, Travel 207 -> 187ms).
- **Experience page load: measured, fast (25 Oct 2026).** Cold, gzip, a 390px phone on Slow 4G at 4x CPU: first and largest paint 1.15s (a write-up paragraph), CLS 0, about 130ms blocking, 288 KB. Fonts are 65% of the bytes (three Merriweather faces about 45 KB each); the main-thread time is mostly `main.js` forcing the page's first layout, which would happen anyway. The one change taken: `internship-peek.js` warms the scenes' Figtree and League faces (about 24 KB) after `load` instead of during it (load 1.87s to 1.73s). The A/B peek's redraw added about 1.6 KB gzipped.
- **Internship peek runtime: measured, fine (25 Oct 2026, do not retry blindly).** At 4x CPU on a 1366 laptop all three scenes hold 60fps with no long frames; about 1.5-2.5s of main-thread style, layout and paint per 7.5s story. Removing either SVG filter (`spLift`, the chips' shadow; `lgMono`, the League photo's greyscale) changed nothing measurable, and with no card open the page renders no frames at all (the anomaly charts' hidden pulses do not tick).
- **Animation audit, 26 Nov 2026: measured (`lab/anim-audit`, do not retry blindly).** Every page walked one screen at a time on a 390px phone at 4x CPU and a 1440 laptop at 2x, GPU raster on (headless Chrome defaults to software raster, which overstated Home's canvas 7x: 80% against 11%). Home, Projects, Skills, Personal, journals, House and Prewed: at most 11% of the main thread and a steady 60fps. Work: up to 27% on phones. Cyber Detection's first chip breathed whenever the card's top showed, below the fold too, and the closed series chart's pulse rings ticked while hidden; both fixed in `anomaly-peek.js` (laptop, top of the page: 9% to under 1%). Travel's phone rows are the one heavy spot: one scene alone takes 34-88% (Europe 88, Perth 82, USA & Canada 63, Chengdu 56 with three moving parts), and two or three together reach 95-100%, at 30fps on the screen holding Europe, Perth and USA & Canada. The time is Chromium's Layerize, re-sorting the page's paint into layers on every animated frame (1.0-1.7 s of each 2.5 s), not Paint (about 0.2 s). Tried and dropped: `content-visibility: auto` on the rows (cut one scene alone by half, but the real screen got busier, 79% to 97-99%; it also clips the sage glow unless `overflow-clip-margin: 32px`), `will-change: transform` on each tile or its svg (fixed the 30fps screen, made two others 10-20 points busier; on `.is-active` tiles only, worse everywhere) and `contain: paint` (no change). Per scene, parts count is not the cost (Europe with 8 of its 22 stars twinkling costs the same as with all 22; removing Europe's and Guangzhou's `contrast()` filter, or USA & Canada's streak blur and water mask, saved nothing); Perth's one sliding gust mask (`perthc2-g` inside `#pt3-m`) was nearly all of Perth's cost alone (61% to 1% held still). A lighter gust that carries its ripples and dims the boathouse reflection instead (`lab/perth-gust`, v5) cut Perth alone by about two thirds and scored level with live in blind reviews (7.5 against 7), but on the real 390x844 screen, where Perth plays beside Europe, it changed nothing: 99-100% busy either way at 4x, and 60-75% with no dropped frames either way at 2x. Not shipped; the scenes stay as approved.
- **Keeping ETags across deploys: tried, does not work (15 Nov 2026, do not retry).** Each deploy re-downloads unchanged images and fonts for returning visitors, because every ETag changes. A CI step set each `dist/` file's mtime from its content hash before the Pages upload (the archive keeps mtimes). After the deploy, `Last-Modified` was still the deploy time (09:31:36 GMT for both an image and a font) and the ETag `"6af97bf8-e6a"` is that time in hex plus the size: Pages stamps files when it publishes, whatever the archive says. Only a CDN in front of Pages would change this, which is a hosting decision.
- **Build size: measured, no easy win (do not retry).**
  - JPEGs are q40–42; recompressing is break-even or worse (1600px cap enlarges them).
  - JPEG→WebP refuted (net growth) for the q40–42 originals; only the 9 banners (q82) have headroom. The q78 `-480`/`-800` tiers did have headroom and became WebP on 5 Nov 2026, the banners' tiers on 6 Nov (see Responsive images).
  - Sep 2026 wins were selection: `20vw` slot with `-480` tiles, deferred animation posters, simplified world map, circus globe WebP → MP4.
- **History was squashed to one commit on 22 Sep 2026.** Partial `git filter-repo` rewrites missed the ~350 MB floor; only a squash reached it.
  - Pre-squash history (all refs): `C:/Users/nicho/Projects/web-before-squash.bundle`; restore with `git clone` on it, else deletable.
  - Do not track `dist/` or GIFs again; see [Build and deployment](#build-and-deployment).
- **`.gitattributes` pins text to LF; do not remove it (Jul 2026).** CI's `core.autocrlf=true` CRLF pushed JS/CSS past `verify.ps1` budgets on CI only, silently stalling deploys. Budgets assume LF.
- **Published CSS has no comments (Nov 2026).** The build strips every CSS comment except `/*! ... */` (the Font Awesome licence in `icons.css`) and hashes the stripped text, which cut gzipped CSS by about a third. Sources keep their comments, so write them freely and never delete them to save bytes.
  - `verify.ps1` budgets measure the stripped output.
  - Verify checks bundle ownership by selector. Never pin comment text; it is not in `dist`.
- **`travel-map-page.css` sits about 6 KB below its 49 KB (50,176 LF bytes) `verify.ps1` budget once stripped (Nov 2026).**
  - No large CSS on the travel/atlas route.
  - If needed, bump the budget with a dated rationale comment (like the 40 → 42 note).
- **Keep travel JavaScript deferred (Oct 2026).** Initial travel bundle loads `travel-discovery.js`, not the atlas; 80 KB initial ceiling (81,920 bytes of a page's `<script src>` files, measured since 17 Nov 2026 with comments left out: whole `//` lines and `/* */` blocks that start a line; since 26 Nov 2026 the build strips those same comments from the published files (`Remove-JsCommentLines`, `common.ps1`; gzipped JavaScript about 159 to 124 KB across the site, sources keep every comment), and `check` prints each page's code size and bytes left); `travel-discovery.js` 7 KB (submit interception and IME state must precede the module); atlas 64 KB, near viewport; search 30 KB, on interaction. Do not restore eager atlas or search scripts.
- **Photo-tags reseed: tried, not committed (17 Nov 2026, do not rerun as is).** Rerunning `tools/photos/seed_photo_tags.py` added 953 tags, many wrong: "tokyo" gained 8 Hakone photos, "zebra" gained zebra-crossing photos, "home" went from 2 to 40 results and "nicholas" from 20 to 170. Fix the seeder's place guessing and keyword matching before any rerun.
- **Loading pass, 17 Nov 2026: measured, not shipped (do not retry blindly).** Phone 390px DPR 3 at 4x CPU, DevTools throttling, cold, median of 5-7 against the same build. The photo index and atlas already wait for use; nothing on Travel fetches them on load.
  - Reading `scrollY` lazily in `main.js` (it forces the first layout at eval): the layout only moves to the next script that reads one (`projects.js`, `personal-timeline.js`, the canvas); first paint was 28-96ms later on Home, Projects and Japan, 44ms sooner on Skills.
  - Holding back journal gallery tiles until the banner lands: blocking them entirely took desktop Japan's LCP from 1120 to 664ms under DevTools throttling, which shares bandwidth evenly. On a test server that serves by request priority, as Fastly does for Pages, it changed nothing (1548 and 1564ms): the High banner already goes first. Not worth deferring markup images for.
  - Deferring `world-map.svg` on desktop Travel (it starts inside lazy loading's reach, about 89 KB before LCP): blocking it moved LCP 696 to 660ms, ranges overlapping.
  - `content-visibility: auto` on the three lower Projects cards: first paint 1144 to 1200ms, within noise.
  - On Projects phones first paint (about 1.1s on Fast 4G) is main-thread time: parsing the four demos and one 300ms layout at 4x CPU, not bytes.
- **`.travel-gallery__item--tall` looks unused, isn't.** It pairs with the `guangzhou-gallery__brick--tall` compat class (the only one in markup); step 5 of [Travel journals](#travel-journals) mandates the pair; removing it unstyles future journals.

### Working with these contracts

- Change behaviour in source and update `tools/site/verify.ps1` assertions in the same change.
- Bump shared CSS/JS cache versions through `tools/site/build.ps1`, the sole source of asset versions.
- Validate in generated `dist/`; for visual changes check desktop and mobile layout, crops, overflow, navigation, focus and reduced motion.

## Travel journals

- `partials/travel-journal.html` is the shared shell; `journals/_template.html` is the content contract.
- `data-nav-label` gives a long heading a short pill label; the full heading stays its accessible name.
- Postcard covers and tags: see Photo search and Discovery covers under [Build and deployment](#build-and-deployment).
- Journals are `contentOnly` fragments, never the retired full-page format. Guangzhou is the reference.

**To add a journal:**

1. Copy `journals/_template.html` to `journals/travel_YYYY_destination.html`.
2. Keep only content: no `<html>`, `<head>`, navigation, footer, script or stylesheet markup.
3. Keep the template's compatibility classes; the `guangzhou-*` aliases carry the styling.
4. Set `--hero-focus-x`/`--hero-focus-y` on the banner and `--focus-x`/`--focus-y` on photos when the centre crop misses.
5. Use `travel-gallery__item--tall guangzhou-gallery__brick--tall` only for vertical collages spanning exactly two desktop rows.
6. Add one ordered `journals/manifest.json` entry with `contentOnly: true`, `source` set to the fragment, and the metadata.
7. Add map points in `assets/js/travel-map.js`.
8. Run the clean build and verification.

## Fonts

### Wordmark

Only `assets/fonts/josephsophia-wordmark.woff2` ships, subset from `tools/fonts/josephsophia.otf`. If the wordmark in `prewed.html` changes, regenerate it listing every character used (`pip install fonttools brotli`):

```powershell
pyftsubset tools/fonts/josephsophia.otf --unicodes="U+0020,U+0061,U+0063,U+0067,U+0068,U+0069,U+006C,U+006E,U+006F,U+0078,U+0079,U+E01C,U+E03E,U+E03F" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/josephsophia-wordmark.woff2
```

### Source Sans Pro 700

`tools/fonts/latin/source-sans-pro-700-latin.woff2` is a static 700 instance of Source Sans 3 VF, matching the 900 cut's "latin" range and features; `subset-latin.py` (below) cuts it to the shipped `assets/fonts/` file:

```powershell
python -I tools/fonts/subset-source-sans.py <path-to-SourceSans3VF-Upright> --weight 700 --output tools/fonts/latin/source-sans-pro-700-latin.woff2
```

- Source: <https://github.com/adobe-fonts/source-sans/releases> (`VAR/SourceSans3VF-Upright.ttf`); not tracked.
- `verify.ps1` caps the shipped cut at 14 KB so neither the variable font nor the full latin instance ships.
- Keep its `main.css` overrides when regenerating: `ascent-override: 98.4%; descent-override: 27.3%; line-gap-override: 0%`.
- `main.css` declares a size-adjusted Arial fallback so cold loads do not reflow headings.

### Latin subsets

Since 15 Nov 2026 the latin faces (Merriweather 300/700 and both italics, Raleway 400, Source Sans Pro 700 and 900) are cut to the characters the site sets: 237,452 to 168,468 bytes for the seven, a journal's fonts 94 to 70 KB on a phone and 139 to 101 KB on a desktop, Home and Travel 117 to 83 KB, Work 163 to 115 KB. Text renders identically: the same platform font for every glyph on all 19 pages at 1440 and 390, and 0 differing pixels on Home, Work, Skills, Guangzhou, Chengdu and Japan at both widths in Chromium and WebKit.

```powershell
python -I tools/fonts/subset-latin.py
```

- The full files are kept, unpublished, in `tools/fonts/latin/` as the source (`SOURCES.md` there says where each came from). Outlines, hinting, metrics and features are copied unchanged.
- The set is always all of ASCII (U+0000-007F), U+00A0, the combining marks U+0300-036F (dropping them broke the pinyin on Guangzhou) and General Punctuation U+2000-206F, plus every other character of Google's latin range that a built `.html`, `.js`, `.json`, `.svg` or `.css` contains (HTML entities decoded in all but `.css`, since scripts set them through `innerHTML`; `·`-style escapes read in `.js`, `.json` and inline `<script>` elements, `\b7`-style ones in `.css`; both cases because of `text-transform`). The script also sets the seven faces' `unicode-range` in `main.css` to Google's latin range narrowed to that set.
- `verify.ps1` reads the same files the same way and fails when any of them contains a character of that range, as text, entity or escape, missing from the faces' `unicode-range`, naming the character and the file: a new word with a new letter (ñ, ø) would otherwise render that letter in Georgia or Arial. Build, run the script, rebuild. It caps the cuts at 37 KB (Merriweather), 20 KB (Raleway), 14 KB (Source Sans 700) and 13 KB (900), below the full files.
- The one gap: text typed into Travel's search box can still hold a letter the site never sets; that letter falls back, as any letter outside the latin range always did.

### Latin-ext subsets

Since 8 Nov 2026 the latin-ext faces (Merriweather 300/700 and both italics, Raleway 400, Source Sans Pro 900) ship as `assets/fonts/*-latin-ext-used.woff2`: only the latin-ext letters the site sets, about 2-4.5 KB each. Today that is the pinyin tone vowels and the Japanese long vowels (ā ē ě ī ō ū ǎ ǐ ǒ ǔ ǚ ǜ) plus their capitals, because `text-transform` sets titles such as Nagoya-jō in caps. The full Google files (17-41 KB) were fetched at top priority beside the journal banner for a few letters; on a slow phone this cut Japan's fonts from 134 to 99 KB and Guangzhou's from 152 to 104 KB, with text pixel-identical in Chromium and WebKit.

- The full files are kept, unpublished, in `tools/fonts/latin-ext/` as the source. Outlines, hinting, metrics and features are copied unchanged.
- `verify.ps1` scans every built `.html`, `.js`, `.json`, `.svg` and `.css` (HTML entities decoded in all but `.css`, both cases of each letter) and fails when a latin-ext character is missing from the subsets' shared `unicode-range`; without it the letter would quietly render in Georgia or Arial. When it fails, build, then regenerate the fonts and the `main.css` ranges, then rebuild:

```powershell
python -I tools/fonts/subset-latin-ext.py
```

- Raleway has no caron vowels (ǎ ǐ ǒ ǔ ǚ ǜ), so they fall back as they always did; the script notes it.
- Characters outside Google's latin and latin-ext ranges (arrows, Greek, CJK, Korean, Vietnamese) never used the web fonts and still fall back to system fonts.

### Figtree (Shopee peek, SquashBot and Nag-bot demos)

`assets/fonts/figtree-{400,500,700}-ascii.woff2` are static ASCII instances of the Figtree variable font, declared in `internship-peek.css` for the Shopee scene and in `projects.css` for the app demos (Shopee's own face is not free; Figtree is its nearest free match):

```powershell
python -I tools/fonts/subset-figtree.py <path-to-Figtree[wght].ttf>
```

- Source: <https://github.com/google/fonts/tree/main/ofl/figtree> (`Figtree[wght].ttf`, SIL OFL); not tracked.
- `verify.ps1` caps each at 8 KB so the variable font never ships. `internship-peek.js` requests all three on load, because phone cards stay `display: none` until tapped.
- The chips' boxes and keyframes, the title highlight and the badge were measured from Figtree's layout; if the listing text or its font changes, re-measure them (each chip must land exactly on its row word; the peek spec checks it).

### Archivo (Projects)

`assets/fonts/archivo-latin.woff2` is the Archivo variable font (wdth 62-125, wght 100-900, SIL OFL) cut to the characters Projects sets, declared in `projects.css` for the card titles, reasons, rail and Packing demo (15 Nov 2026: 90,104 to 54,436 bytes, renders pixel-identical):

```powershell
python -I tools/fonts/subset-archivo.py <path-to-archivo-latin.woff2>
```

- Source: Google Fonts' latin subset of Archivo (gstatic v25), see `assets/fonts/archivo-SOURCES.md`; not tracked.
- The set is printable ASCII (every month and weekday name, digit and sign the demos' calendar dates can print) plus the non-ASCII characters in the Projects sources that Archivo has (`U+00A0 00A3 00B0 00B7 00D7 00E9 00F7 2013 2014 2018 2019 201C 201D 2022 2026 2039 203A 2192 2212`); the arrows and emoji in the demos were never in Archivo and fall back as before. New Archivo text outside that set needs the character added and the script rerun.
- Keep both axes: the Packing boarding pass sets `font-stretch` 85% and 110%, which Chrome applies to the variable `wdth` axis although the `@font-face` names no stretch range, so a width-pinned cut (24-32 KB) renders differently.
- `verify.ps1` caps it at 56 KB so the full file never ships again.

### League peek lettering

The League phone's lettering is live text (outlines filled like shapes looked soft at this size; owner: "the league font doesnt look as clear", "dont hand draw. it has to be high quality") in glyph-only subsets of the nearest free matches, about 6.6 KB in all, declared in `internship-peek.css`:

```powershell
python -I tools/fonts/subset-league.py <dir with the variable fonts>
```

- `playfair-900-italic-league.woff2` (stacked mark), `librebaskerville-400-league.woff2` (name) and `librebaskerville-400-italic-league.woff2` (detail line and labels), from <https://github.com/google/fonts/tree/main/ofl/playfairdisplay> and <https://github.com/google/fonts/tree/main/ofl/librebaskerville> (SIL OFL); not tracked.
- They hold only the scene's characters: if its wording changes, add the new characters to `TEXT` in the script and rerun. `verify.ps1` caps each at 6 KB.

## Vendor theme

`vendor/massively/` is uncompiled upstream Massively Sass, for reference only; edits there do not affect the site, whose theme CSS is `assets/css/main.css`. Add any Sass workflow explicitly.
