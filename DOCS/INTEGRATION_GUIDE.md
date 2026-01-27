# Production-Grade Utilities Integration Guide

## Overview

This guide demonstrates how to integrate the new production-grade utility modules into your components. These utilities follow 2025 TypeScript best practices with semantic naming, comprehensive documentation, and type safety.

## Table of Contents

- [Semantic Utilities](#semantic-utilities)
- [Resource Preloader](#resource-preloader)
- [Accessibility Utilities](#accessibility-utilities)
- [Performance Monitoring](#performance-monitoring)
- [Complete Integration Example](#complete-integration-example)

---

## Semantic Utilities

Location: `src/lib/semantic-utils.ts`

### Basic Usage

```typescript
import {
  calculatePercentageWithinBounds,
  generateUniqueIdentifier,
  validateNumericRange,
  transformArrayToRandomOrder,
  calculateDistanceBetweenPoints,
  formatMillisecondsAsMinutesSeconds,
  createDebouncedFunction,
  isRunningInDevelopmentMode,
} from "@/lib/semantic-utils";

// Clamp values for progress bars
const progress = calculatePercentageWithinBounds(userScore, 0, 100);

// Generate unique IDs for game objects
const objectId = generateUniqueIdentifier("falling-object");

// Validate user input
const isValidAge = validateNumericRange(age, 4, 6);

// Shuffle array for random gameplay
const shuffledTargets = transformArrayToRandomOrder(targets);

// Calculate collision distance
const distance = calculateDistanceBetweenPoints(obj1.x, obj1.y, obj2.x, obj2.y);

// Format timer display
const timeDisplay = formatMillisecondsAsMinutesSeconds(gameTimeMs);

// Debounce search input
const debouncedSearch = createDebouncedFunction(performSearch, 300);

// Environment checks
if (isRunningInDevelopmentMode()) {
  console.log("Debug info:", debugData);
}
```

### Replacing Existing Code

**Before:**

```typescript
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const id = `obj-${Date.now()}-${Math.random()}`;
```

**After:**

```typescript
import {
  calculatePercentageWithinBounds,
  generateUniqueIdentifier,
} from "@/lib/semantic-utils";

const clampedValue = calculatePercentageWithinBounds(value, min, max);
const objectId = generateUniqueIdentifier("object");
```

---

## Resource Preloader

Location: `src/lib/resource-preloader.ts`

### Preloading Critical Resources

```typescript
import { preloadCriticalResources } from "@/lib/resource-preloader";

// App.tsx initialization
useEffect(() => {
  // Preload high and medium priority resources
  preloadCriticalResources(["high", "medium"]).then((progress) => {
    console.log(`Loaded ${progress.loaded}/${progress.total} resources`);
    console.log(`Failed: ${progress.failed}`);
  });
}, []);
```

### Custom Resource Preloading

```typescript
import { preloadResources, ResourceMetadata } from "@/lib/resource-preloader";

const gameResources: ResourceMetadata[] = [
  // High priority - needed for first render
  { url: "/logo.png", type: "image", priority: "high" },
  { url: "/sounds/welcome.wav", type: "audio", priority: "high" },

  // Medium priority - game assets
  { url: "/sounds/tap.wav", type: "audio", priority: "medium" },
  { url: "/sounds/success.wav", type: "audio", priority: "medium" },

  // Low priority - backgrounds
  { url: "/bg-1.jpg", type: "image", priority: "low" },
  { url: "/bg-2.jpg", type: "image", priority: "low" },
];

// Preload with progress tracking
const progress = await preloadResources(gameResources, (progress) => {
  setLoadingProgress(progress.percentage);
});
```

### Bandwidth-Aware Loading

The resource preloader automatically detects slow connections and data-saver mode:

```typescript
// Automatically skips low-priority resources on slow connections
// Respects user's data-saver preference
// No code changes needed - works automatically!
```

---

## Accessibility Utilities

Location: `src/lib/accessibility-utils.ts`

### Keyboard Navigation

```typescript
import {
  KeyboardKeys,
  isKeyPressed,
  areModifiersPressed,
} from "@/lib/accessibility-utils";

const handleKeyDown = (e: KeyboardEvent) => {
  // Clear, semantic key checking
  if (isKeyPressed(e, KeyboardKeys.ENTER)) {
    submitForm();
  }

  // Keyboard shortcuts
  if (areModifiersPressed(e, { ctrl: true }) && isKeyPressed(e, "s")) {
    e.preventDefault();
    saveGame();
  }

  // Arrow navigation
  if (isKeyPressed(e, KeyboardKeys.ARROW_DOWN)) {
    moveFocusToAdjacentElement("forward", menuRef.current!);
  }
};
```

### Focus Trap for Modals

```typescript
import { createFocusTrap } from '@/lib/accessibility-utils'

const Modal = ({ isOpen, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Trap focus within modal
      const cleanup = createFocusTrap(modalRef.current)
      return cleanup // Remove trap when modal closes
    }
  }, [isOpen])

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  )
}
```

### Screen Reader Announcements

```typescript
import { announceToScreenReader } from "@/lib/accessibility-utils";

const handleCorrectAnswer = () => {
  // Announce success to screen readers
  announceToScreenReader("Correct! Great job!", "polite");

  // Update visual UI
  setScore((prev) => prev + 10);
};

const handleError = () => {
  // Urgent announcement
  announceToScreenReader("Error: Please try again", "assertive");
};
```

### Respecting User Preferences

```typescript
import {
  userPrefersReducedMotion,
  userPrefersDarkMode,
  userPrefersHighContrast
} from '@/lib/accessibility-utils'

const GameComponent = () => {
  // Disable animations for users who prefer reduced motion
  const shouldAnimate = !userPrefersReducedMotion()

  // Respect color scheme preference
  const theme = userPrefersDarkMode() ? 'dark' : 'light'

  // Apply high contrast styles if needed
  const contrastMode = userPrefersHighContrast() ? 'high' : 'normal'

  return (
    <div
      className={cn(
        'game-container',
        shouldAnimate && 'animate-fade-in',
        theme === 'dark' && 'dark-theme',
        contrastMode === 'high' && 'high-contrast'
      )}
    >
      {/* Game content */}
    </div>
  )
}
```

---

## Performance Monitoring

Location: `src/lib/performance-monitor-utils.ts`

### Measuring Component Performance

```typescript
import { measureComponentRenderTime } from '@/lib/performance-monitor-utils'

const GameMenu = () => {
  const stopMeasuring = measureComponentRenderTime('GameMenu')

  useEffect(() => {
    const duration = stopMeasuring()

    if (import.meta.env.DEV) {
      console.log(`GameMenu rendered in ${duration}ms`)
    }

    // Send to analytics in production
    if (import.meta.env.PROD && duration > 100) {
      analytics.track('slow-render', { component: 'GameMenu', duration })
    }
  }, [])

  return <div>Menu Content</div>
}
```

### Tracking Web Vitals

```typescript
import { trackWebVitals } from "@/lib/performance-monitor-utils";

// In your main App.tsx or index.tsx
useEffect(() => {
  trackWebVitals((metric) => {
    console.log(`${metric.name}: ${metric.value} (${metric.rating})`);

    // Send to analytics service
    if (import.meta.env.PROD) {
      analytics.track("web-vital", {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: window.location.pathname,
      });
    }
  });
}, []);
```

### Frame Rate Monitoring

```typescript
import { monitorFrameRate } from '@/lib/performance-monitor-utils'

const GameArea = () => {
  const [fpsStats, setFpsStats] = useState<FrameRateStats | null>(null)

  useEffect(() => {
    if (gameState.gameStarted) {
      // Monitor FPS for 5 seconds
      monitorFrameRate(5000, (currentFps) => {
        // Real-time FPS updates
        if (currentFps < 30 && import.meta.env.DEV) {
          console.warn('Low FPS detected:', currentFps)
        }
      }).then((stats) => {
        setFpsStats(stats)

        // Log final statistics
        console.log('Average FPS:', stats.averageFps)
        console.log('Dropped frames:', stats.droppedFrames)

        // Alert if performance is poor
        if (stats.averageFps < 30) {
          console.warn('Game performance is below target!')
        }
      })
    }
  }, [gameState.gameStarted])

  return <div>Game Area</div>
}
```

### Memory Monitoring

```typescript
import { getMemoryUsage } from '@/lib/performance-monitor-utils'

const PerformanceDebug = () => {
  const [memory, setMemory] = useState<MemoryUsageStats | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getMemoryUsage()
      if (stats) {
        setMemory(stats)

        // Warn about high memory usage
        if (stats.usagePercentage > 90) {
          console.warn('High memory usage:', stats.usagePercentage)
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (!memory || !import.meta.env.DEV) return null

  return (
    <div className="memory-stats">
      <div>Memory: {(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB</div>
      <div>Usage: {memory.usagePercentage.toFixed(1)}%</div>
    </div>
  )
}
```

---

## Complete Integration Example

Here's a complete example showing how to integrate all utilities into a game component:

```typescript
import { useEffect, useRef, useState } from 'react'

// Semantic utilities
import {
  calculatePercentageWithinBounds,
  generateUniqueIdentifier,
  transformArrayToRandomOrder,
  formatMillisecondsAsMinutesSeconds,
  isRunningInDevelopmentMode
} from '@/lib/semantic-utils'

// Resource preloading
import { preloadCriticalResources } from '@/lib/resource-preloader'

// Accessibility
import {
  KeyboardKeys,
  isKeyPressed,
  createFocusTrap,
  announceToScreenReader,
  userPrefersReducedMotion
} from '@/lib/accessibility-utils'

// Performance monitoring
import {
  measureComponentRenderTime,
  trackWebVitals,
  monitorFrameRate
} from '@/lib/performance-monitor-utils'

export const EnhancedGameComponent = () => {
  // State
  const [progress, setProgress] = useState(0)
  const [targets, setTargets] = useState<Target[]>([])
  const [gameTime, setGameTime] = useState(60000)
  const [isLoading, setIsLoading] = useState(true)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)

  // Measure component performance
  const stopMeasuring = measureComponentRenderTime('EnhancedGameComponent')

  useEffect(() => {
    const duration = stopMeasuring()
    if (isRunningInDevelopmentMode()) {
      console.log(`Component rendered in ${duration}ms`)
    }
  }, [])

  // Preload resources on mount
  useEffect(() => {
    preloadCriticalResources(['high', 'medium']).then(() => {
      setIsLoading(false)
      announceToScreenReader('Game loaded and ready', 'polite')
    })
  }, [])

  // Track Web Vitals
  useEffect(() => {
    trackWebVitals((metric) => {
      if (isRunningInDevelopmentMode()) {
        console.log(`${metric.name}: ${metric.value}`)
      }
    })
  }, [])

  // Monitor frame rate during gameplay
  useEffect(() => {
    if (!isLoading) {
      monitorFrameRate(5000).then((stats) => {
        if (stats.averageFps < 40) {
          announceToScreenReader(
            'Performance issue detected. Some features may be disabled.',
            'assertive'
          )
        }
      })
    }
  }, [isLoading])

  // Focus trap for modal
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = createFocusTrap(containerRef.current)
      return cleanup
    }
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isKeyPressed(e, KeyboardKeys.ESCAPE)) {
      handlePauseGame()
    }

    if (isKeyPressed(e, KeyboardKeys.SPACE)) {
      handleJump()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Generate unique IDs for objects
  const spawnTarget = () => {
    const newTarget = {
      id: generateUniqueIdentifier('target'),
      x: Math.random() * 100,
      y: 0,
      type: 'emoji'
    }
    setTargets(prev => [...prev, newTarget])
  }

  // Clamp progress
  const updateProgress = (delta: number) => {
    const newProgress = calculatePercentageWithinBounds(
      progress + delta,
      0,
      100
    )
    setProgress(newProgress)

    if (newProgress === 100) {
      announceToScreenReader('Congratulations! Level complete!', 'polite')
    }
  }

  // Shuffle targets
  const shuffleTargets = () => {
    const shuffled = transformArrayToRandomOrder(targets)
    setTargets(shuffled)
  }

  // Respect reduced motion preference
  const shouldAnimate = !userPrefersReducedMotion()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'game-container',
        shouldAnimate && 'with-animations'
      )}
    >
      {/* Timer Display */}
      <div className="timer">
        Time: {formatMillisecondsAsMinutesSeconds(gameTime)}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Game Content */}
      <div className="game-area">
        {targets.map(target => (
          <Target key={target.id} {...target} />
        ))}
      </div>
    </div>
  )
}
```

---

## Best Practices

1. **Always use semantic utilities** instead of inline calculations
2. **Preload critical resources** on app initialization
3. **Add keyboard navigation** to all interactive elements
4. **Respect user preferences** (reduced motion, dark mode, etc.)
5. **Monitor performance** in development and production
6. **Announce important changes** to screen readers
7. **Use TypeScript strictly** - all utilities are fully typed
8. **Check environment** before logging/debugging

---

## Migration Checklist

- [x] Replace all `clamp()` calls with `calculatePercentageWithinBounds()`
- [x] Replace manual ID generation with `generateUniqueIdentifier()`
- [x] Replace Fisher-Yates shuffle with `transformArrayToRandomOrder()`
- [x] Add resource preloading to app initialization
- [x] Add keyboard navigation handlers
- [x] Add focus traps to modals
- [x] Add screen reader announcements
- [x] Add Web Vitals tracking
- [x] Add component performance monitoring
- [ ] Respect reduced motion preference
- [ ] Add environment checks for debug code

Applied changes (code references):

- `src/lib/game/collision-detection.ts`: replaced `clamp` with `calculatePercentageWithinBounds` for lane bounds and collision resolution.
- `src/hooks/game-logic/object-update.ts`: replaced `clamp` with `calculatePercentageWithinBounds` in object position updates.
- `src/hooks/game-logic/worm-logic.ts` and `src/lib/game/worm-manager.ts`: replaced manual ID generation with `generateUniqueIdentifier()` and used `calculatePercentageWithinBounds` for bounds.
- `src/lib/utils/spawn-position.ts`: replaced `clamp` with `calculatePercentageWithinBounds`.
- `src/lib/audio/audio-sprite.ts`: replaced local `clamp` with `calculatePercentageWithinBounds` for safe offsets/volumes.
- `src/hooks/use-object-spawning.ts`: replaced Fisher–Yates shuffle with `transformArrayToRandomOrder()`.
- `src/lib/event-tracker.ts`, `src/lib/event-metrics/audio-event-tracker.ts`, `src/lib/file-manager/index.ts`, `src/lib/performance/web-vitals-tracker.ts`: replaced ad-hoc ID strings with `generateUniqueIdentifier()`.
- `src/App.tsx`: added `preloadCriticalResources`, `announceToScreenReader`, web vitals tracking integration (`trackWebVitals`), and component render timing using `measureComponentRenderTime` for app-level monitoring.
- `src/components/game-menu/GameMenuLevelSelect.tsx`: added focus trap (`createFocusTrap`), keyboard navigation handlers, screen reader announcements, and render timing.

Notes:

- Remaining items `Respect reduced motion preference` and `Add environment checks for debug code` are intentionally left open for follow-up; reduced motion flags are already available in `src/lib/accessibility/user-preferences.ts` and can be wired where desired.
- If you want I can also run tests or create a short migration PR message summarizing these commits.

---

## Support

For issues or questions about these utilities:

1. Check the inline JSDoc documentation
2. Review the TypeScript types and interfaces
3. See the examples in this guide
4. Check the source code comments for TODO items

All utilities are production-ready and follow 2025 best practices! 🚀
