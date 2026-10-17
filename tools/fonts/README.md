# Font sources

`josephsophia.otf` is the source of the pre-wedding wordmark font. The site
publishes only `assets/fonts/josephsophia-wordmark.woff2`, a subset holding the
wordmark's letters and the three private-use swash glyphs it uses. If the
wordmark text in `prewed.html` changes, regenerate the subset with every
character it now uses:

```powershell
pyftsubset tools/fonts/josephsophia.otf --unicodes="U+0020,U+0061,U+0063,U+0067,U+0068,U+0069,U+006C,U+006E,U+006F,U+0078,U+0079,U+E01C,U+E03E,U+E03F" --layout-features='*' --flavor=woff2 --output-file=assets/fonts/josephsophia-wordmark.woff2
```

`pyftsubset` comes with `pip install fonttools brotli`.

## Source Sans Pro 700

`assets/fonts/source-sans-pro-700-latin.woff2` (15.7 KB, Oct 2026) is a static
wght=700 instance of Adobe's Source Sans 3 variable font (v3.052, SIL OFL),
cut to the same Google Fonts "latin" unicode range and the same OpenType
feature list as the shipped `source-sans-pro-900-latin.woff2` (a Google Fonts
cut of Source Sans Pro 2.045: unhinted, `ccmp dnom frac liga locl numr pnum` +
`kern mark mkmk`). `subset-source-sans.py` pins the axis with fontTools'
instancer and subsets in one step:

```powershell
python -I tools/fonts/subset-source-sans.py <path-to-SourceSans3VF-Upright> --weight 700 --output assets/fonts/source-sans-pro-700-latin.woff2
```

The variable font is not tracked here. The Oct 2026 build used the copy that
Streamlit bundles under its `static/static/media/SourceSansVF-Upright.ttf.*.woff2`
in the local Anaconda install; the official source is the Source Sans 3 release
at <https://github.com/adobe-fonts/source-sans/releases> (`VAR/SourceSans3VF-Upright.ttf`
or the `WOFF2/VAR` build). Source Sans 3 has taller vertical metrics than the
2.045 Black cut, so the `@font-face` in `assets/css/main.css` pins the 700 face
with `ascent-override: 98.4%; descent-override: 27.3%; line-gap-override: 0%`
(the Black's hhea 984/-273 at 1000 upm); keep those if the file is regenerated.
