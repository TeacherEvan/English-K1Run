import type { Dispatch, SetStateAction } from "react";
import {
  DEFAULT_MODE_PROGRESS_INCREMENT,
  DEFAULT_MODE_PROGRESS_PENALTY,
  DEFAULT_MODE_TARGETS_TO_COMPLETE,
  PROGRESS_MAX,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import type { GameCategory, GameState } from "../../types/game";
import { handleProgressWin } from "./tap-handlers-object-win";

export interface TapStateUpdateDependencies {
  gameState: GameState;
  currentCategory: GameCategory;
  reducedMotion: boolean;
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  spawnImmediateTargets: () => void;
  continuousMode: boolean;
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
    gameState,
    currentCategory,
    reducedMotion,
    generateRandomTarget,
    spawnImmediateTargets,
    continuousMode,
    setGameState,
    setScreenShake,
  } = dependencies;

  const newState = { ...gameState };
  let shouldSpawnTargets = false;

  if (isCorrect) {
    newState.streak += 1;

    if (continuousMode) {
      newState.progress = 0;
      newState.winner = false;
      newState.continuousRunScore = (gameState.continuousRunScore ?? 0) + 1;
      newState.continuousCategoryClearCount = 0;
    } else {
      newState.targetsClearedThisLevel =
        (gameState.targetsClearedThisLevel ?? 0) + 1;
      newState.progress = Math.min(
        gameState.progress + DEFAULT_MODE_PROGRESS_INCREMENT,
        PROGRESS_MAX,
      );

      const updatedClears = newState.targetsClearedThisLevel ?? 0;

      eventTracker.trackTargetClearProgress({
        level: gameState.level,
        clearsThisLevel: updatedClears,
        threshold: DEFAULT_MODE_TARGETS_TO_COMPLETE,
        targetName: gameState.currentTarget,
        targetEmoji: gameState.targetEmoji,
        phase:
          updatedClears >= DEFAULT_MODE_TARGETS_TO_COMPLETE
            ? "threshold-reached"
            : "progressing",
      });
    }

    const reachedDefaultGoal =
      !continuousMode &&
      (newState.targetsClearedThisLevel ?? 0) >=
        DEFAULT_MODE_TARGETS_TO_COMPLETE;

    if (reachedDefaultGoal) {
      newState.progress = PROGRESS_MAX;
    }

    if (
      !continuousMode &&
      (reachedDefaultGoal || newState.progress >= PROGRESS_MAX)
    ) {
      handleProgressWin({
        prev: gameState,
        newState,
      });
    }

    // Once a level transition starts, skip the normal target-advance path.
    if (!continuousMode && newState.phase !== "playing") {
      setGameState(newState);
      return;
    }

    if (!currentCategory.requiresSequence && !newState.winner) {
      const nextTarget = generateRandomTarget();
      newState.currentTarget = nextTarget.name;
      newState.targetEmoji = nextTarget.emoji;
      newState.targetChangeTime = Date.now() + 10000;
      eventTracker.trackGameStateChange(
        { ...gameState },
        { ...newState },
        "target_change_on_correct_tap",
      );
      shouldSpawnTargets = true;
    }

    if (currentCategory.requiresSequence) {
      const nextIndex = (gameState.sequenceIndex ?? 0) + 1;
      newState.sequenceIndex = nextIndex;

      if (nextIndex < currentCategory.items.length) {
        const nextTarget = generateRandomTarget();
        newState.currentTarget = nextTarget.name;
        newState.targetEmoji = nextTarget.emoji;
        eventTracker.trackGameStateChange(
          { ...gameState },
          { ...newState },
          "sequence_advance",
        );
        shouldSpawnTargets = true;
      }
    }
  } else {
    newState.streak = 0;
    newState.progress = Math.max(
      gameState.progress - DEFAULT_MODE_PROGRESS_PENALTY,
      0,
    );
    eventTracker.trackGameStateChange(
      { ...gameState },
      { ...newState },
      "incorrect_tap_penalty",
    );
    // Only trigger screen shake if reduced motion preference is disabled
    if (!reducedMotion) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }
  }

  setGameState(newState);

  if (shouldSpawnTargets) {
    spawnImmediateTargets();
  }
};
