import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetHomeMenuAudioMemoryForTests,
  resetHomeMenuAudioForTests,
  useHomeMenuAudio,
} from "../use-home-menu-audio";

const { mockUseSettings, mockPlaySound, mockResume, mockGetContext } =
  vi.hoisted(() => ({
    mockUseSettings: vi.fn(),
    mockPlaySound: vi.fn().mockResolvedValue(undefined),
    mockResume: vi.fn().mockResolvedValue(undefined),
    mockGetContext: vi.fn(),
  }));

vi.mock("../../context/settings-context", () => ({
  useSettings: mockUseSettings,
}));

vi.mock("../../lib/sound-manager", () => ({
  soundManager: {
    playSound: mockPlaySound,
  },
}));

vi.mock("../../lib/audio/audio-context-manager", () => ({
  audioContextManager: {
    getContext: mockGetContext,
  },
}));

const Harness = () => {
  useHomeMenuAudio();
  return null;
};

describe("useHomeMenuAudio", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    sessionStorage.clear();
    resetHomeMenuAudioForTests();
    mockUseSettings.mockReturnValue({ soundEnabled: true });
    mockGetContext.mockReturnValue({ state: "running", resume: mockResume });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    window.history.replaceState({}, "", "/");
    container.remove();
    sessionStorage.clear();
    resetHomeMenuAudioForTests();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const renderHook = async () => {
    await act(async () => {
      root.render(<Harness />);
    });
  };

  it("plays the Sangsom association sequence once per browser session", async () => {
    await renderHook();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPlaySound).toHaveBeenCalledTimes(2);
    expect(mockPlaySound).toHaveBeenNthCalledWith(
      1,
      "welcome_sangsom_association",
      1,
      0.85,
    );
    expect(mockPlaySound).toHaveBeenNthCalledWith(
      2,
      "welcome_sangsom_association_thai",
      0.9,
      0.85,
    );

    act(() => {
      root.unmount();
    });
    root = createRoot(container);

    await renderHook();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPlaySound).toHaveBeenCalledTimes(2);
  });

  it("skips playback when the browser session was already marked", async () => {
    sessionStorage.setItem("homeMenuAssociationPlayed", "true");
    resetHomeMenuAudioMemoryForTests();

    await renderHook();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it("does not play when sound is disabled", async () => {
    mockUseSettings.mockReturnValue({ soundEnabled: false });

    await renderHook();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it("does not play in e2e mode", async () => {
    window.history.replaceState({}, "", "/?e2e=1");

    await renderHook();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPlaySound).not.toHaveBeenCalled();
  });
});