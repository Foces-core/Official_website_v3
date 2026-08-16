// Single source of truth for the team roster (mirrors src/data/events.js).
// The roster used to live inside Execom.jsx's layout; extracting it lets the
// shape guard (src/utils/validateTeam.js) pin it in CI like events, and keeps
// the layout component readable.
import Aleetta from '../assets/aleeta.webp';
import Lisha from '../assets/lisha1.webp';
import Steve from '../assets/steve.webp';
import AnnaRachel from '../assets/anna_rachel.webp';
import Amanul from '../assets/amanul.webp';
import Abel from '../assets/abel.webp';
import Saniya from '../assets/saniya.webp';
import Sebin from '../assets/sebin.webp';
import Anjitha from '../assets/anjitha.webp';
import Abhirami from '../assets/abhirami_p.webp';
import Devadarsana from '../assets/devadarsana.webp?v=3';
import Gopakumar from '../assets/gopakumar.webp';
// The advisor banner is the FIRST image in the Execom section — it gets the
// blur-up LQIP treatment (w=128) while the carousel cards stay plain lazy
// loads (blur-up only where it's the section's lead image).
import GopakumarBlur from '../assets/gopakumar.webp?blur&w=128';

export const cardData = [
  { name: 'Aleetta Mariya Sebastian', img: Aleetta, role: 'Chairperson' },
  { name: 'Lisha Jins', img: Lisha, role: 'Vice Chairperson' },
  { name: 'Steve Jose', img: Steve, role: 'Secretary' },
  { name: 'Anna Rachel Mathew', img: AnnaRachel, role: 'Joint Secretary' },
  { name: 'Amanul Farhan K S', img: Amanul, role: 'Treasurer' },
  { name: 'Abel S Mathew', img: Abel, role: 'Research & Development Lead' },
  { name: 'Saniya K Shibu', img: Saniya, role: 'Program Outreach Coordinator' },
  { name: 'Sebin Mathew', img: Sebin, role: 'Project Coordinator' },
  { name: 'Anjitha Aravind', img: Anjitha, role: 'Operations Lead' },
  { name: 'Abhirami P', img: Abhirami, role: 'Design Lead' },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    role: 'Public Relations Lead',
  },
];

// 3 copies of the cards for the seamless-infinite wrap (see TeamCarousel).
export const cubeSlides = [...cardData, ...cardData, ...cardData];

export const advisor = {
  name: 'Gopakumar G',
  img: Gopakumar,
  blur: GopakumarBlur,
  role: 'Advisor',
};
