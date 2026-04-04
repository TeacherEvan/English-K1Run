import { beforeEach, describe, expect, it, vi } from "vitest";

import { prefetchSelectedLanguageAudioPack } from "../language-audio-prefetch";

describe("language-audio-prefetch", () => {
  const mockPrefetchKeys = vi.fn().mockResolvedValue(undefined);
  const mockHasWarmPack = vi.fn().mockReturnValue(false);
  const mockMarkWarmPack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips default startup languages", async () => {
    const didPrefetch = await prefetchSelectedLanguageAudioPack("en", {
      prefetchKeys: mockPrefetchKeys,
      hasWarmPack: mockHasWarmPack,
      markWarmPack: mockMarkWarmPack,
      languageMap: { en: ["welcome_evan_intro"] },
      limitedBandwidth: false,
    });

    expect(didPrefetch).toBe(false);
    expect(mockPrefetchKeys).not.toHaveBeenCalled();
  });

  it("prefetches only the selected non-default language pack", async () => {
    const didPrefetch = await prefetchSelectedLanguageAudioPack("fr", {
      prefetchKeys: mockPrefetchKeys,
      hasWarmPack: mockHasWarmPack,
      markWarmPack: mockMarkWarmPack,
      languageMap: {
        fr: ["fr_intro", "fr_association"],
        ja: ["ja_intro"],
      },
      limitedBandwidth: false,
    });

    expect(didPrefetch).toBe(true);
    expect(mockPrefetchKeys).toHaveBeenCalledWith([
      "fr_intro",
      "fr_association",
    ]);
    expect(mockMarkWarmPack).toHaveBeenCalledWith("fr");
  });

  it("skips optional language warmup on limited bandwidth", async () => {
    const didPrefetch = await prefetchSelectedLanguageAudioPack("fr", {
      prefetchKeys: mockPrefetchKeys,
      hasWarmPack: mockHasWarmPack,
      markWarmPack: mockMarkWarmPack,
      languageMap: { fr: ["fr_intro"] },
      limitedBandwidth: true,
    });

    expect(didPrefetch).toBe(false);
    expect(mockPrefetchKeys).not.toHaveBeenCalled();
  });

  it("avoids duplicate prefetch when the language pack is already warm", async () => {
    mockHasWarmPack.mockReturnValue(true);

    const didPrefetch = await prefetchSelectedLanguageAudioPack("ja", {
      prefetchKeys: mockPrefetchKeys,
      hasWarmPack: mockHasWarmPack,
      markWarmPack: mockMarkWarmPack,
      languageMap: { ja: ["ja_intro"] },
      limitedBandwidth: false,
    });

    expect(didPrefetch).toBe(false);
    expect(mockPrefetchKeys).not.toHaveBeenCalled();
    expect(mockMarkWarmPack).not.toHaveBeenCalled();
  });
});
