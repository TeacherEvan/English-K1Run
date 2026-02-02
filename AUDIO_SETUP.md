# Audio Setup Guide

This guide explains how to set up the audio system for English-K1Run to use high-quality ElevenLabs voices instead of the robotic Web Speech API fallback.

## Quick Start

### 1. Get an ElevenLabs API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Navigate to your profile settings
3. Copy your API key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your API key:

```env
VITE_ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=zmcVlqmyk3Jpn5AVYcAL
```

### 3. Generate Audio Files

The application requires pre-generated audio files for optimal performance. Generate them using:

```bash
# Generate welcome/intro audio files
npm run audio:generate-welcome

# Generate all game audio files (190+ files for emojis, numbers, letters)
npm run audio:generate
```

This will create audio files in the `sounds/` directory.

### 4. Start Development Server

```bash
npm run dev
```

## Audio System Architecture

### Audio Priority Chain

The application uses a multi-tier audio system:

1. **Pre-generated Audio Files** (Preferred)
   - Located in `public/sounds/` or `sounds/`
   - High-quality ElevenLabs-generated MP3/WAV files
   - Loaded and cached for instant playback

2. **Live ElevenLabs API** (Fallback #1)
   - Requires `VITE_ELEVENLABS_API_KEY` in environment
   - Generates audio on-demand if files are missing
   - Caches generated audio in memory

3. **Web Speech API** (Fallback #2)
   - Browser's built-in text-to-speech
   - Robotic voice quality
   - Used when ElevenLabs is unavailable

### Critical Audio Files

#### Welcome Screen Audio
- `sounds/welcome_evan_intro.mp3` - "Welcome to Teacher Evan's Super Student..."
- Required for the initial welcome screen

#### Home Menu Audio
- `sounds/welcome_sangsom_association.mp3` - English association message
- `sounds/welcome_sangsom_association_thai.mp3` - Thai association message
- Plays automatically when entering the home menu

#### Gameplay Audio (190+ files)
- Emoji pronunciations: `emoji_apple.mp3`, `emoji_banana.mp3`, etc.
- Number pronunciations: `number_1.mp3`, `number_2.mp3`, etc.
- Letter pronunciations: `letter_a.mp3`, `letter_b.mp3`, etc.
- Shape pronunciations: `shape_circle.mp3`, `shape_square.mp3`, etc.

## Troubleshooting

### "Robotic voice" issue

**Symptom**: Hearing robotic Web Speech API voice instead of natural ElevenLabs voice.

**Solution**:
1. Check console for warnings about missing API key
2. Verify `.env` file exists and contains `VITE_ELEVENLABS_API_KEY`
3. Restart dev server after modifying `.env`
4. Check browser console for ElevenLabs connection status

### "Wrong audio playing on home window"

**Symptom**: Home menu plays incorrect or no audio.

**Causes**:
1. Missing audio files: `welcome_sangsom_association.mp3` and `welcome_sangsom_association_thai.mp3`
2. Files exist but have wrong content
3. Audio files not being loaded properly

**Solution**:
```bash
# Regenerate welcome audio files
npm run audio:generate-welcome

# Verify files exist
ls -la sounds/welcome_*.mp3

# Check console for detailed error messages
```

### API Key Not Working

**Symptom**: Console shows "ElevenLabs API connection failed"

**Checklist**:
- [ ] API key is valid (not expired)
- [ ] API key has sufficient credits
- [ ] Network connection allows HTTPS to api.elevenlabs.io
- [ ] No typos in the API key (spaces, quotes, etc.)

**Test Connection**:
```bash
# List available voices (tests API key)
npm run audio:list-voices
```

### Missing Audio Files

**Symptom**: Console warnings about missing .mp3 or .wav files

**Solution**:
```bash
# Validate which files are missing
npm run audio:validate

# Generate missing files
npm run audio:generate
```

## Console Messages

### Expected Messages (Development Mode)

When everything is working correctly:
```
[ElevenLabs] API connection successful ✓
[HomeMenuAudio] Playing English association message
[HomeMenuAudio] Playing Thai association message
[HomeMenuAudio] Audio sequence completed
```

### Warning Messages

Missing API key:
```
[ElevenLabs] API key not configured. Set VITE_ELEVENLABS_API_KEY in .env file.
Audio will fall back to Web Speech API (robotic voice).
```

Missing audio files:
```
[HomeMenuAudio] English association audio not available
Make sure welcome_sangsom_association.mp3 exists in public/sounds/
```

## Production Deployment

### Vercel / Netlify

1. Add environment variable in dashboard:
   - Key: `VITE_ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key

2. Pre-generate all audio files before deploying:
   ```bash
   npm run audio:generate
   git add sounds/
   git commit -m "Add pre-generated audio files"
   ```

3. Deploy normally - audio files will be included in build

### Docker

Add API key to docker-compose.yml:
```yaml
environment:
  - VITE_ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
```

Or pass directly:
```bash
docker run -e VITE_ELEVENLABS_API_KEY=your_key_here ...
```

## Scripts Reference

```bash
# List ElevenLabs voices available with your API key
npm run audio:list-voices

# Validate audio files exist and are properly named
npm run audio:validate

# Generate all audio files (requires API key)
npm run audio:generate

# Generate only welcome screen audio files
npm run audio:generate-welcome
```

## File Locations

```
English-K1Run/
├── .env                          # Your API key (DO NOT commit)
├── .env.example                   # Template for .env
├── sounds/                        # Generated audio files (git-ignored)
│   ├── welcome_evan_intro.mp3
│   ├── welcome_sangsom_association.mp3
│   ├── welcome_sangsom_association_thai.mp3
│   ├── emoji_*.mp3               # 70+ emoji audio files
│   ├── number_*.mp3              # 15 number audio files
│   ├── letter_*.mp3              # 26 letter audio files
│   └── shape_*.mp3               # Shape audio files
├── public/sounds/                 # Alternative location for audio
└── scripts/
    ├── generate-audio.cjs         # Main audio generation script
    └── generate-missing-welcome-audio.cjs  # Welcome audio generator
```

## Cost Considerations

- **ElevenLabs Pricing**: Pay-per-character TTS generation
- **Free Tier**: 10,000 characters/month (enough for testing)
- **Recommendation**: Pre-generate all audio files once, commit to repository
- **Runtime Generation**: Disable in production to avoid API costs

## Support

If you encounter issues:

1. Check browser console (F12) for detailed error messages
2. Verify all files exist: `ls sounds/*.mp3`
3. Test API key: `npm run audio:list-voices`
4. Review this guide's troubleshooting section
5. Check `.env` file is not committed to git (security)

## Related Documentation

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Project Documentation: `DOCS/AUDIO_AND_LOADING_ENHANCEMENTS_PLAN.md`
