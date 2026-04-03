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
    const isPlayingPhase =
      (gameState.phase ??
        (gameState.gameStarted && !gameState.winner ? "playing" : "idle")) ===
      "playing";

    if (
      !gameState.gameStarted ||
      gameState.winner ||
      !isPlayingPhase ||
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
    gameState.phase,
    gameState.winner,
    gameState.targetChangeTime,
    currentCategory.requiresSequence,
    setTimeRemaining,
  ]);
};
