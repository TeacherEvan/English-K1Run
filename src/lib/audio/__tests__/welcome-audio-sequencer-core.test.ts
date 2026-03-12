import { describe, expect, it } from "vitest";

import { WelcomeAudioSequencer } from "../welcome-audio-sequencer-core";

describe("WelcomeAudioSequencer", () => {
  it("keeps the English intro first for English startup", () => {
    const sequencer = new WelcomeAudioSequencer();

    const assets = sequencer.getWelcomeAudioSequence({
      language: "en",
      maxSequenceLength: 3,
    });

    expect(assets[0]?.key).toBe("welcome_evan_intro");
    expect(assets.every((asset) => asset.language === "en")).toBe(true);
  });

  it("switches the welcome sequence to Thai when Thai is selected", () => {
    const sequencer = new WelcomeAudioSequencer();

    const assets = sequencer.getWelcomeAudioSequence({
      language: "th",
      maxSequenceLength: 3,
    });

    expect(assets[0]?.key).toBe("welcome_evan_intro_thai");
    expect(assets.every((asset) => asset.language === "th")).toBe(true);
  });

  it("falls back to the English welcome sequence for unsupported startup languages", () => {
    const sequencer = new WelcomeAudioSequencer();

    const assets = sequencer.getWelcomeAudioSequence({
      language: "fr",
      maxSequenceLength: 3,
    });

    expect(assets[0]?.key).toBe("welcome_evan_intro");
    expect(assets.every((asset) => asset.language === "en")).toBe(true);
  });
});
