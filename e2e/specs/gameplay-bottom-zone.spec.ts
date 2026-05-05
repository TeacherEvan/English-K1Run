import { expect, test } from "../fixtures/game.fixture";

interface BottomTargetCandidate {
  id: string;
  emoji: string;
  centerY: number;
}

const BOTTOM_ZONE_START = 0.9;

const findBottomZoneTarget = async (
  page: import("@playwright/test").Page,
): Promise<BottomTargetCandidate | null> => {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    const candidate = await page.evaluate((bottomZoneStart) => {
      const gameArea = document.querySelector('[data-testid="game-area"]');
      const targetEmoji = document
        .querySelector('[data-testid="target-emoji"]')
        ?.textContent?.trim();

      if (!gameArea || !targetEmoji) return null;

      const areaRect = gameArea.getBoundingClientRect();
      const threshold = areaRect.top + areaRect.height * bottomZoneStart;

      const bottomTarget = Array.from(
        document.querySelectorAll('[data-testid="falling-object"]'),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const overlapTop = Math.max(rect.top, threshold);
          const overlapBottom = Math.min(rect.bottom, areaRect.bottom);
          return {
            id: element.getAttribute("data-object-id") ?? "",
            emoji: element.getAttribute("data-emoji") ?? "",
            centerY: rect.top + rect.height / 2,
            top: rect.top,
            bottom: rect.bottom,
            clickX: rect.left + rect.width / 2,
            clickY: overlapTop + (overlapBottom - overlapTop) / 2,
          };
        })
        .filter(
          (object) =>
            object.id &&
            object.emoji === targetEmoji &&
            object.bottom >= threshold &&
            object.top <= areaRect.bottom,
        )
        .sort((a, b) => b.centerY - a.centerY)[0];

      if (!bottomTarget) return null;

      return {
        id: bottomTarget.id,
        emoji: bottomTarget.emoji,
        centerY: bottomTarget.centerY,
      };
    }, BOTTOM_ZONE_START);

    if (candidate) {
      return candidate as BottomTargetCandidate;
    }

    await page.waitForTimeout(100);
  }

  return null;
};

test.describe("Gameplay bottom-zone interaction", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
    await gamePage.menu.startGame();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });
  });

  test("should not render the removed target announcement bubble", async ({
    page,
  }) => {
    await expect(
      page.locator('[data-testid="target-announcement"]'),
    ).toHaveCount(0);
  });

  test("should tap a target in the bottom 10% of the gameplay area", async ({
    gamePage,
    page,
  }) => {
    await gamePage.gameplay.waitForObjectsToSpawn(5);

    const initialProgress = await gamePage.gameplay.getProgress(1);
    const candidate = await findBottomZoneTarget(page);

    expect(candidate).not.toBeNull();

    await gamePage.gameplay.clickMovingElement(candidate!.id, {
      timeoutMs: 3_000,
    });
    await page.waitForTimeout(500);

    const newProgress = await gamePage.gameplay.getProgress(1);
    expect(newProgress).toBeGreaterThan(initialProgress);
  });
});
