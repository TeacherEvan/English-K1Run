import { WelcomeScreen } from '@/components/WelcomeScreen'
import { SettingsProvider } from '@/context/settings-context'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockHandleIntroActivated, mockHandlePrimaryAction, mockShowRetryPrompt } = vi.hoisted(() => ({
    mockHandleIntroActivated: vi.fn(),
    mockHandlePrimaryAction: vi.fn(),
    mockShowRetryPrompt: { current: false },
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
        showRetryPrompt: mockShowRetryPrompt.current,
        currentAudioIndex: 0,
        totalAudioCount: 0,
        lastDiagnostic: null,
        handleIntroActivated: mockHandleIntroActivated,
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

describe('WelcomeScreen intro flow', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        localStorage.clear()
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        localStorage.clear()
        mockShowRetryPrompt.current = false
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

    it('loads the intro video immediately after language selection and removes the language shell', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector('[data-testid="welcome-language-en"]') as HTMLButtonElement
        const video = document.querySelector('[data-testid="welcome-video"]') as HTMLVideoElement

        await act(async () => {
            languageButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
            languageButton.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
            await Promise.resolve()
        })

        expect(document.querySelector('[data-testid="welcome-language-shell"]')).toBeNull()
        expect(mockHandleIntroActivated).toHaveBeenCalledTimes(1)
        expect(mockHandlePrimaryAction).not.toHaveBeenCalled()
        expect(video.getAttribute('src')).toBe('/New_welcome_video.mp4')
    })

    it('keeps the large status panel off the screen while the intro is actively playing', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector('[data-testid="welcome-language-th"]') as HTMLButtonElement

        await act(async () => {
            languageButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
            languageButton.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
            await Promise.resolve()
        })

        expect(document.querySelector('[data-testid="welcome-status-panel"]')).toBeNull()
    })

    it('shows the compact retry control again after a retryable intro interruption', async () => {
        await renderWelcomeScreen()

        const languageButton = document.querySelector('[data-testid="welcome-language-en"]') as HTMLButtonElement

        await act(async () => {
            languageButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
            languageButton.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
            await Promise.resolve()
        })

        mockShowRetryPrompt.current = true

        await act(async () => {
            root.render(
                <SettingsProvider>
                    <WelcomeScreen onComplete={() => { }} />
                </SettingsProvider>,
            )
        })

        expect(document.querySelector('[data-testid="welcome-language-shell"]')).toBeNull()
        expect(document.querySelector('[data-testid="welcome-primary-button"]')).not.toBeNull()
    })
})