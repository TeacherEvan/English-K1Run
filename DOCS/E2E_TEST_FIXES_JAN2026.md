# E2E Test Fixes - January 2026

## Investigation Summary

**Date**: January 15, 2026  
**Issue**: Playwright E2E tests failing with TimeoutError on Level 4 gameplay  
**Test Report URL**: http://localhost:9323/  
**Status**: ✅ **RESOLVED** - All tests passing

## Problems Identified

### 1. **Level 4 Timeout - Skip Loading Button Race Condition**

**Symptom**: Test timed out (30s) waiting for `[data-testid="back-button"]` to appear after clicking skip-loading-button on Level 4 (Alphabet Challenge).

**Root Cause**:

- Test used `{ force: true }` on skip-loading-button click
- Force clicks bypass Playwright's actionability checks (visibility, stability, event handlers)
- Race condition: Click registered before React Suspense lazy-loaded component fully attached event handler
- `onComplete` callback never fired, leaving loading screen stuck with 4 worms visible

**Evidence**:

```
TimeoutError: page.waitForSelector: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="back-button"]')

Error screenshot shows:
  "Catch the Worms! 🐛"
  "4 worms remaining..."
  Skip Loading Screen button visible but non-functional
```

**Fix**:

1. **Removed `force: true`** from skip-loading-button click
2. **Added explicit wait** for loading screen to be detached from DOM:

   ```typescript
   await page.click('[data-testid="skip-loading-button"]');

   // Wait for loading screen to be removed before proceeding
   await page.waitForSelector('[data-testid="worm-loading-screen"]', {
     state: "detached",
     timeout: 5000,
   });
   ```

### 2. **Element "Not Stable" Errors - Background Animation**

**Symptom**: Settings button and other menu buttons failed with "element is not stable" errors after retrying 20+ times.

**Root Cause**:

- `.app-bg-animated` class applies infinite 20-second zoom animation:

  ```css
  .app-bg-animated {
    animation: gentle-zoom 20s ease-in-out infinite alternate;
  }

  @keyframes gentle-zoom {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }
  ```

- Playwright considers elements unstable when parent containers are animating
- `reducedMotion: 'reduce'` in `playwright.config.ts` didn't work (not properly applied)

**Fix**:

- **Injected CSS** to force-disable all animations in E2E tests:
  ```typescript
  await page.addStyleTag({
    content: `
      .app-bg-animated {
        animation: none !important;
      }
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    `,
  });
  ```

### 3. **Unnecessary Force Clicks**

**Problem**: Test used `{ force: true }` on static UI buttons (settings, new-game, level-select, start, back) which aren't necessary and bypass safety checks.

**Fix**: Removed `force: true` from all static button clicks. Only retained for:

- **Gameplay objects** (falling emojis, worms) which move/animate during gameplay
- Legitimate use case where elements are intentionally dynamic

## Files Modified

### 1. **e2e/specs/visual-screenshots.spec.ts**

- ❌ Removed `force: true` from skip-loading-button, settings-button, new-game-button, level-button, start-button, back-button (6 changes)
- ✅ Added wait for loading screen detachment after skip click
- ✅ Injected CSS to disable background animations
- ✅ Added timeout extension for menu stability (300ms after navigation)

### 2. **playwright.config.ts**

- ✅ Added `reducedMotion: 'reduce'` to global use config (belt-and-suspenders approach)

## Best Practices Applied

Based on [Playwright documentation](https://playwright.dev/):

1. **Avoid `force: true` unless absolutely necessary**
   - Use for moving/animated gameplay elements only
   - Static UI buttons should be naturally clickable

2. **Wait for state transitions, not arbitrary timeouts**
   - ✅ `waitForSelector(..., { state: 'detached' })` instead of just clicking + hoping
   - ✅ Verify loading screens disappear before expecting gameplay elements

3. **Handle animations properly**
   - Disable CSS animations in E2E environment via injected styles
   - Use `prefers-reduced-motion` media queries when possible

4. **Use web-first assertions**
   - `expect(locator).toBeVisible()` auto-retries and waits
   - Better than manual `waitForSelector` + arbitrary delays

## Test Results

**Before Fixes**:

```
102 total tests
101 passed
1 failed (Level 4 timeout)
```

**After Fixes**:

```
102 total tests
102 passed ✅
0 failed
Test duration: 30.7s (chromium), 34.0s (total with welcome screen test)
```

### Specific Level Results:

- ✅ Level 1 (Fruits & Vegetables): back-button appeared in 216ms
- ✅ Level 2 (Counting Fun): back-button appeared in 24ms
- ✅ Level 3 (Shapes & Colors): back-button appeared in 13ms
- ✅ **Level 4 (Alphabet Challenge)**: back-button appeared successfully (was timing out at 30s)
- ✅ Levels 5-9: All passed

## Lessons Learned

1. **`force: true` is a red flag** - Only use for genuinely dynamic elements (moving game objects)
2. **React + Suspense + lazy loading = timing sensitivity** - Wait for components to fully mount
3. **CSS animations break Playwright stability checks** - Disable in E2E environment
4. **Always wait for previous state to fully exit before expecting next state** - Loading screen must be gone before gameplay state appears

## Related Documentation

- **Playwright Best Practices**: [microsoft/playwright - Actionability](https://playwright.dev/docs/actionability)
- **E2E Testing Guide**: `DOCS/E2E_TESTING_IMPROVEMENTS_DEC2025.md`
- **Touch Handling**: `DOCS/MULTI_TOUCH_IMPLEMENTATION.md`

## Prevention

**Going forward**:

1. ❌ Avoid `force: true` in new tests
2. ✅ Use `page.addStyleTag()` to disable animations at start of each test
3. ✅ Wait for state transitions with `state: 'detached'` / `state: 'visible'`
4. ✅ Review Playwright action logs when tests fail - they show exactly why elements aren't stable
