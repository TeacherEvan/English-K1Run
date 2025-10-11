# Emoji Side-Switching Bug Fix

## Issue Summary

**Date**: October 11, 2025  
**Severity**: Critical - Violates core architectural constraint  
**Component**: `src/hooks/use-game-logic.ts` - `updateObjects()` collision avoidance logic

## Problem Description

Emojis spawned on the **right side** (x > 50) were switching to the **left side** (x <= 50) during gameplay, violating the split-screen coordinate system architecture.

### Evidence from Lifecycle Debug Data

```json
{
  "objectId": "1760176226445-0-0.9522061464618282",
  "emoji": "🥦",
  "name": "broccoli",
  "phases": [
    {
      "phase": "spawned",
      "position": { "x": 64.67982985634409, "y": -190.54 },
      "playerSide": "right"  // ✅ Correct - spawned on right
    },
    {
      "phase": "missed",
      "position": { "x": 45, "y": 1179.91 },
      "playerSide": "left"   // ❌ BUG - switched to left!
    }
  ]
}
```

**Multiple objects exhibited this behavior:**

- Broccoli (x: 64.68 → 45)
- Cucumber (x: 79.68 → 45)
- Broccoli (x: 79.68 → 10)
- Broccoli (x: 90 → 10)

## Root Cause

In `src/hooks/use-game-logic.ts` at line 438, the collision avoidance function `applySeparation()` **hardcoded the X-coordinate clamp to `[10, 45]`** (left side range):

```typescript
// ❌ BUGGY CODE (line 438)
const applySeparation = (objects: GameObject[]) => {
  // ...collision detection logic...
  if (distance < minGap) {
    const pushX = dx > 0 ? 0.2 : -0.2
    obj.x = Math.max(10, Math.min(45, obj.x + pushX)) // ⚠️ Hardcoded left boundaries!
  }
}

applySeparation(laneBuckets.left)   // Correct for left
applySeparation(laneBuckets.right)  // ❌ Forces right objects to left range!
```

### Why This Happened

The `applySeparation()` function processes both left and right lane objects but used the **same hardcoded boundaries** for both:

- **Left lane valid range**: `[10, 45]` ✅
- **Right lane valid range**: `[55, 90]` ⚠️ Not used!

When right-side objects (x > 50) were pushed during collision detection, `Math.min(45, obj.x + pushX)` clamped them to a maximum of **45**, forcing them into the left side.

## The Fix

Modified `applySeparation()` to accept a `lane` parameter and use **lane-specific boundaries**:

```typescript
// ✅ FIXED CODE (line 416-446)
const applySeparation = (objects: GameObject[], lane: 'left' | 'right') => {
  // Define lane boundaries based on which side we're processing
  const [minX, maxX] = lane === 'left' ? [10, 45] : [55, 90]

  // Sort by Y position (top to bottom)
  const sorted = objects.sort((a, b) => a.y - b.y)

  for (let i = 0; i < sorted.length; i++) {
    const obj = sorted[i]

    // Check collision with objects above
    for (let j = 0; j < i; j++) {
      const other = sorted[j]
      const dx = obj.x - other.x
      const dy = obj.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // If too close, push horizontally (don't mess with Y or speed)
      if (distance < minGap) {
        const pushX = dx > 0 ? 0.2 : -0.2
        obj.x = Math.max(minX, Math.min(maxX, obj.x + pushX)) // ✅ Lane-specific boundaries
      }
    }

    updatedObjects.push(obj)
  }
}

// Pass lane parameter to each call
applySeparation(laneBuckets.left, 'left')
applySeparation(laneBuckets.right, 'right')
```

## Changes Made

**File**: `src/hooks/use-game-logic.ts`  
**Function**: `updateObjects()` → `applySeparation()`  
**Lines**: 416-446

### Specific Changes

1. **Function Signature**: Added `lane: 'left' | 'right'` parameter
2. **Dynamic Boundaries**: `const [minX, maxX] = lane === 'left' ? [10, 45] : [55, 90]`
3. **Clamp Using Lane Bounds**: `obj.x = Math.max(minX, Math.min(maxX, obj.x + pushX))`
4. **Function Calls**: Updated to pass lane identifier:
   - `applySeparation(laneBuckets.left, 'left')`
   - `applySeparation(laneBuckets.right, 'right')`

## Expected Behavior After Fix

### Left Side Objects (x <= 50)

- Spawn in range `[10, 45]`
- Collision pushes stay within `[10, 45]`
- Fall off screen with x ∈ `[10, 45]`
- Lifecycle shows `playerSide: "left"` throughout

### Right Side Objects (x > 50)

- Spawn in range `[55, 90]`
- Collision pushes stay within `[55, 90]`
- Fall off screen with x ∈ `[55, 90]`
- Lifecycle shows `playerSide: "right"` throughout

## Architectural Compliance

This fix restores compliance with the **Critical Architectural Rule**:

> **⚠️ Coordinate System**: Split-screen uses percentage-based positioning (`x <= 50` = Player 1, `x > 50` = Player 2). Never use absolute pixel coordinates. `App.tsx` handles viewport remapping.

Objects now **maintain their assigned player side** throughout their entire lifecycle, from spawn → movement → tap/miss → removal.

## Testing Recommendations

1. **Visual Inspection**: Watch right-side emojis during gameplay - they should never cross to the left
2. **Lifecycle Debug**: Check `EmojiLifecycleDebug` component - all phases should show consistent `playerSide`
3. **Collision Scenarios**: Spawn many objects on right side and verify X coordinates stay > 50
4. **Edge Cases**: Test objects spawned at x=55 (right edge) and x=90 (far right) under heavy collision pressure

## Related Files

- `src/hooks/use-game-logic.ts` - Main fix location
- `src/lib/event-tracker.ts` - Lifecycle tracking logic
- `src/components/EmojiLifecycleDebug.tsx` - Debug visualization
- `src/App.tsx` - Split-screen rendering (converts coordinates to half-width containers)

## Impact

- **Severity**: High - Core gameplay mechanic was broken
- **User Impact**: Players may have experienced emojis appearing on wrong side
- **Data Quality**: Lifecycle tracking now accurately reflects object behavior
- **Performance**: No performance impact - same logic complexity, just correct boundaries
