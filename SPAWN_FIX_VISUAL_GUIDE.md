# Visual Explanation of Spawn Fix

## Before the Fix

```
Screen Layout (1080px height):
┌─────────────────────────────────────────┐ Y = 0
│  [Target Display at Y=16px]             │
├─────────────────────────────────────────┤ Y = 96px (Game Area starts - pt-24)
│                                         │
│  🍎 ← Object spawning at Y = -60px     │
│     (Just barely above screen)          │
│                                         │
│  Objects appearing too close to         │
│  target display, seeming to spawn       │
│  ON the display instead of above it     │
│                                         │
│         [Gameplay Area]                 │
│                                         │
│  Objects being removed here at ~600px   │
│  when object count > 26                 │ ← PROBLEM: Removed in middle
│  (Too early! Not at bottom yet)         │
│                                         │
│                                         │
└─────────────────────────────────────────┘ Y = 1080px

Objects removed at Y >= 1140px (correct)
But also removed at any Y when count > 26 (wrong!)
```

## After the Fix

```
High Above Screen:
                   Y = -200px  🍎 ← First object spawns
                   Y = -215px  🍇 ← Second object spawns  
                   Y = -230px  🍌 ← Third object spawns
                   Y = -245px  🍓 ← Fourth object spawns
                      ⋮

Screen Layout (1080px height):
┌─────────────────────────────────────────┐ Y = 0
│  [Target Display at Y=16px]             │
├─────────────────────────────────────────┤ Y = 96px (Game Area starts - pt-24)
│                                         │
│  🍎 ← Objects falling into view         │
│     (Smooth appearance from above)      │
│                                         │
│  🍇  🍌                                 │
│                                         │
│         [Gameplay Area]                 │
│                                         │
│  🍓     🍊                              │
│                                         │
│              🥕                         │
│                                         │
│                   🥒                    │
│                                         │ Y = 864px (80% threshold)
│  Only objects below this line are       │ ← Objects below here can be
│  considered for removal when limit      │   removed if count > 26
│  is reached                             │
└─────────────────────────────────────────┘ Y = 1080px

Objects naturally removed at Y >= 1140px
```

## Key Changes Summary

### 1. Spawn Height Change
- **Before**: `-60px` (one emoji size above screen)
- **After**: `-200px` (well above screen)
- **Benefit**: Objects have smooth entry from above, no sudden appearance

### 2. Removal Logic Change
- **Before**: Any object could be removed when count > 26
- **After**: Only objects at Y >= 864px (80% down) can be removed when count > 26
- **Benefit**: Objects in upper/middle gameplay area are protected from premature removal

## Object Lifecycle Example

1. **Spawn**: Object created at Y = -200px (above screen)
2. **Enter View**: Object becomes visible at Y = 0
3. **Pass Target Display**: Object moves past the target display (Y = 16px to ~96px)
4. **Mid-Screen**: Object continues falling (Y = 96px to 864px) - **PROTECTED FROM PREMATURE REMOVAL**
5. **Lower Screen**: Object reaches Y = 864px+ - Can be removed if object count exceeds limit
6. **Exit Screen**: Object reaches Y = 1080px+ (below screen)
7. **Natural Removal**: Object removed at Y >= 1140px (screenHeight + EMOJI_SIZE)

## Testing Scenarios

### Scenario 1: Normal Gameplay (Object count < 26)
- Objects spawn at -200px
- Fall naturally through entire screen
- Removed at Y >= 1140px
- ✅ **Result**: Smooth falling through entire display

### Scenario 2: High Object Count (> 26 objects)
- Objects spawn at -200px
- Fall naturally through screen
- Objects at Y < 864px are **protected**
- Objects at Y >= 864px may be culled to make room for new spawns
- ✅ **Result**: No mid-screen disappearance, only remove objects near bottom

### Scenario 3: Player Tapping
- Objects spawn at -200px
- Player taps object at any Y position
- Object removed immediately
- ✅ **Result**: Normal gameplay interaction works correctly

## Constants Used

```typescript
// From game-config.ts
SPAWN_ABOVE_SCREEN = 200     // New constant
SPAWN_VERTICAL_GAP = 15      // Existing
EMOJI_SIZE = 60              // Existing
MAX_ACTIVE_OBJECTS = 30      // Existing
TARGET_GUARANTEE_COUNT = 2   // Existing
MIN_DECOY_SLOTS = 2          // Existing

// Calculated
maxObjectsBeforeSpawn = MAX_ACTIVE_OBJECTS - TARGET_GUARANTEE_COUNT - MIN_DECOY_SLOTS
                      = 30 - 2 - 2 = 26

offScreenThreshold = window.innerHeight * 0.8
                   = 1080 * 0.8 = 864px
```

## Performance Impact

### Positive
- ✅ Objects spawn higher, giving more time for smooth entry
- ✅ Reduced premature removals means less spawning/removal churn
- ✅ Protected mid-screen objects improve visual consistency

### Neutral
- No significant performance overhead (same number of objects tracked)
- Removal logic adds one additional check (Y >= offScreenThreshold) but filters candidates earlier

## Browser Compatibility
- Works in all modern browsers
- Uses standard window.innerHeight API
- No special CSS or browser features required
