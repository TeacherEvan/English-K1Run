import { expect, test } from "../fixtures/game.fixture";

const THAI_OPTION_NAME = /^Thai/;
const CONTROLS_TAB_NAME = /Controls|การควบคุม/;
const DISPLAY_LANGUAGE_LABEL = /Menu and buttons language|ภาษาเมนูและปุ่ม/;
const GAMEPLAY_LANGUAGE_LABEL =
  /Gameplay text and voice language|ภาษาข้อความเกมและเสียง/;
const SETTINGS_DIALOG_NAME = /Settings|ตั้งค่า/;

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
    await expect(gamePage.menu.title).toContainText("English K1 Run");
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
    await gamePage.menu.selectLevel(1);

    const secondButton = gamePage.menu.levelButtons.nth(1);
    await expect(secondButton).toHaveAttribute("data-selected", "true");

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

    const menuVisible = await gamePage.menu.isVisible();
    expect(menuVisible).toBe(false);

    const gameStarted = await gamePage.gameplay.isGameStarted();
    expect(gameStarted).toBe(true);
  });

  test("should start continuous mode when Play All Levels is clicked", async ({
    gamePage,
  }) => {
    await gamePage.menu.playAllLevels();

    const menuVisible = await gamePage.menu.isVisible();
    expect(menuVisible).toBe(false);

    const gameStarted = await gamePage.gameplay.isGameStarted();
    expect(gameStarted).toBe(true);
    await expect(gamePage.gameplay.stopwatch).toBeVisible();
  });

  test("should display correct category after starting game", async ({
    gamePage,
  }) => {
    await gamePage.menu.selectLevel(1);
    await gamePage.menu.startGame();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });

    const target = await gamePage.gameplay.getCurrentTarget();
    expect(target.name).toBeTruthy();
  });

  test("should persist Thai display and gameplay language settings after reload", async ({
    gamePage,
    page,
  }) => {
    const openSettingsDialog = async () => {
      await gamePage.menu.settingsButton.evaluate((element: HTMLElement) => {
        element.click();
      });

      const dialog = page.getByRole("dialog", { name: SETTINGS_DIALOG_NAME });
      await expect(dialog).toBeVisible();
      return dialog;
    };

    const openControlsTab = async () => {
      const controlsTab = page
        .getByRole("dialog", { name: SETTINGS_DIALOG_NAME })
        .getByRole("tab", { name: CONTROLS_TAB_NAME });

      await controlsTab.focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("heading", { name: /Language|ภาษา/ })
        .waitFor({ state: "visible" });
    };

    const chooseThaiForLabel = async (labelPattern: RegExp) => {
      const trigger = page.getByRole("combobox", { name: labelPattern });

      await trigger.evaluate((element: HTMLElement) => {
        element.click();
      });
      await page
        .getByRole("option", { name: THAI_OPTION_NAME })
        .evaluate((element: HTMLElement) => {
          element.click();
        });
    };

    await page.evaluate(() => {
      localStorage.removeItem("k1-settings");
      localStorage.removeItem("k1-language");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await gamePage.waitForReady();

    await expect(gamePage.menu.startButton).toContainText("Start Game");

    const settingsDialog = await openSettingsDialog();
    await openControlsTab();
    await chooseThaiForLabel(DISPLAY_LANGUAGE_LABEL);

    await expect(
      settingsDialog.getByRole("heading", { name: "ตั้งค่า" }),
    ).toBeVisible();
    await settingsDialog
      .getByRole("button", { name: /Close|ปิด/ })
      .last()
      .evaluate((element: HTMLElement) => {
        element.click();
      });

    await expect(gamePage.menu.startButton).toContainText("Start Game");
    await expect(gamePage.menu.playAllLevelsButton).toContainText(
      "Play All Levels",
    );
    await expect(gamePage.menu.settingsButton).toContainText("Settings");

    await openSettingsDialog();
    await openControlsTab();
    await chooseThaiForLabel(GAMEPLAY_LANGUAGE_LABEL);

    const storedSettings = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("k1-settings") ?? "{}"),
    );
    expect(storedSettings.displayLanguage).toBe("th");
    expect(storedSettings.gameplayLanguage).toBe("th");

    const storedDisplayLanguage = await page.evaluate(() =>
      localStorage.getItem("k1-language"),
    );
    expect(storedDisplayLanguage).toBe("th");

    await page.reload({ waitUntil: "domcontentloaded" });
    await gamePage.waitForReady();

    await expect(
      gamePage.menu.startButton.getByText("Start Game", { exact: true }),
    ).toBeVisible();
    await expect(
      gamePage.menu.startButton.getByText("เริ่มเกม", { exact: true }),
    ).toBeVisible();

    const reloadedSettingsDialog = await openSettingsDialog();
    await openControlsTab();

    const displayLanguageTrigger = reloadedSettingsDialog.getByRole(
      "combobox",
      { name: DISPLAY_LANGUAGE_LABEL },
    );
    const gameplayLanguageTrigger = reloadedSettingsDialog.getByRole(
      "combobox",
      { name: GAMEPLAY_LANGUAGE_LABEL },
    );

    await expect(displayLanguageTrigger).toContainText("Thai");
    await expect(gameplayLanguageTrigger).toContainText("Thai");
  });
});
