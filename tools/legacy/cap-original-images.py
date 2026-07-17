"""Cap original JPGs referenced by the given pages to 1600px on the longest side.

DESTRUCTIVE: resizes originals in place (quality 82, progressive). The
lightbox never shows more than ~1600px in practice, and the -800.jpg
variants (tools/images/make-responsive-variants.py) already serve typical viewports.
tools/site/build.ps1 re-reads dimensions at build time, so srcset width
descriptors self-correct on the next build.

Usage: python tools/legacy/cap-original-images.py journals/travel_2025_japan.html [more.html ...]
"""
import re
import os
import sys
from pathlib import Path

from PIL import Image

MAX_DIM = 1600
QUALITY = 82
ROOT = Path(__file__).resolve().parents[2]

pages = sys.argv[1:]
if not pages:
    sys.exit("Pass one or more HTML pages, e.g. travel_2025_japan.html")

seen = set()
before_total = after_total = count = 0
for page in pages:
    page_path = Path(page)
    if not page_path.is_absolute():
        page_path = ROOT / page_path
    html = page_path.read_text(encoding="utf-8")
    for src in re.findall(r'src="(images/[^"]+\.(?:jpg|jpeg))"', html):
        if src in seen or src.endswith("-800.jpg"):
            continue
        seen.add(src)
        path = ROOT / src
        if not path.exists():
            continue
        with Image.open(path) as image:
            w, h = image.size
            if max(w, h) <= MAX_DIM:
                continue
            scale = MAX_DIM / max(w, h)
            new_size = (round(w * scale), round(h * scale))
            resized = image.convert("RGB").resize(new_size, Image.LANCZOS)
            exif = image.info.get("exif")
        before = path.stat().st_size
        kwargs = {"quality": QUALITY, "optimize": True, "progressive": True}
        if exif:
            kwargs["exif"] = exif
        tmp = path.with_suffix(".tmp.jpg")
        resized.save(tmp, "JPEG", **kwargs)
        after = tmp.stat().st_size
        # Already-well-compressed originals can re-encode LARGER; keep those.
        if after >= before:
            tmp.unlink()
            print(f"{path} {w}x{h} kept (re-encode would grow {before//1024} -> {after//1024} KB)")
            continue
        os.replace(tmp, path)
        before_total += before
        after_total += after
        count += 1
        print(f"{path} {w}x{h} -> {new_size[0]}x{new_size[1]}  {before//1024} KB -> {after//1024} KB")

print(f"\nCapped {count} images: {before_total//1048576} MB -> {after_total//1048576} MB")
