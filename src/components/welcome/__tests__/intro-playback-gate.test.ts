import { describe, expect, it } from "vitest";

import { createIntroPlaybackGate } from "../intro-playback-gate";

describe("createIntroPlaybackGate", () => {
  it("hides the language shell and reveals intro media immediately after selection", () => {
    const gate = createIntroPlaybackGate();

    gate.onLanguageSelected();

    expect(gate.getState()).toMatchObject({
      isLanguageShellVisible: false,
      shouldLoadVideo: true,
      shouldShowStatusPanel: false,
      showFallbackImage: false,
      shouldStartAudioWhenVideoPlays: true,
    });
  });

  it("arms welcome audio until the first real video playing event", () => {
    const gate = createIntroPlaybackGate();

    gate.onLanguageSelected();

    expect(gate.onVideoPlaying()).toBe(true);
    expect(gate.onVideoPlaying()).toBe(false);
  });

  it("switches to the Sangsom fallback image and suppresses audio when video fails", () => {
    const gate = createIntroPlaybackGate();

    gate.onLanguageSelected();
    gate.onVideoError();

    expect(gate.getState()).toMatchObject({
      isLanguageShellVisible: false,
      shouldLoadVideo: false,
      shouldShowStatusPanel: false,
      showFallbackImage: true,
      shouldStartAudioWhenVideoPlays: false,
      readyToContinueAfterFailure: true,
    });
  });
});
