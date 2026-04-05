import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameMenuHighScoresDialog } from "../GameMenuHighScoresDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.highScores": "High Scores",
        "game.highScoresTitle": "Challenge Mode High Scores",
        "game.highScoresEmpty": "No Challenge Mode scores yet.",
        "game.targetsDestroyed": "Targets Destroyed",
        "game.languageUsed": "Language",
        "game.achievedAt": "Achieved",
        "common.close": "Close",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("GameMenuHighScoresDialog", () => {
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

  it("opens the dialog and renders score rows with language and achieved time", async () => {
    await act(async () => {
      root.render(
        <GameMenuHighScoresDialog
          highScores={[
            {
              score: 14,
              language: "th",
              achievedAt: "2026-04-05T09:30:00.000Z",
            },
          ]}
        />,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="high-scores-button"]',
    ) as HTMLButtonElement;

    await act(async () => {
      trigger.click();
    });

    expect(
      document.querySelector('[data-testid="high-scores-dialog"]'),
    ).not.toBeNull();

    const row = document.querySelector(
      '[data-testid="high-scores-row"]',
    ) as HTMLElement;
    expect(row.textContent).toContain("14");
    expect(row.textContent).toContain("Thai (ไทย)");
    expect(row.textContent).toContain("2026-04-05 09:30 UTC");
  });

  it("renders the empty state when there are no saved scores", async () => {
    await act(async () => {
      root.render(<GameMenuHighScoresDialog highScores={[]} />);
    });

    const trigger = document.querySelector(
      '[data-testid="high-scores-button"]',
    ) as HTMLButtonElement;

    await act(async () => {
      trigger.click();
    });

    expect(
      document.querySelector('[data-testid="high-scores-empty"]')?.textContent,
    ).toContain("No Challenge Mode scores yet.");
  });
});
