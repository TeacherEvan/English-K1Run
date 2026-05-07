import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fadeOutKey, playSoundWithFadeAsync } = vi.hoisted(() => ({
  fadeOutKey: vi.fn(),
  playSoundWithFadeAsync: vi.fn(),
}));

vi.mock("../../sound-manager", () => ({
  soundManager: {
    fadeOutKey,
    playSoundWithFadeAsync,
  },
}));

import { CentralAudioManager } from "../central-audio-manager";

describe("CentralAudioManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fadeOutKey.mockReset();
    playSoundWithFadeAsync.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns false when managed playback exceeds the expected duration", async () => {
    playSoundWithFadeAsync.mockImplementation(
      () => new Promise<void>(() => undefined),
    );
    const manager = new CentralAudioManager();

    const resultPromise = manager.playManaged({
      key: "welcome_evan_intro",
      channel: "welcome",
      priority: 100,
      expectedDurationMs: 200,
    });

    await vi.advanceTimersByTimeAsync(950);

    await expect(resultPromise).resolves.toBe(false);
    expect(fadeOutKey).toHaveBeenCalledWith("welcome_evan_intro", 80);
    expect(manager.getActiveChannels()).toEqual([]);
  });

  it("returns true and clears the channel after successful playback", async () => {
    playSoundWithFadeAsync.mockResolvedValue(true);
    const manager = new CentralAudioManager();

    await expect(
      manager.playManaged({
        key: "welcome_evan_intro",
        channel: "welcome",
        priority: 100,
        expectedDurationMs: 200,
      }),
    ).resolves.toBe(true);

    expect(fadeOutKey).not.toHaveBeenCalled();
    expect(manager.getActiveChannels()).toEqual([]);
  });

  it("returns false when the sound manager reports playback failure", async () => {
    playSoundWithFadeAsync.mockResolvedValue(false);
    const manager = new CentralAudioManager();

    await expect(
      manager.playManaged({
        key: "welcome_evan_intro",
        channel: "welcome",
        priority: 100,
        expectedDurationMs: 200,
      }),
    ).resolves.toBe(false);

    expect(fadeOutKey).toHaveBeenCalledWith("welcome_evan_intro", 80);
    expect(manager.getActiveChannels()).toEqual([]);
  });
});
