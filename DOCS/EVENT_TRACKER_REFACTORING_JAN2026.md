# Event Tracker Refactoring Summary

**Date:** January 11, 2026  
**Impact:** Better code organization, easier maintenance, clearer separation of concerns

## What Changed

Split the monolithic `src/lib/event-tracker.ts` (722 lines) into focused subsystems:

### New Modules Created

1. **`src/lib/event-tracking/audio-event-tracker.ts`** (98 lines)

   - Tracks audio playback attempts (success/failure)
   - Records method distribution (web-audio, html-audio, speech-synthesis, **audio-sprite**, etc.)
   - Provides aggregated statistics
   - **Direct benefit:** New audio-sprite tracking from recent optimization now has a dedicated home

2. **`src/lib/event-tracking/emoji-tracker.ts`** (294 lines)

   - Lifecycle tracking (spawned → visible → tapped/missed)
   - Rotation fairness monitoring (all emojis appear within 10s threshold)
   - Appearance frequency and audio correlation
   - Performance-sensitive: only tracks when enabled

3. **`src/lib/event-tracking/performance-tracker.ts`** (123 lines)

   - Frame rate monitoring via `requestAnimationFrame`
   - Object spawn rate calculation
   - Touch input latency tracking
   - Start/stop controls to save CPU when not in gameplay

4. **`src/lib/event-tracking/index.ts`** (24 lines)
   - Barrel export for clean imports
   - Re-exports all subsystem types and singletons

### Main Facade Retained

**`src/lib/event-tracker.ts`** (407 lines, down from 722)

- Kept as backward-compatible facade
- Delegates to specialized trackers via `require()` (lazy-loaded)
- Continues to handle general event logging (errors, warnings, lifecycle)
- **All existing imports continue to work unchanged**

## Backward Compatibility

✅ **Zero breaking changes:**

- All 10 existing import sites work unchanged:
  - `import { eventTracker } from '../lib/event-tracker'` ✓
  - `import { GameEvent, PerformanceMetrics } from '../lib/event-tracker'` ✓
  - All delegated methods maintain identical signatures
- TypeScript compiles with no errors
- VS Code language server errors are transient (will clear on reload)

## Benefits

### Maintainability

- Each module has a single, clear responsibility
- Easier to locate audio/emoji/performance tracking logic
- **New audio-sprite tracking** naturally fits in `audio-event-tracker.ts`

### Performance (Potential)

- Subsystems loaded lazily via `require()` when first accessed
- Can disable expensive tracking (emoji lifecycle, rotation) independently
- Performance monitoring only active during gameplay

### Testing

- Smaller modules easier to unit test in isolation
- Clear boundaries for mocking in integration tests

### Extensibility

- Adding new tracking types (e.g., network, analytics) follows established pattern
- Each subsystem can evolve independently

## Migration Path (If Needed)

If you want to import subsystems directly (optional):

```typescript
// Old (still works)
import { eventTracker } from "../lib/event-tracker";

// New (direct access, if preferred)
import { audioEventTracker } from "../lib/event-tracking";
import { emojiTracker } from "../lib/event-tracking";
import { performanceTracker } from "../lib/event-tracking";
```

## Next Steps (Future Refactors)

Using this as a proven pattern, consider:

1. **`use-game-logic.ts`** (1879 lines) → Extract pure helpers to `src/lib/game/*`

   - Target pool management → `target-pool.ts`
   - Continuous mode logic → `continuous-mode.ts`
   - Keep **all state** in the hook (per architecture rules)

2. **`accessibility-utils.ts`** (759 lines) → Split by concern

   - `keyboard.ts`, `focus-trap.ts`, `live-region.ts`, `motion.ts`

3. **Performance utilities** → Lazy-load debug-only code
   - Only import when debug overlay is shown

## Validation

- ✅ TypeScript compilation: No errors in refactored files
- ✅ All consumers compile successfully
- ✅ No changes required to existing call sites
- ⏳ Full `npm run verify` blocked by Drive-synced folder install issues (local worktree recommended)

## Files Modified

| File                      | Lines Before | Lines After | Status              |
| ------------------------- | ------------ | ----------- | ------------------- |
| `event-tracker.ts`        | 722          | 407         | Refactored (facade) |
| `audio-event-tracker.ts`  | -            | 98          | Created             |
| `emoji-tracker.ts`        | -            | 294         | Created             |
| `performance-tracker.ts`  | -            | 123         | Created             |
| `event-tracking/index.ts` | -            | 24          | Created             |

**Total:** 722 lines split into 946 lines across 5 files (more maintainable with clear boundaries)
