"""Desktop League A/B peek with the phone's step notes (svg.lgab-scene).

usage: python -I tools/scenes/desktop/league-ab/gen.py

Reads the current desktop svg from experience.html (read only) and writes
scene-d.html and scene-d.css next to this file. The artwork, ids, classes and
motion are untouched inside: the old 360x150 scene is scaled down as one
group (about 0.92) in a 360x160 svg, the risky-profile card's size, leaving a
band at the bottom where each step caption (Randomise, Measure: still the
only .lgab-cap texts) sits over a two-line note in the phone's wording and
style, centred under its figure.

Compatibility with tools/scenes/league-ab-motion.py and the phone generator
(tools/scenes/phone/league-ab/league-ab-motion-m.py): nothing between
<g class="lgab-people"> and <text class="lgab-t">, or in the hills slice, is
touched, and <g class="lgab-users"> keeps its twelve circles, so both still
find and drive what they expect. The note timings come from the motion
model itself (imported, not copied), so a retune moves them too: the
Randomise note fades in as the die starts rocking, the Measure note with
B's win (its fill deepens and its heart beats).

Idempotent: it can run on a page that already carries this output.
"""
import importlib.util
import sys
import re
from pathlib import Path

sys.dont_write_bytecode = True  # touch nothing outside this folder
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
HTML = ROOT / "experience.html"   # read only

spec = importlib.util.spec_from_file_location("motion", ROOT / "tools" / "scenes" / "league-ab-motion.py")
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)

W, H = 360, 160                  # the risky-profile card's height, so the League row's shared slot keeps one size
CAP, NOTE = 11, 9.8              # 12.8px and 11.4px at 1366 (the card draws the scene at 1.16x), 11.7px and 10.4px at 1024 (1.07x)
# The artwork (the old 360x150 scene) is scaled down as one group to leave a
# band for the steps. Its extent, in the old scene's units: the people icon's
# top, the phones' bottom edge (their soft shadow may touch the band), and the
# A letter's left edge to the x axis's arrow tip.
ART_TOP, ART_BOTTOM, ART_X = 2.45, 133.5, (26, 340)
TOP_PAD = 1.2                    # above the people icon
GAP, CAP_ASC = 3.6, 7.4          # phones to the caption's cap height; that cap height
NOTE_Y, LEAD = 12.2, 12          # caption baseline to the first note line; line spacing
DESC, BOTTOM_PAD = 2.4, 0.4      # the notes' descenders (the g of significant); below them
BAND = GAP + CAP_ASC + NOTE_Y + LEAD + DESC + BOTTOM_PAD
S = (H - TOP_PAD - BAND) / (ART_BOTTOM - ART_TOP)
TX, TY = W / 2 - S * sum(ART_X) / 2, TOP_PAD - S * ART_TOP
CAP_Y = S * ART_BOTTOM + TY + GAP + CAP_ASC
STEPS = [  # caption, centre x (the existing captions'), note lines (phone wording)
    ("Randomise", 92, ["Each user sees", "A or B at random."]),
    ("Measure", 255, ["B’s match rate is higher,", "and it’s significant."]),
]
EXTRA = " B's is higher, and the difference is statistically significant."


def f(x):
    return f"{x:.3f}".rstrip("0").rstrip(".") if abs(x) >= 1e-4 else "0"


def desktop_svg(src):
    at = src.index('<svg class="lgab-scene"')
    return src[at: src.index("</svg>", at) + 6]


def build(svg):
    # Undo any earlier output (notes, captions, the artwork's wrapper), so
    # this runs on the page as it is now or once scene-d.html is applied.
    svg = re.sub(r'<text class="lgab-d-note[^"]*".*?</text>', "", svg, flags=re.S)
    caps = re.search(r'<g class="lgab-cap">.*?</g>', svg, re.S)
    assert caps, "no caption group"
    texts = re.findall(r"<text[^>]*>([^<]*)</text>", caps.group(0))
    assert texts == [s[0] for s in STEPS], texts
    svg = svg[: caps.start()] + svg[caps.end():]
    svg, n = re.subn(r'<g class="lgab-d-art" transform="[^"]*">', "", svg, count=1)
    if n:
        assert svg.endswith("</g></g></svg>")
        svg = svg[: -len("</g></svg>")] + "</svg>"
    svg = re.sub(r'viewBox="0 0 360 [\d.]+"', f'viewBox="0 0 {W} {H}"', svg, count=1)
    # The artwork, untouched inside, scaled as one group; the steps below it,
    # each caption (still the only .lgab-cap texts, in order) over its note,
    # centred under its figure: the die (x 92) and the chart (x 255).
    at = svg.index("</defs>") + len("</defs>")
    svg = svg[:at] + f'<g class="lgab-d-art" transform="translate({f(TX)} {f(TY)}) scale({f(S)})">' + svg[at:]
    caps = '<g class="lgab-cap">' + "".join(
        f'<text x="{f(S * x + TX)}" y="{f(CAP_Y)}" text-anchor="middle">{c}</text>' for c, x, _ in STEPS) + "</g>"
    notes = ""
    for i, (_, x, lines) in enumerate(STEPS, 1):
        notes += f'<text class="lgab-d-note lgab-d-note-{i}" text-anchor="middle">' + "".join(
            f'<tspan x="{f(S * x + TX)}" y="{f(CAP_Y + NOTE_Y + LEAD * j)}">{t}</tspan>' for j, t in enumerate(lines)) + "</text>"
    assert svg.endswith("</svg>")
    svg = svg[: -len("</svg>")] + "</g>" + caps + notes + "</svg>"
    label = re.search(r'aria-label="([^"]*)"', svg).group(1)
    if EXTRA.strip() not in label:
        svg = svg.replace(f'aria-label="{label}"', f'aria-label="{label}{EXTRA}"', 1)
    return svg


def css():
    dots, span = motion.solve()
    rock = motion.FIRST - 0.25                                   # the die starts rocking
    win = max(span["a"][1], span["b"][1]) + motion.WIN_AFTER     # B's hill deepens, its heart beats
    d = "svg.lgab-scene:not(.lgab-scene--m)"
    return "\n".join([
        "/* Desktop League A/B (> 736px), generated by tools/scenes/desktop/league-ab/gen.py:",
        "   the 360x150 scene, scaled to fit, over a band of step notes, as on phones. Base styles are",
        "   the final frame; while playing, Randomise's note fades in as the die starts",
        "   rocking and Measure's with B's win, both taken from league-ab-motion.py. */",
        f".internship-demo-card__plot > {d} {{ aspect-ratio: {W} / {H}; }}",
        f"{d} .lgab-cap text {{ font-size: {CAP}px; }}",
        f'{d} .lgab-d-note {{ font-family: "Merriweather", Georgia, serif; font-size: {NOTE}px; font-weight: 300; fill: #596273; }}',
        f".is-playing {d} .lgab-d-note-1 {{ animation: lgab-d-show .5s ease {f(rock)}s both; }}",
        f".is-playing {d} .lgab-d-note-2 {{ animation: lgab-d-show .6s ease {f(win)}s both; }}",
        "@keyframes lgab-d-show { from { opacity: 0; } to { opacity: 1; } }",
    ]) + "\n"


def main():
    svg = build(desktop_svg(HTML.read_text(encoding="utf-8")))
    assert "\n" not in svg
    assert svg.count('<g class="lgab-users">') == 1 and svg.count('class="lgab-u"') == len(motion.ARMS)
    (HERE / "scene-d.html").write_text(svg + "\n", encoding="utf-8", newline="\n")
    (HERE / "scene-d.css").write_text(css(), encoding="utf-8", newline="\n")
    print("wrote scene-d.html, scene-d.css: viewBox 0 0", W, H)


if __name__ == "__main__":
    main()
