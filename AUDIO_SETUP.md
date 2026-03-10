# Audio Setup Guide

This project is happiest when audio is **pre-generated ahead of time** and checked with the repo. Browser-side ElevenLabs calls are still available for local development, but they are optional and not the recommended competition/deployment path.

## Recommended model

1. Use `ELEVENLABS_*` variables for local audio-generation scripts.
2. Generate or refresh audio assets into `sounds/`.
3. Validate assets with `npm run audio:validate`.
4. Treat `VITE_ELEVENLABS_API_KEY` as a **dev-only** opt-in for live browser TTS testing.

## Environment variables

Copy the template first:

```bash
cp .env.example .env
```

Then use this matrix:

| Variable                  | Purpose                          | Required           | Recommended use                   |
| ------------------------- | -------------------------------- | ------------------ | --------------------------------- |
| `ELEVENLABS_API_KEY`      | Node.js audio-generation scripts | Yes for generation | Local asset generation            |
| `ELEVENLABS_MODEL_ID`     | Script model selection           | Usually yes        | Leave at `eleven_multilingual_v2` |
| `ELEVENLABS_VOICE_ID*`    | Per-language generation voices   | Yes for generation | Match `.env.example`              |
| `VITE_ELEVENLABS_API_KEY` | Browser-side live TTS            | No                 | Dev-only diagnostics/testing      |

## Generate assets

Use the current scripts from `package.json`:

```bash
# Welcome / intro assets
npm run audio:generate-welcome

# Full sentence-audio pass
npm run audio:generate

# Validate inventory and naming
npm run audio:validate
```

Notes:

- Generated source assets live in `sounds/`.
- Runtime audio URLs resolve under `/sounds/`.
- For competition builds, prefer shipping assets instead of relying on browser-side premium TTS.

## Development workflow

```bash
npm install
cp .env.example .env
# Fill in ELEVENLABS_API_KEY and voice IDs as needed
npm run audio:generate-welcome
npm run audio:validate
npm run dev
```

If you explicitly want live browser ElevenLabs calls during development, also add:

```env
VITE_ELEVENLABS_API_KEY=your_dev_only_key_here
```

## What to expect at runtime

The audio stack currently prefers:

1. **Pre-generated assets** from the repo/runtime sound path
2. **Live browser ElevenLabs** if `VITE_ELEVENLABS_API_KEY` is present
3. **Web Speech API** fallback

That means hearing Web Speech does **not** always mean the app is broken; it usually means live browser TTS is intentionally disabled or a requested asset is missing.

## Troubleshooting

### I hear Web Speech instead of ElevenLabs

- Confirm the requested asset exists in `sounds/`.
- Run `npm run audio:validate`.
- If you are testing browser-side live TTS, confirm `VITE_ELEVENLABS_API_KEY` is set and restart the dev server.
- Check the console for `[ElevenLabs]` and `[SpeechSynthesizer]` messages.

### Script generation fails

- Confirm `ELEVENLABS_API_KEY` is set in `.env`.
- Run `npm run audio:list-voices` to verify the key.
- Confirm the voice IDs in `.env` match the current language configuration.

### Missing or mismatched audio files

```bash
npm run audio:validate
```

If validation reports gaps, regenerate the welcome slice or the full audio set.

## Production and competition guidance

- Do **not** depend on browser-side premium API keys for competition readiness.
- Generate and verify assets ahead of deployment.
- Keep `.env` uncommitted.
- Use runtime browser TTS only as a local development fallback or diagnostic aid.

## Related references

- `README.md` — concise onboarding and command map
- `DOCS/A-README.md` — docs index
- `DOCS/CODEBASE_INDEX.md` — codebase navigation guide
- `CONSOLE_EXAMPLES.md` — current audio log reference
