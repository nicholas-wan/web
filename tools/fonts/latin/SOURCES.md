Full latin cuts of the site's text faces, kept unpublished as the source of the shipped `assets/fonts/` files (moved here 15 Nov 2026; these are the bytes that shipped until then).

- `merriweather-{300,700}-latin.woff2`, `merriweather-{300,700}-italic-latin.woff2`: static single-weight instances of the Merriweather variable font in Google Fonts' latin range (SIL Open Font License 1.1).
- `raleway-400-latin.woff2`, `source-sans-pro-900-latin.woff2`: Google Fonts' latin subsets (SIL Open Font License 1.1).
- `source-sans-pro-700-latin.woff2`: a static wght 700 instance of Source Sans 3 VF from `tools/fonts/subset-source-sans.py` (see README.md, "Source Sans Pro 700").

Shipped cuts: build the site, then `python -I tools/fonts/subset-latin.py`, then rebuild. The script keeps all of ASCII (U+0000-007F), U+00A0, the combining marks U+0300-036F and General Punctuation U+2000-206F, plus every other character of Google's latin range (U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2C6, U+2DA, U+2DC, U+304, U+308, U+329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD) found in the built `.html`, `.js`, `.json` and `.css` (entities and escapes read, both cases), and writes the same set into the seven faces' `unicode-range` in `assets/css/main.css`. On 15 Nov 2026: 237,452 to 168,468 bytes. See README.md, "Fonts".
