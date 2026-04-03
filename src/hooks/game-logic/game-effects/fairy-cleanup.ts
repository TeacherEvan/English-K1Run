import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { FAIRY_TRANSFORM_DURATION } from "../../../lib/constants/game-config";
import type { FairyTransformObject, GamePhase } from "../../../types/game";

/**
 * Periodically removes completed fairy transforms.
 */
export const useFairyCleanup = (
  gameStarted: boolean,
  winner: boolean,
  phase: GamePhase | undefined,
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>,
) => {
  useEffect(() => {
    const isPlayingPhase =
      (phase ?? (gameStarted && !winner ? "playing" : "idle")) === "playing";

    if (!gameStarted || winner || !isPlayingPhase) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setFairyTransforms((prev) =>
        prev.filter(
          (fairy) => now - fairy.createdAt < FAIRY_TRANSFORM_DURATION,
        ),
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, phase, setFairyTransforms, winner]);
};
