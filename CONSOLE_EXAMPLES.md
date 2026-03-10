# Console Output Reference

This file is a compact reference for current audio-related console messages.

## Source-of-truth note

For live setup instructions, use:

- `AUDIO_SETUP.md`
- `.env.example`
- `README.md`

This file is only a log-pattern reference.

## Common scenarios

### Live browser ElevenLabs disabled

```text
[ElevenLabs] Live browser TTS is disabled. Set VITE_ELEVENLABS_API_KEY in .env only if you need on-demand ElevenLabs testing during development.
Production and competition builds should prefer pre-generated audio assets.
See AUDIO_SETUP.md and .env.example for the current setup.

[ElevenLabs] Skipping connection test - no API key configured

[SpeechSynthesizer] Live ElevenLabs TTS unavailable - using Web Speech API fallback.
Set VITE_ELEVENLABS_API_KEY only for development-time browser TTS.
```

### Valid live browser key

```text
[ElevenLabs] API connection successful ✓
```

### Invalid or expired live browser key

```text
[ElevenLabs] API connection failed with status 401.
Please check your API key validity at https://elevenlabs.io
```

### Network problem reaching ElevenLabs

```text
[ElevenLabs] API connection error: Failed to fetch
```

### Web Speech fallback in use

```text
[SpeechSynthesizer] Using Web Speech API for "In association with Sangsom Kindergarten..."
```

## Home menu audio messages

Typical messages:

```text
[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] Playing Thai association message
[HomeMenuAudio] Audio sequence completed
```

If an asset is missing, the warning should point to the sound key or file path. Start with:

```text
npm run audio:validate
```

## Fast diagnosis table

| Symptom                          | Likely message                         | Next step                                                  |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Web Speech instead of ElevenLabs | `Live ElevenLabs TTS unavailable`      | Confirm whether live browser TTS is intentionally disabled |
| Browser TTS test not working     | `API connection failed` or `error`     | Check `VITE_ELEVENLABS_API_KEY` and restart dev server     |
| Missing welcome/menu audio       | home-menu audio warnings               | Run `npm run audio:validate` and regenerate assets         |
| General audio drift              | mixed `[ElevenLabs]` and fallback logs | Re-read `AUDIO_SETUP.md` and confirm `.env` usage          |

## Debugging tips

1. Open browser DevTools.
2. Filter by `ElevenLabs`, `SpeechSynthesizer`, or `HomeMenuAudio`.
3. Check the Network tab for `/sounds/` failures.
4. Use `AUDIO_SETUP.md` for the current env model.

## Production note

Most of these messages are development-focused and sit behind `import.meta.env.DEV`. Production and competition builds should rely on verified assets instead of browser-side premium TTS.
