"""Generate responsive image variants used by the static-site build.

tools/site/build.ps1 advertises matching -480.jpg and -800.jpg siblings in srcset.
This script generates the broader 800px set for page images wider than 1000px,
plus a small, curated set of 480px travel-card banners. It also closes complete
journal responsive-coverage gaps when a smaller variant reduces transferred
bytes. Animated WebPs are intentionally left unchanged.
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
JOURNAL_PAGES = [ROOT / entry["source"] for entry in MANIFEST if entry.get("contentOnly")]
PAGES.extend(JOURNAL_PAGES)
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
WEBP_SOURCE_ROOTS = (ROOT / "images", ROOT / "images-webp")
WEBP_TARGET_WIDTHS = (480, 800)
WEBP_QUALITY = 72

parser = argparse.ArgumentParser()
parser.add_argument("--mobile-cards-only", action="store_true")
parser.add_argument("--coverage-gaps-only", action="store_true")
args = parser.parse_args()


def make_variant(path: Path, target_width: int, keep_only_if_smaller: bool = False) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width:
            return
        target = path.with_name(path.stem + f"-{target_width}.jpg")
        ratio = target_width / image.size[0]
        resized = image.convert("RGB").resize(
            (target_width, round(image.size[1] * ratio)), Image.LANCZOS
        )
        resized.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    if keep_only_if_smaller and target.stat().st_size >= path.stat().st_size:
        target.unlink()
        print(f"Skipping non-beneficial variant: {path.name} at {target_width}px")
        return
    print(
        f"{path} ({os.path.getsize(path)//1024} KB) -> "
        f"{target} ({os.path.getsize(target)//1024} KB)"
    )


def make_webp_variant(path: Path, target_width: int, keep_only_if_smaller: bool = False) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width or getattr(image, "n_frames", 1) > 1:
            return
        target = path.with_name(path.stem + f"-{target_width}.webp")
        ratio = target_width / image.size[0]
        resized = image.convert("RGB").resize(
            (target_width, round(image.size[1] * ratio)), Image.LANCZOS
        )
        resized.save(target, "WEBP", quality=WEBP_QUALITY, method=6)
    if keep_only_if_smaller and target.stat().st_size >= path.stat().st_size:
        target.unlink()
        print(f"Skipping non-beneficial variant: {path.name} at {target_width}px")
        return
    print(
        f"{path} ({os.path.getsize(path)//1024} KB) -> "
        f"{target} ({os.path.getsize(target)//1024} KB)"
    )


def referenced_journal_sources() -> list[tuple[str, Path]]:
    references = set()
    for page in JOURNAL_PAGES:
        html = page.read_text(encoding="utf-8")
        references.update(re.findall(r'src="(images/[^"]+\.(?:jpg|jpeg|webp))"', html))

    resolved = []
    for reference in sorted(references):
        relative = Path(reference).relative_to("images")
        candidates = []
        if relative.suffix.lower() in {".jpg", ".jpeg"}:
            candidates.append((ROOT / "images-webp" / relative).with_suffix(".webp"))
        else:
            candidates.extend(root / relative for root in WEBP_SOURCE_ROOTS)
        candidates.append(ROOT / reference)
        source = next((candidate for candidate in candidates if candidate.exists()), None)
        if source is not None:
            resolved.append((reference, source))
    return resolved


def generate_missing_responsive_sets() -> None:
    for reference, source in referenced_journal_sources():
        variant_suffix = ".webp" if source.suffix.lower() == ".webp" else ".jpg"
        if any(
            source.with_name(source.stem + f"-{width}{variant_suffix}").exists()
            for width in WEBP_TARGET_WIDTHS
        ):
            continue
        with Image.open(source) as image:
            if getattr(image, "n_frames", 1) > 1:
                continue
        print(f"Closing responsive coverage gap: {reference}")
        for target_width in WEBP_TARGET_WIDTHS:
            if source.suffix.lower() == ".webp":
                make_webp_variant(source, target_width, keep_only_if_smaller=True)
            else:
                make_variant(source, target_width, keep_only_if_smaller=True)


generate_missing_responsive_sets()

if args.coverage_gaps_only:
    raise SystemExit


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
