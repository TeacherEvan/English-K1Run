/**
 * Event tracking system for monitoring game errors and performance
 */

export interface GameEvent {
  id: string
  timestamp: number
  type: 'error' | 'warning' | 'info' | 'performance' | 'user_action' | 'lifecycle' | 'test'
  category: string
  message: string
  data?: Record<string, unknown>
  stackTrace?: string
  userAgent?: string
  url?: string
}

export interface EmojiLifecycleEvent {
  objectId: string
  emoji: string
  name: string
  phase: 'spawned' | 'rendered' | 'visible' | 'tapped' | 'removed' | 'missed'
  timestamp: number
  position?: { x: number; y: number }
  playerSide?: 'left' | 'right'
  duration?: number // Time since spawn
  data?: Record<string, unknown>
}

export interface PerformanceMetrics {
  objectSpawnRate: number
  frameRate: number
  memoryUsage?: number
  touchLatency: number
}

export interface AudioPlaybackEvent {
  id: string
  timestamp: number
  audioKey: string
  targetName: string
  method: 'wav' | 'html-audio' | 'speech-synthesis' | 'fallback-tone'
  success: boolean
  duration?: number
  error?: string
}

export interface EmojiAppearanceStats {
  emoji: string
  name: string
  lastAppearance: number
  appearanceCount: number
  timeSinceLastAppearance: number
  audioPlayed: boolean
  audioKey?: string
}

class EventTracker {
  private events: GameEvent[] = []
  private maxEvents = 500 // Reduced from 1000 to 500 for better performance
  private performanceMetrics: PerformanceMetrics = {
    objectSpawnRate: 0,
    frameRate: 0,
    touchLatency: 0
  }
  private spawnCount = 0
  private lastSpawnReset = Date.now()

  // Emoji lifecycle tracking
  private emojiLifecycles: Map<string, EmojiLifecycleEvent[]> = new Map()
  private maxTrackedEmojis = 10 // Track first 10 emojis
  private trackedEmojiCount = 0
  private isLifecycleTrackingEnabled = false

  // Audio playback tracking
  private audioPlaybackEvents: AudioPlaybackEvent[] = []
  private maxAudioEvents = 100

  // Emoji appearance tracking for rotation monitoring
  private emojiAppearances: Map<string, EmojiAppearanceStats> = new Map()
  private rotationThreshold = 10000 // 10 seconds as requested

  constructor() {
    // Set up global error handlers
    this.setupErrorHandlers()
    this.startPerformanceMonitoring()
  }

  private setupErrorHandlers() {
    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent({
        type: 'error',
        category: 'javascript',
        message: event.message,
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        stackTrace: event.error?.stack
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent({
        type: 'error',
        category: 'promise',
        message: 'Unhandled promise rejection',
        data: {
          reason: event.reason
        },
        stackTrace: event.reason?.stack
      })
    })
  }

  private startPerformanceMonitoring() {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFrameRate = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.frameRate = frameCount
        frameCount = 0
        lastTime = currentTime

        // Track low frame rate as warning
        if (this.performanceMetrics.frameRate < 30) {
          this.trackEvent({
            type: 'warning',
            category: 'performance',
            message: 'Low frame rate detected',
            data: { frameRate: this.performanceMetrics.frameRate }
          })
        }
      }

      requestAnimationFrame(measureFrameRate)
    }

    requestAnimationFrame(measureFrameRate)
  }

  trackEvent(eventData: Partial<GameEvent>) {
    const event: GameEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: eventData.type || 'info',
      category: eventData.category || 'general',
      message: eventData.message || '',
      data: eventData.data,
      stackTrace: eventData.stackTrace,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...eventData
    }

    this.events.push(event)

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Only log to console in development mode to reduce overhead
    if (import.meta.env.DEV) {
      console.log(`[${event.type.toUpperCase()}] ${event.category}: ${event.message}`, event.data)
    }
  }

  /**
   * Track a test-specific event for E2E testing verification
   */
  trackTestEvent(name: string, data?: Record<string, unknown>) {
    this.trackEvent({
      type: 'test',
      category: 'e2e',
      message: name,
      data
    })
  }

  // Game-specific tracking methods with optimized performance
  trackObjectSpawn(objectType: string, position?: { x?: number; y?: number; count?: number }) {
    // Batch track spawns to reduce overhead
    if (position?.count) {
      // For batch spawns, just track the batch size
      this.trackEvent({
        type: 'info',
        category: 'game_object',
        message: 'Objects batch spawned',
        data: { batchSize: position.count, objectType }
      })
    } else {
      // Individual spawn tracking (less frequent)
      this.trackEvent({
        type: 'info',
        category: 'game_object',
        message: 'Object spawned',
        data: { objectType, position }
      })
    }

    this.spawnCount++

    // Calculate spawn rate per second and reset counter periodically
    const now = Date.now()
    if (now - this.lastSpawnReset >= 2000) { // Check every 2 seconds instead of 1
      this.performanceMetrics.objectSpawnRate = this.spawnCount / 2
      this.spawnCount = 0
      this.lastSpawnReset = now

      // Track high spawn rate as potential performance issue
      if (this.performanceMetrics.objectSpawnRate > 8) {
        this.trackEvent({
          type: 'warning',
          category: 'performance',
          message: 'High object spawn rate detected',
          data: { spawnRate: this.performanceMetrics.objectSpawnRate }
        })
      }
    }
  }

  trackObjectTap(objectId: string, correct: boolean, playerSide: 'left' | 'right', latency: number) {
    this.trackEvent({
      type: 'user_action',
      category: 'game_interaction',
      message: correct ? 'Correct tap' : 'Incorrect tap',
      data: { objectId, correct, playerSide, latency }
    })

    this.performanceMetrics.touchLatency = latency
  }

  trackGameStateChange(oldState: Record<string, unknown>, newState: Record<string, unknown>, action: string) {
    this.trackEvent({
      type: 'info',
      category: 'game_state',
      message: `Game state changed: ${action}`,
      data: { oldState, newState, action }
    })
  }

  trackError(error: Error, context: string) {
    this.trackEvent({
      type: 'error',
      category: 'game_logic',
      message: error.message,
      data: { context },
      stackTrace: error.stack
    })
  }

  trackWarning(message: string, data?: Record<string, unknown>) {
    this.trackEvent({
      type: 'warning',
      category: 'game_logic',
      message,
      data
    })
  }

  // Get events for debugging
  getEvents(type?: GameEvent['type'], category?: string, limit?: number): GameEvent[] {
    let filtered = this.events

    if (type) {
      filtered = filtered.filter(event => event.type === type)
    }

    if (category) {
      filtered = filtered.filter(event => event.category === category)
    }

    if (limit) {
      filtered = filtered.slice(-limit)
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get recent events (for diagnostics)
  getRecentEvents(limit: number = 10): GameEvent[] {
    return this.events.slice(-limit).sort((a, b) => b.timestamp - a.timestamp)
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  // Reset performance metrics
  resetPerformanceMetrics() {
    this.spawnCount = 0
    this.lastSpawnReset = Date.now()
    this.performanceMetrics.objectSpawnRate = 0
    this.performanceMetrics.touchLatency = 0
  }

  // Export events for debugging
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2)
  }

  // Clear events
  clearEvents() {
    this.events = []
  }

  // Emoji lifecycle tracking methods
  enableLifecycleTracking(enable: boolean = true) {
    this.isLifecycleTrackingEnabled = enable
    if (enable) {
      this.trackedEmojiCount = 0
      this.emojiLifecycles.clear()
      if (import.meta.env.DEV) {
        console.log('[EmojiTracker] Lifecycle tracking enabled - will track first', this.maxTrackedEmojis, 'emojis')
      }
    }
  }

  trackEmojiLifecycle(event: Omit<EmojiLifecycleEvent, 'timestamp' | 'duration'>) {
    if (!this.isLifecycleTrackingEnabled) return

    const { objectId, emoji, name, phase, position, playerSide, data } = event

    // Get or create lifecycle array for this object
    if (!this.emojiLifecycles.has(objectId)) {
      // Stop tracking if we've reached max
      if (this.trackedEmojiCount >= this.maxTrackedEmojis) {
        return
      }
      this.emojiLifecycles.set(objectId, [])
      this.trackedEmojiCount++
    }

    const lifecycleEvents = this.emojiLifecycles.get(objectId)!
    const firstEvent = lifecycleEvents[0]
    const duration = firstEvent ? Date.now() - firstEvent.timestamp : 0

    const lifecycleEvent: EmojiLifecycleEvent = {
      objectId,
      emoji,
      name,
      phase,
      timestamp: Date.now(),
      duration,
      position,
      playerSide,
      data
    }

    lifecycleEvents.push(lifecycleEvent)

    // Also log to general event tracker
    this.trackEvent({
      type: 'lifecycle',
      category: 'emoji_lifecycle',
      message: `Emoji ${phase}: ${emoji} ${name}`,
      data: lifecycleEvent as unknown as Record<string, unknown>
    })

    // Only log to console in development mode
    if (import.meta.env.DEV) {
      console.log(
        `[EmojiTracker #${this.emojiLifecycles.size}/${this.maxTrackedEmojis}] ${phase.toUpperCase()}: ${emoji} ${name}`,
        `(${duration}ms)`,
        position ? `at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})` : '',
        playerSide ? `[${playerSide}]` : '',
        data || ''
      )
    }
  }

  getEmojiLifecycle(objectId: string): EmojiLifecycleEvent[] | undefined {
    return this.emojiLifecycles.get(objectId)
  }

  getAllEmojiLifecycles(): Map<string, EmojiLifecycleEvent[]> {
    return new Map(this.emojiLifecycles)
  }

  getLifecycleStats() {
    const stats = {
      totalTracked: this.emojiLifecycles.size,
      maxTracked: this.maxTrackedEmojis,
      isEnabled: this.isLifecycleTrackingEnabled,
      emojis: [] as Array<{
        objectId: string
        emoji: string
        name: string
        spawnTime: number
        phases: string[]
        totalDuration: number
        wasCompleted: boolean
      }>
    }

    this.emojiLifecycles.forEach((events, objectId) => {
      if (events.length === 0) return

      const firstEvent = events[0]
      const lastEvent = events[events.length - 1]
      const phases = events.map(e => e.phase)

      stats.emojis.push({
        objectId,
        emoji: firstEvent.emoji,
        name: firstEvent.name,
        spawnTime: firstEvent.timestamp,
        phases,
        totalDuration: lastEvent.timestamp - firstEvent.timestamp,
        wasCompleted: phases.includes('tapped') || phases.includes('removed')
      })
    })

    return stats
  }

  clearLifecycleTracking() {
    this.emojiLifecycles.clear()
    this.trackedEmojiCount = 0
    if (import.meta.env.DEV) {
      console.log('[EmojiTracker] Lifecycle tracking cleared')
    }
  }

  // Audio playback tracking methods
  trackAudioPlayback(event: Omit<AudioPlaybackEvent, 'id' | 'timestamp'>) {
    const audioEvent: AudioPlaybackEvent = {
      id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event
    }

    this.audioPlaybackEvents.push(audioEvent)

    // Keep only recent events
    if (this.audioPlaybackEvents.length > this.maxAudioEvents) {
      this.audioPlaybackEvents = this.audioPlaybackEvents.slice(-this.maxAudioEvents)
    }

    // Also track in general event system
    this.trackEvent({
      type: event.success ? 'info' : 'warning',
      category: 'audio_playback',
      message: `Audio ${event.success ? 'played' : 'failed'}: ${event.audioKey}`,
      data: audioEvent as unknown as Record<string, unknown>
    })

    if (import.meta.env.DEV) {
      console.log(
        `[AudioTracker] ${event.success ? '✓' : '✗'} ${event.method}:`,
        event.audioKey,
        event.error || ''
      )
    }
  }

  getAudioPlaybackHistory(limit = 20): AudioPlaybackEvent[] {
    return this.audioPlaybackEvents.slice(-limit).reverse()
  }

  getAudioPlaybackStats() {
    const stats = {
      totalAttempts: this.audioPlaybackEvents.length,
      successful: this.audioPlaybackEvents.filter(e => e.success).length,
      failed: this.audioPlaybackEvents.filter(e => !e.success).length,
      byMethod: {} as Record<string, { success: number; failed: number }>
    }

    this.audioPlaybackEvents.forEach(event => {
      if (!stats.byMethod[event.method]) {
        stats.byMethod[event.method] = { success: 0, failed: 0 }
      }
      if (event.success) {
        stats.byMethod[event.method].success++
      } else {
        stats.byMethod[event.method].failed++
      }
    })

    return stats
  }

  // Emoji appearance tracking for rotation monitoring
  initializeEmojiTracking(levelItems: Array<{ emoji: string; name: string }>) {
    this.emojiAppearances.clear()

    // Initialize tracking for all emojis in the level
    levelItems.forEach(item => {
      this.emojiAppearances.set(item.emoji, {
        emoji: item.emoji,
        name: item.name,
        lastAppearance: 0,
        appearanceCount: 0,
        timeSinceLastAppearance: 0,
        audioPlayed: false
      })
    })

    if (import.meta.env.DEV) {
      console.log(`[EmojiRotation] Initialized tracking for ${levelItems.length} emojis`)
    }
  }

  trackEmojiAppearance(emoji: string, audioKey?: string) {
    const stats = this.emojiAppearances.get(emoji)
    if (!stats) {
      // Emoji not in current level - shouldn't happen but handle gracefully
      console.warn(`[EmojiRotation] Tracking appearance of unknown emoji: ${emoji}`)
      return
    }

    const now = Date.now()
    stats.lastAppearance = now
    stats.appearanceCount++
    stats.audioPlayed = !!audioKey
    stats.audioKey = audioKey
    stats.timeSinceLastAppearance = 0

    // Update time since last appearance for all other emojis
    this.emojiAppearances.forEach((stat, key) => {
      if (key !== emoji && stat.lastAppearance > 0) {
        stat.timeSinceLastAppearance = now - stat.lastAppearance
      }
    })

    if (import.meta.env.DEV) {
      console.log(`[EmojiRotation] ${emoji} appeared (count: ${stats.appearanceCount}, audio: ${audioKey || 'none'})`)
    }
  }

  getEmojiRotationStats(): EmojiAppearanceStats[] {
    const now = Date.now()
    const stats: EmojiAppearanceStats[] = []

    this.emojiAppearances.forEach(stat => {
      const timeSince = stat.lastAppearance > 0
        ? now - stat.lastAppearance
        : now // Never appeared = time since level start

      stats.push({
        ...stat,
        timeSinceLastAppearance: timeSince
      })
    })

    // Sort by time since last appearance (longest wait first)
    return stats.sort((a, b) => b.timeSinceLastAppearance - a.timeSinceLastAppearance)
  }

  getOverdueEmojis(): EmojiAppearanceStats[] {
    const stats = this.getEmojiRotationStats()
    return stats.filter(stat => stat.timeSinceLastAppearance > this.rotationThreshold)
  }

  checkRotationHealth(): { healthy: boolean; overdueCount: number; maxWaitTime: number } {
    const overdue = this.getOverdueEmojis()
    const allStats = this.getEmojiRotationStats()
    const maxWaitTime = allStats.length > 0 ? allStats[0].timeSinceLastAppearance : 0

    const healthy = overdue.length === 0

    if (!healthy && import.meta.env.DEV) {
      console.warn(
        `[EmojiRotation] ⚠️ ${overdue.length} emojis overdue (>${this.rotationThreshold}ms):`,
        overdue.map(e => `${e.emoji} ${e.name} (${(e.timeSinceLastAppearance / 1000).toFixed(1)}s)`)
      )
    }

    return { healthy, overdueCount: overdue.length, maxWaitTime }
  }

  clearAudioTracking() {
    this.audioPlaybackEvents = []
  }

  clearEmojiRotationTracking() {
    this.emojiAppearances.clear()
  }
}

// Create singleton instance
export const eventTracker = new EventTracker()

// Expose to global for debugging
if (typeof window !== 'undefined') {
  (window as Window & { gameEventTracker?: EventTracker }).gameEventTracker = eventTracker
}