import { beforeEach, describe, expect, it, vi } from "vitest";

const { byName } = vi.hoisted(() => ({ byName: vi.fn() }));

vi.mock("../../../lib/sound-manager", () => ({
  playSoundEffect: { byName },
}));

import { playTapAudioFeedback } from "../tap-audio-effects";

describe("playTapAudioFeedback", () => {
  beforeEach(() => {
    byName.mockClear();
  });

  it("plays the success cue at unity pitch on the first correct tap", () => {
    playTapAudioFeedback(true, 0);

    expect(byName).toHaveBeenCalledWith("success", 1);
  });

  it("rises in pitch as the streak builds, then caps", () => {
    playTapAudioFeedback(true, 1);
    playTapAudioFeedback(true, 5);
    playTapAudioFeedback(true, 10);
    playTapAudioFeedback(true, 50);

    const rates = byName.mock.calls.map((call) => call[1] as number);

    expect(rates).toHaveLength(4);
    expect(rates[0]).toBeCloseTo(1.03, 5);
    expect(rates[1]).toBeCloseTo(1.15, 5);
    expect(rates[2]).toBeCloseTo(1.3, 5);
    // Capped: a 50-tap streak must sound identical to a 10-tap streak, never shrill.
    expect(rates[3]).toBeCloseTo(1.3, 5);
  });

  it("drops in pitch on a wrong tap instead of rising with the streak", () => {
    playTapAudioFeedback(false, 7);

    expect(byName).toHaveBeenCalledWith("wrong", 0.8);
  });

  it("never yields a playback rate below the wrong-tap floor or above the cap", () => {
    for (const streak of [-5, 0, 1, 10, 999]) {
      playTapAudioFeedback(true, streak);
    }

    for (const [, rate] of byName.mock.calls as [string, number][]) {
      expect(rate).toBeGreaterThanOrEqual(1);
      expect(rate).toBeLessThanOrEqual(1.3);
    }
  });
});
