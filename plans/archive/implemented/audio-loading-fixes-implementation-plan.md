# Audio Loading Fixes - Implementation Plan

**Related Analysis**: [`audio-loading-issues-analysis-jan2026.md`](audio-loading-issues-analysis-jan2026.md)  
**Created**: 2026-01-31  
**Status**: Ready for Implementation

---

## Overview

This plan provides step-by-step instructions to fix all 23 audio loading issues identified in the console errors. The fixes are organized into 3 phases with clear dependencies and testing checkpoints.

---

## Phase 1: Critical Audio Files (P0 - Immediate)

### Step 1.1: Convert Existing .mp3 Files to .wav Format

**Why**: Core game sounds (`wrong`, `success`, `welcome`) return 404 errors because `.wav` files don't exist.

**Option A: Use ffmpeg (Recommended)**

```bash
# Install ffmpeg if not available
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: apt-get install ffmpeg

# Convert critical files
cd sounds
ffmpeg -i wrong.mp3 -ar 44100 -ac 2 wrong.wav
ffmpeg -i success.mp3 -ar 44100 -ac 2 success.wav
ffmpeg -i welcome.mp3 -ar 44100 -ac 2 welcome.wav

# Verify files created
ls -lh wrong.wav success.wav welcome.wav
```

**Option B: Update Code to Use .mp3 (Faster)**

If ffmpeg is not available, modify the audio request logic:

**File**: `src/lib/sound-manager.ts` (or relevant caller)

```diff
- await audioPlayer.play('wrong')  // Requests wrong.wav first
+ await audioPlayer.play('wrong', { preferFormat: 'mp3' })
```

**Better Solution**: Make the registry format-agnostic by default.

**File**: [`src/lib/audio/audio-registry.ts`](src/lib/audio/audio-registry.ts:73)

```diff
  preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"].filter(
    (ext) => supported.has(ext),
  );

+ // Fallback to mp3 if nothing else supported (always available)
  if (preferredFormatOrder.length === 0) {
-   preferredFormatOrder = ["mp3", "wav"];
+   preferredFormatOrder = ["mp3"]; // Most compatible format
  }
```

**Testing**:

```bash
# Start dev server
npm run dev

# Open browser console and check:
# 1. No 404 errors for wrong.wav, success.wav, welcome.wav
# 2. Sounds play correctly when tapping wrong/correct answers
```

**Expected Result**: ✅ Zero 404 errors for `wrong`, `success`, `welcome`

---

### Step 1.2: Generate New Welcome Audio Files

**Why**: New welcome screen and home menu features reference audio files that don't exist.

**Files to Generate**:

1. `welcome_evan_intro.mp3` - "Welcome to Teacher Evan's Super Student English Program"
2. `welcome_sangsom_association.mp3` - "In association with Sangsom Kindergarten"
3. `welcome_sangsom_association_thai.mp3` - "ร่วมกับโรงเรียนอนุบาลสังสม"

**Script Verification**:

**File**: [`scripts/generate-audio.cjs`](scripts/generate-audio.cjs:369-380)

Verify these entries exist in `AUDIO_PHRASES`:

```javascript
// Lines 368-381 (VERIFIED ✅)
"welcome_evan_intro",
"welcome_sangsom_association",
"welcome_sangsom_association_thai",
```

And in `PHRASE_TEXT_MAPPING`:

```javascript
// Lines 388-393 (VERIFIED ✅)
welcome_evan_intro: "Welcome to Teacher Evan's Super Student English Program",
welcome_sangsom_association: "In association with Sangsom Kindergarten",
welcome_sangsom_association_thai: "ร่วมกับโรงเรียนอนุบาลสังสม",
```

**Generation Command**:

```bash
# Ensure environment variables are set
export ELEVENLABS_API_KEY="your_api_key_here"

# Generate English files
node scripts/generate-audio.cjs

# This will generate ALL missing files including:
# - welcome_evan_intro.mp3
# - welcome_sangsom_association.mp3
# - welcome_sangsom_association_thai.mp3
```

**Faster Targeted Generation**:

If script doesn't support `--files` flag, manually edit `AUDIO_PHRASES` temporarily:

```javascript
// Temporarily comment out all except needed files
const AUDIO_PHRASES = [
  "welcome_evan_intro",
  "welcome_sangsom_association",
  "welcome_sangsom_association_thai",
];
```

Then run:

```bash
node scripts/generate-audio.cjs
```

**Testing**:

```bash
npm run dev

# Test Welcome Screen:
# 1. Refresh app
# 2. Listen for Teacher Evan's introduction
# 3. Check console - no "No URL found for welcome_evan_intro"

# Test Home Menu:
# 1. After welcome screen, on home menu
# 2. Listen for Sangsom association message (English then Thai)
# 3. Check console - no "No URL found" warnings
```

**Expected Result**:

- ✅ 3 new audio files in `/sounds` directory
- ✅ Welcome screen plays correct audio
- ✅ Home menu plays association message
- ✅ Zero "No URL found" warnings

---

## Phase 2: Name Mismatches & Missing Files (P1 - High Priority)

### Step 2.1: Fix Audio Priorities Configuration

**Why**: Priority list references non-existent or incorrectly named items causing "No URL found" warnings.

**File**: [`src/lib/audio/audio-priorities.ts`](src/lib/audio/audio-priorities.ts)

**Changes Required**:

```diff
[AudioPriority.COMMON]: [
  // ... numbers 1-15 ...
  // ... letters a-z ...

  // Basic fruits and vegetables
  "apple",
  "banana",
  "orange",
- "grape",        // ❌ File is "grapes.mp3"
+ "grapes",       // ✅ Matches actual file name
  "strawberry",
  "carrot",
  "broccoli",
- "tomato",       // ❌ Not in game, no file exists
- "potato",       // ❌ Not in game, no file exists
- "onion",        // ❌ Not in game, no file exists
],
[AudioPriority.RARE]: [
  // Weather
  "sunny",
  "cloudy",
  "rainy",
  "snowy",
  "windy",

  // Vehicles
  "car",
  "bus",
- "truck",        // ❌ File is "fire truck.mp3"
+ "fire truck",   // ✅ Matches actual file name (spaces allowed)
  "bicycle",
  "airplane",
  "boat",

  // Animals
  "dog",
  "cat",
- "bird",         // ❌ Not in game, no file exists
  "fish",
- "cow",          // ❌ Not in game, no file exists
- "pig",          // ❌ Not in game, no file exists
- "sheep",        // ❌ Not in game, no file exists

  // ... rest unchanged ...
],
```

**Full Corrected COMMON Section**:

```typescript
[AudioPriority.COMMON]: [
  // Numbers 1-10
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",

  // Common letters
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",

  // Basic fruits and vegetables (CORRECTED)
  "apple",
  "banana",
  "orange",
  "grapes",      // ✅ Changed from "grape"
  "strawberry",
  "carrot",
  "broccoli",
  // Removed: tomato, potato, onion (not in game)
],
```

**Full Corrected RARE Section**:

```typescript
[AudioPriority.RARE]: [
  // Weather
  "sunny", "cloudy", "rainy", "snowy", "windy",

  // Vehicles (CORRECTED)
  "car",
  "bus",
  "fire truck",  // ✅ Changed from "truck"
  "bicycle",
  "airplane",
  "boat",

  // Animals (CORRECTED - removed bird, cow, pig, sheep)
  "dog",
  "cat",
  "fish",

  // Colors
  "red", "blue", "green", "yellow", "orange", "purple",
  "pink", "brown", "black", "white",

  // Shapes
  "circle", "square", "triangle", "rectangle", "diamond", "star",
],
```

**Testing**:

```bash
npm run dev

# Check browser console:
# ✅ No "No URL found for: grape"
# ✅ No "No URL found for: tomato"
# ✅ No "No URL found for: potato"
# ✅ No "No URL found for: onion"
# ✅ No "No URL found for: truck"
# ✅ No "No URL found for: bird", "cow", "pig", "sheep"
```

**Expected Result**: ✅ Zero "No URL found" warnings for corrected items

---

### Step 2.2: Generate Actually Missing Audio Files (Optional)

If you want to add back the missing vegetables/animals to the game:

**Option A: Add to Game Categories**

**File**: [`src/lib/constants/game-categories.ts`](src/lib/constants/game-categories.ts:15-25)

```diff
{
  name: "Fruits & Vegetables",
  items: [
    { emoji: "🍎", name: "apple" },
    { emoji: "🍌", name: "banana" },
    { emoji: "🍇", name: "grapes" },
    // ... existing items ...
+   { emoji: "🍅", name: "tomato" },
+   { emoji: "🥔", name: "potato" },
+   { emoji: "🧅", name: "onion" },
  ]
},
```

Then generate audio:

```bash
# Edit generate-audio.cjs to add these to AUDIO_PHRASES if not present
node scripts/generate-audio.cjs
```

**Option B: Just Remove from Priorities (Recommended)**

Since these items aren't used in the game, removing them from priorities is the cleanest solution (already done in Step 2.1).

---

## Phase 3: Enhanced Error Handling (P2 - Important)

### Step 3.1: Add Speech Synthesis Fallback

**Why**: When audio files fail to load, the app should use text-to-speech instead of silence.

**File**: [`src/lib/audio/audio-buffer-loader.ts`](src/lib/audio/audio-buffer-loader.ts:104-126)

**Modify `loadBufferForName` method**:

```diff
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

  // Use fallback if allowed
  if (allowFallback) {
+   // Try speech synthesis before returning null
+   if (import.meta.env.DEV) {
+     console.warn(
+       `[AudioBufferLoader] No audio file for "${name}", attempting speech synthesis`
+     );
+   }
+
+   try {
+     const { speechSynthesizer } = await import('./speech-synthesizer');
+     await speechSynthesizer.speak(name, {
+       rate: 1.0,
+       pitch: 1.0,
+       volume: 0.85
+     });
+     // Return marker to indicate speech was used
+     return this.fallbackEffects.get("speech-used") ?? null;
+   } catch (speechError) {
+     if (import.meta.env.DEV) {
+       console.warn(
+         `[AudioBufferLoader] Speech synthesis also failed for "${name}":`,
+         speechError
+       );
+     }
+   }
+
    const fallback =
      this.fallbackEffects.get(name) || this.fallbackEffects.get("success");
    if (fallback) {
      return fallback;
    }
  }

  return null;
}
```

**Testing**:

```bash
# Temporarily block an audio file to test fallback
# In browser DevTools Console:
await window.soundManager.playSound('nonexistent_file')

# Should hear speech synthesis saying "nonexistent file"
# Check console for fallback message
```

**Expected Result**:

- ✅ Missing audio files trigger speech synthesis
- ✅ No silent failures
- ✅ Clear console warnings about fallback usage

---

### Step 3.2: Create Audio Validation Script

**Why**: Prevent future deployments with missing audio files.

**Create**: `scripts/validate-audio-files.cjs`

```javascript
#!/usr/bin/env node
/**
 * Audio File Validation Script
 * Ensures all required audio files exist before deployment
 */

const fs = require("fs");
const path = require("path");

// Manually list critical files (or parse from game-categories.ts)
const REQUIRED_FILES = [
  // Critical system sounds
  "welcome",
  "success",
  "wrong",
  "win",
  "tap",

  // New welcome files
  "welcome_evan_intro",
  "welcome_sangsom_association",
  "welcome_sangsom_association_thai",

  // Legacy welcome files
  "welcome_association",
  "welcome_learning",
  "welcome_association_thai",
  "welcome_learning_thai",

  // Numbers 1-15
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",

  // Letters a-z
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",

  // Game items from categories
  "apple",
  "banana",
  "grapes",
  "strawberry",
  "carrot",
  "cucumber",
  "watermelon",
  "broccoli",
  "orange",
  "lemon",
  "peach",
  "cherry",
  "kiwi",
  "dog",
  "cat",
  "fox",
  "turtle",
  "butterfly",
  "owl",
  "elephant",
  "lion",
  "rabbit",
  "giraffe",
  "penguin",
  "car",
  "bus",
  "fire truck",
  "airplane",
  "rocket",
  "bicycle",
  "helicopter",
  "boat",
  "train",
  "taxi",
  "van",
  "scooter",
  "motorcycle",
  // ... add all items from game-categories.ts
];

function validateAudioFiles() {
  const soundsDir = path.join(__dirname, "..", "sounds");
  const errors = [];
  const warnings = [];

  console.log("🔍 Validating audio files...\n");

  for (const fileName of REQUIRED_FILES) {
    // Check if any format exists
    const formats = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
    const exists = formats.some((ext) => {
      const filePath = path.join(soundsDir, fileName + ext);
      return fs.existsSync(filePath);
    });

    if (!exists) {
      errors.push(`❌ Missing: ${fileName} (no audio file found)`);
    }
  }

  // Check for .wav requests that only have .mp3
  const criticalWavFiles = ["wrong", "success", "welcome"];
  for (const fileName of criticalWavFiles) {
    const wavPath = path.join(soundsDir, fileName + ".wav");
    const mp3Path = path.join(soundsDir, fileName + ".mp3");

    if (!fs.existsSync(wavPath) && fs.existsSync(mp3Path)) {
      warnings.push(`⚠️  ${fileName}.wav missing (${fileName}.mp3 exists)`);
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error("❌ VALIDATION FAILED\n");
    errors.forEach((e) => console.error(e));
    console.error(`\nTotal errors: ${errors.length}`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  WARNINGS\n");
    warnings.forEach((w) => console.warn(w));
    console.warn(`\nTotal warnings: ${warnings.length}\n`);
  }

  console.log("✅ All required audio files validated successfully");
  console.log(`   Checked ${REQUIRED_FILES.length} files\n`);
}

validateAudioFiles();
```

**Add to** `package.json`:

```json
{
  "scripts": {
    "validate:audio": "node scripts/validate-audio-files.cjs",
    "build": "npm run validate:audio && tsc -b --noCheck && vite build",
    "verify": "npm run lint && npm run typecheck && npm run validate:audio && npm run build"
  }
}
```

**Testing**:

```bash
# Run validation
npm run validate:audio

# Should show:
# ✅ All required audio files validated successfully
# Or list specific missing files
```

**Expected Result**:

- ✅ Script reports all missing files
- ✅ Build process fails if critical files missing
- ✅ CI/CD catches issues before deployment

---

### Step 3.3: Add User-Facing Audio Status Indicator

**Why**: Users should know when audio is unavailable or degraded.

**Create**: `src/components/AudioStatusIndicator.tsx`

```tsx
import { memo, useEffect, useState } from "react";

interface AudioError {
  file: string;
  timestamp: number;
}

/**
 * Shows visual indicator when audio files fail to load
 * Auto-dismisses after 5 seconds
 */
export const AudioStatusIndicator = memo(() => {
  const [audioErrors, setAudioErrors] = useState<AudioError[]>([]);

  useEffect(() => {
    // Listen for console errors mentioning audio
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const checkForAudioError = (message: string) => {
      if (
        message.includes("[AudioBufferLoader]") ||
        message.includes("No URL found") ||
        message.includes("failed to load")
      ) {
        const match = message.match(/["']([^"']+)["']/);
        const fileName = match ? match[1] : "unknown";

        setAudioErrors((prev) => {
          // Deduplicate errors for same file
          if (prev.some((e) => e.file === fileName)) return prev;

          const newError: AudioError = {
            file: fileName,
            timestamp: Date.now(),
          };

          // Auto-remove after 5 seconds
          setTimeout(() => {
            setAudioErrors((current) =>
              current.filter((e) => e.timestamp !== newError.timestamp),
            );
          }, 5000);

          return [...prev, newError];
        });
      }
    };

    console.warn = (...args) => {
      checkForAudioError(args.join(" "));
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args) => {
      checkForAudioError(args.join(" "));
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  if (audioErrors.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50 max-w-sm animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          🔇
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 mb-1">
            Audio Partially Unavailable
          </p>
          <p className="text-xs text-gray-700 mb-2">
            Some sounds couldn't load. The game will use speech instead.
          </p>
          {import.meta.env.DEV && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer hover:text-gray-800">
                Show details ({audioErrors.length} files)
              </summary>
              <ul className="mt-1 ml-4 list-disc">
                {audioErrors.map((error) => (
                  <li key={error.timestamp} className="truncate">
                    {error.file}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
});

AudioStatusIndicator.displayName = "AudioStatusIndicator";
```

**Add to** `src/App.tsx`:

```diff
+ import { AudioStatusIndicator } from './components/AudioStatusIndicator';

function App() {
  return (
    <>
      {/* Existing app content */}
+     <AudioStatusIndicator />
    </>
  );
}
```

**Add animation to** `src/index.css`:

```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

**Testing**:

```bash
npm run dev

# Trigger an audio error by:
# 1. Renaming a sound file temporarily
# 2. Refreshing the app
# 3. Should see yellow notification in bottom-right

# In DEV mode:
# - Click "Show details" to see which files failed
# - Notification auto-dismisses after 5 seconds
```

**Expected Result**:

- ✅ Users see visual feedback when audio fails
- ✅ Notification is non-intrusive (bottom corner)
- ✅ Auto-dismisses to avoid clutter
- ✅ Dev mode shows detailed file names

---

## Phase 4: Testing & Validation (P2 - Important)

### Step 4.1: Create E2E Audio Loading Tests

**Create**: `e2e/specs/audio-loading.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Audio Loading Validation", () => {
  test("should load all critical audio files without 404 errors", async ({
    page,
  }) => {
    const failed404Requests: string[] = [];

    // Monitor network for 404 audio requests
    page.on("response", (response) => {
      if (response.url().includes("/sounds/") && response.status() === 404) {
        const fileName = response.url().split("/").pop() || "unknown";
        failed404Requests.push(fileName);
      }
    });

    // Navigate to app
    await page.goto("/?e2e=1");

    // Wait for initial audio loading phase
    await page.waitForTimeout(3000);

    // Start a game to trigger more audio loads
    await page.getByTestId("level-select-button").first().click();
    await page.waitForTimeout(2000);

    // Assert no 404s
    if (failed404Requests.length > 0) {
      console.error("Failed audio requests:", failed404Requests);
    }
    expect(failed404Requests).toHaveLength(0);
  });

  test('should not log "No URL found" warnings', async ({ page }) => {
    const audioWarnings: string[] = [];

    // Capture console warnings
    page.on("console", (msg) => {
      if (msg.type() === "warning" && msg.text().includes("No URL found")) {
        audioWarnings.push(msg.text());
      }
    });

    await page.goto("/?e2e=1");
    await page.waitForTimeout(3000);

    // Start a game
    await page.getByTestId("level-select-button").first().click();
    await page.waitForTimeout(2000);

    // Assert no warnings
    if (audioWarnings.length > 0) {
      console.error("Audio URL warnings:", audioWarnings);
    }
    expect(audioWarnings).toHaveLength(0);
  });

  test("should play welcome audio on app start", async ({
    page,
    browserName,
  }) => {
    // Skip in webkit due to autoplay policies
    test.skip(browserName === "webkit", "Webkit blocks autoplay");

    let audioContextResumed = false;

    page.on("console", (msg) => {
      if (msg.text().includes("AudioContext resumed")) {
        audioContextResumed = true;
      }
    });

    await page.goto("/");
    await page.waitForTimeout(2000);

    // Check if audio system initialized
    expect(audioContextResumed).toBe(true);
  });
});

test.describe("Audio Fallback Mechanisms", () => {
  test("should use speech synthesis when audio file missing", async ({
    page,
  }) => {
    // Block specific audio file
    await page.route("**/sounds/test_fallback_item.mp3", (route) =>
      route.abort("failed"),
    );

    let fallbackUsed = false;

    page.on("console", (msg) => {
      if (
        msg.text().includes("speech synthesis") ||
        msg.text().includes("attempting speech")
      ) {
        fallbackUsed = true;
      }
    });

    await page.goto("/?e2e=1");

    // Trigger blocked audio via console
    await page.evaluate(async () => {
      const { soundManager } = window as any;
      try {
        await soundManager.playSound("test_fallback_item");
      } catch (e) {
        console.error("Expected error:", e);
      }
    });

    await page.waitForTimeout(1000);

    // Should have attempted speech synthesis
    expect(fallbackUsed).toBe(true);
  });
});
```

**Add to CI/CD** (`.github/workflows/test.yml`):

```yaml
- name: Run Audio Loading Tests
  run: npm run test:e2e -- audio-loading.spec.ts
  env:
    CI: true
```

**Testing**:

```bash
# Run locally
npm run test:e2e -- audio-loading.spec.ts

# Should pass all tests after fixes applied
```

**Expected Result**:

- ✅ All E2E tests pass
- ✅ No 404 errors detected
- ✅ No "No URL found" warnings
- ✅ Fallback mechanisms work

---

## Implementation Checklist

### Phase 1: Critical Fixes (Day 1)

- [ ] Convert `.mp3` → `.wav` for `wrong`, `success`, `welcome` (or update code)
- [ ] Generate `welcome_evan_intro.mp3`
- [ ] Generate `welcome_sangsom_association.mp3`
- [ ] Generate `welcome_sangsom_association_thai.mp3`
- [ ] Test Welcome Screen audio
- [ ] Test Home Menu audio
- [ ] Verify zero 404 errors

### Phase 2: Name Fixes (Day 1-2)

- [ ] Update `audio-priorities.ts`:
  - [ ] Change `grape` → `grapes`
  - [ ] Change `truck` → `fire truck`
  - [ ] Remove `tomato`, `potato`, `onion`
  - [ ] Remove `bird`, `cow`, `pig`, `sheep`
- [ ] Test gameplay with all categories
- [ ] Verify zero "No URL found" warnings

### Phase 3: Error Handling (Day 2-3)

- [ ] Add speech synthesis fallback to `audio-buffer-loader.ts`
- [ ] Create `validate-audio-files.cjs` script
- [ ] Update `package.json` scripts
- [ ] Create `AudioStatusIndicator.tsx` component
- [ ] Add indicator to `App.tsx`
- [ ] Test fallback mechanisms
- [ ] Test validation script

### Phase 4: Testing (Day 3)

- [ ] Create `audio-loading.spec.ts` E2E tests
- [ ] Run tests locally
- [ ] Add to CI/CD pipeline
- [ ] Verify all tests pass
- [ ] Update documentation

---

## Success Criteria

After all fixes implemented:

1. **Zero Console Errors**:
   - ❌ No `HTTP load failed with status 404` for audio
   - ❌ No `[AudioBufferLoader] No URL found for key`
   - ❌ No `Load of media resource ... failed`

2. **All Features Working**:
   - ✅ Welcome screen plays Teacher Evan intro
   - ✅ Home menu plays Sangsom association (EN + TH)
   - ✅ All game categories have audio
   - ✅ Correct/wrong answer feedback plays

3. **Graceful Degradation**:
   - ✅ Missing files trigger speech synthesis
   - ✅ Users see notification when audio unavailable
   - ✅ Game remains playable without audio

4. **Future-Proofing**:
   - ✅ Validation script prevents missing files
   - ✅ E2E tests catch audio issues
   - ✅ CI/CD pipeline validates audio

---

## Timeline Estimate

| Phase                   | Duration        | Dependencies                            |
| ----------------------- | --------------- | --------------------------------------- |
| Phase 1: Critical Fixes | 2-4 hours       | ELEVENLABS_API_KEY environment variable |
| Phase 2: Name Fixes     | 1-2 hours       | Phase 1 complete                        |
| Phase 3: Error Handling | 4-6 hours       | Phase 2 complete                        |
| Phase 4: Testing        | 3-4 hours       | Phase 3 complete                        |
| **Total**               | **10-16 hours** | ~2-3 days development time              |

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous deployment via Vercel dashboard
2. **Quick Fix**: Disable new welcome audio, use legacy files:

   ```typescript
   // WelcomeScreen.tsx
   await playWithTimeout("welcome_learning", 0.9, 0.85); // Keep using old file

   // use-home-menu-audio.ts
   await soundManager.playSound("welcome_association", 1.0, 0.85); // Keep using old files
   ```

3. **Monitor**: Check error tracking for new audio-related issues
4. **Communication**: Notify users of audio availability issues via status page

---

## Next Steps

After completing this plan:

1. **Monitor Production**:
   - Track audio 404 rate in analytics
   - Monitor speech synthesis fallback usage
   - Watch for user reports of audio issues

2. **Optimization**:
   - Consider audio sprites for faster loading
   - Implement progressive audio loading
   - Add audio preload hints

3. **Future Enhancements**:
   - Multi-language audio generation for all 6 languages
   - Audio caching strategy (Service Worker)
   - Offline audio support (PWA audio cache)

---

**Ready to implement?** Start with Phase 1 (Critical Fixes) and work through sequentially.

Each phase has clear testing checkpoints to ensure fixes work before proceeding.
