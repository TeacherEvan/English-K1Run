import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

// Critical path components only - eager load
import { FallingObject } from './components/FallingObject'
import { GameMenu } from './components/GameMenu'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { PlayerArea } from './components/PlayerArea'
import { TargetDisplay } from './components/TargetDisplay'
import { WelcomeScreen } from './components/WelcomeScreen'
import { Worm } from './components/Worm'

// Lazy load non-critical UI components for better initial load performance
const AchievementDisplay = lazy(() =>
  import('./components/AchievementDisplay').then(m => ({ default: m.AchievementDisplay }))
)
const FairyTransformation = lazy(() =>
  import('./components/FairyTransformation').then(m => ({ default: m.FairyTransformation }))
)
const FireworksDisplay = lazy(() => 
  import('./components/FireworksDisplay').then(m => ({ default: m.FireworksDisplay }))
)
const WormLoadingScreen = lazy(() => 
  import('./components/WormLoadingScreen').then(m => ({ default: m.WormLoadingScreen }))
)

// Lazy load debug components to improve initial load time (dev only)
const EmojiRotationMonitor = lazy(() => 
  import('./components/EmojiRotationMonitor').then(m => ({ default: m.EmojiRotationMonitor }))
)

// Hooks - essential for app functionality
import { useDisplayAdjustment } from './hooks/use-display-adjustment'
import { GAME_CATEGORIES, useGameLogic } from './hooks/use-game-logic'

const BACKGROUND_CLASSES = [
  // Original beautiful backgrounds
  'app-bg-mountain-sunrise',
  'app-bg-ocean-sunset',
  'app-bg-forest-path',
  'app-bg-lavender-field',
  'app-bg-aurora-night',
  // NEW: Nov 2025 - Galaxies, Nature, Architecture, Art
  'app-bg-nebula-galaxy',        // Galaxy: Colorful cosmic nebula
  'app-bg-tropical-waterfall',   // Nature: Lush jungle waterfall
  'app-bg-colorful-buildings',   // Architecture: Burano Italy pastels
  'app-bg-cherry-blossom',       // Nature: Pink cherry blossoms
  'app-bg-starry-art'            // Art: Colorful abstract gallery
]

const pickRandomBackground = (exclude?: string) => {
  const pool = BACKGROUND_CLASSES.filter(bg => bg !== exclude)
  const choices = pool.length > 0 ? pool : BACKGROUND_CLASSES
  const index = Math.floor(Math.random() * choices.length)
  return choices[index]
}

// Request fullscreen on any user interaction
const requestFullscreen = () => {
  const elem = document.documentElement as HTMLElement & {
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        if (import.meta.env.DEV) {
          console.log('[Fullscreen] Error attempting to enable fullscreen:', err)
        }
      })
    } else if (elem.webkitRequestFullscreen) {
      // Safari
      elem.webkitRequestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      // Firefox
      elem.mozRequestFullScreen()
    } else if (elem.msRequestFullscreen) {
      // IE/Edge
      elem.msRequestFullscreen()
    }
  }
}

function App() {
  const {
    displaySettings
  } = useDisplayAdjustment()

  // State declarations must come before hooks that use them
  const [timeRemaining, setTimeRemaining] = useState(10000)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [backgroundClass, setBackgroundClass] = useState(() => pickRandomBackground())
  const [isLoading, setIsLoading] = useState(false) // Loading state between menu and gameplay
  const [showWelcome, setShowWelcome] = useState(true) // Show welcome screen on first load
  const [continuousMode, setContinuousMode] = useState(false) // Continuous play mode

  const {
    gameObjects,
    worms,
    fairyTransforms,
    screenShake,
    gameState,
    currentCategory,
    handleObjectTap,
    handleWormTap,
    startGame,
    resetGame,
    changeTargetToVisibleEmoji,
    achievements,
    clearAchievement
  } = useGameLogic({
    fallSpeedMultiplier: displaySettings.fallSpeed,
    continuousMode 
  })

  // Called when user clicks "Start Game" - show loading screen first
  const handleStartGame = useCallback(() => {
    requestFullscreen()
    setIsLoading(true)
  }, [])

  // Called when loading screen completes - actually start the game
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
    startGame(selectedLevel)
  }, [selectedLevel, startGame])

  // Memoized reset handler to avoid creating new function on every render
  const handleResetGame = useCallback(() => {
    resetGame()
    setBackgroundClass(prev => pickRandomBackground(prev))
  }, [resetGame])

  // Memoized level names to avoid creating new array on every render
  const levelNames = useMemo(() => GAME_CATEGORIES.map(cat => cat.name), [])

  // Handle welcome screen completion
  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false)
  }, [])

  // Handle continuous mode toggle
  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled)
  }, [])

  // Aggressive fullscreen trigger - multiple methods for maximum browser compatibility
  useEffect(() => {
    let fullscreenTriggered = false

    const triggerFullscreen = () => {
      if (!fullscreenTriggered) {
        fullscreenTriggered = true
        requestFullscreen()
      }
    }

    // Method 1: Immediate attempt on any user interaction
    const handleInteraction = () => {
      triggerFullscreen()
      // Keep listeners active for multiple attempts in case first fails
    }

    // Method 2: Try immediately on load (may fail, but worth trying)
    const attemptImmediateFullscreen = () => {
      setTimeout(() => {
        if (!document.fullscreenElement) {
          requestFullscreen()
        }
      }, 100)
    }
    attemptImmediateFullscreen()

    // Method 3: Listen for ALL possible user interactions
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'keypress']
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true })
    })

    // Method 4: Also try when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !document.fullscreenElement) {
        requestFullscreen()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Method 5: Prevent default touch behaviors that interfere with gameplay
    const preventDefaultTouch = (e: TouchEvent) => {
      // Allow natural scrolling on menu, but prevent during gameplay
      if (gameState.gameStarted && e.cancelable) {
        e.preventDefault()
      }
    }

    // Prevent pull-to-refresh and other gestures
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1 && gameState.gameStarted) {
        e.preventDefault() // Prevent multi-finger gestures during gameplay
      }
    }

    // Use passive: false to allow preventDefault
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false })
    document.addEventListener('touchstart', preventMultiTouch, { passive: false })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('touchmove', preventDefaultTouch)
      document.removeEventListener('touchstart', preventMultiTouch)
    }
  }, [gameState.gameStarted])

  useEffect(() => {
    // Only rotate background when NOT in active gameplay to save resources
    if (gameState.gameStarted && !gameState.winner) {
      return
    }

    const interval = setInterval(() => {
      setBackgroundClass(prev => pickRandomBackground(prev))
    }, 20000) // 20 seconds

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner])

  // Background change handled in resetGame() to avoid cascading renders

  // Update time remaining for target display (optimized to 1s interval)
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner || currentCategory.requiresSequence) return

    const interval = setInterval(() => {
      const remaining = gameState.targetChangeTime - Date.now()
      setTimeRemaining(Math.max(0, remaining))
    }, 1000) // Changed from 100ms to 1000ms for better performance

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, gameState.targetChangeTime, currentCategory.requiresSequence])

  // Show welcome screen on first load (after all hooks)
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />
  }

  // Show loading screen between level select and gameplay (after all hooks)
  if (isLoading) {
    return (
      <Suspense fallback={<LoadingSkeleton variant="worm" />}>
        <WormLoadingScreen onComplete={handleLoadingComplete} />
      </Suspense>
    )
  }

  return (
    <>
      <div className={`h-screen overflow-hidden relative app app-bg-animated ${backgroundClass}`}>
        {/* Back to Levels Button - Fixed at top left during gameplay */}
        {gameState.gameStarted && !gameState.winner && (
          <div className="absolute top-4 left-4 z-40">
            <button
              data-testid="back-button"
              onClick={resetGame}
              className="bg-primary/90 hover:bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg transition-all hover:scale-105 backdrop-blur-sm border-2 border-primary-foreground/20"
              style={{
                fontSize: `calc(0.875rem * var(--font-scale, 1))`,
                padding: `calc(0.5rem * var(--spacing-scale, 1)) calc(1rem * var(--spacing-scale, 1))`
              }}
            >
              ← Back to Levels
            </button>
          </div>
        )}

        {/* Target Display - Fixed at top center with responsive sizing */}
        {gameState.gameStarted && !gameState.winner && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-32">
            <TargetDisplay
              currentTarget={gameState.currentTarget}
              targetEmoji={gameState.targetEmoji}
              category={currentCategory}
              timeRemaining={currentCategory.requiresSequence ? undefined : timeRemaining}
              onClick={currentCategory.requiresSequence ? undefined : changeTargetToVisibleEmoji}
            />
          </div>
        )}



        {/* Achievement Displays - Lazy loaded */}
        {achievements.map(achievement => (
          <Suspense key={achievement.id} fallback={null}>
            <AchievementDisplay
              achievement={achievement}
              onDismiss={() => clearAchievement(achievement.id)}
            />
          </Suspense>
        ))}

        {/* Full Screen Game Area */}
        <div className={`h-full ${screenShake ? 'screen-shake' : ''}`}>
          <PlayerArea
            playerNumber={1}
            progress={gameState.progress}
            isWinner={gameState.winner}
          >
            {gameObjects.map(obj => (
              <FallingObject
                key={obj.id}
                object={obj}
                onTap={handleObjectTap}
                playerSide={obj.lane}
              />
            ))}
            {worms.map(worm => (
              <Worm
                key={worm.id}
                worm={worm}
                onTap={handleWormTap}
                playerSide={worm.lane}
              />
            ))}
            {fairyTransforms.map(fairy => (
              <Suspense key={fairy.id} fallback={null}>
                <FairyTransformation fairy={fairy} />
              </Suspense>
            ))}
          </PlayerArea>
        </div>

        {/* Game Menu Overlay */}
        <GameMenu
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          onSelectLevel={setSelectedLevel}
          selectedLevel={selectedLevel}
          levels={levelNames}
          gameStarted={gameState.gameStarted}
          winner={gameState.winner}
          continuousMode={continuousMode}
          onToggleContinuousMode={handleToggleContinuousMode}
        />

        {/* Fireworks Display - Lazy loaded only when winner */}
        {gameState.winner && (
          <Suspense fallback={null}>
            <FireworksDisplay
              isVisible={!!gameState.winner}
              winner={gameState.winner}
            />
          </Suspense>
        )}

        {/* Debug: Emoji Rotation Monitor (dev mode only, lazy loaded) */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <EmojiRotationMonitor />
          </Suspense>
        )}
      </div>
    </>
  )
}

export default App