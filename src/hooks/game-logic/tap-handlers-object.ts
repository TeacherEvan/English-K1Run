import { eventTracker } from "../../lib/event-tracker";
import type { PlayerSide } from "../../types/game";
import { playTapAudioFeedback } from "./tap-audio-effects";
import { updateStateOnTap } from "./tap-state-updater";
import { validateObjectTap } from "./tap-validation";
import type { HandleObjectTapDependencies } from "./tap-handlers-types";

/**
 * Builds the tap handler for falling objects.
 * Orchestrates validation, audio feedback, and state updates.
 */
export const createHandleObjectTap = (
  dependencies: HandleObjectTapDependencies,
) => {
  const {
    gameObjectsRef,
    gameState,
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
    setGameObjects,
  } = dependencies;

  return (objectId: string, playerSide: PlayerSide) => {
    const tapStartTime = performance.now();

    try {
      // Validate the tap
      const validation = validateObjectTap(
        objectId,
        playerSide,
        gameObjectsRef.current,
        gameState.currentTarget,
        gameState.targetEmoji,
        currentCategory,
        tapStartTime,
      );

      if (!validation) return;

      const { tappedObject, isCorrect, tapLatency } = validation;

      // Play audio feedback
      playTapAudioFeedback(isCorrect);

      // Track tap event
      eventTracker.trackObjectTap(
        objectId,
        isCorrect,
        tappedObject.lane,
        tapLatency,
      );

      eventTracker.trackEmojiLifecycle({
        objectId: tappedObject.id,
        emoji: tappedObject.emoji,
        name: tappedObject.type,
        phase: "tapped",
        position: { x: tappedObject.x, y: tappedObject.y },
        playerSide: tappedObject.lane,
        data: { isCorrect, tapLatency },
      });

      // Remove tapped object
      setGameObjects((prev) => {
        const removedObj = prev.find((obj) => obj.id === objectId);
        if (removedObj) {
          eventTracker.trackEmojiLifecycle({
            objectId: removedObj.id,
            emoji: removedObj.emoji,
            name: removedObj.type,
            phase: "removed",
            position: { x: removedObj.x, y: removedObj.y },
            playerSide: tappedObject.lane,
            data: { reason: "tapped", isCorrect },
          });
        }
        return prev.filter((obj) => obj.id !== objectId);
      });

      // Update game state
      updateStateOnTap(isCorrect, {
        gameState,
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
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "handleObjectTap");
    }
  };
};
