import { expect, test } from "../fixtures/game.fixture";

test("selected level transitions after 10 registered clears", async ({
  gamePage,
  page,
}) => {
  await gamePage.goto();
  await gamePage.waitForReady();
  await gamePage.menu.startGame();
  await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });
  await gamePage.gameplay.waitForObjectsToSpawn(1);

  for (let tap = 0; tap < 10; tap += 1) {
    const resolution =
      await gamePage.gameplay.tapCurrentTargetAndWaitForResolution();

    if (tap === 9) {
      expect(resolution).toBe("popup");
      await expect(
        page.locator('[data-testid="level-complete-popup"]'),
      ).toBeVisible();
    }

    if (tap < 9) {
      await gamePage.gameplay.waitForObjectsToSpawn(1);
    }
  }

  await expect(
    page.locator('[data-testid="level-countdown-overlay"]'),
  ).toBeVisible({
    timeout: 8_000,
  });
  await expect(
    page.locator('[data-testid="default-completion-dialog"]'),
  ).toHaveCount(0);
});
