import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameMenuLevelSelect } from "../GameMenuLevelSelect";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { level?: string }) => {
      const translations: Record<string, string> = {
        "accessibility.levelSelectionOpened": "Level selection opened",
        "game.selectLevel": "Select an Extraordinarily Long Learning Adventure Level",
        "game.back": "Return to the main menu",
        "game.startGame": "Start this learning adventure now",
      };

      if (key === "accessibility.selectedLevel") {
        return `Selected level: ${options?.level ?? ""}`;
      }

      return translations[key] ?? key;
    },
  }),
}));

vi.mock("@/lib/accessibility-utils", () => ({
  announceToScreenReader: vi.fn(),
  createFocusTrap: vi.fn(() => vi.fn()),
  isKeyPressed: vi.fn(() => false),
  KeyboardKeys: {
    ESCAPE: "Escape",
    ENTER: "Enter",
    SPACE: " ",
    ARROW_LEFT: "ArrowLeft",
    ARROW_UP: "ArrowUp",
    ARROW_RIGHT: "ArrowRight",
    ARROW_DOWN: "ArrowDown",
  },
  moveFocusToAdjacentElement: vi.fn(),
}));

describe("GameMenuLevelSelect", () => {
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
    vi.restoreAllMocks();
  });

  it("renders duplicate long level labels without duplicate key warnings", async () => {
    const duplicateLongLabel = "An extraordinarily long localized level label that should still wrap cleanly in the selector";
    const anotherLongLabel = "Another very long localized label for the final classroom challenge in this selector";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      root.render(
        <GameMenuLevelSelect
          levels={[duplicateLongLabel, duplicateLongLabel, anotherLongLabel]}
          selectedLevel={1}
          levelIcons={["🐢", "🦊", "🦉"]}
          onSelectLevel={vi.fn()}
          onStartGame={vi.fn()}
          onBack={vi.fn()}
        />,
      );
    });

    const labels = Array.from(
      document.querySelectorAll("[data-testid='level-button'] .level-select-label"),
    ).map((node) => node.textContent);

    expect(labels).toEqual([
      duplicateLongLabel,
      duplicateLongLabel,
      anotherLongLabel,
    ]);
    expect(
      consoleErrorSpy.mock.calls.some(([message]) =>
        String(message).includes("Encountered two children with the same key"),
      ),
    ).toBe(false);
  });
});