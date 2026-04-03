import { describe, expect, it, vi } from "vitest";

import { createSoundPlayback } from "../../sound-manager/playback";

describe("createSoundPlayback", () => {
  it("falls back to HTMLAudio when Web Audio buffer loading fails", async () => {
    const playWithHtmlAudio = vi.fn().mockResolvedValue(true);
    const startBufferAsync = vi.fn();
    const trackPlaybackStart = vi.fn();
    const trackPlaybackEnd = vi.fn();

    const playback = createSoundPlayback({
      isEnabled: () => true,
      getAudioContext: () => ({ state: "running" }) as AudioContext,
      getVolume: () => 0.6,
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      useAudioSprite: () => false,
      preferHTMLAudio: () => false,
      resolveCandidates: () => ["welcome_evan_intro"],
      getUrl: vi.fn().mockResolvedValue("/sounds/welcome_evan_intro.wav"),
      loadBufferForName: vi.fn().mockResolvedValue(null),
      startBufferAsync,
      playbackEngine: {
        playWithHtmlAudio,
      } as never,
      trackPlaybackStart,
      trackPlaybackEnd,
    });

    await playback.playSound("welcome_evan_intro");

    expect(playWithHtmlAudio).toHaveBeenCalledWith(
      "welcome_evan_intro",
      "/sounds/welcome_evan_intro.wav",
      0.9,
      undefined,
      undefined,
    );
    expect(startBufferAsync).not.toHaveBeenCalled();
    expect(trackPlaybackStart).toHaveBeenCalledWith("welcome_evan_intro");
    expect(trackPlaybackEnd).toHaveBeenCalledWith("welcome_evan_intro");
  });
});
