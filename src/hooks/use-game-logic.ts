import { useCallback, useEffect, useRef, useState } from 'react'
// import { useKV } from '@github/spark/hooks'
import { eventTracker } from '../lib/event-tracker'
import { playSoundEffect } from '../lib/sound-manager'
import { multiTouchHandler } from '../lib/touch-handler'

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
  progress: number
  currentTarget: string
  targetEmoji: string
  level: number
  gameStarted: boolean
  winner: boolean
  targetChangeTime: number
  streak: number
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
  const [gameState, setGameState] = useState<GameState>(() => ({
    progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: false,
    winner: false,
    targetChangeTime: Date.now() + 10000,
    streak: 0
  }))
  const [comboCelebration, setComboCelebration] = useState<ComboCelebration | null>(null)
  // REMOVED: lastSeenEmojis and emojiQueue state - unnecessary complexity that caused spawn issues
  // Background rotation is handled in App.tsx, not here

  // Use ref to access current game state in callbacks without causing re-creation
  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
    console.log('[GameLogic] gameState updated:', { level: gameState.level, gameStarted: gameState.gameStarted })
  }, [gameState])

  console.log('[GameLogic] Hook rendering, gameState:', gameState)

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
  // Target initialization is handled in startGame function

  // OPTIMIZED: Simplified spawn logic - uses ref to access current game state without re-creating
  const spawnObject = useCallback(() => {
    try {
      setGameObjects(prev => {
        // Performance-optimized limit: balance fun with smooth performance
        if (prev.length > 15) {
          console.log('[GameLogic] Too many objects, skipping spawn. Count:', prev.length)
          return prev
        }

        // Optimized spawning: 1-2 objects for better performance while still engaging
        const spawnCount = Math.floor(Math.random() * 2) + 1 // 1-2 objects
        const newObjects: GameObject[] = []

        // Pre-calculate random values to reduce computation in loop
        const baseId = Date.now()

        // Use ref to get current level without re-creating this callback
        const currentLevel = GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0]
        const categoryItems = currentLevel.items

        // Full screen width for single player
        const minX = 10
        const maxX = 90

        for (let i = 0; i < spawnCount; i++) {
          // SIMPLIFIED: Pure random selection - no queue system
          const randomIndex = Math.floor(Math.random() * categoryItems.length)
          const randomItem = categoryItems[randomIndex]

          // Calculate spawn position with collision avoidance
          let spawnY = -100 - (i * 80) // Reduced from 200 to 80 - allow tighter spacing
          let spawnX = Math.random() * (maxX - minX) + minX

          // Check for collision with existing objects across full width
          for (const existing of prev) {
            const verticalDist = Math.abs(spawnY - existing.y)
            const horizontalDist = Math.abs(spawnX - existing.x)

            // If too close vertically (within 120px), push the new object further up
            if (verticalDist < 120) {
              spawnY = Math.min(spawnY, existing.y - 120)
            }

            // If too close horizontally (within 15 units), shift position
            if (verticalDist < 200 && horizontalDist < 15) {
              // Try opposite side first
              const screenCenter = (minX + maxX) / 2
              if (spawnX < screenCenter) {
                spawnX = Math.min(maxX - 5, existing.x + 15)
              } else {
                spawnX = Math.max(minX + 5, existing.x - 15)
              }
              // If still too close, push further
              if (Math.abs(spawnX - existing.x) < 15) {
                spawnX = spawnX < existing.x
                  ? Math.max(minX, existing.x - 18)
                  : Math.min(maxX, existing.x + 18)
              }
            }
          }

          const newObject: GameObject = {
            id: `${baseId}-${i}-${Math.random()}`, // Unique ID
            type: randomItem.name,
            emoji: randomItem.emoji,
            x: spawnX,
            y: spawnY,
            speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier, // Reduced speed variance
            size: 60
          }

          // DEBUG: Log spawn details
          console.log('[SpawnObject] Created:', {
            id: newObject.id,
            emoji: newObject.emoji,
            x: newObject.x,
            y: newObject.y,
            speed: newObject.speed
          })

          // Track emoji lifecycle - spawned phase (MUST happen before adding to array)
          // Track with ACTUAL spawn position before any collision detection modifications
          eventTracker.trackEmojiLifecycle({
            objectId: newObject.id,
            emoji: newObject.emoji,
            name: newObject.type,
            phase: 'spawned',
            position: { x: spawnX, y: spawnY }, // Use raw spawn coords, not obj reference
            playerSide: 'left' // Single player mode, use left for compatibility
          })

          newObjects.push(newObject)
        }

        console.log('[GameLogic] Spawning', newObjects.length, 'objects. Total will be:', prev.length + newObjects.length)

        // Track spawn event once per batch
        eventTracker.trackObjectSpawn(`batch-${spawnCount}`, { count: spawnCount })

        // Return new array with spawned objects
        return [...prev, ...newObjects]
      })
    } catch (error) {
      console.error('[GameLogic] Error in spawnObject:', error)
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [fallSpeedMultiplier]) // OPTIMIZED: Stable dependencies - gameState accessed via ref

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => {
        // Filter and update in single pass for better performance
        const screenHeight = window.innerHeight
        // FIX: Don't multiply by fallSpeedMultiplier again - it's already baked into obj.speed at spawn time!
        // Just use a base speed multiplier for frame-rate compensation
        const speedMultiplier = 0.6 // Base movement per frame (reduced from 1.2 for slower fall)

        const allObjects: GameObject[] = []

        // DEBUG: Log first object's movement
        if (prev.length > 0 && Math.random() < 0.1) { // 10% sampling
          console.log('[UpdateObjects] screenHeight:', screenHeight, 'speedMultiplier:', speedMultiplier, 'objectCount:', prev.length)
          console.log('[UpdateObjects] First object:', { id: prev[0].id, y: prev[0].y, speed: prev[0].speed, emoji: prev[0].emoji })
        }

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier

          // Only keep objects that are still visible
          if (newY < screenHeight + 100) {
            const updated = { ...obj, y: newY }
            allObjects.push(updated)
          } else {
            // DEBUG: Log when object is removed
            console.log('[UpdateObjects] Removing object:', {
              id: obj.id,
              emoji: obj.emoji,
              oldY: obj.y,
              newY,
              screenHeight,
              threshold: screenHeight + 100
            })

            // Track emoji lifecycle - missed (fell off screen)
            // Log the LAST visible position (approximately screenHeight) instead of current Y
            // which could be thousands of pixels off-screen
            const lastVisibleY = Math.min(obj.y, screenHeight + 100)
            eventTracker.trackEmojiLifecycle({
              objectId: obj.id,
              emoji: obj.emoji,
              name: obj.type,
              phase: 'missed',
              position: { x: obj.x, y: lastVisibleY }, // Use clamped position
              playerSide: 'left', // Single player mode
              data: {
                reason: 'fell_off_screen',
                actualY: obj.y,
                calculatedY: newY,
                screenHeight
              }
            })
          }
        }

        // OPTIMIZED COLLISION DETECTION: Simple and performant
        if (allObjects.length > 1) {
          // Define full screen boundaries
          const minX = 10
          const maxX = 90
          const minSeparation = 25 // Minimum distance between emoji centers (increased for better separation)

          // Use a more efficient collision detection approach
          for (let i = 0; i < allObjects.length; i++) {
            const current = allObjects[i]

            // Ensure object stays within screen boundaries
            current.x = Math.max(minX, Math.min(maxX, current.x))

            // Only check nearby objects (performance optimization)
            for (let j = i + 1; j < allObjects.length; j++) {
              const other = allObjects[j]
              const dx = current.x - other.x
              const dy = current.y - other.y

              // Skip distant objects vertically (>50px) to improve performance
              if (Math.abs(dy) > 50) continue

              const distance = Math.sqrt(dx * dx + dy * dy)

              // If overlapping, apply gentle separation
              if (distance < minSeparation && distance > 0) {
                const pushStrength = (minSeparation - distance) * 0.2 // Gentle push for stability
                const normalizedDx = dx / distance
                const pushX = normalizedDx * pushStrength

                // Apply horizontal push only to preserve fall speed
                current.x = Math.max(minX, Math.min(maxX, current.x + pushX))
                other.x = Math.max(minX, Math.min(maxX, other.x - pushX))
              }
            }
          }
        }

        return allObjects
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'updateObjects')
    }
  }, []) // Removed fallSpeedMultiplier dependency - it's baked into obj.speed at spawn time

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

      // Track emoji lifecycle - tapped phase
      eventTracker.trackEmojiLifecycle({
        objectId: tappedObject.id,
        emoji: tappedObject.emoji,
        name: tappedObject.type,
        phase: 'tapped',
        position: { x: tappedObject.x, y: tappedObject.y },
        playerSide,
        data: { isCorrect, tapLatency }
      })

      setGameState(prev => {
        const newState = { ...prev }

        if (isCorrect) {
          // Correct tap: play success sound and move forward
          playSoundEffect.success()
          void playSoundEffect.voice(tappedObject.type)

          const nextStreak = prev.streak + 1
          newState.streak = nextStreak

          const comboLevel = COMBO_LEVELS.find(level => level.streak === nextStreak)
          if (comboLevel) {
            const comboData: ComboCelebration = {
              id: Date.now(),
              streak: nextStreak,
              title: comboLevel.title,
              description: comboLevel.description
            }
            setComboCelebration(comboData)
            eventTracker.trackEvent({
              type: 'info',
              category: 'combo',
              message: `Combo streak reached ${comboData.streak}`,
              data: comboData
            })
          }

          newState.progress = Math.min(prev.progress + 20, 100)

          // Check for winner
          if (newState.progress >= 100) {
            newState.winner = true
            playSoundEffect.win()
            eventTracker.trackGameStateChange(prev, newState, 'player_wins')
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
          newState.streak = 0
          newState.progress = Math.max(prev.progress - 20, 0)
          eventTracker.trackGameStateChange(prev, newState, 'incorrect_tap_penalty')
        }

        return newState
      })

      // Remove the tapped object regardless of correct/incorrect
      setGameObjects(prev => {
        // Track removal before filtering
        const removedObj = prev.find(obj => obj.id === objectId)
        if (removedObj) {
          eventTracker.trackEmojiLifecycle({
            objectId: removedObj.id,
            emoji: removedObj.emoji,
            name: removedObj.type,
            phase: 'removed',
            position: { x: removedObj.x, y: removedObj.y },
            playerSide,
            data: { reason: 'tapped', isCorrect }
          })
        }
        return prev.filter(obj => obj.id !== objectId)
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleObjectTap')
    }
  }, [gameObjects, gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget])

  const startGame = useCallback((levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameState.level)

      console.log('[GameLogic] Starting game at level:', safeLevel)

      // Enable multi-touch handler for advanced touch support
      multiTouchHandler.enable()

      if (GAME_CATEGORIES[safeLevel].requiresSequence) {
        GAME_CATEGORIES[safeLevel].sequenceIndex = 0
      }

      // Reset performance metrics for accurate tracking
      eventTracker.resetPerformanceMetrics()

      const target = generateRandomTarget(safeLevel)
      console.log('[GameLogic] Initial target:', target)
      setGameObjects([])

      setGameState(prev => {
        const newState = {
          ...prev,
          level: safeLevel,
          gameStarted: true,
          currentTarget: target.name,
          targetEmoji: target.emoji,
          targetChangeTime: Date.now() + 10000,
          winner: false,
          progress: 0,
          streak: 0
        }

        console.log('[GameLogic] Game state updated, gameStarted:', newState.gameStarted)
        eventTracker.trackGameStateChange(prev, newState, 'game_start')
        return newState
      })
      setComboCelebration(null)
    } catch (error) {
      console.error('[GameLogic] Error starting game:', error)
      eventTracker.trackError(error as Error, 'startGame')
    }
  }, [clampLevel, gameState.level, generateRandomTarget])

  const resetGame = useCallback(() => {
    GAME_CATEGORIES.forEach(cat => { cat.sequenceIndex = 0 })

    // Disable multi-touch handler when game ends
    multiTouchHandler.disable()

    // Reset performance metrics
    eventTracker.resetPerformanceMetrics()

    setGameObjects([])
    setGameState({
      progress: 0,
      currentTarget: "",
      targetEmoji: "",
      level: 0,
      gameStarted: false,
      winner: false,
      targetChangeTime: Date.now() + 10000,
      streak: 0
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

  // REMOVED: Emoji variety management effect - unnecessary complexity that caused performance issues
  // Pure random selection in spawnObject is sufficient for gameplay variety

  // Spawn objects - Optimized spawn rate
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      console.log('[GameLogic] Spawn effect - not spawning. Started:', gameState.gameStarted, 'Winner:', gameState.winner)
      return
    }

    console.log('[GameLogic] Spawn effect - starting object spawning')
    // Optimized spawn rate: balanced between engaging gameplay and performance
    const interval = setInterval(spawnObject, 1600) // 1.6 seconds - 20% faster than original, more sustainable
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
