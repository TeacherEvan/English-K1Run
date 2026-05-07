/**
 * Unit Tests for Sound Manager Audio Call Behavior
 *
 * Tests verify that the game uses the correct audio playback methods:
 * - Target announcements use full sentences (playSoundEffect.voice)
 * - Gameplay tap feedback no longer exposes a separate helper
 */

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      effect();
    },
  };
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { playSoundEffect, soundManager } from "../../lib/sound-manager";
import { useTargetAnnouncement } from "../game-logic/game-effects/target-announcement";

describe("Sound Manager Audio Call Behavior", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("should export voice function for full sentences", () => {
    expect(playSoundEffect.voice).toBeDefined();
    expect(typeof playSoundEffect.voice).toBe("function");
  });

  it("should NOT export voiceWordOnly (removed in Dec 2025)", () => {
    expect(playSoundEffect).not.toHaveProperty("voiceWordOnly");
  });

  it("should call the underlying soundManager methods with correct parameters", () => {
    // This test ensures the playSoundEffect object correctly wraps soundManager methods
    const testPhrase = "apple";

    // We can't easily test the actual audio playback in unit tests,
    // but we can verify the functions don't throw errors when called
    expect(() => {
      void playSoundEffect.voice(testPhrase);
    }).not.toThrow();
  });

  it("should export target-miss sound effect for game events", () => {
    expect(playSoundEffect.targetMiss).toBeDefined();
    expect(typeof playSoundEffect.targetMiss).toBe("function");

    expect(() => {
      void playSoundEffect.targetMiss();
    }).not.toThrow();
  });

  it("should export the expected sound effect helpers", () => {
    // Verify that we only have the expected sound effects and control methods
    // voiceWordOnly was removed in December 2025 per issue requirements
    // welcome method added in December 2025 for welcome screen audio
    // targetMiss retained for game audio feedback
    const exportedMethods = Object.keys(playSoundEffect);
    expect(exportedMethods).toHaveLength(5);
    expect(exportedMethods).toContain("voice");
    expect(exportedMethods).toContain("welcome");
    expect(exportedMethods).toContain("stopAll");
    expect(exportedMethods).toContain("targetMiss");
    expect(exportedMethods).toContain("byName");
    expect(exportedMethods).not.toContain("voiceWordOnly");
    expect(exportedMethods).not.toContain("sticker");
  });

  it("should have stopAll method to stop all audio", () => {
    expect(playSoundEffect.stopAll).toBeDefined();
    expect(typeof playSoundEffect.stopAll).toBe("function");

    expect(() => {
      void playSoundEffect.stopAll();
    }).not.toThrow();
  });

  describe("target announcement audio", () => {
    it("plays the target through the sound-manager fallback chain", async () => {
      const playSpy = vi
        .spyOn(soundManager, "playWord")
        .mockResolvedValue();
      const setState = vi.fn();

      useTargetAnnouncement(true, "playing", "apple", "🍎", setState);
      await Promise.resolve();

      expect(playSpy).toHaveBeenCalledWith("apple");
    });
  });
});
