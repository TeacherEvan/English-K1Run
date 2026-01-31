# Audio Loading Issues Analysis - January 2026

## Executive Summary

The screenshot reveals **23 distinct audio loading failures** affecting the Kindergarten Race Game. These failures fall into 5 categories: missing critical audio files, missing new welcome files, missing emoji sound files, file format mismatches, and inadequate error handling.

---

## Issue Categories

### 1. **CRITICAL: Missing Core Audio Files (404 Errors)**

**Impact**: High - Core game functionality affected  
**Files Affected**: 3 files

| File          | Expected Location     | Current Status     | Usage                   |
| ------------- | --------------------- | ------------------ | ----------------------- |
| `wrong.wav`   | `/sounds/wrong.wav`   | ❌ **Missing**     | Wrong answer feedback   |
| `success.wav` | `/sounds/success.wav` | ❌ **Missing**     | Correct answer feedback |
| `welcome.wav` | `/sounds/welcome.wav` | Only `.mp3` exists | Welcome screen greeting |

**Root Cause**:

- Files exist as `.mp3` but application expects `.wav` format
- Audio registry is configured to prioritize `.wav` → `.mp3` formats
- File discovery glob pattern matches both formats, but specific keys request `.wav`

**Evidence from Screenshot**:

```
HTTP load failed with status 404. Load of media resource
https://english-k1-run.vercel.app/sounds/wrong.wav failed.
https://english-k1-run.vercel.app/sounds/success.wav failed.
https://english-k1-run.vercel.app/sounds/welcome.wav failed.
```

### 2. **Missing New Welcome Audio Files**

**Impact**: High - Welcome screen and home menu audio broken  
**Files Affected**: 3 files

| File Key                           | Purpose                     | Code Reference                                                     | Status           |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------ | ---------------- |
| `welcome_evan_intro`               | Teacher Evan's introduction | [`WelcomeScreen.tsx:143`](src/components/WelcomeScreen.tsx:143)    | ❌ Not generated |
| `welcome_sangsom_association`      | Sangsom intro (English)     | [`use-home-menu-audio.ts:51`](src/hooks/use-home-menu-audio.ts:51) | ❌ Not generated |
| `welcome_sangsom_association_thai` | Sangsom intro (Thai)        | [`use-home-menu-audio.ts:60`](src/hooks/use-home-menu-audio.ts:60) | ❌ Not generated |

**Root Cause**:

- Audio generation script ([`scripts/generate-audio.cjs`](scripts/generate-audio.cjs:369-373)) defines these files
- However, they have **never been generated** (no files in `/sounds/` directory)
- Code was updated to use these new files, but generation script was not run

**Evidence from Screenshot**:

```
[AudioBufferLoader] No URL found for key: "welcome_evan_intro"
[AudioBufferLoader] No URL found for key: "welcome_sangsom_association"
[AudioBufferLoader] No URL found for key: "welcome_sangsom_association_thai"
```

**Current Workaround**:

- [`WelcomeScreen.tsx:143`](src/components/WelcomeScreen.tsx:143) uses `welcome_learning` as temporary fallback
- [`use-home-menu-audio.ts:51,60`](src/hooks/use-home-menu-audio.ts:51) uses old `welcome_association` files
- This works but doesn't match intended user experience

### 3. **Missing Emoji Audio Files**

**Impact**: Medium - Specific game categories affected  
**Files Affected**: 10 files

| Category       | Missing Files                        | Game Impact                          |
| -------------- | ------------------------------------ | ------------------------------------ |
| **Vegetables** | `grape`, `tomato`, `potato`, `onion` | Fruits & Vegetables level incomplete |
| **Animals**    | `cow`, `pig`, `sheep`, `bird`        | Animals & Nature level incomplete    |
| **Vehicles**   | `truck`                              | Things That Go level incomplete      |

**Root Cause**:

- Audio priorities ([`audio-priorities.ts:84-90`](src/lib/audio/audio-priorities.ts:84)) list these as COMMON priority
- Game categories ([`game-categories.ts`](src/lib/constants/game-categories.ts)) use different names (e.g., "grapes" not "grape")
- Audio generation script uses base names but emoji files are never created

**Evidence from Screenshot**:

```
[AudioBufferLoader] No URL found for key: "grape"
[AudioBufferLoader] No URL found for key: "tomato"
[AudioBufferLoader] No URL found for key: "potato"
[AudioBufferLoader] No URL found for key: "onion"
[AudioBufferLoader] No URL found for key: "truck"
[AudioBufferLoader] No URL found for key: "bird"
[AudioBufferLoader] No URL found for key: "cow"
[AudioBufferLoader] No URL found for key: "pig"
[AudioBufferLoader] No URL found for key: "sheep"
```

**Name Mismatch Analysis**:

| Priority File Says | Game Uses      | Sound File Exists                   | Issue                              |
| ------------------ | -------------- | ----------------------------------- | ---------------------------------- |
| `grape`            | `grapes`       | ✅ `grapes.mp3`, `emoji_grapes.mp3` | Name mismatch - should be `grapes` |
| `tomato`           | ❌ Not in game | ❌ No file                          | Should be removed from priorities  |
| `potato`           | ❌ Not in game | ❌ No file                          | Should be removed from priorities  |
| `onion`            | ❌ Not in game | ❌ No file                          | Should be removed from priorities  |
| `truck`            | `fire truck`   | ✅ `fire truck.mp3`                 | Name mismatch                      |
| `bird`             | ❌ Not in game | ❌ No file                          | Should be removed or added to game |
| `cow`              | ❌ Not in game | ❌ No file                          | Should be removed or added to game |
| `pig`              | ❌ Not in game | ❌ No file                          | Should be removed or added to game |
| `sheep`            | ❌ Not in game | ❌ No file                          | Should be removed or added to game |

### 4. **File Format Inconsistencies**

**Impact**: Medium - Affects browser compatibility  
**Issue**: Mix of `.wav` and `.mp3` formats

**Current State**:

```
sounds/
├── *.mp3      (186 files) - Most audio files
├── *.wav      (4 files)   - Only welcome_*.wav files exist
```

**Audio Registry Preference Order** ([`audio-registry.ts:73-81`](src/lib/audio/audio-registry.ts:73)):

```typescript
preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"];
```

**Problem**:

- Code explicitly requests `.wav` files for critical sounds
- Only `.mp3` versions exist
- Registry will fall back to `.mp3`, but with warning logs

### 5. **Inadequate Error Handling**

**Impact**: Low-Medium - Poor user experience on audio failures  
**Files Affected**: All audio loading paths

**Current Issues**:

1. **No Graceful Degradation**:

   ```typescript
   // audio-buffer-loader.ts:55-58
   const url = await getAudioUrl(key);
   if (!url) {
     console.warn(`[AudioBufferLoader] No URL found for key: "${key}"`);
     return null; // ❌ Returns null, no fallback attempt
   }
   ```

2. **Incomplete Fallback Chain**:
   - Audio file → null (should try speech synthesis)
   - Should be: Audio file → Speech synthesis → Tone generation → Silent fail

3. **No User Feedback**:
   - Errors logged to console only
   - No visual indication that audio is unavailable
   - Users may think app is broken

4. **Missing 404 Retry Logic**:
   - No network retry on temporary failures
   - No CDN fallback URLs

---

## Root Cause Analysis

### Primary Causes

1. **Incomplete Audio Generation**
   - Script defines files but hasn't been run for new files
   - No CI/CD validation that all required files exist

2. **Naming Convention Mismatches**
   - Priority lists use singular names (`grape`)
   - Game categories use plural (`grapes`)
   - No automated validation between systems

3. **Format Inconsistency**
   - Legacy `.wav` requests mixed with `.mp3` files
   - No standardization policy

4. **Missing Priority Sync**
   - Priority list references non-existent game items
   - No automated sync from game categories → priorities

### Contributing Factors

1. **No Pre-Deployment Checks**
   - Missing audio files not detected before deployment
   - No smoke tests for audio loading

2. **Scattered Configuration**
   - Audio files defined in 3+ places:
     - [`scripts/generate-audio.cjs`](scripts/generate-audio.cjs)
     - [`src/lib/audio/audio-priorities.ts`](src/lib/audio/audio-priorities.ts)
     - [`src/lib/constants/game-categories.ts`](src/lib/constants/game-categories.ts)

3. **Insufficient Fallbacks**
   - No speech synthesis fallback for missing files
   - No tone generation fallback
   - No silent mode option

---

## Proposed Solutions

### Phase 1: Immediate Fixes (Critical Issues)

#### 1.1 Generate Missing Critical Audio Files

**Action**: Run audio generation for missing files

```bash
# Generate the 3 critical files
node scripts/generate-audio.cjs --language en --files wrong,success,welcome

# Or convert existing .mp3 files to .wav
ffmpeg -i sounds/wrong.mp3 sounds/wrong.wav
ffmpeg -i sounds/success.mp3 sounds/success.wav
ffmpeg -i sounds/welcome.mp3 sounds/welcome.wav
```

**Alternative**: Update code to accept `.mp3` format

- Modify requests to use format-agnostic keys
- Let audio registry handle format selection

#### 1.2 Generate New Welcome Audio Files

**Action**: Generate the 3 new welcome files

```bash
# Set environment variables for Thai text
export WELCOME_ASSOCIATION_THAI_TEXT="ร่วมกับโรงเรียนอนุบาลสังสม"

# Generate files
node scripts/generate-audio.cjs --language en --files welcome_evan_intro,welcome_sangsom_association
node scripts/generate-audio.cjs --language th --files welcome_sangsom_association_thai
```

**Required Text**:

- `welcome_evan_intro`: "Welcome to Teacher Evan's Super Student English Program"
- `welcome_sangsom_association`: "In association with Sangsom Kindergarten"
- `welcome_sangsom_association_thai`: "ร่วมกับโรงเรียนอนุบาลสังสม"

#### 1.3 Fix Audio Priority Name Mismatches

**File**: [`src/lib/audio/audio-priorities.ts`](src/lib/audio/audio-priorities.ts)

**Changes**:

```typescript
[AudioPriority.COMMON]: [
  // ... numbers and letters ...

  // Fruits and vegetables - FIX: Match game-categories.ts names
  "apple",
  "banana",
  "orange",
  "grapes",      // ✅ Changed from "grape"
  "strawberry",
  "carrot",
  "broccoli",
  // ❌ Remove: tomato, potato, onion (not in game)
],
[AudioPriority.RARE]: [
  // Vehicles - FIX: Match actual names
  "car",
  "bus",
  "fire truck",  // ✅ Changed from "truck"
  "bicycle",
  "airplane",
  "boat",
  // ❌ Remove: bird, cow, pig, sheep (not in game)
],
```

### Phase 2: Architectural Improvements

#### 2.1 Automated Audio Validation

**Create**: `scripts/validate-audio-files.cjs`

```javascript
/**
 * Validates that all required audio files exist
 * Run in CI/CD before deployment
 */

const fs = require("fs");
const path = require("path");

// Import game categories
const { GAME_CATEGORIES } = require("../src/lib/constants/game-categories.ts");
const { AUDIO_PRIORITIES } = require("../src/lib/audio/audio-priorities.ts");

function validateAudioFiles() {
  const soundsDir = path.join(__dirname, "..", "sounds");
  const errors = [];

  // Collect all required files
  const requiredFiles = new Set();

  // From game categories
  GAME_CATEGORIES.forEach((category) => {
    category.items.forEach((item) => {
      requiredFiles.add(item.name);
    });
  });

  // From priorities
  Object.values(AUDIO_PRIORITIES)
    .flat()
    .forEach((key) => {
      requiredFiles.add(key);
    });

  // Check existence (any format acceptable)
  for (const file of requiredFiles) {
    const formats = [".wav", ".mp3", ".ogg", ".m4a"];
    const exists = formats.some((ext) =>
      fs.existsSync(path.join(soundsDir, file + ext)),
    );

    if (!exists) {
      errors.push(`Missing audio file: ${file}`);
    }
  }

  if (errors.length > 0) {
    console.error("❌ Audio validation failed:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("✅ All audio files validated successfully");
}

validateAudioFiles();
```

**Add to** `package.json`:

```json
{
  "scripts": {
    "validate:audio": "node scripts/validate-audio-files.cjs",
    "build": "npm run validate:audio && tsc -b --noCheck && vite build"
  }
}
```

#### 2.2 Enhanced Error Handling & Fallbacks

**File**: [`src/lib/audio/audio-buffer-loader.ts`](src/lib/audio/audio-buffer-loader.ts)

**Add**:

```typescript
import { speechSynthesizer } from './speech-synthesizer';

async loadBufferForName(
  name: string,
  allowFallback = true,
): Promise<AudioBuffer | null> {
  const candidates = resolveCandidates(name);

  // Try each candidate
  for (const candidate of candidates) {
    const buffer = await this.loadFromIndex(candidate);
    if (buffer) return buffer;
  }

  // NEW: Speech synthesis fallback
  if (allowFallback) {
    try {
      // Log for monitoring
      console.warn(
        `[AudioBufferLoader] No audio file for "${name}", using speech synthesis`
      );

      // Use speech synthesis to pronounce the word
      await speechSynthesizer.speak(name, {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.85
      });

      // Return special marker buffer (or null if speech unavailable)
      return this.fallbackEffects.get("speech-fallback") ?? null;
    } catch (error) {
      console.error(
        `[AudioBufferLoader] Speech fallback failed for "${name}":`,
        error
      );
    }
  }

  return null;
}
```

#### 2.3 Centralized Audio Configuration

**Create**: `src/lib/audio/audio-manifest.ts`

```typescript
/**
 * Single source of truth for all required audio files
 * Auto-generated from game categories
 */

import { GAME_CATEGORIES } from "../constants/game-categories";

/** Extract all unique item names from game categories */
export function getRequiredAudioFiles(): Set<string> {
  const files = new Set<string>();

  // Game items
  GAME_CATEGORIES.forEach((category) => {
    category.items.forEach((item) => {
      files.add(item.name);
      // Also add emoji_ variant
      files.add(`emoji_${item.name}`);
    });
  });

  // Critical system sounds
  ["welcome", "success", "wrong", "win", "tap"].forEach((f) => files.add(f));

  // Welcome messages
  [
    "welcome_evan_intro",
    "welcome_sangsom_association",
    "welcome_sangsom_association_thai",
    "welcome_association",
    "welcome_learning",
    "welcome_association_thai",
    "welcome_learning_thai",
  ].forEach((f) => files.add(f));

  return files;
}

/** Validate that all required files exist */
export async function validateAudioManifest(): Promise<{
  missing: string[];
  found: string[];
}> {
  const required = getRequiredAudioFiles();
  const missing: string[] = [];
  const found: string[] = [];

  for (const file of required) {
    const hasFile = await hasAudioKey(file);
    if (hasFile) {
      found.push(file);
    } else {
      missing.push(file);
    }
  }

  return { missing, found };
}
```

#### 2.4 User-Facing Error Handling

**Create**: [`src/components/AudioStatusIndicator.tsx`](src/components/AudioStatusIndicator.tsx)

```tsx
/**
 * Shows audio status and provides user feedback
 */

import { useEffect, useState } from "react";
import { soundManager } from "../lib/sound-manager";

export const AudioStatusIndicator = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Listen for audio errors
    const handleAudioError = (error: { file: string; error: string }) => {
      setErrors((prev) => [...prev, `${error.file}: ${error.error}`]);

      // Auto-dismiss after 5s
      setTimeout(() => {
        setErrors((prev) =>
          prev.filter((e) => e !== `${error.file}: ${error.error}`),
        );
      }, 5000);
    };

    // Subscribe to audio events
    soundManager.on("error", handleAudioError);

    return () => {
      soundManager.off("error", handleAudioError);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔇</span>
        <div>
          <p className="font-bold text-sm">Audio Unavailable</p>
          <p className="text-xs text-gray-700">
            Some sounds could not load. The game will use speech synthesis
            instead.
          </p>
        </div>
      </div>
    </div>
  );
};
```

### Phase 3: Testing & Validation

#### 3.1 Audio Loading Tests

**Create**: `e2e/specs/audio-loading.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Audio Loading", () => {
  test("should load all critical audio files", async ({ page }) => {
    // Monitor network requests
    const failedAudios: string[] = [];

    page.on("response", (response) => {
      if (response.url().includes("/sounds/") && response.status() === 404) {
        failedAudios.push(response.url());
      }
    });

    // Navigate to app
    await page.goto("/");

    // Wait for initial audio loading
    await page.waitForTimeout(2000);

    // Assert no 404s for critical files
    expect(failedAudios).toHaveLength(0);
  });

  test("should have fallback for missing audio", async ({
    page,
    browserName,
  }) => {
    // Block specific audio file
    await page.route("**/sounds/test_missing.mp3", (route) =>
      route.abort("failed"),
    );

    await page.goto("/");

    // Try to play blocked audio via console
    const result = await page.evaluate(async () => {
      const { soundManager } = window as any;
      try {
        await soundManager.playSound("test_missing");
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    // Should gracefully handle missing file
    expect(result.success).toBe(true); // Fallback succeeded
  });
});
```

#### 3.2 Pre-Deployment Checklist

**Add to** `.github/workflows/deploy.yml`:

```yaml
- name: Validate Audio Files
  run: |
    npm run validate:audio

- name: Check for 404 Audio Errors
  run: |
    npm run test:e2e -- audio-loading.spec.ts
```

---

## Implementation Priority

| Priority | Task                                                    | Effort | Impact   |
| -------- | ------------------------------------------------------- | ------ | -------- |
| **P0**   | Generate missing `.wav` files (wrong, success, welcome) | 5min   | Critical |
| **P0**   | Generate new welcome audio files                        | 10min  | High     |
| **P1**   | Fix audio-priorities.ts name mismatches                 | 15min  | High     |
| **P1**   | Add speech synthesis fallback                           | 2hr    | Medium   |
| **P2**   | Create audio validation script                          | 3hr    | High     |
| **P2**   | Add user-facing error UI                                | 2hr    | Medium   |
| **P3**   | Create audio manifest system                            | 4hr    | Medium   |
| **P3**   | Add E2E audio loading tests                             | 3hr    | Medium   |

---

## Success Metrics

After implementing fixes, we should see:

1. **Zero 404 errors** in console for audio files
2. **Zero "No URL found" warnings** from AudioBufferLoader
3. **100% audio coverage** for all game categories
4. **Graceful degradation** when files are unavailable
5. **User feedback** when audio is disabled/unavailable

---

## Prevention Strategies

1. **Automated Validation**:
   - Run `validate:audio` in CI/CD pipeline
   - Block deployments if required files missing

2. **Single Source of Truth**:
   - Generate `audio-priorities.ts` from `game-categories.ts`
   - Auto-update generation script from categories

3. **Better Monitoring**:
   - Track audio 404s in production analytics
   - Alert on excessive audio fallback usage

4. **Documentation**:
   - Document audio file naming conventions
   - Create guide for adding new game categories

---

## References

- Screenshot: Console errors showing 23 audio loading failures
- [`src/lib/audio/audio-buffer-loader.ts`](src/lib/audio/audio-buffer-loader.ts) - Audio loading logic
- [`src/lib/audio/audio-priorities.ts`](src/lib/audio/audio-priorities.ts) - Priority definitions
- [`src/lib/constants/game-categories.ts`](src/lib/constants/game-categories.ts) - Game items
- [`scripts/generate-audio.cjs`](scripts/generate-audio.cjs) - Audio generation script
- [`src/components/WelcomeScreen.tsx`](src/components/WelcomeScreen.tsx) - Welcome audio usage
- [`src/hooks/use-home-menu-audio.ts`](src/hooks/use-home-menu-audio.ts) - Home menu audio usage

---

**Created**: 2026-01-31  
**Author**: Kilo Code (Architect Mode)  
**Status**: Analysis Complete - Ready for Implementation
