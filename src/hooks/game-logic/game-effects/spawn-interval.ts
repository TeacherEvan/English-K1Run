import { useEffect } from "react";
import type { GamePhase } from "../../../types/game";

/**
 * Spawns gameplay objects at a fixed interval while a session is active.
 */
export const useSpawnInterval = (
  gameStarted: boolean,
  winner: boolean,
  phase: GamePhase | undefined,
  spawnObject: () => void,
) => {
  useEffect(() => {
    const isPlayingPhase =
      (phase ?? (gameStarted && !winner ? "playing" : "idle")) === "playing";

    if (!gameStarted || winner || !isPlayingPhase) {
      return;
    }

    const interval = setInterval(spawnObject, 1500);
    return () => clearInterval(interval);
  }, [gameStarted, phase, winner, spawnObject]);
};
