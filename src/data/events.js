import agenticCodingPoster from '../assets/agentic_coding_instagram.webp';
import agenticCodingPoster400 from '../assets/agentic_coding_instagram-400.webp';
import agenticCodingPoster800 from '../assets/agentic_coding_instagram-800.webp';
import agenticCodingPhoto from '../assets/agentic_coding.webp';
import agenticCodingPhoto400 from '../assets/agentic_coding-400.webp';
import agenticCodingPhoto800 from '../assets/agentic_coding-800.webp';
import codingArenaPoster from '../assets/coding_arena_4_0_insta.webp';
import codingArenaPoster400 from '../assets/coding_arena_4_0_insta-400.webp';
import codingArenaPoster800 from '../assets/coding_arena_4_0_insta-800.webp';
import codingArenaPhoto from '../assets/coding_arena.webp';
import codingArenaPhoto400 from '../assets/coding_arena-400.webp';
import codingArenaPhoto800 from '../assets/coding_arena-800.webp';
import codingArenaPhoto2 from '../assets/coding_arena_photo.webp';
import codingArenaPhoto2_400 from '../assets/coding_arena_photo-400.webp';
import codingArenaPhoto2_800 from '../assets/coding_arena_photo-800.webp';
import promptParadoxPoster from '../assets/the_prompt_paradox_2_0_insta.webp';
import promptParadoxPoster400 from '../assets/the_prompt_paradox_2_0_insta-400.webp';
import promptParadoxPoster800 from '../assets/the_prompt_paradox_2_0_insta-800.webp';
import { srcset } from '../utils/srcset.js';

const set = (full, s800, s400) =>
  srcset([
    [full, 1000],
    [s800, 800],
    [s400, 400],
  ]);

// Single source of truth for events. The home "Events" section and the
// /events route both render from this list so they can never drift apart.
export const featuredEvents = [
  {
    id: 1,
    name: 'Agentic Coding Workshop',
    tag: 'Hands-on Workshop',
    date: '9th July 2026',
    image: agenticCodingPhoto,
    imageSet: set(agenticCodingPhoto, agenticCodingPhoto800, agenticCodingPhoto400),
    images: [agenticCodingPoster, agenticCodingPhoto],
    imageSets: [
      set(agenticCodingPoster, agenticCodingPoster800, agenticCodingPoster400),
      set(agenticCodingPhoto, agenticCodingPhoto800, agenticCodingPhoto400),
    ],
    desc: 'Empowering developers to build autonomous AI agents using cutting-edge LLMs and agent frameworks.',
  },
  {
    id: 2,
    name: 'Coding Arena 4.0',
    tag: 'Bootcamp',
    date: '27th July - 5th Aug',
    image: codingArenaPoster,
    imageSet: set(codingArenaPoster, codingArenaPoster800, codingArenaPoster400),
    images: [codingArenaPoster, codingArenaPhoto, codingArenaPhoto2],
    imageSets: [
      set(codingArenaPoster, codingArenaPoster800, codingArenaPoster400),
      set(codingArenaPhoto, codingArenaPhoto800, codingArenaPhoto400),
      set(codingArenaPhoto2, codingArenaPhoto2_800, codingArenaPhoto2_400),
    ],
    desc: 'The ultimate competitive programming and rapid prototyping battlefield at MCA Lab.',
  },
  {
    id: 3,
    name: 'The Prompt Paradox 2.0',
    tag: 'AI & Prompt Engineering',
    date: '21st June 2026',
    image: promptParadoxPoster,
    imageSet: set(promptParadoxPoster, promptParadoxPoster800, promptParadoxPoster400),
    images: [promptParadoxPoster],
    imageSets: [set(promptParadoxPoster, promptParadoxPoster800, promptParadoxPoster400)],
    desc: 'Test your prompt engineering mastery, solve complex AI puzzles, and break through the digital maze.',
  },
];

export default featuredEvents;
