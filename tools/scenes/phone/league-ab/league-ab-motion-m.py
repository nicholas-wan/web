"""Phone-only, taller League A/B peek (svg.lgab-scene.lgab-scene--m).

usage: python -I league-ab-motion-m.py [--check]

Adapted from tools/scenes/league-ab-motion.py (the model below is a verbatim
copy: solve, position, check). It reads the desktop scene's markup from
experience.html (read-only) and writes scene-m.html and scene-m.css next to
this file. The phone layout stacks the story: Randomise (people, die, lanes
and the two phones, the desktop group drawn K times larger) over Measure
(the chart, full width).

Nothing in the motion changes. The left group is the desktop group, scaled
as a whole, so the desktop's generated lgab-* animations (users, lanes, die,
designs, heart) drive it unchanged: the same speeds, timings and spacing,
in units that are simply K times larger. The hills sit in a plot group
scaled (SX, SY) from the desktop chart, so lgab-hx/hill animations drive
them unchanged too (their outline is non-scaling). Only the hill labels,
which are not scaled (so they stay crisp and large), get their own -m
keyframes, computed here from the same spans, so each label rides its
peak exactly as on desktop.

Desktop model notes, kept: one model drives everything, so nothing steps.
The story ends about when the risky-profile scene's does, about 5.7s.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
HTML = ROOT / "experience.html"   # read only
HERE = Path(__file__).resolve().parent

ARMS = "abbabaababba"             # the random assignment, A or B per user
FIRST, DEAL = 0.9, 0.25          # first deal (s) and the gap between deals
SPEED, DOCK = 40.0, 0.30         # every dot's speed (units/s); its easing in
MERGE = 0.2                      # a landed dot rides the tip this long, fading
GAP, LANE = 8.0, 44.0            # die centre to lane start; lane length
EASE = (0.25, 0.25, 0.7, 1)      # lanes and hills: start moving, soft end
LIGHT = {"a": "#a99fe6", "b": "#e891b2"}
DARK = {"a": "#6352c6", "b": "#c23f6e"}
SIGN = {"a": -1, "b": 1}
HILL = {"sd": (29.21, 16), "h": (4, 72), "a": (258, 248), "b": (258, 268)}
WIN_AFTER = 0.1                  # both hills settle, then B's deepens and beats


def bezier(p, u):
    """y of a CSS cubic-bezier at x = u, and dy/dx there."""
    x1, y1, x2, y2 = p
    bx = lambda s: 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3
    by = lambda s: 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3
    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if bx(mid) < u else (lo, mid)
    s, e = (lo + hi) / 2, 1e-6
    dx = bx(min(1, s + e)) - bx(max(0, s - e))
    dy = by(min(1, s + e)) - by(max(0, s - e))
    return by(s), (dy / dx if dx else 0.0)


def front(arm, t, span):
    """Fill length and speed of an arm's lane at time t."""
    s, e = span[arm]
    if t <= s:
        return 0.0, 0.0
    if t >= e:
        return LANE, 0.0
    y, slope = bezier(EASE, (t - s) / (e - s))
    return LANE * y, LANE * slope / (e - s)


def solve():
    launch = [FIRST + i * DEAL for i in range(len(ARMS))]
    span = {k: (launch[ARMS.index(k)] + 0.3, launch[ARMS.rindex(k)] + 1.3) for k in "ab"}
    for _ in range(200):
        dots = []
        for i, arm in enumerate(ARMS):
            arrive = launch[i] + 0.5
            for _ in range(100):
                fill, v1 = front(arm, arrive, span)
                dist = GAP + fill
                dock = (SPEED + v1) / 2 * DOCK
                arrive = 0.5 * arrive + 0.5 * (launch[i] + (dist - dock) / SPEED + DOCK)
            assert dist > dock, "a dot would land before it has docked"
            dots.append(dict(arm=arm, launch=launch[i], arrive=arrive, dist=dist, dock=dock, v1=v1))
        new = {k: (min(d["arrive"] for d in dots if d["arm"] == k), max(d["arrive"] for d in dots if d["arm"] == k)) for k in "ab"}
        if all(abs(new[k][j] - span[k][j]) < 1e-7 for k in "ab" for j in (0, 1)):
            break
        span = {k: tuple(0.5 * span[k][j] + 0.5 * new[k][j] for j in (0, 1)) for k in "ab"}
    return dots, span


def position(d, t):
    """Distance of a dot from the die at time t (None before launch)."""
    if t < d["launch"]:
        return None
    cruise = d["arrive"] - DOCK
    if t <= cruise:
        return SPEED * (t - d["launch"])
    a = min(t, d["arrive"]) - cruise
    x = d["dist"] - d["dock"] + SPEED * a - (SPEED - d["v1"]) / DOCK * a * a / 2
    return x + d["v1"] * max(0.0, t - d["arrive"])


def check(dots, span):
    problems = []
    for k in "ab":
        lane = [d for d in dots if d["arm"] == k]
        for p, q in zip(lane, lane[1:]):
            if q["arrive"] <= p["arrive"]:
                problems.append(f"{k}: a dot overtakes the one before it")
            t, closest = q["launch"], 1e9
            while t < p["arrive"]:
                xp, xq = position(p, t), position(q, t)
                if xq is not None and xq > 5:  # out from behind the die
                    closest = min(closest, xp - xq)
                t += 1 / 240
            if closest < 4.4:
                problems.append(f"{k}: dots {p['launch']:.2f}s and {q['launch']:.2f}s come {closest:.1f} apart")
    return problems




# ---- Phone layout (scene units of a 360 x 318 viewBox, as the risk scene) ------------------
# The same size as the League risk phone scene (owner, 25 Oct 2026: "make the
# a/b size same as the risk one. then maybe add some explanation instead?
# Control VS experiment?"). Two rows, each a figure on the left and its step
# on the right, as experiment explainers pair a step with one plain line:
#   Randomise | the people, die, lanes and phones (the desktop group, K x)
#   Measure   | the chart
# Both arms are new designs of the label, so neither is a control: they are
# Variant A and Variant B. The notes carry no numbers or verdict.
W, H = 360, 318
FIG = (8.0, 238.0)         # the figure column; the step column starts at COL
COL = 248.0
K = 1.25                   # the desktop left group (people, die, lanes, phones), K times larger
LEFT_TOP = 4.0             # top of the people icon
LIFT = 6.0                 # the people, die and lanes sit this much higher over the phones than on desktop (room above the phone tops)
CAP, NOTE, LEAD = 14, 13, 18.0      # step captions, their notes, the notes' line spacing
TITLE, AXIS, LABEL = 13.5, 12.5, 14   # chart title, axis titles, hill labels
X0, X1 = 25.0, FIG[1]      # y axis (How likely sits in the margin left of it) and the x axis's arrow tip
TITLE_Y, TOP, BASE, XLAB = 196.0, 204.0, 291.0, 305.0
SX, SY = (X1 - X0) / 168, (BASE - TOP) / 90   # the plot, scaled from the desktop's 168 x 90
STEPS = [  # caption, note lines, the figure's vertical centre it sits beside
    ("Randomise", ["Each user", "sees A or B", "at random."], None),
    ("Measure", ["Hills show each", "design’s likely", "match rate."], None),
]


def f(x):
    return f"{x:.3f}".rstrip("0").rstrip(".") if abs(x) >= 1e-4 else "0"


def layout():
    L = {"h": H}
    L["lx"] = (FIG[0] + FIG[1]) / 2 - 92 * K      # the die (x 92) on the figure column's centre
    L["ly"] = LEFT_TOP + LIFT - 0.45 * K          # the group; its top row is lifted back by LIFT
    L["left_bottom"] = L["ly"] + 133.75 * K       # the phones' shadow
    L["phones_mid"] = L["ly"] + (22 + 131.5) / 2 * K
    L["chart_mid"] = (TOP + BASE) / 2
    L["base"], L["top"], L["title"], L["xlab"] = BASE, TOP, TITLE_Y, XLAB
    assert L["left_bottom"] < TITLE_Y - 14, "the phones would meet the chart title"
    return L


def X(x):
    """A desktop chart x mapped onto the phone's plot."""
    return X0 + (x - 172) * SX


def step(cap, lines, mid):
    """A step caption and its note, centred on a figure's middle."""
    h = CAP + 6 + LEAD * (len(lines) - 1)
    y = mid - h / 2 + CAP * 0.72
    out = [f'<g class="lgab-cap lgab-m-cap"><text x="{f(COL)}" y="{f(y)}">{cap}</text></g>', f'<text class="lgab-m-note">']
    for i, line in enumerate(lines):
        out.append(f'<tspan x="{f(COL)}" y="{f(y + CAP * 0.28 + 6 + NOTE * 0.72 + LEAD * i)}">{line}</tspan>')
    return "".join(out) + "</text>"


def html(L):
    src = HTML.read_text(encoding="utf-8")
    i = src.index('class="lgab-scene"')
    svg = src[src.rindex("<svg", 0, i): src.index("</svg>", i) + 6]
    sym = re.search(r'<symbol id="lgab-photo".*?</symbol>', svg, re.S).group(0).replace('id="lgab-photo"', 'id="lgab-m-photo"')
    clip = re.search(r'<clipPath id="lgab-clip">.*?</clipPath>', svg, re.S).group(0).replace('id="lgab-clip"', 'id="lgab-m-clip"')
    plot = re.search(r'<clipPath id="lgab-plot">.*?</clipPath>', svg, re.S).group(0).replace('id="lgab-plot"', 'id="lgab-m-plot"')
    left = svg[svg.index('<g class="lgab-people"'): svg.index('<text class="lgab-t"')]
    left = left.replace("#lgab-clip", "#lgab-m-clip").replace("#lgab-photo", "#lgab-m-photo")
    # The top row (people, letters, lanes, users, die) rides LIFT higher than
    # the phones; its motion is unchanged, since it moves as one.
    cut = left.index('<g class="lgab-phone"')
    left = f'<g transform="translate(0 {f(-LIFT / K)})">' + left[:cut] + "</g>" + left[cut:]
    hs = svg.index('<g clip-path="url(#lgab-plot)">')
    he = svg.index('<path class="lgab-base"')
    hills = svg[hs:he].replace("#lgab-plot", "#lgab-m-plot")
    # The same unit bell curve, sampled twice as finely, so it never facets
    # however wide the phone draws it.
    import math
    pts = "L".join(f"{f(x / 10)} {f(-math.exp(-(x / 10) ** 2 / 2))}" for x in range(-40, 41))
    hills = re.sub(r'(class="lgab-hill-area" d=")[^"]*"', lambda m: m.group(1) + "M" + pts + 'Z"', hills)
    hills = re.sub(r'(class="lgab-hill-line" d=")[^"]*"', lambda m: m.group(1) + "M" + pts + '"', hills)
    label = re.search(r'aria-label="([^"]*)"', svg).group(1)
    label += " Both designs are variants, A and B; each curve shows where that design's match rate likely lies."
    b, top = L["base"], L["top"]
    ly = -(72 * SY + 4.5)
    (c1, n1, _), (c2, n2, _) = STEPS
    out = [
        f'<svg class="lgab-scene lgab-scene--m" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {L["h"]}" role="img" aria-label="{label}">',
        f"<defs>{sym}{clip}{plot}</defs>",
        f'<g transform="translate({f(L["lx"])} {f(L["ly"])}) scale({K})">{left}</g>',
        step(c1, n1, L["phones_mid"]),
        f'<text class="lgab-t lgab-m-t" x="{f(X0 + 4)}" y="{f(L["title"])}">Match rate by design</text>',
        f'<g transform="translate({f(X0 - 172 * SX)} {f(b - 118 * SY)}) scale({f(SX)} {f(SY)})">{hills}</g>',
        f'<path class="lgab-base" d="M{f(X0)} {f(b)}H{f(X1)}M{f(X1 - 3)} {f(b - 2.6)}L{f(X1)} {f(b)}L{f(X1 - 3)} {f(b + 2.6)}'
        f'M{f(X0)} {f(b)}V{f(top)}M{f(X0 - 2.6)} {f(top + 3)}L{f(X0)} {f(top)}L{f(X0 + 2.6)} {f(top + 3)}"/>',
        f'<text class="lgab-s lgab-m-s" x="{f(X0 - 7)}" y="{f((top + b) / 2)}" text-anchor="middle" transform="rotate(-90 {f(X0 - 7)} {f((top + b) / 2)})">How likely</text>',
        f'<g transform="translate(0 {f(b)})">'
        f'<g class="lgab-m-tx-a"><text class="lgab-arm lgab-a lgab-m-arm" x="-2" y="{f(ly)}" text-anchor="end">A · Border</text></g>'
        f'<g class="lgab-m-tx-b"><text class="lgab-arm lgab-b lgab-m-arm" x="2" y="{f(ly)}">B · Badge</text></g></g>',
        f'<text class="lgab-s lgab-m-s" x="{f(X1 - 2)}" y="{f(L["xlab"])}" text-anchor="end">Match rate</text>',
        step(c2, n2, L["chart_mid"]),
        "</svg>",
    ]
    return "\n".join(out) + "\n"


def css(dots, span, L):
    ease = "cubic-bezier({},{},{},{})".format(*EASE)
    rise = (HILL["h"][1] - HILL["h"][0]) * SY
    out = [
        "/* Phone-only League A/B (<= 736px), generated by league-ab-motion-m.py.",
        f"   The left group is the desktop group drawn {K}x and the hills the desktop",
        "   hills in a scaled plot, so the desktop's generated lgab-* motion drives",
        "   both unchanged; only the hill labels, kept unscaled, have -m keyframes,",
        "   on the same spans and curve, so each still rides its peak. */",
        f".internship-demo-card__plot > svg.lgab-scene--m {{ aspect-ratio: {W} / {L['h']}; }}",
        f".lgab-scene--m .lgab-m-cap text {{ font-size: {CAP}px; }}",
        f".lgab-scene--m .lgab-m-t {{ font-size: {TITLE}px; }}",
        f".lgab-scene--m .lgab-m-s {{ font-size: {AXIS}px; }}",
        f".lgab-scene--m .lgab-m-arm {{ font-size: {LABEL}px; }}",
        f'.lgab-scene--m .lgab-m-note {{ font-family: "Merriweather", Georgia, serif; font-size: {NOTE}px; font-weight: 300; fill: #596273; }}',
    ]
    for k in "ab":
        out.append(f".lgab-scene--m .lgab-m-tx-{k} {{ transform: translateX({f(X(HILL[k][1]))}px); }}")
    for k in "ab":
        s, e = span[k]
        out.append(f".is-playing .lgab-scene--m .lgab-m-tx-{k} {{ animation: lgab-m-tx-{k} {f(e - s)}s {ease} {f(s)}s both, lgab-show .6s ease {f(s + 0.6)}s both; }}")
    out.append(f"/* A label rides its hill's peak: {f(rise)} lower at the start, 4.5 above it throughout. */")
    for k in "ab":
        x0, x1 = HILL[k]
        out.append(f"@keyframes lgab-m-tx-{k} {{ from {{ transform: translate({f(X(x0))}px, {f(rise)}px); }} to {{ transform: translate({f(X(x1))}px, 0); }} }}")
    return "\n".join(out) + "\n"


def main():
    dots, span = solve()
    for i, d in enumerate(dots, 1):
        print(f"{i:2} {d['arm']} launch {d['launch']:.2f}s  arrive {d['arrive']:.2f}s  trip {d['arrive'] - d['launch']:.2f}s  "
              f"dist {d['dist']:5.1f}  v1 {d['v1']:4.1f}")
    for k in "ab":
        print(f"lane {k}: {span[k][0]:.2f}s to {span[k][1]:.2f}s")
    problems = check(dots, span)
    for p in problems:
        print("problem:", p)
    L = layout()
    print("layout", {k: round(v, 1) for k, v in L.items()})
    if "--check" in sys.argv:
        sys.exit(1 if problems else 0)
    if problems:
        sys.exit("not written: fix the problems above")
    (HERE / "scene-m.html").write_text(html(L), encoding="utf-8", newline="\n")
    (HERE / "scene-m.css").write_text(css(dots, span, L), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
