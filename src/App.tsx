import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

// Critical path components only - eager load for gameplay responsiveness
import { FallingObject } from './components/FallingObject'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { PlayerArea } from './components/PlayerArea'
import { TargetDisplay } from './components/TargetDisplay'
import { Worm } from './components/Worm'

// Lazy load non-critical UI components for better initial load performance
// These are only shown at specific stages, not during core gameplay
const GameMenu = lazy(() =>
  import('./components/GameMenu').then(m => ({ default: m.GameMenu }))
)
const WelcomeScreen = lazy(() =>
  import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen }))
)
const Stopwatch = lazy(() =>
  import('./components/Stopwatch').then(m => ({ default: m.Stopwatch }))
)
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
const MilestoneCelebration = lazy(() =>
  import('./components/MilestoneCelebration').then(m => ({ default: m.MilestoneCelebration }))
)
const HighScoreWindow = lazy(() =>
  import('./components/HighScoreWindow').then(m => ({ default: m.HighScoreWindow }))
)

// Lazy load debug components to improve initial load time (dev only)
const EmojiRotationMonitor = lazy(() =>
  import('./components/EmojiRotationMonitor').then(m => ({ default: m.EmojiRotationMonitor }))
)

// Hooks - essential for app functionality
import { useDisplayAdjustment } from './hooks/use-display-adjustment'
import { GAME_CATEGORIES, useGameLogic } from './hooks/use-game-logic'
import { PROGRESS_MILESTONES } from './lib/constants/engagement-system'

// Utilities
import { CategoryErrorBoundary } from './components/CategoryErrorBoundary'
import { announceToScreenReader } from './lib/accessibility-utils'
import { eventTracker } from './lib/event-tracker'
import {
  measureComponentRenderTime,
  trackWebVitals
} from './lib/performance-monitor-utils'
import { preloadCriticalResources } from './lib/resource-preloader'
import { useLazyBackgroundPreloader } from './lib/utils/background-preloader'

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
  // Disable fullscreen in E2E mode to prevent browser stability issues
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1';
  if (isE2E) return;

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
  console.log('DEBUG: App rendering, isE2E:', typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1');
  const { displaySettings } = useDisplayAdjustment()

  const stopRenderMeasurement = useMemo(
    () => measureComponentRenderTime('App'),
    []
  )

  // Lazy preload background images for Core Web Vitals optimization
  useLazyBackgroundPreloader()

  // State declarations must come before hooks that use them
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1'

  // Add E2E mode class for CSS overrides
  useEffect(() => {
    if (isE2E) {
      document.documentElement.classList.add('e2e-mode')
    }
  }, [isE2E])

  // Signal app boot after first render to avoid false positives
  useEffect(() => {
    window.__APP_BOOTED__ = true
    window.dispatchEvent(new Event('__app_ready__'))
  }, [])

  const [timeRemaining, setTimeRemaining] = useState(10000)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [backgroundClass, setBackgroundClass] = useState(() => pickRandomBackground())
  const [isLoading, setIsLoading] = useState(false) // Loading state between menu and gameplay
  const [continuousMode, setContinuousMode] = useState(false) // Continuous play mode
  const [startupStep, setStartupStep] = useState<'welcome' | 'menu'>(isE2E ? 'menu' : 'welcome')
  const [debugVisible, setDebugVisible] = useState(false)

  // Initialize web vitals monitoring on mount
  useEffect(() => {
    trackWebVitals((metric) => {
      if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
      }
    })
  }, [])

  // Capture App render timing
  useEffect(() => {
    const duration = stopRenderMeasurement()
    if (import.meta.env.DEV && duration !== null) {
      console.log(`[Performance] App rendered in ${duration.toFixed(2)}ms`)
    }
  }, [stopRenderMeasurement])

  // Preload critical resources on initialization
  useEffect(() => {
    preloadCriticalResources(['high', 'medium'])
      .then((progress) => {
        if (import.meta.env.DEV) {
          console.log(`[Preload] Loaded ${progress.loaded}/${progress.total} resources (failed: ${progress.failed})`)
        }
        announceToScreenReader('Game resources loaded', 'polite')
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('[Preload] Resource preloading failed:', error)
        }
      })
  }, [])

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
    clearAchievement,
    currentMilestone,
    clearMilestone,
    currentMultiplier,
    continuousModeHighScore,
    showHighScoreWindow,
    lastCompletionTime,
    closeHighScoreWindow
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

  // Memoized level names to avoid creating new array on every render
  const levelNames = useMemo(() => GAME_CATEGORIES.map(cat => cat.name), [])

  // Handle welcome screen completion
  const handleWelcomeComplete = useCallback(() => {
    setStartupStep('menu')
  }, [])

  // Handle continuous mode toggle
  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled)
  }, [])

  // Aggressive fullscreen trigger - multiple methods for maximum browser compatibility
  useEffect(() => {
    // Disable aggressive fullscreen in E2E mode
    if (isE2E) return;

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

  // Keyboard shortcut: Ctrl+D or Cmd+D to toggle debug overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+D (Windows/Linux) or Cmd+D (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault() // Prevent browser bookmark dialog
        setDebugVisible(prev => {
          const newState = !prev
          if (import.meta.env.DEV) {
            console.log(`[Debug] Debug overlays ${newState ? 'enabled' : 'disabled'}`)
          }
          return newState
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Startup gate flow: Welcome -> Menu
  if (startupStep === 'welcome') {
    return (
      <Suspense fallback={<LoadingSkeleton variant="welcome" />}>
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      </Suspense>
    )
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
              multiplier={currentMultiplier > 1 ? currentMultiplier : undefined}
            />
          </div>
        )}

        {/* Stopwatch - Continuous Mode Only */}
        {gameState.gameStarted && !gameState.winner && continuousMode && (
          <Suspense fallback={null}>
            <Stopwatch
              isRunning={!gameState.winner}
              bestTime={continuousModeHighScore ?? 0}
            />
          </Suspense>
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

        {/* Milestone Celebration - Full screen overlay for progress milestones */}
        {currentMilestone && (
          <Suspense fallback={null}>
            <MilestoneCelebration
              milestone={PROGRESS_MILESTONES.find(m => m.progress === currentMilestone.progress) || PROGRESS_MILESTONES[0]}
              onDismiss={clearMilestone}
            />
          </Suspense>
        )}

        {/* Full Screen Game Area */}
        <CategoryErrorBoundary
          category="rendering"
          enableSafeMode
          onError={(error, _errorInfo, category) => {
            eventTracker.trackError(error, `rendering-${category}`)
          }}
        >
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
        </CategoryErrorBoundary>

        {/* Game Menu Overlay - Lazy loaded */}
        <Suspense fallback={<LoadingSkeleton variant="menu" />}>
          <GameMenu
            onStartGame={handleStartGame}
            onSelectLevel={setSelectedLevel}
            selectedLevel={selectedLevel}
            levels={levelNames}
            gameStarted={gameState.gameStarted}
            winner={gameState.winner}
            continuousMode={continuousMode}
            onToggleContinuousMode={handleToggleContinuousMode}
            bestTime={continuousModeHighScore ?? 0}
            initialView="main"
          />
        </Suspense>

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
        {/* Toggle with Ctrl+D / Cmd+D keyboard shortcut */}
        {import.meta.env.DEV && debugVisible && (
          <Suspense fallback={null}>
            <EmojiRotationMonitor />
          </Suspense>
        )}

        {showHighScoreWindow && (
          <Suspense fallback={null}>
            <HighScoreWindow
              lastTime={lastCompletionTime}
              highScore={continuousModeHighScore}
              onClose={closeHighScoreWindow}
            />
          </Suspense>
        )}
      </div>
    </>
  )
}

export default App