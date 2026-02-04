import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import type { GameCategory, GameState } from "../hooks/use-game-logic";

/**
 * Updates remaining time for the target display.
 */
export const useTargetTimer = (
  gameState: GameState,
  currentCategory: GameCategory,
  setTimeRemaining: Dispatch<SetStateAction<number>>,
) => {
  useEffect(() => {
    if (
      !gameState.gameStarted ||
      gameState.winner ||
      currentCategory.requiresSequence
    ) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = gameState.targetChangeTime - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameState.gameStarted,
    gameState.winner,
    gameState.targetChangeTime,
    currentCategory.requiresSequence,
    setTimeRemaining,
  ]);
};
