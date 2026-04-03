import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settings-context";
import { LEVEL_START_COUNTDOWN_MS } from "../../lib/constants/game-config";
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

    const millisecondsRemaining = useMemo(() => {
        if (!countdownEndsAt) return LEVEL_START_COUNTDOWN_MS;
        return Math.max(0, countdownEndsAt - now);
    }, [countdownEndsAt, now]);

    const secondsRemaining = useMemo(
        () => Math.max(1, Math.ceil(millisecondsRemaining / 1000)),
        [millisecondsRemaining],
    );

    const countdownProgress = useMemo(() => {
        const elapsed = LEVEL_START_COUNTDOWN_MS - millisecondsRemaining;
        return Math.max(0, Math.min(elapsed / LEVEL_START_COUNTDOWN_MS, 1));
    }, [millisecondsRemaining]);

    const eyebrow = t("transition.getReady", {
        lng: gameplayLanguage,
        defaultValue: "Get ready",
    });
    const chipLabel = t("transition.upNext", {
        lng: gameplayLanguage,
        defaultValue: "Up next",
    });
    const supportLabel = t("transition.startingIn", {
        lng: gameplayLanguage,
        count: secondsRemaining,
        defaultValue: "Starting in {{count}}",
    });

    const announcement = useMemo(
        () =>
            t("accessibility.levelCountdownAnnouncement", {
                lng: gameplayLanguage,
                level: levelLabel,
                count: secondsRemaining,
                defaultValue: "{{level}} starts in {{count}}.",
            }),
        [gameplayLanguage, levelLabel, secondsRemaining, t],
    );

    if (!isVisible) return null;

    const progressStyle = {
        "--countdown-progress": countdownProgress.toFixed(3),
    } as CSSProperties;

    return (
        <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
            data-testid="level-countdown-overlay"
            style={{ zIndex: UI_LAYER_MATRIX.CELEBRATION_OVERLAY }}
        >
            <div
                className="level-countdown-shell w-full max-w-2xl rounded-[2.25rem] px-6 py-8 text-center sm:px-10 sm:py-10"
                style={progressStyle}
            >
                <div className="level-countdown-stars" aria-hidden="true">
                    <span>✦</span>
                    <span>✦</span>
                    <span>✦</span>
                </div>
                <div role="status" aria-live="polite" className="sr-only">
                    {announcement}
                </div>
                <div className="level-countdown-brow">
                    <div className="level-countdown-kicker">{eyebrow}</div>
                    <div className="level-countdown-chip">{chipLabel}</div>
                </div>
                <div
                    key={secondsRemaining}
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
                <div className="level-countdown-support">{supportLabel}</div>
                <div className="level-countdown-progress" aria-hidden="true">
                    <div className="level-countdown-progress-bar" />
                </div>
            </div>
        </div>
    );
};
