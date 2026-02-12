import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import { playSoundEffect, soundManager } from "../../lib/sound-manager";
import type { PlayerSide } from "../../types/game";
import { handleProgressWin } from "./tap-handlers-object-win";
import type { HandleObjectTapDependencies } from "./tap-handlers-types";

/**
 * Builds the tap handler for falling objects.
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
      const tappedObject = gameObjectsRef.current.find(
        (obj) => obj.id === objectId,
      );
      if (!tappedObject) {
        eventTracker.trackWarning("Tapped object not found", {
          objectId,
          playerSide,
        });
        return;
      }

      const isCorrect = currentCategory.requiresSequence
        ? tappedObject.type === gameState.currentTarget
        : tappedObject.emoji === gameState.targetEmoji;

      if (isCorrect) {
        void soundManager.playSound("success");
      } else {
        playSoundEffect.targetMiss();
      }

      const tapLatency = performance.now() - tapStartTime;
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
          // Only trigger screen shake if reduced motion is not enabled
          if (!reducedMotion) {
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 500);
          }
        }

        return newState;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "handleObjectTap");
    }
  };
};
