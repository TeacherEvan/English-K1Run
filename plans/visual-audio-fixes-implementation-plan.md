# Visual and Audio Fixes Implementation Plan

**Date**: February 2026  
**Status**: Ready for Implementation  
**Priority**: Critical (Visual) / High (Audio)

---

## Executive Summary

This plan addresses two distinct issues identified through diagnostic analysis:

1. **Visual Rendering - Target Occlusion**: CSS stacking context conflicts prevent proper z-index layering, causing game objects to render behind obstructing layers.

2. **Audio System - Missing Sound Effects**: Tap audio feedback is intentionally disabled, and the `byName()` method is missing from sound manager exports.

---

## Part 1: Visual Fix Implementation

### 1.1 Root Cause Analysis

#### Issue 1.1.A: `.app > *` Stacking Context Trap (CRITICAL)

**File**: [`src/styles/backgrounds/real-utilities.css`](src/styles/backgrounds/real-utilities.css:2-5)

```css
.app > * {
  position: relative;
  z-index: 10;
}
```

**Problem**: This rule creates a stacking context on ALL direct children of `.app`, forcing them to z-index 10. Any z-index values set inside these children become relative to this context, not the root.

**Affected Components**:
| Component | Intended Z-Index | Trapped At |
|-----------|------------------|------------|
| FallingObject | 20 (GAMEPLAY_OBJECTS) | 10 |
| Worm | 30 (GAMEPLAY_HAZARDS) | 10 |
| FairyTransformation | 40 (GAMEPLAY_EFFECTS) | 10 |

#### Issue 1.1.B: `.game-area::before` Stacking Context (HIGH)

**File**: [`src/styles/game-area.css`](src/styles/game-area.css:13-38)

```css
.game-area::before {
  content: "";
  position: absolute;
  /* ... */
  z-index: 1;
}
```

**Problem**: The pseudo-element with `z-index: 1` creates a stacking context on `.game-area` because it has `position: relative` (inherited from `.game-area > *`).

**Note**: The `.game-area > *` rule has already been fixed (z-index removed), but the `::before` pseudo-element still creates issues.

### 1.2 Rendering Hierarchy Diagram

```
div.app (root container)
│
├── div (first child, z-index: 10 from .app > *)
│   │
│   └── AppGameplayScene
│       │
│       ├── div (z-index: 10 - GAMEPLAY_BACKGROUND)
│       │   │
│       │   └── PlayerArea > Card.game-area
│       │       │
│       │       ├── div.game-area::before (z-index: 1) ← Creates stacking context
│       │       │
│       │       └── div[data-testid="game-area"]
│       │           ├── FallingObject (z-index: 20) ← EFFECTIVELY 10!
│       │           └── Worm (z-index: 30) ← EFFECTIVELY 10!
│       │
│       └── div (z-index: 80 - HUD_PRIMARY) ← Renders ABOVE game objects!
│           └── pointer-events: none (but children have pointer-events: auto)
│
├── FireworksDisplay (conditional, z-index: 10)
└── EmojiRotationMonitor (dev only, z-index: 10)
```

### 1.3 Implementation Options

#### Option A: Remove Z-Index from `.app > *` (RECOMMENDED)

**Risk Level**: Low  
**Effort**: Minimal  
**Impact**: Fixes root cause directly

**Changes Required**:

**File**: [`src/styles/backgrounds/real-utilities.css`](src/styles/backgrounds/real-utilities.css:2-5)

```css
/* BEFORE */
.app > * {
  position: relative;
  z-index: 10;
}

/* AFTER */
.app > * {
  position: relative;
  /* z-index removed - allows UI_LAYER_MATRIX values to work correctly */
  /* See: plans/ui-layer-forensic-audit-feb2026.md */
}
```

**Rationale**:

- Removes the stacking context trap
- Allows inline z-index values from `UI_LAYER_MATRIX` to work as intended
- Minimal change with maximum impact

#### Option B: Use `isolation: isolate` (ALTERNATIVE)

**Risk Level**: Medium  
**Effort**: Low  
**Impact**: Creates proper stacking context isolation

**Changes Required**:

**File**: [`src/styles/backgrounds/real-utilities.css`](src/styles/backgrounds/real-utilities.css:2-5)

```css
/* BEFORE */
.app > * {
  position: relative;
  z-index: 10;
}

/* AFTER */
.app {
  isolation: isolate;
}

.app > * {
  position: relative;
  /* z-index removed - isolation on parent handles stacking */
}
```

**File**: [`src/styles/game-area.css`](src/styles/game-area.css:37)

```css
/* BEFORE */
.game-area::before {
  /* ... */
  z-index: 1;
}

/* AFTER */
.game-area::before {
  /* ... */
  z-index: -1; /* Behind all children */
}
```

**Rationale**:

- `isolation: isolate` creates a new stacking context on `.app`
- Children can use z-index values relative to this context
- Requires changing `::before` z-index to negative

#### Option C: Explicit Z-Index Hierarchy (NOT RECOMMENDED)

**Risk Level**: High  
**Effort**: High  
**Impact**: Duplicates constants, maintenance burden

This approach would add explicit CSS classes for each z-index level, duplicating the `UI_LAYER_MATRIX` constants. Not recommended due to maintenance overhead.

### 1.4 Recommended Implementation: Option A

#### Step 1: Modify `real-utilities.css`

**File**: `src/styles/backgrounds/real-utilities.css`

**Lines 2-5**:

```css
/* BEFORE */
.app > * {
  position: relative;
  z-index: 10;
}

/* AFTER */
/* 
 * CRITICAL: Do NOT add z-index here!
 * This rule must NOT create a stacking context, otherwise inline z-index
 * values from UI_LAYER_MATRIX (FallingObject, Worm, etc.) will be trapped
 * and ineffective. See: plans/ui-layer-forensic-audit-feb2026.md
 */
.app > * {
  position: relative;
  /* z-index removed - allows UI_LAYER_MATRIX values to work correctly */
}
```

#### Step 2: Verify `game-area.css` (Already Fixed)

**File**: `src/styles/game-area.css`

The `.game-area > *` rule already has z-index removed (lines 46-49). Verify this is correct:

```css
/* 
 * CRITICAL: Do NOT add z-index here!
 * This rule must NOT create a stacking context, otherwise inline z-index
 * values from UI_LAYER_MATRIX (FallingObject, Worm, etc.) will be trapped
 * and ineffective. See: plans/ui-layer-forensic-audit-feb2026.md
 */
.game-area > * {
  position: relative;
  /* z-index removed to allow UI_LAYER_MATRIX values to work correctly */
}
```

#### Step 3: Consider Removing `::before` Z-Index (Optional)

**File**: `src/styles/game-area.css`

**Line 37**:

```css
/* BEFORE */
.game-area::before {
  /* ... */
  z-index: 1;
}

/* AFTER (optional - only if issues persist) */
.game-area::before {
  /* ... */
  z-index: 0; /* or remove entirely */
}
```

**Note**: This may not be necessary if Option A Step 1 fixes the issue. Test first.

### 1.5 Testing Verification Steps

#### Manual Testing

1. **Start the game** and verify:
   - [ ] Falling objects are visible and tappable
   - [ ] Worms are visible and tappable
   - [ ] Fairy transformations render correctly
   - [ ] HUD elements (Back button, Target Display) don't block game objects

2. **Visual layering test**:
   - [ ] Background renders behind objects
   - [ ] Objects render above background effects
   - [ ] Effects (fairy transformation) render above objects

3. **Touch interaction test**:
   - [ ] Tap on falling object registers correctly
   - [ ] Tap on worm registers correctly
   - [ ] HUD elements with `pointer-events: auto` still work

#### E2E Testing

Add test to `e2e/specs/gameplay.spec.ts`:

```typescript
test("game objects are interactive above HUD layers", async ({ page }) => {
  // Navigate to game
  await page.goto("/?e2e=1");
  await page.waitForLoadState("domcontentloaded");

  // Start game
  await page.locator("[data-testid='start-button']").click();
  await page.waitForTimeout(2000);

  // Wait for falling object
  const fallingObject = page.locator("[data-testid='falling-object']").first();
  await fallingObject.waitFor({ state: "visible", timeout: 5000 });

  // Verify object is visible and tappable
  await expect(fallingObject).toBeVisible();

  // Get initial progress
  const progressBar = page.locator("[data-testid='progress-bar']");
  const initialProgress = await progressBar.getAttribute("data-progress");

  // Tap the correct target
  const targetEmoji = await page
    .locator("[data-testid='target-display']")
    .getAttribute("data-target");
  const correctObject = page
    .locator(`[data-testid='falling-object'][data-emoji="${targetEmoji}"]`)
    .first();

  if ((await correctObject.count()) > 0) {
    await correctObject.click();
    await page.waitForTimeout(500);

    // Verify progress increased
    const newProgress = await progressBar.getAttribute("data-progress");
    expect(parseInt(newProgress || "0")).toBeGreaterThan(
      parseInt(initialProgress || "0"),
    );
  }
});
```

#### Visual Regression Testing

Add test to `e2e/specs/visual-ui-check.spec.ts`:

```typescript
test("z-index layering is correct", async ({ page }) => {
  await page.goto("/?e2e=1");
  await page.waitForLoadState("domcontentloaded");

  // Start game
  await page.locator("[data-testid='start-button']").click();
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: "test-results/z-index-layering.png" });

  // Verify no occlusion warnings in console
  const consoleMessages: string[] = [];
  page.on("console", (msg) => consoleMessages.push(msg.text()));

  // Check for any rendering issues
  await page.waitForTimeout(1000);
  expect(
    consoleMessages.filter(
      (m) => m.includes("z-index") || m.includes("stacking"),
    ),
  ).toHaveLength(0);
});
```

---

## Part 2: Audio Fix Implementation

### 2.1 Root Cause Analysis

#### Issue 2.1.A: Disabled Tap Audio Feedback

**File**: [`src/hooks/game-logic/tap-audio-effects.ts`](src/hooks/game-logic/tap-audio-effects.ts:1-7)

```typescript
export const playTapAudioFeedback = (_isCorrect: boolean): void => {
  // Intentionally silent: gameplay audio is restricted to target instruction
  // announcements only.
};
```

**Problem**: Function is intentionally disabled, providing no audio feedback for correct/incorrect taps.

#### Issue 2.1.B: Missing `byName()` Method

**File**: [`src/lib/sound-manager-exports.ts`](src/lib/sound-manager-exports.ts:7-15)

```typescript
export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    /* ... */
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),
};
```

**Problem**: No `byName()` method exists to play arbitrary sound files by name.

### 2.2 Audio File Verification

**Verified Files Exist**:

- ✅ `public/sounds/success.wav` - For correct tap feedback
- ✅ `public/sounds/wrong.wav` - For incorrect tap feedback
- ✅ `public/sounds/tap.wav` - Alternative tap sound
- ✅ `public/sounds/explosion.wav` - Already used for target miss

### 2.3 Implementation Steps

#### Step 1: Add `byName()` Method to Sound Manager Exports

**File**: `src/lib/sound-manager-exports.ts`

**Lines 7-15**:

```typescript
/* BEFORE */
export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),
};

/* AFTER */
export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),

  /**
   * Play a sound effect by name.
   * Looks for files in /sounds/{name}.wav
   * @param name - Sound file name without extension
   * @param playbackRate - Optional playback rate (default 0.9)
   */
  byName: async (name: string, playbackRate = 0.9) =>
    soundManager.playSound(name, playbackRate),
};
```

#### Step 2: Implement `playTapAudioFeedback` Function

**File**: `src/hooks/game-logic/tap-audio-effects.ts`

**Lines 1-7**:

```typescript
/* BEFORE */
/**
 * Plays audio feedback for object taps.
 */
export const playTapAudioFeedback = (_isCorrect: boolean): void => {
  // Intentionally silent: gameplay audio is restricted to target instruction
  // announcements only.
};

/* AFTER */
import { playSoundEffect } from "../../lib/sound-manager-exports";

/**
 * Plays audio feedback for object taps.
 * @param isCorrect - Whether the tap was on the correct target
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  const soundName = isCorrect ? "success" : "wrong";
  void playSoundEffect.byName(soundName, isCorrect ? 1.0 : 0.8);
};
```

#### Step 3: Add User Preference Support (Optional Enhancement)

**File**: `src/context/settings-context.tsx` (or equivalent)

Add a setting to enable/disable tap sounds:

```typescript
interface Settings {
  // ... existing settings
  tapSoundsEnabled: boolean;
}

// Default value
const defaultSettings: Settings = {
  // ... existing defaults
  tapSoundsEnabled: true,
};
```

**File**: `src/hooks/game-logic/tap-audio-effects.ts`

```typescript
import { playSoundEffect } from "../../lib/sound-manager-exports";
import { useSettings } from "../../context/settings-context";

/**
 * Plays audio feedback for object taps.
 * @param isCorrect - Whether the tap was on the correct target
 * @param enabled - Whether tap sounds are enabled (from user preferences)
 */
export const playTapAudioFeedback = (
  isCorrect: boolean,
  enabled = true,
): void => {
  if (!enabled) return;

  const soundName = isCorrect ? "success" : "wrong";
  void playSoundEffect.byName(soundName, isCorrect ? 1.0 : 0.8);
};

/**
 * Hook to get tap audio feedback function with settings context.
 */
export const useTapAudioFeedback = () => {
  const { tapSoundsEnabled } = useSettings();

  return (isCorrect: boolean) =>
    playTapAudioFeedback(isCorrect, tapSoundsEnabled);
};
```

### 2.4 Integration Points

The `playTapAudioFeedback` function should be called from:

1. **`src/hooks/use-game-logic-interactions.ts`** - In the `handleObjectTap` function
2. **`src/hooks/game-logic/tap-handler.ts`** (if exists) - In tap handling logic

**Example Integration**:

```typescript
// In use-game-logic-interactions.ts
import { playTapAudioFeedback } from "./tap-audio-effects";

// Inside handleObjectTap function:
const handleObjectTap = (objectId: string, playerSide: PlayerSide) => {
  // ... existing logic

  if (isCorrect) {
    playTapAudioFeedback(true); // Play success sound
    // ... success handling
  } else {
    playTapAudioFeedback(false); // Play wrong sound
    // ... failure handling
  }
};
```

### 2.5 Testing Verification Steps

#### Manual Testing

1. **Start the game** and verify:
   - [ ] Correct tap plays "success.wav"
   - [ ] Incorrect tap plays "wrong.wav"
   - [ ] Sounds play at appropriate volume
   - [ ] No sound overlap issues

2. **Audio settings test** (if preference implemented):
   - [ ] Disabling tap sounds mutes feedback
   - [ ] Enabling tap sounds restores feedback

#### E2E Testing

Add test to `e2e/specs/audio-overlap.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Tap Audio Feedback", () => {
  test("correct tap plays success sound", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    // Start game
    await page.locator("[data-testid='start-button']").click();
    await page.waitForTimeout(2000);

    // Listen for audio requests
    const audioRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/sounds/")) {
        audioRequests.push(request.url());
      }
    });

    // Find and tap correct target
    const targetEmoji = await page
      .locator("[data-testid='target-display']")
      .getAttribute("data-target");
    const correctObject = page
      .locator(`[data-testid='falling-object'][data-emoji="${targetEmoji}"]`)
      .first();

    if ((await correctObject.count()) > 0) {
      await correctObject.click();
      await page.waitForTimeout(500);

      // Verify success sound was requested
      expect(audioRequests.some((url) => url.includes("success"))).toBeTruthy();
    }
  });

  test("incorrect tap plays wrong sound", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    // Start game
    await page.locator("[data-testid='start-button']").click();
    await page.waitForTimeout(2000);

    // Listen for audio requests
    const audioRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/sounds/")) {
        audioRequests.push(request.url());
      }
    });

    // Find and tap incorrect target
    const targetEmoji = await page
      .locator("[data-testid='target-display']")
      .getAttribute("data-target");
    const allObjects = page.locator("[data-testid='falling-object']");
    const count = await allObjects.count();

    for (let i = 0; i < count; i++) {
      const emoji = await allObjects.nth(i).getAttribute("data-emoji");
      if (emoji !== targetEmoji) {
        await allObjects.nth(i).click();
        await page.waitForTimeout(500);

        // Verify wrong sound was requested
        expect(audioRequests.some((url) => url.includes("wrong"))).toBeTruthy();
        break;
      }
    }
  });
});
```

---

## Part 3: Code Change Specifications

### 3.1 Summary of All Changes

| File                                        | Change Type | Lines     | Priority |
| ------------------------------------------- | ----------- | --------- | -------- |
| `src/styles/backgrounds/real-utilities.css` | Modify      | 2-5       | Critical |
| `src/styles/game-area.css`                  | Verify      | 37, 46-49 | High     |
| `src/lib/sound-manager-exports.ts`          | Add method  | 7-15      | High     |
| `src/hooks/game-logic/tap-audio-effects.ts` | Rewrite     | 1-7       | High     |
| `src/hooks/use-game-logic-interactions.ts`  | Integrate   | Various   | Medium   |

### 3.2 Detailed Change Specifications

#### Change 1: `src/styles/backgrounds/real-utilities.css`

**Location**: Lines 2-5  
**Type**: Modify  
**Priority**: Critical

```css
/* CURRENT CODE (lines 2-5) */
.app > * {
  position: relative;
  z-index: 10;
}

/* NEW CODE */
/* 
 * CRITICAL: Do NOT add z-index here!
 * This rule must NOT create a stacking context, otherwise inline z-index
 * values from UI_LAYER_MATRIX (FallingObject, Worm, etc.) will be trapped
 * and ineffective. See: plans/ui-layer-forensic-audit-feb2026.md
 */
.app > * {
  position: relative;
  /* z-index removed - allows UI_LAYER_MATRIX values to work correctly */
}
```

#### Change 2: `src/lib/sound-manager-exports.ts`

**Location**: Lines 7-15  
**Type**: Add method  
**Priority**: High

```typescript
// CURRENT CODE (lines 7-15)
export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),
};

// NEW CODE (add after targetMiss)
export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),

  /**
   * Play a sound effect by name.
   * Looks for files in /sounds/{name}.wav
   * @param name - Sound file name without extension
   * @param playbackRate - Optional playback rate (default 0.9)
   */
  byName: async (name: string, playbackRate = 0.9) =>
    soundManager.playSound(name, playbackRate),
};
```

#### Change 3: `src/hooks/game-logic/tap-audio-effects.ts`

**Location**: Lines 1-7  
**Type**: Rewrite  
**Priority**: High

```typescript
// CURRENT CODE (entire file)
/**
 * Plays audio feedback for object taps.
 */
export const playTapAudioFeedback = (_isCorrect: boolean): void => {
  // Intentionally silent: gameplay audio is restricted to target instruction
  // announcements only.
};

// NEW CODE (entire file)
import { playSoundEffect } from "../../lib/sound-manager-exports";

/**
 * Plays audio feedback for object taps.
 * @param isCorrect - Whether the tap was on the correct target
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  const soundName = isCorrect ? "success" : "wrong";
  void playSoundEffect.byName(soundName, isCorrect ? 1.0 : 0.8);
};
```

---

## Part 4: Rollback Plan

### 4.1 Visual Fix Rollback

If visual issues arise after implementing the z-index fix:

#### Immediate Rollback

**File**: `src/styles/backgrounds/real-utilities.css`

```css
/* ROLLBACK CODE */
.app > * {
  position: relative;
  z-index: 10;
}
```

#### Fallback Behavior

- Game objects may become occluded by HUD elements
- Touch interaction may be blocked
- Visual layering will be incorrect

#### Alternative Fix

If removing z-index causes other issues, use `isolation: isolate` approach:

```css
.app {
  isolation: isolate;
}

.app > * {
  position: relative;
}
```

### 4.2 Audio Fix Rollback

If audio issues arise after implementing tap sounds:

#### Immediate Rollback

**File**: `src/hooks/game-logic/tap-audio-effects.ts`

```typescript
/* ROLLBACK CODE */
export const playTapAudioFeedback = (_isCorrect: boolean): void => {
  // Intentionally silent: gameplay audio is restricted to target instruction
  // announcements only.
};
```

#### Fallback Behavior

- No audio feedback for taps
- Only target instruction announcements play
- Game remains playable without tap sounds

#### Partial Rollback

If specific sounds cause issues, modify the sound names:

```typescript
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  // Use alternative sounds if success/wrong cause issues
  const soundName = isCorrect ? "tap" : "explosion";
  void playSoundEffect.byName(soundName, 0.9);
};
```

---

## Part 5: Implementation Checklist

### Pre-Implementation

- [ ] Create backup branch from `main`
- [ ] Run existing test suite: `npm run test:run`
- [ ] Build project: `npm run build`
- [ ] Document current behavior with screenshots

### Visual Fix Implementation

- [ ] Modify `src/styles/backgrounds/real-utilities.css`
- [ ] Verify `src/styles/game-area.css` is correct
- [ ] Test in browser (Chrome, Firefox, Safari)
- [ ] Test on tablet device
- [ ] Run E2E tests: `npm run test:e2e`

### Audio Fix Implementation

- [ ] Add `byName()` method to `src/lib/sound-manager-exports.ts`
- [ ] Rewrite `src/hooks/game-logic/tap-audio-effects.ts`
- [ ] Integrate with `use-game-logic-interactions.ts`
- [ ] Test audio playback in browser
- [ ] Run E2E tests: `npm run test:e2e`

### Post-Implementation

- [ ] Run full test suite: `npm run verify`
- [ ] Manual QA on multiple devices
- [ ] Update documentation if needed
- [ ] Create PR with detailed description

---

## Appendix A: UI_LAYER_MATRIX Reference

```typescript
// src/lib/constants/ui-layer-matrix.ts
export const UI_LAYER_MATRIX = {
  GAMEPLAY_BACKGROUND: 10, // AppGameplayScene container
  GAMEPLAY_OBJECTS: 20, // FallingObject
  GAMEPLAY_HAZARDS: 30, // Worm
  GAMEPLAY_EFFECTS: 40, // FairyTransformation
  GAMEPLAY_OVERLAY: 60, // Victory overlay
  HUD_PRIMARY: 80, // Back button, Target Display
  HUD_SECONDARY: 90, // Secondary HUD elements
  HUD_CRITICAL: 110, // TargetAnnouncementOverlay
  CELEBRATION_OVERLAY: 120, // FireworksDisplay
  MENU_OVERLAY: 130, // AppMenuOverlay
  STARTUP_LOADING_OVERLAY: 140,
  WELCOME_OVERLAY: 150,
  DEBUG_OVERLAY: 160,
} as const;
```

---

## Appendix B: Audio Files Reference

| Sound File      | Purpose                | Used By                        |
| --------------- | ---------------------- | ------------------------------ |
| `success.wav`   | Correct tap feedback   | `playTapAudioFeedback(true)`   |
| `wrong.wav`     | Incorrect tap feedback | `playTapAudioFeedback(false)`  |
| `tap.wav`       | Generic tap sound      | Alternative                    |
| `explosion.wav` | Target miss            | `playSoundEffect.targetMiss()` |
| `welcome.wav`   | Welcome screen         | `playSoundEffect.welcome()`    |

---

## Appendix C: Related Documentation

- [`plans/ui-layer-forensic-audit-feb2026.md`](plans/ui-layer-forensic-audit-feb2026.md) - Original forensic audit
- [`DOCS/ARCHITECTURE_DECISION_RECORD_DEC2025.md`](DOCS/ARCHITECTURE_DECISION_RECORD_DEC2025.md) - Architecture decisions
- [`DOCS/MULTI_TOUCH_IMPLEMENTATION.md`](DOCS/MULTI_TOUCH_IMPLEMENTATION.md) - Touch handling details
- [`C-JOB_CARD_AUDIO_AUDIT_JAN2026.md`](C-JOB_CARD_AUDIO_AUDIT_JAN2026.md) - Audio system audit

---

**Document Version**: 1.0  
**Created**: 2026-02-17  
**Author**: Architect Mode
