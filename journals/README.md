# Travel journal sources

`partials/travel-journal.html` is the shared journal shell. `_template.html` is the canonical compact-journal content contract. Together they supply the responsive hero, day structure, routes, compact desktop masonry, two-row collage option, horizontal mobile galleries and swipe cue, lightbox, trip navigation, pagination, mobile menu, scripts, and footer.

To add a journal:

1. Copy `_template.html` to `travel_YYYY_destination.html` in this directory.
2. Keep only journal content in that file; do not copy `<html>`, `<head>`, navigation, footer, script, or stylesheet markup.
3. Keep the compatibility classes shown in `_template.html`; the generic `travel-*` classes document intent while the `guangzhou-*` aliases preserve the existing journal styling.
4. Set `--hero-focus-x` / `--hero-focus-y` on the banner and `--focus-x` / `--focus-y` on photographs when the default centre crop misses the subject.
5. Use `travel-gallery__item--tall guangzhou-gallery__brick--tall` only for vertical collages that should occupy exactly two desktop rows. It returns to one normal card on mobile.
6. Add one ordered entry to `manifest.json` with `contentOnly` set to `true`, `source` set to the content fragment, and the journal metadata. The build adds the required compact-journal page classes automatically.
7. Add the destination's map points in `assets/js/travel-map.js`.
8. Run the normal clean build and verification workflow.

Existing legacy journal sources remain supported while they are migrated. Guangzhou is the reference `contentOnly` implementation. Regardless of source format, every generated journal is rendered through the shared journal partial.
