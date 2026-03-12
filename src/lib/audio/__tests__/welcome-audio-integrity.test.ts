import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../audio-registry", () => ({
  getAudioUrl: vi.fn(),
}));

import { getAudioUrl } from "../audio-registry";
import {
  resetWelcomeAudioIntegrityCache,
  validateWelcomeAudioIntegrity,
} from "../welcome-audio-integrity";

const mockedGetAudioUrl = vi.mocked(getAudioUrl);

describe("validateWelcomeAudioIntegrity", () => {
  beforeEach(() => {
    resetWelcomeAudioIntegrityCache();
    mockedGetAudioUrl.mockReset();
  });

  it("caches repeated checks for the same language", async () => {
    mockedGetAudioUrl.mockResolvedValue("/sounds/welcome_evan_intro.mp3");

    await expect(validateWelcomeAudioIntegrity("en")).resolves.toEqual({
      isValid: true,
    });
    await expect(validateWelcomeAudioIntegrity("en")).resolves.toEqual({
      isValid: true,
    });

    expect(mockedGetAudioUrl).toHaveBeenCalledTimes(1);
    expect(mockedGetAudioUrl).toHaveBeenCalledWith("welcome_evan_intro");
  });

  it("tracks cache entries separately for Thai and English", async () => {
    mockedGetAudioUrl.mockImplementation(async (key) =>
      key === "welcome_evan_intro" ? "/sounds/welcome_evan_intro.mp3" : null,
    );

    await expect(validateWelcomeAudioIntegrity("en")).resolves.toEqual({
      isValid: true,
    });
    await expect(validateWelcomeAudioIntegrity("th")).resolves.toEqual({
      isValid: false,
      reason: "Unable to resolve audio URL for 'welcome_evan_intro_thai'",
    });

    expect(mockedGetAudioUrl).toHaveBeenNthCalledWith(1, "welcome_evan_intro");
    expect(mockedGetAudioUrl).toHaveBeenNthCalledWith(
      2,
      "welcome_evan_intro_thai",
    );
  });
});
