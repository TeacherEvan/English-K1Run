import { useEffect } from "react";
import { calculateSpawnInterval } from "../../../lib/constants/engagement-difficulty";
import { useSyncedRef } from "../../use-synced-ref";

/**
 * Spawns gameplay objects while a session is active, following the difficulty
 * curve so the pace accelerates as the level progresses.
 *
 * A self-rescheduling timeout is used instead of a fixed `setInterval` so the
 * delay can change mid-session. Progress is read through a ref rather than a
 * dependency: making it a dependency would tear down and restart the timer on
 * every correct tap, silently delaying spawns every time a child scored.
 */
export const useSpawnInterval = (
  gameStarted: boolean,
  winner: boolean,
  spawnObject: () => void,
  progress: number,
) => {
  const progressRef = useSyncedRef(progress);

  useEffect(() => {
    if (!gameStarted || winner) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        spawnObject();
        scheduleNext();
      }, calculateSpawnInterval(progressRef.current));
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [gameStarted, winner, spawnObject, progressRef]);
};
