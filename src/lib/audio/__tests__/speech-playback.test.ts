import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeechPlayback } from "../speech-playback";

vi.mock("../../event-tracker", () => ({
  eventTracker: { trackAudioPlayback: vi.fn() },
}));

class MockSpeechSynthesisUtterance {
  rate = 1;
  pitch = 1;
  volume = 1;
  lang = "";
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;

  constructor(public text: string) {}
}

const requireUtterance = (
  utterance: MockSpeechSynthesisUtterance | null,
): MockSpeechSynthesisUtterance => {
  if (!utterance) {
    throw new Error("Expected speech synthesis to capture an utterance");
  }
  return utterance;
};

describe("SpeechPlayback", () => {
  const frenchVoice = {
    default: false,
    lang: "fr-FR",
    localService: true,
    name: "French Voice",
    voiceURI: "fr-test",
  } as SpeechSynthesisVoice;

  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves after speech ends instead of hanging after onstart", async () => {
    const speak = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
      window.setTimeout(() => utterance.onstart?.(), 0);
      window.setTimeout(() => utterance.onend?.(), 1);
    });

    globalThis.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [],
      pending: false,
      speaking: false,
      paused: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as SpeechSynthesis;

    const playback = new SpeechPlayback();
    const resultPromise = playback.speakAsync("Find the apple.", 0.6);

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe(true);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("applies the selected language and preferred voice", async () => {
    let capturedUtterance: MockSpeechSynthesisUtterance | null = null;
    const speak = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
      capturedUtterance = utterance;
      window.setTimeout(() => utterance.onend?.(), 0);
    });

    globalThis.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [frenchVoice],
      pending: false,
      speaking: false,
      paused: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as SpeechSynthesis;

    const playback = new SpeechPlayback();
    playback.setLanguage("fr");

    const resultPromise = playback.speakAsync("Trouve la pomme.", 0.6);

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe(true);
    const utterance = requireUtterance(capturedUtterance);
    expect(utterance.lang).toBe("fr");
    expect(utterance.voice).toBe(frenchVoice);
  });

  it("refuses to use an English voice for a non-English utterance", async () => {
    const speak = vi.fn();

    globalThis.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [
        {
          default: true,
          lang: "en-GB",
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

    const playback = new SpeechPlayback();
    playback.setLanguage("ja");

    await expect(
      playback.speakAsync("りんごをみつけてください。", 0.6),
    ).resolves.toBe(false);
    expect(speak).not.toHaveBeenCalled();
  });
});
