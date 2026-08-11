import type { Locator, Page } from "@playwright/test";

import { scaleTimeout } from "./browser-helpers";

/**
 * Game Menu Page Object
 */
export class GameMenuPage {
  readonly container: Locator;
  readonly title: Locator;
  readonly startButton: Locator;
  readonly playAllLevelsButton: Locator;
  readonly levelSelectButton: Locator;
  readonly levelButtons: Locator;
  readonly settingsButton: Locator;
  readonly creditsButton: Locator;
  readonly exitButton: Locator;
  readonly levelSelectContainer: Locator;
  readonly startGameButton: Locator;
  readonly backToMenuButton: Locator;

  constructor(private page: Page) {
    this.container = page.locator('[data-testid="game-menu"]');
    this.title = page.locator('[data-testid="game-title"]');
    this.startButton = page.locator('[data-testid="start-game-button"]');
    this.playAllLevelsButton = page.locator(
      '[data-testid="play-all-levels-button"]',
    );
    this.levelSelectButton = page.locator('[data-testid="level-select-button"]');
    this.settingsButton = page.locator('[data-testid="settings-button"]');
    this.creditsButton = page.locator('[data-testid="credits-button"]');
    this.exitButton = page.locator('[data-testid="exit-button"]');
    this.levelSelectContainer = page.locator(
      '[data-testid="level-select-menu"]',
    );
    this.levelButtons = page.locator('[data-testid="level-button"]');
    this.startGameButton = page.locator('[data-testid="start-button"]');
    this.backToMenuButton = page.locator('[data-testid="back-to-menu-button"]');
  }

  async isVisible() {
    return this.container.isVisible();
  }

  async openLevelSelect() {
    if (await this.levelSelectContainer.isVisible().catch(() => false)) return;

    await this.levelSelectButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 10_000),
    });
    await this.levelSelectButton.click({
      timeout: scaleTimeout(this.page, 30_000),
    });

    await this.levelSelectContainer.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 30_000),
    });
  }

  async selectLevel(levelIndex: number) {
    await this.openLevelSelect();
    const button = this.levelButtons.nth(levelIndex);
    await button.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 10_000),
    });
    await button.click();
  }

  async getLevelCount() {
    await this.openLevelSelect();
    return this.levelButtons.count();
  }

  async getSelectedLevel() {
    const buttons = await this.levelButtons.all();
    for (let i = 0; i < buttons.length; i += 1) {
      const isSelected = await buttons[i].getAttribute("data-selected");
      if (isSelected === "true") return i;
    }
    return -1;
  }

  async startGame() {
    await this.openLevelSelect();
    await this.startGameButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 10_000),
    });
    await this.startGameButton.click({
      timeout: scaleTimeout(this.page, 30_000),
    });
    await this.waitForGameStart();
  }

  async playAllLevels() {
    await this.playAllLevelsButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 10_000),
    });
    await this.playAllLevelsButton.click({
      timeout: scaleTimeout(this.page, 30_000),
    });
    await this.waitForGameStart();
  }

  private async waitForGameStart() {
    const loadingScreen = this.page.locator('[data-testid="worm-loading-screen"]');
    const targetDisplay = this.page.locator('[data-testid="target-display"]');
    const skipButton = this.page.locator('[data-testid="skip-loading-button"]');

    await Promise.race([
      loadingScreen
        .waitFor({ state: "visible", timeout: scaleTimeout(this.page, 20_000) })
        .catch(() => {}),
      targetDisplay
        .waitFor({ state: "visible", timeout: scaleTimeout(this.page, 20_000) })
        .catch(() => {}),
    ]);

    if (await loadingScreen.isVisible()) {
      try {
        await skipButton.waitFor({
          state: "visible",
          timeout: scaleTimeout(this.page, 10_000),
        });
        await skipButton.click();
        await loadingScreen.waitFor({
          state: "detached",
          timeout: scaleTimeout(this.page, 20_000),
        });
      } catch {
        // Loading can complete before the skip button becomes actionable.
      }
    }

    await targetDisplay.waitFor({
      state: "visible",
      timeout: scaleTimeout(this.page, 25_000),
    });
  }
}
