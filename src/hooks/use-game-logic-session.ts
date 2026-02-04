import { useMemo } from "react";
import type { GameSessionDependencies } from "./game-logic/game-session";
import { createGameSessionHandlers } from "./game-logic/game-session";

/**
 * Builds game session start/reset handlers.
 */
export const useGameLogicSession = (dependencies: GameSessionDependencies) => {
  const { startGame, resetGame } = useMemo(
    () => createGameSessionHandlers(dependencies),
    [
      dependencies.clampLevel,
      dependencies.gameStateLevel,
      dependencies.continuousMode,
      dependencies.generateRandomTarget,
      dependencies.spawnImmediateTargets,
    ],
  );

  return { startGame, resetGame };
};
