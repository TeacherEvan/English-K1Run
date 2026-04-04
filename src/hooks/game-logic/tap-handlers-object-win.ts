import { LEVEL_COMPLETE_POPUP_MS } from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import type { GameState } from "../../types/game";

interface ProgressWinDeps {
  prev: GameState;
  newState: GameState;
}

/**
 * Applies win logic when progress reaches 100%.
 */
export const handleProgressWin = ({ prev, newState }: ProgressWinDeps) => {
  const nextQueueIndex = (prev.levelQueueIndex ?? 0) + 1;
  const nextLevel = prev.levelQueue?.[nextQueueIndex];

  if (nextLevel !== undefined) {
    newState.phase = "levelComplete";
    newState.pendingLevel = nextLevel;
    newState.levelQueueIndex = nextQueueIndex;
    newState.levelCompleteEndsAt = Date.now() + LEVEL_COMPLETE_POPUP_MS;
    newState.winner = false;
    eventTracker.trackGameStateChange(
      { ...prev },
      { ...newState },
      "default_mode_level_complete",
    );
  } else {
    newState.phase = "runComplete";
    newState.winner = true;
    eventTracker.trackGameStateChange(
      { ...prev },
      { ...newState },
      "player_wins",
    );
  }
};
