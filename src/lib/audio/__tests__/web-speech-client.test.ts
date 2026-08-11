import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { speakAsync } from "../speech/web-speech-client";

class MockSpeechSynthesisUtterance {
  rate = 1;
  pitch = 1;
  volume = 1;
  lang = "";
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {}
}

describe("web-speech-client", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns false instead of using an English voice for Japanese speech", async () => {
    const speak = vi.fn();

    globalThis.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [
        {
          default: true,
          lang: "en-US",
          localService: true,
          name: "English Voice",
          voiceURI: "en-test",
        } as SpeechSynthesisVoice,
      ],
      pending: false,
      speaking: false,
      paused: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as SpeechSynthesis;

    await expect(
      speakAsync({ text: "レモンをみつけてください。", langCode: "ja" }),
    ).resolves.toBe(false);
    expect(speak).not.toHaveBeenCalled();
  });
});
