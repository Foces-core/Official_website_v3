"""Temporary visual QA: row luminance profile of each captured card.

Prints the mean luminance of each horizontal band so a painted backdrop strip
(flat tone, low variance) is distinguishable from the photo's own backdrop and
from hair/subject content, plus the seam (band-to-band jump) if one exists.
"""

import json

import numpy as np
from PIL import Image

ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]
LABELS = [
    "Aleetta",
    "Lisha",
    "Steve",
    "Anna",
    "Amanul",
    "Abel",
    "Saniya",
    "Sebin",
    "Anjitha",
    "Abhirami",
    "Devadarsana",
]

analysis = {r["label"]: r for r in json.load(open("test-results/frames-analysis.json"))}

bands = [(4, 16), (16, 32), (32, 48), (48, 64), (64, 80), (80, 96), (96, 112)]

print(f"{'name':11s} " + " ".join(f"{f'{a}-{b}':>9s}" for a, b in bands) + f" {'stripSD':>8s}")
for i in range(11):
    img = np.asarray(
        Image.open(f"test-results/frames/card-{i}.png").convert("L"), dtype=float
    )
    label = LABELS[ORDER[i]]
    hair = analysis[label]["hairTop"]
    strip = img[4:hair, 8:-8] if hair > 6 else img[4:6, 8:-8]
    means = []
    for a, b in bands:
        means.append(img[a:b, 8:-8].mean())
    print(
        f"{label:11s} "
        + " ".join(f"{m:9.1f}" for m in means)
        + f" {strip.std():8.2f}"
    )
