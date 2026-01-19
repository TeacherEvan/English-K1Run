import { test as base, expect, Locator, Page } from "@playwright/test";

/**
 * Custom test fixtures for Kindergarten Race Game
 */

// Extend base test with custom fixtures
export const test = base.extend<{
  gamePage: GamePage;
  audioMock: AudioMock;
}>({
  // Game page helper

  gamePage: async ({ page }, use) => {
    const gamePage = new GamePage(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(gamePage);
  },

  // Audio mock to prevent actual audio playback during tests

  audioMock: async ({ page }, use) => {
    const audioMock = new AudioMock(page);
    await audioMock.setup();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(audioMock);
  },
});

export { expect };

/**
 * Game Page helper class - provides common game interactions
 */
export class GamePage {
  constructor(public readonly page: Page) {}

  // Navigation
  async goto() {
    await this.page.emulateMedia({ reducedMotion: "reduce" });
    await this.page.goto("/?e2e=1");
    await this.page.waitForLoadState("domcontentloaded");

    // Disable background animations that cause instability in Firefox
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

  // Wait for game to be ready
  async waitForReady() {
    try {
      await this.page.locator('[data-testid="game-menu"]').waitFor({
        state: "visible",
        timeout: 20_000,
      });

      // Ensure the real GameMenu (not Suspense fallback) is mounted.
      await this.page.locator('[data-testid="level-select-button"]').waitFor({
        state: "visible",
        timeout: 20_000,
      });
    } catch (e) {
      // Check for error fallback
      const errorFallback = this.page.locator('[data-testid="error-fallback"]');
      if (await errorFallback.isVisible()) {
        const errorText = await errorFallback.innerText();
        throw new Error(`Game crashed with error: ${errorText}`);
      }
      throw e;
    }
  }

  // Wait for page load state with enhanced error handling
  async waitForPageLoad(timeout: number = 10000) {
    await this.page.waitForLoadState("domcontentloaded", { timeout });
    await this.page.waitForLoadState("networkidle", { timeout });
  }

  /**
   * Navigates to a URL with retry logic and exponential backoff.
   * Useful for handling flaky network conditions in e2e tests.
   *
   * @param url - The URL to navigate to
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds for backoff (default: 1000)
   * @param maxDelay - Maximum delay in milliseconds (default: 5000)
   * @throws {Error} The last navigation error if all retries fail
   */
  async navigateWithRetry(
    url: string,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 5000,
  ): Promise<void> {
    if (maxRetries < 1) {
      throw new Error("maxRetries must be at least 1");
    }

    for (
      let currentAttempt = 1;
      currentAttempt <= maxRetries;
      currentAttempt++
    ) {
      try {
        console.log(
          `Navigation attempt ${currentAttempt}/${maxRetries} to ${url}`,
        );
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        // Removed redundant waitForPageLoad() as goto already waits for domcontentloaded
        return;
      } catch (error) {
        console.warn(
          `Navigation attempt ${currentAttempt} failed:`,
          error instanceof Error ? error.message : String(error),
        );
        if (currentAttempt === maxRetries) {
          throw error;
        }
        const delay = this.calculateBackoffDelay(
          currentAttempt,
          baseDelay,
          maxDelay,
        );
        await this.page.waitForTimeout(delay);
      }
    }
  }

  /**
   * Calculates exponential backoff delay with jitter to prevent thundering herd.
   *
   * @param attempt - Current attempt number (1-based)
   * @param baseDelay - Base delay in milliseconds
   * @param maxDelay - Maximum delay cap in milliseconds
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
  ): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  // Trigger user interaction to enable audio/fullscreen
  async triggerUserInteraction() {
    await this.page.click("body");
  }

  // Get menu
  get menu() {
    return new GameMenuPage(this.page);
  }

  // Get gameplay area
  get gameplay() {
    return new GameplayPage(this.page);
  }
}

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
    // Homescreen actions
    this.startButton = page.locator('[data-testid="start-game-button"]');
    this.playAllLevelsButton = page.locator(
      '[data-testid="play-all-levels-button"]',
    );
    this.levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    this.settingsButton = page.locator('[data-testid="settings-button"]');
    this.creditsButton = page.locator('[data-testid="credits-button"]');
    this.exitButton = page.locator('[data-testid="exit-button"]');

    // Level selection view
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
    // If already in level select view, nothing to do
    if (await this.levelSelectContainer.isVisible().catch(() => false)) return;

    // Ensure button is ready for interaction
    await this.levelSelectButton.waitFor({ state: "visible", timeout: 10_000 });
    // Increased timeout for Firefox stability with background animations
    await this.levelSelectButton.click({ timeout: 30_000 });

    await this.levelSelectContainer.waitFor({
      state: "visible",
      timeout: 30_000,
    });
  }

  async selectLevel(levelIndex: number) {
    await this.openLevelSelect();
    const button = this.levelButtons.nth(levelIndex);
    await button.waitFor({ state: "visible", timeout: 10_000 });
    await button.click();
  }

  async getLevelCount() {
    await this.openLevelSelect();
    return this.levelButtons.count();
  }

  async getSelectedLevel() {
    const buttons = await this.levelButtons.all();
    for (let i = 0; i < buttons.length; i++) {
      const isSelected = await buttons[i].getAttribute("data-selected");
      if (isSelected === "true") return i;
    }
    return -1;
  }

  async startGame() {
    await this.openLevelSelect();
    await this.startGameButton.waitFor({ state: "visible", timeout: 10_000 });
    await this.startGameButton.click({ timeout: 30_000 });

    const loadingScreen = this.page.locator(
      '[data-testid="worm-loading-screen"]',
    );
    const targetDisplay = this.page.locator('[data-testid="target-display"]');
    const skipButton = this.page.locator('[data-testid="skip-loading-button"]');

    // Wait for either the loading screen or the game HUD to appear
    await Promise.race([
      loadingScreen
        .waitFor({ state: "visible", timeout: 20_000 })
        .catch(() => {}),
      targetDisplay
        .waitFor({ state: "visible", timeout: 20_000 })
        .catch(() => {}),
    ]);

    if (await loadingScreen.isVisible()) {
      try {
        await skipButton.waitFor({ state: "visible", timeout: 10_000 });
        await skipButton.click();
        await loadingScreen.waitFor({ state: "detached", timeout: 20_000 });
      } catch (error) {
        console.log(
          "Failed to skip loading screen, but it might have finished on its own",
        );
      }
    }

    // Ensure game HUD is ready before returning (critical for Firefox)
    // Increased timeout for Firefox's slower state transitions
    try {
      await targetDisplay.waitFor({ state: "visible", timeout: 25_000 });
    } catch (error) {
      // Allow caller (beforeEach) to handle the final wait with its own timeout
      console.log("Target display not immediately visible, caller will verify");
    }
  }

  async playAllLevels() {
    await this.playAllLevelsButton.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await this.playAllLevelsButton.click({ timeout: 30_000 });

    const loadingScreen = this.page.locator(
      '[data-testid="worm-loading-screen"]',
    );
    const targetDisplay = this.page.locator('[data-testid="target-display"]');
    const skipButton = this.page.locator('[data-testid="skip-loading-button"]');

    await Promise.race([
      loadingScreen
        .waitFor({ state: "visible", timeout: 20_000 })
        .catch(() => {}),
      targetDisplay.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {}),
    ]);

    if (await loadingScreen.isVisible()) {
      try {
        await skipButton.waitFor({ state: "visible", timeout: 10_000 });
        await skipButton.click();
        await loadingScreen.waitFor({ state: "detached", timeout: 20_000 });
      } catch (error) {
        console.log(
          "Failed to skip loading screen, but it might have finished on its own",
        );
      }
    }

    try {
      await targetDisplay.waitFor({ state: "visible", timeout: 25_000 });
    } catch (error) {
      console.log("Target display not immediately visible, caller will verify");
    }
  }
}

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
    const obj = this.fallingObjects.nth(index);
    await obj.click();
  }

  async tapObjectByEmoji(emoji: string) {
    const obj = this.fallingObjects.filter({ hasText: emoji }).first();
    await obj.click();
  }

  async tapWorm(index: number) {
    const worm = this.worms.nth(index);
    await worm.click();
  }

  async goBack() {
    await this.backButton.evaluate((button: HTMLButtonElement) =>
      button.click(),
    );
  }

  async waitForObjectsToSpawn(minCount: number = 1) {
    await this.page.waitForFunction(
      (min) =>
        document.querySelectorAll('[data-testid="falling-object"]').length >=
        min,
      minCount,
      { timeout: 20_000 },
    );
  }

  async getProgress(player: 1 | 2) {
    const area = player === 1 ? this.player1Area : this.player2Area;
    const progress = area.locator('[data-testid="progress-bar"]');
    const style = await progress.getAttribute("style");
    // Extract width percentage from style
    const match = style?.match(/width:\s*(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  }
}

/**
 * Audio Mock - Prevents actual audio playback during tests
 */
export class AudioMock {
  private playedSounds: string[] = [];

  constructor(private page: Page) {}

  async setup() {
    // Mock Web Audio API
    await this.page.addInitScript(() => {
      // Mock AudioContext - preserve original if needed for restoration
      void (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      );

      class MockAudioContext {
        state = "running";
        destination = { numberOfInputs: 0 };
        currentTime = 0;
        sampleRate = 44100;

        createGain() {
          return {
            gain: { value: 1, setValueAtTime: () => {} },
            connect: () => {},
            disconnect: () => {},
          };
        }

        createOscillator() {
          return {
            type: "sine",
            frequency: { value: 440, setValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {},
          };
        }

        createBufferSource() {
          return {
            buffer: null,
            connect: () => {},
            start: () => {},
            stop: () => {},
            loop: false,
            playbackRate: { value: 1 },
          };
        }

        decodeAudioData(_buffer: ArrayBuffer) {
          return Promise.resolve({
            duration: 1,
            numberOfChannels: 2,
            sampleRate: 44100,
            length: 44100,
            getChannelData: () => new Float32Array(44100),
          });
        }

        resume() {
          this.state = "running";
          return Promise.resolve();
        }

        suspend() {
          this.state = "suspended";
          return Promise.resolve();
        }

        close() {
          this.state = "closed";
          return Promise.resolve();
        }
      }

      (
        window as unknown as { AudioContext: typeof MockAudioContext }
      ).AudioContext = MockAudioContext;
      (
        window as unknown as { webkitAudioContext: typeof MockAudioContext }
      ).webkitAudioContext = MockAudioContext;

      // Mock HTMLAudioElement play - preserve original if needed for restoration
      void HTMLAudioElement.prototype.play;
      HTMLAudioElement.prototype.play = function () {
        return Promise.resolve();
      };

      // Mock SpeechSynthesis
      if ("speechSynthesis" in window) {
        window.speechSynthesis.speak = () => {};
        window.speechSynthesis.cancel = () => {};
      }
    });
  }

  getPlayedSounds() {
    return this.playedSounds;
  }
}

/**
 * Touch event helper for tablet/mobile testing
 */
export async function simulateTap(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error("Element not visible");

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Dispatch touch events
  const touches = [
    {
      identifier: 0,
      clientX: centerX,
      clientY: centerY,
      pageX: centerX,
      pageY: centerY,
    },
  ];

  await locator.dispatchEvent("touchstart", {
    touches,
    changedTouches: touches,
    targetTouches: touches,
  });

  await locator.dispatchEvent("touchend", {
    touches: [],
    changedTouches: touches,
    targetTouches: [],
  });
}

// TODO: [OPTIMIZATION] Consider integrating with Playwright's test-level retries for broader flaky test handling.
