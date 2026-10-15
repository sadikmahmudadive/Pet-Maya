"""Converts img/*.png (rendered by capture-stills.mjs) to WebP and removes the PNGs."""
import os
from PIL import Image

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img")
for f in sorted(os.listdir(here)):
    if not f.endswith(".png"):
        continue
    src = os.path.join(here, f)
    dst = src[:-4] + ".webp"
    Image.open(src).convert("RGB").save(dst, "WEBP", quality=84, method=6)
    os.remove(src)
    print(f"{f} -> {os.path.basename(dst)}  {os.path.getsize(dst) / 1024:.0f} KB")
