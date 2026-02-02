# Console Output Examples

This document shows examples of console messages you'll see with the improved audio logging.

## Scenario 1: No ElevenLabs API Key (Current Issue)

### Before Changes
```
(Silent failure - no indication why robotic voice is being used)
```

### After Changes
```javascript
[ElevenLabs] API key not configured. Set VITE_ELEVENLABS_API_KEY in .env file.
Audio will fall back to Web Speech API (robotic voice).
See .env.example for configuration details.

[ElevenLabs] Skipping connection test - no API key configured

[SpeechSynthesizer] ElevenLabs unavailable - using Web Speech API fallback.
For high-quality voice: Configure VITE_ELEVENLABS_API_KEY in .env

[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] English association audio not available: Failed to load audio
Make sure welcome_sangsom_association.mp3 exists in public/sounds/

[HomeMenuAudio] Playing Thai association message
[HomeMenuAudio] Thai association audio not available: Failed to load audio
Make sure welcome_sangsom_association_thai.mp3 exists in public/sounds/

[HomeMenuAudio] Audio sequence completed
```

## Scenario 2: Valid API Key, Missing Audio Files

### Console Output
```javascript
[ElevenLabs] API connection successful ✓

[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] English association audio not available: Failed to load audio
Make sure welcome_sangsom_association.mp3 exists in public/sounds/

[SpeechSynthesizer] Using Web Speech API for "In association with Sangsom Kindergarten..."

[HomeMenuAudio] Playing Thai association message
[HomeMenuAudio] Thai association audio not available: Failed to load audio
Make sure welcome_sangsom_association_thai.mp3 exists in public/sounds/

[SpeechSynthesizer] Using Web Speech API for "ร่วมกับโรงเรียนอนุบาลสังสม"

[HomeMenuAudio] Audio sequence completed
```

## Scenario 3: Everything Working (Ideal State)

### Console Output
```javascript
[ElevenLabs] API connection successful ✓

[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] Playing Thai association message
[HomeMenuAudio] Audio sequence completed
```

## Scenario 4: Invalid/Expired API Key

### Console Output
```javascript
[ElevenLabs] API connection failed with status 401.
Please check your API key validity at https://elevenlabs.io

[SpeechSynthesizer] ElevenLabs unavailable - using Web Speech API fallback.
For high-quality voice: Configure VITE_ELEVENLABS_API_KEY in .env

[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[SpeechSynthesizer] Using Web Speech API for "In association with Sangsom Kindergarten..."
[HomeMenuAudio] Playing Thai association message
[SpeechSynthesizer] Using Web Speech API for "ร่วมกับโรงเรียนอนุบาลสังสม"
[HomeMenuAudio] Audio sequence completed
```

## Scenario 5: Network Error (Can't Reach ElevenLabs)

### Console Output
```javascript
[ElevenLabs] API connection error: Failed to fetch

[SpeechSynthesizer] ElevenLabs unavailable - using Web Speech API fallback.
For high-quality voice: Configure VITE_ELEVENLABS_API_KEY in .env

[HomeMenuAudio] Resuming suspended AudioContext
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] English association audio not available: Failed to load audio
Make sure welcome_sangsom_association.mp3 exists in public/sounds/

[SpeechSynthesizer] Using Web Speech API for "In association with Sangsom Kindergarten..."
```

## Message Breakdown

### `[ElevenLabs]` Messages
- **Source**: `src/lib/audio/speech/elevenlabs-client.ts`
- **Purpose**: Indicates ElevenLabs API status
- **Action**: Check API key configuration if you see warnings

### `[SpeechSynthesizer]` Messages
- **Source**: `src/lib/audio/speech-synthesizer.ts`
- **Purpose**: Shows which audio synthesis method is being used
- **Action**: If seeing "Web Speech API", check ElevenLabs configuration

### `[HomeMenuAudio]` Messages
- **Source**: `src/hooks/use-home-menu-audio.ts`
- **Purpose**: Tracks home menu audio playback sequence
- **Action**: If files are missing, run `npm run audio:generate-welcome`

### `[WelcomeScreen]` Messages
- **Source**: `src/components/WelcomeScreen.tsx`
- **Purpose**: Tracks welcome screen audio sequence
- **Action**: Check welcome audio files if you see errors

## Production Mode

In production builds (`npm run build`), these console messages are automatically suppressed since they're behind `import.meta.env.DEV` checks. Only critical errors will be logged.

## Debugging Tips

1. **Open Browser DevTools**: Press F12 to see console
2. **Filter by Component**: Use filter box to search for specific messages (e.g., "ElevenLabs", "HomeMenuAudio")
3. **Check Network Tab**: Look for failed audio file requests
4. **Verify Environment**: Type `import.meta.env.VITE_ELEVENLABS_API_KEY` in console (will be undefined if not set)

## Quick Diagnosis

| Symptom | Console Message | Solution |
|---------|----------------|----------|
| Robotic voice | "ElevenLabs unavailable" | Add API key to .env |
| No audio on home screen | "audio not available" | Generate audio files |
| API key warning | "API key not configured" | Create .env file |
| 401 error | "connection failed with status 401" | Check API key validity |
| Network error | "connection error: Failed to fetch" | Check internet connection |
