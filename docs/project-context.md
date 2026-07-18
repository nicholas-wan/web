# Project context

This document records site behavior that is easy to break accidentally and difficult to infer from the markup alone. It is not a second build guide or task history.

Read [`AGENTS.md`](../AGENTS.md) first. Use [`build.md`](build.md) for build, deployment, images, and repository-size work; and [`journals/README.md`](../journals/README.md) plus the complete [`journals/_template.html`](../journals/_template.html) for journal authoring.

## Architecture

- This is a static HTML site based on the Massively theme. Root HTML files are legacy sources; `tools/site/build.ps1` generates `dist/`.
- Shared behavior belongs in `assets/css/custom.css`, `assets/js/`, and generated-page partials. Upstream Sass in `vendor/massively/sass/` is reference material, not the active CSS source.
- Travel journals are content fragments registered in `journals/manifest.json` and rendered through `partials/travel-journal.html`.
- Preserve public URLs, responsive behavior, accessibility, and the existing visual language unless Nicholas explicitly requests a change.

## Site-wide behavior

- The lightbox and mobile navigation sheet are modal dialogs. Preserve focus-on-open, trapped Tab navigation, Escape/close behavior, and focus restoration when editing `gallery.js` or `main.js`.
- The pre-wedding hero wordmark intentionally uses private-use Wedding-font glyphs. Do not “correct” its unusual DOM text; its accessible name is `Nicholas and Yingxian` through `role="img"` and `aria-label`.
- Do not add fixed image dimensions to `.content-image` masonry tiles when they would distort the gallery. Preserve useful alt text, lazy loading below the fold, and visible subjects at both desktop and mobile crops.
- New links that open another tab need `rel="noopener noreferrer"`.

## Homepage contracts

- Keep the scroll animation and background canvas.
- The hero contains the name, one scrambling headline, one short support line, and the selected-work CTA. The current copy is:
  - Headline: `I build agentic AI products for real-world security operations.`
  - Support: `Product direction · DSTA`
- The headline is owner-approved product copy. Propose copy changes instead of silently rewriting it. Do not restore the rejected multi-line paragraph hero or a skills list in the hero.
- The site has exactly three scramble effects: the homepage headline and both Outcome rows on the experience page. All use `assets/js/scramble-reveal.js`; do not add another or remove one as incidental cleanup.
- Preserve the scramble’s current constraints: it plays once, finishes in about 1.2 seconds, keeps opening words readable from the first frame, renders full-length width-matched noise to avoid reflow, and leaves real text in the DOM. Reduced motion skips the effect. The homepage starts immediately above the load fade; experience-card observers arm only after that fade clears and watch the Outcome text itself so the noise frames run while the phrase is visible.
- The theme’s load fade can cover the hero. Preserve the homepage intro stacking fix when changing hero layers or entrance effects.
- On mobile, the About photo remains low and bottom-anchored because `game.js` derives swipe progress from its settled position. Desktop centers the About cluster. Do not normalize those layouts into one shared vertical alignment.

## Travel journal contracts

- Guangzhou is the compact reference implementation. New and structurally updated journals remain content-only fragments; the build supplies the document shell, navigation, footer, styles, and scripts.
- Preserve `data-journal-template="v2"` and the four tokens in `partials/travel-journal.html`: `{{MAIN_ATTRIBUTES}}`, `{{TRIP_NAVIGATION}}`, `{{JOURNAL_CONTENT}}`, and `{{TRIP_PAGINATION}}`.
- Follow the class combinations and markup hierarchy in `journals/_template.html`, including the generic `travel-*` classes and `guangzhou-*` compatibility classes. Heading order is structural because the build derives section and map anchors from it.
- Journal date ranges use four-digit years: `D Month YYYY – D Month YYYY`, or `Month YYYY – Month YYYY` when exact days are unknown.
- Use focal-point custom properties for banner and gallery crops. Tall collage cards span two desktop rows and return to standard cards on mobile. Keep mobile swipe cues in normal document flow rather than overlaying photos.
- Journal section links use the measured sticky-toolbar correction in `assets/js/travel-nav.js`. Do not replace it with a fixed pixel offset; the toolbar can wrap to several rows.

## Personal page contracts

- The Latte and Mocha card links directly to `@twoshotsofcuteness` with an Instagram icon. Do not restore the hover popover, mobile phone mockup, or third-party Instagram embed.
- The orientation memory uses one centered modal containing both entries. Preserve root scroll locking, focus restoration, and proportional dialog images with an explicit `height: auto` override for generated height attributes.
- Mobile timeline endpoints stay fully inside the viewport. Personal-page cards use larger mobile type, and the legacy floating return-to-top control remains hidden on that breakpoint so it cannot cover card content.
- Event thumbnails are cropped per breakpoint, not globally. Desktop tiles are portrait, so the cats photo needs no focal correction there and the wide Brawl Stars artwork needs `contain`; the 16/9 mobile tile inverts both, so it anchors the cats crop near the top to keep Latte's head in frame and lets the artwork `cover` edge to edge.
- Timeline events carry `data-category` for structure only. The four category accent colours were unused — shadowed by `.personal-timeline-event` since they shared its specificity — and are deliberately gone; a category legend is separately forbidden, so re-adding colour would encode something the page never decodes.

## Travel atlas contracts

- The atlas is progressive: the opening view shows broad trip regions, intermediate zoom shows countries or states, and close zoom shows journal stops.
- The desktop zoom-out floor is the intentional cropped opening view; narrower layouts may use the full map. Preserve the breakpoint-aware rebase.
- Store marker locations as latitude and longitude and project them with the shared Natural Earth 1 implementation in `assets/js/travel-map.js`. Do not hand-place percentage coordinates or replace the vector map with a raster.
- Every map link must resolve to a matching `trip-section-*` anchor. Keep separate labelled callouts when the same city appears in more than one journal.
- Dense labels may move and use leader lines, but an in-view destination must not disappear merely because labels collide. Hyper-local attractions belong in regional popup links rather than as overlapping world-map dots.
- `images/travel/world-map.svg` is generated by `tools/maps/generate-world-map.ps1` from Natural Earth data; regenerate it when geography changes.

## Dead ends and hidden dependencies

- **No SEO, analytics, or resume-PDF work (owner decision, Jul 2026)** — do not add og tags, structured data, or tracking scripts; the League "1 year internship" journal note is intentional.

- **Build size — measured, no easy win (do not retry).** Travel JPEGs are already q40–42;
  recompressing is break-even or worse (the 1600px cap makes them *bigger*). JPEG→WebP was
  refuted — 104 of 495 files grew, net +81MB to save 24MB; only the 9 banners (q82) have
  headroom. The real weight is `.git` (~2.5GB): ~1GB tracked `dist/` history (now
  `.gitignore`d; CI rebuilds it) and ~283MB superseded GIFs — only a history rewrite
  reclaims it, and `git filter-branch` was tried and abandoned (clone still 2.4GB). If
  retried, use `git filter-repo` and prove a smaller clone before force-pushing. Pipeline
  details in [`build.md`](build.md).
- **`.travel-gallery__item--tall` looks unused, isn't.** It pairs with the
  `guangzhou-gallery__brick--tall` compat class; the markup carries only the compat class
  today, so the generic half scans as dead — but SKILL.md mandates the pairing, and
  removing the CSS silently unstyles future journals.

## Working with these contracts

- Make intentional behavior changes in source, then update matching assertions in `tools/site/verify.ps1` in the same change.
- When shared CSS or JavaScript changes, update its cache version through `tools/site/build.ps1`, which is the sole source of truth for asset versions.
- Validate behavior in generated `dist/`, not only in source HTML. For visual changes, inspect desktop and mobile layouts, crops, overflow, navigation, focus behavior, and reduced motion as applicable.
