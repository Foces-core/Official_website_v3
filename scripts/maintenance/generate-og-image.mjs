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

async function generateOgImage() {
  console.log('Generating og-image.jpg matching user reference format...');

  // SVG representation (1200 x 630) matching user material:
  // - Top line: DARE . DEVELOP . DOMINATE
  // - Middle: Giant FOCES vector logo
  // - Bottom line: FORUM OF COMPUTER ENGINEERING STUDENTS
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

  console.log('✅ og-image.jpg successfully updated!');
}

generateOgImage().catch((err) => {
  console.error('Error generating og-image.jpg:', err);
  process.exit(1);
});
