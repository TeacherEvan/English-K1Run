import { lazy, memo, Suspense, useMemo, useState } from "react";
import { useSettings } from "../context/settings-context";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import { LEVEL_ICON_FALLBACKS } from "./game-menu/constants";
import { formatBestTime } from "../lib/utils";

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
 * GameMenu - Overhauled Homescreen (Dec 2025)
 * 
 * Features:
 * - Responsive "Homescreen" layout
 * - Interactive Level Grid with Dynamic Icons
 * - SVGs for all UI elements
 * - Accessible Dialogs for Settings/Credits
 * - Mobile-first grid adaptations
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

  const levelIcons = useMemo(() => {
    return levels.map((_, index) => {
      const emoji = GAME_CATEGORIES[index]?.items?.[0]?.emoji
      return emoji || LEVEL_ICON_FALLBACKS[index] || '🎮'
    })
  }, [levels])

  if (gameStarted && !winner) return null

  // TODO: [OPTIMIZATION] Consider implementing error boundaries for lazy-loaded components to handle potential loading failures gracefully.

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {view === 'main' ? (
        <GameMenuHome
          formattedBestTime={formattedBestTime}
          continuousMode={continuousMode}
          resolutionScale={resolutionScale}
          setResolutionScale={setResolutionScale}
          onStartGame={onStartGame}
          onShowLevels={() => setView('levels')}
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
          onBack={() => setView('main')}
        />
      )}
    </Suspense>
  )
})
