import { WelcomeScreen } from '@/components/WelcomeScreen'
import { SettingsProvider } from '@/context/settings-context'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) =>
            options?.defaultValue ?? key,
    }),
}))

vi.mock('@/components/welcome/use-welcome-sequence', () => ({
    useWelcomeSequence: () => ({
        fadeOut: false,
        phase: 'readyToStart',
        isSequencePlaying: false,
        showFallbackImage: false,
        currentAudioIndex: 0,
        totalAudioCount: 0,
        lastDiagnostic: null,
        handlePrimaryAction: vi.fn(),
        handleVideoCanPlay: vi.fn(),
        handleVideoEnded: vi.fn(),
        handleVideoError: vi.fn(),
    }),
}))

vi.mock('@/components/welcome/welcome-phase', () => ({
    isWelcomeInteractionLocked: () => false,
}))

describe('WelcomeScreen', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        localStorage.clear()
        document.body.className = ''
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        document.body.innerHTML = ''
        document.body.className = ''
        localStorage.clear()
        vi.clearAllMocks()
    })

    const renderWelcomeScreen = async () => {
        await act(async () => {
            root.render(
                <SettingsProvider>
                    <WelcomeScreen onComplete={() => { }} />
                </SettingsProvider>,
            )
        })
    }

    it('moves focus to the welcome primary button after keyboard language selection', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector(
            '[data-testid="welcome-language-th"]',
        ) as HTMLButtonElement

        languageButton.focus()

        await act(async () => {
            languageButton.dispatchEvent(
                new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
            )
            languageButton.dispatchEvent(
                new MouseEvent('click', { bubbles: true, detail: 0 }),
            )
            await Promise.resolve()
        })

        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement

        expect(document.querySelector('[data-testid="welcome-language-shell"]')).toBeNull()
        expect(document.activeElement).toBe(primaryButton)
    })

    it('does not steal focus to the primary button after pointer language selection', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector(
            '[data-testid="welcome-language-en"]',
        ) as HTMLButtonElement

        languageButton.focus()

        await act(async () => {
            languageButton.dispatchEvent(
                new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }),
            )
            languageButton.dispatchEvent(
                new MouseEvent('click', { bubbles: true, detail: 1 }),
            )
            await Promise.resolve()
        })

        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement

        expect(document.querySelector('[data-testid="welcome-language-shell"]')).toBeNull()
        expect(document.activeElement).not.toBe(primaryButton)
    })

    it('keeps the language chooser hidden for the rest of the current startup flow', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector(
            '[data-testid="welcome-language-en"]',
        ) as HTMLButtonElement

        await act(async () => {
            languageButton.dispatchEvent(
                new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }),
            )
            languageButton.dispatchEvent(
                new MouseEvent('click', { bubbles: true, detail: 1 }),
            )
            await Promise.resolve()
        })

        expect(
            document.querySelector('[data-testid="welcome-language-shell"]'),
        ).toBeNull()
        expect(
            document.querySelector('[data-testid="welcome-primary-button"]'),
        ).not.toBeNull()
    })

    it('does not render any startup language shell or picker again during the current startup flow', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector(
            '[data-testid="welcome-language-th"]',
        ) as HTMLButtonElement

        await act(async () => {
            languageButton.dispatchEvent(
                new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }),
            )
            languageButton.dispatchEvent(
                new MouseEvent('click', { bubbles: true, detail: 1 }),
            )
            await Promise.resolve()
        })

        expect(
            document.querySelector('[data-testid="welcome-language-shell"]'),
        ).toBeNull()
        expect(
            document.querySelector('[data-testid="welcome-language-picker"]'),
        ).toBeNull()
    })
})
