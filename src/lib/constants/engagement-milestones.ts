/**
 * Progress milestones and near-miss feedback messages.
 */

import type { Milestone } from "./engagement-types";

export const PROGRESS_MILESTONES: Milestone[] = [
  {
    progress: 25,
    title: "Great Start!",
    message: "Quarter of the way there!",
    emoji: "🌱",
    duration: 2000,
    effect: "stars",
  },
  {
    progress: 50,
    title: "Halfway Hero!",
    message: "You're doing amazing!",
    emoji: "⚡",
    duration: 2500,
    effect: "confetti",
  },
  {
    progress: 75,
    title: "Almost There!",
    message: "The finish line is in sight!",
    emoji: "🚀",
    duration: 2500,
    effect: "rainbow",
  },
  {
    progress: 100,
    title: "CHAMPION!",
    message: "You did it! Amazing work!",
    emoji: "🏆",
    duration: 4000,
    effect: "firework",
  },
];

export const NEAR_MISS_MESSAGES = [
  { message: "So close!", emoji: "💨" },
  { message: "Almost!", emoji: "🎯" },
  { message: "Try again!", emoji: "💪" },
  { message: "Keep looking!", emoji: "👀" },
];

export const getRandomNearMissMessage = () =>
  NEAR_MISS_MESSAGES[Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)];
