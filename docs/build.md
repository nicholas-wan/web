# Build and deployment

The root HTML files remain legacy content sources. `tools/site/build.ps1` generates a clean static copy in `dist/` with shared navigation, footer, metadata, scripts, and image-loading attributes.

Travel journals use `partials/travel-journal.html` for their shared shell. Their order, labels, metadata, and source files live in `journals/manifest.json`; new journals should be content-only fragments based on `journals/_template.html`.

## Commands

Run the complete CI-equivalent workflow:

```powershell
.\tools\site.ps1 check
```

Builds are incremental by default. Use a clean build after removing files or when the output must be reset:

```powershell
.\tools\site.ps1 build
.\tools\site.ps1 build -Clean
.\tools\site.ps1 verify
```

Incremental builds retain unchanged published images and cache source-image dimensions in the ignored `.cache/` directory. Clean builds reset `dist/` but may reuse valid dimension metadata. `-Output` must name a `dist*` folder directly inside the repository (for example `dist` or `dist-test`); anything else is refused because `-Clean` empties it. Incremental builds mirror `assets/fonts` and `assets/icons`, so a file removed from source also leaves `dist`.

The build fails when generated HTML, CSS, script or manifest output references an `images/` path that exists in neither `images/` nor `images-webp/`. That scan is the only check covering CSS `url()`, script strings and `data-poster`; `verify.ps1` checks HTML attributes and also fails on any `<img>` without an `alt` attribute.

The build adds intrinsic image dimensions, native lazy loading, first-image priority, responsive `srcset` markup, and the controlled `images-webp/` overlay. Source originals remain in `images/`; only referenced runtime assets are copied to `dist/`, together with the root files `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest` and `favicon.ico` (Chromium requests `/favicon.ico` on every page regardless of the declared PNG icon).

Journal banners advertise their measured layout width as `sizes`: `100vw` on phones, `calc(100vw - 176px)` up to 1024px, `1024px` up to 1680px and `1366px` above, where the 16pt root widens the column. They add a `-1200` tier (`make-responsive-variants.py --banners-only`, q82 JPEG / q80 WebP, kept only when it saves a fifth of the bytes): a DPR-3 phone needs ~1170 device pixels, so without it phones skipped `-800` and fetched the 1470–1920px original, up to 463 KB for the LCP image. Seoul and Guangzhou are excluded: their 2:1 artwork is cover-cropped into the ~1.58:1 phone box, which needs ~1364 device pixels.

Journal gallery tiles advertise a `20vw` desktop `sizes` slot (measured five-up tile widths, 129–325px between 737px and 1920px viewports) so 1x screens select `-480` and 2x screens `-800`; non-journal galleries keep the `800px` slot. Journal animations have their `poster` renamed to `data-poster`, because a poster attribute downloads at page load even with `preload="none"`; `gallery.js` attaches it as the animation nears the viewport and `travel-map.js` reads either attribute for the atlas detail card.

`assets/css/custom.css` remains the authored source of truth. The build extracts marker-bounded route blocks into `travel-map-page.css`, `travel-journal.css`, `experience-page.css`, `personal-page.css`, and `skills-page.css`. Generated pages load only their matching route bundle; shared rules remain in the generated `custom.css`.

`assets/js/main.js` also remains the authored theme source. Its shared shell is dependency-free and owns navigation, focus management, the page reveal, and return-to-top behavior. The build extracts its marked canvas block into `canvas-background.js` for the homepage only. Homepage interactions stay in `game.js`; Skills and Travel use `listing-effects.js`, and journals use `journal-progress.js`. Verification enforces route ownership, rejects the retired jQuery/theme-helper runtime, and caps per-page JavaScript payloads.

Preview `dist/` with `node tools/preview-server.mjs [port]`, which the `.claude/launch.json` configuration runs on port 4321. It resolves extensionless URLs such as `/experience` to their `.html` files the way GitHub Pages does; a plain static server such as `python -m http.server` does not, so every navigation link 404s there.

## Theme stylesheet

`assets/css/main.css` is the Massively theme stylesheet with its unused rules removed (Sep 2026: 848 rules down to 366, 79 KB to 46 KB, about 10 KB to 7 KB gzipped). A rule was removed only when a class, id or element in its selector exists nowhere on the built site: not in the generated HTML, not in any script string literal, and not in the DOM captured after scripts ran at desktop, tablet and phone widths in several interaction states. Base styles for plain content elements that journals may use later (`h4`–`h6`, `em`, `b`, `ol`, `blockquote`, `code`, `pre`, `hr`, `sub`, `sup`, `mark`, tables, `dl`, `iframe`) were kept on purpose; form controls and the theme's grid, box, feature and pagination components were not, so reintroducing those needs their rules restored from `vendor/massively/`.

The tooling lives in `tools/css/`: `computed-style-check.py` hashes the computed style and box of every element on every page and state (needs `pip install playwright` and Microsoft Edge), and `prune-main-css.py` performs the removal from that baseline. The prune was accepted after a side-by-side run of that check (17 pages, 3 viewports, 172 states, ~123,000 elements) found no differences other than the timing noise its old-versus-old control run also shows: mid-crossfade photo opacities on the personal timeline and the phone atlas teaser's replaying animation.

## Deployment

GitHub Pages does not execute PowerShell when publishing directly from a branch. `.github/workflows/pages.yml` checks out `master`, runs `tools/site.ps1 check`, and deploys the resulting `dist/` artifact. The build step runs under Windows PowerShell 5.1 (`shell: powershell`), the same engine as every local check, so a local `site.ps1 check` pass is representative of CI.

Before uploading the Pages artifact, CI installs the pinned Playwright dependency in `tools/tests/browser` and runs its Chromium geometry suite against `dist/`. It checks all ten trips at phone, tablet, desktop and landscape sizes, including zoom, selected-place cards, reopening and orientation changes. It also checks archive column counts, whole-card phone navigation, and search exploration, relevance, keyboard/IME interactions, error states and photo deep links. The search and lightbox Node regression suites run before the browser suite. A failure blocks deployment and uploads screenshots and traces. For a local terminal run after `site.ps1 check`: `cd tools/tests/browser`, `npm ci`, `npx playwright install chromium`, then `npm test`. Interactive browser audits may reuse the read-only `geometry.cjs` function.

The Pages source must remain **GitHub Actions**. The custom domain is configured in Pages settings; the committed `CNAME` is copied into the artifact but does not replace that setting.

## Asset tooling

Active image tools live under `tools/images/`:

```powershell
python .\tools\images\make-responsive-variants.py
python .\tools\images\convert-curated-webp.py
```

`make-responsive-variants.py` emits the controlled `-480` and `-800` JPEG set, gives every journal gallery source with an `-800` sibling a `-480` one (the 1x desktop source for the `20vw` slot), and closes responsive-coverage gaps for journal JPEGs and WebPs when the result is smaller; animated WebPs are excluded. Animations ship as an H.264 MP4 tile plus a static `-poster.webp`; do not add animated WebP or GIF tiles. `convert-curated-webp.py` regenerates the selected deterministic WebP overlay. `make-touch-icons.py` regenerates the home-screen icons (`images/apple-touch-icon.png`, `icon-192.png` and `icon-512.png`) from the owner-approved dark-field "NW" monogram polygons, rendered at 8x supersample and downscaled for clean edges.

Editing an existing photo (Oct 2026): the tool skips a variant that already exists, so delete the edited photo's `-480`/`-800`/`-1200` siblings first; `--banners-only` restores the `-1200` banner tier. It also re-encodes the full `-800` set on every run, so afterwards restore (`git checkout --`) every changed sibling whose source you did not edit, or the commit churns several hundred unchanged images. Journal and gallery tiles are fixed-shape `object-fit: cover` boxes (4:3, or the two-row tall brick), so a pixel crop never changes the grid layout but does move what shows inside the tile; check the tile at desktop and phone widths, and prefer the per-image `--focus-x`/`--focus-y` when only the framing is wrong. Video posters are re-grabbed from the tile's own MP4 at the poster's existing dimensions.

The map generator lives at `tools/maps/generate-world-map.ps1` and downloads Natural Earth data before replacing `images/travel/world-map.svg`. It simplifies every ring with Douglas–Peucker at `-Tolerance 0.25` canvas pixels (45,965 points and 218 KB gzipped down to ~17,500 points and ~90 KB) while keeping every feature, including sub-pixel islets.

The pre-wedding wordmark font ships as a 12 KB WOFF2 subset of `tools/fonts/josephsophia.otf`; `tools/fonts/README.md` has the regeneration command, which must list every character the wordmark uses.

The travel photo search reads `assets/data/photo-index.json`, which the build generates from the journals and two tracked sidecars (Oct 2026). `journals/tag-vocabulary.json` is the controlled vocabulary: each tag has a facet (place, subject, activity, food, people, animal, season, weather, time, event), search synonyms and, for places, an optional `parent` (city, region, country, continent). `journals/photo-tags.json` maps each gallery tile id to its tags. The id is the tile's path under `images/travel/` without the extension (`2025_japan/day14_hakone/fuji1`), so a JPEG-to-WebP swap keeps it; animations keep `.mp4` (`2019_sv/SF_sutro.mp4`), because some share a base name with a still. The index lists every tile in journal order with its section anchor (`trip-section-N`), caption, dimensions, `-480` thumb (or poster) and tags, plus every vocabulary tag with its photo count. The travel page's `data-search-index` attribute carries its content-hashed URL; `verify.ps1` checks it tile by tile against the generated journals and holds it to a 480 KB budget (465 KB raw at 898 photos).

```powershell
python -I .\tools\photos\seed_photo_tags.py
```

`seed_photo_tags.py` (stdlib only) seeds tags from the vocabulary: names and synonyms found as whole words in each tile's caption title and text, alt text, and image folder and file name, with the section heading and a per-trip fallback supplying the place when the tile names none, and parents added for every place. Its `TRIPS` table holds per-trip facts the captions do not repeat (season from the journal dates, honeymoon), and `STOP_PHRASES` keeps false matches out (New York is not York, WA). It merges rather than overwrites: hand-added tags survive reruns, ids whose tile has gone are kept and reported for re-keying, and a second run changes nothing. When adding a journal, add its `TRIPS` row and any new places (with `parent`) or terms to the vocabulary, run the script, then hand-correct the new entries in `photo-tags.json`; the check fails while any tile has no tags or a tag outside the vocabulary.

The travel landing’s plain topic labels live in `journals/explore-themes.json`; its approved cover pool lives in `journals/explore-covers.json`. Review every topic against the actual thumbnail at the card’s 8:5 aspect ratio, not just the full photo or its search tags. A review records the photo id, thumbnail path, SHA-256 digest, focal point (0–100 percent), and visible topics. The build rejects missing photos, animations, duplicate ids, unknown topic assignments and changed thumbnail files; verification independently checks the published images and initial seed assignments. After changing a reviewed image, inspect its crop again before updating the digest. The generated photo index includes only the compact approved ids/topics/crops, without the review hashes. Both the inert 24-card template and Another mix use this pool, so a new search tag cannot silently become a postcard cover. Six no-JavaScript fallback cards link to journal sections. The bootstrap selects six initial cards per visit, and the full index stays lazy. All postcards show place · year without a Photo: prefix.

The seeds only name places and caption words. The subject, animal, food, activity, people, weather and time tags were written in Oct 2026 by Claude agents that looked at every photo (and one extracted frame per animation) and chose from the vocabulary; Nicholas declined to use the Anthropic API for this, so the process is agent sessions, not a script. To repeat it for a new journal: build once so `dist/assets/data/photo-index.json` exists, generate a manifest per chunk of about 60 tiles (id, image to view, caption context, seed tags), have each agent write `tools/photos/work/tags/<manifest>.json` and check it with `python -I tools/photos/validate_tags.py <file>` (vocabulary membership, 3 to 14 tags, every manifest id present), then merge the files into `photo-tags.json`. `tools/photos/work/` is ignored by git; only the merged sidecar ships. Words the agents wanted but could not use are worth adding to the vocabulary before the next pass.

`tools/legacy/` contains destructive or one-time migration utilities retained only for provenance. Do not run them during normal builds. In particular, `cap-original-images.py` has already been run; re-encoding those originals was measured and rejected.

## Source-of-truth rules

- Edit source files, never `dist/`.
- `tools/site/build.ps1` owns the generated document head and cache-busting versions.
- `tools/site/verify.ps1` independently checks generated content and private-artifact exclusions.
- `images-webp/` stays tracked so CI does not depend on Pillow or nondeterministic recompression.
