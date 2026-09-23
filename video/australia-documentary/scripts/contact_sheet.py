#!/usr/bin/env python3
"""Build a labeled grid contact sheet from images/*.jpg for review.

Usage: python3 scripts/contact_sheet.py [output.jpg]
"""
import sys
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "images"

THUMB_W = 320
THUMB_H = 240
LABEL_H = 28
PAD = 6
COLS = 8


def natural_key(p: Path):
    m = re.match(r"(\d+)([a-z]?)_", p.name)
    if not m:
        return (9999, p.name)
    return (int(m.group(1)), m.group(2), p.name)


def load_font(size):
    for candidate in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def main():
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "contact_sheet.jpg"

    files = sorted(
        [p for p in IMAGES_DIR.glob("*.jpg") if p.name != "SOURCES.md"],
        key=natural_key,
    )
    print(f"{len(files)} images found")

    rows = (len(files) + COLS - 1) // COLS
    cell_w = THUMB_W + PAD * 2
    cell_h = THUMB_H + LABEL_H + PAD * 2
    sheet_w = cols_w = cell_w * COLS
    sheet_h = cell_h * rows

    sheet = Image.new("RGB", (sheet_w, sheet_h), (24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    font = load_font(16)

    for i, path in enumerate(files):
        col = i % COLS
        row = i // COLS
        x0 = col * cell_w + PAD
        y0 = row * cell_h + PAD

        try:
            im = Image.open(path).convert("RGB")
            im.thumbnail((THUMB_W, THUMB_H), Image.LANCZOS)
            tw, th = im.size
            ox = x0 + (THUMB_W - tw) // 2
            oy = y0 + (THUMB_H - th) // 2
            sheet.paste(im, (ox, oy))
        except Exception as e:
            draw.rectangle(
                [x0, y0, x0 + THUMB_W, y0 + THUMB_H], outline=(255, 0, 0), width=2
            )
            draw.text((x0 + 8, y0 + 8), f"ERROR\n{e}", fill=(255, 80, 80), font=font)

        draw.rectangle(
            [x0, y0, x0 + THUMB_W, y0 + THUMB_H], outline=(80, 80, 80), width=1
        )
        label = path.stem
        draw.text(
            (x0, y0 + THUMB_H + 4), label, fill=(230, 230, 230), font=font
        )

    sheet.save(out_path, quality=88)
    print(f"Wrote {out_path} ({sheet_w}x{sheet_h})")


if __name__ == "__main__":
    main()
