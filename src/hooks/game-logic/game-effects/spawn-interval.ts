import { useEffect } from "react";

/**
 * Spawns gameplay objects at a fixed interval while a session is active.
 */
export const useSpawnInterval = (
  gameStarted: boolean,
  winner: boolean,
  spawnObject: () => void,
) => {
  useEffect(() => {
    if (!gameStarted || winner) {
      return;
    }

    const interval = setInterval(spawnObject, 1500);
    return () => clearInterval(interval);
  }, [gameStarted, winner, spawnObject]);
};
