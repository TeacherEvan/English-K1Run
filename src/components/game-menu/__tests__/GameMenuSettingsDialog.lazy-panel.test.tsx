import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("GameMenuSettingsDialog lazy panel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.resetModules();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.doUnmock("react-i18next");
    vi.doUnmock("../../../context/settings-context");
    vi.doUnmock("../settings-sections/AccessibilitySettings");
    vi.doUnmock("../settings-sections/AudioSettings");
    vi.doUnmock("../settings-sections/ControlSettings");
    vi.doUnmock("../settings-sections/VisualSettings");
    vi.doUnmock("../GameMenuSettingsDialogPanel");
  });

  it("shows a lightweight fallback until the settings panel chunk resolves", async () => {
    let resolvePanelModule:
      | ((value: { GameMenuSettingsDialogPanel: () => ReactElement }) => void)
      | undefined;
    const panelModule = new Promise<{ GameMenuSettingsDialogPanel: () => ReactElement }>((resolve) => {
      resolvePanelModule = resolve;
    });

    vi.doMock("react-i18next", () => ({
      useTranslation: () => ({
        t: (key: string) => key,
      }),
    }));

    vi.doMock("../../../context/settings-context", () => ({
      useSettings: () => ({
        gameplayLanguage: "en",
      }),
    }));

    vi.doMock("../settings-sections/AccessibilitySettings", () => ({
      AccessibilitySettings: () => <div>AccessibilitySettings</div>,
    }));

    vi.doMock("../settings-sections/AudioSettings", () => ({
      AudioSettings: () => <div>AudioSettings</div>,
    }));

    vi.doMock("../settings-sections/ControlSettings", () => ({
      ControlSettings: () => <div>ControlSettings</div>,
    }));

    vi.doMock("../settings-sections/VisualSettings", () => ({
      VisualSettings: () => <div>VisualSettings</div>,
    }));

    vi.doMock("../GameMenuSettingsDialogPanel", () => panelModule);

    const { GameMenuSettingsDialog } = await import("../GameMenuSettingsDialog");

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
      await Promise.resolve();
    });

    expect(document.querySelector('[data-testid="settings-dialog-loading"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="settings-surface-panel"]')).toBeNull();

    await act(async () => {
      resolvePanelModule?.({
        GameMenuSettingsDialogPanel: () => <div data-testid="settings-surface-panel" />,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.querySelector('[data-testid="settings-surface-panel"]')).not.toBeNull();
  });
});