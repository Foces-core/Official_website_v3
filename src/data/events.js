import agenticCodingPoster from '../assets/agentic_coding_instagram.jpg';
import agenticCodingPhoto from '../assets/agentic_coding.jpg';
import codingArenaPoster from '../assets/coding_arena_4_0_insta.jpg';
import codingArenaPhoto from '../assets/coding_arena.jpg';
import promptParadoxPoster from '../assets/the_prompt_paradox_2_0_insta.jpg';

// Wrap a plain-text description as a Sanity portable-text block so the
// EventPage cards (which render content via BlockContent) can display it.
const toBlocks = (text, key) => [
  {
    _type: 'block',
    _key: `${key}-b1`,
    children: [{ _type: 'span', _key: `${key}-c1`, text }],
  },
];

// Single source of truth for events. The home "Events" section and the
// /events route both render from this list so they can never drift apart.
export const featuredEvents = [
  {
    id: 1,
    title: 'Agentic Coding Workshop',
    name: 'Agentic Coding Workshop',
    tag: 'Hands-on Workshop',
    date: '9th July 2026',
    image: agenticCodingPhoto,
    images: [agenticCodingPoster, agenticCodingPhoto],
    desc: 'Empowering developers to build autonomous AI agents using cutting-edge LLMs and agent frameworks.',
    content: toBlocks(
      'Empowering developers to build autonomous AI agents using cutting-edge LLMs and agent frameworks.',
      'agentic'
    ),
    tickets: '#',
  },
  {
    id: 2,
    title: 'Coding Arena 4.0',
    name: 'Coding Arena 4.0',
    tag: 'Bootcamp',
    date: '27th July - 5th Aug',
    image: codingArenaPoster,
    images: [codingArenaPoster, codingArenaPhoto],
    desc: 'The ultimate competitive programming and rapid prototyping battlefield at MCA Lab.',
    content: toBlocks(
      'The ultimate competitive programming and rapid prototyping battlefield at MCA Lab.',
      'arena'
    ),
    tickets: '#',
  },
  {
    id: 3,
    title: 'The Prompt Paradox 2.0',
    name: 'The Prompt Paradox 2.0',
    tag: 'AI & Prompt Engineering',
    date: '21st June 2026',
    image: promptParadoxPoster,
    images: [promptParadoxPoster],
    desc: 'Test your prompt engineering mastery, solve complex AI puzzles, and break through the digital maze.',
    content: toBlocks(
      'Test your prompt engineering mastery, solve complex AI puzzles, and break through the digital maze.',
      'paradox'
    ),
    tickets: '#',
  },
];

export default featuredEvents;
