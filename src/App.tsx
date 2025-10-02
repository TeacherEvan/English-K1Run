import { useEffect, useState } from 'react'
import './App.css'
import { ComboCelebration } from './components/ComboCelebration'
import { DisplayInfo } from './components/DisplayInfo'
import { ErrorMonitor } from './components/ErrorMonitor'
import { EventTrackerDebug } from './components/EventTrackerDebug'
import { FallingObject } from './components/FallingObject'
import { FireworksDisplay } from './components/FireworksDisplay'
import { GameDebug } from './components/GameDebug'
import { GameMenu } from './components/GameMenu'
import { PerformanceMonitor } from './components/PerformanceMonitor'
import { PlayerArea } from './components/PlayerArea'
import { QuickDebug } from './components/QuickDebug'
import { TargetDisplay } from './components/TargetDisplay'
import { useDisplayAdjustment } from './hooks/use-display-adjustment'
import { GAME_CATEGORIES, useGameLogic } from './hooks/use-game-logic'

const BACKGROUND_CLASSES = [
  'app-bg-sunrise',
  'app-bg-deep-ocean',
  'app-bg-forest-trail',
  'app-bg-cosmic-night',
  'app-bg-playful-pop'
]

const pickRandomBackground = (exclude?: string) => {
  const pool = BACKGROUND_CLASSES.filter(bg => bg !== exclude)
  const choices = pool.length > 0 ? pool : BACKGROUND_CLASSES
  const index = Math.floor(Math.random() * choices.length)
  return choices[index]
}

function App() {
  const {
    displaySettings,
    isSmallScreen,
    isMediumScreen
  } = useDisplayAdjustment()



  const {
    gameObjects,
    gameState,
    currentCategory,
    handleObjectTap,
    startGame,
    resetGame,
    comboCelebration,
    clearComboCelebration
  } = useGameLogic({ fallSpeedMultiplier: displaySettings.fallSpeed })

  const [timeRemaining, setTimeRemaining] = useState(10000)
  const [debugVisible, setDebugVisible] = useState(false)
  const [displayInfoVisible, setDisplayInfoVisible] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [backgroundClass, setBackgroundClass] = useState(() => pickRandomBackground())

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundClass(prev => pickRandomBackground(prev))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (gameState.gameStarted) return
    setBackgroundClass(prev => pickRandomBackground(prev))
  }, [gameState.gameStarted])

  useEffect(() => {
    if (!gameState.gameStarted) {
      setSelectedLevel(gameState.level)
    }
  }, [gameState.gameStarted, gameState.level])

  // Update time remaining for target display
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner || currentCategory.requiresSequence) return

    const interval = setInterval(() => {
      const remaining = gameState.targetChangeTime - Date.now()
      setTimeRemaining(Math.max(0, remaining))
    }, 100)

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, gameState.targetChangeTime, currentCategory.requiresSequence])

  // Split objects for each player side
  const leftObjects = gameObjects.filter(obj => obj.x <= 50)
  const rightObjects = gameObjects.filter(obj => obj.x > 50)

  return (
    <div className={`h-screen overflow-hidden relative app app-bg-animated ${backgroundClass}`}>
      {/* Target Display - Fixed at top center with responsive sizing */}
      {gameState.gameStarted && !gameState.winner && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-30 ${isSmallScreen ? 'w-64' : isMediumScreen ? 'w-72' : 'w-80'
          }`}>
          <TargetDisplay
            currentTarget={gameState.currentTarget}
            targetEmoji={gameState.targetEmoji}
            category={currentCategory}
            timeRemaining={currentCategory.requiresSequence ? undefined : timeRemaining}
          />
        </div>
      )}

      {comboCelebration && (
        <ComboCelebration celebration={comboCelebration} onDismiss={clearComboCelebration} />
      )}

      {/* Split Screen Game Areas */}
      <div className="h-full flex">
        {/* Player 1 Area (Left) */}
        <div className="w-1/2 h-full relative">
          <PlayerArea
            playerNumber={1}
            progress={gameState.player1Progress}
            isWinner={gameState.winner === 1}
          >
            {leftObjects.map(obj => (
              <FallingObject
                key={obj.id}
                object={{
                  ...obj,
                  x: obj.x * 2 // Adjust x position for left half
                }}
                onTap={handleObjectTap}
                playerSide="left"
              />
            ))}
          </PlayerArea>
        </div>

        {/* Player 2 Area (Right) */}
        <div className="w-1/2 h-full relative">
          <PlayerArea
            playerNumber={2}
            progress={gameState.player2Progress}
            isWinner={gameState.winner === 2}
          >
            {rightObjects.map(obj => (
              <FallingObject
                key={obj.id}
                object={{
                  ...obj,
                  x: (obj.x - 50) * 2 // Adjust x position for right half
                }}
                onTap={handleObjectTap}
                playerSide="right"
              />
            ))}
          </PlayerArea>
        </div>
      </div>

      {/* Game Menu Overlay */}
      <GameMenu
        onStartGame={() => startGame(selectedLevel)}
        onResetGame={resetGame}
        onSelectLevel={setSelectedLevel}
        selectedLevel={selectedLevel}
        levels={GAME_CATEGORIES.map(category => category.name)}
        gameStarted={gameState.gameStarted}
        winner={gameState.winner}
      />

      {/* Event Tracker Debug */}
      <EventTrackerDebug
        isVisible={debugVisible}
        onToggle={() => setDebugVisible(!debugVisible)}
      />

      {/* Fireworks Display */}
      <FireworksDisplay
        isVisible={!!gameState.winner}
        winner={gameState.winner}
      />

      {/* Display Adjustment Info */}
      <DisplayInfo
        isVisible={displayInfoVisible}
        screenWidth={displaySettings.screenWidth}
        screenHeight={displaySettings.screenHeight}
        aspectRatio={displaySettings.aspectRatio}
        scale={displaySettings.scale}
        fontSize={displaySettings.fontSize}
        objectSize={displaySettings.objectSize}
        turtleSize={displaySettings.turtleSize}
        fallSpeed={displaySettings.fallSpeed}
        isLandscape={displaySettings.isLandscape}
        onToggle={() => setDisplayInfoVisible(!displayInfoVisible)}
      />

      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Error Monitor - For real-time error detection */}
      <ErrorMonitor />

      {/* Quick Debug - CSS and Audio diagnostics */}
      <QuickDebug />

      {/* Game Debug - Visual debugging panel */}
      <GameDebug
        gameStarted={gameState.gameStarted}
        objectCount={gameObjects.length}
        targetEmoji={gameState.targetEmoji}
        currentTarget={gameState.currentTarget}
      />
    </div>
  )
}

export default App
