"""Generate responsive image variants used by the static-site build.

tools/site/build.ps1 advertises matching -480, -800 and (journal banners only)
-1200 siblings in srcset. This script generates the broader 800px set for page
images wider than 1000px, plus a small, curated set of 480px travel-card
banners. It also closes complete journal responsive-coverage gaps when a
smaller variant reduces transferred bytes, and adds the -1200 journal-banner
tier (--banners-only runs just that step). Animated WebPs are intentionally
left unchanged.

--webp-tiers (5 Nov 2026, owner-approved) replaces the -480.jpg/-800.jpg tiers
of JPEG originals with -480.webp/-800.webp, which build.ps1 then prefers. Each
tier is resized from the original exactly like its JPEG (RGB, LANCZOS, the
JPEG's own dimensions and ICC profile) and encoded at the lowest WebP quality
whose luma SSIM against the uncompressed resize is at least the JPEG tier's
own. An original switches only when every one of its tiers comes out at most
WEBP_TIER_MAX_RATIO of the JPEG's bytes, so a photo never mixes .webp and .jpg
tiers. Journal banners (6 Nov 2026, owner-approved) also switch their -1200
tier, under the same rule, so a banner's srcset never mixes formats either.
WebP-overlaid and animated originals are skipped, and originals are never
re-encoded. The run then deletes each replaced JPEG tier
that no tracked source names (og images and unreviewed explore-covers.json
thumbnails keep theirs); rerun it after updating those to prune the rest. Pass
--report <csv> to record the per-tier qualities, sizes and SSIMs. Needs
scikit-image.

--phone-banners writes only the phone-only banner crops recorded in
phone-banner-crops.json.
"""
import argparse
import csv
import io
import json
import re
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
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
parser.add_argument("--webp-tiers", action="store_true")
parser.add_argument("--report", type=Path)
parser.add_argument("--phone-banners", action="store_true",
                    help="write the phone-only banner crops in phone-banner-crops.json")
args = parser.parse_args()


def has_tier(source: Path, width: int) -> bool:
    """A JPEG original's tier may be a .jpg or, after --webp-tiers, a .webp."""
    suffixes = (".webp",) if source.suffix.lower() == ".webp" else (".jpg", ".webp")
    return any(source.with_name(source.stem + f"-{width}{suffix}").exists() for suffix in suffixes)


def make_variant(path: Path, target_width: int, keep_only_if_smaller: bool = False,
                 quality: int = QUALITY) -> None:
    with Image.open(path) as image:
        if image.size[0] <= target_width:
            return
        target = path.with_name(path.stem + f"-{target_width}.jpg")
        if path.with_name(path.stem + f"-{target_width}.webp").exists():
            return
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
        if any(has_tier(source, width) for width in WEBP_TARGET_WIDTHS):
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
        if not has_tier(source, 800) or has_tier(source, 480):
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
        if target.exists() or target.with_suffix(".webp").exists():  # --webp-tiers may have switched it
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


WEBP_TIER_WIDTHS = (480, 800)
BANNER_TIER_WIDTHS = (480, 800, 1200)
# A tenth for banners too: swapping a tier's format adds no file or srcset entry,
# unlike the -1200 tier's "a fifth", which weighs an extra file against the original.
WEBP_TIER_MAX_RATIO = 0.9
WEBP_TIER_QUALITY_RANGE = (50, 95)
# Tracked text that can name an image tier directly (og images, covers, partials).
TIER_REFERENCE_GLOBS = ("*.html", "journals/*.html", "journals/*.json", "partials/*.html",
                        "assets/js/*.js", "assets/css/*.css", "tools/site/*.ps1")


def journal_banner_sources() -> set[Path]:
    banners = set()
    for page in ALL_JOURNAL_PAGES:
        html = page.read_text(encoding="utf-8")
        for tag in re.findall(r'<img\b[^>]*class="[^"]*\bjournal-banner\b[^"]*"[^>]*>', html):
            reference = re.search(r'src="(images/[^"]+)"', tag).group(1)
            banners.add((ROOT / reference).resolve())
    return banners


def luma(image: Image.Image):
    import numpy
    return numpy.asarray(image.convert("L"), dtype=numpy.float64)


def ssim(reference, image: Image.Image) -> float:
    from skimage.metrics import structural_similarity
    return structural_similarity(reference, luma(image), data_range=255)


def plan_webp_tiers(source: Path, widths: tuple[int, ...] = WEBP_TIER_WIDTHS) -> dict:
    """Encode every JPEG tier of one original as WebP in memory; never writes."""
    tiers = []
    with Image.open(source) as image:
        if getattr(image, "n_frames", 1) > 1:
            return {"source": source, "tiers": [], "keep": False, "why": "animated"}
        rgb = image.convert("RGB")
    for width in widths:
        jpeg_path = source.with_name(source.stem + f"-{width}.jpg")
        if not jpeg_path.exists():
            continue
        with Image.open(jpeg_path) as jpeg:
            jpeg.load()
            # A tier left over from before the original was re-cropped has another
            # shape; matching its SSIM means nothing, so leave the photo for a person.
            if jpeg.size[0] != width or abs(jpeg.size[1] - rgb.size[1] * width / rgb.size[0]) > 1:
                return {"source": source, "tiers": [], "keep": False,
                        "why": f"stale {jpeg_path.name} is {jpeg.size[0]}x{jpeg.size[1]}"}
            icc = jpeg.info.get("icc_profile")
            resized = rgb.resize(jpeg.size, Image.LANCZOS)
            reference = luma(resized)
            target = ssim(reference, jpeg)
        options = {"method": 6}
        if icc:
            options["icc_profile"] = icc
        encoded = {}

        def encode(quality: int):
            if quality not in encoded:
                buffer = io.BytesIO()
                resized.save(buffer, "WEBP", quality=quality, **options)
                data = buffer.getvalue()
                with Image.open(io.BytesIO(data)) as decoded:
                    encoded[quality] = (data, ssim(reference, decoded))
            return encoded[quality]

        low, high = WEBP_TIER_QUALITY_RANGE
        tier = {"width": width, "jpeg": jpeg_path, "target": target,
                "jpeg_bytes": jpeg_path.stat().st_size, "quality": None}
        if encode(high)[1] >= target:
            while low < high:  # lowest quality that still matches the JPEG's SSIM
                middle = (low + high) // 2
                if encode(middle)[1] >= target:
                    high = middle
                else:
                    low = middle + 1
            tier["quality"] = high
            tier["data"], tier["ssim"] = encode(high)
        tiers.append(tier)
    keep = bool(tiers) and all(
        tier["quality"] is not None and len(tier["data"]) <= tier["jpeg_bytes"] * WEBP_TIER_MAX_RATIO
        for tier in tiers
    )
    why = "" if keep else ("no JPEG tiers" if not tiers else "WebP not a tenth smaller at equal SSIM")
    return {"source": source, "tiers": tiers, "keep": keep, "why": why}


def named_tier_references() -> set[str]:
    tracked = subprocess.run(["git", "ls-files", *TIER_REFERENCE_GLOBS], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.split()
    names = set()
    for relative in tracked:
        text = (ROOT / relative).read_text(encoding="utf-8")
        names.update(re.findall(r"images/[^\"'\s,)]+-(?:480|800|1200)\.jpg", text))
    return names


def prune_replaced_jpeg_tiers() -> None:
    named = named_tier_references()
    kept = removed = 0
    for jpeg in sorted((ROOT / "images").rglob("*.jpg")):
        if not re.fullmatch(r".+-(?:480|800|1200)\.jpg", jpeg.name) or not jpeg.with_suffix(".webp").exists():
            continue
        if jpeg.relative_to(ROOT).as_posix() in named:
            kept += 1
            continue
        jpeg.unlink()
        removed += 1
    print(f"Removed {removed} replaced JPEG tiers; kept {kept} that a source still names.")


def generate_webp_tiers() -> None:
    banners = journal_banner_sources()
    sources = set()
    for jpeg in (ROOT / "images").rglob("*.jpg"):
        match = re.fullmatch(r"(.+)-(?:480|800)\.jpg", jpeg.name)
        if not match:
            continue
        original = next((jpeg.with_name(match.group(1) + suffix) for suffix in (".jpg", ".jpeg")
                         if jpeg.with_name(match.group(1) + suffix).exists()), None)
        if original is None:
            continue
        overlay = ROOT / "images-webp" / original.relative_to(ROOT / "images").with_suffix(".webp")
        if overlay.exists() or any(original.with_name(original.stem + f"-{width}.webp").exists()
                                   for width in BANNER_TIER_WIDTHS):
            continue
        sources.add(original)
    with ThreadPoolExecutor() as pool:
        plans = list(pool.map(lambda source: plan_webp_tiers(
            source, BANNER_TIER_WIDTHS if source.resolve() in banners else WEBP_TIER_WIDTHS), sorted(sources)))
    rows = []
    for plan in plans:
        for tier in plan["tiers"]:
            rows.append([plan["source"].relative_to(ROOT).as_posix(), tier["width"], tier["quality"],
                         tier["jpeg_bytes"], len(tier["data"]) if "data" in tier else "",
                         f'{tier["target"]:.5f}', f'{tier["ssim"]:.5f}' if "ssim" in tier else "",
                         plan["keep"]])
            if plan["keep"]:
                tier["jpeg"].with_suffix(".webp").write_bytes(tier["data"])
        if not plan["keep"]:
            print(f"Keeping JPEG tiers: {plan['source'].relative_to(ROOT)} ({plan['why']})")
    switched = [plan for plan in plans if plan["keep"]]
    before = sum(tier["jpeg_bytes"] for plan in switched for tier in plan["tiers"])
    after = sum(len(tier["data"]) for plan in switched for tier in plan["tiers"])
    print(f"WebP tiers for {len(switched)} of {len(plans)} originals: "
          f"{before // 1024} KB of JPEG tiers -> {after // 1024} KB")
    if args.report:
        with open(args.report, "w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["source", "width", "webp_quality", "jpeg_bytes", "webp_bytes",
                             "jpeg_ssim", "webp_ssim", "switched"])
            writer.writerows(rows)
    prune_replaced_jpeg_tiers()


if args.webp_tiers:
    generate_webp_tiers()
    raise SystemExit

PHONE_BANNER_CROPS = Path(__file__).with_name("phone-banner-crops.json")


def generate_phone_banner_crops() -> None:
    """Phone-only WebP crops of journal banners (5 Nov 2026, owner-approved).
    Phones show a cover-fit strip of the banner, so each srcset tier gets a
    sibling cut to the rows phones can see. The boxes, qualities and how they
    were chosen live in phone-banner-crops.json; this checks each box still
    frames every phone width exactly, then writes missing files. Originals
    are never re-encoded."""
    config = json.loads(PHONE_BANNER_CROPS.read_text(encoding="utf-8"))
    for banner in config["banners"]:
        source = ROOT / banner["source"]
        focus = banner["objectPositionY"]
        with Image.open(source) as image:
            source_size = image.size
        for variant in banner["variants"]:
            width, height = variant["width"], variant["height"]
            left, top, right, bottom = variant["crop"]
            crop_height = bottom - top
            expected_height = source_size[1] if width == source_size[0] else round(source_size[1] * width / source_size[0])
            band = width / banner["narrowestPhoneAspect"] * banner["margin"]
            if (height != expected_height or (left, right) != (0, width) or crop_height < band
                    or (height - crop_height) * focus != top * 100):
                raise SystemExit(f"{source.name} {width}w: crop {variant['crop']} no longer frames the phone band")
            target = source.with_name(f"{source.stem}-phone-{width}.webp")
            if target.exists():
                continue
            with Image.open(source) as image:
                icc = image.info.get("icc_profile")
                frame = image.convert("RGB")
                if width != source_size[0]:
                    frame = frame.resize((width, height), Image.LANCZOS)
                frame = frame.crop((left, top, right, bottom))
                options = {"quality": variant["quality"], "method": 6}
                if icc:
                    options["icc_profile"] = icc
                frame.save(target, "WEBP", **options)
            print(f"{source.name} -> {target.name} ({target.stat().st_size // 1024} KB)")


if args.phone_banners:
    generate_phone_banner_crops()
    raise SystemExit

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
