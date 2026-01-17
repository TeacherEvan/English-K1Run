import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { useSettings } from "../context/settings-context";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import { LEVEL_ICON_FALLBACKS } from "./game-menu/constants";
import { formatBestTime } from "../lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";

const GameMenuHome = lazy(() => import("./game-menu/GameMenuHome").then(module => ({ default: module.GameMenuHome })));
const GameMenuLevelSelect = lazy(() => import("./game-menu/GameMenuLevelSelect").then(module => ({ default: module.GameMenuLevelSelect })));

interface GameMenuProps {
  onStartGame: () => void
  onSelectLevel: (levelIndex: number) => void
  selectedLevel: number
  levels: string[]
  gameStarted: boolean
  winner: boolean
  initialView?: 'main' | 'levels'
  continuousMode?: boolean
  onToggleContinuousMode?: (enabled: boolean) => void
  onResetGame?: () => void
  bestTime?: number
}

/**
 * GameMenu - Overhauled Homescreen (Jan 2026)
 *
 * Features:
 * - Responsive "Homescreen" layout
 * - Interactive Level Grid with Dynamic Icons
 * - SVGs for all UI elements
 * - Accessible Dialogs for Settings/Credits
 * - Mobile-first grid adaptations
 * - Error boundaries for robust lazy loading
 */
export const GameMenu = memo(({
  onStartGame,
  onSelectLevel,
  selectedLevel,
  levels,
  gameStarted,
  winner,
  initialView = 'main',
  continuousMode = false,
  onToggleContinuousMode,
  onResetGame,
  bestTime = 0
}: GameMenuProps) => {
  // Extract current display resolution scale and updater from settings context
  const { resolutionScale, setResolutionScale } = useSettings()

  const [view, setView] = useState<'main' | 'levels'>(initialView)

  // Memoize time formatting
  const formattedBestTime = useMemo(() => formatBestTime(bestTime), [bestTime])

  // Memoize level icons computation for better performance
  const levelIcons = useMemo(() => {
    return levels.map((_, index) => {
      const emoji = GAME_CATEGORIES[index]?.items?.[0]?.emoji
      return emoji || LEVEL_ICON_FALLBACKS[index] || '🎮'
    })
  }, [levels])

  // Memoize view transition handlers to prevent unnecessary re-renders
  const handleShowLevels = useCallback(() => setView('levels'), [])
  const handleBackToMain = useCallback(() => setView('main'), [])

  if (gameStarted && !winner) return null

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading game menu...</p>
          </div>
        </div>
      }>
        {view === 'main' ? (
          <GameMenuHome
            formattedBestTime={formattedBestTime}
            continuousMode={continuousMode}
            resolutionScale={resolutionScale}
            setResolutionScale={setResolutionScale}
            onStartGame={onStartGame}
            onShowLevels={handleShowLevels}
            onToggleContinuousMode={onToggleContinuousMode}
            onResetGame={onResetGame}
          />
        ) : (
          <GameMenuLevelSelect
            levels={levels}
            selectedLevel={selectedLevel}
            levelIcons={levelIcons}
            onSelectLevel={onSelectLevel}
            onStartGame={onStartGame}
            onBack={handleBackToMain}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  )
})