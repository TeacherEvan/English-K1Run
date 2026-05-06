import { expect, test } from "../fixtures/game.fixture";

test.describe("Visual Menu Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("captures the normalized home menu and settings dialog", async ({
    gamePage,
    page,
  }) => {
    await gamePage.goto("/?e2e=1");
    await gamePage.waitForReady();

    await expect(page.getByTestId("game-menu")).toBeVisible();
    await expect(page.getByTestId("game-menu")).toHaveScreenshot(
      "menu-home-shell.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );

    await gamePage.menu.settingsButton.click();
    await expect(page.getByTestId("settings-surface-panel")).toBeVisible();
    await expect(page.getByRole("dialog", { name: /settings/i })).toHaveScreenshot(
      "menu-settings-dialog.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});