"""Generate responsive JPEG variants used by the static-site build.

tools/site/build.ps1 advertises matching -480.jpg and -800.jpg siblings in srcset.
This script generates the broader 800px set for page images wider than 1000px,
plus a small, curated set of 480px travel-card banners. Use
--mobile-cards-only to avoid regenerating the broader 800px set.
"""
import argparse
import json
import re
import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PAGES = list(ROOT.glob("*.html"))
MANIFEST = json.loads((ROOT / "journals/manifest.json").read_text(encoding="utf-8"))
PAGES.extend(ROOT / entry["source"] for entry in MANIFEST if entry.get("contentOnly"))
MIN_WIDTH = 1000
TARGET_WIDTH = 800
QUALITY = 78
MOBILE_CARD_IMAGES = {
    ROOT / "images/travel/2019_sv/SF_sutro_sunset.jpg",
    ROOT / "images/travel/2022_europe/europe_cover.jpg",
    ROOT / "images/travel/2023_perth/perth_card.jpg",
    ROOT / "images/travel/2023_usa_canada/cover_photo.jpg",
    ROOT / "images/travel/2024_australia/banner.jpg",
    ROOT / "images/travel/2024_germany/germany_banner_card.jpg",
    ROOT / "images/travel/2024_germany/germany_banner_image.jpg",
    ROOT / "images/travel/2025_japan/japan_banner_japan.jpg",
}

parser = argparse.ArgumentParser()
parser.add_argument("--mobile-cards-only", action="store_true")
args = parser.parse_args()


def make_variant(path: Path, target_width: int) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width:
            return
        target = path.with_name(path.stem + f"-{target_width}.jpg")
        ratio = target_width / image.size[0]
        resized = image.convert("RGB").resize(
            (target_width, round(image.size[1] * ratio)), Image.LANCZOS
        )
        resized.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    print(
        f"{path} ({os.path.getsize(path)//1024} KB) -> "
        f"{target} ({os.path.getsize(target)//1024} KB)"
    )


for path in sorted(MOBILE_CARD_IMAGES):
    if path.exists():
        make_variant(path, 480)

if args.mobile_cards_only:
    raise SystemExit

seen = set()
for page in PAGES:
    html = page.read_text(encoding="utf-8")
    for src in re.findall(r'src="(images/[^"]+\.(?:jpg|jpeg))"', html):
        if src in seen:
            continue
        seen.add(src)
        path = ROOT / src
        if not path.exists():
            continue
        with Image.open(path) as image:
            if image.size[0] <= MIN_WIDTH:
                continue
        make_variant(path, TARGET_WIDTH)
