/**
 * Achievement and feedback messages for game events
 *
 * Expanded message system for enhanced emotional feedback
 * Messages are age-appropriate for kindergarten (4-6 years)
 */

export interface FeedbackMessage {
  message: string;
  emoji: string;
}

// Positive messages for correct taps - expanded for more variety
export const CORRECT_MESSAGES: FeedbackMessage[] = [
  // Classic encouragement
  { message: "Perfect!", emoji: "⭐" },
  { message: "Great Job!", emoji: "✨" },
  { message: "Awesome!", emoji: "🌟" },
  { message: "Excellent!", emoji: "💫" },
  { message: "Super!", emoji: "🎉" },
  { message: "Amazing!", emoji: "🎊" },
  { message: "Fantastic!", emoji: "🌈" },
  { message: "Wonderful!", emoji: "💖" },
  { message: "Brilliant!", emoji: "✨" },
  { message: "You did it!", emoji: "🏆" },
  // New encouraging messages
  { message: "Wow!", emoji: "😄" },
  { message: "Yes!", emoji: "👏" },
  { message: "Correct!", emoji: "✅" },
  { message: "Hooray!", emoji: "🥳" },
  { message: "Well done!", emoji: "🎯" },
  { message: "Keep going!", emoji: "🚀" },
  { message: "Nice!", emoji: "👍" },
  { message: "Yay!", emoji: "🙌" },
  { message: "Good eye!", emoji: "👁️" },
  { message: "Smart!", emoji: "🧠" },
];

// Fun messages for worm taps
export const WORM_MESSAGES: FeedbackMessage[] = [
  { message: "Got one!", emoji: "🐛" },
  { message: "Nice catch!", emoji: "👍" },
  { message: "Squish!", emoji: "💥" },
  { message: "Gotcha!", emoji: "🎯" },
  { message: "Wiggle wiggle!", emoji: "🐛" },
  { message: "Worm away!", emoji: "✨" },
  { message: "Bye bye worm!", emoji: "👋" },
  { message: "Caught it!", emoji: "🎉" },
  // New worm messages
  { message: "Zap!", emoji: "⚡" },
  { message: "Poof!", emoji: "💨" },
  { message: "Magic!", emoji: "🪄" },
  { message: "Gone!", emoji: "✨" },
];

// Streak-specific encouragement messages
export const STREAK_MESSAGES: Record<number, FeedbackMessage[]> = {
  3: [
    { message: "Hat trick!", emoji: "🎩" },
    { message: "Triple!", emoji: "3️⃣" },
  ],
  5: [
    { message: "High five!", emoji: "🖐️" },
    { message: "Five stars!", emoji: "⭐⭐⭐⭐⭐" },
  ],
  7: [
    { message: "Lucky seven!", emoji: "🍀" },
    { message: "On fire!", emoji: "🔥" },
  ],
  10: [
    { message: "Perfect 10!", emoji: "💯" },
    { message: "Incredible!", emoji: "🤩" },
  ],
  15: [
    { message: "Superstar!", emoji: "🌟" },
    { message: "Legendary!", emoji: "🦸" },
  ],
  20: [
    { message: "CHAMPION!", emoji: "🏆" },
    { message: "UNSTOPPABLE!", emoji: "💪" },
  ],
};

/**
 * Get a random correct message
 */
export const getRandomCorrectMessage = (): FeedbackMessage => {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
};

/**
 * Get a random worm message
 */
export const getRandomWormMessage = (): FeedbackMessage => {
  return WORM_MESSAGES[Math.floor(Math.random() * WORM_MESSAGES.length)];
};

/**
 * Get a streak-specific message if available
 */
export const getStreakMessage = (
  streak: number
): FeedbackMessage | undefined => {
  const messages = STREAK_MESSAGES[streak];
  if (messages && messages.length > 0) {
    return messages[Math.floor(Math.random() * messages.length)];
  }
  return undefined;
};
