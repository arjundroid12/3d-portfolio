#!/usr/bin/env python3
"""Crop wizard.gif to its content bbox and re-encode as a clean animated GIF.

The source GIF is 250x250 but the actual wizard sprite is only ~57x104 in the
center. Cropping removes the dead padding so when we scale the image up on the
page, we're scaling the wizard — not empty pixels.

Approach: load each frame as RGBA, crop to the union bbox of all frames (with a
small margin), then re-encode as an animated GIF preserving transparency via
P mode with a transparency index.
"""
from PIL import Image, ImageSequence
import os

src = '/home/z/my-project/upload/wizard.gif'
dst = '/home/z/my-project/public/experience/wizard.gif'

im = Image.open(src)

# Step 1: compute the union bbox of non-transparent content across all frames.
bbox_left = im.size[0]
bbox_top = im.size[1]
bbox_right = 0
bbox_bottom = 0
for frame in ImageSequence.Iterator(im):
    bbox = frame.convert('RGBA').getbbox()
    if bbox:
        l, t, r, b = bbox
        bbox_left = min(bbox_left, l)
        bbox_top = min(bbox_top, t)
        bbox_right = max(bbox_right, r)
        bbox_bottom = max(bbox_bottom, b)

# Add a 2px breathing margin
margin = 2
bbox_left = max(0, bbox_left - margin)
bbox_top = max(0, bbox_top - margin)
bbox_right = min(im.size[0], bbox_right + margin)
bbox_bottom = min(im.size[1], bbox_bottom + margin)
crop_box = (bbox_left, bbox_top, bbox_right, bbox_bottom)
print(f"Cropping with box: {crop_box}")
print(f"New size: {bbox_right-bbox_left} x {bbox_bottom-bbox_top}")

# Step 2: collect cropped RGBA frames
rgba_frames = []
durations = []
for frame in ImageSequence.Iterator(im):
    rgba = frame.convert('RGBA').crop(crop_box)
    rgba_frames.append(rgba)
    durations.append(frame.info.get('duration', 100))

# Step 3: build P-mode frames with a transparency index.
# We use a uniform palette across all frames so animation is smooth.
# Strategy: pick a "transparency color" (magenta-ish) that won't appear in the
# sprite, fill transparent areas with it, convert to P, mark that color as
# the transparency index.
TRANS_COLOR = (255, 0, 255, 255)  # opaque magenta, will be marked transparent

p_frames = []
for rgba in rgba_frames:
    # Create an RGB image where transparent pixels become magenta
    bg = Image.new('RGBA', rgba.size, TRANS_COLOR)
    # Paste the sprite over the magenta bg, using alpha as mask so transparent
    # areas of the sprite remain magenta
    bg.paste(rgba, mask=rgba.split()[-1])
    rgb = bg.convert('RGB')
    # Quantize to 255 colors (leave 1 slot for transparency)
    p = rgb.quantize(colors=256, method=Image.ADAPTIVE)
    # Find the index closest to magenta
    palette = p.getpalette()  # flat list [r,g,b,r,g,b,...]
    target = (255, 0, 255)
    best_idx = 0
    best_dist = float('inf')
    for i in range(256):
        r, g, b = palette[i*3], palette[i*3+1], palette[i*3+2]
        d = (r-target[0])**2 + (g-target[1])**2 + (b-target[2])**2
        if d < best_dist:
            best_dist = d
            best_idx = i
    p.info['transparency'] = best_idx
    p_frames.append(p)

# Step 4: save as animated GIF
p_frames[0].save(
    dst,
    save_all=True,
    append_images=p_frames[1:],
    loop=0,  # infinite loop
    disposal=2,  # restore to bg after each frame
    duration=durations,
    transparency=p_frames[0].info['transparency'],
    optimize=True,
)

# Verify
result = Image.open(dst)
print(f"\nSaved: {dst}")
print(f"New GIF size: {result.size}, frames: {result.n_frames}")
print(f"File size: {os.path.getsize(dst)} bytes")

# Re-analyze the result to confirm padding is gone
result.seek(0)
result_rgba = result.convert('RGBA')
bbox = result_rgba.getbbox()
print(f"Result frame 0 bbox: {bbox}  (should be near full image)")
