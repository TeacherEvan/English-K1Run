import type { Page } from "@playwright/test";

import { scaleTimeout, waitForBrowserDelay } from "../fixtures/game.fixture";

export async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries: number = 3,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Screenshots] Navigation attempt ${attempt}/${maxRetries} to ${url}`,
      );
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: scaleTimeout(page, 30_000),
      });
      console.log(`[Screenshots] Navigation successful on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[Screenshots] Navigation attempt ${attempt} failed:`,
        lastError.message,
      );

      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`[Screenshots] Retrying in ${delay}ms...`);
        await waitForBrowserDelay(page, delay);
      }
    }
  }

  throw lastError;
}
