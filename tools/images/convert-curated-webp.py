from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "images"
OUTPUT = ROOT / "images-webp"
FILES = [
    "personal/house/house_1.jpg",
    "personal/house/house_2.jpg",
    "personal/house/house_3.jpg",
    "personal/house/house_4.jpg",
    "personal/house/house_6.jpg",
    "personal/house/house_7.jpg",
    "personal/house/house_8.jpg",
    "personal/house/house_12.jpg",
    "personal/house/house_18.jpg",
    "personal/house/house_21.jpg",
    "personal/house/house_22.jpg",
    "travel/2025_japan/day1_hiroshima/hiro3.jpg",
    "travel/2025_japan/day14_hakone/hakone3.jpg",
    "travel/2025_japan/day14_hakone/owakudani3.jpg",
    "travel/2025_japan/day2_hiroshima/hiro5.jpg",
    "travel/2025_japan/day14_hakone/hakone2.jpg",
    "travel/2025_japan/day2_hiroshima/hiro9.jpg",
    "travel/2025_japan/day7_uji/kyoto4.jpg",
    "travel/2025_japan/day16_tokyo/tokyo3.jpg",
    "travel/2024_germany/duisburg/duisburg4.jpg",
    "travel/2025_japan/day8_amanohashidate/kyoto5.jpg",
    "travel/2025_japan/day3_osaka/osaka4.jpg",
    "travel/2025_japan/day3_osaka/osaka2.jpg",
]

ANIMATED_FILES = []

files = [SOURCE / path for path in FILES if (SOURCE / path).exists()]

for source in files:
    relative = source.relative_to(SOURCE).with_suffix(".webp")
    target = OUTPUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.convert("RGB").save(target, "WEBP", quality=65, method=6)
    print(f"{source}: {source.stat().st_size:,} -> {target.stat().st_size:,}")

for source in [SOURCE / path for path in ANIMATED_FILES if (SOURCE / path).exists()]:
    relative = source.relative_to(SOURCE).with_suffix(".webp")
    target = OUTPUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        frames = []
        durations = []
        pending_duration = 0
        frame_count = getattr(image, "n_frames", 1)
        for index in range(frame_count):
            image.seek(index)
            pending_duration += image.info.get("duration", 100)
            if index % 2 == 1 or index == frame_count - 1:
                frames.append(image.convert("RGB").copy())
                durations.append(pending_duration)
                pending_duration = 0
        frames[0].save(
            target,
            "WEBP",
            save_all=True,
            append_images=frames[1:],
            loop=image.info.get("loop", 0),
            duration=durations,
            quality=65,
            method=4,
        )
    print(f"{source}: {source.stat().st_size:,} -> {target.stat().st_size:,}")
