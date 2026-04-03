import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settings-context";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import "./level-countdown.css";

interface LevelCountdownOverlayProps {
    isVisible: boolean;
    countdownEndsAt: number | null;
    levelLabel: string;
}

export const LevelCountdownOverlay = ({
    isVisible,
    countdownEndsAt,
    levelLabel,
}: LevelCountdownOverlayProps) => {
    const { t } = useTranslation();
    const { gameplayLanguage } = useSettings();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isVisible) return;

        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 250);

        return () => window.clearInterval(interval);
    }, [isVisible]);

    const secondsRemaining = useMemo(() => {
        if (!countdownEndsAt) return 5;
        return Math.max(1, Math.ceil((countdownEndsAt - now) / 1000));
    }, [countdownEndsAt, now]);

    const announcement = useMemo(
        () =>
            `${t("accessibility.selectedLevel", {
                lng: gameplayLanguage,
                level: levelLabel,
            })}. ${t("welcome.readyContinue", { lng: gameplayLanguage })}.`,
        [gameplayLanguage, levelLabel, t],
    );

    if (!isVisible) return null;

    return (
        <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
            data-testid="level-countdown-overlay"
            style={{ zIndex: UI_LAYER_MATRIX.CELEBRATION_OVERLAY }}
        >
            <div className="level-countdown-shell w-full max-w-2xl rounded-[2.25rem] px-6 py-8 text-center sm:px-10 sm:py-10">
                <div className="level-countdown-stars" aria-hidden="true">
                    <span>✦</span>
                    <span>✦</span>
                    <span>✦</span>
                </div>
                <div role="status" aria-live="polite" className="sr-only">
                    {announcement}
                </div>
                <div className="level-countdown-kicker mb-3 text-sm font-black uppercase tracking-[0.24em] text-sky-900/70">
                    {t("welcome.readyContinue", { lng: gameplayLanguage })}
                </div>
                <div
                    className="level-countdown-value"
                    data-testid="level-countdown-value"
                >
                    {secondsRemaining}
                </div>
                <div
                    className="level-countdown-label mt-3 text-balance text-lg font-bold text-slate-900 sm:text-2xl"
                    data-testid="level-countdown-label"
                >
                    {levelLabel}
                </div>
            </div>
        </div>
    );
};
