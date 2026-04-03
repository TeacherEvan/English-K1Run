import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LevelCompletePopup } from "../LevelCompletePopup";

vi.mock("../../../context/settings-context", () => ({
    useSettings: () => ({
        gameplayLanguage: "ja",
        displayLanguage: "en",
    }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: { lng?: string }) => {
            const language = options?.lng ?? "en";
            const translations: Record<string, Record<string, string>> = {
                en: {
                    "messages.victoryTitle": "You Win!",
                    "messages.completionTitle": "Well done!",
                    "messages.completionDescription": "Try some of the other levels!",
                },
                ja: {
                    "messages.victoryTitle": "きみの勝ち！",
                    "messages.completionTitle": "よくできました！",
                    "messages.completionDescription": "ほかのレベルもやってみましょう！",
                },
            };

            return translations[language]?.[key] ?? key;
        },
    }),
}));

describe("LevelCompletePopup", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.useFakeTimers();
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

    it("renders localized completion copy when visible", () => {
        act(() => {
            root.render(<LevelCompletePopup isVisible />);
        });

        const text = document.body.textContent ?? "";
        expect(text).toContain("きみの勝ち！");
        expect(text).toContain("よくできました！");
        expect(text).toContain("ほかのレベルもやってみましょう！");
    });

    it("requests dismissal after the auto-close timeout", () => {
        const onDismiss = vi.fn();

        act(() => {
            root.render(<LevelCompletePopup isVisible onDismiss={onDismiss} />);
        });

        act(() => {
            vi.advanceTimersByTime(1199);
        });
        expect(onDismiss).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
