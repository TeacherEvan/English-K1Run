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

  // Reporter configuration
  reporter: [["html", { open: "never" }], ["list"], ["allure-playwright"]],

  // Global test timeout
  timeout: 30_000,

  // Expect timeout
  expect: {
    timeout: 5_000,
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

  // Test projects for different browsers/devices
  projects: [
    // Desktop Chrome
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Desktop Firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        actionTimeout: 20_000,
      },
    },

    // Desktop Safari
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        actionTimeout: 20_000,
      },
    },

    // Desktop Edge
    {
      name: "edge",
      use: { ...devices["Desktop Edge"] },
    },

    // Tablet - iPad (primary target device for kindergarten)
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro 11"],
        hasTouch: true,
      },
    },

    // Mobile - for responsive testing
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        hasTouch: true,
      },
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
