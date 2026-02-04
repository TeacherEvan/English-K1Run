import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { FAIRY_TRANSFORM_DURATION } from "../../../lib/constants/game-config";
import type { FairyTransformObject } from "../../../types/game";

/**
 * Periodically removes completed fairy transforms.
 */
export const useFairyCleanup = (
  gameStarted: boolean,
  winner: boolean,
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>,
) => {
  useEffect(() => {
    if (!gameStarted || winner) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setFairyTransforms((prev) =>
        prev.filter(
          (fairy) => now - fairy.createdAt < FAIRY_TRANSFORM_DURATION,
        ),
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, winner, setFairyTransforms]);
};
