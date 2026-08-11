import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  WORM_INITIAL_COUNT,
  WORM_PROGRESSIVE_SPAWN_INTERVAL,
  WORM_RECURRING_COUNT,
  WORM_RECURRING_INTERVAL,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import type { WormObject } from "../../types/game";
import { createWorms } from "./worm-logic";

export interface WormInitializationDependencies {
  progressiveSpawnTimeoutRefs: MutableRefObject<NodeJS.Timeout[]>;
  recurringSpawnIntervalRef: MutableRefObject<NodeJS.Timeout | undefined>;
  wormSpeedMultiplier: MutableRefObject<number>;
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
}

/**
 * Initializes worm spawning (progressive and recurring).
 */
export const initializeWormSpawning = (
  dependencies: WormInitializationDependencies,
): void => {
  const {
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
    wormSpeedMultiplier,
    setWorms,
  } = dependencies;

  // Clear existing timeouts and intervals
  progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
    clearTimeout(timeout),
  );
  progressiveSpawnTimeoutRefs.current = [];
  if (recurringSpawnIntervalRef.current) {
    clearInterval(recurringSpawnIntervalRef.current);
  }

  // Reset worms and speed
  setWorms([]);
  wormSpeedMultiplier.current = 1;

  // Progressive spawn: spawn worms one by one with delays
  for (let i = 0; i < WORM_INITIAL_COUNT; i++) {
    const timeout = setTimeout(() => {
      setWorms((prev) => [...prev, ...createWorms(1, i)]);
      eventTracker.trackEvent({
        type: "info",
        category: "worm",
        message: `Progressive spawn: worm ${i + 1}/${WORM_INITIAL_COUNT}`,
        data: { wormIndex: i },
      });
    }, i * WORM_PROGRESSIVE_SPAWN_INTERVAL);
    progressiveSpawnTimeoutRefs.current.push(timeout);
  }

  // Recurring spawn: periodically spawn more worms
  recurringSpawnIntervalRef.current = setInterval(() => {
    setWorms((prev) => {
      const aliveCount = prev.filter((w) => w.alive).length;
      const newWorms = createWorms(WORM_RECURRING_COUNT, prev.length);

      eventTracker.trackEvent({
        type: "info",
        category: "worm",
        message: `Recurring spawn: ${WORM_RECURRING_COUNT} worms (${aliveCount} already alive)`,
        data: {
          recurringSpawn: true,
          aliveCount,
          newCount: WORM_RECURRING_COUNT,
        },
      });

      return [...prev, ...newWorms];
    });
  }, WORM_RECURRING_INTERVAL);
};
