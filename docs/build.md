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

Incremental builds retain unchanged published images and cache source-image dimensions in the ignored `.cache/` directory. Clean builds reset `dist/` but may reuse valid dimension metadata.

The build adds intrinsic image dimensions, native lazy loading, first-image priority, responsive `srcset` markup, and the controlled `images-webp/` overlay. Source originals remain in `images/`; only referenced runtime assets are copied to `dist/`.

Journal gallery tiles advertise a `20vw` desktop `sizes` slot (measured five-up tile widths, 129–325px between 737px and 1920px viewports) so 1x screens select `-480` and 2x screens `-800`; non-journal galleries keep the `800px` slot. Journal animations have their `poster` renamed to `data-poster`, because a poster attribute downloads at page load even with `preload="none"`; `gallery.js` attaches it as the animation nears the viewport and `travel-map.js` reads either attribute for the atlas detail card.

`assets/css/custom.css` remains the authored source of truth. The build extracts marker-bounded route blocks into `travel-map-page.css`, `travel-journal.css`, `experience-page.css`, `personal-page.css`, and `skills-page.css`. Generated pages load only their matching route bundle; shared rules remain in the generated `custom.css`.

`assets/js/main.js` also remains the authored theme source. Its shared shell is dependency-free and owns navigation, focus management, the page reveal, optional parallax, and return-to-top behavior. The build extracts its marked canvas block into `canvas-background.js` for the homepage only. Homepage interactions stay in `game.js`; Skills and Travel use `listing-effects.js`, and journals use `journal-progress.js`. Verification enforces route ownership, rejects the retired jQuery/theme-helper runtime, and caps per-page JavaScript payloads.

Preview `dist/` with any static web server. The `.claude/launch.json` configuration serves it on port 4321.

## Deployment

GitHub Pages does not execute PowerShell when publishing directly from a branch. `.github/workflows/pages.yml` checks out `master`, runs `tools/site.ps1 check`, and deploys the resulting `dist/` artifact.

The Pages source must remain **GitHub Actions**. The custom domain is configured in Pages settings; the committed `CNAME` is copied into the artifact but does not replace that setting.

## Asset tooling

Active image tools live under `tools/images/`:

```powershell
python .\tools\images\make-responsive-variants.py
python .\tools\images\convert-curated-webp.py
```

`make-responsive-variants.py` emits the controlled `-480` and `-800` JPEG set, gives every journal gallery source with an `-800` sibling a `-480` one (the 1x desktop source for the `20vw` slot), and closes responsive-coverage gaps for journal JPEGs and WebPs when the result is smaller; animated WebPs are excluded. Animations ship as an H.264 MP4 tile plus a static `-poster.webp`; do not add animated WebP or GIF tiles. `convert-curated-webp.py` regenerates the selected deterministic WebP overlay.

The map generator lives at `tools/maps/generate-world-map.ps1` and downloads Natural Earth data before replacing `images/travel/world-map.svg`. It simplifies every ring with Douglas–Peucker at `-Tolerance 0.25` canvas pixels (45,965 points and 218 KB gzipped down to ~17,500 points and ~90 KB) while keeping every feature, including sub-pixel islets.

`tools/legacy/` contains destructive or one-time migration utilities retained only for provenance. Do not run them during normal builds. In particular, `cap-original-images.py` has already been run; re-encoding those originals was measured and rejected.

## Source-of-truth rules

- Edit source files, never `dist/`.
- `tools/site/build.ps1` owns the generated document head and cache-busting versions.
- `tools/site/verify.ps1` independently checks generated content and private-artifact exclusions.
- `images-webp/` stays tracked so CI does not depend on Pillow or nondeterministic recompression.
