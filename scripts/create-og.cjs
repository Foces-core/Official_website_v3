const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const PUBLIC = path.join(__dirname, '..', 'public');

async function createOgImage() {
  const logoSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#101011"/>
    <path d="M6 6V26H10V17H16V13H10V10H18V6H6Z" fill="white"/>
  </svg>`;

  const textSvg = `<svg width="400" height="80" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
    <text x="200" y="55" text-anchor="middle" font-family="sans-serif" font-size="52" font-weight="700" fill="white" letter-spacing="10">FOCES</text>
  </svg>`;

  const subSvg = `<svg width="900" height="40" viewBox="0 0 900 40" xmlns="http://www.w3.org/2000/svg">
    <text x="450" y="28" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="400" fill="#9ca3af" letter-spacing="2">Forum of Computer Engineering Students</text>
  </svg>`;

  const cecSvg = `<svg width="700" height="30" viewBox="0 0 700 30" xmlns="http://www.w3.org/2000/svg">
    <text x="350" y="22" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="300" fill="#6b7280" letter-spacing="1">College of Engineering Chengannur</text>
  </svg>`;

  const bg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#101011"/>
        <stop offset="50%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#101011"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="35%">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#101011" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect x="0" y="622" width="1200" height="8" fill="#22d3ee" opacity="0.5"/>
  </svg>`;

  await sharp(Buffer.from(bg))
    .composite([
      { input: Buffer.from(logoSvg), top: 140, left: 530 },
      { input: Buffer.from(textSvg), top: 280, left: 400 },
      { input: Buffer.from(subSvg), top: 370, left: 150 },
      { input: Buffer.from(cecSvg), top: 420, left: 250 },
    ])
    .jpeg({ quality: 85 })
    .toFile(path.join(PUBLIC, 'og-image.jpg'));

  console.log('og-image.jpg created');
}

createOgImage().catch((e) => {
  console.error(e);
  process.exit(1);
});
