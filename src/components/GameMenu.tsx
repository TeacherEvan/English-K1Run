import { memo, useCallback, useMemo, useState } from "react";
import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
import { useSettings } from "../context/settings-context";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import type { GamePhase } from "../types/game";
import { ErrorBoundary } from "./ErrorBoundary";
import { LEVEL_ICON_FALLBACKS } from "./game-menu/constants";
import "./game-menu/game-menu-adaptive.css";
import "./game-menu/game-menu-compact.css";
import "./game-menu/game-menu-storybook-motion.css";
import "./game-menu/game-menu-storybook-scene.css";
import "./game-menu/game-menu-storybook-surfaces.css";
import "./game-menu/game-menu-language-spotlight.css";
import "./game-menu/game-menu-ultrawide.css";
import { GameMenuHome } from "./game-menu/GameMenuHome";
import { GameMenuLevelSelect } from "./game-menu/GameMenuLevelSelect";

interface GameMenuProps {
  onStartGame: () => void
  onSelectLevel: (levelIndex: number) => void
  selectedLevel: number
  levels: string[]
  gameStarted: boolean
  winner: boolean
  phase?: GamePhase
  initialView?: 'main' | 'levels'
  continuousMode?: boolean
  onToggleContinuousMode?: (enabled: boolean) => void
  onResetGame?: () => void
  bestTargetTotal?: number
  highScores?: ChallengeModeHighScoreEntry[]
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
  phase,
  initialView = 'main',
  continuousMode = false,
  onToggleContinuousMode,
  onResetGame,
  bestTargetTotal = 0,
  highScores = []
}: GameMenuProps) => {
  // Extract current display resolution scale and updater from settings context
  const { resolutionScale, setResolutionScale } = useSettings()

  const [view, setView] = useState<'main' | 'levels'>(initialView)
  const [languageDiscoveryActive, setLanguageDiscoveryActive] = useState(true)

  const formattedBestTargetTotal = useMemo(
    () => new Intl.NumberFormat().format(bestTargetTotal),
    [bestTargetTotal],
  )

  // Memoize level icons computation for better performance
  const levelIcons = useMemo(() => {
    return levels.map((_, index) => {
      const emoji = GAME_CATEGORIES[index]?.items?.[0]?.emoji
      return emoji || LEVEL_ICON_FALLBACKS[index] || '🎮'
    })
  }, [levels])

  // Memoize view transition handlers to prevent unnecessary re-renders
  const handleShowLevels = useCallback(() => {
    setView('levels')
  }, [])
  const handleBackToMain = useCallback(() => {
    setView('main')
  }, [])
  const handleLanguageDiscoverySeen = useCallback(() => {
    setLanguageDiscoveryActive(false)
  }, [])

  const isRunComplete = winner && (phase ?? 'runComplete') === 'runComplete'

  if (gameStarted && !isRunComplete) return null

  return (
    <ErrorBoundary>
      {view === 'main' ? (
        <GameMenuHome
          formattedBestTargetTotal={formattedBestTargetTotal}
          highScores={highScores}
          continuousMode={continuousMode}
          languageDiscoveryActive={languageDiscoveryActive}
          resolutionScale={resolutionScale}
          setResolutionScale={setResolutionScale}
          onLanguageDiscoverySeen={handleLanguageDiscoverySeen}
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
    </ErrorBoundary>
  )
})