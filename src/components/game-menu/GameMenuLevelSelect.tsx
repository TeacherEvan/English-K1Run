import {
    announceToScreenReader,
    createFocusTrap,
    isKeyPressed,
    KeyboardKeys,
    moveFocusToAdjacentElement,
} from "@/lib/accessibility-utils";
import { UI_LAYER_MATRIX } from "@/lib/constants/ui-layer-matrix";
import { measureComponentRenderTime } from "@/lib/performance-monitor-utils";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
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
        const stopRenderMeasurement = useMemo(
            () => measureComponentRenderTime("GameMenuLevelSelect"),
            []
        );

        useEffect(() => {
            const duration = stopRenderMeasurement();
            if (import.meta.env.DEV && duration !== null) {
                console.log(
                    `[Performance] GameMenuLevelSelect rendered in ${duration.toFixed(2)}ms`
                );
            }
        }, [stopRenderMeasurement]);

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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in slide-in-from-right-8 duration-300 pointer-events-auto"
                style={{ zIndex: UI_LAYER_MATRIX.MENU_OVERLAY }}
                data-testid="level-select-menu"
                role="dialog"
                aria-modal="true"
                aria-label={t("game.selectLevel")}
                onKeyDown={handleKeyDown}
            >
                <Card
                    ref={modalRef}
                    className="w-full max-w-6xl mx-4 bg-card/95 border-4 border-primary/20 shadow-2xl h-[90vh] flex flex-col"
                >
                    <div className="flex items-center justify-between px-8 py-6 border-b bg-card rounded-t-xl shrink-0">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={onBack}
                            className="gap-2 text-xl hover:bg-primary/10"
                            data-testid="back-to-menu-button"
                            aria-label={t("game.back")}
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                            <span className="font-bold">{t("game.back")}</span>
                        </Button>
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                {t("game.selectLevel")}
                            </h2>
                        </div>
                        <div className="w-32"></div>
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {levels.map((level, index) => (
                                <Button
                                    key={level}
                                    variant={selectedLevel === index ? "default" : "outline"}
                                    className={`h-40 xl:h-48 text-xl font-bold flex flex-col gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95 whitespace-normal ${selectedLevel === index
                                        ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30"
                                        : "hover:border-primary/50 hover:shadow-md bg-card"
                                        }`}
                                    onClick={() => onSelectLevel(index)}
                                    data-testid="level-button"
                                    data-selected={selectedLevel === index}
                                >
                                    <span className="text-5xl md:text-6xl mb-1 filter drop-shadow-sm">
                                        {levelIcons[index]}
                                    </span>
                                    <div className="flex flex-col items-center w-full px-2">
                                        <span className="text-center w-full truncate text-lg md:text-xl">
                                            {level}
                                        </span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Fixed properties */}
                    <div className="px-8 py-6 border-t bg-card/50 rounded-b-xl flex justify-center shrink-0">
                        <Button
                            size="lg"
                            className="w-full max-w-md h-20 text-3xl font-bold shadow-xl animate-pulse hover:animate-none hover:scale-105 transition-transform bg-linear-to-r from-primary to-primary/80"
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
