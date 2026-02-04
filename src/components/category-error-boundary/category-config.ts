import type { ErrorCategory } from "./types";

/**
 * Category-specific fallback copy and labels.
 */
export interface CategoryErrorConfig {
  title: string;
  message: string;
  emoji: string;
  suggestions: string[];
  primaryAction: string;
  secondaryAction: string;
}

const CATEGORY_CONFIGS: Record<ErrorCategory, CategoryErrorConfig> = {
  "game-logic": {
    title: "Game Error",
    message: "Something went wrong with the game mechanics.",
    emoji: "🎮",
    suggestions: [
      "Try restarting the current level",
      "Check your device memory",
      "Close other apps",
    ],
    primaryAction: "Restart Level",
    secondaryAction: "Safe Mode",
  },
  audio: {
    title: "Audio Error",
    message: "There was a problem loading or playing sounds.",
    emoji: "🔊",
    suggestions: [
      "Check your audio settings",
      "Try refreshing the page",
      "Use headphones if available",
    ],
    primaryAction: "Retry Audio",
    secondaryAction: "Text Only Mode",
  },
  rendering: {
    title: "Display Error",
    message: "There was a problem showing the game graphics.",
    emoji: "🖼️",
    suggestions: [
      "Try a different browser",
      "Update your graphics drivers",
      "Reduce screen resolution",
    ],
    primaryAction: "Refresh Display",
    secondaryAction: "Simple Mode",
  },
  network: {
    title: "Connection Error",
    message: "Unable to connect to game services.",
    emoji: "🌐",
    suggestions: [
      "Check your internet connection",
      "Try again in a few minutes",
      "Contact support if persistent",
    ],
    primaryAction: "Retry Connection",
    secondaryAction: "Offline Mode",
  },
  performance: {
    title: "Performance Error",
    message: "The game is running too slowly on your device.",
    emoji: "🐌",
    suggestions: [
      "Close other browser tabs",
      "Restart your browser",
      "Try a simpler device",
    ],
    primaryAction: "Performance Mode",
    secondaryAction: "Reload Page",
  },
  unknown: {
    title: "Unexpected Error",
    message: "An unexpected error occurred.",
    emoji: "❓",
    suggestions: [
      "Try refreshing the page",
      "Clear browser cache",
      "Contact support",
    ],
    primaryAction: "Try Again",
    secondaryAction: "Reload Page",
  },
};

/**
 * Resolve the config for a given category with a safe fallback.
 */
export const getCategoryConfig = (category: ErrorCategory) =>
  CATEGORY_CONFIGS[category] ?? CATEGORY_CONFIGS.unknown;
