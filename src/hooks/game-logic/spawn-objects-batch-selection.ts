import { ROTATION_THRESHOLD } from "../../lib/constants/game-config";

interface StaleEmojiCache {
  emojis: Array<{ emoji: string; name: string }>;
  timestamp: number;
}

interface StaleEmojiDeps {
  now: number;
  levelItems: Array<{ emoji: string; name: string }>;
  lastEmojiAppearance: Map<string, number>;
  staleEmojisCache: StaleEmojiCache;
}

/**
 * Returns stale emojis and updates cache when needed.
 */
export const getStaleEmojis = ({
  now,
  levelItems,
  lastEmojiAppearance,
  staleEmojisCache,
}: StaleEmojiDeps) => {
  if (now - staleEmojisCache.timestamp > 5000) {
    const staleEmojis = levelItems.filter((item) => {
      const lastSeen = lastEmojiAppearance.get(item.emoji);
      return !lastSeen || now - lastSeen > ROTATION_THRESHOLD;
    });
    return { emojis: staleEmojis, timestamp: now };
  }

  return staleEmojisCache;
};

/**
 * Creates an item selector that prioritizes stale emojis.
 */
export const createItemSelector = (
  levelItems: Array<{ emoji: string; name: string }>,
  staleEmojis: Array<{ emoji: string; name: string }>,
) => {
  return () => {
    if (staleEmojis.length > 0 && Math.random() < 0.7) {
      return staleEmojis[Math.floor(Math.random() * staleEmojis.length)];
    }
    return levelItems[Math.floor(Math.random() * levelItems.length)];
  };
};
