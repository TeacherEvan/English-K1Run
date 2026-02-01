/**
 * Welcome Audio Integration Hook
 *
 * Connects the game logic with the welcome audio sequencer
 * to filter out audio clips associated with active target emojis.
 *
 * @module hooks/use-welcome-audio-integration
 */

import { useCallback, useEffect } from "react";
import {
  clearActiveTargetEmojis,
  setActiveTargetEmojis,
} from "../lib/audio/welcome-audio-sequencer";

interface UseWelcomeAudioIntegrationProps {
  /** Current target emoji */
  targetEmoji: string;
  /** Whether the game has started */
  gameStarted: boolean;
  /** Current game category items */
  categoryItems: Array<{ emoji: string; name: string }>;
}

/**
 * Hook to integrate welcome audio with game state
 *
 * Automatically updates the active target emoji filters based on
 * the current game state. This ensures that welcome audio sequences
 * won't play clips associated with emojis that are currently active
 * as targets in the gameplay.
 *
 * @example
 * ```tsx
 * const { gameState, currentCategory } = useGameLogic();
 *
 * useWelcomeAudioIntegration({
 *   targetEmoji: gameState.targetEmoji,
 *   gameStarted: gameState.gameStarted,
 *   categoryItems: currentCategory.items,
 * });
 * ```
 */
export function useWelcomeAudioIntegration({
  targetEmoji,
  gameStarted,
  categoryItems,
}: UseWelcomeAudioIntegrationProps): void {
  useEffect(() => {
    // Only filter when game is active
    if (!gameStarted) {
      clearActiveTargetEmojis();
      return;
    }

    // Collect all emojis that should be filtered
    const emojisToFilter = new Set<string>();

    // Always filter the current target emoji
    if (targetEmoji) {
      emojisToFilter.add(targetEmoji);
    }

    // Also filter emojis from the current category to avoid spoilers
    // This prevents welcome audio from previewing items that will appear
    categoryItems.forEach((item) => {
      emojisToFilter.add(item.emoji);
    });

    // Update the filter
    setActiveTargetEmojis(Array.from(emojisToFilter));

    return () => {
      // Clear filters when component unmounts or game stops
      clearActiveTargetEmojis();
    };
  }, [targetEmoji, gameStarted, categoryItems]);
}

/**
 * Hook variant for pre-game welcome audio configuration
 *
 * Use this when you want to explicitly configure which emojis
 * should be filtered from welcome audio before the game starts.
 */
export function usePreGameAudioFilter(excludedEmojis: string[]): {
  setExcludedEmojis: (emojis: string[]) => void;
  clearExcludedEmojis: () => void;
} {
  useEffect(() => {
    if (excludedEmojis.length > 0) {
      setActiveTargetEmojis(excludedEmojis);
    }

    return () => {
      clearActiveTargetEmojis();
    };
  }, [excludedEmojis]);

  const setExcludedEmojis = useCallback((emojis: string[]) => {
    setActiveTargetEmojis(emojis);
  }, []);

  const clearExcludedEmojis = useCallback(() => {
    clearActiveTargetEmojis();
  }, []);

  return {
    setExcludedEmojis,
    clearExcludedEmojis,
  };
}
