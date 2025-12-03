// TODO: Consider refactoring animation logic (see TODO.md Phase 1)
// Current approach: JS-based position updates (heavy on main thread)
// Optimization opportunity:
// 1. Extract animation presets to constants/fairy-animations.ts
// 2. Consider using CSS animations/keyframes instead of JS
// 3. Use CSS transforms for GPU acceleration
// Impact: Better performance, smoother animations, easier customization
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { FairyTransformObject } from '../hooks/use-game-logic'

interface FairyTransformationProps {
    fairy: FairyTransformObject
}

interface TrailSparkle {
    id: number
    x: number  // percentage
    y: number  // pixels
    size: number
    opacity: number
}

interface OrbitSparkle {
    id: number
    angle: number
    distance: number
    speed: number
    size: number
    color: string
}

// Animation timing constants
const MORPH_DURATION = 3000 // 3 seconds morphing
const FLY_DURATION = 2000 // 2 seconds flying
const TRAIL_FADE_DURATION = 5000 // 5 seconds trail fade
const TOTAL_DURATION = MORPH_DURATION + FLY_DURATION + TRAIL_FADE_DURATION // 10 seconds total

// Visual constants
const FAIRY_SIZE = 80
const SPARKLE_COUNT = 12 // Sparkles orbiting the fairy
const MAX_TRAIL_SPARKLES = 30 // Maximum trail sparkles at any time

// Gold color palette
const GOLD_COLORS = ['#FFD700', '#FFA500', '#FFE4B5', '#FFEC8B', '#F0E68C']

// Generate initial sparkles outside render
const createOrbitingSparkles = (): OrbitSparkle[] => {
    return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / SPARKLE_COUNT,
        distance: 40 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5,
        size: 8 + Math.random() * 8,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)]
    }))
}

// Generate fly target outside render
// x is percentage (0-100), y is pixels
const createFlyTarget = (fairyX: number, fairyY: number): { x: number, y: number } => {
    const edge = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
    const screenHeight = window.innerHeight || 800
    switch (edge) {
        case 0: return { x: fairyX + (Math.random() - 0.5) * 40, y: -100 } // top (pixels)
        case 1: return { x: 110, y: fairyY + (Math.random() - 0.5) * 200 } // right
        case 2: return { x: fairyX + (Math.random() - 0.5) * 40, y: screenHeight + 100 } // bottom (pixels)
        default: return { x: -20, y: fairyY + (Math.random() - 0.5) * 200 } // left
    }
}

// Generate stable bezier control point
const createBezierControl = (startX: number, startY: number, endX: number, endY: number): { x: number, y: number } => {
    return {
        x: startX + (endX - startX) * 0.5 + (Math.random() - 0.5) * 20,
        y: Math.min(startY, endY) - 50 - Math.random() * 50 // Arc upward
    }
}

export const FairyTransformation = memo(({ fairy }: FairyTransformationProps) => {
    const [now, setNow] = useState(() => Date.now())
    const age = now - fairy.createdAt
    const sparkleIdRef = useRef(0)
    const frameCountRef = useRef(0)

    // Debug: log initial position
    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log(`[FairyTransformation] Rendering at x=${fairy.x}%, y=${fairy.y}px, lane=${fairy.lane}`)
        }
    }, [fairy.x, fairy.y, fairy.lane])

    // Initialize random values in useState to keep them stable
    const [orbitingSparkles] = useState<OrbitSparkle[]>(() => createOrbitingSparkles())
    const [flyTarget] = useState(() => createFlyTarget(fairy.x, fairy.y))
    // Store bezier control point once to prevent jittery animation
    const [bezierControl] = useState(() => createBezierControl(fairy.x, fairy.y, flyTarget.x, flyTarget.y))

    const [trailSparkles, setTrailSparkles] = useState<TrailSparkle[]>([])

    // Determine current phase
    const phase = useMemo(() => {
        if (age < MORPH_DURATION) return 'morphing'
        if (age < MORPH_DURATION + FLY_DURATION) return 'flying'
        return 'trail-fading'
    }, [age])

    // Calculate fairy position derived from age (no state needed)
    const fairyPos = useMemo(() => {
        if (phase !== 'flying') return { x: fairy.x, y: fairy.y }

        const flyStartTime = fairy.createdAt + MORPH_DURATION
        const flyAge = now - flyStartTime

        // Eased progress (ease-out cubic)
        const progress = Math.min(1, flyAge / FLY_DURATION)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        // Quadratic bezier using stable control point
        const t = easedProgress
        const newX = (1 - t) * (1 - t) * fairy.x + 2 * (1 - t) * t * bezierControl.x + t * t * flyTarget.x
        const newY = (1 - t) * (1 - t) * fairy.y + 2 * (1 - t) * t * bezierControl.y + t * t * flyTarget.y

        return { x: newX, y: newY }
    }, [phase, now, fairy.createdAt, fairy.x, fairy.y, flyTarget, bezierControl])

    // Animation loop - optimized to reduce state updates
    // Uses RAF timestamp for consistent timing
    useEffect(() => {
        let animationFrameId: number
        let lastUpdateTime = 0
        let startTime = 0 // RAF start time to compute age consistently
        const UPDATE_INTERVAL = 33 // ~30fps for trail sparkles (enough for smooth animation)

        const animate = (currentNow: number) => {
            // Initialize start time on first frame
            if (startTime === 0) {
                startTime = currentNow - (Date.now() - fairy.createdAt)
            }

            frameCountRef.current++

            // Throttle state updates to reduce re-renders
            const timeSinceLastUpdate = currentNow - lastUpdateTime
            if (timeSinceLastUpdate >= UPDATE_INTERVAL) {
                lastUpdateTime = currentNow
                setNow(Date.now())
            }

            // Handle trail sparkles - use RAF-based age calculation
            const currentAge = currentNow - startTime
            const currentPhase = currentAge < MORPH_DURATION ? 'morphing' :
                currentAge < MORPH_DURATION + FLY_DURATION ? 'flying' : 'trail-fading'

            // Sparkle fade logic - only update when we have sparkles or spawning new ones
            // Only spawn new sparkles every 6 frames (~10fps) to reduce overhead
            const shouldSpawnNew = currentPhase === 'flying' && frameCountRef.current % 6 === 0
            
            if (currentPhase === 'flying' || currentPhase === 'trail-fading') {
                setTrailSparkles(prev => {
                    if (prev.length === 0 && !shouldSpawnNew) return prev
                    
                    // Fade existing sparkles
                    const faded = prev
                        .map(s => ({ ...s, opacity: s.opacity - 0.015, y: s.y + 0.5 }))
                        .filter(s => s.opacity > 0)
                    
                    // Add new sparkle if in flying phase and on spawn frame
                    if (shouldSpawnNew) {
                        const flyStartTime = MORPH_DURATION
                        const flyAge = currentAge - flyStartTime
                        const progress = Math.min(1, flyAge / FLY_DURATION)
                        const easedProgress = 1 - Math.pow(1 - progress, 3)
                        const t = easedProgress

                        const currentX = (1 - t) * (1 - t) * fairy.x + 2 * (1 - t) * t * bezierControl.x + t * t * flyTarget.x
                        const currentY = (1 - t) * (1 - t) * fairy.y + 2 * (1 - t) * t * bezierControl.y + t * t * flyTarget.y

                        const newSparkle: TrailSparkle = {
                            id: sparkleIdRef.current++,
                            x: currentX + (Math.random() - 0.5) * 15,
                            y: currentY + (Math.random() - 0.5) * 30,
                            size: 8 + Math.random() * 12,
                            opacity: 1
                        }
                        return [...faded.slice(-MAX_TRAIL_SPARKLES), newSparkle]
                    }
                    
                    return faded
                })
            }

            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrameId)
    }, [fairy.createdAt, fairy.x, fairy.y, flyTarget, bezierControl])

    // Calculate morph progress (0-1) during morphing phase

    // Calculate morph progress (0-1) during morphing phase
    const morphProgress = phase === 'morphing' ? Math.min(1, age / MORPH_DURATION) : 1

    // Calculate visibility
    const isVisible = age < TOTAL_DURATION
    const fairyOpacity = phase === 'trail-fading' ? 0 :
        phase === 'flying' ? Math.max(0, 1 - (age - MORPH_DURATION - FLY_DURATION * 0.7) / (FLY_DURATION * 0.3)) : 1

    // Don't render if animation is complete
    if (!isVisible && trailSparkles.length === 0) return null

    // Worm fade-out, fairy fade-in during morph
    const wormOpacity = Math.max(0, 1 - morphProgress * 2) // Fades out in first half
    const fairyFadeIn = Math.min(1, morphProgress * 2 - 0.5) // Fades in second half

    // Scale animation during morph
    const morphScale = 0.5 + morphProgress * 0.7 + Math.sin(morphProgress * Math.PI * 4) * 0.1

    // Glow intensity pulsates
    const glowIntensity = 10 + Math.sin(age / 100) * 5

    return (
        <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 20 }}>
            {/* Morphing/Flying Fairy */}
            {fairyOpacity > 0 && (
                <div
                    className="absolute fairy-transform"
                    style={{
                        left: `${fairyPos.x}%`,
                        top: `${fairyPos.y}px`, // y is in pixels
                        width: `${FAIRY_SIZE}px`,
                        height: `${FAIRY_SIZE}px`,
                        fontSize: `${FAIRY_SIZE}px`,
                        transform: `translate(-50%, -50%) scale(${morphScale}) rotate(${morphProgress * 360}deg)`,
                        filter: `drop-shadow(0 0 ${glowIntensity}px #FFD700) drop-shadow(0 0 ${glowIntensity * 2}px #FFA500)`,
                        transition: phase === 'morphing' ? 'none' : 'transform 0.05s linear',
                        opacity: fairyOpacity
                    }}
                >
                    {/* Worm fading out */}
                    {wormOpacity > 0 && (
                        <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ opacity: wormOpacity }}
                        >
                            🐛
                        </span>
                    )}
                    {/* Fairy fading in */}
                    {fairyFadeIn > 0 && (
                        <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ opacity: fairyFadeIn }}
                        >
                            🧚
                        </span>
                    )}
                </div>
            )}

            {/* Orbiting sparkles during morph and fly */}
            {phase !== 'trail-fading' && fairyOpacity > 0 && orbitingSparkles.map((sparkle, i) => {
                const orbitAngle = sparkle.angle + (age / 1000) * sparkle.speed * Math.PI * 2
                const pulseScale = 0.8 + Math.sin(age / 150 + i) * 0.4
                const sparkleX = fairyPos.x + Math.cos(orbitAngle) * sparkle.distance / 15 // Convert to %
                const sparkleY = fairyPos.y + Math.sin(orbitAngle) * sparkle.distance // pixels

                return (
                    <div
                        key={sparkle.id}
                        className="absolute sparkle-pulse"
                        style={{
                            left: `${sparkleX}%`,
                            top: `${sparkleY}px`, // y is in pixels
                            fontSize: `${sparkle.size * pulseScale}px`,
                            transform: 'translate(-50%, -50%)',
                            opacity: 0.8 + Math.sin(age / 100 + i * 0.5) * 0.2,
                            filter: `drop-shadow(0 0 4px ${sparkle.color})`
                        }}
                    >
                        ✨
                    </div>
                )
            })}

            {/* Trail sparkles */}
            {trailSparkles.map(sparkle => (
                <div
                    key={sparkle.id}
                    className="absolute"
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}px`, // y is in pixels
                        fontSize: `${sparkle.size}px`,
                        transform: 'translate(-50%, -50%)',
                        opacity: sparkle.opacity,
                        filter: `drop-shadow(0 0 ${sparkle.size / 2}px ${GOLD_COLORS[sparkle.id % GOLD_COLORS.length]})`,
                        transition: 'opacity 0.1s ease-out'
                    }}
                >
                    ✨
                </div>
            ))}
        </div>
    )
})

FairyTransformation.displayName = 'FairyTransformation'