import { createResetGame } from "./game-session-reset";
import { createStartGame } from "./game-session-start";
import type { GameSessionDependencies } from "./game-session-types";
export type { GameSessionDependencies } from "./game-session-types";

/**
 * Game Session Handlers
 */
export const createGameSessionHandlers = (
  dependencies: GameSessionDependencies,
) => {
  const startGame = createStartGame(dependencies);
  const resetGame = createResetGame(dependencies);
  return { startGame, resetGame };
};
