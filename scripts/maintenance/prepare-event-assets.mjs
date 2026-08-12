import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = 'C:\\Users\\sebin\\Downloads';
const framesDir =
  'C:\\Users\\sebin\\.gemini\\antigravity\\brain\\c231d148-ff66-49e5-862a-d3ad6574a92c\\scratch\\extracted_frames';
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'events');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Key selected photos & video frames.
// Only assets actually imported by src/data/events.js are generated here.
// (Orphaned variants — coding_arena_lab_wide, coding_arena_action,
// agentic_coding_lab1/lab2, prompt_paradox_session, student_seminar_presentation,
// agentic_coding_demo_video — were pruned in 2026-08; keep this list in sync
// with what the site consumes.)
const items = [
  // High quality lab photos
  {
    src: path.join(downloadsDir, '24873F9B-CF17-4D7A-82DF-C224175EC429.JPG.jpeg'),
    name: 'agentic_workshop_mentor.webp',
  },
  {
    src: path.join(downloadsDir, '5D80A877-34ED-4359-B2FA-F71BF9F216C2.JPG.jpeg'),
    name: 'agentic_workshop_students.webp',
  },

  // High quality extracted video frames
  {
    src: path.join(framesDir, 'WhatsApp_Video_2026_08_08_at_3_29_14_PM_mp4_frame_2.jpg'),
    name: 'java_algorithm_lecture.webp',
  },
];

async function processImages() {
  console.log('Optimizing event assets to WebP...');
  for (const item of items) {
    if (!fs.existsSync(item.src)) {
      console.warn(`File not found: ${item.src}`);
      continue;
    }
    const destPath = path.join(targetDir, item.name);

    // Generate WebP main (1000px max width)
    await sharp(item.src)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath);

    // Generate 400px thumbnail
    const thumbName = item.name.replace('.webp', '-400.webp');
    await sharp(item.src)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(targetDir, thumbName));

    // Generate 800px image
    const midName = item.name.replace('.webp', '-800.webp');
    await sharp(item.src)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(targetDir, midName));

    console.log(`✅ Processed: ${item.name}`);
  }
  console.log('✨ All event assets ready!');
}

processImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
