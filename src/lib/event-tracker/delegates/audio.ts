import type { AudioPlaybackEvent } from "../../event-metrics";
import { audioEventTracker } from "../../event-metrics/audio-event-tracker";

export const createAudioDelegates = (
  trackEvent: (event: {
    type: "info" | "warning";
    category: string;
    message: string;
    data?: Record<string, unknown>;
  }) => void,
) => {
  const trackAudioPlayback = (
    event: Omit<AudioPlaybackEvent, "id" | "timestamp">,
  ) => {
    const audioEvent = audioEventTracker.trackAudioPlayback(event);
    trackEvent({
      type: event.success ? "info" : "warning",
      category: "audio_playback",
      message: `Audio ${event.success ? "played" : "failed"}: ${event.audioKey}`,
      data: audioEvent as unknown as Record<string, unknown>,
    });
  };

  return {
    trackAudioPlayback,
    getAudioPlaybackHistory: (limit = 20) =>
      audioEventTracker.getAudioPlaybackHistory(limit),
    getAudioPlaybackStats: () => audioEventTracker.getAudioPlaybackStats(),
    clearAudioTracking: () => audioEventTracker.clearAudioTracking(),
  };
};
