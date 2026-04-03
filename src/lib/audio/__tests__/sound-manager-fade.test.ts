import { describe, expect, it, vi } from "vitest";

import { eventTracker } from "../../event-tracker";
import { SoundFadePlayback } from "../../sound-manager-fade";

vi.mock("../../event-tracker", () => ({
  eventTracker: { trackAudioPlayback: vi.fn() },
}));

describe("SoundFadePlayback", () => {
  it("records Web Audio fade playback in the event tracker", async () => {
    const trackPlaybackStart = vi.fn();
    const trackPlaybackEnd = vi.fn();
    const startBufferWithFadeInAsync = vi.fn().mockResolvedValue(undefined);

    const playback = new SoundFadePlayback({
      isEnabled: () => true,
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      getAudioContext: () => ({ state: "running" }) as AudioContext,
      loadBufferForName: vi.fn().mockResolvedValue({ duration: 1.2 }),
      playSound: vi.fn().mockResolvedValue(undefined),
      startBufferWithFadeIn: vi.fn(),
      startBufferWithFadeInAsync,
      trackPlaybackStart,
      trackPlaybackEnd,
    });

    await playback.playSoundWithFadeAsync("welcome_evan_intro");

    expect(startBufferWithFadeInAsync).toHaveBeenCalled();
    expect(trackPlaybackStart).toHaveBeenCalledWith("welcome_evan_intro");
    expect(trackPlaybackEnd).toHaveBeenCalledWith("welcome_evan_intro");
    expect(eventTracker.trackAudioPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        audioKey: "welcome_evan_intro",
        targetName: "welcome_evan_intro",
        method: "web-audio",
        success: true,
      }),
    );
  });
});