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
                en: { 'game.backToLevels': 'Back to Levels' },
                ja: { 'game.backToLevels': 'レベル一覧へ戻る' },
            }

            return translations[language]?.[key] ?? key
        },
    }),
}))

vi.mock('../../../components/CategoryErrorBoundary', () => ({
    CategoryErrorBoundary: ({ children }: { children: unknown }) => children,
}))
vi.mock('../../../components/FallingObject', () => ({ FallingObject: () => null }))
vi.mock('../../../components/PlayerArea', () => ({
    PlayerArea: ({ children }: { children: unknown }) => children,
}))
vi.mock('../../../components/Stopwatch', () => ({ Stopwatch: () => null }))
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
                        gameStarted: true,
                        winner: null,
                        progress: 0,
                        currentTarget: 'cat',
                        targetEmoji: '🐱',
                    }}
                    currentCategory={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: false,
                    }}
                    timeRemaining={4000}
                    screenShake={false}
                    continuousMode={false}
                    continuousModeHighScore={null}
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
})