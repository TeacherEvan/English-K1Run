import { memo, useState } from "react";
import type { ResolutionScale } from "../../context/settings-context";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { LanguageSelector } from "../ui/language-selector";
import { DISPLAY_SCALE_OPTIONS } from "./constants";
import {
    CheckIcon,
    GridIcon,
    InfoIcon,
    LogOutIcon,
    PlayIcon,
    SettingsIcon,
    TrophyIcon,
} from "./icons";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuHomeProps {
    formattedBestTime: string;
    continuousMode: boolean;
    resolutionScale: ResolutionScale;
    setResolutionScale: (scale: ResolutionScale) => void;
    onStartGame: () => void;
    onShowLevels: () => void;
    onToggleContinuousMode?: (enabled: boolean) => void;
    onResetGame?: () => void;
}

export const GameMenuHome = memo(
    ({
        formattedBestTime,
        continuousMode,
        resolutionScale,
        setResolutionScale,
        onStartGame,
        onShowLevels,
        onToggleContinuousMode,
        onResetGame,
    }: GameMenuHomeProps) => {
        const [showExitDialog, setShowExitDialog] = useState(false);

        const handleExit = () => {
            setShowExitDialog(true);
        };

        const confirmExit = () => {
            setShowExitDialog(false);
            onResetGame?.();
            try {
                window.close();
            } catch {
                console.log("[GameMenu] window.close() blocked by browser");
            }
        };

        return (
            <div
                className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
                data-testid="game-menu"
            >
                <Card className="w-full max-w-4xl mx-4 p-8 bg-card/50 border-4 border-primary/20 shadow-2xl backdrop-blur-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Left Column: Title & Mascot */}
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="text-8xl animate-bounce cursor-default select-none filter drop-shadow-lg">
                                🐢
                            </div>
                            <div className="space-y-2">
                                <h1
                                    className="text-4xl md:text-5xl font-bold text-primary tracking-tight drop-shadow-sm"
                                    data-testid="game-title"
                                >
                                    Kindergarten Race
                                </h1>
                                <h2 className="text-2xl md:text-3xl font-semibold text-primary/80 font-thai">
                                    การแข่งขันอนุบาล
                                </h2>
                            </div>

                            {/* Best Times Display */}
                            <div className="mt-8 p-6 bg-black/80 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-xs transform hover:scale-105 transition-transform duration-300 group">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrophyIcon className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
                                        <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">
                                            Best Time
                                        </span>
                                    </div>
                                    <div
                                        className="text-4xl font-mono font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors"
                                        style={{ textShadow: "0 0 20px rgba(234,179,8,0.6)" }}
                                    >
                                        {formattedBestTime}
                                    </div>
                                    {continuousMode && (
                                        <div className="mt-2 text-xs text-white/60 bg-green-900/50 px-2 py-1 rounded-full border border-green-500/30">
                                            Continuous Mode
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Menu Actions */}
                        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                            {/* 1. START GAME Button */}
                            <Button
                                size="lg"
                                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 hover:shadow-primary/25 transition-all duration-200 gap-4 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onStartGame}
                                data-testid="start-game-button"
                                aria-label="Start Game Immediately"
                            >
                                <MenuActionButtonContent
                                    icon={<PlayIcon className="w-6 h-6 fill-current" />}
                                    iconWrapperClassName="p-2 bg-white/20 rounded-full"
                                    title="Start Game"
                                    subtitle="เริ่มเกม"
                                />
                            </Button>

                            {/* 2. LEVEL SELECT Button */}
                            <Button
                                variant="default"
                                size="lg"
                                className="h-16 text-xl font-bold shadow-md hover:scale-105 transition-all duration-200 gap-4"
                                onClick={onShowLevels}
                                data-testid="level-select-button"
                                aria-label="Go to Level Selection"
                            >
                                <MenuActionButtonContent
                                    icon={<GridIcon className="w-6 h-6" />}
                                    title="Level Select"
                                    subtitle="เลือกระดับ"
                                />
                            </Button>

                            {/* 3. SETTINGS Button (includes Language) */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-16 text-xl font-semibold justify-start px-8 gap-4 hover:bg-primary/5 border-2"
                                        data-testid="settings-button"
                                    >
                                        <MenuActionButtonContent
                                            icon={<SettingsIcon className="w-6 h-6 text-primary" />}
                                            title="Settings"
                                            subtitle="การตั้งค่า"
                                            subtitleClassName="text-xs font-normal opacity-70 font-thai mt-1"
                                        />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl flex items-center gap-2">
                                            <SettingsIcon className="w-6 h-6" />
                                            Settings / การตั้งค่า
                                        </DialogTitle>
                                        <DialogDescription>
                                            Configure your game experience
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-6 space-y-6">
                                        <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card/50">
                                            <div>
                                                <h4 className="font-medium leading-none mb-3">
                                                    Language
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Select gameplay language and voiceovers
                                                </p>
                                                <LanguageSelector showLabel={false} className="w-full" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 p-4 rounded-lg border bg-card/50">
                                            <div>
                                                <h4 className="font-medium leading-none mb-2">
                                                    Display Scale
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Adjust UI size for your screen
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {DISPLAY_SCALE_OPTIONS.map((option) => (
                                                    <Button
                                                        key={option.id}
                                                        variant={
                                                            resolutionScale === option.id
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        onClick={() =>
                                                            setResolutionScale(option.id as ResolutionScale)
                                                        }
                                                        aria-pressed={resolutionScale === option.id}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                            <div className="space-y-1">
                                                <h4 className="font-medium leading-none">
                                                    Continuous Mode
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Play without winning/stopping
                                                </p>
                                            </div>
                                            <Button
                                                variant={continuousMode ? "default" : "outline"}
                                                onClick={() =>
                                                    onToggleContinuousMode?.(!continuousMode)
                                                }
                                                className={
                                                    continuousMode ? "bg-green-600 hover:bg-green-700" : ""
                                                }
                                                aria-pressed={continuousMode}
                                            >
                                                {continuousMode ? (
                                                    <CheckIcon className="w-4 h-4 mr-2" />
                                                ) : null}
                                                {continuousMode ? "On" : "Off"}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* 4. EXIT Button */}
                            <Button
                                variant="destructive"
                                size="lg"
                                className="h-14 text-lg font-semibold justify-start px-8 gap-4 mt-2"
                                onClick={handleExit}
                                data-testid="exit-button"
                            >
                                <MenuActionButtonContent
                                    icon={<LogOutIcon className="w-5 h-5" />}
                                    title="Exit"
                                    subtitle="ออก"
                                    subtitleClassName="text-xs font-normal opacity-70 font-thai mt-0.5"
                                />
                            </Button>

                            {/* Credits (Small Link) */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="text-center mt-2">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-muted-foreground/60 h-auto p-0 text-xs"
                                        >
                                            Credits / เครดิต
                                        </Button>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl flex items-center gap-2">
                                            <InfoIcon className="w-6 h-6" />
                                            Credits / เครดิต
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="py-8 text-center space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground uppercase tracking-widest">
                                                Created By
                                            </p>
                                            <h3 className="text-2xl font-bold text-primary">
                                                TEACHER EVAN
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground uppercase tracking-widest">
                                                In Association With
                                            </p>
                                            <h3 className="text-xl font-bold text-orange-500">
                                                SANGSOM KINDERGARTEN
                                            </h3>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-xl">
                                            <p className="text-sm font-semibold mb-2">
                                                SPECIAL THANKS TO
                                            </p>
                                            <p className="text-lg">TEACHER MIKE AND TEACHER LEE</p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Exit Confirmation Dialog */}
                            <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
                                            <LogOutIcon className="w-6 h-6" />
                                            Exit Game / ออกจากเกม
                                        </DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to exit? / คุณแน่ใจหรือไม่ว่าต้องการออก?
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex gap-4 justify-end mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowExitDialog(false)}
                                            autoFocus
                                        >
                                            Cancel / ยกเลิก
                                        </Button>
                                        <Button variant="destructive" onClick={confirmExit}>
                                            Exit / ออก
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuHome.displayName = "GameMenuHome";
