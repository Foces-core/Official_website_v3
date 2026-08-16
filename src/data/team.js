// Single source of truth for the team roster (mirrors src/data/events.js).
// The roster used to live inside Execom.jsx's layout; extracting it lets the
// shape guard (src/utils/validateTeam.js) pin it in CI like events, and keeps
// the layout component readable.
//
// Image strategy (same seam as events): each member carries a full-size img
// (retina/zoom), a 400w srcset candidate (the workhorse — the carousel cards
// never render wider than ~360px, so 1x phones/desktops download the
// right-sized 400w file instead of the full-size), and a w=20 blur LQIP for
// the blur-up placeholder. The -400.webp variants are generated from the
// full-size originals by scripts/maintenance/generate-team-variants.mjs.
// Width hints match each file's intrinsic width (the validateEvents
// width-accuracy rule: never declare a file wider than it is).
import Aleetta from '../assets/aleeta.webp';
import Aleetta400 from '../assets/aleeta-400.webp';
import AleettaBlur from '../assets/aleeta.webp?blur&w=20';
import Lisha from '../assets/lisha1.webp';
import Lisha400 from '../assets/lisha1-400.webp';
import LishaBlur from '../assets/lisha1.webp?blur&w=20';
import Steve from '../assets/steve.webp';
import Steve400 from '../assets/steve-400.webp';
import SteveBlur from '../assets/steve.webp?blur&w=20';
import AnnaRachel from '../assets/anna_rachel.webp';
import AnnaRachel400 from '../assets/anna_rachel-400.webp';
import AnnaRachelBlur from '../assets/anna_rachel.webp?blur&w=20';
import Amanul from '../assets/amanul.webp';
import Amanul400 from '../assets/amanul-400.webp';
import AmanulBlur from '../assets/amanul.webp?blur&w=20';
import Abel from '../assets/abel.webp';
import Abel400 from '../assets/abel-400.webp';
import AbelBlur from '../assets/abel.webp?blur&w=20';
import Saniya from '../assets/saniya.webp';
import Saniya400 from '../assets/saniya-400.webp';
import SaniyaBlur from '../assets/saniya.webp?blur&w=20';
import Sebin from '../assets/sebin.webp';
import Sebin400 from '../assets/sebin-400.webp';
import SebinBlur from '../assets/sebin.webp?blur&w=20';
import Anjitha from '../assets/anjitha.webp';
import Anjitha400 from '../assets/anjitha-400.webp';
import AnjithaBlur from '../assets/anjitha.webp?blur&w=20';
import Abhirami from '../assets/abhirami_p.webp';
import Abhirami400 from '../assets/abhirami_p-400.webp';
import AbhiramiBlur from '../assets/abhirami_p.webp?blur&w=20';
import Devadarsana from '../assets/devadarsana.webp?v=3';
import Devadarsana400 from '../assets/devadarsana-400.webp';
import DevadarsanaBlur from '../assets/devadarsana.webp?blur&w=20';
import Gopakumar from '../assets/gopakumar.webp';
import Gopakumar400 from '../assets/gopakumar-400.webp';
// The advisor banner keeps a w=128 LQIP (vs the cards' w=20): it's the
// section lead, and w=128 keeps enough minimal detail to read as a portrait
// while it loads — same policy as the events first image.
import GopakumarBlur from '../assets/gopakumar.webp?blur&w=128';

import { srcset } from '../utils/srcset.js';

export const cardData = [
  {
    name: 'Aleetta Mariya Sebastian',
    img: Aleetta,
    srcset: srcset([
      [Aleetta, 792],
      [Aleetta400, 400],
    ]),
    blur: AleettaBlur,
    role: 'Chairperson',
  },
  {
    name: 'Lisha Jins',
    img: Lisha,
    srcset: srcset([
      [Lisha, 796],
      [Lisha400, 400],
    ]),
    blur: LishaBlur,
    role: 'Vice Chairperson',
  },
  {
    name: 'Steve Jose',
    img: Steve,
    srcset: srcset([
      [Steve, 792],
      [Steve400, 400],
    ]),
    blur: SteveBlur,
    role: 'Secretary',
  },
  {
    name: 'Anna Rachel Mathew',
    img: AnnaRachel,
    srcset: srcset([
      [AnnaRachel, 600],
      [AnnaRachel400, 400],
    ]),
    blur: AnnaRachelBlur,
    role: 'Joint Secretary',
  },
  {
    name: 'Amanul Farhan K S',
    img: Amanul,
    srcset: srcset([
      [Amanul, 792],
      [Amanul400, 400],
    ]),
    blur: AmanulBlur,
    role: 'Treasurer',
  },
  {
    name: 'Abel S Mathew',
    img: Abel,
    srcset: srcset([
      [Abel, 792],
      [Abel400, 400],
    ]),
    blur: AbelBlur,
    role: 'Research & Development Lead',
  },
  {
    name: 'Saniya K Shibu',
    img: Saniya,
    srcset: srcset([
      [Saniya, 792],
      [Saniya400, 400],
    ]),
    blur: SaniyaBlur,
    role: 'Program Outreach Coordinator',
  },
  {
    name: 'Sebin Mathew',
    img: Sebin,
    srcset: srcset([
      [Sebin, 600],
      [Sebin400, 400],
    ]),
    blur: SebinBlur,
    role: 'Project Coordinator',
  },
  {
    name: 'Anjitha Aravind',
    img: Anjitha,
    srcset: srcset([
      [Anjitha, 750],
      [Anjitha400, 400],
    ]),
    blur: AnjithaBlur,
    role: 'Operations Lead',
  },
  {
    name: 'Abhirami P',
    img: Abhirami,
    srcset: srcset([
      [Abhirami, 800],
      [Abhirami400, 400],
    ]),
    blur: AbhiramiBlur,
    role: 'Design Lead',
  },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    srcset: srcset([
      [Devadarsana, 792],
      [Devadarsana400, 400],
    ]),
    blur: DevadarsanaBlur,
    role: 'Public Relations Lead',
  },
];

// 3 copies of the cards for the seamless-infinite wrap (see TeamCarousel).
export const cubeSlides = [...cardData, ...cardData, ...cardData];

export const advisor = {
  name: 'Gopakumar G',
  img: Gopakumar,
  srcset: srcset([
    [Gopakumar, 600],
    [Gopakumar400, 400],
  ]),
  blur: GopakumarBlur,
  role: 'Advisor',
};
