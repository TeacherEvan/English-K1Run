import { WelcomeScreen } from '@/components/WelcomeScreen'
import { SettingsProvider } from '@/context/settings-context'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockHandlePrimaryAction } = vi.hoisted(() => ({
    mockHandlePrimaryAction: vi.fn(),
}))

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
        handleIntroActivated: vi.fn(),
        handlePrimaryAction: mockHandlePrimaryAction,
        handleVideoCanPlay: vi.fn(),
        handleVideoEnded: vi.fn(),
        handleVideoError: vi.fn(),
        handleVideoPlaying: vi.fn(),
    }),
}))

vi.mock('@/components/welcome/welcome-phase', () => ({
    isWelcomeInteractionLocked: () => false,
}))

describe('WelcomeScreen startup gate', () => {
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

    it('blocks startup actions before a language is selected', async () => {
        await renderWelcomeScreen()

        const welcomeScreen = document.querySelector(
            '[data-testid="welcome-screen"]',
        ) as HTMLDivElement
        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement

        await act(async () => {
            welcomeScreen.click()
            primaryButton.click()
            await Promise.resolve()
        })

        expect(primaryButton.disabled).toBe(true)
        expect(mockHandlePrimaryAction).not.toHaveBeenCalled()
    })

    it('does not trigger startup when selecting language with the keyboard', async () => {
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

        expect(mockHandlePrimaryAction).not.toHaveBeenCalled()
        expect(document.querySelector('[data-testid="welcome-language-shell"]')).toBeNull()
    })
})
