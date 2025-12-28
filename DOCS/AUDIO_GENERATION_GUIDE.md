# Welcome Screen Audio Generation Guide

## Required Audio Files

### 1. `welcome_association.wav`

**Text**: "In association with SANGSOM Kindergarten"
**Voice Profile**: Professional, intellectual, warm adult voice
**Duration**: ~3 seconds
**Tone**: Respectful, educational, clear enunciation
**Recommended Voice**: Male or female professional narrator voice

### 2. `welcome_learning.wav`

**Text**: "Learning through games for everyone!"
**Voice Profile**: Children's choir / group of children (NOT singing)
**Duration**: ~3 seconds
**Tone**: Energetic, joyful, playful, enthusiastic
**Recommended**: 3-5 children voices speaking in unison (like a cheerful classroom chant)

### 3. `welcome_association_thai.wav`

**Text**: Thai translation of the Phase 1 English line
**Voice Profile**: Thai male voice (clear, warm)
**Duration**: ~3 seconds

### 4. `welcome_learning_thai.wav`

**Text**: Thai translation of the Phase 2 English line
**Voice Profile**: Thai male voice (clear, warm)
**Duration**: ~3 seconds

## Audio Specifications

- **Format**: WAV (16-bit or 24-bit PCM)
- **Sample Rate**: 44.1kHz or 48kHz
- **Channels**: Mono or Stereo
- **Bit Depth**: 16-bit minimum
- **File Size**: Target < 500KB per file

## Generation Options

### Option 1: ElevenLabs (Recommended)

Use the existing `scripts/generate-audio.cjs` workflow (it auto-loads `.env`):

- Set `ELEVENLABS_API_KEY`
- Set voice IDs (at minimum): `ELEVENLABS_VOICE_ID_MALE` (Thai fallback) and optionally `ELEVENLABS_VOICE_ID_THAI`
- Provide Thai text explicitly:
  - `WELCOME_ASSOCIATION_THAI_TEXT`
  - `WELCOME_LEARNING_THAI_TEXT`

You can discover voice IDs with:

```bash
npm run audio:list-voices
```

**For welcome_association.wav:**

```javascript
// Use professional voice like "Antoni" or "Arnold"
{
  text: "In association with SANGSOM Kindergarten",
  voice: "Antoni", // or your preferred professional voice
  outputFileName: "welcome_association.wav"
}
```

**For welcome_learning.wav:**

- Generate individual children voices saying the phrase
- Use child-like voices from ElevenLabs library
- Layer 3-5 voices together with slight timing offsets (10-50ms)
- Mix down to single file with audio editing software (Audacity/Adobe Audition)

### Option 2: Manual Recording

1. **welcome_association.wav**: Record professional voiceover
   - Clear, measured pace
   - Slight pause after "association with"
   - Emphasis on "SANGSOM Kindergarten"

2. **welcome_learning.wav**: Record children's group
   - Gather 3-5 children
   - Have them speak together with enthusiasm
   - Multiple takes to get natural, joyful delivery
   - Keep energy high but clear articulation

### Option 3: AI Voice Tools

**Recommended Tools:**

- **ElevenLabs**: Best for professional voice + child voices
- **Play.ht**: Good child voice options
- **Murf.ai**: Professional narration quality
- **Google Cloud Text-to-Speech**: WaveNet voices

## Post-Production

1. **Normalize Audio**: Peak at -3dB to -6dB
2. **Trim Silence**: Remove excess silence at start/end (leave ~100ms)
3. **Fade In/Out**: 50ms fade in, 100ms fade out
4. **EQ (optional)**:
   - Association: Slight bass boost for warmth
   - Learning: Slight treble boost for children's voices
5. **Compression**: Light compression for consistent volume

## File Placement

Place generated files in:

```bash
/sounds/welcome_association.wav
/sounds/welcome_learning.wav
/sounds/welcome_association_thai.wav
/sounds/welcome_learning_thai.wav
```

## Testing Checklist

- [ ] Files load correctly in sound manager
- [ ] Audio plays in sequence without gaps
- [ ] Duration matches timing in WelcomeScreen.tsx (~3s each)
- [ ] Volume levels balanced between both files
- [ ] Clear, intelligible speech
- [ ] Appropriate emotional tone
- [ ] No clipping or distortion
- [ ] Smooth fade in/out

## Integration Notes

The sound manager will automatically index these files:

- Keys: `"welcome_association"`, `"welcome learning"` (normalized)
- Called via: `soundManager.playSound('welcome_association')`
- Fallback: If audio fails/missing, overlays still show and the screen enables "Tap to continue" after a fallback timer (no auto-dismiss)

## Example Audio Editing Workflow (Audacity)

1. Import/Record audio tracks
2. Effect → Normalize (-3dB)
3. Generate → Silence (trim to desired length)
4. Effect → Fade In (50ms)
5. Effect → Fade Out (100ms)
6. File → Export → WAV (16-bit PCM)
7. Verify file size < 500KB

## Quality Assurance

**Association Voice Should:**

- Sound professional and trustworthy
- Have clear pronunciation of "SANGSOM"
- Convey partnership respect
- Not sound robotic or overly formal

**Learning Voice Should:**

- Sound genuinely enthusiastic
- Have multiple children's voices (3-5 ideal)
- Not be singing (speaking/chanting)
- Convey joy and energy
- Be age-appropriate (kindergarten age)

## Alternative Phrases (if needed)

If the exact phrasing needs adjustment for better audio flow:

**Association alternatives:**

- "Presented in partnership with SANGSOM Kindergarten"
- "Proudly partnering with SANGSOM Kindergarten"

**Learning alternatives:**

- "Learning and playing together, for everyone!"
- "Games that teach, fun for everyone!"

> **Note:** If changing phrases, update WelcomeScreen.tsx comments accordingly
