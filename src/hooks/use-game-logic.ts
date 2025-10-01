import { useCallback, useEffect, useState } from 'react'
// import { useKV } from '@github/spark/hooks'
import { eventTracker } from '../lib/event-tracker'
import { playSoundEffect } from '../lib/sound-manager'

export interface GameObject {
  id: string
  type: string
  emoji: string
  x: number
  y: number
  speed: number
  size: number
}

export interface GameState {
  player1Progress: number
  player2Progress: number
  currentTarget: string
  targetEmoji: string
  level: number
  gameStarted: boolean
  winner: number | null
  targetChangeTime: number
  player1Streak: number
  player2Streak: number
}

export interface GameCategory {
  name: string
  items: { emoji: string; name: string }[]
  requiresSequence?: boolean
  sequenceIndex?: number
}

interface UseGameLogicOptions {
  fallSpeedMultiplier?: number
}

export interface ComboCelebration {
  id: number
  player: 1 | 2
  streak: number
  title: string
  description: string
}

const COMBO_LEVELS: Array<{ streak: number; title: string; description: string }> = [
  {
    streak: 3,
    title: 'Triple Treat!',
    description: 'Three perfect taps in a row! Keep the magic going!'
  },
  {
    streak: 5,
    title: 'Fantastic Five!',
    description: 'Five flawless finds! You are racing ahead!'
  },
  {
    streak: 7,
    title: 'Lucky Legend!',
    description: 'Seven sparkling successes! Unstoppable energy!'
  }
]

export const GAME_CATEGORIES: GameCategory[] = [
  {
    name: "Fruits & Vegetables",
    items: [
      { emoji: "🍎", name: "apple" },
      { emoji: "🍌", name: "banana" },
      { emoji: "🍇", name: "grapes" },
      { emoji: "🍓", name: "strawberry" },
      { emoji: "🥕", name: "carrot" },
      { emoji: "🥒", name: "cucumber" },
      { emoji: "🍉", name: "watermelon" },
      { emoji: "🥦", name: "broccoli" }
    ]
  },
  {
    name: "Counting Fun",
    items: [
      { emoji: "1️⃣", name: "one" },
      { emoji: "2️⃣", name: "two" },
      { emoji: "3️⃣", name: "three" },
      { emoji: "4️⃣", name: "four" },
      { emoji: "5️⃣", name: "five" },
      { emoji: "6️⃣", name: "six" },
      { emoji: "7️⃣", name: "seven" },
      { emoji: "8️⃣", name: "eight" },
      { emoji: "9️⃣", name: "nine" },
      { emoji: "🔟", name: "ten" }
    ]
  },
  {
    name: "Shapes & Colors",
    items: [
      { emoji: "🔵", name: "blue circle" },
      { emoji: "🟥", name: "red square" },
      { emoji: "🔶", name: "orange diamond" },
      { emoji: "🟩", name: "green square" },
      { emoji: "🔺", name: "triangle" },
      { emoji: "⭐", name: "star" },
      { emoji: "🟣", name: "purple circle" },
      { emoji: "⚪", name: "white circle" }
    ]
  },
  {
    name: "Animals & Nature",
    items: [
      { emoji: "🐶", name: "dog" },
      { emoji: "🐱", name: "cat" },
      { emoji: "🦊", name: "fox" },
      { emoji: "🐢", name: "turtle" },
      { emoji: "🦋", name: "butterfly" },
      { emoji: "🦉", name: "owl" },
      { emoji: "🌳", name: "tree" },
      { emoji: "🌸", name: "flower" }
    ]
  },
  {
    name: "Things That Go",
    items: [
      { emoji: "🚗", name: "car" },
      { emoji: "🚌", name: "bus" },
      { emoji: "🚒", name: "fire truck" },
      { emoji: "✈️", name: "airplane" },
      { emoji: "🚀", name: "rocket" },
      { emoji: "🚲", name: "bicycle" },
      { emoji: "🚁", name: "helicopter" },
      { emoji: "🚤", name: "boat" }
    ]
  },
  {
    name: "Weather Wonders",
    items: [
      { emoji: "☀️", name: "sunny" },
      { emoji: "⛅", name: "partly cloudy" },
      { emoji: "🌧️", name: "rainy" },
      { emoji: "⛈️", name: "stormy" },
      { emoji: "❄️", name: "snowy" },
      { emoji: "🌈", name: "rainbow" },
      { emoji: "🌪️", name: "tornado" },
      { emoji: "🌬️", name: "windy" }
    ]
  },
  {
    name: "Feelings & Actions",
    items: [
      { emoji: "😄", name: "happy" },
      { emoji: "😢", name: "sad" },
      { emoji: "😠", name: "angry" },
      { emoji: "😴", name: "sleepy" },
      { emoji: "🤗", name: "hug" },
      { emoji: "👏", name: "clap" },
      { emoji: "🕺", name: "dance" },
      { emoji: "🤸", name: "flip" }
    ]
  },
  {
    name: "Body Parts",
    items: [
      { emoji: "👁️", name: "eye" },
      { emoji: "👂", name: "ear" },
      { emoji: "👃", name: "nose" },
      { emoji: "👄", name: "mouth" },
      { emoji: "👅", name: "tongue" },
      { emoji: "🖐️", name: "hand" },
      { emoji: "🦶", name: "foot" },
      { emoji: "🦵", name: "leg" }
    ]
  },
  {
    name: "Alphabet Challenge",
    items: [
      { emoji: "A", name: "A" },
      { emoji: "B", name: "B" },
      { emoji: "C", name: "C" },
      { emoji: "D", name: "D" },
      { emoji: "E", name: "E" },
      { emoji: "F", name: "F" },
      { emoji: "G", name: "G" },
      { emoji: "H", name: "H" },
      { emoji: "I", name: "I" },
      { emoji: "J", name: "J" }
    ],
    requiresSequence: true,
    sequenceIndex: 0
  }
]

export const useGameLogic = (options: UseGameLogicOptions = {}) => {
  const { fallSpeedMultiplier = 1 } = options
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [gameState, setGameState] = useState<GameState>({
    player1Progress: 0,
    player2Progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: false,
    winner: null,
    targetChangeTime: Date.now() + 10000,
    player1Streak: 0,
    player2Streak: 0
  })
  const [comboCelebration, setComboCelebration] = useState<ComboCelebration | null>(null)

  const clampLevel = useCallback((levelIndex: number) => {
    if (Number.isNaN(levelIndex)) return 0
    return Math.max(0, Math.min(levelIndex, GAME_CATEGORIES.length - 1))
  }, [])

  const currentCategory = GAME_CATEGORIES[gameState.level] || GAME_CATEGORIES[0]

  useEffect(() => {
    if (gameState.gameStarted && gameState.currentTarget) {
      void playSoundEffect.voice(gameState.currentTarget)
    }
  }, [gameState.gameStarted, gameState.currentTarget])

  const generateRandomTarget = useCallback((levelOverride?: number) => {
    const levelIndex = clampLevel(levelOverride ?? gameState.level)
    const category = GAME_CATEGORIES[levelIndex] || GAME_CATEGORIES[0]

    if (category.requiresSequence) {
      const sequenceIndex = category.sequenceIndex || 0
      const targetItem = category.items[sequenceIndex % category.items.length]
      return { name: targetItem.name, emoji: targetItem.emoji }
    }

    const randomItem = category.items[Math.floor(Math.random() * category.items.length)]
    return { name: randomItem.name, emoji: randomItem.emoji }
  }, [clampLevel, gameState.level])

  // Initialize target on first load when game auto-starts
  useEffect(() => {
    if (gameState.gameStarted && !gameState.currentTarget) {
      const target = generateRandomTarget()
      setGameState(prev => ({
        ...prev,
        currentTarget: target.name,
        targetEmoji: target.emoji,
        targetChangeTime: Date.now() + 10000
      }))
    }
  }, [gameState.gameStarted, gameState.currentTarget, generateRandomTarget])

  const spawnObject = useCallback(() => {
    try {
      // Pre-check for performance bottlenecks - more strict limit
      if (gameObjects.length > 15) {
        eventTracker.trackWarning('Too many objects on screen, skipping spawn', {
          currentCount: gameObjects.length
        })
        return
      }

      // Optimized spawning: fewer objects, less computation
      const spawnCount = Math.floor(Math.random() * 2) + 1 // 1-2 objects only
      const newObjects: GameObject[] = []

      // Pre-calculate random values to reduce computation in loop
      const baseId = Date.now()
      const categoryItems = currentCategory.items
      const categoryLength = categoryItems.length

      const leftCount = gameObjects.reduce((count, obj) => count + (obj.x <= 50 ? 1 : 0), 0)
      const rightCount = gameObjects.length - leftCount
      let nextLane: 'left' | 'right' = leftCount <= rightCount ? 'left' : 'right'

      for (let i = 0; i < spawnCount; i++) {
        // Use more efficient random selection
        const randomIndex = Math.floor(Math.random() * categoryLength)
        const randomItem = categoryItems[randomIndex]

        const lane = nextLane
        nextLane = lane === 'left' ? 'right' : 'left'

        const [minX, maxX] = lane === 'left' ? [10, 45] : [55, 90]

        const newObject: GameObject = {
          id: `${baseId}-${i}`, // Simpler ID generation
          type: randomItem.name,
          emoji: randomItem.emoji,
          x: Math.random() * (maxX - minX) + minX,
          y: -100 - (i * 60), // Increased stagger to prevent overlap
          speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier, // Reduced speed variance
          size: 60
        }
        newObjects.push(newObject)
      }

      // Single batch update instead of tracking each individually
      setGameObjects(prev => [...prev, ...newObjects])

      // Track spawn event once per batch
      eventTracker.trackObjectSpawn(`batch-${spawnCount}`, { count: spawnCount })
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [currentCategory, fallSpeedMultiplier, gameObjects])

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => {
        // Filter and update in single pass for better performance
        const updatedObjects: GameObject[] = []
        const screenHeight = window.innerHeight
        const speedMultiplier = 1.2 * fallSpeedMultiplier

        const laneBuckets: { left: GameObject[]; right: GameObject[] } = { left: [], right: [] }

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier

          // Only keep objects that are still visible
          if (newY < screenHeight + 100) {
            const updated = { ...obj, y: newY }
            const lane = updated.x <= 50 ? 'left' : 'right'
            laneBuckets[lane].push(updated)
          }
        }

        // Enhanced collision detection: increased gap and size-aware spacing
        const minimumGap = 100 // Increased from 70px to 100px for better separation
        const horizontalMinGap = 15 // Minimum horizontal gap in percentage points

        const applySeparation = (objects: GameObject[]) => {
          // Sort by Y position (top to bottom)
          const sorted = objects.sort((a, b) => a.y - b.y)

          for (let i = 0; i < sorted.length; i++) {
            const obj = sorted[i]

            // Vertical collision prevention with size awareness
            if (i > 0) {
              const prevObj = sorted[i - 1]
              const requiredGap = minimumGap + (obj.size + prevObj.size) / 2

              if (obj.y < prevObj.y + requiredGap) {
                obj.y = prevObj.y + requiredGap
              }
            }

            // Horizontal collision prevention - push apart if too close
            for (let j = 0; j < i; j++) {
              const otherObj = sorted[j]
              const verticalDistance = Math.abs(obj.y - otherObj.y)
              const horizontalDistance = Math.abs(obj.x - otherObj.x)

              // Check if objects are close vertically AND horizontally
              if (verticalDistance < minimumGap && horizontalDistance < horizontalMinGap) {
                // Push the current object away horizontally
                if (obj.x < otherObj.x) {
                  obj.x = Math.max(10, otherObj.x - horizontalMinGap)
                } else {
                  obj.x = Math.min(45, otherObj.x + horizontalMinGap) // Keep within lane bounds
                }
              }
            }

            updatedObjects.push(obj)
          }
        }

        applySeparation(laneBuckets.left)
        applySeparation(laneBuckets.right)

        return updatedObjects
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'updateObjects')
    }
  }, [fallSpeedMultiplier])

  const handleObjectTap = useCallback((objectId: string, playerSide: 'left' | 'right') => {
    const tapStartTime = performance.now()

    try {
      const tappedObject = gameObjects.find(obj => obj.id === objectId)
      if (!tappedObject) {
        eventTracker.trackWarning('Tapped object not found', { objectId, playerSide })
        return
      }

      const isCorrect = currentCategory.requiresSequence
        ? tappedObject.type === gameState.currentTarget
        : tappedObject.emoji === gameState.targetEmoji

      const tapLatency = performance.now() - tapStartTime
      eventTracker.trackObjectTap(objectId, isCorrect, playerSide, tapLatency)

      setGameState(prev => {
        const newState = { ...prev }

        if (isCorrect) {
          // Correct tap: play success sound and move forward
          playSoundEffect.success()
          void playSoundEffect.voice(tappedObject.type)

          let nextStreak = 0

          if (playerSide === 'left') {
            nextStreak = prev.player1Streak + 1
            newState.player1Streak = nextStreak
          } else {
            nextStreak = prev.player2Streak + 1
            newState.player2Streak = nextStreak
          }

          const comboLevel = COMBO_LEVELS.find(level => level.streak === nextStreak)
          if (comboLevel) {
            const comboData: ComboCelebration = {
              id: Date.now(),
              player: playerSide === 'left' ? 1 : 2,
              streak: nextStreak,
              title: comboLevel.title,
              description: comboLevel.description
            }
            setComboCelebration(comboData)
            eventTracker.trackEvent({
              type: 'info',
              category: 'combo',
              message: `Player ${comboData.player} combo streak reached ${comboData.streak}`,
              data: comboData
            })
          }

          if (playerSide === 'left') {
            newState.player1Progress = Math.min(prev.player1Progress + 20, 100)
          } else {
            newState.player2Progress = Math.min(prev.player2Progress + 20, 100)
          }

          // Check for winner
          if (newState.player1Progress >= 100) {
            newState.winner = 1
            playSoundEffect.win()
            eventTracker.trackGameStateChange(prev, newState, 'player1_wins')
          } else if (newState.player2Progress >= 100) {
            newState.winner = 2
            playSoundEffect.win()
            eventTracker.trackGameStateChange(prev, newState, 'player2_wins')
          }

          // Change target immediately on correct tap (for non-sequence modes)
          if (!currentCategory.requiresSequence && !newState.winner) {
            const nextTarget = generateRandomTarget()
            newState.currentTarget = nextTarget.name
            newState.targetEmoji = nextTarget.emoji
            newState.targetChangeTime = Date.now() + 10000 // Reset timer
            eventTracker.trackGameStateChange(prev, newState, 'target_change_on_correct_tap')
          }

          // Advance sequence for alphabet level
          if (currentCategory.requiresSequence) {
            const nextIndex = (currentCategory.sequenceIndex || 0) + 1
            GAME_CATEGORIES[prev.level].sequenceIndex = nextIndex

            if (nextIndex < currentCategory.items.length) {
              const nextTarget = generateRandomTarget()
              newState.currentTarget = nextTarget.name
              newState.targetEmoji = nextTarget.emoji
              eventTracker.trackGameStateChange(prev, newState, 'sequence_advance')
            }
          }
        } else {
          // Incorrect tap: play wrong sound and move backward
          playSoundEffect.wrong()

          if (playerSide === 'left') {
            newState.player1Streak = 0
          } else {
            newState.player2Streak = 0
          }

          if (playerSide === 'left') {
            newState.player1Progress = Math.max(prev.player1Progress - 20, 0)
          } else {
            newState.player2Progress = Math.max(prev.player2Progress - 20, 0)
          }

          eventTracker.trackGameStateChange(prev, newState, 'incorrect_tap_penalty')
        }

        return newState
      })

      // Remove the tapped object regardless of correct/incorrect
      setGameObjects(prev => prev.filter(obj => obj.id !== objectId))
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleObjectTap')
    }
  }, [gameObjects, gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget])

  const startGame = useCallback((levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameState.level)

      if (GAME_CATEGORIES[safeLevel].requiresSequence) {
        GAME_CATEGORIES[safeLevel].sequenceIndex = 0
      }

      // Reset performance metrics for accurate tracking
      eventTracker.resetPerformanceMetrics()

      const target = generateRandomTarget(safeLevel)
      setGameObjects([])

      setGameState(prev => {
        const newState = {
          ...prev,
          level: safeLevel,
          gameStarted: true,
          currentTarget: target.name,
          targetEmoji: target.emoji,
          targetChangeTime: Date.now() + 10000,
          winner: null,
          player1Progress: 0,
          player2Progress: 0,
          player1Streak: 0,
          player2Streak: 0
        }

        eventTracker.trackGameStateChange(prev, newState, 'game_start')
        return newState
      })
      setComboCelebration(null)
    } catch (error) {
      eventTracker.trackError(error as Error, 'startGame')
    }
  }, [clampLevel, gameState.level, generateRandomTarget])

  const resetGame = useCallback(() => {
    GAME_CATEGORIES.forEach(cat => { cat.sequenceIndex = 0 })

    // Reset performance metrics
    eventTracker.resetPerformanceMetrics()

    setGameObjects([])
    setGameState({
      player1Progress: 0,
      player2Progress: 0,
      currentTarget: "",
      targetEmoji: "",
      level: 0,
      gameStarted: false,
      winner: null,
      targetChangeTime: Date.now() + 10000,
      player1Streak: 0,
      player2Streak: 0
    })
    setComboCelebration(null)
  }, [])

  // Update target every 10 seconds (except for sequence mode)
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner || currentCategory.requiresSequence) return

    const interval = setInterval(() => {
      if (Date.now() >= gameState.targetChangeTime) {
        const target = generateRandomTarget()
        setGameState(prev => ({
          ...prev,
          currentTarget: target.name,
          targetEmoji: target.emoji,
          targetChangeTime: Date.now() + 10000
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, gameState.targetChangeTime, currentCategory.requiresSequence, generateRandomTarget, setGameState])

  // Spawn objects - Optimized with longer intervals for better performance
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    // Increased to 500ms for better performance while maintaining game flow
    const interval = setInterval(spawnObject, 500)
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, spawnObject])

  // Update object positions using optimized timer-based approach
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    // Use setInterval instead of requestAnimationFrame for less frequent updates
    const interval = setInterval(updateObjects, 16) // ~60fps but more controlled
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, updateObjects])

  const clearComboCelebration = useCallback(() => setComboCelebration(null), [])

  return {
    gameObjects,
    gameState,
    currentCategory,
    handleObjectTap,
    startGame,
    resetGame,
    comboCelebration,
    clearComboCelebration
  }
}
