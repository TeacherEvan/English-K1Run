import { devices, expect, test } from '@playwright/test'

// Use tablet device for touch testing
test.use({ ...devices['iPad Pro 11'], hasTouch: true })

test.describe('Touch Interactions - Tablet', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('[data-testid="game-menu"]', { state: 'visible' })
    })

    test('should start game with touch on Start button', async ({ page }) => {
        const startButton = page.locator('[data-testid="start-button"]')
        await startButton.tap()

        // Menu should disappear
        await expect(page.locator('[data-testid="game-menu"]')).not.toBeVisible()

        // Target should appear
        await expect(page.locator('[data-testid="target-display"]')).toBeVisible()
    })

    test('should allow level selection with touch', async ({ page }) => {
        const levelButtons = page.locator('[data-testid="level-button"]')

        // Tap second level
        await levelButtons.nth(1).tap()

        // Second level should be selected
        await expect(levelButtons.nth(1)).toHaveAttribute('data-selected', 'true')
    })

    test('falling objects should respond to touch', async ({ page }) => {
        // Start game
        await page.locator('[data-testid="start-button"]').tap()

        // Wait for objects to spawn
        await page.waitForFunction(
            () => document.querySelectorAll('[data-testid="falling-object"]').length > 0,
            { timeout: 5000 }
        )

        const objects = page.locator('[data-testid="falling-object"]')
        const count = await objects.count()

        if (count > 0) {
            // Tap the first object
            await objects.first().tap()
        }
    })

    test('back button should respond to touch', async ({ page }) => {
        // Start game
        await page.locator('[data-testid="start-button"]').tap()
        await page.locator('[data-testid="target-display"]').waitFor({ state: 'visible' })

        // Tap back button
        const backButton = page.locator('[data-testid="back-button"]')
        await expect(backButton).toBeVisible()
        await backButton.tap()

        // Should return to menu
        await expect(page.locator('[data-testid="game-menu"]')).toBeVisible()
    })
})

test.describe('Multi-touch Handling', () => {
    test('should handle rapid sequential taps', async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('[data-testid="game-menu"]', { state: 'visible' })

        // Start game
        await page.locator('[data-testid="start-button"]').tap()
        await page.waitForFunction(
            () => document.querySelectorAll('[data-testid="falling-object"]').length > 0,
            { timeout: 5000 }
        )

        const objects = page.locator('[data-testid="falling-object"]')

        // Rapidly tap multiple objects
        for (let i = 0; i < 3; i++) {
            const count = await objects.count()
            if (count > i) {
                await objects.nth(i).tap({ timeout: 1000 }).catch(() => { })
            }
        }

        // Game should still be running
        await expect(page.locator('[data-testid="target-display"]')).toBeVisible()
    })
})
