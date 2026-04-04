import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppGameplayScene } from '../AppGameplayScene'

vi.mock('../../../context/settings-context', () => ({
    useSettings: () => ({
        gameplayLanguage: 'ja',
        displayLanguage: 'en',
    }),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { lng?: string }) => {
            const language = options?.lng ?? 'en'
            const translations: Record<string, Record<string, string>> = {
                en: {
                    'game.backToLevels': 'Back to Levels',
                    'categories.counting': 'Counting Fun',
                },
                ja: {
                    'game.backToLevels': 'レベル一覧へ戻る',
                    'categories.counting': 'かぞえてみよう',
                },
            }

            return translations[language]?.[key] ?? key
        },
    }),
}))

vi.mock('../../../components/CategoryErrorBoundary', () => ({
    CategoryErrorBoundary: ({ children }: { children: unknown }) => children,
}))
vi.mock('../../../components/FallingObject', () => ({ FallingObject: () => null }))
vi.mock('../../../components/level-transition/LevelCompletePopup', () => ({
    LevelCompletePopup: ({ isVisible }: { isVisible: boolean }) =>
        isVisible ? <div data-testid="level-complete-popup" /> : null,
}))
vi.mock('../../../components/level-transition/LevelCountdownOverlay', () => ({
    LevelCountdownOverlay: ({ isVisible, levelLabel }: { isVisible: boolean; levelLabel: string }) =>
        isVisible ? <div data-testid="level-countdown-overlay">{levelLabel}</div> : null,
}))
vi.mock('../../../components/PlayerArea', () => ({
    PlayerArea: ({ children }: { children: unknown }) => children,
}))
vi.mock('../../../components/Stopwatch', () => ({
    Stopwatch: () => <div data-testid="continuous-mode-stopwatch" />,
}))
vi.mock('../../../components/TargetDisplay', () => ({ TargetDisplay: () => null }))
vi.mock('../../../components/Worm', () => ({ Worm: () => null }))
vi.mock('../../../lib/event-tracker', () => ({
    eventTracker: { trackError: vi.fn() },
}))

describe('AppGameplayScene', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        document.body.innerHTML = ''
    })

    it('renders the gameplay back button using the gameplay language', () => {
        act(() => {
            root.render(
                <AppGameplayScene
                    gameState={{
                        progress: 0,
                        currentTarget: 'cat',
                        targetEmoji: '🐱',
                        level: 0,
                        gameStarted: true,
                        winner: false,
                        phase: 'playing',
                        targetChangeTime: 4000,
                        streak: 0,
                    }}
                    currentCategory={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: false,
                    }}
                    timeRemaining={4000}
                    screenShake={false}
                    continuousMode={false}
                    gameObjects={[]}
                    worms={[]}
                    fairyTransforms={[]}
                    onResetGame={vi.fn()}
                    onObjectTap={vi.fn()}
                    onWormTap={vi.fn()}
                />,
            )
        })

        const text = document.body.textContent ?? ''
        expect(text).toContain('レベル一覧へ戻る')
        expect(text).not.toContain('Back to Levels')
    })

    it('shows the level-complete popup during levelComplete phase', () => {
        act(() => {
            root.render(
                <AppGameplayScene
                    gameState={{
                        progress: 100,
                        currentTarget: 'cat',
                        targetEmoji: '🐱',
                        level: 0,
                        gameStarted: true,
                        winner: false,
                        phase: 'levelComplete',
                        pendingLevel: 1,
                        levelQueue: [0, 1],
                        levelQueueIndex: 1,
                        targetChangeTime: 4000,
                        streak: 0,
                    }}
                    currentCategory={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: false,
                    }}
                    timeRemaining={4000}
                    screenShake={false}
                    continuousMode={false}
                    gameObjects={[]}
                    worms={[]}
                    fairyTransforms={[]}
                    onResetGame={vi.fn()}
                    onObjectTap={vi.fn()}
                    onWormTap={vi.fn()}
                />,
            )
        })

        expect(document.querySelector('[data-testid="level-complete-popup"]')).not.toBeNull()
        expect(document.querySelector('[data-testid="back-button"]')).toBeNull()
    })

    it('shows the countdown overlay during inter-level countdown', () => {
        act(() => {
            root.render(
                <AppGameplayScene
                    gameState={{
                        progress: 100,
                        currentTarget: 'cat',
                        targetEmoji: '🐱',
                        level: 0,
                        gameStarted: true,
                        winner: false,
                        phase: 'interLevelCountdown',
                        pendingLevel: 1,
                        countdownEndsAt: Date.now() + 5000,
                        targetChangeTime: 4000,
                        streak: 0,
                    }}
                    currentCategory={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: false,
                    }}
                    timeRemaining={4000}
                    screenShake={false}
                    continuousMode={false}
                    gameObjects={[]}
                    worms={[]}
                    fairyTransforms={[]}
                    onResetGame={vi.fn()}
                    onObjectTap={vi.fn()}
                    onWormTap={vi.fn()}
                />,
            )
        })

        const countdown = document.querySelector('[data-testid="level-countdown-overlay"]')
        expect(countdown).not.toBeNull()
        expect(document.body.textContent ?? '').toContain('かぞえてみよう')
        expect(document.querySelector('[data-testid="back-button"]')).toBeNull()
    })

    it('does not show the stopwatch HUD in continuous mode gameplay', () => {
        act(() => {
            root.render(
                <AppGameplayScene
                    gameState={{
                        progress: 0,
                        currentTarget: 'cat',
                        targetEmoji: '🐱',
                        level: 0,
                        gameStarted: true,
                        winner: false,
                        phase: 'playing',
                        targetChangeTime: 4000,
                        streak: 0,
                    }}
                    currentCategory={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: false,
                    }}
                    timeRemaining={4000}
                    screenShake={false}
                    continuousMode
                    gameObjects={[]}
                    worms={[]}
                    fairyTransforms={[]}
                    onResetGame={vi.fn()}
                    onObjectTap={vi.fn()}
                    onWormTap={vi.fn()}
                />,
            )
        })

        expect(document.querySelector('[data-testid="continuous-mode-stopwatch"]')).toBeNull()
    })
})