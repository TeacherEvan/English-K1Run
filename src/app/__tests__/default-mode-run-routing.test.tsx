import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import type { GameState } from '../../types/game'

const backgroundRotationSpy = vi.fn()
const appMenuOverlaySpy = vi.fn()

let currentGameState: GameState = {
    progress: 0,
    currentTarget: 'cat',
    targetEmoji: '🐱',
    level: 0,
    gameStarted: true,
    winner: false,
    runMode: 'default',
    phase: 'playing',
    targetChangeTime: 4000,
    streak: 0,
}

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../app/backgrounds', () => ({
    pickRandomBackground: () => 'bg-test',
}))
vi.mock('../../app/components/AppGameplayScene', () => ({
    AppGameplayScene: () => <div data-testid="game-scene" />,
}))
vi.mock('../../app/components/AppMenuOverlay', () => ({
    AppMenuOverlay: (props: unknown) => {
        appMenuOverlaySpy(props)
        return <div data-testid="menu-overlay" />
    },
}))
vi.mock('../../app/components/AppStartupGate', () => ({
    AppStartupGate: () => <div data-testid="startup-gate" />,
}))
vi.mock('../../app/use-app-boot', () => ({ useAppBootSignal: () => undefined }))
vi.mock('../../app/use-background-rotation', () => ({
    useBackgroundRotation: (...args: unknown[]) => backgroundRotationSpy(...args),
}))
vi.mock('../../app/use-debug-toggle', () => ({ useDebugToggle: () => undefined }))
vi.mock('../../app/use-e2e-mode', () => ({ useE2EMode: () => true }))
vi.mock('../../app/use-fullscreen-guard', () => ({
    triggerFullscreen: () => undefined,
    useFullscreenGuard: () => undefined,
}))
vi.mock('../../app/use-preload-resources', () => ({
    usePreloadResources: () => undefined,
}))
vi.mock('../../app/use-render-measurement', () => ({
    useRenderMeasurement: () => undefined,
}))
vi.mock('../../app/use-target-timer', () => ({ useTargetTimer: () => undefined }))
vi.mock('../../app/use-web-vitals-monitor', () => ({
    useWebVitalsMonitor: () => undefined,
}))
vi.mock('../../hooks/use-display-adjustment', () => ({
    useDisplayAdjustment: () => ({
        displaySettings: { fallSpeed: 1 },
    }),
}))
vi.mock('../../hooks/use-game-logic', () => ({
    GAME_CATEGORIES: [{ name: 'Animals & Nature' }],
    useGameLogic: () => ({
        gameObjects: [],
        worms: [],
        fairyTransforms: [],
        screenShake: false,
        gameState: currentGameState,
        currentCategory: {
            name: 'Animals & Nature',
            items: [],
            requiresSequence: false,
        },
        handleObjectTap: vi.fn(),
        handleWormTap: vi.fn(),
        startGame: vi.fn(),
        resetGame: vi.fn(),
        continuousModeHighScore: null,
    }),
}))
vi.mock('../../lib/constants/category-translation', () => ({
    getCategoryTranslationKey: () => 'animals',
}))
vi.mock('../../lib/utils/background-preloader', () => ({
    useLazyBackgroundPreloader: () => undefined,
}))
vi.mock('../../components/FireworksDisplay', () => ({
    FireworksDisplay: () => <div data-testid="fireworks" />,
}))
vi.mock('../../components/EmojiRotationMonitor', () => ({
    EmojiRotationMonitor: () => null,
}))
vi.mock('../../components/game-completion/DefaultModeCompletionDialog', () => ({
    DefaultModeCompletionDialog: () => <div data-testid="default-mode-complete" />,
}))

describe('default mode run routing', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        backgroundRotationSpy.mockClear()
        appMenuOverlaySpy.mockClear()
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        document.body.innerHTML = ''
    })

    it('keeps final winner UI hidden during inter-level phases', async () => {
        currentGameState = {
            ...currentGameState,
            winner: true,
            phase: 'levelComplete',
        }

        await act(async () => {
            root.render(<App />)
            await Promise.resolve()
        })

        expect(backgroundRotationSpy).toHaveBeenCalledWith(true, false, expect.any(Function))
        expect(appMenuOverlaySpy).toHaveBeenCalledWith(
            expect.objectContaining({ winner: false, phase: 'levelComplete' }),
        )
        expect(document.querySelector('[data-testid="fireworks"]')).toBeNull()
        expect(document.querySelector('[data-testid="default-mode-complete"]')).toBeNull()
    })

    it('shows final winner UI only after runComplete', async () => {
        currentGameState = {
            ...currentGameState,
            winner: true,
            phase: 'runComplete',
        }

        await act(async () => {
            root.render(<App />)
            await Promise.resolve()
        })

        expect(backgroundRotationSpy).toHaveBeenCalledWith(true, true, expect.any(Function))
        expect(appMenuOverlaySpy).toHaveBeenCalledWith(
            expect.objectContaining({ winner: true, phase: 'runComplete' }),
        )
        expect(document.querySelector('[data-testid="fireworks"]')).not.toBeNull()
        expect(document.querySelector('[data-testid="default-mode-complete"]')).not.toBeNull()
    })
})
