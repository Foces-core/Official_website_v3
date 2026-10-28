import { cardData } from '../../data/team.js';
import Anna from '../../assets/anna-rachel-2026.webp';
import Anna400 from '../../assets/anna-rachel-2026-400.webp';
import AnnaBlur from '../../assets/anna-rachel-2026.webp?blur&w=20';
import Abhirami from '../../assets/abhirami-2026.webp';
import Abhirami400 from '../../assets/abhirami-2026-400.webp';
import AbhiramiBlur from '../../assets/abhirami-2026.webp?blur&w=20';
import Anjitha from '../../assets/anjitha-2026.webp';
import Anjitha400 from '../../assets/anjitha-2026-400.webp';
import AnjithaBlur from '../../assets/anjitha-2026.webp?blur&w=20';
import Lisha from '../../assets/lisha-2026.webp';
import Lisha400 from '../../assets/lisha-2026-400.webp';
import LishaBlur from '../../assets/lisha-2026.webp?blur&w=20';
import Sebin from '../../assets/sebin-2026.webp';
import Sebin400 from '../../assets/sebin-2026-400.webp';
import SebinBlur from '../../assets/sebin-2026.webp?blur&w=20';
import Devadarsana from '../../assets/devadarsana-2026.webp';
import Devadarsana400 from '../../assets/devadarsana-2026-400.webp';
import DevadarsanaBlur from '../../assets/devadarsana-2026.webp?blur&w=20';
import { srcset } from '../../utils/srcset.js';

const updatedPortrait = (full, small, blur) => ({
  img: full,
  srcset: srcset([
    [full, 1200],
    [small, 400],
  ]),
  blur,
});

const desktopPortraits = new Map([
  ['Anna Rachel Mathew', updatedPortrait(Anna, Anna400, AnnaBlur)],
  ['Abhirami P', updatedPortrait(Abhirami, Abhirami400, AbhiramiBlur)],
  ['Anjitha Aravind', updatedPortrait(Anjitha, Anjitha400, AnjithaBlur)],
  ['Lisha Jins', updatedPortrait(Lisha, Lisha400, LishaBlur)],
  ['Sebin Mathew', updatedPortrait(Sebin, Sebin400, SebinBlur)],
  ['Devadarsana R', updatedPortrait(Devadarsana, Devadarsana400, DevadarsanaBlur)],
]);

export const desktopCardData = cardData.map((member) => ({
  ...member,
  ...desktopPortraits.get(member.name),
}));

export const desktopCubeSlides = [...desktopCardData, ...desktopCardData, ...desktopCardData];
