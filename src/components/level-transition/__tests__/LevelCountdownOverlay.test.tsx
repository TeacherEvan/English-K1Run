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
        t: (key: string, options?: { lng?: string; level?: string }) => {
            const language = options?.lng ?? "en";
            const translations: Record<string, Record<string, string>> = {
                en: {
                    "welcome.readyContinue": "Ready to continue",
                    "accessibility.selectedLevel": `Selected level: ${options?.level ?? ""}`,
                },
                ja: {
                    "welcome.readyContinue": "つづけられます",
                    "accessibility.selectedLevel": `選択中のレベル: ${options?.level ?? ""}`,
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

        expect(document.body.textContent).toContain("つづけられます");
        expect(document.body.textContent).toContain("5");
        expect(document.body.textContent).toContain("動物と自然");
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
