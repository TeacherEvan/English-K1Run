/**
 * Tap Handlers
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  COMBO_LEVELS,
  getStreakMultiplier,
} from "../../lib/constants/combo-levels";
import { checkMilestone } from "../../lib/constants/engagement-system";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  CORRECT_MESSAGES,
  getStreakMessage,
} from "../../lib/constants/messages";
import { eventTracker } from "../../lib/event-tracker";
import type {
  Achievement,
  ComboCelebration,
  FairyTransformObject,
  GameObject,
  GameState,
  MilestoneEvent,
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
  setLastCompletionTime: Dispatch<SetStateAction<number | null>>;
  setShowHighScoreWindow: Dispatch<SetStateAction<boolean>>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  refillTargetPool: (levelIndex?: number) => void;
  setGameState: Dispatch<SetStateAction<GameState>>;
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setComboCelebration: Dispatch<SetStateAction<ComboCelebration | null>>;
  setScreenShake: Dispatch<SetStateAction<boolean>>;
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  setCurrentMilestone: Dispatch<SetStateAction<MilestoneEvent | null>>;
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
    setLastCompletionTime,
    setShowHighScoreWindow,
    setContinuousModeStartTime,
    refillTargetPool,
    setGameState,
    setAchievements,
    setComboCelebration,
    setScreenShake,
    setGameObjects,
    setCurrentMilestone,
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

      setGameState((prev) => {
        const newState = { ...prev };

        if (isCorrect) {
          const nextStreak = prev.streak + 1;
          newState.streak = nextStreak;

          const currentMultiplier = getStreakMultiplier(nextStreak);
          newState.multiplier = currentMultiplier;

          const streakMsg = getStreakMessage(nextStreak);
          const randomMsg =
            streakMsg ||
            CORRECT_MESSAGES[
              Math.floor(Math.random() * CORRECT_MESSAGES.length)
            ];
          setAchievements((prevAchievements) => [
            ...prevAchievements,
            {
              id: Date.now(),
              type: "correct",
              message: randomMsg.message,
              emoji: randomMsg.emoji,
              x: tappedObject.x,
              y: tappedObject.y,
              playerSide: tappedObject.lane,
            },
          ]);

          const comboLevel = COMBO_LEVELS.find(
            (level) => level.streak === nextStreak,
          );
          if (comboLevel) {
            const comboData: ComboCelebration = {
              id: Date.now(),
              streak: nextStreak,
              title: comboLevel.title,
              description: comboLevel.description,
              emoji: comboLevel.emoji,
              specialEffect: comboLevel.specialEffect,
            };
            setComboCelebration(comboData);
            eventTracker.trackEvent({
              type: "info",
              category: "combo",
              message: `Combo streak reached ${comboData.streak} (${currentMultiplier}x multiplier)`,
              data: { ...comboData, multiplier: currentMultiplier },
            });
          }

          const basePoints = 20;
          const earnedPoints = Math.round(basePoints * currentMultiplier);
          const previousProgress = prev.progress;
          newState.progress = Math.min(prev.progress + earnedPoints, 100);

          const milestone = checkMilestone(previousProgress, newState.progress);
          if (milestone && (prev.lastMilestone || 0) < milestone.progress) {
            newState.lastMilestone = milestone.progress;

            setCurrentMilestone({
              progress: milestone.progress,
              title: milestone.title,
              message: milestone.message,
              emoji: milestone.emoji,
              triggeredAt: Date.now(),
            });

            eventTracker.trackEvent({
              type: "info",
              category: "milestone",
              message: `Milestone reached: ${milestone.progress}%`,
              data: { ...milestone },
            });
          }

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
                  setLastCompletionTime(elapsed);
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
                  setShowHighScoreWindow(true);
                  setContinuousModeStartTime(Date.now());
                }

                eventTracker.trackGameStateChange(
                  { ...prev },
                  { ...newState },
                  "continuous_mode_level_change",
                );

                if (import.meta.env.DEV) {
                  console.log(
                    `[ContinuousMode] Advanced to level ${nextLevel}: ${GAME_CATEGORIES[nextLevel].name}`,
                  );
                }
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
    } catch (error) {
      eventTracker.trackError(error as Error, "handleObjectTap");
    }
  };
};

export interface HandleWormTapDependencies {
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  wormSpeedMultiplier: MutableRefObject<number>;
}

export const createHandleWormTap = (
  dependencies: HandleWormTapDependencies,
) => {
  const { setWorms, setAchievements, setFairyTransforms, wormSpeedMultiplier } =
    dependencies;

  return (wormId: string, playerSide: PlayerSide) => {
    try {
      setWorms((prev) => {
        const worm = prev.find((w) => w.id === wormId);
        if (!worm || !worm.alive) return prev;

        setAchievements((prevAchievements) => [
          ...prevAchievements,
          {
            id: Date.now(),
            type: "worm",
            message: "",
            emoji: undefined,
            x: worm.x,
            y: worm.y,
            playerSide: worm.lane,
          },
        ]);

        if (import.meta.env.DEV) {
          console.log(
            `[FairySpawn] Creating fairy at worm position: x=${worm.x}%, y=${worm.y}px, lane=${worm.lane}`,
          );
        }
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
