// Single source of truth for events (mirrors src/data/team.js and
// src/data/echoSlides.js) — the home-page events section and the /events
// route both render from this array, and validateEvents pins its shape in
// CI. Photos are built with photoTriplet (three responsive widths); see
// src/utils/eventPhotos.js.
import agenticCodingPoster from '../assets/agentic_coding_instagram.webp';
import agenticCodingPoster400 from '../assets/agentic_coding_instagram-400.webp';
import agenticCodingPoster800 from '../assets/agentic_coding_instagram-800.webp';

import codingArenaPoster from '../assets/coding_arena_4_0_insta.webp';
import codingArenaPoster400 from '../assets/coding_arena_4_0_insta-400.webp';
import codingArenaPoster800 from '../assets/coding_arena_4_0_insta-800.webp';
import codingArenaPhoto from '../assets/coding_arena.webp';
import codingArenaPhoto400 from '../assets/coding_arena-400.webp';
import codingArenaPhoto800 from '../assets/coding_arena-800.webp';

import promptParadoxPoster from '../assets/the_prompt_paradox_2_0_insta.webp';
import promptParadoxPoster400 from '../assets/the_prompt_paradox_2_0_insta-400.webp';
import promptParadoxPoster800 from '../assets/the_prompt_paradox_2_0_insta-800.webp';

// High resolution event photos & video frame extractions
import agenticMentor from '../assets/events/agentic_workshop_mentor.webp';
import agenticMentor400 from '../assets/events/agentic_workshop_mentor-400.webp';
import agenticMentor800 from '../assets/events/agentic_workshop_mentor-800.webp';

import agenticStudents from '../assets/events/agentic_workshop_students.webp';
import agenticStudents400 from '../assets/events/agentic_workshop_students-400.webp';
import agenticStudents800 from '../assets/events/agentic_workshop_students-800.webp';

import promptParadoxWinners from '../assets/events/prompt_paradox_winners.webp';
import promptParadoxWinners400 from '../assets/events/prompt_paradox_winners-400.webp';
import promptParadoxWinners800 from '../assets/events/prompt_paradox_winners-800.webp';

import promptParadoxLeaderboard from '../assets/events/prompt_paradox_leaderboard.webp';
import promptParadoxLeaderboard400 from '../assets/events/prompt_paradox_leaderboard-400.webp';
import promptParadoxLeaderboard800 from '../assets/events/prompt_paradox_leaderboard-800.webp';

import javaLecture from '../assets/events/java_algorithm_lecture.webp';
import javaLecture400 from '../assets/events/java_algorithm_lecture-400.webp';

import { srcset } from '../utils/srcset.js';
import { photoTriplet } from '../utils/eventPhotos.js';

export const featuredEvents = [
  {
    id: 1,
    name: 'The Prompt Paradox 2.0',
    tag: 'AI & Prompt Engineering',
    date: '21st June 2026',
    photos: [
      photoTriplet(promptParadoxPoster, promptParadoxPoster800, promptParadoxPoster400),
      photoTriplet(promptParadoxWinners, promptParadoxWinners800, promptParadoxWinners400),
      photoTriplet(
        promptParadoxLeaderboard,
        promptParadoxLeaderboard800,
        promptParadoxLeaderboard400,
      ),
    ],
    desc: 'Test your prompt engineering mastery, solve complex AI puzzles, and break through the digital maze.',
    websiteUrl: 'https://foces-core.github.io/prompt-paradox-2/',
  },
  {
    id: 2,
    name: 'Agentic Coding Workshop',
    tag: 'Hands-on Workshop',
    date: '9th July 2026',
    photos: [
      photoTriplet(agenticCodingPoster, agenticCodingPoster800, agenticCodingPoster400),
      photoTriplet(agenticMentor, agenticMentor800, agenticMentor400),
      photoTriplet(agenticStudents, agenticStudents800, agenticStudents400),
    ],
    desc: 'Empowering developers to build autonomous AI agents using cutting-edge LLMs and agent frameworks.',
  },
  {
    id: 3,
    name: 'Coding Arena 4.0',
    tag: 'Bootcamp',
    date: '27th July - 5th Aug',
    photos: [
      photoTriplet(codingArenaPoster, codingArenaPoster800, codingArenaPoster400),
      // java_algorithm_lecture.webp is intrinsically 576px wide — the -800
      // variant was byte-identical (withoutEnlargement capped it), and
      // declaring the 576px file at 800w/1000w would make browsers upscale
      // it. Use its true width instead.
      {
        url: javaLecture,
        srcset: srcset([
          [javaLecture, 576],
          [javaLecture400, 400],
        ]),
      },
      photoTriplet(codingArenaPhoto, codingArenaPhoto800, codingArenaPhoto400),
    ],
    desc: 'The ultimate competitive programming and rapid prototyping battlefield at MCA Lab.',
  },
];
