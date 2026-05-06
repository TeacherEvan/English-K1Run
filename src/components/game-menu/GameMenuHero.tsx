import { useTranslation } from "react-i18next";

import { CLASSROOM_BRAND } from "@/lib/constants/classroom-brand";

import { TrophyIcon } from "./icons";
import {
    MENU_BRAND_PILL_CLASS,
    MENU_BRAND_PILL_STYLE,
    MENU_HERO_BODY_CLASS,
    MENU_HERO_BODY_STYLE,
    MENU_HERO_COPY_CLASS,
    MENU_HERO_HEADING_CLASS,
    MENU_HERO_HEADING_STYLE,
    MENU_SCORE_CARD_CLASS,
    MENU_SCORE_CARD_STYLE,
    MENU_SCORE_ICON_STYLE,
    MENU_SCORE_LABEL_CLASS,
    MENU_SCORE_LABEL_STYLE,
    MENU_SCORE_VALUE_CLASS,
    MENU_SCORE_VALUE_STYLE,
    MENU_MODE_BADGE_CLASS,
    MENU_MODE_BADGE_STYLE,
} from "./menu-surface-theme";

interface GameMenuHeroProps {
    formattedBestTargetTotal: string;
    continuousMode: boolean;
}

const TRAIL_STEPS = ["one", "two", "three"] as const;

export function GameMenuHero({
    formattedBestTargetTotal,
    continuousMode,
}: GameMenuHeroProps) {
    const { t } = useTranslation();

    return (
        <div className="menu-home-hero flex flex-col items-start gap-5 text-left">
            <div
                data-testid="menu-brand-pill"
                className={MENU_BRAND_PILL_CLASS}
                style={MENU_BRAND_PILL_STYLE}
            >
                {CLASSROOM_BRAND.signature}
            </div>

            <div className="menu-storybook-stage" aria-hidden="true">
                <span className="menu-storybook-sun" />
                <span className="menu-storybook-cloud menu-storybook-cloud--one" />
                <span className="menu-storybook-cloud menu-storybook-cloud--two" />
                <span className="menu-storybook-hill menu-storybook-hill--back" />
                <span className="menu-storybook-hill menu-storybook-hill--mid" />
                <span className="menu-storybook-hill menu-storybook-hill--front" />
                <span className="menu-storybook-path" />
                {TRAIL_STEPS.map((step) => (
                    <span
                        key={step}
                        className={`menu-storybook-step menu-storybook-step--${step}`}
                    />
                ))}
                <div className="menu-storybook-mascot">
                    <div className="menu-home-mascot cursor-default select-none text-[clamp(4.75rem,10vw,7rem)] leading-none drop-shadow-[0_12px_20px_rgba(71,85,105,0.18)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transform-none">
                        🐢
                    </div>
                </div>
            </div>

            <div className="menu-home-summary grid w-full max-w-[38rem] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(13.5rem,15.5rem)] lg:items-end">
                <div className={MENU_HERO_COPY_CLASS}>
                    <h1
                        className={MENU_HERO_HEADING_CLASS}
                        style={MENU_HERO_HEADING_STYLE}
                        data-testid="game-title"
                    >
                        {t("game.title")}
                    </h1>
                    <p className={MENU_HERO_BODY_CLASS} style={MENU_HERO_BODY_STYLE}>
                        {t("menu.instructions")}
                    </p>
                </div>

                <div
                    data-testid="menu-best-time-card"
                    className={MENU_SCORE_CARD_CLASS}
                    style={MENU_SCORE_CARD_STYLE}
                >
                    <div className="flex flex-col items-start">
                        <div className="mb-2 flex items-center gap-2.5">
                            <TrophyIcon className="h-5 w-5" style={MENU_SCORE_ICON_STYLE} />
                            <span className={MENU_SCORE_LABEL_CLASS} style={MENU_SCORE_LABEL_STYLE}>
                                {t("game.totalTargetsDestroyed")}
                            </span>
                        </div>
                        <div className={MENU_SCORE_VALUE_CLASS} style={MENU_SCORE_VALUE_STYLE}>
                            {formattedBestTargetTotal}
                        </div>
                        {continuousMode ? (
                            <div className={MENU_MODE_BADGE_CLASS} style={MENU_MODE_BADGE_STYLE}>
                                {t("game.continuousMode")}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
