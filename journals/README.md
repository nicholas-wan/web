# Travel journal sources

`partials/travel-journal.html` is the shared journal layout. The build supplies the site shell, trip-section navigation, previous/next journal links, lightbox, mobile menu, scripts, and footer.

To add a journal:

1. Copy `_template.html` to `travel_YYYY_destination.html` in this directory.
2. Keep only journal content in that file; do not copy `<html>`, `<head>`, navigation, footer, script, or stylesheet markup.
3. Add one ordered entry to `manifest.json` with `contentOnly` set to `true`, `source` set to `journals/travel_YYYY_destination.html`, and the journal metadata.
4. Add the destination's map points in `assets/js/travel-map.js`.
5. Run the normal clean build and verification workflow.

Existing legacy journal sources remain supported while they are migrated. Regardless of source format, every generated journal is rendered through the shared journal partial.
