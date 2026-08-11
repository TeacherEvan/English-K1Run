import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetPublicAudioResolverCache,
  resolvePublicAudioUrl,
} from "../audio-public-resolver";

describe("resolvePublicAudioUrl", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let canPlayTypeSpy: { mockRestore: () => void } | undefined;

  beforeEach(() => {
    resetPublicAudioResolverCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    canPlayTypeSpy?.mockRestore();
    canPlayTypeSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, "canPlayType")
      .mockImplementation((mime) =>
        mime === "audio/wav" || mime === "audio/mpeg" ? "probably" : "",
      );
  });

  it("falls back to mp3 when the preferred wav welcome file is missing", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    await expect(
      resolvePublicAudioUrl("welcome_evan_intro_thai"),
    ).resolves.toBe("/sounds/welcome_evan_intro_thai.mp3");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/sounds/welcome_evan_intro_thai.wav",
      {
        method: "HEAD",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/sounds/welcome_evan_intro_thai.mp3",
      {
        method: "HEAD",
      },
    );
  });

  it("resolves space-based filenames for normalized multi-word keys", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    await expect(resolvePublicAudioUrl("fire_truck")).resolves.toBe(
      "/sounds/fire truck.wav",
    );

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/sounds/fire truck.wav", {
      method: "HEAD",
    });
  });

  it("returns null when no public candidate exists", async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response);

    await expect(
      resolvePublicAudioUrl("missing_sound_key"),
    ).resolves.toBeNull();
  });
});
