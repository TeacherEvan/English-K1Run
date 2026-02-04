import { useRef } from "react";

/**
 * Shared refs used across game logic modules.
 */
export const useGameLogicResources = () => {
  const lastEmojiAppearance = useRef<Map<string, number>>(new Map());
  const lastTargetSpawnTime = useRef(0);
  const targetPool = useRef<Array<{ emoji: string; name: string }>>([]);
  const staleEmojisCache = useRef<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>({
    emojis: [],
    timestamp: 0,
  });

  const wormSpeedMultiplier = useRef(1);
  const progressiveSpawnTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const recurringSpawnIntervalRef = useRef<NodeJS.Timeout | undefined>(
    undefined,
  );

  return {
    lastEmojiAppearance,
    lastTargetSpawnTime,
    targetPool,
    staleEmojisCache,
    wormSpeedMultiplier,
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
  };
};
