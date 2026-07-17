# Project context and preserved behavior

## Workflow and Git safety

1. Work in `C:\Users\nicho\Desktop\web` on `master` unless the user specifies another branch.
2. Inspect `git status --short` before editing.
3. Make the smallest coherent change and preserve existing links.
4. Preserve unrelated and concurrent changes. Make source changes outside `dist/`; treat `dist/` as generated output.
5. After validation, commit and push completed task changes to `master` by default.
6. Nicholas has given standing authorization to push to `master` in this repository. Do not ask for confirmation before pushing; push as the final step of a completed task.
7. Honor an explicit instruction to keep changes local. Before pushing, reconcile the remote safely, stage only task-scoped files, and inspect the staged diff.

## Architecture

- Static HTML site using the Massively theme. Published CSS lives in `assets/css/`; the uncompiled upstream Sass reference lives in `vendor/massively/sass/`.
- Root HTML is legacy source. `tools/site/build.ps1` incrementally generates `dist/`; use `-Clean` for a full rebuild. Verify with `tools/site/verify.ps1`, or run both through `tools/site.ps1 check`.
- Use `.github/workflows/pages.yml` as the CI reference; it runs `tools/site.ps1 check` and deploys `dist/` to GitHub Pages.
- Expect the build to produce 17 HTML pages and publish referenced images.
- Keep shared behavior in `assets/css/custom.css` and `assets/js/`.
- Register travel journals in `journals/manifest.json` and render content fragments through `partials/travel-journal.html`.

## Site-wide conventions

- Preserve existing URLs, navigation, responsive layout, and visual style. Keep HTML semantic, UTF-8, accessible, and secure.
- Use meaningful image `alt` text, `loading="lazy"` below the fold, intrinsic dimensions where compatible, optimized formats, and `rel="noopener noreferrer"` for new-tab links.
- Treat `.content-image` masonry galleries specially: do not add fixed height/width attributes that can stretch tiles.
- Keep private files such as the transcript protected.
- `skills.html` is a public page about Nicholas's education and capabilities. It is unrelated to agent instructions despite the name.
- The prewed hero wordmark's DOM text looks like " icholayingxia " but is intentional: it renders through private-use glyphs (U+E03E/U+E01C/U+E03F) in the Wedding font. Never "correct" the visible text; the `role="img" aria-label="Nicholas and Yingxian"` on both paragraphs carries the accessible name.
- The lightbox and the nav-panel bottom sheet are `aria-modal` dialogs with full focus management (focus moves in on open, Tab is trapped, focus returns to the trigger on close) — preserve this when touching `gallery.js` or `main.js`.
- `REVIEW-PROGRESS.md` in the repo root tracks the adversarial-review fix backlog; update it when completing items from that list, and remove it when the list is done.

## Homepage and scramble contract

- Preserve the scroll animation and background canvas.
- The hero is the name, one scrambling headline sentence, a small uppercase support line, and the CTA. Headline: `I build agents that plan threat hunts in hours, not days.` Support line: `Product direction · DSTA` (owner shortened from the full agency name, July 2026 — it was too long). There is no skills triad in the hero; skills live on `/skills`. A three-line no-scramble hero was tried in July 2026 and rejected as too text-heavy — don't reintroduce paragraph-style hero copy. The headline is the owner's (product lead) copy decision — propose, don't unilaterally rewrite.
- The site has exactly two scrambles (owner decision, July 2026): the homepage headline and the experience page's Threat Hunting "Planning reduced from days to hours" Outcome row. Do not add a scramble anywhere else, and do not remove either one as a "one moment" cleanup. Both are driven by the same generic engine in `assets/js/scramble-reveal.js` (`data-scramble-list` / `data-scramble-row` / `data-scramble-source`, one list per page); the experience outcome resolves into the dark card's `#28d7c5` accent on completion. Each row keeps its opening words as real text from the first frame via `data-scramble-lead` (a word count: homepage `2` → "I build", experience `1` → "Planning"; owner decision, July 2026) — the resolve step scales to the remaining characters so the duration cap still holds.
- The headline scramble fires via IntersectionObserver (0.6 threshold — in view at load, so effectively immediately), plays once, never replays, keeps word boundaries fixed, and is maintained in `assets/js/scramble-reveal.js`. Its duration is capped at ~`TARGET_DURATION_MS` (1200ms) regardless of copy length — the resolve step scales with character count. Never let the reveal run multiple seconds; a 3.3s scramble was rejected in July 2026 as too slow. Every frame renders FULL LENGTH (unresolved characters as noise, never blanks): blank tails collapse at line ends and make the centered, wrapping headline re-centre every tick — a left-right-left drift rejected in July 2026. Noise is width-matched via `WIDTH_POOLS` (each lowercase letter scrambles within its own width class; capitals/punctuation/spaces stay fixed), which holds per-line drift to ~3-5px. The summary uses an explicit `width` (44rem desktop), NOT `max-width` — as a centered flex child it otherwise shrink-wraps to exactly the resolved sentence's width, giving noise frames zero slack and reintroducing the drift. Verified by rendering random frames and measuring line rects at 375px and 1280px. Real text ships in the DOM and keeps the layout (the headline wraps naturally — no `white-space: pre`); JS paints only an aria-hidden overlay, so the copy is visible before enhancement, without JS, and under reduced motion (which skips the scramble entirely).
- Stacking trap: the theme's load fade (`#wrapper.fade-in::before`) is a fixed full-viewport black overlay that paints ABOVE `#intro` at equal z-index (`#wrapper` is later in the DOM). `body.page-home #intro { z-index: 2 }` lifts the hero above it so the scramble is visible from first paint instead of completing behind the fade. Any hero entrance effect must account for this overlay: it hides everything until ~1.85s after window load.
- Style the selected-work CTA as dark and translucent against the black intro; hover changes colour or opacity only, never font-weight.
- About scene spacing is a deliberate rhythm, not leftover space. Mobile (≤736px): bottom-anchored cluster — all elastic space above the "About me" heading, then fixed 1rem heading→photo, 1rem photo→text, 0.75rem h3→paragraph, 3vh below the paragraph. Desktop: the whole cluster (heading + row) is vertically centered with equal space above and below, 2.25rem heading→row, 3rem photo↔text. The photo's low mobile rest position is load-bearing — game.js's mobile swipe scrub derives progress from the photo's settled top, so never vertically center or raise the mobile photo. The scene's zero-margins are pinned against main.css's ID-weighted rules (e.g. `#main > .post header.major h2`) — keep the out-ranking selectors in custom.css.

## Travel journal contract

- Use Guangzhou as the compact rendered reference.
- Read `journals/README.md` and the complete `journals/_template.html` before adding or structurally changing a journal.
- Store journals as content fragments with `contentOnly: true`; let the build supply the document shell, navigation, footer, styles, and scripts. Do not duplicate the shell, trip tabs, previous/next pager, footer, stylesheets, or scripts in a journal source. Legacy root journal pages remain supported while they are migrated.
- Preserve `data-journal-template="v2"` and the four shell tokens in `partials/travel-journal.html`: `{{MAIN_ATTRIBUTES}}`, `{{TRIP_NAVIGATION}}`, `{{JOURNAL_CONTENT}}`, and `{{TRIP_PAGINATION}}`.
- Pair generic `travel-*` classes with the existing `guangzhou-*` compatibility classes.
- Format journal header ranges as `D Month YYYY &ndash; D Month YYYY`. If exact days are unavailable, use `Month YYYY &ndash; Month YYYY`. Always use four-digit years.

### Content structure

- Build a hero with `travel-journal__hero guangzhou-journal__hero`, a full-year `.date`, lede, and `travel-journal__hero-image guangzhou-journal__hero-image`. Add an HTML trip title only when the banner artwork does not already contain it. Mark the image `.journal-banner` and provide descriptive alt text.
- Build each day with `travel-journal__day travel-journal__day--compact guangzhou-day guangzhou-day--compact` and one meaningful `h2`. Keep heading order stable because the build generates section IDs and map anchors from it.
- Keep headings concise and rely on trip grouping for established place names. Include prose only when it adds observations, opinions, or narrative beyond the route.
- Build routes with `travel-journal__route guangzhou-day__route`. For collapsible routes, add `guangzhou-day__route--collapsible` and a `travel-route__more guangzhou-route__more` button. Represent every stop as nested `span` and `small` name/area text separated by arrow `i` elements.
- Build photo rows with `travel-gallery travel-gallery--compact masonry mason4`. Preserve the `brick lazyload container`, `.content`, `.content-overlay`, `.content-image`, and `.content-details` hierarchy.
- Keep desktop tiles in an even 4:3 grid with focal-point overrides for faces. Never distort an image to fill a tile.
- Use `travel-gallery__item--tall guangzhou-gallery__brick--tall` for vertical collages that span two desktop rows and return to a standard card on mobile.
- Use `--hero-focus-x` / `--hero-focus-y` for banners and `--focus-x` / `--focus-y` for gallery images. Review crops at desktop and mobile sizes with people and animal heads fully visible.
- Provide useful alt text and concise captions. Use a fixed-height mobile caption rail. Keep swipe cues in a dedicated row inside `.journal-gallery-shell`, above the photos, and hide them without changing layout after horizontal scrolling. The mobile cue must stay in normal document flow with positive spacing so it never overlays a photo, then collapse after the visitor swipes.
- When an image needs a mobile-specific crop or subject, use a semantic `<picture>` source at `max-width: 600px`; keep the desktop image as the fallback and verify both crops visually.
- Journal section links must use the shared bounded landing correction in `assets/js/travel-nav.js`. It applies and observes the live sticky toolbar state before measuring, corrects late toolbar/image/font layout shifts, and stops on visitor input. Do not replace it with a hard-coded pixel jump. travel-nav.js also publishes the toolbar's measured height as `--travel-nav-offset`, which `scroll-margin-top` on `trip-section-*` consumes so native hash jumps clear the bar even when it wraps to several rows (USA/Canada reaches ~5 rows at desktop); the rem values in custom.css are the no-JS fallbacks.

### Travel atlas

- Keep the atlas progressive: the unzoomed map shows broad trip regions, 2.2x zoom shows countries/states, and 4.2x zoom shows individual journal stops.
- The zoom-out floor is the opening view, not the raw world map (owner decision, July 2026): desktop floors at the 1.12 crop that hides the empty polar margins; narrower viewports floor at 1. The floor re-bases when the 981px breakpoint changes.
- Maintain the semantic points in `assets/js/travel-map.js`. Store marker positions as real latitude/longitude and project them with the shared Natural Earth 1 formula. Every generated link must resolve to the first matching `trip-section-*` anchor.
- When the same city appears in multiple journals, retain separately labelled callouts so each journal remains reachable.
- `images/travel/world-map.svg` is generated by `tools/maps/generate-world-map.ps1` from Natural Earth's public-domain admin-0 and admin-1 data. Regenerate it when changing map geography. Do not substitute a raster map or hand-adjust percentage coordinates; both lose accuracy when zoomed.
- Only add points that are meaningful at world-map scale. Keep hyper-local attractions such as individual Guangzhou sights inside the regional popup links rather than stacking them as coincident map dots.
- Dense destinations such as North Rhine-Westphalia should retain their true coordinates. The runtime callout layout may move labels through progressively wider candidate positions, but every visible dot should keep a readable label connected by a thin leader line. Only labels for points outside the current viewport may be suppressed; do not silently hide an in-view destination because of a collision.
- Keep map-scale Australia points at Victoria, New South Wales, Melbourne, Phillip Island, Great Ocean Road, Werribee, Grampians, Sydney, Blue Mountains, and Wollongong. Hyper-local Sydney stops such as Taronga Zoo and SEA LIFE belong in the New South Wales popup links, where they should target their exact journal sections.

### Registration and assets

- Add each journal to `journals/manifest.json` in order with `order`, `slug`, `label`, `source`, `contentOnly: true`, `mainClass`, `title`, `description`, and `ogImage`.
- Name sources `journals/travel_YYYY_destination.html`. Let the build add `homepage travel-journal travel-journal--compact guangzhou-journal`; reserve `mainClass` for page-specific extensions.
- Add journal and destination links to `assets/js/travel-map.js`.
- Add `-480.jpg` and `-800.jpg` variants for large JPEGs when useful; the build supplies image dimensions, responsive sources, loading priority, and lazy loading.
- Preserve Australia's ten compact horizontal galleries and route controls. Present its Melbourne/Sydney banner through `travel-journal__hero-image` with the complete mobile composition visible.
- After changing any shared CSS or script, increment its cache-busting version in `tools/site/build.ps1` and update the corresponding verification assertions together. The build script is the sole source of truth for `?v=` numbers; do not copy the current values into documentation.

## Images and build size (measured July 2026 — do not redo)

- Read `docs/build.md` before any image or size work. The pipeline already exists:
  `tools/legacy/cap-original-images.py` capped originals to 1600px (already run — effective quality
  ~q40–42, which is why they cannot be usefully shrunk), `tools/images/make-responsive-variants.py`
  emits the `-480`/`-800` JPEGs, and `tools/images/convert-curated-webp.py` regenerates the curated
  WebP set in `images-webp/`.
- The build's `$webpMap` rewrites `images/<p>.jpg` references to `.webp` whenever
  `images-webp/<p>.webp` exists; converted originals may then be deleted — the build
  falls back to `images-webp/` for intrinsic dimensions.
- Measured dead ends (numbers in `docs/review-progress.md` — do not retry): re-capping or
  recompressing the JPEGs (files grow or quality drops); bulk JPEG→WebP transcode
  (19% not 54% — SSIM against a lossy source rewards reproducing its artifacts, and
  104 of 495 files came out bigger); deleting tracked images to shrink a clone (blobs
  stay in history); a `filter-branch` purge of `dist/` history (test clone still 2.4GB;
  abandoned, never force-pushed). If a history rewrite is ever retried, use
  `git filter-repo` and require a measurably smaller test clone before any force-push.
- `dist/` is generated and untracked (`.gitignore`); CI builds and deploys it from
  source on every push. Build locally with `tools/site.ps1 check` to preview and verify.

## Tooling gotchas (hard-won)

- The build REWRITES each page's `<head>`. Head edits in root HTML are silently
  discarded — make them in `tools/site/build.ps1` (the FontAwesome async preload lives there).
  Always verify against the built page in `dist/`, never the source.
- `System.Drawing` cannot decode WebP; `Get-WebpDimensions` in `tools/site/build.ps1` parses
  the RIFF header instead (VP8/VP8L/VP8X, validated against Pillow 161/161). PowerShell
  `-shl` returns the type of its LEFT operand — `[byte]4 -shl 8` is `0`; cast `[int]`
  first.
- `tools/site/verify.ps1` pins content facts (trip dates, labels, counts). Changing a fact
  means moving its assertion in the same commit — a failure there is the guard working.
- The Browser pane renders as a hidden document: screenshots time out, rAF and
  IntersectionObserver never fire, and `content-visibility: auto` never skips (bugs in
  that area cannot reproduce there). Use headless Chrome (`--headless=new`,
  `--virtual-time-budget`, `--force-prefers-reduced-motion` for reduced-motion checks)
  and same-origin iframes for real-viewport measurement.
- The mobile root font is 14.67px, so rem-based tap targets miss: `3rem` = 44px (the
  standard used by `#navPanelToggle` and the lightbox); `2.25rem`/`2.75rem` land at
  33/40.3px.
- `AGENTS.md` is the concise repository entry point. Keep durable rules there and detailed
  site behavior here; do not duplicate volatile values between the two files.

## Validation

For a clean worktree, run the CI-equivalent checks:

```powershell
.\tools\site.ps1 check
```

When unrelated `dist/` changes exist, build to a temporary output directory and adapt verification to that output. Remove the verified temporary directory afterward.

Run `git diff --check` and syntax checks for edited scripts. Keep `tools/site/verify.ps1` aligned with intentional behavior and markup changes.

Then check the rendered result, not only the source:

1. Inspect the changed page at desktop and mobile widths for sizing, cropping, spacing, overflow, navigation, and loading regressions.
2. After Pages finishes deploying, check the live URL with a cache-busting query and confirm computed layout, images, and styles match `dist/`.
3. Do not claim completion until rendered checks pass. State clearly if a visual check is unavailable.

Documentation-only changes have no rendered surface; skip the build and rendered checks rather than reporting them as passing.
