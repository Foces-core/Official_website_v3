import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = 'C:\\Users\\sebin\\Downloads';
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'events');

async function processWinnersPoster() {
  const src = path.join(downloadsDir, 'PHOTO-2026-06-25-13-24-25.jpg.jpeg');
  if (!fs.existsSync(src)) {
    console.error('File not found:', src);
    return;
  }

  const destPath = path.join(targetDir, 'prompt_paradox_winners.webp');
  await sharp(src)
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(destPath);

  await sharp(src)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(targetDir, 'prompt_paradox_winners-800.webp'));

  await sharp(src)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(targetDir, 'prompt_paradox_winners-400.webp'));

  console.log('✅ Generated prompt_paradox_winners.webp!');
}

processWinnersPoster().catch(console.error);
