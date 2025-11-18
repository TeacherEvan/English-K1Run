# Audio Bug Fix - November 2025

## Issue Report
**Problem**: The word "coin" was being repeated by the voice system during gameplay, causing audio confusion for kindergarten students.

## Investigation Summary

### Root Causes Identified

1. **Missing/Broken Audio File**: `sounds/cha-ching.wav` was a 0-byte empty file
2. **No coin.wav File**: No actual `coin.wav` sound file existed in the repository
3. **Redundant Audio Call**: `AchievementDisplay` component was calling `playSoundEffect.coin()` on every achievement popup
4. **Speech Synthesis Fallback**: When audio files don't exist, the system falls back to speech synthesis, causing unexpected voice playback

### Audio Flow That Caused the Bug

When a correct object was tapped, the following sequence occurred:

1. **First Audio Call** (in `use-game-logic.ts` line 844):
   ```typescript
   playSoundEffect.voiceWithPhonics(tappedObject.type, 'cha-ching')
   ```
   - Attempts to play target word with phonics pronunciation
   - Attempts to play 'cha-ching' as background sound at 30% volume
   - Since `cha-ching.wav` was 0 bytes, the file load failed
   - System fell back to speech synthesis for "cha-ching"

2. **Second Audio Call** (in `AchievementDisplay.tsx` line 49):
   ```typescript
   playSoundEffect.coin()
   ```
   - Achievement popup mounts and calls coin sound
   - No `coin.wav` file exists
   - System falls back to **speech synthesis speaking "coin"** ← **THE BUG**

### Why "coin" Was Heard

The speech synthesis fallback in `playWord()` function (sound-manager.ts line 767) would:
1. Check for audio file - fails (no coin.wav)
2. Try multi-word split - not applicable (single word)
3. Fall back to `speakWithSpeechSynthesis('coin')` - **speaks "coin" audibly**

## Fixes Implemented

### 1. Removed Redundant Audio Call from AchievementDisplay

**File**: `src/components/AchievementDisplay.tsx`

**Before**:
```typescript
useEffect(() => {
  // Play coin sound effect for both correct taps and worm taps (500ms duration)
  void playSoundEffect.coin()
  
  // Auto-dismiss after 500ms to match coin sound duration
  const timer = window.setTimeout(onDismiss, 500)
  return () => window.clearTimeout(timer)
}, [achievement.id, onDismiss])
```

**After**:
```typescript
useEffect(() => {
  // Auto-dismiss after 500ms to match animation duration
  // Note: Correct taps already play phonics pronunciation via voiceWithPhonics in use-game-logic
  // Worm taps don't need separate audio (visual feedback is sufficient)
  const timer = window.setTimeout(onDismiss, 500)
  return () => window.clearTimeout(timer)
}, [achievement.id, onDismiss])
```

**Also removed** unused import:
```typescript
// Removed: import { playSoundEffect } from '../lib/sound-manager'
```

### 2. Removed Background Sound from voiceWithPhonics

**File**: `src/hooks/use-game-logic.ts`

**Before**:
```typescript
// Correct tap: play phonics pronunciation with cha-ching background sound
// Example: "Aah! Aah! - Apple!" with cha-ching playing at 30% volume
void playSoundEffect.voiceWithPhonics(tappedObject.type, 'cha-ching')
```

**After**:
```typescript
// Correct tap: play phonics pronunciation
// Example: "Aah! Aah! - Apple!"
void playSoundEffect.voiceWithPhonics(tappedObject.type)
```

**Rationale**: Since the `cha-ching.wav` file was empty (0 bytes) and was causing fallback issues, removing the background sound parameter prevents any confusion. The phonics pronunciation alone provides sufficient audio feedback.

### 3. Cleaned Up playSoundEffect Exports

**File**: `src/lib/sound-manager.ts`

**Removed exports**:
```typescript
// REMOVED:
chaChing: () => soundManager.playWord('cha-ching'),
coin: () => soundManager.playWord('coin'), // Slot machine coin sound for achievements
```

**Current exports** (kept):
```typescript
export const playSoundEffect = {
    voice: (phrase: string) => soundManager.playWord(phrase),
    voiceWithPhonics: (word: string, backgroundSound?: string) => soundManager.playWithPhonics(word, backgroundSound),
    sticker: () => {
        // Play excited "GIVE THEM A STICKER!" voice using speech synthesis
        soundManager.playSpeech('GIVE THEM A STICKER!', { pitch: 1.2, rate: 1.1 })
    }
    // Other sound effects (coin, chaChing, tap, success, wrong, win) removed - only target pronunciation allowed
}
```

### 4. Removed Special Coin Handling

**File**: `src/lib/sound-manager.ts` - `playWord()` function

**Removed**:
```typescript
// Special handling for coin sound - play at normal speed (1.0x) to match animation timing
const normalizedPhrase = trimmed.toLowerCase()
const isCoinSound = normalizedPhrase === 'coin'
const playbackRate = isCoinSound ? 1.0 : 0.8 // Coin at normal speed, educational content at 0.8x
const maxDuration = isCoinSound ? 500 : undefined // Coin sounds limited to 500ms max
```

**Simplified to**:
```typescript
const normalizedPhrase = trimmed.toLowerCase()
```

All audio now uses consistent 0.8x playback rate for clear kindergarten comprehension.

### 5. Deleted Zero-Byte Audio File

**Deleted**: `sounds/cha-ching.wav` (0 bytes)

This file was empty and causing audio loading failures. Removed to prevent fallback issues.

### 6. Fixed QuickDebug Test Audio

**File**: `src/components/QuickDebug.tsx`

**Before**:
```typescript
const testAudio = async () => {
    try {
        await soundManager.ensureInitialized()
        await playSoundEffect.tap()  // ❌ tap() method doesn't exist
        setAudioStatus('Audio Working!')
    } catch (error) {
        setAudioStatus(`Audio Error: ${error}`)
    }
}
```

**After**:
```typescript
const testAudio = async () => {
    try {
        await soundManager.ensureInitialized()
        // Test audio with a simple word pronunciation
        await soundManager.playWord('test')
        setAudioStatus('Audio Working!')
    } catch (error) {
        setAudioStatus(`Audio Error: ${error}`)
    }
}
```

## Audio System Architecture (Current State)

### Remaining Audio Calls

All audio calls in the application:

1. **Target Announcements** (`use-game-logic.ts` line 385):
   ```typescript
   playSoundEffect.voice(gameState.currentTarget)
   ```
   Announces the current target when it changes.

2. **Correct Tap Feedback** (`use-game-logic.ts` line 844):
   ```typescript
   playSoundEffect.voiceWithPhonics(tappedObject.type)
   ```
   Plays phonics breakdown then full word pronunciation (e.g., "Aah! Aah! - Apple!").

3. **Winner Sticker Announcement** (`FireworksDisplay.tsx` line 108):
   ```typescript
   playSoundEffect.sticker()
   ```
   Plays "GIVE THEM A STICKER!" celebration voice using speech synthesis.

### Audio Playback Priorities

The `playWord()` function follows this priority order:

1. **Sentence Template** - Educational context phrases (if available)
2. **WAV File** - Pre-recorded voice pronunciation
3. **Speech Synthesis** (multi-word) - For phrases without audio files
4. **Individual Word Buffers** (multi-word) - Break phrase into words and play sequentially
5. **Speech Synthesis** (single word) - Last resort for single words
6. **Fallback Tone** - Web Audio synthesized tone if all else fails

### Speech Synthesis Behavior

**Important**: Speech synthesis does NOT cancel ongoing speech (see `sound-manager.ts` line 527):
```typescript
// Don't cancel ongoing speech - this interrupts phonics sequences and target announcements
// The Web Speech API will queue utterances naturally
synth.speak(utterance)
```

This allows phonics sequences to play in order without interruption.

## Testing Recommendations

### Manual Testing Checklist

- [ ] **Start a game** - Target announcement should play clearly
- [ ] **Tap correct object** - Should hear phonics breakdown + full word (e.g., "Aah! Aah! - Apple!")
- [ ] **Verify NO "coin" voice** - Should NOT hear "coin" spoken by speech synthesis
- [ ] **Achievement popup appears** - Should show coin animation with NO additional audio
- [ ] **Tap worm** - Should show achievement popup with NO audio (visual feedback only)
- [ ] **Win the game** - Should hear "GIVE THEM A STICKER!" with fireworks
- [ ] **QuickDebug test** - Click "Test Audio" button, should hear "test" pronounced

### Known Good Behaviors

✅ **Phonics pronunciation** plays for correct taps (human voice priority)
✅ **Target announcements** use sentence templates when available
✅ **Speech synthesis** only used as fallback, not for every sound
✅ **No overlapping voices** from duplicate audio calls
✅ **Visual feedback** (coin animation) works without audio pollution

## Files Modified

1. `src/components/AchievementDisplay.tsx` - Removed coin sound call
2. `src/hooks/use-game-logic.ts` - Removed cha-ching background parameter
3. `src/lib/sound-manager.ts` - Removed coin/chaChing exports and special handling
4. `src/components/QuickDebug.tsx` - Fixed test audio to use valid method
5. `sounds/cha-ching.wav` - Deleted 0-byte file

## Build Verification

✅ **Build successful** - No TypeScript errors
✅ **Linter passed** - Only pre-existing warnings (unrelated to changes)
✅ **No new console errors** - Clean build output
✅ **Bundle size maintained** - No significant size increase

## Related Documentation

See also:
- `PERFORMANCE_OPTIMIZATION_OCT2025.md` - Previous audio system optimizations
- `VERCEL_AUDIO_DEBUG.md` - Audio troubleshooting guide for BenQ displays
- `src/lib/constants/phonics-map.ts` - Phonics pronunciation mappings
- `src/lib/constants/sentence-templates.ts` - Educational sentence templates

## Conclusion

The "coin" voice bug was caused by a combination of missing audio files and redundant audio calls. By removing the unnecessary `coin()` sound from achievement popups and cleaning up the audio system exports, we've eliminated the duplicate voice issue while maintaining all essential audio feedback for educational gameplay.

The fixes are minimal, surgical changes that preserve the phonics pronunciation system and target announcements while removing the confusing extra audio.
