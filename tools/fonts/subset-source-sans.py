"""Build a static, latin-only Source Sans WOFF2 subset from the Source Sans 3
variable font.

    python -I tools/fonts/subset-source-sans.py <SourceSans3 VF .ttf/.woff2> \
        --weight 700 --output assets/fonts/source-sans-pro-700-latin.woff2

The output mirrors the shipped `source-sans-pro-900-latin.woff2` (a Google
Fonts latin cut of Source Sans Pro 2.045): same unicode range, same OpenType
feature list, unhinted, glyph names kept. The `wght` axis is pinned with
fontTools' instancer, so any weight between 200 and 900 can be produced.
Needs `fonttools` plus `brotli` or `brotlicffi` (both ship with Anaconda).
"""
import argparse
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Google Fonts "latin" subset, as listed in the unicode-range of every latin
# @font-face in assets/css/main.css.
LATIN_UNICODES = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,"
    "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
    "U+FEFF,U+FFFD"
)

# Exactly the GSUB/GPOS features retained in source-sans-pro-900-latin.woff2.
LAYOUT_FEATURES = ["ccmp", "dnom", "frac", "liga", "locl", "numr", "pnum",
                   "kern", "mark", "mkmk"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("source", help="Source Sans 3 variable font (.ttf/.otf/.woff2)")
    parser.add_argument("--weight", type=int, default=700, help="wght axis value (200-900)")
    parser.add_argument("--output", required=True, help="destination .woff2 path")
    args = parser.parse_args()

    font = TTFont(args.source)
    if "fvar" not in font:
        print("source is not a variable font (no fvar table)", file=sys.stderr)
        return 1
    axes = {axis.axisTag: (axis.minValue, axis.maxValue) for axis in font["fvar"].axes}
    lo, hi = axes["wght"]
    if not lo <= args.weight <= hi:
        print(f"weight must be within {lo:g}-{hi:g}", file=sys.stderr)
        return 1

    instancer.instantiateVariableFont(font, {"wght": args.weight}, inplace=True, updateFontNames=True)
    font["OS/2"].usWeightClass = args.weight

    # The VF's family name is "SourceSans3VF"; name the static instance like
    # Adobe's own static builds (Source Sans 3 Bold / SourceSans3-Bold).
    style = font["name"].getDebugName(2) or f"wght{args.weight}"
    version = font["name"].getDebugName(5) or ""
    version_number = version.split(";")[0].replace("Version", "").strip()
    names = {
        1: "Source Sans 3",
        2: style,
        3: f"{version_number};ADBO;SourceSans3-{style.replace(' ', '')};ADOBE",
        4: f"Source Sans 3 {style}",
        6: f"SourceSans3-{style.replace(' ', '')}",
    }
    for name_id, value in names.items():
        font["name"].setName(value, name_id, 3, 1, 0x409)
        font["name"].setName(value, name_id, 1, 0, 0)

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = LAYOUT_FEATURES
    options.hinting = False
    options.glyph_names = True
    options.notdef_outline = True
    options.recalc_bounds = True
    options.recalc_average_width = True
    options.prune_unicode_ranges = True

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=subset.parse_unicodes(LATIN_UNICODES))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(args.output)

    cmap = font.getBestCmap()
    print(f"wrote {args.output}: {len(font.getGlyphOrder())} glyphs, {len(cmap)} codepoints, "
          f"usWeightClass {font['OS/2'].usWeightClass}, "
          f"{font['name'].getDebugName(1)} / {font['name'].getDebugName(5)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
