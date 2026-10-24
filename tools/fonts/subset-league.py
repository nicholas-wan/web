"""Glyph-only woff2 subsets for the League peek's phone lettering.

usage: python -I tools/fonts/subset-league.py <dir with the variable fonts>

Reads PlayfairDisplay-Italic[wght].ttf, LibreBaskerville[wght].ttf,
LibreBaskerville-Italic[wght].ttf and Figtree[wght].ttf (Google Fonts, SIL
OFL; not tracked) and
writes assets/fonts/*-league.woff2 holding only the characters the scene sets.
If the scene's wording changes, add its characters to TEXT and rerun.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

TEXT = {
    "playfair-900-italic-league.woff2": ("PlayfairDisplay-Italic[wght].ttf", 900, "THE league"),
    "librebaskerville-400-league.woff2": ("LibreBaskerville[wght].ttf", 400, "James M."),
    # Figtree has no small square, so the value lines keep its bullet as a
    # spacer and the scene draws a square over it; this face adds the bullet.
    "figtree-400-bullet.woff2": ("Figtree[wght].ttf", 400, "•"),
    "librebaskerville-400-italic-league.woff2": ("LibreBaskerville-Italic[wght].ttf", 400, "45 • Deployed • 6’ 1” Education Profession Interests Groups"),
}
src = Path(sys.argv[1])
out = Path(__file__).resolve().parents[2] / "assets" / "fonts"
for dest, (name, weight, text) in TEXT.items():
    font = instancer.instantiateVariableFont(TTFont(src / name), {"wght": weight}, updateFontNames=True)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern"]
    subsetter = subset.Subsetter(opts)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(out / dest)
    print(dest, (out / dest).stat().st_size, "bytes")
