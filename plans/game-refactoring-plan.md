# Game Refactoring Plan

## Overview

Refactor the Kindergarten Race Game to:

1. Remove all progression popups and notifications from gameplay
2. Clean up console logging
3. Modularize code structure

---

## Phase 1: Remove Progression Popups

### Components to Delete

| File                                                                                 | Lines | Purpose                               |
| ------------------------------------------------------------------------------------ | ----- | ------------------------------------- |
| [`src/components/AchievementDisplay.tsx`](src/components/AchievementDisplay.tsx)     | 35    | Coin animations for correct taps      |
| [`src/components/ComboCelebration.tsx`](src/components/ComboCelebration.tsx)         | 127   | Streak celebration overlays           |
| [`src/components/MilestoneCelebration.tsx`](src/components/MilestoneCelebration.tsx) | 168   | 25%/50%/75%/100% full-screen overlays |
| [`src/components/HighScoreWindow.tsx`](src/components/HighScoreWindow.tsx)           | 57    | Continuous mode completion popup      |

### State to Remove from `use-game-logic.ts`

```typescript
// REMOVE these state declarations:
const [achievements, setAchievements] = useState<Achievement[]>([]);
const [comboCelebration, setComboCelebration] =
  useState<ComboCelebration | null>(null);
const [currentMilestone, setCurrentMilestone] = useState<MilestoneEvent | null>(
  null,
);
const [showHighScoreWindow, setShowHighScoreWindow] = useState(false);
const [lastCompletionTime, setLastCompletionTime] = useState<number | null>(
  null,
);
const [continuousModeElapsed, setContinuousModeElapsed] = useState<
  number | null
>(null);

// REMOVE related refs:
const continuousModeTargetCount = useRef(0);
```

### Cleanup in `use-game-logic.ts`

```typescript
// REMOVE from return object:
(comboCelebration,
  clearComboCelebration,
  achievements,
  clearAchievement,
  currentMilestone,
  clearMilestone,
  continuousModeElapsed,
  showHighScoreWindow,
  lastCompletionTime,
  closeHighScoreWindow,
  currentMultiplier); // Only used for popup display
```

---

## Phase 2: Clean Up Tap Handlers

### Remove from [`src/hooks/game-logic/tap-handlers.ts`](src/hooks/game-logic/tap-handlers.ts)

**Imports to remove:**

```typescript
import {
  COMBO_LEVELS,
  getStreakMultiplier,
} from "../../lib/constants/combo-levels";
import { checkMilestone } from "../../lib/constants/engagement-system";
import {
  CORRECT_MESSAGES,
  getStreakMessage,
} from "../../lib/constants/messages";
```

**Functions to remove:**

- `setAchievements()` calls (all of them)
- `setComboCelebration()` calls (all of them)
- `setCurrentMilestone()` calls (all of them)
- `setShowHighScoreWindow()` calls (all of them)
- Milestone checking logic
- Combo celebration logic
- Streak multiplier logic

**Simplified `handleObjectTap` should:**

1. Check if tap is correct
2. Remove tapped object
3. Update progress
4. Generate new target if needed
5. Handle win condition
6. No popup/tracking overhead

---

## Phase 3: Clean Up Console Logging

### [`src/lib/sound-manager.ts`](src/lib/sound-manager.ts)

Remove excessive `console.log` statements:

- Lines 179, 198, 214, 233-236, 242-249, 277-280, 285-287, 298, 301-303, 308-310, 318-320, 322, 394, 414-417, 420, 433-436, 439-441

### [`src/hooks/game-logic/spawn-objects.ts`](src/hooks/game-logic/spawn-objects.ts)

Remove `console.log` at line 205

### [`src/hooks/game-logic/target-pool.ts`](src/hooks/game-logic/target-pool.ts)

Remove `console.log` at lines 49-51 and 75-78

### [`src/hooks/game-logic/tap-handlers.ts`](src/hooks/game-logic/tap-handlers.ts)

Remove `console.log` at lines 236-239 and 364-368

### [`src/App.tsx`](src/App.tsx)

Remove `console.log` at lines 117, 156, 165, 174-175, 180, 318

---

## Phase 4: Clean Up Related Files

### [`src/hooks/game-logic/game-session.ts`](src/hooks/game-logic/game-session.ts)

Remove `setComboCelebration` from dependencies and calls

### [`src/hooks/game-logic/game-effects.ts`](src/hooks/game-logic/game-effects.ts)

No changes needed - effects are already clean

### [`src/hooks/game-logic/object-update.ts`](src/hooks/game-logic/object-update.ts)

No changes needed - already clean

### [`src/hooks/game-logic/worm-logic.ts`](src/hooks/game-logic/worm-logic.ts)

No changes needed - already clean

---

## Phase 5: App.tsx Cleanup

### Remove Lazy Loading

```typescript
// REMOVE these lazy imports:
const AchievementDisplay = lazy(() =>
  import("./components/AchievementDisplay").then((m) => ({
    default: m.AchievementDisplay,
  })),
);
const MilestoneCelebration = lazy(() =>
  import("./components/MilestoneCelebration").then((m) => ({
    default: m.MilestoneCelebration,
  })),
);
const HighScoreWindow = lazy(() =>
  import("./components/HighScoreWindow").then((m) => ({
    default: m.HighScoreWindow,
  })),
);
```

### Remove Imports

```typescript
import { PROGRESS_MILESTONES } from "./lib/constants/engagement-system";
```

### Remove JSX

```tsx
{/* REMOVE achievement displays */}
{achievements.map(achievement => ( ... ))}

{/* REMOVE milestone celebration */}
{currentMilestone && ( ... )}

{/* REMOVE high score window */}
{showHighScoreWindow && ( ... )}
```

### Remove EventTracker Calls

Clean up event tracking related to removed features:

- Combo tracking events
- Milestone tracking events
- Achievement tracking events

---

## Phase 6: Create Clean Index Export

Create [`src/hooks/game-logic/index.ts`](src/hooks/game-logic/index.ts):

```typescript
// Re-export all game logic modules for clean imports
export * from "./game-effects";
export * from "./game-session";
export * from "./object-update";
export * from "./spawn-objects";
export * from "./tap-handlers";
export * from "./target-pool";
export * from "./worm-logic";
```

---

## Phase 7: Cleanup Types and Constants

### Remove Unused Types

```typescript
// In src/types/game.ts, consider removing:
type Achievement = { ... }
type ComboCelebration = { ... }
type MilestoneEvent = { ... }
```

### Remove Unused Constants

```typescript
// In src/lib/constants/combo-levels.ts - can be removed entirely
// In src/lib/constants/engagement-system.ts - remove PROGRESS_MILESTONES
// In src/lib/constants/messages.ts - remove CORRECT_MESSAGES, getStreakMessage
```

---

## Expected Line Count After Refactoring

| File              | Before    | After     |
| ----------------- | --------- | --------- |
| use-game-logic.ts | 337       | ~150      |
| tap-handlers.ts   | 402       | ~150      |
| spawn-objects.ts  | 435       | ~400      |
| game-session.ts   | 211       | ~180      |
| game-effects.ts   | 198       | ~198      |
| sound-manager.ts  | 477       | ~400      |
| **Total**         | **~2060** | **~1478** |

---

## Testing Checklist

- [ ] Game starts and loads correctly
- [ ] Objects spawn and fall properly
- [ ] Tap detection works (correct/incorrect)
- [ ] Progress tracking works
- [ ] Win condition triggers correctly
- [ ] No console errors in development
- [ ] No popup interruptions during gameplay
- [ ] Continuous mode works without high score popup
- [ ] Performance is improved (fewer re-renders)

---

## Rollback Plan

If issues arise, the refactoring is non Deleted-destructive:

1. components can be restored from git
2. Removed state can be added back
3. Console logs can be re-enabled for debugging
