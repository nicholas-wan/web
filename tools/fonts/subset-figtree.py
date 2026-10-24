"""Static, ASCII-only Figtree cuts for the Shopee peek (400, 500 and 700).

usage: python -I tools/fonts/subset-figtree.py <path-to-Figtree[wght].ttf>

Writes assets/fonts/figtree-<weight>-ascii.woff2. Source: Google Fonts
(ofl/figtree/Figtree[wght].ttf, SIL Open Font License); not tracked.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

src = Path(sys.argv[1])
out = Path(__file__).resolve().parents[2] / "assets" / "fonts"
for weight in (400, 500, 700):
    font = instancer.instantiateVariableFont(TTFont(src), {"wght": weight}, updateFontNames=True)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"]
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6]
    opts.notdef_outline = True
    subsetter = subset.Subsetter(opts)
    subsetter.populate(unicodes=subset.parse_unicodes("U+0020-007E"))
    subsetter.subset(font)
    font.flavor = "woff2"
    dest = out / f"figtree-{weight}-ascii.woff2"
    font.save(dest)
    print(dest.name, dest.stat().st_size, "bytes")
