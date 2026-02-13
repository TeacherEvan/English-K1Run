const MISSION_COMPLETE_STICKER_KEY = "k1MissionCompleteStickerPending";

export const markMissionCompleteStickerPending = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MISSION_COMPLETE_STICKER_KEY, "true");
  } catch {
    // Ignore storage failures (privacy mode, blocked access, etc.)
  }
};

export const consumeMissionCompleteStickerPending = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const isPending =
      window.sessionStorage.getItem(MISSION_COMPLETE_STICKER_KEY) === "true";

    if (isPending) {
      window.sessionStorage.removeItem(MISSION_COMPLETE_STICKER_KEY);
    }

    return isPending;
  } catch {
    return false;
  }
};
