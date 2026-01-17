import { expect, test } from "../fixtures/game.fixture";

test.describe("Game Menu", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
  });

  test("should display menu on initial load", async ({ gamePage }) => {
    const isVisible = await gamePage.menu.isVisible();
    expect(isVisible).toBe(true);
  });

  test("should show game title", async ({ gamePage }) => {
    await expect(gamePage.menu.title).toContainText("Kindergarten Race");
  });

  test("should display all 9 game categories as levels", async ({
    gamePage,
  }) => {
    const count = await gamePage.menu.getLevelCount();
    expect(count).toBe(9);
  });

  test("should have Level 1 (Fruits & Vegetables) selected by default", async ({
    gamePage,
  }) => {
    await gamePage.menu.openLevelSelect();
    const firstButton = gamePage.menu.levelButtons.first();
    await expect(firstButton).toHaveAttribute("data-selected", "true");
    await expect(firstButton).toContainText("Fruits & Vegetables");
  });

  test("should allow selecting different levels", async ({ gamePage }) => {
    await gamePage.menu.openLevelSelect();
    // Select level 2 (Counting Fun)
    await gamePage.menu.selectLevel(1);

    const secondButton = gamePage.menu.levelButtons.nth(1);
    await expect(secondButton).toHaveAttribute("data-selected", "true");

    // First button should no longer be selected
    const firstButton = gamePage.menu.levelButtons.first();
    await expect(firstButton).toHaveAttribute("data-selected", "false");
  });

  test("should have visible Start Race button", async ({ gamePage }) => {
    await expect(gamePage.menu.startButton).toBeVisible();
    await expect(gamePage.menu.startButton).toContainText("Start Game");
  });

  test("should have visible Settings and Credits buttons", async ({
    gamePage,
  }) => {
    await expect(gamePage.menu.settingsButton).toBeVisible();
    await expect(gamePage.menu.settingsButton).toBeEnabled();
    await expect(gamePage.menu.creditsButton).toBeVisible();
    await expect(gamePage.menu.creditsButton).toBeEnabled();
  });

  test("should start game when Start Race is clicked", async ({ gamePage }) => {
    await gamePage.menu.startGame();

    // Menu should disappear
    const menuVisible = await gamePage.menu.isVisible();
    expect(menuVisible).toBe(false);

    // Target display should appear
    const gameStarted = await gamePage.gameplay.isGameStarted();
    expect(gameStarted).toBe(true);
  });

  test("should display correct category after starting game", async ({
    gamePage,
  }) => {
    // Select Counting Fun (level 2)
    await gamePage.menu.selectLevel(1);
    await gamePage.menu.startGame();

    // Wait for game to start
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });

    // Should display target from counting category
    const target = await gamePage.gameplay.getCurrentTarget();
    expect(target.name).toBeTruthy();
  });
});
