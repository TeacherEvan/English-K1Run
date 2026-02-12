import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import type { GameState, GameCategory } from "../../types/game";
import { handleProgressWin } from "./tap-handlers-object-win";

export interface TapStateUpdateDependencies {
  gameState: GameState;
  currentCategory: GameCategory;
  reducedMotion: boolean;
  generateRandomTarget: (levelOverride?: number) => { name: string; emoji: string };
  spawnImmediateTargets: () => void;
  continuousMode: boolean;
  continuousModeTargetCount: MutableRefObject<number>;
  continuousModeHighScore: number | null;
  continuousModeStartTime: number | null;
  setContinuousModeHighScore: Dispatch<SetStateAction<number | null>>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  refillTargetPool: (levelIndex?: number) => void;
  setGameState: Dispatch<SetStateAction<GameState>>;
  setScreenShake: Dispatch<SetStateAction<boolean>>;
}

/**
 * Updates game state based on correct or incorrect tap.
 */
export const updateStateOnTap = (
  isCorrect: boolean,
  dependencies: TapStateUpdateDependencies,
): void => {
  const {
    currentCategory,
    reducedMotion,
    generateRandomTarget,
    spawnImmediateTargets,
    continuousMode,
    continuousModeTargetCount,
    continuousModeHighScore,
    continuousModeStartTime,
    setContinuousModeHighScore,
    setContinuousModeStartTime,
    refillTargetPool,
    setGameState,
    setScreenShake,
  } = dependencies;

  setGameState((prev) => {
    const newState = { ...prev };

    if (isCorrect) {
      newState.streak += 1;

      const basePoints = 20;
      newState.progress = Math.min(prev.progress + basePoints, 100);

      if (newState.progress >= 100) {
        handleProgressWin({
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
        });
      }

      if (!currentCategory.requiresSequence && !newState.winner) {
        const nextTarget = generateRandomTarget();
        newState.currentTarget = nextTarget.name;
        newState.targetEmoji = nextTarget.emoji;
        newState.targetChangeTime = Date.now() + 10000;
        eventTracker.trackGameStateChange(
          { ...prev },
          { ...newState },
          "target_change_on_correct_tap",
        );
        setTimeout(() => spawnImmediateTargets(), 0);
      }

      if (currentCategory.requiresSequence) {
        const nextIndex = (currentCategory.sequenceIndex || 0) + 1;
        GAME_CATEGORIES[prev.level].sequenceIndex = nextIndex;

        if (nextIndex < currentCategory.items.length) {
          const nextTarget = generateRandomTarget();
          newState.currentTarget = nextTarget.name;
          newState.targetEmoji = nextTarget.emoji;
          eventTracker.trackGameStateChange(
            { ...prev },
            { ...newState },
            "sequence_advance",
          );
          setTimeout(() => spawnImmediateTargets(), 0);
        }
      }
    } else {
      newState.streak = 0;
      newState.progress = Math.max(prev.progress - 20, 0);
      eventTracker.trackGameStateChange(
        { ...prev },
        { ...newState },
        "incorrect_tap_penalty",
      );
      // Only trigger screen shake if reduced motion preference is disabled
      if (!reducedMotion) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
      }
    }

    return newState;
  });
};
