import type { Page } from "@playwright/test";

import {
  scaleTimeout,
  waitForAnimationFrames,
  waitForBrowserDelay,
} from "./browser-helpers";
import { GameMenuPage } from "./game-menu-page";
import { GameplayPage } from "./gameplay-page";

/**
 * Game Page helper class - provides common game interactions
 */
export class GamePage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.emulateMedia({ reducedMotion: "reduce" });
    await this.page.goto("/?e2e=1", {
      waitUntil: "domcontentloaded",
      timeout: scaleTimeout(this.page, 60_000),
    });

    await this.page.addStyleTag({
      content: `
        .app-bg-animated {
          animation: none !important;
        }
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      `,
    });
  }

  async waitForReady() {
    try {
      await this.page.locator('[data-testid="game-menu"]').waitFor({
        state: "visible",
        timeout: scaleTimeout(this.page, 30_000),
      });
      await this.page.locator('[data-testid="level-select-button"]').waitFor({
        state: "visible",
        timeout: scaleTimeout(this.page, 30_000),
      });
    } catch (error) {
      const errorFallback = this.page.locator('[data-testid="error-fallback"]');
      if (await errorFallback.isVisible()) {
        const errorText = await errorFallback.innerText();
        throw new Error(`Game crashed with error: ${errorText}`);
      }
      throw error;
    }
  }

  async waitForPageLoad(timeout = 10_000) {
    const scaledTimeout = scaleTimeout(this.page, timeout);
    await this.page.waitForLoadState("domcontentloaded", {
      timeout: scaledTimeout,
    });
    await this.page.waitForLoadState("networkidle", {
      timeout: scaledTimeout,
    });
  }

  async navigateWithRetry(
    url: string,
    maxRetries = 3,
    baseDelay = 1_000,
    maxDelay = 5_000,
  ): Promise<void> {
    if (maxRetries < 1) {
      throw new Error("maxRetries must be at least 1");
    }

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: scaleTimeout(this.page, 45_000),
        });
        await waitForAnimationFrames(this.page, 2);
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        await waitForBrowserDelay(this.page, delay);
      }
    }
  }

  async triggerUserInteraction() {
    await this.page.click("body", { force: true });
  }

  get menu() {
    return new GameMenuPage(this.page);
  }

  get gameplay() {
    return new GameplayPage(this.page);
  }
}
