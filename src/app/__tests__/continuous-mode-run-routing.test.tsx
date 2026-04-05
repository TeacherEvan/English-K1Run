import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../../App";
import { GameMenuHero } from "../../components/game-menu/GameMenuHero";
import type { GameState } from "../../types/game";

const appMenuOverlaySpy = vi.fn();

const currentGameState: GameState = {
    progress: 0,
    currentTarget: "cat",
    targetEmoji: "🐱",
    level: 0,
    gameStarted: true,
    winner: true,
    runMode: "continuous",
    phase: "runComplete",
    continuousRunScore: 12,
    targetChangeTime: 4000,
    streak: 0,
};

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                "game.totalTargetsDestroyed": "Total Targets Destroyed",
                "game.bestTime": "Best Time",
                "game.title": "English K1 Run",
                "menu.instructions": "Tap the falling objects to help your turtle win!",
                "game.continuousMode": "Challenge Mode",
                animals: "Animals & Nature",
            };
            return translations[key] ?? key;
        },
    }),
}));

vi.mock("../../app/backgrounds", () => ({
    pickRandomBackground: () => "bg-test",
}));
vi.mock("../../app/components/AppGameplayScene", () => ({
    AppGameplayScene: () => <div data-testid="game-scene" />,
}));
vi.mock("../../app/components/AppMenuOverlay", async () => {
    const React = await import("react");
    return {
        AppMenuOverlay: (props: {
            onToggleContinuousMode: (enabled: boolean) => void;
        }) => {
            const { onToggleContinuousMode } = props;
            appMenuOverlaySpy(props);
            React.useEffect(() => {
                onToggleContinuousMode(true);
                onToggleContinuousMode(false);
            }, [onToggleContinuousMode]);
            return <div data-testid="menu-overlay" />;
        },
    };
});
vi.mock("../../app/components/AppStartupGate", () => ({
    AppStartupGate: () => <div data-testid="startup-gate" />,
}));
vi.mock("../../app/use-app-boot", () => ({ useAppBootSignal: () => undefined }));
vi.mock("../../app/use-background-rotation", () => ({
    useBackgroundRotation: () => undefined,
}));
vi.mock("../../app/use-debug-toggle", () => ({ useDebugToggle: () => undefined }));
vi.mock("../../app/use-e2e-mode", () => ({ useE2EMode: () => true }));
vi.mock("../../app/use-fullscreen-guard", () => ({
    triggerFullscreen: () => undefined,
    useFullscreenGuard: () => undefined,
}));
vi.mock("../../app/use-preload-resources", () => ({
    usePreloadResources: () => undefined,
}));
vi.mock("../../app/use-render-measurement", () => ({
    useRenderMeasurement: () => undefined,
}));
vi.mock("../../app/use-target-timer", () => ({ useTargetTimer: () => undefined }));
vi.mock("../../app/use-web-vitals-monitor", () => ({
    useWebVitalsMonitor: () => undefined,
}));
vi.mock("../../hooks/use-display-adjustment", () => ({
    useDisplayAdjustment: () => ({ displaySettings: { fallSpeed: 1 } }),
}));
vi.mock("../../hooks/use-game-logic", () => ({
    GAME_CATEGORIES: [{ name: "Animals & Nature" }],
    useGameLogic: () => ({
        gameObjects: [],
        worms: [],
        fairyTransforms: [],
        screenShake: false,
        gameState: currentGameState,
        currentCategory: {
            name: "Animals & Nature",
            items: [],
            requiresSequence: false,
        },
        handleObjectTap: vi.fn(),
        handleWormTap: vi.fn(),
        startGame: vi.fn(),
        resetGame: vi.fn(),
        continuousModeHighScore: 12,
    }),
}));
vi.mock("../../lib/constants/category-translation", () => ({
    getCategoryTranslationKey: () => "animals",
}));
vi.mock("../../lib/utils/background-preloader", () => ({
    useLazyBackgroundPreloader: () => undefined,
}));
vi.mock("../../components/FireworksDisplay", () => ({
    FireworksDisplay: () => <div data-testid="fireworks" />,
}));
vi.mock("../../components/EmojiRotationMonitor", () => ({
    EmojiRotationMonitor: () => null,
}));
vi.mock("../../components/game-completion/DefaultModeCompletionDialog", () => ({
    DefaultModeCompletionDialog: () => <div data-testid="default-mode-complete" />,
}));
vi.mock("../../lib/constants/classroom-brand", () => ({
    CLASSROOM_BRAND: { signature: "English K1 Run" },
}));

describe("continuous mode run routing", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        appMenuOverlaySpy.mockClear();
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        document.body.innerHTML = "";
    });

    it("keeps the default completion dialog hidden after a continuous run even if the toggle changes", async () => {
        await act(async () => {
            root.render(<App />);
            await Promise.resolve();
        });

        expect(appMenuOverlaySpy).toHaveBeenCalledWith(
            expect.objectContaining({ bestTargetTotal: 12 }),
        );
        expect(document.querySelector('[data-testid="default-mode-complete"]')).toBeNull();
    });

    it("labels the home hero card with total targets destroyed", () => {
        act(() => {
            root.render(
                <GameMenuHero formattedBestTargetTotal="12" continuousMode={false} />,
            );
        });

        const text = document.body.textContent ?? "";
        expect(text).toContain("Total Targets Destroyed");
        expect(text).not.toContain("Best Time");
        expect(text).toContain("12");
    });

    it("shows Challenge Mode in the home hero card instead of Continuous Mode", () => {
        act(() => {
            root.render(
                <GameMenuHero formattedBestTargetTotal="12" continuousMode />,
            );
        });

        const text = document.body.textContent ?? "";
        expect(text).toContain("Challenge Mode");
        expect(text).not.toContain("Continuous Mode");
    });
});
