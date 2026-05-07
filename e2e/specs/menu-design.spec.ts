import { expect, test } from "../fixtures/game.fixture";

test.describe("Menu design alignment", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
  });

  test("shows the classroom brand pill and best-time card", async ({
    page,
  }) => {
    await expect(page.getByTestId("menu-brand-pill")).toContainText(
      "Teacher launch",
    );
    await expect(page.getByTestId("menu-best-time-card")).toBeVisible();
  });

  test("keeps the main action stack fully in the mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("menu-action-stack")).toBeVisible();
    await expect(page.getByTestId("settings-button")).toBeVisible();

    const actionStack = await page.getByTestId("menu-action-stack").boundingBox();
    expect(actionStack).not.toBeNull();
    expect(actionStack!.x).toBeGreaterThanOrEqual(0);
    expect(actionStack!.x + actionStack!.width).toBeLessThanOrEqual(390);

    const settingsButton = await page.getByTestId("settings-button").boundingBox();
    expect(settingsButton).not.toBeNull();
    expect(settingsButton!.top ?? settingsButton!.y).toBeGreaterThanOrEqual(0);
    expect(settingsButton!.y + settingsButton!.height).toBeLessThanOrEqual(844);
  });

  test("opens branded level-select and settings surfaces", async ({
    page,
    gamePage,
  }) => {
    await gamePage.menu.openLevelSelect();
    await expect(page.getByTestId("level-select-heading-chip")).toBeVisible();

    await page.getByTestId("back-to-menu-button").click();
    await gamePage.menu.settingsButton.click();
    await expect(page.getByTestId("settings-surface-panel")).toBeVisible();
  });
});
