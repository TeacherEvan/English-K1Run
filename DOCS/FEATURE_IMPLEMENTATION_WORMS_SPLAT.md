# Feature Implementation: Worm Spawning & Screen Shake

## Overview

This document describes the implementation of the requested features for the English K1 Run game:

1. Progressive worm spawning (5 worms, 3-second intervals)
2. Recurring worm spawning (3 worms every 30 seconds)
3. Dramatic splat effect (❇️) with 8-second fade
4. Screen shake on incorrect emoji tap

## Implementation Details

### 1. Progressive Worm Spawning

**Requirement:** First 5 worms spawn progressively every 3 seconds apart

**Implementation:**

- Modified `startGame()` in `src/hooks/use-game-logic.ts`
- Uses `setTimeout` to create staggered spawn pattern
- Each worm spawns at `i * 3000ms` interval (0s, 3s, 6s, 9s, 12s)
- Worms alternate between left and right player lanes
- Timers stored in `progressiveSpawnTimeoutRefs` for cleanup

**Code:**

```typescript
for (let i = 0; i < WORM_INITIAL_COUNT; i++) {
  const timeout = setTimeout(() => {
    setWorms(prev => [...prev, ...createWorms(1, i)])
    eventTracker.trackEvent({
      type: 'info',
      category: 'worm',
      message: `Progressive spawn: worm ${i + 1}/${WORM_INITIAL_COUNT}`,
      data: { wormIndex: i }
    })
  }, i * WORM_PROGRESSIVE_SPAWN_INTERVAL) // 3000ms
  progressiveSpawnTimeoutRefs.current.push(timeout)
}
```

### 2. Recurring Worm Spawning

**Requirement:** Add 3 worms every 30 seconds during gameplay

**Implementation:**

- Added `setInterval` in `startGame()` function
- Spawns 3 new worms every 30,000ms (30 seconds)
- Continues throughout entire game session
- Timer stored in `recurringSpawnIntervalRef` for cleanup
- Properly cleared on game reset to prevent memory leaks

**Code:**

```typescript
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
}, WORM_RECURRING_INTERVAL) // 30000ms
```

### 3. Dramatic Splat Effect (❇️) - [REMOVED/REPLACED]

**Status:** Removed in November 2025. Replaced by `FairyTransformation` for a more child-friendly "rescue" theme.

**Original Requirement:** Create dramatic splat effect that fades out over 8 seconds

**Legacy Implementation (Removed):**

- Component: `src/components/SplatEffect.tsx` (Deleted)
- Logic: `splats` state in `use-game-logic.ts` (Removed)
- Visual: ❇️ (sparkle) emoji with 8-second fade

**Replacement:**

- See `FairyTransformation` component
- Worms now transform into fairies/butterflies when tapped
- Includes particle effects and "rescue" animation
- Better aligned with educational/positive reinforcement theme

**Legacy Component Structure (Reference Only):**

```typescript
export interface SplatObject {
  id: string
  x: number      // Percentage (0-100)
  y: number      // Pixels
  createdAt: number
  lane: 'left' | 'right'
}
```

**Integration (Removed):**

- Splats were created in `handleWormTap()`
- Rendered in `App.tsx`
- Cleanup logic removed from `use-game-logic.ts`

### 4. Screen Shake Animation

**Requirement:** Implement screen shake when wrong emoji is selected

**Implementation:**

- Added CSS keyframe animation to `src/App.css`
- Triggers on incorrect emoji tap in `handleObjectTap()`
- Duration: 500ms
- Multi-directional shake for realistic effect
- Uses cubic-bezier easing for smooth acceleration/deceleration

**CSS Animation:**

```css
@keyframes screen-shake {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px) translateY(5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px) translateY(-5px);
  }
}

.screen-shake {
  animation: screen-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
```

**Trigger Logic:**

```typescript
// In handleObjectTap() for incorrect taps
if (!isCorrect) {
  newState.streak = 0
  newState.progress = Math.max(prev.progress - 20, 0)
  
  // Trigger screen shake
  setScreenShake(true)
  setTimeout(() => setScreenShake(false), 500)
}
```

**Application:**

```tsx
<div className={`h-full ${screenShake ? 'screen-shake' : ''}`}>
  <PlayerArea>
    {/* Game content */}
  </PlayerArea>
</div>
```

## State Management

### New State Variables

1. `splats: SplatObject[]` - Array of active splat effects
2. `currentTime: number` - Current timestamp for opacity calculations
3. `screenShake: boolean` - Controls shake animation class

### Timer References

1. `progressiveSpawnTimeoutRefs: NodeJS.Timeout[]` - Cleanup for initial worm spawns
2. `recurringSpawnIntervalRef: NodeJS.Timeout` - Cleanup for recurring spawns

### Cleanup Strategy

All timers properly cleared in `resetGame()`:

```typescript
// Clear worm spawn timers
progressiveSpawnTimeoutRefs.current.forEach(timeout => clearTimeout(timeout))
progressiveSpawnTimeoutRefs.current = []
if (recurringSpawnIntervalRef.current) {
  clearInterval(recurringSpawnIntervalRef.current)
}

setSplats([]) // Clear splats
setScreenShake(false) // Reset shake
```

## Performance Optimizations

1. **Memoized Components:** `SplatEffect` uses `memo()` to prevent unnecessary re-renders
2. **Efficient Filtering:** Splat cleanup only processes expired items
3. **Conditional Updates:** Splat opacity only recalculates when time changes significantly
4. **Proper Cleanup:** All timers cleared to prevent memory leaks
5. **Z-Index Layering:** Splats positioned below worms (15) but above game objects (10)

## Testing Checklist

### Manual Testing Steps

1. ✅ Start a new game
2. ✅ Verify first worm appears immediately (0s)
3. ✅ Verify second worm appears at 3 seconds
4. ✅ Verify third worm appears at 6 seconds
5. ✅ Verify fourth worm appears at 9 seconds
6. ✅ Verify fifth worm appears at 12 seconds
7. ✅ Wait 30 seconds - verify 3 new worms spawn
8. ✅ Wait another 30 seconds - verify 3 more worms spawn
9. ✅ Tap a worm - verify ❇️ splat appears at tap location
10. ✅ Observe splat fade - verify it takes ~8 seconds to disappear
11. ✅ Tap wrong emoji - verify screen shakes for ~0.5 seconds
12. ✅ Reset game - verify all worms and splats cleared
13. ✅ Start new game - verify timers don't conflict

## Files Modified

1. **src/hooks/use-game-logic.ts**
   - Added `SplatObject` interface
   - Added worm spawn constants (WORM_INITIAL_COUNT, WORM_PROGRESSIVE_SPAWN_INTERVAL, etc.)
   - Added state variables (splats, currentTime, screenShake)
   - Modified `createWorms()` to accept count parameter
   - Updated `handleWormTap()` to create splats
   - Updated `handleObjectTap()` to trigger screen shake
   - Updated `startGame()` with progressive and recurring spawn logic
   - Updated `resetGame()` to clear timers and splats
   - Added splat cleanup useEffect
   - Exported new state variables

2. **src/components/SplatEffect.tsx** (NEW)
   - Created memoized component for splat rendering
   - Implements 8-second fade animation
   - Optimized rendering with useMemo hooks

3. **src/App.tsx**
   - Imported `SplatEffect` component
   - Destructured new state variables from `useGameLogic()`
   - Added `screenShake` class to game container
   - Rendered splats within PlayerArea

4. **src/App.css**
   - Added `@keyframes screen-shake` animation
   - Added `.screen-shake` class

## Constants

```typescript
const WORM_INITIAL_COUNT = 5           // First 5 worms
const WORM_PROGRESSIVE_SPAWN_INTERVAL = 3000  // 3 seconds
const WORM_RECURRING_COUNT = 3         // Recurring spawn count
const WORM_RECURRING_INTERVAL = 30000  // 30 seconds
const SPLAT_DURATION = 8000            // 8 seconds
const SPLAT_SIZE = 80                  // 80px emoji
```

## Build Status

- ✅ TypeScript compilation: PASSED
- ✅ ESLint: PASSED (no errors or warnings)
- ✅ Build: SUCCESS
- ✅ Bundle size: Within acceptable limits

## Known Limitations

None - all requirements fully implemented as specified.

## Future Enhancements (Optional)

1. Add different splat emojis for variety (💥, ✨, 🌟)
2. Randomize splat rotation for more dynamic effect
3. Add sound effect on worm tap
4. Configurable spawn intervals via settings
5. Limit maximum concurrent worms to prevent overcrowding
