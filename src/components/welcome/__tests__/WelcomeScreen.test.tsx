import { WelcomeScreen } from '@/components/WelcomeScreen'
import { SettingsProvider } from '@/context/settings-context'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WelcomePhase } from '../welcome-phase'

const { mockHandleIntroActivated, mockHandlePrimaryAction, mockPhase, mockShowRetryPrompt } = vi.hoisted(() => ({
    mockHandleIntroActivated: vi.fn(),
    mockHandlePrimaryAction: vi.fn(),
    mockPhase: { current: 'readyToStart' as WelcomePhase },
    mockShowRetryPrompt: { current: false },
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) =>
            options?.defaultValue ?? key,
    }),
}))

vi.mock('@/app/startup/language-audio-prefetch', () => ({
    hasLanguageAudioPrefetchKeys: () => false,
    prefetchSelectedLanguageAudioPack: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/components/welcome/use-welcome-sequence', () => ({
    useWelcomeSequence: () => ({
        fadeOut: false,
        phase: mockPhase.current,
        isSequencePlaying: mockPhase.current === 'playingNarration',
        showFallbackImage: false,
        showRetryPrompt: mockShowRetryPrompt.current,
        currentAudioIndex: mockPhase.current === 'playingNarration' ? 1 : 0,
        totalAudioCount: mockPhase.current === 'playingNarration' ? 3 : 0,
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
    isWelcomeInteractionLocked: (phase: string) =>
        phase === 'playingNarration' || phase === 'transitioningToMenu',
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
        mockPhase.current = 'readyToStart'
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

    it('skips the startup language shell after the language gate was completed previously', async () => {
        localStorage.setItem(
            'k1-startup-state',
            JSON.stringify({ languageGateCompleted: true, startupPackVersion: null }),
        )

        await renderWelcomeScreen()

        expect(
            document.querySelector('[data-testid="welcome-language-shell"]'),
        ).toBeNull()
    })

    it('shows an explicit start control when the chooser is skipped and routes that gesture through the primary action', async () => {
        localStorage.setItem(
            'k1-startup-state',
            JSON.stringify({ languageGateCompleted: true, startupPackVersion: null }),
        )

        await renderWelcomeScreen()

        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement
        const video = document.querySelector(
            '[data-testid="welcome-video"]',
        ) as HTMLVideoElement

        expect(primaryButton).not.toBeNull()
        expect(
            document.querySelector('[data-testid="welcome-status-panel"]'),
        ).not.toBeNull()

        await act(async () => {
            primaryButton.click()
            await Promise.resolve()
        })

        expect(mockHandlePrimaryAction).toHaveBeenCalledWith(video)
    })

    it('keeps the status panel visible with listening feedback while narration is playing', async () => {
        localStorage.setItem(
            'k1-startup-state',
            JSON.stringify({ languageGateCompleted: true, startupPackVersion: null }),
        )
        mockPhase.current = 'playingNarration'

        await renderWelcomeScreen()

        const statusLabel = document.querySelector(
            '[data-testid="welcome-status-label"]',
        ) as HTMLParagraphElement | null
        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement | null

        expect(
            document.querySelector('[data-testid="welcome-status-panel"]'),
        ).not.toBeNull()
        expect(statusLabel?.textContent).toBe('Please wait for the welcome audio')
        expect(primaryButton?.textContent).toContain('Listening...')
        expect(primaryButton?.disabled).toBe(true)
        expect(document.querySelector('[data-testid="audio-progress-1"]')).not.toBeNull()
    })

    it('shows a continue state after narration completes', async () => {
        localStorage.setItem(
            'k1-startup-state',
            JSON.stringify({ languageGateCompleted: true, startupPackVersion: null }),
        )
        mockPhase.current = 'readyToContinue'

        await renderWelcomeScreen()

        const statusLabel = document.querySelector(
            '[data-testid="welcome-status-label"]',
        ) as HTMLParagraphElement | null
        const primaryButton = document.querySelector(
            '[data-testid="welcome-primary-button"]',
        ) as HTMLButtonElement | null

        expect(statusLabel?.textContent).toBe('Ready to continue')
        expect(primaryButton?.textContent).toContain('menu.tapToContinue')
        expect(primaryButton?.disabled).toBe(false)
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
        ).toBeNull()
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
