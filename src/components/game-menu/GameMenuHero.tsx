import { useTranslation } from "react-i18next";

import { CLASSROOM_BRAND } from "@/lib/constants/classroom-brand";

import { TrophyIcon } from "./icons";

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
        <div className="menu-home-hero flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <div
                data-testid="menu-brand-pill"
                className="menu-home-brand-pill inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-900 shadow-sm"
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

            <div className="menu-home-copy space-y-3">
                <h1
                    className="menu-home-heading text-[clamp(2.9rem,5.8vw,4.85rem)] font-black leading-[0.95] tracking-[-0.045em] text-slate-900"
                    data-testid="game-title"
                >
                    {t("game.title")}
                </h1>
                <p className="menu-home-instructions mx-auto max-w-[24rem] text-[clamp(1.02rem,2vw,1.22rem)] font-medium leading-[1.45] text-slate-700 lg:mx-0">
                    {t("menu.instructions")}
                </p>
            </div>

            <div
                data-testid="menu-best-time-card"
                className="menu-best-time-card mt-2 w-full max-w-sm rounded-[1.75rem] border border-amber-300/70 bg-[#4b4233]/96 p-5 shadow-[0_18px_46px_rgba(120,87,23,0.22)]"
            >
                <div className="flex flex-col items-center">
                    <div className="mb-2 flex items-center gap-2.5">
                        <TrophyIcon className="h-5 w-5 text-amber-300" />
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200/90">
                            {t("game.totalTargetsDestroyed")}
                        </span>
                    </div>
                    <div className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold tracking-[-0.04em] text-amber-300 tabular-nums">
                        {formattedBestTargetTotal}
                    </div>
                    {continuousMode ? (
                        <div className="mt-3 rounded-full border border-emerald-300/25 bg-emerald-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
                            {t("game.continuousMode")}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
