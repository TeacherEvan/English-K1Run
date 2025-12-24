# Audio Optimization - November 2025

## Overview

This update enables simultaneous playback of background sound effects and voice phonics, addressing the user request to "make sure more than one sound files play at once".

## Changes Implemented

### 1. Concurrent Audio Playback

**File**: `src/lib/sound-manager.ts`

Modified `playWithPhonics` to play the background sound **concurrently** with the phonics sequence, instead of sequentially.

**Before**:

```typescript
if (backgroundSound) {
    const originalVolume = this.volume
    this.volume = 0.3
    await this.playWord(backgroundSound) // Blocked execution
    this.volume = originalVolume
}
await this.playSpeech(sound1, ...)
```

**After**:

```typescript
if (backgroundSound) {
    // Fire and forget - plays in background
    this.playWord(backgroundSound, 0.3).catch(e => console.warn(e))
}
await this.playSpeech(sound1, ...) // Plays immediately
```

### 2. Volume Override System

**File**: `src/lib/sound-manager.ts`

Updated core audio methods to accept an optional `volumeOverride` parameter. This allows specific sounds (like background effects) to play at reduced volume without modifying the global `this.volume` state, which prevents race conditions during concurrent playback.

Methods updated:

- `playWord(phrase, volumeOverride)`
- `playVoiceClip(name, ..., volumeOverride)`
- `playWithHtmlAudio(key, ..., volumeOverride)`
- `startBuffer(buffer, ..., volumeOverride)`
- `speakWithSpeechSynthesis(text, volumeOverride)`

### 3. Restored Background Sound

**File**: `src/hooks/use-game-logic.ts`

Restored the background sound call for correct taps, using `'success'` instead of the missing `'cha-ching'`.

```typescript
// Correct tap: play phonics pronunciation with success background sound
void playSoundEffect.voiceWithPhonics(tappedObject.type, 'success')
```

## Benefits

- **Rich Audio Experience**: Users hear both the celebratory sound effect and the educational phonics simultaneously.
- **Clear Voice**: Phonics remain at 100% volume while background sound is ducked to 30%.
- **No Delays**: Phonics start immediately upon tap, without waiting for the sound effect to finish.
- **Robustness**: Using `volumeOverride` prevents volume state issues.
