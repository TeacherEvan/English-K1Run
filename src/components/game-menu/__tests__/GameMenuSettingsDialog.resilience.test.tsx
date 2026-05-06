import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameMenuSettingsDialog } from "../GameMenuSettingsDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const longTranslations: Record<string, string> = {
        "settings.title": "Extremely detailed classroom settings and configuration",
        "settings.description": "Choose visual, audio, control, and accessibility options for this classroom experience.",
        "settings.tabs.audio": "Audio and spoken feedback preferences",
        "settings.tabs.visual": "Visual presentation and scaling options",
        "settings.tabs.controls": "Controls, language, and classroom behavior",
        "settings.tabs.accessibility": "Accessibility and learner support tools",
      };

      return longTranslations[key] ?? key;
    },
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

describe("GameMenuSettingsDialog resilience", () => {
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

  it("keeps the dialog scrollable and tab labels wrappable for long localized copy", async () => {
    await act(async () => {
      root.render(
        <GameMenuSettingsDialog
          resolutionScale="auto"
          setResolutionScale={vi.fn()}
          continuousMode={false}
          languageDiscoveryActive={false}
          onLanguageDiscoverySeen={vi.fn()}
        />,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="settings-button"]',
    ) as HTMLButtonElement;

    await act(async () => {
      trigger.click();
      await import("../GameMenuSettingsDialogPanel");
      await Promise.resolve();
      await Promise.resolve();
    });

    const dialogContent = document.querySelector(
      '[data-slot="dialog-content"]',
    ) as HTMLDivElement;
    const tabsList = document.querySelector('[data-slot="tabs-list"]') as HTMLDivElement;
    const tabs = Array.from(
      document.querySelectorAll('[data-slot="tabs-trigger"]'),
    ) as HTMLButtonElement[];

    expect(dialogContent.className).toContain("max-h-");
    expect(dialogContent.className).toContain("overflow-y-auto");
    expect(tabsList.className).toContain("grid");
    expect(tabsList.className).toContain("grid-cols-2");
    expect(tabsList.className).toContain("sm:grid-cols-4");

    for (const tab of tabs) {
      expect(tab.className).toContain("whitespace-normal");
      expect(tab.className).toContain("min-w-0");
    }
  });
});