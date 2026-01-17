import { memo } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { THAI_TRANSLATIONS } from "./constants";
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
        return (
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in slide-in-from-right-8 duration-300"
                data-testid="level-select-menu"
                role="dialog"
                aria-label="Level Selection Menu"
            >
                <Card className="w-full max-w-6xl mx-4 bg-card/95 border-4 border-primary/20 shadow-2xl h-[90vh] flex flex-col">
                    {/* Header - Fixed properties */}
                    <div className="flex items-center justify-between px-8 py-6 border-b bg-card rounded-t-xl shrink-0">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={onBack}
                            className="gap-2 text-xl hover:bg-primary/10"
                            data-testid="back-to-menu-button"
                            aria-label="Back to Main Menu"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold">Back</span>
                                <span className="text-xs font-normal opacity-70 font-thai">
                                    กลับ
                                </span>
                            </div>
                        </Button>
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                Select Level
                            </h2>
                            <h3 className="text-lg md:text-xl text-primary/70 font-thai">
                                เลือกระดับ
                            </h3>
                        </div>
                        {/* Spacer to balance the header visually */}
                        <div className="w-32"></div>
                    </div>

                    {/* Level Grid - Scrollable Area */}
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
                                        <span className="text-sm font-normal opacity-80 font-thai text-center w-full truncate mt-1">
                                            {THAI_TRANSLATIONS[index] || ""}
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
                            aria-label="Start Game with Selected Level"
                        >
                            START GAME / เริ่มเกม
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuLevelSelect.displayName = "GameMenuLevelSelect";
