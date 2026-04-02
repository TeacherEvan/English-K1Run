import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAudioUrl, playManaged, stopChannel, speakAsync } = vi.hoisted(
  () => ({
    getAudioUrl: vi.fn(),
    playManaged: vi.fn(),
    stopChannel: vi.fn(),
    speakAsync: vi.fn(),
  }),
);

vi.mock("../audio-registry", () => ({
  getAudioUrl,
}));

vi.mock("../central-audio-manager", () => ({
  centralAudioManager: {
    playManaged,
    stopChannel,
  },
}));

vi.mock("../speech-synthesizer", () => ({
  speechSynthesizer: {
    speakAsync,
  },
}));

import { playAudioSequence } from "../welcome-audio-player";

describe("playAudioSequence", () => {
  beforeEach(() => {
    getAudioUrl.mockReset();
    playManaged.mockReset();
    stopChannel.mockReset();
    speakAsync.mockReset();
  });

  it("uses the gameplay Thai speech path instead of prerecorded Thai welcome audio", async () => {
    speakAsync.mockResolvedValue(true);
    getAudioUrl.mockResolvedValue("/sounds/welcome_evan_intro_thai.mp3");

    const state = {
      isPlaying: true,
      currentProgress: { current: 0, total: 0 },
    };

    await playAudioSequence(
      [
        {
          key: "welcome_evan_intro_thai",
          duration: 4.8,
          source: "elevenlabs",
          category: "welcome",
          language: "th",
          fallbackText:
            "ยินดีต้อนรับสู่ Super Student ของคุณครูอีแวน มาเรียนอย่างสนุกด้วยกันนะ!",
        },
      ],
      { sequentialDelayMs: 0 },
      state,
    );

    expect(getAudioUrl).not.toHaveBeenCalled();
    expect(playManaged).not.toHaveBeenCalled();
    expect(speakAsync).toHaveBeenCalledWith(
      "ยินดีต้อนรับสู่ Super Student ของคุณครูอีแวน มาเรียนอย่างสนุกด้วยกันนะ!",
      { langCode: "th" },
    );
    expect(stopChannel).toHaveBeenCalledWith("welcome");
  });

  it("does not fall back to prerecorded Thai welcome audio when speech is unavailable", async () => {
    speakAsync.mockResolvedValue(false);
    getAudioUrl.mockResolvedValue("/sounds/welcome_evan_intro_thai.mp3");
    const onDiagnostic = vi.fn();

    const state = {
      isPlaying: true,
      currentProgress: { current: 0, total: 0 },
    };

    await playAudioSequence(
      [
        {
          key: "welcome_evan_intro_thai",
          duration: 4.8,
          source: "elevenlabs",
          category: "welcome",
          language: "th",
          fallbackText:
            "ยินดีต้อนรับสู่ Super Student ของคุณครูอีแวน มาเรียนอย่างสนุกด้วยกันนะ!",
        },
      ],
      { sequentialDelayMs: 0 },
      state,
      undefined,
      onDiagnostic,
    );

    expect(getAudioUrl).not.toHaveBeenCalled();
    expect(playManaged).not.toHaveBeenCalled();
    expect(speakAsync).toHaveBeenCalledOnce();
    expect(onDiagnostic).toHaveBeenCalledWith({
      type: "thai-voice-unavailable",
      assetKey: "welcome_evan_intro_thai",
      language: "th",
      fallbackMode: "silent",
    });
    expect(stopChannel).toHaveBeenCalledWith("welcome");
  });
});
