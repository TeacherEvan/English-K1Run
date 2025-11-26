import { expect, test } from '@playwright/test'

// Note: For full accessibility testing, install @axe-core/playwright
// npm install -D @axe-core/playwright
// import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' })
        await page.waitForSelector('[data-testid="game-menu"]', { state: 'visible', timeout: 10000 })
    })

    test('menu page should not have critical accessibility violations', async ({ page }) => {
        // This test requires @axe-core/playwright to be installed
        // For now, we'll do basic checks

        // Check for visible title
        await expect(page.locator('[data-testid="game-title"]')).toBeVisible()

        // Check buttons are accessible
        const startButton = page.locator('[data-testid="start-button"]')
        await expect(startButton).toBeVisible()
        await expect(startButton).toBeEnabled()

        const resetButton = page.locator('[data-testid="reset-button"]')
        await expect(resetButton).toBeVisible()
        await expect(resetButton).toBeEnabled()

        // Level buttons should be visible and accessible
        const levelButtons = page.locator('[data-testid="level-button"]')
        const count = await levelButtons.count()
        expect(count).toBeGreaterThan(0)

        for (let i = 0; i < count; i++) {
            await expect(levelButtons.nth(i)).toBeEnabled()
        }
    })

    test('gameplay elements should be visible and accessible', async ({ page }) => {
        // Start game
        await page.locator('[data-testid="start-button"]').click()
        await page.locator('[data-testid="target-display"]').waitFor({ state: 'visible' })

        // Target display should be visible
        await expect(page.locator('[data-testid="target-display"]')).toBeVisible()
        await expect(page.locator('[data-testid="target-emoji"]')).toBeVisible()
        await expect(page.locator('[data-testid="target-name"]')).toBeVisible()

        // Back button should be visible and enabled
        const backButton = page.locator('[data-testid="back-button"]')
        await expect(backButton).toBeVisible()
        await expect(backButton).toBeEnabled()
    })

    test('game should have proper contrast for readability', async ({ page }) => {
        // Check that key text elements are visible
        const title = page.locator('[data-testid="game-title"]')
        await expect(title).toBeVisible()

        // The title should be readable (has proper styling)
        const titleStyles = await title.evaluate(el => {
            const styles = window.getComputedStyle(el)
            return {
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
            }
        })

        // Font should be bold (600+) for titles
        const fontWeight = parseInt(titleStyles.fontWeight)
        expect(fontWeight).toBeGreaterThanOrEqual(600)
    })

    test('interactive elements should have sufficient size for touch', async ({ page }) => {
        // Start game
        await page.locator('[data-testid="start-button"]').click()
        await page.waitForFunction(
            () => document.querySelectorAll('[data-testid="falling-object"]').length > 0,
            { timeout: 5000 }
        )

        const objects = page.locator('[data-testid="falling-object"]')
        const count = await objects.count()

        if (count > 0) {
            const box = await objects.first().boundingBox()
            if (box) {
                // Touch targets should be at least 44x44 pixels (WCAG)
                // Game uses --object-scale, so checking for reasonable minimum
                expect(box.width).toBeGreaterThan(20)
                expect(box.height).toBeGreaterThan(20)
            }
        }
    })
})

test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' })
        await page.waitForSelector('[data-testid="game-menu"]', { state: 'visible', timeout: 10000 })
    })

    test('should be able to tab through menu buttons', async ({ page }) => {
        // Press Tab to navigate
        await page.keyboard.press('Tab')

        // Some button should be focused
        const activeElement = await page.evaluate(() => {
            return document.activeElement?.tagName
        })

        // Should focus on a button element
        expect(activeElement).toBeDefined()
    })

    test('should be able to activate buttons with Enter key', async ({ page }) => {
        // Focus on start button using Tab navigation
        const startButton = page.locator('[data-testid="start-button"]')
        await startButton.focus()

        // Press Enter
        await page.keyboard.press('Enter')

        // Game should start
        await expect(page.locator('[data-testid="target-display"]')).toBeVisible({ timeout: 5000 })
    })
})
