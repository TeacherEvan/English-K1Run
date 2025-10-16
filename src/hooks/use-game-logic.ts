import { useCallback, useEffect, useRef, useState } from 'react'
// import { useKV } from '@github/spark/hooks'
import { eventTracker } from '../lib/event-tracker'
import { playSoundEffect } from '../lib/sound-manager'
import { multiTouchHandler } from '../lib/touch-handler'

type PlayerSide = 'left' | 'right'

export interface GameObject {
  id: string
  type: string
  emoji: string
  x: number
  y: number
  speed: number
  size: number
  lane: PlayerSide
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

const MAX_ACTIVE_OBJECTS = 30 // Increased to support 8 objects every 1.5s
const EMOJI_SIZE = 60
const MIN_VERTICAL_GAP = 120
const HORIZONTAL_SEPARATION = 6
const COLLISION_MIN_SEPARATION = 8
const SPAWN_COUNT = 8 // Always spawn exactly 8 objects
const TARGET_GUARANTEE_COUNT = 2 // Ensure 2 of the 8 spawned objects are the current target
const LANE_BOUNDS: Record<PlayerSide, [number, number]> = {
  left: [10, 45],
  right: [55, 90]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
      { emoji: "🥦", name: "broccoli" },
      { emoji: "🍊", name: "orange" },
      { emoji: "🍋", name: "lemon" },
      { emoji: "🍑", name: "peach" },
      { emoji: "🍒", name: "cherry" },
      { emoji: "🥝", name: "kiwi" }
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
      { emoji: "🔟", name: "ten" },
      { emoji: "11", name: "eleven" },
      { emoji: "12", name: "twelve" },
      { emoji: "13", name: "thirteen" },
      { emoji: "14", name: "fourteen" },
      { emoji: "15", name: "fifteen" }
    ]
  },
  {
    name: "Shapes & Colors",
    items: [
      { emoji: "🔵", name: "blue" },
      { emoji: "🟥", name: "red" },
      { emoji: "🔶", name: "orange" },
      { emoji: "🟩", name: "green" },
      { emoji: "🔺", name: "triangle" },
      { emoji: "⭐", name: "star" },
      { emoji: "🟣", name: "purple" },
      { emoji: "⚪", name: "white" },
      { emoji: "🟡", name: "yellow" },
      { emoji: "🟤", name: "brown" },
      { emoji: "⬛", name: "black" },
      { emoji: "🔷", name: "diamond" },
      { emoji: "🟠", name: "circle" }
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
      { emoji: "🌸", name: "flower" },
      { emoji: "🐘", name: "elephant" },
      { emoji: "🦁", name: "lion" },
      { emoji: "🐰", name: "rabbit" },
      { emoji: "🦒", name: "giraffe" },
      { emoji: "🐧", name: "penguin" }
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
      { emoji: "🚤", name: "boat" },
      { emoji: "🚂", name: "train" },
      { emoji: "🚕", name: "taxi" },
      { emoji: "🚙", name: "van" },
      { emoji: "🛴", name: "scooter" },
      { emoji: "🛵", name: "motorcycle" }
    ]
  },
  {
    name: "Weather Wonders",
    items: [
      { emoji: "☀️", name: "sunny" },
      { emoji: "☁️", name: "cloudy" },
      { emoji: "🌧️", name: "rainy" },
      { emoji: "⛈️", name: "stormy" },
      { emoji: "❄️", name: "snowy" },
      { emoji: "🌈", name: "rainbow" },
      { emoji: "🌪️", name: "tornado" },
      { emoji: "🌬️", name: "windy" },
      { emoji: "🌙", name: "moon" },
      { emoji: "⭐", name: "star" },
      { emoji: "🌞", name: "sun" },
      { emoji: "🌫️", name: "foggy" },
      { emoji: "⚡", name: "lightning" }
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
      { emoji: "🤸", name: "flip" },
      { emoji: "😊", name: "smile" },
      { emoji: "😂", name: "laugh" },
      { emoji: "🤔", name: "think" },
      { emoji: "🎉", name: "celebrate" },
      { emoji: "👋", name: "wave" }
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
      { emoji: "🦵", name: "leg" },
      { emoji: "🦷", name: "tooth" },
      { emoji: "💪", name: "arm" },
      { emoji: "👂", name: "ear" },
      { emoji: "🧠", name: "brain" },
      { emoji: "❤️", name: "heart" }
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
      { emoji: "J", name: "J" },
      { emoji: "K", name: "K" },
      { emoji: "L", name: "L" },
      { emoji: "M", name: "M" },
      { emoji: "N", name: "N" },
      { emoji: "O", name: "O" }
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

  // Track last appearance time for each emoji to ensure all appear within 10 seconds
  const lastEmojiAppearance = useRef<Map<string, number>>(new Map())
  const ROTATION_THRESHOLD = 10000 // 10 seconds as requested in the issue

  // Target pool system: ensures all targets are requested before any repeats
  // Shuffled array of remaining targets for current level
  const targetPool = useRef<Array<{ emoji: string; name: string }>>([])

  // Cache stale emojis to avoid recalculating every spawn (performance optimization)
  const staleEmojisCache = useRef<{ emojis: Array<{ emoji: string; name: string }>; timestamp: number }>({
    emojis: [],
    timestamp: 0
  })

  // Background rotation is handled in App.tsx, not here

  // Use ref to access current game state in callbacks without causing re-creation
  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Keep a ref to gameObjects to avoid stale closures inside callbacks (e.g. taps)
  const gameObjectsRef = useRef<GameObject[]>(gameObjects)
  useEffect(() => {
    gameObjectsRef.current = gameObjects
  }, [gameObjects])

  const clampLevel = useCallback((levelIndex: number) => {
    if (Number.isNaN(levelIndex)) return 0
    return Math.max(0, Math.min(levelIndex, GAME_CATEGORIES.length - 1))
  }, [])

  const currentCategory = GAME_CATEGORIES[gameState.level] || GAME_CATEGORIES[0]

  // Fisher-Yates shuffle algorithm for randomizing target pool
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // Refill target pool with shuffled items from current category
  const refillTargetPool = useCallback((levelIndex?: number) => {
    const level = levelIndex !== undefined ? levelIndex : gameState.level
    const category = GAME_CATEGORIES[level] || GAME_CATEGORIES[0]
    targetPool.current = shuffleArray(category.items)

    if (import.meta.env.DEV) {
      console.log(`[TargetPool] Refilled with ${targetPool.current.length} items (shuffled)`)
    }
  }, [gameState.level, shuffleArray])

  useEffect(() => {
    if (gameState.gameStarted && gameState.currentTarget) {
      void playSoundEffect.voice(gameState.currentTarget)
    }
  }, [gameState.gameStarted, gameState.currentTarget])

  const generateRandomTarget = useCallback((levelOverride?: number) => {
    const levelIndex = clampLevel(levelOverride ?? gameState.level)
    const category = GAME_CATEGORIES[levelIndex] || GAME_CATEGORIES[0]

    // Sequence mode (Alphabet Challenge) - use sequential order
    if (category.requiresSequence) {
      const sequenceIndex = category.sequenceIndex || 0
      const targetItem = category.items[sequenceIndex % category.items.length]
      return { name: targetItem.name, emoji: targetItem.emoji }
    }

    // Non-sequence mode - use target pool to ensure no repeats until all targets used
    // If pool is empty, refill it with shuffled items
    if (targetPool.current.length === 0) {
      refillTargetPool(levelIndex)
    }

    // Pop the next target from the pool
    const targetItem = targetPool.current.pop()!

    if (import.meta.env.DEV) {
      console.log(`[TargetPool] Selected "${targetItem.name}", ${targetPool.current.length} remaining`)
    }

    return { name: targetItem.name, emoji: targetItem.emoji }
  }, [clampLevel, gameState.level, refillTargetPool])
  // Target initialization is handled in startGame function

  // Spawn objects while respecting lane separation and the active object cap
  const spawnObject = useCallback(() => {
    try {
      setGameObjects(prev => {
        if (prev.length >= MAX_ACTIVE_OBJECTS) {
          return prev
        }

        const level = GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0]
        const currentTarget = gameStateRef.current.targetEmoji
        const availableSlots = MAX_ACTIVE_OBJECTS - prev.length
        const actualSpawnCount = Math.min(availableSlots, SPAWN_COUNT)
        const created: GameObject[] = []

        if (actualSpawnCount <= 0) {
          return prev
        }

        // Track emojis spawned in this batch to prevent duplicates
        const spawnedInBatch = new Set<string>()
        // Track recently active emojis on screen to reduce duplicates
        const activeEmojis = new Set<string>()
        for (const obj of prev) {
          activeEmojis.add(obj.emoji)
        }

        // Get stale emojis (cached for 5 seconds to avoid recalculating every spawn)
        const now = Date.now()
        let staleEmojis: Array<{ emoji: string; name: string }>

        if (now - staleEmojisCache.current.timestamp > 5000) {
          // Recalculate stale emojis (haven't appeared in 10 seconds)
          staleEmojis = level.items.filter(item => {
            const lastSeen = lastEmojiAppearance.current.get(item.emoji)
            return !lastSeen || (now - lastSeen) > ROTATION_THRESHOLD
          })
          staleEmojisCache.current = { emojis: staleEmojis, timestamp: now }
        } else {
          // Use cached value
          staleEmojis = staleEmojisCache.current.emojis
        }

        // Helper function to select item (prevents duplicate code)
        const selectItem = () => {
          if (staleEmojis.length > 0 && Math.random() < 0.7) {
            return staleEmojis[Math.floor(Math.random() * staleEmojis.length)]
          }
          return level.items[Math.floor(Math.random() * level.items.length)]
        }

        // CRITICAL: First, spawn TARGET_GUARANTEE_COUNT instances of the current target
        // This ensures the requested emoji is ALWAYS visible on screen
        const targetItem = level.items.find(item => item.emoji === currentTarget)
        let targetSpawnCount = 0

        if (targetItem) {
          for (let i = 0; i < Math.min(TARGET_GUARANTEE_COUNT, actualSpawnCount); i++) {
            const { minX, maxX, lane } = (() => {
              const chosenLane: PlayerSide = Math.random() < 0.5 ? 'left' : 'right'
              const [laneMin, laneMax] = LANE_BOUNDS[chosenLane]
              return { minX: laneMin, maxX: laneMax, lane: chosenLane }
            })()

            const item = targetItem
            spawnedInBatch.add(item.emoji)
            lastEmojiAppearance.current.set(item.emoji, now)
            targetSpawnCount++

            // Track emoji appearance in event tracker
            eventTracker.trackEmojiAppearance(item.emoji, item.name)
            let spawnX = Math.random() * (maxX - minX) + minX
            let spawnY = -EMOJI_SIZE - i * MIN_VERTICAL_GAP

            const laneObjects = [...prev, ...created].filter(obj => obj.lane === lane)
            for (const existing of laneObjects) {
              const verticalGap = Math.abs(existing.y - spawnY)
              const horizontalGap = Math.abs(existing.x - spawnX)

              if (verticalGap < MIN_VERTICAL_GAP) {
                spawnY = Math.min(spawnY, existing.y - MIN_VERTICAL_GAP)
              }

              if (horizontalGap < HORIZONTAL_SEPARATION && verticalGap < MIN_VERTICAL_GAP * 1.2) {
                spawnX = clamp(
                  spawnX < existing.x ? existing.x - HORIZONTAL_SEPARATION : existing.x + HORIZONTAL_SEPARATION,
                  minX,
                  maxX
                )
              }
            }

            const newObject: GameObject = {
              id: `target-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
              type: item.name,
              emoji: item.emoji,
              x: spawnX,
              y: spawnY,
              speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
              size: EMOJI_SIZE,
              lane
            }

            eventTracker.trackEmojiLifecycle({
              objectId: newObject.id,
              emoji: newObject.emoji,
              name: newObject.type,
              phase: 'spawned',
              position: { x: newObject.x, y: newObject.y },
              playerSide: newObject.lane
            })

            created.push(newObject)
          }
        }

        // Now spawn the remaining objects (actualSpawnCount - targetSpawnCount)
        for (let i = targetSpawnCount; i < actualSpawnCount; i++) {
          const { minX, maxX, lane } = (() => {
            const chosenLane: PlayerSide = Math.random() < 0.5 ? 'left' : 'right'
            const [laneMin, laneMax] = LANE_BOUNDS[chosenLane]
            return { minX: laneMin, maxX: laneMax, lane: chosenLane }
          })()

          // Select item using helper function (prioritizes stale emojis)
          let item = selectItem()

          // Try to avoid duplicates in current batch and on screen
          let attempts = 0
          const maxAttempts = level.items.length * 2
          while (attempts < maxAttempts && (spawnedInBatch.has(item.emoji) ||
            (activeEmojis.has(item.emoji) && Math.random() > 0.3))) {
            item = selectItem()
            attempts++
          }

          // Mark this emoji as spawned in current batch and update last appearance time
          spawnedInBatch.add(item.emoji)
          lastEmojiAppearance.current.set(item.emoji, now)

          // Mark this emoji as spawned in current batch and update last appearance time
          spawnedInBatch.add(item.emoji)
          lastEmojiAppearance.current.set(item.emoji, now)

          // Track emoji appearance in event tracker
          eventTracker.trackEmojiAppearance(item.emoji, item.name)
          let spawnX = Math.random() * (maxX - minX) + minX
          let spawnY = -EMOJI_SIZE - i * MIN_VERTICAL_GAP

          const laneObjects = [...prev, ...created].filter(obj => obj.lane === lane)
          for (const existing of laneObjects) {
            const verticalGap = Math.abs(existing.y - spawnY)
            const horizontalGap = Math.abs(existing.x - spawnX)

            if (verticalGap < MIN_VERTICAL_GAP) {
              spawnY = Math.min(spawnY, existing.y - MIN_VERTICAL_GAP)
            }

            if (horizontalGap < HORIZONTAL_SEPARATION && verticalGap < MIN_VERTICAL_GAP * 1.2) {
              spawnX = clamp(
                spawnX < existing.x ? existing.x - HORIZONTAL_SEPARATION : existing.x + HORIZONTAL_SEPARATION,
                minX,
                maxX
              )
            }
          }

          const newObject: GameObject = {
            id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            type: item.name,
            emoji: item.emoji,
            x: spawnX,
            y: spawnY,
            speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
            size: EMOJI_SIZE,
            lane
          }

          eventTracker.trackEmojiLifecycle({
            objectId: newObject.id,
            emoji: newObject.emoji,
            name: newObject.type,
            phase: 'spawned',
            position: { x: newObject.x, y: newObject.y },
            playerSide: newObject.lane
          })

          created.push(newObject)
        }

        if (created.length > 0) {
          eventTracker.trackObjectSpawn(`batch-${created.length}`, { count: created.length })
          return [...prev, ...created]
        }

        return prev
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [fallSpeedMultiplier])

  const processLane = useCallback((laneObjects: GameObject[], lane: PlayerSide) => {
    const [minX, maxX] = LANE_BOUNDS[lane]
    const laneLength = laneObjects.length

    // Early exit if no objects to process
    if (laneLength === 0) return

    for (let i = 0; i < laneLength; i++) {
      const current = laneObjects[i]
      current.x = clamp(current.x, minX, maxX)

      // Skip collision detection for objects still spawning (y < 0)
      // This prevents the 8 newly spawned emojis from pushing each other around
      if (current.y < 0) continue

      // Early exit if only one object or current is last object
      if (i === laneLength - 1) break

      for (let j = i + 1; j < laneLength; j++) {
        const other = laneObjects[j]

        // Skip collision with objects still spawning (y < 0)
        if (other.y < 0) continue

        const verticalGap = Math.abs(current.y - other.y)

        // Early exit: objects far apart vertically don't need collision check
        if (verticalGap > MIN_VERTICAL_GAP) continue

        const horizontalGap = Math.abs(current.x - other.x)

        // Early exit: objects far enough apart horizontally or exactly overlapping
        if (horizontalGap >= COLLISION_MIN_SEPARATION || horizontalGap === 0) continue

        const overlap = (COLLISION_MIN_SEPARATION - horizontalGap) / 2
        const direction = current.x < other.x ? -1 : 1

        current.x = clamp(current.x + overlap * direction, minX, maxX)
        other.x = clamp(other.x - overlap * direction, minX, maxX)
      }
    }
  }, [])

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => {
        // Early exit if no objects to update
        if (prev.length === 0) return prev

        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
        const speedMultiplier = 0.6
        const updated: GameObject[] = []

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier

          if (newY < screenHeight + EMOJI_SIZE) {
            updated.push({ ...obj, y: newY })
          } else {
            eventTracker.trackEmojiLifecycle({
              objectId: obj.id,
              emoji: obj.emoji,
              name: obj.type,
              phase: 'missed',
              position: { x: obj.x, y: Math.min(obj.y, screenHeight + EMOJI_SIZE) },
              playerSide: obj.lane,
              data: {
                reason: 'fell_off_screen',
                actualY: obj.y,
                calculatedY: newY,
                screenHeight
              }
            })
          }
        }

        // Only process collision detection if we have multiple objects
        if (updated.length > 1) {
          // Single-pass separation into lanes (performance optimization)
          const leftObjects: GameObject[] = []
          const rightObjects: GameObject[] = []

          for (const obj of updated) {
            if (obj.lane === 'left') {
              leftObjects.push(obj)
            } else {
              rightObjects.push(obj)
            }
          }

          // Only process lanes that have objects
          if (leftObjects.length > 1) processLane(leftObjects, 'left')
          if (rightObjects.length > 1) processLane(rightObjects, 'right')
        }

        return updated
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'updateObjects')
    }
  }, [processLane])

  const handleObjectTap = useCallback((objectId: string, playerSide: 'left' | 'right') => {
    const tapStartTime = performance.now()

    try {
      // Use ref to avoid stale `gameObjects` value inside this callback
      const tappedObject = gameObjectsRef.current.find(obj => obj.id === objectId)
      if (!tappedObject) {
        eventTracker.trackWarning('Tapped object not found', { objectId, playerSide })
        return
      }

      const isCorrect = currentCategory.requiresSequence
        ? tappedObject.type === gameState.currentTarget
        : tappedObject.emoji === gameState.targetEmoji

      const tapLatency = performance.now() - tapStartTime
      eventTracker.trackObjectTap(objectId, isCorrect, tappedObject.lane, tapLatency)

      // Track emoji lifecycle - tapped phase
      eventTracker.trackEmojiLifecycle({
        objectId: tappedObject.id,
        emoji: tappedObject.emoji,
        name: tappedObject.type,
        phase: 'tapped',
        position: { x: tappedObject.x, y: tappedObject.y },
        playerSide: tappedObject.lane,
        data: { isCorrect, tapLatency }
      })

      setGameState(prev => {
        const newState = { ...prev }

        if (isCorrect) {
          // Correct tap: play voice pronunciation only (no background success sound)
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
            // Win sound removed - only target pronunciations allowed
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
          // Incorrect tap: no sound feedback - penalty applied
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
            playerSide: tappedObject.lane,
            data: { reason: 'tapped', isCorrect }
          })
        }
        return prev.filter(obj => obj.id !== objectId)
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleObjectTap')
    }
  }, [gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget])

  const startGame = useCallback((levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameState.level)

      // Enable multi-touch handler for advanced touch support
      multiTouchHandler.enable()

      if (GAME_CATEGORIES[safeLevel].requiresSequence) {
        GAME_CATEGORIES[safeLevel].sequenceIndex = 0
      }

      // Reset emoji appearance tracking for new game
      lastEmojiAppearance.current.clear()

      // Reset target pool for new level (ensures fresh shuffle)
      targetPool.current = []

      // Initialize emoji rotation tracking in event tracker
      const currentCategory = GAME_CATEGORIES[safeLevel]
      eventTracker.initializeEmojiTracking(currentCategory.items)

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
          winner: false,
          progress: 0,
          streak: 0
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

    // Disable multi-touch handler when game ends
    multiTouchHandler.disable()

    // Reset emoji appearance tracking
    lastEmojiAppearance.current.clear()

    // Reset target pool
    targetPool.current = []

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

  // Spawn objects - 8 emojis every 1.5 seconds with guaranteed target visibility
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      return
    }

    const interval = setInterval(spawnObject, 1500) // 1.5 seconds = 1500ms
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, spawnObject])

  // Update object positions using requestAnimationFrame for smooth 60fps
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    let animationFrameId: number
    let lastUpdateTime = performance.now()
    const targetFps = 60
    const frameInterval = 1000 / targetFps

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastUpdateTime

      if (elapsed >= frameInterval) {
        updateObjects()
        lastUpdateTime = currentTime - (elapsed % frameInterval)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
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
