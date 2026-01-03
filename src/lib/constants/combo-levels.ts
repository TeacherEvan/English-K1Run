/**
 * Combo celebration thresholds and messages
 *
 * Expanded combo system for enhanced engagement:
 * - More frequent celebrations to maintain excitement
 * - Progressive rewards that escalate with difficulty
 * - Point multipliers to reward sustained performance
 */

export interface ComboLevel {
  streak: number;
  title: string;
  description: string;
  /** Point multiplier for this combo level (base is 1.0) */
  multiplier: number;
  /** Emoji to display in celebration */
  emoji: string;
  /** Whether this triggers a special visual effect */
  specialEffect?: "sparkle" | "rainbow" | "firework" | "golden";
}

export const COMBO_LEVELS: ComboLevel[] = [
  {
    streak: 3,
    title: "Triple Treat!",
    description: "Three perfect taps in a row!",
    multiplier: 1.2,
    emoji: "⭐",
    specialEffect: "sparkle",
  },
  {
    streak: 5,
    title: "Fantastic Five!",
    description: "Five flawless finds!",
    multiplier: 1.5,
    emoji: "🌟",
    specialEffect: "sparkle",
  },
  {
    streak: 7,
    title: "Lucky Legend!",
    description: "Seven sparkling successes!",
    multiplier: 1.8,
    emoji: "✨",
    specialEffect: "rainbow",
  },
  {
    streak: 10,
    title: "Perfect Ten!",
    description: "Double digits of awesomeness!",
    multiplier: 2.0,
    emoji: "🔥",
    specialEffect: "firework",
  },
  {
    streak: 15,
    title: "Superstar!",
    description: "Fifteen fantastic finds!",
    multiplier: 2.5,
    emoji: "💫",
    specialEffect: "firework",
  },
  {
    streak: 20,
    title: "UNSTOPPABLE!",
    description: "Twenty in a row! You are a champion!",
    multiplier: 3.0,
    emoji: "🏆",
    specialEffect: "golden",
  },
];

/**
 * Get the current combo multiplier based on streak count
 * Returns the highest applicable multiplier
 */
export const getStreakMultiplier = (streak: number): number => {
  let multiplier = 1.0;
  for (const level of COMBO_LEVELS) {
    if (streak >= level.streak) {
      multiplier = level.multiplier;
    } else {
      break;
    }
  }
  return multiplier;
};

/**
 * Get the current combo level for a given streak
 * Returns undefined if no combo level is reached
 */
export const getCurrentComboLevel = (
  streak: number
): ComboLevel | undefined => {
  return COMBO_LEVELS.find((level) => level.streak === streak);
};
