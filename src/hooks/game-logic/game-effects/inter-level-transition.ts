import { useEffect } from "react";
import {
  LEVEL_COMPLETE_POPUP_MS,
  LEVEL_START_COUNTDOWN_MS,
} from "../../../lib/constants/game-config";
import type { GameState } from "../../../types/game";
import type { GameSessionDependencies } from "../game-session-types";
import { activateQueuedLevel } from "./activate-queued-level";

type InterLevelTransitionDependencies = Pick<
  GameSessionDependencies,
  | "continuousMode"
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
> & { gameState: GameState };

export const useInterLevelTransition = (
  dependencies: InterLevelTransitionDependencies,
) => {
  const { gameState, setGameState } = dependencies;

  useEffect(() => {
    if (
      gameState.phase !== "levelComplete" ||
      gameState.levelCompleteEndsAt === null ||
      gameState.levelCompleteEndsAt === undefined
    ) {
      return;
    }

    const delay = Math.max(gameState.levelCompleteEndsAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      setGameState((prev) => {
        if (prev.phase !== "levelComplete") return prev;
        return {
          ...prev,
          phase: "interLevelCountdown",
          countdownEndsAt: Date.now() + LEVEL_START_COUNTDOWN_MS,
          levelCompleteEndsAt: null,
        };
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [gameState.levelCompleteEndsAt, gameState.phase, setGameState]);

  useEffect(() => {
    if (
      gameState.phase !== "interLevelCountdown" ||
      gameState.pendingLevel === null ||
      gameState.pendingLevel === undefined ||
      gameState.countdownEndsAt === null ||
      gameState.countdownEndsAt === undefined
    ) {
      return;
    }

    const delay = Math.max(gameState.countdownEndsAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      activateQueuedLevel(dependencies);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    dependencies,
    gameState.countdownEndsAt,
    gameState.pendingLevel,
    gameState.phase,
  ]);
};

export const INTER_LEVEL_TIMINGS = {
  popupMs: LEVEL_COMPLETE_POPUP_MS,
  countdownMs: LEVEL_START_COUNTDOWN_MS,
};
