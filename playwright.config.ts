import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Kindergarten Race Game
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Test file pattern
  testMatch: "**/*.spec.ts",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Workers - limit parallelism on CI
  workers: process.env.CI ? 1 : process.platform === "win32" ? 2 : undefined,

  // Reporter configuration with visual diff support
  reporter: [["html", { open: "never" }], ["list"], ["allure-playwright"]],

  // Global test timeout
  timeout: 60_000,

  // Expect timeout and screenshot comparison options
  expect: {
    timeout: 5_000,
    // Screenshot comparison options for visual regression testing
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
    baseURL: "http://localhost:5173",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "on-first-retry",

    // Action timeout
    actionTimeout: 15_000,

    // Navigation timeout
    navigationTimeout: 30_000,
  },

  // Centralized baseline storage for all test projects
  snapshotsDir: ".snapshots",

  // Test projects for different browsers/devices
  projects: [
    // Visual regression testing profile
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
        // Standard desktop viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
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
      },
      timeout: 60_000,
    },

    // Desktop Chrome
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        actionTimeout: 25_000,
        navigationTimeout: 45_000,
      },
      timeout: 60_000,
    },

    // Desktop Firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        actionTimeout: 25_000,
        navigationTimeout: 45_000,
      },
      timeout: 60_000,
    },

    // Desktop Safari
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        actionTimeout: 25_000,
        navigationTimeout: 45_000,
      },
      timeout: 60_000,
    },

    // Tablet - iPad (primary target device for kindergarten)
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro 11"],
        hasTouch: true,
        actionTimeout: 25_000,
        navigationTimeout: 45_000,
      },
      timeout: 60_000,
    },

    // Mobile - for responsive testing
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        hasTouch: true,
        actionTimeout: 25_000,
        navigationTimeout: 45_000,
      },
      timeout: 60_000,
    },
  ],

  // Development server configuration
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  // Output folder for test artifacts
  outputDir: "e2e/test-results",
});
