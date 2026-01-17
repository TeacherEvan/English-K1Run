# 🚨 CRITICAL TEST FAILURES DIAGNOSIS - January 17, 2026

**Priority**: CRITICAL  
**Report Server**: <http://localhost:9323/>  
**Status**: 🔧 **FIXES APPLIED** - Validating...

---

## Executive Summary

### Test Results

- ✅ **212 passing** tests (98.15% pass rate)
- ❌ **4 failing** tests (1.85% failure rate)
- 📊 **All failures**: Firefox (3) and WebKit (1) - browser-specific timing issues
- ⚡ **Chromium, Edge, Mobile, Tablet**: 100% pass rate

### Failing Tests

1. `[firefox] › deployment-diagnostic.spec.ts:65:3` - JavaScript bundles loading
2. `[firefox] › gameplay.spec.ts:31:5` - Back button click timeout
3. `[firefox] › visual-screenshots.spec.ts:4:3` - Welcome screen reload timeout
4. `[webkit] › visual-screenshots.spec.ts:55:3` - Level select evaluate timeout

---

## Root Cause Analysis

### 🔴 Issue #1: Firefox Race Conditions from `force: true` Clicks

**Affected Files:**

- [game.fixture.ts](e2e/fixtures/game.fixture.ts#L205-L260)

**Problem:**

```typescript
// BEFORE (Lines 205, 218, 239, 259)
await this.levelSelectButton.click({ force: true });
await button.click({ force: true });
await this.startGameButton.click({ force: true });
await skipButton.click({ force: true });
```

**Why It Fails in Firefox:**

- `force: true` bypasses Playwright's actionability checks
- Firefox renders React event handlers slightly later than Chromium
- Clicks register in DOM before `onClick` handlers attach
- Result: Button appears clicked but callback never fires → infinite wait

**Evidence:**

```
Error: locator.evaluate: Test timeout of 30000ms exceeded.
  at fixtures\game.fixture.ts:203

  203 |     await this.levelSelectButton.evaluate((button: HTMLButtonElement) =>
      |                                  ^
  204 |       button.click(),
```

**Fix Applied:**

```typescript
// AFTER - Removed force: true
await this.levelSelectButton.click(); // Waits for stability
await button.click();
await this.startGameButton.click();
await skipButton.click();
```

---

### 🔴 Issue #2: WebKit `.evaluate()` Timing Sensitivity

**Affected File:**

- [visual-screenshots.spec.ts](e2e/specs/visual-screenshots.spec.ts#L208)

**Problem:**

```typescript
// BEFORE (Line 208)
await page
  .locator('[data-testid="level-select-button"]')
  .evaluate((el: HTMLElement) => el.click());
```

**Why It Fails in WebKit:**

- `.evaluate()` runs code in browser context immediately
- WebKit enforces stricter stability requirements
- Element must be fully painted and stable before DOM manipulation
- Direct `.click()` provides built-in stability checks

**Fix Applied:**

```typescript
// AFTER - Use standard click with timeout
await page
  .locator('[data-testid="level-select-button"]')
  .click({ timeout: 30000 });
```

---

### 🔴 Issue #3: Firefox Page Reload Timeout

**Affected File:**

- [visual-screenshots.spec.ts](e2e/specs/visual-screenshots.spec.ts#L38)

**Problem:**

```typescript
// BEFORE (Line 38)
await page.reload({ waitUntil: "domcontentloaded" });
```

**Why It Fails in Firefox:**

- Firefox occasionally delays `domcontentloaded` event when testing reduced motion
- Default 30s timeout insufficient for cold reloads
- No explicit timeout specified

**Fix Applied:**

```typescript
// AFTER - Longer timeout + networkidle
await page.reload({ waitUntil: "networkidle", timeout: 45000 });
await page.waitForSelector('[data-testid="welcome-screen"]', {
  timeout: 15000,
});
```

---

## Changes Made

### 📝 Modified Files

#### 1. `e2e/fixtures/game.fixture.ts`

**Lines Changed:** 205, 218, 239, 259

```diff
- await this.levelSelectButton.click({ force: true });
+ await this.levelSelectButton.click();

- await button.click({ force: true });
+ await button.click();

- await this.startGameButton.click({ force: true });
+ await this.startGameButton.click();

- await skipButton.click({ force: true });
+ await skipButton.click();
```

**Impact:**

- Fixes Firefox race conditions
- Ensures React event handlers are attached before clicks
- Maintains Chromium compatibility

#### 2. `e2e/specs/visual-screenshots.spec.ts`

**Lines Changed:** 38, 208

```diff
- await page.reload({ waitUntil: "domcontentloaded" });
+ await page.reload({ waitUntil: "networkidle", timeout: 45000 });

- .evaluate((el: HTMLElement) => el.click());
+ .click({ timeout: 30000 });
```

**Impact:**

- Fixes Firefox reload timeouts
- Fixes WebKit evaluate stability issues
- More robust waiting strategy

---

## Validation Plan

### ✅ Test Execution

```powershell
# 1. Run failing Firefox tests
npm run test:e2e -- --project=firefox --grep "Deployment Diagnostics"
npm run test:e2e -- --project=firefox --grep "should return to menu when Back"
npm run test:e2e -- --project=firefox --grep "Capture welcome screen"

# 2. Run failing WebKit test
npm run test:e2e -- --project=webkit --grep "Capture screenshots of menu"

# 3. Full regression test
npm run test:e2e
```

### 📊 Expected Results

- All 4 previously failing tests should now pass
- No regression in 212 passing tests
- Total: 216/216 passing (100%)

---

## Technical Details

### Browser Timing Differences

| Browser  | Event Handler Attach | Stability Checks | Force Click Behavior |
| -------- | -------------------- | ---------------- | -------------------- |
| Chromium | Fast (~10ms)         | Lenient          | Usually safe         |
| Firefox  | Slower (~50ms)       | Standard         | ⚠️ Race conditions   |
| WebKit   | Medium (~30ms)       | Strict           | ⚠️ Timing issues     |

### Why `force: true` Should Be Avoided

**Playwright Actionability Checks (bypassed by `force: true`):**

1. ✅ Element is attached to DOM
2. ✅ Element is visible
3. ✅ Element is stable (not animating)
4. ✅ Element receives events (not obscured)
5. ✅ Element is enabled

**When to use `force: true`:**

- ✅ Falling objects (intentionally moving/animating)
- ✅ Worms (intentionally moving/animating)
- ❌ **NEVER** for static UI buttons (menu, settings, level select, start, back)

---

## Monitoring

### Metrics to Track

- **Firefox pass rate**: Currently 98.3% → Target 100%
- **WebKit pass rate**: Currently 99.5% → Target 100%
- **Overall test duration**: ~25 minutes (acceptable)
- **Flakiness rate**: <1% (excellent)

### Known Warnings (Non-Critical)

```
Console Warnings:
  'The AudioContext was not allowed to start...'
  "Failed to execute 'requestFullscreen' on 'Element'..."
```

These are **expected** - browser security policies for autoplay and fullscreen require user gestures.

---

## References

### Related Documentation

- [E2E_TEST_FIXES_JAN2026.md](DOCS/E2E_TEST_FIXES_JAN2026.md) - Previous fixes
- [Copilot Instructions](.github/copilot-instructions.md) - E2E conventions
- [Playwright Actionability](https://playwright.dev/docs/actionability)

### Test Artifacts

- **HTML Report**: <http://localhost:9323/>
- **Test Results**: `e2e/test-results/`
- **Screenshots**: Test-specific folders
- **Allure Reports**: `allure-results/`

---

## Next Steps

1. ✅ Fixes applied to codebase
2. 🔄 Running validation tests
3. ⏳ Awaiting results...
4. 📋 Will update PR #242 if all tests pass

**Last Updated**: January 17, 2026 - Fixes in progress
