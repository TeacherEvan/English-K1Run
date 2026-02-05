/**
 * Levels tab content for the home window.
 * Starts gameplay and toggles continuous mode.
 */
import type { TabProps } from '@/components/home-window/HomeWindow.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { errorReporter } from '@/lib/error-reporter'
import { memo, useCallback } from 'react'

export const LevelsTab = memo(({
    levels,
    continuousMode,
    onStartGame,
    onToggleContinuousMode,
}: Pick<TabProps, 'levels' | 'continuousMode' | 'onStartGame' | 'onToggleContinuousMode'>) => {
    const handleStartGame = useCallback(
        (index: number) => {
            try {
                onStartGame(index, continuousMode)
            } catch (error) {
                errorReporter.reportError(
                    error instanceof Error ? error : new Error(String(error)),
                    'game-logic',
                    { levelIndex: index, continuousMode },
                )
            }
        },
        [onStartGame, continuousMode],
    )

    const handleToggleMode = useCallback(
        (enabled: boolean) => {
            try {
                onToggleContinuousMode?.(enabled)
            } catch (error) {
                errorReporter.reportError(
                    error instanceof Error ? error : new Error(String(error)),
                    'settings',
                    { continuousMode: enabled },
                )
            }
        },
        [onToggleContinuousMode],
    )

    if (levels.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    No levels available. Please check your game configuration.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Select Level</h2>
                <p className="text-muted-foreground">Choose a level to start playing</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {levels.map((name, index) => (
                    <Button
                        key={`level-${index}-${name}`}
                        onClick={() => handleStartGame(index)}
                        variant="outline"
                        size="lg"
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-200"
                        aria-label={`Start level ${index + 1}: ${name}`}
                    >
                        <Badge variant="secondary" className="text-xs">
                            Level {index + 1}
                        </Badge>
                        <span className="font-semibold truncate max-w-full">{name}</span>
                    </Button>
                ))}
            </div>

            {onToggleContinuousMode && (
                <div className="flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20 hover:bg-primary/10 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={continuousMode}
                            onChange={(e) => handleToggleMode(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-primary/40 text-primary cursor-pointer focus:ring-2 focus:ring-primary/50"
                            aria-label="Toggle continuous play mode"
                        />
                        <span className="font-semibold text-foreground">🔄 Continuous Play Mode</span>
                    </label>
                </div>
            )}
        </div>
    )
})

LevelsTab.displayName = 'LevelsTab'
