"""Cut the latin text fonts down to the characters the site sets.

usage: python -I tools/fonts/subset-latin.py [--dist dist]

Covers Merriweather 300/700 and both italics, Raleway 400 and Source Sans
Pro 700 and 900: the faces declared with Google Fonts' latin unicode-range in
assets/css/main.css. Run it after a build whenever verify.ps1 reports a
character these faces must draw that the subsets lack, then rebuild.

It scans the built site the way verify.ps1 does (every .html, .js, .json, .svg
and .css under dist/ except images/; HTML entities decoded in all but the
stylesheets, since scripts set them through innerHTML, and \\uXXXX escapes in
scripts, data and inline <script> elements and \\XXXX escapes in stylesheets
read as the characters they stand for). Every character inside the faces' latin range counts, in
both cases, because text-transform sets titles and labels in capitals. To
those it adds, always:

- U+0000-007F: all of ASCII, so any English word, digit or sign a script
  prints (calendar dates, counters, search input) has its glyph;
- U+00A0, no-break space;
- U+0300-036F, the combining marks (dropping them broke the pinyin on the
  Guangzhou journal; only the font's own marks are kept);
- U+2000-206F, General Punctuation (dashes, quotes, ellipsis, the spaces),
  which the browser also inserts itself (text-overflow, quotes, hyphens).

Then, for each full file in tools/fonts/latin/ (kept unpublished as the
source), it writes assets/fonts/<face>.woff2 holding only those characters,
and sets the unicode-range of the seven latin @font-face rules in
assets/css/main.css to Google's latin range narrowed to the same set, so
verify.ps1 can check the subsets against the built site. Glyph outlines,
hinting, metrics and OpenType features are copied unchanged. Needs fonttools
plus brotli (both ship with Anaconda).
"""
import argparse
import html
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "fonts" / "latin"
FONTS = ROOT / "assets" / "fonts"
MAIN_CSS = ROOT / "assets" / "css" / "main.css"

FACES = [
    "merriweather-300-latin",
    "merriweather-700-latin",
    "merriweather-300-italic-latin",
    "merriweather-700-italic-latin",
    "raleway-400-latin",
    "source-sans-pro-700-latin",
    "source-sans-pro-900-latin",
]
# Google Fonts' latin unicode-range, the range these faces were declared with.
LATIN = "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
ALWAYS = "U+0-7F,U+A0,U+300-36F,U+2000-206F"

JS_ESCAPE = re.compile(r"\\u(?:\{([0-9A-Fa-f]{1,6})\}|([0-9A-Fa-f]{4}))")
CSS_ESCAPE = re.compile(r"\\([0-9A-Fa-f]{1,6})")


def parse_range(text):
    points = set()
    for part in text.split(","):
        part = part.strip().removeprefix("U+")
        low, _, high = part.partition("-")
        points.update(range(int(low, 16), int(high or low, 16) + 1))
    return points


def css_range(points):
    """U+0-7F, U+A0, U+B7 style list, consecutive points merged."""
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


SCRIPT = re.compile(r"<script\b[^>]*>(.*?)</script>", re.IGNORECASE | re.DOTALL)


def scan_text(path):
    """The file's text plus every character its entities and escapes stand for."""
    text = path.read_text(encoding="utf-8-sig")
    if path.suffix == ".css":
        pattern, escaped, decoded = CSS_ESCAPE, text, text
    elif path.suffix == ".svg":
        pattern, escaped, decoded = None, "", html.unescape(text)
    else:
        # Scripts set entities through innerHTML, so .js and .json are
        # entity-decoded too; a page's escapes count only in inline scripts.
        escaped = "".join(SCRIPT.findall(text)) if path.suffix == ".html" else text
        pattern, decoded = JS_ESCAPE, html.unescape(text)
    if pattern is None:
        return decoded
    extra = []
    for match in pattern.finditer(escaped):
        cp = int(next(g for g in match.groups() if g), 16)
        if cp <= 0x10FFFF:
            extra.append(chr(cp))
    return decoded + "".join(extra)


def used_points(dist, latin):
    found = {}
    for path in sorted(dist.rglob("*")):
        if not path.is_file() or path.suffix not in {".html", ".js", ".json", ".css", ".svg"}:
            continue
        if "images" in path.relative_to(dist).parts:
            continue
        where = path.relative_to(dist).as_posix()
        for ch in set(scan_text(path)):
            if ord(ch) not in latin:
                continue
            found.setdefault(ord(ch), where)
            for variant in (ch.upper(), ch.lower()):
                if len(variant) == 1 and ord(variant) in latin:
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

    latin, always = parse_range(LATIN), parse_range(ALWAYS)
    found = used_points(dist, latin)
    keep = always | set(found)
    for cp, where in sorted(found.items()):
        if cp not in always:
            print(f"U+{cp:04X} {chr(cp)}  first seen in {where}")

    total_from = total_to = 0
    for face in FACES:
        src = SOURCES / f"{face}.woff2"
        if not src.is_file():
            print(f"missing source {src}", file=sys.stderr)
            return 1
        # Keep the source's timestamp so reruns give identical bytes.
        font = TTFont(src, recalcTimestamp=False)
        missing = sorted(cp for cp in found if cp not in font.getBestCmap() and cp > 0x7F)
        if missing:
            # The browser falls back past this face for these, as it did with
            # the full file.
            print(f"  note: {src.name} has no glyph for " + ", ".join(f"U+{cp:04X}" for cp in missing))
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.name_languages = ["*"]
        opts.name_legacy = True
        opts.notdef_outline = True
        opts.glyph_names = True
        opts.hinting = True
        opts.legacy_kern = True
        opts.prune_unicode_ranges = False
        subsetter = subset.Subsetter(opts)
        subsetter.populate(unicodes=keep)
        subsetter.subset(font)
        font.flavor = "woff2"
        dest = FONTS / src.name
        font.save(dest)
        total_from += src.stat().st_size
        total_to += dest.stat().st_size
        print(f"{dest.name}: {dest.stat().st_size} bytes (from {src.stat().st_size})")
    print(f"total: {total_to} bytes (from {total_from})")

    declared = css_range(latin & keep)
    css = MAIN_CSS.read_text(encoding="utf-8")
    names = "|".join(re.escape(face) for face in FACES)
    pattern = re.compile(r'(src: url\("\.\./fonts/(?:' + names + r')\.woff2"\) format\("woff2"\);\s*unicode-range: )[^;]+;')
    css, count = pattern.subn(lambda m: m.group(1) + declared + ";", css)
    if count != len(FACES):
        print(f"expected {len(FACES)} latin @font-face rules in main.css, found {count}", file=sys.stderr)
        return 1
    MAIN_CSS.write_text(css, encoding="utf-8", newline="\n")
    print(f"main.css: {count} unicode-range lines set to {declared}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
