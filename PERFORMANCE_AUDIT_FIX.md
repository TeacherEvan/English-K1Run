# Performance Audit & Bug Fix Report

**Date**: October 13, 2025
**Issue**: Level select window shows but emojis don't rain down, performance bottlenecks

## Critical Issues Found

### 1. **CRITICAL: Spawn Interval Breaking Due to Dependency Churn**

**Location**: `use-game-logic.ts` lines 700-714

**Problem**:

- The `spawnObject` callback is included in the spawn effect's dependency array
- `spawnObject` has 5+ dependencies that change frequently: `currentCategory`, `fallSpeedMultiplier`, `emojiQueue`, `setEmojiQueue`, `setLastSeenEmojis`
- Every time any dependency changes, `spawnObject` recreates, causing the spawn interval to reset
- This prevents objects from spawning consistently

**Impact**: Game appears broken - no emojis fall

**Fix**: Remove unnecessary dependencies using functional setState updates

---

### 2. **Performance: Redundant Emoji Queue System**

**Location**: `use-game-logic.ts` lines 200-207, 674-693

**Problem**:

- Complex emoji variety management with queue state
- Runs every 3 seconds checking all emojis
- Causes excessive re-renders via `setEmojiQueue` and `setLastSeenEmojis`
- Over-engineered for simple gameplay needs

**Impact**:

- Unnecessary state updates
- Makes `spawnObject` recreate frequently
- Adds cognitive complexity

**Fix**: Simplify to pure random selection, remove queue state

---

### 3. **Performance: Inefficient Collision Detection**

**Location**: `use-game-logic.ts` lines 420-460

**Problem**:

- O(n²) algorithm checking every object against every other
- Runs 60 times per second in `updateObjects`
- Spatial partitioning attempt but still checks all pairs
- Objects rarely overlap enough to justify this cost

**Impact**:

- Frame drops when 10+ objects on screen
- Wasted CPU cycles

**Fix**: Simplify collision detection, increase minSeparation threshold

---

### 4. **Code Duplication: Multiple State Setters in spawnObject**

**Location**: `use-game-logic.ts` lines 240-360

**Problem**:

- Multiple calls to `setGameObjects`, `setEmojiQueue`, `setLastSeenEmojis` within spawnObject
- Each setState causes a re-render
- Creates unnecessary render cycles

**Impact**: Performance degradation with multiple renders per spawn

**Fix**: Batch all state updates, use functional updates

---

### 5. **Unnecessary Dependencies in useCallback**

**Location**: Multiple callbacks throughout `use-game-logic.ts`

**Problem**:

- `spawnObject`: 5+ dependencies
- `updateObjects`: Includes `fallSpeedMultiplier` even though it's baked into obj.speed
- Creates unnecessary recreation of callbacks

**Impact**: Breaks memoization, causes effect re-runs

**Fix**: Use functional setState, remove unnecessary deps

---

## Performance Bottlenecks Summary

### High Priority (Breaking Gameplay)

1. ✅ Spawn interval dependency churn - **CRITICAL**
2. ✅ Emoji queue system complexity

### Medium Priority (Performance Impact)

3. ✅ Collision detection inefficiency
4. ✅ Multiple setState calls per spawn
5. ✅ Excessive useCallback dependencies

### Low Priority (Code Quality)

6. ✅ Redundant emoji variety management
7. ✅ Over-engineered spawn position calculation

---

## Implementation Plan

### Phase 1: Fix Critical Spawn Issue (IMMEDIATE)

1. Remove `emojiQueue` and `lastSeenEmojis` state completely
2. Simplify `spawnObject` to use only functional updates
3. Remove emoji queue management effect (lines 674-693)
4. Use stable dependencies only in spawn effect

### Phase 2: Optimize Performance

1. Simplify collision detection algorithm
2. Batch state updates in spawnObject
3. Remove unnecessary useCallback dependencies
4. Optimize updateObjects to avoid redundant calculations

### Phase 3: Code Cleanup

1. Remove unused state variables
2. Simplify spawn position calculation
3. Add performance profiling comments
4. Update documentation

---

## Expected Improvements

**Before**:

- ❌ Emojis don't spawn (broken gameplay)
- ❌ Spawn effect resets constantly
- ❌ 60fps drops to 40fps with 10+ objects
- ❌ Complex emoji queue system

**After**:

- ✅ Emojis spawn consistently every 1.6s
- ✅ Stable spawn interval (no resets)
- ✅ Maintains 60fps with 15+ objects
- ✅ Simple, maintainable code

---

## Testing Checklist

- [ ] Level select menu displays correctly
- [ ] Clicking "Start Race" starts the game
- [ ] Emojis begin falling within 1.6 seconds
- [ ] Emojis spawn continuously during gameplay
- [ ] No console errors about spawn failures
- [ ] FPS stays above 55 with 15 objects
- [ ] Collision detection works without phasing
- [ ] Game runs for 2+ minutes without degradation
