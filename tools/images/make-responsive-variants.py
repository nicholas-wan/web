"""Generate responsive image variants used by the static-site build.

tools/site/build.ps1 advertises matching -480, -800 and (journal banners only)
-1200 siblings in srcset. This script generates the broader 800px set for page
images wider than 1000px, plus a small, curated set of 480px travel-card
banners. It also closes complete journal responsive-coverage gaps when a
smaller variant reduces transferred bytes, and adds the -1200 journal-banner
tier (--banners-only runs just that step). Animated WebPs are intentionally
left unchanged.
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
ALL_JOURNAL_PAGES = [ROOT / entry["source"] for entry in MANIFEST]
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
parser.add_argument("--banners-only", action="store_true")
args = parser.parse_args()


def make_variant(path: Path, target_width: int, keep_only_if_smaller: bool = False,
                 quality: int = QUALITY) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width:
            return
        target = path.with_name(path.stem + f"-{target_width}.jpg")
        ratio = target_width / image.size[0]
        resized = image.convert("RGB").resize(
            (target_width, round(image.size[1] * ratio)), Image.LANCZOS
        )
        resized.save(target, "JPEG", quality=quality, optimize=True, progressive=True)
    if keep_only_if_smaller and target.stat().st_size >= path.stat().st_size:
        target.unlink()
        print(f"Skipping non-beneficial variant: {path.name} at {target_width}px")
        return
    print(
        f"{path} ({os.path.getsize(path)//1024} KB) -> "
        f"{target} ({os.path.getsize(target)//1024} KB)"
    )


def make_webp_variant(path: Path, target_width: int, keep_only_if_smaller: bool = False,
                      quality: int = WEBP_QUALITY) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width or getattr(image, "n_frames", 1) > 1:
            return
        target = path.with_name(path.stem + f"-{target_width}.webp")
        ratio = target_width / image.size[0]
        resized = image.convert("RGB").resize(
            (target_width, round(image.size[1] * ratio)), Image.LANCZOS
        )
        resized.save(target, "WEBP", quality=quality, method=6)
    if keep_only_if_smaller and target.stat().st_size >= path.stat().st_size:
        target.unlink()
        print(f"Skipping non-beneficial variant: {path.name} at {target_width}px")
        return
    print(
        f"{path} ({os.path.getsize(path)//1024} KB) -> "
        f"{target} ({os.path.getsize(target)//1024} KB)"
    )


def referenced_journal_sources(pages: list[Path] = JOURNAL_PAGES) -> list[tuple[str, Path]]:
    references = set()
    for page in pages:
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


def generate_gallery_480_variants() -> None:
    """Journal gallery tiles render five-up on desktop, 129px wide at a 737px
    viewport and 325px at 1920px, so the build advertises a 20vw desktop slot
    (see Add-ImagePerformanceAttributes in tools/site/build.ps1). That slot
    selects a 480w source on 1x screens, but the build only lists -480 when the
    file exists; without it the browser falls back to -800. Give every journal
    source that already has an -800 sibling a -480 one as well, kept only when
    it is genuinely smaller. Animated sources are left alone."""
    for reference, source in referenced_journal_sources(ALL_JOURNAL_PAGES):
        variant_suffix = ".webp" if source.suffix.lower() == ".webp" else ".jpg"
        has_800 = source.with_name(source.stem + f"-800{variant_suffix}").exists()
        target = source.with_name(source.stem + f"-480{variant_suffix}")
        if not has_800 or target.exists():
            continue
        with Image.open(source) as image:
            if getattr(image, "n_frames", 1) > 1 or image.size[0] <= 480:
                continue
        if source.suffix.lower() == ".webp":
            make_webp_variant(source, 480, keep_only_if_smaller=True)
        else:
            make_variant(source, 480, keep_only_if_smaller=True)


# 2:1 banners that phones crop with object-fit: cover into a ~1.58:1 box: a
# DPR-3 phone needs ~1364 device px of width, so a 1200 tier would upscale them.
BANNER_1200_SKIP = {"seoul-winter-banner", "canton-tower-sunset-banner"}


def generate_banner_1200_variants() -> None:
    """Journal banners keep a truthful 100vw phone slot, so a DPR-3 phone
    (~1170 device px) skipped -800 and fetched the 1470-1920px original, up to
    463 KB for the LCP image. A -1200 tier still covers 1170 device px without
    upscaling. Encoded at the banners' own q82 (WebP q80) so the hero does not
    soften, and kept only when it saves at least a fifth of the bytes."""
    for page in ALL_JOURNAL_PAGES:
        html = page.read_text(encoding="utf-8")
        banner = re.search(r'<img\b[^>]*class="[^"]*\bjournal-banner\b[^"]*"[^>]*>', html)
        if not banner:
            continue
        reference = re.search(r'src="(images/[^"]+)"', banner.group(0)).group(1)
        source = next((s for r, s in referenced_journal_sources([page]) if r == reference), None)
        if source is None:
            continue
        if source.stem in BANNER_1200_SKIP:
            continue
        webp = source.suffix.lower() == ".webp"
        target = source.with_name(source.stem + ("-1200.webp" if webp else "-1200.jpg"))
        if target.exists():
            continue
        with Image.open(source) as image:
            if image.size[0] <= 1400:
                continue
        if webp:
            make_webp_variant(source, 1200, quality=80)
        else:
            make_variant(source, 1200, quality=82)
        if target.exists() and target.stat().st_size > source.stat().st_size * 0.8:
            target.unlink()
            print(f"Skipping low-value banner variant: {target.name}")


if args.banners_only:
    generate_banner_1200_variants()
    raise SystemExit

generate_missing_responsive_sets()
generate_gallery_480_variants()

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

# Last, so --coverage-gaps-only and --mobile-cards-only stay limited to their
# own outputs. A banner whose tier saves too little is re-evaluated each run.
generate_banner_1200_variants()
