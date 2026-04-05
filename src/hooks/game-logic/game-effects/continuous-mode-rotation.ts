import { useEffect } from "react";
import { recordChallengeModeHighScore } from "../../../lib/challenge-mode-high-scores";
import { getContinuousModeLevelDurationMs } from "../../../lib/constants/game-config";
import type { SupportedLanguage } from "../../../lib/constants/language-config";
import type { GameState } from "../../../types/game";
import type { GameSessionDependencies } from "../game-session-types";
import { activateQueuedLevel } from "./activate-queued-level";

type ContinuousModeRotationDependencies = Pick<
  GameSessionDependencies,
  | "generateRandomTarget"
  | "spawnImmediateTargets"
  | "lastEmojiAppearance"
  | "targetPool"
  | "progressiveSpawnTimeoutRefs"
  | "recurringSpawnIntervalRef"
  | "wormSpeedMultiplier"
  | "setGameObjects"
  | "setWorms"
  | "setFairyTransforms"
  | "setScreenShake"
  | "setGameState"
> & {
  gameState: GameState;
  continuousMode: boolean;
  gameplayLanguage: SupportedLanguage;
  continuousModeHighScore: number | null;
  setContinuousModeHighScore: (score: number | null) => void;
};

export const useContinuousModeRotation = (
  dependencies: ContinuousModeRotationDependencies,
) => {
  const {
    gameState,
    continuousMode,
    gameplayLanguage,
    continuousModeHighScore,
    setContinuousModeHighScore,
    setGameState,
  } = dependencies;

  useEffect(() => {
    if (
      !continuousMode ||
      gameState.phase !== "playing" ||
      !gameState.gameStarted ||
      gameState.continuousLevelEndsAt === null ||
      gameState.continuousLevelEndsAt === undefined
    ) {
      return;
    }

    const delay = Math.max(gameState.continuousLevelEndsAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      const levelDurationMs = getContinuousModeLevelDurationMs();
      const nextQueueIndex = (gameState.levelQueueIndex ?? 0) + 1;
      const nextLevel = gameState.levelQueue?.[nextQueueIndex];

      if (nextLevel !== undefined) {
        activateQueuedLevel({
          ...dependencies,
          levelIndex: nextLevel,
          stateUpdates: {
            levelQueueIndex: nextQueueIndex,
            continuousLevelEndsAt: Date.now() + levelDurationMs,
            continuousCategoryClearCount: 0,
          },
        });
        return;
      }

      const finalScore = gameState.continuousRunScore ?? 0;
      recordChallengeModeHighScore({
        score: finalScore,
        language: gameplayLanguage,
        achievedAt: new Date().toISOString(),
      });

      if (finalScore > (continuousModeHighScore ?? 0)) {
        setContinuousModeHighScore(finalScore);
        localStorage.setItem("continuousModeBestTargetTotal", `${finalScore}`);
      }

      setGameState((prev) => ({
        ...prev,
        phase: "runComplete",
        winner: true,
        pendingLevel: null,
        countdownEndsAt: null,
        levelCompleteEndsAt: null,
        continuousLevelEndsAt: null,
      }));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    continuousMode,
    continuousModeHighScore,
    dependencies,
    gameplayLanguage,
    gameState.continuousLevelEndsAt,
    gameState.continuousRunScore,
    gameState.gameStarted,
    gameState.levelQueue,
    gameState.levelQueueIndex,
    gameState.phase,
    setContinuousModeHighScore,
    setGameState,
  ]);
};
