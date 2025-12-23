/**
 * Core game type definitions
 * Extracted from use-game-logic.ts for better code organization
 */

export type PlayerSide = 'left' | 'right'

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
    items: GameCategoryItem[]
    requiresSequence?: boolean
    sequenceIndex?: number
}

export interface GameCategoryItem {
    emoji: string
    name: string
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

export interface FairyTransformObject {
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

export interface UseGameLogicOptions {
    fallSpeedMultiplier?: number
    continuousMode?: boolean
}
