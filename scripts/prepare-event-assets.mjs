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

// Key selected photos & video frames
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
  {
    src: path.join(downloadsDir, 'ECCACA6D-9B41-4760-A617-2366B80ED402.JPG.jpeg'),
    name: 'coding_arena_lab_wide.webp',
  },
  {
    src: path.join(downloadsDir, '9D66F96F-E487-40E0-814B-155B1DCA4E08.JPG.jpeg'),
    name: 'coding_arena_action.webp',
  },
  {
    src: path.join(downloadsDir, 'PHOTO-2026-07-09-19-05-03.jpg.jpeg'),
    name: 'agentic_coding_lab1.webp',
  },
  {
    src: path.join(downloadsDir, 'PHOTO-2026-07-09-19-05-11 3.jpg.jpeg'),
    name: 'agentic_coding_lab2.webp',
  },
  {
    src: path.join(downloadsDir, 'PHOTO-2026-06-25-13-24-33.jpg.jpeg'),
    name: 'prompt_paradox_session.webp',
  },

  // High quality extracted video frames
  {
    src: path.join(framesDir, 'WhatsApp_Video_2026_08_08_at_3_28_47_PM_mp4_frame_2.jpg'),
    name: 'student_seminar_presentation.webp',
  },
  {
    src: path.join(framesDir, 'WhatsApp_Video_2026_08_08_at_3_29_14_PM_mp4_frame_2.jpg'),
    name: 'java_algorithm_lecture.webp',
  },
  {
    src: path.join(framesDir, 'VIDEO_2026_07_09_19_05_02_3_mp4_frame_2.jpg'),
    name: 'agentic_coding_demo_video.webp',
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
