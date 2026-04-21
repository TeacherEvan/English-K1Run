import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameMenuSettingsDialog } from "../GameMenuSettingsDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../context/settings-context", () => ({
  useSettings: () => ({
    gameplayLanguage: "en",
  }),
}));

vi.mock("../settings-sections/AccessibilitySettings", () => ({
  AccessibilitySettings: () => <div>AccessibilitySettings</div>,
}));

vi.mock("../settings-sections/AudioSettings", () => ({
  AudioSettings: () => <div>AudioSettings</div>,
}));

vi.mock("../settings-sections/ControlSettings", () => ({
  ControlSettings: () => <div>ControlSettings</div>,
}));

vi.mock("../settings-sections/VisualSettings", () => ({
  VisualSettings: () => <div>VisualSettings</div>,
}));

describe("GameMenuSettingsDialog language discovery", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = "";
  });

  it("marks the settings trigger active and clears discovery on first open", async () => {
    const onLanguageDiscoverySeen = vi.fn();

    await act(async () => {
      root.render(
        <GameMenuSettingsDialog
          resolutionScale="auto"
          setResolutionScale={vi.fn()}
          continuousMode={false}
          languageDiscoveryActive
          onLanguageDiscoverySeen={onLanguageDiscoverySeen}
        />,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="settings-button"]',
    ) as HTMLButtonElement;

    expect(trigger.dataset.languageDiscovery).toBe("active");

    await act(async () => {
      trigger.click();
    });

    expect(onLanguageDiscoverySeen).toHaveBeenCalledTimes(1);
  });

  it("keeps the trigger idle after the discovery cue is dismissed", async () => {
    const onLanguageDiscoverySeen = vi.fn();

    await act(async () => {
      root.render(
        <GameMenuSettingsDialog
          resolutionScale="auto"
          setResolutionScale={vi.fn()}
          continuousMode={false}
          languageDiscoveryActive={false}
          onLanguageDiscoverySeen={onLanguageDiscoverySeen}
        />,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="settings-button"]',
    ) as HTMLButtonElement;

    expect(trigger.dataset.languageDiscovery).toBe("idle");

    await act(async () => {
      trigger.click();
    });

    expect(onLanguageDiscoverySeen).not.toHaveBeenCalled();
  });
});
