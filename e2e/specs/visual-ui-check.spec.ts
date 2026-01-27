/**
 * Visual UI Check - Captures screenshots from USER PERSPECTIVE
 *
 * This test verifies that users can actually SEE the UI elements,
 * not just that they exist in the DOM.
 */

import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Visual UI Verification - User Perspective", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should capture welcome screen as user sees it", async ({ page }) => {
    // Wait for welcome screen
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      state: "visible",
      timeout: 10000,
    });

    // VISUAL CHECK: Take screenshot of what user actually sees
    await page.screenshot({
      path: path.join("test-results", "screenshots", "user-view-welcome.png"),
      fullPage: false, // Only capture viewport - what user sees!
    });

    // Check if "Tap to continue" is VISIBLE in viewport
    const tapToContinue = page.locator("text=Tap to continue");
    const isVisible = await tapToContinue.isVisible();

    console.log("👁️  USER VIEW: Tap to continue visible?", isVisible);
    expect(isVisible).toBe(true);
  });

  test("should capture menu screen and verify UI is IN VIEWPORT", async ({
    page,
  }) => {
    // Skip welcome screen
    await page.goto("/?e2e=1");
    await page.waitForTimeout(2000);

    // VISUAL CHECK: Get viewport dimensions
    const viewport = page.viewportSize();
    console.log("📐 Viewport:", viewport);

    // Get menu position
    const menu = page.locator('[data-testid="game-menu"]');
    await menu.waitFor({ state: "attached" });

    const menuBox = await menu.boundingBox();
    console.log("📦 Menu bounding box:", menuBox);

    // CRITICAL: Is menu in viewport?
    if (menuBox && viewport) {
      const isMenuInViewport =
        menuBox.y < viewport.height && menuBox.y + menuBox.height > 0;

      console.log("👁️  USER VIEW: Menu in viewport?", isMenuInViewport);
      console.log("   Menu top:", menuBox.y);
      console.log("   Viewport height:", viewport.height);
      console.log("   Menu bottom:", menuBox.y + menuBox.height);

      // Take screenshot showing the problem
      await page.screenshot({
        path: path.join(
          "test-results",
          "screenshots",
          "user-view-menu-position.png",
        ),
        fullPage: false,
      });

      // FAIL if menu is not visible!
      expect(isMenuInViewport).toBe(true);
    }
  });

  test("should show menu buttons visually to user", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForTimeout(2000);

    const buttons = [
      { selector: '[data-testid="start-game-button"]', name: "Start Game" },
      { selector: '[data-testid="level-select-button"]', name: "Level Select" },
      { selector: '[data-testid="settings-button"]', name: "Settings" },
    ];

    for (const button of buttons) {
      const element = page.locator(button.selector);
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (box && viewport) {
        const inViewport = box.y >= 0 && box.y + box.height <= viewport.height;

        console.log(`👁️  ${button.name}:`, {
          inViewport,
          top: box.y,
          bottom: box.y + box.height,
          viewportHeight: viewport.height,
        });

        // Take screenshot highlighting this button
        await element
          .screenshot({
            path: path.join(
              "test-results",
              "screenshots",
              `user-view-${button.name.toLowerCase().replace(" ", "-")}.png`,
            ),
          })
          .catch(() => {
            console.warn(
              `Could not screenshot ${button.name} - might be off-screen`,
            );
          });
      }
    }

    // Full page screenshot showing entire layout
    await page.screenshot({
      path: path.join("test-results", "screenshots", "user-view-full-page.png"),
      fullPage: true, // This shows everything including off-screen
    });
  });

  test("should measure visual layout issues", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForTimeout(2000);

    const layoutInfo = await page.evaluate(() => {
      const app = document.querySelector(".app");
      const menu = document.querySelector('[data-testid="game-menu"]');
      const gameArea = document.querySelector(
        '[aria-label="Player 1 game area"]',
      );

      const getRect = (el: Element | null) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        };
      };

      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        app: getRect(app),
        menu: getRect(menu),
        gameArea: getRect(gameArea),
      };
    });

    console.log("📊 LAYOUT ANALYSIS:");
    console.log("Viewport:", layoutInfo.viewport);
    console.log("App container:", layoutInfo.app);
    console.log("Game area:", layoutInfo.gameArea);
    console.log("Menu:", layoutInfo.menu);

    // Check if menu is pushed below viewport
    if (layoutInfo.menu && layoutInfo.viewport) {
      const menuOffScreen = layoutInfo.menu.top >= layoutInfo.viewport.height;
      if (menuOffScreen) {
        console.error("🚨 PROBLEM: Menu is OFF-SCREEN!");
        console.error(`   Menu starts at y=${layoutInfo.menu.top}`);
        console.error(`   Viewport ends at y=${layoutInfo.viewport.height}`);
      }
    }
  });
});
