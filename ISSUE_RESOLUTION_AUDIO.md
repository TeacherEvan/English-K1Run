# Audio Issue Resolution Summary

This is a compact historical summary of the earlier "robotic voice" investigation.

## Original issue

The app was falling back to Web Speech more often than expected, and the documentation around ElevenLabs setup had drifted.

## Root causes identified

1. Browser-side live ElevenLabs TTS depended on `VITE_ELEVENLABS_API_KEY`.
2. Audio-generation scripts depended on `ELEVENLABS_*` variables.
3. Documentation mixed those two models together.
4. Some older notes described missing assets and paths inconsistently.

## What changed afterward

- Runtime warnings were made more explicit.
- The audio setup docs were rewritten around a pre-generated asset workflow.
- `.env.example` was aligned with the script workflow and dev-only browser TTS guidance.
- A codebase/docs index was added so setup guidance is easier to find.

## Current source of truth

For active instructions, use:

- `AUDIO_SETUP.md`
- `.env.example`
- `README.md`
- `DOCS/CODEBASE_INDEX.md`

## Current recommended model

1. Use `ELEVENLABS_*` variables for local Node.js generation scripts.
2. Generate and validate audio assets ahead of time.
3. Treat `VITE_ELEVENLABS_API_KEY` as an optional dev-only browser TTS flag.
4. Do not rely on browser-side premium API keys for competition readiness.

## If the issue reappears

Start here:

```text
npm run audio:validate
```

Then check:

1. `AUDIO_SETUP.md`
2. `CONSOLE_EXAMPLES.md`
3. `src/lib/audio/speech/elevenlabs-client.ts`
4. `src/lib/audio/speech-synthesizer.ts`

## Historical note

This file intentionally avoids repeating outdated setup steps. It exists to preserve the incident summary without competing with the current docs. Less duplication, fewer traps — a rare bargain.
