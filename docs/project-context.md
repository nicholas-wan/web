# Project context

This document records site behavior that is easy to break accidentally and difficult to infer from the markup alone. It is not a second build guide or task history.

Read [`AGENTS.md`](../AGENTS.md) first. Use [`build.md`](build.md) for build, deployment, images, and repository-size work; and [`journals/README.md`](../journals/README.md) plus the complete [`journals/_template.html`](../journals/_template.html) for journal authoring.

## Architecture

- This is a static HTML site based on the Massively theme. Root HTML files are legacy sources; `tools/site/build.ps1` generates `dist/`.
- Shared behavior belongs in `assets/css/custom.css`, `assets/js/`, and generated-page partials. Marker-bounded route CSS remains authored in `custom.css`; the build extracts it into page-specific generated bundles. Upstream Sass in `vendor/massively/sass/` is reference material, not the active CSS source.
- Travel journals are content fragments registered in `journals/manifest.json` and rendered through `partials/travel-journal.html`.
- Preserve public URLs, responsive behavior, accessibility, and the existing visual language unless Nicholas explicitly requests a change.

## Site-wide behavior

- Ordinary interface motion uses the duration and easing tokens in `assets/css/custom.css`: quick feedback is 150ms, card and navigation feedback is 220ms, image treatments are 320ms, listing reveals are 480ms with a 60ms stagger, and large spatial moves may use 520ms. Keep bespoke functional sequences such as the scramble, timeline FLIP, mobile navigation sheet, and atlas fly-to on their documented timings rather than forcing them onto the shared card rhythm.
- Primary-page pagers stay visually unboxed, but use a short teal direction rule and small arrow travel so the previous/next destinations remain discoverable above the footer. Reduced motion keeps those states static.
- Skills intentionally begins directly with its content instead of a generated section banner. Its small `Capabilities` eyebrow supplies hierarchy without adding another surface, and phone descriptions retain a 12px floor.
- At phone and tablet breakpoints, primary calls to action, map controls, and archive actions keep a 3rem touch target. Dense atlas pins may use transparent hit halos and region controls instead of enlarging overlapping visible dots.
- The lightbox and mobile navigation sheet are modal dialogs. Preserve focus-on-open, trapped Tab navigation, Escape/close behavior, and focus restoration when editing `gallery.js` or `main.js`. The lightbox uses a quiet backdrop fade and content fade/scale; reduced motion resolves both immediately.
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
- Preserve the scramble’s current constraints: it plays once, finishes in about 1.2 seconds, keeps opening words readable from the first frame, renders full-length width-matched noise to avoid reflow, and leaves real text in the DOM. Its enhanced visual is seeded with that noise frame so it never flashes the complete sentence before scrambling. Reduced motion skips the effect. The homepage starts after its text has remained visible for a brief 180ms hold. Experience-card observers arm just after the content-page fade clears, then require 70% of the Outcome row to remain visible for the same hold; leaving the viewport during that hold cancels it. Do not tie either trigger to image-dependent `load` timing.
- The theme’s load fade can cover the hero. Preserve the homepage intro stacking fix when changing hero layers or entrance effects.
- On mobile, the About photo remains low and bottom-anchored because `game.js` derives swipe progress from its settled position. Desktop centers the About cluster. Do not normalize those layouts into one shared vertical alignment.

## Travel journal contracts

- Guangzhou is the compact reference implementation. New and structurally updated journals remain content-only fragments; the build supplies the document shell, navigation, footer, styles, and scripts.
- Preserve `data-journal-template="v2"` and the four tokens in `partials/travel-journal.html`: `{{MAIN_ATTRIBUTES}}`, `{{TRIP_NAVIGATION}}`, `{{JOURNAL_CONTENT}}`, and `{{TRIP_PAGINATION}}`.
- Follow the class combinations and markup hierarchy in `journals/_template.html`, including the generic `travel-*` classes and `guangzhou-*` compatibility classes. Heading order is structural because the build derives section and map anchors from it.
- Journal date ranges use four-digit years: `D Month YYYY – D Month YYYY`, or `Month YYYY – Month YYYY` when exact days are unknown.
- Use focal-point custom properties for banner and gallery crops. Tall collage cards span two desktop rows and return to standard cards on mobile. Keep mobile swipe cues in normal document flow rather than overlaying photos; their prompt shakes twice, then remains still until the visitor scrolls and dismisses it.
- Journal banners use one shared pale placeholder. Wide contain-fit artwork sizes its mobile wrapper to the image's natural ratio; do not add a dark wrapper background, which appears as a black flash or exposed band while the responsive source settles.
- Japan uses a left-aligned editorial title block above its full-bleed banner: a small `Travel journal` eyebrow, a title-case Raleway destination title, the trip dates, and the lede. The banner keeps its lower crop so the original embedded wordmark does not dominate; do not put another title over the photograph.
- Journal section links use the measured sticky-toolbar correction in `assets/js/travel-nav.js`. Do not replace it with a fixed pixel offset. Every journal keeps its section controls in one horizontally scrollable row, including long itineraries such as Europe and USA/Canada.

### Journal scrolling contract

- The self-scrolling report first appeared on iPhone, but its causes live in the shared journal shell, so the safeguards apply to every travel journal on mobile and desktop.
- A hash landing must wait until both the document scroll position and the target heading position have settled. Late image, gallery-shell, and font layout changes may move the target; repeatedly correcting during that churn makes the page appear to scroll by itself. Once the aligned position is stable for two checks after load and fonts are ready, stop the correction loop instead of retaining control for the full deadline.
- Any wheel, touch, pointer, keyboard, or otherwise unexpected document scroll cancels the bounded landing correction. This includes movement immediately after `load`, before an image-heavy journal has produced its first correction sample. The correction records its own expected `scrollTo` destination so its one intentional movement is not mistaken for user input. `load` and `pageshow` must not re-land an old hash after the visitor has started reading; a deliberate new section-tab selection re-arms the correction through `hashchange`.
- On mobile, scrollspy centres the active section tab by calling `scrollTo` on `.travel-jump-groups` itself. Do not use `scrollIntoView` for a child of the sticky strip: iPhone Safari can transfer that movement to the root page and create a vertical jump.
- The mobile rail and its embedded hamburger remain dark before and after the rail becomes sticky. Hide the wrapper-level hamburger until `travel-nav.js` moves it into the rail; otherwise the generic white floating style can flash against the black journal header.
- All journal pages add `is-travel-journal-scroll-guard`; at the phone breakpoint it sets `overscroll-behavior-y: none` on the root and body so an upward fling at the top cannot become pull-to-refresh.
- Regression checks cover every generated journal at desktop and phone widths: no root horizontal overflow, the shared navigation script and guard are present, section anchors exist, the sticky strip owns its horizontal overflow, and user input is never followed by an automatic re-landing.

## Personal page contracts

- The Latte and Mocha card links directly to `@twoshotsofcuteness` with an Instagram icon. Do not restore the hover popover, mobile phone mockup, or third-party Instagram embed.
- Orientation and Naval Diving Unit are self-contained timeline galleries, not popup or detail-page destinations. They use the same hover lift, border, shadow, and crossfade treatment as the linked galleries while keeping a default cursor because they are not links. Orientation rotates its two real photos and NDU rotates its three; do not duplicate frames to imitate the five-photo galleries. The retired `experience_ndu` page must stay unpublished.
- Mobile timeline endpoints stay fully inside the viewport. Personal-page cards use larger mobile type, and the legacy floating return-to-top control remains hidden on that breakpoint so it cannot cover card content.
- The cats, house, and pre-wedding cards each rotate five photos; Orientation rotates two and NDU rotates three, all with overlapping crossfades. Desktop hover previews stay quick at one second per photo; touch autoplay uses four seconds per photo so mobile visitors can read each image. On touch, only the gallery card nearest the viewport's reading focus animates; the others hold their first image. Set the animation with longhands — the `animation:` shorthand resets `animation-delay` and collapses the stagger.
- Tile shapes differ per breakpoint and per photo, so each image carries its own `--focus-x`/`--focus-y`; do not reintroduce a per-class `object-position`. The Brawl Stars artwork is intentionally full-bleed and keeps a 16/9 frame when focused on mobile, which retains almost the complete artwork.
- `object-fit: cover` crops rather than scales, so a frame only shows the whole photo when their proportions match. Six of the nine photos are 3:2 and the frames aim at that: `--image-col` widens on desktop as a card opens and focuses, and mobile moves 2/1 folded to 3/2 open. Latte & Mocha (upright) and Code in the Community (square) carry `personal-event-card--upright` to keep a squarer frame — widening those two crops them harder, not softer. Measure before retuning any ratio; the card cannot exceed ~451px, so the timeline column, not `max-width`, is the real ceiling.
- On desktop the photo sets a floor on card height and never a ceiling, and its frames are absolutely positioned. A capped frame cannot stretch to its grid row, which leaves bare card below the photo whenever the text runs taller; letting the photo size itself instead makes an upright source stand a third taller than its neighbours.
- Scroll promotes one card: on phones exactly one is open and every other is folded, so an unread card is already compact rather than arriving at full size, and each fold is paid for by an unfold, which keeps the page height near constant. Desktop folds only cards already read. Focus is sticky by 48px because folding moves cards, which changes which card is nearest and will otherwise flip focus back and forth.
- Phone focus handoffs change intrinsic card height atomically. Do not animate the description height, body spacing, title margin, or image aspect ratio at that breakpoint: iPhone Safari continues momentum scrolling while those layout transitions run, so the document lurches underneath an upward flick. At reading speed, smooth only adjacent handoffs and only the outgoing/incoming pair with the short FLIP translation and clipped reveal in `personal-timeline.js`; fast or skipped-card flicks change immediately. Compositor-only opacity, transforms, and clipping are safe because they do not reflow the document.
- Timeline events carry `data-category` for structure only. The four category accent colours were unused — shadowed by `.personal-timeline-event` since they shared its specificity — and are deliberately gone; a category legend is separately forbidden, so re-adding colour would encode something the page never decodes.

## Travel atlas contracts

- The atlas is progressive: the opening view shows broad trip regions, intermediate zoom shows countries or states, and close zoom shows journal stops.
- The desktop zoom-out floor is the intentional cropped opening view; tablets may use the full map, while phones (≤520px) never render the inline world strip — a teaser card fades in a full-screen overlay whose floor is the fit-to-height view, with region jump chips. Closing fades the overlay before teardown; reduced motion and exits from the phone breakpoint tear it down immediately. Preserve the breakpoint-aware rebase.
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
