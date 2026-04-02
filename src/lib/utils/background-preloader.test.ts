import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("background preloader policy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports non-visual helpers used for startup performance only", async () => {
    const mod = await import("./background-preloader");

    expect(typeof mod.preloadBackgroundImages).toBe("function");
    expect(typeof mod.isBackgroundLoaded).toBe("function");
    expect(typeof mod.getBackgroundLoadingProgress).toBe("function");
  });
});
