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

  it("prefers the curated intro and Thai association clips before generated fallbacks", () => {
    const sequencer = new WelcomeAudioSequencer();

    const assets = sequencer.getWelcomeAudioSequence({
      language: "th",
      maxSequenceLength: 2,
    });

    expect(assets.map((asset) => asset.key)).toEqual([
      "welcome_evan_intro_thai",
      "welcome_sangsom_association_thai",
    ]);
  });

  it("does not include duplicate welcome categories in a single sequence", () => {
    const sequencer = new WelcomeAudioSequencer();

    const assets = sequencer.getWelcomeAudioSequence({
      language: "th",
      maxSequenceLength: 5,
    });

    expect(new Set(assets.map((asset) => asset.category)).size).toBe(
      assets.length,
    );
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
