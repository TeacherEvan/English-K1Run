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
            <div className="w-full max-w-md rounded-4xl border border-amber-200/80 bg-[rgba(255,250,240,0.96)] px-6 py-5 text-center shadow-[0_24px_60px_rgba(120,53,15,0.18)] backdrop-blur-md">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-amber-700/80">
                    {t("messages.victoryTitle", { lng: gameplayLanguage })}
                </div>
                <div className="text-3xl font-black tracking-[-0.04em] text-amber-950 sm:text-4xl">
                    {t("messages.completionTitle", { lng: gameplayLanguage })}
                </div>
                <div className="mt-2 text-sm font-medium text-amber-900/75 sm:text-base">
                    {t("messages.completionDescription", { lng: gameplayLanguage })}
                </div>
                <div aria-hidden="true" className="mt-3 text-2xl opacity-70">
                    ✨ 🐢 ✨
                </div>
            </div>
        </div>
    );
};
