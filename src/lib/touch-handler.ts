/**
 * Advanced Multi-Touch Handler for Educational Touch Devices
 * 
 * Handles multiple simultaneous touch inputs without interference,
 * crucial for QBoard displays where students may lean against the screen
 * or have multiple fingers touching simultaneously.
 * 
 * Features:
 * - Tracks individual touch points with unique identifiers
 * - Prevents accidental touches from interfering with intentional taps
 * - Debounces rapid duplicate touches on the same target
 * - Works with both touch and mouse events for broad compatibility
 * - Optimized for classroom tablet/touchscreen environments
 */

import { eventTracker } from './event-tracker'

interface TouchPoint {
    id: number
    x: number
    y: number
    startTime: number
    targetId?: string
    processed: boolean
}

interface TouchHandlerOptions {
    /**
     * Minimum time (ms) between duplicate taps on the same target
     * Prevents double-tap bugs from rapid touching
     */
    debounceMs?: number

    /**
     * Maximum time (ms) for a touch to be considered a tap (not a drag)
     */
    tapThresholdMs?: number

    /**
     * Maximum pixel movement allowed for a touch to be considered a tap
     */
    movementThresholdPx?: number

    /**
     * Enable detailed console logging for debugging
     */
    debug?: boolean
}

class MultiTouchHandler {
    private activeTouches = new Map<number, TouchPoint>()
    private recentTaps = new Map<string, number>() // targetId -> timestamp
    private options: Required<TouchHandlerOptions>
    private enabled = false
    private cleanupIntervalId: number | null = null

    constructor(options: TouchHandlerOptions = {}) {
        this.options = {
            debounceMs: options.debounceMs ?? 150,
            tapThresholdMs: options.tapThresholdMs ?? 300,
            movementThresholdPx: options.movementThresholdPx ?? 10,
            debug: options.debug ?? false
        }
    }

    /**
     * Initialize the touch handler - call when gameplay starts
     */
    enable() {
        if (this.enabled) return
        this.enabled = true
        this.activeTouches.clear()
        this.recentTaps.clear()
        this.startCleanupInterval()

        if (this.options.debug) {
            console.log('[MultiTouchHandler] Enabled with options:', this.options)
        }

        eventTracker.trackEvent({
            type: 'info',
            category: 'touch_handler',
            message: 'Touch handler enabled',
            data: {
                debounceMs: this.options.debounceMs,
                tapThresholdMs: this.options.tapThresholdMs
            }
        })
    }

    /**
     * Disable the touch handler - call when gameplay ends
     */
    disable() {
        if (!this.enabled) return
        this.enabled = false
        this.activeTouches.clear()
        this.recentTaps.clear()
        this.stopCleanupInterval()

        if (this.options.debug) {
            console.log('[MultiTouchHandler] Disabled')
        }

        eventTracker.trackEvent({
            type: 'info',
            category: 'touch_handler',
            message: 'Touch handler disabled'
        })
    }

    /**
     * Handle touch start event - registers new touch point
     */
    handleTouchStart(event: TouchEvent, targetId: string): boolean {
        if (!this.enabled) return false

        const touches = Array.from(event.changedTouches)
        let anyRegistered = false

        for (const touch of touches) {
            const touchPoint: TouchPoint = {
                id: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                startTime: Date.now(),
                targetId,
                processed: false
            }

            this.activeTouches.set(touch.identifier, touchPoint)
            anyRegistered = true

            if (this.options.debug) {
                console.log(`[MultiTouchHandler] Touch started: ID=${touch.identifier}, Target=${targetId}, Active=${this.activeTouches.size}`)
            }
        }

        eventTracker.trackEvent({
            type: 'user_action',
            category: 'touch_handler',
            message: 'Touch started',
            data: {
                touchCount: this.activeTouches.size,
                targetId
            }
        })

        return anyRegistered
    }

    /**
     * Handle touch end event - validates and processes tap
     * Returns true if this is a valid tap that should trigger game logic
     */
    handleTouchEnd(event: TouchEvent, targetId: string): boolean {
        if (!this.enabled) return false

        const touches = Array.from(event.changedTouches)
        let validTapDetected = false

        for (const touch of touches) {
            const touchPoint = this.activeTouches.get(touch.identifier)

            if (!touchPoint) {
                // Touch started outside our tracking or was already processed
                continue
            }

            // Check if touch has already been processed (prevent double-processing)
            if (touchPoint.processed) {
                this.activeTouches.delete(touch.identifier)
                continue
            }

            const now = Date.now()
            const duration = now - touchPoint.startTime
            const deltaX = Math.abs(touch.clientX - touchPoint.x)
            const deltaY = Math.abs(touch.clientY - touchPoint.y)
            const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            // Validate this is a tap (not a drag or long-press)
            const isTap = duration < this.options.tapThresholdMs &&
                movement < this.options.movementThresholdPx

            if (isTap) {
                // Check debounce - prevent rapid duplicate taps on same target
                const lastTapTime = this.recentTaps.get(targetId) || 0
                const timeSinceLastTap = now - lastTapTime

                if (timeSinceLastTap >= this.options.debounceMs) {
                    validTapDetected = true
                    touchPoint.processed = true
                    this.recentTaps.set(targetId, now)

                    if (this.options.debug) {
                        console.log(`[MultiTouchHandler] Valid tap: ID=${touch.identifier}, Target=${targetId}, Duration=${duration}ms, Movement=${movement.toFixed(1)}px`)
                    }

                    eventTracker.trackEvent({
                        type: 'user_action',
                        category: 'touch_handler',
                        message: 'Valid tap detected',
                        data: {
                            touchId: touch.identifier,
                            targetId,
                            duration,
                            movement: Math.round(movement)
                        }
                    })
                } else {
                    if (this.options.debug) {
                        console.log(`[MultiTouchHandler] Debounced tap: Target=${targetId}, TimeSince=${timeSinceLastTap}ms`)
                    }

                    eventTracker.trackEvent({
                        type: 'info',
                        category: 'touch_handler',
                        message: 'Tap debounced',
                        data: {
                            targetId,
                            timeSinceLastTap
                        }
                    })
                }
            } else {
                if (this.options.debug) {
                    console.log(`[MultiTouchHandler] Invalid tap (drag/long-press): ID=${touch.identifier}, Duration=${duration}ms, Movement=${movement.toFixed(1)}px`)
                }

                eventTracker.trackEvent({
                    type: 'info',
                    category: 'touch_handler',
                    message: 'Invalid tap (drag or long-press)',
                    data: {
                        touchId: touch.identifier,
                        duration,
                        movement: Math.round(movement),
                        reason: duration >= this.options.tapThresholdMs ? 'long_press' : 'drag'
                    }
                })
            }

            // Clean up this touch point
            this.activeTouches.delete(touch.identifier)
        }

        return validTapDetected
    }

    /**
     * Handle mouse click - for desktop compatibility
     * Returns true if click should be processed
     */
    handleMouseClick(targetId: string): boolean {
        if (!this.enabled) return false

        const now = Date.now()
        const lastTapTime = this.recentTaps.get(targetId) || 0
        const timeSinceLastTap = now - lastTapTime

        if (timeSinceLastTap >= this.options.debounceMs) {
            this.recentTaps.set(targetId, now)

            if (this.options.debug) {
                console.log(`[MultiTouchHandler] Valid mouse click: Target=${targetId}`)
            }

            eventTracker.trackEvent({
                type: 'user_action',
                category: 'touch_handler',
                message: 'Valid click detected',
                data: { targetId }
            })
            return true
        }

        if (this.options.debug) {
            console.log(`[MultiTouchHandler] Debounced mouse click: Target=${targetId}`)
        }

        eventTracker.trackEvent({
            type: 'info',
            category: 'touch_handler',
            message: 'Click debounced',
            data: {
                targetId,
                timeSinceLastTap
            }
        })
        return false
    }

    /**
     * Get current touch statistics (for debugging)
     */
    getStats() {
        return {
            activeTouches: this.activeTouches.size,
            recentTaps: this.recentTaps.size,
            enabled: this.enabled,
            options: this.options
        }
    }

    /**
     * Clean up old recent taps to prevent memory bloat
     * Call periodically or on game reset
     */
    cleanupOldTaps() {
        const now = Date.now()
        const cleanupThreshold = this.options.debounceMs * 10 // Keep 10x debounce window

        for (const [targetId, timestamp] of this.recentTaps.entries()) {
            if (now - timestamp > cleanupThreshold) {
                this.recentTaps.delete(targetId)
            }
        }

        if (this.options.debug && this.recentTaps.size > 0) {
            console.log(`[MultiTouchHandler] Cleanup: ${this.recentTaps.size} recent taps remaining`)
        }
    }

    /**
     * Start the cleanup interval for memory management
     * Called when handler is enabled
     */
    private startCleanupInterval() {
        if (this.cleanupIntervalId !== null) return
        this.cleanupIntervalId = window.setInterval(() => {
            this.cleanupOldTaps()
        }, 5000)
    }

    /**
     * Stop the cleanup interval to save resources
     * Called when handler is disabled
     */
    private stopCleanupInterval() {
        if (this.cleanupIntervalId !== null) {
            window.clearInterval(this.cleanupIntervalId)
            this.cleanupIntervalId = null
        }
    }
}

// Global singleton instance
export const multiTouchHandler = new MultiTouchHandler({
    debounceMs: 150,       // 150ms between duplicate taps
    tapThresholdMs: 300,   // 300ms max tap duration
    movementThresholdPx: 10, // 10px max movement for tap
    debug: import.meta.env.DEV // Enable debug logging in development
})

// Note: Cleanup interval is now managed inside enable()/disable() methods
// to avoid unnecessary background processing when touch handler is not in use
