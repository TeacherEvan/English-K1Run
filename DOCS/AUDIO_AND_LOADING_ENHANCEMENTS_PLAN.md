# Audio and Loading Screen Enhancement Plan

**Date**: January 30, 2026  
**Status**: Planning Complete - Ready for Implementation

## Executive Summary

This document outlines the implementation plan for three critical feature enhancements:

1. **Startup Audio Configuration**: Configure "Welcome to Teacher Evan's Super Student, lets have fun learning together!" audio to play during application launch
2. **Home Menu Audio Sequence**: Trigger "in association with Sangsom kindergarten" (English + Thai) automatically after startup audio
3. **Automatic Loading Screen Progression**: Auto-advance to gameplay after worm elimination completion, eliminating manual button press requirement

## Current Implementation Analysis

### Welcome Screen (`src/components/WelcomeScreen.tsx`)

**Current Flow**:

- Plays 4-phase audio sequence on startup:
  1. `welcome_association` - English intro
  2. `welcome_learning` - English learning prompt
  3. `welcome_association_thai` - Thai translation
  4. `welcome_learning_thai` - Thai translation
- Shows video/fallback image during sequence
- Shows "Tap to continue" when audio completes
- Manually advances to home menu on user tap/key

**Issues with Current Requirements**:

- The current audio files (`welcome_association`, `welcome_learning`) do NOT contain "Welcome to Teacher Evan's Super Student, lets have fun learning together!" message
- The task requires NEW audio content that doesn't currently exist
- The "in association with Sangsom kindergarten" audio needs to play in the HOME MENU, not the welcome screen

### Home Menu (`src/components/GameMenu.tsx` + `src/components/game-menu/GameMenuHome.tsx`)

**Current Flow**:

- Static display with no audio playback
- Shows game title, best time, and action buttons
- User manually selects "Start Game" or "Level Select"

**Required Enhancement**:

- Must play "in association with Sangsom kindergarten" audio automatically when entering home menu
- Must play Thai version after English version
- Should not block user interaction (audio plays in background)

### Worm Loading Screen (`src/components/WormLoadingScreen.tsx`)

**Current Flow**:

- Shows 5 animated worms to eliminate
- User taps/clicks worms to eliminate them
- When all worms eliminated (`aliveCount === 0`):
  - Waits 500ms
  - Calls `onComplete()` to advance to game
- "Skip Loading Screen" button manually calls `onComplete()`

**Current Issue**:

- The green "Skip" button is functional but task requires it to be renamed or removed
- Auto-completion already works when all worms eliminated (500ms delay)
- Visual feedback for worm elimination already exists (💥 splat emoji, worm count display)

**Required Enhancement**:

- **NO CODE CHANGES NEEDED** - auto-progression already implemented
- Only needs visual/text clarification that button is optional
- E2E tests need validation of automatic progression

## Implementation Plan

### Phase 1: Audio File Requirements ⚠️ CRITICAL

**Problem**: The required audio files don't exist yet.

**Required Audio Files**:

1. `sounds/welcome_evan_intro.mp3` - "Welcome to Teacher Evan's Super Student, lets have fun learning together!"
2. `sounds/welcome_sangsom_association.mp3` - "in association with Sangsom kindergarten" (English)
3. `sounds/welcome_sangsom_association_thai.mp3` - Thai version of association message

**Action Required**:

- Generate these audio files using ElevenLabs TTS (use existing script: `scripts/generate-audio.cjs`)
- Determine exact wording for each message
- Recording script should use ElevenLabs voice IDs from language config

### Phase 2: Welcome Screen Audio Modification

**File**: `src/components/WelcomeScreen.tsx`

**Changes**:

1. Replace current 4-phase sequence with NEW sequence:
   - Phase 1: `welcome_evan_intro` (new file)
   - Phase 2: Wait 300ms
   - (Remove phases 3-4 - they'll move to home menu)

2. Update audio priorities in `src/lib/audio/audio-priorities.ts`:

   ```typescript
   const AUDIO_PRIORITIES = [
     "welcome_evan_intro", // NEW
     "welcome_sangsom_association", // NEW
     "welcome_sangsom_association_thai", // NEW
     // ... existing entries
   ];
   ```

3. Adjust timing:
   - Reduce sequence timeout from 20s to 10s (only 1 audio file now)
   - Keep safety timers as-is

### Phase 3: Home Menu Audio Playback

**New Hook**: Create `src/hooks/use-home-menu-audio.ts`

```typescript
/**
 * Custom hook to play "association with Sangsom kindergarten"
 * audio sequence when home menu is displayed.
 */
export const useHomeMenuAudio = () => {
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    if (audioPlayedRef.current) return;
    audioPlayedRef.current = true;

    const playSequence = async () => {
      try {
        // Ensure AudioContext is ready
        const context = audioContextManager.getContext();
        if (context?.state === "suspended") {
          await context.resume();
        }

        // Play English version
        await soundManager.playSound("welcome_sangsom_association", 1.0, 0.85);

        // 300ms pause
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Play Thai version
        await soundManager.playSound(
          "welcome_sangsom_association_thai",
          0.9,
          0.85,
        );
      } catch (error) {
        console.warn("[HomeMenuAudio] Playback failed:", error);
      }
    };

    // Small delay to avoid audio context suspension issues
    const timer = setTimeout(playSequence, 500);
    return () => clearTimeout(timer);
  }, []);
};
```

**File**: `src/components/game-menu/GameMenuHome.tsx`

**Changes**:

1. Import and use the new hook:

   ```typescript
   import { useHomeMenuAudio } from "../../hooks/use-home-menu-audio"

   export const GameMenuHome = memo(({ ... }) => {
     useHomeMenuAudio() // Plays audio on mount
     // ... rest of component
   })
   ```

### Phase 4: Loading Screen Visual Improvements

**File**: `src/components/WormLoadingScreen.tsx`

**Required Changes**:

1. **Update button text** to clarify it's optional:

   ```tsx
   // Line 246-252: Change button text
   <button
     data-testid="skip-loading-button"
     onClick={onComplete}
     className="..."
   >
     Skip to Game (or catch all worms!)
   </button>
   ```

2. **Add progress indicator** near button to emphasize auto-progression:
   ```tsx
   {
     /* Progress indicator - new element before button */
   }
   {
     aliveWorms.length === 0 && (
       <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center">
         <p className="text-lg text-green-600 font-semibold animate-pulse">
           🎯 All worms caught! Starting game...
         </p>
       </div>
     );
   }
   ```

### Phase 5: State Management & Flow

**No changes required to App.tsx flow**:

- Welcome screen → Home menu → Loading screen → Gameplay
- Loading screen already auto-completes after worm elimination
- State transitions are clean and deterministic

**Potential Edge Cases**:

1. **Audio context suspension**: Already handled by AudioContext resume logic
2. **Multiple home menu visits**: Hook uses `useRef` to prevent re-playing audio
3. **Audio overlap**: `soundManager.stopAllAudio()` prevents conflicts
4. **E2E mode**: Needs bypass flag for audio-triggered tests

### Phase 6: Error Handling

**Audio Loading Failures**:

```typescript
// In audio loader, add fallback logging
if (!audioFile) {
  console.warn(`[AudioLoader] Missing audio: ${name}`);
  // Falls back to speech synthesis (existing behavior)
}
```

**Home Menu Audio Errors**:

```typescript
// Hook handles errors gracefully - failure won't block UI
catch (error) {
  console.warn('[HomeMenuAudio] Playback failed:', error)
  // User can still interact with menu normally
}
```

## E2E Test Updates

### File: `e2e/specs/menu.spec.ts`

**New Test Cases**:

```typescript
test.describe("Home Menu Audio", () => {
  test("should play Sangsom association audio on menu load", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="game-menu"]');

    // Wait for audio to start playing
    await page.waitForTimeout(1000);

    // Check that audio elements exist (implementation dependent)
    // This test may need adjustment based on audio system internals
  });

  test("should play Thai version after English version", async ({ page }) => {
    // Monitor console for audio playback logs
    const audioLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Playing")) {
        audioLogs.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector('[data-testid="game-menu"]');
    await page.waitForTimeout(8000); // Allow time for both audio files

    // Verify sequence order
    expect(audioLogs).toContain(
      expect.stringContaining("welcome_sangsom_association"),
    );
    expect(audioLogs).toContain(
      expect.stringContaining("welcome_sangsom_association_thai"),
    );
  });
});
```

### File: `e2e/specs/gameplay.spec.ts`

**Updated Test Cases**:

```typescript
test.describe("Loading Screen Auto Progression", () => {
  test("should automatically advance after all worms eliminated", async ({
    page,
  }) => {
    await page.goto("/?e2e=1");
    await page.click('[data-testid="start-game-button"]');

    // Wait for loading screen
    await page.waitForSelector('[data-testid="worm-loading-screen"]');

    // Eliminate all worms
    for (let i = 0; i < 5; i++) {
      const worm = page.locator(".worm-wiggle").first();
      await worm.click();
      await page.waitForTimeout(100); // Allow animation
    }

    // Should auto-advance without clicking skip button
    await page.waitForSelector('[data-testid="target-display"]', {
      timeout: 2000,
    });

    // Verify we're in game
    expect(await page.isVisible('[data-testid="worm-loading-screen"]')).toBe(
      false,
    );
  });

  test("should show visual feedback when auto-advancing", async ({ page }) => {
    // Similar to above but check for "All worms caught!" message
    await page.goto("/?e2e=1");
    await page.click('[data-testid="start-game-button"]');
    await page.waitForSelector('[data-testid="worm-loading-screen"]');

    // Eliminate all worms
    for (let i = 0; i < 5; i++) {
      await page.locator(".worm-wiggle").first().click();
    }

    // Check for completion message
    await expect(page.locator("text=All worms caught")).toBeVisible();
    await expect(page.locator("text=Starting game")).toBeVisible();
  });

  test("skip button should still work as manual override", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.click('[data-testid="start-game-button"]');
    await page.waitForSelector('[data-testid="worm-loading-screen"]');

    // Click skip immediately without eliminating worms
    await page.click('[data-testid="skip-loading-button"]');

    // Should advance to game
    await page.waitForSelector('[data-testid="target-display"]', {
      timeout: 2000,
    });
  });
});
```

### File: `e2e/specs/accessibility.spec.ts`

**Updated Test**:

```typescript
test("Welcome screen should have updated audio sequence", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-testid="welcome-screen"]');

  // Monitor console for new audio file
  const audioLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.text().includes("welcome_evan_intro")) {
      audioLogs.push(msg.text());
    }
  });

  await page.waitForTimeout(5000);
  expect(audioLogs.length).toBeGreaterThan(0);
});
```

## Implementation Checklist

### Pre-Implementation

- [ ] Generate required audio files:
  - [ ] `welcome_evan_intro.mp3` - Determine exact wording
  - [ ] `welcome_sangsom_association.mp3` - Determine exact wording
  - [ ] `welcome_sangsom_association_thai.mp3` - Get Thai translation
- [ ] Add audio files to `/sounds` directory
- [ ] Test audio files play correctly in isolation

### Code Changes

- [ ] Update `src/lib/audio/audio-priorities.ts` with new audio keys
- [ ] Modify `src/components/WelcomeScreen.tsx` audio sequence
- [ ] Create `src/hooks/use-home-menu-audio.ts` hook
- [ ] Update `src/components/game-menu/GameMenuHome.tsx` to use audio hook
- [ ] Update `src/components/WormLoadingScreen.tsx` button text & visual feedback
- [ ] Add E2E bypass logic for audio tests if needed

### Testing

- [ ] Manual test: Welcome screen plays new audio
- [ ] Manual test: Home menu plays association audio (English then Thai)
- [ ] Manual test: Loading screen auto-advances after worm elimination
- [ ] Manual test: Loading screen skip button still works
- [ ] Run E2E test suite: `npm run test:e2e`
- [ ] Fix any failing tests
- [ ] Add new E2E tests for audio sequences
- [ ] Verify no audio overlap between screens

### Documentation

- [ ] Update `.roo/copilot-instructions.md` with new audio sequence
- [ ] Update CHANGELOG.md with feature additions
- [ ] Document new audio files in README or audio documentation

## Risk Assessment

### High Risk

- **Missing audio files**: Cannot complete implementation without audio content
- **Audio context suspension**: Browsers may block autoplay; mitigated by existing resume logic

### Medium Risk

- **Audio timing conflicts**: Home menu audio might overlap with game start audio
  - Mitigation: Use `soundManager.stopAllAudio()` before game start
- **E2E test flakiness**: Audio-based tests are inherently timing-dependent
  - Mitigation: Use `?e2e=1` bypass mode where appropriate

### Low Risk

- **Loading screen changes**: Minimal code changes, existing auto-complete logic proven
- **State management**: No new state variables needed, existing flow is clean

## Timeline Estimate

1. **Audio Generation**: 1-2 hours (depends on script wording approval)
2. **Code Implementation**: 2-3 hours
3. **Testing & Debugging**: 2-3 hours
4. **E2E Test Updates**: 1-2 hours
5. **Documentation**: 30 minutes

**Total**: 6.5-10.5 hours

## Success Criteria

✅ Welcome screen plays "Welcome to Teacher Evan's Super Student, lets have fun learning together!" audio on launch  
✅ Home menu plays "in association with Sangsom kindergarten" (English + Thai) automatically  
✅ Loading screen auto-advances to game after all worms eliminated  
✅ Loading screen shows clear visual feedback during auto-advance  
✅ Skip button remains functional as manual override  
✅ All E2E tests pass  
✅ No audio overlap or context errors  
✅ User experience is smooth and intuitive

## Next Steps

1. **Determine exact audio script wording** for the three new files
2. **Generate audio files** using ElevenLabs
3. **Begin implementation** following this plan
4. **Test incrementally** after each phase
5. **Update E2E tests** as features are completed
