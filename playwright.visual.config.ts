import { defineConfig, devices } from "@playwright/test";

/**
 * Dedicated Playwright configuration for visual regression testing
 * Optimized for deterministic screenshot comparison across different machines
 * 
 * Usage: 
 *   npm run test:e2e:visual    (run visual tests)
 *   npx playwright test --config=playwright.visual.config.ts
 */
export default defineConfig({
  // Test directory - only visual test files
  testDir: "./e2e/specs",

  // Only run visual test files
  testMatch: "**/visual*.spec.ts",

  // Run tests sequentially for visual consistency
  fullyParallel: false,

  // Fail on CI if accidentally left test.only
  forbidOnly: !!process.env.CI,

  // No retries for visual tests - they should be deterministic
  retries: 0,

  // Single worker for consistent results
  workers: 1,

  // Reporter configuration with diff reporting
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["playwright-test-progress"],
  ],

  // Global test timeout
  timeout: 60_000,

  // Expect timeout for screenshot assertions
  expect: {
    timeout: 10_000,
    // Screenshot comparison options
    toHaveScreenshot: {
      // Maximum number of pixels that can differ
      maxDiffPixels: 50,
      // Maximum ratio of pixels that can differ (1%)
      maxDiffPixelRatio: 0.01,
      // Similarity threshold (0-1)
      threshold: 0.2,
    },
  },

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: "http://localhost:5174",

    // Disable tracing for visual tests (performance)
    trace: "off",

    // Screenshot on failure only
    screenshot: "only-on-failure",

    // No video for visual tests
    video: "off",

    // Standard action timeout
    actionTimeout: 15_000,

    // Standard navigation timeout
    navigationTimeout: 30_000,

    // Critical for deterministic visual testing:
    // Disable animations to prevent visual variability
    animations: "disabled",

    // Consistent device scale factor
    deviceScaleFactor: 1,

    // Deterministic locale settings
    locale: "en-US",

    // Consistent timezone
    timezoneId: "UTC",

    // Prevent dark mode variations
    colorScheme: "light",

    // Consistent reduced motion
    reducedMotion: "reduce",

    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
  },

  // Visual testing browser project - only this project runs in visual tests
  projects: [
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
        // Standard desktop viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
        // Explicit settings to ensure consistency
        deviceScaleFactor: 1,
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "light",
        reducedMotion: "reduce",
        animations: "disabled",
        hasTouch: false,
        isMobile: false,
      },
      // Visual tests have their own timeout
      timeout: 60_000,
    },
  ],

  // Centralized baseline storage
  snapshotsDir: ".snapshots",

  // Update mode for CI - only create missing snapshots
  // Use 'all' in development to update all baselines
  updateSnapshots: process.env.CI ? "missing" : "missing",

  // Full-page screenshots by default for visual regression
  screenshot: "only-on-failure",

  // Output folder for visual test artifacts
  outputDir: "e2e/test-results/visual",

  // WebServer configuration
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
