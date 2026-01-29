/**
 * Tap Handlers
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
  PlayerSide,
  WormObject,
} from "../../types/game";

export interface HandleObjectTapDependencies {
  gameObjectsRef: MutableRefObject<GameObject[]>;
  gameState: GameState;
  currentCategory: (typeof GAME_CATEGORIES)[number];
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
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
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
}

export const createHandleObjectTap = (
  dependencies: HandleObjectTapDependencies,
) => {
  const {
    gameObjectsRef,
    gameState,
    currentCategory,
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
                  if (
                    !continuousModeHighScore ||
                    elapsed < continuousModeHighScore
                  ) {
                    setContinuousModeHighScore(elapsed);
                    localStorage.setItem(
                      "continuousModeHighScore",
                      elapsed.toString(),
                    );
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
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
        }

        return newState;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "handleObjectTap");
    }
  };
};

export interface HandleWormTapDependencies {
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  wormSpeedMultiplier: MutableRefObject<number>;
}

export const createHandleWormTap = (
  dependencies: HandleWormTapDependencies,
) => {
  const { setWorms, setFairyTransforms, wormSpeedMultiplier } = dependencies;

  return (wormId: string, playerSide: PlayerSide) => {
    try {
      setWorms((prev) => {
        const worm = prev.find((w) => w.id === wormId);
        if (!worm || !worm.alive) return prev;

        setFairyTransforms((prevFairies) => [
          ...prevFairies,
          {
            id: `fairy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            x: worm.x,
            y: worm.y,
            createdAt: Date.now(),
            lane: worm.lane,
          },
        ]);

        const updatedWorms = prev.map((w) =>
          w.id === wormId ? { ...w, alive: false } : w,
        );

        const aliveCount = updatedWorms.filter((w) => w.alive).length;
        if (aliveCount > 0) {
          wormSpeedMultiplier.current *= 1.2;
        }

        eventTracker.trackEvent({
          type: "info",
          category: "worm",
          message: `Worm killed, ${aliveCount} remaining`,
          data: { wormId, playerSide, aliveCount },
        });

        return updatedWorms;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "handleWormTap");
    }
  };
};
