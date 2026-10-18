# Nicholas Wan's website

Static personal site. `tools/site/build.ps1` builds `dist/` from the root pages and `journals/`; GitHub Actions verifies and deploys it to GitHub Pages.

## Commands

```powershell
powershell.exe -NoProfile -File tools/site.ps1 check  # CI-equivalent clean build + verify (Windows PowerShell 5.1)
.\tools\site.ps1 build          # build only (-Clean to start fresh)
.\tools\site.ps1 verify         # verify an existing dist/
node tools/preview-server.mjs   # preview dist/ at http://localhost:4321 (plain static servers 404 the extensionless URLs)
```

CI then runs these; run them before pushing, after a build, from `tools/tests/browser` (first `npm ci` and `npx playwright install chromium webkit`):

```powershell
node --test ../photo-search.test.cjs ../lightbox-cache.test.cjs
npm test   # Playwright layout checks
```

## Layout

- `assets/` styles, scripts, fonts, downloads · `images/` source media · `images-webp/` WebP overlay the build prefers
- `journals/` journal fragments, manifest, photo tags, template · `partials/` shared fragments
- `tools/` build, verify, image, map and font tooling · `docs/photo-edits.csv` photo-edit log
- `dist/` generated; never edit or commit it

## Editing photos

Edit under `images/` (or `images-webp/`), delete its `-480`/`-800`/`-1200` siblings, run `python .\tools\images\make-responsive-variants.py`, then `git checkout --` any sibling it re-encoded for a photo you didn't touch. Prefer a tile's `--focus-x`/`--focus-y` to cropping pixels. Log grades, crops and removals in `docs/photo-edits.csv` with their commit; removals never touch people.

## Owner preferences

Decided 16–17 Oct 2026; do not propose otherwise. Details are under [Behaviour contracts](#behaviour-contracts).

- Hero: desktop button stays a 3rem icon circle that reveals its label on hover (phones keep the pill); copy is approved text; the canvas keeps its calm signals.
- Motion is calm and earns its place; decorative effects (entrance reveals, magnetic buttons, spotlight grids) are declined.
- Pages crossfade in 220ms with no black load wait; desktop tab-page titles glide into place.
- Work: no contact line; anomaly charts open one at a time from their chips, never over the writeup, with no "simulated" note. Phishing domains leads the three charts; its fake keeps the padlock (most phishing sites use HTTPS).
- Skills cards carry no case-study links.
- Keep the current Home, Skills and Personal designs. The compact Tech stack proposal was rejected (18 Oct 2026).
- No Work section-shortcut row (declined 18 Oct 2026).
- Personal: unfocused cards stay dimmed to 0.55; galleries have no photo controls.
- No skip link, no change to the homepage cards' focus ring; return-to-top stays on phones (except Travel, journals and Personal, where it is hidden).
- Every gallery or card image ships `-480`/`-800` siblings with a `sizes` matching its slot.
- Phone text never drops below 12px; section headings on a page share one style.
- No SEO, analytics or resume-PDF work.

## Build and deployment

Root HTML files are legacy content sources; `tools/site/build.ps1` generates `dist/`.

### Build notes

- Match CI on Windows with `powershell.exe -NoProfile -File tools/site.ps1 check`; a PowerShell 7 pass is not enough. In 5.1, `@(...)` around a root-array `ConvertFrom-Json` nests it: assign the result directly.
- Builds are incremental (`assets/fonts` and `assets/icons` are mirrored, so a removed source file also leaves `dist/`); use `build -Clean` after removing other files or to reset.
- `-Output` must be a `dist*` folder directly inside the repo, as `-Clean` empties it.

### Checks and output

- The build fails on any generated reference to an `images/` path missing from both `images/` and `images-webp/`; it alone covers CSS `url()`, script strings and `data-poster`.
- `verify.ps1` checks HTML attributes and fails on any `<img>` without `alt`.
- Only referenced images ship, plus `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest` and `favicon.ico` (Chromium always requests it).

### Responsive images

- Banner `sizes`: `100vw` on phones, `calc(100vw - 176px)` to 1024px, `1024px` to 1680px, `1366px` above.
- Banners get a `-1200` tier (`make-responsive-variants.py --banners-only`, q82 JPEG / q80 WebP, kept only if it saves a fifth) for DPR-3 phones. Seoul and Guangzhou are excluded (2:1 art).
- Journal tiles use a density-capped `160px` phone slot and a `20vw` desktop slot; non-journal galleries keep `800px`. No images are recompressed.
- Journal animations use `data-poster`, not `poster`, which loads eagerly. `gallery.js` attaches it near the viewport; `travel-map.js` reads either.

### CSS and JavaScript

- `assets/css/custom.css` is the authored source. The build splits marker-bounded route blocks into `travel-map-page.css`, `travel-journal.css`, `experience-page.css`, `personal-page.css` and `skills-page.css`; shared rules stay in generated `custom.css`.
- `assets/js/main.js` is the authored, dependency-free theme shell. Its marked canvas block becomes homepage-only `canvas-background.js`.
- Route scripts: `game.js` (homepage), `anomaly-peek.js` (Work), `listing-effects.js` (Skills, Travel), `journal-progress.js` (journals). Verification enforces route ownership, rejects the retired jQuery/theme-helper runtime and caps per-page JavaScript.

### Theme stylesheet

- `assets/css/main.css` is Massively with rules pruned whose selectors match nothing in the HTML, scripts or rendered DOM.
- Base styles for `h4`–`h6`, `em`, `b`, `ol`, `blockquote`, `code`, `pre`, `hr`, `sub`, `sup`, `mark`, tables, `dl` and `iframe` are kept on purpose. Form controls and the grid, box, feature and pagination components are gone; restore their rules from `vendor/massively/` before using them.
- `tools/css/computed-style-check.py` (needs `pip install playwright` and Edge) baselines styles for `prune-main-css.py`.

### Deployment

- `.github/workflows/pages.yml` checks out `master`, runs `tools/site.ps1 check` under Windows PowerShell 5.1 and deploys `dist/`. The Pages source must remain **GitHub Actions**; the custom domain lives in Pages settings, which `CNAME` does not replace.
- Before upload, CI runs the search and lightbox Node suites, then the Playwright suites in `tools/tests/browser` (Chromium geometry, WebKit smoke) against `dist/`. A failure blocks deployment and uploads screenshots and traces.
- Local run after `site.ps1 check`: `cd tools/tests/browser`, `npm ci`, `npx playwright install chromium webkit`, `npm test`. Interactive audits may reuse the read-only `geometry.cjs`.

### Asset tooling

```powershell
python .\tools\images\make-responsive-variants.py
python .\tools\images\convert-curated-webp.py
```

- `make-touch-icons.py` regenerates the home-screen icons from the owner-approved "NW" monogram.
- Animations ship as an H.264 MP4 plus a static `-poster.webp`. Do not add animated WebP or GIF tiles.
- `tools/maps/generate-world-map.ps1` rebuilds `images/travel/world-map.svg` at `-Tolerance 0.25`, keeping every feature, sub-pixel islets included.
- Never run the destructive `tools/legacy/` scripts in builds. Do not re-run `cap-original-images.py` or re-encode originals.

**Editing a photo:**

1. Delete its `-480`/`-800`/`-1200` siblings; the tool skips existing variants. `--banners-only` restores `-1200`.
2. The tool re-encodes every `-800`: `git checkout --` each changed sibling you did not edit.
3. Tiles are fixed `object-fit: cover` boxes, so a crop moves the framing, not the grid. Check desktop and phone; prefer `--focus-x`/`--focus-y` for framing.
4. Re-grab video posters from the tile's own MP4 at their existing size.

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
- Review each topic against the actual 8:5 card crop. Record photo id, thumbnail path, SHA-256, focal point (0–100%) and visible topics. Re-inspect a changed image's crop before updating its digest.
- The build rejects missing photos, animations, duplicate ids, unknown topics and changed thumbnails. All covers must fit the index budget.
- Use specific topic labels such as **bubble tea**. Keep four cards per batch and the lazy-loading budgets. Postcards show place · year, no "Photo:" prefix.

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

### Site-wide behavior

- Tab-page openings (approved 18 Oct 2026): matching left-aligned serif title scale, teal eyebrows, top spacing and gutters on Work, Skills, Personal and Travel. Work stays visible on phones; Personal is left-aligned; Travel opens on plain white. Desktop titles retain their glide.

- 404 uses root-relative assets and nav links so nested paths work; fragment links stay local.
- New-tab links need `rel="noopener noreferrer"`.
- Skills (owner decisions): summaries have no links (no "View … case study"); details always visible; no phone toggles, eyebrows, tag lists or tool-logo lists (`verify.ps1` enforces).
- Skills, Tech stack, Education headings: quiet left-aligned Merriweather; Skills is the page title and uses the shared opening scale.
- Skills has no generated banner; its `Capabilities` eyebrow gives hierarchy.
- Page changes (owner-approved):
  - Content pages skip the load overlay (`#wrapper.fade-in::before`); the homepage keeps it.
  - Cross-document view transitions (Chrome/Edge 126+, Safari 18.2+): one 220ms crossfade; shared header and nav stay still. Elsewhere, and under reduced motion: none.
  - Desktop active tab: build-added empty `.nav-active-mark` after the active link, so it glides.
  - Desktop (≥981px) tab-page titles (Work, Skills, Personal, Travel; owner-approved Oct 2026) share `view-transition-name: page-title`, sized to their text, and glide; the old title is gone by halfway and the new one fades in over the second half, so different words never overlap.
  - `assets/js/page-transitions.js` loads in `<head>` so `pagereveal` binds before first paint.
  - Mark and title sit out when they would fly (event pages and the homepage intro: the arriving side only): off-screen on either page (scroll, Back, `#anchor`), House and Pre-Wedding (no header), homepage during the intro fade.
  - Never name `#main` or other large regions (morph shows a blank).
  - Rejected: content drift; Ctrl/⌘K palette.
- Motion tokens (`custom.css`): 150ms feedback, 220ms card/nav, 320ms images, 480ms reveals (60ms stagger), 520ms large moves. Scramble, timeline FLIP, nav sheet, atlas fly-to keep their own timings.
- Primary pagers: unboxed, short teal rule, small arrow travel; static under reduced motion.
- Pager text aligns via `--pager-pad` (x=208 desktop, 29px phones).
- `a.travel-pagination__next::after` must outrank `.travel-pagination a::after` (rule under right-aligned "Next").
- `#main > .travel-pagination` restates the 1px soft border over the theme's `#main > *` 2px.
- Hover is teal, never `#18bfef`: `a:hover`/`button:hover` → brand-700, equal specificity, `!important`.
- Brand-200 for nav, footer links, icon rings on dark chrome; white text on atlas zoom, region, close buttons.
- `#header a:hover` keeps the theme colour by choice.
- `<button>` and `[role="button"]` share the `a:focus-visible` teal ring; archive card ring is teal.
- Small uppercase labels: `--eyebrow-size` (`max(var(--text-floor), 0.7rem)`), `--eyebrow-tracking` (0.12em), brand-700 (atlas/Japan/archive eyebrows, search label, internship labels, day dates, pager spans, footer "Contact").
- `--radius-control` (0.3rem) for controls; `--color-ink-800`, not `#333`.
- Day-strip pills: Source Sans 700, brand-600 active.
- "Browse photos": 1.1rem/900. Lightbox captions: 1.5 leading, context line ≥12px.
- Source Sans Pro ships 700 (latin, via `tools/fonts/subset-source-sans.py` from Source Sans 3) and 900; labels use 700, titles 900.
- `.travel-map__place` stays explicit 900 (atlas collision layout).
- Preload Source Sans 900 everywhere, Raleway on journals. `--font-display` uses size-adjusted `"Source Sans Fallback"` (Arial 86%/97%) against cold-load reflow.
- Phone floor: `font-size: max(var(--text-floor), <rem>)`; `--text-floor` is 12px at ≤736px, else 0.
- Never bare `max(12px, …)` (the 11pt root at ≤1280px would grow laptop text), except the atlas text listed under Travel atlas contracts. Atlas canvas labels are exempt from the floor.
- Phone/tablet: CTAs, map controls, archive actions keep 3rem targets; dense atlas pins may use transparent halos and region controls instead.
- Lightbox and nav sheet are modal: in `gallery.js`/`main.js` keep focus-on-open, Tab trap, Escape/close, focus restore, frozen scroll.
- Lightbox: quiet backdrop and content fade/scale, instant under reduced motion. Backdrop 0.98 alpha so phone zoom controls stay clear.
- Phones: tools and prev/next in reserved safe-area bands, never over media.
- Wide stills in portrait: optional landscape toggle; caption leaves layout but stays accessible; Info shows it upright in a temporary panel without resizing.
- Zoom buttons, double-tap, pinch, pan: one bounded 1–3× transform.
- Fitted: swipe and arrow keys page one circular sequence. Zoomed: one-finger drag pans; arrows pan a fifth of the viewport.
- Tap/click on empty space beside media (letterbox included) closes; drag releases, caption-panel drags and media taps do not.
- A zoom limit disabling the focused button moves focus to the other.
- Video tap-to-pause stays distinct; no still tools on video.
- Pre-wedding wordmark uses private-use Wedding-font glyphs deliberately; never "correct" it. Name `Nicholas and Yingxian` via `role="img"` + `aria-label`.
- No fixed dimensions on `.content-image` masonry tiles if they distort.
- Keep useful alt text, below-fold lazy loading, visible subjects on desktop and mobile crops.
- Near-duplicate gallery photos are deliberate (owner decision): edit, never remove.
- `html` has `overflow-x: clip`, so `body { overflow: hidden }` cannot stop scroll. Lock the root via `html:has(> body.is-navPanel-visible)` / `html:has(> body.is-map-fullscreen)`; the lightbox keeps its fixed-body lock.
- Width-only work (card measurement, gallery scroll cues, intro swipe `measure()`, canvas bitmap) ignores height-only (URL-bar) resizes.

### Homepage contracts

- Keep the scroll animation and background canvas.
- Canvas (owner-approved): particle network plus, every few seconds, one signal hopping up to four links, lighting nodes, resting ~2s; clipped out of the hero text (name to CTA).
- Never propose again: labelled agent-graph canvas; letter-by-letter name rise (hurt LCP).
- Hero is `100lvh` so the phone opening stays black in both URL-bar states.
- Phones only: bottom padding absorbs `lvh` − `svh` to keep content centred; desktop is plain 4rem.
- `initHeroSnap` (`game.js`), phones only: a scroll settling mid-band glides to About's measured document top (900ms, ease-in-out), finishing the portrait sweep; touch or wheel cancels.
- Measure About's real offset, not hero height, or the glide falls short.
- Forward snap: 90ms momentum debounce. Reverse: first 32ms timer after upward intent.
- Desktop and reduced motion scroll plainly. Never reintroduce CSS mandatory snap (unslowable, fights the About swipe).
- Hero: name, scrambling headline, support line, selected-work CTA.
  - Headline: `I build agentic AI products for real-world security operations.`
  - Support: `Product direction · DSTA`
- Headline is owner-approved: propose, never silently rewrite. No multi-line paragraph hero or hero skills list.
- Exactly three scrambles via `assets/js/scramble-reveal.js`: homepage headline, both experience Outcome rows. Never add or remove one incidentally.
- Scramble: once, ~1.2s, opening words readable from frame one, full-length width-matched noise, real text in the DOM, visual seeded with noise (no sentence flash). Reduced motion skips it.
- Homepage trigger: 180ms visible hold. Experience: observers arm 150ms after `DOMContentLoaded` (`PAGE_REVEAL_DELAY_MS`), then 70% of the Outcome row visible for the same hold; leaving cancels.
- Never tie either trigger to image `load`.
- Keep the intro stacking fix (load fade can cover the hero) when changing hero layers or entrances.
- Phones: About photo stays low and bottom-anchored; `game.js` reads swipe progress from it.
- Phones: scene is one `svh`, not sticky, settling at the About top so cards follow the next scroll.
- Desktop: taller sticky scrub, centred About cluster. Never unify the two.

### Experience page contracts

- Page opening (approved 18 Oct 2026): `Experience` eyebrow and `Selected work` title at every width. The job title appears only in its DSTA card.
- DSTA cards on phones: company context, title, Problem/My role/Outcome rail, copy, tags.
- Cloud Analytics header is `display: contents` at the phone breakpoint only; desktop stays two-column.
- Internship entries (approved 18 Oct 2026): three full-width rows with quiet separators. Above 736px company/date metadata sits beside title, description and plain teal capability tags; on phones metadata sits above the description. Logos sit beside metadata except at 737–1100px, where they sit above it to keep dates readable. The description and tags share a static `.internship-entry__body` wrapper so metadata height cannot create a gap between them. Keep all original copy, no fixed heights, no new motion, and the 12px phone text floor. Shopee's same-year range gives the year once (`April – November 2020`).
- The second DSTA card is titled Cyber Detection Analytics (renamed from Cloud Anomaly Analytics, Oct 2026; anchor stays `#cloud-analytics`). Its lede names both halves: AWS and Microsoft 365 anomalies, and phishing domains impersonating MINDEF websites (owner-approved wording).
- Cyber Detection Analytics ends with an anomaly peek (owner-approved; `assets/js/anomaly-peek.js`, experience bundle).
- CTA "Hover a chart to see it catch something" ("Tap a chart…" on phones; was "See an anomaly get caught · hover a chart", Oct 2026) above chips Phishing domains, Statistical baseline and Graph analysis (named by method, Oct 2026; were Over time and Across connections) (phones and tablets ≤980px: three equal tiles in one row, thumbnail above a centred label; desktop: three chips as wide as the widest, content centred, a small arrow at the right; thumbnails drawn at 78×24).
- Phishing domains (owner-approved Oct 2026, renamed from Lookalike sites): a copy lifts off a real sign-in page, one scan crosses both, amber marks draw where it differs (a dot swapped for a hyphen, `eservices.example.sg` → `eservices-example.sg`, or the shorter `my.` pair where the bar is too narrow, never truncated; an off logo; the form-posts-elsewhere curve was removed as unclear), then the copy is outlined and tagged "Phishing"; it replays every 14s while open. It shows what differs, never the detector's steps or order.
- The first chip (Phishing domains) breathes while the card is on screen until any chart is opened, then rests for the visit (`sessionStorage`); reduced motion holds a teal outline.
- Chip previews play ~4s on entering view (eased, line ends faded), land on the amber flag with one ring, then glow once (max every 20s). While on screen they replay every 15s without the glow, holding while a chart is open or the tab is hidden.
- Hover, focus or tap opens only that chart: mouse desktops, a floating card below the chips, never over the writeup; phones (≤736px) and touch tablets (`hover: none`), an inline card pushing content down, below 44px chips (a pinned floating card covered Early career, Oct 2026).
- Click/tap pins; hovering the other chip previews it, then the pin returns.
- Equal-size cards (all 130px plots; notes reserve two lines at ≤374px), one plain note each, no "simulated" disclaimer (owner).
- Charts animate only while open and on screen; reduced motion shows stills.
- Never show two charts at once or overlay the writeup.

### Travel journal contracts

- Guangzhou is the reference; journals are content-only fragments the build wraps.
- Preserve `data-journal-template="v2"` and `partials/travel-journal.html` tokens `{{MAIN_ATTRIBUTES}}`, `{{TRIP_NAVIGATION}}`, `{{JOURNAL_CONTENT}}`, `{{TRIP_PAGINATION}}`.
- Follow `journals/_template.html` classes and hierarchy (`travel-*`, `guangzhou-*` compatibility). Heading order is structural (it derives section and map anchors).
- Masthead (all sizes): book icon, `Travel journals` link to `travel` via `partials/travel-masthead.html`; no JS or external icon. Other pages keep Home. Day strip stays separate and sticky.
- Phones: ~56px masthead (44px pill), tight hero spacing, banner within ~280px of the top.
- Return-to-top hidden on phones (travel and journals).
- Dates: `D Month YYYY – D Month YYYY` or `Month YYYY – Month YYYY` if days unknown. Compact ranges (archive, atlas, Personal metas): spaced en dash, year once (`October – November 2025`, `23 – 31 July 2018`). Work/education metas: full months, "months", never "mos".
- Copy: British spelling; serial comma; "Washington, D.C."; "Yingxian" on first mention; arrival is Day 1; no "#N -" on Silicon Valley chapter headings; Guangzhou Chinese-name tiles use 汉字 title, "Pīnyīn · description" caption; actions say "View …", not "See"/"Visit".
- `<title>` "Nicholas Wan - {label} Trip"; meta "Nicholas Wan's [Place] travel journal from [Month YYYY]: [stops]."; 404 title "Nicholas Wan - …", cards use nav names.
- Atlas uses journal labels (Perth, Europe, Silicon Valley, Seoul), region in brackets where a journal has two pins.
- Chengdu & Zhangjiajie captions: place names only (owner decision).
- Hero: title-case upright Raleway, `clamp(2.25rem, 6vw, 3.5rem)`; lede 1.65 leading, `text-wrap: balance`; date 1.5rem above; desktop article top padding 2.5rem. Keep artwork banners.
- Japan's editorial hero: left-aligned `Travel journal` eyebrow, title, dates, lede, above a full-bleed text-free Arakurayama banner (`day14_hakone/fuji2.jpg`, also in the gallery, owner choice) at `50% 52%`. No title over the photo.
- Banners: `clamp(16rem, 28vw, 22rem)`, 22rem wrapper cap (owner-approved); phones keep own heights and contain-fit wrappers. Shared pale placeholder; wide contain-fit art sizes its mobile wrapper to natural ratio. Never a dark wrapper background (black flash).
- Crops use focal-point custom properties. Tall collage cards reserve two 4:3 desktop rows plus 1rem gutter via width-based padding; phones reset it. Tall-grid checks cover every such journal.
- `gallery.js`: gallery `role="list"` labelled `N photos`; tiles `role="listitem"`.
- Phone galleries: counter and previous/next arrows in flow above photos; native swipe, unfaded next-tile preview, no swipe hint or edge mask; arrows stop at ends, disabled for single photos; reduced motion jumps; counter shows nearest tile/total, last included at the scroll limit.
- Phone bricks: `content-visibility: visible`, no intrinsic placeholder (the 320px estimate stretches rows). Keep lazy loading.
- Desktop narrative max 70ch. Single-photo days stay quarter-width tiles (owner decision).
- Day headings keep full titles; optional `data-nav-label` sets the pill; build prefixes D0, D1…. One pill group in section order; only Australia splits (Melbourne, Sydney); no country grouping in `build.ps1`. Chapter/place journals keep their meaning. Every day (departures, repeats) stays reachable.
- Route subtitles use `--color-ink-600`. Every route box is labelled `Route` and gets the shared enhancement.
- Phone routes: first and last stop plus "View all N stops"; summary joins name and `<small>` subtitle with a middle dot (`樟宜机场 · Zhāngyí Jīchǎng → …`), name alone if none. Expanded: full bilingual numbered timeline; collapsed stops hidden from assistive tech. Desktop keeps wrapped expansion.
- Phone route summary and Australia's intro are left-aligned. Australia keeps its lede-less header, 2.5rem bottom margin, day-note intro.
- Lightbox: at most five decoded viewing-size images; closing releases them.
- Show a prepared image at once; else the tile, while the fitted image loads at high priority and one directional neighbour at low priority in parallel. After decode, prepare two ahead, one behind.
- Navigation demotes the previous request but keeps the cache. Cold fallback: smallest responsive preview.
- Videos keep their own path. Stale loads never replace another image or override zoom. Fit stays stable; adjacent tiles warm.
- Zoom loads the original, holding the decoded preview until it decodes; leaving, closing, fit or orientation-mode switch cancels it.
- Pan release after a real drag (even with a stationary hold) refreshes click suppression; controls stay usable.
- Near-viewport phone rows warm current, two ahead, one behind; scroll measured once per frame.
- Posters warm near the viewport; playback needs visibility (pauses under the lightbox or a hidden tab).
- Caption (polite, atomic): place name, then section/day and position within that section, split by a visually hidden middle dot (`…京都勝牛 Hiroshima · 1 of 16`).
- Hiding a focused Info control first moves focus to close (orientation changes too).
- Test: `node --test tools/tests/lightbox-cache.test.cjs`.
- MP4 animations: the build renames `poster` to `data-poster`; `gallery.js` attaches it near the viewport and before the lightbox (literal `poster` loads despite `preload="none"`).
- Tiles: 480w on phones (160px slot, density-capped to DPR 3); `20vw` desktop. See [Build and deployment](#build-and-deployment).
- Section links use the sticky-toolbar correction in `assets/js/travel-nav.js` (date above heading, if any). One horizontally scrollable row.
- Desktop strip arrows get `hidden` without overflow (not dimmed); phones keep the right-edge fade; ResizeObserver refreshes them. Scrollspy centres only the strip.

#### Journal scrolling contract

- Applies to every journal, all sizes.
- Pill scrollport keeps 0.25rem vertical padding inside its clip; desktop rail outer padding drops to match. Keep it (pill borders clip otherwise).
- Hash landing waits until document scroll and target both settle, then settle-and-stop: two stable checks after load and fonts end the loop.
- Wheel, touch, pointer or keyboard input cancels it; for section anchors, so does unexpected document scroll, even right after `load`.
- The correction records its own `scrollTo` target, so it is not read as input.
- `load` and `pageshow` never re-land an old hash once reading starts; a new tab selection re-arms via `hashchange`.
- Scrollspy centres the active tab (all sizes) with `scrollTo` on `.travel-jump-groups`. Never `scrollIntoView` a strip child: iPhone Safari jumps the root.
- Mobile rail and hamburger stay dark throughout; hide the wrapper-level hamburger until `travel-nav.js` moves it in.
- `#photo=<path under images/travel, no extension; animations keep .mp4>` (e.g. `#photo=2023_usa_canada/day12/zoo_gif1.mp4`) is the photo deep link (search-hit target).
- `travel-nav.js` lands its `.brick` with the same settle-and-stop correction, then opens it through `window.travelGallery` (`gallery.js` loads first); the lightbox owns focus, caption, zoom, sequence. Input cancels the auto-open.
- Match authored `src`/`srcset`/`<source>`/`data-poster`, never `currentSrc`; extension picks still or animation (shared basenames, e.g. `SF_sutro`).
- On close the tile gets `is-deep-linked` for 1.5s (static ring under reduced motion). Closing never touches history.
- Photo landing tolerates layout-driven root and child scrolling; physical input cancels. Section anchors keep the stricter guard.
- Journals add `is-travel-journal-scroll-guard`: `overscroll-behavior-y: none` on root and body at the phone breakpoint.
- Checks, every journal at desktop and phone widths: no root horizontal overflow; nav script and guard present; anchors exist; strip owns its overflow; input never followed by re-landing.

### Personal page contracts

- Latte and Mocha links to `@twoshotsofcuteness` (Instagram icon); never restore popover, mockup or embed.
- Orientation and Naval Diving Unit are self-contained galleries, not popups or pages; linked-gallery hover, default cursor. Orientation rotates two real photos, NDU three; never duplicate frames. `experience_ndu` stays unpublished.
- Personal card, pre-wedding and house images need authored `sizes` and `-480`/`-800` siblings:
  - Personal: `(max-width: 736px) and (min-resolution: 2.5dppx) 266px, (max-width: 736px) 85vw, (max-width: 1680px) 275px, 366px`
  - Galleries: `(max-width: 736px) and (min-resolution: 2.5dppx) 266px, (max-width: 736px) 90vw, (max-width: 767px) 76vw, (max-width: 1023px) 40vw, (max-width: 1279px) 27vw, 20vw`
- DPR-3 clause caps phones at `-800`. House siblings sit beside the WebP overlay in `images-webp/personal/house/`, because the build looks for siblings next to the resolved file. `verify.ps1` checks slots and siblings. Pre-wedding phones stay on `-800` deliberately. `images/brawlstars/`, `images/experience/NDU/` lack `-480`.
- Mobile: endpoints inside the viewport, larger card type, return-to-top hidden.
- The five timeline galleries have no photo controls (owner decision, 17 Oct 2026).
- Desktop crossfades on hover/keyboard focus, 1s per photo. Touch plays only the card nearest reading focus, 4s per photo. Reduced motion holds first photos.
- Cats, house, pre-wedding rotate five photos; crossfades overlap.
- Use animation longhands (shorthand resets `animation-delay`).
- On touch, later frames stay `display: none` until `warmGallery` marks the card warm, once it is on screen, ahead of activation and the first crossfade.
- Per-image `--focus-x`/`--focus-y`; no per-class `object-position`. Brawl Stars is full-bleed, 16/9 focused on mobile.
- Frames target 3:2: desktop `--image-col` widens as a card opens; mobile 2/1 folded, 3/2 open. Latte & Mocha and Code in the Community use `personal-event-card--upright` to keep a squarer frame (widening crops them harder).
- Measure before retuning ratios; the timeline column caps cards at ~451px, not `max-width`.
- Desktop photo sets a card-height floor, never a ceiling; frames absolutely positioned.
- Phones: exactly one card open. Desktop folds only read cards. Focus sticky by 48px.
- Phone handoffs change height atomically; never animate description height, body spacing, title margin or aspect ratio there (iPhone Safari momentum lurch).
- At reading speed, smooth only the adjacent outgoing/incoming pair (FLIP, clipped reveal in `personal-timeline.js`); fast flicks are instant. Opacity, transforms, clipping are safe.
- Desktop fold/focus resizes share one 320ms `cubic-bezier(0.2, 0.8, 0.2, 1)` across width, description height, spacing and photo `min-height`.
- Scope the `min-height` transition to `min-width: 737px`, never the `.personal-event-card__image` base rule (lurch below 736px `singleRail`).
- Fast desktop scroll snaps folds via `is-resnapping` (the `is-measuring` pattern); `personal-timeline.js` pins the focused card by one-frame correction; slow reads use native anchoring. Keep its `!singleRail`/`!reducedMotion` guards; never write scroll mid-fold.
- `data-category` is structural; no category colours or legend.

### Travel archive contracts

- Archive approved 18 Oct 2026: four columns at 1280px and wider, three at 981–1279px, two below, one at 20em or narrower.
- 4:3 photos, title-case serif headings, compact date, whole-card link; excerpts, category and CTA hidden. Never clamp destination names.
- `sizes="(max-width: 736px) 45vw, 800px"` in `travel.html`; every card image needs a `-480` sibling.
- Reveal: 480ms fade, 60ms stagger; `listing-effects.js` counts from the first card revealed that frame (not grid index), caps at two steps on phones, eight on desktop, and treats the viewport as a quarter taller.

- Travel journals update approved 18 Oct 2026: timeline and journals precede the destination map. The desktop/tablet timeline fits all ten evenly spaced stops without horizontal scrolling (18 Oct 2026); dates communicate elapsed time. Scenes are up to 136 × 91 px, scaling slightly on narrow tablets; mobile uses the labelled vertical rail with 112 × 75 px animated scenes, journal photos and two-line excerpts. Keep readable underlined journal links below the photos.
- Desktop journal preview follows hover, keyboard selection and the sequential tour. Adjacent chronological journals appear as smaller previews at wide widths; only their photos fade. Crossfade selections for 300ms in a shared grid row without shifting page height. Show-all remains available. Reduced motion switches instantly.
- Selected scenes use a translucent white highlight with a thin sage outline; keep the artwork clear instead of adding a broad green fill. Safari pointer activation explicitly focuses search retry and remembers the map opener so focus returns correctly when either control disappears.
- Opening geometry (18 Oct 2026): a Travel-only head bootstrap applies the approved layout classes before first paint; without JavaScript, retain the original static fallback. The build also inlines travel-seeds.js immediately after the inert template, selecting four photos before the delayed runtime can cause a layout shift. Do not defer these classes to the chronology runtime (causes a large cold-load shift on the compressed production site).
- Opening-load audit (18 Oct 2026): journal image sources stay inert until their visible desktop/mobile presentation is within 200px; retain noscript photos. Hidden previews must not download covers. The lower map teaser skips offscreen painting. Desktop tour controls provide persistent Pause/Resume plus Previous/Next/Replay; mobile hides these controls and repeats the visible scene nearest the viewport centre, following scrolling and stopping offscreen, in hidden tabs, or under reduced motion; mobile journal links retain a 12px floor and 44px targets.
- Desktop scenes run roughly 6–7 seconds, one at a time, with a 650ms travelling pulse and two-second end pause. Pointer exit resumes after the current scene finishes; stale pointer/keyboard focus must not strand the tour. Never auto-scroll the timeline.
- Approved artwork includes the restored Seoul palace gate with symmetrical doors, revised Eiffel/Sydney/Liberty structures, panda anatomy and complete Canton cabin orbit. Keep static SVGs and reduced-motion support.
- Discovery photographs retain their reviewed 1.6:1 ratio and focal-point positions. Compact captions and surrounding spacing rather than changing crops. Desktop search shares a row with larger map/journal shortcuts.
- Desktop map is capped at 54rem, with a 1200:520 viewport and modest upward opening offset to trim unused space while retaining destinations. No decorative atlas rings.

### Travel atlas contracts

- Zoom levels: trip regions → countries/states → journal stops.
- Choosing a trip fits its stops, draws one restrained route, mutes other destinations.
- Region pins and area dots enter their trip the same way, then open the first stop's card after the fly-to (phones tap dots).
- Fullscreen fit keeps the route above the bottom sheet (Australia).
- Status pill sits below the selector, not over it.
- Selecting an area/stop opens the shared detail card (photo from the linked section); only its link navigates.
- Phones: card is a bottom sheet above region controls; chosen marker stays clear of it.
- Zoom-out floor: desktop = cropped opening view; tablets may show the full map.
- Phones (≤520px): no inline world strip; a teaser opens a full-screen overlay (fit-to-height floor, region jump chips).
- Lower phone map teaser stays static (18 Oct 2026) to avoid competing with the top animated map shortcut; its overlay action is unchanged.
- Teaser art and coordinates share one 1200:624 surface at 188%, route centred, flush with the media top; keep endpoint margins.
- Action row: `Explore the map`, `10 trips · 12 regions`, one dot-line-chevron cue. Do not restore gesture instructions, the northeast arrow or a full-width CTA.
- Overlay fades before teardown; reduced motion (static poster) and leaving the phone breakpoint tear down immediately. Keep the breakpoint-aware rebase.
- Markers are lat/long, projected by the shared Natural Earth 1 code in `assets/js/travel-map.js`; never percentage coordinates or a raster map.
- Every map link resolves to a `trip-section-*` anchor.
- A city in several journals keeps separate labelled callouts.
- Region and destination labels share collision layout (Oct 2026): reserve visible pins first; never restore per-destination CSS offsets.
- Guangzhou label names the city, not China (vs Chengdu).
- Labels use rendered size and link centre, avoid controls and the open card, retry after font/map resize.
- Wider free-space search replaces the least-overlap fallback.
- Full view: destinations stay selectable in a scrollable list in the largest control-free vertical band; dots stay.
- `tools/tests/browser` blocks deployment on collisions, clipping or missing fallback entries.
- 12px floor (`max(12px, …rem)`, Oct 2026): status pill, destination labels, card step line, date, link, Prev/Next. Dot numbers and inline-map place labels keep canvas sizes.
- Phone stop dots: 1.15rem transparent halo = 44px target; `travel-map.js` reserves the dot, not the halo, for labels.
- Region dots (`role="button"`): `aria-controls="travel-map-detail-card"`, `aria-expanded` set by `setActiveTrip` (Oct 2026).
- Fullscreen drops `.travel-atlas__layout`'s `z-index: 1` (else the overlay hit-tests beneath archive cards).
- Dense labels may move and use leader lines; collisions never hide an in-view destination.
- Hyper-local attractions: regional popup links, not world-map dots.
- `images/travel/world-map.svg`: built by `tools/maps/generate-world-map.ps1` from Natural Earth, 0.25px Douglas–Peucker; regenerate on geography changes; keep the tolerance (10x zoom).

#### Photo search contracts

- Landing (approved 18 Oct 2026): "Wander through the journals.", field, four postcards (4 columns above 980px, 2 columns on tablets and phones), then map and archive. The opening includes two navigation previews; the desktop archive includes the compressed chronology.
- Field: drawn magnifier, `/` shortcut, Escape clears.
- Phones: fields, clear controls, all chips 3rem; input 16px (iOS zoom).
- Active query: `.travel-atlas__layout`, archive heading, `.travel-grid` get `hidden`; results in `#photo-results` under the field. Hide, never remove.
- Hidden atlas: zero height, full width, never `display: none` (`travel-map.js` measures it on resize/breakpoint).
- A query closes an open phone overlay via `[data-map-close]` (runs teardown, focus restore).
- `photo-search.js` is never a static `<script src>`.
- The 7 KB bootstrap `travel-discovery.js` picks four inert build-generated postcard seeds per visit, excluding the last batch (sessionStorage); only attached thumbnails load, visible ones eagerly.
- Module and index load on search, a discovery action or `?q=`; bootstrap queues the first action and owns `/`.
- Load failure: Try again, keep the pending action/query, announce "Photo search is unavailable right now.", keep map and archive.
- No JavaScript: four fallback postcards link to journal sections.
- `?q=` via `history.replaceState` (no entries; removed when empty), read on load.
- Hits link to `<trip slug>#photo=<id>` (opens the lightbox).
- Ranking:
  - Normalise: lowercase, strip accents/punctuation, one token per CJK character.
  - Best field score per term: exact tag 3; tag prefix 2; place/caption exact/prefix 2; alt/section title 1; trip label/year 1.
  - Damerau–Levenshtein 1 (terms ≥5 letters) = field prefix − 0.5, only if the term has no exact/prefix hit in the index.
  - Hidden-field best match (alt, section title, trip) counts half, once, in `termScore`, not the weight tables.
  - Rarity weight `log(1 + N / df)`, `df` = photos matching the term.
  - Full matches before partial; with both, a visually hidden `Full matches` heading leads.
  - Per tier, one run per trip: trips by best hit (newest on tie); inside by terms matched, score, journal order.
- Partial tiles only: muted `matches: panda` line, query order, `(in description)` for hidden-field matches.
- Mark highlights before HTML-escaping (no `<mark>` in `&#38;`).
- 120ms debounce; 48 hits, then Show more.
- One grid per tier: `repeat(auto-fill, minmax(170px, 1fr))`, 0.75rem gap, 2 columns phones, last row left-aligned.
- Do not bring back per-trip headings or sub-grids (Oct 2026).
- Legend `.photo-results__trips` when >1 trip has hits: chip per trip, run order, count, full year (`Japan · 2025`).
- Phones: legend is one scrolling edge-bleeding row with right fade.
- Pressed chip (`aria-pressed`) filters both tiers, adds `Japan · 2025 only` to status; press again or type to clear; focus returns to the chip.
- Tile: 4:3 thumbnail, trip chip bottom-left, `Animation` badge top-right (videos), caption (bold place · caption) clamped to two lines.
- Day/section pill removed on purpose; do not restore.
- Arrow keys follow the live column count.
- Suggestions: ≤6 tag chips (buttons, not a combobox) whose tag/synonym starts with the last term and has ≥1 photo; no counts.
- A chip replaces the longest matching phrase suffix ("Japan mount f" → "Japan mount fuji").
- `verify.ps1` warns, not fails, on photo-less tags; re-add pruned tags when a journal needs them.
- No hits: six most-used tags plus Clear search.
- Count sentence: form's `role="status"` paragraph, present before the module loads.
- Postcards: 24 plain themes in `journals/explore-themes.json`.
- Initial cards and Another mix use only visually reviewed pairs in `journals/explore-covers.json` (Oct 2026); tags alone never qualify a cover.
- Reviews lock thumbnail path, SHA-256, focal point, visible topics; builds fail if a reviewed thumbnail changes or topic stops matching.
- Review the exact 8:5 crop before adding/updating a record.
- Another mix: reviewed topics only, balanced facets, excludes last batch; search keeps the full vocabulary.
- Another mix refresh (approved 18 Oct 2026): keep the current four postcards while visible replacements decode, show Loading photos on the focused button, then crossfade once for 220ms (instant under reduced motion). Below-fold replacements stay lazy. Failure/timeout keeps the old batch and permits retry; search, focusing a postcard, or another discovery action cancels stale replacement work. Commit session history only with the displayed batch.
- Pool: 802 covers across 293 topics.
- Bubble tea ≠ tea; animal statues and model food are sculpture/miniature, not animals or meals.
- Label Browse photos; plain topic names, place · year beneath; no Photo: prefix, slogans or invented emotions.
- Keep 24 inert starter cards and four attached images (no extra opening download).
- Index v2 cover tuples: photo position, tag positions, optional focal x/y (default 50/50); group by topic once on decode.
- Initial cards: distinct approved covers; shuffles also avoid duplicate photos, prefer trip variety.
- A postcard runs the search and focuses the first result without the phone keyboard.
- Surprise me was removed by explicit owner decision on 18 Oct 2026. Do not restore its button, inline viewer, random-moment history, or runtime. Discovery is now the four topic postcards and Another mix.
- Glyphs: ↻ on Another mix; none on postcards.
- Search hides postcards; clearing restores them.
- Recent: four distinct successful queries, localStorage, validated, with Clear.
- IME: wait for committed text.
- Pending input inerts old results; stale paging/filter actions never mix queries.
- Collapsed map/archive are inert during search.
- Announce index failures even with an empty field.
- Run `node --test tools/tests/photo-search.test.cjs` after building; CI also covers mobile/desktop discovery, phrase suggestions, paging, filtering, keyboard, deep links, failures, URL restore, IME.

- Budgets: `photo-search.js` 30 KB (26 → 30, 18 Oct 2026, for decoded swaps and recovery), `travel-search.css` 19 KB ceiling (retained after removing Surprise me on 18 Oct 2026); index ~520 KB of 560 KB (from 480 KB, Oct 2026, for descriptive alts); index lazy.
- Motion: shared tokens, immediate under reduced motion.

#### Discovery loading and recovery (Oct 2026)

- Bootstrap blocks native reload on cold submit and records IME composition; startup and index wait for compositionend before rendering.
- Atlas loads within 120px of the viewport or on focus/pointer; an early activation replays once.
- "Choose a topic to find matching photos." shows only with enhanced search.
- Postcard images use existing 480/original and optional 800 siblings; index `variants` digit per photo: 0 thumbnail, 1 480/original, 2 also 800.
- Video posters and custom crops unchanged.
- Build checks candidate dimensions; browser measures slots, resizes `sizes`.

### Dead ends and hidden dependencies

- **No SEO, analytics or resume-PDF work (owner decision, Jul 2026):** no og tags, structured data or tracking. The League "1 year internship" note is intentional.
- **Declined from the Oct 2026 site critique:** every item is in [Owner preferences](#owner-preferences); do not propose them again.
- **Build size: measured, no easy win (do not retry).**
  - JPEGs are q40–42; recompressing is break-even or worse (1600px cap enlarges them).
  - JPEG→WebP refuted (net growth); only the 9 banners (q82) have headroom.
  - Sep 2026 wins were selection: `20vw` slot with `-480` tiles, deferred animation posters, simplified world map, circus globe WebP → MP4.
- **History was squashed to one commit on 22 Sep 2026.** Partial `git filter-repo` rewrites missed the ~350 MB floor; only a squash reached it.
  - Pre-squash history (all refs): `C:/Users/nicho/Projects/web-before-squash.bundle`; restore with `git clone` on it, else deletable.
  - Do not track `dist/` or GIFs again; see [Build and deployment](#build-and-deployment).
- **`.gitattributes` pins text to LF; do not remove it (Jul 2026).** CI's `core.autocrlf=true` CRLF pushed JS/CSS past `verify.ps1` budgets on CI only, silently stalling deploys. Budgets assume LF.
- **`travel-map-page.css` sits under 1 KB below its 49 KB (50,176 LF bytes) `verify.ps1` budget (Oct 2026).**
  - No large CSS on the travel/atlas route.
  - If needed, bump the budget with a dated rationale comment (like the 40 → 42 note); never strip `custom.css` comments to save bytes.
- **Keep travel JavaScript deferred (Oct 2026).** Initial travel bundle loads `travel-discovery.js`, not the atlas; 80 KB initial ceiling; `travel-discovery.js` 7 KB (submit interception and IME state must precede the module); atlas 64 KB, near viewport; search 30 KB, on interaction. Do not restore eager atlas or search scripts.
- **`.travel-gallery__item--tall` looks unused, isn't.** It pairs with the `guangzhou-gallery__brick--tall` compat class (the only one in markup); SKILL.md mandates the pair; removing it unstyles future journals.

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

`assets/fonts/source-sans-pro-700-latin.woff2` is a static 700 instance of Source Sans 3 VF, matching the 900 cut's "latin" range and features:

```powershell
python -I tools/fonts/subset-source-sans.py <path-to-SourceSans3VF-Upright> --weight 700 --output assets/fonts/source-sans-pro-700-latin.woff2
```

- Source: <https://github.com/adobe-fonts/source-sans/releases> (`VAR/SourceSans3VF-Upright.ttf`); not tracked.
- `verify.ps1` caps it at 20 KB so the variable font never ships.
- Keep its `main.css` overrides when regenerating: `ascent-override: 98.4%; descent-override: 27.3%; line-gap-override: 0%`.
- `main.css` declares a size-adjusted Arial fallback so cold loads do not reflow headings.

## Vendor theme

`vendor/massively/` is uncompiled upstream Massively Sass, for reference only; edits there do not affect the site, whose theme CSS is `assets/css/main.css`. Add any Sass workflow explicitly.
