"""Cut the latin-ext fonts down to the latin-ext characters the site uses.

usage: python -I tools/fonts/subset-latin-ext.py [--dist dist]

Run it after a build whenever verify.ps1 reports a latin-ext character that no
subset covers, then rebuild. It scans the built site the same way verify.ps1
does (every .html, .js, .json and .css under dist/ except images/, HTML
entities decoded), collects the characters that fall in Google Fonts'
latin-ext unicode-range but not in its latin one, and then:

- writes assets/fonts/<face>-latin-ext-used.woff2 for every full latin-ext cut
  in tools/fonts/latin-ext/ (the Google Fonts files the site used to ship,
  kept unpublished as the source), holding only those characters;
- rewrites the unicode-range of each -latin-ext-used @font-face in
  assets/css/main.css to exactly that list.

Glyph outlines, hinting, metrics and OpenType features are copied unchanged,
so the letters look the same as with the full files. Needs fonttools plus
brotli (both ship with Anaconda).
"""
import argparse
import html
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "fonts" / "latin-ext"
FONTS = ROOT / "assets" / "fonts"
MAIN_CSS = ROOT / "assets" / "css" / "main.css"

# Google Fonts' unicode-ranges, as on the latin and (former) latin-ext faces.
LATIN = "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT = "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"


def parse_range(text):
    points = set()
    for part in text.split(","):
        part = part.strip().removeprefix("U+")
        low, _, high = part.partition("-")
        points.update(range(int(low, 16), int(high or low, 16) + 1))
    return points


def css_range(points):
    """U+101, U+113, U+1CE-1CF style list, consecutive points merged."""
    spans, run = [], []
    for cp in sorted(points):
        if run and cp == run[-1] + 1:
            run.append(cp)
        else:
            if run:
                spans.append(run)
            run = [cp]
    if run:
        spans.append(run)
    return ", ".join(f"U+{s[0]:X}" if len(s) == 1 else f"U+{s[0]:X}-{s[-1]:X}" for s in spans)


def used_points(dist):
    needed = parse_range(LATIN_EXT) - parse_range(LATIN)
    found = {}
    for path in sorted(dist.rglob("*")):
        if not path.is_file() or path.suffix not in {".html", ".js", ".json", ".css"}:
            continue
        if "images" in path.relative_to(dist).parts:
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix == ".html":
            text = html.unescape(text)
        for ch in set(text):
            if ord(ch) in needed:
                where = path.relative_to(dist).as_posix()
                found.setdefault(ord(ch), where)
                # text-transform (journal titles, labels) renders the other
                # case: "Nagoya-jō" is set as NAGOYA-JŌ.
                for variant in (ch.upper(), ch.lower()):
                    if len(variant) == 1 and ord(variant) in needed:
                        found.setdefault(ord(variant), f"{where} (case of {ch})")
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dist", default=str(ROOT / "dist"), help="built site to scan (default: dist)")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
    dist = Path(args.dist)
    if not (dist / "index.html").is_file():
        print(f"{dist} has no index.html; build the site first", file=sys.stderr)
        return 1

    found = used_points(dist)
    if not found:
        print("the site uses no latin-ext characters; nothing to subset", file=sys.stderr)
        return 1
    for cp, where in sorted(found.items()):
        print(f"U+{cp:04X} {chr(cp)}  first seen in {where}")

    sources = sorted(SOURCES.glob("*-latin-ext.woff2"))
    if not sources:
        print(f"no *-latin-ext.woff2 sources in {SOURCES}", file=sys.stderr)
        return 1
    for src in sources:
        # Keep the source's timestamp so reruns give identical bytes.
        font = TTFont(src, recalcTimestamp=False)
        missing = [cp for cp in found if cp not in font.getBestCmap()]
        if missing:
            # The browser falls back past this face for these, as it did with
            # the full file; listing them keeps every face's range identical.
            print(f"  note: {src.name} has no glyph for " + ", ".join(f"U+{cp:04X}" for cp in sorted(missing)))
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.name_languages = ["*"]
        opts.name_legacy = True
        opts.notdef_outline = True
        opts.glyph_names = True
        opts.hinting = True
        opts.prune_unicode_ranges = False
        subsetter = subset.Subsetter(opts)
        subsetter.populate(unicodes=found.keys())
        subsetter.subset(font)
        font.flavor = "woff2"
        dest = FONTS / src.name.replace("-latin-ext.woff2", "-latin-ext-used.woff2")
        font.save(dest)
        print(f"{dest.name}: {dest.stat().st_size} bytes (from {src.stat().st_size})")

    css = MAIN_CSS.read_text(encoding="utf-8")
    pattern = re.compile(r'(src: url\("\.\./fonts/[a-z0-9-]+-latin-ext-used\.woff2"\) format\("woff2"\);\s*unicode-range: )[^;]+;')
    css, count = pattern.subn(lambda m: m.group(1) + css_range(found) + ";", css)
    if count != len(sources):
        print(f"expected {len(sources)} -latin-ext-used @font-face rules in main.css, found {count}", file=sys.stderr)
        return 1
    MAIN_CSS.write_text(css, encoding="utf-8", newline="\n")
    print(f"main.css: {count} unicode-range lines set to {css_range(found)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
