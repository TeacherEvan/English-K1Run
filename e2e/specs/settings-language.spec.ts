import { expect, test } from "../fixtures/game.fixture";

test.describe("Settings language selection", () => {
  test("shows all supported languages with English and native labels", async ({
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
    await displayLanguage.click();

    const expectedOptions = [
      /English\s+English/,
      /French\s+Français/,
      /Japanese\s+日本語/,
      /Thai\s+ไทย/,
      /Mandarin\s+中文\(简体\)/,
      /Cantonese\s+粵語/,
    ];

    for (const optionName of expectedOptions) {
      await expect(page.getByRole("option", { name: optionName })).toBeVisible();
    }
  });

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

  test("supports keyboard-only display language selection from the controls tab", async ({
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

    const controlsTab = dialog.getByRole("tab", { name: /Controls/ });
    await expect(controlsTab).toHaveAttribute("aria-selected", "true");
    await expect(
      dialog.getByRole("heading", { name: /Language/ }),
    ).toBeVisible();

    const displayLanguage = dialog.getByRole("combobox").nth(0);
    const unfocusedStyles = await displayLanguage.evaluate((element) => {
      const styles = window.getComputedStyle(element);

      return {
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        outlineColor: styles.outlineColor,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      };
    });

    await controlsTab.focus();
    await expect(controlsTab).toBeFocused();
    for (let step = 0; step < 5; step += 1) {
      if (await displayLanguage.evaluate((element) => element === document.activeElement)) {
        break;
      }

      await page.keyboard.press("Tab");
    }
    await expect(displayLanguage).toBeFocused();

    await expect
      .poll(() =>
        displayLanguage.evaluate((element, previousStyles) => {
          const styles = window.getComputedStyle(element);

          return {
            hasVisibleFocusChange:
              styles.borderColor !== previousStyles.borderColor ||
              styles.boxShadow !== previousStyles.boxShadow ||
              styles.outlineColor !== previousStyles.outlineColor ||
              styles.outlineStyle !== previousStyles.outlineStyle ||
              styles.outlineWidth !== previousStyles.outlineWidth,
            isFocusVisible: element.matches(":focus-visible"),
            styles: {
              borderColor: styles.borderColor,
              boxShadow: styles.boxShadow,
              outlineColor: styles.outlineColor,
              outlineStyle: styles.outlineStyle,
              outlineWidth: styles.outlineWidth,
            },
          };
        }, unfocusedStyles),
      )
      .toEqual(
        expect.objectContaining({
          hasVisibleFocusChange: true,
          isFocusVisible: true,
        }),
      );

    await page.keyboard.press("Enter");
    await expect(page.getByRole("option", { name: /^English/ })).toBeVisible();

    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.press("ArrowDown");
    }

    await page.keyboard.press("Enter");

    await expect(displayLanguage).not.toContainText("English");

    await expect
      .poll(() =>
        page.evaluate(() => {
          const settings = JSON.parse(
            localStorage.getItem("k1-settings") ?? "{}",
          ) as {
            displayLanguage?: string;
          };

          return {
            displayLanguage: settings.displayLanguage,
            persistedLanguage: localStorage.getItem("k1-language"),
          };
        }),
      )
      .toEqual(
        expect.objectContaining({
          displayLanguage: expect.not.stringMatching(/^en$/),
          persistedLanguage: expect.not.stringMatching(/^en$/),
        }),
      );
  });

  test("falls back to English when invalid language settings are stored", async ({
    gamePage,
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await gamePage.goto();
    await page.evaluate(() => {
      localStorage.setItem(
        "k1-settings",
        JSON.stringify({
          displayLanguage: "invalid",
          gameplayLanguage: "invalid",
        }),
      );
      localStorage.setItem("k1-language", "invalid");
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await gamePage.waitForReady();

    await expect(gamePage.menu.startButton).toContainText("Start Game");

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
        displayLanguage: "en",
        gameplayLanguage: "en",
        persistedLanguage: "en",
      });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
