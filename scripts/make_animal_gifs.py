#!/usr/bin/env python3
"""Convert animal spritesheets to animated GIFs with PROPER transparency."""
import os
from PIL import Image, ImageSequence

os.makedirs('/home/z/my-project/public/animals', exist_ok=True)

spritesheets = [
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
        img = Image.open(src).convert('RGBA')
        w, h = img.size
        cols = w // fw
        rows = h // fh
        frames = []

        for r in range(rows):
            for c in range(cols):
                frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
                # Scale up 3x for visibility
                frame = frame.resize((fw * 3, fh * 3), Image.NEAREST)
                # Keep as RGBA — don't quantize yet
                frames.append(frame)

        if not frames:
            print(f"  SKIP {name}: no frames")
            continue

        out_path = f'/home/z/my-project/public/animals/{name}.gif'
        duration = int(1000 / fps)

        # Save with proper transparency: pass RGBA frames directly to save()
        # PIL handles the conversion to palette mode with transparency automatically
        frames[0].save(
            out_path,
            save_all=True,
            append_images=frames[1:],
            duration=duration,
            loop=0,
            disposal=2,  # clear frame before next (critical for transparency)
            transparency=0,  # palette index 0 = transparent
            optimize=True,
        )

        # Verify the output
        verify = Image.open(out_path)
        verify_frame = verify.convert('RGBA')
        corners = [verify_frame.getpixel((0,0)), verify_frame.getpixel((verify_frame.width-1, 0))]
        has_transparency = any(c[3] == 0 for c in corners)
        print(f"  OK {name}.gif — {len(frames)} frames, {fw*3}x{fh*3}px, transparent={has_transparency}")
    except Exception as e:
        print(f"  FAIL {name}: {e}")

# Goldie spritesheet
goldie_v2 = '/home/z/my-project/upload/goldie-extracted/Goldie pack_v02/Goldie_v02.png'
if os.path.exists(goldie_v2):
    try:
        img = Image.open(goldie_v2).convert('RGBA')
        w, h = img.size  # 128x320
        fw, fh = 64, 64
        cols, rows = w // fw, h // fh
        frames = []
        for r in range(rows):
            for c in range(cols):
                frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
                frame = frame.resize((fw * 3, fh * 3), Image.NEAREST)
                frames.append(frame)
        out_path = '/home/z/my-project/public/animals/goldie.gif'
        frames[0].save(
            out_path, save_all=True, append_images=frames[1:],
            duration=120, loop=0, disposal=2, transparency=0, optimize=True,
        )
        print(f"  OK goldie.gif — {len(frames)} frames, transparent")
    except Exception as e:
        print(f"  FAIL goldie: {e}")

print("\nDone!")
