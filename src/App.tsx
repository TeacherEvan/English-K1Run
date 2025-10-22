import { useEffect, useState } from 'react'
import './App.css'
// Core game components (critical path)
import { ComboCelebration } from './components/ComboCelebration'
import { EmojiRotationMonitor } from './components/EmojiRotationMonitor'
import { FallingObject } from './components/FallingObject'
import { FireworksDisplay } from './components/FireworksDisplay'
import { GameMenu } from './components/GameMenu'
import { PlayerArea } from './components/PlayerArea'
import { TargetDisplay } from './components/TargetDisplay'
// Hooks
import { useDisplayAdjustment } from './hooks/use-display-adjustment'
import { GAME_CATEGORIES, useGameLogic } from './hooks/use-game-logic'

// Debug components removed per requirements - only target pronunciation audio allowed

const BACKGROUND_CLASSES = [
  'app-bg-mountain-sunrise',
  'app-bg-ocean-sunset',
  'app-bg-forest-path',
  'app-bg-lavender-field',
  'app-bg-aurora-night'
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

  const {
    gameObjects,
    gameState,
    currentCategory,
    handleObjectTap,
    startGame,
    resetGame,
    comboCelebration,
    clearComboCelebration,
    changeTargetToVisibleEmoji
  } = useGameLogic({ fallSpeedMultiplier: displaySettings.fallSpeed })

  const [timeRemaining, setTimeRemaining] = useState(10000)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [backgroundClass, setBackgroundClass] = useState(() => pickRandomBackground())

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

  return (
    <div className={`h-screen overflow-hidden relative app app-bg-animated ${backgroundClass}`}>
      {/* Back to Levels Button - Fixed at top left during gameplay */}
      {gameState.gameStarted && !gameState.winner && (
        <div className="absolute top-4 left-4 z-40">
          <button
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

      {comboCelebration && (
        <ComboCelebration celebration={comboCelebration} onDismiss={clearComboCelebration} />
      )}

      {/* Full Screen Game Area */}
      <div className="h-full">
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
        </PlayerArea>
      </div>

      {/* Game Menu Overlay */}
      <GameMenu
        onStartGame={() => {
          requestFullscreen() // Ensure fullscreen when starting game
          startGame(selectedLevel)
        }}
        onResetGame={() => {
          resetGame()
          setBackgroundClass(prev => pickRandomBackground(prev))
        }}
        onSelectLevel={setSelectedLevel}
        selectedLevel={selectedLevel}
        levels={GAME_CATEGORIES.map(cat => cat.name)}
        gameStarted={gameState.gameStarted}
        winner={gameState.winner}
      />

      {/* Fireworks Display */}
      <FireworksDisplay
        isVisible={!!gameState.winner}
        winner={gameState.winner}
      />

      {/* Debug: Emoji Rotation Monitor (dev mode only) */}
      {import.meta.env.DEV && <EmojiRotationMonitor />}
    </div>
  )
}

export default App
