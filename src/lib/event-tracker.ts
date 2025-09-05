/**
 * Event tracking system for monitoring game errors and performance
 */

export interface GameEvent {
  id: string
  timestamp: number
  type: 'error' | 'warning' | 'info' | 'performance' | 'user_action'
  category: string
  message: string
  data?: any
  stackTrace?: string
  userAgent?: string
  url?: string
}

export interface PerformanceMetrics {
  objectSpawnRate: number
  frameRate: number
  memoryUsage?: number
  touchLatency: number
}

class EventTracker {
  private events: GameEvent[] = []
  private maxEvents = 1000
  private performanceMetrics: PerformanceMetrics = {
    objectSpawnRate: 0,
    frameRate: 0,
    touchLatency: 0
  }
  private spawnCount = 0
  private lastSpawnReset = Date.now()

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

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${event.type.toUpperCase()}] ${event.category}: ${event.message}`, event.data)
    }
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

  trackGameStateChange(oldState: any, newState: any, action: string) {
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

  trackWarning(message: string, data?: any) {
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
}

// Create singleton instance
export const eventTracker = new EventTracker()

// Expose to global for debugging
if (typeof window !== 'undefined') {
  (window as any).gameEventTracker = eventTracker
}