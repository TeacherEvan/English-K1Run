# Spawn and Removal Fix - December 2025

## Problem Statement

Targets were not being spawned from **above** the target display in the centre, and they were disappearing in the middle of the display instead of raining down to the bottom.

### Symptoms
1. **Spawn Position Issue**: Targets were not spawning from above the central target display area
2. **Removal Issue**: Targets were disappearing/being removed in the middle of the gameplay display instead of falling all the way to the bottom

## Root Cause Analysis

### 1. Spawn Position
- Objects were spawning at `initialY = -EMOJI_SIZE - i * SPAWN_VERTICAL_GAP`
- With `EMOJI_SIZE = 60` and `SPAWN_VERTICAL_GAP = 15`:
  - First object: `-60px` (barely above screen)
  - Second object: `-75px`
  - Third object: `-90px`
- This was too close to the screen top, with objects appearing to spawn on or near the TargetDisplay at the top

### 2. Premature Removal
- The `spawnObject()` function has logic to remove excess objects when the count exceeds `MAX_ACTIVE_OBJECTS - 4` (26 objects)
- Previously, it would consider **all objects** for removal, sorted by Y position
- This meant objects in the middle of the screen (not yet at the bottom) could be removed if there were too many objects

## Solution Implemented

### 1. Increased Spawn Height (200px above screen)
**File**: `src/lib/constants/game-config.ts`
- Added new constant: `SPAWN_ABOVE_SCREEN = 200`
- Objects now spawn at `-200px`, `-215px`, `-230px`, etc.
- This ensures objects spawn well above any UI elements (TargetDisplay is at 16px from top)

**Changes in**: `src/hooks/use-game-logic.ts`
- Updated `spawnImmediateTargets()`: Changed `initialY = -EMOJI_SIZE - i * SPAWN_VERTICAL_GAP` to `initialY = -SPAWN_ABOVE_SCREEN - i * SPAWN_VERTICAL_GAP`
- Updated `spawnObject()` for target objects: Same change
- Updated `spawnObject()` for decoy objects: Same change

### 2. Fixed Premature Removal Logic
**File**: `src/hooks/use-game-logic.ts` in `spawnObject()` function

**Before**:
```typescript
// Single pass: count targets and identify removal candidates
const candidates: Array<{ id: string; y: number; isTarget: boolean }> = []
for (const obj of workingList) {
  const isTarget = !!(targetEmoji && obj.emoji === targetEmoji)
  if (isTarget) targetCountOnScreen++
  candidates.push({ id: obj.id, y: obj.y, isTarget })
}
```

**After**:
```typescript
// Get screen height for off-screen detection
const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
const offScreenThreshold = screenHeight * 0.8 // Only remove objects that are 80% down the screen

// Single pass: count targets and identify removal candidates
const candidates: Array<{ id: string; y: number; isTarget: boolean }> = []
for (const obj of workingList) {
  const isTarget = !!(targetEmoji && obj.emoji === targetEmoji)
  if (isTarget) targetCountOnScreen++
  // Only consider objects that are far down the screen for removal
  if (obj.y >= offScreenThreshold) {
    candidates.push({ id: obj.id, y: obj.y, isTarget })
  }
}
```

**Impact**: Objects are only considered for removal when they're at 80%+ down the screen (e.g., 864px+ on a 1080px display). This prevents removing objects in the middle of the gameplay area.

## Testing

### Unit Tests
Added 2 new test cases in `src/lib/utils/__tests__/spawn-position.test.ts`:

1. **Test spawn positions well above screen (-200px)**
   ```typescript
   it('should handle spawn positions well above screen (SPAWN_ABOVE_SCREEN)', () => {
     const result = calculateSafeSpawnPosition({
       initialX: 50,
       initialY: -200,
       existingObjects: [],
       laneConstraints: { minX: 5, maxX: 95 }
     })
     expect(result.y).toBe(-200)
     expect(result.y).toBeLessThan(0)
   })
   ```

2. **Test multiple objects with vertical gaps**
   ```typescript
   it('should maintain spawn offset for multiple objects', () => {
     const SPAWN_VERTICAL_GAP = 15
     const firstResult = calculateSafeSpawnPosition({
       initialX: 40,
       initialY: -200,
       existingObjects: [],
       laneConstraints: { minX: 5, maxX: 95 }
     })
     const secondResult = calculateSafeSpawnPosition({
       initialX: 60,
       initialY: -200 - SPAWN_VERTICAL_GAP,
       existingObjects: [],
       laneConstraints: { minX: 5, maxX: 95 }
     })
     expect(secondResult.y).toBe(-215)
     expect(secondResult.y).toBeLessThan(firstResult.y)
   })
   ```

**Result**: All 15 tests passing ✓

### Build Verification
- TypeScript compilation: ✓ Success
- Linter: ✓ No new errors (only pre-existing warnings)
- Production build: ✓ Built in 3.21s

## Expected Behavior After Fix

1. ✅ Targets spawn **above** the visible gameplay area (at -200px)
2. ✅ Targets fall smoothly through the entire display without premature removal
3. ✅ Targets are only removed when they:
   - Reach the bottom of the screen (via `updateObjects()` at `y >= screenHeight + EMOJI_SIZE`)
   - Are tapped by the player
   - Need to be culled due to object limit AND are at 80%+ down the screen

## Technical Details

### Coordinate System
- Y = 0: Top of the viewport
- Negative Y: Above the viewport (off-screen top)
- Y = screenHeight: Bottom of the viewport
- Positive Y beyond screenHeight: Below the viewport (off-screen bottom)

### Rendering
- Objects use CSS: `top: 0; transform: translate(-50%, ${object.y}px)`
- When `object.y = -200`, the object is 200px above the top of the screen
- When `object.y = 1080`, the object is at the bottom of a 1080px screen

### Removal Thresholds
1. **Natural removal** (in `updateObjects()`): `y >= screenHeight + EMOJI_SIZE` (~1140px on 1080p)
2. **Capacity-based removal** (in `spawnObject()`): Only objects at `y >= screenHeight * 0.8` (~864px on 1080p)

## Files Modified
- `src/lib/constants/game-config.ts` - Added SPAWN_ABOVE_SCREEN constant
- `src/hooks/use-game-logic.ts` - Updated spawn positions and removal logic
- `src/lib/utils/__tests__/spawn-position.test.ts` - Added 2 new test cases

## Related Documentation
- See repository custom instructions for coordinate system details
- See `PERFORMANCE_OPTIMIZATION_OCT2025.md` for related performance improvements
