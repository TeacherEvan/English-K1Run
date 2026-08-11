import type { Locator, Page } from "@playwright/test";

const FIREFOX_TIMEOUT_MULTIPLIER = 1.5;

export const getTimeoutMultiplier = (page: Page): number =>
  page.context().browser()?.browserType().name() === "firefox"
    ? FIREFOX_TIMEOUT_MULTIPLIER
    : 1;

export const scaleTimeout = (page: Page, timeout: number): number =>
  Math.round(timeout * getTimeoutMultiplier(page));

export const waitForBrowserDelay = async (
  page: Page,
  delayMs: number,
): Promise<void> => {
  await page.waitForFunction(
    (requestedDelayMs) =>
      new Promise<boolean>((resolve) => {
        window.setTimeout(() => resolve(true), requestedDelayMs);
      }),
    delayMs,
    { timeout: scaleTimeout(page, delayMs + 1_000) },
  );
};

export const waitForAnimationFrames = async (
  page: Page,
  frameCount = 2,
): Promise<void> => {
  await page.waitForFunction(
    (requestedFrameCount) =>
      new Promise<boolean>((resolve) => {
        let remaining = requestedFrameCount;
        const tick = () => {
          remaining -= 1;
          if (remaining <= 0) {
            resolve(true);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    frameCount,
    { timeout: scaleTimeout(page, 1_000) },
  );
};

export const clickMovingElement = async (
  page: Page,
  locator: Locator,
  options: {
    attempts?: number;
    timeout?: number;
  } = {},
): Promise<void> => {
  const attempts = options.attempts ?? 4;
  const timeout = scaleTimeout(page, options.timeout ?? 3_000);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await locator.waitFor({ state: "visible", timeout });

    try {
      await locator.click({ force: true, timeout });
      return;
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      await waitForAnimationFrames(page);
    }
  }
};
