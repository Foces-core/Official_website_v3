"""Temporary visual QA: face-detect each captured team card and report framing.

For every card we measure, in card pixels (top-left origin):
  hairTop    first dark row above the detected face (top of the head)
  faceTop    detected face box top (forehead)
  faceBot    detected face box bottom (chin)
  shoulder   first row below the chin where the subject spans wide (body start)
  bgLum      median luminance of the top-left corner (studio backdrop)

The capture order starts on Lisha, so file index -> roster slot is shifted.
"""

import json
import sys

import cv2
import numpy as np

MODEL = "/tmp/yunet.onnx"
import os

DIR = os.environ.get("FRAMES_DIR", "test-results/frames")
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
# Desktop capture starts on Lisha (index 1); mobile is captured in roster order.
if os.environ.get("MOBILE"):
    ORDER = list(range(11))
else:
    ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]

detector = cv2.FaceDetectorYN.create(MODEL, "", (320, 320), 0.6, 0.3, 5000)

results = []
import re


def slugify(text):
    return re.sub(r"[^a-z]+", "-", text.lower()).strip("-")


files = sorted(
    (f for f in os.listdir(DIR) if f.startswith("card-") and f.endswith(".png")),
    key=lambda f: int(re.search(r"card-(\d+)", f).group(1)),
)

for n, fname in enumerate(files):
    match = re.match(r"card-\d+-(.+)\.png$", fname)
    if match:
        slug = match.group(1)
        label = next(
            (
                lab
                for lab in LABELS
                if slug == slugify(lab) or slug.startswith(slugify(lab) + "-")
            ),
            None,
        )
        if label is None:
            print(f"unknown slug {slug}", file=sys.stderr)
            continue
    else:
        label = LABELS[ORDER[n]]
    path = f"{DIR}/{fname}"
    img = cv2.imread(path)
    if img is None:
        print(f"missing {path}", file=sys.stderr)
        continue
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    detector.setInputSize((w, h))
    _, faces = detector.detect(img)

    # Backdrop luminance from a corner patch (studio gray, no subject there).
    corner = gray[: max(8, h // 10), : max(8, w // 10)]
    bg = float(np.median(corner))

    if faces is None or len(faces) == 0:
        results.append({"label": label, "file": path, "w": w, "h": h, "face": None})
        print(f"{label:11s} NO FACE")
        continue

    f = max(faces, key=lambda r: r[2] * r[3])
    fx, fy, fw, fh = [float(v) for v in f[:4]]

    # Skip the card's dark border/rounded corner rows before scanning.
    top = 4

    # Top of head: first row at/above the face where pixels in the face
    # column range are clearly darker than the backdrop (hair).
    col = gray[top:, int(fx) : int(fx + fw)]
    dark_local = np.where((col < bg - 45).sum(axis=1) > max(3, int(fw * 0.15)))[0]
    hair_top = int(dark_local[0]) + top if len(dark_local) else int(fy)

    # Rows above the head that read as clean backdrop (the desired headroom).
    strip = gray[top : hair_top, 4 : w - 4]
    headroom = int(hair_top - top)
    if strip.size:
        near_bg = (np.abs(strip.astype(int) - bg) <= 14).mean()
    else:
        near_bg = 1.0

    # Body/shoulder start: below the chin, first row where the subject span
    # (pixels far from the backdrop luminance) is much wider than the face.
    subject = np.abs(gray.astype(int) - bg) > 28
    chin = int(fy + fh)
    span = subject.sum(axis=1)
    shoulder = -1
    for y in range(chin + 4, int(h * 0.78)):
        if span[y] > max(fw * 1.6, w * 0.45):
            shoulder = y
            break

    results.append(
        {
            "label": label,
            "file": path,
            "w": w,
            "h": h,
            "bg": round(bg, 1),
            "hairTop": hair_top,
            "headroom": headroom,
            "headroomClean": round(float(near_bg), 3),
            "faceTop": round(fy, 1),
            "faceBot": round(fy + fh, 1),
            "faceH": round(fh, 1),
            "faceCx": round(fx + fw / 2, 1),
            "shoulder": shoulder,
            "bodyBottom": bool(span[h - 4] > w * 0.45),
        }
    )

print(
    f"{'name':11s} {'gap':>4s} {'clean':>5s} {'hair':>5s} {'faceTop':>8s} {'chin':>6s} {'faceH':>6s} {'shldr':>6s} {'body':>5s}"
)
for r in results:
    if r.get("face") is None and "hairTop" not in r:
        print(f"{r['label']:11s} NO FACE")
        continue
    print(
        f"{r['label']:11s} {r['headroom']:>4d} {r['headroomClean']:>5.2f} {r['hairTop']:>5d} "
        f"{r['faceTop']:>8.0f} {r['faceBot']:>6.0f} {r['faceH']:>6.0f} "
        f"{r['shoulder']:>6d} {'yes' if r['bodyBottom'] else 'no':>5s}"
    )

with open(f"{DIR}/analysis.json", "w") as fh:
    json.dump(results, fh, indent=2)
