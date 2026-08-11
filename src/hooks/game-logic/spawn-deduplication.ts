/**
 * Utility for handling emoji deduplication during spawning.
 */

export interface DeduplicationContext {
  /** Emojis spawned in the current batch */
  spawnedInBatch: Set<string>;
  /** Emojis currently active on screen */
  activeEmojis: Set<string>;
  /** Map of emoji to last appearance timestamp */
  lastEmojiAppearance: Map<string, number>;
  /** Current timestamp for spawn timing */
  now: number;
}

/**
 * Selects a unique emoji, avoiding duplicates in batch and on screen.
 * Uses retry logic with exponential attempts based on active emoji count.
 */
export const selectUniqueEmoji = (
  selectItem: () => { emoji: string; name: string },
  context: DeduplicationContext,
): { emoji: string; name: string } => {
  const { spawnedInBatch, activeEmojis, lastEmojiAppearance, now } = context;

  let item = selectItem();
  const isDuplicateInBatch = spawnedInBatch.has(item.emoji);
  const isDuplicateActive = activeEmojis.has(item.emoji);

  // If duplicate, retry with exponential attempts
  if (isDuplicateInBatch || (isDuplicateActive && Math.random() > 0.3)) {
    let attempts = 0;
    const maxAttempts = activeEmojis.size * 2;

    while (attempts < maxAttempts) {
      item = selectItem();
      attempts++;

      // Accept if unique in batch and not active (or accepted with 30% probability)
      if (
        !spawnedInBatch.has(item.emoji) &&
        (!activeEmojis.has(item.emoji) || Math.random() <= 0.3)
      ) {
        break;
      }
    }
  }

  // Track the selected emoji
  if (item.emoji) {
    spawnedInBatch.add(item.emoji);
    lastEmojiAppearance.set(item.emoji, now);
  }

  return item;
};
