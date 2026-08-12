import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = 'C:\\Users\\sebin\\Downloads';
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'events');

async function processNewMedia() {
  // Leaderboard Graphic Poster for Prompt Paradox 2.0
  // (the agentic_sdpk_room photos were pruned in 2026-08 — not consumed by
  // src/data/events.js; keep this script in sync with what the site imports)
  const lbSrc = path.join(downloadsDir, 'PHOTO-2026-06-25-13-24-33.jpg.jpeg');
  if (fs.existsSync(lbSrc)) {
    await sharp(lbSrc)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(targetDir, 'prompt_paradox_leaderboard.webp'));
    await sharp(lbSrc)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(targetDir, 'prompt_paradox_leaderboard-800.webp'));
    await sharp(lbSrc)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(targetDir, 'prompt_paradox_leaderboard-400.webp'));
    console.log('✅ Generated prompt_paradox_leaderboard.webp');
  }
}

processNewMedia().catch(console.error);
