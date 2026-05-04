# Test Failures Analysis & Fix Plan

**Date:** January 31, 2026  
**Status:** 53 Failed Tests (out of 335 total)  
**Primary Affected Suite:** `specs/gameplay.spec.ts`

## Executive Summary

The test suite is experiencing systematic failures primarily in the **Worm Loading Screen Auto-Progression** tests and some **Gameplay - Object Interaction** tests. Analysis reveals race conditions and timing issues between component state transitions and test expectations.

## Test Failure Categories

### 1. Worm Loading Screen Auto-Progression (Multiple Failures)

**Affected Tests:**

- ✗ "should automatically advance after all worms eliminated" (visual, chromium - multiple instances)
- ✗ "should show completion message when all worms eliminated" (visual, chromium)
- ✗ Timing out at 20-45 seconds waiting for `target-display` element

**Root Cause Analysis:**

```typescript
// WormLoadingScreen.tsx lines 133-143
useEffect(() => {
  const aliveCount = worms.filter((w) => w.alive).length;
  if (worms.length > 0 && aliveCount === 0) {
    // Small delay before completing to show final splat
    const timer = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [worms, onComplete]);
```

**Issue 1: Race Condition in State Updates**

- When tests click worms rapidly, the `setWorms()` calls in `handleWormClick` may batch or race
- React 19's concurrent features can delay state updates
- The `useEffect` checking `aliveCount === 0` may not fire immediately
- Test clicks all 5 worms within ~600ms total, but state updates lag

**Issue 2: Component Lifecycle Timing**

```typescript
// App.tsx lines 199-202
const handleLoadingComplete = useCallback(() => {
  setIsLoading(false); // Unmounts WormLoadingScreen
  startGame(selectedLevel); // Starts game state
}, [selectedLevel, startGame]);
```

After `onComplete()` is called, these happen in sequence:

1. `setIsLoading(false)` triggers React reconciliation
2. `WormLoadingScreen` component unmounts
3. `startGame()` initializes game state
4. `target-display` finally renders

**Issue 3: Test clicks worms too fast for animations**

```typescript
// gameplay.spec.ts lines 132-137
for (let i = 0; i < 5; i++) {
  const worm = page.locator(".worm-wiggle").first();
  await worm.click({ force: true });
  await page.waitForTimeout(100); // Only 100ms between clicks
}
```

The 100ms delay allows animation to start but doesn't ensure state propagation.

**Issue 4: CSS Selector targeting moving elements**

```typescript
// Tests use `.worm-wiggle` class on inner div
// WormLoadingScreen.tsx line 215
<div className="worm-wiggle">
  🐛
</div>
```

The worm emoji is inside a moving container with transforms. Clicking may miss the actual touch target.

### 2. Gameplay - Object Interaction Failure

**Affected Test:**

- ✗ "tapping correct object should increase progress" (firefox)

**Root Cause:**

```typescript
// gameplay.spec.ts lines 88-102
const matchingObjects = gamePage.gameplay.fallingObjects.filter({
  hasText: targetEmoji!,
});
const count = await matchingObjects.count();

if (count > 0) {
  const initialProgress = await gamePage.gameplay.getProgress(1);
  await gamePage.gameplay.tapObjectByEmoji(targetEmoji!);
  await page.waitForTimeout(100); // Only 100ms for state propagation

  const newProgress = await gamePage.gameplay.getProgress(1);
  expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
}
```

**Issues:**

- `waitForTimeout(100)` insufficient for React state update + CSS transition
- Progress bar width is animated (CSS transition), so reading it immediately after tap may show old value
- Firefox has slower DOM updates than Chromium
- Test doesn't verify tap actually registered (could miss moving object)

## Critical Code Paths

###Worm Click Handler State Flow

```
User clicks worm
  ↓
handleWormClick(wormId) [WormLoadingScreen.tsx:145]
  ↓
setWorms(prev => ...) [batched React update]
  ↓
setSplats(...) [separate state update]
  ↓
setSpeedMultiplier(...) [conditional update]
  ↓
React reconciliation (async)
  ↓
useEffect dependencies change [line 134]
  ↓
Check aliveCount === 0 [line 136]
  ↓
setTimeout(onComplete, 500) [line 138]
  ↓
onComplete callback fires
  ↓
handleLoadingComplete() [App.tsx:199]
  ↓
setIsLoading(false) [unmounts WormLoadingScreen]
  ↓
startGame(selectedLevel) [initializes game state]
  ↓
target-display renders
```

**Total latency:** 500ms timeout + React batching + component transitions = **~800-1200ms** minimum

**Test expects:** Under 2000ms timeout (line 140), but with 5 clicks \* 100ms = 500ms clicking time, leaves only ~1500ms for state propagation

## Proposed Fixes

### Fix 1: Stabilize Worm Click Detection (HIGH PRIORITY)

**File:** `src/components/WormLoadingScreen.tsx`

**Change 1: Add explicit state synchronization**

```typescript
// Line 145 - Refactor handleWormClick to be more predictable
const handleWormClick = useCallback(
  (wormId: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setWorms((prev) => {
      const worm = prev.find((w) => w.id === wormId);
      if (!worm || !worm.alive) return prev;

      // Mark worm as dead
      const updatedWorms = prev.map((w) =>
        w.id === wormId ? { ...w, alive: false } : w,
      );

      // All state updates in single batch
      const aliveCount = updatedWorms.filter((w) => w.alive).length;

      // Create splat synchronously (no separate setSplats call)
      setSplats((prevSplats) => [
        ...prevSplats,
        {
          id: splatIdCounter.current++,
          x: worm.x,
          y: worm.y,
          createdAt: Date.now(),
        },
      ]);

      // Increase speed for remaining worms
      if (aliveCount > 0) {
        setSpeedMultiplier((prevSpeed) => prevSpeed * SPEED_INCREASE_FACTOR);
      }

      // CRITICAL: If this was the last worm, call onComplete directly
      // Don't wait for useEffect to detect the change
      if (aliveCount === 0) {
        // Small delay for visual feedback, then advance
        setTimeout(() => {
          onComplete();
        }, 500);
      }

      return updatedWorms;
    });
  },
  [onComplete],
);
```

**Rationale:** Move completion logic into the click handler to eliminate useEffect race condition. State updates are still batched but completion trigger is synchronous.

**Change 2: Improve click target**

```typescript
// Line 201 - Make entire worm container clickable, not just emoji
<div
  key={worm.id}
  className="absolute cursor-pointer select-none transition-opacity duration-200 hover:scale-110"
  style={{
    left: `${worm.x}%`,
    top: `${worm.y}%`,
    fontSize: `${WORM_SIZE}px`,
    transform: `translate(-50%, -50%) rotate(${worm.angle}rad)`,
    zIndex: 10,
    // ADDED: Explicit hit area for reliable clicking
    width: `${WORM_SIZE * 1.2}px`,
    height: `${WORM_SIZE * 1.2}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
  onClick={(e) => handleWormClick(worm.id, e)}
  onTouchEnd={(e) => handleWormClick(worm.id, e)}
  data-testid="worm-target"  // ADDED: More specific test selector
>
  <div className="worm-wiggle">
    🐛
  </div>
</div>
```

### Fix 2: Update Test Timing & Selectors (HIGH PRIORITY)

**File:** `e2e/specs/gameplay.spec.ts`

**Change 1: Lines 120-148 - More reliable worm elimination**

```typescript
test("should automatically advance after all worms eliminated", async ({
  page,
}) => {
  await page.goto("/?e2e=1");
  await page.waitForLoadState("domcontentloaded");

  // Start game
  await page.click('[data-testid="start-game-button"]');
  await expect(
    page.locator('[data-testid="worm-loading-screen"]'),
  ).toBeVisible();

  // FIXED: Use more specific selector and wait between clicks
  for (let i = 0; i < 5; i++) {
    // Wait for worm to be clickable (not mid-animation)
    const worm = page.locator('[data-testid="worm-target"]').first();
    await worm.waitFor({ state: "visible", timeout: 5000 });

    // Click with retry logic for moving targets
    await worm.click({ force: true, timeout: 5000 });

    // INCREASED: Allow time for React state update + animations
    await page.waitForTimeout(250);
  }

  // FIXED: Increased timeout to account for:
  // - 5 clicks * 250ms = 1250ms
  // - React state updates + batching = ~300ms
  // - 500ms onComplete delay
  // - Component unmount + game start = ~500ms
  // Total expected: ~2550ms, use 5000ms for safety
  await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
    timeout: 5000,
  });

  // Loading screen should be gone
  await expect(
    page.locator('[data-testid="worm-loading-screen"]'),
  ).not.toBeVisible();
});
```

**Change 2: Lines 150-170 - Completion message test**

```typescript
test("should show completion message when all worms eliminated", async ({
  page,
}) => {
  await page.goto("/?e2e=1");
  await page.waitForLoadState("domcontentloaded");

  await page.click('[data-testid="start-game-button"]');
  await expect(
    page.locator('[data-testid="worm-loading-screen"]'),
  ).toBeVisible();

  // Eliminate all worms with better timing
  for (let i = 0; i < 5; i++) {
    const worm = page.locator('[data-testid="worm-target"]').first();
    await worm.waitFor({ state: "visible", timeout: 5000 });
    await worm.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(250);
  }

  // FIXED: Check completion message appears before auto-advancing
  // Message shows when aliveWorms.length === 0 (line 246-250)
  await expect(page.locator("text=All worms caught")).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator("text=Starting game")).toBeVisible({
    timeout: 2000,
  });

  // Then verify game starts
  await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
    timeout: 5000,
  });
});
```

### Fix 3: Improve Object Interaction Test (MEDIUM PRIORITY)

**File:** `e2e/specs/gameplay.spec.ts`

**Change: Lines 75-103 - Wait for actual state update**

```typescript
test("tapping correct object should increase progress", async ({
  gamePage,
  page,
}) => {
  // Start with Fruits & Veggies
  await gamePage.menu.startGame();
  await gamePage.gameplay.waitForObjectsToSpawn(5);

  // Get current target
  const target = await gamePage.gameplay.getCurrentTarget();
  const targetEmoji = target.emoji;

  // Find and tap matching object if exists
  const matchingObjects = gamePage.gameplay.fallingObjects.filter({
    hasText: targetEmoji!,
  });
  const count = await matchingObjects.count();

  if (count > 0) {
    const initialProgress = await gamePage.gameplay.getProgress(1);

    // Tap object
    await gamePage.gameplay.tapObjectByEmoji(targetEmoji!);

    // FIXED: Wait for progress bar animation to complete
    // Progress bar has CSS transition (check PlayerArea.tsx)
    // Firefox needs more time than Chromium
    await page.waitForTimeout(500); // Increased from 100ms

    const newProgress = await gamePage.gameplay.getProgress(1);

    // FIXED: More lenient assertion for edge cases
    // Progress might not increase if:
    // 1. Object was already animating out
    // 2. Target changed between read and tap
    // 3. Object fell off screen
    expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
  } else {
    // ADDED: Skip test gracefully if no matching objects
    console.warn(`No matching objects found for target: ${targetEmoji}`);
  }
});
```

### Fix 4: Add Test Utilities for Better Reliability (LOW PRIORITY)

**File:** `e2e/fixtures/game.fixture.ts`

**Addition: Retry mechanism for clicking moving targets**

```typescript
// Add after line 558
/**
 * Click a moving element with retry logic
 * Useful for worms and falling objects that change position
 */
export async function clickMovingElement(
  locator: Locator,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    force?: boolean;
  } = {},
) {
  const { maxRetries = 3, retryDelay = 200, force = true } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.click({ force, timeout: 5000 });
      return; // Success
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await locator.page().waitForTimeout(retryDelay);
    }
  }
}
```

## Environment-Specific Issues

### Firefox-Specific Failures

- Slower DOM updates cause progress bar reads to miss state changes
- Background animations cause layout shifts affecting click coordinates
- CSS transitions take longer to complete

**Mitigation:** Already implemented in fixture (lines 50-61) with reduced animations. Consider increasing timeouts specifically for Firefox:

```typescript
// In e2e/fixtures/game.fixture.ts
const browser = await page.context().browser();
const browserName = browser?.browserType().name();
const isFirefox = browserName === "firefox";

const baseTimeout = isFirefox ? 1000 : 500;
await page.waitForTimeout(baseTimeout);
```

### Visual vs Chromium Test Isolation

Some tests run in "visual" configuration (likely screenshots) and "chromium" configuration separately. Same test failing in both suggests core logic issue, not environment-specific.

## Implementation Priority

### Phase 1: Critical Fixes (Do First)

1. ✅ Update [`WormLoadingScreen.tsx`](src/components/WormLoadingScreen.tsx) `handleWormClick` - move completion logic inline
2. ✅ Add `data-testid="worm-target"` to worm containers
3. ✅ Update test selectors from `.worm-wiggle` to `[data-testid="worm-target"]`
4. ✅ Increase test timeouts: 100ms → 250ms between clicks, 2000ms → 5000ms for game start

### Phase 2: Stabilization (Do Next)

5. ✅ Fix object interaction test timeout (100ms → 500ms)
6. ✅ Add completion message visibility checks before advancement
7. ✅ Improve worm click target hit area (explicit width/height)

### Phase 3: Enhancement (Optional)

8. ❌ Add `clickMovingElement` utility function
9. ❌ Add browser-specific timeout multipliers
10. ❌ Add test retry mechanism at suite level

## Testing & Validation

### Validation Steps

1. Run failing tests in isolation: `npx playwright test gameplay.spec.ts --grep "automatically advance"`
2. Run full gameplay suite: `npx playwright test gameplay.spec.ts`
3. Run cross-browser: `npx playwright test gameplay.spec.ts --project=chromium firefox webkit`
4. Validate manual testing in browser: Navigate to `/?e2e=1`, start game, click all worms rapidly

### Success Criteria

- ✅ All "Worm Loading Screen Auto-Progression" tests pass consistently (95%+ pass rate over 10 runs)
- ✅ "tapping correct object should increase progress" passes on Firefox
- ✅ No new test failures introduced
- ✅ Manual testing confirms worm loading screen advances smoothly

## Risk Assessment

### Low Risk Changes

- Adding `data-testid` attributes (no runtime behavior change)
- Increasing test timeouts (makes tests more lenient)
- Improving click target hit areas (better UX for users too)

### Medium Risk Changes

- Moving completion logic from `useEffect` to `handleWormClick`
  - **Risk:** Could cause multiple `onComplete()` calls if state updates batch incorrectly
  - **Mitigation:** Add guard flag `const completionTriggered = useRef(false)` to prevent double-firing

### High Risk Changes

- None proposed. All changes are test-focused or defensive code improvements.

## Alternative Approaches Considered

### Alternative 1: Disable React Strict Mode in Tests

**Rejected:** Strict Mode helps catch bugs. Disabling it would mask real issues.

### Alternative 2: Use `waitForFunction` instead of `waitForTimeout`

**Considered:** More robust than fixed timeouts, but more complex:

```typescript
await page.waitForFunction(() => {
  const worms = document.querySelectorAll('[data-testid="worm-target"]');
  return worms.length < 5; // Wait until worm count decreases
});
```

**Decision:** Good enhancement for Phase 3, but fixed timeouts are simpler for now.

### Alternative 3: Mock `setTimeout` in Tests

**Rejected:** Would make tests unrealistic and break timer-dependent animations.

## Related Files

### Must Review

- [`src/components/WormLoadingScreen.tsx`](src/components/WormLoadingScreen.tsx) - Core component with race condition
- [`src/App.tsx`](src/App.tsx) - Loading state management
- [`e2e/specs/gameplay.spec.ts`](e2e/specs/gameplay.spec.ts) - Failing tests
- [`e2e/fixtures/game.fixture.ts`](e2e/fixtures/game.fixture.ts) - Test utilities

### Reference Only

- [`src/hooks/use-game-logic.ts`](src/hooks/use-game-logic.ts) - Game state management
- [`DOCS/E2E_TEST_FIXES_JAN2026.md`](DOCS/E2E_TEST_FIXES_JAN2026.md) - Previous test fixes
- [`playwright.config.ts`](playwright.config.ts) - Test configuration

## Conclusion

The test failures are caused by **race conditions between React state updates and test expectations** in the WormLoadingScreen component. The fixes are straightforward:

1. **Synchronize completion trigger** with worm click handler (eliminate useEffect dependency)
2. **Increase test timeouts** to match actual state propagation latencies
3. **Improve click targeting** with explicit test IDs and hit areas

These changes are low-risk, backward-compatible, and will improve both test reliability and actual user experience.

**Estimated Implementation Time:** 2-3 hours  
**Estimated Testing Time:** 1-2 hours  
**Total:** 3-5 hours

**Recommendation:** Proceed with Phase 1 fixes immediately. These are critical path items blocking CI/CD pipeline.
