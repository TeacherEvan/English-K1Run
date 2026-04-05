import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PreloadProgress } from "@/lib/resource-preloader";
import type { StartupBootState } from "../use-startup-boot";

const {
  capturedStates,
  mockCaptureState,
  mockHasReadyStartupPack,
  mockMarkStartupPackReady,
  mockPreloadResources,
} = vi.hoisted(() => ({
  capturedStates: [] as StartupBootState[],
  mockCaptureState: vi.fn(),
  mockHasReadyStartupPack: vi.fn(),
  mockMarkStartupPackReady: vi.fn(),
  mockPreloadResources: vi.fn(),
}));

vi.mock("@/lib/resource-preloader", () => ({
  isLimitedBandwidth: () => false,
  preloadResources: mockPreloadResources,
}));

vi.mock("../startup-persistence", async () => {
  const actual = await vi.importActual<typeof import("../startup-persistence")>(
    "../startup-persistence",
  );
  return {
    ...actual,
    hasReadyStartupPack: mockHasReadyStartupPack,
    markStartupPackReady: mockMarkStartupPackReady,
  };
});

import { STARTUP_PACK_VERSION } from "../startup-boot-resources";
import { useStartupBoot } from "../use-startup-boot";

const completeProgress: PreloadProgress = {
  total: 2,
  loaded: 2,
  failed: 0,
  percentage: 100,
  failedResources: [],
};

const Harness = ({ enabled }: { enabled: boolean }) => {
  const state = useStartupBoot(enabled);

  useEffect(() => {
    mockCaptureState(state);
  }, [state]);

  return null;
};

describe("useStartupBoot", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    capturedStates.length = 0;
    mockCaptureState.mockImplementation((state: StartupBootState) => {
      capturedStates[0] = state;
    });
    mockHasReadyStartupPack.mockReturnValue(false);
    mockPreloadResources.mockImplementation(
      async (_resources, onProgress?: (progress: PreloadProgress) => void) => {
        onProgress?.(completeProgress);
        return completeProgress;
      },
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("stays not ready until the minimum branded boot duration elapses", async () => {
    await act(async () => {
      root.render(createElement(Harness, { enabled: true }));
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(capturedStates[0]).toMatchObject({
      ready: false,
      percentage: 100,
      phase: "complete",
    });
  });

  it("becomes ready only after preload completion and the minimum boot duration", async () => {
    await act(async () => {
      root.render(createElement(Harness, { enabled: true }));
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(capturedStates[0]?.ready).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2550);
    });

    expect(capturedStates[0]).toMatchObject({
      ready: true,
      percentage: 100,
      phase: "complete",
    });
    expect(mockMarkStartupPackReady).toHaveBeenCalledWith(STARTUP_PACK_VERSION);
  });

  it("returns ready immediately when the startup pack is already warm", async () => {
    mockHasReadyStartupPack.mockReturnValue(true);

    await act(async () => {
      root.render(createElement(Harness, { enabled: true }));
      await Promise.resolve();
    });

    expect(capturedStates[0]).toEqual({
      ready: true,
      percentage: 100,
      phase: "complete",
      label: "Ready to start",
    });
    expect(mockPreloadResources).not.toHaveBeenCalled();
  });
});
