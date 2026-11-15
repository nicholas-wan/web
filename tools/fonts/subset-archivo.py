"""Archivo for the Projects page, cut to the characters it sets (both axes kept).

usage: python -I tools/fonts/subset-archivo.py <path-to-archivo-latin.woff2>

The source is Google Fonts' latin subset of the Archivo variable font
(wdth 62-125, wght 100-900; gstatic v25, 90,104 bytes; SIL Open Font License),
not tracked. Writes assets/fonts/archivo-latin.woff2 (about 54 KB, 15 Nov 2026).

Both axes stay: the Packing boarding pass sets font-stretch 85% and 110%, and
Chrome maps that onto wdth even though the @font-face names no stretch range,
so a width-pinned cut renders differently. The character set is printable
ASCII (every month and weekday name, digit and sign the demos' calendar dates
can print) plus each non-ASCII character in the Projects sources that Archivo
has; the rest (arrows, emoji) already fall back to system fonts.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

UNICODES = (
    "U+0020-007E,"          # printable ASCII
    "U+00A0,U+00A3,U+00B0,U+00B7,U+00D7,U+00E9,U+00F7,"
    "U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,"
    "U+2039,U+203A,U+2192,U+2212"
)

src = Path(sys.argv[1])
dest = Path(__file__).resolve().parents[2] / "assets" / "fonts" / "archivo-latin.woff2"
font = TTFont(src)
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
subsetter = subset.Subsetter(opts)
subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
subsetter.subset(font)
font.flavor = "woff2"
font.save(dest)
print(dest.name, dest.stat().st_size, "bytes")
