# Audio Sprites (Optional)

This project supports an **optional Audio Sprite** mode: multiple sound effects / voice clips can be bundled into a single large audio file (e.g. `sprite.mp3`) plus a JSON manifest (`sprite.json`) that defines exact clip boundaries.

## Why

- Fewer HTTP requests (important on tablets / classroom networks)
- Faster warm-start once the sprite is cached
- Predictable playback offsets (Web Audio) for short SFX

## How it works

- When enabled, the game will **try** to play a requested sound/word from the sprite first.
- If a clip is missing (or the sprite fails), it automatically falls back to the existing per-file audio loading and finally to tones / speech synthesis.

## Enable via env vars

Add these to your Vite environment (e.g. `.env.local`):

- `VITE_AUDIO_SPRITE_ENABLED=1`
- `VITE_AUDIO_SPRITE_URL=/audio-sprites/sprite.mp3`
- `VITE_AUDIO_SPRITE_MANIFEST_URL=/audio-sprites/sprite.json`

## Manifest format

See `sprite.example.json` for a minimal example.

```json
{
  "version": 1,
  "spriteUrl": "/audio-sprites/sprite.mp3",
  "clips": {
    "tap": { "start": 0.0, "end": 0.12 },
    "success": { "start": 0.12, "end": 0.85 },
    "welcome": { "start": 0.85, "end": 5.9 }
  }
}
```

Times are in **seconds**.

## Notes

- Web Audio is preferred for accurate trimming; HTMLAudio is used as fallback.
- Keep clips slightly padded (e.g. +10–30ms) to avoid cutting consonants.

## Accessibility: audio descriptions

If you want a lightweight "audio description" fallback (speech / screen reader announcement) when audio is missing, enable:

- `VITE_AUDIO_DESCRIPTIONS=1`

Or set `localStorage.k1run_audio_descriptions = "1"`.
