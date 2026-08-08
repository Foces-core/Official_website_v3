const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const PUBLIC = path.join(__dirname, '..', 'public');

async function createOgImage() {
  // Full FOCES logo with text - the iconic logo used on the hero page
  const logoSvg = `<svg width="600" height="300" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- White background -->
    <rect width="600" height="300" fill="#101011"/>
    <!-- FOCES text - large, bold, centered -->
    <text x="300" y="180" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="bold" fill="white" letter-spacing="8">FOCES</text>
    <!-- Subtitle -->
    <text x="300" y="260" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="300" fill="#9ca3af" letter-spacing="4">Forum of Computer Engineering Students</text>
    <!-- College name -->
    <text x="300" y="295" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="400" fill="#9ca3af" letter-spacing="2">College of Engineering Chengannur</text>
    <!-- Decorative lines -->
    <line x1="150" y1="280" x2="450" y2="280" stroke="#22d3ee" stroke-width="2" opacity="0.6"/>
  </svg>`;

  const bg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#101011"/>
        <stop offset="50%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#101011"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#101011" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect x="0" y="622" width="1200" height="8" fill="#22d3ee" opacity="0.5"/>
  </svg>`;

  await sharp(Buffer.from(bg))
    .composite([{ input: Buffer.from(logoSvg), top: 140, left: 300 }])
    .jpeg({ quality: 90 })
    .toFile(path.join(PUBLIC, 'og-image.jpg'));

  console.log('og-image.jpg created (full FOCES)');
}

createOgImage().catch((e) => {
  console.error(e);
  process.exit(1);
});
