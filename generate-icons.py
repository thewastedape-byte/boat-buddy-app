"""
Generate Android launcher icons from the Boat Buddy 512px source icon.
Outputs all required density PNGs into the Android res/mipmap-* folders.
"""
from PIL import Image
import os

SRC = r"C:\Users\howir\.openclaw\workspace\boat-buddy-app\public\icons\icon-512.png"
ANDROID_RES = r"C:\Users\howir\.openclaw\workspace\boat-buddy-app\android\app\src\main\res"

# (folder, legacy_size, foreground_size)
DENSITIES = [
    ("mipmap-mdpi",    48,  108),
    ("mipmap-hdpi",    72,  162),
    ("mipmap-xhdpi",   96,  216),
    ("mipmap-xxhdpi",  144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

src = Image.open(SRC).convert("RGBA")
w, h = src.size
print(f"Source: {w}x{h}")

for folder, legacy_size, fg_size in DENSITIES:
    path = os.path.join(ANDROID_RES, folder)
    os.makedirs(path, exist_ok=True)

    # ic_launcher.png — legacy square icon
    icon = src.resize((legacy_size, legacy_size), Image.LANCZOS)
    out = os.path.join(path, "ic_launcher.png")
    icon.save(out, "PNG", optimize=True)
    print(f"  {folder}/ic_launcher.png ({legacy_size}x{legacy_size})")

    # ic_launcher_round.png — same image, Android clips it to circle
    icon.save(os.path.join(path, "ic_launcher_round.png"), "PNG", optimize=True)
    print(f"  {folder}/ic_launcher_round.png")

    # ic_launcher_foreground.png — adaptive icon foreground layer
    # Add 25% padding so the logo sits within Android's safe zone
    padding = int(fg_size * 0.15)
    inner_size = fg_size - (padding * 2)
    fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    logo_resized = src.resize((inner_size, inner_size), Image.LANCZOS)
    fg_canvas.paste(logo_resized, (padding, padding), logo_resized)
    fg_canvas.save(os.path.join(path, "ic_launcher_foreground.png"), "PNG", optimize=True)
    print(f"  {folder}/ic_launcher_foreground.png ({fg_size}x{fg_size} with padding)")

print("\nAll icons generated successfully.")
