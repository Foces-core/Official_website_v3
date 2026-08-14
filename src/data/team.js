// Single source of truth for the team roster (mirrors src/data/events.js).
// The roster used to live inside Execom.jsx's layout; extracting it lets the
// shape guard (src/utils/validateTeam.js) pin it in CI like events, and keeps
// the layout component readable.
import Aleetta from '../assets/aleeta.webp';
import AleettaBlur from '../assets/aleeta.webp?blur&w=20';
import Lisha from '../assets/lisha1.webp';
import LishaBlur from '../assets/lisha1.webp?blur&w=20';
import Steve from '../assets/steve.webp';
import SteveBlur from '../assets/steve.webp?blur&w=20';
import AnnaRachel from '../assets/anna_rachel.webp';
import AnnaRachelBlur from '../assets/anna_rachel.webp?blur&w=20';
import Amanul from '../assets/amanul.webp';
import AmanulBlur from '../assets/amanul.webp?blur&w=20';
import Abel from '../assets/abel.webp';
import AbelBlur from '../assets/abel.webp?blur&w=20';
import Saniya from '../assets/saniya.webp';
import SaniyaBlur from '../assets/saniya.webp?blur&w=20';
import Sebin from '../assets/sebin.webp';
import SebinBlur from '../assets/sebin.webp?blur&w=20';
import Anjitha from '../assets/anjitha.webp';
import AnjithaBlur from '../assets/anjitha.webp?blur&w=20';
import Abhirami from '../assets/abhirami_p.webp';
import AbhiramiBlur from '../assets/abhirami_p.webp?blur&w=20';
import Devadarsana from '../assets/devadarsana.webp?v=3';
import DevadarsanaBlur from '../assets/devadarsana.webp?blur&w=20&v=3';
import Gopakumar from '../assets/gopakumar.webp';
import GopakumarBlur from '../assets/gopakumar.webp?blur&w=20';

export const cardData = [
  { name: 'Aleetta Mariya Sebastian', img: Aleetta, blur: AleettaBlur, role: 'Chairperson' },
  { name: 'Lisha Jins', img: Lisha, blur: LishaBlur, role: 'Vice Chairperson' },
  { name: 'Steve Jose', img: Steve, blur: SteveBlur, role: 'Secretary' },
  { name: 'Anna Rachel Mathew', img: AnnaRachel, blur: AnnaRachelBlur, role: 'Joint Secretary' },
  { name: 'Amanul Farhan K S', img: Amanul, blur: AmanulBlur, role: 'Treasurer' },
  { name: 'Abel S Mathew', img: Abel, blur: AbelBlur, role: 'Research & Development Lead' },
  { name: 'Saniya K Shibu', img: Saniya, blur: SaniyaBlur, role: 'Program Outreach Coordinator' },
  { name: 'Sebin Mathew', img: Sebin, blur: SebinBlur, role: 'Project Coordinator' },
  { name: 'Anjitha Aravind', img: Anjitha, blur: AnjithaBlur, role: 'Operations Lead' },
  { name: 'Abhirami P', img: Abhirami, blur: AbhiramiBlur, role: 'Design Lead' },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    blur: DevadarsanaBlur,
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
