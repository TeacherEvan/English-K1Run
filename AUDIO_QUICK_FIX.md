# Audio Not Working on Vercel? - Quick Checklist

## ✅ Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Verify `dist/assets/` contains ~110 .wav files
- [ ] Commit all changes including `vercel.json`
- [ ] Push to GitHub (if auto-deploy enabled)

## ✅ Post-Deployment Testing

- [ ] Open deployed Vercel app
- [ ] Open browser DevTools Console (F12)
- [ ] Look for `[SoundManager] Registered X audio aliases` message
- [ ] Click "🔊 Test Audio" button in game menu
- [ ] Audio should play AND console shows debug info

## 🔍 What to Look For in Console

### ✅ Success Indicators

```
[SoundManager] Registered 165 audio aliases from 110 files
[SoundManager] Audio context created, state: suspended
[SoundManager] Resuming suspended audio context...
[SoundManager] Audio context resumed, state: running
[SoundManager] Loading audio: "tap" from /assets/laser-...
[SoundManager] Successfully loaded: "tap"
[SoundManager] Playing sound: "tap"
```

### ❌ Problem Indicators

```
[SoundManager] Cannot resume: no audio context
[SoundManager] Failed to load audio "tap": HTTP 404
[SoundManager] No URL found for key: "tap"
Access to fetch ... has been blocked by CORS policy
```

## 🐛 If Audio Still Doesn't Work

### Step 1: Check Audio Context State

Look for: `[SoundManager] Audio context state: ???`

- **"running"** = ✅ Good
- **"suspended"** = ⚠️ Need user interaction (click something first)
- **"closed"** = ❌ Context was closed, page refresh needed
- **Missing** = ❌ Context never created, check console errors

### Step 2: Check File Loading

Look for: `[SoundManager] Loading audio: "tap" from /assets/...`

- If you see this + **"Successfully loaded"** = ✅ Good
- If you see **"Failed to load"** with HTTP 404 = ❌ File not found
- If you see **CORS error** = ❌ Missing/wrong headers

### Step 3: Manual File Check

1. Copy a URL from console (e.g., `/assets/laser-Jv4VYmhR.wav`)
2. Paste in browser: `https://your-app.vercel.app/assets/laser-Jv4VYmhR.wav`
3. Should download/play the file
4. If 404 = Build problem
5. If loads but audio fails = Decode/MIME type problem

### Step 4: Check Debug Info

In console, type:

```javascript
getAudioDebugInfo()
```

Should return:

```javascript
{
  isEnabled: true,
  hasContext: true,
  contextState: "running",
  registeredAliases: 165,
  cachedBuffers: 1,
  sampleAliases: [...]
}
```

Any `false` or missing values = problem found

## 🔧 Common Fixes

### "state: suspended" won't change to "running"

**Fix:** Click anywhere on the page first (autoplay policy)

### "HTTP 404" errors on audio files

**Fix:**

1. Check Vercel build logs
2. Ensure build command is `npm run build`
3. Check `dist/assets/` locally has files

### "CORS policy" errors

**Fix:**

1. Ensure `vercel.json` is in root directory
2. Redeploy (config changes need fresh deploy)
3. Check response headers in Network tab

### "No audio context" or context = null

**Fix:**

1. Check browser compatibility (Chrome/Firefox/Safari)
2. Look for errors during initialization
3. Try incognito mode (extensions might block)

## 📞 Need More Help?

1. **Share console logs:**
   - Copy ALL lines starting with `[SoundManager]`
   - Include any error messages

2. **Share Network tab:**
   - Open DevTools → Network tab
   - Filter by "wav"
   - Screenshot failed requests (red)

3. **Share debug info:**

   ```javascript
   console.log(JSON.stringify(getAudioDebugInfo(), null, 2))
   ```

4. **Browser info:**
   - Browser name and version
   - Operating system
   - Mobile or desktop

## 🎯 Expected Behavior

- **First click anywhere:** Audio context created (state: suspended)
- **Click "Test Audio":** Context resumes (state: running), sound plays
- **During game:** All sounds play immediately
- **Console:** Detailed logs show what's happening

If you see the success pattern in console but DON'T hear audio:

- Check device volume
- Check browser isn't muted
- Check site-specific sound permissions
- Try headphones to rule out speaker issues
