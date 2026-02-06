/**
 * Playback telemetry and debug reporting for audio events.
 */

import { audioBufferLoader } from "../audio/audio-buffer-loader";
import { audioPreloader } from "../audio/audio-preloader";
import { getRegisteredKeys } from "../audio/audio-registry";
import { AudioPriority } from "../audio/types";

interface PlaybackTelemetrySnapshot {
  activePlaybackCount: number;
  peakPlaybackCount: number;
  totalAudioEvents: number;
}

export interface PlaybackTelemetry {
  trackStart: (soundName: string) => void;
  trackEnd: (soundName?: string) => void;
  reset: () => void;
  getDebugInfo: (audioContext: AudioContext | null) => {
    isEnabled: boolean;
    hasContext: boolean;
    contextState?: AudioContextState;
    registeredAliases: number;
    cachedBuffers: number;
    pendingBuffers: number;
    loadedPriorities: string[];
    sampleAliases: string[];
  };
  getSnapshot: () => PlaybackTelemetrySnapshot;
}

const updateWindowDebug = (
  snapshot: PlaybackTelemetrySnapshot,
  lastSound?: string,
) => {
  if (typeof window === "undefined") return;
  window.__audioDebug = {
    active: snapshot.activePlaybackCount,
    current: snapshot.activePlaybackCount,
    peak: snapshot.peakPlaybackCount,
    total: snapshot.totalAudioEvents,
    lastSound: lastSound ?? window.__audioDebug?.lastSound,
  };
};

export const createPlaybackTelemetry = (
  isEnabled: () => boolean,
): PlaybackTelemetry => {
  let activePlaybackCount = 0;
  let peakPlaybackCount = 0;
  let totalAudioEvents = 0;

  const getSnapshot = (): PlaybackTelemetrySnapshot => ({
    activePlaybackCount,
    peakPlaybackCount,
    totalAudioEvents,
  });

  const trackStart = (soundName: string) => {
    activePlaybackCount += 1;
    totalAudioEvents += 1;
    peakPlaybackCount = Math.max(peakPlaybackCount, activePlaybackCount);
    updateWindowDebug(getSnapshot(), soundName);
  };

  const trackEnd = (soundName?: string) => {
    activePlaybackCount = Math.max(0, activePlaybackCount - 1);
    updateWindowDebug(getSnapshot(), soundName);
  };

  const reset = () => {
    activePlaybackCount = 0;
    updateWindowDebug(getSnapshot());
  };

  const getDebugInfo = (audioContext: AudioContext | null) => {
    const loadedPriorities = [
      AudioPriority.CRITICAL,
      AudioPriority.COMMON,
      AudioPriority.RARE,
    ].filter((priority) => audioPreloader.isPriorityLoaded(priority));

    return {
      isEnabled: isEnabled(),
      hasContext: !!audioContext,
      contextState: audioContext?.state,
      registeredAliases: getRegisteredKeys().length,
      cachedBuffers: audioBufferLoader.getLoadedCount(),
      pendingBuffers: audioBufferLoader.getPendingCount(),
      loadedPriorities: loadedPriorities.map((p) => AudioPriority[p]),
      sampleAliases: getRegisteredKeys().slice(0, 5),
    };
  };

  return { trackStart, trackEnd, reset, getDebugInfo, getSnapshot };
};
