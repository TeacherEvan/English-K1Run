import { expect, test } from "../fixtures/game.fixture";

test.describe("Settings language selection", () => {
  test("allows picking non-English languages from settings with pointer input", async ({
    gamePage,
    page,
  }) => {
    await gamePage.goto();
    await gamePage.waitForReady();

    await gamePage.menu.settingsButton.evaluate((element: HTMLElement) => {
      element.click();
    });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("tab").nth(2).click();
    await expect(
      dialog.getByRole("heading", { name: /Language/ }),
    ).toBeVisible();

    const displayLanguage = dialog.getByRole("combobox").nth(0);
    const gameplayLanguage = dialog.getByRole("combobox").nth(1);

    await displayLanguage.click();
    await page.getByRole("option", { name: /^Japanese/ }).click();
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();

    await gameplayLanguage.click();
    await page.getByRole("option", { name: /^French/ }).click();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const settings = JSON.parse(
            localStorage.getItem("k1-settings") ?? "{}",
          ) as {
            displayLanguage?: string;
            gameplayLanguage?: string;
          };

          return {
            displayLanguage: settings.displayLanguage,
            gameplayLanguage: settings.gameplayLanguage,
            persistedLanguage: localStorage.getItem("k1-language"),
          };
        }),
      )
      .toEqual({
        displayLanguage: "ja",
        gameplayLanguage: "fr",
        persistedLanguage: "ja",
      });

    await page.reload({ waitUntil: "domcontentloaded" });
    await gamePage.waitForReady();

    await gamePage.menu.settingsButton.evaluate((element: HTMLElement) => {
      element.click();
    });

    const reloadedDialog = page.getByRole("dialog", { name: /Settings|設定/ });
    await expect(reloadedDialog).toBeVisible();
    await reloadedDialog.getByRole("tab").nth(2).click();
    await expect(reloadedDialog.getByRole("combobox").nth(0)).toContainText(
      "Japanese",
    );
    await expect(reloadedDialog.getByRole("combobox").nth(1)).toContainText(
      "French",
    );
  });
});
