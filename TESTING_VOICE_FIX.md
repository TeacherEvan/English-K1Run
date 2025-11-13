# Manual Testing Guide: Voice Playback Fix

## Issue Fixed
Voice/sound stops playing after first target has been selected.

## Root Cause
The `speakWithSpeechSynthesis` method was calling `synth.cancel()` before every speech utterance, which cancelled all ongoing speech including phonics sequences. This caused:
1. Phonics interruption when new targets were announced
2. Potential breaking of speech synthesis queue
3. Missing voice announcements for subsequent targets

## Changes Made
- **File**: `src/lib/sound-manager.ts`
- **Change**: Removed `synth.cancel()` call from `speakWithSpeechSynthesis` method (line 527)
- **Reason**: Web Speech API naturally queues utterances, so manual cancellation is unnecessary and harmful

## Testing Steps

### Prerequisites
1. Open the application in a browser (Chrome, Firefox, Safari, or Edge)
2. Ensure browser has audio enabled and volume is up
3. Click anywhere on the page to unlock audio context (required for Web Audio API)

### Test Case 1: First Target Announcement
**Expected**: Voice announces the first target when game starts

1. Click "Level 1 - Fruits & Vegetables" to select the level
2. Click "🚀 Start Race" button
3. **Listen**: Should hear a sentence like "I eat a red apple"
4. **Result**: ✅ PASS if voice plays, ❌ FAIL if silent

### Test Case 2: Phonics Playback on Correct Tap
**Expected**: Phonics sequence plays completely without interruption

1. Continue from Test Case 1
2. Wait for emojis to fall from the top
3. Tap a correct emoji that matches the target (e.g., 🍎 apple)
4. **Listen**: Should hear phonics sequence "Aah! Aah! - Apple!" with cha-ching background sound
5. **Result**: ✅ PASS if full phonics plays, ❌ FAIL if interrupted or cut off

### Test Case 3: Second Target Announcement
**Expected**: New target announces immediately after correct tap

1. Continue from Test Case 2
2. After tapping the correct object, a new target should appear at the top
3. **Listen**: Should hear new target announcement (e.g., "The banana is yellow and sweet")
4. **Result**: ✅ PASS if voice plays, ❌ FAIL if silent

### Test Case 4: Rapid Tapping
**Expected**: All voices queue and play in sequence

1. Continue playing the game
2. Quickly tap multiple correct objects in succession
3. **Listen**: Should hear:
   - Phonics for first tap
   - New target announcement
   - Phonics for second tap
   - New target announcement
   - Etc.
4. **Result**: ✅ PASS if all voices play (may queue up), ❌ FAIL if voices cut out

### Test Case 5: Multiple Targets
**Expected**: Every target change triggers voice announcement

1. Continue playing for 5-10 correct taps
2. **Listen**: Each new target should announce
3. Count how many distinct target announcements you hear
4. Compare with number of correct taps made
5. **Result**: ✅ PASS if announcements match targets, ❌ FAIL if some are silent

### Test Case 6: Different Categories
**Expected**: Voice works across all game categories

1. Return to menu (top-left "Back to Levels" button if needed, or refresh page)
2. Try "Level 2 - Counting Fun"
3. Start race and tap correct numbers
4. **Listen**: Should hear number pronunciations (e.g., "one", "two", "three")
5. Repeat with "Level 3 - Shapes & Colors"
6. **Result**: ✅ PASS if all categories work, ❌ FAIL if any are silent

## Debug Tools

### Browser Console
Open browser DevTools (F12) and check console for:
- `[SoundManager]` prefixed messages showing audio system status
- Any error messages related to audio playback
- Look for "Speech synthesis" messages indicating successful voice playback

### In-Game Tracker
The "Emoji Rotation & Audio Tracker" panel on the right shows:
- **Audio Playback**: Total, Success, Failed counts
- Monitor these numbers during testing
- High "Failed" count indicates audio issues

### Expected Console Output
```
[SoundManager] Registered 241 audio aliases from 218 files
[SoundManager] Audio context created, state: suspended
[SoundManager] User interaction detected, initializing audio...
[SoundManager] Audio context resumed, state: running
[SoundManager] Using sentence template for "apple": "I eat a red apple"
[SoundManager] Started speaking: "I eat a red apple"
[SoundManager] Finished speaking: "I eat a red apple"
[SoundManager] Played with phonics: Aah Aah - Apple
```

## Known Behavior

### Queueing
With the fix, utterances now queue naturally:
- If you tap rapidly, voices will queue up and play in sequence
- This is **expected behavior** and ensures no voices are lost
- On slower devices, you may notice a slight delay as the queue plays out

### Background Sounds
- Correct taps play "cha-ching" sound at 30% volume while phonics play at 100%
- This creates layered audio - background celebration sound + clear voice pronunciation

## Troubleshooting

### No Audio At All
1. Check browser volume and unmute
2. Click anywhere on page to unlock audio context
3. Check browser console for errors
4. Try refreshing page and clicking before starting game

### Partial Audio
1. Check "Audio Playback Failed" count in tracker
2. Look for console errors about missing audio files
3. Verify internet connection (audio files load from server)

### Distorted/Fast Voice
1. This fix ensures voices play at correct speed (0.8x for educational content)
2. If voice sounds wrong, report browser version and OS

## Report Results

When reporting test results, please include:
1. Browser name and version (e.g., "Chrome 120.0.6099.109")
2. Operating System (e.g., "Windows 11", "macOS 14.0", "Android 13")
3. Which test cases passed/failed
4. Any console errors observed
5. Audio Playback tracker statistics (Total/Success/Failed counts)
