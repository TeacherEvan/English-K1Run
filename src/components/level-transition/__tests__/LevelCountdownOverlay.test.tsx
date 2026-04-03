import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LevelCountdownOverlay } from "../LevelCountdownOverlay";

vi.mock("../../../context/settings-context", () => ({
    useSettings: () => ({
        gameplayLanguage: "ja",
        displayLanguage: "en",
    }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: { lng?: string; level?: string; count?: number }) => {
            const language = options?.lng ?? "en";
            const translations: Record<string, Record<string, string>> = {
                en: {
                    "transition.getReady": "Get ready",
                    "transition.upNext": "Up next",
                    "transition.startingIn": `Starting in ${options?.count ?? 0}`,
                    "accessibility.levelCountdownAnnouncement": `${options?.level ?? ""} starts in ${options?.count ?? 0}.`,
                },
                ja: {
                    "transition.getReady": "じゅんびしよう",
                    "transition.upNext": "つぎのレベル",
                    "transition.startingIn": `${options?.count ?? 0}びょうでスタート`,
                    "accessibility.levelCountdownAnnouncement": `${options?.level ?? ""} が ${options?.count ?? 0} びょうでスタートします。`,
                },
            };

            return translations[language]?.[key] ?? key;
        },
    }),
}));

describe("LevelCountdownOverlay", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-03T14:00:00Z"));
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("renders the next-level label and current countdown value", () => {
        act(() => {
            root.render(
                <LevelCountdownOverlay
                    isVisible
                    countdownEndsAt={Date.now() + 5000}
                    levelLabel="動物と自然"
                />,
            );
        });

        expect(document.body.textContent).toContain("じゅんびしよう");
        expect(document.body.textContent).toContain("つぎのレベル");
        expect(document.body.textContent).toContain("5");
        expect(document.body.textContent).toContain("動物と自然");
        expect(document.body.textContent).toContain("5びょうでスタート");
    });

    it("counts down toward one as time advances", () => {
        act(() => {
            root.render(
                <LevelCountdownOverlay
                    isVisible
                    countdownEndsAt={Date.now() + 5000}
                    levelLabel="動物と自然"
                />,
            );
        });

        const value = () =>
            document.querySelector('[data-testid="level-countdown-value"]')
                ?.textContent;

        expect(value()).toBe("5");

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(value()).toBe("3");

        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(value()).toBe("1");
    });
});
