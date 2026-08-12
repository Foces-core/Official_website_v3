import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const downloadsDir = 'C:\\Users\\sebin\\Downloads';
const outDir =
  'C:\\Users\\sebin\\.gemini\\antigravity\\brain\\c231d148-ff66-49e5-862a-d3ad6574a92c\\scratch\\extracted_frames';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(downloadsDir);
const mp4Files = files.filter((f) => f.toLowerCase().endsWith('.mp4'));

console.log(`Found ${mp4Files.length} MP4 files in Downloads.`);

mp4Files.forEach((file, idx) => {
  const filePath = path.join(downloadsDir, file);
  const prefix = file.replace(/[^a-zA-Z0-9]/g, '_');
  try {
    const probe = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    )
      .toString()
      .trim();
    const duration = parseFloat(probe) || 5;
    const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75];

    timestamps.forEach((t, i) => {
      const outName = `${prefix}_frame_${i + 1}.jpg`;
      const outPath = path.join(outDir, outName);
      execSync(`ffmpeg -y -ss ${t.toFixed(2)} -i "${filePath}" -vframes 1 -q:v 2 "${outPath}"`);
    });
    console.log(`✅ Extracted frames for: ${file}`);
  } catch (err) {
    console.error(`❌ Error on file ${file}:`, err.message);
  }
});
