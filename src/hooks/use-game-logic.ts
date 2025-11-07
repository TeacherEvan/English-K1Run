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

export interface WormObject {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  alive: boolean
  angle: number
  wigglePhase: number
  lane: PlayerSide
}

export interface SplatObject {
  id: string
  x: number
  y: number
  createdAt: number
  lane: PlayerSide
}

export interface Achievement {
  id: number
  type: 'correct' | 'worm'
  message: string
  emoji?: string
  x: number
  y: number
  playerSide: PlayerSide
}

const MAX_ACTIVE_OBJECTS = 30 // Increased to support 8 objects every 1.5s
const WORM_INITIAL_COUNT = 5 // Number of worms to spawn at game start
const WORM_PROGRESSIVE_SPAWN_INTERVAL = 3000 // 3 seconds between initial worm spawns
const WORM_RECURRING_COUNT = 3 // Number of worms to spawn every 30 seconds
const WORM_RECURRING_INTERVAL = 30000 // 30 seconds
const WORM_SIZE = 60
const WORM_BASE_SPEED = 1.5
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
  const [worms, setWorms] = useState<WormObject[]>([])
  const [splats, setSplats] = useState<SplatObject[]>([])
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [screenShake, setScreenShake] = useState(false)
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
  const [achievements, setAchievements] = useState<Achievement[]>([])

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

  // Animation frame ref for worm movement
  const wormAnimationFrameRef = useRef<number>()
  const wormSpeedMultiplier = useRef(1)
  
  // Refs for worm spawning timers
  const progressiveSpawnTimeoutRefs = useRef<NodeJS.Timeout[]>([])
  const recurringSpawnIntervalRef = useRef<NodeJS.Timeout>()

  // Helper function to create worms
  const createWorms = useCallback((count: number, startIndex: number = 0): WormObject[] => {
    return Array.from({ length: count }, (_, i) => {
      const actualIndex = startIndex + i
      const lane: PlayerSide = actualIndex % 2 === 0 ? 'left' : 'right'
      const [minX, maxX] = LANE_BOUNDS[lane]
      return {
        id: `worm-${Date.now()}-${actualIndex}`,
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * 300 + 100, // Start in visible area (100-400px)
        vx: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
        vy: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
        alive: true,
        angle: Math.random() * Math.PI * 2,
        wigglePhase: Math.random() * Math.PI * 2,
        lane
      }
    })
  }, [])

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
  // Spawn 2 target emojis immediately when target changes
  const spawnImmediateTargets = useCallback(() => {
    try {
      setGameObjects(prev => {
        if (prev.length >= MAX_ACTIVE_OBJECTS - 2) {
          // Ensure we have room for at least 2 targets
          return prev
        }

        const level = GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0]
        const currentTarget = gameStateRef.current.targetEmoji
        const targetItem = level.items.find(item => item.emoji === currentTarget)

        if (!targetItem) {
          return prev
        }

        const created: GameObject[] = []
        const now = Date.now()

        // Spawn exactly 2 target emojis - one on each side for fairness
        for (let i = 0; i < 2; i++) {
          const lane: PlayerSide = i === 0 ? 'left' : 'right'
          const [minX, maxX] = LANE_BOUNDS[lane]

          // Update emoji appearance tracking
          lastEmojiAppearance.current.set(targetItem.emoji, now)

          // Track emoji appearance in event tracker
          eventTracker.trackEmojiAppearance(targetItem.emoji, targetItem.name)

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
            id: `immediate-target-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            type: targetItem.name,
            emoji: targetItem.emoji,
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
          eventTracker.trackObjectSpawn(`immediate-targets-${created.length}`, { 
            count: created.length,
            reason: 'target_change'
          })
          return [...prev, ...created]
        }

        return prev
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnImmediateTargets')
    }
  }, [fallSpeedMultiplier])

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

          // Create achievement popup at tap location
          const achievementMessages = [
            { message: 'Perfect!', emoji: '⭐' },
            { message: 'Great Job!', emoji: '✨' },
            { message: 'Awesome!', emoji: '🌟' },
            { message: 'Excellent!', emoji: '💫' },
            { message: 'Super!', emoji: '🎉' },
            { message: 'Amazing!', emoji: '🎊' }
          ]
          const randomMsg = achievementMessages[Math.floor(Math.random() * achievementMessages.length)]
          setAchievements(prevAchievements => [...prevAchievements, {
            id: Date.now(),
            type: 'correct',
            message: randomMsg.message,
            emoji: randomMsg.emoji,
            x: tappedObject.x,
            y: tappedObject.y,
            playerSide: tappedObject.lane
          }])

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
            
            // Spawn 2 immediate target emojis for the new target
            setTimeout(() => spawnImmediateTargets(), 0)
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
              
              // Spawn 2 immediate target emojis for the new sequence target
              setTimeout(() => spawnImmediateTargets(), 0)
            }
          }
        } else {
          // Incorrect tap: no sound feedback - penalty applied
          newState.streak = 0
          newState.progress = Math.max(prev.progress - 20, 0)
          eventTracker.trackGameStateChange(prev, newState, 'incorrect_tap_penalty')
          
          // Trigger screen shake for incorrect tap
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 500) // Reset after animation completes
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
  }, [gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget, spawnImmediateTargets])

  const handleWormTap = useCallback((wormId: string, playerSide: 'left' | 'right') => {
    try {
      setWorms(prev => {
        const worm = prev.find(w => w.id === wormId)
        if (!worm || !worm.alive) return prev

        // Create achievement popup for worm tap
        const wormMessages = [
          { message: 'Got one!', emoji: '🐛' },
          { message: 'Nice catch!', emoji: '👍' },
          { message: 'Squish!', emoji: '💥' },
          { message: 'Gotcha!', emoji: '🎯' },
          { message: 'Wiggle wiggle!', emoji: '🐛' },
          { message: 'Worm away!', emoji: '✨' }
        ]
        const randomMsg = wormMessages[Math.floor(Math.random() * wormMessages.length)]
        setAchievements(prevAchievements => [...prevAchievements, {
          id: Date.now(),
          type: 'worm',
          message: randomMsg.message,
          emoji: randomMsg.emoji,
          x: worm.x,
          y: worm.y,
          playerSide: worm.lane
        }])

        // Create splat effect at worm position
        setSplats(prevSplats => [
          ...prevSplats,
          {
            id: `splat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            x: worm.x,
            y: worm.y,
            createdAt: Date.now(),
            lane: worm.lane
          }
        ])

        // Mark worm as dead
        const updatedWorms = prev.map(w =>
          w.id === wormId ? { ...w, alive: false } : w
        )

        // Increase speed for remaining worms (20% increase per kill)
        const aliveCount = updatedWorms.filter(w => w.alive).length
        if (aliveCount > 0) {
          wormSpeedMultiplier.current *= 1.2
        }

        eventTracker.trackEvent({
          type: 'info',
          category: 'worm',
          message: `Worm killed, ${aliveCount} remaining`,
          data: { wormId, playerSide, aliveCount }
        })

        return updatedWorms
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleWormTap')
    }
  }, [])

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
      setSplats([]) // Clear any existing splats
      setScreenShake(false) // Reset screen shake
      
      // Clear any existing worm spawn timers
      progressiveSpawnTimeoutRefs.current.forEach(timeout => clearTimeout(timeout))
      progressiveSpawnTimeoutRefs.current = []
      if (recurringSpawnIntervalRef.current) {
        clearInterval(recurringSpawnIntervalRef.current)
      }
      
      // Progressive worm spawning: spawn 5 worms progressively, 3 seconds apart
      setWorms([]) // Start with no worms
      wormSpeedMultiplier.current = 1 // Reset worm speed
      
      for (let i = 0; i < WORM_INITIAL_COUNT; i++) {
        const timeout = setTimeout(() => {
          setWorms(prev => [...prev, ...createWorms(1, i)])
          eventTracker.trackEvent({
            type: 'info',
            category: 'worm',
            message: `Progressive spawn: worm ${i + 1}/${WORM_INITIAL_COUNT}`,
            data: { wormIndex: i }
          })
        }, i * WORM_PROGRESSIVE_SPAWN_INTERVAL)
        progressiveSpawnTimeoutRefs.current.push(timeout)
      }
      
      // Set up recurring worm spawning: 3 worms every 30 seconds
      recurringSpawnIntervalRef.current = setInterval(() => {
        setWorms(prev => {
          const aliveCount = prev.filter(w => w.alive).length
          const newWorms = createWorms(WORM_RECURRING_COUNT, prev.length)
          
          eventTracker.trackEvent({
            type: 'info',
            category: 'worm',
            message: `Recurring spawn: ${WORM_RECURRING_COUNT} worms (${aliveCount} already alive)`,
            data: { recurringSpawn: true, aliveCount, newCount: WORM_RECURRING_COUNT }
          })
          
          return [...prev, ...newWorms]
        })
      }, WORM_RECURRING_INTERVAL)

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
      
      // Spawn 2 immediate target emojis when game starts
      setTimeout(() => spawnImmediateTargets(), 100)
    } catch (error) {
      eventTracker.trackError(error as Error, 'startGame')
    }
  }, [clampLevel, gameState.level, generateRandomTarget, spawnImmediateTargets, createWorms])

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
    
    // Clear worm spawn timers
    progressiveSpawnTimeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    progressiveSpawnTimeoutRefs.current = []
    if (recurringSpawnIntervalRef.current) {
      clearInterval(recurringSpawnIntervalRef.current)
    }

    setGameObjects([])
    setWorms([]) // Clear worms when game ends
    setSplats([]) // Clear splats when game ends
    setScreenShake(false) // Reset screen shake
    wormSpeedMultiplier.current = 1 // Reset worm speed
    
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
        
        // Spawn 2 immediate target emojis for the new target
        setTimeout(() => spawnImmediateTargets(), 0)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, gameState.targetChangeTime, currentCategory.requiresSequence, generateRandomTarget, setGameState, spawnImmediateTargets])

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

  // Worm movement animation loop using requestAnimationFrame
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      // Clean up animation frame when game is not active
      if (wormAnimationFrameRef.current) {
        cancelAnimationFrame(wormAnimationFrameRef.current)
      }
      return
    }

    const animate = () => {
      setWorms(prev => prev.map(worm => {
        if (!worm.alive) return worm

        // Get viewport dimensions for boundary checking
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

        // Update position with speed multiplier
        let newX = worm.x + (worm.vx * wormSpeedMultiplier.current) / 10
        let newY = worm.y + (worm.vy * wormSpeedMultiplier.current) / 10

        // Bounce off walls with lane-specific boundaries
        let newVx = worm.vx
        let newVy = worm.vy
        const [minX, maxX] = LANE_BOUNDS[worm.lane]
        
        // Calculate margins to prevent worms from clipping boundaries
        const boundsMarginX = (WORM_SIZE / viewportWidth) * 100
        const boundsMarginY = WORM_SIZE // Use pixels for Y boundaries

        if (newX <= minX + boundsMarginX || newX >= maxX - boundsMarginX) {
          newVx = -worm.vx
          newX = Math.max(minX + boundsMarginX, Math.min(maxX - boundsMarginX, newX))
        }

        if (newY <= boundsMarginY || newY >= viewportHeight - boundsMarginY) {
          newVy = -worm.vy
          newY = Math.max(boundsMarginY, Math.min(viewportHeight - boundsMarginY, newY))
        }

        // Update wiggle phase for animation
        const newWigglePhase = (worm.wigglePhase + 0.1) % (Math.PI * 2)

        // Update angle based on velocity direction
        const newAngle = Math.atan2(newVy, newVx)

        return {
          ...worm,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          angle: newAngle,
          wigglePhase: newWigglePhase
        }
      }))

      wormAnimationFrameRef.current = requestAnimationFrame(animate)
    }

    wormAnimationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (wormAnimationFrameRef.current) {
        cancelAnimationFrame(wormAnimationFrameRef.current)
      }
    }
  }, [gameState.gameStarted, gameState.winner])
  
  // Splat cleanup and currentTime update
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return
    
    const SPLAT_DURATION = 8000 // 8 seconds
    // Update every 500ms for smoother fade while reducing re-renders
    const interval = setInterval(() => {
      const now = Date.now()
      setCurrentTime(now)
      // Remove splats older than 8 seconds
      setSplats(prev => prev.filter(splat => now - splat.createdAt < SPLAT_DURATION))
    }, 500) // Reduced from 100ms to 500ms for better performance
    
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner])

  const clearComboCelebration = useCallback(() => setComboCelebration(null), [])

  // Change target to a random emoji from currently visible objects
  const changeTargetToVisibleEmoji = useCallback(() => {
    try {
      // Get unique emojis from currently visible objects
      const visibleEmojis = new Set<string>()
      for (const obj of gameObjectsRef.current) {
        visibleEmojis.add(obj.emoji)
      }

      // Convert to array and filter out current target
      const availableEmojis = Array.from(visibleEmojis).filter(
        emoji => emoji !== gameStateRef.current.targetEmoji
      )

      // If no other emojis available, do nothing
      if (availableEmojis.length === 0) {
        if (import.meta.env.DEV) {
          console.log('[TargetDisplay] No other visible emojis to switch to')
        }
        return
      }

      // Pick a random emoji from visible ones
      const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)]
      
      // Find the corresponding item in current category
      const targetItem = currentCategory.items.find(item => item.emoji === randomEmoji)
      
      if (!targetItem) {
        if (import.meta.env.DEV) {
          console.log('[TargetDisplay] Could not find item for emoji:', randomEmoji)
        }
        return
      }

      // Update game state with new target
      setGameState(prev => {
        const newState = {
          ...prev,
          currentTarget: targetItem.name,
          targetEmoji: targetItem.emoji,
          targetChangeTime: Date.now() + 10000 // Reset timer
        }
        eventTracker.trackGameStateChange(prev, newState, 'manual_target_change_via_click')
        return newState
      })

      // Spawn 2 immediate target emojis for the new target
      setTimeout(() => spawnImmediateTargets(), 0)

      if (import.meta.env.DEV) {
        console.log('[TargetDisplay] Changed target to:', targetItem.name)
      }
    } catch (error) {
      eventTracker.trackError(error as Error, 'changeTargetToVisibleEmoji')
    }
  }, [currentCategory, spawnImmediateTargets])

  return {
    gameObjects,
    worms,
    splats,
    currentTime,
    screenShake,
    gameState,
    currentCategory,
    handleObjectTap,
    handleWormTap,
    startGame,
    resetGame,
    comboCelebration,
    clearComboCelebration,
    changeTargetToVisibleEmoji,
    achievements,
    clearAchievement: (achievementId: number) => {
      setAchievements(prev => prev.filter(a => a.id !== achievementId))
    }
  }
}
