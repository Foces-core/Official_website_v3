"""Temporary visual QA: row luminance near the card bottom to detect a seam.

The negative vertical offsets raise the photo, opening a sliver of card fill at
the bottom that must stay hidden behind the caption gradient. Prints per-row
mean luminance around that boundary for a shifted card vs the reference.
"""

import numpy as np
from PIL import Image

# file index -> label (capture order starts on Lisha)
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
# negative offsets open a sliver at the bottom
SHIFT = {
    "Lisha": -13,
    "Anna": -8,
    "Sebin": -10,
    "Anjitha": -18,
    "Abhirami": -15,
    "Devadarsana": -12,
}

for i in range(11):
    label = LABELS[ORDER[i]]
    img = np.asarray(
        Image.open(f"test-results/frames/card-{i}.png").convert("L"), dtype=float
    )
    h, w = img.shape
    bottom = img[:, 6:-6]
    # Largest row-to-row luminance jump in the bottom quarter (a seam would
    # show up as an outlier against the smooth gradient ramp).
    q = bottom[int(h * 0.75) :]
    diffs = np.abs(np.diff(q.mean(axis=1)))
    max_jump = float(diffs.max())
    jump_at = int(diffs.argmax()) + int(h * 0.75)
    strip = f"sliver {abs(SHIFT[label])}px" if label in SHIFT else "no sliver"
    print(
        f"{label:11s} {strip:11s} bottom rows mean {q[-20:].mean():6.1f} "
        f"max row-jump {max_jump:5.2f} at y={jump_at}"
    )
