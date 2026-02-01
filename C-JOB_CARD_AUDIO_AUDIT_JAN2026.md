# Job Card: Audio System Audit & Refactoring

**Date:** 2026-01-31  
**Status:** Partially Complete  
**Assignee:** Kilo Code (Architect/Code Mode)

---

## 1. Summary of Work Completed

### Audio System Audit

Performed comprehensive audit of the audio system to verify:

- Sound asset triggers at designated gameplay events
- Audio controller scripts adhere to 200-line limit
- Integration is seamless without conflicts or performance degradation
- File integrity and proper codec encoding
- Audio trigger accuracy and loop functionality
- Script architecture and clean code principles

### Critical Issues Discovered

| Priority     | Issue                                        | Impact                             |
| ------------ | -------------------------------------------- | ---------------------------------- |
| **CRITICAL** | `sounds/` directory completely missing       | All audio file requests return 404 |
| **CRITICAL** | WelcomeScreen expects `welcome_learning.wav` | Audio sequence times out after 10s |
| **CRITICAL** | Audio registry globs `../../../sounds/*`     | Zero audio files registered        |

### Error Analysis

Console errors confirmed:

- HTTP 404 for `success.mp3`, `wrong.mp3`, `welcome.mp3` - files don't exist
- `AudioContext was prevented from starting automatically` - expected behavior (requires user gesture)
- `Audio sequence failed: Error: Sequence timeout after 10s` - caused by missing `welcome_learning.wav`
- Safety timers triggering as fallback - working as designed

---

## 2. Refactoring Completed

### speech-synthesizer.ts

- **Before:** 494 lines (147% over 200-line limit)
- **After:** 188 lines (✓ under limit)
- **New modules created:**
  - `src/lib/audio/speech/elevenlabs-client.ts` (147 lines) - ElevenLabs API communication
  - `src/lib/audio/speech/web-speech-client.ts` (133 lines) - Web Speech API fallback

### audio-sprite.ts

- **Before:** 402 lines (101% over limit)
- **After:** 127 lines (✓ under limit)
- **New modules created:**
  - `src/lib/audio/sprite/sprite-types.ts` (34 lines) - Type definitions
  - `src/lib/audio/sprite/sprite-loader.ts` (132 lines) - Manifest/audio loading
  - `src/lib/audio/sprite/sprite-player.ts` (175 lines) - Playback engine

---

## 3. Files Still Over 200-Line Limit

| File                     | Lines | Over Limit |
| ------------------------ | ----- | ---------- |
| sound-manager.ts         | 409   | 105%       |
| audio-player.ts          | 321   | 61%        |
| speech-playback.ts       | 289   | 45%        |
| audio-registry.ts        | 265   | 33%        |
| sound-playback-engine.ts | 243   | 22%        |
| word-playback.ts         | 207   | 4%         |

---

## 4. Root Cause Analysis

The user removed the `sounds/` directory to eliminate "unnecessary" audio files. This caused:

1. Vite's `import.meta.glob('../../../sounds/*')` to register zero audio files
2. All playback attempts to fall back to speech synthesis
3. WelcomeScreen's `playWithTimeout('welcome_learning')` to hang for 10s
4. Safety timers to trigger, masking the real issue

---

## 5. Recommendations

### Immediate (Critical)

1. **Restore minimal audio files** to `sounds/` directory:
   - `welcome_learning.wav` (or update WelcomeScreen to use different audio)
   - `success.wav`, `wrong.wav`, `win.wav`, `tap.wav` (game feedback sounds)

2. **Alternative:** Update WelcomeScreen to gracefully skip audio if files missing

### Short-term

1. Continue refactoring remaining oversized files:
   - Split `sound-manager.ts` into state manager + playback coordinator
   - Split `audio-player.ts` into Web Audio player + HTML Audio player
   - Split `audio-registry.ts` into file discovery + key resolution modules

2. Add audio file existence checks before playback to prevent timeouts

### Long-term

1. Consider audio sprite consolidation for production deployment
2. Implement proper audio loading states in UI
3. Add audio file integrity validation at build time

---

## 6. Files Under 200-Line Limit (Verified ✓)

- types.ts: 97 lines
- index.ts: 52 lines
- audio-context-manager.ts: 164 lines
- audio-loader.ts: 23 lines
- audio-buffer-loader.ts: 197 lines
- audio-preloader.ts: 140 lines
- audio-priorities.ts: 128 lines
- audio-accessibility.ts: 92 lines
- audio-key-prefetcher.ts: 102 lines
- speech-synthesizer.ts: 188 lines (refactored)
- audio-sprite.ts: 127 lines (refactored)

---

## 7. Next Steps

1. Create `sounds/` directory with required files OR modify WelcomeScreen
2. Continue refactoring remaining 6 oversized files
3. Verify audio trigger mapping against gameplay events
4. Test fallback chain: Web Audio → HTMLAudio → Speech Synthesis

---

## 8. Architecture Notes

The audio system follows a well-designed modular architecture:

- **audio-context-manager.ts:** Handles AudioContext lifecycle
- **audio-buffer-loader.ts:** Manages buffer caching and loading
- **audio-player.ts:** Web Audio API + HTMLAudio fallback
- **speech-synthesizer.ts:** ElevenLabs API + Web Speech API fallback
- **sound-manager.ts:** High-level orchestration layer

Refactoring maintains public API compatibility while improving maintainability.

---

## 9. Updates (2026-02-02)

- Added public /sounds fallback resolution in the audio registry to recover missing welcome audio at runtime.
- Home menu association playback now uses welcome_sangsom_association and welcome_sangsom_association_thai.
- Disabled target spawn audio trigger to stop repeated “Target spawned” playback.

---

## Related Documentation

- `DOCS/AUDIO_AND_LOADING_ENHANCEMENTS_PLAN.md`
- `DOCS/AUDIO_MODULE_REFACTORING_REPORT.md`
- `DOCS/TEST_FAILURES_FIX_JAN2026.md`
- `plans/audio-loading-issues-analysis-jan2026.md`
- `plans/audio-loading-fixes-implementation-plan.md`
