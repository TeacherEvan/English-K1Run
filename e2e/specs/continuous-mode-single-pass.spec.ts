import { expect, test } from "../fixtures/game.fixture";

import { GAME_CATEGORIES } from "../../src/lib/constants/game-categories";

const targetEmojiByName = new Map(
  GAME_CATEGORIES.flatMap((category) =>
    category.items.map((item) => [item.name, item.emoji] as const),
  ),
);

const getTargetEmoji = (label: string): string => {
  const targetName = label.split(":").pop()?.trim() ?? "";
  const emoji = targetEmojiByName.get(targetName);
  if (!emoji)
    throw new Error(`No emoji mapping found for target label: ${label}`);
  return emoji;
};

test.describe("Continuous mode single-pass", () => {
  test.beforeEach(async ({ gamePage, page }) => {
    await gamePage.goto("/?e2e=1&continuousLevelMs=1000");
    await page.evaluate(() =>
      localStorage.removeItem("continuousModeBestTargetTotal"),
    );
    await gamePage.waitForReady();
  });

  test("auto-rotates through one pass and updates the menu target total", async ({
    gamePage,
    page,
  }) => {
    const popupSeen = page
      .locator('[data-testid="level-complete-popup"]')
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    const countdownSeen = page
      .locator('[data-testid="level-countdown-overlay"]')
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    await gamePage.menu.playAllLevels();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });

    const targetLabel =
      (await gamePage.gameplay.targetName.textContent()) ?? "";
    const targetEmoji = getTargetEmoji(targetLabel);
    await gamePage.gameplay.tapObjectByEmoji(targetEmoji);

    await expect(gamePage.menu.container).toBeVisible({ timeout: 15_000 });
    await expect(gamePage.gameplay.stopwatch).toHaveCount(0);

    expect(await popupSeen).toBe(false);
    expect(await countdownSeen).toBe(false);

    const storedScore = await page.evaluate(() =>
      localStorage.getItem("continuousModeBestTargetTotal"),
    );
    expect(Number(storedScore)).toBeGreaterThan(0);

    await expect(
      page.locator('[data-testid="menu-best-time-card"]'),
    ).toContainText("Total Targets Destroyed");
    await expect(
      page.locator('[data-testid="menu-best-time-card"]'),
    ).toContainText(storedScore ?? "0");
  });
});
