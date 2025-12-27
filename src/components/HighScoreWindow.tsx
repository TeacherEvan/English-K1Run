import { memo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HighScoreWindowProps {
    lastTime: number | null;
    highScore: number | null;
    onClose: () => void;
}

export const HighScoreWindow = memo(({ lastTime, highScore, onClose }: HighScoreWindowProps) => {
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <Card className="p-8 max-w-md mx-4 text-center bg-card shadow-2xl border-4 border-primary/20 animate-in zoom-in duration-500">
                <div className="mb-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Continuous Mode Complete!</h1>
                    <p className="text-muted-foreground">You completed all levels!</p>
                </div>

                <div className="space-y-4 mb-6">
                    {lastTime !== null && (
                        <div className="bg-primary/10 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Your Time</div>
                            <div className="text-2xl font-bold text-primary">{formatTime(lastTime)}</div>
                        </div>
                    )}

                    {highScore !== null && (
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">High Score</div>
                            <div className="text-2xl font-bold text-secondary-foreground">{formatTime(highScore)}</div>
                        </div>
                    )}

                    {lastTime !== null && highScore !== null && lastTime === highScore && (
                        <div className="text-sm text-green-600 font-semibold">🎉 New High Score!</div>
                    )}
                </div>

                <Button onClick={onClose} size="lg" className="w-full">
                    Continue Playing
                </Button>
            </Card>
        </div>
    );
});

HighScoreWindow.displayName = 'HighScoreWindow';