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

import agenticSdpkRoom from '../assets/events/agentic_sdpk_room.webp';
import agenticSdpkRoom400 from '../assets/events/agentic_sdpk_room-400.webp';
import agenticSdpkRoom800 from '../assets/events/agentic_sdpk_room-800.webp';

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
import javaLecture800 from '../assets/events/java_algorithm_lecture-800.webp';

import { srcset } from '../utils/srcset.js';

const set = (full, s800, s400) =>
  srcset([
    [full, 1000],
    [s800, 800],
    [s400, 400],
  ]);

export const featuredEvents = [
  {
    id: 1,
    name: 'The Prompt Paradox 2.0',
    tag: 'AI & Prompt Engineering',
    date: '21st June 2026',
    image: promptParadoxPoster,
    imageSet: set(promptParadoxPoster, promptParadoxPoster800, promptParadoxPoster400),
    images: [promptParadoxPoster, promptParadoxWinners, promptParadoxLeaderboard],
    imageSets: [
      set(promptParadoxPoster, promptParadoxPoster800, promptParadoxPoster400),
      set(promptParadoxWinners, promptParadoxWinners800, promptParadoxWinners400),
      set(promptParadoxLeaderboard, promptParadoxLeaderboard800, promptParadoxLeaderboard400),
    ],
    desc: 'Test your prompt engineering mastery, solve complex AI puzzles, and break through the digital maze.',
    websiteUrl: 'https://foces-core.github.io/prompt-paradox-2/',
  },
  {
    id: 2,
    name: 'Agentic Coding Workshop',
    tag: 'Hands-on Workshop',
    date: '9th July 2026',
    image: agenticMentor,
    imageSet: set(agenticMentor, agenticMentor800, agenticMentor400),
    images: [agenticCodingPoster, agenticMentor, agenticSdpkRoom, agenticStudents],
    imageSets: [
      set(agenticCodingPoster, agenticCodingPoster800, agenticCodingPoster400),
      set(agenticMentor, agenticMentor800, agenticMentor400),
      set(agenticSdpkRoom, agenticSdpkRoom800, agenticSdpkRoom400),
      set(agenticStudents, agenticStudents800, agenticStudents400),
    ],
    desc: 'Empowering developers to build autonomous AI agents using cutting-edge LLMs and agent frameworks.',
  },
  {
    id: 3,
    name: 'Coding Arena 4.0',
    tag: 'Bootcamp',
    date: '27th July - 5th Aug',
    image: codingArenaPoster,
    imageSet: set(codingArenaPoster, codingArenaPoster800, codingArenaPoster400),
    images: [codingArenaPoster, codingArenaPhoto, javaLecture],
    imageSets: [
      set(codingArenaPoster, codingArenaPoster800, codingArenaPoster400),
      set(codingArenaPhoto, codingArenaPhoto800, codingArenaPhoto400),
      set(javaLecture, javaLecture800, javaLecture400),
    ],
    desc: 'The ultimate competitive programming and rapid prototyping battlefield at MCA Lab.',
  },
];

export default featuredEvents;
