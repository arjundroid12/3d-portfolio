#!/usr/bin/env python3
"""Convert animal spritesheets to animated GIFs for the dungeon portfolio."""
import os
from PIL import Image

# Ensure output directory exists
os.makedirs('/home/z/my-project/public/animals', exist_ok=True)

# Spritesheets to process: (source_path, frame_width, frame_height, output_name, fps)
spritesheets = [
    # FreeAnimalPack — horizontal spritesheets
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/BirdFly.png', 16, 16, 'bird', 8),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/FrogIdle.png', 32, 32, 'frog', 6),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/GoldenBarking.png', 64, 64, 'golden-bark', 8),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/JumpCattt.png', 32, 32, 'cat-jump', 8),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/Jumping.png', 32, 32, 'dog-jump', 8),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/PigIdle.png', 64, 64, 'pig', 6),
    ('/home/z/my-project/upload/animals-extracted/FreeAnimalPack/SleepDog.png', 64, 64, 'dog-sleep', 4),
]

for src, fw, fh, name, fps in spritesheets:
    try:
        img = Image.open(src)
        w, h = img.size
        # Make sure dimensions are divisible
        cols = w // fw
        rows = h // fh
        frames = []
        for r in range(rows):
            for c in range(cols):
                frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
                # Scale up 2x for better visibility (pixel art)
                frame = frame.resize((fw * 3, fh * 3), Image.NEAREST)
                # Convert to RGBA for proper transparency handling
                if frame.mode != 'RGBA':
                    frame = frame.convert('RGBA')
                # Convert to P mode for GIF (with transparency) — use FASTOCTREE for RGBA
                frame_p = frame.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                frames.append(frame_p)

        if not frames:
            print(f"  SKIP {name}: no frames extracted")
            continue

        # Save as animated GIF
        out_path = f'/home/z/my-project/public/animals/{name}.gif'
        duration = int(1000 / fps)  # ms per frame
        frames[0].save(
            out_path,
            save_all=True,
            append_images=frames[1:],
            duration=duration,
            loop=0,  # infinite loop
            disposal=2,  # clear frame before next
            optimize=True,
        )
        print(f"  OK {name}.gif — {len(frames)} frames, {fw*3}x{fh*3}px, {fps}fps")
    except Exception as e:
        print(f"  FAIL {name}: {e}")

# Also copy the Goldie portrait as a static image
import shutil
goldie_src = '/home/z/my-project/upload/goldie-extracted/Goldie pack_v02/Goldie portrait_01.png'
if os.path.exists(goldie_src):
    shutil.copy(goldie_src, '/home/z/my-project/public/animals/goldie-portrait.png')
    print("  OK goldie-portrait.png (static)")

# Copy the realistic goldie too
goldie_real = '/home/z/my-project/upload/goldie-extracted/Goldie pack_v02/Realistic Goldie.png'
if os.path.exists(goldie_real):
    shutil.copy(goldie_real, '/home/z/my-project/public/animals/goldie-realistic.png')
    print("  OK goldie-realistic.png (static)")

# Check if Goldie_v02.png is a spritesheet (128x320)
goldie_v2 = '/home/z/my-project/upload/goldie-extracted/Goldie pack_v02/Goldie_v02.png'
if os.path.exists(goldie_v2):
    img = Image.open(goldie_v2)
    print(f"  Goldie_v02.png is {img.size[0]}x{img.size[1]}")
    # 128x320 = could be 64x64 frames in 2 cols x 5 rows = 10 frames
    # Or 128x64 = 5 frames
    # Let's try 64x64
    w, h = img.size
    fw, fh = 64, 64
    cols = w // fw
    rows = h // fh
    frames = []
    for r in range(rows):
        for c in range(cols):
            frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
            frame = frame.resize((fw * 3, fh * 3), Image.NEAREST)
            if frame.mode != 'RGBA':
                frame = frame.convert('RGBA')
            frame_p = frame.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
            frames.append(frame_p)
    if frames:
        out_path = '/home/z/my-project/public/animals/goldie.gif'
        frames[0].save(
            out_path,
            save_all=True,
            append_images=frames[1:],
            duration=120,
            loop=0,
            disposal=2,
            optimize=True,
        )
        print(f"  OK goldie.gif — {len(frames)} frames, {fw*3}x{fh*3}px")

print("\nDone! All animal GIFs saved to /home/z/my-project/public/animals/")
