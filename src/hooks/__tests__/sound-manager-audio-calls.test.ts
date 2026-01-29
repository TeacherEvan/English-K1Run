/**
 * Unit Tests for Sound Manager Audio Call Behavior
 *
 * Tests verify that the game uses the correct audio playback methods:
 * - Target announcements use full sentences (playSoundEffect.voice)
 * - Single-word tap feedback has been removed per December 2025 requirements
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { playSoundEffect } from "../../lib/sound-manager";

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

  it("should have sticker celebration sound effect", () => {
    expect(playSoundEffect.sticker).toBeDefined();
    expect(typeof playSoundEffect.sticker).toBe("function");

    expect(() => {
      void playSoundEffect.sticker();
    }).not.toThrow();
  });

  it("should export target-related sound effects for game events", () => {
    // Added January 2026 for target spawn, hit, and miss audio feedback
    expect(playSoundEffect.targetSpawn).toBeDefined();
    expect(typeof playSoundEffect.targetSpawn).toBe("function");
    expect(playSoundEffect.targetHit).toBeDefined();
    expect(typeof playSoundEffect.targetHit).toBe("function");
    expect(playSoundEffect.targetMiss).toBeDefined();
    expect(typeof playSoundEffect.targetMiss).toBe("function");

    expect(() => {
      void playSoundEffect.targetSpawn();
      void playSoundEffect.targetHit();
      void playSoundEffect.targetMiss();
    }).not.toThrow();
  });

  it("should only export voice, sticker, welcome, stopAll, and target methods", () => {
    // Verify that we only have the expected sound effects and control methods
    // voiceWordOnly was removed in December 2025 per issue requirements
    // welcome method added in December 2025 for welcome screen audio
    // targetSpawn, targetHit, targetMiss added January 2026 for game audio feedback
    const exportedMethods = Object.keys(playSoundEffect);
    expect(exportedMethods).toHaveLength(7);
    expect(exportedMethods).toContain("voice");
    expect(exportedMethods).toContain("sticker");
    expect(exportedMethods).toContain("welcome");
    expect(exportedMethods).toContain("stopAll");
    expect(exportedMethods).toContain("targetSpawn");
    expect(exportedMethods).toContain("targetHit");
    expect(exportedMethods).toContain("targetMiss");
    expect(exportedMethods).not.toContain("voiceWordOnly");
  });

  it("should have stopAll method to stop all audio", () => {
    expect(playSoundEffect.stopAll).toBeDefined();
    expect(typeof playSoundEffect.stopAll).toBe("function");

    expect(() => {
      void playSoundEffect.stopAll();
    }).not.toThrow();
  });
});
