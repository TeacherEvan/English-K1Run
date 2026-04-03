import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settings-context";
import { LEVEL_COMPLETE_POPUP_MS } from "../../lib/constants/game-config";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";

interface LevelCompletePopupProps {
    isVisible: boolean;
    onDismiss?: () => void;
}

export const LevelCompletePopup = ({
    isVisible,
    onDismiss,
}: LevelCompletePopupProps) => {
    const { t } = useTranslation();
    const { gameplayLanguage } = useSettings();
    const announcement = t("accessibility.levelCompleteAnnouncement", {
        lng: gameplayLanguage,
        defaultValue: "Level complete! Next level is getting ready.",
    });

    useEffect(() => {
        if (!isVisible || !onDismiss) return;

        const timeout = window.setTimeout(onDismiss, LEVEL_COMPLETE_POPUP_MS);
        return () => window.clearTimeout(timeout);
    }, [isVisible, onDismiss]);

    if (!isVisible) return null;

    return (
        <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-[14svh] flex justify-center px-4"
            data-testid="level-complete-popup"
            style={{ zIndex: UI_LAYER_MATRIX.HUD_CRITICAL }}
        >
            <div className="w-full max-w-md rounded-4xl border border-[color-mix(in_oklch,var(--accent)_40%,transparent)] bg-[color-mix(in_oklch,var(--background)_86%,oklch(0.96_0.04_95))] px-6 py-5 text-center shadow-[0_24px_60px_oklch(0.45_0.09_65_/_0.18)] backdrop-blur-md">
                <div role="status" aria-live="polite" className="sr-only">
                    {announcement}
                </div>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[color-mix(in_oklch,var(--foreground)_56%,var(--accent))]">
                    {t("transition.upNext", {
                        lng: gameplayLanguage,
                        defaultValue: "Up next",
                    })}
                </div>
                <div className="text-3xl font-black tracking-[-0.04em] text-[color-mix(in_oklch,var(--foreground)_94%,oklch(0.5_0.07_70))] sm:text-4xl">
                    {t("transition.levelCompleteTitle", {
                        lng: gameplayLanguage,
                        defaultValue: "Level complete!",
                    })}
                </div>
                <div className="mt-2 text-sm font-medium text-[color-mix(in_oklch,var(--foreground)_72%,var(--accent))] sm:text-base">
                    {t("transition.levelCompleteDescription", {
                        lng: gameplayLanguage,
                        defaultValue: "Next level is getting ready.",
                    })}
                </div>
                <div aria-hidden="true" className="mt-3 text-2xl opacity-70">
                    ✨ 🐢 ✨
                </div>
            </div>
        </div>
    );
};
