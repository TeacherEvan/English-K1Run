import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameState } from "../../types/game";

const baseGameState: GameState = {
    progress: 0,
    currentTarget: "cat",
    targetEmoji: "🐱",
    level: 0,
    gameStarted: true,
    winner: false,
    runMode: "default",
    phase: "playing",
    targetChangeTime: 4000,
    streak: 0,
};

describe("AppExperience lazy gameplay scene", () => {
    let container: HTMLDivElement;
    let root: Root;
    let useGameLogicSpy: ReturnType<typeof vi.fn>;
    let startGameSpy: ReturnType<typeof vi.fn>;
    let useDisplayAdjustmentSpy: ReturnType<typeof vi.fn>;
    let useBackgroundRotationSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.resetModules();
        useGameLogicSpy = vi.fn();
        startGameSpy = vi.fn();
        useDisplayAdjustmentSpy = vi.fn();
        useBackgroundRotationSpy = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        document.body.innerHTML = "";
        vi.clearAllMocks();
        vi.doUnmock("@/app/components/AppGameplayScene");
        vi.doUnmock("@/app/components/AppMenuOverlay");
        vi.doUnmock("@/app/backgrounds");
        vi.doUnmock("@/app/use-background-rotation");
        vi.doUnmock("@/app/use-debug-toggle");
        vi.doUnmock("@/app/use-fullscreen-guard");
        vi.doUnmock("@/app/use-preload-resources");
        vi.doUnmock("@/app/use-target-timer");
        vi.doUnmock("@/hooks/use-display-adjustment");
        vi.doUnmock("@/hooks/use-game-logic");
        vi.doUnmock("@/lib/constants/category-translation");
        vi.doUnmock("@/lib/utils/background-preloader");
        vi.doUnmock("@/components/LoadingSkeleton");
        vi.doUnmock("../../components/worm-loading");
        vi.doUnmock("react-i18next");
    });

    it("does not mount gameplay state on the initial menu render and keeps the menu overlay while the gameplay scene loads after start", async () => {
        let resolveSceneModule:
            | ((
                  value: {
                      AppGameplayScene: ({ onResetGame }: { onResetGame: () => void }) => ReactElement;
                  },
              ) => void)
            | undefined;
        const sceneModule = new Promise<{
            AppGameplayScene: ({ onResetGame }: { onResetGame: () => void }) => ReactElement;
        }>((resolve) => {
            resolveSceneModule = resolve;
        });

        vi.doMock("react-i18next", () => ({
            useTranslation: () => ({ t: (key: string) => key }),
        }));
        vi.doMock("@/app/backgrounds", () => ({
            pickRandomBackground: () => "bg-test",
        }));
        vi.doMock("@/app/components/AppGameplayScene", () => sceneModule);
        vi.doMock("@/app/components/AppMenuOverlay", () => ({
            AppMenuOverlay: ({ onStartGame }: { onStartGame: () => void }) => (
                <div data-testid="menu-overlay">
                    <button data-testid="start-game" onClick={onStartGame} />
                </div>
            ),
        }));
        vi.doMock("@/app/use-background-rotation", () => ({
            useBackgroundRotation: () => {
                useBackgroundRotationSpy();
                return undefined;
            },
        }));
        vi.doMock("@/app/use-debug-toggle", () => ({ useDebugToggle: () => undefined }));
        vi.doMock("@/app/use-fullscreen-guard", () => ({
            triggerFullscreen: () => undefined,
            useFullscreenGuard: () => undefined,
        }));
        vi.doMock("@/app/use-preload-resources", () => ({
            usePreloadResources: () => undefined,
        }));
        vi.doMock("@/app/use-target-timer", () => ({ useTargetTimer: () => undefined }));
        vi.doMock("@/hooks/use-display-adjustment", () => ({
            useDisplayAdjustment: () => {
                useDisplayAdjustmentSpy();
                return { displaySettings: { fallSpeed: 1 } };
            },
        }));
        vi.doMock("@/hooks/use-game-logic", () => ({
            GAME_CATEGORIES: [{ name: "Animals & Nature" }],
            useGameLogic: () => {
                useGameLogicSpy();
                return {
                    gameObjects: [],
                    worms: [],
                    fairyTransforms: [],
                    screenShake: false,
                    gameState: baseGameState,
                    currentCategory: {
                        name: "Animals & Nature",
                        items: [],
                        requiresSequence: false,
                    },
                    handleObjectTap: vi.fn(),
                    handleWormTap: vi.fn(),
                    startGame: startGameSpy,
                    resetGame: vi.fn(),
                    continuousModeHighScore: null,
                };
            },
        }));
        vi.doMock("@/lib/constants/category-translation", () => ({
            getCategoryTranslationKey: () => "animals",
        }));
        vi.doMock("@/lib/utils/background-preloader", () => ({
            useLazyBackgroundPreloader: () => undefined,
        }));
        vi.doMock("@/components/LoadingSkeleton", () => ({
            LoadingSkeleton: () => null,
        }));
        vi.doMock("../../components/worm-loading", () => ({
            WormLoadingScreen: ({ onComplete }: { onComplete: () => void }) => (
                <button data-testid="complete-loading" onClick={onComplete} />
            ),
        }));

        const { AppExperience } = await import("../components/AppExperience");

        await act(async () => {
            root.render(<AppExperience isE2E />);
            await Promise.resolve();
        });

        expect(useGameLogicSpy).not.toHaveBeenCalled();
        expect(startGameSpy).not.toHaveBeenCalled();
        expect(useDisplayAdjustmentSpy).toHaveBeenCalled();
        expect(useBackgroundRotationSpy).toHaveBeenCalled();
        expect(document.querySelector('[data-testid="menu-overlay"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="game-scene"]')).toBeNull();

        await act(async () => {
            document
                .querySelector<HTMLButtonElement>('[data-testid="start-game"]')
                ?.click();
            await Promise.resolve();
        });

        expect(useGameLogicSpy).toHaveBeenCalled();
        expect(startGameSpy).not.toHaveBeenCalled();

        await act(async () => {
            document
                .querySelector<HTMLButtonElement>('[data-testid="complete-loading"]')
                ?.click();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(startGameSpy).toHaveBeenCalledTimes(1);
        expect(document.querySelector('[data-testid="menu-overlay"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="game-scene"]')).toBeNull();

        await act(async () => {
            resolveSceneModule?.({
                AppGameplayScene: ({ onResetGame }) => (
                    <div data-testid="game-scene">
                        <button data-testid="reset-game" onClick={onResetGame} />
                    </div>
                ),
            });
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(document.querySelector('[data-testid="game-scene"]')).not.toBeNull();

        await act(async () => {
            document
                .querySelector<HTMLButtonElement>('[data-testid="reset-game"]')
                ?.click();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(document.querySelector('[data-testid="menu-overlay"]')).not.toBeNull();

        await act(async () => {
            document
                .querySelector<HTMLButtonElement>('[data-testid="start-game"]')
                ?.click();
            await Promise.resolve();
        });

        expect(startGameSpy).toHaveBeenCalledTimes(1);

        await act(async () => {
            document
                .querySelector<HTMLButtonElement>('[data-testid="complete-loading"]')
                ?.click();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(startGameSpy).toHaveBeenCalledTimes(2);
    });
});