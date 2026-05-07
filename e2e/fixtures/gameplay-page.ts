import type { Locator, Page } from "@playwright/test";

import { clickMovingElement, scaleTimeout } from "./browser-helpers";

/**
 * Gameplay Page Object
 */
export class GameplayPage {
  readonly gameArea: Locator;
  readonly backButton: Locator;
  readonly targetDisplay: Locator;
  readonly targetEmoji: Locator;
  readonly targetName: Locator;
  readonly player1Area: Locator;
  readonly player2Area: Locator;
  readonly fallingObjects: Locator;
  readonly worms: Locator;
  readonly progressBars: Locator;
  readonly fireworks: Locator;
  readonly stopwatch: Locator;

  constructor(private page: Page) {
    this.gameArea = page.locator('[data-testid="game-area"]');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.targetDisplay = page.locator('[data-testid="target-display"]');
    this.targetEmoji = page.locator('[data-testid="target-emoji"]');
    this.targetName = page.locator('[data-testid="target-name"]');
    this.player1Area = page.locator('[data-testid="player-area-1"]');
    this.player2Area = page.locator('[data-testid="player-area-2"]');
    this.fallingObjects = page.locator('[data-testid="falling-object"]');
    this.worms = page.locator('[data-testid="worm"]');
    this.progressBars = page.locator('[data-testid="progress-bar"]');
    this.fireworks = page.locator('[data-testid="fireworks"]');
    this.stopwatch = page.locator('[data-testid="continuous-mode-stopwatch"]');
  }

  async isGameStarted() {
    return this.targetDisplay.isVisible();
  }

  async isWinnerDisplayed() {
    return this.fireworks.isVisible();
  }

  async getCurrentTarget() {
    const emoji = await this.targetEmoji.textContent();
    const name = await this.targetName.textContent();
    return { emoji, name };
  }

  async getObjectCount() {
    return this.fallingObjects.count();
  }

  async getWormCount() {
    return this.worms.count();
  }

  async tapObject(index: number) {
    await clickMovingElement(this.page, this.fallingObjects.nth(index));
  }

  async tapObjectByEmoji(emoji: string) {
    const object = this.fallingObjects.filter({ hasText: emoji }).first();
    await clickMovingElement(this.page, object);
  }

  async tapWorm(index: number) {
    await clickMovingElement(this.page, this.worms.nth(index));
  }

  async goBack() {
    await this.backButton.click({
      force: true,
      timeout: scaleTimeout(this.page, 30_000),
    });
  }

  async waitForObjectsToSpawn(minCount: number = 1) {
    await this.page.waitForFunction(
      (min) =>
        document.querySelectorAll('[data-testid="falling-object"]').length >=
        min,
      minCount,
      { timeout: scaleTimeout(this.page, 20_000) },
    );
  }

  async getProgress(player: 1 | 2) {
    const area = player === 1 ? this.player1Area : this.player2Area;
    const progress = area.locator('[data-testid="progress-bar"]');
    const style = await progress.getAttribute("style");
    const match = style?.match(/width:\s*(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  }
}
