import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = 'C:\\Users\\sebin\\Downloads';
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'events');

async function processNewMedia() {
  // 1. SDPK Room Wide Photo for Agentic Coding Workshop
  const sdpkSrc = path.join(downloadsDir, 'PHOTO-2026-07-09-19-05-11 3.jpg.jpeg');
  if (fs.existsSync(sdpkSrc)) {
    await sharp(sdpkSrc)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(targetDir, 'agentic_sdpk_room.webp'));
    await sharp(sdpkSrc)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(targetDir, 'agentic_sdpk_room-800.webp'));
    await sharp(sdpkSrc)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(targetDir, 'agentic_sdpk_room-400.webp'));
    console.log('✅ Generated agentic_sdpk_room.webp');
  }

  // 2. Leaderboard Graphic Poster for Prompt Paradox 2.0
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
