# Emoji Lifecycle Tracker - Issues Diagnosed

## Issues Found from Event Tracker Display

### 🔴 **Issue #1: X Position Changing During Lifecycle**

**Symptom:**

```
🥕 carrot:
  spawned at: (77, -105)
  missed at:  (65, 536)  ← X changed from 77 to 65

🍇 grapes:
  spawned at: (95, -108)
  missed at:  (45, 2189)  ← X changed from 95 to 45
```

**Problem:** X coordinate should remain constant (objects fall straight down), but it's shifting by 10-50 units.

**Root Cause:** The collision detection code in `updateObjects()` modifies the X position AFTER objects are added to `laneBuckets`. The lifecycle tracking captures the original X on spawn, but the modified X on miss.

**Location:** `src/hooks/use-game-logic.ts`, lines 440-458

```typescript
// This code modifies obj.x AFTER spawn tracking
obj.x = Math.max(minX, Math.min(maxX, newX))
```

**Impact:**

- Misleading diagnostic data
- Makes it hard to track object paths
- Suggests objects are moving sideways when they're not

**Proposed Fix:**
Track the spawn X position in a separate field and always use it for lifecycle events, not the collision-adjusted X.

---

### 🔴 **Issue #2: Extremely High Y Values on Miss**

**Symptom:**

```
🍇 grapes: Y = 2,189 (screen height is ~1080px)
🍎 apple: Y = 1,694
🍓 strawberry: Y = 5,336 (!!)
```

**Problem:** Objects are traveling 2-5x beyond screen height before being removed.

**Root Cause:** The removal threshold in `updateObjects()` is:

```typescript
if (newY < screenHeight + 100)  // Keep if Y < ~1180
```

But objects can accumulate multiple update cycles with high Y values before removal check.

**Location:** `src/hooks/use-game-logic.ts`, line 368

**Impact:**

- Wasted CPU cycles tracking off-screen objects
- Confusing Y values in diagnostics
- Potential performance degradation with many objects

**Proposed Fix:**
Tighten the removal threshold or track objects more frequently.

---

### 🔴 **Issue #3: Missing "Spawned" Phase**

**Symptom:**

```
🍎 apple (ID: 1760076951...)
  Total duration: 0ms
  ❌ missed: +0ms (39, 1060)
  [No spawned phase!]
```

**Problem:** Object went straight to "missed" without ever being "spawned".

**Root Cause:** Unknown - possible race condition where object is created and immediately falls off screen in the same update cycle, OR tracking starts after some objects already exist.

**Location:** Spawn tracking in `spawnObject()` vs miss tracking in `updateObjects()`

**Impact:**

- Incomplete lifecycle data
- 0ms duration is impossible and indicates data corruption
- Cannot diagnose spawn timing issues

**Proposed Fix:**
Ensure EVERY object created gets a spawn event tracked immediately, before any updates.

---

### 🟡 **Issue #4: Objects Marked as "Active" Instead of "Completed"**

**Symptom:**

```
🥕 carrot - ⏳ Active  (but has "missed" phase)
🍇 grapes - ⏳ Active  (but has "missed" phase)
```

**Problem:** Objects that have been "missed" should be marked as "✓ Completed" since their lifecycle is over.

**Root Cause:** The `wasCompleted` logic only checks for "tapped" or "removed":

```typescript
wasCompleted: events.some(e => e.phase === 'tapped' || e.phase === 'removed')
```

**Location:** `src/components/EmojiLifecycleDebug.tsx`, line 58

**Status:** ✅ **FIXED**

```typescript
wasCompleted: events.some(e => 
  e.phase === 'tapped' || e.phase === 'removed' || e.phase === 'missed'
)
```

---

### 🟡 **Issue #5: Truncated Data Display**

**Symptom:**

```
{"reason":"fell_off..."}  (truncated)
```

**Problem:** The data field is limited to `max-w-[100px]` which truncates useful debugging info.

**Location:** `src/components/EmojiLifecycleDebug.tsx`, line 239

**Impact:**

- Minor - hard to read full data
- Can expand width or use tooltip

**Proposed Fix:**

```tsx
<span className="text-gray-500 truncate max-w-[150px]" title={...}>
```

---

## Summary of Errors by Severity

### Critical (Affects Data Integrity)

1. ❌ Missing "spawned" phase (0ms duration objects)
2. ❌ X position changes incorrectly tracked

### High (Affects Diagnostic Accuracy)

3. ⚠️ Y values far beyond screen height
4. ⚠️ Objects marked "Active" when completed ✅ **FIXED**

### Low (UX/Display Issues)

5. 📝 Truncated data display

## Recommendations

1. **Immediate**: Fix "wasCompleted" logic ✅ **DONE**
2. **High Priority**: Ensure all objects get spawn tracking
3. **Medium Priority**: Store original spawn position separately from collision-adjusted position
4. **Low Priority**: Tighten removal threshold to avoid excessive Y values
5. **Low Priority**: Increase data display width or add tooltips

## Testing Checklist

After fixes, verify:

- [ ] All tracked objects have "spawned" phase
- [ ] X coordinate stays constant from spawn to miss
- [ ] Y values at miss are close to screen height (~1080-1200px)
- [ ] Missed objects show "✓ Completed" badge ✅
- [ ] Tapped objects show complete lifecycle: spawned → tapped → removed
- [ ] Data fields show complete information

---

**Generated:** October 10, 2025  
**Status:** 1 of 5 issues fixed, 4 remaining
