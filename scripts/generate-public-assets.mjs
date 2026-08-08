import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Official FOCES vector paths (700x159)
const PATH_1 =
  'M0 0V158.747L39.1608 133.943V81.8541H75.8741L105.245 54.5694H39.1608V29.7651H234.965V104.178H144.406V54.5694L107.692 91.7758V104.178L137.063 136.423H244.755L271.678 104.178V29.7651L244.755 0H0Z';
const PATH_2 =
  'M276.573 29.7651L305.944 0H494.406L516.434 29.7651H315.734V104.178H357.343V136.423H305.944L276.573 104.178V29.7651Z';
const PATH_3 =
  'M491.958 54.5694H401.399V133.943H673.077L700 94.2562L673.077 54.5694H572.727L562.937 42.1672L572.727 29.7651H673.077L700 0H550.699L521.329 42.1672L550.699 84.3345H648.601L655.944 94.2562L648.601 104.178H440.559V84.3345H511.539L491.958 54.5694Z';

// 1. Generate foces.svg (512x512, dark background, official white FOCES logo)
const focesSvgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#101011"/>
  <g transform="translate(32, 205) scale(0.64)">
    <path d="${PATH_1}" fill="#FFFFFF"/>
    <path d="${PATH_2}" fill="#FFFFFF"/>
    <path d="${PATH_3}" fill="#FFFFFF"/>
  </g>
</svg>`;

// 2. Generate mask-icon.svg (512x512, transparent background, currentColor)
const maskIconSvgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(32, 205) scale(0.64)">
    <path d="${PATH_1}" fill="currentColor"/>
    <path d="${PATH_2}" fill="currentColor"/>
    <path d="${PATH_3}" fill="currentColor"/>
  </g>
</svg>`;

// 3. ICO encoder function for multi-size PNG-in-ICO
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let dataOffset = 6 + count * 16;
  const directory = Buffer.alloc(count * 16);

  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const entry = directory.subarray(i * 16, (i + 1) * 16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(pngBuffers[i].length, 8); // data size
    entry.writeUInt32LE(dataOffset, 12); // data offset
    dataOffset += pngBuffers[i].length;
  }

  return Buffer.concat([header, directory, ...pngBuffers]);
}

async function main() {
  console.log('Writing foces.svg and mask-icon.svg...');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'foces.svg'), focesSvgContent, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'mask-icon.svg'), maskIconSvgContent, 'utf8');

  console.log('Generating pwa-192.png and pwa-512.png...');
  await sharp(Buffer.from(focesSvgContent))
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'pwa-192.png'));

  await sharp(Buffer.from(focesSvgContent))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, 'pwa-512.png'));

  console.log('Generating multi-resolution favicon.ico...');
  const icoSizes = [16, 32, 48, 64];
  const icoBuffers = await Promise.all(
    icoSizes.map((size) => sharp(Buffer.from(focesSvgContent)).resize(size, size).png().toBuffer()),
  );
  const icoFile = buildIco(icoBuffers, icoSizes);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoFile);

  console.log('Generating og-image.jpg...');
  const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#0A0A0C"/>
    
    <!-- Top tagline: DARE . DEVELOP . DOMINATE -->
    <text x="600" y="135" text-anchor="middle" font-family="'Space Grotesk', system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF" letter-spacing="12">
      DARE . DEVELOP . DOMINATE
    </text>

    <!-- FOCES Giant Logo (700x159 scaled by 1.18 to 826x187.62, centered at X=187, Y=215) -->
    <g transform="translate(187, 215) scale(1.18)">
      <path d="${PATH_1}" fill="#FFFFFF"/>
      <path d="${PATH_2}" fill="#FFFFFF"/>
      <path d="${PATH_3}" fill="#FFFFFF"/>
    </g>

    <!-- Bottom tagline: FORUM OF COMPUTER ENGINEERING STUDENTS -->
    <text x="600" y="480" text-anchor="middle" font-family="'Space Grotesk', system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#FFFFFF" letter-spacing="6">
      FORUM OF COMPUTER ENGINEERING STUDENTS
    </text>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(PUBLIC_DIR, 'og-image.jpg'));

  console.log('✨ Asset generation complete!');
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
