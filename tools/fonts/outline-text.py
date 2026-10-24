"""Outline short strings as SVG path data, for lettering that must not depend
on a loaded font (the League peek's stacked mark and profile name).

usage: python -I tools/fonts/outline-text.py <font.ttf> <wght|-> <size> <x> <y> <text> [--middle]

<font.ttf> may be a variable font; <wght> picks the instance ("-" for a static
font). <size> is the em size in scene units; <x> <y> is the left end of the
baseline (its centre with --middle). Pair kerning comes from the font's GPOS
"kern" feature, so positions match a browser's. Prints the path data.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen


def pair_kerning(font):
    """(left glyph, right glyph) -> x advance adjustment, from GPOS kern."""
    pairs, classed = {}, []
    if "GPOS" not in font:
        return lambda a, b: 0
    gpos = font["GPOS"].table
    # Only the Latin script's kern lookups, as a browser shaping Latin text uses.
    scripts = {s.ScriptTag: s.Script for s in gpos.ScriptList.ScriptRecord}
    script = scripts.get("latn") or scripts.get("DFLT")
    features = script.DefaultLangSys.FeatureIndex if script and script.DefaultLangSys else range(len(gpos.FeatureList.FeatureRecord))
    records = [gpos.FeatureList.FeatureRecord[i] for i in features]
    lookups = {i for fr in records if fr.FeatureTag == "kern" for i in fr.Feature.LookupListIndex}
    for i in sorted(lookups):
        lookup = gpos.LookupList.Lookup[i]
        for sub in lookup.SubTable:
            if lookup.LookupType == 9:
                if sub.ExtensionLookupType != 2:
                    continue
                sub = sub.ExtSubTable
            elif lookup.LookupType != 2:
                continue
            cov = sub.Coverage.glyphs
            if sub.Format == 1:
                for first, ps in zip(cov, sub.PairSet):
                    for rec in ps.PairValueRecord:
                        v = getattr(rec.Value1, "XAdvance", 0) if rec.Value1 else 0
                        pairs.setdefault((first, rec.SecondGlyph), v)
            elif sub.Format == 2:
                classed.append((set(cov), sub.ClassDef1.classDefs, sub.ClassDef2.classDefs, sub.Class1Record))

    def kern(a, b):
        if (a, b) in pairs:
            return pairs[(a, b)]
        for cov, c1, c2, recs in classed:
            if a in cov:
                r = recs[c1.get(a, 0)].Class2Record[c2.get(b, 0)]
                v = getattr(r.Value1, "XAdvance", 0) if r.Value1 else 0
                if v:
                    return v
        return 0
    return kern


def num(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def outline(path, wght, size, x, y, text, middle=False):
    font = TTFont(path)
    if wght != "-":
        font = instancer.instantiateVariableFont(font, {"wght": float(wght)})
    gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
    kern, hmtx = pair_kerning(font), font["hmtx"]
    names = [cmap[ord(ch)] for ch in text]
    pen_x, at = [], 0
    for i, g in enumerate(names):
        # Browsers shape each word on its own, so nothing kerns across a space.
        if i and " " not in text[i - 1:i + 1]:
            at += kern(names[i - 1], g)
        pen_x.append(at)
        at += hmtx[g][0]
    k = size / upm
    x0 = x - at * k / 2 if middle else x
    pen = SVGPathPen(gs, ntos=num)
    for ch, g, px in zip(text, names, pen_x):
        if ch != " ":
            gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x0 + px * k, y)))
    return pen.getCommands()


if __name__ == "__main__":
    a = sys.argv[1:]
    print(outline(a[0], a[1], float(a[2]), float(a[3]), float(a[4]), a[5], "--middle" in a))
