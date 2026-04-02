import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultModeCompletionDialog } from "../DefaultModeCompletionDialog";

const { announceToScreenReader } = vi.hoisted(() => ({
    announceToScreenReader: vi.fn(),
}));

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
                    "messages.completionButton": "Try other levels",
                    "accessibility.completionDialogAnnouncement":
                        "Well done! Try some of the other levels!",
                    "common.close": "Close",
                },
                ja: {
                    "messages.victoryTitle": "きみの勝ち！",
                    "messages.completionTitle": "よくできました！",
                    "messages.completionDescription": "ほかのレベルもやってみましょう！",
                    "messages.completionButton": "ほかのレベルへ",
                    "accessibility.completionDialogAnnouncement":
                        "よくできました！ほかのレベルもやってみましょう！",
                    "common.close": "閉じる",
                },
            };

            return translations[language]?.[key] ?? key;
        },
    }),
}));

vi.mock("../../../lib/accessibility-utils", () => ({
    announceToScreenReader,
}));

describe("DefaultModeCompletionDialog", () => {
    let container: HTMLDivElement;
    let root: Root;

    const renderDialog = (isVisible: boolean) => {
        act(() => {
            root.render(<DefaultModeCompletionDialog isVisible={isVisible} />);
        });
    };

    beforeEach(() => {
        vi.useFakeTimers();
        announceToScreenReader.mockClear();
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
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("renders the completion content and announces it when visible", () => {
        renderDialog(true);

        expect(
            document.querySelector('[data-testid="default-completion-dialog"]'),
        ).not.toBeNull();
        expect(document.body.textContent).toContain("きみの勝ち！");
        expect(document.body.textContent).toContain("よくできました！");
        expect(document.body.textContent).toContain("ほかのレベルへ");
        expect(announceToScreenReader).toHaveBeenCalledWith(
            "よくできました！ほかのレベルもやってみましょう！",
            "assertive",
        );
    });

    it("dismisses itself after the timeout completes", () => {
        renderDialog(true);

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(
            document.querySelector('[data-testid="default-completion-dialog"]'),
        ).toBeNull();
    });

    it("dismisses when the action button is pressed", () => {
        renderDialog(true);

        const actionButton = document.querySelector(
            '[data-testid="default-completion-dialog-button"]',
        );
        expect(actionButton).not.toBeNull();

        act(() => {
            actionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(
            document.querySelector('[data-testid="default-completion-dialog"]'),
        ).toBeNull();
    });

    it("can reopen cleanly after a previous dismissal", () => {
        renderDialog(true);

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        act(() => {
            root.unmount();
        });

        root = createRoot(container);
        renderDialog(true);

        expect(
            document.querySelector('[data-testid="default-completion-dialog"]'),
        ).not.toBeNull();
        expect(announceToScreenReader).toHaveBeenCalledTimes(2);
    });
});