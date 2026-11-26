"""Marks one lead photo per journal day of five or more photos (owner, 27 Nov 2026: "Lead photo is
ok but choose the highest resolution one").

On desktop the lead spans two columns and two rows of the four-up grid (`img[data-lead]`, see
docs/contracts/journals.md). The lead is the photo that keeps the most pixels in the tile's 4:3
crop, so it stays sharp at twice the size; most photos tie at the 1600px cap, and a tie goes to
the larger file, which at equal dimensions holds more detail. Tall collage tiles and animations
never lead. A gallery whose lead carries data-lead="pinned" is left alone, so a hand-picked lead
survives reruns. Reruns are idempotent.

    python -I tools/images/pick-lead-photos.py            # rewrite journals/*.html
    python -I tools/images/pick-lead-photos.py --check    # exit 1 if any journal would change
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MIN_PHOTOS = 5


class Galleries(HTMLParser):
    """Collects each masonry gallery's direct brick children and their first img or video."""

    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.lines = [0]
        for line in text.split('\n'):
            self.lines.append(self.lines[-1] + len(line) + 1)
        self.stack = []  # (tag, classes, gallery index or None, brick dict or None)
        self.galleries = []
        self.feed(text)

    def char_offset(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get('class') or '').split()
        gallery = brick = None
        parent = self.stack[-1] if self.stack else None
        if tag == 'div' and 'masonry' in classes:
            gallery = len(self.galleries)
            self.galleries.append([])
        elif tag == 'div' and 'brick' in classes and parent and parent[2] is not None and parent[3] is None:
            brick = {'tall': any('tall' in c for c in classes), 'img': None, 'video': False}
            self.galleries[parent[2]].append(brick)
        else:
            for entry in reversed(self.stack):
                if entry[3] is not None:
                    if tag == 'video':
                        entry[3]['video'] = True
                    elif tag == 'img' and entry[3]['img'] is None:
                        start = self.char_offset()
                        end = self.text.index('>', start) + 1
                        entry[3]['img'] = (start, end, a)
                    break
        if tag not in ('img', 'source', 'br', 'hr', 'input', 'meta', 'link'):
            self.stack.append((tag, classes, gallery, brick))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        while self.stack:
            top = self.stack.pop()
            if top[0] == tag:
                break


def source_file(src):
    rel = Path(src.split('?')[0])
    webp = ROOT / 'images-webp' / rel.relative_to('images').with_suffix('.webp')
    return webp if webp.exists() else ROOT / rel


def score(src):
    path = source_file(src)
    with Image.open(path) as im:
        w, h = im.size
    return (min(w, h * 4 / 3) * min(h, w * 3 / 4), path.stat().st_size)


def pick(text):
    clean = re.sub(r' data-lead(?!="pinned")(?:="")?', '', text)
    edits = []
    for bricks in Galleries(clean).galleries:
        if len(bricks) < MIN_PHOTOS:
            continue
        # The lead takes four cells of the four-column grid where it took one. Only lead a day that
        # then ends on a full row or one short (27 Nov 2026 review: 17 days ended on a lone photo
        # beside three empty cells, 20 more lost a full last row). Tall tiles take two cells.
        cells = sum(2 if b['tall'] else 1 for b in bricks) + 3
        if (4 - cells % 4) % 4 > 1:
            continue
        candidates = [b for b in bricks if b['img'] and not b['tall'] and not b['video']]
        if not candidates or any(b['img'][2].get('data-lead') == 'pinned' for b in candidates):
            continue
        best = max(candidates, key=lambda b: score(b['img'][2]['src']))
        start, end, _ = best['img']
        tag = clean[start:end]
        edits.append(start + len(tag) - (2 if tag.endswith('/>') else 1) - (1 if tag.endswith(' />') else 0))
    for at in sorted(edits, reverse=True):
        clean = clean[:at] + ' data-lead' + clean[at:]
    return clean, len(edits)


def main():
    check = '--check' in sys.argv
    stale = []
    for page in sorted((ROOT / 'journals').glob('travel_*.html')):
        text = page.read_text(encoding='utf-8')
        new, count = pick(text)
        if new != text:
            stale.append(page.name)
            if not check:
                page.write_text(new, encoding='utf-8', newline='')
        print(f'{page.name}: {count} lead photo(s){" (changed)" if new != text else ""}')
    if check and stale:
        print('Lead photos are out of date in: ' + ', '.join(stale))
        sys.exit(1)


if __name__ == '__main__':
    main()
