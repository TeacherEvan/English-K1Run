import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameMenuHome } from "../GameMenuHome";
import { getGameMenuCompactLayout } from "../menu-layout-mode";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

vi.mock("../../../context/settings-context", () => ({
  useSettings: () => ({
    gameplayLanguage: "en",
  }),
}));

vi.mock("../../../hooks/use-home-menu-audio", () => ({
  useHomeMenuAudio: vi.fn(),
}));

describe("GameMenuHome compact layout", () => {
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
    vi.clearAllMocks();
  });

  it("marks detected small screens so compact CSS can keep the menu in one column", async () => {
    await act(async () => {
      root.render(
        <GameMenuHome
          formattedBestTargetTotal="0"
          highScores={[]}
          continuousMode={false}
          languageDiscoveryActive={false}
          resolutionScale="auto"
          compactLayout={getGameMenuCompactLayout(375)}
          setResolutionScale={vi.fn()}
          onLanguageDiscoverySeen={vi.fn()}
          onStartGame={vi.fn()}
          onShowLevels={vi.fn()}
          onToggleContinuousMode={vi.fn()}
          onResetGame={vi.fn()}
        />,
      );
    });

    const layout = container.querySelector(".menu-home-layout") as HTMLDivElement;
    const actionStack = container.querySelector(".menu-home-actions") as HTMLDivElement;

    expect(layout.dataset.compactLayout).toBe("single-column");
    expect(actionStack.dataset.compactLayout).toBe("single-column");
  });

  it("marks medium screens so the menu can switch to a balanced tablet layout", async () => {
    await act(async () => {
      root.render(
        <GameMenuHome
          formattedBestTargetTotal="0"
          highScores={[]}
          continuousMode={false}
          languageDiscoveryActive={false}
          resolutionScale="auto"
          compactLayout={getGameMenuCompactLayout(960)}
          setResolutionScale={vi.fn()}
          onLanguageDiscoverySeen={vi.fn()}
          onStartGame={vi.fn()}
          onShowLevels={vi.fn()}
          onToggleContinuousMode={vi.fn()}
          onResetGame={vi.fn()}
        />,
      );
    });

    const layout = container.querySelector(".menu-home-layout") as HTMLDivElement;
    const actionStack = container.querySelector(".menu-home-actions") as HTMLDivElement;

    expect(layout.dataset.compactLayout).toBe("balanced");
    expect(actionStack.dataset.compactLayout).toBe("balanced");
  });

  it("keeps large screens on the split layout", async () => {
    await act(async () => {
      root.render(
        <GameMenuHome
          formattedBestTargetTotal="0"
          highScores={[]}
          continuousMode={false}
          languageDiscoveryActive={false}
          resolutionScale="auto"
          compactLayout={getGameMenuCompactLayout(1440)}
          setResolutionScale={vi.fn()}
          onLanguageDiscoverySeen={vi.fn()}
          onStartGame={vi.fn()}
          onShowLevels={vi.fn()}
          onToggleContinuousMode={vi.fn()}
          onResetGame={vi.fn()}
        />,
      );
    });

    const layout = container.querySelector(".menu-home-layout") as HTMLDivElement;
    const actionStack = container.querySelector(".menu-home-actions") as HTMLDivElement;

    expect(layout.dataset.compactLayout).toBe("split");
    expect(actionStack.dataset.compactLayout).toBe("split");
  });
});