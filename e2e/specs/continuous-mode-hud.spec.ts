import { expect, test } from "../fixtures/game.fixture";

test.describe("Continuous mode HUD target secrecy", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
  });

  test("shows real target emoji in normal mode", async ({ gamePage }) => {
    await gamePage.menu.startGame();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });

    const target = await gamePage.gameplay.getCurrentTarget();
    expect(target.emoji?.trim()).not.toBe("❓");
  });

  test("hides target emoji behind question mark in continuous mode", async ({
    gamePage,
  }) => {
    await gamePage.menu.playAllLevels();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });

    const target = await gamePage.gameplay.getCurrentTarget();
    expect(target.emoji?.trim()).toBe("❓");
  });
});
