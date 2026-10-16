import sys, glob
from PIL import Image, ImageDraw
# python3 sheet.py out.png cols files...
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, h * rows), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im, (x, y))
    d.text((x + 6, y + 4), f.split('_')[-1].replace('.png', ''), fill=(255, 255, 0))
sheet.save(out)
