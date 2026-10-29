// Temporary visual QA helper: measures each captured team card so framing can
// be compared numerically against the Aleetta reference (head gap, face band,
// shoulder/body start).
import sharp from 'sharp';
import fs from 'node:fs/promises';

const NAMES = [
  'Aleetta Mariya Sebastian', // index 0 captured, but capture order shifted by 1
];

const files = await fs.readdir('test-results/frames');
const count = files.filter((f) => f.startsWith('card-')).length;

// Capture order started on Lisha (index 1), so map file index -> roster slot.
const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const LABELS = [
  'Aleetta',
  'Lisha',
  'Steve',
  'Anna',
  'Amanul',
  'Abel',
  'Saniya',
  'Sebin',
  'Anjitha',
  'Abhirami',
  'Devadarsana',
];

const rows = [];
for (let i = 0; i < count; i += 1) {
  const file = `test-results/frames/card-${i}.png`;
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x, y) => data[y * w + x];

  // Background estimate: median of the outer 4% columns over the top 60%.
  const edge = [];
  const edgeW = Math.max(4, Math.round(w * 0.05));
  for (let y = 0; y < Math.round(h * 0.6); y += 2) {
    for (let x = 0; x < edgeW; x += 1) {
      edge.push(at(x, y));
      edge.push(at(w - 1 - x, y));
    }
  }
  edge.sort((a, b) => a - b);
  const bg = edge[Math.floor(edge.length / 2)];

  const TH = 16;
  const counts = [];
  for (let y = 0; y < h; y += 1) {
    let c = 0;
    for (let x = 0; x < w; x += 1) {
      if (Math.abs(at(x, y) - bg) > TH) c += 1;
    }
    counts.push(c);
  }

  const limit = Math.round(h * 0.72); // ignore caption gradient zone
  const minRun = 4;
  let headTop = -1;
  for (let y = 0; y < limit - minRun; y += 1) {
    if (counts.slice(y, y + minRun).every((c) => c > w * 0.05)) {
      headTop = y;
      break;
    }
  }

  // Head width band just under headTop; shoulders = first row well below
  // headTop where the subject spans much wider (or most of the card).
  const bandEnd = Math.min(limit, headTop + Math.round(h * 0.22));
  let headWidth = 0;
  for (let y = Math.max(0, headTop); y < bandEnd; y += 1)
    headWidth = Math.max(headWidth, counts[y]);

  let shoulder = -1;
  const shoulderThreshold = Math.max(w * 0.5, headWidth * 1.7);
  for (let y = headTop + Math.round(h * 0.1); y < limit; y += 1) {
    if (counts[y] > shoulderThreshold) {
      shoulder = y;
      break;
    }
  }

  // Does the subject fill the bottom of the card (body visible past the gradient)?
  const bodyBottom = counts[h - 3] > w * 0.5;

  rows.push({
    label: LABELS[order[i]],
    w,
    h,
    bg,
    headTop,
    headWidth,
    shoulder,
    bodyBottom,
  });
}

console.log(
  [
    'name'.padEnd(11),
    'bg'.padStart(4),
    'headTop'.padStart(8),
    'headW'.padStart(6),
    'shoulder'.padStart(9),
    'body',
  ].join(' '),
);
for (const r of rows) {
  console.log(
    [
      r.label.padEnd(11),
      String(r.bg).padStart(4),
      String(r.headTop).padStart(8),
      String(r.headWidth).padStart(6),
      String(r.shoulder).padStart(9),
      r.bodyBottom ? 'yes' : 'no',
    ].join(' '),
  );
}
