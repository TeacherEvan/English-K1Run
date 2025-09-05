import { useState, useEffect } from 'react'
import './App.css'
import { useGameLogic, GAME_CATEGORIES } from './hooks/use-game-logic'
import { useDisplayAdjustment } from './hooks/use-display-adjustment'
import { PlayerArea } from './components/PlayerArea'
import { FallingObject } from './components/FallingObject'
import { TargetDisplay } from './components/TargetDisplay'
import { GameMenu } from './components/GameMenu'
import { EventTrackerDebug } from './components/EventTrackerDebug'
import { FireworksDisplay } from './components/FireworksDisplay'
import { DisplayInfo } from './components/DisplayInfo'
import { PerformanceMonitor } from './components/PerformanceMonitor'

function App() {
  const { 
    displaySettings, 
    getScaledStyles, 
    isSmallScreen,
    isMediumScreen,
    isLargeScreen 
  } = useDisplayAdjustment()

  const {
    gameObjects,
    gameState,
    currentCategory,
    handleObjectTap,
    startGame,
    nextLevel,
    resetGame
  } = useGameLogic({ fallSpeedMultiplier: displaySettings.fallSpeed })

  const [timeRemaining, setTimeRemaining] = useState(10000)
  const [debugVisible, setDebugVisible] = useState(false)
  const [displayInfoVisible, setDisplayInfoVisible] = useState(false)

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
    <div 
      className={`h-screen bg-background overflow-hidden relative app ${isSmallScreen ? 'app--small' : isMediumScreen ? 'app--medium' : 'app--large'}`}
      style={getScaledStyles()}
    >
      {/* Target Display - Fixed at top center with responsive sizing */}
      {gameState.gameStarted && !gameState.winner && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-30 ${
          isSmallScreen ? 'w-64' : isMediumScreen ? 'w-72' : 'w-80'
        }`}>
          <TargetDisplay
            currentTarget={gameState.currentTarget}
            targetEmoji={gameState.targetEmoji}
            category={currentCategory}
            timeRemaining={currentCategory.requiresSequence ? undefined : timeRemaining}
          />
        </div>
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
        onStartGame={startGame}
        onNextLevel={gameState.level < GAME_CATEGORIES.length - 1 ? nextLevel : undefined}
        onResetGame={resetGame}
        gameStarted={gameState.gameStarted}
        winner={gameState.winner}
        level={gameState.level}
        categoryName={currentCategory.name}
        maxLevel={GAME_CATEGORIES.length}
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
    </div>
  )
}

export default App