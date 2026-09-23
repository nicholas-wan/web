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
