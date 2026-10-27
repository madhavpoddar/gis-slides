# Cuts the ICE passenger displays out of the photos in ../sources and corrects the perspective,
# so both screens come out as the same flat rectangle in ../public.
#
#   python ice-screens.py        (needs Pillow and NumPy)
#
# Corners were read off the photos (original pixels). The white map area has crisp edges;
# the header's top edge was extended from them using its height relative to the map
# (0.142 x map height, measured on the left edge of both photos).
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).parent
SIZE = (1920, 1130)  # the screens measure about 1.7 : 1
SCREENS = {
    # output: (source, [top-left, top-right, bottom-right, bottom-left])
    'ice-screen-out.jpg': ('ice-zoomed-out.jpg', [(383, 306), (2869, 461), (2948, 1861), (382, 1897)]),
    'ice-screen-in.jpg': ('ice-zoomed-in.jpg', [(507, 524), (2443, 711), (2476, 1780), (460, 1764)]),
}


def warp(src, quad, size):
    w, h = size
    rect = [(0, 0), (w, 0), (w, h), (0, h)]
    # Pillow wants the coefficients that map output (rectangle) -> input (quad)
    a, b = [], []
    for (x, y), (u, v) in zip(rect, quad):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        b.append(u)
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b.append(v)
    coeffs = np.linalg.solve(np.array(a, float), np.array(b, float))
    return src.transform(size, Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC)


for out, (name, quad) in SCREENS.items():
    img = Image.open(HERE.parent / 'sources' / name).convert('RGB')
    warp(img, quad, SIZE).save(HERE.parent / 'public' / out, quality=90)
    print(f'Wrote public/{out}')
