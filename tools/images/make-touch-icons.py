"""Regenerate the home-screen icons (apple-touch-icon + manifest icons).

The icon is the owner-approved dark-field "NW" monogram: geometric letter
polygons authored in a 180x180 coordinate space, rendered at 8x supersample
and downscaled for clean edges. Run from anywhere; writes into images/.
"""

from pathlib import Path

from PIL import Image, ImageDraw

BG = (0x07, 0x13, 0x15)
N_FILL = (0x55, 0xD1, 0xCC)
W_FILL = (0x11, 0x80, 0x7D)

N_PTS = [(38, 126), (38, 54), (51, 54), (81, 100), (81, 54), (94, 54),
         (94, 126), (81, 126), (51, 80), (51, 126)]
W_PTS = [(102, 54), (112, 126), (125, 126), (134, 80), (143, 126), (156, 126),
         (166, 54), (153, 54), (147, 100), (138, 54), (130, 54), (121, 100), (115, 54)]
X_SHIFT = -11  # letter block spans x=38..166; -11 centres it in the 180 box

SS = 8
OUT = Path(__file__).resolve().parents[2] / "images"

for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    big = size * SS
    scale = big / 180.0
    img = Image.new("RGB", (big, big), BG)
    d = ImageDraw.Draw(img)
    d.polygon([((x + X_SHIFT) * scale, y * scale) for x, y in N_PTS], fill=N_FILL)
    d.polygon([((x + X_SHIFT) * scale, y * scale) for x, y in W_PTS], fill=W_FILL)
    img = img.resize((size, size), Image.LANCZOS)
    img.save(OUT / name, optimize=True)
    print(name, size, "ok")
