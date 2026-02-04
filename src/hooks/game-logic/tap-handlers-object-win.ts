import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import type { GameState } from "../../types/game";

interface ProgressWinDeps {
  prev: GameState;
  newState: GameState;
  continuousMode: boolean;
  continuousModeTargetCount: MutableRefObject<number>;
  continuousModeHighScore: number | null;
  continuousModeStartTime: number | null;
  setContinuousModeHighScore: Dispatch<SetStateAction<number | null>>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  refillTargetPool: (levelIndex?: number) => void;
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  spawnImmediateTargets: () => void;
}

/**
 * Applies win logic when progress reaches 100%.
 */
export const handleProgressWin = ({
  prev,
  newState,
  continuousMode,
  continuousModeTargetCount,
  continuousModeHighScore,
  continuousModeStartTime,
  setContinuousModeHighScore,
  setContinuousModeStartTime,
  refillTargetPool,
  generateRandomTarget,
  spawnImmediateTargets,
}: ProgressWinDeps) => {
  if (continuousMode) {
    continuousModeTargetCount.current += 1;
    newState.progress = 0;
    newState.winner = false;
    newState.lastMilestone = 0;

    if (continuousModeTargetCount.current >= 5) {
      continuousModeTargetCount.current = 0;
      const nextLevel = (prev.level + 1) % GAME_CATEGORIES.length;
      newState.level = nextLevel;

      if (GAME_CATEGORIES[nextLevel].requiresSequence) {
        GAME_CATEGORIES[nextLevel].sequenceIndex = 0;
      }

      refillTargetPool(nextLevel);

      if (nextLevel === 0 && continuousModeStartTime) {
        const elapsed = Date.now() - continuousModeStartTime;
        if (!continuousModeHighScore || elapsed < continuousModeHighScore) {
          setContinuousModeHighScore(elapsed);
          localStorage.setItem("continuousModeHighScore", elapsed.toString());
        }
        setContinuousModeStartTime(Date.now());
      }

      eventTracker.trackGameStateChange(
        { ...prev },
        { ...newState },
        "continuous_mode_level_change",
      );
    } else {
      eventTracker.trackGameStateChange(
        { ...prev },
        { ...newState },
        "continuous_mode_reset",
      );
    }

    const nextTarget = generateRandomTarget(newState.level);
    newState.currentTarget = nextTarget.name;
    newState.targetEmoji = nextTarget.emoji;
    newState.targetChangeTime = Date.now() + 10000;

    setTimeout(() => spawnImmediateTargets(), 0);
  } else {
    newState.winner = true;
    eventTracker.trackGameStateChange(
      { ...prev },
      { ...newState },
      "player_wins",
    );
  }
};
