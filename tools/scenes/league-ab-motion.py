"""Motion for the League A/B peek (the users, lanes, die and hills).

usage: python -I tools/scenes/league-ab-motion.py [--check]

Rewrites the generated block at the end of assets/css/internship-peek.css and
the scene's user dots in experience.html. --check prints the timetable and
only verifies, writing nothing.

One model drives everything, so nothing steps. The story ends about when
the risky-profile scene's does, about 5.7s (owner, 25 Oct 2026), so keep
the last arrival near 5.1s when retuning.
- The die deals a user every DEAL seconds, in the arm order ARMS.
- Each user leaves the die (hidden behind it) and rides its lane like a
  conveyor, every dot at the same SPEED, so dots in a lane keep their
  spacing and none catches another. Over the last DOCK seconds it eases,
  at a constant deceleration, to the lane front's own speed and lands on
  it. It turns from a light bead to the bar's colour late in its cruise, so
  it brakes as the bar's tip (no pale spot on the tip), then rides the tip,
  solid, and vanishes under the same-coloured bar end.
- A lane's bar appears at once under its first bead and moves off at that
  bead's landing speed: its curve starts at its average speed rather than
  from rest, so no bar is ever a still dot (rejected twice by the owner).
- Each lane front fills on one eased curve from its first arrival to its
  last; the arm's hill grows, narrows and glides on the very same curve, so
  the chart moves exactly with its bar.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSS = ROOT / "assets" / "css" / "internship-peek.css"
HTML = ROOT / "experience.html"

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


def css(dots, span):
    f = lambda x: f"{x:.3f}".rstrip("0").rstrip(".") if abs(x) >= 1e-4 else "0"
    ease = "cubic-bezier({},{},{},{})".format(*EASE)
    win = max(span["a"][1], span["b"][1]) + WIN_AFTER
    out = [
        "/* Generated by tools/scenes/league-ab-motion.py, which explains the model:",
        "   edit and rerun it rather than this block. Playing: the designs first",
        "   (eased out gently, no snap), then the traffic. */",
        ".is-playing .lgab-scene .lgab-frame-g { animation: lgab-frame .7s cubic-bezier(.33,1,.68,1) .25s both; }",
        ".is-playing .lgab-scene .lgab-badge-g { animation: lgab-pop .7s cubic-bezier(.33,1,.68,1) .55s both; }",
        f".is-playing .lgab-scene .lgab-heart {{ animation: lgab-beat .5s ease-in-out 1s both, lgab-beat-win .6s ease-in-out {f(win)}s; }}",
    ]
    for i, d in enumerate(dots, 1):
        out.append(f".is-playing .lgab-scene .lgab-users circle:nth-of-type({i}) {{ animation: lgab-deal-{i} {f(d['arrive'] - d['launch'] + MERGE)}s {f(d['launch'])}s backwards; }}")
    # The die rocks as a slow sine, a swing per two deals, easing in and out.
    start, end = FIRST - 0.25, dots[-1]["launch"] + 0.35
    half = 2 * DEAL
    n = max(2, round((end - start) / half))
    half = (end - start) / n
    out.append(f".is-playing .lgab-scene .lgab-die {{ animation: lgab-rock {f(end - start)}s linear {f(start)}s both; }}")
    for k in "ab":
        s, e = span[k]
        out.append(f".is-playing .lgab-scene .lgab-fill-{k} {{ animation: lgab-fill {f(e - s)}s {ease} {f(s)}s both, lgab-show .001s linear {f(s)}s both; }}")
        out.append(f".is-playing .lgab-scene .lgab-hill-{k} {{ animation: lgab-narrow {f(e - s)}s {ease} {f(s)}s both; }}")
        out.append(f".is-playing .lgab-scene .lgab-hx-{k} {{ animation: lgab-x-{k} {f(e - s)}s {ease} {f(s)}s both, lgab-show .4s ease {f(s)}s both; }}")
        out.append(f".is-playing .lgab-scene .lgab-tx-{k} {{ animation: lgab-tx-{k} {f(e - s)}s {ease} {f(s)}s both, lgab-show .6s ease {f(s + 0.6)}s both; }}")
    out.append(f".is-playing .lgab-scene .lgab-hill-b .lgab-hill-area {{ animation: lgab-deepen .6s ease {f(win)}s both; }}")
    out.append(f".is-playing .lgab-scene .lgab-hill-b .lgab-hill-line {{ animation: lgab-bolden .6s ease {f(win)}s both; }}")
    out += [
        "",
        "@keyframes lgab-show { from { opacity: 0; } to { opacity: 1; } }",
        "@keyframes lgab-pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }",
        "@keyframes lgab-frame { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: none; } }",
        "@keyframes lgab-beat { 0%, 100% { transform: none; } 35% { transform: scale(1.35); } 60% { transform: scale(.95); } }",
        "@keyframes lgab-beat-win { 0%, 100% { transform: none; } 45% { transform: scale(1.2); } }",
        "@keyframes lgab-bolden { from { stroke-width: 1.6; } to { stroke-width: 2.2; } }",
        "@keyframes lgab-deepen { from { fill-opacity: .16; } to { fill-opacity: .3; } }",
        f"@keyframes lgab-fill {{ from {{ stroke-dashoffset: {f(LANE)}px; }} to {{ stroke-dashoffset: 0; }} }}",
        f"@keyframes lgab-narrow {{ from {{ transform: scale({HILL['sd'][0]}, {HILL['h'][0]}); }} to {{ transform: scale({HILL['sd'][1]}, {HILL['h'][1]}); }} }}",
    ]
    rise = HILL["h"][1] - HILL["h"][0]
    out.append(f"/* A label rides its hill's peak: {rise} lower at the start, 4.5 above it throughout. */")
    for k in "ab":
        x0, x1 = HILL[k]
        out.append(f"@keyframes lgab-x-{k} {{ from {{ transform: translateX({x0}px); }} to {{ transform: translateX({x1}px); }} }}")
        out.append(f"@keyframes lgab-tx-{k} {{ from {{ transform: translate({x0}px, {rise}px); }} to {{ transform: translate({x1}px, 0); }} }}")
    # A dot: a linear cruise, then the dock (constant deceleration from SPEED
    # to the front's speed v1: a cubic-bezier with its handles at thirds), the
    # colour turning from 60% of the cruise to its end, then riding the tip,
    # solid; fill-mode backwards drops it to the base opacity 0 at the end,
    # under the bar's same-coloured end.
    for i, d in enumerate(dots, 1):
        trip = d["arrive"] - d["launch"]
        total = trip + MERGE
        land = 100 * trip / total
        cruise = 100 * (trip - DOCK) / total
        y1 = SPEED * DOCK / (3 * d["dock"])
        y2 = 1 - d["v1"] * DOCK / (3 * d["dock"])
        sg = SIGN[d["arm"]]
        xc, x, xe = sg * (d["dist"] - d["dock"]), sg * d["dist"], sg * (d["dist"] + d["v1"] * MERGE)
        light, dark = LIGHT[d["arm"]], DARK[d["arm"]]
        # A dot whose cruise is too short to turn colour once clear of the
        # die (8 units) stays dark throughout, so no half-pale bead pokes out.
        if 0.6 * (trip - DOCK) < 8 / SPEED:
            light = dark
        out.append(
            f"@keyframes lgab-deal-{i} {{ "
            f"0% {{ transform: translateX(0); fill: {light}; opacity: 1; animation-timing-function: linear; }} "
            f"{f(cruise * 0.6)}% {{ fill: {light}; animation-timing-function: linear; }} "
            f"{f(cruise)}% {{ transform: translateX({f(xc)}px); fill: {dark}; animation-timing-function: cubic-bezier(.3333,{f(y1)},.6667,{f(y2)}); }} "
            f"{f(land)}% {{ transform: translateX({f(x)}px); fill: {dark}; opacity: 1; animation-timing-function: linear; }} "
            f"100% {{ transform: translateX({f(xe)}px); fill: {dark}; opacity: 1; }} }}"
        )
    frames = ["@keyframes lgab-rock {", "  0% { transform: rotate(0deg); animation-timing-function: ease-in-out; }"]
    for j in range(1, n):
        t = j / n
        env = min(1.0, t * n / 1.5, (1 - t) * n / 1.5)
        frames.append(f"  {f(100 * t)}% {{ transform: rotate({f((-1) ** j * 4 * env)}deg); animation-timing-function: ease-in-out; }}")
    frames += ["  100% { transform: rotate(0deg); }", "}"]
    out += frames
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
    if "--check" in sys.argv:
        sys.exit(1 if problems else 0)
    if problems:
        sys.exit("not written: fix the problems above")
    text = CSS.read_text(encoding="utf-8")
    marker = "/* Generated by tools/scenes/league-ab-motion.py"
    head = text[: text.index(marker)] if marker in text else text[: text.index("/* Playing: the designs first")]
    CSS.write_text(head + css(dots, span), encoding="utf-8", newline="\n")
    html = HTML.read_text(encoding="utf-8")
    plain = '<circle class="lgab-u" cx="92" cy="15.5" r="2"/>' * len(ARMS)
    html, n = re.subn(r'(<g class="lgab-users">).*?(</g>)', lambda m: m.group(1) + plain + m.group(2), html, count=1, flags=re.S)
    assert n == 1
    HTML.write_text(html, encoding="utf-8", newline="")


if __name__ == "__main__":
    main()
