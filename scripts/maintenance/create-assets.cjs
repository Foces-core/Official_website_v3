const sharp = require('sharp');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

async function createOgImage() {
  const logoSvg = `
    <svg width="700" height="159" viewBox="0 0 700 159" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0V158.747L39.1608 133.943V81.8541H75.8741L105.245 54.5694H39.1608V29.7651H234.965V104.178H144.406V54.5694L107.692 91.7758V104.178L137.063 136.423H244.755L271.678 104.178V29.7651L244.755 0H0Z" fill="white"/>
      <path d="M276.573 29.7651L305.944 0H494.406L516.434 29.7651H315.734V104.178H357.343V136.423H305.944L276.573 104.178V29.7651Z" fill="white"/>
      <path d="M491.958 54.5694H401.399V133.943H673.077L700 94.2562L673.077 54.5694H572.727L562.937 42.1672L572.727 29.7651H673.077L700 0H550.699L521.329 42.1672L550.699 84.3345H648.601L655.944 94.2562L648.601 104.178H440.559V84.3345H511.539L491.958 54.5694Z" fill="white"/>
    </svg>`;

  const subtitleSvg = `
    <svg width="500" height="40" viewBox="0 0 500 40" xmlns="http://www.w3.org/2000/svg">
      <text x="250" y="28" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="400" fill="#9ca3af" letter-spacing="2">
        Forum of Computer Engineering Students
      </text>
    </svg>`;

  const cecSvg = `
    <svg width="300" height="30" viewBox="0 0 300 30" xmlns="http://www.w3.org/2000/svg">
      <text x="150" y="22" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="300" fill="#6b7280" letter-spacing="1">
        College of Engineering Chengannur
      </text>
    </svg>`;

  // Background: dark with subtle gradient accent
  const bg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#101011"/>
          <stop offset="50%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#101011"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#101011" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <rect x="0" y="620" width="1200" height="10" fill="#22d3ee" opacity="0.6"/>
    </svg>
  `);

  const ogImage = await sharp(bg)
    .composite([
      // FOCES logo centered
      {
        input: Buffer.from(logoSvg),
        top: 200,
        left: 250,
      },
      // Subtitle
      {
        input: Buffer.from(subtitleSvg),
        top: 380,
        left: 350,
      },
      // College name
      {
        input: Buffer.from(cecSvg),
        top: 430,
        left: 450,
      },
    ])
    .jpeg({ quality: 90 })
    .toFile(path.join(PUBLIC, 'og-image.jpg'));

  console.log('✅ OG image created:', ogImage.width + 'x' + ogImage.height);
}

async function createFavicon() {
  // Convert SVG to 32x32 PNG, then to ICO
  const png32 = await sharp(path.join(PUBLIC, 'foces.svg')).resize(32, 32).png().toBuffer();

  const png16 = await sharp(path.join(PUBLIC, 'foces.svg')).resize(16, 16).png().toBuffer();

  // ICO format: manually construct (header + directory + PNG data)
  // For simplicity, use the 32x32 PNG as a single-icon ICO
  const ico = buildIco([png16, png32]);
  require('fs').writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico);
  console.log('✅ Favicon ICO created: favicon.ico');
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4); // number of images

  const sizes = [16, 32];
  let dataOffset = 6 + count * 16; // header + directory entries

  const directory = Buffer.alloc(count * 16);
  const imageBuffers = [];

  for (let i = 0; i < count; i++) {
    const entry = directory.subarray(i * 16, (i + 1) * 16);
    entry.writeUInt8(sizes[i], 0); // width
    entry.writeUInt8(sizes[i], 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8); // data size
    entry.writeUInt32LE(dataOffset, 12); // data offset

    imageBuffers.push(pngBuffers[i]);
    dataOffset += pngBuffers[i].length;
  }

  return Buffer.concat([header, directory, ...imageBuffers]);
}

(async () => {
  try {
    await createOgImage();
    await createFavicon();
    console.log('\n🎉 All done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
