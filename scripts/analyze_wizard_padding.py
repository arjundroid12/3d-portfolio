#!/usr/bin/env python3
"""Analyze wizard.gif for transparent padding around the visible sprite.
Finds the bounding box of non-transparent pixels on each frame and reports
the padding on each side."""
from PIL import Image

im = Image.open('/home/z/my-project/upload/wizard.gif')
print(f"GIF size: {im.size}, mode: {im.mode}, frames: {im.n_frames}")
print(f"Is animated: {im.is_animated}")
print()

# Check every frame — find the overall bbox across all frames
overall_left = im.size[0]
overall_top = im.size[1]
overall_right = 0
overall_bottom = 0

for i in range(im.n_frames):
    im.seek(i)
    # Convert to RGBA so we have an alpha channel to check
    frame = im.convert('RGBA')
    # getbbox() returns (left, top, right, bottom) of non-zero (non-transparent) region
    bbox = frame.getbbox()
    if bbox:
        l, t, r, b = bbox
        if l < overall_left: overall_left = l
        if t < overall_top: overall_top = t
        if r > overall_right: overall_right = r
        if b > overall_bottom: overall_bottom = b
        print(f"Frame {i}: size={im.size} bbox=({l},{t},{r},{b})  "
              f"padding L={l} T={t} R={im.size[0]-r} B={im.size[1]-b}  "
              f"content {r-l}x{b-t}")
    else:
        print(f"Frame {i}: completely transparent")

print()
print("=" * 70)
print(f"Overall content bbox across all {im.n_frames} frames:")
print(f"  left={overall_left}  top={overall_top}  right={overall_right}  bottom={overall_bottom}")
print(f"  content size: {overall_right-overall_left} x {overall_bottom-overall_top}")
print(f"  padding: L={overall_left}  T={overall_top}  R={im.size[0]-overall_right}  B={im.size[1]-overall_bottom}")
print(f"  total GIF: {im.size[0]} x {im.size[1]}")

# Save a cropped version (content-only, no padding) for reference
im.seek(0)
frame0 = im.convert('RGBA')
cropped = frame0.crop((overall_left, overall_top, overall_right, overall_bottom))
cropped.save('/home/z/my-project/scripts/wizard-content-frame0.png')
print(f"\nSaved cropped frame 0 (content only) to scripts/wizard-content-frame0.png")
print(f"  Cropped size: {cropped.size}")
