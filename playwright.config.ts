import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const playwrightHost = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "4173";
const playwrightBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://${playwrightHost}:${playwrightPort}`;
const playwrightProjects = new Set(
  (process.env.PLAYWRIGHT_PROJECTS ?? "")
    .split(",")
    .map((project) => project.trim())
    .filter(Boolean),
);
const includeWebkitProjects =
  isCI || process.env.PLAYWRIGHT_ENABLE_WEBKIT === "1";
const localFilteredMatrix = !isCI && playwrightProjects.size > 0;
const configuredWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : undefined;
const configuredRetries = process.env.PLAYWRIGHT_RETRIES
  ? Number(process.env.PLAYWRIGHT_RETRIES)
  : undefined;
const localRetryProjects = new Set(["firefox", "webkit", "tablet", "mobile"]);
const shouldUseLocalRetries =
  !isCI &&
  [...playwrightProjects].some((project) => localRetryProjects.has(project));
const shouldIncludeProject = (name: string) => {
  if (playwrightProjects.size > 0 && !playwrightProjects.has(name))
    return false;
  if (!includeWebkitProjects && (name === "webkit" || name === "tablet")) {
    return false;
  }
  return true;
};

const projects = [
  {
    name: "visual",
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1280, height: 720 },
      animations: "disabled" as const,
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "UTC",
      colorScheme: "light" as const,
      reducedMotion: "reduce" as const,
    },
    timeout: 60_000,
  },
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      actionTimeout: 25_000,
      navigationTimeout: 45_000,
    },
    timeout: 60_000,
  },
  {
    name: "firefox",
    use: {
      ...devices["Desktop Firefox"],
      actionTimeout: 25_000,
      navigationTimeout: 45_000,
    },
    timeout: 60_000,
  },
  {
    name: "webkit",
    use: {
      ...devices["Desktop Safari"],
      actionTimeout: 25_000,
      navigationTimeout: 45_000,
    },
    timeout: 60_000,
  },
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
].filter((project) => shouldIncludeProject(project.name));

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
  forbidOnly: isCI,

  // Retry failed tests on CI
  retries: configuredRetries ?? (isCI ? 2 : shouldUseLocalRetries ? 1 : 0),

  // Workers - limit parallelism on CI
  workers:
    configuredWorkers ??
    (isCI
      ? 1
      : localFilteredMatrix
        ? 1
        : process.platform === "win32"
          ? 2
          : undefined),

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
    baseURL: playwrightBaseURL,

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
  projects,

  // Development server configuration
  webServer: {
    command:
      process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
      `npm run dev -- --host ${playwrightHost} --port ${playwrightPort} --strictPort`,
    url: playwrightBaseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },

  // Output folder for test artifacts
  outputDir: "e2e/test-results",
});
