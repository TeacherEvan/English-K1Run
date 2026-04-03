import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetPublicAudioResolverCache,
  resolvePublicAudioUrl,
} from "../audio-public-resolver";

const createResponse = (ok: boolean, contentType?: string) =>
  ({
    ok,
    headers: {
      get: vi.fn((name: string) =>
        name.toLowerCase() === "content-type" ? (contentType ?? null) : null,
      ),
    },
  }) as unknown as Response;

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
      .mockResolvedValueOnce(createResponse(true, "text/html"))
      .mockResolvedValueOnce(createResponse(true, "audio/mpeg"));

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
      .mockResolvedValueOnce(createResponse(false))
      .mockResolvedValueOnce(createResponse(false))
      .mockResolvedValueOnce(createResponse(true, "audio/wav"));

    await expect(resolvePublicAudioUrl("fire_truck")).resolves.toBe(
      "/sounds/fire truck.wav",
    );

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/sounds/fire truck.wav", {
      method: "HEAD",
    });
  });

  it("returns null when no public candidate exists", async () => {
    fetchMock.mockResolvedValue(createResponse(false));

    await expect(
      resolvePublicAudioUrl("missing_sound_key"),
    ).resolves.toBeNull();
  });

  it("rejects html responses that masquerade as successful audio paths", async () => {
    fetchMock.mockResolvedValue(createResponse(true, "text/html"));

    await expect(
      resolvePublicAudioUrl("missing_sound_key"),
    ).resolves.toBeNull();
  });
});
