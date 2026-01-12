# 🔧 Vercel Audio Troubleshooting Guide

## Issues Fixed

### 1. **Added Comprehensive Debug Logging**

All audio operations now log to console with `[SoundManager]` prefix:

- Audio context initialization
- Context state changes
- File loading attempts
- Playback events
- Errors with full details

### 2. **Fixed Context Resume Bug**

**Before:** `contextResumed` flag prevented re-resumption  
**After:** Checks actual `audioContext.state` every time

### 3. **Added Vercel Configuration**

Created `vercel.json` with:

- Proper MIME types for `.wav` and `.mp3` files
- CORS headers for cross-origin audio
- Cache control for static assets

### 4. **Audio Format Audit (November 2025)**

Fixed file format mismatches:

- Renamed 216 MP3 files from `.wav` to `.mp3` extension
- Updated sound manager to import both formats
- Added proper MIME type handling (`audio/mpeg` for MP3)
- See `AUDIO_FORMAT_AUDIT.md` for full details

### 5. **Added Debug Info API**

New `getAudioDebugInfo()` function shows:

- Audio system enabled status
- Audio context state
- Number of registered audio files
- Cached buffers
- Sample URLs

## How to Debug on Vercel

### Step 1: Open Browser Console

1. Deploy to Vercel
2. Open the game
3. Press `F12` or right-click → "Inspect" → "Console" tab

### Step 2: Click "Test Audio" Button

The game menu now has a "🔊 Test Audio" button that:

- Attempts to play a sound
- Logs full debug info to console

### Step 3: Check Console Output

Look for these log messages:

#### ✅ **Successful Audio Loading:**

```
[SoundManager] Registered 165 audio aliases from 110 files
[SoundManager] Sample URLs: [["1", "/assets/1-B96e3BpP.wav"], ...]
[SoundManager] Audio context created, state: suspended
[SoundManager] playSound called: "tap"
[SoundManager] Resuming suspended audio context...
[SoundManager] Audio context resumed, state: running
[SoundManager] Loading audio: "tap" from /assets/laser-...
[SoundManager] Successfully loaded: "tap"
[SoundManager] Playing sound: "tap"
[Audio Debug] { isEnabled: true, hasContext: true, contextState: "running", ... }
```

#### ❌ **Common Issues:**

**Issue 1: Audio context suspended**

```
[SoundManager] Audio context state: suspended
```

**Fix:** Click anywhere on the page first (user interaction required)

**Issue 2: File not found**

```
[SoundManager] Failed to load audio "tap" from /assets/...: HTTP 404
```

**Fix:** Check Vite build output, ensure files are in `dist/assets/`

**Issue 3: CORS error**

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Fix:** `vercel.json` should fix this. Redeploy.

**Issue 4: No audio context**

```
[SoundManager] Cannot resume: no audio context
```

**Fix:** Browser doesn't support Web Audio API (unlikely) or initialization failed

**Issue 5: Wrong MIME type**

```
Failed to decode audio data
```

**Fix:** `vercel.json` sets correct MIME type. Ensure it's deployed.

## Testing Checklist

- [ ] Build locally: `npm run build`
- [ ] Check `dist/assets/` has `.wav` files
- [ ] Deploy to Vercel
- [ ] Open browser console (F12)
- [ ] Click "Test Audio" button
- [ ] Check console for `[SoundManager]` logs
- [ ] Verify audio context state is "running"
- [ ] Verify audio files load successfully
- [ ] Test actual gameplay audio

## Vercel-Specific Issues

### Browser Autoplay Policy

Modern browsers block audio until user interaction. The game handles this by:

1. Waiting for user to click "Start Race" or "Test Audio"
2. Initializing audio context on first interaction
3. Resuming context if suspended

### Asset URLs

Vite hashes asset filenames during build:

- Local: `1.wav`
- Production: `1-B96e3BpP.wav`

The `import.meta.glob()` handles this automatically.

### CORS

If audio loads locally but fails on Vercel, it's likely CORS. The `vercel.json` adds:

```json
"Access-Control-Allow-Origin": "*"
```

### Build Output

Ensure Vercel build command is:

```json
{
  "buildCommand": "npm run build"
}
```

## Quick Fix Commands

### Rebuild and check output

```bash
npm run build
ls dist/assets/*.wav | wc -l  # Should show ~110 files
```

### Test locally with production build

```bash
npm run build
npm run preview  # Opens http://localhost:4173
```

### Check a specific audio file

```bash
curl -I https://your-app.vercel.app/assets/1-B96e3BpP.wav
# Should return: Content-Type: audio/wav
```

## Expected Console Output

When everything works, you should see:

1. Initial registration: ~165 aliases from ~110 files
2. Context created: state "suspended"
3. On first click: context resumed to "running"
4. Each sound: Loading → Successfully loaded → Playing
5. Debug info shows all green

## Still Not Working?

If audio still doesn't work after these fixes:

1. **Check browser compatibility:**
   - Open `chrome://flags` → Disable "Autoplay policy"
   - Try different browser (Chrome, Firefox, Safari)

2. **Verify Vercel deployment:**
   - Check `vercel.json` is in root directory
   - Redeploy after adding `vercel.json`

3. **Test with fallbacks:**
   - Speech synthesis should work even if WAV files fail
   - Multi-word items use TTS first

4. **Share console logs:**
   - Copy all `[SoundManager]` messages
   - Check Network tab for failed audio requests
   - Look for HTTP error codes

## Additional Debugging

Add this to browser console for real-time audio status:

```javascript
// Log audio state every second
setInterval(() => {
  console.log('Audio Debug:', window.getAudioDebugInfo?.() || 'Function not found')
}, 1000)
```

Or add to `window` object (add to `sound-manager.ts`):

```typescript
if (typeof window !== 'undefined') {
  (window as any).getAudioDebugInfo = getAudioDebugInfo
}
```
