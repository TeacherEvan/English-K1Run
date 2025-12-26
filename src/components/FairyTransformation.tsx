import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { FairyTransformObject } from '../hooks/use-game-logic'
import {
  FAIRY_ANIMATION_TIMING,
  FAIRY_VISUAL_CONSTANTS,
  FAIRY_GOLD_COLORS,
  getRandomIntenseColorPalette,
  easeOutCubic,
  quadraticBezier,
  generateFlyTarget,
  generateBezierControl,
  calculateMorphScale,
  calculateGlowIntensity,
  calculateWormOpacity,
  calculateFairyFadeIn,
} from '../lib/constants/fairy-animations'

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

// Generate initial sparkles outside render with random intense color palette
const createOrbitingSparkles = (): OrbitSparkle[] => {
    const colorPalette = getRandomIntenseColorPalette()
    return Array.from({ length: FAIRY_VISUAL_CONSTANTS.SPARKLE_COUNT }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / FAIRY_VISUAL_CONSTANTS.SPARKLE_COUNT,
        distance: 40 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5,
        size: 8 + Math.random() * 8,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)]
    }))
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
    const [colorPalette] = useState(() => getRandomIntenseColorPalette())
    const [flyTarget] = useState(() => generateFlyTarget(fairy.x, fairy.y))
    // Store bezier control point once to prevent jittery animation
    const [bezierControl] = useState(() => generateBezierControl(fairy.x, fairy.y, flyTarget.x, flyTarget.y))

    const [trailSparkles, setTrailSparkles] = useState<TrailSparkle[]>([])

    // Determine current phase
    const phase = useMemo(() => {
        if (age < FAIRY_ANIMATION_TIMING.MORPH_DURATION) return 'morphing'
        if (age < FAIRY_ANIMATION_TIMING.MORPH_DURATION + FAIRY_ANIMATION_TIMING.FLY_DURATION) return 'flying'
        return 'trail-fading'
    }, [age])

    // Calculate fairy position derived from age (no state needed)
    const fairyPos = useMemo(() => {
        if (phase !== 'flying') return { x: fairy.x, y: fairy.y }

        const flyStartTime = fairy.createdAt + FAIRY_ANIMATION_TIMING.MORPH_DURATION
        const flyAge = now - flyStartTime

        // Eased progress (ease-out cubic)
        const progress = Math.min(1, flyAge / FAIRY_ANIMATION_TIMING.FLY_DURATION)
        const easedProgress = easeOutCubic(progress)

        // Quadratic bezier using stable control point
        const newX = quadraticBezier(easedProgress, fairy.x, bezierControl.x, flyTarget.x)
        const newY = quadraticBezier(easedProgress, fairy.y, bezierControl.y, flyTarget.y)

        return { x: newX, y: newY }
    }, [phase, now, fairy.createdAt, fairy.x, fairy.y, flyTarget, bezierControl])

    // Animation loop - optimized to reduce state updates
    // Uses RAF timestamp for consistent timing
    useEffect(() => {
        let animationFrameId: number
        let lastUpdateTime = 0
        let startTime = 0 // RAF start time to compute age consistently

        const animate = (currentNow: number) => {
            // Initialize start time on first frame
            if (startTime === 0) {
                startTime = currentNow - (Date.now() - fairy.createdAt)
            }

            frameCountRef.current++

            // Throttle state updates to reduce re-renders
            const timeSinceLastUpdate = currentNow - lastUpdateTime
            if (timeSinceLastUpdate >= FAIRY_ANIMATION_TIMING.UPDATE_INTERVAL) {
                lastUpdateTime = currentNow
                setNow(Date.now())
            }

            // Handle trail sparkles - use RAF-based age calculation
            const currentAge = currentNow - startTime
            const currentPhase = currentAge < FAIRY_ANIMATION_TIMING.MORPH_DURATION ? 'morphing' :
                currentAge < FAIRY_ANIMATION_TIMING.MORPH_DURATION + FAIRY_ANIMATION_TIMING.FLY_DURATION ? 'flying' : 'trail-fading'

            // Sparkle fade logic - only update when we have sparkles or spawning new ones
            // Only spawn new sparkles every N frames (~10fps) to reduce overhead
            const shouldSpawnNew = currentPhase === 'flying' && 
                frameCountRef.current % FAIRY_VISUAL_CONSTANTS.TRAIL_SPAWN_FRAME_INTERVAL === 0
            
            if (currentPhase === 'flying' || currentPhase === 'trail-fading') {
                setTrailSparkles(prev => {
                    if (prev.length === 0 && !shouldSpawnNew) return prev
                    
                    // Fade existing sparkles
                    const faded = prev
                        .map(s => ({ ...s, opacity: s.opacity - 0.015, y: s.y + 0.5 }))
                        .filter(s => s.opacity > 0)
                    
                    // Add new sparkle if in flying phase and on spawn frame
                    if (shouldSpawnNew) {
                        const flyStartTime = FAIRY_ANIMATION_TIMING.MORPH_DURATION
                        const flyAge = currentAge - flyStartTime
                        const progress = Math.min(1, flyAge / FAIRY_ANIMATION_TIMING.FLY_DURATION)
                        const easedProgress = easeOutCubic(progress)

                        const currentX = quadraticBezier(easedProgress, fairy.x, bezierControl.x, flyTarget.x)
                        const currentY = quadraticBezier(easedProgress, fairy.y, bezierControl.y, flyTarget.y)

                        const newSparkle: TrailSparkle = {
                            id: sparkleIdRef.current++,
                            x: currentX + (Math.random() - 0.5) * 15,
                            y: currentY + (Math.random() - 0.5) * 30,
                            size: 8 + Math.random() * 12,
                            opacity: 1
                        }
                        return [...faded.slice(-FAIRY_VISUAL_CONSTANTS.MAX_TRAIL_SPARKLES), newSparkle]
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
    const morphProgress = phase === 'morphing' ? Math.min(1, age / FAIRY_ANIMATION_TIMING.MORPH_DURATION) : 1

    // Calculate visibility
    const isVisible = age < FAIRY_ANIMATION_TIMING.TOTAL_DURATION
    const fairyOpacity = phase === 'trail-fading' ? 0 :
        phase === 'flying' ? Math.max(0, 1 - (age - FAIRY_ANIMATION_TIMING.MORPH_DURATION - FAIRY_ANIMATION_TIMING.FLY_DURATION * 0.7) / (FAIRY_ANIMATION_TIMING.FLY_DURATION * 0.3)) : 1

    // Don't render if animation is complete
    if (!isVisible && trailSparkles.length === 0) return null

    // Use imported helper functions for opacity and scale calculations
    const wormOpacity = calculateWormOpacity(morphProgress)
    const fairyFadeIn = calculateFairyFadeIn(morphProgress)
    const morphScale = calculateMorphScale(morphProgress)
    const glowIntensity = calculateGlowIntensity(age)

    return (
        <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 20 }}>
            {/* Morphing/Flying Fairy */}
            {fairyOpacity > 0 && (
                <div
                    className="absolute fairy-transform"
                    style={{
                        left: `${fairyPos.x}%`,
                        top: `${fairyPos.y}px`, // y is in pixels
                        width: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        height: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        fontSize: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        transform: `translate(-50%, -50%) scale(${morphScale}) rotate(${morphProgress * 360}deg)`,
                        filter: `drop-shadow(0 0 ${glowIntensity}px ${colorPalette[0]}) drop-shadow(0 0 ${glowIntensity * 2}px ${colorPalette[1]})`,
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
                        filter: `drop-shadow(0 0 ${sparkle.size / 2}px ${colorPalette[sparkle.id % colorPalette.length]})`,
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