"""Convert all remaining GIF references to animated WebP.

For every images/*.gif referenced by the root HTML pages:
- writes an animated WebP (every 2nd frame, quality 65) to images-webp/,
  mirroring tools/images/convert-curated-webp.py
- rewrites the HTML reference from .gif to .webp
- prints the gif relative paths (backslash form) for tools/site/build.ps1's
  $optimizedAnimatedImages list, which removes the legacy .gif from dist

Also caps static WebPs in images-webp/ to 1600px on the longest side
(they were converted from full-resolution camera JPGs).
"""
import re
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "images"
OUTPUT = ROOT / "images-webp"
MAX_DIM = 1600

pages = list(ROOT.glob("*.html"))
manifest = json.loads((ROOT / "journals/manifest.json").read_text(encoding="utf-8"))
pages.extend(ROOT / entry["source"] for entry in manifest if entry.get("contentOnly"))

# --- Animated GIF -> WebP ---------------------------------------------------
gif_refs = set()
for page in pages:
    gif_refs.update(re.findall(r'src="(images/[^"]+\.gif)"', page.read_text(encoding="utf-8")))

converted = []
for ref in sorted(gif_refs):
    source = ROOT / ref
    if not source.exists():
        continue
    relative = source.relative_to(SOURCE)
    target = OUTPUT / relative.with_suffix(".webp")
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
    before = source.stat().st_size
    after = target.stat().st_size
    if after >= before:
        target.unlink()
        print(f"KEPT {source} (webp would grow {before//1024} -> {after//1024} KB)")
        continue
    converted.append(str(relative).replace("/", "\\"))
    print(f"{source}: {before//1024} KB -> {after//1024} KB")

# Rewrite HTML references for converted gifs only.
converted_gif_refs = {"images/" + c.replace("\\", "/") for c in converted}
for page in pages:
    text = page.read_text(encoding="utf-8")
    updated = text
    for gif in converted_gif_refs:
        updated = updated.replace(f'src="{gif}"', f'src="{gif[:-4]}.webp"')
    if updated != text:
        page.write_text(updated, encoding="utf-8", newline="\n")
        print(f"rewrote refs in {page.name}")

# --- Cap static WebPs --------------------------------------------------------
print("\n--- static webp capping ---")
for webp in OUTPUT.rglob("*.webp"):
    with Image.open(webp) as image:
        if getattr(image, "n_frames", 1) > 1:
            continue
        w, h = image.size
        if max(w, h) <= MAX_DIM:
            continue
        scale = MAX_DIM / max(w, h)
        resized = image.convert("RGB").resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    before = webp.stat().st_size
    resized.save(webp, "WEBP", quality=70, method=6)
    print(f"{webp} {w}x{h} -> capped  {before//1024} KB -> {webp.stat().st_size//1024} KB")

print("\n--- add to $optimizedAnimatedImages in tools/site/build.ps1 ---")
for c in converted:
    print(f'    "{c}",')
