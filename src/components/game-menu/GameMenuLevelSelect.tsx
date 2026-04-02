import {
    announceToScreenReader,
    createFocusTrap,
    isKeyPressed,
    KeyboardKeys,
    moveFocusToAdjacentElement,
} from "@/lib/accessibility-utils";
import { CLASSROOM_BRAND } from "@/lib/constants/classroom-brand";
import { UI_LAYER_MATRIX } from "@/lib/constants/ui-layer-matrix";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { memo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ArrowLeftIcon } from "./icons";

interface GameMenuLevelSelectProps {
    levels: string[];
    selectedLevel: number;
    levelIcons: string[];
    onSelectLevel: (levelIndex: number) => void;
    onStartGame: () => void;
    onBack: () => void;
}

export const GameMenuLevelSelect = memo(
    ({
        levels,
        selectedLevel,
        levelIcons,
        onSelectLevel,
        onStartGame,
        onBack,
    }: GameMenuLevelSelectProps) => {
        const { t } = useTranslation();
        const modalRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            announceToScreenReader(t("accessibility.levelSelectionOpened"), "polite");
        }, [t]);

        useEffect(() => {
            const selectedName = levels[selectedLevel];
            if (selectedName) {
                announceToScreenReader(
                    t("accessibility.selectedLevel", { level: selectedName }),
                    "polite"
                );
            }
        }, [levels, selectedLevel, t]);

        useEffect(() => {
            if (!modalRef.current) return;
            const cleanup = createFocusTrap(modalRef.current);
            return cleanup;
        }, []);

        const handleKeyDown = useCallback(
            (event: ReactKeyboardEvent<HTMLDivElement>) => {
                if (isKeyPressed(event, KeyboardKeys.ESCAPE)) {
                    event.preventDefault();
                    onBack();
                    return;
                }

                if (isKeyPressed(event, KeyboardKeys.ENTER) || isKeyPressed(event, KeyboardKeys.SPACE)) {
                    event.preventDefault();
                    onStartGame();
                    return;
                }

                if (isKeyPressed(event, KeyboardKeys.ARROW_LEFT) || isKeyPressed(event, KeyboardKeys.ARROW_UP)) {
                    event.preventDefault();
                    moveFocusToAdjacentElement("backward", modalRef.current ?? undefined);
                    return;
                }

                if (isKeyPressed(event, KeyboardKeys.ARROW_RIGHT) || isKeyPressed(event, KeyboardKeys.ARROW_DOWN)) {
                    event.preventDefault();
                    moveFocusToAdjacentElement("forward", modalRef.current ?? undefined);
                }
            },
            [onBack, onStartGame]
        );

        return (
            <div
                className="fixed inset-0 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),rgba(255,250,240,0.95)_28%,rgba(248,250,252,0.96)_100%)] px-4 py-6 pointer-events-auto sm:px-6 sm:py-8 lg:items-center"
                style={{ zIndex: UI_LAYER_MATRIX.MENU_OVERLAY }}
                data-testid="level-select-menu"
                role="dialog"
                aria-modal="true"
                aria-label={t("game.selectLevel")}
                onKeyDown={handleKeyDown}
            >
                <Card
                    ref={modalRef}
                    className="mx-auto flex h-[min(90vh,58rem)] w-full max-w-6xl flex-col overflow-hidden rounded-4xl border border-sky-100 bg-[rgba(255,250,240,0.95)] shadow-[0_28px_80px_rgba(51,65,85,0.16)]"
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-[rgba(255,248,237,0.94)] px-5 py-5 sm:px-8 sm:py-6">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={onBack}
                            className="gap-2 rounded-full px-4 text-lg font-semibold text-slate-700 hover:bg-slate-900/5"
                            data-testid="back-to-menu-button"
                            aria-label={t("game.back")}
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                            <span className="font-bold">{t("game.back")}</span>
                        </Button>
                        <div className="text-center">
                            <div
                                data-testid="level-select-heading-chip"
                                className="mb-3 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-900 shadow-sm"
                            >
                                {CLASSROOM_BRAND.signature}
                            </div>
                            <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.035em] text-slate-900">
                                {t("game.selectLevel")}
                            </h2>
                        </div>
                        <div className="w-12 sm:w-32"></div>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                            {levels.map((level, index) => (
                                <Button
                                    key={level}
                                    variant={selectedLevel === index ? "default" : "outline"}
                                    className={`flex h-40 flex-col gap-3 rounded-3xl border text-xl font-bold whitespace-normal transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none xl:h-48 ${selectedLevel === index
                                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)] ring-4 ring-amber-200/60"
                                        : "bg-[#fffaf0] text-slate-900 shadow-[0_12px_22px_rgba(71,85,105,0.12)] hover:-translate-y-1 hover:border-slate-300 hover:bg-[#f6eee0] hover:shadow-[0_18px_28px_rgba(71,85,105,0.16)]"
                                        }`}
                                    onClick={() => onSelectLevel(index)}
                                    data-testid="level-button"
                                    data-selected={selectedLevel === index}
                                >
                                    <span className="text-5xl md:text-6xl mb-1 filter drop-shadow-sm">
                                        {levelIcons[index]}
                                    </span>
                                    <div className="flex flex-col items-center w-full px-2">
                                        <span className="w-full wrap-break-word text-center text-lg leading-tight md:text-xl">
                                            {level}
                                        </span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Fixed properties */}
                    <div className="flex shrink-0 justify-center border-t border-slate-200/70 bg-[rgba(255,248,237,0.8)] px-5 py-5 sm:px-8 sm:py-6">
                        <Button
                            size="lg"
                            className="h-20 w-full max-w-md rounded-[1.75rem] bg-emerald-600 text-[clamp(1.5rem,3vw,2.25rem)] font-black text-white shadow-[0_18px_30px_rgba(22,163,74,0.22)] hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_22px_36px_rgba(22,163,74,0.24)]"
                            onClick={onStartGame}
                            data-testid="start-button"
                            aria-label={t("game.startGame")}
                        >
                            {t("game.startGame")}
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuLevelSelect.displayName = "GameMenuLevelSelect";
