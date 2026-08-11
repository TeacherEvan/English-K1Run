import type { EmojiLifecycleEvent } from "../../event-metrics";
import { emojiTracker } from "../../event-metrics/emoji-tracker";

export const createEmojiDelegates = (
  trackEvent: (event: {
    type: "lifecycle";
    category: string;
    message: string;
    data?: Record<string, unknown>;
  }) => void,
) => {
  const trackEmojiLifecycle = (
    event: Omit<EmojiLifecycleEvent, "timestamp" | "duration">,
  ) => {
    const lifecycleEvent = emojiTracker.trackEmojiLifecycle(event);
    if (!lifecycleEvent) return;
    trackEvent({
      type: "lifecycle",
      category: "emoji_lifecycle",
      message: `Emoji ${event.phase}: ${event.emoji} ${event.name}`,
      data: lifecycleEvent as unknown as Record<string, unknown>,
    });
  };

  return {
    enableLifecycleTracking: (enable: boolean = true) =>
      emojiTracker.enableLifecycleTracking(enable),
    trackEmojiLifecycle,
    getEmojiLifecycle: (objectId: string) =>
      emojiTracker.getEmojiLifecycle(objectId),
    getAllEmojiLifecycles: () => emojiTracker.getAllEmojiLifecycles(),
    getLifecycleStats: () => emojiTracker.getLifecycleStats(),
    clearLifecycleTracking: () => emojiTracker.clearLifecycleTracking(),
    initializeEmojiTracking: (
      levelItems: Array<{ emoji: string; name: string }>,
    ) => emojiTracker.initializeEmojiTracking(levelItems),
    trackEmojiAppearance: (emoji: string, audioKey?: string) =>
      emojiTracker.trackEmojiAppearance(emoji, audioKey),
    getEmojiRotationStats: () => emojiTracker.getEmojiRotationStats(),
    getOverdueEmojis: () => emojiTracker.getOverdueEmojis(),
    checkRotationHealth: () => emojiTracker.checkRotationHealth(),
    clearEmojiRotationTracking: () => emojiTracker.clearEmojiRotationTracking(),
  };
};
