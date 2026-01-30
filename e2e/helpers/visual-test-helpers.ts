import type { Page, Locator } from "@playwright/test";

/**
 * Visual testing helpers for Playwright
 * Provides utilities for deterministic visual regression testing
 */

/**
 * Configures a page for deterministic visual rendering
 * Disables animations, sets consistent locale/timezone, and optimizes for screenshots
 */
export async function setupVisualTest(page: Page): Promise<void> {
  // Set deterministic locale for consistent text rendering
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "language", { value: "en-US" });
    Object.defineProperty(navigator, "languages", { value: ["en-US"] });
    Object.defineProperty(navigator, "locale", { value: "en-US" });
  });

  // Disable CSS animations and transitions for consistent renders
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.id = "visual-test-disable-animations";
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Set deterministic timezone
  await page.context().addInitScript(() => {
    Object.defineProperty(Intl, "DateTimeFormat", {
      value: new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }),
    });
  });

  // Wait for any pending animations to settle
  await waitForStableState(page);
}

/**
 * Waits for the page to reach a stable state with no animations
 * Useful before capturing screenshots to ensure consistent results
 */
export async function waitForStableState(page: Page): Promise<void> {
  // Wait for the page to be fully loaded
  await page.waitForLoadState("domcontentloaded");

  // Wait for network idle to ensure fonts and images are loaded
  await page.waitForLoadState("networkidle");

  // Wait a bit more for any delayed JavaScript operations
  await page.waitForTimeout(500);

  // Check that no CSS animations are running
  const animationCheck = await page.evaluate(() => {
    const animatedElements = document.querySelectorAll(
      "*, *::before, *::after"
    );
    let hasAnimations = false;
    animatedElements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      if (
        styles.animationName !== "none" ||
        styles.transitionProperty !== "none"
      ) {
        hasAnimations = true;
      }
    });
    return hasAnimations;
  });

  if (animationCheck) {
    // Additional wait if animations are detected
    await page.waitForTimeout(300);
  }
}

/**
 * Captures a screenshot of a specific component/element
 * @param page - Playwright page instance
 * @param locator - Element locator to screenshot
 * @param name - Name for the screenshot file (without extension)
 */
export async function captureComponentScreenshot(
  page: Page,
  locator: Locator,
  name: string
): Promise<void> {
  await locator.waitFor({ state: "visible" });
  await locator.screenshot({
    path: `.snapshots/${name}-component.png`,
    animations: "disabled",
  });
}

/**
 * Captures a full-page screenshot with deterministic settings
 * @param page - Playwright page instance
 * @param name - Name for the screenshot file (without extension)
 * @param options - Optional screenshot configuration
 */
export async function captureFullPageScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    animations?: "disabled" | "allow";
    clip?: { x: number; y: number; width: number; height: number };
  }
): Promise<void> {
  await page.screenshot({
    path: `.snapshots/${name}-fullpage.png`,
    fullPage: options?.fullPage ?? true,
    animations: options?.animations ?? "disabled",
    clip: options?.clip,
  });
}

/**
 * Takes a screenshot and compares it against a baseline using Playwright's built-in comparison
 * Throws an error if the screenshot doesn't match within the configured thresholds
 * @param page - Playwright page instance
 * @param locator - Optional element locator for component screenshots
 * @param name - Snapshot name for comparison
 * @param options - Optional screenshot and comparison options
 */
export async function assertScreenshot(
  page: Page,
  name: string,
  options?: {
    locator?: Locator;
    fullPage?: boolean;
    animations?: "disabled" | "allow";
    threshold?: number;
    maxDiffPixels?: number;
    maxDiffPixelRatio?: number;
  }
): Promise<void> {
  const target = options?.locator ?? page;

  const screenshotOptions = {
    animations: options?.animations ?? "disabled" as const,
    fullPage: options?.fullPage ?? true,
    threshold: options?.threshold,
  };

  if (options?.locator) {
    await expect(target).toHaveScreenshot(`${name}-component.png`, {
      ...screenshotOptions,
      maxDiffPixels: options?.maxDiffPixels,
      maxDiffPixelRatio: options?.maxDiffPixelRatio,
    });
  } else {
    await expect(target).toHaveScreenshot(`${name}-fullpage.png`, {
      ...screenshotOptions,
      maxDiffPixels: options?.maxDiffPixels,
      maxDiffPixelRatio: options?.maxDiffPixelRatio,
    });
  }
}

/**
 * Compares a specific region of the page against a baseline
 * Useful for testing individual components in isolation
 * @param page - Playwright page instance
 * @param region - Region to capture (x, y, width, height as percentages or pixels)
 * @param name - Snapshot name for comparison
 */
export async function assertRegionScreenshot(
  page: Page,
  region: { x: number; y: number; width: number; height: number },
  name: string
): Promise<void> {
  await page.screenshot({
    path: `.snapshots/${name}-region.png`,
    clip: region,
    animations: "disabled",
  });

  await expect(page).toHaveScreenshot(`${name}-region.png`, {
    animations: "disabled",
  });
}

/**
 * Helper to get viewport dimensions as a percentage-based size
 * Useful for responsive visual testing
 * @param page - Playwright page instance
 */
export function getViewportInfo(page: Page): {
  width: number;
  height: number;
  scaleFactor: number;
  pixelRatio: number;
} {
  const viewport = page.viewportSize();
  return {
    width: viewport?.width ?? 1280,
    height: viewport?.height ?? 720,
    scaleFactor: 1,
    pixelRatio: 1,
  };
}

/**
 * Creates a masking region for hiding dynamic content in screenshots
 * Useful for hiding timestamps, counters, or other changing elements
 * @param regions - Array of regions to mask (x, y, width, height in pixels)
 * @returns CSS styles for the mask overlay
 */
export function createMaskStyles(
  regions: Array<{ x: number; y: number; width: number; height: number }>
): string {
  return regions
    .map(
      (r) =>
        `.visual-mask-region-${r.x}-${r.y} { position: fixed; left: ${r.x}px; top: ${r.y}px; width: ${r.width}px; height: ${r.height}px; background: #fff; }`
    )
    .join("\n");
}

/**
 * Inject mask elements into the page to hide dynamic content
 * @param page - Playwright page instance
 * @param regions - Array of regions to mask
 */
export async function injectMaskRegions(
  page: Page,
  regions: Array<{ x: number; y: number; width: number; height: number }>
): Promise<void> {
  const styles = createMaskStyles(regions);
  await page.addInitScript((css) => {
    const style = document.createElement("style");
    style.id = "visual-test-mask-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }, styles);
}
